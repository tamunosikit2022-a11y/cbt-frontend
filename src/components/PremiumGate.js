import { useNavigate } from "react-router-dom";

const FEATURE_COPY = {
  performance: {
    icon: "📊",
    title: "Your Analytics are Locked",
    desc: "See exactly which subjects and topics are costing you marks. Premium shows your full strength/weakness breakdown, subject-by-subject scores, and improvement trends.",
    cta: "Unlock Analytics",
  },
  errorReview: {
    icon: "🔁",
    title: "Error Review is Premium",
    desc: "Every question you ever got wrong, saved and ready to redo. The fastest way to plug your score leaks — Premium only.",
    cta: "Unlock Error Review",
  },
  admission: {
    icon: "🏛️",
    title: "Admission Checker is Premium",
    desc: "Check your real chances at UNILAG, UI, OAU and 20+ universities based on your practice scores. Know before you apply.",
    cta: "Unlock Admission Checker",
  },
  predicted: {
    icon: "🎯",
    title: "Predicted Score is Premium",
    desc: "See your likely JAMB score based on your practice performance. Know where you stand before exam day.",
    cta: "Unlock Predicted Score",
  },
  default: {
    icon: "👑",
    title: "Premium Feature",
    desc: "Upgrade to unlock this feature and get the full Scholars Syndicate experience.",
    cta: "Unlock Premium",
  },
};

export default function PremiumGate({ feature = "default" }) {
  const nav = useNavigate();
  const copy = FEATURE_COPY[feature] || FEATURE_COPY.default;

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg,#0f0e1a,#1a1440)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.04)",
        border: "1.5px solid rgba(108,99,255,0.3)",
        borderRadius: 24, padding: "40px 28px",
        maxWidth: 380, width: "100%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(108,99,255,0.15)",
      }}>
        {/* Lock badge */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "linear-gradient(135deg,#6c63ff22,#a29bfe11)",
          border: "2px solid #6c63ff44",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 34, margin: "0 auto 16px",
        }}>
          {copy.icon}
        </div>

        {/* Crown overlay */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "linear-gradient(135deg,#6c63ff,#a29bfe)",
          borderRadius: 20, padding: "4px 14px", marginBottom: 16,
          fontSize: 11, fontWeight: 800, color: "#fff", letterSpacing: 0.5,
        }}>
          👑 PREMIUM ONLY
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 10, lineHeight: 1.3 }}>
          {copy.title}
        </h2>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 13, marginBottom: 28, lineHeight: 1.7 }}>
          {copy.desc}
        </p>

        {/* Plans teaser */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "14px 16px", marginBottom: 22,
          display: "flex", justifyContent: "space-around",
        }}>
          {[
            { label: "Trial", price: "₦100", sub: "3 hours" },
            { label: "Weekly", price: "₦200", sub: "7 days" },
            { label: "Monthly", price: "₦500", sub: "30 days" },
          ].map((p, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 15, color: "#a29bfe" }}>{p.price}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginTop: 1 }}>{p.label}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{p.sub}</div>
            </div>
          ))}
        </div>

        <button
          onClick={() => nav("/upgrade")}
          style={{
            width: "100%", padding: "14px 0",
            background: "linear-gradient(135deg,#6c63ff,#a29bfe)",
            color: "#fff", border: "none", borderRadius: 13,
            fontWeight: 800, fontSize: 15, cursor: "pointer",
            marginBottom: 10, boxShadow: "0 6px 20px rgba(108,99,255,0.35)",
          }}>
          {copy.cta} →
        </button>
        <button
          onClick={() => nav(-1)}
          style={{
            width: "100%", padding: "12px 0", background: "none",
            border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 13,
            color: "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
          ← Go Back
        </button>
      </div>
    </div>
  );
}
