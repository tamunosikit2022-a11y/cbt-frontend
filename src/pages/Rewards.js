import { useState } from "react";
import { useLocation } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import { SpinWheelPanel } from "./SpinWheel";
import { TreasureChestsPanel } from "./TreasureChests";

// ── Rewards.js — route: /rewards ─────────────────────────────
// Merges SpinWheel.js + TreasureChests.js, which were two separate
// pages doing the same job (free daily reward mechanics). Both are
// kept fully intact internally as panels — only their duplicate
// back-button headers were stripped, replaced by this shared header
// + tab switcher.
const TABS = [
  { id: "spin",   label: "🎰 Spin" },
  { id: "chests", label: "🗝️ Chests" },
];

export default function Rewards() {
  const back = useBackNav();
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname === "/chests" ? "chests" : "spin");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 0",
      }}>
        <button onClick={() => back()} style={{
          background: "none", border: "none", color: "var(--text-muted)",
          fontSize: 22, cursor: "pointer", padding: 0,
        }}>←</button>
        <div style={{ fontWeight: 900, fontSize: 18, color: "var(--text)" }}>Daily Rewards</div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "14px 16px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg)" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "10px 0", borderRadius: 12, fontWeight: 800, fontSize: 14,
              cursor: "pointer", border: tab === t.id ? "1.5px solid var(--primary)" : "1px solid var(--border)",
              background: tab === t.id ? "rgba(124,92,255,0.12)" : "var(--surface)",
              color: tab === t.id ? "var(--primary)" : "var(--text-muted)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "spin"   && <SpinWheelPanel />}
      {tab === "chests" && <TreasureChestsPanel />}
    </div>
  );
}
