import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

/**
 * EmailVerifyBanner
 * ──────────────────────────────────────────────────────────────
 * Registration already sends a verification email (backend:
 * authController.register → sendVerificationEmail), and there's a
 * working /verify-email/:token page — but nothing ever told the
 * student their email wasn't confirmed yet, so most people just
 * never clicked the link.
 *
 * This renders a persistent top banner for any logged-in student
 * whose email_verified is false, with a one-tap "Resend email"
 * action. It's dismissible per browser tab (so it doesn't block a
 * student mid-exam) but comes back on the next visit until the
 * email is actually confirmed — it does not hard-lock the app,
 * since many existing accounts predate this check and shouldn't be
 * suddenly locked out over an unconfirmed inbox.
 */
export default function EmailVerifyBanner() {
  const { student } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending]     = useState(false);
  const [sent, setSent]           = useState(false);

  if (!student || student.email_verified || dismissed) return null;

  const resend = async () => {
    if (sending || sent) return;
    setSending(true);
    try {
      await API.post("/auth/resend-verification");
      setSent(true);
    } catch {
      // silently ignore — button will just be tappable again
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 9985,
      display: "flex", alignItems: "center", gap: 10,
      background: "linear-gradient(135deg,#F59E0B,#FFC857)",
      padding: "9px 16px",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      boxShadow: "0 2px 12px rgba(245,158,11,0.35)",
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>✉️</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{ color: "#1a1200", fontWeight: 800, fontSize: 12.5 }}>
          {sent ? "Verification email sent — check your inbox." : "Please confirm your email address."}
        </span>
        {!sent && (
          <span style={{ color: "rgba(26,18,0,0.75)", fontSize: 11.5, marginLeft: 6 }}>
            We sent a link when you signed up.
          </span>
        )}
      </div>
      {!sent && (
        <button onClick={resend} disabled={sending} style={{
          background: "rgba(26,18,0,0.15)", border: "none", borderRadius: 8,
          padding: "5px 12px", fontSize: 11.5, fontWeight: 800, color: "#1a1200",
          cursor: sending ? "default" : "pointer", flexShrink: 0, whiteSpace: "nowrap",
        }}>
          {sending ? "Sending…" : "Resend email"}
        </button>
      )}
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" style={{
        background: "none", border: "none", color: "rgba(26,18,0,0.6)",
        cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0, flexShrink: 0,
      }}>✕</button>
    </div>
  );
}
