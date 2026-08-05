# 012 — Kebijakan disclosure

Sistem yang ditampilkan di situs ini adalah perangkat lunak internal pemerintah
dan enterprise. Angka operasional yang berasal dari sana **dihapus**, dan cara
menghapusnya sendiri adalah keputusan desain.

## Tiga aturan yang sudah berjalan

**Prosa menyebut skala secara kualitatif.** "Setiap induk perusahaan", "tiap
entitas di seluruh grup" — tidak pernah dengan angka.

**Angka di dalam gambar skematik digambar sebagai redaction bar, bukan
dihilangkan.** Ini bedanya penting: pembaca bisa melihat bahwa angkanya
*ditahan dengan sengaja*, bukan menyimpulkan gambarnya gagal render. Menghapus
begitu saja terbaca seperti bug; batang sensor terbaca seperti kebijakan.

**Legenda diagram mengatakannya terang-terangan** — *"Screens redrawn · figures
withheld"*.

## Gambar proyek

Semua visual proyek adalah **redrawing abstrak**, bukan tangkapan layar. SVG
sketch (`donut`, `portal`, `line`, `table`, `curve`, `phone`, `grid`) ditulis
tangan di `public/index.html`.

Pola yang dipakai di sketch: batang abu-abu (`fill:var(--dim)` dengan
`opacity:.3`) menggantikan angkanya, diikuti label yang menjelaskan angka apa
itu — misalnya `[▓▓▓] LETTERS DISPATCHED`. Bentuk itu yang harus ditiru sketch
baru.

**Satu pelanggaran yang masih ada.** Sketch `phone` di `public/index.html:1081`
memuat teks literal `65 STATE ENTERPRISES` — angka konkret dari sistem klien,
persis yang seharusnya jadi redaction bar. Ini belum diperbaiki. Kalau menyentuh
area itu, ganti jadi batang sensor dengan label `STATE ENTERPRISES`.

Sisa teks di sketch (nama laporan, periode, nominal Rupiah contoh) bersifat
ilustratif, bukan data nyata. Tapi kalau menambah sketch baru, jangan menyalin
string dari sistem sungguhan, termasuk nama entitas dan nominal.

## Kalau menambah konten baru

Yang harus ditanya sebelum menempelkan apa pun:

- Apakah ini angka yang berasal dari sistem klien? Kalau ya, sensor.
- Apakah ini tangkapan layar? Kalau ya, gambar ulang atau redaksi dulu.
- Apakah nama entitas, pegawai, atau nomor dokumen ikut terbawa? Buang.
- Apakah PDF di `porto/` sudah bersih? PDF paling gampang lolos karena isinya
  tidak terbaca saat review kode.

## Rules

- **R-113** — Angka operasional dari sistem klien tidak pernah tayang. Skala
  dinyatakan kualitatif.
- **R-114** — Angka yang ditahan digambar sebagai redaction bar, bukan dihapus.
- **R-115** — Legenda diagram harus tetap menyatakan bahwa layar digambar ulang
  dan angka ditahan.
- **R-116** — Tidak ada tangkapan layar asli. Visual proyek adalah redrawing.
- **R-117** — Sebelum mengunggah PDF ke `porto/`, periksa isinya untuk nama
  entitas, nama orang, nomor dokumen, dan nominal.
- **R-118** — Sketch SVG baru tidak boleh menyalin string dari sistem
  sungguhan.
