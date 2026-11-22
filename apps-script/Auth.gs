/**
 * Login dengan PIN pribadi. PIN mengenali orangnya langsung:
 *  - Admin & Pengurus → sheet Pengguna (nama + peran + PIN)
 *  - Amil             → sheet Amil tahun aktif (PIN diatur di halaman Amil)
 * PIN disimpan sebagai hash (SHA-256 + salt) dan harus unik di antara semua pengguna aktif.
 * Token sesi disimpan di CacheService, berlaku APP.SESSION_HOURS jam.
 */

function pinSalt_() {
  var props = PropertiesService.getScriptProperties();
  var salt = props.getProperty('PIN_SALT');
  if (!salt) { salt = Utilities.getUuid(); props.setProperty('PIN_SALT', salt); }
  return salt;
}
function hashPin_(pin) { return sha256_(pinSalt_() + ':' + String(pin)); }
function validPin_(pin) { return /^\d{6}$/.test(String(pin || '')); }

/** Semua akun aktif yang bisa login: [{key, role, nama, idAmil, hash}] */
function akunAktif_() {
  var out = [];
  rowsOf_('Pengguna', function (r) { return r.ID && r.Aktif !== 'N' && r.PIN_Hash; }).forEach(function (r) {
    out.push({ key: 'U:' + r.ID, role: String(r.Peran).toUpperCase() === 'ADMIN' ? 'admin' : 'pengurus', nama: String(r.Nama), idAmil: '', hash: String(r.PIN_Hash) });
  });
  var tahun = tahunAktif_().Tahun;
  rowsOf_('Amil', function (a) { return String(a.Tahun) === String(tahun) && a.Aktif !== 'N' && a.PIN_Hash; }).forEach(function (a) {
    out.push({ key: 'A:' + a.ID_Amil, role: 'amil', nama: String(a.Nama), idAmil: String(a.ID_Amil), hash: String(a.PIN_Hash) });
  });
  return out;
}

/** Tolak PIN yang sudah dipakai orang lain (karena PIN sekaligus pengenal). */
function cekPinUnik_(pin, kecualiKey) {
  var h = hashPin_(pin);
  var bentrok = akunAktif_().filter(function (a) { return a.hash === h && a.key !== kecualiKey; })[0];
  if (bentrok) throw new Error('PIN ini sudah dipakai pengguna lain. Pilih PIN lain.');
  return h;
}

function login_(p) {
  var cache = CacheService.getScriptCache();
  var dev = String(p.device || 'x').slice(0, 64);
  var lockKey = 'lock_' + dev, failKey = 'fail_' + dev, globalKey = 'fail_global';
  if (cache.get(lockKey)) throw new Error('Terlalu banyak PIN salah. Coba lagi dalam ' + APP.LOCK_MENIT + ' menit.');
  if (Number(cache.get(globalKey) || 0) > 40) throw new Error('Login dikunci sementara karena banyak percobaan salah. Coba lagi nanti.');

  var akun = akunAktif_();
  if (!akun.some(function (a) { return a.role === 'admin'; })) throw new Error('Belum ada akun Admin. Buka spreadsheet › menu Zakat › Buat akun Admin.');
  var h = hashPin_(p.pin || '');
  var a = akun.filter(function (x) { return x.hash === h; })[0];

  if (!a) {
    var n = Number(cache.get(failKey) || 0) + 1;
    cache.put(failKey, String(n), APP.LOCK_MENIT * 60);
    cache.put(globalKey, String(Number(cache.get(globalKey) || 0) + 1), APP.LOCK_MENIT * 60);
    if (n >= APP.MAX_PIN_SALAH) cache.put(lockKey, '1', APP.LOCK_MENIT * 60);
    throw new Error('PIN salah. Sisa percobaan: ' + Math.max(0, APP.MAX_PIN_SALAH - n) + '.');
  }
  cache.remove(failKey);
  var sess = { role: a.role, nama: a.nama, idAmil: a.idAmil, key: a.key };
  var token = Utilities.getUuid();
  cache.put('tok_' + token, JSON.stringify(sess), APP.SESSION_HOURS * 3600);
  log_(sess, 'login', '');
  return { token: token, role: sess.role, nama: sess.nama, idAmil: sess.idAmil };
}

function session_(token) {
  if (!token) throw new Error('SESI_HABIS');
  var c = CacheService.getScriptCache().get('tok_' + token);
  if (!c) throw new Error('SESI_HABIS');
  return JSON.parse(c);
}

function requireRole_(sess, roles) {
  if (roles.indexOf(sess.role) < 0) throw new Error('Akses ditolak untuk peran ' + sess.role + '.');
}

function logout_(token) { CacheService.getScriptCache().remove('tok_' + token); return { ok: true }; }

/* ---------- akun Admin & Pengurus ---------- */

function daftarPengguna_() {
  return rowsOf_('Pengguna', function (r) { return r.ID; }).map(function (r) {
    return { id: String(r.ID), nama: String(r.Nama), peran: String(r.Peran).toUpperCase(), aktif: r.Aktif !== 'N', punyaPin: !!r.PIN_Hash };
  });
}

function simpanPengguna_(p, s) {
  var u = p.user || {};
  var nama = String(u.nama || '').trim();
  var peran = String(u.peran || '').toUpperCase();
  if (nama.length < 2) throw new Error('Nama wajib diisi.');
  if (['ADMIN', 'PENGURUS'].indexOf(peran) < 0) throw new Error('Peran harus Admin atau Pengurus.');
  if (u.pin && !validPin_(u.pin)) throw new Error('PIN harus 6 digit angka.');
  return withLock_(function () {
    var t = readTable_('Pengguna');
    var row = u.id ? t.rows.filter(function (r) { return String(r.ID) === String(u.id); })[0] : null;
    if (!row && !u.pin) throw new Error('PIN wajib diisi untuk pengguna baru.');
    var aktif = u.aktif === false ? 'N' : 'Y';
    // jangan sampai tidak ada admin aktif yang punya PIN
    var adminLain = t.rows.filter(function (r) { return String(r.Peran).toUpperCase() === 'ADMIN' && r.Aktif !== 'N' && r.PIN_Hash && (!row || r.ID !== row.ID); }).length;
    if (row && String(row.Peran).toUpperCase() === 'ADMIN' && (peran !== 'ADMIN' || aktif === 'N') && !adminLain) throw new Error('Harus ada minimal satu Admin aktif.');
    var obj = { Nama: nama, Peran: peran, Aktif: aktif };
    if (u.pin) obj.PIN_Hash = cekPinUnik_(u.pin, row ? 'U:' + row.ID : '');
    if (row) updateObject_(t, row, obj);
    else { obj.ID = newId_('US'); obj.Dibuat = nowIso_() + ' · ' + (s ? s.nama : 'setup'); appendObjects_('Pengguna', [obj]); }
    log_(s, 'simpanPengguna', { nama: nama, peran: peran, aktif: aktif, ubahPin: !!u.pin });
    return daftarPengguna_();
  });
}
