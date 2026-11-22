---
name: zakat-test-verify
description: Menjalankan dan menulis test aplikasi Zakat BBK02 — npm test (simulasi Apps Script di Node), dev server lokal dengan data sensus sintetis, smoke test UI Playwright, serta golden test perhitungan zakat (pembagian 40/45/15, pembulatan, UB, kurang bayar). Gunakan sebelum menandai task selesai, saat debugging, atau saat menambah test.
metadata:
  project: zakat-bbk02
---

# Verifikasi & pengujian

## Rutin setiap selesai mengubah kode
1. `npm test` → harus berakhir `SEMUA TEST LULUS`. Jika gagal, jalankan lagi dengan `VERBOSE=1 npm test` untuk melihat angka.
2. Jika mengubah `web/`:
   - Jalankan `npm run dev`, lalu buka http://localhost:8787.
     - PIN uji: admin `111111`, pengurus `333333`, amil `222222` / `222223` / `222224`.
     - Coba alur yang diubah di lebar 390 px (HP) dan 1440 px.
   - Bila Playwright tersedia, jalankan `npm run ui` (set `CHROME=/path/chrome` bila perlu). Hasilnya tidak boleh ada error JS. Screenshot ada di `tests/shots/`.

## Menulis test baru
- **Setup:** `const mock=require('./gas-mock.js'); const g=mock(mock.sensusSS());`, lalu `g.setupZakat();`.
- **Membuat akun:** `g.simpanPengguna_({user:{nama:'Admin Uji',peran:'ADMIN',pin:'111111'}},null)`, lalu `g.call({action:'login',pin:'111111',device:'x'})`.
- **Amil + PIN:** `g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:'…',saham:1,pin:'222222'}})`.
- **Menguji batas waktu:** ubah `Config_Tahun.Batas_Fitrah` lewat `g.updateObject_(g.readTable_('Config_Tahun'), row, {...})`.
- **Golden test** (angka resmi, jangan diubah):
  - `splitLargestRemainder_(324, 40/45/11/3/1)` = 129/146/36/10/3.
  - `splitLargestRemainder_(266620000, 40/45/8/4/3)` = 106.648.000/119.979.000/21.329.600/10.664.800/7.998.600.
- Gunakan **nama fiktif saja**.

## Debugging umum
| Gejala di test | Cek |
|---|---|
| `X is not defined` saat memuat .gs | ada kode top-level yang memanggil fungsi file lain. Pindahkan ke dalam fungsi |
| total pembagian tidak pas | ada `Math.round` per pos. Ganti dengan `splitLargestRemainder_` |
| duplikat jiwa lolos | cek duplikat harus di dalam `withLock_` dan membaca `Setoran_Fitrah_Jiwa` terbaru |
| tanggal bergeser 1 hari | simpan sebagai teks `yyyy-MM-dd` dan pakai `toDateStr_`, bukan `new Date()` mentah |
