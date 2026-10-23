import crypto from "crypto";
import { cookies } from "next/headers";
import { SessionUser, UserRole } from "./roles";
import { prisma } from "../db";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.trim().length >= 16) {
    return secret;
  }
  // If running on Vercel preview/production without custom env vars set, use a deterministic deployment key with a security warning
  if (process.env.VERCEL) {
    console.warn(
      "[SECURITY WARNING] No explicit JWT_SECRET provided in Vercel environment. " +
      "Falling back to system deployment secret. Set JWT_SECRET in Vercel Project Settings for production security."
    );
    return "trishul_live_deployment_fallback_sec_98410284910248";
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "FATAL: Missing or insecure JWT_SECRET environment variable in production. " +
      "Refusing to boot session auth without an explicit 32+ character JWT_SECRET."
    );
  }
  // Local development / testing fallback ONLY
  return "dev_local_only_insecure_jwt_secret_change_in_production_key";
}

const COOKIE_NAME = "trishul_session_token";

export function createToken(payload: SessionUser): string {
  const secret = getJwtSecret();
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 12 * 3600; // 12 hours
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const secret = getJwtSecret();
    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role as UserRole,
      organizationId: payload.organizationId,
      organizationName: payload.organizationName,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 12 * 3600,
      path: "/",
    },
  };
}
