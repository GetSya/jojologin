import { NextResponse } from "next/server";
import { getOrCreatePaymentTransaction } from "@/lib/payment";
import { getConfig } from "@/lib/jvault";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = typeof body?.orderId === "string" ? body.orderId.trim() : "";
    const rawBayar = body?.bayar ?? body?.nominal;
    const bayar = typeof rawBayar === "number" ? rawBayar : parseInt(String(rawBayar || "0"), 10);

    if (!orderId) {
      return NextResponse.json(
        { error: "Parameter order_id (orderId) wajib diisi" },
        { status: 400 }
      );
    }

    if (isNaN(bayar) || bayar < 100) {
      return NextResponse.json(
        { error: "Nominal pembayaran (bayar) minimal Rp 100" },
        { status: 400 }
      );
    }

    let customQrisTemplate: string | undefined;
    try {
      const cfg = await getConfig();
      if (cfg.qrisTemplate) {
        customQrisTemplate = cfg.qrisTemplate;
      }
    } catch {
      // fallback
    }

    const transaction = await getOrCreatePaymentTransaction(orderId, bayar, customQrisTemplate);

    return NextResponse.json({
      status: "ok",
      transaction,
    });
  } catch (err) {
    console.error("Error creating payment transaction:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan internal pada server" },
      { status: 500 }
    );
  }
}
