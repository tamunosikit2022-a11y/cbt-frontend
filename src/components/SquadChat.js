/**
 * SquadChat.js — Scholars Syndicate
 * NEW FEATURE: Persistent async squad chat.
 * Add to Social.js: <SquadChat /> rendered in the squad tab section.
 * Polls for new messages every 10s. Messages survive page reloads.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

const EMOJIS = ["😄","👍","🔥","📚","💪","🏆","🎯","❓"];

export default function SquadChat({ squadId }) {
  const { student } = useAuth();
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState("");
  const [loading,   setLoading]   = useState(true);
  const [sending,   setSending]   = useState(false);
  const [error,     setError]     = useState("");
  const bottomRef  = useRef(null);
  const pollRef    = useRef(null);
  const lastIdRef  = useRef(0);

  const fetchMessages = useCallback(async (initial = false) => {
    try {
      const { data } = await API.get("/squads/chat", { params: { limit: 40 } });
      setMessages(data.messages || []);
      if (data.messages?.length) {
        lastIdRef.current = data.messages[data.messages.length - 1].id;
      }
    } catch (err) {
      if (initial) setError("Could not load squad chat.");
    } finally {
      if (initial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages(true);
    pollRef.current = setInterval(() => fetchMessages(false), 10000);
    return () => clearInterval(pollRef.current);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    if (!text?.trim() || sending) return;
    setSending(true);
    const optimistic = {
      id: Date.now(), sender_id: student?.id,
      sender_name: student?.full_name || "You",
      content: text.trim(), type: "text",
      created_at: new Date().toISOString(), _pending: true,
    };
    setMessages(m => [...m, optimistic]);
    setInput("");
    try {
      await API.post("/squads/chat", { content: text.trim() });
      await fetchMessages(false);
    } catch {
      setMessages(m => m.filter(x => x.id !== optimistic.id));
      setError("Message failed. Try again.");
    } finally {
      setSending(false);
    }
  };

  const deleteMsg = async (id) => {
    try {
      await API.delete(`/squads/chat/${id}`);
      setMessages(m => m.filter(x => x.id !== id));
    } catch {}
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return "just now";
    if (diff < 3600000) return `${Math.floor(diff/60000)}m ago`;
    if (diff < 86400000) return d.toLocaleTimeString("en-NG", { hour:"2-digit", minute:"2-digit" });
    return d.toLocaleDateString("en-NG", { month:"short", day:"numeric" });
  };

  const s = {
    wrap: { display:"flex", flexDirection:"column", height:"min(420px,60vh)", background:"var(--surface)", borderRadius:16, border:"1px solid rgba(255,255,255,0.07)", overflow:"hidden" },
    header: { padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.07)", fontWeight:800, fontSize:14, color:"#fff", display:"flex", alignItems:"center", gap:8 },
    body: { flex:1, overflowY:"auto", padding:"12px 14px", display:"flex", flexDirection:"column", gap:8 },
    bubble: (isMine, pending) => ({
      maxWidth:"80%", padding:"9px 12px", borderRadius:14,
      alignSelf: isMine ? "flex-end" : "flex-start",
      background: isMine ? "linear-gradient(135deg,#7C5CFF,#5B8CFF)" : "rgba(255,255,255,0.07)",
      color:"#fff", fontSize:14, lineHeight:1.5, opacity: pending ? 0.6 : 1, position:"relative",
    }),
    meta: (isMine) => ({
      fontSize:10, color:"rgba(255,255,255,0.5)", marginTop:3,
      textAlign: isMine ? "right" : "left",
    }),
    footer: { padding:"10px 12px", borderTop:"1px solid rgba(255,255,255,0.07)", display:"flex", gap:8, alignItems:"center" },
    inp: { flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:20, padding:"10px 14px", color:"#fff", fontSize:14, outline:"none", fontFamily:"inherit" },
    sendBtn: { background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)", border:"none", borderRadius:20, width:40, height:40, color:"#fff", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.header}>
        💬 Squad Chat
        <span style={{ fontSize:10, fontWeight:400, color:"rgba(255,255,255,0.4)", marginLeft:"auto" }}>
          Messages are saved — visible to all squad members
        </span>
      </div>

      <div style={s.body}>
        {loading && <div style={{ textAlign:"center", color:"rgba(255,255,255,0.3)", padding:24 }}>Loading…</div>}
        {error && <div style={{ textAlign:"center", color:"#e17055", fontSize:13 }}>{error}</div>}

        {messages.map(msg => {
          const isMine = msg.sender_id === student?.id;
          return (
            <div key={msg.id} style={{ display:"flex", flexDirection:"column", alignSelf: isMine ? "flex-end" : "flex-start", maxWidth:"80%" }}>
              {!isMine && (
                <div style={{ fontSize:11, color:"#a29bfe", fontWeight:700, marginBottom:2, paddingLeft:4 }}>{msg.sender_name}</div>
              )}
              <div style={s.bubble(isMine, msg._pending)}>
                {msg.content}
                {isMine && !msg._pending && (
                  <span
                    onClick={() => deleteMsg(msg.id)}
                    style={{ position:"absolute", top:2, right:6, fontSize:10, color:"rgba(255,255,255,0.3)", cursor:"pointer" }}>
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
      <div style={{ display:"flex", gap:4, padding:"4px 12px 0", overflowX:"auto" }}>
        {EMOJIS.map(e => (
          <button key={e} onClick={() => send(e)} style={{
            background:"none", border:"none", fontSize:20, cursor:"pointer",
            minWidth:32, padding:"2px 0", WebkitTapHighlightColor:"transparent",
          }}>{e}</button>
        ))}
      </div>

      <div style={s.footer}>
        <input
          style={s.inp}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send(input)}
          placeholder="Message your squad…"
          maxLength={500}
        />
        <button style={s.sendBtn} onClick={() => send(input)} disabled={sending}>
          {sending ? "…" : "➤"}
        </button>
      </div>
    </div>
  );
}
