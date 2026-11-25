# Dashboard Penjualan BIOTA

Aplikasi ini membaca file pesanan dari **Shopee, TikTok Shop dan Tokopedia**, merapikannya, lalu menampilkan
penjualan bersih (net revenue) per marketplace, per produk, dan per tanggal.

**Buka aplikasinya:** https://lekreys.github.io/biota-sales-dashboard/

## Hasil akhir (Oktober 2026)

| | Seluruh Oktober | 1–15 Oktober |
|---|---:|---:|
| Shopee | Rp 180.315.000 | Rp 83.050.000 |
| TikTok Shop | Rp 70.461.000 | Rp 36.812.000 |
| Tokopedia | Rp 48.161.000 | Rp 26.364.000 |
| **Total net revenue** | **Rp 298.937.000** | **Rp 146.226.000** |

Net revenue = pesanan yang **tidak batal** dan **tidak diretur**. Pesanan yang sudah selesai maupun yang masih dikirim
tetap dihitung.

## Cara memakai

1. Buka link di atas.
2. Klik **Pilih file CSV** dan pilih file ekspor. Boleh satu file gabungan atau beberapa file sekaligus.
   Untuk mencoba tanpa file, klik **Pakai data contoh**.
3. Lihat hasilnya di tiga tab:
   - **Ringkasan:** total penjualan, grafik per hari, dan penjualan per marketplace.
   - **Produk:** 10 produk terlaris dan daftar semua produk.
   - **Data:** apa saja yang dirapikan dari file, dan tombol untuk mengunduh data yang sudah rapi.
4. Untuk melihat tanggal tertentu, klik **1–15 Okt** atau **16–31 Okt**, atau isi tanggal sendiri.
   Bisa juga dengan menarik (drag) mouse di grafik harian.
5. Klik nama marketplace atau nama produk untuk melihat angkanya saja.

File diproses langsung di browser dan tidak dikirim ke mana pun.

## Keputusan tentang data

File dari tiga marketplace ditulis dengan cara berbeda-beda. Ini yang dilakukan aplikasi:

- **Status pesanan.** "Selesai", "Completed", "Pesanan Selesai", "Dikirim", "In transit" dan "Sedang Dikirim"
  dihitung. "Batal", "Cancelled", "Dibatalkan", "Pengembalian Dana", "Refunded" dan "Dikomplain - Retur" tidak dihitung.
- **"Dikomplain - Retur"** (2 pesanan, Rp 437.000) dianggap retur, jadi tidak dihitung. Kalau ternyata returnya
  ditolak, total naik menjadi Rp 299.374.000.
- **Baris dobel.** Ada 22 baris yang sama persis dua kali. Yang dobel dibuang. Kalau tidak, total terlalu besar
  Rp 16.568.000.
- **Nama marketplace** ditulis macam-macam (misalnya `SHOPEE`, `Tiktok`, `Tokped`). Semua disatukan jadi 3 nama.
- **Tanggal** ditulis beda di tiap marketplace. Tanggal TikTok seperti `03/10/2026` dibaca **3 Oktober**, bukan
  10 Maret. Tokopedia tidak mencantumkan jam, jadi dihitung per tanggal saja.
- **Harga** ditulis dengan titik, koma atau tanpa pemisah (`Rp1.099.000`, `349,000`, `119000`). Semua dibaca sebagai
  rupiah biasa.
- **Kode produk (SKU) kosong** di 74 baris. Kodenya diisi dari baris lain yang nama produknya sama.
- **Nama produk** berbeda di tiap marketplace untuk barang yang sama, jadi produk dikelompokkan berdasarkan kode
  produknya.
- **Biaya marketplace, voucher dan ongkir** tidak ada di file, jadi net revenue ini belum dipotong biaya-biaya itu.
- **Kota pembeli** kadang berbeda di dalam satu pesanan yang sama. Kolom ini tidak dipakai untuk menghitung apa pun.
- **Status baru** yang belum dikenal (misalnya dari ekspor bulan depan) tidak pernah dihitung diam-diam. Status itu
  muncul sebagai peringatan di tab Data supaya bisa diputuskan dulu.

