# Requirements — Zakat BBK02 MVP

> **Status:** DISETUJUI (desain & keputusan oleh konsultan, 2026-11-22). Semua requirement di bawah **sudah diimplementasikan** dan teruji di simulasi. Fase berikutnya adalah go-live (lihat `tasks.md`).
> Perubahan pada dokumen ini **hanya** lewat konsultan (`roles-and-governance.md`).

## Pendahuluan
Aplikasi pencatatan zakat Idul Fitri (fitrah, mal, tijaroh, fidyah) untuk Kelompok Babakan Barat. Data KK/jamaah diambil dari SENSUS BBK02, dengan dashboard pemantauan dan tren tahunan. Aturan domain ada di `.kiro/steering/domain-zakat.md`.

---

### Requirement 1 — Login PIN pribadi
**User Story:** Sebagai admin, amil, atau pengurus, saya ingin masuk cukup dengan PIN pribadi, supaya cepat dan aplikasi langsung tahu siapa saya.

#### Acceptance Criteria
1. WHEN pengguna memasukkan 6 digit PIN yang cocok dengan akun aktif THEN sistem SHALL membuat sesi 6 jam dengan peran dan nama akun tersebut, tanpa meminta memilih nama.
2. IF PIN tidak cocok THEN sistem SHALL menolak dan menampilkan sisa percobaan. Setelah 5 kali salah dari device yang sama, login dikunci 15 menit.
3. WHEN admin menyimpan PIN untuk pengguna atau amil THEN sistem SHALL menolak PIN yang sudah dipakai akun aktif lain.
4. THE sistem SHALL menyimpan PIN hanya sebagai hash bergaram dan tidak pernah mengirim hash ke frontend.
5. THE sistem SHALL mencegah penonaktifan atau penurunan peran Admin aktif terakhir.
6. WHEN tahun baru dibuat THEN PIN amil SHALL ikut tersalin.

### Requirement 2 — Daftar KK dari sensus
**User Story:** Sebagai amil, saya ingin mencari KK dari data sensus dan melihat statusnya, supaya tahu siapa yang belum zakat.

#### Acceptance Criteria
1. THE sistem SHALL membaca KK dan anggota langsung dari SENSUS BBK02 (read-only, cache 5 menit).
2. THE sistem SHALL menampilkan status per KK: BELUM / SEBAGIAN / SUDAH / KURANG (kurang bayar), dengan filter dan pencarian nama KK atau anggota.
3. WHEN jamaah sensus tidak memiliki ID Keluarga THEN sistem SHALL memperlakukannya sebagai keluarga sendiri.

### Requirement 3 — Setoran zakat fitrah per jiwa
**User Story:** Sebagai amil, saya ingin mencentang anggota yang dizakati beserta simpatisan dan JM luar, supaya pencatatan per jiwa akurat.

#### Acceptance Criteria
1. WHEN form KK dibuka THEN semua anggota yang belum zakat SHALL tercentang default, termasuk yang Mondok/Kerja Luar. Anggota yang sudah zakat di setoran lain SHALL tidak bisa dicentang.
2. THE form SHALL menampilkan simpatisan yang terkait KK tersebut, tombol tambah simpatisan, dan stepper jumlah JM luar.
3. IF satu jiwa (JM/SM) sudah tercatat zakat pada tahun yang sama THEN sistem SHALL menolak penyimpanan dengan menyebut namanya.
4. THE sistem SHALL mendukung simpatisan berdiri sendiri (tanpa KK).

### Requirement 4 — Jenis & pembayaran fitrah
**User Story:** Sebagai amil, saya ingin sistem menghitung wajib bayar dan selisih secara otomatis.

#### Acceptance Criteria
1. WHEN jenis = Titip uang THEN wajib SHALL = jiwa × harga per soq tahun itu, dan selisih = diterima − wajib.
2. IF selisih > 0 THEN tujuan lebih bayar SHALL default "Usaha Bersama (UB)", dengan opsi "Dikembalikan".
3. IF selisih < 0 THEN status SHALL = KURANG dan tampil di dashboard.
4. WHEN jenis = Beras THEN kg SHALL default jiwa × kg per soq (bisa dikoreksi). Uang tambahan SHALL dicatat sebagai lebih bayar ke UB.
5. WHEN jenis = Di kampung THEN jiwa SHALL tercatat sudah zakat tanpa penerimaan, dan tidak masuk soq yang dibagi.
6. THE form SHALL bisa sekaligus mencatat fidyah.

### Requirement 5 — Batas waktu zakat fitrah (syariat)
**User Story:** Sebagai pengurus, saya ingin zakat fitrah tidak diterima setelah batas sebelum shalat Ied.

#### Acceptance Criteria
1. WHEN waktu sekarang > Batas_Fitrah THEN sistem SHALL menolak setoran fitrah dari amil dan mengunci form dengan penjelasan.
2. WHILE batas sudah lewat, admin SHALL tetap bisa mencatat setoran fitrah hanya bila tanggal setor ≤ tanggal batas.
3. THE beranda amil SHALL menampilkan pengingat batas zakat fitrah.

### Requirement 6 — Zakat mal, tijaroh, campuran, fidyah
**User Story:** Sebagai amil, saya ingin mencatat zakat mal/tijaroh/fidyah dan mencari muzakki dari sensus atau simpatisan.

