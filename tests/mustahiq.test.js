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
assert.strictEqual(d.jiwa,pilih.length+kkPenuh.length+3);
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
console.log('mustahiq: lulus');
