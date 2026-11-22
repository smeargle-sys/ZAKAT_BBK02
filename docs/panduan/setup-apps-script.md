# Setup Google Apps Script — ZAKAT BBK02

Panduan ini untuk **memasang kode backend** ke Google Apps Script project yang sudah dibuat.

## Opsi 1: Automatic Push via Clasp (Recommended)

**Requirement:** Apps Script API sudah enabled di akun Google kamu.

### Enable Apps Script API

1. Buka https://script.google.com/home/usersettings
2. Aktifkan toggle **"Apps Script API"**
3. Tunggu **5–10 menit** untuk propagasi
4. Coba jalankan command berikut:

```bash
cd /Volumes/NewVols/git/zakat-bbk02
clasp push
```

Jawab `y` ketika ditanya "Manifest file has been updated. Do you want to push and overwrite?"

Kalau berhasil, semua file `.gs` akan muncul di Google Apps Script editor.

---

## Opsi 2: Manual Copy-Paste (Jika API masih error)

Jika setelah enable API masih dapat error, lakukan manual copy-paste:

### Step 1: Buka Google Apps Script editor

1. Buka spreadsheet `ZAKAT BBK02` di akun Google kamu
2. Klik **Ekstensi › Apps Script**
3. Hapus file `Code.gs` yang ada (biar bersih)

### Step 2: Tambah file baru dan copy isi

Urutan copy-paste file (PENTING):

| Urutan | File | Langkah |
|---|---|---|
| 1 | `00_Config.gs` | Klik `+` di panel Files → "Create a new file" → `.gs`. Beri nama `00_Config`. Copy-paste isi dari `apps-script/00_Config.gs` |
| 2 | `Util.gs` | Klik `+` lagi → Beri nama `Util`. Copy isi dari `apps-script/Util.gs` |
| 3 | `Sensus.gs` | Copy isi dari `apps-script/Sensus.gs` |
| 4 | `Auth.gs` | Copy isi dari `apps-script/Auth.gs` |
| 5 | `Api.gs` | Copy isi dari `apps-script/Api.gs` |
| 6–12 | File lainnya | Copy dengan urutan: `Setup.gs`, `Master.gs`, `Fitrah.gs`, `Dashboard.gs`, `Import.gs`, `ImportParse.gs`, `Matcher.gs` |

### Step 3: Update manifest

1. Klik project settings (ikon gigi di atas panel Files)
2. Centang **"Show "appsscript.json"** di bagian "Manifest version"
3. Ganti isi `appsscript.json` dengan isi dari `apps-script/appsscript.json` (lihat di repo)

### Step 4: Simpan dan refresh

1. Tekan Ctrl+S (atau Cmd+S) untuk simpan
2. Refresh halaman spreadsheet
3. Menu **Zakat** seharusnya muncul di toolbar

---

## Setelah Setup Berhasil

1. **Jalankan setup awal:** Di spreadsheet, klik **Zakat › Buat akun Admin** (hanya 1× saja)
2. **Izinkan akses:** Sistem akan minta izin akses (Drive, Sheets, etc.). Klik Izinkan
3. **Muat ulang spreadsheet:** Tekan F5
4. Menu **Zakat** sekarang aktif. Klik **Zakat › Impor data lama** untuk import 2024–2026

---

## Jika Ada Error saat Jalankan Setup

- **"Cannot read property of undefined"** → File belum semuanya tercopy. Pastikan urutan copy sesuai.
- **"This app hasn't been verified yet"** → Klik "Advanced" → "Go to [nama project]" → Izinkan
- **"You are not authorized"** → Pastikan akun Google yang dipakai sama dengan akun pemilik sensus BBK02

---

## Troubleshooting

### Apps Script API masih error setelah enable?
- Cek apakah login akun Google yang benar: `clasp login` → pilih akun yang sama
- Tunggu 10–15 menit lebih lama
- Coba di browser incognito

### Muncul error saat simpan isi `.gs` di editor?
- Pastikan nama file `00_Config`, `Util`, `Api` (jangan pakai `.gs`, hanya di local)
- Jangan ada duplicate nama file
- Cek kolom **"error log"** (di atas tombol Deploy)

### Deployment URL berubah setiap kali?
- Ini normal jika baru pertama kali. Setelah pilih "Deploy › New deployment", URL `/exec` akan tetap sama untuk push berikutnya.

---

## Catatan
- Setiap kali ada perubahan kode lokal → jalankan `clasp push` lagi, atau manual copy-paste file yang berubah
- **JANGAN** edit file `.gs` langsung di Google Apps Script editor kalau ingin menjaga history di git. Edit lokal, terus push
