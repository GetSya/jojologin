"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  async function handleRegister(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!username.trim() || !whatsapp.trim() || !password) {
      setMsg({ type: "error", text: "Semua field wajib diisi." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), whatsapp: whatsapp.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.message || "Registrasi gagal." });
        return;
      }
      setMsg({ type: "success", text: data.message + " Mengalihkan ke login..." });
      setTimeout(() => router.push("/"), 1200);
    } catch {
      setMsg({ type: "error", text: "Tidak dapat terhubung ke server." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stage">
      <div className="blob-purple" />
      <div className="blob-white" />
      <div className="card">
        <div className="panel-left">
          <div className="brand">
            <div className="brand-badge"><i className="fa-solid fa-robot"></i></div>
            <div className="brand-name">Jojo<span>Bot</span></div>
          </div>
          <h1 className="title">REGISTER</h1>
          <p className="subtitle">Buat akun untuk menghubungkan WhatsApp kamu ke JojoBot.</p>

          {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}

          <form onSubmit={handleRegister}>
            <div className="field">
              <span className="icon"><i className="fa-brands fa-whatsapp"></i></span>
              <input
                placeholder="Nomor WhatsApp (cth: 081234567890)"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            <p className="hint" style={{ marginTop: -8, marginBottom: 16 }}><i className="fa-solid fa-circle-info"></i>Ketik 08... otomatis disimpan 628... Kalau sudah 62..., dibiarkan.</p>
            <div className="field">
              <span className="icon"><i className="fa-solid fa-user"></i></span>
              <input
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
            <div className="field">
              <span className="icon"><i className="fa-solid fa-lock"></i></span>
              <input
                type={show ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" className="toggle" onClick={() => setShow(!show)} aria-label="Tampilkan password">
                <i className={show ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
              </button>
            </div>
            <button className="btn-primary" disabled={loading}>
              {loading ? "Mendaftar..." : "Register Now"}
            </button>
          </form>

          <p className="switch">
            Sudah punya akun? <Link href="/">Login di sini</Link>
          </p>
        </div>

        <div className="panel-right">
          <div className="glass">
            <img
              src="https://files.catbox.moe/1iw38j.jpg"
              alt="Register JojoBot"
              onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
            />
            <div className="glass-fallback" style={{ display: "none" }}>
              <div className="big"><i className="fa-solid fa-mobile-screen-button"></i></div>
              <h2>Daftar 30 detik</h2>
              <p>Cukup nomor WhatsApp, username, dan password.</p>
            </div>
          </div>
          <div className="float-badge fb-1"><i className="fa-solid fa-bolt"></i></div>
          <div className="float-badge fb-2"><span className="dot" /> Pendaftaran Gratis</div>
          <div className="right-caption">
            <b>Satu akun untuk semua layanan</b>
            Nomor WhatsApp-mu aman tersimpan di database.
          </div>
        </div>
      </div>
    </div>
  );
}
