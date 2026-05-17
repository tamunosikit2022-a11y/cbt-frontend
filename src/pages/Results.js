import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function calcJAMBScore(answers, subjectMap) {
  if (!subjectMap) return null;
  const subjectScores = {};
  Object.entries(subjectMap).forEach(([subj, qs]) => {
    const correct = qs.filter(q => answers.find(a => a.question_id === q.id)?.is_correct).length;
    const total   = qs.length;
    const score   = total > 0 ? Math.round((correct / total) * 100) : 0;
    subjectScores[subj] = { correct, total, score };
  });
  const totalScore = Object.values(subjectScores).reduce((sum, s) => sum + s.score, 0);
  return { subjectScores, totalScore, maxScore: Object.keys(subjectScores).length * 100 };
}

export default function Results() {
  const { state } = useLocation();
  const nav = useNavigate();

  // FIX: Check for state and result safely, add navigation guard
  useEffect(() => {
    if (!state?.result) {
      nav("/dashboard", { replace: true });
    }
  }, [state, nav]);

  // Early return with null to prevent rendering before redirect
  if (!state?.result) {
    return null;
  }

  const { result, questions, mode, subject, subjectMap, multiSubjects, isJAMBFull, isPostUTME, institution } = state;
  const { score, total, percentage, answers } = result;

  // FIX BUG 3: Ensure answers exists and is an array
  const safeAnswers = Array.isArray(answers) ? answers : [];
  
  // FIX: Ensure questions exists and is an array
  const safeQuestions = Array.isArray(questions) ? questions : [];

  const jambScore = isJAMBFull && subjectMap ? calcJAMBScore(safeAnswers, subjectMap) : null;

  const displayPercentage = jambScore
    ? ((jambScore.totalScore / jambScore.maxScore) * 100).toFixed(1)
    : percentage || 0;

  const grade = displayPercentage >= 70 ? { label: "Excellent 🏆", color: "#00b894" }
              : displayPercentage >= 50 ? { label: "Good 👍",       color: "#fdcb6e" }
              : displayPercentage >= 40 ? { label: "Average 😐",    color: "#0984e3" }
              : { label: "Keep Practising 💪",                       color: "#e17055" };

  const qMap = {};
  safeQuestions.forEach(q => { 
    if (q && q.id) {
      qMap[q.id] = q; 
    }
  });

  // FIX BUG 3: Safe calculation with fallback for undefined answers
  const correctCount = safeAnswers.filter(a => a && a.is_correct).length;
  const wrongCount = safeAnswers.filter(a => a && a.selected_answer && !a.is_correct).length;
  const unansweredCount = safeAnswers.filter(a => a && !a.selected_answer).length;

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* SCORE CARD */}
        <div style={{ ...s.scoreCard, borderTop: `6px solid ${grade.color}` }}>
          <div style={{ fontSize: 52, marginBottom: 8 }}>
            {displayPercentage >= 70 ? "🏆" : displayPercentage >= 50 ? "👍" : "💪"}
          </div>

          {isJAMBFull && jambScore ? (
            <>
              <div style={{ fontSize: 56, fontWeight: 800, color: grade.color, lineHeight: 1 }}>{jambScore.totalScore}</div>
              <div style={{ fontSize: 18, color: "#636e72", marginBottom: 4 }}>out of {jambScore.maxScore}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#2d3436" }}>{grade.label}</div>
              <p style={{ color: "#636e72", marginTop: 6, fontSize: 14 }}>JAMB / UTME Aggregate Score</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 56, fontWeight: 800, color: grade.color, lineHeight: 1 }}>{percentage || 0}%</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#2d3436", marginTop: 4 }}>{grade.label}</div>
              <p style={{ color: "#636e72", marginTop: 6, fontSize: 14 }}>
                {score || 0} correct out of {total || 0} · {isPostUTME ? `${institution || ""} Post-UTME` : subject || ""}
              </p>
            </>
          )}

          <div style={s.statsRow}>
            <StatBit label="Correct"    value={correctCount}     color="#00b894" />
            <StatBit label="Wrong"      value={wrongCount}       color="#e17055" />
            <StatBit label="Unanswered" value={unansweredCount}  color="#636e72" />
          </div>
        </div>

        {/* JAMB SUBJECT BREAKDOWN */}
        {isJAMBFull && jambScore && (
          <div style={s.breakdown}>
            <h3 style={s.breakTitle}>Subject Breakdown</h3>
            <div style={s.breakGrid}>
              {Object.entries(jambScore.subjectScores).map(([subj, data]) => (
                <div key={subj} style={s.breakCard}>
                  <div style={{ fontSize: 12, color: "#636e72", marginBottom: 4 }}>{subj}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor(data.score) }}>{data.score}</div>
                  <div style={{ fontSize: 11, color: "#636e72" }}>/100 · {data.correct}/{data.total} correct</div>
                  <div style={s.breakBar}>
                    <div style={{ ...s.breakFill, width: `${data.score}%`, background: scoreColor(data.score) }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={s.jambNote}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>📊 Score Guide</div>
              <div style={s.noteRow}><span style={{ color: "#00b894" }}>300–400</span><span>Excellent — Top universities</span></div>
              <div style={s.noteRow}><span style={{ color: "#0984e3" }}>250–299</span><span>Good — Most universities</span></div>
              <div style={s.noteRow}><span style={{ color: "#fdcb6e" }}>200–249</span><span>Average — Some universities</span></div>
              <div style={s.noteRow}><span style={{ color: "#e17055" }}>Below 200</span><span>Needs improvement</span></div>
            </div>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div style={s.actions}>
          <button style={{ ...s.btn, background: "#6c63ff" }} onClick={() => nav("/exam-select")}>🔁 Try Again</button>
          <button style={{ ...s.btn, background: "#2d3436" }} onClick={() => nav("/dashboard")}>🏠 Dashboard</button>
          <button style={{ ...s.btn, background: "#0984e3" }} onClick={() => nav("/history")}>📋 History</button>
        </div>

        {/* ANSWER REVIEW — shown to everyone, no premium gate */}
        <h3 style={s.reviewTitle}>Answer Review & Corrections</h3>
        <p style={{ color: "#636e72", fontSize: 13, marginBottom: 16 }}>
          ✅ Correct answers and explanations are shown below for all questions.
        </p>

        <div style={s.answerList}>
          {/* FIX BUG 3: Safe map with fallback empty array */}
          {safeAnswers.map((a, i) => {
            const q = a && a.question_id ? qMap[a.question_id] : null;
            if (!a) return null;
            
            return (
              <div key={a.question_id || i}
                style={{ ...s.answerRow, borderLeft: `4px solid ${a.is_correct ? "#00b894" : a.selected_answer ? "#e17055" : "#b2bec3"}` }}>

                <div style={s.answerHeader}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: "#636e72" }}>Q{i + 1}</span>
                    {q?.subject && multiSubjects && (
                      <span style={{ background: "#f0f0f0", color: "#636e72", fontSize: 10, padding: "1px 6px", borderRadius: 4 }}>{q.subject}</span>
                    )}
                  </div>
                  <span style={{
                    ...s.correctBadge,
                    background: a.is_correct ? "#e8f8f5" : a.selected_answer ? "#ffeae9" : "#f0f0f0",
                    color:      a.is_correct ? "#00b894"  : a.selected_answer ? "#e17055"  : "#636e72",
                  }}>
                    {a.is_correct ? "✓ Correct" : a.selected_answer ? "✗ Wrong" : "— Skipped"}
                  </span>
                </div>

                {q && <p style={s.answerQ}>{q.question}</p>}

                {/* Show all options with correct answer highlighted */}
                <div style={s.optionsRow}>
                  {["A","B","C","D"].map(opt => {
                    const isCorrect  = opt === a.correct_answer;
                    const isSelected = opt === a.selected_answer;
                    const optionText = q ? q[`option_${opt.toLowerCase()}`] : "";
                    return (
                      <span key={opt} style={{
                        ...s.optChip,
                        background: isCorrect  ? "#00b894"
                                  : isSelected ? "#e17055"
                                  : "#f0f0f0",
                        color:      (isCorrect || isSelected) ? "#fff" : "#636e72",
                        fontWeight: isCorrect ? 700 : 400,
                      }}>
                        {opt}: {optionText || "—"}
                        {isCorrect && " ✓"}
                      </span>
                    );
                  })}
                </div>

                {/* Explanation — shown to everyone */}
                {a.explanation && (
                  <div style={s.expl}>
                    💡 <strong>Explanation:</strong> {a.explanation}
                  </div>
                )}

                {/* No explanation available */}
                {!a.explanation && !a.is_correct && a.correct_answer && (
                  <div style={{ ...s.expl, background: "#f8f9fa", color: "#636e72" }}>
                    ✓ Correct answer: <strong>{a.correct_answer}</strong>
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

function StatBit({ label, value, color }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ fontSize: 24, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#636e72" }}>{label}</div>
    </div>
  );
}

const scoreColor = p => p >= 70 ? "#00b894" : p >= 50 ? "#fdcb6e" : "#e17055";

const s = {
  page:         { minHeight: "100vh", background: "#f8f9fa", fontFamily: "sans-serif", padding: 16 },
  container:    { maxWidth: 760, margin: "0 auto" },
  scoreCard:    { background: "#fff", borderRadius: 16, padding: "32px 24px", textAlign: "center", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", marginBottom: 16 },
  statsRow:     { display: "flex", gap: 0, marginTop: 20, borderTop: "1px solid #f0f0f0", paddingTop: 16 },
  breakdown:    { background: "#fff", borderRadius: 14, padding: 20, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 16 },
  breakTitle:   { fontSize: 16, fontWeight: 800, marginBottom: 14 },
  breakGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 16 },
  breakCard:    { background: "#f8f9fa", borderRadius: 10, padding: "12px 14px" },
  breakBar:     { height: 6, background: "#e0e0e0", borderRadius: 3, marginTop: 8, overflow: "hidden" },
  breakFill:    { height: "100%", borderRadius: 3 },
  jambNote:     { background: "#f8f9fa", borderRadius: 10, padding: "12px 14px", fontSize: 13 },
  noteRow:      { display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f0f0f0" },
  actions:      { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 },
  btn:          { flex: 1, minWidth: 120, padding: "12px 16px", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 },
  reviewTitle:  { fontSize: 18, fontWeight: 800, marginBottom: 8 },
  answerList:   { display: "flex", flexDirection: "column", gap: 12 },
  answerRow:    { background: "#fff", borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 8px rgba(0,0,0,0.05)" },
  answerHeader: { display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" },
  correctBadge: { padding: "2px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700 },
  answerQ:      { fontSize: 14, color: "#2d3436", marginBottom: 10, lineHeight: 1.5 },
  optionsRow:   { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  optChip:      { padding: "4px 10px", borderRadius: 6, fontSize: 12 },
  expl:         { background: "#e8f8f5", borderRadius: 8, padding: "10px 12px", fontSize: 13, color: "#2d3436", lineHeight: 1.6 },
};