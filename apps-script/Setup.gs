/** Setup sheet, menu, dan PIN. Jalankan dari menu "Zakat" di spreadsheet. */

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Zakat')
    .addItem('1. Setup / perbarui struktur sheet', 'setupZakat')
    .addItem('2. Buat akun Admin', 'buatAdminDialog')
    .addSeparator()
    .addItem('3. Impor data lama 2024–2026', 'imporSemua')
    .addItem('4. Terapkan hasil review impor', 'terapkanReviewImpor')
    .addSeparator()
    .addItem('Cek koneksi ke sensus', 'cekSensus')
    .addToUi();
}

/**
 * Pemanas cache (opsional, D-32): menyegarkan cache sensus dan menghitung ulang Pemantauan & Tren
 * tahun aktif, supaya pembukaan pertama di HP tidak menunggu perhitungan.
 * Cara pasang (sekali, tanpa izin tambahan): editor Apps Script › Triggers (ikon jam) › Add Trigger ›
 * function hangatkanCache · Time-driven · Minutes timer · Every 10 minutes.
 * Trigger sengaja tidak dibuat lewat kode: itu menambah izin baru yang bisa membuat Web App
 * gagal sampai pemilik menyetujui ulang.
 */
function hangatkanCache() {
  memoReset_(true);
  try {
    readSensus_(true);
    var ver = versiData_(), tahun = String(tahunAktif_().Tahun);
    cacheSimpan_(['r', 'dashboard', ver, tahun, '', ''].join('|'), JSON.stringify(dashboard_({ tahun: tahun })));
    cacheSimpan_(['r', 'tren', ver, '', '', ''].join('|'), JSON.stringify(tren_()));
  } finally { memoReset_(false); }
}

function setupZakat() {
  var ss = ss_();
  Object.keys(SHEETS).forEach(function (name) {
    var cols = SHEETS[name];
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    var lastCol = sh.getLastColumn();
    var existing = lastCol ? sh.getRange(1, 1, 1, lastCol).getValues()[0].map(String) : [];
    // tambahkan kolom yang belum ada di ujung kanan (tidak menghapus data lama)
    var missing = cols.filter(function (c) { return existing.indexOf(c) < 0; });
    if (!existing.filter(String).length) {
      sh.getRange(1, 1, 1, cols.length).setValues([cols]);
    } else if (missing.length) {
      sh.getRange(1, existing.length + 1, 1, missing.length).setValues([missing]);
    }
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, sh.getLastColumn()).setFontWeight('bold').setBackground('#E3F1ED');
    // kolom tanggal/ID disimpan sebagai teks supaya tidak bergeser zona waktu
    ['Tanggal', 'Tgl_Idul_Fitri', 'Batas_Fitrah', 'Tutup_Rekap_Mal', 'Waktu_Input', 'ID', 'ID_Keluarga', 'Diubah_Waktu'].forEach(function (c) {
      var idx = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].indexOf(c);
      if (idx >= 0) sh.getRange(2, idx + 1, sh.getMaxRows() - 1, 1).setNumberFormat('@');
    });
  });
  var def = ss.getSheetByName('Sheet1');
  if (def && def.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(def);
  isiConfigAwal_();
  SpreadsheetApp.getActive().toast('Struktur sheet siap.', 'Zakat', 5);
}

function isiConfigAwal_() {
  var t = readTable_('Config_Tahun');
  var ada = t.rows.map(function (r) { return String(r.Tahun); });
  var base = { Kg_Per_Soq: 2.7, F_Sabilillah: 40, F_Mustahiq: 45, F_AmilKlp: 11, F_AmilDesa: 3, F_AmilDaerah: 1, F_Mustahiq_Ke: 'Kelompok',
    M_Sabilillah: 40, M_Mustahiq: 45, M_AmilKlp: 8, M_AmilDesa: 4, M_AmilDaerah: 3, M_Mustahiq_Ke: 'Daerah' };
  var awal = [
    { Tahun: 2024, Hijriah: '1445 H', Tgl_Idul_Fitri: '2024-04-10', Batas_Fitrah: '2024-04-10 06:00', Tutup_Rekap_Mal: '2024-04-10', Harga_Soq: 45000, Tarif_Fidyah: 15000, Status: 'TUTUP', Jiwa_Sensus: 280, Jiwa_Mustahiq: 95, Catatan: 'Impor dari sheet lama' },
    { Tahun: 2025, Hijriah: '1446 H', Tgl_Idul_Fitri: '2025-03-31', Batas_Fitrah: '2025-03-31 06:00', Tutup_Rekap_Mal: '2025-03-31', Harga_Soq: 40000, Tarif_Fidyah: 15000, Status: 'TUTUP', Jiwa_Sensus: 269, Jiwa_Mustahiq: 100, Catatan: 'Impor dari sheet lama' },
    { Tahun: 2026, Hijriah: '1447 H', Tgl_Idul_Fitri: '2026-03-20', Batas_Fitrah: '2026-03-20 06:00', Tutup_Rekap_Mal: '2026-03-20', Harga_Soq: 40000, Tarif_Fidyah: 15000, Status: 'TUTUP', Jiwa_Sensus: 264, Jiwa_Mustahiq: 106, Catatan: 'Impor dari sheet lama' },
    { Tahun: 2027, Hijriah: '1448 H', Tgl_Idul_Fitri: '2027-03-10', Batas_Fitrah: '2027-03-10 06:00', Tutup_Rekap_Mal: '2027-03-10', Harga_Soq: 40000, Kg_Per_Soq: 2.7, Tarif_Fidyah: 15000, Status: 'BUKA', Catatan: 'Siap UAT' }
  ].filter(function (r) { return ada.indexOf(String(r.Tahun)) < 0; })
   .map(function (r) { var o = {}; Object.keys(base).forEach(function (k) { o[k] = base[k]; }); Object.keys(r).forEach(function (k) { o[k] = r[k]; }); return o; });
  appendObjects_('Config_Tahun', awal);
}

function buatAdminDialog() {
  var ui = SpreadsheetApp.getUi();
  var n = ui.prompt('Akun Admin', 'Nama admin (mis. nama Anda):', ui.ButtonSet.OK_CANCEL);
  if (n.getSelectedButton() !== ui.Button.OK || !n.getResponseText().trim()) return;
  var p = ui.prompt('PIN Admin', 'PIN 6 digit untuk ' + n.getResponseText().trim() + ':', ui.ButtonSet.OK_CANCEL);
  if (p.getSelectedButton() !== ui.Button.OK) return;
  try {
    simpanPengguna_({ user: { nama: n.getResponseText().trim(), peran: 'ADMIN', pin: p.getResponseText().trim() } }, null);
    ui.alert('Akun Admin dibuat. Akun Admin lain, Pengurus, dan PIN amil diatur dari halaman Konfigurasi di aplikasi.');
  } catch (e) { ui.alert(e.message); }
}

function cekSensus() {
  var s = readSensus_(true);
  SpreadsheetApp.getUi().alert('Sensus terbaca: ' + s.keluarga.length + ' KK, ' + s.jamaah.length + ' jiwa.');
}
