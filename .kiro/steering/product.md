---
inclusion: always
---

# Produk: Zakat BBK02

## Apa ini
Aplikasi pencatatan dan pemantauan **zakat Idul Fitri** untuk **Kelompok Babakan Barat (BBK02), Desa Babakan, Daerah Tangerang Selatan**. Aplikasi ini menggantikan pencatatan manual di file xlsx per tahun, yang selama ini menyalin-tempel data dari sensus sehingga pekerjaannya dobel dan tidak terpusat.

Jenis zakat yang dicatat:
- **Zakat Fitrah**: beras (satuan soq/kg) atau titip uang untuk dibelikan beras.
- **Zakat Mal** dan **Zakat Tijaroh** (perdagangan), termasuk setoran campuran "Mal + Tijaroh".
- **Fidyah**: dicatat terpisah, tidak ikut pembagian.

## Pengguna
| Peran | Siapa | Akses |
|---|---|---|
| Admin | pengurus yang mengelola aplikasi (bisa lebih dari satu) | semua menu, koreksi/hapus data, konfigurasi, pengguna, PIN |
| Amil | petugas penerima zakat (±8–9 orang per tahun) | input setoran dari HP, lihat dashboard |
| Pengurus | KI/KU/pengurus kelompok | hanya lihat dashboard & tren |

Login memakai **PIN pribadi 6 digit**. Nama dan peran dikenali dari PIN, tanpa memilih nama.

## Masalah yang diselesaikan
1. **Data tunggal:** KK dan jamaah dibaca langsung dari **SENSUS BBK02**, tidak disalin.
2. **Tahu siapa yang belum zakat:** zakat dicatat per jiwa, sehingga terlihat anggota mana yang belum.
3. **Tidak ada salah hitung:** pembagian 40/45/15 dan pembulatannya dihitung otomatis, dan totalnya selalu pas.
4. **Pemantauan langsung** selama Ramadhan: progres, per amil, beras vs uang, uang lebih bayar untuk Usaha Bersama.
5. **Tren tahun ke tahun (YoY):** data mulai 2024 (diimpor dari xlsx lama).

## Prinsip produk
- **Mobile-first untuk amil:** input di HP dalam kurang dari 30 detik per KK.
- **Syariat dulu:** zakat fitrah tidak boleh diterima setelah batas (sebelum shalat Ied).
- **Bahasa Indonesia sederhana** dengan istilah yang biasa dipakai di kelompok.
- **Gratis:** Google Sheets + Apps Script + GitHub Pages, tanpa server berbayar.
- **Privasi:** pengurus tidak melihat alamat atau no HP. Data jamaah asli tidak pernah masuk ke repo.

## Status saat ini
- **MVP selesai dikodekan dan teruji dengan simulasi.** Isinya: login PIN, input fitrah/mal/fidyah, dashboard pemantauan, tren, konfigurasi, dan impor 2024–2026.
- **Belum go-live.** Lihat `.kiro/specs/zakat-mvp/tasks.md` bagian Go-live.
- **Backlog yang perlu desain dengan konsultan:** lihat `docs/backlog.md`.

## Referensi
- **Mockup** yang sudah disetujui: lihat `docs/mockup.md`.
- **Keputusan yang sudah diambil:** `docs/decisions.md`. Keputusan ini mengikat dan tidak boleh diubah tanpa konsultan.
- **Aturan domain zakat:** `.kiro/steering/domain-zakat.md`.
