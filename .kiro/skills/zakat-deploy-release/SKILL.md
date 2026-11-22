---
name: zakat-deploy-release
description: Deploy dan rilis aplikasi Zakat BBK02 — pemasangan pertama spreadsheet + Apps Script + Web App, update versi deployment tanpa mengganti URL /exec, publikasi web ke GitHub Pages, migrasi kolom (setupZakat), rollback, dan laporan rilis. Gunakan saat go-live, merilis perubahan, atau menangani masalah deployment.
metadata:
  project: zakat-bbk02
---

# Deploy & rilis

Panduan lengkap ada di steering manual `#release-runbook`. Ringkasan langkah:

## Sebelum rilis
1. `npm test` lulus. Semua task rilis sudah dicentang di `.kiro/specs/*/tasks.md`.
2. Catat apakah ada **kolom baru**. Jika ada, setelah deploy jalankan `setupZakat` sekali.
3. Siapkan `docs/handoff/YYYY-MM-DD-laporan.md` dari `_TEMPLATE-laporan.md`.

## Backend (Apps Script)
1. Perbarui file `.gs` di editor Apps Script (atau `clasp push` jika `.clasp.json` lokal ada; jangan di-commit).
2. Buka **Deploy › Manage deployments › ✏️ edit deployment yang ada › Version: New version › Deploy**.
   - **Jangan** membuat deployment baru, karena URL `/exec` akan berubah dan semua HP amil harus diperbarui.
   - **Lewat clasp** (URL `/exec` tetap sama):
     ```
     clasp push
     clasp create-version "<pesan rilis>"            # catat nomor versinya
     clasp list-deployments                          # ID produksi = yang ada di web/config.js
     clasp update-deployment <ID-produksi> -V <nomor> -d "<pesan rilis>"
     ```
   - **Jangan** memakai `clasp create-deployment`/`clasp deploy`, karena perintah itu membuat URL baru. Jangan memperbarui deployment `@HEAD`.
   - `apps-script/appsscript.json` **wajib** memuat `"webapp": {"executeAs": "USER_DEPLOYING", "access": "ANYONE_ANONYMOUS"}`. Tanpa blok ini, versi baru kehilangan pengaturan Web App dan `/exec` berhenti berfungsi.
3. Jika ada kolom baru: jalankan fungsi `setupZakat` dari editor atau menu Zakat.

## Frontend (GitHub Pages)
1. Pastikan `web/config.js` berisi URL `/exec` produksi. Ini **satu-satunya** file yang boleh memuat URL tersebut (`privacy-scan` mengizinkannya). Jangan menggantinya dengan placeholder.
   - Pages menyajikan `main` root, dan `index.html` di root mengalihkan ke `web/` (D-22).
   - Jangan menyalin file web ke root atau ke branch `gh-pages`.
2. Tambahkan versi cache-busting di `web/index.html` (`app.js?v=YYYYMMDD`, dst.) bila mengubah JS/CSS.
3. Commit & push. Tunggu Pages selesai (±1–2 menit), lalu buka situs dan login dengan akun uji.

## Uji asap setelah rilis (5 menit)
- Login Admin → Pemantauan tampil, tanpa error di console.
- Login 1 amil → daftar KK tampil → buka form KK (tanpa menyimpan, atau simpan lalu hapus dari Data Setoran).
- Tren tampil 2024–2026.

## Rollback
- **Backend:** Manage deployments → pilih versi sebelumnya.
- **Frontend:** `git revert <commit>` → push.
- **Data:** tidak perlu rollback. Gunakan soft delete. Riwayat ada di sheet `Log`.

## Yang tidak boleh
- Menempelkan PIN, URL `/exec`, atau screenshot data asli di issue, commit, atau dokumen publik.
- Mengubah akses deployment selain *Anyone* (frontend butuh akses anonim; keamanan memakai PIN).
