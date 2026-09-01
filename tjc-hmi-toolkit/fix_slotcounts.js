// Post-process a built page: rewrite event-slot marks codesXXX-N so that N = line count
// of the script lines following that slot (the empirical TJC rule discovered in the
// template: codesdown-6 followed by 6 lines, codesup-3 followed by 3 lines, etc.)
var PAGE = require('./lib/page.js');
var fs = require('fs');
var file = process.argv[2];
if (!file) { console.error('usage: node fix_slotcounts.js <file.pa>'); process.exit(1); }
var p = PAGE.parse(fs.readFileSync(file));
p.objs.forEach(function (o) {
  var i = 0;
  while (i < o.items.length) {
    var it = o.items[i];
    if (it.kind === 'mark' && /^codes[a-z]+-\d+$/.test(String(it.text))) {
      // count following script lines until next codesXXX/end
      var n = 0, j = i + 1;
      while (j < o.items.length) {
        var k = o.items[j];
        if (k.kind === 'mark' && /^codes[a-z]+-\d+$/.test(String(k.text))) break;
        if (k.kind === 'end') break;
        if (k.kind === 'mark') n++; // a script line
        j++;
      }
      var match = /^(codes[a-z]+)-(\d+)$/.exec(String(it.text));
      var newText = match[1] + '-' + n;
      o.items[i] = { kind: 'mark', text: newText };
      i = j;
    } else {
      i++;
    }
  }
});
var out = PAGE.build(p.name, p.objs, p.head);
fs.writeFileSync(file, out);
// verify
var p2 = PAGE.parse(out);
p2.objs.forEach(function (o) {
  o.items.forEach(function (it) {
    if (it.kind === 'mark' && /^codes[a-z]+-\d+$/.test(String(it.text))) console.log('  slot:', it.text);
  });
});
console.log('fixed', file, 'out size', out.length);