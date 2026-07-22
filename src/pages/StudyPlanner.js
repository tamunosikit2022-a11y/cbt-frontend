import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

const JAMB_SUBJECTS = ["English Language","Mathematics","Biology","Chemistry","Physics","Economics","Government","Literature in English","Geography","Agricultural Science","Commerce","Accounting"];
const DAY_KEYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const DEFAULT_HOURS = { Sun:2, Mon:2, Tue:2, Wed:2, Thu:2, Fri:2, Sat:3 };
const DAY_FULL = { Sun:"Sunday", Mon:"Monday", Tue:"Tuesday", Wed:"Wednesday", Thu:"Thursday", Fri:"Friday", Sat:"Saturday" };

export default function StudyPlanner() {
  const nav = useNavigate();
  const { student } = useAuth();

  // ── Wizard state ──────────────────────────────────────────
  const [step,        setStep]        = useState(0); // 0=date 1=subjects 2=weak 3=hours 4=review
  const [examDate,    setExamDate]    = useState(localStorage.getItem("jamb_exam_date") || "");
  const [subjects,    setSubjects]    = useState(() => {
    try { return JSON.parse(localStorage.getItem("sp_subjects") || "null") || ["English Language"]; }
    catch { return ["English Language"]; }
  });
  const [weakSubjects, setWeakSubjects] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sp_weak") || "[]"); } catch { return []; }
  });
  const [weeklyHours, setWeeklyHours] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sp_hours") || "null") || DEFAULT_HOURS; }
    catch { return DEFAULT_HOURS; }
  });
  const [weakData,    setWeakData]    = useState(null);

  // ── Plan state ────────────────────────────────────────────
  const [plan,       setPlan]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("study_plan") || "null"); } catch { return null; }
  });
  const [done,       setDone]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("study_done") || "{}"); } catch { return {}; }
  });
  const [generating, setGenerating] = useState(false);
  const [showWizard, setShowWizard] = useState(!plan);
  const [error,      setError]      = useState("");

  useEffect(() => {
    API.get("/exam/heatmap").then(r => setWeakData(r.data?.heatmap || [])).catch(() => {});
  }, []);

  // Pre-tick subjects the heatmap already knows are weak, first time only
  useEffect(() => {
    if (weakData && weakData.length && weakSubjects.length === 0) {
      const auto = weakData.filter(sub => sub.strength === "weak").map(sub => sub.subject);
      if (auto.length) setWeakSubjects(auto);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weakData]);

  const daysLeft = useMemo(() => {
    if (!examDate) return null;
    const diff = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [examDate]);

  const totalWeeklyHours = useMemo(
    () => DAY_KEYS.reduce((sum, d) => sum + (Number(weeklyHours[d]) || 0), 0),
    [weeklyHours]
  );

  const toggleSubject = (subj) => {
    if (subj === "English Language") return; // required by JAMB, can't deselect
    setSubjects(prev => prev.includes(subj) ? prev.filter(x => x !== subj) : [...prev, subj]);
    setWeakSubjects(prev => prev.filter(x => x !== subj));
  };
  const toggleWeak = (subj) => {
    setWeakSubjects(prev => prev.includes(subj) ? prev.filter(x => x !== subj) : [...prev, subj]);
  };
  const setHourFor = (day, val) => {
    setWeeklyHours(prev => ({ ...prev, [day]: Math.max(0, Math.min(10, Number(val) || 0)) }));
  };

  const canNext = () => {
    if (step === 0) return !!examDate;
    if (step === 1) return subjects.length > 0;
    return true;
  };

  const generatePlan = async () => {
    if (!examDate || subjects.length === 0) return;
    setGenerating(true);
    setError("");

    localStorage.setItem("jamb_exam_date", examDate);
    localStorage.setItem("sp_subjects", JSON.stringify(subjects));
    localStorage.setItem("sp_weak", JSON.stringify(weakSubjects));
    localStorage.setItem("sp_hours", JSON.stringify(weeklyHours));

    try {
      const { data } = await API.post("/study-planner/generate", {
        exam_date:     examDate,
        subjects,
        weak_subjects: weakSubjects,
        weekly_hours:  weeklyHours,
      });

      const newPlan = {
        ...data.plan,
        examDate,
        aiPowered: data.source === "ai",
      };
      newPlan.days = (newPlan.days || []).map((day, di) => ({
        ...day,
        tasks: (day.tasks || []).map((t, ti) => ({ ...t, id: t.id || `${di}-${ti}` })),
      }));

      setPlan(newPlan);
      setDone({});
      localStorage.setItem("study_plan", JSON.stringify(newPlan));
      localStorage.setItem("study_done", "{}");
      setShowWizard(false);
    } catch (err) {
      console.error("generatePlan error:", err);
      setError(err.response?.data?.error || "Couldn't generate your plan — please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleDone = (taskId) => {
    const next = { ...done, [taskId]: !done[taskId] };
    setDone(next);
    localStorage.setItem("study_done", JSON.stringify(next));
  };

  const today = new Date().toISOString().split("T")[0];
  const todayPlan = plan?.days?.find(d => d.date === today);
  const totalTasks = plan?.days?.flatMap(d => d.tasks).length || 0;
  const doneTasks  = Object.values(done).filter(Boolean).length;
  const pct        = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const TASK_ICON = { practice:"📝", exam:"📝", review:"🔍", mock:"🎯", reading:"📖" };

  // ═══════════════════════ WIZARD ═══════════════════════
  if (showWizard) {
    return (
      <div style={s.page}>
        <div style={s.header}>
          <button style={s.back} onClick={() => (plan ? setShowWizard(false) : nav(-1))}>←</button>
          <div>
            <h1 style={s.title}>Study Planner</h1>
            <p style={s.sub}>Let's build a schedule that actually fits your week</p>
          </div>
        </div>

        <div style={s.content}>
          <div style={s.progressRow}>
            {["Exam date","Subjects","Weak spots","Your week","Review"].map((label, i) => (
              <div key={label} style={s.progressDot(i === step, i < step)}>
                <div style={s.progressCircle(i === step, i < step)}>{i < step ? "✓" : i + 1}</div>
                <div style={s.progressLabel(i === step)}>{label}</div>
              </div>
            ))}
          </div>

          {step === 0 && (
            <div style={s.card}>
              <div style={s.cardTitle}>📅 When is your JAMB exam?</div>
              <input
                type="date"
                value={examDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setExamDate(e.target.value)}
                style={s.dateInput}
              />
              {daysLeft !== null && (
                <div style={s.daysLeft}>
                  {daysLeft === 0
                    ? "🎓 Today is the day — good luck!"
                    : daysLeft < 7
                      ? `⚠️ ${daysLeft} days left — let's make every hour count.`
                      : `⏳ ${daysLeft} days left to prepare`}
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div style={s.card}>
              <div style={s.cardTitle}>📚 Which subjects are you sitting?</div>
              <p style={s.hint}>Pick everything you're preparing for — English Language is required by JAMB.</p>
              <div style={s.chipGrid}>
                {JAMB_SUBJECTS.map(subj => {
                  const active = subjects.includes(subj);
                  const locked = subj === "English Language";
                  return (
                    <button key={subj} onClick={() => toggleSubject(subj)} style={s.chip(active, false)}>
                      {active ? "✓ " : ""}{subj}{locked ? " (required)" : ""}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={s.card}>
              <div style={s.cardTitle}>🎯 Any of these you find harder?</div>
              <p style={s.hint}>We'll schedule extra sessions for these. {weakData?.length ? "Pre-ticked from your performance history — adjust as needed." : ""}</p>
              <div style={s.chipGrid}>
                {subjects.map(subj => {
                  const active = weakSubjects.includes(subj);
                  return (
                    <button key={subj} onClick={() => toggleWeak(subj)} style={s.chip(active, true)}>
                      {active ? "⚠️ " : ""}{subj}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={s.card}>
              <div style={s.cardTitle}>⏰ How much time can you actually give each day?</div>
              <p style={s.hint}>Be honest about busy days (school, lessons, chores) — set them low or to 0. Busy days simply get lighter or no tasks; the plan builds around your real week.</p>
              {DAY_KEYS.map(day => (
                <div key={day} style={s.hourRow}>
                  <div style={s.hourDayLabel}>{DAY_FULL[day]}</div>
                  <input
                    type="range" min="0" max="8" step="0.5"
                    value={weeklyHours[day] ?? 0}
                    onChange={e => setHourFor(day, e.target.value)}
                    style={s.slider}
                  />
                  <div style={s.hourValue}>{weeklyHours[day] ?? 0}h</div>
                </div>
              ))}
              <div style={s.totalHours}>Total: <strong>{totalWeeklyHours}h</strong> / week</div>
            </div>
          )}

          {step === 4 && (
            <div style={s.card}>
              <div style={s.cardTitle}>✨ Ready to generate</div>
              <div style={s.reviewRow}><span>Exam date</span><strong>{examDate}</strong></div>
              <div style={s.reviewRow}><span>Subjects</span><strong>{subjects.join(", ")}</strong></div>
              <div style={s.reviewRow}><span>Extra focus</span><strong>{weakSubjects.length ? weakSubjects.join(", ") : "None flagged"}</strong></div>
              <div style={s.reviewRow}><span>Weekly hours</span><strong>{totalWeeklyHours}h across the week</strong></div>
              {error && <p style={{ color:"#e17055", fontSize:13, marginTop:10 }}>{error}</p>}
              <button
                style={{ ...s.btn, opacity: generating ? 0.6 : 1, marginTop:16, width:"100%" }}
                disabled={generating}
                onClick={generatePlan}
              >
                {generating ? "⏳ Building your plan..." : plan ? "🔄 Regenerate my plan" : "✨ Generate my plan"}
              </button>
            </div>
          )}

          <div style={s.wizardNav}>
            {step > 0 && <button style={s.navBtnGhost} onClick={() => setStep(step - 1)}>← Back</button>}
            {step < 4 && <button style={{ ...s.navBtn, opacity: canNext() ? 1 : 0.5 }} disabled={!canNext()} onClick={() => setStep(step + 1)}>Next →</button>}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════ PLAN VIEW ═══════════════════════
  return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => nav(-1)}>←</button>
        <div>
          <h1 style={s.title}>Study Planner</h1>
          <p style={s.sub}>Your personalised JAMB prep schedule</p>
        </div>
      </div>

      <div style={s.content}>
        <button style={{ ...s.btn, background:"transparent", border:"1px solid rgba(124,92,255,0.4)", color:"#a29bfe", width:"100%", marginBottom:16 }} onClick={() => { setStep(0); setShowWizard(true); }}>
          ⚙️ Edit plan settings
        </button>

        {plan && (
          <>
            <div style={s.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={s.cardTitle}>📊 Overall Progress{plan?.aiPowered && <span style={s.aiTag}>AI</span>}</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#7C5CFF" }}>{pct}%</div>
              </div>
              <div style={s.barTrack}><div style={{ ...s.barFill, width:`${pct}%` }} /></div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:6 }}>
                {doneTasks} / {totalTasks} tasks completed · {plan.days.length} days planned · {plan.weekly_hours ? DAY_KEYS.reduce((sum,d)=>sum+(Number(plan.weekly_hours[d])||0),0) : "?"}h/week
              </div>
            </div>

            {todayPlan && (
              <div style={{ ...s.card, borderColor:"rgba(124,92,255,0.3)" }}>
                <div style={s.cardTitle}>⚡ Today — {todayPlan.day}</div>
                {todayPlan.tasks.length === 0 && <p style={{ color:"#64748b", fontSize:13 }}>Rest day — nothing scheduled today. 🌿</p>}
                {todayPlan.tasks.map(task => (
                  <TaskRow key={task.id} task={task} done={!!done[task.id]} onToggle={() => toggleDone(task.id)}
                    icon={TASK_ICON[task.type]}
                    onPractice={() => nav(`/exam?exam_type=JAMB&subject=${encodeURIComponent(task.subject || plan.subjects?.[0] || "")}&mode=${task.type === "review" ? "weakness" : "exam"}&limit=40`)}
                  />
                ))}
              </div>
            )}

            <div style={s.sectionLabel}>Full Schedule</div>
            {plan.days.map((day) => {
              const dayDone = day.tasks.filter(t => done[t.id]).length;
              const isToday = day.date === today;
              const isPast  = day.date < today;
              return (
                <div key={day.date} style={{ ...s.dayRow, opacity: isPast && !isToday ? 0.5 : 1, borderColor: isToday ? "rgba(124,92,255,0.4)" : "rgba(255,255,255,0.06)" }}>
                  <div style={s.dayLeft}>
                    <div style={{ ...s.dayName, color: isToday ? "#7C5CFF" : "#94a3b8" }}>{isToday ? "TODAY" : day.day}</div>
                    <div style={s.dayDate}>{new Date(day.date+"T12:00:00").toLocaleDateString("en-NG",{ month:"short", day:"numeric" })}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    {day.tasks.length === 0
                      ? <div style={{ ...s.miniTask, color:"#4B5563", fontStyle:"italic" }}>Rest day</div>
                      : day.tasks.map(task => (
                        <div key={task.id} style={{ ...s.miniTask, textDecoration: done[task.id] ? "line-through" : "none", color: done[task.id] ? "#4B5563" : "#e2e8f0" }}>
                          {TASK_ICON[task.type]} {task.text}
                        </div>
                      ))}
                  </div>
                  <div style={s.dayProg}>{day.tasks.length ? `${dayDone}/${day.tasks.length}` : "—"}</div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function TaskRow({ task, done, onToggle, icon, onPractice }) {
  return (
    <div style={{ display:"flex", gap:10, alignItems:"center", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" }}>
      <button style={{ ...ts.check, background: done ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)", borderColor: done ? "#10b981" : "rgba(255,255,255,0.12)" }} onClick={onToggle}>
        {done ? "✓" : ""}
      </button>
      <div style={{ flex:1 }}>
        <div style={{ fontSize:14, color: done ? "#4B5563" : "#F1F5F9", textDecoration: done ? "line-through" : "none" }}>
          {icon} {task.text}
        </div>
        <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{task.mins} min</div>
      </div>
      {!done && <button style={ts.goBtn} onClick={onPractice}>Go →</button>}
    </div>
  );
}

const ts = {
  check: { width:26, height:26, borderRadius:6, border:"2px solid", cursor:"pointer", fontSize:14, flexShrink:0, color:"#10b981", fontFamily:"sans-serif" },
  goBtn: { background:"rgba(124,92,255,0.15)", color:"#7C5CFF", border:"1px solid rgba(124,92,255,0.3)", borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"'Plus Jakarta Sans',sans-serif" },
};

const s = {
  page:       { minHeight:"100vh", background:"#0B1020", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#F1F5F9", paddingBottom:40 },
  header:     { background:"#141c2e", padding:"16px 20px", display:"flex", gap:14, alignItems:"flex-start", borderBottom:"1px solid rgba(255,255,255,0.07)", position:"sticky", top:0, zIndex:10 },
  back:       { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:18, flexShrink:0 },
  title:      { fontSize:18, fontWeight:800, color:"#fff" },
  sub:        { fontSize:13, color:"#64748b", marginTop:2 },
  content:    { padding:"20px 16px", maxWidth:640, margin:"0 auto" },
  card:       { background:"#141c2e", border:"1px solid rgba(255,255,255,0.08)", borderRadius:14, padding:"16px", marginBottom:16 },
  cardTitle:  { fontSize:15, fontWeight:700, marginBottom:10, color:"#F1F5F9", display:"flex", alignItems:"center" },
  hint:       { fontSize:12.5, color:"#64748b", marginBottom:14, lineHeight:1.6 },
  dateInput:  { width:"100%", background:"#0B1020", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"12px 14px", color:"#F1F5F9", fontSize:15, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" },
  daysLeft:   { marginTop:10, fontSize:13, color:"#94a3b8", lineHeight:1.5 },
  btn:        { background:"#7C5CFF", color:"#fff", border:"none", borderRadius:10, padding:"13px", fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" },
  barTrack:   { height:6, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden" },
  barFill:    { height:6, background:"#7C5CFF", borderRadius:3, transition:"width .5s ease" },
  aiTag:      { fontSize:10, background:"rgba(124,92,255,0.2)", color:"#a29bfe", border:"1px solid rgba(124,92,255,0.3)", borderRadius:8, padding:"1px 7px", marginLeft:8, fontWeight:700 },
  sectionLabel:{ fontSize:11, fontWeight:700, color:"#4B5563", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, marginTop:4 },
  dayRow:     { background:"#141c2e", border:"1px solid", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", gap:12, alignItems:"flex-start" },
  dayLeft:    { minWidth:44, textAlign:"center", flexShrink:0 },
  dayName:    { fontSize:10, fontWeight:800, letterSpacing:".05em" },
  dayDate:    { fontSize:11, color:"#64748b", marginTop:2 },
  miniTask:   { fontSize:12, lineHeight:1.7 },
  dayProg:    { fontSize:11, color:"#64748b", fontWeight:700, alignSelf:"center", minWidth:24, textAlign:"right" },
  empty:      { textAlign:"center", padding:"40px 20px" },

  progressRow: { display:"flex", justifyContent:"space-between", marginBottom:20, padding:"0 4px" },
  progressDot: (activeStep, doneStep) => ({ display:"flex", flexDirection:"column", alignItems:"center", flex:1, opacity: activeStep || doneStep ? 1 : 0.45 }),
  progressCircle: (activeStep, doneStep) => ({
    width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center",
    fontSize:11, fontWeight:800, marginBottom:4,
    background: doneStep ? "#10b981" : activeStep ? "#7C5CFF" : "rgba(255,255,255,0.08)",
    color: doneStep || activeStep ? "#fff" : "#64748b",
  }),
  progressLabel: (activeStep) => ({ fontSize:9, color: activeStep ? "#F1F5F9" : "#64748b", textAlign:"center", fontWeight: activeStep ? 700 : 500 }),
  chipGrid:   { display:"flex", flexWrap:"wrap", gap:8 },
  chip: (active, warn) => ({
    padding:"9px 14px", borderRadius:10, fontSize:13, fontWeight:600, cursor:"pointer",
    fontFamily:"'Plus Jakarta Sans',sans-serif",
    background: active ? (warn ? "rgba(245,158,11,0.15)" : "rgba(124,92,255,0.18)") : "rgba(255,255,255,0.05)",
    color: active ? (warn ? "#f59e0b" : "#a29bfe") : "#94a3b8",
    border: `1px solid ${active ? (warn ? "rgba(245,158,11,0.4)" : "rgba(124,92,255,0.4)") : "rgba(255,255,255,0.1)"}`,
  }),
  hourRow:    { display:"flex", alignItems:"center", gap:10, marginBottom:12 },
  hourDayLabel: { fontSize:12, color:"#94a3b8", width:76, flexShrink:0, fontWeight:600 },
  slider:     { flex:1, accentColor:"#7C5CFF" },
  hourValue:  { fontSize:12, color:"#F1F5F9", width:32, textAlign:"right", fontWeight:700, flexShrink:0 },
  totalHours: { fontSize:12.5, color:"#94a3b8", marginTop:6, textAlign:"right" },
  reviewRow:  { display:"flex", justifyContent:"space-between", gap:12, padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,0.05)", fontSize:12.5, color:"#94a3b8" },
  wizardNav:  { display:"flex", justifyContent:"space-between", marginTop:6 },
  navBtn:     { background:"#7C5CFF", color:"#fff", border:"none", borderRadius:10, padding:"11px 20px", fontWeight:700, cursor:"pointer", fontSize:13.5, fontFamily:"'Plus Jakarta Sans',sans-serif", marginLeft:"auto" },
  navBtnGhost:{ background:"transparent", color:"#94a3b8", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, padding:"11px 20px", fontWeight:600, cursor:"pointer", fontSize:13.5, fontFamily:"'Plus Jakarta Sans',sans-serif" },
};
