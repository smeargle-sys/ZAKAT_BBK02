/**
 * Baca data sensus (read-only) dari spreadsheet SENSUS BBK02.
 * Di-cache SENSUS_CACHE_DETIK dan dipecah per ±90 KB (batas CacheService 100 KB per key),
 * supaya sensus besar tetap ter-cache dan spreadsheet sensus tidak dibuka di setiap request.
 * Tombol "Muat ulang" (p.segar) memaksa baca ulang.
 */
var SENSUS_CACHE_DETIK = 1800;

function readSensus_(force) {
  // dalam satu request web, sensus cukup dibuka/diurai sekali
  if (REQ_MEMO_ && REQ_MEMO_.__segar && !REQ_MEMO_.__sensusSegar) { force = true; REQ_MEMO_.__sensusSegar = true; }
  if (!force && REQ_MEMO_ && REQ_MEMO_.__sensus) return REQ_MEMO_.__sensus;
  var out = bacaSensus_(force);
  if (REQ_MEMO_) REQ_MEMO_.__sensus = out;
  return out;
}

function bacaSensus_(force) {
  var cache = CacheService.getScriptCache();
  if (!force) {
    var c = cacheAmbilBesar_(cache, 'sensus_v2');
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
  cacheSimpanBesar_(cache, 'sensus_v2', JSON.stringify(out), SENSUS_CACHE_DETIK);
  return out;
}

/** Simpan string panjang ke CacheService dalam beberapa potongan. Gagal = diam (cache opsional). */
function cacheSimpanBesar_(cache, key, str, detik) {
  try {
    var n = Math.ceil(str.length / 90000), obj = {};
    if (n > 20) return; // >1,8 MB: terlalu besar, jangan di-cache
    for (var i = 0; i < n; i++) obj[key + '_' + i] = str.substr(i * 90000, 90000);
    obj[key + '_n'] = String(n);
    cache.putAll(obj, detik);
  } catch (e) { /* cache opsional */ }
}
function cacheAmbilBesar_(cache, key) {
  try {
    var n = Number(cache.get(key + '_n'));
    if (!n) return null;
    var keys = []; for (var i = 0; i < n; i++) keys.push(key + '_' + i);
    var got = cache.getAll(keys), out = '';
    for (var j = 0; j < n; j++) { if (got[keys[j]] === undefined || got[keys[j]] === null) return null; out += got[keys[j]]; }
    return out;
  } catch (e) { return null; }
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

/**
 * D-48 (usulan C): KK "tujuan" tiap setoran untuk label per KK (Sebagian / Kurang bayar) dan hitungan
 * "KK sudah setor", mengikuti sensus terbaru:
 *  - KK asal setoran bila masih ada di sensus (riwayat & penagihan kurang bayar tetap di KK asal);
 *  - bila KK asal sudah tidak ada (mis. kunci TANPA-KK-… setelah ID Keluarga dilengkapi), KK tempat
 *    sebagian besar jiwa setoran itu berada sekarang.
 * Status sudah/belum per jiwa tidak terpengaruh (selalu per ID Jamaah).
 * @return {Object} idSetoran -> ID Keluarga tujuan ('' bila tidak ada)
 */
function kkTujuanSetoran_(setoran, jiwa, sen, kel) {
  var kkJamaah = {};
  sen.jamaah.forEach(function (j) { kkJamaah[j.id] = j.kk || ('TANPA-KK-' + j.id); });
  var hitung = {};
  jiwa.forEach(function (j) {
    if (j.Tipe !== 'JM') return;
    var k = kkJamaah[String(j.Ref_ID)]; if (!k) return;
    var h = hitung[j.ID_Setoran] = hitung[j.ID_Setoran] || {};
    h[k] = (h[k] || 0) + 1;
  });
  var out = {};
  setoran.forEach(function (r) {
    var asal = String(r.ID_Keluarga || '');
    if (asal && kel[asal]) { out[String(r.ID)] = asal; return; }
    var h = hitung[r.ID] || {}, best = '', n = 0;
    Object.keys(h).forEach(function (k) { if (h[k] > n || (h[k] === n && k < best)) { best = k; n = h[k]; } });
    out[String(r.ID)] = best || asal;
  });
  return out;
}

/** Kunci TANPA-KK-<ID Jamaah> yang jamaahnya kini punya ID Keluarga diarahkan ke KK barunya (D-48). */
function resolusiKK_(id, sen, kel) {
  id = String(id || '');
  if (!id || kel[id] || id.indexOf('TANPA-KK-') !== 0) return id;
  var jid = id.slice(9), j = null;
  sen.jamaah.some(function (x) { if (x.id === jid) { j = x; return true; } return false; });
  return j && j.kk && kel[j.kk] ? j.kk : id;
}
