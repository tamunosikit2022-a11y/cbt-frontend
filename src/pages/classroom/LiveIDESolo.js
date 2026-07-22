import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import useBackNav from "../../utils/useBackNav";
import useMobile from "../../utils/useMobile";
import { useAuth } from "../../context/AuthContext";
import LiveIDEPanel from "./liveide/LiveIDEPanel";
import { listProjects, loadProject } from "./liveide/liveIdeApi";

/**
 * LiveIDESolo — self-study entry point for the Live IDE, reachable without
 * a teacher present (spec section 5, point 5). Wraps the same LiveIDEPanel
 * used inside a live Scholar Session, plus a lightweight "My Projects"
 * drawer for loading previously saved scripts.
 *
 * Layout: previously this page was hard-capped to a 480px-wide column via
 * `maxWidth: 480, margin: "0 auto"` on every screen size — including desktop
 * — which crushed the (desktop-oriented) breadboard/code/serial-monitor
 * layout of ElectronicsLab into a phone-sized strip, leaving huge empty
 * bars on either side and clipping most of the panels. Fixed by following
 * the same `useMobile`-gated responsive pattern already used in
 * Dashboard.js: full-bleed on desktop (≥768px), the original compact phone
 * layout below that.
 */

// Shared colour tokens (same values Dashboard.js uses) so this page matches
// the rest of the app's "Scholars Syndicate" desktop theme.
const C = {
  bg:     "var(--bg,#0A0A0F)",
  surf:   "var(--surface,#13131A)",
  surfA:  "var(--surface-alt,#1C1C26)",
  border: "var(--border,rgba(255,255,255,0.08))",
  text:   "var(--text,#FFFFFF)",
  sub:    "var(--text-sub,#D1D5DB)",
  muted:  "var(--text-muted,#6B7280)",
  p:      "var(--primary,#7C5CFF)",
  acc:    "var(--accent,#00D4AA)",
  gold:   "var(--gold,#F59E0B)",
};

