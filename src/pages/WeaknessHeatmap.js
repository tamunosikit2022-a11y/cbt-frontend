import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const STRENGTH_COLOR = {
  strong: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#10b981", label: "Strong" },
  medium: { bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.35)", text: "#f59e0b", label: "Average" },
  weak:   { bg: "rgba(239,68,68,0.12)",  border: "rgba(239,68,68,0.35)",  text: "#ef4444", label: "Weak" },
};

export default function WeaknessHeatmap() {
  const nav  = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    API.get("/exam/heatmap")
      .then(r => setData(r.data))
      .catch(e => setError(e.response?.data?.error || "Failed to load heatmap."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Screen><Spinner /></Screen>;
  if (error)   return <Screen><Err msg={error} onBack={() => nav(-1)} /></Screen>;

  const { heatmap = [] } = data || {};
  const weak   = heatmap.filter(s => s.strength === "weak");
  const medium = heatmap.filter(s => s.strength === "medium");
  const strong = heatmap.filter(s => s.strength === "strong");

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <button style={s.back} onClick={() => nav(-1)}>←</button>
        <div>
          <h1 style={s.title}>Subject Heatmap</h1>
          <p style={s.sub}>Tap a subject to see your weakest topics</p>
        </div>
      </div>

      {heatmap.length === 0 ? (
        <div style={s.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
          <p style={{ color: "#94a3b8" }}>Complete some exams to see your heatmap!</p>
          <button style={s.btn} onClick={() => nav("/exam-select")}>Start Practicing →</button>
        </div>
      ) : (
        <div style={s.content}>

          {/* SUMMARY ROW */}
          <div style={s.summaryRow}>
            <SummaryCard icon="🔴" label="Need Work" count={weak.length}   color="#ef4444" />
            <SummaryCard icon="🟡" label="Average"   count={medium.length} color="#f59e0b" />
            <SummaryCard icon="🟢" label="Strong"    count={strong.length} color="#10b981" />
          </div>

          {/* WEAK SUBJECTS FIRST */}
          {["weak","medium","strong"].map(level => {
            const group = heatmap.filter(s => s.strength === level);
            if (!group.length) return null;
            const col = STRENGTH_COLOR[level];
            return (
              <div key={level} style={{ marginBottom: 24 }}>
                <div style={s.groupLabel}>
                  <span style={{ ...s.dot, background: col.text }} />
                  {col.label} ({group.length})
                </div>
                {group.map(subj => (
                  <SubjectCard
                    key={subj.subject}
                    subj={subj}
                    col={col}
                    expanded={expanded === subj.subject}
                    onToggle={() => setExpanded(expanded === subj.subject ? null : subj.subject)}
                    onPractice={() => nav(`/exam?exam_type=JAMB&subject=${encodeURIComponent(subj.subject)}&mode=weakness`)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SubjectCard({ subj, col, expanded, onToggle, onPractice }) {
  const pct = Math.round(subj.accuracy || 0);
  return (
    <div style={{ ...s.card, borderColor: col.border, background: col.bg, marginBottom: 10 }}>
      <div style={s.cardTop} onClick={onToggle}>
        <div style={{ flex: 1 }}>
          <div style={s.subjName}>{subj.subject}</div>
          <div style={s.subjStats}>
            {subj.total_attempted} questions · {subj.wrong_count} still wrong
          </div>
          {/* Accuracy bar */}
          <div style={s.barTrack}>
            <div style={{ ...s.barFill, width: `${pct}%`, background: col.text }} />
          </div>
        </div>
        <div style={{ textAlign: "right", minWidth: 56 }}>
          <div style={{ ...s.pct, color: col.text }}>{pct}%</div>
          <div style={s.pctLabel}>accuracy</div>
          <div style={{ ...s.chevron, transform: expanded ? "rotate(180deg)" : "none" }}>▾</div>
        </div>
      </div>

      {expanded && (
        <div style={s.expanded}>
          {subj.weak_topics?.length > 0 ? (
            <>
              <div style={s.topicTitle}>🎯 Weakest topics:</div>
              {subj.weak_topics.map((t, i) => (
                <div key={i} style={s.topicRow}>
                  <span style={{ color: "#ef4444", fontSize: 11 }}>#{i+1}</span>
                  <span style={s.topicName}>{t.topic}</span>
                  <span style={s.topicWrong}>{t.times_wrong}× wrong</span>
                </div>
              ))}
            </>
          ) : (
            <div style={{ color: "#64748b", fontSize: 13 }}>No topic data yet — keep practicing!</div>
          )}
          <button style={{ ...s.btn, marginTop: 12, width: "100%" }} onClick={onPractice}>
            Practice {subj.subject} →
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, count, color }) {
  return (
    <div style={{ ...s.summaryCard, borderColor: color + "40" }}>
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color }}>{count}</div>
      <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
    </div>
  );
}

function Screen({ children }) {
  return <div style={{ minHeight:"100vh", background:"#0B1020", display:"flex", alignItems:"center", justifyContent:"center" }}>{children}</div>;
}
function Spinner() {
  return <div style={{ color:"#7C5CFF", fontSize:14 }}>Loading heatmap...</div>;
}
function Err({ msg, onBack }) {
  return (
    <div style={{ textAlign:"center" }}>
      <div style={{ fontSize:36 }}>❌</div>
      <p style={{ color:"#ef4444", margin:"12px 0" }}>{msg}</p>
      <button style={s.btn} onClick={onBack}>← Go Back</button>
    </div>
  );
}

const s = {
  page:       { minHeight:"100vh", background:"#0B1020", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#F1F5F9", paddingBottom: 40 },
  header:     { background:"#141c2e", padding:"16px 20px", display:"flex", gap:14, alignItems:"flex-start", borderBottom:"1px solid rgba(255,255,255,0.07)", position:"sticky", top:0, zIndex:10 },
  back:       { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:18, flexShrink:0 },
  title:      { fontSize:18, fontWeight:800, color:"#fff" },
  sub:        { fontSize:13, color:"#64748b", marginTop:2 },
  content:    { padding:"20px 16px" },
  empty:      { textAlign:"center", padding:"60px 20px" },
  summaryRow: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:24 },
  summaryCard:{ background:"#141c2e", border:"1px solid", borderRadius:12, padding:"14px 10px", textAlign:"center" },
  groupLabel: { display:"flex", alignItems:"center", gap:8, fontSize:12, fontWeight:700, color:"#94a3b8", textTransform:"uppercase", letterSpacing:".05em", marginBottom:8 },
  dot:        { width:8, height:8, borderRadius:"50%", flexShrink:0 },
  card:       { borderRadius:12, border:"1px solid", padding:"14px 16px", cursor:"pointer" },
  cardTop:    { display:"flex", gap:12, alignItems:"flex-start" },
  subjName:   { fontSize:15, fontWeight:700, color:"#F1F5F9", marginBottom:3 },
  subjStats:  { fontSize:12, color:"#64748b", marginBottom:8 },
  barTrack:   { height:4, background:"rgba(255,255,255,0.08)", borderRadius:2, overflow:"hidden" },
  barFill:    { height:4, borderRadius:2, transition:"width .4s ease" },
  pct:        { fontSize:20, fontWeight:800, lineHeight:1 },
  pctLabel:   { fontSize:10, color:"#64748b", marginTop:2 },
  chevron:    { fontSize:16, color:"#64748b", marginTop:4, transition:"transform .2s", display:"block" },
  expanded:   { marginTop:14, paddingTop:14, borderTop:"1px solid rgba(255,255,255,0.08)" },
  topicTitle: { fontSize:12, fontWeight:700, color:"#94a3b8", marginBottom:8 },
  topicRow:   { display:"flex", gap:8, alignItems:"center", padding:"6px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" },
  topicName:  { flex:1, fontSize:13, color:"#e2e8f0" },
  topicWrong: { fontSize:11, color:"#ef4444", fontWeight:600 },
  btn:        { background:"#7C5CFF", color:"#fff", border:"none", borderRadius:10, padding:"11px 20px", fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" },
};
