// Jalankan semua test: node tests/run-all.js  (atau npm test). Tambah VERBOSE=1 untuk detail.
const cp=require('child_process'),path=require('path');
const files=['privacy-scan.js','check-syntax.js','unit-parse.test.js','e2e-api.test.js','e2e-import.test.js','pra-ramadhan.test.js','teks-progres.test.js','uat-perbaikan.test.js','mustahiq.test.js','konsistensi.test.js','lain-ganda.test.js'];
let gagal=0;
files.forEach(f=>{try{cp.execFileSync(process.execPath,[path.join(__dirname,f)],{stdio:'inherit',env:process.env});}catch(e){gagal++;console.error('GAGAL: '+f);}});
if(gagal){console.error(gagal+' test gagal');process.exit(1);} console.log('SEMUA TEST LULUS');
