import { z } from "zod";

export function normalizePhone(input: string): string {
  if (!input) return "";
  let s = String(input).trim();
  // Remove everything except digits and +
  s = s.replace(/[^\d+]/g, "");
  // Remove leading +
  if (s.startsWith("+")) s = s.slice(1);
  // If starts with 0, replace with 62
  if (s.startsWith("0")) s = "62" + s.slice(1);
  // If starts with 8 (without 62) e.g. 882..., prefix 62
  // But normalized earlier would already handle 0 case; 8... without country code should also become 62...
  // We keep simple: if starts with 8, prefix 62
  if (s.startsWith("8")) s = "62" + s;
  // Remove any remaining non-digits
  s = s.replace(/\D/g, "");
  return s;
}

export function isValidPhone(canonical: string): boolean {
  // canonical must be digits only, starts with 62, length 11-15, second part starts with 8
  if (!/^\d+$/.test(canonical)) return false;
  if (!canonical.startsWith("62")) return false;
  if (canonical.length < 11 || canonical.length > 15) return false;
  // Indonesian mobile starts with 628
  if (!/^62\d{8,13}$/.test(canonical)) return false;
  // Additional: ensure after 62 the next digit is 8 for mobile (allow flexibility)
  // if (!canonical.startsWith("628")) return false;
  return true;
}

export const phoneSchema = z
  .string()
  .min(1, "Nomor tidak boleh kosong")
  .transform((v) => normalizePhone(v))
  .refine((v) => isValidPhone(v), {
    message: "Format nomor WhatsApp tidak valid. Gunakan format 628xxxxxxxxxx",
  });

export function maskPhone(canonical: string): string {
  // 6288213292687 -> +62 882-1329-2687
  if (!canonical || canonical.length < 7) return canonical;
  // Keep first 6 and last 3 visible, middle masked
  const visibleStart = canonical.slice(0, 6); // 628821
  const visibleEnd = canonical.slice(-3); // 687? but example masks middle
  const maskedLength = Math.max(0, canonical.length - 9);
  const masked = "•".repeat(maskedLength);
  const full = visibleStart + masked + visibleEnd;
  return formatDisplayPhone(full);
}

export function formatDisplayPhone(canonicalOrMasked: string): string {
  // Try to format as +62 XXX-XXXX-XXXX
  const s = canonicalOrMasked;
  const isMasked = s.includes("•");
  if (isMasked) {
    // s like 628821••••687 -> format with spaces
    // We insert +62 prefix manually
    // 628821••••687 => +62 882-1••••-687  approx, simpler: +62 882••••687
    // Do pretty: +62 882••••687 -> but we want consistent
    // Let's do: +62 882••••687 is fine, but we can split more granularity
    // Use: +62 882-••••-687
    const without62 = s.startsWith("62") ? s.slice(2) : s;
    if (without62.length <= 3) return `+62 ${without62}`;
    // Insert dashes every 4 chars for readability, preserving •
    // Simple: first 3, then middle, then last 3
    const first = without62.slice(0, 3);
    const last = without62.slice(-3);
    const middle = without62.slice(3, -3);
    if (middle) return `+62 ${first}-${middle}-${last}`;
    return `+62 ${first}-${last}`;
  }
  // Normal canonical formatting: 6288213292687 => +62 882-1329-2687
  if (!s.startsWith("62")) return s;
  const rest = s.slice(2); // 88213292687
  if (rest.length <= 3) return `+62 ${rest}`;
  if (rest.length <= 7) return `+62 ${rest.slice(0, 3)}-${rest.slice(3)}`;
  // rest length 11 -> 3-4-4
  const p1 = rest.slice(0, 3);
  const p2 = rest.slice(3, 7);
  const p3 = rest.slice(7);
  return `+62 ${p1}-${p2}-${p3}`;
}

export function sanitizeText(input: string, maxLen = 500): string {
  return String(input).trim().slice(0, maxLen).replace(/[<>"'`]/g, "");
}

export function normalizeDomain(input: string): string {
  let s = String(input).trim().toLowerCase();
  // Remove protocol
  s = s.replace(/^https?:\/\//, "");
  // Remove path, query, hash
  s = s.split("/")[0].split("?")[0].split("#")[0];
  // Remove port if present but keep domain
  // Remove trailing dot
  s = s.replace(/\.$/, "");
  return s;
}

export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  if (domain.length < 3) return false;
  // Must not contain spaces or invalid chars
  if (/[^a-z0-9.-]/i.test(domain)) return false;
  // Must contain at least one dot
  if (!domain.includes(".")) return false;
  // Each label 1-63 chars, not start/end with hyphen
  const labels = domain.split(".");
  if (labels.some((l) => l.length === 0 || l.length > 63)) return false;
  if (labels.some((l) => l.startsWith("-") || l.endsWith("-"))) return false;
  // TLD at least 2 chars and only letters
  const tld = labels[labels.length - 1];
  if (!/^[a-z]{2,}$/i.test(tld)) return false;
  // No consecutive dots or hyphens already handled
  if (domain.includes("..")) return false;
  return true;
}
