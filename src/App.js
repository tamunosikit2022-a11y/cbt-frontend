import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import React, { lazy, Suspense, useState, useCallback, useEffect, useRef } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import YouTubeGate from "./components/YouTubeGate";    // ← FIX 1: YouTube subscription gate

// ── CORE ──────────────────────────────────────────────────
const Landing          = lazy(() => import("./pages/Landing"));
const Login            = lazy(() => import("./pages/Login"));
const Register         = lazy(() => import("./pages/Register"));
const ForgotPassword   = lazy(() => import("./pages/ForgotPassword"));
const Dashboard        = lazy(() => import("./pages/Dashboard"));
const ExamSelect       = lazy(() => import("./pages/ExamSelect"));
const Exam             = lazy(() => import("./pages/Exam"));
const Results          = lazy(() => import("./pages/Results"));
const History          = lazy(() => import("./pages/History"));
const Leaderboard      = lazy(() => import("./pages/Leaderboard"));
const Performance      = lazy(() => import("./pages/Performance"));
const ErrorReview      = lazy(() => import("./pages/ErrorReview"));
const Upgrade          = lazy(() => import("./pages/Upgrade"));
const Tokens           = lazy(() => import("./pages/Tokens"));
const Profile          = lazy(() => import("./pages/Profile"));

// ── ARENA ─────────────────────────────────────────────────
const Arena            = lazy(() => import("./pages/arena/Arena"));
const WaitingRoom      = lazy(() => import("./pages/arena/WaitingRoom"));
const Match            = lazy(() => import("./pages/arena/Match"));
const ArenaResults     = lazy(() => import("./pages/arena/ArenaResults"));

// ── PHASE 1 INNOVATIONS ───────────────────────────────────
const DailyChallenge   = lazy(() => import("./pages/DailyChallenge"));
const PredictedScore   = lazy(() => import("./pages/PredictedScore"));
const Badges           = lazy(() => import("./pages/Badges"));
const ResumeExam       = lazy(() => import("./pages/ResumeExam"));
const AdmissionChecker = lazy(() => import("./pages/AdmissionChecker"));

// ── PHASE 2 INNOVATIONS ───────────────────────────────────
const PersonalityProfile = lazy(() => import("./pages/PersonalityProfile"));
const BeatYourself       = lazy(() => import("./pages/BeatYourself"));
const ParentPortal       = lazy(() => import("./pages/ParentPortal"));

// ── NEW FEATURES ──────────────────────────────────────────
const VideoLibrary     = lazy(() => import("./pages/VideoLibrary"));
const Missions         = lazy(() => import("./pages/Missions"));
const SpinWheel        = lazy(() => import("./pages/SpinWheel"));
const ThemeSettings    = lazy(() => import("./pages/ThemeSettings"));
const ClassroomLobby   = lazy(() => import("./pages/classroom/ClassroomLobby"));
const ClassroomSession = lazy(() => import("./pages/classroom/ClassroomSession"));
const AITutor          = lazy(() => import("./pages/AITutor"));

// ── NEW FEATURES (v2) ─────────────────────────────────────
const WeaknessHeatmap  = lazy(() => import("./pages/WeaknessHeatmap"));
const ReferEarn        = lazy(() => import("./pages/ReferEarn"));
const StudyPlanner     = lazy(() => import("./pages/StudyPlanner"));

// ── METAVERSE FEATURES ────────────────────────────────────
const GemStore         = lazy(() => import("./pages/GemStore"));
const Spirits          = lazy(() => import("./pages/Spirits"));
const Skills           = lazy(() => import("./pages/Skills"));
const KnowledgeVault   = lazy(() => import("./pages/KnowledgeVault"));
const Factions         = lazy(() => import("./pages/Factions"));

// ── ADMIN ─────────────────────────────────────────────────
const AdminLogin       = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard   = lazy(() => import("./pages/admin/AdminDashboard"));

// ── SUBSCRIBE & ONBOARDING ────────────────────────────────
const Subscribe        = lazy(() => import("./pages/Subscribe"));  // ← FIX 8: dedicated premium page

// ── Innovation Pages ──────────────────────────────────────────
const WeaknessDetector = lazy(() => import("./pages/WeaknessDetector"));
const AIQuizGenerator  = lazy(() => import("./pages/AIQuizGenerator"));
const Social           = lazy(() => import("./pages/Social"));
const SchoolWars       = lazy(() => import("./pages/SchoolWars"));
const TreasureChests   = lazy(() => import("./pages/TreasureChests"));
const BlitzMode        = lazy(() => import("./pages/BlitzMode"));

