"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Save, Loader2, LogOut, CheckCircle2, Settings2, MessageCircle, Phone, Type, Globe } from "lucide-react";
import { pushToast } from "./Toast";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [botPhone, setBotPhone] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [message, setMessage] = useState("");
  const [domain, setDomain] = useState("");
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
        setDomain(d.config.domain ?? "bot.acamedia.xyz");
      })
      .catch(() => {
        pushToast({ type: "error", message: "Gagal memuat pengaturan." });
      })
      .finally(() => setLoading(false));
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
    const d = domain?.trim() ? domain.trim().replace(/^https?:\/\//, "").split("/")[0] : "bot.acamedia.xyz";
    return `https://${d}?nomor=6288213292687`;
  })();

  const handleSave = async () => {
    if (!botPhone || !buttonText || !message || !domain) {
      pushToast({ type: "error", message: "Semua field wajib diisi." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botPhone, whatsappButtonText: buttonText, whatsappMessage: message, domain }),
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
    <div className="min-h-screen bg-[#fcfcf9]">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white">
              <Settings2 className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-zinc-900">Admin Dashboard</h1>
              <p className="text-xs text-zinc-500">Kelola pengaturan bot WhatsApp</p>
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

      <main className="mx-auto max-w-[720px] px-4 py-8 sm:px-6 sm:py-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-[24px] border border-zinc-200 bg-white shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)]"
        >
          <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400" />
          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Bot WhatsApp</p>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <Globe className="h-3.5 w-3.5 text-zinc-400" /> Domain Website
                </label>
                <div className="mt-2 flex items-center gap-2">
                  <span className="hidden shrink-0 rounded-xl bg-zinc-100 px-3 py-3 text-xs font-medium text-zinc-500 ring-1 ring-zinc-200 sm:inline">https://</span>
                  <input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="bot.acamedia.xyz"
                    className="w-full flex-1 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                  />
                </div>
                <p className="mt-1.5 text-xs text-zinc-500">Domain tanpa https://, contoh: bot.acamedia.xyz — dipakai untuk preview link registrasi</p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <Phone className="h-3.5 w-3.5 text-zinc-400" /> Nomor Bot
                </label>
                <input
                  value={botPhone}
                  onChange={(e) => setBotPhone(e.target.value)}
                  placeholder="6281234567890"
                  className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm focus:border-zinc-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                />
                <p className="mt-1.5 text-xs text-zinc-500">Format internasional tanpa + , contoh: 6281234567890</p>
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-zinc-700">
                  <Type className="h-3.5 w-3.5 text-zinc-400" /> Teks Tombol
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
                <p className="mt-1.5 text-right text-xs text-zinc-400">{message.length}/500</p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-zinc-800 disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>

            {/* Preview */}
            <div className="mt-8 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Preview Link Registrasi</p>
                <code className="mt-2 block break-all rounded-xl bg-white px-3 py-2.5 font-mono text-xs leading-5 text-zinc-600 ring-1 ring-zinc-200">
                  {domainPreview}
                </code>
                <p className="mt-1.5 text-xs text-zinc-500">Link ini yang dibagikan ke user (ganti nomor di akhir)</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Preview Link WhatsApp</p>
                <code className="mt-2 block break-all rounded-xl bg-white px-3 py-2.5 font-mono text-xs leading-5 text-zinc-600 ring-1 ring-zinc-200">
                  {previewLink || "-"}
                </code>
                <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Link divalidasi hanya ke https://wa.me/
                </div>
              </div>
            </div>

            {/* Status cards */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-medium text-emerald-700">Status Bot</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-emerald-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Aktif
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs font-medium text-zinc-500">Database</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-zinc-800">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Terhubung
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
