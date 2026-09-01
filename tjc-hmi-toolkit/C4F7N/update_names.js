// update_names.js - 把数字开头对象名改为字母开头（TJC 命名规则：首字符不能为数字）
// usage: node C4F7N/update_names.js
'use strict';
var fs = require('fs');

// 旧名 → 新名（仅 objname；被脚本引用的 h/l/u/bb/di/dv/c0/c1/cf/pv/r0/r1/r2/ex/nh/ns/nc/na* 不变）
var MAP = {
  // page1 设置页
  '1tt': 'htt', '1hl': 'hl', '1hd': 'hld',
  '1hm': 'hm', '1hp': 'hp',
  '1ll': 'lo', '1ld': 'lod',
  '1lm': 'lm', '1lp': 'lp',
  '1ul': 'ul', '1ud': 'uld',
  '1bl': 'bl', '1bd': 'bld',
  '1dl': 'dl',
  '1ct': 'calt',
  '1c0l': 'czl', '1c0d': 'czd',
  '1c1l': 'csl', '1c1d': 'csd',
  '1fl': 'cfl', '1fd': 'cfd',
  '1ht': 'cht',
  // page2 曲线页
  '2tt': 'ctt', '2lg': 'leg', '2st': 'stt',
  '2ml': 'mxl', '2al': 'avl', '2nl': 'mnl', '2dl': 'dul', '2cl': 'ctl',
  // page3 关于页
  '3it': 'itt', '3mo': 'mod', '3sn': 'sn', '3fw': 'fw', '3mc': 'mcu',
  '3lc': 'lcd', '3pr': 'pri',
  '3pt': 'ptt', '3ps': 'pst', '3pu': 'psu',
  '3rg': 'rng', '3rs': 'res', '3t9': 't90', '3bt': 'bat', '3nt': 'note'
};

// ---------- 1) config.json: 只改 widgets[].objname ----------
var cfgFile = __dirname + '/config_c4f7n.json';
var cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
var changed = 0;
cfg.pages.forEach(function(pg) {
  pg.widgets.forEach(function(w) {
    if (MAP[w.objname]) {
      console.log('config: ' + pg.file + ' ' + w.objname + ' -> ' + MAP[w.objname]);
      w.objname = MAP[w.objname];
      changed++;
    }
  });
});
fs.writeFileSync(cfgFile, JSON.stringify(cfg, null, 2) + '\n');
console.log('config renamed: ' + changed);

// ---------- 2) 映射表文档: 全文替换旧短名 ----------
var docFile = __dirname + '/C4F7N_HMI_生成映射表.md';
var doc = fs.readFileSync(docFile, 'utf8');
Object.keys(MAP).forEach(function(old) {
  doc = doc.split(old).join(MAP[old]);
});
fs.writeFileSync(docFile, doc);
console.log('doc updated');
