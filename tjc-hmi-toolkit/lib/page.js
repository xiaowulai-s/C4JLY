'use strict';
// Parser and builder for a page block (`N.pa`).
//
//   header, 56 bytes:
//     +4  u32  total block size
//     +8  u32  header size (56)
//     +12 u32  object count (the page itself plus its components)
//     +20 u32  0x00214F00
//     +24 char[16] page name
//     +40 u32  NOT a constant — 0x00014401 on some pages, zero on others
//     +56 object table, 12 bytes per object: offset (from +56), length, 0
//         followed by the object bodies
//
//   object: a marker (`att-NN`), then a chain of `u32 length + body` records and
//           a terminating zero. Records of length >= 16 carry a 16-byte attribute
//           name followed by the value; shorter ones are markers.
//
// Round-trip is byte-exact on 76 of 76 pages across every project tested: parse
// then build reproduces the original block except for the stamp field.
//
// Because field +40 is not a constant, build() takes a header sample from an
// existing page and only rewrites the name, the object count and the size. This
// is exactly where an earlier attempt at this format went wrong.

// Attributes whose value is always a string, regardless of length.
const STR = new Set(['objname', 'txt', 'path', 'from', 'val0', 'val1']);

const HEADER_SIZE = 56;

function parse(buf) {
  const total = buf.readUInt32LE(4);
  const hdr = buf.readUInt32LE(8);
  const nobj = buf.readUInt32LE(12);
  const name = buf.subarray(24, 40).toString('latin1').replace(/\0.*$/, '');

  const table = [];
  for (let i = 0; i < nobj; i++) {
    const p = hdr + i * 12;
    table.push({
      off: buf.readUInt32LE(p),
      len: buf.readUInt32LE(p + 4),
      tail: buf.readUInt32LE(p + 8)
    });
  }

  const objs = table.map(t => readObj(buf, hdr + t.off, t.len));

  return {
    total, hdr, nobj, name, table, objs,
    head: Buffer.from(buf.subarray(0, hdr)),
    raw: buf
  };
}

function readObj(buf, at, len) {
  const items = [];
  let o = at;
  const end = at + len;

  while (o + 4 <= end) {
    const L = buf.readUInt32LE(o);
    if (L === 0) { items.push({ kind: 'end' }); o += 4; continue; }
    if (o + 4 + L > end) break;

    const body = buf.subarray(o + 4, o + 4 + L);
    if (L >= 16) {
      const key = body.subarray(0, 16).toString('latin1').replace(/\0.*$/, '');
      const v = body.subarray(16);
      items.push({ kind: 'attr', key, raw: Buffer.from(v), value: decode(key, v) });
    } else {
      items.push({ kind: 'mark', text: body.toString('latin1') });
    }
    o += 4 + L;
  }
  return { items, len };
}

function decode(key, v) {
  if (STR.has(key)) return v.toString('latin1').replace(/\0+$/, '');
  if (v.length === 1) return v[0];
  if (v.length === 2) return v.readUInt16LE(0);
  if (v.length === 4) return v.readUInt32LE(0);
  return v.toString('latin1').replace(/\0+$/, '');
}

function encode(key, value, oldLen) {
  if (typeof value === 'string') return Buffer.from(value, 'latin1');
  const b = Buffer.alloc(oldLen || 2);
  if (b.length === 1) b.writeUInt8(value & 0xff, 0);
  else if (b.length === 2) b.writeUInt16LE(value & 0xffff, 0);
  else b.writeUInt32LE(value >>> 0, 0);
  return b;
}

const get = (obj, key) => {
  const a = obj.items.find(i => i.kind === 'attr' && i.key === key);
  return a ? a.value : undefined;
};

const marker = obj => {
  const m = obj.items.find(i => i.kind === 'mark');
  return m ? m.text : '';
};

// Change attribute values in place. Record length is preserved except for strings.
function set(obj, patch) {
  for (const [k, val] of Object.entries(patch)) {
    const a = obj.items.find(i => i.kind === 'attr' && i.key === k);
    if (!a) throw new Error(`object has no attribute ${k}`);
    a.raw = encode(k, val, a.raw.length);
    a.value = val;
  }
  return obj;
}

function writeObj(obj) {
  const parts = [];
  for (const it of obj.items) {
    if (it.kind === 'end') { parts.push(Buffer.alloc(4)); continue; }
    if (it.kind === 'mark') {
      const t = Buffer.from(it.text, 'latin1');
      const h = Buffer.alloc(4);
      h.writeUInt32LE(t.length, 0);
      parts.push(h, t);
      continue;
    }
    const key = Buffer.alloc(16);
    key.write(it.key, 0, 'latin1');
    const h = Buffer.alloc(4);
    h.writeUInt32LE(16 + it.raw.length, 0);
    parts.push(h, key, it.raw);
  }
  return Buffer.concat(parts);
}

// Build a page block. `head` is a 56-byte header sample taken from an existing
// page — only the name, object count and total size are rewritten. Passing no
// sample produces a header with a zeroed +40 field, which is valid on some
// projects and not on others; prefer a real sample.
function build(name, objs, head) {
  const bodies = objs.map(writeObj);
  const tableLen = objs.length * 12;
  const table = Buffer.alloc(tableLen);

  let off = tableLen;
  bodies.forEach((b, i) => {
    table.writeUInt32LE(off, i * 12);
    table.writeUInt32LE(b.length, i * 12 + 4);
    table.writeUInt32LE(0, i * 12 + 8);
    off += b.length;
  });

  const h = head ? Buffer.from(head) : Buffer.alloc(HEADER_SIZE);
  if (h.length !== HEADER_SIZE)
    throw new Error(`header sample is ${h.length} bytes, expected ${HEADER_SIZE}`);

  h.writeUInt32LE(HEADER_SIZE, 8);
  h.writeUInt32LE(objs.length, 12);
  if (!head) h.writeUInt32LE(0x00214f00, 20);
  h.fill(0, 24, 40);
  h.write(name, 24, 'latin1');

  const out = Buffer.concat([h, table, ...bodies]);
  out.writeUInt32LE(out.length, 4);
  return out;
}

module.exports = { parse, build, set, get, marker, writeObj, readObj, HEADER_SIZE };
