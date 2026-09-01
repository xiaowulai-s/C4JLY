var fs = require('fs');
var path = require('path');
var hits = [];
function walk(d) {
  fs.readdirSync(d, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.(js|json|md)$/.test(e.name)) hits.push(p);
  });
}
['seeds', 'lib', 'C4F7N'].forEach(function (r) { if (fs.existsSync(r)) walk(r); });
hits.forEach(function (f) {
  try {
    var s = fs.readFileSync(f, 'latin1');
    // printh<len> / prints / print 后用冒号分隔
    var re = /(printh\d*[^A-Za-z]*|print[xhl\d]*[^,\n]*)/g, m;
    while ((m = re.exec(s)) !== null) {
      var tok = m[1].trim();
      if (tok.length > 0 && tok.indexOf('print') === 0) {
        console.log('FOUND[' + f + ']: ' + tok.slice(0, 60).replace(/[^\x20-\x7E]/g, '.'));
      }
    }
  } catch (e) {}
});
console.log('done');