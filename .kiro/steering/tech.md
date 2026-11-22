---
inclusion: always
---

# Teknologi & Batasan

## Stack (tetap, jangan diganti tanpa konsultan)
- **Backend:** Google Apps Script (runtime **V8**) yang menempel di spreadsheet `ZAKAT BBK02`.
  - Dipublikasikan sebagai **Web App** (`doGet`/`doPost`) dengan *Execute as: Me*, *Access: Anyone*.
- **Database:** Google Sheets. Satu spreadsheet untuk semua tahun, dan setiap tabel punya kolom `Tahun`.
- **Sumber data jamaah:** spreadsheet SENSUS BBK02, hanya dibaca lewat `SpreadsheetApp.openById`.
- **Frontend:** HTML + CSS + **vanilla JavaScript (ES5-compatible)** tanpa framework, tanpa build step, tanpa npm dependency. Di-host di **GitHub Pages**.
- **Font:** Plus Jakarta Sans (Google Fonts). Ikon berupa SVG inline (stroke). Tanpa emoji dan library ikon.
- **Test:** Node.js ≥18 tanpa dependency, memakai simulasi Apps Script di `tests/gas-mock.js`. Smoke UI opsional dengan Python Playwright.

## Pola komunikasi frontend ↔ backend
- **Satu endpoint:** `POST <API_URL>` dengan header `Content-Type: text/plain;charset=utf-8` (supaya tidak memicu preflight CORS).
  - **Body:** `{"action": "...", "token": "...", ...param}`.
  - **Respons:** `{"ok": true, "data": ...}` atau `{"ok": false, "error": "pesan untuk manusia", "sesiHabis": bool}`.
- **Router:** dibangun di `routes_()` di `Api.gs`, sebagai fungsi (bukan `var` global), supaya **urutan file .gs tidak berpengaruh**.
- **Sesi:** token UUID disimpan di `CacheService` selama 6 jam. Frontend menyimpan token di `localStorage` (dibungkus try/catch).

## Batasan Apps Script yang wajib diingat
- **Waktu eksekusi** maksimal **6 menit**. Impor per tahun harus jauh di bawah itu.
- **CacheService:** nilai maksimal **100 KB** per key, TTL maksimal 6 jam. Jika data terlalu besar, lewati cache (jangan crash).
- **Penulisan sheet:** setiap perubahan dibungkus `withLock_()` (LockService), karena banyak amil bisa menyimpan bersamaan.
- **Efisiensi baca/tulis:** baca seluruh tabel sekali (`getValues`) dan tulis batch (`setValues`). Jangan memanggil `getRange` per sel dalam loop.
- **Global scope dibagi semua file `.gs`.** Fungsi internal diberi akhiran `_`. Jangan mengeksekusi kode yang memanggil fungsi file lain di top-level.
- **Kuota harian** UrlFetch/Drive kecil. Hindari pemanggilan berulang.
- **Zona waktu `Asia/Jakarta`:** tanggal disimpan sebagai **teks `yyyy-MM-dd`**, waktu sebagai `yyyy-MM-dd'T'HH:mm:ss`. Kolom tanggal diformat `@`.
- **Advanced Service Drive v3** hanya dipakai untuk impor (konversi xlsx → Google Sheets sementara, lalu dibuang ke trash).

## Deploy
- **Backend:**
  1. Salin isi `apps-script/` ke editor Apps Script, atau pakai `clasp push` jika sudah disiapkan.
  2. Buka **Deploy › Manage deployments › Edit › New version**, supaya URL `/exec` tetap sama.
- **Frontend:** push folder `web/` ke GitHub Pages. `web/config.js` berisi `API_URL`.
- Detail lengkap ada di skill `zakat-deploy-release` dan steering manual `#release-runbook`.

## Hal yang dilarang
- Menambah framework, bundler, TypeScript, atau dependency npm di frontend/backend tanpa persetujuan konsultan.
- Memakai `innerHTML` dengan data yang belum di-escape. Selalu pakai `esc()`.
- Menyimpan PIN dalam bentuk asli. Simpan hanya hash SHA-256 + salt.
- Menulis ke spreadsheet sensus.
- Commit data jamaah asli, file xlsx, atau screenshot data asli ke repo.
