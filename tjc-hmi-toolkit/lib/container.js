'use strict';
// The .HMI container: directory, manifest, image records.
//
// An .HMI file is a sparse container with a directory of absolute offsets. Real
// payload is a few hundred KB inside a 7-10 MB file.
//
//   0x000000  directory
//   0x080000  mirror copy of the directory (not read when opening)
//   0x380000  allocation table, starts with ffffffff
//   0x6ffff8  signature `ver2` plus a model tag (e.g. `1234` for 3224K)
//   0x700000+ blocks: manifest, Program.s, images, fonts, pages
//
// Everything here is read-only analysis. Writing the directory yourself does not
// work — see lib/stamp.js and hmipack/ for why.

const DIRECTORY_MIRROR = 0x080000;
const MANIFEST_MAGIC = 0xbdabdc9d;
const MANIFEST_HEADER = 96;

// --- directory -------------------------------------------------------------

// u32 count, then 28-byte entries: name[16], offset u32, size u32, flags u32.
// Offsets are absolute, so a block may live anywhere in the file.
// flags bit 0 marks a stale copy left over from an earlier save.
function readDirectory(buf, base = 0) {
  const count = buf.readUInt32LE(base);
  const entries = [];
  for (let i = 0; i < count && base + 4 + i * 28 + 28 <= buf.length; i++) {
    const o = base + 4 + i * 28;
    entries.push({
      i,
      at: o,
      name: buf.subarray(o, o + 16).toString('latin1').replace(/\0.*$/, ''),
      off: buf.readUInt32LE(o + 16),
      size: buf.readUInt32LE(o + 20),
      flags: buf.readUInt32LE(o + 24),
      stale: (buf.readUInt32LE(o + 24) & 1) === 1
    });
  }
  return { count, entries };
}

const liveEntries = buf => readDirectory(buf).entries.filter(e => !e.stale);

// --- manifest (main.HMI) ---------------------------------------------------

// The manifest is the project's resource list: it decides how many images, fonts
// and pages the project has. Blocks not listed here stay in the file as garbage
// and the Editor ignores them. Image dimensions are NOT stored here, so image
// sizes can change without touching it.
//
//   +0  u32  content stamp
//   +4  u32  header size (96)
//   +8  u32  0x01214401
//   +12 u8   orientation: 0 portrait, 1 landscape (90 deg)
//   +13 u8   font encoding: 0x07 iso-8859-5, 0x16 koi8-r
//   +16 u32  0xBDABDC9D
//   +24 u32  table offset (96)
//   +28 u32  resource count
//   +96 entries, 16 bytes: char[8] extension, char[8] name
function readManifest(buf) {
  const e = liveEntries(buf).find(x => x.name === 'main.HMI');
  if (!e) return null;

  const b = buf.subarray(e.off, e.off + e.size);
  if (b.length < MANIFEST_HEADER || b.readUInt32LE(16) !== MANIFEST_MAGIC) return null;

  const count = b.readUInt32LE(28);
  const resources = [];
  for (let i = 0; i < count && MANIFEST_HEADER + i * 16 + 16 <= b.length; i++) {
    const o = MANIFEST_HEADER + i * 16;
    resources.push({
      ext: b.subarray(o, o + 8).toString('latin1').replace(/\0.*$/, ''),
      name: b.subarray(o + 8, o + 16).toString('latin1').replace(/\0.*$/, '')
    });
  }

  return {
    entry: e,
    stamp: b.readUInt32LE(0),
    orientation: b[12] === 1 ? 'landscape' : 'portrait',
    horizontal: b[12] === 1,
    fontEncoding: b[13] === 0x07 ? 'iso-8859-5' : b[13] === 0x16 ? 'koi8-r' : `0x${b[13].toString(16)}`,
    count,
    resources
  };
}

const isHorizontal = buf => {
  const m = readManifest(buf);
  return m ? m.horizontal : false;
};

// --- image records ---------------------------------------------------------

