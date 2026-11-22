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
    var luar = r.Tipe === 'LUAR', j = luar ? null : info[String(r.Ref_ID)];
    // D-43: kelompokkan menurut ID Keluarga TERBARU di sensus (bila jamaah pindah KK, ikut pindah).
    // ID Keluarga yang tersimpan hanya dipakai bila jamaah sudah tidak ada di sensus.
    var key = luar ? 'LUAR-' + r.ID : j ? (j.kk || ('TANPA-KK-' + j.id)) : String(r.ID_Keluarga || ('TANPA-KK-' + r.Ref_ID));
    if (!grup[key]) {
      grup[key] = { id: key, tipe: luar ? 'LUAR' : (isTanpaKK_(key) ? 'TANPA_KK' : 'KK'), jiwa: 0, anggota: [],
        nama: luar ? String(r.Nama) : (kel[key] && kel[key].nama ? kel[key].nama : String(r.Nama_KK || r.Nama)) };
      keys.push(key);
    }
    var g = grup[key], n = luar ? Math.max(1, Math.round(num_(r.Jiwa))) : 1;
    g.jiwa += n;
    g.anggota.push({ id: String(r.ID), refId: String(r.Ref_ID || ''), asnaf: String(r.Asnaf || 'MISKIN'), jiwa: n,
      kepala: luar || g.tipe === 'TANPA_KK' || !!(j && isKepala_(j.hub)), catatan: String(r.Catatan || ''),
      tidakDiSensus: !luar && !j, nama: j ? j.nama : String(r.Nama),
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
  var final = finalMustahiq_(tahun);
  var serah = {};
  (ss_().getSheetByName('Mustahiq_Serah') ? rowsOf_('Mustahiq_Serah', function (r) { return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y'; }) : [])
    .forEach(function (r) { serah[String(r.ID_Keluarga)] = { soq: num_(r.Soq), kg: num_(r.Kg), tanggal: toDateStr_(r.Tanggal), oleh: String(r.Oleh || '') }; });
  var out = { tahun: tahun, hijriah: c.Hijriah, kgSoq: kgSoq, ke: pm.ke, bagi: bagi, soqDiterima: pm.soqDiterima,
    pool: bagi ? pm.pool : 0, sementara: c.Status === 'BUKA' && !batasFitrahLewat_(c), batasFitrah: String(c.Batas_Fitrah || ''),
    jiwa: 0, serahKK: 0, serahSoq: 0, asnaf: {}, grup: grup, adaFinal: false, totalSoq: 0 };
  out.poolKg = Math.round(out.pool * kgSoq * 100) / 100;
  grup.forEach(function (g) {
    // D-42: angka acuan (sisa terbesar) + angka final hasil musyawarah. Final kosong = acuan.
    g.acuan = hasil[g.id] || 0;
    g.final = bagi && final[g.id] ? final[g.id].soq : null;
    g.catatanFinal = final[g.id] ? final[g.id].catatan : '';
    g.soq = g.final !== null ? g.final : g.acuan;
    g.kg = Math.round(g.soq * kgSoq * 100) / 100;
    g.serah = serah[g.id] || null; g.berubah = !!(g.serah && g.serah.soq !== g.soq);
    out.jiwa += g.jiwa;
    if (g.serah) { out.serahKK++; out.serahSoq += g.serah.soq; }
    if (g.final !== null) out.adaFinal = true;
    out.totalSoq += g.soq;
    g.anggota.forEach(function (a) { out.asnaf[a.asnaf] = (out.asnaf[a.asnaf] || 0) + a.jiwa; });
  });
  // selisih total yang dibagikan (final/acuan) terhadap bagian mustahiq: + lebih, - kurang (D-42)
  out.selisih = out.totalSoq - out.pool;
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
    per[key].anggota.push({ id: j.id, nama: j.nama, umur: j.umur, keberadaan: j.keberadaan, kepala: isKepala_(j.hub), kkJiwa: kel[key] ? kel[key].anggota.length : 1 });
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
      var baru = [];
      var tambah = function (j, asnaf, catatan) {
        var key = j.kk || ('TANPA-KK-' + j.id);
        ada[j.id] = 1;
        baru.push({ ID: newId_('MS'), Tahun: tahun, Tipe: 'JM', Ref_ID: j.id, Nama: j.nama, ID_Keluarga: key, Nama_KK: kel[key] ? kel[key].nama : j.nama,
          Jiwa: 1, Asnaf: asnaf, Catatan: catatan || '', Dibuat_Oleh: stamp.Dibuat_Oleh, Dibuat_Waktu: stamp.Dibuat_Waktu });
      };
      items.forEach(function (it) {
        var j = info[String(it.refId)];
        if (!j) throw new Error('Jamaah tidak ditemukan di sensus.');
        if (ada[j.id]) throw new Error(j.nama + ' sudah ada di daftar mustahiq tahun ini.');
        var asnaf = asnafValid_(it.asnaf);
        tambah(j, asnaf, it.catatan);
        // D-40: bila kepala keluarga ditetapkan mustahiq, seluruh anggota KK di sensus ikut terdaftar (asnaf sama).
        // Anggota yang tidak termasuk bisa dikeluarkan satu per satu sesudahnya.
        if (j.kk && isKepala_(j.hub) && kel[j.kk]) {
          kel[j.kk].anggota.forEach(function (a) { if (!ada[a.id]) tambah(a, asnaf, 'ikut kepala keluarga'); });
        }
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

/** Angka final musyawarah per KK untuk satu tahun: { idKeluarga: {soq, catatan} }. */
function finalMustahiq_(tahun) {
  var out = {};
  if (!ss_().getSheetByName('Mustahiq_Final')) return out;
  rowsOf_('Mustahiq_Final', function (r) { return String(r.Tahun) === String(tahun) && r.Soq_Final !== '' && r.Soq_Final !== null; })
    .forEach(function (r) { out[String(r.ID_Keluarga)] = { soq: num_(r.Soq_Final), catatan: String(r.Catatan || '') }; });
  return out;
}

/**
 * Simpan angka final hasil musyawarah (D-42), mengganti semua angka final tahun itu.
 * items: [{idKeluarga, soq ('' = pakai acuan), catatan}]. Soq bulat >= 0. Total boleh tidak sama dengan
 * bagian mustahiq; selisihnya ditampilkan di halaman & laporan.
 */
function simpanFinalMustahiq_(p, s) {
  var tahun = Number(p.tahun || tahunAktif_().Tahun);
  var d = daftarMustahiq_({ tahun: tahun }, s);
  if (!d.bagi) throw new Error('Bagian mustahiq tidak dibagi di kelompok tahun ini.');
  var nama = {}; d.grup.forEach(function (g) { nama[g.id] = g.nama; });
  var baris = [];
  (p.items || []).forEach(function (it) {
    var key = String(it.idKeluarga || ''), v = it.soq;
    if (!nama[key] || v === '' || v === null || v === undefined) return;
    var n = Number(String(v).replace(',', '.'));
    if (!isFinite(n) || n < 0 || Math.round(n) !== n) throw new Error('Angka final untuk ' + nama[key] + ' harus bilangan bulat 0 atau lebih.');
    baris.push({ Tahun: tahun, ID_Keluarga: key, Nama_KK: nama[key], Soq_Final: n, Catatan: String(it.catatan || '').slice(0, 200),
      Diubah_Oleh: s.nama || s.role, Diubah_Waktu: nowIso_() });
  });
  withLock_(function () {
    var t = readTable_('Mustahiq_Final');
    t.rows.filter(function (r) { return String(r.Tahun) === String(tahun); }).map(function (r) { return r._row; })
      .sort(function (a, b) { return b - a; }).forEach(function (rw) { t.sh.deleteRow(rw); });
    appendObjects_('Mustahiq_Final', baris);
    log_(s, 'simpanFinalMustahiq', { tahun: tahun, n: baris.length, total: baris.reduce(function (a, b) { return a + b.Soq_Final; }, 0) });
  });
  return daftarMustahiq_({ tahun: tahun }, s);
}
