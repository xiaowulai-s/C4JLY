var fs = require('fs');
var iconv = require('iconv-lite');
var PAGE = require('./lib/page.js');
// replicate: load seed bt1, clearCodes-like, then setCodes for up = 3 lines incl prints
var c = require('./C4F7N/config_c4f7n.json');
var p = PAGE.parse(fs.readFileSync('seeds/tpl_am1_pas/0.pa'));
var seed = p.objs.find(function (o) { return PAGE.get(o, 'objname') === 'bt1'; });
// clone
var items = seed.items.map(function (it) {
  if (it.kind === 'end') return { kind: 'end' };
  if (it.kind === 'mark') return { kind: 'mark', text: it.text };
  return { kind: 'attr', key: it.key, raw: Buffer.from(it.raw), value: it.value };
});
var obj = { items: items };
var code = 'pv.val=0\nprints "PEAK:R",0\nprinth ff ff ff';
var lines = code.split('\n').filter(function (l) { return l.trim().length > 0; });
console.log('lines count:', lines.length);
console.log('lines:', JSON.stringify(lines));
// find codesup slot
var slotIdx = -1, i;
for (i = 0; i < obj.items.length; i++) { var it = obj.items[i]; if (it.kind === 'mark' && /^codesup/.test(it.text)) { slotIdx = i; break; } }
console.log('slotIdx', slotIdx, 'slottext', obj.items[slotIdx].text);
var newItems = [];
for (var k = 0; k < slotIdx; k++) newItems.push(obj.items[k]);
newItems.push({ kind: 'mark', text: 'codesup-' + lines.length });
for (var li = 0; li < lines.length; li++) {
  var ln = iconv.encode(lines[li].trim(), 'gbk').toString('latin1');
  newItems.push({ kind: 'mark', text: ln });
}
obj.items = newItems;
obj.items.forEach(function (it) { if (it.kind === 'mark') console.log(' M [' + it.text + ']'); else if (it.kind === 'end') console.log(' END'); });