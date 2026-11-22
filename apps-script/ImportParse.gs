/**
 * Parser sheet pendataan lama (2024: format A, 2025–2026: format B).
 * Fungsi di file ini murni (tanpa SpreadsheetApp) supaya bisa diuji terpisah.
 */

function cellText_(v) { return String(v === null || v === undefined ? '' : v).replace(/\s+/g, ' ').trim(); }
function low_(v) { return cellText_(v).toLowerCase(); }

/** Cari indeks kolom di 2 baris header berdasarkan kata kunci. */
function findCol_(h1, h2, test, startAt) {
  var n = Math.max(h1.length, h2.length);
  for (var i = startAt || 0; i < n; i++) {
    if (test(low_(h1[i])) || test(low_(h2[i]))) return i;
  }
  return -1;
}

/** Data muzakki zakat fitrah. values = getValues() sheet "DATA MUZAKKI - ZAKAT FITRAH". */
function parseMuzakki_(values, tahun) {
  var hr = -1;
  for (var r = 0; r < Math.min(values.length, 20); r++) {
    var row = values[r].map(low_);
    if (row.indexOf('jm bbk') >= 0) { hr = r; break; }
  }
  if (hr < 1) throw new Error('Header "JM BBK" tidak ditemukan di sheet muzakki ' + tahun);
  var h1 = values[hr - 1], h2 = values[hr];
  var col = {
    no: findCol_(h1, h2, function (t) { return t === 'no' || t === '#'; }),
    nama: findCol_(h1, h2, function (t) { return t === 'nama'; }),
    jm: findCol_(h1, h2, function (t) { return t === 'jm bbk'; }),
    luar: findCol_(h1, h2, function (t) { return /^jm (luar|titip)/.test(t); }),
    sm: findCol_(h1, h2, function (t) { return t === 'sm'; }),
    amil: findCol_(h1, h2, function (t) { return /menerima/.test(t); }),
    tgl: findCol_(h1, h2, function (t) { return /tgl setor/.test(t); }),
    byrAmil: findCol_(h1, h2, function (t) { return /byr ke amil/.test(t); }),
    kembalian: findCol_(h1, h2, function (t) { return /kembalian/.test(t); }),
    bayar: findCol_(h1, h2, function (t) { return /jumlah bayar|keterangan bayar/.test(t); }),
    namaSM: findCol_(h1, h2, function (t) { return t === 'nama sm'; })
  };
  col.total = findCol_(h1, h2, function (t) { return /^total/.test(t); }, col.jm + 1);
  // kolom jenis titipan = kolom "(Beras/ Uang)" terakhir sebelum kolom tanggal/amil
  col.jenis = -1;
  for (var i = col.total + 1; i < Math.max(h1.length, h2.length); i++) {
    if (/beras\s*\/\s*uang/.test(low_(h2[i])) || /jenis titipan/.test(low_(h1[i]))) { col.jenis = i; break; }
  }
  ['nama', 'jm', 'sm', 'total', 'jenis', 'amil', 'byrAmil', 'kembalian'].forEach(function (k) {
    if (col[k] < 0) throw new Error('Kolom ' + k + ' tidak ditemukan di sheet muzakki ' + tahun);
  });
  if (col.nama < 0) col.nama = col.no + 1;

  var rows = [], rekap = null;
  for (var r2 = hr + 1; r2 < values.length; r2++) {
    var v = values[r2];
    var nama = cellText_(v[col.nama]);
    var lead = low_(v[col.no]) + ' ' + low_(v[col.nama]);
    if (/jamaah\s*\+\s*sm/.test(lead)) {
      rekap = { jm: num_(v[col.jm]), sm: num_(v[col.sm]), total: num_(v[col.total]), byrAmil: num_(v[col.byrAmil]), kembalian: num_(v[col.kembalian]) };
      break;
    }
    if (/pembagian zakat/.test(lead)) break;
    if (!nama) continue;
    var jm = num_(v[col.jm]), luar = col.luar >= 0 ? num_(v[col.luar]) : 0, sm = num_(v[col.sm]);
    var total = num_(v[col.total]) || jm + luar + sm;
    var jenisRaw = low_(v[col.jenis]);
    var amilRaw = cellText_(v[col.amil]);
    var catatan = [];
    if (/^(titip uang|beras|zakat di kampung)$/i.test(amilRaw)) { catatan.push('Kolom amil berisi "' + amilRaw + '"'); amilRaw = ''; }
    var byrAmil = num_(v[col.byrAmil]), kemb = num_(v[col.kembalian]), bayar = col.bayar >= 0 ? num_(v[col.bayar]) : 0;
    var jenis = /kampung/.test(jenisRaw) ? 'KAMPUNG' : /uang/.test(jenisRaw) ? 'UANG' : /beras/.test(jenisRaw) ? 'BERAS' : '';
    var status = 'OK';
    if (!jenis) {
      if (!total) { status = 'TIDAK_SETOR'; }
      else { jenis = byrAmil > 0 ? 'UANG' : 'BERAS'; status = 'JENIS_DITEBAK'; catatan.push('Jenis kosong, ditebak ' + jenis); }
    }
    var namaSM = col.namaSM >= 0 ? cellText_(v[col.namaSM]) : '';
    var ket = col.namaSM >= 0 ? cellText_(v[col.namaSM + 1]) : '';
    var fidyah = 0;
    var mf = (ket + ' ' + namaSM).match(/fidyah\s*(?:rp\.?)?\s*([\d.,]+)/i);
    if (mf) { fidyah = num_(mf[1]); }
    if (namaSM && !/fidyah/i.test(namaSM)) catatan.push('Nama SM: ' + namaSM);
    if (ket) catatan.push(ket);
    rows.push({
      baris: r2 + 1, nama: nama, amilRaw: amilRaw, jm: jm, luar: luar, sm: sm, total: total, jenis: jenis, status: status,
      tanggal: toDateStr_(v[col.tgl], tahun), byrAmil: byrAmil, kembalian: kemb,
      diterima: bayar || (byrAmil ? byrAmil + kemb : (kemb > 0 ? kemb : 0)), fidyah: fidyah, catatan: catatan.join(' · ')
    });
  }
  return { rows: rows, rekap: rekap, kolom: col };
}

