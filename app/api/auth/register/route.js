import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { readDB, writeDB, normalizePhone, isValidPhone } from "@/lib/jvault";

export async function POST(req) {
  try {
    const { username, whatsapp, password } = await req.json();

    const u = String(username || "").trim();
    const wRaw = String(whatsapp || "").trim();
    const p = String(password || "");

    if (!u || !wRaw || !p) {
      return NextResponse.json({ message: "Username, nomor WhatsApp, dan password wajib diisi." }, { status: 400 });
    }
    if (u.length < 3) {
      return NextResponse.json({ message: "Username minimal 3 karakter." }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(u)) {
      return NextResponse.json({ message: "Username hanya boleh huruf, angka, titik, dan underscore." }, { status: 400 });
    }
    if (p.length < 4) {
      return NextResponse.json({ message: "Password minimal 4 karakter." }, { status: 400 });
    }
    const whatsappNorm = normalizePhone(wRaw);
    if (!isValidPhone(whatsappNorm)) {
      return NextResponse.json({ message: "Nomor WhatsApp tidak valid. Contoh: 081234567890." }, { status: 400 });
    }
    if (u.toLowerCase() === "admin") {
      return NextResponse.json({ message: "Username 'admin' tidak boleh dipakai." }, { status: 400 });
    }

    const db = await readDB();

    const exists = db.users.find(
      (x) => x.username.toLowerCase() === u.toLowerCase()
    );
    if (exists) {
      return NextResponse.json({ message: "Username sudah terdaftar. Silakan login." }, { status: 409 });
    }
    const phoneUsed = db.users.find((x) => x.whatsapp === whatsappNorm);
    if (phoneUsed) {
      return NextResponse.json({ message: "Nomor WhatsApp sudah terdaftar." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(p, 10);
    const newUser = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      username: u,
      whatsapp: whatsappNorm,
      passwordHash,
      created_at: new Date().toISOString(),
    };

    db.users.push(newUser);
    await writeDB(db);

    return NextResponse.json({
      message: "Registrasi berhasil. Silakan login.",
      user: { id: newUser.id, username: newUser.username, whatsapp: newUser.whatsapp },
    });
  } catch (e) {
    console.error("register error:", e);
    return NextResponse.json({ message: "Terjadi kesalahan server. Coba lagi." }, { status: 500 });
  }
}
