import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import API from "../utils/api";
import TTSButton from "../components/TTSButton";

const DIFFICULTIES = ["easy","medium","hard"];
const COUNTS = [3,5,8,10];

export default function AIQuestions() {
  const nav = useNavigate();
  const back           = useBackNav();
  const [subjects, setSubjects]     = useState([]);
  const [subject, setSubject]       = useState("");
  const [topic, setTopic]           = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount]           = useState(5);
  const [loading, setLoading]       = useState(false);

  const [questions, setQuestions]   = useState([]);
  const [batchId, setBatchId]       = useState(null);
  const [answers, setAnswers]       = useState({});
  const [reveals, setReveals]       = useState({});   // per-index { correct_answer, explanation } fetched from server
  const [results, setResults]       = useState(null);  // set after grading: { results, score, total, percentage }
  const [submitted, setSubmitted]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [cached, setCached]         = useState(false);

  useState(() => {
    API.get("/ai-questions/subjects")
      .then(r => { setSubjects(r.data.subjects || []); setSubject(r.data.subjects?.[0] || ""); })
      .catch(() => {});
  });

  const generate = async () => {
    if (!subject) return;
    setLoading(true);
    setQuestions([]); setAnswers({}); setReveals({}); setResults(null); setSubmitted(false); setBatchId(null);
    try {
      const r = await API.post("/ai-questions/generate", { subject, topic: topic||undefined, difficulty, count });
      setQuestions(r.data.questions || []);
      setBatchId(r.data.batch_id ?? null);
      setCached(r.data.cached || false);
    } catch (err) {
      alert(err?.response?.data?.error || "Failed to generate questions. Please try again.");
    }
    setLoading(false);
  };

  const pick = (qi, opt) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qi]: opt }));
  };

  const revealOne = async (qi) => {
    if (reveals[qi] || !batchId) return;
    try {
      const r = await API.post("/ai-questions/reveal", { batch_id: batchId, index: qi });
      setReveals(prev => ({ ...prev, [qi]: r.data }));
    } catch {
      alert("Couldn't fetch the answer. Please try again.");
    }
  };

  const submitAll = async () => {
    if (!batchId || submitting) return;
    setSubmitting(true);
    try {
      const r = await API.post("/ai-questions/grade", { batch_id: batchId, answers });
      setResults(r.data);
      setSubmitted(true);
    } catch {
      alert("Couldn't grade your answers. Please try again.");
    }
    setSubmitting(false);
  };

  const score = results?.score ?? 0;
  const pct   = results?.percentage ?? 0;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => back()} style={s.backBtn}>← Back</button>
        <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:"#f0f4ff" }}>✨ AI Questions</h1>
        <span style={{ fontSize:11, color:"#a29bfe", background:"rgba(108,99,255,0.2)", padding:"2px 8px", borderRadius:20, fontWeight:700 }}>BETA</span>
      </div>

      <div style={{ maxWidth:700, margin:"0 auto", padding:"16px 12px 80px" }}>
        {/* Generator card */}
        <div style={s.card}>
          <h3 style={{ color:"#f0f4ff", fontWeight:700, margin:"0 0 4px" }}>Generate Fresh Practice Questions</h3>
          <p style={{ color:"#636e72", fontSize:13, margin:"0 0 16px" }}>
            ScholarAI writes brand-new JAMB-style questions on any topic — never the same set twice.
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={s.label}>Subject *</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} style={s.select}>
                {subjects.map(su => <option key={su} value={su}>{su}</option>)}
              </select>
            </div>
            <div>
              <label style={s.label}>Topic (optional)</label>
              <input value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. Quadratic equations" style={s.input} />
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:16 }}>
            <div>
              <label style={s.label}>Difficulty</label>
              <div style={{ display:"flex", gap:6 }}>
                {DIFFICULTIES.map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    style={{ flex:1, padding:"7px 4px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700,
                      background: difficulty===d ? diffColor(d)+"33" : "transparent",
                      color: difficulty===d ? diffColor(d) : "#636e72",
                      border: `1px solid ${difficulty===d ? diffColor(d) : "rgba(255,255,255,0.08)"}` }}>
                    {d.charAt(0).toUpperCase()+d.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={s.label}>Number of Questions</label>
              <div style={{ display:"flex", gap:6 }}>
                {COUNTS.map(c => (
                  <button key={c} onClick={() => setCount(c)}
                    style={{ flex:1, padding:"7px 4px", borderRadius:8, cursor:"pointer", fontSize:12, fontWeight:700,
                      background: count===c ? "rgba(108,99,255,0.25)" : "transparent",
                      color: count===c ? "#a29bfe" : "#636e72",
                      border: `1px solid ${count===c ? "#6c63ff" : "rgba(255,255,255,0.08)"}` }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button onClick={generate} disabled={loading || !subject}
            style={{ ...s.btnPrimary, width:"100%", opacity: loading||!subject ? 0.6 : 1 }}>
            {loading ? "✨ Generating questions..." : "✨ Generate Questions"}
          </button>
          {cached && <p style={{ color:"#636e72", fontSize:11, textAlign:"center", marginTop:6 }}>Loaded from cache · questions refresh every 24h</p>}
        </div>

        {/* Score summary (after submit) */}
        {submitted && questions.length > 0 && (
          <div style={{ ...s.card, textAlign:"center", border:`1px solid ${pct>=70?"#00b894":"#e17055"}44`,
            background: pct>=70 ? "rgba(0,184,148,0.08)" : "rgba(225,112,85,0.08)" }}>
            <div style={{ fontSize:48, marginBottom:8 }}>{pct>=90?"🔥":pct>=70?"✅":pct>=50?"😅":"📚"}</div>
            <h2 style={{ color: pct>=70?"#00b894":"#e17055", fontWeight:800, fontSize:28, margin:"0 0 4px" }}>{pct}%</h2>
            <p style={{ color:"#b2bec3", margin:"0 0 12px" }}>{score}/{questions.length} correct</p>
            <button onClick={generate} style={s.btnPrimary}>Generate New Set</button>
          </div>
        )}

        {/* Questions */}
        {questions.map((q, qi) => {
          const chosen     = answers[qi];
          const qResult    = results?.results?.[qi];               // present once graded
          const correct    = qResult?.correct_answer ?? reveals[qi]?.correct_answer;
          const explanation= qResult?.explanation ?? reveals[qi]?.explanation;
          const isCorrect  = submitted && qResult?.is_correct;
          const isWrong    = submitted && chosen && qResult && !qResult.is_correct;
          const show       = submitted || !!reveals[qi];

          return (
            <div key={qi} style={s.qCard}>
              {/* Meta */}
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  <span style={s.metaTag}>Q{qi+1}</span>
                  {q.topic && <span style={s.metaTag}>{q.topic}</span>}
                  <span style={{ ...s.metaTag, color:diffColor(q.difficulty||difficulty) }}>{q.difficulty||difficulty}</span>
                  <span style={{ ...s.metaTag, background:"rgba(108,99,255,0.15)", color:"#a29bfe" }}>✨ AI</span>
                </div>
                <TTSButton question={q.question} options={{ A:q.option_a, B:q.option_b, C:q.option_c, D:q.option_d }} />
              </div>

              <p style={s.qText}>{q.question}</p>

              {/* Options */}
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:14 }}>
                {["A","B","C","D"].map(opt => {
                  const val       = q[`option_${opt.toLowerCase()}`];
                  const isCh      = chosen === opt;
                  const isCorr    = show && correct === opt;
                  const isWr      = show && isCh && correct !== opt;
                  return (
                    <div key={opt} onClick={() => pick(qi, opt)}
                      style={{
                        ...s.option,
                        border: isCorr ? "2px solid #00b894" : isWr ? "2px solid #e17055" : isCh ? "2px solid #6c63ff" : "1px solid rgba(255,255,255,0.09)",
                        background: isCorr ? "rgba(0,184,148,0.12)" : isWr ? "rgba(225,112,85,0.1)" : isCh ? "rgba(108,99,255,0.12)" : "transparent",
                        cursor: submitted ? "default" : "pointer",
                      }}>
                      <span style={{ ...s.optLabel,
                        background: isCorr ? "#00b894" : isWr ? "#e17055" : isCh ? "#6c63ff" : "rgba(255,255,255,0.06)",
                        color: (isCorr||isWr||isCh) ? "#fff" : "#a29bfe" }}>
                        {opt}
                      </span>
                      <span style={{ flex:1, fontSize:14, color:"#f0f4ff" }}>{val}</span>
                      {isCorr && <span>✅</span>}
                      {isWr   && <span>❌</span>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {show && explanation && (
                <div style={s.explanation}>
                  💡 <strong>Explanation:</strong> {explanation}
                </div>
              )}

              {/* Reveal button (before submit) */}
              {!submitted && chosen && !reveals[qi] && (
                <button onClick={() => revealOne(qi)} style={{ ...s.btnSecondary, marginTop:10, fontSize:12, padding:"6px 14px" }}>
                  Show Answer
                </button>
              )}

              {/* Result badge */}
              {submitted && (
                <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
                  {isCorrect && <span style={{ color:"#00b894", fontWeight:700, fontSize:13 }}>✅ Correct!</span>}
                  {isWrong   && <span style={{ color:"#e17055", fontWeight:700, fontSize:13 }}>❌ Incorrect — correct answer: <strong>{correct}</strong></span>}
                  {!chosen   && <span style={{ color:"#fdcb6e", fontWeight:700, fontSize:13 }}>⚠ Not answered</span>}
                </div>
              )}
            </div>
          );
        })}

        {/* Submit button */}
        {questions.length > 0 && !submitted && (
          <div style={{ display:"flex", justifyContent:"center", marginTop:8 }}>
            <button onClick={submitAll} disabled={submitting} style={{ ...s.btnPrimary, padding:"14px 40px", opacity: submitting ? 0.6 : 1 }}>
              {submitting ? "Grading..." : `Submit Answers (${Object.keys(answers).length}/${questions.length})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function diffColor(d) {
  return d==="easy" ? "#00b894" : d==="hard" ? "#e17055" : "#fdcb6e";
}

const s = {
  page:        { minHeight:"100vh", background:"var(--bg,#0f0f1e)", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#f0f4ff" },
  header:      { background:"var(--surface,#1a1a2e)", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.07)", position:"sticky", top:0, zIndex:100 },
  backBtn:     { background:"none", border:"none", color:"#a29bfe", cursor:"pointer", fontSize:14, fontWeight:600 },
  card:        { background:"var(--surface,#1a1a2e)", borderRadius:14, padding:"18px 16px", border:"1px solid rgba(255,255,255,0.07)", marginBottom:16 },
  qCard:       { background:"var(--surface,#1a1a2e)", borderRadius:14, padding:"18px 16px", border:"1px solid rgba(255,255,255,0.07)", marginBottom:12 },
  label:       { display:"block", color:"#b2bec3", fontSize:12, fontWeight:600, marginBottom:6 },
  select:      { width:"100%", background:"#0f0f1e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#f0f4ff", padding:"9px 10px", fontSize:13, outline:"none", cursor:"pointer" },
  input:       { width:"100%", background:"#0f0f1e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#f0f4ff", padding:"9px 10px", fontSize:13, outline:"none", boxSizing:"border-box" },
  qText:       { fontSize:15, lineHeight:1.75, color:"#f0f4ff", margin:0 },
  metaTag:     { fontSize:11, padding:"2px 8px", borderRadius:6, background:"rgba(255,255,255,0.06)", color:"#74b9ff" },
  option:      { display:"flex", alignItems:"center", gap:12, padding:"11px 13px", borderRadius:10, transition:"all 0.15s" },
  optLabel:    { width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0 },
  explanation: { marginTop:14, background:"rgba(0,184,148,0.1)", border:"1px solid rgba(0,184,148,0.2)", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#f0f4ff", lineHeight:1.6 },
  btnPrimary:  { background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, padding:"12px 24px", fontWeight:700, cursor:"pointer", fontSize:14 },
  btnSecondary:{ background:"transparent", color:"#a29bfe", border:"1px solid rgba(108,99,255,0.3)", borderRadius:8, padding:"8px 16px", fontWeight:600, cursor:"pointer", fontSize:13 },
};
