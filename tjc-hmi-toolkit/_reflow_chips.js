/* 主页 chip 加宽重排 (右对齐 gap12 右边距24):
 *   pc0 探头 w130, pc1 泵 w110, pc2 电量 w110
 * 各组: 胶囊底 picture + 文字 text(居中, 避开圆点) + 圆点 picture
 */
const fs = require('fs');
const P = 'D:\\Demo\\C4jly\\tjc-hmi-toolkit\\C4F7N\\config_c4f7n.json';
const cfg = JSON.parse(fs.readFileSync(P, 'utf8'));
const home = cfg.pages.find(p => p.file === '0.pa');

const PANEL = 4359, SUB = 31893, H = 28, Y = 18, GAP = 12, RM = 24, R = 1000;
const labels = { pc0: '\u63a2\u5934 \u5df2\u8fde\u63a5', pc1: '\u6cf5 \u8fd0\u884c', pc2: '\u7535\u91cf 78%' };
const widths = { pc0: 130, pc1: 110, pc2: 110 };
const order = ['pc0', 'pc1', 'pc2'];

// 先移除旧 pc0/pc1/pc2 及其 b/d 子件
home.widgets = home.widgets.filter(w => !/^pc[012][bd]?$/.test(w.objname));

// 重新计算 x（右对齐）
let x = R - RM;
for (let i = order.length - 1; i >= 0; i--) x -= widths[order[i]];
// x now = left of first chip
let cx = x;
const add = [];
for (const o of order) {
  const w = widths[o], dotY = Y + (H - 8) / 2;
  add.push({ seed: 'picture', objname: o + 'b', set: { x: cx, y: Y, w: w, h: H, pic: 0 } }); // pic 占位, 下面按需
  add.push({ seed: 'text',    objname: o, set: { x: cx + 24, y: Y, w: w - 38, h: H, font: 0, txt: labels[o], bco: PANEL, pco: SUB, pic: 65535, picc: 65535, xcen: 1, ycen: 1 } });
  add.push({ seed: 'picture', objname: o + 'd', set: { x: cx + 12, y: dotY, w: 8, h: 8, pic: 5 } });
  cx += w + GAP;
}
home.widgets.push(...add);

// 恢复 pill 图 ID（pc0b=2, pc1b=1, pc2b=0）
const pillIds = { pc0b: 2, pc1b: 1, pc2b: 0 };
home.widgets = home.widgets.map(w => {
  if (pillIds[w.objname]) w.set.pic = pillIds[w.objname];
  return w;
});

fs.writeFileSync(P, JSON.stringify(cfg), 'utf8');
for (const o of order) {
  const b = home.widgets.find(w => w.objname === o + 'b');
  const t = home.widgets.find(w => w.objname === o);
  const d = home.widgets.find(w => w.objname === o + 'd');
  console.log(o, 'x=' + b.set.x, 'w=' + b.set.w, 'pill=' + b.set.pic, '| labelx=' + t.set.x, 'labelw=' + t.set.w, 'txtlen~' + labels[o].length, '| dotx=' + d.set.x);
}
// 重叠/越界检查
const last = home.widgets.find(w => w.objname === 'pc2b');
console.log('right edge=' + (last.set.x + last.set.w), '(<=1000 ok)');