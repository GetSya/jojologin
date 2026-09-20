import PaymentCard from "@/components/PaymentCard";
import { getConfig } from "@/lib/jvault";

type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function PayPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const rawBayar = params?.bayar ?? params?.nominal;
  const bayar = typeof rawBayar === "string" ? rawBayar : Array.isArray(rawBayar) ? rawBayar[0] : null;

  const rawOrderId = params?.order_id ?? params?.orderId;
  const orderId = typeof rawOrderId === "string" ? rawOrderId : Array.isArray(rawOrderId) ? rawOrderId[0] : null;

  let displayDomain = "bot.arasyarafi.xyz";
  try {
    const cfg = await getConfig();
    if (cfg.domain) displayDomain = cfg.domain;
  } catch {
    // fallback
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fcfcf9]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#fcfcf9] to-[#f5f5f0]" />
        <div className="absolute left-1/2 top-[-160px] h-[560px] w-[880px] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-100/70 via-teal-100/50 to-cyan-100/60 blur-[44px]" />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-[1080px] items-center justify-between px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
            <span className="text-[15px] font-bold tracking-tight">◎</span>
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-zinc-900">{displayDomain}</p>
            <p className="hidden text-xs font-medium text-zinc-500 sm:block">Pembayaran QRIS PayHook</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-2 sm:px-6 sm:pb-20">
        <PaymentCard initialOrderId={orderId} initialBayar={bayar} />
      </main>

      <footer className="relative z-10 border-t border-zinc-200/60 bg-white/60 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-2 px-6 text-xs text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Jojo Bot. Semua hak dilindungi.</p>
          <p className="font-medium">Powered by PayHook • Dynamic QRIS</p>
        </div>
      </footer>
    </div>
  );
}
