"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  // login form
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState({ type: "", text: "" });
  // data
  const [users, setUsers] = useState([]);
  const [continuations, setContinuations] = useState([]);
  const [botNumber, setBotNumber] = useState("");
  const [newBot, setNewBot] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  function token() { return localStorage.getItem("jojo_token"); }

  async function loadData() {
    const t = token();
    if (!t) return;
    const res = await fetch("/api/users", { headers: { Authorization: `Bearer ${t}` } });
    if (res.status === 403) { setAuthed(false); setChecking(false); return; }
    const data = await res.json();
    if (res.ok) {
      setUsers(data.users || []);
      setContinuations(data.continuations || []);
      setBotNumber(data.bot_number || "");
      setNewBot(data.bot_number || "");
      setAuthed(true);
    }
    setChecking(false);
  }

  useEffect(() => {
    (async () => {
      const t = localStorage.getItem("jojo_token");
      if (!t) { setChecking(false); return; }
      await loadData();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoginMsg({ type: "", text: "" });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok || data.user?.role !== "admin") {
        setLoginMsg({ type: "error", text: data.message || "Login admin gagal." });
        return;
      }
      localStorage.setItem("jojo_token", data.token);
      localStorage.setItem("jojo_user", JSON.stringify(data.user));
      await loadData();
    } catch {
      setLoginMsg({ type: "error", text: "Tidak dapat terhubung ke server." });
    }
  }

  async function saveBot(e) {
    e.preventDefault();
    setMsg({ type: "", text: "" });
    const res = await fetch("/api/bot-number", {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
      body: JSON.stringify({ bot_number: newBot }),
    });
    const data = await res.json();
    if (!res.ok) { setMsg({ type: "error", text: data.message }); return; }
    setBotNumber(data.bot_number);
    setMsg({ type: "success", text: data.message });
  }

  async function delUser(id) {
    if (!confirm("Hapus user ini?")) return;
    const res = await fetch(`/api/users?id=${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token()}` },
    });
    const data = await res.json();
    if (!res.ok) { setMsg({ type: "error", text: data.message }); return; }
    setMsg({ type: "success", text: data.message });
    loadData();
  }

  function logout() {
    localStorage.clear();
    fetch("/api/auth/me", { method: "POST" });
    router.push("/");
  }

  if (checking) return <div className="page"><div className="wrap"><div className="cardbox">Memeriksa sesi admin...</div></div></div>;

  if (!authed) {
    return (
      <div className="stage">
        <div className="blob-purple" />
        <div className="blob-white" />
        <div className="card">
          <div className="panel-left">
            <div className="brand"><div className="brand-badge"><i className="fa-solid fa-robot"></i></div><div className="brand-name">Jojo<span>Bot</span> Admin</div></div>
            <h1 className="title">ADMIN</h1>
            <p className="subtitle">Masuk sebagai admin untuk kelola nomor bot & users.</p>
            {loginMsg.text && <div className={`alert ${loginMsg.type}`}>{loginMsg.text}</div>}
            <form onSubmit={handleLogin}>
              <div className="field"><span className="icon"><i className="fa-solid fa-user"></i></span><input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username admin" /></div>
              <div className="field"><span className="icon"><i className="fa-solid fa-lock"></i></span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password admin" /></div>
              <button className="btn-primary"><i className="fa-solid fa-right-to-bracket"></i> Login Admin</button>
            </form>
            <p className="switch"><a href="/"><i className="fa-solid fa-arrow-left"></i> Kembali ke login user</a></p>
          </div>
          <div className="panel-right">
            <div className="glass"><div className="glass-fallback" style={{ display: "flex" }}><div className="big"><i className="fa-solid fa-screwdriver-wrench"></i></div><h2>Panel Admin</h2><p>Kelola nomor WhatsApp bot & data lanjutan.</p></div></div>
            <div className="float-badge fb-1"><i className="fa-solid fa-bolt"></i></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="wrap">
        <div className="topbar">
          <div className="row">
            <div className="brand-badge"><i className="fa-solid fa-robot"></i></div>
            <div><div style={{ fontWeight: 800 }}>Panel Admin JojoBot</div><div className="muted">Login sebagai <span className="pill">admin</span></div></div>
          </div>
          <div className="row">
            <button className="btn-ghost" onClick={() => router.push("/dashboard")}><i className="fa-solid fa-table-columns"></i> Dashboard User</button>
            <button className="btn-ghost" onClick={logout}><i className="fa-solid fa-right-from-bracket"></i> Logout</button>
          </div>
        </div>

        {msg.text && <div className={`alert ${msg.type}`} style={{ background: "#fff" }}>{msg.text}</div>}

        <div className="grid2">
          <div className="cardbox">
            <h3><i className="fa-brands fa-whatsapp"></i> Nomor WhatsApp Bot</h3>
            <p className="muted">Nomor ini dipakai tombol “Lanjutkan di JojoBot” (wa.me). Saat ini: <span className="code">+{botNumber}</span></p>
            <form onSubmit={saveBot} style={{ marginTop: 12 }}>
              <div className="row">
                <input className="input" value={newBot} onChange={(e) => setNewBot(e.target.value)} placeholder="cth: 081234567890" style={{ flex: 1 }} />
                <button className="btn-primary" style={{ margin: 0 }}><i className="fa-solid fa-floppy-disk"></i> Simpan</button>
              </div>
            </form>
          </div>
          <div className="cardbox">
            <h3><i className="fa-solid fa-chart-simple"></i> Statistik</h3>
            <p className="muted">Total user terdaftar & total klik lanjutkan.</p>
            <div className="row" style={{ marginTop: 12 }}>
              <div className="pill"><i className="fa-solid fa-users"></i> {users.length} users</div>
              <div className="pill"><i className="fa-solid fa-rocket"></i> {continuations.length} lanjutan</div>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="btn-ghost" onClick={loadData}><i className="fa-solid fa-rotate-right"></i> Refresh data</button>
            </div>
          </div>
        </div>

        <div className="cardbox" style={{ marginTop: 20 }}>
          <h3><i className="fa-solid fa-users"></i> Data Users (CRUD)</h3>
          <p className="muted">Register menambah data ke sini. Admin bisa menghapus.</p>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Username</th><th>WhatsApp</th><th>Email / Login</th><th>Dibuat</th><th>Aksi</th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td><b>{u.username}</b></td>
                    <td>{u.whatsapp ? <span className="code">+{u.whatsapp}</span> : <span className="muted">-</span>}</td>
                    <td>{u.email ? <span className="pill"><i className="fa-brands fa-google"></i> {u.email}</span> : <span className="muted">manual</span>}</td>
                    <td className="muted">{u.created_at ? new Date(u.created_at).toLocaleString("id-ID") : "-"}</td>
                    <td><button className="btn-danger" onClick={() => delUser(u.id)}><i className="fa-solid fa-trash"></i> Hapus</button></td>
                  </tr>
                ))}
                {users.length === 0 && <tr><td colSpan={5} className="muted">Belum ada user.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cardbox" style={{ marginTop: 20 }}>
          <h3><i className="fa-solid fa-rocket"></i> Log “Lanjutkan di JojoBot”</h3>
          <p className="muted">Setiap klik tombol Lanjutkan tersimpan: nomor user + nomor bot tujuan + waktu.</p>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl">
              <thead><tr><th>Waktu</th><th>Username</th><th>WA User</th><th>Bot Tujuan</th></tr></thead>
              <tbody>
                {[...continuations].reverse().map((c) => (
                  <tr key={c.id}>
                    <td className="muted">{c.continued_at ? new Date(c.continued_at).toLocaleString("id-ID") : "-"}</td>
                    <td><b>{c.username}</b></td>
                    <td><span className="code">+{c.whatsapp}</span></td>
                    <td><span className="code">+{c.bot_number}</span></td>
                  </tr>
                ))}
                {continuations.length === 0 && <tr><td colSpan={4} className="muted">Belum ada yang klik lanjutkan.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <p className="footer-note">Database: JVault • Bin <span className="code">255feaaa...</span></p>
      </div>
    </div>
  );
}
