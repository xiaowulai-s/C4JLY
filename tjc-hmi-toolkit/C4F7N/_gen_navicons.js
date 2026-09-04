// 生成底部导航图标 (Segoe MDL2 Assets)，4 图标 × 灰/青 = 8 张 32x32
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FFMPEG = 'C:\\FFMPEG\\FFMPEG-2025-07-31-GIT-119D127D05-FULL_BUILD\\BIN\\ffmpeg.exe';
const FONT = path.join(__dirname, 'ui_components', 'mdl2.ttf');
fs.copyFileSync('C:\\Windows\\Fonts\\segmdl2.ttf', FONT);

const SZ = 32;
const GRAY = '0x7D93AD', CYAN = '0x22D3EE';   // #7d93ad sub / #22d3ee cyan-l
// 图标 codepoint: home/settings/chart(info/curve)/info
const items = [
  { name: 'home',  cp: 0xE80F },
  { name: 'set',   cp: 0xE713 },
  { name: 'curve', cp: 0xE9D9 },
  { name: 'about', cp: 0xE946 },
];
const outdir = path.join(__dirname, 'ui_components', 'nav');
fs.mkdirSync(outdir, { recursive: true });
const RELF = 'ui_components/mdl2.ttf';      // 相对路径(避免 D: 冒号破坏 drawtext 选项)
const gen = (name, cp, color, file) => {
  fs.writeFileSync(path.join(outdir, '_g.txt'), String.fromCharCode(cp), 'utf8');
  const relOut = path.relative(__dirname, file);
  const args = [
    '-hide_banner','-y',
    '-f','lavfi','-i',`color=black@0:s=${SZ}x${SZ},format=rgba`,
    '-vf',`drawtext=fontfile=${RELF}:textfile=ui_components/nav/_g.txt:fontcolor=${color}:fontsize=${SZ}:x=(w-text_w)/2:y=(h-text_h)/2`,
    '-frames:v','1', relOut,
  ];
  try { execFileSync(FFMPEG, args, { cwd: __dirname, stdio: 'ignore' }); }
  catch(e){ console.log('ERR icon', name, color, e.message); }
  fs.unlinkSync(path.join(outdir, '_g.txt'));
};
for (const it of items) {
  const g = path.join(outdir, `nav_${it.name}_g.png`);
  const c = path.join(outdir, `nav_${it.name}_c.png`);
  gen(it.name, it.cp, GRAY, g);
  gen(it.name, it.cp, CYAN, c);
  console.log('icon', it.name, 'g='+fs.statSync(g).size, 'c='+fs.statSync(c).size);
}