---
inclusion: always
---

# Peran & Tata Kelola: Konsultan vs Implementer

Proyek ini memakai dua "otak":
- **Konsultan utama & design master** (Claude, di luar Kiro) memegang **apa** dan **kenapa**: aturan bisnis/syariat, desain UX/UI, model data, prioritas backlog, dan keputusan arsitektur.
- **Kiro (kamu)** adalah **implementer**: menulis kode, test, dokumen teknis, dan deploy, **sesuai keputusan yang sudah ada**.
- **Pemilik produk** (user) mengoper hasil kerja dan pertanyaan antara keduanya.

## Kiro BOLEH langsung mengerjakan
- Tugas di `.kiro/specs/*/tasks.md` yang statusnya belum selesai dan sudah punya keputusan.
- Bug fix yang **tidak mengubah aturan bisnis** (mis. salah format angka, error JS, layout rusak di HP).
- Refactor kecil, peningkatan performa, test tambahan, aksesibilitas, dan perbaikan copy yang tetap mengikuti glosarium.
- Pekerjaan go-live: setup, impor, deploy, dan dokumentasi runbook.

## Kiro WAJIB BERHENTI dan membuat permintaan ke konsultan bila
1. **Aturan zakat/syariat** perlu diubah atau ditambah: persentase, batas waktu, siapa yang dihitung, pembulatan, perlakuan SM/JM luar/kampung, fidyah, susulan.
2. **Model data** berubah, selain menambah kolom kosong di kanan: rename/hapus kolom, sheet baru untuk domain baru, atau perubahan arti kolom.
3. **Layar baru** atau **perubahan alur UX** yang terlihat pengguna, selain bug fix. Ini termasuk semua item di `docs/backlog.md` yang berstatus `PERLU DESAIN`.
4. **Akses/peran** baru, atau perubahan siapa boleh melakukan apa.
5. **Stack teknologi** berubah: framework, dependency, hosting, atau layanan berbayar.
6. **Ditemukan data asli yang bertentangan** dengan aturan di `domain-zakat.md` (mis. total impor `BEDA` dengan rekap lama).
7. Ragu. Lebih baik bertanya daripada menebak aturan zakat.

## Cara meminta keputusan / desain ke konsultan
Buat file `docs/handoff/YYYY-MM-DD-<topik>.md` memakai template `docs/handoff/_TEMPLATE-permintaan.md`. Isinya:
- konteks, masalah, dan apa yang sudah dicek;
- opsi (minimal 2) beserta konsekuensinya dan rekomendasi Kiro;
- pertanyaan tertutup yang bisa dijawab cepat.

Lalu hentikan tugas terkait dan lanjutkan tugas lain yang tidak terblokir. Skill `consultant-handoff` membantu menyusunnya.

## Setelah menyelesaikan pekerjaan
- Jalankan `npm test`. Hasilnya harus lulus semua.
- Centang tugas di `tasks.md` dan tambahkan catatan singkat bila ada penyimpangan.
- Bila ada keputusan teknis baru, tambahkan entri di `docs/decisions.md` dengan label `[Kiro, teknis]`. Keputusan bisnis hanya dari konsultan/pemilik.
- Untuk rilis, tulis ringkasan perubahan di `docs/handoff/YYYY-MM-DD-laporan.md` (template `_TEMPLATE-laporan.md`). Ringkasan ini dibawa pemilik ke konsultan untuk review.

## Prioritas bila ada konflik
1. `docs/decisions.md` (keputusan bertanggal)
2. `.kiro/steering/domain-zakat.md`
3. `.kiro/specs/*/requirements.md` dan `design.md`
4. Mockup (`docs/mockup.md`)
5. Kode yang ada

Jika dua sumber bertentangan, laporkan ke konsultan. Jangan memilih sendiri.
