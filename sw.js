// GiveOwl service worker: makes giveowl.com installable and lets /browse/ open offline.
// Pages and data.json: network first (always fresh when online), cache as fallback.
// Static assets: cache first, refreshed in the background. No tracking, no push.
const V = 'giveowl-v1';
const KJERNE = ['/browse/', '/browse/index.html', '/browse/config.js', '/browse/i18n.js', '/browse/data.js', '/data.json', '/assets/site.css', '/assets/owl.svg', '/assets/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(KJERNE)).catch(() => {})); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== location.origin) return;
  const statisk = u.pathname.startsWith('/assets/') || u.pathname.startsWith('/og/');
  if (statisk) {
    e.respondWith(caches.open(V).then(c => c.match(r).then(t => { const n = fetch(r).then(s => { if (s.ok) c.put(r, s.clone()); return s; }).catch(() => t); return t || n; })));
    return;
  }
  e.respondWith(fetch(r).then(s => { if (s.ok && (r.mode === 'navigate' || u.pathname === '/data.json' || u.pathname.startsWith('/browse/'))) { const k = s.clone(); caches.open(V).then(c => c.put(r, k)); } return s; })
    .catch(() => caches.match(r, { ignoreSearch: u.pathname === '/data.json' }).then(t => t || (r.mode === 'navigate' ? caches.match('/browse/') : Response.error()))));
});