/** Penerimaan zakat mal/tijaroh. lampiran: 'UTAMA' | 'SUSULAN'. */
function parseMal_(values, lampiran) {
  var hr = -1, cNama = -1, cJml = -1, cKet = -1;
  for (var r = 0; r < Math.min(values.length, 30); r++) {
    var row = values[r].map(low_);
    var iN = row.indexOf('nama'), iJ = row.indexOf('jumlah zakat');
    if (iN >= 0 && iJ >= 0) { hr = r; cNama = iN; cJml = iJ; cKet = row.indexOf('keterangan'); break; }
  }
  if (hr < 0) throw new Error('Header "Nama / Jumlah Zakat" tidak ditemukan di sheet zakat mal');
  var rows = [], rekap = null;
  for (var r2 = hr + 1; r2 < values.length; r2++) {
    var v = values[r2];
    var joined = v.map(low_).join(' ');
    if (/^jumlah zakat mal/.test(low_(v[cNama - 1])) || /^jumlah zakat mal/.test(low_(v[cNama])) || /jumlah zakat mal tijaroh/.test(joined)) {
      rekap = { total: num_(v[cJml]) }; break;
    }
    if (/pembagian/.test(joined)) break;
    var nama = cellText_(v[cNama]), jml = num_(v[cJml]);
    if (!nama || !jml) continue;
    var ket = cKet >= 0 ? low_(v[cKet]) : '';
    var jenis = /tijaroh/.test(ket) && /mal/.test(ket) ? 'MAL_TIJAROH' : /tijaroh/.test(ket) ? 'TIJAROH' : 'MAL';
    rows.push({ baris: r2 + 1, nama: nama, nominal: jml, jenis: jenis, lampiran: lampiran, ket: cKet >= 0 ? cellText_(v[cKet]) : '' });
  }
  return { rows: rows, rekap: rekap };
}

/** Sheet "MUSTAHIQ AMIL": blok bagian amil (mal utama, mal susulan, fitrah). */
function parseAmil_(values) {
  var blocks = [], cur = null;
  for (var r = 0; r < values.length; r++) {
    var v = values[r].map(cellText_), j = v.join(' ').toUpperCase();
    if (/BAGIAN AMIL KELOMPOK/.test(j)) {
      cur = { jenis: /FITRAH/.test(j) ? 'FITRAH' : 'MAL', lampiran: /SUSULAN/.test(j) ? 'SUSULAN' : 'UTAMA', items: [], cols: null };
      blocks.push(cur); continue;
    }
    if (!cur) continue;
    var up = v.map(function (x) { return x.toUpperCase(); });
    if (up.indexOf('NAMA AMIL') >= 0) {
      cur.cols = { nama: up.indexOf('NAMA AMIL'), saham: up.indexOf('SAHAM'), bagian: up.indexOf('BAGIAN'), bulat: up.indexOf('PEMBULATAN') };
      continue;
    }
    if (cur.cols) {
      var nama = v[cur.cols.nama];
      if (!nama) { cur.cols = null; continue; }
      if (!/^\d+$/.test(v[cur.cols.nama - 1] || '')) continue;
      var bagian = num_(values[r][cur.cols.bagian]), bulat = cur.cols.bulat >= 0 ? num_(values[r][cur.cols.bulat]) : 0;
      cur.items.push({ nama: nama, saham: num_(values[r][cur.cols.saham]) || 1, bagian: bagian, final: bulat > 0 ? bulat : bagian });
    }
  }
  return blocks;
}

function slugAmil_(nama) { return 'AM-' + normName_(nama).join('-').toUpperCase(); }
