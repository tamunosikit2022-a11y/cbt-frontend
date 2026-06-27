import { createContext, useContext, useState, useEffect } from "react";

/* ── THEMES ─────────────────────────────────────────────────── */
export const THEMES = {
  scholar: {
    name: "Scholar Blue", icon: "💙", category: "Light",
    primary: "#6B5AED", primaryDark: "#2D5BE3", primaryLight: "#93B8FF",
    accent:  "#06B6D4", success: "#10B981", warning: "#F59E0B", info: "#8B5CF6",
    gradient: "linear-gradient(135deg,#4F7EF7,#06B6D4)",
  },
  purple: {
    name: "Royal Purple", icon: "💜", category: "Light",
    primary: "#7C3AED", primaryDark: "#5B21B6", primaryLight: "#C4B5FD",
    accent:  "#EC4899", success: "#10B981", warning: "#F59E0B", info: "#3B82F6",
    gradient: "linear-gradient(135deg,#7C3AED,#EC4899)",
  },
  forest: {
    name: "Forest", icon: "🌿", category: "Light",
    primary: "#059669", primaryDark: "#047857", primaryLight: "#6EE7B7",
    accent:  "#0EA5E9", success: "#84CC16", warning: "#F59E0B", info: "#6366F1",
    gradient: "linear-gradient(135deg,#059669,#0EA5E9)",
  },
  sunset: {
    name: "Sunset", icon: "🌅", category: "Light",
    primary: "#F97316", primaryDark: "#EA580C", primaryLight: "#FED7AA",
    accent:  "#EF4444", success: "#10B981", warning: "#EAB308", info: "#8B5CF6",
    gradient: "linear-gradient(135deg,#F97316,#EF4444)",
  },
  rose: {
    name: "Rose Gold", icon: "🌸", category: "Light",
    primary: "#E11D48", primaryDark: "#BE123C", primaryLight: "#FDA4AF",
    accent:  "#F97316", success: "#10B981", warning: "#EAB308", info: "#8B5CF6",
    gradient: "linear-gradient(135deg,#E11D48,#F97316)",
  },
  cosmic: {
    name: "Cosmic", icon: "🌌", category: "Dark",
    primary: "#6D28D9", primaryDark: "#4C1D95", primaryLight: "#C4B5FD",
    accent:  "#2563EB", success: "#10B981", warning: "#F59E0B", info: "#06B6D4",
    gradient: "linear-gradient(135deg,#6D28D9,#2563EB)",
  },
  midnight: {
    name: "Midnight", icon: "🌙", category: "Dark",
    primary: "#3B82F6", primaryDark: "#1D4ED8", primaryLight: "#93C5FD",
    accent:  "#8B5CF6", success: "#10B981", warning: "#F59E0B", info: "#06B6D4",
    gradient: "linear-gradient(135deg,#3B82F6,#8B5CF6)",
  },
  flame: {
    name: "Flame", icon: "🔥", category: "Dark",
    primary: "#EF4444", primaryDark: "#DC2626", primaryLight: "#FCA5A5",
    accent:  "#F97316", success: "#10B981", warning: "#EAB308", info: "#8B5CF6",
    gradient: "linear-gradient(135deg,#EF4444,#F97316)",
  },
};

/* ── MODES ──────────────────────────────────────────────────── */
export const MODES = {
  light: {
    bg:           "#0D0F1C",
    surface:      "#151929",
    surfaceAlt:   "#1C2240",
    border:       "rgba(107,90,237,0.2)",
    borderStrong: "rgba(79,126,247,0.3)",
    text:         "#FFFFFF",          // FIX: was invisible on dark bg
    textSub:      "#C8D3F5",
    textMuted:    "#8B99C7",
    navBg:        "rgba(13,15,28,0.97)",  // FIX: was #151929
    topBarBg:     "rgba(13,15,28,0.97)",  // FIX: was #151929
    cardShadow:   "0 2px 20px rgba(0,0,0,0.4)",
  },
  dark: {
    bg:           "#0A0F1E",
    surface:      "#111827",
    surfaceAlt:   "#1F2937",
    border:       "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.16)",
    text:         "#F1F5F9",          // FIX: was #a2b9cf — too dim
    textSub:      "#CBD5E1",          // FIX: was #98bbe6
    textMuted:    "#94A3B8",          // FIX: was #7392f8 (blue!)
    navBg:        "rgba(10,15,30,0.97)", // FIX: was #0353ff (bright blue!)
    topBarBg:     "#111827",
    cardShadow:   "0 2px 20px rgba(0,0,0,0.4)",
  },
};

