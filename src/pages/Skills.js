import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const RARITY_STYLE = {
  common:   { bg:"rgba(0,208,132,.08)",  border:"rgba(0,208,132,.3)",   text:"#00D084" },
  rare:     { bg:"rgba(0,212,255,.08)",  border:"rgba(0,212,255,.3)",   text:"#00D4FF" },
  epic:     { bg:"rgba(124,92,255,.1)",  border:"rgba(124,92,255,.4)",  text:"#7C5CFF" },
  legendary:{ bg:"rgba(255,200,87,.08)", border:"rgba(255,200,87,.4)",  text:"#FFC857" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0B1020;font-family:'Plus Jakarta Sans',sans-serif}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .skill-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:16px;
    transition:all .25s ease;padding:16px;display:flex;align-items:center;gap:14;cursor:default}
  .skill-card:hover{border-color:rgba(124,92,255,.4);transform:translateY(-2px);box-shadow:0 8px 30px rgba(124,92,255,.15)}
  .buy-btn{border:none;cursor:pointer;border-radius:10px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;
    transition:all .2s ease;position:relative;overflow:hidden}
  .buy-btn:hover{transform:translateY(-1px)}
  .buy-btn:active{transform:scale(.96)}
  .buy-btn:disabled{opacity:.4;cursor:not-allowed}
