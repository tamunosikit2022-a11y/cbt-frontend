import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getClassroomSocket, disconnectClassroom } from "../../utils/classroomSocket";

const COLORS = ["#000000","#ffffff","#e17055","#6c63ff","#00b894","#0984e3","#fdcb6e","#fd79a8","#2d3436","#636e72"];
const SIZES  = [2, 4, 8, 14, 20];

export default function ClassroomSession() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { student } = useAuth();

  const role    = params.get("role")    || "student";
  const code    = params.get("code")    || "";
  const title   = params.get("title")   || "Scholar Session";
  const subject = params.get("subject") || "General";

  // State
  const [sessionCode,   setSessionCode]   = useState(code);
  const [session,       setSession]       = useState(null);
  const [participants,  setParticipants]  = useState([]);
  const [chat,          setChat]          = useState([]);
  const [chatInput,     setChatInput]     = useState("");
  const [connected,     setConnected]     = useState(false);
  const [error,         setError]         = useState("");
  const [tool,          setTool]          = useState("pen"); // pen | eraser | text
  const [color,         setColor]         = useState("#000000");
  const [size,          setSize]          = useState(4);
  const [panel,         setPanel]         = useState("board"); // board | chat | participants | voice
  const [canDraw,       setCanDraw]       = useState(role === "teacher");
  const [voiceActive,   setVoiceActive]   = useState(false);
  const [muted,         setMuted]         = useState(false);
  const [unreadChat,    setUnreadChat]    = useState(0);
  const [sharedQuestion,setSharedQuestion]= useState(null);
  const [sessionEnded,  setSessionEnded]  = useState(false);

  // Refs
  const canvasRef  = useRef(null);
  const socketRef  = useRef(null);
  const drawing    = useRef(false);
  const lastPt     = useRef(null);
  const ctxRef     = useRef(null);
  const chatEndRef = useRef(null);
  const localStream= useRef(null);
  const peers      = useRef({}); // socketId → RTCPeerConnection
  const audioEls   = useRef({}); // socketId → <audio>

  // ── INIT CANVAS ───────────────────────────────────────
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Use explicit pixel size — fallback to 600x450 if offsetWidth is 0
    const w = canvas.offsetWidth  || canvas.parentElement?.offsetWidth  || 600;
    const h = canvas.offsetHeight || canvas.parentElement?.offsetHeight || 450;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width  = w;
      canvas.height = h;
    }
    const ctx = canvas.getContext("2d");
    ctx.lineCap   = "round";
    ctx.lineJoin  = "round";
    ctx.lineWidth = 3;
    ctxRef.current = ctx;
  };

  useEffect(() => {
    // Try immediately, then retry after render completes
    initCanvas();
    const t1 = setTimeout(initCanvas, 100);
    const t2 = setTimeout(initCanvas, 500);

    const onResize = () => {
      const canvas = canvasRef.current;
      const ctx    = ctxRef.current;
      if (!canvas || !ctx) return;
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const w = canvas.offsetWidth  || 600;
      const h = canvas.offsetHeight || 450;
      canvas.width  = w;
      canvas.height = h;
      ctx.putImageData(img, 0, 0);
      ctx.lineCap  = "round";
      ctx.lineJoin = "round";
    };
    window.addEventListener("resize", onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener("resize", onResize);
    };
  }, [student]);

  // ── CONNECT SOCKET — wait for student to load ──────────
  useEffect(() => {
    // Read student directly from localStorage as fallback (immediate, no async)
    let studentData = null;
    try {
      studentData = JSON.parse(localStorage.getItem("student") || "null");
    } catch {}
    const resolvedStudent = student || studentData;

    // Don't connect until we have student info
    if (!resolvedStudent?.id) return;

    const sock = getClassroomSocket();
    socketRef.current = sock;

    sock.on("connect_error", (e) => {
      console.error("🔴 Classroom connect error:", e.message);
      setError(`Connection failed: ${e.message}. Retrying...`);
    });

    sock.on("connect", () => {
      setError(null); // clear any previous error
      setConnected(true);
      if (role === "teacher") {
        sock.emit("classroom_create", {
          teacherId:   resolvedStudent?.id,
          teacherName: resolvedStudent?.full_name || "Teacher",
          title, subject,
        }, res => {
          if (res.success) {
            setSessionCode(res.code);
            setSession(res.session);
            setParticipants(res.session.participants || []);
          } else setError(res.error);
        });
      } else {
        sock.emit("classroom_join", {
          code,
          studentId:   resolvedStudent?.id,
          studentName: resolvedStudent?.full_name || "Student",
        }, res => {
          if (res.success) {
            setSession(res.session);
            setParticipants(res.session.participants || []);
            setChat(res.chat || []);
            // Replay board
            if (res.board?.length) replayBoard(res.board);
          } else setError(res.error);
        });
      }
    });

    // Board events
    sock.on("classroom_draw",    d => drawRemoteStroke(d));
    sock.on("add_text",       d => drawRemoteText(d));
    sock.on("classroom_clear_board",    () => clearCanvas());
    sock.on("classroom_undo",    () => {}); // handled by replay

    // Chat
    sock.on("classroom_chat_message", msg => {
      setChat(prev => [...prev, msg]);
      setUnreadChat(prev => panel !== "classroom_chat" ? prev + 1 : 0);
    });

    // Participants
    sock.on("classroom_participant_joined", d => setParticipants(d.participants || []));
    sock.on("classroom_participant_left",   d => setParticipants(d.participants || []));

    // Session control
    sock.on("classroom_ended", d => { setSessionEnded(true); setError(d.message); });
    sock.on("teacher_left",  d => setError(d.message));
    sock.on("kicked",        d => { setSessionEnded(true); setError(d.message); });
    sock.on("draw_permission", d => {
      if (String(d.studentId) === String(student?.id)) setCanDraw(d.canDraw);
    });

    // Question shared
    sock.on("classroom_question_shared", q => setSharedQuestion(q));

    // Voice signaling
    sock.on("classroom_voice_join",   async d => { if (voiceActive) await createPeer(d.socketId, false); });
    sock.on("classroom_voice_offer",  async d => { await handleOffer(d); });
    sock.on("classroom_voice_answer", async d => { await peers.current[d.from]?.setRemoteDescription(d.answer); });
    sock.on("classroom_voice_ice",    async d => { await peers.current[d.from]?.addIceCandidate(d.candidate).catch(()=>{}); });
    sock.on("classroom_voice_leave",  d => { cleanupPeer(d.socketId); });

    sock.on("disconnect", () => setConnected(false));

    return () => { disconnectClassroom(); stopVoice(); };
  }, []);

  // Auto-scroll chat
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chat]);

  // ── DRAWING ───────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    return {
      x: ((touch || e).clientX - rect.left) * (canvas.width / rect.width),
      y: ((touch || e).clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  const startDraw = useCallback(e => {
    if (!canDraw || tool === "text") return;
    e.preventDefault();
    drawing.current = true;
    const pos = getPos(e, canvasRef.current);
    lastPt.current = pos;
  }, [canDraw, tool]);

  const doDraw = useCallback(e => {
    if (!drawing.current || !canDraw) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    const pos    = getPos(e, canvas);
    const from   = lastPt.current;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    ctx.lineWidth   = tool === "eraser" ? size * 5 : size;
    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    // Emit normalized stroke
    socketRef.current?.emit("classroom_draw", {
      tool, color, size,
      fx: from.x / canvas.width, fy: from.y / canvas.height,
      tx: pos.x  / canvas.width, ty: pos.y  / canvas.height,
    });

    lastPt.current = pos;
  }, [canDraw, tool, color, size]);

  const endDraw = useCallback(() => { drawing.current = false; }, []);

  // ── CANVAS CLICK FOR TEXT ─────────────────────────────
  const handleCanvasClick = useCallback(e => {
    if (tool !== "text" || !canDraw) return;
    const canvas = canvasRef.current;
    const pos    = getPos(e, canvas);
    const text   = prompt("Enter text:");
    if (!text) return;
    const ctx = ctxRef.current;
    ctx.font      = `${size * 4}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(text, pos.x, pos.y);
    socketRef.current?.emit("add_text", {
      text, color, size: size * 4,
      x: pos.x / canvas.width,
      y: pos.y / canvas.height,
    });
  }, [tool, canDraw, color, size]);

  // ── REMOTE DRAW ───────────────────────────────────────
  const drawRemoteStroke = (d) => {
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.beginPath();
    ctx.moveTo(d.fx * canvas.width, d.fy * canvas.height);
    ctx.lineTo(d.tx * canvas.width, d.ty * canvas.height);
    ctx.strokeStyle = d.tool === "eraser" ? "#ffffff" : d.color;
    ctx.lineWidth   = d.tool === "eraser" ? d.size * 5 : d.size;
    ctx.globalCompositeOperation = d.tool === "eraser" ? "destination-out" : "source-over";
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";
  };

  const drawRemoteText = (d) => {
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.font      = `${d.size}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = d.color;
    ctx.fillText(d.text, d.x * canvas.width, d.y * canvas.height);
  };

  const replayBoard = (board) => {
    board.forEach(item => {
      if (item.type === "stroke") drawRemoteStroke(item.data);
      else if (item.type === "text") drawRemoteText(item.data);
    });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClear = () => {
    clearCanvas();
    socketRef.current?.emit("classroom_clear_board");
  };

  // ── CHAT ─────────────────────────────────────────────
  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current?.emit("classroom_chat_message", { text: chatInput });
    setChatInput("");
  };

  // ── VOICE ────────────────────────────────────────────
  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      setVoiceActive(true);
      socketRef.current?.emit("classroom_voice_join");
    } catch { setError("Microphone access denied. Please allow mic access."); }
  };

  const stopVoice = () => {
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    Object.values(peers.current).forEach(p => p.close());
    peers.current = {};
    Object.values(audioEls.current).forEach(el => el.remove());
    audioEls.current = {};
    setVoiceActive(false);
    socketRef.current?.emit("classroom_voice_leave");
  };

  const toggleMute = () => {
    if (localStream.current) {
      localStream.current.getAudioTracks().forEach(t => { t.enabled = muted; });
      setMuted(!muted);
    }
  };

  const createPeer = async (targetId, isInitiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });
    peers.current[targetId] = pc;

    localStream.current?.getTracks().forEach(t => pc.addTrack(t, localStream.current));

    pc.ontrack = e => {
      let audio = audioEls.current[targetId];
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audioEls.current[targetId] = audio;
      }
      audio.srcObject = e.streams[0];
    };

    pc.onicecandidate = e => {
      if (e.candidate) {
        socketRef.current?.emit("classroom_voice_ice", { to: targetId, candidate: e.candidate });
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("classroom_voice_offer", { to: targetId, offer });
    }
    return pc;
  };

  const handleOffer = async (d) => {
    const pc = await createPeer(d.from, false);
    await pc.setRemoteDescription(d.offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current?.emit("classroom_voice_answer", { to: d.from, answer });
  };

  const cleanupPeer = (id) => {
    peers.current[id]?.close();
    delete peers.current[id];
    audioEls.current[id]?.remove();
    delete audioEls.current[id];
  };

  // ── END SESSION ───────────────────────────────────────
  const handleEnd = () => {
    if (role === "teacher") socketRef.current?.emit("classroom_end");
    nav("/classroom");
  };

  if (sessionEnded) return (
    <div style={{ minHeight:"100vh", background:"#0f0c29", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", fontFamily:"sans-serif", color:"#fff", padding:24, textAlign:"center" }}>
      <div style={{ fontSize:52, marginBottom:16 }}>📚</div>
      <h2 style={{ fontSize:22, fontWeight:900, marginBottom:8 }}>Session Ended</h2>
      <p style={{ color:"rgba(255,255,255,0.7)", marginBottom:24 }}>{error || "This session has ended."}</p>
      <button style={{ padding:"12px 32px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer" }} onClick={() => nav("/classroom")}>
        Back to Lobby
      </button>
    </div>
  );

  if (!session && !error) return (
    <div style={{ minHeight:"100vh", background:"#0f0c29", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", fontFamily:"sans-serif", color:"#fff" }}>
      <div style={{ fontSize:40, marginBottom:16 }}>📡</div>
      <div style={{ fontSize:16, fontWeight:600 }}>Connecting to session...</div>
    </div>
  );

  if (error && !session) return (
    <div style={{ minHeight:"100vh", background:"#0f0c29", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", fontFamily:"sans-serif", color:"#fff", padding:24, textAlign:"center" }}>
      <div style={{ fontSize:52, marginBottom:12 }}>❌</div>
      <p style={{ color:"#e17055", marginBottom:20, fontSize:16 }}>{error}</p>
      <button style={{ padding:"12px 28px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, fontWeight:800, cursor:"pointer" }} onClick={() => nav("/classroom")}>
        ← Back
      </button>
    </div>
  );

  return (
    <div style={s.page}>
      {/* TOP BAR */}
      <div style={s.topBar}>
        <div style={{ flex:1 }}>
          <div style={s.topTitle}>{session?.title || title}</div>
          <div style={s.topSub}>
            {role === "teacher" ? "📋 Code: " : "📚 "}
            <span style={s.codeSpan}>{sessionCode}</span>
            {" · "}{participants.length} online
          </div>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {!connected && <span style={{ fontSize:10, color:"#e17055", fontWeight:700 }}>Reconnecting...</span>}
          <button style={{ ...s.topBtn, background:"#e17055" }} onClick={handleEnd}>
            {role === "teacher" ? "End" : "Leave"}
          </button>
        </div>
      </div>

      {/* TOOLBAR (for draw panel) */}
      {panel === "board" && (
        <div style={s.toolbar}>
          {/* Tools */}
          <div style={s.toolGroup}>
            {[["pen","✏️"],["eraser","⬜"],["text","T"]].map(([t, icon]) => (
              <button key={t} style={{ ...s.toolBtn, ...(tool === t ? s.toolActive : {}) }} onClick={() => setTool(t)} title={t}>
                {icon}
              </button>
            ))}
          </div>

          {/* Colors */}
          <div style={s.toolGroup}>
            {COLORS.map(c => (
              <div key={c} style={{ ...s.colorDot, background:c, border: color === c ? "3px solid #6c63ff" : "2px solid #ddd" }}
                onClick={() => { setTool("pen"); setColor(c); }} />
            ))}
          </div>

          {/* Sizes */}
          <div style={s.toolGroup}>
            {SIZES.map(sz => (
              <button key={sz} style={{ ...s.sizeBtn, ...(size === sz ? s.toolActive : {}), fontSize: Math.max(8, sz + 4) }}
                onClick={() => setSize(sz)}>●</button>
            ))}
          </div>

          {/* Teacher extra controls */}
          {role === "teacher" && (
            <button style={{ ...s.toolBtn, background:"#e17055", color:"#fff", fontSize:11, padding:"4px 8px" }} onClick={handleClear}>
              Clear All
            </button>
          )}
        </div>
      )}

      {/* MAIN AREA */}
      <div style={s.main}>

        {/* WHITEBOARD */}
        {panel === "board" && (
          <div style={s.boardContainer}>
            {sharedQuestion && (
              <div style={s.questionBanner}>
                <div style={{ fontWeight:800, marginBottom:6 }}>📋 {sharedQuestion.subject} Question</div>
                <div style={{ fontSize:13, marginBottom:8 }}>{sharedQuestion.question}</div>
                {["a","b","c","d"].map(opt => (
                  <div key={opt} style={{ fontSize:12, marginBottom:3 }}>
                    <span style={{ fontWeight:700 }}>{opt.toUpperCase()}.</span> {sharedQuestion[`option_${opt}`]}
                  </div>
                ))}
                <button style={{ marginTop:8, fontSize:11, background:"none", border:"1px solid #fff", color:"#fff", borderRadius:6, padding:"3px 10px", cursor:"pointer" }}
                  onClick={() => setSharedQuestion(null)}>Dismiss</button>
              </div>
            )}
            {!canDraw && role === "student" && (
              <div style={s.viewOnlyBadge}>👁️ View only — teacher hasn't given you drawing access</div>
            )}
            <canvas
              ref={canvasRef}
              style={{ ...s.canvas, cursor: tool === "eraser" ? "cell" : tool === "text" ? "text" : "crosshair" }}
              onMouseDown={startDraw}
              onMouseMove={doDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={doDraw}
              onTouchEnd={endDraw}
              onClick={handleCanvasClick}
            />
          </div>
        )}

        {/* CHAT */}
        {panel === "classroom_chat" && (
          <div style={s.chatPanel}>
            <div style={s.chatMessages}>
              {chat.length === 0 && <div style={s.chatEmpty}>No messages yet. Say hello! 👋</div>}
              {chat.map(msg => (
                <div key={msg.id} style={{ ...s.chatMsg, alignSelf: msg.uid === student?.id ? "flex-end" : "flex-start" }}>
                  <div style={{ fontSize:10, color:"#b2bec3", marginBottom:3, textAlign: msg.uid === student?.id ? "right" : "left" }}>
                    {msg.role === "teacher" ? "👨‍🏫 " : ""}{msg.name}
                  </div>
                  <div style={{ ...s.chatBubble, background: msg.uid === student?.id ? "#6c63ff" : "#fff", color: msg.uid === student?.id ? "#fff" : "#2d3436" }}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={s.chatInput}>
              <input style={s.chatInputField} placeholder="Type a message..." value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()} />
              <button style={s.sendBtn} onClick={sendChat}>Send</button>
            </div>
          </div>
        )}

        {/* PARTICIPANTS */}
        {panel === "participants" && (
          <div style={s.participantsPanel}>
            <div style={s.panelTitle}>👥 Participants ({participants.length})</div>
            {participants.map((p, i) => (
              <div key={i} style={s.participantRow}>
                <div style={{ ...s.participantAvatar, background: p.role === "teacher" ? "#6c63ff" : "#f0edff", color: p.role === "teacher" ? "#fff" : "#6c63ff" }}>
                  {p.role === "teacher" ? "👨‍🏫" : "👤"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:"#636e72", textTransform:"capitalize" }}>{p.role}</div>
                </div>
                {role === "teacher" && p.role === "student" && (
                  <div style={{ display:"flex", gap:4 }}>
                    <button style={s.miniBtn} onClick={() => socketRef.current?.emit("allow_draw", { studentId: p.id, canDraw: true })}>✏️</button>
                    <button style={{ ...s.miniBtn, background:"#e17055" }} onClick={() => socketRef.current?.emit("kick_student", { studentId: p.id })}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* VOICE */}
        {panel === "voice" && (
          <div style={s.voicePanel}>
            <div style={s.panelTitle}>🎤 Voice Communication</div>
            <div style={{ textAlign:"center", padding:"24px 0" }}>
              <div style={{ fontSize:60, marginBottom:16 }}>{voiceActive ? "🎙️" : "🔇"}</div>
              <div style={{ fontWeight:800, fontSize:18, marginBottom:8 }}>
                {voiceActive ? (muted ? "Muted" : "You are live") : "Voice off"}
              </div>
              <div style={{ fontSize:13, color:"#636e72", marginBottom:24 }}>
                {voiceActive ? "Others in the session can hear you" : "Tap to join voice"}
              </div>
              {!voiceActive ? (
                <button style={{ ...s.voiceBtn, background:"#00b894" }} onClick={startVoice}>🎤 Join Voice</button>
              ) : (
                <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
                  <button style={{ ...s.voiceBtn, background: muted ? "#e17055" : "#fdcb6e", color:"#2d3436" }} onClick={toggleMute}>
                    {muted ? "🔇 Unmute" : "🔈 Mute"}
                  </button>
                  <button style={{ ...s.voiceBtn, background:"#e17055" }} onClick={stopVoice}>📵 Leave Voice</button>
                </div>
              )}
            </div>
            {/* Active speakers */}
            <div style={{ padding:"0 16px" }}>
              {participants.filter(p => p.role === "teacher" || voiceActive).map((p, i) => (
                <div key={i} style={s.speakerRow}>
                  <div style={s.speakerAvatar}>{p.role === "teacher" ? "👨‍🏫" : "👤"}</div>
                  <div style={{ flex:1, fontWeight:600, fontSize:14 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:"#00b894" }}>● Live</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM NAV */}
      <nav style={s.bottomNav}>
        {[
          { id:"board",        icon:"✏️",  label:"Board" },
          { id:"classroom_chat",         icon:"💬",  label:"Chat",  badge: unreadChat },
          { id:"participants", icon:"👥",  label:"People" },
          { id:"voice",        icon: voiceActive ? "🎙️" : "🎤", label:"Voice" },
        ].map(tab => (
          <button key={tab.id} style={{ ...s.navBtn, ...(panel === tab.id ? s.navActive : {}) }}
            onClick={() => { setPanel(tab.id); if (tab.id === "classroom_chat") setUnreadChat(0); }}>
            <span style={{ fontSize:20, position:"relative" }}>
              {tab.icon}
              {tab.badge > 0 && <span style={s.badge}>{tab.badge}</span>}
            </span>
            <span style={{ fontSize:10, marginTop:2 }}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const s = {
  page:           { maxWidth:480, margin:"0 auto", height:"100vh", background:"#1a1a2e", fontFamily:"'Segoe UI',sans-serif", display:"flex", flexDirection:"column" },
  topBar:         { background:"#2d2d44", padding:"10px 14px", display:"flex", alignItems:"center", gap:10 },
  topTitle:       { fontWeight:800, fontSize:15, color:"#fff" },
  topSub:         { fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 },
  codeSpan:       { fontFamily:"monospace", fontWeight:900, color:"#a29bfe", letterSpacing:2 },
  topBtn:         { border:"none", borderRadius:8, padding:"6px 12px", fontWeight:700, fontSize:12, cursor:"pointer", color:"#fff" },
  toolbar:        { background:"#252540", padding:"8px 10px", display:"flex", flexWrap:"wrap", gap:6, alignItems:"center", borderBottom:"1px solid #3d3d5c" },
  toolGroup:      { display:"flex", gap:4, alignItems:"center" },
  toolBtn:        { width:30, height:30, border:"1px solid #3d3d5c", borderRadius:6, background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" },
  toolActive:     { background:"#6c63ff", borderColor:"#6c63ff" },
  sizeBtn:        { width:26, height:26, border:"1px solid #3d3d5c", borderRadius:6, background:"#1a1a2e", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 },
  colorDot:       { width:22, height:22, borderRadius:"50%", cursor:"pointer", flexShrink:0 },
  main:           { flex:1, overflow:"hidden", position:"relative" },
  boardContainer: { width:"100%", height:"100%", position:"relative", background:"#fff" },
  canvas:         { width:"100%", height:"100%", minHeight:450, touchAction:"none", display:"block", cursor:"crosshair" },
  viewOnlyBadge:  { position:"absolute", top:8, left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.6)", color:"#fff", fontSize:11, padding:"4px 12px", borderRadius:20, zIndex:10, whiteSpace:"nowrap" },
  questionBanner: { position:"absolute", top:8, left:8, right:8, background:"#6c63ff", color:"#fff", borderRadius:12, padding:"12px 14px", zIndex:20, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" },
  chatPanel:      { height:"100%", display:"flex", flexDirection:"column", background:"#f4f6fb" },
  chatMessages:   { flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 },
  chatEmpty:      { textAlign:"center", color:"#b2bec3", padding:"40px 20px", fontSize:14 },
  chatMsg:        { display:"flex", flexDirection:"column", maxWidth:"80%" },
  chatBubble:     { padding:"8px 12px", borderRadius:12, fontSize:14, lineHeight:1.4, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" },
  chatInput:      { display:"flex", gap:8, padding:"10px 14px", background:"#fff", borderTop:"1px solid #f0f0f0" },
  chatInputField: { flex:1, padding:"10px 12px", border:"2px solid #dfe6e9", borderRadius:10, fontSize:14, outline:"none" },
  sendBtn:        { padding:"10px 16px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" },
  participantsPanel:{ height:"100%", overflowY:"auto", background:"#f4f6fb", padding:"16px" },
  participantRow: { display:"flex", alignItems:"center", gap:12, background:"#fff", borderRadius:12, padding:"12px 14px", marginBottom:8, boxShadow:"0 1px 6px rgba(0,0,0,0.05)" },
  participantAvatar:{ width:40, height:40, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 },
  panelTitle:     { fontWeight:800, fontSize:16, color:"#2d3436", marginBottom:12 },
  miniBtn:        { background:"#6c63ff", color:"#fff", border:"none", borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:12 },
  voicePanel:     { height:"100%", overflowY:"auto", background:"#f4f6fb", padding:"16px" },
  voiceBtn:       { padding:"12px 24px", border:"none", borderRadius:12, fontWeight:800, fontSize:14, cursor:"pointer", color:"#fff" },
  speakerRow:     { display:"flex", alignItems:"center", gap:12, background:"#fff", borderRadius:12, padding:"10px 14px", marginBottom:8 },
  speakerAvatar:  { width:36, height:36, background:"#f0edff", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 },
  bottomNav:      { display:"flex", background:"#2d2d44", borderTop:"1px solid #3d3d5c" },
  navBtn:         { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 0", background:"none", border:"none", color:"rgba(255,255,255,0.5)", cursor:"pointer", gap:1, position:"relative" },
  navActive:      { color:"#a29bfe" },
  badge:          { position:"absolute", top:-4, right:-4, background:"#e17055", color:"#fff", borderRadius:10, fontSize:8, padding:"1px 4px", fontWeight:800, minWidth:14, textAlign:"center" },
};
