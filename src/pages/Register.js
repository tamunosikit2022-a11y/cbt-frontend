import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [form,    setForm]    = useState({ full_name: "", email: "", phone: "", password: "", confirm: "" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass,setShowPass]= useState(false);

  const handle = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async () => {
    if (!form.full_name.trim()) return setError("Full name is required.");
    if (!form.email.trim())     return setError("Email address is required.");
    if (!form.phone.trim())     return setError("Phone number is required (used for password reset).");
    if (!form.password)         return setError("Password is required.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirm) return setError("Passwords do not match.");

    // Basic Nigerian phone validation
    const phoneOk = /^(0|\+234)[789][01]\d{8}$/.test(form.phone.replace(/\s/g, ""));
    if (!phoneOk) return setError("Enter a valid Nigerian phone number (e.g. 08012345678).");

    setError(""); setLoading(true);
    try {
      await register({
        full_name: form.full_name.trim(),
        email:     form.email.trim(),
        phone:     form.phone.trim(),
        password:  form.password,
      });
      nav("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>🎓</div>
        <h2 style={s.title}>Create your account</h2>
        <p style={s.sub}>Free to join — start practising today</p>

        <label style={s.label}>Full Name</label>
        <input style={s.input} placeholder="John Doe"
          value={form.full_name} onChange={handle("full_name")} />

        <label style={s.label}>Email Address</label>
        <input style={s.input} type="email" placeholder="your@email.com"
          value={form.email} onChange={handle("email")} />

        <label style={s.label}>
          Phone Number
          <span style={{ fontSize: 11, color: "#636e72", fontWeight: 400, marginLeft: 6 }}>
            (required for password reset)
          </span>
        </label>
        <input style={s.input} type="tel" placeholder="08012345678"
          value={form.phone} onChange={handle("phone")} />

        <label style={s.label}>Password</label>
        <div style={{ position: "relative" }}>
          <input style={{ ...s.input, paddingRight: 44 }}
            type={showPass ? "text" : "password"}
            placeholder="Min. 6 characters"
            value={form.password} onChange={handle("password")} />
          <button style={s.eyeBtn} onClick={() => setShowPass(p => !p)} tabIndex={-1}>
            {showPass ? "🙈" : "👁️"}
          </button>
        </div>

        <label style={s.label}>Confirm Password</label>
        <input style={s.input} type="password" placeholder="Repeat your password"
          value={form.confirm} onChange={handle("confirm")}
          onKeyDown={e => e.key === "Enter" && submit()} />

        {/* Password strength */}
        {form.password && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 2, transition: "all 0.3s",
                width: form.password.length >= 10 ? "100%" : form.password.length >= 8 ? "66%" : form.password.length >= 6 ? "33%" : "10%",
                background: form.password.length >= 10 ? "#00b894" : form.password.length >= 8 ? "#fdcb6e" : "#e17055" }} />
            </div>
          </div>
        )}

        {error && <p style={s.error}>⚠️ {error}</p>}

        <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
          onClick={submit} disabled={loading}>
          {loading ? "Creating account..." : "Create Free Account"}
        </button>

        <p style={s.foot}>
          Already registered? <Link to="/login" style={s.link}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:   { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6c63ff,#3f51b5)", padding: 16 },
  card:   { background: "#fff", borderRadius: 16, padding: "32px 28px", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" },
  logo:   { textAlign: "center", fontSize: 36, marginBottom: 6 },
  title:  { textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 4 },
  sub:    { textAlign: "center", color: "#636e72", marginBottom: 20, fontSize: 13 },
  label:  { display: "block", fontSize: 13, fontWeight: 600, color: "#2d3436", marginBottom: 5, marginTop: 12 },
  input:  { width: "100%", padding: "11px 14px", border: "2px solid #dfe6e9", borderRadius: 10, fontSize: 14, boxSizing: "border-box", outline: "none", marginBottom: 2 },
  eyeBtn: { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18 },
  btn:    { width: "100%", padding: 13, background: "linear-gradient(135deg,#6c63ff,#3f51b5)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer", marginTop: 12 },
  error:  { color: "#e17055", fontSize: 13, marginBottom: 10, background: "#ffeae9", padding: "8px 12px", borderRadius: 8 },
  foot:   { textAlign: "center", marginTop: 16, fontSize: 13, color: "#636e72" },
  link:   { color: "#6c63ff", fontWeight: 700, textDecoration: "none" },
};
