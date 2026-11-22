---
paths:
  - "apps-script/**"
---
<!-- DIBUAT OTOMATIS dari .kiro/steering/apps-script-standards.md — jangan diedit di sini -->

# Standar Kode Apps Script

## Pola wajib
- **Akses data** selalu lewat helper di `Util.gs`:
  - `readTable_(name)` → `{sh, headers, rows:[{...,_row}]}`
  - `rowsOf_(name, filterFn)`
  - `appendObjects_(name, [obj])` (batch, urutan kolom mengikuti header)
  - `updateObject_(table, rowObj, changes)`
  - Akses kolom pakai **nama header**, bukan indeks angka.
- **Penulisan** dibungkus `withLock_(function () { ... })`. Baca ulang tabel **di dalam** lock sebelum mengecek duplikat.
- **Angka dari sheet/form** di-parse dengan `num_()`. Fungsi ini mengerti `1.234.567`, `1,234,567`, `(100,000)`, dan `-`.
- **Tanggal** memakai `toDateStr_()` (→ `yyyy-MM-dd`) dan `parseDateTime_()`. Waktu sekarang memakai `nowIso_()`. Zona selalu `Asia/Jakarta`.
- **Pembagian persentase** selalu memakai `splitLargestRemainder_()`. Jangan `Math.round` per pos.
- **ID baru** memakai `newId_('PREFIX')`.
- **Aksi penting** dicatat dengan `log_(sess, 'aksi', detail)`. Log tidak boleh membuat aksi gagal.
- **Error** dilempar sebagai `throw new Error('Pesan Bahasa Indonesia yang jelas untuk amil')`. `handle_()` mengubahnya menjadi `{ok:false,error}`. Pesan sesi habis harus persis `'SESI_HABIS'`.

## Menambah action API
```js
// Api.gs → di dalam routes_()
namaAksi: { roles: ['admin'], fn: namaAksi_ },          // roles: null = publik, [] = cukup login
// File domain
function namaAksi_(p, sess) {                              // p = body request, sess = {role,nama,idAmil,key}
  // 1) validasi input (throw Error berbahasa Indonesia)
  // 2) baca config tahun: cfg_(tahun) / tahunAktif_()
  // 3) withLock_ untuk tulis, log_ di akhir
  return { ... };                                          // data polos, bisa di-JSON
}
```
- **Data balikan:** hanya kirim yang dibutuhkan UI. Jangan mengirim `_row`, hash PIN, alamat, atau no HP.
- **Nama route:** camelCase Indonesia (`simpanSerahUB`). Fungsi backend sama, dengan akhiran `_`.

## Gaya
- **Sintaks:** V8 mendukung ES2015+, tetapi kode yang ada memakai gaya ES5 (`var`, `function`). **Tetap konsisten pakai gaya ES5.**
- **Global top-level:** tidak boleh ada kode top-level yang memanggil fungsi dari file lain. Simpan konstanta saja.
- **Ukuran fungsi:** maksimal ±60 baris. Pecah menjadi helper berakhiran `_`.
- **Komentar** dalam Bahasa Indonesia, menjelaskan *kenapa* (aturan zakat), bukan *apa*.

## Performa
- **Satu request = satu kali baca per tabel.** Hindari `rowsOf_` berulang dalam loop.
- **`readSensus_()`** sudah di-cache 5 menit. Pakai `readSensus_(true)` hanya bila perlu data terbaru (impor, tutup tahun).
- **Target waktu:** dashboard < 5 detik untuk ±150 setoran per tahun.

## Wajib setelah mengubah `.gs`
- `npm test` harus lulus.
- Bila menambah aturan baru, tambahkan test di `tests/e2e-api.test.js` (atau buat test baru, lalu daftarkan di `run-all.js`).
- Bila menambah kolom, perbarui `SHEETS`, `data-model.md`, dan bila perlu default di `isiConfigAwal_()`.
