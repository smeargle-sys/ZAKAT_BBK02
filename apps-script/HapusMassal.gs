/**
 * Hapus massal setoran satu tahun (force majeure, D-37): dipakai bila terjadi salah input massal
 * yang tidak mungkin dihapus satu per satu. Dijalankan pemilik dari menu Zakat di spreadsheet.
 *
 * - Hanya data dari aplikasi (Sumber = APP). Data impor dikelola lewat impor ulang.
 * - Soft delete (Dihapus = Y), kecuali Bagian_Amil (tabel "ganti semua") yang barisnya disimpan di Log lalu dihapus.
 * - Setiap eksekusi punya kode batch dan bisa DIPULIHKAN lewat menu "Pulihkan hapus massal".
 * - Daftar mustahiq (penerima) dan konfigurasi tidak ikut dihapus.
 */
var MASSAL_TABEL = [
  { nama: 'Setoran_Fitrah', kunci: function (r) { return String(r.ID); }, cocok: function (r) { return r.Sumber === 'APP'; } },
  // tabel rincian jiwa tidak pernah dihapus fisik (impor tidak menyentuhnya), jadi nomor baris stabil; kunci isi bisa kembar
  // karena setoran yang diubah menyisakan baris lama berstatus terhapus
  { nama: 'Setoran_Fitrah_Jiwa', kunci: function (r) { return 'baris-' + r._row; } },
  { nama: 'Zakat_Lain', kunci: function (r) { return String(r.ID); }, cocok: function (r) { return r.Sumber === 'APP'; } },
  { nama: 'Serah_UB', kunci: function (r) { return String(r.ID); } },
  { nama: 'Pembelian_Beras', kunci: function (r) { return String(r.ID); } },
  { nama: 'Mustahiq_Serah', kunci: function (r) { return String(r.ID); } }
];

/** Hitung baris yang akan terhapus untuk satu tahun (tanpa mengubah apa pun). */
function hitungHapusMassal_(tahun) {
  var out = {};
  MASSAL_TABEL.forEach(function (tb) {
    if (!ss_().getSheetByName(tb.nama)) { out[tb.nama] = 0; return; }
    out[tb.nama] = readTable_(tb.nama).rows.filter(function (r) {
      return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y' && (!tb.cocok || tb.cocok(r));
    }).length;
  });
  out.Bagian_Amil = rowsOf_('Bagian_Amil', function (r) { return String(r.Tahun) === String(tahun); }).length;
  return out;
}

function hapusMassal_(tahun, oleh) {
  tahun = Number(tahun);
  cfg_(tahun); // tahun harus ada
  var batch = 'HM-' + Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyMMddHHmmss');
  var sess = { role: 'admin', nama: oleh || 'pemilik' };
  return withLock_(function () {
    var jumlah = {};
    MASSAL_TABEL.forEach(function (tb) {
      if (!ss_().getSheetByName(tb.nama)) { jumlah[tb.nama] = 0; return; }
      var t = readTable_(tb.nama), keys = [];
      t.rows.forEach(function (r) {
        if (String(r.Tahun) !== String(tahun) || r.Dihapus === 'Y' || (tb.cocok && !tb.cocok(r))) return;
        var ch = { Dihapus: 'Y' };
        if (t.headers.indexOf('Diubah_Oleh') >= 0) { ch.Diubah_Oleh = 'HAPUS MASSAL ' + batch; ch.Diubah_Waktu = nowIso_(); }
        updateObject_(t, r, ch);
        keys.push(tb.kunci(r));
      });
      jumlah[tb.nama] = keys.length;
      logMassal_(sess, 'hapusMassal', batch, tahun, tb.nama, keys);
    });
    // Bagian_Amil: tabel "ganti semua" tanpa kolom Dihapus. Isinya disimpan di Log supaya bisa dipulihkan.
    var ba = readTable_('Bagian_Amil'), simpan = [];
    ba.rows.filter(function (r) { return String(r.Tahun) === String(tahun); }).sort(function (a, b) { return b._row - a._row; }).forEach(function (r) {
      var o = {}; ba.headers.forEach(function (h) { o[h] = r[h]; }); simpan.push(o); ba.sh.deleteRow(r._row);
    });
    jumlah.Bagian_Amil = simpan.length;
    logMassal_(sess, 'hapusMassal', batch, tahun, 'Bagian_Amil', simpan);
    log_(sess, 'hapusMassalSelesai', { batch: batch, tahun: tahun, jumlah: jumlah });
    return { batch: batch, tahun: tahun, jumlah: jumlah };
  });
}

