// Test spec pra-Ramadhan 2027 (D-23 s.d. D-28) + cache request/respons. Data sensus sintetis.
const mock=require('./gas-mock.js'),assert=require('assert');
const log=(...a)=>{ if(process.env.VERBOSE) console.log(...a); };
const g=mock(mock.sensusSS());
g.setupZakat();
g.simpanPengguna_({user:{nama:'Admin Uji',peran:'ADMIN',pin:'111111'}},null);
g.simpanPengguna_({user:{nama:'Pak Ketua',peran:'PENGURUS',pin:'333333'}},null);
const login=pin=>{const r=g.call({action:'login',pin,device:'d'+pin});assert(r.ok,r.error);return r.data.token;};
const admin=login('111111'), peng=login('333333');
let r=g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:'Amil Satu',saham:1,pin:'222222'}}); assert(r.ok,r.error);
r=g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:'Amil Dua',saham:1,pin:'555555'}}); assert(r.ok,r.error);
const amilList=r.data, amil1=amilList.find(a=>a.nama==='Amil Satu'), amil2=amilList.find(a=>a.nama==='Amil Dua');
const a1=login('222222'), a2=login('555555');
const hariIni=g.fmtDate_(new Date());

// ---------- Req 1 (D-23): route admin-only menolak amil & pengurus ----------
['getConfig','simpanConfig','tahunBaru','simpanAmil','daftarPengguna','simpanPengguna','simpanBagianAmil'].forEach(act=>{
  [a1,peng].forEach(tok=>{ const x=g.call({action:act,token:tok}); assert(!x.ok && /Akses ditolak/.test(x.error), act+' harus ditolak: '+x.error); });
});
log('Req1: route admin-only menolak amil & pengurus');

// ---------- Req 5 (D-28 + privasi) ----------
r=g.call({action:'kkList',token:a1}); assert(r.ok,r.error);
const list=r.data.list;
assert(list.every(k=>!('alamat' in k)),'kkList tidak boleh mengirim alamat');
const virt=list.filter(k=>k.tanpaKK), asli=list.filter(k=>!k.tanpaKK);
assert(virt.length>0,'fixture harus punya jamaah tanpa ID Keluarga');
assert(virt.every(k=>k.id.indexOf('TANPA-KK-')===0));

// ---------- Req 2 (D-24): Dicatat_Oleh ----------
const kkA=asli.find(k=>k.jiwa>=3), kkB=asli.find(k=>k!==kkA&&k.jiwa>=2), kkC=asli.find(k=>k!==kkA&&k!==kkB&&k.jiwa>=2);
// admin mencatat atas nama Amil Dua, kemarin (tidak masuk "hari ini")
r=g.call({action:'simpanFitrah',token:admin,idAmil:amil2.id,idKeluarga:kkA.id,jm:kkA.anggota.map(a=>a.id),jenis:'BERAS',tanggal:'2026-11-01'}); assert(r.ok,r.error);
const idA=r.data.id;
let row=g.readTable_('Setoran_Fitrah').rows.find(x=>x.ID===idA);
assert.strictEqual(row.Nama_Amil,'Amil Dua'); assert.strictEqual(row.Dicatat_Oleh,'Admin Uji');
// amil mencoba mengirim idAmil amil lain → tetap tercatat atas namanya sendiri
r=g.call({action:'simpanFitrah',token:a1,idAmil:amil2.id,idKeluarga:kkB.id,jm:[kkB.anggota[0].id],jenis:'UANG',diterima:40000,tanggal:hariIni}); assert(r.ok,r.error);
const idB=r.data.id;
row=g.readTable_('Setoran_Fitrah').rows.find(x=>x.ID===idB);
assert.strictEqual(row.Nama_Amil,'Amil Satu'); assert.strictEqual(row.Dicatat_Oleh,'Amil Satu');
// Amil Dua mengubah setoran atas namanya → Dicatat_Oleh tidak berubah, Diubah_Oleh terisi
r=g.call({action:'simpanFitrah',token:a2,id:idA,idKeluarga:kkA.id,jm:kkA.anggota.map(a=>a.id),jenis:'BERAS',kg:9,tanggal:'2026-11-01'}); assert(r.ok,r.error);
row=g.readTable_('Setoran_Fitrah').rows.find(x=>x.ID===idA);
assert.strictEqual(row.Dicatat_Oleh,'Admin Uji'); assert.strictEqual(row.Diubah_Oleh,'Amil Dua');
// zakat lain
r=g.call({action:'simpanLain',token:admin,idAmil:amil1.id,jenis:'MAL',nama:'Bpk Fiktif',nominal:1000000,tanggal:hariIni}); assert(r.ok,r.error);
row=g.readTable_('Zakat_Lain').rows.find(x=>x.ID===r.data.id);
assert.strictEqual(row.Dicatat_Oleh,'Admin Uji'); assert.strictEqual(row.Nama_Amil,'Amil Satu');
r=g.call({action:'daftarSetoran',token:peng}); assert(r.ok,r.error);
assert.strictEqual(r.data.find(x=>x.id===idA).dicatat,'Admin Uji');
const lg=g.readTable_('Log').rows.filter(x=>x.Aksi==='simpanFitrah').pop();
assert(/"amil":"Amil Satu"/.test(lg.Detail),'log memuat nama amil');
log('Req2: Dicatat_Oleh ok');

