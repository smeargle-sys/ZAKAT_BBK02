---
paths:
  - "tests/**"
  - "apps-script/**"
  - "package.json"
---
<!-- DIBUAT OTOMATIS dari .kiro/steering/testing-standards.md — jangan diedit di sini -->

# Standar Pengujian

## Perintah
| Perintah | Isi |
|---|---|
| `npm test` | check-syntax + unit-parse + e2e-api + e2e-import. **Wajib lulus sebelum tugas dianggap selesai** |
| `npm run check` | sintaks semua `web/*.js` + memuat semua `.gs` (juga dalam urutan terbalik) |
| `npm run dev` | server lokal http://localhost:8787 dengan backend simulasi + data sintetis |
| `npm run ui` | smoke test Playwright (opsional): login amil, simpan fitrah, buka semua halaman admin. Gagal bila ada error JS |
| `VERBOSE=1 npm test` | tampilkan detail angka |

## Cara kerja simulasi
`tests/gas-mock.js` meniru `SpreadsheetApp` (sheet di memori), `CacheService`, `PropertiesService`, `LockService`, `ContentService`, dan `Utilities` (SHA-256, UUID), lalu memuat **semua** file `.gs` seperti di Apps Script.
- **Panggil API:** `g.call({action:'...', token, ...})`, persis seperti body POST frontend.
- **Panggil fungsi internal:** langsung, misalnya `g.simpanPengguna_(...)`.
- **Data sensus:** dari `tests/fixtures/sensus-fixture.js` (sintetis, deterministik). Untuk sensus custom, buat `mock.makeSS([...])`.

## Yang wajib dites saat menambah/mengubah fitur
- **Jalur sukses dan jalur ditolak:** peran salah, validasi gagal, batas waktu.
- **Invarian di `data-model.md`** yang tersentuh, terutama total pembagian = total diterima.
- **Perhitungan uang/soq:** pakai angka contoh nyata dari `domain-zakat.md` (contoh 324 soq dan Rp 266.620.000) sebagai golden test.
- **Impor:** setiap cek di `Impor_Log` harus `SAMA`, dan impor ulang tidak boleh menggandakan data.

## Aturan data uji
- **Hanya nama fiktif.** Jangan pernah menyalin data jamaah asli ke test, fixture, atau screenshot.
- **Screenshot `tests/shots/`** di-gitignore.

## Uji di lingkungan asli (sebelum go-live)
Pakai checklist UAT di `.kiro/specs/zakat-mvp/tasks.md` (Fase 3), dengan spreadsheet asli dan HP amil. Hasil UAT dilaporkan ke konsultan.
