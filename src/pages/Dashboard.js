import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

// Helper Components
function StatCard({ icon, label, value, color }) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statIcon, background: `${color}15`, color: color }}>{icon}</div>
      <div>
        <div style={s.statValue}>{value}</div>
        <div style={s.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function ActionCard({ icon, label, desc, color, onClick }) {
  return (
    <div style={s.actionCard} onClick={onClick}>
      <div style={{ ...s.actionIcon, background: `${color}15`, color: color }}>{icon}</div>
      <div>
        <div style={s.actionLabel}>{label}</div>
        <div style={s.actionDesc}>{desc}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { student, logout, refreshStudent, token } = useAuth();
  const nav = useNavigate();

  const [history, setHistory] = useState([]);
  const [totalExams, setTotalExams] = useState(0);
  const [loading, setLoading] = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);

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

  // Fetch notifications separately
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const notifRes = await fetch(`${process.env.REACT_APP_API_URL}/auth/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (notifRes.ok) setNotifications(await notifRes.json());
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };
    if (token) fetchNotifications();
  }, [token]);

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
          <button style={s.logoutBtn} onClick={logout}>Logout</button>
        </div>
      </div>

      <div style={s.container}>
        {/* NOTIFICATIONS BANNER - CHANGED LINE BELOW */}
        {notifications.length > 0 && (
          <div style={{background:'#4f46e5',color:'white',padding:'12px 20px',borderRadius:'8px',marginBottom:'16px'}}>
            📢 <strong>{notifications[0].title}</strong> — {notifications[0].message}
          </div>
        )}

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
          <StatCard icon="📝" label="Exams" value={totalExams > 0 ? `${totalExams}` : "0"} color="#6c63ff" />
          <StatCard icon="📈" label="Avg Score" value={recentAvg ? `${recentAvg}%` : "—"} color="#00b894" />
          <StatCard icon="🏆" label="Best" value={bestScore ? `${bestScore}%` : "—"} color="#e17055" />
          <StatCard icon="🔥" label="Streak" value={streak > 0 ? `${streak}d` : "—"} color="#fdcb6e" />
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
          <ActionCard icon="📚" label="JAMB Practice" desc="Full simulation" color="#6c63ff" onClick={() => nav("/exam-select?type=JAMB")} />
          <ActionCard icon="🏫" label="Post-UTME" desc="University specific" color="#00b894" onClick={() => nav("/exam-select?type=POST-UTME")} />
          <ActionCard icon="⚔️" label="Arena Battle" desc="Compete live!" color="#e17055" onClick={() => nav("/arena")} />
          <ActionCard icon="🎯" label="Daily Challenge" desc="Today's 10 questions" color="#6c63ff" onClick={() => nav("/challenge")} />
          <ActionCard icon="📋" label="Exam History" desc="Review past sessions" color="#0984e3" onClick={() => nav("/history")} />
          <ActionCard icon="📊" label="My Analytics" desc="Weak topics & strengths" color="#a29bfe" onClick={() => nav("/performance")} />
          <ActionCard icon="🔁" label="Error Review" desc="Practice your mistakes" color="#e17055" onClick={() => nav("/error-review")} />
          <ActionCard icon="🏆" label="Leaderboard" desc="Top students" color="#fdcb6e" onClick={() => nav("/leaderboard")} />
          <ActionCard icon="🎓" label="Predicted Score" desc="Your JAMB estimate" color="#6c63ff" onClick={() => nav("/predicted")} />
          <ActionCard icon="🏅" label="My Badges" desc="Earn achievements" color="#fdcb6e" onClick={() => nav("/badges")} />
          <ActionCard icon="📂" label="Resume Exam" desc="Continue unfinished" color="#00b894" onClick={() => nav("/resume")} />
          <ActionCard icon="🏛" label="Admission Check" desc="Check uni chances" color="#e17055" onClick={() => nav("/admission")} />
          <ActionCard icon="🧠" label="Exam Personality" desc="Understand your style" color="#0984e3" onClick={() => nav("/personality")} />
          <ActionCard icon="💪" label="Beat Yourself" desc="Break your record" color="#00b894" onClick={() => nav("/beat-yourself")} />
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

// Styles object
const s = {
  page: {
    minHeight: "100vh",
    background: "#f8f9fa",
  },
  header: {
    background: "white",
    padding: "16px 24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #e9ecef",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: 20,
    fontWeight: 800,
    color: "#6c63ff",
  },
  profileBtn: {
    padding: "8px 16px",
    background: "#f8f9fa",
    border: "1px solid #e9ecef",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
  logoutBtn: {
    padding: "8px 16px",
    background: "#e17055",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
  container: {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "24px",
  },
  welcome: {
    background: "white",
    padding: "24px",
    borderRadius: 12,
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  startBtn: {
    padding: "12px 24px",
    background: "#6c63ff",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 14,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "white",
    padding: "20px",
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 24,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 800,
    color: "#2d3436",
  },
  statLabel: {
    fontSize: 13,
    color: "#636e72",
    marginTop: 4,
  },
  challengeBanner: {
    background: "linear-gradient(135deg,#6c63ff,#a29bfe)",
    padding: "20px",
    borderRadius: 12,
    marginBottom: "24px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  challengeBtn: {
    padding: "8px 20px",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },
  arenaBanner: {
    background: "linear-gradient(135deg,#e17055,#d63031)",
    padding: "20px",
    borderRadius: 12,
    marginBottom: "32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  arenaBtn: {
    padding: "8px 20px",
    background: "white",
    color: "#e17055",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 16,
    color: "#2d3436",
  },
  actionsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: "12px",
    marginBottom: "32px",
  },
  actionCard: {
    background: "white",
    padding: "16px",
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    gap: "14px",
    cursor: "pointer",
    transition: "transform 0.2s, box-shadow 0.2s",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
  },
  actionLabel: {
    fontWeight: 600,
    fontSize: 14,
    color: "#2d3436",
  },
  actionDesc: {
    fontSize: 12,
    color: "#636e72",
    marginTop: 2,
  },
  historyList: {
    background: "white",
    borderRadius: 12,
    overflow: "hidden",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    marginBottom: "32px",
  },
  historyRow: {
    padding: "16px",
    borderBottom: "1px solid #e9ecef",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  viewAll: {
    width: "100%",
    padding: "12px",
    background: "none",
    border: "none",
    borderTop: "1px solid #e9ecef",
    color: "#6c63ff",
    fontWeight: 600,
    cursor: "pointer",
  },
  upgradeBanner: {
    background: "linear-gradient(135deg,#fdcb6e,#f39c12)",
    padding: "20px",
    borderRadius: 12,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    cursor: "pointer",
  },
  upgradeBtn: {
    padding: "8px 20px",
    background: "white",
    color: "#f39c12",
    borderRadius: 8,
    border: "none",
    fontWeight: 600,
    cursor: "pointer",
  },
};