var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/config_c4f7n.json', 'utf8'));
var fixed = 0;
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (!w.codes) return;
    Object.keys(w.codes).forEach(function (k) {
      var lines = w.codes[k].split('\n');
      var newLines = [];
      lines.forEach(function (l) {
        l = l.trim();
        if (!l) return;
        // remove { around if/endif blocks — TJC doesn't need them
        if (/^if\(/.test(l)) {
          // if( → line alone, no brace
          l = l.replace(/^if\((.*)\)/, 'if $1');
          fixed++;
        }
        if (/endif\} /.test(l)) {
          // endif} → endif alone, no brace
          l = l.replace(/endif\}/, 'endif');
          fixed++;
        }
        newLines.push(l);
      });
      w.codes[k] = newLines.join('\n');
    });
  });
});
fs.writeFileSync('C4F7N/config_c4f7n.json', JSON.stringify(c));
console.log('fixed if/endif braces:', fixed);
