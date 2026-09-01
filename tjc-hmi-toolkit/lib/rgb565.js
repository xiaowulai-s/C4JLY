'use strict';
// RGB565 conversion, including the rotation that landscape projects need.
//
// Every image in an .HMI is stored twice: as a PNG source and as raw RGB565,
// little-endian, exactly `width * height * 2` bytes. The Editor compares the raw
// data against the PNG when opening the file, so the two must agree — a mismatch
// produces "Wrong resource file or resource file has been damaged".
//
// THE ROTATION. In a landscape project (90 deg) the Editor stores pixels rotated
// clockwise: the panel is physically 240x320, so the data runs in columns of
// height H rather than rows of width W.
//
//   landscape:  index = x * h + (h - 1 - y)
//   portrait:   index = y * w + x
//
// Verified byte for byte against three images of a real landscape project
// (320x240, 118x19, 16x12) with zero differences, and against a portrait project
// with no rotation applied. Writing landscape data unrotated is the single most
// common reason a hand-built file is rejected.

// Pixel index inside the RGB565 array, in pixels (multiply by 2 for byte offset).
const index = (x, y, w, h, horizontal) =>
  horizontal ? x * h + (h - 1 - y) : y * w + x;

// RGBA bytes -> RGB565 little-endian.
function toRgb565(rgba, w, h, horizontal = false) {
  const out = Buffer.alloc(w * h * 2);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      const v = ((rgba[p] >> 3) << 11) | ((rgba[p + 1] >> 2) << 5) | (rgba[p + 2] >> 3);
      out.writeUInt16LE(v, index(x, y, w, h, horizontal) * 2);
    }
  }
  return out;
}

// RGB565 little-endian -> RGBA bytes, alpha fixed at 255. The low bits dropped by
// the 5/6/5 packing are reconstructed by replication, which is what the panel
// effectively displays.
function fromRgb565(raw, w, h, horizontal = false) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const v = raw.readUInt16LE(index(x, y, w, h, horizontal) * 2);
      const r = (v >> 11) & 0x1f;
      const g = (v >> 5) & 0x3f;
      const b = v & 0x1f;
      const p = (y * w + x) * 4;
      out[p] = (r << 3) | (r >> 2);
      out[p + 1] = (g << 2) | (g >> 4);
      out[p + 2] = (b << 3) | (b >> 2);
      out[p + 3] = 255;
    }
  }
  return out;
}

// Convert a 16-bit RGB565 value to #rrggbb, handy when reading colour attributes
// out of page objects (bco, pco and friends are RGB565).
function toHex(v) {
  const r = (v >> 11) & 0x1f;
  const g = (v >> 5) & 0x3f;
  const b = v & 0x1f;
  const h = n => n.toString(16).padStart(2, '0');
  return `#${h((r << 3) | (r >> 2))}${h((g << 2) | (g >> 4))}${h((b << 3) | (b >> 2))}`;
}

const fromHex = hex => {
  const n = parseInt(hex.replace('#', ''), 16);
  return (((n >> 19) & 0x1f) << 11) | (((n >> 10) & 0x3f) << 5) | ((n >> 3) & 0x1f);
};

module.exports = { index, toRgb565, fromRgb565, toHex, fromHex };
