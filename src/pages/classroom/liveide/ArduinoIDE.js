import { useState, useRef, useCallback, useEffect } from "react";
import { compileSketch } from "./arduinoApi";
import { saveProject } from "./liveIdeApi";
import { AVREmulator } from "./avrEmulator";
import { BOARDS, boardMeta, STARTER_SKETCH } from "./boardCatalog";

// Only the Uno/Nano's ATmega328P port map is actually emulated accurately
// today (see avrEmulator.js header). Mega/Leonardo still compile, but the
// live pin/LED simulation is approximate — we say so in the UI rather than
// pretend otherwise.
const ACCURATE_EMULATION_BOARDS = ["arduino_uno", "arduino_nano"];

export default function ArduinoIDE({ project, onProjectSaved }) {
  const [code, setCode] = useState(project?.code || STARTER_SKETCH);
  const [board, setBoard] = useState(project?.board_type || "arduino_uno");
  const [projectId, setProjectId] = useState(project?.id || null);
  const [title, setTitle] = useState(project?.title || "Untitled sketch");
  const [status, setStatus] = useState("idle"); // idle | compiling | running | error
  const [errors, setErrors] = useState(null);
  const [serialLines, setSerialLines] = useState([]);
  const [ledOn, setLedOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const emulatorRef = useRef(null);
  const serialBoxRef = useRef(null);
  const serialBufferRef = useRef("");

  useEffect(() => {
    emulatorRef.current = new AVREmulator({
      onSerial: (ch) => {
        serialBufferRef.current += ch;
        if (ch === "\n" || serialBufferRef.current.length > 200) {
          const line = serialBufferRef.current;
          serialBufferRef.current = "";
          setSerialLines((prev) => [...prev.slice(-499), line]);
        }
      },
      onPinChange: ({ value }) => {
        // Port B bit 5 == digital pin 13 (LED_BUILTIN) on the Uno/Nano.
        if (value != null) setLedOn(Boolean(value & (1 << 5)));
      },
      onHalt: (msg) => {
        setStatus("error");
        setErrors(`Emulator stopped: ${msg}`);
      },
    });
    return () => emulatorRef.current?.stop();
  }, []);

  useEffect(() => {
    if (serialBoxRef.current) {
      serialBoxRef.current.scrollTop = serialBoxRef.current.scrollHeight;
    }
  }, [serialLines]);

  // Warn on unsaved changes, matching PythonIDE.js's convention.
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const handleCompileAndRun = useCallback(async () => {
    setStatus("compiling");
    setErrors(null);
    setSerialLines([]);
    setLedOn(false);
    emulatorRef.current?.stop();

    try {
      const result = await compileSketch(code, board);
      if (!result.success) {
        setStatus("error");
        setErrors(result.errors || "Compile failed.");
        return;
      }
      emulatorRef.current.load(result.hex);
      emulatorRef.current.start();
      setStatus("running");
    } catch (err) {
      setStatus("error");
      const serverMsg = err?.response?.data?.error;
      setErrors(
        serverMsg ||
          "Couldn't reach the compiler. Check your connection and try again."
      );
    }
  }, [code, board]);

  const handleStop = useCallback(() => {
    emulatorRef.current?.stop();
    setStatus("idle");
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const saved = await saveProject({
        id: projectId,
        kind: "arduino",
        title,
        code,
        board_type: board,
      });
      setProjectId(saved.id);
      setDirty(false);
      onProjectSaved?.(saved);
    } catch {
      setErrors("Could not save your sketch. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [projectId, title, code, board, onProjectSaved]);

  const handleNew = useCallback(() => {
    if (dirty && !window.confirm("Discard unsaved changes and start a new sketch?")) return;
    emulatorRef.current?.stop();
    setProjectId(null);
    setTitle("Untitled sketch");
    setCode(STARTER_SKETCH);
    setStatus("idle");
    setErrors(null);
    setSerialLines([]);
    setDirty(false);
  }, [dirty]);

  const meta = boardMeta(board);
  const accurate = ACCURATE_EMULATION_BOARDS.includes(board);

  return (
    <div style={st.wrap}>
      <div style={st.toolbar}>
        <input
          style={st.titleInput}
          value={title}
          onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
        />
        <select
          style={st.select}
          value={board}
          onChange={(e) => { setBoard(e.target.value); setDirty(true); }}
        >
          {BOARDS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        <button style={st.btnGhost} onClick={handleNew}>+ New</button>
        <button style={st.btnGhost} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "💾 Save"}
        </button>
        {status === "running" ? (
          <button style={st.btnStop} onClick={handleStop}>⏹ Stop</button>
        ) : (
          <button
            style={st.btnRun}
            onClick={handleCompileAndRun}
            disabled={status === "compiling"}
          >
            {status === "compiling" ? "Compiling…" : "▶ Compile & Run"}
          </button>
        )}
      </div>

      {!accurate && (
        <div style={st.warnBanner}>
          ⚠️ {meta.label} compiles correctly, but the live pin/LED simulation
          below is only accurate for Uno/Nano right now — treat serial output
          as reliable, but the LED indicator on other boards is approximate.
        </div>
      )}

      <div style={st.body}>
        <textarea
          style={st.editor}
          spellCheck={false}
          value={code}
          onChange={(e) => { setCode(e.target.value); setDirty(true); }}
        />
        <div style={st.sidePanel}>
          <div style={st.ledCard}>
            <div style={{ ...st.ledDot, background: ledOn ? "#00e676" : "#3d3d5c", boxShadow: ledOn ? "0 0 12px #00e676" : "none" }} />
            <div style={st.ledLabel}>LED_BUILTIN (pin 13)</div>
          </div>
          <div style={st.serialHeader}>Serial Monitor</div>
          <div style={st.serial} ref={serialBoxRef}>
            {serialLines.length === 0 && status !== "running" && (
              <div style={st.serialEmpty}>Compile & run to see Serial.print() output here.</div>
            )}
            {serialLines.map((l, i) => (
              <div key={i} style={st.serialLine}>{l}</div>
            ))}
          </div>
        </div>
      </div>

      {errors && <div style={st.errBox}>{errors}</div>}
    </div>
  );
}

const st = {
  wrap:        { display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)" },
  toolbar:     { display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", background: "#1a1a2e", borderBottom: "1px solid #3d3d5c", flexShrink: 0, flexWrap: "wrap" },
  titleInput:  { flex: 1, minWidth: 100, background: "#232342", border: "1px solid #3d3d5c", borderRadius: 8, color: "#fff", fontSize: 12.5, padding: "6px 10px", fontWeight: 700 },
  select:      { background: "#232342", border: "1px solid #3d3d5c", borderRadius: 8, color: "#fff", fontSize: 12, padding: "6px 8px" },
  btnGhost:    { background: "#252540", border: "1px solid #3d3d5c", borderRadius: 8, color: "#b2bec3", fontSize: 12, fontWeight: 700, padding: "6px 10px", cursor: "pointer" },
  btnRun:      { background: "#00b894", border: "none", borderRadius: 8, color: "#fff", fontSize: 12.5, fontWeight: 800, padding: "7px 14px", cursor: "pointer" },
  btnStop:     { background: "#d63031", border: "none", borderRadius: 8, color: "#fff", fontSize: 12.5, fontWeight: 800, padding: "7px 14px", cursor: "pointer" },
  warnBanner:  { background: "#3d3320", color: "#ffd966", fontSize: 11.5, padding: "8px 12px", borderBottom: "1px solid #3d3d5c", lineHeight: 1.4 },
  body:        { display: "flex", flex: 1, minHeight: 0 },
  editor:      { flex: 2, background: "#151525", color: "#e0e0e0", border: "none", outline: "none", fontFamily: "monospace", fontSize: 13, padding: 14, resize: "none", lineHeight: 1.5 },
  sidePanel:   { flex: 1, minWidth: 220, display: "flex", flexDirection: "column", borderLeft: "1px solid #3d3d5c", background: "#1a1a2e" },
  ledCard:     { display: "flex", alignItems: "center", gap: 10, padding: 14, borderBottom: "1px solid #3d3d5c" },
  ledDot:      { width: 20, height: 20, borderRadius: "50%", transition: "all 0.15s", flexShrink: 0 },
  ledLabel:    { color: "#b2bec3", fontSize: 12, fontWeight: 600 },
  serialHeader:{ color: "#8b9cbd", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, padding: "10px 14px 4px" },
  serial:      { flex: 1, overflowY: "auto", padding: "0 14px 14px", fontFamily: "monospace", fontSize: 12, color: "#00e676" },
  serialEmpty: { color: "#5a6478", fontSize: 11.5, fontStyle: "italic" },
  serialLine:  { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  errBox:      { background: "#3d1f1f", color: "#ff7675", fontSize: 12, padding: "10px 14px", borderTop: "1px solid #5a2a2a", fontFamily: "monospace", whiteSpace: "pre-wrap", maxHeight: 140, overflowY: "auto" },
};
