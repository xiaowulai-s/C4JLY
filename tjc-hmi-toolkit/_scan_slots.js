var PAGE = require('./lib/page.js');
var fs = require('fs');
[0, 1, 2, 3].forEach(function (n) {
  var p = PAGE.parse(fs.readFileSync('C4F7N/v18build/' + n + '.pa'));
  p.objs.forEach(function (o) {
    var items = o.items;
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.kind === 'mark' && /^codes[a-z]+-\d+$/.test(String(it.text))) {
        var m = /^(codes[a-z]+)-(\d+)$/.exec(String(it.text));
        var declared = parseInt(m[2], 10);
        var j = i + 1, lines = 0;
        while (j < items.length) {
          var k = items[j];
          if (k.kind === 'mark' && /^codes[a-z]+-\d+$/.test(String(k.text))) break;
          if (k.kind === 'end') break;
          if (k.kind === 'mark') lines++;
          j++;
        }
        if (lines !== declared) {
          console.log('p' + n + ' obj=' + PAGE.get(o, 'objname') + ' slot=' + it.text + ' declared=' + declared + ' actualLines=' + lines);
        }
      }
    }
  });
});
console.log('scan done');