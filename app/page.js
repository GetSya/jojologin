"use client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginInner() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Menampilkan error dari callback Google (?error=...) tanpa membuat halaman dinamis
  function GoogleErrorNote() {
    const params = useSearchParams();
    useEffect(() => {
      const err = params.get("error");
      if (err) setMsg({ type: "error", text: err });
    }, [params]);
    return null;
  }

  async function handleLogin(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    if (!username.trim() || !password) {
      setMsg({ type: "error", text: "Username dan password wajib diisi." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.message || "Login gagal." });
        return;
      }
      localStorage.setItem("jojo_token", data.token);
      localStorage.setItem("jojo_user", JSON.stringify(data.user));
      setMsg({ type: "success", text: data.message || "Login berhasil." });
      setTimeout(() => {
        if (data.user?.role === "admin") router.push("/admin");
        else router.push("/dashboard");
      }, 600);
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
        {/* KIRI */}
        <div className="panel-left">
          <div className="brand">
            <div className="brand-badge"><i className="fa-solid fa-robot"></i></div>
            <div className="brand-name">Jojo<span>Bot</span></div>
          </div>
          <h1 className="title">LOGIN</h1>
          <p className="subtitle">Selamat datang kembali! Masuk untuk lanjut ke JojoBot.</p>

          <Suspense fallback={null}><GoogleErrorNote /></Suspense>
          {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}

          <form onSubmit={handleLogin}>
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
                autoComplete="current-password"
              />
              <button type="button" className="toggle" onClick={() => setShow(!show)} aria-label="Tampilkan password">
                <i className={show ? "fa-solid fa-eye-slash" : "fa-solid fa-eye"}></i>
              </button>
            </div>
            <button className="btn-primary" disabled={loading}>
              {loading ? "Memproses..." : "Login Now"}
            </button>
          </form>

          <div className="divider"><b>Login</b> with Others</div>
          <div className="oauth">
            <a className="oauth-btn" href="/api/auth/google">
              <i className="fa-brands fa-google"></i>
              Login with <b>google</b>
            </a>
          </div>

          <p className="switch">
            Belum punya akun? <Link href="/register">Register di sini</Link>
            <br />
            <span style={{ fontSize: 12.5 }}>Admin? Login dengan username <span className="code">admin</span> <i className="fa-solid fa-arrow-right" style={{ fontSize: 11 }}></i> otomatis ke panel admin.</span>
          </p>
        </div>

        {/* KANAN */}
        <div className="panel-right">
          <div className="glass">
            <img
              src="https://files.catbox.moe/82mp6k.jpg"
              alt="JojoBot"
              onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
            />
            <div className="glass-fallback" style={{ display: "none" }}>
              <div className="big"><i className="fa-brands fa-whatsapp"></i></div>
              <h2>JojoBot WhatsApp</h2>
              <p>Login sekali, lanjutkan chat otomatis di WhatsApp.</p>
            </div>
          </div>
          <div className="float-badge fb-1"><i className="fa-solid fa-bolt"></i></div>
          <div className="float-badge fb-2"><span className="dot" /> JojoBot Online</div>
          <div className="right-caption">
            <b>Chat lebih cepat dengan JojoBot</b>
            Hubungkan akunmu ke WhatsApp dalam satu klik.
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginInner />;
}
