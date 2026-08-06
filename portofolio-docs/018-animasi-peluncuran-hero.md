# 018 — Animasi peluncuran di hero

Dibangun 6 Agustus 2026. Kode: blok `#launch` di `public/index.html` (CSS dekat
blok hero, markup di dalam `<section id="hero">`, IIFE `LAUNCH` di script
halaman). Prototipe empat arah dibekukan di `design/flight-anim.html`.

## Apa yang dibangun

Roket gambar-teknik bertingkat dua yang naik sekali dari bawah kiri hero,
melandai ke kanan atas, lalu keluar layar. Jejaknya digambar seiring dia naik.
Berjalan **sekali saat halaman dibuka**, tidak berulang.

## Kenapa bukan roket biasa

Halaman ini adalah lembar gambar teknik: garis tipis, title block, redaction bar,
version string. Roket berbadan penuh dengan api oranye akan terbaca seperti
stiker yang ditempel di lembar drawing.

Jadi roketnya digambar dengan konvensi yang sama seperti sisa halaman: proyeksi
ortografis, garis panel, nozzle ber-arsir, interstage ber-hatch diagonal, grid
fin, **garis ukur ber-tick** berlabel `STAGE I` dan `II`, dan leader line ke
callout `PAYLOAD`. Badannya memakai seri **`RSH-01`** — mengambil dari `RSH/01`
di header situs.

Empat perlakuan dibuat dan ditunjukkan berdampingan (garis murni, garis + jejak
buangan, dua warna, dan roket harfiah sebagai pembanding). Yang dipilih: **garis
murni dengan nyala api paling tipis**.

## Kenapa lintasannya melengkung

Hero itu lebar dan pendek. Diagonal lurus melintasinya menghasilkan sudut sekitar
14° — terbaca sebagai terbang datar, bukan meluncur.

Yang dipakai adalah bentuk **gravity turn**: curam waktu keluar dari bawah kiri,
melandai terus sampai hampir mendatar di kanan atas. Itu juga kebetulan cara
peluncuran sungguhan bekerja.

## Kenapa `offset-path`, bukan keyframe `left`/`top`

Versi pertama menganimasikan `left` dan `top` dalam persen lewat enam titik
keyframe. Dua hal rusak sekaligus:

1. **CSS meng-interpolasi lurus antar titik keyframe.** Lintasannya jadi poligon
   bersudut, dan tiap titik keyframe adalah patahan yang kelihatan.
2. **`left`/`top` memicu layout tiap frame.** Di HP itu tersendat.

Sekarang lintasannya satu kurva bezier lewat `offset-path`, dengan
`offset-rotate:auto` supaya roket berputar mengikuti garis singgung — rotasinya
mulus karena diturunkan dari kurvanya sendiri, bukan di-keyframe terpisah. Yang
berubah tiap frame hanya `offset-distance` dan `opacity`; keduanya tidak
menyentuh layout.

**Kurvanya ditulis sekali** di `curve(w, h)` lalu dipakai dua kali: jadi
`offset-path` roket, dan jadi atribut `d` jejaknya. Dua salinan pasti melenceng.

Tingginya diambil dari `#map.offsetTop`, bukan dari tinggi hero penuh — supaya
lintasannya berhenti di atas diagram sistem, yang punya animasi draw-in sendiri
dan akan ramai kalau ditimpa.

## Yang menjaganya tidak mengganggu

- **Sekali lalu berhenti.** Animasi hero yang berulang jadi gangguan dalam
  sepuluh detik, dan ini halaman yang dibaca, bukan splash screen.
- **Di belakang teks.** `#launch` di `z-index:0`, elemen identitas di `z-index:1`.
  Nama harus menang di detik pertama.
- **Ditunda 420 ms** supaya wordmark selesai naik lebih dulu.
- **`overflow:hidden`** di `#launch`, jadi roket yang keluar layar tidak
  menghasilkan scrollbar horizontal.
- **`prefers-reduced-motion` menyembunyikannya total.** Bukan mempercepat —
  override durasi global (`.001ms !important`) justru akan mengedipkannya
  melintas dalam satu frame.
- **`@supports (offset-path:...)`.** Tanpa dukungan itu roket akan diam di pojok
  kiri atas selamanya, jadi seluruh lapisan disembunyikan kecuali path-nya bisa
  diikuti.

## Ongkos

Shell naik dari 118 KB ke 124 KB. Seluruhnya SVG inline; tidak ada request
tambahan, tidak ada dependency, tidak ada gambar.

## Rules

- **R-144** — Animasi hero berjalan sekali lalu berhenti. Tidak ada looping di
  layar pertama.
- **R-145** — Lintasan didefinisikan sekali di `curve()` dan dipakai untuk
  `offset-path` maupun `d` jejaknya. Jangan disalin.
- **R-146** — Gerak lintasan memakai `offset-path` + `offset-rotate:auto`.
  Jangan kembali ke keyframe `left`/`top`: hasilnya bersudut dan memicu layout.
- **R-147** — Lapisan animasi tetap di bawah teks hero (`z-index:0` lawan `1`).
- **R-148** — `prefers-reduced-motion` menyembunyikan `#launch` sepenuhnya,
  bukan mempersingkat durasinya.
- **R-149** — Fitur yang bergantung pada CSS baru dibungkus `@supports`, dengan
  keadaan gagal berupa "tidak tampil", bukan "tampil salah".
- **R-150** — Tinggi lintasan diambil dari `#map.offsetTop`. Kalau urutan hero
  berubah, periksa lagi acuannya.
