/**
 * componentShapes.js — realistic-ish SVG glyphs for the circuit palette.
 * Each placed component used to render as the same rounded rectangle with
 * a text label; this gives every type its own recognizable silhouette
 * (LED bulb, striped resistor body, sonar "eyes", 7-segment digit, etc.)
 * so students can tell them apart at a glance, the way they'd recognize
 * the real parts on a breadboard.
 *
 * Every shape function draws inside a local (0,0)-origin box of the given
 * width/height — CircuitCanvas positions it with a <g transform="translate">.
 */

import { BREADBOARD_COLS, BREADBOARD_MARGIN_X, BREADBOARD_LAYOUT } from "./boardCatalog";

const LED_COLORS = {
  red: "#ff5252", green: "#00e676", blue: "#448aff", yellow: "#ffd740", white: "#f5f5f5",
};

// Standard 4-band resistor color code, generated from the numeric value.
const BAND_COLORS = ["#1a1a1a", "#7b4a12", "#e53935", "#fb8c00", "#fdd835", "#43a047", "#1e88e5", "#8e24aa", "#9e9e9e", "#ffffff"];
export function resistorBands(value) {
  const digits = String(Math.round(value));
  if (digits.length < 2) {
    return [BAND_COLORS[0], BAND_COLORS[digits] || BAND_COLORS[0], BAND_COLORS[0], "#d4af37"];
  }
  const d1 = Number(digits[0]);
  const d2 = Number(digits[1]);
  const mult = digits.length - 2;
  return [BAND_COLORS[d1], BAND_COLORS[d2], BAND_COLORS[Math.min(mult, 9)] || "#d4af37", "#d4af37"];
}

function Led({ w, h, values }) {
  const color = LED_COLORS[values?.color] || LED_COLORS.red;
  const cx = w / 2, cy = h * 0.42;
  const lit = Boolean(values?.on);
  return (
    <>
      {lit && <circle cx={cx} cy={cy} r={h * 0.55} fill={color} opacity={0.28} />}
      <circle cx={cx} cy={cy} r={h * 0.32} fill={color} opacity={lit ? 0.9 : 0.35} />
      <path
        d={`M ${cx - h * 0.22} ${cy + h * 0.1}
            A ${h * 0.22} ${h * 0.22} 0 1 1 ${cx + h * 0.22} ${cy + h * 0.1}
            L ${cx + h * 0.22} ${cy + h * 0.22} L ${cx - h * 0.22} ${cy + h * 0.22} Z`}
        fill={color} stroke="#fff" strokeWidth={0.6}
      />
      <rect x={cx - h * 0.22} y={cy + h * 0.16} width={h * 0.44} height={h * 0.08} fill={color} />
    </>
  );
}

function Resistor({ w, h, values }) {
  const bodyY = h * 0.38, bodyH = h * 0.24;
  const bands = resistorBands(values?.value ?? 220);
  return (
    <>
      <line x1={0} y1={h * 0.5} x2={w * 0.18} y2={h * 0.5} stroke="#c9b37c" strokeWidth={2} />
      <line x1={w * 0.82} y1={h * 0.5} x2={w} y2={h * 0.5} stroke="#c9b37c" strokeWidth={2} />
      <rect x={w * 0.18} y={bodyY} width={w * 0.64} height={bodyH} rx={4} fill="#e8cf9a" stroke="#8a7238" strokeWidth={0.6} />
      {bands.map((c, i) => (
        <rect key={i} x={w * 0.26 + i * (w * 0.11)} y={bodyY} width={4} height={bodyH} fill={c} />
      ))}
    </>
  );
}

function PushButton({ w, h }) {
  const cx = w / 2, cy = h * 0.42, s = h * 0.34;
  return (
    <>
      <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} rx={3} fill="#3a3a3a" stroke="#111" strokeWidth={1} />
      <rect x={cx - s * 0.6} y={cy - s * 0.6} width={s * 1.2} height={s * 1.2} rx={2} fill="#5d5d5d" />
      <circle cx={cx} cy={cy} r={s * 0.35} fill="#222" />
    </>
  );
}

