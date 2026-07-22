import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getClassroomSocket, disconnectClassroom } from "../../utils/classroomSocket";
import { playPing, playJoin, playClick } from "../../utils/sounds";
import LiveIDEPanel from "./liveide/LiveIDEPanel";

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
  const description = params.get("description") || "";
  const themeColor   = params.get("color") || "#7C5CFF";
  const icon         = params.get("icon")  || "📚";

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
  // Top-level section toggle: "class" = existing whiteboard/chat/voice
  // Live Class, "ide" = new Live IDE (Python now, Arduino/Circuits later).
  // Kept independent of `panel` so switching back to Live Class always
  // restores whichever board/chat/participants/voice tab was open.
  const [section,        setSection]        = useState("class");
  const [canDraw,        setCanDraw]        = useState(role === "teacher");
  const [voiceActive,    setVoiceActive]    = useState(false);
  const [muted,          setMuted]          = useState(false);
  const [videoOn,        setVideoOn]        = useState(false);
  const [screenSharing,  setScreenSharing]  = useState(false);
  const [handRaised,     setHandRaised]     = useState(false);
  const [remoteStreams,  setRemoteStreams]   = useState({});
  const screenStreamRef = useRef(null);
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
    if (!ctx) return;
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
    // FIX: the <canvas> is conditionally rendered (`{panel === "board" && ...}`),
    // so switching to another panel (chat, participants, voice) and back
    // UNMOUNTS and REMOUNTS a brand-new, blank canvas element. initCanvas()
    // then paints a fresh white background but never redraws what was
    // already on the board — so all the ink a student/teacher had drawn
    // was silently wiped out on every panel switch, even though nothing
    // had actually been "cleared". boardData.current already holds the
    // full stroke/text history (used for late-joiners), so we just need
    // to replay it back onto the newly (re)initialized canvas.
    if (panel === "board") {
      setTimeout(() => {
        initCanvas();
        if (boardData.current?.length) replayBoard(boardData.current);
      }, 80);
    }
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
    if (localStream.current) {
      localStream.current.getTracks().forEach(t => t.stop());
      localStream.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    Object.keys(peers.current).forEach(id => cleanupPeer(id));
    peers.current    = {};
    audioEls.current = {};
    setVoiceActive(false);
    setVideoOn(false);
    setScreenSharing(false);
    setHandRaised(false);
    setRemoteStreams({});
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
          title, subject, description, themeColor, icon,
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

  useEffect(() => { chatEndRef.current?.scrollIntoView?.({ behavior:"smooth" }); }, [chat]);

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

  // ── VIDEO / VOICE ─────────────────────────────────────
  const startVideo = async (withVideo = false) => {
    try {
      const constraints = { audio: true, video: withVideo ? { width:640, height:480, facingMode:"user" } : false };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStream.current = stream;
      setVoiceActive(true);
      setVideoOn(withVideo);
      socketRef.current?.emit("video:toggle", { video: withVideo, audio: true });
      socketRef.current?.emit("voice_join");
      // Add tracks to all existing peers
      Object.keys(peers.current).forEach(sid => {
        const pc = peers.current[sid];
        stream.getTracks().forEach(t => {
          try { pc.addTrack(t, stream); } catch {}
        });
      });
    } catch (err) {
      setError("Camera/mic access denied. Please allow in browser settings.");
    }
  };

  // FIX: toggleMute correctly — muted=true means track disabled
  const toggleMute = () => {
    if (!localStream.current) return;
    setMuted(prev => {
      const nowMuted = !prev;
      localStream.current.getAudioTracks().forEach(t => { t.enabled = !nowMuted; });
      socketRef.current?.emit("video:toggle", { audio: !nowMuted, video: videoOn });
      return nowMuted;
    });
  };

  const toggleVideo = () => {
    if (!localStream.current) return;
    setVideoOn(prev => {
      const nowOn = !prev;
      localStream.current.getVideoTracks().forEach(t => { t.enabled = nowOn; });
      socketRef.current?.emit("video:toggle", { video: nowOn, audio: !muted });
      return nowOn;
    });
  };

  const toggleScreenShare = async () => {
    if (screenSharing) {
      // Stop screen share
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setScreenSharing(false);
      socketRef.current?.emit("video:screen_share_stop");
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = screenStream;
        setScreenSharing(true);
        socketRef.current?.emit("video:screen_share_start");
        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0];
        Object.values(peers.current).forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === "video");
          if (sender) sender.replaceTrack(videoTrack);
        });
        videoTrack.onended = () => toggleScreenShare();
      } catch {}
    }
  };

  const toggleHand = () => {
    setHandRaised(prev => {
      socketRef.current?.emit("video:raise_hand", { raised: !prev });
      return !prev;
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
      const stream = e.streams[0];
      if (!stream) return;

      // Update remoteStreams state for video rendering
      setRemoteStreams(prev => ({ ...prev, [targetSocketId]: stream }));

      // Also maintain legacy audio element for audio-only fallback
      if (!stream.getVideoTracks().length) {
        let audio = audioEls.current[targetSocketId];
        if (!audio) {
          audio = document.createElement("audio");
          audio.autoplay = true;
          audio.setAttribute("playsinline", "true");
          document.body.appendChild(audio);
          audioEls.current[targetSocketId] = audio;
        }
        if (audio.srcObject !== stream) {
          audio.srcObject = stream;
          audio.play().catch(() => {});
        }
      }
    };

    pc.onicecandidate = e => {
      if (e.candidate) {
        socketRef.current?.emit("voice_ice", { to: targetSocketId, candidate: e.candidate });
        socketRef.current?.emit("video:ice",  { targetSocketId,    candidate: e.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        cleanupPeer(targetSocketId);
        setRemoteStreams(prev => { const n = { ...prev }; delete n[targetSocketId]; return n; });
      }
    };

    if (isInitiator) {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      socketRef.current?.emit("voice_offer", { to: targetSocketId, offer });
      socketRef.current?.emit("video:offer",  { targetSocketId,    sdp: offer });
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

      {/* SECTION TOGGLE — Live Class vs Live IDE */}
      <div style={s.sectionToggle}>
        <button
          style={{ ...s.sectionBtn, ...(section === "class" ? s.sectionBtnActive : {}) }}
          onClick={() => setSection("class")}
        >
          🎓 Live Class
        </button>
        <button
          style={{ ...s.sectionBtn, ...(section === "ide" ? s.sectionBtnActive : {}) }}
          onClick={() => setSection("ide")}
        >
          🖥️ Live IDE
        </button>
      </div>

      {/* LIVE IDE — engineering simulation workspace, independent of the
          classroom socket since all execution is client-side */}
      {section === "ide" && (
        <div style={{ flex: 1, minHeight: 0 }}>
          <LiveIDEPanel embedded />
        </div>
      )}

      {/* TOOLBAR */}
      {section === "class" && panel === "board" && (
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
      {section === "class" && (
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
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:8, background:"var(--surface)", borderRadius:10, padding:"10px 12px" }}>
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

        {/* VIDEO / VOICE PANEL — Full Live Video Session */}
        {panel === "voice" && (
          <VideoPanel
            role={role}
            participants={participants}
            voiceActive={voiceActive}
            muted={muted}
            videoOn={videoOn}
            localStream={localStream}
            remoteStreams={remoteStreams}
            screenSharing={screenSharing}
            handRaised={handRaised}
            onJoin={startVideo}
            onLeave={stopVoice}
            onMute={toggleMute}
            onToggleVideo={toggleVideo}
            onScreenShare={toggleScreenShare}
            onRaiseHand={toggleHand}
            onMuteStudent={(sid) => socketRef.current?.emit("video:mute_student", { targetSocketId: sid })}
          />
        )}
      </div>
      )}

      {/* BOTTOM NAV — Live Class panels only; Live IDE has its own sub-tabs */}
      {section === "class" && (
      <nav style={s.bottomNav}>
        {[
          { id:"board",        icon:"✏️",  label:"Board" },
          { id:"chat",         icon:"💬",  label:"Chat",   badge: unreadChat },
          { id:"participants", icon:"👥",  label:"People", badge: pendingJoins.length },
          { id:"voice",        icon: videoOn ? "📹" : voiceActive ? "🎙️" : "🎤", label: videoOn ? "Video" : "Voice" },
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
      )}
    </div>
  );
}

const sc = {
  centred: { minHeight:"100vh", background:"#0f0c29", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", fontFamily:"sans-serif", color:"#fff", padding:24, textAlign:"center" },
  backBtn: { marginTop:20, padding:"12px 32px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer" },
};

const s = {
  page:          { maxWidth:480, margin:"0 auto", height:"100vh", background:"var(--surface)", fontFamily:"'Segoe UI',sans-serif", display:"flex", flexDirection:"column" },
  topBar:        { background:"#2d2d44", padding:"10px 14px", display:"flex", alignItems:"center", gap:10, flexShrink:0 },
  topTitle:      { fontWeight:800, fontSize:15, color:"#fff" },
  topSub:        { fontSize:11, color:"var(--text-muted)", marginTop:2, display:"flex", alignItems:"center", gap:4, flexWrap:"wrap" },
  codeSpan:      { fontFamily:"monospace", fontWeight:900, color:"#a29bfe", letterSpacing:2 },
  topBtn:        { border:"none", borderRadius:8, padding:"7px 14px", fontWeight:700, fontSize:13, cursor:"pointer", color:"#fff", flexShrink:0 },
  sectionToggle: { display:"flex", background:"#1a1a2e", flexShrink:0 },
  sectionBtn:    { flex:1, padding:"9px 8px", background:"none", border:"none", borderBottom:"3px solid transparent", color:"#8b9cbd", fontWeight:800, fontSize:12.5, cursor:"pointer" },
  sectionBtnActive: { color:"#fff", borderBottom:"3px solid #a29bfe", background:"#232342" },
  toolbar:       { background:"#252540", padding:"6px 10px", display:"flex", flexWrap:"wrap", gap:5, alignItems:"center", borderBottom:"1px solid #3d3d5c", flexShrink:0 },
  toolGroup:     { display:"flex", gap:4, alignItems:"center" },
  toolBtn:       { width:30, height:30, border:"1px solid #3d3d5c", borderRadius:6, background:"var(--surface)", color:"#fff", cursor:"pointer", fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", padding:0 },
  toolActive:    { background:"#6c63ff", borderColor:"#6c63ff" },
  sizeBtn:       { width:26, height:26, border:"1px solid #3d3d5c", borderRadius:6, background:"var(--surface)", color:"#fff", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0 },
  main:          { flex:1, overflow:"hidden", position:"relative" },
  boardContainer:{ width:"100%", height:"100%", position:"absolute", top:0, left:0, background:"#fff", overflow:"hidden" },
  canvas:        { width:"100%", height:"100%", touchAction:"none", display:"block", userSelect:"none" },
  viewOnlyBadge: { position:"absolute", top:8, left:"50%", transform:"translateX(-50%)", background:"rgba(0,0,0,0.55)", color:"#fff", fontSize:11, padding:"4px 14px", borderRadius:20, zIndex:10, whiteSpace:"nowrap", pointerEvents:"none" },
  questionBanner:{ position:"absolute", top:8, left:8, right:8, background:"#6c63ff", color:"#fff", borderRadius:12, padding:"12px 14px", zIndex:20, boxShadow:"0 4px 20px rgba(0,0,0,0.3)" },
  chatPanel:     { height:"100%", display:"flex", flexDirection:"column", background:"var(--surface)" },
  chatMessages:  { flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 },
  chatEmpty:     { textAlign:"center", color:"#b2bec3", padding:"40px 20px", fontSize:14 },
  chatBubble:    { padding:"9px 13px", borderRadius:12, fontSize:14, lineHeight:1.4, boxShadow:"0 1px 4px rgba(0,0,0,0.08)" },
  chatInputRow:  { display:"flex", gap:8, padding:"10px 14px", background:"#252540", borderTop:"1px solid #3d3d5c", flexShrink:0 },
  chatInput:     { flex:1, padding:"10px 12px", border:"2px solid #3d3d5c", borderRadius:10, fontSize:14, outline:"none", background:"var(--surface)", color:"#fff" },
  sendBtn:       { padding:"10px 16px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" },
  scrollPanel:   { height:"100%", overflowY:"auto", background:"var(--surface)", padding:"16px" },
  participantRow:{ display:"flex", alignItems:"center", gap:12, background:"#2d2d44", borderRadius:12, padding:"12px 14px", marginBottom:8 },
  pAvatar:       { width:40, height:40, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 },
  miniBtn:       { background:"#6c63ff", color:"#fff", border:"none", borderRadius:6, width:28, height:28, cursor:"pointer", fontSize:12 },
  voiceBtn:      { padding:"12px 24px", border:"none", borderRadius:12, fontWeight:800, fontSize:14, cursor:"pointer", color:"#fff" },
  bottomNav:     { display:"flex", background:"#2d2d44", borderTop:"1px solid #3d3d5c", flexShrink:0 },
  navBtn:        { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"8px 0", background:"none", border:"none", color:"var(--text-muted)", cursor:"pointer", gap:1 },
  navActive:     { color:"#a29bfe" },
};


// ── VIDEO PANEL COMPONENT ─────────────────────────────────────
function VideoPanel({ role, participants, voiceActive, muted, videoOn, localStream, remoteStreams,
                      screenSharing, handRaised, onJoin, onLeave, onMute, onToggleVideo, onScreenShare, onRaiseHand, onMuteStudent }) {
  const localVideoRef = React.useRef(null);

  React.useEffect(() => {
    if (localVideoRef.current && localStream?.current) {
      localVideoRef.current.srcObject = localStream.current;
    }
  }, [videoOn, voiceActive, localStream]);

  const streamEntries = Object.entries(remoteStreams || {});

  const s = {
    wrap:  { display:"flex", flexDirection:"column", height:"100%", background:"#0B1020", overflow:"hidden" },
    grid:  { flex:1, display:"grid", gridTemplateColumns: streamEntries.length > 1 ? "1fr 1fr" : "1fr", gap:4, padding:4, overflowY:"auto" },
    tile:  { position:"relative", background:"#151B2E", borderRadius:12, overflow:"hidden", aspectRatio:"4/3", display:"flex", alignItems:"center", justifyContent:"center" },
    video: { width:"100%", height:"100%", objectFit:"cover", borderRadius:12 },
    name:  { position:"absolute", bottom:8, left:10, color:"#fff", fontSize:11, fontWeight:700, background:"rgba(0,0,0,0.5)", borderRadius:6, padding:"2px 8px" },
    muted: { position:"absolute", top:8, right:8, background:"rgba(0,0,0,0.5)", borderRadius:20, padding:"3px 7px", fontSize:10 },
    hand:  { position:"absolute", top:8, left:8, fontSize:16 },
    bar:   { display:"flex", gap:8, padding:"10px 12px", background:"#151B2E", borderTop:"1px solid rgba(255,255,255,0.08)", justifyContent:"center", flexWrap:"wrap" },
    btn:   (bg, active) => ({ padding:"8px 14px", background: active ? bg : "rgba(255,255,255,0.08)", color: active ? "#fff" : "#8b9cbd", border:"none", borderRadius:10, cursor:"pointer", fontWeight:700, fontSize:12, transition:"all 0.15s" }),
    avatar:{ width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 },
  };

  if (!voiceActive) return (
    <div style={{ ...s.wrap, alignItems:"center", justifyContent:"center", gap:20 }}>
      <div style={{ fontSize:60 }}>📹</div>
      <div style={{ color:"#e0e6ff", fontWeight:800, fontSize:18 }}>Join Live Session</div>
      <div style={{ color:"#8b9cbd", fontSize:13, textAlign:"center", maxWidth:280 }}>Connect with audio only or enable your camera for full video.</div>
      <div style={{ display:"flex", gap:10 }}>
        <button onClick={() => onJoin(false)} style={{ padding:"12px 22px", background:"#7c5cff", color:"#fff", border:"none", borderRadius:12, fontWeight:800, cursor:"pointer", fontSize:14 }}>🎤 Audio Only</button>
        <button onClick={() => onJoin(true)}  style={{ padding:"12px 22px", background:"#00d084", color:"#fff", border:"none", borderRadius:12, fontWeight:800, cursor:"pointer", fontSize:14 }}>📹 Join with Video</button>
      </div>
    </div>
  );

  return (
    <div style={s.wrap}>
      <div style={s.grid}>
        {/* Local tile */}
        <div style={{ ...s.tile, border: "2px solid #7c5cff" }}>
          {videoOn
            ? <video ref={localVideoRef} autoPlay muted playsInline style={s.video} />
            : <div style={s.avatar}><div style={{ fontSize:36 }}>{role === "teacher" ? "👨‍🏫" : "👤"}</div><div style={{ color:"#e0e6ff", fontSize:12, fontWeight:700 }}>You</div></div>
          }
          <div style={s.name}>You {role === "teacher" ? "(Teacher)" : ""}</div>
          <div style={s.muted}>{muted ? "🔇" : "🎙️"}</div>
          {handRaised && <div style={s.hand}>✋</div>}
        </div>

        {/* Remote tiles */}
        {streamEntries.map(([sid, stream]) => {
          const participant = participants.find(p => p.socketId === sid);
          return (
            <RemoteVideoTile key={sid} stream={stream} participant={participant} role={role} onMute={() => onMuteStudent(sid)} />
          );
        })}

        {/* Offline participants (joined but no stream yet) */}
        {participants.filter(p => !remoteStreams?.[p.socketId]).map((p, i) => (
          <div key={i} style={s.tile}>
            <div style={s.avatar}><div style={{ fontSize:36 }}>{p.role === "teacher" ? "👨‍🏫" : "👤"}</div><div style={{ color:"#e0e6ff", fontSize:12, fontWeight:700 }}>{p.name}</div><div style={{ color:"#6b7db3", fontSize:10 }}>No camera</div></div>
            {p.handRaised && <div style={s.hand}>✋</div>}
          </div>
        ))}
      </div>

      {/* CONTROLS BAR */}
      <div style={s.bar}>
        <button onClick={onMute}         style={s.btn("#e17055", !muted)}>       {muted ? "🔇 Unmute" : "🎙️ Mute"}</button>
        <button onClick={onToggleVideo}  style={s.btn("#7c5cff", videoOn)}>      {videoOn ? "📹 Stop Cam" : "📷 Camera"}</button>
        <button onClick={onScreenShare}  style={s.btn("#0984e3", screenSharing)}>{screenSharing ? "🖥️ Stop Share" : "🖥️ Share Screen"}</button>
        <button onClick={onRaiseHand}    style={s.btn("#fdcb6e", handRaised)}>   {handRaised ? "✋ Lower Hand" : "✋ Raise Hand"}</button>
        <button onClick={onLeave}        style={s.btn("#e17055", true)}>         📵 Leave</button>
      </div>
    </div>
  );
}

function RemoteVideoTile({ stream, participant, role, onMute }) {
  const videoRef = React.useRef(null);
  React.useEffect(() => {
    if (videoRef.current && stream) { videoRef.current.srcObject = stream; }
  }, [stream]);
  const hasVideo = stream?.getVideoTracks().some(t => t.enabled);
  const s = {
    tile:  { position:"relative", background:"#151B2E", borderRadius:12, overflow:"hidden", aspectRatio:"4/3", display:"flex", alignItems:"center", justifyContent:"center" },
    video: { width:"100%", height:"100%", objectFit:"cover" },
    name:  { position:"absolute", bottom:8, left:10, color:"#fff", fontSize:11, fontWeight:700, background:"rgba(0,0,0,0.5)", borderRadius:6, padding:"2px 8px" },
    hand:  { position:"absolute", top:8, left:8, fontSize:16 },
  };
  return (
    <div style={s.tile}>
      {hasVideo
        ? <video ref={videoRef} autoPlay playsInline style={s.video} />
        : <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <div style={{ fontSize:36 }}>{participant?.role === "teacher" ? "👨‍🏫" : "👤"}</div>
            <div style={{ color:"#e0e6ff", fontSize:12, fontWeight:700 }}>{participant?.name || "Student"}</div>
          </div>
      }
      <div style={s.name}>{participant?.name || "Student"}</div>
      {participant?.handRaised && <div style={s.hand}>✋</div>}
      {role === "teacher" && <button onClick={onMute} style={{ position:"absolute", top:6, right:6, background:"rgba(0,0,0,0.5)", border:"none", color:"#fff", borderRadius:8, padding:"3px 8px", cursor:"pointer", fontSize:10 }}>Mute</button>}
    </div>
  );
}
