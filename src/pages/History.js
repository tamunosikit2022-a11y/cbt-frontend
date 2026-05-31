import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

export default function History() {
  const nav = useNavigate();
  const { student } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("all"); // all | JAMB | POST-UTME
  const [error,   setError]   = useState("");

  useEffect(() => {
    API.get("/exam/history")
      .then(r => {
        // Ensure we're setting an array
        const data = Array.isArray(r.data) ? r.data : [];
        setHistory(data);
      })
      .catch(err => {
        console.error("Failed to load history:", err);
        setError(err.response?.data?.error || "Failed to load history. Please try again.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Safely filter history - ensure history is an array
  const safeHistory = Array.isArray(history) ? history : [];
  
  const filtered = filter === "all" 
    ? safeHistory 
    : safeHistory.filter(h => h && h.exam_type === filter);

  // Handle empty filtered array safely
  const avgScore = filtered.length
    ? (filtered.reduce((a, h) => {
        const percentage = h && h.percentage ? parseFloat(h.percentage) : 0;
        return a + percentage;
      }, 0) / filtered.length).toFixed(1)
    : 0;

  // FIX BUG 1: Best score formatted to integer (no decimal places)
  const best = filtered.length
    ? Math.max(...filtered.map(h => h && h.percentage ? parseFloat(h.percentage) : 0)).toFixed(0)
    : 0;

  const scoreColor = (p) => {
    const percent = parseFloat(p) || 0;
    return percent >= 70 ? "#00b894" : percent >= 50 ? "#fdcb6e" : "#e17055";
  };

  // Handle error state
  if (error) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <div style={s.topRow}>
            <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
            <h2 style={s.title}>Exam History</h2>
          </div>
          <div style={s.empty}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <p>{error}</p>
            <button 
              style={{ ...s.tab, background: "#6c63ff", color: "#fff", marginTop: 16, border: "none" }}
              onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.topRow}>
          <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
          <h2 style={s.title}>Exam History</h2>
        </div>

        {/* SUMMARY */}
        {filtered.length > 0 && (
          <div style={s.summary}>
            <SumCard label="Total Exams" value={filtered.length}    color="#6c63ff" icon="📝" />
            <SumCard label="Average Score" value={`${avgScore}%`}   color="#0984e3" icon="📈" />
            <SumCard label="Best Score"    value={`${best}%`}       color="#00b894" icon="🏆" />
          </div>
        )}

        {/* FILTER TABS */}
        <div style={s.tabs}>
          {["all","JAMB","POST-UTME"].map(f => (
            <button key={f}
              style={{ ...s.tab, background: filter === f ? "#6c63ff" : "rgba(255,255,255,0.05)", color: filter === f ? "#fff" : "rgba(255,255,255,0.6)", border: filter === f ? "none" : "1px solid rgba(255,255,255,0.12)" }}
              onClick={() => setFilter(f)}>
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>

        {/* LIST */}
        {loading ? (
          <p style={{ textAlign: "center", color: "#636e72", padding: 40 }}>Loading history...</p>
        ) : filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p>No exams yet. <span style={{ color: "#6c63ff", cursor: "pointer" }} onClick={() => nav("/exam-select")}>Start one now →</span></p>
          </div>
        ) : (
          <div style={s.list}>
            {filtered.map(h => (
              <div key={h.id} style={s.row}>
                {/* FIX BUG 2: Score circle shows rounded integer percentage */}
                <div style={{ ...s.scoreCircle, borderColor: scoreColor(h.percentage), color: scoreColor(h.percentage) }}>
                  {parseFloat(h.percentage).toFixed(0)}%
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{h.subject}</div>
                  <div style={{ fontSize: 12, color: "#636e72", marginTop: 2 }}>
                    {h.exam_type}{h.institution ? ` · ${h.institution}` : ""} · {h.mode} mode
                  </div>
                  <div style={{ fontSize: 12, color: "#b2bec3", marginTop: 1 }}>
                    {new Date(h.completed_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}
                    {" "}&middot; {h.total_questions} questions
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, color: scoreColor(h.percentage) }}>
                    {h.score}/{h.total_questions}
                  </div>
                  <div style={{ fontSize: 11, color: "#b2bec3", marginTop: 2 }}>
                    {Math.round(h.time_taken_seconds / 60)} mins
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Token upsell — directs to tokens page */}
        {filtered.length > 0 && (
          <div
            onClick={() => nav("/tokens")}
            style={{ background:"linear-gradient(135deg,#1a1040,#0d1a30)", border:"1px solid #6c63ff44", borderRadius:16, padding:"16px", marginTop:16, cursor:"pointer", display:"flex", gap:12, alignItems:"center" }}>
            <span style={{ fontSize:28, flexShrink:0 }}>🪙</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:13, color:"#fff", marginBottom:3 }}>Get detailed error explanations</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.5)" }}>Use AI Tutor to understand why you got questions wrong. 1 token per message.</div>
            </div>
            <span style={{ color:"#6c63ff", fontSize:18 }}>→</span>
          </div>
        )}
      </div>
    </div>
  );
}

function SumCard({ label, value, color, icon }) {
  return (
    <div style={{ flex: 1, background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#636e72" }}>{label}</div>
    </div>
  );
}

const s = {
  page:      { minHeight: "100vh", background: "#0B1020", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: 16, color: "#fff" },
  container: { maxWidth: 680, margin: "0 auto" },
  topRow:    { display: "flex", alignItems: "center", gap: 16, marginBottom: 20 },
  back:      { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  title:     { fontSize: 22, fontWeight: 800, color: "#fff" },
  summary:   { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  tabs:      { display: "flex", gap: 8, marginBottom: 16 },
  tab:       { padding: "8px 16px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" },
  list:      { display: "flex", flexDirection: "column", gap: 10 },
  row:       { background: "#111827", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 },
  scoreCircle:{ width: 54, height: 54, borderRadius: "50%", border: "3px solid", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 },
  empty:     { textAlign: "center", padding: 60, color: "rgba(255,255,255,0.4)" },
};