function Potentiometer({ w, h }) {
  const cx = w / 2, cy = h * 0.42, r = h * 0.3;
  return (
    <>
      <rect x={cx - r * 1.3} y={cy - r} width={r * 2.6} height={r * 1.9} rx={3} fill="#2f6b4f" stroke="#0f3524" strokeWidth={0.8} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill="#c9c9c9" stroke="#666" strokeWidth={0.8} />
      <line x1={cx} y1={cy} x2={cx + r * 0.5} y2={cy - r * 0.35} stroke="#333" strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

function Buzzer({ w, h }) {
  const cx = w / 2, cy = h * 0.42, r = h * 0.32;
  return (
    <>
      <circle cx={cx} cy={cy} r={r} fill="#3a3a3a" stroke="#111" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#1c1c1c" />
      <circle cx={cx} cy={cy} r={r * 0.18} fill="#c9a227" />
    </>
  );
}

function Dht11({ w, h }) {
  const bx = w * 0.2, by = h * 0.16, bw = w * 0.6, bh = h * 0.5;
  return (
    <>
      <rect x={bx} y={by} width={bw} height={bh} rx={3} fill="#2b6cb0" stroke="#173e6b" strokeWidth={0.8} />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          {[0, 1, 2].map((cIdx) => (
            <circle key={cIdx} cx={bx + bw * (0.22 + cIdx * 0.28)} cy={by + bh * (0.28 + r * 0.24)} r={1.4} fill="#a7c7e7" />
          ))}
        </g>
      ))}
    </>
  );
}

function HcSr04({ w, h }) {
  const bx = w * 0.08, by = h * 0.2, bw = w * 0.84, bh = h * 0.4;
  const cy = by + bh / 2;
  return (
    <>
      <rect x={bx} y={by} width={bw} height={bh} rx={3} fill="#1f6b4f" stroke="#0d2f22" strokeWidth={0.8} />
      <circle cx={bx + bw * 0.28} cy={cy} r={bh * 0.42} fill="#dcdcdc" stroke="#8a8a8a" strokeWidth={1} />
      <circle cx={bx + bw * 0.28} cy={cy} r={bh * 0.18} fill="#8a8a8a" />
      <circle cx={bx + bw * 0.72} cy={cy} r={bh * 0.42} fill="#dcdcdc" stroke="#8a8a8a" strokeWidth={1} />
      <circle cx={bx + bw * 0.72} cy={cy} r={bh * 0.18} fill="#8a8a8a" />
    </>
  );
}

function Servo({ w, h }) {
  const bx = w * 0.14, by = h * 0.2, bw = w * 0.55, bh = h * 0.5;
  return (
    <>
      <rect x={bx} y={by} width={bw} height={bh} rx={2} fill="#2c5aa0" stroke="#163a6b" strokeWidth={0.8} />
      <rect x={bx + bw * 0.22} y={by - h * 0.1} width={bw * 0.28} height={h * 0.14} rx={2} fill="#1c1c1c" />
      <line x1={bx + bw * 0.36} y1={by - h * 0.1} x2={bx + bw * 0.7} y2={by - h * 0.18} stroke="#e0e0e0" strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

function SevenSeg({ w, h }) {
  const bx = w * 0.14, by = h * 0.1, bw = w * 0.5, bh = h * 0.62;
  const on = "#ff5252", off = "#4a1f1f";
  const seg = (x1, y1, x2, y2, color, sw) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} strokeLinecap="round" />
  );
  const L = bx, R = bx + bw, T = by, M = by + bh / 2, B = by + bh;
  const sw = Math.max(2, bw * 0.14);
  return (
    <>
      <rect x={bx - 3} y={by - 3} width={bw + 6} height={bh + 6} rx={2} fill="#1a1a1a" />
      {seg(L + 2, T, R - 2, T, on, sw)}
      {seg(R, T + 2, R, M - 2, on, sw)}
      {seg(R, M + 2, R, B - 2, off, sw)}
      {seg(L + 2, B, R - 2, B, on, sw)}
      {seg(L, M + 2, L, B - 2, on, sw)}
      {seg(L, T + 2, L, M - 2, off, sw)}
      {seg(L + 2, M, R - 2, M, on, sw)}
    </>
  );
}

