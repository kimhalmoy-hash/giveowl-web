import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { pathFor } from '../meta.mjs';

export function newSecret(prefix) {
  const raw = prefix + randomBytes(32).toString('base64url');
  return { raw, hash: hashSecret(raw) };
}

export function newId(prefix) {
  return prefix + '_' + randomBytes(12).toString('base64url');
}

export function hashSecret(raw) {
  return createHash('sha256').update(String(raw)).digest('hex');
}

export function tokenKind(raw) {
  if (typeof raw !== 'string') return '';
  if (!/^[evr]_[A-Za-z0-9_-]{40,90}$/.test(raw)) return '';
  return raw[0];
}

/** Compare two hex hashes without short-circuiting on the first difference. */
export function hashEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length || ba.length === 0) return false;
  return timingSafeEqual(ba, bb);
}

export function capabilityPaths(lang, parts) {
  const base = pathFor(lang);
  const out = {};
  if (parts.editToken) out.edit = base + '#eier=' + encodeURIComponent(parts.editToken);
  if (parts.viewToken) out.view = base + '#vis=' + encodeURIComponent(parts.viewToken);
  if (parts.resToken) out.reservation = base + '#res=' + encodeURIComponent(parts.resToken);
  return out;
}
