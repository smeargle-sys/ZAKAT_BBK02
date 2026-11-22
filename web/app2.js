/* Form setoran: zakat fitrah, mal/tijaroh/fidyah, simpatisan. */
(function () {
  'use strict';
  var Z = window.__Z, $ = Z.$, $$ = Z.$$, esc = Z.esc, rp = Z.rp, nf = Z.nf, kgf = Z.kgf, ICON = Z.ICON, S = Z.S, api = Z.api, ACT = Z.ACT;

  // =====================================================================
  // FORM ZAKAT FITRAH
  // =====================================================================
  var F = null;

  Z.viewFitrah = function (kkId, q) {
    Z.loading('Menyiapkan form…');
    var need = [Z.ensureBoot()];
    if (!S.kk) need.push(api('kkList').then(function (d) { S.kk = d; }));
    if (kkId === '_sm') need.push(api('daftarSimpatisan').then(function (l) { F_smList = l; }));
    Promise.all(need).then(function () {
      if (q.edit) return api('getFitrah', { id: q.edit });
      return null;
    }).then(Z.jaga(function (ed) { initF(kkId, ed); renderF(); })).catch(Z.fail);
  };
  var F_smList = [];

  function initF(kkId, ed) {
    var b = S.boot, kk = kkId === '_sm' ? null : S.kk.list.filter(function (k) { return k.id === kkId; })[0];
    var s = ed ? ed.setoran : null;
    // D-45: setoran lama yang KK-nya sudah tidak ada di sensus tetap bisa diubah
    if (kkId !== '_sm' && !kk && ed) kk = { id: kkId, nama: String(s.Nama_Muzakki || ''), anggota: [], simpatisan: [], hilang: true };
    if (kkId !== '_sm' && !kk) throw new Error('Keluarga tidak ditemukan di sensus.');
    F = {
      mode: kkId === '_sm' ? 'SM' : 'KK', kk: kk, editId: s ? s.ID : '',
      jm: {}, sm: {}, luar: s ? Number(s.Jiwa_Luar) || 0 : 0, luarNama: '',
      jenis: s ? s.Jenis : 'UANG', diterima: s ? Number(s.Diterima_Rp) || 0 : '', tujuan: s && s.Tujuan_Lebih === 'KEMBALI' ? 'KEMBALI' : 'UB',
      kg: s && s.Jenis === 'BERAS' ? Number(s.Kg_Beras) : '', tanggal: s ? String(s.Tanggal).slice(0, 10) : Z.today(), catatan: s ? String(s.Catatan || '') : '',
      idAmil: s ? String(s.ID_Amil || '') : (S.idAmil || ''), fidyah: { on: false, hari: '', nominal: '' }, smPilih: null, smQ: ''
    };
    if (kk) kk.anggota.forEach(function (a) { var mine = ed && ed.jm.indexOf(a.id) >= 0; if (mine || (!ed && !a.sudah)) F.jm[a.id] = true; });
    if (ed) ed.sm.forEach(function (id) { F.sm[id] = true; });
    // D-45: jiwa yang tercatat di setoran ini tetapi sudah pindah KK / tidak ada di sensus tetap tampil & tercentang,
    // supaya tidak terhapus diam-diam saat setoran disimpan ulang.
    F.pindah = []; F.smLain = [];
    if (kk && ed) {
      var di = {}; kk.anggota.forEach(function (a) { di[a.id] = 1; });
      ed.jm.forEach(function (id) {
        if (di[id]) return;
        var baru = S.kk.list.filter(function (k) { return k.anggota.some(function (a) { return a.id === id; }); })[0];
        F.jm[id] = true;
        F.pindah.push({ id: id, nama: (ed.nama && ed.nama[id]) || id, ket: baru ? (baru.tanpaKK ? 'Sekarang tanpa KK di sensus' : 'Pindah ke KK ' + baru.nama) : 'Tidak ada lagi di sensus' });
      });
      var smDi = {}; kk.simpatisan.forEach(function (m) { smDi[m.id] = 1; });
      ed.sm.forEach(function (id) { if (!smDi[id]) F.smLain.push({ id: id, nama: (ed.nama && ed.nama[id]) || id }); });
    }
    if (F.mode === 'SM' && ed && ed.sm.length) F.smPilih = ed.sm[0];
  }

  function totalJiwa() { return Object.keys(F.jm).length + Object.keys(F.sm).length + (F.luar || 0); }

  function renderF() {
    var b = S.boot, c = b.config, kk = F.kk;
    var kunci = S.role === 'amil' && (b.batasLewat || c.Status !== 'BUKA');
    var amilOpt = b.amil.filter(function (a) { return a.aktif; }).map(function (a) { return '<option value="' + esc(a.id) + '"' + (a.id === F.idAmil ? ' selected' : '') + '>' + esc(a.nama) + '</option>'; }).join('');
    var anggota = '', smBlock = '';
    if (F.mode === 'KK') {
      anggota = kk.anggota.map(function (a) {
        var lock = a.sudah && a.idSetoran !== F.editId;
        var ket = a.keberadaan && a.keberadaan !== 'Menetap';
        return '<label class="check' + (lock ? ' done' : '') + '"><input type="checkbox" data-jm="' + esc(a.id) + '"' + (F.jm[a.id] ? ' checked' : '') + (lock ? ' disabled' : '') + '>' +
          '<span class="nm"><b>' + esc(a.nama) + '</b><span>' + esc(hubLabel(a.hub) + (a.umur !== '' && a.umur !== null ? ' · ' + a.umur + ' th' : '')) + '</span></span>' +
          (lock ? '<span class="chip ok">Sudah zakat</span>' : '<span class="chip ' + (ket ? 'warn' : 'mint') + '">' + esc(a.keberadaan || 'Menetap') + '</span>') + '</label>';
      }).join('');
      smBlock = kk.simpatisan.map(function (m) {
        var lock = m.sudah && !F.sm[m.id];
        return '<label class="check' + (lock ? ' done' : '') + '"><input type="checkbox" data-sm="' + esc(m.id) + '"' + (F.sm[m.id] ? ' checked' : '') + (lock ? ' disabled' : '') + '>' +
          '<span class="nm"><b>' + esc(m.nama) + '</b><span>Simpatisan' + (m.hubungan ? ' · ' + esc(m.hubungan) : '') + '</span></span>' + (lock ? '<span class="chip ok">Sudah zakat</span>' : '<span class="chip blue">SM</span>') + '</label>';
      }).join('');
    }
    if (F.mode === 'KK' && (F.pindah.length || F.smLain.length || kk.hilang)) {
      anggota += '<div class="note warn" style="margin:8px 0 4px">' + ICON.info + '<span>' + (kk.hilang ? '<b>KK ini sudah tidak ada di sensus.</b> ' : '') +
        'Jiwa di bawah ini tercatat di setoran ini tetapi <b>sudah tidak di KK ini</b> menurut sensus. Tetap tercentang supaya tidak terhapus; hapus centang hanya bila memang tidak termasuk setoran ini.</span></div>' +
        F.pindah.map(function (a) {
          return '<label class="check"><input type="checkbox" data-jm="' + esc(a.id) + '"' + (F.jm[a.id] ? ' checked' : '') + '><span class="nm"><b>' + esc(a.nama) + '</b><span>Tercatat di setoran ini</span></span><span class="chip warn">' + esc(a.ket) + '</span></label>';
        }).join('') +
        F.smLain.map(function (m) {
          return '<label class="check"><input type="checkbox" data-sm="' + esc(m.id) + '"' + (F.sm[m.id] ? ' checked' : '') + '><span class="nm"><b>' + esc(m.nama) + '</b><span>Simpatisan · tercatat di setoran ini</span></span><span class="chip warn">Tidak lagi terkait KK ini</span></label>';
        }).join('');
    }
    var head = F.mode === 'KK' ? 'KK ' + kk.nama : 'Simpatisan (tanpa KK sensus)';
    Z.app.innerHTML =
      '<header class="topbar" style="position:static"><div class="in" style="max-width:560px"><button type="button" class="btn sm" data-act="go" data-h="#/amil" aria-label="Kembali" style="border:0;padding:0 6px">' + ICON.back + '</button>' +
      '<div style="display:flex;flex-direction:column;gap:2px;flex:1"><h1 style="font-size:18px;font-weight:800">' + (F.editId ? 'Ubah setoran' : 'Setoran Zakat Fitrah') + '</h1><span class="sub">' + esc(head) + ' · ' + esc(c.Hijriah) + '</span></div></div></header>' +
      '<form id="fForm" class="wrap narrow" style="padding-top:16px;gap:14px" novalidate>' + Z.batasInfo(b) +
      (S.role === 'admin' ? '<label class="f">Amil yang menerima<select id="fAmil" class="fi"><option value="">— pilih amil —</option>' + amilOpt + '</select></label>' : '') +
      (F.mode === 'KK'
        ? '<fieldset class="card pad" style="margin:0;gap:2px;padding-bottom:8px"><legend class="sr">Anggota keluarga</legend><div style="display:flex;align-items:baseline;gap:8px;padding-bottom:6px"><h2 style="font-size:15px;flex:1">Anggota KK (dari sensus)</h2><span class="chip mint" id="fJmCount"></span></div>' + anggota +
          '<p class="sub" style="margin:6px 0">Anggota yang Mondok, Kerja Luar, dan lain-lain ikut dihitung. Anggota yang sudah zakat di setoran lain tidak bisa dicentang.</p></fieldset>' +
          '<section class="card pad" style="gap:10px"><h2 style="font-size:15px">Ikut titip di KK ini</h2>' + (smBlock || '<p class="sub" style="margin:0">Belum ada simpatisan yang terkait ke KK ini.</p>') +
          '<button type="button" class="btn" style="border-style:dashed" data-act="smBaru" data-kk="' + esc(kk.id) + '">' + ICON.plus + 'Tambah simpatisan ke KK ini</button>' +
          '<div style="display:flex;align-items:center;gap:12px;border-top:1px solid var(--line2);padding-top:10px"><span class="nm" style="display:flex;flex-direction:column;gap:2px;flex:1"><b>JM luar titip zakat</b><span class="sub">Jamaah kelompok lain (jumlah jiwa)</span></span>' +
          '<div class="stepper" role="group" aria-label="Jumlah JM luar"><button type="button" data-act="luar" data-d="-1" aria-label="Kurangi">−</button><span id="fLuar">' + F.luar + '</span><button type="button" data-act="luar" data-d="1" aria-label="Tambah">+</button></div></div>' +
          '<label class="f' + (F.luar ? '' : ' hidden') + '" id="fLuarNamaW">Nama JM luar (opsional)<input id="fLuarNama" class="fi" value="' + esc(F.luarNama) + '"></label></section>'
        : smPicker()) +
      '<section class="card pad" style="gap:10px"><h2 style="font-size:15px">Jenis zakat</h2><div class="seg" style="grid-template-columns:repeat(3,1fr)" role="group" aria-label="Jenis zakat">' +
      [['BERAS', 'Beras'], ['UANG', 'Titip uang'], ['KAMPUNG', 'Di kampung']].map(function (j) { return '<button type="button" data-act="jenis" data-j="' + j[0] + '" aria-pressed="' + (F.jenis === j[0]) + '"' + (F.jenis === j[0] ? ' class="on"' : '') + '>' + j[1] + '</button>'; }).join('') +
      '</div><p class="sub" style="margin:0" id="fJenisNote"></p></section>' +
      '<section class="card pad" id="fBayar"></section>' +
      '<section class="card pad" style="gap:4px;padding-top:6px;padding-bottom:6px">' +
      '<label class="check"><input type="checkbox" id="fFid"' + (F.fidyah.on ? ' checked' : '') + '><span class="nm"><b>Sekalian bayar fidyah</b><span>Dicatat terpisah, tidak ikut pembagian 40/45/15</span></span></label>' +
      '<div id="fFidW" class="fgrid' + (F.fidyah.on ? '' : ' hidden') + '" style="padding-bottom:10px"><label class="f">Jumlah hari<input id="fFidHari" class="fi" inputmode="numeric" value="' + esc(F.fidyah.hari) + '"></label><label class="f">Nominal fidyah (Rp)<input id="fFidNom" class="fi" inputmode="numeric" value="' + esc(F.fidyah.nominal) + '"></label></div>' +
      '<label class="check" style="justify-content:space-between"><span style="font-weight:600;flex:1">Tanggal setor</span><input type="date" id="fTgl" class="fi" style="width:auto;height:40px" value="' + esc(F.tanggal) + '"' + (c.Batas_Fitrah ? ' max="' + esc(c.Batas_Fitrah.slice(0, 10)) + '"' : '') + '></label>' +
      '<label class="f" style="padding:10px 0 12px;border-top:1px solid var(--line2)">Catatan<input id="fCat" class="fi" placeholder="Opsional" value="' + esc(F.catatan) + '"></label></section>' +
      '<div class="sticky"><div class="sub" style="display:flex;justify-content:space-between;gap:8px" id="fFoot"></div>' +
      '<button type="submit" class="btn pri block" id="fSave"' + (kunci ? ' disabled' : '') + '>' + (F.editId ? 'Simpan perubahan' : 'Simpan setoran') + '</button></div></form>';

    // events
    $$('[data-jm]').forEach(function (cb) { cb.addEventListener('change', function () { if (cb.checked) F.jm[cb.getAttribute('data-jm')] = true; else delete F.jm[cb.getAttribute('data-jm')]; upd(); }); });
    $$('[data-sm]').forEach(function (cb) { cb.addEventListener('change', function () { if (cb.checked) F.sm[cb.getAttribute('data-sm')] = true; else delete F.sm[cb.getAttribute('data-sm')]; upd(); }); });
    var on = function (id, ev, fn) { var el = $('#' + id); if (el) el.addEventListener(ev, fn); };
    on('fAmil', 'change', function (e) { F.idAmil = e.target.value; });
    on('fLuarNama', 'input', function (e) { F.luarNama = e.target.value; });
    on('fFid', 'change', function (e) { F.fidyah.on = e.target.checked; $('#fFidW').classList.toggle('hidden', !F.fidyah.on); upd(); });
    on('fFidHari', 'input', function (e) {
      F.fidyah.hari = e.target.value; var tarif = Number(S.boot.config.Tarif_Fidyah) || 0;
      if (tarif) { F.fidyah.nominal = Z.parseNum(F.fidyah.hari) * tarif; $('#fFidNom').value = nf(F.fidyah.nominal); } upd();
    });
    on('fFidNom', 'input', function (e) { F.fidyah.nominal = Z.parseNum(e.target.value); upd(); });
    on('fTgl', 'change', function (e) { F.tanggal = e.target.value; });
    on('fCat', 'input', function (e) { F.catatan = e.target.value; });
    on('smQ', 'input', function (e) { F.smQ = e.target.value; renderSmResults(); });
    $('#fForm').addEventListener('submit', function (e) { e.preventDefault(); saveF(); });
    if (F.mode === 'SM') renderSmResults();
    renderBayar(); upd();
  }

  function hubLabel(h) { return { A: 'Kepala keluarga', B: 'Istri/suami', C: 'Anak', D: 'Anggota lain' }[h] || 'Anggota'; }

  function smPicker() {
    return '<section class="card pad" style="gap:10px"><h2 style="font-size:15px">Simpatisan yang menyetor</h2>' +
      '<label class="search">' + ICON.search + '<span class="sr">Cari simpatisan</span><input id="smQ" type="search" placeholder="Cari nama simpatisan…" value="' + esc(F.smQ) + '"><button type="button" class="clr" data-act="hapusCari" aria-label="Hapus pencarian">' + ICON.x + '</button></label>' +
      '<div class="results" id="smRes"></div>' +
      '<button type="button" class="btn" style="border-style:dashed" data-act="smBaru" data-kk="">' + ICON.plus + 'Simpatisan baru</button>' +
      '<p class="sub" style="margin:0">Untuk simpatisan yang berdiri sendiri. Simpatisan yang terkait keluarga sensus dicatat lewat KK-nya.</p></section>';
  }
  function renderSmResults() {
    var q = (F.smQ || '').toLowerCase();
    var list = F_smList.filter(function (m) { return !q || m.nama.toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
    var el = $('#smRes'); if (!el) return;
    el.innerHTML = list.length ? list.map(function (m) {
      // D-25: yang sudah zakat tahun ini tetap tampil, tapi tidak bisa dipilih (kecuali milik setoran yang sedang diubah)
      if (m.sudah && m.idSetoran !== F.editId) {
        return '<button type="button" class="done" disabled aria-disabled="true"><span class="nm"><b>' + esc(m.nama) + '</b><span>' + esc(m.kkNama ? 'Terkait KK ' + m.kkNama : 'Berdiri sendiri') + '</span></span><span class="chip ok">Sudah zakat</span></button>';
      }
      return '<button type="button" data-act="smPick" data-id="' + esc(m.id) + '" class="' + (F.smPilih === m.id ? 'on' : '') + '" aria-pressed="' + (F.smPilih === m.id) + '"><span class="nm"><b>' + esc(m.nama) + '</b><span>' + esc(m.kkNama ? 'Terkait KK ' + m.kkNama : 'Berdiri sendiri') + '</span></span>' + (F.smPilih === m.id ? ICON.check : '') + '</button>';
    }).join('') : '<p class="sub" style="padding:12px;margin:0">Belum ada simpatisan. Tambahkan simpatisan baru.</p>';
  }
  ACT.smPick = function (el) { var id = el.getAttribute('data-id'); F.smPilih = id; F.sm = {}; F.sm[id] = true; renderSmResults(); upd(); };

  function renderBayar() {
    var c = S.boot.config, el = $('#fBayar');
    if (F.jenis === 'UANG') {
      el.innerHTML = '<h2 style="font-size:15px">Pembayaran titip uang</h2><div class="sum" id="fSum"></div>' +
        '<label class="f">Uang diterima<span style="display:flex;align-items:center;gap:8px" ><span style="font-weight:600;color:var(--muted)">Rp</span><input id="fTerima" class="fi big" inputmode="numeric" data-rp value="' + (F.diterima === '' ? '' : nf(F.diterima)) + '"></span></label>' +
        '<div id="fSel"></div>' +
        '<fieldset id="fTujuanW" style="margin:0;border:0;padding:0;display:flex;flex-direction:column;gap:6px"><legend style="font-size:13px;font-weight:600;color:var(--ink2);padding:0 0 6px">Lebih bayar diserahkan ke</legend>' +
        '<label class="radio' + (F.tujuan === 'UB' ? ' on' : '') + '"><input type="radio" name="tujuan" value="UB"' + (F.tujuan === 'UB' ? ' checked' : '') + '>Usaha Bersama (UB)</label>' +
        '<label class="radio' + (F.tujuan === 'KEMBALI' ? ' on' : '') + '"><input type="radio" name="tujuan" value="KEMBALI"' + (F.tujuan === 'KEMBALI' ? ' checked' : '') + '>Dikembalikan ke jamaah</label></fieldset>' +
        '<p class="sub" style="margin:0">Kalau uang kurang, setoran ditandai "Kurang bayar" dan muncul di dashboard sampai dilunasi.</p>';
    } else if (F.jenis === 'BERAS') {
      el.innerHTML = '<h2 style="font-size:15px">Beras diterima</h2>' +
        '<label class="f">Berat beras (kg)<input id="fKg" class="fi big" inputmode="decimal" value="' + (F.kg === '' ? '' : String(F.kg).replace('.', ',')) + '"></label><p class="sub" style="margin:0" id="fKgHint"></p>' +
        '<label class="f">Uang tambahan (opsional, masuk UB)<input id="fTerima" class="fi" inputmode="numeric" data-rp value="' + (F.diterima ? nf(F.diterima) : '') + '"></label>';
    } else {
      el.innerHTML = '<div class="note ok">' + ICON.info + '<span>Dicatat <b>sudah zakat di kampung</b>. Tidak ada beras atau uang yang diterima amil.</span></div>';
    }
    var t = $('#fTerima');
    if (t) t.addEventListener('input', function () { F.diterima = Z.parseNum(t.value); upd(); });
    var k = $('#fKg');
    if (k) k.addEventListener('input', function () { F.kg = k.value === '' ? '' : Number(String(k.value).replace(',', '.')) || 0; upd(); });
    $$('input[name=tujuan]').forEach(function (r) { r.addEventListener('change', function () { F.tujuan = r.value; $$('#fTujuanW .radio').forEach(function (l) { l.classList.toggle('on', l.querySelector('input').checked); }); upd(); }); });
  }

  function upd() {
    var c = S.boot.config, harga = Number(c.Harga_Soq) || 0, kgSoq = Number(c.Kg_Per_Soq) || 2.7, n = totalJiwa();
    var jmN = Object.keys(F.jm).length, smN = Object.keys(F.sm).length;
    if ($('#fJmCount') && F.kk) $('#fJmCount').textContent = jmN + ' / ' + (F.kk.anggota.length + (F.pindah ? F.pindah.length : 0)) + ' dicentang';
    if ($('#fLuar')) $('#fLuar').textContent = F.luar;
    if ($('#fLuarNamaW')) $('#fLuarNamaW').classList.toggle('hidden', !F.luar);
    var label = [jmN ? jmN + ' JM' : '', smN ? smN + ' SM' : '', F.luar ? F.luar + ' JM luar' : ''].filter(Boolean).join(' + ') || '0 jiwa';
    $('#fJenisNote').textContent = F.jenis === 'BERAS' ? 'Beras: otomatis ' + n + ' × ' + kgf(kgSoq) + ' kg = ' + kgf(n * kgSoq) + ' kg (bisa dikoreksi).' :
      F.jenis === 'UANG' ? 'Titip uang: ' + rp(harga) + ' per jiwa (harga ' + c.Hijriah + ').' : 'Di kampung: dicatat sudah zakat, tanpa penerimaan.';
    var foot = label + ' · ';
    if (F.jenis === 'UANG') {
      var wajib = n * harga, ter = Number(F.diterima) || 0, sel = ter - wajib;
      $('#fSum').innerHTML = '<div><span class="sub">' + esc(label) + '</span><b>' + n + ' jiwa</b></div><div><span class="sub">× harga titip ' + esc(c.Hijriah) + '</span><b>' + rp(harga) + '</b></div><div class="t"><span>Wajib bayar</span><span>' + rp(wajib) + '</span></div>';
      var selEl = $('#fSel');
      if (F.diterima === '' || !ter) selEl.innerHTML = '';
      else if (sel > 0) selEl.innerHTML = '<div class="note blue"><b>Lebih bayar ' + rp(sel) + '</b></div>';
      else if (sel < 0) selEl.innerHTML = '<div class="note red"><b>Kurang bayar ' + rp(-sel) + '</b>&nbsp;— akan ditandai belum lunas</div>';
      else selEl.innerHTML = '<div class="note ok">' + ICON.check + '<b>Pas</b></div>';
      $('#fTujuanW').classList.toggle('hidden', !(sel > 0));
      foot += 'Titip uang</span><span>' + rp(wajib) + ' zakat' + (sel > 0 ? ' + ' + rp(sel) + (F.tujuan === 'UB' ? ' UB' : ' kembali') : sel < 0 && ter ? ' · kurang ' + rp(-sel) : '');
    } else if (F.jenis === 'BERAS') {
      var kg = F.kg === '' ? n * kgSoq : F.kg;
      if ($('#fKg') && F.kg === '') $('#fKg').placeholder = kgf(n * kgSoq);
      $('#fKgHint').textContent = 'Standar: ' + n + ' jiwa × ' + kgf(kgSoq) + ' kg = ' + kgf(n * kgSoq) + ' kg';
      foot += 'Beras</span><span>' + kgf(kg) + ' kg' + (F.diterima ? ' + ' + rp(F.diterima) + ' UB' : '');
    } else foot += 'Di kampung</span><span>tanpa penerimaan';
    if (F.fidyah.on && F.fidyah.nominal) foot += ' · fidyah ' + rp(F.fidyah.nominal);
    $('#fFoot').innerHTML = '<span>' + foot + '</span>';
  }

  ACT.jenis = function (el) { F.jenis = el.getAttribute('data-j'); $$('[data-act=jenis]').forEach(function (b) { var on = b === el; b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); }); renderBayar(); upd(); };
  ACT.luar = function (el) { F.luar = Math.max(0, F.luar + Number(el.getAttribute('data-d'))); upd(); };

  function saveF() {
    var c = S.boot.config;
    if (S.role === 'admin' && !F.idAmil) { Z.toast('Pilih amil yang menerima.', true); return; }
    if (!totalJiwa()) { Z.toast(F.mode === 'SM' ? 'Pilih simpatisan dulu.' : 'Centang minimal satu jiwa.', true); return; }
    if (F.jenis === 'UANG' && F.diterima === '') { Z.toast('Isi uang yang diterima.', true); $('#fTerima').focus(); return; }
    var nama = F.mode === 'KK' ? F.kk.nama : (F_smList.filter(function (m) { return m.id === F.smPilih; })[0] || {}).nama;
    var body = { tahun: c.Tahun, id: F.editId || undefined, idKeluarga: F.mode === 'KK' ? F.kk.id : '', namaMuzakki: nama,
      jm: Object.keys(F.jm), sm: Object.keys(F.sm), luar: F.luar, luarNama: F.luarNama, jenis: F.jenis,
      kg: F.jenis === 'BERAS' && F.kg !== '' ? F.kg : undefined, diterima: F.jenis === 'KAMPUNG' ? 0 : Number(F.diterima) || 0,
      tujuanLebih: F.tujuan, tanggal: F.tanggal, catatan: F.catatan, idAmil: F.idAmil,
      fidyah: F.fidyah.on ? { nominal: F.fidyah.nominal, hari: Z.parseNum(F.fidyah.hari) } : null };
    var form = $('#fForm'), btn = $('#fSave');
    Z.sibuk(form, true); btn.innerHTML = '<span class="spin"></span>Menyimpan…';
    api('simpanFitrah', body).then(function (r) {
      Z.toast('Setoran ' + nama + ' tersimpan' + (r.status === 'KURANG' ? ' (kurang bayar ' + rp(-r.selisih) + ')' : '') + '.');
      if (!F.editId) tandaiSudah(body, r);
      Z.go('#/amil');
    }).catch(function (e) { Z.sibuk(form, false); btn.textContent = F.editId ? 'Simpan perubahan' : 'Simpan setoran'; Z.fail(e); });
  }
  /**
   * Setelah simpan berhasil, daftar KK di HP langsung ditandai "sudah" tanpa menunggu server,
   * lalu data asli diambil di latar belakang (beranda tidak perlu "Memuat…" lagi).
   */
  function tandaiSudah(body, r) {
    var rc = Z.RC()[Z.rcKey('kkList')]; if (!rc) return;
    var d = rc.data, k = body.idKeluarga ? d.list.filter(function (x) { return x.id === body.idKeluarga; })[0] : null;
    if (k) {
      k.anggota.forEach(function (a) { if (body.jm.indexOf(a.id) >= 0) { a.sudah = true; a.idSetoran = r.id; } });
      (k.simpatisan || []).forEach(function (m) { if (body.sm.indexOf(m.id) >= 0) m.sudah = true; });
      k.sudah = k.anggota.filter(function (a) { return a.sudah; }).length;
      if (r.status === 'KURANG') k.kurangRp = (k.kurangRp || 0) - r.selisih;
      k.status = k.kurangRp ? 'KURANG' : k.sudah === 0 ? 'SEBAGIAN' : k.sudah < k.anggota.length ? 'SEBAGIAN' : 'SUDAH';
    }
    if (d.saya) {
      if (body.idKeluarga) d.saya.kk += 1;
      if (body.jenis !== 'KAMPUNG') d.saya.soq += body.jm.length + body.sm.length + (body.luar || 0);
      d.saya.uang += body.diterima || 0;
    }
    S.kk = d;
  }

  // ---------- modal simpatisan (dipakai juga di Konfigurasi) ----------
  ACT.smBaru = function (el) { Z.smModal({ idKeluarga: el.getAttribute('data-kk') || '' }, function (id) {
    if (!F) return;
    if (F.mode === 'KK') {
      return api('kkList').then(function (d) { S.kk = d; F.kk = d.list.filter(function (k) { return k.id === F.kk.id; })[0]; F.sm[id] = true; renderF(); });
    }
    return api('daftarSimpatisan').then(function (l) { F_smList = l; F.smPilih = id; F.sm = {}; F.sm[id] = true; renderF(); });
  }); };

  Z.smModal = function (sm, after) {
    sm = sm || {};
    var kkList = S.kk ? S.kk.list : null;
    var draw = function () {
      var kk = kkList ? kkList.filter(function (k) { return k.id === sm.idKeluarga; })[0] : null;
      Z.openModal('<div class="mh"><h2>' + (sm.id ? 'Ubah simpatisan' : 'Tambah simpatisan') + '</h2><button type="button" class="btn sm" data-act="close" aria-label="Tutup">' + ICON.x + '</button></div>' +
        '<label class="f">Nama lengkap<input id="smNama" class="fi" value="' + esc(sm.nama || '') + '"></label>' +
        '<label class="f">Jenis kelamin<select id="smJk" class="fi"><option value="">—</option><option value="L"' + (sm.jk === 'L' ? ' selected' : '') + '>Laki-laki</option><option value="P"' + (sm.jk === 'P' ? ' selected' : '') + '>Perempuan</option></select></label>' +
        '<label class="f">Terkait ke KK sensus<select id="smKK" class="fi"><option value="">Berdiri sendiri (tidak terkait KK)</option>' +
        (kkList || []).map(function (k) { return '<option value="' + esc(k.id) + '"' + (k.id === sm.idKeluarga ? ' selected' : '') + '>' + esc(k.nama) + ' · ' + k.jiwa + ' jiwa</option>'; }).join('') + '</select>' +
        '<span class="sub" style="font-weight:400">Pilih dari data sensus. Simpatisan terkait akan muncul di form setoran KK tersebut.</span></label>' +
        '<label class="f">Hubungan dengan KK<select id="smHub" class="fi">' + ['', 'Saudara jauh', 'Keponakan', 'Ipar', 'Orang tua / mertua', 'Asisten rumah tangga', 'Lainnya'].map(function (h) { return '<option' + (h === (sm.hubungan || '') ? ' selected' : '') + '>' + h + '</option>'; }).join('') + '</select></label>' +
        '<div class="fgrid"><label class="f">No HP (opsional)<input id="smHp" class="fi" type="tel" value="' + esc(sm.hp || '') + '"></label><label class="f">Catatan<input id="smCat" class="fi" value="' + esc(sm.catatan || '') + '"></label></div>' +
        '<div style="display:flex;gap:10px"><button type="button" class="btn" style="flex:1" data-act="close">Batal</button><button type="button" class="btn pri" style="flex:2" id="smSave">Simpan simpatisan</button></div>' +
        (sm.id && S.role === 'admin' ? '<button type="button" class="btn danger block" id="smHapus">Hapus simpatisan</button>' : ''));
      var bh = $('#smHapus');
      if (bh) bh.addEventListener('click', function () {
        if (!confirm('Hapus simpatisan ' + (sm.nama || '') + ' dari master? Riwayat setoran tahun lalu tetap tersimpan.')) return;
        var box = $('#modal .box'); Z.sibuk(box, true);
        api('hapusSimpatisan', { id: sm.id })
          .then(function (r) { Z.closeModal(); Z.toast('Simpatisan dihapus.'); if (after) after('', r.list); })
          .catch(function (e) { Z.sibuk(box, false); Z.fail(e); });
      });
      $('#smSave').addEventListener('click', function () {
        var box = $('#modal .box'); Z.sibuk(box, true);
        api('simpanSimpatisan', { sm: { id: sm.id, nama: $('#smNama').value, jk: $('#smJk').value, idKeluarga: $('#smKK').value, hubungan: $('#smHub').value, hp: $('#smHp').value, catatan: $('#smCat').value } })
          .then(function (r) { Z.closeModal(); Z.toast('Simpatisan tersimpan.'); if (after) after(r.id, r.list); })
          .catch(function (e) { Z.sibuk(box, false); Z.fail(e); });
      });
    };
    if (!kkList) api('kkList').then(function (d) { S.kk = d; kkList = d.list; draw(); }).catch(Z.fail); else draw();
  };

  // =====================================================================
  // FORM ZAKAT MAL / TIJAROH / FIDYAH
  // =====================================================================
  var M = null;
  Z.viewLain = function (q) {
    Z.loading();
    Promise.all([Z.ensureBoot(), q.edit ? api('getLain', { id: q.edit }) : null]).then(Z.jaga(function (r) {
      M = { jenis: q.jenis === 'FIDYAH' ? 'FIDYAH' : 'MAL', q: '', hasil: [], pilih: null, namaBebas: '', nominal: '', hari: '', cara: 'Transfer', tanggal: Z.today(), catatan: '', idAmil: S.idAmil || '', lampiran: '', id: '', tahun: S.boot.config.Tahun };
      var x = r[1];
      if (x) {
        M.id = x.ID; M.tahun = x.Tahun; M.jenis = x.Jenis; M.nominal = x.Nominal; M.hari = x.Hari_Fidyah ? String(x.Hari_Fidyah) : '';
        M.cara = x.Cara_Bayar || 'Transfer'; M.tanggal = x.Tanggal; M.catatan = x.Catatan || ''; M.idAmil = x.ID_Amil || ''; M.lampiran = x.Lampiran || '';
        if (x.Ref_Tipe === 'JM' || x.Ref_Tipe === 'SM') { M.pilih = { tipe: x.Ref_Tipe, id: x.Ref_ID, nama: x.Nama, idKeluarga: x.ID_Keluarga, info: x.Ref_Tipe === 'SM' ? 'Simpatisan' : 'Jamaah sensus' }; M.q = x.Nama; }
        else M.namaBebas = x.Nama;
      }
      renderM();
    })).catch(Z.fail);
  };
  function lampiranAuto() {
    var c = S.boot.config;
    if (M.jenis === 'FIDYAH') return '';
    if (S.role === 'admin' && M.lampiran) return M.lampiran;
    return (c.Tutup_Rekap_Mal && M.tanggal > c.Tutup_Rekap_Mal) || c.Status !== 'BUKA' ? 'SUSULAN' : 'UTAMA';
  }
  function renderM() {
    var b = S.boot, c = b.config, fid = M.jenis === 'FIDYAH';
    var color = fid ? 'pri' : 'blue';
    Z.app.innerHTML =
      '<header class="topbar" style="position:static"><div class="in" style="max-width:560px"><button type="button" class="btn sm" data-act="go" data-h="' + (M.id ? '#/setoran?tahun=' + M.tahun : '#/amil') + '" aria-label="Kembali" style="border:0;padding:0 6px">' + ICON.back + '</button>' +
      '<div style="display:flex;flex-direction:column;gap:2px;flex:1"><h1 style="font-size:18px;font-weight:800">' + (M.id ? 'Ubah setoran' : 'Setoran Zakat Lain') + '</h1><span class="sub">' + esc(c.Hijriah) + (S.nama ? ' · ' + esc(S.nama) : '') + '</span></div></div></header>' +
      '<form id="mForm" class="wrap narrow" style="padding-top:16px;gap:14px" novalidate>' +
      '<fieldset style="margin:0;border:0;padding:0"><legend class="sr">Jenis setoran</legend><div class="seg blue" style="grid-template-columns:repeat(2,1fr)">' +
      [['MAL', 'Zakat Mal'], ['TIJAROH', 'Tijaroh'], ['MAL_TIJAROH', 'Mal + Tijaroh'], ['FIDYAH', 'Fidyah']].map(function (j) { return '<button type="button" data-act="mJenis" data-j="' + j[0] + '" aria-pressed="' + (M.jenis === j[0]) + '"' + (M.jenis === j[0] ? ' class="on"' : '') + '>' + j[1] + '</button>'; }).join('') +
      '</div><p class="sub" style="margin:8px 2px 0">Pilih "Mal + Tijaroh" bila muzakki tidak menyebutkan rinciannya.</p></fieldset>' +
      '<div id="mLamp"></div>' +
      (S.role === 'admin' ? '<label class="f">Amil yang menerima<select id="mAmil" class="fi"><option value="">— tanpa amil / langsung admin —</option>' + b.amil.filter(function (a) { return a.aktif; }).map(function (a) { return '<option value="' + esc(a.id) + '"' + (a.id === M.idAmil ? ' selected' : '') + '>' + esc(a.nama) + '</option>'; }).join('') + '</select></label>' : '') +
      '<section class="card pad" style="gap:12px">' +
      '<label class="f">Muzakki (jamaah sensus atau simpatisan)<span class="search">' + ICON.search + '<input id="mQ" type="search" placeholder="Ketik minimal 2 huruf…" value="' + esc(M.q) + '"><button type="button" class="clr" data-act="hapusCari" aria-label="Hapus pencarian">' + ICON.x + '</button></span></label>' +
      '<div class="results" id="mRes" role="listbox" aria-label="Hasil pencarian"></div><div id="mPilih"></div><div id="mGanda" aria-live="polite"></div>' +
      '<label class="f">Atau tulis nama (muzakki di luar data)<input id="mNama" class="fi" value="' + esc(M.namaBebas) + '" placeholder="Opsional"></label>' +
      (fid ? '<label class="f">Jumlah hari fidyah<input id="mHari" class="fi" inputmode="numeric" value="' + esc(M.hari) + '"><span class="sub" style="font-weight:400">Tarif ' + esc(c.Hijriah) + ': ' + (c.Tarif_Fidyah ? rp(c.Tarif_Fidyah) + ' per hari' : 'belum diatur di Konfigurasi') + '</span></label>' : '') +
      '<label class="f">' + (fid ? 'Nominal fidyah' : 'Jumlah zakat') + '<span style="display:flex;align-items:center;gap:8px"><span style="font-weight:600;color:var(--muted)">Rp</span><input id="mNom" data-rp class="fi big" style="border-color:' + (fid ? 'var(--brand)' : 'var(--blue)') + '" inputmode="numeric" value="' + (M.nominal ? nf(M.nominal) : '') + '"></span></label>' +
      '<div class="fgrid"><label class="f">Tanggal<input id="mTgl" type="date" class="fi" value="' + esc(M.tanggal) + '"></label>' +
      '<label class="f">Cara bayar<select id="mCara" class="fi"><option' + (M.cara === 'Transfer' ? ' selected' : '') + '>Transfer</option><option' + (M.cara === 'Tunai' ? ' selected' : '') + '>Tunai</option></select></label></div>' +
      '<label class="f">Keterangan<input id="mCat" class="fi" placeholder="Opsional" value="' + esc(M.catatan) + '"></label></section>' +
      (fid ? '<div class="note ok">' + ICON.info + '<span>Fidyah dicatat terpisah dan tidak ikut pembagian 40/45/15.</span></div>' : '<section class="card pad" style="gap:8px" id="mPrev"></section>') +
      '<button type="submit" class="btn ' + color + ' block" id="mSave">' + (M.id ? 'Simpan perubahan' : 'Simpan') + '</button></form>';
    var on = function (id, ev, fn) { var el = $('#' + id); if (el) el.addEventListener(ev, fn); };
    var tm;
    on('mQ', 'input', function (e) { M.q = e.target.value; clearTimeout(tm); if (!M.q) { M.pilih = null; M.hasil = []; drawRes(); cekGanda(); return; } tm = setTimeout(cariM, 300); });
    on('mNama', 'input', function (e) { M.namaBebas = e.target.value; if (M.namaBebas) { M.pilih = null; M.hasil = []; drawRes(); } clearTimeout(gandaTm); gandaTm = setTimeout(cekGanda, 500); });
    on('mHari', 'input', function (e) { M.hari = e.target.value; var t = Number(c.Tarif_Fidyah) || 0; if (t) { M.nominal = Z.parseNum(M.hari) * t; $('#mNom').value = nf(M.nominal); } });
    on('mNom', 'input', function (e) { M.nominal = Z.parseNum(e.target.value); prevM(); });
    on('mTgl', 'change', function (e) { M.tanggal = e.target.value; lampM(); });
    on('mCara', 'change', function (e) { M.cara = e.target.value; });
    on('mCat', 'input', function (e) { M.catatan = e.target.value; });
    on('mAmil', 'change', function (e) { M.idAmil = e.target.value; });
    $('#mForm').addEventListener('submit', function (e) { e.preventDefault(); saveM(); });
    drawRes(); prevM(); lampM(); drawGanda();
    if (M.sudahAda === undefined) cekGanda();
  }
  /**
   * D-47: tampilkan setoran zakat lain orang ini di tahun yang sama, supaya dua petugas tidak mencatat ganda.
   * Jenis sama = peringatan merah; jenis lain = informasi. Pemeriksaan pasti tetap di server saat simpan.
   */
  var gandaTm, gandaKunci = '';
  var JL = { MAL: 'Zakat Mal', TIJAROH: 'Tijaroh', MAL_TIJAROH: 'Mal + Tijaroh', FIDYAH: 'Fidyah' };
  function cekGanda() {
    var nama = M.pilih ? M.pilih.nama : (M.namaBebas || '').trim(), refId = M.pilih ? M.pilih.id : '';
    var kunci = refId + '|' + nama.toLowerCase(); gandaKunci = kunci;
    if (!nama) { M.sudahAda = []; drawGanda(); return; }
    api('cekLain', { tahun: M.tahun, refId: refId, nama: nama, id: M.id || undefined }).then(function (list) {
      if (kunci !== gandaKunci) return; // sudah ganti orang
      M.sudahAda = list; drawGanda();
    }).catch(function () { /* info saja; pemeriksaan pasti di server */ });
  }
  function drawGanda() {
    var el = $('#mGanda'); if (!el) return;
    var list = M.sudahAda || [];
    if (!list.length) { el.innerHTML = ''; return; }
    var nama = M.pilih ? M.pilih.nama : M.namaBebas;
    var sama = list.filter(function (x) { return x.jenis === M.jenis; }), lain = list.filter(function (x) { return x.jenis !== M.jenis; });
    var baris = function (x) { return '<li>' + esc(JL[x.jenis] || x.jenis) + ' <b>' + rp(x.nominal) + '</b> · ' + esc(Z.tglId(x.tanggal)) + (x.amil ? ' · amil ' + esc(x.amil) : '') + (x.dicatat && x.dicatat !== x.amil ? ' · dicatat ' + esc(x.dicatat) : '') + '</li>'; };
    el.innerHTML = (sama.length ? '<div class="note red">' + ICON.info + '<span><b>Kemungkinan input ganda.</b> ' + esc(nama) + ' sudah tercatat ' + esc(JL[M.jenis]) + ' tahun ini:<ul style="margin:4px 0 0;padding-left:18px">' + sama.map(baris).join('') + '</ul>Simpan hanya bila ini setoran tambahan.</span></div>' : '') +
      (lain.length ? '<div class="note warn" style="margin-top:8px">' + ICON.info + '<span>Info: ' + esc(nama) + ' juga tercatat tahun ini:<ul style="margin:4px 0 0;padding-left:18px">' + lain.map(baris).join('') + '</ul></span></div>' : '');
  }
  function lampM() {
    var lp = lampiranAuto(), el = $('#mLamp'); if (!el) return;
    var c = S.boot.config;
    if (lp === 'SUSULAN') el.innerHTML = '<div class="note warn">' + ICON.info + '<span><b>Dicatat sebagai SUSULAN.</b> Rekap zakat mal ' + esc(c.Hijriah) + ' sudah ditutup' + (c.Tutup_Rekap_Mal ? ' ' + esc(Z.tglId(c.Tutup_Rekap_Mal)) : '') + '. Setoran ini masuk lampiran susulan dengan pembagian sendiri.</span></div>' +
      (S.role === 'admin' ? '<label class="check" style="border:0"><input type="checkbox" id="mForceUtama"><span class="nm"><b>Masukkan ke rekap utama</b><span>Khusus admin, bila setoran sebenarnya diterima sebelum rekap ditutup</span></span></label>' : '');
    else el.innerHTML = '';
    var f = $('#mForceUtama'); if (f) f.addEventListener('change', function () { M.lampiran = f.checked ? 'UTAMA' : ''; });
  }
  function cariM() {
    var q = (M.q || '').trim();
    if (q.length < 2) { M.hasil = []; M.mencari = false; drawRes(); return; }
    M.mencari = true; drawRes();
    Z.cariNama(q).then(function (r) {
      if ((M.q || '').trim() !== q) return; // sudah diketik ulang: abaikan hasil lama
      M.hasil = r; M.mencari = false; drawRes();
    }).catch(function (e) { M.mencari = false; drawRes(); Z.fail(e); });
  }
  function drawRes() {
    var el = $('#mRes'); if (!el) return;
    var pil = $('#mPilih');
    if (pil) pil.innerHTML = M.pilih && !M.hasil.length && !M.mencari ? '<div class="note ok">' + ICON.check + '<span>Terpilih: <b>' + esc(M.pilih.nama) + '</b> · ' + esc(M.pilih.info || '') + '. Ketik nama lain untuk mengganti.</span></div>' : '';
    if (M.mencari) { el.classList.remove('hidden'); el.innerHTML = '<p class="sub" style="padding:12px;margin:0"><span class="spin"></span>Mencari nama…</p>'; return; }
    if (!M.hasil.length) { el.classList.add('hidden'); el.innerHTML = ''; return; }
    el.classList.remove('hidden');
    var list = M.hasil.slice();
    el.innerHTML = list.map(function (x, i) {
      var on = M.pilih && M.pilih.id === x.id;
      return '<button type="button" role="option" aria-selected="' + !!on + '" class="' + (on ? 'on' : '') + '" data-act="mPick" data-i="' + i + '"><span class="nm"><b>' + esc(x.nama) + '</b><span>' + esc(x.info) + '</span></span>' + (x.tipe === 'SM' ? '<span class="chip blue">SM</span>' : '') + (on ? ICON.check : '') + '</button>';
    }).join('');
    el._list = list;
  }
  ACT.mPick = function (el) {
    var list = $('#mRes')._list; M.pilih = list[Number(el.getAttribute('data-i'))]; M.namaBebas = '';
    var n = $('#mNama'); if (n) n.value = '';
    // tutup daftar setelah memilih; muncul lagi bila nama diketik ulang
    M.hasil = []; M.q = M.pilih.nama; var qi = $('#mQ'); if (qi) qi.value = M.pilih.nama;
    drawRes(); cekGanda();
  };
  ACT.mJenis = function (el) { M.jenis = el.getAttribute('data-j'); renderM(); };
  function prevM() {
    var el = $('#mPrev'); if (!el) return;
    var c = S.boot.config, n = Number(M.nominal) || 0;
    var parts = [['Sabilillah Daerah', c.M_Sabilillah], ['Mustahiq (' + (c.M_Mustahiq_Ke || 'Daerah') + ')', c.M_Mustahiq], ['Amil Kelompok', c.M_AmilKlp], ['Amil Desa', c.M_AmilDesa], ['Amil Daerah', c.M_AmilDaerah]];
    el.innerHTML = '<h2 style="font-size:15px">Pratinjau pembagian</h2>' + parts.map(function (p) {
      return '<div style="display:flex;justify-content:space-between;font-size:14px;padding:4px 0;border-top:1px solid var(--line2)"><span style="color:var(--ink2)">' + esc(p[0]) + ' ' + nf(p[1]) + '%</span><b class="num">' + rp(n * p[1] / 100) + '</b></div>';
    }).join('');
  }
  function saveM(ganda) {
    var nama = M.pilih ? M.pilih.nama : (M.namaBebas || '').trim();
    if (!nama) { Z.toast('Pilih muzakki atau tulis namanya.', true); return; }
    if (!(M.nominal > 0)) { Z.toast('Isi nominal.', true); return; }
    var form = $('#mForm'), btn = $('#mSave');
    Z.sibuk(form, true); btn.innerHTML = '<span class="spin"></span>Menyimpan…';
    api('simpanLain', { id: M.id || undefined, tahun: M.tahun, jenis: M.jenis, nama: nama, refTipe: M.pilih ? M.pilih.tipe : 'LAIN', refId: M.pilih ? M.pilih.id : '', idKeluarga: M.pilih ? M.pilih.idKeluarga : '',
      nominal: M.nominal, hari: Z.parseNum(M.hari), caraBayar: M.cara, tanggal: M.tanggal, catatan: M.catatan, idAmil: M.idAmil, lampiran: M.lampiran || undefined, ganda: ganda || undefined })
      .then(function (r) { Z.toast((M.id ? 'Perubahan tersimpan' : 'Tersimpan') + (r.lampiran === 'SUSULAN' ? ' sebagai susulan' : '') + ': ' + nama + ' ' + rp(r.nominal) + '.'); Z.go(S.role === 'admin' ? '#/setoran?tahun=' + M.tahun : '#/amil'); })
      .catch(function (e) {
        Z.sibuk(form, false); btn.textContent = M.id ? 'Simpan perubahan' : 'Simpan';
        var msg = String(e && e.message || e);
        // D-47: server menemukan setoran jenis sama (termasuk yang baru disimpan petugas lain) → minta konfirmasi
        if (msg.indexOf('GANDA:') === 0) { if (confirm(msg.slice(6))) saveM(true); else cekGanda(); return; }
        Z.fail(e);
      });
  }
})();
