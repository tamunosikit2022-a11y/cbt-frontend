/**
 * sounds.js — lightweight audio utility using Web Audio API
 * No external files needed — all sounds are synthesized.
 */

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone({ freq = 440, freq2, duration = 0.15, gain = 0.3, type = 'sine', delay = 0 }) {
  try {
    const ac  = getCtx();
    const osc = ac.createOscillator();
    const env = ac.createGain();
    osc.connect(env);
    env.connect(ac.destination);
    osc.type      = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    if (freq2) osc.frequency.linearRampToValueAtTime(freq2, ac.currentTime + delay + duration);
    env.gain.setValueAtTime(0, ac.currentTime + delay);
    env.gain.linearRampToValueAtTime(gain, ac.currentTime + delay + 0.01);
    env.gain.linearRampToValueAtTime(0, ac.currentTime + delay + duration);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration + 0.05);
  } catch {}
}

// ── Public sound effects ──────────────────────────────────

/** Correct answer / spin win */
export function playWin() {
  playTone({ freq: 523, duration: 0.12, gain: 0.25 });
  playTone({ freq: 659, duration: 0.12, gain: 0.25, delay: 0.1 });
  playTone({ freq: 784, duration: 0.2,  gain: 0.3,  delay: 0.2 });
}

/** Wrong answer */
export function playWrong() {
  playTone({ freq: 220, freq2: 180, duration: 0.25, gain: 0.25, type: 'sawtooth' });
}

/** Chat / notification ping */
export function playPing() {
  playTone({ freq: 880, duration: 0.08, gain: 0.2 });
  playTone({ freq: 1100, duration: 0.08, gain: 0.15, delay: 0.09 });
}

/** Someone joined / approved */
export function playJoin() {
  playTone({ freq: 440, duration: 0.1, gain: 0.2 });
  playTone({ freq: 550, duration: 0.15, gain: 0.25, delay: 0.1 });
}

/** Spin wheel tick */
export function playTick() {
  playTone({ freq: 600, duration: 0.04, gain: 0.15, type: 'square' });
}

/** Button click */
export function playClick() {
  playTone({ freq: 300, duration: 0.05, gain: 0.1, type: 'square' });
}
