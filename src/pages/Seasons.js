import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const RANK_ORDER = ["Bronze","Silver","Gold","Platinum","Diamond","Legend"];

export default function Seasons() {
  const nav = useNavigate();
  const [data, setData]     = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab]       = useState("current");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get("/seasons/current").then(r => setData(r.data)),
      API.get("/seasons/history").then(r => setHistory(r.data.history || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={s.page}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", flexDirection:"column", gap:12 }}>
        <div style={{ fontSize:48 }}>🏆</div>
        <p style={{ color:"#a29bfe", fontWeight:600 }}>Loading season data...</p>
      </div>
    </div>
  );

  const { season, my_stats, leaderboard = [], ranks = [] } = data || {};

  const daysLeft = season?.ends_at
    ? Math.max(0, Math.ceil((new Date(season.ends_at) - Date.now()) / 86400000))
    : 0;

  const rankProgress = my_stats?.next_rank
    ? Math.min(100, 100 - Math.round((my_stats.points_to_next / (my_stats.next_rank.min - my_stats.rank?.min)) * 100))
    : 100;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => nav("/arena")} style={s.backBtn}>← Arena</button>
        <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:"#f0f4ff" }}>🏆 Arena Seasons</h1>
        <span style={{ color:"#8b9cbd", fontSize:12 }}>{daysLeft}d left</span>
      </div>

      <div style={{ maxWidth:740, margin:"0 auto", padding:"16px 12px 80px" }}>
        {/* Season badge */}
        <div style={{ background:"linear-gradient(135deg,#6c63ff22,#a29bfe11)", borderRadius:16,
          padding:"20px 20px", border:"1px solid rgba(108,99,255,0.25)", marginBottom:16, textAlign:"center" }}>
          <div style={{ color:"#a29bfe", fontSize:12, fontWeight:600, marginBottom:4 }}>CURRENT SEASON</div>
          <h2 style={{ margin:"0 0 4px", color:"#f0f4ff", fontSize:22, fontWeight:800 }}>
            {season?.month_name} {season?.year}
          </h2>
          <p style={{ color:"#8b9cbd", fontSize:13, margin:"0 0 16px" }}>{daysLeft} days remaining · Rewards on 1st</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10 }}>
            {[["Points",my_stats?.points||0,"#a29bfe"],["Wins",my_stats?.wins||0,"#00b894"],
              ["Losses",my_stats?.losses||0,"#e17055"],["Draws",my_stats?.draws||0,"#fdcb6e"]].map(([l,v,c]) => (
              <div key={l} style={{ background:"rgba(0,0,0,0.3)", borderRadius:10, padding:"10px 8px" }}>
                <div style={{ color:c, fontWeight:800, fontSize:20 }}>{v}</div>
                <div style={{ color:"#8b9cbd", fontSize:11 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* My rank card */}
        {my_stats?.rank && (
          <div style={{ background:"var(--surface,#1a1a2e)", borderRadius:14, padding:"16px 18px",
            border:`1px solid ${my_stats.rank.color}44`, marginBottom:16 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <span style={{ fontSize:32 }}>{my_stats.rank.icon}</span>
                <div>
                  <div style={{ color:my_stats.rank.color, fontWeight:800, fontSize:18 }}>{my_stats.rank.name}</div>
                  <div style={{ color:"#8b9cbd", fontSize:12 }}>{my_stats.points?.toLocaleString()} points</div>
                </div>
              </div>
              {my_stats.next_rank && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ color:"#8b9cbd", fontSize:11 }}>Next rank</div>
                  <div style={{ color:my_stats.next_rank.color, fontWeight:700, fontSize:14 }}>
                    {my_stats.next_rank.icon} {my_stats.next_rank.name}
                  </div>
                  <div style={{ color:"#6b7db3", fontSize:11 }}>{my_stats.points_to_next?.toLocaleString()} pts to go</div>
                </div>
              )}
            </div>
            {/* Progress bar */}
            <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden" }}>
              <div style={{ height:"100%", width:`${rankProgress}%`, background:my_stats.rank.color, borderRadius:3, transition:"width 0.8s ease" }} />
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={s.tabs}>
          {[["current","🏅 Leaderboard"],["ranks","🎖 All Ranks"],["history","📅 History"]].map(([key,label]) => (
            <button key={key} onClick={() => setTab(key)}
              style={{ ...s.tab, color: tab===key ? "#6c63ff" : "#8b9cbd",
                borderBottom: tab===key ? "2px solid #6c63ff" : "2px solid transparent" }}>
              {label}
            </button>
          ))}
        </div>

        {/* Leaderboard tab */}
        {tab === "current" && (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {leaderboard.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 0", color:"#8b9cbd" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🎮</div>
                <p>No battles yet this season. Play Arena to appear on the board!</p>
                <button onClick={() => nav("/arena")} style={s.btnPrimary}>Go to Arena →</button>
              </div>
            ) : leaderboard.map((p, i) => {
              const rankInfo = p.rank_info || {};
              const isTop3  = i < 3;
              const medal   = ["🥇","🥈","🥉"][i] || "";
              return (
                <div key={p.student_id} style={{
                  ...s.lbRow, border:`1px solid ${isTop3 ? rankInfo.color+"44" : "rgba(255,255,255,0.07)"}`,
                  background: isTop3 ? `${rankInfo.color}11` : "var(--surface,#1a1a2e)",
                }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, flex:1 }}>
                    <span style={{ width:28, textAlign:"center", fontWeight:800,
                      color: isTop3 ? rankInfo.color : "#8b9cbd", fontSize: isTop3 ? 16 : 14 }}>
                      {medal || p.position}
                    </span>
                    <span style={{ fontSize:20 }}>{rankInfo.icon}</span>
                    <div>
                      <div style={{ color:"#f0f4ff", fontWeight:600, fontSize:14 }}>{p.full_name}</div>
                      <div style={{ color:rankInfo.color, fontSize:11, fontWeight:600 }}>{rankInfo.name}</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ color:rankInfo.color, fontWeight:800, fontSize:15 }}>{parseInt(p.season_points).toLocaleString()}</div>
                    <div style={{ color:"#8b9cbd", fontSize:10 }}>{p.wins}W · {p.losses}L</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* All ranks tab */}
        {tab === "ranks" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {ranks.map(rank => (
              <div key={rank.name} style={{ ...s.card, border:`1px solid ${rank.color}33`,
                background: my_stats?.rank?.name === rank.name ? `${rank.color}11` : "var(--surface,#1a1a2e)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <span style={{ fontSize:28 }}>{rank.icon}</span>
                    <div>
                      <div style={{ color:rank.color, fontWeight:800, fontSize:16 }}>{rank.name}</div>
                      <div style={{ color:"#8b9cbd", fontSize:12 }}>{rank.min.toLocaleString()} – {rank.max === Infinity ? "∞" : rank.max.toLocaleString()} pts</div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ color:"#fdcb6e", fontSize:13, fontWeight:700 }}>🪙 {rank.reward_coins}</div>
                    <div style={{ color:"#a29bfe", fontSize:12 }}>🎟 {rank.reward_tokens} tokens</div>
                    {my_stats?.rank?.name === rank.name && <div style={{ color:rank.color, fontSize:11, fontWeight:700, marginTop:4 }}>← Your rank</div>}
                  </div>
                </div>
              </div>
            ))}
            <p style={{ color:"#8b9cbd", fontSize:12, textAlign:"center", marginTop:8 }}>
              Rewards are distributed on the 1st of every month to all players who battled in Arena.
            </p>
          </div>
        )}

        {/* History tab */}
        {tab === "history" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {history.length === 0 ? (
              <p style={{ color:"#8b9cbd", textAlign:"center", padding:40 }}>No past seasons yet. Your first season is in progress!</p>
            ) : history.map(h => (
              <div key={h.season_id} style={{ ...s.card, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ color:"#f0f4ff", fontWeight:700, fontSize:15 }}>{h.season_id}</div>
                  <div style={{ color:`${h.rank_info?.color}`, fontSize:12, fontWeight:600 }}>
                    {h.rank_info?.icon} {h.rank_info?.name}
                  </div>
                  <div style={{ color:"#8b9cbd", fontSize:11 }}>{h.wins}W · {h.losses}L · {h.draws}D</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ color:"#a29bfe", fontWeight:800, fontSize:18 }}>#{h.final_position}</div>
                  <div style={{ color:"#8b9cbd", fontSize:11 }}>Final rank</div>
                  <div style={{ color:"#fdcb6e", fontSize:12, fontWeight:700 }}>{parseInt(h.season_points).toLocaleString()} pts</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight:"100vh", background:"var(--bg,#0f0f1e)", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#f0f4ff" },
  header:    { background:"var(--surface,#1a1a2e)", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.07)", position:"sticky", top:0, zIndex:100 },
  backBtn:   { background:"none", border:"none", color:"#a29bfe", cursor:"pointer", fontSize:14, fontWeight:600 },
  tabs:      { display:"flex", gap:0, marginBottom:16, borderBottom:"1px solid rgba(255,255,255,0.08)" },
  tab:       { background:"transparent", border:"none", cursor:"pointer", padding:"10px 16px", fontSize:13, fontWeight:600, borderRadius:"4px 4px 0 0" },
  lbRow:     { display:"flex", justifyContent:"space-between", alignItems:"center", borderRadius:12, padding:"12px 14px" },
  card:      { background:"var(--surface,#1a1a2e)", borderRadius:12, padding:"14px 16px", border:"1px solid rgba(255,255,255,0.07)" },
  btnPrimary:{ background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, padding:"12px 24px", fontWeight:700, cursor:"pointer", fontSize:14, marginTop:12 },
};