export default function LiveIDESolo() {
  const back = useBackNav("/classroom");
  const { student } = useAuth();
  const { isMobile } = useMobile();
  // Lets ClassroomLobby's "Arduino/Circuits" shortcut open straight into the
  // Arduino tab instead of always landing on Python — visit /classroom/ide
  // with no param and it still defaults to Python as before.
  const location = useLocation();
  const initialTab = new URLSearchParams(location.search).get("tab") === "arduino" ? "arduino" : "python";
  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loadingList, setLoadingList] = useState(false);

  const refreshList = () => {
    setLoadingList(true);
    listProjects("python").then(setProjects).catch(() => {}).finally(() => setLoadingList(false));
  };

  useEffect(() => { refreshList(); }, []);

  const openProject = async (p) => {
    const full = await loadProject(p.id);
    setActiveProject(full);
    setDrawerOpen(false);
  };

  const handleSaved = (saved) => {
    setActiveProject(saved);
    refreshList();
  };

  const streak = student?.current_streak || 0;
  const gems = student?.gems ?? student?.gem_balance ?? 0;
  const firstName = (student?.name || student?.full_name || "Scholar").split(" ")[0];

  return (
    <div style={isMobile ? s.pageMobile : s.pageDesktop}>
      <div style={isMobile ? s.topBarMobile : s.topBarDesktop}>
        <button style={s.back} onClick={back} aria-label="Back">←</button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={s.logoMark}>🖥️</div>
          <div>
            <div style={s.title}>Live IDE</div>
            {!isMobile && <div style={s.sub}>Solo practice — no class session needed</div>}
          </div>
        </div>

        {isMobile && <div style={{ flex: 1 }} />}

        {!isMobile && (
          <div style={s.statPills}>
            <div style={s.statPill}><span>🔥</span>{streak}</div>
            <div style={s.statPill}><span>💎</span>{gems.toLocaleString()}</div>
            <div style={s.userPill}>
              <div style={s.avatar}>{firstName.charAt(0).toUpperCase()}</div>
              <span>{firstName}</span>
            </div>
          </div>
        )}

        <button style={s.projectsBtn} onClick={() => setDrawerOpen(true)}>📁 {isMobile ? "" : "My "}Projects</button>
      </div>

      <div style={s.body}>
        <LiveIDEPanel project={activeProject} onProjectSaved={handleSaved} embedded initialTab={initialTab} />
      </div>

      {drawerOpen && (
        <div style={s.drawerOverlay} onClick={() => setDrawerOpen(false)}>
          <div style={{ ...s.drawer, ...(isMobile ? {} : s.drawerDesktop) }} onClick={(e) => e.stopPropagation()}>
            <div style={s.drawerHeader}>
              <span>My Python Scripts</span>
              <button style={s.closeBtn} onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            {loadingList && <div style={s.emptyHint}>Loading…</div>}
            {!loadingList && projects.length === 0 && (
              <div style={s.emptyHint}>No saved scripts yet — write something in the editor and hit Save.</div>
            )}
            {projects.map((p) => (
              <button key={p.id} style={s.projectRow} onClick={() => openProject(p)}>
                <span style={{ fontWeight: 700 }}>{p.title}</span>
                <span style={s.projectDate}>{new Date(p.updated_at).toLocaleDateString()}</span>
              </button>
            ))}
            <button
              style={s.newBtn}
              onClick={() => { setActiveProject(null); setDrawerOpen(false); }}
            >
              + New Script
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  // Desktop: full viewport width, no artificial cap — lets ElectronicsLab's
  // multi-panel (palette / canvas / code+serial / properties) layout breathe.
  pageDesktop:   { width: "100%", height: "100vh", background: C.bg, fontFamily: "'Segoe UI',sans-serif", display: "flex", flexDirection: "column", position: "relative" },
  // Mobile: original phone-width column, unchanged behaviour.
  pageMobile:    { maxWidth: 480, margin: "0 auto", height: "100vh", background: "var(--surface)", fontFamily: "'Segoe UI',sans-serif", display: "flex", flexDirection: "column", position: "relative" },

  topBarDesktop: { background: C.surf, borderBottom: `1px solid ${C.border}`, padding: "12px 20px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 },
  topBarMobile:  { background: "#2d2d44", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },

  back:          { background: "none", border: "none", color: C.text, fontSize: 20, cursor: "pointer", padding: "0 4px" },
  logoMark:      { width: 32, height: 32, borderRadius: 9, background: `linear-gradient(135deg,${C.p},${C.acc})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, flexShrink: 0 },
  title:         { fontWeight: 800, fontSize: 15, color: C.text, lineHeight: 1.2 },
  sub:           { fontSize: 11.5, color: C.muted, marginTop: 2 },

  statPills:     { display: "flex", alignItems: "center", gap: 8, marginLeft: "auto" },
  statPill:      { display: "flex", alignItems: "center", gap: 6, background: C.surfA, border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 12px", fontSize: 12.5, fontWeight: 700, color: C.sub },
  userPill:      { display: "flex", alignItems: "center", gap: 8, background: C.surfA, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 12px 4px 4px", fontSize: 12.5, fontWeight: 700, color: C.text },
  avatar:        { width: 24, height: 24, borderRadius: "50%", background: `linear-gradient(135deg,${C.p},${C.gold})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" },

  projectsBtn:   { background: C.p, color: "#fff", border: "none", borderRadius: 9, padding: "8px 14px", fontWeight: 700, fontSize: 12.5, cursor: "pointer", flexShrink: 0, marginLeft: 8 },

  body:          { flex: 1, minHeight: 0 },

  drawerOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", justifyContent: "flex-end" },
  drawer:        { width: "82%", maxWidth: 320, height: "100%", background: "#1a1a2e", padding: 16, overflowY: "auto", boxShadow: "-4px 0 20px rgba(0,0,0,0.4)" },
  drawerDesktop: { width: 340, maxWidth: 340 },
  drawerHeader:  { display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", fontWeight: 800, fontSize: 15, marginBottom: 14 },
  closeBtn:      { background: "none", border: "none", color: "#b2bec3", fontSize: 18, cursor: "pointer" },
  emptyHint:     { color: "#636e72", fontSize: 12.5, lineHeight: 1.5 },
  projectRow:    { display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", background: "#252540", border: "none", borderRadius: 10, padding: "10px 12px", marginBottom: 8, color: "#fff", cursor: "pointer", textAlign: "left" },
  projectDate:   { fontSize: 10, color: "#8b9cbd", marginTop: 3 },
  newBtn:        { width: "100%", marginTop: 6, background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, padding: "10px 12px", fontWeight: 800, fontSize: 13, cursor: "pointer" },
};
