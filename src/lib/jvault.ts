import { DEFAULT_CONFIG, BotConfig } from "./whatsapp";

export type JVaultUser = {
  phone: string;
  registeredAt: string;
};

export type JVaultData = {
  users: JVaultUser[];
  config: BotConfig;
};

function getEnv() {
  const url = process.env.JVAULT_API_URL;
  const key = process.env.JVAULT_API_KEY;
  if (!url) throw new Error("JVAULT_API_URL not configured");
  if (!key) throw new Error("JVAULT_API_KEY not configured");
  return { url, key };
}

function headers(key: string) {
  return {
    "Content-Type": "application/json",
    "x-api-key": key,
    Authorization: `Bearer ${key}`,
    "x-jvault-key": key,
  };
}

// Normalize any shape into JVaultData
function normalizeData(raw: unknown): JVaultData {
  const fallback: JVaultData = {
    users: [],
    config: { ...DEFAULT_CONFIG },
  };

  if (!raw || typeof raw !== "object") return fallback;

  const obj = raw as Record<string, unknown>;

  // Common wrappers: { data: {...} }, { record: {...} }, { result: {...} }, { bin: {...} }
  let candidate: Record<string, unknown> = obj;
  for (const k of ["data", "record", "result", "bin", "value", "content"]) {
    if (k in obj && obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      candidate = obj[k] as Record<string, unknown>;
      // If candidate itself has data nested, unwrap once more
      if (
        "data" in candidate &&
        candidate["data"] &&
        typeof candidate["data"] === "object" &&
        !Array.isArray(candidate["data"])
      ) {
        // avoid infinite loop; check if deeper has users
        const inner = candidate["data"] as Record<string, unknown>;
        if ("users" in inner || "config" in inner) candidate = inner;
      }
      break;
    }
  }

  // If raw itself is array
  if (Array.isArray(raw)) {
    return {
      users: raw as JVaultUser[],
      config: { ...DEFAULT_CONFIG },
    };
  }
  if (Array.isArray(candidate)) {
    return {
      users: candidate as unknown as JVaultUser[],
      config: { ...DEFAULT_CONFIG },
    };
  }

  // Extract users
  let users: JVaultUser[] = [];
  if (Array.isArray(candidate.users)) users = candidate.users as JVaultUser[];
  else if (Array.isArray((candidate as Record<string, unknown>).data)) {
    // sometimes users stored directly as array under different key
  }

  // Extract config
  let config: BotConfig = { ...DEFAULT_CONFIG };
  if (candidate.config && typeof candidate.config === "object") {
    const c = candidate.config as Partial<BotConfig>;
    config = {
      botPhone: typeof c.botPhone === "string" ? c.botPhone : DEFAULT_CONFIG.botPhone,
      whatsappButtonText:
        typeof c.whatsappButtonText === "string" ? c.whatsappButtonText : DEFAULT_CONFIG.whatsappButtonText,
      whatsappMessage:
        typeof c.whatsappMessage === "string" ? c.whatsappMessage : DEFAULT_CONFIG.whatsappMessage,
      domain: typeof c.domain === "string" && c.domain ? c.domain : DEFAULT_CONFIG.domain,
      qrisTemplate: typeof c.qrisTemplate === "string" && c.qrisTemplate ? c.qrisTemplate : DEFAULT_CONFIG.qrisTemplate,
      payhookToken: typeof c.payhookToken === "string" ? c.payhookToken : DEFAULT_CONFIG.payhookToken,
    };
  }

  // Also support flat structure where config fields are top-level
  if (!candidate.config) {
    if (typeof candidate.botPhone === "string") config.botPhone = candidate.botPhone as string;
    if (typeof candidate.whatsappButtonText === "string") config.whatsappButtonText = candidate.whatsappButtonText as string;
    if (typeof candidate.whatsappMessage === "string") config.whatsappMessage = candidate.whatsappMessage as string;
    if (typeof candidate.domain === "string") config.domain = candidate.domain as string;
    if (typeof candidate.qrisTemplate === "string") config.qrisTemplate = candidate.qrisTemplate as string;
    if (typeof candidate.payhookToken === "string") config.payhookToken = candidate.payhookToken as string;
  }

  // Filter users to valid shape
  users = users.filter(
    (u) =>
      u &&
      typeof u.phone === "string" &&
      typeof u.registeredAt === "string" &&
      u.phone.length >= 10
  );

  return { users, config };
}

export async function getJVaultData(): Promise<JVaultData> {
  const { url, key } = getEnv();
  const res = await fetch(url, {
    method: "GET",
    headers: headers(key),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`JVault GET failed: ${res.status} ${text.slice(0, 200)}`);
  }

  const json = await res.json().catch(() => null);
  if (!json) {
    return { users: [], config: { ...DEFAULT_CONFIG } };
  }
  return normalizeData(json);
}

export async function saveJVaultData(data: JVaultData): Promise<void> {
  const { url, key } = getEnv();

  // JVault typical API: PUT to same URL with bin_id to update
  const payload = JSON.stringify(data);

  // Try PUT first
  let res = await fetch(url, {
    method: "PUT",
    headers: headers(key),
    body: payload,
    cache: "no-store",
  });

  if (res.ok) return;

  // Try POST
  res = await fetch(url, {
    method: "POST",
    headers: headers(key),
    body: payload,
    cache: "no-store",
  });
  if (res.ok) return;

  // Try PATCH
  res = await fetch(url, {
    method: "PATCH",
    headers: headers(key),
    body: payload,
    cache: "no-store",
  });
  if (res.ok) return;

  const text = await res.text().catch(() => "");
  throw new Error(`JVault save failed: ${res.status} ${text.slice(0, 300)}`);
}

export async function getConfig(): Promise<BotConfig> {
  const data = await getJVaultData();
  return data.config;
}

export async function updateConfig(partial: Partial<BotConfig>): Promise<BotConfig> {
  const data = await getJVaultData();
  const newConfig: BotConfig = {
    botPhone: partial.botPhone ?? data.config.botPhone,
    whatsappButtonText: partial.whatsappButtonText ?? data.config.whatsappButtonText,
    whatsappMessage: partial.whatsappMessage ?? data.config.whatsappMessage,
    domain: partial.domain ?? data.config.domain,
    qrisTemplate: partial.qrisTemplate ?? data.config.qrisTemplate,
    payhookToken: partial.payhookToken ?? data.config.payhookToken,
  };
  const newData: JVaultData = { users: data.users, config: newConfig };
  await saveJVaultData(newData);
  return newConfig;
}

export async function registerPhone(phone: string): Promise<{ status: "registered" | "already_registered"; totalUsers: number }> {
  const data = await getJVaultData();
  const exists = data.users.some((u) => u.phone === phone);
  if (exists) {
    return { status: "already_registered", totalUsers: data.users.length };
  }
  const newUser: JVaultUser = { phone, registeredAt: new Date().toISOString() };
  const newData: JVaultData = { users: [...data.users, newUser], config: data.config };
  await saveJVaultData(newData);
  return { status: "registered", totalUsers: newData.users.length };
}
