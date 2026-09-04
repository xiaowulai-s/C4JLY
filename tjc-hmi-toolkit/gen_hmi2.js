// gen_hmi2.js - TJC HMI generator v2: cross-template widget seeds, full page assembly
//
// usage: node gen_hmi2.js <config.json> <builddir>
//
// config.json:
// {
//   "template": "C:\\path\\to\\template.HMI",   // base project (am1 按摩椅UI)
//   "fontIndex": { "f0": 0, "f1": 1, "f2": 2 },  // optional font idx mapping
//   "seeds": {
//     "btn98":  { "file": "tpl_s3/0.pa", "objname": "b0" },
//     "btn53":  { "file": "tpl_am1_pas/0.pa", "objname": "bt1" },
//     "text":   { "file": "tpl_s5/0.pa", "objname": "t0" },
//     "num":    { "file": "tpl_s1/0.pa", "objname": "n0" },
//     "wave":   { "file": "tpl_s3/0.pa", "objname": "s0" },
//     "slider": { "file": "tpl_s4/0.pa", "objname": "h0" },
//     "prog":   { "file": "jd_pas/0.pa", "objname": "j0" },
//     "var":    { "file": "tpl_s5/0.pa", "objname": "temp" }
//   },
//   "pages": [
//     {
//       "file": "0.pa",
//       "name": "主页",            // page display name (GBK)
//       "pageObj": { "x":0, "y":0, "w":1024, "h":600, "bco": 2212 },
//       "widgets": [
//         { "seed": "btn98", "objname": "p0_nav_home", "id": 1,
//           "set": { "x":0, "y":534, "w":256, "h":52, "font": 1, "txt":"主页", "bco":3222, "pco":59230 },
//           "codes": { "rel": "page 0\n..." } }
//       ]
//     }
//   ]
// }
//
// Output: one .pa per page written to <builddir>/<file>.
// Page name written as GBK into the +24 name field (build() writes latin1).

var fs = require('fs');
var path = require('path');
var iconv = require('iconv-lite');
var PAGE = require('./lib/page.js');

var configFile = process.argv[2];
var buildDir = process.argv[3];
if (!configFile || !buildDir) {
  console.log('usage: node gen_hmi2.js <config.json> <builddir>');
  process.exit(1);
}
var cfg = JSON.parse(fs.readFileSync(configFile, 'utf8'));

// ---------- load seed widgets ----------
var seedCache = {};
function loadSeed(key) {
  if (seedCache[key]) return seedCache[key];
  var s = cfg.seeds[key];
  if (!s) throw new Error('unknown seed: ' + key);
  var p = PAGE.parse(fs.readFileSync(s.file));
  var obj = p.objs.find(function(o) { return PAGE.get(o, 'objname') === s.objname; });
  if (!obj) throw new Error('seed ' + key + ': objname ' + s.objname + ' not found in ' + s.file);
  seedCache[key] = obj;
  return obj;
}

// ---------- helpers ----------
function cloneObj(src) {
  var items = src.items.map(function(it) {
    if (it.kind === 'end') return { kind: 'end' };
    if (it.kind === 'mark') return { kind: 'mark', text: it.text };
    return { kind: 'attr', key: it.key, raw: Buffer.from(it.raw), value: it.value };
  });
  return { items: items };
}

// Insert a NEW attribute into an object body. Object item layout is:
//   [0] att-NN (type marker), [1..k] attrs, [k+1..] event slots + script lines, [last] end
// New attrs MUST land after the type marker but BEFORE the first event slot;
// otherwise clearCodes() (which drops everything between slot markers as script
// lines) would discard them. (Bug fixed 2026-08-26: txt/vvs were silently lost.)
function insertAttr(obj, a) {
  var idx = obj.items.length - 1; // default: before end marker
  for (var i = 1; i < obj.items.length; i++) {
    var it = obj.items[i];
    if (it.kind === 'mark' && /^codes[a-z]+-\d+$/.test(String(it.text))) { idx = i; break; }
    if (it.kind === 'end') { idx = i; break; }
  }
  obj.items.splice(idx, 0, a);
}