## Bagaimana angkanya dipastikan benar

- Semua angka dihitung **dua kali dengan dua cara yang terpisah**, dan hasilnya harus sama persis. Ini dicek untuk
  8 kombinasi filter (seluruh bulan, 1–15 Okt, satu hari, satu marketplace, satu produk, dan lainnya).
- Angka yang benar-benar tampil di layar juga dibaca ulang secara otomatis: 310 angka, semuanya cocok.
- Pengecekan ini berjalan otomatis setiap kali aplikasi diperbarui. Kalau ada satu angka yang beda, versi baru
  tidak akan dipasang.

## Tiga kesalahan AI dan cara memperbaikinya

1. **Angka yang salah sempat terlihat di layar.** Angka total dibuat bergerak naik (animasi) saat tab dibuka.
   Di screenshot versi HP, angka yang tertangkap adalah Rp 298.794.045, angka "setengah jalan" yang bukan angka
   sebenarnya. Perbaikan: saat tab dibuka, angka langsung tampil final. Animasi hanya muncul saat filter diganti.
2. **Jumlah kode produk yang dipulihkan terhitung dobel.** Waktu file yang sama diupload dua kali, aplikasi menulis
   "152 dari 152 dipulihkan", padahal datanya cuma 473 baris bersih. Ketahuan saat mencoba upload file yang sama dua
   kali. Perbaikan: hitungan dilakukan setelah baris dobel dibuang. Sekarang tertulis 74 dari 74, dan sudah dicek ulang.
3. **Warna marketplace tidak bisa dibedakan oleh penderita buta warna.** Saat warna diganti mengikuti warna brand,
   pilihan AI (oranye untuk Shopee, hijau untuk Tokopedia) gagal waktu dicek dengan alat pemeriksa buta warna, karena
   oranye dan hijau terlihat sama bagi orang dengan buta warna merah-hijau. Perbaikan: hijaunya digeser ke arah hijau
   kebiruan, lalu dicek ulang sampai lolos.

## Kalau ada waktu lagi

- Menanyakan ke tim BIOTA apakah "Dikomplain - Retur" memang tidak dihitung.
- Bisa langsung upload file Excel (.xlsx), tidak harus CSV.
- Menghitung penjualan bersih setelah dipotong biaya marketplace, voucher dan ongkir, kalau datanya tersedia.
- Membandingkan antar bulan.

## Tools AI yang dipakai

| Tool | Nama dan versi model AI | Dipakai untuk |
|---|---|---|
| Claude Code (ekstensi VS Code) | Claude Opus 5.5 (`claude-opus-5-5`) | Diskusi keputusan data, menulis kode, membuat pengecekan angka, mengecek tampilan, menulis README |
| VS Code | — | Mengedit dan menjalankan aplikasi di komputer |

Log semua prompt, berurutan dan tanpa diedit, ada di [`prompt-log/`](prompt-log/).

---

## Untuk developer

Butuh [Node.js](https://nodejs.org) versi 18 atau lebih baru.

```bash
npm install
npm run dev      # jalankan di http://localhost:5173
npm test         # semua pengecekan, termasuk cek silang dengan skrip Python
npm run lint     # cek format kode (Prettier) dan tipe (TypeScript)
npm run format   # rapikan format kode
npm run verify   # hitung ulang angka dengan Python (butuh python3)
```

Logika data ada di `src/lib/` (membaca file, merapikan, menghitung). Tampilan ada di `src/components/`.
Hitungan kedua yang terpisah ada di `scripts/verify_numbers.py`. Setiap push ke `main` menjalankan semua test di
GitHub Actions. Pengaturan hosting ada di `vercel.json` (build `npm run build`, folder `dist`).