function DcMotor({ w, h }) {
  const cx = w / 2, cy = h * 0.42, r = h * 0.32;
  return (
    <>
      <rect x={cx - r * 0.18} y={cy - r * 1.35} width={r * 0.36} height={r * 0.5} fill="#888" />
      <circle cx={cx} cy={cy} r={r} fill="#5a5a5a" stroke="#222" strokeWidth={1} />
      <circle cx={cx} cy={cy} r={r * 0.35} fill="#2b2b2b" />
    </>
  );
}

function Lcd1602({ w, h, values }) {
  const bx = w * 0.03, by = h * 0.06, bw = w * 0.94, bh = h * 0.62;
  const line1 = (values?.line1 || "").slice(0, 16);
  const line2 = (values?.line2 || "").slice(0, 16);
  return (
    <>
      <rect x={0} y={by - h * 0.02} width={w} height={bh + h * 0.08} rx={4} fill="#0f2e1f" stroke="#08170f" strokeWidth={1.5} />
      <rect x={bx} y={by} width={bw} height={bh} rx={2} fill="#1f6b3f" stroke="#0a2e1a" strokeWidth={1} />
      <text x={bx + 6} y={by + bh * 0.42} fill="#c7ffcf" fontSize={Math.max(8, bh * 0.26)} fontFamily="monospace" fontWeight="700">{line1}</text>
      <text x={bx + 6} y={by + bh * 0.82} fill="#c7ffcf" fontSize={Math.max(8, bh * 0.26)} fontFamily="monospace" fontWeight="700">{line2}</text>
    </>
  );
}

// A simplified-but-recognizable Arduino Uno R3 silhouette: blue PCB, USB-B
// port, barrel jack, the big black IC, reset button, and header-pin strips
// along the top/bottom edges (the actual clickable pin dots are drawn by
// the canvas on top of this, positioned via ARDUINO_PINS_TOP/BOTTOM).
export function ArduinoBoardArt({ w, h }) {
  return (
    <>
      <rect x={0} y={0} width={w} height={h} rx={10} fill="#0d6fb8" stroke="#073e66" strokeWidth={2} />
      <rect x={0} y={0} width={w} height={h} rx={10} fill="none" stroke="#1c8fe0" strokeWidth={1} opacity={0.5} />
      {/* USB port */}
      <rect x={w * 0.03} y={h * 0.08} width={w * 0.15} height={h * 0.22} rx={2} fill="#c7c7c7" stroke="#888" strokeWidth={1} />
      {/* Barrel jack */}
      <circle cx={w * 0.09} cy={h * 0.62} r={h * 0.13} fill="#1a1a1a" stroke="#000" strokeWidth={1} />
      <circle cx={w * 0.09} cy={h * 0.62} r={h * 0.06} fill="#3a3a3a" />
      {/* Big IC */}
      <rect x={w * 0.36} y={h * 0.32} width={w * 0.22} height={h * 0.32} rx={1} fill="#141414" stroke="#000" strokeWidth={1} />
      <text x={w * 0.47} y={h * 0.5} fill="#555" fontSize={h * 0.07} textAnchor="middle" fontFamily="monospace">328P</text>
      {/* Reset button */}
      <rect x={w * 0.63} y={h * 0.1} width={h * 0.14} height={h * 0.14} rx={2} fill="#1a1a1a" />
      {/* Header pin strips */}
      <rect x={w * 0.02} y={-3} width={w * 0.96} height={6} fill="#101010" />
      <rect x={w * 0.02} y={h - 3} width={w * 0.96} height={6} fill="#101010" />
      {/* Silkscreen label */}
      <text x={w * 0.6} y={h * 0.85} fill="#bfe3ff" fontSize={h * 0.14} fontWeight="800" fontFamily="sans-serif" letterSpacing={1}>UNO</text>
    </>
  );
}

