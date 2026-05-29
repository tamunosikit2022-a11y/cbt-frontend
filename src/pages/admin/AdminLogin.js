import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api"; // FIX BUG 13: added fallback

export default function AdminLogin() {
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return setError("Enter username and password.");
    setError(""); setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || "Login failed.");
      localStorage.setItem("admin_token", data.token);
      nav("/admin");
    } catch {
      setError("Connection failed. Check your internet.");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🔐</div>
        <h2 style={s.title}>Admin Login</h2>
        <p style={s.sub}>Scholars Syndicate CBT — Admin Panel</p>

        <label style={s.label}>Username</label>
        <input style={s.input} placeholder="Admin username"
          value={username} onChange={e => setUsername(e.target.value)} />

        <label style={s.label}>Password</label>
        <input style={s.input} type="password" placeholder="Admin password"
          value={password} onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleLogin()} />

        {error && <p style={s.error}>⚠️ {error}</p>}

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login →"}
        </button>
      </div>
    </div>
  );
}

const s = {
  page:  { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0f0f1a", fontFamily:"sans-serif" },
  card:  { background:"#1a1a2e", borderRadius:16, padding:"36px 32px", width:"100%", maxWidth:400, border:"1px solid #2d2d44" },
  logo:  { textAlign:"center", fontSize:40, marginBottom:8 },
  title: { textAlign:"center", fontSize:22, fontWeight:800, color:"#fff", marginBottom:4 },
  sub:   { textAlign:"center", color:"#636e72", fontSize:13, marginBottom:24 },
  label: { display:"block", fontSize:13, fontWeight:600, color:"#a29bfe", marginBottom:6, marginTop:14 },
  input: { width:"100%", padding:"11px 14px", background:"#0f0f1a", border:"1px solid #2d2d44", borderRadius:8, fontSize:14, color:"#fff", boxSizing:"border-box" },
  error: { color:"#e17055", fontSize:13, marginTop:8, background:"#2d1a1a", padding:"8px 12px", borderRadius:8 },
  btn:   { width:"100%", padding:13, background:"linear-gradient(135deg,#6c63ff,#3f51b5)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:15, cursor:"pointer", marginTop:16 },
};
