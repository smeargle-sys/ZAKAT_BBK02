// Memindai repo untuk pola data pribadi/asli yang tidak boleh di-commit.
// Lolos = tidak ada temuan. Tambah pola di bawah bila perlu; jangan masukkan data asli ke file ini.
const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const SKIP=new Set(['node_modules','.git','shots']);
const ALLOW_FILES=new Set(['tests/privacy-scan.js']);
const PATTERNS=[
  [/\b(JM|KK)-1\d{12}(_\d+)?\b/,'ID sensus asli (JM-/KK- + timestamp). Pakai ID fixture seperti JM-FIX-1'],
  [/\b(\+62|62|0)8\d{8,11}\b/,'nomor HP'],
  [/[A-Za-z0-9._%+-]+@(gmail|yahoo|hotmail|outlook)\.com/i,'alamat email pribadi'],
  [/script\.google\.com\/macros\/s\/(?!GANTI_DENGAN_ID_DEPLOYMENT)[A-Za-z0-9_-]{20,}/,'URL /exec produksi (simpan hanya di web/config.js saat deploy, bukan di dokumen)'],
  [/\b\d{6}\b(?=.*\b(PIN asli|pin produksi)\b)/i,'PIN produksi']
];
let temuan=[];
(function walk(d){for(const f of fs.readdirSync(d)){if(SKIP.has(f))continue;const p=path.join(d,f),rel=path.relative(root,p).split(path.sep).join('/');
  const st=fs.statSync(p); if(st.isDirectory()){walk(p);continue;}
  if(/\.(xlsx|xls|csv)$/i.test(f)){temuan.push(rel+': file data ('+f+') tidak boleh di-commit');continue;}
  if(!/\.(js|gs|json|md|html|css|py|txt)$/.test(f)||ALLOW_FILES.has(rel))continue;
  const lines=fs.readFileSync(p,'utf8').split('\n');
  lines.forEach((ln,i)=>PATTERNS.forEach(([re,msg])=>{if(re.test(ln)&&!(rel==='web/config.js'&&/script\.google/.test(ln)))temuan.push(rel+':'+(i+1)+': '+msg);}));
}})(root);
if(temuan.length){console.error('privacy-scan: DITEMUKAN pola data pribadi/asli:\n  '+temuan.join('\n  '));process.exit(1);}
console.log('privacy-scan: bersih');
