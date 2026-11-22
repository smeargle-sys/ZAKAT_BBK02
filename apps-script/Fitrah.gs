/** Setoran zakat fitrah, zakat mal/tijaroh/fidyah, daftar setoran. */

function setoranFitrah_(tahun) {
  return rowsOf_('Setoran_Fitrah', function (r) { return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y'; });
}
function jiwaFitrah_(tahun) {
  return rowsOf_('Setoran_Fitrah_Jiwa', function (r) { return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y'; });
}
function zakatLain_(tahun) {
  return rowsOf_('Zakat_Lain', function (r) { return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y'; });
}

/** Daftar KK sensus + status zakat fitrah tiap anggota pada tahun berjalan. */
function kkList_(p, s) {
  var tahun = Number(p.tahun || tahunAktif_().Tahun);
  var kel = keluargaMap_(readSensus_());
  var setoran = setoranFitrah_(tahun), jiwa = jiwaFitrah_(tahun);
  var sudahJM = {}, sudahSM = {};
  jiwa.forEach(function (j) { if (j.Tipe === 'JM') sudahJM[j.Ref_ID] = j.ID_Setoran; if (j.Tipe === 'SM') sudahSM[j.Ref_ID] = j.ID_Setoran; });
  var kurang = {}, kkSetor = {};
  setoran.forEach(function (r) {
    kkSetor[r.ID_Keluarga] = true;
    if (r.Status_Bayar === 'KURANG') kurang[r.ID_Keluarga] = (kurang[r.ID_Keluarga] || 0) + Math.abs(num_(r.Selisih_Rp));
  });
  var sm = daftarSimpatisan_();
  var list = Object.keys(kel).map(function (id) {
    var k = kel[id];
    var ang = k.anggota.map(function (j) { return { id: j.id, nama: j.nama, hub: j.hub, umur: j.umur, keberadaan: j.keberadaan, jk: j.jk, sudah: !!sudahJM[j.id], idSetoran: sudahJM[j.id] || '' }; });
    var nSudah = ang.filter(function (a) { return a.sudah; }).length;
    var smKK = sm.filter(function (m) { return m.idKeluarga === id; }).map(function (m) { return { id: m.id, nama: m.nama, hubungan: m.hubungan, sudah: !!sudahSM[m.id] }; });
    var status = kurang[id] ? 'KURANG' : nSudah === 0 ? (kkSetor[id] ? 'SEBAGIAN' : 'BELUM') : nSudah < ang.length ? 'SEBAGIAN' : 'SUDAH';
    return { id: id, nama: k.nama, tanpaKK: !!k.tanpaKK, anggota: ang, simpatisan: smKK, jiwa: ang.length, sudah: nSudah, status: status, kurangRp: kurang[id] || 0 };
  }).sort(function (a, b) { return normName_(a.nama).join(' ') < normName_(b.nama).join(' ') ? -1 : 1; });

  var saya = null;
  if (s.idAmil) {
    var mine = setoran.filter(function (r) { return String(r.ID_Amil) === s.idAmil; });
    saya = { kk: Object.keys(mine.reduce(function (a, r) { a[r.ID_Keluarga || r.ID] = 1; return a; }, {})).length,
      soq: mine.filter(function (r) { return r.Jenis !== 'KAMPUNG'; }).reduce(function (a, r) { return a + num_(r.Total_Jiwa); }, 0),
      uang: mine.reduce(function (a, r) { return a + num_(r.Diterima_Rp); }, 0) };
  }
  return { tahun: tahun, list: list, saya: saya };
}

function getFitrah_(p) {
  var r = rowsOf_('Setoran_Fitrah', function (x) { return String(x.ID) === String(p.id) && x.Dihapus !== 'Y'; })[0];
  if (!r) throw new Error('Setoran tidak ditemukan.');
  var j = rowsOf_('Setoran_Fitrah_Jiwa', function (x) { return String(x.ID_Setoran) === String(p.id) && x.Dihapus !== 'Y'; });
  return { setoran: cleanRow_(r), jm: j.filter(function (x) { return x.Tipe === 'JM'; }).map(function (x) { return String(x.Ref_ID); }),
    sm: j.filter(function (x) { return x.Tipe === 'SM'; }).map(function (x) { return String(x.Ref_ID); }) };
}

function cleanRow_(r) { var o = {}; Object.keys(r).forEach(function (k) { if (k !== '_row') o[k] = r[k]; }); return o; }

function simpanFitrah_(p, s) {
  var tahun = Number(p.tahun || tahunAktif_().Tahun);
  var c = cfg_(tahun);
  if (c.Status !== 'BUKA' && s.role !== 'admin') throw new Error('Penerimaan zakat ' + c.Hijriah + ' sudah ditutup.');
  var batas = parseDateTime_(c.Batas_Fitrah);
  if (batas && new Date() > batas && s.role !== 'admin') {
    throw new Error('Batas zakat fitrah (' + c.Batas_Fitrah + ', sebelum shalat Ied) sudah lewat. Zakat fitrah tidak bisa diterima lagi.');
  }
  var tanggal = toDateStr_(p.tanggal) || fmtDate_(new Date());
  if (batas && tanggal > fmtDate_(batas)) throw new Error('Tanggal setor tidak boleh melewati batas zakat fitrah (' + c.Batas_Fitrah + ').');

  var jenis = String(p.jenis || '').toUpperCase();
  if (!JENIS_FITRAH[jenis]) throw new Error('Pilih jenis zakat: Beras, Titip uang, atau Di kampung.');
  var jm = (p.jm || []).map(String), sm = (p.sm || []).map(String), luar = Math.max(0, Math.round(num_(p.luar)));
  var total = jm.length + sm.length + luar;
  if (total < 1) throw new Error('Centang minimal satu jiwa.');

  var idAmil = s.role === 'amil' ? s.idAmil : String(p.idAmil || s.idAmil || '');
  var amil = daftarAmil_(tahun).filter(function (a) { return a.id === idAmil; })[0];
  if (s.role === 'amil' && !amil) throw new Error('Nama amil tidak terdaftar untuk tahun ini.');

  var harga = num_(c.Harga_Soq), kgSoq = num_(c.Kg_Per_Soq);
  var diterima = Math.round(num_(p.diterima));
  var wajib = 0, kg = 0, selisih = 0, status = '', tujuan = '';
  if (jenis === 'UANG') {
    wajib = total * harga; selisih = diterima - wajib;
    status = selisih < 0 ? 'KURANG' : 'LUNAS';
  } else if (jenis === 'BERAS') {
    kg = p.kg !== undefined && p.kg !== '' ? num_(p.kg) : total * kgSoq;
    selisih = diterima; // uang tambahan saat setor beras
    status = 'LUNAS';
  } else { diterima = 0; }
  if (selisih > 0) tujuan = p.tujuanLebih === 'KEMBALI' ? 'KEMBALI' : 'UB';

  var sen = readSensus_(), kel = keluargaMap_(sen);
  var idKeluarga = String(p.idKeluarga || '');
  var namaMuzakki = p.namaMuzakki || (kel[idKeluarga] ? kel[idKeluarga].nama : '');
  if (!namaMuzakki) throw new Error('Muzakki (KK) belum dipilih.');
  var namaJM = {}; sen.jamaah.forEach(function (j) { namaJM[j.id] = j.nama; });
  var namaSM = {}; daftarSimpatisan_().forEach(function (m) { namaSM[m.id] = m.nama; });

  return withLock_(function () {
    var tJ = readTable_('Setoran_Fitrah_Jiwa');
    var editId = p.id ? String(p.id) : '';
    // cegah satu jiwa dizakati dua kali dalam setahun
    var dup = tJ.rows.filter(function (r) {
      return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y' && String(r.ID_Setoran) !== editId &&
        ((r.Tipe === 'JM' && jm.indexOf(String(r.Ref_ID)) >= 0) || (r.Tipe === 'SM' && sm.indexOf(String(r.Ref_ID)) >= 0));
    });
    if (dup.length) throw new Error('Sudah tercatat zakat tahun ini: ' + dup.map(function (d) { return d.Nama; }).join(', ') + '.');

    var obj = { Tahun: tahun, Tanggal: tanggal, ID_Keluarga: idKeluarga, Nama_Muzakki: namaMuzakki, ID_Amil: idAmil, Nama_Amil: amil ? amil.nama : '',
      Jenis: jenis, Jiwa_JM: jm.length, Jiwa_SM: sm.length, Jiwa_Luar: luar, Total_Jiwa: total, Kg_Beras: kg, Harga_Soq: harga,
      Wajib_Rp: wajib, Diterima_Rp: diterima, Selisih_Rp: selisih, Tujuan_Lebih: tujuan, Status_Bayar: status,
      Catatan: [p.catatan || '', luar && p.luarNama ? 'JM luar: ' + p.luarNama : ''].filter(String).join(' · '), Sumber: 'APP', Match_Status: 'COCOK' };
    var id;
    if (editId) {
      var tS = readTable_('Setoran_Fitrah');
      var row = tS.rows.filter(function (r) { return String(r.ID) === editId && r.Dihapus !== 'Y'; })[0];
      if (!row) throw new Error('Setoran yang diubah tidak ditemukan.');
      if (s.role === 'amil' && String(row.ID_Amil) !== s.idAmil) throw new Error('Amil hanya bisa mengubah setoran yang ia terima sendiri.');
      obj.Diubah_Oleh = s.nama || s.role; obj.Diubah_Waktu = nowIso_();
      updateObject_(tS, row, obj);
      tJ.rows.filter(function (r) { return String(r.ID_Setoran) === editId && r.Dihapus !== 'Y'; }).forEach(function (r) { updateObject_(tJ, r, { Dihapus: 'Y' }); });
      id = editId;
    } else {
      // D-24: siapa yang mencatat (bisa admin atas nama amil). Tidak diubah saat setoran diubah.
      id = newId_('FT'); obj.ID = id; obj.Waktu_Input = nowIso_(); obj.Dicatat_Oleh = s.nama || s.role;
      appendObjects_('Setoran_Fitrah', [obj]);
    }
    appendObjects_('Setoran_Fitrah_Jiwa',
      jm.map(function (x) { return { ID_Setoran: id, Tahun: tahun, Tipe: 'JM', Ref_ID: x, Nama: namaJM[x] || x }; })
        .concat(sm.map(function (x) { return { ID_Setoran: id, Tahun: tahun, Tipe: 'SM', Ref_ID: x, Nama: namaSM[x] || x }; })));

    // fidyah sekalian (opsional)
    if (p.fidyah && num_(p.fidyah.nominal) > 0) {
      appendObjects_('Zakat_Lain', [{ ID: newId_('FD'), Tahun: tahun, Tanggal: tanggal, Waktu_Input: nowIso_(), Jenis: 'FIDYAH', Lampiran: '', Ref_Tipe: 'KK', Ref_ID: idKeluarga,
        Nama: namaMuzakki, ID_Keluarga: idKeluarga, Nominal: Math.round(num_(p.fidyah.nominal)), Hari_Fidyah: num_(p.fidyah.hari) || '', Cara_Bayar: 'Tunai',
        ID_Amil: idAmil, Nama_Amil: amil ? amil.nama : '', Catatan: 'Bersama setoran fitrah ' + id, Sumber: 'APP', Dicatat_Oleh: s.nama || s.role }]);
    }
    log_(s, editId ? 'ubahFitrah' : 'simpanFitrah', { id: id, kk: namaMuzakki, jiwa: total, jenis: jenis, amil: amil ? amil.nama : '' });
    return { id: id, wajib: wajib, selisih: selisih, status: status, tujuan: tujuan, kg: kg };
  });
}

function hapusFitrah_(p, s) {
  return withLock_(function () {
    var tS = readTable_('Setoran_Fitrah');
    var row = tS.rows.filter(function (r) { return String(r.ID) === String(p.id); })[0];
    if (!row) throw new Error('Setoran tidak ditemukan.');
    updateObject_(tS, row, { Dihapus: 'Y', Diubah_Oleh: s.nama || s.role, Diubah_Waktu: nowIso_() });
    var tJ = readTable_('Setoran_Fitrah_Jiwa');
    tJ.rows.filter(function (r) { return String(r.ID_Setoran) === String(p.id); }).forEach(function (r) { updateObject_(tJ, r, { Dihapus: 'Y' }); });
    log_(s, 'hapusFitrah', p.id);
    return { ok: true };
  });
}

/** Zakat Mal / Tijaroh / Mal+Tijaroh / Fidyah. */
function simpanLain_(p, s) {
  var tahun = Number(p.tahun || tahunAktif_().Tahun);
  var c = cfg_(tahun);
  var jenis = String(p.jenis || '').toUpperCase();
  if (JENIS_LAIN.indexOf(jenis) < 0) throw new Error('Jenis tidak valid.');
  var tanggal = toDateStr_(p.tanggal) || fmtDate_(new Date());
  var hari = num_(p.hari);
  var nominal = Math.round(num_(p.nominal));
  if (jenis === 'FIDYAH' && !nominal && hari && num_(c.Tarif_Fidyah)) nominal = hari * num_(c.Tarif_Fidyah);
  if (!(nominal > 0)) throw new Error('Nominal wajib diisi.');
  if (!p.nama) throw new Error('Nama muzakki wajib diisi.');
  var lampiran = '';
  if (jenis !== 'FIDYAH') {
    var tutup = c.Tutup_Rekap_Mal;
    lampiran = (tutup && tanggal > tutup) || c.Status !== 'BUKA' ? 'SUSULAN' : 'UTAMA';
    if (s.role === 'admin' && (p.lampiran === 'UTAMA' || p.lampiran === 'SUSULAN')) lampiran = p.lampiran;
  }
  var idAmil = s.role === 'amil' ? s.idAmil : String(p.idAmil || s.idAmil || '');
  var amil = daftarAmil_(tahun).filter(function (a) { return a.id === idAmil; })[0];
  var obj = { Tahun: tahun, Tanggal: tanggal, Jenis: jenis, Lampiran: lampiran, Ref_Tipe: p.refTipe || 'LAIN', Ref_ID: p.refId || '', Nama: p.nama,
    ID_Keluarga: p.idKeluarga || '', Nominal: nominal, Hari_Fidyah: hari || '', Cara_Bayar: p.caraBayar || '', ID_Amil: idAmil, Nama_Amil: amil ? amil.nama : '',
    Catatan: p.catatan || '', Sumber: 'APP' };
  return withLock_(function () {
    if (p.id) {
      if (s.role !== 'admin') throw new Error('Hanya admin yang bisa mengubah data ini.');
      var t = readTable_('Zakat_Lain');
      var row = t.rows.filter(function (r) { return String(r.ID) === String(p.id); })[0];
      if (!row) throw new Error('Data tidak ditemukan.');
      obj.Diubah_Oleh = s.nama || s.role; obj.Diubah_Waktu = nowIso_();
      updateObject_(t, row, obj); obj.ID = row.ID;
    } else {
      obj.ID = newId_(jenis === 'FIDYAH' ? 'FD' : 'ML'); obj.Waktu_Input = nowIso_(); obj.Dicatat_Oleh = s.nama || s.role;
      appendObjects_('Zakat_Lain', [obj]);
    }
    log_(s, 'simpanLain', { id: obj.ID, jenis: jenis, nominal: nominal, lampiran: lampiran, amil: amil ? amil.nama : '' });
    return { id: obj.ID, lampiran: lampiran, nominal: nominal };
  });
}

function hapusLain_(p, s) {
  return withLock_(function () {
    var t = readTable_('Zakat_Lain');
    var row = t.rows.filter(function (r) { return String(r.ID) === String(p.id); })[0];
    if (!row) throw new Error('Data tidak ditemukan.');
    updateObject_(t, row, { Dihapus: 'Y', Diubah_Oleh: s.nama || s.role, Diubah_Waktu: nowIso_() });
    log_(s, 'hapusLain', p.id);
    return { ok: true };
  });
}

/** Satu setoran zakat lain (mal/tijaroh/fidyah) untuk form ubah admin. */
function getLain_(p) {
  var r = rowsOf_('Zakat_Lain', function (x) { return String(x.ID) === String(p.id) && x.Dihapus !== 'Y'; })[0];
  if (!r) throw new Error('Data tidak ditemukan.');
  var o = cleanRow_(r);
  o.Tahun = Number(o.Tahun); o.Tanggal = toDateStr_(o.Tanggal); o.Nominal = num_(o.Nominal);
  return o;
}

function daftarSetoran_(p) {
  var tahun = Number(p.tahun || tahunAktif_().Tahun);
  // nama per jiwa (D-30): Data Setoran menampilkan siapa saja yang dizakati, bukan hanya nama KK
  var namaJiwa = {};
  jiwaFitrah_(tahun).forEach(function (j) { var k = String(j.ID_Setoran); (namaJiwa[k] = namaJiwa[k] || []).push(String(j.Nama || '')); });
  var f = setoranFitrah_(tahun).map(function (r) {
    return { id: String(r.ID), kelas: 'FITRAH', waktu: String(r.Waktu_Input || r.Tanggal), tanggal: toDateStr_(r.Tanggal), nama: String(r.Nama_Muzakki), jenis: String(r.Jenis), idKeluarga: String(r.ID_Keluarga || ''), match: String(r.Match_Status || ''),
      jiwa: { jm: num_(r.Jiwa_JM), sm: num_(r.Jiwa_SM), luar: num_(r.Jiwa_Luar) }, kg: num_(r.Kg_Beras), wajib: num_(r.Wajib_Rp), diterima: num_(r.Diterima_Rp),
      selisih: num_(r.Selisih_Rp), tujuan: String(r.Tujuan_Lebih || ''), status: String(r.Status_Bayar || ''), amil: String(r.Nama_Amil || ''), dicatat: String(r.Dicatat_Oleh || ''), sumber: String(r.Sumber || ''), catatan: String(r.Catatan || ''),
      jiwaNama: namaJiwa[String(r.ID)] || [] };
  });
  var l = zakatLain_(tahun).map(function (r) {
    return { id: String(r.ID), kelas: 'LAIN', waktu: String(r.Waktu_Input || r.Tanggal), tanggal: toDateStr_(r.Tanggal), nama: String(r.Nama), jenis: String(r.Jenis),
      lampiran: String(r.Lampiran || ''), nominal: num_(r.Nominal), hari: num_(r.Hari_Fidyah), amil: String(r.Nama_Amil || ''), dicatat: String(r.Dicatat_Oleh || ''), sumber: String(r.Sumber || ''), catatan: String(r.Catatan || '') };
  });
  var all = f.concat(l);
  if (p.kelas) all = all.filter(function (x) { return x.kelas === p.kelas; });
  return all.sort(function (a, b) { return a.waktu < b.waktu ? 1 : -1; });
}
