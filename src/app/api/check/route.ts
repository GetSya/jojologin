import { NextResponse } from "next/server";
import { getPaymentTransaction } from "@/lib/payment";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id") || searchParams.get("orderId") || searchParams.get("id");

    if (!orderId) {
      return NextResponse.json(
        {
          type: 0,
          status: "error",
          message: "Parameter order_id wajib diisi",
        },
        { status: 400 }
      );
    }

    const transaction = getPaymentTransaction(orderId);

    if (!transaction) {
      return NextResponse.json(
        {
          type: 0,
          status: "not_found",
          order_id: orderId,
          message: "Transaksi tidak ditemukan",
        },
        { status: 404 }
      );
    }

    const isPaid = transaction.status === "PAID";

    return NextResponse.json({
      type: isPaid ? 1 : 0, // type: 1 jika transaksi selesai (PAID), type: 0 jika belum
      status: transaction.status,
      order_id: transaction.orderId,
      amount: transaction.totalNominal,
      base_nominal: transaction.baseNominal,
      unique_code: transaction.uniqueCode,
      paid_at: transaction.paidAt || null,
      source: transaction.source || null,
      created_at: transaction.createdAt,
      expires_at: transaction.expiresAt,
    });
  } catch (err) {
    console.error("Error in check API:", err);
    return NextResponse.json(
      {
        type: 0,
        status: "error",
        message: "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
