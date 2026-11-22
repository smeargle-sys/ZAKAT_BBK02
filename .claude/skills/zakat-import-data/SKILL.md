---
name: zakat-import-data
description: Impor data zakat historis dari file xlsx lama (2024 format A, 2025–2026 format B) ke spreadsheet ZAKAT BBK02, cek Impor_Log (harus SAMA dengan rekap lama), review pencocokan nama ke sensus (Impor_Review, Pilih_ID_Keluarga, Jadikan_SM), dan menambah tahun/format baru ke importer. Gunakan saat go-live impor, impor ulang, atau ada format sheet baru.
metadata:
  project: zakat-bbk02
---

# Impor data historis

## Menjalankan impor (di spreadsheet asli)
1. Pastikan akun pemilik bisa membuka 3 file xlsx (ID di `APP.IMPORT_FILES`, `00_Config.gs`) dan SENSUS BBK02.
2. Jalankan menu **Zakat › Impor data lama 2024–2026**.
   - Impor ini **aman diulang**: hanya baris `Sumber = IMPOR` tahun itu yang diganti, data dari aplikasi tidak disentuh.
3. Buka sheet **Impor_Log**. Semua `Status` harus **`SAMA`**.
   - Jika `BEDA`: **jangan lanjut**. Catat tahun, nama cek, angka hasil vs rekap, lalu buat handoff ke konsultan (skill `consultant-handoff`).
   - Jika `TIDAK ADA REKAP`: sheet lama tidak punya baris rekap. Laporkan sebagai info.
4. Buka sheet **Impor_Review**. Untuk setiap baris:
   - `PERLU_CEK` / `TIDAK_ADA` dengan saran yang benar → salin `Saran_ID_Keluarga` ke `Pilih_ID_Keluarga`.
   - Orang di luar sensus (simpatisan) → isi `Jadikan_SM = Y`. Isi juga `Pilih_ID_Keluarga` bila ia terkait sebuah KK.
   - `TIDAK_SETOR` → abaikan (memang tidak setor).
   - **Jangan menebak.** Jika ragu, biarkan kosong dan kumpulkan daftarnya untuk pemilik.
5. Jalankan **Zakat › Terapkan hasil review impor**. Baris yang sudah diterapkan diberi catatan "diterapkan".
6. Buka web › Tren: 2024–2026 tampil, dan angkanya sesuai tabel di `domain-zakat.md`.

## Pengetahuan format sheet lama
- **Sheet yang dibaca:** `DATA MUZAKKI - ZAKAT FITRAH`, `Zakat Maal`, `Susulan Zakat Maal` (2024), dan `MUSTAHIQ AMIL`.
- **Pembacaan kolom berdasarkan judul**, lewat 2 baris header di atas baris yang memuat "JM BBK". Lihat `parseMuzakki_` di `ImportParse.gs`.
- **"Kembalian"** = selisih bayar: positif = lebih bayar (UB), negatif = kurang bayar.
- **Baris tanpa jiwa dan tanpa jenis** = tidak setor (masuk review, tidak diimpor).
- **Kolom amil berisi "Titip Uang"/"Beras"** = salah input. Amil dikosongkan dan baris masuk review.
- **Fidyah** di kolom keterangan ("Fidyah 40.000") dibuat menjadi baris FIDYAH.

## Menambah format/tahun baru
1. Tambahkan ID file ke `APP.IMPORT_FILES`.
2. Jika judul kolom berbeda, perluas pencarian kolom di `parseMuzakki_`/`parseMal_`/`parseAmil_`. **Jangan memakai indeks kolom tetap.**
3. Tambahkan unit test dengan baris contoh **fiktif** berformat baru di `tests/unit-parse.test.js`, dan test total rekap di `tests/e2e-import.test.js`.
4. `npm test` lulus, baru jalankan impor di spreadsheet asli.
