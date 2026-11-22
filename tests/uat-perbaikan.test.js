// Test perbaikan temuan UAT v1.3 (D-29..D-31): getLain, nama per jiwa, cache sensus besar, pemanas cache.
const mock=require('./gas-mock.js'),assert=require('assert');
const log=(...a)=>{ if(process.env.VERBOSE) console.log(...a); };
const g=mock(mock.sensusSS());
g.setupZakat();
g.simpanPengguna_({user:{nama:'Admin Uji',peran:'ADMIN',pin:'111111'}},null);
g.simpanPengguna_({user:{nama:'Pak Ketua',peran:'PENGURUS',pin:'333333'}},null);
const login=pin=>{const r=g.call({action:'login',pin,device:'d'+pin});assert(r.ok,r.error);return r.data.token;};
const admin=login('111111'), peng=login('333333');
let r=g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:'Amil Satu',saham:1,pin:'222222'}}); assert(r.ok,r.error);
const a1=login('222222');
const list=g.call({action:'kkList',token:a1}).data.list.filter(k=>!k.tanpaKK);

// ---------- D-31: ubah mal/fidyah hanya admin ----------
r=g.call({action:'simpanLain',token:a1,jenis:'FIDYAH',nama:'Ibu Fiktif',hari:3,nominal:45000}); assert(r.ok,r.error); const idF=r.data.id;
[a1,peng].forEach(t=>{ const x=g.call({action:'getLain',token:t,id:idF}); assert(!x.ok&&/Akses ditolak/.test(x.error)); });
r=g.call({action:'getLain',token:admin,id:idF}); assert(r.ok,r.error);
assert.strictEqual(r.data.Jenis,'FIDYAH'); assert.strictEqual(r.data.Nominal,45000); assert.strictEqual(typeof r.data.Tahun,'number');
assert(!('_row' in r.data),'tidak mengirim _row');
r=g.call({action:'simpanLain',token:admin,id:idF,tahun:2027,jenis:'FIDYAH',nama:'Ibu Fiktif',hari:4,nominal:60000}); assert(r.ok,r.error);
assert.strictEqual(g.call({action:'getLain',token:admin,id:idF}).data.Nominal,60000);
r=g.call({action:'simpanLain',token:a1,id:idF,tahun:2027,jenis:'FIDYAH',nama:'X',nominal:1}); assert(!r.ok,'amil tidak boleh mengubah');
log('D-31 ok');

// ---------- D-30: nama per jiwa di Data Setoran, bisa dilihat amil ----------
const kk=list.find(k=>k.jiwa>=3);
const jm=kk.anggota.slice(0,2);
r=g.call({action:'simpanFitrah',token:a1,idKeluarga:kk.id,jm:jm.map(a=>a.id),luar:1,luarNama:'Pak Tamu',jenis:'BERAS'}); assert(r.ok,r.error); const idS=r.data.id;
r=g.call({action:'daftarSetoran',token:a1}); assert(r.ok,'amil boleh melihat Data Setoran: '+r.error);
const row=r.data.find(x=>x.id===idS);
assert.deepStrictEqual(row.jiwaNama.slice().sort(),jm.map(a=>a.nama).sort());
assert.strictEqual(row.nama,kk.nama,'nama KK tetap ada untuk keterangan');
assert(/JM luar: Pak Tamu/.test(row.catatan));
log('D-30 ok');

// ---------- D-29: cache sensus dipecah (>100 KB tetap ter-cache) ----------
const c=g.CacheService.getScriptCache();
const besar=JSON.stringify({x:'a'.repeat(250000)});
g.cacheSimpanBesar_(c,'uji_besar',besar,60);
assert.strictEqual(g.cacheAmbilBesar_(c,'uji_besar'),besar,'string 250 KB utuh kembali');
assert.strictEqual(Number(c.get('uji_besar_n')),3);
c.remove('uji_besar_1'); assert.strictEqual(g.cacheAmbilBesar_(c,'uji_besar'),null,'potongan hilang = cache miss, bukan data rusak');
// sensus ter-cache: request berikutnya tidak membuka spreadsheet sensus
let buka=0; const sa=g.SpreadsheetApp, orig=sa.openById; sa.openById=function(id){buka++;return orig(id);};
g.readSensus_(true); const b0=buka;
g.memoReset_(true); g.readSensus_(); g.memoReset_(false);
assert.strictEqual(buka,b0,'sensus dari cache, tidak membuka spreadsheet lagi');
// tombol Muat ulang (segar) membaca ulang sensus
r=g.call({action:'dashboard',token:peng,segar:true}); assert(r.ok,r.error);
assert(buka>b0,'segar memaksa baca ulang sensus');
sa.openById=orig;
log('D-29 sensus ok');

// ---------- pemanas cache: hasil siap di cache dengan kunci yang sama dengan request web ----------
g.hangatkanCache();
const ver=g.versiData_(), th=String(g.tahunAktif_().Tahun);
assert(g.cacheAmbil_(['r','dashboard',ver,th,'',''].join('|')),'dashboard sudah dihangatkan');
assert(g.cacheAmbil_(['r','tren',ver,'','',''].join('|')),'tren sudah dihangatkan');
assert.strictEqual(g.kunciCache_({action:'dashboard',tahun:Number(th)},null),['r','dashboard',ver,th,'',''].join('|'),'kunci pemanas = kunci request web');
console.log('uat-perbaikan: lulus');
