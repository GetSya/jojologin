import { NextResponse } from "next/server";
import { readDB, writeDB, normalizePhone, isValidPhone } from "@/lib/jvault";
import { verifyToken, getTokenFromRequest, signToken } from "@/lib/auth";

// Lengkapi / ubah nomor WhatsApp (dipakai user login Google yang belum punya nomor)
export async function PUT(req) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== "user") {
      return NextResponse.json({ message: "Login user diperlukan." }, { status: 403 });
    }
    const { whatsapp } = await req.json();
    const norm = normalizePhone(String(whatsapp || ""));
    if (!isValidPhone(norm)) {
      return NextResponse.json(
        { message: "Nomor WhatsApp tidak valid. Contoh: 081234567890." },
        { status: 400 }
      );
    }
    const db = await readDB();
    const user = db.users.find((u) => u.username === payload.username);
    if (!user) return NextResponse.json({ message: "User tidak ditemukan." }, { status: 404 });
    const used = db.users.find((u) => u.whatsapp === norm && u.username !== user.username);
    if (used) {
      return NextResponse.json({ message: "Nomor WhatsApp sudah dipakai akun lain." }, { status: 409 });
    }
    user.whatsapp = norm;
    await writeDB(db);

    const newToken = signToken({
      role: "user",
      username: user.username,
      whatsapp: user.whatsapp,
      email: user.email || "",
    });
    const res = NextResponse.json({
      message: "Nomor WhatsApp tersimpan.",
      token: newToken,
      user: { username: user.username, whatsapp: user.whatsapp, role: "user" },
    });
    res.cookies.set("jojo_token", newToken, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
    return res;
  } catch (e) {
    console.error("profile error:", e);
    return NextResponse.json({ message: "Gagal menyimpan nomor." }, { status: 500 });
  }
}
