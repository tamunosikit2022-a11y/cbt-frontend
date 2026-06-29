import { useNavigate } from "react-router-dom";

const FEATURE_COPY = {
  performance: {
    icon: "📊",
    title: "Tokens needed",
    desc: "See your full strength/weakness breakdown, subject-by-subject scores, and improvement trends. Powered by your practice history.",
    cost: null,
    cta: "Get Tokens to Unlock",
  },
  errorReview: {
    icon: "🔁",
    title: "Tokens needed",
    desc: "Every question you ever got wrong, saved and ready to redo. The fastest way to close your score gap.",
    cost: null,
    cta: "Get Tokens to Unlock",
  },
  admission: {
    icon: "🏛️",
    title: "Tokens needed",
    desc: "Check your real chances at UNILAG, UI, OAU and 20+ universities based on your practice scores.",
    cost: null,
    cta: "Get Tokens to Unlock",
  },
  predicted: {
    icon: "🎯",
    title: "3 tokens to unlock",
    desc: "See your likely JAMB score based on your full practice history. Know where you stand before exam day.",
    cost: 3,
    cta: "Use 3 Tokens",
  },
  aiTutor: {
    icon: "🤖",
    title: "1 token per message",
    desc: "You've used your 20 free daily messages. Top up tokens to keep chatting with your AI tutor.",
    cost: 1,
    cta: "Get Tokens",
  },
  vaultDownload: {
    icon: "📄",
    title: "1 token per download",
    desc: "Download past question papers and study materials directly to your device.",
    cost: 1,
    cta: "Use 1 Token",
  },
  arenaHost: {
    icon: "⚔️",
    title: "2 tokens to host",
    desc: "Create a battle room and challenge your friends or random opponents to a live JAMB quiz duel.",
    cost: 2,
    cta: "Use 2 Tokens",
  },
  default: {
    icon: "🪙",
    title: "Tokens needed",
    desc: "This feature uses tokens. Tokens are flexible — buy what you need, use only what you want.",
    cost: null,
    cta: "Get Tokens",
  },
};

const TOKEN_BUNDLES = [
  { tokens: 50,  price: "₦200",   note: "starter" },
  { tokens: 400, price: "₦1,000", note: "best value", highlight: true },
];

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
        background: "var(--surface)",
        border: "1.5px solid rgba(108,99,255,0.3)",
        borderRadius: 24, padding: "40px 28px",
        maxWidth: 380, width: "100%", textAlign: "center",
        boxShadow: "0 20px 60px rgba(108,99,255,0.15)",
      }}>
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(108,99,255,0.12)",
          border: "2px solid rgba(108,99,255,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 34, margin: "0 auto 16px",
        }}>
          {copy.icon}
        </div>

        {/* Token badge */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "rgba(108,99,255,0.2)",
          border: "1px solid rgba(108,99,255,0.4)",
          borderRadius: 20, padding: "4px 14px", marginBottom: 16,
          fontSize: 11, fontWeight: 800, color: "#a29bfe", letterSpacing: 0.5,
        }}>
          🪙 TOKEN FEATURE
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 900, color: "#fff", marginBottom: 10, lineHeight: 1.3 }}>
          {copy.title}
        </h2>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24, lineHeight: 1.7 }}>
          {copy.desc}
        </p>

        {/* Token bundle teaser */}
        <div style={{
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "14px 16px", marginBottom: 22,
        }}>
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 10, fontWeight: 600 }}>
            QUICK BUNDLES
          </div>
          <div style={{ display: "flex", justifyContent: "space-around" }}>
            {TOKEN_BUNDLES.map((b, i) => (
              <div key={i} style={{
                textAlign: "center",
                background: b.highlight ? "rgba(108,99,255,0.15)" : "transparent",
                border: b.highlight ? "1px solid rgba(108,99,255,0.3)" : "none",
                borderRadius: 10, padding: "8px 14px",
              }}>
                <div style={{ fontWeight: 900, fontSize: 18, color: "#a29bfe" }}>{b.tokens}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>tokens</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>{b.price}</div>
                {b.highlight && (
                  <div style={{ fontSize: 9, color: "#6c63ff", fontWeight: 700, marginTop: 2 }}>BEST VALUE</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => nav("/tokens")}
          style={{
            width: "100%", padding: "14px 0",
            background: "linear-gradient(135deg,#6c63ff,#a29bfe)",
            color: "#fff", border: "none", borderRadius: 13,
            fontWeight: 800, fontSize: 15, cursor: "pointer",
            marginBottom: 10, boxShadow: "0 6px 20px rgba(108,99,255,0.35)",
          }}>
          🪙 {copy.cta}
        </button>
        <button
          onClick={() => nav(-1)}
          style={{
            width: "100%", padding: "12px 0", background: "none",
            border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 13,
            color: "var(--text-muted)", fontWeight: 600, fontSize: 13, cursor: "pointer",
          }}>
          ← Go Back
        </button>
      </div>
    </div>
  );
}
