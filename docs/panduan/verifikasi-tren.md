# Task 24 — Verifikasi Tren 2024–2026

**Task:** Verifikasi bahwa Tren menampilkan angka 2024–2026 sesuai tabel di `domain-zakat.md`. Jika ada perbedaan, catat di laporan.

**Status:** Siap dijalankan. Impor sudah selesai, tapi hasil review (task 20) sebaiknya diterapkan dulu.

**Referensi:** 
- Tabel tren yang seharusnya: `.kiro/steering/domain-zakat.md` (tabel paling bawah, "Data historis (impor)")
- Dashboard tren: halaman web → Menu "Tren"
- Backend: `apps-script/Dashboard.gs` fungsi `ringkasTahun_()`

---

## Data yang Perlu Diverifikasi

Dari `domain-zakat.md` tabel "Data historis", nilai yang harus tampil di dashboard Tren:

| Tahun | Hijriah | Harga/soq | Jiwa sensus | Muzakki (JM+SM) | Beras soq / kg | Titip uang | Mal+Tijaroh | Mustahiq | Amil |
|---|---|---|---|---|---|---|---|---|---|
| 2024 | 1445 H | 45.000 | 280 | 294+36=330 | 108 / 291,6 | 222 jiwa · Rp 9.990.000 | Rp 405.867.500 | 95 | 8 |
| 2025 | 1446 H | 40.000 | 269 | 303+37=340 | 171 / 461,7 | 169 jiwa · Rp 6.760.000 | Rp 241.500.000 | 100 | 8 |
| 2026 | 1447 H | 40.000 | 264 | 310+14=324 | 134 / 361,8 | 190 jiwa · Rp 7.600.000 | Rp 266.620.000 | 106 | 9 |

---

## Checklist Verifikasi

### A. Dashboard Tren Tampil

- [ ] Login ke dashboard dengan role Admin
- [ ] Buka halaman **"Tren"** (menu utama)
- [ ] Dashboard menampilkan tabel **"Rekap Tahunan"** dengan tahun 2024–2026 (dan 2027 jika sudah ada)

---

### B. Kolom Tren Verifikasi

Setiap baris tahun di tabel Tren, cek kolom berikut (cocokkan dengan tabel di atas):

**Kolom: Harga / soq**
- 2024: `45.000` ✓ atau catat jika beda
- 2025: `40.000` ✓ atau catat jika beda
- 2026: `40.000` ✓ atau catat jika beda

**Kolom: Jiwa Sensus**
- 2024: `280` ✓ atau catat jika beda
- 2025: `269` ✓ atau catat jika beda
- 2026: `264` ✓ atau catat jika beda

**Kolom: Muzakki JM+SM**
- 2024: `294 + 36 = 330` ✓ (atau ditampil `330` total) atau catat jika beda
- 2025: `303 + 37 = 340` ✓ atau catat jika beda
- 2026: `310 + 14 = 324` ✓ atau catat jika beda

**Kolom: Soq Beras**
- 2024: `108` ✓ atau catat jika beda
- 2025: `171` ✓ atau catat jika beda
- 2026: `134` ✓ atau catat jika beda

**Kolom: Kg Beras** (hitung dari soq × kg/soq)
- 2024: `108 × 2.7 = 291,6` ✓ atau catat jika beda
- 2025: `171 × 2.7 = 461,7` ✓ atau catat jika beda
- 2026: `134 × 2.7 = 361,8` ✓ atau catat jika beda

**Kolom: Titip Uang (Rp)**
- 2024: `Rp 9.990.000` ✓ atau catat jika beda
- 2025: `Rp 6.760.000` ✓ atau catat jika beda
- 2026: `Rp 7.600.000` ✓ atau catat jika beda

**Kolom: Mal + Tijaroh (Rp)**
- 2024: `Rp 405.867.500` ✓ atau catat jika beda
- 2025: `Rp 241.500.000` ✓ atau catat jika beda
- 2026: `Rp 266.620.000` ✓ atau catat jika beda

**Kolom: Mustahiq (orang)**
- 2024: `95` ✓ atau catat jika beda
- 2025: `100` ✓ atau catat jika beda
- 2026: `106` ✓ atau catat jika beda

**Kolom: Amil (orang)**
- 2024: `8` ✓ atau catat jika beda
- 2025: `8` ✓ atau catat jika beda
- 2026: `9` ✓ atau catat jika beda

---

### C. Export CSV Tren

- [ ] Buka halaman Tren
- [ ] Klik tombol **"Ekspor CSV"**
- [ ] File `tren-zakat.csv` terdownload
- [ ] Buka di Excel/Sheets, verifikasi:
  - Kolom header ada: Tahun, Harga, Jiwa Sensus, Muzakki, Beras (soq), Beras (kg), dll
  - Data cocok dengan tabel di dashboard

---

### D. Pembagian Fitrah & Mal (Optional verifikasi detail)

