import { createHash, randomBytes } from 'node:crypto';
import { cleanDate, cleanText } from './text.mjs';
import { capabilityPaths, hashSecret, newId, newSecret, tokenKind } from './tokens.mjs';
import { isGiveowlGo, SafeUrlError, storedImageUrl, storedProductUrl } from './ssrf.mjs';

export const RETENTION_DAYS = 365;
export const MAX_WISHES = 80;

export const DEFAULT_LIMITS = {
  create: 10,
  fetch: 20,
  reserve: 40,
  write: 120,
  windowMs: 60 * 60 * 1000,
  maxWishes: MAX_WISHES,
};

const LIMIT = {
  name: 80,
  occasion: 60,
  title: 160,
  note: 400,
  size: 40,
  color: 40,
  price: 32,
  shop: 60,
};

function securityHeaders(extra = {}) {
  return {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'x-robots-tag': 'noindex, nofollow',
    ...extra,
  };
}

function json(status, body, extra) {
  return new Response(JSON.stringify(body), { status, headers: securityHeaders(extra) });
}

function empty(status) {
  return new Response(null, { status, headers: securityHeaders() });
}

async function readJson(request) {
  const len = Number(request.headers.get('content-length') || 0);
  if (len > 20_000) return { error: 'too_large' };
  const text = await request.text();
  if (text.length > 20_000) return { error: 'too_large' };
  if (!text) return { value: {} };
  try {
    const value = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'invalid_field' };
    return { value };
  } catch {
    return { error: 'invalid_field' };
  }
}

function bearer(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(\S+)$/.exec(header);
  if (!match) return '';
  return tokenKind(match[1]) ? match[1] : '';
}

function rateBucket(pepper, action, ip) {
  return createHash('sha256').update(`${pepper}|${action}|${ip || '0'}`).digest('hex');
}

function wishSource(productUrl, requested) {
  if (!productUrl) return { source: 'text', affiliate: 0 };
  if (requested === 'giveowl' && isGiveowlGo(productUrl)) return { source: 'giveowl', affiliate: 1 };
  return { source: 'url', affiliate: 0 };
}

function parseWish(input, { partial = false } = {}) {
  const title = cleanText(input.title, LIMIT.title);
  if (!partial && !title) return { error: 'invalid_field' };
  if (input.title != null && !title) return { error: 'invalid_field' };
  const note = input.note == null ? null : cleanText(input.note, LIMIT.note, { multiline: true });
  const size = input.size == null ? null : cleanText(input.size, LIMIT.size);
  const color = input.color == null ? null : cleanText(input.color, LIMIT.color);
  const priceText = input.priceText == null ? null : cleanText(input.priceText, LIMIT.price);
  const shopName = input.shopName == null ? null : cleanText(input.shopName, LIMIT.shop);
  const priceCheckedOn = cleanDate(input.priceCheckedOn == null ? '' : input.priceCheckedOn);
  if (priceCheckedOn === undefined) return { error: 'invalid_field' };
  let productUrl = '';
  try {
    productUrl = storedProductUrl(input.productUrl || '');
  } catch {
    return { error: 'invalid_url' };
  }
  const { source, affiliate } = wishSource(productUrl, input.source);
  let image;
  try {
    const rights = input.imageUrl ? (input.imageRights || 'none') : 'none';
    image = storedImageUrl(input.imageUrl || '', rights);
  } catch {
    return { error: 'invalid_url' };
  }
  if (input.imageUrl && image.imageRights === 'none') return { error: 'rights' };
  const mostWanted = input.mostWanted ? 1 : 0;
  return {
    value: {
      title,
      note: note || null,
      size: size || null,
      color: color || null,
      priceText: priceText || null,
      priceCheckedOn,
      shopName: shopName || null,
      productUrl: productUrl || null,
      source,
      affiliate,
      imageUrl: image.imageUrl,
      imageRights: image.imageRights,
      mostWanted,
    },
  };
}

