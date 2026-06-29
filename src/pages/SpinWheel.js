import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";
import { playWin, playTick } from "../utils/sounds";

// FIX BUG 15: SEGMENTS must exactly match backend REWARDS array order and count
// Backend order: +50 Coins, +100 Coins, +200 Coins, +20 Coins, +5 Tokens, +15 Tokens, +50 Tokens, +100 XP, +250 XP, 2× XP Boost, 2× Coins
const SEGMENTS = [
  { label:"+50 Coins",    color:"#FFC857", dark:"#CC9A00", icon:"🪙" },
  { label:"+100 Coins",   color:"#FFC857", dark:"#CC9A00", icon:"🪙" },
  { label:"+200 Coins",   color:"#FFC857", dark:"#CC9A00", icon:"🪙" },
  { label:"+20 Coins",    color:"#FFC857", dark:"#CC9A00", icon:"🪙" },
  { label:"+5 Tokens",    color:"#00D4FF", dark:"#0099BB", icon:"🎫" },
  { label:"+15 Tokens",   color:"#00D4FF", dark:"#0099BB", icon:"🎫" },
  { label:"+50 Tokens",   color:"#00D4FF", dark:"#0099BB", icon:"🎫" },
  { label:"+100 XP",      color:"var(--primary)", dark:"#5535DD", icon:"⚡" },
  { label:"+250 XP",      color:"var(--primary)", dark:"#5535DD", icon:"⚡" },
  { label:"2× XP Boost",  color:"#00D084", dark:"#008855", icon:"🚀" },
  { label:"2× Coins",     color:"#00D084", dark:"#008855", icon:"🚀" },
];

const NUM_SEGS   = SEGMENTS.length;
const SEG_ANGLE  = 360 / NUM_SEGS;

