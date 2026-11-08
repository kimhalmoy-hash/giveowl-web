/* GiveOwl ønskeliste: sixth tab + "add to wishlist" on gift cards.
   Keep this file, and the hook at the bottom of assets/site.js, if the
   static HTML is regenerated. Pages that do not load site.js include this
   script directly. */
(function () {
  if (window.__giveowlOnske) return;
  window.__giveowlOnske = true;

  var KEY = 'giveowl.onskelister';
  var API = (window.GIVEOWL_ONSKE_API || '/api/onskeliste').replace(/\/$/, '');

  function nbSide() {
    var lang = (document.documentElement.getAttribute('lang') || '').toLowerCase();
    if (/^(nb|nn|no)(-|$)/.test(lang)) return true;
    var konk = document.querySelector('.f-konk .fane-t');
    var guide = document.querySelector('.f-guide .fane-t');
    return !!(konk && guide && /konkurranser/i.test(konk.textContent || '') && /guider/i.test(guide.textContent || ''));
  }

  var nb = nbSide();
  var T = nb ? {
    tab: 'Ønskeliste',
    tile: 'Lag og del',
    add: 'Legg til i ønskeliste',
    title: 'Legg til i ønskeliste',
    pick: 'Velg liste',
    none: 'Du har ingen lister i denne nettleseren ennå. Skriv et navn, så lages listen her.',
    name: 'Navn på listen',
    namePh: 'Mine juleønsker',
    create: 'Opprett og legg til',
    put: 'Legg til i valgt liste',
    more: 'Lag en ny liste',
    close: 'Lukk',
    ok: 'Lagt til i',
    open: 'Åpne listen',
    note: 'Bildet er det samme som på denne siden og lagres bare som lenke. Butikken eier bildet. Lenken kan være en merket affiliate-lenke (annonse). Vi rangerer ikke ønsker etter provisjon.',
    lost: 'Hvis du mister både denne nettleseren og redigeringslenken, kan listen ikke gjenopprettes.',
    fail: 'Får ikke kontakt med serveren. Ønskelisten kan ikke lagres bare i nettleseren.',
    href: '/onskeliste/',
    ideas: '/julegaveideer/'
  } : {
    tab: 'Wishlist',
    tile: 'Create and share',
    add: 'Add to wishlist',
    title: 'Add to wishlist',
    pick: 'Choose a list',
    none: 'There are no lists in this browser yet. Enter a name and the list is created here.',
    name: 'List name',
    namePh: 'My Christmas wishes',
    create: 'Create and add',
    put: 'Add to selected list',
    more: 'Create a new list',
    close: 'Close',
    ok: 'Added to',
    open: 'Open the list',
    note: 'The picture is the one already shown on this page and is stored only as a link. The shop owns the picture. The link may be a labelled affiliate link (ad). Wishes are not ranked by commission.',
    lost: 'If you lose both this browser and the edit link, the list cannot be recovered.',
    fail: 'The server did not respond. A wishlist cannot be stored only in this browser.',
    href: '/wishlist/',
    ideas: '/christmas-gifts-us/'
  };

  function style() {
    if (document.getElementById('onske-krom')) return;
    var el = document.createElement('style');
    el.id = 'onske-krom';
    el.textContent = '.f-onske .prikk{background:#2DD4BF}.fl-onske{background:#0F766E}' +
      '.gave-wrap{display:flex;flex-direction:column;gap:8px;min-width:0}.gave-wrap>.gave{flex:1}' +
      '.onske-leggtil{appearance:none;font:inherit;font-weight:800;font-size:14px;line-height:1.2;border-radius:999px;border:1px solid #0F766E;background:#F0FDFA;color:#0F766E;padding:10px 12px;cursor:pointer;min-height:44px}' +
      '.onske-leggtil:hover,.onske-leggtil:focus-visible{background:#0F766E;color:#fff}' +
      '.onske-dialog{position:fixed;inset:0;background:rgba(20,33,61,.45);z-index:80;display:grid;place-items:end center;padding:12px}' +
      '.onske-dialog article{background:#FAF7F2;color:#14213D;width:min(440px,100%);border-radius:18px;padding:16px;box-shadow:0 16px 40px rgba(0,0,0,.2);max-height:min(92vh,720px);overflow:auto}' +
      '.onske-dialog h2{margin:0 0 8px;font-size:1.3rem}.onske-dialog p{margin:.4rem 0}' +
      '.onske-dialog label{display:grid;gap:4px;font-weight:700;font-size:14px;margin:8px 0}' +
      '.onske-dialog input,.onske-dialog select{font:inherit;border:1px solid #E8E1D5;border-radius:12px;padding:12px;width:100%;min-height:44px}' +
      '.onske-dialog .rad{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}' +
      '.onske-dialog button{font:inherit;font-weight:800;border-radius:12px;border:0;padding:12px 14px;min-height:44px;cursor:pointer}' +
      '.onske-dialog .prim{background:#F7931E;color:#14213D}.onske-dialog .lukk{background:#fff;border:1px solid #E8E1D5}' +
      '@media (max-width:760px){.fane-liste{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));overflow:visible}.fane{white-space:normal;text-align:center}}';
    document.head.appendChild(el);
  }

  function lists() {
    try {
      var data = JSON.parse(localStorage.getItem(KEY) || '');
      return data && Array.isArray(data.lists) ? data.lists : [];
    } catch (e) { return []; }
  }
  function save(items) {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, lists: items.slice(0, 20) }));
  }
  function remember(list) {
    var items = lists().filter(function (item) { return item.id !== list.id; });
    items.unshift(list);
    save(items);
  }

  function fane() {
    document.querySelectorAll('.fane-liste').forEach(function (ul) {
      if (ul.querySelector('.f-onske')) return;
      var guide = ul.querySelector('.f-guide');
      var guideItem = guide ? guide.parentNode : null;
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.className = 'fane f-onske';
      a.href = T.href;
      if (location.pathname === T.href || location.pathname.indexOf(T.href) === 0) a.setAttribute('aria-current', 'page');
      var prikk = document.createElement('span');
      prikk.className = 'prikk';
      prikk.setAttribute('aria-hidden', 'true');
      var text = document.createElement('span');
      text.className = 'fane-t';
      text.textContent = T.tab;
      a.appendChild(prikk);
      a.appendChild(text);
      li.appendChild(a);
      if (guideItem && guideItem.parentNode === ul) ul.insertBefore(li, guideItem);
      else ul.appendChild(li);
    });
    document.querySelectorAll('.fs-fliser').forEach(function (grid) {
      if (grid.querySelector('.fl-onske')) return;
      var a = document.createElement('a');
      a.className = 'fs-flis fl-onske';
      a.href = T.href;
      var name = document.createElement('span');
      name.className = 'fl-navn';
      name.textContent = T.tab;
      var tall = document.createElement('span');
      tall.className = 'fl-tall';
      tall.setAttribute('aria-hidden', 'true');
      tall.textContent = '★';
      var under = document.createElement('span');
      under.className = 'fl-under';
      under.textContent = T.tile;
      a.appendChild(name);
      a.appendChild(tall);
      a.appendChild(under);
      var guide = grid.querySelector('.fl-guide');
      if (guide) grid.insertBefore(a, guide);
      else grid.appendChild(a);
    });
  }

  function text(node) { return node ? (node.textContent || '').replace(/\s+/g, ' ').trim() : ''; }

  function priceDate() {
    var months = { januar: 1, februar: 2, mars: 3, april: 4, mai: 5, juni: 6, juli: 7, august: 8, september: 9, oktober: 10, november: 11, desember: 12, january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
    var match = /(?:Priser sjekket|Prices checked|Priser tjekket|Priser kontrollerade)\s+(\d{1,2})\.?\s+([A-Za-zæøåÆØÅ]+)\s+(\d{4})/i.exec(document.body.innerText || '');
    if (!match) return '';
    var month = months[(match[2] || '').toLowerCase()];
    if (!month) return '';
    return match[3] + '-' + String(month).padStart(2, '0') + '-' + String(match[1]).padStart(2, '0');
  }

  function productFrom(card) {
    var img = card.querySelector('img');
    var src = img ? (img.getAttribute('src') || '') : '';
    if (src && src.indexOf('https://') !== 0 && src.indexOf('/assets/') !== 0) src = '';
    var shop = text(card.querySelector('.butikk')).replace(/\s*[·•]\s*(Annonse|Ad|Anzeige|Annons)\b.*/i, '').trim();
    var href = card.getAttribute('href') || '';
    return {
      title: text(card.querySelector('b')).slice(0, 160),
      priceText: text(card.querySelector('.pris')).slice(0, 32),
      priceCheckedOn: priceDate(),
      shopName: shop.slice(0, 60),
      productUrl: href,
      imageUrl: src,
      imageRights: src ? 'giveowl' : 'none',
      source: 'giveowl'
    };
  }

  function editPath(list) {
    var base = list.lang === 'en' ? '/wishlist/' : '/onskeliste/';
    return base + '#eier=' + encodeURIComponent(list.editToken);
  }

  async function post(path, token, body) {
    var headers = { 'content-type': 'application/json' };
    if (token) headers.authorization = 'Bearer ' + token;
    var response = await fetch(API + path, { method: 'POST', headers: headers, body: JSON.stringify(body) });
    var json = {};
    try { json = await response.json(); } catch (e) { json = {}; }
    return { status: response.status, json: json };
  }

  var dialog;
  function closeDialog() { if (dialog) { dialog.remove(); dialog = null; } }

  function openDialog(card) {
    closeDialog();
    var product = productFrom(card);
    dialog = document.createElement('div');
    dialog.className = 'onske-dialog';
    dialog.addEventListener('click', function (event) { if (event.target === dialog) closeDialog(); });
    var box = document.createElement('article');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-labelledby', 'onskeTittel');
    var h = document.createElement('h2');
    h.id = 'onskeTittel';
    h.textContent = product.title || T.title;
    var note = document.createElement('p');
    note.textContent = T.note;
    var lost = document.createElement('p');
    lost.textContent = T.lost;
    var status = document.createElement('p');
    status.setAttribute('role', 'status');
    var current = lists();
    var select = document.createElement('select');
    select.setAttribute('aria-label', T.pick);
    current.forEach(function (list) {
      var opt = document.createElement('option');
      opt.value = list.id;
      opt.textContent = list.name;
      select.appendChild(opt);
    });
    var name = document.createElement('input');
    name.maxLength = 80;
    name.required = true;
    name.placeholder = T.namePh;
    name.setAttribute('aria-label', T.name);
    var add = document.createElement('button');
    add.type = 'button';
    add.className = 'prim';
    add.textContent = current.length ? T.put : T.create;
    var create = document.createElement('button');
    create.type = 'button';
    create.className = 'prim';
    create.textContent = T.create;
    var close = document.createElement('button');
    close.type = 'button';
    close.className = 'lukk';
    close.textContent = T.close;
    close.addEventListener('click', closeDialog);

    async function addTo(list) {
      status.textContent = '';
      var saved = await post('/onsker', list.editToken, product);
      if (saved.status === 201 || saved.status === 200) {
        status.textContent = T.ok + ' ' + list.name + '.';
        var link = document.createElement('a');
        link.href = editPath(list);
        link.textContent = T.open;
        status.appendChild(document.createTextNode(' '));
        status.appendChild(link);
        return;
      }
      var code = saved.json && saved.json.error;
      status.textContent = code === 'too_many' ? (nb ? 'Listen er full.' : 'The list is full.') : code === 'invalid_url' ? (nb ? 'Lenken eller bildet ble ikke godtatt.' : 'The link or picture was not accepted.') : T.fail;
    }

    add.addEventListener('click', function () {
      if (!current.length) {
        create.click();
        return;
      }
      var chosen = current.filter(function (list) { return list.id === select.value; })[0];
      if (chosen) addTo(chosen).catch(function () { status.textContent = T.fail; });
    });
    create.addEventListener('click', function () {
      var listName = name.value.trim();
      if (!listName) { name.focus(); return; }
      status.textContent = '';
      post('/lister', '', { name: listName, lang: nb ? 'nb' : 'en' }).then(function (made) {
        if (made.status !== 201) { status.textContent = T.fail; return; }
        var list = { id: made.json.id, name: made.json.name, editToken: made.json.editToken, viewToken: made.json.viewToken, lang: made.json.lang || (nb ? 'nb' : 'en'), savedAt: new Date().toISOString() };
        remember(list);
        current = lists();
        return addTo(list);
      }).catch(function () { status.textContent = T.fail; });
    });

    box.appendChild(h);
    box.appendChild(note);
    box.appendChild(lost);
    if (current.length) {
      var lab = document.createElement('label');
      lab.textContent = T.pick;
      lab.appendChild(select);
      box.appendChild(lab);
      var row = document.createElement('div');
      row.className = 'rad';
      row.appendChild(add);
      row.appendChild(close);
      box.appendChild(row);
      var details = document.createElement('details');
      var summary = document.createElement('summary');
      summary.textContent = T.more;
      details.appendChild(summary);
      details.appendChild(name);
      var row2 = document.createElement('div');
      row2.className = 'rad';
      row2.appendChild(create);
      details.appendChild(row2);
      box.appendChild(details);
    } else {
      var lab2 = document.createElement('label');
      lab2.textContent = T.name;
      lab2.appendChild(name);
      box.appendChild(lab2);
      var row3 = document.createElement('div');
      row3.className = 'rad';
      row3.appendChild(add);
      row3.appendChild(close);
      box.appendChild(row3);
    }
    box.appendChild(status);
    dialog.appendChild(box);
    document.body.appendChild(dialog);
    document.addEventListener('keydown', function esc(event) {
      if (event.key === 'Escape') { closeDialog(); document.removeEventListener('keydown', esc); }
    });
    (current.length ? select : name).focus();
  }

  function gaver() {
    document.querySelectorAll('a.gave[href]').forEach(function (card) {
      if (card.closest('.gave-wrap')) return;
      var wrap = document.createElement('div');
      wrap.className = 'gave-wrap';
      card.parentNode.insertBefore(wrap, card);
      wrap.appendChild(card);
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'onske-leggtil';
      button.textContent = T.add;
      button.addEventListener('click', function () { openDialog(card); });
      wrap.appendChild(button);
    });
  }

  function start() {
    style();
    fane();
    gaver();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
