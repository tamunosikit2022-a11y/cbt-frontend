import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../../utils/api";

// FIX (new feature): past classes previously vanished the moment they
// ended — the whiteboard and chat only ever lived in the classroom
// server's in-memory session object. classroomEngine.js now archives both
// to the database when a class ends (see classroom_history.sql /
// classroomRoutes.js `/session/:code/archive`), and this page is the
// read-only viewer for that archive: it redraws every stroke/text item in
// order onto a canvas and lists out the chat log, so a class really can be
// "revisited" afterwards.
export default function ClassroomReplay() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const code = params.get("code") || "";

  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [data,    setData]    = useState(null);
  const [tab,     setTab]     = useState("board"); // board | chat

  const canvasRef = useRef(null);

  useEffect(() => {
    if (!code) { setError("No class code given."); setLoading(false); return; }
    API.get(`/classroom/session/${code}/archive`)
      .then(r => setData(r.data))
      .catch(err => setError(err.response?.data?.error || "Couldn't load this class."))
      .finally(() => setLoading(false));
  }, [code]);

  const drawArchive = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);

    (data.board || []).forEach(item => {
      if (item.type === "stroke") {
        const d = item.data;
        ctx.globalCompositeOperation = d.tool === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = d.tool === "eraser" ? "rgba(0,0,0,1)" : d.color;
        ctx.lineWidth   = d.tool === "eraser" ? d.size * 5 : d.size;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(d.fx * w, d.fy * h);
        ctx.lineTo(d.tx * w, d.ty * h);
        ctx.stroke();
        ctx.globalCompositeOperation = "source-over";
      } else if (item.type === "text") {
        const d = item.data;
        ctx.font = `${d.size}px 'Segoe UI', sans-serif`;
        ctx.fillStyle = d.color;
        ctx.fillText(d.text, d.x * w, d.y * h);
      }
    });
  }, [data]);

  useEffect(() => {
    if (tab === "board" && data) setTimeout(drawArchive, 60);
  }, [tab, data, drawArchive]);

  useEffect(() => {
    const onResize = () => tab === "board" && drawArchive();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [tab, drawArchive]);

  if (loading) return <div style={s.center}>Loading class…</div>;
  if (error)   return (
    <div style={s.center}>
      <p style={{ color:"#e17055", fontWeight:700 }}>⚠️ {error}</p>
      <button style={s.backBtn} onClick={() => nav("/classroom")}>← Back to Scholar Sessions</button>
    </div>
  );

  const sess = data.session;

  return (
    <div style={s.page}>
      <div style={{ ...s.header, background: `linear-gradient(135deg,#1a1a2e,${sess.themeColor || "#6c63ff"})` }}>
        <button style={s.back} onClick={() => nav("/classroom")}>←</button>
        <div style={{ fontSize: 24 }}>{sess.icon || "📚"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={s.headerTitle}>{sess.title}</div>
          <div style={s.headerSub}>
            {sess.subject} · by {sess.teacherName}
            {sess.endedAt ? ` · ${new Date(sess.endedAt).toLocaleDateString()}` : ""}
          </div>
        </div>
      </div>

      {sess.description && <div style={s.descBox}>{sess.description}</div>}

      <div style={s.tabs}>
        <button style={{ ...s.tab, ...(tab === "board" ? s.tabActive : {}) }} onClick={() => setTab("board")}>✏️ Whiteboard</button>
        <button style={{ ...s.tab, ...(tab === "chat"  ? s.tabActive : {}) }} onClick={() => setTab("chat")}>💬 Chat ({(data.chat || []).length})</button>
      </div>

      {tab === "board" && (
        <div style={s.boardWrap}>
          <canvas ref={canvasRef} style={s.canvas} />
          {(!data.board || !data.board.length) && (
            <div style={s.emptyOverlay}>Nothing was drawn on the board in this class.</div>
          )}
        </div>
      )}

      {tab === "chat" && (
        <div style={s.chatWrap}>
          {(!data.chat || !data.chat.length) && (
            <div style={{ textAlign:"center", color:"#b2bec3", padding:"30px 0" }}>No chat messages in this class.</div>
          )}
          {(data.chat || []).map((m, i) => (
            <div key={i} style={s.chatMsg}>
              <div style={{ fontWeight:800, fontSize:12.5, color: sess.themeColor || "#6c63ff" }}>{m.name || m.senderName}</div>
              <div style={{ fontSize:14, color:"#2d3436" }}>{m.text || m.message}</div>
            </div>
          ))}
        </div>
      )}

      <div style={s.readOnlyNote}>📼 This is a read-only replay — you're viewing an archived class.</div>
    </div>
  );
}

const s = {
  page:        { maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#f4f6fb", fontFamily:"'Segoe UI',sans-serif", paddingBottom:40 },
  center:      { minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:14, padding:20, textAlign:"center" },
  backBtn:     { padding:"10px 18px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer" },
  header:      { padding:"16px 18px", display:"flex", alignItems:"center", gap:12, color:"#fff" },
  back:        { background:"rgba(255,255,255,.15)", border:"none", color:"#fff", borderRadius:10, width:36, height:36, fontSize:18, cursor:"pointer", flexShrink:0 },
  headerTitle: { fontSize:16, fontWeight:900, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  headerSub:   { fontSize:11.5, opacity:0.85, marginTop:2 },
  descBox:     { margin:"12px 16px 0", padding:"12px 14px", background:"#fff", borderRadius:12, fontSize:13, color:"#636e72", lineHeight:1.5 },
  tabs:        { display:"flex", gap:8, margin:"16px 16px 10px" },
  tab:         { flex:1, padding:"10px 0", border:"2px solid #dfe6e9", borderRadius:10, fontWeight:700, fontSize:13.5, cursor:"pointer", background:"#fff", color:"#636e72" },
  tabActive:   { background:"#6c63ff", color:"#fff", borderColor:"#6c63ff" },
  boardWrap:   { margin:"0 16px", position:"relative", height:420, background:"#fff", borderRadius:14, overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,0.07)" },
  canvas:      { width:"100%", height:"100%", display:"block", touchAction:"none" },
  emptyOverlay:{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", color:"#b2bec3", fontSize:13, textAlign:"center", padding:20 },
  chatWrap:    { margin:"0 16px", background:"#fff", borderRadius:14, padding:"14px 16px", boxShadow:"0 2px 16px rgba(0,0,0,0.07)", maxHeight:420, overflowY:"auto" },
  chatMsg:     { padding:"8px 0", borderBottom:"1px solid #f5f5f5" },
  readOnlyNote:{ textAlign:"center", fontSize:12, color:"#b2bec3", margin:"14px 16px 0" },
};
