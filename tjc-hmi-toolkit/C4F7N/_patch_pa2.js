// _patch_pa2.js - 直接在 v65 原始 2.pa 上做目标修改（坐标须用 PAGE.set 以更新 raw 缓冲）
'use strict';
var fs = require('fs');
var PAGE = require('../lib/page.js');
var iconv = require('iconv-lite');
var srcFile = process.argv[2];
var outFile = process.argv[3];
if (!srcFile || !outFile) { console.log('usage: node _patch_pa2.js <src2.pa> <out2.pa>'); process.exit(1); }

var p = PAGE.parse(fs.readFileSync(srcFile));
function get(o, k) { var a = o.items.find(function (i) { return i.kind === 'attr' && i.key === k; }); return a ? a.value : undefined; }
function find(nm) { var f = p.objs.filter(function (o) { return get(o, 'objname') === nm; }); return f.length ? f[0] : null; }

// ---- 1) Y轴刻度数字：避免与曲线(wv x=48)重叠，置于曲线左侧并加宽容纳4位 ----
// 曲线 wv/alarm/gr 左缘 x=48，数字放置到 8..47 区间、居中，右缘 <48 不遮挡
var cy = [
  ['cys0', '0',   466],
  ['cys1', '250', 384],
  ['cys2', '500', 301],
  ['cys3', '750', 219],
  ['cys4', '1000',136]
];
cy.forEach(function (c) {
  var o = find(c[0]); if (!o) { console.log('MISSING ' + c[0]); return; }
  setTxt(o, c[1]);
  // 面板左缘=x24，曲线左缘=x48。数字置于 24..48 之间(0/250/500/750/1000 右对齐贴曲线)
  PAGE.set(o, { x: 12, w: 32, endx: 43, xcen: 2 });
});
function setTxt(o, t) {
  var a = o.items.find(function (i) { return i.kind === 'attr' && i.key === 'txt'; });
  if (!a) throw new Error(get(o, 'objname') + ' no txt');
  a.raw = iconv.encode(t, 'gbk');
  a.value = t;
}

// ---- 2) 表格列靠左铺满左面板(p2L: 24..744)；整体下移避开视图按钮(sw0/sw1 y98..130)遮挡 ----
// 时间列 x=48 w=300 ; 浓度列 x=360 w=300  (48..660，均 <744)
// 表头 y=140 (按钮 y~130 之下)，数据行 y=172 起每 26px，共 12 行到 ~458
var cols = ['ht', 'hc'];
for (var i = 0; i < 12; i++) { cols.push('tt' + i); cols.push('np' + i); }
cols.forEach(function (nm) {
  var o = find(nm); if (!o) return;
  var isPpm = /^(np|hc)/.test(nm);
  var x = isPpm ? 360 : 48, w = 300;
  var idx = /^(tt|np)(\d+)$/.exec(nm);
  var row = idx ? parseInt(idx[2], 10) : -1; // 表头 row=-1, 数据行 0..11
  var y = row < 0 ? 140 : (172 + row * 26);
  PAGE.set(o, { x: x, w: w, endx: x + w - 1, y: y, endy: y + get(o, 'h') - 1 });
});
// 表格面板收窄对齐左面板(p2L: x24 w720)
var p2D = find('p2D'); if (p2D) PAGE.set(p2D, { x: 24, w: 720, endx: 743 });

// ---- 3) 移除导出按钮 ex ----
p.objs = p.objs.filter(function (o) { return get(o, 'objname') !== 'ex'; });

// ---- 4) 重写 sw0/sw1 脚本：移除 ex；sw1 统计栏常显 ----
var stat = ['stt', 'mxl', 'mx', 'avl', 'av', 'mnl', 'mn', 'dul', 'du', 'ctl', 'ct'];
['sw0', 'sw1'].forEach(function (nm) {
  var o = find(nm); if (!o) return;
  var newItems = [];
  for (var i = 0; i < o.items.length; i++) {
    var it = o.items[i];
    if (it.kind === 'attr' || it.kind === 'end' ||
        (it.kind === 'mark' && (/^codes[a-z]+-\d+$/.test(it.text) || /^att-/.test(it.text)))) {
      newItems.push(it); continue;
    }
    var line = it.text;
    var m = /^vis\s+(\S+),(\d+)$/.exec(line);
    if (m && m[1] === 'ex') continue;
    if (nm === 'sw1' && m && stat.indexOf(m[1]) >= 0) { newItems.push({ kind: 'mark', text: 'vis ' + m[1] + ',1' }); continue; }
    newItems.push(it);
  }
  o.items = newItems;
  fixSlotCounts(o);
});
function fixSlotCounts(o) {
  var re = /^(codes[a-z]+)-(\d+)$/;
  var i = 0;
  while (i < o.items.length) {
    var it = o.items[i];
    if (it.kind === 'mark' && re.test(it.text)) {
      var n = 0, j = i + 1;
      while (j < o.items.length) { var k = o.items[j]; if (k.kind === 'mark' && re.test(k.text)) break; if (k.kind === 'end') break; if (k.kind === 'mark') n++; j++; }
      var mm = re.exec(it.text);
      o.items[i] = { kind: 'mark', text: mm[1] + '-' + n };
      i = j;
    } else i++;
  }
}

var out = PAGE.build(p.name, p.objs, p.head);
fs.writeFileSync(outFile, out);
console.log('wrote ' + outFile + ' nobj=' + p.objs.length);