import { createSupabaseServer } from "@/lib/supabase/server";
import { db, users, tenants } from "@/lib/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function getSession() {
  try {
    const supabase = createSupabaseServer();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("[getSession] Auth error:", authError.message);
      return null;
    }
    if (!user) return null;

    // Look up our user record linked to this Supabase auth user
    const rows = await db
      .select({
        userId: users.id,
        authId: users.authId,
        tenantId: tenants.id,
        tenantSlug: tenants.slug,
        tenantName: tenants.name,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
      })
      .from(users)
      .innerJoin(tenants, eq(users.tenantId, tenants.id))
      .where(eq(users.authId, user.id))
      .limit(1);

    if (rows.length === 0) {
      console.error("[getSession] No user record found for auth_id:", user.id);
      return null;
    }
    return rows[0];
  } catch (err) {
    console.error("[getSession] Unexpected error:", err);
    throw err;
  }
}

export type SessionData = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
