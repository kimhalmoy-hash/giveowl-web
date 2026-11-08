# GiveOwl ønskeliste (MVP)

A first version of GiveOwl’s wishlist. Norwegian (bokmål) is the main language. English is at `/wishlist/`. There is no account, no app, and no newsletter.

The list lives on a small server. The browser remembers owner access, and the owner also gets a secret edit link. Those two are the only ways back in. If both are lost, the list cannot be recovered yet.

This pull request does **not** publish anything to giveowl.com and does not change DNS.

## What is stored

- List name, optional occasion, wishes, and the keys that grant access.
- Not stored on the list: name, email, phone, address, address book, or the giver’s name.
- A wish is always quantity 1, so only one reservation can be active.
- Three different keys:
  - **Edit key** (`e_…`) in `/onskeliste/#eier=…` (or `/wishlist/#eier=…`). Edits and deletes. The fragment is not sent to the server, to shops, or in `Referer`.
  - **View key** (`v_…`) in `#vis=…`. View and reserve. This is the link «Del listen» copies.
  - **Reservation key** (`r_…`) in `#res=…`. Changes only that reservation (bought or release).
- The database stores SHA-256 hashes of the edit and reservation keys. The current view key is also stored so the owner can copy it again. Do not commit the database file.
- Abuse limits use a temporary counter per network address, stored as a hash, for up to one hour. The address is not written on the list.
- Inactive lists are deleted after **365 days** (shown in the product as 12 months). The owner can delete the list and download the wishes. The download leaves reservations out, so it does not spoil surprises.
- Owner view does not include reservation or purchase status. This is not technical secrecy: anyone with the view link can forward it, and the owner can open that link in another browser. The page says so.
- A reservation is an agreement among givers. GiveOwl does not take payment, ship, or handle returns.
- GiveOwl product links that are already labelled affiliate links can travel with the wish and stay marked as an ad. A shop URL the user pastes is stored as they wrote it (fragment removed). It is not rewritten into an affiliate link. Wishes are not ranked by commission.
- A price is indicative and can include the date it was checked. The page does not promise stock or the lowest price.
- External pictures are stored only as an `https` link, and only after the owner confirms they may show it. GiveOwl gift images use the same picture already on the gift page and are also only a link. The server does not copy image files.
- Children’s lists are for an adult to run. There is no public search for children or lists.
- List pages send `noindex` and are not in `sitemap.xml`. `robots.txt` disallows `/api/onskeliste/`.

## Run it locally

Requirements: Node.js 22 (this repo was checked with Node 22, which includes `node:sqlite`). No `npm install` and no API keys.

From the repository root:

```bash
node onskeliste/server/dev-server.mjs
```

Optional environment variables:

- `PORT` (default `8787`)
- `GIVEOWL_DB` (default `onskeliste/data/onskeliste.sqlite`, which is gitignored)

Open `http://127.0.0.1:8787/onskeliste/`.

The same process serves the static site and the API at `/api/onskeliste`. Nothing is written to giveowl.com.

### Demo with three clients

1. **Owner.** On `/onskeliste/`, choose «Lag ønskeliste». Only the name is required (for example «Mine juleønsker»). Copy the edit link (`#eier=`) and keep the page open. Add a text wish («En tur på kino»), paste a normal shop `https://` URL (fetch may fail; the URL stays and you can type the title), and add a GiveOwl gift from `/julegaveideer/` with «Legg til i ønskeliste».
2. **Giver.** Copy the view link from «Del listen» (`#vis=`, not the edit link). Open it in a second browser or a private window. Choose «Jeg kjøper denne». Copy the undo link (`#res=`).
3. **Another giver.** Open the same view link in a third browser. The wish says «Reservert». A second reserve gets HTTP 409. The giver who reserved can open the undo link, mark «Kjøpt», or «Frigi».
4. **Owner again.** Reload the edit link. Reservation status is not shown. «Last ned» exports the wishes without reservations. «Ny delingslenke» makes the old view link fail. «Slett listen» removes it.

The automated test covers the same rules, including eight parallel reserves of one wish:

```bash
node --test onskeliste/test/ssrf.test.mjs onskeliste/test/api.test.mjs
```

## Sixth tab

The five existing tabs are copied into each HTML file by the external generator (`scripts/lib/nav.mjs` is named in the CSS comments; that generator is not in this repo). A later republish can overwrite page bodies.

