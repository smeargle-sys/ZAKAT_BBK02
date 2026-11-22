// Test impor data lama (format 2025/2026) dengan nama fiktif: total harus sama dengan rekap, aman diulang, review diterapkan.
const mock=require('./gas-mock.js'),assert=require('assert');
const log=(...a)=>{ if(process.env.VERBOSE) console.log(...a); };
const H1=['No','','','Jumlah Soq','','','','Jenis Titipan','','',' Jumlah Titip Uang ','','',' Keterangan ','Nama SM'];
const H2=['#','Nama','Amil yang Menerima','JM BBK','JM LUAR TITIP ZAKAT','SM','TOTAL (Soq)','Zakat (Beras/ Uang)','','Tgl Setor',' Byr Ke Amil ',' Byr Ke UB ',' Kembalian ',' Jumlah Bayar ','Nama SM'];
const R=[
 [1,'Ahmad Fauzan','Bpk.H. Hasan Basri',5,'','',5,'Titip Uang',5,'10 Mar',200000,'',0,200000],
 [2,'Yusuf Hamdani','Bpk. Ridwan',3,'','',3,'Beras',3,'13 Mar',0,'',0,''],
 [3,'Imam Prasetyo','Bpk.H. Hasan Basri',5,'','',5,'Titip Uang',5,'16 Mar',200000,'',50000,250000],
 [4,'Lukman Hakim','Bpk.Arif Wibowo',1,'',1,2,'Titip Uang',2,'14 Mar',80000,'',0,80000,'Sinta','Pembayaran Fidyah 40.000'],
 [5,'Bambang Sutrisno','','','','',0,'',0,'',0,'',0,''],
 [6,'Hendra Wijaya','Bpk. Ridwan',6,'',1,7,'Beras',7,'14 Mar',0,'',0,''],
 [7,'Hj. Ratna Dewi','Bpk.Arif Wibowo',4,'',1,5,'Titip Uang',5,'14 Mar',200000,'',140000,340000,'Sukma'],
 [8,'Dedi Kurniawan','Titip Uang',1,'','',1,'Beras','','13 Mar',0,'',0,''],
 [9,'M. TAUFIK RAHMAN','Bpk. Ridwan',4,'','',4,'Titip Uang','','13 Mar',160000,'',-100000,60000],
 [10,'GUNAWAN HADI','Bpk.Arif Wibowo','','','',0,'Zakat di Kampung','','',0,'',0,''],
 [11,'Tono Wibisana','Bpk. Ridwan','','',4,4,'Titip Uang','','15 Mar',160000,'',40000,200000],
 [12,'Darsono','','5','','',5,'Titip Uang','','16 Mar',200000,'',0,200000],
 [13,'Irfan Maulan','','1','','',1,'Titip Uang','','16 Mar',40000,'',-40000,''],
];
const sumCol=i=>R.filter(r=>r[7]!=='Zakat di Kampung').reduce((a,r)=>a+(Number(r[i])||0),0);
const rek=['','Jamaah + SM yg Zakat (- Zakat di Kampung)','',sumCol(3),0,sumCol(5),sumCol(6),'','','',sumCol(10),0,sumCol(12),sumCol(13)];
const muz=mock.makeSheet('DATA MUZAKKI - ZAKAT FITRAH',[['MUZAKKI ZAKAT FITRAH 1447 H / 2026 M'],['BABAKAN BARAT'],H1,H2].concat(R,[rek]));
const malRows=[['BPK. JOKO SANTOSO',150000000,'TIJAROH'],['IBU. MEGA SARI',10220000,'MAL'],['BPK. LUTFI HAKIM',15000000,'MAL'],['BPK. ANDI F',12000000,'MAL'],['BPK. ZAINAL ARIFIN',60000000,'MAL']];
const mal=mock.makeSheet('Zakat Maal ',[['','','DAFTAR PENERIMAAN'],['','A','PENERIMAAN :'],['','','No','Nama','Kelompok','Jumlah Zakat','Keterangan']]
  .concat(malRows.map((m,i)=>['','',i+1,m[0],'Babakan Barat',m[1],m[2]])).concat([['','','JUMLAH ZAKAT MAL TIJAROH (2026)','','',malRows.reduce((a,m)=>a+m[1],0)]]));