// Each image is stored twice in a row: the PNG source the Editor shows, then the
// same picture as raw RGB565 for the panel.
//
//   +0  8   <ver> 64 01 01 00 00 00 00   PNG record
//           <ver> 64 01 00 00 00 00 00   RGB565 record
//   +8  u32 header size: 27 for PNG, 24 for RGB565
//   +12 u16 width
//   +14 u16 height
//   +16 u32 payload length
//   +20 u32 0
//   +24 3   "png"   (PNG record only)
//   +27/+24 payload
//
// The first byte is an Editor version tag: 0x0a in older projects, 0x0b in newer
// ones. It can differ between the .is and .i record inside one file.
const HDR_PNG = 27;
const HDR_RAW = 24;

function magicKind(buf, off) {
  if (off + 8 > buf.length) return null;
  const v = buf[off];
  if ((v !== 0x0a && v !== 0x0b) || buf[off + 1] !== 0x64 || buf[off + 2] !== 0x01) return null;
  if (buf[off + 4] || buf[off + 5] || buf[off + 6] || buf[off + 7]) return null;
  return buf[off + 3] === 1 ? 'png' : buf[off + 3] === 0 ? 'raw' : null;
}

function recordAt(buf, off) {
  if (off + 24 > buf.length) return null;
  const kind = magicKind(buf, off);
  if (!kind) return null;

  const isPng = kind === 'png';
  const hdr = buf.readUInt32LE(off + 8);
  if (hdr !== (isPng ? HDR_PNG : HDR_RAW)) return null;

  const w = buf.readUInt16LE(off + 12);
  const h = buf.readUInt16LE(off + 14);
  const len = buf.readUInt32LE(off + 16);
  if (off + hdr + len > buf.length) return null;

  return { off, kind, hdr, w, h, len, data: off + hdr, end: off + hdr + len };
}

// Images are found through the directory: `N.is` (PNG) and `N.i` (RGB565) blocks
// are interleaved with fonts, so walking records sequentially does not work.
function readImages(buf) {
  const byNum = new Map();
  for (const e of liveEntries(buf)) {
    const m = /^(\d+)\.(is|i)$/.exec(e.name);
    if (!m) continue;
    const r = recordAt(buf, e.off);
    if (!r) continue;

    const n = Number(m[1]);
    if (!byNum.has(n)) byNum.set(n, { id: n, w: r.w, h: r.h });
    const p = byNum.get(n);
    p[m[2] === 'is' ? 'png' : 'raw'] = r;
    p.w = r.w;
    p.h = r.h;
  }
  return [...byNum.entries()].sort((a, b) => a[0] - b[0]).map(([, p]) => p);
}

// PNG colour type, read straight out of IHDR: 2 = 24-bit RGB, 6 = RGBA.
// Both occur in files the Editor opens without complaint.
const pngColourType = (buf, image) => (image.png ? buf[image.png.data + 25] : null);

// --- stamped blocks --------------------------------------------------------

// Blocks that carry a content stamp: pages (+4 == size and +8 == 56) and the
// manifest (+4 == 96 with the magic at +16).
function stampedBlocks(buf) {
  const out = [];
  for (const e of liveEntries(buf)) {
    if (e.size < 56 || e.off + e.size > buf.length) continue;
    const b = buf.subarray(e.off, e.off + e.size);
    const isPage = b.readUInt32LE(4) === e.size && b.readUInt32LE(8) === 56;
    const isManifest = b.readUInt32LE(4) === MANIFEST_HEADER && b.readUInt32LE(16) === MANIFEST_MAGIC;
    if (isPage || isManifest) out.push({ ...e, kind: isPage ? 'page' : 'manifest', block: b });
  }
  return out;
}

module.exports = {
  DIRECTORY_MIRROR, MANIFEST_MAGIC, MANIFEST_HEADER,
  readDirectory, liveEntries,
  readManifest, isHorizontal,
  recordAt, readImages, pngColourType,
  stampedBlocks
};
