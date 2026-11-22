# Desain Konsultan: Mustahiq & Pembagian 45% Zakat Fitrah (B-01 + B-02)

- **Tanggal:** 2026-11-22
- **Dari:** Konsultan (Claude), berdasarkan keputusan pemilik di sesi ini
- **Untuk:** pemilik produk dan implementer
- **Keputusan:** D-35 di `docs/decisions.md`
- **Spec:** `.kiro/specs/mustahiq/`
- **Target:** siap dan ikut UAT sebelum Ramadhan 1448 H (±8 Februari 2027)

## Keputusan pemilik
| Hal | Keputusan |
|---|---|
| Prioritas | Mustahiq dikerjakan lebih dulu dari backlog lain |
| Penetapan | **Admin** memilih dari kandidat sensus (kolom *Perlu Dibantu*) sesuai hasil musyawarah, dan boleh menambah jamaah lain lewat cari nama |
| Unit & cara bagi | **Per jiwa, rata** |
| Pembulatan | **Soq bulat per KK**, metode sisa terbesar. Total = bagian mustahiq persis |
| Asnaf | **Per jiwa** (default Miskin), bisa diubah admin |
| Luar sensus | **Boleh**: nama + jumlah jiwa + asnaf |
| Penyerahan | **Cetak daftar penerimaan + tandai "sudah diserahkan"** per KK beserta tanggal |
| Akses | **Admin + Pengurus** melihat. Hanya Admin yang mengubah. **Amil tidak** menerima data ini sama sekali |

## Aturan hitung
1. **Pool mustahiq** = pos *Mustahiq* pembagian zakat fitrah tahun itu (soq), dari pembagian 40/45/15 yang sudah ada.
   - Hanya berlaku bila tujuan Mustahiq fitrah = **Kelompok** (`F_Mustahiq_Ke`). Bila diubah ke Desa/Daerah, halaman menampilkan catatan dan tidak membagi.
2. **Jiwa mustahiq** = Σ jiwa di daftar tahun itu (jamaah sensus dihitung 1 per baris, penerima luar sensus sesuai jumlah jiwanya).
3. **Satu penerima = satu KK:**
   - jamaah sensus dikelompokkan per `ID_Keluarga` (termasuk `TANPA-KK-…`);
   - penerima luar sensus berdiri sendiri.
4. **Soq per KK** = `splitLargestRemainder_(pool, [jiwa tiap KK])`. Hasilnya bulat dan Σ = pool persis. Kg = soq × kg/soq.
   - *Contoh 2026:* pool 146 soq, 106 jiwa. KK 4 jiwa → acuan 5,51, sehingga 5 atau 6 soq tergantung sisa terbesar. Total 146.
5. **Satu jamaah sensus hanya sekali** per tahun di daftar.
6. **Angka berubah selama penerimaan masih berjalan.** Halaman menampilkan catatan "angka sementara sampai batas zakat fitrah". Penyerahan sebaiknya setelah batas.
7. **Penyerahan** mencatat soq & kg **saat itu**. Bila hitungan berubah sesudahnya, baris diberi tanda *"berubah sejak diserahkan: diserahkan 5, hitungan sekarang 6"*. Admin dapat menandai ulang.
8. **Jiwa_Mustahiq** di tren:
   - tahun yang punya daftar memakai jumlah dari daftar;
   - tahun lama (2024–2026) tetap memakai angka manual di Config_Tahun.
9. **Mustahiq boleh juga muzakki.** Tidak ada larangan (wajar: membayar zakat fitrah sekaligus menerima).

## Model data (sheet baru, D-35)
**`Mustahiq`** (1 baris per penerima jiwa / penerima luar):
`ID, Tahun, Tipe(JM|LUAR), Ref_ID, Nama, ID_Keluarga, Nama_KK, Jiwa, Asnaf(FAKIR|MISKIN|GHORIM|MUALAF|IBNU_SABIL|SABILILLAH), Catatan, Dihapus, Dibuat_Oleh, Dibuat_Waktu, Diubah_Oleh, Diubah_Waktu`
- **JM:** `Ref_ID` = ID Jamaah, `Jiwa` = 1, `ID_Keluarga` dari sensus.
- **LUAR:** `Ref_ID` kosong, `ID_Keluarga` = `LUAR-<ID>`, `Jiwa` ≥ 1.

