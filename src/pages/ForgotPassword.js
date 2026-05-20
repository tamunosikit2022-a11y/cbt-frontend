import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../utils/api";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step,     setStep]     = useState(1);
  const [email,    setEmail]    = useState("");
  const [otp,      setOtp]      = useState("");
  const [newPass,  setNewPass]  = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [masked,   setMasked]   = useState("");

  const maskEmail = (e) => e.replace(/(.{3})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.max(3, b.length)) + c);

  // STEP 1 — Send code to email
  const handleRequestCode = async () => {
    if (!email.trim()) return setError("Enter your registered email address.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return setError("Enter a valid email address.");
    setError(""); setLoading(true);
    try {
      const res = await API.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setMasked(res.data.masked_email || maskEmail(email.trim()));
      setSuccess(res.data.message || "Code sent!");
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send code. Try again.");
    } finally { setLoading(false); }
  };

  // STEP 2 — Verify code
  const handleVerifyCode = async () => {
    if (!otp || otp.length !== 6) return setError("Enter the full 6-digit code.");
    setError(""); setLoading(true);
    try {
      await API.post("/auth/verify-otp", { email: email.trim().toLowerCase(), otp: otp.trim() });
      setSuccess("");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired code. Request a new one.");
    } finally { setLoading(false); }
  };

  // Resend code
  const handleResend = async () => {
    setOtp(""); setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await API.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setSuccess(res.data.message || "A new code has been sent.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend code.");
    } finally { setLoading(false); }
  };

  // STEP 3 — Reset password
  const handleResetPassword = async () => {
    if (!newPass)           return setError("Enter a new password.");
    if (newPass.length < 6) return setError("Password must be at least 6 characters.");
    if (newPass !== confirm) return setError("Passwords do not match.");
    setError(""); setLoading(true);
    try {
      await API.post("/auth/reset-password", {
        email:        email.trim().toLowerCase(),
        otp:          otp.trim(),
        new_password: newPass,
      });
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => nav("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed. Check your code and try again.");
    } finally { setLoading(false); }
  };

  const STEPS = ["Email", "Verify Code", "New Password"];

  return (
    <div style={s.page}>
      <div style={s.card}>

        {/* LOGO */}
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 40 }}>🎓</span>
        </div>
        <h2 style={s.title}>Reset Password</h2>
        <p style={s.sub}>Scholars CBT — Account Recovery</p>

        {/* STEPPER */}
        <div style={s.stepRow}>
          {STEPS.map((label, i) => {
            const n = i + 1;
            const done    = step > n;
            const active  = step === n;
            return (
              <span key={n} style={{ display: "flex", alignItems: "center" }}>
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span style={{
                    ...s.dot,
                    background:  done ? "#6c63ff" : active ? "#6c63ff" : "#dfe6e9",
                    color:       done || active ? "#fff" : "#b2bec3",
                    border:      active ? "2px solid #6c63ff" : "2px solid transparent",
                    boxShadow:   active ? "0 0 0 3px #6c63ff33" : "none",
                  }}>
                    {done ? "✓" : n}
                  </span>
                  <span style={{ fontSize: 10, color: active ? "#6c63ff" : "#b2bec3", fontWeight: active ? 700 : 400, whiteSpace: "nowrap" }}>{label}</span>
                </span>
                {i < STEPS.length - 1 && (
                  <span style={{ ...s.line, background: step > n ? "#6c63ff" : "#dfe6e9", marginBottom: 16 }} />
                )}
              </span>
            );
          })}
        </div>

        {/* INFO BOX */}
        {step === 2 && !error && (
          <div style={s.infoBox}>
            <span style={{ fontSize: 18 }}>📧</span>
            <span>We sent a 6-digit code to <strong>{masked}</strong>.<br />Check your inbox and spam folder.</span>
          </div>
        )}

        {/* ERROR */}
        {error && <div style={s.errorBox}>⚠️ {error}</div>}

        {/* SUCCESS */}
        {success && <div style={s.successBox}>✅ {success}</div>}

        {/* ── STEP 1 ── */}
        {step === 1 && (
          <>
            <label style={s.label}>Email Address</label>
            <input
              style={s.input}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleRequestCode()}
              autoFocus
            />
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              onClick={handleRequestCode} disabled={loading}>
              {loading ? "Sending..." : "Send Reset Code →"}
            </button>
            <p style={s.help}>
              Don't have access to your email?{" "}
              <a href="https://wa.me/2349036995642" target="_blank" rel="noreferrer" style={{ color: "#25D366", fontWeight: 700 }}>
                WhatsApp admin
              </a>
            </p>
          </>
        )}

        {/* ── STEP 2 ── */}
        {step === 2 && (
          <>
            <label style={s.label}>6-Digit Code</label>
            <input
              style={{ ...s.input, textAlign: "center", fontSize: 28, letterSpacing: 10, fontFamily: "monospace" }}
              type="text"
              inputMode="numeric"
              placeholder="000000"
              maxLength={6}
              value={otp}
              onChange={e => { setOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleVerifyCode()}
              autoFocus
            />
            {otp.length === 6 && !error && (
              <p style={{ fontSize: 12, color: "#6c63ff", fontWeight: 600, textAlign: "center", marginTop: 4 }}>
                6/6 digits ✓ Ready
              </p>
            )}
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              onClick={handleVerifyCode} disabled={loading}>
              {loading ? "Verifying..." : "Verify Code →"}
            </button>
            <p style={{ textAlign: "center", fontSize: 13, color: "#636e72", marginTop: 10 }}>
              Didn't get it?{" "}
              <button style={s.linkBtn} onClick={handleResend} disabled={loading}>Resend code</button>
            </p>
            <button style={s.ghostBtn} onClick={() => { setStep(1); setOtp(""); setError(""); setSuccess(""); }}>
              ← Change email
            </button>
          </>
        )}

        {/* ── STEP 3 ── */}
        {step === 3 && (
          <>
            <label style={s.label}>New Password</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...s.input, paddingRight: 44 }}
                type={showPass ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={newPass}
                onChange={e => { setNewPass(e.target.value); setError(""); }}
                autoFocus
              />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>

            {/* Password strength */}
            {newPass && (
              <div style={{ marginTop: 6, marginBottom: 4 }}>
                <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 2, transition: "all 0.3s",
                    width:      newPass.length >= 10 ? "100%" : newPass.length >= 8 ? "66%" : newPass.length >= 6 ? "33%" : "10%",
                    background: newPass.length >= 10 ? "#00b894" : newPass.length >= 8 ? "#fdcb6e" : "#e17055",
                  }} />
                </div>
                <span style={{ fontSize: 11, color: "#636e72" }}>
                  {newPass.length >= 10 ? "Strong ✓" : newPass.length >= 8 ? "Medium" : "Weak"}
                </span>
              </div>
            )}

            <label style={s.label}>Confirm Password</label>
            <input
              style={{ ...s.input, borderColor: confirm && confirm !== newPass ? "#e17055" : undefined }}
              type="password"
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(""); }}
              onKeyDown={e => e.key === "Enter" && handleResetPassword()}
            />
            {confirm && confirm !== newPass && (
              <p style={{ fontSize: 12, color: "#e17055", marginTop: 4 }}>Passwords don't match</p>
            )}

            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              onClick={handleResetPassword} disabled={loading}>
              {loading ? "Resetting..." : "Reset Password ✓"}
            </button>
          </>
        )}

        <p style={s.foot}>
          Remember your password? <Link to="/login" style={s.link}>Login here</Link>
        </p>
        <p style={{ textAlign: "center", marginTop: 8 }}>
          <Link to="/login" style={{ ...s.link, fontSize: 12, color: "#636e72" }}>← Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6c63ff,#3f51b5)", padding: 16 },
  card:       { background: "#fff", borderRadius: 16, padding: "28px 28px 24px", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" },
  title:      { textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 2, color: "#2d3436" },
  sub:        { textAlign: "center", color: "#636e72", marginBottom: 20, fontSize: 13 },
  stepRow:    { display: "flex", alignItems: "flex-start", justifyContent: "center", marginBottom: 20 },
  dot:        { width: 28, height: 28, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800 },
  line:       { display: "inline-block", width: 44, height: 3, verticalAlign: "middle", margin: "0 4px", marginTop: -16 },
  infoBox:    { display: "flex", gap: 10, alignItems: "flex-start", background: "#f0f0ff", border: "1px solid #c5c0ff", borderRadius: 10, padding: "12px 14px", marginBottom: 14, fontSize: 13, color: "#2d3436", lineHeight: 1.5 },
  errorBox:   { background: "#ffeae9", border: "1px solid #fab1a0", borderRadius: 8, padding: "10px 14px", color: "#e17055", fontWeight: 600, marginBottom: 12, fontSize: 13 },
  successBox: { background: "#e8f8f5", border: "1px solid #00b894", borderRadius: 8, padding: "10px 14px", color: "#00b894", fontWeight: 700, marginBottom: 12, textAlign: "center", fontSize: 13 },
  label:      { display: "block", fontSize: 13, fontWeight: 600, color: "#2d3436", marginBottom: 6, marginTop: 14 },
  input:      { width: "100%", padding: "12px 14px", border: "2px solid #dfe6e9", borderRadius: 10, fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  eyeBtn:     { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18 },
  btn:        { width: "100%", padding: 13, background: "linear-gradient(135deg,#6c63ff,#3f51b5)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer", marginTop: 14 },
  ghostBtn:   { width: "100%", padding: 10, background: "transparent", color: "#636e72", border: "1px solid #dfe6e9", borderRadius: 10, fontWeight: 600, fontSize: 13, cursor: "pointer", marginTop: 8 },
  linkBtn:    { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 13, textDecoration: "underline" },
  help:       { fontSize: 12, color: "#636e72", textAlign: "center", marginTop: 14, lineHeight: 1.6 },
  foot:       { textAlign: "center", marginTop: 16, fontSize: 13, color: "#636e72" },
  link:       { color: "#6c63ff", fontWeight: 700, textDecoration: "none" },
};
