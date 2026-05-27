import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { getArenaSocket } from "../../utils/arenaSocket";

export default function Match() {
  const nav      = useNavigate();
  const { state } = useLocation();
  const socket   = useRef(null);

  const playerId   = state?.playerId;
  const playerName = state?.playerName;
  const room       = state?.room;

  const [question,    setQuestion]    = useState(state?.firstQuestion?.question || null);
  const [qIndex,      setQIndex]      = useState(state?.firstQuestion?.questionIndex ?? 0);
  const [totalQ,      setTotalQ]      = useState(state?.firstQuestion?.totalQuestions ?? 0);
  const [timeLimit,   setTimeLimit]   = useState(state?.firstQuestion?.timeLimit ?? 20);
  const [timeLeft,    setTimeLeft]    = useState(state?.firstQuestion?.timeLimit ?? 20);
  const [scores,      setScores]      = useState(state?.firstQuestion?.scores || []);
  const [selected,    setSelected]    = useState(null);
  const [revealed,    setRevealed]    = useState(false);
  const [correct,     setCorrect]     = useState(null);
  const [myResult,    setMyResult]    = useState(null);
  const [myLives,     setMyLives]     = useState(3);
  const [eliminated,  setEliminated]  = useState(false);
  const [showScores,  setShowScores]  = useState(false);
  const [reactions,   setReactions]   = useState([]);
  const [answered,    setAnswered]    = useState(false);

  const timerRef    = useRef(null);
  const qStartTime  = useRef(Date.now());
  
  // Submit lock to prevent double submission
  const submitLock = useRef(false);

  // ── TIMER ─────────────────────────────────────────────
  useEffect(() => {
    if (!question || revealed || answered) return;
    setTimeLeft(timeLimit);
    qStartTime.current = Date.now();

    // Clear any existing timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [question, timeLimit, revealed, answered]);

  // ── SOCKET EVENTS ──────────────────────────────────────
  useEffect(() => {
    // Check if required data exists before connecting socket
    if (!playerId || !room?.code) {
      console.error("Missing required data for socket connection");
      nav("/arena");
      return;
    }

    const sock = getArenaSocket();
    socket.current = sock;

    // FIX BUG 4: Remove any stale listeners before attaching new ones
    sock.off("new_question")
        .off("answer_result")
        .off("score_update")
        .off("question_end")
        .off("player_reaction")
        .off("game_over");

    // Ensure socket is connected
    if (!sock.connected) {
      sock.connect();
    }

    // Join the room
    sock.emit("join_match", { playerId, playerName, roomCode: room.code });

    sock.on("new_question", (data) => {
      clearInterval(timerRef.current);
      setQuestion(data.question);
      setQIndex(data.questionIndex);
      setTotalQ(data.totalQuestions);
      setTimeLimit(data.timeLimit);
      setTimeLeft(data.timeLimit);
      setScores(data.scores || []);
      setSelected(null);
      setRevealed(false);
      setCorrect(null);
      setMyResult(null);
      setAnswered(false);
      submitLock.current = false; // Reset lock for new question
      qStartTime.current = Date.now();
    });

    sock.on("answer_result", (data) => {
      setMyResult(data);
      setMyLives(data.lives ?? 3);
      setEliminated(data.eliminated || false);
      if (data.correct) setCorrect(data.correct);
      submitLock.current = false; // Release lock after result
    });

    sock.on("score_update", (data) => {
      setScores(data.scores || []);
    });

    sock.on("question_end", (data) => {
      clearInterval(timerRef.current);
      setCorrect(data.correct);
      setRevealed(true);
      setScores(data.scores || []);
    });

    sock.on("player_reaction", ({ playerName: n, emoji }) => {
      const id = Date.now();
      setReactions(r => [...r, { id, name: n, emoji }]);
      setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 3000);
    });

    sock.on("game_over", (data) => {
      nav("/arena/results", { state: { ...data, playerId, playerName, room } });
    });

    return () => {
      // FIX BUG 4: Clean up all listeners on unmount
      if (sock) {
        sock.off("new_question");
        sock.off("answer_result");
        sock.off("score_update");
        sock.off("question_end");
        sock.off("player_reaction");
        sock.off("game_over");
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [playerId, playerName, room, nav]); // FIX: Added proper dependencies

  const submitAnswer = useCallback((opt) => {
    // FIX: Use submitLock to prevent double submission
    if (submitLock.current) return;
    if (answered || revealed || eliminated) return;
    
    submitLock.current = true;
    setSelected(opt);
    setAnswered(true);
    clearInterval(timerRef.current);

    const timeSpent = Date.now() - qStartTime.current;
    socket.current?.emit("submit_answer", { answer: opt, timeSpent });
  }, [answered, revealed, eliminated]);

  const sendReaction = (emoji) => {
    socket.current?.emit("reaction", { emoji });
  };

  const timerPct   = totalQ > 0 ? ((qIndex + 1) / totalQ) * 100 : 0;
  const timerColor = timeLeft <= 5 ? "#e17055" : timeLeft <= 10 ? "#fdcb6e" : "#00b894";
  const myScore    = scores.find(s => s.playerId === playerId);

  const optionStyle = (opt) => {
    let bg     = "#1a1a2e";
    let border = "#2d2d44";
    let color  = "#fff";

    if (revealed) {
      if (opt === correct)                  { bg = "#00b894"; border = "#00b894"; }
      else if (opt === selected && opt !== correct) { bg = "#e17055"; border = "#e17055"; }
    } else if (opt === selected) {
      bg = "#6c63ff"; border = "#6c63ff";
    }

    return { ...s.option, background: bg, borderColor: border, color };
  };

  // FIX: Add null check for question
  if (!question) return (
    <div style={{ minHeight: "100vh", background: "#0f0f1a", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "sans-serif" }}>
      <p>Loading match...</p>
    </div>
  );

  return (
    <div style={s.page}>
      <style>{`@import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800;900&display=swap")`}</style>

      {/* FLOATING REACTIONS */}
      <div style={s.reactionsFloat}>
        {reactions.map(r => (
          <div key={r.id} style={s.reactionFloat}>
            <span style={{ fontSize: 11, color: "#a29bfe" }}>{r.name}</span>
            <span style={{ fontSize: 28 }}>{r.emoji}</span>
          </div>
        ))}
      </div>

      {/* TOP BAR */}
      <div style={s.topBar}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={s.qBadge}>Q{qIndex + 1}/{totalQ}</span>
          {question.subject && <span style={s.subjectBadge}>{question.subject}</span>}
        </div>

        {/* LIVES (survival mode) */}
        {room?.battleType === "survival" && (
          <div style={s.livesRow}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} style={{ fontSize: 18, opacity: i < myLives ? 1 : 0.2 }}>❤️</span>
            ))}
          </div>
        )}

        {/* TIMER */}
        <div style={{ ...s.timer, color: timerColor, borderColor: timerColor }}>
          ⏱ {timeLeft}s
        </div>

        {/* MY SCORE */}
        <div style={s.myScore}>
          <span style={{ fontSize: 11, color: "#a29bfe" }}>Score</span>
          <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>{myScore?.score || 0}</span>
        </div>

        {/* SCOREBOARD TOGGLE */}
        <button style={s.scoreToggle} onClick={() => setShowScores(!showScores)}>
          {showScores ? "Hide" : "📊 Scores"}
        </button>
      </div>

      {/* PROGRESS BAR */}
      <div style={s.progressBg}>
        <div style={{ ...s.progressFill, width: `${timerPct}%` }} />
      </div>
      {/* TIME BAR */}
      <div style={s.timeBg}>
        <div style={{ ...s.timeFill, width: `${(timeLeft / timeLimit) * 100}%`, background: timerColor, transition: "width 1s linear" }} />
      </div>

      {/* LIVE SCOREBOARD OVERLAY */}
      {showScores && (
        <div style={s.scoreOverlay}>
          {scores.map((p, i) => (
            <div key={p.playerId} style={{ ...s.scoreRow, opacity: p.eliminated ? 0.4 : 1 }}>
              <span style={{ fontWeight: 800, color: i === 0 ? "#fdcb6e" : "#a29bfe", width: 20 }}>#{p.rank}</span>
              <span style={{ fontSize: 18 }}>{p.avatar}</span>
              <span style={{ flex: 1, color: p.playerId === playerId ? "#6c63ff" : "#fff", fontWeight: p.playerId === playerId ? 700 : 400, fontSize: 13 }}>
                {p.name} {p.playerId === playerId && "(You)"}
              </span>
              {room?.battleType === "survival" && (
                <span style={{ fontSize: 12, marginRight: 8 }}>
                  {"❤️".repeat(p.lives || 0)}
                </span>
              )}
              <span style={{ fontWeight: 800, color: "#fff" }}>{p.score}</span>
            </div>
          ))}
        </div>
      )}

      {/* ELIMINATED BANNER */}
      {eliminated && (
        <div style={s.eliminatedBanner}>
          💀 You've been eliminated! Watch the battle continue...
        </div>
      )}

      {/* MAIN QUESTION */}
      <div style={s.main}>
        <div style={s.qCard}>
          {(question.difficulty || question.year) && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {question.year && <span style={s.metaTag}>{question.year}</span>}
              {question.difficulty && <span style={{ ...s.metaTag, color: diffColor(question.difficulty) }}>{question.difficulty}</span>}
            </div>
          )}

          <p style={s.qText}>{question.question}</p>

          <div style={s.options}>
            {["A","B","C","D"].map(opt => (
              <div key={opt}
                style={optionStyle(opt)}
                onClick={() => submitAnswer(opt)}>
                <span style={{ ...s.optLabel, background: selected === opt || (revealed && opt === correct) ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.05)" }}>
                  {opt}
                </span>
                <span style={{ flex: 1, fontSize: 15 }}>{question[`option_${opt.toLowerCase()}`]}</span>
                {revealed && opt === correct && <span style={{ marginLeft: 8 }}>✓</span>}
                {revealed && opt === selected && opt !== correct && <span style={{ marginLeft: 8 }}>✗</span>}
              </div>
            ))}
          </div>

          {/* RESULT FEEDBACK */}
          {myResult && (
            <div style={{ ...s.resultBox, background: myResult.isCorrect ? "#00b89422" : "#e1705522", borderColor: myResult.isCorrect ? "#00b894" : "#e17055" }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: myResult.isCorrect ? "#00b894" : "#e17055" }}>
                {myResult.isCorrect ? `✓ Correct! +${myResult.points} points` : "✗ Wrong!"}
              </span>
              {myResult.points > 0 && !myResult.isCorrect && <span style={{ color: "#636e72", fontSize: 13 }}> No points</span>}
            </div>
          )}

          {/* ANSWERED — waiting */}
          {answered && !revealed && !myResult && (
            <div style={s.waitingBox}>
              Waiting for other players...
            </div>
          )}
        </div>

        {/* QUICK REACTIONS */}
        <div style={s.reactRow}>
          {["🔥","💪","😂","😱","💯","⚡"].map(e => (
            <button key={e} style={s.reactionBtn} onClick={() => sendReaction(e)}>{e}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const diffColor = d => ({ easy: "#00b894", medium: "#fdcb6e", hard: "#e17055" })[d] || "#a29bfe";

const s = {
  page:            { minHeight: "100vh", background: "#0B1020", fontFamily: "'Plus Jakarta Sans', sans-serif" },
  reactionsFloat:  { position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", gap: 8, zIndex: 200, pointerEvents: "none" },
  reactionFloat:   { display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(0,0,0,0.5)", borderRadius: 10, padding: "4px 8px", animation: "fadeIn 0.3s" },
  topBar:          { background: "rgba(255,255,255,.04)", padding: "10px 12px", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,.08)" },
  qBadge:          { background: "#6c63ff", color: "#fff", padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 },
  subjectBadge:    { background: "#2d2d44", color: "#a29bfe", padding: "3px 8px", borderRadius: 6, fontSize: 11 },
  livesRow:        { display: "flex", gap: 2 },
  timer:           { border: "2px solid", borderRadius: 8, padding: "3px 10px", fontWeight: 800, fontSize: 16, minWidth: 60, textAlign: "center" },
  myScore:         { display: "flex", flexDirection: "column", alignItems: "center", background: "#2d2d44", borderRadius: 8, padding: "4px 12px" },
  scoreToggle:     { marginLeft: "auto", background: "#2d2d44", border: "none", color: "#fff", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 13 },
  progressBg:      { height: 3, background: "#2d2d44" },
  progressFill:    { height: "100%", background: "#6c63ff" },
  timeBg:          { height: 4, background: "#2d2d44" },
  timeFill:        { height: "100%", borderRadius: 2 },
  scoreOverlay:    { background: "rgba(11,16,32,.97)", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,.1)", padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6, maxHeight: "55vw", overflowY: "auto" },
  scoreRow:        { display: "flex", alignItems: "center", gap: 8 },
  eliminatedBanner:{ background: "#e1705533", border: "1px solid #e17055", color: "#e17055", textAlign: "center", padding: "8px", fontSize: 14, fontWeight: 700 },
  main:            { maxWidth: 520, margin: "0 auto", padding: "16px 14px" },
  qCard:           { background: "rgba(255,255,255,.05)", borderRadius: 16, padding: "20px 16px", border: "1px solid rgba(255,255,255,.09)", marginBottom: 14 },
  metaTag:         { fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "#2d2d44" },
  qText:           { fontSize: 17, lineHeight: 1.7, color: "#fff", marginBottom: 20, marginTop: 10 },
  options:         { display: "flex", flexDirection: "column", gap: 10 },
  option:          { display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", border: "2px solid", borderRadius: 12, cursor: "pointer", transition: "all 0.15s" },
  optLabel:        { width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0, color: "#fff" },
  resultBox:       { marginTop: 14, border: "2px solid", borderRadius: 10, padding: "10px 14px", textAlign: "center" },
  waitingBox:      { marginTop: 14, background: "#2d2d44", borderRadius: 10, padding: "10px 14px", textAlign: "center", color: "#a29bfe", fontSize: 14 },
  reactRow:        { display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" },
  reactionBtn:     { fontSize: 24, background: "#1a1a2e", border: "1px solid #2d2d44", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
};