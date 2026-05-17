import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const WHATSAPP = "2349036995642";

const PLANS = [
  { id: "weekly",   name: "Weekly",   price: "₦500",   duration: "7 days",  color: "#6c63ff" },
  { id: "monthly",  name: "Monthly",  price: "₦1,500", duration: "30 days", color: "#00b894", popular: true },
  { id: "lifetime", name: "Lifetime", price: "₦5,000", duration: "Forever", color: "#e17055" },
];

const FEATURES = [
  { icon: "📚", text: "Full question bank — all subjects & topics" },
  { icon: "💡", text: "Step-by-step explanations for every answer" },
  { icon: "🏫", text: "Post-UTME (UNILAG, UI, UNIBEN & more)" },
  { icon: "📊", text: "Performance analytics & weak topic detection" },
  { icon: "🔁", text: "Error review — practice only your mistakes" },
  { icon: "🧠", text: "Smart weakness-based exam generator" },
  { icon: "♾️", text: "Unlimited exams every day" },
  { icon: "⚡", text: "Speed training mode" },
  { icon: "🏆", text: "Advanced leaderboard & detailed stats" },
];

export default function Upgrade() {
  const { student, refreshStudent } = useAuth();
  const nav = useNavigate();
  const [selected,   setSelected]   = useState("monthly");
  const [step,       setStep]        = useState("plans"); // plans | pay | activate
  const [keyCode,    setKeyCode]     = useState("");
  const [activating, setActivating]  = useState(false);
  const [error,      setError]       = useState("");
  const [success,    setSuccess]     = useState("");

  const plan = PLANS.find(p => p.id === selected);

  const waMessage = () => {
    const msg = `Hello! I want to upgrade to CBT App Premium.\n\nPlan: ${plan.name} (${plan.price})\nDuration: ${plan.duration}\nEmail: ${student?.email}\n\nI have made the payment, please send my activation key.`;
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  };

  const activate = async () => {
    if (!keyCode.trim()) return setError("Please enter your activation key.");
    setError(""); setActivating(true);
    try {
      const res = await API.post("/auth/activate-key", { key_code: keyCode.trim() });
      setSuccess(res.data.message);
      await refreshStudent();
      setTimeout(() => nav("/dashboard"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid key. Please check and try again.");
    } finally { setActivating(false); }
  };

  if (student?.is_premium) {
    return (
      <div style={s.center}>
        <div style={s.card}>
          <div style={{ fontSize: 60 }}>👑</div>
          <h2>You're Already Premium!</h2>
          <p style={{ color: "#636e72" }}>
            Expires: {new Date(student.premium_expires_at).toLocaleDateString("en-NG", { dateStyle: "long" })}
          </p>
          <button style={{ ...s.btn, background: "#6c63ff", marginTop: 16 }} onClick={() => nav("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <button style={s.back} onClick={() => step === "plans" ? nav(-1) : setStep("plans")}>
        ← {step === "plans" ? "Back" : "Change plan"}
      </button>

      {/* ── STEP 1: PLANS ── */}
      {step === "plans" && (
        <>
          <h1 style={s.heading}>Upgrade to Premium 👑</h1>
          <p style={s.sub}>Unlock everything you need to score higher</p>

          {/* Features */}
          <div style={s.featuresGrid}>
            {FEATURES.map((f, i) => (
              <div key={i} style={s.featureItem}>
                <span style={{ fontSize: 18 }}>{f.icon}</span>
                <span style={{ fontSize: 13 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* Plans */}
          <h3 style={{ textAlign: "center", marginBottom: 12 }}>Choose Your Plan</h3>
          <div style={s.plansRow}>
            {PLANS.map(p => (
              <div key={p.id}
                style={{ ...s.planCard, borderColor: selected === p.id ? p.color : "#dfe6e9", borderWidth: selected === p.id ? 3 : 2, background: selected === p.id ? p.color + "10" : "#fff", cursor: "pointer", position: "relative" }}
                onClick={() => setSelected(p.id)}>
                {p.popular && <div style={{ ...s.popularBadge, background: p.color }}>Most Popular</div>}
                <div style={{ fontSize: 26, fontWeight: 800, color: p.color }}>{p.price}</div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{p.name}</div>
                <div style={{ color: "#636e72", fontSize: 13 }}>{p.duration}</div>
              </div>
            ))}
          </div>

          <button style={{ ...s.btn, background: plan.color, marginTop: 20 }}
            onClick={() => setStep("pay")}>
            Continue with {plan.name} Plan →
          </button>
        </>
      )}

      {/* ── STEP 2: PAY ── */}
      {step === "pay" && (
        <div style={s.card}>
          <div style={{ fontSize: 48 }}>💳</div>
          <h2 style={s.cardTitle}>How to Pay</h2>

          <div style={s.steps}>
            {[
              ["1", "Transfer payment", `Send ${plan.price} and your receipt to our WhatsApp`],
              ["2", "Send proof",       "Screenshot or bank transfer confirmation"],
              ["3", "Get your key",     "We verify and send your unique activation key"],
              ["4", "Activate",         "Enter the key on the next screen — done!"],
            ].map(([num, title, desc]) => (
              <div key={num} style={s.step}>
                <span style={s.stepNum}>{num}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "#636e72" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <a href={waMessage()} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
            <button style={{ ...s.btn, background: "#25D366", fontSize: 16 }}>
              📱 Open WhatsApp — Pay {plan.price}
            </button>
          </a>

          <button style={{ ...s.btn, background: "#6c63ff", marginTop: 10 }}
            onClick={() => setStep("activate")}>
            I already have a key → Enter it
          </button>
        </div>
      )}

      {/* ── STEP 3: ACTIVATE ── */}
      {step === "activate" && (
        <div style={s.card}>
          <div style={{ fontSize: 48 }}>🔑</div>
          <h2 style={s.cardTitle}>Enter Activation Key</h2>
          <p style={{ color: "#636e72", marginBottom: 20 }}>
            Enter the key sent to you on WhatsApp
          </p>

          <input
            style={s.keyInput}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            value={keyCode}
            onChange={e => setKeyCode(e.target.value.toUpperCase())}
            maxLength={19}
          />

          {error   && <p style={s.error}>{error}</p>}
          {success && <p style={s.successMsg}>✅ {success}</p>}

          <button
            style={{ ...s.btn, background: "#00b894", opacity: activating ? 0.7 : 1 }}
            onClick={activate}
            disabled={activating}>
            {activating ? "Activating..." : "Activate Premium 👑"}
          </button>

          <div style={{ marginTop: 16, fontSize: 13, color: "#636e72", textAlign: "center" }}>
            Need a key?{" "}
            <a href={waMessage()} target="_blank" rel="noreferrer" style={{ color: "#6c63ff", fontWeight: 700 }}>
              Contact us on WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:        { maxWidth: 600, margin: "0 auto", padding: "20px 16px", fontFamily: "sans-serif" },
  center:      { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" },
  heading:     { textAlign: "center", fontSize: 26, fontWeight: 800, marginBottom: 4 },
  sub:         { textAlign: "center", color: "#636e72", marginBottom: 20 },
  back:        { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 16, padding: 0 },
  featuresGrid:{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 24 },
  featureItem: { display: "flex", gap: 8, alignItems: "center", background: "#f8f9fa", borderRadius: 8, padding: "8px 10px" },
  plansRow:    { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" },
  planCard:    { border: "2px solid", borderRadius: 14, padding: "18px 20px", textAlign: "center", flex: 1, minWidth: 120, maxWidth: 170 },
  popularBadge:{ position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)", color: "#fff", fontSize: 10, padding: "2px 10px", borderRadius: 10, whiteSpace: "nowrap", fontWeight: 700 },
  card:        { background: "#fff", borderRadius: 16, padding: "28px 24px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", marginTop: 8 },
  cardTitle:   { fontSize: 20, fontWeight: 800, marginBottom: 16 },
  steps:       { textAlign: "left", marginBottom: 20 },
  step:        { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 },
  stepNum:     { background: "#6c63ff", color: "#fff", borderRadius: "50%", width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 },
  btn:         { width: "100%", padding: "13px", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer" },
  keyInput:    { width: "100%", padding: "13px", border: "2px solid #dfe6e9", borderRadius: 10, fontSize: 18, textAlign: "center", letterSpacing: 3, fontFamily: "monospace", boxSizing: "border-box", marginBottom: 12 },
  error:       { color: "#e17055", fontSize: 13, marginBottom: 10 },
  successMsg:  { color: "#00b894", fontSize: 14, fontWeight: 700, marginBottom: 10 },
};
