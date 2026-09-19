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
};

export type BotConfig = typeof DEFAULT_CONFIG;
