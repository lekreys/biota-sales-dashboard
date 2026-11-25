# Percakapan Lengkap — Claude Code

Dokumen ini memuat seluruh sesi Claude Code dari awal sampai akhir: setiap prompt saya, setiap balasan Claude
apa adanya, dan setiap aksi yang dijalankan Claude (nama tool beserta keterangannya). Isinya diekspor otomatis
dari file sesi Claude Code.

Yang tidak dimuat: output mentah dari tool (isi file dan hasil perintah) serta isi pemikiran internal model.
Path lokal komputer disingkat (misalnya `<scratchpad>` dan `~`) agar nama folder dan username tidak tersebar.

| | |
|---|---|
| Tool | Claude Code (ekstensi VS Code) |
| Model AI | Claude Opus 5.5 (`claude-opus-5-5`) |
| Sesi | 1 sesi, 25 Nov 2026, 11:56–16:05 WIB |
| Jumlah prompt | 19 |

## Perencanaan dan keputusan tentang data

---

### Prompt 1 · Prompt · 25 Nov 2026 11:56 WIB

```text
kamu lihat di @Home_Test/  . aku mau buat home test ini dari arahan dan data yang ada, tapi kasih aku prompt dlu buat nanti claude code wxwcutenya bagus . tanya aku yang detail aja brandstorm dlu
```

#### Claude

Aku baca dulu brief PDF dan isi datanya supaya pertanyaanku nanti spesifik.

> `Read: Home_Test/AI-Native Software Engineer — Tes Take-Home.pdf`

> `Bash: Inspect sheets and first rows of the Excel data`

Brief-nya minta upload CSV, tapi file yang ada .xlsx. Aku cek isinya tanpa library tambahan.

> `Bash: List xlsx contents and sheet names`

Nama sheet-nya "biota_orders_oct2026.csv", jadi ini CSV yang dibuka lalu disimpan ulang lewat Sheets/Excel. Itu bisa mengubah format tanggal dan angka. Sekarang aku profil seluruh datanya.

> `Bash: Convert the xlsx sheet to raw CSV and preview it`

Datanya sengaja kotor (channel beda kapitalisasi, format Rupiah beda, SKU kosong, status beda bahasa). Aku profil semua polanya.

> `Bash: Profile channels, statuses, dates, prices and SKUs`

Bagus: semua 76 SKU kosong bisa dipulihkan karena setiap nama listing hanya cocok ke satu SKU. Sekarang aku cek duplikat, total vs qty×harga, anomali harga, dan zona waktu.

> `Bash: Check duplicates, price mismatches, time zones and ID formats`

> `Bash: Show date number formats per channel in the workbook`

> `Bash: Show number formats used for qty and price columns`

> `Bash: Compute reference net revenue figures with sensitivity checks`

> `AskUserQuestion: File CSV / Stack / Retur / Gaya prompt`

---

### Prompt 2 · Jawaban atas pertanyaan pilihan ganda dari Claude · 25 Nov 2026 12:01 WIB

```text
Your questions have been answered: "Data yang kamu punya adalah biota_orders_oct2026.xlsx (sheet-nya bernama .csv, jadi ini CSV yang sudah dibuka di Sheets/Excel). Format tanggal/harga aslinya sudah berubah, padahal app harus parse CSV asli. Kamu punya file .csv aslinya?"="Ada CSV asli", "Stack apa yang mau dipakai? Penting juga untuk sesi live 60 menit, karena kamu harus menjelaskan kode dan memperbaiki bug secara langsung, jadi pilih yang paling kamu kuasai."="Vite+React+TS (Rekomendasi)", "Status 'Dikomplain - Retur' (2 baris Tokopedia, Rp437.000) ambigu: pembeli komplain dan retur sedang berjalan, belum final. Mau diperlakukan bagaimana?"="Tidak dihitung (Rekomendasi)", "Gaya prompt untuk Claude Code? Penilai membaca log prompt untuk melihat cara kamu mengarahkan dan mengecek AI."="Bertahap + checkpoint (Rek.)". You can now continue with these answers in mind.
```

#### Claude

Kamu bilang ada CSV asli. Aku cek apakah sudah ada di folder.

> `Bash: Look for the original CSV file`

> `AskUserQuestion: Repo & data / Bahasa / Scope / Testing`

---

### Prompt 3 · Jawaban atas pertanyaan pilihan ganda dari Claude · 25 Nov 2026 12:02 WIB

```text
The user answered: "Brief melarang menyebarkan brief dan datanya, padahal repo GitHub wajib dikirim. Bagaimana menangani file CSV di repo?"="Public dengan CSV", "Bahasa untuk UI dashboard dan README? (README harus bisa dipahami orang non-teknis.)"="Indonesia (Rek.)", "Fitur tambahan di luar 6 syarat wajib (brief menekankan 'sesederhana mungkin'). Pilih yang mau dimasukkan:"="Panel rekonsiliasi (Rek.), Upload banyak CSV, Bar chart sederhana, Other, Unduh data bersih", "Seberapa ketat testing untuk logika data?"="Unit + golden test (Rek.)". Read the answers carefully — they may request clarification, changes, or that you not proceed — and follow what they actually say.
```

#### Claude

Oke, repo public dengan CSV aku ikuti sesuai pilihanmu. Kamu juga mencentang "Other" di scope tapi isinya kosong, jadi itu aku tanyakan sekalian di ronde terakhir:

> `AskUserQuestion: Other scope / Nama produk / Deploy`

---

### Prompt 4 · Jawaban atas pertanyaan pilihan ganda dari Claude · 25 Nov 2026 12:03 WIB

```text
Your questions have been answered: "Di pertanyaan scope tadi kamu mencentang 'Other' tapi tidak ada isinya. Fitur tambahan apa yang kamu maksud? (Pilih 'Other' lagi kalau mau mengetik sendiri.)"="Tidak ada, salah klik", "Satu SKU punya nama listing berbeda di tiap marketplace (mis. BIO-CAM-BF = 'BIOTA Smart Camera Battery Fixed - CCTV Wifi Tanpa Kabel' / 'Kamera CCTV Battery Fixed BIOTA'). Nama apa yang ditampilkan di tabel produk?"="Nama listing terpendek", "Akun dan tool untuk deploy sudah siap? Ini menentukan langkah deploy di prompt."="GitHub + Vercel (dashboard)". You can now continue with these answers in mind.
```

---

### Prompt 5 · Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 12:02 WIB

```text
setelah prompt jadi langsung kerjakan aja ya yang detail ga ush tanya tanya lagi kerjakan sampe selesai
```

#### Claude

Siap, setelah prompt selesai aku langsung kerjakan sampai tuntas tanpa tanya lagi. Pertama aku cek tool yang tersedia (node, gh, vercel) dan cari CSV aslinya sekali lagi.

> `Bash: Check node, git, gh, vercel and search for the CSV`

> `Write: Home_Test/PROMPT_CLAUDE_CODE.md`

Prompt sudah jadi. Sekarang eksekusi. Langkah pertama: rekonstruksi CSV dari xlsx dengan format tampilan asli per sel.

