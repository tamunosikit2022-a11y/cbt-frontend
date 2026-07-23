import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { saveProject } from "./liveIdeApi";
import { compileSketch } from "./arduinoApi";
import { AVREmulator } from "./avrEmulator";
import {
  COMPONENTS, componentMeta, defaultValues, CATEGORY_ORDER,
  ARDUINO_META, ARDUINO_PINS_TOP, ARDUINO_PINS_BOTTOM, ARDUINO_PIN_TO_AVR,
  BREADBOARD_META, BREADBOARD_COLS, BREADBOARD_MARGIN_X, BREADBOARD_LAYOUT, BREADBOARD_TIE_ANCHOR_ROW,
  STARTER_FILES,
} from "./boardCatalog";
import { ComponentShape, valueCaption, ArduinoBoardArt, BreadboardArt } from "./componentShapes";

/**
 * ElectronicsLab.js — unified breadboard + code + serial monitor view.
 * Replaces the old split "Code tab / Circuit tab" (ArduinoIDE.js +
 * CircuitCanvas.js) with a single screen: a live-wired canvas (LEDs
 * actually light up from the running sketch via avr8js), a multi-file
 * code editor, and a streaming serial monitor — everything visible at
 * once, the way a real bench simulator works.
 *
 * Layout model: every part — Arduino, breadboard, LEDs, sensors, all of
 * it — lives in the same `placed[]` array and is dragged in from the
 * palette on the left. The center canvas is a blank workspace; nothing
 * is auto-placed or fixed in position. Students tap a part in the
 * palette to drop it onto the canvas, then drag it wherever they want —
 * onto the breadboard, next to another part, anywhere — and connect pins
 * by tapping one pin then another, the same gesture for every kind of
 * connection (part-to-breadboard, part-to-part, or part-to-Arduino).
 * There is no special-cased "the board is different from everything
 * else" logic left in this file.
 *
 * ArduinoIDE.js and CircuitCanvas.js are left in place untouched in case
 * anything else still imports them; this is additive, not a deletion.
 */

const WIRE_COLORS = ["#ff6b6b", "#feca57", "#1dd1a1", "#54a0ff", "#a29bfe", "#ff9ff3", "#00d2d3"];
const CANVAS_W = 1040;
const CANVAS_H = 500;
const POPULAR = [ARDUINO_META.type, BREADBOARD_META.type, "battery", "led", "resistor", "button", "potentiometer", "lcd1602", "hcsr04"];

function newId() { return Math.random().toString(36).slice(2, 9); }

// 2-terminal parts current genuinely flows straight across (used by
// recomputeLiveMap below to build the per-pin electrical graph).
const PASSTHROUGH_TYPES = new Set(["led", "resistor", "buzzer", "dcmotor", "button"]);
const nodeKey = (compId, pinName) => `${compId}::${pinName}`;

