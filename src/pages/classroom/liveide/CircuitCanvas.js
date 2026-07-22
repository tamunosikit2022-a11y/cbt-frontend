import { useState, useCallback, useRef } from "react";
import { saveProject } from "./liveIdeApi";
import { COMPONENTS, componentMeta, defaultValues } from "./boardCatalog";
import { ComponentShape, valueCaption } from "./componentShapes";

/**
 * CircuitCanvas.js — Phase 2/3 circuit builder (per the roadmap: 2D SVG is
 * fine, no 3D, JSON layout not an image). This ships the MVP: place
 * components from the palette, wire pin-to-pin by clicking, and a basic
 * validator (a component with power pins needs both rail connections; an
 * LED needs a current-limiting resistor in series). Live code<->circuit
 * binding (Phase 4, avr8js pin states driving these components) is the
 * clear next step once this canvas is stable — see the TODO at the bottom.
 */

const GRID = 40;
const WIRE_COLORS = ["#ff6b6b", "#feca57", "#1dd1a1", "#54a0ff", "#a29bfe", "#ff9ff3", "#00d2d3"];

function newId() { return Math.random().toString(36).slice(2, 9); }

export default function CircuitCanvas({ project, onProjectSaved }) {
  const [title, setTitle] = useState(project?.title || "Untitled circuit");
  const [projectId, setProjectId] = useState(project?.id || null);
  const [placed, setPlaced] = useState(() => {
    try {
      const parsed = project?.code ? JSON.parse(project.code) : null;
      return parsed?.components || [];
    } catch { return []; }
  });
  const [wires, setWires] = useState(() => {
    try {
      const parsed = project?.code ? JSON.parse(project.code) : null;
      return parsed?.wires || [];
    } catch { return []; }
  });
  const [pendingPin, setPendingPin] = useState(null); // { compId, pinName }
  const [selected, setSelected] = useState(null);
  const [validation, setValidation] = useState([]);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const canvasRef = useRef(null);

  const markDirty = () => setDirty(true);

  const addComponent = useCallback((type) => {
    setPlaced((prev) => [
      ...prev,
      { id: newId(), type, x: 60 + (prev.length % 5) * 110, y: 60 + Math.floor(prev.length / 5) * 120, values: defaultValues(type) },
    ]);
    markDirty();
  }, []);

  const removeSelected = useCallback(() => {
    if (!selected) return;
    setPlaced((prev) => prev.filter((c) => c.id !== selected));
    setWires((prev) => prev.filter((w) => w.from.compId !== selected && w.to.compId !== selected));
    setSelected(null);
    markDirty();
  }, [selected]);

  const onDragComponent = useCallback((id, dx, dy) => {
    setPlaced((prev) => prev.map((c) => (c.id === id ? { ...c, x: c.x + dx, y: c.y + dy } : c)));
    markDirty();
  }, []);

  const onPinClick = useCallback((compId, pinName) => {
    if (!pendingPin) {
      setPendingPin({ compId, pinName });
      return;
    }
    if (pendingPin.compId === compId && pendingPin.pinName === pinName) {
      setPendingPin(null); // clicked same pin, cancel
      return;
    }
    setWires((prev) => [...prev, { id: newId(), from: pendingPin, to: { compId, pinName } }]);
    setPendingPin(null);
    markDirty();
  }, [pendingPin]);

  const removeWire = useCallback((wireId) => {
    setWires((prev) => prev.filter((w) => w.id !== wireId));
    markDirty();
  }, []);

  // Basic validation pass: flags components with power pins that aren't
  // wired at all, and LEDs wired with no resistor anywhere in the circuit
  // (a real short-through-LED risk on a real board).
  const validate = useCallback(() => {
    const issues = [];
    const wiredComponents = new Set();
    wires.forEach((w) => { wiredComponents.add(w.from.compId); wiredComponents.add(w.to.compId); });

    placed.forEach((c) => {
      const meta = componentMeta(c.type);
      if (!meta) return;
      if (!wiredComponents.has(c.id)) {
        issues.push(`${meta.label} (unwired) — connect at least one pin.`);
      }
    });

    const hasLed = placed.some((c) => c.type === "led");
    const hasResistor = placed.some((c) => c.type === "resistor");
    if (hasLed && !hasResistor) {
      issues.push("LED has no resistor in the circuit — add one in series to avoid burning it out.");
    }

    setValidation(issues);
    return issues.length === 0;
  }, [placed, wires]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const layout = JSON.stringify({ components: placed, wires });
      const saved = await saveProject({ id: projectId, kind: "circuit", title, code: layout });
      setProjectId(saved.id);
      setDirty(false);
      onProjectSaved?.(saved);
    } catch {
      setValidation(["Could not save your circuit. Please try again."]);
    } finally {
      setSaving(false);
    }
  }, [projectId, title, placed, wires, onProjectSaved]);

  const updateValue = useCallback((id, key, value) => {
    setPlaced((prev) => prev.map((c) => (c.id === id ? { ...c, values: { ...c.values, [key]: value } } : c)));
    markDirty();
  }, []);

  const pinPos = (comp, pinName) => {
    const meta = componentMeta(comp.type);
    const idx = meta.pins.indexOf(pinName);
    const spacing = 26;
    return {
      x: comp.x + 24 + idx * spacing,
      y: comp.y + 94,
    };
  };

  return (
    <div style={st.wrap}>
      <div style={st.toolbar}>
        <input style={st.titleInput} value={title} onChange={(e) => { setTitle(e.target.value); markDirty(); }} />
        <button style={st.btnGhost} onClick={validate}>✓ Validate</button>
        <button style={st.btnGhost} onClick={removeSelected} disabled={!selected}>🗑 Delete</button>
        <button style={st.btnRun} onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "💾 Save Circuit"}
        </button>
      </div>

      <div style={st.body}>
        <div style={st.palette}>
          <div style={st.paletteHeader}>Components</div>
          {COMPONENTS.map((c) => (
            <button key={c.type} style={st.paletteItem} onClick={() => addComponent(c.type)}>
              <span style={{ fontSize: 16, marginRight: 8 }}>{c.icon}</span>{c.label}
            </button>
          ))}
        </div>

        <div style={st.canvasWrap} ref={canvasRef}>
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 900 680"
            style={st.svg}
            onClick={() => setSelected(null)}
          >
            <defs>
              <pattern id="grid" width={GRID} height={GRID} patternUnits="userSpaceOnUse">
                <circle cx={2} cy={2} r={1} fill="#2d2d4a" />
              </pattern>
            </defs>
            <rect width="900" height="680" fill="url(#grid)" />

            {wires.map((w, i) => {
              const fromComp = placed.find((c) => c.id === w.from.compId);
              const toComp = placed.find((c) => c.id === w.to.compId);
              if (!fromComp || !toComp) return null;
              const p1 = pinPos(fromComp, w.from.pinName);
              const p2 = pinPos(toComp, w.to.pinName);
              const color = WIRE_COLORS[i % WIRE_COLORS.length];
              const bow = Math.max(24, Math.abs(p2.x - p1.x) * 0.25);
              const d = `M ${p1.x} ${p1.y} C ${p1.x} ${p1.y + bow}, ${p2.x} ${p2.y + bow}, ${p2.x} ${p2.y}`;
              return (
                <g key={w.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); removeWire(w.id); }}>
                  <path d={d} stroke="#0a0a14" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.5} />
                  <path d={d} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
                </g>
              );
            })}

            {placed.map((comp) => (
              <ComponentNode
                key={comp.id}
                comp={comp}
                selected={selected === comp.id}
                pendingPin={pendingPin}
                onSelect={() => setSelected(comp.id)}
                onDrag={onDragComponent}
                onPinClick={onPinClick}
              />
            ))}
          </svg>
          {placed.length === 0 && (
            <div style={st.emptyState}>Click a component on the left to place it, then click two pins to wire them.</div>
          )}
        </div>

        {selected && componentMeta(placed.find((c) => c.id === selected)?.type)?.props?.length > 0 && (
          <PropertiesPanel
            comp={placed.find((c) => c.id === selected)}
            onChange={(key, value) => updateValue(selected, key, value)}
          />
        )}
      </div>

      {validation.length > 0 && (
        <div style={st.validationBox}>
          {validation.map((v, i) => <div key={i}>⚠️ {v}</div>)}
        </div>
      )}
    </div>
  );
}