> `Bash: Rebuild the CSV with original per-channel formats`

CSV hasil rekonstruksi sudah cocok dengan format yang aku simpulkan (TikTok `14/10/2026 23:26:00` dan `"IDR 1,099,000"`, Tokopedia `"Oct 01, 2026"`). Sekarang aku setup project Vite + React + TS.

> `Bash: Create project config files and install dependencies`

Dependency terpasang (peringatan audit itu dari dev tooling Vite 5, tidak ikut ke build produksi). Sekarang logika data sebagai fungsi murni di `src/lib`.

> `Write: Home_Test/biota-sales-dashboard/src/lib/types.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/parse.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/metrics.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/csv.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/format.ts`

Satu perbaikan kecil sebelum test: regex jam belum menerima spasi ganda antara tanggal dan jam.

> `Edit: Home_Test/biota-sales-dashboard/src/lib/parse.ts`

> `Write: Home_Test/biota-sales-dashboard/scripts/verify_numbers.py`

> `Bash: Run the independent Python verification on the CSV`

Script Python independen (membaca CSV, bukan xlsx) menghasilkan angka yang sama persis dengan referensi awalku dari xlsx. Sekarang unit test dan golden test untuk logika TypeScript.

> `Write: Home_Test/biota-sales-dashboard/src/lib/parse.test.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/clean.test.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/metrics.test.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/golden.test.ts`

> `Bash: Run all Vitest tests`

> `Bash: Break three rules on purpose and confirm tests fail`

Ketiga bug yang sengaja dibuat semuanya ketahuan oleh test, dan kodenya sudah dikembalikan (71/71 lulus lagi). Sekarang UI-nya.

> `Write: Home_Test/biota-sales-dashboard/src/App.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/UploadArea.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/DateFilter.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/ChannelSection.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/ProductSection.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/Reconciliation.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/main.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/styles.css`

> `Bash: Type-check and build the app`

Build lolos (type-check + bundle). Sekarang aku cek di browser sungguhan: klik data contoh, coba filter 1–15, lihat tampilan di lebar HP, upload file duplikat, dan upload file yang salah.

> `Bash: Check which browsers are installed for testing`

> `Bash: Install puppeteer-core in scratchpad and start preview server`

> `Bash: Drive the app in headless Chrome and record results`

> `Read: <scratchpad>/e2e/shots/2-all.png`

> `Read: <scratchpad>/e2e/shots/3-mobile.png`

> `Read: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/clean.test.ts`

> `Edit: Home_Test/biota-sales-dashboard/scripts/verify_numbers.py`

> `Edit: Home_Test/biota-sales-dashboard/scripts/verify_numbers.py`

> `Bash: Get the independent count of recovered SKUs after dedupe`

Hitungan independen dari Python: setelah dedupe ada 74 baris ber-SKU kosong, dan semuanya berhasil dipulihkan. Sekarang update golden test, perbaiki tampilan HP, dan tambahkan favicon.

> `Edit: Home_Test/biota-sales-dashboard/src/lib/golden.test.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/components/ProductSection.tsx`

> `Edit: Home_Test/biota-sales-dashboard/src/components/ProductSection.tsx`

> `Edit: Home_Test/biota-sales-dashboard/src/styles.css`

> `Edit: Home_Test/biota-sales-dashboard/index.html`

> `Bash: Rerun tests, rebuild, and rerun the browser check`

Hitungan SKU sekarang tetap 74 walaupun file diupload dua kali, dan console bersih. Aku cek tampilan HP sekali lagi.

> `Bash: Screenshot the Top 10 table at phone width`

> `Read: <scratchpad>/e2e/shots/4-mobile-top10.png`

Tampilan HP sudah rapi. Sebelum menulis README, aku hitung dua angka pendukung untuk bagian asumsi: dampak duplikat dan order yang kotanya beda antar baris.

> `Bash: Count multi-city orders and duplicate revenue impact`

> `Write: Home_Test/biota-sales-dashboard/README.md`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

README menyebut perbaikan "dua spasi", tapi belum ada test-nya. Aku tambahkan test itu, lalu jalankan test dan build sekali lagi sebelum commit.

> `Edit: Home_Test/biota-sales-dashboard/src/lib/parse.test.ts`

> `Bash: Final test, build and verify run`

73 test lulus, build bersih, dan skrip Python cocok. Sekarang git init, commit, lalu buat repo public di GitHub dan push.

> `Bash: Check repo name and stage files in a new git repo`

A `__pycache__` folder got staged. I'll add it to `.gitignore` first, then commit and push.

> `Bash: Commit and push to a new public GitHub repo`

Push berhasil. Repo: https://github.com/lekreys/biota-sales-dashboard. Aku matikan server preview dan simpan catatan proyek ke memory supaya sesi berikutnya bisa langsung lanjut.

> `Bash: Stop preview server and list memory directory`

> `Write: ~/.claude/projects/<project>/memory/biota-take-home.md`

> `Write: ~/.claude/projects/<project>/memory/brainstorm-then-execute.md`

> `Write: ~/.claude/projects/<project>/memory/MEMORY.md`

Prompt-nya sudah jadi dan semuanya sudah aku kerjakan. Repo public sudah di-push ke https://github.com/lekreys/biota-sales-dashboard. Yang belum: deploy ke Vercel, karena itu harus lewat akunmu.

**Angka akhir:**

| | Net revenue |
|---|---:|
| Total Oktober | **Rp 298.937.000** |
| Shopee | Rp 180.315.000 |
| TikTok Shop | Rp 70.461.000 |
| Tokopedia | Rp 48.161.000 |
| 1–15 Oktober | **Rp 146.226.000** |

**Cara angkanya dicek:**
- 73 test lulus, termasuk test yang mengunci angka di atas.
- Skrip Python terpisah ([verify_numbers.py](Home_Test/biota-sales-dashboard/scripts/verify_numbers.py)) menghitung ulang tanpa memakai kode app, dan hasilnya sama persis.
- Tiga aturan penting sengaja aku rusak satu per satu (tanggal dibaca bulan-dulu, duplikat tidak dibuang, "Dikomplain - Retur" dihitung). Ketiganya langsung bikin test gagal.
- Di Chrome, angka di layar cocok untuk filter Semua, 1–15, dan 16–31. Upload file yang sama dua kali tidak menggandakan revenue. File .xlsx dan file berkolom salah ditolak dengan pesan yang jelas. Di lebar HP tidak ada scroll horizontal.

**Yang perlu kamu kerjakan:**
1. **Deploy di Vercel:** vercel.com → Add New → Project → import `biota-sales-dashboard` → Deploy. Vite terdeteksi otomatis. Setelah itu isi URL-nya di baris "Link live" README.
2. **CSV asli:** file di `data/` adalah hasil rekonstruksi dari .xlsx (aku pakai format sel aslinya), karena CSV aslimu tidak ada di folder. Timpa dengan file asli, lalu jalankan `npm test`. Kalau ada yang gagal, berarti format aslinya beda dari dugaanku, kabari aku.
3. **Log prompt:** sesi ini juga termasuk "prompt ke AI tool", jadi `/export` sesi ini dan masukkan ke folder `prompt-log/` (README sudah merujuk ke folder itu).
4. **Review bagian "Tiga hal yang salah dikerjakan AI":** isinya kejadian nyata dari sesi ini, tapi semuanya ditemukan oleh aku sendiri saat mengecek, bukan oleh kamu. Penilai bisa melihat itu di log. Kalau kamu menemukan sesuatu saat mereview, itu bahan yang lebih kuat untuk bagian ini.

