/* 统一重建四页公共 chrome：顶栏(logo+状态chip) + 底栏(图标+文字+高亮)，四页一致
 * icons id: home c=15 g=16 / set c=17 g=18 / curve c=13 g=14 / about c=11 g=12
 */
const fs = require('fs');
const P = 'D:\\Demo\\C4jly\\tjc-hmi-toolkit\\C4F7N\\config_c4f7n.json';
const cfg = JSON.parse(fs.readFileSync(P, 'utf8'));

const LOGO=10, PANEL=4359, LINE=6603, CYAN=9885, SUB=31893;
const PILL_PROBE=8, PILL_PUMP=7, PILL_BAT=7, DOT_GREEN=5;
const NAV_COLOR = { c:[15,17,13,11], g:[16,18,14,12] }; // idx0..3 主页/设置/曲线/关于
const NAV_LABEL = ['\u4e3b\u9875','\u8bbe\u7f6e','\u5386\u53f2\u66f2\u7ebf','\u5173\u4e8e']; // 主页设置历史曲线关于
const CHIP = [
  { b:PILL_PROBE, t:'\u63a2\u5934 \u5df2\u8fde\u63a5' },  // 探头 已连接
  { b:PILL_PUMP,  t:'\u6cf5 \u8fd0\u884c' },               // 泵 运行
  { b:PILL_BAT,   t:'\u7535\u91cf 78%' },                  // 电量 78%
];
const CHIP_X=[626,768,890], CHIP_W=[130,110,110];
const bar=o=>({seed:'text',objname:o+'_bar',set:{x:0,y:526,w:1024,h:74,font:0,txt:' ',bco:PANEL,pco:65535,pic:65535,picc:65535}});

cfg.pages.forEach((pg,pi)=>{
  const s = pi===0 ? '' : '_s'+pi;
  const navSuffix = pi===0? '': String(pi); // page1 -> nh1, page2 -> nh2, page3 -> nh3

  // --- remove old chrome bits (lg_sN, psub_sN, old pc chips 所有形态) ---
  pg.widgets = pg.widgets.filter(w=>{
    if(w.objname==='lg'+s || w.objname==='psub'+s) return false;
    if(/^pc[012](b|d)?(_s\d+)?$/.test(w.objname)) return false; // 移除旧 chip(btn53/text/picture 全部)
    return true;
  });

  const add=[];
  // logo
  add.push({seed:'picture',objname:'lg'+s,set:{x:14,y:6,w:52,h:52,pic:LOGO}});
  // status chips (right-aligned, same as home)
  CHIP.forEach((c,i)=>{
    const x=CHIP_X[i], w=CHIP_W[i], dotY=18+(28-8)/2;
    const nm=c==CHIP[0]?'pc0':c==CHIP[1]?'pc1':'pc2';
    add.push({seed:'picture',objname:nm+'b'+s,set:{x:x,y:18,w:w,h:28,pic:c.b}});
    add.push({seed:'text',   objname:nm+s,set:{x:x+24,y:18,w:w-38,h:28,font:0,txt:c.t,bco:PANEL,pco:SUB,pic:65535,picc:65535,xcen:1,ycen:1}});
    add.push({seed:'picture',objname:nm+'d'+s,set:{x:x+12,y:dotY,w:8,h:8,pic:DOT_GREEN}});
  });
  // bottom nav background + divider
  add.push({seed:'text',objname:'navbg'+s,set:{x:0,y:526,w:1024,h:74,font:0,txt:' ',bco:PANEL,pic:65535,picc:65535}});
  add.push({seed:'text',objname:'navdiv'+s,set:{x:0,y:526,w:1024,h:2,font:0,txt:' ',bco:LINE,pic:65535,picc:65535}});
  // active item index: page0->主页(0) p1->设置(1) p2->曲线(2) p3->关于(3)
  const activeIdx = pi; // 0-pa主,1-pa设置,2-pa曲线,3-pa关于
  for(let i=0;i<4;i++){
    const x=i*256; const act = i===activeIdx;
    add.push({seed:'picture',objname:('navI'+s)+i,set:{x:x+112,y:528,w:32,h:32,pic: act?NAV_COLOR.c[i]:NAV_COLOR.g[i]}});
    add.push({seed:'text',objname:('navT'+s)+i,set:{x:x,y:566,w:256,h:20,font:0,txt:NAV_LABEL[i],bco:PANEL,pco: act?CYAN:SUB,pic:65535,picc:65535,xcen:1,ycen:1}});
    if(act) add.push({seed:'text',objname:('navH'+s)+i,set:{x:x+46,y:526,w:164,h:3,font:0,txt:' ',bco:CYAN,pic:65535,picc:65535}});
  }
  pg.widgets.push(...add);
});

// fix nav button positions/size/txt (2nd pass): 4 buttons at y526 h74, txt=' '
const order=['nh','ns','nc','na'];
cfg.pages.forEach((pg,pi)=>{
  const ns = pi===0?'':String(pi);
  pg.widgets.forEach(w=>{
    if(w.seed!=='btn98') return;
    const m=/^(n([hscn]))(\d*)$/.exec(w.objname);
    if(!m)return;
    const idx=order.indexOf(m[2]); if(idx<0)return;
    const expName = m[1]+ (pi===0?'':pi); // nh / nh1...
    if(w.objname!==expName) return;
    w.set.x=idx*256; w.set.y=526; w.set.w=256; w.set.h=74; w.set.txt=' '; w.set.bco=PANEL;
  });
});

fs.writeFileSync(P, JSON.stringify(cfg), 'utf8');
console.log('chrome rebuilt for 4 pages');
for(const pg of cfg.pages){
  const bars = pg.widgets.filter(w=>w.objname.endsWith('_bar')||w.objname==='navbg'+pg.file.replace('.pa',''));
  console.log(pg.file, 'total', pg.widgets.length, 'navI', pg.widgets.filter(w=>/^navI/.test(w.objname)).length,
    'chips', pg.widgets.filter(w=>/^pc[012]b/.test(w.objname)).length, 'logo', pg.widgets.filter(w=>/^lg/.test(w.objname)).length);
}