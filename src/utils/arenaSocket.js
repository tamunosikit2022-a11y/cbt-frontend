/**
 * Arena Socket Utility — src/utils/arenaSocket.js
 *
 * REQUIRED: Set in Vercel environment variables:
 *   REACT_APP_API_URL = https://cbt-backend-9e41.onrender.com/api
 *
 * Socket connects to the /arena namespace on your Render backend.
 */
import { io } from "socket.io-client";

let socket = null;

function getBaseUrl() {
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000/api";
  // Strip /api to get root server URL
  return apiUrl.replace(/\/api\/?$/, "");
}

export function getArenaSocket() {
  // Reuse existing connected socket
  if (socket && socket.connected) return socket;

  // Clean up broken socket before creating new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const baseUrl = getBaseUrl();
  console.log("🏟️ Arena connecting to:", baseUrl);

  socket = io(`${baseUrl}/arena`, {
    path:                 "/socket.io",
    transports:           ["websocket", "polling"],
    reconnection:         true,
    reconnectionAttempts: 15,
    reconnectionDelay:    2000,
    timeout:              20000,
  });

  socket.on("connect",       () => console.log("✅ Arena connected:", socket.id));
  socket.on("disconnect",    (r) => console.log("Arena disconnected:", r));
  socket.on("connect_error", (e) => console.error("🔴 Arena error:", e.message));

  return socket;
}

export function disconnectArena() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
    console.log("Arena disconnected.");
  }
}
