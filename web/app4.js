/* Mustahiq (D-35), laporan resmi & penandatangan (D-36). Admin & pengurus; amil tidak punya akses. */
(function () {
  'use strict';
  var Z = window.__Z, $ = Z.$, $$ = Z.$$, esc = Z.esc, rp = Z.rp, nf = Z.nf, kgf = Z.kgf, ICON = Z.ICON, S = Z.S, api = Z.api, ACT = Z.ACT;
  var ASNAF = [['FAKIR', 'Fakir'], ['MISKIN', 'Miskin'], ['GHORIM', 'Ghorim'], ['MUALAF', 'Mualaf'], ['IBNU_SABIL', 'Ibnu Sabil'], ['SABILILLAH', 'Sabilillah']];
  var ASNAF_LBL = {}; ASNAF.forEach(function (a) { ASNAF_LBL[a[0]] = a[1]; });
  var TTD_DEFAULT = ['KI KELOMPOK', 'KU KELOMPOK', 'MUBALIGH KELOMPOK', 'WK KELOMPOK', 'PNB KELOMPOK', 'PNB KELOMPOK', 'WK KU KELOMPOK', '', 'PNKB KELOMPOK'];

  function card(title, sub, body, right) {
    return '<section class="card"><div class="ch"><div class="tt"><h2>' + title + '</h2>' + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</div>' + (right || '') + '</div>' + body + '</section>';
  }
  function tahunSelect(id, cur) {
    return '<label class="f" style="font-size:12px;color:var(--muted)">Tahun<select id="' + id + '" class="fi" style="height:44px;font-weight:600">' +
      S.boot.tahunList.slice().reverse().map(function (t) { return '<option value="' + t.tahun + '"' + (t.tahun === cur ? ' selected' : '') + '>' + esc(t.hijriah) + ' / ' + t.tahun + (t.status === 'BUKA' ? ' · berjalan' : '') + '</option>'; }).join('') + '</select></label>';
  }
  function asnafOpt(sel) { return ASNAF.map(function (a) { return '<option value="' + a[0] + '"' + (a[0] === sel ? ' selected' : '') + '>' + a[1] + '</option>'; }).join(''); }
  /** Ambil data lewat cache halaman (Z.apiCepat) dan kembalikan versi terbaru. */
  function ambil(action, params) {
    var got; return Z.apiCepat(action, params, function (d) { got = d; }).then(function (d) { return d || got; });
  }
  function bolehRender() { var a = document.activeElement; return !(a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && Z.app.contains(a)); }

  // =====================================================================
  // MUSTAHIQ
  // =====================================================================
  var MU = null, MU_q = '', MU_kAll = false;
  Z.viewMustahiq = function (tahun) {
    Z.loading('Memuat daftar mustahiq…');
    var boot = Z.ensureBoot();
    boot.then(function () {
      var t = Number(tahun || S.tahun || S.boot.tahunAktif);
      return Z.apiCepat('daftarMustahiq', { tahun: t }, function (d, dariCache) {
        boot.then(Z.jaga(function () { MU = d; if (dariCache || bolehRender()) renderMustahiq(); }));
      });
    }).catch(Z.fail);
  };
  function segarMustahiq(d) { MU = d; renderMustahiq(); }

  function renderMustahiq() {
    var d = MU, admin = S.role === 'admin';
    var perJiwa = d.jiwa ? d.pool / d.jiwa : 0;
    var html = '<div class="wrap"><div class="head"><div class="t"><h1>Mustahiq Zakat Fitrah ' + esc(d.hijriah) + '</h1>' +
      '<p>Penerima bagian mustahiq kelompok · dibagi rata per jiwa · soq bulat per KK, total selalu pas</p></div>' + tahunSelect('muTahun', d.tahun) +
      '<a class="btn noprint" href="#/laporan?jenis=mustahiq&amp;tahun=' + d.tahun + '">Cetak daftar mustahiq</a>' +
      '<a class="btn noprint" href="#/laporan?jenis=serah&amp;tahun=' + d.tahun + '">Lembar penyerahan</a></div>' +
      (!d.bagi ? '<div class="note warn">' + ICON.info + '<span>Tujuan bagian Mustahiq zakat fitrah tahun ini adalah <b>' + esc(d.ke) + '</b>, sehingga tidak dibagi di kelompok. Ubah di Konfigurasi bila perlu.</span></div>' :
        d.sementara ? '<div class="note warn">' + ICON.clock + '<span><b>Angka sementara</b> sampai batas zakat fitrah' + (d.batasFitrah ? ' (' + esc(Z.tglId(d.batasFitrah.replace(' ', 'T'))) + ')' : '') + '. Bagian mustahiq masih bertambah selama penerimaan dibuka. Sebaiknya beras diserahkan setelah batas.</span></div>' : '') +
      '<section class="grid kpis" aria-label="Angka utama">' +
      '<div class="kpi dark"><span class="l">Bagian mustahiq (' + nf(d.pool && d.soqDiterima ? Math.round(d.pool * 100 / d.soqDiterima) : 45) + '%)</span><span class="v num">' + nf(d.pool) + ' soq</span><span class="h">' + kgf(d.poolKg) + ' kg beras · dari ' + nf(d.soqDiterima) + ' soq diterima</span></div>' +
      kpi('Jiwa mustahiq', nf(d.jiwa) + ' jiwa', d.grup.length + ' KK penerima' + (d.grup.filter(function (g) { return g.tipe === 'LUAR'; }).length ? ' · ' + d.grup.filter(function (g) { return g.tipe === 'LUAR'; }).length + ' luar sensus' : '')) +
      kpi('Acuan per jiwa', nf(perJiwa, 2) + ' soq', '±' + kgf(perJiwa * d.kgSoq) + ' kg · dibulatkan per KK') +
      kpi('Sudah diserahkan', d.serahKK + ' / ' + d.grup.length + ' KK', nf(d.serahSoq) + ' dari ' + nf(d.pool) + ' soq') + '</section>' +
      (admin && d.kandidat ? kandidatCard(d) : '') +
      daftarCard(d, admin) + '</div>';
    Z.app.innerHTML = html;
    $('#muTahun').addEventListener('change', function (e) { S.tahun = Number(e.target.value); Z.viewMustahiq(S.tahun); });
    var q = $('#muQ'); if (q) q.addEventListener('input', function () { MU_q = q.value; $('#muTbl').innerHTML = daftarRows(MU, admin); });
  }
  function kpi(l, v, h) { return '<div class="kpi"><span class="l">' + esc(l) + '</span><span class="v num">' + v + '</span><span class="h">' + h + '</span></div>'; }

  function kandidatCard(d) {
    var rows = []; d.kandidat.forEach(function (k) { k.anggota.forEach(function (a) { rows.push({ k: k, a: a }); }); });
    if (!rows.length) return card('Kandidat dari sensus', 'Semua jamaah bertanda "Perlu Dibantu" sudah masuk daftar', '', '<span class="chip warn">Hanya admin</span>');
    var tampil = MU_kAll ? rows : rows.slice(0, 12);
    return card('Kandidat dari sensus', rows.length + ' jamaah bertanda "Perlu Dibantu" belum masuk daftar · centang sesuai hasil musyawarah pengurus',
      '<div>' + tampil.map(function (x) {
        return '<div style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;padding:8px 20px;border-top:1px solid var(--line2)">' +
          '<label class="check" style="border:0;flex:1 1 280px;padding:0"><input type="checkbox" data-kand="' + esc(x.a.id) + '"><span class="nm"><b>' + esc(x.a.nama) + '</b><span>' +
          esc((x.k.id.indexOf('TANPA-KK-') === 0 ? 'Tanpa KK' : 'KK ' + x.k.nama) + (x.a.umur !== '' && x.a.umur !== null && x.a.umur !== undefined ? ' · ' + x.a.umur + ' th' : '') + (x.a.keberadaan ? ' · ' + x.a.keberadaan : '')) + '</span></span></label>' +
          '<label class="f" style="flex-direction:row;align-items:center;gap:8px;font-size:13px">Asnaf<select class="fi" style="height:40px;width:auto" data-kand-asnaf="' + esc(x.a.id) + '">' + asnafOpt('MISKIN') + '</select></label></div>';
      }).join('') + '</div>' +
      '<div class="foot" style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">' +
      (rows.length > 12 ? '<button type="button" class="btn sm" data-act="muKandAll">' + (MU_kAll ? 'Tampilkan 12 saja' : 'Tampilkan semua ' + rows.length) + '</button>' : '') +
      '<span style="flex:1"></span><button type="button" class="btn pri" data-act="muTambahKand">Tambahkan yang dicentang</button></div>',
      '<span class="chip warn">Hanya admin</span>');
  }
  ACT.muKandAll = function () { MU_kAll = !MU_kAll; renderMustahiq(); };
  ACT.muTambahKand = function (el) {
    var items = $$('[data-kand]').filter(function (c) { return c.checked; }).map(function (c) {
      var id = c.getAttribute('data-kand'); return { refId: id, asnaf: $('[data-kand-asnaf="' + id + '"]').value };
    });
    if (!items.length) { Z.toast('Centang minimal satu jamaah.', true); return; }
    var sec = el.closest('section'); Z.sibuk(sec, true);
    api('simpanMustahiq', { tahun: MU.tahun, op: 'tambah', items: items })
      .then(function (d) { Z.toast(items.length + ' jiwa ditambahkan ke daftar mustahiq.'); segarMustahiq(d); })
      .catch(function (e) { Z.sibuk(sec, false); Z.fail(e); });
  };

  function daftarCard(d, admin) {
    var kanan = admin ? '<div style="display:flex;gap:8px;flex-wrap:wrap"><button type="button" class="btn sm" data-act="muCari">' + ICON.plus + 'Cari jamaah sensus</button>' +
      '<button type="button" class="btn pri sm" data-act="muLuar" data-id="">' + ICON.plus + 'Penerima luar sensus</button></div>' : '';
    return card('Daftar mustahiq ' + esc(d.hijriah), nf(d.jiwa) + ' jiwa · ' + d.grup.length + ' KK penerima · 1 soq = ' + kgf(d.kgSoq) + ' kg',
      '<div style="padding:12px 20px;border-top:1px solid var(--line2)"><label class="search" style="max-width:420px;height:44px">' + ICON.search + '<span class="sr">Cari penerima</span>' +
      '<input id="muQ" type="search" placeholder="Cari nama penerima atau KK…" value="' + esc(MU_q) + '"><button type="button" class="clr" data-act="hapusCari" aria-label="Hapus pencarian">' + ICON.x + '</button></label></div>' +
      '<div class="tbl"><table><thead><tr><th>Keluarga / penerima</th><th>Jiwa mustahiq &amp; asnaf</th><th class="r">Jiwa</th><th class="r">Soq</th><th class="r">Kg</th><th>Penyerahan</th></tr></thead><tbody id="muTbl">' + daftarRows(d, admin) + '</tbody></table></div>' +
      '<div class="note ok" style="margin:0;border-radius:0 0 18px 18px">' + ICON.check + '<span>Pembulatan otomatis per KK (sisa terbesar): jumlah soq semua KK selalu sama dengan bagian mustahiq.' + (admin ? ' Klik nama penerima untuk mengubah asnaf atau mengeluarkan dari daftar.' : '') + '</span></div>', kanan);
  }
  function daftarRows(d, admin) {
    var q = MU_q.toLowerCase().trim();
    var rows = d.grup.filter(function (g) { return !q || g.nama.toLowerCase().indexOf(q) >= 0 || g.anggota.some(function (a) { return a.nama.toLowerCase().indexOf(q) >= 0; }); });
    if (!d.grup.length) return '<tr><td colspan="6" class="sub" style="padding:18px 20px">Belum ada mustahiq tahun ini.' + (admin ? ' Tambahkan dari kandidat sensus, cari jamaah, atau penerima luar sensus.' : '') + '</td></tr>';
    var sub = { KK: 'KK sensus', TANPA_KK: 'Tanpa KK (perantau/mandiri)', LUAR: 'Luar sensus' };
    return rows.map(function (g) {
      var orang = g.anggota.map(function (a) {
        var isi = (a.kepala && g.tipe === 'KK' ? '<b>' + esc(a.nama) + '</b>' : esc(a.nama)) + (a.jiwa > 1 ? ' (' + a.jiwa + ' jiwa)' : '') + ' <span class="chip purple" style="padding:2px 8px;font-size:11px">' + esc(ASNAF_LBL[a.asnaf] || a.asnaf) + '</span>';
        return admin ? '<button type="button" class="chip" style="border:1px solid var(--line);background:var(--bg);cursor:pointer;min-height:32px" data-act="muUbah" data-id="' + esc(a.id) + '" aria-label="Ubah ' + esc(a.nama) + '">' + isi + '</button>'
          : '<span class="chip" style="border:1px solid var(--line);background:var(--bg)">' + isi + '</span>';
      }).join(' ');
      var serah;
      if (g.berubah) serah = '<span class="chip warn">Berubah: diserahkan ' + nf(g.serah.soq) + ' soq, sekarang ' + nf(g.soq) + '</span>' + (admin ? ' <button type="button" class="btn sm" data-act="muSerah" data-k="' + esc(g.id) + '">Tandai ulang</button>' : '');
      else if (g.serah) serah = '<span class="chip ok">' + ICON.check + 'Diserahkan ' + esc(Z.tglId(g.serah.tanggal)) + ' · ' + nf(g.serah.soq) + ' soq</span>' + (admin ? ' <button type="button" class="btn sm" data-act="muBatal" data-k="' + esc(g.id) + '" data-nama="' + esc(g.nama) + '">Batal</button>' : '');
      else serah = admin && d.bagi ? '<button type="button" class="btn sm" style="border-color:var(--brand);color:var(--brand)" data-act="muSerah" data-k="' + esc(g.id) + '">Tandai diserahkan</button>' : '<span class="sub">Belum diserahkan</span>';
      return '<tr><td style="white-space:nowrap"><b>' + esc(g.nama) + '</b><span class="sub" style="display:block;font-size:12px">' + sub[g.tipe] + '</span></td>' +
        '<td><div style="display:flex;flex-wrap:wrap;gap:6px">' + orang + '</div></td><td class="r num">' + g.jiwa + '</td>' +
        '<td class="r num" style="font-weight:800;color:var(--brand)">' + nf(g.soq) + '</td><td class="r num">' + kgf(g.kg) + '</td><td style="white-space:nowrap">' + serah + '</td></tr>';
    }).join('') +
      '<tr class="tot"><td>Total</td><td class="sub">acuan ' + nf(d.jiwa ? d.pool / d.jiwa : 0, 2) + ' soq per jiwa</td><td class="r num">' + nf(d.jiwa) + '</td><td class="r num">' + nf(d.pool) + '</td><td class="r num">' + kgf(d.poolKg) + '</td><td class="sub">' + d.serahKK + ' dari ' + d.grup.length + ' KK diserahkan</td></tr>';
  }
  function anggotaById(id) { var hit = null; MU.grup.forEach(function (g) { g.anggota.forEach(function (a) { if (a.id === id) hit = { g: g, a: a }; }); }); return hit; }
  function simpanMu(box, body, pesan) {
    Z.sibuk(box, true);
    return api('simpanMustahiq', Object.assign({ tahun: MU.tahun }, body))
      .then(function (d) { Z.closeModal(); Z.toast(pesan); segarMustahiq(d); })
      .catch(function (e) { Z.sibuk(box, false); Z.fail(e); });
  }
  ACT.muUbah = function (el) {
    var x = anggotaById(el.getAttribute('data-id')); if (!x) return;
    var luar = x.g.tipe === 'LUAR';
    Z.openModal('<div class="mh"><h2>Ubah penerima</h2><button type="button" class="btn sm" data-act="close" aria-label="Tutup">' + ICON.x + '</button></div>' +
      (luar ? '<label class="f">Nama penerima / kepala keluarga<input id="muNama" class="fi" value="' + esc(x.a.nama) + '"></label>' +
        '<label class="f">Jumlah jiwa<input id="muJiwa" class="fi" inputmode="numeric" value="' + x.a.jiwa + '"></label>'
        : '<p class="sub" style="margin:0"><b style="color:var(--ink)">' + esc(x.a.nama) + '</b> · KK ' + esc(x.g.nama) + '</p>') +
      '<label class="f">Asnaf<select id="muAsnaf" class="fi">' + asnafOpt(x.a.asnaf) + '</select></label>' +
      '<label class="f">Catatan<input id="muCat" class="fi" value="' + esc(x.a.catatan) + '" placeholder="Opsional"></label>' +
      '<div style="display:flex;gap:10px"><button type="button" class="btn danger" style="flex:1" id="muKeluar">Keluarkan dari daftar</button><button type="button" class="btn pri" style="flex:1" id="muSimpan">Simpan</button></div>');
    var box = $('#modal .box');
    $('#muSimpan').addEventListener('click', function () {
      var body = { op: 'ubah', id: x.a.id, asnaf: $('#muAsnaf').value, catatan: $('#muCat').value };
      if (luar) { body.nama = $('#muNama').value; body.jiwa = Z.parseNum($('#muJiwa').value); }
      simpanMu(box, body, 'Penerima diperbarui.');
    });
    $('#muKeluar').addEventListener('click', function () {
      if (!confirm('Keluarkan ' + x.a.nama + ' dari daftar mustahiq ' + MU.hijriah + '?')) return;
      simpanMu(box, { op: 'hapus', id: x.a.id }, x.a.nama + ' dikeluarkan dari daftar.');
    });
  };
  ACT.muLuar = function () {
    Z.openModal('<div class="mh"><h2>Tambah penerima luar sensus</h2><button type="button" class="btn sm" data-act="close" aria-label="Tutup">' + ICON.x + '</button></div>' +
      '<p class="sub" style="margin:0">Untuk mustahiq yang tidak ada di sensus BBK02 (mis. musafir, mualaf, warga sekitar), sesuai musyawarah pengurus.</p>' +
      '<label class="f">Nama penerima / kepala keluarga<input id="muNama" class="fi"></label>' +
      '<div class="fgrid"><label class="f">Jumlah jiwa<input id="muJiwa" class="fi" inputmode="numeric" value="1"></label><label class="f">Asnaf<select id="muAsnaf" class="fi">' + asnafOpt('IBNU_SABIL') + '</select></label></div>' +
      '<label class="f">Catatan<input id="muCat" class="fi" placeholder="Opsional"></label>' +
      '<div class="sum" id="muPerk"></div>' +
      '<div style="display:flex;gap:10px"><button type="button" class="btn" style="flex:1" data-act="close">Batal</button><button type="button" class="btn pri" style="flex:2" id="muSimpan">Simpan penerima</button></div>');
    var box = $('#modal .box'), perJiwa = MU.jiwa ? MU.pool / MU.jiwa : 0;
    var upd = function () { var n = Z.parseNum($('#muJiwa').value) || 0; $('#muPerk').innerHTML = MU.bagi && perJiwa ? '<span>Perkiraan bagian: ' + n + ' jiwa × ' + nf(perJiwa, 2) + ' soq ≈ <b>' + nf(n * perJiwa, 1) + ' soq</b>. Angka pasti dihitung ulang untuk semua KK setelah disimpan.</span>' : ''; };
    $('#muJiwa').addEventListener('input', upd); upd();
    $('#muSimpan').addEventListener('click', function () {
      simpanMu(box, { op: 'luar', nama: $('#muNama').value, jiwa: Z.parseNum($('#muJiwa').value), asnaf: $('#muAsnaf').value, catatan: $('#muCat').value }, 'Penerima luar sensus ditambahkan.');
    });
  };
  ACT.muCari = function () {
    Z.openModal('<div class="mh"><h2>Tambah jamaah sensus</h2><button type="button" class="btn sm" data-act="close" aria-label="Tutup">' + ICON.x + '</button></div>' +
      '<label class="f">Cari nama jamaah<span class="search">' + ICON.search + '<input id="muCq" type="search" placeholder="Ketik minimal 2 huruf…"><button type="button" class="clr" data-act="hapusCari" aria-label="Hapus pencarian">' + ICON.x + '</button></span></label>' +
      '<div class="results hidden" id="muCres"></div><div id="muCpilih"></div>' +
      '<label class="f">Asnaf<select id="muAsnaf" class="fi">' + asnafOpt('MISKIN') + '</select></label>' +
      '<button type="button" class="btn pri block" id="muSimpan">Tambahkan ke daftar</button>');
    var box = $('#modal .box'), pilih = null, tm;
    var sudah = {}; MU.grup.forEach(function (g) { g.anggota.forEach(function (a) { if (a.refId) sudah[a.refId] = 1; }); });
    $('#muCq').addEventListener('input', function (e) {
      clearTimeout(tm); var q = e.target.value.trim(), el = $('#muCres');
      if (!q) { pilih = null; $('#muCpilih').innerHTML = ''; }
      if (q.length < 2) { el.classList.add('hidden'); return; }
      el.classList.remove('hidden'); el.innerHTML = '<p class="sub" style="padding:12px;margin:0"><span class="spin"></span>Mencari nama di sensus…</p>';
      tm = setTimeout(function () {
        Z.cariNama(q).then(function (r) {
          if (!$('#muCq') || $('#muCq').value.trim() !== q) return;
          r = r.filter(function (x) { return x.tipe === 'JM'; });
          el.innerHTML = r.length ? r.map(function (x, k) {
            return sudah[x.id] ? '<button type="button" class="done" disabled><span class="nm"><b>' + esc(x.nama) + '</b><span>' + esc(x.info) + '</span></span><span class="chip ok">Sudah di daftar</span></button>'
              : '<button type="button" data-k="' + k + '"><span class="nm"><b>' + esc(x.nama) + '</b><span>' + esc(x.info) + '</span></span></button>';
          }).join('') : '<p class="sub" style="padding:12px;margin:0">Nama tidak ditemukan di sensus.</p>';
          $$('button[data-k]', el).forEach(function (b) { b.addEventListener('click', function () {
            pilih = r[Number(b.getAttribute('data-k'))]; $('#muCq').value = pilih.nama; el.classList.add('hidden');
            $('#muCpilih').innerHTML = '<div class="note ok">' + ICON.check + '<span>Terpilih: <b>' + esc(pilih.nama) + '</b> · ' + esc(pilih.info) + '</span></div>';
          }); });
        }).catch(function (er) { el.classList.add('hidden'); Z.fail(er); });
      }, 300);
    });
    $('#muSimpan').addEventListener('click', function () {
      if (!pilih) { Z.toast('Pilih jamaah dari hasil pencarian.', true); return; }
      simpanMu(box, { op: 'tambah', items: [{ refId: pilih.id, asnaf: $('#muAsnaf').value }] }, pilih.nama + ' ditambahkan ke daftar mustahiq.');
    });
  };
  function serah(el, batal) {
    var k = el.getAttribute('data-k');
    if (batal && !confirm('Batalkan tanda diserahkan untuk ' + el.getAttribute('data-nama') + '?')) return;
    var row = el.closest('tr'); Z.sibuk(row, true);
    api('serahMustahiq', { tahun: MU.tahun, idKeluarga: k, batal: !!batal, tanggal: Z.today() })
      .then(function (d) { Z.toast(batal ? 'Tanda diserahkan dibatalkan.' : 'Ditandai sudah diserahkan.'); segarMustahiq(d); })
      .catch(function (e) { Z.sibuk(row, false); Z.fail(e); });
  }
  ACT.muSerah = function (el) { serah(el, false); };
  ACT.muBatal = function (el) { serah(el, true); };

  /** Kartu kecil "Penyaluran mustahiq" di Pemantauan (admin & pengurus). */
  Z.kartuMustahiq = function (tahun) {
    if (S.role === 'amil') return;
    ambil('daftarMustahiq', { tahun: tahun }).then(function (d) {
      var el = $('#dMustahiq'); if (!el || !d) return;
      el.innerHTML = card('Penyaluran mustahiq', d.jiwa ? nf(d.jiwa) + ' jiwa · ' + d.grup.length + ' KK penerima' : 'Daftar mustahiq ' + esc(d.hijriah) + ' belum diisi',
        '<div style="padding:4px 20px 18px;display:flex;flex-direction:column;gap:8px">' +
        (d.jiwa ? '<div style="display:flex;justify-content:space-between;font-size:14px"><span>KK sudah diserahkan</span><b class="num">' + d.serahKK + ' / ' + d.grup.length + '</b></div>' +
          '<div class="bar" role="img" aria-label="Diserahkan ' + d.serahKK + ' dari ' + d.grup.length + ' KK"><i style="width:' + (d.grup.length ? d.serahKK * 100 / d.grup.length : 0) + '%"></i></div>' +
          '<span class="sub">' + nf(d.serahSoq) + ' dari ' + nf(d.pool) + ' soq bagian mustahiq sudah diserahkan</span>' : '<span class="sub">Admin menetapkan daftar penerima di menu Mustahiq.</span>') + '</div>',
        '<a class="btn sm noprint" href="#/mustahiq?tahun=' + d.tahun + '">Buka Mustahiq</a>');
    }).catch(function () { /* kartu opsional */ });
  };

  // =====================================================================
  // PENANDATANGAN (Konfigurasi)
  // =====================================================================
  function ttdList(c) {
    try { var x = JSON.parse(c.Penandatangan || ''); if (x && x.length !== undefined) return x; } catch (e) { /* default */ }
    return TTD_DEFAULT.map(function (j) { return { jabatan: j, nama: '' }; });
  }
  Z.ttdCard = function (c) {
    var list = ttdList(c);
    return card('Penandatangan laporan · ' + esc(c.Hijriah), 'Dipakai di semua laporan cetak tahun ini. Urutan = posisi di laporan (3 per baris). Jabatan kosong = posisi kosong. Disalin saat membuat tahun baru.',
      '<div id="ttdRows" style="display:flex;flex-direction:column;gap:8px;padding:4px 20px 12px">' + list.map(ttdRow).join('') + '</div>' +
      '<div class="foot" style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn" style="border-style:dashed" data-act="ttdTambah">' + ICON.plus + 'Tambah penandatangan</button>' +
      '<span style="flex:1"></span><button type="button" class="btn pri" data-act="ttdSimpan" data-tahun="' + c.Tahun + '">Simpan penandatangan</button></div>');
  };
  function ttdRow(t, i) {
    return '<div class="ttd-row" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) 44px;gap:8px;align-items:end">' +
      '<label class="f" style="font-size:12px">Jabatan<input class="fi" data-ttd="jabatan" value="' + esc(t.jabatan) + '" placeholder="(posisi kosong)"></label>' +
      '<label class="f" style="font-size:12px">Nama<input class="fi" data-ttd="nama" value="' + esc(t.nama) + '"></label>' +
      '<button type="button" class="btn sm" style="height:44px" data-act="ttdHapus" aria-label="Hapus baris penandatangan">' + ICON.x + '</button></div>';
  }
  ACT.ttdTambah = function () { $('#ttdRows').insertAdjacentHTML('beforeend', ttdRow({ jabatan: '', nama: '' })); };
  ACT.ttdHapus = function (el) { el.closest('.ttd-row').remove(); };
  ACT.ttdSimpan = function (el) {
    var list = $$('#ttdRows .ttd-row').map(function (r) { return { jabatan: $('[data-ttd=jabatan]', r).value, nama: $('[data-ttd=nama]', r).value }; });
    var sec = el.closest('section'); Z.sibuk(sec, true);
    api('simpanPenandatangan', { tahun: Number(el.getAttribute('data-tahun')), list: list })
      .then(function () { Z.sibuk(sec, false); Z.toast('Penandatangan laporan tersimpan.'); })
      .catch(function (e) { Z.sibuk(sec, false); Z.fail(e); });
  };

  // =====================================================================
  // LAPORAN RESMI (cetak / simpan PDF) — format mengikuti laporan pemilik 2025 (D-36)
  // =====================================================================
  var JENIS_LAP = [['fitrah', 'Muzakki Zakat Fitrah'], ['mal', 'Zakat Mal · Lampiran Utama'], ['susulan', 'Zakat Mal · Lampiran Susulan'], ['mustahiq', 'Daftar Mustahiq'], ['serah', 'Lembar Penyerahan Mustahiq']];
  var LP = { jenis: 'fitrah' };
  Z.viewLaporan = function (q) {
    LP.jenis = q.jenis || LP.jenis;
    Z.loading('Menyiapkan laporan…');
    Z.ensureBoot().then(function () {
      var t = Number(q.tahun || S.tahun || S.boot.tahunAktif); LP.tahun = t;
      var butuh = LP.jenis === 'mustahiq' || LP.jenis === 'serah' ? [ambil('daftarMustahiq', { tahun: t }), ambil('dashboard', { tahun: t })]
        : [ambil('daftarSetoran', { tahun: t }), ambil('dashboard', { tahun: t })];
      return Promise.all(butuh);
    }).then(Z.jaga(function (r) { renderLaporan(r[0], r[1]); })).catch(Z.fail);
  };
  function renderLaporan(data, dash) {
    var land = LP.jenis === 'fitrah';
    var isi = LP.jenis === 'fitrah' ? lapFitrah(data, dash) : LP.jenis === 'mal' || LP.jenis === 'susulan' ? lapMal(data, dash, LP.jenis === 'susulan' ? 'SUSULAN' : 'UTAMA')
      : LP.jenis === 'mustahiq' ? lapMustahiq(data, dash) : lapSerah(data, dash);
    Z.app.innerHTML = '<div class="wrap"><div class="head noprint"><div class="t"><h1>Laporan</h1><p>Format laporan resmi kelompok · tekan Cetak lalu pilih "Simpan sebagai PDF" untuk berkas PDF</p></div>' +
      tahunSelect('lpTahun', LP.tahun) + '<button type="button" class="btn pri" onclick="window.print()">Cetak / Simpan PDF</button></div>' +
      '<div class="filters noprint" role="group" aria-label="Jenis laporan">' + JENIS_LAP.map(function (j) {
        return '<button type="button" data-act="lpJenis" data-j="' + j[0] + '" aria-pressed="' + (LP.jenis === j[0]) + '"' + (LP.jenis === j[0] ? ' class="on"' : '') + '>' + j[1] + '</button>';
      }).join('') + '</div>' +
      '<p class="sub noprint" style="margin:0">Kertas A4 ' + (land ? 'mendatar (landscape)' : 'tegak') + '. Penandatangan diatur admin di Konfigurasi.</p>' +
      '<div class="lap-scroll"><div class="lap' + (land ? ' land' : '') + '">' + isi + '</div></div></div>';
    var st = $('#lapPage') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'lapPage' }));
    st.textContent = '@page{size:A4 ' + (land ? 'landscape' : 'portrait') + ';margin:10mm}';
    $('#lpTahun').addEventListener('change', function (e) { S.tahun = Number(e.target.value); Z.go('#/laporan?jenis=' + LP.jenis + '&tahun=' + S.tahun); });
  }
  ACT.lpJenis = function (el) { Z.go('#/laporan?jenis=' + el.getAttribute('data-j') + '&tahun=' + LP.tahun); };

  function wilayah() { return S.boot.wilayah || { no: '', desa: '', daerah: '' }; }
  function namaKelompok() { return String(S.boot.kelompok || '').replace(/^Kelompok\s+/i, ''); }
  function ttdBlok(list) {
    return '<div class="ttd">' + (list || []).map(function (t) { return '<div><span>' + esc(String(t.jabatan).toUpperCase()) + '</span><b>' + esc(String(t.nama).toUpperCase()) + '</b></div>'; }).join('') + '</div>';
  }
  function rpTitik(n) { return nf(n); }

  function lapFitrah(rows, dash) {
    var J = { BERAS: 'Beras', UANG: 'Titip Uang', KAMPUNG: 'Zakat di Kampung' };
    var list = rows.filter(function (r) { return r.kelas === 'FITRAH'; }).sort(function (a, b) { return a.nama.localeCompare(b.nama, 'id'); });
    var t = { jm: 0, luar: 0, sm: 0, tot: 0, kampung: 0 };
    var body = list.map(function (r, i) {
      var tot = r.jiwa.jm + r.jiwa.luar + r.jiwa.sm;
      if (r.jenis === 'KAMPUNG') t.kampung += tot; else { t.jm += r.jiwa.jm; t.luar += r.jiwa.luar; t.sm += r.jiwa.sm; t.tot += tot; }
      return '<tr><td class="c">' + (i + 1) + '</td><td>' + esc(r.nama) + '</td><td>' + esc(r.amil) + '</td><td class="c">' + (r.jiwa.jm || '') + '</td><td class="c">' + (r.jiwa.luar || '') + '</td><td class="c">' + (r.jiwa.sm || '') + '</td><td class="r">' + tot + '</td>' +
        '<td' + (r.jenis === 'UANG' ? ' style="color:#1D4ED8"' : '') + '>' + J[r.jenis] + '</td></tr>';
    }).join('');
    var pf = {}; (dash.pembagianFitrah || []).forEach(function (p) { pf[p.key] = p; });
    var pb = function (k) { return pf[k] || { pct: 0, soq: 0 }; };
    var amilPct = pb('amilKlp').pct + pb('amilDesa').pct + pb('amilDaerah').pct;
    return '<h3 class="c">MUZAKKI ZAKAT FITRAH ' + esc(dash.hijriah) + ' / ' + dash.tahun + ' M<br>' + esc(namaKelompok().toUpperCase()) + ' - ' + esc(wilayah().daerah.toUpperCase()) + '</h3>' +
      '<table><thead><tr><th rowspan="2">No</th><th rowspan="2">Nama</th><th rowspan="2">Amil Yang Menerima</th><th colspan="4">Jumlah Soq</th><th rowspan="2">Jenis Titipan<br>(Beras/ Uang)</th></tr>' +
      '<tr><th>JM BBK</th><th>JM LUAR TITIP ZAKAT</th><th>SM</th><th>TOTAL (Soq)</th></tr></thead><tbody>' + (body || '<tr><td colspan="8" class="c">Belum ada setoran.</td></tr>') +
      '<tr class="b"><td></td><td colspan="2" class="r">Jamaah + SM yg Zakat (- Zakat di Kampung)</td><td class="c">' + t.jm + '</td><td class="c">' + (t.luar || '-') + '</td><td class="c">' + t.sm + '</td><td class="r">' + t.tot + '</td><td>' + (t.kampung ? '+ ' + t.kampung + ' jiwa zakat di kampung' : '') + '</td></tr></tbody></table>' +
      '<div class="lap-bawah"><table style="width:auto;min-width:330px"><thead><tr><th colspan="2" class="kiri">PEMBAGIAN ZAKAT FITRAH</th><th>SOK</th></tr></thead><tbody>' +
      '<tr><td class="c">' + nf(pb('sabilillah').pct) + '%</td><td>SABILILLAH DAERAH</td><td class="c">' + pb('sabilillah').soq + '</td></tr>' +
      '<tr><td class="c">' + nf(pb('mustahiq').pct) + '%</td><td>MUSTAHIQ' + (pb('mustahiq').ke && pb('mustahiq').ke !== 'Kelompok' ? ' ' + esc(pb('mustahiq').ke.toUpperCase()) : '') + '</td><td class="c">' + pb('mustahiq').soq + '</td></tr>' +
      '<tr><td class="c" rowspan="3">' + nf(amilPct) + '%</td><td>- ' + nf(pb('amilKlp').pct) + '% AMIL KELOMPOK</td><td class="c">' + pb('amilKlp').soq + '</td></tr>' +
      '<tr><td>- ' + nf(pb('amilDesa').pct) + '% AMIL DESA</td><td class="c">' + pb('amilDesa').soq + '</td></tr>' +
      '<tr><td>- ' + nf(pb('amilDaerah').pct) + '% AMIL DAERAH</td><td class="c">' + pb('amilDaerah').soq + '</td></tr>' +
      '<tr class="b"><td colspan="2" class="r">TOTAL</td><td class="c">' + (dash.fitrah ? dash.fitrah.soqDiterima : t.tot) + '</td></tr></tbody></table>' + ttdBlok(dash.penandatangan) + '</div>';
  }

  function lapMal(rows, dash, lp) {
    var KET = { MAL: 'MAL', TIJAROH: 'TIJAROH', MAL_TIJAROH: 'MAL + TIJAROH' };
    var list = rows.filter(function (r) { return r.kelas === 'LAIN' && KET[r.jenis] && (r.lampiran || 'UTAMA') === lp; })
      .sort(function (a, b) { return a.tanggal < b.tanggal ? -1 : a.tanggal > b.tanggal ? 1 : a.nama.localeCompare(b.nama, 'id'); });
    var total = list.reduce(function (a, r) { return a + r.nominal; }, 0);
    var pm = (dash.pembagianMal || {})[lp] || { rows: [], setor: {} };
    var LBL = { sabilillah: 'SABILILLAH DAERAH', amilKlp: 'AMIL KELOMPOK', amilDesa: 'AMIL DESA', amilDaerah: 'AMIL DAERAH' };
    var lbl = function (x) { return x.key === 'mustahiq' ? 'MUSTAHIQ ' + String(x.ke || '').toUpperCase() : LBL[x.key]; };
    var by = {}; pm.rows.forEach(function (x) { by[x.key] = x; });
    var amil = ['amilKlp', 'amilDesa', 'amilDaerah'].map(function (k) { return by[k] || { key: k, pct: 0, rp: 0 }; });
    var amilPct = amil.reduce(function (a, x) { return a + x.pct; }, 0);
    var setorKe = function (ke) {
      var urut = ['sabilillah', 'amilDaerah', 'mustahiq', 'amilKlp', 'amilDesa', 'amilDaerah'].filter(function (k, i, a) { return a.indexOf(k) === i; });
      var rs = urut.map(function (k) { return by[k]; }).filter(function (x) { return x && x.ke === ke && x.rp; });
      return '<table style="width:auto;min-width:380px"><thead><tr><th colspan="2" class="kiri">YANG DISETOR KE ' + ke.toUpperCase() + ':</th><th></th></tr></thead><tbody>' +
        (rs.length ? rs.map(function (x, i) { return '<tr><td class="c" style="width:34px">' + (i + 1) + '</td><td>' + lbl(x) + '</td><td class="r">' + rpTitik(x.rp) + '</td></tr>'; }).join('') : '<tr><td></td><td>-</td><td class="r">0</td></tr>') +
        '<tr class="tot"><td></td><td class="r">TOTAL DISETOR</td><td class="r">' + rpTitik(rs.reduce(function (a, x) { return a + x.rp; }, 0)) + '</td></tr></tbody></table>';
    };
    return '<h3 class="c">DAFTAR PENERIMAAN DAN PEMBAGIAN ZAKAT MAL TIJAROH' + (lp === 'SUSULAN' ? ' · LAMPIRAN SUSULAN' : '') + '<br>TAHUN ' + dash.tahun + ' M / ' + esc(dash.hijriah) + '<br>' +
      esc(String(S.boot.kelompok || '').toUpperCase()) + ', DESA ' + esc(wilayah().desa.toUpperCase()) + ', ' + esc(wilayah().daerah.toUpperCase()) + '</h3>' +
      '<div class="kotak"><div class="seksi"><b>A</b><div><b>PENERIMAAN :</b><table><thead><tr><th>No</th><th>Nama</th><th>Kelompok</th><th>Jumlah Zakat</th><th>Keterangan</th></tr></thead><tbody>' +
      (list.map(function (r, i) { return '<tr><td class="c">' + (i + 1) + '</td><td>' + esc(r.nama.toUpperCase()) + '</td><td>' + esc(namaKelompok()) + '</td><td class="r">' + rpTitik(r.nominal) + '</td><td>' + KET[r.jenis] + '</td></tr>'; }).join('') || '<tr><td colspan="5" class="c">Belum ada setoran.</td></tr>') +
      '<tr class="tot"><td></td><td colspan="2">JUMLAH ZAKAT MAL TIJAROH (' + dash.tahun + ')</td><td class="r">' + rpTitik(total) + '</td><td></td></tr></tbody></table></div></div>' +
      '<div class="seksi"><b>B</b><table style="width:auto;min-width:380px"><thead><tr><th colspan="3">PEMBAGIAN ZAKAT MAL &amp; TIJAROH</th></tr></thead><tbody>' +
      ['sabilillah', 'mustahiq'].map(function (k) { var x = by[k] || { key: k, pct: 0, rp: 0, ke: '' }; return '<tr><td class="c" style="width:44px">' + nf(x.pct) + '%</td><td>' + lbl(x) + '</td><td class="r">' + rpTitik(x.rp) + '</td></tr>'; }).join('') +
      amil.map(function (x, i) { return '<tr>' + (i === 0 ? '<td class="c" rowspan="3">' + nf(amilPct) + '%</td>' : '') + '<td>- ' + nf(x.pct) + '% ' + LBL[x.key] + '</td><td class="r">' + rpTitik(x.rp) + '</td></tr>'; }).join('') +
      '<tr class="tot"><td></td><td>TOTAL</td><td class="r">' + rpTitik(pm.total || 0) + '</td></tr></tbody></table></div>' +
      '<div class="seksi"><b>C</b>' + setorKe('Desa') + '</div><div class="seksi"><b>D</b>' + setorKe('Daerah') + '</div>' +
      ttdBlok(dash.penandatangan) + '</div>';
  }

  function lapMustahiq(d, dash) {
    var KOL = [['MISKIN', 'MISKIN'], ['FAKIR', 'FAQIR'], ['GHORIM', 'GHORIM'], ['MUALAF', 'MUALAF'], ['IBNU_SABIL', 'IBNU SABIL']];
    if (d.asnaf.SABILILLAH) KOL.push(['SABILILLAH', 'SABILILLAH']);
    var tot = {}, no = 0, rows = '';
    d.grup.forEach(function (g) {
      g.anggota.forEach(function (a) {
        no++; tot[a.asnaf] = (tot[a.asnaf] || 0) + a.jiwa;
        rows += '<tr><td class="c">' + no + '</td><td' + (a.kepala ? ' class="b"' : '') + '>' + esc(a.nama) + (a.jiwa > 1 ? ' (' + a.jiwa + ' jiwa)' : '') + (g.tipe === 'LUAR' ? ' · luar sensus' : '') + '</td>' +
          KOL.map(function (k) { return '<td class="c">' + (a.asnaf === k[0] ? a.jiwa : '-') + '</td>'; }).join('') + '</tr>';
      });
    });
    var w = wilayah();
    return '<div class="kepala-kiri"><b>DAFTAR MUSTAHIQ DAERAH ' + esc(w.daerah.toUpperCase()) + '</b><span>KELOMPOK</span><span>: ' + esc(w.no) + '</span><span>DESA</span><span>: ' + esc(w.desa.toUpperCase()) + '</span><span>TAHUN</span><span>: ' + d.tahun + '</span></div>' +
      '<table><thead><tr><th rowspan="2">NO</th><th rowspan="2">NAMA</th><th colspan="' + KOL.length + '">KATEGORI MUSTAHIQ</th></tr><tr>' + KOL.map(function (k) { return '<th>' + k[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (rows || '<tr><td colspan="' + (2 + KOL.length) + '" class="c">Daftar mustahiq belum diisi.</td></tr>') +
      '<tr class="b"><td colspan="2" class="r">Total</td>' + KOL.map(function (k) { return '<td class="c">' + (tot[k[0]] || 0) + '</td>'; }).join('') + '</tr>' +
      '<tr class="b"><td colspan="2" class="r">Jumlah jiwa mustahiq</td><td colspan="' + KOL.length + '" class="c">' + d.jiwa + '</td></tr></tbody></table>' +
      '<p class="ket">Nama tebal = kepala keluarga. Urutan per KK (kepala keluarga lalu anggota), kemudian jamaah tanpa KK, lalu penerima luar sensus.</p>' + ttdBlok(dash.penandatangan);
  }

  function lapSerah(d, dash) {
    var tot = { jiwa: 0, soq: 0, kg: 0 };
    var rows = d.grup.map(function (g, i) {
      tot.jiwa += g.jiwa; tot.soq += g.soq; tot.kg += g.kg;
      var asn = g.anggota.map(function (a) { return ASNAF_LBL[a.asnaf] || a.asnaf; }).filter(function (x, k, arr) { return arr.indexOf(x) === k; }).join(', ');
      return '<tr><td class="c">' + (i + 1) + '</td><td class="b">' + esc(g.nama) + (g.tipe === 'TANPA_KK' ? ' (tanpa KK)' : g.tipe === 'LUAR' ? ' (luar sensus)' : '') + '</td><td>' + esc(asn) + '</td><td class="c">' + g.jiwa + '</td><td class="c">' + g.soq + '</td><td class="r">' + kgf(g.kg) + '</td><td class="ttdk">' + (i + 1) + '.</td></tr>';
    }).join('');
    return '<h3 class="c">LEMBAR PENYERAHAN ZAKAT FITRAH UNTUK MUSTAHIQ ' + esc(d.hijriah) + ' / ' + d.tahun + '<br>' + esc(String(S.boot.kelompok || '').toUpperCase()) + ' · DESA ' + esc(wilayah().desa.toUpperCase()) + ' · ' + esc(wilayah().daerah.toUpperCase()) + '</h3>' +
      '<p class="c ket">Bagian mustahiq = ' + nf(d.pool) + ' soq (' + kgf(d.poolKg) + ' kg) · ' + d.jiwa + ' jiwa · ' + d.grup.length + ' KK · dibagi rata per jiwa' + (d.sementara ? ' · <b>angka sementara</b>' : '') + '</p>' +
      '<table><thead><tr><th>No</th><th>Nama KK / penerima</th><th>Asnaf</th><th>Jiwa</th><th>Soq</th><th>Kg</th><th style="width:130px">Tanda tangan</th></tr></thead><tbody>' +
      (rows || '<tr><td colspan="7" class="c">Daftar mustahiq belum diisi.</td></tr>') +
      '<tr class="tot"><td colspan="3">JUMLAH</td><td class="c">' + tot.jiwa + '</td><td class="c">' + tot.soq + '</td><td class="r">' + kgf(tot.kg) + '</td><td></td></tr></tbody></table>' + ttdBlok(dash.penandatangan);
  }
})();