`assets/site.js` now ends with a marked hook that loads `assets/onskeliste.js`. That script inserts **Ønskeliste** (or **Wishlist** on English chrome) immediately before Guider / Guides, and adds «Legg til i ønskeliste» / «Add to wishlist» on `a.gave` product cards. Pages that do not load `site.js` (gift hubs and a few offer/guide pages) include the script tag directly.

Keep both the hook and `assets/onskeliste.js` if `site.js` or those hubs are regenerated. Do not edit the thousands of listing pages by hand.

On small screens the tab row stays a wrapping grid (three columns, same breakpoint as the existing tabs). It does not squeeze six labels onto one line. The new tab colour is teal (`#2DD4BF` / `#0F766E`), separate from the existing five.

Order, with Home left in place: Konkurranser → Julekalendere → Black Week → Julegaver → Ønskeliste → Guider. English chrome: Sweepstakes → Advent calendars → Black Friday → Gift ideas → Wishlist → Guides.

## API

All JSON, no cookies. Send the key as `Authorization: Bearer`. Do not put keys in query strings.

| Method and path | Key | Purpose |
| --- | --- | --- |
| `POST /api/onskeliste/lister` | none | Create a list. Body: `name`, optional `occasion`, `lang` `nb` or `en`. |
| `GET /api/onskeliste/liste` | edit or view | Owner payload hides reservation state. View payload includes `open`, `reserved`, or `bought`. |
| `POST /api/onskeliste/onsker` | edit | Add a wish. |
| `PATCH` or `DELETE /api/onskeliste/onsker/:id` | edit | Change or remove a wish. |
| `POST /api/onskeliste/deling/roter` | edit | Replace the view key. |
| `DELETE /api/onskeliste/liste` | edit | Delete the list. |
| `GET /api/onskeliste/eksport` | edit | Download wishes, without reservations. |
| `POST /api/onskeliste/hent` | edit | Try to read a public product page. On failure the client keeps the URL. |
| `POST /api/onskeliste/onsker/:id/reserver` | view | One active reservation. The conditional update allows only one winner. |
| `GET /api/onskeliste/reservasjon` | reservation | That reservation only. |
| `POST /api/onskeliste/reservasjon/kjopt` or `…/frigjor` | reservation | Mark bought, or release. |

Limits, per client, per hour: 10 new lists, 20 URL fetches, 40 reservation actions, 120 other writes, 80 wishes on a list. URL fetch allows only public `http`/`https` on ports 80 and 443, blocks private, loopback, link-local and metadata addresses (including addresses that merely look public but resolve privately), follows at most three redirects with the same checks, and stops at about 400 kB or 5 seconds. Fetched text is stripped of markup.

`GET /api/onskeliste/helse` returns `{ "ok": true }` and stores nothing.

## Deploy later (do not do this from the pull request)

giveowl.com is a static GitHub Pages site (`CNAME`). GitHub Pages cannot run this API or keep a private database. Leave the apex on GitHub Pages until you choose a host yourself.

Suggested shape when you are ready:

1. Run `node onskeliste/server/dev-server.mjs` on a host **you** already control, in the EEA if you can. Set `GIVEOWL_DB` to a path outside the git checkout and back it up. Put a reverse proxy in front with HTTPS.
2. Prefer a subdomain (for example `onske.giveowl.com`) over moving the apex off GitHub Pages. Point only that name at the Node process.
3. Set `window.GIVEOWL_ONSKE_API` before `onskeliste/app.js` and `assets/onskeliste.js` load, to `https://onske.giveowl.com/api/onskeliste` (no trailing slash). Until that variable is set, the pages call `/api/onskeliste` on the same origin, which works with the local server and does not exist on GitHub Pages.
4. Do not commit the sqlite file, `GIVEOWL_RATE_PEPPER` is not required (the process generates one if unset; set a stable pepper if you run more than one process).
5. The static files can stay on GitHub Pages. The wishlist database must not.

**Data location in this pull request:** the database file is created only when someone starts the Node server, on that machine. It is not created in production by this change. GitHub Pages (GitHub, Inc.) would still serve the HTML, CSS and JavaScript only. No new paid account is required to run the local server, and this change does not sign anyone up for one.

Cloudflare Workers and D1 (there is a free tier, and D1 can be created with EU jurisdiction) were considered and **not** wired up. The safe product-page fetch pins DNS and connects to that address with Node’s HTTP stack. The Workers runtime does not share that code, and no Cloudflare account or DNS change is available here. The SQL schema is `onskeliste/server/schema.sql` if you later adapt the same statements to D1.

## Privacy contact

Controller: HENDT AS, Norway, info@hendtas.com. A short notice is shown when a list is created and in the privacy policy. That notice is not a full legal opinion.