const amilNames=['H. HASAN BASRI','RIDWAN SALEH','ARIF WIBOWO'];
const am=mock.makeSheet('MUSTAHIQ AMIL',[['BAGIAN AMIL KELOMPOK - ZAKAT MAL','','1,000,000'],['NO','NAMA AMIL','SAHAM','BAGIAN','PEMBULATAN']].concat(amilNames.map((n,i)=>[i+1,n,1,333333,''])).concat([['','',3,1000000,0],
 ['BAGIAN AMIL KELOMPOK - ZAKAT FITRAH','',6],['NO','NAMA AMIL','SAHAM','BAGIAN','PEMBULATAN']]).concat(amilNames.map((n,i)=>[i+1,n,1,2,2])));
const conv=mock.makeSS([mock.makeSheet('Zakat Fitrah'),mal,muz,am]);
const g=mock(mock.sensusSS(),id=>id==='tmp2026'?conv:null);
g.Drive={Files:{create:()=>({id:'tmp2026'})}}; g.DriveApp={getFileById:()=>({getBlob:()=>({}),setTrashed:()=>{}})};
g.setupZakat();
const res=g.imporTahun_(2026,'x'); log(res);
const logs=g.readTable_('Impor_Log').rows; logs.forEach(r=>log(' ',r.Cek,'|',r.Hasil_Impor,'|',r.Rekap_Sheet_Lama,'|',r.Status));
assert(logs.length>=6 && logs.every(r=>r.Status==='SAMA'),'semua total harus SAMA dengan rekap sheet lama');
const review=g.readTable_('Impor_Review').rows; review.forEach(r=>log(' review',r.Nama_Asli,r.Status,r.Saran_Nama,r.Jadikan_SM));
assert(review.some(r=>r.Nama_Asli==='Bambang Sutrisno'&&r.Status==='TIDAK_SETOR'));
assert(review.some(r=>r.Nama_Asli==='Tono Wibisana'&&r.Jadikan_SM==='Y?'));
assert(review.some(r=>r.Nama_Asli==='Dedi Kurniawan'),'kolom amil salah isi masuk review');
const s=g.readTable_('Setoran_Fitrah').rows;
assert.strictEqual(s.length,12);
assert.strictEqual(g.daftarAmil_(2026).length,3);
assert(s.find(r=>r.Nama_Muzakki==='Ahmad Fauzan').Match_Status==='COCOK');
assert(g.readTable_('Zakat_Lain').rows.some(r=>r.Jenis==='FIDYAH'&&r.Nominal===40000));
g.imporTahun_(2026,'x'); assert.strictEqual(g.readTable_('Setoran_Fitrah').rows.length,s.length,'impor ulang tidak boleh dobel');
const tR=g.readTable_('Impor_Review'); g.updateObject_(tR,tR.rows.find(r=>r.Nama_Asli==='Tono Wibisana'),{Jadikan_SM:'Y'});
g.terapkanReviewImpor(); assert(g.daftarSimpatisan_().some(m=>m.nama==='Tono Wibisana'));
g.simpanPengguna_({user:{nama:'Admin Uji',peran:'ADMIN',pin:'111111'}},null); g.simpanPengguna_({user:{nama:'Pengurus Uji',peran:'PENGURUS',pin:'333333'}},null);
const tok=g.call({action:'login',pin:'333333',device:'p'}).data.token;
const d=g.call({action:'dashboard',token:tok,tahun:2026}); assert(d.ok,d.error);
assert.strictEqual(d.data.fitrah.soqDiterima,sumCol(6));
assert.strictEqual(d.data.malTotal,malRows.reduce((a,m)=>a+m[1],0));
const tr=g.call({action:'tren',token:tok}); assert(tr.ok&&tr.data.find(x=>x.tahun===2026).fitrah.setoran===12);
console.log('e2e-import: lulus');
