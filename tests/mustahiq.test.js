// Test Mustahiq (D-35), penandatangan & data laporan (D-36), hapus massal (D-37). Data sensus sintetis.
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
const T=2027;

// ---------- golden: pembagian rata per jiwa, soq bulat per KK, total pas ----------
const jiwaKK=[7,3,2,1,5,3,2,2,1,4,3,2,1,1,6,2,3,4,2,1,3,2,4,1,2,3,5,2,1,3,2,2,4,3,1,2,1,3,2,1,4]; // 41 KK
assert.strictEqual(jiwaKK.reduce((a,b)=>a+b,0),106);
const bagi=g.splitLargestRemainder_(146, jiwaKK.map((n,i)=>({key:'K'+i,pct:n})));
assert.strictEqual(Object.values(bagi).reduce((a,b)=>a+b,0),146,'Σ soq per KK = pos mustahiq persis');
jiwaKK.forEach((n,i)=>{ const ex=146*n/106; assert(bagi['K'+i]===Math.floor(ex)||bagi['K'+i]===Math.ceil(ex),'tiap KK = lantai/atap bagian rata'); });
log('golden 146/106 ok');

// ---------- akses ----------
['daftarMustahiq','simpanMustahiq','serahMustahiq','simpanPenandatangan'].forEach(act=>{
  const x=g.call({action:act,token:a1,tahun:T}); assert(!x.ok&&/Akses ditolak/.test(x.error),'amil ditolak: '+act);
});
['simpanMustahiq','serahMustahiq','simpanPenandatangan'].forEach(act=>{
  const x=g.call({action:act,token:peng,tahun:T}); assert(!x.ok&&/Akses ditolak/.test(x.error),'pengurus tidak boleh mengubah: '+act);
});

// ---------- kandidat (admin saja) & tambah ----------
r=g.call({action:'daftarMustahiq',token:admin,tahun:T}); assert(r.ok,r.error);
const kand=r.data.kandidat; assert(kand.length>0,'ada kandidat Perlu Dibantu di fixture');
const sen=g.readSensus_(); const bantu=sen.jamaah.filter(j=>j.bantu==='Y');
assert.strictEqual(kand.reduce((a,k)=>a+k.anggota.length,0),bantu.length);
const p0=g.call({action:'daftarMustahiq',token:peng,tahun:T}); assert(p0.ok); assert(!('kandidat' in p0.data),'pengurus tidak menerima kandidat');
assert(!JSON.stringify(p0.data).includes('alamat'),'tanpa alamat');
const pilih=kand.slice(0,3).reduce((a,k)=>a.concat(k.anggota),[]);
r=g.call({action:'simpanMustahiq',token:admin,tahun:T,op:'tambah',items:pilih.map((a,i)=>({refId:a.id,asnaf:i===0?'FAKIR':'MISKIN'}))}); assert(r.ok,r.error);
r=g.call({action:'simpanMustahiq',token:admin,tahun:T,op:'tambah',items:[{refId:pilih[0].id}]}); assert(!r.ok&&/sudah ada/.test(r.error),'duplikat ditolak');
const bebas=sen.jamaah.filter(j=>!j.kk)[0];
r=g.call({action:'simpanMustahiq',token:admin,tahun:T,op:'tambah',items:[{refId:bebas.id,asnaf:'KAYA'}]}); assert(!r.ok&&/Asnaf/.test(r.error),r.error);
// kepala keluarga + anggota sensus (cari nama) & luar sensus
const kk=sen.jamaah.filter(j=>j.kk&&j.bantu!=='Y'); const kel={}; kk.forEach(j=>{(kel[j.kk]=kel[j.kk]||[]).push(j);});
const kkPenuh=Object.values(kel).find(a=>a.length>=3&&a.some(j=>j.hub==='A'));
r=g.call({action:'simpanMustahiq',token:admin,tahun:T,op:'tambah',items:kkPenuh.slice().reverse().map(j=>({refId:j.id,asnaf:'MISKIN'}))}); assert(r.ok,r.error);
r=g.call({action:'simpanMustahiq',token:admin,tahun:T,op:'luar',nama:'Keluarga Musafir Fiktif',jiwa:3,asnaf:'IBNU_SABIL',catatan:'singgah'}); assert(r.ok,r.error);
let d=r.data;
const gk=d.grup.find(x=>x.id===kkPenuh[0].kk);
assert(gk.anggota[0].kepala&&gk.anggota[0].nama===kkPenuh.find(j=>j.hub==='A').nama,'kepala keluarga paling atas');
assert.strictEqual(gk.anggota.filter(a=>a.kepala).length,1);
const luar=d.grup.find(x=>x.tipe==='LUAR'); assert.strictEqual(luar.jiwa,3); assert(luar.anggota[0].kepala);
assert.strictEqual(d.grup[d.grup.length-1].tipe,'LUAR','luar sensus di urutan akhir');
// D-40: kepala keluarga yang dipilih membawa seluruh anggota KK-nya
const harap=new Set(pilih.map(a=>a.id)); pilih.forEach(a=>{ const j=sen.jamaah.find(x=>x.id===a.id); if(j.kk&&j.hub==='A') sen.jamaah.filter(x=>x.kk===j.kk).forEach(x=>harap.add(x.id)); });
kkPenuh.forEach(j=>harap.add(j.id));
assert.strictEqual(d.jiwa,harap.size+3);
assert.strictEqual(d.pool,0,'belum ada setoran: pool 0');

