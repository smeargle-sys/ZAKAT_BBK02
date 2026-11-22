---
inclusion: always
---

# Pengetahuan Domain: Zakat Idul Fitri di BBK02

Dokumen ini adalah **sumber kebenaran aturan bisnis**. Jika kode bertentangan dengan dokumen ini, kodenya yang salah. Jika butuh aturan baru atau ingin mengubah aturan di sini, **berhenti dan ajukan ke konsultan** (lihat `roles-and-governance.md`).

## Glosarium
| Istilah | Arti |
|---|---|
| **KK** | Kepala Keluarga / satu keluarga di sensus (ID `KK-…` di tab Keluarga) |
| **JM / JM BBK** | Jamaah sensus Babakan Barat (ID `JM-…` di tab Jamaah) |
| **JM luar** | Jamaah dari kelompok lain yang ikut titip zakat. Hanya dicatat jumlah jiwanya (dan nama opsional) |
| **SM / Simpatisan** | Orang di luar sensus yang ikut titip zakat. Bisa **terkait ke satu KK sensus** (mis. saudara jauh) atau **berdiri sendiri**. Disimpan di master Simpatisan lintas tahun |
| **Soq / sok** | Satuan zakat fitrah: 1 jiwa = 1 soq. **1 soq = 2,7 kg** beras (bisa diubah per tahun) |
| **Titip uang** | Muzakki membayar uang seharga 1 soq per jiwa (**harga per soq ditetapkan per tahun**), lalu kelompok membelikan beras |
| **Zakat di kampung** | Jiwa yang berzakat di kampung halaman: dicatat **sudah zakat**, tanpa penerimaan |
| **Muzakki** | Pembayar zakat |
| **Mustahiq** | Penerima zakat. Asnaf: Fakir, Miskin, Ghorim, Mualaf, Ibnu Sabil, Sabilillah |
| **Amil** | Petugas penerima zakat. Juga **mustahiq amil**: menerima bagian amil kelompok, dibagi **per saham** |
| **UB / Usaha Bersama** | Tujuan **lebih bayar** titip uang (default). Uang dipegang amil sampai dicatat diserahkan ke UB |
| **Tijaroh** | Zakat perdagangan, diperlakukan sama dengan zakat mal untuk pembagian |
| **Susulan** | Setoran zakat mal/tijaroh **setelah rekap ditutup**, dibagi di lampiran tersendiri |
| **Fidyah** | Tebusan puasa: hari × tarif per hari (tarif per tahun). **Tidak ikut pembagian** |
| **Sabilillah Daerah** | Pos 40% yang disetor ke Daerah |
| **H-n** | Jumlah hari menuju Idul Fitri |

## Aturan Zakat Fitrah
1. **Satuan per jiwa:** setiap jiwa yang dizakati dihitung 1 soq, apa pun jenisnya.
2. **Siapa yang dihitung:** semua anggota KK di sensus, termasuk yang Mondok, Kerja Luar, Kuliah di Luar, dan lain-lain. Default-nya semua tercentang.
3. **Tidak dobel:** satu jiwa (JM atau SM) hanya boleh dizakati **satu kali per tahun**. Sistem harus menolak duplikat.
4. **Jenis per setoran:** `BERAS` | `UANG` (titip uang) | `KAMPUNG`.
   - **BERAS:** kg = jiwa × kg/soq (boleh dikoreksi). Uang tambahan opsional langsung menjadi lebih bayar ke UB.
   - **UANG:** `wajib = jiwa × harga_soq`, `selisih = diterima − wajib`.
     - `selisih > 0` → **lebih bayar**, tujuan default **UB**, opsi **dikembalikan**.
     - `selisih < 0` → **KURANG** (belum lunas), tampil di dashboard sampai dikoreksi.
   - **KAMPUNG:** tidak ada uang/beras. Jiwa tetap dihitung **sudah zakat**, tetapi **tidak** masuk soq yang dibagi.
5. **Batas waktu (syariat):** zakat fitrah **tidak boleh diterima setelah `Batas_Fitrah`** (default hari Idul Fitri pukul 06:00, sebelum shalat Ied).
   - **Amil:** form terkunci setelah batas.
   - **Admin:** boleh mencatat **susulan administrasi** setelah batas, hanya jika `tanggal setor ≤ tanggal batas` (uang/beras sudah diterima sebelum batas, hanya terlambat dicatat).
6. **Soq yang dibagi** = jiwa BERAS + jiwa UANG (tanpa KAMPUNG).

## Pembagian Zakat Fitrah (dalam soq)
| Pos | % default | Ke |
|---|---|---|
| Sabilillah Daerah | 40 | Daerah |
| Mustahiq | 45 | **Kelompok** (dibagikan di kelompok, tujuan bisa diubah) |
| Amil Kelompok | 11 | Kelompok |
| Amil Desa | 3 | Desa |
| Amil Daerah | 1 | Daerah |

- **Persentase bisa diubah per tahun**, dan totalnya wajib 100%.
- **Pembulatan memakai metode sisa terbesar (largest remainder)** sehingga **jumlah pos = soq diterima persis**.
  - Contoh 2026: 324 soq dibagi 129 / 146 / 36 / 10 / 3, total 324.
  - Sheet lama menghasilkan 130 / 146 / 36 / 10 / 3 = 325. Ini salah dan tidak boleh terulang.
- **kg** per pos = soq × kg/soq.

