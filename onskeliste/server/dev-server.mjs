import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { handleRequest, ratePepper, RETENTION_DAYS } from '../lib/http.mjs';
import { readProduct } from '../lib/fetch-page.mjs';
import { createStore } from './store.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

export function openDatabase(dbPath) {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  const db = new DatabaseSync(dbPath);
  db.exec('PRAGMA foreign_keys = ON');
  db.exec('PRAGMA busy_timeout = 4000');
  if (dbPath !== ':memory:') db.exec('PRAGMA journal_mode = WAL');
  return {
    exec(sql) { db.exec(sql); },
    get(sql, params = []) { return db.prepare(sql).get(...params) ?? null; },
    all(sql, params = []) { return db.prepare(sql).all(...params); },
    run(sql, params = []) {
      const result = db.prepare(sql).run(...params);
      return { changes: Number(result.changes || 0) };
    },
  };
}

function safeFile(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0]);
  if (decoded.includes('\0')) return '';
  const relative = normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const full = resolve(root, `.${relative}`);
  if (full !== root && !full.startsWith(root + '/')) return '';
  if (full.includes(`${'/'}onskeliste${'/'}data${'/'}`) || full.endsWith('.sqlite') || full.includes('/.git/')) return '';
  return full;
}

function serveStatic(root, req, res) {
  const url = new URL(req.url, 'http://127.0.0.1');
  let full = safeFile(root, url.pathname);
  if (!full) {
    res.writeHead(400, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('Bad path');
    return;
  }
  if (existsSync(full) && statSync(full).isDirectory()) full = join(full, 'index.html');
  if (!existsSync(full) || !statSync(full).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex' });
    res.end('Not found');
    return;
  }
  const headers = { 'content-type': MIME[extname(full)] || 'application/octet-stream', 'x-content-type-options': 'nosniff' };
  if (url.pathname.startsWith('/onskeliste') || url.pathname.startsWith('/wishlist') || url.pathname.startsWith('/api/')) {
    headers['x-robots-tag'] = 'noindex, nofollow';
    headers['referrer-policy'] = 'no-referrer';
    headers['cache-control'] = 'no-store';
  }
  res.writeHead(200, headers);
  createReadStream(full).pipe(res);
}

async function toWebRequest(req) {
  const host = req.headers.host || '127.0.0.1';
  const url = new URL(req.url, `http://${host}`);
  const chunks = [];
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    for await (const chunk of req) chunks.push(chunk);
  }
  const body = Buffer.concat(chunks);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value == null) continue;
    if (Array.isArray(value)) value.forEach((item) => headers.append(key, item));
    else headers.set(key, String(value));
  }
  return new Request(url, { method: req.method, headers, body: body.length ? body : undefined });
}

export async function startServer(options = {}) {
  const dbPath = options.dbPath || ':memory:';
  const database = openDatabase(dbPath);
  const store = createStore(database);
  const schemaPath = join(dirname(fileURLToPath(import.meta.url)), 'schema.sql');
  await store.init(readFileSync(schemaPath, 'utf8'));
  const pepper = options.pepper || ratePepper();
  const fetchPage = options.fetchPage || ((target) => readProduct(target));
  const port = options.port ?? 0;
  const host = options.host || '127.0.0.1';
  const root = options.root || ROOT;

  async function maintain() {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
    await store.purgeInactive(cutoff);
    await store.purgeRates(Date.now());
  }
  await maintain();

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname.startsWith('/api/onskeliste')) {
        const request = await toWebRequest(req);
        const response = await handleRequest(request, {
          store,
          fetchPage,
          clientIp: req.socket.remoteAddress || '0',
          limits: options.limits,
          pepper,
          now: options.now,
          corsOrigins: options.corsOrigins,
        });
        const headers = {};
        response.headers.forEach((value, key) => { headers[key] = value; });
        const buf = Buffer.from(await response.arrayBuffer());
        res.writeHead(response.status, headers);
        res.end(buf);
        return;
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('Method not allowed');
        return;
      }
      serveStatic(root, req, res);
    } catch (error) {
      console.error('onskeliste-dev', error && error.code ? error.code : 'error');
      if (!res.headersSent) res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Error');
    }
  });

  await new Promise((resolveListen) => server.listen(port, host, resolveListen));
  const address = server.address();
  const timer = setInterval(() => { maintain().catch(() => {}); }, 60 * 60 * 1000);
  timer.unref?.();
  return {
    server,
    store,
    port: address.port,
    url: `http://${host}:${address.port}`,
    async close() {
      clearInterval(timer);
      await new Promise((resolveClose, rejectClose) => server.close((err) => (err ? rejectClose(err) : resolveClose())));
    },
  };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const port = Number(process.env.PORT || 8787);
  const dbPath = process.env.GIVEOWL_DB || join(ROOT, 'onskeliste', 'data', 'onskeliste.sqlite');
  startServer({ port, dbPath, pepper: process.env.GIVEOWL_RATE_PEPPER || undefined }).then((started) => {
    console.log(`GiveOwl ønskeliste: ${started.url}/onskeliste/`);
    console.log(`Database: ${dbPath}`);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
