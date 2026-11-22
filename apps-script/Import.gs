/**
 * Impor data pendataan lama (xlsx 2024–2026) ke tabel aplikasi.
 * Menu Zakat › Impor data lama. Aman dijalankan ulang: data IMPOR tahun yang sama diganti.
 * Butuh Advanced Service "Drive API" (sudah diaktifkan lewat appsscript.json).
 */

function imporSemua() {
  var ui = SpreadsheetApp.getUi();
  var ok = ui.alert('Impor data lama', 'Data hasil impor sebelumnya (2024–2026) akan diganti dengan hasil impor baru. Setoran yang diinput lewat aplikasi tidak disentuh. Lanjut?', ui.ButtonSet.YES_NO);
  if (ok !== ui.Button.YES) return;
  var hasil = [];
  Object.keys(APP.IMPORT_FILES).forEach(function (tahun) {
    try { hasil.push(imporTahun_(Number(tahun), APP.IMPORT_FILES[tahun])); }
    catch (e) { hasil.push(tahun + ': GAGAL — ' + e.message); }
  });
  ui.alert('Hasil impor', hasil.join('\n\n') + '\n\nCek sheet Impor_Log (perbandingan total) dan Impor_Review (nama yang perlu dicocokkan).', ui.ButtonSet.OK);
}

function imporTahun_(tahun, fileId) {
  // 1) konversi xlsx → Google Sheets sementara
  var blob = DriveApp.getFileById(fileId).getBlob();
  var tmp = Drive.Files.create({ name: '_tmp_impor_zakat_' + tahun, mimeType: MimeType.GOOGLE_SHEETS }, blob);
  try {
    var src = SpreadsheetApp.openById(tmp.id);
    var find = function (re, not) {
      return src.getSheets().filter(function (s) { var n = s.getName().toUpperCase().trim(); return re.test(n) && !(not && not.test(n)); })[0];
    };
    var shM = find(/MUZAKKI/), shMal = find(/ZAKAT MAAL|ZAKAT MAL/, /SUSULAN/), shSus = find(/SUSULAN/), shAmil = find(/MUSTAHIQ AMIL/);
    if (!shM) throw new Error('Sheet DATA MUZAKKI tidak ditemukan');
    var muz = parseMuzakki_(shM.getDataRange().getValues(), tahun);
    var mal = shMal ? parseMal_(shMal.getDataRange().getValues(), 'UTAMA') : { rows: [], rekap: null };
    var sus = shSus ? parseMal_(shSus.getDataRange().getValues(), 'SUSULAN') : { rows: [], rekap: null };
    var amilBlocks = shAmil ? parseAmil_(shAmil.getDataRange().getValues()) : [];
    return withLock_(function () { return tulisImpor_(tahun, muz, mal, sus, amilBlocks); });
  } finally {
    DriveApp.getFileById(tmp.id).setTrashed(true);
  }
}

function kandidatSensus_() {
  var s = readSensus_(true), arsip = [];
  try { arsip = readArsipSensus_(); } catch (e) { arsip = []; }
  var c = [];
  s.jamaah.concat(arsip).forEach(function (j) {
    c.push({ id: j.id, idKeluarga: j.kk, nama: j.nama, tipe: j.hub === 'A' ? 'KK' : 'JM' });
    if (j.absen && j.absen !== j.nama) c.push({ id: j.id, idKeluarga: j.kk, nama: j.absen, tipe: j.hub === 'A' ? 'KK' : 'JM' });
  });
  var kel = keluargaMap_(s);
  return { list: c, kel: kel };
}

function hapusImporLama_(tahun) {
  ['Setoran_Fitrah', 'Zakat_Lain'].forEach(function (name) {
    var t = readTable_(name);
    t.rows.filter(function (r) { return String(r.Tahun) === String(tahun) && String(r.Sumber) === 'IMPOR'; })
      .map(function (r) { return r._row; }).sort(function (a, b) { return b - a; })
      .forEach(function (rw) { t.sh.deleteRow(rw); });
  });
  ['Impor_Review', 'Impor_Log'].forEach(function (name) {
    var t = readTable_(name);
    t.rows.filter(function (r) { return String(r.Tahun) === String(tahun); })
      .map(function (r) { return r._row; }).sort(function (a, b) { return b - a; })
      .forEach(function (rw) { t.sh.deleteRow(rw); });
  });
  var tb = readTable_('Bagian_Amil');
  tb.rows.filter(function (r) { return String(r.Tahun) === String(tahun) && /impor/i.test(String(r.Catatan)); })
    .map(function (r) { return r._row; }).sort(function (a, b) { return b - a; }).forEach(function (rw) { tb.sh.deleteRow(rw); });
}

