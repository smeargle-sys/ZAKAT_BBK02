---
name: consultant-handoff
description: Menyusun permintaan keputusan/desain ke konsultan utama (Claude) atau laporan hasil kerja — dipakai saat menemui aturan zakat/syariat yang belum diputuskan, perubahan model data, layar/alur UX baru, item backlog berstatus PERLU DESAIN, angka impor BEDA, konflik antar dokumen, atau setelah rilis. Menghasilkan file di docs/handoff/.
metadata:
  project: zakat-bbk02
---

# Handoff ke konsultan

Konsultan tidak melihat repo secara langsung. Pemilik produk akan menyalin isi file handoff ke percakapan dengan konsultan, jadi file harus **berdiri sendiri, ringkas, dan konkret**.

## A. Permintaan keputusan / desain
1. Salin `docs/handoff/_TEMPLATE-permintaan.md` menjadi `docs/handoff/YYYY-MM-DD-<topik-singkat>.md`.
2. Isi:
   - **Konteks:** fitur/task terkait (ID task, ID backlog), dan file/fungsi yang terdampak.
   - **Masalah:** apa yang belum jelas atau bertentangan. Kutip aturan yang ada (`domain-zakat.md`, `decisions.md`).
   - **Data pendukung:** angka, contoh baris (nama **disamarkan**), dan screenshot dari data sintetis saja.
   - **Opsi:** minimal 2 opsi, masing-masing dengan dampak ke data, UX, dan effort. Sertakan **rekomendasi Kiro**.
   - **Pertanyaan tertutup** (ya/tidak atau pilih A/B) supaya bisa dijawab cepat.
   - **Yang terblokir** dan **yang tetap bisa dikerjakan** sambil menunggu.
3. Tandai task terkait di `tasks.md` dengan `⏸ menunggu konsultan: docs/handoff/<file>`.
4. Lanjutkan pekerjaan lain yang tidak terblokir.

## B. Laporan hasil kerja / rilis
1. Salin `docs/handoff/_TEMPLATE-laporan.md`.
2. Isi: ringkasan, task selesai, perubahan per file, hasil `npm test`, keputusan teknis baru, penyimpangan dari desain (dan alasannya), risiko/temuan, dan pertanyaan terbuka.

## C. Setelah konsultan menjawab
- Masukkan keputusan ke `docs/decisions.md` (nomor D-xx berikutnya, tanggal, sumber "Konsultan via <file>").
- Jika aturan berubah, perbarui `domain-zakat.md`/`data-model.md`. Perbarui atau buat spec (`requirements.md` → `design.md` → `tasks.md`).
- Perbarui status item di `docs/backlog.md`.
