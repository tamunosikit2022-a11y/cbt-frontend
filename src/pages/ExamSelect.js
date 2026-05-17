import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../utils/api";

const JAMB_COMBINATIONS = [
  { label: "Science — Physics, Chemistry, Biology",        subjects: ["Physics","Chemistry","Biology"] },
  { label: "Science — Physics, Chemistry, Mathematics",    subjects: ["Physics","Chemistry","Mathematics"] },
  { label: "Science — Physics, Chemistry, Agriculture",    subjects: ["Physics","Chemistry","Agriculture"] },
  { label: "Arts — Literature, Government, CRK",           subjects: ["Literature in English","Government","Christian Religious Knowledge"] },
  { label: "Arts — Literature, Government, Economics",     subjects: ["Literature in English","Government","Economics"] },
  { label: "Commercial — Economics, Government, Accounts", subjects: ["Economics","Government","Accounting"] },
  { label: "Commercial — Economics, Mathematics, Commerce",subjects: ["Economics","Mathematics","Commerce"] },
  { label: "Social Science — Economics, Govt, Geography",  subjects: ["Economics","Government","Geography"] },
];

const POSTUTME_FORMATS = {
  UNILAG:   { questions: 40,  time_minutes: 30, subjects_fixed: ["English Language","Mathematics","General Paper"], note: "English (20) + Maths (10) + General Paper (10) · 30 mins" },
  UI:       { questions: 100, time_minutes: 90, subjects_fixed: null, note: "100 questions from your JAMB combination · 90 mins" },
  UNIBEN:   { questions: 100, time_minutes: 60, subjects_fixed: null, note: "English ~47% + your subjects · 100 questions · 60 mins" },
  OAU:      { questions: 100, time_minutes: 60, subjects_fixed: null, note: "100 questions from your JAMB subjects · 60 mins" },
  LAUTECH:  { questions: 60,  time_minutes: 60, subjects_fixed: null, note: "60 questions from your JAMB subjects · 60 mins" },
  FUTO:     { questions: 60,  time_minutes: 45, subjects_fixed: null, note: "60 questions from your JAMB subjects · 45 mins" },
  ABU:      { questions: 60,  time_minutes: 60, subjects_fixed: null, note: "60 questions from your JAMB subjects · 60 mins" },
  DELSU:    { questions: 60,  time_minutes: 45, subjects_fixed: null, note: "60 questions from your JAMB subjects · 45 mins" },
  UNIABUJA: { questions: 60,  time_minutes: 45, subjects_fixed: null, note: "60 questions from your JAMB subjects · 45 mins" },
  UNIMAID:  { questions: 60,  time_minutes: 45, subjects_fixed: null, note: "60 questions from your JAMB subjects · 45 mins" },
};

// ALL MODES FREE
const STUDY_MODES = [
  { id: "exam",     label: "⏱️ Exam Mode",    desc: "Timed, no answers shown" },
  { id: "study",    label: "📖 Study Mode",    desc: "Instant feedback" },
  { id: "weakness", label: "🎯 Weakness Mode", desc: "Your wrong questions — FREE" },
];

