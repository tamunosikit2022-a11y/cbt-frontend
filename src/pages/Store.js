import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GemStorePanel } from "./GemStore";
import { TokensPanel } from "./Tokens";

// ── Store.js — route: /store ──────────────────────────────────
// Merges GemStore.js + Tokens.js. These are genuinely two separate
// currencies on the backend (gems: manual WhatsApp + voucher redeem;
// tokens: Paystack + WhatsApp, used for AI Tutor/Arena/etc) — that
// backend split is intentionally left untouched here since it's live
// payment logic. This only merges the two *pages* into one, tabbed,
// so students aren't hunting between two separate "buy currency"
// screens that used to even mislabel each other (GemStore's header
// literally said "Token Store").
const TABS = [
  { id: "gems",   label: "💎 Gems" },
  { id: "tokens", label: "🎫 Tokens" },
];

export default function Store() {
  const nav = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname === "/tokens" ? "tokens" : "gems");

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 20px 0" }}>
        <button onClick={() => nav(-1)} style={{
          background: "rgba(255,255,255,.06)", border: "none", color: "#fff",
          borderRadius: 10, width: 40, height: 40, cursor: "pointer", fontSize: 18,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>←</button>
        <div style={{ fontWeight: 900, fontSize: 18, color: "var(--text)" }}>Store</div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "16px 20px", maxWidth: 800, margin: "0 auto" }}>
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

      {tab === "gems"   && <GemStorePanel />}
      {tab === "tokens" && <TokensPanel />}
    </div>
  );
}
