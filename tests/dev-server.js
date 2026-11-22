// Server lokal untuk mencoba UI tanpa Google: node tests/dev-server.js lalu buka http://localhost:8787
// Backend = simulasi Apps Script di memori + data sensus sintetis. PIN uji: admin 111111, pengurus 333333, amil 222222/222223/222224.
const http=require('http'),fs=require('fs'),path=require('path'),mock=require('./gas-mock.js');
const g=mock(mock.sensusSS());
g.setupZakat(); g.simpanPengguna_({user:{nama:'Admin Uji',peran:'ADMIN',pin:'111111'}},null); g.simpanPengguna_({user:{nama:'Pengurus Uji',peran:'PENGURUS',pin:'333333'}},null);
const adm=g.call({action:'login',pin:'111111',device:'s'}).data.token;
['Hasan Basri','Ridwan Saleh','Arif Wibowo','Lukman Hakim'].forEach((n,i)=>g.call({action:'simpanAmil',token:adm,tahun:2027,amil:{nama:n,saham:1,pin:i<3?String(222222+i):''}}));
const amil=g.daftarAmil_(2027);
const list=g.call({action:'kkList',token:adm}).data.list;
let k=0;
list.slice(0,30).forEach((kk,i)=>{const jenis=i%3===0?'BERAS':'UANG';const n=kk.anggota.length;
  g.call({action:'simpanFitrah',token:adm,idAmil:amil[i%4].id,idKeluarga:kk.id,jm:kk.anggota.slice(0,i%5===0?n-1:n).map(a=>a.id),jenis,diterima:jenis==='UANG'?n*40000+(i%4===0?10000:i%7===0?-20000:0):0,tanggal:'2026-11-'+String(14+i%8).padStart(2,'0')});});
g.call({action:'simpanLain',token:adm,jenis:'TIJAROH',nama:'Joko Santoso',nominal:25000000,idAmil:amil[0].id});
g.call({action:'simpanLain',token:adm,jenis:'MAL',nama:'Ibu Mega Sari',nominal:10220000,idAmil:amil[1].id});
g.call({action:'simpanLain',token:adm,jenis:'FIDYAH',nama:'Ibu Kartini',nominal:120000,hari:3,idAmil:amil[2].id});
g.call({action:'simpanSerahUB',token:adm,idAmil:amil[0].id,nominal:20000,penerima:'Ketua UB'});
g.call({action:'simpanBeli',token:adm,kg:100,rupiah:1450000});
// tutup rekap mal kemarin agar contoh susulan muncul? biarkan.
const root=path.join(__dirname,'../web');
http.createServer((req,res)=>{
  if(req.method==='POST'&&req.url==='/api'){let b='';req.on('data',c=>b+=c);req.on('end',()=>{const out=g.doPost({postData:{contents:b}}).s;res.writeHead(200,{'Content-Type':'application/json'});res.end(out);});return;}
  let p=req.url.split('?')[0]; if(p==='/')p='/index.html';
  if(p==='/config.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end("window.ZAKAT_CONFIG={API_URL:'/api'};");return;}
  const f=path.join(root,p); if(!fs.existsSync(f)){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'Content-Type':p.endsWith('.css')?'text/css':p.endsWith('.js')?'text/javascript':'text/html'});res.end(fs.readFileSync(f));
}).listen(process.env.PORT||8787,()=>console.log('Dev server: http://localhost:'+(process.env.PORT||8787)));
