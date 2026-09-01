var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/config_c4f7n.json', 'utf8'));
var removed = 0;
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (!w.codes) return;
    Object.keys(w.codes).forEach(function (k) {
      var lines = w.codes[k].split('\n').filter(function (l) {
        l = l.trim();
        // drop unsupported print / cls lines; keep everything else
        if (!l) return false;
        if (/^print/.test(l)) { removed++; return false; }
        if (/^cls\s/.test(l) || l === 'cls' || /^cls\d/.test(l)) { removed++; return false; }
        return true;
      });
      w.codes[k] = lines.join('\n');
      if (!w.codes[k]) delete w.codes[k];
    });
    if (w.codes && Object.keys(w.codes).length === 0) delete w.codes;
  });
});
fs.writeFileSync('C4F7N/config_c4f7n.json', JSON.stringify(c));
console.log('removed print/cls lines:', removed);
// report remaining codes per widget that still have scripts
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (w.codes) console.log('p' + pg.file + ' ' + w.objname + ' codes=', Object.keys(w.codes));
  });
});