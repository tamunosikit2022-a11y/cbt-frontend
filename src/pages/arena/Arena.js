import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getArenaSocket } from "../../utils/arenaSocket";
import API from "../../utils/api";

const MODES = [
  { id: "lone_wolf",    icon: "🐺", name: "Lone Wolf",   desc: "1v1 solo battle",                      color: "#6c63ff" },
  { id: "duel",         icon: "⚔️",  name: "Duel",         desc: "Ranked 1v1 — highest stakes",          color: "#e17055" },
  { id: "duo",          icon: "👥", name: "Duo",           desc: "2v2 squad — team of 2 vs team of 2",   color: "#0984e3" },
  { id: "clash_squad",  icon: "🛡️", name: "Clash Squad",  desc: "4 players — 2 squads battle it out",   color: "#00b894" },
  { id: "battle_royal", icon: "👑", name: "Battle Royal", desc: "Up to 50 players — last brain standing",color: "#fdcb6e" },
];

const BATTLE_TYPES = [
  { id: "speed_battle", icon: "⚡", name: "Speed Battle", desc: "First correct answer wins the round" },
  { id: "subject_war",  icon: "🧠", name: "Subject War",  desc: "Best total score wins" },
  { id: "survival",     icon: "💀", name: "Survival",     desc: "3 lives — wrong answer costs a life" },
];

const SUBJECTS = [
  "English Language","Mathematics","Biology","Chemistry","Physics",
  "Economics","Government","Geography","Literature in English",
  "Accounting","Commerce","Agriculture","Christian Religious Knowledge",
  "History","Computer Studies",
];

const RANKS = [
  { name:"Bronze",  min:0,    color:"#CD7F32", icon:"🥉" },
  { name:"Silver",  min:100,  color:"#C0C0C0", icon:"🥈" },
  { name:"Gold",    min:300,  color:"#FFD700", icon:"🥇" },
  { name:"Platinum",min:700,  color:"#00b4d8", icon:"💎" },
  { name:"Diamond", min:1500, color:"#9b5de5", icon:"💠" },
  { name:"Elite",   min:3000, color:"#e17055", icon:"🏆" },
];

