var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/v14_p2r1.json', 'utf8'));
c.pages[2].widgets.forEach(function (w) {
  if (w.objname === 'r0') w.codes = { up: 'r0.val=1\nr0.bco=3222\nprint"OK"' };
});
fs.writeFileSync('C4F7N/v14_p2r1self.json', JSON.stringify(c));
console.log('written', JSON.stringify(c.pages[2].widgets[0].codes));