function setAttr(obj, key, val) {
  var a = obj.items.find(function(i) { return i.kind === 'attr' && i.key === key; });
  if (!a) {
    // create missing attr with default raw size by value type
    if (typeof val === 'string') {
      var gbk = iconv.encode(val === '' ? ' ' : val, 'gbk');
      a = { kind: 'attr', key: key, raw: gbk, value: val };
      insertAttr(obj, a);
    } else {
      var n = (val & 0xffffffff) > 0xffff ? 4 : ((val & 0xffff) > 0xff ? 2 : 1);
      var b = Buffer.alloc(n);
      if (n === 1) b.writeUInt8(val & 0xff, 0);
      else if (n === 2) b.writeUInt16LE(val & 0xffff, 0);
      else b.writeUInt32LE(val >>> 0, 0);
      a = { kind: 'attr', key: key, raw: b, value: val };
      insertAttr(obj, a);
    }
    return;
  }
  if (typeof val === 'string') {
    // TJC string attrs are variable-length records (u32 len prefix is written by build());
    // always store GBK bytes - no fixed-length limit applies to the value body.
    // IMPORTANT: empty string (len 0) crashes the TJC engine parser (record L=0 is
    // treated as end marker / causes array bounds error) - always write >=1 byte.
    a.raw = iconv.encode(val === '' ? ' ' : val, 'gbk');
  } else {
    var b2 = Buffer.alloc(a.raw.length);
    if (b2.length === 1) b2.writeUInt8(val & 0xff, 0);
    else if (b2.length === 2) b2.writeUInt16LE(val & 0xffff, 0);
    else b2.writeUInt32LE(val >>> 0, 0);
    a.raw = b2;
  }
  a.value = val;
}

function setObjname(obj, name) {
  var a = obj.items.find(function(i) { return i.kind === 'attr' && i.key === 'objname'; });
  if (!a) throw new Error('no objname attr');
  var nb = iconv.encode(name, 'gbk');
  if (nb.length > 16) throw new Error('objname too long: ' + name);
  // objname must stay compact (no fixed pad): the engine reads the next attribute
  // at its own boundary, so padding objname to 16 bytes shifts every following
  // field out of place and triggers "索引超出了数组界限" on GUI load.
  a.raw = nb;
  a.value = name;
}

// set event code: TJC stores each code line as a *long mark* record whose text is the
// whole line (page.js's parser misreads lines >=16 bytes as attrs, but round-trips fine;
// we write them back as marks so the engine gets the full text).
// Code lines live between "codes<ev>-N" and "codesup-0" marks.
// Event names: down (codesdown), rel (codesrel), slide (codesslide), timer (codestimer).
// clear ALL event code slots on a cloned object: keep the slot marks
// (codesdown-N / codesup-N / codesslide-N ...), drop every script line between
// them, and refresh N to the object's real id. Stray seed code (tm0.en=1 etc.)
// must never survive into a cloned widget.
function clearCodes(obj) {
  var idAttr = obj.items.find(function(x) { return x.kind === 'attr' && x.key === 'id'; });
  var myId = idAttr ? idAttr.value : 0;
  var out = [];
  var pendingEnd = null; // index in out of the last codesXXX-N mark (content follows)
  for (var i = 0; i < obj.items.length; i++) {
    var it = obj.items[i];
    if (it.kind === 'mark' && /^codes[a-z]+-\d+$/.test(String(it.text))) {
      // The slot number N in "codesXXX-N" must equal the count of script lines that
      // follow it in this block. clearCodes drops every script line, so the cleared
      // block always has 0 lines -> the slot number must be rewritten to 0 here.
      // (Keeping the seed's number breaks whenever the seed's block was non-empty,
      // e.g. bt1's codesup-1 held "page bt1a"; after clearing, declared=1 but
      // lines=0 => engine indexes out of bounds on load.)
      var m = /^(codes[a-z]+)-(\d+)$/.exec(String(it.text));
      out.push({ kind: 'mark', text: (m ? m[1] : it.text) + '-0' });
      pendingEnd = out.length - 1;
      continue;
    }
    if (pendingEnd !== null) {
      // inside a code block: keep attrs (they may have been inserted there),
      // skip script lines until the next codesXXX mark or end marker
      if (it.kind === 'mark' && /^codes[a-z]+-\d+$/.test(String(it.text))) {
        // next slot starts; handled on next iteration (this it is the new slot)
        // we already consumed this it above? no - push nothing, let loop re-handle
        // simplest: re-process this item by not skipping it
        pendingEnd = null;
        i--; // rewind so this mark is processed as a slot opener
        continue;
      }
      if (it.kind === 'end') { pendingEnd = null; out.push(it); continue; }
      if (it.kind === 'attr') { out.push(it); continue; } // preserve attr in slot zone
      continue; // drop code line
    }
    out.push(it);
  }
  obj.items = out;
}

