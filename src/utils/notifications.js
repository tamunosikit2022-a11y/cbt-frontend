/**
 * SCHOLARS SYNDICATE — Push Notification Manager
 * ================================================
 * Handles permission requests, local scheduled notifications,
 * and streak/study reminders without needing a backend push server.
 *
 * Uses the browser's Notification API + localStorage for scheduling.
 * No VAPID keys needed for local notifications — works offline too.
 */

const STORAGE_KEY = "scholars_notifications";
const PREF_KEY    = "scholars_notif_prefs";

// ─────────────────────────────────────────────────────────
// Permission
// ─────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied")  return "denied";
  const result = await Notification.requestPermission();
  return result;
}

export function getNotificationPermission() {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

// ─────────────────────────────────────────────────────────
// Preferences (stored in localStorage)
// ─────────────────────────────────────────────────────────
export function getNotifPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY)) || {
      streakReminder:  true,
      dailyChallenge:  true,
      jambCountdown:   true,
      arenaInvite:     true,
      reminderHour:    19, // 7pm default
    };
  } catch { return {}; }
}

export function saveNotifPrefs(prefs) {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs));
}

// ─────────────────────────────────────────────────────────
// Show a notification immediately
// ─────────────────────────────────────────────────────────
export function showNotification(title, body, options = {}) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const reg = navigator.serviceWorker?.controller;
  if (reg) {
    // Via service worker (better on mobile)
    navigator.serviceWorker.ready.then(sw => {
      sw.showNotification(title, {
        body,
        icon:    "/icons/icon-192x192.png",
        badge:   "/icons/icon-192x192.png",
        tag:     options.tag || "scholars-general",
        data:    { url: options.url || "/dashboard" },
        vibrate: [200, 100, 200],
        ...options,
      });
    });
  } else {
    // Fallback: direct Notification
    new Notification(title, { body, icon: "/icons/icon-192x192.png", ...options });
  }
}

// ─────────────────────────────────────────────────────────
// Schedule daily streak reminder
// Checks once a day if student hasn't studied, fires reminder
// ─────────────────────────────────────────────────────────
export function scheduleDailyReminder(student) {
  if (getNotificationPermission() !== "granted") return;
  const prefs = getNotifPrefs();
  if (!prefs.streakReminder) return;

  const now        = new Date();
  const lastStudy  = localStorage.getItem("scholars_last_exam") || null;
  const lastStudyDate = lastStudy ? new Date(lastStudy) : null;
  const todayStr   = now.toDateString();
  const lastFiredStr = localStorage.getItem("scholars_reminder_fired");

  // Already fired today — skip
  if (lastFiredStr === todayStr) return;

  // Check if it's past their preferred reminder hour
  if (now.getHours() < (prefs.reminderHour || 19)) return;

  // If they haven't studied today — remind them
  const studiedToday = lastStudyDate && lastStudyDate.toDateString() === todayStr;
  if (!studiedToday) {
    const streak = student?.current_streak || 0;
    let title, body;

    if (streak >= 7) {
      title = `🔥 ${streak}-day streak at risk!`;
      body  = "You haven't practiced today. Don't lose your streak now — one exam is all it takes.";
    } else if (streak >= 3) {
      title = `🎯 ${streak} days strong — keep it going!`;
      body  = "JAMB prep takes consistency. Do a quick practice now and protect your streak.";
    } else {
      title = "📚 Time to practice, Scholar!";
      body  = "Daily practice is how you beat JAMB. Open Scholars Syndicate and do one exam.";
    }

    showNotification(title, body, { tag: "streak-reminder", url: "/exam-select" });
    localStorage.setItem("scholars_reminder_fired", todayStr);
  }
}

// ─────────────────────────────────────────────────────────
// JAMB countdown notification
// Fires if user has set a JAMB date and it's coming up
// ─────────────────────────────────────────────────────────
export function checkJambCountdown(jambDate) {
  if (getNotificationPermission() !== "granted") return;
  const prefs = getNotifPrefs();
  if (!prefs.jambCountdown || !jambDate) return;

  const now      = new Date();
  const exam     = new Date(jambDate);
  const daysLeft = Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
  const lastFired = localStorage.getItem("scholars_jamb_notif_fired");
  const todayStr  = now.toDateString();

  if (lastFired === todayStr) return;

  const urgentDays = [30, 14, 7, 3, 1];
  if (urgentDays.includes(daysLeft)) {
    showNotification(
      `⏳ JAMB in ${daysLeft} day${daysLeft === 1 ? "" : "s"}!`,
      daysLeft === 1
        ? "Your exam is TOMORROW. Review your weak topics now."
        : `${daysLeft} days left. Stay focused — every practice session counts.`,
      { tag: "jamb-countdown", url: "/dashboard" }
    );
    localStorage.setItem("scholars_jamb_notif_fired", todayStr);
  }
}

// ─────────────────────────────────────────────────────────
// Track last exam time (call after every completed exam)
// ─────────────────────────────────────────────────────────
export function trackExamCompleted() {
  localStorage.setItem("scholars_last_exam", new Date().toISOString());
}

// ─────────────────────────────────────────────────────────
// Initialize all notification checks
// Call once in Dashboard after mount
// ─────────────────────────────────────────────────────────
export function initNotifications(student, jambDate) {
  if (getNotificationPermission() !== "granted") return;
  scheduleDailyReminder(student);
  checkJambCountdown(jambDate);
}
