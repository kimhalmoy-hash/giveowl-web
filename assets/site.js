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
  // Installable web app + offline: only on https (or localhost)
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
  }
})();
