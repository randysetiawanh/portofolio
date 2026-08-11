# 011 — Deploy dan operasional

## Perintah

```bash
npm install
cp .dev.vars.example .dev.vars     # site key Turnstile mode tes: selalu lolos
npm run dev                        # http://localhost:8787

npm run check                      # gate pre-deploy, berdiri sendiri
npm run typecheck                  # tsc --noEmit
npm run deploy                     # menjalankan gate lebih dulu
npm run tail                       # log produksi
npm run types                      # regenerate tipe binding
```

`wrangler dev --remote` **tidak bisa dipakai** di sini: Durable Object memaksa
mode lokal.

## Catatan untuk VPS ini

RAM total mesin 1.9 GB dan dipakai bersama sesi Claude lain. `npm install` di
project ini menarik `wrangler` yang berat — sebutkan dulu ke Randy sebelum
menjalankannya, jangan langsung hantam.

`npm run check` aman: hanya Node builtin, tidak butuh `node_modules`.

`scripts/make-og.py` butuh Pillow dan font sistem macOS. Di Linux script ini
gagal kecuali path fontnya diganti.

## Binding dan variabel

Semua di `wrangler.jsonc`:

| Nama | Jenis | Keterangan |
|---|---|---|
| `ASSETS` | Assets | Direktori `./public` |
| `CONTENT` | D1 | Database `portfolio-content` |
| `MEDIA` | R2 | Bucket `portfolio-media` |
| `COUNTER` | Durable Object | Kelas `ViewCounter`, migration tag `v1` |
| `MAILER` | send_email | Tujuan tunggal terverifikasi |
| `CONTACT_TO` / `CONTACT_FROM` | var | `CONTACT_FROM` harus di zone yang sama |
| `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` | var | Sampai keduanya terisi, `/admin` menolak semua request |

**Satu-satunya secret** adalah `TURNSTILE_SECRET`, dipasang lewat
`wrangler secret put TURNSTILE_SECRET`. Site key Turnstile bersifat publik dan
tinggal di `public/index.html` — jangan diduplikasi ke `wrangler.jsonc`.

Untuk development lokal, nilai ada di `.dev.vars` (tidak di-commit,
`.dev.vars.example` yang jadi contoh).

## Yang butuh akun Cloudflare sendiri

Deploy polos sudah menghasilkan situs dan counter yang jalan. Empat hal butuh
setup terpisah, dan urutannya penting:

1. **Custom domain.** Access butuh zone, jadi `workers.dev` tidak bisa
   dilindungi. Pasang domain sebelum menyiapkan `/admin`.
2. **Cloudflare Access** untuk `/admin`. Policy harus *Allow* dengan email
   sendiri sebagai include. Jangan biarkan di `any_valid_service_token` — itu
   mengunci pemilik dari editornya sendiri sekaligus meloloskan service token
   mana pun.
3. **Turnstile** mode managed untuk form kontak.
4. **Email Routing** di zone yang sama, lalu set `CONTACT_FROM` ke alamat di
   zone itu.

## Batas free tier

| Sumber daya | Jatah | Pemakaian |
|---|---|---|
| Worker invocation | 100.000/hari | Page view + API |
| D1 rows read | 5.000.000/hari | ~6 per page view, di-cache 10 detik per isolate |
| D1 rows written | 100.000/hari | Hanya saat menyimpan di editor |
| D1 storage | 5 GB | ~25 KB |
| R2 storage | 10 GB, egress gratis | Logo, potret, PDF |
| DO row writes | 100.000/hari | 1 per page view |

Yang paling dekat ke batas adalah DO row write dan Worker invocation, keduanya
terikat jumlah page view. Pada 100.000 kunjungan/hari barulah jadi masalah.

## Observability

`observability.enabled` menyala, jadi log tersedia di dashboard dan lewat
`npm run tail`. `console.error` dipakai di dua tempat: slot konten hilang, dan
pengiriman email gagal.

## Rules

- **R-102** — Deploy selalu lewat `npm run deploy` supaya gate ikut jalan.
  Jangan panggil `wrangler deploy` langsung.
- **R-103** — `TURNSTILE_SECRET` satu-satunya secret. Kalau muncul secret baru,
  pasang lewat `wrangler secret put`, jangan pernah ke `wrangler.jsonc`.
- **R-104** — Nilai kredensial tidak pernah ditulis ke repo, termasuk ke folder
  docs ini. Yang boleh dicatat cuma letaknya.
- **R-105** — Sebelum `npm install` atau build di VPS ini, beri tahu Randy
  dulu. RAM 1.9 GB dipakai bersama sesi lain.
- **R-106** — Jangan pakai `wrangler dev --remote`; Durable Object memaksa mode
  lokal dan hasilnya menyesatkan.
- **R-107** — Policy Access wajib memakai include berbasis email. Jangan
  `any_valid_service_token`.
- **R-108** — Working tree harus bersih sebelum menutup sesi. Commit di feature
  branch boleh tanpa bertanya; push, menyentuh branch utama, dan bikin PR tunggu
  arahan.
- **R-109** — Pesan commit tanpa watermark AI apa pun. Satu judul ringkas,
  tanpa body.
