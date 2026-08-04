# rancores.space

Personal portfolio of Randy Setiawan Hoesin, running entirely on Cloudflare's
free tier — Workers, D1, R2, Durable Objects, Access, Turnstile, Email Routing.

**Live:** [rancores.space](https://rancores.space)

The page is drawn as a set of engineering documents: a system map, a register of
projects, a spec table, a drawing title block. Most of what the work involves
has no public URL, so the site shows the shape of the systems rather than
screenshots of them.

---

## The idea

A portfolio changes often — a new project, a better sentence, an updated CV —
and none of that should need a deploy.

So the repo holds **no content**. `public/index.html` is markup, CSS and fonts
with a `<!--content-slot-->` in `<head>`. Every string, project, logo and date
lives in **D1**, and the Worker injects it as `window.__CONTENT__` at request
time. Media lives in **R2**. Both are edited from `/admin`, and both are live
immediately.

Only layout, CSS and animation still need `npm run deploy`.

```
public/index.html   page shell — markup, CSS, font faces. No content.
public/404.html     error sheet
src/index.ts        Worker: routing, content injection, media, contact, counter
src/access.ts       Cloudflare Access JWT verification (fails closed)
src/content.ts      D1 content store
src/admin-ui.ts     the editor, bundled into the Worker — never a public asset
src/patterns.ts     background patterns, shared by the page and the admin swatches
migrations/         D1 schema and every content change since
scripts/            pre-deploy gate, link-preview image generator
design/             the approved design prototype, frozen
```

## Decisions worth explaining

**The counter is a Durable Object, not KV.** KV's free plan allows 1,000 writes
per day. A per-view counter would stop working at 1,000 visits. A SQLite-backed
Durable Object allows 100,000.

**`/admin` is bundled into the Worker rather than served as a static file.**
A static asset can be fetched directly, and asset routing is not something to
stake an admin panel on. As Worker code it is unreachable except through the
route that checks Access first.

**Access verification fails closed.** `src/access.ts` checks the RS256
signature, issuer, audience and expiry of the `CF_Authorization` cookie on every
request. If either configuration variable is empty it returns `null` rather than
defaulting to allow, so a half-finished setup locks the door instead of opening
it. A forged header gets nowhere.

**The head is content too.** `<title>`, the meta description and the whole Open
Graph card come from the `seo` document. The shell keeps a copy between
`<!--seo-start-->` and `<!--seo-end-->` as a fallback; the Worker splices that
range out and renders the edited version, making relative image paths absolute
because several crawlers reject relative ones.

**Fonts are external files, not base64.** Inlining them made the shell 250 KB
with 174 KB of render-blocking CSS. Moving them to `/fonts/*.woff2` with
`preload` cut that to ~110 KB and 32 KB.

**There is a pre-deploy gate.** `npm run check` runs 33 assertions against the
shell — tag counts, stylesheet position, markup balance, that every inline
script parses, that the admin template parses both with and without its
placeholders substituted. It exists because a page once shipped with its entire
stylesheet duplicated into `<body>` as visible text, and every check in place at
the time passed: they all asked *is X present?*, never *is X present exactly
once, and is anything there that should not be?*. It is wired to `predeploy`, so
it cannot be skipped by accident.

## Editing content

| Tab | Covers |
|---|---|
| **Hero** | Wordmark lines, eyebrow items, opening statement, the four position rows |
| **Map** | Diagram caption, legend, disclosure note, and the domain boxes projects hang from |
| **Services** | The offer, in the client's words |
| **Profile** | Bio paragraphs, the spec table, and the counter strip |
| **Path** | Timeline entries, group names, the three role cards |
| **Work** | Every project, plus register column headings and detail-panel labels |
| **Stack** | Layers and their items (`name \| depth \| icon`) |
| **Quality** | The testing-background section |
| **Working together** | Testing, process, timezone, secrets — what a remote client actually asks |
| **Credentials** | The stamps |
| **Contact** | Form labels and the direct links |
| **Footer** | Title-block rows and the nav labels |
| **Appearance** | The background pattern, 25 of them |
| **Sharing** | Tab title, search snippet, and the link-preview card |
| **Media** | Upload, browse, delete. Files are live the moment they finish |
| **Advanced** | Raw JSON for every section, as an escape hatch |

Prose is stored once in the bilingual `i18n` document and surfaced under the
right tab by the `FIELDS` schema in `src/admin-ui.ts` — adding a new editable
string is one line of schema, not a new form.

File paths are never typed by hand: anywhere a logo, PDF or image is referenced
there is a **Browse** button that opens the media library and can upload on the
spot.

## Running it

```bash
npm install
cp .dev.vars.example .dev.vars     # Turnstile test key: always passes
npm run dev                        # http://localhost:8787
```

`--remote` is not usable here: Durable Objects force local mode.

```bash
npm run check      # the pre-deploy gate, on its own
npm run typecheck
npm run deploy     # runs the gate first
```

## Standing this up on your own account

Deploying gets you a working site and view counter. Four things need your own
Cloudflare account:

<details><summary><b>1 · Custom domain</b></summary>

Access needs a zone, so `workers.dev` cannot be protected. Attach a domain to
the Worker before setting up `/admin`. Leave MX and SPF alone if Email Routing
is running on the same zone.
</details>

<details><summary><b>2 · Cloudflare Access, for /admin</b></summary>

1. **Zero Trust** → *Access* → *Applications* → *Add an application* → *Self-hosted*
2. Application domain: your domain, path `admin`
3. Policy: *Allow*, **include your own email**. Do not leave it on
   `any_valid_service_token` — that locks you out of your own editor while
   letting any service token in.
4. Copy the **Application Audience (AUD) tag** and note your team domain
5. Put both into `wrangler.jsonc`:

```jsonc
"ACCESS_TEAM_DOMAIN": "<team>.cloudflareaccess.com",
"ACCESS_AUD": "<the aud tag>"
```

`/api/admin/*` is covered by the same login.
</details>

<details><summary><b>3 · Turnstile, for the contact form</b></summary>

Create a managed-mode widget covering your domain. The **site** key is public
and goes in `public/index.html`; the **secret** key is a Worker secret:

```bash
wrangler secret put TURNSTILE_SECRET
```

Until it is set, `/api/contact` answers `503 unconfigured` rather than pretending
to send.
</details>

<details><summary><b>4 · Email Routing, for delivery</b></summary>

Enable Email Routing on the zone, then set `CONTACT_FROM` to an address **on
that zone** — Cloudflare can only sign for domains it hosts. Sending is
restricted to one verified destination, so the binding cannot be used to mail
anyone else.
</details>

Your own files — logos, portrait, project PDFs, CV, link-preview image — all go
in through **Media**, no deploy and no commit. Placeholders ship with the repo so
nothing is ever a broken link.

The link-preview image is generated by `scripts/make-og.py` from the site's own
palette and background pattern, then uploaded as `img/og.png`. Facebook,
LinkedIn and WhatsApp cache preview cards hard; after changing it, run the URL
through their own debuggers to force a re-fetch.

## Endpoints

| Route | Method | Behaviour |
|---|---|---|
| `/api/views` | `POST` | Increment and return `{count}` |
| `/api/views` | `GET` | Read without incrementing |
| `/api/contact` | `POST` | `{name,email,message,token}` → validate → Turnstile → email |
| `/api/content` | `GET` | The published content as JSON |
| `/m/*` | `GET` | Media from R2 |
| `/admin` | `GET` | Editor — Access required |
| `/api/admin/*` | — | Editor API — Access required |

Contact failures are explicit, never silent: `400` incomplete or invalid email,
`413` too long, `403` bot check failed, `503` not yet configured, `502` send
failed.

## Free-tier headroom

| Resource | Free allowance | What this site uses |
|---|---|---|
| Worker invocations | 100,000/day | Page views + API |
| D1 rows read | 5,000,000/day | ~6 per page view, cached 10s per isolate |
| D1 rows written | 100,000/day | Only when you save in the editor |
| D1 storage | 5 GB | ~25 KB |
| R2 storage | 10 GB, egress free | Logos, portrait, PDFs |
| Durable Object row writes | 100,000/day | 1 per page view |

## Disclosure policy

The systems described here are internal government and enterprise software.
Operational figures taken from them have been **removed**:

- Prose describes scale qualitatively — "every parent company", "each entity
  across the groups" — never with counts.
- Numeric readouts inside the schematic drawings are drawn as **redaction bars**
  rather than deleted, so a reader can see the figure was withheld deliberately
  instead of assuming the drawing failed to render.
- The diagram legend says so outright: *"Screens redrawn · figures withheld"*.

Keep this rule when adding anything. The project screens are abstract
redrawings, not screenshots; do not paste real captures in without redacting
them first.

## Licence

Code © Randy Setiawan Hoesin. The bundled typefaces are third-party and carry
their own licences — see [`public/fonts/README.md`](public/fonts/README.md).