// ---------- pool dari setoran & pembagian per KK ----------
const list=g.call({action:'kkList',token:a1}).data.list.filter(k=>!k.tanpaKK&&k.jiwa>=2);
list.slice(0,12).forEach(k=>{ const x=g.call({action:'simpanFitrah',token:a1,idKeluarga:k.id,jm:k.anggota.map(a=>a.id),jenis:'BERAS'}); assert(x.ok,x.error); });
const dash=g.call({action:'dashboard',token:admin,tahun:T}).data;
const posM=dash.pembagianFitrah.find(x=>x.key==='mustahiq').soq;
d=g.call({action:'daftarMustahiq',token:admin,tahun:T}).data;
assert.strictEqual(d.pool,posM,'pool = pos Mustahiq Pemantauan');
assert.strictEqual(d.grup.reduce((a,x)=>a+x.soq,0),posM,'Σ soq per KK = pool');
assert(d.sementara,'angka sementara selama penerimaan dibuka');
assert.strictEqual(dash.jiwaMustahiq,d.jiwa,'jiwa mustahiq dashboard = daftar');
assert(dash.penandatangan.length===9&&dash.penandatangan[0].jabatan==='KI KELOMPOK','penandatangan default');

// ---------- penyerahan & tanda berubah ----------
r=g.call({action:'serahMustahiq',token:admin,tahun:T,idKeluarga:gk.id,tanggal:'2027-03-10'}); assert(r.ok,r.error);
let g2=r.data.grup.find(x=>x.id===gk.id); assert(g2.serah&&g2.serah.soq===g2.soq&&!g2.berubah); assert.strictEqual(r.data.serahKK,1);
const k13=list[12]; r=g.call({action:'simpanFitrah',token:a1,idKeluarga:k13.id,jm:k13.anggota.map(a=>a.id),jenis:'UANG',diterima:k13.jiwa*40000}); assert(r.ok);
list.slice(13,20).forEach(k=>g.call({action:'simpanFitrah',token:a1,idKeluarga:k.id,jm:k.anggota.map(a=>a.id),jenis:'BERAS'}));
d=g.call({action:'daftarMustahiq',token:peng,tahun:T}).data; g2=d.grup.find(x=>x.id===gk.id);
assert(g2.soq!==g2.serah.soq&&g2.berubah,'berubah sejak diserahkan terdeteksi (cache pengurus ikut segar)');
r=g.call({action:'serahMustahiq',token:admin,tahun:T,idKeluarga:gk.id,batal:true}); assert(r.ok); assert(!r.data.grup.find(x=>x.id===gk.id).serah);

