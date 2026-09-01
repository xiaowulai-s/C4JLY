// probe_seeds.js - 探测 tjc-hmi-toolkit 种子控件结构，为 C4F7N config 做准备
// usage: node probe_seeds.js
'use strict';
var fs = require('fs');
var path = require('path');
var PAGE = require('../lib/page.js');

var seeds = {
  'btn98':  'seeds/tpl_s3/0.pa',
  'btn53':  'seeds/tpl_am1_pas/0.pa',
  'text':   'seeds/tpl_s5/0.pa',
  'num':    'seeds/tpl_s1/0.pa',
  'wave':   'seeds/tpl_s3/0.pa',
  'slider': 'seeds/tpl_s4/0.pa',
  'prog':   'seeds/jd_pas/0.pa',
  'var':    'seeds/tpl_s5/0.pa'
};
var root = path.join(__dirname, '..');

Object.keys(seeds).forEach(function(k) {
  var f = path.join(root, seeds[k]);
  var p = PAGE.parse(fs.readFileSync(f));
  console.log('\n===== ' + k + ' <- ' + seeds[k] + ' (' + p.name + ', objs=' + p.nobj + ') =====');
  p.objs.forEach(function(o, i) {
    var keys = o.items
      .filter(function(it) { return it.kind === 'attr'; })
      .map(function(it) { return it.key; });
    var marks = o.items
      .filter(function(it) { return it.kind === 'mark'; })
      .map(function(it) { return it.text; });
    console.log('  [' + i + '] objname=' + PAGE.get(o, 'objname') + '  type=' + PAGE.get(o, 'type') +
      '  id=' + PAGE.get(o, 'id'));
    console.log('      attrs: ' + keys.join(','));
    console.log('      marks: ' + marks.join(' | '));
  });
});
