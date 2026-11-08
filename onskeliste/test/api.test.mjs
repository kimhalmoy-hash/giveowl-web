import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server/dev-server.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');

async function api(base, path, { method = 'GET', token, body } = {}) {
  const headers = {};
  if (token) headers.authorization = `Bearer ${token}`;
  if (body !== undefined) headers['content-type'] = 'application/json';
  const response = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = null;
  if (text) json = JSON.parse(text);
  return { status: response.status, json, headers: response.headers };
}

test('owner, viewer and reservation keys stay separate, and one wish cannot be reserved twice', async () => {
  const app = await startServer({ dbPath: ':memory:' });
  try {
    const created = await api(app.url, '/api/onskeliste/lister', {
      method: 'POST',
      body: { name: 'Mine juleønsker', occasion: 'Jul', lang: 'nb' },
    });
    assert.equal(created.status, 201);
    const { editToken, viewToken, paths, id } = created.json;
    assert.notEqual(editToken, viewToken);
    assert.equal(editToken.startsWith('e_'), true);
    assert.equal(viewToken.startsWith('v_'), true);
    assert.equal(paths.view.includes(editToken), false);
    assert.equal(paths.edit.includes(viewToken), false);
    assert.equal(paths.view.includes('#vis='), true);
    assert.equal(paths.edit.includes('/onskeliste/#eier='), true);

    const textWish = await api(app.url, '/api/onskeliste/onsker', {
      method: 'POST', token: editToken,
      body: { title: 'En tur på kino', source: 'text', note: 'Kveld' },
    });
    assert.equal(textWish.status, 201);

    const shop = await api(app.url, '/api/onskeliste/onsker', {
      method: 'POST', token: editToken,
      body: {
        title: 'Ullgenser', source: 'url', productUrl: 'https://butikk.example/ullgenser?farge=blaa',
        size: 'M', color: 'mørk blå', priceText: '799 kr', priceCheckedOn: '2026-11-08',
        imageUrl: 'https://cdn.example/genser.jpg', imageRights: 'confirmed', mostWanted: true,
      },
    });
    assert.equal(shop.status, 201);
    assert.equal(shop.json.affiliate, false);
    assert.equal(shop.json.productUrl, 'https://butikk.example/ullgenser?farge=blaa');

    const giveowl = await api(app.url, '/api/onskeliste/onsker', {
      method: 'POST', token: editToken,
      body: {
        title: 'Alana Parka', source: 'giveowl', productUrl: '/go/didriksons/d88d0e11/',
        shopName: 'Didriksons', priceText: '2 800 kr', priceCheckedOn: '2026-11-08',
        imageUrl: '/assets/julegave/nattelyst-sovemaske.webp', imageRights: 'giveowl',
      },
    });
    assert.equal(giveowl.status, 201);
    assert.equal(giveowl.json.affiliate, true);
    assert.equal(giveowl.json.source, 'giveowl');

    const rewritten = await api(app.url, '/api/onskeliste/onsker', {
      method: 'POST', token: editToken,
      body: { title: 'Egen lenke', source: 'giveowl', productUrl: 'https://butikk.example/ikke-affiliate' },
    });
    assert.equal(rewritten.status, 201);
    assert.equal(rewritten.json.affiliate, false);
    assert.equal(rewritten.json.source, 'url');
    assert.equal(rewritten.json.productUrl, 'https://butikk.example/ikke-affiliate');

    const owner = await api(app.url, '/api/onskeliste/liste', { token: editToken });
    assert.equal(owner.status, 200);
    assert.equal(owner.json.role, 'owner');
    assert.equal(owner.json.wishes.length, 4);
    assert.equal(JSON.stringify(owner.json).includes('"state"'), false);
    assert.equal(owner.json.wishes.some((wish) => wish.mostWanted), true);

    const viewer = await api(app.url, '/api/onskeliste/liste', { token: viewToken });
    assert.equal(viewer.status, 200);
    assert.equal(viewer.json.wishes.every((wish) => wish.state === 'open'), true);
    assert.equal(viewer.json.viewToken, undefined);
    assert.equal(viewer.json.paths, undefined);

    const wishId = shop.json.id;
    const attempts = await Promise.all(Array.from({ length: 8 }, () => api(app.url, `/api/onskeliste/onsker/${wishId}/reserver`, {
      method: 'POST', token: viewToken,
    })));
    const won = attempts.filter((item) => item.status === 200);
    const lost = attempts.filter((item) => item.status === 409);
    assert.equal(won.length, 1);
    assert.equal(lost.length, 7);
    const reservationToken = won[0].json.reservationToken;
    assert.equal(reservationToken.startsWith('r_'), true);
    assert.notEqual(reservationToken, editToken);
    assert.notEqual(reservationToken, viewToken);
    assert.equal(won[0].json.paths.reservation.includes(editToken), false);
    assert.equal(won[0].json.paths.reservation.includes('#res='), true);

    const after = await api(app.url, '/api/onskeliste/liste', { token: viewToken });
    assert.equal(after.json.wishes.find((wish) => wish.id === wishId).state, 'reserved');
    const ownerAfter = await api(app.url, '/api/onskeliste/liste', { token: editToken });
    assert.equal(JSON.stringify(ownerAfter.json).includes('reserved'), false);
    assert.equal(JSON.stringify(ownerAfter.json).includes(reservationToken), false);

    assert.equal((await api(app.url, '/api/onskeliste/liste', { method: 'DELETE', token: viewToken })).status, 404);
    assert.equal((await api(app.url, `/api/onskeliste/onsker/${wishId}/reserver`, { method: 'POST', token: editToken })).status, 404);
    assert.equal((await api(app.url, '/api/onskeliste/onsker', { method: 'POST', token: reservationToken, body: { title: 'Nei' } })).status, 404);

    const bought = await api(app.url, '/api/onskeliste/reservasjon/kjopt', { method: 'POST', token: reservationToken });
    assert.equal(bought.status, 200);
    assert.equal((await api(app.url, '/api/onskeliste/liste', { token: viewToken })).json.wishes.find((wish) => wish.id === wishId).state, 'bought');
    const released = await api(app.url, '/api/onskeliste/reservasjon/frigjor', { method: 'POST', token: reservationToken });
    assert.equal(released.status, 200);
    assert.equal((await api(app.url, '/api/onskeliste/reservasjon', { token: reservationToken })).status, 404);
    assert.equal((await api(app.url, '/api/onskeliste/liste', { token: viewToken })).json.wishes.find((wish) => wish.id === wishId).state, 'open');

    const again = await api(app.url, `/api/onskeliste/onsker/${wishId}/reserver`, { method: 'POST', token: viewToken });
    assert.equal(again.status, 200);

    const rotated = await api(app.url, '/api/onskeliste/deling/roter', { method: 'POST', token: editToken });
    assert.equal(rotated.status, 200);
    assert.notEqual(rotated.json.viewToken, viewToken);
    assert.equal((await api(app.url, '/api/onskeliste/liste', { token: viewToken })).status, 404);
    assert.equal((await api(app.url, '/api/onskeliste/liste', { token: rotated.json.viewToken })).status, 200);

    const exported = await api(app.url, '/api/onskeliste/eksport', { token: editToken });
    assert.equal(exported.headers.get('content-disposition').includes('onskeliste.json'), true);
    assert.equal(JSON.stringify(exported.json).includes('"state"'), false);
    assert.equal(exported.json.name, 'Mine juleønsker');

    assert.equal((await api(app.url, `/api/onskeliste/onsker/${textWish.json.id}`, { method: 'DELETE', token: editToken })).status, 204);
    assert.equal((await api(app.url, '/api/onskeliste/liste', { method: 'DELETE', token: editToken })).status, 204);
    assert.equal((await api(app.url, '/api/onskeliste/liste', { token: editToken })).status, 404);
    assert.equal((await api(app.url, `/api/onskeliste/onsker/${wishId}/reserver`, { method: 'POST', token: rotated.json.viewToken })).status, 404);

    await app.store.setActivity(id, '2020-01-01T00:00:00.000Z');
    const removed = await app.store.purgeInactive(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
    assert.equal(removed, 0);
  } finally {
    await app.close();
  }
});

test('retention deletes an inactive list, and private URLs cannot be stored or fetched', async () => {
  const app = await startServer({
    dbPath: ':memory:',
    fetchPage: async (url) => {
      if (url.includes('feil')) throw new Error('fetch_failed');
      return { title: 'Parkas <b>test</b>', imageUrl: 'https://cdn.example/p.jpg' };
    },
  });
  try {
    const created = await api(app.url, '/api/onskeliste/lister', { method: 'POST', body: { name: 'Bursdag' } });
    await app.store.setActivity(created.json.id, '2024-01-01T00:00:00.000Z');
    const removed = await app.store.purgeInactive(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());
    assert.equal(removed, 1);
    assert.equal((await api(app.url, '/api/onskeliste/liste', { token: created.json.editToken })).status, 404);

    const fresh = await api(app.url, '/api/onskeliste/lister', { method: 'POST', body: { name: 'Ny' } });
    const blocked = await api(app.url, '/api/onskeliste/onsker', {
      method: 'POST', token: fresh.json.editToken,
      body: { title: 'Hemmelig', productUrl: 'http://127.0.0.1/admin' },
    });
    assert.equal(blocked.status, 400);
    const noRights = await api(app.url, '/api/onskeliste/onsker', {
      method: 'POST', token: fresh.json.editToken,
      body: { title: 'Bilde', productUrl: 'https://butikk.example/a', imageUrl: 'https://cdn.example/a.jpg' },
    });
    assert.equal(noRights.status, 400);
    assert.equal(noRights.json.error, 'rights');

    const fetched = await api(app.url, '/api/onskeliste/hent', {
      method: 'POST', token: fresh.json.editToken, body: { url: 'https://butikk.example/parka' },
    });
    assert.equal(fetched.status, 200);
    assert.equal(fetched.json.title, 'Parkas test');
    assert.equal(fetched.json.sourceUrl, 'https://butikk.example/parka');
    const failed = await api(app.url, '/api/onskeliste/hent', {
      method: 'POST', token: fresh.json.editToken, body: { url: 'https://butikk.example/feil' },
    });
    assert.equal(failed.status, 422);
    assert.equal(failed.json.sourceUrl, 'https://butikk.example/feil');
    const internal = await api(app.url, '/api/onskeliste/hent', {
      method: 'POST', token: fresh.json.editToken, body: { url: 'http://169.254.169.254/' },
    });
    assert.equal(internal.status, 400);
  } finally {
    await app.close();
  }
});

test('creation is rate limited per client', async () => {
  const app = await startServer({ dbPath: ':memory:', limits: { create: 2, fetch: 5, reserve: 5, write: 20, windowMs: 60_000 } });
  try {
    assert.equal((await api(app.url, '/api/onskeliste/lister', { method: 'POST', body: { name: 'En' } })).status, 201);
    assert.equal((await api(app.url, '/api/onskeliste/lister', { method: 'POST', body: { name: 'To' } })).status, 201);
    assert.equal((await api(app.url, '/api/onskeliste/lister', { method: 'POST', body: { name: 'Tre' } })).status, 429);
  } finally {
    await app.close();
  }
});

test('list pages are noindex and absent from the sitemap', () => {
  const sitemap = readFileSync(join(ROOT, 'sitemap.xml'), 'utf8');
  assert.equal(sitemap.includes('/onskeliste'), false);
  assert.equal(sitemap.includes('/wishlist'), false);
  const robots = readFileSync(join(ROOT, 'robots.txt'), 'utf8');
  assert.equal(robots.includes('Disallow: /api/onskeliste/'), true);
  for (const file of ['onskeliste/index.html', 'wishlist/index.html']) {
    const html = readFileSync(join(ROOT, file), 'utf8');
    assert.match(html, /noindex/);
    assert.match(html, /no-referrer/);
  }
  const siteJs = readFileSync(join(ROOT, 'assets/site.js'), 'utf8');
  assert.match(siteJs, /assets\/onskeliste\.js/);
  const sw = readFileSync(join(ROOT, 'sw.js'), 'utf8');
  assert.match(sw, /\/api\/onskeliste/);
});
