import { NextResponse } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req) {
  const token = getTokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    return NextResponse.json({ message: "Belum login." }, { status: 401 });
  }
  if (payload.role === "admin") {
    return NextResponse.json({ user: { username: "admin", role: "admin" } });
  }
  return NextResponse.json({
    user: { username: payload.username, whatsapp: payload.whatsapp || "", email: payload.email || "", role: "user" },
  });
}

export async function POST() {
  const res = NextResponse.json({ message: "Logout berhasil." });
  res.cookies.set("jojo_token", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
