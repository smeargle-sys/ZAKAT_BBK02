# Backlog

Status: **PERLU DESAIN** = sudah disebut pemilik, desain belum dibuat konsultan · **USULAN** = ide dari konsultan/Kiro, belum dibahas pemilik · **SIAP** = desain selesai, ada spec · **SELESAI**

> Kiro **tidak boleh** mengerjakan item yang belum berstatus SIAP. Bila ada pertanyaan atau temuan baru, tambahkan di kolom catatan, atau buat handoff.

| ID | Item | Status | Prioritas usulan | Catatan & yang sudah diketahui |
|---|---|---|---|---|
| B-01 | **Daftar mustahiq per tahun** | SIAP | Tinggi | D-35. Desain: `docs/handoff/2026-11-22-desain-mustahiq.md`. Spec: `.kiro/specs/mustahiq/`. |
| B-02 | **Pembagian 45% mustahiq zakat fitrah** + cetak daftar penerimaan | SIAP | Tinggi | D-35: rata per jiwa, soq bulat per KK (sisa terbesar), tandai diserahkan. Cara "per saham kebutuhan" tidak dipilih (bisa jadi opsi nanti). |
| B-03 | **Penyaluran Sabilillah / bantuan kelompok** | PERLU DESAIN | Sedang | Lihat rincian di bawah tabel. |
| B-04 | **Cetak laporan resmi** "Daftar Penerimaan dan Pembagian Zakat Fitrah / Zakat Mal Tijaroh" | USULAN | Sedang | Format seperti sheet lama: rekap jiwa, pembagian soq, disetor ke Desa/Daerah, blok tanda tangan (KI/KU/Mubaligh/Amil). Saat ini baru ada "Cetak rekap" dari dashboard. |
| B-05 | Kirim rekap ke grup WhatsApp pengurus (1 tap, seperti absensi) | USULAN | Sedang | Ringkasan harian selama Ramadhan: progres jiwa, beras/uang, mal, KK belum setor. Versi untuk jamaah (tanpa nominal) sudah jadi B-11. Mekanisme bagikannya bisa dipakai ulang. |
| B-06 | Bukti setor untuk muzakki (kirim WA / cetak) | USULAN | Rendah | Berisi nama KK, jiwa, jenis, nominal/kg, lebih bayar ke UB, amil, tanggal. |
| B-07 | Pengingat KK yang belum setor (daftar + link WA ke KK) | USULAN | Rendah | Perlu no HP dari sensus, sehingga ada pertimbangan privasi. |
| B-08 | Arsip PDF otomatis saat tahun ditutup | USULAN | Rendah | Sesuai D-02: data tetap satu file, PDF hanya arsip. |
| B-09 | Lengkapi ID Keluarga ±22 jamaah di sensus | USULAN (di repo Sensus) | Sedang | Temuan saat mencocokkan data. Dikerjakan di aplikasi Sensus, bukan di repo ini. |
| B-11 | **Laporan progres untuk jamaah** (% KK & jiwa, bagikan ke WA) + kartu progres di Pemantauan | SIAP | Tinggi | D-26. Spec: `.kiro/specs/pra-ramadhan-2027/`. |
| B-12 | Siap dipakai kelompok lain: sumber sensus (D-27), nama kelompok, file impor, teks header web dari konfigurasi | USULAN | Rendah | Bagian sumber sensus (D-27) = SIAP, dikerjakan setelah Idul Fitri 1448 H. Sisanya perlu dibahas dengan pemilik. |
| B-10 | Hubungkan amil hasil impor (mis. "A.R Firdaus") ke ID jamaah sensus | USULAN | Rendah | Admin bisa melakukannya manual di Konfigurasi › Amil. |

## Rincian item PERLU DESAIN

### B-01 · Daftar mustahiq per tahun
- **Kandidat sumber data:** kolom sensus `Perlu Dibantu`.
- **Asnaf per jiwa/KK:** data lama memakai MISKIN, FAQIR, GHORIM, MUALAF, IBNU SABIL (2026) dan FAKIR/MISKIN, SABILILLAH, IBNU SABIL (2024–25).
- **Jumlah:** 2026 = 106 jiwa / 41 KK, 2025 = 100, 2024 = 95.
- **Pertanyaan terbuka:**
  - Siapa yang menetapkan daftar mustahiq?
  - Apakah per jiwa atau per KK?
  - Apakah ada persetujuan/verifikasi?
  - Siapa yang boleh melihat?

### B-02 · Pembagian 45% mustahiq zakat fitrah
- **Dua cara yang ada di sheet lama:**
  - **(a) rata per jiwa:** soq_mustahiq ÷ jiwa mustahiq, lalu dibulatkan per KK;
  - **(b) per saham kebutuhan:** JUMLAH KELUARGA, RUMAH, MAISYAH, PENDIDIKAN, KESEHATAN, 5 BAB → total saham → %.
- **Pembulatan:** di sheet lama ada pembulatan manual per KK (mis. 1,4 → 0 atau 4). Target totalnya tetap = pos mustahiq.
- **Mustahiq zakat mal:** disetor ke Daerah (D-10), jadi tidak dibagi di kelompok. Perlu dikonfirmasi apakah ada mustahiq daerah yang kembali ke kelompok.

### B-03 · Penyaluran Sabilillah / bantuan kelompok
- **Isi sheet lama:** Pengajuan SB kelompok (kavling mubaligh, PBB masjid & aset SB, listrik rumah SB, dana kesehatan, SB anak pondok 15 × Rp 5 jt, MS kelompok 10 × Rp 1,5 jt), dan sodaqoh sekolah/bantuan kelompok untuk anak pondok.
- **Pertanyaan terbuka:**
  - Dananya dari pos mana: Sabilillah daerah yang kembali, sodaqoh kelompok, atau lainnya?
  - Apakah termasuk lingkup aplikasi zakat?

## Riwayat
- 2026-11-22: B-01 & B-02 didesain bersama pemilik → SIAP (D-35).
- 2026-11-22: B-11 (SIAP) dan B-12 (USULAN) ditambahkan dari handoff 5 fitur. Lihat D-23 s.d. D-28.
- 2026-11-22: backlog awal dibuat dari diskusi MVP (konsultan).
