# Fase 3: UAT — Rencana Pengujian

**Status:** Belum dimulai. Lihat prasyarat di bawah.
**Tanggal:** ditentukan pemilik (sebaiknya jauh sebelum Ramadhan 1448 H, ±Februari 2027)
**Task:** 25–29 di `.kiro/specs/zakat-mvp/tasks.md`
**Peserta:** Admin, Pengurus, Amil, Pemilik Spreadsheet

---

## Checklist Go-Live

- [x] Apps Script deployment live & accessible
- [x] Web dashboard accessible
- [x] Data 2024–2026 import & verified
- [x] Config 2027 setup (dates, harga, tarif)
- [ ] Amil 2027 minimal **2 amil + PIN** (saat ini baru 1), untuk diuji di 2 HP Android berbeda
- [ ] Review impor diterapkan (task 20)
- [ ] Tanggal Idul Fitri 2027 & tarif fidyah dikonfirmasi pengurus
- [x] Pengguna (Admin + Pengurus) setup
- [x] All tests passing (privacy, syntax, unit, e2e)
- [ ] Manual smoke test (login, input, dashboard)
- [ ] User training (if needed)
- [ ] Sign-off dari Pemilik

---

## Skenario UAT

### 1. Login & Access Control
- **Admin login** dengan PIN Admin (verify di Dashboard › Konfigurasi)
- **Pengurus login** dengan PIN Pengurus (verify akses terbatas)
- **Amil login** dengan PIN Amil (verify form fitrah terbuka)
- Verify **timeout session** setelah 6 jam
- Verify **lock after 5 wrong PIN** (15 menit)

### 2. Input Setoran Fitrah (2027)
- **Amil input** 1 setoran fitrah BERAS:
  - Pilih KK dari sensus
  - Centang beberapa anggota
  - Input kg beras (atau default = jiwa × 2.7)
  - Verify soq dihitung benar
- **Amil input** 1 setoran fitrah UANG:
  - Pilih KK berbeda
  - Input uang (melebihi wajib = lebih bayar ke UB)
  - Verify wajib & selisih dihitung benar
- **Amil input** 1 setoran fitrah KAMPUNG:
  - Pilih KK ketiga
  - Verify jiwa KAMPUNG tidak termasuk soq dibagi

### 3. Dashboard Pemantauan (2027)
- Verify **"Belum zakat fitrah"** menampilkan KK yang belum setor (hanya KK asli, bukan TANPA-KK)
- Verify **soq yang diterima** = soq BERAS + soq UANG (tanpa KAMPUNG)
- Verify **pembagian fitrah** menggunakan largest remainder (total persis)
- Verify **per amil** menampilkan soq + rupiah yang diterima

### 4. Input Zakat Mal (2027)
- **Admin input** 1 setoran zakat mal (sebelum tutup rekap):
  - Verify lampiran = UTAMA
- **Admin input** 1 setoran zakat mal (setelah tutup rekap atau status TUTUP):
  - Verify lampiran otomatis = SUSULAN

### 5. Input Fidyah (2027)
- **Admin input** 1 fidyah sebagai setoran terpisah
- **Amil input** 1 fidyah "sekalian" dengan fitrah
- Verify **fidyah tidak ikut pembagian** fitrah

### 6. Batas Waktu (2027)
Jam HP atau server tidak perlu diubah. Cukup ubah **`Batas_Fitrah` di Konfigurasi**:
- **Sebelum diubah** (batas masih di masa depan): amil bisa input fitrah.
- **Ubah `Batas_Fitrah` ke waktu lampau** (mis. kemarin 06:00):
  - Form fitrah amil terkunci, dan penyimpanan ditolak backend.
  - Admin bisa input susulan administrasi **hanya** jika tanggal setor ≤ tanggal batas. Tanggal setor sesudah batas harus ditolak.
- **Kembalikan** `Batas_Fitrah` ke 2027-03-10 06:00, lalu hapus setoran uji.

### 7. Tren & Export
- Buka Dashboard › Tren
- Verify 2024, 2025, 2026 data cocok dengan yang sudah ada
- Verify 2027 (jika sudah ada input) tampil di tren
- **Export CSV** tren (jika ada fitur)