Satu catatan: log sesi ini akan terlihat sebagai brainstorm lalu "kerjakan sampai selesai", bukan prompt bertahap. Kalau kamu ingin log yang menunjukkan kamu mengarahkan AI per fase, prompt bertahapnya ada di [PROMPT_CLAUDE_CODE.md](Home_Test/PROMPT_CLAUDE_CODE.md) dan bisa dipakai di sesi baru.

File utama ada di [README.md](Home_Test/biota-sales-dashboard/README.md) dan [src/lib/](Home_Test/biota-sales-dashboard/src/lib/).

## Pembuatan aplikasi dan deploy pertama

---

### Prompt 6 · Prompt · 25 Nov 2026 13:47 WIB

```text
langsung kerjakna aja ua
```

#### Claude

Oke, aku lanjutkan sendiri. Sisa pekerjaan yang paling penting adalah deploy. Aku cek dulu apakah ada login Vercel di mesin ini, dan sekalian cek apakah CSV aslinya sudah kamu taruh.

> `Bash: Look for Vercel login and the original CSV`

> `Bash: Use relative asset paths and add a Pages deploy workflow`

Asset sekarang pakai path relatif. Sebelum push, aku simulasikan GitHub Pages secara lokal (app disajikan dari sub-folder) untuk memastikan tombol data contoh tetap jalan di sub-path.

> `Bash: Serve the build from a sub-folder and test it`

Di sub-path pun jalan: total Rp 298.937.000 tanpa error. Sekarang aktifkan GitHub Pages, update README dengan link live, lalu push.

> `Bash: Enable GitHub Pages for the repo using Actions`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Bash: Commit, push and find the deploy workflow run`

Hasil `gh run list` kosong. Bisa jadi run-nya belum terdaftar, atau push-nya ditolak. Aku cek.

> `Bash: Check push state and workflow runs`

Push berhasil dan workflow sedang jalan (test → build → deploy). Aku tunggu sampai selesai.

> `Bash: Wait for the deploy workflow to finish`

Test dan deploy di GitHub Actions lulus. (Peringatan Node 20 itu hanya pemberitahuan deprecation dari GitHub, tidak membuat gagal.) Terakhir, aku cek app versi live-nya di browser.

> `Bash: Test the live GitHub Pages site in headless Chrome`

App live jalan dan angkanya benar. Aku update catatan memory dengan status terbaru.

> `Edit: ~/.claude/projects/<project>/memory/biota-take-home.md`

Aplikasinya sudah live di **https://lekreys.github.io/biota-sales-dashboard/**. Aku pakai GitHub Pages, bukan Vercel, karena login Vercel butuh kamu klik di browser. Brief membolehkan hosting gratis apa saja.

Sudah aku cek langsung di versi live: total Rp 298.937.000 dan 1–15 Okt Rp 146.226.000, per channel juga cocok. Upload ulang data yang sama tidak menggandakan revenue, di lebar HP tidak ada scroll horizontal, dan tidak ada error di console.

**Yang aku tambahkan:**
- **Deploy otomatis:** setiap push ke `main` menjalankan 73 test dulu. Kalau ada yang gagal, versi baru tidak di-publish. Workflow-nya di [deploy.yml](Home_Test/biota-sales-dashboard/.github/workflows/deploy.yml).
- **Bisa juga di Vercel:** build yang sama bisa di-import ke Vercel kapan saja tanpa perubahan kode, kalau kamu tetap mau.
- **README:** link live dan cara deploy sudah diperbarui, lalu di-push.

**Yang hanya bisa kamu kerjakan:**
1. **CSV asli:** taruh di `data/biota_orders_oct2026.csv` (timpa file rekonstruksi), lalu jalankan `npm test`. Kalau lulus, angkanya aman. Kalau gagal, kirim hasilnya ke aku.
2. **Log prompt:** di akhir, jalankan `/export` di sesi ini dan simpan hasilnya ke folder `prompt-log/` di repo, karena README sudah merujuk ke sana. Jangan diedit, brief memintanya apa adanya.
3. **Bagian "Tiga hal yang salah dikerjakan AI" di README:** baca dan pastikan kamu bisa menjelaskannya di sesi live.

## Interaksi, tampilan, dan verifikasi angka

---

### Prompt 7 · Prompt · 25 Nov 2026 13:55 WIB

```text
buat yang keren interaktif dong
```

#### Claude

Bisa. Satu hal yang perlu dijaga: brief menilai "angka benar dan sederhana" lebih tinggi daripada banyak fitur. Jadi interaktivitasnya aku pusatkan pada eksplorasi data yang sama, sementara logika angka dan test yang mengunci angka final tidak berubah. Karena aku akan membuat chart, aku muat dulu skill dataviz.

> `Skill: dataviz`

> `Bash: Read the dataviz reference palette`

> `Bash: Read interaction, marks and anti-pattern references`

> `Bash: Validate the 3-channel palette for light and dark`

> `Write: Home_Test/biota-sales-dashboard/src/lib/metrics.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/metrics.test.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/metrics.test.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/golden.test.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/golden.test.ts`

> `Bash: Run tests for the new filter and daily logic`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/format.ts`

> `Write: Home_Test/biota-sales-dashboard/src/hooks/useAnimatedNumber.ts`

> `Write: Home_Test/biota-sales-dashboard/src/components/channelColor.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/FilterBar.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/KpiRow.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/TrendChart.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/ChannelSection.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/TopProducts.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/ProductTable.tsx`

> `Bash: Remove the replaced filter and product components`

Komponen utama sudah selesai. Sekarang App yang menyatukan semuanya (state filter, tema), tampilan awal upload yang lebih menarik, dan stylesheet lengkap dengan mode gelap.

> `Write: Home_Test/biota-sales-dashboard/src/App.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/UploadArea.tsx`

> `Edit: Home_Test/biota-sales-dashboard/src/components/Reconciliation.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/styles.css`

> `Bash: Type-check, build and test the new UI`

> `Bash: Drive every new interaction in headless Chrome`

> `Read: <scratchpad>/e2e/shots2/1-light.png`

> `Read: <scratchpad>/e2e/shots2/2-dragging.png`

> `Read: <scratchpad>/e2e/shots2/3-tooltip.png`

> `Read: <scratchpad>/e2e/shots2/5-dark.png`

> `Read: <scratchpad>/e2e/shots2/6-mobile-dark.png`

> `Edit: Home_Test/biota-sales-dashboard/src/styles.css`

> `Edit: Home_Test/biota-sales-dashboard/src/styles.css`

> `Edit: Home_Test/biota-sales-dashboard/src/styles.css`

