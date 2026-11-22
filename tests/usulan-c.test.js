// Test usulan C (D-48): label per KK & "KK sudah setor" mengikuti KK terbaru di sensus. Data sintetis.
const mock=require('./gas-mock.js'),assert=require('assert');
const ss=mock.sensusSS(), g=mock(ss); g.setupZakat();
g.simpanPengguna_({user:{nama:'Admin Uji',peran:'ADMIN',pin:'111111'}},null);
const admin=g.call({action:'login',pin:'111111',device:'a'}).data.token;
g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:'Amil Uji',saham:1,pin:'222222'}});
const am=g.daftarAmil_(2027)[0];
const sen=g.readSensus_(); const kel={}; sen.jamaah.filter(j=>j.kk).forEach(j=>{(kel[j.kk]=kel[j.kk]||[]).push(j);});
const besar=Object.values(kel).filter(a=>a.length>=3);
const [kA,kB,kC,kD]=besar, kE=besar[4];
const v=sen.jamaah.find(j=>!j.kk);
const fit=(idKK,jm,diterima)=>{ const r=g.call({action:'simpanFitrah',token:admin,idAmil:am.id,idKeluarga:idKK,jm,jenis:'UANG',diterima}); assert(r.ok,r.error); return r.data.id; };
const kk=()=>{ const r=g.call({action:'kkList',token:admin,segar:true}); assert(r.ok,r.error); return id=>r.data.list.find(k=>k.id===id); };

// setoran kurang bayar: KK A (semua anggota), jamaah tanpa KK v, KK E (semua anggota)
fit(kA[0].kk,kA.map(j=>j.id),10000);
fit('TANPA-KK-'+v.id,[v.id],10000);
fit(kE[0].kk,kE.map(j=>j.id),10000);
let r=g.call({action:'simpanSimpatisan',token:admin,sm:{nama:'Simpatisan Ikut V Fiktif',idKeluarga:'TANPA-KK-'+v.id}}); assert(r.ok,r.error); const smV=r.data.id;
let L=kk();
assert.strictEqual(L(kA[0].kk).status,'KURANG'); assert.strictEqual(L('TANPA-KK-'+v.id).status,'KURANG'); assert.strictEqual(L(kB[0].kk).status,'BELUM');
const kkSetorAwal=g.call({action:'dashboard',token:admin,tahun:2027}).data.kkSetor;

// sensus berubah: (1) anggota KK A pindah ke KK C (KK A tetap ada); (2) v dilengkapi ID Keluarga = KK B;
// (3) KK E dihapus seluruhnya, semua anggotanya pindah ke KK D
const sh=ss.getSheetByName('Jamaah'), hd=sh.data[0], iId=hd.indexOf('ID Jamaah'), iKK=hd.indexOf('ID Keluarga');
const pindahA=kA.find(j=>j.hub!=='A');
sh.data.forEach(row=>{
  if(row[iId]===pindahA.id) row[iKK]=kC[0].kk;
  if(row[iId]===v.id) row[iKK]=kB[0].kk;
  if(kE.some(j=>j.id===row[iId])) row[iKK]=kD[0].kk;
});
const shK=ss.getSheetByName('Keluarga'), iKel=shK.data[0].indexOf('ID Keluarga'); shK.data=shK.data.filter(row=>row[iKel]!==kE[0].kk);
L=kk();
// (1) KK asal masih ada: kurang bayar tetap di KK A, tidak berpindah ke KK C
assert.strictEqual(L(kA[0].kk).status,'KURANG','kurang tetap di KK asal');
assert.notStrictEqual(L(kC[0].kk).status,'KURANG','KK tujuan pindah tidak ikut kurang');
assert(L(kC[0].kk).anggota.find(a=>a.id===pindahA.id).sudah,'status per jiwa tetap mengikuti orangnya');
// (2) TANPA-KK dilengkapi: label & simpatisan ikut KK B
assert(!L('TANPA-KK-'+v.id),'kunci virtual hilang dari daftar');
assert.strictEqual(L(kB[0].kk).status,'KURANG','kurang bayar v ikut ke KK barunya');
assert(L(kB[0].kk).kurangRp>0);
assert(L(kB[0].kk).simpatisan.some(m=>m.id===smV),'simpatisan ikut KK baru');
// (3) KK asal hilang: label pindah ke KK mayoritas jiwanya
assert(!L(kE[0].kk),'KK E sudah tidak ada');
assert.strictEqual(L(kD[0].kk).status,'KURANG','kurang bayar ikut KK mayoritas');
// Pemantauan: "KK sudah setor" menghitung KK B (v kini KK asli) dan KK D, tidak lagi KK E
const d=g.call({action:'dashboard',token:admin,tahun:2027,segar:true}).data;
assert.strictEqual(d.kkSetor,kkSetorAwal-1+2,'KK A tetap, KK E hilang, KK B & KK D bertambah');
// cek konsistensi: simpatisan V kini hanya info (sudah otomatis)
const ks=g.call({action:'cekKonsistensi',token:admin,tahun:2027}).data.temuan;
assert(ks.some(t=>t.judul==='Simpatisan otomatis ikut KK baru'&&t.tingkat==='info'));
// data tersimpan tidak diubah (riwayat tetap)
assert(g.readTable_('Setoran_Fitrah').rows.some(x=>x.ID_Keluarga==='TANPA-KK-'+v.id),'ID Keluarga asal di setoran tidak diubah');
console.log('usulan-c: lulus');
