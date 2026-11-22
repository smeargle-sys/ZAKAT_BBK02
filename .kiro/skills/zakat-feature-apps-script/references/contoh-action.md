# Contoh pola action lengkap (dari kode yang sudah ada)

## Backend (Master.gs: simpanSerahUB_)
```js
function simpanSerahUB_(p, s) {
  var nominal = Math.round(num_(p.nominal));
  if (!(nominal > 0)) throw new Error('Nominal serah ke UB wajib diisi.');          // validasi, pesan Indonesia
  var tahun = Number(p.tahun || tahunAktif_().Tahun);                               // tahun dari config
  var idAmil = s.role === 'amil' ? s.idAmil : (p.idAmil || '');                     // amil hanya atas nama sendiri
  var amil = daftarAmil_(tahun).filter(function (a) { return a.id === String(idAmil); })[0];
  var obj = { ID: newId_('UB'), Tahun: tahun, Tanggal: toDateStr_(p.tanggal) || fmtDate_(new Date()),
    ID_Amil: idAmil, Nama_Amil: amil ? amil.nama : '', Nominal: nominal, Penerima: p.penerima || '',
    Catatan: p.catatan || '', Oleh: s.nama || s.role };
  withLock_(function () { appendObjects_('Serah_UB', [obj]); });                     // tulis di dalam lock
  log_(s, 'serahUB', obj);                                                          // jejak audit
  return obj;
}
```

## Route (Api.gs)
```js
simpanSerahUB: { roles: ['admin', 'amil'], fn: simpanSerahUB_ },
```

## Test (tests/e2e-api.test.js)
```js
r = g.call({action:'simpanSerahUB', token: amilTok, nominal: 5000, penerima: 'Ketua UB'}); assert(r.ok, r.error);
r = g.call({action:'simpanSerahUB', token: pengurusTok, nominal: 5000}); assert(!r.ok);   // peran ditolak
r = g.call({action:'dashboard', token: admin}); assert.strictEqual(r.data.ub.dipegang, r.data.ub.terkumpul - 5000);
```

## Frontend (app3.js: ACT.ubModal → simpan)
```js
api('simpanSerahUB', { tahun: D.tahun, nominal: Z.parseNum($('#ubNom').value), penerima: $('#ubPen').value })
  .then(function () { Z.closeModal(); Z.toast('Serah ke UB tercatat.'); Z.viewDash(D.tahun); })
  .catch(function (e) { b.disabled = false; Z.fail(e); });
```
