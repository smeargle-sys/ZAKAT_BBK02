/**
 * Web app JSON API. Frontend (GitHub Pages) mengirim POST text/plain berisi JSON:
 * { action: '...', token: '...', ...parameter }
 * GET ?payload=<json> juga diterima (untuk uji cepat di browser).
 */

function doGet(e) {
  var p = {};
  try { p = e && e.parameter && e.parameter.payload ? JSON.parse(e.parameter.payload) : { action: 'ping' }; } catch (err) { p = { action: 'ping' }; }
  return handle_(p);
}

function doPost(e) {
  var p = {};
  try { p = JSON.parse(e.postData.contents || '{}'); } catch (err) { return json_({ ok: false, error: 'Format permintaan tidak valid.' }); }
  return handle_(p);
}

// Dibuat saat dipanggil (bukan saat file dimuat) supaya urutan file .gs tidak berpengaruh.
function routes_() { return {
  ping:              { roles: null, fn: function () { return { app: APP.NAMA, waktu: nowIso_() }; } },
  login:             { roles: null, fn: function (p) { return login_(p); } },
  logout:            { roles: [], fn: function (p) { return logout_(p.token); } },
  bootstrap:         { roles: ['admin', 'amil', 'pengurus'], fn: bootstrap_ },
  kkList:            { roles: ['admin', 'amil'], fn: kkList_ },
  cariMuzakki:       { roles: ['admin', 'amil'], fn: cariMuzakki_ },
  simpanFitrah:      { roles: ['admin', 'amil'], fn: simpanFitrah_ },
  hapusFitrah:       { roles: ['admin'], fn: hapusFitrah_ },
  getFitrah:         { roles: ['admin', 'amil'], fn: getFitrah_ },
  getLain:           { roles: ['admin'], fn: getLain_ },
  simpanLain:        { roles: ['admin', 'amil'], fn: simpanLain_ },
  hapusLain:         { roles: ['admin'], fn: hapusLain_ },
  daftarSimpatisan:  { roles: ['admin', 'amil'], fn: daftarSimpatisan_ },
  simpanSimpatisan:  { roles: ['admin', 'amil'], fn: simpanSimpatisan_ },
  dashboard:         { roles: ['admin', 'amil', 'pengurus'], fn: dashboard_ },
  tren:              { roles: ['admin', 'amil', 'pengurus'], fn: tren_ },
  daftarSetoran:     { roles: ['admin', 'amil', 'pengurus'], fn: daftarSetoran_ },
  getConfig:         { roles: ['admin'], fn: getConfigAdmin_ },
  simpanConfig:      { roles: ['admin'], fn: simpanConfig_ },
  tahunBaru:         { roles: ['admin'], fn: tahunBaru_ },
  simpanAmil:        { roles: ['admin'], fn: simpanAmil_ },
  simpanSerahUB:     { roles: ['admin', 'amil'], fn: simpanSerahUB_ },
  hapusSerahUB:      { roles: ['admin'], fn: function (p, s) { return hapusSoft_('Serah_UB', p.id, s); } },
  simpanBeli:        { roles: ['admin'], fn: simpanBeli_ },
  hapusBeli:         { roles: ['admin'], fn: function (p, s) { return hapusSoft_('Pembelian_Beras', p.id, s); } },
  simpanBagianAmil:  { roles: ['admin'], fn: simpanBagianAmil_ },
  daftarPengguna:    { roles: ['admin'], fn: daftarPengguna_ },
  simpanPengguna:    { roles: ['admin'], fn: simpanPengguna_ },
  // Mustahiq & laporan (D-35, D-36): amil tidak punya akses
  daftarMustahiq:    { roles: ['admin', 'pengurus'], fn: daftarMustahiq_ },
  simpanMustahiq:    { roles: ['admin'], fn: simpanMustahiq_ },
  serahMustahiq:     { roles: ['admin'], fn: serahMustahiq_ },
  simpanPenandatangan: { roles: ['admin'], fn: simpanPenandatangan_ }
}; }

function handle_(p) {
  memoReset_(true);
  try {
    var r = routes_()[p.action];
    if (!r) throw new Error('Aksi tidak dikenal: ' + p.action);
    var sess = null;
    if (r.roles) {
      sess = session_(p.token);
      if (r.roles.length) requireRole_(sess, r.roles);
    }
    if (p.segar) REQ_MEMO_.__segar = true; // tombol Muat ulang: baca ulang sensus juga
    var ck = kunciCache_(p, sess);
    if (ck) {
      var hit = cacheAmbil_(ck);
      if (hit) return okStr_(hit);
      var str = JSON.stringify(r.fn(p, sess));
      cacheSimpan_(ck, str);
      return okStr_(str);
    }
    return json_({ ok: true, data: r.fn(p, sess) });
  } catch (err) {
    var msg = String(err && err.message || err);
    return json_({ ok: false, error: msg, sesiHabis: msg === 'SESI_HABIS' });
  } finally {
    memoReset_(false);
  }
}

/**
 * Aksi baca yang berat dan hasilnya sama untuk semua peran (kecuali kkList: ringkasan "saya" per amil).
 * Kunci memuat versi data, jadi setiap simpan/ubah/hapus otomatis membuat cache lama tidak terpakai.
 * p.segar = true → lewati cache (tombol muat ulang).
 */
function kunciCache_(p, sess) {
  var boleh = { dashboard: 1, tren: 1, kkList: 1, daftarSetoran: 1, daftarMustahiq: 1 };
  if (!boleh[p.action] || p.segar) return '';
  var ver = versiData_();
  if (!ver) return '';
  return ['r', p.action, ver, p.tahun || '', p.kelas || '', varianCache_(p.action, sess)].join('|');
}

/** Bagian kunci cache yang bergantung pada sesi: ringkasan "saya" per amil, dan isi dashboard admin vs lainnya (D-34). */
function varianCache_(action, sess) {
  if (action === 'kkList') return sess ? sess.idAmil || '' : '';
  if (action === 'dashboard' || action === 'daftarMustahiq') return sess && sess.role === 'admin' ? 'admin' : 'umum';
  return '';
}

function okStr_(dataStr) {
  return ContentService.createTextOutput('{"ok":true,"data":' + dataStr + '}').setMimeType(ContentService.MimeType.JSON);
}
