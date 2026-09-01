var fs = require('fs');
var f = 'C4F7N/config_c4f7n.json';
var c = JSON.parse(fs.readFileSync(f, 'utf8'));
c.pages.forEach(function (pg) {
  if (pg.file !== '1.pa') return;
  (pg.widgets || []).forEach(function (w) {
    if (w.objname === 'di') w.codes = { up: 'dv.txt=di.val' };
  });
});
fs.writeFileSync(f, JSON.stringify(c));
// verify
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (w.objname === 'di') console.log('di codes now:', JSON.stringify(w.codes));
  });
});