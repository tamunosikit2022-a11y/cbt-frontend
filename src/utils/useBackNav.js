import { useNavigate } from "react-router-dom";

/**
 * useBackNav — returns a function that goes to the ACTUAL previous
 * screen the user was on (real browser/app back), instead of always
 * dumping the user back to the Dashboard.
 *
 * Falls back to `fallback` (default "/dashboard") only when there is
 * genuinely no previous in-app screen to go back to — e.g. the user
 * opened this page directly from a deep link, a new tab, or a push
 * notification, so there's nothing behind it on the stack.
 *
 * Usage:
 *   const back = useBackNav();          // falls back to /dashboard
 *   const back = useBackNav("/skills"); // custom fallback
 *   <button onClick={back}>← Back</button>
 */
export default function useBackNav(fallback = "/dashboard") {
  const navigate = useNavigate();

  return () => {
    const idx = window.history.state?.idx;
    if (typeof idx === "number" && idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };
}
