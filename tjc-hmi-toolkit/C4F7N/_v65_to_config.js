// _v65_to_config.js - 从 v65 提取的 .pa 反向生成 config_c4f7n.json
//
// usage: node C4F7N/_v65_to_config.js <srcDir> <outConfig>
//   srcDir   = 含 0.pa..3.pa 的目录（如 C4F7N/v65res）
//   outConfig= 输出的 config JSON 路径
//
// 原理：
//   以 v65 .pa 为唯一事实源，把所有对象（除 pageObj 外）转成 config widget：
//     seed  : 由 att-NN 类型标记映射到固定 seed 字符串
//     objname: 对象 objname（GBK 解码）
//     id    : 对象 id
//     set   : 全部属性（x/y/w/h/txt/bco/pco/pic/... 及 txt_maxl 等），GBK 字符串按 lvalue 存储
//     codes : 事件脚本，从 codesXXX-N 标记按行提取
//   生成的 config 可直接喂给 gen_hmi2.js 重新产出与 v65 等价的 .pa。
//   ⚠️ gen_hmi2.js 的 setAttr 对数字属性按原值宽度写回、对字符串按 GBK 写回；
//      反向生成的 set 仅需提供 lvalue，gen 会重建 raw 字节——与 v65 的 raw 宽度不完全一致，
//      但属性值、脚本、对象顺序、id 均一致，引擎校验 check=33 与功能等价。

'use strict';
var fs = require('fs');
var path = require('path');
var iconv = require('iconv-lite');
var PAGE = require('../lib/page.js');

var srcDir = process.argv[2];
var outCfg = process.argv[3];
if (!srcDir || !outCfg) {
  console.log('usage: node C4F7N/_v65_to_config.js <srcDir> <outConfig>');
  process.exit(1);
}

// att-NN -> seed 名（与 config 的 seeds 键对应）
var ATT_TO_SEED = {
  'att-39': 'text',
  'att-40': 'wave',
  'att-42': 'btn98',
  'att-43': 'btn53',
  'att-23': 'picture',
  'att-29': 'prog'
};

// 需要按 GBK 解码为中文的字符串属性
var STR_KEYS = { 'txt': 1, 'val0': 1, 'val1': 1 };

var pages = [];
[0, 1, 2, 3].forEach(function (pi) {
  var fp = path.join(srcDir, pi + '.pa');
  if (!fs.existsSync(fp)) { console.log('skip ' + fp); return; }
  var p = PAGE.parse(fs.readFileSync(fp));

  // pageObj = 对象0（att-28/29 页面对象）除 objname 外的属性
  var pageObj = {};
  var po = p.objs[0];
  po.items.forEach(function (it) {
    if (it.kind === 'attr' && it.key !== 'objname') pageObj[it.key] = it.value;
  });

  var widgets = [];
  function inferSeed(o, att) {
    var s = ATT_TO_SEED[att];
    if (att === 'att-39') {
      // att-39 兼作 text / num / slider / base：按特征二次判别
      var keys = {};
      o.items.forEach(function (x) { if (x.kind === 'attr') keys[x.key] = 1; });
      var hasSlide = o.items.some(function (x) { return x.kind === 'mark' && /^codesslide-/.test(x.text); });
      if (hasSlide) return 'slider';
      if (keys['vvs']) return 'num';
      return 'text';
    }
    return s || 'text';
  }

  for (var i = 1; i < p.objs.length; i++) {
    var o = p.objs[i];
    var att = (o.items.filter(function (x) { return x.kind === 'mark' && /^att-/.test(x.text); }).map(function (x) { return x.text; }))[0] || '';
    var seed = inferSeed(o, att);
    var name = PAGE.get(o, 'objname');
    var set = {};
    var codes = {};
    var slotPrefix = null;
    var lines = [];
    var slotRe = /^codes([a-z]+)-(\d+)$/;

    o.items.forEach(function (it, idx) {
      if (it.kind === 'attr') {
        // 跳过 gen_hmi2 会自动重算的字段，避免重复写入导致不一致
        if (it.key === 'id' || it.key === 'objname' || it.key === 'endx' || it.key === 'endy') return;
        // 字符串属性按 GBK 解码为正确中文；数字/字节属性直接用原始值
        var val = it.value;
        if (STR_KEYS[it.key]) {
          try { val = iconv.decode(Buffer.from(it.raw, 'latin1'), 'gbk'); }
          catch (e) { val = it.value; }
        }
        set[it.key] = val;
        return;
      }
      if (it.kind === 'mark' && slotRe.test(it.text)) {
        // 结束上一槽
        if (slotPrefix) codes[slotPrefix] = lines.join('\n');
        slotPrefix = slotRe.exec(it.text)[1];
        lines = [];
        return;
      }
      if (it.kind === 'mark' && slotPrefix) {
        // 槽内脚本行：还原 GBK 文本
        try { lines.push(iconv.decode(Buffer.from(it.text, 'latin1'), 'gbk')); }
        catch (e) { lines.push(it.text); }
      }
    });
    if (slotPrefix) codes[slotPrefix] = lines.join('\n');

    // 事件名归一：down/up 直接用；沿用 TJC 槽名前缀
    var w = { seed: seed, objname: name, id: PAGE.get(o, 'id'), typeMark: att };
    if (Object.keys(set).length) w.set = set;
    if (Object.keys(codes).length) w.codes = codes;

    // 完整属性快照（含 set 未覆盖的字节型属性），供 gen_hmi2 精确还原，跳过 seed 克隆
    var attrs = [];
    o.items.forEach(function (it) {
      if (it.kind === 'attr') {
        if (it.key === 'endx' || it.key === 'endy' || it.key === 'id') return; // gen 自动重算
        if (it.key === 'objname') return;
        var av = it.value;
        if (STR_KEYS[it.key]) {
          try { av = iconv.decode(Buffer.from(it.raw, 'latin1'), 'gbk'); }
          catch (e) { av = ' '; }
        }
        attrs.push([it.key, av]);
      }
    });
    // gen 未明示删除的属性：补一个标记，让还原兜底删除 seed 遗留 —— 由 gen 的 full 模式直接整对象重建，
    // 故此处只需保留 attrs 原始键即可。
    if (attrs.length) w.attrs = attrs;

    widgets.push(w);
  }

  var fileName = pi + '.pa';
  pages.push({
    file: fileName,
    name: iconv.decode(Buffer.from(po.items.find(function (x) { return x.kind === 'attr' && x.key === 'objname'; }).raw, 'latin1'), 'gbk') || fileName,
    pageObj: pageObj,
    widgets: widgets
  });
});

// 合并为完整 config：seeds/pages（seeds 复用现有 config 的种子文件路径）
var base = require('../C4F7N/config_c4f7n.json');
var out = {
  template: base.template,
  pageSeed: base.pageSeed,
  seeds: base.seeds,
  fontIndex: base.fontIndex,
  pages: pages
};

fs.writeFileSync(outCfg, JSON.stringify(out, null, 2), 'utf8');
console.log('written ' + outCfg + '  pages=' + pages.length +
  '  widgets=' + pages.reduce(function (a, p) { return a + p.widgets.length; }, 0));