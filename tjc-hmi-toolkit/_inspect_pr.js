var c = require('./C4F7N/config_c4f7n.json');
c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (w.objname === 'pr') {
      console.log('pr codes.up raw:', JSON.stringify(w.codes.up));
      console.log('lines:', JSON.stringify(w.codes.up.split('\n')));
    }
  });
});