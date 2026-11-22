/** Pencocok nama ke data sensus (dipakai impor & pencarian). */
var TITLE_WORDS = ['h', 'hj', 'haji', 'hajah', 'bpk', 'bp', 'bapak', 'pak', 'ibu', 'bu', 'ust', 'ustadz', 'sdr', 'era', 'sm', 'jm', 'alm', 'almh', 'dr', 'ir'];
var NAME_ALIAS = { muhammad: 'm', muhamad: 'm', mohammad: 'm', mohamad: 'm', moch: 'm', mochammad: 'm', moh: 'm', muh: 'm', mhd: 'm', achmad: 'ahmad', akhmad: 'ahmad' };

function normName_(s) {
  s = String(s || '').toLowerCase();
  s = s.replace(/\(([^)]*)\)/g, ' $1 ');
  s = s.replace(/[^a-z\s]/g, ' ');
  var toks = s.split(/\s+/).filter(function (t) { return t && TITLE_WORDS.indexOf(t) < 0; });
  return toks.map(function (t) { return NAME_ALIAS[t] || t; });
}

function lev_(a, b) {
  if (a === b) return 0;
  var m = a.length, n = b.length, d = [], i, j;
  for (i = 0; i <= m; i++) { d[i] = [i]; }
  for (j = 1; j <= n; j++) { d[0][j] = j; }
  for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return d[m][n];
}

function tokSim_(a, b) {
  if (a === b) return 1;
  if (a.length === 1 || b.length === 1) return a[0] === b[0] ? 0.6 : 0;
  var L = Math.max(a.length, b.length);
  var dist = lev_(a, b);
  if (L >= 5 && dist <= 2) return 1 - dist * 0.12;
  if (L >= 3 && dist <= 1) return 0.85;
  if (a.length >= 4 && b.length >= 4 && (a.indexOf(b) === 0 || b.indexOf(a) === 0)) return 0.8;
  return 0;
}

// skor 0..1: F-measure kecocokan token dua arah, atau kemiripan nama utuh (tanpa spasi)
function sideScore_(a, b) {
  var used = {}, sum = 0;
  a.forEach(function (t) {
    var best = 0, bi = -1;
    b.forEach(function (u, i) { if (used[i]) return; var s = tokSim_(t, u); if (s > best) { best = s; bi = i; } });
    if (bi >= 0 && best > 0) used[bi] = 1;
    sum += best;
  });
  return sum / a.length;
}
function nameScore_(qt, ct) {
  if (!qt.length || !ct.length) return 0;
  var r = sideScore_(qt, ct), p = sideScore_(ct, qt);
  var f = r * (0.8 + 0.2 * p); // nama lama sering lebih pendek: utamakan token query yang ketemu
  var jq = qt.join(''), jc = ct.join('');
  var whole = 1 - lev_(jq, jc) / Math.max(jq.length, jc.length);
  return Math.max(f, whole);
}

// kandidat: [{id, idKeluarga, nama, tipe:'KK'|'JM'}]
function matchName_(query, kandidat) {
  var qt = normName_(query), best = null, second = 0;
  kandidat.forEach(function (c) {
    if (!c._t) c._t = normName_(c.nama);
    var s = nameScore_(qt, c._t);
    if (c.tipe === 'KK') s += 0.03; // utamakan kepala keluarga
    if (!best || s > best.skor) { if (best && best.c.id !== c.id) second = best.skor; best = { skor: s, c: c }; }
    else if (c.id !== best.c.id && s > second) second = s;
  });
  if (!best) return { status: 'TIDAK_ADA', skor: 0 };
  var st = best.skor >= 0.9 && best.skor - second >= 0.05 ? 'COCOK' : best.skor >= 0.6 ? 'PERLU_CEK' : 'TIDAK_ADA';
  return { status: st, skor: Math.round(Math.min(best.skor, 1) * 100) / 100, kandidat: best.c };
}