function tulisImpor_(tahun, muz, mal, sus, amilBlocks) {
  hapusImporLama_(tahun);
  var c = cfg_(tahun);
  var harga = num_(c.Harga_Soq), kgSoq = num_(c.Kg_Per_Soq);
  var kand = kandidatSensus_();

  // ---- amil tahun ini (dari blok bagian amil) ----
  var amilNama = {};
  amilBlocks.forEach(function (b) { b.items.forEach(function (it) { amilNama[slugAmil_(it.nama)] = { nama: it.nama, saham: it.saham }; }); });
  var tA = readTable_('Amil');
  var adaAmil = tA.rows.filter(function (r) { return String(r.Tahun) === String(tahun); }).map(function (r) { return String(r.ID_Amil); });
  var amilBaru = Object.keys(amilNama).filter(function (id) { return adaAmil.indexOf(id) < 0; }).map(function (id) {
    var m = matchName_(amilNama[id].nama, kand.list);
    return { Tahun: tahun, ID_Amil: id, Nama: titleCase_(amilNama[id].nama), ID_Jamaah: m.status === 'COCOK' ? m.kandidat.id : '', Jabatan: 'Amil', Saham: amilNama[id].saham, Aktif: 'Y' };
  });
  appendObjects_('Amil', amilBaru);
  var amilKand = daftarAmil_(tahun).map(function (a) { return { id: a.id, idKeluarga: '', nama: a.nama, tipe: 'JM' }; });
  var cariAmil = function (raw) {
    if (!raw) return null;
    var m = matchName_(raw, amilKand);
    return m.status !== 'TIDAK_ADA' ? m.kandidat : null;
  };

  // ---- setoran fitrah ----
  var setoran = [], review = [], fid = [];
  muz.rows.forEach(function (r, i) {
    if (r.status === 'TIDAK_SETOR') {
      review.push({ Tahun: tahun, Sumber_Sheet: 'MUZAKKI', Baris: r.baris, Nama_Asli: r.nama, Jiwa_JM: 0, Jiwa_SM: 0, Status: 'TIDAK_SETOR', Catatan: r.catatan || 'Tidak ada jiwa/jenis — tidak diimpor' });
      return;
    }
    var m = matchName_(r.nama, kand.list);
    var am = cariAmil(r.amilRaw);
    var id = 'IMP' + tahun + '-F' + ('00' + (i + 1)).slice(-3);
    var wajib = r.jenis === 'UANG' ? r.total * harga : 0;
    var selisih = r.jenis === 'KAMPUNG' ? 0 : r.kembalian;
    var obj = {
      ID: id, Tahun: tahun, Tanggal: r.tanggal, Waktu_Input: r.tanggal ? r.tanggal + 'T00:00:00' : tahun + '-01-01T00:00:00',
      ID_Keluarga: m.status === 'COCOK' ? m.kandidat.idKeluarga : '', Nama_Muzakki: r.nama,
      ID_Amil: am ? am.id : '', Nama_Amil: am ? am.nama : r.amilRaw, Jenis: r.jenis,
      Jiwa_JM: r.jm, Jiwa_SM: r.sm, Jiwa_Luar: r.luar, Total_Jiwa: r.jenis === 'KAMPUNG' ? (r.total || r.jm) : r.total,
      Kg_Beras: r.jenis === 'BERAS' ? r.total * kgSoq : 0, Harga_Soq: harga, Wajib_Rp: wajib,
      Diterima_Rp: r.jenis === 'KAMPUNG' ? 0 : r.diterima, Selisih_Rp: selisih,
      Tujuan_Lebih: selisih > 0 ? 'UB' : '', Status_Bayar: r.jenis === 'UANG' ? (selisih < 0 ? 'KURANG' : 'LUNAS') : (r.jenis === 'BERAS' ? 'LUNAS' : ''),
      Catatan: ['Impor baris ' + r.baris, r.catatan].filter(String).join(' · '), Sumber: 'IMPOR', Match_Status: m.status
    };
    setoran.push(obj);
    if (r.fidyah > 0) fid.push({ ID: 'IMP' + tahun + '-D' + ('00' + (i + 1)).slice(-3), Tahun: tahun, Tanggal: r.tanggal, Waktu_Input: obj.Waktu_Input, Jenis: 'FIDYAH', Lampiran: '',
      Ref_Tipe: 'KK', Ref_ID: obj.ID_Keluarga, Nama: r.nama, ID_Keluarga: obj.ID_Keluarga, Nominal: r.fidyah, Cara_Bayar: '', ID_Amil: obj.ID_Amil, Nama_Amil: obj.Nama_Amil,
      Catatan: 'Dari keterangan baris ' + r.baris, Sumber: 'IMPOR' });
    if (m.status !== 'COCOK' || r.status !== 'OK' || (!am && r.amilRaw) || /Kolom amil berisi/.test(r.catatan)) {
      review.push({ Tahun: tahun, Sumber_Sheet: 'MUZAKKI', Baris: r.baris, Nama_Asli: r.nama, Jiwa_JM: r.jm, Jiwa_SM: r.sm, Status: m.status === 'COCOK' ? r.status : m.status, Skor: m.skor,
        Saran_ID_Keluarga: m.kandidat ? m.kandidat.idKeluarga : '', Saran_Nama: m.kandidat ? m.kandidat.nama + ' (KK ' + ((kand.kel[m.kandidat.idKeluarga] || {}).nama || '-') + ')' : '',
        Jadikan_SM: r.jm === 0 && r.sm > 0 && m.status !== 'COCOK' ? 'Y?' : '', ID_Setoran: id,
        Catatan: [r.catatan, !am && r.amilRaw ? 'Amil "' + r.amilRaw + '" tidak dikenali' : ''].filter(String).join(' · ') });
    }
  });
  appendObjects_('Setoran_Fitrah', setoran);

  // ---- zakat mal & tijaroh ----
  var lain = [];
  mal.rows.concat(sus.rows).forEach(function (r, i) {
    var m = matchName_(r.nama, kand.list);
    lain.push({ ID: 'IMP' + tahun + '-M' + ('00' + (i + 1)).slice(-3), Tahun: tahun, Tanggal: '', Waktu_Input: tahun + '-01-01T00:00:00', Jenis: r.jenis, Lampiran: r.lampiran,
      Ref_Tipe: m.status === 'COCOK' ? 'JM' : 'LAIN', Ref_ID: m.status === 'COCOK' ? m.kandidat.id : '', Nama: titleCase_(r.nama), ID_Keluarga: m.status === 'COCOK' ? m.kandidat.idKeluarga : '',
      Nominal: r.nominal, Cara_Bayar: '', Catatan: 'Impor baris ' + r.baris + (r.ket ? ' · ' + r.ket : ''), Sumber: 'IMPOR' });
  });
  appendObjects_('Zakat_Lain', lain.concat(fid));

  // ---- bagian amil final (sesuai sheet lama) ----
  var bagian = [];
  ['UTAMA', 'SUSULAN'].forEach(function (lp) {
    var bMal = amilBlocks.filter(function (b) { return b.jenis === 'MAL' && b.lampiran === lp; })[0];
    var bFit = lp === 'UTAMA' ? amilBlocks.filter(function (b) { return b.jenis === 'FITRAH'; })[0] : null;
    var ids = {};
    [bMal, bFit].forEach(function (b) { if (b) b.items.forEach(function (it) { ids[slugAmil_(it.nama)] = it.nama; }); });
    Object.keys(ids).forEach(function (id) {
      var fm = bMal ? bMal.items.filter(function (it) { return slugAmil_(it.nama) === id; })[0] : null;
      var ff = bFit ? bFit.items.filter(function (it) { return slugAmil_(it.nama) === id; })[0] : null;
      bagian.push({ Tahun: tahun, Lampiran: lp, ID_Amil: id, Nama: titleCase_(ids[id]), Beras_Final_Soq: ff ? ff.final : '', Uang_Final_Rp: fm ? Math.round(fm.final) : '', Catatan: 'Impor sheet lama', Diubah: nowIso_() });
    });
  });
  appendObjects_('Bagian_Amil', bagian);
  appendObjects_('Impor_Review', review);

  // ---- cek total vs rekap sheet lama ----
  var sum = function (arr, k) { return arr.reduce(function (a, x) { return a + (Number(x[k]) || 0); }, 0); };
  var logs = [];
  var cek = function (nama, hasil, rekap) {
    var st = rekap === null || rekap === undefined ? 'TIDAK ADA REKAP' : Math.abs(hasil - rekap) < 0.5 ? 'SAMA' : 'BEDA';
    logs.push({ Waktu: nowIso_(), Tahun: tahun, Cek: nama, Hasil_Impor: hasil, Rekap_Sheet_Lama: rekap === null || rekap === undefined ? '' : rekap, Status: st });
    return st;
  };
  var rk = muz.rekap || {};
  var nonKampung = setoran.filter(function (s) { return s.Jenis !== 'KAMPUNG'; });
  cek('Jiwa JM (tanpa zakat di kampung)', sum(nonKampung, 'Jiwa_JM'), rk.jm);
  cek('Jiwa SM', sum(nonKampung, 'Jiwa_SM'), rk.sm);
  cek('Total soq', sum(nonKampung, 'Total_Jiwa'), rk.total);
  cek('Total bayar ke amil (Rp)', sum(muz.rows, 'byrAmil'), rk.byrAmil);
  cek('Total selisih/kembalian (Rp)', sum(muz.rows, 'kembalian'), rk.kembalian);
  cek('Zakat mal & tijaroh utama (Rp)', sum(mal.rows, 'nominal'), mal.rekap ? mal.rekap.total : null);
  if (sus.rows.length) cek('Zakat mal susulan (Rp)', sum(sus.rows, 'nominal'), sus.rekap ? sus.rekap.total : null);
  appendObjects_('Impor_Log', logs);

  var beda = logs.filter(function (l) { return l.Status === 'BEDA'; }).length;
  return tahun + ': ' + setoran.length + ' setoran fitrah, ' + lain.length + ' zakat mal, ' + fid.length + ' fidyah, ' + amilBaru.length + ' amil baru. ' +
    review.length + ' baris perlu dicek. Cek total: ' + (beda ? beda + ' BEDA' : 'semua sama');
}