/** Simpan kunci per tabel di Log, dipecah supaya muat di satu sel (maks. ±45.000 karakter). */
function logMassal_(sess, aksi, batch, tahun, tabel, isi) {
  var bagian = [], cur = [], panjang = 0;
  isi.forEach(function (x) {
    var n = JSON.stringify(x).length + 1;
    if (panjang + n > 40000 && cur.length) { bagian.push(cur); cur = []; panjang = 0; }
    cur.push(x); panjang += n;
  });
  if (cur.length || !bagian.length) bagian.push(cur);
  bagian.forEach(function (b) { log_(sess, aksi, { batch: batch, tahun: tahun, tabel: tabel, isi: b }); });
}

/** Batch hapus massal yang belum dipulihkan, terbaru dulu. */
function daftarBatchMassal_() {
  var logs = rowsOf_('Log', function (r) { return r.Aksi === 'hapusMassalSelesai' || r.Aksi === 'pulihkanMassalSelesai'; });
  var pulih = {}, out = [];
  logs.forEach(function (r) { try { var d = JSON.parse(r.Detail); if (r.Aksi === 'pulihkanMassalSelesai') pulih[d.batch] = 1; } catch (e) { /* abaikan */ } });
  logs.forEach(function (r) { try { var d = JSON.parse(r.Detail); if (r.Aksi === 'hapusMassalSelesai' && !pulih[d.batch]) out.unshift(d); } catch (e) { /* abaikan */ } });
  return out;
}

function pulihkanMassal_(batch, oleh) {
  var sess = { role: 'admin', nama: oleh || 'pemilik' };
  var bagian = rowsOf_('Log', function (r) { return r.Aksi === 'hapusMassal'; }).map(function (r) {
    try { return JSON.parse(r.Detail); } catch (e) { return null; }
  }).filter(function (d) { return d && d.batch === batch; });
  if (!bagian.length) throw new Error('Kode batch ' + batch + ' tidak ditemukan di Log.');
  if (!daftarBatchMassal_().some(function (d) { return d.batch === batch; })) throw new Error('Batch ' + batch + ' sudah pernah dipulihkan.');
  return withLock_(function () {
    var jumlah = {};
    MASSAL_TABEL.forEach(function (tb) {
      var kunci = {};
      bagian.filter(function (d) { return d.tabel === tb.nama; }).forEach(function (d) { d.isi.forEach(function (k) { kunci[k] = 1; }); });
      if (!Object.keys(kunci).length || !ss_().getSheetByName(tb.nama)) { jumlah[tb.nama] = 0; return; }
      var t = readTable_(tb.nama), n = 0;
      t.rows.forEach(function (r) {
        if (r.Dihapus !== 'Y' || !kunci[tb.kunci(r)]) return;
        var ch = { Dihapus: '' };
        if (t.headers.indexOf('Diubah_Oleh') >= 0) { ch.Diubah_Oleh = 'PULIHKAN ' + batch; ch.Diubah_Waktu = nowIso_(); }
        updateObject_(t, r, ch); n++;
      });
      jumlah[tb.nama] = n;
    });
    var ba = [];
    bagian.filter(function (d) { return d.tabel === 'Bagian_Amil'; }).forEach(function (d) { ba = ba.concat(d.isi); });
    appendObjects_('Bagian_Amil', ba);
    jumlah.Bagian_Amil = ba.length;
    log_(sess, 'pulihkanMassalSelesai', { batch: batch, jumlah: jumlah });
    return { batch: batch, jumlah: jumlah };
  });
}

