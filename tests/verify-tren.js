#!/usr/bin/env node

/**
 * Task 24: Verifikasi Tren 2024–2026
 * 
 * Script ini membantu cek apakah dashboard menampilkan angka tren yang sesuai
 * dengan tabel expected values dari domain-zakat.md
 * 
 * Jalankan setelah impor 2024–2026 selesai di spreadsheet:
 *   npm run verify-tren
 */

'use strict';

// Expected values dari domain-zakat.md
const expected = {
  2024: {
    tahun: 2024,
    hijriah: '1445 H',
    hargaSoq: 45000,
    jiwaSensus: 280,
    muzakkiJM: 294,
    muzakkiSM: 36,
    muzakkiTotal: 330,
    beasSoq: 108,
    berasKg: 291.6,
    titipUangRp: 9990000,
    malTotal: 405867500,
    mustahiq: 95,
    amil: 8
  },
  2025: {
    tahun: 2025,
    hijriah: '1446 H',
    hargaSoq: 40000,
    jiwaSensus: 269,
    muzakkiJM: 303,
    muzakkiSM: 37,
    muzakkiTotal: 340,
    beasSoq: 171,
    berasKg: 461.7,
    titipUangRp: 6760000,
    malTotal: 241500000,
    mustahiq: 100,
    amil: 8
  },
  2026: {
    tahun: 2026,
    hijriah: '1447 H',
    hargaSoq: 40000,
    jiwaSensus: 264,
    muzakkiJM: 310,
    muzakkiSM: 14,
    muzakkiTotal: 324,
    beasSoq: 134,
    berasKg: 361.8,
    titipUangRp: 7600000,
    malTotal: 266620000,
    mustahiq: 106,
    amil: 9
  }
};

// Fungsi helper untuk format angka Indonesia
const rp = (num) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0
}).format(num);

const kg = (num) => num.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// Fungsi untuk cek tolerance (perbedaan %)
const checkTolerance = (actual, expected, name, tolerance = 0.001) => {
  if (actual === null || actual === undefined) {
    return { status: '❌', message: `${name}: NOT FOUND` };
  }
  
  const diff = Math.abs(actual - expected);
  const pct = Math.abs(diff / expected);
  
  if (pct <= tolerance) {
    return { status: '✓', message: `${name}: ${actual} (expected ${expected})` };
  } else {
    return { status: '⚠️', message: `${name}: ${actual} (expected ${expected}, diff: ${pct.toFixed(2)}%)` };
  }
};

console.log('\n📊 TASK 24 — TREN VERIFICATION');
console.log('=' .repeat(70));
console.log('Expected values dari: .kiro/steering/domain-zakat.md\n');

// Instruksi
console.log('📋 LANGKAH VERIFIKASI:');
console.log('1. Buka dashboard di http://localhost:8787 atau production URL');
console.log('2. Login dengan role Admin');
console.log('3. Buka halaman "Tren"');
console.log('4. Lihat tabel "Rekap Tahunan" untuk tahun 2024–2026');
console.log('5. Cocokkan setiap kolom dengan nilai yang diharapkan di bawah:\n');

console.log('=' .repeat(70));

// Tampilkan expected values
Object.entries(expected).forEach(([year, data]) => {
  console.log(`\n📅 TAHUN ${year} (${data.hijriah})`);
  console.log('-' .repeat(70));
  console.log(`
Expected values yang harus tampil di dashboard:
  Harga / soq:              ${rp(data.hargaSoq)}
  Jiwa Sensus:              ${data.jiwaSensus} jiwa
  Muzakki JM:               ${data.muzakkiJM} orang
  Muzakki SM:               ${data.muzakkiSM} orang
  Muzakki Total:            ${data.muzakkiTotal} orang
  Soq Beras:                ${data.beasSoq} soq
  Kg Beras:                 ${kg(data.berasKg)} kg
  Titip Uang:               ${rp(data.titipUangRp)}
  Mal + Tijaroh:            ${rp(data.malTotal)}
  Mustahiq:                 ${data.mustahiq} orang
  Amil:                     ${data.amil} orang
`);
});

console.log('=' .repeat(70));
console.log('\n✅ CARA CEK DI DASHBOARD:');
console.log(`
1. Halaman Tren → Table "Rekap Tahunan"
   - Baca row 2024, 2025, 2026 (dari kiri ke kanan)
   - Cocokkan setiap kolom dengan nilai expected di atas
   
2. Format Angka di Dashboard:
   - Rupiah: Rp 1.250.000 (pakai titik separator)
   - Kg: 291,6 (pakai koma 1 desimal)
   - Orang: 95 (tidak ada desimal)
   
3. Toleransi Diterima:
   - Perbedaan < 0.1% (pembulatan)
   - Contoh: Rp 9.990.000 ± Rp 10.000 ✓ ACCEPTABLE
   - Contoh: 291,6 kg vs 291,61 kg ✓ ACCEPTABLE
   
4. Jika Ada Perbedaan:
   - Screenshot halaman tren
   - Catat di: docs/handoff/YYYY-MM-DD-task-24-report.md
   - Laporkan dengan format:
     * Tahun: 2026
     * Kolom: Mal + Tijaroh
     * Expected: Rp 266.620.000
     * Actual: Rp 266.620.001
     * Gap: Rp 1 (pembulatan, acceptable)
`);

console.log('=' .repeat(70));
console.log('\n📌 CATATAN PENTING:');
console.log(`
- Test ini adalah MANUAL verification (tidak automated)
- Karena nilai tren bergantung pada impor data di spreadsheet asli
- Simulasi test sudah lulus (lihat: npm test → e2e-import: lulus)
- Setelah impor di production spreadsheet, baru bisa verify via dashboard

- Jika ada gap:
  ✓ Gap < 0.1% (pembulatan) = ACCEPTABLE
  ⚠️ Gap 0.1–1% = INVESTIGATE (bisa data/rumus salah)
  ❌ Gap > 1% = MUST FIX (bug atau data impor keliru)
`);

console.log('=' .repeat(70));
console.log('\n✅ Checklist sebelum lanjut ke UAT Fase 3:\n');
console.log('  [ ] Tren 2024 — semua kolom ✓');
console.log('  [ ] Tren 2025 — semua kolom ✓');
console.log('  [ ] Tren 2026 — semua kolom ✓');
console.log('  [ ] CSV export — download & cek cocok');
console.log('  [ ] Laporan disimpan (jika ada gap)\n');

console.log('=' .repeat(70));
