---
inclusion: fileMatch
fileMatchPattern: ["apps-script/**", "tests/**", "docs/decisions.md"]
---

# Model Data (spreadsheet ZAKAT BBK02)

Skema resmi ada di `SHEETS` di `apps-script/00_Config.gs`. Tabel di bawah menjelaskan arti tiap kolom. **Satu spreadsheet untuk semua tahun**, dibedakan dengan kolom `Tahun`.

## Config_Tahun (1 baris per tahun)
| Kolom | Arti |
|---|---|
| Tahun, Hijriah | 2027, "1448 H" |
| Tgl_Idul_Fitri | `yyyy-MM-dd`, dasar H-n |
| Batas_Fitrah | `yyyy-MM-dd HH:mm`. Setelah ini fitrah terkunci untuk amil |
| Tutup_Rekap_Mal | `yyyy-MM-dd`. Setoran mal setelahnya menjadi SUSULAN |
| Harga_Soq, Kg_Per_Soq, Tarif_Fidyah | angka per tahun |
| Status | `BUKA` / `TUTUP`. Tahun aktif = BUKA terakhir, atau tahun terbesar |
| F_Sabilillah, F_Mustahiq, F_AmilKlp, F_AmilDesa, F_AmilDaerah, F_Mustahiq_Ke | persentase fitrah (total 100) dan tujuan mustahiq |
| M_… | sama, untuk mal & tijaroh |
| Jiwa_Sensus, KK_Sensus | snapshot saat tahun ditutup (historis diisi dari sheet lama) |
| Jiwa_Mustahiq | angka manual untuk tahun tanpa daftar mustahiq (2024–2026). Tahun dengan daftar memakai jumlah dari sheet `Mustahiq` |
| Penandatangan | JSON `[{jabatan, nama}]` untuk laporan resmi (D-36). Kosong = jabatan default format 2025. Disalin saat tahun baru |

## Amil (per tahun)
`Tahun, ID_Amil, Nama, ID_Jamaah, Jabatan, Saham, Aktif, PIN_Hash`
- **ID_Amil** stabil lintas tahun. Untuk data impor: `AM-<NAMA-NORMAL>`.
- **Tahun baru** menyalin amil aktif beserta PIN_Hash.

## Pengguna (Admin & Pengurus)
`ID, Nama, Peran(ADMIN|PENGURUS), PIN_Hash, Aktif, Dibuat`

## Simpatisan (lintas tahun)
`ID_SM, Nama, JK, ID_Keluarga (kosong = berdiri sendiri), Hubungan, No_HP, Catatan, Dibuat, Dihapus` (soft delete, D-41)

## Setoran_Fitrah (1 baris per setoran)
- **Kolom:** `ID, Tahun, Tanggal, Waktu_Input, ID_Keluarga, Nama_Muzakki, ID_Amil, Nama_Amil, Jenis(BERAS|UANG|KAMPUNG), Jiwa_JM, Jiwa_SM, Jiwa_Luar, Total_Jiwa, Kg_Beras, Harga_Soq, Wajib_Rp, Diterima_Rp, Selisih_Rp, Tujuan_Lebih(UB|KEMBALI), Status_Bayar(LUNAS|KURANG), Catatan, Sumber(APP|IMPOR), Match_Status, Dihapus, Diubah_Oleh, Diubah_Waktu, Dicatat_Oleh`
- **Harga_Soq disalin** saat simpan, supaya histori tidak berubah bila harga diubah.
- **ID_Keluarga** bisa `TANPA-KK-<ID Jamaah>`, atau kosong untuk simpatisan berdiri sendiri.
- **Dicatat_Oleh** (D-24): nama yang mencatat saat setoran dibuat (bisa admin atas nama amil). Tidak berubah saat setoran diubah. Kosong untuk data impor/lama. Kolom yang sama juga ada di `Zakat_Lain`.
- **Match_Status** (impor): `COCOK | PERLU_CEK | TIDAK_ADA | MANUAL | SM`.

## Setoran_Fitrah_Jiwa (rincian per jiwa, hanya data APP)
`ID_Setoran, Tahun, Tipe(JM|SM), Ref_ID (ID Jamaah / ID_SM), Nama, Dihapus`
- **Sumber kebenaran "siapa sudah zakat"** dan cek duplikat. Data impor tidak punya rincian per jiwa.

