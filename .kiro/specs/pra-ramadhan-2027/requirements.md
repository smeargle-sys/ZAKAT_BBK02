# Requirements — Pra-Ramadhan 2027 (fitur 1–4 dari handoff pemilik)

> **Status:** DISETUJUI konsultan, 2026-11-22. Keputusan: D-23 s.d. D-26 dan D-28. Penjelasan lengkap: `docs/handoff/2026-11-22-jawaban-konsultan-5-fitur.md`.
> Fitur 5 (sumber sensus, D-27) **tidak** termasuk spec ini dan dikerjakan setelah Idul Fitri 1448 H.
> Perubahan pada dokumen ini **hanya** lewat konsultan.

### Requirement 1 — Konfigurasi hanya Admin (D-23)
**User Story:** Sebagai pemilik, saya ingin hanya Admin yang bisa mengubah konfigurasi dan membuka/menutup penerimaan, supaya aturan tahun berjalan tidak berubah tanpa sengaja.

#### Acceptance Criteria
1. IF peran amil atau pengurus memanggil `getConfig`, `simpanConfig`, `tahunBaru`, `simpanAmil`, `daftarPengguna`, `simpanPengguna`, atau `simpanBagianAmil` THEN sistem SHALL menolak dengan `ok:false`.
2. THE menu Konfigurasi SHALL hanya tampil untuk Admin. Perilaku ini sudah ada dan tidak boleh rusak.

### Requirement 2 — Admin mencatat atas nama amil (D-24)
**User Story:** Sebagai admin, saya ingin mencatat setoran yang diterima amil lain atas nama amil tersebut, dan tetap terlihat siapa yang mencatatnya.

#### Acceptance Criteria
1. WHEN setoran fitrah atau zakat lain **dibuat** THEN sistem SHALL mengisi `Dicatat_Oleh` dengan nama sesi.
2. WHEN setoran diubah THEN `Dicatat_Oleh` SHALL tidak berubah.
3. IF peran amil mengirim `idAmil` milik amil lain THEN sistem SHALL tetap mencatat atas nama amil yang login. Perilaku ini sudah ada dan wajib dites.
4. WHEN `Dicatat_Oleh` terisi dan berbeda dari `Nama_Amil` THEN Data Setoran SHALL menampilkan "dicatat oleh <nama>". CSV SHALL memuat kolom `Dicatat_Oleh`.
5. THE detail log `simpanFitrah`/`simpanLain` SHALL memuat nama amil yang dipilih.

### Requirement 3 — Simpatisan yang sudah zakat tidak bisa dipilih (D-25)
**User Story:** Sebagai amil, saya ingin langsung melihat simpatisan yang sudah zakat fitrah tahun ini, supaya tidak mencoba mencatat dua kali.

#### Acceptance Criteria
1. THE `daftarSimpatisan` SHALL mengembalikan `sudah: true` untuk simpatisan yang tercatat di `Setoran_Fitrah_Jiwa` tahun aktif dan belum dihapus.
2. WHEN form fitrah berada di mode simpatisan berdiri sendiri THEN simpatisan dengan `sudah: true` SHALL tetap tampil, tidak bisa dipilih, dan berchip "Sudah zakat".
3. WHEN setoran yang sudah ada diubah THEN simpatisan milik setoran itu SHALL tetap bisa dipilih.
4. THE pencarian di form mal/fidyah SHALL tidak terpengaruh.

### Requirement 4 — Progres KK & jiwa untuk jamaah (D-26)
**User Story:** Sebagai pengurus, saya ingin membagikan progres zakat fitrah ke grup jamaah setiap hari tanpa nominal, supaya yang belum terdorong untuk segera berzakat.

#### Acceptance Criteria
1. WHEN tahun yang diminta adalah tahun aktif THEN `dashboard` SHALL mengembalikan `progres`, dengan definisi angka persis seperti di jawaban konsultan:
   `{kkTotal, kkSudah, kkSebagian, jiwaTotal, jiwaSudah, kkHariIni, jiwaHariIni, tanggal, hMinus, batasFitrah, batasLewat}`
2. THE `kkTotal`/`kkSudah`/`kkSebagian` SHALL hanya menghitung KK asli (bukan `TANPA-KK-…`). `jiwaTotal` = semua baris Jamaah. `jiwaSudah` = JM sensus yang tercatat, termasuk KAMPUNG.
3. THE `kkHariIni`/`jiwaHariIni` SHALL = pertambahan dari setoran ber-`Tanggal` hari ini (Asia/Jakarta). Contoh: KK yang sebelumnya sebagian lalu menjadi lengkap hari ini dihitung +1 KK.
4. THE Pemantauan SHALL menampilkan kartu progres berisi dua bar (KK & jiwa), menggantikan bar partisipasi jiwa yang lama.
5. WHEN Admin atau Pengurus menekan "Bagikan progres" THEN sistem SHALL menampilkan pratinjau teks sesuai format, dengan tombol "Kirim ke WhatsApp" dan "Salin teks".
6. THE teks SHALL memakai persen yang dibulatkan ke bawah, bar 10 blok, tanpa emoji, tanpa nominal, dan tanpa nama orang.
7. IF batas fitrah sudah lewat THEN teks SHALL memakai kalimat penutup. Bila pertambahan hari ini 0 KK dan 0 jiwa, baris "Hari ini…" SHALL dihilangkan.
8. THE tombol "Bagikan progres" SHALL tidak tampil untuk amil.

### Requirement 5 — KK hanya yang punya ID Keluarga; jamaah tanpa KK tetap jiwa (D-28, revisi)
#### Acceptance Criteria
1. THE `dashboard.belum` SHALL hanya memuat KK asli. `dashboard.belumTanpaKK` SHALL memuat jamaah tanpa ID Keluarga yang belum zakat. `jiwaBelum` SHALL tetap menghitung mereka, dan `kkSetor` SHALL tidak menghitung mereka.
2. THE `kkList` SHALL tidak mengirim `alamat`. Perilaku ini sudah diperbaiki konsultan dan wajib dites.
