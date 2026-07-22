import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FactionsPanel } from "./Factions";
import { SchoolWarsPanel } from "./SchoolWars";

// ── SchoolCompetition.js — route: /school-competition ────────
// Merges Factions.js (which faction/state you belong to, rankings)
// + SchoolWars.js (live head-to-head battles between schools) into
// one page with tabs. Both hit complementary, not duplicate, backend
// endpoints (/factions/* vs /school-wars/*) — only the pages merge.
const TABS = [
  { id: "factions", label: "🌍 Factions" },
  { id: "wars",      label: "🏰 School Wars" },
];

const PATH_TAB = { "/factions": "factions", "/school-wars": "wars" };

export default function SchoolCompetition() {
  const nav = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(PATH_TAB[location.pathname] || "factions");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => nav(-1)} style={{
            background: "rgba(255,255,255,.06)", border: "none", color: "#fff",
            borderRadius: 10, width: 40, height: 40, cursor: "pointer", fontSize: 18,
          }}>←</button>
          <h1 style={{ color: "#fff", fontWeight: 900, fontSize: 22, margin: 0 }}>School Competition</h1>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
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
      </div>

      {tab === "factions" && <FactionsPanel />}
      {tab === "wars"      && <SchoolWarsPanel />}
    </div>
  );
}
