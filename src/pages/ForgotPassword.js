import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../utils/api";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step,    setStep]    = useState(1);
  const [email,   setEmail]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass,setShowPass]= useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [masked,  setMasked]  = useState("");

  // STEP 1 — Send OTP to email
  const handleRequestOtp = async () => {
    if (!email.trim()) return setError("Enter your registered email address.");
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) return setError("Enter a valid email address.");
    setError(""); setLoading(true);
    try {
      const res = await API.post("/auth/forgot-password", { email: email.trim() });
      setMasked(res.data.masked_email || email);
      setSuccess(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };

  // STEP 2 — Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return setError("Enter the full 6-digit code from your email.");
    setError(""); setLoading(true);
    try {
      await API.post("/auth/verify-otp", { email: email.trim(), otp: otp.trim() });
      setSuccess("");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired code. Request a new one.");
    } finally { setLoading(false); }
  };

  // Resend OTP
  const handleResend = async () => {
    setOtp(""); setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await API.post("/auth/forgot-password", { email: email.trim() });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend. Try again.");
    } finally { setLoading(false); }
  };

  // STEP 3 — Reset password
  const handleReset = async () => {
    if (!newPass || newPass.length < 6) return setError("Password must be at least 6 characters.");
    if (newPass !== confirm) return setError("Passwords do not match.");
    setError(""); setLoading(true);
    try {
      await API.post("/auth/reset-password", { email: email.trim(), otp: otp.trim(), new_password: newPass });
      setSuccess("Password changed! Redirecting to login...");
      setTimeout(() => nav("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to reset password. Try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.logo}>🎓</div>
          <h2 style={s.title}>Reset Password</h2>
          <p style={s.sub}>Scholars CBT — Account Recovery</p>
        </div>

        {/* Step indicator */}
        <div style={s.steps}>
          {["Email", "Verify Code", "New Password"].map((label, i) => (
            <div key={i} style={s.stepRow}>
              <div style={{ ...s.stepDot, background: step > i + 1 ? "#00b894" : step === i + 1 ? "#6c63ff" : "#dfe6e9", color: step >= i + 1 ? "#fff" : "#b2bec3" }}>
                {step > i + 1 ? "✓" : i + 1}
              </div>
              <span style={{ ...s.stepLabel, color: step === i + 1 ? "#6c63ff" : "#b2bec3", fontWeight: step === i + 1 ? 700 : 400 }}>{label}</span>
              {i < 2 && <div style={{ ...s.stepLine, background: step > i + 1 ? "#00b894" : "#dfe6e9" }} />}
            </div>
          ))}
        </div>

        {/* ── STEP 1 — Email ── */}
        {step === 1 && (
          <>
            <div style={s.infoBox}>
              <span style={{ fontSize:20 }}>📧</span>
              <span style={{ fontSize:13, color:"#636e72" }}>Enter the email address linked to your account. We'll send a 6-digit code.</span>
            </div>
            <label style={s.label}>Email Address</label>
            <input
              style={s.input}
              type="email"
              placeholder="yourname@gmail.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRequestOtp()}
              autoComplete="email"
            />
            {error   && <p style={s.error}>⚠️ {error}</p>}
            {success && <p style={s.successMsg}>✅ {success}</p>}
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }} onClick={handleRequestOtp} disabled={loading}>
              {loading ? "Sending..." : "Send Code →"}
            </button>
          </>
        )}

        {/* ── STEP 2 — OTP ── */}
        {step === 2 && (
          <>
            <div style={s.infoBox}>
              <span style={{ fontSize:20 }}>📬</span>
              <span style={{ fontSize:13, color:"#636e72" }}>
                We sent a 6-digit code to <strong>{masked}</strong>. Check your inbox and spam folder.
              </span>
            </div>
            <label style={s.label}>6-Digit Code</label>
            <input
              style={{ ...s.input, fontSize:28, letterSpacing:12, textAlign:"center", fontWeight:900 }}
              type="number"
              placeholder="000000"
              value={otp}
              maxLength={6}
              onChange={e => setOtp(e.target.value.slice(0,6))}
              onKeyDown={e => e.key === "Enter" && handleVerifyOtp()}
              autoComplete="one-time-code"
            />
            <div style={{ fontSize:12, color: otp.length === 6 ? "#00b894" : "#b2bec3", textAlign:"center", marginBottom:8, fontWeight:600 }}>
              {otp.length}/6 digits {otp.length === 6 ? "✓ Ready" : ""}
            </div>
            {error   && <p style={s.error}>⚠️ {error}</p>}
            {success && <p style={s.successMsg}>✅ {success}</p>}
            <button style={{ ...s.btn, opacity: loading || otp.length !== 6 ? 0.7 : 1 }} onClick={handleVerifyOtp} disabled={loading || otp.length !== 6}>
              {loading ? "Verifying..." : "Verify Code →"}
            </button>
            <div style={s.resendRow}>
              <span style={{ color:"#636e72", fontSize:13 }}>Didn't get it? </span>
              <button style={s.resendBtn} onClick={handleResend} disabled={loading}>
                Resend code
              </button>
            </div>
            <button style={s.backBtn} onClick={() => { setStep(1); setOtp(""); setError(""); }}>
              ← Change email
            </button>
          </>
        )}

        {/* ── STEP 3 — New Password ── */}
        {step === 3 && (
          <>
            <div style={s.infoBox}>
              <span style={{ fontSize:20 }}>🔐</span>
              <span style={{ fontSize:13, color:"#636e72" }}>Code verified! Choose a strong new password for your account.</span>
            </div>
            <label style={s.label}>New Password</label>
            <div style={{ position:"relative", marginBottom:14 }}>
              <input
                style={{ ...s.input, marginBottom:0, paddingRight:50 }}
                type={showPass ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={newPass}
                onChange={e => setNewPass(e.target.value)}
              />
              <button style={s.eyeBtn} onClick={() => setShowPass(!showPass)}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            <label style={s.label}>Confirm Password</label>
            <input
              style={s.input}
              type={showPass ? "text" : "password"}
              placeholder="Repeat your new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleReset()}
            />
            {newPass && confirm && (
              <div style={{ fontSize:12, marginBottom:8, fontWeight:600, color: newPass === confirm ? "#00b894" : "#e17055" }}>
                {newPass === confirm ? "✓ Passwords match" : "✗ Passwords don't match"}
              </div>
            )}
            {error   && <p style={s.error}>⚠️ {error}</p>}
            {success && <p style={s.successMsg}>✅ {success}</p>}
            <button
              style={{ ...s.btn, opacity: loading || newPass !== confirm || newPass.length < 6 ? 0.7 : 1 }}
              onClick={handleReset}
              disabled={loading || newPass !== confirm || newPass.length < 6}>
              {loading ? "Saving..." : "Save New Password ✓"}
            </button>
          </>
        )}

        <div style={s.footer}>
          <Link to="/login" style={{ color:"#6c63ff", fontWeight:700, fontSize:13, textDecoration:"none" }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight:"100vh", background:"linear-gradient(135deg,#1a1a2e,#6c63ff)", display:"flex", alignItems:"center", justifyContent:"center", padding:16, fontFamily:"'Segoe UI',sans-serif" },
  card:       { background:"#fff", borderRadius:20, padding:"28px 24px", width:"100%", maxWidth:420, boxShadow:"0 20px 60px rgba(0,0,0,0.3)" },
  header:     { textAlign:"center", marginBottom:24 },
  logo:       { fontSize:44, marginBottom:8 },
  title:      { fontSize:22, fontWeight:900, color:"#2d3436", margin:"0 0 4px" },
  sub:        { fontSize:13, color:"#636e72", margin:0 },
  steps:      { display:"flex", alignItems:"center", justifyContent:"center", marginBottom:24, gap:0 },
  stepRow:    { display:"flex", alignItems:"center", gap:4 },
  stepDot:    { width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:800, flexShrink:0 },
  stepLabel:  { fontSize:11, whiteSpace:"nowrap" },
  stepLine:   { width:24, height:2, margin:"0 2px", flexShrink:0 },
  infoBox:    { background:"#f0edff", borderRadius:10, padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start", marginBottom:18, lineHeight:1.5 },
  label:      { display:"block", fontWeight:700, fontSize:13, color:"#2d3436", marginBottom:6 },
  input:      { width:"100%", padding:"13px 14px", border:"2px solid #dfe6e9", borderRadius:10, fontSize:15, color:"#2d3436", boxSizing:"border-box", marginBottom:14, outline:"none", fontFamily:"inherit" },
  btn:        { width:"100%", padding:14, background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:12 },
  error:      { color:"#e17055", fontSize:13, margin:"0 0 12px", background:"#fff5f4", padding:"10px 14px", borderRadius:8, border:"1px solid #fab1a0" },
  successMsg: { color:"#00b894", fontSize:13, fontWeight:700, margin:"0 0 12px", background:"#f0fff8", padding:"10px 14px", borderRadius:8 },
  resendRow:  { display:"flex", alignItems:"center", justifyContent:"center", gap:4, marginBottom:10 },
  resendBtn:  { background:"none", border:"none", color:"#6c63ff", fontWeight:700, fontSize:13, cursor:"pointer", textDecoration:"underline" },
  backBtn:    { width:"100%", padding:10, background:"none", border:"2px solid #dfe6e9", borderRadius:10, color:"#636e72", fontWeight:600, fontSize:13, cursor:"pointer", marginBottom:8 },
  eyeBtn:     { position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", fontSize:18 },
  footer:     { textAlign:"center", marginTop:16, paddingTop:16, borderTop:"1px solid #f0f0f0" },
};