**`Mustahiq_Serah`** (penyerahan per KK penerima):
`ID, Tahun, ID_Keluarga, Nama_KK, Soq, Kg, Tanggal, Oleh, Catatan, Dihapus`
- KK yang punya baris aktif = sudah diserahkan. Batal = soft delete.

ID baru: `MS-` (mustahiq), `MSR-` (serah).

## Layar
### Menu baru "Mustahiq" (`#/mustahiq?tahun=`): Admin & Pengurus
```
┌ Mustahiq 1448 H / 2027                          [Tahun ▾] [Cetak daftar penerimaan] ┐
│ ⚠ Angka sementara sampai batas zakat fitrah (10 Mar 06:00).                           │
│ [106 jiwa mustahiq] [41 KK penerima] [146 soq · 394,2 kg] [1,38 soq/jiwa] [12/41 diserahkan] │
├ Kandidat dari sensus (admin) ─────────────────────────────────────────────────────────┤
│ 18 jamaah bertanda "Perlu Dibantu" belum masuk daftar                                  │
│ ☐ Siti Aminah     KK Ahmad Fauzi   [Miskin ▾]                                         │
│ ☐ Budi Santoso    KK Budi Santoso  [Miskin ▾]       ...      [Tambahkan yang dicentang] │
├ Daftar mustahiq 1448 H ──────────── [+ Cari jamaah] [+ Penerima luar sensus] ─────────┤
│ KK              Penerima (asnaf)                 Jiwa  Soq   Kg    Penyerahan          │
│ Ahmad Fauzi     Siti Aminah (Miskin), Rina (Fakir) 2    3    8,1   [Tandai diserahkan] │
│ Budi Santoso    Budi (Ghorim)                     1    1    2,7   ✓ 8 Mar · 1 soq       │
│ Pak Tamu (luar) 3 jiwa (Ibnu Sabil)                3    4   10,8   ⚠ berubah: 3 → 4    │
│ Total                                            106  146  394,2                       │
└───────────────────────────────────────────────────────────────────────────────────────┘
```
- **Pengurus:** semua tampil **tanpa** kartu kandidat dan tanpa tombol ubah/tandai.
- **Ubah per penerima (admin):** klik nama → modal (asnaf, catatan, jumlah jiwa untuk luar sensus, hapus dari daftar).
- **Cetak daftar penerimaan** (A4, cetak browser):
  - judul "Daftar Penerimaan Zakat Fitrah 1448 H — Kelompok Babakan Barat";
  - kolom No, Nama KK/penerima, Jiwa, Asnaf, Soq, Kg, Tanda tangan;
  - baris total;
  - blok tanda tangan: Ketua Kelompok, Amil.

### Pemantauan
- **Kartu kecil "Penyaluran mustahiq"** (admin & pengurus): *12 dari 41 KK sudah diserahkan · 18 dari 146 soq*, dengan tautan ke menu Mustahiq. Amil tidak melihat kartu ini.
- **Tabel pembagian fitrah:** baris Mustahiq diberi keterangan "106 jiwa · 1,38 soq/jiwa".

## Privasi
- **Status "Perlu Dibantu" (kandidat):** hanya dikirim ke **admin**.
- **Daftar mustahiq:** dikirim ke admin & pengurus. Amil tidak menerima apa pun (route ditolak).
- **Data yang dikirim:** tidak mengirim alamat/no HP.
- **Cache server:** dashboard sudah dipisah admin vs lainnya (D-34). Kartu penyaluran untuk pengurus diberikan lewat route mustahiq, bukan lewat dashboard amil.

## Di luar lingkup (tetap backlog)
- **Cara pembagian per saham kebutuhan** (6 faktor): tidak dipilih pemilik. Bisa ditambahkan nanti sebagai opsi.
- **Mustahiq zakat mal:** 45% disetor ke Daerah (D-10), tidak dibagi di kelompok.
- **B-03 Sabilillah / bantuan kelompok.**
- **Salin daftar dari tahun lalu:** kandidat sensus + cari nama dianggap cukup. Bisa ditambah bila diperlukan.
