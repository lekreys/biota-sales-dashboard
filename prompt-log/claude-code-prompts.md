# Log Prompt — Claude Code

Dokumen ini memuat seluruh prompt yang saya berikan kepada Claude Code selama mengerjakan tes take-home,
secara berurutan dari awal sampai akhir. Termasuk di dalamnya prompt susulan yang saya kirim ketika Claude
sedang bekerja, serta jawaban saya atas pertanyaan pilihan ganda dari Claude.

Teks prompt diekspor otomatis dari file sesi Claude Code dan **tidak diubah sama sekali**, sesuai instruksi
brief. Pengelompokan per tahap ditambahkan hanya untuk memudahkan membaca.
Percakapan lengkap beserta balasan Claude tersedia di
[`claude-code-conversation.md`](claude-code-conversation.md).

| | |
|---|---|
| Tool | Claude Code (ekstensi VS Code) |
| Model AI | Claude Opus 5.5 (`claude-opus-5-5`) |
| Sesi | 1 sesi, 25 Nov 2026, 11:56–16:05 WIB |
| Jumlah prompt | 19 |

## Ringkasan per tahap

| Tahap | Prompt |
|---|---|
| Perencanaan dan keputusan tentang data | 1–5 |
| Pembuatan aplikasi dan deploy pertama | 6 |
| Interaksi, tampilan, dan verifikasi angka | 7–10 |
| Penyederhanaan, README, dan kerapian kode | 11–13 |
| Persiapan pengiriman: log prompt, deploy, dan kelengkapan syarat | 14–19 |

## Daftar prompt

### Perencanaan dan keputusan tentang data

#### 1. Prompt · 25 Nov 2026 11:56 WIB

```text
kamu lihat di @Home_Test/  . aku mau buat home test ini dari arahan dan data yang ada, tapi kasih aku prompt dlu buat nanti claude code wxwcutenya bagus . tanya aku yang detail aja brandstorm dlu
```

#### 2. Jawaban atas pertanyaan pilihan ganda dari Claude · 25 Nov 2026 12:01 WIB

```text
Your questions have been answered: "Data yang kamu punya adalah biota_orders_oct2026.xlsx (sheet-nya bernama .csv, jadi ini CSV yang sudah dibuka di Sheets/Excel). Format tanggal/harga aslinya sudah berubah, padahal app harus parse CSV asli. Kamu punya file .csv aslinya?"="Ada CSV asli", "Stack apa yang mau dipakai? Penting juga untuk sesi live 60 menit, karena kamu harus menjelaskan kode dan memperbaiki bug secara langsung, jadi pilih yang paling kamu kuasai."="Vite+React+TS (Rekomendasi)", "Status 'Dikomplain - Retur' (2 baris Tokopedia, Rp437.000) ambigu: pembeli komplain dan retur sedang berjalan, belum final. Mau diperlakukan bagaimana?"="Tidak dihitung (Rekomendasi)", "Gaya prompt untuk Claude Code? Penilai membaca log prompt untuk melihat cara kamu mengarahkan dan mengecek AI."="Bertahap + checkpoint (Rek.)". You can now continue with these answers in mind.
```

#### 3. Jawaban atas pertanyaan pilihan ganda dari Claude · 25 Nov 2026 12:02 WIB

```text
The user answered: "Brief melarang menyebarkan brief dan datanya, padahal repo GitHub wajib dikirim. Bagaimana menangani file CSV di repo?"="Public dengan CSV", "Bahasa untuk UI dashboard dan README? (README harus bisa dipahami orang non-teknis.)"="Indonesia (Rek.)", "Fitur tambahan di luar 6 syarat wajib (brief menekankan 'sesederhana mungkin'). Pilih yang mau dimasukkan:"="Panel rekonsiliasi (Rek.), Upload banyak CSV, Bar chart sederhana, Other, Unduh data bersih", "Seberapa ketat testing untuk logika data?"="Unit + golden test (Rek.)". Read the answers carefully — they may request clarification, changes, or that you not proceed — and follow what they actually say.
```