function drawWheel(canvas, rotation) {
  const ctx  = canvas.getContext("2d");
  if (!ctx) return;
  const W    = canvas.width;
  const H    = canvas.height;
  const cx   = W / 2;
  const cy   = H / 2;
  const R    = Math.min(cx, cy) - 8;
  ctx.clearRect(0, 0, W, H);

  SEGMENTS.forEach((seg, i) => {
    const startAngle = ((i * SEG_ANGLE + rotation) * Math.PI) / 180;
    const endAngle   = (((i + 1) * SEG_ANGLE + rotation) * Math.PI) / 180;

    // Segment fill
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();

    // Segment border
    ctx.strokeStyle = "var(--bg)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    const mid   = (startAngle + endAngle) / 2;
    const textR = R * 0.68;
    const tx    = cx + textR * Math.cos(mid);
    const ty    = cy + textR * Math.sin(mid);

    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(mid + Math.PI / 2);
    ctx.fillStyle = "var(--bg)";
    ctx.font      = `bold ${W < 280 ? 9 : 11}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Icon
    ctx.font = `${W < 280 ? 14 : 16}px serif`;
    ctx.fillText(seg.icon, 0, -10);

    // Label
    ctx.fillStyle = "var(--bg)";
    ctx.font = `bold ${W < 280 ? 8 : 9}px sans-serif`;
    ctx.fillText(seg.label, 0, 6);
    ctx.restore();
  });

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = "var(--bg)";
  ctx.fill();
  ctx.strokeStyle = "var(--primary)";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Outer ring
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = "var(--primary)";
  ctx.lineWidth = 4;
  ctx.stroke();
}

export default function SpinWheel() {
  const nav            = useNavigate();
  const back           = useBackNav();
  const { student }    = useAuth();
  const isPremium      = student?.is_premium;
  const canvasRef      = useRef(null);
  const animRef        = useRef(null);
  const rotRef         = useRef(0);
  const [spinning,     setSpinning]       = useState(false);
  const [canSpin,      setCanSpin]        = useState(false);
  const [msUntil,      setMsUntil]        = useState(0);
  const [spinsLeft,    setSpinsLeft]      = useState(0);
  const [spin2CostsToken, setSpin2CostsToken] = useState(false);
  const [coins,        setCoins]          = useState(0);
  const [tokens,       setTokens]     = useState(0);
  const [result,       setResult]     = useState(null);
  const [showResult,   setShowResult] = useState(false);
  const [loading,      setLoading]    = useState(true);
  const [history,      setHistory]    = useState([]);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (c) drawWheel(c, rotRef.current);
  }, []);

  // Canvas setup — separate from API call
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width  = Math.min(320, window.innerWidth - 80);
    c.height = c.width;
    drawWheel(c, 0);
  }, [loading]); // re-run after loading=false so canvas is mounted

  // Load spin status — always runs regardless of canvas
  useEffect(() => {
    const timeout = setTimeout(() => setLoading(false), 10000);

    API.get("/spin/status").then(r => {
      setCanSpin(r.data.canSpin);
      setMsUntil(r.data.msUntil || 0);
      setCoins(r.data.coins || 0);
      setTokens(r.data.gems   || 0);
      setSpinsLeft(r.data.spinsLeft ?? 1);
      setSpin2CostsToken(r.data.spin2CostsToken || false);
    }).catch(() => {}).finally(() => {
      clearTimeout(timeout);
      setLoading(false);
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (canSpin || msUntil <= 0) return;
    const t = setInterval(() => {
      setMsUntil(prev => {
        if (prev <= 1000) { setCanSpin(true); clearInterval(t); return 0; }
        return prev - 1000;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [canSpin, msUntil]);

  const formatCountdown = (ms) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2,"0")}:${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
  };

  const handleSpin = async () => {
    if (!canSpin || spinning) return;
    setSpinning(true);
    setShowResult(false);

    try {
      const r = await API.post("/spin/spin");
      const reward     = r.data.reward;
      // FIX BUG 15: Match by label so index mismatch between backend/frontend never causes wrong segment
      const rewardIdx  = SEGMENTS.findIndex(s => s.label === (reward.rewardLabel || reward.label));
      const safeIdx    = rewardIdx >= 0 ? rewardIdx : (reward.rewardIndex ?? 0);

      // Calculate target rotation: land on reward segment
      const targetSegAngle = safeIdx * SEG_ANGLE + SEG_ANGLE / 2;
      // Pointer is at top (270deg), we want targetSegAngle at 270
      const targetRot = 270 - targetSegAngle;
      const fullSpins = 6 * 360;
      const current   = rotRef.current % 360;
      let   delta     = (targetRot - current + 360) % 360;
      if (delta < 30) delta += 360;
      const finalRot  = rotRef.current + fullSpins + delta;

      // Animate
      const duration  = 5000;
      const start     = performance.now();
      const startRot  = rotRef.current;
      let   lastTick  = 0;

      function easeOut(t) {
        return 1 - Math.pow(1 - t, 4);
      }

      function frame(now) {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        rotRef.current = startRot + (finalRot - startRot) * easeOut(t);
        drawWheel(canvasRef.current, rotRef.current);

        // Tick sound — frequency decreases as wheel slows
        const speed = Math.abs((finalRot - startRot) * (1 - easeOut(Math.min(t + 0.01, 1))) / duration);
        const tickInterval = Math.max(50, 400 * t); // ticks slow down
        if (now - lastTick > tickInterval) {
          playTick();
          lastTick = now;
        }

        if (t < 1) {
          animRef.current = requestAnimationFrame(frame);
        } else {
          playWin();
          setSpinning(false);
          setCoins(r.data.coins || 0);
          setTokens(r.data.gems   || 0);
          setResult(reward);
          setShowResult(true);
          setSpinsLeft(prev => {
            const next = Math.max(0, prev - 1);
            if (next === 0) {
              setCanSpin(false);
              setMsUntil(24 * 60 * 60 * 1000);
            }
            return next;
          });
        }
      }
      animRef.current = requestAnimationFrame(frame);
    } catch (err) {
      setSpinning(false);
      alert(err?.response?.data?.error || "Spin failed");
    }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ color:"var(--text-muted)", fontSize:14, fontFamily:"sans-serif" }}>Loading spin wheel...</div>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => back()}>←</button>
        <div style={{ flex:1 }}>
          <div style={s.headerTitle}>🎰 Scholar Spin</div>
          <div style={s.headerSub}>
            {isPremium ? "👑 2 free spins every 24 hours" : "1 free spin every 24 hours"}
          </div>
        </div>
        <div style={s.balRow}>
          <div style={s.bal}><span>🪙</span> {coins.toLocaleString()}</div>
          <div style={{ ...s.bal, background:"rgba(0,212,255,0.15)", border:"1px solid rgba(0,212,255,0.3)", color:"#00D4FF" }}>
            <span>🎫</span> {tokens}
          </div>
        </div>
      </div>

      <div style={s.body}>

        {/* Pointer */}
        <div style={s.pointerWrap}>
          <div style={s.pointer} />
        </div>

        {/* Wheel */}
        <div style={s.wheelWrap}>
          <canvas ref={canvasRef} style={s.canvas} />
        </div>

        {/* Spin button */}
        <button
          style={{ ...s.spinBtn, ...((!canSpin || spinning) ? s.spinBtnDisabled : {}) }}
          onClick={handleSpin}
          disabled={!canSpin || spinning}>
          {spinning ? "Spinning..." : canSpin
            ? spin2CostsToken
              ? `🪙 Spin (1 token)`
              : `🎰 SPIN NOW! ${spinsLeft > 1 ? `(${spinsLeft} left)` : ""}`
            : `⏰ ${formatCountdown(msUntil)}`}
        </button>

        {/* Premium spin nudge for free users */}
        {!isPremium && (
          <div
            onClick={() => nav("/subscribe")}
            style={{ display:"flex", alignItems:"center", gap:10, background:"rgba(108,99,255,0.12)", border:"1px solid rgba(108,99,255,0.3)", borderRadius:12, padding:"10px 14px", marginBottom:16, cursor:"pointer", maxWidth:320, width:"100%" }}>
            <span style={{ fontSize:20 }}>👑</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:800, color:"#a29bfe" }}>Premium gets 2 spins daily</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>Upgrade from ₦100 →</div>
            </div>
          </div>
        )}

        {/* Result popup */}
        {showResult && result && (
          <div style={s.resultCard}>
            <div style={{ fontSize:48, marginBottom:8 }}>🎉</div>
            <div style={{ fontWeight:900, fontSize:22, color:"#fff", marginBottom:6 }}>You won!</div>
            <div style={{ fontSize:28, fontWeight:900, color: result.type==="gems" ? "#00D4FF" : result.type==="xp" ? "var(--primary)" : result.type==="boost" ? "#00D084" : "#FFC857", marginBottom:14, textShadow:`0 0 20px currentColor` }}>
              {result.label}
            </div>
            <div style={{ fontSize:13, color:"var(--text-muted)", marginBottom:16 }}>Added to your account!</div>
            <div style={s.balRow}>
              <div style={s.bal}><span>🪙</span> {coins.toLocaleString()}</div>
              <div style={{ ...s.bal, background:"rgba(0,212,255,0.15)", border:"1px solid rgba(0,212,255,0.3)", color:"#00D4FF" }}>
                <span>🎫</span> {tokens}
              </div>
            </div>
            <button style={s.doneBtn} onClick={() => setShowResult(false)}>Continue</button>
          </div>
        )}

        {/* Rewards table */}
        <div style={s.rewardsCard}>
          <div style={s.rewardsTitle}>Possible Rewards</div>
          <div style={s.rewardsGrid}>
            {SEGMENTS.map((seg, i) => (
              <div key={i} style={s.rewardItem}>
                <div style={{ fontSize:18 }}>{seg.icon}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:2 }}>{seg.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height:40 }} />
      </div>
    </div>
  );
}

const s = {
  page:          { minHeight:"100vh", background:"var(--bg)", fontFamily:"'Plus Jakarta Sans',sans-serif", maxWidth:480, margin:"0 auto", padding:"0 0 env(safe-area-inset-bottom, 0px)" },
  header:        { background:"rgba(124,92,255,0.15)", borderBottom:"1px solid rgba(124,92,255,0.2)", padding:"14px 16px", display:"flex", alignItems:"center", gap:12 },
  back:          { background:"var(--surface)", border:"none", color:"#fff", borderRadius:10, width:36, height:36, fontSize:18, cursor:"pointer", flexShrink:0 },
  headerTitle:   { fontWeight:900, fontSize:18, color:"#fff" },
  headerSub:     { fontSize:11, color:"var(--text-muted)", marginTop:2 },
  balRow:        { display:"flex", gap:8, flexShrink:0 },
  bal:           { display:"flex", alignItems:"center", gap:5, background:"rgba(255,200,87,0.15)", border:"1px solid rgba(255,200,87,0.3)", borderRadius:10, padding:"5px 10px", fontSize:13, fontWeight:800, color:"#FFC857" },
  body:          { padding:"0 16px 20px", display:"flex", flexDirection:"column", alignItems:"center" },
  pointerWrap:   { display:"flex", justifyContent:"center", marginBottom:-6, zIndex:2, position:"relative" },
  pointer:       { width:0, height:0, borderLeft:"12px solid transparent", borderRight:"12px solid transparent", borderTop:"24px solid #7C5CFF", filter:"drop-shadow(0 0 8px #7C5CFF)" },
  wheelWrap:     { borderRadius:"50%", padding:6, background:"linear-gradient(135deg,#7C5CFF,#00D4FF)", boxShadow:"0 0 40px rgba(124,92,255,0.5)", marginBottom:20 },
  canvas:        { display:"block", borderRadius:"50%" },
  spinBtn:       { width:"100%", maxWidth:320, padding:"16px 0", fontSize:18, fontWeight:900, color:"var(--bg)", background:"linear-gradient(135deg,#FFC857,#FFB300)", border:"none", borderRadius:16, cursor:"pointer", boxShadow:"0 4px 24px rgba(255,200,87,0.5)", marginBottom:20, letterSpacing:1 },
  spinBtnDisabled:{ background:"var(--surface)", color:"var(--text-muted)", boxShadow:"none", cursor:"not-allowed" },
  resultCard:    { background:"rgba(124,92,255,0.15)", border:"1px solid rgba(124,92,255,0.4)", borderRadius:20, padding:"28px 24px", textAlign:"center", marginBottom:20, width:"100%", maxWidth:320 },
  doneBtn:       { marginTop:16, padding:"12px 32px", background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)", color:"#fff", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer" },
  rewardsCard:   { background:"var(--surface)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:16, padding:"16px", width:"100%", maxWidth:320 },
  rewardsTitle:  { fontSize:12, fontWeight:700, color:"var(--text-muted)", letterSpacing:1.2, textTransform:"uppercase", marginBottom:12 },
  rewardsGrid:   { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8 },
  rewardItem:    { textAlign:"center", background:"var(--surface)", borderRadius:10, padding:"8px 4px" },
};
