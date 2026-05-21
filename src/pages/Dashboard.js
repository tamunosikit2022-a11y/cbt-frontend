import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

// ── Circular progress SVG ─────────────────────────────────────
function CircleProgress({ pct, size = 56, stroke = 4, color = "#e17055" }) {
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
        fill={color} fontSize={size * 0.22} fontWeight="700">
        {Math.round(parseFloat(pct) || 0)}%
      </text>
    </svg>
  );
}

// ── Sidebar nav items ────────────────────────────────────────
const NAV = [
  { id:"home",        label:"Dashboard",   icon:"🏠" },
  { id:"exams",       label:"Exams",       icon:"📝" },
  { id:"learn",       label:"Practice",    icon:"📖" },
  { id:"progress",    label:"Progress",    icon:"📊" },
  { id:"arena",       label:"Arena",       icon:"🏟️" },
  { id:"leaderboard", label:"Leaderboard", icon:"🏆" },
  { id:"profile",     label:"Profile",     icon:"👤" },
  { id:"settings",    label:"Settings",    icon:"⚙️" },
];

export default function Dashboard() {
  const { student, logout } = useAuth();
  const nav = useNavigate();
  const [history,        setHistory]       = useState([]);
  const [challenge,      setChallenge]     = useState(null);
  const [profile,        setProfile]       = useState(null);
  const [notifications,  setNotifications] = useState([]);
  const [activeTab,      setActiveTab]     = useState("home");
  const [notifOpen,      setNotifOpen]     = useState(false);
  const [sidebarOpen,    setSidebarOpen]   = useState(false);
  const [loading,        setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/auth/profile").catch(() => null),
      API.get("/exam/history").catch(() => ({ data: [] })),
      API.get("/innovations/challenge/today").catch(() => null),
      API.get("/auth/notifications").catch(() => ({ data: [] })),
    ]).then(([p, h, c, n]) => {
      if (p?.data) setProfile(p.data);
      if (h?.data) setHistory(h.data.slice(0, 3));
      if (c?.data) setChallenge(c.data);
      if (n?.data && Array.isArray(n.data)) setNotifications(n.data);
    }).finally(() => setLoading(false));
  }, []);

  const streak   = profile?.current_streak || 0;
  const xp       = profile?.points || 0;
  const examCount = history.length;
  const avgScore = history.length
    ? (history.reduce((a, h) => a + parseFloat(h.percentage || 0), 0) / history.length).toFixed(0)
    : 0;
  const firstName = (student?.full_name || profile?.full_name || "Student").split(" ")[0];
  const initials  = (student?.full_name || profile?.full_name || "S").split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase();
  const unread    = notifications.length;

  const handleNav = (id) => {
    setSidebarOpen(false);
    if (id === "arena")       { nav("/arena"); return; }
    if (id === "leaderboard") { nav("/leaderboard"); return; }
    if (id === "settings")    { nav("/profile"); return; }
    if (id === "exams")       { nav("/exam-select?type=JAMB"); return; }
    setActiveTab(id);
  };

  const scoreColor = p => parseFloat(p) >= 70 ? "#00b894" : parseFloat(p) >= 50 ? "#f39c12" : "#e17055";

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0f0e1a", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <img src="/icons/icon-96x96.png" alt="" style={{ width:64, height:64, borderRadius:16 }} onError={e => { e.target.style.display="none"; }} />
      <p style={{ color:"rgba(255,255,255,0.5)", fontSize:14, fontFamily:"sans-serif" }}>Loading your dashboard...</p>
    </div>
  );

  return (
    <div style={s.root}>

      {/* ── SIDEBAR OVERLAY (mobile) ── */}
      {sidebarOpen && (
        <div style={s.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside style={{ ...s.sidebar, ...(sidebarOpen ? s.sidebarOpen : {}) }}>
        {/* Logo */}
        <div style={s.sidebarLogo}>
          <img src="/icons/icon-72x72.png" alt="logo"
            style={{ width:48, height:48, borderRadius:12 }}
            onError={e => { e.target.style.display="none"; }} />
          <div>
            <div style={s.sidebarLogoName}>Scholars Syndicate</div>
            <div style={s.sidebarLogoSub}>Learn. Practice. Excel.</div>
          </div>
        </div>

        {/* Nav items */}
        <nav style={{ flex:1 }}>
          {NAV.map(item => (
            <div key={item.id}
              style={{ ...s.navItem, ...(activeTab === item.id ? s.navItemActive : {}) }}
              onClick={() => handleNav(item.id)}>
              <span style={s.navIcon}>{item.icon}</span>
              <span style={s.navLabel}>{item.label}</span>
            </div>
          ))}
        </nav>

        {/* Upgrade CTA */}
        <div style={s.upgradeCTA}>
          <div style={{ fontSize:22, marginBottom:4 }}>👑</div>
          <div style={{ fontWeight:700, fontSize:13, color:"#fff", marginBottom:4 }}>Upgrade to Pro</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.6)", marginBottom:12 }}>Unlock more features and exclusive content.</div>
          <button style={s.upgradeBtn} onClick={() => nav("/upgrade")}>Upgrade Now 👑</button>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <main style={s.main}>

        {/* ── TOP HEADER ── */}
        <header style={s.header}>
          {/* Hamburger (mobile) */}
          <button style={s.hamburger} onClick={() => setSidebarOpen(true)}>☰</button>
          <div style={s.headerBrand}>
            <div style={s.headerTitle}>Scholars Syndicate</div>
            <div style={s.headerSub}>Learn. Practice. Excel.</div>
          </div>
          <div style={s.headerRight}>
            {/* Notifications */}
            <div style={{ position:"relative" }}>
              <button style={s.iconBtn} onClick={() => setNotifOpen(!notifOpen)}>
                🔔
                {unread > 0 && <span style={s.notifBadge}>{unread}</span>}
              </button>
              {notifOpen && (
                <div style={s.notifDropdown}>
                  <div style={s.notifHeader}>Notifications</div>
                  {notifications.length === 0
                    ? <p style={{ color:"#636e72", fontSize:13, textAlign:"center", padding:"16px" }}>No announcements yet</p>
                    : notifications.map((n, i) => (
                      <div key={i} style={s.notifItem}>
                        <div style={{ fontWeight:700, fontSize:13 }}>{n.title}</div>
                        <div style={{ fontSize:12, color:"#636e72", marginTop:3 }}>{n.message}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
            {/* Avatar */}
            <div style={s.avatar} onClick={() => setActiveTab("profile")}>
              {profile?.avatar_url
                ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
                : <span style={{ fontSize:15, fontWeight:700, color:"#6c63ff" }}>{initials}</span>}
            </div>
            <div style={s.headerGreeting}>
              <div style={s.headerGreetName}>Good day, {firstName} 👋</div>
              <div style={s.headerGreetSub}>Keep up the momentum!</div>
            </div>
          </div>
        </header>

        {/* ── SCROLLABLE CONTENT ── */}
        <div style={s.content}>

          {/* ══ HOME TAB ══ */}
          {activeTab === "home" && (
            <>
              {/* Hero card */}
              <div style={s.heroCard}>
                <div style={s.heroTop}>
                  <div>
                    <div style={s.heroGreet}>Good day, {firstName} 👋</div>
                    <div style={s.heroSub}>Ready to ace your exams today?</div>
                  </div>
                  <div style={s.xpBadge}>⚡ {xp} XP</div>
                </div>
                <div style={s.statsRow}>
                  <div style={s.statItem}>
                    <span style={s.statEmoji}>🔥</span>
                    <div style={s.statNum}>{streak}</div>
                    <div style={s.statLabel}>Day Streak</div>
                  </div>
                  <div style={s.statDivider} />
                  <div style={s.statItem}>
                    <span style={s.statEmoji}>📝</span>
                    <div style={s.statNum}>{examCount}</div>
                    <div style={s.statLabel}>Exams Taken</div>
                  </div>
                  <div style={s.statDivider} />
                  <div style={s.statItem}>
                    <span style={s.statEmoji}>📈</span>
                    <div style={s.statNum}>{avgScore}%</div>
                    <div style={s.statLabel}>Average Score</div>
                  </div>
                </div>
              </div>

              {/* Daily Challenge */}
              <div style={s.challengeCard}>
                <div style={s.challengeIcon}>🎯</div>
                <div style={{ flex:1 }}>
                  <div style={s.challengeTitle}>Daily Challenge</div>
                  <div style={s.challengeSub}>
                    {challenge ? `${challenge.subject} • ${challenge.total_q || 10} questions • 2 mins` : "10 questions • 2 mins"}
                  </div>
                </div>
                <button style={s.challengeBtn} onClick={() => nav("/challenge")}>Play Now →</button>
              </div>

              {/* Start Exam */}
              <div style={s.sectionTitle}>START EXAM</div>
              <div style={s.examGrid}>
                <div style={s.jambCard} onClick={() => nav("/exam-select?type=JAMB")}>
                  <div style={{ fontSize:36, marginBottom:10 }}>📘</div>
                  <div style={s.examCardTitle}>JAMB / UTME</div>
                  <div style={s.examCardDesc}>Full simulation • Single subject • Past questions</div>
                  <button style={s.examCardBtn}>Start Exam →</button>
                </div>
                <div style={s.postCard} onClick={() => nav("/exam-select?type=POST-UTME")}>
                  <div style={{ fontSize:36, marginBottom:10 }}>🏫</div>
                  <div style={s.examCardTitle}>Post-UTME</div>
                  <div style={s.examCardDesc}>UNILAG • UI • OAU • UNIPORT & more</div>
                  <button style={{ ...s.examCardBtn, color:"#00b894" }}>Start Exam →</button>
                </div>
              </div>

              {/* Arena */}
              <div style={s.arenaCard} onClick={() => nav("/arena")}>
                <div style={s.arenaTrophy}>🏆</div>
                <div style={{ flex:1 }}>
                  <div style={s.arenaTitle}>Scholars Arena</div>
                  <div style={s.arenaSub}>1v1 Battles • Duo • 50-player Clash{"\n"}Live competition</div>
                </div>
                <button style={s.arenaBtn}>Enter Arena →</button>
              </div>

              {/* Recent Exams */}
              {history.length > 0 && (
                <>
                  <div style={s.sectionTitle}>RECENT EXAMS</div>
                  <div style={s.recentCard}>
                    {history.map((h, i) => (
                      <div key={i} style={{ ...s.recentItem, ...(i < history.length - 1 ? { borderBottom:"1px solid #f0f0f0" } : {}) }}>
                        <div style={s.recentIcon}>📝</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={s.recentTitle}>{h.subject || "Mixed Subjects"} • {h.exam_type || "JAMB"}</div>
                          <div style={s.recentMeta}>
                            {new Date(h.completed_at).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" })}
                            {" • "}{h.total_questions || 0} Questions
                          </div>
                        </div>
                        <CircleProgress pct={h.percentage || 0} color={scoreColor(h.percentage || 0)} />
                      </div>
                    ))}
                    <div style={{ textAlign:"center", paddingTop:12 }}>
                      <button style={s.viewAllBtn} onClick={() => setActiveTab("progress")}>View Details →</button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* ══ LEARN TAB ══ */}
          {activeTab === "learn" && (
            <>
              <div style={s.sectionTitle}>STUDY SMARTER</div>
              <div style={s.toolGrid}>
                {[
                  { icon:"📘", title:"JAMB Full Exam",    desc:"4 subjects · 180 questions · 2hrs",     color:"#6c63ff", path:"/exam-select?type=JAMB" },
                  { icon:"🏫", title:"Post-UTME",         desc:"University-specific format",             color:"#00b894", path:"/exam-select?type=POST-UTME" },
                  { icon:"📖", title:"Subject Practice",  desc:"40 questions per subject",               color:"#0984e3", path:"/exam-select?type=JAMB" },
                  { icon:"🎯", title:"Daily Challenge",   desc:"10 questions · new every day",           color:"#a29bfe", path:"/challenge" },
                  { icon:"🔁", title:"Error Review",      desc:"Redo your wrong answers",                color:"#e17055", path:"/error-review" },
                  { icon:"💪", title:"Beat Yourself",     desc:"Break your personal best",               color:"#00b894", path:"/beat-yourself" },
                  { icon:"📺", title:"Video Library",     desc:"Learn from top educators",               color:"#fd79a8", path:"/videos" },
                  { icon:"🏟️", title:"Enter Arena",      desc:"Live battles with students",             color:"#e17055", path:"/arena" },
                ].map((t, i) => (
                  <div key={i} style={s.toolCard} onClick={() => nav(t.path)}>
                    <div style={{ ...s.toolIcon, background: t.color + "18" }}>{t.icon}</div>
                    <div style={s.toolTitle}>{t.title}</div>
                    <div style={s.toolDesc}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══ PROGRESS TAB ══ */}
          {activeTab === "progress" && (
            <>
              <div style={s.sectionTitle}>HOW AM I DOING</div>
              <div style={s.toolGrid}>
                {[
                  { icon:"📊", title:"My Analytics 👑",    desc:"Strengths & weaknesses",                color:"#6c63ff", path:"/performance" },
                  { icon:"📋", title:"Exam History",        desc:"Every exam you've taken",               color:"#636e72", path:"/history" },
                  { icon:"🎯", title:"Predicted Score",     desc:"Your likely JAMB score",                color:"#00b894", path:"/predicted" },
                  { icon:"🏛️", title:"Admission Checker",  desc:"Can you get into your dream school?",   color:"#0984e3", path:"/admission" },
                  { icon:"🧠", title:"Exam Personality",   desc:"Fast? Slow? Accurate? Guesser?",        color:"#a29bfe", path:"/personality" },
                  { icon:"🏆", title:"Leaderboard",         desc:"Where do you rank nationally?",         color:"#e17055", path:"/leaderboard" },
                  { icon:"🏅", title:"My Badges",           desc:"Achievements you've earned",            color:"#fdcb6e", path:"/badges" },
                  { icon:"🎁", title:"Rewards Shop",        desc:"Spend your coins",                      color:"#fd79a8", path:"/shop" },
                ].map((t, i) => (
                  <div key={i} style={s.toolCard} onClick={() => nav(t.path)}>
                    <div style={{ ...s.toolIcon, background: t.color + "18" }}>{t.icon}</div>
                    <div style={s.toolTitle}>{t.title}</div>
                    <div style={s.toolDesc}>{t.desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ══ PROFILE TAB ══ */}
          {activeTab === "profile" && (
            <>
              <div style={s.profileCard}>
                <div style={s.profileAvatarLg} onClick={() => nav("/profile")}>
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
                    : <span style={{ fontSize:32, fontWeight:700, color:"#6c63ff" }}>{initials}</span>}
                </div>
                <div style={s.profileName}>{student?.full_name || profile?.full_name}</div>
                <div style={s.profileEmail}>{student?.email || profile?.email}</div>
                <div style={s.profileStats}>
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontWeight:800, fontSize:16, color:"#6c63ff" }}>⚡ {xp} XP</div>
                  </div>
                  <div style={{ width:1, background:"#f0f0f0" }} />
                  <div style={{ textAlign:"center" }}>
                    <div style={{ fontWeight:800, fontSize:16, color:"#e17055" }}>🔥 {streak} day streak</div>
                  </div>
                </div>
                <button style={s.editBtn} onClick={() => nav("/profile")}>Edit Profile</button>
              </div>
              <div style={s.menuList}>
                {[
                  { icon:"👤", label:"Edit Profile",      path:"/profile" },
                  { icon:"🔑", label:"Activate Key",      path:"/upgrade" },
                  { icon:"🏅", label:"My Badges",         path:"/badges" },
                  { icon:"🏆", label:"Leaderboard",       path:"/leaderboard" },
                  { icon:"📊", label:"My Analytics",      path:"/performance" },
                  { icon:"🎓", label:"Predicted Score",   path:"/predicted" },
                  { icon:"🏛️", label:"Admission Checker", path:"/admission" },
                  { icon:"🧠", label:"Exam Personality",  path:"/personality" },
                  { icon:"📺", label:"Video Library",     path:"/videos" },
                  { icon:"👑", label:"Go Premium",        path:"/upgrade" },
                ].map((m, i) => (
                  <div key={i} style={s.menuItem} onClick={() => nav(m.path)}>
                    <span style={{ fontSize:20 }}>{m.icon}</span>
                    <span style={{ flex:1, fontSize:14, fontWeight:600, color:"#2d3436" }}>{m.label}</span>
                    <span style={{ color:"#b2bec3" }}>›</span>
                  </div>
                ))}
                <div style={{ ...s.menuItem, color:"#e17055" }} onClick={logout}>
                  <span style={{ fontSize:20 }}>🚪</span>
                  <span style={{ flex:1, fontSize:14, fontWeight:600, color:"#e17055" }}>Log Out</span>
                </div>
              </div>
            </>
          )}

          <div style={{ height:80 }} />
        </div>

        {/* ── BOTTOM NAV (mobile) ── */}
        <nav style={s.bottomNav}>
          {[
            { id:"home",     label:"Home",     icon:"🏠" },
            { id:"learn",    label:"Learn",    icon:"📚" },
            { id:"progress", label:"Progress", icon:"📊" },
            { id:"profile",  label:"Profile",  icon:"👤" },
          ].map(t => (
            <button key={t.id}
              style={{ ...s.bottomBtn, ...(activeTab === t.id ? s.bottomBtnActive : {}) }}
              onClick={() => setActiveTab(t.id)}>
              <span style={{ fontSize:20 }}>{t.icon}</span>
              <span style={{ fontSize:10, marginTop:2, fontWeight: activeTab === t.id ? 700 : 400 }}>{t.label}</span>
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}

const SIDEBAR_W = 240;

const s = {
  root:           { display:"flex", minHeight:"100vh", background:"#f5f6fa", fontFamily:"'Segoe UI',sans-serif" },

  // Sidebar
  overlay:        { position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:99 },
  sidebar:        { width:SIDEBAR_W, background:"#0f0e1a", display:"flex", flexDirection:"column", padding:"20px 0", position:"fixed", top:0, left:0, bottom:0, zIndex:100, transform:"translateX(-100%)", transition:"transform 0.25s ease" },
  sidebarOpen:    { transform:"translateX(0)" },
  sidebarLogo:    { display:"flex", alignItems:"center", gap:12, padding:"0 16px 24px", borderBottom:"1px solid rgba(255,255,255,0.08)", marginBottom:8 },
  sidebarLogoName:{ fontWeight:800, fontSize:13, color:"#fff", lineHeight:1.2 },
  sidebarLogoSub: { fontSize:10, color:"rgba(255,255,255,0.4)", marginTop:2 },
  navItem:        { display:"flex", alignItems:"center", gap:12, padding:"11px 20px", cursor:"pointer", borderRadius:"0 12px 12px 0", marginRight:12, marginBottom:2, color:"rgba(255,255,255,0.6)", fontSize:13, fontWeight:600, transition:"all 0.15s" },
  navItemActive:  { background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff" },
  navIcon:        { fontSize:18, width:22, textAlign:"center" },
  navLabel:       { fontSize:13 },
  upgradeCTA:     { margin:"16px 12px 0", background:"rgba(108,99,255,0.2)", border:"1px solid rgba(108,99,255,0.3)", borderRadius:16, padding:"16px 14px", textAlign:"center" },
  upgradeBtn:     { width:"100%", padding:"10px 0", background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:12, cursor:"pointer" },

  // Main
  main:           { flex:1, display:"flex", flexDirection:"column", minHeight:"100vh", maxWidth:520, margin:"0 auto", width:"100%" },

  // Header
  header:         { background:"#fff", padding:"12px 16px", display:"flex", alignItems:"center", gap:10, borderBottom:"1px solid #f0f0f0", position:"sticky", top:0, zIndex:50 },
  hamburger:      { background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#2d3436", flexShrink:0, padding:"4px 8px" },
  headerBrand:    { flex:1 },
  headerTitle:    { fontWeight:900, fontSize:16, color:"#2d3436" },
  headerSub:      { fontSize:10, color:"#b2bec3" },
  headerRight:    { display:"flex", alignItems:"center", gap:8 },
  headerGreeting: { display:"none" },
  headerGreetName:{ fontWeight:700, fontSize:13, color:"#2d3436" },
  headerGreetSub: { fontSize:11, color:"#b2bec3" },
  iconBtn:        { position:"relative", background:"#f8f9fa", border:"none", borderRadius:10, width:38, height:38, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  notifBadge:     { position:"absolute", top:-4, right:-4, background:"#e17055", color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" },
  avatar:         { width:38, height:38, background:"#f0edff", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", border:"2px solid #6c63ff22", overflow:"hidden" },
  notifDropdown:  { position:"absolute", top:46, right:0, background:"#fff", borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.12)", width:280, border:"1px solid #f0f0f0", zIndex:200 },
  notifHeader:    { fontWeight:800, fontSize:14, padding:"14px 16px 10px", borderBottom:"1px solid #f0f0f0" },
  notifItem:      { padding:"12px 16px", borderBottom:"1px solid #f0f0f0" },

  // Content
  content:        { flex:1, padding:"16px 16px 0", overflowY:"auto" },

  // Hero
  heroCard:       { background:"linear-gradient(135deg,#6c63ff,#5a52d5)", borderRadius:20, padding:"20px 20px 16px", marginBottom:14 },
  heroTop:        { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 },
  heroGreet:      { fontWeight:900, fontSize:20, color:"#fff", marginBottom:4 },
  heroSub:        { fontSize:13, color:"rgba(255,255,255,0.8)" },
  xpBadge:        { background:"rgba(255,165,0,0.25)", border:"1px solid rgba(255,165,0,0.5)", color:"#ffd700", borderRadius:20, padding:"5px 14px", fontSize:13, fontWeight:800, whiteSpace:"nowrap" },
  statsRow:       { display:"flex", background:"rgba(255,255,255,0.12)", borderRadius:14, padding:"14px 0" },
  statItem:       { flex:1, textAlign:"center" },
  statEmoji:      { fontSize:22, display:"block", marginBottom:4 },
  statNum:        { fontWeight:900, fontSize:22, color:"#fff" },
  statLabel:      { fontSize:10, color:"rgba(255,255,255,0.7)", marginTop:2 },
  statDivider:    { width:1, background:"rgba(255,255,255,0.2)", margin:"4px 0" },

  // Daily Challenge
  challengeCard:  { background:"#fff", borderRadius:16, padding:"14px 16px", display:"flex", alignItems:"center", gap:12, marginBottom:14, boxShadow:"0 2px 12px rgba(0,0,0,0.05)" },
  challengeIcon:  { width:48, height:48, background:"linear-gradient(135deg,#6c63ff,#a29bfe)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 },
  challengeTitle: { fontWeight:800, fontSize:15, color:"#2d3436" },
  challengeSub:   { fontSize:12, color:"#636e72", marginTop:2 },
  challengeBtn:   { background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, padding:"10px 16px", fontWeight:800, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 },

  // Section title
  sectionTitle:   { fontSize:11, fontWeight:800, color:"#b2bec3", letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 },

  // Exam cards
  examGrid:       { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 },
  jambCard:       { background:"linear-gradient(135deg,#6c63ff,#5a52d5)", borderRadius:18, padding:"20px 16px", cursor:"pointer" },
  postCard:       { background:"linear-gradient(135deg,#00b894,#00a381)", borderRadius:18, padding:"20px 16px", cursor:"pointer" },
  examCardTitle:  { fontWeight:900, fontSize:15, color:"#fff", marginBottom:6 },
  examCardDesc:   { fontSize:11, color:"rgba(255,255,255,0.8)", lineHeight:1.4, marginBottom:14 },
  examCardBtn:    { width:"100%", background:"rgba(255,255,255,0.95)", border:"none", borderRadius:10, padding:"9px 0", fontWeight:800, fontSize:12, cursor:"pointer", color:"#6c63ff" },

  // Arena card
  arenaCard:      { background:"linear-gradient(135deg,#2d1b2e,#4a1942)", borderRadius:18, padding:"18px 16px", display:"flex", alignItems:"center", gap:14, marginBottom:18, cursor:"pointer" },
  arenaTrophy:    { fontSize:36, flexShrink:0 },
  arenaTitle:     { fontWeight:900, fontSize:16, color:"#fff", marginBottom:4 },
  arenaSub:       { fontSize:11, color:"rgba(255,255,255,0.7)", lineHeight:1.5, whiteSpace:"pre-line" },
  arenaBtn:       { background:"rgba(255,255,255,0.15)", border:"1.5px solid rgba(255,255,255,0.3)", color:"#fff", borderRadius:10, padding:"10px 14px", fontWeight:800, fontSize:12, cursor:"pointer", flexShrink:0, whiteSpace:"nowrap" },

  // Recent exams
  recentCard:     { background:"#fff", borderRadius:16, padding:"4px 0", boxShadow:"0 2px 12px rgba(0,0,0,0.05)", marginBottom:14 },
  recentItem:     { display:"flex", alignItems:"center", gap:12, padding:"14px 16px" },
  recentIcon:     { width:44, height:44, background:"#f8f9fa", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 },
  recentTitle:    { fontWeight:700, fontSize:13, color:"#2d3436", marginBottom:3 },
  recentMeta:     { fontSize:11, color:"#b2bec3" },
  viewAllBtn:     { background:"none", border:"none", color:"#6c63ff", fontWeight:700, fontSize:13, cursor:"pointer" },

  // Tool grid
  toolGrid:       { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 },
  toolCard:       { background:"#fff", borderRadius:16, padding:"16px 14px", cursor:"pointer", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" },
  toolIcon:       { width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:10 },
  toolTitle:      { fontWeight:800, fontSize:13, color:"#2d3436", marginBottom:4 },
  toolDesc:       { fontSize:11, color:"#636e72", lineHeight:1.4 },

  // Profile
  profileCard:    { background:"#fff", borderRadius:20, padding:"24px 20px", textAlign:"center", marginBottom:14, boxShadow:"0 2px 12px rgba(0,0,0,0.05)" },
  profileAvatarLg:{ width:80, height:80, background:"#f0edff", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", border:"3px solid #6c63ff22", overflow:"hidden", cursor:"pointer" },
  profileName:    { fontWeight:900, fontSize:18, color:"#2d3436", marginBottom:4 },
  profileEmail:   { fontSize:13, color:"#636e72", marginBottom:14 },
  profileStats:   { display:"flex", gap:16, justifyContent:"center", alignItems:"center", padding:"12px 0", borderTop:"1px solid #f0f0f0", borderBottom:"1px solid #f0f0f0", marginBottom:16 },
  editBtn:        { background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:12, padding:"12px 32px", fontWeight:800, fontSize:14, cursor:"pointer" },
  menuList:       { background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.05)" },
  menuItem:       { display:"flex", alignItems:"center", gap:14, padding:"15px 16px", borderBottom:"1px solid #f8f9fa", cursor:"pointer" },

  // Bottom nav
  bottomNav:      { display:"flex", background:"#fff", borderTop:"1px solid #f0f0f0", position:"sticky", bottom:0, zIndex:50 },
  bottomBtn:      { flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 0", background:"none", border:"none", cursor:"pointer", color:"#b2bec3" },
  bottomBtnActive:{ color:"#6c63ff" },
};
