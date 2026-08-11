# 008 — API publik

Kode: `handleViews()`, `handleContact()`, kelas `ViewCounter`, dan cabang
`/api/content` di `src/index.ts`.

## Ringkasan

| Route | Method | Perilaku |
|---|---|---|
| `/api/views` | POST | Naikkan lalu kembalikan `{count}` |
| `/api/views` | GET | Baca tanpa menaikkan |
| `/api/contact` | POST | `{name,email,message,token}` → validasi → Turnstile → email |
| `/api/content` | GET | Konten yang tayang, sebagai JSON |
| `/api/*` lain | — | `404 {"error":"not_found"}` |

Semua respons JSON memakai `cache-control: no-store`.

## View counter — Durable Object, bukan KV

`ViewCounter` adalah Durable Object dengan storage SQLite. Tabelnya dibuat di
constructor (`CREATE TABLE IF NOT EXISTS hits`), satu baris `id = 1`.

Alasan memilih DO: free plan KV hanya memberi **1.000 write per hari**. Counter
per-kunjungan berhenti bekerja di kunjungan ke-1000. DO row write dapat
**100.000 per hari**.

Cuma ada satu instance, dinamai `"site"` lewat `idFromName`. Jangan menambah
instance per-halaman kecuali memang mau angka terpisah.

## Form kontak

Urutan pemeriksaannya penting dan tiap kegagalan punya kode sendiri — tidak ada
kegagalan diam:

| Situasi | Kode |
|---|---|
| Body bukan JSON | `400 malformed` |
| Ada field kosong | `400 incomplete` |
| Format email salah | `400 email` |
| Melewati batas panjang | `413 too_long` |
| `TURNSTILE_SECRET` belum diset | `503 unconfigured` |
| Turnstile menolak | `403 bot_check` |
| `MAILER` tidak terikat | `503 mail_unconfigured` |
| Pengiriman gagal | `502 send_failed` |
| Berhasil | `200 {ok:true}` |

Batas panjang: nama 100, email 254, pesan 5000 (`MAX`).

Kalau Turnstile belum dikonfigurasi, endpoint menjawab `503`, **bukan** berpura-
pura mengirim. Form yang diam-diam membuang pesan lebih buruk daripada form yang
mengaku rusak.

## Pengiriman email

`buildMime()` merakit pesan tangan karena binding Email Routing menerima MIME
mentah:

- `From` selalu `CONTACT_FROM` — harus alamat **di zone yang sama**, karena
  Cloudflare hanya bisa menandatangani domain yang dia hosting.
- `Reply-To` diisi nama dan email pengirim, sehingga membalas langsung menuju
  ke orangnya.
- Nama dan email dilewatkan `headerSafe()` yang membuang CR/LF — ini pertahanan
  terhadap header injection.
- Nilai non-ASCII di-encode `=?utf-8?B?...?=`; body di-base64 dan dipatahkan tiap
  76 karakter sesuai batas MIME.

Tujuan pengiriman dibatasi satu alamat terverifikasi di `wrangler.jsonc`, jadi
binding ini tidak bisa dipakai mengirim ke sembarang orang.

## `/api/content`

Mengembalikan seluruh konten yang tayang plus `version`. Ini publik dan memang
disengaja — isinya sudah tampil di halaman. Jangan menaruh apa pun yang tidak
boleh dibaca orang di dokumen konten.

## Rules

- **R-073** — Counter tetap di Durable Object. Jangan dipindah ke KV.
- **R-074** — Tetap satu instance counter (`idFromName("site")`).
- **R-075** — Kegagalan kontak selalu punya kode HTTP dan `error` yang spesifik.
  Jangan menyeragamkannya jadi `500` atau `200`.
- **R-076** — Kalau Turnstile atau MAILER belum siap, jawab `503`. Jangan
  pernah pura-pura berhasil.
- **R-077** — Semua nilai yang masuk header email lewat `headerSafe()`.
- **R-078** — `CONTACT_FROM` harus alamat di zone yang di-host Cloudflare.
- **R-079** — Batas panjang input diperiksa **sebelum** memanggil Turnstile,
  supaya payload besar tidak memicu request keluar.
- **R-080** — `/api/content` publik. Jangan menaruh data sensitif di dokumen
  konten mana pun.
