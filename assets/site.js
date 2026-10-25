// giveowl.com: share buttons, badge/widget code generator and offline support (service worker). No tracking.
(function () {
  // Share: native share sheet where available, otherwise copy the link.
  document.querySelectorAll('.delbar .delnativ').forEach(function (b) {
    b.addEventListener('click', function () {
      var bar = b.closest('.delbar'), url = bar.getAttribute('data-url'), tittel = bar.getAttribute('data-tittel');
      if (navigator.share) { navigator.share({ title: tittel, url: url }).catch(function () {}); return; }
      kopier(url, b);
    });
  });
  // Guide share bar: copy link, native share (only where supported), Messenger (only on mobile).
  var mobil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  document.querySelectorAll('.delguide').forEach(function (bar) {
    var url = bar.getAttribute('data-url'), tittel = bar.getAttribute('data-tittel'), status = bar.querySelector('.delstatus');
    var kb = bar.querySelector('.delkopier');
    if (kb) kb.addEventListener('click', function () { kopier(url, kb, status); });
    var db = bar.querySelector('.deldel');
    if (db && navigator.share) { db.hidden = false; db.addEventListener('click', function () { navigator.share({ title: tittel, url: url }).catch(function () {}); }); }
    var mb = bar.querySelector('.delmsg');
    if (mb && mobil) mb.hidden = false;
  });
  function kopier(tekst, knapp, status) {
    var ferdig = function () { if (status) { status.textContent = knapp ? knapp.getAttribute('data-kopiert') : '✓'; setTimeout(function () { status.textContent = ''; }, 1800); } if (!knapp) return; var f = knapp.textContent; knapp.textContent = knapp.getAttribute('data-kopiert') || '✓'; setTimeout(function () { knapp.textContent = f; }, 1800); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(tekst).then(ferdig, reserve); else reserve();
    function reserve() { var ta = document.createElement('textarea'); ta.value = tekst; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); ferdig(); } catch (e) {} ta.remove(); }
  }
  // Copy buttons for code boxes (badge page)
  document.querySelectorAll('[data-kopier]').forEach(function (b) {
    b.addEventListener('click', function () { var el = document.getElementById(b.getAttribute('data-kopier')); if (el) kopier(el.value || el.textContent, b); });
  });
  // Badge page: pick your entry -> badge code links to your own entry page
  var velg = document.getElementById('merkeValg');
  if (velg) {
    var kode = document.getElementById('merkeKode'), vis = document.getElementById('merkeVis'), bilde = velg.getAttribute('data-bilde'), alt = velg.getAttribute('data-alt');
    var oppdater = function () {
      var url = velg.value || velg.getAttribute('data-standard');
      var html = '<a href="' + url + '" title="GiveOwl"><img src="' + bilde + '" alt="' + alt + '" width="200" height="56"></a>';
      kode.value = html; vis.innerHTML = html.replace(/src="https:\/\/giveowl\.com/, 'src="');
    };
    fetch('/data.json').then(function (r) { return r.json(); }).then(function (d) {
      var land = velg.getAttribute('data-land');
      (d.oppforinger || []).filter(function (e) { return e.status !== 'utløpt'; })
        .sort(function (a, b) { return (a.land === land ? 0 : 1) - (b.land === land ? 0 : 1) || a.arrangor.localeCompare(b.arrangor); })
        .forEach(function (e) { var o = document.createElement('option'); o.value = 'https://giveowl.com/e/' + encodeURIComponent(e.id) + '/'; o.textContent = e.arrangor + ' – ' + e.tittel + ' (' + e.land + ')'; velg.appendChild(o); });
    }).catch(function () {});
    velg.addEventListener('change', oppdater); oppdater();
  }
  var wv = document.getElementById('widgetValg');
  if (wv) {
    var wk = document.getElementById('widgetKode'), wf = document.getElementById('widgetVis');
    var wo = function () { var o = wv.options[wv.selectedIndex];
      wk.value = '<iframe src="https://giveowl.com/widget/' + wv.value + '/" title="' + o.getAttribute('data-tittel') + '" width="100%" height="440" style="border:0;max-width:420px" loading="lazy"></iframe>\n<p><a href="' + o.getAttribute('data-hub') + '">' + o.getAttribute('data-lenke') + '</a></p>';
      wf.src = '/widget/' + wv.value + '/'; };
    wv.addEventListener('change', wo); wo();
  }
  // ---------- Country / language suggestion banner (2026-10-25) ----------
  // Small dismissible bar: "You seem to be in X – switch to Y?". Signal: time zone first, then browser language.
  // localStorage only (giveowl.banner), no cookies, no redirect, never for bots, never when the visitor is already in the
  // matching section or has chosen a language/country themselves. UI texts in B below are machine-translated (marked, for native review).
  (function () {
    if (!document.body || /bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(navigator.userAgent || '')) return;
    var p = location.pathname, q = new URLSearchParams(location.search);
    if (q.get('land') || q.get('lang') || /^\/(e|go|widget|og|badge|submit|browse|advertise)\//.test(p)) return;
    function lagret(k) { try { var v = localStorage.getItem('giveowl.' + k); return v == null ? null : JSON.parse(v); } catch (e) { return undefined; } }
    function lagre(k, v) { try { localStorage.setItem('giveowl.' + k, JSON.stringify(v)); } catch (e) {} }
    try { localStorage.setItem('giveowl._t', '1'); localStorage.removeItem('giveowl._t'); } catch (e) { return; } // no storage: cannot remember a choice, so stay quiet
    if (lagret('banner') || lagret('lang')) return;
    // Sections that exist: a country page set (NO/SE/DK/DE own language page; GB/US/AU/CA on the English front page) or a language page.
    var SEK = {
      NO: { land: 'NO', lang: 'nb', url: '/nb/?land=NO' }, SE: { land: 'SE', lang: 'sv', url: '/sv/?land=SE' }, DK: { land: 'DK', lang: 'da', url: '/da/?land=DK' },
      DE: { land: 'DE', lang: 'de', url: '/de/?land=DE' }, GB: { land: 'GB', lang: 'en', url: '/?land=GB' }, US: { land: 'US', lang: 'en', url: '/?land=US' },
      AU: { land: 'AU', lang: 'en', url: '/?land=AU' }, CA: { land: 'CA', lang: 'en', url: '/?land=CA' },
      BR: { land: 'BR', lang: 'pt-br', url: '/pt-br/?land=BR' }, JP: { land: 'JP', lang: 'ja', url: '/ja/?land=JP' }, // BR/JP: language page with its own listings (2026-10-25, wave 3). MX, IN and PH have no listings yet, so they have no section here.
      NL: { lang: 'nl', url: '/nl/' }, FR: { lang: 'fr', url: '/fr/' }, PL: { lang: 'pl', url: '/pl/' }, IT: { lang: 'it', url: '/it/' }, ES: { lang: 'es', url: '/es/' }, FI: { lang: 'fi', url: '/fi/' }
    };
    var VIA = { IE: 'GB', NZ: 'AU', AT: 'DE', CH: 'DE' }; // detected country without its own section -> nearest section
    var TZ = { 'Europe/Oslo': 'NO', 'Europe/Stockholm': 'SE', 'Europe/Copenhagen': 'DK', 'Europe/Berlin': 'DE', 'Europe/Busingen': 'DE', 'Europe/Vienna': 'AT', 'Europe/Zurich': 'CH',
      'Europe/London': 'GB', 'Europe/Belfast': 'GB', 'Europe/Jersey': 'GB', 'Europe/Guernsey': 'GB', 'Europe/Isle_of_Man': 'GB', 'Europe/Dublin': 'IE', 'Europe/Brussels': 'BE',
      'Europe/Amsterdam': 'NL', 'Europe/Paris': 'FR', 'Europe/Warsaw': 'PL', 'Europe/Rome': 'IT', 'Europe/Madrid': 'ES', 'Europe/Helsinki': 'FI', 'Pacific/Auckland': 'NZ', 'Pacific/Chatham': 'NZ', 'Pacific/Honolulu': 'US',
      'Asia/Tokyo': 'JP', 'Asia/Kolkata': 'IN', 'Asia/Calcutta': 'IN', 'Asia/Manila': 'PH' }; // IN, PH (and MX below) are detected but have no section yet: the banner then falls back to the browser language
    var CAZ = /^America\/(Toronto|Vancouver|Edmonton|Winnipeg|Halifax|St_Johns|Regina|Montreal|Moncton|Glace_Bay|Goose_Bay|Whitehorse|Iqaluit|Yellowknife|Dawson|Dawson_Creek|Fort_Nelson|Cambridge_Bay|Rankin_Inlet|Resolute|Swift_Current|Thunder_Bay|Nipigon|Rainy_River|Pangnirtung|Inuvik|Blanc-Sablon|Atikokan|Creston)$/;
    var USZ = /^America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Boise|Detroit|Juneau|Sitka|Nome|Yakutat|Adak|Metlakatla|Menominee|Indiana\/.+|Kentucky\/.+|North_Dakota\/.+)$/;
    var BRZ = /^America\/(Sao_Paulo|Bahia|Fortaleza|Recife|Belem|Manaus|Cuiaba|Campo_Grande|Porto_Velho|Boa_Vista|Rio_Branco|Noronha|Araguaina|Maceio|Santarem|Eirunepe)$/;
    var MXZ = /^America\/(Mexico_City|Cancun|Merida|Monterrey|Chihuahua|Ciudad_Juarez|Hermosillo|Mazatlan|Tijuana|Matamoros|Ojinaga|Bahia_Banderas)$/;
    function norm(x) { var s = String(x || '').replace('_', '-').split('-')[0].toLowerCase(); return /^(nb|nn|no)$/.test(s) ? 'nb' : s; }
    function sideSprak(x) { x = String(x || 'en').toLowerCase(); if (/^pt/.test(x)) return 'pt-br'; if (/^zh/.test(x)) return 'zh-hans'; return norm(x); }
    var sprakListe = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
    function tzLand() { var tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
      if (!tz) return null; if (TZ[tz]) return TZ[tz]; if (/^Australia\//.test(tz)) return 'AU'; if (CAZ.test(tz)) return 'CA'; if (USZ.test(tz)) return 'US'; if (BRZ.test(tz)) return 'BR'; if (MXZ.test(tz)) return 'MX'; return null; }
    function spraakLand() { var i, m, cc, s;
      for (i = 0; i < sprakListe.length; i++) { m = /^([a-z]{2,3})(?:-[A-Za-z]{4})?(?:-([A-Za-z]{2}))?/i.exec(sprakListe[i] || ''); if (!m) continue; cc = (m[2] || '').toUpperCase();
        if (cc === 'BE') { s = belgia(); if (s) return s; } else if (cc && (SEK[cc] || VIA[cc])) return cc; }
      var LS = { nb: 'NO', sv: 'SE', da: 'DK', de: 'DE', nl: 'NL', fr: 'FR', pl: 'PL', it: 'IT', es: 'ES', fi: 'FI', ja: 'JP' };
      for (i = 0; i < sprakListe.length; i++) { if (/^pt(-br)?$/i.test(sprakListe[i] || '')) return 'BR'; /* pt-PT must not be sent to Brazilian contests */ s = LS[norm(sprakListe[i])]; if (s) return s; }
      return null; }
    function belgia() { for (var i = 0; i < sprakListe.length; i++) { var s = norm(sprakListe[i]); if (s === 'nl') return 'NL'; if (s === 'fr') return 'FR'; } return null; }
    var funnet = tzLand(); if (funnet === 'BE') funnet = belgia() || spraakLand();
    if (!funnet) funnet = spraakLand();
    var mal = funnet && (SEK[funnet] ? funnet : VIA[funnet]);
    if (!mal) { funnet = spraakLand(); mal = funnet && (SEK[funnet] ? funnet : VIA[funnet]); } // time zone known but no section there (MX, IN, PH): use the browser language, as before
    if (!mal) return;
    var sek = SEK[mal], sidesprak = sideSprak(document.documentElement.getAttribute('lang') || 'en');
    var forste = norm(sprakListe[0]);
    // Reading a non-English page in the browser's own first language: the visitor has chosen it, do not second-guess.
    if (sidesprak !== 'en' && sidesprak === forste && sek.lang !== sidesprak) return;

    var B = { // MACHINE-TRANSLATED (except en/nb): i = "You seem to be in {X}.", b = "Switch to {Y}", n = "No thanks", v = note when the section is the nearest one, a = aria-label
      en: { i: 'It looks like you are in: {X}.', b: 'Switch to: {Y}', n: 'No thanks', v: 'Giveaway rules often depend on the country, so check each one’s terms.', a: 'Country and language suggestion' },
      nb: { i: 'Du ser ut til å være i {X}.', b: 'Bytt til {Y}', n: 'Nei takk', v: 'Reglene for konkurranser avhenger ofte av land, så sjekk vilkårene i hver enkelt.', a: 'Forslag om land og språk' },
      de: { i: 'Du scheinst dich in diesem Land zu befinden: {X}.', b: 'Wechseln zu: {Y}', n: 'Nein danke', v: 'Die Teilnahmebedingungen hängen oft vom Land ab – bitte jeweils die Bedingungen prüfen.', a: 'Vorschlag zu Land und Sprache' },
      sv: { i: 'Du verkar vara i {X}.', b: 'Byt till {Y}', n: 'Nej tack', v: 'Reglerna för tävlingar beror ofta på land, så kontrollera villkoren för varje tävling.', a: 'Förslag om land och språk' },
      da: { i: 'Du ser ud til at være i {X}.', b: 'Skift til {Y}', n: 'Nej tak', v: 'Reglerne for konkurrencer afhænger ofte af land, så tjek vilkårene for hver enkelt.', a: 'Forslag om land og sprog' },
      nl: { i: 'Je lijkt in {X} te zijn.', b: 'Overschakelen naar {Y}', n: 'Nee, bedankt', v: 'De regels van winacties hangen vaak van het land af, dus controleer telkens de voorwaarden.', a: 'Suggestie voor land en taal' },
      fr: { i: 'Il semble que vous soyez dans ce pays : {X}.', b: 'Passer à : {Y}', n: 'Non merci', v: 'Les règles des jeux-concours dépendent souvent du pays : vérifiez le règlement de chacun.', a: 'Suggestion de pays et de langue' },
      pl: { i: 'Wygląda na to, że jesteś w kraju: {X}.', b: 'Przełącz na: {Y}', n: 'Nie, dziękuję', v: 'Zasady konkursów często zależą od kraju, więc sprawdzaj regulamin każdego z nich.', a: 'Propozycja kraju i języka' },
      it: { i: 'Sembra che tu sia in questo paese: {X}.', b: 'Passa a: {Y}', n: 'No, grazie', v: 'Le regole dei concorsi dipendono spesso dal paese: controlla il regolamento di ciascuno.', a: 'Suggerimento di paese e lingua' },
      es: { i: 'Parece que estás en este país: {X}.', b: 'Cambiar a: {Y}', n: 'No, gracias', v: 'Las bases de los sorteos suelen depender del país: revisa las condiciones de cada uno.', a: 'Sugerencia de país e idioma' },
      fi: { i: 'Näyttää siltä, että olet maassa: {X}.', b: 'Vaihda: {Y}', n: 'Ei kiitos', v: 'Arvontojen säännöt riippuvat usein maasta, joten tarkista kunkin ehdot.', a: 'Maa- ja kielehdotus' },
      'pt-br': { i: 'Parece que você está neste país: {X}.', b: 'Mudar para: {Y}', n: 'Não, obrigado', v: 'As regras dos sorteios costumam depender do país; confira os termos de cada um.', a: 'Sugestão de país e idioma' },
      tr: { i: 'Konumunuz şu ülke gibi görünüyor: {X}.', b: '{Y} bölümüne geç', n: 'Hayır, teşekkürler', v: 'Çekiliş kuralları çoğu zaman ülkeye göre değişir; her birinin koşullarını kontrol edin.', a: 'Ülke ve dil önerisi' },
      ja: { i: '{X}にいらっしゃるようです。', b: '{Y}に切り替える', n: '閉じる', v: '懸賞のルールは国によって異なることが多いため、各条件をご確認ください。', a: '国と言語の提案' },
      ko: { i: '{X}에 계신 것 같습니다.', b: '전환: {Y}', n: '괜찮습니다', v: '경품 행사 규정은 국가에 따라 다른 경우가 많으니 각 약관을 확인하세요.', a: '국가 및 언어 제안' },
      'zh-hans': { i: '您似乎在{X}。', b: '切换到{Y}', n: '不用了', v: '抽奖规则通常因国家而异，请查看各自的条款。', a: '国家和语言建议' },
      hi: { i: 'ऐसा लगता है कि आप {X} में हैं।', b: '{Y} पर जाएँ', n: 'नहीं, धन्यवाद', v: 'प्रतियोगिताओं के नियम अक्सर देश पर निर्भर करते हैं, इसलिए हर एक की शर्तें जाँचें।', a: 'देश और भाषा का सुझाव' },
      id: { i: 'Anda tampaknya berada di {X}.', b: 'Beralih ke {Y}', n: 'Tidak, terima kasih', v: 'Aturan undian sering bergantung pada negara, jadi periksa ketentuan masing-masing.', a: 'Saran negara dan bahasa' },
      ar: { i: 'يبدو أنك في {X}.', b: 'التبديل إلى {Y}', n: 'لا، شكرًا', v: 'تعتمد شروط المسابقات غالبًا على البلد، لذا راجع شروط كل مسابقة.', a: 'اقتراح البلد واللغة' }
    };
    var T = B[sidesprak] || B.en, loc = sidesprak === 'pt-br' ? 'pt-BR' : sidesprak === 'zh-hans' ? 'zh-Hans' : sidesprak;
    function land(cc) { try { return new Intl.DisplayNames([loc], { type: 'region' }).of(cc) || cc; } catch (e) { return cc; } }
    function spraak(c) { try { return new Intl.DisplayNames([c], { type: 'language' }).of(c) || c; } catch (e) { return c; } }
    function cap(s, c) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
    // Current section: page language, and (for the English country sections) the country the page shows.
    function iSeksjonen(vist) {
      if (sek.lang !== 'en') return sidesprak === sek.lang;
      if (sidesprak !== 'en') return false;
      return !!vist && vist === sek.land;
    }
    function sidenLand() { var m = /^\/c\/([a-z]{2})\//.exec(p); if (m) return m[1].toUpperCase();
      var hj = { nb: 'NO', sv: 'SE', da: 'DK', de: 'DE' }[document.documentElement.getAttribute('data-sidesprak') || '']; if (hj) return hj;
      if (typeof window.GiveOwlLand !== 'undefined') return window.GiveOwlLand; var f = document.getElementById('fsNaa'); return f ? f.getAttribute('data-land') : null; }
    var ferdig = false;
    function vis() {
      if (ferdig) return; ferdig = true;
      var vist = sidenLand();
      // An English page whose country is unknown (guides, entries) is not a reason to suggest an English country section.
      if (sek.lang === 'en' && sidesprak === 'en' && !vist) return;
      if (iSeksjonen(vist)) return;
      var navnY = sek.land ? land(sek.land) + ' (' + cap(spraak(sek.lang)) + ')' : cap(spraak(sek.lang));
      var tekst = T.i.replace('{X}', land(funnet)), bytt = T.b.replace('{Y}', navnY);
      var st = document.createElement('style');
      st.textContent = '.go-lb{background:#FFF1C9;color:#1A2140;border-bottom:1px solid #E8D9A8;font:14px/1.4 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:8px 16px;display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:center;text-align:center}' +
        '.go-lb a{color:#1F2A5C;font-weight:700}.go-lb button{font:inherit;background:none;border:1px solid #1F2A5C;color:#1F2A5C;border-radius:99px;padding:3px 12px;cursor:pointer}.go-lb small{flex-basis:100%;opacity:.8}';
      document.head.appendChild(st);
      var bar = document.createElement('div'); bar.className = 'go-lb'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', T.a); bar.setAttribute('dir', document.documentElement.getAttribute('dir') || 'ltr');
      var s1 = document.createElement('span'); s1.textContent = tekst;
      var a = document.createElement('a'); a.href = sek.url; a.textContent = bytt;
      var nei = document.createElement('button'); nei.type = 'button'; nei.textContent = T.n;
      bar.appendChild(s1); bar.appendChild(a); bar.appendChild(nei);
      if (funnet !== mal) { var sm = document.createElement('small'); sm.textContent = T.v; bar.appendChild(sm); }
      a.addEventListener('click', function () { lagre('banner', { v: 'bytt', til: mal }); lagre('lang', sek.lang === 'en' ? 'en' : sek.lang);
        if (sek.land) { var f = lagret('filter') || {}; f.land = sek.land; lagre('filter', f); } });
      nei.addEventListener('click', function () { lagre('banner', { v: 'lukk' }); if (bar.parentNode) bar.parentNode.removeChild(bar); });
      document.body.insertBefore(bar, document.body.firstChild);
    }
    // The front page re-renders for the visitor's country (forside.js); wait for that so "already in the right section" is judged on the final country.
    if (document.getElementById('fsNaa') && typeof window.GiveOwlLand === 'undefined') {
      document.addEventListener('giveowl:land', vis); window.addEventListener('load', function () { setTimeout(vis, 3000); });
    } else vis();
  })();
  // Installable web app + offline: only on https (or localhost)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
})();
