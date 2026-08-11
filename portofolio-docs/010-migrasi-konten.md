# 010 — Migrasi konten

Folder: `migrations/`. Sampai dokumen ini ditulis ada 13 file, `0001`–`0013`.

## Pola yang tidak biasa

Migration di sini bukan cuma perubahan skema. Setelah `0001`, hampir semuanya
adalah **perubahan konten** — karena konten memang tinggal di D1, dan D1 tidak
punya jalur lain yang bisa direview lewat git.

Konsekuensinya: riwayat `migrations/` adalah riwayat editorial situs ini, bukan
riwayat skema. Itu disengaja. Baca komentar di kepala tiap file untuk tahu
maksud perubahannya.

## Riwayat

| File | Isi |
|---|---|
| `0001_init` | Tiga tabel: `content`, `media`, `meta` |
| `0002_seed` | Seed `domains`, `layers`, `projects`, `timeline` dari array yang dulu ditulis tangan di `index.html` |
| `0003_extract` | Angkat `contact`, `credentials`, `footer`, `identity`, `stats` keluar dari `index.html` supaya bisa diedit |
| `0004_freelance` | Riwayat freelance sepuluh tahun, mendahului semua pekerjaan lain |
| `0005_client_layer` | Lapis yang menghadap klien: `services`, `practice`, rute kontak |
| `0006_reframe` | Reframing `layers` dan `services` |
| `0007_appearance` | Pattern latar jadi setelan konten, editable di `/admin` |
| `0008_badge` | Ketersediaan tampil sebagai badge; kunci `i18n` yatim dibuang |
| `0009_prune` | Sisa dokumen dari pemindahan blok ke section terstruktur |
| `0010_position` | Baris posisi di hero jadi konten; label lama dibuang |
| `0011_cv_sync` | Menyelaraskan situs dengan CV bertanggal 3 Agustus 2026 |
| `0012_cv_upload` | CV terbit di R2 dan ditautkan; chip Infrastructure dipecah |
| `0013_seo` | `title`, `description`, kartu link preview keluar dari shell |
| `0014_pdf_viewer` | Baris CV berhenti memaksa unduh; label jadi dwibahasa `{en,id}`, flag `viewer` membuka sheet PDF di halaman |
| `0015_cv_thumb` | Thumbnail CV (`thumb`) untuk baris viewer |

## Konvensi

Tiap migration konten melakukan dua hal: mengubah dokumen, lalu
**menaikkan `meta.version`**. Yang kedua gampang lupa dan akibatnya cache
per-isolate menyajikan konten lama lebih lama dari seharusnya.

Perubahan yang menghapus kunci `i18n` memakai `json_remove` pada dokumen
`i18n`, bukan `DELETE`. Yang dihapus adalah kunci di dalam blob JSON, bukan
barisnya.

Migration `0008`, `0009`, dan `0010` semuanya membuang kunci yatim, dan
alasannya sama: setelah sebuah blok pindah ke section terstruktur, kunci lamanya
tidak akan pernah dirender lagi — tapi admin masih menampilkan field untuknya.
**Field yang mengedit sesuatu yang tidak pernah tampil itu membohongi
pemakainya.** Buang kuncinya di migration yang sama dengan pemindahannya.

## Menjalankan — baca ini dulu

**Jangan pernah menjalankan `d1 migrations apply --remote` di database produksi.**

Riwayat migration database ini tidak dilacak di sisi remote. Perintah itu akan
memutar ulang seed lama di atas konten yang sudah diedit lewat `/admin`, dan
editan `/admin` tidak punya jejak di mana pun — hilangnya permanen.

Yang benar, satu file pada satu waktu:

```bash
npx wrangler d1 execute portfolio-content --remote --file migrations/0016_xxx.sql
```

Untuk database lokal, `apply` masih aman:

```bash
npx wrangler d1 migrations apply portfolio-content --local
```

Nama database ada di `wrangler.jsonc` (binding `CONTENT`).

Konsekuensi lain dari fakta yang sama: migration yang menyentuh section yang
sering diedit di `/admin` (`contact`, `identity`, `seo`) harus ditulis terhadap
**nilai live yang dibaca saat itu**, bukan terhadap nilai di migration
sebelumnya. `0014_pdf_viewer` melakukannya dan mencatat apa saja yang ternyata
sudah berubah lewat `/admin` — href WhatsApp, label LinkedIn, URL Upwork.

## Rules

- **R-093** — Perubahan konten yang perlu jejak review masuk lewat migration,
  bukan lewat `/admin`. Editan di `/admin` tidak punya riwayat sama sekali.
- **R-094** — Tiap migration konten wajib menaikkan `meta.version`.
- **R-095** — Tiap migration diawali komentar yang menjelaskan **maksud**
  perubahannya, bukan mekanismenya. Itu satu-satunya konteks yang tersisa nanti.
- **R-096** — Kunci `i18n` yang jadi yatim dibuang dengan `json_remove` di
  migration yang sama dengan pemindahannya.
- **R-097** — Migration tidak pernah di-edit setelah diterapkan. Perubahan
  berikutnya jadi file baru.
- **R-098** — Penomoran empat digit berurutan, dengan slug pendek yang
  menjelaskan maksud. Nomor terpakai terakhir: `0015`.
- **R-100** — Jangan pernah `d1 migrations apply --remote` di produksi. Pakai
  `d1 execute --remote --file <satu file>`.
- **R-101** — Migration yang menyentuh section yang bisa diedit di `/admin`
  ditulis terhadap nilai live yang dibaca saat itu, dan mencatat perbedaan yang
  ditemukan.
- **R-099** — Kalau sebuah editan di `/admin` ternyata penting untuk dijaga
  (misalnya menghasilkan struktur baru), tulis ulang jadi migration supaya
  environment lain bisa menyusul.
