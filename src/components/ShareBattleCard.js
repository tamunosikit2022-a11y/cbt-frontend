/**
 * ShareBattleCard.js
 * Generates a shareable battle result image + WhatsApp/clipboard share.
 * Called from Results.js and Arena results.
 */
import { useRef, useEffect } from 'react';

export function generateShareText({ studentName, score, total, subject, opponent, won }) {
  const pct   = Math.round((score / total) * 100);
  const emoji = won ? '🏆' : '💪';
  const verb  = won ? 'defeated' : 'battled';

  if (opponent) {
    return (
      `${emoji} I just ${verb} ${opponent} in a JAMB ${subject} Arena battle on Scholars Syndicate!\n\n` +
      `My score: ${score}/${total} (${pct}%)\n\n` +
      `Think you can beat me? 👇\n` +
      `https://cbt-frontend-umber.vercel.app/arena`
    );
  }
  return (
    `📚 I just scored ${score}/${total} (${pct}%) in a JAMB ${subject} practice on Scholars Syndicate!\n\n` +
    `Join me and ace your JAMB 🎯\n` +
    `https://cbt-frontend-umber.vercel.app`
  );
}

export function generateChallengeText(studentName, subject) {
  return (
    `⚔️ ${studentName} is challenging you to a JAMB${subject ? ` ${subject}` : ''} Arena battle on Scholars Syndicate!\n\n` +
    `Accept the challenge here 👇\n` +
    `https://cbt-frontend-umber.vercel.app/arena`
  );
}

export function shareToWhatsApp(text) {
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/?text=${encoded}`, '_blank');
}

export function shareToTwitter(text) {
  const encoded = encodeURIComponent(text);
  window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export async function nativeShare(text, title = 'Scholars Syndicate') {
  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return true;
    } catch { return false; }
  }
  return false;
}

// ── SharePanel component ───────────────────────────────────
export default function SharePanel({ shareText, onClose }) {
  const ACCENT = '#6c63ff';
  const BG     = "var(--surface)";

  async function handleWhatsApp() { shareToWhatsApp(shareText); onClose?.(); }
  async function handleNative()   { await nativeShare(shareText); onClose?.(); }
  async function handleCopy()     {
    const ok = await copyToClipboard(shareText);
    if (ok) { alert('Copied to clipboard! Paste and share anywhere.'); onClose?.(); }
  }

  const hasNativeShare = !!navigator.share;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 12px 12px',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: BG, borderRadius: 20, padding: 20,
        width: '100%', maxWidth: 420,
        border: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ fontWeight: 800, fontSize: 16, color: '#fff', marginBottom: 4 }}>
          📣 Share your result
        </div>
        <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
          Challenge friends and grow the community
        </div>

        {/* Preview */}
        <div style={{
          background: "var(--surface)", border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 12, padding: 12, marginBottom: 14,
          fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {shareText}
        </div>

        {/* Share buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hasNativeShare && (
            <button onClick={handleNative} style={{
              padding: 13, borderRadius: 12, border: 'none', cursor: 'pointer',
              background: `linear-gradient(135deg, ${ACCENT}, #5B8CFF)`,
              color: '#fff', fontWeight: 700, fontSize: 14,
            }}>
              📤 Share
            </button>
          )}
          <button onClick={handleWhatsApp} style={{
            padding: 13, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 14,
          }}>
            💬 Share on WhatsApp
          </button>
          <button onClick={handleCopy} style={{
            padding: 13, borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer',
            background: "var(--surface)", color: '#fff', fontWeight: 700, fontSize: 14,
          }}>
            📋 Copy Link
          </button>
        </div>

        <button onClick={onClose} style={{
          width: '100%', marginTop: 12, padding: 10, border: 'none',
          background: 'transparent', color: "var(--text-muted)",
          cursor: 'pointer', fontSize: 13,
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
