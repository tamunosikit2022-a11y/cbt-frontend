import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0B1020;font-family:'Plus Jakarta Sans',sans-serif}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes pulse-glow{0%,100%{box-shadow:0 0 15px rgba(124,92,255,.3)}50%{box-shadow:0 0 35px rgba(124,92,255,.7)}}
  @keyframes slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .school-row{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);border-radius:14px;
    padding:14px 18px;display:flex;align-items:center;gap:14px;transition:all .25s ease;margin-bottom:10px}
  .school-row:hover{border-color:rgba(124,92,255,.3);transform:translateX(4px)}
  .school-row.top1{background:rgba(255,200,87,.06);border-color:rgba(255,200,87,.3)}
  .school-row.top2{background:rgba(192,192,192,.04);border-color:rgba(192,192,192,.2)}
  .school-row.top3{background:rgba(205,127,50,.04);border-color:rgba(205,127,50,.2)}
  .school-row.mine{background:rgba(124,92,255,.08);border-color:rgba(124,92,255,.4);animation:pulse-glow 2s ease-in-out infinite}
`;

export default function Factions() {
  const nav = useNavigate();
  const [data,    setData]    = useState(null);
  const [mySchool,setMySchool]= useState(null);
  const [states,  setStates]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("schools");

  useEffect(() => {
    if (!document.getElementById("faction-css")) {
      const s = document.createElement("style"); s.id = "faction-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const [schoolRes, mineRes, stateRes] = await Promise.all([
        API.get("/factions/schools"),
        API.get("/factions/mine"),
        API.get("/factions/states"),
      ]);
      setData(schoolRes.data);
      setMySchool(mineRes.data.school);
      setStates(stateRes.data.states || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0B1020" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:64, animation:"float 2s ease-in-out infinite" }}>🌍</div>
        <p style={{ color:"#7C5CFF", marginTop:16, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Loading Factions…</p>
      </div>
    </div>
  );

  const schools = data?.schools || [];

  return (
    <div style={{ minHeight:"100vh", background:"#0B1020", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ maxWidth:800, margin:"0 auto", padding:"24px 20px 80px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={() => nav(-1)} style={{ background:"rgba(255,255,255,.06)", border:"none", color:"#fff",
            borderRadius:10, width:40, height:40, cursor:"pointer", fontSize:18 }}>←</button>
          <div>
            <h1 style={{ color:"#fff", fontWeight:900, fontSize:24, margin:0 }}>🌍 School Factions</h1>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, margin:0 }}>School rivalry — rise as the top faction</p>
          </div>
        </div>

        {/* My school banner */}
        {mySchool && (
          <div style={{ background:"linear-gradient(135deg,rgba(124,92,255,.15),rgba(0,212,255,.08))",
            border:"1px solid rgba(124,92,255,.4)", borderRadius:18, padding:20, marginBottom:24 }}>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, fontWeight:700, letterSpacing:1, marginBottom:8 }}>
              🏫 YOUR FACTION
            </p>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
              <div>
                <h2 style={{ color:"#fff", fontWeight:900, fontSize:20, margin:0 }}>{mySchool.name}</h2>
                <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, marginTop:2 }}>
                  {mySchool.state} • {mySchool.members} members
                </p>
              </div>
              <div style={{ display:"flex", gap:16 }}>
                <div style={{ textAlign:"center" }}>
                  <p style={{ color:"#FFC857", fontWeight:900, fontSize:22, margin:0 }}>#{mySchool.rank}</p>
                  <p style={{ color:"rgba(255,255,255,.4)", fontSize:11 }}>Global Rank</p>
                </div>
                <div style={{ textAlign:"center" }}>
                  <p style={{ color:"#7C5CFF", fontWeight:900, fontSize:22, margin:0 }}>{(mySchool.total_xp||0).toLocaleString()}</p>
                  <p style={{ color:"rgba(255,255,255,.4)", fontSize:11 }}>Total XP</p>
                </div>
                <div style={{ textAlign:"center" }}>
                  <p style={{ color:"#00D4FF", fontWeight:900, fontSize:22, margin:0 }}>{mySchool.avg_xp?.toLocaleString()}</p>
                  <p style={{ color:"rgba(255,255,255,.4)", fontSize:11 }}>Avg XP</p>
                </div>
              </div>
            </div>

            {/* Top students */}
            {mySchool.top_students?.length > 0 && (
              <div style={{ marginTop:16, borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:12 }}>
                <p style={{ color:"rgba(255,255,255,.4)", fontSize:11, fontWeight:700, marginBottom:8 }}>TOP WARRIORS</p>
                <div style={{ display:"flex", gap:8, overflowX:"auto" }}>
                  {mySchool.top_students.slice(0,5).map((s, i) => (
                    <div key={i} style={{ flexShrink:0, textAlign:"center" }}>
                      <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg,#7C5CFF,#00D4FF)",
                        display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, margin:"0 auto 4px" }}>
                        {s.avatar_url ? <img src={s.avatar_url} alt="" style={{ width:"100%", borderRadius:"50%" }} />
                          : ["🥇","🥈","🥉","4️⃣","5️⃣"][i]}
                      </div>
                      <p style={{ color:"#fff", fontSize:10, fontWeight:700, whiteSpace:"nowrap", maxWidth:60, overflow:"hidden", textOverflow:"ellipsis" }}>
                        {s.full_name?.split(" ")[0]}
                      </p>
                      <p style={{ color:"#FFC857", fontSize:10 }}>{(s.xp||0).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:20, background:"rgba(255,255,255,.04)", borderRadius:14, padding:6 }}>
          {[
            { key:"schools", label:"🏫 Schools" },
            { key:"states",  label:"🗺️ States" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer",
                fontWeight:800, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14,
                background: tab===t.key ? "#7C5CFF" : "transparent",
                color: tab===t.key ? "#fff" : "rgba(255,255,255,.5)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* School list */}
        {tab === "schools" && (
          <div>
            {/* Top 3 podium */}
            {schools.length >= 3 && (
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1.15fr 1fr", gap:12, marginBottom:20 }}>
                {[schools[1], schools[0], schools[2]].map((s, idx) => {
                  const pos = [1,0,2][idx]; // visual positions
                  const heights = [120, 140, 110];
                  const medals  = ["🥈","🥇","🥉"];
                  const colors  = ["#C0C0C0","#FFC857","#CD7F32"];
                  return s ? (
                    <div key={s.school_name} style={{ background:"rgba(255,255,255,.04)", border:`1px solid ${colors[idx]}30`,
                      borderRadius:16, padding:"16px 12px", textAlign:"center",
                      height:heights[idx], display:"flex", flexDirection:"column", justifyContent:"flex-end", alignItems:"center" }}>
                      <div style={{ fontSize:30, marginBottom:4 }}>{medals[idx]}</div>
                      <p style={{ color:"#fff", fontWeight:900, fontSize:12, marginBottom:2,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"100%" }}>
                        {s.school_name}
                      </p>
                      <p style={{ color:colors[idx], fontWeight:800, fontSize:13 }}>{(s.total_xp||0).toLocaleString()} XP</p>
                      <p style={{ color:"rgba(255,255,255,.4)", fontSize:11 }}>{s.member_count} students</p>
                    </div>
                  ) : null;
                })}
              </div>
            )}

            {schools.map((s, i) => {
              const isMe = mySchool?.name === s.school_name;
              return (
                <div key={s.school_name} className={`school-row ${i===0?"top1":i===1?"top2":i===2?"top3":""} ${isMe?"mine":""}`}>
                  <div style={{ width:36, textAlign:"center" }}>
                    <span style={{ fontWeight:900, fontSize:18, color: i<3 ? ["#FFC857","#C0C0C0","#CD7F32"][i] : "rgba(255,255,255,.4)" }}>
                      {s.badge}
                    </span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <p style={{ color:"#fff", fontWeight:800, fontSize:14, margin:0,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {s.school_name}
                      </p>
                      {isMe && <span style={{ fontSize:10, background:"rgba(124,92,255,.3)", color:"#7C5CFF",
                        padding:"1px 6px", borderRadius:10, fontWeight:800, flexShrink:0 }}>YOU</span>}
                    </div>
                    <p style={{ color:"rgba(255,255,255,.4)", fontSize:12, margin:0 }}>
                      {s.state} • {s.member_count} students
                    </p>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <p style={{ color:"#FFC857", fontWeight:800, fontSize:15, margin:0 }}>
                      {(s.total_xp||0).toLocaleString()}
                    </p>
                    <p style={{ color:"rgba(255,255,255,.4)", fontSize:11, margin:0 }}>Total XP</p>
                  </div>
                </div>
              );
            })}

            {schools.length === 0 && (
              <div style={{ textAlign:"center", padding:"60px 0" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🏫</div>
                <p style={{ color:"rgba(255,255,255,.4)" }}>No school data yet — be the first to compete!</p>
              </div>
            )}
          </div>
        )}

        {/* States leaderboard */}
        {tab === "states" && (
          <div>
            {states.map((s, i) => (
              <div key={s.state} className={`school-row ${i===0?"top1":i===1?"top2":i===2?"top3":""}`}>
                <div style={{ width:36, textAlign:"center" }}>
                  <span style={{ fontWeight:900, fontSize:18, color: i<3 ? ["#FFC857","#C0C0C0","#CD7F32"][i] : "rgba(255,255,255,.4)" }}>
                    {s.badge}
                  </span>
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ color:"#fff", fontWeight:800, fontSize:14, margin:0 }}>{s.state}</p>
                  <p style={{ color:"rgba(255,255,255,.4)", fontSize:12, margin:0 }}>{s.members} students</p>
                </div>
                <div style={{ textAlign:"right" }}>
                  <p style={{ color:"#7C5CFF", fontWeight:800, fontSize:15, margin:0 }}>
                    {(s.total_xp||0).toLocaleString()}
                  </p>
                  <p style={{ color:"rgba(255,255,255,.4)", fontSize:11, margin:0 }}>Total XP</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
