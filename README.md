# Dashboard Penjualan BIOTA

Web app sederhana yang mengubah file ekspor pesanan dari **Shopee, TikTok Shop dan Tokopedia** menjadi angka penjualan
yang bisa dipercaya: net revenue per channel, net revenue per produk, dan 10 produk teratas, dengan filter tanggal.

**Link live:** _(isi dengan URL Vercel)_

## Angka akhir (Oktober 2026)

| | Net revenue |
|---|---:|
| **Total Oktober 2026** | **Rp 298.937.000** |
| Shopee | Rp 180.315.000 |
| TikTok Shop | Rp 70.461.000 |
| Tokopedia | Rp 48.161.000 |
| **1–15 Oktober 2026** | **Rp 146.226.000** |
| 16–31 Oktober 2026 | Rp 152.711.000 |

Total ini berasal dari 366 pesanan dan 473 unit. Untuk 1–15 Oktober per channel: Shopee Rp 83.050.000, TikTok Shop
Rp 36.812.000, Tokopedia Rp 26.364.000.

Top 10 produk (seluruh Oktober):

| # | Produk | SKU | Unit | Net revenue |
|---:|---|---|---:|---:|
| 1 | Kamera CCTV Battery Fixed BIOTA | BIO-CAM-BF | 55 | Rp 60.445.000 |
| 2 | CCTV 4G Solar Panel BIOTA Edge | BIO-CAM-E4G | 18 | Rp 39.582.000 |
| 3 | Pet Feeder Otomatis BIOTA | BIO-PET-FD | 41 | Rp 36.859.000 |
| 4 | Kamera Bayi BIOTA + Monitor | BIO-CAM-BBY | 28 | Rp 36.372.000 |
| 5 | CCTV Outdoor PTZ BIOTA Waterproof | BIO-CAM-OPZ | 40 | Rp 27.960.000 |
| 6 | Bel Pintu Kamera BIOTA Doorbell | BIO-CAM-DB | 32 | Rp 25.568.000 |
| 7 | CCTV Indoor PTZ BIOTA 360 Derajat | BIO-CAM-IPZ | 41 | Rp 18.409.000 |
| 8 | Kamera Indoor PTZ Lite BIOTA | BIO-CAM-IPL | 40 | Rp 13.960.000 |
| 9 | VGEN MicroSD 128 GB | BIO-SD-V128 | 69 | Rp 10.971.000 |
| 10 | BIOTA Smart Pet Water Fountain | BIO-PET-WF | 27 | Rp 10.773.000 |

Nama produk berbeda di tiap marketplace; yang ditampilkan adalah nama listing terpendek untuk SKU tersebut.

## Cara memakai

1. Buka link live di atas.
2. Tarik file CSV ke kotak upload, atau klik **Pilih file CSV**. Bisa satu file gabungan atau beberapa file sekaligus
   (misalnya satu file per marketplace). Untuk mencoba cepat, klik **Pakai data contoh (Okt 2026)**.
3. Pilih periode dengan tombol **1–15 Okt** / **16–31 Okt**, atau isi tanggal sendiri. Kedua tanggal ikut dihitung.
4. Di bagian bawah, **Dari file ke angka** menunjukkan apa saja yang dibersihkan dan dikecualikan, supaya angkanya
   bisa dicek ulang. Tombol **Unduh data bersih** menyimpan data yang sudah dibersihkan sebagai CSV.

Semua proses terjadi di browser. File tidak dikirim ke server mana pun.

## Cara menjalankan di komputer sendiri

