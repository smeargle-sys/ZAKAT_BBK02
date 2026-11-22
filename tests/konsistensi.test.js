// Test cek konsistensi data terhadap sensus (D-46). Data sensus sintetis.
const mock=require('./gas-mock.js'),assert=require('assert');
const log=(...a)=>{ if(process.env.VERBOSE) console.log(...a); };
const ss=mock.sensusSS(), g=mock(ss); g.setupZakat();
g.simpanPengguna_({user:{nama:'Admin Uji',peran:'ADMIN',pin:'111111'}},null);
g.simpanPengguna_({user:{nama:'Pak Ketua',peran:'PENGURUS',pin:'333333'}},null);
const login=pin=>{const r=g.call({action:'login',pin,device:'d'+pin});assert(r.ok,r.error);return r.data.token;};
const admin=login('111111'), peng=login('333333');
const sen=g.readSensus_(); const kel={}; sen.jamaah.filter(j=>j.kk).forEach(j=>{(kel[j.kk]=kel[j.kk]||[]).push(j);});
const keluarga=Object.values(kel).filter(a=>a.length>=3&&a.some(j=>j.hub==='A'));
const [kA,kB,kC]=keluarga; const kD=Object.values(kel).find(a=>![kA,kB,kC].includes(a));
let r=g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:kC[2].nama,idJamaah:kC[2].id,saham:1,pin:'222222'}}); assert(r.ok,r.error);
const amil=g.daftarAmil_(2027)[0], a1=login('222222');

// akses: hanya admin
[a1,peng].forEach(t=>{ const x=g.call({action:'cekKonsistensi',token:t}); assert(!x.ok&&/Akses ditolak/.test(x.error)); });

// data awal: setoran KK A (semua anggota), simpatisan terkait KK D, mustahiq kepala KK B (seluruh KK) + final + serah
r=g.call({action:'simpanFitrah',token:admin,idAmil:amil.id,idKeluarga:kA[0].kk,jm:kA.map(j=>j.id),jenis:'BERAS'}); assert(r.ok,r.error);
r=g.call({action:'simpanSimpatisan',token:admin,sm:{nama:'Simpatisan Uji Fiktif',idKeluarga:kD[0].kk}}); assert(r.ok,r.error);
const kepB=kB.find(j=>j.hub==='A');
r=g.call({action:'simpanMustahiq',token:admin,tahun:2027,op:'tambah',items:[{refId:kepB.id}]}); assert(r.ok,r.error);
r=g.call({action:'simpanFinalMustahiq',token:admin,tahun:2027,items:[{idKeluarga:kepB.kk,soq:1}]}); assert(r.ok,r.error);
r=g.call({action:'serahMustahiq',token:admin,tahun:2027,idKeluarga:kepB.kk}); assert(r.ok,r.error);
r=g.call({action:'cekKonsistensi',token:admin,tahun:2027}); assert(r.ok,r.error);
assert.strictEqual(r.data.jumlah,0,'data cocok dengan sensus: tidak ada temuan '+JSON.stringify(r.data.temuan));

// sensus berubah: anggota KK A pindah ke KK C, satu anggota KK A dihapus, seluruh KK D dihapus,
// anggota KK B pindah ke KK C, amil (anggota KK C) dihapus dari sensus
const sh=ss.getSheetByName('Jamaah'), hd=sh.data[0], iId=hd.indexOf('ID Jamaah'), iKK=hd.indexOf('ID Keluarga');
const pindahA=kA.find(j=>j.hub!=='A'), hilangA=kA.filter(j=>j.hub!=='A'&&j!==pindahA)[0], pindahB=kB.find(j=>j.hub!=='A');
sh.data.forEach(r=>{ if(r[iId]===pindahA.id||r[iId]===pindahB.id) r[iKK]=kC[0].kk; });
sh.data=sh.data.filter(r=>r[iId]!==hilangA.id&&r[iId]!==kC[2].id&&r[iKK]!==kD[0].kk);
const shK=ss.getSheetByName('Keluarga'), iKel=shK.data[0].indexOf('ID Keluarga'); shK.data=shK.data.filter(r=>r[iKel]!==kD[0].kk);

r=g.call({action:'cekKonsistensi',token:admin,tahun:2027}); assert(r.ok,r.error);
const T=r.data.temuan, ada=(kat,judul,teks)=>T.some(t=>t.kategori===kat&&t.judul.indexOf(judul)>=0&&(!teks||t.detail.indexOf(teks)>=0));
log(JSON.stringify(r.data.ringkas), T.map(t=>t.judul+' | '+t.detail));
assert(ada('setoran','Jiwa sudah pindah KK',pindahA.nama),'jiwa setoran pindah KK');
assert(ada('setoran','Jiwa tidak ada lagi di sensus',hilangA.nama),'jiwa setoran hilang dari sensus');
assert(ada('simpatisan','Simpatisan terlepas','Simpatisan Uji Fiktif'),'simpatisan terlepas');
assert(ada('mustahiq','Penerima pindah KK',pindahB.nama),'penerima mustahiq pindah KK');
assert(ada('mustahiq','Angka final perlu ditinjau'),'angka final KK B perlu ditinjau karena isi KK berubah');
assert(ada('amil','Amil terhubung',kC[2].nama),'amil tidak ada di sensus');
assert(T.every(t=>t.saran&&t.judul&&t.kategori),'setiap temuan punya saran');
assert(r.data.perlu>0&&r.data.ringkas.setoran>=2);
// hanya membaca: tidak ada data yang berubah
assert.strictEqual(g.readTable_('Setoran_Fitrah_Jiwa').rows.filter(x=>x.Dihapus!=='Y').length,kA.length,'tidak mengubah data');
r=g.call({action:'simpanFinalMustahiq',token:admin,tahun:2027,items:[]}); assert(r.ok,r.error);
r=g.call({action:'cekKonsistensi',token:admin,tahun:2027});
assert(!r.data.temuan.some(t=>t.judul.indexOf('Angka final')>=0),'setelah angka final dikosongkan, temuan angka final hilang');
console.log('konsistensi: lulus');
