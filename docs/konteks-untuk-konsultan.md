# Brief untuk Konsultan (tempel ke percakapan dengan Claude)

> Pemilik produk: salin bagian di bawah garis ini ke Claude saat kembali berdiskusi desain/backlog. Lampirkan juga file handoff terbaru dari `docs/handoff/` dan, bila relevan, `docs/decisions.md` dan `docs/backlog.md`.

---

Saya melanjutkan proyek **Aplikasi Zakat BBK02** (Apps Script + Google Sheets + GitHub Pages, data jamaah dari SENSUS BBK02). Kamu adalah **principal consultant & design master**, dan **Kiro** adalah implementer.

**Status:**
- MVP sudah dibangun dan teruji (simulasi): login PIN pribadi, input fitrah/mal/tijaroh/fidyah per jiwa, batas fitrah, susulan mal, pembagian otomatis (sisa terbesar), bagian amil musyawarah, UB, pembelian beras, dashboard, tren 2024–2026, konfigurasi, dan impor xlsx lama.
- Keputusan yang mengikat: D-01 s/d D-21 di `docs/decisions.md`.
- Canvas mockup: https://claude.ai/artifact/8DgDLt5j66oceEeNu3gsCw

**Yang saya butuhkan dari kamu sekarang:** <pilih>
- Desain backlog B-.. (lihat `docs/backlog.md`), dengan hasil berupa keputusan, desain layar di canvas, dan spec (`requirements.md`/`design.md`/`tasks.md`) yang siap dikerjakan Kiro.
- Jawaban atas permintaan Kiro: <tempel isi docs/handoff/…>
- Review laporan Kiro: <tempel isi laporan>

**Format jawaban yang saya minta:**
- keputusan bernomor (D-xx berikutnya);
- perubahan untuk `domain-zakat.md`/`data-model.md` bila ada;
- spec Kiro dalam format EARS + tasks berurutan;
- daftar hal yang Kiro TIDAK boleh lakukan.
