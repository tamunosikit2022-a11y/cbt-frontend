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

  // FIX: Spirit skill system — was completely unwired on the frontend.
  // Backend broadcast spirit:effect events into the void; nothing consumed them.
  const [skillUsed,       setSkillUsed]       = useState(false);
  const [skillActivating, setSkillActivating] = useState(false);
  const [skillToast,      setSkillToast]      = useState(null);   // { message, emoji }
  const [opponentBlurred, setOpponentBlurred] = useState(false);  // void_weaver: WEB TRAP on me
  const [revealedWrong,   setRevealedWrong]   = useState(null);   // oracle_owl: FORESIGHT
  const [xpBoostActive,   setXpBoostActive]   = useState(false);  // ember_wyrm: INFERNO BOOST
  const [weakHighlight,   setWeakHighlight]   = useState(null);   // neuro_bot: TARGET ANALYSIS
  const [extraTime,       setExtraTime]       = useState(0);      // storm_fox: THUNDER DASH
  const [reviveAvailable, setReviveAvailable] = useState(false);  // crystal_phoenix: REBIRTH FLAME
  const [skipAvailable,   setSkipAvailable]   = useState(false);  // shadow_lynx: SHADOW STEP
  const [debuffsCleared,  setDebuffsCleared]  = useState(false);  // aqua_serpent: HYDRO SURGE
  const skillToastTimer = useRef(null);

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
      // FIX: storm_fox THUNDER DASH adds +5s to the NEXT question's timer
      setTimeLimit(data.timeLimit + extraTime);
      setTimeLeft(data.timeLimit + extraTime);
      if (extraTime > 0) setExtraTime(0); // consume the bonus once
      setScores(data.scores || []);
      setSelected(null);
      setRevealed(false);
      setCorrect(null);
      setMyResult(null);
      setAnswered(false);
      setOpponentBlurred(false);
      setRevealedWrong(null);
      setWeakHighlight(null);
      submitLock.current = false; // Reset lock for new question
      qStartTime.current = Date.now();
    });

    // ── NEW: Spirit skill effect listeners ──────────────────
    // Backend (spiritSkillsHandler.js) emits these but nothing consumed them before.
    sock.off("spirit:webTrap").on("spirit:webTrap", ({ duration }) => {
      setOpponentBlurred(true);
      showSkillToast("🕷️ Your controls are disrupted by an opponent's Web Trap!");
      setTimeout(() => setOpponentBlurred(false), duration || 3000);
    });

    sock.off("spirit:foresight").on("spirit:foresight", () => {
      const wrongOpts = ["A", "B", "C", "D"].filter(o => o !== question?.correct_answer);
      if (wrongOpts.length) {
        setRevealedWrong(wrongOpts[Math.floor(Math.random() * wrongOpts.length)]);
      }
      showSkillToast("🦉 Foresight revealed a wrong answer!");
    });

    sock.off("spirit:infernoBoost").on("spirit:infernoBoost", ({ duration }) => {
      setXpBoostActive(true);
      showSkillToast("🐉 Inferno Boost active — 2× XP and coins this match!");
      setTimeout(() => setXpBoostActive(false), duration || 180000);
    });

    sock.off("spirit:targetAnalysis").on("spirit:targetAnalysis", () => {
      setWeakHighlight(true);
      showSkillToast("🤖 Target Analysis: your weakest answer pattern is highlighted!");
    });

    sock.off("spirit:thunderDash").on("spirit:thunderDash", () => {
      setExtraTime(5);
      showSkillToast("🦊 Thunder Dash! +5 seconds on your next question!");
    });

    sock.off("spirit:rebirthFlame").on("spirit:rebirthFlame", () => {
      setReviveAvailable(true);
      showSkillToast("🦅 Rebirth Flame ready — you'll revive once if eliminated!");
    });

    sock.off("spirit:shadowStep").on("spirit:shadowStep", () => {
      setSkipAvailable(true);
      showSkillToast("🐱 Shadow Step ready — skip a question without losing your streak!");
    });

    sock.off("spirit:hydroSurge").on("spirit:hydroSurge", () => {
      setDebuffsCleared(true);
      setOpponentBlurred(false);
      showSkillToast("🐍 Hydro Surge! All debuffs cleared!");
      setTimeout(() => setDebuffsCleared(false), 1500);
    });

    sock.on("answer_result", (data) => {
      setMyResult(data);
      // FIX: crystal_phoenix REBIRTH FLAME — consume the revive instead of staying eliminated
      if (data.eliminated && reviveAvailable) {
        setMyLives(1);
        setEliminated(false);
        setReviveAvailable(false);
        showSkillToast("🦅 Rebirth Flame triggered — you're back in the match!");
        socket.current?.emit("spirit:reviveUsed", { playerId, roomCode: room?.code });
      } else {
        setMyLives(data.lives ?? 3);
        setEliminated(data.eliminated || false);
      }
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

  // ── NEW: Spirit skill activation ──────────────────────────
  const showSkillToast = (message) => {
    clearTimeout(skillToastTimer.current);
    setSkillToast(message);
    skillToastTimer.current = setTimeout(() => setSkillToast(null), 3500);
  };

  const activateSkill = useCallback(() => {
    if (skillUsed || skillActivating || eliminated) return;
    setSkillActivating(true);
    socket.current?.emit("spirit:activate", { playerId, roomCode: room?.code }, (res) => {
      setSkillActivating(false);
      if (res?.success) {
        setSkillUsed(true);
        showSkillToast(res.message || "Spirit skill activated!");
      } else {
        showSkillToast(res?.error || "Could not activate skill.");
      }
    });
  }, [skillUsed, skillActivating, eliminated, playerId, room]);

  // FIX: shadow_lynx SHADOW STEP — actually skip the current question
  const skipQuestion = useCallback(() => {
    if (!skipAvailable || answered || revealed) return;
    setSkipAvailable(false);
    setAnswered(true);
    submitLock.current = true;
    socket.current?.emit("submit_answer", { answer: "SKIP", timeSpent: 0, skipped: true });
    showSkillToast("🐱 Question skipped — your streak is safe!");
  }, [skipAvailable, answered, revealed]);

  const timerPct   = totalQ > 0 ? ((qIndex + 1) / totalQ) * 100 : 0;
  const timerColor = timeLeft <= 5 ? "#e17055" : timeLeft <= 10 ? "#fdcb6e" : "#00b894";
  const myScore    = scores.find(s => s.playerId === playerId);

  const optionStyle = (opt) => {
    let bg     = "var(--surface)";
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
    <div style={{ minHeight: "100vh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "sans-serif" }}>
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

      {/* NEW: Spirit skill toast — was previously broadcast and silently dropped */}
      {skillToast && (
        <div style={{
          position: "fixed", top: 70, left: "50%", transform: "translateX(-50%)",
          background: "rgba(108,99,255,0.95)", color: "#fff", fontWeight: 700, fontSize: 13,
          padding: "10px 18px", borderRadius: 30, zIndex: 200, boxShadow: "0 8px 24px rgba(108,99,255,0.4)",
          maxWidth: "88vw", textAlign: "center", animation: "fadeInDown .3s ease",
        }}>
          {skillToast}
        </div>
      )}

      {/* NEW: XP boost badge (ember_wyrm INFERNO BOOST) */}
      {xpBoostActive && (
        <div style={{
          position: "fixed", top: 14, right: 14, zIndex: 60,
          background: "linear-gradient(135deg,#ff7849,#fdcb6e)", color: "#1a1a2e",
          fontWeight: 900, fontSize: 11, padding: "5px 11px", borderRadius: 20,
          boxShadow: "0 4px 14px rgba(255,120,73,0.5)",
        }}>
          🐉 2× XP
        </div>
      )}

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

        {/* NEW: Spirit skill activation button — wires up the previously dead backend system */}
        {!eliminated && (
          <button
            onClick={activateSkill}
            disabled={skillUsed || skillActivating}
            style={{
              ...s.scoreToggle,
              background: skillUsed ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#6c63ff,#a29bfe)",
              color: skillUsed ? "#5a5a7a" : "#fff",
              cursor: skillUsed ? "not-allowed" : "pointer",
              fontWeight: 800,
            }}
          >
            {skillUsed ? "✓ Used" : skillActivating ? "…" : "👻 Spirit"}
          </button>
        )}
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
        <div style={{
          ...s.qCard,
          // FIX: void_weaver WEB TRAP — actually blurs/disrupts controls when targeted, was a no-op before
          filter: opponentBlurred ? "blur(2.5px)" : "none",
          pointerEvents: opponentBlurred ? "none" : "auto",
          transition: "filter .2s ease",
        }}>
          {opponentBlurred && (
            <div style={{ textAlign: "center", color: "#ff6b6b", fontWeight: 800, fontSize: 12, marginBottom: 8 }}>
              🕷️ Web Trap active — controls disrupted!
            </div>
          )}
          {(question.difficulty || question.year) && (
            <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
              {question.year && <span style={s.metaTag}>{question.year}</span>}
              {question.difficulty && <span style={{ ...s.metaTag, color: diffColor(question.difficulty) }}>{question.difficulty}</span>}
            </div>
          )}

          <p style={s.qText}>{question.question}</p>

          <div style={s.options}>
            {["A","B","C","D"].map(opt => {
              // FIX: oracle_owl FORESIGHT — actually disables one wrong option, was a no-op before
              const isForesightDisabled = revealedWrong === opt && !revealed;
              return (
                <div key={opt}
                  style={{
                    ...optionStyle(opt),
                    opacity: isForesightDisabled ? 0.35 : 1,
                    textDecoration: isForesightDisabled ? "line-through" : "none",
                    // FIX: neuro_bot TARGET ANALYSIS — subtle highlight ring, was a no-op before
                    boxShadow: weakHighlight && !revealed ? "0 0 0 2px rgba(253,203,110,0.4)" : undefined,
                    cursor: isForesightDisabled ? "not-allowed" : "pointer",
                  }}
                  onClick={() => !isForesightDisabled && submitAnswer(opt)}>
                  <span style={{ ...s.optLabel, background: selected === opt || (revealed && opt === correct) ? "var(--border)" : "var(--surface)" }}>
                    {opt}
                  </span>
                  <span style={{ flex: 1, fontSize: 15 }}>{question[`option_${opt.toLowerCase()}`]}</span>
                  {isForesightDisabled && <span style={{ marginLeft: 8 }}>🦉</span>}
                  {revealed && opt === correct && <span style={{ marginLeft: 8 }}>✓</span>}
                  {revealed && opt === selected && opt !== correct && <span style={{ marginLeft: 8 }}>✗</span>}
                </div>
              );
            })}
          </div>

          {/* NEW: Shadow Step skip button — only shown once the skill grants it */}
          {skipAvailable && !answered && !revealed && (
            <button onClick={skipQuestion} style={{
              marginTop: 10, width: "100%", padding: "10px 0", borderRadius: 12,
              background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.35)",
              color: "#a29bfe", fontWeight: 800, fontSize: 13, cursor: "pointer",
            }}>
              🐱 Skip this question (Shadow Step)
            </button>
          )}

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
  page:            { minHeight: "100vh", background: "var(--bg)", fontFamily: "'Plus Jakarta Sans', sans-serif" },
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
  reactionBtn:     { fontSize: 24, background: "var(--surface)", border: "1px solid #2d2d44", borderRadius: 8, padding: "8px 12px", cursor: "pointer" },
};