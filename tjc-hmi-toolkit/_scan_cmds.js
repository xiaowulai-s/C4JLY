var fs = require('fs');
var path = require('path');
// Scan ALL tools' DLL string tables + template pages for printh / cov / sys0 etc.
// Focus: any mark lines in seeds starting with a command word
function walkInPa(d) {
  var out = [];
  fs.readdirSync(d, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(d, e.name);
    if (e.isDirectory()) walkInPa(p);
    else if (/\.pa$/.test(e.name)) out.push(p);
  });
  return out;
}
var PAGE = require('./lib/page.js');
var cmds = {};
['seeds'].forEach(function (r) {
  walkInPa(r).forEach(function (f) {
    try {
      var p = PAGE.parse(fs.readFileSync(f));
      p.objs.forEach(function (o) {
        o.items.forEach(function (it) {
          if (it.kind === 'mark' && !/^codes/.test(it.text) && !/^att-/.test(it.text)) {
            var t = String(it.text);
            var m = t.match(/^([A-Za-z][A-Za-z0-9_]*)/);
            if (m) cmds[m[1]] = (cmds[m[1]] || 0) + 1;
          }
        });
      });
    } catch (e) {}
  });
});
Object.keys(cmds).sort().forEach(function (k) { console.log(k, cmds[k]); });
console.log('--- printh/printh23/printh24 present? ---');
['printh', 'printh23', 'printh24', 'cov', 'sys0', 'prints', 'sendme'].forEach(function (k) {
  console.log(k, !!cmds[k]);
});