// ── v3 UPGRADES ────────────────────────────────────────────
const Flashcards       = lazy(() => import("./pages/Flashcards"));
const AIQuestions      = lazy(() => import("./pages/AIQuestions"));
const SchoolFinder     = lazy(() => import("./pages/SchoolFinder"));
const Tournaments      = lazy(() => import("./pages/Tournaments"));
const Seasons          = lazy(() => import("./pages/Seasons"));

// ── ANIMATED LOADING FALLBACK ─────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: "var(--bg)", fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <style>{`
        @keyframes pl-pulse { 0%,80%,100%{transform:scale(0.6);opacity:0.35} 40%{transform:scale(1.1);opacity:1} }
        @keyframes pl-spin  { to{transform:rotate(360deg)} }
      `}</style>
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: "linear-gradient(135deg,#7C5CFF,#5B8CFF)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30,
        boxShadow: "0 0 30px rgba(124,92,255,0.5)",
        animation: "pl-spin 3s linear infinite",
      }}>🎓</div>
      <div style={{ display: "flex", gap: 7 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 9, height: 9, borderRadius: "50%", background: "var(--primary)",
            animation: `pl-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ── ROUTE GUARDS ──────────────────────────────────────────
function Private({ children }) {
  const { student } = useAuth();
  return student ? children : <Navigate to="/login" replace />;
}

function Public({ children }) {
  const { student } = useAuth();
  return student ? <Navigate to="/dashboard" replace /> : children;
}

function AdminGuard({ children }) {
  const token = localStorage.getItem("admin_token");
  return token ? children : <Navigate to="/admin/login" replace />;
}

// ── AI TUTOR WRAPPER ──────────────────────────────────────
function AITutorWithUser() {
  const { student } = useAuth();
  return <AITutor user={student} />;
}

