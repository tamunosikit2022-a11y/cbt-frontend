/**
 * OnboardingTour.js
 * 5-step forced onboarding for new users.
 * Step 5 requires subscribing to ELITRONIX on YouTube before entering the app.
 * Stored in localStorage("onboarding_done") — shows only once per device.
 */
import { useState, useEffect } from "react";

const C = {
  bg:     "var(--bg)",
  purple: "var(--primary)",
  blue:   "#5B8CFF",
  gold:   "#FFC857",
  green:  "#00D084",
  red:    "#FF5A5F",
  text:   "#F1F5F9",
  muted:  "var(--text-muted)",
  border: "var(--surface)",
};

const STEPS = [
  {
    id: "welcome",
    emoji: "🎓",
    title: "Welcome to Scholars Syndicate!",
    body: "Nigeria's smartest CBT platform. Practice JAMB & Post-UTME, battle friends in Arena, earn rewards — all completely free.",
    cta: "Let's Go →",
  },
  {
    id: "study",
    emoji: "📚",
    title: "Study Smarter, Not Harder",
    body: "Use Study Mode for instant feedback, Exam Mode for timed simulation, Weakness Mode to attack your worst topics, and Daily Missions to earn XP every single day.",
    cta: "Got it →",
  },
  {
    id: "arena",
    emoji: "🏆",
    title: "Enter Scholars Arena",
    body: "Battle real students live — 1v1 duels, 2v2 duo clashes, squad battles, and 50-player Battle Royales. Climb the leaderboard and earn coins every win.",
    cta: "Sounds Epic →",
  },
  {
    id: "metaverse",
    emoji: "⚡",
    title: "Scholar Metaverse",
    body: "Collect Scholar Spirits as study companions, buy skills & boosts, unlock study materials in the Knowledge Vault, and represent your school in Factions.",
    cta: "I'm In →",
  },
  {
    id: "youtube",
    emoji: "▶",
    title: "Subscribe to ELITRONIX",
    body: "ELITRONIX is the official Scholars Syndicate YouTube channel — Physics, Chemistry & Mathematics explained simply. Subscribe now so you never miss a free lesson that could push your JAMB score from 200 to 320.",
    cta: null,
    isYoutube: true,
  },
];

