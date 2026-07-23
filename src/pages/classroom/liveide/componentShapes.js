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
 *
 * Realism pass: every body now uses a gradient fill (never a flat single
 * color) plus a soft drop shadow via `shadowFilter`, the same two things
 * that make the difference between "a rounded rectangle with a label" and
 * something that reads as an actual photographed part. Gradient/filter
 * ids are always suffixed with the component's own `id` (threaded down
 * from ComponentShape) — every placed part gets its own <defs> entries,
 * so two of the same part on one canvas never collide on a shared id.
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

// A soft, slightly-offset drop shadow — this single filter is most of the
// difference between a flat SVG icon and something that looks like it's
// actually sitting on the breadboard with weight to it.
function shadowFilter(filterId, opts = {}) {
  const { dy = 2, blur = 1.6, opacity = 0.4 } = opts;
  return (
    <filter id={filterId} x="-60%" y="-60%" width="220%" height="220%">
      <feDropShadow dx="0" dy={dy} stdDeviation={blur} floodColor="#000000" floodOpacity={opacity} />
    </filter>
  );
}
const fid = (id, key) => `shadow-${key}-${id ?? "x"}`;
const gid = (id, key) => `grad-${key}-${id ?? "x"}`;

function Led({ id, w, h, values }) {
  const color = LED_COLORS[values?.color] || LED_COLORS.red;
  const lit = Boolean(values?.on);
  const cx = w / 2;
  const domeR = h * 0.3;
  const domeTopY = h * 0.1 + domeR;
  const domeBottomY = h * 0.52;
  const gradId = gid(id, `led-${values?.color || "red"}-${lit ? 1 : 0}`);
  const shId = fid(id, "led");
  const legTopY = domeBottomY + h * 0.03;

  return (
    <>
      <defs>
        {shadowFilter(shId, { opacity: lit ? 0.2 : 0.45 })}
        <radialGradient id={gradId} cx="35%" cy="30%" r="75%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity={lit ? 0.9 : 0.55} />
          <stop offset="35%"  stopColor={color}    stopOpacity={lit ? 0.95 : 0.6} />
          <stop offset="100%" stopColor={color}    stopOpacity={lit ? 0.85 : 0.35} />
        </radialGradient>
      </defs>

      {lit && <circle cx={cx} cy={(domeTopY + domeBottomY) / 2} r={h * 0.55} fill={color} opacity={0.25} />}

      <line x1={cx - h * 0.1} y1={legTopY} x2={cx - h * 0.1} y2={legTopY + h * 0.26} stroke="#c9c9c9" strokeWidth={1.4} strokeLinecap="round" />
      <line x1={cx + h * 0.1} y1={legTopY} x2={cx + h * 0.1} y2={legTopY + h * 0.4}  stroke="#c9c9c9" strokeWidth={1.4} strokeLinecap="round" />

      <rect x={cx - h * 0.22} y={domeBottomY - h * 0.02} width={h * 0.44} height={h * 0.07} rx={1.5} fill="#dedede" opacity={0.55} />

      <path
        d={`M ${cx - domeR} ${domeBottomY}
            L ${cx - domeR} ${domeTopY}
            A ${domeR} ${domeR} 0 0 1 ${cx + domeR} ${domeTopY}
            L ${cx + domeR} ${domeBottomY} Z`}
        fill={`url(#${gradId})`}
        stroke={color}
        strokeWidth={0.8}
        strokeOpacity={0.6}
        filter={`url(#${shId})`}
      />

      <ellipse cx={cx - domeR * 0.35} cy={domeTopY} rx={domeR * 0.28} ry={domeR * 0.4} fill="#ffffff" opacity={lit ? 0.5 : 0.3} />
    </>
  );
}

