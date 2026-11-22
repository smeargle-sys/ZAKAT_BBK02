---
paths:
  - "web/**"
  - "docs/mockup.md"
---
<!-- DIBUAT OTOMATIS dari .kiro/steering/ui-design-system.md — jangan diedit di sini -->

# Design System Zakat BBK02 (selaras dengan aplikasi Sensus & Absensi BBK02)

Sumber visual: mockup yang sudah disetujui (`docs/mockup.md`). **Layar baru harus didesain dulu oleh konsultan.** Kiro hanya menerapkan desain tersebut.

## Token warna (CSS custom properties di `web/style.css`)
| Token | Nilai | Pakai untuk |
|---|---|---|
| `--ink` | #13211D | teks utama |
| `--ink2` | #3B4A45 | teks sekunder kuat |
| `--muted` | #5B6B66 | keterangan, label tabel |
| `--line` / `--line2` | #E3E8E6 / #EEF2F0 | garis kartu / garis tabel |
| `--bg` | #F4F6F5 | latar halaman |
| `--dark` | #0D2B24 | header HP, KPI utama, logo |
| `--brand` | #0B6E5B | tombol utama, aksen hijau, beras |
| `--brand2` | #12A383 | bar progres |
| `--mint` / `--mintfg` | #E3F1ED / #0B5446 | chip status netral-positif |
| `--ok` | #D5F0E6 | chip "Sudah / Lunas" |
| `--blue` / `--bluebg` / `--bluefg` | #1D4ED8 / #E6EEFE / #1E40AF | zakat mal/tijaroh, UB, simpatisan |
| `--orange` | #F59E5B | titip uang |
| `--warnbg` / `--warnfg` | #FEF0DC / #8A4A12 | peringatan, susulan, sebagian |
| `--redbg` / `--redfg` / `--red` | #FDE7DC / #8A2C0D / #B42318 | belum, kurang bayar, hapus, error |
| `--purplebg` / `--purplefg` | #F1E8FD / #6B21A8 | fidyah, setor desa |
| `--grey` | #94A3A0 | zakat di kampung, JM luar |

**Makna warna konsisten:** hijau = beras/fitrah/kelompok, oranye = titip uang, biru = mal/tijaroh/UB/daerah, ungu = fidyah/desa, abu = kampung/JM luar.

## Tipografi & bentuk
- **Font:** Plus Jakarta Sans 400–800.
- **Ukuran:** judul halaman 28–32 px / 800, judul kartu 17 px / 700, isi 14–15 px, keterangan 12–13 px.
- **Radius:** kartu 18 px, tombol/input 12 px, chip 999 px, modal 22 px.
- **Bayangan:** hanya untuk kartu login dan dropdown hasil cari.
- **Dilarang:** gradien, emoji, kartu bergaris tepi kiri, ilustrasi dekoratif.

## Komponen (kelas CSS yang sudah ada, pakai ulang)
`.card` / `.card.pad` / `.ch` (header kartu), `.kpi` / `.kpi.dark`, `.btn` / `.btn.pri` / `.btn.blue` / `.btn.sm` / `.btn.danger` / `.btn.block`, `.chip` (+ `ok mint warn red blue purple`), `.note` (+ `warn ok blue red`), `.bar>i`, `.stack`, `.legend`, `.cols` (grafik kolom), `.tbl` + `table`/`th`/`td`, `tr.tot`, `.foot`, `label.f` + `.fi` / `.fi.big`, `.fgrid`, `.seg` (segmented), `.check` (baris checkbox), `.radio`, `.stepper`, `.sum` (ringkasan hitung), `.sticky` (footer simpan), `.mhead` / `.mstats` / `.actions` (beranda amil), `.filters`, `.list`, `.search`, `.results`, `.modal .box`, `.toast`.

**Komponen baru** hanya boleh dibuat bila desain konsultan memintanya, dan harus ditambahkan ke daftar ini.

## Pola layar
- **Halaman desktop:** `.wrap` (max 1200) → `.head` (judul + sub + pemilih tahun + aksi) → grid KPI → kartu-kartu.
- **Layar input HP:** `.mhead` gelap (nama amil + statistik) → `.note` batas waktu → `.actions` → pencarian → `.list`.
- **Form HP:** header kembali → kartu bertahap (siapa → jenis → bayar → tambahan) → `.sticky` berisi ringkasan + tombol simpan.

## Bahasa & istilah UI (pakai persis)
- **Istilah tetap:** "Zakat fitrah", "Titip uang", "Beras", "Di kampung", "Simpatisan (SM)", "JM luar", "Lebih bayar → Usaha Bersama (UB)", "Kurang bayar", "Susulan", "Mal + Tijaroh", "Fidyah", "Amil", "Saham", "Hasil musyawarah", "Batas zakat fitrah", "Penerimaan dibuka/ditutup".
- **Gaya kalimat:** sapaan sopan, kalimat pendek, kata kerja di tombol ("Simpan setoran", "Catat serah ke UB").
- **Angka:** "Rp 1.250.000", "361,8 kg", "H-3", "1448 H / 2027".