export default function ExamSelect() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  // FIX BUG 5: Initialize directly from URL to prevent flash
  const [examType,     setExamType]     = useState(
    searchParams.get("type") === "POST-UTME" ? "POST-UTME" : "JAMB"
  );
  const [institution,  setInstitution]  = useState("UNILAG");
  const [combination,  setCombination]  = useState(0);
  const [subject,      setSubject]      = useState(searchParams.get("subject") || "");
  const [mode,         setMode]         = useState(searchParams.get("mode") || "exam");
  const [practiceOnly, setPracticeOnly] = useState(!!searchParams.get("subject"));
  const [allSubjects,  setAllSubjects]  = useState([]);
  const [error,        setError]        = useState("");

  const postFmt = POSTUTME_FORMATS[institution] || {};

  // Fetch subjects when exam type changes
  useEffect(() => {
    API.get(`/exam/subjects?exam_type=${examType === "JAMB" ? "JAMB" : "POST-UTME"}`)
      .then(r => setAllSubjects(r.data || []))
      .catch(err => console.error("Failed to load subjects:", err));
  }, [examType]);

  const start = () => {
    setError("");
    
    if (examType === "JAMB") {
      if (practiceOnly) {
        if (!subject) return setError("Please select a subject.");
        nav(`/exam?exam_type=JAMB&subject=${encodeURIComponent(subject)}&mode=${mode}&limit=40&single=true`);
      } else {
        const subjects = ["English Language", ...JAMB_COMBINATIONS[combination].subjects];
        nav(`/exam?exam_type=JAMB&mode=jamb_full&subjects=${encodeURIComponent(JSON.stringify(subjects))}&limit=180&time=120`);
      }
    } else {
      const fmt = POSTUTME_FORMATS[institution];
      if (!fmt) return setError("Invalid institution selected.");
      
      if (fmt.subjects_fixed) {
        nav(`/exam?exam_type=POST-UTME&institution=${institution}&mode=postutme&subjects=${encodeURIComponent(JSON.stringify(fmt.subjects_fixed))}&limit=${fmt.questions}&time=${fmt.time_minutes}`);
      } else {
        if (!subject) return setError("Please select a subject.");
        nav(`/exam?exam_type=POST-UTME&institution=${institution}&subject=${encodeURIComponent(subject)}&mode=${mode === "exam" ? "postutme" : mode}&limit=${fmt.questions}&time=${fmt.time_minutes}`);
      }
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => nav("/dashboard")}>← Back</button>
        <h2 style={s.title}>Set Up Your Exam</h2>
        <p style={{ fontSize: 13, color: "#636e72", marginBottom: 20 }}>✅ All modes are free — unlimited exams every day</p>

        <div style={s.group}>
          <label style={s.label}>Exam Type</label>
          <div style={s.tabs}>
            {["JAMB","POST-UTME"].map(t => (
              <button key={t}
                style={{ ...s.tab, background: examType === t ? "#6c63ff" : "#fff", color: examType === t ? "#fff" : "#636e72" }}
                onClick={() => { setExamType(t); setError(""); }}>
                {t === "JAMB" ? "📘 JAMB / UTME" : "🏫 Post-UTME"}
              </button>
            ))}
          </div>
        </div>

        {examType === "JAMB" && (
          <>
            <div style={s.group}>
              <label style={s.label}>Practice Type</label>
              <div style={s.tabs}>
                <button style={{ ...s.tab, background: !practiceOnly ? "#6c63ff" : "#fff", color: !practiceOnly ? "#fff" : "#636e72" }} onClick={() => setPracticeOnly(false)}>🎯 Full JAMB Simulation</button>
                <button style={{ ...s.tab, background: practiceOnly  ? "#6c63ff" : "#fff", color: practiceOnly  ? "#fff" : "#636e72" }} onClick={() => setPracticeOnly(true)}>📚 Single Subject Practice</button>
              </div>
            </div>

            {!practiceOnly ? (
              <>
                <div style={s.infoBox}>
                  <div style={s.infoTitle}>📋 Official JAMB / UTME Format</div>
                  <div style={s.infoGrid}>
                    <InfoRow k="Total Questions" v="180" />
                    <InfoRow k="English Language" v="60 questions" />
                    <InfoRow k="Each other subject" v="40 questions × 3" />
                    <InfoRow k="Duration" v="2 hours (120 mins)" />
                    <InfoRow k="Max Score" v="400 points" />
                    <InfoRow k="Negative marking" v="None" />
                  </div>
                </div>
                <div style={s.group}>
                  <label style={s.label}>Your Subject Combination</label>
                  <p style={{ fontSize: 12, color: "#636e72", marginBottom: 8 }}>English Language is always compulsory:</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {JAMB_COMBINATIONS.map((c, i) => (
                      <div key={i}
                        style={{ ...s.comboCard, borderColor: combination === i ? "#6c63ff" : "#dfe6e9", background: combination === i ? "#f0edff" : "#fff" }}
                        onClick={() => setCombination(i)}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: combination === i ? "#6c63ff" : "#2d3436" }}>{c.label}</div>
                        <div style={{ fontSize: 11, color: "#636e72", marginTop: 2 }}>English + {c.subjects.join(" + ")}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={s.group}>
                  <label style={s.label}>Subject</label>
                  <select style={s.select} value={subject} onChange={e => setSubject(e.target.value)}>
                    <option value="">-- Select subject --</option>
                    {allSubjects.map(s2 => <option key={s2} value={s2}>{s2}</option>)}
                  </select>
                </div>
                <ModeSelector modes={STUDY_MODES} mode={mode} setMode={setMode} />
              </>
            )}
          </>
        )}

        {examType === "POST-UTME" && (
          <>
            <div style={s.group}>
              <label style={s.label}>University</label>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {Object.keys(POSTUTME_FORMATS).map(inst => (
                  <button key={inst}
                    style={{ ...s.uniBtn, background: institution === inst ? "#6c63ff" : "#fff", color: institution === inst ? "#fff" : "#2d3436", borderColor: institution === inst ? "#6c63ff" : "#dfe6e9" }}
                    onClick={() => { setInstitution(inst); setSubject(""); setError(""); }}>
                    {inst}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.infoBox}>
              <div style={s.infoTitle}>📋 {institution} Post-UTME Format</div>
              <div style={s.infoGrid}>
                <InfoRow k="Questions" v={String(postFmt?.questions || "N/A")} />
                <InfoRow k="Duration" v={postFmt?.time_minutes ? `${postFmt.time_minutes} minutes` : "N/A"} />
              </div>
              <p style={{ fontSize: 12, color: "#636e72", marginTop: 8 }}>ℹ️ {postFmt?.note || "Check university website for details"}</p>
            </div>

            {!postFmt?.subjects_fixed && (
              <div style={s.group}>
                <label style={s.label}>Subject</label>
                <select style={s.select} value={subject} onChange={e => setSubject(e.target.value)}>
                  <option value="">-- Select subject --</option>
                  {allSubjects.map(s2 => <option key={s2} value={s2}>{s2}</option>)}
                </select>
              </div>
            )}
            <ModeSelector modes={STUDY_MODES} mode={mode} setMode={setMode} />
          </>
        )}

        {error && <p style={s.error}>{error}</p>}

        <button style={s.startBtn} onClick={start}>
          {examType === "JAMB" && !practiceOnly ? "Start Full JAMB Simulation (180 Questions · 2 Hours) →" : "Start Exam →"}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "3px 0" }}>
      <span style={{ color: "#636e72" }}>{k}</span>
      <span style={{ fontWeight: 700, color: "#2d3436" }}>{v}</span>
    </div>
  );
}

