import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

// ── Circular Progress ─────────────────────────────────────────
function CircleScore({ pct, size = 120, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(parseFloat(pct) || 0, 100) / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#fff"
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="44%" dominantBaseline="middle" textAnchor="middle"
        fill="#fff" fontSize={size * 0.22} fontWeight="800">
        {Math.round(parseFloat(pct) || 0)}%
      </text>
      <text x="50%" y="64%" dominantBaseline="middle" textAnchor="middle"
        fill="rgba(255,255,255,0.7)" fontSize={size * 0.11}>
        Overall Score
      </text>
    </svg>
  );
}

// ── Small circular for recent exams ──────────────────────────
function SmallCircle({ pct, color }) {
  const size = 48, stroke = 4;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(parseFloat(pct) || 0, 100) / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize={10} fontWeight="700">
        {Math.round(parseFloat(pct) || 0)}%
      </text>
    </svg>
  );
}

// ── Simple line chart ─────────────────────────────────────────
function MiniLineChart({ data }) {
  if (!data || data.length < 2) return (
    <div style={{ height:120, display:"flex", alignItems:"center", justifyContent:"center", color:"rgba(255,255,255,0.4)", fontSize:12 }}>
      Complete more exams to see your trend
    </div>
  );
  const scores = data.map(d => parseFloat(d.percentage) || 0);
  const maxS = Math.max(...scores, 100);
  const W = 320, H = 100;
  const pts = scores.map((s, i) => `${(i / (scores.length - 1)) * W},${H - (s / maxS) * H}`).join(" ");
  const lastIdx = scores.length - 1;
  const lastX = (lastIdx / (scores.length - 1)) * W;
  const lastY = H - (scores[lastIdx] / maxS) * H;
  return (
    <svg viewBox={`0 0 ${W} ${H + 20}`} style={{ width:"100%", height:120, overflow:"visible" }}>
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <polygon points={`0,${H} ${pts} ${W},${H}`} fill="url(#chartGrad)" />
      <polyline points={pts} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {scores.length > 0 && (
        <>
          <circle cx={lastX} cy={lastY} r={5} fill="#fff" />
          <rect x={lastX - 36} y={lastY - 28} width={72} height={22} rx={6} fill="rgba(0,0,0,0.4)" />
          <text x={lastX} y={lastY - 13} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="700">
            Score: {Math.round(scores[lastIdx])}%
          </text>
        </>
      )}
    </svg>
  );
}

const NAV_ITEMS = [
  { id:"home",        label:"Dashboard",   emoji:"🏠" },
  { id:"exams",       label:"Exams",       emoji:"📝" },
  { id:"learn",       label:"Practice",    emoji:"📖" },
  { id:"progress",    label:"Progress",    emoji:"📊" },
  { id:"arena",       label:"Arena",       emoji:"🏟️" },
  { id:"leaderboard", label:"Leaderboard", emoji:"🏆" },
  { id:"profile",     label:"Profile",     emoji:"👤" },
  { id:"settings",    label:"Settings",    emoji:"⚙️" },
];

const scoreColor = p => parseFloat(p) >= 70 ? "#00b894" : parseFloat(p) >= 50 ? "#f39c12" : "#e17055";

