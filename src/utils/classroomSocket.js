import { io } from "socket.io-client";

let socket = null;

function getBaseUrl() {
  const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:3000/api";
  return apiUrl.replace(/\/api\/?$/, "");
}

export function getClassroomSocket() {
  if (socket && socket.connected) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const baseUrl = getBaseUrl();
  console.log("📚 Classroom connecting to:", baseUrl + "/arena");

  // Use /arena namespace (already works) with classroom_ prefixed events
  socket = io(`${baseUrl}/arena`, {
    path:                 "/socket.io",
    transports:           ["websocket", "polling"],
    reconnection:         true,
    reconnectionAttempts: 15,
    reconnectionDelay:    2000,
    timeout:              20000,
  });

  socket.on("connect",       () => console.log("✅ Classroom connected:", socket.id));
  socket.on("disconnect",    (r) => console.log("Classroom disconnected:", r));
  socket.on("connect_error", (e) => console.error("🔴 Classroom error:", e.message));

  return socket;
}

export function disconnectClassroom() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
