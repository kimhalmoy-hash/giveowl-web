/* GiveOwl front page, browser side. The page is prerendered at build time for the page language's home country;
   this script re-renders it with assets/forside-render.js for the visitor's country (?land=, the choice saved by the
   browse app in localStorage giveowl.filter.land, or the device locale), today's date and the seasonal theme. */
(function () {
  var R = window.GiveOwlForside, sek = document.getElementById('fsNaa'), dataEl = document.getElementById('fsData');
  if (!R || !sek || !dataEl) return;
  var K; try { K = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var vist = { land: sek.getAttribute('data-land'), lang: sek.getAttribute('data-lang'), tema: sek.getAttribute('data-tema'), dag: sek.getAttribute('data-dag') };
  var vil = { land: vist.land, lang: vist.lang }, alle = null, henter = null;

  function hent(k, d) { try { var v = localStorage.getItem('giveowl.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function lagre(k, v) { try { localStorage.setItem('giveowl.' + k, JSON.stringify(v)); } catch (e) {} }
  function idag() { try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); } catch (e) { return new Date().toISOString().slice(0, 10); } }
  function finnSprak(l) { if (!l) return null; if (K.T[l]) return l; var lo = String(l).toLowerCase(), k;
    for (k in K.T) if (k.toLowerCase() === lo) return k; var p = lo.split('-')[0]; if (p === 'no' || p === 'nn') p = 'nb';
    for (k in K.T) if (k.toLowerCase().split('-')[0] === p) return k; return null; }
  function enhetsLand() { var l = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en-US'];
    var map = { nb: 'NO', nn: 'NO', no: 'NO', sv: 'SE', da: 'DK', fi: 'FI', de: 'DE', es: 'ES', pt: 'BR', fr: 'FR', it: 'IT', nl: 'NL', pl: 'PL', tr: 'TR', ja: 'JP', ko: 'KR', hi: 'IN', id: 'ID', ar: 'SA' };
    for (var i = 0; i < l.length; i++) { var m = /^([a-z]{2,3})(?:-[A-Za-z]{4})?(?:-([A-Z]{2}))?/i.exec(l[i] || ''); if (!m) continue;
      var r = (m[2] || '').toUpperCase(); if (r && K.land.indexOf(r) >= 0) return r; var s = map[m[1].toLowerCase()]; if (s && K.land.indexOf(s) >= 0) return s; }
    return null; }
  function valgtLand() { var q = (new URLSearchParams(location.search).get('land') || '').toUpperCase(); if (K.land.indexOf(q) >= 0) return q;
    var f = hent('filter', null); if (f && K.land.indexOf(f.land) >= 0) return f.land; return enhetsLand() || vist.land; }
  function tema() { return document.body.getAttribute('data-tema') || 'noytral'; }
  function tegn() {
    var o = { alle: alle, land: vil.land, lang: vil.lang, locale: K.locale[vil.lang] || vil.lang, T: K.T[vil.lang] || K.T.en, K: K, idag: idag(), tema: tema(), bygget: K.bygget };
    document.getElementById('fsInnhold').innerHTML = R.innhold(o);
    var h = document.getElementById('fsHelt'); if (h) h.innerHTML = R.helt(o);
    vist = { land: o.land, lang: o.lang, tema: o.tema, dag: o.idag };
    sek.setAttribute('data-land', o.land); sek.setAttribute('data-lang', o.lang); sek.setAttribute('data-tema', o.tema); sek.setAttribute('data-dag', o.idag);
  }
  function medData(fn) { if (alle) return fn();
    if (!henter) henter = fetch('/assets/forside-data.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { alle = d.oppforinger || []; });
    henter.then(fn).catch(function () {}); }
  function oppdater(land, lang) { if (land) vil.land = land; if (lang) vil.lang = lang;
    if (vil.land === vist.land && vil.lang === vist.lang && tema() === vist.tema && idag() === vist.dag) return;
    medData(function () { if (vil.land !== vist.land || vil.lang !== vist.lang || tema() !== vist.tema || idag() !== vist.dag) tegn(); }); }

  sek.addEventListener('click', function (ev) { var a = ev.target.closest && ev.target.closest('.fs-landchip'); if (!a) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button) return; ev.preventDefault();
    var cc = a.getAttribute('data-cc'), f = hent('filter', {}) || {}; f.land = cc; lagre('filter', f); oppdater(cc, null); });
  document.addEventListener('giveowl:lang', function (ev) { var s = finnSprak(ev.detail && ev.detail.lang); if (s) oppdater(null, s); });
  oppdater(valgtLand(), finnSprak(document.documentElement.getAttribute('lang')) || vist.lang);
})();
