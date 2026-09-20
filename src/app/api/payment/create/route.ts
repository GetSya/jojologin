import { NextResponse } from "next/server";
import { getOrCreatePaymentTransaction } from "@/lib/payment";
import { getConfig } from "@/lib/jvault";

async function handlePaymentCreate(orderId: string, rawBayar: unknown) {
  const cleanOrderId = typeof orderId === "string" ? orderId.trim() : "";
  const bayar = typeof rawBayar === "number" ? rawBayar : parseInt(String(rawBayar || "0"), 10);

  if (!cleanOrderId) {
    return NextResponse.json(
      { status: "error", type: 0, error: "Parameter order_id wajib diisi" },
      { status: 400 }
    );
  }

  if (isNaN(bayar) || bayar < 100) {
    return NextResponse.json(
      { status: "error", type: 0, error: "Nominal pembayaran (bayar) minimal Rp 100" },
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

  const transaction = await getOrCreatePaymentTransaction(cleanOrderId, bayar, customQrisTemplate);

  const isPaid = transaction.status === "PAID";
  const typeValue = isPaid ? 1 : 0;

  return NextResponse.json({
    status: "ok",
    type: typeValue, // 1 jika sudah selesai (PAID), 0 jika PENDING / baru dibuat
    order_id: transaction.orderId,
    orderId: transaction.orderId,
    amount: transaction.totalNominal,
    base_nominal: transaction.baseNominal,
    unique_code: transaction.uniqueCode,
    total_nominal: transaction.totalNominal,
    qris_url: transaction.qrisImageUrl,
    qris_string: transaction.qrisDynamicString || null,
    created_at: transaction.createdAt,
    expires_at: transaction.expiresAt,
    transaction: {
      ...transaction,
      type: typeValue,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body?.orderId ?? body?.order_id ?? "";
    const rawBayar = body?.bayar ?? body?.nominal;
    return await handlePaymentCreate(orderId, rawBayar);
  } catch (err) {
    console.error("Error creating payment transaction:", err);
    return NextResponse.json(
      { status: "error", type: 0, error: "Terjadi kesalahan internal pada server" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id") || searchParams.get("orderId");
    const rawBayar = searchParams.get("bayar") || searchParams.get("nominal");
    return await handlePaymentCreate(orderId || "", rawBayar);
  } catch (err) {
    console.error("Error creating payment transaction via GET:", err);
    return NextResponse.json(
      { status: "error", type: 0, error: "Terjadi kesalahan internal pada server" },
      { status: 500 }
    );
  }
}
