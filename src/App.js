import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import React, { lazy, Suspense, useState, useCallback, useEffect, useRef } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import YouTubeGate from "./components/YouTubeGate";    // ← FIX 1: YouTube subscription gate
import FloatingNav from "./components/FloatingNav";    // ← always-available Home button
import EmailVerifyBanner from "./components/EmailVerifyBanner"; // ← nags unverified students to confirm email

// ══════════════════════════════════════════════════════════════
// LAZY PAGE IMPORTS — grouped to match the domain hubs below
// ══════════════════════════════════════════════════════════════

// ── PUBLIC & GUEST ───────────────────────────────────────
const Landing          = lazy(() => import("./pages/Landing"));
const Login             = lazy(() => import("./pages/Login"));
const Register          = lazy(() => import("./pages/Register"));
const ForgotPassword    = lazy(() => import("./pages/ForgotPassword"));
const TermsOfService    = lazy(() => import("./pages/TermsOfService"));
const Privacy           = lazy(() => import("./pages/Privacy"));

// ── TOKEN & ACTION HANDLERS ──────────────────────────────
const EmailVerify        = lazy(() => import("./pages/EmailVerify"));
const ParentInviteSetup  = lazy(() => import("./pages/ParentInviteSetup"));

// ── PARENT PORTAL ─────────────────────────────────────────
const ParentPortal       = lazy(() => import("./pages/ParentPortal"));

// ── CORE STUDENT MANAGEMENT ──────────────────────────────
const Dashboard          = lazy(() => import("./pages/Dashboard"));
const Profile             = lazy(() => import("./pages/Profile"));
const ThemeSettings       = lazy(() => import("./pages/ThemeSettings"));
const Subscribe           = lazy(() => import("./pages/Subscribe"));
const ReferEarn           = lazy(() => import("./pages/ReferEarn"));

// ── CBT EXAM ENGINE ──────────────────────────────────────
const ExamSelect         = lazy(() => import("./pages/ExamSelect"));
const Exam                = lazy(() => import("./pages/Exam"));
const ResumeExam           = lazy(() => import("./pages/ResumeExam"));
const Results              = lazy(() => import("./pages/Results"));
const History               = lazy(() => import("./pages/History"));
const ErrorReview            = lazy(() => import("./pages/ErrorReview"));
const SimulatorPage        = lazy(() => import("./pages/SimulatorPage"));

// ── ANALYTICS & AI LEARNING ──────────────────────────────
const WeaknessDetector    = lazy(() => import("./pages/WeaknessDetector"));
const PredictedScore       = lazy(() => import("./pages/PredictedScore"));
const Performance            = lazy(() => import("./pages/Performance"));
const AITutor                 = lazy(() => import("./pages/AITutor"));
const AIQuizGenerator        = lazy(() => import("./pages/AIQuizGenerator"));
const AIQuestions             = lazy(() => import("./pages/AIQuestions"));

// ── ADMISSIONS & CAREER ──────────────────────────────────
const AdmissionChecker    = lazy(() => import("./pages/AdmissionChecker"));
const CutoffTracker        = lazy(() => import("./pages/CutoffTracker"));
const SchoolFinder          = lazy(() => import("./pages/SchoolFinder"));
const CampusFinder           = lazy(() => import("./pages/CampusFinder"));
const UniversityCourses       = lazy(() => import("./pages/UniversityCourses"));
const CareerQuiz               = lazy(() => import("./pages/CareerQuiz"));

// ── GAMIFICATION & PROGRESS ──────────────────────────────
const Rewards             = lazy(() => import("./pages/Rewards"));
const Store                = lazy(() => import("./pages/Store"));
const Seasons                = lazy(() => import("./pages/Seasons"));
const Badges                  = lazy(() => import("./pages/Badges"));
const PersonalityProfile       = lazy(() => import("./pages/PersonalityProfile"));
const KnowledgeVault             = lazy(() => import("./pages/KnowledgeVault"));