export default function Dashboard() {
  const { student, logout } = useAuth();
  const nav = useNavigate();
  const [history,       setHistory]       = useState([]);
  const [challenge,     setChallenge]     = useState(null);
  const [profile,       setProfile]       = useState(null);
  const [perf,          setPerf]          = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activeTab,     setActiveTab]     = useState("home");
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/auth/profile").catch(() => null),
      API.get("/exam/history").catch(() => ({ data: [] })),
      API.get("/innovations/challenge/today").catch(() => null),
      API.get("/auth/notifications").catch(() => ({ data: [] })),
      API.get("/exam/performance").catch(() => ({ data: { subjects:[] } })),
    ]).then(([p, h, c, n, perf]) => {
      if (p?.data)                         setProfile(p.data);
      if (h?.data)                         setHistory(h.data.slice(0, 5));
      if (c?.data)                         setChallenge(c.data);
      if (n?.data && Array.isArray(n.data))setNotifications(n.data);
      if (perf?.data?.subjects)            setPerf(perf.data.subjects);
    }).finally(() => setLoading(false));
  }, []);

  const streak    = profile?.current_streak || 0;
  const xp        = profile?.points || 0;
  const avgScore  = history.length
    ? (history.reduce((a, h) => a + parseFloat(h.percentage || 0), 0) / history.length).toFixed(0)
    : 0;
  const bestScore = history.length
    ? Math.max(...history.map(h => parseFloat(h.percentage || 0))).toFixed(0)
    : 0;
  const firstName = (student?.full_name || profile?.full_name || "Student").split(" ")[0];
  const fullName  = student?.full_name || profile?.full_name || "Student";
  const email     = student?.email || profile?.email || "";
  const initials  = fullName.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const unread    = notifications.length;

  const goNav = (id) => {
    setSidebarOpen(false);
    if (id === "arena")       { nav("/arena");         return; }
    if (id === "leaderboard") { nav("/leaderboard");   return; }
    if (id === "settings")    { nav("/profile");       return; }
    if (id === "exams")       { nav("/exam-select?type=JAMB"); return; }
    setActiveTab(id);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0f0e1a", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ fontSize:48 }}>🎓</div>
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, fontFamily:"sans-serif" }}>Loading your dashboard...</p>
    </div>
  );

  // ── Sidebar ───────────────────────────────────────────────
  const Sidebar = () => (
    <>
      {sidebarOpen && <div style={s.overlay} onClick={() => setSidebarOpen(false)} />}
      <aside style={{ ...s.sidebar, ...(sidebarOpen ? s.sidebarOpen : {}) }}>
        {/* Logo */}
        <div style={s.logoBox}>
          <img src="/icons/icon-72x72.png" alt="logo" style={{ width:48, height:48, borderRadius:12 }}
            onError={e => { e.target.style.display="none"; }} />
          <div>
            <div style={s.logoName}>SCHOLARS</div>
            <div style={s.logoSub}>SYNDICATE</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, paddingTop:8 }}>
          {NAV_ITEMS.map(item => (
            <div key={item.id}
              style={{ ...s.navItem, ...(activeTab === item.id ? s.navItemActive : {}) }}
              onClick={() => goNav(item.id)}>
              <span style={{ width:22, textAlign:"center", fontSize:16 }}>{item.emoji}</span>
              <span style={{ fontSize:13 }}>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Upgrade CTA */}
        <div style={s.upgradeCTA}>
          <div style={{ fontSize:22, marginBottom:4 }}>👑</div>
          <div style={{ fontWeight:700, fontSize:13, color:"#fff", marginBottom:4 }}>Upgrade to Pro</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.55)", marginBottom:12, lineHeight:1.5 }}>
            Unlock more features and exclusive content.
          </div>
          <button style={s.upgradeBtn} onClick={() => nav("/upgrade")}>Upgrade Now 👑</button>
        </div>
      </aside>
    </>
  );

  // ── Header ────────────────────────────────────────────────
  const Header = ({ title, sub }) => (
    <header style={s.header}>
      <button style={s.hamburger} onClick={() => setSidebarOpen(true)}>☰</button>
      <div style={{ flex:1 }}>
        <div style={s.headerTitle}>{title || `Welcome back,`}</div>
        {title
          ? <div style={s.headerSub}>{sub}</div>
          : <div style={s.headerTitle2}>{firstName} 👋</div>
        }
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
        <div style={{ position:"relative" }}>
          <button style={s.iconBtn} onClick={() => setNotifOpen(!notifOpen)}>
            🔔
            {unread > 0 && <span style={s.notifBadge}>{unread}</span>}
          </button>
          {notifOpen && (
            <div style={s.notifDrop}>
              <div style={s.notifHead}>Notifications</div>
              {notifications.length === 0
                ? <p style={{ color:"#999", fontSize:13, textAlign:"center", padding:16 }}>No announcements yet</p>
                : notifications.map((n, i) => (
                  <div key={i} style={s.notifItem}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{n.title}</div>
                    <div style={{ fontSize:12, color:"#636e72", marginTop:3 }}>{n.message}</div>
                  </div>
                ))}
            </div>
          )}
        </div>
        <div style={s.avatarCircle} onClick={() => setActiveTab("profile")}>
          {profile?.avatar_url
            ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
            : <span style={{ fontSize:14, fontWeight:800, color:"#6c63ff" }}>{initials}</span>}
        </div>
      </div>
    </header>
  );

  return (
    <div style={s.root}>
      <Sidebar />
      <main style={s.main}>

        {/* ══════════════ HOME TAB ══════════════ */}
        {activeTab === "home" && (
          <>
            <Header />
            <div style={s.content}>
              {/* Hero */}
              <div style={s.heroCard}>
                <div style={s.heroTop}>
                  <div>
                    <div style={s.heroGreet}>Good day, {firstName} 👋</div>
                    <div style={s.heroSub}>Ready to ace your exams today?</div>
                  </div>
                  <div style={s.xpChip}>⚡ {xp} XP</div>
                </div>
                <div style={s.statsRow}>
                  <div style={s.statCol}>
                    <div style={s.statEmoji}>🔥</div>
                    <div style={s.statNum}>{streak}</div>
                    <div style={s.statLbl}>Day Streak</div>
                  </div>
                  <div style={s.statDiv} />
                  <div style={s.statCol}>
                    <div style={s.statEmoji}>📝</div>
                    <div style={s.statNum}>{history.length}</div>
                    <div style={s.statLbl}>Exams Taken</div>
                  </div>
                  <div style={s.statDiv} />
                  <div style={s.statCol}>
                    <div style={s.statEmoji}>📈</div>
                    <div style={s.statNum}>{avgScore}%</div>
                    <div style={s.statLbl}>Average Score</div>
                  </div>
                </div>
              </div>

              {/* Daily Challenge */}
              <div style={s.challengeCard}>
                <div style={s.challengeIconBox}>🎯</div>
                <div style={{ flex:1 }}>
                  <div style={s.challengeTitle}>Daily Challenge</div>
                  <div style={s.challengeSub}>
                    {challenge ? `${challenge.subject} • ${challenge.total_q || 10} questions • 2 mins` : "10 questions • 2 mins"}
                  </div>
                </div>
                <button style={s.challengeBtn} onClick={() => nav("/challenge")}>Play Now →</button>
              </div>

              {/* Start Exam */}
              <div style={s.sectionLbl}>START EXAM</div>
              <div style={s.examGrid}>
                <div style={s.jambCard} onClick={() => nav("/exam-select?type=JAMB")}>
                  <div style={{ fontSize:40, marginBottom:12 }}>📘</div>
                  <div style={s.examTitle}>JAMB / UTME</div>
                  <div style={s.examDesc}>Full simulation • Single subject • Past questions</div>
                  <button style={s.examBtn}>Start Exam →</button>
                </div>
                <div style={s.postCard} onClick={() => nav("/exam-select?type=POST-UTME")}>
                  <div style={{ fontSize:40, marginBottom:12 }}>🏫</div>
                  <div style={s.examTitle}>Post-UTME</div>
                  <div style={s.examDesc}>UNILAG • UI • OAU • UNIPORT & more</div>
                  <button style={{ ...s.examBtn, color:"#00b894" }}>Start Exam →</button>
                </div>
              </div>

              {/* Arena */}
              <div style={s.arenaCard} onClick={() => nav("/arena")}>
                <div style={{ fontSize:44, flexShrink:0 }}>🏆</div>
                <div style={{ flex:1 }}>
                  <div style={s.arenaTitle}>Scholars Arena</div>
                  <div style={s.arenaSub}>1v1 Battles • Duo • 50-player Clash{"\n"}Live competition</div>
                </div>
                <button style={s.arenaBtn}>Enter Arena →</button>
              </div>

              {/* Recent Exams */}
              {history.length > 0 && (
                <>
                  <div style={s.sectionLbl}>RECENT EXAMS</div>
                  <div style={s.recentBox}>
                    {history.slice(0,3).map((h, i) => (
                      <div key={i} style={{ ...s.recentRow, ...(i < 2 ? { borderBottom:"1px solid #f5f5f5" } : {}) }}>
                        <div style={s.recentIconBox}>📝</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={s.recentTitle}>
                            {(h.subject || "Mixed Subjects")} • {h.exam_type || "JAMB"}
                          </div>
                          <div style={s.recentMeta}>
                            {new Date(h.completed_at).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" })}
                            {" • "}{h.total_questions || 0} Questions
                          </div>
                        </div>
                        <SmallCircle pct={h.percentage || 0} color={scoreColor(h.percentage || 0)} />
                      </div>
                    ))}
                    <div style={{ textAlign:"center", paddingTop:10 }}>
                      <button style={s.viewAllBtn} onClick={() => setActiveTab("progress")}>View all →</button>
                    </div>
                  </div>
                </>
              )}
              <div style={{ height:80 }} />
            </div>
          </>
        )}

        {/* ══════════════ LEARN TAB ══════════════ */}
        {activeTab === "learn" && (
          <>
            <Header title="Practice Centre" sub="All practice modes — completely free" />
            <div style={s.content}>
              <div style={s.sectionLbl}>EXAM PREPARATION</div>
              <div style={s.toolGrid}>
                {[
                  { emoji:"📘", title:"JAMB Full Exam",   desc:"4 subjects · 180 questions · 2hrs",  path:"/exam-select?type=JAMB" },
                  { emoji:"🏫", title:"Post-UTME",        desc:"University-specific format",          path:"/exam-select?type=POST-UTME" },
                  { emoji:"📖", title:"Subject Practice", desc:"40 questions per subject",            path:"/exam-select?type=JAMB" },
                  { emoji:"🎯", title:"Daily Challenge",  desc:"10 questions · new every day",        path:"/challenge" },
                ].map((t,i) => (
                  <div key={i} style={s.toolCard} onClick={() => nav(t.path)}>
                    <div style={s.toolEmoji}>{t.emoji}</div>
                    <div style={s.toolTitle}>{t.title}</div>
                    <div style={s.toolDesc}>{t.desc}</div>
                  </div>
                ))}
              </div>

              <div style={s.sectionLbl}>SMART LEARNING</div>
              <div style={s.toolGrid}>
                {[
                  { emoji:"🔁", title:"Error Review",   desc:"Redo your wrong answers",       path:"/error-review" },
                  { emoji:"💪", title:"Beat Yourself",  desc:"Break your personal best",      path:"/beat-yourself" },
                  { emoji:"📂", title:"Resume Exam",    desc:"Continue unfinished exam",      path:"/resume" },
                  { emoji:"🧠", title:"Weakness Mode",  desc:"Target your weak areas",        path:"/exam-select" },
                ].map((t,i) => (
                  <div key={i} style={s.toolCard} onClick={() => nav(t.path)}>
                    <div style={s.toolEmoji}>{t.emoji}</div>
                    <div style={s.toolTitle}>{t.title}</div>
                    <div style={s.toolDesc}>{t.desc}</div>
                  </div>
                ))}
              </div>

              <div style={s.sectionLbl}>ARENA BATTLES</div>
              <div style={{ ...s.arenaCard, marginBottom:0 }} onClick={() => nav("/arena")}>
                <div style={{ fontSize:44, flexShrink:0 }}>🏟️</div>
                <div style={{ flex:1 }}>
                  <div style={s.arenaTitle}>Enter Arena</div>
                  <div style={s.arenaSub}>Live battles · All modes free</div>
                </div>
                <button style={s.arenaBtn}>Enter →</button>
              </div>

              <div style={{ height:80 }} />
            </div>
          </>
        )}

        {/* ══════════════ PROGRESS TAB ══════════════ */}
        {activeTab === "progress" && (
          <>
            <Header title="My Progress" sub="See how far you've come" />
            <div style={s.content}>

              {/* Overall Progress Card */}
              <div style={s.progressHero}>
                <div style={s.progressHeroTop}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:16, color:"#fff" }}>Overall Progress</div>
                    <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:2 }}>Your hard work is paying off!</div>
                  </div>
                </div>
                <div style={s.progressMainRow}>
                  <CircleScore pct={avgScore} />
                  <div style={s.progressStats}>
                    <div style={s.progStat}>
                      <div style={s.progStatNum}>{history.length}</div>
                      <div style={s.progStatLbl}>Exams Taken</div>
                    </div>
                    <div style={s.progStat}>
                      <div style={s.progStatNum}>{avgScore}%</div>
                      <div style={s.progStatLbl}>Average Score</div>
                    </div>
                    <div style={s.progStat}>
                      <div style={s.progStatNum}>{bestScore}%</div>
                      <div style={s.progStatLbl}>Best Score</div>
                    </div>
                    <div style={s.progStat}>
                      <div style={s.progStatNum}>🔥 {streak}</div>
                      <div style={s.progStatLbl}>Current Streak</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance Overview Chart */}
              <div style={s.chartCard}>
                <div style={s.chartHeader}>
                  <div style={{ fontWeight:800, fontSize:15, color:"#fff" }}>Performance Overview</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)" }}>This Month</div>
                </div>
                <MiniLineChart data={history} />
                <div style={s.chartAxis}>
                  {history.slice(-5).map((h, i) => (
                    <div key={i} style={{ fontSize:9, color:"rgba(255,255,255,0.4)" }}>
                      {new Date(h.completed_at).toLocaleDateString("en-NG", { month:"short", day:"numeric" })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Strengths */}
              {perf.length > 0 && (
                <>
                  <div style={s.whiteCard}>
                    <div style={s.cardHeader}>
                      <div style={{ fontWeight:800, fontSize:15, color:"#2d3436" }}>Subject Strengths</div>
                      <div style={{ fontSize:12, color:"#6c63ff", cursor:"pointer" }} onClick={() => nav("/performance")}>View All</div>
                    </div>
                    {[...perf].sort((a,b) => b.accuracy - a.accuracy).slice(0,4).map((p, i) => (
                      <div key={i} style={{ marginBottom:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <div style={{ fontWeight:600, fontSize:13, color:"#2d3436" }}>{p.subject}</div>
                          <div style={{ fontWeight:700, fontSize:13, color: scoreColor(p.accuracy) }}>{Math.round(p.accuracy)}%</div>
                        </div>
                        <div style={s.progressBarBg}>
                          <div style={{ ...s.progressBarFill, width:`${Math.min(p.accuracy,100)}%`, background: scoreColor(p.accuracy) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Recent Exams */}
              {history.length > 0 && (
                <div style={s.whiteCard}>
                  <div style={s.cardHeader}>
                    <div style={{ fontWeight:800, fontSize:15, color:"#2d3436" }}>Recent Exams</div>
                    <div style={{ fontSize:12, color:"#6c63ff", cursor:"pointer" }} onClick={() => nav("/history")}>View All</div>
                  </div>
                  {history.slice(0,3).map((h, i) => (
                    <div key={i} style={{ ...s.recentRow, ...(i < 2 ? { borderBottom:"1px solid #f5f5f5" } : {}) }}>
                      <div style={s.recentIconBox}>📝</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={s.recentTitle}>{h.subject || "Mixed"} {h.exam_type}</div>
                        <div style={s.recentMeta}>{new Date(h.completed_at).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" })}</div>
                      </div>
                      <SmallCircle pct={h.percentage || 0} color={scoreColor(h.percentage || 0)} />
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Links */}
              <div style={s.sectionLbl}>EXPLORE MORE</div>
              <div style={s.toolGrid}>
                {[
                  { emoji:"📊", title:"My Analytics 👑", desc:"Deep insights into your performance", path:"/performance" },
                  { emoji:"📋", title:"Exam History",     desc:"Every exam you've taken",            path:"/history" },
                  { emoji:"🎯", title:"Predicted Score",  desc:"Your likely JAMB score",             path:"/predicted" },
                  { emoji:"🏛️", title:"Admission Checker",desc:"Can you get into your dream school?",path:"/admission" },
                  { emoji:"🧠", title:"Exam Personality", desc:"Fast? Slow? Accurate?",              path:"/personality" },
                  { emoji:"🏆", title:"Leaderboard",      desc:"Where do you rank nationally?",      path:"/leaderboard" },
                  { emoji:"🏅", title:"My Badges",        desc:"Achievements you've earned",         path:"/badges" },
                  { emoji:"🎁", title:"Rewards Shop",     desc:"Spend your coins on power-ups",     path:"/shop" },
                ].map((t,i) => (
                  <div key={i} style={s.toolCard} onClick={() => nav(t.path)}>
                    <div style={s.toolEmoji}>{t.emoji}</div>
                    <div style={s.toolTitle}>{t.title}</div>
                    <div style={s.toolDesc}>{t.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ height:80 }} />
            </div>
          </>
        )}

        {/* ══════════════ PROFILE TAB ══════════════ */}
        {activeTab === "profile" && (
          <>
            <Header title="My Profile" sub="Manage your account and preferences" />
            <div style={s.content}>

              {/* Profile card */}
              <div style={s.profileHero}>
                <div style={s.profileAvatar}>
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
                    : <span style={{ fontSize:28, fontWeight:800, color:"#6c63ff" }}>{initials}</span>}
                </div>
                <div style={s.profileName}>{fullName}</div>
                <div style={s.profileEmail}>{email}</div>
                <div style={s.profileChips}>
                  <div style={s.chip}>⚡ {xp} XP</div>
                  <div style={s.chip}>🔥 {streak} Day Streak</div>
                </div>
                <button style={s.editProfileBtn} onClick={() => nav("/profile")}>Edit Profile</button>
              </div>

              {/* Menu */}
              <div style={s.menuBox}>
                {[
                  { emoji:"👤", label:"Edit Profile",            sub:"Update your personal information",       path:"/profile" },
                  { emoji:"🔒", label:"Account Security",        sub:"Change password and security settings",  path:"/profile" },
                  { emoji:"👑", label:"Subscription",            sub:"Manage your subscription plan",          path:"/upgrade" },
                  { emoji:"🏅", label:"My Badges",               sub:"View your achievements and badges",      path:"/badges" },
                  { emoji:"🏆", label:"Leaderboard",             sub:"See how you rank among others",          path:"/leaderboard" },
                  { emoji:"📊", label:"My Analytics",            sub:"Detailed insights about your performance",path:"/performance" },
                  { emoji:"🔔", label:"Notification Settings",   sub:"Manage your notification preferences",   path:"/profile" },
                  { emoji:"💬", label:"Support",                 sub:"Get help and contact support",           path:"/profile" },
                ].map((m, i) => (
                  <div key={i} style={s.menuRow} onClick={() => nav(m.path)}>
                    <div style={s.menuIconBox}>{m.emoji}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={s.menuLabel}>{m.label}</div>
                      <div style={s.menuSub}>{m.sub}</div>
                    </div>
                    <span style={{ color:"#b2bec3", fontSize:18 }}>›</span>
                  </div>
                ))}
              </div>

              {/* Upgrade CTA */}
              <div style={s.upgradeInline}>
                <div style={{ fontSize:24, marginBottom:6 }}>👑</div>
                <div style={{ fontWeight:800, fontSize:15, color:"#fff", marginBottom:4 }}>Upgrade to Pro</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginBottom:14 }}>Unlock more features and exclusive content.</div>
                <button style={s.upgradeBtn} onClick={() => nav("/upgrade")}>Upgrade Now 👑</button>
              </div>

              {/* Log Out */}
              <div style={s.logoutBtn} onClick={logout}>
                🚪 Log Out
              </div>

              <div style={{ height:80 }} />
            </div>
          </>
        )}

        {/* ── BOTTOM NAV ── */}
        <nav style={s.bottomNav}>
          {[
            { id:"home",     label:"Home",     emoji:"🏠" },
            { id:"learn",    label:"Learn",    emoji:"📚" },
            { id:"progress", label:"Progress", emoji:"📊" },
            { id:"profile",  label:"Profile",  emoji:"👤" },
          ].map(t => (
            <button key={t.id}
              style={{ ...s.bottomBtn, ...(activeTab === t.id ? s.bottomBtnActive : {}) }}
              onClick={() => setActiveTab(t.id)}>
              <span style={{ fontSize:22 }}>{t.emoji}</span>
              <span style={{ fontSize:10, marginTop:2, fontWeight: activeTab === t.id ? 700 : 400 }}>{t.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}

const s = {
  root:           { display:"flex", minHeight:"100vh", background:"#f5f6fa", fontFamily:"'Segoe UI',sans-serif" },

  // Sidebar
  overlay:        { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:98 },
  sidebar:        { width:220, background:"#0f0e1a", display:"flex", flexDirection:"column", padding:"20px 0 16px", position:"fixed", top:0, left:0, bottom:0, zIndex:99, transform:"translateX(-100%)", transition:"transform 0.25s ease" },
  sidebarOpen:    { transform:"translateX(0)" },
  logoBox:        { display:"flex", alignItems:"center", gap:10, padding:"0 16px 20px", borderBottom:"1px solid rgba(255,255,255,0.08)", marginBottom:8 },
  logoName:       { fontWeight:900, fontSize:14, color:"#fff", letterSpacing:1 },
  logoSub:        { fontSize:9, color:"rgba(255,255,255,0.4)", letterSpacing:2 },
  navItem:        { display:"flex", alignItems:"center", gap:12, padding:"11px 18px", cursor:"pointer", color:"rgba(255,255,255,0.55)", marginRight:10, borderRadius:"0 12px 12px 0", marginBottom:2, transition:"all 0.15s" },
  navItemActive:  { background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff" },
  upgradeCTA:     { margin:"12px 12px 0", background:"rgba(108,99,255,0.15)", border:"1px solid rgba(108,99,255,0.3)", borderRadius:16, padding:"16px 14px", textAlign:"center" },
  upgradeBtn:     { width:"100%", padding:"10px 0", background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:12, cursor:"pointer" },

  // Main
  main:           { flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", maxWidth:520, margin:"0 auto", width:"100%" },

  // Header
  header:         { background:"#fff", padding:"14px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid #f0f0f0", position:"sticky", top:0, zIndex:50 },
  hamburger:      { background:"none", border:"none", fontSize:22, cursor:"pointer", color:"#2d3436", padding:"2px 6px", flexShrink:0 },
  headerTitle:    { fontWeight:700, fontSize:13, color:"#636e72", lineHeight:1.2 },
  headerTitle2:   { fontWeight:900, fontSize:18, color:"#2d3436" },
  headerSub:      { fontSize:12, color:"#b2bec3", marginTop:2 },
  iconBtn:        { position:"relative", background:"#f8f9fa", border:"none", borderRadius:10, width:38, height:38, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  notifBadge:     { position:"absolute", top:-4, right:-4, background:"#e17055", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" },
  avatarCircle:   { width:40, height:40, background:"#f0edff", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"2px solid #6c63ff33", overflow:"hidden", flexShrink:0 },
  notifDrop:      { position:"absolute", top:46, right:0, background:"#fff", borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.12)", width:280, border:"1px solid #f0f0f0", zIndex:200 },
  notifHead:      { fontWeight:800, fontSize:14, padding:"14px 16px 10px", borderBottom:"1px solid #f0f0f0" },
  notifItem:      { padding:"12px 16px", borderBottom:"1px solid #f0f0f0" },

  // Content
  content:        { flex:1, padding:"16px 16px 0", overflowY:"auto" },
  sectionLbl:     { fontSize:11, fontWeight:800, color:"#b2bec3", letterSpacing:1.5, textTransform:"uppercase", margin:"16px 0 10px" },

  // Hero
  heroCard:       { background:"linear-gradient(135deg,#6c63ff,#5a52d5)", borderRadius:20, padding:"20px 20px 18px", marginBottom:14 },
  heroTop:        { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 },
  heroGreet:      { fontWeight:900, fontSize:20, color:"#fff", marginBottom:4 },
  heroSub:        { fontSize:12, color:"rgba(255,255,255,0.8)" },
  xpChip:         { background:"rgba(255,165,0,0.25)", border:"1px solid rgba(255,165,0,0.5)", color:"#ffd700", borderRadius:20, padding:"5px 14px", fontSize:13, fontWeight:800, whiteSpace:"nowrap" },
  statsRow:       { display:"flex", background:"rgba(255,255,255,0.12)", borderRadius:16, padding:"16px 0" },
  statCol:        { flex:1, textAlign:"center" },
  statEmoji:      { fontSize:24, display:"block", marginBottom:6 },
  statNum:        { fontWeight:900, fontSize:22, color:"#fff" },
  statLbl:        { fontSize:10, color:"rgba(255,255,255,0.7)", marginTop:3 },
  statDiv:        { width:1, background:"rgba(255,255,255,0.15)", margin:"4px 0" },

  // Challenge
  challengeCard:  { background:"#fff", borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:14, boxShadow:"0 2px 12px rgba(0,0,0,0.06)" },
  challengeIconBox:{ width:50, height:50, background:"linear-gradient(135deg,#6c63ff,#a29bfe)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 },
  challengeTitle: { fontWeight:800, fontSize:15, color:"#2d3436" },
  challengeSub:   { fontSize:12, color:"#636e72", marginTop:2 },
  challengeBtn:   { background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, padding:"10px 16px", fontWeight:800, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 },

  // Exam cards
  examGrid:       { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 },
  jambCard:       { background:"linear-gradient(135deg,#6c63ff,#5a52d5)", borderRadius:18, padding:"20px 14px", cursor:"pointer" },
  postCard:       { background:"linear-gradient(135deg,#00b894,#00a381)", borderRadius:18, padding:"20px 14px", cursor:"pointer" },
  examTitle:      { fontWeight:900, fontSize:15, color:"#fff", marginBottom:6 },
  examDesc:       { fontSize:11, color:"rgba(255,255,255,0.8)", lineHeight:1.5, marginBottom:16 },
  examBtn:        { width:"100%", background:"rgba(255,255,255,0.95)", border:"none", borderRadius:10, padding:"10px 0", fontWeight:800, fontSize:12, cursor:"pointer", color:"#6c63ff" },

  // Arena
  arenaCard:      { background:"linear-gradient(135deg,#2d1b2e,#4a1942)", borderRadius:18, padding:"18px 16px", display:"flex", alignItems:"center", gap:14, marginBottom:18, cursor:"pointer" },
  arenaTitle:     { fontWeight:900, fontSize:16, color:"#fff", marginBottom:4 },
  arenaSub:       { fontSize:11, color:"rgba(255,255,255,0.7)", lineHeight:1.5, whiteSpace:"pre-line" },
  arenaBtn:       { background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)", color:"#fff", borderRadius:10, padding:"10px 14px", fontWeight:800, fontSize:12, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" },

  // Recent
  recentBox:      { background:"#fff", borderRadius:16, padding:"4px 0", boxShadow:"0 2px 12px rgba(0,0,0,0.05)", marginBottom:14 },
  recentRow:      { display:"flex", alignItems:"center", gap:12, padding:"14px 16px" },
  recentIconBox:  { width:44, height:44, background:"#f8f9fa", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 },
  recentTitle:    { fontWeight:700, fontSize:13, color:"#2d3436", marginBottom:3 },
  recentMeta:     { fontSize:11, color:"#b2bec3" },
  viewAllBtn:     { background:"none", border:"none", color:"#6c63ff", fontWeight:700, fontSize:13, cursor:"pointer" },

  // Tools
  toolGrid:       { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 },
  toolCard:       { background:"#fff", borderRadius:16, padding:"16px 14px", cursor:"pointer", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" },
  toolEmoji:      { fontSize:28, marginBottom:10, display:"block" },
  toolTitle:      { fontWeight:800, fontSize:13, color:"#2d3436", marginBottom:4 },
  toolDesc:       { fontSize:11, color:"#636e72", lineHeight:1.4 },

  // Progress
  progressHero:   { background:"linear-gradient(135deg,#6c63ff,#5a52d5)", borderRadius:20, padding:"20px", marginBottom:14 },
  progressHeroTop:{ marginBottom:16 },
  progressMainRow:{ display:"flex", alignItems:"center", gap:16 },
  progressStats:  { flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  progStat:       { background:"rgba(255,255,255,0.12)", borderRadius:12, padding:"10px 8px", textAlign:"center" },
  progStatNum:    { fontWeight:900, fontSize:16, color:"#fff", marginBottom:3 },
  progStatLbl:    { fontSize:10, color:"rgba(255,255,255,0.65)" },
  chartCard:      { background:"linear-gradient(135deg,#1a1a2e,#2d2b55)", borderRadius:20, padding:"18px 16px", marginBottom:14 },
  chartHeader:    { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  chartAxis:      { display:"flex", justifyContent:"space-between", marginTop:4 },
  whiteCard:      { background:"#fff", borderRadius:16, padding:"16px", boxShadow:"0 2px 12px rgba(0,0,0,0.05)", marginBottom:14 },
  cardHeader:     { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 },
  progressBarBg:  { height:8, background:"#f0f0f0", borderRadius:10, overflow:"hidden" },
  progressBarFill:{ height:"100%", borderRadius:10, transition:"width 0.6s ease" },

  // Profile
  profileHero:    { background:"linear-gradient(135deg,#6c63ff,#5a52d5)", borderRadius:20, padding:"24px 20px", textAlign:"center", marginBottom:14 },
  profileAvatar:  { width:80, height:80, background:"rgba(255,255,255,0.2)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", border:"3px solid rgba(255,255,255,0.3)", overflow:"hidden" },
  profileName:    { fontWeight:900, fontSize:18, color:"#fff", marginBottom:4 },
  profileEmail:   { fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:14 },
  profileChips:   { display:"flex", gap:8, justifyContent:"center", marginBottom:16 },
  chip:           { background:"rgba(255,255,255,0.15)", border:"1px solid rgba(255,255,255,0.25)", color:"#fff", borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:700 },
  editProfileBtn: { background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.4)", color:"#fff", borderRadius:10, padding:"10px 28px", fontWeight:800, fontSize:13, cursor:"pointer" },
  menuBox:        { background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.05)", marginBottom:14 },
  menuRow:        { display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderBottom:"1px solid #f8f9fa", cursor:"pointer" },
  menuIconBox:    { width:40, height:40, background:"#f5f5f5", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 },
  menuLabel:      { fontWeight:700, fontSize:14, color:"#2d3436", marginBottom:2 },
  menuSub:        { fontSize:11, color:"#b2bec3" },
  upgradeInline:  { background:"linear-gradient(135deg,#6c63ff,#a29bfe)", borderRadius:16, padding:"20px 16px", textAlign:"center", marginBottom:14 },
  logoutBtn:      { background:"#fff", border:"1.5px solid #e17055", color:"#e17055", borderRadius:14, padding:"14px 0", textAlign:"center", fontWeight:800, fontSize:14, cursor:"pointer", marginBottom:8 },

  // Bottom nav
  bottomNav:      { display:"flex", background:"#fff", borderTop:"1px solid #f0f0f0", position:"sticky", bottom:0, zIndex:50 },
  bottomBtn:      { flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 0 8px", background:"none", border:"none", cursor:"pointer", color:"#b2bec3" },
  bottomBtnActive:{ color:"#6c63ff" },
};
