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
      <div style={s.container}>

        {/* HEADER */}
        <div style={s.header}>
          <button style={s.back} onClick={handleLeave}>← Leave</button>
          <div style={{ textAlign: "center", flex: 1 }}>
            <div style={{ color: "#fff", fontWeight: 800, fontSize: 17 }}>
              {MODE_LABELS[room.mode]} · {BATTLE_LABELS[room.battleType]}
            </div>
            <div style={{ color: "#636e72", fontSize: 12, marginTop: 2 }}>
              {room.subject || "Any subject"} · {room.questionCount}Q · {room.timePerQuestion}s each
            </div>
          </div>
          <div style={s.codeBox} onClick={copyCode}>
            <span style={{ fontSize: 10, color: "#a29bfe" }}>ROOM CODE</span>
            <span style={{ fontSize: 22, fontWeight: 900, letterSpacing: 4, color: "#fff" }}>{room.code}</span>
            <span style={{ fontSize: 10, color: copied ? "#00b894" : "#636e72" }}>{copied ? "Copied! ✓" : "Tap to copy"}</span>
          </div>
        </div>

        {/* FIX BUG 4: AUTO-START WARNING - MAKE SURE THIS IS RENDERED */}
        {autoStart !== null && (
          <div style={s.autoStartBanner}>
            ⚡ Room full! Auto-starting in {autoStart}s...
          </div>
        )}

        {/* COUNTDOWN OVERLAY */}
        {countdown !== null && (
          <div style={s.countdownOverlay}>
            <div style={s.countdownNum}>{countdown}</div>
            <div style={{ color: "#fff", fontSize: 20, marginTop: 8, fontWeight: 700 }}>Battle starts!</div>
          </div>
        )}

        {error && <div style={s.errorBanner}>{error}</div>}

        <div style={s.twoCol}>
          {/* LEFT: PLAYERS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* SQUAD VIEW for duo/clash_squad */}
            {isSquadMode(room.mode) ? (
              <div style={s.panel}>
                <div style={s.panelTitle}>
                  Players ({players.length}/{totalSlots})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[squad0, squad1].map((squad, si) => (
                    <div key={si} style={{ ...s.squadBox, borderColor: SQUAD_COLORS[si] }}>
                      <div style={{ color: SQUAD_COLORS[si], fontWeight: 700, fontSize: 12, marginBottom: 8 }}>
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
                      {Array.from({ length: Math.max(0, 2 - squad.length) }).map((_, i) => (
                        <div key={i} style={s.emptySlot}>
                          <span style={{ fontSize: 20 }}>❓</span>
                          <span style={{ color: "#636e72", fontSize: 12 }}>Waiting...</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <div style={s.shareRow}>
                  <a href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
                    target="_blank" rel="noreferrer" style={s.waBtn}>
                    📱 Invite on WhatsApp
                  </a>
                </div>
              </div>
            ) : (
              <div style={s.panel}>
                <div style={s.panelTitle}>Players ({players.length}/{totalSlots})</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
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
                      <span style={{ fontSize: 20 }}>❓</span>
                      <span style={{ color: "#636e72", fontSize: 12 }}>Waiting for player...</span>
                    </div>
                  ))}
                  {room.mode === "battle_royal" && players.length < totalSlots && (
                    <div style={{ fontSize: 12, color: "#636e72", textAlign: "center", padding: "4px 0" }}>
                      +{totalSlots - players.length} more slots open
                    </div>
                  )}
                </div>
                <a href={`https://wa.me/?text=${encodeURIComponent(inviteText)}`}
                  target="_blank" rel="noreferrer" style={s.waBtn}>
                  📱 Invite on WhatsApp
                </a>
              </div>
            )}

            {/* ACTIONS */}
            <div style={s.panel}>
              {!isReady ? (
                <button style={s.readyBtn} onClick={handleReady}>✓ I'm Ready!</button>
              ) : (
                <div style={s.readyMsg}>✅ You're ready! ({readyCount}/{players.length})</div>
              )}
              {isHost && isReady && (
                <>
                  <button
                    style={{ ...s.startBtn, opacity: canStart || canForce ? 1 : 0.5, marginTop: 10 }}
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
                      style={{ ...s.forceBtn, marginTop: 8 }}
                      onClick={() => {
                        if (window.confirm(`Force start? ${players.filter(p=>!p.ready).map(p=>p.name).join(", ")} is not ready yet.`))
                          handleStart(true);
                      }}>
                      ⚡ Force Start (ignore not-ready)
                    </button>
                  )}
                </>
              )}
              {!isHost && isReady && (
                <p style={{ fontSize: 13, color: "#636e72", textAlign: "center", marginTop: 8 }}>
                  Waiting for host to start...
                </p>
              )}
            </div>
          </div>

          {/* RIGHT: REACTIONS + CHAT */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            <div style={s.panel}>
              <div style={s.panelTitle}>Reactions</div>
              <div style={s.reactRow}>
                {["🔥","💪","😂","😱","🎯","👏","💯","⚡","🧠","😤"].map(e => (
                  <button key={e} style={s.reactBtn} onClick={() => sendReaction(e)}>{e}</button>
                ))}
              </div>
            </div>

            <div style={{ ...s.panel, flex: 1 }}>
              <div style={s.panelTitle}>Activity</div>
              <div style={s.chatList} id="chat-list">
                {chat.length === 0 && (
                  <p style={{ color: "#636e72", fontSize: 12, textAlign: "center", padding: 12 }}>Waiting for players...</p>
                )}
                {chat.map(c => (
                  <div key={c.id} style={s.chatMsg}>
                    <span style={{
                      color: c.type === "system" ? "#a29bfe" : c.type === "reaction" ? "#fdcb6e" : "#fff",
                      fontSize: 12
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
          </div>
        </div>{/* end twoCol */}

        {/* KICK CONFIRM MODAL */}
        {kickConfirm && (
          <div style={s.modalOverlay}>
            <div style={s.modal}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🚫</div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Remove Player?</div>
              <div style={{ color: "#a29bfe", fontSize: 13, marginBottom: 18 }}>
                Remove <strong style={{ color: "#fff" }}>{kickConfirm.name}</strong> from the room?
                They will not be able to rejoin.
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={s.kickCancelBtn} onClick={() => setKickConfirm(null)}>Cancel</button>
                <button style={s.kickConfirmBtn} onClick={() => handleKickPlayer(kickConfirm.id, kickConfirm.name)}>
                  Yes, Remove
                </button>
              </div>
            </div>
          </div>
        )}

      </div>{/* end container */}
    </div>
  );
}

function PlayerRow({ p, isSelf, isHost, canKick, onKick }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      background: isSelf ? "#6c63ff18" : "#0f0f1a",
      borderRadius: 10, padding: "9px 12px",
      border: isSelf ? "1px solid #6c63ff" : "1px solid #2d2d44",
    }}>
      <span style={{ fontSize: 22 }}>{p.avatar || "🎓"}</span>
      <div style={{ flex: 1 }}>
        <span style={{ color: "#fff", fontWeight: isSelf ? 700 : 500, fontSize: 13 }}>
          {p.name}
        </span>
        {isSelf  && <span style={{ fontSize: 10, background: "#6c63ff", color: "#fff", padding: "1px 6px", borderRadius: 6, marginLeft: 6 }}>You</span>}
        {isHost  && <span style={{ fontSize: 10, background: "#fdcb6e", color: "#000", padding: "1px 6px", borderRadius: 6, marginLeft: 4 }}>Host</span>}
      </div>
      <div style={{ fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 10, background: p.ready ? "#00b89422" : "#2d2d44", color: p.ready ? "#00b894" : "#636e72", border: `1px solid ${p.ready ? "#00b894" : "#2d2d44"}` }}>
        {p.ready ? "✓ Ready" : "Waiting"}
      </div>
      {canKick && (
        <button
          onClick={onKick}
          title="Remove player"
          style={{ background: "#e1705522", border: "1px solid #e17055", color: "#e17055", borderRadius: 6, padding: "3px 8px", cursor: "pointer", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
          ✕
        </button>
      )}
    </div>
  );
}

function Loader({ text, isError, onBack }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", gap: 16 }}>
      <div style={{ fontSize: 40 }}>{isError ? "❌" : "⏳"}</div>
      <p style={{ color: isError ? "#e17055" : "#636e72" }}>{text}</p>
      {onBack && <button style={{ background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer" }} onClick={onBack}>← Back to Arena</button>}
    </div>
  );
}

const s = {
  page:            { minHeight: "100vh", background: "#0f0f1a", fontFamily: "sans-serif", padding: 16 },
  container:       { maxWidth: 900, margin: "0 auto" },
  header:          { display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" },
  back:            { background: "none", border: "none", color: "#a29bfe", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  codeBox:         { background: "#1a1a2e", border: "2px solid #6c63ff", borderRadius: 12, padding: "8px 14px", textAlign: "center", cursor: "pointer", display: "flex", flexDirection: "column", gap: 2, minWidth: 130 },
  autoStartBanner: { background: "#fdcb6e22", border: "1px solid #fdcb6e", color: "#fdcb6e", textAlign: "center", padding: "10px", borderRadius: 8, marginBottom: 12, fontWeight: 700, fontSize: 14 },
  countdownOverlay:{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", zIndex: 1000 },
  countdownNum:    { fontSize: 130, fontWeight: 900, color: "#6c63ff", lineHeight: 1 },
  errorBanner:     { background: "#e1705522", border: "1px solid #e17055", color: "#e17055", padding: "10px 14px", borderRadius: 8, marginBottom: 12, fontSize: 13, textAlign: "center" },
  twoCol:          { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  panel:           { background: "#1a1a2e", borderRadius: 14, padding: "16px", border: "1px solid #2d2d44" },
  panelTitle:      { color: "#fff", fontSize: 14, fontWeight: 700, marginBottom: 12 },
  squadBox:        { background: "#0f0f1a", borderRadius: 10, padding: 10, border: "2px solid", display: "flex", flexDirection: "column", gap: 7 },
  emptySlot:       { display: "flex", alignItems: "center", gap: 8, background: "#0f0f1a", borderRadius: 10, padding: "9px 12px", border: "1px dashed #2d2d44", opacity: 0.5 },
  shareRow:        { marginTop: 12, borderTop: "1px solid #2d2d44", paddingTop: 12 },
  waBtn:           { display: "block", textAlign: "center", padding: "9px", background: "#25D366", color: "#fff", borderRadius: 8, fontWeight: 700, textDecoration: "none", fontSize: 13 },
  readyBtn:        { width: "100%", padding: 13, background: "#00b894", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer" },
  readyMsg:        { textAlign: "center", color: "#00b894", fontWeight: 700, fontSize: 14, padding: "10px 0" },
  startBtn:        { width: "100%", padding: 13, background: "linear-gradient(135deg,#6c63ff,#e17055)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer" },
  reactRow:        { display: "flex", flexWrap: "wrap", gap: 6 },
  reactBtn:        { fontSize: 22, background: "#0f0f1a", border: "1px solid #2d2d44", borderRadius: 8, padding: "6px 10px", cursor: "pointer" },
  chatList:        { display: "flex", flexDirection: "column", gap: 3, maxHeight: 180, overflowY: "auto", marginBottom: 10 },
  chatMsg:         { padding: "3px 0" },
  chatInputRow:    { display: "flex", gap: 8 },
  chatInput:       { flex: 1, background: "#0f0f1a", border: "1px solid #2d2d44", borderRadius: 8, padding: "8px 10px", color: "#fff", fontSize: 13 },
  chatSendBtn:     { padding: "8px 14px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 },
  forceBtn:        { width: "100%", padding: 10, background: "transparent", color: "#fdcb6e", border: "2px solid #fdcb6e44", borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: "pointer" },
  modalOverlay:    { position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000 },
  modal:           { background: "#1a1a2e", border: "1px solid #6c63ff", borderRadius: 16, padding: "28px 32px", textAlign: "center", maxWidth: 340, width: "90%" },
  kickCancelBtn:   { flex: 1, padding: "10px", background: "#2d2d44", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  kickConfirmBtn:  { flex: 1, padding: "10px", background: "#e17055", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 },
};