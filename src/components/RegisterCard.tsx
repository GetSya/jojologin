"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, ShieldCheck, Copy, Check, AlertTriangle, MessageCircle, Sparkles } from "lucide-react";
import { maskPhone, normalizePhone, formatDisplayPhone, isValidPhone } from "@/lib/validation";
import { pushToast } from "./Toast";

type Status = "idle" | "loading" | "success" | "already" | "error";

export default function RegisterCard({ initialNomor }: { initialNomor: string | null }) {
  const normalized = initialNomor ? normalizePhone(initialNomor) : "";
  const valid = normalized ? isValidPhone(normalized) : false;
  const hasNomor = !!initialNomor;

  const [status, setStatus] = useState<Status>("idle");
  const [waLink, setWaLink] = useState<string | null>(null);
  const [buttonText, setButtonText] = useState("Lanjutkan ke WhatsApp");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  // Load public config for WA button even before register (to show preview)
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => {
        if (d.whatsappButtonText) setButtonText(d.whatsappButtonText);
        if (d.waLink) setWaLink(d.waLink);
        setConfigLoaded(true);
      })
      .catch(() => setConfigLoaded(true));
  }, []);

  const handleRegister = async () => {
    if (!valid || status === "loading") return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error || "Registrasi gagal. Silakan coba lagi.");
        pushToast({ type: "error", message: data.error || "Registrasi gagal." });
        return;
      }
      if (data.status === "already_registered") {
        setStatus("already");
        pushToast({ type: "success", message: "Nomor sudah terdaftar — lanjut ke WhatsApp!" });
      } else {
        setStatus("success");
        pushToast({ type: "success", message: "Registrasi berhasil!" });
      }
      if (data.waLink) setWaLink(data.waLink);
      if (data.buttonText) setButtonText(data.buttonText);
      // Refresh config link if not provided
      if (!data.waLink) {
        const cfg = await fetch("/api/config").then((r) => r.json());
        if (cfg.waLink) setWaLink(cfg.waLink);
      }
    } catch {
      setStatus("error");
      setErrorMsg("Terjadi masalah saat menghubungkan ke server. Silakan coba lagi.");
      pushToast({ type: "error", message: "Gagal menghubungkan ke server." });
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(normalized);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      pushToast({ type: "success", message: "Nomor disalin!" });
    } catch {}
  };

  // No nomor state
  if (!hasNomor) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-[480px] rounded-[28px] border border-zinc-200/70 bg-white p-8 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.12),0_8px_24px_-12px_rgba(0,0,0,0.08)] sm:p-10"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <h1 className="mt-6 text-center text-[22px] font-semibold tracking-tight text-zinc-900">Nomor WhatsApp belum ditemukan</h1>
        <p className="mt-2 text-center text-[14.5px] leading-6 text-zinc-500">
          Halaman ini membutuhkan parameter <code className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[13px] font-medium text-zinc-700">?nomor=628xxxxxxxxxx</code>
        </p>
        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
          <p className="text-sm font-medium text-zinc-700">Contoh link valid:</p>
          <code className="mt-1.5 block break-all rounded-xl bg-white px-3 py-2.5 font-mono text-[12.5px] text-zinc-600 ring-1 ring-zinc-200">
            https://bot.acamedia.xyz?nomor=6288213292687
          </code>
        </div>
        <p className="mt-6 text-center text-xs leading-5 text-zinc-400">
          Pastikan link registrasi dibuka dari WhatsApp atau sistem yang menyertakan nomor kamu.
        </p>
      </motion.div>
    );
  }

  if (!valid) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-xl sm:p-10"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-200">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h1 className="mt-5 text-[20px] font-semibold text-zinc-900">Nomor tidak valid</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Nomor <span className="font-mono font-medium text-zinc-700">{initialNomor}</span> tidak dapat diproses. Gunakan format internasional <span className="font-medium">628xxxxxxxxxx</span>.
        </p>
      </motion.div>
    );
  }

  const masked = maskPhone(normalized);
  const pretty = formatDisplayPhone(normalized);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[480px] overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_20px_60px_-24px_rgba(0,0,0,0.15),0_12px_28px_-16px_rgba(0,0,0,0.10)]"
    >
      {/* Top accent gradient */}
      <div className="h-[3px] w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />

      <div className="px-7 pb-8 pt-8 sm:px-9 sm:pb-9">
        <AnimatePresence mode="wait">
          {status === "success" || status === "already" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 18 }}
                className="mx-auto flex h-[64px] w-[64px] items-center justify-center rounded-full bg-emerald-500 shadow-[0_8px_20px_-8px_rgba(16,185,129,0.6)]"
              >
                <CheckCircle2 className="h-8 w-8 text-white" />
              </motion.div>
              <h1 className="mt-5 text-[22px] font-semibold tracking-tight text-zinc-900">
                {status === "success" ? "Registrasi Berhasil!" : "Nomor Sudah Terdaftar"}
              </h1>
              <p className="mx-auto mt-2 max-w-[32ch] text-[14.5px] leading-6 text-zinc-500">
                {status === "success"
                  ? "Nomor WhatsApp kamu sudah berhasil terdaftar."
                  : "Nomor ini sudah terdaftar pada sistem."}
              </p>
              <p className="mt-5 text-sm font-medium text-zinc-700">Sekarang kamu bisa melanjutkan ke WhatsApp bot.</p>

              {/* Phone pill */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2">
                  <span className="font-mono text-[13.5px] font-medium tracking-wide text-zinc-700">{pretty}</span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> TERHUBUNG
                  </span>
                </div>
              </div>

              <motion.a
                href={waLink ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.01 }}
                className={`mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[#25D366] px-6 py-[15px] text-[15px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(37,211,102,0.6)] transition hover:bg-[#1ebd5a] ${!waLink ? "pointer-events-none opacity-60" : ""}`}
              >
                <MessageCircle className="h-[18px] w-[18px]" />
                {buttonText}
              </motion.a>
              {!waLink && !configLoaded && <p className="mt-3 text-xs text-zinc-400">Memuat konfigurasi bot...</p>}
            </motion.div>
          ) : (
            <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 ring-1 ring-emerald-100">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                </div>
                <h1 className="mt-4 text-[24px] font-semibold tracking-tight text-zinc-900">Daftarkan WhatsApp</h1>
                <p className="mx-auto mt-2 max-w-[30ch] text-[14.5px] leading-6 text-zinc-500">
                  Hubungkan nomor WhatsApp kamu ke bot dalam beberapa detik.
                </p>
              </div>

              {/* Phone display */}
              <div className="mt-7">
                <div className="group relative flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 backdrop-blur transition hover:bg-zinc-50 sm:px-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-zinc-200">
                      <span className="text-sm">🇮🇩</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400">Nomor WhatsApp</p>
                      <p className="font-mono text-[15px] font-semibold tracking-tight text-zinc-900">{masked}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCopy}
                    aria-label="Salin nomor"
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-zinc-600 shadow-sm ring-1 ring-zinc-200 transition hover:bg-zinc-50 active:scale-95"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-emerald-600">
                  <ShieldCheck className="h-4 w-4" />
                  Nomor berhasil dibaca — aman & terenkripsi
                </div>
              </div>

              {/* CTA */}
              <motion.button
                onClick={handleRegister}
                disabled={status === "loading"}
                whileTap={{ scale: 0.98 }}
                whileHover={{ scale: 1.01 }}
                className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl bg-zinc-900 px-6 py-[15px] text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.4)] transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Mendaftarkan...
                  </>
                ) : (
                  "Daftarkan Nomor"
                )}
              </motion.button>

              {status === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-center"
                >
                  <p className="text-sm font-semibold text-red-700">Registrasi gagal</p>
                  <p className="mt-1 text-[13px] leading-5 text-red-600/90">{errorMsg}</p>
                </motion.div>
              )}

              <p className="mt-6 text-center text-xs leading-5 text-zinc-400">
                Dengan mendaftar, kamu menyetujui untuk menghubungkan nomor ini dengan layanan bot WhatsApp kami.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
