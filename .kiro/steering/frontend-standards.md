---
inclusion: fileMatch
fileMatchPattern: ["web/**", "tests/ui-smoke.py"]
---

# Standar Frontend (web/)

## Arsitektur
- **Struktur file:** setiap file JS adalah IIFE `'use strict'`. `app.js` membuat `window.__Z` (util, state `S`, `api`, `go`, `ACT`, `openModal`, dll). `app2.js` dan `app3.js` menambah `Z.viewXxx`.
- **Router hash:** `#/login`, `#/amil`, `#/fitrah/<idKK|_sm>?edit=<id>`, `#/lain?jenis=MAL|FIDYAH`, `#/dash?tahun=`, `#/tren`, `#/setoran?tahun=`, `#/config?tahun=`.
- **Render:** string template → `Z.app.innerHTML`. **Semua data dinamis lewat `esc()`.**
- **Event:**
  - Tombol/aksi memakai `data-act="nama"`, lalu `ACT.nama = function (el, e) {}` (delegasi global).
  - Input yang perlu update langsung memakai `addEventListener('input')`, lalu update bagian kecil (mis. `upd()`). Jangan render ulang seluruh form saat mengetik.
- **Pemanggilan API:**
  - Selalu `api('action', params).then(...).catch(Z.fail)`.
  - Tombol simpan di-disable selama proses dengan label `<span class="spin"></span>Menyimpan…`.
  - Sesudahnya tampilkan `Z.toast()`.
- **Cache:** `S.boot` (config tahun, amil) dan `S.kk` (daftar KK). Setel ke `null` setelah data berubah.
- **Kompatibilitas:** ES5 + `fetch` + `Promise`, untuk HP Android lama. Jangan memakai optional chaining, class, atau async/await.

## Aturan UX
- **HP dulu (390 px)**, lalu desktop 1200 px max-width. Tabel lebar dibungkus `.tbl` (scroll horizontal).
- **Target sentuh ≥ 44 px.** Input angka memakai `inputmode="numeric"`/`"decimal"`.
- **Angka:** format `id-ID`. Rupiah memakai `rp()`, ringkas memakai `rpShort()` (jt/rb), kg memakai `kgf()` dengan maksimal 1 desimal dan koma.
- **Tanggal tampil** memakai `tglId()` ("10 Mar 06:00").
- **Pesan error** dari backend ditampilkan apa adanya lewat toast merah. Pesan harus bisa dipahami amil.
- **Aksi destruktif** (hapus) memakai `confirm()` dengan kalimat yang menyebut nama data.
- **Form yang terkunci** (batas fitrah lewat / tahun ditutup) menampilkan `.note` yang menjelaskan alasannya. Tombol simpan di-disable, tidak disembunyikan.
- **Layar form** (`#/fitrah`, `#/lain`) menyembunyikan topbar global (`body.formview`) dan memakai header kembali sendiri.

## Aksesibilitas (wajib)
- **Elemen asli:** `<button>`, `<a href>`, `<label>` + `<input>`. Jangan pakai `div` yang bisa diklik.
- **Tombol ikon** wajib punya `aria-label`. Toggle/filter memakai `aria-pressed`. Grafik memakai `role="img"` + `aria-label` berisi ringkasan angka.
- **Kontras teks** ≥ 4.5:1 (pakai token warna di `ui-design-system.md`). Warna tidak boleh jadi satu-satunya pembeda. Sertakan teks/label.

## Wajib setelah mengubah web/
- `npm run check` (sintaks).
- Coba di `npm run dev` (http://localhost:8787, PIN uji di header `tests/dev-server.js`), di lebar 390 px dan 1440 px.
- Bila tersedia, jalankan `npm run ui` (Playwright). Hasilnya tidak boleh ada error JS.
