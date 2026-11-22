/**
 * Data sensus SINTETIS (fiktif) untuk test. Jangan pernah memasukkan data jamaah asli ke repo.
 * Struktur kolom sama dengan tab Jamaah, Keluarga, dan Arsip_Jamaah di SENSUS BBK02.
 * Deterministik: hasilnya selalu sama di setiap run.
 */
var HEADER_JAMAAH = ['ID Jamaah', 'ID Keluarga', 'Hubungan Keluarga', 'Nama Lengkap', 'Nama Absen', 'Jenis Kelamin', 'Tahun Lahir',
  'Status Nikah', 'Status Keaktifan', 'Flag Absen', 'Status Keberadaan', 'Catatan', 'Umur', 'Perlu Dibantu'];

var KEPALA = ['Ahmad Fauzan', 'Hasan Basri', 'Yusuf Hamdani', 'Ridwan Saleh', 'Imam Prasetyo', 'Lukman Hakim', 'Arif Wibowo', 'Taufik Rahman',
  'Bambang Sutrisno', 'Dedi Kurniawan', 'Eko Saputra', 'Gunawan Hadi', 'Hendra Wijaya', 'Irfan Maulana', 'Joko Santoso', 'Lutfi Hakim',
  'H. Sutrisno Adi', 'H. Muhammad Ilham', 'Andi Firmansyah', 'Bayu Setiawan', 'Cahyo Nugroho', 'Dimas Pratama', 'Fajar Ramadhan', 'Galih Permana',
  'Hari Susanto', 'Indra Kusuma', 'Johan Saputra', 'Kurnia Adi', 'M. Rizky Akbar', 'Nanda Pratomo', 'Oki Firmanto', 'Puji Lestanto',
  'Rahmat Hidayat', 'Sigit Purnomo', 'Teguh Wiranto', 'Umar Faruq', 'Wahyu Hidayat', 'Yoga Prasetya', 'Zainal Arifin', 'Agus Salim',
  'Budi Hartono', 'Candra Wijaya', 'Darmawan Putra', 'Edi Sumarno', 'Fikri Hamdan', 'Gilang Ramadan', 'Hamid Ali', 'Iwan Setiadi',
  'Jamal Abdullah', 'Kholid Mustofa', 'Lilis Purwanti', 'Mega Sari', 'Nur Aini', 'Ratna Dewi', 'Siti Aminah', 'Tuti Handayani',
  'H. Abdul Malik', 'H. Zulkifli Hasan', 'Ibu Fatimah Zahra', 'Ibu Kartini Sari'];
var ISTRI = ['Siti Rahma', 'Nur Halimah', 'Dewi Lestari', 'Rina Marlina', 'Yuni Astuti', 'Wulan Sari', 'Ani Suryani', 'Laila Fitri', 'Maya Puspita', 'Indah Permata'];
var ANAK = ['Rafi', 'Nabila', 'Zahra', 'Fadil', 'Aisyah', 'Hafiz', 'Kayla', 'Rizki', 'Salsa', 'Daffa', 'Nayla', 'Farhan', 'Alya', 'Bima', 'Citra', 'Dafa'];
var KEBERADAAN = ['Menetap', 'Menetap', 'Menetap', 'Menetap', 'Menetap', 'Menetap', 'Mondok', 'Kerja Luar', 'Menetap', 'Kuliah di Luar'];

function rng(seed) { var s = seed; return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }

function buildSensus() {
  var r = rng(42), rows = [], kel = [], id = 1;
  KEPALA.forEach(function (kepala, i) {
    var kk = 'KK-FIX-' + (i + 1);
    var wanita = /^(Lilis|Mega|Nur Aini|Ratna|Siti Aminah|Tuti|Ibu )/.test(kepala);
    kel.push([kk, kepala, 'Alamat contoh ' + (i + 1)]);
    var umurK = 30 + Math.floor(r() * 35);
    rows.push(['JM-FIX-' + (id++), kk, 'A', kepala, kepala.replace(/^(H\. |Ibu )/, ''), wanita ? 'P' : 'L', 2026 - umurK, wanita ? 'JANDA' : 'MENIKAH', 'Y', 'Y', 'Menetap', '', umurK, i % 9 === 0 ? 'Y' : '']);
    if (!wanita) {
      var umurI = umurK - 3;
      rows.push(['JM-FIX-' + (id++), kk, 'B', ISTRI[i % ISTRI.length], ISTRI[i % ISTRI.length], 'P', 2026 - umurI, 'MENIKAH', 'Y', 'Y', 'Menetap', '', umurI, '']);
    }
    var nAnak = Math.floor(r() * 5);
    for (var a = 0; a < nAnak; a++) {
      var umurA = 1 + Math.floor(r() * 22), ket = KEBERADAAN[Math.floor(r() * KEBERADAAN.length)];
      var nama = ANAK[(i + a) % ANAK.length] + ' ' + kepala.replace(/^(H\. |Ibu )/, '').split(' ').slice(-1)[0];
      rows.push(['JM-FIX-' + (id++), kk, 'C', nama, nama, r() < 0.5 ? 'L' : 'P', 2026 - umurA, 'BELUM', ket === 'Menetap' ? 'Y' : 'N', umurA > 12 ? 'Y' : 'N', ket, '', umurA, '']);
    }
    if (i % 12 === 5) rows.push(['JM-FIX-' + (id++), kk, 'D', 'Mbah ' + kepala.split(' ')[0], 'Mbah ' + kepala.split(' ')[0], 'P', 1950, 'JANDA', 'Y', 'N', 'Menetap', '', 76, 'Y']);
  });
  // beberapa jamaah tanpa ID Keluarga (kasus nyata di sensus)
  ['Rudi Hermawan', 'Sari Wulandari', 'Tono Prakoso'].forEach(function (n) {
    rows.push(['JM-FIX-' + (id++), '', 'A', n, n, 'L', 1995, 'BELUM', 'Y', 'Y', 'Menetap', '', 31, '']);
  });
  return {
    jamaah: [HEADER_JAMAAH].concat(rows),
    keluarga: [['ID Keluarga', 'Nama KK', 'Alamat']].concat(kel),
    arsip: [['Waktu Hapus', 'Keterangan', 'ID Jamaah', 'ID Keluarga', 'Hubungan Keluarga', 'Nama Lengkap', 'Nama Absen'],
      ['2026-11-21 22:55:20', 'Pindah', 'JM-FIX-ARSIP-1', 'KK-FIX-3', 'C', 'Wawan Hamdani', 'Wawan']]
  };
}

module.exports = { buildSensus: buildSensus };
