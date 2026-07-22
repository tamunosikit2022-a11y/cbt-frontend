/**
 * voiceUtils.js — Text-to-Speech and Speech-to-Text helpers
 * Uses browser Web Speech API — no external services needed.
 */

// ── Text-to-Speech ─────────────────────────────────────────
let currentUtterance = null;

export function speak(text, { onStart, onEnd, onError } = {}) {
  stop(); // Cancel any ongoing speech
  if (!window.speechSynthesis) return;

  // Strip markdown-style symbols for cleaner speech
  const clean = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/[➤→←↑↓]/g, '')
    .replace(/━+/g, '')
    .trim();

  const utter = new SpeechSynthesisUtterance(clean);
  utter.lang  = 'en-NG'; // Nigerian English — falls back to en-GB/en-US
  utter.rate  = 0.95;
  utter.pitch = 1.05;
  utter.volume = 1;

  // Pick a good voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Female'))
  ) || voices.find(v => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;

  utter.onstart = onStart;
  utter.onend   = () => { currentUtterance = null; onEnd?.(); };
  utter.onerror = () => { currentUtterance = null; onError?.(); };

  currentUtterance = utter;
  window.speechSynthesis.speak(utter);
}

export function stop() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  currentUtterance = null;
}

export function isSpeaking() {
  return window.speechSynthesis?.speaking || false;
}

export function speechSupported() {
  return 'speechSynthesis' in window;
}

// ── Speech-to-Text ─────────────────────────────────────────
let recognition = null;

export function startListening({ onResult, onError, onEnd } = {}) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { onError?.('Speech recognition not supported in this browser.'); return null; }

  recognition = new SR();
  recognition.lang          = 'en-NG';
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous    = false;

  recognition.onresult = (e) => {
    const transcript = Array.from(e.results)
      .map(r => r[0].transcript)
      .join('');
    onResult?.(transcript, e.results[e.results.length - 1].isFinal);
  };

  recognition.onerror = (e) => {
    onError?.(e.error === 'not-allowed'
      ? 'Microphone access denied. Please allow microphone in your browser settings.'
      : `Voice error: ${e.error}`);
  };

  recognition.onend = () => { recognition = null; onEnd?.(); };

  recognition.start();
  return recognition;
}

export function stopListening() {
  recognition?.stop();
  recognition = null;
}

export function recognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
