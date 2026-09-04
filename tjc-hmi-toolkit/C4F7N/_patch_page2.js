// _patch_page2.js - 修改 config_v65.json 第2页：Y轴0-1000、表格列靠左、统计栏常显、移除导出
'use strict';
var fs = require('fs');
var path = require('path');
var cfgFile = path.join(__dirname, 'config_v65.json');
var cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
var p2 = cfg.pages.filter(function (p) { return p.file === '2.pa'; })[0];
if (!p2) { console.error('no 2.pa'); process.exit(1); }

function setXYW(w, x, y, ww, hh) {
  var a = w.attrs = w.attrs || [];
  function set(k, v) { var f = a.filter(function (kv) { return kv[0] === k; }); if (f.length) f[0][1] = v; else a.push([k, v]); }
  if (x !== undefined) set('x', x);
  if (y !== undefined) set('y', y);
  if (ww !== undefined) set('w', ww);
  if (hh !== undefined) set('h', hh);
  // endx/endy 由 gen 自动推导，这里同步更新以免误读
  if (x !== undefined && ww !== undefined) set('endx', x + ww - 1);
  if (y !== undefined && hh !== undefined) set('endy', y + hh - 1);
}
function find(nm) { return p2.widgets.filter(function (x) { return x.objname === nm; })[0]; }
function setTxt(nm, t) {
  var w = find(nm); if (!w) { console.error('missing ' + nm); return; }
  w.attrs = w.attrs || [];
  var f = w.attrs.filter(function (kv) { return kv[0] === 'txt'; });
  if (f.length) f[0][1] = t; else w.attrs.push(['txt', t]);
}

// ---- 1) Y轴刻度 0-500 -> 0-1000 (文本) ----
setTxt('cys0', '0');
setTxt('cys1', '250');
setTxt('cys2', '500');
setTxt('cys3', '750');
setTxt('cys4', '1000');

// ---- 2) 表格面板收窄到左面板宽度 (对齐 p2L: x24 w720) ----
setXYW(find('p2D'), 24, 84, 720, 424);
// 时间列 x=48 w=330 ; 浓度列 x=392 w=330  (靠左铺满左面板，互不重叠，均不越界)
var rows = ['ht', 'hc'];
for (var i = 0; i < 12; i++) { rows.push('tt' + i); rows.push('np' + i); }
rows.forEach(function (nm) {
  var w = find(nm); if (!w) return;
  var isPpm = /^(np|hc)/.test(nm);
  setXYW(w, isPpm ? 392 : 48, undefined, 330, undefined);
});

// ---- 3) 翻页/页码保持，但确认在表格面板内 ----
// bup/bdn x760+ 原本在右侧统计栏区域；表格面板收窄后翻页按钮仍可保留原位置（在统计栏下方）
// 用户只要求表格列靠左，未要求改翻页位置，保留。

// ---- 4) 移除导出按钮 ex ----
p2.widgets = p2.widgets.filter(function (x) { return x.objname !== 'ex'; });

// ---- 5) sw1 数据表脚本：统计栏强制常显；sw0 曲线脚本：移除 ex ----
function rewriteCodes(nm) {
  var w = find(nm); if (!w) return;
  var c = w.codes || {};
  var stat = ['stt', 'mxl', 'mx', 'avl', 'av', 'mnl', 'mn', 'dul', 'du', 'ctl', 'ct'];
  ['up', 'down'].forEach(function (ev) {
    var code = c[ev]; if (!code) return;
    var lines = code.split('\n').filter(function (l) { return l.trim().length; });
    var out = [];
    lines.forEach(function (l) {
      var m = /^vis\s+(\S+),(\d+)$/.exec(l.trim());
      if (m && m[1] === 'ex') return;        // 移除导出按钮的显示/隐藏操作
      if (nm === 'sw1' && m && stat.indexOf(m[1]) >= 0) { out.push('vis ' + m[1] + ',1'); return; }
      out.push(l.trim());
    });
    c[ev] = out.join('\n');
  });
}
rewriteCodes('sw1');
rewriteCodes('sw0');

// ---- 6) 重排 id：删除 ex 后保证连续 1..n-1 ----
p2.widgets.forEach(function (w, idx) { w.id = idx + 1; });

fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2), 'utf8');
console.log('patched. page2 widgets now=' + p2.widgets.length);