import { useNavigate } from "react-router-dom";
import { useTheme, THEMES } from "../context/ThemeContext";

export default function ThemeSettings() {
  const nav = useNavigate();
  const { theme, mode, themeName, modeName, setTheme, toggleMode } = useTheme();

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"'Segoe UI',sans-serif", maxWidth:480, margin:"0 auto" }}>

      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,var(--primary),var(--primary-dark))`, padding:"16px 18px", display:"flex", alignItems:"center", gap:12 }}>
        <button onClick={() => nav(-1)} style={{ background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:10, width:36, height:36, fontSize:18, cursor:"pointer" }}>←</button>
        <div>
          <div style={{ fontWeight:900, fontSize:18, color:"#fff" }}>🎨 Appearance</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)" }}>Customize your app theme</div>
        </div>
      </div>

      <div style={{ padding:"20px 16px 80px" }}>

        {/* Dark / Light Mode Toggle */}
        <div style={{ background:"var(--surface)", borderRadius:16, padding:"16px 18px", marginBottom:16, boxShadow:"var(--card-shadow)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:"var(--text)" }}>
              {modeName === "dark" ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </div>
            <div style={{ fontSize:12, color:"var(--text-sub)", marginTop:3 }}>
              {modeName === "dark" ? "Easy on the eyes at night" : "Clean and bright"}
            </div>
          </div>
          {/* Toggle switch */}
          <div onClick={toggleMode} style={{ width:52, height:28, borderRadius:14, background:modeName === "dark" ? "var(--primary)" : "var(--border-strong)", cursor:"pointer", position:"relative", transition:"background 0.3s" }}>
            <div style={{ position:"absolute", top:3, left: modeName === "dark" ? 26 : 3, width:22, height:22, borderRadius:"50%", background:"#fff", transition:"left 0.3s", boxShadow:"0 2px 6px rgba(0,0,0,0.2)" }} />
          </div>
        </div>

        {/* Color Themes */}
        <div style={{ marginBottom:8 }}>
          <div style={{ fontSize:11, fontWeight:800, color:"var(--text-muted)", letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>Colour Theme</div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            {Object.entries(THEMES).map(([key, t]) => (
              <div key={key}
                onClick={() => setTheme(key)}
                style={{
                  background: themeName === key ? t.primary + "18" : "var(--surface)",
                  border: `2px solid ${themeName === key ? t.primary : "var(--border)"}`,
                  borderRadius:14, padding:"14px 16px", cursor:"pointer",
                  boxShadow: themeName === key ? `0 4px 20px ${t.primary}33` : "var(--card-shadow)",
                  transition:"all 0.2s",
                }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                  <span style={{ fontSize:22 }}>{t.icon}</span>
                  <div style={{ fontWeight:800, fontSize:14, color:"var(--text)" }}>{t.name}</div>
                  {themeName === key && <span style={{ marginLeft:"auto", fontSize:16 }}>✓</span>}
                </div>
                {/* Color swatches */}
                <div style={{ display:"flex", gap:4 }}>
                  {[t.primary, t.primaryLight, t.accent, t.success].map((c, i) => (
                    <div key={i} style={{ width:20, height:20, borderRadius:6, background:c }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div style={{ marginTop:20 }}>
          <div style={{ fontSize:11, fontWeight:800, color:"var(--text-muted)", letterSpacing:1, textTransform:"uppercase", marginBottom:12 }}>Preview</div>
          <div style={{ background:"var(--surface)", borderRadius:16, padding:16, boxShadow:"var(--card-shadow)" }}>
            <div style={{ background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`, borderRadius:12, padding:"16px 14px", marginBottom:12 }}>
              <div style={{ fontWeight:900, fontSize:16, color:"#fff" }}>Good day, Student 👋</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,0.8)", marginTop:4 }}>Ready to ace your exams?</div>
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                {["🔥 7 Streak", "📝 24 Exams", "📈 76%"].map((s, i) => (
                  <div key={i} style={{ background:"rgba(255,255,255,0.2)", borderRadius:8, padding:"4px 10px", fontSize:11, color:"#fff", fontWeight:700 }}>{s}</div>
                ))}
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
              <div style={{ background:`linear-gradient(135deg,${theme.primary},${theme.primaryDark})`, borderRadius:10, padding:"12px 10px" }}>
                <div style={{ fontSize:18 }}>📘</div>
                <div style={{ fontWeight:800, fontSize:13, color:"#fff", marginTop:4 }}>JAMB</div>
              </div>
              <div style={{ background:`linear-gradient(135deg,${theme.success},${theme.info})`, borderRadius:10, padding:"12px 10px" }}>
                <div style={{ fontSize:18 }}>🏫</div>
                <div style={{ fontWeight:800, fontSize:13, color:"#fff", marginTop:4 }}>Post-UTME</div>
              </div>
            </div>
          </div>
        </div>

        {/* Font Size */}
        <div style={{ background:"var(--surface)", borderRadius:16, padding:"16px 18px", marginTop:16, boxShadow:"var(--card-shadow)" }}>
          <div style={{ fontWeight:800, fontSize:15, color:"var(--text)", marginBottom:4 }}>🔤 Text Size</div>
          <div style={{ fontSize:12, color:"var(--text-sub)", marginBottom:12 }}>Coming soon — adjustable font size</div>
          <div style={{ display:"flex", gap:8 }}>
            {["Small", "Medium", "Large"].map((s, i) => (
              <div key={i} style={{ flex:1, padding:"8px 0", background: i === 1 ? "var(--primary)" : "var(--surface-alt)", border:`2px solid ${i === 1 ? "var(--primary)" : "var(--border)"}`, borderRadius:8, textAlign:"center", fontSize:[11,13,15][i], fontWeight: i === 1 ? 800 : 500, color: i === 1 ? "#fff" : "var(--text-sub)", cursor:"pointer" }}>
                {s}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
