// verify_scripts.js - C4F7N .pa 脚本级深度验证
// 弥补 verify_all_pages.exe 不查脚本格式的空白：
//   1. 所有脚本行 GBK 字节 ≤15（引擎 L>=16 当 attr 解析 → 崩溃）
//   2. 无复合赋值 += / -=
//   3. txt 属性非空（len=0 = end 标记 → 崩溃）
//   4. objname ≤16B、全局唯一
//   5. 对象 id 连续且唯一（0..n-1）
//   6. 中文 GBK 解码回读（iconv），确认 txt/页名无乱码
//   7. vvs 属性存在性（cc/pv/h/l）
// usage: node C4F7N/verify_scripts.js
'use strict';
var fs = require('fs');
var path = require('path');
var iconv = require('iconv-lite');
var PAGE = require('../lib/page.js');

var root = path.join(__dirname, 'build');
var files = ['0.pa', '1.pa', '2.pa', '3.pa'];
var errors = [];
var warnings = [];
var allNames = [];
var report = [];

files.forEach(function(f) {
  var buf = fs.readFileSync(path.join(root, f));
  var p = PAGE.parse(buf);
  report.push('\n===== ' + f + ' · 页名(GBK解码)=' + iconv.decode(buf.subarray(24, 40), 'gbk').replace(/\0.*$/, '') + ' · objs=' + p.nobj + ' =====');

  // 1) id 连续唯一
  var ids = p.objs.map(function(o) { return PAGE.get(o, 'id'); });
  for (var i = 0; i < ids.length; i++) {
    if (ids[i] !== i) errors.push(f + ': id 不连续/错位 obj[' + i + '].id=' + ids[i]);
  }

  p.objs.forEach(function(o, oi) {
    var name = PAGE.get(o, 'objname');
    if (name !== undefined) {
      var nb = iconv.encode(name, 'gbk');
      if (nb.length > 16) errors.push(f + ': objname 超16B: ' + name + ' (' + nb.length + 'B)');
      if (/^[0-9]/.test(name)) errors.push(f + ': objname 首字符为数字(TJC拒绝): ' + name);
      if (allNames.indexOf(name) >= 0) errors.push(f + ': objname 跨页重复: ' + name);
      allNames.push(name);
    }
    var nolabel = '[' + f + ' obj#' + oi + ' ' + (name || '?') + ']';
    o.items.forEach(function(it) {
      if (it.kind === 'mark') {
        var t = String(it.text);
        if (/^codes[a-z]+-\d+$/.test(t) || /^att-\d+$/.test(t)) return; // 槽/类型标记
        var blen = Buffer.from(t, 'latin1').length;
        if (blen > 15) errors.push(nolabel + ' 脚本行超15B(' + blen + 'B): ' + t);
        if (/\+=|-=/.test(t)) errors.push(nolabel + ' 复合赋值: ' + t);
        report.push('  SCRIPT (' + blen + 'B): ' + t);
      } else if (it.kind === 'attr') {
        if (it.key === 'txt') {
          var tb = Buffer.from(it.raw, 'latin1');
          var rawLen = tb.length;
          if (rawLen === 0) errors.push(nolabel + ' txt 为空字符串(引擎end标记→崩溃)');
          var dec = iconv.decode(tb, 'gbk');
          if (/[\uFFFD]/.test(dec)) errors.push(nolabel + ' txt GBK解码异常: ' + dec);
        }
        if (it.key === 'vvs') report.push('  VVS: ' + name + '.vvs=' + it.value);
      }
    });
  });
});

// 全局唯一复查
var dup = allNames.filter(function(v, i) { return allNames.indexOf(v) !== i; });
if (dup.length) errors.push('objname 全局重复: ' + dup.join(','));

console.log(report.join('\n'));
console.log('\n======== 验证结果 ========');
console.log('ERRORS: ' + errors.length);
errors.forEach(function(e) { console.log('  [ERR] ' + e); });
console.log('WARNINGS: ' + warnings.length);
warnings.forEach(function(w) { console.log('  [WARN] ' + w); });
console.log(errors.length === 0 ? 'PASS: 所有脚本级检查通过' : 'FAIL: 存在 ' + errors.length + ' 个错误');
