# Laporan Kerja: Pra-Ramadhan 2027 (fitur 1–4) + temuan UAT pemilik

- **Tanggal:** 2026-11-22
- **Dikerjakan oleh:** konsultan (Claude), atas permintaan pemilik
- **Periode/rilis:** web v1.2.0 + backend (perlu versi deployment baru)
- **Hasil `npm test`:** ☑ SEMUA TEST LULUS. `ui-smoke.py` + uji UI fitur baru (Playwright) lulus tanpa error JS.
  ```
  pra-ramadhan: lulus
  teks-progres: lulus
  SEMUA TEST LULUS
  ```

## Ringkasan
- **Kotak "Belum zakat fitrah":** sekarang menghitung KK sesuai aturan sensus, jadi angkanya 65, bukan 88. Jamaah tanpa KK tampil terpisah dan tetap dihitung sebagai jiwa.
- **Kecepatan:** pindah halaman jauh lebih cepat, dan halaman yang sudah pernah dibuka tampil instan.
- **Bagikan progres:** pengurus bisa membagikan progres KK & jiwa ke grup WhatsApp jamaah tanpa nominal.
- **Admin mencatat atas nama amil:** sekarang terlihat siapa yang mencatat.
- **Simpatisan yang sudah zakat:** terkunci di form.

## Task selesai
- [x] Spec `pra-ramadhan-2027` task 0a–12 (lihat `.kiro/specs/pra-ramadhan-2027/tasks.md`).
- [x] **Temuan UAT 1:** Pemantauan menampilkan 88 KK, padahal sensus 65 KK (D-28 revisi).
- [x] **Temuan UAT 2–3:** membuka dan pindah halaman terasa lama (D-29).

## Perubahan per file
| File | Perubahan |
|---|---|
| `apps-script/Util.gs` | Memo tabel per request (`REQ_MEMO_`), cache respons berversi (`versiData_`, `naikkanVersiData_`), dan `withLock_` menaikkan versi data |
| `apps-script/Api.gs` | `handle_` mengaktifkan memo dan menyajikan `dashboard`/`tren`/`kkList`/`daftarSetoran` dari cache (`kunciCache_`). `segar:true` melewati cache |
| `apps-script/Sensus.gs` | Sensus diurai sekali per request |
| `apps-script/Dashboard.gs` | `kkSetor` & daftar belum hanya KK asli, `belumTanpaKK`, `progresJamaah_` |
| `apps-script/Fitrah.gs` | `kkList_` tanpa `alamat` (privasi) dan dengan `tanpaKK`. `Dicatat_Oleh` + nama amil di log. `daftarSetoran_.dicatat` |
| `apps-script/Master.gs` | `daftarSimpatisan_.sudah`/`idSetoran`, `bootstrap_.kelompok` |
| `apps-script/00_Config.gs` | Kolom `Dicatat_Oleh` di `Setoran_Fitrah` & `Zakat_Lain` |
| `web/app.js` | `apiCepat` (cache memori + perbarui di latar), `apiSegar`, prefetch Pemantauan/Tren, keterangan "Tanpa KK" di daftar amil |
| `web/app2.js` | Simpatisan yang sudah zakat terkunci di pemilih |
| `web/app3.js` | Kartu progres, modal Bagikan progres, `Z.teksProgres`, tabel "Jiwa tanpa KK", "dicatat oleh" + CSV, halaman memakai cache |
| `web/style.css` | `.results button.done` |
| `tests/pra-ramadhan.test.js`, `tests/teks-progres.test.js` | Test baru (terdaftar di `run-all.js`) |

## Dampak kecepatan (diukur di simulasi: jumlah baca sheet per request)
| Aksi | Sebelum | Sesudah | Dibuka ulang (cache server) |
|---|---|---|---|
| Tren | 21 | 4 | 0 |
| Pemantauan | 15 | 9 | 0 |
| bootstrap | 4 | 2 | — |

- **Di frontend:** halaman yang sudah pernah dibuka tampil dalam ±10 ms tanpa "Memuat…".
- **Batas yang tidak bisa dihilangkan:** waktu "bangun" Apps Script (±1–2 detik) pada panggilan pertama tetap ada. Itu batas platform gratis.

## Status deploy (2026-11-22 20:12 WIB)
- **Backend:** `clasp push` → versi 2 "fixing v1.2" → `clasp update-deployment` ke deployment produksi (ID sama, URL `/exec` tidak berubah). `ping` lewat GET & POST OK.
- **Manifest:** blok `webapp` dikembalikan (`e8cc7b1`). Sebelumnya blok ini hilang dari HEAD, dan tanpa blok ini versi baru akan mematikan `/exec`.
- **Web:** v1.2.0 live di GitHub Pages.
- **Sisa:** 👤 `setupZakat` sekali (kolom `Dicatat_Oleh`).

## Perubahan skema / deploy (👤 pemilik)
1. `clasp push`.
2. **Deploy › Manage deployments › ✏️ › Version: New version.** Jangan membuat deployment baru.
3. Jalankan **`setupZakat`** sekali, untuk menambah kolom `Dicatat_Oleh`.
4. Web sudah ikut di `main` (cache-busting `?v=1.2.0`). Minta pengguna refresh.

## Penyimpangan dari desain / keputusan teknis baru
- **D-28 direvisi** atas temuan pemilik: KK = punya ID Keluarga, jamaah tanpa KK = jiwa. Arah awal konsultan keliru.
- **D-29 [teknis]:** cache respons ±5 menit. Penulisan lewat aplikasi langsung terlihat, sedangkan edit manual langsung di sheet terlihat paling lambat 5 menit, atau langsung lewat *Muat ulang*.
- **Kartu progres:** menggantikan KPI gelap "Jiwa sensus yang sudah zakat" untuk tahun berjalan. Tahun lama tetap memakai tampilan lama.

## Temuan, risiko, bug yang belum selesai
- **Jiwa di arsip sensus:** jiwa yang tercatat zakat tapi sudah pindah ke `Arsip_Jamaah` tidak masuk progres. Ini wajar, karena total jiwa juga hanya tab Jamaah.
- **Jumlah KK:** KK di tab Keluarga yang tidak punya anggota tidak dihitung di progres (tidak mungkin "sudah"). Jika angka KK di progres berbeda dengan sensus, cek KK kosong di sensus.

## Pertanyaan untuk konsultan
- Tidak ada.
