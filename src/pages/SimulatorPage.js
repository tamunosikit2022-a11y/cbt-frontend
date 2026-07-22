import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { saveProject, listProjects } from "./classroom/liveide/liveIdeApi";
import { compileSketch } from "./classroom/liveide/arduinoApi";
import { AVREmulator } from "./classroom/liveide/avrEmulator";
import {
  COMPONENTS, componentMeta, defaultValues, CATEGORY_ORDER,
  ARDUINO_META, ARDUINO_PINS_TOP, ARDUINO_PINS_BOTTOM, ARDUINO_PIN_TO_AVR,
  STARTER_FILES,
} from "./classroom/liveide/boardCatalog";
import { ComponentShape, valueCaption, ArduinoBoardArt, BreadboardArt } from "./classroom/liveide/componentShapes";

/**
 * SimulatorPage.js — standalone "Simulator" page for Scholars Syndicate.
 *
 * This is the full-page shell (branded header + app nav) wrapped around the
 * same breadboard/code/serial-monitor workspace that ElectronicsLab.js
 * powers inside the classroom Live IDE panel. It's a separate, additive
 * page — ElectronicsLab.js / LiveIDEPanel.js are untouched so the embedded
 * classroom flow keeps working exactly as before.
 *
 * Route: /simulator (see App.js)
 */

const WIRE_COLORS = ["#ff6b6b", "#feca57", "#1dd1a1", "#54a0ff", "#a29bfe", "#ff9ff3", "#00d2d3"];
const CANVAS_W = 1040;
const CANVAS_H = 500;
const POPULAR = ["led", "resistor", "button", "potentiometer", "lcd1602", "hcsr04", "dht11", "buzzer"];
const CATEGORY_ICONS = {
  Boards: "🧩", "Passive Components": "🔧", Semiconductors: "🔌", Sensors: "📡",
  Displays: "🖥️", Motors: "⚙️", "Input Devices": "🎛️", "Output Devices": "🔊",
};

const NAV_TABS = [
  { key: "dashboard", label: "Dashboard", icon: "🏠", path: "/dashboard" },
  { key: "learn", label: "Learn", icon: "📚", path: "/videos" },
  { key: "simulator", label: "Simulator", icon: "🧪", path: "/simulator" },
  { key: "pcb", label: "PCB Design", icon: "🖨️", path: null },
  { key: "code", label: "Code Editor", icon: "💻", path: "/classroom/ide" },
  { key: "tutor", label: "AI Tutor", icon: "🤖", path: "/ai-tutor" },
  { key: "reports", label: "Lab Reports", icon: "📋", path: null },
  { key: "challenges", label: "Challenges", icon: "🏆", path: "/challenges" },
  { key: "market", label: "Marketplace", icon: "🛒", path: "/store" },
];

const FEATURE_CARDS = [
  { icon: "🤖", title: "AI Assistant", desc: "Get help with your circuits code and errors", path: "/ai-tutor" },
  { icon: "📘", title: "Circuit Tutorials", desc: "Step-by-step practical lessons", path: "/videos" },
  { icon: "📄", title: "Lab Reports", desc: "Auto-generate beautiful lab reports", path: null },
  { icon: "🧠", title: "Quizzes", desc: "Test your knowledge and earn XP", path: "/ai-quiz" },
  { icon: "🏆", title: "Challenges", desc: "Complete challenges and win rewards", path: "/challenges" },
  { icon: "👥", title: "Community", desc: "Share projects and get help from others", path: "/social" },
];

function newId() { return Math.random().toString(36).slice(2, 9); }

function componentSize(comp) {
  if (comp.type === ARDUINO_META.type) return { width: comp.w || 460, height: comp.h || 190 };
  if (comp.type === "lcd1602") return { width: comp.w || 200, height: comp.h || 90 };
  const meta = componentMeta(comp.type);
  const width = Math.max((meta?.pins.length || 2) * 26 + 28, 92);
  return { width, height: 94 };
}

function pinLocalPos(comp, pinName) {
  const { width, height } = componentSize(comp);
  if (comp.type === ARDUINO_META.type) {
    const topIdx = ARDUINO_PINS_TOP.indexOf(pinName);
    if (topIdx >= 0) {
      const spacing = width / (ARDUINO_PINS_TOP.length + 1);
      return { x: spacing * (topIdx + 1), y: 0 };
    }
    const botIdx = ARDUINO_PINS_BOTTOM.indexOf(pinName);
    const spacing = width / (ARDUINO_PINS_BOTTOM.length + 1);
    return { x: spacing * (botIdx + 1), y: height };
  }
  const meta = componentMeta(comp.type);
  const idx = meta.pins.indexOf(pinName);
  if (comp.type === "lcd1602") {
    const spacing = width / (meta.pins.length + 1);
    return { x: spacing * (idx + 1), y: height };
  }
  return { x: 24 + idx * 26, y: height };
}

function pinAbsPos(comp, pinName) {
  const local = pinLocalPos(comp, pinName);
  return { x: comp.x + local.x, y: comp.y + local.y };
}

// A ready-to-go demo circuit so the simulator opens looking alive instead
// of an empty canvas — mirrors ElectronicsLab.js's default layout.
function buildDefaultLayout() {
  const arduino = { id: "arduino-board", type: ARDUINO_META.type, x: 40, y: 270, fixed: true, values: {} };
  const led = { id: newId(), type: "led", x: 300, y: 40, values: defaultValues("led") };
  const resistor = { id: newId(), type: "resistor", x: 300, y: 150, values: defaultValues("resistor") };
  const pot = { id: newId(), type: "potentiometer", x: 470, y: 40, values: defaultValues("potentiometer") };
  const hcsr04 = { id: newId(), type: "hcsr04", x: 620, y: 40, values: defaultValues("hcsr04") };
  const dht11 = { id: newId(), type: "dht11", x: 620, y: 150, values: defaultValues("dht11") };
  const lcd = { id: newId(), type: "lcd1602", x: 790, y: 40, values: defaultValues("lcd1602") };
  lcd.values.line1 = `Distance: ${hcsr04.values.distance} cm`;
  lcd.values.line2 = `Temp: ${dht11.values.temperature}C Hum: ${dht11.values.humidity}%`;

  const placed = [arduino, led, resistor, pot, hcsr04, dht11, lcd];
  const wires = [
    { id: newId(), from: { compId: led.id, pinName: "anode" }, to: { compId: resistor.id, pinName: "a" } },
    { id: newId(), from: { compId: resistor.id, pinName: "b" }, to: { compId: arduino.id, pinName: "D13" } },
    { id: newId(), from: { compId: led.id, pinName: "cathode" }, to: { compId: arduino.id, pinName: "GND" } },
    { id: newId(), from: { compId: pot.id, pinName: "vcc" }, to: { compId: arduino.id, pinName: "5V" } },
    { id: newId(), from: { compId: pot.id, pinName: "gnd" }, to: { compId: arduino.id, pinName: "GND" } },
    { id: newId(), from: { compId: pot.id, pinName: "wiper" }, to: { compId: arduino.id, pinName: "A0" } },
    { id: newId(), from: { compId: hcsr04.id, pinName: "vcc" }, to: { compId: arduino.id, pinName: "5V" } },
    { id: newId(), from: { compId: hcsr04.id, pinName: "gnd" }, to: { compId: arduino.id, pinName: "GND" } },
    { id: newId(), from: { compId: hcsr04.id, pinName: "trig" }, to: { compId: arduino.id, pinName: "D9" } },
    { id: newId(), from: { compId: hcsr04.id, pinName: "echo" }, to: { compId: arduino.id, pinName: "D10" } },
    { id: newId(), from: { compId: dht11.id, pinName: "vcc" }, to: { compId: arduino.id, pinName: "5V" } },
    { id: newId(), from: { compId: dht11.id, pinName: "gnd" }, to: { compId: arduino.id, pinName: "GND" } },
    { id: newId(), from: { compId: dht11.id, pinName: "data" }, to: { compId: arduino.id, pinName: "D7" } },
    { id: newId(), from: { compId: lcd.id, pinName: "vcc" }, to: { compId: arduino.id, pinName: "5V" } },
    { id: newId(), from: { compId: lcd.id, pinName: "gnd" }, to: { compId: arduino.id, pinName: "GND" } },
    { id: newId(), from: { compId: lcd.id, pinName: "sda" }, to: { compId: arduino.id, pinName: "A4" } },
    { id: newId(), from: { compId: lcd.id, pinName: "scl" }, to: { compId: arduino.id, pinName: "A5" } },
  ];
  return { placed, wires };
}

