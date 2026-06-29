import { useState, useEffect } from "react";
import { speak, stop, isSpeaking, speechSupported } from "../utils/voiceUtils";

/**
 * TTSButton — read a question + options aloud.
 * Uses the existing voiceUtils.js (Web Speech API, no cost).
 */
export default function TTSButton({ question, options, style }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = speechSupported();

  // Stop speech when component unmounts or question changes
  useEffect(() => {
    return () => stop();
  }, [question]);

  if (!supported) return null;

  const buildText = () => {
    const opts = options
      ? Object.entries(options).map(([k, v]) => `Option ${k}: ${v}`).join(". ")
      : "";
    return `${question}. ${opts}`;
  };

  const toggle = () => {
    if (speaking || isSpeaking()) {
      stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speak(buildText(), {
        onEnd:   () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  };

  return (
    <button
      onClick={toggle}
      title={speaking ? "Stop reading" : "Read question aloud"}
      style={{
        background: speaking ? "rgba(108,99,255,0.25)" : "transparent",
        border: `1px solid ${speaking ? "#6c63ff" : "rgba(255,255,255,0.15)"}`,
        borderRadius: 8,
        color: speaking ? "#a29bfe" : "#74b9ff",
        cursor: "pointer",
        padding: "5px 10px",
        fontSize: 13,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 5,
        transition: "all 0.2s",
        ...style,
      }}
    >
      {speaking ? "⏹ Stop" : "🔊 Read"}
    </button>
  );
}