// ── PVP ARENA & TOURNAMENTS ──────────────────────────────
const Arena                = lazy(() => import("./pages/arena/Arena"));
const WaitingRoom            = lazy(() => import("./pages/arena/WaitingRoom"));
const Match                    = lazy(() => import("./pages/arena/Match"));
const ArenaResults               = lazy(() => import("./pages/arena/ArenaResults"));
const Tournaments                  = lazy(() => import("./pages/Tournaments"));
const SchoolCompetition               = lazy(() => import("./pages/SchoolCompetition"));
const Challenges                        = lazy(() => import("./pages/Challenges"));

// ── COMMUNITY & SOCIAL ───────────────────────────────────
const Social               = lazy(() => import("./pages/Social"));
const CommunityChat          = lazy(() => import("./pages/CommunityChat"));
const Leaderboard              = lazy(() => import("./pages/Leaderboard"));
const UniversityLeaderboard      = lazy(() => import("./pages/UniversityLeaderboard"));

// ── CLASSROOM & VIRTUAL IDE ──────────────────────────────
const ClassroomLobby       = lazy(() => import("./pages/classroom/ClassroomLobby"));
const ClassroomSession       = lazy(() => import("./pages/classroom/ClassroomSession"));
const ClassroomReplay          = lazy(() => import("./pages/classroom/ClassroomReplay"));
const VideoLibrary               = lazy(() => import("./pages/VideoLibrary"));
const Missions                     = lazy(() => import("./pages/Missions"));
const LiveIDESolo                    = lazy(() => import("./pages/classroom/LiveIDESolo"));

// ── STUDY TOOLS ───────────────────────────────────────────
const Flashcards           = lazy(() => import("./pages/Flashcards"));
const StudyPlanner           = lazy(() => import("./pages/StudyPlanner"));

// ── METAVERSE FEATURES (unmapped in blueprint — kept as-is) ─
const Spirits               = lazy(() => import("./pages/Spirits"));
const Skills                  = lazy(() => import("./pages/Skills"));

// ── ADMIN ─────────────────────────────────────────────────
const AdminLogin           = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard         = lazy(() => import("./pages/admin/AdminDashboard"));

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

// Pathless layout route — applies the Private guard to every child route
// below without adding a URL segment. This is what "STUDENT DASHBOARD HUB
// [Guard: Private]" means in the blueprint: one guard, many domain hubs.
function PrivateHub() {
  return <Private><Outlet /></Private>;
}

