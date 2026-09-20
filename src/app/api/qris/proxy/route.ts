import { NextResponse } from "next/server";
import { DEFAULT_PAYHOOK_SETTINGS } from "@/lib/payment";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const qris = searchParams.get("qris") || DEFAULT_PAYHOOK_SETTINGS.qrisTemplate;
    const nominal = searchParams.get("nominal") || "5000";

    const apiUrl = DEFAULT_PAYHOOK_SETTINGS.apiUrl;
    const targetUrl = `${apiUrl}?qris=${encodeURIComponent(qris)}&nominal=${nominal}&type=images`;

    const res = await fetch(targetUrl, { cache: "no-store" });
    if (!res.ok) {
      return new NextResponse("Gagal mengambil gambar QRIS", { status: 502 });
    }

    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `inline; filename="QRIS-${nominal}.png"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (err) {
    console.error("QRIS Proxy Error:", err);
    return new NextResponse("Server Error", { status: 500 });
  }
}
