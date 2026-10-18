/* GiveOwl front page renderer. One source for both sides: scripts/bygg-seo.mjs runs it at build time
   (prerendered HTML for SEO and no-JS) and assets/forside.js runs it in the browser for the visitor's
   country, language, today's date and the seasonal theme. Plain ES5, no DOM access. */
(function (G) {
  var R = {};
  // ---------- seasonal theme by date (YYYY-MM-DD, Europe/Oslo) ----------
  // halloween: October. blackweek: Monday before Black Friday through Cyber Monday (wins over Christmas).
  // jul: 1 Nov - 26 Dec outside Black Week. noytral: the rest of the year.
  R.temaFor = function (d) {
    var y = +d.slice(0, 4), m = +d.slice(5, 7), dd = +d.slice(8, 10), t = Date.UTC(y, m - 1, dd);
    var f = new Date(Date.UTC(y, 10, 1)).getUTCDay(), bf = 1 + ((4 - f + 7) % 7) + 21 + 1; // 4th Thursday of November + 1
    if (t >= Date.UTC(y, 10, bf - 4) && t <= Date.UTC(y, 10, bf + 3)) return 'blackweek';
    if (m === 10) return 'halloween';
    if (m === 11 || (m === 12 && dd <= 26)) return 'jul';
    return 'noytral';
  };
  R.TEMAER = ['noytral', 'halloween', 'jul', 'blackweek'];

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function kort(s, n) { s = String(s || '').replace(/\s+/g, ' ').trim(); var a = Array.from(s); return a.length <= n ? s : a.slice(0, n - 1).join('').replace(/[\s,.;:–-]+\S*$/, '') + '…'; }
  function orgNavn(s) { return String(s || '').replace(/\s*\([^)]*\)\s*/g, ' ').trim(); }
  function initialer(s) {
    var w = orgNavn(s).replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean);
    if (!w.length) return '?';
    var a = Array.from(w[0]), b = w[1] ? Array.from(w[1])[0] : (a[1] || '');
    return (a[0] + b).toUpperCase();
  }
  // Arrangørens logo (lastet ned ved bygging til /assets/logos/), vist uendret i en hvit flis. Uten logo: initialer.
  function logoImg(e, cls) {
    if (!e.logo || !/^\/assets\/logos\/[a-z0-9-]+\.(webp|png)(\?v=[a-f0-9]+)?$/.test(e.logo)) return '';
    return '<span class="' + cls + '"><img src="' + esc(e.logo) + '" alt="' + esc(orgNavn(e.arrangor) + ' logo') + '"' + (e.logoW && e.logoH ? ' width="' + (+e.logoW) + '" height="' + (+e.logoH) + '"' : '') + ' loading="lazy" decoding="async"></span>';
  }
  R.logoImg = logoImg;
  function hash(s) { var h = 2166136261; s = orgNavn(s).toLowerCase(); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  // Organizer covers: palette x pattern x angle x initials position, picked deterministically from the organizer name.
  // [from, to, ink]; ink contrast on both stops is >= 3:1 (initials are large bold text).
  var PAL = [['#FFD6A5', '#FF9EAF', '#2B1530'], ['#A0E7E5', '#8FB2FF', '#14213D'], ['#C8F7C5', '#5FD4B4', '#0B3B2E'], ['#FFE29A', '#FFB65C', '#3A2200'],
    ['#E0C3FC', '#9CCBFC', '#24124A'], ['#FBC2EB', '#B39DE0', '#2E1446'], ['#B9FBC0', '#A5F3E4', '#0E3B33'], ['#FFCFD2', '#F1C0E8', '#4A1030'],
    ['#1F2A5C', '#3B5BDB', '#FFFFFF'], ['#5B2A86', '#C0398C', '#FFFFFF'], ['#065F46', '#0F9D6E', '#FFFFFF'], ['#9A3412', '#E2580C', '#FFFFFF'],
    ['#FDE68A', '#FCA5A5', '#3B1D0F'], ['#BAE6FD', '#C4B5FD', '#1E1B4B'], ['#14213D', '#3A4B96', '#FFD23F'], ['#F7931E', '#FFD23F', '#2A1600']];
  var VINKEL = [120, 135, 160, 205];
  R.cover = function (navn) { var h = hash(navn), p = PAL[h % PAL.length]; return { a: p[0], b: p[1], i: p[2], m: (h >>> 4) % 4, pos: (h >>> 6) % 3, v: VINKEL[(h >>> 8) % 4] }; };

  function dagerMellom(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 864e5); }
  function dato(d, loc) { try { return new Intl.DateTimeFormat(loc, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(d + 'T12:00:00Z')); } catch (e) { return d; } }
  function penger(v, cur, loc) { try { return new Intl.NumberFormat(loc, { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(v); } catch (e) { return v + ' ' + cur; } }
  function flertall(v, n, loc) { if (v && typeof v === 'object') { var k = 'other'; try { k = new Intl.PluralRules(loc).select(n); } catch (e) {} v = v[k] || v.other || ''; } return String(v || '').replace('{n}', n); }
  function stor(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }
  function landNavn(cc, o) { if (cc === 'INT') return o.T.verden; try { return new Intl.DisplayNames([o.locale], { type: 'region' }).of(cc) || cc; } catch (e) { return cc; } }
  function aktiv(a) { return a.status === 'aktiv' ? 0 : 1; }
  function medSpons(l) { var sp = l.filter(function (e) { return e.sponset; }).slice(0, 2); return sp.concat(l.filter(function (e) { return sp.indexOf(e) < 0; })); }
  var HALLOWEEN = /hallowe|spook|skrem|skummel|grøss|grusel|gys|horror|pumpkin|gresskar|græskar|pumpa|kurpitsa|kürbis|citrouille|zucca|calabaza|abóbora|dyni/i;
  var BLACKWEEK = /black ?(week|friday|month)|cyber ?monday/i;

  function lister(o) {
    var land = o.land, idag = o.idag;
    var syn = o.alle.filter(function (e) { return (e.land === land || e.land === 'INT') && !e.kreverKjop && e.status !== 'utløpt' && !(e.slutt && e.slutt < idag); });
    var konk = syn.filter(function (e) { return e.type === 'konkurranse'; }).sort(function (a, b) { return aktiv(a) - aktiv(b) || (a.slutt || '9999').localeCompare(b.slutt || '9999') || a.tittel.localeCompare(b.tittel); });
    var jul = syn.filter(function (e) { return e.type === 'julekalender'; }).sort(function (a, b) { return aktiv(a) - aktiv(b) || (a.start || '9999').localeCompare(b.start || '9999') || a.tittel.localeCompare(b.tittel); });
    var ant = {}; konk.forEach(function (e) { if (e.premieVerdi && e.valuta) ant[e.valuta] = (ant[e.valuta] || 0) + 1; });
    var cur = Object.keys(ant).sort(function (a, b) { return ant[b] - ant[a]; })[0];
    var topp = konk.filter(function (e) { return e.premieVerdi && e.valuta === cur; }).sort(function (a, b) { return b.premieVerdi - a.premieVerdi; });
    var hall = konk.filter(function (e) { return (e.tags || []).indexOf('halloween') >= 0 || HALLOWEEN.test(e.tittel + ' ' + e.premie); });
    var bw = konk.filter(function (e) { return (e.tags || []).indexOf('black-friday') >= 0 || BLACKWEEK.test(e.tittel); });
    var uke = konk.filter(function (e) { return e.slutt && dagerMellom(idag, e.slutt) <= 7; }).length;
    return { konk: konk, jul: jul, topp: topp, hall: hall, bw: bw, uke: uke };
  }

  function kortHtml(e, o) {
    var T = o.T, c = R.cover(e.arrangor), logo = logoImg(e, 'fs-logo'), snart = e.type === 'konkurranse' && e.slutt && dagerMellom(o.idag, e.slutt) <= 3;
    var merke = e.sponset ? '<span class="fs-merke fs-ann">' + esc(T.spons) + '</span>' : snart ? '<span class="fs-merke fs-snart">' + esc(T.snart) + '</span>' : e.funnet === o.idag ? '<span class="fs-merke fs-ny">' + esc(T.ny) + '</span>' : '';
    var verdi = e.premieVerdi && e.valuta ? '<span class="fs-verdi">' + esc(penger(e.premieVerdi, e.valuta, o.locale)) + '</span>' : '';
    var tid = e.type === 'julekalender' || e.status === 'kommer' ? (e.start ? T.kommer + ': ' + dato(e.start, o.locale) : T.kommer) : e.slutt ? T.frist + ': ' + dato(e.slutt, o.locale) : '';
    var igjen = '';
    if (e.type === 'konkurranse' && e.slutt && e.status !== 'kommer') { var n = dagerMellom(o.idag, e.slutt); igjen = n <= 0 ? stor(T.idag) : n === 1 ? stor(T.imorgen) : flertall(T.igjen, n, o.locale); }
    return '<a class="fs-kort" href="/e/' + encodeURIComponent(e.id) + '/">' +
      '<div class="fs-cover fs-m' + c.m + (logo ? ' fs-medlogo' : ' fs-pos' + c.pos) + '" style="--ca:' + c.a + ';--cb:' + c.b + ';--ci:' + c.i + ';--cv:' + c.v + 'deg">' + (logo || '<span class="fs-ini" aria-hidden="true">' + esc(initialer(e.arrangor)) + '</span>') + merke + verdi + '</div>' +
      '<div class="fs-kropp"><div class="fs-org" dir="auto">' + (e.land === 'INT' ? '🌍 ' : '') + esc(kort(orgNavn(e.arrangor), 40)) + '</div><h3 dir="auto">' + esc(kort(e.tittel, 72)) + '</h3><p dir="auto">' + esc(kort(e.premie, 110)) + '</p>' +
      '<div class="fs-fot">' + (tid ? '<span class="fs-frist' + (snart ? ' fs-rod' : '') + '">' + esc(tid) + '</span>' : '') + (igjen ? '<span class="fs-igjen">' + esc(igjen) + '</span>' : '') + '</div></div></a>';
  }
  function alleLenke(o, type, n) { return '<a class="fs-alle" href="/browse/?land=' + o.land + '&amp;fane=' + type + '">' + esc(o.T.alle) + ' (' + n + ') ' + (o.lang === 'ar' ? '←' : '→') + '</a>'; }
  function hode(tittel, n, lenke) { return '<div class="fs-hode"><h2>' + tittel + (n != null ? ' <span class="fs-ant">' + n + '</span>' : '') + '</h2>' + (lenke || '') + '</div>'; }

  R.helt = function (o) {
    var T = o.T, L = lister(o), pill;
    if (o.tema === 'halloween') pill = '🎃 ' + esc(T.hall);
    else if (o.tema === 'jul') pill = '🎄 ' + esc(T.jul) + (L.jul.length ? ' · ' + L.jul.length : '');
    else if (o.tema === 'blackweek') pill = '🏷️ Black Week';
    else pill = esc(T.oppdatert.replace('{d}', dato(o.bygget || o.idag, o.locale)));
    return '<span class="fs-etikett"><i aria-hidden="true"></i>' + pill + '</span>';
  };
  R.innhold = function (o) {
    var T = o.T, L = lister(o), K = o.K, h = '', ln = landNavn(o.land, o);
    h += '<div class="fs-land" role="group" aria-label="' + esc(T.land) + '">' + [o.land].concat(K.land.filter(function (x) { return x !== o.land; })).map(function (x) {
      return '<a class="fs-landchip" data-cc="' + x + '" href="/c/' + x.toLowerCase() + '/" aria-pressed="' + (x === o.land) + '">' + (K.flagg[x] || '') + ' ' + esc(landNavn(x, o)) + '</a>'; }).join('') + '</div>';
    var t0 = L.topp[0];
    h += '<div class="fs-tall"><div><b>' + L.konk.length + '</b><span>' + esc(T.konk) + '</span></div>' + (L.jul.length ? '<div><b>' + L.jul.length + '</b><span>' + esc(T.jul) + '</span></div>' : '') +
      '<div><b>' + L.uke + '</b><span>' + esc(T.uke) + '</span></div>' + (t0 ? '<div><b>' + esc(penger(t0.premieVerdi, t0.valuta, o.locale)) + '</b><span>' + esc(T.topp) + '</span></div>' : '') + '</div>';
    var julVist = false, rad = function (l) { return '<div class="fs-rad">' + l.map(function (e) { return kortHtml(e, o); }).join('') + '</div>'; };
    if (o.tema === 'jul' && L.jul.length) { julVist = true; h += '<section class="fs-sesong fs-ses-jul">' + hode('🎄 ' + esc(T.jul), L.jul.length, alleLenke(o, 'julekalender', L.jul.length)) + rad(L.jul.slice(0, 12)) + '</section>'; }
    else if (o.tema === 'halloween' && L.hall.length >= 2) h += '<section class="fs-sesong fs-ses-halloween">' + hode('🎃 ' + esc(T.hall), L.hall.length) + rad(L.hall.slice(0, 12)) + '</section>';
    else if (o.tema === 'blackweek' && L.bw.length >= 2) h += '<section class="fs-sesong fs-ses-blackweek">' + hode('Black Week', L.bw.length) + rad(L.bw.slice(0, 12)) + '</section>';
    var snart = medSpons(L.konk.filter(function (e) { return e.status === 'aktiv'; })).slice(0, 8);
    if (snart.length) h += '<section class="fs-sek">' + hode('🔥 ' + esc(T.slutter.replace('{land}', ln)), null, alleLenke(o, 'konkurranse', L.konk.length)) + '<div class="fs-kgrid">' + snart.map(function (e) { return kortHtml(e, o); }).join('') + '</div></section>';
    if (!julVist && L.jul.length) h += '<section class="fs-sek">' + hode('🎄 ' + esc(T.jul), L.jul.length, alleLenke(o, 'julekalender', L.jul.length)) + rad(L.jul.slice(0, 12)) + '</section>';
    if (L.topp.length >= 3) h += '<section class="fs-sek">' + hode('🏆 ' + esc(T.topp)) + '<p class="fs-under">' + esc(T.topp_u) + '</p><ol class="fs-toppliste">' + L.topp.slice(0, 6).map(function (e, i) {
      return '<li><a class="fs-t5" href="/e/' + encodeURIComponent(e.id) + '/"><span class="fs-rank" aria-hidden="true">' + (i + 1) + '</span><span class="fs-t5t">' + logoImg(e, 'fs-t5l') + '<span class="fs-t5x"><b dir="auto">' + esc(kort(e.tittel, 70)) + '</b><small dir="auto">' + esc(kort(orgNavn(e.arrangor), 40)) + (e.slutt ? ' · ' + esc(T.frist + ': ' + dato(e.slutt, o.locale)) : '') + '</small></span></span><span class="fs-v">' + esc(penger(e.premieVerdi, e.valuta, o.locale)) + '</span></a></li>'; }).join('') + '</ol></section>';
    return h;
  };
  G.GiveOwlForside = R;
})(typeof globalThis !== 'undefined' ? globalThis : this);
