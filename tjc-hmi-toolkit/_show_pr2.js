var PAGE = require('./lib/page.js');
var fs = require('fs');
['pr'].forEach(function (want) {
  var p = PAGE.parse(fs.readFileSync('C4F7N/v18build/0.pa'));
  p.objs.forEach(function (o) {
    if (PAGE.get(o, 'objname') !== want) return;
    var marks = o.items.filter(function (it) { return it.kind === 'mark'; });
    console.log('==== obj', want, 'marks:', marks.map(function (m) { return JSON.stringify(m.text); }));
  });
});