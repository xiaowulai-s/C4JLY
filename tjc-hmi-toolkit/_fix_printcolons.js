var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/config_c4f7n.json', 'utf8'));
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (!w.codes) return;
    Object.keys(w.codes).forEach(function (k) {
      // replace colons inside print"..." strings with hyphens
      w.codes[k] = w.codes[k].replace(/print"([^"]*)"/g, function (m, inner) {
        return 'print"' + inner.replace(/:/g, '-') + '"';
      });
    });
  });
});
fs.writeFileSync('C4F7N/config_c4f7n.json', JSON.stringify(c));
console.log('replaced colons in print strings');