// ---------- ubah & hapus penerima ----------
r=g.call({action:'simpanMustahiq',token:admin,tahun:T,op:'ubah',id:luar.anggota[0].id,jiwa:4,asnaf:'MUALAF'}); assert(r.ok,r.error);
assert.strictEqual(r.data.grup.find(x=>x.tipe==='LUAR').jiwa,4);
r=g.call({action:'simpanMustahiq',token:admin,tahun:T,op:'hapus',id:luar.anggota[0].id}); assert(r.ok); assert(!r.data.grup.some(x=>x.tipe==='LUAR'));

// ---------- tujuan mustahiq bukan Kelompok: tidak dibagi ----------
let t=g.readTable_('Config_Tahun'); let row=t.rows.find(x=>String(x.Tahun)==='2027'); g.updateObject_(t,row,{F_Mustahiq_Ke:'Daerah'}); g.naikkanVersiData_();
d=g.call({action:'daftarMustahiq',token:admin,tahun:T}).data; assert(!d.bagi&&d.pool===0&&d.grup.every(x=>x.soq===0));
r=g.call({action:'serahMustahiq',token:admin,tahun:T,idKeluarga:gk.id}); assert(!r.ok);
g.updateObject_(t,row,{F_Mustahiq_Ke:'Kelompok'}); g.naikkanVersiData_();

// ---------- penandatangan ----------
r=g.call({action:'simpanPenandatangan',token:admin,tahun:T,list:[{jabatan:'KI KELOMPOK',nama:'H. Fiktif Satu'},{jabatan:'KU KELOMPOK',nama:'Fiktif Dua'}]}); assert(r.ok,r.error);
assert.strictEqual(g.call({action:'dashboard',token:peng,tahun:T}).data.penandatangan[1].nama,'Fiktif Dua');
r=g.call({action:'tahunBaru',token:admin}); assert(r.ok,r.error);
assert.strictEqual(g.penandatangan_(g.cfg_(2028))[0].nama,'H. Fiktif Satu','penandatangan disalin ke tahun baru');
log('mustahiq & penandatangan ok');

// ---------- hapus massal & pulihkan (D-37) ----------
const sebelum=g.call({action:'dashboard',token:admin,tahun:T}).data;
// satu setoran diubah dulu: sisakan baris jiwa lama berstatus terhapus dengan isi kembar
const st=g.call({action:'daftarSetoran',token:admin,tahun:T,kelas:'FITRAH'}).data[0];
const ed=g.getFitrah_({id:st.id});
r=g.call({action:'simpanFitrah',token:admin,id:st.id,idAmil:'',idKeluarga:ed.setoran.ID_Keluarga,jm:ed.jm,jenis:'BERAS',tanggal:'2026-11-22'}); assert(r.ok,r.error);
assert.strictEqual(String(g.readTable_('Setoran_Fitrah').rows.find(x=>x.ID===st.id).Tahun),'2027','mengubah setoran tahun lalu tidak memindahkannya ke tahun aktif');
r=g.call({action:'simpanLain',token:admin,tahun:T,jenis:'MAL',nama:'Bpk Fiktif',nominal:1000000}); assert(r.ok,r.error);
r=g.call({action:'simpanSerahUB',token:admin,tahun:T,idAmil:'',nominal:5000,penerima:'UB'}); assert(r.ok,r.error);
g.call({action:'simpanBagianAmil',token:admin,tahun:T,lampiran:'UTAMA',items:[{idAmil:'x',nama:'Amil Satu',beras:1,uang:1000}],catatan:'uji'});
const hit=g.hitungHapusMassal_(T); assert(hit.Setoran_Fitrah>=19&&hit.Zakat_Lain===1&&hit.Serah_UB===1&&hit.Bagian_Amil===1, JSON.stringify(hit));
const jiwaAktif=()=>g.readTable_('Setoran_Fitrah_Jiwa').rows.filter(x=>String(x.Tahun)==='2027'&&x.Dihapus!=='Y').length;
const nJiwa=jiwaAktif();
const hm=g.hapusMassal_(T,'uji');
assert.strictEqual(hm.jumlah.Setoran_Fitrah,hit.Setoran_Fitrah);
let sesudah=g.call({action:'dashboard',token:admin,tahun:T}).data;
assert.strictEqual(sesudah.fitrah.setoran,0,'dashboard kosong setelah hapus massal (cache ikut segar)');
assert.strictEqual(sesudah.malTotal,0); assert.strictEqual(jiwaAktif(),0);
assert.strictEqual(g.rowsOf_('Bagian_Amil',x=>String(x.Tahun)==='2027').length,0);
assert(g.call({action:'daftarMustahiq',token:admin,tahun:T}).data.jiwa>0,'daftar mustahiq tidak ikut dihapus');
assert.strictEqual(g.daftarBatchMassal_()[0].batch,hm.batch);
const pl=g.pulihkanMassal_(hm.batch,'uji');
assert.strictEqual(jiwaAktif(),nJiwa,'rincian jiwa pulih persis (baris lama yang kembar tidak ikut hidup)');
sesudah=g.call({action:'dashboard',token:admin,tahun:T}).data;
assert.strictEqual(sesudah.fitrah.setoran,sebelum.fitrah.setoran); assert.strictEqual(sesudah.malTotal,1000000);
assert.strictEqual(g.rowsOf_('Bagian_Amil',x=>String(x.Tahun)==='2027').length,1);
assert.throws(()=>g.pulihkanMassal_(hm.batch,'uji'),/sudah pernah dipulihkan/);
assert.strictEqual(pl.jumlah.Bagian_Amil,1);
// tahun tanpa data
assert.strictEqual(Object.values(g.hitungHapusMassal_(2028)).reduce((a,b)=>a+b,0),0);

