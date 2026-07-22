/**
 * ParentInviteSetup.js — /parent-access/:token
 * NEW FEATURE: Admin-generated unique parent portal link.
 *
 * This page is intentionally NOT linked from anywhere inside the student
 * dashboard. The only way a parent reaches it is via a unique link the
 * admin generates for their specific child and shares directly
 * (WhatsApp/SMS). No link-code typing, no student involvement.
 *
 * Flow:
 *   1. Load token info (student name) via GET /parent/invite/:token
 *   2. Parent fills in their own name/email/password
 *   3. POST /parent/invite/:token/accept creates the parent account
 *      and logs them straight into the existing ParentPortal Dashboard.
 */
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const C = {
  bg: "var(--bg)", card: "var(--surface)", border: "var(--border)",
  text: "#FFFFFF", muted: "var(--text-muted)",
  blue: "var(--primary)", cyan: "#06B6D4", green: "#10B981", red: "#EF4444",
};

export default function ParentInviteSetup({ onAuthed }) {
  const { token } = useParams();
  const nav = useNavigate();

  const [status, setStatus]   = useState("loading"); // loading | valid | invalid | done
  const [invite, setInvite]   = useState(null);
  const [error,  setError]    = useState("");
  const [form,   setForm]     = useState({ full_name: "", email: "", phone: "", password: "" });
  const [showPw, setShowPw]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API}/parent/invite/${token}`)
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) { setError(d.error || "This link is invalid."); setStatus("invalid"); return; }
        setInvite(d);
        setForm(f => ({ ...f, full_name: d.parent_name || "", phone: d.parent_phone || "" }));
        setStatus("valid");
      })
      .catch(() => { setError("Could not verify this link. Check your connection."); setStatus("invalid"); });
  }, [token]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API}/parent/invite/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      localStorage.setItem("parent_token", data.token);
      setStatus("done");
      setTimeout(() => {
        if (onAuthed) onAuthed(data.token);
        nav("/parent", { replace: true });
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const inp = {
    width: "100%", background: "var(--border)", border: "1px solid rgba(79,126,247,0.2)",
    borderRadius: 12, padding: "13px 15px", color: C.text, fontSize: 16, outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  };

  const wrap = (children) => (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(150deg,#0D0F1C 0%,#1a1040 50%,#0D0F1C 100%)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: `linear-gradient(135deg,${C.blue},${C.cyan})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, margin: "0 auto 14px", boxShadow: "0 12px 40px rgba(79,126,247,0.35)",
          }}>🎓</div>
          <div style={{ color: C.text, fontSize: 24, fontWeight: 900 }}>Scholars Syndicate</div>
          <div style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Parent Portal Setup</div>
        </div>
        {children}
      </div>
    </div>
  );

  if (status === "loading") {
    return wrap(
      <div style={{ textAlign: "center", color: C.muted, padding: 40 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>⏳</div>
        Verifying your invite link…
      </div>
    );
  }

  if (status === "invalid") {
    return wrap(
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 38, marginBottom: 10 }}>⚠️</div>
        <div style={{ color: C.text, fontWeight: 800, fontSize: 16, marginBottom: 8 }}>Link Not Available</div>
        <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.6 }}>{error}</div>
        <div style={{ color: C.muted, fontSize: 12, marginTop: 16 }}>
          Ask the school/admin to generate a new parent link for your child.
        </div>
      </div>
    );
  }

  if (status === "done") {
    return wrap(
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 18, padding: 28, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <div style={{ color: C.green, fontWeight: 800, fontSize: 16 }}>Portal Ready!</div>
        <div style={{ color: C.muted, fontSize: 13, marginTop: 6 }}>Taking you to your dashboard…</div>
      </div>
    );
  }

  // status === "valid" — show the setup form
  return wrap(
    <div style={{ background: C.card, border: "1px solid rgba(107,90,237,0.2)", borderRadius: 18, padding: 28 }}>
      <div style={{
        background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)",
        borderRadius: 12, padding: "12px 14px", marginBottom: 20, textAlign: "center",
      }}>
        <div style={{ color: C.green, fontWeight: 800, fontSize: 14 }}>
          You're setting up monitoring for {invite?.student_name}
        </div>
        {invite?.school_class && (
          <div style={{ color: C.muted, fontSize: 12, marginTop: 2 }}>{invite.school_class}</div>
        )}
      </div>

      <form onSubmit={submit}>
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>Your Full Name</label>
          <input style={inp} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Your full name" required />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>Phone (for SMS alerts)</label>
          <input style={inp} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="08012345678" inputMode="tel" />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>Email Address</label>
          <input style={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="parent@email.com" required />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={{ color: C.muted, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 600 }}>Create a Password</label>
          <div style={{ position: "relative" }}>
            <input
              style={{ ...inp, paddingRight: 44 }}
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={e => set("password", e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: C.muted, fontSize: 16 }}>
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "11px 14px", color: C.red, fontSize: 13, marginBottom: 14 }}>
            ⚠️ {error}
          </div>
        )}

        <button type="submit" disabled={submitting} style={{
          width: "100%", padding: "14px 0", borderRadius: 13,
          background: submitting ? "#C7DCFF" : `linear-gradient(135deg,${C.blue},${C.cyan})`,
          border: "none", color: submitting ? C.muted : "#fff", fontWeight: 800, fontSize: 15,
          cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit",
          boxShadow: "0 8px 24px rgba(79,126,247,0.3)",
        }}>
          {submitting ? "Setting up…" : "Set Up My Portal →"}
        </button>
      </form>

      <p style={{ textAlign: "center", marginTop: 16, color: C.muted, fontSize: 12, lineHeight: 1.7 }}>
        🔒 This link is unique to you and expires after 7 days.<br />
        Only you will be able to view {invite?.student_name}'s progress.
      </p>
    </div>
  );
}