// ---------- Req 3 (D-25): simpatisan sudah zakat ----------
r=g.call({action:'simpanSimpatisan',token:a1,sm:{nama:'Simpatisan Fiktif'}}); assert(r.ok,r.error); const smId=r.data.id;
r=g.call({action:'daftarSimpatisan',token:a1}); assert(r.data.find(m=>m.id===smId).sudah===false);
r=g.call({action:'simpanFitrah',token:a1,idKeluarga:'',namaMuzakki:'Simpatisan Fiktif',sm:[smId],jenis:'UANG',diterima:40000,tanggal:hariIni}); assert(r.ok,r.error);
const idSm=r.data.id;
r=g.call({action:'daftarSimpatisan',token:a1}); const m=r.data.find(x=>x.id===smId);
assert.strictEqual(m.sudah,true); assert.strictEqual(m.idSetoran,idSm);
log('Req3: simpatisan sudah ditandai');

// ---------- Req 4 (D-26): progres ----------
// KK C: satu anggota kemarin, sisanya hari ini → lengkap hari ini (+1 KK)
r=g.call({action:'simpanFitrah',token:a1,idKeluarga:kkC.id,jm:[kkC.anggota[0].id],jenis:'KAMPUNG',tanggal:'2026-11-01'}); assert(r.ok,r.error);
r=g.call({action:'simpanFitrah',token:a1,idKeluarga:kkC.id,jm:kkC.anggota.slice(1).map(a=>a.id),jenis:'BERAS',tanggal:hariIni}); assert(r.ok,r.error);
// satu jamaah tanpa KK zakat hari ini
const v=virt[0];
r=g.call({action:'simpanFitrah',token:a1,idKeluarga:v.id,jm:[v.anggota[0].id],jenis:'UANG',diterima:40000,tanggal:hariIni}); assert(r.ok,r.error);
r=g.call({action:'dashboard',token:peng}); assert(r.ok,r.error);
const d=r.data, p=d.progres;
log('progres:',JSON.stringify(p));
assert.strictEqual(p.kkTotal,asli.filter(k=>k.anggota.length).length,'kkTotal = KK asli');
assert.strictEqual(p.jiwaTotal,d.jiwaSensus);
assert.strictEqual(p.kkSudah,2,'KK A (kemarin) + KK C (lengkap hari ini)');
assert.strictEqual(p.kkSebagian,1,'KK B sebagian');
assert.strictEqual(p.kkHariIni,1,'hanya KK C yang menjadi lengkap hari ini');
assert.strictEqual(p.jiwaSudah,kkA.jiwa+1+kkC.jiwa+1,'termasuk KAMPUNG & tanpa KK, tanpa simpatisan');
assert.strictEqual(p.jiwaHariIni,1+(kkC.jiwa-1)+1);
assert.strictEqual(p.tanggal,hariIni); assert.strictEqual(typeof p.batasLewat,'boolean'); assert.strictEqual(p.hMinus,d.hMinus);
// D-28: daftar belum per KK tanpa TANPA-KK; jamaah tanpa KK tampil terpisah dan tetap dihitung jiwa
assert(d.belum.every(b=>b.id.indexOf('TANPA-KK-')!==0),'belum hanya KK asli');
assert.strictEqual(d.belum.filter(b=>b.status==='BELUM').length,asli.length-3);
assert.strictEqual(d.belumTanpaKK.length,virt.length-1);
assert(d.belumTanpaKK.every(b=>b.nama),'nama jamaah tanpa KK terisi');
assert.strictEqual(d.kkSetor,3,'kkSetor tidak menghitung TANPA-KK & simpatisan');
assert.strictEqual(d.jiwaBelum,d.jiwaSensus-p.jiwaSudah);
log('Req4/5: progres & daftar belum ok');

// ---------- cache: hasil baca selalu segar setelah penulisan ----------
const before=g.call({action:'dashboard',token:peng}).data.progres.jiwaSudah;
const kkD=asli.find(k=>![kkA,kkB,kkC].includes(k)&&k.jiwa>=1);
r=g.call({action:'simpanFitrah',token:a1,idKeluarga:kkD.id,jm:[kkD.anggota[0].id],jenis:'BERAS',tanggal:hariIni}); assert(r.ok,r.error);
assert.strictEqual(g.call({action:'dashboard',token:peng}).data.progres.jiwaSudah,before+1,'dashboard harus segar setelah simpan');
r=g.call({action:'kkList',token:a1}); assert(r.data.list.find(k=>k.id===kkD.id).sudah===1,'kkList segar setelah simpan');
assert(r.data.saya,'kkList amil memuat ringkasan saya');
const rAdmin=g.call({action:'kkList',token:admin}); assert.strictEqual(rAdmin.data.saya,null,'cache kkList tidak tertukar antar sesi');
// hapus juga menyegarkan
r=g.call({action:'hapusFitrah',token:admin,id:idB}); assert(r.ok,r.error);
assert.strictEqual(g.call({action:'dashboard',token:peng}).data.progres.kkSebagian,kkD.jiwa>1?1:0,'setoran KK B dihapus → tidak sebagian lagi');
console.log('pra-ramadhan: lulus');
