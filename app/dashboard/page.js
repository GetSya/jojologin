"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [botNumber, setBotNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [going, setGoing] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [waInput, setWaInput] = useState("");
  const [savingWa, setSavingWa] = useState(false);

  function authHeader() {
    const t = localStorage.getItem("jojo_token");
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  useEffect(() => {
    const saved = localStorage.getItem("jojo_user");
    if (saved) {
      const u = JSON.parse(saved);
      if (u.role === "admin") { router.push("/admin"); return; }
      setUser(u);
      if (u.whatsapp) setWaInput(u.whatsapp);
    }
    // verifikasi ke server (cookie httpOnly ikut terkirim) + ambil nomor bot
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { headers: authHeader() });
        if (!me.ok) { localStorage.clear(); router.push("/"); return; }
        const meData = await me.json();
        if (meData.user?.role === "admin") { router.push("/admin"); return; }
        setUser(meData.user);
        localStorage.setItem("jojo_user", JSON.stringify(meData.user));
        if (meData.user?.whatsapp) setWaInput(meData.user.whatsapp);
      } catch {}
      try {
        const b = await fetch("/api/bot-number");
        const bd = await b.json();
        setBotNumber(bd.bot_number || "");
      } catch {}
      setLoading(false);
    })();
  }, [router]);

  function logout() {
    localStorage.removeItem("jojo_token");
    localStorage.removeItem("jojo_user");
    fetch("/api/auth/me", { method: "POST" });
    router.push("/");
  }

  async function continueToBot() {
    setMsg({ type: "", text: "" });
    if (!user?.whatsapp) {
      setMsg({ type: "error", text: "Isi nomor WhatsApp dulu sebelum lanjut ke JojoBot." });
      return;
    }
    setGoing(true);
    try {
      const res = await fetch("/api/continue", {
        method: "POST",
        headers: authHeader(),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.message || "Gagal melanjutkan." });
        return;
      }
      setMsg({ type: "success", text: "Nomor kamu tersimpan. Membuka JojoBot..." });
      setTimeout(() => window.open(data.waLink, "_blank"), 700);
    } catch {
      setMsg({ type: "error", text: "Tidak dapat terhubung ke server." });
    } finally {
      setGoing(false);
    }
  }

  async function saveWhatsapp(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    setSavingWa(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ whatsapp: waInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.message || "Gagal menyimpan nomor." });
        return;
      }
      if (data.token) localStorage.setItem("jojo_token", data.token);
      if (data.user) {
        const merged = { ...user, ...data.user };
        setUser(merged);
        localStorage.setItem("jojo_user", JSON.stringify(merged));
      }
      setMsg({ type: "success", text: data.message });
    } catch {
      setMsg({ type: "error", text: "Tidak dapat terhubung ke server." });
    } finally {
      setSavingWa(false);
    }
  }

  if (loading) return <div className="page"><div className="wrap"><div className="cardbox">Memuat...</div></div></div>;

  return (
    <div className="page">
      <div className="wrap">
        <div className="topbar">
          <div className="row">
            <div className="brand-badge"><i className="fa-solid fa-robot"></i></div>
            <div>
              <div style={{ fontWeight: 800 }}>JojoBot Dashboard</div>
              <div className="muted">Halo, <b>{user?.username}</b> • <span className="code">{user?.whatsapp}</span></div>
            </div>
          </div>
          <div className="row">
            <button className="btn-ghost" onClick={() => router.push("/admin")}><i className="fa-solid fa-user-shield"></i> Panel Admin</button>
            <button className="btn-ghost" onClick={logout}><i className="fa-solid fa-right-from-bracket"></i> Logout</button>
          </div>
        </div>

        {msg.text && <div className={`alert ${msg.type}`} style={{ background: "#fff" }}>{msg.text}</div>}

        <div className="grid2">
          <div className="cardbox">
            <h3><i className="fa-solid fa-hand"></i> Selamat datang, {user?.username}!</h3>
            {!user?.whatsapp && (
              <div className="alert info" style={{ marginTop: 12 }}>
                Akun Google-mu belum punya nomor WhatsApp. Isi dulu agar bisa lanjut ke JojoBot.
              </div>
            )}
            <form onSubmit={saveWhatsapp} style={{ marginTop: 12 }}>
              <div className="row">
                <input
                  className="input"
                  value={waInput}
                  onChange={(e) => setWaInput(e.target.value)}
                  placeholder="Nomor WhatsApp (cth: 081234567890)"
                  inputMode="tel"
                  style={{ flex: 1 }}
                />
                <button className="btn-primary" style={{ margin: 0 }} disabled={savingWa}>
                  <i className="fa-solid fa-floppy-disk"></i> {savingWa ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
            <p className="muted">Akun kamu sudah aktif. Klik tombol di bawah untuk melanjutkan chat ke bot WhatsApp resmi kami.</p>
            <div style={{ marginTop: 18 }}>
              <button className="btn-wa" onClick={continueToBot} disabled={going || !botNumber}>
                <i className="fa-brands fa-whatsapp" style={{ fontSize: 20 }}></i> {going ? "Menyimpan..." : "Lanjutkan di JojoBot"}
              </button>
            </div>
            <p className="muted" style={{ marginTop: 14 }}>
              Nomor bot tujuan: <span className="code">+{botNumber || "..."}</span><br />
              Nomor WhatsApp-mu (<span className="code">+{user?.whatsapp}</span>) akan otomatis dicatat ke database saat kamu klik lanjutkan.
            </p>
          </div>
          <div className="cardbox" style={{ background: "linear-gradient(140deg,#7a68ff,#5b4df5)", color: "#fff" }}>
            <h3><i className="fa-solid fa-bolt"></i> Kenapa JojoBot?</h3>
            <p style={{ opacity: .9, fontSize: 14, marginTop: 6 }}>Respon otomatis 24/7, aman, dan terhubung langsung dengan akunmu.</p>
            <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
              {[
                { icon: "fa-circle-check", text: "Nomor kamu tersimpan otomatis" },
                { icon: "fa-circle-check", text: "Admin selalu update nomor bot aktif" },
                { icon: "fa-circle-check", text: "Satu klik langsung ke WhatsApp" },
              ].map((t) => (
                <div key={t.text} style={{ background: "rgba(255,255,255,.16)", border: "1px solid rgba(255,255,255,.3)", borderRadius: 12, padding: "10px 14px", fontSize: 13.5 }}><i className={`fa-solid ${t.icon}`}></i> {t.text}</div>
              ))}
            </div>
          </div>
        </div>
        <p className="footer-note">JojoBot © 2026 • Login & Register dengan Next.js + JVault</p>
      </div>
    </div>
  );
}
