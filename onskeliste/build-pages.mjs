import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COPY } from './copy.mjs';
import { LANG_ORDER, META } from './meta.mjs';
import { LANDINGS_INDEXABLE, PRODUCTION_API, landingRobots } from './seo.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://giveowl.com';

function esc(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function withModes(copy) {
  return {
    ...copy,
    modes: [['text', copy.modeText], ['url', copy.modeUrl], ['giveowl', copy.modeGiveowl]],
  };
}

function publicMeta(meta) {
  return {
    path: meta.path,
    home: meta.home,
    ideas: meta.ideas,
    dir: meta.dir,
    htmlLang: meta.htmlLang,
  };
}

function hreflang() {
  const links = LANG_ORDER.map((code) => {
    const meta = META[code];
    return `<link rel="alternate" hreflang="${esc(meta.hreflang)}" href="${SITE}${meta.path}">`;
  });
  links.push(`<link rel="alternate" hreflang="x-default" href="${SITE}/wishlist/">`);
  return links.join('\n');
}

function tabs(code) {
  const meta = META[code];
  const label = COPY[code].h1;
  const items = meta.tabs.map(([klass, href, text]) => (
    `<li><a class="fane ${klass}" href="${esc(href)}"><span class="prikk" aria-hidden="true"></span><span class="fane-t">${esc(text)}</span></a></li>`
  ));
  const wish = `<li><a class="fane f-onske" href="${esc(meta.path)}" aria-current="page"><span class="prikk" aria-hidden="true"></span><span class="fane-t">${esc(label)}</span></a></li>`;
  const guide = items.findIndex((item) => item.includes('f-guide'));
  if (guide >= 0) items.splice(guide, 0, wish);
  else items.push(wish);
  return items.join('');
}

function page(code) {
  const meta = META[code];
  const copy = COPY[code];
  const robots = landingRobots();
  const gift = copy.ideas ? `<a href="${esc(meta.ideas)}">${esc(copy.ideas)}</a>` : '';
  return `<!doctype html>
<html lang="${esc(meta.htmlLang)}" dir="${esc(meta.dir)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<meta name="robots" content="${robots}">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#1F2A5C">
<link rel="icon" type="image/svg+xml" href="/assets/owl.svg">
<link rel="stylesheet" href="/assets/site.css">
<link rel="stylesheet" href="/onskeliste/app.css">
${hreflang()}
<!-- indexable:${LANDINGS_INDEXABLE ? 'yes' : 'no'} see onskeliste/seo.mjs -->
</head>
<body class="seo">
<header class="topp-smal"><div class="wrap"><nav class="nav"><a class="logo" href="${esc(meta.home)}"><img src="/assets/owl.svg" alt="" width="40" height="40"> <span>Give<b>Owl</b></span></a><div class="navlenker">${gift}</div></nav></div></header>
<nav class="faner" aria-label="${esc(meta.navAria)}"><div class="wrap"><ul class="fane-liste">${tabs(code)}</ul></div></nav>
<main class="side bred">
<div id="app" class="onske-app">
  <h1>${esc(copy.h1)}</h1>
  <p class="onske-lead">${esc(copy.lead)}</p>
  <p><a class="knapp primar" href="#ny">${esc(copy.create)}</a> <a class="knapp dempet" href="#mine">${esc(copy.mine)}</a> <a class="knapp dempet" href="${esc(meta.ideas)}">${esc(copy.ideas)}</a></p>
  <div class="onske-advarsel"><p>${esc(copy.lost)} ${esc(copy.retention)}</p></div>
</div>
<noscript><p>${esc(copy.offline)}</p></noscript>
</main>
<footer class="site"><div class="wrap"><p>${gift}<a href="/privacy/">${esc(copy.policy)}</a><a href="mailto:info@hendtas.com">info@hendtas.com</a></p><p>© 2026 GiveOwl · HENDT AS</p></div></footer>
<script>window.GIVEOWL_ONSKE_API=${JSON.stringify(PRODUCTION_API)};window.GIVEOWL_ONSKE_LANG=${JSON.stringify(code)};</script>
<script src="/onskeliste/i18n.js"></script>
<script src="/onskeliste/app.js" defer></script>
</body>
</html>
`;
}

function writeI18n() {
  const strings = {};
  const meta = {};
  for (const code of LANG_ORDER) {
    strings[code] = withModes(COPY[code]);
    meta[code] = publicMeta(META[code]);
  }
  const body = `window.GIVEOWL_ONSKE_I18N = ${JSON.stringify(strings)};\nwindow.GIVEOWL_ONSKE_META = ${JSON.stringify(meta)};\n`;
  writeFileSync(join(ROOT, 'onskeliste', 'i18n.js'), body);
}

function writeHtml() {
  for (const code of LANG_ORDER) {
    const rel = META[code].path.replace(/^\//, '');
    const file = join(ROOT, rel, 'index.html');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, page(code));
  }
}

function writeChrome() {
  const chrome = {};
  const keys = ['h1', 'tile', 'addButton', 'pick', 'none', 'name', 'namePh', 'createAndAdd', 'put', 'more', 'close', 'addedTo', 'openList', 'pictureNote', 'lost', 'offline', 'full', 'badUrl'];
  for (const code of LANG_ORDER) {
    chrome[code] = { path: META[code].path, ideas: META[code].ideas };
    for (const key of keys) chrome[code][key] = COPY[code][key];
  }
  const file = join(ROOT, 'assets', 'onskeliste.js');
  const source = readFileSync(file, 'utf8');
  const chromeRe = /\/\* GIVEOWL_CHROME_START \*\/[\s\S]*?\/\* GIVEOWL_CHROME_END \*\//;
  const apiRe = /\/\* GIVEOWL_API_START \*\/[\s\S]*?\/\* GIVEOWL_API_END \*\//;
  if (!chromeRe.test(source)) throw new Error('chrome markers missing');
  if (!apiRe.test(source)) throw new Error('api markers missing');
  const block = `/* GIVEOWL_CHROME_START */\nvar GIVEOWL_CHROME = ${JSON.stringify(chrome)};\n/* GIVEOWL_CHROME_END */`;
  const apiBlock = `/* GIVEOWL_API_START */\nif (!window.GIVEOWL_ONSKE_API) window.GIVEOWL_ONSKE_API = ${JSON.stringify(PRODUCTION_API)};\n/* GIVEOWL_API_END */`;
  const next = source.replace(chromeRe, block).replace(apiRe, apiBlock);
  writeFileSync(file, next);
}

function writeSitemap() {
  const file = join(ROOT, 'sitemap.xml');
  let xml = readFileSync(file, 'utf8');
  xml = xml.replace(/\n?<!-- onskeliste-landings:start -->[\s\S]*?<!-- onskeliste-landings:end -->\n?/, '\n');
  if (LANDINGS_INDEXABLE) {
    const urls = LANG_ORDER.map((code) => {
      const meta = META[code];
      const alternates = LANG_ORDER.map((other) => `    <xhtml:link rel="alternate" hreflang="${META[other].hreflang}" href="${SITE}${META[other].path}"/>`).join('\n');
      return `  <url>\n    <loc>${SITE}${meta.path}</loc>\n${alternates}\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}/wishlist/"/>\n  </url>`;
    }).join('\n');
    const block = `<!-- onskeliste-landings:start -->\n${urls}\n<!-- onskeliste-landings:end -->\n`;
    xml = xml.replace('</urlset>', `${block}</urlset>`);
  }
  writeFileSync(file, xml);
}

writeI18n();
writeHtml();
writeChrome();
writeSitemap();
console.log(`landings: ${LANG_ORDER.length}, indexable: ${LANDINGS_INDEXABLE}`);
