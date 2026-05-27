import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const C = {
  bg:     "#0B1020",
  purple: "#7C5CFF",
  blue:   "#5B8CFF",
  gold:   "#FFC857",
  green:  "#00D084",
  red:    "#FF5A5F",
  text:   "#F1F5F9",
  muted:  "rgba(255,255,255,0.45)",
  border: "rgba(255,255,255,0.09)",
};

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [focused,    setFocused]    = useState("");

  const handleSubmit = async () => {
    if (!identifier.trim() || !password)
      return setError("Please enter your email/phone and password.");
    setError(""); setLoading(true);
    try {
      await login({ identifier, password });
      nav("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check your credentials.");
    } finally { setLoading(false); }
  };

  const inputStyle = (id) => ({
    width: "100%", padding: "13px 14px",
    background: focused === id ? "rgba(124,92,255,0.09)" : "rgba(255,255,255,0.04)",
    border: `1.5px solid ${focused === id ? C.purple : C.border}`,
    borderRadius: 12, fontSize: 15, color: C.text,
    boxSizing: "border-box", outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  });

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: C.bg, padding: 20,
      fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes blob { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.04)} }
        @keyframes login-in { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        ::placeholder { color: rgba(255,255,255,0.22) !important; }
      `}</style>

      {/* Background blobs */}
      <div style={{ position:"absolute", top:-80, left:-80, width:280, height:280, borderRadius:"50%", background:`${C.purple}14`, filter:"blur(60px)", animation:"blob 7s ease-in-out infinite" }} />
      <div style={{ position:"absolute", bottom:-60, right:-60, width:240, height:240, borderRadius:"50%", background:`${C.blue}11`, filter:"blur(50px)", animation:"blob 9s ease-in-out infinite reverse" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, animation: "login-in .4s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: `linear-gradient(135deg,${C.purple},${C.blue})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 30, margin: "0 auto 14px", boxShadow: `0 8px 32px ${C.purple}55`,
          }}>🎓</div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: C.text }}>Welcome Back!</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>Login to continue practising</p>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`,
          borderRadius: 24, padding: "26px 22px",
          backdropFilter: "blur(20px)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
        }}>
          {error && (
            <div style={{
              background: "rgba(255,90,95,0.12)", border: `1px solid ${C.red}44`,
              borderRadius: 12, padding: "11px 14px", marginBottom: 16,
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <span>⚠️</span>
              <span style={{ fontSize: 13, color: "#FF8A8F" }}>{error}</span>
            </div>
          )}

          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>
            Email or Phone Number
          </label>
          <input
            style={inputStyle("id")} value={identifier}
            onChange={e => setIdentifier(e.target.value)}
            onFocus={() => setFocused("id")} onBlur={() => setFocused("")}
            placeholder="your@email.com or 08012345678"
            autoCapitalize="none" autoCorrect="off"
          />

          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, margin: "18px 0 6px", letterSpacing: 0.5, textTransform: "uppercase" }}>
            Password
          </label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inputStyle("pw"), paddingRight: 48 }}
              type={showPass ? "text" : "password"} value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused("pw")} onBlur={() => setFocused("")}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Your password"
            />
            <button onClick={() => setShowPass(!showPass)} tabIndex={-1} style={{
              position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
              background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: 4,
            }}>{showPass ? "🙈" : "👁️"}</button>
          </div>

          <div style={{ textAlign: "right", marginTop: 10, marginBottom: 20 }}>
            <Link to="/forgot-password" style={{ color: C.purple, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>

          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: "14px 0",
            background: loading ? "rgba(124,92,255,0.5)" : `linear-gradient(135deg,${C.purple},${C.blue})`,
            color: "#fff", border: "none", borderRadius: 14,
            fontWeight: 900, fontSize: 16,
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : `0 4px 20px ${C.purple}55`,
            transition: "all 0.2s ease", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {loading ? "Logging in…" : "Login →"}
          </button>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 14, color: C.muted }}>
            New student?{" "}
            <Link to="/register" style={{ color: C.purple, fontWeight: 700, textDecoration: "none" }}>
              Create free account
            </Link>
          </p>
        </div>

        {/* WhatsApp help */}
        <div style={{
          marginTop: 14, background: "rgba(37,211,102,0.07)",
          border: "1px solid rgba(37,211,102,0.18)", borderRadius: 12,
          padding: "12px 16px", textAlign: "center",
        }}>
          <p style={{ margin: 0, fontSize: 12, color: C.muted }}>
            Need help? WhatsApp admin:{" "}
            <a href="https://wa.me/2349036995642" target="_blank" rel="noreferrer"
              style={{ color: "#25D366", fontWeight: 700 }}>09036995642</a>
          </p>
        </div>
      </div>
    </div>
  );
}
