'use strict';
// PNG helpers needed when replacing images inside an .HMI.
//
// An image payload can be swapped freely — images carry no content stamp — but
// the new PNG has to fit the slot the old one occupied, because replacing a block
// in place cannot change its length. padPng() takes care of the difference.
//
// Colour type: the Editor accepts both 24-bit RGB (type 2) and RGBA (type 6).
// Every image in at least one project the Editor opens without complaint is RGBA.
// An earlier reading of this format claimed 24-bit was mandatory; it is not.

const zlib = require('zlib');

const SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

const CRC_TBL = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TBL[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const b = Buffer.alloc(12 + data.length);
  b.writeUInt32BE(data.length, 0);
  b.write(type, 4, 'latin1');
  data.copy(b, 8);
  b.writeUInt32BE(crc32(b.subarray(4, 8 + data.length)), 8 + data.length);
  return b;
}

// Pad a PNG to an exact length with a private ancillary chunk before IEND.
// Chunk overhead is 12 bytes, so the target must be either exact or at least
// 12 bytes larger. Returns null when that is impossible.
function padPng(png, target) {
  if (png.length === target) return png;
  const need = target - png.length;
  if (need < 12) return null;

  const data = Buffer.alloc(need - 12);
  const pad = Buffer.alloc(need);
  pad.writeUInt32BE(data.length, 0);
  pad.write('paDd', 4, 'latin1');
  data.copy(pad, 8);
  pad.writeUInt32BE(crc32(pad.subarray(4, 8 + data.length)), 8 + data.length);

  const iend = png.length - 12; // IEND is always the last 12 bytes
  return Buffer.concat([png.subarray(0, iend), pad, png.subarray(iend)]);
}

// Walk the chunks and check every CRC. Returns null when the stream is sound,
// otherwise a short description of the first problem found.
function verifyPng(b, w, h) {
  if (!b.subarray(0, 8).equals(SIG)) return 'no PNG signature';

  let off = 8;
  let seenIHDR = false;
  let seenIEND = false;

  while (off + 12 <= b.length) {
    const len = b.readUInt32BE(off);
    const type = b.subarray(off + 4, off + 8).toString('latin1');
    if (off + 12 + len > b.length) return `chunk ${type} runs past end of buffer`;
    if (crc32(b.subarray(off + 4, off + 8 + len)) !== b.readUInt32BE(off + 8 + len))
      return `bad CRC on chunk ${type}`;

    if (type === 'IHDR') {
      seenIHDR = true;
      if (w != null && (b.readUInt32BE(off + 8) !== w || b.readUInt32BE(off + 12) !== h))
        return 'IHDR dimensions do not match the slot';
    }

    off += 12 + len;
    if (type === 'IEND') { seenIEND = true; break; }
  }

  if (!seenIHDR) return 'no IHDR';
  if (!seenIEND) return 'no IEND';
  if (off !== b.length) return `${b.length - off} trailing bytes after IEND`;
  return null;
}

// Encode RGBA pixels as a 24-bit PNG (colour type 2). Useful for round-tripping
// an image out of RGB565 and back without pulling in an image library.
function encodeRGB(rgba, w, h) {
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0, o = 0; y < h; y++) {
    raw[o++] = 0; // row filter: none
    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      raw[o++] = rgba[p];
      raw[o++] = rgba[p + 1];
      raw[o++] = rgba[p + 2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // colour type: truecolour
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    SIG,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

module.exports = { crc32, padPng, verifyPng, encodeRGB, SIG };