function componentSize(comp) {
  if (comp.type === ARDUINO_META.type) return { width: comp.w || 460, height: comp.h || 190 };
  if (comp.type === BREADBOARD_META.type) return { width: comp.w || 560, height: comp.h || 170 };
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
  if (comp.type === BREADBOARD_META.type) {
    const marginX = BREADBOARD_MARGIN_X;
    const colSpacing = (width - marginX * 2) / (BREADBOARD_COLS - 1);
    const L = BREADBOARD_LAYOUT;
    if (pinName[0] === "T") {
      const c = parseInt(pinName.slice(1), 10);
      return { x: marginX + (c - 1) * colSpacing, y: height * L.tieTopRows[BREADBOARD_TIE_ANCHOR_ROW] };
    }
    if (pinName[0] === "B") {
      const c = parseInt(pinName.slice(1), 10);
      return { x: marginX + (c - 1) * colSpacing, y: height * L.tieBottomRows[BREADBOARD_TIE_ANCHOR_ROW] };
    }
    if (pinName === "RAIL_TOP_POS") return { x: marginX, y: height * L.railTopPos };
    if (pinName === "RAIL_TOP_NEG") return { x: marginX, y: height * L.railTopNeg };
    if (pinName === "RAIL_BOT_POS") return { x: marginX, y: height * L.railBotPos };
    return { x: marginX, y: height * L.railBotNeg }; // RAIL_BOT_NEG
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

// How close (in canvas units) a leg has to land next to another hole/pin
// before it "plugs in" and auto-connects — like actually pushing a
// component's leg into a breadboard hole, instead of manually tapping two
// pins to draw a wire between them.
const SNAP_DIST = 14;

// A power rail runs the full length of the breadboard — plugging in
// anywhere along it works in real life, not just at one fixed spot. So
// for rail pins, find the nearest point *on the rail line* to the
// dragged leg, instead of always measuring to one fixed anchor. Every
// other kind of pin (a specific breadboard column, an Arduino header
// pin, a component leg) really is one fixed point, so those are
// unchanged.
function nearestPointOnPin(p, other, otherPinName) {
  if (other.type === BREADBOARD_META.type && otherPinName.startsWith("RAIL_")) {
    const { width, height } = componentSize(other);
    const L = BREADBOARD_LAYOUT;
    const yFrac = {
      RAIL_TOP_POS: L.railTopPos, RAIL_TOP_NEG: L.railTopNeg,
      RAIL_BOT_POS: L.railBotPos, RAIL_BOT_NEG: L.railBotNeg,
    }[otherPinName];
    const xMin = other.x + BREADBOARD_MARGIN_X;
    const xMax = other.x + width - BREADBOARD_MARGIN_X;
    return { x: Math.min(xMax, Math.max(xMin, p.x)), y: other.y + height * yFrac };
  }
  return pinAbsPos(other, otherPinName);
}

// For every pin on `dragged`, find the nearest other component's pin
// within SNAP_DIST (if any). Shared by the live-drag preview and the
// on-drop finalize step so they can never disagree with each other.
function findSnapMatches(dragged, allPlaced) {
  const draggedMeta = componentMeta(dragged.type);
  const matches = [];
  draggedMeta.pins.forEach((pinName) => {
    const p = pinAbsPos(dragged, pinName);
    let best = null;
    let bestDist = SNAP_DIST;
    allPlaced.forEach((other) => {
      if (other.id === dragged.id) return;
      const otherMeta = componentMeta(other.type);
      otherMeta.pins.forEach((otherPin) => {
        const op = nearestPointOnPin(p, other, otherPin);
        const d = Math.hypot(p.x - op.x, p.y - op.y);
        if (d < bestDist) { bestDist = d; best = { compId: other.id, pinName: otherPin, x: op.x, y: op.y }; }
      });
    });
    if (best) matches.push({ pinName, target: best });
  });
  return matches;
}

// An optional ready-to-go demo circuit (Arduino + breadboard + LED/resistor
// on pin 13, a potentiometer on A0, an HC-SR04 + DHT11 feeding an I2C LCD)
// that students can load from the toolbar if they want a worked example.
// It is NOT loaded automatically — new projects start on a blank canvas so
// the workspace never looks like a single fixed, uneditable circuit.
function buildDemoLayout() {
  const arduino = { id: newId(), type: ARDUINO_META.type, x: 40, y: 280, values: {} };
  const breadboard = { id: newId(), type: BREADBOARD_META.type, x: 40, y: 20, values: {} };
  const led = { id: newId(), type: "led", x: 300, y: 40, values: defaultValues("led") };
  const resistor = { id: newId(), type: "resistor", x: 300, y: 150, values: defaultValues("resistor") };
  const pot = { id: newId(), type: "potentiometer", x: 470, y: 40, values: defaultValues("potentiometer") };
  const hcsr04 = { id: newId(), type: "hcsr04", x: 620, y: 40, values: defaultValues("hcsr04") };
  const dht11 = { id: newId(), type: "dht11", x: 620, y: 150, values: defaultValues("dht11") };
  const lcd = { id: newId(), type: "lcd1602", x: 790, y: 40, values: defaultValues("lcd1602") };
  lcd.values.line1 = `Distance: ${hcsr04.values.distance} cm`;
  lcd.values.line2 = `Temp: ${dht11.values.temperature}C Hum: ${dht11.values.humidity}%`;

  const placed = [arduino, breadboard, led, resistor, pot, hcsr04, dht11, lcd];
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
  const empty = { placed: [], wires: [], files: { ...STARTER_FILES } };
  if (!project?.code) return empty;
  try {
    const parsed = JSON.parse(project.code);
    if (parsed && (parsed.components || parsed.files)) {
      return {
        placed: parsed.components || [],
        wires: parsed.wires || [],
        files: parsed.files || empty.files,
      };
    }
  } catch {
    // Legacy plain-text sketch saved by the old ArduinoIDE.js — start with
    // a blank circuit but load their existing code into main.ino.
    return { ...empty, files: { ...STARTER_FILES, "main.ino": project.code } };
  }
  return empty;
}

function formatElapsed(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `00:${m}:${s}`;
}

export default function ElectronicsLab({ project, onProjectSaved }) {
  const initial = useRef(loadInitialState(project)).current;

  const [title, setTitle] = useState(project?.title || "Untitled circuit");
  const [projectId, setProjectId] = useState(project?.id || null);
  const [placed, setPlaced] = useState(initial.placed);
  const [wires, setWires] = useState(initial.wires);
  const [files, setFiles] = useState(initial.files);
  const [activeFile, setActiveFile] = useState("main.ino");

  const [pendingPin, setPendingPin] = useState(null);
  const [selected, setSelected] = useState(null);
  const [view, setView] = useState("breadboard"); // breadboard | schematic | pcb
  const [consoleTab, setConsoleTab] = useState("serial"); // serial | compiler | debug

  const [status, setStatus] = useState("idle"); // idle | compiling | running | paused | error
  const [errors, setErrors] = useState(null);
  const [serialLines, setSerialLines] = useState([]);
  const [command, setCommand] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [liveMap, setLiveMap] = useState({});
  const [snapPreview, setSnapPreview] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(() => new Set(CATEGORY_ORDER));

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

  // Tracks which parts are electrically "live". This now models two real
  // facts about circuits that the previous version glossed over:
  //
  // 1. An LED is a diode — current only passes anode -> cathode, never
  //    the reverse. Plug one in backwards and it simply won't light,
  //    exactly like a real LED.
  // 2. Being touched by a wire from a HIGH pin isn't enough on its own —
  //    a real circuit needs a closed loop back to ground before current
  //    actually flows. So an LED only lights if its anode is reachable
  //    from power AND its cathode is separately reachable from GND.
  //
  // Everything still walks a per-PIN graph, not a per-component one — a
  // breadboard column isn't electrically the same as the column next to
  // it, and an Arduino's D2 pin isn't the same net as its D7 pin just
  // because they're on the same board.
  const recomputeLiveMap = useCallback(() => {
    const currentPlaced = placedRef.current;
    const currentWires = wiresRef.current;
    const arduino = currentPlaced.find((c) => c.type === ARDUINO_META.type);
    // NEW: battery packs are a second, independent power source — a
    // student should be able to light an LED with just a battery, a
    // resistor, and wires, with no Arduino on the canvas at all.
    const batteries = currentPlaced.filter((c) => c.type === "battery");
    if (!arduino && batteries.length === 0) { setLiveMap({}); return; }

    const highPins = new Set();
    if (arduino) {
      Object.entries(ARDUINO_PIN_TO_AVR).forEach(([pin, [port, bit]]) => {
        if ((pinBitsRef.current[port] >> bit) & 1) highPins.add(pin);
      });
    }

    // Undirected "wire network": the wires the student drew, plus internal
    // pass-through for genuine 2-terminal, non-polarized parts (a resistor,
    // buzzer, motor, or button really does conduct either direction).
    // The LED is excluded here — it gets its own directed edge below,
    // because unlike these other parts it's polarized. A battery is also
    // excluded — its two terminals are a source, not a conductor, so they
    // must never be treated as directly wired together internally.
    const undirected = {};
    const addUndirected = (a, b) => { (undirected[a] = undirected[a] || []).push(b); (undirected[b] = undirected[b] || []).push(a); };
    currentWires.forEach((w) => addUndirected(nodeKey(w.from.compId, w.from.pinName), nodeKey(w.to.compId, w.to.pinName)));
    currentPlaced.forEach((c) => {
      if (c.type === "led" || !PASSTHROUGH_TYPES.has(c.type)) return;
      const meta = componentMeta(c.type);
      if (meta?.pins?.length === 2) addUndirected(nodeKey(c.id, meta.pins[0]), nodeKey(c.id, meta.pins[1]));
    });

    // Directed edge anode -> cathode only, for every LED — this is the
    // diode behavior. Used only when walking forward from power; ground
    // reachability deliberately does not use this graph (current can't
    // flow backward through a diode to "reach" ground that way).
    const ledForward = {};
    currentPlaced.forEach((c) => {
      if (c.type !== "led") return;
      const a = nodeKey(c.id, "anode");
      (ledForward[a] = ledForward[a] || []).push(nodeKey(c.id, "cathode"));
    });

    const walk = (starts, graphs) => {
      const seen = new Set();
      const stack = [...starts];
      while (stack.length) {
        const node = stack.pop();
        if (seen.has(node)) continue;
        seen.add(node);
        graphs.forEach((g) => (g[node] || []).forEach((n) => { if (!seen.has(n)) stack.push(n); }));
      }
      return seen;
    };

    const powerStarts = [];
    if (arduino) {
      ARDUINO_META.pins.forEach((pin) => {
        if (highPins.has(pin) || pin === "5V" || pin === "3V3") powerStarts.push(nodeKey(arduino.id, pin));
      });
    }
    // NEW: every placed battery's "+" terminal is always a live power start
    // — unlike an Arduino digital pin, a battery isn't switched on/off by
    // code, it's just always on once wired in.
    batteries.forEach((b) => powerStarts.push(nodeKey(b.id, "+")));
    const poweredSet = walk(powerStarts, [undirected, ledForward]);

    const groundStarts = [];
    if (arduino) groundStarts.push(nodeKey(arduino.id, "GND"));
    batteries.forEach((b) => groundStarts.push(nodeKey(b.id, "-")));
    const groundedSet = walk(groundStarts, [undirected]);

    const sourceIds = new Set(batteries.map((b) => b.id));
    if (arduino) sourceIds.add(arduino.id);
    const map = {};
    poweredSet.forEach((node) => {
      const compId = node.split("::")[0];
      if (!sourceIds.has(compId)) map[compId] = true; // loose "touched by a powered net" flag for non-LED shapes
    });
    currentPlaced.forEach((c) => {
      if (c.type !== "led") return;
      map[c.id] = poweredSet.has(nodeKey(c.id, "anode")) && groundedSet.has(nodeKey(c.id, "cathode"));
    });

    setLiveMap(map);
  }, []);

  // Real-world safety checks, not just cosmetics — things that would
  // actually be dangerous or wrong on a real breadboard, caught the same
  // way a teacher would catch them by inspection (walking the wires
  // drawn), not by simulating current/voltage magnitudes.
  const wiringWarnings = useMemo(() => {
    const empty = { ledsMissingResistor: new Set(), shortCircuit: false };
    const arduino = placed.find((c) => c.type === ARDUINO_META.type);
    const batteries = placed.filter((c) => c.type === "battery");
    if (!arduino && batteries.length === 0) return empty;

    const adj = {};
    const addEdge = (a, b) => { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); };
    wires.forEach((w) => addEdge(nodeKey(w.from.compId, w.from.pinName), nodeKey(w.to.compId, w.to.pinName)));
    // A switch/buzzer/motor in the path doesn't remove the need for a
    // resistor, but it also doesn't block continuity — treat them as
    // transparent for this check, same as a plain wire would be.
    const TRANSPARENT = new Set(["button", "buzzer", "dcmotor"]);
    placed.forEach((c) => {
      if (!TRANSPARENT.has(c.type)) return;
      const meta = componentMeta(c.type);
      if (meta?.pins?.length === 2) addEdge(nodeKey(c.id, meta.pins[0]), nodeKey(c.id, meta.pins[1]));
    });

    // NEW: a battery's "+"/"-" terminals are power/ground nodes exactly
    // like the Arduino's 5V/VIN and GND pins — these two helpers let every
    // check below work the same way whether the source is an Arduino, a
    // battery, or (commonly, for a beginner project) just a battery alone.
    const POWER_PINS = new Set([...ARDUINO_PINS_TOP, "5V", "VIN"]);
    const isPowerNode = (compId, pinName) => {
      if (arduino && compId === arduino.id && POWER_PINS.has(pinName)) return true;
      return batteries.some((b) => b.id === compId) && pinName === "+";
    };
    const isGroundNode = (compId, pinName) => {
      if (arduino && compId === arduino.id && pinName === "GND") return true;
      return batteries.some((b) => b.id === compId) && pinName === "-";
    };

    // --- Check 1: LED with no current-limiting resistor in its path ---
    const ledsMissingResistor = new Set();
    placed.filter((c) => c.type === "led").forEach((led) => {
      const seen = new Set();
      const queue = [nodeKey(led.id, "anode"), nodeKey(led.id, "cathode")].map((n) => ({ node: n, hasResistor: false }));
      let flagged = false;
      while (queue.length) {
        const { node, hasResistor } = queue.shift();
        if (seen.has(node)) continue;
        seen.add(node);
        const [compId, pinName] = node.split("::");
        if (isPowerNode(compId, pinName) && !hasResistor) flagged = true;
        const comp = placed.find((c) => c.id === compId);
        const nextHasResistor = hasResistor || comp?.type === "resistor";
        (adj[node] || []).forEach((n) => { if (!seen.has(n)) queue.push({ node: n, hasResistor: nextHasResistor }); });
      }
      if (flagged) ledsMissingResistor.add(led.id);
    });

    // --- Check 2: dead short — power wired to GND with NOTHING current-
    // limiting anywhere in between (no resistor, no LED). This is the
    // real "paperclip across the battery" mistake, and it's dangerous
    // regardless of which parts happen to be involved — including when
    // the power source really is a battery, not just a figure of speech.
    let shortCircuit = false;
    {
      const seen = new Set();
      const queue = [];
      if (arduino) ["5V", "VIN", ...ARDUINO_PINS_TOP].forEach((pin) => queue.push(nodeKey(arduino.id, pin)));
      batteries.forEach((b) => queue.push(nodeKey(b.id, "+")));
      while (queue.length) {
        const node = queue.shift();
        if (seen.has(node)) continue;
        seen.add(node);
        const [compId, pinName] = node.split("::");
        if (isGroundNode(compId, pinName)) { shortCircuit = true; break; }
        const comp = placed.find((c) => c.id === compId);
        if (comp?.type === "resistor" || comp?.type === "led") continue; // current-limited or blocked here — don't propagate through it
        (adj[node] || []).forEach((n) => { if (!seen.has(n)) queue.push(n); });
      }
    }

    return { ledsMissingResistor, shortCircuit };
  }, [placed, wires]);

  // NEW: recomputeLiveMap used to only be triggered by the AVR emulator's
  // onPinChange callback, i.e. only while an Arduino sketch was actually
  // running. That left battery-only circuits (no Arduino, no code, no
  // emulator) permanently dark even when correctly wired. Recomputing
  // whenever the circuit itself changes covers that case too, on top of
  // the existing emulator-driven updates for Arduino-based circuits.
  useEffect(() => {
    recomputeLiveMap();
  }, [placed, wires, recomputeLiveMap]);

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

  const addComponent = useCallback((type) => {
    setPlaced((prev) => [
      ...prev,
      { id: newId(), type, x: 380 + (prev.length % 4) * 30, y: 180 + (prev.length % 3) * 20, values: defaultValues(type) },
    ]);
    markDirty();
  }, []);

  const loadDemo = useCallback(() => {
    if (placed.length && !window.confirm("Load the example circuit? This replaces everything currently on your canvas.")) {
      return;
    }
    const demo = buildDemoLayout();
    setPlaced(demo.placed);
    setWires(demo.wires);
    setSelected(null);
    markDirty();
  }, [placed.length]);

  const removeSelected = useCallback(() => {
    if (!selected) return;
    setPlaced((prev) => prev.filter((c) => c.id !== selected));
    setWires((prev) => prev.filter((w) => w.from.compId !== selected && w.to.compId !== selected));
    setSelected(null);
    markDirty();
  }, [selected]);

  const onDragComponent = useCallback((id, dx, dy) => {
    setPlaced((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, x: c.x + dx, y: c.y + dy } : c));
      const dragged = next.find((c) => c.id === id);
      const matches = findSnapMatches(dragged, next);
      setSnapPreview(new Set(matches.map((m) => `${m.target.compId}::${m.target.pinName}`)));
      return next;
    });
    markDirty();
  }, []);

  const onDragEnd = useCallback((id) => {
    setSnapPreview(new Set());
    const currentPlaced = placedRef.current;
    const dragged = currentPlaced.find((c) => c.id === id);
    if (!dragged) return;
    const matches = findSnapMatches(dragged, currentPlaced);
    if (!matches.length) return;

    const existingWires = wiresRef.current;
    const wireExists = (a, b) => existingWires.some((w) =>
      (w.from.compId === a.compId && w.from.pinName === a.pinName && w.to.compId === b.compId && w.to.pinName === b.pinName) ||
      (w.to.compId === a.compId && w.to.pinName === a.pinName && w.from.compId === b.compId && w.from.pinName === b.pinName)
    );

    const newWires = [];
    let snapDx = 0, snapDy = 0, hasSnap = false;
    matches.forEach(({ pinName, target }) => {
      const from = { compId: id, pinName };
      const to = { compId: target.compId, pinName: target.pinName };
      if (!wireExists(from, to)) newWires.push({ id: newId(), from, to });
      if (!hasSnap) {
        const p = pinAbsPos(dragged, pinName);
        snapDx = target.x - p.x;
        snapDy = target.y - p.y;
        hasSnap = true;
      }
    });

    if (hasSnap) setPlaced((prev) => prev.map((c) => (c.id === id ? { ...c, x: c.x + snapDx, y: c.y + snapDy } : c)));
    if (newWires.length) {
      setWires((prev) => [...prev, ...newWires]);
      markDirty();
    }
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
      onProjectSaved?.(saved);
    } catch {
      setErrors("Could not save your project. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [projectId, title, placed, wires, files, onProjectSaved]);

  const handleSendCommand = useCallback(() => {
    if (!command.trim()) return;
    setSerialLines((prev) => [...prev.slice(-499), `> ${command}`]);
    setCommand("");
  }, [command]);

  const selectedComp = placed.find((c) => c.id === selected);
  const sensors = placed.filter((c) => c.type === "dht11" || c.type === "hcsr04");
  const filteredComponents = COMPONENTS.filter((c) => c.label.toLowerCase().includes(search.toLowerCase()));
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat, items: filteredComponents.filter((c) => c.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.viewTabs}>
          {[["breadboard", "Breadboard View"], ["schematic", "Schematic View"], ["pcb", "PCB View"]].map(([v, label]) => (
            <button key={v} style={{ ...st.viewTab, ...(view === v ? st.viewTabActive : {}) }} onClick={() => setView(v)}>
              {label}
            </button>
          ))}
        </div>
        <input style={st.titleInput} value={title} onChange={(e) => { setTitle(e.target.value); markDirty(); }} />
        <button style={st.btnGhost} onClick={loadDemo}>🧪 Load Example</button>
        <button style={st.btnGhost} onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "💾 Save"}</button>
      </div>

      <div style={st.body}>
        <div style={st.palette}>
          <input
            style={st.search}
            placeholder="Search components…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div style={st.paletteSectionLabel}>Popular</div>
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

          {grouped.map(({ cat, items }) => (
            <div key={cat}>
              <button
                style={st.categoryHeader}
                onClick={() => setExpanded((prev) => {
                  const next = new Set(prev);
                  next.has(cat) ? next.delete(cat) : next.add(cat);
                  return next;
                })}
              >
                <span>{expanded.has(cat) ? "▾" : "▸"} {cat.toUpperCase()}</span>
                <span style={st.categoryCount}>{items.length}</span>
              </button>
              {expanded.has(cat) && items.map((c) => (
                <button key={c.type} style={st.paletteItem} onClick={() => addComponent(c.type)}>
                  <span style={{ fontSize: 15, marginRight: 8 }}>{c.icon}</span>{c.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        <div style={st.center}>
          {view !== "breadboard" ? (
            <div style={st.comingSoon}>
              {view === "schematic" ? "🧾" : "🖨️"} {view === "schematic" ? "Schematic view" : "PCB view"} is coming soon —
              build and simulate on the Breadboard view for now.
            </div>
          ) : (
            <div style={st.canvasWrap} onClick={() => setSelected(null)}>
              <svg width="100%" height="100%" viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`} style={st.svg}>
                <defs>
                  <pattern id="grid" width={20} height={20} patternUnits="userSpaceOnUse">
                    <circle cx={2} cy={2} r={0.8} fill="#232342" />
                  </pattern>
                </defs>
                <rect width={CANVAS_W} height={CANVAS_H} fill="#12121f" />
                <rect width={CANVAS_W} height={CANVAS_H} fill="url(#grid)" />
                {placed.length === 0 && (
                  <text x={CANVAS_W / 2} y={CANVAS_H / 2} fill="#4a5578" fontSize={14} fontWeight="700" textAnchor="middle">
                    Drag parts in from the palette on the left — start with a Breadboard and an Arduino Uno.
                  </text>
                )}

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
                    warning={wiringWarnings.ledsMissingResistor.has(comp.id)}
                    snapPreview={snapPreview}
                    onSelect={() => setSelected(comp.id)}
                    onDrag={onDragComponent}
                    onDragEnd={onDragEnd}
                    onPinClick={onPinClick}
                  />
                ))}
              </svg>
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
              </div>
              <textarea
                style={st.editor}
                spellCheck={false}
                value={files[activeFile]}
                onChange={(e) => { setFiles((prev) => ({ ...prev, [activeFile]: e.target.value })); markDirty(); }}
              />
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
            <button style={st.btnGhost} onClick={handleUpload} disabled={status === "compiling"}>⬆ Upload</button>
            {wiringWarnings.shortCircuit && (
              <div style={st.dangerPill} title="A power pin or rail is wired straight to GND with nothing current-limiting in between — this is a real short circuit and would damage a real board.">
                🔥 Short circuit
              </div>
            )}
            {wiringWarnings.ledsMissingResistor.size > 0 && (
              <div style={st.warnPill} title="An LED is wired straight to a pin/rail with no resistor — this can burn it out in real life.">
                ⚠ {wiringWarnings.ledsMissingResistor.size} wiring warning{wiringWarnings.ledsMissingResistor.size > 1 ? "s" : ""}
              </div>
            )}
            <div style={st.spacer} />
            <div style={st.statusPill}>
              <span style={{ ...st.statusDot, background: status === "running" ? "#00e676" : status === "error" ? "#ff5252" : "#5a6478" }} />
              {status === "running" ? "Live Simulation" : status === "paused" ? "Paused" : status === "error" ? "Error" : "Idle"}
              {status === "running" && <span style={st.elapsed}>{formatElapsed(elapsedSec)}</span>}
            </div>
          </div>
        </div>

        <div style={st.rightPanel}>
          <div style={st.card}>
            <div style={st.cardHeader}>Component Properties</div>
            {selectedComp ? (
              selectedComp.type === ARDUINO_META.type ? (
                <div style={st.propsBody}>
                  <PropRow label="Name" value="Arduino Uno R3" />
                  <PropRow label="Clock Frequency" value="16 MHz" />
                  <PropRow label="Operating Voltage" value="5V" />
                  <button style={st.deleteBtn} onClick={removeSelected}>🗑 Remove from canvas</button>
                </div>
              ) : selectedComp.type === BREADBOARD_META.type ? (
                <div style={st.propsBody}>
                  <PropRow label="Columns" value={BREADBOARD_COLS} />
                  <PropRow label="Tie-strips" value="Rows A–E and F–J, split by center gap" />
                  <PropRow label="Power rails" value="Top +/− and Bottom +/−" />
                  <button style={st.deleteBtn} onClick={removeSelected}>🗑 Remove from canvas</button>
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
            <div style={st.explorerLabel}>📁 {title}</div>
            {Object.keys(files).map((f) => (
              <button key={f} style={st.explorerItem} onClick={() => setActiveFile(f)}>📄 {f}</button>
            ))}
            <div style={st.explorerLabel}>🔧 components</div>
            {placed.map((c) => (
              <button key={c.id} style={st.explorerItem} onClick={() => setSelected(c.id)}>
                {componentMeta(c.type)?.icon} {componentMeta(c.type)?.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ComponentNode({ comp, selected, pendingPin, live, warning, snapPreview, onSelect, onDrag, onDragEnd, onPinClick }) {
  const meta = componentMeta(comp.type);
  const { width, height } = componentSize(comp);
  const isArduino = comp.type === ARDUINO_META.type;
  const isBreadboard = comp.type === BREADBOARD_META.type;
  const caption = !isArduino && !isBreadboard ? valueCaption(comp.type, comp.values) : null;

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
      onDragEnd(comp.id);
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
      ) : isBreadboard ? (
        <g onMouseDown={startDrag} style={{ cursor: "grab" }}>
          <BreadboardArt w={width} h={height} />
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
            <ComponentShape id={comp.id} type={comp.type} w={width} h={comp.type === "lcd1602" ? height : height * 0.62} values={{ ...comp.values, on: live }} />
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
      {warning && (
        <g transform={`translate(${width + 2},-2)`} style={{ cursor: "help" }}>
          <circle r={8} fill="#ff9800" stroke="#fff" strokeWidth={1} />
          <text x={0} y={3.5} fontSize={11} fontWeight="900" textAnchor="middle" fill="#1a1a1a">!</text>
          <title>No current-limiting resistor between this LED and the Arduino/power pin — in real life this can burn out the LED.</title>
        </g>
      )}
      {meta.pins.map((pinName) => {
        const pos = pinLocalPos(comp, pinName);
        const isTop = isArduino && ARDUINO_PINS_TOP.includes(pinName);
        const stem = isArduino
          ? (isTop ? { x2: pos.x, y2: pos.y + 14 } : { x2: pos.x, y2: pos.y - 14 })
          : isBreadboard
          ? { x2: pos.x, y2: pos.y } // holes sit flush in the board, no lead sticking out
          : { x2: pos.x, y2: pos.y - 10 };
        const isPending = pendingPin?.compId === comp.id && pendingPin?.pinName === pinName;
        const isSnapTarget = snapPreview?.has(`${comp.id}::${pinName}`);
        return (
          <g key={pinName}>
            {!isBreadboard && <line x1={pos.x} y1={pos.y} x2={stem.x2} y2={stem.y2} stroke="#5a5a72" strokeWidth={2} />}
            <circle
              cx={pos.x} cy={pos.y} r={isSnapTarget ? (isBreadboard ? 5 : 8) : isArduino ? 4.5 : isBreadboard ? 3.5 : 6}
              fill={isPending || isSnapTarget ? "#00e676" : isBreadboard ? "#3d3d5c" : "#6c63ff"}
              stroke="#fff" strokeWidth={isSnapTarget ? 2 : 1}
              onClick={(e) => { e.stopPropagation(); onPinClick(comp.id, pinName); }}
              style={{ cursor: "pointer" }}
            >
              <title>{pinName}</title>
            </circle>
          </g>
        );
      })}
      {isBreadboard && <BreadboardExtraHoles comp={comp} width={width} height={height} pendingPin={pendingPin} snapPreview={snapPreview} onPinClick={onPinClick} />}
    </g>
  );
}

// Every other physical hole on the breadboard that isn't the one canonical
// wire-anchor per node: the rest of each rail's length, and the other 4
// (of 5) holes in every tie-strip column. Clicking any of them wires to
// the exact same node as the canonical hole — because on a real
// breadboard, that's true: they're the same strip of metal underneath.
function BreadboardExtraHoles({ comp, width, height, pendingPin, snapPreview, onPinClick }) {
  const marginX = BREADBOARD_MARGIN_X;
  const colSpacing = (width - marginX * 2) / (BREADBOARD_COLS - 1);
  const L = BREADBOARD_LAYOUT;
  const dots = [];

  const dot = (key, x, y, pinName) => {
    const isPending = pendingPin?.compId === comp.id && pendingPin?.pinName === pinName;
    const isSnapTarget = snapPreview?.has(`${comp.id}::${pinName}`);
    dots.push(
      <circle
        key={key} cx={x} cy={y} r={isSnapTarget ? 4.5 : 3}
        fill={isPending || isSnapTarget ? "#00e676" : "#3d3d5c"}
        stroke="#fff" strokeWidth={isSnapTarget ? 1.4 : 0.6}
        onClick={(e) => { e.stopPropagation(); onPinClick(comp.id, pinName); }}
        style={{ cursor: "pointer" }}
      >
        <title>{pinName}</title>
      </circle>
    );
  };

  for (let c = 1; c <= BREADBOARD_COLS; c++) {
    const x = marginX + (c - 1) * colSpacing;
    // Rails: every column has a hole on all 4 rail lines (all one node per line).
    dot(`rtp-${c}`, x, height * L.railTopPos, "RAIL_TOP_POS");
    dot(`rtn-${c}`, x, height * L.railTopNeg, "RAIL_TOP_NEG");
    dot(`rbp-${c}`, x, height * L.railBotPos, "RAIL_BOT_POS");
    dot(`rbn-${c}`, x, height * L.railBotNeg, "RAIL_BOT_NEG");
    // Tie-strips: the 4 rows that aren't the canonical anchor, same node.
    L.tieTopRows.forEach((frac, i) => {
      if (i === BREADBOARD_TIE_ANCHOR_ROW) return;
      dot(`t-${c}-${i}`, x, height * frac, `T${c}`);
    });
    L.tieBottomRows.forEach((frac, i) => {
      if (i === BREADBOARD_TIE_ANCHOR_ROW) return;
      dot(`b-${c}-${i}`, x, height * frac, `B${c}`);
    });
  }
  return <>{dots}</>;
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
        <span style={st.propsLabel}>{prop.label}: {value}{prop.unit}</span>
        <input
          type="range" min={prop.min} max={prop.max} step={prop.step || 1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={st.slider}
        />
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
  wrap:            { display: "flex", flexDirection: "column", height: "100%", background: "#0f0f1e" },
  header:          { display: "flex", gap: 10, alignItems: "center", padding: "8px 12px", background: "#1a1a2e", borderBottom: "1px solid #3d3d5c", flexShrink: 0, flexWrap: "wrap" },
  viewTabs:        { display: "flex", background: "#151527", borderRadius: 8, padding: 3, gap: 2 },
  viewTab:         { padding: "6px 12px", background: "none", border: "none", borderRadius: 6, color: "#8b9cbd", fontWeight: 700, fontSize: 11.5, cursor: "pointer" },
  viewTabActive:   { color: "#fff", background: "#2d2d55" },
  titleInput:      { flex: 1, minWidth: 100, background: "#232342", border: "1px solid #3d3d5c", borderRadius: 8, color: "#fff", fontSize: 12.5, padding: "6px 10px", fontWeight: 700 },
  btnGhost:        { background: "#252540", border: "1px solid #3d3d5c", borderRadius: 8, color: "#b2bec3", fontSize: 12, fontWeight: 700, padding: "6px 10px", cursor: "pointer" },
  btnRun:          { background: "#00b894", border: "none", borderRadius: 8, color: "#fff", fontSize: 12.5, fontWeight: 800, padding: "7px 14px", cursor: "pointer" },
  body:            { display: "flex", flex: 1, minHeight: 0 },

  palette:         { width: 210, flexShrink: 0, borderRight: "1px solid #3d3d5c", background: "#15152a", overflowY: "auto", padding: 10 },
  search:          { width: "100%", background: "#232342", border: "1px solid #3d3d5c", borderRadius: 8, color: "#fff", fontSize: 12, padding: "7px 10px", marginBottom: 10, boxSizing: "border-box" },
  paletteSectionLabel: { color: "#8b9cbd", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, margin: "4px 0 6px" },
  popularGrid:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 },
  popularItem:     { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "#1e1e3a", border: "1px solid #3d3d5c", borderRadius: 8, padding: "8px 4px", cursor: "pointer" },
  popularLabel:    { color: "#c7ccdb", fontSize: 9, fontWeight: 700, textAlign: "center", lineHeight: 1.2 },
  categoryHeader:  { display: "flex", justifyContent: "space-between", width: "100%", background: "none", border: "none", color: "#8b9cbd", fontSize: 10.5, fontWeight: 800, letterSpacing: 0.4, padding: "8px 2px", cursor: "pointer" },
  categoryCount:   { color: "#5a6478" },
  paletteItem:     { display: "block", width: "100%", textAlign: "left", background: "#1e1e3a", border: "1px solid #3d3d5c", borderRadius: 8, color: "#e0e0e0", fontSize: 11.5, padding: "7px 10px", marginBottom: 5, cursor: "pointer" },

  center:          { flex: 1, minWidth: 0, display: "flex", flexDirection: "column" },
  canvasWrap:      { flex: "1 1 260px", position: "relative", background: "#12121f", overflow: "hidden", minHeight: 220 },
  svg:             { display: "block" },
  comingSoon:      { flex: "1 1 260px", display: "flex", alignItems: "center", justifyContent: "center", color: "#5a6478", fontSize: 13, textAlign: "center", padding: 40, minHeight: 220 },

  splitRow:        { display: "flex", height: 220, borderTop: "1px solid #3d3d5c", flexShrink: 0 },
  codePane:        { flex: 1.3, minWidth: 0, display: "flex", flexDirection: "column", borderRight: "1px solid #3d3d5c", background: "#151525" },
  consolePane:     { flex: 1, minWidth: 0, display: "flex", flexDirection: "column", background: "#151525" },
  fileTabs:        { display: "flex", background: "#1a1a2e", borderBottom: "1px solid #3d3d5c", flexShrink: 0, overflowX: "auto" },
  fileTab:         { padding: "7px 12px", background: "none", border: "none", color: "#8b9cbd", fontWeight: 700, fontSize: 11, cursor: "pointer", borderBottom: "2px solid transparent", whiteSpace: "nowrap" },
  fileTabActive:   { color: "#fff", borderBottom: "2px solid #a29bfe", background: "#1e1e38" },
  editor:          { flex: 1, background: "#151525", color: "#e0e0e0", border: "none", outline: "none", fontFamily: "monospace", fontSize: 12.5, padding: 12, resize: "none", lineHeight: 1.5 },

  serial:          { flex: 1, overflowY: "auto", padding: "8px 12px", fontFamily: "monospace", fontSize: 11.5, color: "#00e676" },
  serialEmpty:     { color: "#5a6478", fontSize: 11.5, fontStyle: "italic" },
  serialLine:      { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  errLine:         { whiteSpace: "pre-wrap", color: "#ff7675" },
  commandRow:      { display: "flex", gap: 6, padding: "8px 10px", borderTop: "1px solid #3d3d5c" },
  commandInput:    { flex: 1, background: "#232342", border: "1px solid #3d3d5c", borderRadius: 6, color: "#fff", fontSize: 11.5, padding: "6px 8px" },

  toolbar:         { display: "flex", gap: 8, alignItems: "center", padding: "8px 12px", background: "#1a1a2e", borderTop: "1px solid #3d3d5c", flexShrink: 0, flexWrap: "wrap" },
  spacer:          { flex: 1 },
  statusPill:      { display: "flex", alignItems: "center", gap: 6, background: "#151527", border: "1px solid #3d3d5c", borderRadius: 20, padding: "5px 12px", fontSize: 11.5, color: "#c7ccdb", fontWeight: 700 },
  warnPill:        { display: "flex", alignItems: "center", gap: 6, background: "#3a2a10", border: "1px solid #ff9800", borderRadius: 20, padding: "5px 12px", fontSize: 11.5, color: "#ffb74d", fontWeight: 700, cursor: "help" },
  dangerPill:      { display: "flex", alignItems: "center", gap: 6, background: "#3a1010", border: "1px solid #ff5252", borderRadius: 20, padding: "5px 12px", fontSize: 11.5, color: "#ff8a80", fontWeight: 800, cursor: "help" },
  statusDot:       { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  elapsed:         { color: "#8b9cbd", fontWeight: 600, marginLeft: 4, fontFamily: "monospace" },

  rightPanel:      { width: 260, flexShrink: 0, borderLeft: "1px solid #3d3d5c", background: "#15152a", overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 10 },
  card:            { background: "#1a1a2e", border: "1px solid #3d3d5c", borderRadius: 10, padding: 12 },
  cardHeader:      { color: "#8b9cbd", fontSize: 10.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  propsBody:       { display: "flex", flexDirection: "column", gap: 10 },
  propsRow:        { display: "block" },
  propsLabel:      { display: "block", color: "#8b9cbd", fontSize: 10.5, fontWeight: 700, marginBottom: 4 },
  propsStatic:     { color: "#e0e0e0", fontSize: 12, fontWeight: 600 },
  propsSelect:     { width: "100%", background: "#252540", border: "1px solid #3d3d5c", borderRadius: 6, color: "#fff", fontSize: 12, padding: "6px 8px", boxSizing: "border-box" },
  textInput:       { width: "100%", background: "#252540", border: "1px solid #3d3d5c", borderRadius: 6, color: "#fff", fontSize: 12, padding: "6px 8px", boxSizing: "border-box" },
  slider:          { width: "100%" },
  deleteBtn:       { marginTop: 4, background: "#3d1f1f", border: "1px solid #5a2a2a", borderRadius: 8, color: "#ff7675", fontSize: 11.5, fontWeight: 700, padding: "7px 10px", cursor: "pointer" },
  sensorName:      { color: "#e0e0e0", fontSize: 12, fontWeight: 700, marginBottom: 6 },
  explorerLabel:   { color: "#8b9cbd", fontSize: 10.5, fontWeight: 800, margin: "8px 0 4px" },
  explorerItem:    { display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: "#c7ccdb", fontSize: 11.5, padding: "4px 4px", cursor: "pointer" },
};
