/**
 * UniversityLeaderboard.js — /university-leaderboard
 * Scoreboard for university-specific exams (exam_type=UNIVERSITY), ranked
 * by average score within that institution — separate from the global
 * JAMB leaderboard so a UNIPORT student's ranking isn't buried under
 * thousands of JAMB-only scores.
 */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const C = {
  bg: "var(--bg,#0A0A0F)", surf: "var(--surface,#13131A)", surfA: "var(--surface-alt,#1C1C26)",
  border: "var(--border,rgba(255,255,255,0.08))", text: "var(--text,#FFFFFF)",
  sub: "var(--text-sub,#D1D5DB)", muted: "var(--text-muted,#6B7280)",
  p: "var(--primary,#7C5CFF)", pL: "var(--primary-light,#A98BFF)",
  acc: "var(--accent,#00D4AA)", gold: "var(--gold,#F59E0B)",
};

// Fallback list — used if the backend has no UNIVERSITY-type questions yet
// for a school, so the picker still has something sensible in it. Matches
// the `institution` codes actually stored in the questions table (short
// codes like "UNIPORT", not full names) — using the full name here used to
// silently return an empty scoreboard for any real UNIPORT data.
const FALLBACK_SCHOOLS = [
  "UNIPORT",
  "UI",
  "UNILAG",
  "OAU",
];

function rankStyle(rank) {
  if (rank === 1) return { bg: "#FFD700", icon: "🥇" };
  if (rank === 2) return { bg: "#C0C0C0", icon: "🥈" };
  if (rank === 3) return { bg: "#CD7F32", icon: "🥉" };
  return { bg: C.surfA, icon: null };
}

const scoreColor = (p) => {
  const pct = parseFloat(p) || 0;
  return pct >= 70 ? C.acc : pct >= 50 ? C.gold : "#EF4444";
};

