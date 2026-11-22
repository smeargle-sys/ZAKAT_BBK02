# Zakat BBK02 — Aplikasi Pencatatan & Dashboard Zakat Idul Fitri

Aplikasi Google Apps Script + halaman web (GitHub Pages) untuk mencatat **Zakat Fitrah, Zakat Mal, Tijaroh, dan Fidyah**. Data KK dan jamaah **dibaca langsung dari SENSUS BBK02**, tidak disalin. Polanya sama dengan aplikasi sensus dan absensi.

```
apps-script/   → kode backend (tempel ke Apps Script yang menempel di spreadsheet ZAKAT BBK02)
web/           → halaman web (GitHub Pages), isi config.js dengan URL Web App
tests/         → test Node tanpa dependency (simulasi Apps Script + data sensus sintetis)
docs/          → keputusan (decisions), backlog, mockup, handoff ke konsultan
docs/panduan/  → panduan langkah demi langkah untuk pemilik (setup, go-live, verifikasi tren, UAT)
index.html     → hanya mengalihkan ke web/ (GitHub Pages menyajikan root branch main)
.kiro/         → steering, skills, specs, hooks untuk Kiro
```

## Bekerja dengan Kiro
- **Pembagian peran:** Kiro adalah **implementer**. Konsultan (Claude) memegang aturan zakat, desain UX, model data, dan backlog. Aturannya ada di `.kiro/steering/roles-and-governance.md`.
- **Mulai kerja:** buka repo di Kiro, lalu jalankan task dari `.kiro/specs/zakat-mvp/tasks.md` (Fase 2 go-live).
- **Steering otomatis:** product, domain-zakat, tech, structure, roles, dan security selalu dimuat. Standar kode/UI/test dimuat sesuai file yang disentuh. `#release-runbook` dimuat manual.
- **Skills:**
  - `zakat-feature-apps-script` — fitur baru
  - `zakat-test-verify` — test
  - `zakat-deploy-release` — rilis
  - `zakat-import-data` — impor
  - `zakat-ui-screen` — layar
  - `consultant-handoff` — minta keputusan/desain
- **Hooks:** test otomatis saat `.gs` disimpan, cek sintaks web, pemindai privasi, cek wewenang saat spec/skema berubah, dan test akhir saat agent selesai.
- **Kembali ke konsultan:** pakai `docs/konteks-untuk-konsultan.md` + file di `docs/handoff/`.

```bash
npm test        # semua test (wajib lulus)
npm run dev     # coba UI di http://localhost:8787 (PIN uji: admin 111111, pengurus 333333, amil 222222)
npm run ui      # smoke test Playwright (opsional)
```

## Fitur MVP
- **Login dengan PIN pribadi**: tiap Admin, Pengurus, dan Amil punya PIN sendiri, dan nama serta aksesnya **dikenali langsung dari PIN** (tanpa memilih nama). PIN Admin/Pengurus diatur di *Konfigurasi › Pengguna*, PIN amil di *Konfigurasi › Amil*. PIN wajib unik, dan PIN amil ikut terbawa saat membuat tahun baru. 5 kali salah dikunci 15 menit, sesi 6 jam.
- **Input amil (HP):** daftar KK dari sensus dengan status Belum / Sebagian / Sudah / Kurang bayar.
  - **Zakat fitrah:** centang anggota (yang Mondok/Kerja Luar ikut dihitung), simpatisan yang terkait KK, dan JM luar. Pilih jenis Beras / Titip uang / Di kampung.
  - **Pembayaran:** wajib bayar dihitung otomatis. Lebih bayar defaultnya masuk **Usaha Bersama (UB)** atau bisa dikembalikan. Kurang bayar ditandai sampai lunas.
  - Satu jiwa tidak bisa dizakati dua kali dalam setahun.
  - **Batas zakat fitrah:** setelah batas (sebelum shalat Ied) form fitrah terkunci untuk amil. Admin hanya bisa mencatat susulan administrasi dengan tanggal setor ≤ batas.
- **Zakat Mal / Tijaroh / Mal+Tijaroh / Fidyah.** Setoran mal setelah tanggal tutup rekap otomatis menjadi **SUSULAN** dan dibagi di lampiran tersendiri. Fidyah tidak ikut pembagian 40/45/15.
- **Dashboard Pemantauan:**
  - Progres jiwa sensus, setoran harian, beras vs uang, dan pembelian beras dari titipan.
  - Perolehan per amil.
  - Pembagian fitrah (pembulatan otomatis, total selalu pas) dan pembagian mal (setor Desa/Daerah).
  - **Bagian amil:** hitungan per saham ditampilkan sebagai acuan, angka final diisi admin sesuai musyawarah, dan sisanya terlihat.
  - **UB:** terkumpul, sudah diserahkan, masih di amil.
  - Daftar KK yang belum setor.
- **Tren Tahunan (YoY):** 2024–2026 dari data lama, selanjutnya dari aplikasi. Bisa diekspor CSV.
- **Konfigurasi per tahun:** harga/soq, kg/soq, tarif fidyah, tanggal Idul Fitri, batas fitrah, tutup rekap mal, persentase pembagian, amil + saham + PIN, master simpatisan (boleh terkait KK sensus), dan pengguna Admin/Pengurus (nama + PIN).

