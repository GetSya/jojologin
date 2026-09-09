import { NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/jvault";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// User klik "Lanjutkan di JojoBot" -> simpan nomor user + nomor bot tujuan ke database
export async function POST(req) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== "user") {
      return NextResponse.json({ message: "Login user diperlukan." }, { status: 403 });
    }
    const db = await readDB();
    const user = db.users.find((u) => u.username === payload.username);
    if (!user?.whatsapp && !payload.whatsapp) {
      return NextResponse.json({ message: "Isi nomor WhatsApp dulu sebelum lanjut ke JojoBot." }, { status: 400 });
    }
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      username: payload.username,
      whatsapp: user?.whatsapp || payload.whatsapp || "",
      bot_number: db.bot_number || "",
      continued_at: new Date().toISOString(),
    };
    db.continuations = Array.isArray(db.continuations) ? db.continuations : [];
    db.continuations.push(entry);
    await writeDB(db);

    const text = encodeURIComponent(`Halo JojoBot! Saya ${entry.username} (${entry.whatsapp}).`);
    const waLink = `https://wa.me/${entry.bot_number}?text=${text}`;
    return NextResponse.json({ message: "Berhasil dicatat.", entry, waLink });
  } catch (e) {
    console.error("continue error:", e);
    return NextResponse.json({ message: "Gagal mencatat." }, { status: 500 });
  }
}
