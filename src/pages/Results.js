import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

function calcJAMBScore(answers, subjectMap) {
  if (!subjectMap) return null;
  const subjectScores = {};
  Object.entries(subjectMap).forEach(([subj, qs]) => {
    const correct = qs.filter(q => answers.find(a => a.question_id === q.id)?.is_correct).length;
    const total   = qs.length;
    subjectScores[subj] = { correct, total, score: total > 0 ? Math.round((correct/total)*100) : 0 };
  });
  const totalScore = Object.values(subjectScores).reduce((sum, s) => sum + s.score, 0);
  return { subjectScores, totalScore, maxScore: Object.keys(subjectScores).length * 100 };
}

const scoreColor = p => parseFloat(p) >= 70 ? "#00b894" : parseFloat(p) >= 50 ? "#fdcb6e" : "#e17055";

// ── PDF Certificate Generator ─────────────────────────────
function generateCertificate({ studentName, subject, score, total, percentage, examType, institution, date, jambScore }) {
  const canvas = document.createElement("canvas");
  canvas.width  = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext("2d");

  const isExcellent = parseFloat(percentage) >= 70;
  const isGood      = parseFloat(percentage) >= 50;

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 850);
  bgGrad.addColorStop(0, "#0f0e1a");
  bgGrad.addColorStop(0.5, "#1a1855");
  bgGrad.addColorStop(1, "#0f0e1a");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 850);

  // Decorative corner arcs
  ctx.strokeStyle = "rgba(108,99,255,0.3)";
  ctx.lineWidth = 2;
  [[0,0],[1200,0],[0,850],[1200,850]].forEach(([x,y]) => {
    ctx.beginPath();
    ctx.arc(x, y, 200, 0, Math.PI*2);
    ctx.stroke();
  });

  // Gold border
  const borderGrad = ctx.createLinearGradient(0, 0, 1200, 0);
  borderGrad.addColorStop(0,   "#6c63ff");
  borderGrad.addColorStop(0.5, "#ffd700");
  borderGrad.addColorStop(1,   "#6c63ff");
  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = 6;
  ctx.strokeRect(30, 30, 1140, 790);

  // Inner border
  ctx.strokeStyle = "rgba(255,215,0,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(44, 44, 1112, 762);

  // Logo circle
  ctx.fillStyle = "rgba(108,99,255,0.3)";
  ctx.beginPath(); ctx.arc(600, 120, 55, 0, Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#6c63ff"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(600, 120, 55, 0, Math.PI*2); ctx.stroke();
  ctx.font = "bold 54px serif"; ctx.fillStyle = "#fff"; ctx.textAlign = "center";
  ctx.fillText("🎓", 600, 138);

  // Brand name
  ctx.font = "bold 18px Arial"; ctx.fillStyle = "#a29bfe";
  ctx.letterSpacing = "4px";
  ctx.fillText("SCHOLARS SYNDICATE", 600, 200);

  // Certificate title
  ctx.font = "bold 14px Arial"; ctx.fillStyle = "rgba(255,215,0,0.7)";
  ctx.fillText("— CERTIFICATE OF ACHIEVEMENT —", 600, 228);

  // Main divider
  const divGrad = ctx.createLinearGradient(200, 0, 1000, 0);
  divGrad.addColorStop(0, "transparent");
  divGrad.addColorStop(0.5, "rgba(255,215,0,0.6)");
  divGrad.addColorStop(1, "transparent");
  ctx.strokeStyle = divGrad; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(200, 244); ctx.lineTo(1000, 244); ctx.stroke();

  // "This certifies that"
  ctx.font = "16px Georgia"; ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("This certifies that", 600, 285);

  // Student name
  ctx.font = "bold 44px Georgia"; ctx.fillStyle = "#fff";
  ctx.fillText(studentName.toUpperCase(), 600, 345);

  // Underline name
  const nameWidth = ctx.measureText(studentName.toUpperCase()).width;
  ctx.strokeStyle = "rgba(255,215,0,0.5)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(600 - nameWidth/2, 360); ctx.lineTo(600 + nameWidth/2, 360); ctx.stroke();

  // "has successfully completed"
  ctx.font = "16px Georgia"; ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.fillText("has successfully completed", 600, 400);

  // Exam type
  const examLabel = examType === "JAMB" ? "JAMB / UTME Practice Examination"
    : institution ? `${institution} Post-UTME Practice Examination`
    : `${subject} Practice Examination`;
  ctx.font = "bold 26px Georgia"; ctx.fillStyle = "#a29bfe";
  ctx.fillText(examLabel, 600, 442);

  // Score box
  const boxColor = isExcellent ? "#00b894" : isGood ? "#f39c12" : "#e17055";
  const boxGrad = ctx.createLinearGradient(400, 480, 800, 560);
  boxGrad.addColorStop(0, boxColor + "44");
  boxGrad.addColorStop(1, boxColor + "22");
  ctx.fillStyle = boxGrad;
  roundRect(ctx, 380, 472, 440, 100, 16);
  ctx.strokeStyle = boxColor + "88"; ctx.lineWidth = 2;
  roundRectStroke(ctx, 380, 472, 440, 100, 16);

  // Score text
  if (jambScore) {
    ctx.font = "bold 52px Arial"; ctx.fillStyle = "#fff";
    ctx.fillText(`${jambScore.totalScore} / ${jambScore.maxScore}`, 600, 535);
    ctx.font = "bold 14px Arial"; ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText("AGGREGATE SCORE", 600, 562);
  } else {
    ctx.font = "bold 58px Arial"; ctx.fillStyle = "#fff";
    ctx.fillText(`${Math.round(percentage)}%`, 600, 538);
    ctx.font = "bold 14px Arial"; ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(`${score} CORRECT OUT OF ${total} QUESTIONS`, 600, 562);
  }

  // Grade badge
  const grade = isExcellent ? "EXCELLENT 🏆" : isGood ? "GOOD 👍" : "KEEP PRACTISING 💪";
  ctx.font = "bold 15px Arial"; ctx.fillStyle = boxColor;
  ctx.fillText(grade, 600, 602);

  // JAMB subject breakdown
  if (jambScore) {
    const subjects = Object.entries(jambScore.subjectScores);
    const startX = 600 - (subjects.length * 130) / 2;
    subjects.forEach(([subj, data], i) => {
      const sx = startX + i * 135;
      ctx.fillStyle = "rgba(255,255,255,0.05)";
      roundRect(ctx, sx, 618, 125, 60, 10);
      ctx.font = "bold 22px Arial"; ctx.fillStyle = scoreColor(data.score) === "#00b894" ? "#00b894" : scoreColor(data.score) === "#fdcb6e" ? "#f39c12" : "#e17055";
      ctx.fillText(`${data.score}`, sx + 62, 648);
      ctx.font = "11px Arial"; ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.fillText(subj.substring(0,10), sx + 62, 668);
    });
  }

  // Bottom divider
  ctx.strokeStyle = divGrad; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(200, jambScore ? 700 : 632); ctx.lineTo(1000, jambScore ? 700 : 632); ctx.stroke();

  // Date and footer
  const footerY = jambScore ? 730 : 660;
  ctx.font = "13px Arial"; ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText(`Date: ${date}`, 600, footerY);
  ctx.fillText("Scholars Syndicate · cbt-frontend-umber.vercel.app · Learn. Practice. Excel.", 600, footerY + 24);

  // Watermark dots
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = "rgba(108,99,255,0.15)";
    ctx.beginPath(); ctx.arc(150 + i*220, 780, 4, 0, Math.PI*2); ctx.fill();
  }

  return canvas.toDataURL("image/png");
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath(); ctx.fill();
}
function roundRectStroke(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y);
  ctx.quadraticCurveTo(x+w, y, x+w, y+r);
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r);
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y);
  ctx.closePath(); ctx.stroke();
}

