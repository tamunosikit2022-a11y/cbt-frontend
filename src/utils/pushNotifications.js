/**
 * pushNotifications.js
 * Web Push subscription manager — uses VAPID keys from the backend.
 */
import API from './api';

const SW_KEY = 'scholars_push_subscribed';

// ── Subscribe to push notifications ───────────────────────
export async function subscribeToPush() {
  try {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return { success: false, reason: 'unsupported' };
    }

    // Request permission
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return { success: false, reason: 'denied' };

    // Get VAPID public key from backend
    const { data } = await API.get('/push/vapid-key');
    if (!data.publicKey) return { success: false, reason: 'no_vapid_key' };

    // Subscribe via service worker
    const reg  = await navigator.serviceWorker.ready;
    const sub  = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    });

    // Save subscription to backend
    await API.post('/push/subscribe', { subscription: sub.toJSON() });
    localStorage.setItem(SW_KEY, 'true');
    return { success: true };
  } catch (err) {
    console.error('subscribeToPush error:', err);
    return { success: false, reason: err.message };
  }
}

export async function unsubscribeFromPush() {
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await sub.unsubscribe();
    await API.delete('/push/subscribe');
    localStorage.removeItem(SW_KEY);
  } catch {}
}

export function isPushSubscribed() {
  return localStorage.getItem(SW_KEY) === 'true';
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPushPermission() {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

// ── Helper: convert VAPID key ──────────────────────────────
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}
