import { NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/jvault";
import { verifyToken, getTokenFromRequest } from "@/lib/auth";

function requireAdmin(req) {
  const token = getTokenFromRequest(req);
  const payload = token ? verifyToken(token) : null;
  return payload && payload.role === "admin" ? payload : null;
}

// Admin: lihat semua user + log lanjutan
export async function GET(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ message: "Akses admin diperlukan." }, { status: 403 });
  }
  try {
    const db = await readDB();
    const users = db.users.map(({ passwordHash, ...rest }) => rest);
    return NextResponse.json({
      users,
      continuations: db.continuations || [],
      bot_number: db.bot_number || "",
      total: users.length,
    });
  } catch (e) {
    return NextResponse.json({ message: "Gagal membaca data." }, { status: 500 });
  }
}

// Admin: hapus user (?id=xxx)
export async function DELETE(req) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ message: "Akses admin diperlukan." }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ message: "ID user diperlukan." }, { status: 400 });
    const db = await readDB();
    const before = db.users.length;
    db.users = db.users.filter((u) => u.id !== id);
    if (db.users.length === before) {
      return NextResponse.json({ message: "User tidak ditemukan." }, { status: 404 });
    }
    await writeDB(db);
    return NextResponse.json({ message: "User berhasil dihapus." });
  } catch (e) {
    return NextResponse.json({ message: "Gagal menghapus user." }, { status: 500 });
  }
}
