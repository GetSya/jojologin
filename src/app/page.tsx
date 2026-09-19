import RegisterCard from "@/components/RegisterCard";

export default async function Home({ searchParams }: PageProps<"/">) {
  const params = await searchParams;
  const nomor = typeof params?.nomor === "string" ? params.nomor : null;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#fcfcf9]">
      {/* soft gradient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#fcfcf9] to-[#f5f5f0]" />
        <div className="absolute left-1/2 top-[-160px] h-[560px] w-[880px] -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-100/70 via-teal-100/50 to-cyan-100/60 blur-[44px]" />
        <div className="absolute left-[-120px] top-[380px] h-[420px] w-[420px] rounded-full bg-amber-100/30 blur-[60px]" />
        <div className="absolute right-[-120px] top-[320px] h-[520px] w-[520px] rounded-full bg-emerald-50/60 blur-[50px]" />
      </div>

      {/* Header brand */}
      <header className="relative z-10 mx-auto flex w-full max-w-[1080px] items-center justify-between px-6 py-6 sm:px-8 sm:py-7">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm">
            <span className="text-[15px] font-bold tracking-tight">◎</span>
          </div>
          <div>
            <p className="text-[15px] font-semibold tracking-tight text-zinc-900">acamedia.bot</p>
            <p className="hidden text-xs font-medium text-zinc-500 sm:block">WhatsApp Bot Registry</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 shadow-sm sm:flex">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold tracking-wide text-zinc-600">SYSTEM ONLINE</span>
        </div>
      </header>

      {/* Main */}
      <main className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-2 sm:px-6 sm:pb-20">
        <RegisterCard initialNomor={nomor} />

        {/* trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs font-medium text-zinc-500">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Enkripsi end-to-end
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5">
            Aman & terpercaya
          </span>
        </div>
      </main>

      <footer className="relative z-10 border-t border-zinc-200/60 bg-white/60 py-5 backdrop-blur">
        <div className="mx-auto flex max-w-[1080px] flex-col items-center justify-between gap-2 px-6 text-xs text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Acamedia. Semua hak dilindungi.</p>
          <p className="font-medium">Powered by JVault • Saweria-inspired UI</p>
        </div>
      </footer>
    </div>
  );
}

