import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const PROFILE_COLORS = {
  fast_inaccurate: "#e17055",
  slow_accurate:   "#0984e3",
  balanced:        "#00b894",
  guesser:         "#fdcb6e",
  developing:      "#a29bfe",
};

export default function PersonalityProfile() {
  const nav = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    API.get("/phase2/personality")
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Analysing your exam behaviour..." />;
  if (error)   return <Loader text={error} isError onBack={() => nav("/dashboard")} />;

  const profile = data?.profile;
  const color   = profile ? PROFILE_COLORS[profile.type] : "#6c63ff";

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
        <h2 style={s.title}>🧠 Exam Personality Profile</h2>
        <p style={s.sub}>Understand how you study and what to improve</p>

        {!profile ? (
          <div style={s.emptyCard}>
            <div style={{ fontSize: 48 }}>📝</div>
            <p style={{ color: "#636e72" }}>{data?.message || "Take at least 3 exams to see your personality profile."}</p>
            <button style={s.btn} onClick={() => nav("/exam-select")}>Start Practising →</button>
          </div>
        ) : (
          <>
            {/* PROFILE CARD */}
            <div style={{ ...s.profileCard, borderTop: `6px solid ${color}` }}>
              <div style={{ fontSize: 72 }}>{profile.icon}</div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color, margin: "8px 0 4px" }}>
                {profile.description}
              </h2>
              <div style={{ ...s.trendPill, background: profile.trend === "improving" ? "#e8f8f5" : profile.trend === "declining" ? "#ffeae9" : "#f0f0f0", color: profile.trend === "improving" ? "#00b894" : profile.trend === "declining" ? "#e17055" : "#636e72" }}>
                {profile.trend === "improving" ? "📈 Improving trend" : profile.trend === "declining" ? "📉 Declining trend" : "➡️ Stable trend"}
              </div>

              {/* STATS */}
              <div style={s.statsRow}>
                <StatDot label="Avg Speed"   value={`${profile.avg_speed_secs}s`} sub="per question" color={color} />
                <StatDot label="Avg Accuracy" value={`${profile.avg_accuracy}%`}  sub="correct"      color={color} />
                <StatDot label="Exams Taken"  value={profile.total_exams}          sub="total"        color={color} />
                {profile.overconfidence_rate > 0 && (
                  <StatDot label="Overconfidence" value={`${profile.overconfidence_rate}%`} sub="sure but wrong" color="#fdcb6e" />
                )}
              </div>

              {/* SPEED METER */}
              <div style={{ width: "100%", marginTop: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#636e72", marginBottom: 4 }}>
                  <span>⚡ Fast (10s)</span>
                  <span>Avg: {profile.avg_speed_secs}s/question</span>
                  <span>🐢 Slow (90s)</span>
                </div>
                <div style={s.speedBg}>
                  <div style={{ ...s.speedFill, width: `${Math.min((profile.avg_speed_secs / 90) * 100, 100)}%`, background: color }} />
                  <div style={{ ...s.speedMarker, left: `${Math.min((profile.avg_speed_secs / 90) * 100, 100)}%` }} />
                </div>
              </div>
            </div>

            {/* TIPS */}
            <div style={s.tipsCard}>
              <h3 style={s.tipsTitle}>💡 Personalised Tips for You</h3>
              {profile.tips.map((tip, i) => (
                <div key={i} style={s.tipRow}>
                  <span style={s.tipNum}>{i + 1}</span>
                  <span style={{ fontSize: 14, color: "#2d3436", lineHeight: 1.5 }}>{tip}</span>
                </div>
              ))}
            </div>

            {/* ACTIONS */}
            <div style={s.actions}>
              {profile.type === "fast_inaccurate" && (
                <button style={{ ...s.btn, background: "#6c63ff" }} onClick={() => nav("/exam-select")}>
                  Practice with Timer →
                </button>
              )}
              {profile.type === "slow_accurate" && (
                <button style={{ ...s.btn, background: "#0984e3" }} onClick={() => nav("/challenge")}>
                  Try Daily Challenge (2 mins) →
                </button>
              )}
              {profile.type === "guesser" && (
                <button style={{ ...s.btn, background: "#fdcb6e", color: "#2d3436" }} onClick={() => nav("/heatmap")}>
                  View Mistake Patterns →
                </button>
              )}
              <button style={{ ...s.btn, background: "#00b894" }} onClick={() => nav("/exam-select")}>
                Start Exam →
              </button>
            </div>

            {/* WHAT EACH PROFILE MEANS */}
            <div style={s.profileGuide}>
              <h3 style={{ ...s.tipsTitle, marginBottom: 12 }}>📊 All Profile Types</h3>
              {[
                { icon: "⚡", name: "Fast but Inaccurate", desc: "Rushes through questions. High speed, low accuracy.", color: "#e17055" },
                { icon: "🔬", name: "Slow but Accurate", desc: "Takes time, gets it right. Needs speed improvement.", color: "#0984e3" },
                { icon: "⚖️", name: "Balanced Learner", desc: "Good mix of speed and accuracy. Top performer.", color: "#00b894" },
                { icon: "🎲", name: "Guesser / Overconfident", desc: "Feels sure but often wrong. Needs targeted study.", color: "#fdcb6e" },
                { icon: "🌱", name: "Still Developing", desc: "Early stage. More practice will reveal the true profile.", color: "#a29bfe" },
              ].map((p, i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                  <span style={{ fontSize: 24 }}>{p.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: p.color }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#636e72" }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatDot({ label, value, sub, color }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 22, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 11, color: "#636e72" }}>{sub}</div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#2d3436" }}>{label}</div>
    </div>
  );
}

function Loader({ text, isError, onBack }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "sans-serif" }}>
      <div style={{ fontSize: 36 }}>{isError ? "❌" : "⏳"}</div>
      <p style={{ color: isError ? "#e17055" : "#636e72" }}>{text}</p>
      {onBack && <button style={{ background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer" }} onClick={onBack}>← Back</button>}
    </div>
  );
}

const s = {
  page:         { minHeight: "100vh", background: "#f8f9fa", fontFamily: "sans-serif", padding: 16 },
  container:    { maxWidth: 640, margin: "0 auto" },
  back:         { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 8 },
  title:        { fontSize: 24, fontWeight: 800, color: "#2d3436", marginBottom: 4 },
  sub:          { color: "#636e72", fontSize: 14, marginBottom: 20 },
  profileCard:  { background: "#fff", borderRadius: 16, padding: "28px 20px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  trendPill:    { padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 },
  statsRow:     { display: "flex", gap: 0, width: "100%", marginTop: 8, paddingTop: 16, borderTop: "1px solid #f0f0f0" },
  speedBg:      { height: 10, background: "#f0f0f0", borderRadius: 5, overflow: "visible", position: "relative" },
  speedFill:    { height: "100%", borderRadius: 5 },
  speedMarker:  { position: "absolute", top: -3, width: 16, height: 16, background: "#2d3436", borderRadius: "50%", transform: "translateX(-50%)" },
  tipsCard:     { background: "#fff", borderRadius: 14, padding: "18px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 14 },
  tipsTitle:    { fontSize: 15, fontWeight: 800, color: "#2d3436", marginBottom: 14 },
  tipRow:       { display: "flex", gap: 12, alignItems: "flex-start", padding: "8px 0", borderBottom: "1px solid #f0f0f0" },
  tipNum:       { width: 24, height: 24, background: "#6c63ff", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, flexShrink: 0 },
  actions:      { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 },
  btn:          { flex: 1, minWidth: 140, padding: "12px 16px", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  emptyCard:    { background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 },
  profileGuide: { background: "#fff", borderRadius: 14, padding: "18px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
};
