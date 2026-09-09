const BASE_URL = process.env.JVAULT_BASE_URL || "https://jvault.aerialstudio.tech/";
const API_KEY = process.env.JVAULT_API_KEY;
const BIN_ID = process.env.JVAULT_BIN_ID;

function baseHeaders() {
  return {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  };
}

export async function readDB() {
  const res = await fetch(`${BASE_URL}api?bin_id=${BIN_ID}`, {
    headers: { "X-API-Key": API_KEY },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Gagal membaca database (JVault).");
  }
  const data = await res.json();
  // Normalisasi bentuk DB
  return {
    users: Array.isArray(data.users) ? data.users : [],
    bot_number: data.bot_number || "",
    continuations: Array.isArray(data.continuations) ? data.continuations : [],
    ...data,
  };
}

// PUT = ganti seluruh isi (endpoint paling stabil, return 200)
export async function writeDB(fullContent) {
  const res = await fetch(`${BASE_URL}api?bin_id=${BIN_ID}`, {
    method: "PUT",
    headers: baseHeaders(),
    body: JSON.stringify(fullContent),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error("Gagal menulis database (JVault). " + t);
  }
  const data = await res.json().catch(() => ({}));
  return data?.content ?? fullContent;
}

export function normalizePhone(input) {
  // Terima 08xx, 628xx, +628xx -> simpan 628xx
  let p = String(input || "").trim().replace(/[\s\-().]/g, "");
  if (p.startsWith("+")) p = p.slice(1);
  if (p.startsWith("0")) p = "62" + p.slice(1);
  return p;
}

export function isValidPhone(p) {
  return /^62\d{8,14}$/.test(p);
}
