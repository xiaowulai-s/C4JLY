// 生成两张 92x32 扁平胶囊 PNG（选中 / 未选中），纯 Node 实现，无外部依赖
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// ---------- PNG 编码 ----------
function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'latin1');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePNG(w, h, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  // scanlines，每行前加 filter byte 0
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

// ---------- 圆角胶囊几何：有符号距离 ----------
function distRoundedRect(px, py, cx, cy, hw, hh, r) {
  const dx = Math.max(Math.abs(px - cx) - (hw - r), 0);
  const dy = Math.max(Math.abs(py - cy) - (hh - r), 0);
  return Math.sqrt(dx * dx + dy * dy) - r;
}

// 生成扁平胶囊图，topColor -> bottomColor 垂直渐变，抗锯齿
function build(w, h, top, bottom) {
  const hw = (w - 4) / 2;   // 留 2px 描边余量，实际胶囊宽 w-4
  const hh = (h - 4) / 2;
  const r = Math.min(hw, hh); // 完全圆角
  const cx = w / 2, cy = h / 2;
  // 顶部高光微渐变增量
  const rgba = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const t = y / (h - 1);
    for (let x = 0; x < w; x++) {
      const d = distRoundedRect(x + 0.5, y + 0.5, cx, cy, hw, hh, r);
      // 1px 平滑过渡
      const cov = Math.max(0, Math.min(1, 0.5 - d));
      if (cov <= 0) continue;
      const idx = (y * w + x) * 4;
      const to = t;
      rgba[idx + 0] = Math.round(top[0] + (bottom[0] - top[0]) * to);
      rgba[idx + 1] = Math.round(top[1] + (bottom[1] - top[1]) * to);
      rgba[idx + 2] = Math.round(top[2] + (bottom[2] - top[2]) * to);
      rgba[idx + 3] = Math.round(Math.min(1, cov * 1.05) * 255); // 轻微提升边缘覆盖率
    }
  }
  return encodePNG(w, h, rgba);
}

const W = 92, H = 32;
const sel  = build(W, H, [8, 145, 178], [34, 211, 238]);   // 选中：青色渐变
const norm = build(W, H, [18, 35, 60], [30, 58, 95]);      // 未选中：深蓝渐变

const outDir = path.join(__dirname, 'ui_components');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const selPath  = path.join(outDir, 'pill_selected.png');
const normPath = path.join(outDir, 'pill_normal.png');
fs.writeFileSync(selPath, sel);
fs.writeFileSync(normPath, norm);
console.log('selected:', selPath, sel.length, 'bytes');
console.log('normal  :', normPath, norm.length, 'bytes');