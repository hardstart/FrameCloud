#!/usr/bin/env node

/**
 * Generates 5 test albums with gradient PNG images for local development.
 * Run: node scripts/generate-test-albums.js
 */

const fs   = require("fs");
const path = require("path");
const zlib = require("zlib");

const ALBUMS_DIR = path.join(__dirname, "..", "public", "samples", "albums");
const WIDTH  = 1200;
const HEIGHT = 800;

// ── PNG generation (same approach as generate-sample-album.js) ──────────────

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v)       { return Math.max(0, Math.min(255, Math.round(v))); }

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return crc ^ 0xffffffff;
}

function makeChunk(type, data) {
  const len    = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcData = Buffer.concat([typeBuf, data]);
  const crc     = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData) >>> 0, 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createGradientPNG(width, height, topColor, bottomColor) {
  const rawRows = [];
  for (let y = 0; y < height; y++) {
    const row = Buffer.alloc(1 + width * 3);
    row[0] = 0; // filter: None
    const t = y / (height - 1);
    for (let x = 0; x < width; x++) {
      const noise    = (Math.sin(x * 0.1 + y * 0.05) * 4 + Math.cos(x * 0.07 - y * 0.03) * 3) | 0;
      const dx       = (x / width  - 0.5) * 2;
      const dy       = (y / height - 0.5) * 2;
      const vignette = 1 - (dx * dx + dy * dy) * 0.18;
      const idx      = 1 + x * 3;
      row[idx + 0]   = clamp(lerp(topColor[0], bottomColor[0], t) * vignette + noise);
      row[idx + 1]   = clamp(lerp(topColor[1], bottomColor[1], t) * vignette + noise);
      row[idx + 2]   = clamp(lerp(topColor[2], bottomColor[2], t) * vignette + noise);
    }
    rawRows.push(row);
  }
  const rawData    = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(rawData, { level: 6 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),           // PNG sig
    makeChunk("IHDR", (() => {
      const h = Buffer.alloc(13);
      h.writeUInt32BE(width, 0); h.writeUInt32BE(height, 4);
      h[8] = 8; h[9] = 2;
      return h;
    })()),
    makeChunk("IDAT", compressed),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── Album definitions ────────────────────────────────────────────────────────

const ALBUMS = [
  {
    slug:   "tokyo-winter-2025",
    title:  "Tokyo \u2014 Winter 2025",
    date:   "2025-01-08",
    description: "Quiet streets and neon reflections during the coldest week of the year.",
    photographer: "Hardy Rajput",
    isPasswordProtected: false,
    coverPalette: { top: [28, 32, 72], bottom: [8, 10, 28] },
    photos: [
      { caption: "Shinjuku at 3am",              date: "2025-01-08", top: [32, 28, 80], bot: [10, 8, 32] },
      { caption: "Snow on Senso-ji",             date: "2025-01-08", top: [55, 60, 90], bot: [18, 20, 38] },
      { caption: "Ramen bar, steam rising",      date: "2025-01-09", top: [70, 50, 60], bot: [22, 15, 22] },
      { caption: "Harajuku underpass",           date: "2025-01-09", top: [22, 18, 65], bot: [8, 6, 26] },
      { caption: "Meiji Jingu, misty morning",   date: "2025-01-10", top: [40, 45, 75], bot: [14, 16, 30] },
      { caption: "Shibuya crossing, wide",       date: "2025-01-10", top: [58, 38, 72], bot: [20, 12, 28] },
      { caption: "Tokyo Tower in purple dusk",   date: "2025-01-11", top: [42, 20, 88], bot: [14, 6, 36] },
      { caption: "Tsukiji market dawn",          date: "2025-01-11", top: [62, 55, 80], bot: [20, 18, 32] },
    ],
  },
  {
    slug:   "paris-summer-2025",
    title:  "Paris \u2014 Summer 2025",
    date:   "2025-07-14",
    description: "Golden-hour wandering from Montmartre to the Seine during Bastille Day.",
    photographer: "Hardy Rajput",
    isPasswordProtected: false,
    coverPalette: { top: [210, 160, 60], bottom: [90, 50, 15] },
    photos: [
      { caption: "Eiffel from Trocadéro",        date: "2025-07-14", top: [220, 155, 55], bot: [95, 45, 12] },
      { caption: "Café terrace, St-Germain",     date: "2025-07-14", top: [200, 140, 80], bot: [80, 42, 20] },
      { caption: "Bouquinistes along the Seine", date: "2025-07-15", top: [215, 165, 50], bot: [88, 50, 10] },
      { caption: "Sacré-Cœur at sunset",         date: "2025-07-15", top: [230, 120, 70], bot: [100, 40, 18] },
      { caption: "Marché Bastille",              date: "2025-07-16", top: [205, 155, 90], bot: [82, 52, 22] },
      { caption: "Pont des Arts",               date: "2025-07-16", top: [195, 145, 60], bot: [75, 45, 15] },
      { caption: "Palais Royal garden",          date: "2025-07-17", top: [210, 170, 45], bot: [85, 55, 8] },
      { caption: "Louvre colonnade, golden",     date: "2025-07-17", top: [225, 160, 65], bot: [92, 48, 16] },
      { caption: "Bastille fireworks rehearsal", date: "2025-07-18", top: [240, 100, 50], bot: [110, 35, 12] },
      { caption: "Rue Mouffetard morning",       date: "2025-07-18", top: [200, 158, 78], bot: [80, 50, 20] },
    ],
  },
  {
    slug:   "new-york-fall-2025",
    title:  "New York \u2014 Fall 2025",
    date:   "2025-10-20",
    description: "October in the city — Central Park ablaze, steam rising from gratings, the whole nine.",
    photographer: "Hardy Rajput",
    isPasswordProtected: true,
    coverPalette: { top: [180, 80, 20], bottom: [60, 20, 5] },
    photos: [
      { caption: "Central Park, The Mall",            date: "2025-10-20", top: [185, 90, 18], bot: [62, 22, 5] },
      { caption: "Brooklyn Bridge at dawn",           date: "2025-10-20", top: [160, 70, 25], bot: [55, 18, 8] },
      { caption: "Yellow cabs, Midtown rain",         date: "2025-10-21", top: [200, 150, 30], bot: [70, 45, 8] },
      { caption: "Steam grating, 5th Ave",            date: "2025-10-21", top: [175, 85, 22], bot: [58, 25, 6] },
      { caption: "High Line, leaves turning",         date: "2025-10-22", top: [150, 95, 15], bot: [50, 28, 5] },
      { caption: "Grand Central, morning rush",       date: "2025-10-22", top: [190, 130, 28], bot: [65, 38, 8] },
      { caption: "Williamsburg rooftop",              date: "2025-10-23", top: [168, 75, 20], bot: [56, 20, 6] },
      { caption: "Times Square, long exposure",       date: "2025-10-23", top: [210, 120, 40], bot: [75, 35, 12] },
      { caption: "Prospect Park fog",                 date: "2025-10-24", top: [155, 80, 18], bot: [52, 22, 5] },
      { caption: "Chinatown market",                  date: "2025-10-24", top: [195, 100, 30], bot: [68, 30, 8] },
      { caption: "DUMBO, cobblestone rain",           date: "2025-10-25", top: [172, 88, 25], bot: [57, 24, 7] },
      { caption: "Harlem brownstones",                date: "2025-10-25", top: [162, 78, 20], bot: [54, 20, 5] },
      { caption: "Lower East Side neon",              date: "2025-10-26", top: [205, 95, 35], bot: [72, 28, 10] },
      { caption: "Staten Island Ferry, twilight",     date: "2025-10-26", top: [178, 82, 22], bot: [60, 22, 6] },
      { caption: "Hudson River sunrise",              date: "2025-10-27", top: [220, 140, 50], bot: [80, 42, 14] },
    ],
  },
  {
    slug:   "iceland-spring-2026",
    title:  "Iceland \u2014 Spring 2026",
    date:   "2026-04-02",
    description: "Chasing the aurora and thaw across the Snæfellsnes Peninsula.",
    photographer: "Hardy Rajput",
    isPasswordProtected: false,
    coverPalette: { top: [30, 155, 160], bottom: [5, 45, 55] },
    photos: [
      { caption: "Aurora over Kirkjufell",       date: "2026-04-02", top: [20, 160, 155], bot: [4, 48, 52] },
      { caption: "Seljalandsfoss, first light",  date: "2026-04-02", top: [55, 165, 175], bot: [10, 50, 58] },
      { caption: "Ice cave, Vatnajökull",        date: "2026-04-03", top: [80, 170, 200], bot: [15, 52, 68] },
      { caption: "Black sand beach, Vík",        date: "2026-04-03", top: [35, 40, 50], bot: [12, 14, 18] },
      { caption: "Geothermal steam valley",      date: "2026-04-04", top: [45, 150, 140], bot: [8, 42, 44] },
      { caption: "Lupines and snowpack",         date: "2026-04-04", top: [65, 175, 155], bot: [12, 54, 48] },
    ],
  },
  {
    slug:   "bali-january-2026",
    title:  "Bali \u2014 January 2026",
    date:   "2026-01-10",
    description: "Terraced rice fields, temple smoke, and monsoon light along the Campuhan Ridge.",
    photographer: "Hardy Rajput",
    isPasswordProtected: true,
    coverPalette: { top: [30, 110, 55], bottom: [8, 38, 15] },
    photos: [
      { caption: "Tegallalang rice terraces",      date: "2026-01-10", top: [28, 115, 52], bot: [7, 36, 14] },
      { caption: "Tanah Lot at sunset",            date: "2026-01-10", top: [200, 130, 40], bot: [72, 42, 10] },
      { caption: "Ubud market offerings",          date: "2026-01-11", top: [35, 100, 48], bot: [10, 32, 13] },
      { caption: "Campuhan Ridge walk, fog",       date: "2026-01-11", top: [60, 120, 70], bot: [15, 40, 20] },
      { caption: "Jatiluwih panorama",             date: "2026-01-12", top: [25, 105, 50], bot: [6, 33, 14] },
      { caption: "Temple ceremony smoke",          date: "2026-01-12", top: [180, 155, 90], bot: [65, 50, 25] },
      { caption: "Kuta shoreline at dusk",         date: "2026-01-13", top: [210, 145, 60], bot: [80, 48, 16] },
      { caption: "Monkey Forest, Ubud",            date: "2026-01-13", top: [40, 118, 55], bot: [11, 38, 15] },
      { caption: "Rice harvest, Sidemen",          date: "2026-01-14", top: [32, 108, 46], bot: [9, 35, 12] },
      { caption: "Lempuyang gate, misty",          date: "2026-01-14", top: [170, 180, 200], bot: [55, 58, 68] },
      { caption: "Jimbaran Bay, fishing boats",    date: "2026-01-15", top: [50, 130, 160], bot: [12, 42, 52] },
      { caption: "Nusa Penida cliffside",          date: "2026-01-15", top: [30, 115, 145], bot: [8, 36, 48] },
    ],
  },
];

// ── bcrypt hash for "test123" ────────────────────────────────────────────────
// Pre-computed so we don't need bcryptjs at generation time:
// bcrypt.hashSync("test123", 10) → consistent valid hash
const TEST123_HASH = "$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh3y";

// ── Generate ─────────────────────────────────────────────────────────────────

for (const album of ALBUMS) {
  const albumDir = path.join(ALBUMS_DIR, album.slug);
  fs.mkdirSync(albumDir, { recursive: true });

  console.log(`\n▶ ${album.title}`);

  // Cover image
  const coverBuf = createGradientPNG(WIDTH, HEIGHT, album.coverPalette.top, album.coverPalette.bottom);
  fs.writeFileSync(path.join(albumDir, "cover.jpg"), coverBuf);
  process.stdout.write("  cover.jpg ... done\n");

  // Photo images
  const photoEntries = album.photos.map((p, i) => {
    const num      = String(i + 1).padStart(3, "0");
    const filename = `${num}.jpg`;
    const buf      = createGradientPNG(WIDTH, HEIGHT, p.top, p.bot);
    fs.writeFileSync(path.join(albumDir, filename), buf);
    process.stdout.write(`  ${filename} ... done\n`);
    return { filename, caption: p.caption, dateTaken: p.date };
  });

  // Manifest
  const manifest = {
    title:               album.title,
    slug:                album.slug,
    date:                album.date,
    description:         album.description,
    photographer:        album.photographer,
    passwordHash:        album.isPasswordProtected ? TEST123_HASH : null,
    isPasswordProtected: album.isPasswordProtected,
    coverImage:          "cover.jpg",
    photos:              photoEntries,
    totalPhotos:         photoEntries.length,
  };

  fs.writeFileSync(path.join(albumDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`  manifest.json ... done  [${album.isPasswordProtected ? 'protected — password: test123' : 'public'}]`);
}

console.log("\n✓ All test albums generated.\n");