// ── Main Component ────────────────────────────────────────────
export default function Results() {
  const { state }  = useLocation();
  const nav        = useNavigate();
  const { student } = useAuth();
  const [certImg,   setCertImg]   = useState(null);
  const [generating,setGenerating]= useState(false);
  const [shared,    setShared]    = useState(false);
  const certRef = useRef(null);

  useEffect(() => { if (!state?.result) nav("/dashboard", { replace:true }); }, [state, nav]);
  if (!state?.result) return null;

  const { result, questions, subject, subjectMap, isJAMBFull, isPostUTME, institution } = state;
  const { score, total, percentage, answers, xp_earned } = result;
  const safeAnswers   = Array.isArray(answers)   ? answers   : [];
  const safeQuestions = Array.isArray(questions) ? questions : [];
  const jambScore     = isJAMBFull && subjectMap ? calcJAMBScore(safeAnswers, subjectMap) : null;

  const displayPct = jambScore
    ? ((jambScore.totalScore / jambScore.maxScore) * 100).toFixed(1)
    : percentage || 0;

  const grade = displayPct >= 70 ? { label:"Excellent 🏆", color:"#00b894" }
              : displayPct >= 50 ? { label:"Good 👍",       color:"#fdcb6e" }
              : displayPct >= 40 ? { label:"Average 😐",    color:"#0984e3" }
              :                    { label:"Keep Practising 💪", color:"#e17055" };

  const qMap = {};
  safeQuestions.forEach(q => { if (q?.id) qMap[q.id] = q; });

  const correctCount   = safeAnswers.filter(a => a?.is_correct).length;
  const wrongCount     = safeAnswers.filter(a => a?.selected_answer && !a.is_correct).length;
  const unansweredCount= safeAnswers.filter(a => !a?.selected_answer).length;

  const studentName = student?.full_name || "Student";
  const examDate    = new Date().toLocaleDateString("en-NG", { day:"numeric", month:"long", year:"numeric" });

  const handleGenerateCert = () => {
    setGenerating(true);
    setTimeout(() => {
      const img = generateCertificate({
        studentName, subject: subject || "Mixed Subjects",
        score: correctCount, total: total || safeAnswers.length,
        percentage: displayPct,
        examType: isJAMBFull ? "JAMB" : isPostUTME ? "POST-UTME" : "PRACTICE",
        institution, date: examDate, jambScore,
      });
      setCertImg(img);
      setGenerating(false);
      setTimeout(() => certRef.current?.scrollIntoView({ behavior:"smooth" }), 100);
    }, 300);
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = certImg;
    a.download = `Scholars-Syndicate-Certificate-${studentName.replace(/\s+/g,"-")}.png`;
    a.click();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const blob = await (await fetch(certImg)).blob();
        const file = new File([blob], "scholars-certificate.png", { type:"image/png" });
        await navigator.share({ title:"My Scholars Syndicate Result", text:`I scored ${Math.round(displayPct)}% on Scholars Syndicate! 🎓 Study with me: cbt-frontend-umber.vercel.app`, files:[file] });
        setShared(true);
      } catch {}
    } else {
      handleDownload();
    }
  };

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* ── SCORE CARD ── */}
        <div style={{ ...s.scoreCard, borderTop:`6px solid ${grade.color}` }}>
          <div style={{ fontSize:52, marginBottom:8 }}>
            {displayPct >= 70 ? "🏆" : displayPct >= 50 ? "👍" : "💪"}
          </div>

          {isJAMBFull && jambScore ? (
            <>
              <div style={{ fontSize:60, fontWeight:800, color:grade.color, lineHeight:1 }}>{jambScore.totalScore}</div>
              <div style={{ fontSize:18, color:"#636e72", marginBottom:4 }}>out of {jambScore.maxScore}</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#2d3436" }}>{grade.label}</div>
              <p style={{ color:"#636e72", marginTop:6, fontSize:14 }}>JAMB / UTME Aggregate Score</p>
            </>
          ) : (
            <>
              <div style={{ fontSize:60, fontWeight:800, color:grade.color, lineHeight:1 }}>{percentage || 0}%</div>
              <div style={{ fontSize:20, fontWeight:700, color:"#2d3436", marginTop:4 }}>{grade.label}</div>
              <p style={{ color:"#636e72", marginTop:6, fontSize:14 }}>
                {score || 0} correct out of {total || 0} · {isPostUTME ? `${institution || ""} Post-UTME` : subject || ""}
              </p>
            </>
          )}

          {xp_earned > 0 && (
            <div style={s.xpBanner}>⚡ +{xp_earned} XP earned!</div>
          )}

          <div style={s.statsRow}>
            <StatBit label="Correct"    value={correctCount}    color="#00b894" />
            <StatBit label="Wrong"      value={wrongCount}      color="#e17055" />
            <StatBit label="Unanswered" value={unansweredCount} color="#636e72" />
          </div>
        </div>

        {/* ── CERTIFICATE SECTION ── */}
        <div style={s.certSection}>
          <div style={s.certHeader}>
            <div>
              <div style={{ fontWeight:800, fontSize:16, color:"#2d3436" }}>🏅 Score Certificate</div>
              <div style={{ fontSize:12, color:"#636e72", marginTop:3 }}>Download & share your achievement on WhatsApp</div>
            </div>
            {!certImg && (
              <button style={s.generateBtn} onClick={handleGenerateCert} disabled={generating}>
                {generating ? "Generating..." : "✨ Generate"}
              </button>
            )}
          </div>

          {certImg && (
            <div ref={certRef}>
              <img src={certImg} alt="Certificate" style={{ width:"100%", borderRadius:12, marginBottom:12, boxShadow:"0 4px 20px rgba(0,0,0,0.15)" }} />
              <div style={s.certActions}>
                <button style={s.downloadBtn} onClick={handleDownload}>⬇ Download PNG</button>
                <button style={s.shareBtn} onClick={handleShare}>
                  {shared ? "✅ Shared!" : "📤 Share on WhatsApp"}
                </button>
                <button style={s.regenBtn} onClick={() => setCertImg(null)}>↺ Regenerate</button>
              </div>
              <div style={s.shareHint}>
                💡 Tap Share → WhatsApp to show your friends your score!
              </div>
            </div>
          )}
        </div>

        {/* ── JAMB BREAKDOWN ── */}
        {isJAMBFull && jambScore && (
          <div style={s.breakdown}>
            <h3 style={s.breakTitle}>Subject Breakdown</h3>
            <div style={s.breakGrid}>
              {Object.entries(jambScore.subjectScores).map(([subj, data]) => (
                <div key={subj} style={s.breakCard}>
                  <div style={{ fontSize:12, color:"#636e72", marginBottom:4 }}>{subj}</div>
                  <div style={{ fontSize:28, fontWeight:800, color:scoreColor(data.score) }}>{data.score}</div>
                  <div style={{ fontSize:11, color:"#636e72" }}>/100 · {data.correct}/{data.total} correct</div>
                  <div style={s.breakBar}>
                    <div style={{ ...s.breakFill, width:`${data.score}%`, background:scoreColor(data.score) }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={s.jambNote}>
              <div style={{ fontWeight:700, marginBottom:6 }}>📊 Score Guide</div>
              {[["300–400","#00b894","Excellent — Top universities"],["250–299","#0984e3","Good — Most universities"],["200–249","#fdcb6e","Average — Some universities"],["Below 200","#e17055","Needs improvement"]].map(([r,c,l]) => (
                <div key={r} style={s.noteRow}><span style={{ color:c }}>{r}</span><span>{l}</span></div>
              ))}
            </div>
          </div>
        )}

        {/* ── ACTIONS ── */}
        <div style={s.actions}>
          <button style={{ ...s.btn, background:"#6c63ff" }} onClick={() => nav("/exam-select")}>🔁 Try Again</button>
          <button style={{ ...s.btn, background:"#2d3436" }} onClick={() => nav("/dashboard")}>🏠 Dashboard</button>
          <button style={{ ...s.btn, background:"#0984e3" }} onClick={() => nav("/history")}>📋 History</button>
        </div>

        {/* ── ANSWER REVIEW ── */}
        <h3 style={s.reviewTitle}>Answer Review & Corrections</h3>
        <p style={{ color:"#636e72", fontSize:13, marginBottom:16 }}>
          ✅ Correct answers and explanations shown below.
        </p>
        <div style={s.answerList}>
          {safeAnswers.map((a, i) => {
            const q = a?.question_id ? qMap[a.question_id] : null;
            if (!a) return null;
            return (
              <div key={a.question_id || i}
                style={{ ...s.answerRow, borderLeft:`4px solid ${a.is_correct ? "#00b894" : a.selected_answer ? "#e17055" : "#b2bec3"}` }}>
                <div style={s.answerHeader}>
                  <span style={{ fontWeight:700, fontSize:13, color:"#636e72" }}>Q{i+1}</span>
                  <span style={{ ...s.correctBadge, background:a.is_correct ? "#e8f8f5" : a.selected_answer ? "#ffeae9" : "#f0f0f0", color:a.is_correct ? "#00b894" : a.selected_answer ? "#e17055" : "#636e72" }}>
                    {a.is_correct ? "✓ Correct" : a.selected_answer ? "✗ Wrong" : "— Skipped"}
                  </span>
                </div>
                {q && <p style={s.answerQ}>{q.question}</p>}
                <div style={s.optionsRow}>
                  {["A","B","C","D"].map(opt => {
                    const isCorrect  = opt === a.correct_answer;
                    const isSelected = opt === a.selected_answer;
                    return (
                      <span key={opt} style={{ ...s.optChip, background:isCorrect ? "#00b894" : isSelected ? "#e17055" : "#f0f0f0", color:(isCorrect||isSelected) ? "#fff" : "#636e72", fontWeight:isCorrect ? 700 : 400 }}>
                        {opt}: {q ? q[`option_${opt.toLowerCase()}`] || "—" : "—"}
                        {isCorrect && " ✓"}
                      </span>
                    );
                  })}
                </div>
                {a.explanation && (
                  <div style={s.expl}>💡 <strong>Explanation:</strong> {a.explanation}</div>
                )}
                {!a.explanation && !a.is_correct && a.correct_answer && (
                  <div style={{ ...s.expl, background:"#f8f9fa", color:"#636e72" }}>
                    ✓ Correct answer: <strong>{a.correct_answer}</strong>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div style={{ height:40 }} />
      </div>
    </div>
  );
}

function StatBit({ label, value, color }) {
  return (
    <div style={{ textAlign:"center", flex:1 }}>
      <div style={{ fontSize:24, fontWeight:800, color }}>{value}</div>
      <div style={{ fontSize:12, color:"#636e72" }}>{label}</div>
    </div>
  );
}

const s = {
  page:         { minHeight:"100vh", background:"#f8f9fa", fontFamily:"'Segoe UI',sans-serif", padding:16 },
  container:    { maxWidth:760, margin:"0 auto" },
  scoreCard:    { background:"#fff", borderRadius:16, padding:"32px 24px", textAlign:"center", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", marginBottom:16 },
  xpBanner:     { background:"linear-gradient(135deg,#6c63ff,#a29bfe)", borderRadius:12, padding:"10px 16px", marginBottom:12, color:"#fff", fontWeight:800, fontSize:15, textAlign:"center", marginTop:12 },
  statsRow:     { display:"flex", gap:0, marginTop:20, borderTop:"1px solid #f0f0f0", paddingTop:16 },

  certSection:  { background:"#fff", borderRadius:16, padding:"18px 16px", boxShadow:"0 2px 16px rgba(108,99,255,0.1)", marginBottom:16, border:"2px solid #6c63ff22" },
  certHeader:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 },
  generateBtn:  { background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:10, padding:"10px 20px", fontWeight:800, fontSize:13, cursor:"pointer" },
  certActions:  { display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 },
  downloadBtn:  { flex:1, padding:"11px 0", background:"#2d3436", color:"#fff", border:"none", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" },
  shareBtn:     { flex:2, padding:"11px 0", background:"linear-gradient(135deg,#25D366,#128C7E)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:13, cursor:"pointer" },
  regenBtn:     { padding:"11px 14px", background:"#f0f0f0", color:"#636e72", border:"none", borderRadius:10, fontWeight:700, fontSize:13, cursor:"pointer" },
  shareHint:    { fontSize:12, color:"#636e72", textAlign:"center", padding:"4px 0 8px" },

  breakdown:    { background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:16 },
  breakTitle:   { fontSize:16, fontWeight:800, marginBottom:14 },
  breakGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:16 },
  breakCard:    { background:"#f8f9fa", borderRadius:10, padding:"12px 14px" },
  breakBar:     { height:6, background:"#e0e0e0", borderRadius:3, marginTop:8, overflow:"hidden" },
  breakFill:    { height:"100%", borderRadius:3 },
  jambNote:     { background:"#f8f9fa", borderRadius:10, padding:"12px 14px", fontSize:13 },
  noteRow:      { display:"flex", justifyContent:"space-between", padding:"4px 0", borderBottom:"1px solid #f0f0f0" },

  actions:      { display:"flex", gap:10, flexWrap:"wrap", marginBottom:24 },
  btn:          { flex:1, minWidth:120, padding:"12px 16px", border:"none", borderRadius:10, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14 },
  reviewTitle:  { fontSize:18, fontWeight:800, marginBottom:8 },
  answerList:   { display:"flex", flexDirection:"column", gap:12 },
  answerRow:    { background:"#fff", borderRadius:12, padding:"14px 16px", boxShadow:"0 1px 8px rgba(0,0,0,0.05)" },
  answerHeader: { display:"flex", justifyContent:"space-between", marginBottom:8, alignItems:"center" },
  correctBadge: { padding:"2px 10px", borderRadius:10, fontSize:12, fontWeight:700 },
  answerQ:      { fontSize:14, color:"#2d3436", marginBottom:10, lineHeight:1.5 },
  optionsRow:   { display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 },
  optChip:      { padding:"4px 10px", borderRadius:6, fontSize:12 },
  expl:         { background:"#e8f8f5", borderRadius:8, padding:"10px 12px", fontSize:13, color:"#2d3436", lineHeight:1.6 },
};