## Pembagian Zakat Mal & Tijaroh (dalam rupiah)
| Pos | % default | Ke |
|---|---|---|
| Sabilillah Daerah | 40 | Daerah |
| Mustahiq Daerah | 45 | **Daerah** (disetor semua ke daerah, tidak dibagi di kelompok) |
| Amil Kelompok | 8 | Kelompok |
| Amil Desa | 4 | Desa |
| Amil Daerah | 3 | Daerah |

- **Persentase** bisa diubah per tahun, dan tujuan Mustahiq bisa diubah.
- **Pembulatan** memakai sisa terbesar ke rupiah.
- **Dihitung terpisah untuk lampiran UTAMA dan SUSULAN.** Setoran dengan `tanggal > Tutup_Rekap_Mal`, atau saat status tahun TUTUP, otomatis SUSULAN. Admin boleh memaksa ke UTAMA.
- **Jenis MAL_TIJAROH (campuran)** sah dipakai jika muzakki tidak merinci. Pembagiannya sama.
- **Contoh 2026:** Rp 266.620.000 dibagi 106.648.000 / 119.979.000 / 21.329.600 / 10.664.800 / 7.998.600.
  - Disetor ke Desa: Rp 10.664.800.
  - Disetor ke Daerah: Rp 234.625.600.

## Bagian Amil (mustahiq amil)
- **Pool:** pool beras = pos Amil Kelompok fitrah (soq), pool uang = pos Amil Kelompok mal (Rp). Pool uang dihitung terpisah untuk UTAMA dan SUSULAN.
- **Hitungan acuan:** pool × saham_amil / total saham amil aktif. Default saham = 1, bisa diubah.
- **Angka final:** **hasil musyawarah**, diisi manual oleh admin. Tidak ada aturan pembulatan tetap. Sistem menampilkan **sisa lebih amil** = pool − Σ final, dengan catatan musyawarah.

## Usaha Bersama (UB)
- **Terkumpul:** Σ selisih positif yang tujuannya UB.
- **Serah terima:** dicatat terpisah (tanggal, amil, nominal, penerima).
- **Pantauan per amil:** terkumpul − diserahkan = **masih dipegang amil**.

## Beras dari titip uang
- **Kebutuhan:** kebutuhan kg = jiwa UANG × kg/soq, dan dana = Σ wajib titip uang.
- **Pembelian:** dicatat (kg, rupiah). Dashboard menampilkan kekurangan kg dan sisa dana.

## Fidyah
- **Nominal:** hari × tarif per hari tahun itu, boleh diisi bebas. Bisa dicatat sendiri atau "sekalian" dengan setoran fitrah.
- **Pembagian:** tidak ikut pembagian 40/45/15.

## Data historis (impor)
- **Sumber:** file xlsx 2024, 2025, 2026 (ID di `00_Config.gs`).
  - **Format A (2024):** ada kolom "Jenis Zakat" di depan, kolom Amil setelah Jenis Titipan, dan kolom "Keterangan Bayar".
  - **Format B (2025/2026):** kolom Amil di urutan ke-3.
- **Kolom "Kembalian":** di sheet lama berarti **selisih bayar**. Positif = lebih bayar (ke UB), negatif = kurang bayar. Kolom "Byr ke UB" selalu kosong.
- **Catatan di kolom nama:** "(SM Pak X)" di nama berarti simpatisan yang terkait KK.
- **Fakta 2024–2026:** JM yang zakat > 100% jiwa sensus (105%, 112,6%, 117,4%), karena jiwa di luar sensus tercatat sebagai JM. Di aplikasi, JM selalu dicocokkan ke ID sensus.

| Tahun | Hijriah | Harga/soq | Jiwa sensus | Muzakki (JM+SM) | Beras soq / kg | Titip uang | Mal+Tijaroh | Mustahiq | Amil |
|---|---|---|---|---|---|---|---|---|---|
| 2024 | 1445 H | 45.000 | 280 | 294+36=330 | 108 / 291,6 | 222 jiwa · Rp 9.990.000 | Rp 405.867.500 (termasuk susulan 16.250.000) | 95 | 8 |
| 2025 | 1446 H | 40.000 | 269 | 303+37=340 | 171 / 461,7 | 169 jiwa · Rp 6.760.000 | Rp 241.500.000 | 100 | 8 |
| 2026 | 1447 H | 40.000 | 264 | 310+14=324 | 134 / 361,8 | 190 jiwa · Rp 7.600.000 | Rp 266.620.000 | 106 | 9 |

## Sensus (sumber data, hanya dibaca)
- **Spreadsheet:** `SENSUS BBK02 Dashboard`, dengan tab `Keluarga`, `Jamaah`, dan `Arsip_Jamaah`.
- **Kolom Jamaah yang dipakai:** ID Jamaah, ID Keluarga, Hubungan Keluarga (A = kepala, B = istri/suami, C = anak, D = lainnya), Nama Lengkap, Nama Absen, Jenis Kelamin, Umur, Status Keberadaan, Perlu Dibantu.
- **Jamaah tanpa ID Keluarga** (ada ±22 di data asli) diperlakukan sebagai "keluarga" sendiri dengan ID `TANPA-KK-<ID Jamaah>`.
- **Jiwa sensus** = semua baris Jamaah. Angkanya di-snapshot ke `Config_Tahun.Jiwa_Sensus` saat tahun ditutup.
- Aplikasi zakat **tidak pernah menulis** ke sensus.
