// Cek sintaks semua file JS frontend & memuat semua .gs (urutan file tidak boleh berpengaruh).
const fs=require('fs'),path=require('path'),cp=require('child_process');
const web=path.join(__dirname,'../web');
fs.readdirSync(web).filter(f=>f.endsWith('.js')).forEach(f=>cp.execFileSync(process.execPath,['--check',path.join(web,f)],{stdio:'inherit'}));
const mock=require('./gas-mock.js'); mock(mock.sensusSS()); // throw bila .gs gagal dimuat
// .gs dimuat dalam urutan terbalik juga, untuk memastikan tidak ada ketergantungan urutan file
const vm=require('vm'),dir=path.join(__dirname,'../apps-script');
const ctx={console,Math,Date,JSON,String,Number,Object,Array,RegExp,isFinite,parseFloat,parseInt,isNaN,Error};vm.createContext(ctx);
fs.readdirSync(dir).filter(f=>f.endsWith('.gs')).reverse().forEach(f=>vm.runInContext(fs.readFileSync(path.join(dir,f),'utf8'),ctx,{filename:f}));
JSON.parse(fs.readFileSync(path.join(dir,'appsscript.json'),'utf8'));
console.log('check-syntax: lulus');
