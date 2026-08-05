# 014 — Path di layar sempit

Perubahan 4 Agustus 2026. Kode: blok `@media (max-width:820px)` untuk gantt dan
fungsi `buildPath()` di `public/index.html`.

## Masalahnya

Section Path memakai gantt. Di layar sempit gantt itu rusak fungsinya, karena
empat hal yang menumpuk:

1. **Skalanya keluar layar.** `.axis` digambar sekali di puncak gantt. Saat
   pembaca sampai ke entri ketiga, sumbunya sudah tidak terlihat, jadi posisi
   horizontal batang tidak bisa dibaca terhadap apa pun.
2. **Batangnya terlalu pendek.** Rentangnya 11 tahun. Penempatan 5 bulan =
   3,8% lebar track ≈ 12 px. Itu titik, bukan durasi.
3. **Durasi tidak bisa diakses.** Satu-satunya tempat durasi muncul adalah
   tooltip `#tip`, dan `@media (hover:none){#tip{display:none}}` mematikannya di
   layar sentuh.
4. **Tanggal sudah dicetak sebagai teks.** Jadi batang itu mengulang informasi
   yang sudah ada, sambil menambah kebingungan.

## Yang dipilih

Tiga arah dibuat sebagai prototipe di `design/path-mobile.html` — batang durasi,
rel datum, dan baris register. Randy memilih **batang durasi**.

Batang berhenti menjawab *kapan* dan mulai menjawab *berapa lama*:

- Semua batang mulai dari kiri (`left:0`).
- Lebarnya durasi entri dibanding **entri terpanjang**, bukan dibanding seluruh
  rentang. Minimum 4% supaya penempatan sebulan tetap terlihat.
- Durasi dicetak sebagai `.dur` di kanan batang, bukan disembunyikan di tooltip.
- `.axis` disembunyikan — tidak ada lagi yang bisa dibaca darinya.
- `.bar.now::after` (gradien memudar ke kanan) dimatikan. Di layout lebar itu
  menandakan "belum berakhir"; di sini lebar batang **adalah** durasinya, jadi
  memudarkan ujungnya justru merusak pembacaan.

## Geometri lewat custom property

Ini bagian yang paling gampang bikin tersandung nanti.

Dulu `buildPath()` menulis `style="left:X%;width:Y%"` langsung ke batang.
Inline style mengalahkan CSS, jadi media query tidak bisa menimpanya tanpa
`!important`. Sekarang yang ditulis adalah custom property:

```
style="--l:<posisi>%;--w:<lebar posisi>%;--d:<lebar durasi>%"
```

- Layout lebar: `.bar{left:var(--l);width:var(--w)}`
- Layout sempit: `.bar{left:0;width:var(--d)}`

Tidak ada `!important` sama sekali. Kalau menambah varian layout lain, ikuti
pola ini — jangan kembali ke inline `left`/`width`.

## Urutan terbaru di atas

`.grp` jadi `display:flex; flex-direction:column-reverse` di layar sempit,
dengan `.grp > .lbl{order:1}` supaya judul grup tetap di atas.

Urutan **DOM tetap kronologis**. Yang dibalik cuma urutan visual. Konsekuensinya:
pembaca layar dan layout lebar tetap membaca dari yang paling lama, sementara
layar sempit menampilkan yang terbaru dulu — konvensi CV. Ini trade-off yang
diketahui, bukan kelalaian.

## Struktur baris

`.row-t` sekarang punya lima anak: `.mark`, `.who`, `.when`, `.trk`, `.dur`.

`.dur` `display:none` di layout lebar. Itu **wajib** `display:none`, bukan
`visibility` atau `opacity` — grid lebar mendefinisikan empat kolom, dan anak
kelima yang masih ikut layout akan tumpah ke baris berikutnya.

Grid sempitnya:

```
grid-template-columns: 30px minmax(0,1fr) auto;

  [mark]  [who + ROLE]        [when]
  [mark]  [track bar]         [dur]
```

## Prototipe dan preview

- `design/path-mobile.html` — ketiga arah berdampingan, memakai data timeline
  asli dan palet asli. Dibekukan sebagai catatan keputusan, sama seperti
  `design/preview.html`.
- `scripts/preview-build.mjs` — menyuntikkan konten live dari
  `https://rancores.space/api/content` ke `public/index.html` supaya halaman
  aslinya bisa dilihat tanpa deploy. Referensi `/m/` ditulis ulang ke situs live
  supaya media tetap muncul.

```bash
curl -s https://rancores.space/api/content -o /tmp/live-content.json
node scripts/preview-build.mjs                 # → /tmp/pathprev/live.html
```

VPS ini hanya membuka port 22, jadi menyajikannya lewat port biasa tidak sampai
ke luar. Yang dipakai: `cloudflared tunnel --url http://127.0.0.1:<port>` dengan
binary di `~/bin/cloudflared`. URL-nya acak, publik, dan sementara.

## Rules

- **R-122** — Geometri batang dikirim sebagai custom property (`--l`, `--w`,
  `--d`), bukan sebagai inline `left`/`width`. Jangan pakai `!important` untuk
  menimpanya.
- **R-123** — Di layar sempit, batang menyatakan durasi, bukan posisi waktu.
  Skalanya terhadap entri terpanjang, dengan lantai 4%.
- **R-124** — Durasi wajib tercetak, tidak boleh hanya di tooltip. `#tip` mati
  di `hover:none`, jadi apa pun yang hanya ada di sana tidak ada di HP.
- **R-125** — `.dur` disembunyikan dengan `display:none` di layout lebar. Jangan
  diganti `visibility` atau `opacity`; grid empat kolomnya akan pecah.
- **R-126** — Urutan DOM timeline tetap kronologis. Pembalikan visual hanya
  lewat `column-reverse` di media query.
- **R-127** — Setelah mengubah layout Path, periksa di lebar sempit **dan**
  lebar penuh. Keduanya berbagi satu markup, jadi perubahan di satu sisi
  gampang merembes.