export default function App() {
  const [gateCleared, setGateCleared] = useState(
    () => localStorage.getItem("elitronix_subscribed") === "true"
  );
  const handleGateConfirm = useCallback(() => setGateCleared(true), []);

  if (!gateCleared) {
    return <YouTubeGate onConfirmed={handleGateConfirm} />;
  }

  return (
    <ErrorBoundary>
    <ThemeProvider>
      <AuthProvider>
        <FXOverlay />
        <PremiumEventBanner />
        <ParticleBackground />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Public><Login /></Public>} />
              <Route path="/register" element={<Public><Register /></Public>} />
              <Route path="/forgot-password" element={<Public><ForgotPassword /></Public>} />

              {/* Student Routes */}
              <Route path="/dashboard" element={<Private><Dashboard /></Private>} />
              <Route path="/profile" element={<Private><Profile /></Private>} />
              <Route path="/exam-select" element={<Private><ExamSelect /></Private>} />
              <Route path="/exam" element={<Private><Exam /></Private>} />
              <Route path="/results" element={<Private><Results /></Private>} />
              <Route path="/history" element={<Private><History /></Private>} />
              <Route path="/leaderboard" element={<Private><Leaderboard /></Private>} />
              <Route path="/performance" element={<Private><Performance /></Private>} />
              <Route path="/error-review" element={<Private><ErrorReview /></Private>} />
              <Route path="/upgrade"   element={<Navigate to="/subscribe" replace />} />
              <Route path="/subscribe" element={<Private><Subscribe /></Private>} />

              {/* ── Innovation Routes ───────────────────────── */}
              <Route path="/weakness"      element={<Private><WeaknessDetector /></Private>} />
              <Route path="/ai-quiz"       element={<Private><AIQuizGenerator /></Private>} />
              <Route path="/social"        element={<Private><Social /></Private>} />
              <Route path="/school-wars"   element={<Private><SchoolWars /></Private>} />
              <Route path="/chests"        element={<Private><TreasureChests /></Private>} />
              <Route path="/blitz"         element={<Private><BlitzMode /></Private>} />
              <Route path="/tokens"    element={<Private><Tokens /></Private>} />

              {/* AI Tutor Route */}
              <Route path="/ai-tutor" element={<Private><AITutorWithUser /></Private>} />

              {/* Arena Routes */}
              <Route path="/arena" element={<Private><Arena /></Private>} />
              <Route path="/arena/waiting" element={<Private><WaitingRoom /></Private>} />
              <Route path="/arena/match" element={<Private><Match /></Private>} />
              <Route path="/arena/results" element={<Private><ArenaResults /></Private>} />

              {/* Phase 1 Innovations */}
              <Route path="/challenge" element={<Private><DailyChallenge /></Private>} />
              <Route path="/predicted" element={<Private><PredictedScore /></Private>} />
              <Route path="/badges" element={<Private><Badges /></Private>} />
              <Route path="/resume" element={<Private><ResumeExam /></Private>} />
              <Route path="/admission" element={<Private><AdmissionChecker /></Private>} />

              {/* New Features */}
              <Route path="/videos" element={<Private><VideoLibrary /></Private>} />
              <Route path="/missions" element={<Private><Missions /></Private>} />
              <Route path="/spin" element={<Private><SpinWheel /></Private>} />
              <Route path="/theme" element={<Private><ThemeSettings /></Private>} />
              <Route path="/classroom" element={<Private><ClassroomLobby /></Private>} />
              <Route path="/classroom/session" element={<Private><ClassroomSession /></Private>} />

              {/* Phase 2 Innovations */}
              <Route path="/personality" element={<Private><PersonalityProfile /></Private>} />
              <Route path="/beat-yourself" element={<Private><BeatYourself /></Private>} />

              {/* Metaverse Features */}
              <Route path="/gems" element={<Private><GemStore /></Private>} />
              <Route path="/spirits" element={<Private><Spirits /></Private>} />
              <Route path="/skills" element={<Private><Skills /></Private>} />
              <Route path="/vault" element={<Private><KnowledgeVault /></Private>} />
              <Route path="/factions" element={<Private><Factions /></Private>} />

              {/* Parent Portal */}
              <Route path="/parent" element={<ParentPortal />} />

              {/* NEW v2 ROUTES */}
              <Route path="/heatmap"       element={<Private><WeaknessHeatmap /></Private>} />
              <Route path="/refer"         element={<Private><ReferEarn /></Private>} />
              <Route path="/study-planner" element={<Private><StudyPlanner /></Private>} />

              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />

              {/* v3 Upgrade Routes */}
              <Route path="/flashcards"    element={<Private><Flashcards /></Private>} />
              <Route path="/ai-questions"  element={<Private><AIQuestions /></Private>} />
              <Route path="/school-finder" element={<Private><SchoolFinder /></Private>} />
              <Route path="/seasons"       element={<Private><Seasons /></Private>} />
              <Route path="/tournaments"   element={<Private><Tournaments /></Private>} />

              {/* 404 Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
    </ErrorBoundary>
  );
}

// ══════════════════════════════════════════════════════════════
// FX OVERLAY — Micro-interactions (coin fly, confetti, flash)
// ══════════════════════════════════════════════════════════════
function FXOverlay() {
  const [particles, setParticles] = useState([]);
  const [flashes,   setFlashes]   = useState([]);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || "";
    const SOCKET_URL = API_URL.replace(/\/api$/, "");
    const token = localStorage.getItem("token");
    if (!token) return;

    // Dynamic import to prevent React build crash
    let socket = null;
    try {
      const { io } = (await import("socket.io-client"));
      socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });
    } catch { return; }

    const addCoins = (d) => {
      const id = Date.now() + Math.random();
      setParticles(p => [...p, { id, type:"coin", amount:d.amount, x:Math.random()*60+20, y:Math.random()*40+30 }]);
      setTimeout(() => setParticles(p => p.filter(x => x.id!==id)), 900);
    };

    const addConfetti = (d) => {
      const pieces = Array.from({length: d.intensity==="explosion"?30:d.intensity==="heavy"?18:10}, (_,i) => ({
        id: Date.now()+i, type:"confetti",
        x: Math.random()*100, y: Math.random()*50+10,
        color: d.color==="rainbow" ? `hsl(${Math.random()*360},90%,60%)` : d.color==="gold" ? "#FFC857" : "#7C5CFF",
        rotate: Math.random()*360,
        delay: Math.random()*0.4,
      }));
      setParticles(p => [...p, ...pieces]);
      setTimeout(() => setParticles(p => p.filter(x => x.type!=="confetti")), 1200);
    };

    const addFlash = (d) => {
      const id = Date.now();
      setFlashes(f => [...f, { id, color: d.color||"#7C5CFF", duration: d.duration||600 }]);
      setTimeout(() => setFlashes(f => f.filter(x => x.id!==id)), d.duration||600);
    };

    let sid = null;
    try { sid = JSON.parse(atob((token.split(".")||["","{}",""])[1]||"e30=") || "{}").id; } catch {}
    if (sid) socket.emit("fx:subscribe", { studentId: sid });

    socket.on("fx:coin_fly",    addCoins);
    socket.on("fx:confetti",    addConfetti);
    socket.on("fx:screen_flash",addFlash);
    socket.on("fx:victory",     (d) => { addConfetti({ intensity:"explosion", color:"gold" }); });
    socket.on("fx:badge_unlock",(d) => { addConfetti({ intensity:"heavy", color:"rainbow" }); addFlash({ color:"#FFC857", duration:800 }); });
    socket.on("fx:rank_up",     (d) => {
      const el = document.createElement("div");
      el.className = "rank-up-banner";
      el.textContent = "🏆 RANK UP — " + (d.rankName||"");
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 3200);
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <div style={{ position:"fixed",inset:0,pointerEvents:"none",zIndex:9998,overflow:"hidden" }}>
      {flashes.map(f => (
        <div key={f.id} style={{ position:"absolute",inset:0,background:f.color,opacity:0,animation:`screenFlash ${f.duration}ms ease-out forwards` }} />
      ))}
      {particles.map(p => p.type==="coin" ? (
        <div key={p.id} style={{ position:"absolute", left:`${p.x}%`, top:`${p.y}%`, animation:"coinFly 0.85s ease-out forwards", fontSize:18, fontWeight:800, color:"#FFC857", textShadow:"0 0 8px #FFC85780" }}>
          +{p.amount}🪙
        </div>
      ) : (
        <div key={p.id} style={{ position:"absolute", left:`${p.x}%`, top:`${p.y}%`, width:10, height:10, borderRadius:2, background:p.color, animation:`confettiBurst 1s ease-out ${p.delay}s forwards`, transform:`rotate(${p.rotate}deg)`, opacity:0 }} />
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PREMIUM EVENT BANNER — shows when admin activates free day
// ══════════════════════════════════════════════════════════════
function PremiumEventBanner() {
  const [event, setEvent]     = useState(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDis]   = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const API_URL = process.env.REACT_APP_API_URL || "";
    const SOCKET_URL = API_URL.replace(/\/api$/, "");
    const check = async () => {
      try {
        const r = await fetch(`${API_URL}/premium-status`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        });
        if (!r.ok) return;
        const d = await r.json();
        if (d.source === "event" && d.event) {
          setEvent(d.event);
          setVisible(true);
          // Dynamic import — never use require() in React bundle
          import("socket.io-client").then(({ io }) => {
            const s = io(SOCKET_URL, { transports:["websocket"] });
            s.on("premium:event", (data) => {
              if (data.type === "started") { setEvent(data.event); setVisible(true); setDis(false); }
              if (data.type === "ended")   { setEvent(null); setVisible(false); }
            });
            s.on("premium:event_warning", (data) => {
              setEvent(prev => prev ? { ...prev, warning: data.message } : null);
            });
          }).catch(() => {});
        }
      } catch {}
    };
    check();
    timerRef.current = setInterval(check, 30000);
    return () => clearInterval(timerRef.current);
  }, []);

  if (!event || !visible || dismissed) return null;

  const endsIn = event.endsInLabel || (event.endsIn ? Math.floor(event.endsIn/60000)+"m" : "");

  return (
    <div style={{ position:"fixed",top:0,left:0,right:0,zIndex:9990,background:"linear-gradient(135deg,#7C5CFF,#FFC857)",padding:"10px 16px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 20px rgba(124,92,255,0.5)" }}>
      <span style={{fontSize:20}}>⚡</span>
      <div style={{flex:1}}>
        <span style={{color:"#fff",fontWeight:800,fontSize:14}}>{event.name || "Free Premium Active!"}</span>
        {endsIn && <span style={{color:"rgba(255,255,255,0.85)",fontSize:12,marginLeft:8}}>Ends in {endsIn}</span>}
        {event.warning && <div style={{color:"#fff3cd",fontSize:11,marginTop:1}}>{event.warning}</div>}
      </div>
      <a href="/subscribe" style={{background:"rgba(255,255,255,0.25)",color:"#fff",borderRadius:8,padding:"4px 12px",fontSize:12,fontWeight:700,textDecoration:"none",flexShrink:0}}>Upgrade to Keep</a>
      <button onClick={()=>setDis(true)} style={{background:"none",border:"none",color:"rgba(255,255,255,0.7)",cursor:"pointer",fontSize:18,padding:0,lineHeight:1}}>✕</button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// PARTICLE BACKGROUND — subtle floating dots
// ══════════════════════════════════════════════════════════════
function ParticleBackground() {
  const particles = useRef(
    Array.from({length:18},(_,i) => ({
      id:i,
      x: Math.random()*100,
      y: Math.random()*100,
      size: Math.random()*3+1,
      duration: Math.random()*20+15,
      delay: Math.random()*10,
      opacity: Math.random()*0.25+0.05,
    }))
  ).current;

  return (
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:"absolute",
          left:`${p.x}%`,
          top:`${p.y}%`,
          width:p.size,
          height:p.size,
          borderRadius:"50%",
          background:"rgba(124,92,255,0.6)",
          opacity:p.opacity,
          animation:`particleDrift ${p.duration}s linear ${p.delay}s infinite`,
          pointerEvents:"none",
        }} />
      ))}
    </div>
  );
}