Jika ingin verifikasi pembagian lebih detail, cek di halaman Dashboard:

**Fitrah (pembagian soq):**
- Verifikasi rumus di `domain-zakat.md` tabel "Pembagian Zakat Fitrah":
  - Sabilillah Daerah 40%
  - Mustahiq 45%
  - Amil Klp 11%
  - Amil Desa 3%
  - Amil Daerah 1%
  - Total = 100% (tidak boleh kurang/lebih)

**Contoh 2026:** 324 soq dibagi:
- 40% = 129.6 → pembulatan sisa terbesar = `130` soq
- 45% = 145.8 → pembulatan = `146` soq
- 11% = 35.64 → pembulatan = `36` soq
- 3% = 9.72 → pembulatan = `10` soq
- 1% = 3.24 → pembulatan = `2` soq
- **Total = 130 + 146 + 36 + 10 + 2 = 324 ✓**

(Sheet lama salah: 130 + 146 + 36 + 10 + 3 = 325 ✗)

---

## Jika Ada Perbedaan

Jika nilai tidak cocok dengan tabel, catat di laporan **`docs/handoff/YYYY-MM-DD-laporan-verifikasi-tren.md`** dengan format:

```markdown
# Task 24 — Tren Verification Report

**Tanggal:** YYYY-MM-DD  
**Verifier:** [nama]

## Hasil Verifikasi

### ✓ Cocok (tidak ada gap)
- 2024, 2025 semua kolom match
- CSV export berfungsi

### ✗ Perbedaan Ditemukan
1. **Tahun 2026 — Kolom Mal+Tijaroh:**
   - Expected: Rp 266.620.000
   - Actual: Rp 266.620.001
   - Gap: Rp 1
   - Action: **LAPORKAN ke konsultan.** Total mal adalah penjumlahan biasa tanpa pembulatan, jadi angkanya harus persis sama. Selisih sekecil apa pun berarti ada setoran yang terlewat atau ganda.

2. **Tahun 2024 — Kolom Muzakki JM:**
   - Expected: 294
   - Actual: 295
   - Gap: 1 jiwa
   - Action: **INVESTIGATE** (mungkin ada jiwa baru di sensus atau impor yang double)

---

## Konklusi
- Tren 2025–2026 ✓ Cocok
- Tren 2024 ⚠️ Perlu cek detail JM → handoff ke konsultan (skill `consultant-handoff`)
- **Status:** UAT boleh jalan paralel. Perbedaan angka historis tidak menghalangi input 2027.
```

---

## Catatan Teknis

### Bagaimana Tren Dihitung?

1. **Backend** (`apps-script/Dashboard.gs`):
   - Fungsi `ringkasTahun_(tahun)` mengagregasi data dari:
     - `Setoran_Fitrah` → soq beras, uang titip, muzakki count
     - `Zakat_Lain` → mal, tijaroh, fidyah
     - `Config_Tahun` → harga, kg/soq, jiwa sensus snapshot
   - Pembagian fitrah & mal memakai `splitLargestRemainder_()` untuk pembulatan
   - Hasil disimpan di cache 5 menit

2. **Frontend** (`web/app3.js`):
   - `api('tren')` call ke backend
   - `renderTren()` tampilkan tabel HTML
   - `trenCsv()` export ke CSV format

3. **Data Source**:
   - Tahun 2024–2026 dari **impor** (file lama)
   - Tahun 2027 dari **input aplikasi** (live input)

---

## Troubleshooting

**Q: Tren tidak tampil / blank**
- A: Periksa apakah impor 2024–2026 sudah selesai (cek `Impor_Log` sheet)
- Jika belum ada data, tampilan "Belum ada data" adalah benar

**Q: Angka tidak match, tapi sudah cek manual?**
- A: Bisa jadi ada:
  - Duplikat data di sheet (data impor dicatat 2×)
  - Soft delete yang tidak terhitung (cek kolom `Dihapus`)
  - Format angka yang tidak parse (mis. `1.250.000` vs `1,250,000`)
  - Silakan screenshot dan laporkan untuk debug

**Q: Pembulatan pembagian tidak match?**
- A: Verifikasi fungsi `splitLargestRemainder_()` di `apps-script/Util.gs`
- Jika ada bug, laporkan dan Kiro fix sebelum go-live

---

## Kapan Task 24 Dianggap Selesai?

✅ **Selesai jika:**
- Semua kolom Tren 2024–2026 cocok dengan tabel (atau perbedaan < 0.1%, diterima)
- CSV export berfungsi dan data match
- Pembulatan pembagian fitrah = 100% soq

❌ **Perlu investigasi jika:**
- Perbedaan > 0.5%
- Pembulatan pembagian ≠ total soq
- Ada error saat akses halaman Tren

Catat di laporan, lalu:
- Jika adalah bug kode → Kiro fix
- Jika adalah data impor keliru → Kiro bantu debug impor

