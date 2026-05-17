import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import API from "../utils/api";

export default function ForgotPassword() {
  const nav = useNavigate();
  const [step,    setStep]    = useState(1);
  const [phone,   setPhone]   = useState("");
  const [otp,     setOtp]     = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass,setShowPass]= useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Helper function to mask phone number for display (handles spaces)
  const maskPhone = (phoneNum) => {
    // Remove all whitespace first for consistent masking
    const cleaned = phoneNum.replace(/\s/g, "");
    if (cleaned.length >= 10) {
      return cleaned.slice(0, 4) + "****" + cleaned.slice(-3);
    }
    return phoneNum;
  };

  // STEP 1 — Send OTP
  const handleRequestOtp = async () => {
    if (!phone.trim()) return setError("Enter your registered phone number.");
    const phoneOk = /^(0|\+234)[789][01]\d{8}$/.test(phone.replace(/\s/g, ""));
    if (!phoneOk) return setError("Enter a valid Nigerian phone number (e.g. 08012345678).");
    setError(""); setLoading(true);
    try {
      const res = await API.post("/auth/forgot-password", { phone: phone.trim() });
      setSuccess(res.data.message);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Try again.");
    } finally { setLoading(false); }
  };

  // STEP 2 — Verify OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) return setError("Enter the full 6-digit OTP from your SMS.");
    setError(""); setLoading(true);
    try {
      await API.post("/auth/verify-otp", { phone: phone.trim(), otp: otp.trim() });
      setSuccess("");
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid or expired OTP. Request a new one.");
    } finally { setLoading(false); }
  };

  // Resend OTP
  const handleResend = async () => {
    setOtp(""); setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await API.post("/auth/forgot-password", { phone: phone.trim() });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP.");
    } finally { setLoading(false); }
  };

  // STEP 3 — Reset Password
  const handleResetPassword = async () => {
    if (!newPass) return setError("Enter a new password.");
    if (newPass.length < 6) return setError("Password must be at least 6 characters.");
    if (newPass !== confirm) return setError("Passwords do not match.");
    setError(""); setLoading(true);
    try {
      await API.post("/auth/reset-password", {
        phone:        phone.trim(),
        otp:          otp.trim(),
        new_password: newPass,
      });
      setSuccess("Password reset successfully! Redirecting to login...");
      setTimeout(() => nav("/login"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Reset failed. Check your OTP and try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <button style={s.back}
          onClick={() => step === 1 ? nav("/login") : setStep(step - 1)}>
          ← {step === 1 ? "Back to Login" : "Back"}
        </button>

        <div style={{ textAlign: "center", fontSize: 44, marginBottom: 8 }}>
          {step === 1 ? "📱" : step === 2 ? "🔢" : "🔐"}
        </div>

        <h2 style={s.title}>
          {step === 1 && "Forgot Password?"}
          {step === 2 && "Enter OTP"}
          {step === 3 && "Set New Password"}
        </h2>
        <p style={s.sub}>
          {step === 1 && "Enter your registered phone number"}
          {step === 2 && `We sent a 6-digit code via SMS to ${maskPhone(phone)}`}
          {step === 3 && "Choose a strong new password"}
        </p>

        {/* STEP DOTS */}
        <div style={s.stepRow}>
          {[1, 2, 3].map((n, i) => (
            <span key={n} style={{ display: "flex", alignItems: "center" }}>
              <span style={{ ...s.dot, background: step >= n ? "#6c63ff" : "#dfe6e9", color: step >= n ? "#fff" : "#b2bec3" }}>
                {step > n ? "✓" : n}
              </span>
              {i < 2 && <span style={{ ...s.line, background: step > n ? "#6c63ff" : "#dfe6e9" }} />}
            </span>
          ))}
        </div>

        {/* SUCCESS */}
        {success && <div style={s.successBox}>✅ {success}</div>}

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <label style={s.label}>Phone Number</label>
            <input 
              style={s.input} 
              type="tel" 
              placeholder="08012345678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleRequestOtp()} />
            {error && <p style={s.error}>⚠️ {error}</p>}
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              onClick={handleRequestOtp} disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP Code →"}
            </button>
            <p style={s.help}>
              Don't have access to your number?{" "}
              <a href="https://wa.me/2349036995642" target="_blank" rel="noreferrer"
                style={{ color: "#25D366", fontWeight: 700 }}>
                WhatsApp admin
              </a>
            </p>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <label style={s.label}>6-Digit OTP from SMS</label>
            <input
              style={{ ...s.input, textAlign: "center", fontSize: 28, letterSpacing: 10, fontFamily: "monospace" }}
              type="text" 
              inputMode="numeric"
              placeholder="000000" 
              maxLength={6}
              value={otp}
              onChange={e => {
                const val = e.target.value.replace(/\D/g, "");
                setOtp(val.slice(0, 6));
              }}
              onKeyDown={e => e.key === "Enter" && handleVerifyOtp()} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
              <span style={{ fontSize: 12, color: "#636e72" }}>Expires in 15 minutes</span>
              <button style={s.linkBtn} onClick={handleResend} disabled={loading}>
                {loading ? "Sending..." : "Resend OTP"}
              </button>
            </div>
            {error && <p style={s.error}>⚠️ {error}</p>}
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              onClick={handleVerifyOtp} disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP →"}
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
            <label style={s.label}>New Password</label>
            <div style={{ position: "relative" }}>
              <input style={{ ...s.input, paddingRight: 44 }}
                type={showPass ? "text" : "password"}
                placeholder="Min. 6 characters"
                value={newPass}
                onChange={e => setNewPass(e.target.value)} />
              <button type="button" style={s.eyeBtn} onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
            <label style={s.label}>Confirm Password</label>
            <input 
              style={s.input} 
              type="password" 
              placeholder="Repeat new password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleResetPassword()} />
            {/* Password strength indicator */}
            {newPass && (
              <div style={{ marginTop: 6 }}>
                <div style={{ height: 4, background: "#f0f0f0", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ 
                    height: "100%", 
                    borderRadius: 2, 
                    transition: "all 0.3s",
                    width: newPass.length >= 10 ? "100%" : newPass.length >= 8 ? "66%" : newPass.length >= 6 ? "33%" : "10%",
                    background: newPass.length >= 10 ? "#00b894" : newPass.length >= 8 ? "#fdcb6e" : "#e17055" 
                  }} />
                </div>
                <span style={{ fontSize: 11, color: "#636e72" }}>
                  {newPass.length >= 10 ? "Strong ✓" : newPass.length >= 8 ? "Medium" : "Weak"}
                </span>
              </div>
            )}
            {error && <p style={s.error}>⚠️ {error}</p>}
            <button style={{ ...s.btn, opacity: loading ? 0.7 : 1 }}
              onClick={handleResetPassword} disabled={loading}>
              {loading ? "Resetting..." : "Reset Password ✓"}
            </button>
          </>
        )}

        <p style={s.foot}>
          Remember your password? <Link to="/login" style={s.link}>Login here</Link>
        </p>
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#6c63ff,#3f51b5)", padding: 16 },
  card:       { background: "#fff", borderRadius: 16, padding: "28px 28px 24px", width: "100%", maxWidth: 420, boxShadow: "0 8px 40px rgba(0,0,0,0.2)" },
  back:       { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 13, marginBottom: 10, padding: 0 },
  title:      { textAlign: "center", fontSize: 22, fontWeight: 800, marginBottom: 4, color: "#2d3436" },
  sub:        { textAlign: "center", color: "#636e72", marginBottom: 20, fontSize: 13, lineHeight: 1.5 },
  stepRow:    { display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  dot:        { width: 28, height: 28, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800 },
  line:       { display: "inline-block", width: 50, height: 3, verticalAlign: "middle", margin: "0 4px" },
  label:      { display: "block", fontSize: 13, fontWeight: 600, color: "#2d3436", marginBottom: 6, marginTop: 14 },
  input:      { width: "100%", padding: "12px 14px", border: "2px solid #dfe6e9", borderRadius: 10, fontSize: 14, boxSizing: "border-box", outline: "none", fontFamily: "inherit" },
  eyeBtn:     { position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 18 },
  error:      { color: "#e17055", fontSize: 13, marginTop: 8, background: "#ffeae9", padding: "8px 12px", borderRadius: 8 },
  btn:        { width: "100%", padding: 13, background: "linear-gradient(135deg,#6c63ff,#3f51b5)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer", marginTop: 12 },
  successBox: { background: "#e8f8f5", border: "1px solid #00b894", borderRadius: 8, padding: "10px 14px", color: "#00b894", fontWeight: 700, marginBottom: 12, textAlign: "center", fontSize: 13 },
  linkBtn:    { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 12 },
  help:       { fontSize: 12, color: "#636e72", textAlign: "center", marginTop: 14, lineHeight: 1.6 },
  foot:       { textAlign: "center", marginTop: 16, fontSize: 13, color: "#636e72" },
  link:       { color: "#6c63ff", fontWeight: 700, textDecoration: "none" },
};