import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getArenaSocket } from "../../utils/arenaSocket";
import API from "../../utils/api";

// ── MODE GROUPS (shelf layout) ────────────────────────────
const MODE_GROUPS = [
  {
    label: "Solo Battles",
    icon: "🎯",
    color: "#6c63ff",
    modes: [
      { id: "lone_wolf", icon: "🐺", name: "Lone Wolf",  desc: "1v1 quick",        maxP: 2,  color: "#6c63ff" },
      { id: "duel",      icon: "⚔️",  name: "Duel",       desc: "Ranked 1v1",       maxP: 2,  color: "#e17055" },
      { id: "duo",       icon: "👥",  name: "Duo",        desc: "2v2 teams",        maxP: 4,  color: "#0984e3" },
    ],
  },
  {
    label: "Team Battle",
    icon: "🛡️",
    color: "#00b894",
    modes: [
      { id: "clash_squad", icon: "🛡️", name: "Clash Squad", desc: "2 teams · 4 each · 8 total", maxP: 8, color: "#00b894" },
    ],
  },
  {
    label: "Battle Royal",
    icon: "👑",
    color: "#fdcb6e",
    modes: [
      { id: "battle_royal", icon: "👑", name: "Battle Royal", desc: "Up to 50 players · free for all", maxP: 50, color: "#fdcb6e" },
    ],
  },
];

const ALL_MODES = MODE_GROUPS.flatMap(g => g.modes);

