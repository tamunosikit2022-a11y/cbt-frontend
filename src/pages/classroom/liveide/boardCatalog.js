/**
 * boardCatalog.js — Phase 2 board + component metadata.
 * Single source of truth so ArduinoIDE.js, CircuitCanvas.js, and the
 * backend's compileController.js all agree on what "arduino_uno" etc. means.
 * Keep BOARDS' `value` in sync with BOARD_FQBN in compileController.js.
 */

export const BOARDS = [
  { value: "arduino_uno",       label: "Arduino Uno",       pins: 20, digitalPins: 14, analogPins: 6, ledPin: 13 },
  { value: "arduino_nano",      label: "Arduino Nano",      pins: 22, digitalPins: 14, analogPins: 8, ledPin: 13 },
  { value: "arduino_mega",      label: "Arduino Mega 2560", pins: 70, digitalPins: 54, analogPins: 16, ledPin: 13 },
  { value: "arduino_leonardo",  label: "Arduino Leonardo",  pins: 20, digitalPins: 20, analogPins: 12, ledPin: 13 },
];

export function boardMeta(value) {
  return BOARDS.find((b) => b.value === value) || BOARDS[0];
}

// Real Uno pin header layout, simplified to two straight rows (top =
// digital, bottom = power/analog) so wiring targets stay easy to click.
export const ARDUINO_PINS_TOP = ["D0","D1","D2","D3","D4","D5","D6","D7","D8","D9","D10","D11","D12","D13"];
export const ARDUINO_PINS_BOTTOM = ["GND","5V","3V3","VIN","A0","A1","A2","A3","A4","A5"];

export const ARDUINO_META = {
  type: "arduino_uno_board",
  label: "Arduino Uno R3",
  icon: "🔷",
  category: "Boards",
  pins: [...ARDUINO_PINS_TOP, ...ARDUINO_PINS_BOTTOM],
  props: [],
};

// A real breadboard's holes are electrically grouped: every hole in a
// 5-hole column on one side of the center gap is one node (rows a-e tied
// together, rows f-j tied together, separately), and each power rail
// (top+/top-/bottom+/bottom-) is one long node running the board's full
// length. So instead of exposing ~630 individual holes as separate pins,
// we expose one pin per *electrical node* — but every physical hole that
// belongs to that node is still drawn and still clickable, so nothing
// looks or behaves differently from plugging into any hole on a real
// board.
export const BREADBOARD_COLS = 20;
export const BREADBOARD_MARGIN_X = 26;

// Row fractions (0 = top edge, 1 = bottom edge), matching the layout of
// an actual full-size breadboard: power rail pair near each edge, a
// 5-row tie-strip block on each side of the center IC channel.
export const BREADBOARD_LAYOUT = {
  railTopPos: 0.11, railTopNeg: 0.20,
  tieTopRows: [0.30, 0.35, 0.40, 0.45, 0.50],   // rows a, b, c, d, e
  tieBottomRows: [0.58, 0.63, 0.68, 0.73, 0.78], // rows f, g, h, i, j
  railBotPos: 0.80, railBotNeg: 0.89,
};
// Index into tieTopRows/tieBottomRows used as the "canonical" wire anchor
// for a column (the other 4 rows are equally valid click targets — they're
// the same electrical node — this just picks where a wire visually lands).
export const BREADBOARD_TIE_ANCHOR_ROW = 2;

function breadboardPins() {
  const pins = [];
  for (let c = 1; c <= BREADBOARD_COLS; c++) pins.push(`T${c}`); // top tie-strip (rows a-e)
  for (let c = 1; c <= BREADBOARD_COLS; c++) pins.push(`B${c}`); // bottom tie-strip (rows f-j)
  pins.push("RAIL_TOP_POS", "RAIL_TOP_NEG", "RAIL_BOT_POS", "RAIL_BOT_NEG");
  return pins;
}
export const BREADBOARD_META = {
  type: "breadboard",
  label: "Breadboard",
  icon: "🟫",
  category: "Boards",
  pins: breadboardPins(),
  props: [],
};

