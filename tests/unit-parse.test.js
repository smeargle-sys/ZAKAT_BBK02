// Unit test fungsi murni: angka, tanggal, pembulatan, parser sheet lama, pencocok nama. Semua nama fiktif.
const mock=require('./gas-mock.js'),assert=require('assert');
const g=mock(mock.sensusSS());
let n=0; const ok=(c,m)=>{assert(c,m);n++;};
// num_
[['1,080,000',1080000],['40.000',40000],['2.7',2.7],['2,7',2.7],[' (100,000)',-100000],[' - ',0],['345.6',345.6],[150000,150000],['Rp 1.500.000',1500000]].forEach(([a,b])=>{assert.strictEqual(g.num_(a),b,'num '+a);n++;});
// tanggal
assert.strictEqual(g.toDateStr_('10 Mar',2026),'2026-03-10');
assert.strictEqual(g.toDateStr_('22 March 2025',2025),'2025-03-22');
assert.strictEqual(g.toDateStr_(new Date('2024-04-05T00:00:00+07:00')),'2024-04-05'); n+=3;
// pembulatan sisa terbesar: total selalu pas
const sp=g.splitLargestRemainder_(324,[{key:'a',pct:40},{key:'b',pct:45},{key:'c',pct:11},{key:'d',pct:3},{key:'e',pct:1}]);
assert.deepStrictEqual(JSON.parse(JSON.stringify(sp)),{a:129,b:146,c:36,d:10,e:3}); n++;
const sp2=g.splitLargestRemainder_(266620000,[{key:'a',pct:40},{key:'b',pct:45},{key:'c',pct:8},{key:'d',pct:4},{key:'e',pct:3}]);
assert.deepStrictEqual(JSON.parse(JSON.stringify(sp2)),{a:106648000,b:119979000,c:21329600,d:10664800,e:7998600}); n++;
// parser format B (2025/2026)
const B=[['MUZAKKI ZAKAT FITRAH 1447 H / 2026 M'],['BABAKAN BARAT'],
 ['No','','','Jumlah Soq','','','','Jenis Titipan','','',' Jumlah Titip Uang ','','',' Keterangan ','Nama SM'],
 ['#','Nama','Amil yang Menerima','JM BBK','JM LUAR TITIP ZAKAT','SM','TOTAL (Soq)','Zakat (Beras/ Uang)','','Tgl Setor',' Byr Ke Amil ',' Byr Ke UB ',' Kembalian ',' Jumlah Bayar ','Nama SM'],
 [1,'Ahmad Fauzan','Bpk.H. Hasan Basri',5,'','',5,'Titip Uang',5,'10 Mar',200000,'',0,200000],
 [2,'Yusuf Hamdani','Bpk. Ridwan',3,'','',3,'Beras',3,'13 Mar',0,'',0,''],
 [3,'Imam Prasetyo','Bpk.H. Hasan Basri',5,'','',5,'Titip Uang',5,'16 Mar',200000,'',50000,250000],
 [4,'Lukman Hakim','Bpk.Arif W',1,'',1,2,'Titip Uang',2,'14 Mar',80000,'',0,80000,'Sinta','Pembayaran Fidyah 40.000'],
 [5,'Bambang Sutrisno','','','','',0,'',0,'',0,'',0,''],
 [6,'Dedi Kurniawan','Titip Uang',1,'','',1,'Beras','','13 Mar',0,'',0,''],
 [7,'Eko Saputra','Bpk. Ridwan',4,'','',4,'Titip Uang','','13 Mar',160000,'',-100000,60000],
 [8,'Gunawan Hadi','Bpk.Arif W','','','',0,'Zakat di Kampung','','',0,'',0,''],
 [9,'Tono Wibisana','Bpk. Ridwan','','',4,4,'Titip Uang','','15 Mar',160000,'',40000,200000],
 ['','Jamaah + SM yg Zakat (- Zakat di Kampung)','',19,0,5,24,'','','',600000,0,-10000,590000]];
