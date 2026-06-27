import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "";
const h   = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")}` });

const RARITY_COLORS = { common:"#A0AEC0", rare:"#63B3ED", epic:"#9B59B6", legendary:"#FFC857", mythic:"#FF5A5F" };
const CHEST_BG      = { common:"rgba(160,174,192,0.1)", silver:"rgba(192,192,192,0.1)", gold:"rgba(255,200,87,0.12)", diamond:"rgba(99,179,237,0.12)", mythic:"rgba(155,89,182,0.15)" };
const CHEST_BORDER  = { common:"rgba(160,174,192,0.3)", silver:"rgba(192,192,192,0.3)", gold:"rgba(255,200,87,0.4)", diamond:"rgba(99,179,237,0.4)", mythic:"rgba(155,89,182,0.5)" };

export default function TreasureChests() {
  const nav     = useNavigate();
  const [chests,    setChests]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [opening,   setOpening]   = useState(null);   // chestId being opened
  const [result,    setResult]    = useState(null);    // { rewards, chest }
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [dailyResult,  setDailyResult]  = useState(null);
  const [msg,       setMsg]       = useState("");

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(""),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/chests/available`, { headers:h() });
      const d = await r.json();
      setChests(d.chests || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const claimDaily = async () => {
    try {
      const r = await fetch(`${API}/chests/claim-daily`, { method:"POST", headers:h() });
      const d = await r.json();
      if (!r.ok) { flash("❌ " + d.error); return; }
      setDailyResult(d);
      setDailyClaimed(true);
      // Show the reward modal — same modal used by openChest so the student
      // actually SEES what they won (Bug 2 fix: rewards were applied but never shown)
      setResult({
        chest:   { tier: d.tier, label: d.label, icon: d.icon, color: d.color },
        rewards: d.rewards || [],
        totals:  d.totals  || {},
      });
      load();
    } catch (e) { flash("❌ " + e.message); }
  };

  const openChest = async (chestId) => {
    setOpening(chestId); setResult(null);
    try {
      const r = await fetch(`${API}/chests/${chestId}/open`, { method:"POST", headers:h() });
      const d = await r.json();
      if (!r.ok) { flash("❌ " + d.error); setOpening(null); return; }
      setResult(d);
      setChests(prev => prev.filter(c => c.id !== chestId));
    } catch (e) { flash("❌ " + e.message); }
    setOpening(null);
  };

  const ICONS = { common:"📦", silver:"🥈", gold:"🥇", diamond:"💎", mythic:"🌌" };
  const REWARD_ICONS = { coins:"🪙", gems:"💎", xp:"⭐", spin:"🎰", boost:"⚡", event_token:"🎟️" };

  const st = {
    page: { minHeight:"100vh", background:"var(--bg)", color:"var(--text)", padding:"16px", paddingBottom:90 },
    head: { display:"flex", alignItems:"center", gap:12, marginBottom:20 },
    back: { background:"none", border:"none", color:"var(--text-muted)", fontSize:22, cursor:"pointer", padding:0 },
    card: (tier) => ({ background:CHEST_BG[tier]||"var(--surface)", border:`2px solid ${CHEST_BORDER[tier]||"var(--border)"}`, borderRadius:20, padding:"20px 16px", marginBottom:12, textAlign:"center" }),
    reward: (rarity) => ({ display:"inline-flex", flexDirection:"column", alignItems:"center", gap:4, padding:"12px 16px", background:`${RARITY_COLORS[rarity]||"#888"}22`, border:`1px solid ${RARITY_COLORS[rarity]||"#888"}55`, borderRadius:14, minWidth:90 }),
  };

  return (
    <div style={st.page}>
      <div style={st.head}>
        <button style={st.back} onClick={()=>nav(-1)}>←</button>
        <div>
          <div style={{ fontWeight:900, fontSize:20 }}>🗝️ Treasure Chests</div>
          <div style={{ color:"var(--text-muted)", fontSize:12 }}>Open daily chests for coins, gems, and more</div>
        </div>
      </div>

      {msg && <div style={{ padding:"10px 14px", background:"rgba(255,90,95,0.1)", border:"1px solid rgba(255,90,95,0.3)", borderRadius:10, color:"#FF5A5F", fontWeight:700, fontSize:13, marginBottom:12 }}>{msg}</div>}

      {/* Result Modal */}
      {result && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9000, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }}>
          <div style={{ background:"var(--surface)", borderRadius:24, padding:"32px 24px", maxWidth:360, width:"100%", textAlign:"center", border:"1px solid rgba(255,200,87,0.4)", boxShadow:"0 0 60px rgba(255,200,87,0.2)" }} className="anim-pop-in">
            <div style={{ fontSize:60, marginBottom:8 }} className="anim-float">{ICONS[result.chest?.tier]||"📦"}</div>
            <div style={{ fontWeight:900, fontSize:20, marginBottom:4 }}>{result.chest?.label}</div>
            <div style={{ color:"var(--text-muted)", fontSize:13, marginBottom:20 }}>You got:</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", marginBottom:24 }}>
              {(result.rewards||[]).map((r,i) => (
                <div key={i} style={st.reward(r.rarity)}>
                  <span style={{ fontSize:24 }}>{REWARD_ICONS[r.type]||"🎁"}</span>
                  <span style={{ fontWeight:800, fontSize:13, color:RARITY_COLORS[r.rarity]||"var(--text)" }}>{r.label}</span>
                  <span style={{ fontSize:10, color:"var(--text-muted)", textTransform:"uppercase", fontWeight:700 }}>{r.rarity}</span>
                </div>
              ))}
            </div>
            {result.totals && (
              <div style={{ display:"flex", gap:12, justifyContent:"center", marginBottom:20 }}>
                {result.totals.coins>0 && <div style={{ textAlign:"center" }}><div style={{ fontWeight:900, color:"#FFC857", fontSize:16 }}>+{result.totals.coins}</div><div style={{ color:"var(--text-muted)", fontSize:11 }}>Coins</div></div>}
                {result.totals.gems>0  && <div style={{ textAlign:"center" }}><div style={{ fontWeight:900, color:"#63B3ED", fontSize:16 }}>+{result.totals.gems}</div><div style={{ color:"var(--text-muted)", fontSize:11 }}>Gems</div></div>}
                {result.totals.xp>0   && <div style={{ textAlign:"center" }}><div style={{ fontWeight:900, color:"#00D084", fontSize:16 }}>+{result.totals.xp}</div><div style={{ color:"var(--text-muted)", fontSize:11 }}>XP</div></div>}
              </div>
            )}
            <button onClick={()=>setResult(null)} style={{ padding:"12px 32px", background:"var(--primary)", border:"none", borderRadius:12, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer" }}>
              🎉 Claim!
            </button>
          </div>
        </div>
      )}

      {/* Daily Chest Claim */}
      <div style={{ ...st.card("common"), background:"linear-gradient(135deg,rgba(124,92,255,0.12),rgba(255,200,87,0.08))", border:"2px solid rgba(124,92,255,0.4)", marginBottom:20 }}>
        <div style={{ fontSize:50, marginBottom:8 }} className={dailyClaimed?"":"anim-float"}>🎁</div>
        <div style={{ fontWeight:900, fontSize:18, marginBottom:4 }}>Daily Chest</div>
        <div style={{ color:"var(--text-muted)", fontSize:13, marginBottom:16, lineHeight:1.5 }}>
          Free every day. Higher streaks unlock better chests!
        </div>
        {dailyClaimed ? (
          dailyResult ? (
            <div style={{ color:"#00D084", fontWeight:700, fontSize:14 }}>
              ✅ Claimed! {dailyResult.tier !== "common" ? `🔥 Streak bonus: ${dailyResult.label}!` : ""}
            </div>
          ) : (
            <div style={{ color:"#00D084", fontWeight:700, fontSize:14 }}>✅ Already claimed today</div>
          )
        ) : (
          <button onClick={claimDaily} style={{ padding:"12px 32px", background:"linear-gradient(135deg,var(--primary),var(--accent,#3B82F6))", border:"none", borderRadius:12, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer" }}>
            🗝️ Open Daily Chest
          </button>
        )}
      </div>

      {/* Owned Chests */}
      {loading ? (
        <div style={{ textAlign:"center", padding:24 }}><div className="loader-ring" style={{ margin:"0 auto" }} /></div>
      ) : chests.length === 0 ? (
        <div style={{ textAlign:"center", padding:"24px 16px" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
          <div style={{ fontWeight:700, color:"var(--text-muted)" }}>No chests in your inventory</div>
          <div style={{ color:"var(--text-muted)", fontSize:13, marginTop:6 }}>Win arena battles, maintain streaks, and complete missions to earn more chests.</div>
        </div>
      ) : (
        <>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:12, color:"var(--text-muted)" }}>YOUR CHESTS ({chests.length})</div>
          {chests.map(chest => (
            <div key={chest.id} style={st.card(chest.tier)} className="card-hover">
              <div style={{ fontSize:44, marginBottom:6 }} className="anim-float-slow">{ICONS[chest.tier]||"📦"}</div>
              <div style={{ fontWeight:900, fontSize:16, marginBottom:2 }}>{chest.label}</div>
              <div style={{ color:`${CHEST_BORDER[chest.tier]||"#888"}`, fontWeight:700, fontSize:12, textTransform:"uppercase", marginBottom:6 }}>{chest.tier}</div>
              <div style={{ color:"var(--text-muted)", fontSize:12, marginBottom:16 }}>
                From: {chest.source} · {new Date(chest.earned_at).toLocaleDateString()}
              </div>
              <button
                onClick={()=>openChest(chest.id)}
                disabled={opening===chest.id}
                style={{ padding:"10px 28px", background:`linear-gradient(135deg,${CHEST_BORDER[chest.tier]||"var(--primary)"},rgba(124,92,255,0.8))`, border:"none", borderRadius:12, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer", opacity:opening===chest.id?0.7:1 }}>
                {opening===chest.id ? "Opening..." : "🗝️ Open Chest"}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
