# Permintaan: Implementasi CodeGraph untuk Indexing Codebase

**Dari:** Kiro (implementer)  
**Kepada:** Konsultan utama  
**Tanggal:** 2024-11-22  
**Status:** Permintaan keputusan teknologi

---

## Konteks

Saat ini, ketika Claude extension (atau Kiro) perlu cari informasi di codebase:
1. **Membaca seluruh file** `.gs` dan `web/*.js` setiap kali
2. **Context window terbuang** banyak hanya untuk load kode
3. **Lambat** saat codebase bertambah (saat ini 14 `.gs` + 3 app.js)
4. **Tidak scalable** untuk backlog fitur besar mendatang

---

## Solusi: CodeGraph Indexing

**CodeGraph** adalah tool yang:
- Index codebase sekali → simpan dependency graph (fungsi → fungsi yang dipanggil, kolom sheet → tabel yang pakai, dll)
- Query cepat: "siapa yang panggil `simpanFitrah_`?" → langsung dapat list tanpa baca 14 file
- Output: file JSON/database yang bisa di-query programatic

**Benefit:**
- Context window Kiro/Claude lebih efisien (hanya load file relevan)
- Faster search & refactor (cari caller, cari penggunaan kolom)
- Maintenance backlog lebih aman (tahu dampak perubahan sebelum kode)

---

## Opsi

### Opsi A: Implementasi CodeGraph (recommended)
**Usaha:** setup indexer sekali (~2-3 jam), lalu query otomatis  
**Tool:** bisa pakai existing CodeGraph, atau buat custom indexer Node.js sederhana  
**Simpan:** `.codeindex/` di gitignore (index lokal) atau di repo (tracked)

**Kelebihan:**
- Scalable untuk fitur banyak
- Cepat query
- Reusable untuk tim

**Kekurangan:**
- Setup awal
- Index perlu di-update saat ada perubahan kode (bisa otomatis via hook)

### Opsi B: Tetap status quo
**Usaha:** 0  
**Downside:** context window terus terbuang, lebih lambat seiring codebase membesar

### Opsi C: Hybrid (untuk Fase 4+)
Implementasi CodeGraph **hanya untuk backlog**, bukan untuk MVP/UAT yang sudah selesai. Bisa nanti saat ada fitur besar.

---

## Rekomendasi Kiro

**Opsi A** lebih baik untuk jangka panjang, terutama kalau project akan maintenance bertahun-tahun atau ada kontributor baru. Investasi 2-3 jam sekarang menghemat puluhan jam nanti.

Tapi keputusan ada di konsultan: apakah sekarang (Fase 4 planning) atau nanti (saat ada backlog berat).

---

## Pertanyaan untuk Konsultan

1. Setuju untuk implementasi CodeGraph? (A / B / C)
2. Kalau A: prioritas sekarang atau di Fase 4 nanti?
3. Tool preference: existing CodeGraph tool, atau custom indexer sederhana?
4. Indexer di-commit ke repo atau `.gitignore`?

---

**Tunggu approval sebelum mulai coding.**

