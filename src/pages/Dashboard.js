import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import OnboardingTour from "../components/OnboardingTour";

// ── Global CSS ─────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0B1020; font-family: 'Plus Jakarta Sans', sans-serif; }

  @keyframes float-up  { 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-60px) scale(1.2)} }
  @keyframes slide-in  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes glow-p    { 0%,100%{box-shadow:0 0 12px rgba(124,92,255,.35)} 50%{box-shadow:0 0 28px rgba(124,92,255,.75)} }
  @keyframes glow-g    { 0%,100%{box-shadow:0 0 12px rgba(255,200,87,.3)} 50%{box-shadow:0 0 24px rgba(255,200,87,.65)} }
  @keyframes xp-float  { 0%{opacity:0;transform:translateY(0) scale(.8)} 20%{opacity:1;transform:translateY(-12px) scale(1.1)} 80%{opacity:1;transform:translateY(-44px) scale(1)} 100%{opacity:0;transform:translateY(-62px) scale(.9)} }
  @keyframes bar-in    { from{width:0} to{width:var(--w)} }
  @keyframes pulse-dot { 0%,100%{opacity:.5;transform:scale(.85)} 50%{opacity:1;transform:scale(1.05)} }

  .c-btn { transition: transform .15s ease, box-shadow .18s ease; cursor: pointer; }
  .c-btn:active { transform: scale(.96); }
  .nav-btn { transition: all .2s ease; }
  .nav-btn:active { transform: scale(.9); }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: #7C5CFF44; border-radius: 4px; }
`;

const C = {
  bg:     "#0B1020",
  bg2:    "#111827",
  bg3:    "#1a2035",
  purple: "#7C5CFF",
  purpleL:"#9D7BFF",
  green:  "#00D084",
  gold:   "#FFC857",
  red:    "#FF5A5F",
  blue:   "#5B8CFF",
  text:   "#F1F5F9",
  muted:  "rgba(255,255,255,0.48)",
  border: "rgba(255,255,255,0.08)",
};

// ── Tiny helpers ────────────────────────────────────────────
function XPFloat({ amount, visible }) {
  if (!visible) return null;
  return (
    <div style={{ position:"fixed", top:"22%", left:"50%", transform:"translateX(-50%)", fontSize:26, fontWeight:900, color:C.gold, zIndex:999, pointerEvents:"none", animation:"xp-float 1.6s ease forwards", textShadow:`0 0 18px ${C.gold}` }}>
      ⚡ +{amount} XP
    </div>
  );
}

function LevelBar({ level, pct, title, icon }) {
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:5 }}>
        <div style={{ display:"flex", alignItems:"center", gap:7 }}>
          <span style={{ fontSize:16 }}>{icon || "⭐"}</span>
          <span style={{ fontSize:12, fontWeight:800, color:C.text }}>Lv.{level} · {title}</span>
        </div>
        <span style={{ fontSize:11, color:C.gold, fontWeight:700 }}>{pct}%</span>
      </div>
      <div style={{ height:5, background:"rgba(255,255,255,0.08)", borderRadius:10, overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(90deg,${C.purple},${C.gold})`, borderRadius:10, transition:"width 1s ease", boxShadow:`0 0 8px ${C.purple}77` }} />
      </div>
    </div>
  );
}

function Btn({ children, onClick, grad, glow, style={} }) {
  return (
    <button className="c-btn" onClick={onClick} style={{
      background: grad || `linear-gradient(135deg,${C.purple},${C.blue})`,
      border:"none", borderRadius:12, color:"#fff",
      fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:800,
      boxShadow:`0 4px 18px ${glow||C.purple}44`,
      cursor:"pointer", ...style,
    }}>{children}</button>
  );
}

function Card({ children, style={}, onClick, color }) {
  return (
    <div onClick={onClick} style={{
      background: color ? `${color}0a` : "rgba(255,255,255,0.04)",
      border:`1px solid ${color ? `${color}28` : C.border}`,
      borderRadius:18, cursor:onClick?"pointer":undefined,
      transition:"transform .18s ease, box-shadow .2s ease",
      ...style,
    }}>{children}</div>
  );
}

