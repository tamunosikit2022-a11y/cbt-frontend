import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

export default function Dashboard() {
  const { student, logout, refreshStudent } = useAuth();
  const nav = useNavigate();

  const [history,     setHistory]   = useState([]);
  const [totalExams,  setTotalExams] = useState(0);
  const [loading,     setLoading]   = useState(true);
  const [challenge,   setChallenge] = useState(null);
  const [profile,     setProfile]   = useState(null); // full profile with streak

  useEffect(() => {
    // Fetch full profile (has streak) and exam history in parallel
    Promise.all([
      API.get("/auth/profile"),
      API.get("/exam/history"),
      API.get("/innovations/challenge/today").catch(() => null),
    ]).then(([p, h, c]) => {
      setProfile(p.data);
      setTotalExams(h.data.length);
      setHistory(h.data.slice(0, 5));
      if (c) setChallenge(c.data);
    }).catch(error => {
      console.error("Error fetching dashboard data:", error);
    }).finally(() => setLoading(false));
  }, []);

  const recentAvg = history.length
    ? (history.reduce((a, h) => a + parseFloat(h.percentage), 0) / history.length).toFixed(1)
    : null;

  const bestScore = history.length
    ? Math.max(...history.map(h => parseFloat(h.percentage))).toFixed(0)
    : null;

  const streak = profile?.current_streak || 0;

  const scoreColor = (p) => {
    const percent = parseFloat(p);
    return percent >= 70 ? "#00b894" : percent >= 50 ? "#fdcb6e" : "#e17055";
  };

  // Show loading state
  if (loading) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.logo}>🎓 Scholars CBT</div>
        </div>
        <div style={{ ...s.container, textAlign: "center", paddingTop: 50 }}>
          <div style={{ fontSize: 40 }}>⏳</div>
          <p style={{ color: "#636e72", marginTop: 16 }}>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <div style={s.logo}>🎓 Scholars CBT</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button style={s.profileBtn} onClick={() => nav("/profile")}>👤 Profile</button>
          <button style={s.logoutBtn}  onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={s.container}>
        {/* WELCOME */}
        <div style={s.welcome}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800 }}>
              Welcome back, {student?.full_name?.split(" ")[0] || "Student"} 👋
            </h2>
            <p style={{ color: "#636e72", marginTop: 4, fontSize: 13 }}>
              All features are free — unlimited practice, arena battles & more!
            </p>
          </div>
          <button style={s.startBtn} onClick={() => nav("/exam-select")}>
            Start Exam →
          </button>
        </div>

        {/* STATS */}
        <div style={s.statsRow}>
          <StatCard icon="📝" label="Exams"      value={totalExams > 0 ? `${totalExams}` : "0"} color="#6c63ff" />
          <StatCard icon="📈" label="Avg Score"  value={recentAvg ? `${recentAvg}%` : "—"}              color="#00b894" />
          <StatCard icon="🏆" label="Best"       value={bestScore  ? `${bestScore}%`  : "—"}             color="#e17055" />
          <StatCard icon="🔥" label="Streak"     value={streak > 0 ? `${streak}d`    : "—"}             color="#fdcb6e" />
        </div>

        {/* DAILY CHALLENGE */}
        <div
          style={{ ...s.challengeBanner, background: challenge?.already_done ? "#e8f8f5" : "linear-gradient(135deg,#6c63ff,#a29bfe)" }}
          onClick={() => nav("/challenge")}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: challenge?.already_done ? "#00b894" : "#fff" }}>
              🎯 Daily Challenge — {challenge?.challenge?.subject || "Loading..."}
            </div>
            <div style={{ fontSize: 13, color: challenge?.already_done ? "#636e72" : "rgba(255,255,255,0.85)", marginTop: 2 }}>
              {challenge?.already_done
                ? `✅ Completed! Score: ${challenge?.challenge?.percentage}%`
                : "10 questions · 2 minutes · New every day!"}
            </div>
          </div>
          <button style={{ ...s.challengeBtn, background: challenge?.already_done ? "#00b894" : "#fff", color: challenge?.already_done ? "#fff" : "#6c63ff" }}>
            {challenge?.already_done ? "Done ✓" : "Play →"}
          </button>
        </div>

        {/* ARENA */}
        <div style={s.arenaBanner} onClick={() => nav("/arena")}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#fff" }}>🏟️ Scholars Arena</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
              1v1 · Duo · Clash Squad · 50-player Battle Royal — all FREE
            </div>
          </div>
          <button style={s.arenaBtn}>Enter Arena →</button>
        </div>

        {/* QUICK ACTIONS */}
        <h3 style={s.sectionTitle}>Quick Actions</h3>
        <div style={s.actionsGrid}>
          <ActionCard icon="📚" label="JAMB Practice"      desc="Full simulation"         color="#6c63ff" onClick={() => nav("/exam-select?type=JAMB")} />
          <ActionCard icon="🏫" label="Post-UTME"          desc="University specific"     color="#00b894" onClick={() => nav("/exam-select?type=POST-UTME")} />
          <ActionCard icon="⚔️"  label="Arena Battle"      desc="Compete live!"           color="#e17055" onClick={() => nav("/arena")} />
          <ActionCard icon="🎯" label="Daily Challenge"    desc="Today's 10 questions"    color="#6c63ff" onClick={() => nav("/challenge")} />
          <ActionCard icon="📋" label="Exam History"       desc="Review past sessions"    color="#0984e3" onClick={() => nav("/history")} />
          <ActionCard icon="📊" label="My Analytics"       desc="Weak topics & strengths" color="#a29bfe" onClick={() => nav("/performance")} />
          <ActionCard icon="🔁" label="Error Review"       desc="Practice your mistakes"  color="#e17055" onClick={() => nav("/error-review")} />
          <ActionCard icon="🏆" label="Leaderboard"        desc="Top students"            color="#fdcb6e" onClick={() => nav("/leaderboard")} />
          <ActionCard icon="🎓" label="Predicted Score"    desc="Your JAMB estimate"      color="#6c63ff" onClick={() => nav("/predicted")} />
          <ActionCard icon="🏅" label="My Badges"          desc="Earn achievements"       color="#fdcb6e" onClick={() => nav("/badges")} />
          <ActionCard icon="📂" label="Resume Exam"        desc="Continue unfinished"     color="#00b894" onClick={() => nav("/resume")} />
          <ActionCard icon="🏛" label="Admission Check"    desc="Check uni chances"       color="#e17055" onClick={() => nav("/admission")} />
          <ActionCard icon="🧠" label="Exam Personality"   desc="Understand your style"   color="#0984e3" onClick={() => nav("/personality")} />
          <ActionCard icon="💪" label="Beat Yourself"      desc="Break your record"       color="#00b894" onClick={() => nav("/beat-yourself")} />
        </div>

        {/* RECENT HISTORY */}
        {history.length > 0 && (
          <>
            <h3 style={s.sectionTitle}>Recent Exams</h3>
            <div style={s.historyList}>
              {history.map(h => (
                <div key={h.id} style={s.historyRow}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{h.subject} — {h.exam_type}</div>
                    <div style={{ fontSize: 12, color: "#636e72" }}>
                      {new Date(h.completed_at).toLocaleDateString("en-NG")} · {h.total_questions} questions
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: scoreColor(h.percentage) }}>
                      {parseFloat(h.percentage).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 12, color: "#636e72" }}>{h.score}/{h.total_questions}</div>
                  </div>
                </div>
              ))}
              <button style={s.viewAll} onClick={() => nav("/history")}>View all history →</button>
            </div>
          </>
        )}

        {/* UPGRADE BANNER — optional, shown only to free users */}
        {!student?.is_premium && (
          <div style={s.upgradeBanner} onClick={() => nav("/upgrade")}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>👑 Want Premium Features?</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
                Activate an access key to unlock extra features
              </div>
            </div>
            <button style={s.upgradeBtn}>Activate Key →</button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "14px 12px", flex: 1, minWidth: 70, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", textAlign: "center" }}>
      <div style={{ fontSize: 20 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 11, color: "#636e72" }}>{label}</div>
    </div>
  );
}

