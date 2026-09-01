// Verify every text-bearing object's txt_maxl covers the actual GBK byte length
// of its txt (the raw length of the txt attr, not a re-encode of a latin1-decoded
// garbage string).
var P = require('../lib/page.js');
var fs = require('fs');

function getRaw(o, key) {
  var a = o.items.find(function (i) { return i.kind === 'attr' && i.key === key; });
  return a ? a.raw : undefined;
}
function getVal(o, key) {
  var a = o.items.find(function (i) { return i.kind === 'attr' && i.key === key; });
  return a ? a.value : undefined;
}

var over = 0;
[0,1,2,3].forEach(function (i) {
  var p = P.parse(fs.readFileSync('C4F7N/v14build/' + i + '.pa'));
  p.objs.forEach(function (o) {
    var txtRaw = getRaw(o, 'txt');
    var mx = getVal(o, 'txt_maxl');
    if (!txtRaw || mx === undefined) return;
    if (txtRaw.length > mx) { over++; console.log('OVER p' + i, getVal(o,'objname'), 'txtBytes=' + txtRaw.length, 'maxl=' + mx); }
  });
});
console.log('over-limit (raw):', over);