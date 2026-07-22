/**
 * Onboarding.js
 * ──────────────────────────────────────────────────────────────
 * Mandatory 3-screen onboarding shown once after first registration.
 * Stores completion in localStorage under "ss_onboarded".
 * Screen 2 captures exam preference (JAMB / Post-UTME).
 *
 * Innovation source: my_app_innovation.docx + UI Audit Fix 10
 * Created: June 2026
 */
import { useState } from "react";

const STORAGE_KEY = "ss_onboarded";

const CSS = `
  @keyframes ob-slide-in { from{opacity:0;transform:translateX(40px)} to{opacity:1;transform:translateX(0)} }
  @keyframes ob-slide-out{ from{opacity:1;transform:translateX(0)} to{opacity:0;transform:translateX(-40px)} }
  @keyframes ob-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
  @keyframes ob-glow  { 0%,100%{box-shadow:0 0 20px rgba(124,92,255,.3)} 50%{box-shadow:0 0 50px rgba(124,92,255,.7)} }
  @keyframes ob-pulse { 0%,100%{opacity:.4;transform:scale(.9)} 50%{opacity:1;transform:scale(1.05)} }
  .ob-overlay {
    position:fixed; inset:0; z-index:9999;
    background:radial-gradient(ellipse at 50% 30%, #1a1040 0%, #0A0F1E 70%);
    display:flex; align-items:center; justify-content:center;
    font-family:'Plus Jakarta Sans',sans-serif; overflow:hidden;
  }
  .ob-card {
    max-width:420px; width:92%; text-align:center;
    animation:ob-slide-in .45s ease forwards;
    padding:0 16px;
  }
  .ob-icon {
    width:100px; height:100px; border-radius:28px; margin:0 auto 24px;
    display:flex; align-items:center; justify-content:center;
    font-size:48px; animation:ob-float 3s ease-in-out infinite;
  }
  .ob-title { color:#F1F5F9; font-size:26px; font-weight:900; margin:0 0 12px; line-height:1.2; }
  .ob-sub   { color:#A8B8D8; font-size:15px; line-height:1.7; margin:0 0 36px; }
  .ob-btn-primary {
    width:100%; padding:17px; border:none; border-radius:16px;
    background:linear-gradient(135deg,#7C5CFF,#5B8CFF);
    color:#fff; font-weight:800; font-size:17px; cursor:pointer;
    box-shadow:0 6px 28px rgba(124,92,255,.45);
    transition:transform .15s ease, box-shadow .2s ease; margin-bottom:14px;
  }
  .ob-btn-primary:hover  { transform:translateY(-2px); box-shadow:0 10px 36px rgba(124,92,255,.6); }
  .ob-btn-primary:active { transform:scale(.97); }
  .ob-exam-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:24px; }
  .ob-exam-card {
    padding:22px 12px; border-radius:18px; cursor:pointer;
    border:2px solid rgba(255,255,255,.08); background:rgba(255,255,255,.04);
    transition:all .2s ease;
  }
  .ob-exam-card:hover { transform:translateY(-3px); }
  .ob-exam-card.selected {
    border-color:rgba(124,92,255,.8);
    background:rgba(124,92,255,.12);
    box-shadow:0 0 24px rgba(124,92,255,.3);
  }
  .ob-exam-icon { font-size:36px; margin-bottom:10px; }
  .ob-exam-name { color:#F1F5F9; font-weight:800; font-size:15px; margin:0 0 4px; }
  .ob-exam-desc { color:#A8B8D8; font-size:12px; }
  .ob-dots { display:flex; justify-content:center; gap:8px; margin-bottom:28px; }
  .ob-dot { width:8px; height:8px; border-radius:50%; transition:all .3s ease; }
  .ob-dot.active { width:24px; border-radius:4px; background:#7C5CFF; }
  .ob-dot.done   { background:#00D084; }
  .ob-dot.pending{ background:rgba(255,255,255,.15); }
  .ob-step-label { color:#7B8AB8; font-size:12px; margin-bottom:20px; font-weight:600; letter-spacing:.5px; }
`;

const SCREENS = [
  {
    icon: "🌌",
    iconBg: "linear-gradient(135deg,#7C5CFF,#5B8CFF)",
    title: "Welcome to Scholars Syndicate",
    body: "Nigeria's first Academic Metaverse. Study smarter, battle other students in real-time, earn rewards, and grow into your ultimate scholar identity.",
    cta: "Let's Go →",
  },
  {
    icon: null, // rendered as exam picker
    title: "Pick Your Exam",
    body: "Which exam are you preparing for? This helps us personalise your questions and study plan.",
    cta: "Continue →",
  },
  {
    icon: "⚡",
    iconBg: "linear-gradient(135deg,#FFC857,#FF9500)",
    title: "Your First Challenge Awaits",
    body: "Complete today's Daily Challenge to earn XP, unlock your first badge, and kick-start your streak. It only takes 5 minutes.",
    cta: "Start Challenge 🎯",
  },
];

export default function Onboarding({ onComplete }) {
  const [step, setStep]   = useState(0);
  const [exam, setExam]   = useState(null);
  const [busy, setBusy]   = useState(false);

  const screen = SCREENS[step];
  const isExamStep = step === 1;
  const canAdvance = isExamStep ? !!exam : true;

  const advance = () => {
    if (step < SCREENS.length - 1) {
      setStep(s => s + 1);
    } else {
      setBusy(true);
      // Save onboarding state
      localStorage.setItem(STORAGE_KEY, "true");
      if (exam) localStorage.setItem("ss_exam_pref", exam);
      setTimeout(() => onComplete(exam), 400);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="ob-overlay">
        <div className="ob-card">
          {/* Progress dots */}
          <div className="ob-dots">
            {SCREENS.map((_, i) => (
              <div key={i} className={`ob-dot ${i === step ? "active" : i < step ? "done" : "pending"}`} />
            ))}
          </div>
          <div className="ob-step-label">STEP {step + 1} OF {SCREENS.length}</div>

          {/* Icon */}
          {screen.icon && (
            <div className="ob-icon" style={{ background: screen.iconBg, boxShadow: `0 0 40px rgba(124,92,255,.4)` }}>
              {screen.icon}
            </div>
          )}

          {/* Title & body */}
          <h1 className="ob-title">{screen.title}</h1>
          <p className="ob-sub">{screen.body}</p>

          {/* Exam picker — step 2 only */}
          {isExamStep && (
            <div className="ob-exam-grid">
              {[
                { id:"jamb",     icon:"📝", name:"JAMB / UTME",  desc:"University entrance exam" },
                { id:"post_utme",icon:"🏫", name:"Post-UTME",    desc:"University screening exam" },
              ].map(opt => (
                <div key={opt.id} className={`ob-exam-card ${exam === opt.id ? "selected" : ""}`}
                  onClick={() => setExam(opt.id)}>
                  <div className="ob-exam-icon">{opt.icon}</div>
                  <p className="ob-exam-name">{opt.name}</p>
                  <p className="ob-exam-desc">{opt.desc}</p>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <button className="ob-btn-primary" onClick={advance}
            disabled={!canAdvance || busy}
            style={{ opacity: canAdvance ? 1 : 0.4 }}>
            {busy ? "Loading..." : screen.cta}
          </button>
        </div>
      </div>
    </>
  );
}

/* Utility — call this wherever you check if onboarding should show */
export function needsOnboarding() {
  return localStorage.getItem(STORAGE_KEY) !== "true";
}