## Struktur data (satu spreadsheet untuk semua tahun)
Setiap baris punya kolom **Tahun**, jadi tidak perlu file atau sheet baru tiap tahun. Tahun baru cukup dibuat lewat tombol *Tahun baru*.

| Sheet | Isi |
|---|---|
| Config_Tahun | 1 baris per tahun: harga, batas waktu, persentase, status BUKA/TUTUP, snapshot jiwa sensus |
| Amil | daftar amil per tahun + saham + PIN login (hash) |
| Pengguna | akun Admin & Pengurus: nama, peran, PIN (hash), aktif |
| Simpatisan | master simpatisan (lintas tahun), boleh terkait ID Keluarga sensus |
| Setoran_Fitrah | 1 baris per setoran (KK/simpatisan), jumlah jiwa, uang, selisih, tujuan lebih bayar |
| Setoran_Fitrah_Jiwa | rincian siapa saja yang dizakati (ID Jamaah / ID Simpatisan) |
| Zakat_Lain | zakat mal, tijaroh, campuran, fidyah (+ lampiran UTAMA/SUSULAN) |
| Pembelian_Beras, Serah_UB, Bagian_Amil | pembelian beras dari titipan, serah terima UB, angka final bagian amil |
| Impor_Review, Impor_Log | hasil pencocokan nama impor & cek total vs rekap sheet lama |
| Log | jejak aktivitas (siapa menyimpan / mengubah / menghapus) |

Data yang dihapus tidak benar-benar dibuang, tetapi diberi tanda `Dihapus = Y`.

## Langkah pemasangan

1. **Buat spreadsheet baru** bernama `ZAKAT BBK02` di akun yang sama dengan absensi. Akun ini harus bisa membuka SENSUS BBK02 Dashboard.
2. Buka **Ekstensi › Apps Script**:
   - Di *Project Settings*, centang **Show "appsscript.json"**, lalu ganti isinya dengan `apps-script/appsscript.json`. Isi ini juga mengaktifkan Drive API untuk impor.
   - Buat file `.gs` dengan nama yang sama seperti di folder `apps-script/`, lalu tempel isinya.
3. Jalankan fungsi **`setupZakat`** sekali, lalu izinkan akses. Muat ulang spreadsheet sampai menu **Zakat** muncul.
4. **Zakat › Buat akun Admin:** isi nama dan PIN 6 digit untuk admin pertama. Pengguna lain dan PIN tiap amil diatur dari halaman Konfigurasi.
5. **Zakat › Impor data lama 2024–2026**, lalu cek hasilnya:
   - **Impor_Log:** semua baris harus `SAMA` dengan rekap di sheet lama.
   - **Impor_Review:** daftar nama yang belum cocok ke sensus.
     - Isi `Pilih_ID_Keluarga` (salin dari sheet Keluarga di sensus), **atau**
     - isi `Jadikan_SM` = `Y` untuk simpatisan.
   - Setelah itu jalankan **Zakat › Terapkan hasil review impor**.
6. **Deploy › New deployment › Web app**: *Execute as* = Me, *Who has access* = Anyone. Salin URL `/exec`.
7. Isi URL tersebut ke `web/config.js`, lalu push ke GitHub dan aktifkan GitHub Pages dengan **branch `main`, folder root**. `index.html` di root otomatis mengalihkan ke `web/`.
8. Buka halaman web dan login dengan PIN Admin. Di **Konfigurasi**:
   - Cek tahun 1448 H / 2027: tanggal Idul Fitri, batas fitrah, harga titip, dan tarif fidyah. Tanggal 2027 masih perkiraan.
   - Tambahkan **amil 2027** beserta **PIN masing-masing**. Amil hasil impor 2026 belum punya PIN, jadi isi lewat tombol *Ubah*.
   - Tambahkan **Pengurus** (dan admin lain bila perlu) di bagian *Pengguna Admin & Pengurus*.

### Memperbarui kode
Edit file di Apps Script, lalu buka **Deploy › Manage deployments › Edit › Version: New version**. URL `/exec` tetap sama.

## Catatan
- **PIN** disimpan sebagai hash (tidak bisa dibaca dari spreadsheet). Kalau ada yang lupa PIN, admin cukup mengisi PIN baru di tombol *Ubah*.
- **Jiwa sensus:** dihitung dari semua baris di tab Jamaah, termasuk yang Mondok, Kerja Luar, dan sebagainya.
- **Jamaah tanpa ID Keluarga:** jamaah yang ID Keluarga-nya kosong di sensus tampil sebagai "keluarga" sendiri, supaya tetap bisa dizakati. Sebaiknya ID Keluarga-nya dilengkapi di aplikasi sensus.
- **Backlog (setelah MVP):** daftar mustahiq per tahun (dari kolom *Perlu Dibantu* + asnaf), pembagian 45% per jiwa/saham, cetak daftar penerimaan mustahiq, dan penyaluran Sabilillah kelompok (anak pondok, MS, sodaqoh sekolah).
