"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Save,
  Loader2,
  LogOut,
  CheckCircle2,
  Settings2,
  MessageCircle,
  Phone,
  Type,
  Globe,
  QrCode,
  ShieldCheck,
  Send,
  RefreshCw,
} from "lucide-react";
import { pushToast } from "./Toast";
import { useRouter } from "next/navigation";

type Transaction = {
  orderId: string;
  baseNominal: number;
  uniqueCode: number;
  totalNominal: number;
  status: "PENDING" | "PAID" | "EXPIRED" | "CANCELLED";
  source?: string;
  createdAt: string;
  paidAt?: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [botPhone, setBotPhone] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [message, setMessage] = useState("");
  const [domain, setDomain] = useState("");
  const [qrisTemplate, setQrisTemplate] = useState("");
  const [payhookToken, setPayhookToken] = useState("");

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [simAmount, setSimAmount] = useState("");
  const [simSource, setSimSource] = useState("DANA");
  const [simulating, setSimulating] = useState(false);

  const fetchTransactions = () => {
    fetch("/api/admin/transactions")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && d.transactions) setTransactions(d.transactions);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json();
      })
      .then((d) => {
        setBotPhone(d.config.botPhone);
        setButtonText(d.config.whatsappButtonText);
        setMessage(d.config.whatsappMessage);
        setDomain(d.config.domain ?? "bot.arasyarafi.xyz");
        setQrisTemplate(
          d.config.qrisTemplate ??
            "00020101021126570011ID.DANA.WWW011893600915390930088102099093008810303UMI51440014ID.CO.QRIS.WWW0215ID10254040171760303UMI5204737253033605802ID5908Jojo Bot6010Kab. Bogor610516340630425A2"
        );
        setPayhookToken(d.config.payhookToken ?? "");
      })
      .catch(() => {
        pushToast({ type: "error", message: "Gagal memuat pengaturan." });
      })
      .finally(() => setLoading(false));

    fetchTransactions();
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  const previewLink = (() => {
    try {
      if (!botPhone) return "";
      const encoded = encodeURIComponent(message || "");
      return `https://wa.me/${botPhone}?text=${encoded}`;
    } catch {
      return "";
    }
  })();

  const domainPreview = (() => {
    const d = domain?.trim() ? domain.trim().replace(/^https?:\/\//, "").split("/")[0] : "bot.arasyarafi.xyz";
    return `https://${d}?nomor=6288213292687`;
  })();

  const payhookWebhookPreview = (() => {
    const d = domain?.trim() ? domain.trim().replace(/^https?:\/\//, "").split("/")[0] : "bot.arasyarafi.xyz";
    return `https://${d}/api/payhook`;
  })();

  const paymentPreview = (() => {
    const d = domain?.trim() ? domain.trim().replace(/^https?:\/\//, "").split("/")[0] : "bot.arasyarafi.xyz";
    return `https://${d}?bayar=5000&order_id=BOT-TEST1234`;
  })();

  const handleSave = async () => {
    if (!botPhone || !buttonText || !message || !domain) {
      pushToast({ type: "error", message: "Semua field utama wajib diisi." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botPhone,
          whatsappButtonText: buttonText,
          whatsappMessage: message,
          domain,
          qrisTemplate,
          payhookToken,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast({ type: "error", message: data.error || "Gagal menyimpan." });
        return;
      }
      pushToast({ type: "success", message: "Pengaturan berhasil disimpan." });
    } catch {
      pushToast({ type: "error", message: "Gagal menghubungkan ke server." });
    } finally {
      setSaving(false);
    }
  };

  const handleSimulatePayment = async () => {
    const amount = parseFloat(simAmount);
    if (!amount || isNaN(amount) || amount <= 0) {
      pushToast({ type: "error", message: "Masukkan nominal simulasi pembayaran (mis. 5023)" });
      return;
    }
    setSimulating(true);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, source: simSource }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast({ type: "error", message: data.error || "Simulasi pembayaran gagal" });
        return;
      }
      pushToast({ type: "success", message: data.message || "Simulasi pembayaran sukses!" });
      setSimAmount("");
      fetchTransactions();
    } catch {
      pushToast({ type: "error", message: "Gagal terhubung ke simulator" });
    } finally {
      setSimulating(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fcfcf9]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfcf9] pb-16">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[800px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Admin Dashboard</h1>
              <p className="text-xs text-zinc-500">Pengaturan WhatsApp Bot & QRIS PayHook</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          >
            <LogOut className="h-3.5 w-3.5" /> Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[800px] space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        {/* Main Settings Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)]"
        >
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Konfigurasi Utama</p>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <Globe className="h-3.5 w-3.5 text-zinc-400" /> Domain Website
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="hidden shrink-0 rounded-xl bg-zinc-100 px-3 py-3 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 sm:inline">
                    https://
                  </span>
                  <input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="bot.arasyarafi.xyz"
                    className="w-full flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" /> Nomor Bot WhatsApp
                </label>
                <input
                  value={botPhone}
                  onChange={(e) => setBotPhone(e.target.value)}
                  placeholder="6281234567890"
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <Type className="h-3.5 w-3.5 text-zinc-400" /> Teks Tombol WhatsApp
                </label>
                <input
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  placeholder="Lanjutkan ke WhatsApp"
                  maxLength={100}
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <MessageCircle className="h-3.5 w-3.5 text-zinc-400" /> Pesan WhatsApp
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Halo, saya sudah melakukan registrasi bot."
                  maxLength={500}
                  rows={3}
                  className="mt-2 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm leading-6 focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                />
              </div>

              {/* QRIS & PayHook Section */}
              <div className="pt-4 border-t border-zinc-100 space-y-5">
                <div className="flex items-center gap-2">
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-zinc-900">QRIS Dinamis & PayHook Webhook</h3>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700">QRIS Statis Base Code</label>
                  <textarea
                    value={qrisTemplate}
                    onChange={(e) => setQrisTemplate(e.target.value)}
                    placeholder="00020101021126570011ID.DANA.WWW..."
                    rows={3}
                    className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 font-mono text-xs focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Kode QRIS statis merchant kamu (DANA/BCA/ShopeePay dll). API mininxd akan mengubahnya menjadi QRIS dinamis + kode unik (1-50).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700">PayHook Auth Token / HMAC Secret (Opsional)</label>
                  <input
                    value={payhookToken}
                    onChange={(e) => setPayhookToken(e.target.value)}
                    placeholder="Masukkan Token / Secret PayHook jika diaktifkan di HP Android"
                    className="mt-1.5 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 font-mono text-xs focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                  />
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Jika diisi di aplikasi PayHook HP Android (Pengaturan Webhook → Token / Secret Key), masukkan nilai yang sama di sini.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan Semua Pengaturan"}
            </button>
          </div>
        </motion.div>

        {/* Integration Links Box */}
        <div className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">URL Endpoint & Link Integration</h3>

          <div>
            <span className="text-xs font-semibold text-zinc-700">1. URL Webhook PayHook (diisi di HP Android):</span>
            <code className="mt-1 block break-all rounded-xl bg-zinc-100 px-3 py-2 font-mono text-xs text-emerald-800 ring-1 ring-zinc-200">
              {payhookWebhookPreview}
            </code>
          </div>

          <div>
            <span className="text-xs font-semibold text-zinc-700">2. Contoh Link Pembayaran QRIS Dinamis:</span>
            <code className="mt-1 block break-all rounded-xl bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-700 ring-1 ring-zinc-200">
              {paymentPreview}
            </code>
          </div>

          <div>
            <span className="text-xs font-semibold text-zinc-700">3. Contoh Link Registrasi WhatsApp:</span>
            <code className="mt-1 block break-all rounded-xl bg-zinc-100 px-3 py-2 font-mono text-xs text-zinc-700 ring-1 ring-zinc-200">
              {domainPreview}
            </code>
          </div>
        </div>

        {/* PayHook Simulator & Transactions Card */}
        <div className="rounded-[24px] border border-zinc-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-zinc-900">Simulator & Log Transaksi Pembayaran</h3>
            </div>
            <button
              onClick={fetchTransactions}
              className="flex items-center gap-1 text-xs font-medium text-zinc-500 hover:text-zinc-900"
            >
              <RefreshCw className="h-3 w-3" /> Refresh
            </button>
          </div>

          {/* Simulator Box */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
            <p className="text-xs font-bold text-emerald-900">Simulasi Webhook PayHook (Uji Coba Manual)</p>
            <p className="mt-0.5 text-[11.5px] text-emerald-700">
              Masukkan total nominal pembayaran persis (misal 5023) untuk menguji verifikasi otomatis tanpa transaksi asli HP.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="number"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                placeholder="Contoh: 5023"
                className="w-36 rounded-xl border border-emerald-200 bg-white px-3 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={simSource}
                onChange={(e) => setSimSource(e.target.value)}
                className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs focus:outline-none"
              >
                <option value="DANA">DANA</option>
                <option value="BCA">BCA Mobile</option>
                <option value="GoPay">GoPay</option>
                <option value="OVO">OVO</option>
                <option value="ShopeePay">ShopeePay</option>
              </select>
              <button
                onClick={handleSimulatePayment}
                disabled={simulating}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
              >
                {simulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Kirim Simulasi
              </button>
            </div>
          </div>

          {/* Recent Transactions List */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2">Riwayat Transaksi Terkini</h4>
            {transactions.length === 0 ? (
              <p className="py-6 text-center text-xs text-zinc-400">Belum ada transaksi pembayaran QRIS.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {transactions.map((t) => (
                  <div
                    key={t.orderId}
                    className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs"
                  >
                    <div>
                      <div className="font-mono font-bold text-zinc-900">{t.orderId}</div>
                      <div className="mt-0.5 text-zinc-500">
                        Rp {t.baseNominal.toLocaleString("id-ID")} + Kode Unik #{t.uniqueCode} ={" "}
                        <strong className="font-mono text-zinc-800">Rp {t.totalNominal.toLocaleString("id-ID")}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          t.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : t.status === "EXPIRED"
                            ? "bg-zinc-200 text-zinc-600"
                            : "bg-amber-100 text-amber-800 animate-pulse"
                        }`}
                      >
                        {t.status}
                      </span>
                      {t.source && <div className="mt-0.5 text-[10px] text-zinc-400">{t.source}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
