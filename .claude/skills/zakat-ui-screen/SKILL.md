---
name: zakat-ui-screen
description: Membuat atau mengubah layar/komponen web Zakat BBK02 (vanilla JS, router hash, design system hijau BBK02) sesuai desain konsultan — form input amil di HP, kartu dashboard, tabel, modal, grafik batang CSS. Gunakan saat mengimplementasikan desain layar, memperbaiki tampilan, atau menambah elemen UI.
metadata:
  project: zakat-bbk02
---

# Mengerjakan layar UI

## Syarat
- Layar baru atau perubahan alur **harus punya desain dari konsultan** (mockup atau handoff berisi desain). Tanpa desain → skill `consultant-handoff`.
- Bug tampilan atau penyesuaian kecil boleh langsung dikerjakan.

## Langkah
1. Tentukan file: beranda/login di `app.js`; form input di `app2.js`; dashboard/tren/setoran/konfigurasi di `app3.js`.
2. Buat `Z.viewNama = function (param) { Z.loading(); …api…then(renderNama).catch(Z.fail); }` dan `function renderNama()` yang mengisi `Z.app.innerHTML`.
   - Jika ini route baru, tambahkan `case` di `route()` (`app.js`), dan bila perlu menu di `NAV` beserta peran yang boleh.
3. **Pakai komponen yang ada** (`ui-design-system.md`): `.card.pad`, `card(title, sub, body, right)` di app3, `kpi()`, `.tbl`, `.chip`, `.note`, `.btn`, `label.f` + `.fi`, `.seg`, `.check`, `.sticky`.
   - **Jangan** membuat warna baru. Pakai token CSS.
4. **Escape** semua data dengan `esc()`. Format angka dengan `rp`/`rpShort`/`kgf`/`nf`/`pct`, dan tanggal dengan `tglId`.
5. **Event:**
   - Aksi klik memakai `data-act` + `ACT.xxx`.
   - Input langsung memakai `addEventListener('input')` dan update elemen kecil saja.
6. **Aksesibilitas:** label untuk setiap input, `aria-label` untuk tombol ikon, `aria-pressed` untuk toggle, `role="img"` + `aria-label` ringkasan untuk grafik.
7. **Keadaan khusus:** kosong ("Belum ada data."), loading, error (toast), terkunci (`.note` + tombol disabled).

## Cek visual
- `npm run dev` → cek lebar 390 px dan 1440 px. Tidak boleh ada scroll horizontal di halaman (kecuali di dalam `.tbl`). Target sentuh ≥ 44 px.
- Bandingkan dengan mockup (`docs/mockup.md`). Perbedaan yang disengaja dicatat di laporan.
- `npm run check` dan, bila bisa, `npm run ui`.
