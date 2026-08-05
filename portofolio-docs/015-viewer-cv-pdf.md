# 015 — Viewer CV PDF

Dibangun 5 Agustus 2026 di laptop (commit `0fbe79c`). Kode: blok `PDF VIEWER` di
`public/index.html`, `public/vendor/pdfjs/`, `migrations/0014_pdf_viewer.sql`,
`migrations/0015_cv_thumb.sql`.

## Bentuk

Baris **Curriculum vitae** di daftar kontak berhenti memaksa unduh. Sekarang dia
membuka CV di dalam halaman lewat sheet layar penuh (`#pdfview`), dan tombol
unduh pindah ke title bar sheet itu.

Pemicunya dari data, bukan dari markup: migration `0014` menambahkan
`"viewer": true` ke baris CV di dokumen `contact`, dan `buildDirect()`
memasang `data-viewer` pada baris yang punya flag itu.

```js
document.querySelectorAll("#direct a[data-viewer]").forEach(function(a){
  a.addEventListener("click", function(e){ e.preventDefault(); openPdf(a.href); });
});
```

Yang di-intercept hanya klik kiri polos. Klik tengah dan "buka di tab baru"
tetap sampai ke file PDF-nya sendiri.

## Kenapa PDF.js, bukan `<iframe>`

Ini keputusan yang paling gampang dibalik oleh orang yang tidak tahu alasannya,
jadi ditulis tegas: **browser tidak sepakat soal menampilkan PDF di dalam
frame.** Safari sering menolak sama sekali, dan Chrome di Android biasanya malah
memicu unduhan. Karena situs ini dipantau dari iPhone, `<iframe>` berarti sheet
kosong di perangkat pemiliknya sendiri.

Jadi halamannya digambar sendiri ke `<canvas>` dengan PDF.js yang di-host
sendiri di `public/vendor/pdfjs/`.

Pernah dicoba mengganti sheet ini dengan `<iframe>` (5 Agustus 2026) dan
dibatalkan justru karena alasan di atas.

## Perilaku muat

- Runtime PDF.js diambil lewat `import()` dinamis, jadi tidak ikut dalam beban
  halaman sampai ada yang benar-benar membuka CV.
- Progress dicetak besar di tengah (`FETCHING RENDERER…`, `LOADING PDF… 42%`).
  Alasannya: runtime plus PDF-nya beberapa MB, dan label kecil di pojok terbaca
  seperti panel yang rusak.
- Kegagalan tidak pernah diam. `catch` menampilkan `RENDERER FAULT` beserta
  pesan aslinya **dan** tautan "Open the PDF ↗" ke tab baru — viewer bawaan
  browser jalan bahkan di tempat render dalam frame tidak.
- `paintPdf()` menyimpan `data-doc` di host, jadi membuka sheet dua kali tidak
  merender ulang.

Catatan versi: PDF.js v6 membuang semua bentuk singkat. Hanya
`getDocument({url: <string absolut>})` yang bekerja.

## Wajib legacy build, bukan modern

Versi ter-vendor: **6.2.108**, file `pdf.legacy.min.mjs` dan
`pdf.worker.legacy.min.mjs`.

Build **modern** dari versi ini memanggil `Map.prototype.getOrInsertComputed`
(16× di pustaka, 15× di worker). Itu proposal TC39 yang sejauh ini baru dikirim
Firefox — Safari tidak punya, Chrome stabil juga belum. Akibatnya di iPhone
viewer mati dengan:

```
RENDERER FAULT — this.#ra.getOrInsertComputed is not a function
```

Build **legacy** membawa polyfill core-js untuk method itu:

```js
n({target:"Map",proto:!0,real:!0,forced:a},{getOrInsertComputed:function …})
```

Nama filenya sengaja memuat kata `legacy` supaya tidak ada yang menukarnya balik
ke build modern tanpa sadar. Kegagalannya senyap di CI mana pun: gate lolos,
desktop Chrome jalan, dan hanya Safari yang mati.

Ongkosnya 512 KB + 1.31 MB, naik ~110 KB dari build modern. Tetap lazy-load.

## Jebakan cache saat deploy aset baru

Memverifikasi URL aset baru **beberapa detik setelah deploy** bisa menanam
respons 404 di cache edge Cloudflare: request datang sebelum aset menyebar,
dapat halaman 404, dan respons itu ikut ter-cache untuk URL tersebut.

Gejalanya menipu — URL polos mengembalikan halaman 404 sementara file yang sama
dengan `?v=1` mengembalikan isi yang benar.

Cara memeriksa dengan aman: pakai `https://randysetiawan-portfolio.randysetiawanh.workers.dev/<path>`
dulu, yang lepas dari cache zone. Kalau di sana benar, deploy-nya berhasil dan
yang tersisa cuma menunggu cache zone lepas.

Token deploy yang dipakai sekarang **tidak punya izin Cache Purge**, jadi purge
lewat API tidak tersedia.

## Panel inline yang dibuang

Semula ada `#cvpane` — panel CV yang selalu tampil di kolom kanan section
Contact, memakai renderer yang sama, dengan `IntersectionObserver` supaya baru
merender saat sectionnya mendekat.

Dibuang 5 Agustus 2026 atas permintaan Randy: CV tidak perlu terpampang di
halaman depan, cukup dibuka kalau diminta.

Yang ikut hilang: CSS `#cvpane*`, markup panelnya, `watchPane()`, dan blok pane
di `buildDirect()`. Yang **tetap ada**: `#pdfview`, `openPdf()`, `paintPdf()`,
`closePdf()`, dan seluruh `vendor/pdfjs/`.

Kolom kanan sekarang cuma `.direct` di dalam `.dcol`. `.dcol` punya
`align-content:start`, dan itulah yang mencegah `.direct` diregangkan setinggi
kolom form — tanpa itu, background `--rule` milik `.direct` tampil sebagai
bidang abu-abu kosong di bawah baris terakhir.

## Rules

- **R-128** — Sheet CV merender ke canvas dengan PDF.js. Jangan ganti dengan
  `<iframe>`: Safari menolak dan Android Chrome mengunduh.
- **R-134** — Selalu pakai **legacy build** PDF.js. Build modern memanggil
  `Map.prototype.getOrInsertComputed` yang tidak ada di Safari. Nama file wajib
  memuat `legacy`.
- **R-135** — Jangan memverifikasi URL aset baru dalam hitungan detik setelah
  deploy; itu menanam 404 di cache edge. Cek lewat `*.workers.dev` lebih dulu.
- **R-129** — Runtime PDF.js hanya boleh dimuat lewat `import()` dinamis saat
  dibutuhkan, tidak pernah sebagai `<script>` di shell.
- **R-130** — Kegagalan render wajib menampilkan pesan sebenarnya plus tautan
  ke tab baru. Panel kosong tanpa keterangan dilarang.
- **R-131** — Baris yang membuka viewer ditentukan flag `viewer` di dokumen
  `contact`, bukan dengan menebak dari ekstensi `.pdf` pada href.
- **R-132** — Hanya klik kiri polos yang di-intercept. Klik tengah dan buka-di-
  tab-baru harus tetap mencapai filenya.
- **R-133** — `.dcol` wajib mempertahankan `align-content:start`. Tanpa itu
  background `.direct` bocor jadi bidang kosong.
