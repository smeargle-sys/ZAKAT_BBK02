# Design — Pra-Ramadhan 2027

> Penjelasan bisnis dan alasannya ada di `docs/handoff/2026-11-22-jawaban-konsultan-5-fitur.md`. Dokumen ini hanya berisi peta teknis.

## Skema (tambah kolom di kanan, lalu jalankan `setupZakat`)
| Sheet | Kolom baru | Isi |
|---|---|---|
| `Setoran_Fitrah` | `Dicatat_Oleh` | `s.nama` saat dibuat. Kosong untuk impor/data lama |
| `Zakat_Lain` | `Dicatat_Oleh` | sama (termasuk fidyah "sekalian" yang dibuat dari `simpanFitrah_`) |

Perbarui juga `.kiro/steering/data-model.md` (salinan di `.claude/rules/` ikut diperbarui).

## Backend
| File | Perubahan |
|---|---|
| `00_Config.gs` | Tambah `Dicatat_Oleh` di akhir array `Setoran_Fitrah` & `Zakat_Lain` |
| `Fitrah.gs` · `simpanFitrah_` | Saat setoran baru: `obj.Dicatat_Oleh = s.nama \|\| s.role`. Saat mengubah: jangan menimpa kolom ini (hapus key dari `obj` sebelum `updateObject_`). Detail log ditambah `amil` |
| `Fitrah.gs` · `simpanLain_` | Sama |
| `Fitrah.gs` · `daftarSetoran_` | Kirim `dicatat` |
| `Master.gs` · `daftarSimpatisan_` | Tambah `sudah`. Baca `jiwaFitrah_(tahunAktif_().Tahun)` **sekali** di awal fungsi, lalu buat map `Ref_ID` → true untuk `Tipe = SM` |
| `Dashboard.gs` · `dashboard_` | Tambah `out.progres` di dalam blok `if (aktif)`, dengan memakai `kk` yang sudah dihitung (jangan memanggil `kkList_` lagi). Pecah ke helper `progresJamaah_(kk, F, c)` supaya `dashboard_` tidak bertambah panjang |

### `progresJamaah_` — sketsa
```js
// kk = hasil kkList_ (memuat semua KK termasuk TANPA-KK), F = setoran fitrah tahun ini, c = config
var asli = kk.filter(function (k) { return k.id.indexOf('TANPA-KK-') !== 0; });
var lengkap = function (k) { return k.jiwa > 0 && k.sudah === k.jiwa; };
// "hari ini": hitung ulang status KK seandainya setoran hari ini belum ada,
// dengan memakai idSetoran per anggota + set ID setoran yang Tanggal = hari ini
```
- `jiwaSudah` = Σ `k.sudah` atas **semua** kk (termasuk TANPA-KK).
- `jiwaHariIni` = jumlah anggota sensus yang `idSetoran`-nya termasuk setoran hari ini.
- `kkHariIni` = KK asli yang lengkap sekarang **dan** tidak lengkap bila anggota dari setoran hari ini dianggap belum.
- Agar perhitungan "hari ini" bisa dilakukan, `kkList_` perlu mengirim `idSetoran` per anggota. Ini sudah ada.

## Frontend
| File | Perubahan |
|---|---|
| `web/app2.js` · `smPicker` | Baris simpatisan `sudah && id !== simpatisan setoran yang diedit` → `label.check.done`, input disabled, chip `ok` "Sudah zakat" |
| `web/app3.js` · Pemantauan | Ganti bar partisipasi dengan kartu progres (2 × `.bar`). Tombol `Bagikan progres` (`data-act="bagikanProgres"`) hanya untuk `admin`/`pengurus` |
| `web/app3.js` · `ACT.bagikanProgres` | Modal: `<pre>`-like pratinjau (escape!), tombol "Kirim ke WhatsApp" → `navigator.share` bila ada, selain itu `window.open('https://wa.me/?text=' + encodeURIComponent(teks))`. Tombol "Salin teks" → `navigator.clipboard.writeText`, dengan fallback `textarea` + `execCommand('copy')`, dibungkus try/catch |
| `web/app3.js` · Data Setoran | Teks kecil "dicatat oleh X" bila `dicatat && dicatat !== amil`. CSV + kolom |
| `web/index.html` | Naikkan `?v=` |

### Pembentuk teks — fungsi murni
Buat `Z.teksProgres(progres, hijriah, kelompok)` di `app3.js`. Jangan bergantung pada DOM, supaya mudah diuji di Node. Fungsi ini mengembalikan string sesuai format di jawaban konsultan:
- **Tanggal:** nama hari + tanggal Indonesia (`Z.tglId`).
- **Persen:** `Math.floor(x / total * 100)`, total 0 → 0.
- **Bar:** `'▓'.repeat(floor(p / 10)) + '░'.repeat(10 - …)`. Ingat ES5: pakai loop atau `new Array(n + 1).join('▓')`.
- **Nama kelompok:** dari `bootstrap`. Bila `APP.KELOMPOK` belum dikirim, tambahkan ke respons `bootstrap_`.

## Test
- **`e2e-api.test.js`:**
  - Penolakan peran (Req 1).
  - `Dicatat_Oleh` saat admin mencatat atas nama amil, dan tidak berubah saat diubah. Amil yang mengirim `idAmil` lain tetap tercatat atas namanya (Req 2).
  - `daftarSimpatisan.sudah` (Req 3).
  - `progres` dengan fixture: setoran kemarin dan hari ini, 1 KK lengkap hari ini, 1 KK sebagian, 1 jiwa KAMPUNG, 1 TANPA-KK (Req 4).
  - `belum` memuat TANPA-KK dan `kkList` tanpa `alamat` (Req 5).
- **Unit teks progres:** muat fungsi `teksProgres` di Node. Golden: 98/120 KK → "81%" dan 8 blok. 231/264 → "87%" dan 8 blok. 120/120 → "100%". Kasus batas lewat. Kasus hari ini = 0.
