import { useState } from "react";
import { useLocation } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import { DailyChallengePanel } from "./DailyChallenge";
import { BeatYourselfPanel } from "./BeatYourself";
import { BlitzModePanel } from "./BlitzMode";

// ── Challenges.js — route: /challenges ───────────────────────
// Merges DailyChallenge.js + BeatYourself.js + BlitzMode.js — three
// pages that were all the same idea (a special solo exam ruleset)
// with different rules. Each panel is kept fully intact internally;
// only their duplicate back-button headers were stripped.
const TABS = [
  { id: "daily", label: "🎯 Daily" },
  { id: "beat",  label: "💪 Beat Yourself" },
  { id: "blitz", label: "⚡ Blitz" },
];

const PATH_TAB = { "/challenge": "daily", "/beat-yourself": "beat", "/blitz": "blitz" };

export default function Challenges() {
  const back = useBackNav();
  const location = useLocation();
  const [tab, setTab] = useState(PATH_TAB[location.pathname] || "daily");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 0" }}>
        <button onClick={() => back()} style={{
          background: "none", border: "none", color: "var(--text-muted)",
          fontSize: 22, cursor: "pointer", padding: 0,
        }}>←</button>
        <div style={{ fontWeight: 900, fontSize: 18, color: "var(--text)" }}>Challenge Modes</div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "14px 16px", position: "sticky", top: 0, zIndex: 10, background: "var(--bg)" }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              flex: 1, padding: "10px 4px", borderRadius: 12, fontWeight: 800, fontSize: 13,
              cursor: "pointer", border: tab === t.id ? "1.5px solid var(--primary)" : "1px solid var(--border)",
              background: tab === t.id ? "rgba(124,92,255,0.12)" : "var(--surface)",
              color: tab === t.id ? "var(--primary)" : "var(--text-muted)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "daily" && <DailyChallengePanel />}
      {tab === "beat"  && <BeatYourselfPanel />}
      {tab === "blitz" && <BlitzModePanel />}
    </div>
  );
}
