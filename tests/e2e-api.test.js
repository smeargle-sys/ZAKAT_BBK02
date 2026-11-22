// Test ujung-ke-ujung API (simulasi Apps Script + spreadsheet di memori, data sensus sintetis).
const mock=require('./gas-mock.js'),assert=require('assert');
const log=(...a)=>{ if(process.env.VERBOSE) console.log(...a); };
const g=mock(mock.sensusSS());
g.setupZakat();
log('sheets:',g.__active.getSheets().map(s=>s.name).join(', '));
const cfgRows=g.configs_(); log('config tahun:',cfgRows.map(c=>c.Tahun+' '+c.Status+' '+c.Batas_Fitrah).join(' | '));
// batas 2027 di masa depan → set supaya test berjalan (hari ini 2026-11-22)
g.simpanPengguna_({user:{nama:'Admin Uji',peran:'ADMIN',pin:'111111'}},null); g.simpanPengguna_({user:{nama:'Pak Ketua',peran:'PENGURUS',pin:'333333'}},null);
assert.throws(()=>g.simpanPengguna_({user:{nama:'Dobel',peran:'PENGURUS',pin:'333333'}},null),/sudah dipakai/);
let r=g.call({action:'login',pin:'000000',device:'t'}); assert(!r.ok); log('pin salah:',r.error);
r=g.call({action:'login',pin:'111111',device:'t'}); assert(r.ok); const admin=r.data.token;
// tambah amil via API
const kel=g.keluargaMap_(g.readSensus_());
const kkIds=Object.keys(kel);
r=g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:'H. Hasan Basri',jabatan:'Ketua',saham:1,pin:'444444'}}); assert(r.ok,r.error);
r=g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:'Amil Dobel',saham:1,pin:'111111'}}); assert(!r.ok); log('pin amil bentrok:',r.error);
r=g.call({action:'simpanAmil',token:admin,tahun:2027,amil:{nama:'Nurdin Amin',saham:1,pin:'222222'}}); assert(r.ok,r.error);
const amil=r.data; log('amil:',amil.map(a=>a.nama).join(', '));
// login amil: step pilih nama
r=g.call({action:'login',pin:'222222',device:'h'}); assert(r.ok,r.error); assert.strictEqual(r.data.role,'amil'); assert.strictEqual(r.data.nama,'Nurdin Amin'); const amilTok=r.data.token; log('amil login via PIN →',r.data.nama, '| punyaPin', JSON.stringify(amil.map(a=>a.punyaPin)));
r=g.call({action:'login',pin:'111111',device:'h2'}); log('admin login →',r.data.role,r.data.nama);
// pengurus tidak boleh input
r=g.call({action:'login',pin:'333333',device:'p'}); const peng=r.data.token;
r=g.call({action:'simpanFitrah',token:peng}); assert(!r.ok); log('pengurus input ditolak:',r.error);
// kkList
r=g.call({action:'kkList',token:amilTok}); assert(r.ok,r.error); const list=r.data.list; log('KK:',list.length,'contoh',list[0].nama,list[0].jiwa+' jiwa',list[0].status);
const kk=list.find(k=>k.jiwa>=4);
// simpatisan terkait KK
r=g.call({action:'simpanSimpatisan',token:amilTok,sm:{nama:'Darmo Suwito',idKeluarga:kk.id,hubungan:'Saudara jauh'}}); assert(r.ok,r.error); const smId=r.data.id;
// setoran UANG dengan lebih bayar
const jm=kk.anggota.map(a=>a.id);
r=g.call({action:'simpanFitrah',token:amilTok,idKeluarga:kk.id,jm:jm,sm:[smId],luar:0,jenis:'UANG',diterima:(jm.length+1)*40000+10000,tanggal:'2026-11-22'}); assert(r.ok,r.error); log('fitrah uang:',r.data);
assert.strictEqual(r.data.selisih,10000); assert.strictEqual(r.data.tujuan,'UB');
// duplikat ditolak
r=g.call({action:'simpanFitrah',token:amilTok,idKeluarga:kk.id,jm:[jm[0]],jenis:'BERAS'}); assert(!r.ok); log('duplikat:',r.error);
// KK kedua beras, KK ketiga kurang bayar
const kk2=list.find(k=>k.id!==kk.id&&k.jiwa>=3), kk3=list.find(k=>k.id!==kk.id&&k.id!==kk2.id&&k.jiwa>=2);
r=g.call({action:'simpanFitrah',token:amilTok,idKeluarga:kk2.id,jm:kk2.anggota.map(a=>a.id),jenis:'BERAS',diterima:0}); assert(r.ok,r.error); log('fitrah beras kg:',r.data.kg);
r=g.call({action:'simpanFitrah',token:admin,idAmil:amil[0].id,idKeluarga:kk3.id,jm:[kk3.anggota[0].id],luar:1,luarNama:'Pak X',jenis:'UANG',diterima:50000,fidyah:{nominal:120000,hari:3}}); assert(r.ok,r.error); log('fitrah kurang:',r.data.status,r.data.selisih);
// simpatisan berdiri sendiri
r=g.call({action:'simpanSimpatisan',token:amilTok,sm:{nama:'Joko Prasetyo'}}); const sm2=r.data.id;
r=g.call({action:'simpanFitrah',token:amilTok,idKeluarga:'',namaMuzakki:'Joko Prasetyo',sm:[sm2],jenis:'KAMPUNG'}); assert(r.ok,r.error);
// mal utama & susulan
r=g.call({action:'simpanLain',token:amilTok,jenis:'TIJAROH',nama:'Joko Santoso',nominal:25000000,tanggal:'2026-11-22'}); assert(r.ok,r.error); log('tijaroh lampiran:',r.data.lampiran);
r=g.call({action:'simpanLain',token:amilTok,jenis:'MAL',nama:'Ibu Mega Sari',nominal:10000000,tanggal:'2027-03-15'}); assert(r.ok); log('mal setelah tutup rekap:',r.data.lampiran); assert.strictEqual(r.data.lampiran,'SUSULAN');
r=g.call({action:'simpanLain',token:amilTok,jenis:'MAL_TIJAROH',nama:'Bpk Hendra',nominal:3333333}); assert(r.ok);
// batas fitrah lewat → amil ditolak, admin boleh dgn tanggal ≤ batas
let t=g.readTable_('Config_Tahun'); let row=t.rows.find(x=>String(x.Tahun)==='2027'); g.updateObject_(t,row,{Batas_Fitrah:'2026-11-01 06:00'});
r=g.call({action:'simpanFitrah',token:amilTok,idKeluarga:kk2.id,jm:[],sm:[],luar:1,jenis:'BERAS'}); assert(!r.ok); log('lewat batas (amil):',r.error);
r=g.call({action:'simpanFitrah',token:admin,idAmil:amil[0].id,idKeluarga:list[5].id,jm:[list[5].anggota[0].id],jenis:'BERAS',tanggal:'2026-11-02'}); assert(!r.ok); log('admin tanggal > batas:',r.error);
r=g.call({action:'simpanFitrah',token:admin,idAmil:amil[0].id,idKeluarga:list[5].id,jm:[list[5].anggota[0].id],jenis:'BERAS',tanggal:'2026-10-31'}); assert(r.ok,r.error); log('admin backfill ok');
g.updateObject_(t,row,{Batas_Fitrah:'2027-03-10 06:00'});
// serah UB, beli beras, bagian amil
r=g.call({action:'simpanSerahUB',token:amilTok,nominal:5000,penerima:'Ketua UB'}); assert(r.ok,r.error);
r=g.call({action:'simpanBeli',token:admin,kg:10.5,rupiah:150000}); assert(r.ok,r.error);
// dashboard
r=g.call({action:'dashboard',token:peng}); assert(r.ok,r.error); const d=r.data;
log('DASH fitrah:',JSON.stringify(d.fitrah));
log('DASH jiwaSensus',d.jiwaSensus,'kkSensus',d.kkSensus,'kkSetor',d.kkSetor,'partisipasi',d.partisipasi.toFixed(3),'mal',d.malTotal,'fidyah',JSON.stringify(d.fidyah));
log('DASH pembagianFitrah',JSON.stringify(d.pembagianFitrah.map(x=>x.key+':'+x.soq)));
log('DASH mal UTAMA',JSON.stringify(d.pembagianMal.UTAMA.setor),'SUSULAN',JSON.stringify(d.pembagianMal.SUSULAN.setor));
log('DASH ub',JSON.stringify(d.ub)); log('DASH beras',JSON.stringify({k:d.beras.kebutuhanKg,b:d.beras.dibeliKg,s:d.beras.sisaDana}));
log('DASH perAmil',JSON.stringify(d.perAmil.map(a=>[a.nama,a.kk,a.beras,a.uang,a.rp,a.lebihUB,a.serahUB])));
log('DASH belum',d.belum.length,'jiwaBelum',d.jiwaBelum,'harian',JSON.stringify(d.harian));
assert.strictEqual(d.pembagianFitrah.reduce((a,x)=>a+x.soq,0),d.fitrah.soqDiterima);
assert.strictEqual(d.ub.terkumpul,10000); assert.strictEqual(d.ub.dipegang,5000);
// bagian amil musyawarah
const b=d.bagianAmil.UTAMA; log('bagian pool',b.poolSoq,b.poolRp,JSON.stringify(b.items));
r=g.call({action:'simpanBagianAmil',token:admin,tahun:2027,lampiran:'UTAMA',items:b.items.map(i=>({idAmil:i.idAmil,nama:i.nama,beras:Math.floor(i.hitBeras),uang:Math.floor(i.hitUang/10000)*10000})),catatan:'Musyawarah: sisa untuk kas amil'}); assert(r.ok,r.error);
r=g.call({action:'dashboard',token:admin}); log('setelah musyawarah sisa',r.data.bagianAmil.UTAMA.sisaRp,r.data.bagianAmil.UTAMA.sisaSoq);
// edit setoran & hapus
const set=g.call({action:'daftarSetoran',token:admin}).data; log('daftar setoran:',set.length);
const f1=set.find(x=>x.kelas==='FITRAH'&&x.status==='KURANG');
let ed=g.call({action:'getFitrah',token:admin,id:f1.id}).data;
r=g.call({action:'simpanFitrah',token:admin,id:f1.id,idAmil:amil[0].id,idKeluarga:ed.setoran.ID_Keluarga,jm:ed.jm,luar:1,jenis:'UANG',diterima:80000}); assert(r.ok,r.error); log('edit → status',r.data.status);
r=g.call({action:'hapusLain',token:admin,id:set.find(x=>x.jenis==='MAL_TIJAROH').id}); assert(r.ok);
r=g.call({action:'hapusFitrah',token:amilTok,id:f1.id}); assert(!r.ok); log('amil hapus ditolak:',r.error);
// config simpan validasi
r=g.call({action:'simpanConfig',token:admin,config:{Tahun:2027,F_Sabilillah:40,F_Mustahiq:45,F_AmilKlp:11,F_AmilDesa:3,F_AmilDaerah:2,M_Sabilillah:40,M_Mustahiq:45,M_AmilKlp:8,M_AmilDesa:4,M_AmilDaerah:3,Harga_Soq:42000,Kg_Per_Soq:2.7}}); assert(!r.ok); log('validasi %:',r.error);
r=g.call({action:'simpanConfig',token:admin,config:{Tahun:2027,F_Sabilillah:40,F_Mustahiq:45,F_AmilKlp:11,F_AmilDesa:3,F_AmilDaerah:1,M_Sabilillah:40,M_Mustahiq:45,M_AmilKlp:8,M_AmilDesa:4,M_AmilDaerah:3,Harga_Soq:'42.000',Kg_Per_Soq:'2,7',Tarif_Fidyah:'40.000'}}); assert(r.ok,r.error);
log('config 2027 harga',g.cfg_(2027).Harga_Soq,'kg',g.cfg_(2027).Kg_Per_Soq,'fidyah',g.cfg_(2027).Tarif_Fidyah);
// tren
r=g.call({action:'tren',token:peng}); assert(r.ok,r.error); log('tren tahun:',r.data.map(x=>x.tahun+(x.error?' ERR '+x.error:' setoran='+x.fitrah.setoran)).join(' | '));
// tahun baru
r=g.call({action:'tahunBaru',token:admin}); assert(r.ok,r.error); log('tahun baru:',r.data.map(c=>c.Tahun+':'+c.Status+':'+c.Hijriah).join(' '), 'amil 2028:',g.daftarAmil_(2028).length);
r=g.call({action:'login',pin:'222222',device:'h3'}); assert(r.ok&&r.data.nama==='Nurdin Amin'); log('PIN amil terbawa ke 2028 ok');
// pengguna: admin terakhir tidak boleh dinonaktifkan
const us=g.call({action:'daftarPengguna',token:admin}).data; const adm=us.find(u=>u.peran==='ADMIN');
r=g.call({action:'simpanPengguna',token:admin,user:{id:adm.id,nama:adm.nama,peran:'ADMIN',aktif:false}}); assert(!r.ok); log('admin terakhir:',r.error);
r=g.call({action:'simpanPengguna',token:admin,user:{nama:'Bendahara',peran:'ADMIN',pin:'555555'}}); assert(r.ok,r.error);
r=g.call({action:'login',pin:'555555',device:'h4'}); assert(r.ok&&r.data.nama==='Bendahara'&&r.data.role==='admin');
// sesi habis
r=g.call({action:'dashboard',token:'salah'}); assert(r.sesiHabis); 
console.log('e2e-api: lulus');
