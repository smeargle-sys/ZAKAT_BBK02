# Laporan Kerja Kiro: Fase 2 — Go-live

- **Tanggal:** 2026-11-22
- **Periode/rilis:** Fase 2 (task 17–24), web v1.0.0
- **Hasil `npm test`:** ☑ SEMUA TEST LULUS
  ```
  e2e-api: lulus
  e2e-import: lulus
  SEMUA TEST LULUS
  ```

> Laporan ini menggantikan `FASE-2-COMPLETION.md` dan `FASE-2-SUMMARY.md` yang dulu ada di root repo. Isinya dirapikan oleh konsultan pada 2026-11-22.

## Ringkasan
Backend Apps Script sudah terpasang di spreadsheet `ZAKAT BBK02` dan dipublikasikan sebagai Web App. Data 2024–2026 sudah diimpor, dan semua `Impor_Log` = SAMA. Frontend sudah tayang di GitHub Pages. Tahun 2027 sudah dibuat, berisi 1 amil, 1 Admin, dan 1 Pengurus. Aplikasi **belum siap UAT penuh**: review impor belum diterapkan, amil 2027 baru 1 orang, dan angka Tren belum dicatat per tahun.

## Task selesai
- [x] #17 — Spreadsheet + 14 file `.gs` via `clasp push`. Drive API v3 aktif dan menu Zakat muncul.
- [x] #18 — Akun Admin pertama.
- [x] #19 — Impor 2024–2026, semua `Impor_Log` = SAMA.
  - 2024: 94 setoran fitrah, 13 mal.
  - 2025: 91 setoran fitrah, 10 mal.
  - 2026: 96 setoran fitrah, 8 mal, 1 fidyah.
- [x] #21 — Web App sudah di-deploy (Execute as Me, Anyone).
- [x] #22 — `web/config.js` berisi URL produksi, cache-busting `?v=1.0.0`, dan GitHub Pages aktif.
- [~] #20 — `Impor_Review` terisi, tapi **pemilik belum menerapkan review**.
- [~] #23 — Config 2027 sudah ada, tapi **amil baru 1**. Rinciannya di bawah.
- [~] #24 — Dilaporkan "verified", tapi **angka per tahun belum dicatat**.

### Config 2027 (1448 H)
| Parameter | Nilai |
|---|---|
| Idul Fitri | 2027-03-10 |
| Batas fitrah | 2027-03-10 06:00 |
| Harga/soq | Rp 40.000 |
| Kg/soq | 2,7 |
| Tarif fidyah | Rp 15.000/hari |
| Status | BUKA |

## Perubahan per file
| File | Perubahan |
|---|---|
| `apps-script/appsscript.json` | Menambah dependency Drive API v3 (untuk impor) |
| `apps-script/Dashboard.gs` | Hitungan "KK belum setor" tidak lagi menyertakan KK virtual `TANPA-KK-…` |
| `web/style.css` | Hasil pencarian di modal bisa di-scroll (`max-height` + `overflow-y`) |
| `apps-script/Setup.gs` | Config awal: `Tarif_Fidyah: 15000` ditambahkan ke 2024–2027. `Catatan` 2027 diubah dari "masih perkiraan" menjadi "Siap UAT" (commit `4bfb299`) |
| `tests/verify-tren.js` | Skrip bantu berisi angka acuan Tren |
| `docs/panduan/*` | Panduan langkah demi langkah untuk pemilik: setup Apps Script, go-live, verifikasi tren, rencana UAT |

## Perubahan skema / deploy
- Kolom baru: tidak ada.
- Versi deployment Apps Script: deployment pertama.
- GitHub Pages menyajikan dari **branch `main`, root**. Aplikasi ada di `/web/`, dan `index.html` di root mengalihkan ke sana (D-22).

## Penyimpangan dari desain / keputusan teknis baru
- **Situs utama sempat tidak berfungsi.** Kiro menggabungkan branch `gh-pages` ke `main` (commit `9cb0e40`), sehingga salinan file web muncul di root. Lalu commit `525b2ed` mengganti `config.js` di root dengan placeholder, padahal root itulah yang disajikan Pages. Akibatnya situs memanggil `YOUR_SCRIPT_ID_HERE`.
  - **Perbaikan:** salinan di root dihapus, `web/` jadi satu-satunya sumber, dan root berisi redirect.
  - Branch `gh-pages` sekarang tidak dipakai.
- **Tanggal salah di dokumen.** Laporan dan handoff Kiro bertanggal 2024-11-22. Semuanya sudah dikoreksi menjadi 2026-11-22.

## Temuan, risiko, bug yang belum selesai
- **Task 20:** review impor belum diterapkan. Selama belum diterapkan, sebagian JM 2024–2026 tidak tertaut ke ID sensus, sehingga persentase di tren bisa berbeda.
- **Task 23:** UAT butuh minimal 2 amil dengan PIN. Tanggal Idul Fitri 2027 masih perkiraan dan perlu dikonfirmasi pengurus.
- **Tarif fidyah 2024–2026 = Rp 15.000** diisi Kiro tanpa sumber. Ini data bisnis, jadi pengurus perlu mengonfirmasinya dari sheet lama. Jika berbeda, ubah di Konfigurasi. Kodenya tidak perlu diubah, karena `isiConfigAwal_` hanya berjalan untuk tahun yang belum ada.
- **Task 24:** isi tabel cek di `docs/panduan/verifikasi-tren.md` dengan angka yang tampil di layar Tren.

## Pertanyaan untuk konsultan
1. Handoff 5 feature request (`2026-11-22-feature-requests-5-items.md`) menunggu keputusan.
