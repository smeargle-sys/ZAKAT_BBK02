/**
 * Mustahiq zakat fitrah (D-35): daftar penerima per tahun, pembagian pos Mustahiq rata per jiwa
 * (soq bulat per KK, sisa terbesar), dan penyerahan beras. Laporan resmi memakai data ini (D-36).
 */

/** Kolom sensus "Perlu Dibantu" dianggap kandidat bila terisi dan bukan jawaban "tidak". */
function perluDibantu_(v) {
  var s = String(v || '').trim();
  return !!s && !/^(tidak|no|n|0|-|false|belum)$/i.test(s);
}
function isKepala_(hub) { return /^A\b/i.test(String(hub || '').trim()); }

function mustahiqTahun_(tahun) {
  if (!ss_().getSheetByName('Mustahiq')) return []; // sebelum setupZakat dijalankan: jangan membuat Pemantauan/Tren error
  return rowsOf_('Mustahiq', function (r) { return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y'; });
}

/** Pos Mustahiq zakat fitrah (soq) = bagian dari soq diterima (BERAS + UANG), sama dengan Pemantauan. */
function poolMustahiq_(tahun, c) {
  var soq = sum_(setoranFitrah_(tahun).filter(function (r) { return r.Jenis === 'BERAS' || r.Jenis === 'UANG'; }),
    function (r) { return num_(r.Total_Jiwa); });
  return { soqDiterima: soq, pool: bagiFitrah_(c, soq).mustahiq || 0, ke: String(c.F_Mustahiq_Ke || 'Kelompok') };
}

/** Kelompokkan penerima per KK (KK sensus, jamaah tanpa KK, luar sensus), urut kepala keluarga dulu. */
function grupMustahiq_(rows, sen) {
  var kel = keluargaMap_(sen), info = {};
  sen.jamaah.forEach(function (j) { info[j.id] = j; });
  var urutSensus = {};
  Object.keys(kel).forEach(function (k) { kel[k].anggota.forEach(function (a, i) { urutSensus[a.id] = i; }); });
  var grup = {}, keys = [];
  rows.forEach(function (r) {
    var luar = r.Tipe === 'LUAR', key = luar ? 'LUAR-' + r.ID : String(r.ID_Keluarga || ('TANPA-KK-' + r.Ref_ID));
    if (!grup[key]) {
      grup[key] = { id: key, tipe: luar ? 'LUAR' : (isTanpaKK_(key) ? 'TANPA_KK' : 'KK'), jiwa: 0, anggota: [],
        nama: luar ? String(r.Nama) : (kel[key] && kel[key].nama ? kel[key].nama : String(r.Nama_KK || r.Nama)) };
      keys.push(key);
    }
    var g = grup[key], n = luar ? Math.max(1, Math.round(num_(r.Jiwa))) : 1, j = info[String(r.Ref_ID)];
    g.jiwa += n;
    g.anggota.push({ id: String(r.ID), refId: String(r.Ref_ID || ''), nama: String(r.Nama), asnaf: String(r.Asnaf || 'MISKIN'), jiwa: n,
      kepala: luar || g.tipe === 'TANPA_KK' || !!(j && isKepala_(j.hub)), catatan: String(r.Catatan || ''),
      _u: j && urutSensus[j.id] !== undefined ? urutSensus[j.id] : 999 });
  });
  var bobot = { KK: 0, TANPA_KK: 1, LUAR: 2 };
  return keys.map(function (k) {
    var g = grup[k];
    g.anggota.sort(function (a, b) { return (b.kepala - a.kepala) || (a._u - b._u) || (a.nama < b.nama ? -1 : 1); });
    g.anggota.forEach(function (a) { delete a._u; });
    return g;
  }).sort(function (a, b) { return (bobot[a.tipe] - bobot[b.tipe]) || (normName_(a.nama).join(' ') < normName_(b.nama).join(' ') ? -1 : 1); });
}

function daftarMustahiq_(p, s) {
  var tahun = Number(p.tahun || tahunAktif_().Tahun), c = cfg_(tahun), kgSoq = num_(c.Kg_Per_Soq);
  var pm = poolMustahiq_(tahun, c), bagi = pm.ke === 'Kelompok';
  var sen = readSensus_(), grup = grupMustahiq_(mustahiqTahun_(tahun), sen);
  var hasil = bagi && grup.length ? splitLargestRemainder_(pm.pool, grup.map(function (g) { return { key: g.id, pct: g.jiwa }; })) : {};
  var serah = {};
  (ss_().getSheetByName('Mustahiq_Serah') ? rowsOf_('Mustahiq_Serah', function (r) { return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y'; }) : [])
    .forEach(function (r) { serah[String(r.ID_Keluarga)] = { soq: num_(r.Soq), kg: num_(r.Kg), tanggal: toDateStr_(r.Tanggal), oleh: String(r.Oleh || '') }; });
  var out = { tahun: tahun, hijriah: c.Hijriah, kgSoq: kgSoq, ke: pm.ke, bagi: bagi, soqDiterima: pm.soqDiterima,
    pool: bagi ? pm.pool : 0, sementara: c.Status === 'BUKA' && !batasFitrahLewat_(c), batasFitrah: String(c.Batas_Fitrah || ''),
    jiwa: 0, serahKK: 0, serahSoq: 0, asnaf: {}, grup: grup };
  out.poolKg = Math.round(out.pool * kgSoq * 100) / 100;
  grup.forEach(function (g) {
    g.soq = hasil[g.id] || 0; g.kg = Math.round(g.soq * kgSoq * 100) / 100;
    g.serah = serah[g.id] || null; g.berubah = !!(g.serah && g.serah.soq !== g.soq);
    out.jiwa += g.jiwa;
    if (g.serah) { out.serahKK++; out.serahSoq += g.serah.soq; }
    g.anggota.forEach(function (a) { out.asnaf[a.asnaf] = (out.asnaf[a.asnaf] || 0) + a.jiwa; });
  });
  // kandidat "Perlu Dibantu" hanya untuk admin (D-35, privasi)
  if (s && s.role === 'admin') out.kandidat = kandidatMustahiq_(sen, grup);
  return out;
}

function kandidatMustahiq_(sen, grup) {
  var sudah = {}, kel = keluargaMap_(sen);
  grup.forEach(function (g) { g.anggota.forEach(function (a) { if (a.refId) sudah[a.refId] = 1; }); });
  var per = {}, keys = [];
  sen.jamaah.forEach(function (j) {
    if (!perluDibantu_(j.bantu) || sudah[j.id]) return;
    var key = j.kk || ('TANPA-KK-' + j.id);
    if (!per[key]) { per[key] = { id: key, nama: kel[key] ? kel[key].nama : j.nama, anggota: [] }; keys.push(key); }
    per[key].anggota.push({ id: j.id, nama: j.nama, umur: j.umur, keberadaan: j.keberadaan, kepala: isKepala_(j.hub) });
  });
  return keys.map(function (k) { return per[k]; }).sort(function (a, b) { return a.nama < b.nama ? -1 : 1; });
}

function asnafValid_(a) {
  var x = String(a || 'MISKIN').toUpperCase().replace(/\s+/g, '_');
  if (ASNAF.indexOf(x) < 0) throw new Error('Asnaf tidak dikenal: ' + a + '.');
  return x;
}

/** op: tambah (jamaah sensus) | luar (penerima luar sensus) | ubah | hapus. Hanya admin (route). */
function simpanMustahiq_(p, s) {
  var tahun = Number(p.tahun || tahunAktif_().Tahun);
  cfg_(tahun);
  var op = String(p.op || '');
  var sen = op === 'tambah' ? readSensus_() : null;
  withLock_(function () {
    var t = readTable_('Mustahiq'), aktif = t.rows.filter(function (r) { return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y'; });
    var stamp = { Dibuat_Oleh: s.nama || s.role, Dibuat_Waktu: nowIso_() };
    if (op === 'tambah') {
      var info = {}, kel = keluargaMap_(sen);
      sen.jamaah.forEach(function (j) { info[j.id] = j; });
      var ada = {}; aktif.forEach(function (r) { if (r.Ref_ID) ada[String(r.Ref_ID)] = 1; });
      var items = p.items || [];
      if (!items.length) throw new Error('Pilih minimal satu jamaah.');
      var baru = items.map(function (it) {
        var j = info[String(it.refId)];
        if (!j) throw new Error('Jamaah tidak ditemukan di sensus.');
        if (ada[j.id]) throw new Error(j.nama + ' sudah ada di daftar mustahiq tahun ini.');
        ada[j.id] = 1;
        var key = j.kk || ('TANPA-KK-' + j.id);
        return { ID: newId_('MS'), Tahun: tahun, Tipe: 'JM', Ref_ID: j.id, Nama: j.nama, ID_Keluarga: key, Nama_KK: kel[key] ? kel[key].nama : j.nama,
          Jiwa: 1, Asnaf: asnafValid_(it.asnaf), Catatan: it.catatan || '', Dibuat_Oleh: stamp.Dibuat_Oleh, Dibuat_Waktu: stamp.Dibuat_Waktu };
      });
      appendObjects_('Mustahiq', baru);
      log_(s, 'tambahMustahiq', { tahun: tahun, n: baru.length });
    } else if (op === 'luar') {
      var nama = String(p.nama || '').trim(), jiwa = Math.round(num_(p.jiwa));
      if (!nama) throw new Error('Nama penerima wajib diisi.');
      if (!(jiwa >= 1)) throw new Error('Jumlah jiwa minimal 1.');
      var id = newId_('MS');
      appendObjects_('Mustahiq', [{ ID: id, Tahun: tahun, Tipe: 'LUAR', Ref_ID: '', Nama: nama, ID_Keluarga: 'LUAR-' + id, Nama_KK: nama, Jiwa: jiwa,
        Asnaf: asnafValid_(p.asnaf), Catatan: p.catatan || '', Dibuat_Oleh: stamp.Dibuat_Oleh, Dibuat_Waktu: stamp.Dibuat_Waktu }]);
      log_(s, 'tambahMustahiqLuar', { tahun: tahun, nama: nama, jiwa: jiwa });
    } else if (op === 'ubah' || op === 'hapus') {
      var row = aktif.filter(function (r) { return String(r.ID) === String(p.id); })[0];
      if (!row) throw new Error('Penerima tidak ditemukan.');
      var ch = { Diubah_Oleh: s.nama || s.role, Diubah_Waktu: nowIso_() };
      if (op === 'hapus') ch.Dihapus = 'Y';
      else {
        if (p.asnaf !== undefined) ch.Asnaf = asnafValid_(p.asnaf);
        if (p.catatan !== undefined) ch.Catatan = String(p.catatan);
        if (row.Tipe === 'LUAR') {
          if (p.jiwa !== undefined) { var n = Math.round(num_(p.jiwa)); if (!(n >= 1)) throw new Error('Jumlah jiwa minimal 1.'); ch.Jiwa = n; }
          if (p.nama !== undefined && String(p.nama).trim()) { ch.Nama = String(p.nama).trim(); ch.Nama_KK = ch.Nama; }
        }
      }
      updateObject_(t, row, ch);
      log_(s, op === 'hapus' ? 'hapusMustahiq' : 'ubahMustahiq', { id: row.ID, nama: row.Nama });
    } else throw new Error('Aksi mustahiq tidak dikenal.');
  });
  return daftarMustahiq_({ tahun: tahun }, s);
}

/** Tandai/batal penyerahan beras untuk satu KK penerima: menyimpan soq & kg saat itu. */
function serahMustahiq_(p, s) {
  var tahun = Number(p.tahun || tahunAktif_().Tahun), key = String(p.idKeluarga || '');
  var d = daftarMustahiq_({ tahun: tahun }, s);
  var g = d.grup.filter(function (x) { return x.id === key; })[0];
  if (!g) throw new Error('Penerima tidak ditemukan di daftar mustahiq.');
  if (!p.batal && !d.bagi) throw new Error('Bagian mustahiq tidak dibagi di kelompok tahun ini.');
  withLock_(function () {
    var t = readTable_('Mustahiq_Serah');
    t.rows.filter(function (r) { return String(r.Tahun) === String(tahun) && String(r.ID_Keluarga) === key && r.Dihapus !== 'Y'; })
      .forEach(function (r) { updateObject_(t, r, { Dihapus: 'Y' }); });
    if (!p.batal) {
      appendObjects_('Mustahiq_Serah', [{ ID: newId_('MSR'), Tahun: tahun, ID_Keluarga: key, Nama_KK: g.nama, Soq: g.soq, Kg: g.kg,
        Tanggal: toDateStr_(p.tanggal) || fmtDate_(new Date()), Oleh: s.nama || s.role, Catatan: p.catatan || '' }]);
    }
    log_(s, p.batal ? 'batalSerahMustahiq' : 'serahMustahiq', { tahun: tahun, kk: g.nama, soq: g.soq });
  });
  return daftarMustahiq_({ tahun: tahun }, s);
}

/** Penandatangan laporan (D-36): [{jabatan, nama}] per tahun. Default jabatan mengikuti format laporan 2025. */
var TTD_DEFAULT = ['KI KELOMPOK', 'KU KELOMPOK', 'MUBALIGH KELOMPOK', 'WK KELOMPOK', 'PNB KELOMPOK', 'PNB KELOMPOK', 'WK KU KELOMPOK', '', 'PNKB KELOMPOK'];
function penandatangan_(c) {
  try {
    var x = JSON.parse(String(c.Penandatangan || ''));
    if (Object.prototype.toString.call(x) === '[object Array]') return x.map(function (o) { return { jabatan: String(o.jabatan || ''), nama: String(o.nama || '') }; });
  } catch (e) { /* kosong / rusak: pakai default */ }
  return TTD_DEFAULT.map(function (j) { return { jabatan: j, nama: '' }; });
}
function simpanPenandatangan_(p, s) {
  var tahun = Number(p.tahun), list = p.list || [];
  if (Object.prototype.toString.call(list) !== '[object Array]' || list.length > 15) throw new Error('Daftar penandatangan tidak valid (maks. 15).');
  var bersih = list.map(function (o) { return { jabatan: String(o.jabatan || '').trim().slice(0, 60), nama: String(o.nama || '').trim().slice(0, 80) }; });
  return withLock_(function () {
    var t = readTable_('Config_Tahun');
    var row = t.rows.filter(function (r) { return String(r.Tahun) === String(tahun); })[0];
    if (!row) throw new Error('Tahun ' + tahun + ' tidak ditemukan.');
    updateObject_(t, row, { Penandatangan: JSON.stringify(bersih) });
    log_(s, 'simpanPenandatangan', { tahun: tahun, n: bersih.length });
    return bersih;
  });
}
