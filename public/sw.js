/**
 * sw.js — Scholars Syndicate Service Worker v3
 *
 * Strategy:
 *   Static assets  → Cache First (always fast)
 *   API /questions → Stale-While-Revalidate (offline fallback)
 *   Other API      → Network First (always fresh)
 *   Navigation     → Network with offline fallback page
 */

const APP_CACHE     = "ss-app-v3";
const QUESTION_CACHE = "ss-questions-v3";
const OFFLINE_URL   = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ── INSTALL ───────────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(APP_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ──────────────────────────────────────────────
self.addEventListener("activate", event => {
  const keep = [APP_CACHE, QUESTION_CACHE];
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => !keep.includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────────────
self.addEventListener("fetch", event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip cross-origin except our API
  const isApi = url.pathname.startsWith("/api/");
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin && !isApi) return;

  // ── Question API: Stale-While-Revalidate ──────────────
  if (isApi && (url.pathname.includes("/exam/") || url.pathname.includes("/questions"))) {
    event.respondWith(staleWhileRevalidate(request, QUESTION_CACHE));
    return;
  }

  // ── Other API: Network First ──────────────────────────
  if (isApi) {
    event.respondWith(networkFirst(request));
    return;
  }

  // ── Static assets: Cache First ───────────────────────
  if (
    request.destination === "script" ||
    request.destination === "style"  ||
    request.destination === "image"  ||
    request.destination === "font"
  ) {
    event.respondWith(cacheFirst(request, APP_CACHE));
    return;
  }

  // ── HTML navigation: Network with offline fallback ────
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(APP_CACHE).then(c => c.put(request, clone));
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Default: Network first
  event.respondWith(networkFirst(request));
});

// ── STRATEGIES ────────────────────────────────────────────
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ error: "You are offline. Please reconnect." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Update in background
  const networkPromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Return cached immediately if available, else wait for network
  return cached || networkPromise || new Response(
    JSON.stringify({ error: "Offline — no cached questions available." }),
    { status: 503, headers: { "Content-Type": "application/json" } }
  );
}

// ── BACKGROUND SYNC: queue answers when offline ───────────
self.addEventListener("sync", event => {
  if (event.tag === "sync-answers") {
    event.waitUntil(syncOfflineAnswers());
  }
});

async function syncOfflineAnswers() {
  // Implemented in the main app — SW just triggers the sync
  const clients2 = await self.clients.matchAll();
  clients2.forEach(client => client.postMessage({ type: "SYNC_ANSWERS" }));
}

// ── PUSH NOTIFICATIONS ────────────────────────────────────
self.addEventListener("push", event => {
  let data = {
    title: "Scholars Syndicate",
    body:  "You have a new notification.",
    icon:  "/icons/icon-192x192.png",
    url:   "/",
  };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch {}

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    data.icon || "/icons/icon-192x192.png",
      badge:   "/icons/icon-192x192.png",
      tag:     data.tag  || "scholars-notification",
      data:    { url: data.url || "/" },
      vibrate: [200, 100, 200],
      actions: data.actions || [],
    })
  );
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(windowClients => {
      const existing = windowClients.find(c => c.url.includes(self.location.origin));
      if (existing) { existing.focus(); existing.navigate(url); }
      else clients.openWindow(url);
    })
  );
});
