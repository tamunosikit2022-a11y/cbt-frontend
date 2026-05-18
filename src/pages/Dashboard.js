import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

export default function Dashboard() {
  const { student, logout } = useAuth();
  const nav = useNavigate();

  const [history,       setHistory]       = useState([]);
  const [totalExams,    setTotalExams]    = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [challenge,     setChallenge]     = useState(null);
  const [profile,       setProfile]       = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeTab,     setActiveTab]     = useState("home"); // home | practice | tools | profile
  const [notifOpen,     setNotifOpen]     = useState(false);

  useEffect(() => {
    Promise.all([
      API.get("/auth/profile"),
      API.get("/exam/history"),
      API.get("/innovations/challenge/today").catch(() => null),
      API.get("/auth/notifications").catch(() => ({ data: [] })),
    ]).then(([p, h, c, n]) => {
      setProfile(p.data);
      setTotalExams(h.data.length);
      setHistory(h.data.slice(0, 3));
      if (c) setChallenge(c.data);
      if (n?.data) setNotifications(n.data);
    }).finally(() => setLoading(false));
  }, []);

  const streak    = profile?.current_streak || 0;
  const xp        = profile?.points || 0;
  const avgScore  = history.length
    ? (history.reduce((a, h) => a + parseFloat(h.percentage || 0), 0) / history.length).toFixed(0)
    : 0;
  const name      = student?.full_name?.split(" ")[0] || "Student";
  const unread    = notifications.length;

  const scoreColor = p => parseFloat(p) >= 70 ? "#00b894" : parseFloat(p) >= 50 ? "#f39c12" : "#e17055";

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"#0f0c29", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif" }}>
      <div style={{ fontSize:40, marginBottom:16 }}>🎓</div>
      <p style={{ color:"rgba(255,255,255,0.6)", fontSize:14 }}>Loading your dashboard...</p>
    </div>
  );

  return (
    <div style={s.app}>

      {/* ── TOP BAR ── */}
      <div style={s.topBar}>
        <div style={s.topLogo}>
          <span style={{ fontSize:22 }}>🎓</span>
          <span style={s.logoText}>Scholars CBT</span>
        </div>
        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
          {/* Notification Bell */}
          <div style={{ position:"relative" }} onClick={() => setNotifOpen(!notifOpen)}>
            <button style={s.iconBtn}>🔔</button>
            {unread > 0 && <span style={s.badge}>{unread}</span>}
          </div>
          {/* Avatar */}
          <div onClick={() => setActiveTab("profile")} style={s.avatarSmall}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
              : <span style={{ fontSize:18 }}>👤</span>}
          </div>
        </div>
      </div>

      {/* Notification Dropdown */}
      {notifOpen && (
        <div style={s.notifDropdown}>
          {notifications.length === 0
            ? <p style={{ color:"#636e72", fontSize:13, textAlign:"center", padding:16 }}>No announcements yet</p>
            : notifications.map((n, i) => (
              <div key={i} style={s.notifItem}>
                <div style={{ fontWeight:700, fontSize:13 }}>📢 {n.title}</div>
                <div style={{ fontSize:12, color:"#636e72", marginTop:2 }}>{n.message}</div>
              </div>
            ))}
        </div>
      )}

      {/* ── SCROLLABLE BODY ── */}
      <div style={s.body}>

        {/* ══ HOME TAB ══ */}
        {activeTab === "home" && (
          <>
            {/* Hero greeting card */}
            <div style={s.heroCard}>
              <div style={s.heroTop}>
                <div>
                  <div style={s.heroGreet}>Good day, {name} 👋</div>
                  <div style={s.heroSub}>Ready to ace your exams today?</div>
                </div>
                <div style={s.xpPill}>⚡ {xp} XP</div>
              </div>
              {/* Streak + stats row */}
              <div style={s.heroStats}>
                <div style={s.heroStat}>
                  <span style={{ fontSize:20 }}>🔥</span>
                  <span style={s.heroStatVal}>{streak}</span>
                  <span style={s.heroStatLbl}>Streak</span>
                </div>
                <div style={s.heroStatDivider} />
                <div style={s.heroStat}>
                  <span style={{ fontSize:20 }}>📝</span>
                  <span style={s.heroStatVal}>{totalExams}</span>
                  <span style={s.heroStatLbl}>Exams</span>
                </div>
                <div style={s.heroStatDivider} />
                <div style={s.heroStat}>
                  <span style={{ fontSize:20 }}>📈</span>
                  <span style={s.heroStatVal}>{avgScore}%</span>
                  <span style={s.heroStatLbl}>Avg Score</span>
                </div>
              </div>
            </div>

            {/* Daily Challenge strip */}
            <div style={{ ...s.challengeStrip, background: challenge?.already_done ? "#e8f8f5" : "linear-gradient(135deg,#6c63ff,#a29bfe)" }}
              onClick={() => nav("/challenge")}>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color: challenge?.already_done ? "#00b894" : "#fff" }}>
                  🎯 Daily Challenge
                </div>
                <div style={{ fontSize:12, color: challenge?.already_done ? "#636e72" : "rgba(255,255,255,0.85)", marginTop:2 }}>
                  {challenge?.already_done ? `✅ Done! Score: ${challenge?.attempt?.percentage || 0}%` : `${challenge?.challenge?.subject || "Today's"} · 10 questions · 2 mins`}
                </div>
              </div>
              <div style={{ ...s.stripBtn, background: challenge?.already_done ? "#00b894" : "#fff", color: challenge?.already_done ? "#fff" : "#6c63ff" }}>
                {challenge?.already_done ? "✓" : "Play →"}
              </div>
            </div>

            {/* MAIN ACTION CARDS — JAMB & Post-UTME */}
            <div style={s.sectionLabel}>Start Exam</div>
            <div style={s.mainCards}>
              <div style={s.jambCard} onClick={() => nav("/exam-select?type=JAMB")}>
                <div style={s.mainCardIcon}>📘</div>
                <div style={s.mainCardTitle}>JAMB / UTME</div>
                <div style={s.mainCardDesc}>Full simulation · Single subject · Past questions</div>
                <div style={s.mainCardBtn}>Start →</div>
              </div>
              <div style={s.postCard} onClick={() => nav("/exam-select?type=POST-UTME")}>
                <div style={s.mainCardIcon}>🏫</div>
                <div style={s.mainCardTitle}>Post-UTME</div>
                <div style={s.mainCardDesc}>UNILAG · UI · OAU · UNIPORT & more</div>
                <div style={s.mainCardBtn}>Start →</div>
              </div>
            </div>

            {/* Arena Card */}
            <div style={s.arenaCard} onClick={() => nav("/arena")}>
              <div style={{ flex:1 }}>
                <div style={s.arenaTitle}>🏟️ Scholars Arena</div>
                <div style={s.arenaDesc}>1v1 battles · Duo · 50-player Clash · Live competition</div>
              </div>
              <div style={s.arenaEnter}>Enter →</div>
            </div>

            {/* Recent Exams */}
            {history.length > 0 && (
              <>
                <div style={{ ...s.sectionLabel, marginTop:24 }}>Recent Exams</div>
                <div style={s.historyCard}>
                  {history.map((h, i) => (
                    <div key={h.id} style={{ ...s.histRow, borderBottom: i < history.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:13, color:"#2d3436" }}>{h.subject} · {h.exam_type}</div>
                        <div style={{ fontSize:11, color:"#b2bec3", marginTop:2 }}>{new Date(h.completed_at).toLocaleDateString("en-NG")}</div>
                      </div>
                      <div style={{ fontWeight:900, fontSize:20, color:scoreColor(h.percentage) }}>
                        {parseFloat(h.percentage).toFixed(0)}%
                      </div>
                    </div>
                  ))}
                  <button style={s.viewAllBtn} onClick={() => setActiveTab("tools")}>View all →</button>
                </div>
              </>
            )}
          </>
        )}

        {/* ══ PRACTICE TAB ══ */}
        {activeTab === "practice" && (
          <>
            <div style={s.tabHero}>
              <div style={s.tabHeroTitle}>📚 Practice Centre</div>
              <div style={s.tabHeroSub}>All practice modes — completely free</div>
            </div>

            <div style={s.sectionLabel}>Exam Preparation</div>
            <div style={s.toolGrid}>
              <ToolCard icon="📘" title="JAMB Full Exam"    desc="4 subjects · 180 questions · 2hrs"     color="#6c63ff" onClick={() => nav("/exam-select?type=JAMB")} />
              <ToolCard icon="🏫" title="Post-UTME"        desc="University-specific format"             color="#00b894" onClick={() => nav("/exam-select?type=POST-UTME")} />
              <ToolCard icon="📖" title="Subject Practice" desc="40 questions per subject"               color="#0984e3" onClick={() => nav("/exam-select?type=JAMB")} />
              <ToolCard icon="🎯" title="Daily Challenge"  desc="10 questions · new every day"           color="#a29bfe" onClick={() => nav("/challenge")} />
            </div>

            <div style={s.sectionLabel}>Smart Learning</div>
            <div style={s.toolGrid}>
              <ToolCard icon="🔁" title="Error Review"     desc="Redo your wrong answers"               color="#e17055" onClick={() => nav("/error-review")} />
              <ToolCard icon="💪" title="Beat Yourself"    desc="Break your personal best"              color="#00b894" onClick={() => nav("/beat-yourself")} />
              <ToolCard icon="📂" title="Resume Exam"      desc="Continue unfinished exam"              color="#0984e3" onClick={() => nav("/resume")} />
              <ToolCard icon="🧠" title="Weakness Mode"    desc="Target your weak areas"                color="#6c63ff" onClick={() => nav("/exam-select")} />
            </div>

            <div style={s.sectionLabel}>Arena Battles</div>
            <div style={s.toolGrid}>
              <ToolCard icon="🏟️" title="Enter Arena"     desc="Live battles with students"            color="#e17055" onClick={() => nav("/arena")} wide />
            </div>
          </>
        )}

        {/* ══ TOOLS TAB ══ */}
        {activeTab === "tools" && (
          <>
            <div style={s.tabHero}>
              <div style={s.tabHeroTitle}>📊 Analytics & Tools</div>
              <div style={s.tabHeroSub}>Track progress and plan your success</div>
            </div>

            <div style={s.sectionLabel}>My Performance</div>
            <div style={s.toolGrid}>
              <ToolCard icon="📊" title="Analytics"        desc="Subjects · strengths · weaknesses"     color="#6c63ff" onClick={() => nav("/performance")} />
              <ToolCard icon="🎓" title="Predicted Score"  desc="Estimate your JAMB score"              color="#00b894" onClick={() => nav("/predicted")} />
              <ToolCard icon="🏛" title="Admission Chance" desc="Check university cut-offs"             color="#0984e3" onClick={() => nav("/admission")} />
              <ToolCard icon="🧠" title="Exam Personality" desc="Understand your exam style"            color="#a29bfe" onClick={() => nav("/personality")} />
            </div>

            <div style={s.sectionLabel}>History & Achievements</div>
            <div style={s.toolGrid}>
              <ToolCard icon="📋" title="Exam History"     desc="All past sessions"                     color="#636e72" onClick={() => nav("/history")} />
              <ToolCard icon="🏅" title="My Badges"        desc="Achievements earned"                   color="#fdcb6e" onClick={() => nav("/badges")} />
              <ToolCard icon="🏆" title="Leaderboard"      desc="Top students ranking"                  color="#e17055" onClick={() => nav("/leaderboard")} />
            </div>
          </>
        )}

        {/* ══ PROFILE TAB ══ */}
        {activeTab === "profile" && (
          <>
            {/* Profile hero */}
            <div style={s.profileHero}>
              <div style={s.profileAvatar} onClick={() => nav("/profile")}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />
                  : <span style={{ fontSize:40 }}>👤</span>}
              </div>
              <div style={s.profileName}>{student?.full_name || "Student"}</div>
              <div style={s.profileEmail}>{student?.email}</div>
              <div style={s.profileXP}>⚡ {xp} XP · 🔥 {streak} day streak</div>
              <button style={s.editProfileBtn} onClick={() => nav("/profile")}>Edit Profile</button>
            </div>

            {/* Account options */}
            <div style={s.menuList}>
              <MenuItem icon="👤" label="Edit Profile"       onClick={() => nav("/profile")} />
              <MenuItem icon="🔑" label="Activate Key"       onClick={() => nav("/upgrade")} />
              <MenuItem icon="🏅" label="My Badges"          onClick={() => nav("/badges")} />
              <MenuItem icon="🏆" label="Leaderboard"        onClick={() => nav("/leaderboard")} />
              <MenuItem icon="📊" label="My Analytics"       onClick={() => nav("/performance")} />
              <MenuItem icon="🎓" label="Predicted Score"    onClick={() => nav("/predicted")} />
              <MenuItem icon="🏛" label="Admission Checker"  onClick={() => nav("/admission")} />
              <MenuItem icon="🧠" title="Exam Personality"   onClick={() => nav("/personality")} label="Exam Personality" />
            </div>

            <button style={s.logoutBtn} onClick={logout}>🚪 Log Out</button>
          </>
        )}

      </div>

      {/* ── BOTTOM NAV ── */}
      <nav style={s.bottomNav}>
        {[
          { id:"home",     icon:"🏠", label:"Home"     },
          { id:"practice", icon:"📚", label:"Practice" },
          { id:"tools",    icon:"📊", label:"Tools"    },
          { id:"profile",  icon:"👤", label:"Profile"  },
        ].map(tab => (
          <button key={tab.id} style={{ ...s.navBtn, ...(activeTab === tab.id ? s.navBtnActive : {}) }}
            onClick={() => setActiveTab(tab.id)}>
            <span style={{ fontSize:22 }}>{tab.icon}</span>
            <span style={{ fontSize:10, marginTop:2, fontWeight: activeTab === tab.id ? 700 : 400 }}>{tab.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}

// ── SUB-COMPONENTS ─────────────────────────────────────────
function ToolCard({ icon, title, desc, color, onClick, wide }) {
  return (
    <div style={{ ...tc.card, ...(wide ? { gridColumn:"1/-1" } : {}) }} onClick={onClick}>
      <div style={{ ...tc.icon, background:`${color}18`, color }}>{icon}</div>
      <div style={tc.title}>{title}</div>
      <div style={tc.desc}>{desc}</div>
    </div>
  );
}
const tc = {
  card:  { background:"#fff", borderRadius:14, padding:"16px 14px", cursor:"pointer", boxShadow:"0 1px 8px rgba(0,0,0,0.06)", display:"flex", flexDirection:"column", gap:6, border:"1px solid #f0f0f0" },
  icon:  { width:40, height:40, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:2 },
  title: { fontWeight:800, fontSize:14, color:"#2d3436" },
  desc:  { fontSize:11, color:"#636e72", lineHeight:1.4 },
};

function MenuItem({ icon, label, onClick }) {
  return (
    <div style={mi.row} onClick={onClick}>
      <span style={{ fontSize:20, width:32 }}>{icon}</span>
      <span style={mi.label}>{label}</span>
      <span style={mi.arrow}>›</span>
    </div>
  );
}
const mi = {
  row:   { display:"flex", alignItems:"center", gap:14, padding:"15px 18px", borderBottom:"1px solid #f5f5f5", cursor:"pointer", background:"#fff" },
  label: { flex:1, fontWeight:600, fontSize:15, color:"#2d3436" },
  arrow: { fontSize:22, color:"#b2bec3" },
};

// ── STYLES ────────────────────────────────────────────────
const s = {
  app:         { minHeight:"100vh", background:"#f4f6fb", fontFamily:"'Segoe UI',sans-serif", display:"flex", flexDirection:"column", maxWidth:480, margin:"0 auto", position:"relative" },
  topBar:      { position:"sticky", top:0, zIndex:200, background:"#fff", padding:"12px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #f0f0f0", boxShadow:"0 1px 6px rgba(0,0,0,0.06)" },
  topLogo:     { display:"flex", alignItems:"center", gap:8 },
  logoText:    { fontWeight:900, fontSize:17, color:"#6c63ff" },
  iconBtn:     { background:"#f4f6fb", border:"none", borderRadius:10, width:38, height:38, fontSize:18, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  badge:       { position:"absolute", top:-4, right:-4, background:"#e17055", color:"#fff", borderRadius:10, fontSize:9, fontWeight:800, padding:"1px 5px", minWidth:16, textAlign:"center" },
  avatarSmall: { width:36, height:36, borderRadius:"50%", background:"#f0edff", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", border:"2px solid #6c63ff" },
  notifDropdown: { position:"fixed", top:62, right:12, width:300, background:"#fff", borderRadius:14, boxShadow:"0 8px 32px rgba(0,0,0,0.15)", zIndex:300, overflow:"hidden", border:"1px solid #f0f0f0" },
  notifItem:   { padding:"12px 16px", borderBottom:"1px solid #f5f5f5" },
  body:        { flex:1, overflowY:"auto", padding:"16px 16px 100px" },

  // Hero
  heroCard:    { background:"linear-gradient(135deg,#6c63ff 0%,#a29bfe 100%)", borderRadius:20, padding:"22px 20px", marginBottom:14, color:"#fff" },
  heroTop:     { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 },
  heroGreet:   { fontSize:20, fontWeight:900 },
  heroSub:     { fontSize:12, opacity:0.85, marginTop:3 },
  xpPill:      { background:"rgba(255,255,255,0.25)", borderRadius:20, padding:"5px 12px", fontSize:13, fontWeight:800 },
  heroStats:   { display:"flex", background:"rgba(255,255,255,0.18)", borderRadius:14, padding:"14px 10px" },
  heroStat:    { flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3 },
  heroStatVal: { fontSize:20, fontWeight:900, color:"#fff" },
  heroStatLbl: { fontSize:10, color:"rgba(255,255,255,0.8)", fontWeight:600 },
  heroStatDivider: { width:1, background:"rgba(255,255,255,0.3)", margin:"0 6px" },

  // Challenge
  challengeStrip: { borderRadius:14, padding:"14px 16px", marginBottom:12, display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer" },
  stripBtn:    { borderRadius:20, padding:"7px 16px", border:"none", fontWeight:700, fontSize:13, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 },

  // Main Cards
  sectionLabel:{ fontSize:12, fontWeight:800, color:"#b2bec3", letterSpacing:1, textTransform:"uppercase", marginBottom:10, marginTop:4 },
  mainCards:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 },
  jambCard:    { background:"linear-gradient(135deg,#6c63ff,#4834d4)", borderRadius:18, padding:"20px 16px", cursor:"pointer", display:"flex", flexDirection:"column", gap:6 },
  postCard:    { background:"linear-gradient(135deg,#00b894,#00cec9)", borderRadius:18, padding:"20px 16px", cursor:"pointer", display:"flex", flexDirection:"column", gap:6 },
  mainCardIcon:{ fontSize:28 },
  mainCardTitle:{ fontSize:16, fontWeight:900, color:"#fff" },
  mainCardDesc: { fontSize:11, color:"rgba(255,255,255,0.8)", lineHeight:1.4 },
  mainCardBtn: { marginTop:8, background:"rgba(255,255,255,0.22)", color:"#fff", border:"none", borderRadius:10, padding:"7px 0", fontWeight:700, fontSize:12, cursor:"pointer", textAlign:"center" },

  // Arena
  arenaCard:   { background:"linear-gradient(135deg,#1a1a2e,#e17055)", borderRadius:18, padding:"18px 20px", marginBottom:14, display:"flex", alignItems:"center", gap:14, cursor:"pointer" },
  arenaTitle:  { fontSize:16, fontWeight:900, color:"#fff", marginBottom:4 },
  arenaDesc:   { fontSize:12, color:"rgba(255,255,255,0.75)" },
  arenaEnter:  { background:"rgba(255,255,255,0.2)", color:"#fff", border:"none", borderRadius:10, padding:"10px 16px", fontWeight:800, cursor:"pointer", fontSize:13, whiteSpace:"nowrap" },

  // History
  historyCard: { background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 1px 8px rgba(0,0,0,0.06)", marginBottom:16 },
  histRow:     { padding:"14px 16px", display:"flex", alignItems:"center", gap:12 },
  viewAllBtn:  { width:"100%", padding:12, background:"none", border:"none", borderTop:"1px solid #f5f5f5", color:"#6c63ff", fontWeight:700, cursor:"pointer", fontSize:13 },

  // Tool Grid
  toolGrid:    { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 },

  // Tab Hero
  tabHero:     { background:"linear-gradient(135deg,#6c63ff,#a29bfe)", borderRadius:18, padding:"20px", marginBottom:18, color:"#fff" },
  tabHeroTitle:{ fontSize:20, fontWeight:900 },
  tabHeroSub:  { fontSize:13, opacity:0.85, marginTop:4 },

  // Profile Tab
  profileHero: { background:"linear-gradient(135deg,#6c63ff,#a29bfe)", borderRadius:20, padding:"28px 20px", marginBottom:18, display:"flex", flexDirection:"column", alignItems:"center", gap:8, color:"#fff" },
  profileAvatar:{ width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,0.25)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", overflow:"hidden", border:"3px solid rgba(255,255,255,0.5)" },
  profileName: { fontSize:20, fontWeight:900 },
  profileEmail:{ fontSize:13, opacity:0.8 },
  profileXP:   { fontSize:13, background:"rgba(255,255,255,0.2)", borderRadius:20, padding:"5px 14px", fontWeight:700 },
  editProfileBtn:{ background:"rgba(255,255,255,0.25)", color:"#fff", border:"1px solid rgba(255,255,255,0.5)", borderRadius:10, padding:"8px 24px", fontWeight:700, cursor:"pointer", marginTop:4 },
  menuList:    { background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 1px 8px rgba(0,0,0,0.06)", marginBottom:16 },
  logoutBtn:   { width:"100%", padding:16, background:"#fff", color:"#e17055", border:"2px solid #e17055", borderRadius:14, fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:8 },

  // Bottom Nav
  bottomNav:   { position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, background:"#fff", borderTop:"1px solid #f0f0f0", display:"flex", zIndex:200, boxShadow:"0 -4px 20px rgba(0,0,0,0.08)" },
  navBtn:      { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"10px 0", background:"none", border:"none", cursor:"pointer", color:"#b2bec3", gap:1 },
  navBtnActive:{ color:"#6c63ff" },
};
