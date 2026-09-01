// fix_pic.js - 清零所有控件的图片引用为 65535（无图），规避模板图片资源兼容性
// 根因: btn53 种子 (bt1) 来自 tpl_am1_pas/0.pa，自带 picc=0/picc2=1 引用 0.i/1.i；
//       1.i 内部名为 "Clipboard_Screenshot.png"，引擎加载时触发 "索引超出数组界限"
//       + 持续弹窗 "@image#1:Clipboard_Screenshot.png"。
// 修复: 对所有控件的 pic/picc/pic2/picc2/bpic/ppic/... 强制写 65535 (无图)。
//       页面对象 pic 同样清零 → 纯色背景（与视觉稿一致）。
// usage: node C4F7N/fix_pic.js
'use strict';
var fs = require('fs');
var f = __dirname + '/config_c4f7n.json';
var cfg = JSON.parse(fs.readFileSync(f, 'utf8'));

// 页面对象: pic 设为 65535（无背景图，纯 bco 背景色）
cfg.pages.forEach(function(pg) {
  pg.pageObj = pg.pageObj || {};
  pg.pageObj.pic = 65535;
});

// widgets: 按 seed 类型注入图片清零属性
var INJECT = {
  btn53:  { picc: 65535, picc2: 65535 },
  btn98:  { pic: 65535, picc: 65535, pic2: 65535, picc2: 65535 },
  text:   { pic: 65535, picc: 65535 },
  num:    { pic: 65535, picc: 65535 },
  wave:   {},
  slider: { pic: 65535, picc: 65535, pic1: 65535, picc1: 65535, pic2: 65535 },
  prog:   { bpic: 65535, ppic: 65535 }
};
var n = 0;
cfg.pages.forEach(function(pg) {
  pg.widgets.forEach(function(w) {
    var inj = INJECT[w.seed];
    if (!inj) return;
    w.set = w.set || {};
    Object.keys(inj).forEach(function(k) {
      if (w.set[k] === undefined) { w.set[k] = inj[k]; n++; }
    });
  });
});
fs.writeFileSync(f, JSON.stringify(cfg, null, 2) + '\n');
console.log('注入图片清零: ' + n + ' 个属性 (页面 pic + 各控件 picc/picc2/bpic/ppic 等)');