function Battery({ id, w, h, values }) {
  const v = values?.voltage ?? 9;
  const bodyX = w * 0.14, bodyW = w * 0.62, bodyY = h * 0.3, bodyH = h * 0.4;
  const gradId = gid(id, "battery");
  const goldId = gid(id, "battery-gold");
  const shId = fid(id, "battery");

  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#6b7788" />
          <stop offset="12%"  stopColor="#5a6578" />
          <stop offset="45%"  stopColor="#2d3748" />
          <stop offset="100%" stopColor="#161c26" />
        </linearGradient>
        <linearGradient id={goldId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f3d489" />
          <stop offset="50%" stopColor="#d4af37" />
          <stop offset="100%" stopColor="#9c7d24" />
        </linearGradient>
      </defs>

      <line x1={0} y1={h * 0.5} x2={bodyX} y2={h * 0.5} stroke="#c9c9c9" strokeWidth={2} strokeLinecap="round" />
      <line x1={bodyX + bodyW + w * 0.08} y1={h * 0.5} x2={w} y2={h * 0.5} stroke="#c9c9c9" strokeWidth={2} strokeLinecap="round" />

      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={3} fill={`url(#${gradId})`} stroke="#0d1117" strokeWidth={0.8} filter={`url(#${shId})`} />
      <rect x={bodyX + bodyW * 0.14} y={bodyY + bodyH * 0.08} width={bodyW * 0.1} height={bodyH * 0.84} rx={2} fill="#ffffff" opacity={0.12} />

      <rect x={bodyX + bodyW} y={h * 0.5 - bodyH * 0.16} width={w * 0.08} height={bodyH * 0.32} rx={2} fill={`url(#${goldId})`} stroke="#8a7238" strokeWidth={0.5} />

      <text x={bodyX + bodyW * 0.16} y={h * 0.5 + h * 0.06} fontSize={h * 0.26} fill="#e2e8f0" fontWeight="900" textAnchor="middle">-</text>
      <text x={bodyX + bodyW * 0.87} y={h * 0.5 + h * 0.06} fontSize={h * 0.22} fill="#e2e8f0" fontWeight="900" textAnchor="middle">+</text>

      <text x={bodyX + bodyW * 0.5} y={bodyY + bodyH * 0.9} fontSize={h * 0.15} fill="#93c5fd" fontWeight="700" textAnchor="middle">{v}V</text>
    </>
  );
}

function Resistor({ id, w, h, values }) {
  const bodyY = h * 0.38, bodyH = h * 0.24;
  const bands = resistorBands(values?.value ?? 220);
  const gradId = gid(id, "resistor");
  const leadId = gid(id, "resistor-lead");
  const shId = fid(id, "resistor");
  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#f8e9c9" />
          <stop offset="45%"  stopColor="#e8cf9a" />
          <stop offset="100%" stopColor="#b89555" />
        </linearGradient>
        <linearGradient id={leadId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f0f0f0" />
          <stop offset="50%" stopColor="#c9b37c" />
          <stop offset="100%" stopColor="#8a7238" />
        </linearGradient>
      </defs>
      <line x1={0} y1={h * 0.5} x2={w * 0.18} y2={h * 0.5} stroke={`url(#${leadId})`} strokeWidth={2} />
      <line x1={w * 0.82} y1={h * 0.5} x2={w} y2={h * 0.5} stroke={`url(#${leadId})`} strokeWidth={2} />
      <rect x={w * 0.18} y={bodyY} width={w * 0.64} height={bodyH} rx={bodyH * 0.4} fill={`url(#${gradId})`} stroke="#8a7238" strokeWidth={0.6} filter={`url(#${shId})`} />
      {bands.map((c, i) => (
        <rect key={i} x={w * 0.26 + i * (w * 0.11)} y={bodyY} width={4} height={bodyH} fill={c} />
      ))}
    </>
  );
}