// Full breadboard backplate — two 5-row tie-strip blocks (rows a-e and
// f-j) plus red/blue power rails top and bottom. Drawn from a local
// (0,0) origin, just like ArduinoBoardArt, so the breadboard is a real
// draggable/deletable component on the canvas instead of fixed
// background art.
//
// Every hole drawn here uses BREADBOARD_LAYOUT / BREADBOARD_COLS — the
// exact same constants ElectronicsLab.js uses to place the clickable
// connection points — so what a student sees lines up 1:1 with where
// they can actually click to wire something in. Nothing here is purely
// decorative filler that doesn't correspond to a real node.
export function BreadboardArt({ w, h }) {
  const marginX = BREADBOARD_MARGIN_X;
  const colSpacing = (w - marginX * 2) / (BREADBOARD_COLS - 1);
  const L = BREADBOARD_LAYOUT;
  const holes = [];
  for (let c = 1; c <= BREADBOARD_COLS; c++) {
    const cx = marginX + (c - 1) * colSpacing;
    holes.push(<circle key={`rt${c}`} cx={cx} cy={h * L.railTopPos} r={1.8} fill="#0a0a14" opacity={0.6} />);
    holes.push(<circle key={`rn${c}`} cx={cx} cy={h * L.railTopNeg} r={1.8} fill="#0a0a14" opacity={0.6} />);
    L.tieTopRows.forEach((frac, i) => holes.push(<circle key={`tt${c}-${i}`} cx={cx} cy={h * frac} r={1.6} fill="#0a0a14" opacity={0.55} />));
    L.tieBottomRows.forEach((frac, i) => holes.push(<circle key={`tb${c}-${i}`} cx={cx} cy={h * frac} r={1.6} fill="#0a0a14" opacity={0.55} />));
    holes.push(<circle key={`rp${c}`} cx={cx} cy={h * L.railBotPos} r={1.8} fill="#0a0a14" opacity={0.6} />);
    holes.push(<circle key={`rq${c}`} cx={cx} cy={h * L.railBotNeg} r={1.8} fill="#0a0a14" opacity={0.6} />);
  }
  return (
    <g>
      <rect x={0} y={0} width={w} height={h} rx={8} fill="#e8e2d0" stroke="#c9c2ac" strokeWidth={1.5} />
      <rect x={0} y={0} width={w} height={h * 0.24} fill="#dbd4bd" />
      <rect x={0} y={h * 0.76} width={w} height={h * 0.24} fill="#dbd4bd" />
      {/* Center IC channel, where the two tie-strip blocks are electrically split */}
      <rect x={0} y={h * 0.52} width={w} height={h * 0.06} fill="#d3ccb4" />
      <line x1={8} y1={h * L.railTopPos} x2={w - 8} y2={h * L.railTopPos} stroke="#e05a5a" strokeWidth={1.5} />
      <line x1={8} y1={h * L.railTopNeg} x2={w - 8} y2={h * L.railTopNeg} stroke="#4a7fd6" strokeWidth={1.5} />
      <line x1={8} y1={h * L.railBotPos} x2={w - 8} y2={h * L.railBotPos} stroke="#e05a5a" strokeWidth={1.5} />
      <line x1={8} y1={h * L.railBotNeg} x2={w - 8} y2={h * L.railBotNeg} stroke="#4a7fd6" strokeWidth={1.5} />
      {holes}
      <text x={w / 2} y={h * 0.55} fill="#8a8266" fontSize={Math.max(8, h * 0.045)} fontWeight="700" textAnchor="middle" opacity={0.55}>
        BREADBOARD
      </text>
    </g>
  );
}

const SHAPES = {
  led: Led, resistor: Resistor, button: PushButton, potentiometer: Potentiometer,
  buzzer: Buzzer, dht11: Dht11, hcsr04: HcSr04, servo: Servo, sevenseg: SevenSeg, dcmotor: DcMotor,
  lcd1602: Lcd1602,
};

export function ComponentShape({ type, w, h, values }) {
  const Shape = SHAPES[type];
  if (!Shape) return null;
  return <Shape w={w} h={h} values={values} />;
}

// Small human-readable "330Ω" / "green" style caption shown under a
// placed component, built from its current values.
export function valueCaption(type, values) {
  const meta = { resistor: "value", potentiometer: "value", led: "color", buzzer: "variant", servo: "range", dcmotor: "voltage" }[type];
  if (!meta || !values || values[meta] == null) return null;
  const v = values[meta];
  if (type === "resistor" || type === "potentiometer") {
    return v >= 1000 ? `${v / 1000}kΩ` : `${v}Ω`;
  }
  if (type === "servo") return `${v}°`;
  if (type === "dcmotor") return `${v}V`;
  return String(v);
}