// ---------- D-40: tambah kepala saja -> seluruh keluarga, asnaf sama ----------
const kel2={}; sen.jamaah.filter(j=>j.kk).forEach(j=>{(kel2[j.kk]=kel2[j.kk]||[]).push(j);});
const ada=new Set(g.call({action:'daftarMustahiq',token:admin,tahun:T}).data.grup.flatMap(x=>x.anggota.map(a=>a.refId)));
const kel3=Object.values(kel2).find(a=>a.length>=3&&a.some(j=>j.hub==='A')&&a.every(j=>!ada.has(j.id)));
const kep=kel3.find(j=>j.hub==='A');
r=g.call({action:'simpanMustahiq',token:admin,tahun:T,op:'tambah',items:[{refId:kep.id,asnaf:'GHORIM'}]}); assert(r.ok,r.error);
const g3=r.data.grup.find(x=>x.id===kep.kk);
assert.strictEqual(g3.jiwa,kel3.length,'jiwa KK = total anggota di sensus');
assert(g3.anggota.every(a=>a.asnaf==='GHORIM'),'asnaf ikut kepala'); assert(g3.anggota[0].kepala);
// anggota bukan kepala: hanya dirinya
const kel4=Object.values(kel2).find(a=>a.length>=3&&a.every(j=>!ada.has(j.id))&&a!==kel3&&a.some(j=>j.hub!=='A'));
r=g.call({action:'simpanMustahiq',token:admin,tahun:T,op:'tambah',items:[{refId:kel4.find(j=>j.hub!=='A').id}]}); assert(r.ok);
assert.strictEqual(r.data.grup.find(x=>x.id===kel4[0].kk).jiwa,1,'anggota biasa tidak membawa keluarga');

// ---------- D-41: hapus simpatisan ----------
r=g.call({action:'simpanSimpatisan',token:admin,sm:{nama:'Simpatisan Hapus Fiktif'}}); const smH=r.data.id;
r=g.call({action:'simpanSimpatisan',token:admin,sm:{nama:'Simpatisan Dipakai Fiktif'}}); const smP=r.data.id;
const tAktif=g.tahunAktif_().Tahun;
r=g.call({action:'simpanFitrah',token:admin,tahun:tAktif,idAmil:'',idKeluarga:'',namaMuzakki:'Simpatisan Dipakai Fiktif',sm:[smP],jenis:'KAMPUNG'}); assert(r.ok,r.error);
assert(!g.call({action:'hapusSimpatisan',token:a1,id:smH}).ok,'amil tidak boleh menghapus');
r=g.call({action:'hapusSimpatisan',token:admin,id:smP}); assert(!r.ok&&/masih tercatat/.test(r.error),r.error);
r=g.call({action:'hapusSimpatisan',token:admin,id:smH}); assert(r.ok,r.error);
assert(!r.data.list.some(m=>m.id===smH),'tidak tampil lagi di master');
assert(!g.call({action:'cariMuzakki',token:admin,q:'Simpatisan Hapus'}).data.some(m=>m.id===smH),'tidak muncul di pencarian');

