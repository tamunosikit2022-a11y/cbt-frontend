import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = process.env.REACT_APP_API_URL || "";
const h = () => ({ "Content-Type":"application/json", Authorization:`Bearer ${localStorage.getItem("token")}` });
const SUBJECTS = ["Mathematics","Physics","Chemistry","Biology","English","Economics","Government","Literature","Geography","Commerce","Accounting"];

export default function AIQuizGenerator() {
  const nav = useNavigate();
  const fileRef = useRef();
  const [mode,       setMode]       = useState("text");   // text | pdf
  const [text,       setText]       = useState("");
  const [pdfFile,    setPdfFile]    = useState(null);
  const [subject,    setSubject]    = useState("");
  const [count,      setCount]      = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [questions,  setQuestions]  = useState([]);
  const [quizName,   setQuizName]   = useState("");
  const [saved,      setSaved]      = useState(false);
  const [error,      setError]      = useState("");
  const [savingId,   setSavingId]   = useState(null);

  // Review state
  const [reviewIdx,  setReviewIdx]  = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [revealed,   setRevealed]   = useState(false);

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const generate = async () => {
    setError(""); setGenerating(true); setQuestions([]); setSaved(false); setReviewIdx(null);

    // abort controller for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      let url = `${API}/ai-quiz/from-text`;
      let body = { text, subject, count, difficulty, sourceType:"notes" };

      if (mode === "pdf") {
        if (!pdfFile) throw new Error("Please select a PDF file.");
        if (pdfFile.size > 5 * 1024 * 1024) throw new Error("PDF is too large. Please use a file under 5 MB for best results.");
        url  = `${API}/ai-quiz/from-pdf`;
        body = { pdfBase64: await toBase64(pdfFile), subject, count, difficulty };
      } else {
        if (!text.trim() || text.length < 50) throw new Error("Please enter at least 50 characters of content.");
      }

      const r = await fetch(url, { method:"POST", headers: h(), body: JSON.stringify(body), signal: controller.signal });
      clearTimeout(timeout);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Generation failed");
      if (!d.questions || d.questions.length === 0) throw new Error("No questions were generated. Try a different PDF or add more text.");
      setQuestions(d.questions || []);
      setQuizName(`${subject||"General"} Quiz — ${new Date().toLocaleDateString()}`);
    } catch (e) {
      clearTimeout(timeout);
      if (e.name === "AbortError") {
        setError("Request timed out after 60 seconds. The PDF may be too large or complex — try a smaller file or use Text mode instead.");
      } else {
        setError(e.message);
      }
    }
    setGenerating(false);
  };

  const saveQuiz = async () => {
    try {
      const r = await fetch(`${API}/ai-quiz/save`, {
        method:"POST", headers: h(),
        body: JSON.stringify({ questions, quizName, subject })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setSavingId(d.quizId); setSaved(true);
    } catch (e) { setError(e.message); }
  };

  const s = {
    page: { minHeight:"100vh", background:"var(--bg)", color:"var(--text)", padding:"16px", paddingBottom:90 },
    head: { display:"flex", alignItems:"center", gap:12, marginBottom:20 },
    back: { background:"none", border:"none", color:"var(--text-muted)", fontSize:22, cursor:"pointer", padding:0 },
    card: { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:16, marginBottom:12 },
    inp:  { width:"100%", padding:"10px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", fontSize:14, boxSizing:"border-box" },
    btn:  (c,dis) => ({ padding:"12px 0", width:"100%", background: dis?"#2a2a3d":c||"var(--primary)", border:"none", borderRadius:12, color:"#fff", fontWeight:800, fontSize:15, cursor:dis?"not-allowed":"pointer", opacity:dis?0.6:1, transition:"all 0.2s" }),
    modeBtn: (a) => ({ flex:1, padding:"10px 0", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", background:a?"var(--primary)":"rgba(255,255,255,0.07)", color:a?"#fff":"var(--text-muted)" }),
    tag:  (a) => ({ padding:"6px 14px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700, fontSize:12, background:a?"rgba(124,92,255,0.2)":"rgba(255,255,255,0.06)", color:a?"var(--primary)":"var(--text-muted)", transition:"all 0.15s" }),
    opt:  (sel,rev,corr,ch) => {
      let bg = "rgba(255,255,255,0.05)"; let bc = "var(--border)";
      if (rev && ch===corr) { bg="rgba(0,208,132,0.15)"; bc="#00D084"; }
      if (rev && sel===ch && ch!==corr) { bg="rgba(255,90,95,0.15)"; bc="#FF5A5F"; }
      return { display:"block", width:"100%", padding:"11px 14px", marginBottom:7, borderRadius:10, border:`1.5px solid ${bc}`, background:bg, color:"var(--text)", cursor:"pointer", textAlign:"left", fontSize:14, fontWeight:600 };
    },
  };

  return (
    <div style={s.page}>
      <div style={s.head}>
        <button style={s.back} onClick={() => nav(-1)}>←</button>
        <div>
          <div style={{ fontWeight:900, fontSize:20 }}>🤖 AI Quiz Generator</div>
          <div style={{ color:"var(--text-muted)", fontSize:12 }}>Generate exam questions from your notes or PDFs</div>
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ display:"flex", gap:8, marginBottom:16 }}>
        <button style={s.modeBtn(mode==="text")} onClick={()=>setMode("text")}>📝 Text / Notes</button>
        <button style={s.modeBtn(mode==="pdf")}  onClick={()=>setMode("pdf") }>📄 PDF Upload</button>
      </div>

      {/* Input area */}
      <div style={s.card}>
        {mode === "text" ? (
          <textarea value={text} onChange={e=>setText(e.target.value)}
            style={{ ...s.inp, minHeight:160, resize:"vertical" }}
            placeholder="Paste your study notes, textbook excerpt, or any content here. The AI will generate exam questions from it..." />
        ) : (
          <div onClick={()=>fileRef.current.click()}
            style={{ border:`2px dashed ${pdfFile?"var(--primary)":"rgba(255,255,255,0.2)"}`, borderRadius:12, padding:28, textAlign:"center", cursor:"pointer", background:pdfFile?"rgba(124,92,255,0.07)":"transparent" }}>
            <input ref={fileRef} type="file" accept="application/pdf" style={{display:"none"}} onChange={e=>setPdfFile(e.target.files[0])} />
            <div style={{ fontSize:36, marginBottom:8 }}>📄</div>
            {pdfFile ? (
              <><div style={{ fontWeight:700, color:"var(--primary)" }}>{pdfFile.name}</div>
                <div style={{ color: pdfFile.size > 5*1024*1024 ? "#FF5A5F" : "var(--text-muted)", fontSize:12, marginTop:4 }}>
                  {(pdfFile.size/1024/1024).toFixed(1)} MB {pdfFile.size > 5*1024*1024 ? "⚠️ Too large — max 5 MB" : "✓ Ready"}
                </div></>
            ) : (
              <><div style={{ fontWeight:700, color:"var(--text-muted)" }}>Tap to select a PDF</div>
                <div style={{ color:"var(--text-muted)", fontSize:12, marginTop:4 }}>Max 5 MB recommended for best results</div></>
            )}
          </div>
        )}
      </div>

      {/* Options */}
      <div style={s.card}>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Subject</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
          {SUBJECTS.map(sub => (
            <button key={sub} style={s.tag(subject===sub)} onClick={()=>setSubject(sub)}>{sub}</button>
          ))}
        </div>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Questions</div>
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {[5,10,15,20].map(n => (
            <button key={n} style={s.tag(count===n)} onClick={()=>setCount(n)}>{n}</button>
          ))}
        </div>
        <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>Difficulty</div>
        <div style={{ display:"flex", gap:6 }}>
          {["easy","medium","hard"].map(d => (
            <button key={d} style={s.tag(difficulty===d)} onClick={()=>setDifficulty(d)}>{d.charAt(0).toUpperCase()+d.slice(1)}</button>
          ))}
        </div>
      </div>

      {error && <div style={{ padding:"10px 14px", background:"rgba(255,90,95,0.1)", border:"1px solid rgba(255,90,95,0.3)", borderRadius:10, color:"#FF5A5F", fontSize:13, fontWeight:600, marginBottom:12 }}>{error}</div>}

      <button onClick={generate} disabled={generating}
        style={s.btn("linear-gradient(135deg,var(--primary),var(--accent,#3B82F6))", generating)}>
        {generating ? "🤖 Generating questions..." : `✨ Generate ${count} Questions`}
      </button>

      {/* Results */}
      {questions.length > 0 && (
        <>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"20px 0 12px" }}>
            <div style={{ fontWeight:800, fontSize:16 }}>✅ {questions.length} Questions Generated</div>
            {!saved && (
              <button onClick={saveQuiz} style={{ padding:"8px 16px", background:"rgba(0,208,132,0.2)", border:"1px solid #00D084", borderRadius:10, color:"#00D084", fontWeight:700, fontSize:12, cursor:"pointer" }}>
                💾 Save Quiz
              </button>
            )}
          </div>
          {saved && <div style={{ color:"#00D084", fontWeight:700, fontSize:13, marginBottom:12 }}>✅ Quiz saved! Find it in your profile.</div>}

          {questions.map((q, i) => (
            <div key={i} style={s.card}>
              {reviewIdx === i ? (
                <>
                  <div style={{ fontWeight:700, fontSize:14, marginBottom:12, lineHeight:1.6 }}>Q{i+1}. {q.question}</div>
                  {[["A",q.option_a],["B",q.option_b],["C",q.option_c],["D",q.option_d]].map(([k,v]) => v && (
                    <button key={k} style={s.opt(selected,revealed,q.correct_answer,k)}
                      onClick={()=>{ if(!revealed){setSelected(k);setRevealed(true);} }}>
                      <span style={{ fontWeight:800, color:"var(--primary)", marginRight:8 }}>{k}.</span>{v}
                    </button>
                  ))}
                  {revealed && (
                    <div style={{ marginTop:8, padding:"10px 14px", background:"rgba(0,208,132,0.1)", border:"1px solid #00D084", borderRadius:10 }}>
                      <div style={{ fontWeight:700, color:"#00D084" }}>Answer: {q.correct_answer}</div>
                      {q.explanation && <div style={{ color:"var(--text-sub)", fontSize:13, marginTop:4, lineHeight:1.6 }}>{q.explanation}</div>}
                    </div>
                  )}
                  <button onClick={()=>{setReviewIdx(null);setSelected(null);setRevealed(false);}}
                    style={{ marginTop:10, padding:"7px 14px", background:"rgba(255,255,255,0.07)", border:"none", borderRadius:8, color:"var(--text-muted)", cursor:"pointer", fontSize:12 }}>
                    Close
                  </button>
                </>
              ) : (
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10 }}>
                  <div style={{ fontSize:13, lineHeight:1.5, flex:1 }}>
                    <span style={{ fontWeight:700, color:"var(--primary)", marginRight:6 }}>Q{i+1}.</span>
                    {q.question}
                    {q.topic && <span style={{ display:"block", color:"var(--text-muted)", fontSize:11, marginTop:3 }}>{q.topic}</span>}
                  </div>
                  <button onClick={()=>{setReviewIdx(i);setSelected(null);setRevealed(false);}}
                    style={{ padding:"5px 12px", background:"rgba(124,92,255,0.15)", border:"1px solid rgba(124,92,255,0.3)", borderRadius:8, color:"var(--primary)", fontWeight:700, fontSize:11, cursor:"pointer", flexShrink:0 }}>
                    Try
                  </button>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
