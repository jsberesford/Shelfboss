#!/usr/bin/env node
// Generates public/icons/icon-192.png and icon-512.png
// Uses only Node.js built-ins (zlib + fs) — no canvas, no external deps.
// Design: #1e293b slate background, white "P" lettermark (PremiumSupply).

const zlib = require("zlib");
const fs = require("fs");
const path = require("path");

function writePng(width, height, pixels, outPath) {
  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, "ascii");
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.concat([typeBytes, data]);
    let crc = 0xffffffff;
    for (const byte of crcBuf) {
      crc ^= byte;
      for (let i = 0; i < 8; i++) crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
    crc ^= 0xffffffff;
    const crcOut = Buffer.alloc(4);
    crcOut.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([len, typeBytes, data, crcOut]);
  }

  // IHDR: width, height, 8-bit, RGBA (color type 6)
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Scanlines: filter byte (0) + RGBA per pixel
  const raw = Buffer.alloc((1 + width * 4) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    raw[rowOffset] = 0; // filter = None
    for (let x = 0; x < width; x++) {
      const pxIdx = (y * width + x) * 4;
      const rawIdx = rowOffset + 1 + x * 4;
      raw[rawIdx]     = pixels[pxIdx];
      raw[rawIdx + 1] = pixels[pxIdx + 1];
      raw[rawIdx + 2] = pixels[pxIdx + 2];
      raw[rawIdx + 3] = pixels[pxIdx + 3];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idat = chunk("IDAT", compressed);
  const iend = chunk("IEND", Buffer.alloc(0));

  fs.writeFileSync(outPath, Buffer.concat([PNG_SIG, chunk("IHDR", ihdr), idat, iend]));
}

function generateIcon(size, outPath) {
  const pixels = new Uint8Array(size * size * 4);

  // Background: #1e293b = rgb(30, 41, 59)
  const bg = [30, 41, 59, 255];
  const white = [255, 255, 255, 255];

  for (let i = 0; i < size * size * 4; i += 4) {
    pixels[i]     = bg[0];
    pixels[i + 1] = bg[1];
    pixels[i + 2] = bg[2];
    pixels[i + 3] = bg[3];
  }

  function setPixel(x, y, color) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 4;
    pixels[i]     = color[0];
    pixels[i + 1] = color[1];
    pixels[i + 2] = color[2];
    pixels[i + 3] = color[3];
  }

  function fillRect(x1, y1, x2, y2, color) {
    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        setPixel(x, y, color);
      }
    }
  }

  // Scale all coordinates from 192-base design
  const sc = (v) => Math.round((v / 192) * size);

  // "P" lettermark — stroke width ~28px at 192px base
  // Stem: full height
  fillRect(sc(46), sc(38), sc(74), sc(154), white);
  // Top horizontal bar
  fillRect(sc(74), sc(38), sc(136), sc(66), white);
  // Right side of bowl (vertical)
  fillRect(sc(108), sc(66), sc(136), sc(124), white);
  // Middle horizontal bar
  fillRect(sc(74), sc(96), sc(136), sc(124), white);

  writePng(size, size, pixels, outPath);
  console.log(`Written: ${outPath} (${size}×${size})`);
}

const outDir = path.join(__dirname, "..", "public", "icons");
fs.mkdirSync(outDir, { recursive: true });
generateIcon(192, path.join(outDir, "icon-192.png"));
generateIcon(512, path.join(outDir, "icon-512.png"));