#### Acceptance Criteria
1. THE sistem SHALL mendukung jenis MAL, TIJAROH, MAL_TIJAROH (tidak dirinci), dan FIDYAH.
2. WHEN tanggal setor > Tutup_Rekap_Mal OR status tahun TUTUP THEN setoran mal/tijaroh SHALL otomatis menjadi SUSULAN. Admin boleh memaksanya ke UTAMA.
3. WHEN jenis = FIDYAH dan jumlah hari diisi THEN nominal SHALL default = hari × tarif fidyah tahun itu.
4. THE fidyah SHALL tidak ikut pembagian 40/45/15.

### Requirement 7 — Pembagian otomatis
**User Story:** Sebagai admin, saya ingin pembagian fitrah dan mal dihitung otomatis dengan total yang selalu pas.

#### Acceptance Criteria
1. THE pembagian fitrah (soq) dan mal (Rp, per lampiran) SHALL memakai persentase tahun itu dan metode sisa terbesar, sehingga Σ pos = total.
2. THE dashboard SHALL menampilkan tujuan setor per pos (Kelompok/Desa/Daerah), serta total disetor ke Desa dan Daerah.
3. IF admin menyimpan persentase yang totalnya bukan 100% THEN sistem SHALL menolak.

### Requirement 8 — Bagian amil (hasil musyawarah)
#### Acceptance Criteria
1. THE sistem SHALL menampilkan hitungan per saham sebagai acuan untuk beras (pool Amil Kelompok fitrah) dan uang (pool Amil Kelompok mal, per lampiran).
2. WHEN admin mengisi angka final hasil musyawarah THEN sistem SHALL menyimpannya beserta catatan, dan menampilkan sisa lebih amil = pool − Σ final.

### Requirement 9 — Usaha Bersama & pembelian beras
#### Acceptance Criteria
1. THE dashboard SHALL menampilkan UB terkumpul, sudah diserahkan, masih dipegang per amil, dan yang dikembalikan.
2. WHEN admin/amil mencatat serah ke UB THEN sisa amil tersebut SHALL berkurang. Amil hanya bisa mencatat atas nama sendiri.
3. THE dashboard SHALL menampilkan kebutuhan beras dari titip uang, beras yang sudah dibeli (kg, Rp), kekurangan, dan sisa dana. Admin dapat mencatat dan menghapus pembelian.

### Requirement 10 — Dashboard pemantauan
#### Acceptance Criteria
1. THE dashboard SHALL menampilkan:
   - jiwa sensus yang sudah zakat (% dari jiwa sensus), KK sudah setor, SM, JM luar, dan kampung;
   - beras, titip uang, mal & tijaroh, fidyah, lebih bayar, dan kurang bayar;
   - setoran harian, komposisi jenis, dan perolehan per amil;
   - daftar KK belum/sebagian/kurang bayar, dan 15 setoran terbaru.
2. THE dashboard SHALL dapat dipilih per tahun dan dicetak.
3. Pengurus SHALL hanya dapat melihat, tanpa tombol ubah.

### Requirement 11 — Tren tahunan
#### Acceptance Criteria
1. THE halaman tren SHALL menampilkan:
   - KPI tahun terakhir vs sebelumnya (Δ);
   - grafik jiwa muzakki (JM/SM/luar + % sensus);
   - zakat mal/tijaroh/campuran;
   - komposisi beras vs titip uang beserta harga per tahun;
   - tabel rekap yang bisa diekspor CSV.
2. WHEN JM yang zakat > 100% jiwa sensus THEN halaman SHALL menampilkan catatan penjelasan.

### Requirement 12 — Data setoran & koreksi
#### Acceptance Criteria
1. THE halaman Data Setoran SHALL menampilkan semua transaksi per tahun dengan filter jenis, pencarian, ekspor CSV, dan penanda data impor yang belum cocok ke sensus.
2. Admin SHALL dapat mengubah setoran fitrah dari aplikasi dan menghapus (soft delete) setoran mana pun. Semuanya tercatat di Log.
3. Amil SHALL hanya dapat mengubah setoran yang ia terima sendiri, dan tidak dapat menghapus.

### Requirement 13 — Konfigurasi per tahun
#### Acceptance Criteria
1. Admin SHALL dapat mengatur per tahun: Hijriah, tanggal Idul Fitri, batas fitrah, tutup rekap mal, harga/soq, kg/soq, tarif fidyah, persentase fitrah dan mal beserta tujuan mustahiq, status buka/tutup, dan catatan.
2. WHEN admin membuat tahun baru THEN sistem SHALL menyalin konfigurasi dan amil (dengan PIN) dari tahun terakhir, lalu menutup tahun yang masih buka dengan snapshot jiwa/KK sensus.
3. Admin SHALL dapat mengelola amil (nama dari sensus, jabatan, saham, aktif, PIN), simpatisan (terkait KK sensus atau berdiri sendiri), dan pengguna Admin/Pengurus.

### Requirement 14 — Impor data 2024–2026
#### Acceptance Criteria
1. THE importer SHALL membaca format sheet 2024 (format A) dan 2025–2026 (format B) berdasarkan judul kolom.
2. THE importer SHALL membandingkan total hasil impor dengan baris rekap sheet lama (jiwa JM, SM, soq, bayar ke amil, selisih, mal utama, mal susulan) di Impor_Log.
3. THE importer SHALL mencocokkan nama ke sensus. Yang ragu masuk ke Impor_Review dengan saran, dan admin dapat menerapkan pilihan KK atau menjadikannya simpatisan.
4. WHEN impor dijalankan ulang THEN data IMPOR tahun itu SHALL diganti, tanpa duplikasi, dan data APP tidak tersentuh.
