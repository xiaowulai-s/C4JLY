var path = require('path');
var root = process.cwd();
var C = require(path.join(root, 'lib/container.js'));
var P = require(path.join(root, 'lib/page.js'));
var fs = require('fs');
var buf = fs.readFileSync(path.join(root, 'template/am1_1024x600.HMI'));
var e = C.liveEntries(buf).find(function(x){return x.name === '0.pa';});
var raw = buf.subarray(e.off, e.off + e.size);
var p = P.parse(raw);
try {
  var rebuilt = P.build(p.name, p.objs, p.head);
  console.log('orig=' + raw.length + ' rebuild=' + rebuilt.length + ' equal=' + raw.equals(rebuilt));
  var dir = path.join(root, 'C4F7N/_rb');
  fs.mkdirSync(dir, {recursive:true});
  fs.writeFileSync(path.join(dir,'0.pa'), rebuilt);
  function blankPage(name){
    return [{ items: [
      {kind:'mark',text:'att-28'},
      {kind:'attr',key:'type',raw:Buffer.from([121])},
      {kind:'attr',key:'id',raw:Buffer.from([0,0])},
      {kind:'attr',key:'objname',raw:Buffer.from(name)},
      {kind:'attr',key:'x',raw:Buffer.from([0,0])},
      {kind:'attr',key:'y',raw:Buffer.from([0,0])},
      {kind:'attr',key:'w',raw:Buffer.from([0,4])},
      {kind:'attr',key:'h',raw:Buffer.from([0x58,2])},
      {kind:'exec',key:'endx',raw:Buffer.from([0xff,3])},
      {kind:'attr',key:'endx',raw:Buffer.from([0xff,3])},
      {kind:'attr',key:'endy',raw:Buffer.from([0x57,2])},
      {kind:'attr',key:'sta',raw:Buffer.from([1])},
      {kind:'attr',key:'bco',raw:Buffer.from([0x60,0x08])},
      {kind:'attr',key:'pic',raw:Buffer.from([0xff,0xff])},
      {kind:'end'}
    ]}];
  }
  for (var i=1;i<4;i++){ var nm='page'+i; fs.writeFileSync(path.join(dir,i+'.pa'), P.build(nm, blankPage(nm), p.head)); }
  console.log('wrote _rb');
} catch(err){ console.log('ERR', err.message); }