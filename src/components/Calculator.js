import { useState, useCallback } from "react";

/**
 * Calculator — JAMB-exact on-screen calculator.
 *
 * The real JAMB CBT calculator is deliberately basic: four-function
 * arithmetic only (+, −, ×, ÷), plus %, √, and clear — no trig, no log,
 * no memory keys, single-line display. Students have publicly asked JAMB
 * to add scientific functions and JAMB has not done so, so a scientific
 * calculator here would train muscle memory the real exam won't support.
 * This intentionally mirrors what candidates actually see on exam day.
 */
export default function Calculator({ onClose }) {
  const [display, setDisplay]       = useState("0");
  const [expression, setExpression] = useState("");
  const [justCalc, setJustCalc]     = useState(false);

  const MAX = 12;

  const append = useCallback((val) => {
    setDisplay(prev => {
      if (justCalc) { setJustCalc(false); return val === "." ? "0." : String(val); }
      if (prev === "0" && val !== ".") return String(val);
      if (val === "." && prev.includes(".")) return prev;
      if (prev.length >= MAX) return prev;
      return prev + val;
    });
  }, [justCalc]);

  const clear      = () => { setDisplay("0"); setExpression(""); setJustCalc(false); };
  const clearEntry = () => setDisplay("0");
  const toggleSign = () => setDisplay(d => d.startsWith("-") ? d.slice(1) : d === "0" ? "0" : "-" + d);
  const percent    = () => setDisplay(d => String(parseFloat(d) / 100));
  const sqrt       = () => {
    const v = parseFloat(display);
    setDisplay(v < 0 ? "Error" : String(parseFloat(Math.sqrt(v).toPrecision(10))));
    setJustCalc(true);
  };

  const applyOp = (op) => {
    setExpression(expression + display + " " + op + " ");
    setDisplay("0");
    setJustCalc(false);
  };

  const calculate = () => {
    try {
      const expr = expression + display;
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr.replace(/×/g,"*").replace(/÷/g,"/")})`)();
      setDisplay(String(parseFloat(result.toPrecision(12))));
      setExpression(expr + " =");
      setJustCalc(true);
    } catch {
      setDisplay("Error");
      setExpression("");
    }
  };

  const btn = (label, action, type = "num") => ({ label, action, type });

  // Layout matches the real JAMB calculator: single row of function keys
  // (AC, CE, √, %) above the standard numeric keypad — no second panel of
  // scientific functions, no memory row.
  const rows = [
    [btn("AC", clear, "op"), btn("CE", clearEntry, "op"), btn("√", sqrt, "op"), btn("%", percent, "op")],
    [btn("7", () => append("7")), btn("8", () => append("8")), btn("9", () => append("9")), btn("÷", () => applyOp("÷"), "op")],
    [btn("4", () => append("4")), btn("5", () => append("5")), btn("6", () => append("6")), btn("×", () => applyOp("×"), "op")],
    [btn("1", () => append("1")), btn("2", () => append("2")), btn("3", () => append("3")), btn("−", () => applyOp("-"), "op")],
    [btn("±", toggleSign, "op"), btn("0", () => append("0")), btn(".", () => append(".")), btn("+", () => applyOp("+"), "op")],
    [btn("=", calculate, "eq")],
  ];

  const colors = {
    num: { bg: "#e0e6ff", color: "#1a1a2e", hover: "#c9d2ff" },
    op:  { bg: "#3d3d5c", color: "#a29bfe", hover: "#4d4d6c" },
    eq:  { bg: "#6c63ff", color: "#fff",    hover: "#7c73ff" },
  };

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.55)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16,
    }}>
    <div onClick={e => e.stopPropagation()} style={{
      background: "#1e1e2e", borderRadius: 16,
      boxShadow: "0 12px 48px rgba(0,0,0,0.7)",
      border: "1px solid rgba(255,255,255,0.1)",
      width: "100%", maxWidth: 280, fontFamily: "'Plus Jakarta Sans', sans-serif",
      userSelect: "none",
    }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color:"#a29bfe", fontWeight:700, fontSize:14 }}>🧮 Calculator</span>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#8b9cbd", cursor:"pointer", fontSize:22, lineHeight:1, padding:4 }}>×</button>
      </div>

      {/* Display — single-line, like the real JAMB calculator */}
      <div style={{ padding:"8px 12px 4px", textAlign:"right" }}>
        <div style={{ color:"#8b9cbd", fontSize:11, minHeight:16, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {expression || " "}
        </div>
        <div style={{ color:"#f0f4ff", fontSize:display.length > 9 ? 20 : 28, fontWeight:700, letterSpacing:-0.5, overflow:"hidden", textOverflow:"ellipsis" }}>
          {display}
        </div>
      </div>

      {/* Buttons */}
      <div style={{ padding:"8px 10px 14px", display:"flex", flexDirection:"column", gap:6 }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{ display:"grid", gridTemplateColumns:`repeat(${row.length},1fr)`, gap:6 }}>
            {row.map(({ label, action, type }, ci) => {
              const c = colors[type] || colors.num;
              return (
                <button key={ci} onClick={action} style={{
                  background: c.bg, color: c.color,
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 8, padding:"14px 2px",
                  fontSize: 16, fontWeight:700,
                  cursor:"pointer", transition:"background 0.1s",
                  minHeight: 44,
                }}
                  onMouseEnter={e => e.target.style.background = c.hover}
                  onMouseLeave={e => e.target.style.background = c.bg}>
                  {label}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <p style={{ margin:0, padding:"0 14px 12px", fontSize:10, color:"#5a6478", textAlign:"center", lineHeight:1.4 }}>
        Matches the real JAMB on-screen calculator — basic functions only.
      </p>
    </div>
    </div>
  );
}
