/* _diff_v34base.js — 对比 config 直出的 .pa 与 v34.HMI 提取的 .pa，找出补丁内容 */
'use strict';
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const P = require('./lib/page.js');

const gbk = s => { try { return iconv.decode(Buffer.from(s, 'latin1'), 'gbk'); } catch (e) { return s; } };
const dec = v => (typeof v === 'string' ? gbk(v) : v);

function snapshot(paPath) {
  const p = P.parse(fs.readFileSync(paPath));
  const map = new Map();
  p.objs.forEach((o, i) => {
    const name = gbk((P.get(o, 'objname') || 'PAGE' + i));
    const rec = {};
    for (const it of o.items) {
      if (it.kind === 'attr') rec[it.key] = dec(it.value);
      else if (it.kind === 'mark' && /^codes([a-z]+)-\d+$/.test(String(it.text || ''))) {
        rec['__slot_' + it.text] = true;
      }
    }
    map.set(name, { i, rec });
  });
  return { name: gbk(p.name), map, n: p.objs.length };
}

const ATTRS_SKIP = new Set([]);
for (let pg = 0; pg < 4; pg++) {
  const A = snapshot(path.join('C4F7N/_v34base', pg + '.pa'));
  const B = snapshot(path.join('C4F7N/_v34check', pg + '.pa'));
  console.log(`\n===== 页${pg} [${A.name}] base=${A.n} v34=${B.n} =====`);
  const names = [...new Set([...A.map.keys(), ...B.map.keys()])];
  for (const n of names) {
    const a = A.map.get(n), b = B.map.get(n);
    if (!a) { console.log(`  + [v34 only] ${n}`); continue; }
    if (!b) { console.log(`  - [base only] ${n}`); continue; }
    const keys = [...new Set([...Object.keys(a.rec), ...Object.keys(b.rec)])];
    const diffs = [];
    for (const k of keys) {
      if (ATTRS_SKIP.has(k)) continue;
      const va = JSON.stringify(a.rec[k]), vb = JSON.stringify(b.rec[k]);
      if (va !== vb) diffs.push(`${k}: ${va} -> ${vb}`);
    }
    if (diffs.length) console.log(`  ~ ${n}\n      ${diffs.join('\n      ')}`);
  }
}
