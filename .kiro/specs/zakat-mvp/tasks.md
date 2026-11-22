# Tasks — Zakat BBK02 MVP

Legenda: `[x]` selesai · `[~]` sebagian (lihat catatan) · `[ ]` belum · ⏸ menunggu konsultan · 👤 perlu dikerjakan pemilik (akses Google/HP)

## Fase 1 — Pembangunan MVP (SELESAI, teruji di simulasi)
- [x] 1. Skema sheet & setup (`00_Config.gs`, `Setup.gs`): Config_Tahun 2024–2027, menu Zakat. _Req 13_
- [x] 2. Baca sensus read-only + cache, jamaah tanpa KK. _Req 2_
- [x] 3. Login PIN pribadi, sesi, kunci 5x salah, PIN unik, akun Admin/Pengurus, PIN amil ikut tahun baru. _Req 1_
- [x] 4. Daftar KK + status per jiwa, beranda amil. _Req 2_
- [x] 5. Setoran fitrah: per jiwa, SM terkait/berdiri sendiri, JM luar, jenis, wajib/selisih/UB/kurang, fidyah sekalian, cegah dobel. _Req 3, 4_
- [x] 6. Batas waktu fitrah untuk amil & admin. _Req 5_
- [x] 7. Zakat mal/tijaroh/campuran/fidyah, auto susulan. _Req 6_
- [x] 8. Pembagian fitrah & mal dengan sisa terbesar, setor desa/daerah. _Req 7_
- [x] 9. Bagian amil (hitungan per saham + final musyawarah + sisa). _Req 8_
- [x] 10. UB (terkumpul/diserahkan/dipegang) & pembelian beras. _Req 9_
- [x] 11. Dashboard pemantauan desktop & HP, cetak. _Req 10_
- [x] 12. Tren tahunan + CSV. _Req 11_
- [x] 13. Data setoran: filter, CSV, ubah, soft delete, log. _Req 12_
- [x] 14. Konfigurasi: tahun, persentase, tahun baru, amil+PIN, simpatisan, pengguna. _Req 13_
- [x] 15. Importer 2024 (format A) & 2025–2026 (format B), Impor_Log, Impor_Review, terapkan review. _Req 14_
- [x] 16. Test Node (simulasi Apps Script) + dev server + smoke UI + privacy scan.

## Fase 2 — Pemasangan & impor (go-live)
- [x] 17. 👤 Buat spreadsheet `ZAKAT BBK02` di akun pemilik. Tempel `apps-script/*` + manifest. Jalankan `setupZakat`. (`#release-runbook` langkah 1–3)
- [x] 18. 👤 Buat akun Admin pertama (menu Zakat › Buat akun Admin).
- [x] 19. 👤 Jalankan impor 2024–2026 dan pastikan semua `Impor_Log` = SAMA.
  - Jika ada `BEDA` → ⏸ buat handoff ke konsultan berisi angka per cek.
- [~] 20. 👤 Review `Impor_Review`: isi `Pilih_ID_Keluarga` / `Jadikan_SM`, lalu Terapkan hasil review.
  - Kiro boleh membantu menyusun daftar saran, tapi **tidak** memutuskan kecocokan nama.
  - _Catatan 2026-11-22: `Impor_Review` sudah terisi, tapi review belum diterapkan._
- [x] 21. 👤 Deploy Web App (Execute as Me, Anyone) dan salin URL `/exec`.
- [x] 22. Isi `web/config.js` dengan URL produksi, tambahkan cache-busting `?v=` di `index.html`, lalu siapkan repo GitHub + Pages.
  - Repo baru, mis. `ZAKAT_DASHBOARD_BBK02`, dengan pola sama seperti repo sensus.
  - _Catatan 2026-11-22: memakai repo `ZAKAT_BBK02` yang sama. Pages menyajikan dari `main` (root), dan root `index.html` mengalihkan ke `web/` (D-22)._
- [~] 23. 👤 Konfigurasi 1448 H / 2027 (data asli dari pengurus):
  - tanggal Idul Fitri, batas fitrah, tutup rekap mal, harga/soq, tarif fidyah;
  - amil 2027 + PIN (amil hasil impor belum punya PIN);
  - pengguna Pengurus.
  - _Catatan 2026-11-22: config 2027 dan 1 Admin + 1 Pengurus sudah ada. Yang masih kurang: amil baru 1 (UAT butuh ≥2), tanggal Idul Fitri masih perkiraan, dan tarif fidyah 2024–2026 = 15.000 perlu dikonfirmasi._
- [~] 24. Verifikasi Tren menampilkan angka 2024–2026 sesuai tabel `domain-zakat.md`. Bila beda, catat di laporan.
  - _Catatan 2026-11-22: dilaporkan cocok, tapi angka per tahun belum dicatat. Isi tabel di `docs/panduan/verifikasi-tren.md`._

## Fase 3 — UAT (uji penerimaan) dengan data asli
Rencana & prasyarat: `docs/panduan/uat-fase-3.md`.
- [ ] 25. 👤 UAT amil di HP (minimal 2 amil, Android berbeda):
  - login PIN → nama benar;
  - cari KK → simpan Titip uang dengan lebih bayar;
  - simpan Beras;
  - simpan Di kampung;
  - tambah simpatisan ke KK;
  - coba zakati jiwa yang sama dua kali (harus ditolak);
  - simpan zakat mal dan fidyah.
- [ ] 26. 👤 UAT admin:
  - ubah dan hapus setoran;
  - catat serah UB dan pembelian beras;
  - isi hasil musyawarah bagian amil;
  - cetak rekap;
  - ekspor CSV;
  - ubah persentase menjadi tidak 100% (harus ditolak).
- [ ] 27. 👤 UAT batas waktu: setel `Batas_Fitrah` ke waktu lampau di tahun uji → amil ditolak, admin hanya bisa dengan tanggal ≤ batas. Kembalikan nilainya.
- [ ] 28. Laporan UAT → `docs/handoff/YYYY-MM-DD-laporan.md`, berisi temuan, bug, dan usulan, untuk dibawa ke konsultan.
- [ ] 29. Perbaiki bug UAT yang **tidak** mengubah aturan/UX. Temuan yang mengubah aturan/UX → ⏸ handoff.

## Fase 4 — Backlog (BELUM didesain, jangan dikerjakan tanpa desain konsultan)
Lihat `docs/backlog.md`. Setiap item akan mendapat spec sendiri (`.kiro/specs/<item>/`) setelah konsultan menyelesaikan desainnya.
