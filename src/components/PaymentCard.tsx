"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Download,
  Copy,
  Check,
  AlertTriangle,
  QrCode,
  Sparkles,
  RefreshCw,
  Clock,
  ShieldCheck,
  ArrowRight,
  Wallet,
} from "lucide-react";
import { pushToast } from "./Toast";

type PaymentTx = {
  orderId: string;
  baseNominal: number;
  uniqueCode: number;
  totalNominal: number;
  qrisCodeTemplate: string;
  qrisImageUrl: string;
  qrisDynamicString?: string;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  source?: string;
  expiresAt: string;
  paidAt?: string;
};

export default function PaymentCard({
  initialOrderId,
  initialBayar,
}: {
  initialOrderId: string | null;
  initialBayar: string | number | null;
}) {
  const [tx, setTx] = useState<PaymentTx | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedNominal, setCopiedNominal] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [copiedQrString, setCopiedQrString] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60); // 15 minutes
  const [isDownloading, setIsDownloading] = useState(false);

  const orderId = initialOrderId?.trim() || null;
  const rawBayar = initialBayar ? parseInt(String(initialBayar), 10) : 0;
  const bayar = isNaN(rawBayar) ? 0 : rawBayar;

  // Initialize or fetch transaction
  useEffect(() => {
    if (!orderId || !bayar || bayar < 100) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch("/api/payment/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, bayar }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((d) => Promise.reject(d.error || "Gagal membuat transaksi"));
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.transaction) {
          setTx(data.transaction);
        }
      })
      .catch((err) => {
        if (isMounted) setError(typeof err === "string" ? err : "Gagal memproses transaksi QRIS");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [orderId, bayar]);

  // Polling payment status every 3 seconds if PENDING
  useEffect(() => {
    if (!tx || tx.status !== "PENDING") return;

    const interval = setInterval(() => {
      fetch(`/api/payment/status?order_id=${encodeURIComponent(tx.orderId)}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.transaction) {
            setTx((prev) => {
              if (data.transaction.status === "PAID" && prev?.status !== "PAID") {
                pushToast({ type: "success", message: "Pembayaran Berhasil Terverifikasi! 🎉" });
              }
              return data.transaction;
            });
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [tx?.orderId, tx?.status]);

  // Countdown timer calculation
  useEffect(() => {
    if (!tx || tx.status !== "PENDING") return;

    const calculateTimeLeft = () => {
      const expires = new Date(tx.expiresAt).getTime();
      const now = new Date().getTime();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(diff);

      if (diff <= 0) {
        setTx((prev) => (prev ? { ...prev, status: "EXPIRED" } : null));
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [tx?.expiresAt, tx?.status]);

  // Format currency IDR
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleCopyTotal = async () => {
    if (!tx) return;
    try {
      await navigator.clipboard.writeText(String(tx.totalNominal));
      setCopiedNominal(true);
      setTimeout(() => setCopiedNominal(false), 2000);
      pushToast({ type: "success", message: `Total nominal Rp ${tx.totalNominal} disalin!` });
    } catch {}
  };

  const handleCopyOrderId = async () => {
    if (!tx) return;
    try {
      await navigator.clipboard.writeText(tx.orderId);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
      pushToast({ type: "success", message: `Order ID ${tx.orderId} disalin!` });
    } catch {}
  };

  const handleCopyQrString = async () => {
    if (!tx || !tx.qrisDynamicString) return;
    try {
      await navigator.clipboard.writeText(tx.qrisDynamicString);
      setCopiedQrString(true);
      setTimeout(() => setCopiedQrString(false), 2000);
      pushToast({ type: "success", message: "String QRIS disalin!" });
    } catch {}
  };

  const handleDownloadQr = async () => {
    if (!tx) return;
    setIsDownloading(true);
    try {
      const proxyUrl = `/api/qris/proxy?qris=${encodeURIComponent(tx.qrisCodeTemplate)}&nominal=${tx.totalNominal}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `QRIS-${tx.orderId}-${tx.totalNominal}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      pushToast({ type: "success", message: "QRIS berhasil diunduh!" });
    } catch {
      pushToast({ type: "error", message: "Gagal mengunduh gambar QRIS" });
    } finally {
      setIsDownloading(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // Invalid parameters view
  if (!orderId || !bayar || bayar < 100) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] rounded-[28px] border border-zinc-200 bg-white p-8 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.12)] sm:p-10"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        </div>
        <h1 className="mt-6 text-center text-[22px] font-semibold tracking-tight text-zinc-900">
          Parameter Pembayaran Tidak Lengkap
        </h1>
        <p className="mt-2 text-center text-[14.5px] leading-6 text-zinc-500">
          Halaman ini membutuhkan URL parameter nominal dan order id:
        </p>
        <div className="mt-6 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Contoh format URL valid:</p>
          <code className="mt-2 block break-all rounded-xl bg-white px-3 py-2.5 font-mono text-[13px] text-zinc-700 ring-1 ring-zinc-200">
            https://bot.arasyarafi.xyz?bayar=5000&order_id=BOT-12345
          </code>
        </div>
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex w-full max-w-[480px] flex-col items-center justify-center rounded-[28px] border border-zinc-200 bg-white p-12 shadow-xl"
      >
        <Loader2 className="h-9 w-9 animate-spin text-emerald-600" />
        <p className="mt-4 text-sm font-semibold text-zinc-700">Membuat QRIS Dinamis...</p>
        <p className="mt-1 text-xs text-zinc-400">Menghitung kode unik transaksi (1-50)</p>
      </motion.div>
    );
  }

  if (error || !tx) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px] rounded-[28px] border border-red-200 bg-white p-8 text-center shadow-xl sm:p-10"
      >
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 ring-1 ring-red-200">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h1 className="mt-5 text-[20px] font-semibold text-zinc-900">Gagal Membuat QRIS</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-500">{error || "Terjadi kesalahan saat memproses pembayaran."}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Coba Lagi
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[480px] overflow-hidden rounded-[28px] border border-zinc-200/80 bg-white shadow-[0_24px_70px_-20px_rgba(0,0,0,0.14)]"
    >
      {/* Top Gradient accent */}
      <div className="h-[4px] w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

      <div className="px-6 pb-8 pt-7 sm:px-8 sm:pb-9">
        <AnimatePresence mode="wait">
          {tx.status === "PAID" ? (
            /* SUCCESS STATE */
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle2 className="h-9 w-9" />
              </motion.div>
              <h1 className="mt-5 text-[22px] font-bold tracking-tight text-zinc-900">Pembayaran Berhasil!</h1>
              <p className="mt-1.5 text-sm text-zinc-500">
                Terima kasih, transaksi kamu telah terverifikasi secara otomatis oleh PayHook.
              </p>

              {/* Summary Card */}
              <div className="mt-6 rounded-2xl border border-emerald-200/70 bg-emerald-50/50 p-5 text-left">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
                  <span className="text-xs font-medium text-emerald-800">Order ID</span>
                  <span className="font-mono text-xs font-bold text-emerald-950">{tx.orderId}</span>
                </div>
                <div className="flex items-center justify-between border-b border-emerald-100 py-3">
                  <span className="text-xs font-medium text-emerald-800">Nominal Lunas</span>
                  <span className="font-mono text-sm font-bold text-emerald-950">{formatRupiah(tx.totalNominal)}</span>
                </div>
                <div className="flex items-center justify-between pt-3">
                  <span className="text-xs font-medium text-emerald-800">Metode</span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <Wallet className="h-3.5 w-3.5" /> {tx.source || "QRIS PayHook"}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-emerald-600">
                <ShieldCheck className="h-4 w-4" /> Transaksi Aman & Terverifikasi
              </div>
            </motion.div>
          ) : tx.status === "EXPIRED" ? (
            /* EXPIRED STATE */
            <motion.div key="expired" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 ring-1 ring-amber-200">
                <Clock className="h-7 w-7 text-amber-500" />
              </div>
              <h1 className="mt-5 text-[20px] font-bold text-zinc-900">Waktu Pembayaran Habis</h1>
              <p className="mt-2 text-sm text-zinc-500">
                Batas waktu 15 menit telah berakhir. Silakan lakukan pemesanan ulang untuk mendapatkan QRIS baru.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 w-full rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white shadow-md hover:bg-zinc-800"
              >
                Buat QRIS Baru
              </button>
            </motion.div>
          ) : (
            /* PENDING / DYNAMIC QRIS VIEW */
            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Header Merchant Info */}
              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">QRIS Dinamis</span>
                  </div>
                  <h1 className="mt-1 text-lg font-bold tracking-tight text-zinc-900">JOJO BOT PAYMENT</h1>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase">Order ID</span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-zinc-800">
                    <span>{tx.orderId}</span>
                    <button
                      onClick={handleCopyOrderId}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                      title="Salin Order ID"
                    >
                      {copiedOrderId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic QRIS Frame Container */}
              <div className="mt-6 flex flex-col items-center">
                <div className="relative flex flex-col items-center rounded-3xl border-2 border-zinc-900/10 bg-gradient-to-b from-zinc-50 to-white p-5 shadow-inner">
                  {/* QRIS Logo Bar */}
                  <div className="mb-3 flex w-full items-center justify-between px-2">
                    <span className="font-bold tracking-tighter text-zinc-900 text-sm">QRIS</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800 uppercase tracking-widest">
                      Dinamis Auto-Check
                    </span>
                  </div>

                  {/* QR Image */}
                  <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-2.5 shadow-md">
                    {/* eslint-disable-next-html-img-element */}
                    <img
                      src={tx.qrisImageUrl}
                      alt={`QRIS Dinamis ${tx.orderId}`}
                      className="h-[230px] w-[230px] object-contain sm:h-[250px] sm:w-[250px]"
                    />
                  </div>

                  <p className="mt-3 text-[11px] font-medium text-zinc-500">
                    Scan via DANA, GoPay, OVO, ShopeePay, BCA, Livin, dll.
                  </p>
                </div>

                {/* Action buttons: Download & Copy String */}
                <div className="mt-4 flex w-full gap-2">
                  <button
                    onClick={handleDownloadQr}
                    disabled={isDownloading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-95 disabled:opacity-60"
                  >
                    {isDownloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5 text-emerald-600" />}
                    Download QRIS
                  </button>

                  {tx.qrisDynamicString && (
                    <button
                      onClick={handleCopyQrString}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 active:scale-95"
                    >
                      {copiedQrString ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      Salin Text
                    </button>
                  )}
                </div>
              </div>

              {/* Nominal & Unique Code Breakdown Box */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4">
                <div className="space-y-2 text-xs text-zinc-600">
                  <div className="flex items-center justify-between">
                    <span>Nominal Dasar</span>
                    <span className="font-mono font-semibold text-zinc-800">{formatRupiah(tx.baseNominal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-medium">
                      Kode Unik
                      <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800">
                        +#{tx.uniqueCode}
                      </span>
                    </span>
                    <span className="font-mono font-semibold text-emerald-700">+ {formatRupiah(tx.uniqueCode)}</span>
                  </div>
                </div>

                <div className="my-3 border-t border-dashed border-zinc-300" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">TOTAL BAYAR PAS</p>
                    <p className="font-mono text-2xl font-black tracking-tight text-emerald-600">
                      {formatRupiah(tx.totalNominal)}
                    </p>
                  </div>

                  <button
                    onClick={handleCopyTotal}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
                  >
                    {copiedNominal ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedNominal ? "Tersalin!" : "Salin Nominal"}
                  </button>
                </div>
              </div>

              {/* Critical Warning Alert */}
              <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/80 p-3.5">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <p className="text-xs leading-5 font-medium text-amber-900">
                    <strong className="font-bold">PENTING:</strong> Transfer WAJIB tepat{" "}
                    <span className="font-mono font-extrabold text-amber-950 underline">{formatRupiah(tx.totalNominal)}</span> (termasuk 3 digit terakhir) agar verifikasi pembayaran otomatis oleh PayHook bekerja.
                  </p>
                </div>
              </div>

              {/* Status Bar & Timer */}
              <div className="mt-5 flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-zinc-600">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  <span>Mengecek pembayaran otomatis...</span>
                </div>
                <div className="flex items-center gap-1 font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full ring-1 ring-amber-200">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{timeFormatted}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
