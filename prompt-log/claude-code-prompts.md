# Log Prompt — Claude Code

- Tool: Claude Code (ekstensi VS Code)
- Model: Claude Opus 5.5 (`claude-opus-5-5`)

## 1. Prompt

```text
Tolong pelajari isi folder @Home_Test/, termasuk arahan tes dan data yang ada di dalamnya. Saya ingin menyelesaikan tes take-home ini sesuai dengan arahan dan data tersebut.

Sebelum mulai mengerjakan, saya minta kamu menyusun prompt eksekusi terlebih dahulu, supaya nantinya Claude Code dapat mengerjakan tes ini dengan hasil yang baik.

Untuk menyusun prompt tersebut, mari kita brainstorming terlebih dahulu. Ajukan pertanyaan yang detail kepada saya mengenai hal-hal yang perlu diputuskan sebelum pengerjaan dimulai.
```

## 2. Jawaban atas pertanyaan Claude (pilihan ganda)

| Pertanyaan | Jawaban |
|---|---|
| Data yang tersedia adalah `biota_orders_oct2026.xlsx` yang format tanggal dan harganya sudah berubah, padahal aplikasi harus mem-parse CSV asli. Apakah file .csv aslinya tersedia? | Ada CSV asli |
| Stack apa yang akan dipakai? (Penting untuk sesi live 60 menit, karena kode harus dijelaskan dan bug diperbaiki secara langsung.) | Vite + React + TypeScript |
| Status "Dikomplain - Retur" (2 baris Tokopedia, Rp437.000) ambigu karena retur belum final. Bagaimana perlakuannya? | Tidak dihitung |
| Gaya prompt untuk Claude Code? (Penilai membaca log prompt untuk melihat cara mengarahkan dan mengecek AI.) | Bertahap dengan checkpoint |

## 3. Jawaban atas pertanyaan Claude (pilihan ganda)

| Pertanyaan | Jawaban |
|---|---|
| Brief melarang menyebarkan brief dan datanya, padahal repo GitHub wajib dikirim. Bagaimana menangani file CSV di repo? | Repo publik dengan CSV (diubah di entri 16–17) |
| Bahasa untuk UI dashboard dan README? (README harus bisa dipahami orang non-teknis.) | Bahasa Indonesia |
| Fitur tambahan di luar 6 syarat wajib (brief menekankan "sesederhana mungkin") | Panel rekonsiliasi, upload banyak CSV, bar chart sederhana, unduh data bersih, dan "Other" (diklarifikasi di entri 4) |
| Seberapa ketat testing untuk logika data? | Unit test + golden test |

## 4. Jawaban atas pertanyaan Claude (pilihan ganda)

| Pertanyaan | Jawaban |
|---|---|
| Opsi "Other" dicentang tanpa isi. Fitur tambahan apa yang dimaksud? | Tidak ada, salah klik |
| Satu SKU punya nama listing berbeda di tiap marketplace (mis. BIO-CAM-BF). Nama apa yang ditampilkan di tabel produk? | Nama listing terpendek |
| Akun dan tool untuk deploy sudah siap? | GitHub + Vercel (dashboard) |

## 5. Prompt (dikirim saat Claude sedang bekerja)

```text
Setelah prompt selesai disusun, langsung kerjakan secara detail sampai selesai. Tidak perlu mengajukan pertanyaan lagi.
```

## 6. Prompt

```text
Silakan langsung mulai mengerjakan.
```

## 7. Prompt

```text
Tolong buat tampilan dashboard lebih menarik dan interaktif.
```

## 8. Prompt

```text
Jika memungkinkan, gunakan navigasi berbasis tab dan elemen interaktif agar tampilannya mengesankan saat dipresentasikan di interview, tetapi tetap rapi dan sederhana.
```

## 9. Prompt (dikirim saat Claude sedang bekerja)

```text
Untuk chart, gunakan palet warna yang tidak terlihat generik seperti buatan AI. Selain itu, kurangi kebutuhan scroll panjang ke bawah.
```

## 10. Prompt (dikirim saat Claude sedang bekerja)

```text
Pastikan semua perhitungan dan formula sudah benar. Jika memungkinkan, buat chart yang lebih menarik.
```

## 11. Prompt

```text
Bagian "Kualitas Data" dan "Data Bersih" masih membingungkan, dan tampilannya terlalu ramai. Tolong sederhanakan dan hapus elemen yang tidak perlu.
```

## 12. Prompt

```text
Tulis README sesederhana mungkin agar mudah dipahami oleh pembaca non-teknis.
```

## 13. Prompt

```text
Rapikan kode sesuai prinsip clean code dan hapus semua komentar.
```

## 14. Prompt (dikirim saat Claude sedang bekerja)

```text
Setelah itu, susun log prompt dan siapkan proyek untuk deploy ke Vercel.
```

## 15. Prompt (dikirim saat Claude sedang bekerja)

```text
Pastikan semua persyaratan dalam @"Home_Test/AI-Native Software Engineer — Tes Take-Home.pdf" sudah terpenuhi secara lengkap dan berkualitas. Kerjakan semuanya secara detail.
```

## 16. Prompt

```text
File CSV akan saya unggah secara manual nanti, jadi tidak perlu disertakan di repo. Lanjutkan penyusunan log prompt.
```

## 17. Prompt

```text
Jadi, setelah aplikasi di-deploy, saya akan mengunggah CSV langsung melalui aplikasi. Data tidak perlu disimpan di repo.
```

## 18. Prompt (dikirim saat Claude sedang bekerja)

```text
Tolong lengkapi log prompt.
```