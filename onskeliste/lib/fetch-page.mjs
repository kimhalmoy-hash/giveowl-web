import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import { classifyUrl, SafeUrlError } from './ssrf.mjs';
import { cleanText } from './text.mjs';

const MAX_BYTES = 400_000;
const TIMEOUT_MS = 5000;
const MAX_REDIRECTS = 3;

function attr(tag, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'=<>\`]+))`, 'i');
  const match = re.exec(tag);
  if (!match) return '';
  return match[2] ?? match[3] ?? match[4] ?? '';
}

export function metaContent(html, key) {
  const slice = html.slice(0, 150_000);
  const re = /<meta\b[^>]*>/gi;
  let match;
  while ((match = re.exec(slice))) {
    const tag = match[0];
    const prop = (attr(tag, 'property') || attr(tag, 'name')).toLowerCase();
    if (prop === key) return attr(tag, 'content');
  }
  return '';
}

export function extractTitle(html) {
  for (const key of ['og:title', 'twitter:title']) {
    const value = metaContent(html, key);
    if (value) return value;
  }
  const match = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html.slice(0, 150_000));
  return match ? match[1] : '';
}

export function extractImage(html) {
  return metaContent(html, 'og:image') || metaContent(html, 'twitter:image');
}

export function defaultRequest(target) {
  return new Promise((resolve, reject) => {
    const lib = target.protocol === 'https:' ? https : http;
    const req = lib.request({
      host: target.address,
      family: target.family,
      servername: target.hostname,
      port: target.port,
      method: 'GET',
      path: `${target.pathname || '/'}${target.search || ''}`,
      headers: {
        Host: target.hostname,
        'User-Agent': 'GiveOwlOnskeliste/1.0 (+https://giveowl.com/onskeliste/)',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nb,en;q=0.5',
        'Accept-Encoding': 'identity',
        Connection: 'close',
      },
      timeout: TIMEOUT_MS,
      rejectUnauthorized: true,
    }, (res) => {
      const chunks = [];
      let size = 0;
      let failed = false;
      res.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_BYTES) {
          failed = true;
          req.destroy();
          reject(new SafeUrlError('fetch_failed'));
          return;
        }
        chunks.push(chunk);
      });
      res.on('end', () => {
        if (failed) return;
        let buf = Buffer.concat(chunks);
        const encoding = String(res.headers['content-encoding'] || '');
        if (/gzip/i.test(encoding)) {
          try { buf = zlib.gunzipSync(buf); } catch { /* keep the raw bytes */ }
        }
        resolve({
          status: res.statusCode || 0,
          headers: { location: res.headers.location || '' },
          body: buf.slice(0, MAX_BYTES).toString('utf8'),
        });
      });
    });
    req.on('timeout', () => {
      req.destroy();
      reject(new SafeUrlError('fetch_failed'));
    });
    req.on('error', () => reject(new SafeUrlError('fetch_failed')));
    req.end();
  });
}

/**
 * Fetch a public product page and return a sanitized title plus an image candidate.
 * Redirects are checked one hop at a time. The caller's original URL is not rewritten.
 */
export async function readProduct(rawUrl, deps = {}) {
  const lookup = deps.lookup;
  const request = deps.request || defaultRequest;
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const target = await classifyUrl(current, lookup);
    const res = await request(target);
    if ([301, 302, 303, 307, 308].includes(res.status)) {
      if (hop === MAX_REDIRECTS || !res.headers.location) throw new SafeUrlError('fetch_failed');
      current = new URL(res.headers.location, target.href).href;
      continue;
    }
    if (res.status < 200 || res.status >= 300) throw new SafeUrlError('fetch_failed');
    const html = String(res.body || '');
    const title = cleanText(extractTitle(html), 160);
    let imageUrl = '';
    const rawImage = extractImage(html).trim();
    if (rawImage && !rawImage.toLowerCase().startsWith('data:')) {
      try {
        const abs = new URL(rawImage, target.href);
        if (abs.protocol === 'https:' && !abs.pathname.toLowerCase().endsWith('.svg')) {
          await classifyUrl(abs.href, lookup);
          imageUrl = abs.href;
        }
      } catch { imageUrl = ''; }
    }
    return { title, imageUrl };
  }
  throw new SafeUrlError('fetch_failed');
}
