import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const RARITY_COLORS = {
  common:    { bg:"rgba(107,114,128,.15)",  border:"rgba(107,114,128,.4)",   text:"#9CA3AF",  glow:"#6B7280" },
  rare:      { bg:"rgba(0,212,255,.08)",    border:"rgba(0,212,255,.4)",     text:"#00D4FF",  glow:"#00D4FF" },
  epic:      { bg:"rgba(124,92,255,.1)",    border:"rgba(124,92,255,.5)",    text:"var(--primary)",  glow:"var(--primary)" },
  legendary: { bg:"rgba(255,200,87,.08)",   border:"rgba(255,200,87,.5)",    text:"#FFC857",  glow:"#FFC857" },
  mythic:    { bg:"rgba(255,107,53,.08)",   border:"rgba(255,107,53,.5)",    text:"#FF6B35",  glow:"#FF6B35" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0B1020;font-family:'Plus Jakarta Sans',sans-serif}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
  @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
  @keyframes evolve{0%{transform:scale(1) rotate(0deg)}50%{transform:scale(1.3) rotate(180deg)}100%{transform:scale(1) rotate(360deg)}}
  @keyframes slide-up{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
  @keyframes shine{0%{left:-100%}100%{left:200%}}
  .spirit-card{border-radius:20px;transition:all .3s ease;cursor:pointer;position:relative;overflow:hidden}
  .spirit-card:hover{transform:translateY(-4px)}
  .cyber-btn{border:none;cursor:pointer;position:relative;overflow:hidden;transition:all .2s ease;border-radius:12px}
  .cyber-btn:hover{transform:translateY(-2px)}
  .cyber-btn:active{transform:scale(.96)}
`;

export default function Spirits() {
  const nav = useNavigate();
  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [modal,    setModal]    = useState(null); // 'detail' | 'unlock'
  const [busy,     setBusy]     = useState(false);
  const [toast,    setToast]    = useState(null);
  const [filter,   setFilter]   = useState("all");

  useEffect(() => {
    if (!document.getElementById("spirits-css")) {
      const s = document.createElement("style"); s.id = "spirits-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
    loadData();
  }, []);

  const loadData = async () => {
    try { const r = await API.get("/spirits"); setData(r.data); }
    catch { showToast("Failed to load spirits", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const handleUnlock = async (spirit, currency) => {
    setBusy(true);
    try {
      await API.post("/spirits/unlock", { spirit_id: spirit.id, currency });
      showToast(`${spirit.icon} ${spirit.name} unlocked!`);
      setModal(null); await loadData();
    } catch (err) { showToast(err.response?.data?.error || "Failed", "error"); }
    finally { setBusy(false); }
  };

  const handleEquip = async (spirit) => {
    setBusy(true);
    try {
      await API.post("/spirits/equip", { spirit_id: spirit.id });
      showToast(`${spirit.icon} ${spirit.name} equipped!`);
      await loadData(); setModal(null);
    } catch (err) { showToast(err.response?.data?.error || "Failed", "error"); }
    finally { setBusy(false); }
  };

  const handleFeed = async (spirit) => {
    setBusy(true);
    try {
      const r = await API.post("/spirits/feed", { spirit_id: spirit.id });
      showToast(r.data.message);
      await loadData();
    } catch (err) { showToast(err.response?.data?.error || "Failed", "error"); }
    finally { setBusy(false); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:64, animation:"float 2s ease-in-out infinite" }}>🐉</div>
        <p style={{ color:"var(--primary)", marginTop:16, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Summoning Spirits…</p>
      </div>
    </div>
  );

  const spirits = data?.spirits || [];
  const rarities = ["all","mythic","legendary","epic","rare","common"];
  const filtered = filter === "all" ? spirits : spirits.filter(s => s.rarity === filter);

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:9999, padding:"14px 24px", borderRadius:12,
          background: toast.type === "success" ? "rgba(0,208,132,.15)" : "rgba(255,90,95,.15)",
          border:`1px solid ${toast.type==="success"?"#00D084":"#FF5A5F"}`,
          color: toast.type === "success" ? "#00D084" : "#FF5A5F", fontWeight:700, backdropFilter:"blur(20px)" }}>
          {toast.msg}
        </div>
      )}

      {/* Detail Modal */}
      {modal && selected && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(10px)" }}
          onClick={() => setModal(null)}>
          <div style={{ background:"#151B2E", borderRadius:24, padding:28, maxWidth:380, width:"100%",
            border:`1px solid ${RARITY_COLORS[selected.rarity]?.border || "#333"}`,
            boxShadow:`0 0 60px ${RARITY_COLORS[selected.rarity]?.glow || "var(--primary)"}30`,
            animation:"slide-up .3s ease" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:72, animation:"float 2s ease-in-out infinite" }}>{selected.icon}</div>
              <div style={{ display:"inline-block", padding:"3px 12px", borderRadius:20, marginTop:8,
                background: RARITY_COLORS[selected.rarity]?.bg,
                border:`1px solid ${RARITY_COLORS[selected.rarity]?.border}`,
                color: RARITY_COLORS[selected.rarity]?.text, fontSize:11, fontWeight:800, letterSpacing:1 }}>
                {selected.rarity.toUpperCase()}
              </div>
              <h2 style={{ color:"#fff", fontWeight:900, fontSize:22, marginTop:10, marginBottom:4 }}>{selected.name}</h2>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:13 }}>{selected.description}</p>
            </div>

            {/* Passive */}
            <div style={{ background:"rgba(0,212,255,.06)", border:"1px solid rgba(0,212,255,.2)",
              borderRadius:12, padding:"12px 16px", marginBottom:10 }}>
              <p style={{ color:"#00D4FF", fontWeight:700, fontSize:11, letterSpacing:1, margin:0 }}>⚡ PASSIVE</p>
              <p style={{ color:"#fff", fontSize:14, marginTop:4, margin:0 }}>{selected.passive?.label}</p>
            </div>

            {/* Active */}
            <div style={{ background:"rgba(124,92,255,.06)", border:"1px solid rgba(124,92,255,.2)",
              borderRadius:12, padding:"12px 16px", marginBottom:10 }}>
              <p style={{ color:"var(--primary)", fontWeight:700, fontSize:11, letterSpacing:1, margin:0 }}>
                🔥 ACTIVE — {selected.active?.name}
              </p>
              <p style={{ color:"#fff", fontSize:14, marginTop:4, margin:0 }}>{selected.active?.desc}</p>
            </div>

            {/* Evolution stages */}
            <div style={{ marginBottom:20 }}>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:8 }}>
                EVOLUTION PATH
              </p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {selected.evolutions?.map((ev, i) => (
                  <div key={i} style={{ padding:"4px 10px", borderRadius:20, fontSize:11, fontWeight:600,
                    background: i <= (selected.evolution_stage || 0) ? "rgba(124,92,255,.3)" : "rgba(255,255,255,.05)",
                    color: i <= (selected.evolution_stage || 0) ? "var(--primary)" : "rgba(255,255,255,.3)",
                    border:`1px solid ${i <= (selected.evolution_stage || 0) ? "rgba(124,92,255,.5)" : "rgba(255,255,255,.08)"}` }}>
                    {ev}
                  </div>
                ))}
              </div>
              {selected.owned && (
                <div style={{ marginTop:8, background:"rgba(255,255,255,.04)", borderRadius:8, overflow:"hidden", height:6 }}>
                  <div style={{ height:"100%", background:"linear-gradient(90deg,#7C5CFF,#00D4FF)",
                    width:`${Math.min(((selected.spirit_xp||0)/((selected.evolutions?.length||1)*500))*100, 100)}%`,
                    transition:"width .5s ease" }} />
                </div>
              )}
            </div>

            {/* Action buttons */}
            {!selected.owned ? (
              <div style={{ display:"flex", gap:10 }}>
                {selected.cost?.coins > 0 && (
                  <button className="cyber-btn" onClick={() => handleUnlock(selected, "coins")} disabled={busy}
                    style={{ flex:1, padding:"12px 0", background:"linear-gradient(135deg,#FFC857,#FF9500)",
                      color:"#000", fontWeight:800, fontSize:14 }}>
                    {busy ? "…" : `🪙 ${selected.cost.coins?.toLocaleString()}`}
                  </button>
                )}
                {selected.cost?.gems > 0 && (
                  <button className="cyber-btn" onClick={() => handleUnlock(selected, "gems")} disabled={busy}
                    style={{ flex:1, padding:"12px 0", background:"linear-gradient(135deg,#7C5CFF,#00D4FF)",
                      color:"#fff", fontWeight:800, fontSize:14 }}>
                    {busy ? "…" : `🎫 ${selected.cost.gems}`}
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display:"flex", gap:10 }}>
                {!selected.equipped && (
                  <button className="cyber-btn" onClick={() => handleEquip(selected)} disabled={busy}
                    style={{ flex:1, padding:"12px 0", background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)",
                      color:"#fff", fontWeight:800, fontSize:14 }}>
                    {busy ? "…" : "⚡ EQUIP"}
                  </button>
                )}
                {selected.equipped && (
                  <div style={{ flex:1, padding:"12px 0", borderRadius:12, background:"rgba(0,208,132,.1)",
                    border:"1px solid #00D084", color:"#00D084", fontWeight:800, fontSize:14, textAlign:"center" }}>
                    ✅ EQUIPPED
                  </div>
                )}
                <button className="cyber-btn" onClick={() => handleFeed(selected)} disabled={busy}
                  style={{ padding:"12px 20px", background:"rgba(255,200,87,.1)", border:"1px solid #FFC857",
                    color:"#FFC857", fontWeight:800, fontSize:14 }}>
                  {busy ? "…" : "🍖 FEED (50🪙)"}
                </button>
              </div>
            )}

            <button onClick={() => setModal(null)} style={{ width:"100%", marginTop:12, padding:"10px 0",
              background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.5)",
              borderRadius:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Close
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth:800, margin:"0 auto", padding:"24px 20px 80px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={() => nav(-1)} style={{ background:"rgba(255,255,255,.06)", border:"none", color:"#fff",
            borderRadius:10, width:40, height:40, cursor:"pointer", fontSize:18 }}>←</button>
          <div>
            <h1 style={{ color:"#fff", fontWeight:900, fontSize:24, margin:0 }}>⚡ Scholar Spirits</h1>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, margin:0 }}>Collect, evolve & battle with your Spirits</p>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:12 }}>
            <div style={{ background:"rgba(255,200,87,.1)", border:"1px solid rgba(255,200,87,.3)",
              borderRadius:10, padding:"6px 14px", display:"flex", alignItems:"center", gap:6 }}>
              <span>🪙</span><span style={{ color:"#FFC857", fontWeight:800 }}>{(data?.coins||0).toLocaleString()}</span>
            </div>
            <div style={{ background:"rgba(0,212,255,.1)", border:"1px solid rgba(0,212,255,.3)",
              borderRadius:10, padding:"6px 14px", display:"flex", alignItems:"center", gap:6 }}>
              <span>🎫</span><span style={{ color:"#00D4FF", fontWeight:800 }}>{(data?.gems||0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Active spirit banner */}
        {data?.equipped && (() => {
          const eq = spirits.find(s => s.id === data.equipped);
          if (!eq) return null;
          return (
            <div style={{ background:`linear-gradient(135deg,${RARITY_COLORS[eq.rarity]?.bg||"rgba(124,92,255,.1)"})`,
              border:`1px solid ${RARITY_COLORS[eq.rarity]?.border||"rgba(124,92,255,.3)"}`,
              borderRadius:16, padding:"16px 20px", marginBottom:20, display:"flex", alignItems:"center", gap:16 }}>
              <div style={{ fontSize:40, animation:"float 2s ease-in-out infinite" }}>{eq.icon}</div>
              <div>
                <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, fontWeight:700, letterSpacing:1, margin:0 }}>ACTIVE SPIRIT</p>
                <p style={{ color:"#fff", fontWeight:900, fontSize:18, margin:0 }}>{eq.name}</p>
                <p style={{ color:RARITY_COLORS[eq.rarity]?.text, fontSize:13, margin:0 }}>⚡ {eq.passive?.label}</p>
              </div>
              <div style={{ marginLeft:"auto", padding:"4px 12px", borderRadius:20,
                background:RARITY_COLORS[eq.rarity]?.bg, color:RARITY_COLORS[eq.rarity]?.text,
                border:`1px solid ${RARITY_COLORS[eq.rarity]?.border}`, fontSize:11, fontWeight:800 }}>
                {eq.rarity.toUpperCase()}
              </div>
            </div>
          );
        })()}

        {/* Filter tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:20, overflowX:"auto", paddingBottom:4 }}>
          {rarities.map(r => (
            <button key={r} onClick={() => setFilter(r)}
              style={{ padding:"6px 16px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700,
                fontFamily:"'Plus Jakarta Sans',sans-serif", whiteSpace:"nowrap", fontSize:12,
                background: filter===r ? "var(--primary)" : "rgba(255,255,255,.06)",
                color: filter===r ? "#fff" : "rgba(255,255,255,.5)" }}>
              {r === "all" ? "All" : r.charAt(0).toUpperCase()+r.slice(1)}
              {r !== "all" && ` (${spirits.filter(s=>s.rarity===r).length})`}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {filtered.map((spirit, i) => {
            const rc = RARITY_COLORS[spirit.rarity] || RARITY_COLORS.common;
            return (
              <div key={spirit.id} className="spirit-card"
                style={{ background:rc.bg, border:`1px solid ${rc.border}`,
                  boxShadow: spirit.equipped ? `0 0 30px ${rc.glow}50` : "none",
                  animationDelay:`${i*.06}s` }}
                onClick={() => { setSelected(spirit); setModal("detail"); }}>

                {spirit.equipped && (
                  <div style={{ position:"absolute", top:10, right:10, background:"#00D084",
                    borderRadius:20, padding:"2px 8px", fontSize:10, fontWeight:800, color:"#000" }}>
                    ✓ ACTIVE
                  </div>
                )}

                <div style={{ padding:20, textAlign:"center" }}>
                  <div style={{ fontSize:48, marginBottom:8,
                    animation: spirit.owned ? "float 2s ease-in-out infinite" : "none",
                    filter: spirit.owned ? "none" : "grayscale(1) opacity(.4)",
                    animationDelay:`${i*.2}s` }}>
                    {spirit.icon}
                  </div>
                  <div style={{ display:"inline-block", padding:"2px 10px", borderRadius:20,
                    background:rc.bg, border:`1px solid ${rc.border}`,
                    color:rc.text, fontSize:10, fontWeight:800, letterSpacing:1, marginBottom:8 }}>
                    {spirit.rarity.toUpperCase()}
                  </div>
                  <p style={{ color:"#fff", fontWeight:800, fontSize:15, marginBottom:4 }}>{spirit.name}</p>
                  <p style={{ color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:12 }}>{spirit.passive?.label}</p>

                  {spirit.owned ? (
                    <div style={{ background:"rgba(0,208,132,.1)", border:"1px solid #00D084",
                      borderRadius:8, padding:"4px 0", color:"#00D084", fontWeight:700, fontSize:12 }}>
                      {spirit.evolutions?.[spirit.evolution_stage||0] || "Owned"}
                    </div>
                  ) : (
                    <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
                      {spirit.cost?.coins > 0 && (
                        <div style={{ fontSize:11, color:"#FFC857" }}>🪙 {spirit.cost.coins.toLocaleString()}</div>
                      )}
                      {spirit.cost?.gems > 0 && (
                        <div style={{ fontSize:11, color:"#00D4FF" }}>🎫 {spirit.cost.gems}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