export default function UniversityLeaderboard() {
  const nav = useNavigate();
  const back = useBackNav();
  const { student } = useAuth();
  const [params, setParams] = useSearchParams();

  const [schools, setSchools] = useState([]);
  const [institution, setInstitution] = useState(params.get("institution") || "");
  const [period, setPeriod] = useState("all");
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [error, setError] = useState("");

  // Load the list of universities that actually have questions
  useEffect(() => {
    API.get("/exam/institutions?exam_type=UNIVERSITY")
      .then(r => {
        const list = Array.isArray(r.data) && r.data.length ? r.data : FALLBACK_SCHOOLS;
        setSchools(list);
        if (!institution) setInstitution(params.get("institution") || list[0]);
      })
      .catch(() => setSchools(FALLBACK_SCHOOLS))
      .finally(() => setLoadingSchools(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBoard = useCallback(() => {
    if (!institution) return;
    setLoading(true);
    setError("");
    const q = new URLSearchParams({ institution, period });
    API.get(`/exam/university-leaderboard?${q}`)
      .then(r => setBoard(Array.isArray(r.data) ? r.data : []))
      .catch(err => {
        setError(err.response?.data?.error || "Failed to load scoreboard.");
        setBoard([]);
      })
      .finally(() => setLoading(false));
  }, [institution, period]);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  const selectSchool = (name) => {
    setInstitution(name);
    setParams({ institution: name });
  };

  const myRank = board.findIndex(r => String(r.id) === String(student?.id));
  const myEntry = myRank !== -1 ? board[myRank] : null;

  const s = {
    page: { minHeight: "100dvh", background: C.bg, color: C.text, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" },
    header: { background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10, backdropFilter: "blur(12px)" },
    back: { background: "none", border: "none", color: C.pL, fontWeight: 700, cursor: "pointer", fontSize: 14, flexShrink: 0 },
    container: { maxWidth: 720, margin: "0 auto", padding: "18px 14px 60px" },
    chipRow: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 },
    chip: (active) => ({
      padding: "7px 13px", borderRadius: 10, fontSize: 12.5, fontWeight: active ? 800 : 600,
      cursor: "pointer", border: `1px solid ${active ? C.p + "70" : C.border}`,
      background: active ? `${C.p}20` : C.surf, color: active ? C.pL : C.muted,
      whiteSpace: "nowrap",
    }),
    periodRow: { display: "flex", gap: 8, marginBottom: 18 },
    row: (highlight) => ({
      display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
      borderRadius: 12, marginBottom: 8,
      background: highlight ? `${C.p}14` : C.surf,
      border: `1px solid ${highlight ? C.p + "50" : C.border}`,
    }),
    empty: { textAlign: "center", padding: "60px 20px", color: C.muted },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => back()}>← Back</button>
        <div>
          <div style={{ fontWeight: 900, fontSize: 17 }}>🎓 University Scoreboard</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>Top scorers by real university exam performance</div>
        </div>
      </div>

      <div style={s.container}>
        {/* University picker */}
        <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 10 }}>
          University
        </div>
        {loadingSchools ? (
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 16 }}>Loading universities…</div>
        ) : (
          <div style={s.chipRow}>
            {schools.map(name => (
              <div key={name} style={s.chip(institution === name)} onClick={() => selectSchool(name)}>
                {name}
              </div>
            ))}
          </div>
        )}

        {/* Period filter */}
        <div style={s.periodRow}>
          {[["all", "All Time"], ["weekly", "This Week"], ["daily", "Today"]].map(([key, label]) => (
            <div key={key} style={s.chip(period === key)} onClick={() => setPeriod(key)}>{label}</div>
          ))}
        </div>

        <div style={{ fontSize: 11.5, color: C.muted, marginBottom: 14, textAlign: "center" }}>
          Only students averaging <span style={{ color: C.sub, fontWeight: 700 }}>50%+</span> on {institution} exams qualify for the scoreboard.
        </div>

        {/* My rank summary */}
        {myEntry && (
          <div style={{ background: `linear-gradient(120deg, ${C.p}22, ${C.acc}14)`, border: `1px solid ${C.p}50`, borderRadius: 14, padding: "14px 16px", marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Rank</div>
              <div style={{ fontSize: 20, fontWeight: 900 }}>#{myEntry.rank}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: C.muted }}>Avg score</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: scoreColor(myEntry.avg_score) }}>{myEntry.avg_score}%</div>
            </div>
          </div>
        )}

        {/* Board */}
        {loading ? (
          <div style={s.empty}><div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>Loading scoreboard…</div>
        ) : error ? (
          <div style={s.empty}><div style={{ fontSize: 36, marginBottom: 10 }}>⚠️</div>{error}</div>
        ) : board.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>🏫</div>
            <div style={{ fontSize: 15, color: C.sub, marginBottom: 6, fontWeight: 700 }}>No scores yet for {institution}</div>
            <div style={{ fontSize: 12.5, color: C.muted, marginBottom: 18 }}>Be the first to take an exam and claim the top spot.</div>
            <button onClick={() => nav("/university")} style={{ background: `linear-gradient(135deg,${C.p},${C.acc})`, color: "#fff", border: "none", borderRadius: 12, padding: "11px 22px", fontWeight: 800, fontSize: 13.5, cursor: "pointer" }}>
              Practice {institution} exams →
            </button>
          </div>
        ) : (
          board.map(r => {
            const rs = rankStyle(r.rank);
            const isMe = String(r.id) === String(student?.id);
            return (
              <div key={r.id} style={s.row(isMe)}>
                <div style={{ width: 30, textAlign: "center", flexShrink: 0 }}>
                  {rs.icon || <span style={{ color: C.muted, fontWeight: 800, fontSize: 13 }}>#{r.rank}</span>}
                </div>
                <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: `linear-gradient(135deg,${C.p},${C.acc})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: "#fff" }}>
                  {r.avatar_url ? <img src={r.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (r.full_name || "S").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.full_name}{isMe && <span style={{ color: C.pL, fontWeight: 800 }}> (You)</span>}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted }}>{r.exams_taken} exam{r.exams_taken === 1 ? "" : "s"} taken · best {r.best_score}%</div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 16, color: scoreColor(r.avg_score), flexShrink: 0 }}>{r.avg_score}%</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
