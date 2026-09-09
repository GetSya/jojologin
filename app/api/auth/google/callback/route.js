import { NextResponse } from "next/server";
import { readDB, writeDB } from "@/lib/jvault";
import { signToken } from "@/lib/auth";

function getRedirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const url = new URL(req.url);
  return `${url.origin}/api/auth/google/callback`;
}

function uniqueUsername(users, base) {
  let name = base || "user";
  if (!users.some((u) => u.username.toLowerCase() === name.toLowerCase())) return name;
  let i = 1;
  while (users.some((u) => u.username.toLowerCase() === `${name}${i}`.toLowerCase())) i++;
  return `${name}${i}`;
}

// Callback dari Google: tukar code -> token -> data user -> buat/cari akun -> redirect sukses
export async function GET(req) {
  const url = new URL(req.url);
  const origin = url.origin;
  const fail = (message) =>
    NextResponse.redirect(`${origin}/?error=${encodeURIComponent(message)}`);

  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const stateCookie = req.cookies.get("g_state")?.value;
    if (!code) return fail("Login Google dibatalkan.");
    if (!state || !stateCookie || state !== stateCookie) {
      return fail("Sesi Google tidak valid. Coba lagi.");
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return fail("Google login belum dikonfigurasi.");
    const redirectUri = getRedirectUri(req);

    // 1. Tukar code dengan access token (server-to-server)
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    if (!tokenRes.ok) return fail("Gagal verifikasi ke Google. Coba lagi.");
    const tokens = await tokenRes.json();

    // 2. Ambil profil user Google
    const meRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!meRes.ok) return fail("Gagal mengambil data Google.");
    const g = await meRes.json();
    if (!g.email) return fail("Email Google tidak tersedia.");
    if (g.email_verified === false) return fail("Email Google belum terverifikasi.");

    // 3. Cari atau buat user di JVault
    const db = await readDB();
    const email = String(g.email).toLowerCase();
    let user = db.users.find(
      (u) => u.googleId === g.sub || (u.email && u.email.toLowerCase() === email)
    );
    if (user) {
      if (!user.googleId) {
        user.googleId = g.sub;
        await writeDB(db);
      }
    } else {
      const base = email
        .split("@")[0]
        .replace(/[^a-zA-Z0-9_.]/g, "")
        .slice(0, 20) || "user";
      user = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        username: uniqueUsername(db.users, base),
        whatsapp: "",
        email,
        googleId: g.sub,
        passwordHash: null,
        created_at: new Date().toISOString(),
      };
      db.users.push(user);
      await writeDB(db);
    }

    // 4. Buat sesi JojoBot lalu kirim token lewat halaman sukses (disimpan ke localStorage)
    const token = signToken({
      role: "user",
      username: user.username,
      whatsapp: user.whatsapp || "",
      email: user.email || email,
    });
    const res = NextResponse.redirect(
      `${origin}/auth/success?token=${encodeURIComponent(token)}`
    );
    res.cookies.set("jojo_token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    res.cookies.set("g_state", "", { httpOnly: true, path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("google callback error:", e);
    return fail("Terjadi kesalahan saat login Google.");
  }
}