function ActionCard({ icon, label, desc, color, onClick }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: "14px 12px", cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderLeft: `3px solid ${color}` }}
      onClick={onClick}>
      <div style={{ fontSize: 20, marginBottom: 5 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 11, color: "#636e72", marginTop: 2 }}>{desc}</div>
    </div>
  );
}

const s = {
  page:            { minHeight: "100vh", background: "#f8f9fa", fontFamily: "sans-serif" },
  header:          { background: "#fff", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 },
  logo:            { fontWeight: 800, fontSize: 17, color: "#6c63ff" },
  profileBtn:      { background: "#f0edff", color: "#6c63ff", border: "none", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  logoutBtn:       { background: "transparent", color: "#636e72", border: "1px solid #dfe6e9", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13 },
  container:       { maxWidth: 960, margin: "0 auto", padding: "20px 16px" },
  welcome:         { background: "#fff", borderRadius: 14, padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  startBtn:        { background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, padding: "11px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer" },
  statsRow:        { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 },
  challengeBanner: { borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10, cursor: "pointer" },
  challengeBtn:    { border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, cursor: "pointer", fontSize: 13, flexShrink: 0 },
  arenaBanner:     { background: "linear-gradient(135deg,#0f0f1a,#1a1a2e)", borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 18, cursor: "pointer", border: "1px solid #6c63ff" },
  arenaBtn:        { background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, cursor: "pointer", fontSize: 13 },
  sectionTitle:    { fontSize: 15, fontWeight: 700, color: "#2d3436", marginBottom: 10 },
  actionsGrid:     { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10, marginBottom: 22 },
  historyList:     { background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 18 },
  historyRow:      { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 16px", borderBottom: "1px solid #f0f0f0" },
  viewAll:         { display: "block", width: "100%", padding: 11, background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 13 },
  upgradeBanner:   { background: "linear-gradient(135deg,#fdcb6e,#e17055)", borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, cursor: "pointer", color: "#fff" },
  upgradeBtn:      { background: "#fff", color: "#e17055", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 800, cursor: "pointer", fontSize: 13 },
};