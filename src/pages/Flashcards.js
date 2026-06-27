import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { speak, stop, speechSupported } from "../utils/voiceUtils";

const JAMB_SUBJECTS = [
  "All Subjects","Mathematics","English Language","Physics","Chemistry",
  "Biology","Economics","Government","Literature in English","Geography",
  "Commerce","Accounting","History",
];

const QUALITY_LABELS = [
  { q:0, label:"Blackout",    emoji:"😶", color:"#e17055", desc:"Completely forgot" },
  { q:1, label:"Very Hard",  emoji:"😰", color:"#e17055", desc:"Remembered with difficulty" },
  { q:2, label:"Hard",       emoji:"😅", color:"#fdcb6e", desc:"Incorrect but recalled" },
  { q:3, label:"OK",         emoji:"😌", color:"#74b9ff", desc:"Correct with effort" },
  { q:4, label:"Good",       emoji:"😊", color:"#00b894", desc:"Correct with hesitation" },
  { q:5, label:"Perfect",    emoji:"🔥", color:"#6c63ff", desc:"Instant recall!" },
];

export default function Flashcards() {
  const nav = useNavigate();
  const [subject, setSubject]     = useState("All Subjects");
  const [cards, setCards]         = useState([]);
  const [cardIdx, setCardIdx]     = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [chosen, setChosen]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [stats, setStats]         = useState(null);
  const [sessionStats, setSessionStats] = useState({ correct:0, incorrect:0, total:0 });
  const [done, setDone]           = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [breakdown, setBreakdown] = useState(null);
  const [breakdownLoad, setBreakdownLoad] = useState(false);
  const [breakdownErr, setBreakdownErr] = useState(null);
  const ttsAvail = speechSupported();

  const loadCards = useCallback(async (subj) => {
    setLoading(true); setDone(false); setCardIdx(0); setFlipped(false);
    setChosen(null); setSessionStats({ correct:0, incorrect:0, total:0 });
    try {
      const q = subj && subj !== "All Subjects" ? `?subject=${encodeURIComponent(subj)}` : "";
      const r = await API.get(`/flashcards/due${q}`);
      setCards(r.data.cards || []);
    } catch { setCards([]); }
    setLoading(false);
  }, []);

  const loadStats = useCallback(async () => {
    try { const r = await API.get("/flashcards/stats"); setStats(r.data); } catch {}
  }, []);

  useEffect(() => { loadCards(subject); loadStats(); }, []);

  const card = cards[cardIdx];

  const handleAnswer = (opt) => {
    if (chosen || reviewing) return;
    setChosen(opt);
    setFlipped(true);
    stop();
  };

  const submitReview = async (quality) => {
    if (!card || reviewing) return;
    setReviewing(true);
    try {
      const r = await API.post("/flashcards/review", {
        question_id: card.id,
        quality,
        chosen_answer: chosen,
      });
      setCorrectAnswer(r.data.correct_answer);
      setShowAnswer(true);
      const isCorrect = quality >= 3;
      setSessionStats(s => ({
        correct: s.correct + (isCorrect ? 1 : 0),
        incorrect: s.incorrect + (isCorrect ? 0 : 1),
        total: s.total + 1,
      }));
    } catch {}
    setReviewing(false);
  };

  const nextCard = () => {
    setChosen(null); setFlipped(false); setShowAnswer(false); setCorrectAnswer(null);
    setBreakdown(null); setBreakdownErr(null);
    if (cardIdx + 1 >= cards.length) { setDone(true); loadStats(); }
    else setCardIdx(i => i + 1);
  };

  const getExaminerBreakdown = async () => {
    if (!card || breakdown || breakdownLoad) return;
    setBreakdownLoad(true);
    setBreakdownErr(null);
    try {
      const r = await API.post("/exam/examiner-breakdown", {
        question_id: card.id,
        chosen_answer: chosen,
      });
      setBreakdown(r.data.breakdown);
    } catch (err) {
      if (err.response?.status === 402) {
        setBreakdownErr("Not enough tokens for Examiner's Breakdown. Visit Tokens to top up.");
      } else {
        setBreakdownErr("Couldn't load explanation. Try again.");
      }
    }
    setBreakdownLoad(false);
  };

  const readCard = () => {
    if (!card) return;
    const text = `${card.question}. Option A: ${card.option_a}. Option B: ${card.option_b}. Option C: ${card.option_c}. Option D: ${card.option_d}.`;
    speak(text);
  };

  if (loading) return (
    <div style={s.page}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh", flexDirection:"column", gap:16 }}>
        <div style={{ fontSize:48 }}>🃏</div>
        <p style={{ color:"#a29bfe", fontWeight:600 }}>Loading your cards...</p>
      </div>
    </div>
  );

  if (done) return (
    <div style={s.page}>
      <div style={{ maxWidth:500, margin:"0 auto", padding:24, textAlign:"center" }}>
        <div style={{ fontSize:80, marginBottom:16 }}>🎉</div>
        <h2 style={{ color:"#f0f4ff", fontWeight:800, fontSize:24, marginBottom:8 }}>Session Complete!</h2>
        <p style={{ color:"#636e72", marginBottom:24 }}>You reviewed all due cards.</p>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:24 }}>
          <StatCard label="Correct"    value={sessionStats.correct}   color="#00b894" />
          <StatCard label="Incorrect"  value={sessionStats.incorrect} color="#e17055" />
          <StatCard label="Reviewed"   value={sessionStats.total}     color="#6c63ff" />
        </div>
        <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
          <button style={s.btnPrimary} onClick={() => loadCards(subject)}>🔄 New Session</button>
          <button style={s.btnSecondary} onClick={() => nav("/dashboard")}>🏠 Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => nav("/dashboard")} style={s.backBtn}>← Back</button>
        <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:"#f0f4ff" }}>🃏 Flashcards</h1>
        <span style={{ color:"#636e72", fontSize:13 }}>{cardIdx + 1}/{cards.length}</span>
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"16px 12px 80px" }}>
        {/* Subject selector */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:16 }}>
          {JAMB_SUBJECTS.map(s2 => (
            <button key={s2} onClick={() => { setSubject(s2); loadCards(s2); }}
              style={{ ...s.subjectPill, background: subject === s2 ? "#6c63ff" : "var(--surface, #1e1e2e)",
                color: subject === s2 ? "#fff" : "#a29bfe",
                border: subject === s2 ? "1px solid #6c63ff" : "1px solid rgba(255,255,255,0.1)" }}>
              {s2}
            </button>
          ))}
        </div>

        {/* Stats bar */}
        {stats && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:16 }}>
            <StatCard label="Due Today" value={stats.due_today  || 0} color="#e17055" small />
            <StatCard label="Mastered"  value={stats.mastered   || 0} color="#00b894" small />
            <StatCard label="Total"     value={stats.total_cards|| 0} color="#6c63ff" small />
            <StatCard label="Session ✓" value={sessionStats.correct} color="#fdcb6e" small />
          </div>
        )}

        {cards.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px" }}>
            <div style={{ fontSize:64, marginBottom:16 }}>✅</div>
            <h3 style={{ color:"#00b894", fontWeight:800 }}>All caught up!</h3>
            <p style={{ color:"#636e72" }}>No cards due for this subject. Check back later or study another subject.</p>
            <button style={{ ...s.btnPrimary, marginTop:16 }} onClick={() => loadCards("All Subjects")}>Load All Subjects</button>
          </div>
        ) : (
          <>
            {/* Question card */}
            <div style={s.qCard}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {card?.subject && <span style={s.metaTag}>{card.subject}</span>}
                  {card?.topic   && <span style={s.metaTag}>{card.topic}</span>}
                  {card?.year    && <span style={s.metaTag}>{card.year}</span>}
                  {card?.difficulty && <span style={{ ...s.metaTag, color: {easy:"#00b894",medium:"#fdcb6e",hard:"#e17055"}[card.difficulty] }}>{card.difficulty}</span>}
                </div>
                {ttsAvail && (
                  <button onClick={readCard} style={{ background:"transparent", border:"1px solid rgba(255,255,255,0.1)", color:"#74b9ff", borderRadius:8, padding:"4px 10px", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                    🔊 Read
                  </button>
                )}
              </div>
              <p style={s.qText}>{card?.question}</p>

              {/* Options */}
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:16 }}>
                {["A","B","C","D"].map(opt => {
                  const isChosen  = chosen === opt;
                  const isCorrect = showAnswer && correctAnswer === opt;
                  const isWrong   = showAnswer && chosen === opt && correctAnswer !== opt;
                  return (
                    <div key={opt} onClick={() => handleAnswer(opt)}
                      style={{
                        ...s.option,
                        border: isCorrect ? "2px solid #00b894"
                          : isWrong  ? "2px solid #e17055"
                          : isChosen ? "2px solid #6c63ff"
                          : "1px solid rgba(255,255,255,0.1)",
                        background: isCorrect ? "rgba(0,184,148,0.12)"
                          : isWrong  ? "rgba(225,112,85,0.12)"
                          : isChosen ? "rgba(108,99,255,0.12)"
                          : "transparent",
                        cursor: chosen ? "default" : "pointer",
                      }}>
                      <span style={{ ...s.optLabel,
                        background: isCorrect ? "#00b894" : isWrong ? "#e17055" : isChosen ? "#6c63ff" : "var(--surface, #2d3436)",
                        color: (isCorrect || isWrong || isChosen) ? "#fff" : "#a29bfe" }}>
                        {opt}
                      </span>
                      <span style={{ flex:1, fontSize:14, color:"#f0f4ff" }}>{card?.[`option_${opt.toLowerCase()}`]}</span>
                      {isCorrect && <span>✅</span>}
                      {isWrong   && <span>❌</span>}
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              {showAnswer && card?.explanation && (
                <div style={s.explanation}>
                  💡 <strong>Explanation:</strong> {card.explanation}
                </div>
              )}

              {/* Examiner's Breakdown */}
              {showAnswer && (
                <>
                  {!breakdown && (
                    <button onClick={getExaminerBreakdown} disabled={breakdownLoad} style={s.examinerBtn}>
                      {breakdownLoad ? "🧑‍🏫 Thinking..." : "🧑‍🏫 Explain Like a JAMB Examiner (1 token)"}
                    </button>
                  )}
                  {breakdownErr && <div style={s.breakdownErr}>{breakdownErr}</div>}
                  {breakdown && (
                    <div style={s.breakdownBox}>
                      <div style={{ fontWeight: 700, color: "#a29bfe", marginBottom: 6, fontSize: 13 }}>🧑‍🏫 Examiner's Breakdown</div>
                      <div style={{ whiteSpace: "pre-wrap" }}>{breakdown}</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quality rating (shown after choosing) */}
            {chosen && !showAnswer && (
              <div style={s.ratingCard}>
                <p style={{ color:"#b2bec3", fontSize:13, marginBottom:12, textAlign:"center" }}>
                  How well did you know this?
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {QUALITY_LABELS.map(({ q, label, emoji, color }) => (
                    <button key={q} onClick={() => submitReview(q)} disabled={reviewing}
                      style={{ background:`${color}20`, border:`1px solid ${color}40`,
                        color, borderRadius:10, padding:"10px 6px", cursor:"pointer",
                        fontWeight:700, fontSize:12, display:"flex", flexDirection:"column",
                        alignItems:"center", gap:4 }}>
                      <span style={{ fontSize:20 }}>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Next button after answer */}
            {showAnswer && (
              <div style={{ display:"flex", justifyContent:"center", marginTop:16 }}>
                <button style={s.btnPrimary} onClick={nextCard}>
                  {cardIdx + 1 >= cards.length ? "Finish Session ✓" : "Next Card →"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, small }) {
  return (
    <div style={{ background:"var(--surface,#1e1e2e)", border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:10, padding: small ? "10px 8px" : "16px 12px", textAlign:"center" }}>
      <div style={{ color, fontWeight:800, fontSize: small ? 20 : 28 }}>{value}</div>
      <div style={{ color:"#636e72", fontSize:11, marginTop:2 }}>{label}</div>
    </div>
  );
}

const s = {
  page:        { minHeight:"100vh", background:"var(--bg, #0f0f1e)", fontFamily:"'Plus Jakarta Sans', sans-serif", color:"#f0f4ff" },
  header:      { background:"var(--surface, #1a1a2e)", padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.07)", position:"sticky", top:0, zIndex:100 },
  backBtn:     { background:"none", border:"none", color:"#a29bfe", cursor:"pointer", fontSize:14, fontWeight:600 },
  subjectPill: { border:"none", borderRadius:20, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:600, whiteSpace:"nowrap" },
  qCard:       { background:"var(--surface, #1a1a2e)", borderRadius:14, padding:"20px 18px", border:"1px solid rgba(255,255,255,0.07)", marginBottom:14 },
  qText:       { fontSize:16, lineHeight:1.7, color:"#f0f4ff", margin:0 },
  metaTag:     { fontSize:11, padding:"2px 8px", borderRadius:6, background:"rgba(255,255,255,0.06)", color:"#74b9ff" },
  option:      { display:"flex", alignItems:"center", gap:12, padding:"12px 14px", borderRadius:10, transition:"all 0.15s" },
  optLabel:    { width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0 },
  explanation: { marginTop:16, background:"rgba(0,184,148,0.1)", border:"1px solid rgba(0,184,148,0.2)", borderRadius:8, padding:"12px 14px", fontSize:13, color:"#f0f4ff", lineHeight:1.6 },
  examinerBtn: { width:"100%", marginTop:12, padding:"10px 12px", background:"rgba(162,155,254,0.12)", color:"#a29bfe", border:"1px solid rgba(162,155,254,0.35)", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13 },
  breakdownBox:{ marginTop:10, fontSize:13, color:"#f0f4ff", lineHeight:1.6, background:"rgba(162,155,254,0.08)", border:"1px solid rgba(162,155,254,0.2)", borderRadius:8, padding:"10px 12px" },
  breakdownErr:{ marginTop:8, fontSize:12, color:"#e17055" },
  ratingCard:  { background:"var(--surface, #1a1a2e)", borderRadius:14, padding:"16px 14px", border:"1px solid rgba(255,255,255,0.07)", marginBottom:14 },
  btnPrimary:  { background:"#6c63ff", color:"#fff", border:"none", borderRadius:10, padding:"12px 24px", fontWeight:700, cursor:"pointer", fontSize:14 },
  btnSecondary:{ background:"var(--surface, #2d3436)", color:"#f0f4ff", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"12px 24px", fontWeight:700, cursor:"pointer", fontSize:14 },
};
