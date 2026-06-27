import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

export default function ErrorReview() {
  const nav = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers,   setAnswers]   = useState({});
  const [revealed,  setRevealed]  = useState({});
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState("");
  const [subjects,  setSubjects]  = useState([]);

  // Examiner Breakdown state
  const [breakdowns,    setBreakdowns]    = useState({}); // qId -> text
  const [breakdownLoad, setBreakdownLoad] = useState({}); // qId -> bool
  const [breakdownErr,  setBreakdownErr]  = useState({}); // qId -> error string

  useEffect(() => {
    API.get("/exam/wrong-answers")
      .then(r => {
        setQuestions(r.data);
        setSubjects([...new Set(r.data.map(q => q.subject))]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? questions.filter(q => q.subject === filter) : questions;

  const selectAnswer = (qId, opt) => {
    setAnswers(a => ({ ...a, [qId]: opt }));
    setRevealed(r => ({ ...r, [qId]: true }));
  };

  const getExaminerBreakdown = async (q) => {
    if (breakdowns[q.id] || breakdownLoad[q.id]) return;
    setBreakdownLoad(b => ({ ...b, [q.id]: true }));
    setBreakdownErr(e => ({ ...e, [q.id]: null }));
    try {
      const r = await API.post("/exam/examiner-breakdown", {
        question_id: q.id,
        chosen_answer: answers[q.id] || q.chosen_answer || null,
      });
      setBreakdowns(b => ({ ...b, [q.id]: r.data.breakdown }));
    } catch (err) {
      if (err.response?.status === 402) {
        setBreakdownErr(e => ({ ...e, [q.id]: "Not enough tokens for Examiner's Breakdown. Visit the Tokens page to top up." }));
      } else {
        setBreakdownErr(e => ({ ...e, [q.id]: "Couldn't load explanation. Try again." }));
      }
    }
    setBreakdownLoad(b => ({ ...b, [q.id]: false }));
  };

  if (loading) return (
    <div style={s.page}>
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#636e72" }}>Loading your wrong answers...</p>
      </div>
    </div>
  );

  if (questions.length === 0) return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
        <div style={s.empty}>
          <div style={{ fontSize: 60 }}>🎉</div>
          <h3 style={{ color: "#f0f4ff" }}>No wrong answers!</h3>
          <p style={{ color: "#636e72" }}>You haven't gotten anything wrong yet — or you've corrected everything.</p>
          <button style={s.btn} onClick={() => nav("/exam-select")}>Take an Exam</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      <div style={s.container}>
        <div style={s.topRow}>
          <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
          <h2 style={s.title}>🔁 Error Review</h2>
        </div>

        <div style={s.summary}>
          <span style={{ fontWeight: 700, color: "#e17055" }}>{questions.length} questions</span> need your attention
        </div>

        {subjects.length > 1 && (
          <div style={s.filterRow}>
            <button style={{ ...s.filterBtn, background: !filter ? "#6c63ff" : "var(--surface,#1a1a2e)", color: !filter ? "#fff" : "#a29bfe" }} onClick={() => setFilter("")}>All</button>
            {subjects.map(sub => (
              <button key={sub}
                style={{ ...s.filterBtn, background: filter === sub ? "#6c63ff" : "var(--surface,#1a1a2e)", color: filter === sub ? "#fff" : "#a29bfe" }}
                onClick={() => setFilter(sub)}>{sub}</button>
            ))}
          </div>
        )}

        <div style={s.questionList}>
          {filtered.map((q, i) => {
            const selected   = answers[q.id];
            const isRevealed = revealed[q.id];
            const isCorrect  = selected === q.correct_answer;

            return (
              <div key={q.id} style={s.qCard}>
                <div style={s.qHeader}>
                  <div>
                    <span style={s.subjectTag}>{q.subject}</span>
                    {q.topic && <span style={s.topicTag}>{q.topic}</span>}
                  </div>
                  <span style={s.wrongCount}>❌ Wrong {q.times_wrong}×</span>
                </div>

                <p style={s.qText}>{i + 1}. {q.question}</p>

                <div style={s.options}>
                  {["A","B","C","D"].map(opt => {
                    const isCorrectOpt  = opt === q.correct_answer;
                    const isSelectedOpt = opt === selected;
                    let bg = "transparent", color = "#f0f4ff", border = "rgba(255,255,255,0.1)";
                    if (isRevealed) {
                      if (isCorrectOpt)                       { bg = "rgba(0,184,148,0.12)"; color = "#00b894"; border = "#00b894"; }
                      else if (isSelectedOpt && !isCorrectOpt) { bg = "rgba(225,112,85,0.12)"; color = "#e17055"; border = "#e17055"; }
                    } else if (isSelectedOpt) {
                      bg = "rgba(108,99,255,0.12)"; border = "#6c63ff";
                    }
                    return (
                      <div key={opt}
                        style={{ ...s.option, background: bg, borderColor: border, color }}
                        onClick={() => !isRevealed && selectAnswer(q.id, opt)}>
                        <span style={{ ...s.optLabel, background: border === "rgba(255,255,255,0.1)" ? "var(--surface,#2d3436)" : border, color: border === "rgba(255,255,255,0.1)" ? "#a29bfe" : "#fff" }}>{opt}</span>
                        {q[`option_${opt.toLowerCase()}`]}
                      </div>
                    );
                  })}
                </div>

                {!isRevealed ? (
                  <button style={s.revealBtn} onClick={() => setRevealed(r => ({ ...r, [q.id]: true }))}>Show Answer</button>
                ) : (
                  <div style={s.resultBox}>
                    <div style={{ fontWeight: 700, color: isCorrect ? "#00b894" : "#e17055", marginBottom: 6 }}>
                      {isCorrect ? "✅ Correct this time!" : `❌ Correct answer: ${q.correct_answer}`}
                    </div>
                    {q.explanation && <div style={s.explanation}>💡 {q.explanation}</div>}

                    {/* Examiner's Breakdown */}
                    {!breakdowns[q.id] && (
                      <button
                        onClick={() => getExaminerBreakdown(q)}
                        disabled={breakdownLoad[q.id]}
                        style={s.examinerBtn}>
                        {breakdownLoad[q.id] ? "🧑‍🏫 Thinking..." : "🧑‍🏫 Explain Like a JAMB Examiner (1 token)"}
                      </button>
                    )}
                    {breakdownErr[q.id] && (
                      <div style={s.breakdownErr}>{breakdownErr[q.id]}</div>
                    )}
                    {breakdowns[q.id] && (
                      <div style={s.breakdownBox}>
                        <div style={{ fontWeight: 700, color: "#a29bfe", marginBottom: 6, fontSize: 13 }}>🧑‍🏫 Examiner's Breakdown</div>
                        <div style={{ whiteSpace: "pre-wrap" }}>{breakdowns[q.id]}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const s = {
  page:         { minHeight: "100vh", background: "var(--bg, #0f0f1e)", fontFamily: "'Plus Jakarta Sans', sans-serif", padding: 16, color: "#f0f4ff" },
  container:    { maxWidth: 720, margin: "0 auto" },
  topRow:       { display: "flex", alignItems: "center", gap: 16, marginBottom: 12 },
  back:         { background: "none", border: "none", color: "#a29bfe", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  title:        { fontSize: 22, fontWeight: 800, color: "#f0f4ff", margin: 0 },
  summary:      { background: "rgba(225,112,85,0.1)", border: "1px solid rgba(225,112,85,0.25)", borderRadius: 8, padding: "10px 16px", marginBottom: 14, fontSize: 14, color: "#f0f4ff" },
  filterRow:    { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  filterBtn:    { padding: "6px 14px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12 },
  questionList: { display: "flex", flexDirection: "column", gap: 14 },
  qCard:        { background: "var(--surface,#1a1a2e)", borderRadius: 14, padding: "18px 16px", border: "1px solid rgba(255,255,255,0.07)" },
  qHeader:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  subjectTag:   { background: "rgba(108,99,255,0.15)", color: "#a29bfe", padding: "2px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, marginRight: 6 },
  topicTag:     { background: "rgba(255,255,255,0.06)", color: "#74b9ff", padding: "2px 8px", borderRadius: 8, fontSize: 11 },
  wrongCount:   { fontSize: 12, color: "#e17055", fontWeight: 700 },
  qText:        { fontSize: 15, lineHeight: 1.7, color: "#f0f4ff", marginBottom: 14 },
  options:      { display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 },
  option:       { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "1px solid", borderRadius: 10, cursor: "pointer", fontSize: 14 },
  optLabel:     { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 },
  revealBtn:    { width: "100%", padding: 10, background: "rgba(108,99,255,0.12)", color: "#a29bfe", border: "1px solid #6c63ff", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  resultBox:    { background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "12px 14px" },
  explanation:  { fontSize: 13, color: "#f0f4ff", lineHeight: 1.6, marginTop: 4, background: "rgba(0,184,148,0.1)", borderRadius: 6, padding: "8px 10px" },
  examinerBtn:  { width: "100%", marginTop: 10, padding: "10px 12px", background: "rgba(162,155,254,0.12)", color: "#a29bfe", border: "1px solid rgba(162,155,254,0.35)", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 },
  breakdownBox: { marginTop: 10, fontSize: 13, color: "#f0f4ff", lineHeight: 1.6, background: "rgba(162,155,254,0.08)", border: "1px solid rgba(162,155,254,0.2)", borderRadius: 8, padding: "10px 12px" },
  breakdownErr: { marginTop: 8, fontSize: 12, color: "#e17055" },
  empty:        { textAlign: "center", padding: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  btn:          { padding: "12px 28px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 15 },
};
