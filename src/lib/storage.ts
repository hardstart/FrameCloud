import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

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

export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  const client = getR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteR2Object(key: string): Promise<void> {
  try {
    const client = getR2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
  } catch {
    // Ignore deletion errors (object may not exist)
  }
}

export async function getR2Object(key: string) {
  const client = getR2Client();
  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return response;
  } catch {
    return null;
  }
}

export function getTenantR2Prefix(tenantId: string): string {
  return `tenants/${tenantId}`;
}

export function getPhotoR2Key(tenantId: string, albumId: string, filename: string): string {
  return `${getTenantR2Prefix(tenantId)}/albums/${albumId}/${filename}`;
}
