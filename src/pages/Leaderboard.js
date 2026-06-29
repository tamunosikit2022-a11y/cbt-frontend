import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

export default function Leaderboard() {
  const nav = useNavigate();
  const back           = useBackNav();
  const { student } = useAuth();
  const [board,   setBoard]   = useState([]);
  const [period,  setPeriod]  = useState("all");
  const [subject, setSubject] = useState("");
  const [subjects,setSubjects]= useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Fetch subjects
  useEffect(() => {
    API.get("/exam/subjects?exam_type=JAMB")
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        setSubjects(data);
      })
      .catch(err => {
        console.error("Failed to load subjects:", err);
        setSubjects([]);
      });
  }, []);

  // Fetch leaderboard
  useEffect(() => {
    setLoading(true);
    setError("");
    const q = new URLSearchParams({ period });
    if (subject) q.set("subject", subject);
    API.get(`/exam/leaderboard?${q}`)
      .then(r => {
        const data = Array.isArray(r.data) ? r.data : [];
        setBoard(data);
      })
      .catch(err => {
        console.error("Failed to load leaderboard:", err);
        setError(err.response?.data?.error || "Failed to load leaderboard. Please try again.");
        setBoard([]);
      })
      .finally(() => setLoading(false));
  }, [period, subject]);

  // FIX BUG 3: Convert both IDs to strings for safe comparison
  const myRank = board.findIndex(r => String(r.id) === String(student?.id));
  
  // Safely get the current user's entry if found
  const myEntry = myRank !== -1 ? board[myRank] : null;

  const rankStyle = (rank) => {
    if (rank === 1) return { bg: "#FFD700", icon: "🥇" };
    if (rank === 2) return { bg: "#C0C0C0", icon: "🥈" };
    if (rank === 3) return { bg: "#CD7F32", icon: "🥉" };
    return { bg: "#f0f0f0", icon: null };
  };

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
            <button style={s.back} onClick={() => back()}>← Dashboard</button>
            <h2 style={s.title}>🏆 Leaderboard</h2>
          </div>
          <div style={s.empty}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <p>{error}</p>
            <button 
              style={{ ...s.tab, background: "#6c63ff", color: "#fff", marginTop: 16, border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer" }}
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
          <button style={s.back} onClick={() => back()}>← Dashboard</button>
          <h2 style={s.title}>🏆 Leaderboard</h2>
        </div>

        {/* MY RANK BANNER - Only show if user is on the board */}
        {myRank !== -1 && myEntry && (
          <div style={s.myRankBanner}>
            <span>Your rank:</span>
            <span style={{ fontWeight: 800, fontSize: 20 }}>#{myEntry.rank || myRank + 1}</span>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>
              Avg: {myEntry.avg_score}%
            </span>
          </div>
        )}

        {/* FILTERS */}
        <div style={s.filters}>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Period</label>
            <div style={s.tabs}>
              {[["all","All Time"],["weekly","This Week"],["daily","Today"]].map(([v,l]) => (
                <button key={v}
                  style={{ ...s.tab, background: period === v ? "#6c63ff" : "#fff", color: period === v ? "#fff" : "#636e72" }}
                  onClick={() => setPeriod(v)}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Subject</label>
            <select style={s.select} value={subject} onChange={e => setSubject(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map(s2 => <option key={s2} value={s2}>{s2}</option>)}
            </select>
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>Loading...</p>
        ) : board.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <p>No data yet. Be the first on the board!</p>
          </div>
        ) : (
          <div style={s.list}>
            {board.map((entry, i) => {
              const rs = rankStyle(entry.rank);
              // FIX BUG 3: Use String() comparison for IDs
              const isMe = String(entry.id) === String(student?.id);
              return (
                <div key={entry.id} style={{ ...s.row, background: isMe ? "#f0edff" : "#fff", border: isMe ? "2px solid #6c63ff" : "2px solid transparent" }}>
                  <div style={{ ...s.rankBadge, background: rs.bg, color: entry.rank <= 3 ? "#fff" : "#636e72" }}>
                    {rs.icon || `#${entry.rank}`}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {entry.full_name} {isMe && <span style={{ color: "#6c63ff", fontSize: 12 }}>(You)</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {entry.exams_taken} exams taken · Best: {entry.best_score}%
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 20, color: scoreColor(entry.avg_score) }}>
                      {entry.avg_score}%
                    </div>
                    <div style={{ fontSize: 11, color: "#b2bec3" }}>avg score</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:         { minHeight: "100vh", background: "var(--bg)", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: 16 },
  container:    { maxWidth: 680, margin: "0 auto" },
  topRow:       { display: "flex", alignItems: "center", gap: 16, marginBottom: 16 },
  back:         { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  title:        { fontSize: 22, fontWeight: 800 },
  myRankBanner: { background: "linear-gradient(135deg,#6c63ff,#3f51b5)", color: "#fff", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, marginBottom: 16 },
  filters:      { background: "var(--surface)", borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.05)", display: "flex", gap: 16, flexWrap: "wrap" },
  filterGroup:  { flex: 1, minWidth: 200 },
  filterLabel:  { display: "block", fontWeight: 700, fontSize: 12, color: "var(--text-muted)", marginBottom: 6 },
  tabs:         { display: "flex", gap: 6 },
  tab:          { padding: "7px 12px", border: "2px solid #dfe6e9", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12, background: "var(--surface)" },
  select:       { width: "100%", padding: "8px 10px", border: "2px solid #dfe6e9", borderRadius: 8, fontSize: 14, background: "var(--surface)" },
  list:         { display: "flex", flexDirection: "column", gap: 8 },
  row:          { borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 1px 8px rgba(0,0,0,0.04)" },
  rankBadge:    { width: 44, height: 44, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 },
  empty:        { textAlign: "center", padding: 60, color: "var(--text-muted)" },
};