> `Bash: Cross-check Oct 10 numbers, then retest sorting, drag and clicks`

> `Read: <scratchpad>/e2e/shots2/7-drag2.png`

> `Read: <scratchpad>/e2e/shots2/8-mobile-rank.png`

> `Bash: Cross-check the single-day total for Oct 5`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Bash: Test, build, commit and push the interactive version`

> `Bash: Wait for deploy, then test the live site`

Versi interaktifnya sudah live di **https://lekreys.github.io/biota-sales-dashboard/**. Angkanya tidak berubah: Rp 298.937.000 untuk sebulan dan Rp 146.226.000 untuk 1–15 Okt.

**Yang baru:**
- **Grafik harian bertumpuk per channel:** hover untuk melihat rincian per hari, drag untuk memilih rentang tanggal, klik satu batang untuk satu hari (klik lagi untuk kembali). Tiap grafik juga punya versi tabel.
- **Filter gabungan:** baris filter (periode, channel, produk) menempel di atas dan berlaku untuk semua bagian.
  - Klik channel untuk melihat channel itu saja.
  - Klik produk di Top 10 atau di tabel untuk memfilter ke produk itu.
- **Angka utama + 4 kartu:** pesanan, unit, rata-rata per pesanan, dan nilai yang tidak dihitung. Angkanya beranimasi naik saat filter berubah.
- **Top 10:** setiap bar dipecah per channel.
- **Tabel produk:** bisa dicari dan diurutkan.
- **Mode gelap/terang:** tombol ☾/☀ di kanan atas. Warna channel sudah lolos validasi untuk buta warna di kedua mode.

**Pengecekan:**
- 81 test lulus. Test baru memastikan total harian sama dengan total bulan, filter Shopee saja = Rp 180.315.000, dan filter satu produk = angka di tabel.
- Di browser, semua interaksi tadi aku coba satu per satu dan hasilnya cocok dengan test. Angka tooltip per hari aku cocokkan dengan skrip Python (contohnya 10 Okt Rp 6.650.000, 5 Okt Rp 8.856.000).
- Tidak ada error di console, dan di lebar HP tidak ada scroll horizontal.
- Dari screenshot aku menemukan dan memperbaiki dua masalah tampilan: label rentang saat drag menimpa teks keterangan, dan nama produk Top 10 terpotong di HP.

Kodenya sekarang lebih banyak, padahal brief menilai "sederhana dan jelas" dan di sesi live kamu harus menjelaskan kode. Bagian yang paling mungkin ditanyakan adalah logika drag di [TrendChart.tsx](Home_Test/biota-sales-dashboard/src/components/TrendChart.tsx) dan aturan filter mana yang diabaikan oleh panel mana di `applyFilters` ([metrics.ts](Home_Test/biota-sales-dashboard/src/lib/metrics.ts)).

Masih tersisa dari sebelumnya:
- Timpa CSV di `data/` dengan file aslimu, lalu jalankan `npm test`.
- Jalankan `/export` sesi ini ke folder `prompt-log/`.
- Review bagian "tiga kesalahan AI" di README.

---

### Prompt 8 · Prompt · 25 Nov 2026 14:09 WIB

```text
kalo bisa ada tabnya gitu atau buat interaktif dan keren gitu biar wow gitu pas interview rapih simple
```

#### Claude

Bisa. Aku susun ulang jadi tab supaya lebih rapi, dan setiap tab punya satu cerita yang jelas untuk dipresentasikan saat interview:

1. **Ringkasan:** angka utama, grafik harian, dan kartu channel dengan sparkline.
2. **Produk:** Top 10 dan tabel semua produk. Ini persis syarat nomor 3–4 di brief.
3. **Kualitas data:** bagian "wow"-nya. Alur 495 baris → 473 bersih → 393 dihitung, dan contoh nyata setiap format berantakan beserta cara aplikasi membacanya (format tanggal, harga, ejaan channel, SKU, duplikat). Ini cerita terkuat di depan penilai, karena penilaian utamanya adalah angka yang benar.
4. **Data bersih:** semua baris hasil pembersihan, bisa dicari, difilter per status, dan diunduh.

Untuk tab Kualitas data, aplikasi perlu mencatat format apa saja yang ditemukan di file. Logika itu aku tambahkan di lib dulu, lengkap dengan test.

> `Read: Home_Test/biota-sales-dashboard/src/lib/parse.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/parse.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/parse.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/parse.ts`

> `Read: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Read: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/types.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/parse.test.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/parse.test.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/clean.test.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/golden.test.ts`

> `Bash: Run tests for the new format report`

> `Write: Home_Test/biota-sales-dashboard/src/components/Tabs.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/ChannelCards.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/DataQuality.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/CleanDataTable.tsx`

Sekarang KPI tanpa tombol unduh (pindah ke tab Data bersih), filter bar masuk ke dalam toolbar yang menempel bersama tab, lalu App disusun ulang dengan 4 tab.

> `Edit: Home_Test/biota-sales-dashboard/src/components/CleanDataTable.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/KpiRow.tsx`

> `Edit: Home_Test/biota-sales-dashboard/src/components/FilterBar.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/App.tsx`

> `Bash: Remove replaced components and type-check`

Type-check bersih. Sekarang CSS untuk tab, toolbar, kartu channel, alur pipeline, badge status, dan tabel data.

> `Edit: Home_Test/biota-sales-dashboard/src/styles.css`

> `Bash: Add status tokens and responsive rules, then build and test`

Build lolos dan 95 test lulus. Sekarang uji semua tab di browser: perpindahan tab (klik dan keyboard), tab tetap sama setelah refresh (#hash), angka di tiap tab, serta screenshot terang/gelap/HP.

> `Bash: Test all four tabs, keyboard, hash and mobile`

> `Bash: Fix test selectors and rerun the tab checks`

> `Read: <scratchpad>/e2e/shots3/1-ringkasan.png`

> `Read: <scratchpad>/e2e/shots3/3-kualitas.png`

> `Read: <scratchpad>/e2e/shots3/4-data.png`

> `Read: <scratchpad>/e2e/shots3/6-mobile.png`

> `Edit: Home_Test/biota-sales-dashboard/src/hooks/useAnimatedNumber.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/components/Tabs.tsx`

> `Edit: Home_Test/biota-sales-dashboard/src/components/Tabs.tsx`

> `Bash: Rebuild and check numbers show final values instantly`

---

### Prompt 9 · Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 14:17 WIB

```text
untuk chart terus warna jangan seperti ai dong dan aku agak ga suka kalo scroll ke bawah terus
```

#### Claude

> `Bash: Validate brand-aligned channel palettes in light and dark`

> `Bash: Search for passing terracotta/indigo/teal-green palettes`

> `Bash: Install the Plus Jakarta Sans variable font package`

> `Write: Home_Test/biota-sales-dashboard/src/components/Icons.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/UploadArea.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/KpiRow.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/ChannelCards.tsx`

Sekarang grafik harian: tinggi plot mengikuti sisa layar, dan tampilan tabelnya jadi tombol Grafik/Tabel di header kartu, bukan bagian yang bisa dibuka yang mendorong layout ke bawah.

> `Write: Home_Test/biota-sales-dashboard/src/components/TrendChart.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/components/TopProducts.tsx`

> `Bash: Make product, top-10 and data tables scroll inside their cards`

Sekarang tab Kualitas data. Isinya aku padatkan jadi satu baris alur (sudah termasuk pemeriksaan otomatis) dan tiga kolom di bawahnya (Format, Channel & SKU, Status), supaya muat satu layar.

> `Write: Home_Test/biota-sales-dashboard/src/components/DataQuality.tsx`

> `Edit: Home_Test/biota-sales-dashboard/src/components/Tabs.tsx`

Sekarang App dengan susunan baru: satu top bar berisi brand, tab, file, dan tema, lalu baris filter di bawahnya, dan konten mengisi sisa layar. File juga bisa di-drag ke mana saja di jendela.

> `Write: Home_Test/biota-sales-dashboard/src/App.tsx`

> `Bash: Load the font and find leftover unicode icon glyphs`

> `Edit: Home_Test/biota-sales-dashboard/src/components/FilterBar.tsx`

> `Edit: Home_Test/biota-sales-dashboard/src/components/FilterBar.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/styles.css`

> `Bash: Type-check, build and test the redesign`

Penulisan `styles.css` ditolak karena file itu sempat aku ubah lewat skrip, jadi aku baca ulang dulu lalu tulis lagi.

> `Read: Home_Test/biota-sales-dashboard/src/styles.css`

> `Bash: No-op placeholder before rewriting the stylesheet`

> `Write: Home_Test/biota-sales-dashboard/src/styles.css`

> `Bash: Build and check every tab fits one screen`

Keempat tab muat satu layar tanpa scroll halaman, baik di 1280×800 maupun 1440×900. Karena `overflow: hidden` bisa saja memotong konten diam-diam, aku periksa screenshot-nya satu per satu.

> `Read: <scratchpad>/e2e/shots4/1280-Ringkasan.png`

> `Read: <scratchpad>/e2e/shots4/1280-Kualitas-data.png`

> `Read: <scratchpad>/e2e/shots4/1280-Produk.png`

> `Read: <scratchpad>/e2e/shots4/1280-Data-bersih.png`

> `Read: <scratchpad>/e2e/shots4/dark-ringkasan.png`

> `Read: <scratchpad>/e2e/shots4/hover.png`

Tab Data bersih, tooltip, dan mode gelap sudah rapi. Sekarang padatkan baris Top 10.

> `Read: Home_Test/biota-sales-dashboard/src/components/TopProducts.tsx`

> `Edit: Home_Test/biota-sales-dashboard/src/components/TopProducts.tsx`

> `Bash: Rebuild, check Top 10 fits, rerun number checks and mobile`

> `Read: <scratchpad>/e2e/shots4/produk2.png`

> `Read: <scratchpad>/e2e/shots4/0-empty.png`

> `Bash: Pin the top-bar actions to the last column`

> `Read: Home_Test/biota-sales-dashboard/README.md`

---

### Prompt 10 · Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 14:27 WIB

```text
dan pastikan yansemua perhiutngan formula bener , kalo bisa chartnya yang keren dan menarik ya
```

#### Claude

> `Edit: Home_Test/biota-sales-dashboard/src/lib/metrics.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/metrics.test.ts`

> `Edit: Home_Test/biota-sales-dashboard/src/lib/metrics.test.ts`

> `Read: Home_Test/biota-sales-dashboard/scripts/verify_numbers.py`

> `Bash: Add a JSON mode with filter scenarios to the Python check`

Python sudah menghitung 8 skenario. Sekarang test TypeScript yang membandingkan setiap angka dengan hasil Python.

> `Write: Home_Test/biota-sales-dashboard/src/lib/crosscheck.test.ts`

> `Bash: Run the cross-check against the Python implementation`

> `Bash: Single-source KPI formulas, then break formulas to prove the cross-check catches them`

> `Edit: Home_Test/biota-sales-dashboard/src/components/KpiRow.tsx`

> `Bash: Add average line, peak label, grow animations and channel split bar`

> `Bash: Compare every on-screen number to Python across 8 scenarios`

**318 angka yang tampil di layar, di 8 skenario, semuanya sama persis dengan hitungan Python.** Tidak ada satu pun yang beda. Sekarang aku lihat tampilan chart barunya.

> `Bash: Screenshot the improved charts in light, hover, filter and dark`

> `Read: <scratchpad>/e2e/shots4/r-1440.png`

> `Read: <scratchpad>/e2e/shots4/r-hover.png`

> `Read: <scratchpad>/e2e/shots4/r-dark.png`

> `Bash: Inspect whether the chart tooltip renders on hover`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Bash: Check README for stale references`

