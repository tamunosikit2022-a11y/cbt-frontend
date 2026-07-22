/**
 * CommunityChat.js — Scholars Syndicate
 * NEW FEATURE: A single global chat room every student can post in
 * (unlike Squad Chat, which is limited to your own squad). Messages are
 * moderated server-side by the shared profanity filter — slurs/hate
 * speech are rejected outright, milder swear words are censored — so the
 * room stays usable for students of all ages without needing a human
 * moderator watching it live.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

const EMOJIS = ["😄", "👍", "🔥", "📚", "💪", "🏆", "🎯", "❓"];

export default function CommunityChat() {
  const { student } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const pollRef = useRef(null);

  const fetchMessages = useCallback(async (initial = false) => {
    try {
      const { data } = await API.get("/community-chat", { params: { limit: 50 } });
      setMessages(data.messages || []);
      if (initial) setError("");
    } catch (err) {
      if (initial) setError(err.response?.data?.error || "Could not load community chat.");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages(true);
    pollRef.current = setInterval(() => fetchMessages(false), 8000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    if (!text?.trim() || sending) return;
    setSending(true);
    setError("");
    const optimistic = {
      id: `pending-${Date.now()}`,
      sender_id: student?.id,
      sender_name: student?.full_name || "You",
      content: text.trim(),
      created_at: new Date().toISOString(),
      _pending: true,
    };
    setMessages((m) => [...m, optimistic]);
    setInput("");
    try {
      await API.post("/community-chat", { content: text.trim() });
      await fetchMessages(false);
    } catch (err) {
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
      setError(err.response?.data?.error || "Message failed. Try again.");
    } finally {
      setSending(false);
    }
  };

  const deleteMsg = async (id) => {
    try {
      await API.delete(`/community-chat/${id}`);
      setMessages((m) => m.filter((x) => x.id !== id));
    } catch {}
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-NG", { month: "short", day: "numeric" });
  };

  const s = {
    page: { minHeight: "100vh", background: "var(--bg,#0f0f1a)", padding: "20px 14px 90px", display: "flex", flexDirection: "column", alignItems: "center" },
    header: { width: "100%", maxWidth: 640, marginBottom: 14 },
    title: { fontSize: 22, fontWeight: 900, color: "#fff", margin: 0, display: "flex", alignItems: "center", gap: 8 },
    subtitle: { fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 },
    wrap: { width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", height: "min(560px,72vh)", background: "var(--surface,#181828)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.07)", overflow: "hidden" },
    body: { flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 },
    bubble: (isMine, pending) => ({
      maxWidth: "80%", padding: "9px 12px", borderRadius: 14,
      alignSelf: isMine ? "flex-end" : "flex-start",
      background: isMine ? "linear-gradient(135deg,#7C5CFF,#5B8CFF)" : "rgba(255,255,255,0.07)",
      color: "#fff", fontSize: 14, lineHeight: 1.5, opacity: pending ? 0.6 : 1, position: "relative",
    }),
    meta: (isMine) => ({ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 3, textAlign: isMine ? "right" : "left" }),
    footer: { padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: 8, alignItems: "center" },
    inp: { flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: "10px 14px", color: "#fff", fontSize: 14, outline: "none", fontFamily: "inherit" },
    sendBtn: { background: "linear-gradient(135deg,#7C5CFF,#5B8CFF)", border: "none", borderRadius: 20, width: 40, height: 40, color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  };

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>🌍 Community Chat</h1>
        <div style={s.subtitle}>
          One room for every student. Kept clean automatically — bad language gets filtered.
        </div>
      </div>

      <div style={s.wrap}>
        <div style={s.body}>
          {loading && <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 24 }}>Loading…</div>}
          {!loading && error && <div style={{ textAlign: "center", color: "#e17055", fontSize: 13, padding: "8px 0" }}>{error}</div>}
          {!loading && !messages.length && !error && (
            <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", padding: 24, fontSize: 13 }}>
              No messages yet — say hello 👋
            </div>
          )}

          {messages.map((msg) => {
            const isMine = msg.sender_id === student?.id;
            return (
              <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignSelf: isMine ? "flex-end" : "flex-start", maxWidth: "80%" }}>
                {!isMine && (
                  <div style={{ fontSize: 11, color: "#a29bfe", fontWeight: 700, marginBottom: 2, paddingLeft: 4 }}>{msg.sender_name}</div>
                )}
                <div style={s.bubble(isMine, msg._pending)}>
                  {msg.content}
                  {isMine && !msg._pending && (
                    <span
                      onClick={() => deleteMsg(msg.id)}
                      style={{ position: "absolute", top: 2, right: 6, fontSize: 10, color: "rgba(255,255,255,0.3)", cursor: "pointer" }}
                    >
                      ✕
                    </span>
                  )}
                </div>
                <div style={s.meta(isMine)}>{formatTime(msg.created_at)}</div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Emoji quick-send */}
        <div style={{ display: "flex", gap: 4, padding: "4px 12px 0", overflowX: "auto" }}>
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => send(e)}
              style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", minWidth: 32, padding: "2px 0", WebkitTapHighlightColor: "transparent" }}
            >
              {e}
            </button>
          ))}
        </div>

        {error && !loading && messages.length > 0 && (
          <div style={{ textAlign: "center", color: "#e17055", fontSize: 12, padding: "4px 12px 0" }}>{error}</div>
        )}

        <div style={s.footer}>
          <input
            style={s.inp}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send(input)}
            placeholder="Say something to everyone…"
            maxLength={500}
          />
          <button style={s.sendBtn} onClick={() => send(input)} disabled={sending}>
            {sending ? "…" : "➤"}
          </button>
        </div>
      </div>
    </div>
  );
}
