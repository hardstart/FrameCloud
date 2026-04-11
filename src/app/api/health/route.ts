import { NextResponse } from "next/server";
import postgres from "postgres";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = {};

  checks.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ? "set" : "MISSING";
  checks.SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "set" : "MISSING";
  checks.DATABASE_URL = process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^@]+@/, ":***@") : "MISSING";

  // Test raw postgres connection
  try {
    const sql = postgres(process.env.DATABASE_URL!, { prepare: false, connect_timeout: 10 });
    const result = await sql`SELECT 1 as ok`;
    checks.db_raw = `connected: ${JSON.stringify(result)}`;
    await sql.end();
  } catch (err: unknown) {
    const e = err as Error & { code?: string; cause?: Error };
    checks.db_raw = `FAILED: ${e.message}`;
    if (e.code) checks.db_error_code = e.code;
    if (e.cause) checks.db_cause = e.cause.message;
    checks.db_stack = (e.stack || "").split("\n").slice(0, 3).join(" | ");
  }

  return NextResponse.json(checks);
}