export default function OnboardingTour({ studentName, onComplete }) {
  const [step,       setStep]       = useState(0);
  const [subscribed, setSubscribed] = useState(false);
  const [shaking,    setShaking]    = useState(false);
  const [exiting,    setExiting]    = useState(false);

  const current   = STEPS[step];
  const isLast    = step === STEPS.length - 1;
  const firstName = (studentName || "Scholar").split(" ")[0];

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "ot-css";
    style.textContent = `
      @keyframes ot-in   { from{opacity:0;transform:translateY(28px) scale(.95)} to{opacity:1;transform:translateY(0) scale(1)} }
      @keyframes ot-out  { from{opacity:1;transform:scale(1)} to{opacity:0;transform:scale(.95)} }
      @keyframes ot-shake{ 0%,100%{transform:translateX(0)} 20%,60%{transform:translateX(-8px)} 40%,80%{transform:translateX(8px)} }
      @keyframes yt-glow { 0%,100%{box-shadow:0 0 20px rgba(255,0,0,.4)} 50%{box-shadow:0 0 44px rgba(255,0,0,.85),0 0 70px rgba(255,0,0,.3)} }
      @keyframes dot-pulse{ 0%,80%,100%{transform:scale(.65);opacity:.4} 40%{transform:scale(1.1);opacity:1} }
    `;
    if (!document.getElementById("ot-css")) document.head.appendChild(style);
    return () => { const s = document.getElementById("ot-css"); if (s) s.remove(); };
  }, []);

  const next = () => {
    if (current.isYoutube && !subscribed) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
      return;
    }
    if (isLast) {
      setExiting(true);
      setTimeout(() => {
        localStorage.setItem("onboarding_done", "1");
        onComplete();
      }, 280);
    } else {
      setExiting(true);
      setTimeout(() => { setStep(s => s + 1); setExiting(false); }, 220);
    }
  };

  const openYoutube = () => {
    window.open("https://www.youtube.com/@elitronix1?sub_confirmation=1", "_blank");
    setTimeout(() => setSubscribed(true), 2500);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.93)", backdropFilter: "blur(14px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 400,
        background: "linear-gradient(160deg,#111827 0%,#0B1020 100%)",
        border: `1px solid rgba(124,92,255,.25)`,
        borderRadius: 28,
        boxShadow: "0 24px 80px rgba(0,0,0,.8), 0 0 0 1px rgba(124,92,255,.15)",
        overflow: "hidden",
        animation: exiting ? "ot-out .22s ease forwards" : "ot-in .35s cubic-bezier(.34,1.56,.64,1)",
      }}>
        {/* Progress bar */}
        <div style={{ height: 3, background: "rgba(255,255,255,.05)" }}>
          <div style={{
            height: "100%",
            width: `${((step + 1) / STEPS.length) * 100}%`,
            background: `linear-gradient(90deg,${C.purple},${C.blue})`,
            borderRadius: 3, transition: "width .4s ease",
            boxShadow: `0 0 12px ${C.purple}`,
          }} />
        </div>

        {/* Icon + heading */}
        <div style={{
          background: `linear-gradient(135deg,${C.purple}22,${C.blue}11)`,
          padding: "28px 26px 22px", textAlign: "center",
        }}>
          {current.isYoutube ? (
            <div style={{
              width: 72, height: 72, borderRadius: "50%", background: "#FF0000",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 34, margin: "0 auto 14px",
              animation: "yt-glow 2s infinite",
              boxShadow: "0 8px 24px rgba(255,0,0,.5)",
            }}>▶</div>
          ) : (
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: `linear-gradient(135deg,${C.purple},${C.blue})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 34, margin: "0 auto 14px",
              boxShadow: `0 8px 24px ${C.purple}66`,
            }}>{current.emoji}</div>
          )}
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: C.text, lineHeight: 1.3, marginBottom: 10 }}>
            {step === 0 ? `Welcome, ${firstName}! 👋` : current.title}
          </h2>
          <p style={{ margin: 0, fontSize: 14, color: C.muted, lineHeight: 1.75, padding: "0 4px" }}>
            {current.body}
          </p>
        </div>

        {/* Action area */}
        <div style={{ padding: "18px 24px 26px" }}>
          {current.isYoutube ? (
            <>
              {/* Channel card */}
              <div style={{
                background: "rgba(255,0,0,.08)", border: "1px solid rgba(255,0,0,.25)",
                borderRadius: 16, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12, marginBottom: 12,
              }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FF0000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>⚡</div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 15, color: C.text }}>ELITRONIX</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>@elitronix1 · Physics, Chemistry & Maths</div>
                </div>
              </div>

              {!subscribed ? (
                <>
                  <button onClick={openYoutube} style={{
                    width: "100%", padding: "14px 0", background: "#FF0000", color: "#fff",
                    border: "none", borderRadius: 14, fontWeight: 900, fontSize: 16, cursor: "pointer",
                    boxShadow: "0 4px 20px rgba(255,0,0,.5)", marginBottom: 8,
                    animation: shaking ? "ot-shake .4s ease" : "yt-glow 2s infinite",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>▶ Subscribe on YouTube — Free!</button>
                  <button onClick={() => setSubscribed(true)} style={{
                    width: "100%", padding: "10px 0", background: "transparent",
                    border: `1px solid ${C.border}`, color: C.muted, borderRadius: 12,
                    fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>✓ I already subscribed</button>
                  {shaking && <p style={{ color: C.gold, fontSize: 12, textAlign: "center", marginTop: 8 }}>
                    ⚠️ Please subscribe first — it only takes 2 seconds!
                  </p>}
                </>
              ) : (
                <>
                  <div style={{
                    background: `${C.green}15`, border: `1px solid ${C.green}44`,
                    borderRadius: 14, padding: "14px 18px",
                    display: "flex", alignItems: "center", gap: 12, marginBottom: 14,
                  }}>
                    <span style={{ fontSize: 24 }}>✅</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: C.green }}>Subscribed! Thank you</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>You'll never miss a free lesson from ELITRONIX</div>
                    </div>
                  </div>
                  <button onClick={next} style={{
                    width: "100%", padding: "14px 0",
                    background: `linear-gradient(135deg,${C.purple},${C.blue})`,
                    color: "#fff", border: "none", borderRadius: 14,
                    fontWeight: 900, fontSize: 16, cursor: "pointer",
                    boxShadow: `0 4px 20px ${C.purple}66`,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}>Enter Scholars Syndicate 🎓</button>
                </>
              )}
            </>
          ) : (
            <button onClick={next} style={{
              width: "100%", padding: "14px 0",
              background: `linear-gradient(135deg,${C.purple},${C.blue})`,
              color: "#fff", border: "none", borderRadius: 14,
              fontWeight: 900, fontSize: 16, cursor: "pointer",
              boxShadow: `0 4px 20px ${C.purple}66`,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>{current.cta}</button>
          )}

          {/* Step dots */}
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                width: i === step ? 20 : 6, height: 6, borderRadius: 3,
                background: i === step ? C.purple : "rgba(255,255,255,.15)",
                transition: "all .3s ease",
                boxShadow: i === step ? `0 0 8px ${C.purple}` : "none",
              }} />
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,.2)", marginTop: 12, marginBottom: 0 }}>
            Step {step + 1} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  );
}
