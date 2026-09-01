var c = require('./C4F7N/config_c4f7n.json');
var keys = ['pr','hm','hp','lm','lp','u','bb','c0','c1','cf','r0','r1','r2','ex'];
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (keys.indexOf(w.objname) >= 0 && w.codes) {
      console.log('p' + pg.file + ' ' + w.objname + ':', JSON.stringify(w.codes.up));
    }
  });
});