function ringkasJumlah_(j) {
  var label = { Setoran_Fitrah: 'Setoran zakat fitrah', Setoran_Fitrah_Jiwa: 'Rincian jiwa', Zakat_Lain: 'Zakat mal/tijaroh/fidyah',
    Serah_UB: 'Serah terima UB', Pembelian_Beras: 'Pembelian beras', Mustahiq_Serah: 'Penyerahan mustahiq', Bagian_Amil: 'Bagian amil (musyawarah)' };
  return Object.keys(label).map(function (k) { return '• ' + label[k] + ': ' + (j[k] || 0) + ' baris'; }).join('\n');
}

/* ---------- menu spreadsheet ---------- */
function menuHapusMassal() {
  var ui = SpreadsheetApp.getUi();
  var a = ui.prompt('Hapus massal setoran (force majeure)',
    'Tahun yang SELURUH data setorannya akan dihapus (mis. 2027).\nHanya data yang dicatat lewat aplikasi; data impor tidak tersentuh.', ui.ButtonSet.OK_CANCEL);
  if (a.getSelectedButton() !== ui.Button.OK) return;
  var tahun = Number(String(a.getResponseText()).trim());
  try {
    cfg_(tahun);
    var j = hitungHapusMassal_(tahun), total = Object.keys(j).reduce(function (s, k) { return s + j[k]; }, 0);
    if (!total) { ui.alert('Tidak ada data setoran aplikasi untuk tahun ' + tahun + '.'); return; }
    var kode = 'HAPUS ' + tahun;
    var b = ui.prompt('Konfirmasi hapus massal ' + tahun,
      'Data berikut akan ditandai terhapus dan tidak dihitung lagi:\n' + ringkasJumlah_(j) +
      '\n\nDaftar mustahiq & konfigurasi tidak ikut dihapus. Bisa dipulihkan lewat menu "Pulihkan hapus massal".\n\nKetik  ' + kode + '  untuk melanjutkan:', ui.ButtonSet.OK_CANCEL);
    if (b.getSelectedButton() !== ui.Button.OK) return;
    if (String(b.getResponseText()).trim().toUpperCase() !== kode) { ui.alert('Teks konfirmasi tidak sesuai. Tidak ada data yang dihapus.'); return; }
    var r = hapusMassal_(tahun, 'pemilik spreadsheet');
    ui.alert('Selesai. Kode batch: ' + r.batch + '\n\n' + ringkasJumlah_(r.jumlah) + '\n\nSimpan kode batch ini bila ingin memulihkan.');
  } catch (e) { ui.alert(e.message); }
}

function menuPulihkanMassal() {
  var ui = SpreadsheetApp.getUi();
  try {
    var list = daftarBatchMassal_();
    if (!list.length) { ui.alert('Tidak ada hapus massal yang bisa dipulihkan.'); return; }
    var a = ui.prompt('Pulihkan hapus massal', 'Batch yang bisa dipulihkan:\n' + list.slice(0, 5).map(function (d) { return '• ' + d.batch + ' (tahun ' + d.tahun + ')'; }).join('\n') +
      '\n\nKetik kode batch yang akan dipulihkan:', ui.ButtonSet.OK_CANCEL);
    if (a.getSelectedButton() !== ui.Button.OK) return;
    var r = pulihkanMassal_(String(a.getResponseText()).trim(), 'pemilik spreadsheet');
    ui.alert('Dipulihkan (' + r.batch + '):\n' + ringkasJumlah_(r.jumlah));
  } catch (e) { ui.alert(e.message); }
}
