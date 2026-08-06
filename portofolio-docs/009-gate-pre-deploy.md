# 009 — Gate pre-deploy

Kode: `scripts/check-shell.mjs` (145 baris). Terpasang di `predeploy`, jadi
`npm run deploy` tidak bisa melewatinya tanpa sengaja.

## Kenapa ada

Halaman ini pernah tayang dengan **seluruh stylesheet-nya terduplikasi ke dalam
`<body>` sebagai teks kasat mata**. Semua pemeriksaan yang berlaku saat itu
lolos — karena semuanya bertanya *"apakah X ada?"*, tidak ada yang bertanya
*"apakah X ada tepat sekali, dan apakah ada sesuatu di sana yang seharusnya
tidak?"*.

Itu perbedaan yang jadi prinsip seluruh file ini.

## Yang diperiksa

Status saat dokumen ini ditulis: **33 assertion, semuanya lolos, shell 109 KB**.

**Struktur** — `<html>`, `<head>`, `<body>`, `<style>` masing-masing tepat satu;
stylesheet berada di dalam `<head>`; `<body>` dibuka setelah `</head>`.

**Slot konten** — `<!--content-slot-->` tepat satu dan di dalam `<head>`. Slot
yang hilang berarti halaman tayang tanpa konten; slot ganda berarti konten
mendarat di tempat salah.

**Blok SEO** — kedua penanda tepat satu, berurutan, di dalam `<head>`; fallback
memuat `<title>` yang terisi; `<title>` di seluruh shell cuma satu; `og:image`
di fallback absolut atau diawali `/m/`.

**Tema** — bootstrap `localStorage.getItem("theme")` tepat satu dan di `<head>`;
tidak ada `prefers-color-scheme`; `prefers-reduced-motion` masih dipakai.

**Kebersihan CSS** — tidak ada blok aturan CSS telanjang di `<body>` (ini
pemeriksaan yang lahir dari insiden itu); kurung kurawal seimbang; tepat tiga
blok `@font-face`.

**Keseimbangan markup** — penelusuran tag dengan stack, tag void diabaikan.

**Script halaman** — diekstrak dan diperiksa dengan `node --check`. Sintaks yang
gagal akan menjatuhkan seluruh halaman, dan tidak ada transpiler yang akan
menangkapnya lebih dulu.

**Template admin** — ini bagian yang paling berharga. Admin ada di balik Access
dan tidak bisa di-fetch, jadi template yang rusak baru ketahuan sebagai halaman
kosong di browser seseorang. Pernah kejadian: sebuah placeholder tersubstitusi
menjadi `[...][]`. Jadi gate mengekstrak template dari `String.raw\`` di
`src/admin-ui.ts`, mengisi placeholder dengan nilai tiruan, lalu memeriksa
**setiap** blok `<script>` dua kali — versi terisi dan versi mentah.

**Pattern** — deklarasi `css:` / `cssLight:` diperiksa untuk separator nyasar
dan kurung tak seimbang.

## Cara pakai

```bash
npm run check                          # shell default
node scripts/check-shell.mjs <file>    # file lain
```

Hanya butuh Node builtin — jalan tanpa `npm install`. Berguna di VPS yang RAM-nya
tipis.

Keluar dengan kode 1 dan mencetak `Shell is not fit to deploy.` kalau ada yang
gagal.

## Batasnya

Gate ini memeriksa **shell dan template admin**, bukan logika Worker. Sejak
6 Agustus 2026 logika itu ditutup oleh suite terpisah yang jalan lebih dulu di
`predeploy` — lihat [016-tes-dan-modul-murni.md](016-tes-dan-modul-murni.md).

Urutan `predeploy` sekarang: `npm test` → `check-shell.mjs` → `wrangler deploy`.

## Rules

- **R-085** — Gate tetap terpasang di `predeploy`. Jangan dilepas "sementara".
- **R-086** — Pemeriksaan baru ditulis dalam bentuk *"tepat sekali"* atau
  *"tidak ada yang tak seharusnya"*, bukan sekadar *"ada"*.
- **R-087** — Setelah mengubah `public/index.html`, `src/admin-ui.ts`, atau
  `src/patterns.ts`, jalankan `npm run check` sebelum menyatakan selesai.
- **R-088** — Ekstraksi template admin bergantung pada pola `String.raw\`` …
  `\`;`. Kalau bentuk deklarasi `ADMIN_HTML` diubah, perbaiki juga ekstraktornya
  — kalau tidak, `template.length > 1000` gagal dan gate menolak deploy.
- **R-089** — Placeholder di template admin memakai bentuk `/*__NAMA__*/`. Gate
  memastikan tidak ada yang tertinggal setelah substitusi.
- **R-090** — Gate tidak boleh butuh dependency dari `npm install`.
