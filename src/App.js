import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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

// ── NEW FEATURES ──────────────────────────────────────────
const VideoLibrary     = lazy(() => import("./pages/VideoLibrary"));

// ── ADMIN ─────────────────────────────────────────────────
const AdminLogin       = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard   = lazy(() => import("./pages/admin/AdminDashboard"));

// ── LOADING FALLBACK ──────────────────────────────────────
function PageLoader() {
  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#f8f9fa", fontFamily: "sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>🎓</div>
        <p style={{ color: "#636e72" }}>Loading...</p>
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
  return !student ? children : <Navigate to="/dashboard" replace />;
}

function AdminGuard({ children }) {
  return localStorage.getItem("admin_token")
    ? children
    : <Navigate to="/admin/login" replace />;
}

// ── APP ───────────────────────────────────────────────────
export default function App() {
  return (
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
            <Route path="/videos"       element={<Private><VideoLibrary /></Private>} />

            {/* Phase 2 Innovations */}
            <Route path="/personality"   element={<Private><PersonalityProfile /></Private>} />
            <Route path="/beat-yourself" element={<Private><BeatYourself /></Private>} />

            {/* Admin */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin"       element={<AdminGuard><AdminDashboard /></AdminGuard>} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

