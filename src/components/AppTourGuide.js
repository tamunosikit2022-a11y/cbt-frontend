/**
 * AppTourGuide.js
 * Floating AI avatar that guides users through the app with voice + text.
 * Triggered by the "?" button on Dashboard or via tourGuide.start() globally.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { speak, stop, speechSupported } from '../utils/voiceUtils';

const ACCENT = '#7C5CFF';
const BG     = '#0B1020';
const CARD   = '#111827';

// ── Full app tour script ────────────────────────────────────
const TOUR_STEPS = [
  {
    id: 'welcome',
    title: '👋 Welcome to Scholars Syndicate!',
    text: "Hi Scholar! I'm ScholarAI, your personal guide. I'll show you everything this app can do. Let's start the tour!",
    highlight: null,
    action: null,
  },
  {
    id: 'dashboard',
    title: '🏠 Dashboard — Your Home Base',
    text: "This is your Dashboard. See your XP, streak, coins, and gems at a glance. Tap the bottom tabs to navigate the whole app. The 🔔 bell shows notifications and the ≡ menu opens more features.",
    highlight: null,
    action: { label: 'Go to Dashboard', path: '/dashboard' },
  },
  {
    id: 'exam',
    title: '📝 Practice Exams',
    text: "Tap 'Take Exam' to start practicing. Choose JAMB mock or subject-specific practice. Pick your subjects, study mode — timed, untimed, or review — and start answering. Your progress saves automatically so you can resume anytime.",
    highlight: null,
    action: { label: 'Try an Exam', path: '/exam-select' },
  },
  {
    id: 'arena',
    title: '⚔️ Scholars Arena — Battle Mode',
    text: "The Arena is where you battle other students with JAMB questions in real time! Choose Lone Wolf for a quick 1-on-1, Duel for ranked matches, Clash Squad for team battles, or Battle Royal for up to 50 players. Win to earn coins and XP!",
    highlight: null,
    action: { label: 'Enter Arena', path: '/arena' },
  },
  {
    id: 'classroom',
    title: '🎓 Classroom Sessions',
    text: "Study with friends in a live classroom! The host creates a room and shares a join code. Everyone gets a shared whiteboard to draw diagrams, live chat, and voice communication. Perfect for group study.",
    highlight: null,
    action: { label: 'Open Classroom', path: '/classroom' },
  },
  {
    id: 'ai_tutor',
    title: '🤖 ScholarAI Tutor',
    text: "That's me! Ask me anything — explain a topic, solve a JAMB question step by step, or generate practice questions. I also understand voice — tap the mic button to speak your question! Free accounts get 20 messages a day. Premium gets 100.",
    highlight: null,
    action: { label: 'Chat with me', path: '/ai-tutor' },
  },
  {
    id: 'missions',
    title: '🎯 Daily Missions',
    text: "Complete missions every day to earn bonus XP, coins, and gems. Missions include things like: complete 3 exams, answer 50 questions, win an arena battle. Check the Missions page daily and claim your rewards!",
    highlight: null,
    action: { label: 'View Missions', path: '/missions' },
  },
  {
    id: 'spin',
    title: '🎰 Daily Spin Wheel',
    text: "Spin the wheel once a day for free rewards — coins, gems, XP, or boost multipliers. Premium scholars get 2 spins per day! A 2× boost doubles your XP or coins earned for 24 hours.",
    highlight: null,
    action: { label: 'Spin Now', path: '/spin' },
  },
  {
    id: 'performance',
    title: '📊 Performance & Analytics',
    text: "Check your Performance page to see which subjects need work, your accuracy per topic, and your improvement over time. The Predicted Score page uses your practice data to estimate your actual JAMB score.",
    highlight: null,
    action: { label: 'See Performance', path: '/performance' },
  },
  {
    id: 'vault',
    title: '📚 Knowledge Vault & Videos',
    text: "The Knowledge Vault has JAMB past question PDFs and study materials organised by subject. The Video Library has educational videos per topic. Great resources for deepening your understanding.",
    highlight: null,
    action: { label: 'Open Vault', path: '/vault' },
  },
  {
    id: 'leaderboard',
    title: '🏆 Leaderboard & Factions',
    text: "See how you rank against all students on the Leaderboard. Join a School Faction to compete as a team against other schools. Earn badges for milestones and collect Spirit companions for passive bonuses.",
    highlight: null,
    action: { label: 'See Leaderboard', path: '/leaderboard' },
  },
  {
    id: 'premium',
    title: '✨ Premium Membership',
    text: "Upgrade to Premium for extra perks: 100 AI messages per day, 2 daily spins, exclusive items in the Gem Store, and more. Go to the Upgrade page to see the plans.",
    highlight: null,
    action: { label: 'See Premium', path: '/upgrade' },
  },
  {
    id: 'done',
    title: '🎉 You\'re All Set, Scholar!',
    text: "That's everything! Remember — consistent daily practice is the key to JAMB success. Start with a practice exam, then check your missions. I'll always be here if you have questions. Good luck! 🚀",
    highlight: null,
    action: null,
  },
];

// ── Floating avatar animation ───────────────────────────────
const AVATAR_CSS = `
  @keyframes tour-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
  @keyframes tour-pulse  { 0%,100%{box-shadow:0 0 0 0 rgba(124,92,255,0.6)} 70%{box-shadow:0 0 0 12px rgba(124,92,255,0)} }
  @keyframes tour-in     { from{opacity:0;transform:translateY(20px) scale(0.95)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes tour-speak  { 0%,100%{transform:scale(1)} 25%{transform:scale(1.08)} 75%{transform:scale(0.96)} }
  @keyframes dot-blink   { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1.1)} }
`;

export default function AppTourGuide({ autoStart = false, onClose }) {
  const nav = useNavigate();
  const [visible,   setVisible]   = useState(autoStart);
  const [step,      setStep]      = useState(0);
  const [speaking,  setSpeaking]  = useState(false);
  const [voiceOn,   setVoiceOn]   = useState(speechSupported());
  const [minimized, setMinimized] = useState(false);
  const stepData = TOUR_STEPS[step];

  // Inject CSS once
  useEffect(() => {
    if (!document.getElementById('tour-css')) {
      const s = document.createElement('style');
      s.id = 'tour-css';
      s.textContent = AVATAR_CSS;
      document.head.appendChild(s);
    }
    return () => stop();
  }, []);

  // Speak when step changes
  useEffect(() => {
    if (!visible || !voiceOn || minimized) return;
    stop();
    setSpeaking(true);
    speak(stepData.text, {
      onEnd:   () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
    return () => stop();
  }, [step, visible, voiceOn, minimized]);

  function next() {
    stop();
    if (step < TOUR_STEPS.length - 1) setStep(s => s + 1);
    else close();
  }

  function prev() {
    stop();
    if (step > 0) setStep(s => s - 1);
  }

  function close() {
    stop();
    setVisible(false);
    setStep(0);
    onClose?.();
  }

  function goTo(path) {
    nav(path);
    setTimeout(next, 300);
  }

  function toggleVoice() {
    if (voiceOn) { stop(); setSpeaking(false); }
    setVoiceOn(v => !v);
  }

  // Expose start globally
  useEffect(() => {
    window.__startAppTour = () => { setStep(0); setVisible(true); setMinimized(false); };
    return () => { delete window.__startAppTour; };
  }, []);

  if (!visible) {
    return (
      <button
        onClick={() => { setVisible(true); setMinimized(false); }}
        title="App Tour Guide"
        style={{
          position: 'fixed', bottom: 90, right: 16, zIndex: 9000,
          width: 52, height: 52, borderRadius: '50%',
          background: `linear-gradient(135deg, ${ACCENT}, #A78BFF)`,
          border: 'none', cursor: 'pointer', fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(124,92,255,0.55)',
          animation: 'tour-pulse 2.5s infinite',
        }}
      >🗺️</button>
    );
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed', bottom: 90, right: 16, zIndex: 9000,
          width: 52, height: 52, borderRadius: '50%',
          background: `linear-gradient(135deg, ${ACCENT}, #A78BFF)`,
          border: 'none', cursor: 'pointer', fontSize: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(124,92,255,0.55)',
        }}
      >🤖</button>
    );
  }

  const progress = ((step) / (TOUR_STEPS.length - 1)) * 100;

  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 12, left: 12,
      maxWidth: 380, marginLeft: 'auto',
      zIndex: 9000, animation: 'tour-in 0.3s ease',
    }}>
      {/* Card */}
      <div style={{
        background: CARD, border: `1px solid rgba(124,92,255,0.3)`,
        borderRadius: 20, overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
      }}>
        {/* Top bar */}
        <div style={{
          background: `linear-gradient(135deg, ${ACCENT}cc, #5B8CFFcc)`,
          padding: '10px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          {/* Avatar */}
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
            animation: speaking ? 'tour-speak 0.5s infinite' : 'tour-bounce 2s infinite',
          }}>🤖</div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>ScholarAI Guide</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              Step {step + 1} of {TOUR_STEPS.length}
            </div>
          </div>

          {/* Voice toggle */}
          {speechSupported() && (
            <button onClick={toggleVoice} title={voiceOn ? 'Mute voice' : 'Enable voice'} style={{
              background: voiceOn ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 8, color: '#fff', cursor: 'pointer',
              padding: '4px 8px', fontSize: 16,
            }}>
              {voiceOn ? '🔊' : '🔇'}
            </button>
          )}

          {/* Minimize */}
          <button onClick={() => { stop(); setMinimized(true); }} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 8, color: '#fff', cursor: 'pointer',
            padding: '4px 8px', fontSize: 14,
          }}>—</button>

          {/* Close */}
          <button onClick={close} style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 8, color: '#fff', cursor: 'pointer',
            padding: '4px 8px', fontSize: 14,
          }}>✕</button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}>
          <div style={{
            height: '100%', width: `${progress}%`,
            background: `linear-gradient(90deg, ${ACCENT}, #A78BFF)`,
            transition: 'width 0.4s ease',
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 8 }}>
            {stepData.title}
          </div>

          {/* Speaking indicator */}
          {speaking && voiceOn && (
            <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 8 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: ACCENT,
                  animation: `dot-blink 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginLeft: 4 }}>Speaking...</span>
            </div>
          )}

          <div style={{
            fontSize: 13, color: 'rgba(255,255,255,0.8)',
            lineHeight: 1.6, marginBottom: 14,
          }}>
            {stepData.text}
          </div>

          {/* Action button */}
          {stepData.action && (
            <button onClick={() => goTo(stepData.action.path)} style={{
              width: '100%', padding: '9px 0',
              background: 'rgba(124,92,255,0.2)',
              border: `1px solid ${ACCENT}55`,
              borderRadius: 10, color: ACCENT,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              marginBottom: 12,
            }}>
              {stepData.action.label} →
            </button>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={prev} disabled={step === 0} style={{
              flex: 1, padding: '9px 0',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: step === 0 ? 'rgba(255,255,255,0.2)' : '#fff',
              fontWeight: 600, fontSize: 13, cursor: step === 0 ? 'default' : 'pointer',
            }}>
              ← Back
            </button>
            <button onClick={next} style={{
              flex: 2, padding: '9px 0',
              background: `linear-gradient(135deg, ${ACCENT}, #5B8CFF)`,
              border: 'none', borderRadius: 10, color: '#fff',
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: `0 4px 16px ${ACCENT}44`,
            }}>
              {step === TOUR_STEPS.length - 1 ? '🎉 Finish Tour' : 'Next →'}
            </button>
          </div>

          {/* Step dots */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginTop: 12 }}>
            {TOUR_STEPS.map((_, i) => (
              <button key={i} onClick={() => { stop(); setStep(i); }} style={{
                width: i === step ? 18 : 7, height: 7,
                borderRadius: 4, border: 'none',
                background: i === step ? ACCENT : 'rgba(255,255,255,0.15)',
                cursor: 'pointer', padding: 0,
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
