import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../utils/api";

// ── JAMB DATA ─────────────────────────────────────────────
// All available JAMB subjects (English is always compulsory)
const JAMB_ALL_SUBJECTS = [
  "Biology", "Chemistry", "Physics", "Mathematics",
  "Agriculture", "Economics", "Government", "Geography",
  "Literature in English", "Christian Religious Knowledge",
  "Islamic Religious Knowledge", "Commerce", "Accounting",
  "Further Mathematics", "History", "French", "Arabic",
  "Home Economics", "Music", "Fine Arts", "Technical Drawing",
  "Food and Nutrition",
];

// Suggested combinations by course type (for guidance only)
const JAMB_COURSE_GUIDES = [
  { label: "Medicine / Pharmacy / Nursing",    subjects: ["Biology","Chemistry","Physics"] },
  { label: "Engineering / Technology",          subjects: ["Physics","Chemistry","Mathematics"] },
  { label: "Agriculture / Veterinary Science", subjects: ["Biology","Chemistry","Agriculture"] },
  { label: "Law / Mass Comm / Social Science", subjects: ["Literature in English","Government","Economics"] },
  { label: "Accounting / Business Admin",      subjects: ["Economics","Government","Accounting"] },
  { label: "Mathematics / Computer Science",   subjects: ["Physics","Chemistry","Mathematics"] },
  { label: "Arts / Theatre / Linguistics",     subjects: ["Literature in English","Government","Christian Religious Knowledge"] },
  { label: "Commercial / Economics",           subjects: ["Economics","Mathematics","Commerce"] },
];

// ── POST-UTME DATA ─────────────────────────────────────────
// Real exam formats per university
const UNIVERSITIES = {
  UNILAG:   { name:"Univ. of Lagos",          state:"Lagos",       questions:40,  time:30,  englishFixed:true,  mathFixed:true,  subjectCount:3, note:"English (20q) + Maths (10q) + General Paper (10q) · 30 mins · Online CBT" },
  UI:       { name:"Univ. of Ibadan",         state:"Oyo",         questions:100, time:45,  englishFixed:true,  mathFixed:false, subjectCount:4, note:"English + 3 JAMB subjects · 25 questions each · 100 total · 45 mins · aggregate = JAMB÷8 + Post-UTME÷2 + O'Level" },
  OAU:      { name:"Obafemi Awolowo Univ.",   state:"Osun",        questions:40,  time:30,  englishFixed:true,  mathFixed:false, subjectCount:5, note:"English + Current Affairs + 3 JAMB subjects · 40 questions · 30 mins" },
  UNIBEN:   { name:"Univ. of Benin",          state:"Edo",         questions:50,  time:30,  englishFixed:true,  mathFixed:false, subjectCount:4, note:"50 questions including English · graded over 100 · min 50% to qualify" },
  ABU:      { name:"Ahmadu Bello Univ.",      state:"Kaduna",      questions:100, time:60,  englishFixed:false, mathFixed:false, subjectCount:4, note:"All 4 JAMB subjects · 100 questions · 60 mins" },
  UNIPORT:  { name:"Univ. of Port Harcourt", state:"Rivers",      questions:100, time:45,  englishFixed:true,  mathFixed:false, subjectCount:4, note:"English + 3 JAMB subjects · 25 questions each · 100 total · 45 mins · scored /100" },
  UNN:      { name:"Univ. of Nigeria",        state:"Enugu",       questions:60,  time:45,  englishFixed:false, mathFixed:false, subjectCount:4, note:"4 JAMB subjects · 60 questions · 45 mins" },
  UNILORIN: { name:"Univ. of Ilorin",         state:"Kwara",       questions:60,  time:45,  englishFixed:false, mathFixed:false, subjectCount:4, note:"4 JAMB subjects · CBT screening · 60 questions · 45 mins" },
  FUTO:     { name:"Fed. Univ. of Tech.",     state:"Imo",         questions:60,  time:45,  englishFixed:false, mathFixed:false, subjectCount:3, note:"3 relevant JAMB subjects · 60 questions · 45 mins" },
  LAUTECH:  { name:"Ladoke Akintola Univ.",   state:"Oyo",         questions:60,  time:45,  englishFixed:false, mathFixed:false, subjectCount:3, note:"3 relevant subjects from JAMB combination · 60 questions · 45 mins" },
  UNIABUJA: { name:"Univ. of Abuja",          state:"FCT",         questions:60,  time:45,  englishFixed:false, mathFixed:false, subjectCount:3, note:"3 relevant subjects · 20 questions each · 45 mins" },
  UNICAL:   { name:"Univ. of Calabar",        state:"Cross River", questions:60,  time:45,  englishFixed:false, mathFixed:false, subjectCount:4, note:"4 JAMB subjects · 60 questions · 45 mins" },
  LASU:     { name:"Lagos State Univ.",        state:"Lagos",       questions:50,  time:30,  englishFixed:true,  mathFixed:false, subjectCount:3, note:"English compulsory + 2 relevant subjects · 50 questions · 30 mins" },
  DELSU:    { name:"Delta State Univ.",        state:"Delta",       questions:60,  time:45,  englishFixed:false, mathFixed:false, subjectCount:3, note:"3 JAMB subjects · 60 questions · 45 mins" },
  FUOYE:    { name:"Fed. Univ. Oye-Ekiti",    state:"Ekiti",       questions:60,  time:45,  englishFixed:false, mathFixed:false, subjectCount:3, note:"3 relevant subjects · 60 questions · 45 mins" },
};

