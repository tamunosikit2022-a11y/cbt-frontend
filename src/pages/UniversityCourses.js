/**
 * UniversityCourses.js — /university
 * NEW FEATURE: Real university course past questions.
 * Currently covers UNIPORT GES112, GES103. More added as PDFs are uploaded.
 * Integrates with the existing exam engine — questions stored as exam_type="UNIVERSITY".
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const SCHOOLS = [
  {
    id: "UNIPORT",
    name: "University of Port Harcourt",
    short: "UNIPORT",
    state: "Rivers",
    icon: "🏛️",
    color: "#00D4AA",
    courses: [
      { code:"GES112", title:"Nigerian Peoples & Culture", unit:2, level:100, questions:60, topics:["Yoruba History","Hausa Culture","Igbo Traditions","Nigerian Art","Pre-1800 Kingdoms"] },
      { code:"GES103", title:"Nigerian Peoples & Culture (103)", unit:2, level:100, questions:40, topics:["HIV/AIDS in Nigeria","Ethnic Groups","Cultural Practices","Land Tenure","Social Institutions"] },
      { code:"GES101", title:"Use of English", unit:2, level:100, questions:50, topics:["Grammar","Comprehension","Figures of Speech","Vocabulary","Writing Skills"] },
    ],
  },
  {
    id: "UI",
    name: "University of Ibadan",
    short: "UI",
    state: "Oyo",
    icon: "🎓",
    color: "#7C5CFF",
    courses: [
      { code:"GST 111", title:"Communication in English", unit:2, level:100, questions:0, coming:true },
      { code:"GST 112", title:"Logic & Philosophy",       unit:2, level:100, questions:0, coming:true },
    ],
  },
  {
    id: "UNILAG",
    name: "University of Lagos",
    short: "UNILAG",
    state: "Lagos",
    icon: "🏙️",
    color: "#3B82F6",
    courses: [
      { code:"LIN 101", title:"Introduction to Linguistics", unit:2, level:100, questions:0, coming:true },
    ],
  },
  {
    id: "OAU",
    name: "Obafemi Awolowo University",
    short: "OAU",
    state: "Osun",
    icon: "🌳",
    color: "#22C55E",
    courses: [
      { code:"GSE 101", title:"Use of English",   unit:2, level:100, questions:0, coming:true },
    ],
  },
];

const C = {
  bg: "var(--bg,#0A0A0F)", surf: "var(--surface,#13131A)", surfA: "var(--surface-alt,#1C1C26)",
  border: "var(--border,rgba(255,255,255,0.08))", text: "var(--text,#FFFFFF)",
  sub: "var(--text-sub,#D1D5DB)", muted: "var(--text-muted,#6B7280)",
  p: "var(--primary,#7C5CFF)", pL: "var(--primary-light,#A98BFF)",
  acc: "var(--accent,#00D4AA)", gold: "var(--gold,#F59E0B)",
};

export default function UniversityCourses() {
  const nav = useNavigate();
  const [selected, setSelected] = useState("UNIPORT");
  const [counts, setCounts] = useState({});
  const [mobile]  = useState(window.innerWidth < 768);

  useEffect(() => {
    // Get real question counts from backend
    API.get("/exam/university-course-counts").then(r => {
      setCounts(r.data?.counts || {});
    }).catch(() => {});
  }, []);

  const school = SCHOOLS.find(s => s.id === selected) || SCHOOLS[0];

  const startCourse = (course) => {
    if (course.coming) return;
    // Go straight to the exam engine — ExamSelect is a subject-picker UI and
    // has no concept of a pre-chosen university course, so routing through it
    // silently dropped institution/course_code/subject and fell back to JAMB.
    nav(`/exam?exam_type=UNIVERSITY&institution=${selected}&subject=${encodeURIComponent(course.title)}&mode=exam&limit=${course.questions || 40}&time=${course.questions || 40}`);
  };

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", color:C.text }}>
      {/* Header */}
      <div style={{ background:C.surf, borderBottom:`1px solid ${C.border}`, padding: mobile ? "14px 16px" : "18px 28px", display:"flex", alignItems:"center", gap:12, position:"sticky", top:0, zIndex:10, backdropFilter:"blur(12px)" }}>
        <button onClick={() => nav("/dashboard")} style={{ background:"none", border:"none", color:C.pL, fontWeight:700, cursor:"pointer", fontSize:14 }}>← Back</button>
        <div>
          <div style={{ fontWeight:900, fontSize:18, color:C.text }}>🎓 University Past Questions</div>
          <div style={{ fontSize:12, color:C.muted }}>Real course exams from Nigerian universities</div>
        </div>
      </div>

      <div style={{ maxWidth:900, margin:"0 auto", padding: mobile ? "16px 14px 80px" : "24px 28px 40px" }}>

        {/* Intro banner */}
        <div style={{ background:`linear-gradient(120deg,rgba(0,212,170,.14),rgba(124,92,255,.08))`, border:`1px solid rgba(0,212,170,.3)`, borderRadius:18, padding:"20px 22px", marginBottom:24 }}>
          <div style={{ fontWeight:900, fontSize:17, marginBottom:6 }}>Practice Real University Exams 📚</div>
          <div style={{ fontSize:13, color:C.sub, lineHeight:1.6 }}>
            Actual past questions from university courses — GES112, GES103 and more. Prepare for your university CBT exams with questions that have appeared in real tests.
          </div>
          <div style={{ marginTop:14, display:"flex", gap:10, flexWrap:"wrap" }}>
            <div style={{ background:"rgba(0,212,170,.12)", border:"1px solid rgba(0,212,170,.25)", borderRadius:20, padding:"5px 13px", fontSize:11, fontWeight:700, color:C.acc }}>✅ Real exam questions</div>
            <div style={{ background:"rgba(124,92,255,.12)", border:"1px solid rgba(124,92,255,.25)", borderRadius:20, padding:"5px 13px", fontSize:11, fontWeight:700, color:C.pL }}>🤖 AI explanations</div>
            <div style={{ background:"rgba(245,158,11,.12)", border:"1px solid rgba(245,158,11,.25)", borderRadius:20, padding:"5px 13px", fontSize:11, fontWeight:700, color:C.gold }}>📊 Performance tracking</div>
          </div>
        </div>

        {/* School selector */}
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:800, color:C.muted, letterSpacing:.8, textTransform:"uppercase", marginBottom:10 }}>Select University</div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
            {SCHOOLS.map(s => (
              <button key={s.id} onClick={() => setSelected(s.id)} style={{
                display:"flex", alignItems:"center", gap:8, padding:"9px 14px",
                borderRadius:12, border:`1px solid ${selected === s.id ? s.color + "60" : C.border}`,
                background: selected === s.id ? `${s.color}14` : C.surf,
                color: selected === s.id ? C.text : C.muted,
                fontWeight: selected === s.id ? 800 : 600, fontSize:13,
                cursor:"pointer", transition:"all .15s ease",
              }}>
                {s.icon} {s.short}
                {s.courses.every(c => c.coming) && (
                  <span style={{ fontSize:9, background:"rgba(255,255,255,.08)", color:C.muted, padding:"1px 5px", borderRadius:5 }}>Soon</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* School info */}
        <div style={{ background:C.surf, border:`1px solid ${C.border}`, borderRadius:16, padding:"16px 18px", marginBottom:16, display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:48, height:48, borderRadius:13, background:`${school.color}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{school.icon}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:C.text }}>{school.name}</div>
            <div style={{ fontSize:12, color:C.muted }}>📍 {school.state} State · {school.courses.filter(c=>!c.coming).length} courses available</div>
          </div>
        </div>

        {/* Course cards */}
        <div style={{ display:"grid", gridTemplateColumns: mobile ? "1fr" : "1fr 1fr", gap:14 }}>
          {school.courses.map(course => {
            const realCount = counts[`${selected}_${course.code}`] || course.questions;
            return (
              <div key={course.code} onClick={() => startCourse(course)} style={{
                background: course.coming ? C.surf : `linear-gradient(160deg,rgba(0,212,170,.06),${C.surf} 60%)`,
                border:`1px solid ${course.coming ? C.border : "rgba(0,212,170,.25)"}`,
                borderRadius:16, padding:"18px 20px",
                cursor: course.coming ? "default" : "pointer",
                opacity: course.coming ? 0.6 : 1,
                transition:"transform .15s ease, border-color .15s ease",
              }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:900, fontSize:14, color: course.coming ? C.muted : C.acc }}>{course.code}</div>
                    <div style={{ fontWeight:700, fontSize:13, color:C.text, marginTop:2 }}>{course.title}</div>
                  </div>
                  {course.coming
                    ? <span style={{ fontSize:9.5, fontWeight:800, background:C.surfA, color:C.muted, border:`1px solid ${C.border}`, padding:"3px 8px", borderRadius:7 }}>Coming Soon</span>
                    : <span style={{ fontSize:9.5, fontWeight:800, background:"rgba(0,212,170,.15)", color:C.acc, padding:"3px 8px", borderRadius:7 }}>Available</span>
                  }
                </div>

                <div style={{ display:"flex", gap:12, marginBottom:14, fontSize:11, color:C.muted }}>
                  <span>📝 {realCount} questions</span>
                  <span>📚 {course.unit} units</span>
                  <span>🏫 {course.level} Level</span>
                </div>

                {/* Topic tags */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {course.topics.slice(0,3).map(t => (
                    <span key={t} style={{ fontSize:10, fontWeight:600, background:"rgba(255,255,255,.06)", color:C.sub, padding:"3px 8px", borderRadius:8 }}>{t}</span>
                  ))}
                  {course.topics.length > 3 && (
                    <span style={{ fontSize:10, fontWeight:600, background:"rgba(255,255,255,.06)", color:C.muted, padding:"3px 8px", borderRadius:8 }}>+{course.topics.length-3} more</span>
                  )}
                </div>

                {!course.coming && (
                  <div style={{ marginTop:14, display:"flex", alignItems:"center", gap:5, fontSize:12, fontWeight:800, color:C.pL }}>
                    Start Practice →
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Submit PDF notice */}
        <div style={{ marginTop:24, background:"rgba(124,92,255,.06)", border:`1px solid rgba(124,92,255,.2)`, borderRadius:14, padding:"14px 16px", textAlign:"center" }}>
          <div style={{ fontWeight:800, fontSize:13, marginBottom:4 }}>📄 Have a course past question PDF?</div>
          <div style={{ fontSize:12, color:C.muted, lineHeight:1.6 }}>
            Send it to our admin and we'll add the full question bank to your app. New courses added weekly.
          </div>
        </div>
      </div>
    </div>
  );
}
