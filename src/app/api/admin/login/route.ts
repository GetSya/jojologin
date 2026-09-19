import { NextRequest, NextResponse } from "next/server";
import { createAdminToken, getCookieName, getCookieOptions } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit({ key: `admin-login:${ip}`, limit: 5, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi nanti." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }
  const pin = (body as Record<string, unknown>)?.pin;
  if (typeof pin !== "string") {
    return NextResponse.json({ error: "PIN diperlukan." }, { status: 400 });
  }

  const expected = process.env.ADMIN_PIN;
  if (!expected) {
    console.error("ADMIN_PIN not set");
    return NextResponse.json({ error: "Konfigurasi server tidak lengkap." }, { status: 500 });
  }

  if (pin !== expected) {
    return NextResponse.json({ error: "PIN tidak valid." }, { status: 401 });
  }

  const token = await createAdminToken();
  const res = NextResponse.json({ success: true });
  res.cookies.set(getCookieName(), token, getCookieOptions());
  return res;
}
