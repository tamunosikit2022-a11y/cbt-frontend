import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

// FIX BUG 35: Loader is defined locally (was used but never imported)
function Loader({ text, isError }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{isError ? "❌" : "⏳"}</div>
        <p style={{ color: isError ? "#e17055" : "#636e72" }}>{text}</p>
      </div>
    </div>
  );
}

export default function Performance() {
  const nav = useNavigate();
  const { student } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    API.get("/exam/performance")
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || "Failed to load performance data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader text="Loading your analytics..." />;
  if (error)   return <Loader text={error} isError />;
  if (!data)   return null;

  const {
    subjects = [],
    weak_subjects = [],
    strong_subjects = [],
    stats = {},
    total_wrong_answers = 0
  } = data;

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.topRow}>
          <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
          <h2 style={s.title}>📊 My Analytics</h2>
        </div>

        <div style={s.statsRow}>
          <StatCard icon="📝" label="Total Exams"   value={stats?.total_exams || 0}                           color="#6c63ff" />
          <StatCard icon="📈" label="Average Score" value={`${parseFloat(stats?.avg_score || 0).toFixed(1)}%`} color="#0984e3" />
          <StatCard icon="🏆" label="Best Score"    value={`${parseFloat(stats?.best_score || 0).toFixed(1)}%`} color="#00b894" />
          <StatCard icon="🔁" label="Need Review"   value={total_wrong_answers || 0}                          color="#e17055" />
        </div>

        {weak_subjects.length > 0 && (
          <div style={s.alertBox}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>⚠️ Weak Areas — Focus Here!</div>
            <div style={s.weakGrid}>
              {weak_subjects.map(sub => (
                <div key={sub.subject} style={s.weakCard}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{sub.subject}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#e17055" }}>{sub.accuracy}%</div>
                  <div style={{ fontSize: 11, color: "#636e72" }}>{sub.total_attempted || 0} attempts</div>
                  <button
                    style={s.practiceBtn}
                    onClick={() => nav(`/exam-select?subject=${encodeURIComponent(sub.subject)}&mode=weakness`)}>
                    Practice →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {strong_subjects.length > 0 && (
          <div style={s.section}>
            <h3 style={s.sectionTitle}>💪 Strong Subjects</h3>
            <div style={s.subjectGrid}>
              {strong_subjects.map(sub => (
                <div key={sub.subject} style={{ ...s.subjectCard, borderLeft: "4px solid #00b894" }}>
                  <div style={{ fontWeight: 700 }}>{sub.subject}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: "#00b894" }}>{sub.accuracy}%</div>
                  <div style={{ fontSize: 11, color: "#636e72" }}>{sub.total_correct || 0}/{sub.total_attempted || 0} correct</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {subjects.length > 0 && (
          <div style={s.section}>
            <h3 style={s.sectionTitle}>All Subjects</h3>
            <div style={s.table}>
              {subjects.map(sub => (
                <div key={sub.subject} style={s.tableRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{sub.subject}</div>
                    <div style={{ fontSize: 11, color: "#636e72" }}>{sub.total_attempted || 0} questions attempted</div>
                  </div>
                  <div style={{ width: 120, marginRight: 12 }}>
                    <div style={s.barBg}>
                      <div style={{ ...s.barFill, width: `${sub.accuracy || 0}%`, background: barColor(sub.accuracy || 0) }} />
                    </div>
                    {sub.national_avg != null && (
                      <div style={{ fontSize: 10, color: "#636e72", marginTop: 3 }}>
                        Nigeria avg: {sub.national_avg}%
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: "right", minWidth: 60 }}>
                    <div style={{ fontWeight: 800, color: barColor(sub.accuracy || 0) }}>
                      {sub.accuracy || 0}%
                    </div>
                    {sub.vs_national != null && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: sub.vs_national >= 0 ? "#00b894" : "#e17055" }}>
                        {sub.vs_national >= 0 ? "▲" : "▼"} {Math.abs(sub.vs_national)}% {sub.vs_national >= 0 ? "above" : "below"}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#636e72", marginTop: 8 }}>
              "Nigeria avg" compares your accuracy to other Scholars Syndicate students nationwide for each subject.
            </p>
          </div>
        )}

        {subjects.length === 0 && weak_subjects.length === 0 && (
          <div style={s.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No data yet</div>
            <div style={{ fontSize: 13, color: "#636e72", marginBottom: 16 }}>
              Complete some exams to see your performance analytics!
            </div>
            <button style={s.startExamBtn} onClick={() => nav("/exam-select")}>
              Start Your First Exam →
            </button>
          </div>
        )}

        {total_wrong_answers > 0 && (
          <div style={s.reviewCta}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>🔁 Error Review</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
                You have {total_wrong_answers} question{total_wrong_answers !== 1 ? "s" : ""} to review.
              </div>
            </div>
            <button style={s.reviewBtn} onClick={() => nav("/error-review")}>Start Review →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", flex: 1, minWidth: 100, textAlign: "center" }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

const barColor = p => p >= 70 ? "#00b894" : p >= 50 ? "#fdcb6e" : "#e17055";

const s = {
  page:        { minHeight: "100vh", background: "var(--bg)", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: 16, color: "#fff" },
  container:   { maxWidth: 800, margin: "0 auto" },
  topRow:      { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
  back:        { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  title:       { fontSize: 22, fontWeight: 800, color: "#fff" },
  statsRow:    { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 },
  alertBox:    { background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.3)", borderRadius: 14, padding: "16px 18px", marginBottom: 20 },
  weakGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginTop: 8 },
  weakCard:    { background: "var(--surface)", borderRadius: 10, padding: 14, textAlign: "center", borderTop: "3px solid #e17055" },
  practiceBtn: { marginTop: 8, width: "100%", padding: "6px 0", background: "#e17055", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 12 },
  section:     { marginBottom: 20 },
  sectionTitle:{ fontSize: 16, fontWeight: 800, marginBottom: 12, color: "#fff" },
  subjectGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 },
  subjectCard: { background: "var(--surface)", borderRadius: 10, padding: "12px 14px" },
  table:       { background: "var(--surface)", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" },
  tableRow:    { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  barBg:       { height: 8, background: "var(--surface)", borderRadius: 4, overflow: "hidden" },
  barFill:     { height: "100%", borderRadius: 4, transition: "width 0.5s" },
  reviewCta:   { background: "linear-gradient(135deg,#6c63ff,#3f51b5)", borderRadius: 14, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", flexWrap: "wrap", gap: 12 },
  reviewBtn:   { background: "#fff", color: "#6c63ff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, cursor: "pointer" },
  emptyState:  { background: "var(--surface)", borderRadius: 14, padding: "40px 20px", textAlign: "center", border: "1px solid rgba(255,255,255,0.07)" },
  startExamBtn: { background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
};
