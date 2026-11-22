# Jawaban Konsultan: 5 Feature Requests

- **Tanggal:** 2026-11-22
- **Dari:** Konsultan (Claude)
- **Untuk:** Kiro (implementer) dan pemilik produk
- **Menjawab:** `2026-11-22-feature-requests-5-items.md`
- **Keputusan:** D-23 s.d. D-28 di `docs/decisions.md`
- **Spec implementasi:** `.kiro/specs/pra-ramadhan-2027/`

## Ringkasan
Setelah kode dicek, **fitur 1, 2, dan 3 sebagian besar sudah ada di MVP**. Yang kurang hanya beberapa hal kecil. Fitur 4 adalah fitur baru, dan desainnya ada di bawah. Fitur 5 disetujui dengan bentuk yang lebih sempit dan dikerjakan **setelah Idul Fitri 1448 H**.

| # | Fitur | Status di kode | Keputusan | Kapan |
|---|---|---|---|---|
| 1 | Konfigurasi hanya Admin | **Sudah berlaku** (`routes_()`: `getConfig`, `simpanConfig`, `tahunBaru`, `simpanAmil`, `simpanPengguna` = admin) | D-23: dikonfirmasi, cukup ditambah test | Sebelum UAT |
| 2 | Admin catat atas nama amil | **Sudah ada** (dropdown "Amil yang menerima" khusus admin, di form fitrah & mal) | D-24: kolom `Dicatat_Oleh` ditambahkan | Sebelum UAT |
| 3 | Jiwa sudah setor: tampil tapi tidak bisa dipilih | **Sudah ada di form KK.** Celah hanya di mode simpatisan berdiri sendiri | D-25: celah ditutup | Sebelum UAT |
| 4 | Progres % KK & jiwa untuk jamaah | Baru | D-26: tombol "Bagikan progres" ke WhatsApp + kartu progres | Sebelum Ramadhan (ikut UAT) |
| 5 | Sumber sensus bisa diatur | Baru | D-27: Script Properties + menu spreadsheet, **bukan** halaman web | Setelah Idul Fitri 1448 H |

> Ramadhan 1448 H diperkirakan mulai ±8 Februari 2027. Fitur 1–4 harus selesai dan ikut UAT sebelum itu.

---

## 1. Konfigurasi hanya Admin (D-23)
**Jawaban pertanyaan Kiro:**
1. **Pengurus sudah dibatasi** di backend, dan menu Konfigurasi juga tidak muncul untuk pengurus (`NAV` difilter per peran).
2. **Tidak perlu perubahan di frontend.**
3. **Tidak ada tombol "Buka penerimaan" terpisah.** Membuka atau menutup penerimaan dilakukan dengan mengubah `Status` BUKA/TUTUP di Konfigurasi. Itu sudah admin-only, dan kita **tidak** menambah tombol baru.

**Yang dikerjakan:** test penolakan di `tests/e2e-api.test.js`. Amil dan pengurus harus ditolak untuk `getConfig`, `simpanConfig`, `tahunBaru`, `simpanAmil`, `simpanPengguna`, `daftarPengguna`, dan `simpanBagianAmil`.

## 2. Admin mencatat atas nama amil (D-24)
**Sudah ada:** di form fitrah dan mal, admin memilih *Amil yang menerima*. Backend (`simpanFitrah_`, `simpanLain_`) memakai `p.idAmil` hanya bila peran = admin. Amil selalu tercatat atas namanya sendiri.

**Aturan:**
- Hanya **Admin** yang boleh mencatat atas nama amil lain. Amil B **tidak** boleh mencatat untuk amil A. Jika amil A minta tolong, admin yang mencatat.
- **Amil yang dipilih adalah amil yang memegang uang atau beras.** Setoran masuk ke perolehan dan pantauan UB amil itu. Jika uang diterima langsung oleh admin, untuk mal boleh memilih "tanpa amil / langsung admin". Untuk fitrah tetap wajib memilih amil (perilaku sekarang).
- Amil A tetap boleh mengubah setoran yang dicatat admin atas namanya (aturan "amil hanya mengubah setoran miliknya" tidak berubah).

**Perubahan:** kolom baru **`Dicatat_Oleh`** di ujung kanan `Setoran_Fitrah` dan `Zakat_Lain`.
- **Isi:** nama sesi (`s.nama`) saat setoran **dibuat**. Tidak berubah saat setoran diubah, karena perubahan sudah dicatat di `Diubah_Oleh`.
- **Data lama:** baris impor dan data sebelum kolom ini ada dibiarkan kosong.
- **Data Setoran:** tampilkan "dicatat oleh <nama>" sebagai teks kecil **hanya bila berbeda** dari `Nama_Amil`. Kolom ini juga ikut ekspor CSV.
- **Alasan:** sheet `Log` sudah mencatatnya, tapi Log tidak terlihat di aplikasi. Dengan kolom ini, amil bisa melihat setoran atas namanya yang dicatat orang lain.

