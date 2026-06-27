import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "";
const token = () => localStorage.getItem("token");
const h = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${token()}` });

export default function WeaknessDetector() {
  const nav = useNavigate();
  const [report,    setReport]    = useState(null);
  const [progress,  setProgress]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState("report"); // report | progress | practice
  const [practicing,setPracticing]= useState(null);    // { questions, subject, topic }
  const [qIdx,      setQIdx]      = useState(0);
  const [selected,  setSelected]  = useState(null);
  const [revealed,  setRevealed]  = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API}/weakness-detector`,          { headers: h() }).then(r => r.json()),
        fetch(`${API}/weakness-detector/progress`, { headers: h() }).then(r => r.json()),
      ]);
      setReport(r1);
      setProgress(r2.progress || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startPractice = async (subject, topic) => {
    try {
      const r = await fetch(`${API}/weakness-detector/practice`, {
        method:"POST", headers: h(),
        body: JSON.stringify({ subject, topic, count: 10 })
      });
      const d = await r.json();
      if (d.questions?.length) {
        setPracticing(d);
        setQIdx(0); setSelected(null); setRevealed(false);
        setTab("practice");
      }
    } catch {}
  };

  const submitAnswer = (choice) => {
    if (revealed) return;
    setSelected(choice);
    setRevealed(true);
  };

  const nextQ = () => {
    if (qIdx + 1 >= (practicing?.questions?.length || 0)) {
      setPracticing(null); setTab("report");
    } else {
      setQIdx(q => q + 1); setSelected(null); setRevealed(false);
    }
  };

  const s = {
    page:  { minHeight:"100vh", background:"var(--bg)", color:"var(--text)", padding:"16px", paddingBottom:90 },
    head:  { display:"flex", alignItems:"center", gap:12, marginBottom:20 },
    back:  { background:"none", border:"none", color:"var(--text-muted)", fontSize:22, cursor:"pointer", padding:0 },
    tabs:  { display:"flex", gap:8, marginBottom:20, overflowX:"auto" },
    tab:   (a) => ({ padding:"8px 16px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700, fontSize:13,
                     background: a ? "var(--primary)" : "rgba(255,255,255,0.07)",
                     color: a ? "#fff" : "var(--text-muted)" }),
    card:  { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:"16px", marginBottom:12 },
    zone:  (z) => ({ display:"inline-flex", alignItems:"center", gap:4, padding:"3px 10px", borderRadius:12,
                     background: z==="red"?"rgba(255,90,95,0.15)":z==="orange"?"rgba(255,200,87,0.15)":"rgba(0,208,132,0.15)",
                     color: z==="red"?"#FF5A5F":z==="orange"?"#FFC857":"#00D084", fontSize:12, fontWeight:700 }),
    bar:   { height:8, borderRadius:8, background:"rgba(255,255,255,0.08)", overflow:"hidden", marginTop:6 },
    fill:  (pct, z) => ({ height:"100%", borderRadius:8, width:`${pct}%`,
                          background: z==="red"?"#FF5A5F":z==="orange"?"#FFC857":"#00D084",
                          transition:"width 1s cubic-bezier(0.25,0.46,0.45,0.94)" }),
    opt:   (sel, rev, corr, choice) => {
      let bg = "rgba(255,255,255,0.06)"; let border = "var(--border)";
      if (rev && choice === corr)  { bg="rgba(0,208,132,0.2)"; border="#00D084"; }
      if (rev && sel===choice && choice!==corr) { bg="rgba(255,90,95,0.2)"; border="#FF5A5F"; }
      return { padding:"12px 14px", borderRadius:10, border:`1.5px solid ${border}`, background:bg,
               cursor:"pointer", marginBottom:8, display:"block", width:"100%", textAlign:"left",
               color:"var(--text)", fontSize:14, fontWeight:600, transition:"all 0.2s" };
    },
  };

  if (loading) return (
    <div style={{ ...s.page, display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16 }}>
      <div className="loader-ring" />
      <div style={{ color:"var(--text-muted)", fontSize:14 }}>Analysing your exam history...</div>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.head}>
        <button style={s.back} onClick={() => nav(-1)}>←</button>
        <div>
          <div style={{ fontWeight:900, fontSize:20 }}>🎯 Weakness Detector</div>
          <div style={{ color:"var(--text-muted)", fontSize:12 }}>AI-powered topic analysis</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[["report","📊 Report"],["progress","📈 Progress"],].map(([id,lbl]) => (
          <button key={id} style={s.tab(tab===id)} onClick={()=>setTab(id)}>{lbl}</button>
        ))}
      </div>

      {/* ── REPORT TAB ── */}
      {tab === "report" && report && (
        <>
          {!report.hasData ? (
            <div style={{ ...s.card, textAlign:"center", padding:32 }}>
              <div style={{ fontSize:48, marginBottom:12 }}>📝</div>
              <div style={{ fontWeight:700, fontSize:16, marginBottom:8 }}>No data yet</div>
              <div style={{ color:"var(--text-muted)", fontSize:13 }}>Complete at least 3 exam questions per topic to generate your weakness report.</div>
              <button onClick={()=>nav("/exam-select")} style={{ marginTop:16, padding:"10px 24px", background:"var(--primary)", border:"none", borderRadius:10, color:"#fff", fontWeight:700, cursor:"pointer" }}>Start an Exam</button>
            </div>
          ) : (
            <>
              {/* Subject summary */}
              <div style={{ fontWeight:800, fontSize:14, marginBottom:10, color:"var(--text-muted)" }}>SUBJECT OVERVIEW</div>
              {report.subjectSummary?.slice(0,6).map((s2, i) => (
                <div key={i} style={s.card}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{s2.subject}</div>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <span style={s.zone(s2.accuracy<50?"red":s2.accuracy<70?"orange":"green")}>{s2.accuracy}%</span>
                      {s2.weakCount>0&&<span style={{ fontSize:11, color:"#FF5A5F" }}>⚠️{s2.weakCount} weak</span>}
                    </div>
                  </div>
                  <div style={s.bar}><div style={s.fill(s2.accuracy,s2.accuracy<50?"red":s2.accuracy<70?"orange":"green")} /></div>
                  <div style={{ color:"var(--text-muted)", fontSize:11, marginTop:4 }}>{s2.correct}/{s2.total} correct</div>
                </div>
              ))}

              {/* Weak topics */}
              {report.weakTopics?.length > 0 && (
                <>
                  <div style={{ fontWeight:800, fontSize:14, margin:"16px 0 10px", color:"#FF5A5F" }}>❌ RED ZONE — Under 50%</div>
                  {report.weakTopics.slice(0,8).map((t,i) => (
                    <div key={i} style={{ ...s.card, border:"1px solid rgba(255,90,95,0.3)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{t.topic}</div>
                          <div style={{ color:"var(--text-muted)", fontSize:12 }}>{t.subject} · {t.total} questions attempted</div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                          <span style={s.zone("red")}>{t.accuracy}%</span>
                          <button onClick={()=>startPractice(t.subject,t.topic)}
                            style={{ padding:"5px 12px", background:"rgba(255,90,95,0.2)", border:"1px solid #FF5A5F", borderRadius:8, color:"#FF5A5F", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                            Practice
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Danger topics */}
              {report.dangerTopics?.length > 0 && (
                <>
                  <div style={{ fontWeight:800, fontSize:14, margin:"16px 0 10px", color:"#FFC857" }}>⚠️ DANGER ZONE — 50–69%</div>
                  {report.dangerTopics.slice(0,6).map((t,i) => (
                    <div key={i} style={{ ...s.card, border:"1px solid rgba(255,200,87,0.3)" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:13 }}>{t.topic}</div>
                          <div style={{ color:"var(--text-muted)", fontSize:12 }}>{t.subject}</div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                          <span style={s.zone("orange")}>{t.accuracy}%</span>
                          <button onClick={()=>startPractice(t.subject,t.topic)}
                            style={{ padding:"5px 12px", background:"rgba(255,200,87,0.15)", border:"1px solid #FFC857", borderRadius:8, color:"#FFC857", fontWeight:700, fontSize:11, cursor:"pointer" }}>
                            Practice
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* AI Plan */}
              {report.plan && (
                <>
                  <div style={{ fontWeight:800, fontSize:14, margin:"16px 0 10px", color:"var(--primary)" }}>🤖 AI IMPROVEMENT PLAN</div>
                  <div style={{ ...s.card, background:"rgba(124,92,255,0.08)", border:"1px solid rgba(124,92,255,0.3)" }}>
                    <div style={{ fontSize:13, lineHeight:1.7, whiteSpace:"pre-wrap", color:"var(--text-sub)" }}>{report.plan}</div>
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── PROGRESS TAB ── */}
      {tab === "progress" && (
        <>
          <div style={{ fontWeight:800, fontSize:14, marginBottom:10, color:"var(--text-muted)" }}>WEEK-ON-WEEK CHANGES</div>
          {progress.length === 0 ? (
            <div style={{ ...s.card, textAlign:"center", padding:24, color:"var(--text-muted)" }}>No week-on-week data yet. Keep practicing!</div>
          ) : progress.map((p,i) => (
            <div key={i} style={s.card}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13 }}>{p.topic}</div>
                  <div style={{ color:"var(--text-muted)", fontSize:12 }}>{p.subject}</div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontWeight:800, fontSize:16, color: p.trend==="improving"?"#00D084":p.trend==="declining"?"#FF5A5F":"var(--text-muted)" }}>
                    {p.trend==="improving"?"↑":p.trend==="declining"?"↓":"→"} {p.accuracy}%
                  </div>
                  {p.delta!=null && <div style={{ fontSize:11, color:"var(--text-muted)" }}>
                    {p.delta>0?"+":""}{p.delta?.toFixed(1)}% from last week
                  </div>}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── PRACTICE TAB ── */}
      {tab === "practice" && practicing && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:14 }}>{practicing.topic || practicing.subject}</div>
            <div style={{ color:"var(--text-muted)", fontSize:13 }}>{qIdx+1}/{practicing.questions.length}</div>
          </div>
          <div style={s.bar}><div style={{ ...s.fill((qIdx/practicing.questions.length)*100,"green"), transition:"width 0.3s" }} /></div>

          {(() => {
            const q = practicing.questions[qIdx];
            if (!q) return null;
            const opts = [["A",q.option_a],["B",q.option_b],["C",q.option_c],["D",q.option_d]];
            return (
              <div style={{ marginTop:20 }}>
                <div style={{ ...s.card, fontSize:15, fontWeight:600, lineHeight:1.6 }}>{q.question}</div>
                {opts.map(([k,v]) => v && (
                  <button key={k} style={s.opt(selected,revealed,q.correct_answer,k)} onClick={()=>submitAnswer(k)}>
                    <span style={{ fontWeight:800, color:"var(--primary)", marginRight:8 }}>{k}.</span>{v}
                  </button>
                ))}
                {revealed && (
                  <div style={{ ...s.card, background: selected===q.correct_answer?"rgba(0,208,132,0.12)":"rgba(255,90,95,0.12)", border:`1px solid ${selected===q.correct_answer?"#00D084":"#FF5A5F"}`, marginTop:8 }}>
                    <div style={{ fontWeight:800, color: selected===q.correct_answer?"#00D084":"#FF5A5F" }}>
                      {selected===q.correct_answer?"✅ Correct!":"❌ Wrong — Answer: "+q.correct_answer}
                    </div>
                    {q.explanation && <div style={{ color:"var(--text-sub)", fontSize:13, marginTop:6, lineHeight:1.6 }}>{q.explanation}</div>}
                    <button onClick={nextQ} style={{ marginTop:12, padding:"10px 24px", background:"var(--primary)", border:"none", borderRadius:10, color:"#fff", fontWeight:700, cursor:"pointer", fontSize:14 }}>
                      {qIdx+1>=practicing.questions.length?"Finish":"Next →"}
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
