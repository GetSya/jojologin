import { NextRequest, NextResponse } from "next/server";
import { normalizePhone, isValidPhone } from "@/lib/validation";
import { getJVaultData, saveJVaultData } from "@/lib/jvault";
import { buildWaLink } from "@/lib/whatsapp";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = rateLimit({ key: `register:${ip}`, limit: 10, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi dalam beberapa saat." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
    }

    const phoneRaw = (body as Record<string, unknown>)?.phone;
    if (typeof phoneRaw !== "string") {
      return NextResponse.json({ error: "Nomor tidak valid." }, { status: 400 });
    }

    if (phoneRaw.length > 30) {
      return NextResponse.json({ error: "Nomor terlalu panjang." }, { status: 400 });
    }

    const canonical = normalizePhone(phoneRaw);

    if (!isValidPhone(canonical)) {
      return NextResponse.json(
        { error: "Format nomor WhatsApp tidak valid. Gunakan 628xxxxxxxxxx." },
        { status: 400 }
      );
    }

    // Fetch JVault
    let data;
    try {
      data = await getJVaultData();
    } catch (e) {
      console.error("JVault get error", e);
      return NextResponse.json(
        { error: "Terjadi masalah saat menghubungkan ke server. Silakan coba lagi." },
        { status: 502 }
      );
    }

    const exists = data.users.some((u) => u.phone === canonical);

    let status: "registered" | "already_registered" = "already_registered";

    if (!exists) {
      const newData = {
        users: [...data.users, { phone: canonical, registeredAt: new Date().toISOString() }],
        config: data.config,
      };
      try {
        await saveJVaultData(newData);
        status = "registered";
      } catch (e) {
        console.error("JVault save error", e);
        return NextResponse.json(
          { error: "Terjadi masalah saat menyimpan data. Silakan coba lagi." },
          { status: 502 }
        );
      }
    }

    // Build WA link based on latest config
    let waLink: string | null = null;
    const buttonText = data.config.whatsappButtonText;
    try {
      waLink = buildWaLink(data.config.botPhone, data.config.whatsappMessage);
    } catch {
      waLink = null;
    }

    return NextResponse.json({
      status,
      phone: canonical,
      waLink,
      buttonText,
      config: {
        botPhone: data.config.botPhone,
        whatsappButtonText: data.config.whatsappButtonText,
        // do not expose full message as sensitive? but needed for waLink; we already gave waLink
      },
    });
  } catch (err) {
    console.error("register error", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
