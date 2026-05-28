import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getArenaSocket, disconnectArena } from "../../utils/arenaSocket";

const MODE_LABELS = {
  lone_wolf:    "🐺 Lone Wolf",
  duel:         "⚔️ Duel",
  duo:          "👥 Duo",
  clash_squad:  "🛡️ Clash Squad",
  battle_royal: "👑 Battle Royal",
};

const BATTLE_LABELS = {
  speed_battle: "⚡ Speed Battle",
  subject_war:  "🧠 Subject War",
  survival:     "💀 Survival",
};

const SQUAD_COLORS = ["#6c63ff", "#e17055"];
const SQUAD_LABELS = ["Squad A 🔵", "Squad B 🔴"];

export default function WaitingRoom() {
  const nav      = useNavigate();
  const { state } = useLocation();
  const socket   = useRef(null);
  const roomRef  = useRef(null);  // FIX BUG 1: Stale closure

  const [room,       setRoom]       = useState(null);
  const [players,    setPlayers]    = useState([]);
  const [readyCount, setReadyCount] = useState(0);
  const [isReady,    setIsReady]    = useState(false);
  const [countdown,  setCountdown]  = useState(null);
  const [error,      setError]      = useState("");
  const [copied,     setCopied]     = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [chat,       setChat]       = useState([]);
  const [chatInput,  setChatInput]  = useState("");
  const [autoStart,  setAutoStart]  = useState(null);
  const [kickConfirm, setKickConfirm] = useState(null); // playerId being confirmed

  const isHost     = state?.creating;
  const playerId   = state?.config?.playerId   || state?.playerId;
  const playerName = state?.config?.playerName || state?.playerName;

  const isSquadMode = (m) => m === "duo" || m === "clash_squad";

  // Helper to update room state and ref together
  const updateRoom = (newRoom) => {
    setRoom(newRoom);
    roomRef.current = newRoom;
  };

  // Helper to auto-scroll chat
  const scrollChatToBottom = () => {
    setTimeout(() => {
      const chatElement = document.getElementById("chat-list");
      if (chatElement) chatElement.scrollTop = chatElement.scrollHeight;
    }, 50);
  };

  useEffect(() => {
    socket.current = getArenaSocket();
    const sock = socket.current;

    // Check if socket is connected
    if (!sock.connected) {
      sock.connect();
    }

    if (state?.creating) {
      sock.emit("create_room", { ...state.config, playerId, playerName }, (res) => {
        setLoading(false);
        if (!res.success) { setError(res.error); return; }
        updateRoom(res.room);
        setPlayers(res.room.players || []);
        setReadyCount(res.room.players?.filter(p => p.ready).length || 0);
        setIsReady(true); // host is auto-ready
        addChat("system", "Room created! Share the code to invite players.");
      });
    } else {
      sock.emit("join_room", { code: state?.code, playerId, playerName, avatar: "🎓" }, (res) => {
        setLoading(false);
        if (!res.success) { setError(res.error); return; }
        updateRoom(res.room);
        setPlayers(res.room.players || []);
        setReadyCount(res.room.players?.filter(p => p.ready).length || 0);
        if (res.reconnected) addChat("system", "You reconnected to the room.");
        if (res.spectator)   addChat("system", "Match is live — you are spectating.");
      });
    }

    // Socket event handlers
    sock.on("player_joined", ({ player, playerCount, room: r }) => {
      updateRoom(r);
      setPlayers(r.players || []);
      addChat("system", `${player.name} joined the room 👋`);
      scrollChatToBottom();
    });

    sock.on("player_left", ({ playerName: n }) => {
      addChat("system", `${n} left.`);
      scrollChatToBottom();
    });
    
    sock.on("player_disconnected", ({ name }) => {
      addChat("system", `${name} disconnected (may reconnect)...`);
      scrollChatToBottom();
    });
    
    sock.on("player_reconnected", ({ name }) => {
      addChat("system", `${name} reconnected! ⚡`);
      scrollChatToBottom();
    });

    sock.on("ready_update", ({ playerId: pid, readyCount: rc, totalCount, allReady }) => {
      setReadyCount(rc);
      setPlayers(prev => prev.map(p => p.id === pid ? { ...p, ready: true } : p));
      if (allReady && isHost) {
        addChat("system", "All players ready! Starting game...");
      }
    });

    sock.on("room_full_autostart", ({ seconds }) => {
      setAutoStart(seconds);
      addChat("system", `Room is full! Auto-starting in ${seconds}s...`);
      scrollChatToBottom();
    });

    sock.on("countdown_start", ({ seconds }) => {
      setCountdown(seconds);
      addChat("system", `Match starting in ${seconds} seconds! Get ready!`);
    });
    
    sock.on("countdown_tick", ({ seconds }) => setCountdown(seconds));

    // FIX BUG 1: Use roomRef.current instead of stale room closure
    sock.on("new_question", (data) => {
      nav("/arena/match", { 
        state: { 
          room: roomRef.current, 
          firstQuestion: data, 
          playerId, 
          playerName, 
          isHost 
        } 
      });
    });

    sock.on("room_closed", ({ reason }) => {
      setError(reason || "Room was closed.");
      addChat("system", `Room closed: ${reason || "Host ended the session"}`);
      setTimeout(() => nav("/arena"), 3000);
    });

    sock.on("player_kicked", ({ playerId: pid, playerName: pname, players: updated }) => {
      setPlayers(updated);
      setReadyCount(updated.filter(p => p.ready).length);
      addChat("system", `🚫 ${pname} was removed from the room.`);
      scrollChatToBottom();
    });

    sock.on("kicked", ({ reason }) => {
      setError(reason || "You were removed from the room.");
      setTimeout(() => nav("/arena"), 2500);
    });

    sock.on("player_reaction", ({ playerName: n, emoji }) => {
      addChat("reaction", `${n}: ${emoji}`);
      scrollChatToBottom();
    });
    
    sock.on("chat_msg", ({ playerName: n, msg }) => {
      addChat("chat", `${n}: ${msg}`);
      scrollChatToBottom();
    });

    // Cleanup
    return () => {
      ["player_joined","player_left","player_disconnected","player_reconnected",
       "ready_update","room_full_autostart","countdown_start","countdown_tick",
       "new_question","room_closed","player_reaction","chat_msg",
       "player_kicked","kicked"]
        .forEach(ev => sock.off(ev));
    };
  }, []);

  const addChat = (type, msg) =>
    setChat(prev => [...prev.slice(-50), { type, msg, id: Date.now() + Math.random() }]);

  const handleReady = () => {
    if (!isReady) {
      socket.current?.emit("player_ready");
      setIsReady(true);
      addChat("system", "You are ready to battle!");
    }
  };
  
  const handleStart = (force = false) => {
    if (players.length < 2) {
      setError("Need at least 2 players to start.");
      setTimeout(() => setError(""), 3000);
      return;
    }
    if (!force && !players.every(p => p.ready)) {
      const notReady = players.filter(p => !p.ready).map(p => p.name);
      setError(`${notReady.length} player(s) not ready: ${notReady.join(", ")}. Force start or wait.`);
      setTimeout(() => setError(""), 4000);
      return;
    }
    socket.current?.emit("start_game", {}, (res) => { 
      if (!res?.success) setError(res?.error || "Cannot start."); 
    });
  };

  const handleKickPlayer = (targetPlayerId, targetName) => {
    setKickConfirm(null);
    socket.current?.emit("kick_player", { playerId: targetPlayerId }, (res) => {
      if (!res?.success) {
        setError(res?.error || "Cannot remove player.");
        setTimeout(() => setError(""), 3000);
      }
    });
  };
  
  const handleLeave = () => { 
    disconnectArena(); 
    nav("/arena"); 
  };
  
  const copyCode = () => { 
    navigator.clipboard.writeText(room?.code || ""); 
    setCopied(true); 
    setTimeout(() => setCopied(false), 2000); 
  };
  
  const sendReaction = (emoji) => socket.current?.emit("reaction", { emoji });
  
  const sendChat = () => {
    if (!chatInput.trim()) return;
    socket.current?.emit("chat", { msg: chatInput.trim() });
    setChatInput("");
  };

  if (loading) return <Loader text="Connecting to arena..." />;
  if (error && !room) return <Loader text={error} isError onBack={() => nav("/arena")} />;
  if (!room)   return <Loader text="Loading room..." />;

  const totalSlots = room.maxPlayers || 4;
  const hasEnough  = players.length >= 2;
  const allReady   = players.every(p => p.ready);
  const canStart   = isHost && hasEnough && allReady;
  const canForce   = isHost && hasEnough && !allReady;

  // Group players by squad for squad modes
  const squad0 = isSquadMode(room.mode) ? players.filter(p => p.squad === 0) : [];
  const squad1 = isSquadMode(room.mode) ? players.filter(p => p.squad === 1) : [];

  // Generate invite text for WhatsApp
  const inviteText = `Join my Scholars Arena battle! 🏟️\nRoom Code: ${room.code}\nMode: ${MODE_LABELS[room.mode]}\nBattle: ${BATTLE_LABELS[room.battleType]}\n\n${window.location.origin}/arena`;

  return (
    <div style={s.page}>

      {/* COUNTDOWN OVERLAY */}
      {countdown !== null && (
        <div style={s.countdownOverlay}>
          <div style={s.countdownRing}>
            <div style={s.countdownNum}>{countdown}</div>
          </div>
          <div style={{ color:"#fff", fontSize:18, marginTop:20, fontWeight:800, letterSpacing:2, opacity:0.8 }}>BATTLE STARTS!</div>
        </div>
      )}

      {/* KICK CONFIRM MODAL */}
      {kickConfirm && (
        <div style={s.modalOverlay}>
          <div style={s.modal}>
            <div style={{ fontSize:32, marginBottom:10 }}>🚫</div>
            <div style={{ color:"#fff", fontWeight:900, fontSize:17, marginBottom:6 }}>Remove Player?</div>
            <div style={{ color:"rgba(255,255,255,0.55)", fontSize:13, marginBottom:20, lineHeight:1.6 }}>
              Remove <strong style={{ color:"#a29bfe" }}>{kickConfirm.name}</strong> from the room? They won't be able to rejoin.
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button style={s.kickCancelBtn} onClick={() => setKickConfirm(null)}>Cancel</button>
              <button style={s.kickConfirmBtn} onClick={() => handleKickPlayer(kickConfirm.id, kickConfirm.name)}>Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={s.header}>
        <button style={s.back} onClick={handleLeave}>← Leave</button>
        <div style={{ flex:1, textAlign:"center" }}>
          <div style={{ color:"#fff", fontWeight:900, fontSize:15, lineHeight:1.3 }}>
            {MODE_LABELS[room.mode]}
          </div>
          <div style={{ color:"rgba(255,255,255,0.45)", fontSize:11, marginTop:2 }}>
            {BATTLE_LABELS[room.battleType]} · {room.subject || "Any subject"} · {room.questionCount}Q
          </div>
        </div>
        <div style={{ width:36 }} /> {/* spacer to center title */}
      </div>

      {/* ROOM CODE CARD */}
      <div style={s.codeCard} onClick={copyCode}>
        <div style={{ fontSize:11, fontWeight:700, color:"#a29bfe", letterSpacing:2, marginBottom:4 }}>ROOM CODE</div>
        <div style={s.codeDigits}>{(room.code || "").split("").map((ch, i) => (
          <span key={i} style={s.codeChar}>{ch}</span>
        ))}</div>
        <div style={{ fontSize:12, color: copied ? "#00b894" : "rgba(255,255,255,0.35)", marginTop:6, fontWeight:600 }}>
          {copied ? "✓ Copied to clipboard!" : "Tap to copy code"}
        </div>
      </div>

      {/* ALERTS */}
      {autoStart !== null && (
        <div style={s.autoStartBanner}>
          ⚡ Room full — auto-starting in {autoStart}s...
        </div>
      )}
      {error && (
        <div style={s.errorBanner}>{error}</div>
      )}

      {/* PLAYERS */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>Players</span>
          <span style={s.playerCount}>{players.length}/{totalSlots}</span>
        </div>

        {isSquadMode(room.mode) ? (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {[squad0, squad1].map((squad, si) => (
              <div key={si} style={{ ...s.squadBox, borderColor: SQUAD_COLORS[si] + "88" }}>
                <div style={{ color:SQUAD_COLORS[si], fontWeight:800, fontSize:11, marginBottom:8, letterSpacing:1 }}>
                  {SQUAD_LABELS[si]}
                </div>
                {squad.map(p => (
                  <PlayerRow key={p.id} p={p}
                    isSelf={p.id === playerId}
                    isHost={p.id === room.host?.id}
                    canKick={isHost && p.id !== playerId}
                    onKick={() => setKickConfirm(p)}
                  />
                ))}
                {Array.from({ length: Math.max(0, (room.mode === "clash_squad" ? 4 : 2) - squad.length) }).map((_, i) => (
                  <div key={i} style={s.emptySlot}>
                    <span style={{ fontSize:16 }}>❓</span>
                    <span style={{ color:"rgba(255,255,255,0.25)", fontSize:11 }}>Empty</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {players.map(p => (
              <PlayerRow key={p.id} p={p}
                isSelf={p.id === playerId}
                isHost={p.id === room.host?.id}
                canKick={isHost && p.id !== playerId}
                onKick={() => setKickConfirm(p)}
              />
            ))}
            {Array.from({ length: Math.max(0, Math.min(totalSlots, 6) - players.length) }).map((_, i) => (
              <div key={i} style={s.emptySlot}>
                <span style={{ fontSize:18 }}>❓</span>
                <span style={{ color:"rgba(255,255,255,0.25)", fontSize:12 }}>Waiting for player...</span>
              </div>
            ))}
            {room.mode === "battle_royal" && players.length < totalSlots && (
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", textAlign:"center", padding:"4px 0" }}>
                +{totalSlots - players.length} more slots open
              </div>
            )}
          </div>
        )}
      </div>

      {/* INVITE */}
      <a
        href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
        target="_blank" rel="noreferrer"
        style={s.waBtn}>
        📱 Invite Friends on WhatsApp
      </a>

      {/* READY / START ACTIONS */}
      <div style={s.section}>
        {!isReady ? (
          <button style={s.readyBtn} onClick={handleReady}>
            ✓ I'm Ready to Battle!
          </button>
        ) : (
          <div style={s.readyMsg}>
            <span style={{ fontSize:20 }}>✅</span>
            <span>You're ready! ({readyCount}/{players.length} ready)</span>
          </div>
        )}

        {isHost && isReady && (
          <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:8 }}>
            <button
              style={{ ...s.startBtn, opacity: (canStart || canForce) ? 1 : 0.45 }}
              onClick={() => handleStart(false)}
              disabled={!canStart && !canForce}>
              {players.length < 2
                ? "⏳ Waiting for another player..."
                : allReady
                ? "🚀 Start Battle!"
                : `⏳ ${readyCount}/${players.length} ready...`}
            </button>
            {canForce && (
              <button
                style={s.forceBtn}
                onClick={() => {
                  if (window.confirm(`Force start? ${players.filter(p=>!p.ready).map(p=>p.name).join(", ")} not ready yet.`))
                    handleStart(true);
                }}>
                ⚡ Force Start
              </button>
            )}
          </div>
        )}

        {!isHost && isReady && (
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.4)", textAlign:"center", marginTop:10 }}>
            Waiting for host to start the battle...
          </p>
        )}
      </div>

      {/* REACTIONS */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Reactions</div>
        <div style={s.reactRow}>
          {["🔥","💪","😂","😱","🎯","👏","💯","⚡","🧠","😤"].map(e => (
            <button key={e} style={s.reactBtn} onClick={() => sendReaction(e)}>{e}</button>
          ))}
        </div>
      </div>

      {/* ACTIVITY / CHAT */}
      <div style={s.section}>
        <div style={s.sectionTitle}>Activity</div>
        <div style={s.chatList} id="chat-list">
          {chat.length === 0 && (
            <p style={{ color:"rgba(255,255,255,0.25)", fontSize:12, textAlign:"center", padding:12 }}>
              Waiting for players...
            </p>
          )}
          {chat.map(c => (
            <div key={c.id} style={s.chatMsg}>
              <span style={{
                color: c.type === "system" ? "#a29bfe" : c.type === "reaction" ? "#fdcb6e" : "#fff",
                fontSize:13
              }}>
                {c.type === "system" ? `• ${c.msg}` : c.msg}
              </span>
            </div>
          ))}
        </div>
        <div style={s.chatInputRow}>
          <input
            style={s.chatInput}
            placeholder="Say something..."
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendChat()}
            maxLength={80}
          />
          <button style={s.chatSendBtn} onClick={sendChat}>Send</button>
        </div>
      </div>

      <div style={{ height:32 }} />
    </div>
  );
}

function PlayerRow({ p, isSelf, isHost, canKick, onKick }) {
  return (
    <div style={{
      display:"flex", alignItems:"center", gap:10,
      background: isSelf ? "rgba(108,99,255,0.15)" : "rgba(255,255,255,0.04)",
      borderRadius:14, padding:"11px 13px",
      border:`1.5px solid ${isSelf ? "#6c63ff66" : "rgba(255,255,255,0.07)"}`,
    }}>
      <div style={{ width:38, height:38, borderRadius:12, background:"rgba(255,255,255,0.07)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
        {p.avatar || "🎓"}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
          <span style={{ color:"#fff", fontWeight:700, fontSize:14, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {p.name}
          </span>
          {isSelf && <span style={{ fontSize:10, background:"#6c63ff", color:"#fff", padding:"2px 7px", borderRadius:6, flexShrink:0 }}>You</span>}
          {isHost && <span style={{ fontSize:10, background:"#fdcb6e", color:"#000", padding:"2px 7px", borderRadius:6, flexShrink:0 }}>Host</span>}
        </div>
      </div>
      <div style={{ fontSize:12, fontWeight:700, padding:"5px 10px", borderRadius:20, flexShrink:0,
        background: p.ready ? "rgba(0,184,148,0.15)" : "rgba(255,255,255,0.06)",
        color:       p.ready ? "#00b894" : "rgba(255,255,255,0.35)",
        border:`1px solid ${p.ready ? "#00b89444" : "rgba(255,255,255,0.08)"}`,
      }}>
        {p.ready ? "✓ Ready" : "Waiting"}
      </div>
      {canKick && (
        <button onClick={onKick}
          style={{ background:"rgba(225,112,85,0.15)", border:"1px solid #e1705566", color:"#e17055", borderRadius:8, padding:"5px 9px", cursor:"pointer", fontSize:13, fontWeight:700, flexShrink:0 }}>
          ✕
        </button>
      )}
    </div>
  );
}

function Loader({ text, isError, onBack }) {
  return (
    <div style={{ minHeight:"100vh", background:"#080812", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"'Plus Jakarta Sans',sans-serif", gap:16, padding:20 }}>
      <div style={{ fontSize:48 }}>{isError ? "❌" : "⏳"}</div>
      <p style={{ color: isError ? "#e17055" : "rgba(255,255,255,0.45)", textAlign:"center", fontSize:14 }}>{text}</p>
      {onBack && (
        <button style={{ background:"#6c63ff", color:"#fff", border:"none", borderRadius:12, padding:"12px 24px", cursor:"pointer", fontWeight:800, fontSize:14 }} onClick={onBack}>
          ← Back to Arena
        </button>
      )}
    </div>
  );
}

const s = {
  page:             { minHeight:"100vh", background:"#080812", fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"0 0 20px", maxWidth:520, margin:"0 auto" },

  // Header
  header:           { display:"flex", alignItems:"center", gap:10, padding:"16px 16px 12px", position:"sticky", top:0, background:"rgba(8,8,18,0.95)", backdropFilter:"blur(12px)", zIndex:50, borderBottom:"1px solid rgba(255,255,255,0.06)" },
  back:             { background:"none", border:"none", color:"#a29bfe", fontWeight:700, cursor:"pointer", fontSize:14, padding:"6px 8px", flexShrink:0 },

  // Room code
  codeCard:         { margin:"16px 16px 0", background:"linear-gradient(135deg,#1a1440,#0f0e1a)", border:"2px solid #6c63ff55", borderRadius:20, padding:"18px 16px", textAlign:"center", cursor:"pointer", boxShadow:"0 8px 32px rgba(108,99,255,0.2)" },
  codeDigits:       { display:"flex", gap:8, justifyContent:"center", alignItems:"center" },
  codeChar:         { width:38, height:48, background:"rgba(108,99,255,0.15)", border:"1.5px solid #6c63ff44", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:900, color:"#fff", letterSpacing:0 },

  // Alerts
  autoStartBanner:  { margin:"12px 16px 0", background:"rgba(253,203,110,0.12)", border:"1.5px solid #fdcb6e55", color:"#fdcb6e", padding:"12px 16px", borderRadius:14, fontWeight:700, fontSize:13, textAlign:"center" },
  errorBanner:      { margin:"12px 16px 0", background:"rgba(225,112,85,0.12)", border:"1.5px solid #e1705555", color:"#e17055", padding:"12px 16px", borderRadius:14, fontSize:13, textAlign:"center" },

  // Sections
  section:          { margin:"14px 16px 0", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:20, padding:"16px 14px" },
  sectionHeader:    { display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 },
  sectionTitle:     { color:"#fff", fontWeight:800, fontSize:14 },
  playerCount:      { background:"rgba(108,99,255,0.2)", color:"#a29bfe", fontWeight:800, fontSize:12, padding:"3px 10px", borderRadius:20, border:"1px solid #6c63ff44" },

  // Squad
  squadBox:         { background:"rgba(255,255,255,0.03)", borderRadius:14, padding:10, border:"2px solid", display:"flex", flexDirection:"column", gap:7 },

  // Empty slot
  emptySlot:        { display:"flex", alignItems:"center", gap:10, background:"rgba(255,255,255,0.02)", borderRadius:14, padding:"11px 13px", border:"1.5px dashed rgba(255,255,255,0.08)" },

  // WhatsApp invite
  waBtn:            { display:"block", margin:"12px 16px 0", padding:"13px 16px", background:"linear-gradient(135deg,#25D366,#128C7E)", color:"#fff", borderRadius:16, fontWeight:800, fontSize:14, textAlign:"center", textDecoration:"none", boxShadow:"0 4px 16px rgba(37,211,102,0.25)" },

  // Actions
  readyBtn:         { width:"100%", padding:"15px 0", background:"linear-gradient(135deg,#00b894,#00cec9)", color:"#fff", border:"none", borderRadius:14, fontWeight:900, fontSize:16, cursor:"pointer", boxShadow:"0 4px 20px rgba(0,184,148,0.35)" },
  readyMsg:         { display:"flex", alignItems:"center", justifyContent:"center", gap:8, color:"#00b894", fontWeight:800, fontSize:14, padding:"12px 0" },
  startBtn:         { width:"100%", padding:"15px 0", background:"linear-gradient(135deg,#6c63ff,#e17055)", color:"#fff", border:"none", borderRadius:14, fontWeight:900, fontSize:16, cursor:"pointer", boxShadow:"0 4px 20px rgba(108,99,255,0.35)" },
  forceBtn:         { width:"100%", padding:"12px 0", background:"transparent", color:"#fdcb6e", border:"2px solid rgba(253,203,110,0.3)", borderRadius:14, fontWeight:800, fontSize:14, cursor:"pointer" },

  // Reactions
  reactRow:         { display:"flex", flexWrap:"wrap", gap:8, marginTop:10 },
  reactBtn:         { fontSize:24, background:"rgba(255,255,255,0.05)", border:"1.5px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"8px 10px", cursor:"pointer", lineHeight:1, minWidth:44, textAlign:"center" },

  // Chat
  chatList:         { display:"flex", flexDirection:"column", gap:4, maxHeight:160, overflowY:"auto", marginBottom:10, marginTop:10 },
  chatMsg:          { padding:"2px 0" },
  chatInputRow:     { display:"flex", gap:8 },
  chatInput:        { flex:1, background:"rgba(255,255,255,0.06)", border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"11px 12px", color:"#fff", fontSize:14, outline:"none" },
  chatSendBtn:      { padding:"11px 16px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:12, fontWeight:800, cursor:"pointer", fontSize:14, flexShrink:0 },

  // Countdown
  countdownOverlay: { position:"fixed", inset:0, background:"rgba(8,8,18,0.96)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", zIndex:1000, backdropFilter:"blur(8px)" },
  countdownRing:    { width:160, height:160, borderRadius:"50%", border:"4px solid #6c63ff", background:"rgba(108,99,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 0 60px rgba(108,99,255,0.5)" },
  countdownNum:     { fontSize:80, fontWeight:900, color:"#fff", lineHeight:1 },

  // Modal
  modalOverlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:20 },
  modal:            { background:"#12112a", border:"1.5px solid #6c63ff55", borderRadius:20, padding:"28px 24px", textAlign:"center", width:"100%", maxWidth:340 },
  kickCancelBtn:    { flex:1, padding:"12px 0", background:"rgba(255,255,255,0.07)", color:"#fff", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, fontWeight:700, cursor:"pointer", fontSize:14 },
  kickConfirmBtn:   { flex:1, padding:"12px 0", background:"#e17055", color:"#fff", border:"none", borderRadius:12, fontWeight:800, cursor:"pointer", fontSize:14 },
};