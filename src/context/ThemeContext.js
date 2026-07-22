import { createContext, useContext, useState, useEffect } from "react";

/* ────────────────────────────────────────────────────────────────
   SCHOLAR SYNDICATE — Design System
   Philosophy: Black base · White text · One accent · Minimal noise
   ──────────────────────────────────────────────────────────────── */

export const THEMES = {
  default: {
    name: "Scholar",   icon: "🎓", category: "Dark",
    primary:      "#7C5CFF",   // purple accent — used sparingly
    primaryDark:  "#5A3FCC",
    primaryLight: "#A98BFF",
    accent:       "#00D4AA",   // teal for success/CTA
    success:      "#22C55E",
    warning:      "#F59E0B",
    info:         "#7C5CFF",
    gradient:     "linear-gradient(135deg,#7C5CFF,#00D4AA)",
  },
  midnight: {
    name: "Midnight",  icon: "🌙", category: "Dark",
    primary:      "#3B82F6",
    primaryDark:  "#1D4ED8",
    primaryLight: "#93C5FD",
    accent:       "#06B6D4",
    success:      "#22C55E",
    warning:      "#F59E0B",
    info:         "#3B82F6",
    gradient:     "linear-gradient(135deg,#3B82F6,#06B6D4)",
  },
  green: {
    name: "Forest",    icon: "🌿", category: "Dark",
    primary:      "#22C55E",
    primaryDark:  "#16A34A",
    primaryLight: "#86EFAC",
    accent:       "#06B6D4",
    success:      "#22C55E",
    warning:      "#F59E0B",
    info:         "#8B5CF6",
    gradient:     "linear-gradient(135deg,#22C55E,#06B6D4)",
  },
  // FIX: Added proper light mode — was completely missing. BASE was dark-only.
  // ThemeSettings.js toggle now has a real effect.
  light: {
    name: "Daylight",  icon: "☀️", category: "Light",
    primary:      "#7C5CFF",
    primaryDark:  "#5A3FCC",
    primaryLight: "#A98BFF",
    accent:       "#00D4AA",
    success:      "#16A34A",
    warning:      "#D97706",
    info:         "#7C5CFF",
    gradient:     "linear-gradient(135deg,#7C5CFF,#00D4AA)",
  },
  light_blue: {
    name: "Sky",       icon: "🌤️", category: "Light",
    primary:      "#2563EB",
    primaryDark:  "#1D4ED8",
    primaryLight: "#93C5FD",
    accent:       "#0891B2",
    success:      "#16A34A",
    warning:      "#D97706",
    info:         "#2563EB",
    gradient:     "linear-gradient(135deg,#2563EB,#0891B2)",
  },
};

// Light mode base colours — separate from dark BASE
const LIGHT_BASE = {
  bg:           "#F8F9FC",
  surface:      "#FFFFFF",
  surfaceAlt:   "#F1F3F9",
  surfaceHover: "#E8ECF4",
  border:       "rgba(0,0,0,0.08)",
  borderStrong: "rgba(0,0,0,0.18)",
  text:         "#0F0F1A",
  textSub:      "#374151",
  textMuted:    "#6B7280",
  navBg:        "rgba(248,249,252,0.97)",
  topBarBg:     "#FFFFFF",
  cardShadow:   "0 1px 12px rgba(0,0,0,0.08)",
};

/* ── Single dark mode (no light mode confusion) ─────────────── */
const BASE = {
  bg:           "#0A0A0F",     // near-black
  surface:      "#13131A",     // slightly lifted
  surfaceAlt:   "#1C1C26",     // cards on cards
  surfaceHover: "#22222F",     // hover state
  border:       "rgba(255,255,255,0.08)",
  borderStrong: "rgba(255,255,255,0.15)",
  text:         "#FFFFFF",     // pure white primary text
  textSub:      "#D1D5DB",     // light grey secondary
  textMuted:    "#6B7280",     // muted grey - NOT blue, NOT purple
  navBg:        "rgba(10,10,15,0.96)",
  topBarBg:     "#0A0A0F",
  cardShadow:   "0 1px 12px rgba(0,0,0,0.6)",
};