// ---------- D-40: daftarSetoran mengirim jumlah anggota KK sensus ----------
const ds=g.call({action:'daftarSetoran',token:admin,tahun:T}).data.filter(x=>x.kelas==='FITRAH'&&x.idKeluarga&&x.idKeluarga.indexOf('TANPA-KK-')!==0);
assert(ds.length&&ds.every(x=>x.kkJiwa===(kel2[x.idKeluarga]||[]).length),'kkJiwa = anggota KK di sensus');

// ---------- D-42: angka final hasil musyawarah per KK ----------
let dm=g.call({action:'daftarMustahiq',token:admin,tahun:T}).data;
assert(dm.pool>0&&dm.grup.length>=3,'butuh pool & beberapa KK');
const [f0,f1,f2]=dm.grup;
assert(!dm.adaFinal&&dm.selisih===0&&dm.grup.every(x=>x.final===null&&x.soq===x.acuan),'tanpa final = acuan, total pas');
['simpanFinalMustahiq'].forEach(act=>{[a1,peng].forEach(t=>{ const x=g.call({action:act,token:t,tahun:T,items:[]}); assert(!x.ok&&/Akses ditolak/.test(x.error)); });});
r=g.call({action:'simpanFinalMustahiq',token:admin,tahun:T,items:[{idKeluarga:f0.id,soq:1.5}]}); assert(!r.ok&&/bilangan bulat/.test(r.error));
r=g.call({action:'simpanFinalMustahiq',token:admin,tahun:T,items:[{idKeluarga:f0.id,soq:-1}]}); assert(!r.ok);
r=g.call({action:'simpanFinalMustahiq',token:admin,tahun:T,items:[{idKeluarga:f0.id,soq:f0.acuan+2,catatan:'musyawarah'},{idKeluarga:f1.id,soq:0},{idKeluarga:f2.id,soq:''}]}); assert(r.ok,r.error);
dm=r.data; let x0=dm.grup.find(x=>x.id===f0.id), x1=dm.grup.find(x=>x.id===f1.id), x2=dm.grup.find(x=>x.id===f2.id);
assert(dm.adaFinal&&x0.final===f0.acuan+2&&x0.soq===f0.acuan+2&&x0.catatanFinal==='musyawarah');
assert(x1.final===0&&x1.soq===0,'boleh 0'); assert(x2.final===null&&x2.soq===x2.acuan,'kosong = acuan');
assert.strictEqual(dm.totalSoq,dm.pool+2-f1.acuan); assert.strictEqual(dm.selisih,2-f1.acuan,'selisih ditampilkan, tetap boleh disimpan');
assert.strictEqual(x0.kg,Math.round(x0.soq*dm.kgSoq*100)/100);
// penyerahan memakai angka final
r=g.call({action:'serahMustahiq',token:admin,tahun:T,idKeluarga:f0.id}); assert(r.ok,r.error);
assert.strictEqual(r.data.grup.find(x=>x.id===f0.id).serah.soq,f0.acuan+2);
// pengurus melihat angka final (baca saja)
assert.strictEqual(g.call({action:'daftarMustahiq',token:peng,tahun:T}).data.grup.find(x=>x.id===f0.id).soq,f0.acuan+2);
// simpan ulang mengganti semua final tahun itu
r=g.call({action:'simpanFinalMustahiq',token:admin,tahun:T,items:[{idKeluarga:f1.id,soq:f1.acuan}]}); assert(r.ok);
assert.strictEqual(r.data.grup.find(x=>x.id===f0.id).final,null,'final lama diganti'); assert.strictEqual(r.data.selisih,0);
assert(r.data.grup.find(x=>x.id===f0.id).berubah,'penyerahan berbeda dari angka sekarang ditandai');

