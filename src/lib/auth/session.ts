import { db, sessions, users, tenants } from "@/lib/db";
import { eq, and, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "fc_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(userId: string, tenantId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const [session] = await db
    .insert(sessions)
    .values({ userId, tenantId, expiresAt })
    .returning({ id: sessions.id });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_DURATION_MS / 1000,
    path: "/",
  });

  return session.id;
}

export async function getSession() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const rows = await db
    .select({
      sessionId: sessions.id,
      userId: users.id,
      tenantId: tenants.id,
      tenantSlug: tenants.slug,
      tenantName: tenants.name,
      userName: users.name,
      userEmail: users.email,
      userRole: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .innerJoin(tenants, eq(sessions.tenantId, tenants.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (rows.length === 0) return null;
  return rows[0];
}

export type SessionData = NonNullable<Awaited<ReturnType<typeof getSession>>>;

export async function destroySession() {
  const cookieStore = cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }
  cookieStore.delete(SESSION_COOKIE);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}
