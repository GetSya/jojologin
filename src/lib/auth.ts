import { SignJWT, jwtVerify } from "jose";

const COOKIE_NAME = "admin_session";
const EXPIRY = "12h";

function getSecretKey(): Uint8Array {
  const pin = process.env.ADMIN_PIN;
  if (!pin) throw new Error("ADMIN_PIN not configured");
  // Use PIN as secret but derive longer key via TextEncoder
  // In production you should use a dedicated ADMIN_JWT_SECRET, but we derive from PIN per spec
  // Combine with JVAULT_API_KEY to add entropy if available
  const raw = `${pin}-${process.env.JVAULT_API_KEY ?? "fallback-secret"}`;
  return new TextEncoder().encode(raw);
}

export async function createAdminToken(): Promise<string> {
  const secret = getSecretKey();
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secret);
  return token;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export function getCookieName() {
  return COOKIE_NAME;
}

export function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 12, // 12h
  };
}
