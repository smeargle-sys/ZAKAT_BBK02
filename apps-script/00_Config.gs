/**
 * ZAKAT BBK02 — konfigurasi tetap aplikasi.
 * Pengaturan per tahun (harga, persentase, batas waktu) TIDAK di sini,
 * tapi di sheet Config_Tahun dan diubah lewat menu Konfigurasi.
 */
var APP = {
  NAMA: 'Zakat BBK02',
  KELOMPOK: 'Kelompok Babakan Barat',
  // Kepala laporan resmi (D-36)
  KELOMPOK_NO: '2',
  DESA: 'Babakan',
  DAERAH: 'Tangerang Selatan',

  // Spreadsheet SENSUS BBK02 Dashboard (sumber tunggal data KK & jamaah, hanya dibaca)
  SENSUS_ID: '1jgTL5COMzaDnvnnOTL_0DhQOlycHFaSS7HavLhR7IW0',
  SENSUS_SHEET_JAMAAH: 'Jamaah',
  SENSUS_SHEET_KELUARGA: 'Keluarga',
  SENSUS_SHEET_ARSIP: 'Arsip_Jamaah',

  // File pendataan lama (xlsx) untuk impor historis
  IMPORT_FILES: {
    2024: '1maugY7Fr5TKN14ez3U-4Y00EZaLFfSSa',
    2025: '1sCCuMlCBIVHoh7gjzV-iS8qbWHMF6CgH',
    2026: '14aGf2DdhV0cpO2A7vuB3ySgsnug6tXNO'
  },

  SESSION_HOURS: 6,
  MAX_PIN_SALAH: 5,
  LOCK_MENIT: 15
};

// Nama sheet & kolom (urutan kolom = urutan header saat setup)
var SHEETS = {
  Config_Tahun: ['Tahun', 'Hijriah', 'Tgl_Idul_Fitri', 'Batas_Fitrah', 'Tutup_Rekap_Mal', 'Harga_Soq', 'Kg_Per_Soq', 'Tarif_Fidyah', 'Status',
    'F_Sabilillah', 'F_Mustahiq', 'F_AmilKlp', 'F_AmilDesa', 'F_AmilDaerah', 'F_Mustahiq_Ke',
    'M_Sabilillah', 'M_Mustahiq', 'M_AmilKlp', 'M_AmilDesa', 'M_AmilDaerah', 'M_Mustahiq_Ke',
    'Jiwa_Sensus', 'KK_Sensus', 'Jiwa_Mustahiq', 'Catatan', 'Penandatangan'],
  Amil: ['Tahun', 'ID_Amil', 'Nama', 'ID_Jamaah', 'Jabatan', 'Saham', 'Aktif', 'PIN_Hash'],
  Pengguna: ['ID', 'Nama', 'Peran', 'PIN_Hash', 'Aktif', 'Dibuat'],
  Simpatisan: ['ID_SM', 'Nama', 'JK', 'ID_Keluarga', 'Hubungan', 'No_HP', 'Catatan', 'Dibuat', 'Dihapus'],
  Setoran_Fitrah: ['ID', 'Tahun', 'Tanggal', 'Waktu_Input', 'ID_Keluarga', 'Nama_Muzakki', 'ID_Amil', 'Nama_Amil', 'Jenis',
    'Jiwa_JM', 'Jiwa_SM', 'Jiwa_Luar', 'Total_Jiwa', 'Kg_Beras', 'Harga_Soq', 'Wajib_Rp', 'Diterima_Rp', 'Selisih_Rp',
    'Tujuan_Lebih', 'Status_Bayar', 'Catatan', 'Sumber', 'Match_Status', 'Dihapus', 'Diubah_Oleh', 'Diubah_Waktu', 'Dicatat_Oleh'],
  Setoran_Fitrah_Jiwa: ['ID_Setoran', 'Tahun', 'Tipe', 'Ref_ID', 'Nama', 'Dihapus'],
  Zakat_Lain: ['ID', 'Tahun', 'Tanggal', 'Waktu_Input', 'Jenis', 'Lampiran', 'Ref_Tipe', 'Ref_ID', 'Nama', 'ID_Keluarga',
    'Nominal', 'Hari_Fidyah', 'Cara_Bayar', 'ID_Amil', 'Nama_Amil', 'Catatan', 'Sumber', 'Dihapus', 'Diubah_Oleh', 'Diubah_Waktu', 'Dicatat_Oleh'],
  Pembelian_Beras: ['ID', 'Tahun', 'Tanggal', 'Kg', 'Rupiah', 'Catatan', 'Oleh', 'Dihapus'],
  // Mustahiq zakat fitrah (D-35): 1 baris per jiwa sensus / per penerima luar sensus (Jiwa >= 1)
  Mustahiq: ['ID', 'Tahun', 'Tipe', 'Ref_ID', 'Nama', 'ID_Keluarga', 'Nama_KK', 'Jiwa', 'Asnaf', 'Catatan', 'Dihapus', 'Dibuat_Oleh', 'Dibuat_Waktu', 'Diubah_Oleh', 'Diubah_Waktu'],
  Mustahiq_Serah: ['ID', 'Tahun', 'ID_Keluarga', 'Nama_KK', 'Soq', 'Kg', 'Tanggal', 'Oleh', 'Catatan', 'Dihapus'],
  // Angka final hasil musyawarah per KK penerima (D-42). Tidak ada baris = pakai angka acuan.
  Mustahiq_Final: ['Tahun', 'ID_Keluarga', 'Nama_KK', 'Soq_Final', 'Catatan', 'Diubah_Oleh', 'Diubah_Waktu'],
  Serah_UB: ['ID', 'Tahun', 'Tanggal', 'ID_Amil', 'Nama_Amil', 'Nominal', 'Penerima', 'Catatan', 'Oleh', 'Dihapus'],
  Bagian_Amil: ['Tahun', 'Lampiran', 'ID_Amil', 'Nama', 'Beras_Final_Soq', 'Uang_Final_Rp', 'Catatan', 'Diubah'],
  Impor_Review: ['Tahun', 'Sumber_Sheet', 'Baris', 'Nama_Asli', 'Jiwa_JM', 'Jiwa_SM', 'Status', 'Skor', 'Saran_ID_Keluarga', 'Saran_Nama',
    'Pilih_ID_Keluarga', 'Jadikan_SM', 'ID_Setoran', 'Catatan'],
  Impor_Log: ['Waktu', 'Tahun', 'Cek', 'Hasil_Impor', 'Rekap_Sheet_Lama', 'Status'],
  Log: ['Waktu', 'Peran', 'Nama', 'Aksi', 'Detail']
};

var JENIS_FITRAH = { BERAS: 'BERAS', UANG: 'UANG', KAMPUNG: 'KAMPUNG' };
var JENIS_LAIN = ['MAL', 'TIJAROH', 'MAL_TIJAROH', 'FIDYAH'];

// Golongan penerima zakat (asnaf) untuk daftar mustahiq
var ASNAF = ['FAKIR', 'MISKIN', 'GHORIM', 'MUALAF', 'IBNU_SABIL', 'SABILILLAH'];
