/**
 * JAMBCountdown — sticky urgency banner for Dashboard
 * Shows days left to JAMB, asks student to set their date if not set.
 * Adapts message based on days remaining.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "scholars_jamb_date";

function getDaysLeft(dateStr) {
  if (!dateStr) return null;
  const exam = new Date(dateStr);
  const now  = new Date();
  exam.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
}

function getUrgencyStyle(days) {
  if (days <= 7)  return { bg: "linear-gradient(135deg,#e17055,#d63031)", text: "#fff", border: "#e1705588" };
  if (days <= 14) return { bg: "linear-gradient(135deg,#fdcb6e,#e17055)", text: "#fff", border: "#fdcb6e88" };
  if (days <= 30) return { bg: "linear-gradient(135deg,#6c63ff,#a29bfe)", text: "#fff", border: "#6c63ff88" };
  return { bg: "linear-gradient(135deg,#00b894,#00cec9)", text: "#fff", border: "#00b89488" };
}

function getUrgencyMessage(days, avgScore) {
  if (days <= 1)  return { emoji: "🚨", msg: "JAMB is TOMORROW. Review your weak topics NOW." };
  if (days <= 3)  return { emoji: "🔥", msg: `${days} days left. Every hour counts.` };
  if (days <= 7)  return { emoji: "⚡", msg: `${days} days to JAMB. Stay focused — no breaks now.` };
  if (days <= 14) return { emoji: "📅", msg: `${days} days left. You're in the final stretch.` };
  if (days <= 30) return { emoji: "🎯", msg: `${days} days to JAMB. ${avgScore < 60 ? "Your score needs work — practice daily." : "You're improving. Keep the momentum."}` };
  return { emoji: "📚", msg: `${days} days to JAMB. Build the habit now — consistency wins.` };
}

export default function JAMBCountdown({ avgScore = 0 }) {
  const nav = useNavigate();
  const [jambDate,   setJambDate]   = useState(() => localStorage.getItem(STORAGE_KEY) || "");
  const [showPicker, setShowPicker] = useState(false);
  const [inputDate,  setInputDate]  = useState("");
  const [dismissed,  setDismissed]  = useState(false);

  const daysLeft = getDaysLeft(jambDate);

  const handleSave = () => {
    if (!inputDate) return;
    localStorage.setItem(STORAGE_KEY, inputDate);
    setJambDate(inputDate);
    setShowPicker(false);
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setJambDate("");
    setShowPicker(false);
  };

  if (dismissed) return null;

  // No date set — show a soft prompt to set it
  if (!jambDate || daysLeft === null) {
    return (
      <div style={{
        background: "rgba(108,99,255,0.1)", border: "1px solid rgba(108,99,255,0.25)",
        borderRadius: 14, padding: "12px 14px", marginBottom: 14,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ fontSize: 22 }}>📅</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#a29bfe" }}>When is your JAMB?</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", marginTop: 1 }}>Set your exam date for a live countdown and daily reminders.</div>
        </div>
        {showPicker ? (
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <input
              type="date"
              value={inputDate}
              onChange={e => setInputDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #6c63ff", fontSize: 12, background: "#1a1440", color: "#fff" }}
            />
            <button onClick={handleSave} style={{ padding: "6px 12px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Save</button>
          </div>
        ) : (
          <button
            onClick={() => setShowPicker(true)}
            style={{ padding: "8px 12px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 9, fontWeight: 800, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
            Set Date
          </button>
        )}
      </div>
    );
  }

  // JAMB has passed
  if (daysLeft < 0) {
    return (
      <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>🎓</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: "#fff" }}>JAMB done! How did it go?</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Keep practicing for Post-UTME.</div>
        </div>
        <button onClick={handleClear} style={{ padding: "6px 10px", background: "none", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>Clear</button>
      </div>
    );
  }

  const style   = getUrgencyStyle(daysLeft);
  const { emoji, msg } = getUrgencyMessage(daysLeft, avgScore);

  return (
    <div style={{
      background: style.bg, border: `1.5px solid ${style.border}`,
      borderRadius: 14, padding: "13px 14px", marginBottom: 14,
      boxShadow: `0 4px 20px ${style.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ textAlign: "center", flexShrink: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 28, color: style.text, lineHeight: 1 }}>{daysLeft}</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: 0.5 }}>DAYS</div>
        </div>
        <div style={{ width: 1, height: 36, background: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: style.text, marginBottom: 2 }}>
            {emoji} JAMB Countdown
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{msg}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
          <button
            onClick={() => nav("/exam-select")}
            style={{ padding: "7px 10px", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 9, fontWeight: 800, fontSize: 11, cursor: "pointer" }}>
            Practice →
          </button>
          <button
            onClick={() => setDismissed(true)}
            style={{ padding: "4px 10px", background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 10, cursor: "pointer" }}>
            hide
          </button>
        </div>
      </div>
    </div>
  );
}