> `Bash: Test, build, commit and push the redesign`

> `Bash: Wait for deploy, confirm CI ran the cross-check, then verify the live site`

> `Edit: ~/.claude/projects/<project>/memory/biota-take-home.md`

Semua sudah live di **https://lekreys.github.io/biota-sales-dashboard/**.

**Perhitungan dicek dengan tiga cara:**
- **Hitungan kedua yang terpisah:** skrip Python yang sama sekali tidak memakai kode app menghitung ulang setiap angka yang tampil di dashboard dalam 8 skenario filter. Skenarionya antara lain semua data, 1–15 Okt, 16–31 Okt, satu hari, Shopee saja, dua channel dengan rentang tanggal, dan satu produk. Test cross-check memastikan hasil app sama persis dengan Python, dan test ini ikut jalan di GitHub sebelum setiap deploy.
- **Rumus sengaja dirusak:** empat rumus aku rusak satu per satu (tanggal akhir eksklusif, unit dihitung dari semua status, rata-rata dibulatkan ke bawah, retur ikut masuk grafik). Setiap kali test langsung gagal, jadi pengecekannya memang bekerja.
- **Angka yang tampil di layar:** robot browser mengatur ke-8 skenario lewat filter di situs live, lalu membaca angka yang benar-benar tampil. Hasilnya 318 angka, semua sama dengan Python.

Di tengah jalan aku menemukan dan memperbaiki dua masalah:
- Rumus "rata-rata per pesanan" dan "tidak dihitung" ditulis dua kali, di tampilan dan di test, jadi test sebenarnya memeriksa salinannya. Sekarang hanya ada satu sumber rumus.
- Animasi hitung naik membuat angka utama sempat tampil Rp 298.794.045 saat tab dibuka. Sekarang angka langsung final, dan animasi hanya berjalan saat filter berubah.

**Tampilan:**
- **4 tab** (Ringkasan · Produk · Kualitas data · Data bersih). Di laptop setiap tab muat satu layar tanpa scroll halaman (dicek di 1280×800 dan 1440×900). Kalau ada tabel panjang, hanya tabelnya yang di-scroll di dalam kartu.
- **Warna:** Shopee terakota, TikTok biru tinta, Tokopedia hijau. Ketiganya mengikuti warna brand masing-masing marketplace dan lolos uji buta warna. Latarnya warna kertas hangat, fontnya Plus Jakarta Sans, dan ikon emoji sudah diganti ikon garis.
- **Grafik harian:** batang bertumpuk per channel, garis rata-rata 7 hari, label hari tertinggi, drag untuk memilih tanggal, tombol Grafik/Tabel, dan batang yang tumbuh saat tab dibuka.

