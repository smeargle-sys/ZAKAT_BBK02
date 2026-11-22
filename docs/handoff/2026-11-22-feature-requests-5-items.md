# Handoff: 5 Feature Requests — Perubahan Aturan & UX

**Tanggal:** 2026-11-22  
**Dari:** Pemilik Produk (via Kiro)  
**Untuk:** Claude (Konsultan Utama)  
**Status:** ⏸ MENUNGGU KEPUTUSAN DESAIN

---

## Konteks

Setelah MVP selesai ditest dengan simulasi, pemilik produk meminta 5 perubahan fitur untuk Fase 2 (go-live). Semua 5 item adalah perubahan aturan akses, alur UX, atau fitur dashboard baru. Membutuhkan keputusan design dan approval konsultan sebelum dikodekan.

---

## 5 Feature Requests

### 1. Konfigurasi & Buka Waktu Penerimaan — Hanya Admin

**Request:**
> Hanya petugas dengan role Admin yang bisa mengatur konfigurasi dan membuka waktu penerimaan zakat.

**Interpretasi Kiro:**
- Menu "Konfigurasi" (di dashboard admin) hanya bisa diakses role Admin
- Tombol "Buka Penerimaan" / "Tutup Tahun" hanya Admin yang bisa
- Role Pengurus saat ini bisa lihat dashboard saja → tetap atau dirubah?

**Pertanyaan untuk Claude:**
1. Apakah Pengurus saat ini sudah restricted akses ke menu Konfigurasi? (Cek di `Api.gs` routes → roles)
2. Jika belum, perlu block mereka dari menu ini di frontend?
3. Apakah ada fitur "buka/tutup penerimaan" yang spesifik, atau hanya status Config_Tahun?

---

### 2. Admin Bantu Catat untuk Amil — Fitur Perbantuan

**Request:**
> Terkadang amil minta bantu catat zakat. Fitur: hanya Admin yang bisa catat dengan atas nama amil yang berbeda.

**Use Case:**
- Amil A tidak sempat input, minta amil B atau admin untuk catat setoran atas namanya
- Admin buka form input, **pilih Nama Amil (dropdown)** siapa yang menerima, baru input data seperti biasa
- Data tercatat dengan `ID_Amil` amil yang dipilih, `Diinput_Oleh` = admin yang menginput

**Interpretasi Kiro:**
- Form input fitrah/mal saat ini: amil input untuk diri sendiri (ID_Amil dari sesi)
- Perlu tambah fitur: Admin bisa input + pilih `ID_Amil` target
- Kolom baru atau logic? Lihat `Setoran_Fitrah` di `data-model.md` — apakah ada kolom untuk "siapa yang input"?

**Pertanyaan untuk Claude:**
1. Kolom mana di `Setoran_Fitrah` yang menyimpan info "admin sebagai inputer"? Ada `Diinput_Oleh` atau hanya `Diubah_Oleh`?
2. Apakah log harus catatkan "admin X menginput atas nama amil Y"?
3. Apakah form yang digunakan sama (app.js form fitrah), atau perlu form admin terpisah?

---

### 3. Jamaah Sudah Setor — Muncul Tapi Tidak Dipilih

**Request:**
> Ketika input zakat, jika jamaah sudah tercatat setor zakat tahun ini, namanya tetap muncul di pencarian form tapi tidak bisa dipilih, dengan label "Sudah setor zakat".

**Use Case:**
- Amil cari "Pak Ahmad" → muncul dalam list
- Jika "Pak Ahmad" belum setor → bisa dipilih
- Jika "Pak Ahmad" sudah setor tahun ini → tetap muncul, tapi label "✓ Sudah setor", tidak bisa diklik (disabled)
- Mencegah duplikat setor (aturan di `domain-zakat.md` point 3: "satu jiwa hanya 1× per tahun")

**Interpretasi Kiro:**
- Perlu query: jiwa mana yang sudah ada di `Setoran_Fitrah_Jiwa` tahun ini (tidak Dihapus)
- Frontend: filter hasil pencarian, mark sebagai "sudah setor", disable onClick

**Pertanyaan untuk Claude:**
1. Fitur ini untuk form input saja, atau juga di modal ubah/hapus setoran?
2. Bagaimana UX jika amil tab ke jiwa yang "sudah setor"? Apakah ada opsi untuk "lihat setoran lama" atau hanya disabled?
3. Apakah perlu API baru untuk cek jiwa yang sudah setor, atau bisa dari data yang sudah dikirim form?

---

### 4. Progress Bar — % KK & Jiwa Harian

**Request:**
> Tambahkan progress bar di dashboard yang menunjukkan persentase KK & jiwa yang sudah/belum zakat, **tanpa nominal**. Laporan dikirim setiap hari ke seluruh jamaah.

**Use Case:**
- Dashboard menampilkan: "Setoran Hari Ini: 45 KK / 123 jiwa dari 150 KK / 280 jiwa" → Progress bar
- Bukan progress soq/rupiah, hanya unit KK & jiwa
- "Laporan harian ke seluruh jamaah" → opsi kirim email/wa/notif?