function loadInitialState(project) {
  const fallback = { ...buildDefaultLayout(), files: { ...STARTER_FILES } };
  if (!project?.code) return fallback;
  try {
    const parsed = JSON.parse(project.code);
    if (parsed && (parsed.components || parsed.files)) {
      return {
        placed: parsed.components?.length ? parsed.components : fallback.placed,
        wires: parsed.wires || [],
        files: parsed.files || fallback.files,
      };
    }
  } catch {
    return { ...fallback, files: { ...STARTER_FILES, "main.ino": project.code } };
  }
  return fallback;
}

function formatElapsed(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `00:${m}:${s}`;
}

export default function SimulatorPage() {
  const navigate = useNavigate();
  const { student } = useAuth();
  const initial = useRef(loadInitialState(null)).current;

  const [title, setTitle] = useState("Untitled circuit");
  const [projectId, setProjectId] = useState(null);
  const [placed, setPlaced] = useState(initial.placed);
  const [wires, setWires] = useState(initial.wires);
  const [files, setFiles] = useState(initial.files);
  const [activeFile, setActiveFile] = useState("main.ino");

  const [pendingPin, setPendingPin] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("breadboard");
  const [consoleTab, setConsoleTab] = useState("serial");
  const [zoom, setZoom] = useState(100);

  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState(null);
  const [serialLines, setSerialLines] = useState([]);
  const [command, setCommand] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [liveMap, setLiveMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const [favorites, setFavorites] = useState(() => new Set());
  const [recentlyUsed, setRecentlyUsed] = useState([]);
  const [analysisTool, setAnalysisTool] = useState(null); // logic | scope | voltage
  const [projectCount, setProjectCount] = useState(null);

  const emulatorRef = useRef(null);
  const placedRef = useRef(placed);
  const wiresRef = useRef(wires);
  const pinBitsRef = useRef({ B: 0, C: 0, D: 0 });
  const serialBufferRef = useRef("");
  const serialBoxRef = useRef(null);
  const elapsedIntervalRef = useRef(null);
  const sensorIntervalRef = useRef(null);

  useEffect(() => { placedRef.current = placed; }, [placed]);
  useEffect(() => { wiresRef.current = wires; }, [wires]);

  useEffect(() => {
    if (serialBoxRef.current) serialBoxRef.current.scrollTop = serialBoxRef.current.scrollHeight;
  }, [serialLines]);

  // Real "projects completed" count for the Learning Progress card — pulled
  // from the student's actual saved projects rather than a placeholder.
  useEffect(() => {
    let cancelled = false;
    Promise.all([listProjects("python"), listProjects("arduino"), listProjects("circuit")])
      .then(([a, b, c]) => { if (!cancelled) setProjectCount(a.length + b.length + c.length); })
      .catch(() => { if (!cancelled) setProjectCount(null); });
    return () => { cancelled = true; };
  }, []);

  const recomputeLiveMap = useCallback(() => {
    const currentPlaced = placedRef.current;
    const currentWires = wiresRef.current;
    const arduino = currentPlaced.find((c) => c.type === ARDUINO_META.type);
    if (!arduino) { setLiveMap({}); return; }
    const highPins = new Set();
    Object.entries(ARDUINO_PIN_TO_AVR).forEach(([pin, [port, bit]]) => {
      if ((pinBitsRef.current[port] >> bit) & 1) highPins.add(pin);
    });
    const adj = {};
    currentWires.forEach((w) => {
      (adj[w.from.compId] = adj[w.from.compId] || []).push(w.to.compId);
      (adj[w.to.compId] = adj[w.to.compId] || []).push(w.from.compId);
    });
    const map = {};
    const markReachable = (startId) => {
      const seen = new Set([arduino.id]);
      const stack = [startId];
      while (stack.length) {
        const id = stack.pop();
        if (seen.has(id)) continue;
        seen.add(id);
        map[id] = true;
        (adj[id] || []).forEach((n) => { if (!seen.has(n)) stack.push(n); });
      }
    };
    currentWires.forEach((w) => {
      if (w.from.compId === arduino.id && highPins.has(w.from.pinName)) markReachable(w.to.compId);
      if (w.to.compId === arduino.id && highPins.has(w.to.pinName)) markReachable(w.from.compId);
    });
    setLiveMap(map);
  }, []);

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
      onPinChange: ({ port, value }) => {
        pinBitsRef.current = { ...pinBitsRef.current, [port]: value ?? 0 };
        recomputeLiveMap();
      },
      onHalt: (msg) => {
        setStatus("error");
        setErrors(`Emulator stopped: ${msg}`);
      },
    });
    return () => {
      emulatorRef.current?.stop();
      clearInterval(elapsedIntervalRef.current);
      clearInterval(sensorIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handler = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ""; } };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const markDirty = () => setDirty(true);

  const startTimers = useCallback(() => {
    clearInterval(elapsedIntervalRef.current);
    clearInterval(sensorIntervalRef.current);
    elapsedIntervalRef.current = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    sensorIntervalRef.current = setInterval(() => {
      const hc = placedRef.current.find((c) => c.type === "hcsr04");
      const dht = placedRef.current.find((c) => c.type === "dht11");
      if (!hc && !dht) return;
      const jitter = () => (Math.random() * 2 - 1);
      const parts = [];
      if (hc) parts.push(`Distance: ${Math.max(2, Math.round(hc.values.distance + jitter()))} cm`);
      if (dht) {
        parts.push(`Temp: ${(dht.values.temperature + jitter() * 0.3).toFixed(1)} °C`);
        parts.push(`Humidity: ${Math.round(dht.values.humidity + jitter())} %`);
      }
      setSerialLines((prev) => [...prev.slice(-499), parts.join(" | ")]);
    }, 1000);
  }, []);

  const stopTimers = () => {
    clearInterval(elapsedIntervalRef.current);
    clearInterval(sensorIntervalRef.current);
  };

  const handleRun = useCallback(async () => {
    if (status === "paused" && emulatorRef.current?.cpu) {
      emulatorRef.current.start();
      setStatus("running");
      startTimers();
      return;
    }
    setStatus("compiling");
    setErrors(null);
    setSerialLines([]);
    setElapsedSec(0);
    pinBitsRef.current = { B: 0, C: 0, D: 0 };
    setLiveMap({});
    emulatorRef.current?.stop();

    try {
      const result = await compileSketch(files["main.ino"], "arduino_uno");
      if (!result.success) {
        setStatus("error");
        setErrors(result.errors || "Compile failed.");
        return;
      }
      emulatorRef.current.load(result.hex);
      emulatorRef.current.start();
      setStatus("running");
      startTimers();
    } catch (err) {
      setStatus("error");
      const serverMsg = err?.response?.data?.error;
      setErrors(serverMsg || "Couldn't reach the compiler. Check your connection and try again.");
    }
  }, [files, status, startTimers]);

  const handleUpload = useCallback(() => {
    setStatus("compiling");
    setTimeout(() => handleRun(), 500);
  }, [handleRun]);

  const handlePause = useCallback(() => {
    emulatorRef.current?.stop();
    stopTimers();
    setStatus("paused");
  }, []);

  const handleStop = useCallback(() => {
    emulatorRef.current?.stop();
    stopTimers();
    setStatus("idle");
    setSerialLines([]);
    setElapsedSec(0);
    pinBitsRef.current = { B: 0, C: 0, D: 0 };
    setLiveMap({});
  }, []);

  const handleReset = useCallback(() => {
    handleStop();
    setTimeout(() => handleRun(), 80);
  }, [handleStop, handleRun]);

  const handleDebug = useCallback(() => {
    setConsoleTab("debug");
    handleRun();
  }, [handleRun]);

  const handleNewProject = useCallback(() => {
    if (dirty && !window.confirm("Start a new project? Unsaved changes will be lost.")) return;
    const fresh = buildDefaultLayout();
    setProjectId(null);
    setTitle("Untitled circuit");
    setPlaced(fresh.placed);
    setWires(fresh.wires);
    setFiles({ ...STARTER_FILES });
    setSelected(null);
    handleStop();
    setDirty(false);
  }, [dirty, handleStop]);

  const addComponent = useCallback((type) => {
    setPlaced((prev) => [
      ...prev,
      { id: newId(), type, x: 300 + (prev.length % 4) * 30, y: 40 + (prev.length % 3) * 20, values: defaultValues(type) },
    ]);
    setRecentlyUsed((prev) => [type, ...prev.filter((t) => t !== type)].slice(0, 6));
    markDirty();
  }, []);

  const toggleFavorite = useCallback((type) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }, []);

  const removeSelected = useCallback(() => {
    if (!selected) return;
    const comp = placed.find((c) => c.id === selected);
    if (comp?.fixed) return;
    setPlaced((prev) => prev.filter((c) => c.id !== selected));
    setWires((prev) => prev.filter((w) => w.from.compId !== selected && w.to.compId !== selected));
    setSelected(null);
    markDirty();
  }, [selected, placed]);

  const onDragComponent = useCallback((id, dx, dy) => {
    setPlaced((prev) => prev.map((c) => (c.id === id ? { ...c, x: c.x + dx, y: c.y + dy } : c)));
    markDirty();
  }, []);

  const onPinClick = useCallback((compId, pinName) => {
    setPendingPin((prevPending) => {
      if (!prevPending) return { compId, pinName };
      if (prevPending.compId === compId && prevPending.pinName === pinName) return null;
      setWires((prev) => [...prev, { id: newId(), from: prevPending, to: { compId, pinName } }]);
      markDirty();
      return null;
    });
  }, []);

  const removeWire = useCallback((wireId) => {
    setWires((prev) => prev.filter((w) => w.id !== wireId));
    markDirty();
  }, []);

  const updateValue = useCallback((id, key, value) => {
    setPlaced((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, values: { ...c.values, [key]: value } } : c));
      const hc = next.find((c) => c.type === "hcsr04");
      const dht = next.find((c) => c.type === "dht11");
      return next.map((c) => {
        if (c.type !== "lcd1602") return c;
        const line1 = hc ? `Distance: ${hc.values.distance} cm` : c.values.line1;
        const line2 = dht ? `Temp: ${dht.values.temperature}C Hum: ${dht.values.humidity}%` : c.values.line2;
        return { ...c, values: { ...c.values, line1, line2 } };
      });
    });
    markDirty();
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const layout = JSON.stringify({ components: placed, wires, files, board: "arduino_uno" });
      const saved = await saveProject({ id: projectId, kind: "circuit", title, code: layout, board_type: "arduino_uno" });
      setProjectId(saved.id);
      setDirty(false);
    } catch {
      setErrors("Could not save your project. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [projectId, title, placed, wires, files]);

  const handleShare = useCallback(async () => {
    if (!projectId) { await handleSave(); }
    const url = `${window.location.origin}/simulator?project=${projectId || ""}`;
    try {
      await navigator.clipboard.writeText(url);
      window.alert("Share link copied to clipboard.");
    } catch {
      window.prompt("Copy this link to share your circuit:", url);
    }
  }, [projectId, handleSave]);

  const handleSendCommand = useCallback(() => {
    if (!command.trim()) return;
    setSerialLines((prev) => [...prev.slice(-499), `> ${command}`]);
    setCommand("");
  }, [command]);

  const goTab = (tab) => {
    if (!tab.path || tab.key === "simulator") return;
    navigate(tab.path);
  };

  const selectedComp = placed.find((c) => c.id === selected);
  const sensors = placed.filter((c) => c.type === "dht11" || c.type === "hcsr04");
  const filteredComponents = COMPONENTS.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()));
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat, items: filteredComponents.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  const displayName = (student?.full_name || "Guest Scholar").split(" ").slice(0, 2).join(" ");
  const initials = (student?.full_name || "GS").slice(0, 2).toUpperCase();
  const level = student?.level ?? 1;
  const xp = student?.xp ?? 0;
  const coins = student?.coins ?? student?.token_balance ?? 0;
  const gems = student?.gems ?? 0;
  const streak = student?.current_streak ?? 0;

  return (
    <div style={st.page}>
      {/* ── Top header ───────────────────────────────────────── */}
      <div style={st.topHeader}>
        <div style={st.logoBlock}>
          <div style={st.logoBadge}>SS</div>
          <div>
            <div style={st.logoTitle}>SCHOLARS SYNDICATE</div>
            <div style={st.logoSub}>ELECTRONICS LAB</div>
          </div>
        </div>

        <div style={st.searchWrap}>
          <span style={st.searchIcon}>🔍</span>
          <input style={st.searchInput} placeholder="Search components, projects, tutorials…" />
        </div>

        <div style={st.headerStats}>
          <HeaderStat icon="⚡" color="#f5b942" label="XP" value={xp.toLocaleString()} />
          <HeaderStat icon="🪙" color="#ffc94a" label="Coins" value={coins.toLocaleString()} />
          <HeaderStat icon="💎" color="#54a0ff" label="Gems" value={gems.toLocaleString()} />
          <HeaderStat icon="🔥" color="#ff6b35" label="Streak" value={streak} />
        </div>

        <div style={st.headerIcons}>
          <button style={st.iconBtn} title="Trophies" onClick={() => navigate("/badges")}>🏆</button>
          <button style={st.iconBtn} title="Calendar" onClick={() => navigate("/study-planner")}>📅</button>
          <button style={st.iconBtn} title="Arena" onClick={() => navigate("/arena")}>🎮</button>
          <button style={st.iconBtn} title="Notifications" onClick={() => navigate("/profile")}>
            🔔<span style={st.notifDot} />
          </button>
        </div>

        <button style={st.avatarBlock} onClick={() => navigate("/profile")}>
          <div style={st.avatarCircle}>
            {student?.avatar_url
              ? <img src={student.avatar_url} alt="" style={st.avatarImg} />
              : initials}
          </div>
          <div style={st.avatarText}>
            <div style={st.avatarName}>{displayName}</div>
            <div style={st.avatarLevel}>Level {level}</div>
          </div>
          <span style={st.chevron}>▾</span>
        </button>
      </div>

      {/* ── Main nav ─────────────────────────────────────────── */}
      <div style={st.mainNav}>
        {NAV_TABS.map((tab) => (
          <button
            key={tab.key}
            style={{ ...st.navTab, ...(tab.key === "simulator" ? st.navTabActive : {}) }}
            onClick={() => goTab(tab)}
          >
            <span style={{ marginRight: 6 }}>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ── Sub header: view tabs + share/save/new ─────────────── */}
      <div style={st.subHeader}>
        <div style={st.viewTabs}>
          {[["breadboard", "Breadboard View"], ["schematic", "Schematic View"], ["pcb", "PCB View"]].map(([v, label]) => (
            <button key={v} style={{ ...st.viewTab, ...(view === v ? st.viewTabActive : {}) }} onClick={() => setView(v)}>
              {label}
            </button>
          ))}
        </div>
        <div style={st.spacer} />
        <button style={st.btnGhost} onClick={handleShare}>⇪ Share</button>
        <button style={st.btnGhost} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "💾 Save"}</button>
        <button style={st.btnPrimarySm} onClick={handleNewProject}>+ New Project</button>
      </div>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div style={st.body}>
        {/* Component library */}
        <div style={st.palette}>
          <div style={st.paletteHeaderRow}>
            <div style={st.paletteTitle}>COMPONENT LIBRARY</div>
          </div>
          <div style={st.searchRow}>
            <input
              style={st.search}
              placeholder="Search components…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button style={st.filterBtn} title="Filter">⚗</button>
          </div>

          <CollapsibleSection
            icon="⭐" label="FAVORITES" count={favorites.size}
            expanded={expanded.has("__fav")}
            onToggle={() => setExpanded((p) => toggleSet(p, "__fav"))}
          >
            {favorites.size === 0 ? (
              <div style={st.emptyHint}>Star components to pin them here.</div>
            ) : (
              [...favorites].map((type) => {
                const meta = componentMeta(type);
                return (
                  <button key={type} style={st.paletteItem} onClick={() => addComponent(type)}>
                    <span style={{ fontSize: 15, marginRight: 8 }}>{meta.icon}</span>{meta.label}
                  </button>
                );
              })
            )}
          </CollapsibleSection>

          <CollapsibleSection
            icon="🕓" label="RECENTLY USED" count={recentlyUsed.length}
            expanded={expanded.has("__recent")}
            onToggle={() => setExpanded((p) => toggleSet(p, "__recent"))}
          >
            {recentlyUsed.length === 0 ? (
              <div style={st.emptyHint}>Components you add will show up here.</div>
            ) : (
              recentlyUsed.map((type) => {
                const meta = componentMeta(type);
                return (
                  <button key={type} style={st.paletteItem} onClick={() => addComponent(type)}>
                    <span style={{ fontSize: 15, marginRight: 8 }}>{meta.icon}</span>{meta.label}
                  </button>
                );
              })
            )}
          </CollapsibleSection>

          {grouped.map(({ cat, items }) => (
            <CollapsibleSection
              key={cat}
              icon={CATEGORY_ICONS[cat] || "🔩"} label={cat.toUpperCase()} count={items.length}
              expanded={expanded.has(cat)}
              onToggle={() => setExpanded((p) => toggleSet(p, cat))}
            >
              {items.map((c) => (
                <div key={c.type} style={st.paletteItemRow}>
                  <button style={st.paletteItemFlex} onClick={() => addComponent(c.type)}>
                    <span style={{ fontSize: 15, marginRight: 8 }}>{c.icon}</span>{c.label}
                  </button>
                  <button
                    style={{ ...st.favStar, color: favorites.has(c.type) ? "#f5b942" : "#4a4a68" }}
                    onClick={() => toggleFavorite(c.type)}
                    title="Favorite"
                  >★</button>
                </div>
              ))}
            </CollapsibleSection>
          ))}

          <div style={st.popularWrap}>
            <div style={st.paletteSectionLabel}>POPULAR COMPONENTS</div>
            <div style={st.popularGrid}>
              {POPULAR.map((type) => {
                const meta = componentMeta(type);
                return (
                  <button key={type} style={st.popularItem} onClick={() => addComponent(type)} title={`Add ${meta.label}`}>
                    <span style={{ fontSize: 18 }}>{meta.icon}</span>
                    <span style={st.popularLabel}>{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <button style={st.viewAllBtn} onClick={() => setExpanded(new Set(CATEGORY_ORDER))}>
              ⊞ View All Components ▾
            </button>
          </div>
        </div>

        {/* Center: canvas + editor + console + bottom toolbar */}
        <div style={st.center}>
          {view !== "breadboard" ? (
            <div style={st.comingSoon}>
              {view === "schematic" ? "🧾" : "🖨️"} {view === "schematic" ? "Schematic view" : "PCB view"} is coming soon —
              build and simulate on the Breadboard view for now.
            </div>
          ) : (
            <div style={st.canvasWrap}>
              <div style={st.canvasToolbar}>
                <div style={st.toolGroup}>
                  {["🖱️", "✋", "🔗", "📝", "🔄", "🗑️"].map((ic, i) => (
                    <button key={i} style={st.toolIcon} title="Tool">{ic}</button>
                  ))}
                </div>
                <div style={st.toolGroup}>
                  <button style={st.toolIcon} onClick={() => setZoom((z) => Math.max(40, z - 10))} title="Zoom out">－</button>
                  <div style={st.zoomLabel}>{zoom}%</div>
                  <button style={st.toolIcon} onClick={() => setZoom((z) => Math.min(200, z + 10))} title="Zoom in">＋</button>
                  <button style={st.toolIcon} onClick={() => setZoom(100)} title="Fit to screen">⛶</button>
                </div>
              </div>

              <div style={st.canvasScroll} onClick={() => setSelected(null)}>
                <svg
                  width={`${zoom}%`} height={`${zoom}%`}
                  viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
                  style={st.svg}
                >
                  <defs>
                    <pattern id="grid" width={20} height={20} patternUnits="userSpaceOnUse">
                      <circle cx={2} cy={2} r={0.8} fill="#232342" />
                    </pattern>
                  </defs>
                  <rect width={CANVAS_W} height={CANVAS_H} fill="#12121f" />
                  <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />
                  <BreadboardArt x={260} y={10} w={760} h={230} />

                  {wires.map((w, i) => {
                    const fromComp = placed.find((c) => c.id === w.from.compId);
                    const toComp = placed.find((c) => c.id === w.to.compId);
                    if (!fromComp || !toComp) return null;
                    const p1 = pinAbsPos(fromComp, w.from.pinName);
                    const p2 = pinAbsPos(toComp, w.to.pinName);
                    const color = WIRE_COLORS[i % WIRE_COLORS.length];
                    const bow = Math.max(30, Math.abs(p2.x - p1.x) * 0.3);
                    const d = `M ${p1.x} ${p1.y} C ${p1.x} ${p1.y + bow}, ${p2.x} ${p2.y + bow}, ${p2.x} ${p2.y}`;
                    return (
                      <g key={w.id} style={{ cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); removeWire(w.id); }}>
                        <path d={d} stroke="#0a0a14" strokeWidth={5} fill="none" strokeLinecap="round" opacity={0.5} />
                        <path d={d} stroke={color} strokeWidth={2.6} fill="none" strokeLinecap="round" />
                      </g>
                    );
                  })}

                  {placed.map((comp) => (
                    <ComponentNode
                      key={comp.id}
                      comp={comp}
                      selected={selected === comp.id}
                      pendingPin={pendingPin}
                      live={liveMap[comp.id]}
                      onSelect={() => setSelected(comp.id)}
                      onDrag={onDragComponent}
                      onPinClick={onPinClick}
                    />
                  ))}
                </svg>
              </div>

              <MiniMap placed={placed} />
            </div>
          )}

          <div style={st.splitRow}>
            <div style={st.codePane}>
              <div style={st.fileTabs}>
                {Object.keys(files).map((f) => (
                  <button
                    key={f}
                    style={{ ...st.fileTab, ...(activeFile === f ? st.fileTabActive : {}) }}
                    onClick={() => setActiveFile(f)}
                  >
                    {f}
                  </button>
                ))}
                <button
                  style={st.fileTab}
                  title="Add file"
                  onClick={() => {
                    const name = window.prompt("New file name (e.g. helpers.h):");
                    if (!name || files[name]) return;
                    setFiles((prev) => ({ ...prev, [name]: "" }));
                    setActiveFile(name);
                    markDirty();
                  }}
                >＋</button>
              </div>
              <textarea
                style={st.editor}
                spellCheck={false}
                value={files[activeFile]}
                onChange={(e) => { setFiles((prev) => ({ ...prev, [activeFile]: e.target.value })); markDirty(); }}
              />
              <div style={st.editorStatus}>
                <span>C++ (Arduino Uno)</span>
                <span>Ln 1, Col 1 · Spaces: 2 · UTF-8</span>
              </div>
            </div>

            <div style={st.consolePane}>
              <div style={st.fileTabs}>
                {[["serial", "Serial Monitor"], ["compiler", "Compiler"], ["debug", "Debug Console"]].map(([k, label]) => (
                  <button
                    key={k}
                    style={{ ...st.fileTab, ...(consoleTab === k ? st.fileTabActive : {}) }}
                    onClick={() => setConsoleTab(k)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {consoleTab === "serial" && (
                <>
                  <div style={st.serial} ref={serialBoxRef}>
                    {serialLines.length === 0 && <div style={st.serialEmpty}>Hit Run to start the simulation.</div>}
                    {serialLines.map((l, i) => <div key={i} style={st.serialLine}>{l}</div>)}
                  </div>
                  <div style={st.commandRow}>
                    <input
                      style={st.commandInput}
                      placeholder="Type a command…"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendCommand()}
                    />
                    <button style={st.btnGhost} onClick={handleSendCommand}>Send</button>
                  </div>
                  <div style={st.baudRow}>
                    <span>Clear</span><span>9600 baud</span>
                  </div>
                </>
              )}
              {consoleTab === "compiler" && (
                <div style={st.serial}>
                  {errors ? <div style={st.errLine}>{errors}</div> : <div style={st.serialEmpty}>No compiler errors.</div>}
                </div>
              )}
              {consoleTab === "debug" && (
                <div style={st.serial}>
                  <div style={st.serialEmpty}>Debug output will appear here once available.</div>
                </div>
              )}
            </div>
          </div>

          <div style={st.toolbar}>
            <button style={st.btnRun} onClick={handleRun} disabled={status === "compiling"}>
              {status === "compiling" ? "Compiling…" : "▶ Run"}
            </button>
            <button style={st.btnGhost} onClick={handlePause} disabled={status !== "running"}>⏸ Pause</button>
            <button style={st.btnGhost} onClick={handleStop} disabled={status === "idle"}>⏹ Stop</button>
            <button style={st.btnGhost} onClick={handleReset}>↻ Reset</button>
            <button style={st.btnGhost} onClick={handleDebug}>🐞 Debug</button>
            <button style={st.btnGhost} onClick={handleUpload} disabled={status === "compiling"}>⬆ Upload</button>

            <div style={st.speedGroup}>
              <span style={st.speedLabel}>Simulation Speed</span>
              <select style={st.speedSelect} defaultValue={100} onChange={() => {}}>
                {[50, 100, 150, 200].map((s) => <option key={s} value={s}>{s}%</option>)}
              </select>
            </div>

            <div style={st.spacer} />

            <div style={st.statusPill}>
              <span style={{ ...st.statusDot, background: status === "running" ? "#00e676" : status === "error" ? "#ff5252" : "#5a6478" }} />
              {status === "running" ? "Live Simulation" : status === "paused" ? "Paused" : status === "error" ? "Error" : "Idle"}
              {status === "running" && <span style={st.elapsed}>{formatElapsed(elapsedSec)}</span>}
            </div>

            {[["logic", "Logic Analyzer"], ["scope", "Oscilloscope"], ["voltage", "Voltage Chart"]].map(([k, label]) => (
              <button
                key={k}
                style={{ ...st.btnGhost, ...(analysisTool === k ? st.btnGhostActive : {}) }}
                onClick={() => setAnalysisTool((prev) => (prev === k ? null : k))}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div style={st.rightPanel}>
          <div style={st.card}>
            <div style={st.cardHeader}>Component Properties</div>
            {selectedComp ? (
              selectedComp.type === ARDUINO_META.type ? (
                <div style={st.propsBody}>
                  <PropRow label="Name" value="Arduino Uno R3" />
                  <PropRow label="Board Type" value="Arduino Uno R3" />
                  <PropRow label="Clock Frequency" value="16 MHz" />
                  <PropRow label="Operating Voltage" value="5V" />
                </div>
              ) : (
                <div style={st.propsBody}>
                  {(componentMeta(selectedComp.type)?.props || []).map((p) => (
                    <PropField key={p.key} prop={p} comp={selectedComp} onChange={(v) => updateValue(selectedComp.id, p.key, v)} />
                  ))}
                  {(componentMeta(selectedComp.type)?.props || []).length === 0 && (
                    <div style={st.serialEmpty}>No editable properties.</div>
                  )}
                  <button style={st.deleteBtn} onClick={removeSelected}>🗑 Delete component</button>
                </div>
              )
            ) : (
              <div style={st.serialEmpty}>Select a component on the canvas to see its properties.</div>
            )}
          </div>

          <div style={st.card}>
            <div style={st.cardHeader}>Sensor Simulator</div>
            {sensors.length === 0 && <div style={st.serialEmpty}>Add an HC-SR04 or DHT11 to simulate live readings.</div>}
            {sensors.map((s) => (
              <div key={s.id} style={{ marginBottom: 14 }}>
                <div style={st.sensorName}>{componentMeta(s.type).icon} {componentMeta(s.type).label}</div>
                {(componentMeta(s.type).props || []).map((p) => (
                  <PropField key={p.key} prop={p} comp={s} onChange={(v) => updateValue(s.id, p.key, v)} />
                ))}
              </div>
            ))}
          </div>

          <div style={st.card}>
            <div style={st.cardHeader}>Project Explorer</div>
            <input
              style={st.explorerTitle}
              value={title}
              onChange={(e) => { setTitle(e.target.value); markDirty(); }}
            />
            {Object.keys(files).map((f) => (
              <button
                key={f}
                style={{ ...st.explorerItem, ...(activeFile === f ? st.explorerItemActive : {}) }}
                onClick={() => setActiveFile(f)}
              >📄 {f}</button>
            ))}
            {["lib", "components", "images", "data"].map((folder) => (
              <div key={folder} style={st.explorerFolder}>📁 {folder}</div>
            ))}
            <div style={st.explorerItem}>📄 README.md</div>
          </div>

          <div style={st.card}>
            <div style={st.cardHeaderRow}>
              <div style={st.cardHeader}>Learning Progress</div>
            </div>
            <div style={st.progressRow}>
              <ProgressRing pct={projectCount != null ? Math.min(100, projectCount * 10) : 0} />
              <div style={st.progressStats}>
                <ProgressStat icon="📦" label="Projects Completed" value={projectCount != null ? projectCount : "—"} />
                <ProgressStat icon="⏱️" label="Hours Practiced" value="—" />
                <ProgressStat icon="🧠" label="Quizzes Completed" value="—" />
                <ProgressStat icon="🏅" label="Badges Earned" value="—" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom feature strip ─────────────────────────────── */}
      <div style={st.featureStrip}>
        {FEATURE_CARDS.map((f) => (
          <button
            key={f.title}
            style={st.featureCard}
            onClick={() => f.path && navigate(f.path)}
          >
            <span style={st.featureIcon}>{f.icon}</span>
            <span style={st.featureTitle}>{f.title}</span>
            <span style={st.featureDesc}>{f.desc}</span>
          </button>
        ))}
        <button style={st.upgradeBanner} onClick={() => navigate("/subscribe")}>
          <div style={st.upgradeTitle}>UPGRADE TO PREMIUM</div>
          <div style={st.upgradeDesc}>Unlock all components, AI features, cloud storage and more!</div>
          <div style={st.upgradeBtn}>💎 Upgrade</div>
        </button>
      </div>
    </div>
  );
}

function toggleSet(prev, key) {
  const next = new Set(prev);
  next.has(key) ? next.delete(key) : next.add(key);
  return next;
}

function HeaderStat({ icon, color, label, value }) {
  return (
    <div style={st.headerStat}>
      <span style={{ ...st.headerStatIcon, color }}>{icon}</span>
      <div>
        <div style={st.headerStatValue}>{value}</div>
        <div style={st.headerStatLabel}>{label}</div>
      </div>
    </div>
  );
}

function CollapsibleSection({ icon, label, count, expanded, onToggle, children }) {
  return (
    <div>
      <button style={st.categoryHeader} onClick={onToggle}>
        <span>{expanded ? "▾" : "▸"} {icon} {label}</span>
        <span style={st.categoryCount}>{count}</span>
      </button>
      {expanded && <div style={st.categoryBody}>{children}</div>}
    </div>
  );
}

function MiniMap({ placed }) {
  const scaleX = 130 / CANVAS_W;
  const scaleY = 74 / CANVAS_H;
  return (
    <div style={st.minimap}>
      <svg width={130} height={74} viewBox="0 0 130 74">
        <rect width={130} height={74} fill="#0d0d1a" stroke="#3d3d5c" />
        {placed.map((c) => (
          <rect
            key={c.id}
            x={c.x * scaleX} y={c.y * scaleY}
            width={Math.max(2, 40 * scaleX)} height={Math.max(2, 30 * scaleY)}
            fill={c.type === ARDUINO_META.type ? "#00b894" : "#6c63ff"}
            opacity={0.85}
          />
        ))}
      </svg>
    </div>
  );
}

function ProgressRing({ pct }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div style={st.ringWrap}>
      <svg width={84} height={84} viewBox="0 0 84 84">
        <circle cx={42} cy={42} r={r} fill="none" stroke="#252540" strokeWidth={8} />
        <circle
          cx={42} cy={42} r={r} fill="none" stroke="#a29bfe" strokeWidth={8}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          transform="rotate(-90 42 42)"
        />
      </svg>
      <div style={st.ringLabel}>
        <div style={st.ringPct}>{pct}%</div>
        <div style={st.ringSub}>Progress</div>
      </div>
    </div>
  );
}

function ProgressStat({ icon, label, value }) {
  return (
    <div style={st.progressStatRow}>
      <span style={st.progressStatIcon}>{icon}</span>
      <span style={st.progressStatLabel}>{label}</span>
      <span style={st.progressStatValue}>{value}</span>
    </div>
  );
}

function ComponentNode({ comp, selected, pendingPin, live, onSelect, onDrag, onPinClick }) {
  const meta = componentMeta(comp.type);
  const { width, height } = componentSize(comp);
  const isArduino = comp.type === ARDUINO_META.type;
  const caption = !isArduino ? valueCaption(comp.type, comp.values) : null;

  const startDrag = (e) => {
    e.stopPropagation();
    onSelect();
    const svg = e.currentTarget.ownerSVGElement;
    const start = { x: e.clientX, y: e.clientY };
    const rect = svg.getBoundingClientRect();
    const xScale = CANVAS_W / rect.width;
    const yScale = CANVAS_H / rect.height;
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
    <g transform={`translate(${comp.x},${comp.y})`}>
      {isArduino ? (
        <g onMouseDown={startDrag} style={{ cursor: "grab" }}>
          <ArduinoBoardArt w={width} h={height} />
          {selected && <rect x={-3} y={-3} width={width + 6} height={height + 6} rx={12} fill="none" stroke="#6c63ff" strokeWidth={2} />}
        </g>
      ) : (
        <>
          <rect
            x={0} y={0} width={width} height={height} rx={10}
            fill={selected ? "#2d2d55" : "#1c1c33"}
            stroke={selected ? "#6c63ff" : "#3d3d5c"} strokeWidth={selected ? 2 : 1}
            onMouseDown={startDrag}
            style={{ cursor: "grab" }}
          />
          <g pointerEvents="none">
            <ComponentShape type={comp.type} w={width} h={comp.type === "lcd1602" ? height : height * 0.62} values={{ ...comp.values, on: live }} />
          </g>
          {comp.type !== "lcd1602" && (
            <text x={width / 2} y={height * 0.62 + 12} fill="#e0e0e0" fontSize="10" fontWeight="700" textAnchor="middle">
              {meta.label}
            </text>
          )}
          {caption && (
            <text x={width / 2} y={height * 0.62 + 24} fill="#a29bfe" fontSize="9.5" fontWeight="700" textAnchor="middle">
              {caption}
            </text>
          )}
        </>
      )}
      {meta.pins.map((pinName) => {
        const pos = pinLocalPos(comp, pinName);
        const isTop = isArduino && ARDUINO_PINS_TOP.includes(pinName);
        const stem = isArduino
          ? (isTop ? { x2: pos.x, y2: pos.y + 14 } : { x2: pos.x, y2: pos.y - 14 })
          : { x2: pos.x, y2: pos.y - 10 };
        const isPending = pendingPin?.compId === comp.id && pendingPin?.pinName === pinName;
        return (
          <g key={pinName}>
            <line x1={pos.x} y1={pos.y} x2={stem.x2} y2={stem.y2} stroke="#5a5a72" strokeWidth={2} />
            <circle
              cx={pos.x} cy={pos.y} r={isArduino ? 4.5 : 6}
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

function PropRow({ label, value }) {
  return (
    <div style={st.propsRow}>
      <span style={st.propsLabel}>{label}</span>
      <div style={st.propsStatic}>{value}</div>
    </div>
  );
}

function PropField({ prop, comp, onChange }) {
  const value = comp.values?.[prop.key] ?? prop.default;
  if (prop.type === "range") {
    return (
      <label style={st.propsRow}>
        <div style={st.rangeHeaderRow}>
          <span style={st.propsLabel}>{prop.label}</span>
          <span style={st.rangeValue}>{value}{prop.unit}</span>
        </div>
        <input
          type="range" min={prop.min} max={prop.max} step={prop.step || 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={st.slider}
        />
        <div style={st.rangeMinMax}>
          <span>{prop.min}{prop.unit}</span>
          <span>{prop.max}{prop.unit}</span>
        </div>
      </label>
    );
  }
  if (prop.type === "text") {
    return (
      <label style={st.propsRow}>
        <span style={st.propsLabel}>{prop.label}</span>
        <input
          style={st.textInput}
          value={value}
          maxLength={16}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }
  return (
    <label style={st.propsRow}>
      <span style={st.propsLabel}>{prop.label}</span>
      <select
        style={st.propsSelect}
        value={value}
        onChange={(e) => {
          const raw = e.target.value;
          const num = Number(raw);
          onChange(Number.isNaN(num) || typeof prop.options[0] === "string" ? raw : num);
        }}
      >
        {prop.options.map((opt) => (
          <option key={opt} value={opt}>
            {typeof opt === "number" && opt >= 1000 && prop.unit === "Ω" ? `${opt / 1000}k${prop.unit}` : `${opt}${prop.unit}`}
          </option>
        ))}
      </select>
    </label>
  );
}

const st = {
  page:            { display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a14", fontFamily: "'Segoe UI',sans-serif", overflow: "hidden" },

  // Header
  topHeader:       { display: "flex", alignItems: "center", gap: 18, padding: "10px 18px", background: "#12121f", borderBottom: "1px solid #2a2a45", flexShrink: 0 },
  logoBlock:       { display: "flex", alignItems: "center", gap: 10, flexShrink: 0 },
  logoBadge:       { width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#7c5cff,#5b8cff)", color: "#fff", fontWeight: 900, fontSize: 15, display: "flex", alignItems: "center", justifyContent: "center" },
  logoTitle:       { color: "#fff", fontWeight: 800, fontSize: 13, letterSpacing: 0.5 },
  logoSub:         { color: "#8b9cbd", fontWeight: 700, fontSize: 9, letterSpacing: 1.5 },
  searchWrap:      { flex: 1, maxWidth: 420, position: "relative", display: "flex", alignItems: "center" },
  searchIcon:      { position: "absolute", left: 12, fontSize: 12, opacity: 0.6 },
  searchInput:     { width: "100%", background: "#1a1a2e", border: "1px solid #2a2a45", borderRadius: 20, color: "#fff", fontSize: 12.5, padding: "8px 12px 8px 32px", boxSizing: "border-box" },
  headerStats:     { display: "flex", gap: 14, flexShrink: 0 },
  headerStat:      { display: "flex", alignItems: "center", gap: 6 },
  headerStatIcon:  { fontSize: 15 },
  headerStatValue: { color: "#fff", fontWeight: 800, fontSize: 12.5, lineHeight: 1.1 },
  headerStatLabel: { color: "#6c7793", fontSize: 9, fontWeight: 700 },
  headerIcons:     { display: "flex", gap: 4, flexShrink: 0 },
  iconBtn:         { position: "relative", background: "none", border: "none", color: "#c7ccdb", fontSize: 16, cursor: "pointer", padding: 6, borderRadius: 8 },
  notifDot:        { position: "absolute", top: 4, right: 4, width: 6, height: 6, borderRadius: "50%", background: "#ff6b6b" },
  avatarBlock:     { display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", flexShrink: 0, padding: "2px 4px" },
  avatarCircle:    { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#7c5cff,#5b8cff)", color: "#fff", fontWeight: 800, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  avatarImg:       { width: "100%", height: "100%", objectFit: "cover" },
  avatarText:      { textAlign: "left" },
  avatarName:      { color: "#fff", fontWeight: 700, fontSize: 12 },
  avatarLevel:     { color: "#8b9cbd", fontSize: 10, fontWeight: 600 },
  chevron:         { color: "#6c7793", fontSize: 10 },

  // Main nav
  mainNav:         { display: "flex", gap: 2, padding: "0 14px", background: "#0f0f1e", borderBottom: "1px solid #2a2a45", flexShrink: 0, overflowX: "auto" },
  navTab:          { display: "flex", alignItems: "center", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#8b9cbd", fontWeight: 700, fontSize: 12, padding: "10px 14px", cursor: "pointer", whiteSpace: "nowrap" },
  navTabActive:    { color: "#fff", borderBottom: "2px solid #6c63ff", background: "#161628" },

  // Sub header
  subHeader:       { display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: "#1a1a2e", borderBottom: "1px solid #3d3d5c", flexShrink: 0, flexWrap: "wrap" },
  viewTabs:        { display: "flex", background: "#151527", borderRadius: 8, padding: 3, gap: 2 },
  viewTab:         { padding: "6px 12px", background: "none", border: "none", borderRadius: 6, color: "#8b9cbd", fontWeight: 700, fontSize: 11.5, cursor: "pointer" },
  viewTabActive:   { color: "#fff", background: "#2d2d55" },
  spacer:          { flex: 1 },
  btnGhost:        { background: "#252540", border: "1px solid #3d3d5c", borderRadius: 8, color: "#b2bec3", fontSize: 12, fontWeight: 700, padding: "6px 10px", cursor: "pointer" },
  btnGhostActive:  { background: "#3d3d6b", color: "#fff", border: "1px solid #6c63ff" },
  btnPrimarySm:    { background: "#6c63ff", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 800, padding: "6px 12px", cursor: "pointer" },
  btnRun:          { background: "#00b894", border: "none", borderRadius: 8, color: "#fff", fontSize: 12.5, fontWeight: 800, padding: "7px 14px", cursor: "pointer" },

  body:            { display: "flex", flex: 1, minHeight: 0 },

  // Palette
  palette:         { width: 230, flexShrink: 0, borderRight: "1px solid #3d3d5c", background: "#15152a", overflowY: "auto", padding: 10 },
  paletteHeaderRow:{ marginBottom: 8 },
  paletteTitle:    { color: "#c7ccdb", fontSize: 11, fontWeight: 800, letterSpacing: 0.6 },
  searchRow:       { display: "flex", gap: 6, marginBottom: 10 },
  search:          { flex: 1, background: "#232342", border: "1px solid #3d3d5c", borderRadius: 8, color: "#fff", fontSize: 12, padding: "7px 10px", boxSizing: "border-box" },
  filterBtn:       { background: "#232342", border: "1px solid #3d3d5c", borderRadius: 8, color: "#8b9cbd", fontSize: 13, padding: "0 10px", cursor: "pointer" },
  paletteSectionLabel: { color: "#8b9cbd", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 0 6px" },
  categoryHeader:  { display: "flex", justifyContent: "space-between", width: "100%", background: "none", border: "none", color: "#8b9cbd", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, padding: "8px 2px", cursor: "pointer" },
  categoryCount:   { color: "#5a6478" },
  categoryBody:    { marginBottom: 4 },
  emptyHint:       { color: "#5a6478", fontSize: 10.5, fontStyle: "italic", padding: "2px 4px 8px" },
  paletteItem:     { display: "block", width: "100%", textAlign: "left", background: "#1e1e3a", border: "1px solid #3d3d5c", borderRadius: 8, color: "#e0e0e0", fontSize: 11.5, padding: "7px 10px", marginBottom: 5, cursor: "pointer" },
  paletteItemRow:  { display: "flex", alignItems: "center", gap: 4, marginBottom: 5 },
  paletteItemFlex: { flex: 1, textAlign: "left", background: "#1e1e3a", border: "1px solid #3d3d5c", borderRadius: 8, color: "#e0e0e0", fontSize: 11.5, padding: "7px 10px", cursor: "pointer" },
  favStar:         { background: "none", border: "none", fontSize: 14, cursor: "pointer", padding: "0 4px" },
  popularWrap:     { marginTop: 6, borderTop: "1px solid #2a2a45", paddingTop: 10 },
  popularGrid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 },
  popularItem:     { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "#1e1e3a", border: "1px solid #3d3d5c", borderRadius: 8, padding: "8px 4px", cursor: "pointer" },
  popularLabel:    { color: "#c7ccdb", fontSize: 9, fontWeight: 700, textAlign: "center", lineHeight: 1.2 },
  viewAllBtn:      { width: "100%", background: "#1e1e3a", border: "1px solid #3d3d5c", borderRadius: 8, color: "#a29bfe", fontSize: 11, fontWeight: 700, padding: "8px 10px", cursor: "pointer" },

  // Center
  center:          { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" },
  canvasWrap:      { flex: "1 1 260px", position: "relative", background: "#12121f", overflow: "hidden", minHeight: 220, display: "flex", flexDirection: "column" },
  canvasToolbar:   { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#161628", borderBottom: "1px solid #2a2a45", flexShrink: 0 },
  toolGroup:       { display: "flex", alignItems: "center", gap: 4 },
  toolIcon:        { background: "#1e1e3a", border: "1px solid #3d3d5c", borderRadius: 6, color: "#c7ccdb", fontSize: 13, width: 28, height: 28, cursor: "pointer" },
  zoomLabel:       { color: "#c7ccdb", fontSize: 11, fontWeight: 700, padding: "0 4px", minWidth: 38, textAlign: "center" },
  canvasScroll:    { flex: 1, overflow: "auto", position: "relative" },
  svg:             { display: "block" },
  minimap:         { position: "absolute", right: 10, bottom: 10, background: "#161628", border: "1px solid #3d3d5c", borderRadius: 6, padding: 3 },
  comingSoon:      { flex: "1 1 260px", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a6478", fontSize: 13, textAlign: "center", padding: 40, minHeight: 220 },

  splitRow:        { display: "flex", height: 220, borderTop: "1px solid #3d3d5c", flexShrink: 0 },
  codePane:        { flex: 1.3, minWidth: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #3d3d5c", background: "#151525" },
  consolePane:     { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#151525" },
  fileTabs:        { display: "flex", background: "#1a1a2e", borderBottom: "1px solid #3d3d5c", flexShrink: 0, overflowX: "auto" },
  fileTab:         { padding: "7px 12px", background: "none", border: "none", color: "#8b9cbd", fontWeight: 700, fontSize: 11, cursor: "pointer", borderBottom: "2px solid transparent", whiteSpace: "nowrap" },
  fileTabActive:   { color: "#fff", borderBottom: "2px solid #a29bfe", background: "#1e1e38" },
  editor:          { flex: 1, background: "#151525", color: "#e0e0e0", border: "none", outline: "none", fontFamily: "monospace", fontSize: 12.5, padding: 12, resize: "none", lineHeight: 1.5 },
  editorStatus:    { display: "flex", justifyContent: "space-between", padding: "4px 10px", background: "#1a1a2e", borderTop: "1px solid #2a2a45", color: "#5a6478", fontSize: 10, flexShrink: 0 },

  serial:          { flex: 1, overflowY: "auto", padding: "8px 12px", fontFamily: "monospace", fontSize: 11.5, color: "#00e676" },
  serialEmpty:     { color: "#5a6478", fontSize: 11.5, fontStyle: "italic" },
  serialLine:      { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  errLine:         { whiteSpace: "pre-wrap", color: "#ff7675" },
  commandRow:      { display: "flex", gap: 6, padding: "8px 10px", borderTop: "1px solid #3d3d5c" },
  commandInput:    { flex: 1, background: "#232342", border: "1px solid #3d3d5c", borderRadius: 6, color: "#fff", fontSize: 11.5, padding: "6px 8px" },
  baudRow:         { display: "flex", justifyContent: "space-between", padding: "4px 10px 6px", color: "#5a6478", fontSize: 10 },

  toolbar:         { display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", background: "#1a1a2e", borderTop: "1px solid #3d3d5c", flexShrink: 0, flexWrap: "wrap" },
  speedGroup:      { display: "flex", alignItems: "center", gap: 6, marginLeft: 6 },
  speedLabel:      { color: "#8b9cbd", fontSize: 10.5, fontWeight: 700 },
  speedSelect:     { background: "#252540", border: "1px solid #3d3d5c", borderRadius: 6, color: "#fff", fontSize: 11, padding: "4px 6px" },
  statusPill:      { display: "flex", alignItems: "center", gap: 6, background: "#151527", border: "1px solid #3d3d5c", borderRadius: 20, padding: "5px 12px", fontSize: 11.5, color: "#c7ccdb", fontWeight: 700 },
  statusDot:       { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  elapsed:         { color: "#8b9cbd", fontWeight: 600, marginLeft: 4, fontFamily: "monospace" },

  // Right panel
  rightPanel:      { width: 270, flexShrink: 0, borderLeft: "1px solid #3d3d5c", background: "#15152a", overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 10 },
  card:            { background: "#1a1a2e", border: "1px solid #3d3d5c", borderRadius: 10, padding: 12 },
  cardHeaderRow:   { display: "flex", justifyContent: "space-between", alignItems: "center" },
  cardHeader:      { color: "#8b9cbd", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  propsBody:       { display: "flex", flexDirection: "column", gap: 10 },
  propsRow:        { display: "block" },
  propsLabel:      { display: "block", color: "#8b9cbd", fontSize: 10.5, fontWeight: 700, marginBottom: 4 },
  propsStatic:     { color: "#e0e0e0", fontSize: 12, fontWeight: 600 },
  propsSelect:     { width: "100%", background: "#252540", border: "1px solid #3d3d5c", borderRadius: 6, color: "#fff", fontSize: 12, padding: "6px 8px", boxSizing: "border-box" },
  textInput:       { width: "100%", background: "#252540", border: "1px solid #3d3d5c", borderRadius: 6, color: "#fff", fontSize: 12, padding: "6px 8px", boxSizing: "border-box" },
  rangeHeaderRow:  { display: "flex", justifyContent: "space-between", marginBottom: 4 },
  rangeValue:      { color: "#a29bfe", fontSize: 11, fontWeight: 800 },
  rangeMinMax:     { display: "flex", justifyContent: "space-between", color: "#5a6478", fontSize: 9, marginTop: 2 },
  slider:          { width: "100%" },
  deleteBtn:       { marginTop: 4, background: "#3d1f1f", border: "1px solid #5a2a2a", borderRadius: 8, color: "#ff7675", fontSize: 11.5, fontWeight: 700, padding: "7px 10px", cursor: "pointer" },
  sensorName:      { color: "#e0e0e0", fontSize: 12, fontWeight: 700, marginBottom: 6 },
  explorerTitle:   { width: "100%", background: "#232342", border: "1px solid #3d3d5c", borderRadius: 6, color: "#fff", fontSize: 11.5, fontWeight: 700, padding: "6px 8px", marginBottom: 8, boxSizing: "border-box" },
  explorerItem:    { display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: "#c7ccdb", fontSize: 11.5, padding: "4px 4px", cursor: "pointer", borderRadius: 4 },
  explorerItemActive: { background: "#252540", color: "#fff" },
  explorerFolder:  { color: "#8b9cbd", fontSize: 11.5, padding: "4px 4px" },

  progressRow:     { display: "flex", gap: 12, alignItems: "center" },
  ringWrap:        { position: "relative", width: 84, height: 84, flexShrink: 0 },
  ringLabel:       { position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  ringPct:         { color: "#fff", fontWeight: 800, fontSize: 15 },
  ringSub:         { color: "#8b9cbd", fontSize: 8, fontWeight: 700 },
  progressStats:   { display: "flex", flexDirection: "column", gap: 6, flex: 1, minWidth: 0 },
  progressStatRow: { display: "flex", alignItems: "center", gap: 6, fontSize: 10.5 },
  progressStatIcon:{ fontSize: 12 },
  progressStatLabel: { color: "#8b9cbd", flex: 1 },
  progressStatValue: { color: "#fff", fontWeight: 800 },

  // Bottom feature strip
  featureStrip:    { display: "flex", gap: 10, padding: "10px 12px", background: "#0f0f1e", borderTop: "1px solid #2a2a45", flexShrink: 0, overflowX: "auto" },
  featureCard:     { flex: 1, minWidth: 130, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, background: "#161628", border: "1px solid #2a2a45", borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left" },
  featureIcon:     { fontSize: 18 },
  featureTitle:    { color: "#fff", fontWeight: 800, fontSize: 11.5 },
  featureDesc:     { color: "#6c7793", fontSize: 9.5, lineHeight: 1.3 },
  upgradeBanner:   { flex: 1.3, minWidth: 180, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 4, background: "linear-gradient(135deg,#5b2fd6,#7c5cff)", border: "none", borderRadius: 10, padding: "10px 12px", cursor: "pointer", textAlign: "left" },
  upgradeTitle:    { color: "#fff", fontWeight: 900, fontSize: 11.5, letterSpacing: 0.3 },
  upgradeDesc:     { color: "#e4defe", fontSize: 9.5, lineHeight: 1.3 },
  upgradeBtn:      { marginTop: 4, background: "#fff", color: "#5b2fd6", fontWeight: 800, fontSize: 10.5, padding: "4px 10px", borderRadius: 6, alignSelf: "flex-start" },
};
