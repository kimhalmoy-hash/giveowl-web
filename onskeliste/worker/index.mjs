import { RETENTION_DAYS, handleRequest } from '../lib/http.mjs';
import { createStore } from '../server/store.mjs';
import { createD1Adapter } from './d1.mjs';
import { readProductWorker } from './fetch-product.mjs';

const RATE_PEPPER_FALLBACK = 'giveowl-onskeliste';

function storeFor(env) {
  return createStore(createD1Adapter(env.DB));
}

async function maintain(store) {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  await store.purgeInactive(cutoff);
  await store.purgeRates(Date.now());
}

function context(request, env) {
  return {
    store: storeFor(env),
    fetchPage: (url) => readProductWorker(url),
    clientIp: request.headers.get('cf-connecting-ip') || '0',
    corsOrigins: env.GIVEOWL_CORS_ORIGINS || '',
    pepper: env.GIVEOWL_RATE_PEPPER || RATE_PEPPER_FALLBACK,
  };
}

export default {
  async fetch(request, env, ctx) {
    const store = storeFor(env);
    if (ctx?.waitUntil) ctx.waitUntil(maintain(store).catch(() => {}));
    const response = await handleRequest(request, context(request, env));
    if (response) return response;
    return new Response('Not found', {
      status: 404,
      headers: { 'x-robots-tag': 'noindex, nofollow', 'referrer-policy': 'no-referrer' },
    });
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(maintain(storeFor(env)));
  },
};