**Interpretasi Kiro:**
- Backend: agregasi per hari (dari `Setoran_Fitrah` grouped by Tanggal)
- Frontend: render progress bar (HTML/CSS, bukan chart library)
- "Laporan ke seluruh jamaah" → butuh fitur distribusi (email, WhatsApp, etc)?

**Pertanyaan untuk Claude:**
1. Apakah progress bar ini di dashboard admin, atau ada halaman terpisah untuk jamaah?
2. "Laporan setiap hari ke seluruh jamaah" = auto email/wa/notif? Atau jamaah lihat sendiri di halaman?
3. Kapan laporan dikirim? Pukul berapa setiap hari?
4. Format laporan: hanya % bar, atau ada narasi? ("Alhamdulillah 45 KK sudah setor")

---

### 5. Source Data Sensus — Configurable / Multi-Spreadsheet

**Request:**
> Source data sensus bisa di-set configurable (seperti DB connector), karena aplikasi mungkin dipakai kelompok lain dengan spreadsheet sensus berbeda.

**Use Case:**
- Saat ini: ID sensus hardcoded di `00_Config.gs` (const `SENSUS_ID`)
- Mau: Admin bisa ubah ID sensus di halaman Konfigurasi
- Tujuan: Reuse aplikasi untuk kelompok lain tanpa edit kode

**Interpretasi Kiro:**
- Pindahkan `SENSUS_ID` dari konstanta ke kolom di `Config_Tahun` atau sheet baru `Konfigurasi_Umum`
- Frontend: input field di halaman Konfigurasi untuk ubah SENSUS_ID
- Backend: validasi akses (hanya admin), baca dari `Config_Tahun` bukannya hardcoded

**Pertanyaan untuk Claude:**
1. Apakah `SENSUS_ID` per tahun (berbeda tiap tahun), atau global (sama semua tahun)?
2. Jika global, letaknya di sheet `Konfigurasi_Umum` baru, atau di row pertama `Config_Tahun`?
3. Bagaimana validasi saat ubah SENSUS_ID? Apakah cek bisa buka spreadsheet tersebut (Drive API)?
4. Apakah ada UI untuk "test connection" sebelum save?

---

## Dampak & Dependensi

| Feature | Model Data | Backend Routes | Frontend UI | Test Coverage |
|---|---|---|---|---|
| 1. Config Only Admin | ✓ Sudah ada | ⚠️ Cek restriction | ✓ Sudah ada | ⚠️ Perlu cek akses |
| 2. Admin Bantu Catat | ⚠️ Kolom "Diinput_Oleh"? | 🔴 Baru | 🔴 Baru | 🔴 Baru |
| 3. Jamaah Sudah Setor | ✓ Sudah ada | ✓ Sudah ada (cek duplikat) | 🔴 Baru (UI disable) | ⚠️ Perlu cek logika |
| 4. Progress Bar Harian | ✓ Sudah ada | ⚠️ Agregasi per hari | 🔴 Baru (komponen bar) | 🔴 Baru |
| 5. SENSUS_ID Configurable | 🔴 Baru kolom | 🔴 Baru logic | 🔴 Baru input | 🔴 Baru |

---

## Rekomendasi Kiro

**Prioritas untuk Claude:**
1. **Lanjutkan Feature 1** (Config restrict) — mudah, hanya cek di routes
2. **Desain Feature 2** (Admin bantu catat) — perlu tentukan kolom `Diinput_Oleh` dan alur input baru
3. **Lanjutkan Feature 3** (Sudah setor label) — bisa coding langsung, hanya UI
4. **Desain Feature 4** (Progress bar) — tentukan format laporan & channel distribusi
5. **Desain Feature 5** (SENSUS_ID config) — tentukan lokasi penyimpanan & validasi

**Saran:** Lakukan dalam fase terpisah:
- **Fase 2a (UI + UX):** Feature 1, 3 → go-live
- **Fase 2b (Backlog desain):** Feature 2, 4, 5 → tunggu design dari Claude

---

## Pertanyaan Tertutup untuk Claude

1. ✅ Approve Feature 1 (Config hanya Admin)?
2. ✅ Approve Feature 3 (Sudah setor label)?
3. ⏸ Desain Feature 2: kolom apa & alur input?
4. ⏸ Desain Feature 4: laporan ke mana & format apa?
5. ⏸ Desain Feature 5: SENSUS_ID di mana & bagaimana validasi?

---

## File & Referensi

- Model data: `.kiro/steering/data-model.md`
- Aturan zakat: `.kiro/steering/domain-zakat.md`
- Routes & akses: `apps-script/Api.gs`
- Form input: `web/app2.js`
- Dashboard: `web/app3.js`
- Current config: `apps-script/00_Config.gs`

---

**Status:** Menunggu keputusan & desain dari Claude  
**Blocking:** Fase 2 go-live bisa jalan paralel (feature 1, 3), tapi feature 2, 4, 5 perlu desain dulu.
