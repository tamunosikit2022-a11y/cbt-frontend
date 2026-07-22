import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const SCOPES = [
  { key: "global",  label: "Global"  },
  { key: "school",  label: "School"  },
  { key: "friends", label: "Friends" },
];

export default function Leaderboard() {
  const nav = useNavigate();
  const back = useBackNav();
  const { student } = useAuth();
  const [board,    setBoard]    = useState([]);
  const [scope,    setScope]    = useState("global");
  const [period,   setPeriod]   = useState("all");
  const [subject,  setSubject]  = useState("");
  const [subjects, setSubjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    API.get("/exam/subjects?exam_type=JAMB")
      .then(r => setSubjects(Array.isArray(r.data) ? r.data : []))
      .catch(() => setSubjects([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    const q = new URLSearchParams({ period, scope });
    if (subject) q.set("subject", subject);
    API.get(`/exam/leaderboard?${q}`)
      .then(r => setBoard(Array.isArray(r.data) ? r.data : []))
      .catch(err => {
        setError(err.response?.data?.error || "Failed to load leaderboard. Please try again.");
        setBoard([]);
      })
      .finally(() => setLoading(false));
  }, [period, subject, scope]);

  const myRank  = board.findIndex(r => String(r.id) === String(student?.id));
  const myEntry = myRank !== -1 ? board[myRank] : null;

  const initials = (name) => (name || "?").split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase();

  const podium = board.slice(0, 3);
  const rest   = board.slice(3);

  const EMPTY_COPY = {
    global:  "No data yet. Be the first on the board!",
    school:  "No one from your school has ranked yet — invite classmates to compete!",
    friends: "None of your friends have exam scores yet. Add friends from the Social tab.",
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.topRow}>
          <button style={s.back} onClick={() => back()}>←</button>
          <div>
            <h2 style={s.title}>🏆 Leaderboard</h2>
            <p style={s.subtitle}>See how you stack up</p>
          </div>
        </div>

        {/* SCOPE TABS — Global / School / Friends */}
        <div style={s.scopeTabs}>
          {SCOPES.map(sc => (
            <button key={sc.key}
              style={{ ...s.scopeTab, ...(scope === sc.key ? s.scopeTabActive : {}) }}
              onClick={() => setScope(sc.key)}>
              {sc.label}
            </button>
          ))}
        </div>

        {/* MY RANK BANNER */}
        {myRank !== -1 && myEntry && (
          <div style={s.myRankBanner}>
            <span>Your rank:</span>
            <span style={{ fontWeight: 800, fontSize: 20 }}>#{myEntry.rank}</span>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Avg: {myEntry.avg_score}%</span>
          </div>
        )}

        {/* FILTERS */}
        <div style={s.filters}>
          <div style={s.filterGroup}>
            <label style={s.filterLabel}>Period</label>
            <div style={s.tabs}>
              {[["all","All Time"],["weekly","This Week"],["daily","Today"]].map(([v,l]) => (
                <button key={v}
                  style={{ ...s.tab, background: period === v ? "#6c63ff" : "transparent", color: period === v ? "#fff" : "var(--text-muted)" }}
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

        {error ? (
          <div style={s.empty}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <p>{error}</p>
            <button style={s.retryBtn} onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>Loading...</p>
        ) : board.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 48 }}>🏆</div>
            <p>{EMPTY_COPY[scope]}</p>
          </div>
        ) : (
          <>
            {/* PODIUM — top 3 */}
            {podium.length > 0 && (
              <div style={s.podiumRow}>
                {/* Order visually as 2nd, 1st, 3rd like a real podium */}
                {[podium[1], podium[0], podium[2]].map((entry, idx) => {
                  if (!entry) return <div key={idx} style={{ flex: 1 }} />;
                  const place = entry.rank; // 1, 2, or 3
                  const height = place === 1 ? 96 : place === 2 ? 74 : 60;
                  const crown  = place === 1 ? "👑" : place === 2 ? "🥈" : "🥉";
                  const isMe   = String(entry.id) === String(student?.id);
                  return (
                    <div key={entry.id} style={s.podiumCol}>
                      <div style={{ fontSize: place === 1 ? 22 : 18 }}>{crown}</div>
                      <div style={{ ...s.podiumAvatar, width: place === 1 ? 56 : 46, height: place === 1 ? 56 : 46, border: isMe ? "2px solid #6c63ff" : "2px solid rgba(255,255,255,0.15)" }}>
                        {entry.avatar_url
                          ? <img src={entry.avatar_url} alt="" style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }} />
                          : initials(entry.full_name)}
                      </div>
                      <div style={s.podiumName}>{(entry.full_name || "Anonymous").split(" ")[0]}{isMe ? " (You)" : ""}</div>
                      <div style={s.podiumXP}>{entry.avg_score}%</div>
                      <div style={{ ...s.podiumBar, height }} />
                    </div>
                  );
                })}
              </div>
            )}

            {/* RANKED LIST — 4th onward */}
            <div style={s.list}>
              {rest.map((entry) => {
                const isMe = String(entry.id) === String(student?.id);
                return (
                  <div key={entry.id} style={{ ...s.row, background: isMe ? "rgba(124,92,255,0.12)" : "var(--surface)", border: isMe ? "2px solid #6c63ff" : "2px solid transparent" }}>
                    <div style={s.rankBadge}>#{entry.rank}</div>
                    <div style={s.rowAvatar}>
                      {entry.avatar_url
                        ? <img src={entry.avatar_url} alt="" style={{ width:"100%", height:"100%", borderRadius:"50%", objectFit:"cover" }} />
                        : initials(entry.full_name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>
                        {entry.full_name || "Anonymous"} {isMe && <span style={{ color: "#6c63ff", fontSize: 12 }}>(You)</span>}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-muted)" }}>
                        {entry.exams_taken} exams · Best: {entry.best_score}%
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 800, fontSize: 16, color: "var(--text)" }}>{entry.avg_score}%</div>
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)" }}>avg score</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const s = {
  page:       { minHeight: "100vh", background: "var(--bg)", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: 16, paddingBottom: 40 },
  container:  { maxWidth: 680, margin: "0 auto" },
  topRow:     { display: "flex", alignItems: "center", gap: 14, marginBottom: 16 },
  back:       { background: "var(--surface-alt)", border: "1px solid var(--border)", color: "var(--text)", borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 16, flexShrink: 0 },
  title:      { fontSize: 19, fontWeight: 800, color: "var(--text)" },
  subtitle:   { fontSize: 12.5, color: "var(--text-muted)", marginTop: 2 },

  scopeTabs:      { display: "flex", gap: 6, background: "var(--surface-alt)", borderRadius: 12, padding: 5, marginBottom: 14 },
  scopeTab:       { flex: 1, padding: "9px 0", borderRadius: 9, border: "none", background: "transparent", color: "var(--text-muted)", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif" },
  scopeTabActive: { background: "#6c63ff", color: "#fff" },

  myRankBanner: { background: "linear-gradient(135deg,#6c63ff,#3f51b5)", color: "#fff", borderRadius: 12, padding: "14px 20px", display: "flex", alignItems: "center", gap: 16, marginBottom: 16 },
  filters:      { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: 16, marginBottom: 20, display: "flex", gap: 16, flexWrap: "wrap" },
  filterGroup:  { flex: 1, minWidth: 200 },
  filterLabel:  { display: "block", fontWeight: 700, fontSize: 11.5, color: "var(--text-muted)", marginBottom: 6, textTransform:"uppercase", letterSpacing:".04em" },
  tabs:         { display: "flex", gap: 6 },
  tab:          { padding: "7px 12px", border: "1px solid var(--border)", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12, fontFamily: "'Plus Jakarta Sans',sans-serif" },
  select:       { width: "100%", padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 8, fontSize: 14, background: "var(--surface)", color: "var(--text)" },

  podiumRow:    { display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 10, marginBottom: 24, padding: "10px 0 0" },
  podiumCol:    { flex: 1, maxWidth: 120, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 },
  podiumAvatar: { borderRadius: "50%", background: "linear-gradient(135deg,#7C5CFF,#5B8CFF)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 15, overflow: "hidden", flexShrink: 0 },
  podiumName:   { fontSize: 11.5, fontWeight: 700, color: "var(--text)", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" },
  podiumXP:     { fontSize: 11, fontWeight: 800, color: "#6c63ff" },
  podiumBar:    { width: "100%", background: "linear-gradient(180deg,rgba(124,92,255,.35),rgba(124,92,255,.08))", borderRadius: "10px 10px 0 0", marginTop: 4 },

  list:         { display: "flex", flexDirection: "column", gap: 8 },
  row:          { borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 },
  rankBadge:    { width: 28, textAlign: "center", fontWeight: 800, fontSize: 12.5, color: "var(--text-muted)", flexShrink: 0 },
  rowAvatar:    { width: 38, height: 38, borderRadius: "50%", background: "linear-gradient(135deg,#7C5CFF,#5B8CFF)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 12.5, overflow: "hidden", flexShrink: 0 },
  empty:        { textAlign: "center", padding: 60, color: "var(--text-muted)" },
  retryBtn:     { background: "#6c63ff", color: "#fff", marginTop: 16, border: "none", padding: "8px 16px", borderRadius: 8, cursor: "pointer", fontFamily: "'Plus Jakarta Sans',sans-serif", fontWeight: 700 },
};
