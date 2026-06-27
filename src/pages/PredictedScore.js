import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

export default function PredictedScore() {
  const nav = useNavigate();
  const { student } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    API.get("/innovations/predicted-score")
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Calculating your predicted score..." />;
  if (error)   return <Loader text={error} isError onBack={() => nav("/dashboard")} />;

  const score      = data.predicted_jamb_score;
  const scoreColor = score >= 300 ? "#00b894" : score >= 250 ? "#0984e3" : score >= 200 ? "#fdcb6e" : "#e17055";
  const scoreLabel = score >= 300 ? "Excellent 🏆" : score >= 250 ? "Good 👍" : score >= 200 ? "Average 😐" : "Needs Work 💪";

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
        <h2 style={s.title}>🎓 Predicted JAMB Score</h2>
        <p style={s.sub}>Based on your performance across all subjects</p>

        {/* MAIN SCORE */}
        <div style={{ ...s.scoreCard, borderTop: `6px solid ${scoreColor}` }}>
          <div style={{ fontSize: 80, fontWeight: 900, color: scoreColor, lineHeight: 1 }}>{score}</div>
          <div style={{ fontSize: 22, color: "#636e72" }}>out of 400</div>
          <div style={{ fontWeight: 800, fontSize: 18, marginTop: 8, color: "#2d3436" }}>{scoreLabel}</div>
          <div style={{ ...s.confidencePill, background: data.confidence === "High" ? "#e8f8f5" : data.confidence === "Medium" ? "#fff9e6" : "#ffeae9", color: data.confidence === "High" ? "#00b894" : data.confidence === "Medium" ? "#b7860b" : "#e17055" }}>
            {data.confidence} Confidence — {data.confidence === "High" ? "Based on 4+ subjects with solid data" : data.confidence === "Medium" ? "Take more exams for better accuracy" : "Take more exams to improve prediction"}
          </div>
          <p style={s.advice}>💡 {data.advice}</p>
        </div>

        {/* TOP 4 SUBJECTS */}
        {data.top_4_subjects?.length > 0 && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>📊 Your Top 4 Subjects (JAMB calculation)</h3>
            <div style={s.subjectGrid}>
              {data.top_4_subjects.map((subj, i) => (
                <div key={i} style={s.subjCard}>
                  <div style={{ fontSize: 11, color: "#636e72", marginBottom: 4 }}>{subj.subject}</div>
                  <div style={{ fontSize: 28, fontWeight: 900, color: subj.predicted >= 60 ? "#00b894" : "#e17055" }}>{subj.predicted}</div>
                  <div style={{ fontSize: 11, color: "#636e72" }}>/100</div>
                  <div style={s.trendPill}>
                    {subj.trend === "improving" ? "📈 Improving" : subj.trend === "declining" ? "📉 Declining" : "➡️ Stable"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALL SUBJECTS BREAKDOWN */}
        {data.breakdown?.length > 0 && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>📈 Full Subject Breakdown</h3>
            {data.breakdown.map((subj, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{subj.subject}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontSize: 11, color: "#636e72" }}>{subj.attempts} attempts</span>
                    <span style={{ fontWeight: 800, color: subj.predicted >= 60 ? "#00b894" : "#e17055" }}>{subj.predicted}/100</span>
                  </div>
                </div>
                <div style={s.barBg}>
                  <div style={{ ...s.barFill, width: `${subj.predicted}%`, background: subj.predicted >= 60 ? "#00b894" : subj.predicted >= 40 ? "#fdcb6e" : "#e17055" }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* IMPROVEMENTS */}
        {data.improvement_areas?.length > 0 && (
          <div style={{ ...s.card, borderLeft: "4px solid #e17055" }}>
            <h3 style={{ ...s.cardTitle, color: "#e17055" }}>🎯 Focus Areas to Boost Score</h3>
            {data.improvement_areas.map((area, i) => (
              <div key={i} style={s.improveRow}>
                <span style={{ fontWeight: 600, flex: 1 }}>{area.subject}</span>
                <span style={{ fontSize: 13, color: "#e17055" }}>Currently {area.current}/100 · Need +{area.needed} pts</span>
              </div>
            ))}
            <button style={s.practiceBtn} onClick={() => nav("/exam-select")}>Practice These Subjects →</button>
          </div>
        )}

        {data.breakdown?.length === 0 && (
          <div style={s.emptyState}>
            <div style={{ fontSize: 48 }}>📝</div>
            <p style={{ color: "#636e72", textAlign: "center" }}>Take exams in at least 2 subjects to see your predicted JAMB score.</p>
            <button style={s.practiceBtn} onClick={() => nav("/exam-select")}>Start Practicing →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function Loader({ text, isError, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: "sans-serif" }}>
      <div style={{ fontSize: 36 }}>{isError ? "❌" : "⏳"}</div>
      <p style={{ color: isError ? "#e17055" : "var(--text-muted)" }}>{text}</p>
      {onBack && <button style={{ background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer" }} onClick={onBack}>← Back</button>}
    </div>
  );
}

const s = {
  page:           { minHeight: "100vh", background: "var(--bg)", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: 16, color: "#fff" },
  container:      { maxWidth: 640, margin: "0 auto" },
  back:           { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 8 },
  title:          { fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 4 },
  sub:            { color: "var(--text-muted)", marginBottom: 20, fontSize: 14 },
  scoreCard:      { background: "var(--surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 24px", textAlign: "center", marginBottom: 16, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  confidencePill: { padding: "6px 16px", borderRadius: 20, fontSize: 12, fontWeight: 600 },
  advice:         { color: "var(--text-muted)", fontSize: 14, textAlign: "center", maxWidth: 400, lineHeight: 1.6 },
  card:           { background: "var(--surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "18px 16px", marginBottom: 14 },
  cardTitle:      { fontSize: 15, fontWeight: 800, color: "#fff", marginBottom: 14 },
  subjectGrid:    { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 },
  subjCard:       { background: "var(--surface)", borderRadius: 10, padding: "12px 14px", textAlign: "center" },
  trendPill:      { fontSize: 10, marginTop: 4, color: "var(--text-muted)" },
  barBg:          { height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" },
  barFill:        { height: "100%", borderRadius: 4, transition: "width 0.5s" },
  improveRow:     { display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", alignItems: "center" },
  practiceBtn:    { marginTop: 12, width: "100%", padding: 12, background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  emptyState:     { background: "var(--surface)", borderRadius: 14, padding: 32, textAlign: "center", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
};
