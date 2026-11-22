/** Utilitas sheet, angka, tanggal. */

function ss_() { return SpreadsheetApp.getActiveSpreadsheet(); }

function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Sheet "' + name + '" belum ada. Jalankan menu Zakat › Setup dulu.');
  return sh;
}

/**
 * Cache tabel per request web (diaktifkan handle_). Satu request cukup membaca tiap sheet sekali.
 * null = nonaktif (menu spreadsheet, impor, setup). Dikosongkan saat masuk/keluar withLock_
 * dan saat tabel ditulis, supaya cek duplikat di dalam lock selalu membaca data terbaru.
 */
var REQ_MEMO_ = null;
function memoReset_(aktif) { REQ_MEMO_ = aktif ? {} : null; }
function memoBuang_(name) {
  if (!REQ_MEMO_) return;
  if (name) { delete REQ_MEMO_[name]; return; }
  var sen = REQ_MEMO_.__sensus; // sensus hanya dibaca (tidak pernah ditulis aplikasi), aman dipertahankan
  REQ_MEMO_ = {}; if (sen) REQ_MEMO_.__sensus = sen;
}

/** Baca sheet sebagai array objek (key = header). Tiap objek punya _row (nomor baris di sheet). */
function readTable_(name) {
  if (REQ_MEMO_ && REQ_MEMO_[name]) return REQ_MEMO_[name];
  var t = bacaTable_(name);
  if (REQ_MEMO_) REQ_MEMO_[name] = t;
  return t;
}

function bacaTable_(name) {
  var sh = sheet_(name);
  var last = sh.getLastRow(), cols = sh.getLastColumn();
  if (cols === 0) return { sh: sh, headers: [], rows: [] };
  var headers = sh.getRange(1, 1, 1, cols).getValues()[0].map(String);
  if (last < 2) return { sh: sh, headers: headers, rows: [] };
  var vals = sh.getRange(2, 1, last - 1, cols).getValues();
  var rows = vals.map(function (r, i) {
    var o = { _row: i + 2 };
    headers.forEach(function (h, j) { o[h] = r[j]; });
    return o;
  });
  return { sh: sh, headers: headers, rows: rows };
}

function rowsOf_(name, filterFn) {
  var t = readTable_(name);
  return filterFn ? t.rows.filter(filterFn) : t.rows.slice();
}

/** Tambah banyak objek sekaligus sesuai urutan header. */
function appendObjects_(name, objs) {
  if (!objs.length) return;
  memoBuang_(name);
  var sh = sheet_(name);
  var headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  var data = objs.map(function (o) { return headers.map(function (h) { return o[h] === undefined || o[h] === null ? '' : o[h]; }); });
  sh.getRange(sh.getLastRow() + 1, 1, data.length, headers.length).setValues(data);
}

/** Ubah satu baris (objek hasil readTable_ yang punya _row) dengan field baru. */
function updateObject_(t, obj, changes) {
  Object.keys(changes).forEach(function (k) { obj[k] = changes[k]; });
  var data = [t.headers.map(function (h) { return obj[h] === undefined || obj[h] === null ? '' : obj[h]; })];
  t.sh.getRange(obj._row, 1, 1, t.headers.length).setValues(data);
}

function newId_(prefix) {
  return prefix + '-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMddHHmmss') + '-' + Math.floor(Math.random() * 1e4);
}

function num_(v) {
  if (v === null || v === undefined || v === '') return 0;
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  var s = String(v).trim();
  if (s === '-' || s === '') return 0;
  var neg = /^\(.*\)$/.test(s) || /^-/.test(s);
  s = s.replace(/[^0-9.,]/g, '');
  // format Indonesia (1.234.567,5) atau Inggris (1,234,567.5)
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, '');
  else if (s.indexOf(',') >= 0 && s.indexOf('.') < 0) s = s.replace(',', '.');
  var n = parseFloat(s);
  if (!isFinite(n)) return 0;
  return neg ? -n : n;
}