function setCodes(obj, eventName, code) {
  // make sure the requested slot exists; seeds always have down/up (+slide for sliders)
  var slotIdx = -1;
  for (var i = 0; i < obj.items.length; i++) {
    var it = obj.items[i];
    if (it.kind === 'mark' && String(it.text).indexOf('codes' + eventName) === 0) { slotIdx = i; break; }
  }
  if (slotIdx < 0) throw new Error('no codes' + eventName + ' slot in ' + PAGE.get(obj, 'objname'));
  var idAttr = obj.items.find(function(x) { return x.kind === 'attr' && x.key === 'id'; });
  // keep the seed's event-slot id (codesdown-0 / codesup-1); do NOT rewrite to myId
  var slotText = String(obj.items[slotIdx].text);
  // find end mark (next codesXXX or end) after slotIdx; drop everything between
  var endIdx = -1;
  for (var j2 = slotIdx + 1; j2 < obj.items.length; j2++) {
    var it2 = obj.items[j2];
    if (it2.kind === 'mark' && /^codes[a-z]+-\d+$/.test(String(it2.text))) { endIdx = j2; break; }
    if (it2.kind === 'end') { endIdx = j2; break; }
  }
  if (endIdx < 0) endIdx = obj.items.length;
  var lines = code.split('\n').filter(function(l){ return l.trim().length > 0; });
  // The TJC engine indexes event behavior by the slot number N in "codesXXX-N",
  // and N MUST equal the number of script lines stored under that slot. The seed's
  // value (e.g. codesup-1 holding one "page x" line) is only valid for single-line
  // scripts; writing any other line count against the stale number makes the engine
  // index past the behavior array and throw "索引超出了数组界限" on load. So we
  // rewrite the slot number to the actual line count. (Discovered via the am1
  // template: codesdown-6 holds 6 lines, codesup-3 holds 3, codesup-0 holds 0.)
  var slotRe = /^(codes[a-z]+)-(\d+)$/.exec(String(obj.items[slotIdx].text));
  var slotPrefix = slotRe ? slotRe[1] : ('codes' + eventName);
  var slotText = slotPrefix + '-' + lines.length;
  var newItems = [];
  for (var k = 0; k < slotIdx; k++) newItems.push(obj.items[k]);
  newItems.push({ kind: 'mark', text: slotText });
  for (var li = 0; li < lines.length; li++) {
    var line = lines[li].trim();
    // Chinese in script lines must be stored as GBK bytes; latin1 round-trips bytes,
    // so encode GBK then interpret as latin1 string to keep bytes intact on write.
    var lineLatin = iconv.encode(line, 'gbk').toString('latin1');
    newItems.push({ kind: 'mark', text: lineLatin });
  }
  for (var k2 = endIdx; k2 < obj.items.length; k2++) newItems.push(obj.items[k2]);
  obj.items = newItems;
}

