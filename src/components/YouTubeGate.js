/**
 * YouTubeGate.js
 * ──────────────────────────────────────────────────────────────
 * Fullscreen subscription gate — renders before BrowserRouter in App.js.
 * Blocks all access until user confirms YouTube subscription.
 * Flag stored in localStorage under key "scholars_yt_subscribed".
 *
 * FIX: Rebranded from "Elitronix" to "Scholars Syndicate".
 *      Updated CHANNEL_URL, CHANNEL_NAME, and STORAGE_KEY.
 */
import { useState, useEffect } from "react";

const CHANNEL_URL  = "https://www.youtube.com/@ScholarsSyndicate"; // ← your real channel
const CHANNEL_NAME = "Scholars Syndicate";
const STORAGE_KEY  = "scholars_yt_subscribed"; // FIX: was "elitronix_subscribed"

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  @keyframes yt-fade-in  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
  @keyframes yt-glow     { 0%,100%{box-shadow:0 0 30px rgba(124,92,255,.35)} 50%{box-shadow:0 0 60px rgba(124,92,255,.65)} }
  @keyframes yt-float    { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-8px) scale(1.03)} }
  @keyframes yt-particles{ 0%{opacity:1;transform:translateY(0) scale(1)} 100%{opacity:0;transform:translateY(-80px) scale(0)} }
  @keyframes yt-pulse-ring{ 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
  .yt-gate-overlay {
    position:fixed; inset:0; z-index:99999;
    background: radial-gradient(ellipse at 30% 40%, #1a0830 0%, #0A0F1E 60%, #000510 100%);
    display:flex; align-items:center; justify-content:center;
    font-family:'Plus Jakarta Sans',sans-serif;
    overflow:hidden;
  }
  .yt-card {
    position:relative; z-index:2;
    background: rgba(21,25,41,0.92);
    border: 1px solid rgba(124,92,255,0.25);
    border-radius:28px; padding:40px 32px;
    max-width:420px; width:92%;
    text-align:center;
    box-shadow: 0 0 80px rgba(124,92,255,.12), 0 24px 80px rgba(0,0,0,.6);
    animation: yt-fade-in .5s ease forwards;
    backdrop-filter: blur(20px);
  }
  .yt-logo-wrap {
    position:relative; display:inline-block; margin-bottom:24px;
    animation: yt-float 3s ease-in-out infinite;
  }
  .yt-logo {
    width:80px; height:80px; border-radius:20px;
    background:linear-gradient(135deg,#7C5CFF,#5B8CFF);
    display:flex; align-items:center; justify-content:center;
    font-size:40px;
    animation:yt-glow 2s ease-in-out infinite;
  }
  .yt-pulse-ring {
    position:absolute; inset:-8px; border-radius:28px;
    border:2px solid rgba(124,92,255,.4);
    animation:yt-pulse-ring 2s ease-out infinite;
  }
  .yt-title { color:#fff; font-size:22px; font-weight:900; margin:0 0 8px; line-height:1.3; }
  .yt-sub   { color:#A8B8D8; font-size:14px; line-height:1.6; margin:0 0 28px; }
  .yt-btn-main {
    display:block; width:100%; padding:16px;
    background:linear-gradient(135deg,#7C5CFF,#5B8CFF);
    color:#fff; font-weight:800; font-size:16px;
    border:none; border-radius:14px; cursor:pointer;
    margin-bottom:12px; letter-spacing:.3px;
    transition:transform .15s ease, box-shadow .2s ease;
    box-shadow: 0 4px 20px rgba(124,92,255,.4);
  }
  .yt-btn-main:hover  { transform:translateY(-2px); box-shadow:0 8px 30px rgba(124,92,255,.55); }
  .yt-btn-main:active { transform:scale(.97); }
  .yt-btn-confirm {
    display:block; width:100%; padding:14px;
    background:rgba(0,208,132,.12);
    color:#00D084; font-weight:800; font-size:15px;
    border:1px solid rgba(0,208,132,.35); border-radius:14px; cursor:pointer;
    transition:all .2s ease;
  }
  .yt-btn-confirm:hover  { background:rgba(0,208,132,.2); transform:translateY(-1px); }
  .yt-btn-confirm:active { transform:scale(.97); }
  .yt-note { color:#7B8AB8; font-size:12px; margin-top:18px; }
  .yt-stars { color:#FFC857; font-size:18px; letter-spacing:4px; margin-bottom:12px; }
  .yt-particle {
    position:absolute; border-radius:50%; pointer-events:none;
    animation:yt-particles 1.5s ease forwards;
  }
  .yt-bg-glow {
    position:absolute; border-radius:50%; filter:blur(80px); pointer-events:none; opacity:.15;
  }
`;

export default function YouTubeGate({ onConfirmed }) {
  const [confirmed, setConfirmed] = useState(false);
  const [particles, setParticles] = useState([]);

  // Check flag on mount — also accept legacy Elitronix key so existing users aren't re-gated
  useEffect(() => {
    const alreadyDone =
      localStorage.getItem(STORAGE_KEY) === "true" ||
      localStorage.getItem("elitronix_subscribed") === "true"; // backward compat
    if (alreadyDone) {
      localStorage.setItem(STORAGE_KEY, "true"); // normalise to new key
      onConfirmed();
    }
  }, [onConfirmed]);

  const openChannel = () => {
    window.open(CHANNEL_URL, "_blank");
  };

  const handleConfirm = () => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: Date.now() + i,
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 60,
      size: 6 + Math.random() * 8,
      color: ["#7C5CFF","#FFC857","#00D084","#5B8CFF"][Math.floor(Math.random()*4)],
      delay: Math.random() * 0.3,
    }));
    setParticles(newParticles);
    setConfirmed(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, "true");
      onConfirmed();
    }, 900);
  };

  if (confirmed) return null;

  return (
    <>
      <style>{CSS}</style>
      <div className="yt-gate-overlay">
        <div className="yt-bg-glow" style={{ width:400, height:400, background:"#7C5CFF", top:"-10%", left:"-10%" }} />
        <div className="yt-bg-glow" style={{ width:300, height:300, background:"#5B8CFF", bottom:"-5%", right:"-5%" }} />

        {particles.map(p => (
          <div key={p.id} className="yt-particle" style={{
            left:`${p.x}%`, top:`${p.y}%`,
            width:p.size, height:p.size,
            background:p.color,
            animationDelay:`${p.delay}s`,
          }} />
        ))}

        <div className="yt-card">
          <div className="yt-logo-wrap">
            <div className="yt-pulse-ring" />
            <div className="yt-logo">🎓</div>
          </div>

          <div className="yt-stars">★★★★★</div>

          <h1 className="yt-title">Join the {CHANNEL_NAME} Community 🎓</h1>
          <p className="yt-sub">
            Subscribe to our free YouTube channel for JAMB tips, study hacks,
            and weekly question breakdowns — then unlock the full app.
            <strong style={{color:"#FFC857"}}> It's completely free!</strong>
          </p>

          <button className="yt-btn-main" onClick={openChannel}>
            ▶ Subscribe on YouTube — Free
          </button>
          <button className="yt-btn-confirm" onClick={handleConfirm}>
            ✅ I've subscribed — Enter App
          </button>

          <p className="yt-note">
            Already subscribed? Just tap "I've subscribed" above.
          </p>
        </div>
      </div>
    </>
  );
}