const BATTLE_TYPES = [
  { id: "speed_battle", icon: "⚡", name: "Speed Battle", desc: "First correct answer wins" },
  { id: "subject_war",  icon: "🧠", name: "Subject War",  desc: "Best total score wins"    },
  { id: "survival",     icon: "💀", name: "Survival",     desc: "3 lives — wrong = lose 1" },
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
  const [mode,          setMode]          = useState(null);
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
  const [expandedGroup, setExpandedGroup] = useState(null); // which shelf is open

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
  const selectedModeInfo = ALL_MODES.find(m => m.id === mode);

  const goWaiting = (config) =>
    nav("/arena/waiting", { state: { creating: true, config: { ...config, playerName, playerId, avatar: "🎓" } } });

  const handleCreate = () => {
    if (!mode) return setError("Select a game mode first.");
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

  const selectMode = (modeId, groupLabel) => {
    setMode(modeId);
    setError("");
    // If single-mode group (clash/royal), collapse shelf after selecting
    const group = MODE_GROUPS.find(g => g.label === groupLabel);
    if (group && group.modes.length === 1) setExpandedGroup(null);
  };

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* HEADER */}
        <div style={s.header}>
          <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
          {myStats && (
            <div style={s.rankBadge}>
              <span style={{ fontSize: 16 }}>{myRank.icon}</span>
              <span style={{ color: myRank.color, fontWeight: 800, fontSize: 13 }}>{myRank.name}</span>
              <span style={{ color: "#636e72", fontSize: 11 }}>{myStats.xp} XP</span>
            </div>
          )}
        </div>

        <h1 style={s.title}>🏟️ Scholars Arena</h1>

        {/* QUICK JOIN — compact */}
        <div style={s.qjRow}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 800, color: "#fff", fontSize: 13 }}>⚡ Quick Join</span>
            <span style={{ color: "#a29bfe", fontSize: 11, marginLeft: 8 }}>Jump into the most active open room</span>
          </div>
          <button style={s.qjBtn} onClick={handleQuickJoin} disabled={quickJoining}>
            {quickJoining ? "Finding..." : "Join Now →"}
          </button>
        </div>

        {/* LIVE MATCHES — compact horizontal scroll */}
        {publicRooms.length > 0 && (
          <div style={s.liveSection}>
            <div style={s.liveSectionTitle}>
              <span style={{ color: "#e17055", fontWeight: 700, fontSize: 12 }}>🔴 LIVE ROOMS</span>
              <span style={{ color: "#636e72", fontSize: 11 }}>{publicRooms.length} open</span>
            </div>
            <div style={s.liveScroll}>
              {publicRooms.map(r => {
                const mInfo = ALL_MODES.find(m => m.id === r.mode);
                return (
                  <div key={r.code} style={s.liveCard}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>{mInfo?.icon || "🎮"}</span>
                      <span style={{ fontFamily: "monospace", fontSize: 10, color: "#a29bfe", fontWeight: 800 }}>{r.code}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#fff", fontWeight: 700, marginBottom: 2 }}>{r.hostName}'s room</div>
                    <div style={{ fontSize: 10, color: "#636e72", marginBottom: 6 }}>{r.subject || "Mixed"}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {Array.from({ length: Math.min(r.maxPlayers, 8) }).map((_, i) => (
                          <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: i < r.playerCount ? (mInfo?.color || "#6c63ff") : "#2d2d44" }} />
                        ))}
                        {r.maxPlayers > 8 && <span style={{ fontSize: 9, color: "#636e72" }}>+</span>}
                      </div>
                      <button style={s.liveJoinBtn} onClick={() => handleJoinPublic(r.code)}>Join</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TABS */}
        <div style={s.tabs}>
          {[["play","⚔️ Play"],["leaderboard","🏆 Rankings"],["history","📋 History"]].map(([id,label]) => (
            <button key={id}
              style={{ ...s.tab, background: tab === id ? "#6c63ff" : "transparent", color: tab === id ? "#fff" : "#636e72", borderColor: tab === id ? "#6c63ff" : "#2d2d44" }}
              onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* MY STATS ROW */}
        {myStats && tab === "play" && (
          <div style={s.statsRow}>
            <MiniStat label="Matches"  value={myStats.total_matches} />
            <MiniStat label="Wins"     value={myStats.wins}          color="#00b894" />
            <MiniStat label="Win Rate" value={`${myStats.win_rate}%`} color="#fdcb6e" />
            <MiniStat label="XP"       value={myStats.xp}            color={myRank.color} />
          </div>
        )}

        {/* ── PLAY TAB ───────────────────────────────────── */}
        {tab === "play" && (
          <div style={s.playLayout}>

            {/* LEFT: MODE SHELVES + CONFIG */}
            <div style={s.leftCol}>

              <div style={s.sectionLabel}>Select Game Mode</div>

              {/* MODE SHELVES */}
              {MODE_GROUPS.map(group => (
                <div key={group.label} style={{ marginBottom: 8 }}>

                  {/* SHELF HEADER — always visible */}
                  <div
                    style={{
                      ...s.shelfHeader,
                      borderColor: expandedGroup === group.label || group.modes.some(m => m.id === mode) ? group.color : "#2d2d44",
                      background: group.modes.some(m => m.id === mode) ? group.color + "15" : "#1a1a2e",
                    }}
                    onClick={() => {
                      if (group.modes.length === 1) {
                        selectMode(group.modes[0].id, group.label);
                      } else {
                        setExpandedGroup(expandedGroup === group.label ? null : group.label);
                      }
                    }}
                  >
                    <span style={{ fontSize: 18 }}>{group.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: group.modes.some(m => m.id === mode) ? group.color : "#fff", fontWeight: 700, fontSize: 13 }}>
                        {group.label}
                      </div>
                      {group.modes.length === 1 ? (
                        <div style={{ fontSize: 11, color: "#636e72" }}>{group.modes[0].desc}</div>
                      ) : (
                        <div style={{ fontSize: 11, color: "#636e72" }}>
                          {group.modes.map(m => m.name).join(" · ")}
                        </div>
                      )}
                    </div>
                    {group.modes.some(m => m.id === mode) && (
                      <span style={{ fontSize: 11, color: group.color, fontWeight: 800, background: group.color + "22", padding: "2px 8px", borderRadius: 8 }}>
                        ✓ Selected
                      </span>
                    )}
                    {group.modes.length > 1 && (
                      <span style={{ color: "#636e72", fontSize: 12, marginLeft: 4 }}>
                        {expandedGroup === group.label ? "▲" : "▼"}
                      </span>
                    )}
                  </div>

                  {/* EXPANDED: sub-mode chips (only for multi-mode groups) */}
                  {group.modes.length > 1 && expandedGroup === group.label && (
                    <div style={s.subModes}>
                      {group.modes.map(m => (
                        <div key={m.id}
                          style={{
                            ...s.subModeChip,
                            borderColor: mode === m.id ? m.color : "#2d2d44",
                            background: mode === m.id ? m.color + "22" : "#0f0f1a",
                          }}
                          onClick={() => selectMode(m.id, group.label)}>
                          <span style={{ fontSize: 18 }}>{m.icon}</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 12, color: mode === m.id ? m.color : "#fff" }}>{m.name}</div>
                            <div style={{ fontSize: 10, color: "#636e72" }}>{m.desc} · {m.maxP}p</div>
                          </div>
                          {mode === m.id && <span style={{ marginLeft: "auto", color: m.color, fontSize: 12 }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* ROOM CONFIG — appears after mode selected */}
              {mode && (
                <div style={s.configPanel}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span style={{ fontSize: 20 }}>{selectedModeInfo?.icon}</span>
                    <div>
                      <div style={{ color: selectedModeInfo?.color, fontWeight: 800, fontSize: 14 }}>{selectedModeInfo?.name}</div>
                      <div style={{ fontSize: 11, color: "#636e72" }}>{selectedModeInfo?.desc}</div>
                    </div>
                  </div>

                  {/* BATTLE TYPE CHIPS */}
                  <div style={s.sectionLabel}>Battle Type</div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                    {BATTLE_TYPES.map(b => (
                      <div key={b.id}
                        style={{ ...s.btChip, borderColor: battleType === b.id ? "#e17055" : "#2d2d44", background: battleType === b.id ? "#e1705520" : "#0f0f1a", flex: 1 }}
                        onClick={() => setBattleType(b.id)}
                        title={b.desc}>
                        <div style={{ fontSize: 15 }}>{b.icon}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: battleType === b.id ? "#e17055" : "#aaa" }}>{b.name}</div>
                      </div>
                    ))}
                  </div>

                  {/* SUBJECT + DIFFICULTY in a row */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <div style={{ flex: 2 }}>
                      <div style={s.sectionLabel}>Subject</div>
                      <select style={s.select} value={subject} onChange={e => setSubject(e.target.value)}>
                        <option value="">Any (Mixed)</option>
                        {SUBJECTS.map(s2 => <option key={s2} value={s2}>{s2}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={s.sectionLabel}>Difficulty</div>
                      <select style={s.select} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                        <option value="mixed">Mixed</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* QUESTIONS + TIME in a row */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={s.sectionLabel}>Questions</div>
                      <select style={s.select} value={questionCount} onChange={e => setQuestionCount(e.target.value)}>
                        {[5,10,15,20,25,30].map(n => <option key={n} value={n}>{n} Qs</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={s.sectionLabel}>Secs/Q</div>
                      <select style={s.select} value={timePerQ} onChange={e => setTimePerQ(e.target.value)}>
                        {[10,15,20,30,45,60].map(n => <option key={n} value={n}>{n}s</option>)}
                      </select>
                    </div>
                  </div>

                  {/* PUBLIC TOGGLE */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ color: "#a29bfe", fontSize: 12 }}>Public room (discoverable)</span>
                    <button style={{ ...s.toggle, background: isPublic ? "#6c63ff" : "#2d2d44" }}
                      onClick={() => setIsPublic(p => !p)}>{isPublic ? "ON" : "OFF"}</button>
                  </div>

                  {error && <p style={s.error}>{error}</p>}

                  <button style={{ ...s.createBtn, background: `linear-gradient(135deg, ${selectedModeInfo?.color || "#6c63ff"}, #1a1a2e)` }}
                    onClick={handleCreate}>
                    Create {selectedModeInfo?.name} Room →
                  </button>
                </div>
              )}
            </div>

            {/* RIGHT: JOIN */}
            <div style={s.rightCol}>

              {/* JOIN BY CODE */}
              <div style={s.panel}>
                <div style={s.panelTitle}>🔑 Join by Code</div>
                <input
                  style={{ ...s.select, textAlign: "center", fontSize: 20, letterSpacing: 6, fontFamily: "monospace", textTransform: "uppercase", padding: "11px" }}
                  placeholder="ABC123" maxLength={6}
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === "Enter" && handleJoinCode()}
                />
                <button style={s.joinBtn} onClick={handleJoinCode}>Join Room →</button>
              </div>

              {/* SELECTED ROOM INFO (if user tapped a live room) */}
              {publicRooms.length === 0 && (
                <div style={{ ...s.panel, textAlign: "center", padding: "28px 16px" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🏟️</div>
                  <p style={{ color: "#636e72", fontSize: 13 }}>No open rooms yet.</p>
                  <p style={{ color: "#636e72", fontSize: 12, marginTop: 4 }}>Create one and others will see it!</p>
                </div>
              )}

              {/* OPEN ROOMS LIST (full, in right col) */}
              {publicRooms.length > 0 && (
                <div style={s.panel}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div style={s.panelTitle}>🌍 Open Rooms</div>
                    <span style={{ fontSize: 11, color: "#636e72" }}>{publicRooms.length} live</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {publicRooms.map(r => {
                      const mInfo = ALL_MODES.find(m => m.id === r.mode);
                      return (
                        <div key={r.code} style={s.pubRoom}>
                          <div style={{ flex: 1 }}>
                            <div style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>
                              {mInfo?.icon} {r.hostName}'s room
                            </div>
                            <div style={{ fontSize: 11, color: "#636e72", marginTop: 2 }}>
                              {r.subject || "Mixed"} · {r.battleType?.replace(/_/g," ")}
                            </div>
                            <div style={{ display: "flex", gap: 3, marginTop: 5, alignItems: "center" }}>
                              {Array.from({ length: Math.min(r.maxPlayers, 10) }).map((_,i) => (
                                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: i < r.playerCount ? (mInfo?.color || "#6c63ff") : "#2d2d44" }} />
                              ))}
                              {r.maxPlayers > 10 && <span style={{ fontSize: 9, color: "#636e72" }}>+more</span>}
                              <span style={{ fontSize: 11, color: "#636e72", marginLeft: 4 }}>{r.playerCount}/{r.maxPlayers}</span>
                            </div>
                          </div>
                          <button style={{ ...s.smJoinBtn, background: mInfo?.color || "#6c63ff" }} onClick={() => handleJoinPublic(r.code)}>Join →</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── LEADERBOARD TAB ──────────────────────────── */}
        {tab === "leaderboard" && (
          <div style={s.panel}>
            <div style={s.panelTitle}>🏆 Arena Rankings</div>
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

        {/* ── HISTORY TAB ──────────────────────────────── */}
        {tab === "history" && (
          <div style={s.panel}>
            <div style={s.panelTitle}>📋 My Battles</div>
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
    <div style={{ flex:1, background:"#1a1a2e", borderRadius:10, padding:"8px 6px", textAlign:"center", border:"1px solid #2d2d44" }}>
      <div style={{ fontSize:15, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:10, color:"#636e72", marginTop:2 }}>{label}</div>
    </div>
  );
}

const s = {
  page:         { minHeight:"100vh", background:"#0f0f1a", fontFamily:"sans-serif", padding:16 },
  container:    { maxWidth:960, margin:"0 auto" },
  header:       { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 },
  back:         { background:"none", border:"none", color:"#a29bfe", fontWeight:700, cursor:"pointer", fontSize:14 },
  rankBadge:    { display:"flex", gap:6, alignItems:"center", background:"#1a1a2e", padding:"5px 12px", borderRadius:20, border:"1px solid #2d2d44" },
  title:        { color:"#fff", fontSize:24, fontWeight:900, marginBottom:10 },

  // Quick join — thin bar
  qjRow:        { background:"linear-gradient(135deg,#1a1a2e,#2d1f6e)", border:"1px solid #6c63ff44", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:12, marginBottom:10, flexWrap:"wrap" },
  qjBtn:        { padding:"7px 16px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:8, fontWeight:800, cursor:"pointer", fontSize:13, flexShrink:0 },

  // Live rooms
  liveSection:  { marginBottom:12 },
  liveSectionTitle: { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 },
  liveScroll:   { display:"flex", gap:8, overflowX:"auto", paddingBottom:6 },
  liveCard:     { background:"#1a1a2e", border:"1px solid #2d2d44", borderRadius:10, padding:"10px 12px", minWidth:140, flexShrink:0 },
  liveJoinBtn:  { padding:"3px 10px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:6, fontWeight:700, cursor:"pointer", fontSize:11 },

  // Tabs
  tabs:         { display:"flex", gap:8, marginBottom:12 },
  tab:          { padding:"7px 16px", border:"2px solid", borderRadius:8, fontWeight:600, cursor:"pointer", fontSize:12 },
  statsRow:     { display:"flex", gap:6, marginBottom:14 },

  // Play layout
  playLayout:   { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, alignItems:"start" },
  leftCol:      { display:"flex", flexDirection:"column", gap:0 },
  rightCol:     { display:"flex", flexDirection:"column", gap:12 },

  // Shelf
  sectionLabel: { fontSize:10, fontWeight:700, color:"#636e72", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:6 },
  shelfHeader:  { display:"flex", alignItems:"center", gap:10, background:"#1a1a2e", border:"2px solid", borderRadius:10, padding:"11px 14px", cursor:"pointer", marginBottom:2 },
  subModes:     { background:"#0f0f1a", borderRadius:"0 0 10px 10px", border:"1px solid #2d2d44", borderTop:"none", padding:"8px 8px", display:"flex", flexDirection:"column", gap:6, marginBottom:6 },
  subModeChip:  { display:"flex", alignItems:"center", gap:10, border:"2px solid", borderRadius:8, padding:"8px 10px", cursor:"pointer" },

  // Config panel
  configPanel:  { background:"#1a1a2e", border:"1px solid #2d2d44", borderRadius:12, padding:"14px", marginTop:10 },
  btChip:       { display:"flex", flexDirection:"column", alignItems:"center", gap:3, border:"2px solid", borderRadius:8, padding:"8px 4px", cursor:"pointer", textAlign:"center" },

  // Selects
  select:       { width:"100%", padding:"8px 10px", background:"#0f0f1a", border:"1px solid #2d2d44", borderRadius:8, fontSize:13, color:"#fff", boxSizing:"border-box" },
  toggle:       { padding:"4px 12px", border:"none", borderRadius:20, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:12 },
  createBtn:    { width:"100%", padding:12, color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer" },

  // Panel / join
  panel:        { background:"#1a1a2e", borderRadius:14, padding:"16px", border:"1px solid #2d2d44" },
  panelTitle:   { color:"#fff", fontSize:14, fontWeight:800, marginBottom:12 },
  joinBtn:      { width:"100%", padding:11, background:"#00b894", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer", marginTop:8 },
  pubRoom:      { display:"flex", alignItems:"center", gap:10, background:"#0f0f1a", borderRadius:10, padding:"10px 12px", border:"1px solid #2d2d44" },
  smJoinBtn:    { padding:"6px 12px", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:12, flexShrink:0 },

  // Board
  boardRow:     { display:"flex", alignItems:"center", padding:"10px 0", borderBottom:"1px solid #2d2d44", color:"#fff" },
  error:        { color:"#e17055", fontSize:12, marginTop:6 },
};
