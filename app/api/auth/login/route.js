import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDB } from "@/lib/jvault";
import { signToken, isAdminCredentials } from "@/lib/auth";

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    const u = String(username || "").trim();
    const p = String(password || "");

    if (!u || !p) {
      return NextResponse.json({ message: "Username dan password wajib diisi." }, { status: 400 });
    }

    // Admin login (hardcoded via env)
    if (isAdminCredentials(u, p)) {
      const token = signToken({ role: "admin", username: "admin" });
      const res = NextResponse.json({
        message: "Login admin berhasil.",
        token,
        user: { username: "admin", role: "admin" },
      });
      res.cookies.set("jojo_token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
      return res;
    }

    const db = await readDB();
    const user = db.users.find((x) => x.username.toLowerCase() === u.toLowerCase());
    if (!user) {
      return NextResponse.json({ message: "Username tidak ditemukan. Silakan register." }, { status: 401 });
    }
    const ok = await bcrypt.compare(p, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ message: "Password salah." }, { status: 401 });
    }

    const token = signToken({ role: "user", username: user.username, whatsapp: user.whatsapp });
    const res = NextResponse.json({
      message: "Login berhasil.",
      token,
      user: { id: user.id, username: user.username, whatsapp: user.whatsapp, role: "user" },
    });
    res.cookies.set("jojo_token", token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (e) {
    console.error("login error:", e);
    return NextResponse.json({ message: "Terjadi kesalahan server." }, { status: 500 });
  }
}
