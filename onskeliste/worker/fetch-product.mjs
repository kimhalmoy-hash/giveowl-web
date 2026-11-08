import { extractImage, extractTitle } from '../lib/html-meta.mjs';
import { assertPublicUrlShape, SafeUrlError } from '../lib/ssrf.mjs';
import { cleanText } from '../lib/text.mjs';

const MAX_BYTES = 400_000;
const MAX_REDIRECTS = 3;

/**
 * Product-page fetch for Workers. Redirects are checked one hop at a time.
 * Private IP literals and internal hostnames are rejected here. Cloudflare
 * also refuses Worker fetches to private networks, which covers a public name
 * that resolves to a private address. The Node server still pins DNS itself.
 */
export async function readProductWorker(rawUrl, deps = {}) {
  const doFetch = deps.fetch || fetch;
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = assertPublicUrlShape(current);
    let response;
    try {
      response = await doFetch(url.href, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'GiveOwlOnskeliste/1.0 (+https://giveowl.com/onskeliste/)',
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'nb,en;q=0.5',
        },
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      throw new SafeUrlError('fetch_failed');
    }
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (hop === MAX_REDIRECTS || !location) throw new SafeUrlError('fetch_failed');
      current = new URL(location, url.href).href;
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new SafeUrlError('fetch_failed');
    const html = await readLimited(response);
    const title = cleanText(extractTitle(html), 160);
    let imageUrl = '';
    const rawImage = extractImage(html).trim();
    if (rawImage && !rawImage.toLowerCase().startsWith('data:')) {
      try {
        const abs = new URL(rawImage, url.href);
        if (abs.protocol === 'https:' && !abs.pathname.toLowerCase().endsWith('.svg')) {
          assertPublicUrlShape(abs.href, { httpsOnly: true });
          imageUrl = abs.href;
        }
      } catch { imageUrl = ''; }
    }
    return { title, imageUrl };
  }
  throw new SafeUrlError('fetch_failed');
}

async function readLimited(response) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BYTES) {
      await reader.cancel();
      throw new SafeUrlError('fetch_failed');
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    all.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(all);
}
