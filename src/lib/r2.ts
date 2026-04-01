import { S3Client, GetObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { AlbumManifest } from "./types";
import fs from "fs";
import path from "path";

// ── Dev mode: local filesystem fallback when R2 isn't configured ──

const isLocalDev = !process.env.R2_ACCOUNT_ID;
const SAMPLES_DIR = path.join(process.cwd(), "public", "samples");

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
    },
  });
}

const BUCKET = process.env.R2_BUCKET_NAME || "framecloud-bucket";

export async function getAlbumManifest(slug: string): Promise<AlbumManifest | null> {
  // Local dev fallback
  if (isLocalDev) {
    try {
      const manifestPath = path.join(SAMPLES_DIR, "albums", slug, "manifest.json");
      const data = fs.readFileSync(manifestPath, "utf-8");
      return JSON.parse(data) as AlbumManifest;
    } catch {
      return null;
    }
  }

  try {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: `albums/${slug}/manifest.json`,
    });
    const response = await client.send(command);
    const body = await response.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body) as AlbumManifest;
  } catch {
    return null;
  }
}

export async function listAlbumSlugs(): Promise<string[]> {
  // Local dev fallback
  if (isLocalDev) {
    try {
      const albumsDir = path.join(SAMPLES_DIR, "albums");
      return fs.readdirSync(albumsDir).filter((entry) => {
        const entryPath = path.join(albumsDir, entry);
        return fs.statSync(entryPath).isDirectory();
      });
    } catch {
      return [];
    }
  }

  try {
    const client = getR2Client();
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: "albums/",
      Delimiter: "/",
    });
    const response = await client.send(command);
    const prefixes = response.CommonPrefixes || [];
    return prefixes
      .map((p) => p.Prefix?.replace("albums/", "").replace("/", "") || "")
      .filter(Boolean);
  } catch {
    return [];
  }
}

export async function getImageStream(slug: string, filename: string) {
  // Local dev fallback
  if (isLocalDev) {
    try {
      const filePath = path.join(SAMPLES_DIR, "albums", slug, filename);
      const buffer = fs.readFileSync(filePath);
      const ext = path.extname(filename).toLowerCase();
      const contentType =
        ext === ".png" ? "image/png" :
        ext === ".webp" ? "image/webp" :
        "image/jpeg";

      return {
        Body: {
          transformToByteArray: async () => new Uint8Array(buffer),
        },
        ContentType: contentType,
      };
    } catch {
      return null;
    }
  }

  try {
    const client = getR2Client();
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: `albums/${slug}/${filename}`,
    });
    const response = await client.send(command);
    return response;
  } catch {
    return null;
  }
}