// Phase 2 starter component library (per the roadmap: start with 10).
// `props` describes the editable, real-world attributes each component
// carries on a physical breadboard (a resistor really is "just a value",
// an LED really does come in a handful of colors, etc). CircuitCanvas
// reads this to build the properties panel and to compute things like
// resistor color bands.
//
// The Arduino and the Breadboard live in this same list now (category
// "Boards") — like every other part, they're dragged in from the palette,
// moved freely, and can be deleted. Nothing on the canvas is hardcoded.
export const COMPONENTS = [
  ARDUINO_META,
  BREADBOARD_META,
  {
    // NEW: a real, independent power source — lets a circuit run on its
    // own (LED + resistor + battery, no Arduino needed at all) instead of
    // every circuit being implicitly required to have a board on canvas.
    type: "battery", label: "Battery Pack", icon: "🔋", category: "Power Sources", pins: ["+", "-"],
    props: [{ key: "voltage", label: "Voltage", type: "select", unit: "V", default: 9,
      options: [1.5, 3, 4.5, 6, 9, 12] }],
  },
  {
    type: "led", label: "LED", icon: "💡", category: "Semiconductors", pins: ["anode", "cathode"],
    props: [{ key: "color", label: "Color", type: "select", unit: "", default: "red",
      options: ["red", "green", "blue", "yellow", "white"] }],
  },
  {
    type: "resistor", label: "Resistor", icon: "▭", category: "Passive Components", pins: ["a", "b"],
    props: [{ key: "value", label: "Resistance", type: "select", unit: "Ω", default: 220,
      options: [100, 220, 330, 470, 560, 1000, 2200, 4700, 10000, 100000] }],
  },
  {
    type: "button", label: "Push Button", icon: "🔘", category: "Input Devices", pins: ["1", "2"],
    props: [],
  },
  {
    type: "potentiometer", label: "Potentiometer", icon: "🎚️", category: "Input Devices", pins: ["vcc", "wiper", "gnd"],
    props: [{ key: "value", label: "Max resistance", type: "select", unit: "Ω", default: 10000,
      options: [1000, 10000, 100000] }],
  },
  {
    type: "buzzer", label: "Buzzer", icon: "🔊", category: "Output Devices", pins: ["+", "-"],
    props: [{ key: "variant", label: "Type", type: "select", unit: "", default: "active",
      options: ["active", "passive"] }],
  },
  {
    type: "dht11", label: "DHT11 (temp/hum)", icon: "🌡️", category: "Sensors", pins: ["vcc", "data", "gnd"],
    props: [
      { key: "temperature", label: "Simulated temp", type: "range", unit: "°C", default: 26, min: -20, max: 60, step: 0.1 },
      { key: "humidity", label: "Simulated humidity", type: "range", unit: "%", default: 55, min: 0, max: 100, step: 1 },
    ],
  },
  {
    type: "hcsr04", label: "HC-SR04 (sonar)", icon: "📡", category: "Sensors", pins: ["vcc", "trig", "echo", "gnd"],
    props: [{ key: "distance", label: "Simulated distance", type: "range", unit: "cm", default: 23, min: 2, max: 400, step: 1 }],
  },
  {
    type: "servo", label: "Servo Motor", icon: "⚙️", category: "Motors", pins: ["vcc", "signal", "gnd"],
    props: [{ key: "range", label: "Rotation range", type: "select", unit: "°", default: 180,
      options: [90, 180, 360] }],
  },
  {
    type: "sevenseg", label: "7-Segment Display", icon: "🔢", category: "Displays", pins: ["a","b","c","d","e","f","g","gnd"],
    props: [{ key: "common", label: "Common", type: "select", unit: "", default: "cathode",
      options: ["cathode", "anode"] }],
  },
  {
    type: "dcmotor", label: "DC Motor", icon: "🌀", category: "Motors", pins: ["+", "-"],
    props: [{ key: "voltage", label: "Rated voltage", type: "select", unit: "V", default: 6,
      options: [3, 5, 6, 9, 12] }],
  },
  {
    type: "lcd1602", label: "LCD 16x2 (I2C)", icon: "🖥️", category: "Displays", pins: ["gnd", "vcc", "sda", "scl"],
    props: [
      { key: "line1", label: "Line 1", type: "text", default: "Distance: 23 cm" },
      { key: "line2", label: "Line 2", type: "text", default: "Temp: 28.6 C" },
    ],
  },
];

export const CATEGORY_ORDER = [
  "Boards", "Power Sources", "Passive Components", "Semiconductors", "Sensors",
  "Displays", "Motors", "Input Devices", "Output Devices",
];

// Digital pin -> (avr8js port letter, bit index) so live pin state from the
// running emulator can drive whatever's wired to that pin on the canvas.
export const ARDUINO_PIN_TO_AVR = {
  D0: ["D", 0], D1: ["D", 1], D2: ["D", 2], D3: ["D", 3], D4: ["D", 4], D5: ["D", 5], D6: ["D", 6], D7: ["D", 7],
  D8: ["B", 0], D9: ["B", 1], D10: ["B", 2], D11: ["B", 3], D12: ["B", 4], D13: ["B", 5],
  A0: ["C", 0], A1: ["C", 1], A2: ["C", 2], A3: ["C", 3], A4: ["C", 4], A5: ["C", 5],
};

export const STARTER_FILES = {
  "main.ino": `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("LED ON");
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("LED OFF");
  delay(500);
}
`,
  "functions.h": `// Put reusable helper functions here, then #include "functions.h"
// from main.ino if you want to call them.
`,
  "config.h": `// Pin numbers and constants shared across your sketch.
#define LED_PIN 13
`,
};

export function componentMeta(type) {
  return COMPONENTS.find((c) => c.type === type);
}

// Default `values` for a freshly-placed component, built from its props.
export function defaultValues(type) {
  const meta = componentMeta(type);
  const values = {};
  (meta?.props || []).forEach((p) => { values[p.key] = p.default; });
  return values;
}

export const STARTER_SKETCH = `void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  Serial.println("LED ON");
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  Serial.println("LED OFF");
  delay(500);
}
`;
