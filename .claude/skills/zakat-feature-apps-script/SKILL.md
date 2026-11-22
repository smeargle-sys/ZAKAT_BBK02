---
name: zakat-feature-apps-script
description: Langkah menambah atau mengubah fitur end-to-end di aplikasi Zakat BBK02 (Apps Script + web vanilla JS) — action API baru, kolom sheet baru, validasi, route & peran, test, dan layar. Gunakan saat mengimplementasikan task dari spec, menambah endpoint, kolom, atau perhitungan zakat.
metadata:
  project: zakat-bbk02
  version: "1.0"
---

# Menambah / mengubah fitur Zakat BBK02

## 0. Cek dulu (wajib)
- Apakah fitur ini sudah diputuskan? Cek `docs/decisions.md`, spec di `.kiro/specs/`, dan `docs/backlog.md`.
  - Jika statusnya `PERLU DESAIN` atau menyentuh aturan zakat/syariat, model data, atau UX baru → **stop**, jalankan skill `consultant-handoff`.
- Baca `#domain-zakat` (aturan) dan `#data-model` (kolom & invarian).

## 1. Skema (jika perlu kolom baru)
1. Tambahkan nama kolom **di akhir** array tabel terkait di `SHEETS` (`apps-script/00_Config.gs`).
2. Jika butuh nilai default per tahun, tambahkan di `isiConfigAwal_()` (`Setup.gs`).
3. Perbarui tabel di `.kiro/steering/data-model.md`.
4. Catat di laporan rilis: "jalankan `setupZakat` sekali setelah deploy".

## 2. Logika backend
1. Tulis fungsi `namaAksi_(p, sess)` di file domain yang sesuai (lihat `structure.md`).
2. Validasi input di awal: throw `Error` berbahasa Indonesia yang jelas.
3. Baca konfigurasi tahun lewat `cfg_(tahun)` atau `tahunAktif_()`. **Jangan meng-hardcode** harga, persentase, atau tanggal.
4. Tulis data di dalam `withLock_()`. Baca ulang tabel di dalam lock sebelum cek duplikat.
5. Perhitungan pembagian memakai `splitLargestRemainder_()`.
6. Panggil `log_(sess, 'namaAksi', detail)`.
7. Kembalikan data polos tanpa `_row`, hash, alamat, atau no HP.

Contoh lengkap pola ini: lihat `references/contoh-action.md`.

## 3. Route & peran
Tambahkan ke `routes_()` di `Api.gs`: `namaAksi: { roles: [...], fn: namaAksi_ }`.
- Untuk menulis data transaksi: `['admin','amil']` atau `['admin']`.
- Untuk konfigurasi: `['admin']`.
- Untuk dashboard: `['admin','amil','pengurus']`.

## 4. Test
1. Tambahkan skenario di `tests/e2e-api.test.js`, atau buat file `*.test.js` baru lalu daftarkan di `tests/run-all.js`.
   - Jalur sukses.
   - Ditolak karena peran salah.
   - Validasi gagal.
   - Invarian (total pembagian = total diterima, tidak dobel).
2. Jalankan `npm test`. Semua harus lulus.

## 5. UI (jika ada)
1. Ikuti desain dari konsultan/mockup. Jika belum ada desain → stop dan buat handoff.
2. Ikuti skill `zakat-ui-screen` dan steering `frontend-standards.md` + `ui-design-system.md`.
3. Panggil backend dengan `api('namaAksi', {...})`.

## 6. Selesai
- Centang task di `tasks.md`.
- Bila ada keputusan teknis baru, tambahkan di `docs/decisions.md` dengan label `[Kiro, teknis]`.
- Jalankan `npm run dev` dan coba manual di lebar 390 px dan 1440 px.
