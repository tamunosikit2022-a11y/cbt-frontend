import { createContext, useContext, useState, useEffect } from "react";

// ── THEME DEFINITIONS ─────────────────────────────────────
export const THEMES = {
  purple: {
    name: "Purple",
    icon: "💜",
    primary:     "#6c63ff",
    primaryDark: "#4834d4",
    primaryLight:"#a29bfe",
    accent:      "#e17055",
    success:     "#00b894",
    warning:     "#fdcb6e",
    info:        "#0984e3",
  },
  green: {
    name: "Forest",
    icon: "🌿",
    primary:     "#00b894",
    primaryDark: "#00896e",
    primaryLight:"#55efc4",
    accent:      "#fd79a8",
    success:     "#6c5ce7",
    warning:     "#fdcb6e",
    info:        "#0984e3",
  },
  blue: {
    name: "Ocean",
    icon: "🌊",
    primary:     "#0984e3",
    primaryDark: "#0762ab",
    primaryLight:"#74b9ff",
    accent:      "#e17055",
    success:     "#00b894",
    warning:     "#fdcb6e",
    info:        "#6c63ff",
  },
  orange: {
    name: "Sunset",
    icon: "🌅",
    primary:     "#e17055",
    primaryDark: "#c0392b",
    primaryLight:"#fab1a0",
    accent:      "#6c63ff",
    success:     "#00b894",
    warning:     "#fdcb6e",
    info:        "#0984e3",
  },
  dark: {
    name: "Dark",
    icon: "🌙",
    primary:     "#a29bfe",
    primaryDark: "#6c63ff",
    primaryLight:"#d4d0ff",
    accent:      "#fd79a8",
    success:     "#55efc4",
    warning:     "#fdcb6e",
    info:        "#74b9ff",
  },
};

// ── MODES ─────────────────────────────────────────────────
export const MODES = {
  light: {
    bg:          "#f4f6fb",
    surface:     "#ffffff",
    surfaceAlt:  "#f8f9fa",
    border:      "#f0f0f0",
    borderStrong:"#dfe6e9",
    text:        "#2d3436",
    textSub:     "#636e72",
    textMuted:   "#b2bec3",
    navBg:       "#ffffff",
    topBarBg:    "#ffffff",
    cardShadow:  "0 2px 12px rgba(0,0,0,0.07)",
  },
  dark: {
    bg:          "#0f0f1a",
    surface:     "#1a1a2e",
    surfaceAlt:  "#16213e",
    border:      "#2d2d44",
    borderStrong:"#3d3d5c",
    text:        "#e8e8f0",
    textSub:     "#9999bb",
    textMuted:   "#5a5a7a",
    navBg:       "#1a1a2e",
    topBarBg:    "#1a1a2e",
    cardShadow:  "0 2px 12px rgba(0,0,0,0.4)",
  },
};

// ── CONTEXT ───────────────────────────────────────────────
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() =>
    localStorage.getItem("scholars_theme") || "purple"
  );
  const [modeName, setModeName] = useState(() =>
    localStorage.getItem("scholars_mode") || "light"
  );

  const theme = THEMES[themeName] || THEMES.purple;
  const mode  = MODES[modeName]  || MODES.light;

  // Apply CSS variables to :root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--primary",      theme.primary);
    root.style.setProperty("--primary-dark", theme.primaryDark);
    root.style.setProperty("--primary-light",theme.primaryLight);
    root.style.setProperty("--accent",       theme.accent);
    root.style.setProperty("--success",      theme.success);
    root.style.setProperty("--warning",      theme.warning);
    root.style.setProperty("--info",         theme.info);
    root.style.setProperty("--bg",           mode.bg);
    root.style.setProperty("--surface",      mode.surface);
    root.style.setProperty("--surface-alt",  mode.surfaceAlt);
    root.style.setProperty("--border",       mode.border);
    root.style.setProperty("--border-strong",mode.borderStrong);
    root.style.setProperty("--text",         mode.text);
    root.style.setProperty("--text-sub",     mode.textSub);
    root.style.setProperty("--text-muted",   mode.textMuted);
    root.style.setProperty("--nav-bg",       mode.navBg);
    root.style.setProperty("--topbar-bg",    mode.topBarBg);
    root.style.setProperty("--card-shadow",  mode.cardShadow);

    // Dark mode body background
    document.body.style.background = mode.bg;
    document.body.style.color = mode.text;
  }, [theme, mode]);

  const setTheme = (name) => {
    setThemeName(name);
    localStorage.setItem("scholars_theme", name);
  };

  const toggleMode = () => {
    const next = modeName === "light" ? "dark" : "light";
    setModeName(next);
    localStorage.setItem("scholars_mode", next);
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, themeName, modeName, setTheme, toggleMode, THEMES, MODES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
