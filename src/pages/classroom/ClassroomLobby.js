import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useBackNav from "../../utils/useBackNav";
import { useAuth } from "../../context/AuthContext";
import API from "../../utils/api";

export default function ClassroomLobby() {
  const nav = useNavigate();
  const back           = useBackNav();
  const { student } = useAuth();
  const [mode,      setMode]     = useState("join"); // join | create
  const [code,      setCode]     = useState("");
  const [title,     setTitle]    = useState("");
  const [subject,   setSubject]  = useState("Mathematics");
  const [sessions,  setSessions] = useState([]);
  const [error,     setError]    = useState("");
  const [loading,   setLoading]  = useState(false);

  const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","English Language","Economics","Government","Geography","Literature","Commerce"];

  useEffect(() => {
    API.get("/classroom/sessions").then(r => setSessions(r.data || [])).catch(() => {});
  }, []);

  const handleJoin = () => {
    if (!code.trim()) return setError("Enter the session code from your teacher.");
    nav(`/classroom/session?code=${code.trim().toUpperCase()}&role=student`);
  };

  const handleCreate = () => {
    if (!title.trim()) return setError("Enter a session title.");
    nav(`/classroom/session?role=teacher&title=${encodeURIComponent(title)}&subject=${encodeURIComponent(subject)}`);
  };

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => back()}>←</button>
        <div>
          <div style={s.headerTitle}>📚 Scholar Sessions</div>
          <div style={s.headerSub}>Live virtual classroom</div>
        </div>
      </div>

      <div style={s.body}>
        {/* Mode tabs */}
        <div style={s.tabs}>
          <button style={{ ...s.tab, ...(mode === "join" ? s.tabActive : {}) }} onClick={() => { setMode("join"); setError(""); }}>
            🚪 Join Session
          </button>
          <button style={{ ...s.tab, ...(mode === "create" ? s.tabActive : {}) }} onClick={() => { setMode("create"); setError(""); }}>
            ➕ Create Session
          </button>
        </div>

        {/* JOIN */}
        {mode === "join" && (
          <div style={s.card}>
            <div style={s.cardIcon}>🔑</div>
            <h3 style={s.cardTitle}>Enter Session Code</h3>
            <p style={s.cardSub}>Ask your teacher for the 6-character code</p>
            <input
              style={s.input}
              placeholder="e.g. ABC123"
              value={code}
              maxLength={6}
              onChange={e => setCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
            />
            <div style={{ fontSize:12, color: code.length === 6 ? "#00b894" : "#b2bec3", textAlign:"center", marginBottom:12, fontWeight:600 }}>
              {code.length}/6 {code.length === 6 ? "✓ Ready" : ""}
            </div>
            {error && <p style={s.error}>⚠️ {error}</p>}
            <button style={{ ...s.btn, opacity: code.length !== 6 ? 0.6 : 1 }} onClick={handleJoin} disabled={code.length !== 6}>
              Join Now →
            </button>

            {/* Active sessions */}
            {sessions.length > 0 && (
              <>
                <div style={s.divider}>or join an active session below</div>
                {sessions.map(s2 => (
                  <div key={s2.code} style={s.sessionRow} onClick={() => setCode(s2.code)}>
                    <div style={s.sessionAvatar}>📚</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{s2.title}</div>
                      <div style={{ fontSize:12, color:"#636e72" }}>by {s2.teacher_name} · {s2.subject}</div>
                    </div>
                    <div style={s.sessionCode}>{s2.code}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* CREATE */}
        {mode === "create" && (
          <div style={s.card}>
            <div style={s.cardIcon}>🎓</div>
            <h3 style={s.cardTitle}>Create a Session</h3>
            <p style={s.cardSub}>Students will join with your session code</p>

            <label style={s.label}>Session Title</label>
            <input style={s.input} placeholder="e.g. JAMB Maths — Quadratic Equations" value={title} onChange={e => setTitle(e.target.value)} />

            <label style={s.label}>Subject</label>
            <select style={s.input} value={subject} onChange={e => setSubject(e.target.value)}>
              {SUBJECTS.map(s2 => <option key={s2} value={s2}>{s2}</option>)}
            </select>

            <div style={s.featureList}>
              {["✏️ Whiteboard with marker & eraser","💬 Live text chat","🎤 Voice communication","📋 Share JAMB questions","👥 Up to 50 students","🔒 You control who can draw"].map((f,i) => (
                <div key={i} style={s.featureRow}><span style={{ color:"#00b894" }}>✓</span> {f}</div>
              ))}
            </div>

            {error && <p style={s.error}>⚠️ {error}</p>}
            <button style={s.btn} onClick={handleCreate}>Create & Start Session →</button>
          </div>
        )}

        {/* Info */}
        <div style={s.infoBox}>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:8 }}>📖 What is Scholar Sessions?</div>
          <p style={{ fontSize:13, color:"#636e72", margin:0, lineHeight:1.6 }}>
            A live virtual classroom where teachers explain topics on a digital whiteboard while students follow along, ask questions in chat, and communicate by voice — all inside the app.
          </p>
        </div>
      </div>
    </div>
  );
}

const s = {
  page:        { maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#f4f6fb", fontFamily:"'Segoe UI',sans-serif" },
  header:      { background:"linear-gradient(135deg,#1a1a2e,#6c63ff)", padding:"16px 18px", display:"flex", alignItems:"center", gap:12, color:"#fff" },
  back:        { background:"var(--border)", border:"none", color:"#fff", borderRadius:10, width:36, height:36, fontSize:18, cursor:"pointer", flexShrink:0 },
  headerTitle: { fontSize:18, fontWeight:900 },
  headerSub:   { fontSize:11, opacity:0.8, marginTop:2 },
  body:        { padding:"16px 16px 80px" },
  tabs:        { display:"flex", gap:8, marginBottom:16 },
  tab:         { flex:1, padding:"11px 0", border:"2px solid #dfe6e9", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", background:"#fff", color:"#636e72" },
  tabActive:   { background:"#6c63ff", color:"#fff", borderColor:"#6c63ff" },
  card:        { background:"#fff", borderRadius:18, padding:"24px 20px", boxShadow:"0 2px 16px rgba(0,0,0,0.07)", marginBottom:16 },
  cardIcon:    { fontSize:40, textAlign:"center", marginBottom:8 },
  cardTitle:   { fontWeight:900, fontSize:18, textAlign:"center", margin:"0 0 4px", color:"#2d3436" },
  cardSub:     { fontSize:13, color:"#636e72", textAlign:"center", margin:"0 0 20px" },
  label:       { display:"block", fontWeight:700, fontSize:13, color:"#2d3436", marginBottom:6 },
  input:       { width:"100%", padding:"13px 14px", border:"2px solid #dfe6e9", borderRadius:10, fontSize:16, textAlign:"center", letterSpacing:4, boxSizing:"border-box", marginBottom:8, fontFamily:"monospace", fontWeight:700, color:"#2d3436" },
  btn:         { width:"100%", padding:14, background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer" },
  error:       { color:"#e17055", fontSize:13, marginBottom:10, background:"#fff5f4", padding:"10px 14px", borderRadius:8 },
  divider:     { textAlign:"center", color:"#b2bec3", fontSize:12, margin:"16px 0", borderTop:"1px solid #f0f0f0", paddingTop:12 },
  sessionRow:  { display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:"1px solid #f5f5f5", cursor:"pointer" },
  sessionAvatar:{ width:40, height:40, background:"#f0edff", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 },
  sessionCode: { background:"#6c63ff", color:"#fff", borderRadius:8, padding:"4px 10px", fontWeight:800, fontSize:13, fontFamily:"monospace" },
  featureList: { background:"#f8f9fa", borderRadius:10, padding:"12px 14px", marginBottom:16 },
  featureRow:  { display:"flex", gap:8, fontSize:13, marginBottom:6, color:"#2d3436" },
  infoBox:     { background:"linear-gradient(135deg,#1a1a2e,#2d3436)", borderRadius:16, padding:"18px", color:"#fff" },
};
