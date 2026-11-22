---
inclusion: always
---

# Keamanan & Privasi

## Data pribadi
- **Isi data sensus:** nama, tahun lahir, keberadaan, status "Perlu Dibantu" (indikasi mustahiq), alamat, dan no HP. Semua ini **data pribadi jamaah**.
- **Repo bersih dari data asli:** repo, test, screenshot, log, dan contoh di dokumen **tidak boleh** berisi data jamaah asli. Untuk test, pakai `tests/fixtures/sensus-fixture.js` (sintetis) dan nama fiktif.
- **Yang tidak dikirim ke frontend:**
  - Alamat dan no HP: tidak dikirim, kecuali memang diperlukan form admin.
  - Status mustahiq/"Perlu Dibantu": jangan ditampilkan ke Amil/Pengurus kecuali ada keputusan desain. Ini wilayah backlog mustahiq.
- **Repo publik:** repo boleh publik (GitHub Pages gratis), karena ID spreadsheet tidak memberi akses tanpa izin Google. Tetap jangan menaruh URL `/exec` bersama PIN di mana pun.

## Autentikasi
- **PIN pribadi 6 digit.** Nama dan peran dikenali dari PIN, sehingga **PIN wajib unik** di antara semua akun aktif (Pengguna + Amil tahun aktif).
- **Penyimpanan PIN:** hanya hash `SHA-256(salt + ':' + pin)`. Salt ada di Script Properties `PIN_SALT`. Jangan pernah mengembalikan hash ke frontend. Cukup flag `punyaPin`.
- **Penguncian:** 5 kali salah per device → kunci 15 menit. Lebih dari 40 kali salah global dalam 15 menit → kunci global. Sesi 6 jam.
- **Admin minimal:** harus selalu ada ≥1 Admin aktif yang punya PIN.
- **Peran dicek di backend** lewat `routes_()`. Pemeriksaan di frontend hanya untuk tampilan, bukan keamanan.
- **Amil:** hanya boleh mengubah setoran yang ia terima sendiri. Hapus hanya untuk Admin.

## Integritas data
- **Hapus = soft delete** (`Dihapus = Y`) dan tercatat di sheet `Log`.
- **Penulisan:** semua penulisan memakai `withLock_()`.
- **Validasi** ada di backend: persentase = 100, jiwa tidak dobel, batas fitrah, nominal > 0.
- **Impor** hanya mengganti baris `Sumber = IMPOR` tahun yang sama, dan tidak menyentuh data dari aplikasi.

## Frontend
- **Escape:** semua data dinamis di-escape dengan `esc()` sebelum masuk HTML.
- **Penyimpanan lokal:** hanya token, peran, nama, dan ID device di `localStorage`, tanpa data setoran.
- **Tanpa pihak ketiga:** tidak ada analytics atau script pihak ketiga selain Google Fonts.