function fmtDate_(d) { return Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd'); }
function nowIso_() { return Utilities.formatDate(new Date(), 'Asia/Jakarta', "yyyy-MM-dd'T'HH:mm:ss"); }

/** Terima Date / 'yyyy-MM-dd' / '10 Mar' / '22 March 2025' → 'yyyy-MM-dd' (atau '' bila gagal). */
function toDateStr_(v, tahunDefault) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v) ? '' : fmtDate_(v);
  var s = String(v).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  var bulan = { jan: 1, feb: 2, mar: 3, apr: 4, mei: 5, may: 5, jun: 6, jul: 7, agu: 8, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, des: 12, dec: 12 };
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\.?\s*(\d{4})?$/);
  if (m && bulan[m[2].toLowerCase()]) {
    var y = m[3] ? +m[3] : tahunDefault;
    if (!y) return '';
    return y + '-' + ('0' + bulan[m[2].toLowerCase()]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
  }
  return '';
}

/** 'yyyy-MM-dd HH:mm' atau Date → Date (zona Jakarta). */
function parseDateTime_(v) {
  if (!v) return null;
  if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v) ? null : v;
  var m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return null;
  return new Date(m[1] + '-' + m[2] + '-' + m[3] + 'T' + (m[4] || '23') + ':' + (m[5] || '59') + ':00+07:00');
}

function sha256_(s) {
  var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8);
  return raw.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function log_(sess, aksi, detail) {
  try {
    appendObjects_('Log', [{ Waktu: nowIso_(), Peran: sess ? sess.role : 'sistem', Nama: sess ? (sess.nama || '') : '', Aksi: aksi, Detail: typeof detail === 'string' ? detail : JSON.stringify(detail) }]);
  } catch (e) { /* log tidak boleh menggagalkan aksi */ }
}

function withLock_(fn) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  memoBuang_();
  try { return fn(); } finally { memoBuang_(); naikkanVersiData_(); lock.releaseLock(); }
}

/* ---------- cache respons lintas request (CacheService) ----------
 * Setiap penulisan lewat withLock_ menaikkan versi data, sehingga cache lama otomatis tidak terpakai.
 * Perubahan manual langsung di sheet (bukan lewat aplikasi) terlihat paling lambat CACHE_RESPON_DETIK.
 */
var CACHE_RESPON_DETIK = 300;
function versiData_() {
  try {
    var c = CacheService.getScriptCache(), v = c.get('zakat_ver');
    if (!v) { v = String(Date.now()); c.put('zakat_ver', v, 21600); }
    return v;
  } catch (e) { return ''; }
}
function naikkanVersiData_() {
  // Selalu naik (dipanggil di dalam script lock), jadi versi baru tidak mungkin sama dengan versi lama.
  try {
    var c = CacheService.getScriptCache(), cur = Number(c.get('zakat_ver')) || 0;
    c.put('zakat_ver', String(Math.max(Date.now(), cur + 1)), 21600);
  } catch (e) { /* cache opsional */ }
}
function cacheAmbil_(key) {
  try { return CacheService.getScriptCache().get(key); } catch (e) { return null; }
}
function cacheSimpan_(key, str) {
  if (str.length > 95000) return; // batas CacheService 100 KB per key: lewati, jangan crash
  try { CacheService.getScriptCache().put(key, str, CACHE_RESPON_DETIK); } catch (e) { /* cache opsional */ }
}

/**
 * Bagi total bilangan bulat ke beberapa persentase dengan metode sisa terbesar,
 * sehingga jumlah hasil SELALU sama dengan total.
 * parts: [{key, pct}] → {key: nilai}
 */
function splitLargestRemainder_(total, parts) {
  total = Math.round(total);
  var sumPct = parts.reduce(function (a, p) { return a + p.pct; }, 0) || 1;
  var res = parts.map(function (p) {
    var exact = total * p.pct / sumPct;
    return { key: p.key, base: Math.floor(exact), rem: exact - Math.floor(exact) };
  });
  var sisa = total - res.reduce(function (a, r) { return a + r.base; }, 0);
  res.slice().sort(function (a, b) { return b.rem - a.rem; }).slice(0, sisa).forEach(function (r) { r.base += 1; });
  var out = {};
  res.forEach(function (r) { out[r.key] = r.base; });
  return out;
}
