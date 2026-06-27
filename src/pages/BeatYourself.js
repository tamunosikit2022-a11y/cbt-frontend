import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

export default function BeatYourself() {
  const nav = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [subject, setSubject] = useState("");

  useEffect(() => {
    API.get(`/phase2/beat-yourself${subject ? `?subject=${encodeURIComponent(subject)}` : ""}`)
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [subject]);

  if (loading) return <Loader text="Loading your records..." />;

  const subjects = data?.best_scores || [];
  const records  = data?.recent_attempts || [];

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
        <h2 style={s.title}>💪 Beat Yourself Mode</h2>
        <p style={s.sub}>Challenge your own past performance — can you beat your best score?</p>

        {/* OVERVIEW STATS */}
        {data && (
          <div style={s.statsRow}>
            <StatCard label="Times Beaten"   value={data.beaten_count}   color="#00b894" icon="🏆" />
            <StatCard label="Total Attempts" value={data.total_attempts} color="#6c63ff" icon="🎯" />
            <StatCard label="Beat Rate"      value={`${data.beat_rate}%`} color="#fdcb6e" icon="📈" />
          </div>
        )}

        {/* PERSONAL BESTS */}
        {subjects.length > 0 && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>🏆 Your Personal Bests</h3>
            <p style={{ fontSize: 13, color: "#636e72", marginBottom: 14 }}>
              Start an exam in any subject — after you finish, we'll tell you if you beat your best!
            </p>
            {subjects.map((subj, i) => (
              <div key={i} style={s.subjRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{subj.subject}</div>
                  <div style={{ fontSize: 12, color: "#636e72" }}>{subj.total_attempts} attempts · avg {parseFloat(subj.avg_score).toFixed(0)}%</div>
                  <div style={s.barBg}>
                    <div style={{ ...s.barFill, width: `${subj.best_score}%`, background: parseFloat(subj.best_score) >= 70 ? "#00b894" : parseFloat(subj.best_score) >= 50 ? "#fdcb6e" : "#e17055" }} />
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 80 }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "#6c63ff" }}>{parseFloat(subj.best_score).toFixed(0)}%</div>
                  <div style={{ fontSize: 10, color: "#636e72" }}>Personal Best</div>
                  <button style={s.beatBtn}
                    onClick={() => nav(`/exam-select?subject=${encodeURIComponent(subj.subject)}&beat=true`)}>
                    Beat It →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RECENT ATTEMPTS */}
        {records.length > 0 && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>📋 Recent Beat Yourself Attempts</h3>
            {records.map((r, i) => (
              <div key={i} style={s.recordRow}>
                <div style={{ fontSize: 28 }}>{r.beat ? "🏆" : "💪"}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{r.subject}</div>
                  <div style={{ fontSize: 12, color: "#636e72" }}>
                    {new Date(r.attempt_date).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 16, color: r.beat ? "#00b894" : "#e17055" }}>
                    {r.current_score}%
                  </div>
                  <div style={{ fontSize: 11, color: "#636e72" }}>
                    {r.beat
                      ? `+${parseFloat(r.improvement).toFixed(1)}% above best!`
                      : `${parseFloat(r.improvement).toFixed(1)}% vs best ${r.baseline_score}%`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {subjects.length === 0 && (
          <div style={s.emptyCard}>
            <div style={{ fontSize: 48 }}>🎯</div>
            <p style={{ color: "#636e72", textAlign: "center" }}>
              Take your first exam to set a personal best. Then every future exam will show if you beat it!
            </p>
            <button style={s.btn} onClick={() => nav("/exam-select")}>Start First Exam →</button>
          </div>
        )}

        <button style={s.btn} onClick={() => nav("/exam-select")}>
          🎯 Start an Exam Now →
        </button>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{ flex: 1, background: "#fff", borderRadius: 12, padding: "14px 16px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize: 24 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 900, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#636e72" }}>{label}</div>
    </div>
  );
}

function Loader({ text }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <p style={{ color: "#636e72" }}>⏳ {text}</p>
    </div>
  );
}

const s = {
  page:      { minHeight: "100vh", background: "#f8f9fa", fontFamily: "sans-serif", padding: 16 },
  container: { maxWidth: 640, margin: "0 auto" },
  back:      { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 8 },
  title:     { fontSize: 24, fontWeight: 800, color: "#2d3436", marginBottom: 4 },
  sub:       { color: "#636e72", fontSize: 14, marginBottom: 20 },
  statsRow:  { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  card:      { background: "#fff", borderRadius: 14, padding: "18px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: 800, color: "#2d3436", marginBottom: 14 },
  subjRow:   { display: "flex", gap: 14, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" },
  barBg:     { height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden", marginTop: 6 },
  barFill:   { height: "100%", borderRadius: 3, transition: "width 0.5s" },
  beatBtn:   { marginTop: 4, padding: "4px 10px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 11 },
  recordRow: { display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f0f0f0" },
  emptyCard: { background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 14 },
  btn:       { width: "100%", padding: "13px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 15, marginTop: 4 },
};
