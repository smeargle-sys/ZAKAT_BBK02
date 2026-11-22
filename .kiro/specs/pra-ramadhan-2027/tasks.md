# Tasks — Pra-Ramadhan 2027

Legenda: `[x]` selesai · `[~]` sebagian · `[ ]` belum · ⏸ menunggu konsultan · 👤 pemilik

Target: semua selesai dan ikut UAT (zakat-mvp task 25–29) **sebelum ±Februari 2027**.

## Sudah dikerjakan konsultan (2026-11-22)
- [x] 0a. `kkList_` tidak lagi mengirim `alamat` (privasi). _Req 5.2_
- [x] 0b. Filter `tanpaKK` di `dashboard_` yang tidak berfungsi dihapus (diganti 0c). _Req 5.1_
- [x] 0c. Temuan UAT pemilik: KK hanya yang punya ID Keluarga. Pemantauan memisahkan "Jiwa tanpa KK" dan `kkSetor` diperbaiki (D-28 revisi). _Req 5.1_
- [x] 0d. Temuan UAT pemilik: kecepatan, yaitu memo per request, cache respons berversi, cache memori + prefetch di frontend (D-29).

## Implementasi (dikerjakan konsultan, 2026-11-22. Test: `tests/pra-ramadhan.test.js`, `tests/teks-progres.test.js`)
- [x] 1. Test penolakan peran untuk route admin-only. _Req 1_
- [x] 2. Test regresi: `belum` hanya KK asli + `belumTanpaKK`, `kkList` tanpa `alamat`. _Req 5_
- [x] 3. Kolom `Dicatat_Oleh` (skema + `simpanFitrah_` + `simpanLain_` + fidyah sekalian + log + `daftarSetoran_`) dan test-nya. Perbarui `data-model.md`. _Req 2.1–2.3, 2.5_
- [x] 4. Data Setoran: tampilkan "dicatat oleh" dan tambahkan kolom CSV. _Req 2.4_
- [x] 5. `daftarSimpatisan_.sudah` + `smPicker` disabled/chip, dan test-nya. _Req 3_
- [x] 6. `progresJamaah_` di `dashboard_` dan test fixture-nya. _Req 4.1–4.3_
- [x] 7. `Z.teksProgres` (fungsi murni) dan golden test-nya. _Req 4.6–4.7_
- [x] 8. Kartu progres di Pemantauan + modal Bagikan progres (WA/salin), khusus admin & pengurus. _Req 4.4, 4.5, 4.8_
- [x] 9. `npm test` + `npm run ui` lulus. Naikkan `?v=` di `web/index.html`.

## Rilis
- [~] 10. 👤 `clasp push` → Manage deployments › **New version** (jangan membuat deployment baru) → jalankan `setupZakat` sekali (kolom baru). Lalu push `main` untuk web.
  - _2026-11-22: selesai lewat clasp. Deployment produksi `AKfycbyygSg…` @2 "fixing v1.2" (URL tetap), `ping` /exec OK, web v1.2.0 live. **Sisa: pemilik menjalankan `setupZakat` sekali.**_
- [x] 11. Laporan → `docs/handoff/2026-11-22-laporan-pra-ramadhan.md`. Uji asap di lingkungan asli dilakukan pemilik saat UAT (skenario 11–13 di panduan UAT).
- [x] 12. Tambahkan skenario fitur ini ke `docs/panduan/uat-fase-3.md`.

## Bukan bagian spec ini
- Fitur 5 / D-27 (sumber sensus di Script Properties) → setelah Idul Fitri 1448 H, dengan spec tersendiri.
- B-05 (rekap WA pengurus dengan nominal) → tetap USULAN.
