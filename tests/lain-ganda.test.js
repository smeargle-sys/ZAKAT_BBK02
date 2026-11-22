// Test pencegahan input ganda zakat mal/tijaroh/campuran/fidyah (D-47). Data sintetis.
const mock=require('./gas-mock.js'),assert=require('assert');
const g=mock(mock.sensusSS()); g.setupZakat();
g.simpanPengguna_({user:{nama:'Admin Uji',peran:'ADMIN',pin:'111111'}},null);
const login=pin=>{const r=g.call({action:'login',pin,device:'d'+pin});assert(r.ok,r.error);return r.data.token;};
const admin=login('111111');
let r=g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:'Amil Satu',saham:1,pin:'222222'}}); assert(r.ok,r.error);
r=g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:'Amil Dua',saham:1,pin:'555555'}}); assert(r.ok,r.error);
const a1=login('222222'), a2=login('555555');
const j=g.readSensus_().jamaah[3];

// amil 1 mencatat zakat mal jamaah (dipilih dari sensus)
r=g.call({action:'simpanLain',token:a1,jenis:'MAL',nama:j.nama,refTipe:'JM',refId:j.id,nominal:5000000}); assert(r.ok,r.error);
// info di form untuk petugas lain
r=g.call({action:'cekLain',token:a2,refId:j.id,nama:j.nama}); assert(r.ok,r.error);
assert.strictEqual(r.data.length,1); assert.strictEqual(r.data[0].jenis,'MAL'); assert.strictEqual(r.data[0].amil,'Amil Satu'); assert.strictEqual(r.data[0].dicatat,'Amil Satu');
// amil 2 mencatat jenis yang sama → ditolak dengan kode GANDA (perlu konfirmasi)
r=g.call({action:'simpanLain',token:a2,jenis:'MAL',nama:j.nama,refTipe:'JM',refId:j.id,nominal:5000000});
assert(!r.ok&&/^GANDA:/.test(r.error)&&/Zakat Mal/.test(r.error)&&/Rp 5\.000\.000/.test(r.error),r.error);
// nama diketik manual (tanpa memilih dari sensus), huruf/spasi berbeda → tetap tertangkap
r=g.call({action:'simpanLain',token:a2,jenis:'MAL',nama:'  '+j.nama.toUpperCase()+' ',nominal:5000000}); assert(!r.ok&&/^GANDA:/.test(r.error),'nama manual tertangkap');
// jenis lain untuk orang yang sama → boleh (bukan ganda), tetap muncul sebagai info
r=g.call({action:'simpanLain',token:a2,jenis:'TIJAROH',nama:j.nama,refTipe:'JM',refId:j.id,nominal:12500000}); assert(r.ok,r.error);
assert.strictEqual(g.call({action:'cekLain',token:a1,refId:j.id,nama:j.nama}).data.length,2);
// setoran tambahan yang sah: dikonfirmasi
r=g.call({action:'simpanLain',token:a2,jenis:'MAL',nama:j.nama,refTipe:'JM',refId:j.id,nominal:1000000,ganda:true}); assert(r.ok,r.error);
// fidyah: sama
r=g.call({action:'simpanLain',token:a1,jenis:'FIDYAH',nama:'Ibu Fiktif Fidyah',hari:3,nominal:45000}); assert(r.ok,r.error);
r=g.call({action:'simpanLain',token:a2,jenis:'FIDYAH',nama:'ibu fiktif fidyah',hari:3,nominal:45000}); assert(!r.ok&&/Fidyah/.test(r.error));
// ubah setoran sendiri tidak dianggap ganda
const idM=g.readTable_('Zakat_Lain').rows.find(x=>x.Jenis==='MAL'&&x.Nominal==5000000).ID;
r=g.call({action:'simpanLain',token:admin,id:idM,tahun:2027,jenis:'MAL',nama:j.nama,refTipe:'JM',refId:j.id,nominal:5500000}); assert(r.ok,r.error);
// setoran yang sudah dihapus tidak dihitung
r=g.call({action:'hapusLain',token:admin,id:idM}); assert(r.ok);
assert(!g.call({action:'cekLain',token:a1,refId:j.id,nama:j.nama}).data.some(x=>x.id===idM));
// tahun berbeda tidak dihitung
assert.strictEqual(g.call({action:'cekLain',token:a1,tahun:2026,refId:j.id,nama:j.nama}).data.length,0);
console.log('lain-ganda: lulus');
