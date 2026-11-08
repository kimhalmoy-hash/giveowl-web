(function () {
  var KEY = 'giveowl.onskelister';
  var RES = 'giveowl.reservasjoner';
  var API = (window.GIVEOWL_ONSKE_API || '/api/onskeliste').replace(/\/$/, '');
  var root = document.getElementById('app');
  var lang = /^(en)(-|$)/i.test(document.documentElement.lang || '') ? 'en' : 'nb';
  var ideas = lang === 'en' ? '/christmas-gifts-us/' : '/julegaveideer/';

  var T = lang === 'en' ? {
    h1: 'Wishlist',
    lead: 'Make a list of gifts you would like, and share a view link with your family. No account, phone or email.',
    create: 'Create a wishlist',
    mine: 'My lists in this browser',
    ideas: 'Find gift ideas',
    ideasNote: 'UK gift ideas are on the UK page.',
    ideasUk: '/christmas-gifts-uk/',
    name: 'List name',
    namePh: 'My Christmas wishes',
    occasion: 'Occasion (optional)',
    occasionPh: 'Christmas, birthday…',
    submit: 'Create the list',
    lost: 'If you lose both this browser and the edit link, the list cannot be recovered yet. There is no account to send it to.',
    retention: 'The list is deleted after 12 months (365 days) without a visit or a change. You can delete it yourself at any time, and you can download it first.',
    privacyTitle: 'Privacy, in short',
    privacy: 'HENDT AS stores the list, the wishes and the secret keys that grant access. We do not ask for your name, email, phone, address or address book. A giver does not enter a name. For abuse limits, the server keeps a temporary counter per network address for up to one hour. That counter is not attached to the list, and the address is not stored in clear text on the list. The static pages are on GitHub Pages. The wishlist itself is stored in the wishlist server’s database, which is separate. Children\'s lists are run by an adult. There is no public search for children or for lists.',
    contact: 'Questions: info@hendtas.com',
    policy: 'Privacy policy',
    emptyMine: 'No lists are saved in this browser.',
    open: 'Open',
    forget: 'Remove from this browser',
    share: 'Share the list',
    copied: 'View link copied.',
    shared: 'Share sheet opened with the view link.',
    copyEdit: 'Copy edit link',
    editCopied: 'Edit link copied. Keep it. Do not send it to the people who are buying.',
    download: 'Download',
    rotate: 'New share link',
    rotateWarn: 'The old view link stops working. People who saved it will need the new one.',
    rotateDo: 'Replace the view link',
    del: 'Delete the list',
    delWarn: 'The list, the wishes and the reservations are deleted. This cannot be undone.',
    delDo: 'Delete now',
    cancel: 'Cancel',
    surpriseTitle: 'About surprises',
    surprise: 'This owner view hides whether a wish is reserved or bought. That is not technically guaranteed secrecy. Anyone with the view link can forward it, and you can open the view link in another browser and see the status there.',
    qty: 'Each wish is one thing, so only one person can reserve it.',
    modes: [['text', 'Write a wish'], ['url', 'Paste a shop link'], ['giveowl', 'From GiveOwl']],
    title: 'What do you want?',
    titlePh: 'A cinema trip, or a wool sweater, size M, dark blue',
    url: 'Shop link',
    fetch: 'Try to fetch title and picture',
    fetchFail: 'We could not fetch a title or picture. Your link is kept, and you can type the rest. We cannot import from every shop.',
    giveowlFetch: 'This is a GiveOwl link. Use Add to wishlist on the gift page, or type the name. We do not open the affiliate link from here, and we do not rewrite your own shop link into an affiliate link.',
    rights: 'I have the right to show this picture, or to link to it. It is stored only as a link, not as a copy. Leave this unchecked to save the wish without a picture.',
    noPromise: 'We do not promise to fetch a title and picture from every shop.',
    giveowlHelp: 'Open the gift ideas and use Add to wishlist on a product. A labelled affiliate link can travel with a GiveOwl product. Wishes are not ranked by commission.',
    size: 'Size',
    color: 'Colour',
    price: 'Price',
    priceDate: 'Price checked on',
    note: 'Short note',
    most: 'Most wanted',
    add: 'Add wish',
    shop: 'See at the shop',
    ad: 'Ad',
    priceHint: 'Indicative price, not a promise of stock or the lowest price. Checked',
    edit: 'Edit',
    remove: 'Remove',
    save: 'Save',
    empty: 'No wishes yet.',
    viewLead: 'No account needed. A reservation is an agreement among the people giving the gifts, not a payment. GiveOwl does not take payment, ship gifts or handle returns.',
    buy: 'I\'ll buy this',
    reserved: 'Reserved',
    bought: 'Bought',
    release: 'Release',
    mark: 'Bought',
    undo: 'Save your undo link. It only changes this reservation.',
    undoCopy: 'Copy undo link',
    yourRes: 'You reserved this in this browser.',
    taken: 'Someone else reserved this.',
    resLead: 'This page only changes your reservation.',
    back: 'All lists in this browser',
    loading: 'Loading…',
    notFound: 'This link does not open a list. It may have been replaced, or the list was deleted.',
    removedBrowser: 'Removed from this browser. The list on the server is unchanged.',
    wishGone: 'Wish removed.',
    listGone: 'The list is deleted from the server and from this browser.',
    rotated: 'The view link is replaced. Copy the new one before you share it.',
    added: 'Wish added.',
    full: 'The list is full (80 wishes).',
    rate: 'Too many tries in a short time. Wait a little, then try again.',
    badUrl: 'Use an ordinary http or https link. Internal and private addresses are blocked.',
    rightsErr: 'Tick the picture box, or save the wish without a picture.',
    offline: 'The server did not respond. The list is not stored only in this browser.',
    server: 'Something went wrong. Try again.',
    required: 'Enter a list name.',
    bad: 'Check the fields and try again.',
    help: 'How it works'
  } : {
    h1: 'Ønskeliste',
    lead: 'Lag en liste over gaver du ønsker deg, og del en visningslenke med familien. Ingen konto, telefon eller e-post.',
    create: 'Lag ønskeliste',
    mine: 'Mine lister i denne nettleseren',
    ideas: 'Finn gaveideer',
    ideasNote: '',
    ideasUk: '',
    name: 'Navn på listen',
    namePh: 'Mine juleønsker',
    occasion: 'Anledning (valgfritt)',
    occasionPh: 'jul, bursdag …',
    submit: 'Opprett listen',
    lost: 'Hvis du mister både denne nettleseren og redigeringslenken, kan listen ikke gjenopprettes ennå. Vi har ingen konto å sende den til.',
    retention: 'Listen slettes etter 12 måneder (365 dager) uten besøk eller endring. Du kan slette den selv når som helst, og du kan laste den ned først.',
    privacyTitle: 'Personvern, kort',
    privacy: 'HENDT AS lagrer listen, ønskene og nøklene som gir tilgang. Vi ber ikke om navn, e-post, telefon, adresse eller adressebok. En giver oppgir ikke navn. For å begrense misbruk holder serveren et midlertidig tellerverk per nettverksadresse i inntil én time. Telleren er ikke koblet til listen, og adressen lagres ikke i klartekst på listen. De statiske sidene ligger på GitHub Pages. Selve ønskelisten lagres i databasen på ønskeliste-serveren, som er en annen tjeneste. Lister for barn skal styres av en voksen. Det finnes ikke offentlig søk etter barn eller lister.',
    contact: 'Spørsmål: info@hendtas.com',
    policy: 'Personvernerklæring',
    emptyMine: 'Ingen lister er lagret i denne nettleseren.',
    open: 'Åpne',
    forget: 'Fjern fra denne nettleseren',
    share: 'Del listen',
    copied: 'Visningslenken er kopiert.',
    shared: 'Delingsarket er åpnet med visningslenken.',
    copyEdit: 'Kopier redigeringslenke',
    editCopied: 'Redigeringslenken er kopiert. Ta vare på den. Ikke send den til dem som skal kjøpe.',
    download: 'Last ned',
    rotate: 'Ny delingslenke',
    rotateWarn: 'Den gamle visningslenken slutter å virke. De som har lagret den, trenger den nye.',
    rotateDo: 'Bytt visningslenke',
    del: 'Slett listen',
    delWarn: 'Listen, ønskene og reservasjonene slettes. Dette kan ikke angres.',
    delDo: 'Slett nå',
    cancel: 'Avbryt',
    surpriseTitle: 'Om overraskelser',
    surprise: 'I denne eier-visningen ser du ikke om et ønske er reservert eller kjøpt. Det er ikke teknisk garantert hemmelighold. Alle med visningslenken kan sende den videre, og du kan selv åpne visningslenken i en annen nettleser og se statusen der.',
    qty: 'Hvert ønske gjelder én ting, så bare én person kan reservere det.',
    modes: [['text', 'Skriv et ønske'], ['url', 'Lim inn butikklenke'], ['giveowl', 'Fra GiveOwl']],
    title: 'Hva ønsker du deg?',
    titlePh: 'En tur på kino, eller ullgenser, størrelse M, mørk blå',
    url: 'Butikklenke',
    fetch: 'Prøv å hente tittel og bilde',
    fetchFail: 'Vi fikk ikke hentet tittel eller bilde. Lenken beholdes, og du kan skrive resten selv. Vi kan ikke hente fra alle butikker.',
    giveowlFetch: 'Dette er en GiveOwl-lenke. Bruk «Legg til i ønskeliste» på gavesiden, eller skriv navnet. Vi åpner ikke affiliatelenken herfra, og vi skriver ikke om din egen butikklenke til en affiliatelenke.',
    rights: 'Jeg har lov til å vise dette bildet, eller til å lenke til det. Det lagres bare som lenke, ikke som en kopi. Lar du feltet stå tomt, lagres ønsket uten bilde.',
    noPromise: 'Vi lover ikke å hente tittel og bilde fra alle butikker.',
    giveowlHelp: 'Åpne gaveideene og bruk «Legg til i ønskeliste» på et produkt. En merket affiliate-lenke kan følge med et GiveOwl-produkt. Ønsker rangeres ikke etter provisjon.',
    size: 'Størrelse',
    color: 'Farge',
    price: 'Pris',
    priceDate: 'Pris sjekket',
    note: 'Kort notat',
    most: 'Mest ønsket',
    add: 'Legg til ønske',
    shop: 'Se hos butikk',
    ad: 'Annonse',
    priceHint: 'Veiledende pris, ikke et løfte om lager eller laveste pris. Sjekket',
    edit: 'Endre',
    remove: 'Fjern',
    save: 'Lagre',
    empty: 'Ingen ønsker ennå.',
    viewLead: 'Ingen konto. En reservasjon er en avtale mellom dem som gir, ikke en betaling. GiveOwl tar ikke betalt, sender ikke gaver og håndterer ikke retur.',
    buy: 'Jeg kjøper denne',
    reserved: 'Reservert',
    bought: 'Kjøpt',
    release: 'Frigi',
    mark: 'Kjøpt',
    undo: 'Lagre angre-lenken din. Den endrer bare denne reservasjonen.',
    undoCopy: 'Kopier angre-lenke',
    yourRes: 'Du har reservert denne i denne nettleseren.',
    taken: 'Noen andre rakk å reservere denne.',
    resLead: 'Denne siden endrer bare reservasjonen din.',
    back: 'Alle lister i denne nettleseren',
    loading: 'Laster …',
    notFound: 'Denne lenken åpner ingen liste. Den kan være byttet ut, eller listen er slettet.',
    removedBrowser: 'Fjernet fra denne nettleseren. Listen på serveren er uendret.',
    wishGone: 'Ønsket er fjernet.',
    listGone: 'Listen er slettet fra serveren og fra denne nettleseren.',
    rotated: 'Visningslenken er byttet. Kopier den nye før du deler den.',
    added: 'Ønsket er lagt til.',
    full: 'Listen er full (80 ønsker).',
    rate: 'For mange forsøk på kort tid. Vent litt og prøv igjen.',
    badUrl: 'Bruk en vanlig http- eller https-lenke. Interne og private adresser er sperret.',
    rightsErr: 'Kryss av for bildet, eller lagre ønsket uten bilde.',
    offline: 'Får ikke kontakt med serveren. Listen lagres ikke bare i nettleseren.',
    server: 'Noe gikk galt. Prøv igjen.',
    required: 'Skriv inn et navn på listen.',
    bad: 'Sjekk feltene og prøv igjen.',
    help: 'Slik virker det'
  };

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
    if (lang === 'en') box.append(h('p', { class: 'onske-mini' }, [T.ideasNote + ' ', h('a', { href: T.ideasUk }, ['Christmas gifts UK'])]));
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
      h('p', {}, [h('a', { href: lang === 'en' ? '/wishlist/' : '/onskeliste/' }, ['← ' + T.h1])]),
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
    box.append(confirm, addForm(token, data), h('h2', {}, [lang === 'en' ? 'Wishes' : 'Ønsker']));
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
    if (wish.size) bits.push(p((lang === 'en' ? 'Size: ' : 'Størrelse: ') + wish.size, 'onske-meta'));
    if (wish.color) bits.push(p((lang === 'en' ? 'Colour: ' : 'Farge: ') + wish.color, 'onske-meta'));
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
    var undo = absolute((lang === 'en' ? '/wishlist/' : '/onskeliste/') + '#res=' + encodeURIComponent(token));
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
            show(h('div', {}, [h('h1', {}, [data.title]), p(lang === 'en' ? 'The wish is available again. This undo link no longer works.' : 'Ønsket er ledig igjen. Denne angre-lenken virker ikke lenger.')]));
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
