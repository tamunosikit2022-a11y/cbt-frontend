import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * FloatingNav
 * ──────────────────────────────────────────────────────────────
 * A single, always-available way to get back to the Dashboard, no
 * matter how deep the user is in a feature (Arena, Vault, Study
 * Planner, etc). Rendered once in App.js so every route gets it for
 * free — no need to touch each of the 60+ page files individually.
 *
 * It stays out of the way of screens that already have their own
 * navigation (Dashboard's bottom nav, the marketing Landing page,
 * auth screens, the Admin panel) and of screens where an accidental
 * tap could cost the user progress (a live exam or an active Arena
 * match) — on those it collapses to a small "..." tap-to-confirm
 * pill instead of a one-tap jump.
 */
const HIDE_ON = ["/", "/login", "/register", "/forgot-password", "/dashboard"];
const HIDE_PREFIX = ["/admin", "/parent-access", "/verify-email"];
// FIX: this list only covered `/exam` and `/arena/match`, so the floating
// button stayed pinned bottom-right (its default spot) on every OTHER
// quiz-taking screen — Daily Challenge, Weakness-mode practice, and the
// AI Questions reviewer all have their own Next/Submit button sitting in
// that same bottom-right corner, so the floating nav was sitting directly
// on top of it there too. Every page in the app with its own in-flow
// Next/Submit control belongs in this list.
const CONFIRM_ON = ["/exam", "/arena/match", "/challenge", "/weakness", "/ai-questions"];
// FIX: AI Tutor has its own Send button (➤) pinned to the bottom-right of its
// chat input bar. The floating home button (also bottom-right, higher
// z-index) was sitting directly on top of it, so students on mobile
// sometimes tapped "go home" instead of Send, or couldn't reach Send at
// all. Leaving a chat doesn't lose progress the way leaving an active exam
// does, so this page only needs repositioning — not the tap-to-confirm
// behaviour. Add any other page here whose own UI has a bottom-right
// control but doesn't need a leave confirmation.
const REPOSITION_ONLY_ON = ["/ai-tutor"];

export default function FloatingNav() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const { student } = useAuth();
  const [confirming, setConfirming] = useState(false);

  if (!student) return null;
  if (HIDE_ON.includes(pathname)) return null;
  if (HIDE_PREFIX.some(p => pathname.startsWith(p))) return null;

  const needsConfirm = CONFIRM_ON.some(p => pathname.startsWith(p));
  const repositionOnly = REPOSITION_ONLY_ON.some(p => pathname.startsWith(p));
  const movedUp = needsConfirm || repositionOnly;

  const goHome = () => {
    if (needsConfirm && !confirming) { setConfirming(true); return; }
    nav("/dashboard");
  };

  // FIX: on exam / arena-match screens there's always a primary action button
  // (Next / Submit Exam / Attack, etc.) pinned to the bottom-right of the
  // screen's own sticky nav bar. The floating home button used to sit in
  // that exact same corner with a higher z-index, so it physically covered
  // the Submit/Next button and made it hard to tap reliably mid-exam. On
  // those screens the button now moves to the top-right, well clear of any
  // in-exam controls; everywhere else it stays bottom-right as before.
  const positionStyle = movedUp
    ? {
        top: "calc(14px + env(safe-area-inset-top,0px))",
        right: "calc(14px + env(safe-area-inset-right,0px))",
      }
    : {
        bottom: "calc(14px + env(safe-area-inset-bottom,0px))",
        right: "calc(14px + env(safe-area-inset-right,0px))",
      };

  return (
    <button
      onClick={goHome}
      onBlur={() => setConfirming(false)}
      aria-label="Go to Dashboard"
      style={{
        position: "fixed",
        ...positionStyle,
        zIndex: 150,
        display: "flex",
        alignItems: "center",
        gap: 6,
        border: "none",
        cursor: "pointer",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
        borderRadius: 999,
        padding: confirming ? "10px 16px" : "0",
        width: confirming ? "auto" : 46,
        height: 46,
        justifyContent: "center",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontWeight: 800,
        fontSize: confirming ? 12.5 : 19,
        color: "#fff",
        background: confirming
          ? "linear-gradient(135deg,#EF4444,#F59E0B)"
          : "linear-gradient(135deg,#7C5CFF,#5B8CFF)",
        boxShadow: "0 6px 20px rgba(124,92,255,0.45)",
        transition: "width .15s ease, padding .15s ease, background .15s ease",
      }}
    >
      {confirming ? "Leave & go home?" : "🏠"}
    </button>
  );
}
