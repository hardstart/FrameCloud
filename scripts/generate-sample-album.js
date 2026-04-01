#!/usr/bin/env node

/**
 * Generates a sample album with placeholder PNG images for local development.
 * Creates 12 photos + 1 cover with different color gradients.
 * No external dependencies required.
 */

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const OUTPUT_DIR = path.join(__dirname, "..", "public", "samples", "albums", "hong-kong-march-2026");
const WIDTH = 1200;
const HEIGHT = 800;

// Color palette — cinematic, moody tones
const PALETTES = [
  { top: [40, 60, 90], bottom: [20, 25, 40], label: "Victoria Harbour at dawn" },
  { top: [80, 50, 30], bottom: [30, 20, 15], label: "Street market, Mong Kok" },
  { top: [25, 70, 60], bottom: [10, 30, 28], label: "Tram through Central" },
  { top: [90, 60, 40], bottom: [35, 20, 10], label: "Temple Street at night" },
  { top: [50, 50, 70], bottom: [20, 18, 30], label: "Star Ferry crossing" },
  { top: [70, 80, 50], bottom: [25, 30, 18], label: "Bamboo scaffolding" },
  { top: [60, 40, 50], bottom: [25, 15, 22], label: "Neon signs, Tsim Sha Tsui" },
  { top: [45, 65, 80], bottom: [15, 22, 32], label: "Morning tai chi in the park" },
  { top: [85, 55, 35], bottom: [32, 18, 10], label: "Dim sum spread" },
  { top: [55, 75, 65], bottom: [20, 28, 24], label: "Peak Tram ascent" },
  { top: [75, 45, 55], bottom: [28, 14, 20], label: "Typhoon shelter boats" },
  { top: [65, 70, 45], bottom: [24, 26, 16], label: "Wan Chai market stalls" },
];

const COVER_PALETTE = { top: [50, 55, 75], bottom: [15, 18, 30] };

/**
 * Creates a minimal valid PNG file with a vertical gradient.
 * Writes raw IDAT chunks — no canvas or image libraries needed.
 */
function createGradientPNG(width, height, topColor, bottomColor) {
  // Build raw pixel data (filter byte + RGB per pixel, per row)
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0; // filter: None

    const t = y / (height - 1);
    // Add subtle noise for texture
    for (let x = 0; x < width; x++) {
      const noise = (Math.sin(x * 0.1 + y * 0.05) * 3 + Math.cos(x * 0.07 - y * 0.03) * 2) | 0;
      // Slight vignette
      const dx = (x / width - 0.5) * 2;
      const dy = (y / height - 0.5) * 2;
      const vignette = 1 - (dx * dx + dy * dy) * 0.15;

      const idx = 1 + x * 3;
      row[idx + 0] = clamp(lerp(topColor[0], bottomColor[0], t) * vignette + noise);
      row[idx + 1] = clamp(lerp(topColor[1], bottomColor[1], t) * vignette + noise);
      row[idx + 2] = clamp(lerp(topColor[2], bottomColor[2], t) * vignette + noise);
    }
    rawRows.push(row);
  }

  const rawData = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(rawData, { level: 6 });

  // Assemble PNG
  const chunks = [];

  // Signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(makeChunk("IHDR", ihdr));

  // IDAT
  chunks.push(makeChunk("IDAT", compressed));

  // IEND
  chunks.push(makeChunk("IEND", Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuf, data]);

  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData) >>> 0, 0);

  return Buffer.concat([len, typeBuf, data, crc]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return crc ^ 0xffffffff;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v) { return Math.max(0, Math.min(255, Math.round(v))); }

// --- Generate ---

console.log("Generating sample album: hong-kong-march-2026");
console.log(`Output: ${OUTPUT_DIR}\n`);

// Cover
process.stdout.write("  cover.jpg (PNG) ... ");
const coverBuf = createGradientPNG(WIDTH, HEIGHT, COVER_PALETTE.top, COVER_PALETTE.bottom);
fs.writeFileSync(path.join(OUTPUT_DIR, "cover.jpg"), coverBuf);
console.log("done");

// Photos
PALETTES.forEach((palette, i) => {
  const num = String(i + 1).padStart(3, "0");
  const filename = `${num}.jpg`;
  process.stdout.write(`  ${filename} ... `);
  const buf = createGradientPNG(WIDTH, HEIGHT, palette.top, palette.bottom);
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), buf);
  console.log("done");
});

// Manifest
const manifest = {
  title: "Hong Kong \u2014 March 2026",
  slug: "hong-kong-march-2026",
  date: "2026-03-15",
  description: "A week in Hong Kong with family.",
  photographer: "Hardy Rajput",
  // password: "framecloud" → bcrypt hash
  passwordHash: "$2b$10$8K1p/Yw5Z5Y5Z5Y5Z5Y5ZeXjK5Y5Z5Y5Z5Y5Z5Y5Z5Y5Z5Y5Z5Y",
  isPasswordProtected: true,
  coverImage: "cover.jpg",
  photos: PALETTES.map((p, i) => ({
    filename: `${String(i + 1).padStart(3, "0")}.jpg`,
    caption: p.label,
    dateTaken: `2026-03-${String(15 + Math.floor(i / 3)).padStart(2, "0")}`,
  })),
  totalPhotos: PALETTES.length,
};

fs.writeFileSync(
  path.join(OUTPUT_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log("\n  manifest.json ... done");

// Generate a proper bcrypt hash for "framecloud"
const bcrypt = require("bcryptjs");
const hash = bcrypt.hashSync("framecloud", 10);
manifest.passwordHash = hash;
fs.writeFileSync(
  path.join(OUTPUT_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2)
);
console.log(`  Updated passwordHash (password: "framecloud")`);

console.log(`\nSample album ready! ${PALETTES.length} photos + cover generated.`);
console.log(`Password: framecloud`);
