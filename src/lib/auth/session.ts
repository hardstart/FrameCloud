import { createSupabaseServer } from "@/lib/supabase/server";
import { db, users, tenants } from "@/lib/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function getSession() {
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

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

  if (rows.length === 0) return null;
  return rows[0];
}

export type SessionData = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
