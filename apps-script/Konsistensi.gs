/**
 * Cek konsistensi data terhadap sensus (D-46, usulan B). Hanya membaca, tidak mengubah apa pun.
 * Menemukan data yang menyimpan ID Keluarga / ID Jamaah yang tidak lagi cocok dengan sensus terbaru,
 * beserta saran tindakan. Dijalankan admin setiap kali sensus diperbarui.
 */
function cekKonsistensi_(p, s) {
  var tahun = Number(p.tahun || tahunAktif_().Tahun), c = cfg_(tahun);
  var sen = readSensus_(true); // selalu baca sensus terbaru
  var kel = keluargaMap_(sen), info = {};
  sen.jamaah.forEach(function (j) { info[j.id] = j; });
  var kkSekarang = function (j) { return j.kk || ('TANPA-KK-' + j.id); };
  var namaKK = function (key) { return kel[key] ? kel[key].nama : ''; };
  var temuan = [];
  var tambah = function (kategori, tingkat, judul, detail, saran, link) {
    temuan.push({ kategori: kategori, tingkat: tingkat, judul: judul, detail: detail, saran: saran, link: link || '' });
  };

  // 1. Setoran zakat fitrah (data aplikasi): jiwa pindah KK / hilang, KK hilang
  var setoran = {}; setoranFitrah_(tahun).forEach(function (r) { if (r.Sumber === 'APP') setoran[String(r.ID)] = r; });
  var perSetoran = {};
  jiwaFitrah_(tahun).forEach(function (j) { if (setoran[String(j.ID_Setoran)] && j.Tipe === 'JM') (perSetoran[j.ID_Setoran] = perSetoran[j.ID_Setoran] || []).push(j); });
  Object.keys(setoran).forEach(function (id) {
    var r = setoran[id], kk = String(r.ID_Keluarga || ''), label = String(r.Nama_Muzakki) + ' · ' + toDateStr_(r.Tanggal);
    var link = '#/fitrah/' + encodeURIComponent(kk || '_sm') + '?edit=' + encodeURIComponent(id);
    if (kk && !kel[kk]) tambah('setoran', 'perlu', 'KK setoran sudah tidak ada di sensus', label, 'Setoran tetap tercatat. Buka Ubah untuk memeriksa jiwanya; bila perlu hapus lalu catat ulang di KK yang benar.', link);
    (perSetoran[id] || []).forEach(function (j) {
      var x = info[String(j.Ref_ID)];
      if (!x) tambah('setoran', 'perlu', 'Jiwa tidak ada lagi di sensus', String(j.Nama) + ' · setoran ' + label, 'Jiwa tetap terhitung sudah zakat. Biarkan bila benar menyetor; keluarkan dari setoran hanya bila salah catat.', link);
      else if (kk && kkSekarang(x) !== kk) tambah('setoran', 'info', 'Jiwa sudah pindah KK', x.nama + ' · setoran ' + label + ' → sekarang ' + (x.kk ? 'KK ' + namaKK(x.kk) : 'tanpa KK'),
        'Status sudah zakat tetap benar (dicatat per jiwa). Tidak perlu tindakan; saat Ubah, jangan hapus centangnya.', link);
    });
  });

  // 2. Simpatisan yang terkait ke KK yang sudah tidak ada
  daftarSimpatisanMentah_().forEach(function (m) {
    var kk = String(m.ID_Keluarga || '');
    if (!kk || kel[kk]) return;
    var saran = 'Buka Konfigurasi › Master simpatisan › Ubah, lalu pilih KK yang benar (atau Berdiri sendiri).';
    var jid = kk.indexOf('TANPA-KK-') === 0 ? kk.slice(9) : '';
    if (jid && info[jid] && info[jid].kk) saran = 'Jamaah ' + info[jid].nama + ' kini punya KK ' + namaKK(info[jid].kk) + '. ' + saran;
    tambah('simpatisan', 'perlu', 'Simpatisan terlepas dari KK', String(m.Nama), saran, '#/config');
  });

  // 3. Mustahiq: penerima tidak ada / pindah KK, angka final & penyerahan untuk KK yang tidak lagi cocok
  var d = daftarMustahiq_({ tahun: tahun }, s), grupAda = {};
  d.grup.forEach(function (g) {
    grupAda[g.id] = g;
    g.anggota.forEach(function (a) {
      if (a.tidakDiSensus) tambah('mustahiq', 'perlu', 'Penerima tidak ada lagi di sensus', a.nama + ' · KK ' + g.nama, 'Keluarkan dari daftar bila memang tidak lagi menerima.', '#/mustahiq?tahun=' + tahun);
    });
    if (g.berubah) tambah('mustahiq', 'perlu', 'Penyerahan berbeda dengan angka sekarang', 'KK ' + g.nama + ' · diserahkan ' + g.serah.soq + ' soq, sekarang ' + g.soq + ' soq', 'Periksa lalu Tandai ulang di halaman Mustahiq.', '#/mustahiq?tahun=' + tahun);
  });
  var fin = finalMustahiq_(tahun), finDitinjau = {};
  mustahiqTahun_(tahun).forEach(function (r) {
    var j = r.Tipe === 'JM' ? info[String(r.Ref_ID)] : null;
    if (!j || String(r.ID_Keluarga) === kkSekarang(j)) return;
    tambah('mustahiq', 'info', 'Penerima pindah KK', j.nama + ' → kini di ' + (j.kk ? 'KK ' + namaKK(j.kk) : 'tanpa KK'),
      'Sudah otomatis dikelompokkan ke KK barunya. Periksa angka final & penyerahan KK lama dan baru.', '#/mustahiq?tahun=' + tahun);
    // angka final tidak ikut menyesuaikan saat isi KK berubah: minta ditinjau untuk KK lama & KK baru
    [String(r.ID_Keluarga), kkSekarang(j)].forEach(function (k) {
      if (!fin[k] || finDitinjau[k]) return;
      finDitinjau[k] = 1;
      tambah('mustahiq', 'perlu', 'Angka final perlu ditinjau (isi KK berubah)', 'KK ' + (namaKK(k) || String(r.Nama_KK)) + ' · final ' + fin[k].soq + ' soq · ' + j.nama + ' pindah KK',
        'Buka Atur hasil musyawarah, sesuaikan angka KK ini, lalu Simpan.', '#/mustahiq?tahun=' + tahun);
    });
  });
  Object.keys(fin).forEach(function (k) {
    if (!grupAda[k]) tambah('mustahiq', 'perlu', 'Angka final untuk KK yang tidak lagi ada di daftar', 'KK ' + (namaKK(k) || k) + ' · final ' + fin[k].soq + ' soq', 'Buka Atur hasil musyawarah lalu Simpan ulang.', '#/mustahiq?tahun=' + tahun);
  });
  if (ss_().getSheetByName('Mustahiq_Serah')) {
    rowsOf_('Mustahiq_Serah', function (r) { return String(r.Tahun) === String(tahun) && r.Dihapus !== 'Y'; }).forEach(function (r) {
      if (!grupAda[String(r.ID_Keluarga)]) tambah('mustahiq', 'perlu', 'Penyerahan tercatat untuk KK yang tidak lagi ada di daftar', 'KK ' + String(r.Nama_KK) + ' · ' + num_(r.Soq) + ' soq · ' + toDateStr_(r.Tanggal),
        'Periksa apakah penerimanya pindah KK; tandai ulang penyerahan di KK yang benar.', '#/mustahiq?tahun=' + tahun);
    });
  }

  // 4. Amil yang terhubung ke jamaah yang sudah tidak ada di sensus
  daftarAmil_(tahun).forEach(function (a) {
    if (a.idJamaah && !info[a.idJamaah]) tambah('amil', 'info', 'Amil terhubung ke jamaah yang tidak ada di sensus', a.nama, 'Konfigurasi › Amil › Ubah, lalu cari ulang namanya di sensus.', '#/config?tahun=' + tahun);
  });

  var ringkas = {};
  temuan.forEach(function (t) { ringkas[t.kategori] = (ringkas[t.kategori] || 0) + 1; });
  return { tahun: tahun, hijriah: c.Hijriah, waktuSensus: sen.waktu, jumlah: temuan.length, perlu: temuan.filter(function (t) { return t.tingkat === 'perlu'; }).length, ringkas: ringkas, temuan: temuan };
}

/** Simpatisan aktif apa adanya (ID_Keluarga mentah, tanpa resolusi nama KK). */
function daftarSimpatisanMentah_() {
  return rowsOf_('Simpatisan', function (r) { return r.ID_SM && r.Dihapus !== 'Y'; });
}
