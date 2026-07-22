import { useState, useRef, useCallback, useEffect } from "react";
import { getPyodide, runPython } from "./pyodideRunner";
import { saveProject } from "./liveIdeApi";

const DEFAULT_CODE = `# Write Python here and press Run ▶
print("Hello, Scholar!")

for i in range(1, 6):
    print(f"{i} squared is {i * i}")
`;

const STARTER_SNIPPETS = [
  { label: "Hello World", code: DEFAULT_CODE },
  {
    label: "Loops & Lists",
    code: `numbers = [4, 8, 15, 16, 23, 42]
total = 0
for n in numbers:
    total += n
print("Numbers:", numbers)
print("Sum:", total)
print("Average:", total / len(numbers))
`,
  },
  {
    label: "Functions",
    code: `def is_prime(n):
    if n < 2:
        return False
    for d in range(2, int(n ** 0.5) + 1):
        if n % d == 0:
            return False
    return True

primes = [n for n in range(2, 50) if is_prime(n)]
print("Primes under 50:", primes)
`,
  },
  {
    label: "NumPy",
    code: `import numpy as np

a = np.array([1, 2, 3, 4, 5])
print("Array:", a)
print("Mean:", a.mean())
print("Squared:", a ** 2)
`,
  },
  {
    label: "Matplotlib Plot",
    code: `import matplotlib.pyplot as plt

x = list(range(0, 11))
y = [v * v for v in x]

plt.plot(x, y, marker="o")
plt.title("y = x^2")
plt.xlabel("x")
plt.ylabel("y")
plt.show()
`,
  },
];

export default function PythonIDE({ project, onProjectSaved }) {
  const [code, setCode] = useState(project?.code || DEFAULT_CODE);
  const [output, setOutput] = useState([]);
  const [image, setImage] = useState(null);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState("Python runtime not loaded yet");
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [title, setTitle] = useState(project?.title || "Untitled script");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const pyodideRef = useRef(null);
  const projectIdRef = useRef(project?.id || null);
  const consoleBodyRef = useRef(null);

  // Sync state when project prop changes (e.g., user switches projects)
  useEffect(() => {
    if (project) {
      setCode(project.code || DEFAULT_CODE);
      setTitle(project.title || "Untitled script");
      projectIdRef.current = project.id || null;
      setHasUnsavedChanges(false);
    }
  }, [project?.id]);

  // Track unsaved changes whenever code or title changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [code, title]);

  // Warn before leaving if unsaved
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedChanges]);

  // Warm up Pyodide as soon as the tab mounts, so the first "Run" click
  // doesn't force the student to wait for the ~10MB runtime.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const pyodide = await getPyodide((s) => !cancelled && setStatus(s));
        if (cancelled) return;
        pyodideRef.current = pyodide;
        setReady(true);
        setStatus("Ready");
      } catch (err) {
        if (!cancelled) setStatus(`Failed to load Python runtime: ${err.message}`);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Auto-scroll console to bottom when output changes
  useEffect(() => {
    if (consoleBodyRef.current) {
      consoleBodyRef.current.scrollTop = consoleBodyRef.current.scrollHeight;
    }
  }, [output]);

  const handleRun = useCallback(async () => {
    if (!pyodideRef.current || running) return;
    setRunning(true);
    setOutput([]);
    setImage(null);
    setStatus("Running…");
    const result = await runPython(pyodideRef.current, code);
    setOutput(result.output);
    if (result.image) setImage(result.image);
    if (!result.ok) {
      setOutput((prev) => [...prev, { type: "stderr", text: result.error }]);
    }
    setStatus(result.ok ? "Finished" : "Error");
    setRunning(false);
  }, [code, running]);

  // Ctrl/Cmd+Enter to run — standard IDE shortcut
  const handleKeyDown = useCallback((e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleRun();
    }
    // Tab inserts spaces instead of moving focus, like a real editor
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart, end = el.selectionEnd;
      const next = code.slice(0, start) + "    " + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 4;
      });
    }
  }, [code, handleRun]);

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const saved = await saveProject({ 
        id: projectIdRef.current, 
        kind: "python", 
        board_type: null,  // Python projects don't have a board
        title, 
        code 
      });
      projectIdRef.current = saved.id;
      setHasUnsavedChanges(false);
      setSaveMsg("Saved ✓");
      onProjectSaved?.(saved);
    } catch (err) {
      setSaveMsg(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2500);
    }
  };

  const handleNew = () => {
    if (hasUnsavedChanges) {
      if (!window.confirm("You have unsaved changes. Start a new project anyway?")) return;
    }
    setCode(DEFAULT_CODE);
    setTitle("Untitled script");
    projectIdRef.current = null;  // Clear ID so next save = create new
    setHasUnsavedChanges(false);
    setSaveMsg("");
  };

  return (
    <div style={st.wrap}>
      <div style={st.toolbar}>
        <input
          style={st.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Script name"
        />
        <select
          style={st.snippetSelect}
          value=""
          onChange={(e) => {
            const snip = STARTER_SNIPPETS.find((s) => s.label === e.target.value);
            if (snip) setCode(snip.code);
          }}
        >
          <option value="" disabled>Snippets…</option>
          {STARTER_SNIPPETS.map((s) => (
            <option key={s.label} value={s.label}>{s.label}</option>
          ))}
        </select>
        <button 
          style={st.newBtn} 
          onClick={handleNew}
          title="Start a new script"
        >
          + New
        </button>
        <button 
          style={st.saveBtn} 
          onClick={handleSave} 
          disabled={saving}
          title="Save this script"
        >
          {saving ? "…" : "💾 Save"}
        </button>
        <button
          style={{ ...st.runBtn, opacity: ready && !running ? 1 : 0.6 }}
          onClick={handleRun}
          disabled={!ready || running}
          title="Run this code (Ctrl/Cmd+Enter)"
        >
          {running ? "⏳ Running…" : "▶ Run"}
        </button>
      </div>
      {saveMsg && <div style={st.saveMsg}>{saveMsg}</div>}

      <div style={st.editorWrap}>
        <textarea
          style={st.editor}
          value={code}
          spellCheck={false}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write Python here…"
        />
      </div>

      <div style={st.consoleWrap}>
        <div style={st.consoleHeader}>
          <span>Console</span>
          <span style={st.statusPill}>{status}</span>
        </div>
        <div ref={consoleBodyRef} style={st.consoleBody}>
          {!ready && !output.length && (
            <div style={st.consoleHint}>{status}</div>
          )}
          {ready && !output.length && !running && (
            <div style={st.consoleHint}>Press ▶ Run (or Ctrl/Cmd+Enter) to execute your code.</div>
          )}
          {output.map((line, i) => (
            <div key={i} style={{ color: line.type === "stderr" ? "#ff7675" : "#dfe6e9", whiteSpace: "pre-wrap", fontFamily: "monospace", fontSize: 13 }}>
              {line.text}
            </div>
          ))}
          {image && (
            <img src={`data:image/png;base64,${image}`} alt="matplotlib output" style={{ maxWidth: "100%", marginTop: 10, borderRadius: 8, background: "#fff" }} />
          )}
        </div>
      </div>
    </div>
  );
}