export default function Arena() {
  const nav = useNavigate();
  const { student } = useAuth();
  const socketRef = useRef(null);

  const [tab,           setTab]           = useState("play");
  const [mode,          setMode]          = useState("clash_squad");
  const [battleType,    setBattleType]    = useState("speed_battle");
  const [subject,       setSubject]       = useState("");
  const [difficulty,    setDifficulty]    = useState("mixed");
  const [questionCount, setQuestionCount] = useState(10);
  const [timePerQ,      setTimePerQ]      = useState(20);
  const [isPublic,      setIsPublic]      = useState(true);
  const [joinCode,      setJoinCode]      = useState("");
  const [publicRooms,   setPublicRooms]   = useState([]);
  const [myStats,       setMyStats]       = useState(null);
  const [arenaBoard,    setArenaBoard]    = useState([]);
  const [myHistory,     setMyHistory]     = useState([]);
  const [error,         setError]         = useState("");
  const [quickJoining,  setQuickJoining]  = useState(false);

  const playerName = student?.full_name?.split(" ")[0] || "Player";
  const playerId   = student?.id;

  useEffect(() => {
    API.get("/arena/stats/me").then(r => setMyStats(r.data)).catch(() => {});
    const sock = getArenaSocket();
    socketRef.current = sock;
    sock.on("public_rooms_update", list => setPublicRooms(list || []));
    sock.emit("list_public_rooms", {}, res => { if (res?.rooms) setPublicRooms(res.rooms); });
    return () => { sock.off("public_rooms_update"); };
  }, []);

  useEffect(() => {
    if (tab === "leaderboard") API.get("/arena/leaderboard").then(r => setArenaBoard(r.data)).catch(() => {});
    if (tab === "history")     API.get("/arena/history").then(r => setMyHistory(r.data)).catch(() => {});
    if (tab === "play" && socketRef.current)
      socketRef.current.emit("list_public_rooms", {}, res => { if (res?.rooms) setPublicRooms(res.rooms); });
  }, [tab]);

  const myRank = RANKS.slice().reverse().find(r => (myStats?.xp || 0) >= r.min) || RANKS[0];

  const goWaiting = (config) =>
    nav("/arena/waiting", { state: { creating: true, config: { ...config, playerName, playerId, avatar: "🎓" } } });

  const handleCreate = () => {
    setError("");
    goWaiting({ mode, battleType, subject, difficulty, questionCount: parseInt(questionCount), timePerQuestion: parseInt(timePerQ), isPublic });
  };

  const handleJoinCode = () => {
    if (!joinCode.trim()) return setError("Enter a room code.");
    setError("");
    nav("/arena/waiting", { state: { creating: false, code: joinCode.trim().toUpperCase(), playerName, playerId, avatar: "🎓" } });
  };

  const handleJoinPublic = (code) =>
    nav("/arena/waiting", { state: { creating: false, code, playerName, playerId, avatar: "🎓" } });

  const handleQuickJoin = () => {
    setQuickJoining(true); setError("");
    const sock = socketRef.current;
    if (!sock) { setError("Not connected. Please refresh."); setQuickJoining(false); return; }
    sock.emit("quick_join", {}, res => {
      setQuickJoining(false);
      if (!res.success) return setError(res.error || "No open rooms right now.");
      handleJoinPublic(res.code);
    });
  };

  return (
    <div style={s.page}>
      <div style={s.container}>

        <div style={s.header}>
          <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
          {myStats && (
            <div style={s.rankBadge}>
              <span style={{ fontSize: 18 }}>{myRank.icon}</span>
              <span style={{ color: myRank.color, fontWeight: 800, fontSize: 14 }}>{myRank.name}</span>
              <span style={{ color: "#636e72", fontSize: 12 }}>{myStats.xp} XP</span>
            </div>
          )}
        </div>

        <h1 style={s.title}>🏟️ Scholars Arena</h1>
        <p style={s.sub}>Academic battles. All modes FREE. No limits.</p>

        {/* QUICK JOIN */}
        <div style={s.qjBanner}>
          <div>
            <div style={{ fontWeight: 800, color: "#fff", fontSize: 15 }}>⚡ Quick Join</div>
            <div style={{ color: "#a29bfe", fontSize: 13, marginTop: 2 }}>Jump into the most active open room — no code needed</div>
          </div>
          <button style={s.qjBtn} onClick={handleQuickJoin} disabled={quickJoining}>
            {quickJoining ? "Finding..." : "Join Now →"}
          </button>
        </div>

        <div style={s.tabs}>
          {[["play","⚔️ Play"],["leaderboard","🏆 Rankings"],["history","📋 History"]].map(([id,label]) => (
            <button key={id}
              style={{ ...s.tab, background: tab === id ? "#6c63ff" : "transparent", color: tab === id ? "#fff" : "#636e72", borderColor: tab === id ? "#6c63ff" : "#2d2d44" }}
              onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {myStats && tab === "play" && (
          <div style={s.statsRow}>
            <MiniStat label="Matches"  value={myStats.total_matches} />
            <MiniStat label="Wins"     value={myStats.wins}          color="#00b894" />
            <MiniStat label="Win Rate" value={`${myStats.win_rate}%`} color="#fdcb6e" />
            <MiniStat label="XP"       value={myStats.xp}            color={myRank.color} />
          </div>
        )}

        {tab === "play" && (
          <div style={s.twoCol}>
            {/* CREATE */}
            <div style={s.panel}>
              <h3 style={s.panelTitle}>⚔️ Create Room</h3>

              <label style={s.label}>Game Mode</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 14 }}>
                {MODES.map(m => (
                  <div key={m.id}
                    style={{ ...s.modeCard, borderColor: mode === m.id ? m.color : "#2d2d44", background: mode === m.id ? m.color + "18" : "#0f0f1a" }}
                    onClick={() => { setMode(m.id); setError(""); }}>
                    <span style={{ fontSize: 20 }}>{m.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: mode === m.id ? m.color : "#fff" }}>{m.name}</div>
                      <div style={{ fontSize: 11, color: "#636e72" }}>{m.desc}</div>
                    </div>
                    {mode === m.id && <span style={{ color: m.color }}>✓</span>}
                  </div>
                ))}
              </div>

              <label style={s.label}>Battle Type</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                {BATTLE_TYPES.map(b => (
                  <div key={b.id}
                    style={{ ...s.modeCard, borderColor: battleType === b.id ? "#e17055" : "#2d2d44", background: battleType === b.id ? "#e1705518" : "#0f0f1a" }}
                    onClick={() => setBattleType(b.id)}>
                    <span style={{ fontSize: 18 }}>{b.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: battleType === b.id ? "#e17055" : "#fff" }}>{b.name}</div>
                      <div style={{ fontSize: 11, color: "#636e72" }}>{b.desc}</div>
                    </div>
                    {battleType === b.id && <span style={{ color: "#e17055" }}>✓</span>}
                  </div>
                ))}
              </div>

              <label style={s.label}>Subject</label>
              <select style={s.select} value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">Any Subject (Mixed)</option>
                {SUBJECTS.map(s2 => <option key={s2} value={s2}>{s2}</option>)}
              </select>

              <label style={s.label}>Difficulty</label>
              <select style={s.select} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                <option value="mixed">Mixed</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Questions</label>
                  <select style={s.select} value={questionCount} onChange={e => setQuestionCount(e.target.value)}>
                    {[5,10,15,20,25,30].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={s.label}>Secs/Q</label>
                  <select style={s.select} value={timePerQ} onChange={e => setTimePerQ(e.target.value)}>
                    {[10,15,20,30,45,60].map(n => <option key={n} value={n}>{n}s</option>)}
                  </select>
                </div>
              </div>

              <div style={s.toggleRow}>
                <span style={{ color: "#a29bfe", fontSize: 12 }}>Public — others can discover and join</span>
                <button style={{ ...s.toggle, background: isPublic ? "#6c63ff" : "#2d2d44" }}
                  onClick={() => setIsPublic(p => !p)}>{isPublic ? "ON" : "OFF"}</button>
              </div>

              {error && <p style={s.error}>{error}</p>}
              <button style={s.createBtn} onClick={handleCreate}>Create Room →</button>
            </div>

            {/* JOIN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={s.panel}>
                <h3 style={s.panelTitle}>🔑 Join by Code</h3>
                <p style={{ fontSize: 12, color: "#636e72", marginBottom: 10 }}>Enter the 6-character code from your friend</p>
                <input
                  style={{ ...s.select, textAlign: "center", fontSize: 22, letterSpacing: 6, fontFamily: "monospace", textTransform: "uppercase", padding: "12px" }}
                  placeholder="ABC123" maxLength={6}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleJoinCode()}
                />
                <button style={s.joinBtn} onClick={handleJoinCode}>Join Room →</button>
              </div>

              <div style={s.panel}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ ...s.panelTitle, marginBottom: 0 }}>🌍 Open Rooms</h3>
                  <span style={{ fontSize: 12, color: "#636e72" }}>{publicRooms.length} live</span>
                </div>

                {publicRooms.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "24px 0" }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>🏟️</div>
                    <p style={{ color: "#636e72", fontSize: 13 }}>No open rooms. Create one and others will see it!</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {publicRooms.map(r => (
                      <div key={r.code} style={s.pubRoom}>
                        <div style={{ flex: 1 }}>
                          <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
                            {MODES.find(m => m.id === r.mode)?.icon} {r.hostName}'s room
                          </div>
                          <div style={{ fontSize: 11, color: "#636e72", marginTop: 2 }}>
                            {r.subject || "Mixed"} · {r.battleType?.replace(/_/g," ")} · {r.difficulty}
                          </div>
                          <div style={{ display: "flex", gap: 3, marginTop: 5, alignItems: "center" }}>
                            {Array.from({ length: Math.min(r.maxPlayers, 10) }).map((_,i) => (
                              <div key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: i < r.playerCount ? "#6c63ff" : "#2d2d44" }} />
                            ))}
                            {r.maxPlayers > 10 && <span style={{ fontSize: 10, color: "#636e72" }}>+more</span>}
                            <span style={{ fontSize: 11, color: "#636e72", marginLeft: 4 }}>{r.playerCount}/{r.maxPlayers}</span>
                          </div>
                        </div>
                        <button style={s.smJoinBtn} onClick={() => handleJoinPublic(r.code)}>Join →</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {tab === "leaderboard" && (
          <div style={s.panel}>
            <h3 style={s.panelTitle}>🏆 Arena Rankings</h3>
            {arenaBoard.length === 0 && <p style={{ color:"#636e72", textAlign:"center", padding:24 }}>No matches yet. Be the first!</p>}
            {arenaBoard.map((entry,i) => (
              <div key={i} style={s.boardRow}>
                <span style={{ width:32, fontWeight:800, fontSize:16, color:i<3?["#FFD700","#C0C0C0","#CD7F32"][i]:"#636e72" }}>
                  {i<3?["🥇","🥈","🥉"][i]:`#${entry.rank}`}
                </span>
                <span style={{ flex:1, color:"#fff", fontWeight:600 }}>{entry.full_name}</span>
                <span style={{ fontSize:12, color:"#636e72", marginRight:12 }}>{entry.wins}W · {entry.win_rate}%</span>
                <span style={{ fontWeight:800, color:"#6c63ff" }}>{entry.xp} XP</span>
              </div>
            ))}
          </div>
        )}

        {tab === "history" && (
          <div style={s.panel}>
            <h3 style={s.panelTitle}>📋 My Battles</h3>
            {myHistory.length === 0 && <p style={{ color:"#636e72", textAlign:"center", padding:24 }}>No battles yet.</p>}
            {myHistory.map((h,i) => (
              <div key={i} style={s.boardRow}>
                <span style={{ fontSize:20 }}>{h.rank===1?"🏆":h.rank<=3?"🥈":"💪"}</span>
                <div style={{ flex:1, marginLeft:8 }}>
                  <div style={{ color:"#fff", fontWeight:600, fontSize:13 }}>{h.subject||"Mixed"} · {h.battle_type?.replace(/_/g," ")}</div>
                  <div style={{ fontSize:11, color:"#636e72" }}>{h.mode?.replace(/_/g," ")} · {new Date(h.ended_at).toLocaleDateString()}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:800, color:h.rank===1?"#00b894":"#a29bfe" }}>Rank #{h.rank}</div>
                  <div style={{ fontSize:11, color:"#636e72" }}>{h.score} pts · {h.correct_count}/{h.total_questions}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color="#a29bfe" }) {
  return (
    <div style={{ flex:1, background:"#1a1a2e", borderRadius:10, padding:"10px 8px", textAlign:"center", border:"1px solid #2d2d44" }}>
      <div style={{ fontSize:16, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:10, color:"#636e72", marginTop:2 }}>{label}</div>
    </div>
  );
}

const s = {
  page:       { minHeight:"100vh", background:"#0f0f1a", fontFamily:"sans-serif", padding:16 },
  container:  { maxWidth:960, margin:"0 auto" },
  header:     { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 },
  back:       { background:"none", border:"none", color:"#a29bfe", fontWeight:700, cursor:"pointer", fontSize:14 },
  rankBadge:  { display:"flex", gap:8, alignItems:"center", background:"#1a1a2e", padding:"6px 14px", borderRadius:20, border:"1px solid #2d2d44" },
  title:      { color:"#fff", fontSize:28, fontWeight:900, marginBottom:4 },
  sub:        { color:"#636e72", marginBottom:16, fontSize:14 },
  qjBanner:   { background:"linear-gradient(135deg,#1a1a2e,#2d1f6e)", border:"1px solid #6c63ff", borderRadius:12, padding:"14px 18px", display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16, flexWrap:"wrap", gap:10 },
  qjBtn:      { padding:"10px 20px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:8, fontWeight:800, cursor:"pointer", fontSize:14 },
  tabs:       { display:"flex", gap:8, marginBottom:16 },
  tab:        { padding:"8px 18px", border:"2px solid", borderRadius:8, fontWeight:600, cursor:"pointer", fontSize:13 },
  statsRow:   { display:"flex", gap:8, marginBottom:16 },
  twoCol:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 },
  panel:      { background:"#1a1a2e", borderRadius:14, padding:"18px 16px", border:"1px solid #2d2d44" },
  panelTitle: { color:"#fff", fontSize:15, fontWeight:800, marginBottom:14 },
  label:      { display:"block", fontSize:11, fontWeight:600, color:"#a29bfe", marginBottom:5, marginTop:10, textTransform:"uppercase", letterSpacing:"0.05em" },
  select:     { width:"100%", padding:"9px 10px", background:"#0f0f1a", border:"1px solid #2d2d44", borderRadius:8, fontSize:14, color:"#fff", marginBottom:4, boxSizing:"border-box" },
  modeCard:   { display:"flex", gap:10, alignItems:"center", border:"2px solid", borderRadius:10, padding:"9px 12px", cursor:"pointer" },
  toggleRow:  { display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12, marginBottom:4 },
  toggle:     { padding:"5px 14px", border:"none", borderRadius:20, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:12 },
  createBtn:  { width:"100%", padding:13, background:"linear-gradient(135deg,#6c63ff,#3f51b5)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:15, cursor:"pointer", marginTop:14 },
  joinBtn:    { width:"100%", padding:12, background:"#00b894", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer", marginTop:10 },
  pubRoom:    { display:"flex", alignItems:"center", gap:10, background:"#0f0f1a", borderRadius:10, padding:"10px 12px", border:"1px solid #2d2d44" },
  smJoinBtn:  { padding:"7px 14px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:12, flexShrink:0 },
  boardRow:   { display:"flex", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #2d2d44", color:"#fff" },
  error:      { color:"#e17055", fontSize:13, marginTop:8 },
};
