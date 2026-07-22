import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "";
const h   = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")}` });

export function SchoolWarsPanel() {
  const nav = useNavigate();
  const [tab,          setTab]      = useState("leaderboard");
  const [leaderboard,  setLb]       = useState([]);
  const [activeWars,   setActive]   = useState([]);
  const [history,      setHistory]  = useState([]);
  const [rivalSchool,  setRival]    = useState("");
  const [subject,      setSubject]  = useState("Mixed");
  const [loading,      setLoading]  = useState(true);
  const [challenging,  setChallg]   = useState(false);
  const [msg,          setMsg]      = useState("");
  const mySchool = JSON.parse(localStorage.getItem("student")||"{}").school_name || "";
  const SUBJECTS = ["Mixed","Mathematics","Physics","Chemistry","Biology","English","Economics"];

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(""),4000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lb, active, hist] = await Promise.all([
        fetch(`${API}/school-wars/leaderboard`, { headers:h() }).then(r=>r.json()),
        fetch(`${API}/school-wars/active`,      { headers:h() }).then(r=>r.json()),
        fetch(`${API}/school-wars/history`,     { headers:h() }).then(r=>r.json()),
      ]);
      setLb(lb.leaderboard  || []);
      setActive(active.wars || []);
      setHistory(hist.history || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const issueChallenge = async () => {
    if (!rivalSchool.trim()) return flash("❌ Enter the rival school name.");
    setChallg(true);
    try {
      const r = await fetch(`${API}/school-wars/challenge`, {
        method:"POST", headers:h(), body:JSON.stringify({ rivalSchool, subject })
      });
      const d = await r.json();
      if (d.success) { flash("✅ War challenge sent to " + rivalSchool + "!"); setRival(""); load(); }
      else flash("❌ " + d.error);
    } catch (e) { flash("❌ " + e.message); }
    setChallg(false);
  };

  const acceptChallenge = async (warId) => {
    const r = await fetch(`${API}/school-wars/${warId}/accept`, { method:"POST", headers:h() });
    const d = await r.json();
    if (d.success) { flash("✅ Challenge accepted! Recruit squad members."); load(); }
    else flash("❌ " + d.error);
  };

  const joinWar = async (warId) => {
    const r = await fetch(`${API}/school-wars/${warId}/join`, { method:"POST", headers:h() });
    const d = await r.json();
    if (d.success) { flash(`✅ Joined as ${d.side} side! (${d.memberCount}/5)`); load(); }
    else flash("❌ " + d.error);
  };

  const st = {
    page: { minHeight:"100vh", background:"var(--bg)", color:"var(--text)", padding:"16px", paddingBottom:90 },
    head: { display:"flex", alignItems:"center", gap:12, marginBottom:20 },
    back: { background:"none", border:"none", color:"var(--text-muted)", fontSize:22, cursor:"pointer", padding:0 },
    tabs: { display:"flex", gap:6, marginBottom:18, overflowX:"auto" },
    tab:  (a)=>({ padding:"8px 16px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, whiteSpace:"nowrap",
                  background:a?"var(--primary)":"rgba(255,255,255,0.07)", color:a?"#fff":"var(--text-muted)" }),
    card: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:14, marginBottom:10 },
    inp:  { width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.07)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", fontSize:14, boxSizing:"border-box", outline:"none" },
    btn:  (c,dis)=>({ padding:"10px 20px", background:dis?"#333":c||"var(--primary)", border:"none", borderRadius:10, color:"#fff", fontWeight:700, cursor:dis?"not-allowed":"pointer", opacity:dis?0.6:1, fontSize:14 }),
    rank: (i)=>({ width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14,
                  background: i===0?"rgba(255,200,87,0.2)":i===1?"rgba(192,192,192,0.2)":i===2?"rgba(205,127,50,0.2)":"rgba(255,255,255,0.05)",
                  color: i===0?"#FFC857":i===1?"#C0C0C0":i===2?"#CD7F32":"var(--text-muted)" }),
  };

  const TABS = [
    { id:"leaderboard", label:"🏆 Leaderboard" },
    { id:"active",      label:"⚔️ Active Wars", badge: activeWars.length },
    { id:"challenge",   label:"📣 Challenge" },
    { id:"history",     label:"📜 History" },
  ];

  if (loading) return (
    <div style={{ ...st.page, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="loader-ring" />
    </div>
  );

  return (
    <div style={st.page}>
      <div style={st.head}>
        <div>
          <div style={{ fontWeight:900, fontSize:20 }}>🏰 School Wars</div>
          <div style={{ color:"var(--text-muted)", fontSize:12 }}>Inter-school faction battles · {mySchool || "Unknown School"}</div>
        </div>
      </div>

      {msg && <div style={{ padding:"10px 14px", background:"rgba(0,208,132,0.1)", border:"1px solid rgba(0,208,132,0.3)", borderRadius:10, color:"#00D084", fontWeight:700, fontSize:13, marginBottom:12 }}>{msg}</div>}

      <div style={st.tabs}>
        {TABS.map(t=>(
          <button key={t.id} style={st.tab(tab===t.id)} onClick={()=>setTab(t.id)}>
            {t.label}{t.badge>0&&<span style={{ marginLeft:5, background:"#FF5A5F", color:"#fff", borderRadius:10, fontSize:10, padding:"1px 5px" }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── LEADERBOARD ── */}
      {tab==="leaderboard" && (
        <>
          <div style={{ ...st.card, background:"linear-gradient(135deg,rgba(124,92,255,0.15),rgba(255,200,87,0.1))", border:"1px solid rgba(124,92,255,0.3)", marginBottom:16 }}>
            <div style={{ fontWeight:900, fontSize:16, marginBottom:4 }}>⚔️ School Faction War</div>
            <div style={{ color:"var(--text-muted)", fontSize:13 }}>Schools earn Faction XP by winning war battles. Top school rules the season!</div>
          </div>
          {leaderboard.map((school,i)=>(
            <div key={i} style={{ ...st.card, ...(school.school===mySchool?{border:"1px solid rgba(124,92,255,0.4)",background:"rgba(124,92,255,0.07)"}:{}) }} className="card-hover">
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={st.rank(i)}>{school.badge||i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:14 }}>{school.school}</div>
                  <div style={{ color:"var(--text-muted)", fontSize:12 }}>
                    {school.warsWon}W/{school.warsPlayed}P · {school.winRate}% win rate
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:900, fontSize:16, color:"var(--gold,#FFC857)" }}>{school.factionXP?.toLocaleString()}</div>
                  <div style={{ color:"var(--text-muted)", fontSize:11 }}>Faction XP</div>
                </div>
              </div>
              {i===0&&<div style={{ marginTop:8, padding:"4px 10px", background:"rgba(255,200,87,0.15)", borderRadius:8, color:"#FFC857", fontSize:12, fontWeight:700, display:"inline-block" }}>👑 Current War Leaders</div>}
            </div>
          ))}
          {leaderboard.length===0&&<div style={{ textAlign:"center", padding:32, color:"var(--text-muted)" }}>No wars fought yet. Be the first school to issue a challenge!</div>}
        </>
      )}

      {/* ── ACTIVE WARS ── */}
      {tab==="active" && (
        <>
          {activeWars.length===0 ? (
            <div style={{ textAlign:"center", padding:32 }}>
              <div style={{ fontSize:40, marginBottom:12 }}>🏰</div>
              <div style={{ fontWeight:700, color:"var(--text-muted)" }}>No active wars for your school</div>
              <button onClick={()=>setTab("challenge")} style={{ ...st.btn(), marginTop:16 }}>Issue a Challenge</button>
            </div>
          ) : activeWars.map(war=>(
            <div key={war.id} style={{ ...st.card, border:"1px solid rgba(255,90,95,0.3)" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={{ fontWeight:800, fontSize:14 }}>{war.challengerSchool} vs {war.rivalSchool}</div>
                <span style={{ padding:"3px 10px", borderRadius:10, background:war.status==="in_progress"?"rgba(255,90,95,0.2)":"rgba(255,200,87,0.2)", color:war.status==="in_progress"?"#FF5A5F":"#FFC857", fontWeight:700, fontSize:11 }}>
                  {war.status.replace(/_/g," ").toUpperCase()}
                </span>
              </div>
              <div style={{ color:"var(--text-muted)", fontSize:12, marginBottom:10 }}>
                {war.subject||"Mixed"} · {war.challengerWins}-{war.rivalWins} · Best of {war.maxRounds}
              </div>
              <div style={{ display:"flex", gap:6 }}>
                {war.status==="pending" && war.rivalSchool===mySchool && (
                  <button onClick={()=>acceptChallenge(war.id)} style={st.btn("#00D084")}>Accept War</button>
                )}
                {war.status==="accepted" && (
                  <button onClick={()=>joinWar(war.id)} style={st.btn()}>Join War Team</button>
                )}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── CHALLENGE ── */}
      {tab==="challenge" && (
        <div style={st.card}>
          <div style={{ fontWeight:800, fontSize:16, marginBottom:6 }}>⚔️ Issue a War Challenge</div>
          <div style={{ color:"var(--text-muted)", fontSize:13, marginBottom:16, lineHeight:1.6 }}>
            Challenge another school to a best-of-3 Arena war. Your school's top players represent you.
          </div>
          <div style={{ marginBottom:10 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:6 }}>Rival School Name</div>
            <input style={st.inp} value={rivalSchool} onChange={e=>setRival(e.target.value)} placeholder="Type exact school name..." />
          </div>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>Subject</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {SUBJECTS.map(s2=>(
                <button key={s2} onClick={()=>setSubject(s2)}
                  style={{ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700, fontSize:12,
                           background:subject===s2?"var(--primary)":"rgba(255,255,255,0.07)", color:subject===s2?"#fff":"var(--text-muted)" }}>
                  {s2}
                </button>
              ))}
            </div>
          </div>
          <button onClick={issueChallenge} disabled={challenging} style={{ ...st.btn("linear-gradient(135deg,#FF5A5F,#e17055)",challenging), width:"100%", padding:"12px 0", fontSize:15 }}>
            {challenging?"Sending Challenge...":"⚔️ Declare War!"}
          </button>
          <div style={{ color:"var(--text-muted)", fontSize:12, marginTop:10, textAlign:"center" }}>
            The rival school has 24 hours to accept your challenge.
          </div>
        </div>
      )}

      {/* ── HISTORY ── */}
      {tab==="history" && (
        <>
          {history.length===0 ? (
            <div style={{ textAlign:"center", padding:32, color:"var(--text-muted)" }}>No war history yet for your school.</div>
          ) : history.map((w,i)=>{
            const won = w.winner_school===mySchool;
            return (
              <div key={i} style={{ ...st.card, border:`1px solid ${won?"rgba(0,208,132,0.25)":"rgba(255,90,95,0.2)"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>{w.challenger_school} vs {w.rival_school}</div>
                    <div style={{ color:"var(--text-muted)", fontSize:12 }}>{w.subject||"Mixed"} · {new Date(w.ended_at).toLocaleDateString()}</div>
                    <div style={{ color:"var(--text-muted)", fontSize:12 }}>{w.challenger_wins}-{w.rival_wins}</div>
                  </div>
                  <div style={{ padding:"4px 12px", borderRadius:10, background:won?"rgba(0,208,132,0.15)":"rgba(255,90,95,0.15)", color:won?"#00D084":"#FF5A5F", fontWeight:800, fontSize:13 }}>
                    {won?"VICTORY":"DEFEAT"}
                  </div>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
