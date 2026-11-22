# Requirements — Mustahiq Zakat Fitrah (B-01 + B-02)

> **Status:** DISETUJUI pemilik + konsultan, 2026-11-22.
> - **Keputusan:** D-35.
> - **Desain:** `docs/handoff/2026-11-22-desain-mustahiq.md`.
> - **Mockup:** canvas `docs/mockup.md` (baris "Mustahiq & Pembagian 45%").
>
> Perubahan dokumen ini hanya lewat konsultan.

### Requirement 1 — Daftar mustahiq per tahun
**User Story:** Sebagai admin, saya ingin menetapkan daftar mustahiq tahun ini dari data sensus dan penerima luar sensus, sesuai hasil musyawarah.

#### Acceptance Criteria
1. THE sistem SHALL menampilkan ke **admin** kandidat: jamaah sensus dengan kolom *Perlu Dibantu* terisi dan belum ada di daftar tahun itu, dikelompokkan per KK.
2. WHEN admin menambahkan jamaah sensus (dari kandidat atau cari nama) THEN sistem SHALL membuat satu baris per jiwa (`Tipe=JM`, `Jiwa=1`) dengan asnaf yang dipilih (default MISKIN).
3. IF jamaah yang sama sudah ada di daftar tahun itu THEN sistem SHALL menolak.
4. WHEN admin menambah penerima luar sensus THEN sistem SHALL menyimpan nama, jumlah jiwa ≥ 1, asnaf, dan catatan (`Tipe=LUAR`, `ID_Keluarga=LUAR-<ID>`).
5. WHEN admin mengubah asnaf/catatan/jumlah jiwa (luar) atau mengeluarkan penerima THEN sistem SHALL menyimpan dengan soft delete dan mencatatnya di Log.
6. THE asnaf SHALL salah satu dari `FAKIR|MISKIN|GHORIM|MUALAF|IBNU_SABIL|SABILILLAH`.

### Requirement 2 — Pembagian rata per jiwa, soq bulat per KK
#### Acceptance Criteria
1. THE pool SHALL sama dengan pos *Mustahiq* pembagian zakat fitrah tahun itu (soq), hanya bila `F_Mustahiq_Ke = Kelompok`. Selain itu sistem SHALL menampilkan catatan dan tidak membagi.
2. THE soq per KK SHALL = `splitLargestRemainder_(pool, jiwa per KK)`, dan Σ soq semua KK = pool persis. Kg = soq × `Kg_Per_Soq`.
3. THE pengelompokan SHALL per `ID_Keluarga` (termasuk `TANPA-KK-…`). Setiap penerima luar sensus menjadi kelompok sendiri.
4. WHEN penerimaan masih dibuka dan batas fitrah belum lewat THEN halaman SHALL menampilkan catatan "angka sementara".
5. THE `jiwaMustahiq` di dashboard & tren SHALL memakai jumlah jiwa di daftar bila daftar tahun itu ada. Bila tidak ada, memakai `Config_Tahun.Jiwa_Mustahiq`.

### Requirement 3 — Penyerahan & cetak
#### Acceptance Criteria
1. WHEN admin menandai KK "diserahkan" THEN sistem SHALL menyimpan soq, kg, dan tanggal saat itu di `Mustahiq_Serah`. Batal = soft delete.
2. IF soq hitungan sekarang ≠ soq yang diserahkan THEN baris SHALL ditandai "berubah sejak diserahkan", dan admin dapat menandai ulang.
3. THE halaman SHALL menyediakan cetak "Daftar Penerimaan Zakat Fitrah" sesuai artboard *Cetak*.
4. THE Pemantauan (admin & pengurus) SHALL menampilkan kartu "Penyaluran mustahiq" (KK & soq diserahkan / total) dengan tautan ke menu Mustahiq.

### Requirement 4 — Akses & privasi
#### Acceptance Criteria
1. THE route baca mustahiq SHALL hanya untuk `admin` dan `pengurus`. Route ubah, kandidat, dan serah SHALL hanya untuk `admin`. Amil SHALL ditolak.
2. THE data kandidat (*Perlu Dibantu*) SHALL tidak pernah dikirim ke pengurus.
3. THE respons SHALL tidak memuat alamat/no HP.
4. THE kartu "Penyaluran mustahiq" SHALL tidak tampil untuk amil, dan datanya tidak ada di respons dashboard amil (cache dashboard sudah per varian admin/umum, D-34. Pengurus ikut varian "umum", jadi ringkasan penyaluran diambil dari route mustahiq, bukan dashboard).
