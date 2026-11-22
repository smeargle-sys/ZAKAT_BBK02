/** Baca data sensus (read-only) dari spreadsheet SENSUS BBK02. Di-cache 5 menit. */

function readSensus_(force) {
  // dalam satu request web, sensus cukup dibuka/diurai sekali
  if (!force && REQ_MEMO_ && REQ_MEMO_.__sensus) return REQ_MEMO_.__sensus;
  var out = bacaSensus_(force);
  if (REQ_MEMO_) REQ_MEMO_.__sensus = out;
  return out;
}

function bacaSensus_(force) {
  var cache = CacheService.getScriptCache();
  if (!force) {
    var c = cache.get('sensus_v1');
    if (c) return JSON.parse(c);
  }
  var ss = SpreadsheetApp.openById(APP.SENSUS_ID);
  var byHeader = function (sheetName) {
    var sh = ss.getSheetByName(sheetName);
    if (!sh || sh.getLastRow() < 2) return [];
    var v = sh.getDataRange().getValues();
    var h = v[0].map(String);
    return v.slice(1).filter(function (r) { return r.join('') !== ''; }).map(function (r) {
      var o = {}; h.forEach(function (k, i) { o[k] = r[i]; }); return o;
    });
  };
  var kel = byHeader(APP.SENSUS_SHEET_KELUARGA);
  var jm = byHeader(APP.SENSUS_SHEET_JAMAAH);
  var keluarga = kel.filter(function (k) { return k['ID Keluarga']; }).map(function (k) {
    return { id: String(k['ID Keluarga']), nama: String(k['Nama KK'] || ''), alamat: String(k['Alamat'] || '') };
  });
  var jamaah = jm.filter(function (j) { return j['ID Jamaah']; }).map(function (j) {
    return {
      id: String(j['ID Jamaah']), kk: String(j['ID Keluarga']), hub: String(j['Hubungan Keluarga'] || ''),
      nama: String(j['Nama Lengkap'] || ''), absen: String(j['Nama Absen'] || ''), jk: String(j['Jenis Kelamin'] || ''),
      umur: j['Umur'] === '' ? '' : Number(j['Umur']), keberadaan: String(j['Status Keberadaan'] || 'Menetap'),
      bantu: String(j['Perlu Dibantu'] || '')
    };
  });
  var out = { keluarga: keluarga, jamaah: jamaah, waktu: nowIso_() };
  try { cache.put('sensus_v1', JSON.stringify(out), 300); } catch (e) { /* >100KB: lewati cache */ }
  return out;
}

/** Jamaah yang sudah diarsip (pindah/wafat) — hanya untuk mencocokkan nama data lama. */
function readArsipSensus_() {
  var sh = SpreadsheetApp.openById(APP.SENSUS_ID).getSheetByName(APP.SENSUS_SHEET_ARSIP);
  if (!sh || sh.getLastRow() < 2) return [];
  var v = sh.getDataRange().getValues(), h = v[0].map(String);
  return v.slice(1).map(function (r) { var o = {}; h.forEach(function (k, i) { o[k] = r[i]; }); return o; })
    .filter(function (o) { return o['ID Jamaah']; })
    .map(function (o) { return { id: String(o['ID Jamaah']), kk: String(o['ID Keluarga']), hub: String(o['Hubungan Keluarga'] || ''), nama: String(o['Nama Lengkap'] || ''), absen: String(o['Nama Absen'] || '') }; });
}

/** Map ID Keluarga → {id, nama, anggota:[...]} */
function keluargaMap_(s) {
  var map = {};
  s.keluarga.forEach(function (k) { map[k.id] = { id: k.id, nama: k.nama, alamat: k.alamat, anggota: [] }; });
  s.jamaah.forEach(function (j) {
    // jamaah tanpa ID Keluarga di sensus → diperlakukan sebagai keluarga sendiri supaya tetap bisa dizakati
    var key = j.kk || ('TANPA-KK-' + j.id);
    if (!map[key]) map[key] = { id: key, nama: '', alamat: '', anggota: [], tanpaKK: !j.kk };
    map[key].anggota.push(j);
  });
  Object.keys(map).forEach(function (id) {
    var k = map[id];
    k.anggota.sort(function (a, b) { return a.hub < b.hub ? -1 : a.hub > b.hub ? 1 : (b.umur || 0) - (a.umur || 0); });
    if (!k.nama && k.anggota.length) k.nama = k.anggota[0].nama;
  });
  return map;
}
