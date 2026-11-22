# Mockup yang Disetujui

**Canvas desain:** https://claude.ai/artifact/8DgDLt5j66oceEeNu3gsCw (mockup Aplikasi Zakat BBK02 – MVP, milik pemilik produk; buka saat login ke claude.ai)

> Nama dan angka di mockup adalah **contoh fiktif**, kecuali layar Tren yang memakai total asli 2024–2026. Aplikasi yang sudah dibangun mengikuti mockup ini. Bila mockup dan kode berbeda, ikuti `docs/decisions.md`, lalu tanyakan ke konsultan.

| Artboard | Layar di aplikasi | Catatan |
|---|---|---|
| Login PIN pribadi | `#/login` | PIN saja, nama dikenali dari PIN (D-15) |
| Amil · Beranda & cari KK | `#/amil` | pengingat batas fitrah, filter status, tombol Fitrah simpatisan / Mal / Fidyah |
| Amil · Form Setoran Zakat Fitrah | `#/fitrah/<kk>` | centang anggota, SM terkait, JM luar, jenis, bayar, lebih → UB, fidyah sekalian |
| Amil · Form Zakat Mal / Tijaroh / Fidyah | `#/lain` | Mal, Tijaroh, Mal + Tijaroh, Fidyah; banner SUSULAN |
| Dashboard Pemantauan (desktop) | `#/dash` | KPI, harian, jenis, beras, per amil, pembagian, bagian amil musyawarah, UB, belum setor, terbaru |
| Dashboard Pemantauan (HP) | `#/dash` (responsif) | versi pengurus |
| Dashboard Tren Tahunan | `#/tren` | data asli 2024–2026 |
| Admin · Konfigurasi | `#/config` | tahun & harga, batas, persentase, amil + PIN, simpatisan, pengguna |
| Admin · Panel Tambah Simpatisan | modal di Konfigurasi & form fitrah | pilih KK dari sensus atau berdiri sendiri |

Desain layar baru dibuat konsultan di canvas yang sama (artboard baru), lalu ditautkan di tabel ini.
