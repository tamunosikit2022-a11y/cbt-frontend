import { useState } from "react";
import { useNavigate, Link, useLocation, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const C = {
  bg:     "var(--bg)",
  purple: "var(--primary)",
  blue:   "#5B8CFF",
  gold:   "#FFC857",
  green:  "#00D084",
  red:    "#FF5A5F",
  text:   "#F1F5F9",
  muted:  "var(--text-muted)",
  border: "var(--surface)",
};

function pwStrength(pw) {
  if (!pw) return { pct: 0, color: "transparent", label: "" };
  if (pw.length >= 10 && /[A-Z]/.test(pw) && /\d/.test(pw))
    return { pct: 100, color: C.green, label: "Strong 💪" };
  if (pw.length >= 8)
    return { pct: 66, color: C.gold, label: "Good" };
  if (pw.length >= 6)
    return { pct: 33, color: "#FF9500", label: "Weak" };
  return { pct: 10, color: C.red, label: "Too short" };
}

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  // FIX BUG 1: declare refCode from URL search params
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || new URLSearchParams(location.search).get("ref") || "";

  const [welcomed, setWelcomed] = useState(false);
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    school_name: "",          // FIX BUG 20/31: collect school_name at registration
    password: "", confirm: ""
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass,setShowPass] = useState(false);
  const [focused, setFocused]  = useState("");

  const handle = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.full_name.trim())     return setError("Full name is required.");
    if (!form.email.trim())         return setError("Email address is required.");
    if (!form.phone.trim())         return setError("Phone number is required (used for password reset).");
    if (!form.password)             return setError("Password is required.");
    if (form.password.length < 6)   return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    const phoneOk = /^(0|\+234)[789][01]\d{8}$/.test(form.phone.replace(/\s/g, ""));
    if (!phoneOk)                   return setError("Enter a valid Nigerian phone (e.g. 08012345678).");
    setError(""); setLoading(true);
    try {
      await register({
        full_name:   form.full_name.trim(),
        email:       form.email.trim(),
        phone:       form.phone.trim(),
        school_name: form.school_name.trim() || undefined,   // FIX BUG 31
        password:    form.password,
        referred_by: refCode || undefined,                   // FIX BUG 1
      });
      setWelcomed(true);
      setTimeout(() => nav("/dashboard"), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  const inputStyle = (id) => ({
    width: "100%", padding: "13px 14px",
    background: focused === id ? "rgba(124,92,255,0.09)" : "var(--surface)",
    border: `1.5px solid ${focused === id ? C.purple : C.border}`,
    borderRadius: 12, fontSize: 15, color: C.text,
    boxSizing: "border-box", outline: "none",
    transition: "all 0.2s ease",
    fontFamily: "'Plus Jakarta Sans', sans-serif",
  });

  const pw = pwStrength(form.password);

  if (welcomed) {
    return (
      <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ textAlign:"center", maxWidth:360 }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎓</div>
          <h1 style={{ color:"#fff", fontSize:24, fontWeight:900, marginBottom:8 }}>Welcome to Scholars Syndicate!</h1>
          <p style={{ color:"var(--text-muted)", fontSize:14, marginBottom:24, lineHeight:1.7 }}>
            Your account is ready. You're on the <strong style={{ color:"#a29bfe" }}>free plan</strong> — start practising now.
          </p>
          <div style={{ background:"rgba(108,99,255,0.15)", border:"1.5px solid #6c63ff44", borderRadius:14, padding:"14px 16px", marginBottom:20 }}>
            <div style={{ fontWeight:800, fontSize:13, color:"#a29bfe", marginBottom:6 }}>💡 Tip: Unlock full access from ₦100</div>
            <div style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.6 }}>
              Premium gives you full explanations, AI weakness mode, Arena hosting, predicted JAMB score, and 2× XP on every exam.
            </div>
          </div>
          <div style={{ color:"var(--text-muted)", fontSize:12 }}>Taking you to your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: C.bg, padding: "20px 20px 40px",
      fontFamily: "'Plus Jakarta Sans', sans-serif", position: "relative", overflow: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes blob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-16px)} }
        @keyframes reg-in { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        ::placeholder { color: rgba(255,255,255,0.50) !important; }
      `}</style>

      <div style={{ position:"absolute", top:-70, right:-70, width:260, height:260, borderRadius:"50%", background:`${C.purple}13`, filter:"blur(60px)", animation:"blob 7s ease-in-out infinite" }} />
      <div style={{ position:"absolute", bottom:-50, left:-50, width:220, height:220, borderRadius:"50%", background:`${C.blue}10`, filter:"blur(50px)", animation:"blob 9s ease-in-out infinite reverse" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1, animation: "reg-in .4s ease" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg,${C.purple},${C.blue})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, margin: "0 auto 12px", boxShadow: `0 8px 32px ${C.purple}55` }}>🎓</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text }}>Create your account</h1>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: C.muted }}>Free to join — start practising today</p>
        </div>

        {/* Referral welcome banner */}
        {refCode && (
          <div style={{ background:"linear-gradient(135deg,#6c63ff22,#a29bfe11)", border:"1.5px solid #6c63ff55", borderRadius:14, padding:"12px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:22 }}>🎁</span>
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:"#a29bfe" }}>You were invited!</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>Your friend gets bonus Premium days when you join. Welcome to Scholars Syndicate.</div>
            </div>
          </div>
        )}

        <div style={{ background: "var(--surface)", border: `1px solid ${C.border}`, borderRadius: 24, padding: "24px 22px", backdropFilter: "blur(20px)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
          {error && (
            <div style={{ background: "rgba(255,90,95,0.12)", border: `1px solid ${C.red}44`, borderRadius: 12, padding: "11px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚠️</span><span style={{ fontSize: 13, color: "#FF8A8F" }}>{error}</span>
            </div>
          )}

          {[
            { key: "full_name",   label: "Full Name",      type: "text",  placeholder: "John Doe" },
            { key: "email",       label: "Email Address",  type: "email", placeholder: "your@email.com" },
            { key: "phone",       label: "Phone Number",   type: "tel",   placeholder: "08012345678", hint: "For password reset" },
            { key: "school_name", label: "School Name",    type: "text",  placeholder: "e.g. Federal Govt College Lagos", hint: "Optional — for Factions" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>
                {f.label}{f.hint && <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, marginLeft: 6 }}>· {f.hint}</span>}
              </label>
              <input style={inputStyle(f.key)} type={f.type} placeholder={f.placeholder}
                value={form[f.key]} onChange={handle(f.key)}
                onFocus={() => setFocused(f.key)} onBlur={() => setFocused("")} />
            </div>
          ))}

          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>Password</label>
          <div style={{ position: "relative", marginBottom: 6 }}>
            <input style={{ ...inputStyle("pw"), paddingRight: 48 }}
              type={showPass ? "text" : "password"} placeholder="Min. 6 characters"
              value={form.password} onChange={handle("password")}
              onFocus={() => setFocused("pw")} onBlur={() => setFocused("")} />
            <button onClick={() => setShowPass(p => !p)} tabIndex={-1}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.muted, padding: 4 }}>
              {showPass ? "🙈" : "👁️"}
            </button>
          </div>
          {form.password && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ height: 4, background: "var(--surface)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pw.pct}%`, background: pw.color, borderRadius: 2, transition: "all .3s" }} />
              </div>
              <div style={{ fontSize: 11, color: pw.color, marginTop: 4, fontWeight: 700 }}>{pw.label}</div>
            </div>
          )}

          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6, letterSpacing: 0.5, textTransform: "uppercase" }}>Confirm Password</label>
          <input style={{ ...inputStyle("cf"), marginBottom: 22 }}
            type="password" placeholder="Repeat your password"
            value={form.confirm} onChange={handle("confirm")}
            onFocus={() => setFocused("cf")} onBlur={() => setFocused("")}
            onKeyDown={e => e.key === "Enter" && submit()} />

          <button onClick={submit} disabled={loading} style={{
            width: "100%", padding: "14px 0",
            background: loading ? "rgba(124,92,255,0.5)" : `linear-gradient(135deg,${C.purple},${C.blue})`,
            color: "#fff", border: "none", borderRadius: 14,
            fontWeight: 900, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
            boxShadow: loading ? "none" : `0 4px 20px ${C.purple}55`,
            transition: "all 0.2s ease", fontFamily: "'Plus Jakarta Sans', sans-serif",
          }}>
            {loading ? "Creating account…" : "Create Free Account 🎓"}
          </button>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 14, color: C.muted }}>
            Already have an account?{" "}
            <Link to="/login" style={{ color: C.purple, fontWeight: 700, textDecoration: "none" }}>Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
