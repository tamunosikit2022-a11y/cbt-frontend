import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./mobile.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<React.StrictMode><App /></React.StrictMode>);

// FIX (retention features silently dead): public/sw.js already contains a
// complete service worker — push-notification handling, offline caching,
// background sync — but it was never registered anywhere in the app. With
// no service worker registered, `navigator.serviceWorker.ready` (used by
// utils/pushNotifications.js to subscribe a device) never resolves, so
// tapping "Enable" on the notification prompt just hung on "Enabling…"
// forever and no student's device was ever actually subscribed. That's
// why daily reminders / streak alerts / daily-question pushes appeared
// "broken" — the backend cron jobs were firing correctly, they just had
// zero subscribed devices to send to. This registers it on page load.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .catch(err => console.error("Service worker registration failed:", err));
  });
}
