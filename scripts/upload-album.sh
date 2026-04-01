#!/bin/bash
set -e

FOLDER="$1"
SLUG="$2"
BUCKET="framecloud-bucket"

if [ -z "$FOLDER" ] || [ -z "$SLUG" ]; then
  echo "Usage: ./scripts/upload-album.sh <photo-folder> <album-slug>"
  exit 1
fi

if [ ! -f "$FOLDER/manifest.json" ]; then
  echo "Error: manifest.json not found in $FOLDER"
  echo "Run 'node scripts/generate-manifest.js $FOLDER' first."
  exit 1
fi

echo "Uploading album '$SLUG' from $FOLDER..."

# Upload manifest
echo "  → manifest.json"
npx wrangler r2 object put "$BUCKET/albums/$SLUG/manifest.json" --file="$FOLDER/manifest.json"

# Upload all images
for file in "$FOLDER"/*.{jpg,jpeg,png,webp}; do
  [ -f "$file" ] || continue
  filename=$(basename "$file")
  echo "  → $filename"
  npx wrangler r2 object put "$BUCKET/albums/$SLUG/$filename" --file="$file"
done

echo ""
echo "Done! Album '$SLUG' uploaded to R2."