## Zakat_Lain
`ID, Tahun, Tanggal, Waktu_Input, Jenis(MAL|TIJAROH|MAL_TIJAROH|FIDYAH), Lampiran(UTAMA|SUSULAN|''), Ref_Tipe(JM|SM|KK|LAIN), Ref_ID, Nama, ID_Keluarga, Nominal, Hari_Fidyah, Cara_Bayar, ID_Amil, Nama_Amil, Catatan, Sumber, Dihapus, Diubah_Oleh, Diubah_Waktu, Dicatat_Oleh`

## Mustahiq (per tahun, D-35)
`ID, Tahun, Tipe(JM|LUAR), Ref_ID, Nama, ID_Keluarga, Nama_KK, Jiwa, Asnaf(FAKIR|MISKIN|GHORIM|MUALAF|IBNU_SABIL|SABILILLAH), Catatan, Dihapus, Dibuat_Oleh, Dibuat_Waktu, Diubah_Oleh, Diubah_Waktu`
- **JM:** 1 baris per jiwa sensus (`Jiwa=1`), satu jamaah hanya sekali per tahun.
- **LUAR:** penerima luar sensus, `ID_Keluarga = LUAR-<ID>`, `Jiwa >= 1`.
- **Pembagian:** pos Mustahiq fitrah dibagi rata per jiwa, dibulatkan jadi soq bulat per KK (sisa terbesar). Hasilnya dihitung, tidak disimpan.

## Mustahiq_Serah (penyerahan per KK penerima)
`ID, Tahun, ID_Keluarga, Nama_KK, Soq, Kg, Tanggal, Oleh, Catatan, Dihapus`. Menyimpan soq/kg **saat diserahkan**.

## Mustahiq_Final (hasil musyawarah, D-42)
`Tahun, ID_Keluarga, Nama_KK, Soq_Final, Catatan, Diubah_Oleh, Diubah_Waktu`
- Satu baris per KK penerima yang angka finalnya diisi. Tidak ada baris = pakai angka acuan (sisa terbesar).
- Disimpan dengan cara mengganti semua baris tahun itu. Total final boleh ≠ bagian mustahiq (selisih ditampilkan).

## Tabel pendukung
- **Pembelian_Beras:** `ID, Tahun, Tanggal, Kg, Rupiah, Catatan, Oleh, Dihapus`
- **Serah_UB:** `ID, Tahun, Tanggal, ID_Amil, Nama_Amil, Nominal, Penerima, Catatan, Oleh, Dihapus`
- **Bagian_Amil** (angka final musyawarah): `Tahun, Lampiran, ID_Amil, Nama, Beras_Final_Soq, Uang_Final_Rp, Catatan, Diubah`. Disimpan dengan cara mengganti semua baris tahun+lampiran.
- **Impor_Review / Impor_Log:** hasil impor dan cek total.
- **Log:** `Waktu, Peran, Nama, Aksi, Detail`.

## Invarian (wajib dijaga dan dites)
1. Σ pembagian fitrah (soq) = soq diterima, dan Σ pembagian mal (Rp) = total mal per lampiran.
2. Satu `Ref_ID` JM/SM hanya muncul sekali per tahun di Setoran_Fitrah_Jiwa yang tidak dihapus.
3. `Total_Jiwa = Jiwa_JM + Jiwa_SM + Jiwa_Luar` (data APP).
4. UANG: `Selisih_Rp = Diterima_Rp − Wajib_Rp`, dan `Status_Bayar = KURANG` ⇔ selisih < 0.
5. Persentase F_* dan M_* masing-masing berjumlah 100.
6. Baris tidak pernah dihapus fisik dari tabel transaksi (soft delete), kecuali impor ulang baris `Sumber = IMPOR` dan hapus massal `Bagian_Amil` (isinya disimpan di Log untuk dipulihkan, D-37).
7. Σ soq mustahiq per KK = pos Mustahiq fitrah (bila tujuannya Kelompok).

## Migrasi skema
- **Kolom baru:** tambahkan di akhir array `SHEETS`, lalu jalankan `setupZakat()`. Fungsi ini aman dijalankan ulang dan hanya menambah kolom yang belum ada.
- **Perubahan lain** (rename, hapus, ubah arti, sheet domain baru) **wajib lewat konsultan**.
