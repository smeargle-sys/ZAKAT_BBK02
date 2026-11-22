#!/usr/bin/env node

/**
 * Generate copy-paste guide untuk manual setup Google Apps Script
 * Gunakan jika clasp push error
 */

const fs = require('fs');
const path = require('path');

const appsScriptDir = path.join(__dirname, '..', 'apps-script');
const gsFiles = [
  '00_Config.gs',
  'Util.gs',
  'Sensus.gs',
  'Auth.gs',
  'Api.gs',
  'Setup.gs',
  'Master.gs',
  'Fitrah.gs',
  'Dashboard.gs',
  'Import.gs',
  'ImportParse.gs',
  'Matcher.gs',
];

console.log('📋 PANDUAN COPY-PASTE GOOGLE APPS SCRIPT\n');
console.log('Urutan file (WAJIB diikuti):\n');

gsFiles.forEach((file, idx) => {
  const filePath = path.join(appsScriptDir, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').length;
    const fileName = file.replace('.gs', '');
    
    console.log(`${idx + 1}. ${fileName} (${lines} baris)`);
    console.log(`   Path: apps-script/${file}`);
    console.log();
  }
});

console.log('\n📌 LANGKAH:\n');
console.log('1. Buka: Spreadsheet ZAKAT BBK02 → Ekstensi › Apps Script');
console.log('2. Hapus file Code.gs yang ada');
console.log('3. Untuk setiap file di atas:');
console.log('   - Klik + → Create new file → .gs');
console.log('   - Beri nama: [nama file tanpa .gs]');
console.log('   - Copy-paste isi dari file lokal');
console.log('   - Tekan Ctrl+S\n');
console.log('4. Setelah semua file selesai:');
console.log('   - Klik Settings (ikon gigi)');
console.log('   - Centang "Show appsscript.json"');
console.log('   - Ganti isinya dengan isi apps-script/appsscript.json\n');
console.log('5. Simpan dan refresh halaman spreadsheet\n');

// Juga generate file teks yang berisi link ke setiap file
const outputFile = path.join(__dirname, '..', 'COPY-PASTE-FILES.txt');
let output = 'FILE UNTUK DICOPY-PASTE KE GOOGLE APPS SCRIPT\n';
output += '==========================================\n\n';

gsFiles.forEach((file, idx) => {
  output += `${idx + 1}. FILE: ${file}\n`;
  output += `   NAMA DI GOOGLE APPS SCRIPT: ${file.replace('.gs', '')}\n`;
  output += `   LOKASI: apps-script/${file}\n\n`;
});

fs.writeFileSync(outputFile, output);
console.log(`✅ Panduan juga disimpan di: COPY-PASTE-FILES.txt`);
