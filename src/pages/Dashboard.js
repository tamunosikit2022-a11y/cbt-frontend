import { useState, useEffect, useRef, useCallback } from "react";
import OnboardingTour from "../components/OnboardingTour";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

// ── GLOBAL STYLES injected once ─────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #0B1020; font-family: 'Plus Jakarta Sans', sans-serif; }

  @keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 12px rgba(124,92,255,0.4); }
    50%       { box-shadow: 0 0 28px rgba(124,92,255,0.8), 0 0 60px rgba(124,92,255,0.3); }
  }
  @keyframes gold-pulse {
    0%, 100% { box-shadow: 0 0 12px rgba(255,200,87,0.4); }
    50%       { box-shadow: 0 0 28px rgba(255,200,87,0.8), 0 0 60px rgba(255,200,87,0.3); }
  }
  @keyframes float-up {
    0%   { opacity:1; transform: translateY(0) scale(1); }
    100% { opacity:0; transform: translateY(-60px) scale(1.3); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes slide-in {
    from { opacity:0; transform: translateY(20px); }
    to   { opacity:1; transform: translateY(0); }
  }
  @keyframes particle-float {
    0%,100% { transform: translateY(0) rotate(0deg); opacity:0.4; }
    50%      { transform: translateY(-20px) rotate(180deg); opacity:0.8; }
  }
  @keyframes border-glow {
    0%,100% { border-color: rgba(124,92,255,0.3); }
    50%      { border-color: rgba(124,92,255,0.8); }
  }
  @keyframes spin-badge {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes bar-fill {
    from { width: 0%; }
    to   { width: var(--target-width); }
  }
  @keyframes countdown-pulse {
    0%,100% { transform: scale(1); }
    50%      { transform: scale(1.05); }
  }
  @keyframes xp-float {
    0%   { opacity:0; transform: translateY(0) scale(0.8); }
    20%  { opacity:1; transform: translateY(-10px) scale(1.1); }
    80%  { opacity:1; transform: translateY(-40px) scale(1); }
    100% { opacity:0; transform: translateY(-60px) scale(0.9); }
  }

  .cyber-btn {
    position: relative;
    overflow: hidden;
    transition: transform 0.15s ease, box-shadow 0.2s ease;
    cursor: pointer;
  }
  .cyber-btn:active {
    transform: scale(0.96);
  }
  .cyber-btn::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
    pointer-events: none;
  }
  .glass-card {
    background: rgba(255,255,255,0.04);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 8px 32px rgba(124,92,255,0.15);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .glass-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(124,92,255,0.25);
  }
  .shimmer-btn::before {
    content: '';
    position: absolute;
    top: 0; left: -100%;
    width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: shimmer 2s infinite;
  }
  .nav-btn {
    transition: all 0.2s ease;
  }
  .nav-btn:active { transform: scale(0.9); }
  
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: #0B1020; }
  ::-webkit-scrollbar-thumb { background: #7C5CFF44; border-radius: 4px; }
`;

// ── Color tokens ─────────────────────────────────────────────
const C = {
  bg:        "#0B1020",
  bg2:       "#111827",
  bg3:       "#1a2035",
  purple:    "#7C5CFF",
  purpleGlow:"#9D7BFF",
  green:     "#00D084",
  gold:      "#FFC857",
  red:       "#FF5A5F",
  blue:      "#5B8CFF",
  text:      "#F1F5F9",
  textMuted: "rgba(255,255,255,0.5)",
  border:    "rgba(255,255,255,0.08)",
};

// ── Animated XP float ────────────────────────────────────────
function XPFloat({ amount, visible }) {
  if (!visible) return null;
  return (
    <div style={{
      position:"fixed", top:"20%", left:"50%", transform:"translateX(-50%)",
      fontSize:28, fontWeight:900, color:C.gold, zIndex:999, pointerEvents:"none",
      animation:"xp-float 1.5s ease forwards",
      textShadow:`0 0 20px ${C.gold}`,
    }}>
      ⚡ +{amount} XP
    </div>
  );
}

// ── Animated level bar ───────────────────────────────────────
function LevelBar({ level, pct, title, icon }) {
  return (
    <div style={{ padding:"0 4px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:18 }}>{icon || "⭐"}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:C.text }}>Level {level} · {title}</div>
          </div>
        </div>
        <div style={{ fontSize:11, color:C.gold, fontWeight:700 }}>{pct}%</div>
      </div>
      <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:10, overflow:"hidden" }}>
        <div style={{
          height:"100%", width:`${pct}%`,
          background:`linear-gradient(90deg,${C.purple},${C.gold})`,
          borderRadius:10, transition:"width 1s ease",
          boxShadow:`0 0 10px ${C.purple}88`,
        }} />
      </div>
    </div>
  );
}

// ── Glowing action button ────────────────────────────────────
function GlowBtn({ children, onClick, gradient, glow, style={} }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      className="cyber-btn shimmer-btn"
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onClick={onClick}
      style={{
        position:"relative", overflow:"hidden",
        background: gradient || `linear-gradient(135deg,${C.purple},${C.blue})`,
        border:"none", borderRadius:12, color:"#fff",
        fontFamily:"'Plus Jakarta Sans',sans-serif",
        fontWeight:800, cursor:"pointer",
        boxShadow: pressed
          ? `0 2px 8px ${glow || C.purple}66`
          : `0 4px 20px ${glow || C.purple}55, 0 0 0 1px ${glow||C.purple}33`,
        transform: pressed ? "scale(0.96)" : "scale(1)",
        transition:"all 0.15s ease",
        ...style,
      }}>
      {children}
    </button>
  );
}

// ── Glass card component ─────────────────────────────────────
function GlassCard({ children, style={}, onClick, glow=false, pulse=false }) {
  return (
    <div
      className={`glass-card${glow ? "" : ""}`}
      onClick={onClick}
      style={{
        background:"rgba(255,255,255,0.04)",
        backdropFilter:"blur(20px)",
        border:`1px solid ${C.border}`,
        borderRadius:20,
        animation: pulse ? "border-glow 2s infinite" : undefined,
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}>
      {children}
    </div>
  );
}

// ── Particle background ──────────────────────────────────────
function Particles() {
  const particles = [
    {x:"10%",y:"20%",size:3,dur:"4s",delay:"0s"},
    {x:"30%",y:"60%",size:2,dur:"6s",delay:"1s"},
    {x:"60%",y:"15%",size:4,dur:"5s",delay:"0.5s"},
    {x:"80%",y:"70%",size:2,dur:"7s",delay:"2s"},
    {x:"50%",y:"40%",size:3,dur:"4.5s",delay:"1.5s"},
    {x:"90%",y:"30%",size:2,dur:"6s",delay:"0.8s"},
    {x:"20%",y:"80%",size:3,dur:"5s",delay:"2.5s"},
  ];
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:0, overflow:"hidden" }}>
      {particles.map((p,i) => (
        <div key={i} style={{
          position:"absolute", left:p.x, top:p.y,
          width:p.size, height:p.size,
          background:`radial-gradient(circle,${C.purple},transparent)`,
          borderRadius:"50%",
          animation:`particle-float ${p.dur} ${p.delay} infinite ease-in-out`,
        }} />
      ))}
    </div>
  );
}

// ── Circular score ───────────────────────────────────────────
function CircleScore({ pct, size=110, color=C.purple }) {
  const r = (size-8)/2;
  const circ = 2*Math.PI*r;
  const off = circ - (Math.min(parseFloat(pct)||0,100)/100)*circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={8}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
        strokeWidth={8} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={off}
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ filter:`drop-shadow(0 0 8px ${color})`, transition:"stroke-dashoffset 1s ease" }}/>
      <text x="50%" y="44%" dominantBaseline="middle" textAnchor="middle"
        fill="#fff" fontSize={size*0.2} fontWeight="800">{Math.round(pct)||0}%</text>
      <text x="50%" y="64%" dominantBaseline="middle" textAnchor="middle"
        fill={C.textMuted} fontSize={size*0.1}>Overall</text>
    </svg>
  );
}

// ── Main component ───────────────────────────────────────────
export default function Dashboard() {
  const { student, logout } = useAuth();
  const nav = useNavigate();
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [challenge,     setChallenge]     = useState(null);
  const [profile,       setProfile]       = useState(null);
  const [levelData,     setLevelData]     = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [activeTab,     setActiveTab]     = useState("home");
  const [notifOpen,     setNotifOpen]     = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [xpFloat,       setXpFloat]       = useState(null);
  const [sideOpen,      setSideOpen]      = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(!localStorage.getItem("onboarding_done"));

  // Inject global CSS once
  useEffect(() => {
    if (!document.getElementById("cyber-css")) {
      const style = document.createElement("style");
      style.id = "cyber-css";
      style.textContent = GLOBAL_CSS;
      document.head.appendChild(style);
    }
    document.body.style.background = C.bg;
    return () => { document.body.style.background = ""; };
  }, []);

  useEffect(() => {
    // Load critical data first (profile), then secondary data
    API.get("/auth/profile")
      .then(p => { if (p?.data) setProfile(p.data); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Load secondary data in parallel - don't block initial render
    Promise.all([
      API.get("/exam/history").catch(() => ({ data:[] })),
      API.get("/innovations/challenge/today").catch(() => null),
      API.get("/auth/notifications").catch(() => ({ data:{ notifications:[], unread:0 } })),
      API.get("/missions/level").catch(() => null),
    ]).then(([h,c,n,lv]) => {
      if (h?.data)                         setHistory(h.data.slice(0,5));
      if (c?.data)                         setChallenge(c.data);
      if (n?.data) {
        const notifData = n.data;
        if (Array.isArray(notifData)) {
          setNotifications(notifData);
        } else {
          setNotifications(notifData.notifications || []);
          setUnreadCount(notifData.unread || 0);
        }
      }
      if (lv?.data)                        setLevelData(lv.data);
    }).catch(() => {});
  }, []);

  const streak   = profile?.current_streak || 0;
  const xp       = profile?.points || 0;
  const coins    = profile?.coins  || 0;
  const avgScore = history.length
    ? (history.reduce((a,h)=>a+parseFloat(h.percentage||0),0)/history.length).toFixed(0) : 0;
  const bestScore = history.length
    ? Math.max(...history.map(h=>parseFloat(h.percentage||0))).toFixed(0) : 0;
  const firstName = (student?.full_name||profile?.full_name||"Student").split(" ")[0];
  const initials  = (student?.full_name||profile?.full_name||"S").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();

  const scoreColor = p => parseFloat(p)>=70 ? C.green : parseFloat(p)>=50 ? C.gold : C.red;

  const showXP = (amt) => {
    setXpFloat(amt);
    setTimeout(() => setXpFloat(null), 2000);
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ width:60, height:60, borderRadius:16, background:`linear-gradient(135deg,${C.purple},${C.blue})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:30, animation:"glow-pulse 2s infinite" }}>🎓</div>
      <p style={{ color:C.textMuted, fontSize:14 }}>Loading your arena...</p>
    </div>
  );

  // ── Sidebar ─────────────────────────────────────────────
  const Sidebar = () => (
    <>
      {sideOpen && <div onClick={()=>setSideOpen(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:98,backdropFilter:"blur(4px)" }}/>}
      <aside style={{
        position:"fixed",top:0,left:0,bottom:0,width:240,
        background:"#080d1a",
        borderRight:`1px solid ${C.border}`,
        zIndex:99, display:"flex", flexDirection:"column", padding:"20px 0 16px",
        transform: sideOpen ? "translateX(0)" : "translateX(-100%)",
        transition:"transform 0.3s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: sideOpen ? `4px 0 40px rgba(124,92,255,0.3)` : "none",
      }}>
        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"0 18px 20px", borderBottom:`1px solid ${C.border}`, marginBottom:8 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:`linear-gradient(135deg,${C.purple},${C.blue})`, display:"flex",alignItems:"center",justifyContent:"center", fontSize:22, boxShadow:`0 4px 16px ${C.purple}66` }}>🎓</div>
          <div>
            <div style={{ fontWeight:900, fontSize:13, color:C.text, letterSpacing:1 }}>SCHOLARS</div>
            <div style={{ fontSize:9, color:C.textMuted, letterSpacing:2 }}>SYNDICATE</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"4px 8px" }}>
          {[
            { id:"home",     label:"Dashboard",  emoji:"🏠" },
            { id:"learn",    label:"Practice",   emoji:"📖" },
            { id:"progress", label:"Progress",   emoji:"📊" },
            { id:"missions", label:"Missions",   emoji:"🎯", badge:true },
            { id:"arena",    label:"Arena",      emoji:"⚔️" },
            { id:"videos",   label:"Videos",     emoji:"📺" },
            { id:"leaderboard",label:"Leaderboard",emoji:"🏆" },
            { id:"profile",  label:"Profile",    emoji:"👤" },
            { id:"gems",     label:"Gem Store",  emoji:"💎", external:"/gems" },
            { id:"spirits",  label:"Spirits",    emoji:"🐉", external:"/spirits" },
            { id:"vault",    label:"Knowledge Vault", emoji:"📚", external:"/vault" },
            { id:"factions", label:"Factions",   emoji:"🌍", external:"/factions" },
          ].map(item => (
            <div key={item.id}
              style={{
                display:"flex", alignItems:"center", gap:12,
                padding:"11px 16px", cursor:"pointer",
                borderRadius:12, marginBottom:2,
                background: activeTab===item.id ? `linear-gradient(135deg,${C.purple}33,${C.blue}22)` : "transparent",
                border: activeTab===item.id ? `1px solid ${C.purple}44` : "1px solid transparent",
                color: activeTab===item.id ? C.text : C.textMuted,
                fontWeight: activeTab===item.id ? 700 : 500,
                fontSize:13, transition:"all 0.2s ease",
                boxShadow: activeTab===item.id ? `0 0 20px ${C.purple}22` : "none",
              }}
              onClick={() => {
                setSideOpen(false);
                if (item.external)         { nav(item.external);    return; }
                if (item.id==="arena")       { nav("/arena");       return; }
                if (item.id==="videos")      { nav("/videos");      return; }
                if (item.id==="leaderboard") { nav("/leaderboard"); return; }
                if (item.id==="missions")    { nav("/missions");    return; }
                setActiveTab(item.id);
              }}>
              <span style={{ fontSize:18, width:22, textAlign:"center" }}>{item.emoji}</span>
              <span>{item.label}</span>
              {item.badge && <div style={{ marginLeft:"auto", width:8, height:8, borderRadius:"50%", background:C.green, boxShadow:`0 0 8px ${C.green}` }} />}
            </div>
          ))}
        </nav>

        {/* Upgrade CTA */}
        <div style={{ margin:"12px 12px 0", background:`linear-gradient(135deg,${C.purple}22,${C.gold}11)`, border:`1px solid ${C.gold}33`, borderRadius:16, padding:"16px 14px", textAlign:"center" }}>
          <div style={{ fontSize:24, marginBottom:6 }}>👑</div>
          <div style={{ fontWeight:800, fontSize:13, color:C.gold, marginBottom:4 }}>Upgrade to Pro</div>
          <div style={{ fontSize:11, color:C.textMuted, marginBottom:12, lineHeight:1.5 }}>Unlock unlimited features</div>
          <GlowBtn gradient={`linear-gradient(135deg,${C.gold},#FFB300)`} glow={C.gold}
            onClick={()=>nav("/upgrade")} style={{ width:"100%", padding:"10px 0", fontSize:12, borderRadius:10 }}>
            Upgrade Now 👑
          </GlowBtn>
        </div>
      </aside>
    </>
  );

  // ── Header ───────────────────────────────────────────────
  const Header = () => (
    <header style={{
      background:"rgba(8,13,26,0.9)", backdropFilter:"blur(20px)",
      borderBottom:`1px solid ${C.border}`,
      padding:"12px 16px", display:"flex", alignItems:"center", gap:10,
      position:"sticky", top:0, zIndex:50,
    }}>
      <button className="nav-btn" onClick={()=>setSideOpen(true)} style={{
        background:"rgba(255,255,255,0.06)", border:`1px solid ${C.border}`,
        borderRadius:10, width:38, height:38, fontSize:18, cursor:"pointer",
        color:C.text, display:"flex", alignItems:"center", justifyContent:"center",
      }}>☰</button>

      <div style={{ flex:1 }}>
        <div style={{ fontWeight:900, fontSize:15, color:C.text }}>Scholars Syndicate</div>
        <div style={{ fontSize:10, color:C.textMuted }}>Learn. Practice. Excel.</div>
      </div>

      {/* Coins */}
      <div style={{ display:"flex", alignItems:"center", gap:5, background:"rgba(255,200,87,0.1)", border:`1px solid ${C.gold}33`, borderRadius:10, padding:"5px 10px" }}>
        <span style={{ fontSize:14 }}>🪙</span>
        <span style={{ fontWeight:800, color:C.gold, fontSize:13 }}>{coins.toLocaleString()}</span>
      </div>

      {/* Notif */}
      <div style={{ position:"relative" }}>
        <button className="nav-btn" onClick={()=>{
          setNotifOpen(!notifOpen);
          if (!notifOpen && unreadCount > 0) {
            setUnreadCount(0);
            API.post("/auth/notifications/read").catch(()=>{});
          }
        }} style={{
          position:"relative", background:"rgba(255,255,255,0.06)",
          border:`1px solid ${C.border}`, borderRadius:10, width:38, height:38,
          fontSize:16, cursor:"pointer", color:C.text, display:"flex", alignItems:"center", justifyContent:"center",
        }}>
          🔔
          {unreadCount>0 && <span style={{ position:"absolute", top:-4, right:-4, background:C.red, color:"#fff", borderRadius:"50%", width:16, height:16, fontSize:9, fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center" }}>{unreadCount}</span>}
        </button>
        {notifOpen && (
          <div style={{ position:"absolute", top:46, right:0, background:C.bg2, border:`1px solid ${C.border}`, borderRadius:16, width:280, zIndex:200, boxShadow:`0 16px 48px rgba(0,0,0,0.5)` }}>
            <div style={{ fontWeight:800, fontSize:14, padding:"14px 16px 10px", color:C.text, borderBottom:`1px solid ${C.border}` }}>Notifications</div>
            {notifications.length===0
              ? <p style={{ color:C.textMuted, fontSize:13, textAlign:"center", padding:16 }}>No announcements yet</p>
              : notifications.map((n,i)=>(
                <div key={i} style={{ padding:"12px 16px", borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ fontWeight:700, fontSize:13, color:C.text }}>{n.title}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:3 }}>{n.message}</div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Avatar */}
      <div onClick={()=>setActiveTab("profile")} style={{
        width:38, height:38, borderRadius:"50%", cursor:"pointer",
        background:`linear-gradient(135deg,${C.purple},${C.blue})`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontWeight:800, fontSize:14, color:"#fff",
        border:`2px solid ${C.purple}66`,
        boxShadow:`0 0 12px ${C.purple}44`,
        overflow:"hidden",
      }}>
        {profile?.avatar_url && profile.avatar_url.startsWith("http")
          ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/>
          : profile?.avatar_url && !profile.avatar_url.startsWith("http")
            ? profile.avatar_url
            : initials}
      </div>
    </header>
  );

  return (
    <>
      {showOnboarding && (
        <OnboardingTour
          studentName={student?.full_name || profile?.full_name}
          onComplete={() => setShowOnboarding(false)}
        />
      )}
    <div style={{ minHeight:"100vh", background:C.bg, fontFamily:"'Plus Jakarta Sans',sans-serif", maxWidth:520, margin:"0 auto", position:"relative" }}>
      <Particles />
      <Sidebar />
      <XPFloat amount={xpFloat} visible={!!xpFloat} />

      <div style={{ position:"relative", zIndex:1 }}>
        <Header />

        {/* ════ HOME TAB ════ */}
        {activeTab==="home" && (
          <div style={{ padding:"16px 16px 100px", animation:"slide-in 0.3s ease" }}>

            {/* Hero gradient card */}
            <div style={{
              background:`linear-gradient(135deg,${C.purple}cc,${C.blue}99)`,
              borderRadius:24, padding:"22px 20px 20px",
              marginBottom:14, position:"relative", overflow:"hidden",
              boxShadow:`0 8px 40px ${C.purple}44`,
              border:`1px solid ${C.purple}44`,
            }}>
              {/* Decorative glow */}
              <div style={{ position:"absolute", top:-40, right:-40, width:120, height:120, borderRadius:"50%", background:`${C.blue}33`, filter:"blur(30px)" }}/>
              <div style={{ position:"absolute", bottom:-20, left:-20, width:80, height:80, borderRadius:"50%", background:`${C.purple}44`, filter:"blur(20px)" }}/>

              <div style={{ position:"relative", display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                <div>
                  <div style={{ fontSize:13, color:"rgba(255,255,255,0.7)", marginBottom:4 }}>Welcome back,</div>
                  <div style={{ fontSize:22, fontWeight:900, color:"#fff" }}>{firstName} 👋</div>
                </div>
                <div style={{ background:"rgba(255,200,87,0.2)", border:`1px solid ${C.gold}66`, borderRadius:12, padding:"6px 14px", display:"flex", alignItems:"center", gap:6, animation:"gold-pulse 3s infinite" }}>
                  <span style={{ fontSize:14 }}>⚡</span>
                  <span style={{ fontWeight:900, color:C.gold, fontSize:14 }}>{xp.toLocaleString()} XP</span>
                </div>
              </div>

              {/* Stats row */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
                {[
                  { icon:"🔥", val:streak, lbl:"Day Streak", color:C.red },
                  { icon:"📝", val:history.length, lbl:"Exams Taken", color:C.blue },
                  { icon:"📈", val:`${avgScore}%`, lbl:"Avg Score", color:C.green },
                ].map((s,i)=>(
                  <div key={i} style={{ background:"rgba(255,255,255,0.1)", borderRadius:14, padding:"12px 8px", textAlign:"center", backdropFilter:"blur(10px)", border:`1px solid rgba(255,255,255,0.1)` }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{s.icon}</div>
                    <div style={{ fontSize:20, fontWeight:900, color:"#fff" }}>{s.val}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>

              {/* Level bar */}
              {levelData && (
                <div style={{ marginTop:16, background:"rgba(0,0,0,0.2)", borderRadius:12, padding:"10px 14px" }}>
                  <LevelBar level={levelData.level} pct={levelData.pct} title={levelData.title} icon={levelData.icon} />
                </div>
              )}
            </div>

            {/* Action Buttons Row */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              <GlowBtn gradient={`linear-gradient(135deg,${C.purple},${C.blue})`} glow={C.purple}
                onClick={()=>nav("/missions")}
                style={{ padding:"14px 0", fontSize:13, borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:22 }}>🎯</span>
                <span>Daily Missions</span>
                <span style={{ fontSize:10, opacity:0.8 }}>Earn XP & Coins</span>
              </GlowBtn>
              <GlowBtn gradient={`linear-gradient(135deg,${C.gold},#FFB300)`} glow={C.gold}
                onClick={()=>nav("/challenge")}
                style={{ padding:"14px 0", fontSize:13, borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                <span style={{ fontSize:22 }}>{challenge?.already_done ? "✅" : "🎯"}</span>
                <span>Daily Challenge</span>
                <span style={{ fontSize:10, opacity:0.8 }}>{challenge?.already_done ? "Done!" : "Play now"}</span>
              </GlowBtn>
            </div>

            {/* Spin Wheel CTA */}
            <div style={{ background:"linear-gradient(135deg,#7C5CFF,#00D4FF)", borderRadius:14, padding:"14px 16px", marginBottom:14, display:"flex", alignItems:"center", gap:12, cursor:"pointer" }} onClick={()=>nav("/spin")}>
              <div style={{ width:46, height:46, background:"rgba(255,255,255,0.15)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0 }}>🎰</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:900, fontSize:15, color:"#fff" }}>Scholar Spin</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginTop:2 }}>Free daily spin — win coins, gems & boosts!</div>
              </div>
              <div style={{ background:"rgba(255,255,255,0.2)", borderRadius:8, padding:"6px 14px", fontWeight:800, fontSize:12, color:"#fff" }}>Spin →</div>
            </div>

            {/* Start Exam cards */}
            <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Start Exam</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
              <GlassCard onClick={()=>nav("/exam-select?type=JAMB")} style={{ padding:"20px 16px", borderRadius:18 }}>
                <div style={{ fontSize:36, marginBottom:10 }}>📘</div>
                <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:6 }}>JAMB / UTME</div>
                <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.5, marginBottom:14 }}>Full simulation · Single subject · Past questions</div>
                <div style={{ background:`${C.purple}22`, border:`1px solid ${C.purple}44`, borderRadius:8, padding:"7px 0", textAlign:"center", color:C.purpleGlow, fontWeight:800, fontSize:12 }}>Start Exam →</div>
              </GlassCard>
              <GlassCard onClick={()=>nav("/exam-select?type=POST-UTME")} style={{ padding:"20px 16px", borderRadius:18 }}>
                <div style={{ fontSize:36, marginBottom:10 }}>🏫</div>
                <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:6 }}>Post-UTME</div>
                <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.5, marginBottom:14 }}>UNILAG · UI · OAU · UNIPORT & more</div>
                <div style={{ background:`${C.green}22`, border:`1px solid ${C.green}44`, borderRadius:8, padding:"7px 0", textAlign:"center", color:C.green, fontWeight:800, fontSize:12 }}>Start Exam →</div>
              </GlassCard>
            </div>

            {/* Arena card - premium feel */}
            <div onClick={()=>nav("/arena")} className="cyber-btn glass-card" style={{
              background:`linear-gradient(135deg,#1a0a2e,#2d1060)`,
              borderRadius:20, padding:"20px 18px", marginBottom:14,
              display:"flex", alignItems:"center", gap:16, cursor:"pointer",
              border:`1px solid ${C.purple}33`,
              boxShadow:`0 8px 32px rgba(124,92,255,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
            }}>
              <div style={{ fontSize:48, filter:"drop-shadow(0 0 12px gold)" }}>🏆</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:900, fontSize:17, color:C.text, marginBottom:5 }}>Scholars Arena</div>
                <div style={{ fontSize:12, color:C.textMuted, lineHeight:1.5 }}>1v1 Battles · Duo · 50-player Clash{"\n"}Live competition</div>
              </div>
              <GlowBtn gradient={`linear-gradient(135deg,${C.purple},${C.blue})`} glow={C.purple}
                style={{ padding:"10px 16px", fontSize:12, borderRadius:10, flexShrink:0 }}>
                Enter →
              </GlowBtn>
            </div>

            {/* ── METAVERSE FEATURES ─────────────────────────── */}
            <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10, marginTop:4 }}>⚡ Scholar Metaverse</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:14 }}>
              {[
                { emoji:"💎", title:"Gem Store",       desc:"Buy gems & power up",     path:"/gems",     color:"#00D4FF" },
                { emoji:"🐉", title:"Scholar Spirits", desc:"Pets, evolve & battle",   path:"/spirits",  color:"#7C5CFF" },
                { emoji:"🧠", title:"Skills & Boosts", desc:"Tactical advantages",     path:"/skills",   color:"#00D084" },
                { emoji:"📚", title:"Knowledge Vault", desc:"Premium study materials", path:"/vault",    color:"#FFC857" },
              ].map((item,i)=>(
                <GlassCard key={i} onClick={()=>nav(item.path)}
                  style={{ padding:"16px 14px", borderRadius:16, border:`1px solid ${item.color}33`, background:`${item.color}08` }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:`${item.color}20`,
                    display:"flex", alignItems:"center", justifyContent:"center", fontSize:24,
                    marginBottom:8, boxShadow:`0 4px 12px ${item.color}30` }}>
                    {item.emoji}
                  </div>
                  <div style={{ fontWeight:800, fontSize:13, color:C.text, marginBottom:3 }}>{item.title}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{item.desc}</div>
                </GlassCard>
              ))}
            </div>

            {/* School Factions - full width */}
            <div onClick={()=>nav("/factions")} style={{
              background:"linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,200,87,0.06))",
              border:"1px solid rgba(255,107,53,0.35)", borderRadius:16,
              padding:"16px 18px", marginBottom:14, display:"flex", alignItems:"center", gap:14, cursor:"pointer",
            }}>
              <div style={{ fontSize:40 }}>🌍</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:900, fontSize:15, color:C.text, marginBottom:3 }}>School Factions</div>
                <div style={{ fontSize:12, color:C.textMuted }}>School wars, clan rivalry & state rankings</div>
              </div>
              <div style={{ background:"rgba(255,107,53,0.2)", border:"1px solid rgba(255,107,53,0.4)",
                borderRadius:8, padding:"6px 14px", color:"#FF6B35", fontWeight:800, fontSize:12 }}>
                Enter →
              </div>
            </div>

            {/* Recent Exams */}
            {history.length>0 && (
              <>
                <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Recent Exams</div>
                <GlassCard style={{ borderRadius:18, overflow:"hidden" }}>
                  {history.slice(0,3).map((h,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"14px 16px", borderBottom: i<2 ? `1px solid ${C.border}` : "none" }}>
                      <div style={{ width:42, height:42, borderRadius:12, background:`${C.purple}22`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>📝</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:700, fontSize:13, color:C.text, marginBottom:2 }}>{h.subject||"Mixed"} · {h.exam_type}</div>
                        <div style={{ fontSize:11, color:C.textMuted }}>{new Date(h.completed_at).toLocaleDateString("en-NG",{day:"numeric",month:"short"})}</div>
                      </div>
                      <div style={{ fontWeight:900, fontSize:16, color:scoreColor(h.percentage||0), textShadow:`0 0 10px ${scoreColor(h.percentage||0)}66` }}>
                        {Math.round(h.percentage||0)}%
                      </div>
                    </div>
                  ))}
                  <div style={{ padding:"10px 16px", textAlign:"center" }}>
                    <button onClick={()=>setActiveTab("progress")} style={{ background:"none", border:"none", color:C.purpleGlow, fontWeight:700, fontSize:13, cursor:"pointer" }}>View all →</button>
                  </div>
                </GlassCard>
              </>
            )}
          </div>
        )}

        {/* ════ LEARN TAB ════ */}
        {activeTab==="learn" && (
          <div style={{ padding:"16px 16px 100px", animation:"slide-in 0.3s ease" }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.text }}>Practice Centre</div>
              <div style={{ fontSize:13, color:C.textMuted, marginTop:2 }}>All practice modes — completely free</div>
            </div>

            {[
              { label:"EXAM PREPARATION", items:[
                { emoji:"📘", title:"JAMB Full Exam",   desc:"4 subjects · 180 questions · 2hrs",  path:"/exam-select?type=JAMB",    color:C.purple },
                { emoji:"🏫", title:"Post-UTME",        desc:"University-specific format",          path:"/exam-select?type=POST-UTME",color:C.green },
                { emoji:"📖", title:"Subject Practice", desc:"40 questions per subject",            path:"/exam-select?type=JAMB",    color:C.blue },
                { emoji:"🎯", title:"Daily Challenge",  desc:"10 questions · new every day",        path:"/challenge",                color:C.gold },
              ]},
              { label:"SMART LEARNING", items:[
                { emoji:"🔁", title:"Error Review",   desc:"Redo your wrong answers",       path:"/error-review", color:C.red },
                { emoji:"💪", title:"Beat Yourself",  desc:"Break your personal best",      path:"/beat-yourself",color:C.green },
                { emoji:"📂", title:"Resume Exam",    desc:"Continue unfinished exam",      path:"/resume",       color:C.blue },
                { emoji:"🧠", title:"Weakness Mode",  desc:"Target your weak areas",        path:"/exam-select",  color:C.purple },
              ]},
              { label:"ARENA & COMMUNITY", items:[
                { emoji:"⚔️", title:"Enter Arena",      desc:"Live battles · All modes",        path:"/arena",      color:C.purple, wide:true },
                { emoji:"📚", title:"Scholar Sessions", desc:"Live classroom · Whiteboard · Voice", path:"/classroom", color:C.blue },
                { emoji:"🎯", title:"Daily Missions",   desc:"Earn XP, coins & level up",       path:"/missions",   color:C.gold },
                { emoji:"📺", title:"Video Library",    desc:"Learn from top educators",         path:"/videos",     color:"#fd79a8" },
              ]},
            ].map(section => (
              <div key={section.label}>
                <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, letterSpacing:1.5, textTransform:"uppercase", margin:"16px 0 10px" }}>{section.label}</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {section.items.map((item,i)=>(
                    <GlassCard key={i} onClick={()=>nav(item.path)} style={{ padding:"16px 14px", borderRadius:16, border:`1px solid ${item.color}22` }}>
                      <div style={{ width:44, height:44, borderRadius:12, background:`${item.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:10, boxShadow:`0 4px 12px ${item.color}22` }}>{item.emoji}</div>
                      <div style={{ fontWeight:800, fontSize:13, color:C.text, marginBottom:4 }}>{item.title}</div>
                      <div style={{ fontSize:11, color:C.textMuted, lineHeight:1.4 }}>{item.desc}</div>
                    </GlassCard>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ PROGRESS TAB ════ */}
        {activeTab==="progress" && (
          <div style={{ padding:"16px 16px 100px", animation:"slide-in 0.3s ease" }}>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:22, fontWeight:900, color:C.text }}>My Progress</div>
              <div style={{ fontSize:13, color:C.textMuted, marginTop:2 }}>See how far you've come</div>
            </div>

            {/* Overall progress hero */}
            <div style={{ background:`linear-gradient(135deg,${C.purple}cc,${C.blue}99)`, borderRadius:24, padding:"20px", marginBottom:14, boxShadow:`0 8px 32px ${C.purple}44`, border:`1px solid ${C.purple}44` }}>
              <div style={{ fontWeight:800, fontSize:16, color:"#fff", marginBottom:4 }}>Overall Progress</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.7)", marginBottom:16 }}>Your hard work is paying off!</div>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <CircleScore pct={avgScore} color={C.gold} />
                <div style={{ flex:1, display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  {[
                    { lbl:"Exams Taken", val:history.length },
                    { lbl:"Average Score", val:`${avgScore}%` },
                    { lbl:"Best Score", val:`${bestScore}%` },
                    { lbl:"Day Streak", val:`🔥 ${streak}` },
                  ].map((s,i)=>(
                    <div key={i} style={{ background:"rgba(255,255,255,0.12)", borderRadius:12, padding:"10px 8px", textAlign:"center" }}>
                      <div style={{ fontWeight:900, fontSize:16, color:"#fff" }}>{s.val}</div>
                      <div style={{ fontSize:10, color:"rgba(255,255,255,0.6)", marginTop:2 }}>{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick links grid */}
            <div style={{ fontSize:11, fontWeight:800, color:C.textMuted, letterSpacing:1.5, textTransform:"uppercase", marginBottom:10 }}>Explore</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {[
                { emoji:"📊", title:"My Analytics 👑", desc:"Deep insights",           path:"/performance", color:C.purple },
                { emoji:"📋", title:"Exam History",    desc:"Every exam taken",         path:"/history",     color:C.blue },
                { emoji:"🎯", title:"Predicted Score", desc:"Your likely JAMB score",  path:"/predicted",   color:C.green },
                { emoji:"🏛️", title:"Admission Check", desc:"Dream school chances",    path:"/admission",   color:C.gold },
                { emoji:"🧠", title:"Exam Personality",desc:"Know your study style",   path:"/personality", color:"#a29bfe" },
                { emoji:"🏆", title:"Leaderboard",     desc:"National ranking",        path:"/leaderboard", color:C.red },
                { emoji:"🏅", title:"My Badges",       desc:"Achievements earned",     path:"/badges",      color:C.gold },
                { emoji:"🎯", title:"Daily Missions",  desc:"XP & coin challenges",   path:"/missions",    color:C.green },
              ].map((t,i)=>(
                <GlassCard key={i} onClick={()=>nav(t.path)} style={{ padding:"16px 14px", borderRadius:16, border:`1px solid ${t.color}22` }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:`${t.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:10 }}>{t.emoji}</div>
                  <div style={{ fontWeight:800, fontSize:13, color:C.text, marginBottom:4 }}>{t.title}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>{t.desc}</div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* ════ PROFILE TAB ════ */}
        {activeTab==="profile" && (
          <div style={{ padding:"16px 16px 100px", animation:"slide-in 0.3s ease" }}>
            {/* Profile hero */}
            <div style={{ background:`linear-gradient(135deg,${C.purple}cc,${C.blue}99)`, borderRadius:24, padding:"24px 20px", textAlign:"center", marginBottom:14, boxShadow:`0 8px 32px ${C.purple}44`, border:`1px solid ${C.purple}44` }}>
              <div style={{ width:80, height:80, borderRadius:"50%", background:`${C.purple}44`, border:`3px solid ${C.purpleGlow}`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 12px", fontSize:32, fontWeight:900, color:"#fff", overflow:"hidden", boxShadow:`0 0 20px ${C.purple}66` }}>
                {profile?.avatar_url && profile.avatar_url.startsWith("http")
                  ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} onError={e=>{e.target.style.display="none";}}/>
                  : profile?.avatar_url && !profile.avatar_url.startsWith("http")
                    ? profile.avatar_url
                    : initials}
              </div>
              <div style={{ fontWeight:900, fontSize:20, color:"#fff", marginBottom:4 }}>{student?.full_name||profile?.full_name}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginBottom:14 }}>{student?.email||profile?.email}</div>
              <div style={{ display:"flex", gap:8, justifyContent:"center", marginBottom:16 }}>
                <div style={{ background:"rgba(255,200,87,0.2)", border:`1px solid ${C.gold}44`, borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:700, color:C.gold }}>⚡ {xp} XP</div>
                <div style={{ background:"rgba(255,90,95,0.2)", border:`1px solid ${C.red}44`, borderRadius:20, padding:"5px 14px", fontSize:12, fontWeight:700, color:C.red }}>🔥 {streak} day streak</div>
              </div>
              <GlowBtn onClick={()=>nav("/profile")} style={{ padding:"10px 28px", fontSize:13, borderRadius:10 }}>
                Edit Profile
              </GlowBtn>
            </div>

            {/* Menu */}
            <GlassCard style={{ borderRadius:20, overflow:"hidden", marginBottom:14 }}>
              {[
                { emoji:"👤", label:"Edit Profile",          sub:"Update personal information", path:"/profile" },
                { emoji:"🔒", label:"Account Security",      sub:"Password & security",         path:"/profile" },
                { emoji:"👑", label:"Subscription",          sub:"Manage your plan",            path:"/upgrade" },
                { emoji:"🎯", label:"Daily Missions",        sub:"Earn XP & coins daily",       path:"/missions" },
                { emoji:"🏅", label:"My Badges",            sub:"View achievements",            path:"/badges" },
                { emoji:"🏆", label:"Leaderboard",          sub:"See your national rank",       path:"/leaderboard" },
                { emoji:"📊", label:"My Analytics",         sub:"Performance insights",         path:"/performance" },
                { emoji:"🔔", label:"Notification Settings",sub:"Manage alerts",                path:"/profile" },
                { emoji:"💬", label:"Support",              sub:"Get help & contact us",        path:"/profile" },
              ].map((m,i,arr)=>(
                <div key={i} onClick={()=>nav(m.path)}
                  style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderBottom: i<arr.length-1 ? `1px solid ${C.border}` : "none", cursor:"pointer" }}>
                  <div style={{ width:40, height:40, background:`${C.purple}18`, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{m.emoji}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:14, color:C.text }}>{m.label}</div>
                    <div style={{ fontSize:11, color:C.textMuted, marginTop:2 }}>{m.sub}</div>
                  </div>
                  <span style={{ color:C.textMuted, fontSize:18 }}>›</span>
                </div>
              ))}
            </GlassCard>

            {/* Upgrade */}
            <GlowBtn gradient={`linear-gradient(135deg,${C.purple},${C.blue})`} glow={C.purple}
              onClick={()=>nav("/upgrade")}
              style={{ width:"100%", padding:"14px 0", fontSize:14, borderRadius:14, marginBottom:10 }}>
              👑 Upgrade to Pro — Unlock Everything
            </GlowBtn>

            {/* Logout */}
            <div onClick={logout} style={{ background:"transparent", border:`1.5px solid ${C.red}44`, borderRadius:14, padding:"14px 0", textAlign:"center", color:C.red, fontWeight:800, fontSize:14, cursor:"pointer" }}>
              🚪 Log Out
            </div>
          </div>
        )}

        {/* ════ BOTTOM NAV — Floating Cyber Style ════ */}
        <nav style={{
          position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
          width:"100%", maxWidth:520,
          background:"rgba(8,13,26,0.98)", backdropFilter:"blur(20px)",
          borderTop:`1px solid ${C.border}`,
          padding:"8px 0 12px",
          display:"flex", alignItems:"center",
          boxShadow:`0 -4px 24px rgba(0,0,0,0.4)`,
          zIndex:50,
        }}>
          {[
            { id:"home",     label:"Home",     emoji:"🏠" },
            { id:"learn",    label:"Study",    emoji:"📚" },
            { id:"progress", label:"Progress", emoji:"📊" },
            { id:"profile",  label:"Profile",  emoji:"👤" },
          ].map(t=>(
            <button key={t.id} className="nav-btn"
              onClick={()=>setActiveTab(t.id)}
              style={{
                flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                padding:"6px 0", background:"none", border:"none", cursor:"pointer",
                color: activeTab===t.id ? C.purpleGlow : C.textMuted,
              }}>
              <div style={{
                width:36, height:36, borderRadius:10,
                background: activeTab===t.id ? `${C.purple}22` : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center",
                marginBottom:2,
                transition:"all 0.2s ease",
              }}>
                <span style={{ fontSize:20 }}>{t.emoji}</span>
              </div>
              <span style={{ fontSize:10, fontWeight: activeTab===t.id ? 800 : 500, letterSpacing:0.3 }}>{t.label}</span>
              {activeTab===t.id && <div style={{ width:20, height:2, background:C.purple, borderRadius:2, marginTop:3, boxShadow:`0 0 8px ${C.purple}` }} />}
            </button>
          ))}
        </nav>
      </div>
    </div>
    </>
  );
}
