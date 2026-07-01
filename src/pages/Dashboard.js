/**
 * Dashboard.js — Scholars Syndicate v3
 * Complete rebuild matching the new mockup design exactly:
 *  • Desktop (≥768px): fixed 260px sidebar + scrollable main content
 *  • Mobile (<768px): bottom tab bar (same as before) + single-column cards
 *
 * Nav groups: Exam Prep · Study Tools · Compete · Rewards · Account
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

// ── Constants ─────────────────────────────────────────────
const SIDEBAR_W = 260;

const NAV_GROUPS = [
  {
    label: "Exam Prep",
    items: [
      { icon: "🏠",  label: "Dashboard",       action: "home" },
      { icon: "📝",  label: "Take Exam",        path: "/exam-select" },
      { icon: "🎓",  label: "University",       path: "/university", badge: "New" },
      { icon: "🕓",  label: "History",          path: "/history" },
      { icon: "📈",  label: "Performance",      path: "/performance" },
      { icon: "🎯",  label: "Weakness Heatmap", path: "/performance" },
    ],
  },
  {
    label: "Study Tools",
    items: [
      { icon: "🤖",  label: "AI Tutor",          path: "/ai-tutor" },
      { icon: "✨",  label: "AI Quiz Generator", path: "/ai-questions" },
      { icon: "🗂️", label: "Flashcards",        path: "/flashcards" },
      { icon: "📅",  label: "Study Planner",     path: "/study-planner" },
      { icon: "📚",  label: "Knowledge Vault",   path: "/vault" },
      { icon: "🎬",  label: "Video Library",     path: "/videos" },
    ],
  },
  {
    label: "Compete",
    items: [
      { icon: "⚔️",  label: "Arena",          path: "/arena" },
      { icon: "🏆",  label: "Tournaments",    path: "/tournaments" },
      { icon: "📊",  label: "Leaderboard",    path: "/leaderboard" },
      { icon: "🔥",  label: "Daily Challenge", path: "/challenge" },
      { icon: "⚡",  label: "Blitz Mode",     path: "/arena?mode=blitz" },
      { icon: "🏫",  label: "School Wars",    path: "/factions" },
    ],
  },
  {
    label: "Rewards",
    items: [
      { icon: "🎖️", label: "Badges",     path: "/badges" },
      { icon: "✅",  label: "Missions",   path: "/missions", dot: true },
      { icon: "💎",  label: "Gem Store",  path: "/gems" },
      { icon: "🎰",  label: "Spin Wheel", path: "/spin" },
      { icon: "🗝️", label: "Skills",     path: "/spirits" },
    ],
  },
  {
    label: "Account",
    items: [
      { icon: "👤",  label: "Profile",      action: "profile" },
      { icon: "🎨",  label: "Appearance",   path: "/settings/theme" },
      { icon: "🎁",  label: "Refer & Earn", path: "/referral" },
      { icon: "👪",  label: "Parent Portal", path: "/parent" },
      { icon: "❓",  label: "Help Center",  path: "/help" },
    ],
  },
];

const BAR_HEIGHTS = [35, 50, 42, 60, 55, 70, 65, 80, 76, 85];
const BAR_LABELS  = ["Wk1","Wk2","Wk3","Wk4","Wk5","Wk6","Wk7","Wk8","Wk9","Wk10"];

// ── Helpers ───────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 3600000)  return `${Math.floor(diff/60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff/3600000)}h ago`;
  return `${Math.floor(diff/86400000)}d ago`;
}

function greet(name) {
  const h = new Date().getHours();
  const part = h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  const first = (name || "Scholar").split(" ")[0];
  return `Good ${part}, ${first} 👋`;
}

// ── Component ─────────────────────────────────────────────
export default function Dashboard() {
  const nav     = useNavigate();
  const { student } = useAuth();
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  const [page,   setPage]   = useState("home");
  const [data,   setData]   = useState(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [sideOpen, setSideOpen] = useState(false); // mobile sidebar overlay

  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  useEffect(() => {
    Promise.all([
      API.get("/auth/profile"),
      API.get("/auth/notifications").catch(() => ({ data: { notifications: [], unread: 0 } })),
      API.get("/exam/performance").catch(() => ({ data: {} })),
      API.get("/exam/history?limit=5").catch(() => ({ data: { sessions: [] } })),
      API.get("/study-planner/my-plan").catch(() => ({ data: { plan: null } })),
    ]).then(([prof, notifR, perfR, histR, planR]) => {
      setData({
        profile:  prof.data,
        stats:    perfR.data?.stats || {},
        subjects: perfR.data?.subjects || [],
        sessions: histR.data?.sessions || [],
        plan:     planR.data?.plan,
      });
      setNotifs(notifR.data.notifications || []);
      setUnread(notifR.data.unread || 0);
    }).catch(() => {});
  }, []);

  // Unified navigation handler
  const go = (item) => {
    setSideOpen(false);
    if (item.action === "home")    { setPage("home");    return; }
    if (item.action === "profile") { setPage("profile"); return; }
    if (item.path) nav(item.path);
  };

  const profile  = data?.profile  || {};
  const stats    = data?.stats    || {};
  const sessions = data?.sessions || [];
  const plan     = data?.plan;

  const daysLeft = (() => {
    const d = profile.jamb_exam_date || localStorage.getItem("scholars_jamb_date");
    if (!d) return null;
    return Math.max(0, Math.ceil((new Date(d) - Date.now()) / 86400000));
  })();

  // ── Shared colours ──────────────────────────────────────
  const C = {
    bg:     "var(--bg,#0A0A0F)",
    surf:   "var(--surface,#13131A)",
    surfA:  "var(--surface-alt,#1C1C26)",
    border: "var(--border,rgba(255,255,255,0.08))",
    brdStr: "var(--border-strong,rgba(255,255,255,0.15))",
    text:   "var(--text,#FFFFFF)",
    sub:    "var(--text-sub,#D1D5DB)",
    muted:  "var(--text-muted,#6B7280)",
    p:      "var(--primary,#7C5CFF)",
    pL:     "var(--primary-light,#A98BFF)",
    pD:     "var(--primary-dark,#5A3FCC)",
    acc:    "var(--accent,#00D4AA)",
    gold:   "var(--gold,#F59E0B)",
    danger: "var(--danger,#EF4444)",
    ok:     "var(--success,#22C55E)",
  };

  // ── Sidebar ─────────────────────────────────────────────
  const Sidebar = ({ floating = false }) => (
    <aside style={{
      width: SIDEBAR_W, background: C.surf,
      borderRight: `1px solid ${C.border}`,
      padding: "20px 14px",
      display: "flex", flexDirection: "column", gap: 18,
      ...(floating ? {
        position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 200,
        boxShadow: "4px 0 40px rgba(0,0,0,0.6)",
      } : { minHeight: "100vh", position: "sticky", top: 0, height: "100vh" }),
      overflowY: "auto",
    }}>
      {/* Brand */}
      <div style={{ display:"flex", alignItems:"center", gap:10, paddingBottom:14, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ width:36, height:36, borderRadius:10, background:`linear-gradient(135deg,${C.p},${C.acc})`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
          🎓
        </div>
        <div>
          <div style={{ fontWeight:800, fontSize:15, lineHeight:1.2, color:C.text }}>Scholars<br/>Syndicate</div>
        </div>
        {floating && (
          <button onClick={() => setSideOpen(false)} style={{ marginLeft:"auto", background:"none", border:"none", color:C.muted, cursor:"pointer", fontSize:20, lineHeight:1 }}>✕</button>
        )}
      </div>

      {/* Nav groups */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:16, overflowY:"auto", paddingRight:2 }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div style={{ fontSize:10.5, fontWeight:800, letterSpacing:1, color:C.muted, textTransform:"uppercase", padding:"0 10px", marginBottom:6 }}>
              {group.label}
            </div>
            {group.items.map(item => {
              const isActive = item.action === page;
              return (
                <div key={item.label} onClick={() => go(item)} style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"9px 10px", borderRadius:10, fontSize:13.5, fontWeight:600,
                  color: isActive ? C.text : C.sub,
                  background: isActive ? `linear-gradient(135deg,rgba(124,92,255,.18),rgba(0,212,170,.10))` : "transparent",
                  boxShadow: isActive ? `inset 0 0 0 1px rgba(124,92,255,.35)` : "none",
                  cursor:"pointer", transition:"background .15s ease, color .15s ease",
                  minHeight: 40, // mobile touch target
                }}>
                  <span style={{ width:18, textAlign:"center", fontSize:14 }}>{item.icon}</span>
                  <span style={{ flex:1 }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background:C.p, color:"#fff", fontSize:9.5, fontWeight:800, padding:"2px 6px", borderRadius:6 }}>{item.badge}</span>
                  )}
                  {item.dot && (
                    <span style={{ width:7, height:7, borderRadius:"50%", background:C.ok, boxShadow:`0 0 6px ${C.ok}` }} />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Upgrade card */}
      <div style={{ borderTop:`1px solid ${C.border}`, paddingTop:14 }}>
        <div style={{ background:`linear-gradient(135deg,rgba(245,158,11,.15),rgba(124,92,255,.12))`, border:`1px solid rgba(245,158,11,.3)`, borderRadius:14, padding:12 }}>
          <div style={{ fontWeight:800, fontSize:12.5, display:"flex", alignItems:"center", gap:6, color:C.text }}>👑 Go Premium</div>
          <div style={{ fontSize:11, color:C.muted, margin:"4px 0 8px" }}>Unlock unlimited AI Tutor & exams</div>
          <div onClick={() => nav("/gems")} style={{
            display:"block", textAlign:"center",
            background:`linear-gradient(135deg,${C.p},${C.pD})`,
            color:"#fff", fontSize:12, fontWeight:800, padding:"8px", borderRadius:9, cursor:"pointer",
          }}>
            Upgrade now
          </div>
        </div>
      </div>
    </aside>
  );

  // ── Top Bar ──────────────────────────────────────────────
  const TopBar = () => (
    <div style={{
      display:"flex", alignItems:"center", gap:14, padding:"16px 28px",
      borderBottom:`1px solid ${C.border}`,
      position:"sticky", top:0, zIndex:10,
      background:"rgba(10,10,15,0.85)", backdropFilter:"blur(10px)",
    }}>
      {mobile && (
        <button onClick={() => setSideOpen(true)} style={{ background:`${C.surfA}`, border:`1px solid ${C.border}`, borderRadius:10, width:38, height:38, fontSize:17, cursor:"pointer", color:C.text, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>☰</button>
      )}
      {/* Search */}
      <div style={{ flex:1, maxWidth:420, display:"flex", alignItems:"center", gap:8, background:C.surfA, border:`1px solid ${C.border}`, borderRadius:11, padding:"9px 13px", color:C.muted, fontSize:13, cursor:"text" }}>
        🔍 Search subjects, past questions, topics…
      </div>

      <div style={{ display:"flex", alignItems:"center", gap:8, marginLeft:"auto" }}>
        {/* Notifications */}
        <div style={{ position:"relative" }}>
          <div onClick={() => setNotifOpen(v => !v)} style={{ position:"relative", width:38, height:38, borderRadius:10, background:C.surfA, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, cursor:"pointer" }}>
            🔔
            {unread > 0 && <span style={{ position:"absolute", top:6, right:6, width:8, height:8, borderRadius:"50%", background:C.danger, border:`2px solid ${C.surf}` }} />}
          </div>
          {notifOpen && (
            <div style={{ position:"absolute", top:46, right:0, width:300, background:C.surf, border:`1px solid ${C.brdStr}`, borderRadius:14, padding:14, boxShadow:"0 16px 48px rgba(0,0,0,0.5)", zIndex:50 }}>
              <div style={{ fontWeight:800, fontSize:13, marginBottom:10, color:C.text }}>Notifications</div>
              {notifs.slice(0,5).map((n,i) => (
                <div key={i} style={{ padding:"8px 0", borderBottom:`1px solid ${C.border}`, fontSize:12, color:C.sub }}>
                  <div style={{ fontWeight:600 }}>{n.title || n.message}</div>
                  <div style={{ color:C.muted, fontSize:11, marginTop:2 }}>{timeAgo(n.created_at)}</div>
                </div>
              ))}
              {!notifs.length && <div style={{ color:C.muted, fontSize:12 }}>No new notifications</div>}
            </div>
          )}
        </div>

        {/* Chat */}
        <div onClick={() => nav("/social")} style={{ width:38, height:38, borderRadius:10, background:C.surfA, border:`1px solid ${C.border}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, cursor:"pointer" }}>
          💬
        </div>

        {/* Profile */}
        <div onClick={() => setPage("profile")} style={{ display:"flex", alignItems:"center", gap:9, paddingLeft:12, borderLeft:`1px solid ${C.border}`, cursor:"pointer" }}>
          <div style={{ width:36, height:36, borderRadius:"50%", background:`linear-gradient(135deg,${C.p},${C.acc})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, color:"#fff", flexShrink:0, overflow:"hidden" }}>
            {profile.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : (profile.full_name || "S").slice(0,2).toUpperCase()}
          </div>
          {!mobile && (
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{(profile.full_name || "Scholar").split(" ").slice(0,2).join(" ")}</div>
              <div style={{ fontSize:10.5, color:C.muted }}>🔥 {profile.current_streak || 0}-day streak</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── Home content ─────────────────────────────────────────
  const HomeContent = () => (
    <div style={{ padding: mobile ? "16px 14px 80px" : "24px 28px 60px", display:"flex", flexDirection:"column", gap:20 }}>

      {/* Hero */}
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:`linear-gradient(120deg,rgba(124,92,255,.16),rgba(0,212,170,.07))`,
        border:`1px solid ${C.border}`, borderRadius:18, padding: mobile ? "20px 18px" : "24px 26px",
      }}>
        <div>
          <h1 style={{ fontSize: mobile ? 18 : 23, fontWeight:800, color:C.text }}>{greet(profile.full_name)}</h1>
          <p style={{ fontSize:13, color:C.sub, marginTop:5 }}>
            {stats.avg_score
              ? `You're ${parseFloat(stats.avg_score).toFixed(0)}% average this month — keep the streak alive.`
              : "Welcome back! Start a practice exam to track your progress."}
          </p>
          {daysLeft !== null && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:C.surfA, border:`1px solid ${C.border}`, padding:"6px 12px", borderRadius:20, fontSize:12, fontWeight:700, marginTop:12, color:C.text }}>
              📅 JAMB in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
            </div>
          )}
        </div>
        {!mobile && <div style={{ fontSize:54, opacity:.9 }}>🎓</div>}
      </div>

      {/* Track cards */}
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "repeat(3,1fr)", gap:14 }}>
        {[
          { icon:"📝", bg:"rgba(124,92,255,.15)", name:"JAMB", desc:"UTME subjects · full syllabus practice & mock exams", path:"/exam-select?type=JAMB", cta:"Start JAMB →" },
          { icon:"🏛️", bg:"rgba(245,158,11,.15)",  name:"Post-UTME", desc:"Screening format for 15 universities, incl. UNIPORT", path:"/exam-select?type=POST-UTME", cta:"Start Post-UTME →" },
          { icon:"🎓", bg:"rgba(0,212,170,.15)",   name:"University", desc:"Course past questions — UNIPORT GES112, GES103 & more", path:"/university", cta:"Start University →", featured:true, badge:"New" },
        ].map(t => (
          <div key={t.name} onClick={() => nav(t.path)} style={{
            position:"relative", background: t.featured ? `linear-gradient(160deg,rgba(0,212,170,.10),${C.surf} 60%)` : C.surf,
            border:`1px solid ${t.featured ? "rgba(0,212,170,.5)" : C.border}`,
            borderRadius:16, padding:18, cursor:"pointer",
            transition:"border-color .15s ease, transform .15s ease",
          }}>
            {t.badge && (
              <div style={{ position:"absolute", top:14, right:14, background:C.acc, color:"#04342C", fontSize:9.5, fontWeight:800, padding:"3px 8px", borderRadius:7 }}>
                {t.badge}
              </div>
            )}
            <div style={{ width:42, height:42, borderRadius:11, background:t.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:12 }}>
              {t.icon}
            </div>
            <div style={{ fontSize:15, fontWeight:800, color:C.text }}>{t.name}</div>
            <div style={{ fontSize:11.5, color:C.muted, marginTop:3, lineHeight:1.4 }}>{t.desc}</div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:5, fontSize:12, fontWeight:800, color:C.pL, marginTop:14 }}>{t.cta}</div>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap:14 }}>
        {[
          { icon:"📝", bg:"rgba(124,92,255,.15)", label:"Exams Taken",    val: stats.total_exams || 0,          delta:`↑ ${profile.exams_this_week || 0} this week`,  deltaC:C.ok },
          { icon:"📈", bg:"rgba(0,212,170,.15)",  label:"Average Score",  val: `${parseFloat(stats.avg_score||0).toFixed(0)}%`, delta:"↑ this month", deltaC:C.ok },
          { icon:"🔥", bg:"rgba(245,158,11,.15)", label:"Current Streak", val: `${profile.current_streak || 0} days`, delta:`Best: ${profile.longest_streak || 0} days`, deltaC:C.gold },
          { icon:"💎", bg:"rgba(124,92,255,.15)", label:"Token Balance",  val: (profile.token_balance||0).toLocaleString(), delta:"↑ earned today", deltaC:C.ok },
        ].map(s => (
          <div key={s.label} style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:16 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ width:34, height:34, borderRadius:9, background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>{s.icon}</div>
            </div>
            <div style={{ fontSize:12.5, color:C.muted, fontWeight:600, marginTop:12 }}>{s.label}</div>
            <div style={{ fontSize:24, fontWeight:800, marginTop:2, color:C.text }}>{s.val}</div>
            <div style={{ fontSize:11, fontWeight:700, marginTop:6, color:s.deltaC }}>{s.delta}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
        <div style={{ fontWeight:800, fontSize:14.5, marginBottom:14, color:C.text }}>Quick actions</div>
        <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr 1fr" : "repeat(4,1fr)", gap:12 }}>
          {[
            { icon:"📝", bg:"rgba(124,92,255,.15)", title:"Start exam",      desc:"JAMB, Post-UTME or Uni",  path:"/exam-select" },
            { icon:"🤖", bg:"rgba(0,212,170,.15)",  title:"Ask AI Tutor",   desc:"Stuck on a topic?",       path:"/ai-tutor" },
            { icon:"⚔️", bg:"rgba(245,158,11,.15)", title:"Join Arena",      desc:"Battle live opponents",   path:"/arena" },
            { icon:"🔥", bg:"rgba(239,68,68,.15)",  title:"Daily Challenge", desc:"Keep your streak",        path:"/challenge" },
          ].map(q => (
            <div key={q.title} onClick={() => nav(q.path)} style={{ background:C.surfA, border:`1px solid ${C.border}`, borderRadius:13, padding:14, cursor:"pointer", minHeight:80 }}>
              <div style={{ width:34, height:34, borderRadius:9, background:q.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, marginBottom:9 }}>{q.icon}</div>
              <div style={{ fontSize:13, fontWeight:700, color:C.text }}>{q.title}</div>
              <div style={{ fontSize:11, color:C.muted, marginTop:2 }}>{q.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance chart + Recent activity */}
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "1.4fr 1fr", gap:18 }}>
        {/* Chart */}
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontWeight:800, fontSize:14.5, color:C.text }}>Performance overview</div>
            <div style={{ fontSize:12, color:C.pL, fontWeight:700, cursor:"pointer" }} onClick={() => nav("/performance")}>This month ▾</div>
          </div>
          <div style={{ height:180, display:"flex", alignItems:"flex-end", gap:6, paddingTop:10 }}>
            {BAR_HEIGHTS.map((h, i) => (
              <div key={i} style={{ flex:1, height:`${h}%`, background:`linear-gradient(180deg,${C.p},rgba(124,92,255,.15))`, borderRadius:"6px 6px 0 0" }} />
            ))}
          </div>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8, fontSize:10, color:C.muted }}>
            {BAR_LABELS.map(l => <span key={l}>{l}</span>)}
          </div>
        </div>

        {/* Recent activity */}
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontWeight:800, fontSize:14.5, color:C.text }}>Recent activity</div>
            <div style={{ fontSize:12, color:C.pL, fontWeight:700, cursor:"pointer" }} onClick={() => nav("/history")}>View all</div>
          </div>
          {sessions.length > 0
            ? sessions.slice(0,4).map((s,i) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom: i < sessions.length-1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width:30, height:30, borderRadius:9, background:"rgba(124,92,255,.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>📝</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:C.text }}>{s.subject || s.exam_type} exam</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>Scored {parseFloat(s.percentage||0).toFixed(0)}%</div>
                </div>
                <div style={{ fontSize:10.5, color:C.muted, whiteSpace:"nowrap" }}>{timeAgo(s.created_at)}</div>
              </div>
            ))
            : [
              { icon:"🎖️", bg:"rgba(245,158,11,.15)", text:'Earned "Sharp Shooter" badge', sub:"Scored 90%+ in 5 exams",    time:"2h ago" },
              { icon:"📝", bg:"rgba(124,92,255,.15)", text:"Completed Chemistry exam",      sub:"Scored 82%",               time:"5h ago" },
              { icon:"⚔️", bg:"rgba(0,212,170,.15)",  text:"Won Arena match",              sub:"vs. Chidinma_01",           time:"1d ago" },
              { icon:"🔥", bg:"rgba(239,68,68,.15)",  text:"7-day streak reached",         sub:"+50 bonus gems",           time:"1d ago" },
            ].map((a,i,arr) => (
              <div key={i} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom: i < arr.length-1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width:30, height:30, borderRadius:9, background:a.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{a.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:600, color:C.text }}>{a.text}</div>
                  <div style={{ fontSize:11, color:C.muted, marginTop:1 }}>{a.sub}</div>
                </div>
                <div style={{ fontSize:10.5, color:C.muted, whiteSpace:"nowrap" }}>{a.time}</div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Upcoming tasks + JAMB countdown */}
      <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "1.4fr 1fr", gap:18 }}>
        {/* Tasks from study plan */}
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ fontWeight:800, fontSize:14.5, color:C.text }}>Upcoming tasks</div>
            <div style={{ fontSize:12, color:C.pL, fontWeight:700, cursor:"pointer" }} onClick={() => nav("/study-planner")}>View planner</div>
          </div>
          {(plan?.days?.slice(0,3) || [
            { tasks:[{ text:"Finish Mathematics — Calculus set" }], date:"Due in 2 days", _pill:"high" },
            { tasks:[{ text:"Review wrong answers — Physics" }],    date:"Due in 5 days", _pill:"med",  _done:true },
            { tasks:[{ text:"Take GES112.2 practice test" }],       date:"Due in 1 week", _pill:"low" },
          ]).map((day, i) => {
            const task = day.tasks?.[0];
            const pill = day._pill || (i === 0 ? "high" : i === 1 ? "med" : "low");
            const done = day._done || false;
            const pillStyles = {
              high: { bg:"rgba(239,68,68,.15)",   c:C.danger },
              med:  { bg:"rgba(245,158,11,.15)",  c:C.gold   },
              low:  { bg:"rgba(34,197,94,.15)",   c:C.ok     },
            }[pill];
            return (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ width:16, height:16, borderRadius:5, border: done ? "none" : `2px solid ${C.brdStr}`, background: done ? C.acc : "none", flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12.5, fontWeight:700, color:C.text, textDecoration: done ? "line-through" : "none" }}>{task?.text || "Practice session"}</div>
                  <div style={{ fontSize:11, color:C.muted }}>{day.date || day.day || `Day ${i+1}`}</div>
                </div>
                <div style={{ fontSize:10, fontWeight:800, padding:"3px 8px", borderRadius:7, background:pillStyles.bg, color:pillStyles.c }}>
                  {pill === "high" ? "High" : pill === "med" ? "Medium" : "Low"}
                </div>
              </div>
            );
          })}
        </div>

        {/* JAMB countdown */}
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px" }}>
          <div style={{ fontWeight:800, fontSize:14.5, color:C.text, marginBottom:14 }}>JAMB countdown</div>
          <div style={{ textAlign:"center", background:C.surfA, border:`1px solid ${C.border}`, borderRadius:13, padding:16, marginBottom:14 }}>
            <div style={{ fontSize:30, fontWeight:900, color:C.gold }}>{daysLeft ?? "--"}</div>
            <div style={{ fontSize:11, color:C.muted, fontWeight:700, marginTop:2 }}>days remaining</div>
          </div>
          {daysLeft === null && (
            <div onClick={() => nav("/study-planner")} style={{ fontSize:12, color:C.pL, fontWeight:700, textAlign:"center", cursor:"pointer", marginBottom:10 }}>
              📅 Set your exam date →
            </div>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0" }}>
            <div style={{ width:16, height:16, borderRadius:5, background:C.acc, flexShrink:0 }} />
            <div>
              <div style={{ fontSize:12.5, fontWeight:700, color:C.text }}>Mock exam · Sat 9:00 AM</div>
              <div style={{ fontSize:11, color:C.muted }}>Full JAMB simulation</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent exams table */}
      <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:"18px 20px", overflowX:"auto" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
          <div style={{ fontWeight:800, fontSize:14.5, color:C.text }}>Recent exams</div>
          <div style={{ fontSize:12, color:C.pL, fontWeight:700, cursor:"pointer" }} onClick={() => nav("/history")}>View history</div>
        </div>
        <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12.5 }}>
          <thead>
            <tr>
              {["Subject","Type","Score","Date","Result"].map(h => (
                <th key={h} style={{ textAlign:"left", color:C.muted, fontWeight:700, fontSize:11, textTransform:"uppercase", letterSpacing:.5, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.length > 0
              ? sessions.slice(0,5).map((s,i) => {
                  const pct = parseFloat(s.percentage||0).toFixed(0);
                  const pass = parseInt(pct) >= 50;
                  return (
                    <tr key={i}>
                      <td style={{ padding:"12px 0", borderBottom:`1px solid ${C.border}`, color:C.text }}>{s.subject || "General"}</td>
                      <td style={{ padding:"12px 0 12px 12px", borderBottom:`1px solid ${C.border}`, color:C.muted, fontSize:10.5, fontWeight:700 }}>{s.exam_type || "JAMB"}</td>
                      <td style={{ padding:"12px 0 12px 12px", borderBottom:`1px solid ${C.border}`, color:C.text }}>{pct}%</td>
                      <td style={{ padding:"12px 0 12px 12px", borderBottom:`1px solid ${C.border}`, color:C.sub, fontSize:11 }}>
                        {new Date(s.created_at).toLocaleDateString("en-NG", { day:"numeric", month:"short", year:"numeric" })}
                      </td>
                      <td style={{ padding:"12px 0 12px 12px", borderBottom:`1px solid ${C.border}` }}>
                        <span style={{ fontSize:10.5, fontWeight:800, padding:"4px 9px", borderRadius:7, background: pass ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)", color: pass ? C.ok : C.danger }}>
                          {pass ? "Passed" : "Below 50%"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              : [
                  { sub:"Chemistry",           type:"JAMB",       pct:"82", date:"Jul 1, 2026",  pass:true },
                  { sub:"GES112 — Nig. Culture", type:"University", pct:"74", date:"Jun 30, 2026", pass:true },
                  { sub:"Physics",             type:"JAMB",       pct:"58", date:"Jun 27, 2026", pass:false },
                  { sub:"UNIPORT Post-UTME",   type:"Post-UTME",  pct:"71", date:"Jun 25, 2026", pass:true },
                ].map((r,i,arr) => (
                  <tr key={i}>
                    <td style={{ padding:"12px 0", borderBottom: i<arr.length-1?`1px solid ${C.border}`:"none", color:C.text }}>{r.sub}</td>
                    <td style={{ padding:"12px 0 12px 12px", borderBottom: i<arr.length-1?`1px solid ${C.border}`:"none", color:C.muted, fontSize:10.5, fontWeight:700 }}>{r.type}</td>
                    <td style={{ padding:"12px 0 12px 12px", borderBottom: i<arr.length-1?`1px solid ${C.border}`:"none", color:C.text }}>{r.pct}%</td>
                    <td style={{ padding:"12px 0 12px 12px", borderBottom: i<arr.length-1?`1px solid ${C.border}`:"none", color:C.sub, fontSize:11 }}>{r.date}</td>
                    <td style={{ padding:"12px 0 12px 12px", borderBottom: i<arr.length-1?`1px solid ${C.border}`:"none" }}>
                      <span style={{ fontSize:10.5, fontWeight:800, padding:"4px 9px", borderRadius:7, background: r.pass ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)", color: r.pass ? C.ok : C.danger }}>
                        {r.pass ? "Passed" : "Below 60%"}
                      </span>
                    </td>
                  </tr>
                ))
            }
          </tbody>
        </table>
      </div>

    </div>
  );

  // ── Mobile bottom nav ────────────────────────────────────
  const BOT_TABS = [
    { id:"home",    emoji:"🏠", label:"Home"      },
    { id:"exam",    emoji:"📝", label:"Exam",     path:"/exam-select" },
    { id:"uni",     emoji:"🎓", label:"Uni",      path:"/university"  },
    { id:"arena",   emoji:"⚔️", label:"Arena",   path:"/arena"       },
    { id:"profile", emoji:"👤", label:"Profile"  },
  ];

  // ── Render ───────────────────────────────────────────────
  return (
    <div style={{ display:"flex", background:C.bg, minHeight:"100dvh", fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", position:"relative" }}>

      {/* Desktop sidebar — always visible */}
      {!mobile && <Sidebar />}

      {/* Mobile sidebar overlay */}
      {mobile && sideOpen && (
        <>
          <div onClick={() => setSideOpen(false)} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:190 }} />
          <Sidebar floating />
        </>
      )}

      {/* Main */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, minHeight:"100dvh", overflow:"auto" }}>
        <TopBar />

        <div style={{ flex:1, overflowY:"auto" }}>
          {page === "home" && <HomeContent />}
          {/* Other pages navigate to their own routes */}
        </div>

        {/* Mobile bottom nav */}
        {mobile && (
          <nav style={{
            position:"fixed", bottom:0, left:0, right:0, zIndex:50,
            background:"rgba(10,10,15,0.96)", backdropFilter:"blur(20px)",
            borderTop:`1px solid ${C.border}`,
            display:"flex", alignItems:"center",
            paddingBottom:"env(safe-area-inset-bottom,0px)",
          }}>
            {BOT_TABS.map(t => {
              const active = page === t.id;
              return (
                <button key={t.id} onClick={() => { if (t.path) nav(t.path); else setPage(t.id); }} style={{
                  flex:1, minHeight:52, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
                  background:"none", border:"none", cursor:"pointer", color: active ? "var(--primary,#7C5CFF)" : C.muted,
                  padding:"6px 0", WebkitTapHighlightColor:"transparent",
                }}>
                  <div style={{ width:44, height:32, borderRadius:11, background: active ? "rgba(124,92,255,.18)" : "transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:19, marginBottom:1 }}>
                    {t.emoji}
                  </div>
                  <span style={{ fontSize:10, fontWeight: active ? 800 : 500 }}>{t.label}</span>
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </div>
  );
}