// ── ROOT ROUTE ────────────────────────────────────────────
// FIX: "/" used to always render the marketing Landing page, even for
// returning/logged-in students. Now: logged-in students are sent straight
// to their Dashboard on every visit; Landing (with the compulsory YouTube
// subscribe CTA baked into YouTubeGate above) is only ever shown to
// signed-out / new visitors.
function RootRoute() {
  const { student } = useAuth();
  return student ? <Navigate to="/dashboard" replace /> : <Landing />;
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
          <EmailVerifyBanner />
          <Suspense fallback={<PageLoader />}>
            <Routes>

              {/* ══════════════════════════════════════════════
                  PUBLIC & GUEST ROUTES
                  ══════════════════════════════════════════════ */}
              <Route path="/" element={<RootRoute />} />
              <Route path="/login" element={<Public><Login /></Public>} />
              <Route path="/register" element={<Public><Register /></Public>} />
              <Route path="/forgot-password" element={<Public><ForgotPassword /></Public>} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* ══════════════════════════════════════════════
                  TOKEN & ACTION HANDLERS (unguarded — token itself
                  is the credential; do not wrap in Private/AdminGuard)
                  ══════════════════════════════════════════════ */}
              <Route path="/verify-email/:token" element={<EmailVerify />} />
              <Route path="/parent-access/:token" element={<ParentInviteSetup />} />

              {/* ══════════════════════════════════════════════
                  PARENT PORTAL (standalone — internal parent auth,
                  not the student Private guard)
                  ══════════════════════════════════════════════ */}
              <Route path="/parent/*" element={<ParentPortal />} />

              {/* ══════════════════════════════════════════════
                  STUDENT DASHBOARD HUB — everything below this
                  point (until Admin) is behind the Private guard.
                  ══════════════════════════════════════════════ */}
              <Route element={<PrivateHub />}>

                {/* ── Core Student Management ── */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/theme" element={<ThemeSettings />} />
                <Route path="/subscribe" element={<Subscribe />} />
                <Route path="/upgrade" element={<Navigate to="/subscribe" replace />} />
                <Route path="/refer" element={<ReferEarn />} />

                {/* ── CBT Exam Engine ── */}
                <Route path="/exams" element={<ExamSelect />} />
                <Route path="/exam-select" element={<Navigate to="/exams" replace />} />
                <Route path="/exams/active" element={<Exam />} />
                <Route path="/exam" element={<Navigate to="/exams/active" replace />} />
                <Route path="/exams/resume" element={<ResumeExam />} />
                <Route path="/resume" element={<Navigate to="/exams/resume" replace />} />
                <Route path="/exams/results" element={<Results />} />
                <Route path="/results" element={<Navigate to="/exams/results" replace />} />
                <Route path="/exams/history" element={<History />} />
                <Route path="/history" element={<Navigate to="/exams/history" replace />} />
                <Route path="/exams/error-review" element={<ErrorReview />} />
                <Route path="/error-review" element={<Navigate to="/exams/error-review" replace />} />
                <Route path="/exams/simulator" element={<SimulatorPage />} />
                <Route path="/simulator" element={<Navigate to="/exams/simulator" replace />} />

                {/* ── Analytics & AI Learning ── */}
                <Route path="/analytics/weakness" element={<WeaknessDetector />} />
                <Route path="/weakness" element={<Navigate to="/analytics/weakness" replace />} />
                <Route path="/heatmap" element={<Navigate to="/analytics/weakness" replace />} />
                <Route path="/analytics/predicted" element={<PredictedScore />} />
                <Route path="/predicted" element={<Navigate to="/analytics/predicted" replace />} />
                <Route path="/analytics/performance" element={<Performance />} />
                <Route path="/performance" element={<Navigate to="/analytics/performance" replace />} />
                <Route path="/ai/tutor" element={<AITutorWithUser />} />
                <Route path="/ai-tutor" element={<Navigate to="/ai/tutor" replace />} />
                <Route path="/ai/quiz-gen" element={<AIQuizGenerator />} />
                <Route path="/ai-quiz" element={<Navigate to="/ai/quiz-gen" replace />} />
                <Route path="/ai/questions" element={<AIQuestions />} />
                <Route path="/ai-questions" element={<Navigate to="/ai/questions" replace />} />

                {/* ── Admissions & Career ── */}
                <Route path="/admissions/checker" element={<AdmissionChecker />} />
                <Route path="/admission" element={<Navigate to="/admissions/checker" replace />} />
                <Route path="/admissions/cutoffs" element={<CutoffTracker />} />
                <Route path="/cutoffs" element={<Navigate to="/admissions/cutoffs" replace />} />
                <Route path="/admissions/schools" element={<SchoolFinder />} />
                <Route path="/school-finder" element={<Navigate to="/admissions/schools" replace />} />
                <Route path="/admissions/schools/campus/:id" element={<CampusFinder />} />
                <Route path="/school-finder/campus/:id" element={<CampusFinder />} />
                {/* SECURITY FIX: /university used to render UniversityCourses
                    completely unguarded (no Private wrapper at all), letting
                    non-subscribers read full course materials. It now lives
                    inside the Private hub as /admissions/courses; the old
                    path just redirects (and is therefore gated too). */}
                <Route path="/admissions/courses" element={<UniversityCourses />} />
                <Route path="/university" element={<Navigate to="/admissions/courses" replace />} />
                <Route path="/career-quiz" element={<CareerQuiz />} />

                {/* ── Gamification & Progress ──
                    NOTE: kept /rewards and /store as two separate canonical
                    routes rather than collapsing everything into one, since
                    Store.js is wired to live payment flows (gems/tokens via
                    Paystack + WhatsApp) that are riskier to merge blindly.
                    All legacy aliases still redirect to one of the two. */}
                <Route path="/rewards" element={<Rewards />} />
                <Route path="/chests" element={<Navigate to="/rewards" replace />} />
                <Route path="/spin" element={<Navigate to="/rewards" replace />} />
                <Route path="/store" element={<Store />} />
                <Route path="/tokens" element={<Navigate to="/store" replace />} />
                <Route path="/gems" element={<Navigate to="/store" replace />} />
                <Route path="/seasons" element={<Seasons />} />
                <Route path="/badges" element={<Badges />} />
                <Route path="/personality" element={<PersonalityProfile />} />
                <Route path="/vault" element={<KnowledgeVault />} />

                {/* ── PvP Arena & Tournaments ── */}
                <Route path="/arena" element={<Arena />} />
                <Route path="/arena/waiting" element={<WaitingRoom />} />
                <Route path="/arena/match" element={<Match />} />
                <Route path="/arena/results" element={<ArenaResults />} />
                <Route path="/arena/tournaments" element={<Tournaments />} />
                <Route path="/tournaments" element={<Navigate to="/arena/tournaments" replace />} />
                <Route path="/school-wars" element={<SchoolCompetition />} />
                <Route path="/school-competition" element={<Navigate to="/school-wars" replace />} />
                <Route path="/factions" element={<Navigate to="/school-wars" replace />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/challenge" element={<Navigate to="/challenges" replace />} />
                <Route path="/blitz" element={<Navigate to="/challenges" replace />} />
                <Route path="/beat-yourself" element={<Navigate to="/challenges" replace />} />

                {/* ── Community & Social ── */}
                <Route path="/community" element={<Social />} />
                <Route path="/social" element={<Navigate to="/community" replace />} />
                <Route path="/community/chat" element={<CommunityChat />} />
                <Route path="/community-chat" element={<Navigate to="/community/chat" replace />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/university-leaderboard" element={<UniversityLeaderboard />} />

                {/* ── Classroom & Virtual IDE ── */}
                <Route path="/classroom" element={<ClassroomLobby />} />
                <Route path="/classroom/session" element={<ClassroomSession />} />
                <Route path="/classroom/replay" element={<ClassroomReplay />} />
                <Route path="/classroom/videos" element={<VideoLibrary />} />
                <Route path="/videos" element={<Navigate to="/classroom/videos" replace />} />
                <Route path="/classroom/missions" element={<Missions />} />
                <Route path="/missions" element={<Navigate to="/classroom/missions" replace />} />
                <Route path="/classroom/ide" element={<LiveIDESolo />} />

                {/* ── Study Tools ── */}
                <Route path="/flashcards" element={<Flashcards />} />
                <Route path="/study-planner" element={<StudyPlanner />} />

                {/* ── Metaverse Features — not covered in the blueprint's
                    route audit; left in place unchanged so nothing 404s ── */}
                <Route path="/spirits" element={<Spirits />} />
                <Route path="/skills" element={<Skills />} />

              </Route>

              {/* ══════════════════════════════════════════════
                  ADMINISTRATIVE PANEL [Guard: AdminGuard]
                  ══════════════════════════════════════════════ */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/*" element={<AdminGuard><AdminDashboard /></AdminGuard>} />

              {/* ══════════════════════════════════════════════
                  FALLBACK
                  ══════════════════════════════════════════════ */}
              <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
          </Suspense>
          <FloatingNav />
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
    const connectSocket = async () => {
      try {
        const { io } = await import("socket.io-client");
        socket = io(SOCKET_URL, { auth: { token }, transports: ["websocket"] });

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
      } catch { return; }
    };

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

    connectSocket();

    return () => { if (socket) socket.disconnect(); };
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
