/**
 * arduinoApi.js — calls the one server-side piece of Phase 2: compiling a
 * sketch to a .hex file (see compileController.js for why this is safe).
 * Everything else — running the .hex, reading pin states, the circuit
 * canvas — happens entirely client-side in avrEmulator.js.
 */
import API from "../../../utils/api";

// Returns { success: true, hex, warnings } or { success: false, errors }.
// Throws only on network/transport failure (timeout, 5xx, etc.) — the
// caller should catch and show a "compiler unavailable" message.
export async function compileSketch(code, board) {
  const r = await API.post("/simulation/compile", { code, board });
  return r.data;
}