// ---------- build page ----------
function buildPage(pg) {
  var objs = [];
  // page object: clone page seed (att-28/29) - use btn98's page? We need a page object.
  // Standard page object from am1 0.pa page (att-29, 1024x600)
  var pageSeedFile = cfg.pageSeed || 'tpl_am1_pas/0.pa';
  var ps = PAGE.parse(fs.readFileSync(pageSeedFile));
  var pageObj = cloneObj(ps.objs[0]);
  setObjname(pageObj, pg.name || pg.file.replace('.pa', ''));
  if (pg.pageObj) {
    Object.keys(pg.pageObj).forEach(function(k) { setAttr(pageObj, k, pg.pageObj[k]); });
  }
  objs.push(pageObj);

  var usedIds = [0];
  var nextId = 1;
  pg.widgets.forEach(function(w) {
    var id = w.id !== undefined ? w.id : nextId;
    if (usedIds.indexOf(id) >= 0) { console.log('  ERROR duplicate id ' + id); process.exit(1); }
    usedIds.push(id);
    nextId = id + 1;

    var obj;
    if (w.attrs) {
      // ==== full 模式：按 config 内嵌快照整对象还原（跳过 seed 克隆） ====
      // 由 _v65_to_config.js 生成：attrs = 保序 [key,val] 列表（除 id/objname/endx/endy），
      // codes = 事件脚本文本。这样与 v65 等价的属性/脚本能精确重建，不引入 seed 默认值。
      var items = [];
      items.push({ kind: 'mark', text: w.typeMark || 'att-39' });
      // objname + id 前置
      items.push({ kind: 'attr', key: 'objname', raw: iconv.encode(w.objname, 'gbk'), value: w.objname });
      items.push({ kind: 'attr', key: 'id', raw: Buffer.from([id]), value: id });
      (w.attrs || []).forEach(function (kv) {
        var key = kv[0], val = kv[1];
        var raw;
        if (typeof val === 'string') raw = iconv.encode(val === '' ? ' ' : val, 'gbk');
        else if (val === undefined || val === null) return;
        else {
          var n = (val & 0xffffffff) > 0xffff ? 4 : ((val & 0xffff) > 0xff ? 2 : (val > 0 ? 1 : 1));
          raw = Buffer.alloc(n || 1);
          if (n === 1) raw.writeUInt8(val & 0xff, 0);
          else if (n === 2) raw.writeUInt16LE(val & 0xffff, 0);
          else raw.writeUInt32LE(val >>> 0, 0);
        }
        items.push({ kind: 'attr', key: key, raw: raw, value: val });
      });
      // endx/endy 由尺寸推导（2字节小端）
      var gx = w.attrs.filter(function (kv) { return kv[0] === 'x'; }).map(function (kv) { return kv[1]; })[0];
      var gy = w.attrs.filter(function (kv) { return kv[0] === 'y'; }).map(function (kv) { return kv[1]; })[0];
      var gw = w.attrs.filter(function (kv) { return kv[0] === 'w'; }).map(function (kv) { return kv[1]; })[0];
      var gh = w.attrs.filter(function (kv) { return kv[0] === 'h'; }).map(function (kv) { return kv[1]; })[0];
      function endBuf(v) { var b = Buffer.alloc(2); b.writeUInt16LE((v) & 0xffff, 0); return b; }
      if (gx !== undefined && gw !== undefined)
        items.push({ kind: 'attr', key: 'endx', raw: endBuf(gx + gw - 1), value: (gx + gw - 1) & 0xffff });
      if (gy !== undefined && gh !== undefined)
        items.push({ kind: 'attr', key: 'endy', raw: endBuf(gy + gh - 1), value: (gy + gh - 1) & 0xffff });
      // 事件槽：所有 TJC 对象都有 codesdown-N/codesup-N；slider 额外有 codesslide-N
      var evNames = ['down', 'up'];
      if (w.seed === 'slider') evNames.push('slide');
      evNames.forEach(function (ev) {
        var code = w.codes && w.codes[ev];
        if (!code || !code.length) { items.push({ kind: 'mark', text: 'codes' + ev + '-0' }); return; }
        var lines = code.split('\n').filter(function (l) { return l.trim().length > 0; });
        items.push({ kind: 'mark', text: 'codes' + ev + '-' + lines.length });
        lines.forEach(function (l) {
          items.push({ kind: 'mark', text: iconv.encode(l.trim(), 'gbk').toString('latin1') });
        });
      });
      items.push({ kind: 'end' });
      obj = { items: items };
    } else {
      // ==== 传统 seed 模式 ====
      var src = loadSeed(w.seed);
      obj = cloneObj(src);
      setObjname(obj, w.objname);
      setAttr(obj, 'id', id);
      Object.keys(w.set || {}).forEach(function(k) { setAttr(obj, k, w.set[k]); });
      // TJC validates txt against txt_maxl (in GBK bytes, since CJK is multi-byte).
      var txtAttr = obj.items.find(function(i) { return i.kind === 'attr' && i.key === 'txt'; });
      var mxAttr = obj.items.find(function(i) { return i.kind === 'attr' && i.key === 'txt_maxl'; });
      if (txtAttr && mxAttr) {
        var need = txtAttr.raw.length;
        if (need > mxAttr.value) setAttr(obj, 'txt_maxl', need);
      }
      var sx = w.set && w.set.x !== undefined ? w.set.x : PAGE.get(obj, 'x');
      var sy = w.set && w.set.y !== undefined ? w.set.y : PAGE.get(obj, 'y');
      var sw = w.set && w.set.w !== undefined ? w.set.w : PAGE.get(obj, 'w');
      var sh = w.set && w.set.h !== undefined ? w.set.h : PAGE.get(obj, 'h');
      if (sx !== undefined && sw !== undefined) setAttr(obj, 'endx', sx + sw - 1);
      if (sy !== undefined && sh !== undefined) setAttr(obj, 'endy', sy + sh - 1);
      clearCodes(obj);
      Object.keys(w.codes || {}).forEach(function(ev) { setCodes(obj, ev, w.codes[ev]); });
    }
    objs.push(obj);
  });

  // check id uniqueness
  var ids = objs.map(function(o) { return PAGE.get(o, 'id'); });
  var dup = ids.filter(function(v, i) { return ids.indexOf(v) !== i; });
  if (dup.length) { console.log('  ERROR duplicate ids: ' + dup.join(',')); process.exit(1); }

  var name = pg.name || pg.file.replace('.pa', '');
  var rebuilt = PAGE.build(name, objs, ps.head);
  rebuilt.fill(0, 24, 40);
  iconv.encode(name, 'gbk').copy(rebuilt, 24);
  var out = path.join(buildDir, pg.file);
  fs.writeFileSync(out, rebuilt);
  console.log('  wrote ' + out + ' (' + rebuilt.length + 'B, nobj=' + objs.length + ')');
}

if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });
cfg.pages.forEach(function(pg) {
  console.log('=== page ' + pg.file + ' ===');
  buildPage(pg);
});
console.log('\nDONE');