Butuh [Node.js](https://nodejs.org) versi 18 atau lebih baru.

```bash
npm install
npm run dev      # buka http://localhost:5173
npm test         # jalankan semua test (termasuk test angka akhir)
npm run verify   # cek angka dengan skrip Python terpisah (butuh python3)
npm run build    # build untuk produksi (folder dist/)
```

Deploy: import repo ini di [vercel.com](https://vercel.com). Vercel otomatis mengenali Vite
(build `npm run build`, output `dist`).

## Keputusan dan asumsi tentang data

**Apa yang dihitung sebagai net revenue**

- Net revenue = jumlah `total_price` dari baris pesanan yang **tidak batal dan tidak diretur/refund**.
  Pesanan yang sudah selesai maupun yang masih dikirim tetap dihitung.
- Status dari tiap marketplace dipetakan seperti ini:

  | Perlakuan | Status di file |
  |---|---|
  | Dihitung | Selesai, Pesanan Selesai, Completed, Dikirim, Sedang Dikirim, In transit |
  | Tidak dihitung (batal) | Batal, Dibatalkan, Cancelled |
  | Tidak dihitung (retur/refund) | Pengembalian Dana, Refunded, Dikomplain - Retur |

- **"Dikomplain - Retur"** (2 baris Tokopedia, Rp 437.000) diperlakukan sebagai retur dan **tidak dihitung**, karena
  pembeli sudah mengajukan retur. Kalau ternyata retur ini ditolak, angkanya naik menjadi Rp 299.374.000.
- Status yang **belum dikenal** aplikasi tidak pernah dihitung diam-diam. Status seperti itu muncul sebagai peringatan
  merah di panel rekonsiliasi.
- Net revenue di sini adalah nilai penjualan barang (`total_price`). Data tidak berisi potongan biaya marketplace,
  voucher, atau ongkos kirim, jadi angka ini belum dikurangi biaya-biaya tersebut.

**Pembersihan data**

- **Duplikat:** 22 baris adalah salinan persis dari baris lain (pesanan, produk, jumlah, harga, status, waktu dan kota
  sama semua). Duplikat ini dibuang. Kalau tidak dibuang, net revenue akan terlalu besar Rp 16.568.000.
  Dua produk berbeda dalam satu pesanan tetap dihitung dua-duanya.
- **Nama channel** ditulis berbeda-beda (`SHOPEE`, `shopee`, `Tiktok`, `TIKTOK SHOP`, `Tokped`, `TOKOPEDIA`, ...) dan
  disatukan menjadi Shopee, TikTok Shop dan Tokopedia.
- **Format harga** berbeda per marketplace: Shopee `Rp1.099.000` (titik = ribuan), TikTok `349,000` dan
  `IDR 1,099,000` (koma = ribuan), Tokopedia `119000`. Semua dibaca sebagai rupiah bulat.
- **Format tanggal** berbeda per marketplace: Shopee `2026-10-21 08:24`, TikTok `21/10/2026 08:24:00`,
  Tokopedia `Oct 1, 2026` (tanpa jam).
  - Tanggal TikTok dibaca **hari dulu, lalu bulan** (format Indonesia). Ini terbukti dari data, karena ada tanggal
    seperti `21/10/2026` yang tidak mungkin dibaca sebaliknya.
  - Jam dibaca apa adanya sebagai waktu Indonesia (WIB). Tidak ada konversi zona waktu, jadi pesanan pukul 23.43
    tanggal 31 tetap masuk tanggal 31.
  - Filter tanggal bekerja per hari kalender, sehingga pesanan Tokopedia yang tidak punya jam tetap masuk ke tanggal
    yang benar.
- **SKU kosong:** 76 baris tidak punya SKU (74 setelah duplikat dibuang). SKU-nya dipulihkan dari baris lain yang
  punya nama listing dan channel yang sama. Semuanya berhasil dipulihkan. Kalau ada yang tidak bisa dipulihkan,
  produk itu tetap ditampilkan dengan label "SKU tidak diketahui".
- **Nama produk** berbeda di tiap marketplace untuk barang yang sama. Produk digabung berdasarkan **SKU**, dan nama
  yang ditampilkan adalah nama listing terpendek dari SKU tersebut.
- Untuk semua baris berlaku `qty × unit_price = total_price` (tidak ada selisih). Kalau ada selisih, aplikasi memakai
  `total_price` dan menampilkan jumlah baris yang selisih.
- Baris yang tidak bisa dibaca (tanggal, harga atau channel tidak dikenal) **ditolak dan ditampilkan beserta
  alasannya**, tidak dibuang diam-diam. Di file Oktober tidak ada baris yang ditolak.
- Kalau file dengan nama yang sama diupload lagi, file lama diganti. Kalau data yang sama ada di dua file berbeda,
  baris yang sama tetap hanya dihitung sekali.

**Catatan lain**

- Pada 30 dari 33 pesanan yang berisi lebih dari satu produk, kota pembeli berbeda di tiap baris, padahal nomor dan
  waktu pesanannya sama. Kolom kota sepertinya tidak bisa diandalkan. Kolom ini tidak dipakai untuk menghitung revenue.

## Bagaimana angkanya dicek

1. **Unit test** untuk setiap aturan pembersihan (format harga, format tanggal, status, duplikat, SKU, batas filter
   tanggal), di `src/lib/*.test.ts`.
2. **Hitungan kedua yang terpisah:** `scripts/verify_numbers.py` menghitung ulang semua angka dengan Python, tanpa
   memakai kode aplikasi. Hasilnya sama persis dengan aplikasi.
3. **Test angka akhir** (`src/lib/golden.test.ts`) mengunci angka di atas untuk file Oktober.
4. **Test terhadap test:** tiga aturan penting sengaja dirusak (tanggal dibaca bulan-dulu, duplikat tidak dibuang,
   "Dikomplain - Retur" dihitung), dan setiap kali test langsung gagal.
5. **Cek di browser:** angka yang tampil di layar dicocokkan dengan test untuk "Semua", "1–15" dan "16–31", termasuk
   upload file yang sama dua kali, file berkolom salah, file .xlsx, dan tampilan di lebar HP.

## Tiga hal yang salah dikerjakan AI

1. **Hitungan "SKU dipulihkan" ikut menghitung duplikat.** Versi pertama menghitung SKU kosong sebelum duplikat
   dibuang. Ketahuan saat cek di browser: setelah file yang sama diupload dua kali, panel menulis "152 dari 152"
   padahal baris bersihnya hanya 473. Angka revenue tidak terpengaruh, tapi panel yang seharusnya membuat angka bisa
   dipercaya justru menampilkan angka yang membingungkan. Perbaikan: hitungan dipindah ke setelah dedupe (hasilnya 74),
   angka 74 dicek ulang dengan skrip Python, dan ditambah test khusus untuk kasus ini.
2. **Tabel produk tidak terbaca di layar HP.** Di lebar 375px nama produk terpotong per kata dan kolom revenue
   terdorong keluar layar. Ketahuan dari screenshot di lebar HP. Perbaikan: padding dan ukuran huruf tabel dikecilkan
   di layar kecil, judul kolom dipersingkat, dan kolom "Porsi" disembunyikan di HP.
3. **Format jam terlalu kaku.** Versi pertama pembaca tanggal hanya menerima tepat satu spasi antara tanggal dan jam,
   sehingga `21/10/2026  08:24:00` (dua spasi) akan ditolak. Ketahuan saat membaca ulang kode sebelum test
   dijalankan. Perbaikan: spasi berapa pun diterima.

## Kalau ada lebih banyak waktu

- Menanyakan ke tim BIOTA bagaimana status "Dikomplain - Retur" dan retur yang ditolak seharusnya dihitung.
- Mendukung upload file Excel (.xlsx) secara langsung, karena tim sering membuka ekspor di Excel lalu menyimpannya.
- Mendukung lebih banyak format ekspor (misalnya jam dengan AM/PM, atau kolom dengan nama berbeda per marketplace)
  lewat pemetaan kolom yang bisa diatur.
- Menghitung net revenue setelah biaya marketplace, voucher dan ongkir, kalau data tersebut tersedia di ekspor.
- Perbandingan antar bulan dan grafik tren harian.
- Test end-to-end otomatis di CI untuk alur upload dan filter.

## Tools dan model AI

| Tool | Nama dan versi model AI | Dipakai untuk |
|---|---|---|
| Claude Code (ekstensi VS Code) | Claude Opus 5.5 (`claude-opus-5-5`) | Brainstorm keputusan data, profiling data, menulis kode, test, skrip verifikasi, cek di browser, README |
| VS Code | — | Edit dan menjalankan secara lokal |
| Google Chrome (headless, lewat puppeteer) | — | Cek tampilan dan angka di browser, termasuk lebar HP |

Log prompt lengkap ada di folder `prompt-log/` (ekspor apa adanya dari Claude Code).

## Struktur kode

```
src/lib/parse.ts      Membaca harga, tanggal, channel dan status
src/lib/clean.ts      Menggabungkan file, memulihkan SKU, membuang duplikat
src/lib/metrics.ts    Filter tanggal dan hitungan net revenue
src/lib/csv.ts        Membaca CSV dan membuat CSV data bersih
src/components/       Tampilan dashboard
scripts/verify_numbers.py   Hitungan kedua (Python) untuk cek silang
data/                 File ekspor Oktober 2026
```
