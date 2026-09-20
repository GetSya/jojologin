import { NextResponse } from "next/server";
import { getPaymentTransaction, getOrCreatePaymentTransaction } from "@/lib/payment";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id") || searchParams.get("orderId");
    const rawBayar = searchParams.get("bayar") || searchParams.get("nominal");

    if (!orderId) {
      return NextResponse.json(
        { status: "error", type: 0, error: "Parameter order_id wajib diisi" },
        { status: 400 }
      );
    }

    let transaction = getPaymentTransaction(orderId);

    // If transaction doesn't exist yet and bayar is present in query, create it
    if (!transaction && rawBayar) {
      const bayar = parseInt(rawBayar, 10);
      if (!isNaN(bayar) && bayar >= 100) {
        transaction = await getOrCreatePaymentTransaction(orderId, bayar);
      }
    }

    if (!transaction) {
      return NextResponse.json(
        { status: "not_found", type: 0, error: "Transaksi tidak ditemukan" },
        { status: 404 }
      );
    }

    const isPaid = transaction.status === "PAID";
    const typeValue = isPaid ? 1 : 0;

    return NextResponse.json({
      status: "ok",
      type: typeValue, // 1 jika transaksi sudah selesai (PAID), 0 jika PENDING / belum selesai
      order_id: transaction.orderId,
      orderId: transaction.orderId,
      amount: transaction.totalNominal,
      base_nominal: transaction.baseNominal,
      unique_code: transaction.uniqueCode,
      transaction_status: transaction.status,
      paid_at: transaction.paidAt || null,
      source: transaction.source || null,
      transaction: {
        ...transaction,
        type: typeValue,
      },
    });
  } catch (err) {
    console.error("Error getting payment status:", err);
    return NextResponse.json(
      { status: "error", type: 0, error: "Gagal mengambil status pembayaran" },
      { status: 500 }
    );
  }
}
