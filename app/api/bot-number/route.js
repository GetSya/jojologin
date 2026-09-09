import { NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/jvault";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

// Publik: baca nomor bot (dibutuhkan tombol JojoBot)
export async function GET() {
  try {
    const db = await readDB();
    return NextResponse.json({ bot_number: db.bot_number || "" });
  } catch (e) {
    return NextResponse.json({ message: "Gagal membaca nomor bot." }, { status: 500 });
  }
}

// Admin: ubah nomor bot
export async function PUT(req) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ message: "Akses admin diperlukan." }, { status: 403 });
    }
    const { bot_number } = await req.json();
    let p = String(bot_number || "").trim().replace(/[\s\-().]/g, "");
    if (p.startsWith("+")) p = p.slice(1);
    if (p.startsWith("0")) p = "62" + p.slice(1);
    if (!/^62\d{8,14}$/.test(p)) {
      return NextResponse.json({ message: "Nomor bot tidak valid. Contoh: 081234567890." }, { status: 400 });
    }
    const db = await readDB();
    db.bot_number = p;
    await writeDB(db);
    return NextResponse.json({ message: "Nomor bot berhasil diperbarui.", bot_number: p });
  } catch (e) {
    console.error("bot-number PUT error:", e);
    return NextResponse.json({ message: "Gagal memperbarui nomor bot." }, { status: 500 });
  }
}
