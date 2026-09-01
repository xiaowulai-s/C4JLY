var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/config_c4f7n.json', 'utf8'));
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    // bb (buzzer toggle): template only has precedent for .val toggling.
    // Remove txt/bco assignment (unsupported), keep val toggle + rely on
    // the button's own text staying put. Use val flag only.
    if (w.objname === 'bb') {
      // retain just a val toggle; no txt/bco writes
      w.codes = { up: 'if(bb.val==1)\n{\nbb.val=0\n}\nif(bb.val==0)\n{\nbb.val=1\n}' };
    }
    // di (slider): dv.txt=di.val is a type mismatch (txt string vs val num)
    // and slider scripts are discouraged; drop it entirely.
    if (w.objname === 'di') {
      delete w.codes;
    }
  });
});
fs.writeFileSync('C4F7N/config_c4f7n.json', JSON.stringify(c));
console.log('bb/di updated');
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (w.objname === 'bb' || w.objname === 'di') console.log(pg.file, w.objname, w.codes ? JSON.stringify(w.codes) : '(no codes)');
  });
});