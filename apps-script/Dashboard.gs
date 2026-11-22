/** Agregasi untuk Dashboard Pemantauan & Tren Tahunan. */

function sum_(arr, fn) { return arr.reduce(function (a, x) { return a + (fn(x) || 0); }, 0); }

function ringkasTahun_(tahun, detail) {
  var c = cfg_(tahun);
  var F = setoranFitrah_(tahun), L = zakatLain_(tahun);
  var isUang = function (r) { return r.Jenis === 'UANG'; }, isBeras = function (r) { return r.Jenis === 'BERAS'; }, isKampung = function (r) { return r.Jenis === 'KAMPUNG'; };
  var fit = {
    jm: sum_(F, function (r) { return num_(r.Jiwa_JM); }),
    sm: sum_(F, function (r) { return num_(r.Jiwa_SM); }),
    luar: sum_(F, function (r) { return num_(r.Jiwa_Luar); }),
    kampung: sum_(F.filter(isKampung), function (r) { return num_(r.Total_Jiwa); }),
    berasSoq: sum_(F.filter(isBeras), function (r) { return num_(r.Total_Jiwa); }),
    berasKg: sum_(F.filter(isBeras), function (r) { return num_(r.Kg_Beras); }),
    uangSoq: sum_(F.filter(isUang), function (r) { return num_(r.Total_Jiwa); }),
    uangWajib: sum_(F.filter(isUang), function (r) { return num_(r.Wajib_Rp); }),
    uangDiterima: sum_(F, function (r) { return num_(r.Diterima_Rp); }),
    lebihUB: sum_(F.filter(function (r) { return num_(r.Selisih_Rp) > 0 && r.Tujuan_Lebih !== 'KEMBALI'; }), function (r) { return num_(r.Selisih_Rp); }),
    kembali: sum_(F.filter(function (r) { return num_(r.Selisih_Rp) > 0 && r.Tujuan_Lebih === 'KEMBALI'; }), function (r) { return num_(r.Selisih_Rp); }),
    kurang: sum_(F.filter(function (r) { return r.Status_Bayar === 'KURANG'; }), function (r) { return Math.abs(num_(r.Selisih_Rp)); }),
    kkLebih: F.filter(function (r) { return num_(r.Selisih_Rp) > 0 && r.Tujuan_Lebih !== 'KEMBALI'; }).length,
    kkKurang: F.filter(function (r) { return r.Status_Bayar === 'KURANG'; }).length,
    setoran: F.length
  };
  fit.berasKg = Math.round(fit.berasKg * 100) / 100;
  fit.soqDiterima = fit.berasSoq + fit.uangSoq;
  fit.totalJiwa = fit.soqDiterima + fit.kampung;
  fit.kgTotal = fit.berasKg + fit.uangSoq * num_(c.Kg_Per_Soq);

  var aktif = tahunAktif_().Tahun === tahun && c.Status === 'BUKA';
  var sen = (aktif || !c.Jiwa_Sensus) ? readSensus_() : null;
  var jiwaSensus = sen ? sen.jamaah.length : num_(c.Jiwa_Sensus);
  var kkSensus = sen ? sen.keluarga.length : num_(c.KK_Sensus);
  // KK = hanya yang punya ID Keluarga di sensus. Jamaah tanpa ID Keluarga (TANPA-KK-…) dihitung sebagai jiwa, bukan KK (D-28).
  var kkSetor = Object.keys(F.reduce(function (a, r) { if (r.ID_Keluarga && !isTanpaKK_(r.ID_Keluarga)) a[r.ID_Keluarga] = 1; return a; }, {})).length;

  // zakat mal & tijaroh per lampiran
  var lainMal = L.filter(function (r) { return r.Jenis !== 'FIDYAH'; });
  var mal = {};
  ['UTAMA', 'SUSULAN'].forEach(function (lp) {
    var rows = lainMal.filter(function (r) { return String(r.Lampiran || 'UTAMA') === lp; });
    mal[lp] = {
      mal: sum_(rows.filter(function (r) { return r.Jenis === 'MAL'; }), function (r) { return num_(r.Nominal); }),
      tijaroh: sum_(rows.filter(function (r) { return r.Jenis === 'TIJAROH'; }), function (r) { return num_(r.Nominal); }),
      campuran: sum_(rows.filter(function (r) { return r.Jenis === 'MAL_TIJAROH'; }), function (r) { return num_(r.Nominal); }),
      muzakki: Object.keys(rows.reduce(function (a, r) { a[normName_(r.Nama).join(' ')] = 1; return a; }, {})).length
    };
    mal[lp].total = mal[lp].mal + mal[lp].tijaroh + mal[lp].campuran;
  });
  var malTotal = mal.UTAMA.total + mal.SUSULAN.total;
  var fid = L.filter(function (r) { return r.Jenis === 'FIDYAH'; });

  var out = {
    tahun: tahun, hijriah: c.Hijriah, status: c.Status, harga: num_(c.Harga_Soq), kgSoq: num_(c.Kg_Per_Soq),
    jiwaSensus: jiwaSensus, kkSensus: kkSensus, kkSetor: kkSetor,
    partisipasi: jiwaSensus ? fit.jm / jiwaSensus : 0,
    fitrah: fit, mal: mal, malTotal: malTotal,
    malMuzakki: Object.keys(lainMal.reduce(function (a, r) { a[normName_(r.Nama).join(' ')] = 1; return a; }, {})).length,
    fidyah: { total: sum_(fid, function (r) { return num_(r.Nominal); }), orang: fid.length },
    // D-35: tahun yang punya daftar mustahiq memakai jumlah dari daftar; tahun lama memakai angka manual
    jiwaMustahiq: jiwaMustahiqDaftar_(tahun) || num_(c.Jiwa_Mustahiq),
    jumlahAmil: daftarAmil_(tahun).filter(function (a) { return a.aktif; }).length
  };
  if (!detail) return out;

  // ---- detail untuk dashboard pemantauan ----
  var fParts = [{ key: 'sabilillah', pct: c.F_Sabilillah }, { key: 'mustahiq', pct: c.F_Mustahiq }, { key: 'amilKlp', pct: c.F_AmilKlp }, { key: 'amilDesa', pct: c.F_AmilDesa }, { key: 'amilDaerah', pct: c.F_AmilDaerah }];
  var mParts = [{ key: 'sabilillah', pct: c.M_Sabilillah }, { key: 'mustahiq', pct: c.M_Mustahiq }, { key: 'amilKlp', pct: c.M_AmilKlp }, { key: 'amilDesa', pct: c.M_AmilDesa }, { key: 'amilDaerah', pct: c.M_AmilDaerah }];
  var tujuan = { sabilillah: 'Daerah', mustahiq: null, amilKlp: 'Kelompok', amilDesa: 'Desa', amilDaerah: 'Daerah' };
  var bf = bagiFitrah_(c, fit.soqDiterima);
  out.pembagianFitrah = fParts.map(function (x) { return { key: x.key, pct: x.pct, soq: bf[x.key], kg: bf[x.key] * num_(c.Kg_Per_Soq), ke: tujuan[x.key] || c.F_Mustahiq_Ke || 'Kelompok' }; });
  out.pembagianMal = {};
  ['UTAMA', 'SUSULAN'].forEach(function (lp) {
    var bm = splitLargestRemainder_(mal[lp].total, mParts);
    var rows = mParts.map(function (x) { return { key: x.key, pct: x.pct, rp: bm[x.key], ke: tujuan[x.key] || c.M_Mustahiq_Ke || 'Daerah' }; });
    var setor = { Kelompok: 0, Desa: 0, Daerah: 0 };
    rows.forEach(function (r) { setor[r.ke] = (setor[r.ke] || 0) + r.rp; });
    out.pembagianMal[lp] = { rows: rows, setor: setor, total: mal[lp].total };
  });

  // per amil
  var amilList = daftarAmil_(tahun);
  var per = {};
  amilList.forEach(function (a) { per[a.id] = { id: a.id, nama: a.nama, kk: {}, beras: 0, uang: 0, rp: 0, lebihUB: 0, serahUB: 0, saham: a.saham, aktif: a.aktif }; });
  F.forEach(function (r) {
    var k = String(r.ID_Amil || '') || '_';
    if (!per[k]) per[k] = { id: k, nama: r.Nama_Amil || 'Tanpa amil', kk: {}, beras: 0, uang: 0, rp: 0, lebihUB: 0, serahUB: 0, saham: 0, aktif: false };
    per[k].kk[r.ID_Keluarga || r.ID] = 1;
    if (r.Jenis === 'BERAS') per[k].beras += num_(r.Total_Jiwa);
    if (r.Jenis === 'UANG') per[k].uang += num_(r.Total_Jiwa);
    per[k].rp += num_(r.Diterima_Rp);
    if (num_(r.Selisih_Rp) > 0 && r.Tujuan_Lebih !== 'KEMBALI') per[k].lebihUB += num_(r.Selisih_Rp);
  });
  var serah = rowsOf_('Serah_UB', function (r) { return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y'; });
  serah.forEach(function (r) {
    var k = String(r.ID_Amil || '') || '_';
    if (!per[k]) per[k] = { id: k, nama: r.Nama_Amil || 'Tanpa amil', kk: {}, beras: 0, uang: 0, rp: 0, lebihUB: 0, serahUB: 0, saham: 0, aktif: false };
    per[k].serahUB += num_(r.Nominal);
    per[k].serahTerakhir = toDateStr_(r.Tanggal) + (r.Penerima ? ' · ke ' + r.Penerima : '');
  });
  out.perAmil = Object.keys(per).map(function (k) { var x = per[k]; x.kk = Object.keys(x.kk).length; x.total = x.beras + x.uang; return x; })
    .sort(function (a, b) { return b.total - a.total; });
  out.ub = { terkumpul: fit.lebihUB, diserahkan: sum_(serah, function (r) { return num_(r.Nominal); }), kembali: fit.kembali, kkLebih: fit.kkLebih, serahCount: serah.length };
  out.ub.dipegang = out.ub.terkumpul - out.ub.diserahkan;

  // bagian amil: hitungan per saham + angka final hasil musyawarah
  var bagian = rowsOf_('Bagian_Amil', function (r) { return String(r.Tahun) === String(tahun); });
  var aktifAmil = amilList.filter(function (a) { return a.aktif; });
  var totalSaham = sum_(aktifAmil, function (a) { return a.saham; }) || 1;
  out.bagianAmil = {};
  ['UTAMA', 'SUSULAN'].forEach(function (lp) {
    var poolSoq = lp === 'UTAMA' ? bf.amilKlp : 0;
    var poolRp = out.pembagianMal[lp].rows.filter(function (r) { return r.key === 'amilKlp'; })[0].rp;
    var fin = bagian.filter(function (r) { return String(r.Lampiran || 'UTAMA') === lp; });
    var hitU = splitLargestRemainder_(poolRp, aktifAmil.map(function (a) { return { key: a.id, pct: a.saham }; }));
    var items = aktifAmil.map(function (a) {
      var f = fin.filter(function (r) { return String(r.ID_Amil) === a.id; })[0];
      return { idAmil: a.id, nama: a.nama, saham: a.saham, hitBeras: Math.round(poolSoq * a.saham / totalSaham * 10) / 10, hitUang: hitU[a.id] || 0,
        beras: f ? num_(f.Beras_Final_Soq) : '', uang: f ? num_(f.Uang_Final_Rp) : '' };
    });
    var finBeras = sum_(items, function (i) { return i.beras === '' ? 0 : i.beras; }), finUang = sum_(items, function (i) { return i.uang === '' ? 0 : i.uang; });
    out.bagianAmil[lp] = { poolSoq: poolSoq, poolRp: poolRp, items: items, adaFinal: fin.length > 0, sisaSoq: fin.length ? poolSoq - finBeras : 0, sisaRp: fin.length ? poolRp - finUang : 0,
      catatan: fin.length ? String(fin[0].Catatan || '') : '' };
  });

  // harian
  var hari = {};
  F.filter(function (r) { return r.Jenis !== 'KAMPUNG'; }).forEach(function (r) { var d = toDateStr_(r.Tanggal) || 'tanpa tanggal'; hari[d] = (hari[d] || 0) + num_(r.Total_Jiwa); });
  out.harian = Object.keys(hari).sort().map(function (d) { return { tanggal: d, soq: hari[d] }; });

  // pembelian beras
  var beli = rowsOf_('Pembelian_Beras', function (r) { return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y'; });
  out.beras = { kebutuhanKg: fit.uangSoq * num_(c.Kg_Per_Soq), dibeliKg: sum_(beli, function (r) { return num_(r.Kg); }), dibeliRp: sum_(beli, function (r) { return num_(r.Rupiah); }),
    list: beli.map(function (r) { return { id: String(r.ID), tanggal: toDateStr_(r.Tanggal), kg: num_(r.Kg), rp: num_(r.Rupiah), catatan: String(r.Catatan || '') }; }) };
  out.beras.sisaDana = fit.uangWajib - out.beras.dibeliRp;
  out.serahUB = serah.map(function (r) { return { id: String(r.ID), tanggal: toDateStr_(r.Tanggal), amil: String(r.Nama_Amil || ''), nominal: num_(r.Nominal), penerima: String(r.Penerima || '') }; });

  // belum setor & kurang bayar (hanya bermakna untuk data dari aplikasi)
  if (aktif) {
    var kk = kkList_({ tahun: tahun }, {}).list;
    // Daftar belum per KK hanya KK asli. Jamaah tanpa KK tetap wajib dizakati, jadi ditampilkan
    // terpisah sebagai daftar jiwa (D-28), dan tetap masuk hitungan jiwa belum.
    out.belumTanpaKK = kk.filter(function (k) { return k.tanpaKK && k.status !== 'SUDAH'; }).map(function (k) {
      var a = k.anggota[0] || {};
      return { id: k.id, nama: a.nama || k.nama, keberadaan: a.keberadaan || '', status: k.status, kurangRp: k.kurangRp };
    });
    out.belum = kk.filter(function (k) { return !k.tanpaKK && k.status !== 'SUDAH'; }).map(function (k) {
      var bel = k.anggota.filter(function (a) { return !a.sudah; });
      return { id: k.id, nama: k.nama, jiwa: k.jiwa, belum: bel.length, anggota: bel.length === k.anggota.length ? 'Semua anggota' : bel.map(function (a) { return a.nama + (a.keberadaan !== 'Menetap' ? ' (' + a.keberadaan + ')' : ''); }).join(', '),
        status: k.status, kurangRp: k.kurangRp };
    });
    out.jiwaBelum = jiwaSensus - sum_(kk, function (k) { return k.sudah; });
    out.progres = progresJamaah_(kk, F, c, jiwaSensus);
  }
  out.terbaru = daftarSetoran_({ tahun: tahun }).slice(0, 15);
  var idf = c.Tgl_Idul_Fitri ? new Date(c.Tgl_Idul_Fitri + 'T00:00:00+07:00') : null;
  out.hMinus = idf ? Math.ceil((idf - new Date(fmtDate_(new Date()) + 'T00:00:00+07:00')) / 864e5) : null;
  if (out.progres) out.progres.hMinus = out.hMinus;
  out.config = c;
  out.penandatangan = penandatangan_(c);
  out.batasLewat = batasFitrahLewat_(c);
  out.diperbarui = nowIso_();
  return out;
}

function dashboard_(p, s) {
  var out = ringkasTahun_(Number(p.tahun || tahunAktif_().Tahun), true);
  // D-34: bagian amil kelompok (hitungan & hasil musyawarah) hanya untuk admin; tidak dikirim ke amil/pengurus
  if (!s || s.role !== 'admin') delete out.bagianAmil;
  return out;
}

function tren_() {
  return configs_().map(function (c) {
    try { return ringkasTahun_(c.Tahun, false); } catch (e) { return { tahun: c.Tahun, error: String(e.message) }; }
  });
}

function isTanpaKK_(id) { return String(id).indexOf('TANPA-KK-') === 0; }

/**
 * Progres untuk dibagikan ke jamaah (D-26): tanpa nominal, tanpa nama.
 * KK = KK asli (punya ID Keluarga); jiwa = semua jamaah sensus, termasuk yang "Di kampung".
 * "Hari ini" = pertambahan dari setoran ber-Tanggal hari ini.
 */
function progresJamaah_(kk, F, c, jiwaTotal) {
  var hariIni = fmtDate_(new Date()), idHariIni = {};
  F.forEach(function (r) { if (toDateStr_(r.Tanggal) === hariIni) idHariIni[String(r.ID)] = 1; });
  var o = { kkTotal: 0, kkSudah: 0, kkSebagian: 0, jiwaTotal: jiwaTotal, jiwaSudah: 0, kkHariIni: 0, jiwaHariIni: 0,
    tanggal: hariIni, hMinus: null, batasFitrah: String(c.Batas_Fitrah || ''), batasLewat: batasFitrahLewat_(c) };
  kk.forEach(function (k) {
    var sudah = 0, sebelumHariIni = 0;
    k.anggota.forEach(function (a) {
      if (!a.sudah) return;
      sudah++;
      if (idHariIni[a.idSetoran]) o.jiwaHariIni++; else sebelumHariIni++;
    });
    o.jiwaSudah += sudah;
    if (k.tanpaKK || !k.anggota.length) return;
    o.kkTotal++;
    if (sudah === k.anggota.length) { o.kkSudah++; if (sebelumHariIni < k.anggota.length) o.kkHariIni++; }
    else if (sudah > 0) o.kkSebagian++;
  });
  return o;
}

/** Pembagian zakat fitrah (soq) dengan sisa terbesar: dipakai Pemantauan, laporan, dan mustahiq. */
function bagiFitrah_(c, soq) {
  return splitLargestRemainder_(soq, [{ key: 'sabilillah', pct: num_(c.F_Sabilillah) }, { key: 'mustahiq', pct: num_(c.F_Mustahiq) },
    { key: 'amilKlp', pct: num_(c.F_AmilKlp) }, { key: 'amilDesa', pct: num_(c.F_AmilDesa) }, { key: 'amilDaerah', pct: num_(c.F_AmilDaerah) }]);
}

function jiwaMustahiqDaftar_(tahun) {
  return sum_(mustahiqTahun_(tahun), function (r) { return r.Tipe === 'LUAR' ? Math.max(1, Math.round(num_(r.Jiwa))) : 1; });
}
