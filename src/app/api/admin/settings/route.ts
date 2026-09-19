import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getCookieName } from "@/lib/auth";
import { getJVaultData, saveJVaultData } from "@/lib/jvault";
import { normalizePhone, isValidPhone, sanitizeText } from "@/lib/validation";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(getCookieName())?.value;
  if (!token) return false;
  return await verifyAdminToken(token);
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await getJVaultData();
    return NextResponse.json({ config: data.config });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal memuat pengaturan." }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid." }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const rawPhone = typeof b.botPhone === "string" ? b.botPhone : "";
  const rawButtonText = typeof b.whatsappButtonText === "string" ? b.whatsappButtonText : "";
  const rawMessage = typeof b.whatsappMessage === "string" ? b.whatsappMessage : "";

  if (!rawPhone || !rawButtonText || !rawMessage) {
    return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
  }

  if (rawPhone.length > 30 || rawButtonText.length > 100 || rawMessage.length > 500) {
    return NextResponse.json({ error: "Input terlalu panjang." }, { status: 400 });
  }

  const normalizedPhone = normalizePhone(rawPhone);
  if (!isValidPhone(normalizedPhone)) {
    return NextResponse.json({ error: "Nomor bot tidak valid. Gunakan 628xxxxxxxxxx." }, { status: 400 });
  }

  const sanitizedButton = sanitizeText(rawButtonText, 100);
  const sanitizedMessage = sanitizeText(rawMessage, 500);

  if (!sanitizedButton || !sanitizedMessage) {
    return NextResponse.json({ error: "Input tidak valid." }, { status: 400 });
  }

  try {
    const data = await getJVaultData();
    const newData = {
      users: data.users,
      config: {
        botPhone: normalizedPhone,
        whatsappButtonText: sanitizedButton,
        whatsappMessage: sanitizedMessage,
      },
    };
    await saveJVaultData(newData);
    return NextResponse.json({ success: true, config: newData.config });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan pengaturan." }, { status: 502 });
  }
}
