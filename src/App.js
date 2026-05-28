import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { lazy, Suspense } from "react";

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

// ── METAVERSE FEATURES ────────────────────────────────────
const GemStore         = lazy(() => import("./pages/GemStore"));
const Spirits          = lazy(() => import("./pages/Spirits"));
const Skills           = lazy(() => import("./pages/Skills"));
const KnowledgeVault   = lazy(() => import("./pages/KnowledgeVault"));
const Factions         = lazy(() => import("./pages/Factions"));

// ── ADMIN ─────────────────────────────────────────────────
const AdminLogin       = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard   = lazy(() => import("./pages/admin/AdminDashboard"));

// ── ANIMATED LOADING FALLBACK ─────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 16,
      background: "#0B1020", fontFamily: "'Plus Jakarta Sans', sans-serif",
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
            width: 9, height: 9, borderRadius: "50%", background: "#7C5CFF",
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

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public */}
            <Route path="/"                element={<Landing />} />
            <Route path="/login"           element={<Public><Login /></Public>} />
            <Route path="/register"        element={<Public><Register /></Public>} />
            <Route path="/forgot-password" element={<Public><ForgotPassword /></Public>} />

            {/* Student */}
            <Route path="/dashboard"    element={<Private><Dashboard /></Private>} />
            <Route path="/profile"      element={<Private><Profile /></Private>} />
            <Route path="/exam-select"  element={<Private><ExamSelect /></Private>} />
            <Route path="/exam"         element={<Private><Exam /></Private>} />
            <Route path="/results"      element={<Private><Results /></Private>} />
            <Route path="/history"      element={<Private><History /></Private>} />
            <Route path="/leaderboard"  element={<Private><Leaderboard /></Private>} />
            <Route path="/performance"  element={<Private><Performance /></Private>} />
            <Route path="/error-review" element={<Private><ErrorReview /></Private>} />
            <Route path="/upgrade"      element={<Private><Upgrade /></Private>} />

            {/* Arena */}
            <Route path="/arena"         element={<Private><Arena /></Private>} />
            <Route path="/arena/waiting" element={<Private><WaitingRoom /></Private>} />
            <Route path="/arena/match"   element={<Private><Match /></Private>} />
            <Route path="/arena/results" element={<Private><ArenaResults /></Private>} />

            {/* Phase 1 Innovations */}
            <Route path="/challenge"  element={<Private><DailyChallenge /></Private>} />
            <Route path="/predicted"  element={<Private><PredictedScore /></Private>} />
            <Route path="/badges"     element={<Private><Badges /></Private>} />
            <Route path="/resume"     element={<Private><ResumeExam /></Private>} />
            <Route path="/admission"  element={<Private><AdmissionChecker /></Private>} />

            {/* New Features */}
            <Route path="/videos"            element={<Private><VideoLibrary /></Private>} />
            <Route path="/missions"          element={<Private><Missions /></Private>} />
            <Route path="/spin"              element={<Private><SpinWheel /></Private>} />
            <Route path="/theme"             element={<Private><ThemeSettings /></Private>} />
            <Route path="/classroom"         element={<Private><ClassroomLobby /></Private>} />
            <Route path="/classroom/session" element={<Private><ClassroomSession /></Private>} />

            {/* Phase 2 Innovations */}
            <Route path="/personality"   element={<Private><PersonalityProfile /></Private>} />
            <Route path="/beat-yourself" element={<Private><BeatYourself /></Private>} />

            {/* Metaverse Features */}
            <Route path="/gems"     element={<Private><GemStore /></Private>} />
            <Route path="/spirits"  element={<Private><Spirits /></Private>} />
            <Route path="/skills"   element={<Private><Skills /></Private>} />
            <Route path="/vault"    element={<Private><KnowledgeVault /></Private>} />
            <Route path="/factions" element={<Private><Factions /></Private>} />

            {/* Parent */}
            <Route path="/parent" element={<ParentPortal />} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin"       element={<AdminGuard><AdminDashboard /></AdminGuard>} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}