### 8. Data Integrity
- Verify **satu jiwa tidak bisa dizakati dua kali** dalam 2027:
  - Coba input jiwa yang sudah tercatat → error
- Verify **log aktivitas** tercatat di sheet Log

### 9. Admin Functions
- **Ubah setoran** (edit)
- **Hapus setoran** (soft delete dengan Dihapus = Y)
- **Bagian amil** — input final hasil musyawarah
- **Serah UB** — catat penyerahan UB ke pihak lain

### 10. Config Adjustment
- **Ubah amil** (tambah/edit/hapus PIN)
- **Ubah pengguna** (tambah Pengurus baru)
- **Ubah master simpatisan** (tambah SM baru)

---

### 11. Fitur pra-Ramadhan (D-24 s.d. D-26)
- **Admin mencatat atas nama amil:** login Admin → Input setoran → pilih *Amil yang menerima* = amil lain → simpan.
  - Di Data Setoran, kolom Amil menampilkan amil tersebut + "dicatat oleh <admin>".
  - CSV memuat kolom "Dicatat oleh".
- **Simpatisan sudah zakat terkunci:** catat fitrah simpatisan berdiri sendiri → buka lagi *Fitrah simpatisan* → cari nama yang sama. Namanya harus tampil abu-abu dengan label "Sudah zakat" dan tidak bisa dipilih.
- **Bagikan progres (HP pengurus):** Pemantauan → *Bagikan progres* → cek teks:
  - tanpa rupiah, tanpa nama;
  - persen KK & jiwa masuk akal;
  - ada H-n dan batas zakat fitrah.
  - Tekan *Kirim ke WhatsApp*: WhatsApp terbuka dengan teks terisi. Coba juga *Salin teks*.
- **Amil tidak melihat tombol Bagikan progres.**

### 12. Hitungan KK & jiwa tanpa KK (D-28)
- **Kotak Belum zakat fitrah:** jumlah KK = jumlah KK di sensus (yang punya ID Keluarga), mis. 65, bukan 88.
- **Tabel "Jiwa tanpa KK":** di bawahnya ada tabel ini berisi perantau/pendatang/mandiri yang belum zakat.
- **Catat zakat satu jamaah tanpa KK** (di daftar amil bertanda "Tanpa KK") → namanya hilang dari tabel "Jiwa tanpa KK", dan hitungan KK tidak berubah.

### 13. Kecepatan
- **Pindah halaman:** setelah login, buka Pemantauan → Tren → Data Setoran → kembali ke Pemantauan. Halaman yang sudah pernah dibuka harus langsung tampil (tanpa "Memuat…"), lalu diperbarui sendiri bila ada data baru.
- **Kesegaran setelah simpan:** simpan setoran di HP amil → di laptop admin tekan *Muat ulang* di Pemantauan → angka langsung bertambah.
- **Catat waktu tunggu pertama kali** membuka Pemantauan dan Tren (detik), untuk laporan.

### 14. Perbaikan temuan UAT v1.3
- **Pindah halaman saat memuat:** buka Konfigurasi, lalu sebelum selesai memuat langsung pilih Data Setoran. Yang tampil harus tetap Data Setoran.
- **Data Setoran:**
  - login sebagai **amil**: menu Data Setoran ada, tanpa tombol Ubah/Hapus;
  - kolom Muzakki berisi nama per jiwa, dengan "KK …" di bawahnya;
  - cari dengan nama anggota (bukan nama KK) harus ketemu.
- **Ubah Mal/Fidyah (admin):** Data Setoran → filter Fidyah → Ubah → ganti nominal → Simpan perubahan.
- **Format rupiah:** ketik 1250000 di nominal → tampil 1.250.000.
- **Cari nama:**
  - saat mengetik muncul "Mencari nama…";
  - setelah nama dipilih, daftar tertutup dan tampil "Terpilih: …";
  - mengetik ulang memunculkan daftar lagi.
- **Tambah amil di HP:** Konfigurasi → Tambah amil → ketik nama → daftar hasil terlihat utuh (tidak tertutup keyboard atau terpotong).
- **Simpan:** saat tombol menampilkan "Menyimpan…", semua isian tidak bisa diubah.
- **Refresh:** catat waktu buka pertama Pemantauan setelah refresh browser (target ≤ 4–5 detik). Jika **pemanas cache** dipasang (editor › Triggers › `hangatkanCache` tiap 10 menit), pembukaan pertama di pagi hari juga cepat.

