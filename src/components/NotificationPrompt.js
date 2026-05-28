/**
 * NotificationPrompt — shown once to ask students to enable notifications
 * Add anywhere in the app: <NotificationPrompt />
 */
import { useState, useEffect } from "react";
import { requestNotificationPermission, getNotificationPermission, saveNotifPrefs, getNotifPrefs } from "../utils/notifications";

export default function NotificationPrompt() {
  const [show,    setShow]    = useState(false);
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const perm      = getNotificationPermission();
    const dismissed = localStorage.getItem("scholars_notif_dismissed");
    if (perm === "granted")   { setEnabled(true); return; }
    if (perm === "denied")    return;
    if (dismissed)            return;
    // Show after 3 seconds on first visit
    const t = setTimeout(() => setShow(true), 3000);
    return () => clearTimeout(t);
  }, []);

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    if (result === "granted") {
      setEnabled(true);
      saveNotifPrefs({ ...getNotifPrefs(), enabled: true });
    }
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("scholars_notif_dismissed", "true");
    setShow(false);
  };

  if (!show || enabled) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, left: 16, right: 16, zIndex: 999,
      background: "linear-gradient(135deg,#1a1440,#2d1060)",
      border: "1.5px solid #6c63ff55", borderRadius: 16,
      padding: "16px 16px", boxShadow: "0 8px 32px rgba(108,99,255,0.3)",
      display: "flex", gap: 12, alignItems: "flex-start",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      animation: "slide-in .3s ease",
    }}>
      <span style={{ fontSize: 28, flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: "#fff", marginBottom: 4 }}>
          Never miss a study day
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 12 }}>
          Get streak reminders and JAMB countdown alerts so you stay on track.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleEnable}
            style={{ flex: 1, padding: "10px 0", background: "linear-gradient(135deg,#6c63ff,#a29bfe)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
            Enable Alerts
          </button>
          <button
            onClick={handleDismiss}
            style={{ padding: "10px 14px", background: "none", border: "1.5px solid rgba(255,255,255,0.15)", borderRadius: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
