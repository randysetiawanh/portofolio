# 006 — SEO dan link preview

Kode: `seoBlock()` dan bagian splice di `renderPage()` (`src/index.ts`),
`seoEditor()` (`src/admin-ui.ts`), `migrations/0013_seo.sql`.

## Masalahnya

Crawler tidak menjalankan JavaScript. Kalau `<title>` dan kartu Open Graph
dibangun dari `window.__CONTENT__` di klien, Google dan WhatsApp tidak akan
pernah melihatnya. Jadi bagian ini harus dirender sebagai **markup asli** oleh
Worker.

## Mekanisme splice

Shell menyimpan salinan lengkap blok head di antara dua penanda:

```html
<!--seo-start-->
  ... title, description, og:*, twitter:card ...
<!--seo-end-->
```

`renderPage()` mencari kedua offset, mengambil isi di antaranya sebagai
**fallback**, lalu menggantinya dengan hasil `seoBlock(data.seo, fallback)`.

- Kalau dokumen `seo` tidak ada atau tanpa `title`, `seoBlock()` mengembalikan
  fallback apa adanya.
- Kalau penanda hilang atau urutannya terbalik, splice dilewati dan tag bawaan
  shell tetap tayang. Tidak fatal — isinya memang hal yang sama.

Gate pre-deploy memastikan kedua penanda ada tepat sekali, berurutan, di dalam
`<head>`, dan bahwa fallback-nya memuat `<title>` yang bisa berdiri sendiri.

## URL selalu diabsolutkan

`seoBlock()` membangun `site` dari `seo.url` (default `https://rancores.space/`),
membuang slash berlebih, lalu menempelkan path gambar relatif ke depannya.
Alasannya: beberapa crawler menolak `og:image` relatif mentah-mentah — bukan
memperbaikinya, tapi mengabaikan kartunya sama sekali.

Gate juga memeriksa bahwa `og:image` di fallback berbentuk absolut atau diawali
`/m/`.

## Escaping

Semua nilai lewat `attr()` yang meng-escape `&`, `<`, `>`, `"`. Konten ditulis
di `/admin`, dan satu tanda kutip yang lolos akan menutup atribut lebih awal dan
melempar sisa string ke dalam markup.

## Tidak dwibahasa

Dokumen `seo` sengaja **tidak** dwibahasa: satu halaman punya satu judul, dan
mesin pencari mengindeks yang disajikan. Menyediakan dua versi hanya
memindahkan pertanyaan "yang mana yang dipakai" ke tempat yang lebih sulit
dijawab.

## Editor

Tab **Sharing** memberi penghitung karakter: judul 60, deskripsi 160 — batas
praktis sebelum Google memotong. Melewati batas tidak diblokir, hanya diwarnai.

Field `ogTitle` dan `ogDescription` boleh dikosongkan; `seoBlock()` jatuh ke
`title` dan `description`.

## Gambar link preview

Dibuat oleh `scripts/make-og.py` (1200×630) dari palet dan pattern latar situs
sendiri, lalu diunggah lewat tab Media sebagai `img/og.png`. Hasilnya **tidak**
di-commit.

Dua jebakan:

- Script itu butuh Pillow **dan font sistem macOS** (`/System/Library/Fonts/`).
  Di VPS Linux script ini tidak jalan tanpa mengganti path fontnya.
- Facebook, LinkedIn, dan WhatsApp meng-cache kartu preview dengan keras.
  Setelah mengganti gambar, jalankan URL-nya lewat debugger masing-masing untuk
  memaksa re-fetch. Kalau tidak, kelihatan seperti perubahannya gagal.

## Rules

- **R-059** — Metadata SEO dirender sebagai markup oleh Worker, tidak pernah
  disusun di klien.
- **R-060** — Penanda `<!--seo-start-->` dan `<!--seo-end-->` harus tetap ada
  tepat sekali, berurutan, di dalam `<head>`.
- **R-061** — Isi di antara kedua penanda harus tetap valid sebagai fallback
  mandiri, termasuk `<title>` yang terisi.
- **R-062** — Semua URL di blok SEO diabsolutkan sebelum dirender.
- **R-063** — Semua nilai yang masuk atribut lewat `attr()`.
- **R-064** — Dokumen `seo` tetap satu bahasa. Jangan mengubahnya jadi `{en, id}`.
- **R-065** — Setelah mengganti `img/og.png`, paksa refresh cache di debugger
  Facebook, LinkedIn, dan X sebelum menyimpulkan ada yang rusak.
