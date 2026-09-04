/* _rebuild_v34r.js — 从 _v34dump.txt（v34 全量对象清单）重建 config（config_c4f7n_v34r.json）
 * 并以 config_c4f7n.json（v38 真源）同名控件的 set 补齐 dump 未打印的属性（pco0/ch/gdc/bpic/ppic/pic2/picc2 等）。
 */
'use strict';
const fs = require('fs');
const iconv = require('iconv-lite');

const DUMP = 'C4F7N/_v34dump.txt';
const REF = 'C4F7N/config_c4f7n.json';
const OUT = 'C4F7N/config_c4f7n_v34r.json';

const TYPE2SEED = { 0: 'wave', 1: 'slider', 53: 'btn53', 54: 'num', 98: 'btn98', 106: 'prog', 112: 'picture', 116: 'text' };
const EV = { codesdown: 'down', codesup: 'up', codesslide: 'slide', codestimer: 'timer' };

const lines = fs.readFileSync(DUMP, 'utf8').split(/\r?\n/);
let cfg = null, page = null, obj = null, slot = null;
const pages = [];

const parseKV = s => {
  const set = {};
  const re = /([a-z_0-9]+)=("[^"]*"|\S+)/g;
  let m;
  while ((m = re.exec(s))) {
    let v = m[2];
    if (v.startsWith('"')) v = JSON.parse(v);
    else if (/^-?\d+$/.test(v)) v = Number(v);
    set[m[1]] = v;
  }
  return set;
};

for (const raw of lines) {
  const line = raw.trim();
  let m;
  if ((m = line.match(/^FILE (\d)\.pa\s+pageName=(\S+)\s+objCount=(\d+)/))) {
    page = { file: m[1] + '.pa', name: m[2], widgets: [] };
    pages.push(page);
    obj = null; slot = null;
    continue;
  }
  if (!page) continue;
  if ((m = line.match(/^\[\s*(\d+)\] (\S+) type=(\d+) x=(-?\d+) y=(-?\d+) w=(\d+) h=(\d+)/))) {
    const [, idx, name, type, x, y, w, h] = m;
    if (Number(type) === 121) {
      page.pageObj = { x: +x, y: +y, w: +w, h: +h };
      obj = { __page: true, attrs: {} };
      page.__pageAttrs = obj.attrs;
    } else {
      obj = { name, type: +type, attrs: { x: +x, y: +y, w: +w, h: +h }, codes: {} };
      page.widgets.push(obj);
    }
    slot = null;
    continue;
  }
  if (!obj) continue;
  if (line.startsWith('bco=') || /^[a-z_0-9]+=/.test(line)) {
    Object.assign(obj.attrs, parseKV(line));
    slot = null;
    continue;
  }
  if ((m = line.match(/^>> codes([a-z]+)-(\d+)$/))) {
    slot = EV['codes' + m[1]] && +m[2] > 0 ? { ev: EV['codes' + m[1]], left: +m[2], buf: [] } : null;
    continue;
  }
  if (line.startsWith('>> ')) {
    const t = line.slice(3);
    if (slot && slot.left > 0) { slot.buf.push(t); slot.left--; if (!slot.left) { obj.codes[slot.ev] = slot.buf.join('\n'); slot = null; } }
    continue; // att-XX markers ignored
  }
}

// 参照 config（v38 真源）补齐 dump 未打印的属性
const ref = JSON.parse(fs.readFileSync(REF, 'utf8'));
const refW = (i, name) => (ref.pages[i] ? ref.pages[i].widgets.find(w => w.objname === name) : null);
const EXTRA = ['pco0', 'ch', 'gdc', 'bpic', 'ppic', 'pic2', 'picc2', 'vvs0', 'vvs1', 'epic', 'efill', 'dis', 'dez', 'dir', 'mode', 'bco0', 'pco2'];

const outPages = [];
pages.forEach((pg, pi) => {
  const widgets = [];
  const pageObj = Object.assign(
    { x: 0, y: 0, w: 1024, h: 600, bco: 2212, pic: 65535 },
    pg.pageObj || {}
  );
  if (pg.__pageAttrs && pg.__pageAttrs.bco !== undefined) pageObj.bco = pg.__pageAttrs.bco;
  for (const o of pg.widgets) {
    if (o.__page) continue;
    const seed = TYPE2SEED[o.type];
    if (!seed) throw new Error('no seed for type ' + o.type + ' ' + o.name);
    const keep = { objname: o.name };
    for (const [k, v] of Object.entries(o.attrs)) {
      if (k === 'id' || k === 'up' || k === 'down') continue; // id 自动分配；页面热区属性不入 set
      keep[k] = v;
    }
    const rw = refW(pi, o.name);
    if (rw && rw.seed === seed) {
      for (const [k, v] of Object.entries(rw.set || {})) {
        if (!(k in keep) && EXTRA.includes(k)) keep[k] = v;
      }
    }
    const w = { seed, objname: o.name, set: keep };
    if (Object.keys(o.codes).length) w.codes = o.codes;
    widgets.push(w);
  }
  outPages.push({ file: pg.file, name: pg.name, pageObj, widgets });
});

const out = {
  template: ref.template,
  pageSeed: ref.pageSeed,
  seeds: ref.seeds,
  pages: outPages
};
fs.writeFileSync(OUT, JSON.stringify(out));
console.log('OK ->', OUT);
outPages.forEach(p => console.log(`  ${p.name}: ${p.widgets.length} widgets`));
