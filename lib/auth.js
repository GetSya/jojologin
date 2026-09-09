import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "jojobot-dev-secret";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "35151278";

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

export function getTokenFromRequest(req) {
  const auth = req.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  // fallback cookie
  const cookie = req.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)jojo_token=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function isAdminCredentials(username, password) {
  return username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
}
