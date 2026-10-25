/* GiveOwl front page, browser side. The page is prerendered at build time for the page language's home country;
   this script re-renders it with assets/forside-render.js for the visitor's country (?land=, the choice saved by the
   browse app in localStorage giveowl.filter.land, or the device locale), today's date and the seasonal theme. */
(function () {
  var R = window.GiveOwlForside, sek = document.getElementById('fsNaa'), dataEl = document.getElementById('fsData');
  if (!R || !sek || !dataEl) return;
  var K; try { K = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var vist = { land: sek.getAttribute('data-land'), lang: sek.getAttribute('data-lang'), tema: sek.getAttribute('data-tema'), dag: sek.getAttribute('data-dag') };
  vist.usa = sek.getAttribute('data-usa') || '';
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
      var r = (m[2] || '').toUpperCase(); if (r && K.land.indexOf(r) >= 0) return r;
      // Countries without their own listings: no nearest-country mapping any more (IE, NZ, AT, CH and BE have their own sections since 2026-10-25); BE falls back to NL or FR by browser language only if there is no BE section in the data.
      var via = r === 'BE' ? belgia(l) : null; if (via && K.land.indexOf(via) >= 0) return via;
      if (m[1].toLowerCase() === 'pt' && r && r !== 'BR') continue; /* pt-PT etc.: Brazilian contests do not apply */ var s = map[m[1].toLowerCase()]; if (s && K.land.indexOf(s) >= 0) return s; }
    return null; }
  function belgia(l) { for (var i = 0; i < l.length; i++) { var p = String(l[i] || '').split('-')[0].toLowerCase(); if (p === 'nl') return 'NL'; if (p === 'fr') return 'FR'; } return null; }
  // Mobile fix 2026-10-25: the browse app saves giveowl.filter.land on EVERY render, also when the country was only the device default
  // (en-US -> US), so a stale filter turned Norwegian visitors into US visitors. Only a country the visitor picked actively counts:
  // giveowl.landValgt = {land, t} is written by a country chip / the US button here and by the country picker in the browse app,
  // and is honoured for 30 days. giveowl.filter.land alone is ignored here (the browse app still uses it for itself).
  function eksplisittLand() { var v = hent('landValgt', null); return v && typeof v.t === 'number' && Date.now() - v.t < 30 * 864e5 && K.land.indexOf(v.land) >= 0 ? v.land : null; }
  function valgtLand() { var q = (new URLSearchParams(location.search).get('land') || '').toUpperCase(); if (K.land.indexOf(q) >= 0) return q;
    var ev = eksplisittLand(); if (ev) return ev;
    // A language page (/nb/, /sv/, /da/, /de/, /fr/, /es/, /it/, /nl/, /pt-br/, /ja/) shows its home country; the device locale must not override it (e.g. an en-GB browser on /nb/).
    var hjem = { nb: 'NO', sv: 'SE', da: 'DK', de: 'DE', fi: 'FI', fr: 'FR', es: 'ES', it: 'IT', nl: 'NL', pl: 'PL', 'pt-BR': 'BR', ja: 'JP' }[document.documentElement.getAttribute('data-sidesprak') || ''];
    if (hjem && K.land.indexOf(hjem) >= 0) return hjem;
    return enhetsLand() || vist.land; }
  // Language pages without listings of their own (nl, fr, pl, it, es, fi and the rest): US contests are not shown by default,
  // only a labelled box with a button; they appear (labelled) when the visitor asks for them (?land=US, the US chip or the button).
  var LOKAL = { en: 1, nb: 1, sv: 1, da: 1, de: 1 };
  function usaValgt() { return (new URLSearchParams(location.search).get('land') || '').toUpperCase() === 'US' || hent('usa', false) === true; }
  function usaModus() { return LOKAL[vil.lang] || vil.land !== 'US' ? '' : usaValgt() ? 'merk' : 'skjul'; }
  function tema() { return document.body.getAttribute('data-tema') || 'noytral'; }
  function tegn() {
    var o = { alle: alle, land: vil.land, lang: vil.lang, locale: K.locale[vil.lang] || vil.lang, T: K.T[vil.lang] || K.T.en, K: K, idag: idag(), tema: tema(), bygget: K.bygget, usa: usaModus() };
    document.getElementById('fsInnhold').innerHTML = R.innhold(o);
    var h = document.getElementById('fsHelt'); if (h) h.innerHTML = R.helt(o);
    vist = { land: o.land, lang: o.lang, tema: o.tema, dag: o.idag, usa: o.usa };
    sek.setAttribute('data-land', o.land); sek.setAttribute('data-lang', o.lang); sek.setAttribute('data-tema', o.tema); sek.setAttribute('data-dag', o.idag);
    if (o.usa) sek.setAttribute('data-usa', o.usa); else sek.removeAttribute('data-usa');
  }
  function medData(fn) { if (alle) return fn();
    if (!henter) henter = fetch('/assets/forside-data.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); }).then(function (d) { alle = d.oppforinger || []; });
    henter.then(fn).catch(function () {}); }
  function oppdater(land, lang) { if (land) vil.land = land; if (lang) vil.lang = lang;
    if (vil.land === vist.land && vil.lang === vist.lang && tema() === vist.tema && idag() === vist.dag && usaModus() === vist.usa) return;
    medData(function () { if (vil.land !== vist.land || vil.lang !== vist.lang || tema() !== vist.tema || idag() !== vist.dag || usaModus() !== vist.usa) tegn(); }); }

  sek.addEventListener('click', function (ev) { var u = ev.target.closest && ev.target.closest('.fs-usa-vis');
    if (u && !(ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button)) { ev.preventDefault(); lagre('usa', true); var fu = hent('filter', {}) || {}; fu.land = 'US'; lagre('filter', fu); lagre('landValgt', { land: 'US', t: Date.now() }); oppdater('US', null); return; }
    var a = ev.target.closest && ev.target.closest('.fs-landchip'); if (!a) return;
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey || ev.button) return; ev.preventDefault();
    var cc = a.getAttribute('data-cc'); if (cc === 'US') lagre('usa', true);
    var f = hent('filter', {}) || {}; f.land = cc; lagre('filter', f); lagre('landValgt', { land: cc, t: Date.now() }); var LS = { NO: 'nb', SE: 'sv', DK: 'da', DE: 'de', FI: 'fi', FR: 'fr', ES: 'es', IT: 'it', NL: 'nl', PL: 'pl', AT: 'de', CH: 'de', BE: 'nl', BR: 'pt-BR', PT: 'pt-BR', JP: 'ja' }[cc]; if (LS && LS !== vist.lang && !(cc === 'BE' && vist.lang === 'fr')) { lagre('lang', LS); location.href = '/' + LS.toLowerCase() + '/?land=' + cc; return; } oppdater(cc, null); });
  document.addEventListener('giveowl:lang', function (ev) { var s = finnSprak(ev.detail && ev.detail.lang); if (s) oppdater(null, s); });
  oppdater(valgtLand(), finnSprak(document.documentElement.getAttribute('lang')) || vist.lang);
  // Tell the country/language banner (assets/site.js) which country this page shows (null while US contests are hidden on a language page).
  window.GiveOwlLand = usaModus() === 'skjul' ? null : vil.land;
  document.dispatchEvent(new CustomEvent('giveowl:land', { detail: { land: window.GiveOwlLand } }));
})();
