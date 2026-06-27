import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

export default function ResumeExam() {
  const nav = useNavigate();
  const [drafts,  setDrafts]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/innovations/draft/list")
      .then(r => setDrafts(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleResume = async (draftId) => {
    try {
      const res = await API.get(`/innovations/draft/${draftId}`);
      const { draft, questions } = res.data;
      nav("/exam", {
        state: {
          resuming:           true,
          draft_id:           draftId,
          questions,
          savedAnswers:       draft.answers || {},
          timeRemaining:      draft.time_remaining_secs,
          exam_type:          draft.exam_type,
          subject:            draft.subject,
          institution:        draft.institution,
          mode:               draft.mode,
        }
      });
    } catch (e) {
      alert("Failed to load draft. It may have expired.");
    }
  };

  const handleDelete = async (draftId) => {
    if (!window.confirm("Delete this unfinished exam?")) return;
    await API.delete(`/innovations/draft/${draftId}`);
    setDrafts(d => d.filter(x => x.id !== draftId));
  };

  const formatTime = (s) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    return `${m} min${m !== 1 ? "s" : ""} remaining`;
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <p style={{ color: "#636e72" }}>⏳ Loading drafts...</p>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
        <h2 style={s.title}>📂 Resume Exam</h2>
        <p style={s.sub}>Pick up where you left off</p>

        {drafts.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize: 48 }}>📭</div>
            <p style={{ color: "#636e72" }}>No unfinished exams. When you leave an exam early, it will be saved here.</p>
            <button style={s.btn} onClick={() => nav("/exam-select")}>Start an Exam →</button>
          </div>
        ) : (
          <div style={s.list}>
            {drafts.map(d => (
              <div key={d.id} style={s.draftCard}>
                <div style={s.draftInfo}>
                  <div style={s.draftTitle}>{d.subject}</div>
                  <div style={s.draftMeta}>
                    {d.exam_type} · {d.mode}
                    {d.institution ? ` · ${d.institution}` : ""}
                  </div>
                  <div style={s.draftStats}>
                    <span>📝 {d.answered_count || 0}/{d.total_questions} answered</span>
                    <span>⏱ {formatTime(d.time_remaining_secs)}</span>
                    <span>🕐 {new Date(d.updated_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</span>
                  </div>
                  {/* Progress bar */}
                  <div style={s.progressBg}>
                    <div style={{ ...s.progressFill, width: `${d.total_questions ? (d.answered_count / d.total_questions) * 100 : 0}%` }} />
                  </div>
                </div>
                <div style={s.draftActions}>
                  <button style={s.resumeBtn} onClick={() => handleResume(d.id)}>▶ Resume</button>
                  <button style={s.deleteBtn} onClick={() => handleDelete(d.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page:         { minHeight: "100vh", background: "#f8f9fa", fontFamily: "sans-serif", padding: 16 },
  container:    { maxWidth: 640, margin: "0 auto" },
  back:         { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 8 },
  title:        { fontSize: 24, fontWeight: 800, color: "#2d3436", marginBottom: 4 },
  sub:          { color: "#636e72", fontSize: 14, marginBottom: 20 },
  list:         { display: "flex", flexDirection: "column", gap: 12 },
  draftCard:    { background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  draftInfo:    { flex: 1 },
  draftTitle:   { fontWeight: 800, fontSize: 16, color: "#2d3436", marginBottom: 2 },
  draftMeta:    { fontSize: 12, color: "#636e72", marginBottom: 6 },
  draftStats:   { display: "flex", gap: 12, fontSize: 12, color: "#636e72", flexWrap: "wrap", marginBottom: 8 },
  progressBg:   { height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", background: "#6c63ff", borderRadius: 3 },
  draftActions: { display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 },
  resumeBtn:    { padding: "10px 18px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  deleteBtn:    { padding: "8px 14px", background: "#ffeae9", color: "#e17055", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  empty:        { background: "#fff", borderRadius: 14, padding: 40, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  btn:          { padding: "11px 22px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 },
};
