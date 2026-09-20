import { NextResponse, NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Check if JSON mode requested on homepage or /pay with payment query params
  const bayar = searchParams.get("bayar") || searchParams.get("nominal");
  const orderId = searchParams.get("order_id") || searchParams.get("orderId");
  const format = searchParams.get("format") || searchParams.get("output") || searchParams.get("type");
  const jsonParam = searchParams.get("json");

  const wantsJson =
    format === "json" ||
    jsonParam === "true" ||
    jsonParam === "1" ||
    req.headers.get("accept")?.includes("application/json");

  if ((pathname === "/" || pathname === "/pay") && bayar && orderId && wantsJson) {
    const rewriteUrl = new URL("/api/payment/create", req.url);
    rewriteUrl.searchParams.set("bayar", bayar);
    rewriteUrl.searchParams.set("order_id", orderId);
    return NextResponse.rewrite(rewriteUrl);
  }

  // Only protect /admin except /admin itself which handles its own logic
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
    if (!pathname.startsWith("/api/")) {
      res.cookies.set("admin_session", "", { maxAge: 0, path: "/" });
    }
    return res;
  }
}

export const config = {
  matcher: [
    "/",
    "/pay",
    "/admin/dashboard/:path*",
    "/api/admin/settings/:path*",
  ],
};
