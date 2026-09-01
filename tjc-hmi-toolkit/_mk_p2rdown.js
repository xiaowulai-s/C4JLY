var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/v14_p2r.json', 'utf8'));
c.pages.forEach(function (pg) {
  if (pg.file === '2.pa') {
    pg.widgets.forEach(function (w) {
      // move multi-line scripts onto the DOWN event (codesdown) like the working template bt4
      if (w.objname === 'r0') w.codes = { down: 'r0.bco=3222\nr1.bco=2212\nr2.bco=2212\ncls 0\nprint"RG:10M"' };
      if (w.objname === 'r1') w.codes = { down: 'r0.bco=2212\nr1.bco=3222\nr2.bco=2212\ncls 0\nprint"RG:1H"' };
      if (w.objname === 'r2') w.codes = { down: 'r0.bco=2212\nr1.bco=2212\nr2.bco=3222\ncls 0\nprint"RG:24H"' };
    });
  }
});
fs.writeFileSync('C4F7N/v14_p2rdown.json', JSON.stringify(c));
console.log('written, objnames:', c.pages[2].widgets.map(w => w.objname).join(','));