// ---------- D-43: pengelompokan mengikuti ID Keluarga TERBARU di sensus ----------
{
  const ss2=mock.sensusSS(), g2=mock(ss2); g2.setupZakat();
  g2.simpanPengguna_({user:{nama:'Admin Dua',peran:'ADMIN',pin:'111111'}},null);
  const ad=g2.call({action:'login',pin:'111111',device:'z'}).data.token;
  const sen2=g2.readSensus_(); const kk2={}; sen2.jamaah.filter(j=>j.kk).forEach(j=>{(kk2[j.kk]=kk2[j.kk]||[]).push(j);});
  const kel5=Object.values(kk2).find(a=>a.length>=3&&a.some(j=>j.hub==='A'));
  const kepala=kel5.find(j=>j.hub==='A'), pindah=kel5.find(j=>j.hub!=='A'), hilang=kel5.filter(j=>j.hub!=='A'&&j!==pindah)[0];
  const kkLain=Object.keys(kk2).find(k=>k!==kepala.kk);
  let x=g2.call({action:'simpanMustahiq',token:ad,tahun:2027,op:'tambah',items:[{refId:kepala.id,asnaf:'FAKIR'}]}); assert(x.ok,x.error);
  assert.strictEqual(x.data.grup.find(q=>q.id===kepala.kk).jiwa,kel5.length);
  // sensus diperbaiki: satu anggota pindah KK, satu lagi dihapus dari tab Jamaah
  const sh=ss2.getSheetByName('Jamaah'), hd=sh.data[0], iId=hd.indexOf('ID Jamaah'), iKK=hd.indexOf('ID Keluarga');
  sh.data.forEach(r=>{ if(r[iId]===pindah.id) r[iKK]=kkLain; });
  sh.data=sh.data.filter(r=>r[iId]!==hilang.id);
  x=g2.call({action:'daftarMustahiq',token:ad,tahun:2027,segar:true}); assert(x.ok,x.error);
  const gk5=x.data.grup.find(q=>q.id===kepala.kk), gl=x.data.grup.find(q=>q.id===kkLain);
  assert(!gk5.anggota.some(a=>a.refId===pindah.id),'anggota yang pindah KK tidak lagi di KK lama');
  assert(gl&&gl.anggota.some(a=>a.refId===pindah.id),'anggota yang pindah ikut KK barunya');
  const ah=gk5.anggota.find(a=>a.refId===hilang.id); assert(ah&&ah.tidakDiSensus,'jamaah yang tidak ada lagi di sensus ditandai');
  assert.strictEqual(x.data.grup.reduce((s,q)=>s+q.jiwa,0),kel5.length,'total jiwa tetap');
}

// ---------- D-44: tahun ditutup = konfigurasi & amil hanya-baca ----------
assert.strictEqual(g.cfg_(T).Status,'TUTUP','2027 sudah ditutup oleh tahun baru');
const cfgLengkap=Object.assign({},g.cfg_(T),{Harga_Soq:99000});
r=g.call({action:'simpanConfig',token:admin,config:cfgLengkap}); assert(!r.ok&&/sudah ditutup/.test(r.error),'ubah harga tahun ditutup ditolak');
r=g.call({action:'simpanAmil',token:admin,tahun:T,amil:{nama:'Amil Baru Fiktif',saham:1}}); assert(!r.ok&&/sudah ditutup/.test(r.error),'ubah amil tahun ditutup ditolak');
r=g.call({action:'simpanPenandatangan',token:admin,tahun:T,list:[{jabatan:'KI KELOMPOK',nama:'Tetap Boleh'}]}); assert(r.ok,'penandatangan tetap boleh diubah: '+r.error);
r=g.call({action:'simpanConfig',token:admin,config:Object.assign({},cfgLengkap,{Status:'BUKA'})}); assert(r.ok,r.error);
assert.strictEqual(g.cfg_(T).Status,'BUKA','buka kembali berhasil'); assert.notStrictEqual(g.cfg_(T).Harga_Soq,99000,'membuka kembali tidak ikut mengubah harga');
r=g.call({action:'simpanAmil',token:admin,tahun:T,amil:{nama:'Amil Baru Fiktif',saham:1}}); assert(r.ok,'setelah dibuka, amil bisa diubah: '+r.error);
console.log('mustahiq: lulus');
