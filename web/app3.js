/* Dashboard pemantauan, tren tahunan, data setoran, konfigurasi. */
(function () {
  'use strict';
  var Z = window.__Z, $ = Z.$, $$ = Z.$$, esc = Z.esc, rp = Z.rp, rpShort = Z.rpShort, nf = Z.nf, kgf = Z.kgf, pct = Z.pct, ICON = Z.ICON, S = Z.S, api = Z.api, ACT = Z.ACT;
  var POS = { sabilillah: 'Sabilillah Daerah', mustahiq: 'Mustahiq', amilKlp: 'Amil Kelompok', amilDesa: 'Amil Desa', amilDaerah: 'Amil Daerah' };
  var JENIS = { UANG: ['warn', 'Fitrah · Uang'], BERAS: ['mint', 'Fitrah · Beras'], KAMPUNG: ['', 'Fitrah · Kampung'], MAL: ['blue', 'Mal'], TIJAROH: ['blue', 'Tijaroh'], MAL_TIJAROH: ['blue', 'Mal + Tijaroh'], FIDYAH: ['purple', 'Fidyah'] };

  function tahunSelect(id, cur) {
    return '<label class="f" style="font-size:12px;color:var(--muted)">Tahun<select id="' + id + '" class="fi" style="height:44px;font-weight:600">' +
      S.boot.tahunList.slice().reverse().map(function (t) { return '<option value="' + t.tahun + '"' + (t.tahun === cur ? ' selected' : '') + '>' + esc(t.hijriah) + ' / ' + t.tahun + (t.status === 'BUKA' ? ' · berjalan' : '') + '</option>'; }).join('') + '</select></label>';
  }
  function kpi(l, v, h, color) { return '<div class="kpi"><span class="l">' + esc(l) + '</span><span class="v num" style="color:' + (color || 'var(--ink)') + '">' + v + '</span><span class="h">' + h + '</span></div>'; }
  function card(title, sub, body, right) {
    return '<section class="card"><div class="ch"><div class="tt"><h2>' + title + '</h2>' + (sub ? '<span class="sub">' + sub + '</span>' : '') + '</div>' + (right || '') + '</div>' + body + '</section>';
  }

  // =====================================================================
  // DASHBOARD PEMANTAUAN
  // =====================================================================
  var D = null, D_belumAll = false;
  ACT.belumAll = function () { D_belumAll = !D_belumAll; renderDash(); };
  /**
   * Ambil data halaman bersamaan dengan bootstrap (bukan berurutan), lalu render hanya bila
   * pengguna masih di halaman yang sama (Z.jaga).
   */
  function muat(action, params, onData) {
    var boot = Z.ensureBoot();
    var p = Z.apiCepat(action, params, function (d, dariCache) { boot.then(Z.jaga(function () { onData(d, dariCache); })); });
    return Promise.all([boot, p]);
  }
  /** Pembaruan dari latar belakang tidak boleh merusak isian yang sedang diketik. */
  function bolehRender() { var a = document.activeElement; return !(a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName) && Z.app.contains(a)); }
  Z.viewDash = function (tahun, segar) {
    Z.loading('Menghitung rekap…');
    var onD = function (d, dariCache) { D = d; S.tahun = d.tahun; if (dariCache || bolehRender()) renderDash(); };
    var t = Number(tahun || S.tahun) || 0;
    if (segar) {
      Z.ensureBoot().then(function () { return Z.apiSegar('dashboard', { tahun: t || S.boot.tahunAktif }); }).then(Z.jaga(onD)).catch(Z.fail);
    } else if (t) {
      muat('dashboard', { tahun: t }, onD).catch(Z.fail);
    } else {
      Z.ensureBoot().then(function () { return muat('dashboard', { tahun: S.boot.tahunAktif }, onD); }).catch(Z.fail);
    }
  };

  // ---------- progres untuk jamaah (D-26) ----------
  var HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  var BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  function persenBawah(a, b) { return b ? Math.floor(a * 100 / b) : 0; }
  function barTeks(p) { var n = Math.max(0, Math.min(10, Math.floor(p / 10))); return new Array(n + 1).join('▓') + new Array(10 - n + 1).join('░'); }
  function tglPanjang(s) {
    var m = String(s || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (!m) return String(s || '');
    var hari = HARI[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()];
    return hari + ', ' + (+m[3]) + ' ' + BULAN[+m[2] - 1] + ' ' + m[1] + (m[4] ? ' pukul ' + m[4] + '.' + m[5] : '');
  }
  /** Teks progres untuk grup WhatsApp jamaah: tanpa nominal, tanpa nama, tanpa emoji. Fungsi murni (dites di Node). */
  Z.teksProgres = function (p, hijriah, kelompok) {
    var pk = persenBawah(p.kkSudah, p.kkTotal), pj = persenBawah(p.jiwaSudah, p.jiwaTotal);
    var h = p.hMinus === null || p.hMinus === undefined || p.hMinus < 0 ? '' : p.hMinus === 0 ? ' · Hari H' : ' · H-' + p.hMinus;
    var tambah = [p.kkHariIni ? p.kkHariIni + ' KK' : '', p.jiwaHariIni ? p.jiwaHariIni + ' jiwa' : ''].filter(Boolean).join(' · ');
    var baris = ['*Progres Zakat Fitrah ' + hijriah + '*', kelompok || '', tglPanjang(p.tanggal) + h, '',
      'KK sudah zakat: ' + p.kkSudah + ' dari ' + p.kkTotal + ' (' + pk + '%)', barTeks(pk),
      'Jiwa sudah zakat: ' + p.jiwaSudah + ' dari ' + p.jiwaTotal + ' (' + pj + '%)', barTeks(pj), ''];
    if (tambah) baris.push('Hari ini bertambah ' + tambah + '.');
    if (p.batasLewat) baris.push('Penerimaan zakat fitrah ' + hijriah + ' sudah ditutup. Jazakumullahu khoiro.');
    else {
      if (p.batasFitrah) baris.push('Batas zakat fitrah: ' + tglPanjang(p.batasFitrah) + ' (sebelum shalat Ied).');
      baris.push('Bagi yang belum, silakan menghubungi amil.');
    }
    return baris.filter(function (x, i) { return x !== '' || i === 3 || i === 8; }).join('\n').replace(/\n{3,}/g, '\n\n');
  };
  ACT.bagiProgres = function () {
    var t = Z.teksProgres(D.progres, D.hijriah, S.boot.kelompok);
    Z.openModal('<div class="mh"><h2>Bagikan progres</h2><button type="button" class="btn sm" data-act="close" aria-label="Tutup">' + ICON.x + '</button></div>' +
      '<p class="sub" style="margin:0">Tanpa nominal dan tanpa nama. Silakan kirim ke grup jamaah.</p>' +
      '<label class="f"><span class="sr">Teks progres</span><textarea id="prTeks" class="fi" rows="13" readonly style="height:auto;line-height:1.5;font-family:inherit;white-space:pre-wrap">' + esc(t) + '</textarea></label>' +
      '<div style="display:flex;gap:10px"><button type="button" class="btn" style="flex:1" data-act="salinProgres">Salin teks</button>' +
      '<button type="button" class="btn pri" style="flex:2" data-act="waProgres">Kirim ke WhatsApp</button></div>');
  };
  ACT.waProgres = function () { window.open('https://wa.me/?text=' + encodeURIComponent($('#prTeks').value), '_blank'); };
  ACT.salinProgres = function () {
    var ta = $('#prTeks'), ok = function () { Z.toast('Teks progres disalin.'); };
    var cadangan = function () { try { ta.select(); document.execCommand('copy'); ok(); } catch (e) { Z.toast('Tidak bisa menyalin otomatis. Tekan lama teksnya lalu salin.', true); } };
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(ok, cadangan); else cadangan(); } catch (e) { cadangan(); }
  };
  function kpiProgres(d) {
    var p = d.progres, f = d.fitrah;
    var baris = function (label, a, b) {
      var x = b ? Math.min(100, a * 100 / b) : 0;
      return '<div style="display:flex;flex-direction:column;gap:6px"><span class="l">' + label + '</span><div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><span class="v num">' + a + '</span><span style="font-size:16px;font-weight:600;color:#A9C4BB">dari ' + b + ' · ' + persenBawah(a, b) + '%</span></div>' +
        '<div class="bar" style="background:#24493F" role="img" aria-label="' + label + ': ' + a + ' dari ' + b + ' (' + persenBawah(a, b) + '%)"><i style="width:' + x + '%;background:#5FD4B4"></i></div></div>';
    };
    var hari = [p.kkHariIni ? '+' + p.kkHariIni + ' KK' : '', p.jiwaHariIni ? '+' + p.jiwaHariIni + ' jiwa' : ''].filter(Boolean).join(' · ');
    return '<div class="kpi dark" style="gap:14px"><div style="display:flex;align-items:center;gap:10px"><span class="l" style="flex:1">Progres zakat fitrah</span>' +
      (S.role !== 'amil' ? '<button type="button" class="btn sm noprint" data-act="bagiProgres">Bagikan progres</button>' : '') + '</div>' +
      baris('KK sudah zakat (semua anggota)', p.kkSudah, p.kkTotal) + baris('Jiwa sensus sudah zakat', p.jiwaSudah, p.jiwaTotal) +
      '<span class="h">' + (hari ? 'Hari ini ' + hari + ' · ' : '') + p.kkSebagian + ' KK sebagian · ditambah ' + f.sm + ' simpatisan &amp; ' + f.luar + ' JM luar · ' + f.kampung + ' jiwa zakat di kampung</span></div>';
  }

  function renderDash() {
    var d = D, f = d.fitrah, c = d.config, admin = S.role === 'admin';
    var buka = d.status === 'BUKA';
    var statusChip = buka ? '<span class="chip ok" style="align-self:flex-start"><span style="width:8px;height:8px;border-radius:99px;background:var(--brand2)"></span>Penerimaan dibuka' + (d.hMinus !== null && d.hMinus >= 0 ? ' · ' + (d.hMinus === 0 ? 'Hari H' : 'H-' + d.hMinus) : '') + '</span>'
      : '<span class="chip" style="align-self:flex-start">Penerimaan ditutup</span>';
    var maxH = Math.max.apply(null, d.harian.map(function (h) { return h.soq; }).concat([1]));
    var jenisTot = f.berasSoq + f.uangSoq + f.kampung || 1;
    var kebutuhan = d.beras.kebutuhanKg, dibeli = d.beras.dibeliKg;
    var maxAmil = Math.max.apply(null, d.perAmil.map(function (a) { return a.total; }).concat([1]));
    var mU = d.pembagianMal.UTAMA, mS = d.pembagianMal.SUSULAN;
    var kgSoq = d.kgSoq;

    var html = '<div class="wrap">' +
      '<div class="head"><div class="t">' + statusChip + '<h1>Pemantauan Zakat Idul Fitri ' + esc(d.hijriah) + '</h1>' +
      '<p>Data per ' + esc(Z.tglId(d.diperbarui)) + ' WIB · harga titip ' + rp(d.harga) + '/soq · 1 soq = ' + kgf(kgSoq) + ' kg</p></div>' +
      tahunSelect('dTahun', d.tahun) +
      '<button type="button" class="btn noprint" data-act="dReload">Muat ulang</button><button type="button" class="btn noprint" onclick="window.print()">Cetak rekap</button></div>' +
      Z.batasInfo({ config: c, batasLewat: d.batasLewat }) +

      // KPI
      '<section class="grid kpis" aria-label="Angka utama">' +
      (d.progres ? kpiProgres(d) : '<div class="kpi dark"><span class="l">Jiwa sensus yang sudah zakat fitrah</span><div style="display:flex;align-items:baseline;gap:10px;flex-wrap:wrap"><span class="v num">' + f.jm + '</span><span style="font-size:18px;font-weight:600;color:#A9C4BB">dari ' + d.jiwaSensus + ' jiwa · ' + pct(d.partisipasi) + '</span></div>' +
      '<div class="bar" style="background:#24493F" role="img" aria-label="Progres ' + pct(d.partisipasi) + '"><i style="width:' + Math.min(100, d.partisipasi * 100) + '%;background:#5FD4B4"></i></div>' +
      '<span class="h">' + d.kkSetor + (d.kkSensus ? ' dari ' + d.kkSensus : '') + ' KK sudah setor · ditambah ' + f.sm + ' simpatisan &amp; ' + f.luar + ' JM luar · ' + f.kampung + ' jiwa zakat di kampung</span></div>') +
      kpi('Beras diterima', kgf(f.berasKg) + ' kg', f.berasSoq + ' soq', 'var(--brand)') +
      kpi('Titip uang zakat', rpShort(f.uangWajib), f.uangSoq + ' jiwa × ' + rp(d.harga), '#B4501B') +
      kpi('Zakat mal & tijaroh', rpShort(d.malTotal), d.malMuzakki + ' muzakki' + (mS.total ? ' · susulan ' + rpShort(mS.total) : '')) +
      kpi('Fidyah', rp(d.fidyah.total), d.fidyah.orang + ' setoran · di luar pembagian') +
      kpi('Lebih bayar → Usaha Bersama', rp(d.ub.terkumpul), 'dari ' + d.ub.kkLebih + ' setoran titip uang', 'var(--blue)') +
      kpi('Kurang bayar', rp(f.kurang), f.kkKurang + ' setoran belum lunas', f.kurang ? 'var(--red)' : 'var(--ink)') +
      '</section>' +

      // harian + jenis
      '<div class="grid g2">' +
      '<section class="card pad"><div style="display:flex;align-items:baseline;gap:8px"><h2 style="flex:1">Setoran harian</h2><span class="sub">jiwa (soq) per hari</span></div>' +
      (d.harian.length ? '<div class="cols" role="img" aria-label="Setoran harian">' + d.harian.map(function (h) { return '<div class="c"><b class="num">' + h.soq + '</b><i style="height:' + (h.soq / maxH * 130) + 'px"></i></div>'; }).join('') + '</div>' +
        '<div class="cols-l">' + d.harian.map(function (h) { return '<span>' + esc(h.tanggal === 'tanpa tanggal' ? '—' : Z.tglId(h.tanggal)) + '</span>'; }).join('') + '</div>' : '<p class="sub">Belum ada setoran.</p>') + '</section>' +
      '<section class="card pad"><h2>Jenis zakat fitrah</h2>' +
      '<div class="stack" role="img" aria-label="Beras ' + f.berasSoq + ', titip uang ' + f.uangSoq + ', di kampung ' + f.kampung + ' jiwa"><span style="width:' + (f.berasSoq / jenisTot * 100) + '%;background:var(--brand)"></span><span style="width:' + (f.uangSoq / jenisTot * 100) + '%;background:var(--orange)"></span><span style="width:' + (f.kampung / jenisTot * 100) + '%;background:var(--grey)"></span></div>' +
      '<div class="legend"><span><i style="background:var(--brand)"></i>Beras <b>' + f.berasSoq + ' jiwa</b></span><span><i style="background:var(--orange)"></i>Titip uang <b>' + f.uangSoq + ' jiwa</b></span><span><i style="background:var(--grey)"></i>Di kampung <b>' + f.kampung + ' jiwa</b></span></div>' +
      '<div style="border-top:1px solid var(--line2);padding-top:14px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap"><h3 style="flex:1">Pembelian beras dari titip uang</h3><span class="sub">kebutuhan ' + f.uangSoq + ' × ' + kgf(kgSoq) + ' kg</span></div>' +
      '<div style="display:flex;align-items:center;gap:12px"><div class="bar" style="flex:1;height:12px"><i style="width:' + (kebutuhan ? Math.min(100, dibeli / kebutuhan * 100) : 0) + '%;background:var(--orange)"></i></div><b class="num">' + kgf(dibeli) + ' / ' + kgf(kebutuhan) + ' kg</b></div>' +
      '<span class="sub" style="color:var(--warnfg);font-weight:600">' + (kebutuhan - dibeli > 0 ? 'Kurang ' + kgf(kebutuhan - dibeli) + ' kg · ' : 'Terpenuhi · ') + 'sisa dana ' + rp(d.beras.sisaDana) + '</span>' +
      (admin ? '<button type="button" class="btn sm noprint" style="align-self:flex-start" data-act="beliModal">' + ICON.plus + 'Catat pembelian beras</button>' : '') + '</div></section></div>' +

      // per amil
      card('Perolehan zakat fitrah per amil', d.perAmil.filter(function (a) { return a.aktif; }).length + ' amil aktif',
        '<div class="tbl" style="padding:0 10px 10px"><table><thead><tr><th>Amil</th><th class="r">KK</th><th class="r">Beras (soq)</th><th class="r">Titip uang (soq)</th><th class="r">Uang diterima</th><th class="r">Total soq</th><th style="width:24%">Porsi</th></tr></thead><tbody>' +
        d.perAmil.map(function (a) { return '<tr><td><b>' + esc(a.nama) + '</b></td><td class="r num">' + a.kk + '</td><td class="r num">' + a.beras + '</td><td class="r num">' + a.uang + '</td><td class="r num">' + rp(a.rp) + '</td><td class="r num"><b>' + a.total + '</b></td><td><div class="bar"><i style="width:' + (a.total / maxAmil * 100) + '%"></i></div></td></tr>'; }).join('') +
        '<tr class="tot"><td>Total</td><td class="r">' + d.kkSetor + '</td><td class="r">' + f.berasSoq + '</td><td class="r">' + f.uangSoq + '</td><td class="r">' + rp(f.uangDiterima) + '</td><td class="r">' + f.soqDiterima + '</td><td></td></tr></tbody></table></div>') +

      // pembagian
      '<div class="grid g2">' +
      '<section class="card pad"><div><h2>Pembagian zakat fitrah</h2><span class="sub">' + f.soqDiterima + ' soq diterima (tanpa zakat di kampung)</span></div>' +
      '<div class="tbl"><table><thead><tr><th>Pos</th><th class="r">%</th><th class="r">Soq</th><th class="r">Kg</th><th>Ke</th></tr></thead><tbody>' +
      d.pembagianFitrah.map(function (b) { return '<tr><td><b>' + POS[b.key] + '</b></td><td class="r">' + nf(b.pct, 1) + '%</td><td class="r num"><b>' + b.soq + '</b></td><td class="r num">' + kgf(b.kg) + '</td><td><span class="chip ' + keChip(b.ke) + '">' + b.ke + '</span></td></tr>'; }).join('') +
      '<tr class="tot"><td>Total</td><td class="r">100%</td><td class="r">' + f.soqDiterima + '</td><td class="r">' + kgf(f.soqDiterima * kgSoq) + '</td><td></td></tr></tbody></table></div>' +
      '<div class="note ok">' + ICON.check + '<span>Pembulatan otomatis: total pembagian selalu sama dengan soq yang diterima.</span></div></section>' +
      malCard('Pembagian zakat mal &amp; tijaroh', mU, d.mal.UTAMA) +
      (mS.total ? malCard('Pembagian zakat mal susulan', mS, d.mal.SUSULAN) : '') + '</div>' +

      bagianAmilCard('UTAMA') + (mS.total ? bagianAmilCard('SUSULAN') : '') +

      // UB
      card('Lebih bayar untuk Usaha Bersama (UB)', 'Dicatat otomatis dari tiap setoran · uang dipegang amil sampai dicatat diserahkan ke UB',
        '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;padding:16px 20px 6px">' +
        miniBox('var(--bluebg)', 'var(--bluefg)', 'Terkumpul untuk UB', rp(d.ub.terkumpul), d.ub.kkLebih + ' setoran') +
        miniBox('#F6F8F7', 'var(--muted)', 'Sudah diserahkan ke UB', rp(d.ub.diserahkan), d.ub.serahCount + ' serah terima') +
        miniBox('var(--warnbg)', 'var(--warnfg)', 'Masih dipegang amil', rp(d.ub.dipegang), d.perAmil.filter(function (a) { return a.lebihUB - a.serahUB > 0; }).length + ' amil') +
        miniBox('#F6F8F7', 'var(--muted)', 'Dikembalikan ke jamaah', rp(d.ub.kembali), 'tidak masuk UB') + '</div>' +
        '<div class="tbl" style="padding:0 10px 10px"><table><thead><tr><th>Amil</th><th class="r">Lebih bayar dicatat</th><th class="r">Sudah diserahkan</th><th class="r">Sisa di amil</th><th>Serah terakhir</th></tr></thead><tbody>' +
        d.perAmil.filter(function (a) { return a.lebihUB || a.serahUB; }).map(function (a) { var sisa = a.lebihUB - a.serahUB; return '<tr><td><b>' + esc(a.nama) + '</b></td><td class="r num">' + rp(a.lebihUB) + '</td><td class="r num">' + rp(a.serahUB) + '</td><td class="r num" style="font-weight:800;color:' + (sisa > 0 ? 'var(--warnfg)' : 'var(--mintfg)') + '">' + rp(sisa) + '</td><td>' + esc(a.serahTerakhir || '—') + '</td></tr>'; }).join('') +
        '</tbody></table></div>',
        (admin || S.role === 'amil') ? '<button type="button" class="btn blue sm noprint" data-act="ubModal">' + ICON.plus + 'Catat serah ke UB</button>' : '') +

      (d.belum ? card('Belum zakat fitrah', d.belum.filter(function (b) { return b.status === 'BELUM'; }).length + ' KK belum setor · ' + d.jiwaBelum + ' jiwa sensus belum tercatat' + ((d.belumTanpaKK || []).length ? ' (termasuk ' + d.belumTanpaKK.length + ' jiwa tanpa KK)' : ''),
        '<div class="tbl"><table><thead><tr><th>Keluarga (KK)</th><th class="r">Jiwa sensus</th><th class="r">Belum</th><th>Anggota belum zakat</th><th>Status</th></tr></thead><tbody>' +
        d.belum.slice(0, D_belumAll ? d.belum.length : 15).map(function (b) { var ch = b.status === 'KURANG' ? ['red', 'Kurang ' + rp(b.kurangRp)] : b.status === 'SEBAGIAN' ? ['warn', 'Sebagian'] : ['red', 'Belum setor']; return '<tr><td><b>' + esc(b.nama) + '</b></td><td class="r">' + b.jiwa + '</td><td class="r"><b>' + b.belum + '</b></td><td class="tw">' + esc(b.anggota) + '</td><td><span class="chip ' + ch[0] + '">' + ch[1] + '</span></td></tr>'; }).join('') +
        '</tbody></table></div>' + (d.belum.length > 15 ? '<div class="foot noprint"><button type="button" class="btn sm" data-act="belumAll">' + (D_belumAll ? 'Tampilkan 15 saja' : 'Tampilkan semua ' + d.belum.length + ' KK') + '</button></div>' : '') +
        belumTanpaKK(d.belumTanpaKK || []), f.kkKurang ? '<span class="chip red">' + f.kkKurang + ' kurang bayar · ' + rp(f.kurang) + '</span>' : '') : '') +

      card('Setoran terbaru', '15 transaksi terakhir', setoranTable(d.terbaru, false), '<a class="btn sm noprint" href="#/setoran?tahun=' + d.tahun + '">Lihat semua</a>') +
      '</div>';
    Z.app.innerHTML = html;
    $('#dTahun').addEventListener('change', function (e) { S.tahun = Number(e.target.value); Z.viewDash(S.tahun); });
    $$('[data-bag]').forEach(function (inp) { inp.addEventListener('input', function () { hitungSisaBagian(inp.getAttribute('data-lp')); }); });
  }
  function belumTanpaKK(rows) {
    if (!rows.length) return '';
    return '<div class="ch" style="border-top:1px solid var(--line2)"><div class="tt"><h2 style="font-size:15px">Jiwa tanpa KK</h2><span class="sub">' + rows.length + ' jiwa · perantau, pendatang, atau mandiri. Tidak dihitung sebagai KK, tetap wajib zakat fitrah.</span></div></div>' +
      '<div class="tbl"><table><thead><tr><th>Nama</th><th>Keberadaan</th><th>Status</th></tr></thead><tbody>' +
      rows.slice(0, D_belumAll ? rows.length : 15).map(function (b) {
        var ch = b.status === 'KURANG' ? ['red', 'Kurang ' + rp(b.kurangRp)] : ['red', 'Belum setor'];
        return '<tr><td><b>' + esc(b.nama) + '</b></td><td>' + esc(b.keberadaan || '—') + '</td><td><span class="chip ' + ch[0] + '">' + ch[1] + '</span></td></tr>';
      }).join('') + '</tbody></table></div>' +
      (rows.length > 15 ? '<div class="foot noprint"><button type="button" class="btn sm" data-act="belumAll">' + (D_belumAll ? 'Tampilkan 15 saja' : 'Tampilkan semua ' + rows.length + ' jiwa') + '</button></div>' : '');
  }
  function keChip(ke) { return ke === 'Kelompok' ? 'mint' : ke === 'Desa' ? 'purple' : 'blue'; }
  function miniBox(bg, fg, l, v, h) { return '<div style="background:' + bg + ';border-radius:14px;padding:12px 14px;display:flex;flex-direction:column;gap:2px"><span style="font-size:12px;color:' + fg + ';font-weight:600">' + l + '</span><strong style="font-size:22px">' + v + '</strong><span class="sub">' + h + '</span></div>'; }
  function malCard(title, pm, m) {
    return '<section class="card pad"><div><h2>' + title + '</h2><span class="sub">' + rp(pm.total) + ' dari ' + m.muzakki + ' muzakki (Mal ' + rpShort(m.mal) + ' · Tijaroh ' + rpShort(m.tijaroh) + (m.campuran ? ' · Campuran ' + rpShort(m.campuran) : '') + ')</span></div>' +
      '<div class="tbl"><table><thead><tr><th>Pos</th><th class="r">%</th><th class="r">Rupiah</th><th>Disetor ke</th></tr></thead><tbody>' +
      pm.rows.map(function (b) { return '<tr><td><b>' + POS[b.key] + (b.key === 'mustahiq' ? ' ' + b.ke : '') + '</b></td><td class="r">' + nf(b.pct, 1) + '%</td><td class="r num"><b>' + nf(b.rp) + '</b></td><td><span class="chip ' + keChip(b.ke) + '">' + b.ke + '</span></td></tr>'; }).join('') +
      '</tbody></table></div><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px">' +
      ['Desa', 'Daerah', 'Kelompok'].map(function (k) { return '<div style="background:#F6F8F7;border-radius:12px;padding:10px 12px;display:flex;flex-direction:column;gap:2px"><span class="sub">' + (k === 'Kelompok' ? 'Tinggal di Kelompok' : 'Disetor ke ' + k) + '</span><strong>' + rp(pm.setor[k] || 0) + '</strong></div>'; }).join('') + '</div></section>';
  }
  function bagianAmilCard(lp) {
    var b = D.bagianAmil[lp], admin = S.role === 'admin';
    if (!b.items.length) return '';
    var rows = b.items.map(function (it) {
      var vB = it.beras === '' ? '' : String(it.beras).replace('.', ','), vU = it.uang === '' ? '' : nf(it.uang);
      return '<tr><td><b>' + esc(it.nama) + '</b></td><td class="r">' + nf(it.saham, 1) + '</td>' +
        (lp === 'UTAMA' ? '<td class="r num" style="color:var(--muted)">' + nf(it.hitBeras, 1) + '</td><td class="r">' + (admin ? '<input class="fi" style="width:70px;height:36px;text-align:right" inputmode="decimal" data-bag="beras" data-lp="' + lp + '" data-id="' + esc(it.idAmil) + '" value="' + esc(vB) + '" placeholder="' + nf(it.hitBeras, 1) + '" aria-label="Beras final ' + esc(it.nama) + '">' : (vB || '—')) + '</td>' : '') +
        '<td class="r num" style="color:var(--muted)">' + nf(it.hitUang) + '</td><td class="r">' + (admin ? '<input class="fi" style="width:130px;height:36px;text-align:right" inputmode="numeric" data-rp data-bag="uang" data-lp="' + lp + '" data-id="' + esc(it.idAmil) + '" value="' + esc(vU) + '" placeholder="' + nf(it.hitUang) + '" aria-label="Uang final ' + esc(it.nama) + '">' : (vU || '—')) + '</td></tr>';
    }).join('');
    var head = '<tr><th>Amil</th><th class="r">Saham</th>' + (lp === 'UTAMA' ? '<th class="r">Beras hitungan</th><th class="r">Beras final (soq)</th>' : '') + '<th class="r">Uang hitungan</th><th class="r">Uang final (Rp)</th></tr>';
    var foot = '<div class="noprint" style="display:flex;flex-wrap:wrap;align-items:center;gap:10px 16px;padding:12px 20px;background:var(--warnbg);border-radius:0 0 18px 18px;font-size:13px;color:var(--warnfg)">' +
      '<strong id="sisa_' + lp + '">' + (b.adaFinal ? 'Sisa lebih amil: ' + rp(b.sisaRp) + (lp === 'UTAMA' ? ' · ' + nf(b.sisaSoq, 1) + ' soq' : '') : 'Angka final belum diisi') + '</strong>' +
      (admin ? '<input id="bagCat_' + lp + '" class="fi" style="flex:1 1 220px;height:36px" placeholder="Catatan hasil musyawarah (mis. sisa untuk kas amil)" value="' + esc(b.catatan) + '"><button type="button" class="btn sm" data-act="bagSave" data-lp="' + lp + '">Simpan hasil musyawarah</button>' : (b.catatan ? '<span>' + esc(b.catatan) + '</span>' : '')) + '</div>';
    return card('Bagian amil kelompok' + (lp === 'SUSULAN' ? ' · susulan' : ''), 'Pool ' + (lp === 'UTAMA' ? nf(b.poolSoq) + ' soq · ' : '') + rp(b.poolRp) + ' · hitungan per saham sebagai acuan, angka final sesuai hasil musyawarah',
      '<div class="tbl" style="padding:0 10px 10px"><table><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div>' + foot);
  }
  function hitungSisaBagian(lp) {
    var b = D.bagianAmil[lp], sB = 0, sU = 0;
    $$('[data-bag=beras][data-lp=' + lp + ']').forEach(function (i) { sB += Number(String(i.value).replace(',', '.')) || 0; });
    $$('[data-bag=uang][data-lp=' + lp + ']').forEach(function (i) { sU += Z.parseNum(i.value); });
    $('#sisa_' + lp).textContent = 'Sisa lebih amil: ' + rp(b.poolRp - sU) + (lp === 'UTAMA' ? ' · ' + nf(b.poolSoq - sB, 1) + ' soq' : '');
  }
  ACT.bagSave = function (el) {
    var lp = el.getAttribute('data-lp'), b = D.bagianAmil[lp];
    var items = b.items.map(function (it) {
      var ib = $('[data-bag=beras][data-lp=' + lp + '][data-id="' + it.idAmil + '"]'), iu = $('[data-bag=uang][data-lp=' + lp + '][data-id="' + it.idAmil + '"]');
      return { idAmil: it.idAmil, nama: it.nama, beras: ib ? (ib.value === '' ? it.hitBeras : String(ib.value).replace(',', '.')) : '', uang: iu.value === '' ? it.hitUang : Z.parseNum(iu.value) };
    });
    var sec = el.closest('section'); Z.sibuk(sec, true);
    api('simpanBagianAmil', { tahun: D.tahun, lampiran: lp, items: items, catatan: $('#bagCat_' + lp).value })
      .then(function () { Z.toast('Hasil musyawarah tersimpan.'); Z.viewDash(D.tahun); }).catch(function (e) { Z.sibuk(sec, false); Z.fail(e); });
  };
  ACT.dReload = function () { Z.viewDash(D ? D.tahun : null, true); };

  ACT.ubModal = function () {
    var admin = S.role === 'admin';
    Z.openModal('<div class="mh"><h2>Catat serah ke Usaha Bersama</h2><button type="button" class="btn sm" data-act="close" aria-label="Tutup">' + ICON.x + '</button></div>' +
      (admin ? '<label class="f">Amil yang menyerahkan<select id="ubAmil" class="fi">' + D.perAmil.filter(function (a) { return a.id !== '_'; }).map(function (a) { return '<option value="' + esc(a.id) + '">' + esc(a.nama) + ' · sisa ' + rp(a.lebihUB - a.serahUB) + '</option>'; }).join('') + '</select></label>' : '<p class="sub" style="margin:0">Amil: <b>' + esc(S.nama) + '</b></p>') +
      '<div class="fgrid"><label class="f">Nominal (Rp)<input id="ubNom" class="fi" inputmode="numeric" data-rp></label><label class="f">Tanggal<input id="ubTgl" type="date" class="fi" value="' + Z.today() + '"></label></div>' +
      '<label class="f">Diterima oleh (pengurus UB)<input id="ubPen" class="fi"></label><label class="f">Catatan<input id="ubCat" class="fi" placeholder="Opsional"></label>' +
      '<button type="button" class="btn blue block" id="ubSave">Simpan serah terima</button>');
    $('#ubSave').addEventListener('click', function () {
      var box = $('#modal .box'); Z.sibuk(box, true);
      api('simpanSerahUB', { tahun: D.tahun, idAmil: admin ? $('#ubAmil').value : '', nominal: Z.parseNum($('#ubNom').value), tanggal: $('#ubTgl').value, penerima: $('#ubPen').value, catatan: $('#ubCat').value })
        .then(function () { Z.closeModal(); Z.toast('Serah ke UB tercatat.'); Z.viewDash(D.tahun); }).catch(function (e) { Z.sibuk(box, false); Z.fail(e); });
    });
  };
  ACT.beliModal = function () {
    Z.openModal('<div class="mh"><h2>Catat pembelian beras</h2><button type="button" class="btn sm" data-act="close" aria-label="Tutup">' + ICON.x + '</button></div>' +
      '<p class="sub" style="margin:0">Kebutuhan ' + kgf(D.beras.kebutuhanKg) + ' kg · sudah dibeli ' + kgf(D.beras.dibeliKg) + ' kg · sisa dana ' + rp(D.beras.sisaDana) + '</p>' +
      '<div class="fgrid"><label class="f">Berat (kg)<input id="blKg" class="fi" inputmode="decimal"></label><label class="f">Harga total (Rp)<input id="blRp" class="fi" inputmode="numeric" data-rp></label><label class="f">Tanggal<input id="blTgl" type="date" class="fi" value="' + Z.today() + '"></label></div>' +
      '<label class="f">Catatan<input id="blCat" class="fi" placeholder="Mis. toko, jenis beras"></label>' +
      (D.beras.list.length ? '<div class="tbl"><table><thead><tr><th>Tanggal</th><th class="r">Kg</th><th class="r">Rupiah</th><th></th></tr></thead><tbody>' + D.beras.list.map(function (x) { return '<tr><td>' + Z.tglId(x.tanggal) + '</td><td class="r">' + kgf(x.kg) + '</td><td class="r">' + rp(x.rp) + '</td><td class="r"><button type="button" class="btn sm danger" data-act="beliHapus" data-id="' + esc(x.id) + '">Hapus</button></td></tr>'; }).join('') + '</tbody></table></div>' : '') +
      '<button type="button" class="btn pri block" id="blSave">Simpan pembelian</button>');
    $('#blSave').addEventListener('click', function () {
      var box = $('#modal .box'); Z.sibuk(box, true);
      api('simpanBeli', { tahun: D.tahun, kg: String($('#blKg').value).replace(',', '.'), rupiah: Z.parseNum($('#blRp').value), tanggal: $('#blTgl').value, catatan: $('#blCat').value })
        .then(function () { Z.closeModal(); Z.toast('Pembelian beras tercatat.'); Z.viewDash(D.tahun); }).catch(function (e) { Z.sibuk(box, false); Z.fail(e); });
    });
  };
  ACT.beliHapus = function (el) { if (!confirm('Hapus catatan pembelian ini?')) return; api('hapusBeli', { id: el.getAttribute('data-id') }).then(function () { Z.closeModal(); Z.viewDash(D.tahun); }).catch(Z.fail); };

  /** Nama per jiwa yang dizakati; nama KK sebagai keterangan kecil. Data impor (tanpa rincian jiwa) tetap nama KK. */
  function namaMuzakki(t) {
    var jiwa = t.jiwaNama || [];
    var luar = /JM luar: ([^·]+)/.exec(t.catatan || '');
    if (!jiwa.length) return '<b>' + esc(t.nama) + '</b>';
    var nama = jiwa.concat(luar ? [luar[1].trim() + ' (JM luar)'] : []);
    var kk = t.idKeluarga && String(t.idKeluarga).indexOf('TANPA-KK-') !== 0 ? 'KK ' + t.nama : '';
    return '<b>' + esc(nama.join(', ')) + '</b>' + (kk ? '<span class="sub" style="display:block;font-size:12px">' + esc(kk) + '</span>' : '');
  }
  function cocokCari(r, q) {
    if (!q) return true;
    return r.nama.toLowerCase().indexOf(q) >= 0 || (r.amil || '').toLowerCase().indexOf(q) >= 0 ||
      (r.jiwaNama || []).some(function (n) { return n.toLowerCase().indexOf(q) >= 0; });
  }
  function setoranTable(rows, withActions) {
    if (!rows.length) return '<p class="sub" style="padding:16px 20px;margin:0">Belum ada data.</p>';
    var admin = S.role === 'admin';
    return '<div class="tbl"><table><thead><tr><th>Tanggal</th><th>Muzakki</th><th>Jenis</th><th>Jiwa</th><th class="r">Nilai</th><th class="r">Selisih</th><th>Amil</th>' + (withActions ? '<th>Sumber</th>' + (admin ? '<th class="r"><span class="sr">Aksi</span></th>' : '') : '') + '</tr></thead><tbody>' +
      rows.map(function (t) {
        var j = JENIS[t.jenis] || ['', t.jenis];
        var jiwa = t.kelas === 'FITRAH' ? [t.jiwa.jm ? t.jiwa.jm + ' JM' : '', t.jiwa.sm ? t.jiwa.sm + ' SM' : '', t.jiwa.luar ? t.jiwa.luar + ' luar' : ''].filter(Boolean).join(' + ') || '—' : (t.lampiran === 'SUSULAN' ? '<span class="chip warn">Susulan</span>' : '—');
        var nilai = t.kelas === 'FITRAH' ? (t.jenis === 'BERAS' ? kgf(t.kg) + ' kg' : t.jenis === 'UANG' ? rp(t.diterima) : '—') : rp(t.nominal);
        var sel = t.kelas === 'FITRAH' && t.selisih ? (t.selisih > 0 ? '<span style="color:var(--blue)">+' + nf(t.selisih) + (t.tujuan === 'KEMBALI' ? ' kembali' : ' → UB') + '</span>' : '<span style="color:var(--red)">−' + nf(-t.selisih) + ' kurang</span>') : '—';
        var act = '';
        if (withActions && admin) {
          act = '<td class="r" style="display:flex;gap:6px;justify-content:flex-end">' +
            (t.kelas === 'FITRAH' && t.sumber === 'APP' ? '<a class="btn sm" href="#/fitrah/' + encodeURIComponent(t.idKeluarga || '_sm') + '?edit=' + encodeURIComponent(t.id) + '">Ubah</a>' : '') +
            (t.kelas === 'LAIN' ? '<a class="btn sm" href="#/lain?edit=' + encodeURIComponent(t.id) + '">Ubah</a>' : '') +
            '<button type="button" class="btn sm danger" data-act="hapusSetoran" data-id="' + esc(t.id) + '" data-kelas="' + t.kelas + '" data-nama="' + esc(t.nama) + '">Hapus</button></td>';
        }
        return '<tr><td style="color:var(--muted)">' + esc(Z.tglId(t.tanggal)) + '</td><td class="tw">' + namaMuzakki(t) + (t.match && t.match !== 'COCOK' && t.match !== 'MANUAL' ? ' <span class="chip warn" title="Nama belum cocok ke sensus">cek</span>' : '') + '</td>' +
          '<td><span class="chip ' + j[0] + '">' + j[1] + '</span></td><td>' + jiwa + '</td><td class="r num"><b>' + nilai + '</b></td><td class="r num">' + sel + '</td><td style="color:var(--ink2)">' + esc(t.amil || '—') + (t.dicatat && t.dicatat !== t.amil ? '<span class="sub" style="display:block;font-size:12px">dicatat oleh ' + esc(t.dicatat) + '</span>' : '') + '</td>' +
          (withActions ? '<td><span class="chip">' + esc(t.sumber === 'IMPOR' ? 'Impor' : 'Aplikasi') + '</span></td>' + act : '') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  // =====================================================================
  // TREN TAHUNAN
  // =====================================================================
  Z.viewTren = function () {
    Z.loading('Menyusun tren…');
    muat('tren', undefined, function (all) { renderTren(all.filter(function (x) { return !x.error && (x.fitrah.setoran || x.malTotal); })); }).catch(Z.fail);
  };
  function delta(a, b, poin) {
    if (b === undefined || b === null) return { t: '—', up: null };
    if (poin) { var dp = (a - b) * 100; return { t: (dp >= 0 ? '+' : '−') + nf(Math.abs(dp), 1) + ' poin', up: dp >= 0 }; }
    if (!b) return { t: a ? 'baru' : '0%', up: a >= 0 };
    var d = (a - b) / b * 100; return { t: (d >= 0 ? '+' : '−') + nf(Math.abs(d), 1) + '%', up: d >= 0 };
  }
  function renderTren(T) {
    if (!T.length) { Z.app.innerHTML = '<div class="wrap"><div class="head"><div class="t"><h1>Tren Zakat per Tahun</h1></div></div><p class="sub">Belum ada data. Jalankan impor data lama atau mulai input setoran.</p></div>'; return; }
    var last = T[T.length - 1], prev = T[T.length - 2];
    var k = function (label, val, a, b, poin, prevTxt, invert) {
      var d = delta(a, b, poin), good = d.up === null ? null : (invert ? !d.up : d.up);
      return '<div class="kpi"><span class="l">' + label + '</span><span class="v num" style="font-size:24px">' + val + '</span>' +
        '<span class="chip ' + (good === null ? '' : good ? 'ok' : 'red') + '" style="align-self:flex-start">' + d.t + '</span><span class="h">' + (prev ? prev.tahun + ': ' + prevTxt : 'tahun pertama') + '</span></div>';
    };
    var tj = function (x) { return x.fitrah.jm + x.fitrah.sm + x.fitrah.luar; };
    var maxJ = Math.max.apply(null, T.map(tj).concat([1])), maxM = Math.max.apply(null, T.map(function (x) { return x.malTotal; }).concat([1]));
    var over = T.filter(function (x) { return x.partisipasi > 1; }).map(function (x) { return x.tahun; });
    var html = '<div class="wrap"><div class="head"><div class="t"><h1>Tren Zakat per Tahun</h1><p>' + T[0].tahun + '–' + last.tahun + ' · dibandingkan per Idul Fitri · ' + last.tahun + ' vs ' + (prev ? prev.tahun : '—') + (last.status === 'BUKA' ? ' (tahun berjalan, angka sementara)' : '') + '</p></div></div>' +
      '<section class="grid" style="grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px">' +
      k('Jiwa muzakki fitrah', nf(tj(last)), tj(last), prev && tj(prev), false, prev ? nf(tj(prev)) + ' jiwa' : '') +
      k('JM sensus yang zakat', nf(last.fitrah.jm), last.fitrah.jm, prev && prev.fitrah.jm, false, prev ? prev.fitrah.jm + ' jiwa' : '') +
      k('Beras diterima', kgf(last.fitrah.berasKg) + ' kg', last.fitrah.berasKg, prev && prev.fitrah.berasKg, false, prev ? kgf(prev.fitrah.berasKg) + ' kg' : '') +
      k('Titip uang', rpShort(last.fitrah.uangWajib), last.fitrah.uangWajib, prev && prev.fitrah.uangWajib, false, prev ? rpShort(prev.fitrah.uangWajib) : '') +
      k('Mal & tijaroh', rpShort(last.malTotal), last.malTotal, prev && prev.malTotal, false, prev ? rpShort(prev.malTotal) : '') +
      k('Mustahiq', (last.jiwaMustahiq || '—') + ' jiwa', last.jiwaMustahiq, prev && prev.jiwaMustahiq, false, prev ? (prev.jiwaMustahiq || '—') + ' jiwa' : '') +
      '</section><div class="grid g2">' +
      '<section class="card pad"><div><h2>Jiwa muzakki zakat fitrah</h2><span class="sub">JM sensus, simpatisan (SM), JM luar · angka atas = % jiwa sensus yang zakat</span></div>' +
      barsYear(T, function (x) { return [[x.fitrah.luar, 'var(--grey)'], [x.fitrah.sm, '#2563EB'], [x.fitrah.jm, 'var(--brand)']]; }, maxJ, function (x) { return pct(x.partisipasi); }, function (x) { return nf(tj(x)); }) +
      '<div class="legend"><span><i style="background:var(--brand)"></i>JM sensus</span><span><i style="background:#2563EB"></i>Simpatisan</span><span><i style="background:var(--grey)"></i>JM luar</span></div>' +
      (over.length ? '<p class="note warn" style="margin:0">Di atas 100% (' + over.join(', ') + '): jiwa di luar sensus ikut tercatat sebagai JM di data lama. Di aplikasi, JM dicocokkan ke ID sensus sehingga terpisah dari SM &amp; JM luar.</p>' : '') + '</section>' +
      '<section class="card pad"><div><h2>Zakat mal &amp; tijaroh</h2><span class="sub">Juta rupiah per tahun · termasuk susulan</span></div>' +
      barsYear(T, function (x) { var m = x.mal; return [[m.UTAMA.campuran + m.SUSULAN.campuran, '#C7D7FB'], [m.UTAMA.mal + m.SUSULAN.mal, '#93B4F5'], [m.UTAMA.tijaroh + m.SUSULAN.tijaroh, 'var(--blue)']]; }, maxM, function () { return ''; }, function (x) { return nf(x.malTotal / 1e6, 1); }) +
      '<div class="legend"><span><i style="background:var(--blue)"></i>Tijaroh</span><span><i style="background:#93B4F5"></i>Mal</span><span><i style="background:#C7D7FB"></i>Mal + Tijaroh</span></div></section></div>' +
      '<section class="card pad"><div style="display:flex;flex-wrap:wrap;gap:8px;align-items:baseline"><div style="flex:1 1 280px"><h2>Beras vs titip uang</h2><span class="sub">Porsi jiwa per jenis zakat fitrah · harga titip ikut ditampilkan</span></div>' +
      '<div class="legend"><span><i style="background:var(--brand)"></i>Beras</span><span><i style="background:var(--orange)"></i>Titip uang</span></div></div>' +
      T.map(function (x) {
        var t = x.fitrah.berasSoq + x.fitrah.uangSoq || 1;
        return '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><b style="width:48px">' + x.tahun + '</b><div class="stack" style="flex:1 1 300px;height:26px" role="img" aria-label="' + x.tahun + ': beras ' + x.fitrah.berasSoq + ', uang ' + x.fitrah.uangSoq + ' jiwa">' +
          '<span style="width:' + (x.fitrah.berasSoq / t * 100) + '%;background:var(--brand);color:#fff;font-size:12px;font-weight:700;display:flex;align-items:center;padding-left:10px">' + x.fitrah.berasSoq + '</span>' +
          '<span style="width:' + (x.fitrah.uangSoq / t * 100) + '%;background:var(--orange);font-size:12px;font-weight:700;display:flex;align-items:center;padding-left:10px">' + x.fitrah.uangSoq + '</span></div><span class="sub" style="width:120px;text-align:right">' + rp(x.harga) + '/soq</span></div>';
      }).join('') + '</section>' +
      card('Rekap tahunan', '', trenTable(T), '<button type="button" class="btn sm noprint" data-act="trenCsv">Ekspor CSV</button>') + '</div>';
    Z.app.innerHTML = html;
    ACT.trenCsv = function () { csv('tren-zakat.csv', trenRows(T)); };
  }
  function barsYear(T, segFn, max, topFn, valFn) {
    return '<div style="display:flex;align-items:flex-end;justify-content:space-around;gap:16px;height:230px;border-bottom:1px solid var(--line)">' + T.map(function (x) {
      return '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:72px"><span style="font-size:12px;font-weight:700;color:var(--mintfg)">' + topFn(x) + '</span><b class="num">' + valFn(x) + '</b>' +
        '<div style="width:56px;display:flex;flex-direction:column;border-radius:8px 8px 0 0;overflow:hidden">' + segFn(x).map(function (s) { return '<div style="height:' + (s[0] / max * 160) + 'px;background:' + s[1] + '"></div>'; }).join('') + '</div></div>';
    }).join('') + '</div><div style="display:flex;justify-content:space-around;gap:16px;margin-top:-6px">' + T.map(function (x) { return '<span style="width:72px;text-align:center;font-size:13px;font-weight:600;color:var(--ink2)">' + x.tahun + '</span>'; }).join('') + '</div>';
  }
  function trenRows(T) {
    var r = [['Indikator'].concat(T.map(function (x) { return x.tahun + ' · ' + x.hijriah; }))];
    var add = function (n, fn) { r.push([n].concat(T.map(fn))); };
    add('Jiwa sensus', function (x) { return x.jiwaSensus; });
    add('JM sensus yang zakat', function (x) { return x.fitrah.jm; });
    add('% JM sensus', function (x) { return pct(x.partisipasi); });
    add('Simpatisan (SM)', function (x) { return x.fitrah.sm; });
    add('JM luar', function (x) { return x.fitrah.luar; });
    add('Zakat di kampung (jiwa)', function (x) { return x.fitrah.kampung; });
    add('Zakat beras (soq)', function (x) { return x.fitrah.berasSoq; });
    add('Zakat beras (kg)', function (x) { return kgf(x.fitrah.berasKg); });
    add('Titip uang (jiwa)', function (x) { return x.fitrah.uangSoq; });
    add('Harga titip per soq', function (x) { return rp(x.harga); });
    add('Total titip uang', function (x) { return rp(x.fitrah.uangWajib); });
    add('Zakat mal', function (x) { return rp(x.mal.UTAMA.mal + x.mal.SUSULAN.mal); });
    add('Zakat tijaroh', function (x) { return rp(x.mal.UTAMA.tijaroh + x.mal.SUSULAN.tijaroh); });
    add('Mal + tijaroh (campuran)', function (x) { return rp(x.mal.UTAMA.campuran + x.mal.SUSULAN.campuran); });
    add('  · di antaranya susulan', function (x) { return rp(x.mal.SUSULAN.total); });
    add('Lebih bayar ke UB', function (x) { return rp(x.fitrah.lebihUB); });
    add('Kurang bayar', function (x) { return rp(x.fitrah.kurang); });
    add('Fidyah', function (x) { return rp(x.fidyah.total); });
    add('Mustahiq (jiwa)', function (x) { return x.jiwaMustahiq || '—'; });
    add('Jumlah amil', function (x) { return x.jumlahAmil; });
    return r;
  }
  function trenTable(T) {
    var r = trenRows(T);
    return '<div class="tbl" style="padding:0 10px 10px"><table><thead><tr>' + r[0].map(function (h, i) { return '<th' + (i ? ' class="r"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      r.slice(1).map(function (row) { return '<tr>' + row.map(function (v, i) { return '<td' + (i ? ' class="r num"' + (i === row.length - 1 ? ' style="font-weight:700"' : '') : ' style="font-weight:600"') + '>' + esc(v) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>';
  }
  function csv(name, rows) {
    var s = '﻿' + rows.map(function (r) { return r.map(function (v) { v = String(v === null || v === undefined ? '' : v); return /[",;\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(','); }).join('\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([s], { type: 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  }

  // =====================================================================
  // DATA SETORAN
  // =====================================================================
  var DS = { kelas: '', q: '', rows: [] };
  Z.viewSetoran = function (tahun) {
    Z.loading('Memuat data setoran…');
    var onS = function (rows, dariCache) { DS.rows = rows; if (dariCache || bolehRender()) renderSetoran(); };
    var t = Number(tahun || S.tahun) || 0;
    if (t) { S.tahun = t; muat('daftarSetoran', { tahun: t }, onS).catch(Z.fail); }
    else Z.ensureBoot().then(function () { S.tahun = S.boot.tahunAktif; return muat('daftarSetoran', { tahun: S.tahun }, onS); }).catch(Z.fail);
  };
  function renderSetoran() {
    var q = DS.q.toLowerCase();
    var rows = DS.rows.filter(function (r) { return (!DS.kelas || r.kelas === DS.kelas || r.jenis === DS.kelas) && cocokCari(r, q); });
    var perluCek = DS.rows.filter(function (r) { return r.match && r.match !== 'COCOK' && r.match !== 'MANUAL'; }).length;
    Z.app.innerHTML = '<div class="wrap"><div class="head"><div class="t"><h1>Data Setoran</h1><p>' + DS.rows.length + ' transaksi · ' + (S.role === 'admin' ? 'admin bisa mengubah dan menghapus' : 'hanya lihat, perubahan oleh admin') + '</p></div>' + tahunSelect('sTahun', S.tahun) +
      (S.role === 'admin' ? '<a class="btn pri" href="#/amil">' + ICON.plus + 'Input setoran</a>' : '') + '</div>' +
      (perluCek ? '<div class="note warn">' + ICON.info + '<span>' + perluCek + ' setoran hasil impor namanya belum cocok ke sensus (tanda <b>cek</b>). Perbaiki lewat sheet <b>Impor_Review</b> lalu menu Zakat › Terapkan hasil review impor.</span></div>' : '') +
      '<section class="card"><div class="ch"><label class="search" style="flex:1 1 240px;height:44px">' + ICON.search + '<span class="sr">Cari</span><input id="sQ" type="search" placeholder="Cari nama jiwa, KK, atau amil…" value="' + esc(DS.q) + '"></label>' +
      '<div class="filters" role="group" aria-label="Filter jenis">' + [['', 'Semua'], ['FITRAH', 'Fitrah'], ['MAL', 'Mal'], ['TIJAROH', 'Tijaroh'], ['MAL_TIJAROH', 'Campuran'], ['FIDYAH', 'Fidyah']].map(function (f) {
        return '<button type="button" data-act="sKelas" data-k="' + f[0] + '" aria-pressed="' + (DS.kelas === f[0]) + '"' + (DS.kelas === f[0] ? ' class="on"' : '') + '>' + f[1] + '</button>';
      }).join('') + '</div><button type="button" class="btn sm" data-act="sCsv">Ekspor CSV</button></div><div id="sTbl">' + setoranTable(rows, true) + '</div></section></div>';
    $('#sTahun').addEventListener('change', function (e) { Z.viewSetoran(e.target.value); });
    var tm; $('#sQ').addEventListener('input', function (e) { DS.q = e.target.value; clearTimeout(tm); tm = setTimeout(function () { var r = DS.rows.filter(function (r) { return (!DS.kelas || r.kelas === DS.kelas || r.jenis === DS.kelas) && cocokCari(r, DS.q.toLowerCase()); }); $('#sTbl').innerHTML = setoranTable(r, true); }, 200); });
  }
  ACT.sKelas = function (el) { DS.kelas = el.getAttribute('data-k'); renderSetoran(); };
  ACT.sCsv = function () {
    csv('setoran-zakat-' + S.tahun + '.csv', [['Tanggal', 'Muzakki', 'Nama jiwa', 'Kelas', 'Jenis', 'Lampiran', 'JM', 'SM', 'JM luar', 'Kg beras', 'Wajib (Rp)', 'Diterima/Nominal (Rp)', 'Selisih (Rp)', 'Tujuan lebih', 'Status', 'Amil', 'Dicatat oleh', 'Sumber', 'Catatan']].concat(
      DS.rows.map(function (r) { return [r.tanggal, r.nama, (r.jiwaNama || []).join(', '), r.kelas, r.jenis, r.lampiran || '', r.jiwa ? r.jiwa.jm : '', r.jiwa ? r.jiwa.sm : '', r.jiwa ? r.jiwa.luar : '', r.kg || '', r.wajib || '', r.kelas === 'FITRAH' ? r.diterima : r.nominal, r.selisih || '', r.tujuan || '', r.status || '', r.amil, r.dicatat || '', r.sumber, r.catatan]; })));
  };
  ACT.hapusSetoran = function (el) {
    if (!confirm('Hapus setoran ' + el.getAttribute('data-nama') + '? Data ditandai terhapus dan tidak dihitung lagi.')) return;
    api(el.getAttribute('data-kelas') === 'FITRAH' ? 'hapusFitrah' : 'hapusLain', { id: el.getAttribute('data-id') })
      .then(function () { Z.toast('Setoran dihapus.'); S.kk = null; Z.viewSetoran(S.tahun); }).catch(Z.fail);
  };

  // =====================================================================
  // KONFIGURASI (admin)
  // =====================================================================
  var CF = null;
  Z.viewConfig = function (tahun) {
    Z.loading('Memuat konfigurasi…');
    Promise.all([Z.ensureBoot(), api('getConfig', { tahun: tahun || S.boot && S.boot.tahunAktif }), api('daftarSimpatisan')])
      .then(Z.jaga(function (r) { CF = r[1]; CF.sm = r[2]; renderConfig(); })).catch(Z.fail);
  };
  function renderConfig() {
    var c = CF.configs.filter(function (x) { return x.Tahun === CF.tahun; })[0] || CF.configs[CF.configs.length - 1];
    var RP = { Harga_Soq: 1, Tarif_Fidyah: 1 };
    var fld = function (k, label, hint, type) { var v = c[k] === undefined ? '' : c[k]; if (RP[k] && v !== '') v = nf(v); return '<label class="f">' + label + '<input class="fi" data-cfg="' + k + '" ' + (type ? 'type="' + type + '"' : '') + (RP[k] ? ' inputmode="numeric" data-rp' : '') + ' value="' + esc(v) + '"><span class="sub" style="font-weight:400">' + hint + '</span></label>'; };
    var pctRows = function (pre, items, keKey) {
      return '<table><thead><tr><th>Pos</th><th class="r">%</th></tr></thead><tbody>' + items.map(function (it) {
        return '<tr><td><b>' + it[1] + '</b>' + (it[0] === 'Mustahiq' ? ' <select class="fi" style="width:auto;height:36px;display:inline-block;margin-left:8px" data-cfg="' + keKey + '" aria-label="Mustahiq disetor ke"><option' + (c[keKey] === 'Kelompok' ? ' selected' : '') + '>Kelompok</option><option' + (c[keKey] === 'Desa' ? ' selected' : '') + '>Desa</option><option' + (c[keKey] === 'Daerah' ? ' selected' : '') + '>Daerah</option></select>' : '') + '</td>' +
          '<td class="r"><input class="fi" style="width:76px;height:38px;text-align:right" inputmode="decimal" data-cfg="' + pre + it[0] + '" data-sum="' + pre + '" value="' + esc(c[pre + it[0]]) + '" aria-label="Persen ' + it[1] + '"></td></tr>';
      }).join('') + '<tr class="tot"><td>Total</td><td class="r" id="sum_' + pre + '"></td></tr></tbody></table>';
    };
    var pos = [['Sabilillah', 'Sabilillah Daerah'], ['Mustahiq', 'Mustahiq'], ['AmilKlp', 'Amil Kelompok'], ['AmilDesa', 'Amil Desa'], ['AmilDaerah', 'Amil Daerah']];
    Z.app.innerHTML = '<div class="wrap"><div class="head"><div class="t"><h1>Konfigurasi</h1><p>Pengaturan per tahun. Data KK &amp; jamaah selalu dibaca langsung dari SENSUS BBK02.</p></div>' +
      '<label class="f" style="font-size:12px;color:var(--muted)">Tahun<select id="cTahun" class="fi" style="height:44px;font-weight:600">' + CF.configs.slice().reverse().map(function (x) { return '<option value="' + x.Tahun + '"' + (x.Tahun === c.Tahun ? ' selected' : '') + '>' + esc(x.Hijriah) + ' / ' + x.Tahun + ' · ' + x.Status + '</option>'; }).join('') + '</select></label>' +
      '<button type="button" class="btn" data-act="cTahunBaru">+ Tahun baru (salin dari tahun terakhir)</button></div>' +
      '<section class="card pad"><div style="display:flex;flex-wrap:wrap;align-items:center;gap:12px"><h2 style="flex:1">Tahun &amp; harga · ' + esc(c.Hijriah) + '</h2>' +
      '<label class="f" style="flex-direction:row;align-items:center;gap:8px">Status<select class="fi" style="width:auto;height:40px" data-cfg="Status"><option value="BUKA"' + (c.Status === 'BUKA' ? ' selected' : '') + '>Penerimaan dibuka</option><option value="TUTUP"' + (c.Status === 'TUTUP' ? ' selected' : '') + '>Ditutup</option></select></label></div>' +
      '<div class="fgrid">' + fld('Hijriah', 'Tahun Hijriah', 'Untuk judul laporan') + fld('Tgl_Idul_Fitri', 'Tanggal Idul Fitri', 'Dasar hitungan H-n di dashboard', 'date') +
      fld('Batas_Fitrah', 'Batas setor zakat fitrah', 'Format 2027-03-10 06:00 · sebelum shalat Ied, setelahnya form fitrah terkunci') + fld('Tutup_Rekap_Mal', 'Tutup rekap zakat mal', 'Setoran mal setelah tanggal ini = Susulan', 'date') +
      fld('Harga_Soq', 'Harga titip beras per soq (Rp)', 'Dikali jumlah jiwa untuk titip uang') + fld('Kg_Per_Soq', 'Berat 1 soq (kg)', 'Konversi soq ke kg') + fld('Tarif_Fidyah', 'Tarif fidyah per hari (Rp)', 'Bisa berbeda tiap tahun') + fld('Jiwa_Mustahiq', 'Jumlah jiwa mustahiq', 'Sementara diisi manual (fitur mustahiq di backlog)') + '</div>' +
      '<label class="f">Catatan<input class="fi" data-cfg="Catatan" value="' + esc(c.Catatan || '') + '"></label></section>' +
      '<div class="grid g2"><section class="card pad"><div><h2>Pembagian zakat fitrah</h2><span class="sub">Dalam soq beras, dibulatkan otomatis</span></div>' + pctRows('F_', pos, 'F_Mustahiq_Ke') + '</section>' +
      '<section class="card pad"><div><h2>Pembagian zakat mal &amp; tijaroh</h2><span class="sub">Dalam rupiah · berlaku juga untuk susulan</span></div>' + pctRows('M_', pos, 'M_Mustahiq_Ke') + '</section></div>' +
      '<button type="button" class="btn pri block" data-act="cSave" style="max-width:360px">Simpan konfigurasi ' + c.Tahun + '</button>' +

      card('Amil ' + esc(c.Hijriah), 'Saham dipakai untuk menghitung bagian amil kelompok · PIN pribadi dipakai amil untuk login (nama dikenali dari PIN)', '<div class="tbl"><table><thead><tr><th>Nama amil</th><th>Jabatan</th><th class="r">Saham</th><th>PIN login</th><th>Status</th><th></th></tr></thead><tbody>' +
        CF.amil.map(function (a, i) { return '<tr><td><b>' + esc(a.nama) + '</b>' + (a.idJamaah ? '' : ' <span class="chip warn" title="Belum terhubung ke data sensus">belum ke sensus</span>') + '</td><td>' + esc(a.jabatan) + '</td><td class="r">' + nf(a.saham, 1) + '</td><td>' + (a.punyaPin ? '<span class="chip ok">Sudah diatur</span>' : '<span class="chip red">Belum ada PIN</span>') + '</td><td>' + (a.aktif ? '<span class="chip ok">Aktif</span>' : '<span class="chip">Nonaktif</span>') + '</td><td class="r"><button type="button" class="btn sm" data-act="amilModal" data-i="' + i + '">Ubah</button></td></tr>'; }).join('') +
        '</tbody></table></div><div class="foot">' + CF.amil.filter(function (a) { return a.aktif; }).length + ' amil aktif · total ' + nf(CF.amil.filter(function (a) { return a.aktif; }).reduce(function (s, a) { return s + a.saham; }, 0), 1) + ' saham</div>',
        '<button type="button" class="btn pri sm" data-act="amilModal" data-i="-1">' + ICON.plus + 'Tambah amil</button>') +

      card('Master simpatisan', 'Berlaku lintas tahun · boleh terkait ke KK sensus atau berdiri sendiri', '<div class="tbl"><table><thead><tr><th>Nama</th><th>L/P</th><th>Terkait KK sensus</th><th>Hubungan</th><th></th></tr></thead><tbody>' +
        (CF.sm.length ? CF.sm.map(function (m, i) { return '<tr><td><b>' + esc(m.nama) + '</b></td><td>' + esc(m.jk || '—') + '</td><td><span class="chip ' + (m.kkNama ? 'mint' : 'blue') + '">' + esc(m.kkNama ? 'KK ' + m.kkNama : 'Berdiri sendiri') + '</span></td><td>' + esc(m.hubungan || '—') + '</td><td class="r"><button type="button" class="btn sm" data-act="smEdit" data-i="' + i + '">Ubah</button></td></tr>'; }).join('') : '<tr><td colspan="5" class="sub">Belum ada simpatisan.</td></tr>') +
        '</tbody></table></div>', '<button type="button" class="btn pri sm" data-act="smEdit" data-i="-1">' + ICON.plus + 'Tambah simpatisan</button>') +

      card('Pengguna Admin &amp; Pengurus', 'Login dengan PIN pribadi · nama dikenali dari PIN · 5 kali salah dikunci 15 menit · sesi 6 jam',
        '<div class="tbl"><table><thead><tr><th>Nama</th><th>Peran</th><th>PIN login</th><th>Status</th><th></th></tr></thead><tbody>' +
        CF.pengguna.map(function (u, i) { return '<tr><td><b>' + esc(u.nama) + '</b></td><td><span class="chip ' + (u.peran === 'ADMIN' ? 'mint' : 'blue') + '">' + (u.peran === 'ADMIN' ? 'Admin' : 'Pengurus') + '</span></td><td>' + (u.punyaPin ? '<span class="chip ok">Sudah diatur</span>' : '<span class="chip red">Belum ada PIN</span>') + '</td><td>' + (u.aktif ? '<span class="chip ok">Aktif</span>' : '<span class="chip">Nonaktif</span>') + '</td><td class="r"><button type="button" class="btn sm" data-act="userModal" data-i="' + i + '">Ubah</button></td></tr>'; }).join('') +
        '</tbody></table></div><div class="foot">Admin: semua menu &amp; koreksi data · Pengurus: hanya lihat dashboard · Amil: PIN diatur di tabel Amil di atas</div>',
        '<button type="button" class="btn pri sm" data-act="userModal" data-i="-1">' + ICON.plus + 'Tambah pengguna</button>') + '</div>';
    $('#cTahun').addEventListener('change', function (e) { Z.viewConfig(Number(e.target.value)); });
    var upSum = function () { ['F_', 'M_'].forEach(function (pre) { var s = 0; $$('[data-sum="' + pre + '"]').forEach(function (i) { s += Number(String(i.value).replace(',', '.')) || 0; }); var el = $('#sum_' + pre); el.textContent = nf(s, 1) + '%'; el.style.color = Math.abs(s - 100) < 0.001 ? 'var(--mintfg)' : 'var(--red)'; }); };
    $$('[data-sum]').forEach(function (i) { i.addEventListener('input', upSum); }); upSum();
    CF._c = c;
  }
  ACT.cSave = function (el) {
    var c = { Tahun: CF._c.Tahun };
    $$('[data-cfg]').forEach(function (i) { c[i.getAttribute('data-cfg')] = i.value; });
    var wrap = $('#app .wrap'); Z.sibuk(wrap, true);
    api('simpanConfig', { config: c }).then(function () { Z.toast('Konfigurasi ' + c.Tahun + ' tersimpan.'); S.boot = null; Z.viewConfig(c.Tahun); }).catch(function (e) { Z.sibuk(wrap, false); Z.fail(e); });
  };
  ACT.cTahunBaru = function () {
    var last = CF.configs[CF.configs.length - 1];
    if (!confirm('Buat tahun ' + (last.Tahun + 1) + '? Pengaturan & daftar amil disalin dari ' + last.Tahun + ', dan tahun yang masih dibuka akan ditutup.')) return;
    api('tahunBaru').then(function (all) { Z.toast('Tahun ' + all[all.length - 1].Tahun + ' dibuat. Isi tanggal & cek harganya.'); S.boot = null; Z.viewConfig(all[all.length - 1].Tahun); }).catch(Z.fail);
  };
  function pinField(id, baru) {
    return '<label class="f">PIN login (6 digit)<input id="' + id + '" class="fi" type="password" inputmode="numeric" maxlength="6" autocomplete="new-password" placeholder="' + (baru ? 'Wajib diisi' : 'Kosongkan bila tidak diubah') + '">' +
      '<span class="sub" style="font-weight:400">PIN harus berbeda dari pengguna lain, karena dari PIN inilah nama dikenali saat login.</span></label>';
  }
  ACT.userModal = function (el) {
    var i = Number(el.getAttribute('data-i')), u = i >= 0 ? CF.pengguna[i] : { nama: '', peran: 'PENGURUS', aktif: true };
    Z.openModal('<div class="mh"><h2>' + (i >= 0 ? 'Ubah pengguna' : 'Tambah pengguna') + '</h2><button type="button" class="btn sm" data-act="close" aria-label="Tutup">' + ICON.x + '</button></div>' +
      '<label class="f">Nama<input id="usNama" class="fi" value="' + esc(u.nama) + '"></label>' +
      '<label class="f">Peran<select id="usPeran" class="fi"><option value="ADMIN"' + (u.peran === 'ADMIN' ? ' selected' : '') + '>Admin — semua menu &amp; koreksi data</option><option value="PENGURUS"' + (u.peran !== 'ADMIN' ? ' selected' : '') + '>Pengurus — hanya lihat dashboard</option></select></label>' +
      pinField('usPin', i < 0) +
      '<label class="check" style="border:0"><input type="checkbox" id="usAktif"' + (u.aktif ? ' checked' : '') + '><span class="nm"><b>Aktif</b><span>Pengguna nonaktif tidak bisa login</span></span></label>' +
      '<button type="button" class="btn pri block" id="usSave">Simpan pengguna</button>');
    $('#usSave').addEventListener('click', function () {
      var pin = $('#usPin').value;
      if (pin && !/^\d{6}$/.test(pin)) { Z.toast('PIN harus 6 digit angka.', true); return; }
      var box = $('#modal .box'); Z.sibuk(box, true);
      api('simpanPengguna', { user: { id: i >= 0 ? u.id : '', nama: $('#usNama').value, peran: $('#usPeran').value, pin: pin, aktif: $('#usAktif').checked } })
        .then(function (list) { CF.pengguna = list; Z.closeModal(); Z.toast('Pengguna tersimpan.'); renderConfig(); }).catch(function (e) { Z.sibuk(box, false); Z.fail(e); });
    });
  };
  ACT.smEdit = function (el) {
    var i = Number(el.getAttribute('data-i')), m = i >= 0 ? CF.sm[i] : {};
    Z.smModal(m, function (id, list) { CF.sm = list; renderConfig(); });
  };
  /** Di HP, pastikan daftar hasil tidak tertutup keyboard. */
  function tampil(el) { try { el.scrollIntoView({ block: 'nearest' }); } catch (e) { /* browser lama */ } }
  ACT.amilModal = function (el) {
    var i = Number(el.getAttribute('data-i')), a = i >= 0 ? CF.amil[i] : { nama: '', jabatan: 'Amil', saham: 1, aktif: true, idJamaah: '' };
    var pick = a.idJamaah ? { id: a.idJamaah, nama: a.nama } : null;
    Z.openModal('<div class="mh"><h2>' + (i >= 0 ? 'Ubah amil' : 'Tambah amil') + '</h2><button type="button" class="btn sm" data-act="close" aria-label="Tutup">' + ICON.x + '</button></div>' +
      '<label class="f">Cari dari jamaah sensus<span class="search">' + ICON.search + '<input id="amQ" type="search" placeholder="Ketik nama…" value="' + esc(a.nama) + '"></span></label><div class="results hidden" id="amRes"></div>' +
      '<label class="f">Nama amil (tampil di aplikasi)<input id="amNama" class="fi" value="' + esc(a.nama) + '"></label>' +
      '<div class="fgrid"><label class="f">Jabatan<input id="amJab" class="fi" value="' + esc(a.jabatan) + '"></label><label class="f">Saham<input id="amSaham" class="fi" inputmode="decimal" value="' + esc(a.saham) + '"></label></div>' +
      pinField('amPin', i < 0) +
      '<label class="check" style="border:0"><input type="checkbox" id="amAktif"' + (a.aktif ? ' checked' : '') + '><span class="nm"><b>Aktif tahun ini</b><span>Amil nonaktif tidak bisa login dan tidak dapat saham</span></span></label>' +
      '<button type="button" class="btn pri block" id="amSave">Simpan amil</button>');
    var tm;
    $('#amQ').addEventListener('input', function (e) {
      clearTimeout(tm); var q = e.target.value.trim(), el2 = $('#amRes');
      if (q.length < 2) { el2.classList.add('hidden'); return; }
      el2.classList.remove('hidden'); el2.innerHTML = '<p class="sub" style="padding:12px;margin:0"><span class="spin"></span>Mencari nama di sensus…</p>';
      tampil(el2);
      tm = setTimeout(function () {
        Z.cariNama(q).then(function (r) {
          if ($('#amQ') === null || $('#amQ').value.trim() !== q) return; // sudah diketik ulang / modal ditutup
          r = r.filter(function (x) { return x.tipe === 'JM'; });
          el2.innerHTML = r.length ? r.map(function (x, k) { return '<button type="button" data-k="' + k + '"><span class="nm"><b>' + esc(x.nama) + '</b><span>' + esc(x.info) + '</span></span></button>'; }).join('') : '<p class="sub" style="padding:12px;margin:0">Nama tidak ditemukan di sensus.</p>';
          $$('button', el2).forEach(function (b) { b.addEventListener('click', function () { var x = r[Number(b.getAttribute('data-k'))]; pick = x; $('#amNama').value = x.nama; $('#amQ').value = x.nama; el2.classList.add('hidden'); }); });
          tampil(el2);
        }).catch(function (er) { el2.classList.add('hidden'); Z.fail(er); });
      }, 300);
    });
    $('#amSave').addEventListener('click', function () {
      var pin = $('#amPin').value;
      if (pin && !/^\d{6}$/.test(pin)) { Z.toast('PIN harus 6 digit angka.', true); return; }
      var box = $('#modal .box'); Z.sibuk(box, true);
      api('simpanAmil', { tahun: CF.tahun, amil: { id: i >= 0 ? a.id : '', nama: $('#amNama').value, idJamaah: pick ? pick.id : '', jabatan: $('#amJab').value, saham: String($('#amSaham').value).replace(',', '.'), aktif: $('#amAktif').checked, pin: pin } })
        .then(function (list) { CF.amil = list; Z.closeModal(); Z.toast('Amil tersimpan.'); S.boot = null; renderConfig(); }).catch(function (e) { Z.sibuk(box, false); Z.fail(e); });
    });
  };
})();
