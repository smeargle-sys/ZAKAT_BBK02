# Task 22 — GitHub Pages Setup & Web Config

**Task:** Isi `web/config.js` dengan URL produksi + setup repo GitHub baru untuk dashboard + cache-busting.

**Status:** ⏳ Menunggu pemilik lakukan Task 17–21 (deploy Web App & dapat URL `/exec`)

---

## Step 1: Persiapan (Pemilik)

### 1a. Deploy Web App ke Google Apps Script

**Lokasi:** Spreadsheet ZAKAT BBK02 → Ekstensi › Apps Script → Deploy › New deployment

**Konfigurasi:**
- Type: **Web app**
- Execute as: **Me** (akun yang own spreadsheet)
- Who has access: **Anyone**

**Hasil:** Dapatkan URL berakhiran `/exec`, mis:
```
https://script.google.com/macros/s/AKfycbzABC123XYZ/exec
```

**Simpan URL ini** untuk step berikutnya.

---

### 1b. Buat Repo GitHub Baru untuk Dashboard

**Repo baru:**
- Nama: `ZAKAT_DASHBOARD_BBK02` (atau sesuai naming repo sensus/absensi)
- Visibility: **Public** (supaya bisa GitHub Pages)
- Deskripsi: "Dashboard Zakat BBK02 — Kelompok Babakan Barat"

**Jangan** init dengan README/gitignore (nanti Kiro push dari local repo yang sudah ada)

---

## Step 2: Setup Local (Kiro)

### 2a. Tambah Web App URL ke `web/config.js`

**File:** `web/config.js`

**Ganti:**
```javascript
window.ZAKAT_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/GANTI_DENGAN_ID_DEPLOYMENT/exec'
};
```

**Menjadi** (pakai URL dari Step 1a):
```javascript
window.ZAKAT_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbzABC123XYZ/exec'
};
```

---

### 2b. Tambah Cache-Busting ke `index.html`

**Tujuan:** Jika user akses dashboard lama di browser cache, akan auto-load versi terbaru.

**File:** `web/index.html`

**Edit script tags** (bagian bawah, sebelum `</body>`):

```html
<!-- DARI: -->
<script src="config.js"></script>
<script src="app.js"></script>
<script src="app2.js"></script>
<script src="app3.js"></script>

<!-- MENJADI: -->
<script src="config.js?v=1.0.0"></script>
<script src="app.js?v=1.0.0"></script>
<script src="app2.js?v=1.0.0"></script>
<script src="app3.js?v=1.0.0"></script>
```

**Catatan:** Setiap kali ada update fitur, **ubah `?v=X.Y.Z` ke versi lebih tinggi** (mis. `1.0.1`, `1.1.0`). Browser akan detect perubahan query string dan reload file baru.

**Versioning:** Pakai semantic versioning:
- `1.0.0` = rilis pertama go-live
- `1.0.1` = bug fix
- `1.1.0` = fitur baru
- `2.0.0` = perubahan breaking / redesign

---

### 2c. Siapkan Repo Lokal untuk Push

Lokasi repo sudah di `/Volumes/NewVols/git/zakat-bbk02`.

**Step:**
1. Update `.gitignore` jika perlu (sudah ada)
2. Commit perubahan `web/config.js` dan `web/index.html`:
   ```bash
   cd /Volumes/NewVols/git/zakat-bbk02
   git add web/config.js web/index.html
   git commit -m "Task 22: Add Web App URL to config & cache-busting version tags"
   ```

---

## Step 3: Setup GitHub Pages (Pemilik + Kiro)

### 3a. Push ke Repo Dashboard (Kiro)

**Dari repo lokal:**
```bash
cd /Volumes/NewVols/git/zakat-bbk02

# Jika belum ada remote dashboard (baru):
git remote add dashboard https://github.com/smeargle-sys/ZAKAT_DASHBOARD_BBK02.git

# Atau jika ingin ganti remote (replace origin ke dashboard):
git remote set-url origin https://github.com/smeargle-sys/ZAKAT_DASHBOARD_BBK02.git

# Push folder web/ ke repo dashboard
# (Lihat step di bawah untuk cara yang tepat)
```

**Catatan penting:** 
- Repo `ZAKAT_BBK02` (GitHub) = kode backend + frontend source (untuk Kiro develop)
- Repo `ZAKAT_DASHBOARD_BBK02` (GitHub Pages) = **hanya folder `web/` yang di-push**
- Dua repo berbeda

