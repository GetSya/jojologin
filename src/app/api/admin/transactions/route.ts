import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken, getCookieName } from "@/lib/auth";
import { getAllTransactions, processPayHookNotification } from "@/lib/payment";

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(getCookieName())?.value;
  if (!token) return false;
  return await verifyAdminToken(token);
}

export async function GET(req: NextRequest) {
  try {
    const isAuth = await isAuthorized(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = getAllTransactions();
    return NextResponse.json({ status: "ok", transactions });
  } catch (err) {
    console.error("Error getting transactions:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// POST endpoint for Admin Simulator testing
export async function POST(req: NextRequest) {
  try {
    const isAuth = await isAuthorized(req);
    if (!isAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const amount = typeof body.amount === "number" ? body.amount : parseFloat(body.amount || "0");
    const source = typeof body.source === "string" ? body.source : "Admin Simulator (DANA)";

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Nominal pembayaran tidak valid" }, { status: 400 });
    }

    const result = await processPayHookNotification({
      amount,
      source,
      event_id: `sim_${Date.now()}`,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 404 });
    }

    return NextResponse.json({
      status: "ok",
      message: result.message,
      transaction: result.transaction,
    });
  } catch (err) {
    console.error("Error running payment simulator:", err);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
