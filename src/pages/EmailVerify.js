/**
 * EmailVerify.js — /verify-email/:token
 * FIX: Completes email verification from the link sent in the welcome email.
 * Add to App.js: <Route path="/verify-email/:token" element={<EmailVerify />} />
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

export default function EmailVerify() {
  const { token } = useParams();
  const nav = useNavigate();
  const { refreshStudent } = useAuth();
  const [status, setStatus] = useState("loading"); // loading | success | error | expired
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`${API}/auth/verify-email/${token}`)
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (ok) {
          setStatus("success"); setMsg(d.message);
          // FIX: the backend marks email_verified=true, but the student
          // object cached in AuthContext/localStorage (from login/register)
          // was never refreshed — so EmailVerifyBanner kept reading the
          // stale `email_verified: false` and never went away, even right
          // after a successful verification. Refresh it here (silently
          // no-ops if the student isn't logged in on this device/browser).
          refreshStudent?.().catch(() => {});
        }
        else if (d.error?.includes("expired")) setStatus("expired");
        else { setStatus("error"); setMsg(d.error); }
      })
      .catch(() => { setStatus("error"); setMsg("Could not connect. Try again."); });
  }, [token]);

  const ICONS  = { loading:"⏳", success:"✅", error:"❌", expired:"⌛" };
  const TITLES = {
    loading: "Verifying your email…",
    success: "Email Verified!",
    error:   "Verification Failed",
    expired: "Link Expired",
  };
  const COLORS = { loading:"#a29bfe", success:"#00b894", error:"#e17055", expired:"#fdcb6e" };

  const page = {
    minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center",
    background:"linear-gradient(150deg,#0D0F1C 0%,#1a1040 60%,#0D0F1C 100%)",
    fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", padding:24,
  };
  const card = {
    background:"rgba(21,25,41,0.92)", border:"1px solid rgba(124,92,255,0.2)",
    borderRadius:20, padding:"36px 28px", maxWidth:380, width:"100%",
    textAlign:"center", boxShadow:"0 24px 80px rgba(0,0,0,0.5)", backdropFilter:"blur(20px)",
  };

  return (
    <div style={page}>
      <div style={card}>
        <div style={{ fontSize:52, marginBottom:16 }}>{ICONS[status]}</div>
        <div style={{ fontSize:22, fontWeight:900, color:COLORS[status], marginBottom:10 }}>
          {TITLES[status]}
        </div>
        {msg && <div style={{ fontSize:14, color:"#A8B8D8", lineHeight:1.6, marginBottom:20 }}>{msg}</div>}

        {status === "expired" && (
          <p style={{ fontSize:13, color:"#8b9cbd", lineHeight:1.6 }}>
            Log in to your account and go to Settings → Resend Verification Email.
          </p>
        )}

        {(status === "success" || status === "error") && (
          <button
            onClick={() => nav("/dashboard", { replace: true })}
            style={{
              marginTop:8, padding:"13px 28px", borderRadius:12,
              background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)",
              border:"none", color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer",
            }}
          >
            Go to Dashboard →
          </button>
        )}
      </div>
    </div>
  );
}
