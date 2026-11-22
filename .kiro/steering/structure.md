---
inclusion: always
---

# Struktur Repo & Konvensi

```
apps-script/              Backend Google Apps Script (semua file berbagi global scope)
  appsscript.json         manifest: timeZone Asia/Jakarta, V8, Drive v3, webapp
  00_Config.gs            APP (ID sensus, ID file impor, sesi), SHEETS (skema kolom), konstanta jenis
  Util.gs                 helper sheet (readTable_, appendObjects_, updateObject_), num_, tanggal, hash, lock, splitLargestRemainder_
  Setup.gs                menu spreadsheet, setupZakat (buat/upgrade sheet), Config awal 2024–2027, buat akun Admin
  Sensus.gs               readSensus_ (cache 5 menit), readArsipSensus_, keluargaMap_
  Auth.gs                 login PIN pribadi, sesi, akun Admin/Pengurus (Pengguna), cek PIN unik
  Api.gs                  doGet/doPost, routes_() = daftar action + peran yang boleh
  Master.gs               config tahun, tahun baru, amil (+PIN), simpatisan, cari muzakki, serah UB, beli beras, bagian amil
  Fitrah.gs               kkList_, simpan/ubah/hapus setoran fitrah, zakat lain (mal/tijaroh/fidyah), daftar setoran
  Dashboard.gs            ringkasTahun_ (agregasi), dashboard_, tren_
  Matcher.gs              normName_, matchName_ (pencocok nama → sensus)
  ImportParse.gs          parser murni sheet lama (muzakki, mal, bagian amil)
  Import.gs               imporSemua / imporTahun_ / terapkanReviewImpor
web/                      Frontend GitHub Pages
  index.html              shell: topbar, #app, modal, toast; memuat config.js, app.js, app2.js, app3.js
  config.js               window.ZAKAT_CONFIG.API_URL
  style.css               design tokens & komponen (lihat ui-design-system.md)
  app.js                  util, state S, api(), router hash, topbar, login, beranda amil
  app2.js                 form fitrah, modal simpatisan, form mal/tijaroh/fidyah
  app3.js                 dashboard pemantauan, tren, data setoran, konfigurasi
tests/                    Test Node tanpa dependency (simulasi Apps Script)
  gas-mock.js             tiruan SpreadsheetApp, CacheService, dll + memuat semua .gs
  fixtures/sensus-fixture.js  data sensus SINTETIS
  *.test.js, run-all.js, check-syntax.js, dev-server.js, ui-smoke.py
docs/                     decisions.md, backlog.md, mockup.md, handoff/ (laporan ke konsultan)
.kiro/                    steering, skills, specs, hooks
```

## Konvensi penamaan
- **Bahasa:** Bahasa Indonesia untuk nama fungsi domain, kolom sheet, pesan error, dan teks UI (`simpanFitrah_`, `Jiwa_JM`, `Tujuan_Lebih`).
- **Fungsi `.gs`:** fungsi internal berakhiran `_`. Fungsi tanpa `_` hanya untuk menu spreadsheet atau entry point (`doPost`, `setupZakat`, `imporSemua`).
- **Kolom sheet:** `Pascal_Snake` (`Tgl_Idul_Fitri`). Kolom baru **ditambahkan di kanan** lewat `SHEETS` + `setupZakat()`. Jangan mengubah urutan atau menghapus kolom lama.
- **ID baris:** prefix + waktu + acak. `FT-` setoran fitrah, `ML-` mal/tijaroh, `FD-` fidyah, `SM-` simpatisan, `AM-` amil, `US-` pengguna, `UB-` serah UB, `BL-` beli beras. Data impor memakai prefix `IMP<tahun>-`.
- **Nilai enum:** HURUF BESAR. Jenis fitrah: `BERAS|UANG|KAMPUNG`. Zakat lain: `MAL|TIJAROH|MAL_TIJAROH|FIDYAH`. Lampiran: `UTAMA|SUSULAN`. Status tahun: `BUKA|TUTUP`. Status bayar: `LUNAS|KURANG`. Tujuan lebih: `UB|KEMBALI`. Sumber: `APP|IMPOR`.
- **Frontend:**
  - Setiap file adalah IIFE.
  - Berbagi lewat `window.__Z`.
  - Event memakai delegasi `data-act="namaAksi"` → `ACT.namaAksi`.
  - View bernama `viewXxx` dan `renderXxx`.

## Menambah fitur: urutan file yang disentuh
1. **Skema:** `00_Config.gs`, lalu `Setup.gs` jika ada default.
2. **Logika:** di file domain yang sesuai.
3. **Route:** di `Api.gs`, dengan peran yang boleh.
4. **Test:** di `tests/`.
5. **UI:** di `web/app*.js` + `style.css`.
6. **Dokumen:** `docs/decisions.md` bila ada keputusan baru.

Skill `zakat-feature-apps-script` berisi langkah lengkapnya.
