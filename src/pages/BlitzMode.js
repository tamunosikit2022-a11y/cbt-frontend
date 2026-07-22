import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

const API         = process.env.REACT_APP_API_URL || "";
const SOCKET_URL  = API.replace(/\/api\/?$/, "");
const SUBJECTS = ["Mixed","Mathematics","Physics","Chemistry","Biology","English","Economics"];

export function BlitzModePanel() {
  const nav    = useNavigate();
  const token  = localStorage.getItem("token");
  let me = {};
  try { me = JSON.parse(atob((token||"..").split(".")[1]||"e30=") || "{}"); } catch {}
  const sockRef = useRef(null);

  const [phase,    setPhase]    = useState("lobby");   // lobby|queue|playing|results
  const [subject,  setSubject]  = useState("Mixed");
  const [ranked,   setRanked]   = useState(false);
  const [players,  setPlayers]  = useState(1);
  const [queuePos, setQueuePos] = useState(0);
  const [needed,   setNeeded]   = useState(2);
  const [matchId,  setMatchId]  = useState(null);
  const [question, setQuestion] = useState(null);
  const [answered, setAnswered] = useState(false);
  const [lastResult,setLastResult] = useState(null);
  const [scores,   setScores]   = useState({});
  const [timer,    setTimer]    = useState(5);
  const [results,  setResults]  = useState(null);
  const [opponents,setOpponents]= useState([]);
  const timerRef = useRef(null);

  const connectSocket = useCallback(() => {
    if (sockRef.current) return;
    const s = io(`${SOCKET_URL}/blitz`, { auth:{ token }, transports:["websocket"] });
    sockRef.current = s;

    s.on("blitz:queue_update", d => { setQueuePos(d.position); setNeeded(d.needed); });
    s.on("blitz:start", d => {
      setPhase("playing"); setMatchId(d.roomCode);
      setOpponents(d.players.filter(p => p.id !== me.id));
      setScores(Object.fromEntries(d.players.map(p => [p.id, 0])));
    });
    s.on("blitz:question", d => {
      setQuestion(d); setAnswered(false); setLastResult(null);
      setTimer(Math.floor(d.timeMs/1000));
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => setTimer(t => t <= 1 ? (clearInterval(timerRef.current), 0) : t-1), 1000);
    });
    s.on("blitz:answer_submitted", d => {
      setScores(prev => ({ ...prev, [d.playerId]: d.correct ? (prev[d.playerId]||0) + 2 : Math.max(0,(prev[d.playerId]||0)-1) }));
    });
    s.on("blitz:end", d => {
      clearInterval(timerRef.current);
      setResults(d.results); setPhase("results");
    });
    return s;
  }, [token, me.id]);

  useEffect(() => {
    return () => {
      sockRef.current?.disconnect();
      clearInterval(timerRef.current);
    };
  }, []);

  const joinQueue = () => {
    const s = connectSocket();
    setPhase("queue");
    s.emit("blitz:queue", { playerId:me.id, playerName:me.full_name||"Scholar", subject, ranked, maxPlayers:players }, (cb) => {
      if (!cb?.success) { setPhase("lobby"); }
    });
  };

  const leaveQueue = () => {
    sockRef.current?.emit("blitz:leave_queue");
    setPhase("lobby");
  };

  const submitAnswer = (choice) => {
    if (answered || !question) return;
    setAnswered(true);
    sockRef.current?.emit("blitz:answer", { choice, questionIndex: question.index - 1 }, (cb) => {
      setLastResult(cb);
    });
  };

  const st = {
    page:   { minHeight:"100vh", background:"var(--bg)", color:"var(--text)", padding:"16px", paddingBottom:90 },
    head:   { display:"flex", alignItems:"center", gap:12, marginBottom:20 },
    back:   { background:"none", border:"none", color:"var(--text-muted)", fontSize:22, cursor:"pointer", padding:0 },
    card:   { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, padding:16, marginBottom:12 },
    opt:    (ch, ans, rev, corr) => {
      let bg = "rgba(255,255,255,0.06)"; let bc = "var(--border)";
      if (rev && ch===corr)           { bg="rgba(0,208,132,0.15)"; bc="#00D084"; }
      if (rev && ch===ans && ch!==corr) { bg="rgba(255,90,95,0.15)"; bc="#FF5A5F"; }
      if (!rev && ch===ans)           { bg="rgba(124,92,255,0.2)";  bc="var(--primary)"; }
      return { display:"block", width:"100%", padding:"13px 14px", marginBottom:8, borderRadius:12, border:`2px solid ${bc}`, background:bg,
               color:"var(--text)", cursor:"pointer", textAlign:"left", fontSize:14, fontWeight:700, transition:"all 0.15s" };
    },
    tag: (a) => ({ padding:"7px 14px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700, fontSize:13,
                   background:a?"var(--primary)":"rgba(255,255,255,0.07)", color:a?"#fff":"var(--text-muted)" }),
    timerColor: (t) => t <= 2 ? "#FF5A5F" : t <= 4 ? "#FFC857" : "#00D084",
  };

  // ── RESULTS ──────────────────────────────────────────────────
  if (phase === "results" && results) {
    const myResult = results.find(r => r.playerId === me.id);
    const isWin    = results[0]?.playerId === me.id;
    return (
      <div style={{ ...st.page, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <div style={{ fontSize:60, marginBottom:12 }} className="anim-float">{isWin?"🏆":"😤"}</div>
        <div style={{ fontWeight:900, fontSize:22, marginBottom:4, color:isWin?"#FFC857":"var(--text)" }}>
          {isWin ? "VICTORY!" : "Good Fight!"}
        </div>
        <div style={{ color:"var(--text-muted)", fontSize:14, marginBottom:24 }}>Your score: {myResult?.score || 0} pts</div>

        <div style={{ width:"100%", maxWidth:340 }}>
          {results.map((r,i) => (
            <div key={r.playerId} style={{ ...st.card, display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:i===0?"rgba(255,200,87,0.2)":"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, color:i===0?"#FFC857":"var(--text-muted)", fontSize:16 }}>{i+1}</div>
              <div style={{ flex:1, fontWeight:700 }}>{r.playerId===me.id?"You":"Opponent"}</div>
              <div style={{ fontWeight:900, fontSize:18, color:i===0?"#FFC857":"var(--text-muted)" }}>{r.score}</div>
            </div>
          ))}
        </div>

        <div style={{ display:"flex", gap:10, marginTop:8 }}>
          <button onClick={()=>{ setPhase("lobby"); setResults(null); setQuestion(null); setScores({}); }} style={{ padding:"12px 24px", background:"var(--primary)", border:"none", borderRadius:12, color:"#fff", fontWeight:800, cursor:"pointer" }}>Play Again</button>
          <button onClick={()=>nav(-1)} style={{ padding:"12px 24px", background:"rgba(255,255,255,0.07)", border:"none", borderRadius:12, color:"var(--text-muted)", fontWeight:800, cursor:"pointer" }}>Exit</button>
        </div>
      </div>
    );
  }

  // ── PLAYING ──────────────────────────────────────────────────
  if (phase === "playing" && question) {
    const opts = [["A",question.options?.A],["B",question.options?.B],["C",question.options?.C],["D",question.options?.D]];
    const revealed = !!lastResult;
    return (
      <div style={st.page}>
        {/* Header */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div style={{ fontWeight:700, fontSize:14 }}>Q{question.index}/{question.total}</div>
          <div style={{ fontWeight:900, fontSize:28, color:st.timerColor(timer), transition:"color 0.3s" }} className={timer<=2?"arena-countdown danger":"arena-countdown"}>
            {timer}s
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {opponents.map(op=>(
              <div key={op.id} style={{ textAlign:"center" }}>
                <div style={{ fontWeight:900, fontSize:14, color:"var(--gold,#FFC857)" }}>{scores[op.id]||0}</div>
                <div style={{ fontSize:10, color:"var(--text-muted)" }}>{op.name?.split(" ")[0]||"Opp"}</div>
              </div>
            ))}
            <div style={{ textAlign:"center" }}>
              <div style={{ fontWeight:900, fontSize:14, color:"var(--primary)" }}>{scores[me.id]||0}</div>
              <div style={{ fontSize:10, color:"var(--text-muted)" }}>You</div>
            </div>
          </div>
        </div>

        {/* Timer bar */}
        <div style={{ height:6, background:"rgba(255,255,255,0.08)", borderRadius:6, marginBottom:16, overflow:"hidden" }}>
          <div style={{ height:"100%", borderRadius:6, width:`${(timer/5)*100}%`, background:st.timerColor(timer), transition:"width 1s linear, background 0.3s" }} />
        </div>

        {/* Question */}
        <div style={{ ...st.card, fontSize:15, fontWeight:700, lineHeight:1.7, marginBottom:16 }}>{question.question}</div>

        {/* Options */}
        {opts.map(([k,v]) => v && (
          <button key={k} className={revealed&&k===lastResult?.correctAnswer?"answer-correct":revealed&&k===lastResult?.choice&&k!==lastResult?.correctAnswer?"answer-wrong":""}
            style={st.opt(k, lastResult?.choice, revealed, lastResult?.correctAnswer)}
            onClick={()=>submitAnswer(k)}>
            <span style={{ color:"var(--primary)", marginRight:8, fontWeight:900 }}>{k}.</span>{v}
          </button>
        ))}

        {/* Speed bonus hint */}
        {!answered && timer >= 4 && (
          <div style={{ textAlign:"center", color:"#FFC857", fontSize:12, fontWeight:700, marginTop:8 }}>⚡ Answer in 2s for speed bonus!</div>
        )}

        {revealed && (
          <div style={{ marginTop:8, padding:"10px 14px", background:lastResult?.correct?"rgba(0,208,132,0.1)":"rgba(255,90,95,0.1)", borderRadius:10, border:`1px solid ${lastResult?.correct?"#00D084":"#FF5A5F"}`, textAlign:"center" }}>
            <span style={{ fontWeight:800, color:lastResult?.correct?"#00D084":"#FF5A5F", fontSize:15 }}>
              {lastResult?.correct ? `✅ +${lastResult?.points} pts${lastResult?.points>2?" ⚡ SPEED BONUS!":""}` : "❌ Wrong"}
            </span>
          </div>
        )}
      </div>
    );
  }

  // ── QUEUE ────────────────────────────────────────────────────
  if (phase === "queue") return (
    <div style={{ ...st.page, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16 }}>
      <div style={{ fontSize:60 }} className="anim-spin-slow">🌀</div>
      <div style={{ fontWeight:800, fontSize:18 }}>Finding opponents...</div>
      <div style={{ color:"var(--text-muted)", fontSize:14 }}>{subject} · {queuePos}/{needed} in queue</div>
      <div style={{ color:"var(--text-muted)", fontSize:13 }}>5 seconds per question · Speed bonus for under 2s!</div>
      <button onClick={leaveQueue} style={{ padding:"10px 24px", background:"rgba(255,90,95,0.15)", border:"1px solid rgba(255,90,95,0.3)", borderRadius:12, color:"#FF5A5F", fontWeight:700, cursor:"pointer" }}>Cancel</button>
    </div>
  );

  // ── LOBBY ────────────────────────────────────────────────────
  return (
    <div style={st.page}>
      <div style={st.head}>
        <div>
          <div style={{ fontWeight:900, fontSize:20 }}>⚡ Blitz Mode</div>
          <div style={{ color:"var(--text-muted)", fontSize:12 }}>10 questions · 5 seconds each · Speed wins</div>
        </div>
      </div>

      <div style={{ ...st.card, background:"linear-gradient(135deg,rgba(255,200,87,0.1),rgba(124,92,255,0.08))", border:"1px solid rgba(255,200,87,0.3)", marginBottom:20, textAlign:"center" }}>
        <div style={{ fontSize:48, marginBottom:8 }}>⚡</div>
        <div style={{ fontWeight:900, fontSize:18, marginBottom:6 }}>Lightning-Fast Battles</div>
        <div style={{ color:"var(--text-muted)", fontSize:13, lineHeight:1.6 }}>10 questions · 5 seconds each<br/>Correct = +2 pts · Wrong = -1 pt · Under 2s = +1 bonus</div>
      </div>

      <div style={st.card}>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>Subject</div>
        <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:16 }}>
          {SUBJECTS.map(sub => <button key={sub} style={st.tag(subject===sub)} onClick={()=>setSubject(sub)}>{sub}</button>)}
        </div>
        <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>Players</div>
        <div style={{ display:"flex", gap:6, marginBottom:16 }}>
          {[2,4,8].map(n => <button key={n} style={st.tag(players===n)} onClick={()=>setPlayers(n)}>{n} Players</button>)}
        </div>
        <div style={{ display:"flex", gap:8, marginBottom:16 }}>
          <button style={st.tag(!ranked)} onClick={()=>setRanked(false)}>Casual</button>
          <button style={st.tag(ranked)}  onClick={()=>setRanked(true)}>🏆 Ranked</button>
        </div>

        <button onClick={joinQueue} style={{ width:"100%", padding:"13px 0", background:"linear-gradient(135deg,#FFC857,#FF8C00)", border:"none", borderRadius:12, color:"#1a1200", fontWeight:900, fontSize:16, cursor:"pointer" }}>
          ⚡ Enter Blitz!
        </button>
      </div>
    </div>
  );
}
