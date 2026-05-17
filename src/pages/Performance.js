import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

export default function Performance() {
  const nav = useNavigate();
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

  // FIX BUG 2: Add default values to prevent crashes
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
                  </div>
                  <div style={{ fontWeight: 800, color: barColor(sub.accuracy || 0), minWidth: 48, textAlign: "right" }}>
                    {sub.accuracy || 0}%
                  </div>
                </div>
              ))}
            </div>
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
                You have {total_wrong_answers} question{total_wrong_answers !== 1 ? 's' : ''} to review.
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
    <div style={{ background: "#fff", borderRadius: 12, padding: "14px 16px", flex: 1, minWidth: 100, boxShadow: "0 2px 10px rgba(0,0,0,0.06)", textAlign: "center" }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#636e72" }}>{label}</div>
    </div>
  );
}

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

const barColor = p => p >= 70 ? "#00b894" : p >= 50 ? "#fdcb6e" : "#e17055";

const s = {
  page:        { minHeight: "100vh", background: "#f8f9fa", fontFamily: "sans-serif", padding: 16 },
  container:   { maxWidth: 800, margin: "0 auto" },
  topRow:      { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
  back:        { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  title:       { fontSize: 22, fontWeight: 800 },
  statsRow:    { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 },
  alertBox:    { background: "#fff5f5", border: "2px solid #fab1a0", borderRadius: 14, padding: "16px 18px", marginBottom: 20 },
  weakGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginTop: 8 },
  weakCard:    { background: "#fff", borderRadius: 10, padding: 14, textAlign: "center", borderTop: "3px solid #e17055" },
  practiceBtn: { marginTop: 8, width: "100%", padding: "6px 0", background: "#e17055", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 12 },
  section:     { marginBottom: 20 },
  sectionTitle:{ fontSize: 16, fontWeight: 800, marginBottom: 12 },
  subjectGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 10 },
  subjectCard: { background: "#fff", borderRadius: 10, padding: "12px 14px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" },
  table:       { background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
  tableRow:    { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #f0f0f0" },
  barBg:       { height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" },
  barFill:     { height: "100%", borderRadius: 4, transition: "width 0.5s" },
  reviewCta:   { background: "linear-gradient(135deg,#6c63ff,#3f51b5)", borderRadius: 14, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", flexWrap: "wrap", gap: 12 },
  reviewBtn:   { background: "#fff", color: "#6c63ff", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 800, cursor: "pointer" },
  emptyState:  { background: "#fff", borderRadius: 14, padding: "40px 20px", textAlign: "center", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" },
  startExamBtn: { background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, padding: "12px 24px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
};