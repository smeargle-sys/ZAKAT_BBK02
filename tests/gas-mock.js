const fs=require('fs'),vm=require('vm'),crypto=require('crypto');
function makeSheet(name,data){const sh={name,data:data||[],frozen:0,
 getName(){return name},getLastRow(){let n=sh.data.length;while(n>0&&sh.data[n-1].every(v=>v===''||v===null||v===undefined))n--;return n},
 getLastColumn(){return sh.data.reduce((m,r)=>{let n=r.length;while(n>0&&(r[n-1]===''||r[n-1]===undefined))n--;return Math.max(m,n)},0)},
 getMaxRows(){return Math.max(1000,sh.data.length)},
 setFrozenRows(n){sh.frozen=n},
 deleteRow(r){sh.data.splice(r-1,1)},
 getDataRange(){return sh.getRange(1,1,Math.max(1,sh.getLastRow()),Math.max(1,sh.getLastColumn()))},
 getRange(r,c,nr,nc){nr=nr||1;nc=nc||1;const rg={
  getValues(){const out=[];for(let i=0;i<nr;i++){const row=[];for(let j=0;j<nc;j++){const v=(sh.data[r-1+i]||[])[c-1+j];row.push(v===undefined||v===null?'':v)}out.push(row)}return out},
  setValues(v){for(let i=0;i<nr;i++){while(sh.data.length<r+i)sh.data.push([]);const row=sh.data[r-1+i];for(let j=0;j<nc;j++){while(row.length<c-1+j)row.push('');let x=v[i][j];if(typeof x==='string'&&x[0]==="'")x=x.slice(1);row[c-1+j]=x}}return rg},
  setNumberFormat(){return rg},setFontWeight(){return rg},setBackground(){return rg}};return rg}};return sh}
function makeSS(sheets){const ss={sheets:sheets||[],getSheetByName(n){return ss.sheets.find(s=>s.name===n)||null},insertSheet(n){const s=makeSheet(n);ss.sheets.push(s);return s},getSheets(){return ss.sheets},deleteSheet(s){ss.sheets=ss.sheets.filter(x=>x!==s)},toast(){}};return ss}
module.exports=function(sensusSS,openByIdExtra){
 const active=makeSS([makeSheet('Sheet1')]);
 const cache=new Map(),props=new Map();
 const ctx={console,Math,Date,JSON,String,Number,Object,Array,RegExp,isFinite,parseFloat,parseInt,isNaN,Error,
  Utilities:{formatDate:(d,tz,f)=>{const p=n=>String(n).padStart(2,'0');const j=new Date(d.getTime()+7*3600e3);
   return f.replace('yyyy',j.getUTCFullYear()).replace('yy',String(j.getUTCFullYear()).slice(2)).replace('MM',p(j.getUTCMonth()+1)).replace('dd',p(j.getUTCDate())).replace('HH',p(j.getUTCHours())).replace('mm',p(j.getUTCMinutes())).replace('ss',p(j.getUTCSeconds())).replace(/'T'/,'T');},
   computeDigest:(a,s)=>Array.from(crypto.createHash('sha256').update(s,'utf8').digest()).map(b=>b>127?b-256:b),DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1},getUuid:()=>crypto.randomUUID()},
  SpreadsheetApp:{getActiveSpreadsheet:()=>active,getActive:()=>active,openById:(id)=>id==='1jgTL5COMzaDnvnnOTL_0DhQOlycHFaSS7HavLhR7IW0'?sensusSS:(openByIdExtra&&openByIdExtra(id)),getUi:()=>({alert(){},prompt(){},ButtonSet:{},Button:{}})},
  CacheService:{getScriptCache:()=>({get:k=>cache.has(k)?cache.get(k):null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
  PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.has(k)?props.get(k):null,setProperty:(k,v)=>props.set(k,v)})},
  LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){}})},
  ContentService:{createTextOutput:s=>({s,setMimeType(){return this}}),MimeType:{JSON:'json'}},
  MimeType:{GOOGLE_SHEETS:'gs'}};
 vm.createContext(ctx);
 const dir=__dirname+'/../apps-script/';
 for(const f of fs.readdirSync(dir).filter(f=>f.endsWith('.gs'))) vm.runInContext(fs.readFileSync(dir+f,'utf8'),ctx,{filename:f});
 ctx.__active=active;ctx.__makeSheet=makeSheet;ctx.__makeSS=makeSS;
 ctx.call=(p)=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(p)}}).s);
 return ctx;
};
module.exports.makeSheet=makeSheet;module.exports.makeSS=makeSS;

/** Spreadsheet sensus tiruan dari fixture sintetis. */
module.exports.sensusSS=function(){
  const f=require('./fixtures/sensus-fixture.js').buildSensus();
  return module.exports.makeSS([module.exports.makeSheet('Jamaah',f.jamaah),module.exports.makeSheet('Keluarga',f.keluarga),module.exports.makeSheet('Arsip_Jamaah',f.arsip)]);
};
