import { NextResponse } from "next/server";
import { processPayHookNotification } from "@/lib/payment";
import { getConfig } from "@/lib/jvault";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // Check optional authentication token/secret if configured
    try {
      const cfg = await getConfig();
      const secret = cfg.payhookToken || process.env.PAYHOOK_TOKEN || process.env.PAYHOOK_SECRET;

      if (secret && secret.trim()) {
        const authHeader = req.headers.get("authorization") || "";
        const apiKeyHeader = req.headers.get("x-api-key") || "";
        const sigHeader = req.headers.get("x-payhook-signature") || "";
        const tsHeader = req.headers.get("x-payhook-timestamp") || "";

        let authenticated = false;

        if (authHeader === `Bearer ${secret.trim()}` || authHeader === secret.trim()) {
          authenticated = true;
        } else if (apiKeyHeader === secret.trim()) {
          authenticated = true;
        } else if (sigHeader && tsHeader) {
          // HMAC SHA-256 verification
          const expected = "sha256=" + crypto.createHmac("sha256", secret.trim()).update(`${tsHeader}.${rawBody}`).digest("hex");
          if (crypto.timingSafeEqual(Buffer.from(sigHeader), Buffer.from(expected))) {
            authenticated = true;
          }
        }

        if (!authenticated) {
          return NextResponse.json({ error: "Unauthorized PayHook request" }, { status: 401 });
        }
      }
    } catch {
      // ignore config lookup error for public sandbox testing
    }

    // Handle heartbeat ping
    if (body.type === "heartbeat" || body.event_type === "heartbeat") {
      return NextResponse.json({ status: "ok", type: "heartbeat_ack" });
    }

    // Extract amount
    const rawAmount = body.amount;
    let amount = 0;
    if (typeof rawAmount === "number") {
      amount = rawAmount;
    } else if (typeof rawAmount === "string") {
      amount = parseFloat(rawAmount.replace(/[^0-9.]/g, ""));
    }

    const source = typeof body.source === "string" ? body.source : "PayHook";
    const event_id = typeof body.event_id === "string" ? body.event_id : undefined;
    const reference = typeof body.reference === "string" ? body.reference : undefined;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Amount must be a positive number" }, { status: 422 });
    }

    const result = await processPayHookNotification({
      amount,
      source,
      event_id,
      reference,
    });

    if (!result.success) {
      // Still return 200 OK so PayHook doesn't retry unnecessarily, but report status in JSON
      return NextResponse.json({
        status: "ignored",
        message: result.message,
      });
    }

    return NextResponse.json({
      status: "ok",
      message: result.message,
      order_id: result.transaction?.orderId,
    });
  } catch (err) {
    console.error("PayHook Webhook Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// GET route to check webhook health status
export async function GET() {
  return NextResponse.json({
    status: "online",
    service: "PayHook Webhook Listener",
    time: new Date().toISOString(),
  });
}