const rb=g.parseMuzakki_(B,2026);
ok(rb.rows.length===9,'9 baris');
ok(rb.rows.find(r=>r.nama==='Bambang Sutrisno').status==='TIDAK_SETOR','tidak setor');
ok(rb.rows.find(r=>r.nama==='Lukman Hakim').fidyah===40000,'fidyah dari keterangan');
ok(rb.rows.find(r=>r.nama==='Dedi Kurniawan').amilRaw==='','kolom amil salah isi dikosongkan');
ok(rb.rows.find(r=>r.nama==='Eko Saputra').kembalian===-100000,'kurang bayar');
ok(rb.rekap.total===24&&rb.rekap.byrAmil===600000,'baris rekap terbaca');
// parser format A (2024)
const A=[['MUZAKKI ZAKAT FITRAH 1445 H / 2024 M'],['BABAKAN BARAT'],
 ['No','Nama','Jenis Zakat','Jumlah Sok','','','','Jenis Titipan','','Amil Yang','',' Jumlah Titip Uang ','','',' Keterangan ','Nama SM'],
 ['','','Zakat Beras/ Titip Uang','JM BBK','JM TITIP ZAKAT','SM','TOTAL',' (Beras/ Uang)','','Menerima','Tgl Setor',' Byr Ke Amil ',' Byr Ke UB ',' Kembalian ',' Keterangan Bayar ','Nama SM'],
 [1,'Hendra Wijaya','Titip Uang',2,'',1,3,'Titip Uang',3,'Bpk. Ridwan','',135000,'',15000,150000,''],
 [2,'Irfan Maulana','Beras',8,'','',8,'Beras',8,'Bpk.Arif W',new Date('2024-03-29T00:00:00+07:00'),0,'',0,''],
 ['','Jamaah + SM yg Zakat','',10,0,1,11,'','','','',135000,0,15000,150000]];
const ra=g.parseMuzakki_(A,2024);
ok(ra.kolom.amil===9&&ra.kolom.jenis===7&&ra.rows.length===2,'format 2024');
ok(ra.rows[1].tanggal==='2024-03-29','tanggal Date');
// zakat mal
const M=[['','','DAFTAR PENERIMAAN'],['','A','PENERIMAAN :'],['','','No','Nama','Kelompok','Jumlah Zakat','Keterangan'],
 ['','',1,'BPK. JOKO SANTOSO','Babakan Barat',150000000,'TIJAROH'],['','',2,'IBU. MEGA SARI','Babakan Barat',10220000,'MAL'],['','',3,'Bpk. Lutfi Hakim','Babakan Barat',12000000,'TIJAROH + MAL'],
 ['','',4,'','','',''],['','JUMLAH ZAKAT MAL TIJAROH (2025)','','','',172220000]];
const rm=g.parseMal_(M,'UTAMA');
ok(rm.rows.length===3&&rm.rows[2].jenis==='MAL_TIJAROH'&&rm.rekap.total===172220000,'mal & campuran');
// bagian amil
const AM=[['BAGIAN AMIL KELOMPOK - ZAKAT MAL','','31,169,400'],['NO','NAMA AMIL','SAHAM','BAGIAN','PEMBULATAN'],[1,'H. HASAN BASRI',1,3896175,4450000],[2,'RIDWAN SALEH',1,3896175,3800000],['','',8,31169400,31050000],
 ['BAGIAN AMIL KELOMPOK - ZAKAT MAL','','(SUSULAN)','',1300000],['NO','NAMA AMIL','SAHAM','BAGIAN','PEMBULATAN'],[1,'H. HASAN BASRI',1,162500,160000],
 ['BAGIAN AMIL KELOMPOK - ZAKAT FITRAH','',36],['NO','NAMA AMIL','SAHAM','BAGIAN','PEMBULATAN'],[1,'H. HASAN BASRI',1,4.5,'-'],[2,'RIDWAN SALEH',1,4.5,'-']];
const pa=g.parseAmil_(AM);
ok(pa.length===3&&pa[1].lampiran==='SUSULAN'&&pa[2].items[0].final===4.5&&pa[0].items[0].final===4450000,'blok bagian amil');
// pencocok nama
const amilK=['H. Hasan Basri','Ridwan Saleh','Arif Wibowo','Nurdin Amin','A.R Fadli'].map((x,i)=>({id:'A'+i,nama:x,tipe:'JM'}));
ok(g.matchName_('Bpk.H. Hasan Basri',amilK).kandidat.nama==='H. Hasan Basri','gelar diabaikan');
ok(g.matchName_('Bpk. Amin',amilK).kandidat.nama==='Nurdin Amin','nama pendek');
ok(g.matchName_('Bpk.Ar Fadli',amilK).status==='COCOK','singkatan');
console.log('unit-parse: '+n+' cek lulus');