### 15. Perbaikan temuan UAT v1.4
- **Halaman pembuka:** login sebagai amil/pengurus/admin → halaman pertama = **Pemantauan**.
- **Daftar keluarga:** tunggu ±5 detik di Pemantauan → buka Input Setoran → daftar keluarga langsung tampil tanpa "Memuat…".
- **Posisi gulir:** di Input Setoran gulir ke bawah → buka satu KK → tekan tombol back HP → halaman Input Setoran tampil dari atas (tidak melompat ke posisi lama).
- **Tombol × di semua kolom cari:** kolom cari KK (Input Setoran), simpatisan, muzakki mal/fidyah, Data Setoran, dan cari amil di Konfigurasi.
  - × muncul saat ada isian;
  - menekannya mengosongkan isian dan mengembalikan daftar;
  - di form mal/fidyah, "Terpilih: …" ikut hilang.
- **Bagian amil kelompok:** login amil dan pengurus → Pemantauan **tidak** menampilkan kartu "Bagian amil kelompok". Login admin → kartu tampil dan hasil musyawarah tetap bisa diisi.

### 16. Mustahiq, laporan resmi & hapus massal (v1.5)
**Persiapan (sekali):** jalankan `setupZakat` (menu Zakat › 1) supaya sheet `Mustahiq`, `Mustahiq_Serah`, dan kolom `Penandatangan` dibuat.

- **Menu:** login admin/pengurus → ada menu **Mustahiq** dan **Laporan**. Login amil → tidak ada, dan membuka `#/mustahiq` dialihkan ke Pemantauan.
- **Kandidat (admin):** Mustahiq → kartu "Kandidat dari sensus" berisi jamaah "Perlu Dibantu" → centang beberapa, pilih asnaf → Tambahkan. Tambahkan juga satu jamaah lewat *Cari jamaah sensus* dan satu *Penerima luar sensus* (mis. 3 jiwa).
- **Pembagian:** jumlah soq semua KK = bagian mustahiq (kartu gelap). Total tidak pernah lebih atau kurang.
- **Penyerahan:**
  - *Tandai diserahkan* → chip hijau;
  - tambah setoran fitrah baru → baris itu bertanda "Berubah" → *Tandai ulang*;
  - *Batal* menghapus tanda.
- **Pengurus:** melihat daftar yang sama tanpa kandidat dan tanpa tombol ubah/tandai. Pemantauan menampilkan kartu "Penyaluran mustahiq".
- **Penandatangan:** Konfigurasi → *Penandatangan laporan* → isi nama → Simpan.
- **Laporan:** Laporan → cek kelima jenis, lalu *Cetak / Simpan PDF* (pilih "Simpan sebagai PDF"):
  - Muzakki Zakat Fitrah (mendatar): total tanpa zakat di kampung, pembagian pas;
  - Zakat Mal Utama/Susulan: bagian A–D cocok dengan Pemantauan;
  - Daftar Mustahiq: kepala keluarga tebal, urut per KK;
  - Lembar Penyerahan: per KK dengan kolom tanda tangan.
- **Hapus massal (uji di tahun uji/kosong saja!):** menu Zakat › *Hapus massal setoran satu tahun* → isi tahun → baca ringkasan → ketik `HAPUS <tahun>` → catat kode batch → Pemantauan tahun itu kosong. Lalu menu Zakat › *Pulihkan hapus massal* → kode batch → data kembali.



**Sukses UAT jika:**
1. Semua skenario berjalan tanpa error
2. Data konsisten (input = dashboard = tren)
3. Pembagian persis (tidak ada selisih)
4. Batas waktu berfungsi
5. Access control bekerja
6. User interface responsif & user-friendly

**Gagal UAT jika:**
- Error saat input/dashboard
- Data tidak konsisten
- Pembagian melebihi/kurang soq
- Access control by-pass
- Performance lambat

---

### 17. Perbaikan v1.6
**Persiapan:** jalankan `setupZakat` sekali (kolom `Simpatisan.Dihapus`).

