var fs = require('fs');
var c = JSON.parse(fs.readFileSync('C4F7N/config_c4f7n.json', 'utf8'));

var codes = {
  // p0
  'pr': 'pv.val=0\nprinth 01',
  // p1 高报
  'hm': 'h.val=h.val-50\nif(h.val<100)\n{\nh.val=100\n}\nprinth 11',
  'hp': 'h.val=h.val+50\nif(h.val>1000)\n{\nh.val=1000\n}\nprinth 11',
  // p1 低报
  'lm': 'l.val=l.val-10\nif(l.val<10)\n{\nl.val=10\n}\nprinth 12',
  'lp': 'l.val=l.val+10\nif(l.val>1000)\n{\nl.val=1000\n}\nprinth 12',
  // p1 单位 / 蜂鸣
  'u': 'printh 13',
  'bb': 'printh 14',
  // p1 标定
  'c0': 'c0.txt="执行中"\nprinth 15',
  'c1': 'c1.txt="执行中"\nprinth 16',
  'cf': 'printh 17',
  // p2 曲线档位
  'r0': 'r0.val=1\nr1.val=0\nr2.val=0\nprinth 21',
  'r1': 'r1.val=1\nr0.val=0\nr2.val=0\nprinth 22',
  'r2': 'r2.val=1\nr0.val=0\nr1.val=0\nprinth 23',
  // p2 导出
  'ex': 'ex.txt="导出中"\nprinth 24'
};

c.pages.forEach(function (pg) {
  (pg.widgets || []).forEach(function (w) {
    if (codes[w.objname]) w.codes = { up: codes[w.objname] };
  });
});
fs.writeFileSync('C4F7N/config_c4f7n.json', JSON.stringify(c));
console.log('config updated to printh single-byte command codes');

// verify all script lines <= 15B
var iconv = require('iconv-lite');
var over = 0;
Object.keys(codes).forEach(function (k) {
  codes[k].split('\n').forEach(function (l) {
    l = l.trim(); if (!l) return;
    var b = iconv.encode(l, 'gbk').length;
    if (b > 15) { console.log('OVER15 ' + k + ' [' + l + ']=' + b); over++; }
  });
});
console.log('over-15 lines:', over);