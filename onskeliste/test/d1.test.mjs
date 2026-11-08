import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { handleRequest } from '../lib/http.mjs';
import { createStore } from '../server/store.mjs';
import { createD1Adapter } from '../worker/d1.mjs';
import { readProductWorker } from '../worker/fetch-product.mjs';
import worker from '../worker/index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

function openRaw() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(readFileSync(join(ROOT, 'onskeliste/server/schema.sql'), 'utf8'));
  return db;
}

function asD1(db) {
  return {
    prepare(sql) {
      return {
        bind(...params) {
          return {
            async first() {
              return db.prepare(sql).get(...params) ?? null;
            },
            async all() {
              return { results: db.prepare(sql).all(...params) };
            },
            async run() {
              const result = db.prepare(sql).run(...params);
              return { meta: { changes: Number(result.changes || 0) } };
            },
          };
        },
      };
    },
  };
}

async function call(env, path, { method = 'GET', token, body, origin } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (origin) headers.origin = origin;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const response = await worker.fetch(new Request(`https://giveowl-onskeliste.example${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  }), env, { waitUntil() {} });
  const text = await response.text();
  return { status: response.status, json: text ? JSON.parse(text) : null, headers: response.headers };
}

test('D1 schema matches the Node schema aside from PRAGMA', () => {
  const nodeSchema = readFileSync(join(ROOT, 'onskeliste/server/schema.sql'), 'utf8')
    .replace(/^PRAGMA .*$/m, '')
    .replace(/^--.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  const d1Schema = readFileSync(join(ROOT, 'onskeliste/server/schema.d1.sql'), 'utf8')
    .replace(/^--.*$/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
  assert.equal(d1Schema, nodeSchema);
  const toml = readFileSync(join(ROOT, 'wrangler.toml'), 'utf8');
  assert.match(toml, /name = "giveowl-onskeliste"/);
  assert.match(toml, /binding = "DB"/);
  assert.match(toml, /database_name = "giveowl-onskeliste"/);
  assert.match(toml, /database_id = "6c6de63c-e7b1-48c9-b028-4e639f349703"/);
  assert.doesNotMatch(toml, /account_id\s*=/);
});

test('the Worker entrypoint reserves through the D1 adapter and keeps CORS', async () => {
  const env = { DB: asD1(openRaw()), GIVEOWL_CORS_ORIGINS: 'https://demo.workers.dev' };
  const created = await call(env, '/api/onskeliste/lister', { method: 'POST', body: { name: 'Jul', lang: 'nb' }, origin: 'https://giveowl.com' });
  assert.equal(created.status, 201);
  assert.equal(created.headers.get('access-control-allow-origin'), 'https://giveowl.com');
  assert.match(created.headers.get('x-robots-tag'), /noindex/);
  const edit = created.json.editToken;
  const view = created.json.viewToken;
  const wish = await call(env, '/api/onskeliste/onsker', {
    method: 'POST', token: edit, body: { title: 'Ullgenser', source: 'text' },
  });
  assert.equal(wish.status, 201);
  const attempts = await Promise.all([0, 1, 2, 3].map(() => call(env, `/api/onskeliste/onsker/${wish.json.id}/reserver`, {
    method: 'POST', token: view,
  })));
  assert.equal(attempts.filter((item) => item.status === 200).length, 1);
  assert.equal(attempts.filter((item) => item.status === 409).length, 3);
  const owner = await call(env, '/api/onskeliste/liste', { token: edit });
  assert.equal(JSON.stringify(owner.json).includes('"state"'), false);
  const extra = await call(env, '/api/onskeliste/helse', { origin: 'https://demo.workers.dev' });
  assert.equal(extra.headers.get('access-control-allow-origin'), 'https://demo.workers.dev');
  const evil = await call(env, '/api/onskeliste/helse', { origin: 'https://evil.example' });
  assert.equal(evil.headers.get('access-control-allow-origin'), null);

  const store = createStore(createD1Adapter(env.DB));
  await store.setActivity(created.json.id, '2020-01-01T00:00:00.000Z');
  const removed = await store.purgeInactive(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
  assert.equal(removed, 1);
  assert.equal((await call(env, '/api/onskeliste/liste', { token: edit })).status, 404);
});

test('the Worker product fetch rejects private URLs before connecting', async () => {
  let hits = 0;
  await assert.rejects(() => readProductWorker('http://127.0.0.1/secret', {
    fetch() { hits += 1; return Promise.resolve(new Response('no')); },
  }));
  await assert.rejects(() => readProductWorker('https://shop.example/item', {
    fetch(url) {
      hits += 1;
      assert.equal(url, 'https://shop.example/item');
      return Promise.resolve(new Response(null, { status: 302, headers: { location: 'http://169.254.169.254/latest' } }));
    },
  }));
  assert.equal(hits, 1);
  const page = await readProductWorker('https://shop.example/parka', {
    fetch() {
      return Promise.resolve(new Response('<html><head><meta property="og:title" content="Parkas &lt;b&gt;x&lt;/b&gt;"></head></html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }));
    },
  });
  assert.equal(page.title, 'Parkas x');
});

test('handleRequest still serves the D1-shaped store without the Worker wrapper', async () => {
  const store = createStore(createD1Adapter(asD1(openRaw())));
  const response = await handleRequest(new Request('https://example/api/onskeliste/lister', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'Direkte' }),
  }), { store, fetchPage: async () => ({ title: '', imageUrl: '' }) });
  assert.equal(response.status, 201);
});
