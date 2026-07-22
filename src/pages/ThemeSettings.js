import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme, THEMES, FONT_SIZES } from "../context/ThemeContext";

export default function ThemeSettings() {
  const nav = useNavigate();
  const { theme, mode, themeName, modeName, fontSize,
          setTheme, toggleMode, setFont } = useTheme();
  const [preview, setPreview] = useState(null); // hovered theme key

  const activeTheme = preview ? THEMES[preview] : theme;

  const C = {
    bg:     mode.bg     || "var(--bg)",
    card:   mode.surface || "var(--surface)",
    text:   mode.text   || "#FFFFFF",
    sub:    mode.textSub || "var(--text-sub)",
    muted:  mode.textMuted || "var(--text-muted)",
    border: mode.border || "var(--border)",
    shadow: mode.cardShadow || "var(--card-shadow)",
  };

  const lightThemes = Object.entries(THEMES).filter(([,t]) => t.category === "Light");
  const darkThemes  = Object.entries(THEMES).filter(([,t]) => t.category === "Dark");

  return (
    <div style={{ minHeight:"100dvh", background:C.bg, color:C.text,
      fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", paddingBottom:80 }}>

      {/* ── HEADER ─────────────────────────────────────────── */}
      <div style={{ background:`linear-gradient(135deg,${activeTheme.primary},${activeTheme.accent})`,
        padding:"16px 16px 20px",
        boxShadow:`0 4px 20px ${activeTheme.primary}40` }}>
        <div style={{ maxWidth:520, margin:"0 auto", display:"flex", alignItems:"center", gap:12 }}>
          <button onClick={() => nav(-1)} style={{ width:38, height:38, borderRadius:11,
            background:"rgba(255,255,255,0.2)", border:"none", color:"#fff",
            fontSize:18, cursor:"pointer", flexShrink:0,
            display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
          <div>
            <div style={{ fontWeight:900, fontSize:18, color:"#fff" }}>🎨 Appearance</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginTop:1 }}>
              {activeTheme.name} · {modeName === "dark" ? "Dark" : "Light"} Mode
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:520, margin:"0 auto", padding:"20px 14px" }}>

        {/* ── LIVE PREVIEW CARD ─────────────────────────────── */}
        <div style={{ background:C.card, borderRadius:20, padding:16,
          boxShadow:C.shadow, marginBottom:20,
          border:`1px solid ${C.border}` }}>
          <div style={{ fontSize:11, fontWeight:800, color:C.muted,
            letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>
            Live Preview
          </div>

          {/* Mini dashboard card */}
          <div style={{ background:`linear-gradient(135deg,${activeTheme.primary},${activeTheme.primaryDark})`,
            borderRadius:14, padding:"14px 14px 12px", marginBottom:10 }}>
            <div style={{ fontWeight:900, fontSize:15, color:"#fff" }}>Good day, Student 👋</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.8)", marginTop:3 }}>
              Ready to ace your JAMB exams?
            </div>
            <div style={{ display:"flex", gap:6, marginTop:10 }}>
              {["🔥 7 Streak","📝 24 Exams","📈 76% Avg"].map((s,i) => (
                <div key={i} style={{ background:"rgba(255,255,255,0.2)", borderRadius:8,
                  padding:"4px 8px", fontSize:10, color:"#fff", fontWeight:700 }}>{s}</div>
              ))}
            </div>
          </div>

          {/* Mini quick actions */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { icon:"📝", label:"Exam",    c:activeTheme.primary },
              { icon:"🤖", label:"AI Tutor",c:activeTheme.accent  },
              { icon:"🏆", label:"Arena",   c:activeTheme.success },
            ].map(a => (
              <div key={a.label} style={{ background:`${a.c}15`,
                border:`1px solid ${a.c}30`, borderRadius:12,
                padding:"10px 8px", textAlign:"center" }}>
                <div style={{ fontSize:20 }}>{a.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:a.c, marginTop:4 }}>{a.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── DARK / LIGHT TOGGLE ───────────────────────────── */}
        <div style={{ background:C.card, borderRadius:18, padding:"16px 18px",
          marginBottom:14, boxShadow:C.shadow, border:`1px solid ${C.border}`,
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:C.text }}>
              {modeName === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </div>
            <div style={{ fontSize:12, color:C.muted, marginTop:3 }}>
              {modeName === "dark"
                ? "Easy on the eyes at night"
                : "Clean, bright, and friendly"}
            </div>
          </div>
          <div onClick={toggleMode} style={{ width:54, height:30, borderRadius:15,
            background: modeName === "dark" ? theme.primary : "#CBD5E1",
            cursor:"pointer", position:"relative", transition:"background 0.3s",
            flexShrink:0 }}>
            <div style={{ position:"absolute", top:4,
              left: modeName === "dark" ? 28 : 4,
              width:22, height:22, borderRadius:"50%",
              background:"#fff", transition:"left 0.25s",
              boxShadow:"0 2px 6px rgba(0,0,0,0.25)" }} />
          </div>
        </div>

        {/* ── LIGHT THEMES ──────────────────────────────────── */}
        <div style={{ fontSize:11, fontWeight:800, color:C.muted,
          letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
          ☀️ Light Themes
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:18 }}>
          {lightThemes.map(([key, t]) => (
            <ThemeCard key={key} themeKey={key} t={t}
              active={themeName === key}
              onSelect={() => setTheme(key)}
              onHover={k => setPreview(k)}
              onLeave={() => setPreview(null)}
              C={C} />
          ))}
        </div>

        {/* ── DARK THEMES ───────────────────────────────────── */}
        <div style={{ fontSize:11, fontWeight:800, color:C.muted,
          letterSpacing:1, textTransform:"uppercase", marginBottom:10 }}>
          🌙 Dark Themes
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:20 }}>
          {darkThemes.map(([key, t]) => (
            <ThemeCard key={key} themeKey={key} t={t}
              active={themeName === key}
              onSelect={() => setTheme(key)}
              onHover={k => setPreview(k)}
              onLeave={() => setPreview(null)}
              C={C} />
          ))}
        </div>

        {/* ── FONT SIZE ─────────────────────────────────────── */}
        <div style={{ background:C.card, borderRadius:18, padding:"16px 18px",
          boxShadow:C.shadow, border:`1px solid ${C.border}`, marginBottom:14 }}>
          <div style={{ fontWeight:800, fontSize:15, color:C.text, marginBottom:4 }}>🔤 Text Size</div>
          <div style={{ fontSize:12, color:C.muted, marginBottom:14 }}>
            Adjust how large text appears across the app
          </div>
          <div style={{ display:"flex", gap:8 }}>
            {Object.entries(FONT_SIZES).map(([key, f]) => (
              <button key={key} onClick={() => setFont(key)} style={{
                flex:1, padding:"10px 4px", borderRadius:12,
                background: fontSize === key
                  ? `linear-gradient(135deg,${theme.primary},${theme.primaryDark})`
                  : C.bg,
                border: `2px solid ${fontSize === key ? theme.primary : C.border}`,
                color: fontSize === key ? "#fff" : C.sub,
                fontWeight:700, fontSize:[12,14,16][["small","medium","large"].indexOf(key)],
                cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s",
              }}>
                {f.name}
              </button>
            ))}
          </div>
        </div>

        {/* ── CURRENT SELECTION BADGE ───────────────────────── */}
        <div style={{ textAlign:"center", padding:"12px 0" }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10,
            background:`${theme.primary}12`, border:`1px solid ${theme.primary}30`,
            borderRadius:20, padding:"8px 18px" }}>
            <span style={{ fontSize:18 }}>{theme.icon}</span>
            <span style={{ color:theme.primary, fontWeight:700, fontSize:13 }}>
              {theme.name} · {modeName === "dark" ? "Dark" : "Light"}
            </span>
            <span style={{ fontSize:14 }}>✓</span>
          </div>
        </div>

      </div>
    </div>
  );
}

