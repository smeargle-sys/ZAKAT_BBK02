# Task 17–21 — Go-Live Setup untuk Pemilik

**Tanggung Jawab:** 👤 Pemilik Produk (di Google Drive & Google Apps Script)  
**Durasi:** ±2–3 jam (tergantung kecepatan impor)  
**Referensi:** `#release-runbook` di `.kiro/steering/release-runbook.md`

---

## Task 17: Buat Spreadsheet & Tempel Code Apps Script

### Step 1: Buat Spreadsheet Baru

1. Buka **Google Drive** → akun yang sama dengan SENSUS BBK02
2. Klik **"+ New"** → **Google Sheets**
3. Beri nama: **`ZAKAT BBK02`**
4. Simpan di folder yang terorganisir (opsional)

### Step 2: Tempel Kode Apps Script

1. Buka spreadsheet yang baru dibuat
2. Klik **Ekstensi** → **Apps Script**
   - Ini membuka editor Apps Script baru
   - Ada file template `Code.gs` (bisa dihapus nanti)

3. **Tambah file baru untuk setiap `.gs` di folder `apps-script/`:**

   **Urutan PENTING:**
   1. `00_Config.gs` — Klik `+` → "Create new file" → `.gs` → nama `00_Config`
      - Copy-paste seluruh isi dari file lokal `apps-script/00_Config.gs`
      - Tekan Ctrl+S

   2. `Util.gs` — Tambah file baru, copy isi `apps-script/Util.gs`

   3. `Sensus.gs`, `Auth.gs`, `Api.gs`, `Setup.gs`, `Master.gs`, `Fitrah.gs`, `Dashboard.gs`, `Import.gs`, `ImportParse.gs`, `Matcher.gs`
      - Lakukan hal yang sama untuk semua (tambah file → copy-paste → save)

   **Jangan lupa:** Bisa hapus file `Code.gs` yang default kalau sudah tidak perlu

4. **Update `appsscript.json` manifest:**
   - Di project settings (ikon gigi atas), centang **"Show appsscript.json"**
   - Ganti isi manifest dengan dari `apps-script/appsscript.json`
   - Ini include Drive API untuk impor & konfigurasi zona waktu

5. **Simpan (Ctrl+S)**

### Step 3: Jalankan `setupZakat()` Pertama Kali

1. Di editor Apps Script, cari fungsi `setupZakat`
   - Tekan Ctrl+F → ketik `setupZakat` → tekan Enter

2. Klik tombol **▶ Run** (play button)

3. Sistem akan minta **izin akses:**
   - Klik "Review permissions"
   - Pilih akun Google kamu
   - Klik "Allow" untuk beri akses Drive, Sheets, dll

4. Tunggu proses selesai (±10–30 detik)
   - Di console akan muncul: `Setup selesai` atau pesan sukses

5. **Reload spreadsheet** (tekan F5)

6. Sekarang menu **Zakat** seharusnya muncul di toolbar spreadsheet

✅ **Task 17 Selesai:** Spreadsheet siap dengan semua sheet yang dibutuhkan

---

## Task 18: Buat Akun Admin Pertama

### Step 1: Jalankan Menu Zakat › Buat Akun Admin

1. Di spreadsheet ZAKAT BBK02, klik **Zakat** di toolbar
2. Pilih **Buat akun Admin**
3. Muncul dialog form:
   - **Nama Admin:** Ketik nama kamu (mis. "Haji Budi")
   - **PIN Admin:** Ketik 6 digit (mis. "123456" — JANGAN gunakan ini, gunakan PIN kamu sendiri yang aman)

4. Klik **Simpan**

5. Sistem akan:
   - Membuat akun di sheet `Pengguna`
   - Set PIN sebagai hash (tidak disimpan plain text)
   - Buat sheet `Config_Tahun` dengan tahun default 2024–2027

✅ **Task 18 Selesai:** Admin account siap, bisa login dengan PIN yang sudah dibuat

---

## Task 19: Impor Data Lama 2024–2026

### Step 1: Siapkan File xlsx Lama

Pastikan punya 3 file data historis:
- File zakat 2024 (format A) — `Zakat_2024.xlsx` atau nama lain
- File zakat 2025 (format B) — `Zakat_2025.xlsx`
- File zakat 2026 (format B) — `Zakat_2026.xlsx`

**Lokasi:** Upload ke Google Drive, atau bisa di local terus pilih saat impor

### Step 2: Jalankan Menu Zakat › Impor Data Lama

1. Di spreadsheet, klik **Zakat** → **Impor data lama 2024–2026**

2. Muncul dialog untuk pilih file:
   - **File 2024:** Pilih file xlsx 2024 dari Drive
   - **File 2025:** Pilih file xlsx 2025
   - **File 2026:** Pilih file xlsx 2026

3. Klik **Mulai Impor** (atau "Start Import")

4. Tunggu proses selesai (±5–15 menit tergantung ukuran data)
   - System akan:
     - Parse data dari xlsx
     - Match nama ke sensus (di sheet `Impor_Review`)
     - Simpan ke sheet `Setoran_Fitrah`, `Zakat_Lain`, dll
     - Catat cek total di sheet `Impor_Log`

### Step 3: Validasi `Impor_Log` = SAMA

1. Buka sheet **`Impor_Log`** di spreadsheet
2. Lihat kolom **Status** untuk setiap cek:
   - `Jiwa Sensus 2024` → Status: `SAMA` ✓
   - `Total Beras 2024` → Status: `SAMA` ✓
   - `Total Uang Titip 2024` → Status: `SAMA` ✓
   - (Lakukan untuk tahun 2025 & 2026 juga)

