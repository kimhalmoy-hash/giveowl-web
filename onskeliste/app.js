(function () {
  var KEY = 'giveowl.onskelister';
  var RES = 'giveowl.reservasjoner';
  var API = (window.GIVEOWL_ONSKE_API || '/api/onskeliste').replace(/\/$/, '');
  var root = document.getElementById('app');
  var code = window.GIVEOWL_ONSKE_LANG || 'nb';
  var I18N = window.GIVEOWL_ONSKE_I18N || {};
  var META = (window.GIVEOWL_ONSKE_META || {})[code] || {};
  var T = I18N[code] || I18N.nb || I18N.en || {};
  var lang = code;
  var ideas = META.ideas || META.home || '/';
  var basePath = META.path || '/onskeliste/';

  var ERR = {
    name_required: T.required, invalid_field: T.bad, invalid_url: T.badUrl, fetch_failed: T.fetchFail,
    giveowl_link: T.giveowlFetch, rights: T.rightsErr, too_many: T.full, conflict: T.taken,
    rate_limited: T.rate, not_found: T.notFound, offline: T.offline, server: T.server
  };

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || ''); } catch (e) { return fallback; }
  }
  function lists() {
    var data = read(KEY, null);
    return data && Array.isArray(data.lists) ? data.lists : [];
  }
  function writeLists(items) { localStorage.setItem(KEY, JSON.stringify({ v: 1, lists: items.slice(0, 20) })); }
  function remember(list) {
    var items = lists().filter(function (item) { return item.id !== list.id; });
    items.unshift(list);
    writeLists(items);
  }
  function forget(id) { writeLists(lists().filter(function (item) { return item.id !== id; })); }
  function reservations() {
    var data = read(RES, null);
    return data && typeof data === 'object' ? data : {};
  }
  function rememberRes(wishId, token) {
    var data = reservations();
    data[wishId] = token;
    localStorage.setItem(RES, JSON.stringify(data));
  }

  function h(tag, attrs, kids) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value == null || value === false) return;
      if (key === 'class') node.className = value;
      else if (key.indexOf('on') === 0) node.addEventListener(key.slice(2), value);
      else node.setAttribute(key, value === true ? '' : value);
    });
    (kids || []).forEach(function (kid) {
      if (kid == null || kid === false) return;
      node.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
    });
    return node;
  }
  function p(text, cls) { return h('p', { class: cls || '' }, [text]); }
  function btn(label, cls, onclick) { return h('button', { type: 'button', class: cls, onclick: onclick }, [label]); }
  function field(label, input) { return h('label', {}, [label, input]); }
  function input(attrs) { return h('input', attrs); }

  async function copy(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); return true; }
    } catch (e) { /* fallback below */ }
    var area = h('textarea', { style: 'position:fixed;opacity:0' }, []);
    area.value = text;
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    area.remove();
    return ok;
  }
  function absolute(path) { return new URL(path, location.origin).href; }
  function message(code) { return ERR[code] || T.server; }

  async function call(path, opts) {
    opts = opts || {};
    var headers = {};
    if (opts.token) headers.authorization = 'Bearer ' + opts.token;
    if (opts.body !== undefined) headers['content-type'] = 'application/json';
    var response;
    try {
      response = await fetch(API + path, { method: opts.method || 'GET', headers: headers, body: opts.body === undefined ? undefined : JSON.stringify(opts.body) });
    } catch (e) { return { status: 0, json: { error: 'offline' } }; }
    if (response.status === 204) return { status: 204, json: {} };
    var json = {};
    try { json = await response.json(); } catch (err) { json = {}; }
    return { status: response.status, json: json, headers: response.headers };
  }

  function route() {
    var hash = (location.hash || '').replace(/^#/, '');
    var eq = hash.indexOf('=');
    if (eq < 0) return { name: hash || 'home', token: '' };
    return { name: hash.slice(0, eq), token: decodeURIComponent(hash.slice(eq + 1)) };
  }
  function go(hash) { location.hash = hash; }

  function shopLink(url) {
    if (!url) return null;
    var href = url.charAt(0) === '/' ? url : url;
    return h('a', { class: 'knapp dempet', href: href, target: '_blank', rel: 'noreferrer noopener', referrerpolicy: 'no-referrer' }, [T.shop]);
  }
  function picture(wish) {
    if (!wish.imageUrl) return h('div', { class: 'onske-uten', 'aria-hidden': 'true' }, ['🎁']);
    if (!/^https:\/\//.test(wish.imageUrl) && wish.imageUrl.indexOf('/assets/') !== 0) return h('div', { class: 'onske-uten', 'aria-hidden': 'true' }, ['🎁']);
    return h('img', { class: 'onske-bilde', src: wish.imageUrl, alt: '', referrerpolicy: 'no-referrer' });
  }
  function priceLine(wish) {
    if (!wish.priceText) return '';
    return wish.priceText + ' · ' + T.priceHint + (wish.priceCheckedOn ? ' ' + wish.priceCheckedOn : '');
  }

  function banner(cls, text) { return text ? p(text, cls) : null; }

  function home(status) {
    var mine = lists();
    var box = h('div', {}, [
      h('h1', {}, [T.h1]),
      p(T.lead, 'onske-lead'),
      banner('onske-ok', status),
      h('div', { class: 'onske-handlinger' }, [
        btn(T.create, 'knapp primar', function () { go('ny'); }),
        h('a', { class: 'knapp dempet', href: '#mine' }, [T.mine]),
        h('a', { class: 'knapp dempet', href: ideas }, [T.ideas])
      ])
    ]);
    if (T.ideasUk) box.append(h('p', { class: 'onske-mini' }, [T.ideasNote + ' ', h('a', { href: T.ideasUk }, ['Christmas gifts UK'])]));
    var form = h('form', { class: 'onske-skjema', id: 'ny' }, [
      h('h2', {}, [T.create]),
      field(T.name, input({ name: 'name', required: 'required', maxlength: '80', placeholder: T.namePh })),
      field(T.occasion, input({ name: 'occasion', maxlength: '60', placeholder: T.occasionPh })),
      h('div', { class: 'onske-advarsel' }, [p(T.lost), p(T.retention)]),
      h('button', { class: 'knapp primar', type: 'submit' }, [T.submit])
    ]);
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var data = new FormData(form);
      call('/lister', { method: 'POST', body: { name: String(data.get('name') || ''), occasion: String(data.get('occasion') || ''), lang: lang } }).then(function (res) {
        if (res.status !== 201) { home(message(res.json.error)); return; }
        remember({ id: res.json.id, name: res.json.name, editToken: res.json.editToken, viewToken: res.json.viewToken, lang: res.json.lang, savedAt: new Date().toISOString() });
        go('eier=' + encodeURIComponent(res.json.editToken));
      });
    });
    box.append(form);
    var mineBox = h('section', { class: 'onske-kort', id: 'mine' }, [h('h2', {}, [T.mine])]);
    if (!mine.length) mineBox.append(p(T.emptyMine));
    mine.forEach(function (list) {
      mineBox.append(h('div', { class: 'onske-rad' }, [
        h('strong', {}, [list.name]),
        btn(T.open, 'knapp dempet', function () { go('eier=' + encodeURIComponent(list.editToken)); }),
        btn(T.forget, 'knapp dempet', function () { forget(list.id); home(T.removedBrowser); })
      ]));
    });
    box.append(mineBox, help());
    show(box);
  }

  function help() {
    return h('details', { class: 'onske-kort' }, [
      h('summary', {}, [T.help]),
      h('h3', {}, [T.privacyTitle]),
      p(T.privacy),
      p(T.retention),
      p(T.surprise),
      p(T.viewLead),
      h('p', {}, [h('a', { href: '/privacy/' }, [T.policy]), ' · ', h('a', { href: 'mailto:info@hendtas.com' }, [T.contact])])
    ]);
  }

  function wishFields(prefill) {
    prefill = prefill || {};
    var wrap = h('div', {}, [
      h('div', { class: 'onske-to' }, [
        field(T.size, input({ name: 'size', maxlength: '40', value: prefill.size || '' })),
        field(T.color, input({ name: 'color', maxlength: '40', value: prefill.color || '' }))
      ]),
      h('div', { class: 'onske-to' }, [
        field(T.price, input({ name: 'priceText', maxlength: '32', value: prefill.priceText || '' })),
        field(T.priceDate, input({ name: 'priceCheckedOn', type: 'date', value: prefill.priceCheckedOn || '' }))
      ]),
      field(T.note, h('textarea', { name: 'note', maxlength: '400' }, [prefill.note || ''])),
      h('label', { class: 'onske-sjekk' }, [
        input({ type: 'checkbox', name: 'mostWanted', checked: prefill.mostWanted ? 'checked' : null }),
        h('span', {}, [T.most])
      ])
    ]);
    return wrap;
  }

  function readWish(form, extra) {
    var data = new FormData(form);
    var body = {
      title: String(data.get('title') || ''),
      size: String(data.get('size') || ''),
      color: String(data.get('color') || ''),
      priceText: String(data.get('priceText') || ''),
      priceCheckedOn: String(data.get('priceCheckedOn') || ''),
      note: String(data.get('note') || ''),
      mostWanted: data.get('mostWanted') === 'on',
      source: extra.source || 'text',
      productUrl: extra.productUrl || '',
      imageUrl: extra.imageUrl || '',
      imageRights: extra.imageRights || 'none',
      shopName: extra.shopName || ''
    };
    return body;
  }

  function owner(token, data, status, editing) {
    var viewUrl = absolute(data.paths.view);
    var editUrl = absolute(data.paths.edit);
    var box = h('div', {}, [
      h('p', {}, [h('a', { href: basePath }, ['← ' + T.h1])]),
      h('h1', {}, [data.list.name]),
      data.list.occasion ? p(data.list.occasion, 'onske-lead') : null,
      banner(status && status.ok ? 'onske-ok' : 'onske-feil', status && status.text),
      h('div', { class: 'onske-advarsel' }, [p(T.lost), p(T.retention)]),
      h('div', { class: 'onske-handlinger' }, [
        btn(T.share, 'knapp primar', function () { share(viewUrl, data.list.name, token, data); }),
        btn(T.copyEdit, 'knapp dempet', function () { copy(editUrl).then(function () { owner(token, data, { ok: true, text: T.editCopied }, editing); }); }),
        h('a', { class: 'knapp dempet', href: API + '/eksport', id: 'eksport' }, [T.download]),
        btn(T.rotate, 'knapp dempet', function () { confirmBox('rotate'); }),
        btn(T.del, 'knapp fare', function () { confirmBox('delete'); })
      ]),
      h('p', { class: 'onske-kode', id: 'vislenke' }, [viewUrl]),
      h('div', { class: 'onske-stille' }, [h('strong', {}, [T.surpriseTitle]), p(T.surprise)])
    ]);
    var exportLink = box.querySelector('#eksport');
    exportLink.addEventListener('click', function (event) {
      event.preventDefault();
      fetch(API + '/eksport', { headers: { authorization: 'Bearer ' + token } }).then(function (res) { return res.blob().then(function (blob) { return { ok: res.ok, blob: blob }; }); }).then(function (file) {
        if (!file.ok) { owner(token, data, { text: T.server }); return; }
        var url = URL.createObjectURL(file.blob);
        var a = h('a', { href: url, download: 'onskeliste.json' });
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      }).catch(function () { owner(token, data, { text: T.offline }); });
    });

    var confirm = h('div', { id: 'bekreft' });
    function confirmBox(kind) {
      confirm.textContent = '';
      var warn = kind === 'delete' ? T.delWarn : T.rotateWarn;
      var label = kind === 'delete' ? T.delDo : T.rotateDo;
      confirm.append(h('div', { class: 'onske-advarsel' }, [
        p(warn),
        h('div', { class: 'onske-rad' }, [
          btn(label, kind === 'delete' ? 'knapp fare' : 'knapp primar', function () {
            if (kind === 'delete') {
              call('/liste', { method: 'DELETE', token: token }).then(function (res) {
                if (res.status !== 204) { owner(token, data, { text: message(res.json.error) }); return; }
                forget(data.list.id);
                home(T.listGone);
              });
            } else {
              call('/deling/roter', { method: 'POST', token: token }).then(function (res) {
                if (res.status !== 200) { owner(token, data, { text: message(res.json.error) }); return; }
                var stored = lists().filter(function (item) { return item.editToken === token; })[0];
                if (stored) { stored.viewToken = res.json.viewToken; remember(stored); }
                loadOwner(token, { ok: true, text: T.rotated });
              });
            }
          }),
          btn(T.cancel, 'knapp dempet', function () { confirm.textContent = ''; })
        ])
      ]));
    }
    box.append(confirm, addForm(token, data), h('h2', {}, [T.wishes]));
    if (!data.wishes.length) box.append(p(T.empty));
    data.wishes.forEach(function (wish) { box.append(wishCard(token, data, wish, editing)); });
    box.append(help());
    show(box);
  }

  function addForm(token, data) {
    var form = h('form', { class: 'onske-skjema' });
    var mode = 'text';
    var fetchedImage = '';
    var status = h('div', {});
    var modes = h('div', { class: 'onske-moduser', role: 'group' });
    var urlField = field(T.url, input({ name: 'productUrl', type: 'url', inputmode: 'url', placeholder: 'https://' }));
    var rights = h('label', { class: 'onske-sjekk' }, [input({ type: 'checkbox', name: 'rights' }), h('span', {}, [T.rights])]);
    var preview = h('div', {});
    var giveowl = h('div', { class: 'onske-stille' }, [p(T.giveowlHelp), h('a', { class: 'knapp dempet', href: ideas }, [T.ideas])]);
    function paint() {
      urlField.hidden = mode !== 'url';
      fetchBtn.hidden = mode !== 'url';
      rights.hidden = mode !== 'url' || !fetchedImage;
      preview.hidden = mode !== 'url';
      giveowl.hidden = mode !== 'giveowl';
      Array.prototype.forEach.call(modes.querySelectorAll('button'), function (button) {
        button.setAttribute('aria-pressed', button.getAttribute('data-mode') === mode ? 'true' : 'false');
      });
    }
    T.modes.forEach(function (item) {
      modes.append(btn(item[1], 'knapp dempet', function () { mode = item[0]; paint(); }));
    });
    var title = field(T.title, input({ name: 'title', required: 'required', maxlength: '160', placeholder: T.titlePh }));
    var fetchBtn = btn(T.fetch, 'knapp dempet', function () {
      var url = form.elements.productUrl.value.trim();
      status.textContent = '';
      preview.textContent = '';
      fetchedImage = '';
      call('/hent', { method: 'POST', token: token, body: { url: url } }).then(function (res) {
        if (res.json && res.json.sourceUrl) form.elements.productUrl.value = res.json.sourceUrl;
        if (res.status === 200) {
          if (res.json.title && !form.elements.title.value) form.elements.title.value = res.json.title;
          if (res.json.imageUrl) {
            fetchedImage = res.json.imageUrl;
            preview.append(h('img', { class: 'onske-bilde', src: res.json.imageUrl, alt: '', referrerpolicy: 'no-referrer' }));
          }
          preview.append(p(T.noPromise, 'onske-mini'));
        } else {
          status.append(p(message(res.json.error), 'onske-feil'));
        }
        paint();
      });
    });
    form.append(h('h2', {}, [T.add]), p(T.qty, 'onske-mini'), modes, title, urlField, fetchBtn, preview, rights, giveowl, wishFields({}), status, h('button', { class: 'knapp primar', type: 'submit' }, [T.add]));
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var extra = { source: mode === 'giveowl' ? 'text' : mode, productUrl: mode === 'url' ? form.elements.productUrl.value : '' };
      if (mode === 'url' && form.elements.rights.checked && fetchedImage) {
        extra.imageUrl = fetchedImage;
        extra.imageRights = 'confirmed';
      }
      var body = readWish(form, extra);
      call('/onsker', { method: 'POST', token: token, body: body }).then(function (res) {
        if (res.status !== 201) { status.textContent = ''; status.append(p(message(res.json.error), 'onske-feil')); return; }
        loadOwner(token, { ok: true, text: T.added });
      });
    });
    paint();
    return form;
  }

  function wishCard(token, data, wish, editing) {
    if (editing === wish.id) return editCard(token, data, wish);
    var bits = [h('h3', {}, [wish.title])];
    if (wish.mostWanted) bits.push(h('span', { class: 'onske-merke mest' }, [T.most]));
    if (wish.affiliate) bits.push(h('span', { class: 'onske-merke ann' }, [T.ad]));
    if (wish.shopName) bits.push(p(wish.shopName, 'onske-meta'));
    var price = priceLine(wish);
    if (price) bits.push(p(price, 'onske-meta'));
    if (wish.size) bits.push(p(T.sizePrefix + wish.size, 'onske-meta'));
    if (wish.color) bits.push(p(T.colorPrefix + wish.color, 'onske-meta'));
    if (wish.note) bits.push(p(wish.note));
    var actions = h('div', { class: 'onske-rad' }, [
      shopLink(wish.productUrl),
      btn(T.edit, 'knapp dempet', function () { owner(token, data, null, wish.id); }),
      btn(T.remove, 'knapp fare', function () {
        call('/onsker/' + wish.id, { method: 'DELETE', token: token }).then(function (res) {
          if (res.status !== 204) { owner(token, data, { text: message(res.json.error) }); return; }
          loadOwner(token, { ok: true, text: T.wishGone });
        });
      })
    ]);
    return h('article', { class: 'onske-kort onske-onske' }, [picture(wish), h('div', {}, bits.concat(actions))]);
  }

  function editCard(token, data, wish) {
    var form = h('form', { class: 'onske-skjema' });
    var status = h('div', {});
    form.append(
      field(T.title, input({ name: 'title', required: 'required', maxlength: '160', value: wish.title })),
      field(T.url, input({ name: 'productUrl', value: wish.productUrl || '' })),
      wishFields(wish),
      status,
      h('div', { class: 'onske-rad' }, [
        h('button', { class: 'knapp primar', type: 'submit' }, [T.save]),
        btn(T.cancel, 'knapp dempet', function () { owner(token, data); })
      ])
    );
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var body = readWish(form, {
        source: wish.source,
        productUrl: form.elements.productUrl.value,
        shopName: wish.shopName || '',
        imageUrl: wish.imageUrl || '',
        imageRights: wish.imageRights || 'none'
      });
      call('/onsker/' + wish.id, { method: 'PATCH', token: token, body: body }).then(function (res) {
        if (res.status !== 200) { status.append(p(message(res.json.error), 'onske-feil')); return; }
        loadOwner(token, { ok: true, text: T.added });
      });
    });
    return h('article', { class: 'onske-kort' }, [form]);
  }

  function share(url, title, token, data) {
    var done = function (text) { owner(token, data, { ok: true, text: text }); };
    if (navigator.share) {
      navigator.share({ title: title, url: url }).then(function () { done(T.shared); }).catch(function (error) {
        if (error && error.name === 'AbortError') return;
        copy(url).then(function () { done(T.copied); });
      });
      return;
    }
    copy(url).then(function () { done(T.copied); });
  }

  function viewer(token, data, status) {
    var saved = reservations();
    var box = h('div', {}, [
      h('h1', {}, [data.list.name]),
      data.list.occasion ? p(data.list.occasion, 'onske-lead') : null,
      h('div', { class: 'onske-stille' }, [p(T.viewLead), p(T.qty)]),
      banner(status && status.ok ? 'onske-ok' : 'onske-feil', status && status.text),
      status && status.undo ? h('div', { class: 'onske-ok' }, [
        p(T.undo),
        h('p', { class: 'onske-kode' }, [status.undo]),
        btn(T.undoCopy, 'knapp dempet', function () { copy(status.undo); })
      ]) : null
    ]);
    if (!data.wishes.length) box.append(p(T.empty));
    data.wishes.forEach(function (wish) {
      var bits = [h('h3', {}, [wish.title])];
      if (wish.mostWanted) bits.push(h('span', { class: 'onske-merke mest' }, [T.most]));
      if (wish.affiliate) bits.push(h('span', { class: 'onske-merke ann' }, [T.ad]));
      if (wish.shopName) bits.push(p(wish.shopName, 'onske-meta'));
      var price = priceLine(wish);
      if (price) bits.push(p(price, 'onske-meta'));
      if (wish.size) bits.push(p(wish.size, 'onske-meta'));
      if (wish.color) bits.push(p(wish.color, 'onske-meta'));
      if (wish.note) bits.push(p(wish.note));
      var state = wish.state === 'bought' ? T.bought : wish.state === 'reserved' ? T.reserved : '';
      if (state) bits.push(h('span', { class: 'onske-merke stat' }, [state]));
      var mine = saved[wish.id];
      var actions = h('div', { class: 'onske-rad' }, [shopLink(wish.productUrl)]);
      if (wish.state === 'open') {
        actions.append(btn(T.buy, 'knapp primar', function () {
          call('/onsker/' + wish.id + '/reserver', { method: 'POST', token: token }).then(function (res) {
            if (res.status === 409) { viewer(token, data, { text: T.taken }); return; }
            if (res.status !== 200) { viewer(token, data, { text: message(res.json.error) }); return; }
            rememberRes(wish.id, res.json.reservationToken);
            loadViewer(token, { ok: true, text: T.reserved, undo: absolute(res.json.paths.reservation) });
          });
        }));
      } else if (mine) {
        actions.append(p(T.yourRes, 'onske-mini'));
        actions.append(btn(T.mark, 'knapp dempet', function () { resAct(mine, '/reservasjon/kjopt', token); }));
        actions.append(btn(T.release, 'knapp dempet', function () { resAct(mine, '/reservasjon/frigjor', token); }));
      }
      box.append(h('article', { class: 'onske-kort onske-onske' }, [picture(wish), h('div', {}, bits.concat([actions]))]));
    });
    show(box);
  }

  function resAct(resToken, path, viewToken) {
    call(path, { method: 'POST', token: resToken }).then(function (res) {
      if (res.status !== 200) { loadViewer(viewToken, { text: message(res.json.error) }); return; }
      loadViewer(viewToken, { ok: true, text: res.json.state === 'open' ? T.release : T.bought });
    });
  }

  function reservation(token, data, status) {
    var undo = absolute(basePath + '#res=' + encodeURIComponent(token));
    var state = data.state === 'bought' ? T.bought : T.reserved;
    show(h('div', {}, [
      h('h1', {}, [data.title]),
      p(data.listName, 'onske-lead'),
      h('div', { class: 'onske-stille' }, [p(T.resLead), p(T.viewLead)]),
      banner(status && status.ok ? 'onske-ok' : 'onske-feil', status && status.text),
      h('p', {}, [h('span', { class: 'onske-merke stat' }, [state])]),
      h('div', { class: 'onske-rad' }, [
        shopLink(data.productUrl),
        data.state !== 'bought' ? btn(T.mark, 'knapp primar', function () {
          call('/reservasjon/kjopt', { method: 'POST', token: token }).then(function (res) {
            if (res.status !== 200) { reservation(token, data, { text: message(res.json.error) }); return; }
            data.state = 'bought';
            reservation(token, data, { ok: true, text: T.bought });
          });
        }) : null,
        btn(T.release, 'knapp dempet', function () {
          call('/reservasjon/frigjor', { method: 'POST', token: token }).then(function (res) {
            if (res.status !== 200) { reservation(token, data, { text: message(res.json.error) }); return; }
            show(h('div', {}, [h('h1', {}, [data.title]), p(T.releasedDone)]));
          });
        }),
        btn(T.undoCopy, 'knapp dempet', function () { copy(undo).then(function () { reservation(token, data, { ok: true, text: T.copied }); }); })
      ]),
      p(T.undo, 'onske-mini'),
      h('p', { class: 'onske-kode' }, [undo])
    ]));
  }

  function show(node) {
    root.textContent = '';
    root.append(node);
  }

  function loadOwner(token, status) {
    show(p(T.loading));
    call('/liste', { token: token }).then(function (res) {
      if (res.status !== 200 || res.json.role !== 'owner') { show(h('div', {}, [h('h1', {}, [T.h1]), p(message(res.json.error))])); return; }
      var known = lists().filter(function (item) { return item.id === res.json.list.id; })[0];
      remember({
        id: res.json.list.id,
        name: res.json.list.name,
        editToken: token,
        viewToken: res.json.viewToken,
        lang: res.json.list.lang,
        savedAt: new Date().toISOString()
      });
      if (known && known.viewToken && known.viewToken !== res.json.viewToken) status = status || { ok: true, text: T.rotated };
      owner(token, res.json, status);
    });
  }
  function loadViewer(token, status) {
    show(p(T.loading));
    call('/liste', { token: token }).then(function (res) {
      if (res.status !== 200 || res.json.role !== 'viewer') { show(h('div', {}, [h('h1', {}, [T.h1]), p(message(res.json.error))])); return; }
      viewer(token, res.json, status);
    });
  }
  function loadRes(token) {
    show(p(T.loading));
    call('/reservasjon', { token: token }).then(function (res) {
      if (res.status !== 200) { show(h('div', {}, [h('h1', {}, [T.h1]), p(message(res.json.error))])); return; }
      reservation(token, res.json);
    });
  }

  function draw() {
    var here = route();
    if (here.name === 'eier' && here.token) loadOwner(here.token);
    else if (here.name === 'vis' && here.token) loadViewer(here.token);
    else if (here.name === 'res' && here.token) loadRes(here.token);
    else {
      home();
      if (here.name === 'ny') {
        var name = document.querySelector('#ny input[name="name"]');
        if (name) name.focus();
      }
    }
  }
  window.addEventListener('hashchange', draw);
  draw();
})();
