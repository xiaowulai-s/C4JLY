// fix_base.js - 切换到 base.HMI 干净模板：
//   1. pageSeed 用 base 页面对象（不再用 am1 的 tpl_am1_pas）
//   2. 全部 font -> 0（base 只有 0.zi 16 号字库）
// usage: node C4F7N/fix_base.js
'use strict';
var fs = require('fs');
var f = __dirname + '/config_c4f7n.json';
var cfg = JSON.parse(fs.readFileSync(f, 'utf8'));

cfg.pageSeed = 'C4F7N/base_pas/0.pa';
cfg.template = 'C4F7N\\base.HMI';

var n = 0;
cfg.pages.forEach(function(pg) {
  pg.widgets.forEach(function(w) {
    if (w.set && w.set.font !== undefined && w.set.font !== 0) {
      console.log(pg.file + ' ' + w.objname + ': font ' + w.set.font + ' -> 0');
      w.set.font = 0;
      n++;
    }
  });
});
fs.writeFileSync(f, JSON.stringify(cfg, null, 2) + '\n');
console.log('font 清零: ' + n + ' 个控件; pageSeed=' + cfg.pageSeed);
