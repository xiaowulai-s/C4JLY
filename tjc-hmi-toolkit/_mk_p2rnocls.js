var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/v14_p2r.json', 'utf8'));
c.pages.forEach(function (pg) {
  if (pg.file === '2.pa') {
    pg.widgets.forEach(function (w) {
      if (w.objname === 'r0') w.codes = { up: 'r0.bco=3222\nr1.bco=2212\nr2.bco=2212\nprint"RG:10M"' };
      if (w.objname === 'r1') w.codes = { up: 'r0.bco=2212\nr1.bco=3222\nr2.bco=2212\nprint"RG:1H"' };
      if (w.objname === 'r2') w.codes = { up: 'r0.bco=2212\nr1.bco=2212\nr2.bco=3222\nprint"RG:24H"' };
    });
  }
});
fs.writeFileSync('C4F7N/v14_p2rnocls.json', JSON.stringify(c));
console.log('written');