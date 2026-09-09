import { NextResponse } from "next/server";
import crypto from "crypto";

function getRedirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const url = new URL(req.url);
  return `${url.origin}/api/auth/google/callback`;
}

// Mulai login Google: redirect ke halaman consent Google
export async function GET(req) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { message: "Google login belum dikonfigurasi (GOOGLE_CLIENT_ID kosong)." },
      { status: 500 }
    );
  }
  const redirectUri = getRedirectUri(req);
  const state = crypto.randomBytes(16).toString("hex");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });
  const res = NextResponse.redirect(
    "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString()
  );
  res.cookies.set("g_state", state, {
    httpOnly: true,
    path: "/",
    maxAge: 600,
    sameSite: "lax",
  });
  return res;
}