`;

function SkillCard({ skill, coins, gems, onBuy, busy }) {
  const rs = RARITY_STYLE[skill.rarity] || RARITY_STYLE.common;
  const canAfford = skill.cost.gems
    ? gems >= skill.cost.gems
    : coins >= skill.cost.coins;

  return (
    <div className="skill-card">
      <div style={{ fontSize:36, flexShrink:0, animation:"float 3s ease-in-out infinite" }}>{skill.icon}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
          <span style={{ color:"#fff", fontWeight:800, fontSize:15 }}>{skill.name}</span>
          <span style={{ padding:"1px 8px", borderRadius:20, fontSize:10, fontWeight:800,
            background:rs.bg, border:`1px solid ${rs.border}`, color:rs.text }}>
            {skill.rarity.toUpperCase()}
          </span>
        </div>
        <p style={{ color:"rgba(255,255,255,.5)", fontSize:12, marginBottom:6 }}>{skill.effect}</p>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          {skill.owned > 0 && (
            <div style={{ background:"rgba(0,208,132,.1)", border:"1px solid #00D084", borderRadius:6,
              padding:"2px 8px", color:"#00D084", fontSize:11, fontWeight:700 }}>
              ×{skill.owned} owned
            </div>
          )}
          <span style={{ color:"rgba(255,255,255,.3)", fontSize:11 }}>1 use per charge</span>
        </div>
      </div>
      <div style={{ flexShrink:0, textAlign:"right" }}>
        <div style={{ color: skill.cost.gems ? "#00D4FF" : "#FFC857", fontWeight:800, fontSize:13, marginBottom:6 }}>
          {skill.cost.gems ? `💎 ${skill.cost.gems}` : `🪙 ${skill.cost.coins?.toLocaleString()}`}
        </div>
        <button className="buy-btn" onClick={() => onBuy(skill)} disabled={busy || !canAfford}
          style={{ padding:"8px 14px", fontSize:12,
            background: canAfford
              ? skill.cost.gems ? "linear-gradient(135deg,#7C5CFF,#00D4FF)" : "linear-gradient(135deg,#FFC857,#FF9500)"
              : "rgba(255,255,255,.06)",
            color: canAfford ? (skill.cost.gems ? "#fff" : "#000") : "rgba(255,255,255,.3)" }}>
          {busy ? "…" : canAfford ? "BUY" : "Need more"}
        </button>
      </div>
    </div>
  );
}

export default function Skills() {
  const nav = useNavigate();
  const [data,   setData]   = useState(null);
  const [loading,setLoading]= useState(true);
  const [busy,   setBusy]   = useState(null);
  const [tab,    setTab]    = useState("cbt");
  const [toast,  setToast]  = useState(null);

  useEffect(() => {
    if (!document.getElementById("skills-css")) {
      const s = document.createElement("style"); s.id = "skills-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
    loadData();
  }, []);

  const loadData = async () => {
    try { const r = await API.get("/skills"); setData(r.data); }
    catch { showToast("Failed to load skills", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type="success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const handleBuy = async (skill) => {
    setBusy(skill.id);
    try {
      const r = await API.post("/skills/buy", { skill_id: skill.id, qty: 1 });
      setData(d => ({ ...d, coins: r.data.coins, gems: r.data.gems }));
      showToast(r.data.message);
      await loadData();
    } catch (err) { showToast(err.response?.data?.error || "Purchase failed", "error"); }
    finally { setBusy(null); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0B1020" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:64, animation:"float 2s ease-in-out infinite" }}>⚡</div>
        <p style={{ color:"#7C5CFF", marginTop:16, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading Skills…</p>
      </div>
    </div>
  );

  const cbtSkills   = data?.cbt_skills   || [];
  const arenaBoosts = data?.arena_boosts || [];
  const items = tab === "cbt" ? cbtSkills : arenaBoosts;

  return (
    <div style={{ minHeight:"100vh", background:"#0B1020", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:9999, padding:"14px 24px", borderRadius:12,
          background: toast.type==="success" ? "rgba(0,208,132,.15)" : "rgba(255,90,95,.15)",
          border:`1px solid ${toast.type==="success"?"#00D084":"#FF5A5F"}`,
          color: toast.type==="success" ? "#00D084" : "#FF5A5F", fontWeight:700, backdropFilter:"blur(20px)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth:700, margin:"0 auto", padding:"24px 20px 80px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={() => nav(-1)} style={{ background:"rgba(255,255,255,.06)", border:"none", color:"#fff",
            borderRadius:10, width:40, height:40, cursor:"pointer", fontSize:18 }}>←</button>
          <div>
            <h1 style={{ color:"#fff", fontWeight:900, fontSize:24, margin:0 }}>🧠 Skills & Boosts</h1>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, margin:0 }}>Tactical advantages for exams & arena</p>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
            <div style={{ background:"rgba(255,200,87,.1)", border:"1px solid rgba(255,200,87,.3)",
              borderRadius:10, padding:"6px 14px", display:"flex", alignItems:"center", gap:6 }}>
              <span>🪙</span><span style={{ color:"#FFC857", fontWeight:800 }}>{(data?.coins||0).toLocaleString()}</span>
            </div>
            <div style={{ background:"rgba(0,212,255,.1)", border:"1px solid rgba(0,212,255,.3)",
              borderRadius:10, padding:"6px 14px", display:"flex", alignItems:"center", gap:6 }}>
              <span>💎</span><span style={{ color:"#00D4FF", fontWeight:800 }}>{data?.gems||0}</span>
            </div>
          </div>
        </div>

        {/* How to use */}
        <div style={{ background:"rgba(124,92,255,.06)", border:"1px solid rgba(124,92,255,.2)",
          borderRadius:14, padding:"12px 18px", marginBottom:24, display:"flex", gap:16, alignItems:"center" }}>
          <span style={{ fontSize:28 }}>💡</span>
          <p style={{ color:"rgba(255,255,255,.7)", fontSize:13, margin:0 }}>
            <strong style={{ color:"#7C5CFF" }}>CBT Skills</strong> activate during exams.
            <strong style={{ color:"#00D4FF" }}> Arena Boosts</strong> activate before or during Arena matches.
            Each charge is consumed on use.
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{ display:"flex", gap:8, marginBottom:20, background:"rgba(255,255,255,.04)",
          borderRadius:14, padding:6 }}>
          {[
            { key:"cbt",   label:"📚 CBT Skills",    count:cbtSkills.reduce((a,s)=>a+(s.owned||0),0) },
            { key:"arena", label:"⚔️ Arena Boosts",  count:arenaBoosts.reduce((a,s)=>a+(s.owned||0),0) },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer",
                fontWeight:800, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14,
                background: tab===t.key ? "#7C5CFF" : "transparent",
                color: tab===t.key ? "#fff" : "rgba(255,255,255,.5)" }}>
              {t.label} {t.count > 0 && <span style={{ opacity:.7, fontSize:12 }}>({t.count})</span>}
            </button>
          ))}
        </div>

        {/* Skill cards */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {items.map(skill => (
            <SkillCard key={skill.id} skill={skill}
              coins={data?.coins||0} gems={data?.gems||0}
              onBuy={handleBuy} busy={busy === skill.id} />
          ))}
        </div>

        {/* Tips */}
        <div style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.06)",
          borderRadius:14, padding:18, marginTop:24 }}>
          <h3 style={{ color:"rgba(255,255,255,.7)", fontSize:13, fontWeight:800, marginBottom:12 }}>
            ⚡ How Skills Work in Exam
          </h3>
          {[
            ["⏸️ Time Freeze", "Tap the freeze icon during exam — timer pauses 15s"],
            ["💡 Smart Hint", "Tap the hint bulb — AI gives a contextual clue"],
            ["✂️ 50/50", "Removes 2 wrong options from current question"],
            ["🛡️ Retry Shield", "If you get it wrong, one free retry is granted"],
          ].map(([title, desc]) => (
            <div key={title} style={{ display:"flex", gap:10, marginBottom:10 }}>
              <div style={{ minWidth:130, color:"#7C5CFF", fontWeight:700, fontSize:12 }}>{title}</div>
              <div style={{ color:"rgba(255,255,255,.5)", fontSize:12 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
