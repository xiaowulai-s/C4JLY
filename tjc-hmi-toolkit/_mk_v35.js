/* _mk_v35.js — 从 config_c4f7n.json 生成 config_c4f7n_v35.json
 * 实施 F1–F17 全部修复项。原 config 与 v34.HMI 均不动。
 * 用法: node _mk_v35.js   (在 tjc-hmi-toolkit 目录下)
 */
'use strict';
const fs = require('fs');

const SRC = 'C4F7N/config_c4f7n_v34r.json'; // v34 无损还原基线（与 v34.HMI diff=0）
const OUT = 'C4F7N/config_c4f7n_v35.json';
const cfg = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const [P0, P1, P2, P3] = cfg.pages; // 主页 / 设置 / 历史曲线 / 关于

const W = (pg, name) => pg.widgets.find(w => w.objname === name);
function setW(pg, name, patch) {
  const w = W(pg, name);
  if (!w) throw new Error('missing widget: ' + name);
  Object.assign(w.set, patch);
}
function delW(pg, name) {
  const i = pg.widgets.findIndex(w => w.objname === name);
  if (i < 0) throw new Error('missing widget: ' + name);
  pg.widgets.splice(i, 1);
}
function addAfter(pg, anchor, widget) {
  const i = pg.widgets.findIndex(w => w.objname === anchor);
  if (i < 0) throw new Error('missing anchor: ' + anchor);
  pg.widgets.splice(i + 1, 0, widget);
}
function addBefore(pg, anchor, widget) {
  const i = pg.widgets.findIndex(w => w.objname === anchor);
  if (i < 0) throw new Error('missing anchor: ' + anchor);
  pg.widgets.splice(i, 0, widget);
}
const tw = (objname, set) => ({
  seed: 'text', objname,
  set: Object.assign({ bco: 4359, pco: 59230, pic: 65535, picc: 65535 }, set)
});

/* ============ F4+F5 主页：面板底 / 栏宽 / 状态行两列 ============ */
// 左栏面板底（先插入，画在最底层）
addBefore(P0, 'pg', tw('ph', { x: 24, y: 84, w: 658, h: 424, txt: ' ' }));
// 左栏按中心 353 重排，报警条通栏压面板底
setW(P0, 'pg', { x: 143 });
setW(P0, 'cc', { x: 133, format: 2 });            // F15 浓度两位小数
setW(P0, 'pu', { x: 143 });
setW(P0, 'bp', { x: 197 });
setW(P0, 'ba', { x: 359 });
setW(P0, 'ps', { x: 24, y: 500, w: 658 });
// 右栏收窄到 700..1000
setW(P0, 'pk', { x: 700, w: 300 });
setW(P0, 'pl', { x: 700, w: 300 });
setW(P0, 'pv', { x: 700, w: 300, format: 2 });    // F15 峰值两位小数
setW(P0, 'prl', { x: 780 });
setW(P0, 'pr', { x: 780 });
setW(P0, 'pd', { x: 700, w: 300, h: 246 });       // 262..508 收进内容区
setW(P0, 'pdh', { x: 724 });
// 状态行拆两列（标签左灰 / 值右白），删原单行控件
['p9', 'pf', 'pt', 'pth'].forEach(n => delW(P0, n));
const homeRows = [
  ['p9l', 290, '响应时间 T90', 'p9v', '≈ 4.2 s'],
  ['pfl', 336, '当前流量',     'pfv', '0.5 L/min'],
  ['ptl', 382, '探头温度',     'ptv', '28.6 ℃'],
  ['pthl', 428, '报警阈值',    'pthv', '500 ppm'],
];
let anchor = 'pdh';
for (const [lk, y, lt, vk, vt] of homeRows) {
  addAfter(P0, anchor, tw(lk, { x: 724, y, w: 140, h: 24, xcen: 0, pco: 31893, txt: lt }));
  addAfter(P0, lk,      tw(vk, { x: 724, y, w: 252, h: 24, xcen: 2, pco: 59230, txt: vt }));
  anchor = vk;
}
// F9 顶栏副标题（4 页统一）
addAfter(P0, 'p0t', tw('subt', { x: 330, y: 20, w: 100, h: 18, xcen: 0, pco: 31893, txt: 'NOVEC 4710' }));

/* ============ 设置页：F3 背光 / F7 提示框 / F14 确认 / F16 蜂鸣器 / F17 字号 ============ */
const di = W(P1, 'di');
di.codes = Object.assign(di.codes || {}, {
  slide: 'dv.txt=di.val\ndims=di.val',   // 11B / 11B
  up: 'printh 18'                        // 通知 MCU 持久化（需固件支持 0x18）
});
setW(P1, 'h', { font: 3 });               // F17 32 号
setW(P1, 'l', { font: 3 });
setW(P1, 'cht', {
  bco: 2376, borderc: 2571, borderw: 1,   // F7 青调底 + 青边框
  txt: '标定过程需保持气路稳定 60 秒，完成后自动保存至 Flash.'
});
W(P1, 'cf').codes = Object.assign(W(P1, 'cf').codes || {}, {
  up: [                                    // F14 双击确认
    'if(cf.val==0)',
    '{',
    'cf.txt="确认?"',
    'cf.val=1',
    '}else',
    '{',
    'printh 17',
    'cf.txt="恢复"',
    'cf.val=0',
    '}'
  ].join('\n')
});
setW(P1, 'bb', { val: 0 });               // F16 初始=开
W(P1, 'bb').codes = Object.assign(W(P1, 'bb').codes || {}, {
  up: [
    'if(bb.val==0)',
    '{',
    'bb.txt="关"',
    'bb.bco=2212',
    '}else',
    '{',
    'bb.txt="开"',
    'bb.bco=9771',
    '}',
    'printh 14'
  ].join('\n')
});
addAfter(P1, 'p0t_s1', tw('subt_s1', { x: 330, y: 20, w: 100, h: 18, xcen: 0, pco: 31893, txt: 'NOVEC 4710' }));