const st = {
  wrap:          { display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)" },
  toolbar:       { display: "flex", gap: 6, padding: "8px 10px", background: "#252540", borderBottom: "1px solid #3d3d5c", flexShrink: 0, flexWrap: "wrap", alignItems: "center" },
  titleInput:    { flex: "1 1 120px", minWidth: 90, background: "var(--surface)", border: "1px solid #3d3d5c", borderRadius: 8, color: "#fff", fontSize: 12, padding: "6px 8px" },
  snippetSelect: { background: "var(--surface)", border: "1px solid #3d3d5c", borderRadius: 8, color: "#fff", fontSize: 12, padding: "6px 6px" },
  newBtn:        { background: "#3d3d5c", color: "#fff", border: "none", borderRadius: 8, padding: "7px 10px", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  saveBtn:       { background: "#3d3d5c", color: "#fff", border: "none", borderRadius: 8, padding: "7px 10px", fontWeight: 700, fontSize: 12, cursor: "pointer" },
  runBtn:        { background: "#00b894", color: "#fff", border: "none", borderRadius: 8, padding: "7px 14px", fontWeight: 800, fontSize: 12, cursor: "pointer" },
  saveMsg:       { fontSize: 11, color: "#00d084", padding: "2px 10px", background: "#1a1a2e" },
  editorWrap:    { flex: "1 1 45%", minHeight: 0, borderBottom: "1px solid #3d3d5c" },
  editor:        { width: "100%", height: "100%", resize: "none", border: "none", outline: "none", background: "#1a1a2e", color: "#dfe6e9", fontFamily: "monospace", fontSize: 13, padding: 12, lineHeight: 1.5, boxSizing: "border-box" },
  consoleWrap:   { flex: "1 1 35%", minHeight: 0, display: "flex", flexDirection: "column", background: "#0f0f1e" },
  consoleHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 12px", fontSize: 11, fontWeight: 800, color: "#a29bfe", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #2a2a44", flexShrink: 0 },
  statusPill:    { background: "#252540", color: "#b2bec3", borderRadius: 10, padding: "2px 8px", fontSize: 10, textTransform: "none", fontWeight: 600, letterSpacing: 0 },
  consoleBody:   { flex: 1, overflowY: "auto", padding: "10px 12px" },
  consoleHint:   { color: "#636e72", fontSize: 12, fontStyle: "italic" },
};