Untuk interview, tab **Kualitas data** adalah cerita terkuat: 495 baris dibaca → 473 bersih → 393 dihitung, plus contoh asli setiap format berantakan dan cara app membacanya.

Yang masih perlu kamu kerjakan sendiri:
- Timpa CSV di `data/` dengan file aslimu, lalu jalankan `npm test`.
- Jalankan `/export` sesi ini ke folder `prompt-log/`.
- Review bagian "tiga kesalahan AI" di README.

## Penyederhanaan, README, dan kerapian kode

---

### Prompt 11 · Prompt · 25 Nov 2026 14:37 WIB

```text
untuk kualitas data dandata bersih itu biingung aku , TRERUS RAME BGT KALO BISA SIMPLE SIMPLE AJA ILANGIN YANG GA PERLU
```

#### Claude

Oke, aku sederhanakan. Rencananya:
- **Tab jadi 3:** Ringkasan · Produk · Data. Tab "Kualitas data" dan "Data bersih" digabung jadi satu tab **Data** yang isinya hanya dua kartu sederhana:
  1. **Dari file ke angka:** daftar hitungan seperti struk belanja (495 baris → −22 duplikat → 473 bersih → −80 batal/retur → 393 dihitung = Rp 298.937.000) plus satu tombol unduh.
  2. **Yang dibersihkan otomatis:** 6 poin kalimat biasa (nama channel, tanggal, harga, SKU, duplikat, status).
- **Dihapus:** bar segmen, daftar centang, tabel format, chip ejaan, tabel status, tabel data dengan cari/filter/halaman, angka badge di tab, kartu "Rata-rata/pesanan" dan "Tidak dihitung", dan kotak cari di tabel produk (cuma 12 produk).

Logika data dan pengecekan angkanya tetap sama.

> `Write: Home_Test/biota-sales-dashboard/src/components/DataTab.tsx`

> `Bash: Merge to three tabs and remove the extra panels and figures`

Sekarang bersihkan CSS dari semua gaya yang tidak terpakai lagi, lalu tambahkan gaya untuk tab Data yang baru.

> `Bash: Replace data-quality styles, drop unused CSS and audit class usage`

> `Bash: Remove the last unused CSS rules, then type-check, test and build`

> `Bash: Recheck every on-screen number and screenshot the simplified tabs`

> `Bash: Find which element overflows at phone width`

> `Bash: Let the format chips wrap, rebuild and recheck phone width`

> `Read: <scratchpad>/e2e/shots5/s-Data.png`

> `Read: <scratchpad>/e2e/shots5/s-Ringkasan.png`

> `Bash: Fix chip spacing, update README for three tabs, then test and build`

README sudah bersih dari referensi lama, 130 test lulus, dan build berhasil. Sekarang commit, push, tunggu deploy, lalu cek ulang di situs live.

> `Bash: Commit, push, wait for deploy and verify the live site`

> `Edit: ~/.claude/projects/<project>/memory/biota-take-home.md`

Sudah aku sederhanakan dan sudah live di https://lekreys.github.io/biota-sales-dashboard/

**Tab sekarang hanya 3: Ringkasan · Produk · Data.**

Tab "Kualitas data" dan "Data bersih" aku gabung jadi satu tab **Data**, isinya cuma dua kartu:
- **Dari file ke angka:** hitungan seperti struk. 495 baris di file, −22 duplikat, 473 bersih, −80 batal/retur, 393 dihitung, net revenue **Rp 298.937.000**. Di bawahnya satu tombol "Unduh data bersih (CSV)".
- **Yang dibersihkan otomatis:** 6 poin kalimat biasa, yaitu nama channel, tanggal, harga, SKU kosong, duplikat, dan status.

**Yang aku hapus:**
- di tab data: bar segmen, daftar centang, tabel format, chip ejaan channel, tabel status, dan tabel data dengan cari/filter/halaman
- angka kecil di samping nama tab
- kartu "Rata-rata/pesanan" dan "Tidak dihitung" di Ringkasan (sekarang cuma net revenue, pesanan, unit)
- kotak cari di tabel produk (produknya cuma 12)
- kode dan CSS yang hanya dipakai bagian-bagian itu

**Angka tetap dijaga:**
- 130 test lulus, termasuk cek silang dengan Python di 8 skenario filter.
- Di situs live, 310 angka yang tampil di layar sama persis dengan hitungan Python.
- Ketiga tab muat satu layar di laptop, dan di HP tidak ada geser ke samping. Ada satu masalah kecil yang muncul dan sudah aku perbaiki: chip contoh tanggal di tab Data sempat melebar ke samping di HP.

---

### Prompt 12 · Prompt · 25 Nov 2026 15:01 WIB

```text
REDME NYA BUAT SIMPLE BENER EBENR ORANG NON TEKNIK PAHAM
```

#### Claude

Siap. README aku tulis ulang untuk pembaca non-teknis: kalimat pendek, tanpa istilah programmer, dan bagian teknis aku pindah ke paling bawah. Bagian yang diwajibkan brief tetap ada semua: cara menjalankan, angka akhir, keputusan & asumsi, tiga kesalahan AI, rencana berikutnya, dan tools AI.

> `Read: Home_Test/biota-sales-dashboard/README.md`

> `Write: Home_Test/biota-sales-dashboard/README.md`

> `Bash: Verify two facts stated in the new README`

> `Edit: Home_Test/biota-sales-dashboard/README.md`

> `Bash: Commit and push the simplified README`

Ditulis untuk: tim BIOTA yang menilai, termasuk orang non-teknis.

README sudah aku tulis ulang dan push ke GitHub ([README.md](Home_Test/biota-sales-dashboard/README.md), 108 baris). Isinya berurutan:

1. **Link aplikasi** di paling atas.
2. **Hasil akhir dalam satu tabel:** seluruh Oktober dan 1–15 Oktober, per marketplace dan totalnya.
3. **Cara memakai** dalam 5 langkah.
4. **Keputusan tentang data** dalam kalimat biasa, misalnya "baris dobel dibuang" dan "tanggal TikTok 03/10 dibaca 3 Oktober".
5. **Bagaimana angkanya dipastikan benar,** cukup 3 poin.
6. **Tiga kesalahan AI** beserta perbaikannya: angka "setengah jalan" sempat tampil di layar, jumlah kode produk terhitung dobel, dan warna yang tidak bisa dibedakan penderita buta warna.
7. **Kalau ada waktu lagi** dan **tools AI yang dipakai.**
8. **Untuk developer** dipisah di paling bawah, supaya pembaca non-teknis bisa berhenti sebelum bagian itu.

Dua klaim di README sudah aku cocokkan ulang dengan data: "Dikomplain - Retur" memang 2 pesanan senilai Rp 437.000, dan 22 baris dobel masing-masing muncul tepat dua kali.

