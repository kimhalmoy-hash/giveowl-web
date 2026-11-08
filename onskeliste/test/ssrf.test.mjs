import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { readProduct } from '../lib/fetch-page.mjs';
import { assertPublicUrlShape, classifyUrl, isBlockedIp, SafeUrlError, storedProductUrl } from '../lib/ssrf.mjs';
import { capabilityPaths } from '../lib/tokens.mjs';
import { cleanText } from '../lib/text.mjs';

test('blocks private, loopback, metadata and tricky IP literals', () => {
  for (const input of [
    'http://127.0.0.1/secret',
    'http://127.1/',
    'http://0177.0.0.1/',
    'http://0x7f000001/',
    'http://2130706433/',
    'http://[::1]/',
    'http://[::ffff:7f00:1]/',
    'http://169.254.169.254/latest/meta-data',
    'http://10.0.0.5/',
    'http://192.168.1.1/',
    'http://172.16.0.1/',
    'http://localhost/',
    'http://printer.local/',
    'http://metadata.google.internal/',
    'http://shop.test:8080/',
    'http://user:pass@shop.example/item',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'http://127.0.0.1.nip.io/admin',
  ]) {
    assert.throws(() => assertPublicUrlShape(input), SafeUrlError, input);
  }
  assert.equal(isBlockedIp('::ffff:127.0.0.1'), true);
  assert.equal(isBlockedIp('8.8.8.8'), false);
});

test('stored product URL keeps the caller URL and allows a GiveOwl /go/ path', () => {
  assert.equal(storedProductUrl('https://butikk.example/vare?id=1#fragment'), 'https://butikk.example/vare?id=1');
  assert.equal(storedProductUrl('/go/didriksons/d88d0e11/'), '/go/didriksons/d88d0e11/');
  assert.throws(() => storedProductUrl('/onskeliste/#eier=e_secret'), SafeUrlError);
  assert.throws(() => storedProductUrl('//evil.example/'), SafeUrlError);
});

test('fetched title is sanitized and a redirect to a private address is not requested', async () => {
  const seen = [];
  await assert.rejects(() => readProduct('https://shop.example/parka', {
    lookup: async () => [{ address: '93.184.216.34', family: 4 }],
    request: async (target) => {
      seen.push(target.href);
      return { status: 302, headers: { location: 'http://127.0.0.1/secret' }, body: '' };
    },
  }), (error) => error instanceof SafeUrlError);
  assert.deepEqual(seen, ['https://shop.example/parka']);
});

test('readProduct returns a cleaned title and skips a private image', async () => {
  const meta = await readProduct('https://shop.example/parka', {
    lookup: async (host) => {
      if (host === 'shop.example') return [{ address: '93.184.216.34', family: 4 }];
      return [{ address: '127.0.0.1', family: 4 }];
    },
    request: async () => ({
      status: 200,
      headers: { location: '' },
      body: '<html><head><meta property="og:title" content="Ullgenser &lt;script&gt;x&lt;/script&gt;"><meta property="og:image" content="http://127.0.0.1/a.jpg"></head></html>',
    }),
  });
  assert.equal(meta.title, 'Ullgenser x');
  assert.equal(meta.imageUrl, '');
});

test('a local listener is not contacted for a loopback fetch', async () => {
  let hits = 0;
  const server = createServer((_req, res) => { hits += 1; res.end('secret'); });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  await assert.rejects(() => readProduct(`http://127.0.0.1:${port}/secret`), SafeUrlError);
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
  assert.equal(hits, 0);
});

test('DNS answers that point at a private address are rejected before connect', async () => {
  let requested = 0;
  await assert.rejects(() => classifyUrl('https://shop.example/item', async () => [{ address: '10.1.2.3', family: 4 }]), SafeUrlError);
  await assert.rejects(() => readProduct('https://shop.example/item', {
    lookup: async () => [{ address: '192.168.0.8', family: 4 }],
    request: async () => { requested += 1; return { status: 200, headers: {}, body: '' }; },
  }), SafeUrlError);
  assert.equal(requested, 0);
});

test('cleanText removes markup and capability paths keep the three keys apart', () => {
  assert.equal(cleanText('<b>En tur på kino</b>\n<script>alert(1)</script>', 80), 'En tur på kino alert(1)');
  const paths = capabilityPaths('nb', { editToken: 'e_edit', viewToken: 'v_view', resToken: 'r_res' });
  assert.equal(paths.edit.includes('v_view'), false);
  assert.equal(paths.view.includes('e_edit'), false);
  assert.equal(paths.view.includes('#vis='), true);
  assert.equal(paths.reservation.includes('#res='), true);
  assert.equal(paths.edit.startsWith('/onskeliste/#eier='), true);
  assert.equal(capabilityPaths('en', { viewToken: 'v_view' }).view.startsWith('/wishlist/#vis='), true);
});