/* ============ 历史曲线页：F1 表格越界 / F2 本地切换 / F6 对齐 / F12 刻度 / F13 标注 / F17 统计字号 ============ */
const TT = Array.from({ length: 12 }, (_, i) => 'tt' + i);
const NP = Array.from({ length: 12 }, (_, i) => 'np' + i);
setW(P2, 'p2D', { w: 720, vis: 0 });
setW(P2, 'ht', { w: 336, vis: 0 });
setW(P2, 'hc', { x: 384, w: 348, vis: 0 });
TT.forEach(n => setW(P2, n, { w: 336, xcen: 0, vis: 0 }));   // F6 时间左对齐
NP.forEach(n => setW(P2, n, { x: 384, w: 348, xcen: 2, vis: 0 })); // 浓度右对齐
setW(P2, 'pg', { x: 370, y: 474, vis: 0 });
setW(P2, 'bup', { x: 490, y: 470, vis: 0 });
setW(P2, 'bdn', { x: 610, y: 470, vis: 0 });
// F13 报警线文字标注（属曲线组）
addAfter(P2, 'alarm', tw('alml', { x: 560, y: 116, w: 140, h: 18, xcen: 0, pco: 59944, txt: '报警线 500ppm' }));
// F12 Y 轴刻度左移，避开波形区
['cys0', 'cys1', 'cys2', 'cys3', 'cys4'].forEach(n => setW(P2, n, { x: 14, w: 28 }));
// F17 统计值 32 号（控件同步增高，y 上移 4）
[['mx', 130], ['av', 176], ['mn', 222], ['du', 268], ['ct', 314]]
  .forEach(([n, y]) => setW(P2, n, { font: 3, y, h: 36 }));
// F2 视图互斥切换脚本
const CURVE = ['wv', 'leg', 'cys0', 'cys1', 'cys2', 'cys3', 'cys4', 'alml'];
const TABLE = ['p2D', 'ht', 'hc', ...TT, ...NP, 'pg', 'bup', 'bdn'];
const chk = s => { if (Buffer.byteLength(s, 'gbk') > 15) throw new Error('line >15B: ' + s); return s; };
W(P2, 'sw0').codes = Object.assign(W(P2, 'sw0').codes || {}, {
  up: TABLE.map(n => chk(`vis ${n},0`))
    .concat(CURVE.map(n => chk(`vis ${n},1`)), ['sw0.bco=3222', 'sw1.bco=2212', 'printh 21']).join('\n')
});
W(P2, 'sw1').codes = Object.assign(W(P2, 'sw1').codes || {}, {
  up: CURVE.map(n => chk(`vis ${n},0`))
    .concat(TABLE.map(n => chk(`vis ${n},1`)), ['sw1.bco=3222', 'sw0.bco=2212', 'printh 22']).join('\n')
});
addAfter(P2, 'p0t_s2', tw('subt_s2', { x: 330, y: 20, w: 100, h: 18, xcen: 0, pco: 31893, txt: 'NOVEC 4710' }));

/* ============ 关于页：F5 信息行两列 / F8 探头卡外框 / F11 去 TR / F10 版本角标 ============ */
addBefore(P3, 'pst', tw('psb', { x: 544, y: 150, w: 424, h: 64, borderc: 4744, borderw: 1, txt: ' ' }));
setW(P3, 'pst', { bco: 4455 });
setW(P3, 'psu', { bco: 4455 });
['mod', 'sn', 'fw', 'mcu', 'lcd', 'pri'].forEach(n => delW(P3, n));
const aboutRows = [
  ['modl', 156, '产品型号',  'modv', 'C4F7N-1000',            'sep_m1'],
  ['snl',  196, '序列号',    'snv',  'SN-C4F7N-2026-0001',   'sep_m2'],
  ['fwl',  236, '固件版本',  'fwv',  'V1.0.0',               'sep_m3'],
  ['mcul', 276, '主控',      'mcuv', 'STM32F103RCT6',        'sep_m4'],  // F11 去 TR
  ['lcdl', 316, '屏幕',      'lcdv', '淘晶驰 7寸 1024×600',  'sep_m5'],
];
for (const [lk, y, lt, vk, vt, sep] of aboutRows) {
  addBefore(P3, sep, tw(lk, { x: 48, y, w: 130, h: 24, xcen: 0, pco: 31893, txt: lt }));
  addBefore(P3, sep, tw(vk, { x: 48, y, w: 432, h: 24, xcen: 2, pco: 59230, txt: vt }));
}
addAfter(P3, 'sep_m5', tw('pril', { x: 48, y: 356, w: 130, h: 24, xcen: 0, pco: 31893, txt: '检测原理' }));
addAfter(P3, 'pril',   tw('priv', { x: 48, y: 356, w: 432, h: 24, xcen: 2, pco: 59230, txt: 'NDIR 双波长红外' }));
addAfter(P3, 'p0t_s3', tw('subt_s3', { x: 330, y: 20, w: 100, h: 18, xcen: 0, pco: 31893, txt: 'NOVEC 4710' }));
P3.widgets.push(tw('ver', { x: 600, y: 482, w: 376, h: 20, xcen: 2, pco: 6603, txt: 'C4F7N Leak Detector · HMI v2.0' }));

/* ============ 输出 ============ */
fs.writeFileSync(OUT, JSON.stringify(cfg));
const counts = cfg.pages.map(p => `${p.name}:${p.widgets.length + 1}`);
console.log('OK ->', OUT, '| 控件数(含页面):', counts.join(' / '));
