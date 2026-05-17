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

  useEffect(() => {
    API.get("/exam/wrong-answers")
      .then(r => {
        setQuestions(r.data);
        setSubjects([...new Set(r.data.map(q => q.subject))]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter ? questions.filter(q => q.subject === filter) : questions;

  const selectAnswer = (qId, opt) => {
    setAnswers(a => ({ ...a, [qId]: opt }));
    setRevealed(r => ({ ...r, [qId]: true }));
  };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <p style={{ color: "#636e72" }}>Loading your wrong answers...</p>
    </div>
  );

  if (questions.length === 0) return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
        <div style={s.empty}>
          <div style={{ fontSize: 60 }}>🎉</div>
          <h3>No wrong answers!</h3>
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
            <button style={{ ...s.filterBtn, background: !filter ? "#6c63ff" : "#fff", color: !filter ? "#fff" : "#636e72" }} onClick={() => setFilter("")}>All</button>
            {subjects.map(sub => (
              <button key={sub}
                style={{ ...s.filterBtn, background: filter === sub ? "#6c63ff" : "#fff", color: filter === sub ? "#fff" : "#636e72" }}
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
                    let bg = "#f8f9fa", color = "#2d3436", border = "#dfe6e9";
                    if (isRevealed) {
                      if (isCorrectOpt)                     { bg = "#e8f8f5"; color = "#00b894"; border = "#00b894"; }
                      else if (isSelectedOpt && !isCorrectOpt) { bg = "#ffeae9"; color = "#e17055"; border = "#e17055"; }
                    } else if (isSelectedOpt) {
                      bg = "#f0edff"; border = "#6c63ff";
                    }
                    return (
                      <div key={opt}
                        style={{ ...s.option, background: bg, borderColor: border, color }}
                        onClick={() => !isRevealed && selectAnswer(q.id, opt)}>
                        <span style={{ ...s.optLabel, background: border === "#dfe6e9" ? "#e0e0e0" : border, color: border === "#dfe6e9" ? "#636e72" : "#fff" }}>{opt}</span>
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
  page:         { minHeight: "100vh", background: "#f8f9fa", fontFamily: "sans-serif", padding: 16 },
  container:    { maxWidth: 720, margin: "0 auto" },
  topRow:       { display: "flex", alignItems: "center", gap: 16, marginBottom: 12 },
  back:         { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  title:        { fontSize: 22, fontWeight: 800 },
  summary:      { background: "#fff5f5", border: "1px solid #fab1a0", borderRadius: 8, padding: "10px 16px", marginBottom: 14, fontSize: 14 },
  filterRow:    { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  filterBtn:    { padding: "6px 14px", border: "2px solid #dfe6e9", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 12 },
  questionList: { display: "flex", flexDirection: "column", gap: 14 },
  qCard:        { background: "#fff", borderRadius: 14, padding: "18px 16px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  qHeader:      { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  subjectTag:   { background: "#f0edff", color: "#6c63ff", padding: "2px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, marginRight: 6 },
  topicTag:     { background: "#f0f0f0", color: "#636e72", padding: "2px 8px", borderRadius: 8, fontSize: 11 },
  wrongCount:   { fontSize: 12, color: "#e17055", fontWeight: 700 },
  qText:        { fontSize: 15, lineHeight: 1.7, color: "#2d3436", marginBottom: 14 },
  options:      { display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 },
  option:       { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", border: "2px solid", borderRadius: 10, cursor: "pointer", fontSize: 14 },
  optLabel:     { width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 },
  revealBtn:    { width: "100%", padding: 10, background: "#f0edff", color: "#6c63ff", border: "2px solid #6c63ff", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  resultBox:    { background: "#f8f9fa", borderRadius: 8, padding: "12px 14px" },
  explanation:  { fontSize: 13, color: "#2d3436", lineHeight: 1.6, marginTop: 4, background: "#e8f8f5", borderRadius: 6, padding: "8px 10px" },
  empty:        { textAlign: "center", padding: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
  btn:          { padding: "12px 28px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 15 },
};