**Jika ada `BEDA`:**
- Catat angka yang beda
- Buat handoff/laporan ke konsultan dengan format:
  ```
  Tahun: 2024
  Cek: Jiwa Sensus
  Expected (dari sheet lama): 280
  Actual (di impor): 281
  Gap: 1 jiwa
  ```

✅ **Task 19 Selesai:** Semua total impor = SAMA dengan rekap sheet lama

---

## Task 20: Review Impor & Cocokkan Nama

### Step 1: Buka Sheet `Impor_Review`

1. Di spreadsheet, buka sheet **`Impor_Review`**
2. Lihat kolom **Status**:
   - `COCOK` = nama berhasil dicocokkan ke sensus ✓
   - `PERLU_CEK` = nama tidak jelas, perlu manual fix
   - `TIDAK_ADA` = nama tidak ketemu di sensus
   - `MANUAL` = sudah diisi manual
   - `SM` = simpatisan (bukan dari sensus)

### Step 2: Isi Kolom untuk Nama yang PERLU_CEK

Untuk setiap row dengan Status `PERLU_CEK` atau `TIDAK_ADA`:

**Opsi A: Isi `Pilih_ID_Keluarga`**
- Buka sheet **`Keluarga`** di SENSUS BBK02 untuk cari ID Keluarga yang sesuai
- Copy ID (mis. `KK-00123`)
- Paste ke kolom `Pilih_ID_Keluarga` di row yang problematic
- Sistem akan auto-match nama ke keluarga tersebut

**Opsi B: Isi `Jadikan_SM` = `Y`**
- Jika nama adalah simpatisan (bukan dari sensus), isi `Y` di kolom `Jadikan_SM`
- Sistem akan move ke master `Simpatisan` sebagai orang luar

### Step 3: Terapkan Hasil Review

1. Di spreadsheet, klik **Zakat** → **Terapkan hasil review impor**
2. Sistem akan:
   - Buat simpatisan baru untuk yang `Jadikan_SM = Y`
   - Update ID Keluarga untuk yang diisi `Pilih_ID_Keluarga`
   - Finalize semua data impor

3. Reload sheet untuk lihat perubahan

✅ **Task 20 Selesai:** Semua nama cocok ke sensus atau jadi simpatisan

---

## Task 21: Deploy Web App & Dapat URL `/exec`

### Step 1: Deploy Web App

1. Di editor Apps Script, klik **Deploy** (tombol biru atas kanan)
   - Pilih **New deployment** (atau "Create a new deployment")

2. Muncul dialog "Deploy new version":
   - **Type:** Pilih **Web app**
   - **Execute as:** Pilih **Me** (akun kamu sendiri, pemilik spreadsheet)
   - **Who has access:** Pilih **Anyone**
   - Klik **Deploy**

3. Muncul pop-up dengan **Deployment ID** dan **URL**:
   - URL berakhiran `/exec`, contoh:
     ```
     https://script.google.com/macros/s/AKfycbzABC123XYZ/exec
     ```
   - **SALIN URL ini** (penting untuk step berikutnya)

### Step 2: Simpan URL untuk Next Step

Pemilik harus memberikan URL ini ke Kiro untuk isi ke `web/config.js`.

**Format:** Copy-paste URL lengkap (berakhir dengan `/exec`)

✅ **Task 21 Selesai:** Web App deployed, URL `/exec` sudah didapat

---

## ✅ Fase 2 Pemilik — Checklist Lengkap

Setelah Task 17–21 selesai, pastikan:

- [ ] Task 17: Spreadsheet ZAKAT BBK02 dibuat dengan 14 file `.gs` + manifest
- [ ] Task 17: Menu **Zakat** muncul di toolbar spreadsheet
- [ ] Task 18: Akun Admin pertama dibuat dengan PIN aman (bukan `123456`)
- [ ] Task 19: Impor 2024–2026 selesai, `Impor_Log` semua = `SAMA`
- [ ] Task 20: `Impor_Review` sudah di-review, nama semua cocok/jadi simpatisan
- [ ] Task 21: Web App deployed, URL `/exec` sudah diperoleh

---

## 📞 Troubleshooting

### "Cannot read property of undefined" di Setup
- Pastikan semua 12 file `.gs` sudah ditambah ke editor (cek di panel Files)
- Pastikan urutan file benar (00_Config, Util dulu)
- Reload editor (F5)

### Setup berhasil tapi menu Zakat tidak muncul
- Reload spreadsheet (F5 atau Ctrl+R)
- Tunggu 1–2 menit
- Jika masih tidak muncul, jalankan `setupZakat()` lagi

### Impor data gagal / "Invalid file format"
- Pastikan file xlsx sesuai format (format A untuk 2024, format B untuk 2025–2026)
- Lihat struktur sheet lama untuk pastikan kolom tepat
- Jika stuck, hubungi Kiro untuk bantu debug

### Nama tidak cocok saat impor review
- Lihat sheet SENSUS BBK02 › Keluarga untuk cari ID yang sesuai
- Jika tidak ketemu, isi `Jadikan_SM = Y` untuk jadikan simpatisan

### Deploy Web App error "Authorization required"
- Pastikan akun Google login adalah pemilik spreadsheet
- Jika error "This app hasn't been verified," klik "Advanced" → "Go to [nama project]" → Izinkan

---

## Next Steps (Setelah Task 17–21)

1. Pemilik memberikan URL `/exec` ke Kiro
2. **Kiro** lakukan Task 22: Update config.js & setup GitHub Pages
3. Pemilik lakukan **Task 23**: Konfigurasi tahun 2027 & amil
4. **Kiro** lakukan **Task 24**: Verifikasi Tren

---

**Task 17–21 siap dimulai! 🚀**

Jika ada pertanyaan, hubungi Kiro atau lihat referensi di `.kiro/steering/release-runbook.md`