**Jawaban pertanyaan Kiro:**
1. Belum ada kolom pencatat. Yang ada `Diubah_Oleh`, yang hanya terisi saat setoran diubah. Kolom `Dicatat_Oleh` ditambahkan.
2. Log sudah berisi peran, nama sesi, dan detail setoran. Tambahkan `amil: <Nama_Amil>` ke detail log `simpanFitrah`/`simpanLain`.
3. Form tetap sama. Tidak ada form admin terpisah.

## 3. Jiwa yang sudah setor: tampil tapi tidak bisa dipilih (D-25)
**Sudah ada:**
- Di form KK, anggota dan simpatisan terkait yang sudah zakat tetap tampil, checkbox-nya **disabled**, dengan chip **"Sudah zakat"**.
- Di daftar KK, statusnya *Sudah n/n* atau *Sebagian n/n*.
- Backend menolak duplikat di dalam lock.

**Celah yang ditutup:** di mode **simpatisan berdiri sendiri** (`smPicker`), daftar simpatisan tidak menandai yang sudah zakat. Amil baru tahu setelah menekan Simpan dan mendapat error.
- **Backend:** `daftarSimpatisan_()` menambah field `sudah` (boolean, untuk tahun aktif, dari `Setoran_Fitrah_Jiwa`).
- **UI:** simpatisan yang sudah zakat tetap tampil di hasil cari, dengan gaya `check done`, tidak bisa dipilih, dan chip `ok` **"Sudah zakat"**. Pakai teks yang sama dengan form KK, jangan "Sudah setor zakat", supaya istilahnya konsisten.
- **Saat mengubah setoran:** simpatisan milik setoran yang sedang diubah tetap bisa dipilih (sama seperti anggota KK).

**Jawaban pertanyaan Kiro:**
1. Berlaku di form setoran fitrah, baik mode KK maupun simpatisan. Pencarian di form **mal/fidyah tidak dikunci**, karena orang boleh membayar mal lebih dari sekali.
2. **Tidak ada "lihat setoran lama" untuk amil.** Cukup disabled dan chip. Alasannya: amil tidak perlu melihat setoran amil lain, dan tampilannya tetap sederhana. Admin bisa mencarinya di Data Setoran.
3. **Tidak perlu API baru.** Data sudah ada di `kkList` dan `daftarSimpatisan`.

## 4. Laporan progres untuk jamaah (D-26)
**Tujuan:** pengurus mengirim kabar progres zakat fitrah ke grup jamaah setiap hari selama Ramadhan. Kabar ini **tanpa nominal dan tanpa nama**, untuk mengajak yang belum.

**Jawaban pertanyaan Kiro:**
1. **Tempat:** tidak ada halaman publik. Tombol **"Bagikan progres"** ada di halaman Pemantauan untuk **Admin dan Pengurus**. Halaman publik tanpa login berarti endpoint publik baru yang membuka data, padahal tidak dibutuhkan.
2. **Pengiriman:** tidak otomatis.
   - Pengurus menekan tombol, melihat pratinjau teks, lalu menekan **"Kirim ke WhatsApp"** (`https://wa.me/?text=…`, atau `navigator.share` bila tersedia) atau **"Salin teks"**.
   - Alasannya: WhatsApp tidak punya API gratis, dan prinsip produk adalah tanpa layanan berbayar.
3. **Jam kirim:** bebas, pengurus yang menentukan. Saran: setiap hari ba'da tarawih.
4. **Format:** narasi pendek + bar teks. Formatnya di bawah.

### Definisi angka
| Angka | Definisi |
|---|---|
| KK total | KK sensus **asli** (punya ID Keluarga, bukan `TANPA-KK-…`) |
| KK sudah | KK asli yang **semua** anggota sensusnya sudah tercatat zakat (termasuk *Di kampung*). Status kurang bayar tetap dihitung sudah, karena jiwanya sudah tercatat |
| Jiwa total | Semua baris tab Jamaah (= `jiwaSensus`) |
| Jiwa sudah | Jiwa sensus (JM) yang tercatat di `Setoran_Fitrah_Jiwa` tahun ini, **termasuk** KAMPUNG |
| Hari ini | Pertambahan KK sudah dan jiwa sudah dari setoran dengan `Tanggal` = hari ini (Asia/Jakarta) |
| Persen | **Dibulatkan ke bawah** (99,6% → 99%), supaya 100% hanya muncul bila benar-benar semua sudah |

- **Tidak masuk persen:** simpatisan dan JM luar, karena mereka tidak termasuk jiwa sensus.
- **Tidak ditampilkan:** beras/uang, rupiah, nama, dan per amil.

### Teks yang dibagikan (tanpa emoji, sesuai design system)
```
*Progres Zakat Fitrah 1448 H*
Kelompok Babakan Barat
Sabtu, 6 Maret 2027 · H-4

KK sudah zakat: 98 dari 120 (81%)
▓▓▓▓▓▓▓▓░░
Jiwa sudah zakat: 231 dari 264 (87%)
▓▓▓▓▓▓▓▓░░

Hari ini bertambah 12 KK · 37 jiwa.
Batas zakat fitrah: Rabu, 10 Maret 2027 pukul 06.00 (sebelum shalat Ied).
Bagi yang belum, silakan menghubungi amil.
```
- **Bar teks:** 10 blok `▓` dan `░`, jumlah `▓` = floor(persen / 10).
- **Tanpa pertambahan hari ini:** baris "Hari ini…" dihilangkan.
- **Setelah batas fitrah lewat:** dua baris terakhir diganti "Penerimaan zakat fitrah 1448 H sudah ditutup. Jazakumullahu khoiro."
- **Nama kelompok** diambil dari `APP.KELOMPOK`.