function PushButton({ id, w, h }) {
  const cx = w / 2, cy = h * 0.42, s = h * 0.34;
  const capId = gid(id, "button-cap");
  const baseId = gid(id, "button-base");
  const shId = fid(id, "button");
  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <linearGradient id={baseId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#585858" />
          <stop offset="100%" stopColor="#242424" />
        </linearGradient>
        <radialGradient id={capId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#7a7a7a" />
          <stop offset="60%" stopColor="#3d3d3d" />
          <stop offset="100%" stopColor="#161616" />
        </radialGradient>
      </defs>
      <rect x={cx - s} y={cy - s} width={s * 2} height={s * 2} rx={3} fill={`url(#${baseId})`} stroke="#111" strokeWidth={1} filter={`url(#${shId})`} />
      <rect x={cx - s * 0.6} y={cy - s * 0.6} width={s * 1.2} height={s * 1.2} rx={2} fill={`url(#${capId})`} />
      <circle cx={cx - s * 0.15} cy={cy - s * 0.15} r={s * 0.16} fill="#ffffff" opacity={0.25} />
      <circle cx={cx} cy={cy} r={s * 0.35} fill="#0f0f0f" />
    </>
  );
}

function Potentiometer({ id, w, h }) {
  const cx = w / 2, cy = h * 0.42, r = h * 0.3;
  const bodyId = gid(id, "pot-body");
  const knobId = gid(id, "pot-knob");
  const shId = fid(id, "pot");
  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <linearGradient id={bodyId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3f8a67" />
          <stop offset="100%" stopColor="#194529" />
        </linearGradient>
        <radialGradient id={knobId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f0f0f0" />
          <stop offset="55%" stopColor="#c9c9c9" />
          <stop offset="100%" stopColor="#7a7a7a" />
        </radialGradient>
      </defs>
      <rect x={cx - r * 1.3} y={cy - r} width={r * 2.6} height={r * 1.9} rx={3} fill={`url(#${bodyId})`} stroke="#0f3524" strokeWidth={0.8} filter={`url(#${shId})`} />
      <circle cx={cx} cy={cy} r={r * 0.62} fill={`url(#${knobId})`} stroke="#555" strokeWidth={0.8} />
      <line x1={cx} y1={cy} x2={cx + r * 0.5} y2={cy - r * 0.35} stroke="#222" strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

function Buzzer({ id, w, h }) {
  const cx = w / 2, cy = h * 0.42, r = h * 0.32;
  const caseId = gid(id, "buzzer-case");
  const shId = fid(id, "buzzer");
  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <radialGradient id={caseId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#6b6b6b" />
          <stop offset="55%" stopColor="#3a3a3a" />
          <stop offset="100%" stopColor="#161616" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={r} fill={`url(#${caseId})`} stroke="#111" strokeWidth={1} filter={`url(#${shId})`} />
      <circle cx={cx} cy={cy} r={r * 0.55} fill="#1c1c1c" />
      <circle cx={cx - r * 0.2} cy={cy - r * 0.2} r={r * 0.12} fill="#ffffff" opacity={0.15} />
      <circle cx={cx} cy={cy} r={r * 0.18} fill="#e0b640" />
    </>
  );
}

function Dht11({ id, w, h }) {
  const bx = w * 0.2, by = h * 0.16, bw = w * 0.6, bh = h * 0.5;
  const bodyId = gid(id, "dht11");
  const shId = fid(id, "dht11");
  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <linearGradient id={bodyId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4d92db" />
          <stop offset="100%" stopColor="#1a4d85" />
        </linearGradient>
      </defs>
      <rect x={bx} y={by} width={bw} height={bh} rx={3} fill={`url(#${bodyId})`} stroke="#173e6b" strokeWidth={0.8} filter={`url(#${shId})`} />
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

function HcSr04({ id, w, h }) {
  const bx = w * 0.08, by = h * 0.2, bw = w * 0.84, bh = h * 0.4;
  const cy = by + bh / 2;
  const pcbId = gid(id, "hcsr04-pcb");
  const eyeId = gid(id, "hcsr04-eye");
  const shId = fid(id, "hcsr04");
  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <linearGradient id={pcbId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2e9668" />
          <stop offset="100%" stopColor="#0d2f22" />
        </linearGradient>
        <radialGradient id={eyeId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#f5f5f5" />
          <stop offset="60%" stopColor="#c4c4c4" />
          <stop offset="100%" stopColor="#7a7a7a" />
        </radialGradient>
      </defs>
      <rect x={bx} y={by} width={bw} height={bh} rx={3} fill={`url(#${pcbId})`} stroke="#0d2f22" strokeWidth={0.8} filter={`url(#${shId})`} />
      <circle cx={bx + bw * 0.28} cy={cy} r={bh * 0.42} fill={`url(#${eyeId})`} stroke="#8a8a8a" strokeWidth={1} />
      <circle cx={bx + bw * 0.28} cy={cy} r={bh * 0.18} fill="#6a6a6a" />
      <circle cx={bx + bw * 0.72} cy={cy} r={bh * 0.42} fill={`url(#${eyeId})`} stroke="#8a8a8a" strokeWidth={1} />
      <circle cx={bx + bw * 0.72} cy={cy} r={bh * 0.18} fill="#6a6a6a" />
    </>
  );
}

function Servo({ id, w, h }) {
  const bx = w * 0.14, by = h * 0.2, bw = w * 0.55, bh = h * 0.5;
  const caseId = gid(id, "servo-case");
  const shId = fid(id, "servo");
  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <linearGradient id={caseId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3f74c4" />
          <stop offset="100%" stopColor="#12305c" />
        </linearGradient>
      </defs>
      <rect x={bx} y={by} width={bw} height={bh} rx={2} fill={`url(#${caseId})`} stroke="#163a6b" strokeWidth={0.8} filter={`url(#${shId})`} />
      <rect x={bx + bw * 0.22} y={by - h * 0.1} width={bw * 0.28} height={h * 0.14} rx={2} fill="#1c1c1c" />
      <line x1={bx + bw * 0.36} y1={by - h * 0.1} x2={bx + bw * 0.7} y2={by - h * 0.18} stroke="#e0e0e0" strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

function SevenSeg({ id, w, h }) {
  const bx = w * 0.14, by = h * 0.1, bw = w * 0.5, bh = h * 0.62;
  const on = "#ff5252", off = "#4a1f1f";
  const seg = (x1, y1, x2, y2, color, sw) => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={sw} strokeLinecap="round" />
  );
  const L = bx, R = bx + bw, T = by, M = by + bh / 2, B = by + bh;
  const sw = Math.max(2, bw * 0.14);
  const bezelId = gid(id, "sevenseg-bezel");
  const shId = fid(id, "sevenseg");
  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <linearGradient id={bezelId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
      </defs>
      <rect x={bx - 3} y={by - 3} width={bw + 6} height={bh + 6} rx={2} fill={`url(#${bezelId})`} filter={`url(#${shId})`} />
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

function DcMotor({ id, w, h }) {
  const cx = w / 2, cy = h * 0.42, r = h * 0.32;
  const canId = gid(id, "dcmotor-can");
  const capId = gid(id, "dcmotor-cap");
  const shId = fid(id, "dcmotor");
  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <linearGradient id={canId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#3a3a3a" />
          <stop offset="30%"  stopColor="#9a9a9a" />
          <stop offset="48%"  stopColor="#e8e8e8" />
          <stop offset="65%"  stopColor="#8a8a8a" />
          <stop offset="100%" stopColor="#2f2f2f" />
        </linearGradient>
        <radialGradient id={capId} cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#5a5a5a" />
          <stop offset="100%" stopColor="#161616" />
        </radialGradient>
      </defs>

      <rect x={cx - r * 0.1} y={cy - r * 1.5} width={r * 0.2} height={r * 0.55} rx={1} fill="#c9c9c9" stroke="#666" strokeWidth={0.4} />
      <circle cx={cx} cy={cy} r={r} fill={`url(#${canId})`} stroke="#1a1a1a" strokeWidth={1} filter={`url(#${shId})`} />
      <circle cx={cx} cy={cy} r={r * 0.32} fill={`url(#${capId})`} />
      <line x1={cx - r * 0.4} y1={cy + r * 0.9} x2={cx - r * 0.55} y2={cy + r * 1.5} stroke="#e53935" strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + r * 0.4} y1={cy + r * 0.9} x2={cx + r * 0.55} y2={cy + r * 1.5} stroke="#1a1a1a" strokeWidth={2} strokeLinecap="round" />
    </>
  );
}

function Lcd1602({ id, w, h, values }) {
  const bx = w * 0.03, by = h * 0.06, bw = w * 0.94, bh = h * 0.62;
  const line1 = (values?.line1 || "").slice(0, 16);
  const line2 = (values?.line2 || "").slice(0, 16);
  const bezelId = gid(id, "lcd-bezel");
  const screenId = gid(id, "lcd-screen");
  const shId = fid(id, "lcd");
  return (
    <>
      <defs>
        {shadowFilter(shId)}
        <linearGradient id={bezelId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#173a26" />
          <stop offset="100%" stopColor="#08170f" />
        </linearGradient>
        <linearGradient id={screenId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2c7a48" />
          <stop offset="100%" stopColor="#123d24" />
        </linearGradient>
      </defs>
      <rect x={0} y={by - h * 0.02} width={w} height={bh + h * 0.08} rx={4} fill={`url(#${bezelId})`} stroke="#08170f" strokeWidth={1.5} filter={`url(#${shId})`} />
      <rect x={bx} y={by} width={bw} height={bh} rx={2} fill={`url(#${screenId})`} stroke="#0a2e1a" strokeWidth={1} />
      <rect x={bx + bw * 0.05} y={by + bh * 0.06} width={bw * 0.18} height={bh * 0.88} fill="#ffffff" opacity={0.06} />
      <text x={bx + 6} y={by + bh * 0.42} fill="#c7ffcf" fontSize={Math.max(8, bh * 0.26)} fontFamily="monospace" fontWeight="700">{line1}</text>
      <text x={bx + 6} y={by + bh * 0.82} fill="#c7ffcf" fontSize={Math.max(8, bh * 0.26)} fontFamily="monospace" fontWeight="700">{line2}</text>
    </>
  );
}

export function ArduinoBoardArt({ id, w, h }) {
  const pcbId = gid(id, "arduino-pcb");
  const shId = fid(id, "arduino");
  return (
    <>
      <defs>
        {shadowFilter(shId, { dy: 3, blur: 2.4, opacity: 0.5 })}
        <linearGradient id={pcbId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#1c8fe0" />
          <stop offset="45%"  stopColor="#0d6fb8" />
          <stop offset="100%" stopColor="#073e66" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w} height={h} rx={10} fill={`url(#${pcbId})`} stroke="#073e66" strokeWidth={2} filter={`url(#${shId})`} />
      <rect x={0} y={0} width={w} height={h} rx={10} fill="none" stroke="#1c8fe0" strokeWidth={1} opacity={0.5} />
      <rect x={w * 0.03} y={h * 0.08} width={w * 0.15} height={h * 0.22} rx={2} fill="#c7c7c7" stroke="#888" strokeWidth={1} />
      <circle cx={w * 0.09} cy={h * 0.62} r={h * 0.13} fill="#1a1a1a" stroke="#000" strokeWidth={1} />
      <circle cx={w * 0.09} cy={h * 0.62} r={h * 0.06} fill="#3a3a3a" />
      <rect x={w * 0.36} y={h * 0.32} width={w * 0.22} height={h * 0.32} rx={1} fill="#141414" stroke="#000" strokeWidth={1} />
      <text x={w * 0.47} y={h * 0.5} fill="#555" fontSize={h * 0.07} textAnchor="middle" fontFamily="monospace">328P</text>
      <rect x={w * 0.63} y={h * 0.1} width={h * 0.14} height={h * 0.14} rx={2} fill="#1a1a1a" />
      <rect x={w * 0.02} y={-3} width={w * 0.96} height={6} fill="#101010" />
      <rect x={w * 0.02} y={h - 3} width={w * 0.96} height={6} fill="#101010" />
      <text x={w * 0.6} y={h * 0.85} fill="#bfe3ff" fontSize={h * 0.14} fontWeight="800" fontFamily="sans-serif" letterSpacing={1}>UNO</text>
    </>
  );
}

export function BreadboardArt({ id, w, h }) {
  const marginX = BREADBOARD_MARGIN_X;
  const colSpacing = (w - marginX * 2) / (BREADBOARD_COLS - 1);
  const L = BREADBOARD_LAYOUT;
  const plasticId = gid(id, "breadboard-plastic");
  const shId = fid(id, "breadboard");
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
      <defs>
        {shadowFilter(shId, { dy: 3, blur: 2.2, opacity: 0.45 })}
        <linearGradient id={plasticId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f2ecd8" />
          <stop offset="100%" stopColor="#d8d0b6" />
        </linearGradient>
      </defs>
      <rect x={0} y={0} width={w} height={h} rx={8} fill={`url(#${plasticId})`} stroke="#c9c2ac" strokeWidth={1.5} filter={`url(#${shId})`} />
      <rect x={0} y={0} width={w} height={h * 0.24} fill="#dbd4bd" />
      <rect x={0} y={h * 0.76} width={w} height={h * 0.24} fill="#dbd4bd" />
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
  led: Led, battery: Battery, resistor: Resistor, button: PushButton, potentiometer: Potentiometer,
  buzzer: Buzzer, dht11: Dht11, hcsr04: HcSr04, servo: Servo, sevenseg: SevenSeg, dcmotor: DcMotor,
  lcd1602: Lcd1602,
};

export function ComponentShape({ id, type, w, h, values }) {
  const Shape = SHAPES[type];
  if (!Shape) return null;
  return <Shape id={id} w={w} h={h} values={values} />;
}

export function valueCaption(type, values) {
  const meta = { resistor: "value", potentiometer: "value", led: "color", buzzer: "variant", servo: "range", dcmotor: "voltage", battery: "voltage" }[type];
  if (!meta || !values || values[meta] == null) return null;
  const v = values[meta];
  if (type === "resistor" || type === "potentiometer") {
    return v >= 1000 ? `${v / 1000}kΩ` : `${v}Ω`;
  }
  if (type === "servo") return `${v}°`;
  if (type === "dcmotor" || type === "battery") return `${v}V`;
  return String(v);
}
