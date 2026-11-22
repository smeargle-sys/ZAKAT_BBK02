# Tasks — Mustahiq (B-01 + B-02)

Legenda: `[x]` selesai · `[~]` sebagian · `[ ]` belum · ⏸ menunggu konsultan · 👤 pemilik

Target: selesai dan ikut UAT sebelum Ramadhan 1448 H (±8 Februari 2027).
Rincian teknis ada di `docs/handoff/2026-11-22-desain-mustahiq.md` (Model data, Aturan hitung, Layar).

## Backend
- [ ] 1. Skema: sheet `Mustahiq` & `Mustahiq_Serah` di `SHEETS`, konstanta `ASNAF`. Perbarui `data-model.md` (+ salinan `.claude/rules`). _Req 1, 3_
- [ ] 2. `Mustahiq.gs` (file domain baru): `daftarMustahiq_` (hitung per KK + status serah), `kandidatMustahiq_` (admin), `simpanMustahiq_` (tambah JM/LUAR, ubah, keluarkan), `serahMustahiq_` (tandai/batal). Semua penulisan memakai `withLock_` + `log_`. _Req 1–3_
- [ ] 3. Route di `Api.gs` dengan peran sesuai Req 4. `daftarMustahiq` masuk cache respons berversi. _Req 4_
- [ ] 4. `jiwaMustahiq` dari daftar di `ringkasTahun_` bila ada. _Req 2.5_
- [ ] 5. Test `tests/mustahiq.test.js`, didaftarkan di `run-all.js`:
  - golden pembagian: pool 146, 106 jiwa, Σ = 146;
  - tolak duplikat jamaah;
  - akses amil ditolak, pengurus tanpa kandidat;
  - penanda "berubah sejak diserahkan";
  - `F_Mustahiq_Ke ≠ Kelompok`.

## Frontend
- [ ] 6. Menu "Mustahiq" (`#/mustahiq?tahun=`) untuk admin & pengurus. Layar sesuai artboard *Mustahiq*: KPI, kandidat (admin), daftar per KK, cari, tandai diserahkan. _Req 1–3_
- [ ] 7. Modal penerima luar sensus + modal ubah penerima (asnaf, catatan, jiwa, keluarkan). _Req 1_
- [ ] 8. Cetak daftar penerimaan (`@media print`) sesuai artboard *Cetak*. _Req 3.3_
- [ ] 9. Kartu "Penyaluran mustahiq" di Pemantauan (admin & pengurus). _Req 3.4_
- [ ] 10. Uji UI (Playwright): admin, pengurus, amil. Lebar 390 px & 1440 px. `npm test` + `ui-smoke` lulus. Naikkan `?v=`.

## Laporan resmi (D-36)
- [ ] 10a. Kolom `Config_Tahun.Penandatangan` + editor di Konfigurasi + salin saat tahun baru. Konstanta `APP.KELOMPOK_NO/DESA/DAERAH`.
- [ ] 10b. Menu **Laporan** (`#/laporan`, admin & pengurus) dan 4 layout cetak sesuai artboard *Laporan ·* dan *Cetak ·* di canvas: muzakki fitrah (A4 mendatar), zakat mal (utama & susulan), daftar mustahiq per jiwa (kepala keluarga tebal), lembar penyerahan. `@page` size A4 per laporan.
- [ ] 10c. Test: angka laporan = angka dashboard (golden: total fitrah tanpa kampung, pembagian pas, mal A–D, urutan mustahiq per KK dengan kepala keluarga lebih dulu).

## Rilis
- [ ] 11. Deploy: `clasp push` → versi baru → `update-deployment` ke ID produksi. 👤 Jalankan `setupZakat` sekali (sheet baru).
- [ ] 12. Skenario UAT di `docs/panduan/uat-fase-3.md` + laporan di `docs/handoff/`.
