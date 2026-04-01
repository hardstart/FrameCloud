#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function main() {
  const folderPath = process.argv[2];

  if (!folderPath) {
    console.error("Usage: node generate-manifest.js <photo-folder>");
    process.exit(1);
  }

  const absPath = path.resolve(folderPath);
  if (!fs.existsSync(absPath)) {
    console.error(`Folder not found: ${absPath}`);
    process.exit(1);
  }

  // Find image files
  const files = fs
    .readdirSync(absPath)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort();

  if (files.length === 0) {
    console.error("No image files found in folder.");
    process.exit(1);
  }

  console.log(`Found ${files.length} images in ${absPath}\n`);

  const title = await ask("Album title: ");
  const slug = await ask("Album slug: ");
  const date = await ask("Date (YYYY-MM-DD): ");
  const description = await ask("Description: ");
  const photographer = await ask("Photographer: ");
  const password = await ask("Password (leave empty for no protection): ");

  let passwordHash = "";
  let isPasswordProtected = false;

  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
    isPasswordProtected = true;
  }

  const photos = files
    .filter((f) => f !== "cover.jpg" && f !== "cover.png" && f !== "cover.webp")
    .map((filename) => ({
      filename,
      caption: "",
      dateTaken: date,
    }));

  const manifest = {
    title,
    slug,
    date,
    description,
    photographer,
    passwordHash,
    isPasswordProtected,
    coverImage: "cover.jpg",
    photos,
    totalPhotos: photos.length,
  };

  const outputPath = path.join(absPath, "manifest.json");
  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`\nManifest written to ${outputPath}`);

  rl.close();
}

main().catch(console.error);