function wishBody(id, value) {
  return {
    id,
    title: value.title,
    note: value.note,
    size: value.size,
    color: value.color,
    priceText: value.priceText,
    priceCheckedOn: value.priceCheckedOn,
    mostWanted: value.mostWanted === 1,
    quantity: 1,
    source: value.source,
    productUrl: value.productUrl,
    affiliate: value.affiliate === 1,
    shopName: value.shopName,
    imageUrl: value.imageUrl,
    imageRights: value.imageRights,
  };
}

function publicWish(row, { owner }) {
  const wish = {
    id: row.id,
    title: row.title,
    note: row.note,
    size: row.size,
    color: row.color,
    priceText: row.price_text,
    priceCheckedOn: row.price_checked_on,
    mostWanted: row.most_wanted === 1,
    quantity: 1,
    source: row.source,
    productUrl: row.product_url,
    affiliate: row.affiliate === 1,
    shopName: row.shop_name,
    imageUrl: row.image_url,
    imageRights: row.image_rights,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (!owner) wish.state = row.state;
  return wish;
}

function staleBefore(now) {
  return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
}

export async function handleRequest(request, ctx) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith('/api/onskeliste')) return null;
  const path = url.pathname.replace(/\/+$/, '') || '/api/onskeliste';
  const limits = { ...DEFAULT_LIMITS, ...(ctx.limits || {}) };
  const now = (ctx.now ? ctx.now() : new Date());
  const nowIso = now.toISOString();
  const pepper = ctx.pepper || 'giveowl-onskeliste';
  const store = ctx.store;

  if (request.method === 'GET' && path === '/api/onskeliste/helse') {
    return json(200, { ok: true });
  }

  const ip = ctx.clientIp || '0';
  const gate = async (action, limit) => {
    const bucket = rateBucket(pepper, action, ip);
    const result = await store.rateLimit(bucket, limit, limits.windowMs, now.getTime());
    if (!result.ok) return json(429, { error: 'rate_limited' });
    return null;
  };

  try {
    if (request.method === 'POST' && path === '/api/onskeliste/lister') {
      const limited = await gate('create', limits.create);
      if (limited) return limited;
      const body = await readJson(request);
      if (body.error) return json(body.error === 'too_large' ? 413 : 400, { error: body.error === 'too_large' ? 'invalid_field' : body.error });
      const name = cleanText(body.value.name, LIMIT.name);
      if (!name) return json(400, { error: 'name_required' });
      const occasion = cleanText(body.value.occasion || '', LIMIT.occasion);
      const lang = body.value.lang === 'en' ? 'en' : 'nb';
      const edit = newSecret('e_');
      const view = newSecret('v_');
      const id = newId('l');
      await store.createList({
        id, name, occasion: occasion || null, lang,
        editHash: edit.hash, viewToken: view.raw, viewHash: view.hash, now: nowIso,
      });
      const paths = capabilityPaths(lang, { editToken: edit.raw, viewToken: view.raw });
      return json(201, {
        id, name, occasion: occasion || null, lang,
        editToken: edit.raw, viewToken: view.raw, paths,
        retentionDays: RETENTION_DAYS,
      });
    }

    if (request.method === 'POST' && path === '/api/onskeliste/hent') {
      const token = bearer(request);
      if (tokenKind(token) !== 'e') return json(404, { error: 'not_found' });
      const limited = await gate('fetch', limits.fetch);
      if (limited) return limited;
      const owner = await store.listByEdit(hashSecret(token));
      if (!owner) return json(404, { error: 'not_found' });
      const body = await readJson(request);
      if (body.error) return json(400, { error: 'invalid_field' });
      let sourceUrl = '';
      try { sourceUrl = storedProductUrl(body.value.url || ''); } catch { return json(400, { error: 'invalid_url' }); }
      if (!sourceUrl || sourceUrl.startsWith('/')) return json(400, { error: 'invalid_url' });
      if (isGiveowlGo(sourceUrl)) return json(422, { error: 'giveowl_link', sourceUrl });
      try {
        const meta = await ctx.fetchPage(sourceUrl);
        let imageUrl = null;
        if (meta.imageUrl) {
          try { imageUrl = storedImageUrl(meta.imageUrl, 'confirmed').imageUrl; } catch { imageUrl = null; }
        }
        return json(200, {
          title: cleanText(meta.title || '', LIMIT.title),
          imageUrl,
          sourceUrl,
        });
      } catch {
        return json(422, { error: 'fetch_failed', sourceUrl });
      }
    }

    const token = bearer(request);
    const kind = tokenKind(token);
    if (!kind) return json(404, { error: 'not_found' });
    const hash = hashSecret(token);

    if (kind === 'e') {
      if (request.method === 'GET' && path === '/api/onskeliste/liste') {
        const list = await store.listByEdit(hash);
        if (!list) return json(404, { error: 'not_found' });
        await store.touch(list.id, nowIso, staleBefore(now));
        const wishes = (await store.wishesForList(list.id)).map((row) => publicWish(row, { owner: true }));
        return json(200, {
          role: 'owner',
          list: {
            id: list.id, name: list.name, occasion: list.occasion, lang: list.lang,
            createdAt: list.created_at, activityAt: list.activity_at, retentionDays: RETENTION_DAYS,
          },
          viewToken: list.view_token,
          paths: capabilityPaths(list.lang, { editToken: token, viewToken: list.view_token }),
          wishes,
        });
      }
      if (request.method === 'GET' && path === '/api/onskeliste/eksport') {
        const list = await store.listByEdit(hash);
        if (!list) return json(404, { error: 'not_found' });
        const wishes = (await store.wishesForList(list.id)).map((row) => publicWish(row, { owner: true }));
        const body = {
          name: list.name,
          occasion: list.occasion,
          lang: list.lang,
          exportedAt: nowIso,
          note: list.lang === 'en'
            ? 'Reservations are left out of this file so surprises stay in the view link.'
            : 'Reservasjoner er ikke med i denne filen, slik at overraskelser blir igjen på visningslenken.',
          wishes,
        };
        return json(200, body, { 'content-disposition': 'attachment; filename="onskeliste.json"' });
      }
      if (request.method === 'DELETE' && path === '/api/onskeliste/liste') {
        const limited = await gate('write', limits.write);
        if (limited) return limited;
        const ok = await store.deleteList(hash);
        return ok ? empty(204) : json(404, { error: 'not_found' });
      }
      if (request.method === 'POST' && path === '/api/onskeliste/deling/roter') {
        const limited = await gate('write', limits.write);
        if (limited) return limited;
        const list = await store.listByEdit(hash);
        if (!list) return json(404, { error: 'not_found' });
        const view = newSecret('v_');
        const ok = await store.rotateView(hash, view.raw, view.hash, nowIso);
        if (!ok) return json(404, { error: 'not_found' });
        return json(200, {
          viewToken: view.raw,
          paths: capabilityPaths(list.lang, { editToken: token, viewToken: view.raw }),
        });
      }
      const wishMatch = /^\/api\/onskeliste\/onsker(?:\/([A-Za-z0-9_-]+))?$/.exec(path);
      if (wishMatch && request.method === 'POST' && !wishMatch[1]) {
        const limited = await gate('write', limits.write);
        if (limited) return limited;
        const body = await readJson(request);
        if (body.error) return json(400, { error: 'invalid_field' });
        const parsed = parseWish(body.value);
        if (parsed.error) return json(parsed.error === 'rights' ? 400 : 400, { error: parsed.error });
        const id = newId('w');
        const saved = await store.addWish(hash, { ...parsed.value, id, now: nowIso }, limits.maxWishes);
        if (!saved.ok) return json(saved.error === 'too_many' ? 400 : 404, { error: saved.error });
        return json(201, wishBody(id, parsed.value));
      }
      if (wishMatch && wishMatch[1] && (request.method === 'PATCH' || request.method === 'DELETE')) {
        const limited = await gate('write', limits.write);
        if (limited) return limited;
        const wishId = wishMatch[1];
        if (request.method === 'DELETE') {
          const saved = await store.deleteWish(hash, wishId, nowIso);
          return saved.ok ? empty(204) : json(404, { error: 'not_found' });
        }
        const body = await readJson(request);
        if (body.error) return json(400, { error: 'invalid_field' });
        const parsed = parseWish(body.value);
        if (parsed.error) return json(400, { error: parsed.error });
        const saved = await store.updateWish(hash, wishId, { ...parsed.value, now: nowIso });
        if (!saved.ok) return json(404, { error: 'not_found' });
        return json(200, wishBody(wishId, parsed.value));
      }
      return json(404, { error: 'not_found' });
    }

    if (kind === 'v') {
      const reserveMatch = /^\/api\/onskeliste\/onsker\/([A-Za-z0-9_-]+)\/reserver$/.exec(path);
      if (request.method === 'GET' && path === '/api/onskeliste/liste') {
        const list = await store.listByView(hash);
        if (!list) return json(404, { error: 'not_found' });
        await store.touch(list.id, nowIso, staleBefore(now));
        const wishes = (await store.wishesForList(list.id)).map((row) => publicWish(row, { owner: false }));
        return json(200, {
          role: 'viewer',
          list: { name: list.name, occasion: list.occasion, lang: list.lang },
          wishes,
        });
      }
      if (reserveMatch && request.method === 'POST') {
        const limited = await gate('reserve', limits.reserve);
        if (limited) return limited;
        const res = newSecret('r_');
        const saved = await store.reserve(hash, reserveMatch[1], res.hash, nowIso);
        if (!saved.ok) return json(saved.error === 'conflict' ? 409 : 404, { error: saved.error });
        const list = await store.listByView(hash);
        const lang = list?.lang || 'nb';
        return json(200, {
          state: 'reserved',
          wishId: reserveMatch[1],
          reservationToken: res.raw,
          paths: capabilityPaths(lang, { resToken: res.raw }),
        });
      }
      return json(404, { error: 'not_found' });
    }

    if (kind === 'r') {
      if (request.method === 'GET' && path === '/api/onskeliste/reservasjon') {
        const row = await store.reservation(hash);
        if (!row) return json(404, { error: 'not_found' });
        return json(200, {
          wishId: row.id,
          title: row.title,
          state: row.state,
          productUrl: row.product_url,
          shopName: row.shop_name,
          listName: row.list_name,
          lang: row.lang,
        });
      }
      if (request.method === 'POST' && path === '/api/onskeliste/reservasjon/kjopt') {
        const limited = await gate('reserve', limits.reserve);
        if (limited) return limited;
        const saved = await store.markBought(hash, nowIso);
        return saved.ok ? json(200, { state: 'bought' }) : json(404, { error: 'not_found' });
      }
      if (request.method === 'POST' && path === '/api/onskeliste/reservasjon/frigjor') {
        const limited = await gate('reserve', limits.reserve);
        if (limited) return limited;
        const saved = await store.release(hash, nowIso);
        return saved.ok ? json(200, { state: 'open' }) : json(404, { error: 'not_found' });
      }
      return json(404, { error: 'not_found' });
    }

    return json(404, { error: 'not_found' });
  } catch (error) {
    if (error instanceof SafeUrlError) return json(400, { error: 'invalid_url' });
    console.error('onskeliste', error && error.code ? error.code : 'error');
    return json(500, { error: 'server' });
  }
}

export function ratePepper() {
  return randomBytes(16).toString('hex');
}