- **Uang diterima (Titip uang):** ketik 1250000 → langsung tampil 1.250.000 tanpa pindah tab.
- **Laporan Muzakki Zakat Fitrah:** catat setoran hanya untuk sebagian anggota KK (atau dua setoran terpisah). Di laporan, baris itu tertulis "Nama jiwa (KK Nama Kepala)". Setoran satu keluarga penuh tetap nama KK.
- **Hapus simpatisan:** Konfigurasi › Master simpatisan › Ubah › *Hapus simpatisan*.
  - Simpatisan yang sudah menyetor tahun ini ditolak dengan pesan jelas.
- **Mustahiq: kepala keluarga** (kandidat bertanda "seluruh n jiwa KK ikut terdaftar" atau lewat cari nama) → seluruh anggota KK masuk daftar.
  - Anggota yang tidak termasuk bisa dikeluarkan.
- **Laporan:**
  - chip *Daftar Mustahiq untuk Daerah* (per jiwa, anggota keluarga dirinci);
  - chip baru *Daftar Mustahiq untuk Kelompok* ("NAMA MUSTAHIQ BABAKAN BARAT", per KK, pembagian desimal & pembulatan, total = bagian mustahiq);
  - *Lembar Penyerahan* tanpa teks "angka sementara".

### 18. Angka final mustahiq hasil musyawarah (v1.7)
**Persiapan:** jalankan `setupZakat` sekali (sheet `Mustahiq_Final`).

- **Isi angka final:** Mustahiq › *Atur hasil musyawarah* → kolom **Soq final** bisa diisi (placeholder = angka acuan).
  - ubah beberapa KK, isi 0 untuk satu KK;
  - di bawah tabel, total final vs bagian mustahiq berubah langsung (pas / lebih / kurang).
- **Simpan walau belum pas:** tersimpan, dan muncul peringatan merah di atas.
  - kolom **Acuan** tampil di sebelah **Soq final**;
  - KK yang diisi bertanda "musyawarah".
- **Isi dari acuan / Kosongkan / Batal** berfungsi.
- **Laporan untuk Kelompok:** kolom Pembulatan = angka final, dengan catatan selisih bila tidak pas.
- **Lembar Penyerahan:** memakai angka final.
- **Tandai diserahkan:** menyimpan angka final.
- **Pengurus:** melihat angka final tanpa tombol *Atur hasil musyawarah*.

### 19. Ubah setoran aman & cek konsistensi sensus (v1.7.3 & v1.8)
- **Form Ubah setoran:** di sensus, pindahkan satu anggota KK yang sudah menyetor ke KK lain (atau gunakan kasus nyata), lalu buka Data Setoran › Ubah setoran itu. Anggota tersebut tetap tampil, tercentang, dan bertanda "Pindah ke KK …". Simpan, lalu pastikan jumlah jiwa tidak berkurang.
- **Cek konsistensi:** Konfigurasi › *Cek konsistensi sensus*.
  - Data yang cocok menampilkan "Semua data cocok dengan sensus".
  - Setelah perubahan sensus di atas, muncul temuan "Jiwa sudah pindah KK" lengkap dengan saran dan tombol *Buka*.
  - Ikuti saran, lalu *Periksa ulang*.
- **Akses:** login pengurus/amil → membuka `#/konsistensi` dialihkan ke Pemantauan.

## Sign-Off

| Role | Nama | Tanda Tangan | Tanggal |
|---|---|---|---|
| Admin | | | |
| Pengurus | | | |
| Pemilik | | | |

**UAT Status:** ☐ Lanjut ke Produksi | ☐ Perbaiki & UAT ulang | ☐ Batalkan

**Catatan:**


---

## Setelah UAT
- Catat setiap temuan dengan format: skenario, langkah, hasil yang diharapkan, hasil nyata, HP/browser, dan peran. **Jangan** melampirkan screenshot yang berisi data jamaah asli.
- Tulis hasilnya di `docs/handoff/YYYY-MM-DD-laporan-uat.md` memakai `_TEMPLATE-laporan.md` (task 28).
- Bug yang tidak mengubah aturan atau UX boleh langsung diperbaiki (task 29). Temuan yang mengubah aturan atau UX dibuat jadi handoff ke konsultan.