Untuk setup GitHub Pages dengan folder `web/` sebagai source, ada 2 cara:

---

### Opsi A: Subtree Push (Recommended)

Satu repo lokal, push folder `web/` ke GitHub Pages repo.

```bash
# Setup remote tracking folder web/ ke repo dashboard
git subtree add --prefix web https://github.com/smeargle-sys/ZAKAT_DASHBOARD_BBK02.git main --squash

# Setiap kali ada perubahan web/:
git add web/
git commit -m "Update dashboard web files"
git subtree push --prefix web https://github.com/smeargle-sys/ZAKAT_DASHBOARD_BBK02.git main --squash
```

**Keuntungan:** 1 repo lokal, mudah maintenance.

---

### Opsi B: Separate Worktree (Alternative)

Checkout folder `web/` ke worktree terpisah, push ke Pages repo.

```bash
# Clone dashboard repo ke folder terpisah
git clone https://github.com/smeargle-sys/ZAKAT_DASHBOARD_BBK02.git ../zakat-dashboard

# Copy file web/ ke folder terpisah
cp -r web/* ../zakat-dashboard/

# Push di folder terpisah
cd ../zakat-dashboard
git add .
git commit -m "Initial commit: dashboard web files"
git push
```

**Keuntungan:** Terpisah, cleaner history.

---

### 3b. Enable GitHub Pages (Pemilik)

**Lokasi:** Repo dashboard → Settings → Pages

**Konfigurasi:**
- Source: **Deploy from a branch**
- Branch: **main** / **root** (atau gh-pages)
- Folder: **root** (kalau push folder web/ langsung), atau **docs** (kalau punya subfolder)

**Hasilnya:** GitHub Pages URL, mis:
```
https://smeargle-sys.github.io/ZAKAT_DASHBOARD_BBK02/
```

**Simpan URL ini untuk step berikutnya.**

---

## Step 4: Testing (Kiro)

### 4a. Test Web Config

```bash
cd /Volumes/NewVols/git/zakat-bbk02

# 1. Check syntax
npm run check

# 2. Dev server lokal (simulasi)
npm run dev
# Buka http://localhost:8787 → cek koneksi ke backend simulasi
```

---

### 4b. Test di Production URL (Pemilik)

Setelah GitHub Pages live, buka:
```
https://smeargle-sys.github.io/ZAKAT_DASHBOARD_BBK02/
```

**Cek:**
- ✅ Halaman load (bukan 404)
- ✅ Koneksi ke Web App (login form responsif)
- ✅ Buka developer console (F12) → tidak ada error CORS
- ✅ Refresh halaman → ambil file terbaru (bukan cache lama)

---

## Troubleshooting

### "Cannot fetch from Web App"
- Cek URL di `web/config.js` sudah benar
- Pastikan Web App dibuat dengan **Execute as: Me** dan **Access: Anyone**
- Lihat CORS: request harus `Content-Type: text/plain;charset=utf-8` (sudah fix di `app.js`)

### "GitHub Pages tidak aktif"
- Cek di Settings › Pages → Source sudah diset
- Tunggu 1–2 menit untuk propagasi DNS
- Buka URL Pages lagi

### "File JS tidak ter-update (cache lama)"
- Pastikan `?v=X.Y.Z` di-update di `index.html`
- Clear browser cache (Ctrl+Shift+Del) atau buka Incognito
- Tekan Ctrl+F5 (force refresh)

### "Halaman blank / error JS"
- Buka developer console (F12) → lihat error
- Cek `config.js` syntax (URL tidak ada typo)
- Cek file `.js` semua ada di folder

---

## Checklist Task 22

- [ ] Pemilik: Deploy Web App & dapat URL `/exec`
- [ ] Pemilik: Buat repo GitHub `ZAKAT_DASHBOARD_BBK02`
- [ ] Kiro: Update `web/config.js` dengan URL Web App
- [ ] Kiro: Tambah cache-busting `?v=` ke `index.html`
- [ ] Kiro: Push folder `web/` ke repo dashboard (subtree atau worktree)
- [ ] Pemilik: Enable GitHub Pages di repo dashboard
- [ ] Pemilik/Kiro: Test production URL
- [ ] Kiro: Commit perubahan ke repo `ZAKAT_BBK02` (kode sumber)

---

## Next Steps

Setelah Task 22 selesai:
- **Task 23:** Pemilik konfigurasi tahun 2027 & amil (di spreadsheet)
- **Task 24:** Kiro verifikasi Tren menampilkan angka 2024–2026