function ModeSelector({ modes, mode, setMode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <label style={{ display: "block", fontWeight: 700, fontSize: 14, marginBottom: 8, color: "#2d3436" }}>Mode</label>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
        {modes.map(m => (
          <div key={m.id}
            style={{ border: `2px solid ${mode === m.id ? "#6c63ff" : "#dfe6e9"}`, background: mode === m.id ? "#f0edff" : "#fff", borderRadius: 10, padding: "10px 12px", cursor: "pointer" }}
            onClick={() => setMode(m.id)}>
            <div style={{ fontWeight: 700, fontSize: 12 }}>{m.label}</div>
            <div style={{ fontSize: 11, color: "#636e72", marginTop: 2 }}>{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: "100vh", background: "#f8f9fa", fontFamily: "sans-serif", padding: 20 },
  container: { maxWidth: 680, margin: "0 auto" },
  back:      { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 15, marginBottom: 16, padding: 0 },
  title:     { fontSize: 24, fontWeight: 800, marginBottom: 4, color: "#2d3436" },
  group:     { marginBottom: 22 },
  label:     { display: "block", fontWeight: 700, fontSize: 14, marginBottom: 8, color: "#2d3436" },
  tabs:      { display: "flex", gap: 8, flexWrap: "wrap" },
  tab:       { padding: "10px 18px", border: "2px solid #dfe6e9", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 14 },
  select:    { width: "100%", padding: 12, border: "2px solid #dfe6e9", borderRadius: 8, fontSize: 15, background: "#fff" },
  infoBox:   { background: "#f0edff", border: "2px solid #6c63ff", borderRadius: 12, padding: "14px 16px", marginBottom: 20 },
  infoTitle: { fontWeight: 800, fontSize: 14, color: "#6c63ff", marginBottom: 10 },
  infoGrid:  { display: "flex", flexDirection: "column", gap: 2 },
  comboCard: { border: "2px solid", borderRadius: 10, padding: "12px 14px", cursor: "pointer" },
  uniBtn:    { padding: "8px 16px", border: "2px solid", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 },
  startBtn:  { width: "100%", padding: 15, background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer", marginTop: 8 },
  error:     { color: "#e17055", fontSize: 14, marginBottom: 8 },
};