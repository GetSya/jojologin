import { getJVaultData, saveJVaultData, JVaultData } from "./jvault";

export type PaymentStatus = "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";

export type PaymentTransaction = {
  type: number; // 1 = Selesai / PAID, 0 = Belum selesai / PENDING
  orderId: string;
  baseNominal: number;
  uniqueCode: number; // 1 to 50
  totalNominal: number; // baseNominal + uniqueCode
  qrisCodeTemplate: string;
  qrisDynamicString?: string;
  qrisImageUrl: string;
  status: PaymentStatus;
  source?: string;
  eventId?: string;
  createdAt: string;
  expiresAt: string;
  paidAt?: string;
};

export type PayHookSettings = {
  qrisTemplate: string;
  apiUrl: string;
  secretToken: string;
};

export const DEFAULT_PAYHOOK_SETTINGS: PayHookSettings = {
  qrisTemplate:
    "00020101021126570011ID.DANA.WWW011893600915390930088102099093008810303UMI51440014ID.CO.QRIS.WWW0215ID10254040171760303UMI5204737253033605802ID5908Jojo Bot6010Kab. Bogor610516340630425A2",
  apiUrl: "https://api-mininxd.vercel.app/qris",
  secretToken: "akuacapkali",
};

// In-memory transaction store for quick serverless lookup & active state
const inMemoryTransactions = new Map<string, PaymentTransaction>();

function isExpired(tx: PaymentTransaction): boolean {
  if (tx.status !== "PENDING") return false;
  return new Date().getTime() > new Date(tx.expiresAt).getTime();
}

/**
 * Generate a random unique code from 1 to 50
 * ensuring no active PENDING transaction shares the same uniqueCode
 */
function generateUniqueCode(baseNominal: number, activeTxs: PaymentTransaction[]): number {
  const usedCodes = new Set(
    activeTxs
      .filter((t) => t.status === "PENDING" && !isExpired(t) && t.baseNominal === baseNominal)
      .map((t) => t.uniqueCode)
  );

  const available: number[] = [];
  for (let i = 1; i <= 50; i++) {
    if (!usedCodes.has(i)) {
      available.push(i);
    }
  }

  if (available.length > 0) {
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
  }

  // Fallback if all 1-50 are occupied (unlikely): generate random 1-50
  return Math.floor(Math.random() * 50) + 1;
}

/**
 * Get or create a dynamic QRIS transaction with unique code 1-50
 */
export async function getOrCreatePaymentTransaction(
  orderId: string,
  baseNominal: number,
  customQrisTemplate?: string
): Promise<PaymentTransaction> {
  const cleanOrderId = orderId.trim();
  const validNominal = Math.max(100, Math.floor(baseNominal));

  // Check in-memory first
  let tx = inMemoryTransactions.get(cleanOrderId);
  if (tx && tx.status === "PENDING" && isExpired(tx)) {
    tx.status = "EXPIRED";
    tx.type = 0;
    inMemoryTransactions.set(cleanOrderId, tx);
  }

  if (tx && (tx.status === "PENDING" || tx.status === "PAID")) {
    tx.type = tx.status === "PAID" ? 1 : 0;
    return tx;
  }

  // Active pending transactions list across inMemory
  const activeTxs = Array.from(inMemoryTransactions.values());
  const uniqueCode = generateUniqueCode(validNominal, activeTxs);
  const totalNominal = validNominal + uniqueCode;

  const qrisTemplate = customQrisTemplate || DEFAULT_PAYHOOK_SETTINGS.qrisTemplate;
  const apiUrl = DEFAULT_PAYHOOK_SETTINGS.apiUrl;

  // Fetch QRIS dynamic payload from API mininxd
  let qrisDynamicString = "";
  try {
    const fetchUrl = `${apiUrl}?qris=${encodeURIComponent(qrisTemplate)}&nominal=${totalNominal}`;
    const res = await fetch(fetchUrl, { cache: "no-store" });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.QR) {
        qrisDynamicString = json.QR;
      }
    }
  } catch (err) {
    console.error("Failed to fetch dynamic QRIS string from mininxd:", err);
  }

  // Direct image URL from mininxd API
  const qrisImageUrl = `${apiUrl}?qris=${encodeURIComponent(qrisTemplate)}&nominal=${totalNominal}&type=images`;

  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes TTL

  const newTx: PaymentTransaction = {
    type: 0, // PENDING initially = 0
    orderId: cleanOrderId,
    baseNominal: validNominal,
    uniqueCode,
    totalNominal,
    qrisCodeTemplate: qrisTemplate,
    qrisDynamicString: qrisDynamicString || undefined,
    qrisImageUrl,
    status: "PENDING",
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };

  inMemoryTransactions.set(cleanOrderId, newTx);
  return newTx;
}

export function getPaymentTransaction(orderId: string): PaymentTransaction | null {
  const cleanId = orderId.trim();
  const tx = inMemoryTransactions.get(cleanId);
  if (!tx) return null;
  if (tx.status === "PENDING" && isExpired(tx)) {
    tx.status = "EXPIRED";
    tx.type = 0;
    inMemoryTransactions.set(cleanId, tx);
  }
  tx.type = tx.status === "PAID" ? 1 : 0;
  return tx;
}

/**
 * Process incoming PayHook webhook notification
 */
export async function processPayHookNotification(payload: {
  amount: number;
  source?: string;
  event_id?: string;
  reference?: string;
}): Promise<{ success: boolean; transaction?: PaymentTransaction; message: string }> {
  const { amount, source, event_id, reference } = payload;
  if (!amount || typeof amount !== "number") {
    return { success: false, message: "Nominal pembayaran tidak valid" };
  }

  const allTxs = Array.from(inMemoryTransactions.values());

  // First try matching exact totalNominal for active PENDING transactions
  let match = allTxs.find(
    (t) => t.status === "PENDING" && !isExpired(t) && t.totalNominal === Math.floor(amount)
  );

  // If reference is provided and matches orderId
  if (!match && reference) {
    match = allTxs.find(
      (t) => t.status === "PENDING" && !isExpired(t) && t.orderId === reference.trim()
    );
  }

  if (!match) {
    return {
      success: false,
      message: `Tidak ditemukan transaksi PENDING dengan total Rp ${amount}`,
    };
  }

  // Update status to PAID and type to 1
  match.status = "PAID";
  match.type = 1;
  match.source = source || "PayHook";
  match.eventId = event_id || `evt_${Date.now()}`;
  match.paidAt = new Date().toISOString();

  inMemoryTransactions.set(match.orderId, match);

  return {
    success: true,
    transaction: match,
    message: `Pembayaran ${match.orderId} senilai Rp ${match.totalNominal} terkonfirmasi lunas!`,
  };
}

export function getAllTransactions(): PaymentTransaction[] {
  return Array.from(inMemoryTransactions.values())
    .map((tx) => ({ ...tx, type: tx.status === "PAID" ? 1 : 0 }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
