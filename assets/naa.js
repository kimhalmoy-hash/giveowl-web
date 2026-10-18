/* GiveOwl landing: "now" section. Contests and advent calendars appear straight away, with no click needed.
   The server prerenders the page language's home country; this script switches to the visitor's saved or device country
   (same storage as the browse app: localStorage giveowl.filter.land) and re-renders when the user picks a country chip. */
(function () {
  var sek = document.getElementById('naa'), dataEl = document.getElementById('naaData');
  if (!sek || !dataEl) return;
  var K; try { K = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var land = sek.getAttribute('data-land'), lang = sek.getAttribute('data-lang'), alle = null, henter = null;

  function hent(k, d) { try { var v = localStorage.getItem('giveowl.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lagre(k, v) { try { localStorage.setItem('giveowl.' + k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function kort(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); var a = Array.from(s); return a.length <= n ? s : a.slice(0, n - 1).join('').replace(/[\s,.;:–-]+\S*$/, '') + '…'; }
  function finnSprak(l) { if (!l) return null; if (K.t[l]) return l; var lo = String(l).toLowerCase();
    for (var k in K.t) if (k.toLowerCase() === lo) return k; var p = lo.split('-')[0]; if (p === 'no' || p === 'nn') p = 'nb';
    for (k in K.t) if (k.toLowerCase().split('-')[0] === p) return k; return null; }
  function enhetsLand() { var l = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en-US'];
    var map = { nb: 'NO', nn: 'NO', no: 'NO', sv: 'SE', da: 'DK', fi: 'FI', de: 'DE', es: 'ES', pt: 'BR', fr: 'FR', it: 'IT', nl: 'NL', pl: 'PL', tr: 'TR', ja: 'JP', ko: 'KR', hi: 'IN', id: 'ID', ar: 'SA' };
    for (var i = 0; i < l.length; i++) { var m = /^([a-z]{2,3})(?:-[A-Za-z]{4})?(?:-([A-Z]{2}))?/i.exec(l[i] || ''); if (!m) continue;
      var r = (m[2] || '').toUpperCase(); if (r && K.land.indexOf(r) >= 0) return r; var s = m[1].toLowerCase(); if (map[s] && K.land.indexOf(map[s]) >= 0) return map[s]; }
    return null; }
  function valgtLand() { var q = (new URLSearchParams(location.search).get('land') || '').toUpperCase(); if (K.land.indexOf(q) >= 0) return q;
    var f = hent('filter', null); if (f && K.land.indexOf(f.land) >= 0) return f.land; return enhetsLand() || land; }
  function idag() { try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo' }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function dato(d) { try { return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')); } catch (e) { return d; } }
  function landNavn(cc) { if (cc === 'INT') return T().verden; try { return new Intl.DisplayNames([lang], { type: 'region' }).of(cc) || cc; } catch (e) { return cc; } }
  function T() { return K.t[lang] || K.t.en; }
  function aktiv(a) { return a.status === 'aktiv' ? 0 : 1; }
  function liste(type) { var d = idag();
    var l = alle.filter(function (e) { return e.type === type && (e.land === land || e.land === 'INT') && !e.kreverKjop && e.status !== 'utløpt' && !(e.slutt && e.slutt < d); });
    if (type === 'julekalender') return l.sort(function (a, b) { return aktiv(a) - aktiv(b) || (a.start || '9999').localeCompare(b.start || '9999') || a.tittel.localeCompare(b.tittel); });
    l.sort(function (a, b) { return aktiv(a) - aktiv(b) || (a.slutt || '9999').localeCompare(b.slutt || '9999') || a.tittel.localeCompare(b.tittel); });
    var sp = l.filter(function (e) { return e.sponset; }).slice(0, 2); return sp.concat(l.filter(function (e) { return sp.indexOf(e) < 0; })); }
  function kortHtml(e) { var t = T();
    var tid = e.status === 'kommer' && e.start ? t.kommer + ': ' + dato(e.start) : e.slutt ? t.frist + ': ' + dato(e.slutt) : '';
    var merk = (e.sponset || e.affiliateUrl) ? '<span class="mini-tag">' + esc(e.affiliateUrl ? t.ann : t.spons) + '</span>' : '';
    return '<a class="mini" href="/e/' + encodeURIComponent(e.id) + '/"><span class="mini-org" dir="auto">' + (e.land !== land ? (K.flagg[e.land] || '') + ' ' : '') + esc(e.arrangor) + merk +
      '</span><b class="mini-t" dir="auto">' + esc(kort(e.tittel, 80)) + '</b><span class="mini-p" dir="auto">' + esc(kort(e.premie, 90)) + '</span>' + (tid ? '<span class="mini-f">' + esc(tid) + '</span>' : '') + '</a>'; }
  function del(type, ikon, navn, klasse) { var l = liste(type); if (!l.length) return '';
    return '<div class="naa-del" data-type="' + type + '"><div class="naa-hode"><h2>' + ikon + ' ' + esc(navn) + ' <span class="naa-ant">' + l.length + '</span></h2><a class="naa-alle" href="/browse/?land=' + land + '&amp;fane=' + type + '">' + esc(T().alle) + ' →</a></div><div class="' + klasse + '">' +
      l.slice(0, K.max[type]).map(kortHtml).join('') + '</div></div>'; }
  function chips() { var box = sek.querySelector('.naa-land'); if (!box) return; var t = T(); box.setAttribute('aria-label', t.land);
    box.innerHTML = [land].concat(K.land.filter(function (x) { return x !== land; })).map(function (x) {
      return '<a class="landchip" data-cc="' + x + '" href="/c/' + x.toLowerCase() + '/" aria-pressed="' + (x === land) + '">' + (K.flagg[x] || '') + ' ' + esc(landNavn(x)) + '</a>'; }).join('');
    box.scrollLeft = 0; }
  function tegn() { var t = T(); document.getElementById('naaInnhold').innerHTML = del('julekalender', '🎄', t.jul, 'naa-rad') + del('konkurranse', '🎁', t.konk, 'naa-grid'); chips();
    sek.setAttribute('data-land', land); sek.setAttribute('data-lang', lang); }
  function medData(fn) { if (alle) return fn(); if (!henter) henter = fetch('/data.json', { cache: 'no-cache' }).then(function (r) { return r.json(); }).then(function (d) { alle = d.oppforinger || []; });
    henter.then(fn).catch(function () {}); }
  // Wanted state is updated at once, so a language event and a country choice that arrive while data.json loads cannot undo each other.
  var vilLand = land, vilLang = lang;
  function bytt(nyLand, nyLang) { if (nyLand) vilLand = nyLand; if (nyLang) vilLang = nyLang;
    medData(function () { if (vilLand === land && vilLang === lang) return; land = vilLand; lang = vilLang; tegn(); }); }

  sek.addEventListener('click', function (ev) { var a = ev.target.closest && ev.target.closest('.landchip'); if (!a) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.button) return; ev.preventDefault(); var cc = a.getAttribute('data-cc');
    var f = hent('filter', {}) || {}; f.land = cc; lagre('filter', f); bytt(cc, null); });
  document.addEventListener('giveowl:lang', function (ev) { var s = finnSprak(ev.detail && ev.detail.lang); if (s) bytt(null, s); });
  var startSprak = finnSprak(document.documentElement.getAttribute('lang')) || lang;
  bytt(valgtLand(), startSprak);
})();
