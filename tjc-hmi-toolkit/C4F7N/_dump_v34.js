// dump all widgets of extracted .pa files
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');
const P = require(path.join(__dirname, '..', 'lib', 'page.js'));

const dir = process.argv[2] || '_v34check';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.pa')).sort();

const dec = s => {
  if (typeof s !== 'string') return s;
  try { return iconv.decode(Buffer.from(s, 'latin1'), 'gbk'); } catch (e) { return s; }
};

const ATTRS = ['objname','type','x','y','w','h','font','txt','txt_maxl','bco','pco','borderc','xcen','ycen','sta','pic','picc','isbr','pw','vvs','val','maxval','minval','lenth','format','key','mode','dis','dir','dez','tim','dra','up','down','bcop','pcop','spax','spay','borderw','radius','line','linecount','angle','radian','startang','endang','arcline','arclinec','gradiant','fill','path','from','val0','val1','objid','code_pw','en','id'];

for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f));
  const p = P.parse(buf);
  console.log('\n============================================================');
  console.log('FILE ' + f + '  pageName=' + dec(p.name) + '  objCount=' + p.objs.length);
  console.log('============================================================');
  p.objs.forEach((o, i) => {
    const get = (k) => { try { return P.get(o, k); } catch (e) { return undefined; } };
    const name = get('objname');
    const type = get('type');
    const geo = ['x','y','w','h'].map(k => k + '=' + get(k)).join(' ');
    let line = '[' + String(i).padStart(2) + '] ' + (name === undefined ? '(PAGE/ANON)' : name) + ' type=' + type + ' ' + geo;
    const extra = [];
    for (const k of ATTRS) {
      if (['objname','type','x','y','w','h'].includes(k)) continue;
      const v = get(k);
      if (v === undefined || v === null || v === '') continue;
      extra.push(k + '=' + (typeof v === 'string' ? JSON.stringify(dec(v)) : v));
    }
    if (extra.length) line += '\n      ' + extra.join(' ');
    console.log(line);
    const marks = o.items.filter(it => it.kind === 'mark').map(it => dec(it.text));
    const evs = o.items.filter(it => it.kind === 'attr' && /^codes/.test(it.key));
    evs.forEach(e => console.log('      #' + e.key + ': ' + dec(e.value.toString('latin1')).replace(/\r?\n/g, ' | ')));
    marks.forEach(m => console.log('      >> ' + m));
  });
}