### Kartu di Pemantauan
- **Isi:** dua bar progres, yaitu **KK sudah zakat** dan **Jiwa sudah zakat**, memakai komponen `.bar` yang sudah ada. Di bawahnya teks kecil "Hari ini +n KK · +n jiwa". Tombol **Bagikan progres** ada di kanan atas kartu.
- **Penempatan:** menggantikan bar partisipasi jiwa yang ada sekarang, supaya tidak dobel.
- **Data:** backend menambah objek `progres` di `dashboard_()`, hanya untuk tahun aktif:
  ```
  { kkTotal, kkSudah, kkSebagian, jiwaTotal, jiwaSudah, kkHariIni, jiwaHariIni, tanggal, hMinus, batasFitrah, batasLewat }
  ```

**Hubungan dengan backlog:** B-05 (rekap WA untuk pengurus, *dengan* nominal) tetap USULAN. Nanti B-05 bisa memakai mekanisme bagikan yang sama.

## 5. Sumber data sensus bisa diatur (D-27)
**Jawaban pertanyaan Kiro:**
1. **Global, bukan per tahun.** Satu instalasi = satu kelompok = satu sensus.
2. Disimpan di **Script Properties `SENSUS_ID`**, bukan di sheet. Jika kosong, pakai `APP.SENSUS_ID`, supaya instalasi BBK02 tidak perlu diubah.
3. **Validasi** lewat menu spreadsheet **Zakat › Atur sumber sensus**, yang dijalankan pemilik spreadsheet:
   - `openById` harus berhasil;
   - tab `Jamaah` dan `Keluarga` ada;
   - kolom wajib ada (lihat `domain-zakat.md` › Sensus);
   - tampilkan ringkasan "n KK, n jiwa" lalu minta konfirmasi;
   - **ditolak** bila tahun aktif BUKA sudah punya setoran `Sumber = APP`, karena ID jamaah lama tidak akan cocok dengan sensus baru;
   - setelah disimpan, cache sensus dibersihkan dan perubahan dicatat di `Log`.
4. **Tidak ada UI di halaman web.**
   - Web App berjalan sebagai akun pemilik (*Execute as Me*), jadi hanya akun itu yang bisa membuka sensus. Admin di web tidak bisa memverifikasi akses tersebut.
   - Satu salah ketik akan mematikan aplikasi untuk semua amil.
   - Ini pengaturan instalasi, bukan pengaturan tahunan.

**Pemakaian untuk kelompok lain:** setiap kelompok punya **salinan sendiri** (spreadsheet, script, Web App, dan `web/config.js` sendiri). Supaya benar-benar siap dipakai kelompok lain, masih ada yang perlu diatur: nama kelompok, file impor, dan teks "Kelompok Babakan Barat" di `web/index.html`. Itu dicatat sebagai **B-12 (USULAN)** dan tidak dikerjakan sekarang.

**Prioritas:** setelah Idul Fitri 1448 H. BBK02 tidak membutuhkannya untuk 2027.

---

## Temuan tambahan saat review (sudah diperbaiki konsultan)
- **Privasi:** `kkList_` mengirim `alamat` KK ke HP amil, padahal tidak dipakai di UI dan dilarang `security-privacy.md`. Field itu sudah dihapus dari respons.
- **D-28 (DIREVISI, lihat `docs/decisions.md`):** pemilik menegaskan bahwa jamaah tanpa ID Keluarga **bukan** KK, tetapi tetap jiwa. Daftar belum per KK sekarang hanya memuat KK asli, dan jamaah tanpa KK tampil di tabel "Jiwa tanpa KK". Catatan asli konsultan di bawah sudah tidak berlaku.
- ~~D-28: `c392cb8` tidak berpengaruh dan arahnya salah.~~
  - Filter `!k.tanpaKK` di `dashboard_()` tidak pernah bekerja, karena `kkList_` tidak mengirim properti itu.
  - Kalau filternya bekerja, jamaah tanpa ID Keluarga akan hilang dari daftar "belum zakat", padahal mereka wajib dizakati (D-18).
  - Filternya sudah dihapus. Aturannya: daftar *belum* tetap memuat `TANPA-KK-…`. Pengecualian KK virtual **hanya** untuk hitungan KK di progres (fitur 4).

## Catatan untuk Kiro
- Ikuti urutan di `.kiro/specs/pra-ramadhan-2027/tasks.md`.
- Kolom baru hanya **ditambah di kanan**. Setelah deploy, pemilik menjalankan `setupZakat`.
- Setiap perubahan backend butuh `clasp push` lalu **Manage deployments › New version**. **Jangan** membuat deployment baru.
