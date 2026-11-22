// Golden test teks "Bagikan progres" (D-26). Memuat web/app3.js dengan window.__Z tiruan, tanpa DOM.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const log=(...a)=>{ if(process.env.VERBOSE) console.log(...a); };
const Z={$:()=>null,$$:()=>[],esc:s=>String(s),rp:x=>'Rp '+x,rpShort:x=>x,nf:x=>String(x),kgf:x=>String(x),pct:x=>x,ICON:{},S:{},api:()=>Promise.resolve(),ACT:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../web/app3.js'),'utf8'),{window:{__Z:Z},document:{},navigator:{},console});
const teks=Z.teksProgres;
assert.strictEqual(typeof teks,'function');

const base={kkTotal:120,kkSudah:98,kkSebagian:7,jiwaTotal:264,jiwaSudah:231,kkHariIni:12,jiwaHariIni:37,tanggal:'2027-03-06',hMinus:4,batasFitrah:'2027-03-10 06:00',batasLewat:false};
const t=teks(base,'1448 H','Kelompok Babakan Barat');
log(t);
assert.strictEqual(t,[
  '*Progres Zakat Fitrah 1448 H*',
  'Kelompok Babakan Barat',
  'Sabtu, 6 Maret 2027 · H-4',
  '',
  'KK sudah zakat: 98 dari 120 (81%)',
  '▓▓▓▓▓▓▓▓░░',
  'Jiwa sudah zakat: 231 dari 264 (87%)',
  '▓▓▓▓▓▓▓▓░░',
  '',
  'Hari ini bertambah 12 KK · 37 jiwa.',
  'Batas zakat fitrah: Rabu, 10 Maret 2027 pukul 06.00 (sebelum shalat Ied).',
  'Bagi yang belum, silakan menghubungi amil.'
].join('\n'));

// tanpa nominal, tanpa emoji
assert(!/Rp|\d\.\d{3}/.test(t),'tidak boleh ada nominal');
assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(t),'tidak boleh ada emoji');

// 100% hanya bila benar-benar semua; 99,6% dibulatkan ke bawah
let x=teks(Object.assign({},base,{kkSudah:120,jiwaSudah:263}),'1448 H','K');
assert(/KK sudah zakat: 120 dari 120 \(100%\)\n▓{10}\n/.test(x));
assert(/Jiwa sudah zakat: 263 dari 264 \(99%\)\n▓{9}░\n/.test(x));

// hari ini tidak bertambah → baris dihilangkan; hanya jiwa → tanpa KK
x=teks(Object.assign({},base,{kkHariIni:0,jiwaHariIni:0}),'1448 H','K');
assert(!/Hari ini/.test(x)); assert(!/\n\n\n/.test(x));
x=teks(Object.assign({},base,{kkHariIni:0,jiwaHariIni:3}),'1448 H','K');
assert(/Hari ini bertambah 3 jiwa\./.test(x));

// Hari H & batas lewat
x=teks(Object.assign({},base,{hMinus:0,tanggal:'2027-03-10',batasLewat:true}),'1448 H','K');
assert(/Rabu, 10 Maret 2027 · Hari H/.test(x));
assert(/sudah ditutup\. Jazakumullahu khoiro\.$/.test(x)); assert(!/Batas zakat fitrah/.test(x));
// setelah hari raya (hMinus negatif) & total 0 tidak crash
x=teks(Object.assign({},base,{hMinus:-2,kkTotal:0,kkSudah:0}),'1448 H','K');
assert(/Sabtu, 6 Maret 2027\n/.test(x)); assert(/0 dari 0 \(0%\)\n░{10}/.test(x));
console.log('teks-progres: lulus');