export default function Dashboard() {
  const { student, logout } = useAuth();
  const nav  = useNavigate();

  const [profile,       setProfile]       = useState(null);
  const [history,       setHistory]       = useState([]);
  const [challenge,     setChallenge]     = useState(null);
  const [levelData,     setLevelData]     = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [activeTab,     setActiveTab]     = useState("home");
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [sideOpen,      setSideOpen]      = useState(false);
  const [xpFloat,       setXpFloat]       = useState(null);
  const [showOnboarding,setShowOnboarding]= useState(!localStorage.getItem("onboarding_done"));

  useEffect(() => {
    if (!document.getElementById("dash-css")) {
      const s = document.createElement("style");
      s.id = "dash-css";
      s.textContent = GLOBAL_CSS;
      document.head.appendChild(s);
    }
    document.body.style.background = C.bg;
    return () => { document.body.style.background = ""; };
  }, []);

  useEffect(() => {
    API.get("/auth/profile")
      .then(p => { if (p?.data) setProfile(p.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    Promise.all([
      API.get("/exam/history").catch(() => ({ data:[] })),
      API.get("/innovations/challenge/today").catch(() => null),
      API.get("/auth/notifications").catch(() => ({ data:{ notifications:[], unread:0 } })),
      API.get("/missions/level").catch(() => null),
    ]).then(([h,c,n,lv]) => {
      if (h?.data) setHistory(h.data.slice(0,5));
      if (c?.data) setChallenge(c.data);
      if (n?.data) {
        const d = n.data;
        setNotifications(Array.isArray(d) ? d : (d.notifications || []));
        setUnreadCount(d.unread || 0);
      }
      if (lv?.data) setLevelData(lv.data);
    }).catch(() => {});
  }, []);

  const streak    = profile?.current_streak || 0;
  const xp        = profile?.points  || 0;
  const coins     = profile?.coins   || 0;
  const firstName = (student?.full_name || profile?.full_name || "Scholar").split(" ")[0];
  const initials  = (student?.full_name || profile?.full_name || "S").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const avgScore  = history.length ? (history.reduce((a,h)=>a+parseFloat(h.percentage||0),0)/history.length).toFixed(0) : 0;
  const bestScore = history.length ? Math.max(...history.map(h=>parseFloat(h.percentage||0))).toFixed(0) : 0;
  const scoreColor = p => parseFloat(p)>=70 ? C.green : parseFloat(p)>=50 ? C.gold : C.red;

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ width:56, height:56, borderRadius:16, background:`linear-gradient(135deg,${C.purple},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, animation:"glow-p 2s infinite" }}>🎓</div>
      <p style={{ color:C.muted, fontSize:13 }}>Loading your dashboard...</p>
    </div>
  );

  // ── SIDEBAR ─────────────────────────────────────────────
  const SideItems = [
    { id:"home",     label:"Home",           emoji:"🏠" },
    { id:"learn",    label:"Practice",       emoji:"📚" },
    { id:"progress", label:"Progress",       emoji:"📊" },
    { id:"profile",  label:"Profile",        emoji:"👤" },
    { nav:"/arena",       label:"Arena",          emoji:"⚔️" },
    { nav:"/missions",    label:"Daily Missions",  emoji:"🎯", dot:true },
    { nav:"/videos",      label:"Video Library",   emoji:"📺" },
    { nav:"/leaderboard", label:"Leaderboard",     emoji:"🏆" },
    { nav:"/gems",        label:"Gem Store",       emoji:"💎" },
    { nav:"/spirits",     label:"Scholar Spirits", emoji:"👻" },
    { nav:"/vault",       label:"Knowledge Vault", emoji:"📖" },
    { nav:"/factions",    label:"School Factions", emoji:"🌍" },
    { nav:"/classroom",   label:"Scholar Sessions",emoji:"🎓" },
  ];

  const Sidebar = () => (
    <>
      {sideOpen && <div onClick={() => setSideOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.72)", zIndex:98, backdropFilter:"blur(4px)" }} />}
      <aside style={{
        position:"fixed", top:0, left:0, bottom:0, width:240,
        background:"#080d1a", borderRight:`1px solid ${C.border}`,
        zIndex:99, display:"flex", flexDirection:"column", padding:"18px 0 14px",
        transform: sideOpen ? "translateX(0)" : "translateX(-100%)",
        transition:"transform .3s cubic-bezier(.4,0,.2,1)",
        boxShadow: sideOpen ? `4px 0 36px rgba(124,92,255,.28)` : "none",
        overflowY:"auto",
      }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 16px 18px", borderBottom:`1px solid ${C.border}`, marginBottom:6 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:`linear-gradient(135deg,${C.purple},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>🎓</div>
          <div>
            <div style={{ fontWeight:900, fontSize:13, color:C.text, letterSpacing:.8 }}>SCHOLARS</div>
            <div style={{ fontSize:9, color:C.muted, letterSpacing:2 }}>SYNDICATE</div>
          </div>
          <button onClick={() => setSideOpen(false)} style={{ marginLeft:"auto", background:"none", border:"none", color:C.muted, fontSize:20, cursor:"pointer" }}>✕</button>
        </div>

        <nav style={{ padding:"4px 8px" }}>
          {SideItems.map((item,i) => {
            const isActive = item.id && activeTab === item.id;
            return (
              <div key={i} onClick={() => {
                setSideOpen(false);
                if (item.nav) { nav(item.nav); return; }
                if (item.id) setActiveTab(item.id);
              }} style={{
                display:"flex", alignItems:"center", gap:11,
                padding:"10px 14px", cursor:"pointer", borderRadius:11, marginBottom:2,
                background: isActive ? `linear-gradient(135deg,${C.purple}33,${C.blue}22)` : "transparent",
                border: `1px solid ${isActive ? `${C.purple}44` : "transparent"}`,
                color: isActive ? C.text : C.muted,
                fontWeight: isActive ? 700 : 500, fontSize:13,
                transition:"all .18s ease",
              }}>
                <span style={{ fontSize:17, width:20, textAlign:"center" }}>{item.emoji}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.dot && <span style={{ width:7, height:7, borderRadius:"50%", background:C.green, boxShadow:`0 0 7px ${C.green}`, animation:"pulse-dot 2s infinite" }} />}
              </div>
            );
          })}
        </nav>

        <div style={{ margin:"10px 10px 0", background:`linear-gradient(135deg,${C.purple}20,${C.gold}10)`, border:`1px solid ${C.gold}30`, borderRadius:14, padding:"14px 12px", textAlign:"center" }}>
          <div style={{ fontSize:20, marginBottom:5 }}>👑</div>
          <div style={{ fontWeight:800, fontSize:12, color:C.gold, marginBottom:3 }}>Upgrade to Pro</div>
          <Btn onClick={() => nav("/upgrade")} grad={`linear-gradient(135deg,${C.gold},#FFB300)`} glow={C.gold} style={{ width:"100%", padding:"9px 0", fontSize:12, borderRadius:9, marginTop:8 }}>
            Upgrade Now
          </Btn>
        </div>
      </aside>
    </>
  );

  // ── HEADER ───────────────────────────────────────────────
  const Header = () => (
    <header style={{
      background:"rgba(8,13,26,.94)", backdropFilter:"blur(20px)",
      borderBottom:`1px solid ${C.border}`, padding:"10px 14px",
      display:"flex", alignItems:"center", gap:9,
      position:"sticky", top:0, zIndex:50,
    }}>
      <button className="nav-btn" onClick={() => setSideOpen(true)} style={{ background:"rgba(255,255,255,.06)", border:`1px solid ${C.border}`, borderRadius:9, width:36, height:36, fontSize:18, cursor:"pointer", color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>☰</button>

      <div style={{ flex:1 }}>
        <div style={{ fontWeight:900, fontSize:14, color:C.text }}>Scholars Syndicate</div>
        <div style={{ fontSize:10, color:C.muted }}>Learn · Practice · Excel</div>
      </div>

      {/* Coins */}
      <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,200,87,.09)", border:`1px solid ${C.gold}30`, borderRadius:9, padding:"5px 9px" }}>
        <span style={{ fontSize:13 }}>🪙</span>
        <span style={{ fontWeight:800, color:C.gold, fontSize:13 }}>{coins.toLocaleString()}</span>
      </div>

      {/* Notifications */}
      <div style={{ position:"relative" }}>
        <button className="nav-btn" onClick={() => {
          setNotifOpen(!notifOpen);
          if (!notifOpen && unreadCount > 0) { setUnreadCount(0); API.post("/auth/notifications/read").catch(()=>{}); }
        }} style={{ position:"relative", background:"rgba(255,255,255,.06)", border:`1px solid ${C.border}`, borderRadius:9, width:36, height:36, fontSize:15, cursor:"pointer", color:C.text, display:"flex", alignItems:"center", justifyContent:"center" }}>
          🔔
          {unreadCount > 0 && <span style={{ position:"absolute", top:-4, right:-4, background:C.red, color:"#fff", borderRadius:"50%", width:15, height:15, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{unreadCount}</span>}
        </button>
        {notifOpen && (
          <div style={{ position:"absolute", top:44, right:0, background:C.bg2, border:`1px solid ${C.border}`, borderRadius:14, width:272, zIndex:200, boxShadow:"0 16px 48px rgba(0,0,0,.55)", overflow:"hidden" }}>
            <div style={{ fontWeight:800, fontSize:13, padding:"12px 14px 10px", color:C.text, borderBottom:`1px solid ${C.border}` }}>Notifications</div>
            {notifications.length === 0
              ? <p style={{ color:C.muted, fontSize:13, textAlign:"center", padding:"16px 0" }}>No new notifications</p>
              : notifications.map((n,i) => (
                <div key={i} style={{ padding:"11px 14px", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{n.title}</div>
                  <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>{n.message}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div onClick={() => setActiveTab("profile")} style={{ width:36, height:36, borderRadius:"50%", cursor:"pointer", background:`linear-gradient(135deg,${C.purple},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color:"#fff", border:`2px solid ${C.purple}55`, overflow:"hidden" }}>
        {profile?.avatar_url?.startsWith("http")
          ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}} />
          : profile?.avatar_url && !profile.avatar_url.startsWith("http") ? profile.avatar_url : initials}
      </div>
    </header>
  );

  // ── HOME TAB ─────────────────────────────────────────────
  const HomeTab = () => (
    <div style={{ padding:"16px 14px 100px", animation:"slide-in .3s ease" }}>

      {/* ── Premium teaser — free users only ── */}
      {!student?.is_premium && (
        <div
          onClick={() => nav("/upgrade")}
          style={{
            background:"linear-gradient(135deg,#6c63ff22,#e1700518)",
            border:"1.5px solid #6c63ff44",
            borderRadius:16, padding:"13px 14px", marginBottom:14,
            display:"flex", alignItems:"center", gap:11, cursor:"pointer",
          }}>
          <div style={{ fontSize:28, flexShrink:0, filter:"drop-shadow(0 0 8px gold)" }}>👑</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:800, fontSize:13, color:C.text, marginBottom:2 }}>
              Unlock full access — from ₦100
            </div>
            <div style={{ fontSize:11, color:C.muted, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              Full explanations · AI weakness mode · 2× XP · all Post-UTME
            </div>
          </div>
          <div style={{ background:"linear-gradient(135deg,#6c63ff,#a29bfe)", borderRadius:9, padding:"8px 12px", color:"#fff", fontWeight:800, fontSize:12, flexShrink:0 }}>
            Upgrade →
          </div>
        </div>
      )}

      {/* Hero card */}
      <div style={{ background:`linear-gradient(135deg,${C.purple}cc,${C.blue}99)`, borderRadius:22, padding:"20px 18px", marginBottom:14, position:"relative", overflow:"hidden", boxShadow:`0 8px 36px ${C.purple}44`, border:`1px solid ${C.purple}44` }}>
        <div style={{ position:"absolute", top:-30, right:-30, width:100, height:100, borderRadius:"50%", background:`${C.blue}33`, filter:"blur(25px)" }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16 }}>
          <div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,.65)", marginBottom:3 }}>Welcome back,</div>
            <div style={{ fontSize:21, fontWeight:900, color:"#fff" }}>{firstName} 👋</div>
          </div>
          <div style={{ background:"rgba(255,200,87,.18)", border:`1px solid ${C.gold}55`, borderRadius:11, padding:"5px 12px", display:"flex", alignItems:"center", gap:5, animation:"glow-g 3s infinite" }}>
            <span style={{ fontSize:13 }}>⚡</span>
            <span style={{ fontWeight:900, color:C.gold, fontSize:13 }}>{xp.toLocaleString()} XP</span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:16 }}>
          {[
            { icon:"🔥", val:streak, lbl:"Streak" },
            { icon:"📝", val:history.length, lbl:"Exams" },
            { icon:"📈", val:`${avgScore}%`, lbl:"Avg Score" },
          ].map((s,i) => (
            <div key={i} style={{ background:"rgba(255,255,255,.1)", borderRadius:12, padding:"11px 6px", textAlign:"center", backdropFilter:"blur(8px)" }}>
              <div style={{ fontSize:20, marginBottom:3 }}>{s.icon}</div>
              <div style={{ fontSize:18, fontWeight:900, color:"#fff" }}>{s.val}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.6)", marginTop:1 }}>{s.lbl}</div>
            </div>
          ))}
        </div>

        {levelData && (
          <div style={{ background:"rgba(0,0,0,.18)", borderRadius:11, padding:"10px 12px" }}>
            <LevelBar level={levelData.level} pct={levelData.pct} title={levelData.title} icon={levelData.icon} />
          </div>
        )}
      </div>

      {/* ── Quick Actions — 2 most important only ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
        <Btn onClick={() => nav("/exam-select?type=JAMB")} grad={`linear-gradient(135deg,${C.purple},${C.blue})`} glow={C.purple}
          style={{ padding:"16px 0", fontSize:14, borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:24 }}>📘</span>
          <span>Start JAMB</span>
        </Btn>
        <Btn onClick={() => nav("/exam-select?type=POST-UTME")} grad={`linear-gradient(135deg,${C.green}cc,#00a36c)`} glow={C.green}
          style={{ padding:"16px 0", fontSize:14, borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <span style={{ fontSize:24 }}>🏫</span>
          <span>Post-UTME</span>
        </Btn>
      </div>

      {/* ── Daily Strip — small, horizontal, not bulky ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:14 }}>
        {[
          { emoji:"🎯", label:"Missions", sub:"Earn XP", path:"/missions", color:C.purple },
          { emoji:challenge?.already_done?"✅":"⚡", label:"Challenge", sub:challenge?.already_done?"Done":"Daily", path:"/challenge", color:C.gold },
          { emoji:"🎰", label:"Spin", sub:"Win prizes", path:"/spin", color:C.blue },
        ].map((a,i) => (
          <div key={i} onClick={() => nav(a.path)} className="c-btn" style={{
            background:`${a.color}12`, border:`1px solid ${a.color}30`,
            borderRadius:14, padding:"13px 8px", textAlign:"center", cursor:"pointer",
          }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{a.emoji}</div>
            <div style={{ fontWeight:800, fontSize:12, color:C.text }}>{a.label}</div>
            <div style={{ fontSize:10, color:a.color, marginTop:2 }}>{a.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Arena — one prominent card ── */}
      <div onClick={() => nav("/arena")} className="c-btn" style={{
        background:"linear-gradient(135deg,#1a0a2e,#2d1060)",
        borderRadius:18, padding:"16px 16px", marginBottom:14,
        display:"flex", alignItems:"center", gap:14, cursor:"pointer",
        border:`1px solid ${C.purple}33`,
        boxShadow:`0 6px 28px rgba(124,92,255,.2)`,
      }}>
        <div style={{ fontSize:42, filter:"drop-shadow(0 0 10px gold)", flexShrink:0 }}>🏆</div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:3 }}>Scholars Arena</div>
          <div style={{ fontSize:12, color:C.muted }}>Live battles · 1v1 · Duo · 50-player Royale</div>
        </div>
        <Btn style={{ padding:"9px 14px", fontSize:12, borderRadius:9, flexShrink:0 }}>Enter →</Btn>
      </div>

      {/* ── Metaverse — compact 2x2 grid ── */}
      <div style={{ fontSize:10, fontWeight:800, color:C.muted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>⚡ Metaverse</div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:14 }}>
        {[
          { emoji:"💎", title:"Gem Store",   path:"/gems",     color:"#00D4FF" },
          { emoji:"👻", title:"Spirits",     path:"/spirits",  color:C.purple },
          { emoji:"⚡", title:"Skills",      path:"/skills",   color:C.green },
          { emoji:"📖", title:"Knowledge",   path:"/vault",    color:C.gold },
        ].map((item,i) => (
          <Card key={i} onClick={() => nav(item.path)} color={item.color} style={{ padding:"14px 13px", borderRadius:15, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:38, height:38, borderRadius:11, background:`${item.color}1a`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
              {item.emoji}
            </div>
            <span style={{ fontWeight:800, fontSize:13, color:C.text }}>{item.title}</span>
            <span style={{ marginLeft:"auto", color:item.color, fontSize:16 }}>›</span>
          </Card>
        ))}
      </div>

      {/* School Factions */}
      <div onClick={() => nav("/factions")} className="c-btn" style={{ background:"rgba(255,107,53,.08)", border:"1px solid rgba(255,107,53,.28)", borderRadius:14, padding:"13px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }}>
        <span style={{ fontSize:28 }}>🌍</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:13, color:C.text }}>School Factions</div>
          <div style={{ fontSize:11, color:C.muted }}>School wars · State rankings</div>
        </div>
        <span style={{ color:"#FF6B35", fontSize:16 }}>›</span>
      </div>

      {/* Recent Exams */}
      {history.length > 0 && (
        <>
          <div style={{ fontSize:10, fontWeight:800, color:C.muted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:8 }}>Recent Exams</div>
          <Card style={{ borderRadius:16, overflow:"hidden", marginBottom:14 }}>
            {history.slice(0,3).map((h,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:11, padding:"12px 14px", borderBottom:i<2?`1px solid ${C.border}`:"none" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:`${C.purple}1a`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>📝</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:12, color:C.text, marginBottom:1 }}>{h.subject||"Mixed"} · {h.exam_type}</div>
                  <div style={{ fontSize:10, color:C.muted }}>{new Date(h.completed_at).toLocaleDateString("en-NG",{day:"numeric",month:"short"})}</div>
                </div>
                <div style={{ fontWeight:900, fontSize:15, color:scoreColor(h.percentage||0) }}>{Math.round(h.percentage||0)}%</div>
              </div>
            ))}
            <button onClick={() => setActiveTab("progress")} style={{ width:"100%", background:"none", border:"none", color:C.purpleL, fontWeight:700, fontSize:12, padding:"10px", cursor:"pointer" }}>View all →</button>
          </Card>
        </>
      )}
    </div>
  );

  // ── STUDY TAB ────────────────────────────────────────────
  const StudyTab = () => (
    <div style={{ padding:"16px 14px 100px", animation:"slide-in .3s ease" }}>
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:20, fontWeight:900, color:C.text }}>Practice Centre</div>
        <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Practice modes · unlock all with Premium</div>
      </div>

      {[
        { label:"EXAM PREP", color:C.purple, items:[
          { emoji:"📘", title:"JAMB / UTME",    desc:"Full simulation · 180 questions",  path:"/exam-select?type=JAMB" },
          { emoji:"🏫", title:"Post-UTME",       desc:"UNILAG · UI · OAU & more",        path:"/exam-select?type=POST-UTME" },
          { emoji:"📖", title:"Subject Practice",desc:"Single subject · 40 questions",    path:"/exam-select?type=JAMB" },
          { emoji:"⚡",  title:"Daily Challenge", desc:"10 questions · refreshes daily",  path:"/challenge" },
        ]},
        { label:"SMART STUDY", color:C.green, items:[
          { emoji:"🔁", title:"Error Review",   desc:"Redo every question you got wrong", path:"/error-review" },
          { emoji:"💪", title:"Beat Yourself",  desc:"Break your personal best",          path:"/beat-yourself" },
          { emoji:"📂", title:"Resume Exam",    desc:"Continue an unfinished session",    path:"/resume" },
          { emoji:"🧠", title:"Weakness Mode",  desc:"Attack your weakest topics",        path:"/exam-select" },
        ]},
        { label:"LIVE & COMMUNITY", color:C.blue, items:[
          { emoji:"⚔️",  title:"Scholar Arena",   desc:"Live battles · all game modes",  path:"/arena" },
          { emoji:"🎓", title:"Scholar Sessions", desc:"Live classroom · voice · board", path:"/classroom" },
          { emoji:"📺", title:"Video Library",    desc:"Learn from top educators",       path:"/videos" },
          { emoji:"🎯", title:"Daily Missions",   desc:"Earn XP, coins & level up",     path:"/missions" },
        ]},
      ].map(section => (
        <div key={section.label} style={{ marginBottom:18 }}>
          <div style={{ fontSize:10, fontWeight:800, color:C.muted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:9 }}>{section.label}</div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {section.items.map((item,i) => (
              <div key={i} onClick={() => nav(item.path)} className="c-btn" style={{
                display:"flex", alignItems:"center", gap:13,
                background:"rgba(255,255,255,.04)", border:`1px solid ${C.border}`,
                borderRadius:14, padding:"13px 14px", cursor:"pointer",
              }}>
                <div style={{ width:42, height:42, borderRadius:12, background:`${section.color}16`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{item.emoji}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:800, fontSize:13, color:C.text }}>{item.title}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{item.desc}</div>
                </div>
                <span style={{ color:C.muted, fontSize:18, flexShrink:0 }}>›</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  // ── PROGRESS TAB ─────────────────────────────────────────
  const ProgressTab = () => (
    <div style={{ padding:"16px 14px 100px", animation:"slide-in .3s ease" }}>
      <div style={{ marginBottom:18 }}>
        <div style={{ fontSize:20, fontWeight:900, color:C.text }}>My Progress</div>
        <div style={{ fontSize:12, color:C.muted, marginTop:2 }}>Track every step forward</div>
      </div>

      {/* Stats hero */}
      <div style={{ background:`linear-gradient(135deg,${C.purple}cc,${C.blue}88)`, borderRadius:20, padding:"18px 16px", marginBottom:14, boxShadow:`0 8px 32px ${C.purple}44`, border:`1px solid ${C.purple}44` }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          {[
            { lbl:"Exams Taken", val:history.length, icon:"📝" },
            { lbl:"Avg Score",   val:`${avgScore}%`, icon:"📊" },
            { lbl:"Best Score",  val:`${bestScore}%`,icon:"🏆" },
            { lbl:"Day Streak",  val:`${streak} 🔥`,  icon:"🔥" },
          ].map((s,i) => (
            <div key={i} style={{ background:"rgba(255,255,255,.12)", borderRadius:12, padding:"12px 10px", textAlign:"center" }}>
              <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
              <div style={{ fontWeight:900, fontSize:18, color:"#fff" }}>{s.val}</div>
              <div style={{ fontSize:10, color:"rgba(255,255,255,.6)", marginTop:2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {[
          { emoji:"📊", title:"Performance Analytics", desc:"Detailed subject-by-subject breakdown",  path:"/performance",  color:C.purple },
          { emoji:"📋", title:"Full Exam History",     desc:"Every exam you've ever taken",           path:"/history",      color:C.blue },
          { emoji:"🎯", title:"Predicted JAMB Score",  desc:"Your likely score based on practice",    path:"/predicted",    color:C.green },
          { emoji:"🏛️", title:"Admission Checker",     desc:"See your chances at dream schools",       path:"/admission",    color:C.gold },
          { emoji:"🧠", title:"Exam Personality",      desc:"Discover your unique study style",        path:"/personality",  color:"#a29bfe" },
          { emoji:"🏆", title:"National Leaderboard",  desc:"See your rank among all scholars",        path:"/leaderboard",  color:C.red },
          { emoji:"🏅", title:"My Badges",             desc:"All the achievements you've earned",      path:"/badges",       color:C.gold },
          { emoji:"🎯", title:"Daily Missions",        desc:"Earn XP & coins every single day",       path:"/missions",     color:C.green },
        ].map((t,i) => (
          <div key={i} onClick={() => nav(t.path)} className="c-btn" style={{ display:"flex", alignItems:"center", gap:13, background:"rgba(255,255,255,.04)", border:`1px solid ${C.border}`, borderRadius:14, padding:"13px 14px", cursor:"pointer" }}>
            <div style={{ width:42, height:42, borderRadius:12, background:`${t.color}16`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{t.emoji}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:800, fontSize:13, color:C.text }}>{t.title}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{t.desc}</div>
            </div>
            <span style={{ color:C.muted, fontSize:18, flexShrink:0 }}>›</span>
          </div>
        ))}
      </div>

      {/* Score-based upgrade nudge for free users */}
      {!student?.is_premium && history.length > 0 && (
        <div
          onClick={() => nav("/upgrade")}
          style={{ marginTop:16, background:"linear-gradient(135deg,#1a0a2e,#2d1060)", border:`1px solid ${C.purple}44`, borderRadius:16, padding:"16px 14px", cursor:"pointer", boxShadow:`0 6px 28px ${C.purple}22` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
            <span style={{ fontSize:26 }}>📊</span>
            <div>
              <div style={{ fontWeight:900, fontSize:14, color:C.text }}>Your avg score is {avgScore}%</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>
                {avgScore < 50
                  ? "Premium's AI weakness mode targets your exact gaps — students who use it improve 30+ points."
                  : avgScore < 70
                  ? "You're close. Premium shows your exact weak topics so you can stop losing marks you shouldn't."
                  : "You're performing well. Premium's 2× XP and error review will help you maintain it."}
              </div>
            </div>
          </div>
          <div style={{ background:`linear-gradient(135deg,${C.purple},#a29bfe)`, borderRadius:10, padding:"10px 0", textAlign:"center", color:"#fff", fontWeight:800, fontSize:13 }}>
            👑 Unlock Premium — from ₦100
          </div>
        </div>
      )}
    </div>
  );

  // ── PROFILE TAB ──────────────────────────────────────────
  const ProfileTab = () => (
    <div style={{ padding:"16px 14px 100px", animation:"slide-in .3s ease" }}>
      {/* Hero */}
      <div style={{ background:`linear-gradient(135deg,${C.purple}cc,${C.blue}88)`, borderRadius:20, padding:"24px 18px", textAlign:"center", marginBottom:14, boxShadow:`0 8px 32px ${C.purple}44` }}>
        <div style={{ width:72, height:72, borderRadius:"50%", background:`${C.purple}55`, border:`3px solid ${C.purpleL}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:28, fontWeight:900, color:"#fff", overflow:"hidden", boxShadow:`0 0 18px ${C.purple}66` }}>
          {profile?.avatar_url?.startsWith("http")
            ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}} />
            : profile?.avatar_url && !profile.avatar_url.startsWith("http") ? profile.avatar_url : initials}
        </div>
        <div style={{ fontWeight:900, fontSize:18, color:"#fff", marginBottom:3 }}>{student?.full_name || profile?.full_name}</div>
        <div style={{ fontSize:12, color:"rgba(255,255,255,.6)", marginBottom:14 }}>{student?.email || profile?.email}</div>
        <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", marginBottom:16 }}>
          <div style={{ background:"rgba(255,200,87,.2)", border:`1px solid ${C.gold}44`, borderRadius:20, padding:"5px 13px", fontSize:12, fontWeight:700, color:C.gold }}>⚡ {xp} XP</div>
          <div style={{ background:"rgba(255,90,95,.15)", border:`1px solid ${C.red}44`, borderRadius:20, padding:"5px 13px", fontSize:12, fontWeight:700, color:C.red }}>🔥 {streak} streak</div>
          <div style={{ background:"rgba(0,208,132,.12)", border:`1px solid ${C.green}44`, borderRadius:20, padding:"5px 13px", fontSize:12, fontWeight:700, color:C.green }}>🪙 {coins}</div>
        </div>
        <Btn onClick={() => nav("/profile")} style={{ padding:"9px 26px", fontSize:13, borderRadius:10 }}>Edit Profile</Btn>
      </div>

      {/* Menu */}
      <Card style={{ borderRadius:18, overflow:"hidden", marginBottom:12 }}>
        {[
          { emoji:"👤", label:"Edit Profile",       sub:"Update your information",      path:"/profile" },
          { emoji:"🔒", label:"Account Security",   sub:"Password & login settings",    path:"/profile" },
          { emoji:"🎯", label:"Daily Missions",     sub:"Earn XP and coins daily",      path:"/missions" },
          { emoji:"🏅", label:"My Badges",          sub:"View all your achievements",   path:"/badges" },
          { emoji:"🏆", label:"Leaderboard",        sub:"Your national ranking",        path:"/leaderboard" },
          { emoji:"📊", label:"My Analytics",       sub:"In-depth performance insights",path:"/performance" },
          { emoji:"📺", label:"Video Library",      sub:"Watch and learn",              path:"/videos" },
          { emoji:"💬", label:"Get Help",           sub:"Contact support via WhatsApp", path:"/profile" },
        ].map((m,i,arr) => (
          <div key={i} onClick={() => nav(m.path)} style={{ display:"flex", alignItems:"center", gap:13, padding:"13px 14px", borderBottom:i<arr.length-1?`1px solid ${C.border}`:"none", cursor:"pointer" }}>
            <div style={{ width:38, height:38, background:`${C.purple}16`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:19, flexShrink:0 }}>{m.emoji}</div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{m.label}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{m.sub}</div>
            </div>
            <span style={{ color:C.muted, fontSize:18 }}>›</span>
          </div>
        ))}
      </Card>

      <Btn onClick={() => nav("/upgrade")} style={{ width:"100%", padding:"13px 0", fontSize:14, borderRadius:13, marginBottom:10 }}>
        👑 Upgrade to Pro
      </Btn>
      <div onClick={logout} style={{ border:`1.5px solid ${C.red}40`, borderRadius:13, padding:"13px 0", textAlign:"center", color:C.red, fontWeight:800, fontSize:14, cursor:"pointer" }}>
        🚪 Log Out
      </div>
    </div>
  );

  // ── BOTTOM NAV ───────────────────────────────────────────
  const NAV_TABS = [
    { id:"home",     label:"Home",    emoji:"🏠" },
    { id:"learn",    label:"Study",   emoji:"📚" },
    { id:"progress", label:"Progress",emoji:"📊" },
    { id:"profile",  label:"Profile", emoji:"👤" },
  ];

  return (
    <>
      {showOnboarding && (
        <OnboardingTour
          studentName={student?.full_name || profile?.full_name}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
      <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Plus Jakarta Sans',sans-serif", maxWidth:520, margin:"0 auto", position:"relative" }}>
        <XPFloat amount={xpFloat} visible={!!xpFloat} />
        <Sidebar />

        <div style={{ position:"relative", zIndex:1 }}>
          <Header />

          {activeTab === "home"     && <HomeTab />}
          {activeTab === "learn"    && <StudyTab />}
          {activeTab === "progress" && <ProgressTab />}
          {activeTab === "profile"  && <ProfileTab />}

          {/* Bottom Nav */}
          <nav style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:520, background:"rgba(8,13,26,.97)", backdropFilter:"blur(20px)", borderTop:`1px solid ${C.border}`, padding:"6px 0 10px", display:"flex", alignItems:"center", zIndex:50, boxShadow:"0 -4px 20px rgba(0,0,0,.35)" }}>
            {NAV_TABS.map(t => (
              <button key={t.id} className="nav-btn" onClick={() => setActiveTab(t.id)} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", padding:"5px 0", background:"none", border:"none", cursor:"pointer", color:activeTab===t.id ? C.purpleL : C.muted }}>
                <div style={{ width:34, height:34, borderRadius:10, background:activeTab===t.id?`${C.purple}22`:"transparent", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:1, transition:"all .2s" }}>
                  <span style={{ fontSize:19 }}>{t.emoji}</span>
                </div>
                <span style={{ fontSize:10, fontWeight:activeTab===t.id?800:500 }}>{t.label}</span>
                {activeTab===t.id && <div style={{ width:18, height:2, background:C.purple, borderRadius:2, marginTop:2, boxShadow:`0 0 7px ${C.purple}` }} />}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}
