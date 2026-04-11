import { NextResponse } from "next/server";
import postgres from "postgres";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING";
  checks.SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING";
  checks.DATABASE_URL = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^@]+@/, ":***@") : "MISSING";
  checks.R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID ? "set" : "MISSING";
  checks.R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID ? "set" : "MISSING";
  checks.R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY ? "set" : "MISSING";
  checks.R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "MISSING";

  // Test DB
  try {
    const sql = postgres(process.env.DATABASE_URL!, { prepare: false, connect_timeout: 10 });
    const result = await sql`SELECT 1 as ok`;
    checks.db = `OK: ${JSON.stringify(result)}`;
    await sql.end();
  } catch (err: unknown) {
    checks.db = `FAILED: ${(err as Error).message}`;
  }

  // Test R2
  try {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
      },
    });
    const testKey = `_health-check-${Date.now()}`;
    await client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
      Body: Buffer.from("ok"),
      ContentType: "text/plain",
    }));
    await client.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: testKey,
    }));
    checks.r2 = "OK: write+delete succeeded";
  } catch (err: unknown) {
    const e = err as Error & { Code?: string; $metadata?: { httpStatusCode?: number } };
    checks.r2 = `FAILED: ${e.message}`;
    if (e.Code) checks.r2_code = e.Code;
    if (e.$metadata?.httpStatusCode) checks.r2_status = String(e.$metadata.httpStatusCode);
  }

  return NextResponse.json(checks);
}
