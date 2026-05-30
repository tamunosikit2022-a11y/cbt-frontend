import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getClassroomSocket, disconnectClassroom } from "../../utils/classroomSocket";
import { playPing, playJoin, playClick } from "../../utils/sounds";

const COLORS = ["#000000","#ffffff","#e17055","#6c63ff","#00b894","#0984e3","#fdcb6e","#fd79a8","#2d3436","#74b9ff"];
const SIZES  = [2, 4, 8, 14, 22];

// Define ICE_SERVERS once at module level, not inside the component
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun.cloudflare.com:3478" },
  ]
};

export default function ClassroomSession() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { student } = useAuth();

  const role    = params.get("role")    || "student";
  const code    = params.get("code")    || "";
  const title   = params.get("title")   || "Scholar Session";
  const subject = params.get("subject") || "General";

  const [sessionCode,    setSessionCode]    = useState(code);
  const [session,        setSession]        = useState(null);
  const [participants,   setParticipants]   = useState([]);
  const [pendingJoins,   setPendingJoins]   = useState([]);
  const [chat,           setChat]           = useState([]);
  const [chatInput,      setChatInput]      = useState("");
  const [connected,      setConnected]      = useState(false);
  const [error,          setError]          = useState("");
  const [tool,           setTool]           = useState("pen");
  const [color,          setColor]          = useState("#000000");
  const [size,           setSize]           = useState(4);
  const [panel,          setPanel]          = useState("board");
  const [canDraw,        setCanDraw]        = useState(role === "teacher");
  const [voiceActive,    setVoiceActive]    = useState(false);
  const [muted,          setMuted]          = useState(false);
  const [unreadChat,     setUnreadChat]     = useState(0);
  const [sharedQuestion, setSharedQuestion] = useState(null);
  const [sessionEnded,   setSessionEnded]   = useState(false);
  const [waitingApproval,setWaitingApproval]= useState(false);

  const canvasRef   = useRef(null);
  const socketRef   = useRef(null);
  const drawing     = useRef(false);
  const lastPt      = useRef(null);
  const ctxRef      = useRef(null);
  const chatEndRef  = useRef(null);
  const localStream = useRef(null);
  const peers       = useRef({});
  const audioEls    = useRef({});
  const boardData   = useRef([]);
  // Use ref for panel so socket callbacks always get the latest value (avoids stale closure)
  const panelRef    = useRef("board");

  // Keep panelRef in sync with state
  useEffect(() => { panelRef.current = panel; }, [panel]);

  // ── CANVAS ────────────────────────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.offsetWidth  || canvas.parentElement?.offsetWidth  || 600;
    const h = canvas.offsetHeight || canvas.parentElement?.offsetHeight || 450;
    canvas.width  = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    // White background for whiteboard
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.lineCap  = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;
  }, []);

  useEffect(() => {
    const t1 = setTimeout(initCanvas, 100);
    const t2 = setTimeout(initCanvas, 500);
    const onResize = () => {
      const canvas = canvasRef.current;
      const ctx    = ctxRef.current;
      if (!canvas || !ctx) return;
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      canvas.width  = canvas.offsetWidth  || 600;
      canvas.height = canvas.offsetHeight || 450;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(img, 0, 0);
      ctx.lineCap  = "round";
      ctx.lineJoin = "round";
    };
    window.addEventListener("resize", onResize);
    return () => { clearTimeout(t1); clearTimeout(t2); window.removeEventListener("resize", onResize); };
  }, [initCanvas]);

  useEffect(() => {
    if (panel === "board") setTimeout(initCanvas, 80);
  }, [panel, initCanvas]);

  // ── VOICE helpers (defined BEFORE the socket useEffect so they can be referenced in cleanup) ──
  const cleanupPeer = useCallback((id) => {
    try { peers.current[id]?.close(); } catch {}
    delete peers.current[id];
    try {
      if (audioEls.current[id]) {
        audioEls.current[id].srcObject = null;
        audioEls.current[id].remove();
      }
    } catch {}
    delete audioEls.current[id];
  }, []);

  const stopVoice = useCallback(() => {
    localStream.current?.getTracks().forEach(t => t.stop());
    localStream.current = null;
    Object.keys(peers.current).forEach(id => cleanupPeer(id));
    peers.current    = {};
    audioEls.current = {};
    setVoiceActive(false);
    socketRef.current?.emit("voice_leave");
  }, [cleanupPeer]);

  // ── SOCKET ────────────────────────────────────────────
  useEffect(() => {
    let studentData = null;
    try { studentData = JSON.parse(localStorage.getItem("student") || "null"); } catch {}
    const me = student || studentData;
    if (!me?.id) return;

    const sock = getClassroomSocket();
    socketRef.current = sock;

    sock.on("connect", () => {
      setConnected(true);
      setError("");

      if (role === "teacher") {
        sock.emit("create_session", {
          teacherId:   me.id,
          teacherName: me.full_name || "Teacher",
          title, subject,
        }, res => {
          if (res.success) {
            setSessionCode(res.code);
            setSession(res.session);
            setParticipants(res.session.participants || []);
          } else setError(res.error);
        });
      } else {
        setWaitingApproval(true);
        sock.emit("request_join", {
          code,
          studentId:   me.id,
          studentName: me.full_name || "Student",
        }, res => {
          if (res.success === false) {
            setError(res.error || "Could not join session.");
            setWaitingApproval(false);
          }
        });
      }
    });

    sock.on("join_request", data => {
      setPendingJoins(prev => {
        if (prev.find(p => p.socketId === data.socketId)) return prev;
        return [...prev, data];
      });
      setPanel("participants");
      playJoin();
    });

    sock.on("join_approved", res => {
      setWaitingApproval(false);
      setSession(res.session);
      setParticipants(res.session.participants || []);
      setChat(res.chat || []);
      playJoin();
      if (res.board?.length) {
        boardData.current = res.board;
        setTimeout(() => replayBoard(res.board), 200);
      }
    });

    sock.on("join_rejected", () => {
      setWaitingApproval(false);
      setError("Your request to join was declined by the teacher.");
    });

    // Board
    sock.on("draw_stroke", d => {
      boardData.current.push({ type:"stroke", data:d });
      drawRemoteStroke(d);
    });
    sock.on("add_text",    d => {
      boardData.current.push({ type:"text", data:d });
      drawRemoteText(d);
    });
    sock.on("clear_board", () => {
      boardData.current = [];
      clearCanvas();
    });

    // FIX: use panelRef (not panel) to avoid stale closure
    sock.on("chat_message", msg => {
      setChat(prev => [...prev, msg]);
      if (panelRef.current !== "chat") {
        setUnreadChat(prev => prev + 1);
        playPing();
      }
    });

    sock.on("participant_joined", d => setParticipants(d.participants || []));
    sock.on("participant_left",   d => setParticipants(d.participants || []));

    sock.on("session_ended",  d => { setSessionEnded(true); setError(d.message); });
    sock.on("teacher_left",   d => setError(d.message));
    sock.on("kicked",         d => { setSessionEnded(true); setError(d.message); });
    sock.on("draw_permission",d => {
      if (String(d.studentId) === String(me.id)) setCanDraw(d.canDraw);
    });
    sock.on("question_shared", q => setSharedQuestion(q));

    // Voice WebRTC
    sock.on("voice_join",   async d => { if (localStream.current) await createPeer(d.socketId, true); });
    sock.on("voice_offer",  async d => await handleOffer(d));
    sock.on("voice_answer", async d => {
      const pc = peers.current[d.from];
      if (pc && d.answer) await pc.setRemoteDescription(new RTCSessionDescription(d.answer)).catch(()=>{});
    });
    sock.on("voice_ice",    async d => {
      const pc = peers.current[d.from];
      if (pc && d.candidate) await pc.addIceCandidate(new RTCIceCandidate(d.candidate)).catch(()=>{});
    });
    sock.on("voice_leave",  d => cleanupPeer(d.socketId));

    sock.on("connect_error", e => setError(`Connection failed: ${e.message}`));
    sock.on("disconnect",    () => setConnected(false));

    return () => {
      stopVoice();
      disconnectClassroom();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chat]);

  // ── DRAWING ───────────────────────────────────────────
  const getPos = (e, canvas) => {
    const rect  = canvas.getBoundingClientRect();
    const touch = e.touches?.[0];
    const src   = touch || e;
    return {
      x: (src.clientX - rect.left) * (canvas.width  / rect.width),
      y: (src.clientY - rect.top)  * (canvas.height / rect.height),
    };
  };

  const startDraw = useCallback(e => {
    if (!canDraw || tool === "text") return;
    e.preventDefault();
    if (!ctxRef.current) initCanvas();
    drawing.current = true;
    lastPt.current  = getPos(e, canvasRef.current);
  }, [canDraw, tool, initCanvas]);

  const doDraw = useCallback(e => {
    if (!drawing.current || !canDraw) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    if (!canvas || !ctx || !lastPt.current) return;
    const pos  = getPos(e, canvas);
    const from = lastPt.current;

    ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = tool === "eraser" ? "rgba(0,0,0,1)" : color;
    ctx.lineWidth   = tool === "eraser" ? size * 5 : size;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.globalCompositeOperation = "source-over";

    socketRef.current?.emit("draw_stroke", {
      tool, color, size,
      fx: from.x / canvas.width, fy: from.y / canvas.height,
      tx: pos.x  / canvas.width, ty: pos.y  / canvas.height,
    });
    lastPt.current = pos;
  }, [canDraw, tool, color, size]);

  const endDraw = useCallback(() => { drawing.current = false; lastPt.current = null; }, []);

  const handleCanvasClick = useCallback(e => {
    if (tool !== "text" || !canDraw) return;
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    if (!canvas || !ctx) return;
    const pos  = getPos(e, canvas);
    const text = prompt("Enter text:");
    if (!text) return;
    const fontSize = size * 4;
    ctx.font      = `${fontSize}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = color;
    ctx.fillText(text, pos.x, pos.y);
    socketRef.current?.emit("add_text", {
      text, color, size: fontSize,
      x: pos.x / canvas.width, y: pos.y / canvas.height,
    });
  }, [tool, canDraw, color, size]);

  // ── REMOTE DRAW ───────────────────────────────────────
  const drawRemoteStroke = (d) => {
    const canvas = canvasRef.current;
    const ctx    = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.globalCompositeOperation = d.tool === "eraser" ? "destination-out" : "source-over";
    ctx.strokeStyle = d.tool === "eraser" ? "rgba(0,0,0,1)" : d.color;
    ctx.lineWidth   = d.tool === "eraser" ? d.size * 5 : d.size;
    ctx.beginPath();
    ctx.moveTo(d.fx * canvas.width, d.fy * canvas.height);
    ctx.lineTo(d.tx * canvas.width, d.ty * canvas.height);
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
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleClear = () => { clearCanvas(); socketRef.current?.emit("clear_board"); boardData.current = []; };

  // ── CHAT ──────────────────────────────────────────────
  const sendChat = () => {
    if (!chatInput.trim()) return;
    socketRef.current?.emit("chat_message", { text: chatInput });
    setChatInput("");
  };

  // ── TEACHER: approve/reject join ──────────────────────
  const approveJoin = (req) => {
    socketRef.current?.emit("approve_join", { socketId: req.socketId });
    setPendingJoins(prev => prev.filter(p => p.socketId !== req.socketId));
  };

  const rejectJoin = (req) => {
    socketRef.current?.emit("reject_join", { socketId: req.socketId });
    setPendingJoins(prev => prev.filter(p => p.socketId !== req.socketId));
  };

  // ── VOICE ────────────────────────────────────────────
  const startVoice = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      setVoiceActive(true);
      socketRef.current?.emit("voice_join");
    } catch (err) {
      setError("Microphone access denied. Please allow mic in browser settings.");
    }
  };

  // FIX: toggleMute was inverting muted state incorrectly
  // muted=true means track is disabled, muted=false means track is enabled
  const toggleMute = () => {
    if (!localStream.current) return;
    setMuted(prev => {
      const nowMuted = !prev;
      localStream.current.getAudioTracks().forEach(t => { t.enabled = !nowMuted; });
      return nowMuted;
    });
  };

  const createPeer = async (targetSocketId, isInitiator) => {
    if (peers.current[targetSocketId]) return peers.current[targetSocketId];
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peers.current[targetSocketId] = pc;

    if (localStream.current) {
      localStream.current.getTracks().forEach(t => pc.addTrack(t, localStream.current));
    }

    pc.ontrack = e => {
      let audio = audioEls.current[targetSocketId];
      if (!audio) {
        audio = document.createElement("audio");
        audio.autoplay = true;
        audio.setAttribute("playsinline", "true");
        document.body.appendChild(audio);
        audioEls.current[targetSocketId] = audio;
      }
      if (audio.srcObject !== e.streams[0]) {
        audio.srcObject = e.streams[0];
        audio.play().catch(() => {});
      }
    };

    pc.onicecandidate = e => {
      if (e.candidate) {
        socketRef.current?.emit("voice_ice", { to: targetSocketId, candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        cleanupPeer(targetSocketId);
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("voice_offer", { to: targetSocketId, offer });
    }
    return pc;
  };

  const handleOffer = async (d) => {
    // Even if local voice isn't active, we can still receive audio from others
    const pc = await createPeer(d.from, false);
    if (pc.signalingState !== "stable") return;
    await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    socketRef.current?.emit("voice_answer", { to: d.from, answer });
  };

  // ── END SESSION ───────────────────────────────────────
  const handleEnd = () => {
    if (role === "teacher") {
      socketRef.current?.emit("end_session");
      setTimeout(() => { disconnectClassroom(); nav("/classroom"); }, 800);
    } else {
      disconnectClassroom();
      nav("/classroom");
    }
  };

  // ── RENDER STATES ─────────────────────────────────────
  if (sessionEnded) return (
    <div style={sc.centred}>
      <div style={{ fontSize:52 }}>📚</div>
      <h2 style={{ color:"#fff", marginTop:12 }}>Session Ended</h2>
      <p style={{ color:"rgba(255,255,255,0.7)", marginTop:8 }}>{error}</p>
      <button style={sc.backBtn} onClick={() => nav("/classroom")}>Back to Lobby</button>
    </div>
  );

  if (waitingApproval) return (
    <div style={sc.centred}>
      <div style={{ fontSize:60, animation:"pulse 1.5s infinite" }}>⏳</div>
      <h2 style={{ color:"#fff", marginTop:16 }}>Waiting for Approval</h2>
      <p style={{ color:"rgba(255,255,255,0.7)", marginTop:8, textAlign:"center" }}>
        Your teacher needs to accept your request to join.
      </p>
      <button style={{ ...sc.backBtn, marginTop:24 }} onClick={() => { disconnectClassroom(); nav("/classroom"); }}>
        Cancel
      </button>
    </div>
  );

  if (!session && !error) return (
    <div style={sc.centred}>
      <div style={{ fontSize:40 }}>📡</div>
      <div style={{ color:"#fff", marginTop:12, fontSize:16, fontWeight:600 }}>Connecting...</div>
    </div>
  );

  if (error && !session) return (
    <div style={sc.centred}>
      <div style={{ fontSize:52 }}>❌</div>
      <p style={{ color:"#e17055", marginTop:12, fontSize:15 }}>{error}</p>
      <button style={sc.backBtn} onClick={() => nav("/classroom")}>← Back</button>
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
            {pendingJoins.length > 0 && (
              <span style={{ background:"#e17055", color:"#fff", borderRadius:10, fontSize:9, padding:"1px 6px", marginLeft:6, fontWeight:800 }}>
                {pendingJoins.length} waiting
              </span>
            )}
          </div>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          {!connected && <span style={{ fontSize:10, color:"#e17055", fontWeight:700 }}>Reconnecting...</span>}
          <button style={{ ...s.topBtn, background:"#e17055" }} onClick={handleEnd}>
            {role === "teacher" ? "End" : "Leave"}
          </button>
        </div>
      </div>

      {/* TOOLBAR */}
      {panel === "board" && (
        <div style={s.toolbar}>
          <div style={s.toolGroup}>
            {[["pen","✏️"],["eraser","⬜"],["text","T"]].map(([t, icon]) => (
              <button key={t} style={{ ...s.toolBtn, ...(tool === t ? s.toolActive : {}) }}
                onClick={() => setTool(t)}>{icon}</button>
            ))}
          </div>
          <div style={s.toolGroup}>
            {COLORS.map(c => (
              <div key={c} onClick={() => { setTool("pen"); setColor(c); }}
                style={{ width:20, height:20, borderRadius:"50%", background:c, cursor:"pointer", flexShrink:0,
                  border: color === c ? "3px solid #6c63ff" : "2px solid #555", boxSizing:"border-box" }} />
            ))}
          </div>
          <div style={s.toolGroup}>
            {SIZES.map(sz => (
              <button key={sz} onClick={() => setSize(sz)}
                style={{ ...s.sizeBtn, ...(size === sz ? s.toolActive : {}), fontSize: Math.max(8, sz + 4) }}>●</button>
            ))}
          </div>
          {role === "teacher" && (
            <button style={{ ...s.toolBtn, background:"#e17055", color:"#fff", fontSize:10, padding:"2px 7px" }}
              onClick={handleClear}>Clear</button>
          )}
        </div>
      )}

      {/* MAIN */}
      <div style={s.main}>

        {/* BOARD */}
        {panel === "board" && (
          <div style={s.boardContainer}>
            {sharedQuestion && (
              <div style={s.questionBanner}>
                <strong>📋 {sharedQuestion.subject}</strong>
                <p style={{ margin:"6px 0", fontSize:13 }}>{sharedQuestion.question}</p>
                {["a","b","c","d"].map(o => (
                  <div key={o} style={{ fontSize:12 }}><b>{o.toUpperCase()}.</b> {sharedQuestion[`option_${o}`]}</div>
                ))}
                <button style={{ marginTop:8, fontSize:11, background:"none", border:"1px solid #fff", color:"#fff", borderRadius:6, padding:"2px 10px", cursor:"pointer" }}
                  onClick={() => setSharedQuestion(null)}>✕ Dismiss</button>
              </div>
            )}
            {!canDraw && role === "student" && (
              <div style={s.viewOnlyBadge}>👁 View only</div>
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
        {panel === "chat" && (
          <div style={s.chatPanel}>
            <div style={s.chatMessages}>
              {chat.length === 0 && <div style={s.chatEmpty}>No messages yet 👋</div>}
              {chat.map((msg, i) => {
                const mine = String(msg.uid) === String(student?.id);
                return (
                  <div key={i} style={{ display:"flex", flexDirection:"column", alignSelf: mine ? "flex-end" : "flex-start", maxWidth:"80%" }}>
                    <div style={{ fontSize:10, color:"#b2bec3", marginBottom:3, textAlign: mine ? "right" : "left" }}>
                      {msg.role === "teacher" ? "👨‍🏫 " : ""}{msg.name}
                    </div>
                    <div style={{ ...s.chatBubble, background: mine ? "#6c63ff" : "#fff", color: mine ? "#fff" : "#2d3436" }}>
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
            <div style={s.chatInputRow}>
              <input style={s.chatInput} placeholder="Type a message..." value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && sendChat()} />
              <button style={s.sendBtn} onClick={sendChat}>Send</button>
            </div>
          </div>
        )}

        {/* PARTICIPANTS */}
        {panel === "participants" && (
          <div style={s.scrollPanel}>
            {role === "teacher" && pendingJoins.length > 0 && (
              <div style={{ background:"#2d2d44", borderRadius:14, padding:"14px", marginBottom:14 }}>
                <div style={{ fontWeight:800, fontSize:14, color:"#fdcb6e", marginBottom:10 }}>
                  🔔 Join Requests ({pendingJoins.length})
                </div>
                {pendingJoins.map((req, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, background:"#1a1a2e", borderRadius:10, padding:"10px 12px" }}>
                    <div style={{ width:36, height:36, background:"#f0edff", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>👤</div>
                    <div style={{ flex:1, fontWeight:700, fontSize:14, color:"#fff" }}>{req.studentName}</div>
                    <button style={{ background:"#00b894", color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", fontWeight:700, cursor:"pointer", fontSize:12 }}
                      onClick={() => approveJoin(req)}>Accept ✓</button>
                    <button style={{ background:"#e17055", color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", fontWeight:700, cursor:"pointer", fontSize:12 }}
                      onClick={() => rejectJoin(req)}>Reject ✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontWeight:800, fontSize:15, color:"#fff", marginBottom:10 }}>
              👥 In Session ({participants.length})
            </div>
            {participants.map((p, i) => (
              <div key={i} style={s.participantRow}>
                <div style={{ ...s.pAvatar, background: p.role === "teacher" ? "#6c63ff" : "#f0edff", color: p.role === "teacher" ? "#fff" : "#6c63ff" }}>
                  {p.role === "teacher" ? "👨‍🏫" : "👤"}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#fff" }}>{p.name}</div>
                  <div style={{ fontSize:11, color:"#b2bec3", textTransform:"capitalize" }}>{p.role}</div>
                </div>
                {role === "teacher" && p.role === "student" && (
                  <div style={{ display:"flex", gap:5 }}>
                    <button title="Give drawing access" style={s.miniBtn}
                      onClick={() => socketRef.current?.emit("allow_draw", { studentId: p.id, canDraw: true })}>✏️</button>
                    <button title="Remove drawing access" style={{ ...s.miniBtn, background:"#636e72" }}
                      onClick={() => socketRef.current?.emit("allow_draw", { studentId: p.id, canDraw: false })}>🚫</button>
                    <button title="Kick student" style={{ ...s.miniBtn, background:"#e17055" }}
                      onClick={() => socketRef.current?.emit("kick_student", { studentId: p.id })}>✕</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* VOICE */}
        {panel === "voice" && (
          <div style={{ ...s.scrollPanel, textAlign:"center" }}>
            <div style={{ fontSize:64, marginBottom:12 }}>{voiceActive ? "🎙️" : "🔇"}</div>
            <div style={{ fontWeight:800, fontSize:18, marginBottom:6, color:"#fff" }}>
              {voiceActive ? (muted ? "🔇 Muted" : "🎙️ You are live") : "Voice Off"}
            </div>
            <div style={{ fontSize:13, color:"#b2bec3", marginBottom:24 }}>
              {voiceActive ? "Others can hear you. Tap mute to silence yourself." : "Tap below to join voice"}
            </div>
            {!voiceActive ? (
              <button style={{ ...s.voiceBtn, background:"#00b894" }} onClick={startVoice}>🎤 Join Voice</button>
            ) : (
              <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
                <button style={{ ...s.voiceBtn, background: muted ? "#6c63ff" : "#fdcb6e", color: muted ? "#fff" : "#2d3436" }} onClick={toggleMute}>
                  {muted ? "🔊 Unmute" : "🔇 Mute"}
                </button>
                <button style={{ ...s.voiceBtn, background:"#e17055" }} onClick={stopVoice}>📵 Leave</button>
              </div>
            )}
            <div style={{ marginTop:24 }}>
              {participants.map((p, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:12, background:"#2d2d44", borderRadius:12, padding:"10px 14px", marginBottom:8 }}>
                  <div style={{ width:36, height:36, background:"#f0edff", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {p.role === "teacher" ? "👨‍🏫" : "👤"}
                  </div>
                  <div style={{ flex:1, fontWeight:600, fontSize:14, textAlign:"left", color:"#fff" }}>{p.name}</div>
                  <div style={{ fontSize:11, color:"#00b894", fontWeight:700 }}>● {voiceActive ? "Live" : "—"}</div>
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
          { id:"chat",         icon:"💬",  label:"Chat",  badge: unreadChat },
          { id:"participants", icon:"👥",  label:"People", badge: pendingJoins.length },
          { id:"voice",        icon: voiceActive ? "🎙️" : "🎤", label:"Voice" },
        ].map(tab => (
          <button key={tab.id}
            style={{ ...s.navBtn, ...(panel === tab.id ? s.navActive : {}) }}
            onClick={() => { setPanel(tab.id); if (tab.id === "chat") setUnreadChat(0); }}>
            <span style={{ fontSize:20, position:"relative" }}>
              {tab.icon}
              {tab.badge > 0 && (
                <span style={{ position:"absolute", top:-4, right:-6, background:"#e17055", color:"#fff", borderRadius:10, fontSize:8, padding:"1px 4px", fontWeight:800, minWidth:14, textAlign:"center" }}>
                  {tab.badge}
                </span>
              )}
            </span>
            <span style={{ fontSize:10, marginTop:2 }}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

const sc = {
  centred: { minHeight:"100vh", background:"#0f0c29", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", color:"#fff", padding:24, textAlign:"center" },
  backBtn: { marginTop:20, padding:"12px 32px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer" },
};

const s = {
  page:          { maxWidth:480, margin:"0 auto", height:"100vh", background:"#1a1a2e", fontFamily:"'Segoe UI',sans-serif", display:"flex", flexDirection:"column" },
  topBar:        { background:"#2d2d44", padding:"10px 14px", display:"flex", alignItems:"center", gap:10, flexShrink:0 },
  topTitle:      { fontWeight:800, fontSize:15, color:"#fff" },
  topSub:        { fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2, display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" },
  codeSpan:      { fontFamily:"monospace", fontWeight:900, color:"#a29bfe", letterSpacing:2 },
  topBtn:        { border:"none", borderRadius:8, padding:"7px 14px", fontWeight:700, fontSize:13, cursor:"pointer", color:"#fff", flexShrink:0 },
  toolbar:       { background:"#252540", padding:"6px 10px", display:"flex", flexWrap:"wrap", gap:5, alignItems:"center", borderBottom:"1px solid #3d3d5c", flexShrink:0 },
  toolGroup:     { display:"flex", gap:4, alignItems:"center" },
  toolBtn:       { width:30, height:30, border:"1px solid #3d3d5c", borderRadius:6, background:"#1a1a2e", color:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", padding:0 },
  toolActive:    { background:"#6c63ff", borderColor:"#6c63ff" },
  sizeBtn:       { width:26, height:26, border:"1px solid #3d3d5c", borderRadius:6, background:"#1a1a2e", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 },
  main:          { flex:1, overflow:"hidden", position:"relative" },
  boardContainer:{ width:"100%", height:"100%", position:"absolute", top:0, left:0, background:"#fff", overflow:"hidden" },
  canvas:        { width:"100%", height:"100%", touchAction:"none", display:"block", userSelect:"none" },
  viewOnlyBadge: { position:"absolute", top:8, left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:11, padding:"4px 14px", borderRadius:20, zIndex:10, whiteSpace:"nowrap", pointerEvents:"none" },
  questionBanner:{ position:"absolute", top:8, left:8, right:8, background:"#6c63ff", color:"#fff", borderRadius:12, padding:"12px 14px", zIndex:20, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" },
  chatPanel:     { height:"100%", display:"flex", flexDirection:"column", background:"#1a1a2e" },
  chatMessages:  { flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 },
  chatEmpty:     { textAlign:"center", color:"#b2bec3", padding:"40px 20px", fontSize:14 },
  chatBubble:    { padding:"9px 13px", borderRadius:12, fontSize:14, lineHeight:1.4, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" },
  chatInputRow:  { display:"flex", gap:8, padding:"10px 14px", background:"#252540", borderTop:"1px solid #3d3d5c", flexShrink:0 },
  chatInput:     { flex:1, padding:"10px 12px", border:"2px solid #3d3d5c", borderRadius:10, fontSize:14, outline:"none", background:"#1a1a2e", color:"#fff" },
  sendBtn:       { padding:"10px 16px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" },
  scrollPanel:   { height:"100%", overflowY:"auto", background:"#1a1a2e", padding:"16px" },
  participantRow:{ display:"flex", alignItems:"center", gap:12, background:"#2d2d44", borderRadius:12, padding:"12px 14px", marginBottom:8 },
  pAvatar:       { width:40, height:40, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 },
  miniBtn:       { background:"#6c63ff", color:"#fff", border:"none", borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:12 },
  voiceBtn:      { padding:"12px 24px", border:"none", borderRadius:12, fontWeight:800, fontSize:14, cursor:"pointer", color:"#fff" },
  bottomNav:     { display:"flex", background:"#2d2d44", borderTop:"1px solid #3d3d5c", flexShrink:0 },
  navBtn:        { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 0", background:"none", border:"none", color:"rgba(255,255,255,0.45)", cursor:"pointer", gap:1 },
  navActive:     { color:"#a29bfe" },
};