#### 4. Jawaban atas pertanyaan pilihan ganda dari Claude · 25 Nov 2026 12:03 WIB

```text
Your questions have been answered: "Di pertanyaan scope tadi kamu mencentang 'Other' tapi tidak ada isinya. Fitur tambahan apa yang kamu maksud? (Pilih 'Other' lagi kalau mau mengetik sendiri.)"="Tidak ada, salah klik", "Satu SKU punya nama listing berbeda di tiap marketplace (mis. BIO-CAM-BF = 'BIOTA Smart Camera Battery Fixed - CCTV Wifi Tanpa Kabel' / 'Kamera CCTV Battery Fixed BIOTA'). Nama apa yang ditampilkan di tabel produk?"="Nama listing terpendek", "Akun dan tool untuk deploy sudah siap? Ini menentukan langkah deploy di prompt."="GitHub + Vercel (dashboard)". You can now continue with these answers in mind.
```

#### 5. Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 12:02 WIB

```text
setelah prompt jadi langsung kerjakan aja ya yang detail ga ush tanya tanya lagi kerjakan sampe selesai
```

### Pembuatan aplikasi dan deploy pertama

#### 6. Prompt · 25 Nov 2026 13:47 WIB

```text
langsung kerjakna aja ua
```

### Interaksi, tampilan, dan verifikasi angka

#### 7. Prompt · 25 Nov 2026 13:55 WIB

```text
buat yang keren interaktif dong
```

#### 8. Prompt · 25 Nov 2026 14:09 WIB

```text
kalo bisa ada tabnya gitu atau buat interaktif dan keren gitu biar wow gitu pas interview rapih simple
```

#### 9. Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 14:17 WIB

```text
untuk chart terus warna jangan seperti ai dong dan aku agak ga suka kalo scroll ke bawah terus
```

#### 10. Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 14:27 WIB

```text
dan pastikan yansemua perhiutngan formula bener , kalo bisa chartnya yang keren dan menarik ya
```

### Penyederhanaan, README, dan kerapian kode

#### 11. Prompt · 25 Nov 2026 14:37 WIB

```text
untuk kualitas data dandata bersih itu biingung aku , TRERUS RAME BGT KALO BISA SIMPLE SIMPLE AJA ILANGIN YANG GA PERLU
```

#### 12. Prompt · 25 Nov 2026 15:01 WIB

```text
REDME NYA BUAT SIMPLE BENER EBENR ORANG NON TEKNIK PAHAM
```

#### 13. Prompt · 25 Nov 2026 15:03 WIB

```text
LALU TOLONG BUAT KODENYA RAPI YAH CLEAN CODE , UNTUK KOMEN KOMEN APUS SEMUA
```

### Persiapan pengiriman: log prompt, deploy, dan kelengkapan syarat

#### 14. Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 15:13 WIB

```text
SETELAH ITU BUATIN YANG PROMPT LOG  SAMA SIAPIN AKU MAU SIAPIN BUAT DI VERCEL DEPLOYNYA
```

#### 15. Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 15:14 WIB

```text
DAN PASTIKAN UNTUK SEMUA PERSYARATAN DI @"Home_Test/AI-Native Software Engineer — Tes Take-Home.pdf"  UDH LENGKAP SEMUA DAN BAGUS KERJAKAN SEMUA YANGDETAIL
```

#### 16. Prompt · 25 Nov 2026 15:57 WIB

```text
untuk yang csv aku aja nanti upload manual gitu terus jalanin yang log prompt
```

#### 17. Prompt · 25 Nov 2026 15:59 WIB

```text
jadi nanti pas appnya jalan udh di deploya aku upload aja csvnya ga ush taro datanya di repo
```

#### 18. Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 16:02 WIB

```text
lengkapin prompt lognya
```

#### 19. Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 16:04 WIB

```text
nah tolong promptnya buat lebih profesional dong
```
