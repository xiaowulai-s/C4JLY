'use strict';
// Content stamp of an .HMI block — the checksum that makes the Nextion Editor
// reject files edited outside of it with "Version mismatch" -> "Loading Page Failed".
//
//   stamp = CRC32(message) ^ K(block length)
//
// CRC32 parameters: polynomial 0x04C11DB7, MSB-first (NOT reflected), init 0,
// no final XOR.
//
// Message: every byte of the block starting at offset 4 (the stamp field itself
// is skipped) is widened to four bytes — a big-endian u32 of the byte value —
// and 40 zero bytes are appended. In other words the block is hashed as an array
// of 32-bit words, not as a byte stream. This is why brute-forcing ordinary CRC
// variants over the raw bytes never matched.
//
// K is a constant that depends only on the block length. Its derivation is not
// known; the values below were lifted from real Editor-produced files and then
// cross-checked — constants taken from one project correctly predict stamps in
// unrelated ones.
//
// Verified: 162 of 164 stamped blocks across 20 projects. Both mismatches are in
// one hand-edited file and are exactly the edit that made the Editor complain.
//
// Blocks that carry a stamp: the manifest (main.HMI) and pages (N.pa).
// Images and fonts have none — their payload can be replaced freely.

const POLY = 0x04c11db7;

const TBL = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n << 24;
  for (let k = 0; k < 8; k++) c = c & 0x80000000 ? (c << 1) ^ POLY : c << 1;
  TBL[n] = c;
}

const step = (c, b) => ((c << 8) ^ TBL[((c >>> 24) ^ b) & 0xff]) | 0;

// CRC of the message, without the length constant.
function core(block) {
  let c = 0;
  for (let i = 4; i < block.length; i++) {
    c = step(c, 0);
    c = step(c, 0);
    c = step(c, 0);
    c = step(c, block[i]);
  }
  for (let k = 0; k < 40; k++) c = step(c, 0);
  return c >>> 0;
}

// K by block length. Manifest length is 96 + 16 * resourceCount;
// an empty page is 769 bytes. Lengths outside this table cannot be stamped.
const K = {
  112: 0xaf28780c, 128: 0xf5ba4653, 224: 0x1afb582c, 256: 0xd72c4ac5,
  304: 0xe59149fb, 336: 0x956daf76, 368: 0x4bb7a997, 769: 0x19139afd,
  1290: 0x44c50407, 1669: 0x72da8717, 2304: 0xb0ee46f9, 2368: 0x113ddb18,
  4517: 0x5c3175e0, 4890: 0x21aaf2e9, 5423: 0x20b83357, 13289: 0xf0bcad06,
  13291: 0x73096521, 14916: 0x507eb40e, 15839: 0xabf08e70, 16313: 0x4653ff2f,
  16693: 0xa0ffd7e4, 16976: 0xf7e073ab, 28352: 0x71c0f123, 28397: 0xb52c8c07,
  31196: 0x3baae365, 32875: 0x5e6a02e3, 32884: 0x1a9a01b6, 33240: 0xb5e89ed0,
  34896: 0x1a97df56, 38455: 0xc9c3ba4c, 38467: 0x2b5a1aad
};

// Lengths whose constant came from Editor-produced files and was confirmed by a
// second sample or by a file that demonstrably opens. The rest were taken from a
// single sample and may be unsound — treat a stamp computed for them as a guess.
const TRUSTED = new Set([112, 128, 224, 256, 304, 769, 1290, 2304, 2368, 4890, 5423]);

const knownSizes = () => Object.keys(K).map(Number).sort((a, b) => a - b);
const isTrusted = size => TRUSTED.has(size);

const manifestSize = count => 96 + 16 * count;
const manifestCount = size => (size - 96) / 16;

// Returns the stamp the block should carry, or null if K is unknown for its length.
function stamp(block) {
  const k = K[block.length];
  if (k === undefined) return null;
  return (core(block) ^ k) >>> 0;
}

function check(block) {
  const want = stamp(block);
  if (want === null) return { known: false };
  const got = block.readUInt32LE(0);
  return { known: true, ok: got === want, got, want, trusted: isTrusted(block.length) };
}

// Write the stamp into the block, in place.
function seal(block) {
  const s = stamp(block);
  if (s === null) throw new Error(`no K constant for block length ${block.length}`);
  block.writeUInt32LE(s, 0);
  return s;
}

// ---------------------------------------------------------------------------
// The directory checksum is NOT this function.
//
// The four bytes right after the last directory entry are a checksum of the
// directory, and its algorithm is unsolved. The same scheme as above (CRC over
// [0, 4 + 28*count) with a per-length constant) looks correct on untouched files
// only because the constant was fitted per length on a single file; on any
// modified directory it produces garbage.
//
// Proven against the Editor's own container library (achmi.dll): flipping one
// flag byte in an entry and recomputing with that model is enough for
// CFSOpenSystem to refuse the file.
//
// The practical consequence: do not write the directory yourself. Let the
// Editor's library rebuild it — see hmipack/. This module deliberately ships no
// sealDirectory().
//
// Block stamps above are unaffected and independently confirmed: after the
// library rewrote a 769-byte page, it stamped it with exactly the value the
// formula predicts.
// ---------------------------------------------------------------------------

const DIRECTORY_MIRROR = 0x080000;
const directoryLength = count => 4 + 28 * count;

module.exports = {
  core, stamp, check, seal,
  K, TRUSTED, knownSizes, isTrusted,
  manifestSize, manifestCount,
  DIRECTORY_MIRROR, directoryLength
};
