---
inclusion: manual
---

# Runbook Rilis & Operasional (panggil dengan #release-runbook)

## Pemasangan pertama (sekali)
1. **Spreadsheet:** buat spreadsheet `ZAKAT BBK02` di akun pemilik (akun yang sama dengan absensi). Akun ini harus bisa **melihat** SENSUS BBK02 Dashboard dan ketiga file xlsx lama.
2. **Apps Script:** buka Ekstensi › Apps Script.
   - Project Settings › centang *Show "appsscript.json"*, lalu tempel `apps-script/appsscript.json`.
   - Buat file `.gs` sesuai `apps-script/`, lalu tempel isinya (nama file tidak harus sama, tapi disarankan sama).
   - Opsional: `clasp clone`/`clasp push` (`.clasp.json` sudah di-`.gitignore`, jadi jangan di-commit).
3. **Setup:** jalankan `setupZakat` sekali dan izinkan akses Sheets & Drive. Muat ulang spreadsheet sampai menu **Zakat** muncul.
4. **Akun Admin:** Zakat › Buat akun Admin (nama + PIN 6 digit).
5. **Impor:** Zakat › Impor data lama 2024–2026.
   - Periksa `Impor_Log`: semua cek harus `SAMA`. Jika ada `BEDA`, **jangan lanjut**. Laporkan ke konsultan (skill `consultant-handoff`).
   - Periksa `Impor_Review`: isi `Pilih_ID_Keluarga` (salin dari tab Keluarga di sensus) atau `Jadikan_SM = Y`.
   - Jalankan Zakat › Terapkan hasil review impor.
6. **Deploy backend:** Deploy › New deployment › Web app. *Execute as*: Me, *Who has access*: Anyone. Salin URL `/exec`.
7. **Deploy frontend:** isi URL di `web/config.js`, push ke GitHub, lalu aktifkan GitHub Pages dengan **branch `main`, folder `/` (root)**. Root `index.html` hanya mengalihkan ke `web/` (D-22).
   - **Jangan** menyalin file web ke root atau ke branch lain. `web/` adalah satu-satunya sumber.
   - URL produksi hanya boleh ada di `web/config.js`.
8. **Konfigurasi:** login Admin di web. Di Konfigurasi:
   - Cek 1448 H / 2027: tanggal Idul Fitri, batas fitrah, tutup rekap mal, harga/soq, dan tarif fidyah.
   - Isi amil 2027 + PIN masing-masing.
   - Isi pengguna Pengurus.
9. **UAT:** jalankan checklist UAT (tasks.md Fase 3) dengan 1 amil di HP.

## Rilis perubahan kode
1. Pastikan `npm test` lulus dan tugas sudah dicentang.
2. **Backend:**
   - Perbarui file `.gs` di editor (atau `clasp push`).
   - Buka Deploy › Manage deployments › ✏️ › Version: **New version** › Deploy. URL tidak berubah.
   - **Lewat clasp** (URL `/exec` tetap sama):
     ```
     clasp push
     clasp create-version "<pesan rilis>"            # catat nomor versinya
     clasp list-deployments                          # ID produksi = yang ada di web/config.js
     clasp update-deployment <ID-produksi> -V <nomor> -d "<pesan rilis>"
     ```
   - **Jangan** memakai `clasp create-deployment`/`clasp deploy`, karena perintah itu membuat URL baru. Jangan memperbarui deployment `@HEAD`.
   - `apps-script/appsscript.json` **wajib** memuat `"webapp": {"executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS"}`. Tanpa blok ini, versi baru kehilangan pengaturan Web App dan `/exec` berhenti berfungsi.
   - Jika ada kolom baru, jalankan `setupZakat` sekali.
3. **Frontend:** push `main` (perubahan di `web/`). GitHub Pages butuh 1–2 menit. Minta pengguna refresh. Jika perlu, tambahkan query versi pada `<script src="app.js?v=YYYYMMDD">` untuk mematahkan cache.
4. Tulis laporan rilis di `docs/handoff/YYYY-MM-DD-laporan.md`.

## Rollback
- **Backend:** Manage deployments › pilih versi sebelumnya. Data sheet tidak ikut berubah.
- **Frontend:** `git revert` lalu push.
- **Data salah input:** hapus (soft delete) lewat menu Data Setoran. Semua jejak ada di sheet `Log`.

## Siklus tahunan
| Waktu | Aksi |
|---|---|
| ±1 bulan sebelum Ramadhan | Konfigurasi › **Tahun baru**. Tahun lama otomatis ditutup dengan snapshot jiwa sensus, dan amil + PIN tersalin. Lalu cek tanggal, harga, tarif, dan amil |
| Awal Ramadhan | Pastikan status BUKA dan uji login semua amil |
| H-1 | Ingatkan batas zakat fitrah |
| Setelah Ied | Isi pembelian beras, serah UB, dan hasil musyawarah bagian amil. Cetak rekap |
| Setelah rekap mal | Tutup penerimaan (status TUTUP). Mal setelahnya otomatis menjadi susulan |

## Troubleshooting
| Gejala | Penyebab umum | Solusi |
|---|---|---|
| "Belum ada akun Admin" | akun admin belum dibuat | menu Zakat › Buat akun Admin |
| Semua request "Sesi berakhir" | token kedaluwarsa (6 jam) atau cache dibersihkan | login ulang |
| Fetch gagal / CORS | URL `/exec` salah, deployment bukan "Anyone", atau body bukan `text/plain` | cek `config.js` & setting deployment |
| Data sensus baru belum muncul | cache sensus 5 menit | tunggu 5 menit atau jalankan `cekSensus` |
| Impor gagal "Drive is not defined" | Advanced Service Drive belum aktif | aktifkan di Services › Drive API v3, atau pastikan manifest sudah tertempel |
| Angka dashboard berbeda dari sheet lama | sheet lama salah pembulatan (325 vs 324) | jelaskan: aplikasi memakai metode sisa terbesar |