/* ── FONT SIZES ─────────────────────────────────────────────── */
export const FONT_SIZES = {
  small:  { name:"Small",  base:13, label:12, heading:16 },
  medium: { name:"Medium", base:15, label:13, heading:18 },
  large:  { name:"Large",  base:17, label:14, heading:21 },
};

/* ── CONTEXT ────────────────────────────────────────────────── */
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => localStorage.getItem("ss_theme") || "scholar");
  const [modeName,  setModeName]  = useState(() => localStorage.getItem("ss_mode")  || "light");
  const [fontSize,  setFontSize]  = useState(() => localStorage.getItem("ss_font")  || "medium");

  const theme    = THEMES[themeName]    || THEMES.scholar;
  const mode     = MODES[modeName]      || MODES.light;
  const fontConf = FONT_SIZES[fontSize] || FONT_SIZES.medium;

  useEffect(() => {
    const root = document.documentElement;

    // Innovation PDF fixed tokens (always set regardless of theme)
    root.style.setProperty("--gold",          "#FFC857");
    root.style.setProperty("--danger",        "#FF5A5F");
    root.style.setProperty("--purple",        "#7C5CFF");
    root.style.setProperty("--purple-light",  "rgba(124,92,255,0.15)");
    root.style.setProperty("--green",         "#00D084");

    // Theme colours
    root.style.setProperty("--primary",       theme.primary);
    root.style.setProperty("--primary-dark",  theme.primaryDark);
    root.style.setProperty("--primary-light", theme.primaryLight);
    root.style.setProperty("--accent",        theme.accent);
    root.style.setProperty("--success",       theme.success);
    root.style.setProperty("--warning",       theme.warning);
    root.style.setProperty("--info",          theme.info);
    root.style.setProperty("--gradient",      theme.gradient);

    // Mode colours
    root.style.setProperty("--bg",            mode.bg);
    root.style.setProperty("--surface",       mode.surface);
    root.style.setProperty("--surface-alt",   mode.surfaceAlt);
    root.style.setProperty("--border",        mode.border);
    root.style.setProperty("--border-strong", mode.borderStrong);
    root.style.setProperty("--text",          mode.text);
    root.style.setProperty("--text-sub",      mode.textSub);
    root.style.setProperty("--text-muted",    mode.textMuted);
    root.style.setProperty("--nav-bg",        mode.navBg);
    root.style.setProperty("--topbar-bg",     mode.topBarBg);
    root.style.setProperty("--card-shadow",   mode.cardShadow);

    // light-surface helper class colours (used by legacy pages)
    root.style.setProperty("--light-surface-bg",     mode.surface);
    root.style.setProperty("--light-surface-border", mode.border);
    root.style.setProperty("--light-surface-text",   mode.text);

    // Font
    root.style.setProperty("--font-base",    `${fontConf.base}px`);
    root.style.setProperty("--font-label",   `${fontConf.label}px`);
    root.style.setProperty("--font-heading", `${fontConf.heading}px`);

    // Body
    document.body.style.background = mode.bg;
    document.body.style.color      = mode.text;
    document.body.style.fontSize   = `${fontConf.base}px`;
  }, [theme, mode, fontConf]);

  const setTheme = name => {
    setThemeName(name);
    localStorage.setItem("ss_theme", name);
    // Auto-switch mode based on theme category
    if (THEMES[name]?.category === "Dark" && modeName === "light") {
      setModeName("dark");
      localStorage.setItem("ss_mode", "dark");
    }
    if (THEMES[name]?.category === "Light" && modeName === "dark") {
      setModeName("light");
      localStorage.setItem("ss_mode", "light");
    }
  };

  const toggleMode = () => {
    const next = modeName === "light" ? "dark" : "light";
    setModeName(next);
    localStorage.setItem("ss_mode", next);
  };

  const setFont = name => {
    setFontSize(name);
    localStorage.setItem("ss_font", name);
  };

  return (
    <ThemeContext.Provider value={{
      theme, mode, fontConf,
      themeName, modeName, fontSize,
      setTheme, toggleMode, setFont,
      THEMES, MODES, FONT_SIZES,
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
