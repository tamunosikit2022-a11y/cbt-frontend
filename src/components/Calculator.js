import { useState, useCallback } from "react";

/**
 * Calculator — floating scientific calculator overlay.
 * Supports basic arithmetic + common functions (√, x², %).
 * Draggable on desktop, floating bottom-right on mobile.
 */
export default function Calculator({ onClose }) {
  const [display, setDisplay]       = useState("0");
  const [expression, setExpression] = useState("");
  const [justCalc, setJustCalc]     = useState(false);
  const [memory, setMemory]         = useState(0);
  const [deg, setDeg]               = useState(true);

  const MAX = 15;

  const append = useCallback((val) => {
    setDisplay(prev => {
      if (justCalc) { setJustCalc(false); return val === "." ? "0." : String(val); }
      if (prev === "0" && val !== ".") return String(val);
      if (prev.length >= MAX) return prev;
      return prev + val;
    });
  }, [justCalc]);

  const clear = () => { setDisplay("0"); setExpression(""); setJustCalc(false); };
  const clearEntry = () => setDisplay("0");
  const toggleSign = () => setDisplay(d => d.startsWith("-") ? d.slice(1) : d === "0" ? "0" : "-" + d);
  const percent = () => setDisplay(d => String(parseFloat(d) / 100));

  const applyOp = (op) => {
    const val = parseFloat(display);
    setExpression(expression + display + " " + op + " ");
    setDisplay("0");
    setJustCalc(false);
  };

  const calculate = () => {
    try {
      const expr = expression + display;
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expr.replace(/×/g,"*").replace(/÷/g,"/")})`)();
      const rounded = parseFloat(result.toPrecision(12));
      setDisplay(String(rounded));
      setExpression(expr + " =");
      setJustCalc(true);
    } catch {
      setDisplay("Error");
      setExpression("");
    }
  };

  const applyFn = (fn) => {
    const val = parseFloat(display);
    let result;
    const toRad = (v) => deg ? (v * Math.PI) / 180 : v;
    switch (fn) {
      case "sqrt": result = Math.sqrt(val); break;
      case "sq":   result = val * val;      break;
      case "inv":  result = 1 / val;        break;
      case "log":  result = Math.log10(val); break;
      case "ln":   result = Math.log(val);   break;
      case "sin":  result = Math.sin(toRad(val)); break;
      case "cos":  result = Math.cos(toRad(val)); break;
      case "tan":  result = Math.tan(toRad(val)); break;
      case "abs":  result = Math.abs(val);   break;
      case "pi":   result = Math.PI;         break;
      case "e":    result = Math.E;          break;
      default:     result = val;
    }
    setDisplay(String(parseFloat(result.toPrecision(10))));
    setJustCalc(true);
  };

  const mStore = () => setMemory(parseFloat(display));
  const mRecall = () => { setDisplay(String(memory)); setJustCalc(true); };
  const mClear  = () => setMemory(0);
  const mAdd    = () => setMemory(m => m + parseFloat(display));

  const btn = (label, action, type = "num") => ({ label, action, type });

  const rows = [
    // Memory row
    [btn("MC",  mClear,  "fn"), btn("MR", mRecall, "fn"), btn("M+", mAdd, "fn"), btn("MS", mStore, "fn")],
    // Functions
    [btn("sin", () => applyFn("sin"), "fn"), btn("cos", () => applyFn("cos"), "fn"),
     btn("tan", () => applyFn("tan"), "fn"), btn(deg?"DEG":"RAD", () => setDeg(d=>!d), "fn")],
    [btn("√x",  () => applyFn("sqrt"),"fn"), btn("x²", () => applyFn("sq"),  "fn"),
     btn("1/x", () => applyFn("inv"), "fn"), btn("log",() => applyFn("log"), "fn")],
    [btn("ln",  () => applyFn("ln"),  "fn"), btn("π",  () => applyFn("pi"),  "fn"),
     btn("e",   () => applyFn("e"),   "fn"), btn("|x|",() => applyFn("abs"), "fn")],
    // Standard
    [btn("AC", clear, "op"), btn("CE", clearEntry, "op"), btn("%", percent, "op"), btn("÷", () => applyOp("÷"), "op")],
    [btn("7", () => append("7")), btn("8", () => append("8")), btn("9", () => append("9")), btn("×", () => applyOp("×"), "op")],
    [btn("4", () => append("4")), btn("5", () => append("5")), btn("6", () => append("6")), btn("−", () => applyOp("-"), "op")],
    [btn("1", () => append("1")), btn("2", () => append("2")), btn("3", () => append("3")), btn("+", () => applyOp("+"), "op")],
    [btn("±", toggleSign, "op"), btn("0", () => append("0")), btn(".", () => append(".")), btn("=", calculate, "eq")],
  ];

  const colors = {
    num: { bg: "#e0e6ff", color: "#f0f4ff", hover: "#3d4346" },
    op:  { bg: "#3d3d5c", color: "#a29bfe", hover: "#4d4d6c" },
    fn:  { bg: "#1a1a2e", color: "#74b9ff", hover: "#2a2a3e" },
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
      width: "100%", maxWidth: 300, fontFamily: "'Plus Jakarta Sans', sans-serif",
      userSelect: "none",
    }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
        <span style={{ color:"#a29bfe", fontWeight:700, fontSize:14 }}>🧮 Calculator</span>
        <button onClick={onClose} style={{ background:"none", border:"none", color:"#8b9cbd", cursor:"pointer", fontSize:22, lineHeight:1, padding:4 }}>×</button>
      </div>

      {/* Display */}
      <div style={{ padding:"8px 12px 4px", textAlign:"right" }}>
        <div style={{ color:"#8b9cbd", fontSize:11, minHeight:16, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {expression || " "}
        </div>
        <div style={{ color:"#f0f4ff", fontSize:display.length > 10 ? 18 : 26, fontWeight:700, letterSpacing:-0.5, overflow:"hidden", textOverflow:"ellipsis" }}>
          {display}
        </div>
        {memory !== 0 && <div style={{ color:"#74b9ff", fontSize:10 }}>M: {memory}</div>}
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
                  borderRadius: 8, padding:"12px 2px",
                  fontSize: label.length > 2 ? 11 : 14, fontWeight:600,
                  cursor:"pointer", transition:"background 0.1s",
                  minHeight: 40,
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
    </div>
    </div>
  );
}
