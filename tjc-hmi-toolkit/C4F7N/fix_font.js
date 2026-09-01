// fix_font.js - 修正字体索引：模板 am1 仅存在 0.zi(16号) 和 3.zi(24号)
// 无 1.zi/2.zi！font=1/2 引用无效字库 → 引擎"索引超出数组界限"（全页面报错）
// 修复: font 1/2 → 3（24号）；font 0 不变（16号）
// usage: node C4F7N/fix_font.js
'use strict';
var fs = require('fs');
var f = __dirname + '/config_c4f7n.json';
var cfg = JSON.parse(fs.readFileSync(f, 'utf8'));
var n = 0;
cfg.pages.forEach(function(pg) {
  pg.widgets.forEach(function(w) {
    if (w.set && (w.set.font === 1 || w.set.font === 2)) {
      console.log(pg.file + ' ' + w.objname + ': font ' + w.set.font + ' -> 3');
      w.set.font = 3;
      n++;
    }
  });
});
fs.writeFileSync(f, JSON.stringify(cfg, null, 2) + '\n');
console.log('font 修正: ' + n + ' 个控件');
