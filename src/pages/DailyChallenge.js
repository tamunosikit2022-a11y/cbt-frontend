import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import API from "../utils/api";

export default function DailyChallenge() {
  const nav = useNavigate();
  const back           = useBackNav();
  const [challenge,  setChallenge]  = useState(null);
  const [questions,  setQuestions]  = useState([]);
  const [answers,    setAnswers]    = useState({});
  const [current,    setCurrent]    = useState(0);
  const [result,     setResult]     = useState(null);
  const [history,    setHistory]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tab,        setTab]        = useState("challenge"); // challenge | history
  const [timeLeft,   setTimeLeft]   = useState(120);
  const [error,      setError]      = useState("");
  const timerRef = useRef(null);
  const answersRef = useRef({});
  
  // FIX BUG 5: Add submit lock ref to prevent double submission
  const submitLock = useRef(false);

  useEffect(() => { answersRef.current = answers; }, [answers]);

  // Load today's challenge and history
  useEffect(() => {
    setLoading(true);
    setError("");
    
    Promise.all([
      API.get("/innovations/challenge/today").catch(err => {
        console.error("Failed to load challenge:", err);
        throw new Error(err.response?.data?.error || "Failed to load today's challenge");
      }),
      API.get("/innovations/challenge/history").catch(err => {
        console.error("Failed to load history:", err);
        return { data: [] }; // Return empty array for history on error
      })
    ])
      .then(([challengeRes, historyRes]) => {
        const challengeData = challengeRes.data;
        setChallenge(challengeData.challenge);
        
        if (challengeData.already_done) {
          // FIX BUG 4: Correct data path - already_done data is merged into challenge
          setResult({
            already_done: true,
            score: challengeData.challenge.score,
            total: challengeData.challenge.total_q,
            percentage: challengeData.challenge.percentage
          });
        } else {
          setQuestions(challengeData.questions || []);
          // Set time limit based on number of questions (12 seconds per question)
          setTimeLeft((challengeData.questions?.length || 10) * 12);
        }
        
        const historyData = Array.isArray(historyRes.data) ? historyRes.data : [];
        setHistory(historyData);
      })
      .catch(err => {
        setError(err.message || "Failed to load daily challenge");
      })
      .finally(() => setLoading(false));
  }, []);

  // Timer effect
  useEffect(() => {
    if (!questions.length || result) return;
    
    // Clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          // FIX BUG 5: Timer will trigger handleSubmit which now has submitLock
          handleSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [questions, result]);

  // FIX BUG 5: Updated handleSubmit with submitLock
  const handleSubmit = async (auto = false) => {
    // Prevent double submission with lock
    if (submitLock.current) return;
    if (submitting || result) return;
    
    if (!auto) {
      const unanswered = questions.length - Object.keys(answersRef.current).length;
      if (unanswered > 0) {
        const ok = window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`);
        if (!ok) return;
      }
    }
    
    submitLock.current = true;
    clearInterval(timerRef.current);
    setSubmitting(true);
    
    const payload = questions.map(q => ({ 
      question_id: q.id, 
      selected_answer: answersRef.current[q.id] || null 
    }));
    
    try {
      const res = await API.post("/innovations/challenge/submit", { 
        challenge_id: challenge.id, 
        answers: payload 
      });
      setResult(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.error || "Submit failed. Please try again.";
      setError(errorMsg);
      alert(errorMsg);
    } finally { 
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  const formatTime = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

  const today    = new Date().toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });
  const answered = Object.keys(answers).length;

  if (loading) return <Loader text="Loading today's challenge..." />;
  
  if (error && !challenge) {
    return (
      <div style={s.page}>
        <div style={s.container}>
          <button style={s.back} onClick={() => back()}>← Dashboard</button>
          <div style={s.doneCard}>
            <div style={{ fontSize: 48 }}>⚠️</div>
            <h2 style={{ color: "#fff", fontWeight: 800 }}>Error</h2>
            <p style={{ color: "#e17055" }}>{error}</p>
            <button style={s.practiceBtn} onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => back()}>← Dashboard</button>

        <div style={s.header}>
          <div>
            <h1 style={s.title}>🎯 Daily Challenge</h1>
            <p style={s.sub}>{today}</p>
          </div>
          {challenge && (
            <div style={s.subjectBadge}>
              <span style={{ fontSize: 11, color: "#a29bfe" }}>Today's Subject</span>
              <span style={{ fontWeight: 800, color: "#fff" }}>{challenge.subject}</span>
            </div>
          )}
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          {[["challenge","🎯 Today"],["history","📅 History"]].map(([id,label]) => (
            <button key={id} style={{ ...s.tab, background: tab === id ? "#6c63ff" : "#fff", color: tab === id ? "#fff" : "#636e72" }} onClick={() => setTab(id)}>{label}</button>
          ))}
        </div>

        {/* ── CHALLENGE TAB ── */}
        {tab === "challenge" && (
          <>
            {/* ALREADY DONE */}
            {result?.already_done && (
              <div style={s.doneCard}>
                <div style={{ fontSize: 48 }}>{result.percentage >= 70 ? "🏆" : result.percentage >= 50 ? "👍" : "💪"}</div>
                <h2 style={{ color: "#fff", fontWeight: 800 }}>Already Completed!</h2>
                <div style={{ fontSize: 36, fontWeight: 900, color: "#6c63ff" }}>{result.percentage}%</div>
                <p style={{ color: "#a29bfe" }}>{result.score}/{result.total} correct · Come back tomorrow!</p>
                <button style={s.practiceBtn} onClick={() => nav("/exam-select")}>Practice More →</button>
              </div>
            )}

            {/* RESULT */}
            {result && !result.already_done && (
              <div style={s.resultCard}>
                <div style={{ fontSize: 52 }}>{result.percentage >= 70 ? "🏆" : result.percentage >= 50 ? "👍" : "💪"}</div>
                <div style={{ fontSize: 42, fontWeight: 900, color: result.percentage >= 70 ? "#00b894" : "#e17055" }}>{result.percentage}%</div>
                <p style={{ color: "#636e72" }}>{result.score}/{result.total} correct</p>

                {/* Corrections */}
                <div style={s.corrections}>
                  <h3 style={{ marginBottom: 12, fontSize: 16 }}>Answer Review</h3>
                  {result.answers?.map((a, i) => (
                    <div key={i} style={{ ...s.ansRow, borderLeft: `3px solid ${a.is_correct ? "#00b894" : "#e17055"}` }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: a.is_correct ? "#00b894" : "#e17055" }}>Q{i+1} {a.is_correct ? "✓" : "✗"}</span>
                      {!a.is_correct && <span style={{ fontSize: 12, color: "#636e72", marginLeft: 8 }}>Correct: <strong>{a.correct_answer}</strong></span>}
                      {a.explanation && <p style={{ fontSize: 12, color: "#636e72", marginTop: 4 }}>💡 {a.explanation}</p>}
                    </div>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <button style={s.practiceBtn} onClick={() => nav("/exam-select")}>Practice More →</button>
                  <button style={{ ...s.practiceBtn, background: "#2d3436" }} onClick={() => nav("/dashboard")}>Dashboard</button>
                </div>
              </div>
            )}

            {/* ACTIVE CHALLENGE */}
            {!result && questions.length > 0 && (
              <>
                {/* TOP BAR */}
                <div style={s.topBar}>
                  <span style={{ fontSize: 13, color: "#636e72" }}>{answered}/{questions.length} answered</span>
                  <div style={{ ...s.timer, color: timeLeft <= 30 ? "#e17055" : "#00b894", borderColor: timeLeft <= 30 ? "#e17055" : "#00b894" }}>
                    ⏱ {formatTime(timeLeft)}
                  </div>
                  <button style={s.submitBtn} onClick={() => handleSubmit(false)} disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>

                {/* PALETTE */}
                <div style={s.palette}>
                  {questions.map((q, i) => (
                    <button key={q.id}
                      style={{ ...s.palNum, background: answers[q.id] ? "#00b894" : i === current ? "#6c63ff" : "#f0f0f0", color: (answers[q.id] || i === current) ? "#fff" : "#2d3436" }}
                      onClick={() => setCurrent(i)}>{i+1}</button>
                  ))}
                </div>

                {/* QUESTION */}
                <div style={s.qCard}>
                  <div style={s.qNum}>Question {current+1} of {questions.length}</div>
                  <p style={s.qText}>{questions[current]?.question}</p>
                  <div style={s.options}>
                    {["A","B","C","D"].map(opt => {
                      const sel = answers[questions[current]?.id] === opt;
                      return (
                        <div key={opt}
                          style={{ ...s.option, borderColor: sel ? "#6c63ff" : "#dfe6e9", background: sel ? "#f0edff" : "#fff" }}
                          onClick={() => setAnswers(a => ({ ...a, [questions[current].id]: opt }))}>
                          <span style={{ ...s.optLabel, background: sel ? "#6c63ff" : "#f0f0f0", color: sel ? "#fff" : "#2d3436" }}>{opt}</span>
                          <span style={{ flex: 1 }}>{questions[current]?.[`option_${opt.toLowerCase()}`]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* NAV */}
                <div style={s.nav}>
                  <button style={s.navBtn} onClick={() => setCurrent(c => Math.max(0, c-1))} disabled={current === 0}>← Prev</button>
                  {current < questions.length - 1
                    ? <button style={{ ...s.navBtn, background: "#6c63ff", color: "#fff" }} onClick={() => setCurrent(c => c+1)}>Next →</button>
                    : <button style={{ ...s.navBtn, background: "#00b894", color: "#fff" }} onClick={() => handleSubmit(false)} disabled={submitting}>
                        {submitting ? "..." : "Submit ✓"}
                      </button>
                  }
                </div>
              </>
            )}
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {tab === "history" && (
          <div style={s.historyList}>
            {history.length === 0 && <p style={{ color: "#636e72", textAlign: "center", padding: 24 }}>No challenge history yet.</p>}
            {history.map((h, i) => (
              <div key={i} style={s.histRow}>
                <div>
                  <div style={{ fontWeight: 600 }}>{h.subject}</div>
                  {/* FIX BUG 6: Add noon time to prevent timezone shift */}
                  <div style={{ fontSize: 12, color: "#636e72" }}>
                    {new Date(h.date + "T12:00:00").toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short" })}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 800, fontSize: 18, color: h.percentage >= 70 ? "#00b894" : "#e17055" }}>{h.percentage}%</div>
                  <div style={{ fontSize: 12, color: "#636e72" }}>{h.score}/{h.total}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Loader({ text }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <p style={{ color: "#636e72" }}>{text}</p>
    </div>
  );
}

const s = {
  page:        { minHeight: "100vh", background: "var(--bg)", fontFamily: "sans-serif", padding: 16 },
  container:   { maxWidth: 700, margin: "0 auto" },
  back:        { background: "none", border: "none", color: "#a29bfe", fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 12 },
  header:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  title:       { color: "#fff", fontSize: 26, fontWeight: 900, marginBottom: 2 },
  sub:         { color: "#636e72", fontSize: 13 },
  subjectBadge:{ background: "var(--surface)", border: "1px solid #6c63ff", borderRadius: 10, padding: "8px 16px", display: "flex", flexDirection: "column", gap: 2, textAlign: "center" },
  tabs:        { display: "flex", gap: 8, marginBottom: 20 },
  tab:         { padding: "8px 18px", border: "2px solid #2d2d44", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 },
  doneCard:    { background: "var(--surface)", borderRadius: 16, padding: "32px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 },
  resultCard:  { background: "var(--surface)", borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 },
  corrections: { width: "100%", textAlign: "left", marginTop: 16, color: "#fff" },
  ansRow:      { background: "var(--bg)", borderRadius: 8, padding: "8px 12px", marginBottom: 6 },
  practiceBtn: { padding: "12px 24px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, cursor: "pointer" },
  topBar:      { background: "var(--surface)", borderRadius: 10, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  timer:       { border: "2px solid", borderRadius: 8, padding: "4px 12px", fontWeight: 800, fontSize: 16 },
  submitBtn:   { background: "#e17055", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700, cursor: "pointer" },
  palette:     { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  palNum:      { width: 34, height: 34, border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 12 },
  qCard:       { background: "var(--surface)", borderRadius: 14, padding: "20px 16px", marginBottom: 14, border: "1px solid #2d2d44" },
  qNum:        { fontSize: 12, fontWeight: 700, color: "#6c63ff", marginBottom: 10 },
  qText:       { fontSize: 16, color: "#fff", lineHeight: 1.7, marginBottom: 18 },
  options:     { display: "flex", flexDirection: "column", gap: 10 },
  option:      { display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "2px solid", borderRadius: 10, cursor: "pointer" },
  optLabel:    { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, flexShrink: 0 },
  nav:         { display: "flex", justifyContent: "space-between" },
  navBtn:      { padding: "11px 22px", border: "2px solid #2d2d44", borderRadius: 10, fontWeight: 700, cursor: "pointer", background: "var(--surface)", color: "#fff", fontSize: 14 },
  historyList: { background: "var(--surface)", borderRadius: 14, overflow: "hidden", border: "1px solid #2d2d44" },
  histRow:     { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #2d2d44", color: "#fff" },
};