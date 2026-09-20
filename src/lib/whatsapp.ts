import { normalizePhone, isValidPhone } from "./validation";

export function buildWaLink(botPhone: string, message: string): string {
  const normalized = normalizePhone(botPhone);
  if (!isValidPhone(normalized)) {
    throw new Error("Nomor bot tidak valid");
  }
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${normalized}?text=${encoded}`;
}

export function validateWaLink(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" && u.hostname === "wa.me";
  } catch {
    return false;
  }
}

export const DEFAULT_CONFIG = {
  botPhone: "6281234567890",
  whatsappButtonText: "Lanjutkan ke WhatsApp",
  whatsappMessage: "Halo, saya sudah melakukan registrasi bot.",
  domain: "bot.arasyarafi.xyz",
  qrisTemplate:
    "00020101021126570011ID.DANA.WWW011893600915390930088102099093008810303UMI51440014ID.CO.QRIS.WWW0215ID10254040171760303UMI5204737253033605802ID5908Jojo Bot6010Kab. Bogor610516340630425A2",
  payhookToken: "",
};

export type BotConfig = typeof DEFAULT_CONFIG;