Dua hal yang perlu kamu perhatikan sebelum kirim:
- **Tiga kesalahan AI itu semuanya ditemukan oleh aku sendiri saat mengecek, bukan oleh kamu,** dan penilai bisa melihat itu di log prompt. Kalau saat mereview kamu menemukan kesalahan sendiri, tukar salah satunya dengan temuanmu.
- **README menyebut folder `prompt-log/`, tapi folder itu belum ada.** Jalankan `/export` di sesi ini dan simpan hasilnya di folder itu.

---

### Prompt 13 · Prompt · 25 Nov 2026 15:03 WIB

```text
LALU TOLONG BUAT KODENYA RAPI YAH CLEAN CODE , UNTUK KOMEN KOMEN APUS SEMUA
```

#### Claude

Siap. Dua hal yang aku kerjakan:
1. **Hapus semua komentar** di kode (TypeScript, CSS, Python, config).
2. **Rapikan kode:**
   - buang kode yang tidak terpakai lagi
   - pecah `App.tsx` yang terlalu panjang (logika tema, baca file, dan unduh jadi file sendiri)
   - samakan format semua file dengan Prettier

Hasilnya tetap harus lolos semua test dan pengecekan angka di layar.

Pertama aku inventaris dulu semua komentar dan kode yang mati.

> `Bash: List all comments and find unused exports`

zsh menafsirkan `*.ts` sebagai glob, jadi perintahnya gagal. Aku ulangi dengan tanda kutip.

> `Bash: List comments and where each export is used`

> `Bash: Show current chart, product and filter components`

Sekarang lapisan logika (`src/lib`) aku tulis ulang bersih: satu fungsi per tugas, nama yang jelas, tanpa komentar.

> `Write: Home_Test/biota-sales-dashboard/src/lib/types.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/parse.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/clean.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/metrics.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/csv.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/format.ts`

`metrics.ts` ditolak karena sempat diubah lewat skrip. Aku baca dulu, lalu tulis ulang.

> `Read: Home_Test/biota-sales-dashboard/src/lib/metrics.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/metrics.ts`

> `Write: Home_Test/biota-sales-dashboard/src/hooks/useTheme.ts`

> `Write: Home_Test/biota-sales-dashboard/src/hooks/useHashTab.ts`

> `Write: Home_Test/biota-sales-dashboard/src/hooks/useAnimatedNumber.ts`

> `Bash: Rename component files to match what they contain`

Sebelum menulis ulang, aku perlu membuka dulu file-file itu dengan tool Read (syarat sebelum menimpa file).

> `Read: Home_Test/biota-sales-dashboard/src/components/ChannelColor.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/components/ChannelPanel.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/components/FileUpload.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/components/KpiStrip.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/components/TopProducts.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/components/ProductTable.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/components/FilterBar.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/components/DataTab.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/components/Tabs.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/components/TrendChart.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/App.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/ChannelColor.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/ChannelPanel.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/FileUpload.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/KpiStrip.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/Icons.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/Tabs.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/FilterBar.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/ProductTable.tsx`

> `Edit: Home_Test/biota-sales-dashboard/src/components/ProductTable.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/TrendChart.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/TopProducts.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/components/DataTab.tsx`

> `Write: Home_Test/biota-sales-dashboard/src/App.tsx`

> `Bash: Type-check the rewritten app`

> `Read: Home_Test/biota-sales-dashboard/src/lib/parse.test.ts`

> `Read: Home_Test/biota-sales-dashboard/src/lib/clean.test.ts`

> `Read: Home_Test/biota-sales-dashboard/src/lib/metrics.test.ts`

> `Read: Home_Test/biota-sales-dashboard/src/lib/golden.test.ts`

> `Read: Home_Test/biota-sales-dashboard/src/lib/crosscheck.test.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/parse.test.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/clean.test.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/metrics.test.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/golden.test.ts`

> `Write: Home_Test/biota-sales-dashboard/src/lib/crosscheck.test.ts`

> `Bash: Type-check and run the rewritten tests`

> `Read: Home_Test/biota-sales-dashboard/scripts/verify_numbers.py`

> `Write: Home_Test/biota-sales-dashboard/scripts/verify_numbers.py`

> `Bash: Check the Python script, strip CSS and config comments, find any left`

> `Bash: Rename filter class, audit CSS against components, find long Python lines`

> `Bash: Wrap long Python lines, add Prettier and format every file`

> `Bash: Run format check, types, tests, build and the full on-screen number check`

> `Bash: Show the remaining long Python line`

> `Read: <scratchpad>/e2e/shots5/s-Data.png`

> `Bash: Finish cleanup, commit, push, deploy and verify the live site`

## Persiapan pengiriman: log prompt, deploy, dan kelengkapan syarat

---

### Prompt 14 · Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 15:13 WIB

```text
SETELAH ITU BUATIN YANG PROMPT LOG  SAMA SIAPIN AKU MAU SIAPIN BUAT DI VERCEL DEPLOYNYA
```

#### Claude

> `Bash: Locate this session's transcript file`

Transkripnya ketemu. Aku lihat dulu strukturnya: mana yang ketikanmu sendiri, mana yang hasil tool atau tambahan otomatis dari sistem.

> `Bash: Profile transcript entries and list user-typed messages`

> `Bash: Find queued mid-turn messages and question answers`

---

### Prompt 15 · Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 15:14 WIB

```text
DAN PASTIKAN UNTUK SEMUA PERSYARATAN DI @"Home_Test/AI-Native Software Engineer — Tes Take-Home.pdf"  UDH LENGKAP SEMUA DAN BAGUS KERJAKAN SEMUA YANGDETAIL
```

#### Claude

> `Bash: Extract every prompt verbatim from the session into prompt-log`

15 prompt terambil, termasuk dua pesan terbarumu. Pemeriksaan privasi bersih: tidak ada email, tidak ada sisipan sistem. Aku lihat isi bagian awalnya untuk memastikan formatnya rapi.

> `Bash: Preview the start of the generated prompt log`

> `Bash: Add Vercel config, Node engine, conditional Pages deploy and a prompt-log updater`

> `Read: Home_Test/biota-sales-dashboard/README.md`

> `Bash: Commit, then build a fresh clone exactly like Vercel and test it at the site root`

> `Bash: Push and confirm CI and Pages still work`

> `Write: Home_Test/CHECKLIST_PENGIRIMAN.md`

Satu pengecekan terakhir sebelum selesai: pastikan file brief (PDF) dan file .xlsx tidak ikut ter-commit ke repo public.

> `Bash: Confirm brief and xlsx are not in the repo`

> `Edit: ~/.claude/projects/<project>/memory/biota-take-home.md`

Kode, prompt log, dan persiapan Vercel sudah aku kerjakan dan push ke GitHub. Situs live tetap jalan, dan 310 angka di layar masih cocok dengan hitungan Python.

