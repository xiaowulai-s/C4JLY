// 生成徽标底色：青色渐变圆角方块 (512x512, 透明四角)，供 ffmpeg 叠加 C4 文字
'use strict';
const zlib=require('zlib'),fs=require('fs'),path=require('path');
function crc32(b){let t=crc32.t;if(!t){t=crc32.t=new Int32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;t[n]=c;}}let c=-1;for(let i=0;i<b.length;i++)c=t[(c^b[i])&0xff]^(c>>>8);return(c^-1)>>>0;}
function ch(t,d){const l=Buffer.alloc(4);l.writeUInt32BE(d.length,0);const tb=Buffer.from(t,'latin1');const cr=Buffer.alloc(4);cr.writeUInt32BE(crc32(Buffer.concat([tb,d])),0);return Buffer.concat([l,tb,d,cr]);}
function enc(w,h,by){const sig=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);const ih=Buffer.alloc(13);ih.writeUInt32BE(w,0);ih.writeUInt32BE(h,4);ih[8]=8;ih[9]=6;ih[10]=0;ih[11]=0;ih[12]=0;const st=w*4;const raw=Buffer.alloc((st+1)*h);for(let y=0;y<h;y++){raw[y*(st+1)]=0;by.copy(raw,y*(st+1)+1,y*st,y*st+st);}return Buffer.concat([sig,ch('IHDR',ih),ch('IDAT',zlib.deflateSync(raw,{level:9})),ch('IEND',Buffer.alloc(0))]);}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function distRR(px,py,cx,cy,hw,hh,r){const dx=Math.max(Math.abs(px-cx)-(hw-r),0),dy=Math.max(Math.abs(py-cy)-(hh-r),0);return Math.sqrt(dx*dx+dy*dy)-r;}
const SZ=process.argv[2]? +process.argv[2] : 512;
const R=Math.round(SZ*0.23);
const TOP=[8,145,178],BOT=[6,95,120];
const rgba=Buffer.alloc(SZ*SZ*4);
for(let y=0;y<SZ;y++){const t=y/(SZ-1);const c0=Math.round(TOP[0]+(BOT[0]-TOP[0])*t),c1=Math.round(TOP[1]+(BOT[1]-TOP[1])*t),c2=Math.round(TOP[2]+(BOT[2]-TOP[2])*t);
  for(let x=0;x<SZ;x++){const d=distRR(x+0.5,y+0.5,SZ/2,SZ/2,(SZ-2)/2,(SZ-2)/2,R);const cov=clamp(0.5-d,0,1);if(cov<=0)continue;const idx=(y*SZ+x)*4;rgba[idx+0]=c0;rgba[idx+1]=c1;rgba[idx+2]=c2;rgba[idx+3]=Math.round(cov*255);}}
const out=path.join(__dirname,'ui_components','_badge_bg.png');
fs.writeFileSync(out,enc(SZ,SZ,rgba));console.log('wrote',out,fs.statSync(out).size+'B');