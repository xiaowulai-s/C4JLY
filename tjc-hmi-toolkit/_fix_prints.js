var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/config_c4f7n.json', 'utf8'));

// Re-introduce HMI->MCU reporting using TJC's `prints "string",0` (ASCII, no frame tail).
// print is NOT a TJC command (that's Nextion); prints is. Map each interaction back.
// 15-byte GBK limit per script line governs the prints line itself, not payload.
// We also append printh ff ff ff as frame tail so MCU can delimit (TJC convention).

var up = {
  // 主页 重置峰值
  'pr': 'pv.val=0\nprints "PEAK:R",0\nprinth ff ff ff',
  // 设置 高报阈值 ±
  'hm': 'h.val=h.val-50\nif(h.val<100)\n{\nh.val=100\n}\nprints "THR:HI:",0\nprinth ff ff ff',
  'hp': 'h.val=h.val+50\nif(h.val>1000)\n{\nh.val=1000\n}\nprints "THR:HI:",0\nprinth ff ff ff',
  // 设置 低报阈值 ±
  'lm': 'l.val=l.val-10\nif(l.val<10)\n{\nl.val=10\n}\nprints "THR:LO:",0\nprinth ff ff ff',
  'lp': 'l.val=l.val+10\nif(l.val>1000)\n{\nl.val=1000\n}\nprints "THR:LO:",0\nprinth ff ff ff',
  // 单位切换
  'u': 'prints "UNIT:TOG",0\nprinth ff ff ff',
  // 蜂鸣器
  'bb': 'prints "BUZ:TOG",0\nprinth ff ff ff',
  // 标定
  'c0': 'c0.txt="执行中"\nprints "CAL:ZERO",0\nprinth ff ff ff',
  'c1': 'c1.txt="执行中"\nprints "CAL:SPAN",0\nprinth ff ff ff',
  'cf': 'prints "CAL:FAC",0\nprinth ff ff ff',
  // 历史曲线 时间档
  'r0': 'r0.val=1\nr1.val=0\nr2.val=0\nprints "RG:10M",0\nprinth ff ff ff',
  'r1': 'r1.val=1\nr0.val=0\nr2.val=0\nprints "RG:1H",0\nprinth ff ff ff',
  'r2': 'r2.val=1\nr0.val=0\nr1.val=0\nprints "RG:24H",0\nprinth ff ff ff',
  // 导出
  'ex': 'ex.txt="导出中"\nprints "EXPORT",0\nprinth ff ff ff'
};

c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (up[w.objname]) w.codes = { up: up[w.objname] };
  });
});
fs.writeFileSync('C4F7N/config_c4f7n.json', JSON.stringify(c));
console.log('reported interactions mapped to prints+printh frame tail');
// print line lengths
var iconv = require('iconv-lite');
Object.keys(up).forEach(function (k) {
  up[k].split('\n').forEach(function (l) {
    if (/^prints/.test(l)) console.log(k, '[' + l + '] len=' + iconv.encode(l, 'gbk').length);
  });
});