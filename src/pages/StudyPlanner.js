import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

const JAMB_SUBJECTS = ["English Language","Mathematics","Biology","Chemistry","Physics","Economics","Government","Literature in English","Geography","Agricultural Science","Commerce","Accounting"];
const DAYS_LABEL = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

export default function StudyPlanner() {
  const nav = useNavigate();
  const { student } = useAuth();

  const [examDate,   setExamDate]   = useState(localStorage.getItem("jamb_exam_date") || "");
  const [weakData,   setWeakData]   = useState(null);
  const [plan,       setPlan]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("study_plan") || "null"); } catch { return null; }
  });
  const [done,       setDone]       = useState(() => {
    try { return JSON.parse(localStorage.getItem("study_done") || "{}"); } catch { return {}; }
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    API.get("/exam/heatmap").then(r => setWeakData(r.data?.heatmap || [])).catch(() => {});
  }, []);

  const daysLeft = useMemo(() => {
    if (!examDate) return null;
    const diff = Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  }, [examDate]);

  const generatePlan = () => {
    if (!examDate) return;
    setGenerating(true);

    const weak   = (weakData || []).filter(s => s.strength === "weak").map(s => s.subject);
    const medium = (weakData || []).filter(s => s.strength === "medium").map(s => s.subject);
    const strong = (weakData || []).filter(s => s.strength === "strong").map(s => s.subject);
    const subjects = [...new Set([...weak, ...medium, ...strong, ...JAMB_SUBJECTS.slice(0,4)])].slice(0,6);
    const days = Math.min(daysLeft, 30);

    // Generate a smart 7-day rolling plan
    const planDays = [];
    const today = new Date();
    for (let d = 0; d < Math.min(days, 28); d++) {
      const date    = new Date(today);
      date.setDate(today.getDate() + d);
      const subj    = subjects[d % subjects.length];
      const isWeak  = weak.includes(subj);
      const isMed   = medium.includes(subj);
      const tasks   = [
        { id:`${d}-1`, text:`Practice 40 ${subj} questions`, type:"exam", subject: subj, mins: 45 },
        ...(isWeak ? [{ id:`${d}-2`, text:`Review ${subj} wrong answers`, type:"review", subject: subj, mins: 20 }] : []),
        ...(d % 7 === 6 ? [{ id:`${d}-3`, text:`Full JAMB mock exam`, type:"mock", subject:"All", mins: 120 }] : []),
      ];
      planDays.push({ date: date.toISOString().split("T")[0], day: DAYS_LABEL[date.getDay()], tasks });
    }

    const newPlan = { created: new Date().toISOString(), examDate, days: planDays, subjects };
    setPlan(newPlan);
    localStorage.setItem("study_plan", JSON.stringify(newPlan));
    localStorage.setItem("jamb_exam_date", examDate);
    setGenerating(false);
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

  const TASK_ICON = { exam:"📝", review:"🔍", mock:"🎯" };

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
        {/* EXAM DATE PICKER */}
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
                  ? `⚠️ ${daysLeft} days left — focus on weak subjects!`
                  : `⏳ ${daysLeft} days left to prepare`}
            </div>
          )}
          <button
            style={{ ...s.btn, opacity: !examDate || generating ? 0.6 : 1, marginTop:12, width:"100%" }}
            disabled={!examDate || generating}
            onClick={generatePlan}
          >
            {generating ? "Generating..." : plan ? "🔄 Regenerate Plan" : "✨ Generate My Plan"}
          </button>
        </div>

        {plan && (
          <>
            {/* OVERALL PROGRESS */}
            <div style={s.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <div style={s.cardTitle}>📊 Overall Progress</div>
                <div style={{ fontSize:16, fontWeight:800, color:"#7C5CFF" }}>{pct}%</div>
              </div>
              <div style={s.barTrack}>
                <div style={{ ...s.barFill, width:`${pct}%` }} />
              </div>
              <div style={{ fontSize:12, color:"#64748b", marginTop:6 }}>
                {doneTasks} / {totalTasks} tasks completed · {plan.days.length} days planned
              </div>
            </div>

            {/* TODAY'S TASKS */}
            {todayPlan && (
              <div style={{ ...s.card, borderColor:"rgba(124,92,255,0.3)" }}>
                <div style={s.cardTitle}>⚡ Today — {todayPlan.day}</div>
                {todayPlan.tasks.map(task => (
                  <TaskRow key={task.id} task={task} done={!!done[task.id]} onToggle={() => toggleDone(task.id)}
                    icon={TASK_ICON[task.type]}
                    onPractice={() => nav(`/exam?exam_type=JAMB&subject=${encodeURIComponent(task.subject)}&mode=${task.type === "review" ? "weakness" : "exam"}&limit=40`)}
                  />
                ))}
              </div>
            )}

            {/* WEEKLY CALENDAR */}
            <div style={s.sectionLabel}>Full Schedule</div>
            {plan.days.map((day, i) => {
              const dayDone = day.tasks.filter(t => done[t.id]).length;
              const isToday = day.date === today;
              const isPast  = day.date < today;
              return (
                <div key={day.date} style={{ ...s.dayRow, opacity: isPast && !isToday ? 0.5 : 1, borderColor: isToday ? "rgba(124,92,255,0.4)" : "rgba(255,255,255,0.06)" }}>
                  <div style={s.dayLeft}>
                    <div style={{ ...s.dayName, color: isToday ? "#7C5CFF" : "#94a3b8" }}>
                      {isToday ? "TODAY" : day.day}
                    </div>
                    <div style={s.dayDate}>{new Date(day.date+"T12:00:00").toLocaleDateString("en-NG",{ month:"short", day:"numeric" })}</div>
                  </div>
                  <div style={{ flex:1 }}>
                    {day.tasks.map(task => (
                      <div key={task.id} style={{ ...s.miniTask, textDecoration: done[task.id] ? "line-through" : "none", color: done[task.id] ? "#4B5563" : "#e2e8f0" }}>
                        {TASK_ICON[task.type]} {task.text}
                      </div>
                    ))}
                  </div>
                  <div style={s.dayProg}>{dayDone}/{day.tasks.length}</div>
                </div>
              );
            })}
          </>
        )}

        {!plan && (
          <div style={s.empty}>
            <div style={{ fontSize:48 }}>📚</div>
            <p style={{ color:"#64748b", marginTop:12, fontSize:14 }}>Enter your exam date above to generate a personalised study plan based on your weak subjects.</p>
          </div>
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
      {!done && (
        <button style={ts.goBtn} onClick={onPractice}>Go →</button>
      )}
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
  cardTitle:  { fontSize:15, fontWeight:700, marginBottom:10, color:"#F1F5F9" },
  dateInput:  { width:"100%", background:"#0B1020", border:"1px solid rgba(255,255,255,0.12)", borderRadius:10, padding:"12px 14px", color:"#F1F5F9", fontSize:15, fontFamily:"'Plus Jakarta Sans',sans-serif", outline:"none" },
  daysLeft:   { marginTop:10, fontSize:13, color:"#94a3b8", lineHeight:1.5 },
  btn:        { background:"#7C5CFF", color:"#fff", border:"none", borderRadius:10, padding:"13px", fontWeight:700, cursor:"pointer", fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" },
  barTrack:   { height:6, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden" },
  barFill:    { height:6, background:"#7C5CFF", borderRadius:3, transition:"width .5s ease" },
  sectionLabel:{ fontSize:11, fontWeight:700, color:"#4B5563", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10, marginTop:4 },
  dayRow:     { background:"#141c2e", border:"1px solid", borderRadius:12, padding:"12px 14px", marginBottom:8, display:"flex", gap:12, alignItems:"flex-start" },
  dayLeft:    { minWidth:44, textAlign:"center", flexShrink:0 },
  dayName:    { fontSize:10, fontWeight:800, letterSpacing:".05em" },
  dayDate:    { fontSize:11, color:"#64748b", marginTop:2 },
  miniTask:   { fontSize:12, lineHeight:1.7 },
  dayProg:    { fontSize:11, color:"#64748b", fontWeight:700, alignSelf:"center", minWidth:24, textAlign:"right" },
  empty:      { textAlign:"center", padding:"40px 20px" },
};
