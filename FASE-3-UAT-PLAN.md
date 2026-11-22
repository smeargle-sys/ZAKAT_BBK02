# Fase 3: UAT — Rencana Pengujian

**Status:** Siap UAT
**Tanggal:** 2027-01-xx (akan dikonfirmasi)
**Peserta:** Admin, Pengurus, Amil, Pemilik Spreadsheet

---

## Checklist Go-Live

- [x] Apps Script deployment live & accessible
- [x] Web dashboard accessible
- [x] Data 2024–2026 import & verified
- [x] Config 2027 setup (dates, harga, tarif)
- [x] Amil 2027 setup (1 amil + PIN)
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
- **Set ulang tanggal sistem** ke hari sebelum batas fitrah:
  - Amil bisa input fitrah
- **Set ke hari setelah batas fitrah:**
  - Amil form fitrah terkunci
  - Admin bisa input susulan (tanggal setor ≤ tanggal batas)

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

## Hasil yang Diharapkan

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

## Sign-Off

| Role | Nama | Tanda Tangan | Tanggal |
|---|---|---|---|
| Admin | | | |
| Pengurus | | | |
| Pemilik | | | |

**UAT Status:** ☐ Lanjut ke Produksi | ☐ Perbaiki & UAT ulang | ☐ Batalkan

**Catatan:**

