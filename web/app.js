/* Zakat BBK02 — frontend (vanilla JS). Data selalu lewat Apps Script API. */
(function () {
  'use strict';

  // ---------- util ----------
  var $ = function (s, el) { return (el || document).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var nf = function (n, d) { n = Number(n) || 0; return n.toLocaleString('id-ID', { minimumFractionDigits: d || 0, maximumFractionDigits: d === undefined ? 0 : d }); };
  var kgf = function (n) { return nf(n, Math.round(n * 10) % 10 ? 1 : 0); };
  var rp = function (n) { n = Math.round(Number(n) || 0); return (n < 0 ? '−Rp ' : 'Rp ') + nf(Math.abs(n)); };
  var rpShort = function (n) { n = Number(n) || 0; if (Math.abs(n) >= 1e6) return 'Rp ' + nf(n / 1e6, n % 1e6 ? 1 : 0) + ' jt'; if (Math.abs(n) >= 1e3) return 'Rp ' + nf(n / 1e3) + ' rb'; return rp(n); };
  var pct = function (x, d) { return nf((Number(x) || 0) * 100, d === undefined ? 1 : d) + '%'; };
  var parseNum = function (s) { s = String(s || '').replace(/[^\d,-]/g, '').replace(',', '.'); return Number(s) || 0; };
  var today = function () { var d = new Date(Date.now() + 7 * 3600e3); return d.toISOString().slice(0, 10); };
  var tglId = function (s) { if (!s) return '—'; var b = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']; var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/); if (!m) return s; return +m[3] + ' ' + b[+m[2] - 1] + (m[4] ? ' ' + m[4] + ':' + m[5] : ''); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { } }
  };
  var ICON = {
    plus: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14"/><path d="M5 12h14"/></svg>',
    back: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>',
    chev: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94A3A0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>',
    search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5B6B66" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
    info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>',
    clock: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
    x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>'
  };

  // ---------- state ----------
  // zakat_tahun = tahun aktif terakhir (bukan data setoran), supaya saat refresh data halaman bisa diambil paralel dengan bootstrap
  var S = { token: store.get('zakat_token'), role: store.get('zakat_role'), nama: store.get('zakat_nama'), idAmil: store.get('zakat_idAmil'), boot: null, kk: null, tahun: Number(store.get('zakat_tahun')) || null };
  var device = store.get('zakat_device') || (function () { var d = 'd' + Math.random().toString(36).slice(2) + Date.now().toString(36); store.set('zakat_device', d); return d; })();
  var app = $('#app');

  // Aksi yang hanya membaca. Aksi lain yang berhasil dianggap mengubah data → cache memori dikosongkan.
  var BACA = { ping: 1, login: 1, logout: 1, bootstrap: 1, kkList: 1, cariMuzakki: 1, getFitrah: 1, daftarSimpatisan: 1, dashboard: 1, tren: 1, daftarSetoran: 1, getConfig: 1, daftarPengguna: 1 };
  function api(action, params) {
    var body = Object.assign({ action: action, token: S.token }, params || {});
    return fetch(window.ZAKAT_CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j.ok) {
          if (j.sesiHabis) { logoutLocal(); toast('Sesi berakhir, silakan masuk lagi.', true); go('#/login'); }
          throw new Error(j.error || 'Gagal');
        }
        if (!BACA[action]) { Object.keys(RC).forEach(function (k) { RC[k].t = 0; }); CARI = {}; PENDING = {}; }
        return j.data;
      });
  }

  /*
   * Cache respons baca di MEMORI saja (tidak di localStorage: data setoran tidak boleh tersimpan di HP).
   * apiCepat: bila halaman pernah dibuka, langsung tampilkan data terakhir, lalu ambil versi terbaru
   * di latar belakang dan render ulang hanya bila datanya berubah dan pengguna masih di halaman yang sama.
   */
  var RC = {}, SEGAR_MS = 20000;
  function rcKey(action, params) { return action + '|' + JSON.stringify(params || {}); }
  /** Satu permintaan per data: halaman dan prefetch yang meminta data sama memakai permintaan yang sama. */
  var PENDING = {};
  function ambil(k, action, params) {
    if (PENDING[k]) return PENDING[k];
    var p = api(action, params).then(function (d) {
      if (PENDING[k] === p) delete PENDING[k];
      RC[k] = { data: d, s: JSON.stringify(d), t: Date.now() };
      return d;
    }, function (e) { if (PENDING[k] === p) delete PENDING[k]; throw e; });
    PENDING[k] = p;
    return p;
  }
  function apiCepat(action, params, onData) {
    var k = rcKey(action, params), hit = RC[k], r0 = RUTE, lama = hit ? hit.s : null;
    if (hit) {
      onData(hit.data, true);
      if (Date.now() - hit.t < SEGAR_MS) return Promise.resolve(hit.data);
    }
    return ambil(k, action, params).then(function (d) {
      if (r0 === RUTE && RC[k].s !== lama) onData(d, false);
      return d;
    }, function (e) { if (!hit) throw e; });
  }
  /*
   * Penjaga perpindahan halaman: setiap navigasi menaikkan RUTE. Respons yang datang setelah
   * pengguna pindah halaman diabaikan, supaya konten halaman lama tidak menimpa halaman baru.
   */
  var RUTE = 0;
  function jaga(fn) { var r0 = RUTE; return function () { if (r0 !== RUTE) return; return fn.apply(this, arguments); }; }
  /** Kunci semua isian di dalam root selama proses simpan, lalu buka lagi bila gagal. */
  function sibuk(root, on) {
    if (!root) return;
    if (on) {
      root._kunci = $$('input,select,textarea,button', root).filter(function (e) { return !e.disabled; });
      root._kunci.forEach(function (e) { e.disabled = true; });
      root.setAttribute('aria-busy', 'true');
    } else {
      (root._kunci || []).forEach(function (e) { e.disabled = false; });
      root._kunci = null; root.removeAttribute('aria-busy');
    }
  }
  /** Format rupiah saat mengetik (input[data-rp]): 1250000 -> 1.250.000, posisi kursor dipertahankan. */
  document.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !el.hasAttribute || !el.hasAttribute('data-rp')) return;
    var v = el.value, pos = el.selectionStart === null ? v.length : el.selectionStart;
    var digitSebelum = v.slice(0, pos).replace(/\D/g, '').length;
    var angka = v.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    var baru = angka ? nf(Number(angka)) : '';
    if (baru === v) return;
    el.value = baru;
    var i = 0, n = 0;
    while (i < baru.length && n < digitSebelum) { if (/\d/.test(baru[i])) n++; i++; }
    try { el.setSelectionRange(i, i); } catch (er) { /* type tidak mendukung */ }
  }, true);

  /** Cari nama jamaah/simpatisan (cariMuzakki) dengan cache per kata kunci di memori. */
  var CARI = {};
  function cariNama(q) {
    var k = String(q).toLowerCase().trim();
    if (CARI[k]) return Promise.resolve(CARI[k]);
    return api('cariMuzakki', { q: q }).then(function (r) { CARI[k] = r; return r; });
  }

  /** Ambil ulang tanpa cache (tombol Muat ulang): lewati cache memori dan cache server. */
  function apiSegar(action, params) {
    return api(action, Object.assign({ segar: true }, params || {})).then(function (d) {
      RC[rcKey(action, params)] = { data: d, s: JSON.stringify(d), t: Date.now() };
      return d;
    });
  }
  /** Muat diam-diam halaman yang kemungkinan dibuka berikutnya, supaya terasa instan. */
  var prefetched = false;
  function prefetch() {
    if (prefetched || !S.token) return;
    prefetched = true;
    setTimeout(function () {
      var t = S.tahun || (S.boot && S.boot.tahunAktif);
      // halaman pembuka (Pemantauan) sudah diminta sendiri; ini menyiapkan halaman berikutnya
      var list = [['dashboard', { tahun: t }]];
      if (S.role !== 'pengurus') list.push(['kkList', undefined]);
      list.push(['tren', undefined]);
      list.forEach(function (x) {
        var k = rcKey(x[0], x[1]);
        if (RC[k]) return;
        ambil(k, x[0], x[1]).catch(function () { });
      });
    }, 300);
  }

  function toast(msg, err) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast' + (err ? ' err' : '');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = 'toast hidden'; }, err ? 5000 : 2600);
  }
  function fail(e) { toast(e && e.message ? e.message : String(e), true); }
  function loading(msg) { app.innerHTML = '<div class="loading"><span class="spin"></span>' + esc(msg || 'Memuat…') + '</div>'; }
  function go(h) { if (location.hash === h) route(); else location.hash = h; }

  function openModal(html) { var m = $('#modal'); m.innerHTML = '<div class="box">' + html + '</div>'; m.classList.remove('hidden'); var f = $('input,select,textarea,button', m); if (f) f.focus(); }
  function closeModal() { var m = $('#modal'); m.classList.add('hidden'); m.innerHTML = ''; }
  $('#modal').addEventListener('click', function (e) { if (e.target.id === 'modal') closeModal(); });

  function logoutLocal() { ['zakat_token', 'zakat_role', 'zakat_nama', 'zakat_idAmil'].forEach(store.del); S.token = S.role = S.nama = S.idAmil = null; S.boot = null; S.kk = null; RC = {}; prefetched = false; }

  // ---------- topbar ----------
  var NAV = [
    { h: '#/amil', t: 'Input Setoran', roles: ['admin', 'amil'] },
    { h: '#/dash', t: 'Pemantauan', roles: ['admin', 'amil', 'pengurus'] },
    { h: '#/tren', t: 'Tren Tahunan', roles: ['admin', 'amil', 'pengurus'] },
    { h: '#/setoran', t: 'Data Setoran', roles: ['admin', 'amil', 'pengurus'] },
    { h: '#/mustahiq', t: 'Mustahiq', roles: ['admin', 'pengurus'] },
    { h: '#/laporan', t: 'Laporan', roles: ['admin', 'pengurus'] },
    { h: '#/config', t: 'Konfigurasi', roles: ['admin'] }
  ];
  function renderTop(active) {
    var tb = $('#topbar');
    if (!S.token) { tb.classList.add('hidden'); return; }
    tb.classList.remove('hidden');
    $('#nav').innerHTML = NAV.filter(function (n) { return n.roles.indexOf(S.role) >= 0; }).map(function (n) {
      return '<a href="' + n.h + '"' + (active.indexOf(n.h) === 0 ? ' class="on" aria-current="page"' : '') + '>' + n.t + '</a>';
    }).join('');
    $('#roleChip').textContent = (S.role === 'amil' ? 'Amil' : S.role === 'admin' ? 'Admin' : 'Pengurus') + (S.nama ? ' · ' + S.nama : '');
    $('#roleChip').className = 'chip ' + (S.role === 'pengurus' ? 'blue' : 'mint');
  }

  function ensureBoot(tahun) {
    if (S.boot && (!tahun || S.boot.config.Tahun === Number(tahun))) return Promise.resolve(S.boot);
    if (ensureBoot._p && !tahun) return ensureBoot._p;
    var p = api('bootstrap', tahun ? { tahun: tahun } : {}).then(function (b) {
      S.boot = b; if (!S.tahun) S.tahun = b.tahunAktif; store.set('zakat_tahun', String(b.tahunAktif)); prefetch(); ensureBoot._p = null; return b;
    }, function (e) { ensureBoot._p = null; throw e; });
    if (!tahun) ensureBoot._p = p;
    return p;
  }

  // ---------- router ----------
  function route() {
    var h = location.hash || '#/';
    RUTE++;
    closeModal();
    if (!S.token && h.indexOf('#/login') !== 0) { go('#/login'); return; }
    renderTop(h);
    document.body.classList.toggle('formview', /^#\/(fitrah|lain)/.test(h));
    var parts = h.replace(/^#\//, '').split('?');
    var seg = parts[0].split('/'), q = {};
    (parts[1] || '').split('&').forEach(function (kv) { if (kv) { var a = kv.split('='); q[a[0]] = decodeURIComponent(a[1] || ''); } });
    window.scrollTo(0, 0);
    switch (seg[0]) {
      case 'login': return viewLogin();
      case 'amil': return viewAmil();
      case 'fitrah': return viewFitrah(decodeURIComponent(seg[1] || ''), q);
      case 'lain': return viewLain(q);
      case 'dash': return viewDash(q.tahun);
      case 'tren': return viewTren();
      case 'setoran': return viewSetoran(q.tahun);
      case 'config': return viewConfig(q.tahun);
      // D-35/D-36: amil tidak punya akses (backend juga menolak)
      case 'mustahiq': if (S.role === 'amil') return go('#/dash'); return window.__Z.viewMustahiq(q.tahun);
      case 'laporan': if (S.role === 'amil') return go('#/dash'); return window.__Z.viewLaporan(q);
      case 'konsistensi': if (S.role !== 'admin') return go('#/dash'); return window.__Z.viewKonsistensi(q);
      default: go('#/dash');
    }
  }
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) { /* browser lama */ }
  window.addEventListener('hashchange', route);

  // ---------- event delegation ----------
  var ACT = {};
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var fn = ACT[el.getAttribute('data-act')];
    if (fn) { e.preventDefault(); fn(el, e); }
  });
  ACT.logout = function () { api('logout').catch(function () { }); logoutLocal(); go('#/login'); };
  ACT.close = closeModal;
  /** Tombol x di kolom cari: kosongkan isian lalu picu 'input' supaya daftar/filter ikut direset. */
  ACT.hapusCari = function (el) {
    var box = el.closest('.search'), inp = box ? $('input', box) : null;
    if (!inp) return;
    inp.value = '';
    var ev; try { ev = new Event('input', { bubbles: true }); } catch (e) { ev = document.createEvent('Event'); ev.initEvent('input', true, true); }
    inp.dispatchEvent(ev);
    inp.focus();
  };
  ACT.go = function (el) { go(el.getAttribute('data-h')); };

  // =====================================================================
  // LOGIN
  // =====================================================================
  var L = { pin: '' };
  function viewLogin() {
    if (S.token) { go('#/'); return; }
    L.pin = '';
    renderLogin();
  }
  function renderLogin(msg, busy) {
    var dots = '';
    for (var i = 0; i < 6; i++) dots += '<span class="' + (i < L.pin.length ? 'f' : '') + '"></span>';
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map(function (k) {
      if (!k) return '<span></span>';
      if (k === 'del') return '<button type="button" class="ghost" data-act="pinDel" aria-label="Hapus satu digit">⌫</button>';
      return '<button type="button" data-act="pinKey" data-k="' + k + '">' + k + '</button>';
    }).join('');
    app.innerHTML = '<div class="login"><div class="hero"><div class="ic">' +
      '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18"/><path d="M5 21V10l7-6 7 6v11"/><path d="M9 21v-6h6v6"/></svg></div>' +
      '<div style="display:flex;flex-direction:column;gap:6px"><h1>Zakat Idul Fitri</h1><p>Kelompok Babakan Barat</p></div></div>' +
      '<form id="loginForm" autocomplete="off">' +
      '<div style="text-align:center;display:flex;flex-direction:column;gap:4px"><h2 style="font-size:19px;font-weight:700">Masukkan PIN Anda</h2><p class="sub" style="margin:0">PIN pribadi dari admin. Nama Anda dikenali otomatis.</p></div>' +
      '<label class="sr" for="pinInput">PIN</label><input id="pinInput" class="sr" type="password" inputmode="numeric" autocomplete="off" maxlength="6">' +
      '<div class="dots" aria-hidden="true">' + dots + '</div><div class="keys">' + keys + '</div>' +
      (msg ? '<div class="note red">' + ICON.info + '<span>' + esc(msg) + '</span></div>' : '') +
      '<button type="submit" class="btn pri block"' + (L.pin.length < 6 || busy ? ' disabled' : '') + '>' + (busy ? '<span class="spin"></span>Memeriksa…' : 'Masuk') + '</button></form>' +
      '<p class="sub" style="margin:18px 28px">5 kali PIN salah, login dikunci 15 menit. Sesi berakhir otomatis setelah 6 jam.</p></div>';
    var pi = $('#pinInput');
    pi.value = L.pin;
    pi.addEventListener('input', function () { L.pin = pi.value.replace(/\D/g, '').slice(0, 6); renderLogin(); var p2 = $('#pinInput'); if (p2) p2.focus(); if (L.pin.length === 6) doLogin(); });
    $('#loginForm').addEventListener('submit', function (e) { e.preventDefault(); doLogin(); });
  }
  document.addEventListener('keydown', function (e) {
    if (!$('#loginForm') || L.busy || document.activeElement && document.activeElement.id === 'pinInput') return;
    if (/^\d$/.test(e.key) && L.pin.length < 6) { L.pin += e.key; renderLogin(); if (L.pin.length === 6) doLogin(); }
    else if (e.key === 'Backspace') { L.pin = L.pin.slice(0, -1); renderLogin(); }
  });
  ACT.pinKey = function (el) { if (!L.busy && L.pin.length < 6) { L.pin += el.getAttribute('data-k'); renderLogin(); if (L.pin.length === 6) doLogin(); } };
  ACT.pinDel = function () { L.pin = L.pin.slice(0, -1); renderLogin(); };
  function doLogin() {
    if (L.pin.length < 6 || L.busy) return;
    L.busy = true; renderLogin('', true);
    api('login', { pin: L.pin, device: device }).then(function (r) {
      L.busy = false; L.pin = '';
      S.token = r.token; S.role = r.role; S.nama = r.nama; S.idAmil = r.idAmil;
      store.set('zakat_token', r.token); store.set('zakat_role', r.role); store.set('zakat_nama', r.nama || ''); store.set('zakat_idAmil', r.idAmil || '');
      toast('Assalamu\'alaikum, ' + r.nama + '.');
      go('#/dash');
    }).catch(function (e) { L.busy = false; L.pin = ''; renderLogin(e.message); });
  }

  // =====================================================================
  // AMIL: beranda & daftar KK
  // =====================================================================
  var AH = { filter: 'SEMUA', q: '' };
  function viewAmil() {
    if (!RC[rcKey('kkList')]) loading('Memuat daftar keluarga…');
    var boot = ensureBoot();
    apiCepat('kkList', undefined, function (d) {
      boot.then(jaga(function () {
        S.kk = d;
        // jangan merusak ketikan di kolom cari: cukup perbarui daftarnya
        if (document.activeElement && document.activeElement.id === 'kkQ' && $('#kkList')) renderKKList(); else renderAmil();
      }));
    }).catch(fail);
    boot.catch(fail);
  }
  function batasInfo(b) {
    var c = b.config;
    if (c.Status !== 'BUKA') return '<div class="note warn">' + ICON.info + '<span><b>Penerimaan ' + esc(c.Hijriah) + ' sudah ditutup.</b> Zakat mal/tijaroh tetap bisa dicatat sebagai susulan.</span></div>';
    if (b.batasLewat) return '<div class="note red">' + ICON.clock + '<span><b>Batas zakat fitrah sudah lewat</b> (' + esc(c.Batas_Fitrah) + '). Form zakat fitrah dikunci sesuai syariat.</span></div>';
    return c.Batas_Fitrah ? '<div class="note warn">' + ICON.clock + '<span><b>Batas zakat fitrah: ' + esc(tglId(c.Batas_Fitrah.replace(' ', 'T'))) + '</b> (sebelum shalat Ied). Setelah itu form fitrah terkunci.</span></div>' : '';
  }
  function renderAmil() {
    var b = S.boot, d = S.kk, c = b.config;
    var cnt = { SEMUA: d.list.length, BELUM: 0, SEBAGIAN: 0, SUDAH: 0, KURANG: 0 };
    d.list.forEach(function (k) { cnt[k.status]++; });
    var kunci = S.role === 'amil' && (b.batasLewat || c.Status !== 'BUKA');
    var saya = d.saya || { kk: 0, soq: 0, uang: 0 };
    app.innerHTML =
      '<div class="mhead"><div class="in2">' +
      '<div style="display:flex;flex-direction:column;gap:2px"><span style="font-size:12px;color:#A9C4BB">' + (S.role === 'amil' ? 'Amil' : 'Admin') + ' · ' + esc(c.Hijriah) + ' / ' + c.Tahun + '</span><b style="font-size:18px">' + esc(S.nama || 'Admin') + '</b></div>' +
      (S.role === 'amil' ? '<div class="mstats"><div><span>KK saya</span><b>' + saya.kk + '</b></div><div><span>Soq</span><b>' + saya.soq + '</b></div><div><span>Uang diterima</span><b style="font-size:15px;line-height:1.6">' + rpShort(saya.uang) + '</b></div></div>' : '') +
      '</div></div>' +
      '<div class="wrap narrow" style="padding-top:16px">' + batasInfo(b) +
      '<div class="actions">' +
      '<button type="button" class="btn pri" data-act="go" data-h="#/fitrah/_sm"' + (kunci ? ' disabled' : '') + '>' + ICON.plus + 'Fitrah simpatisan</button>' +
      '<button type="button" class="btn" data-act="go" data-h="#/lain?jenis=MAL">Mal / Tijaroh</button>' +
      '<button type="button" class="btn" data-act="go" data-h="#/lain?jenis=FIDYAH">Fidyah</button></div>' +
      '<div style="display:flex;flex-direction:column;gap:10px"><h2 style="font-size:16px">Zakat fitrah per keluarga (dari sensus)</h2>' +
      '<label class="search">' + ICON.search + '<span class="sr">Cari nama KK atau anggota</span><input id="kkQ" type="search" placeholder="Nama KK atau anggota…" value="' + esc(AH.q) + '"><button type="button" class="clr" data-act="hapusCari" aria-label="Hapus pencarian">' + ICON.x + '</button></label>' +
      '<div class="filters" role="group" aria-label="Filter status">' +
      [['SEMUA', 'Semua'], ['BELUM', 'Belum'], ['SEBAGIAN', 'Sebagian'], ['KURANG', 'Kurang bayar'], ['SUDAH', 'Sudah']].map(function (f) {
        return '<button type="button" data-act="kkFilter" data-f="' + f[0] + '" aria-pressed="' + (AH.filter === f[0]) + '"' + (AH.filter === f[0] ? ' class="on"' : '') + '>' + f[1] + ' ' + cnt[f[0]] + '</button>';
      }).join('') + '</div></div>' +
      '<ul class="list" id="kkList"></ul></div>';
    renderKKList();
    $('#kkQ').addEventListener('input', function (e) { AH.q = e.target.value; renderKKList(); });
  }
  function renderKKList() {
    var q = AH.q.toLowerCase().trim();
    var rows = S.kk.list.filter(function (k) {
      if (AH.filter !== 'SEMUA' && k.status !== AH.filter) return false;
      if (!q) return true;
      return k.nama.toLowerCase().indexOf(q) >= 0 || k.anggota.some(function (a) { return a.nama.toLowerCase().indexOf(q) >= 0; });
    });
    var chip = { BELUM: ['red', 'Belum'], SEBAGIAN: ['warn', 'Sebagian'], SUDAH: ['ok', 'Sudah'], KURANG: ['red', 'Kurang bayar'] };
    $('#kkList').innerHTML = rows.length ? rows.map(function (k) {
      var luar = k.anggota.filter(function (a) { return a.keberadaan && a.keberadaan !== 'Menetap'; }).length;
      var info = (k.tanpaKK ? 'Tanpa KK · ' : '') + k.jiwa + ' jiwa' + (luar ? ' · ' + luar + ' di luar' : '') + (k.simpatisan.length ? ' · +' + k.simpatisan.length + ' SM terkait' : '') + (k.kurangRp ? ' · kurang ' + rp(k.kurangRp) : '');
      var ch = chip[k.status];
      return '<li><a href="#/fitrah/' + encodeURIComponent(k.id) + '"><span class="nm"><b>' + esc(k.nama) + '</b><span>' + esc(info) + '</span></span>' +
        '<span class="chip ' + ch[0] + '">' + ch[1] + (k.status === 'SEBAGIAN' || k.status === 'SUDAH' ? ' ' + k.sudah + '/' + k.jiwa : '') + '</span>' + ICON.chev + '</a></li>';
    }).join('') : '<li class="sub" style="padding:16px;text-align:center">Tidak ada keluarga yang cocok.</li>';
  }
  ACT.kkFilter = function (el) { AH.filter = el.getAttribute('data-f'); renderAmil(); };

  // (bagian lain ditambahkan di bawah)
  window.__Z = { $: $, $$: $$, esc: esc, nf: nf, kgf: kgf, rp: rp, rpShort: rpShort, pct: pct, parseNum: parseNum, today: today, tglId: tglId, store: store, ICON: ICON, S: S, api: api, toast: toast, fail: fail, loading: loading, go: go, openModal: openModal, closeModal: closeModal, ACT: ACT, ensureBoot: ensureBoot, apiCepat: apiCepat, apiSegar: apiSegar, jaga: jaga, sibuk: sibuk, cariNama: cariNama, rcKey: rcKey, RC: function () { return RC; }, batasInfo: batasInfo, app: app };

  // placeholder, diisi oleh app2.js
  function viewFitrah(id, q) { window.__Z.viewFitrah(id, q); }
  function viewLain(q) { window.__Z.viewLain(q); }
  function viewDash(t) { window.__Z.viewDash(t); }
  function viewTren() { window.__Z.viewTren(); }
  function viewSetoran(t) { window.__Z.viewSetoran(t); }
  function viewConfig(t) { window.__Z.viewConfig(t); }

  document.addEventListener('DOMContentLoaded', route);
  if (document.readyState !== 'loading') setTimeout(route, 0);
})();
