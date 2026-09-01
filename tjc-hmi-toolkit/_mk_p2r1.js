var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/v14_p2r.json', 'utf8'));
c.pages.forEach(function (pg) {
  if (pg.file === '2.pa') pg.widgets = pg.widgets.filter(function (w) { return w.objname === 'r0'; });
});
fs.writeFileSync('C4F7N/v14_p2r1.json', JSON.stringify(c));
console.log('v14_p2r1 written, p2 widgets:', c.pages[2].widgets.map(w => w.objname).join(','));
// now self variant
var c2 = JSON.parse(JSON.stringify(c));
c2.pages[2].widgets.forEach(function (w) {
  if (w.objname === 'r0') w.codes = { up: 'r0.val=1\nr0.bco=3222\nprint"OK"' };
});
fs.writeFileSync('C4F7N/v14_p2r1self.json', JSON.stringify(c2));
console.log('v14_p2r1self written:', JSON.stringify(c2.pages[2].widgets[0].codes));