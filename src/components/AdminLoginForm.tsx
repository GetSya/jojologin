"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { pushToast } from "./Toast";

export default function AdminLoginForm() {
  const [pin, setPin] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "PIN tidak valid.");
        pushToast({ type: "error", message: data.error || "PIN tidak valid." });
        setLoading(false);
        return;
      }
      pushToast({ type: "success", message: "Login berhasil!" });
      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      setError("Gagal menghubungkan ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfcf9] px-4 py-12">
      <div className="pointer-events-none absolute inset-0 -z-0 bg-gradient-to-b from-white to-[#f5f5f0]" />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-[420px] rounded-[24px] border border-zinc-200 bg-white p-8 shadow-xl sm:p-9"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
          <Lock className="h-5 w-5" />
        </div>
        <h1 className="mt-5 text-center text-xl font-semibold tracking-tight text-zinc-900">Admin Panel</h1>
        <p className="mt-1.5 text-center text-sm text-zinc-500">Masukkan PIN untuk melanjutkan</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="••••"
              maxLength={20}
              autoFocus
              className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 pr-12 text-center text-lg tracking-[0.3em] font-semibold placeholder:tracking-normal placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl p-2.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pin}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-400">Halaman ini dilindungi. Jangan bagikan PIN kepada siapapun.</p>
      </motion.div>
    </div>
  );
}
