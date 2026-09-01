var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/config_c4f7n.json', 'utf8'));
// Remove all .bco= assignments (TJC doesn't support coloring buttons at runtime).
// Replace with .val= flag set (template-precedented) so the compile passes.
var removed = 0;
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (w.objname !== 'r0' && w.objname !== 'r1' && w.objname !== 'r2') return;
    if (!w.codes) return;
    // r0/r1/r2 range buttons: keep only a val flag representing "selected"
    var which = w.objname === 'r0' ? '0' : (w.objname === 'r1' ? '1' : '2');
    var sel = which;
    var others = ['0', '1', '2'].filter(function (x) { return x !== sel; });
    var script = 'r' + which + '.val=1\n';
    others.forEach(function (o) { script += 'r' + o + '.val=0\n'; });
    w.codes = { up: script };
    removed++;
  });
});
fs.writeFileSync('C4F7N/config_c4f7n.json', JSON.stringify(c));
console.log('rewrote ranged buttons, count:', removed);
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (w.objname === 'r0' || w.objname === 'r1' || w.objname === 'r2')
      console.log(pg.file, w.objname, JSON.stringify(w.codes));
  });
});