export const FONT_SIZES = {
  small:  { name:"Small",  base:13, label:12, heading:16 },
  medium: { name:"Medium", base:15, label:13, heading:18 },
  large:  { name:"Large",  base:17, label:14, heading:21 },
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => localStorage.getItem("ss_theme") || "default");
  const [fontSize,  setFontSize]  = useState(() => localStorage.getItem("ss_font")  || "medium");

  const theme    = THEMES[themeName]    || THEMES.default;
  const fontConf = FONT_SIZES[fontSize] || FONT_SIZES.medium;

  useEffect(() => {
    const r = document.documentElement;

    // ── Fixed semantic tokens ──────────────────────────────────
    r.style.setProperty("--gold",         "#F59E0B");
    r.style.setProperty("--danger",       "#EF4444");
    r.style.setProperty("--success-color","#22C55E");

    // ── Theme accent ───────────────────────────────────────────
    r.style.setProperty("--primary",       theme.primary);
    r.style.setProperty("--primary-dark",  theme.primaryDark);
    r.style.setProperty("--primary-light", theme.primaryLight);
    r.style.setProperty("--accent",        theme.accent);
    r.style.setProperty("--success",       theme.success);
    r.style.setProperty("--warning",       theme.warning);
    r.style.setProperty("--info",          theme.info);
    r.style.setProperty("--gradient",      theme.gradient);

    // ── Base colours — FIX: now switches between dark BASE and LIGHT_BASE ───
    const isLight = theme.category === "Light";
    const activeBase = isLight ? LIGHT_BASE : BASE;
    r.style.setProperty("--bg",            activeBase.bg);
    r.style.setProperty("--surface",       activeBase.surface);
    r.style.setProperty("--surface-alt",   activeBase.surfaceAlt);
    r.style.setProperty("--surface-hover", activeBase.surfaceHover);
    r.style.setProperty("--border",        activeBase.border);
    r.style.setProperty("--border-strong", activeBase.borderStrong);
    r.style.setProperty("--text",          activeBase.text);
    r.style.setProperty("--text-sub",      activeBase.textSub);
    r.style.setProperty("--text-muted",    activeBase.textMuted);
    r.style.setProperty("--nav-bg",        activeBase.navBg);
    r.style.setProperty("--topbar-bg",     activeBase.topBarBg);
    r.style.setProperty("--card-shadow",   activeBase.cardShadow);
    // Set data-theme so CSS selectors can target light vs dark
    document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");

    // ── Legacy compat ──────────────────────────────────────────
    // BUGFIX: these three were hardcoded to BASE (the dark theme's own
    // colors), which defeats the entire point of a "light-surface-*" token —
    // it's meant to be a *fixed* safe color for text sitting on a light/white
    // card, used regardless of which theme is active. Wired to BASE.text
    // (white), any component using it for readability on a white card would
    // render white-on-white invisible text. Now correctly fixed to LIGHT_BASE.
    r.style.setProperty("--light-surface-bg",     LIGHT_BASE.surface);
    r.style.setProperty("--light-surface-border", LIGHT_BASE.border);
    r.style.setProperty("--light-surface-text",   LIGHT_BASE.text);
    r.style.setProperty("--purple",               theme.primary);
    r.style.setProperty("--purple-light",         `${theme.primary}22`);
    r.style.setProperty("--green",                theme.accent);

    // ── Font ───────────────────────────────────────────────────
    r.style.setProperty("--font-base",    `${fontConf.base}px`);
    r.style.setProperty("--font-label",   `${fontConf.label}px`);
    r.style.setProperty("--font-heading", `${fontConf.heading}px`);
    r.style.setProperty("--radius",       "12px");

    document.body.style.background = BASE.bg;
    document.body.style.color      = BASE.text;
    document.body.style.fontSize   = `${fontConf.base}px`;
  }, [theme, fontConf]);

  const setTheme = name => {
    setThemeName(name);
    localStorage.setItem("ss_theme", name);
  };

  // Keep toggleMode for legacy callers — no-op now (always dark)
  const toggleMode = () => {};
  const modeName   = "dark";
  const mode       = BASE;

  const setFont = name => {
    setFontSize(name);
    localStorage.setItem("ss_font", name);
  };

  return (
    <ThemeContext.Provider value={{
      theme, mode, fontConf,
      themeName, modeName, fontSize,
      setTheme, toggleMode, setFont,
      THEMES, MODES: { dark: BASE }, FONT_SIZES,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
}
