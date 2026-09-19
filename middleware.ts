import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only protect /admin except /admin itself which handles its own logic
  // We will protect /admin/dashboard and /api/admin/settings
  const needsAuth = pathname.startsWith("/admin/dashboard") || pathname.startsWith("/api/admin/settings");

  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("admin_session")?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  try {
    const secret = new TextEncoder().encode(
      `${process.env.ADMIN_PIN}-${process.env.JVAULT_API_KEY ?? "fallback-secret"}`
    );
    const { payload } = await jwtVerify(token, secret);
    if (payload.role !== "admin") throw new Error("invalid role");
    return NextResponse.next();
  } catch {
    const res = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      : NextResponse.redirect(new URL("/admin", req.url));
    // Clear invalid cookie on redirect
    if (!pathname.startsWith("/api/")) {
      res.cookies.set("admin_session", "", { maxAge: 0, path: "/" });
    }
    return res;
  }
}

export const config = {
  matcher: ["/admin/dashboard/:path*", "/api/admin/settings/:path*"],
};
