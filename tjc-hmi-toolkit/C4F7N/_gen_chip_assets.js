// 生成主页状态 chip 复刻视觉稿所需图片素材：
//   chip_pill_<w>.png  —— 深色面板底 + 1px 描边的圆角胶囊（透明背景）
//   dot_green.png / dot_amber.png —— 8x8 状态圆点
// 视觉稿配色：panel #12233c / line #1e3a5f / ok #22c55e / warn #f59e0b
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  let t = crc32.table;
  if (!t) {
    t = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c; }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const t = Buffer.from(type, 'latin1');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function encodePNG(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (stride + 1)] = 0; rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride); }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function distRR(px, py, cx, cy, hw, hh, r) {
  const dx = Math.max(Math.abs(px - cx) - (hw - r), 0);
  const dy = Math.max(Math.abs(py - cy) - (hh - r), 0);
  return Math.sqrt(dx * dx + dy * dy) - r;
}
// 圆角胶囊：外缘 line 色描边 1px，内里 panel 色，四周透明
function pill(w, h, panel, line) {
  const cxc = w / 2, cyc = h / 2, r = h / 2;
  const hw = w / 2, hh = h / 2;
  const hwI = w / 2 - 1, hhI = h / 2 - 1, rI = r - 1;
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const d = distRR(x + 0.5, y + 0.5, cxc, cyc, hw, hh, r);      // outer
    const di = distRR(x + 0.5, y + 0.5, cxc, cyc, hwI, hhI, rI);  // inner
    const cov = clamp(0.5 - d, 0, 1);
    if (cov <= 0) continue;
    const idx = (y * w + x) * 4;
    let col;
    if (di <= 0) col = panel; else col = line; // inside inner => panel, ring => line
    rgba[idx + 0] = col[0]; rgba[idx + 1] = col[1]; rgba[idx + 2] = col[2];
    rgba[idx + 3] = Math.round(cov * 255);
  }
  return encodePNG(w, h, rgba);
}
// 实心圆点
function dot(sz, color) {
  const rgba = Buffer.alloc(sz * sz * 4);
  const c = (sz - 1) / 2, r = sz / 2;
  for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) {
    const d = Math.sqrt((x - c) ** 2 + (y - c) ** 2) - (r - 1);
    const cov = clamp(0.5 - d, 0, 1);
    if (cov <= 0) continue;
    const idx = (y * sz + x) * 4;
    rgba[idx + 0] = color[0]; rgba[idx + 1] = color[1]; rgba[idx + 2] = color[2];
    rgba[idx + 3] = Math.round(cov * 255);
  }
  return encodePNG(sz, sz, rgba);
}

const PANEL = [18, 35, 60], LINE = [30, 58, 95];
const GREEN = [34, 197, 94], AMBER = [245, 158, 11], RED = [239, 68, 68], GRAY = [59, 79, 107];
const out = path.join(__dirname, 'ui_components');
fs.mkdirSync(out, { recursive: true });

for (const w of [108, 98, 90, 130, 110]) {
  const p = path.join(out, `chip_pill_${w}.png`);
  fs.writeFileSync(p, pill(w, 28, PANEL, LINE));
  console.log('pill', path.basename(p), fs.statSync(p).size, 'B');
}
// 状态圆点：green=已连接/运行/高电量  gray=未连接/停止  amber=中电量  red=低电量
for (const [name, color] of [['dot_green', GREEN], ['dot_gray', GRAY], ['dot_amber', AMBER], ['dot_red', RED]]) {
  const p = path.join(out, `${name}.png`);
  fs.writeFileSync(p, dot(8, color));
  console.log(name, fs.statSync(p).size, 'B');
}