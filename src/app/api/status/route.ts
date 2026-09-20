import { NextResponse } from "next/server";
import { getPaymentTransaction } from "@/lib/payment";
import { getConfig } from "@/lib/jvault";

async function checkOrderStatus(orderId: string, tokenInput?: string, reqHeaders?: Headers) {
  const cleanId = typeof orderId === "string" ? orderId.trim() : "";

  if (!cleanId) {
    return NextResponse.json(
      {
        status: "error",
        type: 0,
        message: "Parameter order_id wajib diisi",
      },
      { status: 400 }
    );
  }

  // Check optional token if provided
  try {
    const cfg = await getConfig();
    const expectedToken = cfg.payhookToken || "akuacapkali";

    const authHeader = reqHeaders?.get("authorization") || "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader.trim();
    const providedToken = tokenInput || bearerToken;

    if (expectedToken && providedToken && providedToken !== expectedToken) {
      return NextResponse.json(
        {
          status: "error",
          type: 0,
          message: "Bearer Token tidak valid",
        },
        { status: 401 }
      );
    }
  } catch {
    // fallback
  }

  const transaction = getPaymentTransaction(cleanId);

  if (!transaction) {
    return NextResponse.json(
      {
        status: "not_found",
        type: 0,
        order_id: cleanId,
        message: "Transaksi tidak ditemukan",
      },
      { status: 404 }
    );
  }

  const isPaid = transaction.status === "PAID";
  const typeValue = isPaid ? 1 : 0;

  return NextResponse.json({
    status: transaction.status,
    type: typeValue, // 1 jika transaksi selesai (PAID), 0 jika PENDING / EXPIRED
    order_id: transaction.orderId,
    orderId: transaction.orderId,
    amount: transaction.totalNominal,
    base_nominal: transaction.baseNominal,
    unique_code: transaction.uniqueCode,
    payment_status: transaction.status,
    paid_at: transaction.paidAt || null,
    source: transaction.source || null,
    created_at: transaction.createdAt,
    expires_at: transaction.expiresAt,
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id") || searchParams.get("orderId") || searchParams.get("id");
    const token = searchParams.get("token") || searchParams.get("bearer");
    return await checkOrderStatus(orderId || "", token || undefined, req.headers);
  } catch (err) {
    console.error("Error checking order status:", err);
    return NextResponse.json(
      { status: "error", type: 0, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body.order_id || body.orderId || body.id;
    const token = body.token || body.bearer;
    return await checkOrderStatus(orderId || "", token || undefined, req.headers);
  } catch (err) {
    console.error("Error checking order status via POST:", err);
    return NextResponse.json(
      { status: "error", type: 0, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
