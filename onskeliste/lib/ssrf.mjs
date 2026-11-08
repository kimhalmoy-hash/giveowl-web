import { BlockList, isIP } from 'node:net';
import { lookup as dnsLookup } from 'node:dns/promises';

export class SafeUrlError extends Error {
  constructor(code = 'invalid_url') {
    super(code);
    this.code = code;
  }
}

const v4 = new BlockList();
for (const [addr, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 4],
  ['240.0.0.0', 4],
]) v4.addSubnet(addr, prefix, 'ipv4');
v4.addAddress('255.255.255.255', 'ipv4');

const v6 = new BlockList();
v6.addAddress('::', 'ipv6');
v6.addAddress('::1', 'ipv6');
v6.addSubnet('fc00::', 7, 'ipv6');
v6.addSubnet('fe80::', 10, 'ipv6');
v6.addSubnet('ff00::', 8, 'ipv6');
v6.addSubnet('2001:db8::', 32, 'ipv6');

const BLOCKED_SUFFIX = [
  '.local', '.localhost', '.internal', '.intranet', '.home.arpa', '.lan',
  '.localdomain', '.nip.io', '.sslip.io', '.xip.io', '.localtest.me', '.lvh.me',
];

export function isBlockedIp(raw) {
  let ip = String(raw || '').trim().toLowerCase().replace(/^\[|\]$/g, '').split('%')[0];
  if (!ip) return true;
  const mapped = ipv4FromMapped(ip);
  if (mapped) return v4.check(mapped, 'ipv4');
  const kind = isIP(ip);
  if (kind === 4) return v4.check(ip, 'ipv4');
  if (kind === 6) return v6.check(ip, 'ipv6');
  return true;
}

function ipv4FromMapped(ip) {
  const dotted = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i.exec(ip);
  if (dotted && isIP(dotted[1]) === 4) return dotted[1];
  const hex = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i.exec(ip);
  if (!hex) return '';
  const hi = Number.parseInt(hex[1], 16);
  const lo = Number.parseInt(hex[2], 16);
  if (!Number.isFinite(hi) || !Number.isFinite(lo)) return '';
  return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
}

export function isBlockedHostname(host) {
  const h = String(host || '').replace(/\.+$/, '').toLowerCase();
  if (!h) return true;
  if (h === 'localhost' || h === 'metadata.google.internal' || h === 'metadata.internal') return true;
  for (const suffix of BLOCKED_SUFFIX) {
    if (h.endsWith(suffix)) return true;
  }
  if (/^(?:\d{1,3}\.){3}\d{1,3}\./.test(h)) return true;
  return false;
}

/**
 * Shape check for URLs we store or redirect the browser to.
 * Does not resolve DNS. The server-side fetch uses classifyUrl, which does.
 */
export function assertPublicUrlShape(input, { httpsOnly = false } = {}) {
  let url;
  try { url = new URL(input); } catch { throw new SafeUrlError('invalid_url'); }
  if (url.username || url.password) throw new SafeUrlError('invalid_url');
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new SafeUrlError('invalid_url');
  if (httpsOnly && url.protocol !== 'https:') throw new SafeUrlError('invalid_url');
  const port = url.port ? Number(url.port) : (url.protocol === 'https:' ? 443 : 80);
  if (port !== 80 && port !== 443) throw new SafeUrlError('invalid_url');
  let host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host.length > 253) throw new SafeUrlError('invalid_url');
  if (isIP(host)) {
    if (isBlockedIp(host)) throw new SafeUrlError('invalid_url');
  } else if (isBlockedHostname(host)) {
    throw new SafeUrlError('invalid_url');
  } else if (!host.includes('.')) {
    throw new SafeUrlError('invalid_url');
  }
  url.hash = '';
  url.username = '';
  url.password = '';
  return url;
}

export async function defaultLookup(hostname) {
  return dnsLookup(hostname, { all: true, verbatim: true });
}

/** Resolve and reject any name that points at a private or local address. */
export async function classifyUrl(input, lookup = defaultLookup) {
  const url = assertPublicUrlShape(input);
  let host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  let address = host;
  let family = isIP(host);
  if (!family) {
    let records;
    try { records = await lookup(host); } catch { throw new SafeUrlError('invalid_url'); }
    if (!records?.length) throw new SafeUrlError('invalid_url');
    for (const rec of records) {
      if (isBlockedIp(rec.address)) throw new SafeUrlError('invalid_url');
    }
    address = records[0].address;
    family = records[0].family || isIP(records[0].address);
  }
  return {
    href: url.href,
    hostname: host,
    port: url.port ? Number(url.port) : (url.protocol === 'https:' ? 443 : 80),
    protocol: url.protocol,
    pathname: url.pathname || '/',
    search: url.search || '',
    address,
    family,
  };
}

export function isGiveowlGo(input) {
  if (typeof input !== 'string') return false;
  const raw = input.trim();
  if (raw.startsWith('/go/')) return safeGoPath(raw);
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (host !== 'giveowl.com' && host !== 'www.giveowl.com') return false;
    return safeGoPath(url.pathname);
  } catch { return false; }
}

function safeGoPath(pathname) {
  const path = pathname.split('?')[0];
  return /^\/go\/[a-z0-9][a-z0-9_-]{0,80}(?:\/[a-z0-9_-]{1,80})?\/?$/i.test(path);
}

export function storedProductUrl(input) {
  if (input == null || input === '') return '';
  if (typeof input !== 'string') throw new SafeUrlError('invalid_url');
  const raw = input.trim();
  if (raw.length > 1000) throw new SafeUrlError('invalid_url');
  if (raw.startsWith('/')) {
    const [path, query] = raw.split('#')[0].split('?');
    if (!safeGoPath(path)) throw new SafeUrlError('invalid_url');
    if (query && !/^[A-Za-z0-9&=%._~+-]{0,200}$/.test(query)) throw new SafeUrlError('invalid_url');
    return query ? `${path}?${query}` : path;
  }
  const url = assertPublicUrlShape(raw);
  if (url.href.length > 1000) throw new SafeUrlError('invalid_url');
  return url.href;
}

export function storedImageUrl(input, rights) {
  if (!input || rights === 'none' || rights == null) return { imageUrl: null, imageRights: 'none' };
  if (rights !== 'confirmed' && rights !== 'giveowl') throw new SafeUrlError('invalid_url');
  if (typeof input !== 'string') throw new SafeUrlError('invalid_url');
  const raw = input.trim();
  if (rights === 'giveowl' && raw.startsWith('/')) {
    const path = raw.split('#')[0].split('?')[0];
    if (!/^\/assets\/[a-z0-9._/-]{1,180}$/i.test(path)) throw new SafeUrlError('invalid_url');
    return { imageUrl: path, imageRights: 'giveowl' };
  }
  const url = assertPublicUrlShape(raw, { httpsOnly: true });
  if (url.pathname.toLowerCase().endsWith('.svg')) throw new SafeUrlError('invalid_url');
  return { imageUrl: url.href, imageRights: rights };
}