const STUDY_MODES = [
  { id:"exam",     icon:"⏱️", label:"Exam Mode",     desc:"Timed · no answers shown" },
  { id:"study",    icon:"📖", label:"Study Mode",    desc:"Instant feedback per question" },
  { id:"weakness", icon:"🎯", label:"Weakness Mode", desc:"Your personal weak areas" },
];

// ── COMPONENT ─────────────────────────────────────────────
export default function ExamSelect() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();

  const [examType,       setExamType]       = useState(searchParams.get("type") === "POST-UTME" ? "POST-UTME" : "JAMB");
  const [jambMode,       setJambMode]       = useState("full");      // "full" | "single"
  const [selectedSubjs,  setSelectedSubjs]  = useState([]);          // user-chosen 3 subjects
  const [singleSubject,  setSingleSubject]  = useState(searchParams.get("subject") || "");
  const [mode,           setMode]           = useState("exam");
  const [university,     setUniversity]     = useState("UNILAG");
  const [postSubjects,   setPostSubjects]   = useState([]);          // chosen for POST-UTME
  const [showGuide,      setShowGuide]      = useState(false);
  const [error,          setError]          = useState("");
  const [availSubjects,  setAvailSubjects]  = useState([]);

  const uni = UNIVERSITIES[university];

  // Fetch available subjects from DB
  useEffect(() => {
    API.get(`/exam/subjects?exam_type=${examType === "JAMB" ? "JAMB" : "POST-UTME"}`)
      .then(r => setAvailSubjects(r.data || []))
      .catch(() => {});
  }, [examType]);

  // Toggle a JAMB subject (max 3)
  const toggleJambSubject = (subj) => {
    if (selectedSubjs.includes(subj)) {
      setSelectedSubjs(selectedSubjs.filter(s => s !== subj));
    } else {
      if (selectedSubjs.length >= 3) return setError("Select exactly 3 subjects (English is automatic)");
      setSelectedSubjs([...selectedSubjs, subj]);
      setError("");
    }
  };

  // Toggle POST-UTME subject
  const togglePostSubject = (subj) => {
    const needed = uni.subjectCount - (uni.englishFixed ? 1 : 0);
    if (postSubjects.includes(subj)) {
      setPostSubjects(postSubjects.filter(s => s !== subj));
    } else {
      if (postSubjects.length >= needed) return setError(`Select exactly ${needed} subject${needed > 1 ? "s" : ""}`);
      setPostSubjects([...postSubjects, subj]);
      setError("");
    }
  };

  // Apply a course guide suggestion
  const applyGuide = (guide) => {
    setSelectedSubjs(guide.subjects.slice(0, 3));
    setShowGuide(false);
    setError("");
  };

  const start = () => {
    setError("");

    if (examType === "JAMB") {
      if (jambMode === "full") {
        if (selectedSubjs.length !== 3)
          return setError("Please select exactly 3 subjects (English Language is automatic)");
        const subjects = ["English Language", ...selectedSubjs];
        nav(`/exam?exam_type=JAMB&mode=jamb_full&subjects=${encodeURIComponent(JSON.stringify(subjects))}&limit=180&time=120`);
      } else {
        if (!singleSubject) return setError("Please select a subject to practice");
        nav(`/exam?exam_type=JAMB&subject=${encodeURIComponent(singleSubject)}&mode=${mode}&limit=40&time=40&single=true`); // FIX BUG 34: add time param so single-subject gets 40min not 120min
      }
    } else {
      // POST-UTME
      const needed = uni.subjectCount - (uni.englishFixed ? 1 : 0);
      if (postSubjects.length !== needed)
        return setError(`Please select ${needed} subject${needed > 1 ? "s" : ""} for ${university}`);

      // English Language is ALWAYS included in Post-UTME
      const finalSubjects = ["English Language", ...postSubjects.filter(s => s !== "English Language")];

      // Always 25 questions per subject for Post-UTME, English always included
      const qPerSubject = 25;
      const totalQ = finalSubjects.length * qPerSubject;
      nav(`/exam?exam_type=POST-UTME&institution=${university}&mode=postutme&subjects=${encodeURIComponent(JSON.stringify(finalSubjects))}&limit=${totalQ}&time=${uni.time}&qPerSubject=${qPerSubject}`);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* Header */}
        <button style={s.back} onClick={() => nav("/dashboard")}>← Back</button>
        <h2 style={s.title}>Set Up Your Exam</h2>
        <p style={s.sub}>✅ All modes free — unlimited practice daily</p>

        {/* Exam Type */}
        <div style={s.group}>
          <label style={s.label}>Exam Type</label>
          <div style={s.tabs}>
            {[["JAMB","📘 JAMB / UTME"],["POST-UTME","🏫 Post-UTME"]].map(([val, lbl]) => (
              <button key={val}
                style={{ ...s.tab, ...(examType === val ? s.tabActive : {}) }}
                onClick={() => { setExamType(val); setError(""); setSelectedSubjs([]); setPostSubjects([]); }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* ── JAMB SECTION ── */}
        {examType === "JAMB" && (
          <>
            <div style={s.group}>
              <label style={s.label}>Practice Type</label>
              <div style={s.tabs}>
                <button style={{ ...s.tab, ...(jambMode === "full" ? s.tabActive : {}) }} onClick={() => setJambMode("full")}>
                  🎯 Full JAMB Simulation
                </button>
                <button style={{ ...s.tab, ...(jambMode === "single" ? s.tabActive : {}) }} onClick={() => setJambMode("single")}>
                  📚 Single Subject Practice
                </button>
              </div>
            </div>

            {jambMode === "full" ? (
              <>
                {/* JAMB Info Box */}
                <div style={s.infoBox}>
                  <div style={s.infoTitle}>📋 Official JAMB / UTME Format</div>
                  <div style={s.infoGrid}>
                    <InfoRow k="Total Questions" v="180" />
                    <InfoRow k="English Language" v="60 questions (compulsory)" />
                    <InfoRow k="Each other subject" v="40 questions × 3" />
                    <InfoRow k="Duration" v="2 hours (120 mins)" />
                    <InfoRow k="Max Score" v="400 points" />
                    <InfoRow k="Negative marking" v="None" />
                  </div>
                </div>

                {/* Subject Selection */}
                <div style={s.group}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                    <label style={s.label}>Choose Your 3 Subjects</label>
                    <button style={s.guideBtn} onClick={() => setShowGuide(!showGuide)}>
                      {showGuide ? "Hide" : "💡 Course Guide"}
                    </button>
                  </div>

                  {/* Fixed English badge */}
                  <div style={s.fixedSubject}>
                    🔒 English Language — Always compulsory (60 questions)
                  </div>

                  {/* Course guide dropdown */}
                  {showGuide && (
                    <div style={s.guideBox}>
                      <p style={{ fontSize:12, color:"#636e72", marginBottom:10, fontWeight:600 }}>
                        Select your intended course to auto-fill subjects:
                      </p>
                      {JAMB_COURSE_GUIDES.map((g, i) => (
                        <div key={i} style={s.guideItem} onClick={() => applyGuide(g)}>
                          <div style={{ fontWeight:700, fontSize:13 }}>{g.label}</div>
                          <div style={{ fontSize:11, color:"#636e72" }}>{g.subjects.join(" · ")}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Subject grid */}
                  <div style={s.subjectGrid}>
                    {JAMB_ALL_SUBJECTS.map(subj => {
                      const sel = selectedSubjs.includes(subj);
                      const inDB = availSubjects.includes(subj);
                      return (
                        <div key={subj}
                          style={{ ...s.subjectChip, ...(sel ? s.chipActive : {}), ...(inDB ? {} : s.chipNoData) }}
                          onClick={() => inDB && toggleJambSubject(subj)}
                          title={!inDB ? "No questions available yet" : ""}>
                          {sel ? "✓ " : ""}{subj}
                          {!inDB && <span style={{ fontSize:9, marginLeft:4, opacity:0.6 }}>soon</span>}
                        </div>
                      );
                    })}
                  </div>

                  {/* Selection summary */}
                  <div style={s.selectionSummary}>
                    <span style={{ fontWeight:700, color: selectedSubjs.length === 3 ? "#00b894" : "#6c63ff" }}>
                      {selectedSubjs.length}/3 subjects selected
                    </span>
                    {selectedSubjs.length > 0 && (
                      <span style={{ color:"#636e72", fontSize:12 }}>
                        {" "}→ English + {selectedSubjs.join(", ")}
                      </span>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div style={s.group}>
                  <label style={s.label}>Subject to Practice</label>
                  <select style={s.select} value={singleSubject} onChange={e => setSingleSubject(e.target.value)}>
                    <option value="">-- Select a subject --</option>
                    {availSubjects.map(s2 => <option key={s2} value={s2}>{s2}</option>)}
                  </select>
                  <p style={{ fontSize:12, color:"#636e72", marginTop:6 }}>40 questions · focused practice on one subject</p>
                </div>
                <ModeSelector modes={STUDY_MODES} mode={mode} setMode={setMode} />
              </>
            )}
          </>
        )}

        {/* ── POST-UTME SECTION ── */}
        {examType === "POST-UTME" && (
          <>
            {/* University picker */}
            <div style={s.group}>
              <label style={s.label}>Select University</label>
              <div style={s.uniGrid}>
                {Object.entries(UNIVERSITIES).map(([code, u]) => (
                  <div key={code}
                    style={{ ...s.uniCard, ...(university === code ? s.uniCardActive : {}) }}
                    onClick={() => { setUniversity(code); setPostSubjects([]); setError(""); }}>
                    <div style={{ fontWeight:800, fontSize:13 }}>{code}</div>
                    <div style={{ fontSize:10, color: university === code ? "#a29bfe" : "#b2bec3", marginTop:2 }}>{u.state}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* University info */}
            <div style={s.infoBox}>
              <div style={s.infoTitle}>📋 {uni.name} — Post-UTME Format</div>
              <div style={s.infoGrid}>
                <InfoRow k="Total Questions" v={String(uni.questions)} />
                <InfoRow k="Duration" v={`${uni.time} minutes`} />
                <InfoRow k="Questions per subject" v={`~${Math.floor(uni.questions / uni.subjectCount)}`} />
                <InfoRow k="Subjects tested" v={String(uni.subjectCount)} />
              </div>
              <p style={{ fontSize:12, color:"#7c6fcd", marginTop:10, fontWeight:600 }}>ℹ️ {uni.note}</p>
            </div>

            {/* Subject selection for POST-UTME */}
            <div style={s.group}>
              <div style={{ marginBottom:8 }}>
                <label style={s.label}>
                  Select {uni.subjectCount - (uni.englishFixed ? 1 : 0)} Subject{uni.subjectCount - (uni.englishFixed ? 1 : 0) > 1 ? "s" : ""}
                </label>
              </div>

              {uni.englishFixed && (
                <div style={s.fixedSubject}>🔒 English Language — Fixed for {university}</div>
              )}

              <div style={s.subjectGrid}>
                {availSubjects.filter(s2 => s2 !== "English Language").map(subj => {
                  const sel = postSubjects.includes(subj);
                  const needed = uni.subjectCount - (uni.englishFixed ? 1 : 0);
                  const disabled = !sel && postSubjects.length >= needed;
                  return (
                    <div key={subj}
                      style={{ ...s.subjectChip, ...(sel ? s.chipActive : {}), ...(disabled ? s.chipDisabled : {}) }}
                      onClick={() => !disabled && togglePostSubject(subj)}>
                      {sel ? "✓ " : ""}{subj}
                    </div>
                  );
                })}
              </div>

              <div style={s.selectionSummary}>
                <span style={{ fontWeight:700, color: postSubjects.length === (uni.subjectCount - (uni.englishFixed ? 1 : 0)) ? "#00b894" : "#6c63ff" }}>
                  {postSubjects.length}/{uni.subjectCount - (uni.englishFixed ? 1 : 0)} selected
                </span>
              </div>
            </div>

            <ModeSelector modes={STUDY_MODES} mode={mode} setMode={setMode} />
          </>
        )}

        {error && <p style={s.error}>⚠️ {error}</p>}

        <button style={{
          ...s.startBtn,
          opacity: (examType === "JAMB" && jambMode === "full" && selectedSubjs.length !== 3) ||
                   (examType === "JAMB" && jambMode === "single" && !singleSubject) ||
                   (examType === "POST-UTME" && postSubjects.length !== (uni.subjectCount - (uni.englishFixed ? 1 : 0)))
                   ? 0.5 : 1
        }} onClick={start}>
          {examType === "JAMB" && jambMode === "full"
            ? `Start Full JAMB — 180 Questions · 2 Hours →`
            : examType === "POST-UTME"
            ? `Start ${university} Post-UTME — ${uni.questions} Questions →`
            : "Start Practice →"}
        </button>

      </div>
    </div>
  );
}

// ── SUB-COMPONENTS ─────────────────────────────────────────
function InfoRow({ k, v }) {
  return (
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, padding:"4px 0", borderBottom:"1px solid #e8e4ff" }}>
      <span style={{ color:"#636e72" }}>{k}</span>
      <span style={{ fontWeight:700, color:"#2d3436" }}>{v}</span>
    </div>
  );
}

function ModeSelector({ modes, mode, setMode }) {
  return (
    <div style={{ marginBottom:22 }}>
      <label style={{ display:"block", fontWeight:700, fontSize:14, marginBottom:8, color:"#2d3436" }}>Study Mode</label>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
        {modes.map(m => (
          <div key={m.id}
            style={{ border:`2px solid ${mode === m.id ? "#6c63ff" : "#dfe6e9"}`, background:mode === m.id ? "#f0edff" : "#fff", borderRadius:10, padding:"10px 12px", cursor:"pointer", textAlign:"center" }}
            onClick={() => setMode(m.id)}>
            <div style={{ fontSize:18 }}>{m.icon}</div>
            <div style={{ fontWeight:700, fontSize:12, marginTop:4 }}>{m.label}</div>
            <div style={{ fontSize:10, color:"#636e72", marginTop:2 }}>{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────
const s = {
  page:           { minHeight:"100vh", background:"#f8f9fa", fontFamily:"sans-serif", padding:20 },
  container:      { maxWidth:700, margin:"0 auto", paddingBottom:40 },
  back:           { background:"none", border:"none", color:"#6c63ff", fontWeight:700, cursor:"pointer", fontSize:15, marginBottom:16, padding:0 },
  title:          { fontSize:26, fontWeight:900, marginBottom:4, color:"#2d3436" },
  sub:            { fontSize:13, color:"#636e72", marginBottom:24 },
  group:          { marginBottom:24 },
  label:          { display:"block", fontWeight:700, fontSize:14, marginBottom:8, color:"#2d3436" },
  tabs:           { display:"flex", gap:8, flexWrap:"wrap" },
  tab:            { padding:"10px 20px", border:"2px solid #dfe6e9", borderRadius:8, fontWeight:600, cursor:"pointer", fontSize:14, background:"#fff", color:"#636e72" },
  tabActive:      { background:"#6c63ff", color:"#fff", borderColor:"#6c63ff" },
  infoBox:        { background:"#f0edff", border:"2px solid #6c63ff", borderRadius:12, padding:"14px 16px", marginBottom:20 },
  infoTitle:      { fontWeight:800, fontSize:14, color:"#6c63ff", marginBottom:10 },
  infoGrid:       { display:"flex", flexDirection:"column", gap:0 },
  fixedSubject:   { background:"#dfe6e9", borderRadius:8, padding:"10px 14px", fontSize:13, fontWeight:600, color:"#636e72", marginBottom:12 },
  guideBtn:       { background:"#fff", border:"2px solid #6c63ff", borderRadius:8, color:"#6c63ff", fontWeight:700, fontSize:12, padding:"6px 12px", cursor:"pointer" },
  guideBox:       { background:"#fff", border:"2px solid #dfe6e9", borderRadius:10, padding:12, marginBottom:12, maxHeight:220, overflowY:"auto" },
  guideItem:      { padding:"10px 12px", borderRadius:8, cursor:"pointer", marginBottom:4, border:"1px solid #f0f0f0", transition:"background 0.15s" },
  subjectGrid:    { display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 },
  subjectChip:    { padding:"8px 14px", borderRadius:20, border:"2px solid #dfe6e9", fontSize:13, cursor:"pointer", background:"#fff", fontWeight:500, transition:"all 0.15s" },
  chipActive:     { background:"#6c63ff", color:"#fff", borderColor:"#6c63ff", fontWeight:700 },
  chipNoData:     { opacity:0.45, cursor:"not-allowed" },
  chipDisabled:   { opacity:0.4, cursor:"not-allowed" },
  selectionSummary: { background:"#f8f9fa", borderRadius:8, padding:"8px 12px", fontSize:13, marginTop:4 },
  select:         { width:"100%", padding:12, border:"2px solid #dfe6e9", borderRadius:8, fontSize:15, background:"#fff" },
  uniGrid:        { display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(100px,1fr))", gap:8 },
  uniCard:        { padding:"10px 8px", border:"2px solid #dfe6e9", borderRadius:10, cursor:"pointer", textAlign:"center", background:"#fff" },
  uniCardActive:  { background:"#2d3436", borderColor:"#2d3436", color:"#fff" },
  startBtn:       { width:"100%", padding:16, background:"linear-gradient(135deg,#6c63ff,#3f51b5)", color:"#fff", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer", marginTop:8 },
  error:          { color:"#e17055", fontSize:14, marginBottom:12, background:"#fff5f4", padding:"10px 14px", borderRadius:8, border:"1px solid #fab1a0" },
};