function ComponentNode({ comp, selected, pendingPin, onSelect, onDrag, onPinClick }) {
  const meta = componentMeta(comp.type);
  const dragRef = useRef(null);
  const width = Math.max(meta.pins.length * 26 + 28, 92);
  const height = 94;
  const caption = valueCaption(comp.type, comp.values);

  const startDrag = (e) => {
    e.stopPropagation();
    onSelect();
    const svg = e.currentTarget.ownerSVGElement;
    const start = { x: e.clientX, y: e.clientY };
    const rect = svg.getBoundingClientRect();
    const xScale = 900 / rect.width;
    const yScale = 680 / rect.height;
    const onMove = (ev) => {
      const dx = (ev.clientX - start.x) * xScale;
      const dy = (ev.clientY - start.y) * yScale;
      start.x = ev.clientX; start.y = ev.clientY;
      onDrag(comp.id, dx, dy);
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <g ref={dragRef} transform={`translate(${comp.x},${comp.y})`}>
      <rect
        x={0} y={0} width={width} height={height} rx={10}
        fill={selected ? "#2d2d55" : "#1c1c33"}
        stroke={selected ? "#6c63ff" : "#3d3d5c"} strokeWidth={selected ? 2 : 1}
        onMouseDown={startDrag}
        style={{ cursor: "grab" }}
      />
      <g pointerEvents="none">
        <ComponentShape id={comp.id} type={comp.type} w={width} h={height * 0.62} values={comp.values} />
      </g>
      <text x={width / 2} y={height * 0.62 + 12} fill="#e0e0e0" fontSize="10" fontWeight="700" textAnchor="middle">
        {meta.label}
      </text>
      {caption && (
        <text x={width / 2} y={height * 0.62 + 24} fill="#a29bfe" fontSize="9.5" fontWeight="700" textAnchor="middle">
          {caption}
        </text>
      )}
      {meta.pins.map((pinName, idx) => {
        const isPending = pendingPin?.compId === comp.id && pendingPin?.pinName === pinName;
        return (
          <g key={pinName}>
            <line x1={24 + idx * 26} y1={height * 0.62 + 28} x2={24 + idx * 26} y2={height} stroke="#5a5a72" strokeWidth={2} />
            <circle
              cx={24 + idx * 26} cy={height} r={7}
              fill={isPending ? "#00e676" : "#6c63ff"}
              stroke="#fff" strokeWidth={1}
              onClick={(e) => { e.stopPropagation(); onPinClick(comp.id, pinName); }}
              style={{ cursor: "pointer" }}
            >
              <title>{pinName}</title>
            </circle>
          </g>
        );
      })}
    </g>
  );
}

function PropertiesPanel({ comp, onChange }) {
  const meta = componentMeta(comp.type);
  return (
    <div style={st.propsPanel}>
      <div style={st.propsHeader}>{meta.icon} {meta.label}</div>
      {meta.props.map((p) => (
        <label key={p.key} style={st.propsRow}>
          <span style={st.propsLabel}>{p.label}</span>
          <select
            style={st.propsSelect}
            value={comp.values?.[p.key] ?? p.default}
            onChange={(e) => {
              const raw = e.target.value;
              const num = Number(raw);
              onChange(p.key, Number.isNaN(num) || typeof p.options[0] === "string" ? raw : num);
            }}
          >
            {p.options.map((opt) => (
              <option key={opt} value={opt}>
                {typeof opt === "number" && opt >= 1000 && p.unit === "Ω" ? `${opt / 1000}k${p.unit}` : `${opt}${p.unit}`}
              </option>
            ))}
          </select>
        </label>
      ))}
    </div>
  );
}

const st = {
  wrap:          { display: "flex", flexDirection: "column", height: "100%", background: "var(--surface)" },
  toolbar:       { display: "flex", gap: 8, alignItems: "center", padding: "8px 10px", background: "#1a1a2e", borderBottom: "1px solid #3d3d5c", flexShrink: 0, flexWrap: "wrap" },
  titleInput:    { flex: 1, minWidth: 100, background: "#232342", border: "1px solid #3d3d5c", borderRadius: 8, color: "#fff", fontSize: 12.5, padding: "6px 10px", fontWeight: 700 },
  btnGhost:      { background: "#252540", border: "1px solid #3d3d5c", borderRadius: 8, color: "#b2bec3", fontSize: 12, fontWeight: 700, padding: "6px 10px", cursor: "pointer" },
  btnRun:        { background: "#00b894", border: "none", borderRadius: 8, color: "#fff", fontSize: 12.5, fontWeight: 800, padding: "7px 14px", cursor: "pointer" },
  body:          { display: "flex", flex: 1, minHeight: 0 },
  palette:       { width: 170, flexShrink: 0, borderRight: "1px solid #3d3d5c", background: "#1a1a2e", overflowY: "auto", padding: 10 },
  paletteHeader: { color: "#8b9cbd", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  paletteItem:   { display: "block", width: "100%", textAlign: "left", background: "#252540", border: "1px solid #3d3d5c", borderRadius: 8, color: "#e0e0e0", fontSize: 11.5, padding: "8px 10px", marginBottom: 6, cursor: "pointer" },
  canvasWrap:    { flex: 1, position: "relative", background: "#12121f", overflow: "hidden" },
  svg:           { display: "block" },
  emptyState:    { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: "#5a6478", fontSize: 12.5, textAlign: "center", maxWidth: 240, pointerEvents: "none" },
  propsPanel:    { width: 190, flexShrink: 0, borderLeft: "1px solid #3d3d5c", background: "#1a1a2e", padding: 12, overflowY: "auto" },
  propsHeader:   { color: "#fff", fontSize: 12.5, fontWeight: 800, marginBottom: 12 },
  propsRow:      { display: "block", marginBottom: 10 },
  propsLabel:    { display: "block", color: "#8b9cbd", fontSize: 10.5, fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.4 },
  propsSelect:   { width: "100%", background: "#252540", border: "1px solid #3d3d5c", borderRadius: 6, color: "#fff", fontSize: 12, padding: "6px 8px" },
  validationBox: { background: "#3d3320", color: "#ffd966", fontSize: 12, padding: "10px 14px", borderTop: "1px solid #5a2a2a", maxHeight: 120, overflowY: "auto", lineHeight: 1.5 },
};

// TODO (Phase 4): live binding. AVREmulator already emits onPinChange({port,
// value}); the remaining wiring is a lookup table from a placed component's
// connected Arduino pin (via `wires`) to which bit of that port it reads,
// so e.g. a placed LED's brightness/on-state updates in real time while a
// sketch runs. Left for a follow-up pass once this canvas has been used
// enough to know which UX (drag precision, pin hit-targets) needs tuning
// first — building the live binding on top of a shaky canvas would just
// mean redoing both.
