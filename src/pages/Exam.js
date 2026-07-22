import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../utils/api";
import Calculator from "../components/Calculator";
import TTSButton from "../components/TTSButton";

export default function Exam() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const exam_type   = params.get("exam_type")  || "JAMB";
  const mode        = params.get("mode")        || "exam";
  const institution = params.get("institution") || "";
  const limitParam  = parseInt(params.get("limit") || "40");
  const timeParam   = parseInt(params.get("time")  || "120");
  const singleSubject = params.get("subject") || "";
  const difficulty  = params.get("difficulty") || "";

  const subjectsParam = params.get("subjects");
  
  // FIX BUG 2: Safe parsing of multiSubjects with try-catch
  let multiSubjects = null;
  try {
    multiSubjects = subjectsParam ? JSON.parse(decodeURIComponent(subjectsParam)) : null;
  } catch (error) {
    console.error("Failed to parse subjects parameter:", error);
    multiSubjects = null;
  }

  const isJAMBFull = mode === "jamb_full";
  const isPostUTME = mode === "postutme";
  const isTimed    = mode === "exam" || isJAMBFull || isPostUTME;

  const [questions,   setQuestions]   = useState([]);
  const [subjectMap,  setSubjectMap]  = useState({});
  const [answers,     setAnswers]     = useState({});
  const [flagged,     setFlagged]     = useState({});
  const [current,     setCurrent]     = useState(0);
  const [timeLeft,    setTimeLeft]    = useState(timeParam * 60);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [submitted,   setSubmitted]   = useState(false);
  const [error,       setError]       = useState("");
  const [showPalette, setShowPalette] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false); // JAMB's S -> confirm -> Y/R flow

  const startTime  = useRef(Date.now());
  const qStartTime = useRef(Date.now());
  const timings    = useRef({});
  const timerRef   = useRef(null);
  const answersRef = useRef({});
  const submitLock = useRef(false);

  // FIX: answersRef was declared but never kept in sync with the `answers`
  // state — doSubmit() reads from the ref (to dodge a stale-closure bug on
  // auto-submit), but since nothing ever wrote into it, every submission
  // saw an empty object and every question was graded as unanswered/null,
  // no matter what the student actually tapped. This was happening on
  // every exam type, not just GES112 — the ref just needs to mirror state.
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  
  // FIX: skill items previously had zero effect in exam logic — wire them up for real
  const [skills,        setSkills]        = useState({ cbt_skills: [] });
  const [hiddenOptions, setHiddenOptions] = useState({}); // { [question_id]: ["B","D"] }
  const [hints,         setHints]         = useState({}); // { [question_id]: "hint text" }
  const [shielded,      setShielded]      = useState({}); // { [question_id]: true }
  const [frozen,        setFrozen]        = useState(false);
  const [skillBusy,     setSkillBusy]     = useState(false);
  const [skillError,    setSkillError]    = useState("");

  useEffect(() => {
    API.get("/skills").then(r => setSkills(r.data)).catch(() => {});
  }, []);

  const activateSkill = async (skill_id) => {
    if (skillBusy) return;
    const owned = skills.cbt_skills.find(s => s.id === skill_id)?.owned || 0;
    if (owned < 1) return;
    setSkillBusy(true);
    setSkillError("");
    try {
      const r = await API.post("/skills/use", { skill_id, question_id: q?.id });
      setSkills(prev => ({
        ...prev,
        cbt_skills: prev.cbt_skills.map(s => s.id === skill_id ? { ...s, owned: r.data.remaining } : s),
      }));
      if (skill_id === "fifty_fifty" && r.data.hide_options) {
        setHiddenOptions(prev => ({ ...prev, [q.id]: r.data.hide_options }));
      }
      if (skill_id === "smart_hint" && r.data.hint) {
        setHints(prev => ({ ...prev, [q.id]: r.data.hint }));
      }
      if (skill_id === "retry_shield") {
        setShielded(prev => ({ ...prev, [q.id]: true }));
      }
      if (skill_id === "time_freeze") {
        setFrozen(true);
        setTimeout(() => setFrozen(false), 15000);
      }
    } catch (err) {
      setSkillError(err.response?.data?.error || "Couldn't use that skill. Try again.");
    }
    setSkillBusy(false);
  };


  // ── LOAD QUESTIONS ──────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        if (multiSubjects && multiSubjects.length > 0) {
          const perSubjectLimit = (s) => isJAMBFull ? (s === "English Language" ? 60 : 40) : Math.floor(limitParam / multiSubjects.length);

          const results = await Promise.all(
            multiSubjects.map(subj =>
              API.get(`/exam/questions?exam_type=${exam_type}&subject=${encodeURIComponent(subj)}&mode=exam&limit=${perSubjectLimit(subj)}`)
                .then(r => ({ subject: subj, questions: r.data.questions || [] }))
                .catch(() => ({ subject: subj, questions: [] }))
            )
          );

          const map  = {};
          const flat = [];
          results.forEach(({ subject, questions: qs }) => {
            map[subject] = qs;
            flat.push(...qs);
          });
          setSubjectMap(map);
          setQuestions(flat);
        } else {
          const res = await API.get(
            `/exam/questions?exam_type=${exam_type}&subject=${encodeURIComponent(singleSubject)}&mode=${mode === "jamb_full" || mode === "postutme" ? "exam" : mode}&limit=${limitParam}${institution ? `&institution=${institution}` : ""}${difficulty ? `&difficulty=${difficulty}` : ""}`
          );
          setQuestions(res.data.questions || []);
        }
      } catch (err) {
        const e = err.response?.data;
        setError(e?.error || "Failed to load questions. Please go back and try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // ── TIMER ───────────────────────────────────────────────
  useEffect(() => {
    if (!isTimed || loading || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      if (frozen) return; // Time Freeze skill — timer paused, don't decrement
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          doSubmit(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [loading, questions, frozen]);

  const formatTime = (s) => {
    const h   = Math.floor(s / 3600);
    const m   = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${m}:${String(sec).padStart(2,"0")}`;
  };

  const timerColor = timeLeft < 300 ? "#e17055" : timeLeft < 600 ? "#fdcb6e" : "#00b894";

  const goTo = (idx) => {
    const q = questions[current];
    if (q) {
      const elapsed = Math.round((Date.now() - qStartTime.current) / 1000);
      timings.current[q.id] = (timings.current[q.id] || 0) + elapsed;
    }
    qStartTime.current = Date.now();
    setCurrent(idx);
    setShowPalette(false);
  };

  // ── SUBMIT — uses ref and lock to avoid stale closure and double submission ──
  const doSubmit = async (auto = false) => {
    // FIX BUG 1: Prevent concurrent submissions
    if (submitLock.current) return;
    
    if (submitted || submitting) return;

    // Use answersRef.current NOT answers state — fixes stale closure
    const currentAnswers = answersRef.current;

    // NOTE: manual submits are confirmed via the Y/R modal (requestSubmit)
    // before doSubmit(false) is ever called, matching JAMB's real S -> Y/R
    // flow — so there's no window.confirm here anymore. auto=true (timer
    // running out) still submits immediately, same as the real exam.

    // Acquire lock
    submitLock.current = true;
    clearInterval(timerRef.current);
    setSubmitting(true);
    setSubmitted(true);

    const totalSecs = Math.round((Date.now() - startTime.current) / 1000);
    const payload   = questions.map(q => ({
      question_id:        q.id,
      selected_answer:    currentAnswers[q.id] || null,
      time_spent_seconds: timings.current[q.id] || 0,
      shielded:            !!shielded[q.id],
    }));

    const subjectLabel = multiSubjects ? multiSubjects.join(", ") : singleSubject;

    try {
      const res = await API.post("/exam/submit", {
        exam_type,
        subject:            subjectLabel,
        institution:        institution || null,
        mode,
        answers:            payload,
        time_taken_seconds: totalSecs,
      });

      nav("/results", {
        state: {
          result:        res.data,
          questions,
          mode,
          subject:       subjectLabel,
          subjectMap:    multiSubjects ? subjectMap : null,
          multiSubjects,
          isJAMBFull,
          isPostUTME,
          institution,
          exam_type,
        }
      });
    } catch (err) {
      setError(err.response?.data?.error || "Submit failed. Please try again.");
      setSubmitting(false);
      setSubmitted(false);
      // FIX BUG 30: Only release lock on failure — prevents re-submission after success
      submitLock.current = false;
    }
  };

  // Both the Submit button and the 'S' key land here — always confirm via
  // the Y/R modal, matching the real exam (which never submits on one
  // keypress/click, precisely to stop accidental submissions).
  const requestSubmit = () => {
    if (submitted || submitting) return;
    setShowSubmitConfirm(true);
  };

  const confirmSubmit = () => { setShowSubmitConfirm(false); doSubmit(false); };
  const cancelSubmit  = () => setShowSubmitConfirm(false);

  // ── JAMB "8-key" keyboard-only navigation (A B C D P N S Y R) ──────────
  // The real CBT hall gives candidates a keypad with exactly these keys and
  // no mouse for many first-timers — this mirrors that so practice here
  // builds the right muscle memory. Ignored while typing in a real input
  // (none currently on this screen, but this guards against future ones).
  useEffect(() => {
    if (loading || !questions.length || submitted) return;

    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toUpperCase();

      if (showSubmitConfirm) {
        if (key === "Y") { e.preventDefault(); confirmSubmit(); }
        else if (key === "R" || key === "ESCAPE") { e.preventDefault(); cancelSubmit(); }
        return;
      }

      const q = questions[current];
      if (["A", "B", "C", "D"].includes(key)) {
        if (!q) return;
        const hidden = hiddenOptions[q.id] || [];
        if (hidden.includes(key)) return; // 50/50 skill removed this option
        e.preventDefault();
        setAnswers(a => ({ ...a, [q.id]: key }));
      } else if (key === "N") {
        e.preventDefault();
        if (current < questions.length - 1) goTo(current + 1);
      } else if (key === "P") {
        e.preventDefault();
        if (current > 0) goTo(current - 1);
      } else if (key === "S") {
        e.preventDefault();
        requestSubmit();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loading, questions, submitted, current, showSubmitConfirm, hiddenOptions]);

  // FIX (React error #310 — "Rendered fewer hooks than expected"):
  // this useEffect used to live AFTER the `if (loading) return …` /
  // `if (error) return …` / `if (!questions.length) return …` early
  // returns below. On the very first render (loading === true) React
  // would bail out before ever reaching this useEffect, so that render
  // registered fewer hooks than the next render (once loading flips to
  // false and the component falls through to the full return). React
  // requires the exact same hooks, in the exact same order, on every
  // render of a component — an early return placed before a hook call
  // breaks that guarantee and crashes with "Minified React error #310"
  // (exactly what was happening on both the UNIVERSITY exam and the
  // POST-UTME exam screens). Every hook must run unconditionally before
  // any conditional return, so this is now computed here, before the
  // early returns, using safe optional chaining since `questions` may
  // still be empty at this point.
  const qForCalc      = questions[current];
  const subjForCalc   = qForCalc?.subject || "";
  // JAMB only provides the on-screen calculator for these subjects — showing
  // it everywhere else would misrepresent what candidates actually get on
  // exam day (e.g. no calculator for English, Biology, Government, etc.)
  const CALC_SUBJECTS = ["Mathematics", "Physics", "Economics", "Accounting", "Commerce"];
  const calcAllowed   = CALC_SUBJECTS.includes(subjForCalc || singleSubject);

  useEffect(() => {
    if (!calcAllowed && showCalc) setShowCalc(false);
  }, [calcAllowed, showCalc]);

  if (loading) return <Loader text="Loading questions..." />;
  if (error)   return <Loader text={error} isError onBack={() => nav(-1)} />;
  if (!questions.length) {
    const subjectLabel = multiSubjects ? multiSubjects.join(", ") : singleSubject;
    return (
      <NoQuestionsYet
        subject={subjectLabel}
        institution={institution}
        examType={exam_type}
        onBack={() => nav(-1)}
        onBrowse={() => nav("/exam-select")}
      />
    );
  }

  const q            = questions[current];
  const answered     = Object.keys(answers).length;
  const progress     = Math.round((answered / questions.length) * 100);
  const currentSubj  = q?.subject || "";

  const subjectOffsets = {};
  if (multiSubjects) {
    let offset = 0;
    multiSubjects.forEach(subj => {
      subjectOffsets[subj] = offset;
      offset += (subjectMap[subj] || []).length;
    });
  }

  return (
    <div style={s.page}>

      {/* TOP BAR */}
      <div style={s.topBar}>
        <div style={s.topLeft}>
          {isJAMBFull
            ? <span style={s.examBadge}>📘 JAMB / UTME</span>
            : isPostUTME
              ? <span style={{ ...s.examBadge, background: "#e8f8f5", color: "#00b894" }}>🏫 {institution} Post-UTME</span>
              : <span style={s.examBadge}>{currentSubj || singleSubject}</span>}
        </div>
        <button
          onClick={() => setShowPalette(!showPalette)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: 5 }}
          title="Tap to see which questions are answered">
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: answered === questions.length ? "#00b894" : "#fdcb6e", flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: "var(--text-muted)", fontWeight: 600 }}>{answered}/{questions.length} answered</span>
        </button>
        <div style={s.topRight}>
          {isTimed && (
            <div style={{ ...s.timer, color: timerColor, borderColor: timerColor }}>
              ⏱ {formatTime(timeLeft)}
            </div>
          )}
          {calcAllowed && (
            <button onClick={() => setShowCalc(c => !c)}
              title="Toggle Calculator"
              style={{ ...s.paletteBtn, background: showCalc ? "rgba(108,99,255,0.3)" : "transparent", color: showCalc ? "#a29bfe" : "#74b9ff", border: "1px solid rgba(108,99,255,0.3)" }}>
              🧮
            </button>
          )}
          <button style={s.paletteBtn} onClick={() => setShowPalette(!showPalette)}>
            📋 {showPalette ? "Hide" : "Questions"}
          </button>
          <button style={s.submitTopBtn}
            onClick={requestSubmit}
            disabled={submitting || submitted}>
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {/* PROGRESS BARS */}
      <div style={s.progressBg}><div style={{ ...s.progressFill, width: `${progress}%` }} /></div>

      {/* SUBJECT TABS */}
      {multiSubjects && multiSubjects.length > 1 && (
        <div style={s.subjectTabs}>
          {multiSubjects.map(subj => {
            const qs            = subjectMap[subj] || [];
            const answeredInSubj = qs.filter(q2 => answers[q2.id]).length;
            return (
              <button key={subj}
                style={{ ...s.subjectTab, background: currentSubj === subj ? "#6c63ff" : "var(--surface)", color: currentSubj === subj ? "#fff" : "var(--text-muted)", border: currentSubj === subj ? "1px solid #6c63ff" : "1px solid rgba(255,255,255,0.08)" }}
                onClick={() => goTo(subjectOffsets[subj] || 0)}>
                <span style={{ fontSize: 12, fontWeight: 700 }}>{subj.replace("Language","Lang.")}</span>
                <span style={{ fontSize: 10, opacity: 0.8 }}>{answeredInSubj}/{qs.length}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* PALETTE */}
      {/* ── CALCULATOR OVERLAY ── */}
      {showCalc && calcAllowed && <Calculator onClose={() => setShowCalc(false)} />}

      {/* ── SUBMIT CONFIRMATION — mirrors JAMB's real S -> Y/R flow ── */}
      {showSubmitConfirm && (() => {
        const unanswered = questions.length - Object.keys(answers).length;
        return (
          <div onClick={cancelSubmit} style={{
            position: "fixed", inset: 0, zIndex: 9999,
            background: "rgba(0,0,0,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: "#1e1e2e", borderRadius: 16, padding: 24,
              width: "100%", maxWidth: 340, textAlign: "center",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 12px 48px rgba(0,0,0,0.7)",
            }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
              <p style={{ color: "#f0f4ff", fontWeight: 700, fontSize: 16, margin: "0 0 6px" }}>
                Submit your exam?
              </p>
              {unanswered > 0 && (
                <p style={{ color: "#fdcb6e", fontSize: 13, margin: "0 0 14px" }}>
                  You have {unanswered} unanswered question{unanswered === 1 ? "" : "s"}.
                </p>
              )}
              <p style={{ color: "#8b9cbd", fontSize: 12, margin: "0 0 18px" }}>
                You cannot return to the exam after submitting.
              </p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={cancelSubmit} style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent", color: "#8b9cbd", fontWeight: 700, cursor: "pointer",
                }}>
                  Return (R)
                </button>
                <button onClick={confirmSubmit} style={{
                  flex: 1, padding: "12px 0", borderRadius: 10, border: "none",
                  background: "#00b894", color: "#fff", fontWeight: 700, cursor: "pointer",
                }}>
                  Yes, Submit (Y)
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {showPalette && (
        <div style={s.palette}>
          <div style={s.paletteHeader}>
            <span style={{ fontWeight: 700 }}>Question Palette</span>
            <span style={{ fontSize: 12, color: "#636e72" }}>✅ {answered} answered · ⬜ {questions.length - answered} left</span>
          </div>
          {/* FIX: the palette already color-codes answered/flagged/current/
              unanswered questions, but nothing explained what each color
              meant — a legend makes it actually useful at a glance instead
              of something you have to reverse-engineer by tapping around. */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12, fontSize: 11, color: "var(--text-muted)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#00b894", display: "inline-block" }} /> Answered</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#fdcb6e", display: "inline-block" }} /> Flagged</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "#6c63ff", display: "inline-block" }} /> Current</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 12, height: 12, borderRadius: 3, background: "var(--surface)", border: "1px solid rgba(255,255,255,0.15)", display: "inline-block" }} /> Unanswered</span>
          </div>
          {multiSubjects ? (
            multiSubjects.map(subj => (
              <div key={subj} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#636e72", marginBottom: 4 }}>{subj}</div>
                <div style={s.paletteGrid}>
                  {(subjectMap[subj] || []).map((q2, i) => {
                    const gi = (subjectOffsets[subj] || 0) + i;
                    return (
                      <button key={q2.id}
                        style={{ ...s.paletteNum, background: flagged[q2.id] ? "#fdcb6e" : answers[q2.id] ? "#00b894" : gi === current ? "#6c63ff" : "var(--surface)", color: (answers[q2.id] || gi === current || flagged[q2.id]) ? "#fff" : "var(--text-muted)" }}
                        onClick={() => goTo(gi)}>{i + 1}</button>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div style={s.paletteGrid}>
              {questions.map((q2, i) => (
                <button key={q2.id}
                  style={{ ...s.paletteNum, background: flagged[q2.id] ? "#fdcb6e" : answers[q2.id] ? "#00b894" : i === current ? "#6c63ff" : "var(--surface)", color: (answers[q2.id] || i === current || flagged[q2.id]) ? "#fff" : "var(--text-muted)" }}
                  onClick={() => goTo(i)}>{i + 1}</button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 12, fontSize: 11, marginTop: 8, flexWrap: "wrap" }}>
            <span>🟩 Answered</span><span>⬜ Not answered</span>
            <span style={{ color: "#6c63ff" }}>🟦 Current</span>
            <span style={{ color: "#fdcb6e" }}>🟨 Flagged</span>
          </div>
        </div>
      )}

      {/* MAIN QUESTION */}
      <div style={s.main}>
        <div style={s.qCard}>
          <div style={s.qHeader}>
            <div>
              <span style={s.qNum}>Question {current + 1} of {questions.length}</span>
              {multiSubjects && currentSubj && (
                <span style={{ marginLeft: 10, background: "#f0edff", color: "#6c63ff", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                  {currentSubj}
                </span>
              )}
            </div>
            <button style={{ ...s.flagBtn, color: flagged[q.id] ? "#e17055" : "#b2bec3" }}
              onClick={() => setFlagged(f => ({ ...f, [q.id]: !f[q.id] }))}>
              {flagged[q.id] ? "🚩 Flagged" : "⚑ Flag"}
            </button>
          </div>

          {(q.year || q.difficulty) && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {q.year && <span style={s.metaTag}>{q.year}</span>}
              {q.difficulty && <span style={{ ...s.metaTag, color: diffColor(q.difficulty) }}>{q.difficulty}</span>}
            </div>
          )}

          {/* FIX: Question image/diagram support — JAMB Physics, Biology, Chemistry often include diagrams */}
          {q.question_image_url && (
            <div style={{ textAlign:"center", margin:"0 0 14px" }}>
              <img
                src={q.question_image_url}
                alt={q.image_alt_text || "Question diagram"}
                style={{ maxWidth:"100%", maxHeight:220, borderRadius:10, border:"1px solid rgba(255,255,255,0.1)", objectFit:"contain" }}
                onError={e => { e.target.style.display="none"; }}
              />
            </div>
          )}
          <p style={s.qText}>{q.question}</p>

          {/* SKILL BAR — Time Freeze / Smart Hint / 50-50 / Retry Shield */}
          {skills.cbt_skills.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
              {skills.cbt_skills.map(sk => (
                <button key={sk.id} disabled={skillBusy || sk.owned < 1 ||
                    (sk.id === "fifty_fifty" && hiddenOptions[q.id]) ||
                    (sk.id === "smart_hint" && hints[q.id]) ||
                    (sk.id === "retry_shield" && shielded[q.id]) ||
                    (sk.id === "time_freeze" && frozen)}
                  onClick={() => activateSkill(sk.id)}
                  title={sk.effect}
                  style={{ ...s.paletteBtn, opacity: sk.owned < 1 ? 0.4 : 1, fontSize: 12 }}>
                  {sk.icon} {sk.name} ({sk.owned})
                </button>
              ))}
              {frozen && <span style={{ ...s.metaTag, color: "#00b894" }}>⏸️ Timer frozen</span>}
            </div>
          )}
          {skillError && <div style={{ color: "#e17055", fontSize: 12, marginBottom: 10 }}>{skillError}</div>}
          {hints[q.id] && (
            <div style={{ ...s.explanation, marginTop: 0, marginBottom: 14 }}>💡 <strong>Hint:</strong> {hints[q.id]}</div>
          )}

          <div style={s.options}>
            {["A","B","C","D"].filter(opt => !(hiddenOptions[q.id] || []).includes(opt)).map(opt => {
              const selected = answers[q.id] === opt;
              return (
                <div key={opt}
                  style={{ ...s.option, ...(selected ? s.optSelected : {}) }}
                  onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}>
                  <span style={{ ...s.optLabel, background: selected ? "#6c63ff" : "var(--surface)", color: selected ? "#fff" : "rgba(255,255,255,0.7)" }}>
                    {opt}
                  </span>
                  <span style={{ flex: 1, fontSize: 15 }}>{q[`option_${opt.toLowerCase()}`]}</span>
                </div>
              );
            })}
          </div>

          {/* Study mode — show explanation immediately */}
          {mode === "study" && answers[q.id] && q.explanation && (
            <div style={s.explanation}>💡 <strong>Explanation:</strong> {q.explanation}</div>
          )}
        </div>

      </div>

      {/* STICKY BOTTOM NAV — always reachable, no scrolling past long questions to find it */}
      <div style={s.stickyNavBar}>
        <p style={{ margin: "0 0 6px", textAlign: "center", fontSize: 10, color: "var(--text-muted)", letterSpacing: 0.3 }}>
          ⌨️ Real JAMB keys work here too: <strong>A B C D</strong> select · <strong>P / N</strong> prev/next · <strong>S</strong> submit
        </p>
        <div style={s.navRow}>
          <button style={s.navBtn} onClick={() => goTo(current - 1)} disabled={current === 0}>← Previous</button>
          <span style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 700 }}>{current + 1} / {questions.length}</span>
          {current < questions.length - 1
            ? <button style={{ ...s.navBtn, background: "#6c63ff", color: "#fff" }} onClick={() => goTo(current + 1)}>Next →</button>
            : <button style={{ ...s.navBtn, background: "#00b894", color: "#fff" }}
                onClick={requestSubmit} disabled={submitting || submitted}>
                {submitting ? "Submitting..." : "Submit Exam ✓"}
              </button>}
        </div>
      </div>
    </div>
  );
}

function Loader({ text, isError, onBack }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 36 }}>{isError ? "❌" : "⏳"}</div>
      <p style={{ color: isError ? "#e17055" : "#636e72", textAlign: "center", padding: "0 20px" }}>{text}</p>
      {onBack && <button style={{ background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 700 }} onClick={onBack}>← Go Back</button>}
    </div>
  );
}

// ── NO QUESTIONS YET ────────────────────────────────────────
// Shown instead of a scary red error whenever a subject/institution
// combo genuinely has zero questions in the bank yet. This is fully
// dynamic — it's driven by the same "questions.length === 0" check
// as before, so the moment the backend has content for this exact
// selection, this screen simply stops appearing on its own; nothing
// needs to be hardcoded per-university or per-subject.
function NoQuestionsYet({ subject, institution, examType, onBack, onBrowse }) {
  const nav = useNavigate();
  const where = institution || (examType && examType !== "JAMB" ? examType.replace(/_/g, " ") : "");
  // AI fallback only makes sense for JAMB-style subjects the generator knows
  // about — institution-specific banks (e.g. UNIPORT GES) aren't offered
  // the AI option since the generator has no notion of that syllabus.
  const canOfferAI = !institution && !!subject;
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg,#0A0A0F)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: "24px 20px" }}>
      <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
        <div style={{
          width: 76, height: 76, borderRadius: "50%", margin: "0 auto 20px",
          background: "linear-gradient(135deg,rgba(124,92,255,.18),rgba(0,212,170,.12))",
          border: "1px solid rgba(124,92,255,.3)",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34,
        }}>
          📚
        </div>
        <h1 style={{ color: "#F1F5F9", fontSize: 19, fontWeight: 800, marginBottom: 10, lineHeight: 1.35 }}>
          We're still building this question bank
        </h1>
        <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.7, marginBottom: 6 }}>
          {subject ? <>We don't have <strong style={{ color: "#F1F5F9" }}>{subject}</strong></> : "We don't have questions"}
          {where ? <> for <strong style={{ color: "#F1F5F9" }}>{where}</strong></> : ""} ready just yet.
        </p>
        <p style={{ color: "#94A3B8", fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Our team adds new questions every week — please check back in a few days.
        </p>

        {canOfferAI && (
          <div style={{ background: "rgba(124,92,255,0.08)", border: "1px solid rgba(124,92,255,0.25)", borderRadius: 14, padding: "16px 18px", marginBottom: 20, textAlign: "left" }}>
            <div style={{ color: "#F1F5F9", fontSize: 13.5, fontWeight: 700, marginBottom: 6 }}>
              ✨ Want AI-generated practice questions instead?
            </div>
            <div style={{ color: "#94A3B8", fontSize: 12.5, lineHeight: 1.6, marginBottom: 12 }}>
              We can generate fresh {subject} questions in the JAMB style right now. These aren't from our verified past-question bank — treat them as extra practice, not official past questions.
            </div>
            <button
              onClick={() => nav(`/ai-questions?subject=${encodeURIComponent(subject)}`)}
              style={{ background: "linear-gradient(135deg,#7C5CFF,#00D4AA)", color: "#0A0A0F", border: "none", borderRadius: 10, padding: "10px 16px", fontWeight: 800, fontSize: 13, cursor: "pointer", width: "100%" }}
            >
              Use AI-generated questions for now →
            </button>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onBrowse} style={{ background: "linear-gradient(135deg,#7C5CFF,#5B8CFF)", color: "#fff", border: "none", borderRadius: 12, padding: "13px 20px", fontWeight: 800, fontSize: 14.5, cursor: "pointer" }}>
            Browse other subjects →
          </button>
          <button onClick={onBack} style={{ background: "transparent", color: "#F1F5F9", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 12, padding: "13px 20px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

const diffColor = d => ({ easy: "#00b894", medium: "#fdcb6e", hard: "#e17055" })[d] || "#636e72";

const s = {
  page:         { minHeight: "100vh", background: "var(--bg)", fontFamily: "'Plus Jakarta Sans',sans-serif", color: "#f0f4ff" },
  topBar:       { background: "var(--surface)", padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.4)", flexWrap: "wrap", gap: 8, position: "sticky", top: 0, zIndex: 100, borderBottom: "1px solid rgba(255,255,255,0.07)" },
  topLeft:      { display: "flex", gap: 8, alignItems: "center" },
  topRight:     { display: "flex", gap: 8, alignItems: "center" },
  examBadge:    { background: "rgba(108,99,255,0.15)", color: "#a29bfe", padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 },
  timer:        { border: "2px solid", borderRadius: 8, padding: "4px 12px", fontWeight: 800, fontSize: 16 },
  paletteBtn:   { background: "var(--surface)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 8, padding: "7px 12px", cursor: "pointer", fontSize: 13, fontWeight: 600 },
  submitTopBtn: { background: "#e17055", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 700, cursor: "pointer", fontSize: 13 },
  progressBg:   { height: 4, background: "var(--surface)" },
  progressFill: { height: "100%", background: "#6c63ff", transition: "width 0.3s" },
  subjectTabs:  { background: "var(--surface)", display: "flex", gap: 4, padding: "8px 12px", overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  subjectTab:   { border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 12px", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, whiteSpace: "nowrap", minWidth: 80, background: "transparent", color: "#fff" },
  palette:      { background: "var(--surface)", padding: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.5)", position: "sticky", top: 60, zIndex: 99, maxHeight: "40vh", overflowY: "auto", borderBottom: "1px solid rgba(255,255,255,0.07)" },
  paletteHeader:{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  paletteGrid:  { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 },
  paletteNum:   { width: 34, height: 34, border: "none", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontSize: 12 },
  main:         { maxWidth: 760, margin: "0 auto", padding: "16px 12px 88px" },
  stickyNavBar: { position: "sticky", bottom: 0, left: 0, right: 0, background: "rgba(10,10,15,0.92)", backdropFilter: "blur(10px)", borderTop: "1px solid rgba(255,255,255,0.08)", padding: "10px 14px", paddingBottom: "calc(10px + env(safe-area-inset-bottom,0px))", zIndex: 90 },
  qCard:        { background: "var(--surface)", borderRadius: 14, padding: "24px 20px", border: "1px solid rgba(255,255,255,0.07)", marginBottom: 16 },
  qHeader:      { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  qNum:         { fontSize: 13, fontWeight: 700, color: "#a29bfe" },
  flagBtn:      { background: "none", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#fff" },
  metaTag:      { fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "var(--surface)", color: "var(--text-muted)" },
  qText:        { fontSize: 16, lineHeight: 1.7, color: "#f0f4ff", marginBottom: 20 },
  options:      { display: "flex", flexDirection: "column", gap: 10 },
  option:       { display: "flex", alignItems: "center", gap: 12, padding: "14px 14px", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, cursor: "pointer", minHeight: 52, color: "#f0f4ff" },
  optSelected:  { border: "2px solid #6c63ff", background: "rgba(108,99,255,0.12)" },
  optLabel:     { width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 },
  explanation:  { marginTop: 16, background: "rgba(0,184,148,0.1)", border: "1px solid rgba(0,184,148,0.2)", borderRadius: 8, padding: "12px 14px", fontSize: 14, color: "#f0f4ff", lineHeight: 1.6 },
  // FIX (buttons "too far apart" on mobile): space-between pinned
  // "← Previous" to the far left edge and "Next →"/"Submit" to the far
  // right edge of the screen — on a typical phone that's a full-width
  // thumb stretch to reach either button, and it gets worse the wider
  // the screen. Centering them with a fixed, modest gap keeps both
  // buttons close together and easily reachable with one hand, no
  // matter the screen width.
  navRow:       { display: "flex", justifyContent: "center", alignItems: "center", gap: 14, maxWidth: 760, margin: "0 auto" },
  navBtn:       { padding: "11px 22px", minWidth: 110, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontWeight: 700, cursor: "pointer", background: "var(--surface)", color: "#fff", fontSize: 14 },
};