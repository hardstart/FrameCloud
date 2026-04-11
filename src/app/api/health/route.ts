import { NextResponse } from "next/server";
import { db, tenants } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING";
  checks.SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING";
  checks.DATABASE_URL = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^@]+@/, ":***@") : "MISSING";

  // Test DB connection
  try {
    const rows = await db.select().from(tenants).limit(1);
    checks.db = `connected (${rows.length} tenants found)`;
  } catch (err: unknown) {
    checks.db = `FAILED: ${err instanceof Error ? err.message : String(err)}`;
  }

  return NextResponse.json(checks);
}
