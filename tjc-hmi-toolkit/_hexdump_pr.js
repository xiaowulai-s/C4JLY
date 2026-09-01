var fs = require('fs');
var buf = fs.readFileSync('C4F7N/v18build/0.pa');
// search for ascii "prints" / "PEAK" / "pv.val=0" / "printh" strings in raw bytes
['prints', 'PEAK', 'pv.val=0', 'printh', 'shdh'].forEach(function (s) {
  var idx = buf.indexOf(Buffer.from(s, 'latin1'));
  console.log(s, '->', idx);
});
// hexdump bytes around 'pv.val=0' and around 'printh'
function find(s) { return buf.indexOf(Buffer.from(s, 'latin1')); }
var a = find('pv.val=0');
var b = find('printh');
console.log('a(around pv):', buf.subarray(a - 4, a + 30).toString('hex'));
console.log('b(around printh):', buf.subarray(b - 4, b + 30).toString('hex'));