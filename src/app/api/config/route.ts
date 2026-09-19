import { NextResponse } from "next/server";
import { getJVaultData } from "@/lib/jvault";
import { buildWaLink } from "@/lib/whatsapp";

export async function GET() {
  try {
    const data = await getJVaultData();
    let waLink: string | null = null;
    try {
      waLink = buildWaLink(data.config.botPhone, data.config.whatsappMessage);
    } catch {
      waLink = null;
    }
    return NextResponse.json({
      botPhone: data.config.botPhone,
      whatsappButtonText: data.config.whatsappButtonText,
      waLink,
    });
  } catch (e) {
    console.error("config GET error", e);
    return NextResponse.json({ error: "Gagal memuat konfigurasi." }, { status: 502 });
  }
}
