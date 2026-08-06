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

## Serbuk bintang di jejaknya

38 tanda tertinggal di sepanjang lintasan, muncul saat roket melewatinya lalu
mengendap dan berkelip pelan.

Bentuknya **bukan bikinan baru**: fungsi `sparkle()` disalin dari
`src/patterns.ts` — bintang empat sudut bersisi cekung yang sudah jadi pattern
latar situs. Serbuknya karena itu terbaca sebagai tanda survei, bukan taburan
generik.

Posisinya juga tidak dihitung ulang. Diambil dari `getPointAtLength()` pada
elemen path jejak yang sama, jadi jalurnya tetap satu definisi (R-145).

### Bug waktu yang sempat terjadi, dan kenapa

Versi pertama menempatkan butir pada **posisi** yang seragam di jalur, dengan
`animation-delay` linear terhadap posisi itu. Roketnya bergerak dengan easing
`cubic-bezier(.5,0,.72,.62)` — pelan di awal, cepat di akhir. Akibatnya serbuk
menyala **mendahului** roket:

| waktu | roket di | serbuk di | selisih |
|---|---|---|---|
| 25% | 5,8% | 25% | 19% di depan |
| 50% | 25,6% | 50% | **24% di depan** |
| 75% | 60,8% | 75% | 14% di depan |

Perbaikannya membalik logikanya: butir ditempatkan pada **waktu** yang seragam,
lalu posisinya dibaca dari easing roket yang dievaluasi maju (`ease()` di dalam
IIFE `LAUNCH`). Karena sumbernya easing yang sama persis dengan animasi roket,
serbuk tidak mungkin lagi mendahului — secara konstruksi, bukan secara setelan.

Ditambah `lag` sebesar 34% lebar roket terender, supaya butirnya keluar dari
mulut nozzle dan bukan dari hidung.

Efek samping yang kebetulan benar: penempatan per-waktu membuat sebaran **rapat
di dekat peluncuran** dan **renggang saat menanjak**, persis seperti buangan
terdeposit sungguhan.

### Jebakan selector

Butir serbuk juga elemen `<path>`. Selector `#launch .arc path` akan mengenainya
dan memberi stroke sekaligus menimpa `fill`-nya — CSS mengalahkan atribut
presentasi, jadi serbuknya hilang tanpa error apa pun. Karena itu jejaknya
diberi kelas sendiri dan CSS-nya di-scope ke `.tr`.

### Kelip

Tiap butir punya periode sendiri (2,4–5,4 detik) dan jeda mulai sendiri, jadi
tidak berdenyut serempak — serempak akan terbaca seperti lampu disko, bukan
bintang. Amplitudonya turun ke 28% opasitas endapan lalu naik lagi.

Konsekuensi yang perlu diketahui: **38 animasi ini tidak pernah berhenti.**
Semuanya `opacity` dan jalan di compositor, jadi murah — tapi tidak nol. Kalau
suatu saat perlu dihemat, kurangi `DUST` atau beri kelipnya jumlah iterasi
terbatas.

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

## Setelan ada di /admin, bukan di shell

Angka kerapatan, sebaran, warna, dan durasi tinggal di dokumen `appearance`
bersama pilihan pattern latar, dan diedit lewat tab **Appearance** di `/admin`.
Menyetelnya tidak butuh deploy — sama seperti sisa konten situs ini (R-001).

```json
"launch": { "on": true, "n": 400, "spread": 140, "bright": 1, "mix": 0.5, "dur": 4.6 }
```

| Kunci | Arti | Rentang aman |
|---|---|---|
| `on` | Tampilkan atau tidak | boolean |
| `n` | Jumlah butir serbuk | 0–600 |
| `spread` | Sebaran tegak lurus jalur, px | 0–300 |
| `bright` | Opasitas endapan | 0–2 |
| `mix` | Porsi oranye | 0–1 |
| `dur` | Durasi terbang, detik | 1–20 |

**Semua nilai di-clamp di halaman** lewat `num(v, lo, hi, dflt)`. Ini bukan
kehati-hatian berlebihan: angkanya diketik tangan, dan satu nol nyasar pada `n`
akan membangun 40.000 simpul SVG dan menggantung halaman sebelum ada yang sadar
salah ketik. Nilai yang bukan angka jatuh ke bawaan, bukan ke `NaN`.

`dur` diteruskan ke CSS sebagai custom property `--rk-dur`, dan seluruh
`@keyframes` memakai `var(--rk-dur, 4.6s)`. Kalau kunci ini belum ada di D1,
bawaannya sama persis dengan nilai di atas — jadi urutan deploy bebas, shell
maupun konten boleh duluan.

## Warna bercampur, bukan terbagi

Versi pertama membelah di satu titik: 42% pertama semua oranye, sisanya semua
biru. Hasilnya dua blok warna, bukan taburan.

Sekarang tiap butir mengundi warnanya sendiri dengan peluang yang bergeser:

```
pOranye = mix × (1.35 − 0.7 × waktu)
```

Pada `mix` 0.5 itu berarti sekitar 68% oranye di dekat peluncuran dan 33% di
puncak — selalu dua warna berdampingan, cuma perbandingannya berubah. 16% dari
yang oranye memakai amber `#FFD08A`, warna inti api roketnya sendiri.

## Batas kelip

Berapa pun `n`, hanya **70 butir** yang berkelip (`TW_CAP`). Sisanya mengendap
diam. Mata tidak bisa membedakan butir mana yang berkelip di antara ratusan;
baterai bisa. Tanpa batas ini, `n` 400 berarti sekitar 168 animasi abadi.

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
- **R-151** — Apa pun yang muncul menyusul roket dijadwalkan per **waktu**, lalu
  posisinya dibaca dari `ease()`. Menjadwalkan per posisi membuatnya mendahului.
- **R-152** — Bentuk serbuk diambil dari `sparkle()` di `src/patterns.ts`.
  Jangan menggambar bentuk bintang kedua.
- **R-153** — CSS di dalam `.arc` di-scope ke kelas, tidak pernah ke elemen
  `path` telanjang — serbuknya path juga, dan akan hilang tanpa error.
- **R-154** — Kelip tiap butir wajib punya periode dan jeda sendiri. Serempak
  terbaca seperti lampu disko.
- **R-155** — Setelan animasi tinggal di dokumen `appearance`, bukan sebagai
  konstanta di shell. Menyetelnya tidak boleh butuh deploy.
- **R-156** — Setiap nilai yang datang dari `/admin` di-clamp di halaman, dengan
  nilai bukan-angka jatuh ke bawaan. Jangan percaya angka yang diketik tangan.
- **R-157** — Jumlah butir yang berkelip dibatasi `TW_CAP`, terlepas dari `n`.
