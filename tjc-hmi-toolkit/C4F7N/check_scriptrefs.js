// Validate that every object referenced in widget codes exists on the same page.
var c = require('./v13_cfg.json');
var iconv = require('iconv-lite');
var fs = require('fs');

var KEYWORDS = ['if','endif','else','elseif','then','page','print','cls','stop','return',
  'and','or','!=','==','<=','>=','*','-','+','dim','xx0','sys0','va0','sp0','xstr',
  'bas','bps','t0','tm0','tm1','cov','wav','spd'];
// actually 'sys0' etc are pseudo-objects; ignore numeric-prefixed system names.

var problems = 0;
c.pages.forEach(function (pg) {
  var names = {};
  (pg.widgets||[]).forEach(function (w) { names[w.objname] = true; });
  // include page object name? page object usually has no objname used in scripts.
  var pageNo = parseInt(pg.file);
  (pg.widgets||[]).forEach(function (w) {
    var code = (w.codes ? Object.keys(w.codes).map(function(k){return w.codes[k];}).join('\n') : '');
    // extract candidate object refs: X.foo where X is word not a keyword
    var re = /([A-Za-z_][A-Za-z0-9_]*)\./g, m;
    while ((m = re.exec(code)) !== null) {
      var obj = m[1];
      if (obj === 'xstr') continue;
      if (!names[obj]) { problems++; console.log('PAGE'+pageNo+' obj '+w.objname+' -> REF MISSING: '+obj+'   line: '+code.replace(/\n/g,' | ')); }
    }
    // verify page targets exist
    var pr = /page\s+(\d+)/g, mm;
    while ((mm = pr.exec(code)) !== null) { var tp=parseInt(mm[1]); if(tp<0||tp>3) console.log('page target out of range',tp); }
  });
});
console.log('total missing refs:', problems);