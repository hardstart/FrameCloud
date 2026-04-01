import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_SECRET = process.env.COOKIE_SECRET || "default-dev-secret-change-me-32ch";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function sign(value: string): string {
  const hmac = crypto.createHmac("sha256", COOKIE_SECRET);
  hmac.update(value);
  return value + "." + hmac.digest("base64url");
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf(".");
  if (idx === -1) return null;
  const value = signed.slice(0, idx);
  if (sign(value) === signed) return value;
  return null;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function createSessionCookie(slug: string) {
  const expires = Date.now() + SESSION_DURATION;
  const payload = JSON.stringify({ slug, expires });
  const signed = sign(payload);

  cookies().set(`framecloud_session_${slug}`, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: SESSION_DURATION / 1000,
    path: "/",
  });
}

export function validateSession(slug: string): boolean {
  const cookie = cookies().get(`framecloud_session_${slug}`);
  if (!cookie) return false;

  const payload = unsign(cookie.value);
  if (!payload) return false;

  try {
    const data = JSON.parse(payload);
    if (data.slug !== slug) return false;
    if (Date.now() > data.expires) return false;
    return true;
  } catch {
    return false;
  }
}