/** Terapkan isian kolom Pilih_ID_Keluarga / Jadikan_SM di sheet Impor_Review. */
function terapkanReviewImpor() {
  var tR = readTable_('Impor_Review'), tS = readTable_('Setoran_Fitrah');
  var n = 0, sm = 0;
  withLock_(function () {
    tR.rows.forEach(function (r) {
      if (/diterapkan/.test(String(r.Catatan)) || !r.ID_Setoran) return;
      var pilih = String(r.Pilih_ID_Keluarga || '').trim(), jadiSM = String(r.Jadikan_SM).toUpperCase() === 'Y';
      if (!pilih && !jadiSM) return;
      var s = tS.rows.filter(function (x) { return String(x.ID) === String(r.ID_Setoran); })[0];
      if (!s) return;
      var ch = { Match_Status: jadiSM ? 'SM' : 'MANUAL' };
      if (pilih) ch.ID_Keluarga = pilih;
      if (jadiSM) {
        var idSM = newId_('SM');
        appendObjects_('Simpatisan', [{ ID_SM: idSM, Nama: r.Nama_Asli, JK: '', ID_Keluarga: pilih || '', Hubungan: '', Catatan: 'Dari impor ' + r.Tahun, Dibuat: nowIso_() }]);
        sm++;
      }
      updateObject_(tS, s, ch);
      updateObject_(tR, r, { Catatan: (r.Catatan ? r.Catatan + ' · ' : '') + 'diterapkan ' + nowIso_() });
      n++;
    });
  });
  SpreadsheetApp.getUi().alert(n + ' baris diterapkan, ' + sm + ' simpatisan baru dibuat.');
}

function titleCase_(s) {
  s = cellText_(s);
  if (s !== s.toUpperCase()) return s;
  return s.toLowerCase().replace(/(^|[\s.(])([a-z])/g, function (m, a, b) { return a + b.toUpperCase(); });
}
