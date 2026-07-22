/**
 * avrEmulator.js — Phase 2 in-browser Arduino emulator.
 *
 * Wraps avr8js (CPU + AVRIOPort + AVRTimer + AVRUSART) so ArduinoIDE.js and
 * CircuitCanvas.js can both just: load a .hex, run it, and get callbacks
 * for serial output + digital/analog pin changes. No student code ever
 * executes outside this sandboxed simulated chip — there's no real I/O.
 *
 * This intentionally supports the Uno/Nano's ATmega328P memory map to start
 * (Phase 2 board list). Mega/Leonardo have different port layouts — see the
 * TODO near PORT_CONFIGS before enabling them for real (they're compile-only
 * today; the emulator quietly falls back to the Uno's port map, which is
 * fine for demo purposes but not accurate — flagged in the UI, see
 * ArduinoIDE.js's `boardEmulationAccurate` flag).
 */
import {
  CPU,
  AVRIOPort,
  AVRTimer,
  AVRUSART,
  portBConfig,
  portCConfig,
  portDConfig,
  timer0Config,
  usart0Config,
} from "avr8js";

const FLASH_SIZE = 0x8000; // 32KB, matches ATmega328P (Uno/Nano)
const CPU_FREQUENCY = 16_000_000; // 16MHz

// Parses an Intel HEX string into a Uint16Array program image, the format
// avr8js's CPU constructor expects.
function parseIntelHex(hexStr) {
  const program = new Uint16Array(FLASH_SIZE / 2).fill(0xffff);
  const bytes = new Uint8Array(FLASH_SIZE);
  bytes.fill(0xff);

  const lines = hexStr.split(/\r?\n/).filter((l) => l.startsWith(":"));
  let baseAddr = 0;

  for (const line of lines) {
    const byteCount = parseInt(line.substr(1, 2), 16);
    const addr = parseInt(line.substr(3, 4), 16);
    const recordType = parseInt(line.substr(7, 2), 16);

    if (recordType === 0x00) {
      const fullAddr = baseAddr + addr;
      for (let i = 0; i < byteCount; i++) {
        const byteStr = line.substr(9 + i * 2, 2);
        const b = parseInt(byteStr, 16);
        if (fullAddr + i < bytes.length) bytes[fullAddr + i] = b;
      }
    } else if (recordType === 0x04) {
      // Extended linear address
      const upper = parseInt(line.substr(9, 4), 16);
      baseAddr = upper << 16;
    } else if (recordType === 0x01) {
      break; // EOF record
    }
  }

  for (let i = 0; i < program.length; i++) {
    program[i] = bytes[i * 2] | (bytes[i * 2 + 1] << 8);
  }
  return program;
}

export class AVREmulator {
  constructor({ onSerial, onPinChange, onHalt } = {}) {
    this.onSerial = onSerial || (() => {});
    this.onPinChange = onPinChange || (() => {});
    this.onHalt = onHalt || (() => {});
    this.running = false;
    this._rafId = null;
    this._cyclesPerLoop = CPU_FREQUENCY / 60; // ~1 "frame" worth of cycles
  }

  load(hexStr) {
    this.stop();
    const program = parseIntelHex(hexStr);
    this.cpu = new CPU(program);

    this.portB = new AVRIOPort(this.cpu, portBConfig);
    this.portC = new AVRIOPort(this.cpu, portCConfig);
    this.portD = new AVRIOPort(this.cpu, portDConfig);
    this.timer0 = new AVRTimer(this.cpu, timer0Config);
    this.usart = new AVRUSART(this.cpu, usart0Config, CPU_FREQUENCY);

    this.usart.onByteTransmit = (byte) => {
      this.onSerial(String.fromCharCode(byte));
    };

    const notifyPort = (port, label) => {
      port.addListener(() => {
        this.onPinChange({ port: label, value: port.pinState ?? null });
      });
    };
    notifyPort(this.portB, "B");
    notifyPort(this.portC, "C");
    notifyPort(this.portD, "D");
  }

  start() {
    if (!this.cpu || this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      try {
        const target = this.cpu.cycles + this._cyclesPerLoop;
        while (this.cpu.cycles < target) {
          this.timer0.tick();
          this.usart.tick();
          this.cpu.tick();
        }
      } catch (err) {
        this.running = false;
        this.onHalt(err.message || "Emulator crashed");
        return;
      }
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }
}
