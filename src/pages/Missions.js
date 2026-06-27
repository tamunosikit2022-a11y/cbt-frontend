import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

// ── Level progress bar ────────────────────────────────────
function LevelCard({ level }) {
  if (!level) return null;
  return (
    <div style={s.levelCard}>
      <div style={s.levelTop}>
        <div style={s.levelBadge}>
          <span style={{ fontSize: 28 }}>{level.icon}</span>
          <div style={{ marginLeft: 12 }}>
            <div style={s.levelTitle}>{level.title}</div>
            <div style={s.levelNum}>Level {level.level}</div>
          </div>
        </div>
        <div style={s.xpBox}>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total XP</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: "#ffd700" }}>⚡ {level.xp?.toLocaleString()}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop: 14 }}>
        <div style={s.levelBarLabel}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {level.xpToNext > 0 ? `${level.xpToNext} XP to Level ${level.level + 1}` : "MAX LEVEL"}
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{level.pct}%</span>
        </div>
        <div style={s.levelBarBg}>
          <div style={{ ...s.levelBarFill, width: `${level.pct}%` }} />
        </div>
      </div>

      {level.nextTitle && (
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, textAlign: "right" }}>
          Next: {level.nextTitle} →
        </div>
      )}
    </div>
  );
}

// ── Single mission card ────────────────────────────────────
function MissionCard({ mission, onClaim, claiming }) {
  const pct = mission.target > 0
    ? Math.min((mission.progress / mission.target) * 100, 100)
    : 0;

  const statusColor = mission.completed
    ? (mission.claimed ? "#636e72" : "#00b894")
    : "#6c63ff";

  return (
    <div style={{ ...s.missionCard, ...(mission.claimed ? s.missionClaimed : mission.completed ? s.missionDone : {}) }}>
      <div style={s.missionTop}>
        <div style={{ ...s.missionIcon, background: statusColor + "22" }}>
          <span style={{ fontSize: 22 }}>{mission.icon}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.missionTitle}>{mission.title}</div>
          <div style={s.missionDesc}>{mission.description}</div>
        </div>
        <div style={s.missionReward}>
          <div style={{ fontSize: 11, color: "#ffd700", fontWeight: 700 }}>⚡ +{mission.xp_reward}</div>
          <div style={{ fontSize: 11, color: "#a29bfe", fontWeight: 700 }}>🪙 +{mission.coins_reward}</div>
        </div>
      </div>

      {/* Progress */}
      {mission.target > 1 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11, color: "#636e72" }}>{mission.progress} / {mission.target}</span>
            <span style={{ fontSize: 11, color: "#636e72" }}>{Math.round(pct)}%</span>
          </div>
          <div style={s.missionBarBg}>
            <div style={{ ...s.missionBarFill, width: `${pct}%`, background: statusColor }} />
          </div>
        </div>
      )}

      {/* Claim button */}
      {mission.completed && !mission.claimed && (
        <button
          style={s.claimBtn}
          onClick={() => onClaim(mission.code)}
          disabled={claiming === mission.code}>
          {claiming === mission.code ? "Claiming..." : "🎁 Claim Reward"}
        </button>
      )}
      {mission.claimed && (
        <div style={s.claimedBadge}>✓ Claimed</div>
      )}
      {!mission.completed && mission.target === 1 && (
        <div style={s.pendingBadge}>Pending</div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function Missions() {
  const nav = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("daily");
  const [claiming,setClaiming]= useState(null);
  const [toast,   setToast]   = useState(null);

  const load = useCallback(async () => {
    try {
      const r = await API.get("/missions/daily");
      if (r.data) setData(r.data);
    } catch (err) {
      console.error("Missions load error:", err?.response?.data || err.message);
      // Set empty data so page still renders
      setData({ daily: [], weekly: [], level: null, coins: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleClaim = async (code) => {
    setClaiming(code);
    try {
      const r = await API.post("/missions/claim", { mission_code: code });
      setToast({
        msg: `🎉 +${r.data.xp_earned} XP · +${r.data.coins_earned} coins!`,
        color: "#00b894"
      });
      setTimeout(() => setToast(null), 3000);
      load(); // refresh
    } catch (err) {
      setToast({ msg: err?.response?.data?.error || "Failed to claim", color: "#e17055" });
      setTimeout(() => setToast(null), 3000);
    } finally { setClaiming(null); }
  };

  const daily  = data?.daily  || [];
  const weekly = data?.weekly || [];
  const level  = data?.level;
  const coins  = data?.coins  || 0;

  const dailyDone  = daily.filter(m => m.completed).length;
  const weeklyDone = weekly.filter(m => m.completed).length;

  const missions = tab === "daily" ? daily : weekly;
  const categories = [...new Set(missions.map(m => m.category))];

  return (
    <div style={s.page}>

      {/* Toast */}
      {toast && (
        <div style={{ ...s.toast, background: toast.color }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => nav("/dashboard")}>←</button>
        <div style={{ flex: 1 }}>
          <div style={s.headerTitle}>🎯 Daily Missions</div>
          <div style={s.headerSub}>Complete missions · Earn XP · Level up</div>
        </div>
        <div style={s.coinsBox}>
          <span style={{ fontSize: 16 }}>🪙</span>
          <span style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{coins.toLocaleString()}</span>
        </div>
      </div>

      <div style={s.body}>

        {/* Level card */}
        {level && <LevelCard level={level} />}

        {/* Progress summary */}
        <div style={s.summaryRow}>
          <div style={s.summaryCard}>
            <div style={s.summaryNum}>{dailyDone}/{daily.length}</div>
            <div style={s.summaryLbl}>Daily Done</div>
          </div>
          <div style={s.summaryCard}>
            <div style={s.summaryNum}>{weeklyDone}/{weekly.length}</div>
            <div style={s.summaryLbl}>Weekly Done</div>
          </div>
          <div style={s.summaryCard}>
            <div style={s.summaryNum}>{daily.filter(m => m.completed && !m.claimed).length}</div>
            <div style={s.summaryLbl}>To Claim</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(tab === "daily"  ? s.tabActive : {}) }} onClick={() => setTab("daily")}>
            📅 Daily Missions
          </button>
          <button style={{ ...s.tab, ...(tab === "weekly" ? s.tabActive : {}) }} onClick={() => setTab("weekly")}>
            📆 Weekly Missions
          </button>
        </div>

        {/* Mission list grouped by category */}
        {loading ? (
          <div style={s.empty}>Loading missions...</div>
        ) : missions.length === 0 ? (
          <div style={s.empty}>No missions available</div>
        ) : (
          categories.map(cat => {
            const catMissions = missions.filter(m => m.category === cat);
            const catIcons = { study:"📚", arena:"⚔️", streak:"🔥", social:"👥" };
            const catLabel = { study:"Study", arena:"Arena", streak:"Streak", social:"Social" };
            return (
              <div key={cat}>
                <div style={s.catLabel}>
                  {catIcons[cat] || "🎯"} {catLabel[cat] || cat} Missions
                </div>
                {catMissions.map(m => (
                  <MissionCard
                    key={m.code}
                    mission={m}
                    onClaim={handleClaim}
                    claiming={claiming}
                  />
                ))}
              </div>
            );
          })
        )}

        {/* Quick actions */}
        <div style={s.catLabel}>🚀 Complete Missions Faster</div>
        <div style={s.actionGrid}>
          {[
            { icon:"📝", label:"Take Exam",     path:"/exam-select?type=JAMB" },
            { icon:"🎯", label:"Daily Challenge", path:"/challenge" },
            { icon:"⚔️", label:"Enter Arena",    path:"/arena" },
            { icon:"📺", label:"Watch Videos",   path:"/videos" },
          ].map((a, i) => (
            <div key={i} style={s.actionCard} onClick={() => nav(a.path)}>
              <span style={{ fontSize: 24 }}>{a.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 700, marginTop: 6, color: "#2d3436" }}>{a.label}</span>
            </div>
          ))}
        </div>

        <div style={{ height: 60 }} />
      </div>
    </div>
  );
}

const s = {
  page:         { minHeight:"100vh", background:"#f4f6fb", fontFamily:"'Segoe UI',sans-serif", maxWidth:480, margin:"0 auto" },
  toast:        { position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", color:"#fff", fontWeight:800, fontSize:14, padding:"12px 24px", borderRadius:12, zIndex:999, boxShadow:"0 4px 20px rgba(0,0,0,0.2)", whiteSpace:"nowrap" },

  header:       { background:"linear-gradient(135deg,#1a1a2e,#6c63ff)", padding:"16px 18px", display:"flex", alignItems:"center", gap:12, color:"#fff" },
  back:         { background:"var(--border)", border:"none", color:"#fff", borderRadius:10, width:36, height:36, fontSize:18, cursor:"pointer", flexShrink:0 },
  headerTitle:  { fontSize:18, fontWeight:900 },
  headerSub:    { fontSize:11, opacity:0.8, marginTop:1 },
  coinsBox:     { display:"flex", alignItems:"center", gap:6, background:"rgba(255,215,0,0.15)", border:"1px solid rgba(255,215,0,0.3)", borderRadius:12, padding:"6px 12px" },

  body:         { padding:"14px 16px" },

  // Level card
  levelCard:    { background:"linear-gradient(135deg,#1a1a2e,#2d2b55)", borderRadius:20, padding:"20px", marginBottom:14 },
  levelTop:     { display:"flex", justifyContent:"space-between", alignItems:"center" },
  levelBadge:   { display:"flex", alignItems:"center" },
  levelTitle:   { fontWeight:800, fontSize:16, color:"#fff" },
  levelNum:     { fontSize:12, color:"var(--text-muted)", marginTop:2 },
  xpBox:        { textAlign:"right" },
  levelBarLabel:{ display:"flex", justifyContent:"space-between", marginBottom:6 },
  levelBarBg:   { height:8, background:"var(--surface)", borderRadius:10, overflow:"hidden" },
  levelBarFill: { height:"100%", background:"linear-gradient(135deg,#ffd700,#ffaa00)", borderRadius:10, transition:"width 0.8s ease" },

  // Summary
  summaryRow:   { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:14 },
  summaryCard:  { background:"#fff", borderRadius:14, padding:"14px 10px", textAlign:"center", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" },
  summaryNum:   { fontWeight:900, fontSize:22, color:"#6c63ff" },
  summaryLbl:   { fontSize:11, color:"#636e72", marginTop:2 },

  // Tabs
  tabs:         { display:"flex", gap:8, marginBottom:14 },
  tab:          { flex:1, padding:"10px 0", background:"#fff", border:"2px solid #f0f0f0", borderRadius:12, fontWeight:700, fontSize:13, cursor:"pointer", color:"#636e72" },
  tabActive:    { background:"#6c63ff", borderColor:"#6c63ff", color:"#fff" },

  catLabel:     { fontSize:11, fontWeight:800, color:"#b2bec3", letterSpacing:1.2, textTransform:"uppercase", margin:"16px 0 8px" },

  // Mission card
  missionCard:  { background:"#fff", borderRadius:16, padding:"14px", marginBottom:10, boxShadow:"0 1px 6px rgba(0,0,0,0.05)", border:"2px solid transparent" },
  missionClaimed:{ opacity:0.6, border:"2px solid #f0f0f0" },
  missionDone:  { border:"2px solid #00b89422" },
  missionTop:   { display:"flex", alignItems:"flex-start", gap:12 },
  missionIcon:  { width:46, height:46, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  missionTitle: { fontWeight:800, fontSize:14, color:"#2d3436", marginBottom:3 },
  missionDesc:  { fontSize:12, color:"#636e72", lineHeight:1.4 },
  missionReward:{ textAlign:"right", flexShrink:0 },
  missionBarBg: { height:6, background:"#f0f0f0", borderRadius:10, overflow:"hidden" },
  missionBarFill:{ height:"100%", borderRadius:10, transition:"width 0.5s ease" },
  claimBtn:     { width:"100%", marginTop:10, padding:"10px 0", background:"linear-gradient(135deg,#00b894,#00a381)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer" },
  claimedBadge: { marginTop:8, fontSize:12, color:"#00b894", fontWeight:700, textAlign:"center" },
  pendingBadge: { marginTop:8, fontSize:11, color:"#b2bec3", textAlign:"right" },

  // Action grid
  actionGrid:   { display:"grid", gridTemplateColumns:"1fr 1fr 1fr 1fr", gap:10, marginBottom:16 },
  actionCard:   { background:"#fff", borderRadius:14, padding:"14px 8px", display:"flex", flexDirection:"column", alignItems:"center", cursor:"pointer", boxShadow:"0 1px 6px rgba(0,0,0,0.05)" },

  empty:        { textAlign:"center", padding:"32px 16px", color:"#b2bec3", fontSize:14 },
};