**Kode rapi:**
- Semua komentar dihapus (TypeScript, CSS, Python, config), sesuai permintaanmu.
- Kode mati dan fungsi ganda dibuang.
- Semua angka yang tampil di layar sekarang dihitung oleh satu fungsi (`buildDashboard`), dan cek silang Python memeriksa fungsi itu langsung.
- `App.tsx` dipecah: logika tema, tab, baca file, dan unduh masing-masing jadi file sendiri. Nama komponen sekarang sesuai isinya.
- Format seragam dengan Prettier, dan pengecekannya ikut jalan otomatis di GitHub.
- 118 test lulus. Jumlahnya berkurang dari 130 karena beberapa test digabung, cakupannya sama.
- Satu bug kecil ikut ketemu dan diperbaiki: contoh ejaan channel di tab Data tadinya ditulis manual. Sekarang diambil dari file, jadi tetap benar untuk file lain.

**Prompt log:** [prompt-log/claude-code-prompts.md](Home_Test/biota-sales-dashboard/prompt-log/claude-code-prompts.md) berisi 15 prompt-mu, berurutan dan tanpa diedit, termasuk pesan yang kamu kirim saat aku sedang bekerja dan jawabanmu di sesi brainstorm. Isinya diambil otomatis dari file sesi, dan sudah aku cek tidak memuat email-mu.

**Vercel:** `vercel.json` sudah ada, jadi saat import tidak ada setting yang perlu diubah. Proses build Vercel sudah aku simulasikan dari clone baru dan hasilnya benar. Langkah-langkahnya ada di checklist, intinya:
1. Buka vercel.com dan login pakai GitHub.
2. Klik Add New → Project → pilih `biota-sales-dashboard` → Deploy.
3. Kirim URL-nya ke aku, nanti aku pasang di README.

**Semua syarat di PDF** sudah aku petakan poin per poin di [CHECKLIST_PENGIRIMAN.md](Home_Test/CHECKLIST_PENGIRIMAN.md) (di luar repo), lengkap dengan draf email ke BIOTA. Semua sudah ✅ kecuali dua hal:

1. **Aturan "jangan sebarkan data" belum terpenuhi.** CSV-nya ada di repo public dan bisa dimuat lewat tombol "Pakai data contoh" di situs. Saranku: setelah Vercel jalan, jadikan repo private lalu undang reviewer BIOTA (brief membolehkan ini). Vercel tetap jalan untuk repo private, dan workflow-nya sudah aku siapkan untuk itu. Ini keputusanmu, jadi aku tidak mengubahnya.
2. **Log prompt final dilakukan paling akhir,** setelah tidak ada prompt lagi:
   - Jalankan `python3 Home_Test/perbarui_prompt_log.py`.
   - Ketik `/export` dan simpan hasilnya sebagai `prompt-log/claude-code-export.txt`.
   - Cek file export itu tidak berisi email sebelum di-push.

Masih berlaku juga: timpa CSV di `data/` dengan file aslimu lalu jalankan `npm test && npm run verify`, dan tinjau ulang "Tiga kesalahan AI" di README, karena ketiganya ditemukan oleh aku, bukan oleh kamu.

---

### Prompt 16 · Prompt · 25 Nov 2026 15:57 WIB

```text
untuk yang csv aku aja nanti upload manual gitu terus jalanin yang log prompt
```

#### Claude

Oke, CSV kamu yang urus nanti. Sekarang aku jalankan pembaruan log prompt supaya prompt terbarumu ikut masuk, lalu push ke GitHub.

> `Bash: Regenerate the prompt log and check it for private data`

> `Bash: Commit and push the updated prompt log, confirm CI passes`

Log prompt sudah diperbarui dan di-push: sekarang berisi 16 entri, termasuk prompt barusan. Pemeriksaan privasi bersih (tidak ada email), dan workflow di GitHub lulus.

Sisa yang perlu kamu kerjakan sendiri:

1. **CSV asli:** timpa `data/biota_orders_oct2026.csv`, lalu jalankan `npm test && npm run verify` untuk memastikan angkanya tetap sama.
2. **Log prompt final**, setelah tidak ada prompt lagi ke aku:
   - `python3 Home_Test/perbarui_prompt_log.py` supaya prompt terakhir ikut masuk.
   - Ketik `/export` di Claude Code dan simpan hasilnya sebagai `prompt-log/claude-code-export.txt`. Langkah ini hanya bisa kamu yang jalankan.
   - Cari tanda `@` di file export untuk memastikan tidak ada email, lalu commit dan push folder `prompt-log`.
3. **Vercel:** langkahnya ada di [CHECKLIST_PENGIRIMAN.md](Home_Test/CHECKLIST_PENGIRIMAN.md). Kirim URL-nya kalau mau aku pasang di README.

Setiap prompt yang kamu kirim ke aku setelah ini ikut tercatat, jadi jalankan langkah nomor 2 paling akhir.

---

### Prompt 17 · Prompt · 25 Nov 2026 15:59 WIB

```text
jadi nanti pas appnya jalan udh di deploya aku upload aja csvnya ga ush taro datanya di repo
```

#### Claude

Bisa, dan itu malah lebih aman karena sesuai aturan PDF "jangan sebarkan data". Yang perlu berubah supaya repo tanpa CSV tetap jalan:
1. **Tombol "Pakai data contoh" dihapus.** Tombol ini memuat CSV yang ikut di-bundle, jadi kalau file-nya dihapus, build di Vercel akan gagal. Selain itu, kalau tombolnya tetap ada, datanya tetap tersebar lewat situs.
2. **File CSV dikeluarkan dari repo**, tapi tetap ada di komputermu (folder `data/` diabaikan Git).
3. **Test angka akhir dan cek silang Python** otomatis dilewati kalau file CSV tidak ada (misalnya di GitHub), dan tetap jalan di komputermu.
4. **README** disesuaikan supaya tidak menjanjikan hal yang tidak lagi benar.

> `Bash: Find every place that depends on the bundled sample data`

> `Read: Home_Test/biota-sales-dashboard/src/components/FileUpload.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/App.tsx`

> `Read: Home_Test/biota-sales-dashboard/src/lib/golden.test.ts`

> `Read: Home_Test/biota-sales-dashboard/src/lib/crosscheck.test.ts`

> `Bash: Remove the sample button, guard data-based tests, untrack the CSV`

> `Bash: Update README, then lint, test with data, and confirm the build has no data file`

> `Bash: Commit, then run lint, tests and build in a fresh clone without the CSV`

> `Bash: Upload the CSV into the clean build and compare every number to Python`

> `Bash: Update prompt log and checklist, push, and verify the live site no longer serves the data`

---

### Prompt 18 · Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 16:02 WIB

```text
lengkapin prompt lognya
```

#### Claude

> `Write: Home_Test/perbarui_prompt_log.py`

> `Bash: Generate the prompt log and full conversation, then check for private data`

> `Bash: Count assistant text blocks in the session and fix the heading case`

> `Bash: Check the session file for unreadable lines`

---

### Prompt 19 · Prompt susulan (dikirim saat Claude sedang bekerja) · 25 Nov 2026 16:04 WIB

```text
nah tolong promptnya buat lebih profesional dong
```

#### Claude

> `Read: Home_Test/perbarui_prompt_log.py`

> `Bash: Give the prompt log a professional layout without changing prompt text`
