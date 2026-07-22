import { useState, useEffect } from "react";
import PythonIDE from "./PythonIDE";
import ArduinoTab from "./ArduinoTab";
import { listProjects, loadProject } from "./liveIdeApi";
import ErrorBoundary from "../../../components/ErrorBoundary";

/**
 * LiveIDEPanel — the "Live IDE" section of Scholar Session.
 * Sits alongside the existing Live Class (board/chat/participants/voice)
 * panels but is functionally independent — it doesn't touch the classroom
 * socket at all, since code execution is entirely client-side.
 *
 * Used two ways:
 *  1. Embedded inside ClassroomSession.js when a teacher/student toggles to
 *     "Live IDE" during a live class.
 *  2. Standalone via LiveIDESolo.js for self-study outside of any session.
 */
export default function LiveIDEPanel({ project: initialProject, onProjectSaved, embedded, initialTab }) {
  const [tab, setTab] = useState(initialTab === "arduino" ? "arduino" : "python");
  const [project, setProject] = useState(initialProject);
  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Fetch projects when tab changes. The "arduino" tab actually spans two
  // kinds (sketches + circuit layouts, see ArduinoTab.js), so pull both and
  // let the dropdown show kind alongside title to disambiguate.
  useEffect(() => {
    const fetch = async () => {
      setLoadingProjects(true);
      try {
        if (tab === "arduino") {
          const [sketches, circuits] = await Promise.all([
            listProjects("arduino"),
            listProjects("circuit"),
          ]);
          setProjects([...sketches, ...circuits]);
        } else {
          const list = await listProjects(tab);
          setProjects(list);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetch();
  }, [tab]);

  const handleSelectProject = async (id) => {
    if (!id) {
      setProject(null);
      return;
    }
    try {
      const loaded = await loadProject(id);
      setProject(loaded);
    } catch (err) {
      console.error("Failed to load project:", err);
    }
  };

  const handleProjectSaved = (saved) => {
    setProject(saved);
    onProjectSaved?.(saved);
    // Refresh project list
    const fetch = async () => {
      try {
        const list = await listProjects(tab);
        setProjects(list);
      } catch (err) {
        console.error("Failed to refresh projects:", err);
      }
    };
    fetch();
  };

  return (
    <div style={{ ...st.wrap, height: embedded ? "100%" : "100vh" }}>
      <div style={st.topBar}>
        <div style={st.subTabs}>
          <button
            style={{ ...st.subTab, ...(tab === "python" ? st.subTabActive : {}) }}
            onClick={() => setTab("python")}
          >
            🐍 Python
          </button>
          <button
            style={{ ...st.subTab, ...(tab === "arduino" ? st.subTabActive : {}) }}
            onClick={() => setTab("arduino")}
          >
            🔌 Arduino/Circuits
          </button>
        </div>

        {projects.length > 0 && (
          <select
            style={st.projectSelect}
            onChange={(e) => handleSelectProject(e.target.value)}
            value={project?.id || ""}
          >
            <option value="">Select a project…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {tab === "arduino"
                  ? `${p.kind === "circuit" ? "🔧" : "💻"} ${p.title || "Untitled"}`
                  : (p.title || `Untitled (${p.kind})`)}
              </option>
            ))}
          </select>
        )}

        {loadingProjects && <span style={st.loadingSpinner}>Loading…</span>}
      </div>

      <div style={st.body}>
        <ErrorBoundary fallback="IDE encountered an error. Please refresh the page.">
          {tab === "python" && (
            <PythonIDE project={project} onProjectSaved={handleProjectSaved} />
          )}
          {tab === "arduino" && (
            <ArduinoTab project={project} onProjectSaved={handleProjectSaved} />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}

const st = {
  wrap:           { display: "flex", flexDirection: "column", background: "var(--surface)", overflow: "hidden" },
  topBar:         { display: "flex", gap: 12, padding: "6px 10px", background: "#1a1a2e", borderBottom: "1px solid #3d3d5c", flexShrink: 0, alignItems: "center", flexWrap: "wrap" },
  subTabs:        { display: "flex", background: "transparent", borderBottom: "none", gap: 0 },
  subTab:         { padding: "8px 12px", background: "none", border: "none", color: "#8b9cbd", fontWeight: 700, fontSize: 13, cursor: "pointer", borderBottom: "2px solid transparent" },
  subTabActive:   { color: "#fff", borderBottom: "2px solid #6c63ff", background: "#232342" },
  projectSelect:  { flex: "1 1 200px", minWidth: 120, background: "var(--surface)", border: "1px solid #3d3d5c", borderRadius: 6, color: "#fff", fontSize: 12, padding: "6px 8px", cursor: "pointer" },
  loadingSpinner: { fontSize: 11, color: "#a29bfe", fontStyle: "italic" },
  body:           { flex: 1, minHeight: 0 },
};