function ThemeCard({ themeKey, t, active, onSelect, onHover, onLeave, C }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => { setHovered(true);  onHover(themeKey); }}
      onMouseLeave={() => { setHovered(false); onLeave(); }}
      onTouchStart={() => onHover(themeKey)}
      onTouchEnd={() => onLeave()}
      style={{ background: active ? `${t.primary}12` : C.card,
        border: `2px solid ${active ? t.primary : hovered ? t.primary+"44" : C.border}`,
        borderRadius:16, padding:"14px 14px 12px", cursor:"pointer",
        boxShadow: active ? `0 4px 20px ${t.primary}33` : C.shadow,
        transition:"all 0.2s", position:"relative" }}>

      {active && (
        <div style={{ position:"absolute", top:10, right:10,
          width:22, height:22, borderRadius:"50%",
          background:`linear-gradient(135deg,${t.primary},${t.primaryDark})`,
          display:"flex", alignItems:"center", justifyContent:"center",
          color:"#fff", fontSize:12, fontWeight:900 }}>✓</div>
      )}

      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
        <span style={{ fontSize:22 }}>{t.icon}</span>
        <div style={{ fontWeight:800, fontSize:13, color:C.text }}>{t.name}</div>
      </div>

      {/* Gradient preview bar */}
      <div style={{ height:8, borderRadius:6, marginBottom:10,
        background:`linear-gradient(90deg,${t.primary},${t.accent},${t.success})` }} />

      {/* Color dots */}
      <div style={{ display:"flex", gap:6 }}>
        {[t.primary, t.primaryLight, t.accent, t.success, t.warning].map((c,i) => (
          <div key={i} style={{ width:18, height:18, borderRadius:6, background:c,
            boxShadow:`0 2px 6px ${c}44` }} />
        ))}
      </div>
    </div>
  );
}
