# 001 — Arsitektur

## Apa yang dibangun

Portofolio pribadi `rancores.space`, jalan sepenuhnya di Cloudflare free tier.
Satu Worker TypeScript, tanpa framework dan tanpa build step — Wrangler
mem-bundle `src/index.ts` apa adanya.

Layanan yang dipakai dan perannya:

| Layanan | Binding | Peran |
|---|---|---|
| Workers | — | Routing, injeksi konten, API |
| Workers Assets | `ASSETS` | Shell HTML, font, gambar, PDF bawaan |
| D1 | `CONTENT` | Semua konten teks, sebagai dokumen JSON |
| R2 | `MEDIA` | Logo, potret, PDF portofolio, CV, gambar OG |
| Durable Object | `COUNTER` | View counter (`ViewCounter`, SQLite-backed) |
| Cloudflare Access | — | Penjaga `/admin` dan `/api/admin/*` |
| Turnstile | — | Bot check form kontak |
| Email Routing | `MAILER` | Pengiriman pesan kontak |

## Ide dasar: repo tidak menyimpan konten

`public/index.html` cuma **shell** — markup, CSS, `@font-face`, dan penanda
`<!--content-slot-->` di `<head>`. Semua string, proyek, logo, dan tanggal ada di
D1; Worker menyuntikkannya sebagai `window.__CONTENT__` saat request.

Konsekuensi yang harus diingat:

- Mengubah teks, proyek, urutan, atau latar = langsung live, **tanpa deploy**.
- Mengubah layout, CSS, atau animasi = tetap butuh `npm run deploy`.
- Kalau sebuah string ada di `index.html` sebagai teks literal, itu **bug**,
  bukan fitur. Tempatnya di D1.

## Alur request

```
request
  │
  ├─ hostname diawali "www."  → 301 ke apex
  │
  ├─ /m/*                     → serveMedia()   R2, etag + cache 300s
  │
  ├─ /admin, /admin/,
  │  /api/admin/*             → verifyAccess() → gagal: 403 (atau 503 kalau
  │                                              Access belum dikonfigurasi)
  │                             lolos: ADMIN_HTML atau handleAdminApi()
  │
  ├─ /api/views               → handleViews()   Durable Object
  ├─ /api/contact             → handleContact() Turnstile → Email Routing
  ├─ /api/content             → readAll()       JSON publik
  ├─ /api/* lainnya           → 404 JSON
  │
  ├─ /                        → renderPage()    shell + konten D1
  └─ selain itu               → env.ASSETS.fetch()
```

Router-nya ada di `src/index.ts:329`.

## Static-first

`wrangler.jsonc` menyetel `run_worker_first` hanya untuk `/`, `/api/*`,
`/admin`, `/admin/`, dan `/m/*`. Semua aset lain — font, gambar, PDF di
`public/` — disajikan langsung dari edge tanpa membangunkan Worker.

Alasannya kuota: free tier memberi 100.000 invocation/hari. Kalau setiap
permintaan font dan gambar ikut menghitung, satu kunjungan bisa memakan
belasan invocation. Dengan pola ini, satu kunjungan = satu invocation untuk `/`
plus API yang benar-benar dipanggil.

## Kanonikalisasi hostname

`www.` di-redirect 301 ke apex di baris pertama router. `www` memang
di-attach ke Worker supaya namanya resolve sama sekali — tanpa record, browser
gagal dengan `ERR_NAME_NOT_RESOLVED`, bukan sekadar tidak bisa dibuka. Tapi
canonical tag, sitemap, dan aplikasi Access semuanya menunjuk ke apex, jadi
kunjungan `www` harus dibuang ke sana.

## Rules

- **R-001** — Konten tidak pernah di-hardcode di `public/index.html`. Kalau
  butuh string baru di halaman, tambahkan ke dokumen `i18n` di D1 dan satu baris
  di `FIELDS` (`src/admin-ui.ts`).
- **R-002** — Jangan menambah path ke `run_worker_first` kecuali path itu
  memang butuh logika Worker. Setiap tambahan memotong kuota invocation.
- **R-003** — Redirect `www` harus tetap jadi cabang pertama di router.
  Menaruhnya setelah cabang lain berarti `www.rancores.space/admin` diproses
  dengan hostname yang tidak dikenal aplikasi Access.
- **R-004** — Tidak ada framework dan tidak ada build step. Kalau muncul
  kebutuhan bundler, itu keputusan besar — bahas dulu, jangan diam-diam
  menambah toolchain.
- **R-005** — Semua binding didefinisikan di `wrangler.jsonc`. Jangan mengakses
  layanan Cloudflare lewat REST API dari dalam Worker kalau bindingnya tersedia;
  binding tidak kena biaya request keluar.
