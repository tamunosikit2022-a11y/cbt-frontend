import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  const handleSubmit = async () => {
    if (!identifier.trim() || !password)
      return setError("Please enter your email/phone and password.");
    setError(""); setLoading(true);
    try {
      await login({ identifier, password });
      nav("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🎓</div>
        <h2 style={s.title}>Welcome Back!</h2>
        <p style={s.sub}>Login to continue practising</p>

        <label style={s.label}>Email or Phone Number</label>
        <input style={s.input}
          placeholder="your@email.com or 08012345678"
          value={identifier}
          onChange={e => setIdentifier(e.target.value)}
          autoCapitalize="none"
          autoCorrect="off" />

        <label style={s.label}>Password</label>
        <div style={{ position: "relative" }}>
          <input style={{ ...s.input, paddingRight: 44 }}
            type={showPass ? "text" : "password"}
            placeholder="Your password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()} />
          <button style={s.eyeBtn} onClick={() => setShowPass(!showPass)} tabIndex={-1}>
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>

        <div style={{ textAlign: "right", marginTop: 6, marginBottom: 14 }}>
          <Link to="/forgot-password" style={s.forgotLink}>Forgot password?</Link>
        </div>

        {error && <p style={s.error}>⚠️ {error}</p>}

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleSubmit} disabled={loading}>
          {loading ? "Logging in..." : "Login →"}
        </button>

        <p style={s.foot}>
          New student? <Link to="/register" style={s.link}>Create free account</Link>
        </p>

        <div style={s.helpBox}>
          <p style={{ margin: 0, fontSize: 12, color: "#636e72" }}>
            Need help? Contact admin on WhatsApp:
            <a href="https://wa.me/2349036995642" target="_blank" rel="noreferrer"
              style={{ color: "#25D366", fontWeight: 700, marginLeft: 4 }}>
              09036995642
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(135deg,#6c63ff,#3f51b5)", padding:16 },
  card:       { background:"#fff", borderRadius:16, padding:"36px 32px", width:"100%", maxWidth:420, boxShadow:"0 8px 40px rgba(0,0,0,0.2)" },
  logo:       { textAlign:"center", fontSize:36, marginBottom:6 },
  title:      { textAlign:"center", fontSize:22, fontWeight:800, marginBottom:4 },
  sub:        { textAlign:"center", color:"#636e72", marginBottom:24, fontSize:13 },
  label:      { display:"block", fontSize:13, fontWeight:600, color:"#2d3436", marginBottom:4, marginTop:14 },
  input:      { width:"100%", padding:"11px 14px", border:"2px solid #dfe6e9", borderRadius:10, fontSize:14, boxSizing:"border-box", outline:"none" },
  eyeBtn:     { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:18 },
  forgotLink: { color:"#6c63ff", fontSize:13, fontWeight:600, textDecoration:"none" },
  error:      { color:"#e17055", fontSize:13, marginBottom:10, background:"#ffeae9", padding:"8px 12px", borderRadius:8 },
  btn:        { width:"100%", padding:13, background:"linear-gradient(135deg,#6c63ff,#3f51b5)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:15, cursor:"pointer" },
  foot:       { textAlign:"center", marginTop:16, fontSize:13, color:"#636e72" },
  link:       { color:"#6c63ff", fontWeight:700, textDecoration:"none" },
  helpBox:    { marginTop:16, background:"#f8f9fa", borderRadius:8, padding:"10px 12px", textAlign:"center" },
};
