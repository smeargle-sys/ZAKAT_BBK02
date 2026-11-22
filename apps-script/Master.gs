/** Konfigurasi tahun, amil, simpatisan, serah UB, pembelian beras, bagian amil. */

var NUM_CFG = ['Harga_Soq', 'Kg_Per_Soq', 'Tarif_Fidyah', 'F_Sabilillah', 'F_Mustahiq', 'F_AmilKlp', 'F_AmilDesa', 'F_AmilDaerah',
  'M_Sabilillah', 'M_Mustahiq', 'M_AmilKlp', 'M_AmilDesa', 'M_AmilDaerah', 'Jiwa_Sensus', 'KK_Sensus', 'Jiwa_Mustahiq'];

function configs_() {
  return rowsOf_('Config_Tahun', function (r) { return r.Tahun; }).map(function (r) {
    var o = {};
    SHEETS.Config_Tahun.forEach(function (k) { o[k] = r[k]; });
    o.Tahun = Number(r.Tahun);
    NUM_CFG.forEach(function (k) { o[k] = r[k] === '' ? '' : num_(r[k]); });
    ['Tgl_Idul_Fitri', 'Tutup_Rekap_Mal'].forEach(function (k) { o[k] = toDateStr_(r[k]); });
    var b = parseDateTime_(r.Batas_Fitrah);
    o.Batas_Fitrah = b ? Utilities.formatDate(b, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm') : '';
    o.Status = String(r.Status || 'TUTUP').toUpperCase();
    return o;
  }).sort(function (a, b) { return a.Tahun - b.Tahun; });
}

function cfg_(tahun) {
  var all = configs_();
  var c = all.filter(function (x) { return String(x.Tahun) === String(tahun); })[0];
  if (!c) throw new Error('Konfigurasi tahun ' + tahun + ' belum ada.');
  return c;
}

function tahunAktif_() {
  var all = configs_();
  if (!all.length) throw new Error('Config_Tahun kosong. Jalankan Setup.');
  var buka = all.filter(function (c) { return c.Status === 'BUKA'; });
  return (buka.length ? buka : all)[(buka.length ? buka : all).length - 1];
}

function batasFitrahLewat_(c) {
  var b = parseDateTime_(c.Batas_Fitrah);
  return b ? new Date() > b : false;
}

function bootstrap_(p, s) {
  var aktif = tahunAktif_();
  var tahun = p.tahun ? Number(p.tahun) : aktif.Tahun;
  var c = cfg_(tahun);
  return {
    sesi: s, tahunAktif: aktif.Tahun, kelompok: APP.KELOMPOK,
    wilayah: { no: APP.KELOMPOK_NO, desa: APP.DESA, daerah: APP.DAERAH },
    tahunList: configs_().map(function (x) { return { tahun: x.Tahun, hijriah: x.Hijriah, status: x.Status }; }),
    config: c, batasLewat: batasFitrahLewat_(c), amil: daftarAmil_(tahun), now: nowIso_()
  };
}

function daftarAmil_(tahun) {
  return rowsOf_('Amil', function (a) { return String(a.Tahun) === String(tahun); }).map(function (a) {
    return { id: String(a.ID_Amil), nama: String(a.Nama), idJamaah: String(a.ID_Jamaah || ''), jabatan: String(a.Jabatan || ''), saham: num_(a.Saham) || 1, aktif: a.Aktif !== 'N', punyaPin: !!a.PIN_Hash };
  });
}

function simpanAmil_(p, s) {
  var a = p.amil || {};
  if (!a.nama) throw new Error('Nama amil wajib diisi.');
  var tahun = Number(p.tahun || tahunAktif_().Tahun);
  if (a.pin && !validPin_(a.pin)) throw new Error('PIN amil harus 6 digit angka.');
  var ct = cfg_(tahun);
  if (String(ct.Status).toUpperCase() !== 'BUKA') throw new Error('Daftar amil ' + ct.Hijriah + ' / ' + tahun + ' sudah ditutup dan tidak bisa diubah. Buka kembali penerimaan dulu bila perlu mengubahnya.');
  return withLock_(function () {
    var t = readTable_('Amil');
    var row = a.id ? t.rows.filter(function (r) { return String(r.ID_Amil) === String(a.id) && String(r.Tahun) === String(tahun); })[0] : null;
    if (!a.idJamaah) { // coba hubungkan otomatis ke data sensus
      var sen = readSensus_(), m = matchName_(a.nama, sen.jamaah.map(function (j) { return { id: j.id, idKeluarga: j.kk, nama: j.nama, tipe: j.hub === 'A' ? 'KK' : 'JM' }; }));
      if (m.status === 'COCOK') a.idJamaah = m.kandidat.id;
    }
    var obj = { Tahun: tahun, Nama: a.nama, ID_Jamaah: a.idJamaah || '', Jabatan: a.jabatan || 'Amil', Saham: num_(a.saham) || 1, Aktif: a.aktif === false ? 'N' : 'Y' };
    var idAmil = row ? String(row.ID_Amil) : (a.id || newId_('AM'));
    if (a.pin) obj.PIN_Hash = cekPinUnik_(a.pin, 'A:' + idAmil);
    if (row) updateObject_(t, row, obj);
    else { obj.ID_Amil = idAmil; appendObjects_('Amil', [obj]); }
    log_(s, 'simpanAmil', { nama: obj.Nama, saham: obj.Saham, aktif: obj.Aktif, ubahPin: !!a.pin });
    return daftarAmil_(tahun);
  });
}

function getConfigAdmin_(p) {
  var tahun = Number(p.tahun || tahunAktif_().Tahun);
  return { configs: configs_(), amil: daftarAmil_(tahun), tahun: tahun, pengguna: daftarPengguna_() };
}

function simpanConfig_(p, s) {
  var c = p.config || {};
  var tahun = Number(c.Tahun);
  // D-44: tahun yang ditutup hanya-baca. Satu-satunya perubahan yang diterima: membuka kembali (Status = BUKA).
  var lama = configs_().filter(function (x) { return String(x.Tahun) === String(tahun); })[0];
  if (lama && String(lama.Status).toUpperCase() !== 'BUKA') {
    if (String(c.Status || '').toUpperCase() !== 'BUKA') throw new Error('Konfigurasi ' + lama.Hijriah + ' / ' + tahun + ' sudah ditutup dan tidak bisa diubah. Buka kembali penerimaan dulu bila perlu mengubahnya.');
    return withLock_(function () {
      var t = readTable_('Config_Tahun');
      var row = t.rows.filter(function (r) { return String(r.Tahun) === String(tahun); })[0];
      updateObject_(t, row, { Status: 'BUKA' });
      log_(s, 'bukaKembaliTahun', { tahun: tahun });
      return configs_();
    });
  }
  var sumF = ['F_Sabilillah', 'F_Mustahiq', 'F_AmilKlp', 'F_AmilDesa', 'F_AmilDaerah'].reduce(function (a, k) { return a + num_(c[k]); }, 0);
  var sumM = ['M_Sabilillah', 'M_Mustahiq', 'M_AmilKlp', 'M_AmilDesa', 'M_AmilDaerah'].reduce(function (a, k) { return a + num_(c[k]); }, 0);
  if (Math.abs(sumF - 100) > 0.001) throw new Error('Total persentase zakat fitrah harus 100% (sekarang ' + sumF + '%).');
  if (Math.abs(sumM - 100) > 0.001) throw new Error('Total persentase zakat mal harus 100% (sekarang ' + sumM + '%).');
  if (!(num_(c.Harga_Soq) > 0)) throw new Error('Harga titip per soq wajib diisi.');
  if (!(num_(c.Kg_Per_Soq) > 0)) throw new Error('Berat 1 soq wajib diisi.');
  return withLock_(function () {
    var t = readTable_('Config_Tahun');
    var row = t.rows.filter(function (r) { return String(r.Tahun) === String(tahun); })[0];
    if (!row) throw new Error('Tahun ' + tahun + ' tidak ditemukan.');
    var ch = {};
    SHEETS.Config_Tahun.forEach(function (k) { if (k !== 'Tahun' && c[k] !== undefined) ch[k] = NUM_CFG.indexOf(k) >= 0 && c[k] !== '' ? num_(c[k]) : c[k]; });
    if (ch.Status) ch.Status = String(ch.Status).toUpperCase() === 'BUKA' ? 'BUKA' : 'TUTUP';
    // saat ditutup: simpan jumlah jiwa & KK sensus pada saat itu untuk tren
    if (ch.Status === 'TUTUP' && row.Status === 'BUKA' && !row.Jiwa_Sensus) {
      var sen = readSensus_(true); ch.Jiwa_Sensus = sen.jamaah.length; ch.KK_Sensus = sen.keluarga.length;
    }
    updateObject_(t, row, ch);
    log_(s, 'simpanConfig', ch);
    return configs_();
  });
}

function tahunBaru_(p, s) {
  return withLock_(function () {
    var all = configs_();
    var last = all[all.length - 1];
    var baru = {};
    SHEETS.Config_Tahun.forEach(function (k) { baru[k] = last[k]; });
    baru.Tahun = last.Tahun + 1;
    var h = parseInt(String(last.Hijriah), 10);
    baru.Hijriah = h ? (h + 1) + ' H' : '';
    ['Tgl_Idul_Fitri', 'Batas_Fitrah', 'Tutup_Rekap_Mal', 'Jiwa_Sensus', 'KK_Sensus', 'Jiwa_Mustahiq'].forEach(function (k) { baru[k] = ''; });
    baru.Status = 'BUKA';
    baru.Catatan = 'Disalin dari ' + last.Tahun + ' — isi tanggal & cek harga';
    // tutup tahun yang masih buka
    var t = readTable_('Config_Tahun');
    var sen = null;
    t.rows.forEach(function (r) {
      if (String(r.Status).toUpperCase() !== 'BUKA') return;
      var ch = { Status: 'TUTUP' };
      if (!r.Jiwa_Sensus) { sen = sen || readSensus_(true); ch.Jiwa_Sensus = sen.jamaah.length; ch.KK_Sensus = sen.keluarga.length; }
      updateObject_(t, r, ch);
    });
    appendObjects_('Config_Tahun', [baru]);
    // salin daftar amil
    // salin amil aktif beserta PIN-nya (amil tidak perlu membuat PIN baru tiap tahun)
    var amil = rowsOf_('Amil', function (a) { return String(a.Tahun) === String(last.Tahun) && a.Aktif !== 'N'; }).map(function (a) {
      return { Tahun: baru.Tahun, ID_Amil: a.ID_Amil, Nama: a.Nama, ID_Jamaah: a.ID_Jamaah, Jabatan: a.Jabatan, Saham: a.Saham, Aktif: 'Y', PIN_Hash: a.PIN_Hash };
    });
    appendObjects_('Amil', amil);
    log_(s, 'tahunBaru', baru.Tahun);
    return configs_();
  });
}

/* ---------- Simpatisan & pencarian muzakki ---------- */

function daftarSimpatisan_() {
  var kel = keluargaMap_(readSensus_());
  // D-25: tandai simpatisan yang sudah zakat fitrah di tahun aktif, supaya form bisa menguncinya
  var sudah = {};
  jiwaFitrah_(tahunAktif_().Tahun).forEach(function (j) { if (j.Tipe === 'SM') sudah[String(j.Ref_ID)] = String(j.ID_Setoran); });
  return rowsOf_('Simpatisan', function (r) { return r.ID_SM && r.Dihapus !== 'Y'; }).map(function (r) {
    return { id: String(r.ID_SM), sudah: !!sudah[String(r.ID_SM)], idSetoran: sudah[String(r.ID_SM)] || '', nama: String(r.Nama), jk: String(r.JK || ''), idKeluarga: String(r.ID_Keluarga || ''),
      kkNama: r.ID_Keluarga && kel[r.ID_Keluarga] ? kel[r.ID_Keluarga].nama : '', hubungan: String(r.Hubungan || ''), hp: String(r.No_HP || ''), catatan: String(r.Catatan || '') };
  });
}

function simpanSimpatisan_(p, s) {
  var x = p.sm || {};
  if (!x.nama || String(x.nama).trim().length < 2) throw new Error('Nama simpatisan wajib diisi.');
  return withLock_(function () {
    var t = readTable_('Simpatisan');
    var row = x.id ? t.rows.filter(function (r) { return String(r.ID_SM) === String(x.id); })[0] : null;
    var obj = { Nama: String(x.nama).trim(), JK: x.jk || '', ID_Keluarga: x.idKeluarga || '', Hubungan: x.hubungan || '', No_HP: x.hp ? "'" + x.hp : '', Catatan: x.catatan || '' };
    var id;
    if (row) { updateObject_(t, row, obj); id = row.ID_SM; }
    else { id = newId_('SM'); obj.ID_SM = id; obj.Dibuat = nowIso_() + ' · ' + (s.nama || s.role); appendObjects_('Simpatisan', [obj]); }
    log_(s, 'simpanSimpatisan', obj);
    return { id: String(id), list: daftarSimpatisan_() };
  });
}

/**
 * Hapus simpatisan dari master (soft delete, D-41). Riwayat setoran tetap utuh karena nama tersimpan di setoran.
 * Ditolak bila simpatisan masih tercatat di setoran zakat fitrah tahun aktif: hapus/ubah setorannya dulu.
 */
function hapusSimpatisan_(p, s) {
  var id = String(p.id || '');
  return withLock_(function () {
    var t = readTable_('Simpatisan');
    if (t.headers.indexOf('Dihapus') < 0) throw new Error('Kolom Dihapus belum ada di sheet Simpatisan. Jalankan menu Zakat › Setup dulu.');
    var row = t.rows.filter(function (r) { return String(r.ID_SM) === id && r.Dihapus !== 'Y'; })[0];
    if (!row) throw new Error('Simpatisan tidak ditemukan.');
    var tahun = tahunAktif_().Tahun;
    var dipakai = jiwaFitrah_(tahun).some(function (j) { return j.Tipe === 'SM' && String(j.Ref_ID) === id; });
    if (dipakai) throw new Error(row.Nama + ' masih tercatat di setoran zakat fitrah ' + tahun + '. Hapus atau ubah setoran itu dulu di Data Setoran.');
    updateObject_(t, row, { Dihapus: 'Y' });
    log_(s, 'hapusSimpatisan', { id: id, nama: row.Nama });
    return { list: daftarSimpatisan_() };
  });
}

function cariMuzakki_(p) {
  var q = normName_(p.q || '');
  if (!q.length) return [];
  var sen = readSensus_(), kel = keluargaMap_(sen);
  var hit = function (nama) { var t = normName_(nama); return q.every(function (w) { return t.some(function (u) { return u.indexOf(w) === 0; }); }); };
  var out = [];
  sen.jamaah.forEach(function (j) {
    if (hit(j.nama) || hit(j.absen)) out.push({ tipe: 'JM', id: j.id, nama: j.nama, idKeluarga: j.kk, info: 'KK ' + (kel[j.kk] ? kel[j.kk].nama : '-') + ' · jamaah sensus' });
  });
  daftarSimpatisan_().forEach(function (m) {
    if (hit(m.nama)) out.push({ tipe: 'SM', id: m.id, nama: m.nama, idKeluarga: m.idKeluarga, info: m.kkNama ? 'Simpatisan · KK ' + m.kkNama : 'Simpatisan · berdiri sendiri' });
  });
  return out.slice(0, 25);
}

/* ---------- Serah UB, pembelian beras, bagian amil ---------- */

function simpanSerahUB_(p, s) {
  var nominal = Math.round(num_(p.nominal));
  if (!(nominal > 0)) throw new Error('Nominal serah ke UB wajib diisi.');
  var tahun = Number(p.tahun || tahunAktif_().Tahun);
  var idAmil = s.role === 'amil' ? s.idAmil : (p.idAmil || '');
  var amil = daftarAmil_(tahun).filter(function (a) { return a.id === String(idAmil); })[0];
  var obj = { ID: newId_('UB'), Tahun: tahun, Tanggal: toDateStr_(p.tanggal) || fmtDate_(new Date()), ID_Amil: idAmil, Nama_Amil: amil ? amil.nama : '',
    Nominal: nominal, Penerima: p.penerima || '', Catatan: p.catatan || '', Oleh: s.nama || s.role };
  withLock_(function () { appendObjects_('Serah_UB', [obj]); });
  log_(s, 'serahUB', obj);
  return obj;
}

function simpanBeli_(p, s) {
  var kg = num_(p.kg), rp = Math.round(num_(p.rupiah));
  if (!(kg > 0)) throw new Error('Jumlah kg wajib diisi.');
  var obj = { ID: newId_('BL'), Tahun: Number(p.tahun || tahunAktif_().Tahun), Tanggal: toDateStr_(p.tanggal) || fmtDate_(new Date()), Kg: kg, Rupiah: rp, Catatan: p.catatan || '', Oleh: s.nama || s.role };
  withLock_(function () { appendObjects_('Pembelian_Beras', [obj]); });
  log_(s, 'beliBeras', obj);
  return obj;
}

function simpanBagianAmil_(p, s) {
  var tahun = Number(p.tahun), lampiran = p.lampiran === 'SUSULAN' ? 'SUSULAN' : 'UTAMA';
  var items = p.items || [];
  return withLock_(function () {
    var t = readTable_('Bagian_Amil');
    // hapus baris lama tahun+lampiran ini (dari bawah ke atas)
    t.rows.filter(function (r) { return String(r.Tahun) === String(tahun) && String(r.Lampiran || 'UTAMA') === lampiran; })
      .map(function (r) { return r._row; }).sort(function (a, b) { return b - a; })
      .forEach(function (rw) { t.sh.deleteRow(rw); });
    appendObjects_('Bagian_Amil', items.map(function (it) {
      return { Tahun: tahun, Lampiran: lampiran, ID_Amil: it.idAmil, Nama: it.nama, Beras_Final_Soq: num_(it.beras), Uang_Final_Rp: Math.round(num_(it.uang)), Catatan: p.catatan || '', Diubah: nowIso_() + ' · ' + (s.nama || s.role) };
    }));
    log_(s, 'bagianAmil', { tahun: tahun, lampiran: lampiran, n: items.length });
    return { ok: true };
  });
}

function hapusSoft_(sheetName, id, s) {
  return withLock_(function () {
    var t = readTable_(sheetName);
    var row = t.rows.filter(function (r) { return String(r.ID) === String(id); })[0];
    if (!row) throw new Error('Data tidak ditemukan.');
    updateObject_(t, row, { Dihapus: 'Y' });
    log_(s, 'hapus ' + sheetName, id);
    return { ok: true };
  });
}
