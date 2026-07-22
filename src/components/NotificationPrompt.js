/**
 * NotificationPrompt.js
 * Smart notification permission prompt.
 * Shows after 2nd login, not on first visit. Dismissible forever.
 */
import { useState, useEffect } from 'react';
import { subscribeToPush, isPushSupported, isPushSubscribed, getPushPermission } from '../utils/pushNotifications';

const DISMISSED_KEY = 'scholars_notif_prompt_dismissed';
const SHOWN_KEY     = 'scholars_notif_prompt_shown_count';

export default function NotificationPrompt() {
  const [visible,    setVisible]    = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (getPushPermission() === 'denied') return;
    if (isPushSubscribed()) return;

    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (dismissed) return;

    // Show after 2nd+ visit
    const count = parseInt(localStorage.getItem(SHOWN_KEY) || '0') + 1;
    localStorage.setItem(SHOWN_KEY, count);
    if (count >= 2) {
      // Slight delay so it doesn't pop up instantly
      setTimeout(() => setVisible(true), 3000);
    }
  }, []);

  async function handleEnable() {
    setLoading(true);
    const result = await subscribeToPush();
    setLoading(false);
    if (result.success) {
      setSubscribed(true);
      setTimeout(() => setVisible(false), 2000);
    } else if (result.reason === 'denied') {
      dismiss();
    }
  }

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 90, left: 12, right: 12,
      maxWidth: 380, margin: '0 auto',
      background: "var(--surface)",
      border: '1px solid rgba(108,99,255,0.4)',
      borderRadius: 18, padding: '16px',
      zIndex: 8000, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      animation: 'slide-in 0.3s ease',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ fontSize: 32, flexShrink: 0 }}>🔔</div>
        <div style={{ flex: 1 }}>
          {subscribed ? (
            <>
              <div style={{ fontWeight: 800, color: '#00b894', fontSize: 14, marginBottom: 4 }}>
                ✅ Notifications enabled!
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                We'll remind you to practice and alert you to arena challenges.
              </div>
            </>
          ) : (
            <>
              <div style={{ fontWeight: 800, color: '#fff', fontSize: 14, marginBottom: 4 }}>
                Never miss your streak 🔥
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12, lineHeight: 1.5 }}>
                Get reminders before your streak breaks, daily mission alerts, and arena challenge notifications.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleEnable} disabled={loading} style={{
                  flex: 2, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: loading ? 'rgba(108,99,255,0.4)' : '#6c63ff',
                  color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                  {loading ? 'Enabling…' : '🔔 Enable'}
                </button>
                <button onClick={dismiss} style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: "var(--text-muted)",
                  fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}>
                  Later
                </button>
              </div>
            </>
          )}
        </div>
        <button onClick={dismiss} style={{
          background: 'none', border: 'none', color: "var(--text-muted)",
          cursor: 'pointer', fontSize: 18, padding: 0, flexShrink: 0,
        }}>✕</button>
      </div>
    </div>
  );
}
