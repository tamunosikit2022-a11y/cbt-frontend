import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import {
  speak, stop as stopSpeech, speechSupported, isSpeaking,
  startListening, stopListening, recognitionSupported,
} from '../utils/voiceUtils';

// ─── Constants ───────────────────────────────────────────────────────────────
const ACCENT       = "var(--primary)";
const ACCENT_DIM   = 'rgba(124,92,255,0.15)';
const BG           = "var(--bg)";
const CARD         = "var(--surface)";
const CARD_HOVER   = "var(--surface)";
const BORDER       = "var(--border)";
const TEXT_MUTED   = "var(--text-muted)";

const SUBJECTS = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry',
  'Biology', 'Government', 'Economics', 'Literature in English',
  'Geography', 'Commerce', 'Accounting', 'Agricultural Science',
];

const QUICK_PROMPTS = [
  { label: '🧮 Explain a topic',    text: 'Can you explain ' },
  { label: '❓ Why is this wrong?', text: 'I answered this JAMB question but got it wrong: ' },
  { label: '📝 Practice questions', text: 'Give me 5 practice questions on ' },
  { label: '💡 Solve step by step', text: 'Please solve this step by step: ' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
}

function renderMessageContent(text) {
  // Highlight QUESTION/ANSWER/EXPLANATION labels, and bold **text**
  return text
    .split('\n')
    .map((line, i) => {
      const trimmed = line.trim();
      if (/^(QUESTION:|ANSWER:|EXPLANATION:|A\)|B\)|C\)|D\))/.test(trimmed)) {
        return (
          <span key={i} style={{ display: 'block', marginTop: i === 0 ? 0 : 8 }}>
            <span style={{ color: ACCENT, fontWeight: 600 }}>
              {trimmed.split(':')[0]}:
            </span>
            {trimmed.includes(':') ? trimmed.slice(trimmed.indexOf(':') + 1) : ''}
          </span>
        );
      }
      const parts = trimmed.split(/\*\*(.*?)\*\*/g);
      const lineContent = parts.map((part, j) =>
        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
      );
      return <span key={i} style={{ display: 'block', marginTop: i === 0 ? 0 : 4 }}>{lineContent}</span>;
    });
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function MessageBubble({ msg, onSpeak, isSpeakingThis }) {
  const isUser = msg.role === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 16,
      gap: 10,
      alignItems: 'flex-end',
    }}>
      {!isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: `linear-gradient(135deg, ${ACCENT}, #A78BFF)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>
          🤖
        </div>
      )}
      <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}>
        <div style={{
          background: isUser ? `linear-gradient(135deg, ${ACCENT}, #6340E0)` : CARD_HOVER,
          border: `1px solid ${isUser ? 'transparent' : BORDER}`,
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          padding: '12px 16px',
          fontSize: 14,
          lineHeight: 1.65,
          color: isUser ? '#fff' : "#FFFFFF",
          wordBreak: 'break-word',
        }}>
          {renderMessageContent(msg.content)}
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6, textAlign: "right" }}>
            {formatTime(msg.created_at)}
          </div>
        </div>
        {/* Speak button on AI messages */}
        {!isUser && onSpeak && speechSupported() && (
          <button onClick={() => onSpeak(msg)} style={{
            background: isSpeakingThis ? `${ACCENT}33` : 'transparent',
            border: `1px solid ${isSpeakingThis ? ACCENT : "var(--surface)"}`,
            borderRadius: 8, padding: '3px 10px', cursor: 'pointer',
            color: isSpeakingThis ? ACCENT : TEXT_MUTED, fontSize: 12,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {isSpeakingThis ? '⏹ Stop' : '🔊 Listen'}
          </button>
        )}
      </div>
      {isUser && (
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          background: "var(--surface)",
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, flexShrink: 0,
        }}>
          🎓
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 16 }}>
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: `linear-gradient(135deg, ${ACCENT}, #A78BFF)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
      }}>🤖</div>
      <div style={{
        background: CARD_HOVER, border: `1px solid ${BORDER}`,
        borderRadius: '18px 18px 18px 4px', padding: '14px 18px',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: 7, height: 7, borderRadius: '50%',
            background: TEXT_MUTED,
            animation: 'aiPulse 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  );
}

function SessionItem({ session, active, onClick, onDelete }) {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        padding: '10px 14px',
        borderRadius: 10,
        cursor: 'pointer',
        background: active ? "var(--border)" : hover ? "var(--surface)" : "transparent",
        border: `1px solid ${active ? ACCENT : 'transparent'}`,
        marginBottom: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        transition: 'all 0.15s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, color: active ? '#fff' : "var(--text-sub)",
          fontWeight: active ? 600 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {session.title}
        </div>
        {session.subject && (
          <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>
            {session.subject}
          </div>
        )}
      </div>
      {(hover || active) && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(session.id); }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: TEXT_MUTED, padding: 4, fontSize: 14, lineHeight: 1,
            borderRadius: 4, flexShrink: 0,
          }}
          title="Delete chat"
        >
          🗑
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AITutor({ user }) {
  // State
  const [sessions, setSessions]           = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages]           = useState([]);
  const [input, setInput]                 = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const [isTyping, setIsTyping]           = useState(false);
  const [usage, setUsage]                 = useState({ used: 0, limit: 20, remaining: 20 });
  const [error, setError]                 = useState('');
  const [showTokenPrompt, setShowTokenPrompt] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Mobile detection ─────────────────────────────────────────────────────────
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  useEffect(() => {
    const handle = () => {
      const m = window.innerWidth <= 600;
      setIsMobile(m);
      if (!m) setSidebarOpen(false); // reset on desktop
    };
    window.addEventListener('resize', handle);
    return () => window.removeEventListener('resize', handle);
  }, []);

  // ── Voice state ──────────────────────────────────────────────────────────────
  const [voiceMode,    setVoiceMode]   = useState(false);
  const [isListening,  setIsListening] = useState(false);
  const [isSpeakingAI,setIsSpeakingAI]= useState(false);
  const [speakingMsgId,setSpeakingMsgId]=useState(null);
  const [newChatSubject, setNewChatSubject] = useState('');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // ── Scroll to bottom ──────────────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  // ── Load sessions + usage on mount ───────────────────────────────────────
  useEffect(() => {
    loadSessions();
    loadUsage();
  }, []);

  async function loadSessions() {
    try {
      const { data } = await api.get('/ai-tutor/sessions');
      setSessions(data.sessions);
    } catch { /* silent */ }
  }

  async function loadUsage() {
    try {
      const { data } = await api.get('/ai-tutor/usage');
      setUsage(data);
    } catch { /* silent */ }
  }

  // ── Load messages when session changes ────────────────────────────────────
  useEffect(() => {
    if (!activeSession) { setMessages([]); return; }
    (async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/ai-tutor/sessions/${activeSession.id}/messages`);
        setMessages(data.messages);
      } catch {
        setError('Failed to load messages');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [activeSession]);

  // ── Auto-grow textarea ────────────────────────────────────────────────────
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  // ── Send message ──────────────────────────────────────────────────────────
  async function handleSend() {
    const text = input.trim();
    if (!text || isTyping) return;
    setError('');

    // Optimistic user bubble
    const tempUserMsg = { id: 'temp', role: 'user', content: text, created_at: new Date().toISOString() };

    if (!activeSession) {
      // Create new session
      setInput('');
      setIsTyping(true);
      setMessages([tempUserMsg]);
      try {
        const { data } = await api.post('/ai-tutor/sessions', {
          subject: newChatSubject || undefined,
          initialMessage: text,
        });
        setSessions(prev => [data.session, ...prev]);
        setActiveSession(data.session);
        setMessages([tempUserMsg, data.reply]);
        setUsage(prev => ({ ...prev, used: prev.used + 1, remaining: prev.remaining - 1 }));
        // Auto-speak if voice mode on
        if (voiceMode && data.reply?.content) {
          setSpeakingMsgId(data.reply.id);
          setIsSpeakingAI(true);
          speak(data.reply.content, {
            onEnd:   () => { setIsSpeakingAI(false); setSpeakingMsgId(null); },
            onError: () => { setIsSpeakingAI(false); setSpeakingMsgId(null); },
          });
        }
      } catch (err) {
        const errData = err.response?.data;
        setError(errData?.error || 'Failed to send message');
        if (errData?.code === 'LIMIT_REACHED') setShowTokenPrompt(true);
        setMessages([]);
      } finally {
        setIsTyping(false);
      }
    } else {
      // Continue existing session
      setInput('');
      setMessages(prev => [...prev, tempUserMsg]);
      setIsTyping(true);
      try {
        const { data } = await api.post(`/ai-tutor/sessions/${activeSession.id}/messages`, { message: text });
        setMessages(prev => [...prev, data.reply]);
        setUsage(prev => ({ ...prev, used: prev.used + 1, remaining: prev.remaining - 1 }));
        // Auto-speak if voice mode on
        if (voiceMode && data.reply?.content) {
          setSpeakingMsgId(data.reply.id);
          setIsSpeakingAI(true);
          speak(data.reply.content, {
            onEnd:   () => { setIsSpeakingAI(false); setSpeakingMsgId(null); },
            onError: () => { setIsSpeakingAI(false); setSpeakingMsgId(null); },
          });
        }
      } catch (err) {
        const errData = err.response?.data;
        setError(errData?.error || 'Failed to send message');
        if (errData?.code === 'LIMIT_REACHED') setShowTokenPrompt(true);
        setMessages(prev => prev.filter(m => m.id !== 'temp'));
      } finally {
        setIsTyping(false);
      }
    }

    setNewChatSubject('');
    setShowSubjectPicker(false);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  async function handleDeleteSession(sessionId) {
    try {
      await api.delete(`/ai-tutor/sessions/${sessionId}`);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSession?.id === sessionId) {
        setActiveSession(null);
        setMessages([]);
      }
    } catch {
      setError('Failed to delete session');
    }
  }

  function startNewChat() {
    setActiveSession(null);
    setMessages([]);
    setInput('');
    setError('');
    setShowSubjectPicker(true);
  }

  function applyQuickPrompt(text) {
    setInput(text);
    textareaRef.current?.focus();
  }

  function handleMicToggle() {
    if (isListening) {
      stopListening();
      setIsListening(false);
      return;
    }
    // Stop AI speech before listening
    stopSpeech();
    setIsSpeakingAI(false);
    setIsListening(true);
    startListening({
      onResult: (transcript, isFinal) => {
        setInput(transcript);
        if (isFinal) {
          setIsListening(false);
          // Auto-send after a short delay so user can see what was transcribed
          setTimeout(() => {
            setInput(t => {
              if (t.trim()) {
                // Trigger send via ref trick
                document.getElementById('ai-send-btn')?.click();
              }
              return t;
            });
          }, 600);
        }
      },
      onError: (err) => {
        setIsListening(false);
        setError(err);
      },
      onEnd: () => setIsListening(false),
    });
  }

  function handleSpeakMessage(msg) {
    if (speakingMsgId === msg.id) {
      stopSpeech();
      setIsSpeakingAI(false);
      setSpeakingMsgId(null);
    } else {
      stopSpeech();
      setSpeakingMsgId(msg.id);
      setIsSpeakingAI(true);
      speak(msg.content, {
        onEnd:   () => { setIsSpeakingAI(false); setSpeakingMsgId(null); },
        onError: () => { setIsSpeakingAI(false); setSpeakingMsgId(null); },
      });
    }
  }

  // ─── Computed ──────────────────────────────────────────────────────────────
  const usagePct   = usage.limit > 0 ? (usage.used / usage.limit) * 100 : 0;
  const quotaColor = usagePct > 80 ? '#FF6B6B' : usagePct > 60 ? '#FFB347' : ACCENT;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{
      display: 'flex',
      height: '100dvh',
      background: BG,
      color: '#fff',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <style>{`
        @keyframes aiPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.1); }
        }
        @keyframes dot-wave   { from{transform:scaleY(0.5);opacity:0.4} to{transform:scaleY(1.3);opacity:1} }
        @keyframes typing-dot { 0%,80%,100%{opacity:0.2;transform:scale(0.8)} 40%{opacity:1;transform:scale(1)} }
        .msg-area  { flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; overscroll-behavior:contain; }
        .msg-area::-webkit-scrollbar { width:4px; }
        .msg-area::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.1); border-radius:4px; }
        .sess-list { flex:1; overflow-y:auto; }
        .sess-list::-webkit-scrollbar { width:3px; }
        .sess-list::-webkit-scrollbar-thumb { background:rgba(124,92,255,0.3); border-radius:4px; }
        .ai-textarea { font-size:16px !important; }
        .qp-btn:active { transform:scale(0.96); }
      `}</style>

      {/* ── SIDEBAR ──────────────────────────────────────────────────────────── */}
      {/* Backdrop (mobile only) */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
            backdropFilter:'blur(2px)', zIndex:99 }}
        />
      )}

      {/* Sidebar panel */}
      <div style={{
        // Desktop: always visible inline
        // Mobile: fixed overlay, slides in/out
        ...(isMobile ? {
          position: 'fixed', top:0, left:0, bottom:0, zIndex:100,
          width: 'min(280px, 85vw)',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.25s ease',
        } : {
          width: 260, flexShrink: 0,
          borderRight: '1px solid rgba(79,126,247,0.15)',
        }),
        background: "var(--bg)",
        display: 'flex', flexDirection: 'column',
        padding: '16px 12px',
        boxShadow: isMobile && sidebarOpen ? '4px 0 24px rgba(0,0,0,0.5)' : 'none',
      }}>
        {/* Sidebar header */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, paddingLeft:2 }}>
          <div style={{ fontSize:22 }}>🤖</div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, fontSize:15 }}>ScholarAI</div>
            <div style={{ fontSize:11, color:TEXT_MUTED }}>Your JAMB Tutor</div>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{
              background:'none', border:'none', color:TEXT_MUTED,
              fontSize:20, cursor:'pointer', padding:4, lineHeight:1,
            }}>✕</button>
          )}
        </div>

        {/* New chat */}
        <button onClick={() => { startNewChat(); if(isMobile) setSidebarOpen(false); }} style={{
          width:'100%', padding:'11px 14px',
          background:`linear-gradient(135deg,${ACCENT},#6340E0)`,
          border:'none', borderRadius:10, color:'#fff',
          fontSize:14, fontWeight:600, cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          marginBottom:14,
        }}>
          ✏️ New Chat
        </button>

        {/* Usage meter */}
        <div style={{ background:CARD, borderRadius:10, padding:'10px 12px', marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:6 }}>
            <span style={{ color:"var(--text-muted)" }}>Daily Messages</span>
            <span style={{ color:quotaColor, fontWeight:600 }}>{usage.used}/{usage.limit}</span>
          </div>
          <div style={{ height:4, background:"var(--surface)", borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${Math.min(usagePct,100)}%`,
              background:quotaColor, borderRadius:4, transition:'width 0.3s' }} />
          </div>
          {!user?.is_premium && (
            <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:6, textAlign:"center" }}>
              ✨ Premium: 100 msgs/day
            </div>
          )}
        </div>

        {/* Sessions */}
        <div style={{ fontSize:11, color:TEXT_MUTED, fontWeight:600,
          letterSpacing:'0.08em', marginBottom:8, paddingLeft:4 }}>
          RECENT CHATS
        </div>
        <div className="sess-list">
          {sessions.length === 0 ? (
            <div style={{ fontSize:13, color:"var(--text-muted)", textAlign:"center", marginTop:24 }}>
              No chats yet.<br/>Start a new chat above!
            </div>
          ) : sessions.map(s => (
            <SessionItem
              key={s.id}
              session={s}
              active={activeSession?.id === s.id}
              onClick={() => {
                setActiveSession(s);
                setError('');
                setShowSubjectPicker(false);
                if (isMobile) setSidebarOpen(false);
              }}
              onDelete={handleDeleteSession}
            />
          ))}
        </div>
      </div>

      {/* ── MAIN CHAT AREA ──────────────────────────────────────────────────── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'hidden' }}>

        {/* Top bar */}
        <div style={{
          padding: isMobile ? '10px 12px' : '14px 20px',
          paddingTop: `calc(${isMobile ? '10px' : '14px'} + env(safe-area-inset-top, 0px))`,
          borderBottom: `1px solid ${BORDER}`,
          display:'flex', alignItems:'center', gap:isMobile ? 10 : 14,
          background:'rgba(255,255,255,0.02)',
          flexShrink:0,
        }}>
          <button
            onClick={() => setSidebarOpen(v => !v)}
            style={{
              background:CARD, border:`1px solid ${BORDER}`, borderRadius:8,
              color:'#fff', cursor:'pointer', padding:'6px 10px', fontSize:14,
              minWidth:36, minHeight:36, display:'flex', alignItems:'center', justifyContent:'center',
            }}
          >
            ☰
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontWeight:600, fontSize: isMobile ? 14 : 15,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {activeSession ? activeSession.title : 'New Conversation'}
            </div>
            {activeSession?.subject && (
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>{activeSession.subject}</div>
            )}
          </div>
          <div style={{ fontSize: isMobile ? 11 : 12, color:"var(--text-muted)", flexShrink:0 }}>
            {usage.remaining} left
          </div>
        </div>

        {/* Messages area */}
        <div className="msg-area" style={{ padding: isMobile ? '16px 12px' : '24px 20px' }}>

          {/* Empty / welcome state */}
          {!activeSession && !isTyping && messages.length === 0 && (
            <div style={{ maxWidth:500, margin:'0 auto', textAlign:'center',
              paddingTop: isMobile ? 24 : 40 }}>
              <div style={{ fontSize: isMobile ? 44 : 56, marginBottom:12 }}>🤖</div>
              <h2 style={{ margin:'0 0 8px', fontSize: isMobile ? 18 : 22, fontWeight:700 }}>
                Hi Scholar! I&apos;m ScholarAI
              </h2>
              <p style={{ color:TEXT_MUTED, fontSize: isMobile ? 14 : 15,
                lineHeight:1.6, margin:'0 0 24px' }}>
                Ask me anything about JAMB topics, get explanations,
                or request practice problems. 🎯
              </p>

              {/* Subject picker */}
              {showSubjectPicker && (
                <div style={{ marginBottom:20, textAlign:'left' }}>
                  <div style={{ fontSize:12, color:TEXT_MUTED, marginBottom:10 }}>
                    Optional: Select a subject focus
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
                    {SUBJECTS.map(s => (
                      <button key={s}
                        onClick={() => setNewChatSubject(s === newChatSubject ? '' : s)}
                        style={{
                          padding:'7px 13px', borderRadius:20, fontSize:12,
                          border:`1px solid ${newChatSubject === s ? ACCENT : BORDER}`,
                          background: newChatSubject === s ? ACCENT_DIM : 'transparent',
                          color: newChatSubject === s ? '#fff' : "var(--text-sub)",
                          cursor:'pointer', minHeight:36,
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick prompts grid */}
              <div className="ai-quick-prompts" style={{
                display:'grid',
                gridTemplateColumns:'1fr 1fr',
                gap:10,
              }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p.label} className="qp-btn"
                    onClick={() => { setShowSubjectPicker(true); applyQuickPrompt(p.text); }}
                    style={{
                      padding:'13px 12px', textAlign:'left',
                      background:CARD, border:`1px solid ${BORDER}`,
                      borderRadius:12, color:'rgba(255,255,255,0.85)',
                      cursor:'pointer', fontSize:13, lineHeight:1.4,
                      transition:'background 0.15s', minHeight:52,
                    }}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isLoading && (
            <div style={{ textAlign:'center', color:TEXT_MUTED, padding:40 }}>
              Loading conversation…
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={msg.id || i} msg={msg}
              onSpeak={handleSpeakMessage}
              isSpeakingThis={speakingMsgId === msg.id} />
          ))}

          {isTyping && <TypingIndicator />}

          {error && (
            <div style={{
              background:'rgba(255,107,107,0.1)', border:'1px solid rgba(255,107,107,0.3)',
              borderRadius:10, padding:'12px 16px', marginBottom:16,
              fontSize:14, color:'#FF8A8A', display:'flex', gap:10, alignItems:'center',
            }}>
              <span>⚠️</span>
              <span style={{ flex:1 }}>{error}</span>
              {showTokenPrompt && (
                <a href="/store" style={{ color:ACCENT, fontWeight:700,
                  textDecoration:'none', fontSize:13, flexShrink:0,
                  background:'rgba(108,99,255,0.15)', padding:'4px 10px',
                  borderRadius:8, border:'1px solid rgba(108,99,255,0.3)',
                }}>
                  🪙 Get tokens →
                </a>
              )}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input bar ──────────────────────────────────────────────────────── */}
        <div style={{
          flexShrink: 0,
          padding: isMobile ? '8px 12px' : '12px 16px',
          paddingBottom: `calc(${isMobile ? '10px' : '12px'} + env(safe-area-inset-bottom, 0px))`,
          borderTop: `1px solid ${BORDER}`,
          background: 'rgba(255,255,255,0.02)',
        }}>
          {/* Quick prompt strip */}
          {activeSession && (
            <div style={{ display:'flex', gap:8, marginBottom:8,
              overflowX:'auto', paddingBottom:2, scrollbarWidth:'none' }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p.label} onClick={() => applyQuickPrompt(p.text)} style={{
                  padding:'5px 12px', borderRadius:20, fontSize:12,
                  border:`1px solid ${BORDER}`, background:CARD,
                  color:TEXT_MUTED, cursor:'pointer',
                  whiteSpace:'nowrap', flexShrink:0, minHeight:32,
                }}>{p.label}</button>
              ))}
            </div>
          )}

          {/* Voice bar */}
          <div style={{ display:'flex', alignItems:'center', gap:8,
            marginBottom:8, flexWrap:'wrap', minHeight:speechSupported() ? 28 : 0 }}>
            {speechSupported() && (
              <button onClick={() => { if(voiceMode){ stopSpeech(); setIsSpeakingAI(false); } setVoiceMode(v=>!v); }} style={{
                display:'flex', alignItems:'center', gap:5,
                padding:'4px 10px', borderRadius:16, minHeight:32,
                background: voiceMode ? `${ACCENT}33` : "var(--surface)",
                border:`1px solid ${voiceMode ? ACCENT : "var(--surface)"}`,
                color: voiceMode ? ACCENT : TEXT_MUTED,
                cursor:'pointer', fontSize:12, fontWeight:600,
              }}>
                {voiceMode ? '🔊 Voice On' : '🔇 Voice Off'}
              </button>
            )}
            {isSpeakingAI && (
              <>
                <div style={{ display:'flex', gap:3, alignItems:'center' }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{ width:5, height:5, borderRadius:'50%', background:ACCENT,
                      animation:`dot-wave 0.8s ease-in-out ${i*0.15}s infinite alternate` }} />
                  ))}
                  <span style={{ fontSize:11, color:TEXT_MUTED, marginLeft:4 }}>Speaking…</span>
                </div>
                <button onClick={() => { stopSpeech(); setIsSpeakingAI(false); setSpeakingMsgId(null); }} style={{
                  background:'none', border:`1px solid rgba(255,255,255,0.1)`, borderRadius:8,
                  color:TEXT_MUTED, cursor:'pointer', fontSize:11, padding:'2px 8px', minHeight:28,
                }}>⏹ Stop</button>
              </>
            )}
            {isListening && (
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'#e74c3c',
                  animation:'dot-wave 0.5s infinite alternate' }} />
                <span style={{ fontSize:12, color:'#e74c3c', fontWeight:600 }}>Listening…</span>
              </div>
            )}
          </div>

          {/* Input row */}
          <div style={{ display:'flex', gap:8, alignItems:'flex-end' }}>
            {recognitionSupported() && (
              <button onClick={handleMicToggle}
                title={isListening ? 'Stop' : 'Speak question'}
                style={{
                  width:44, height:44, borderRadius:12, flexShrink:0,
                  background: isListening ? '#e74c3c' : "var(--surface)",
                  border:`1px solid ${isListening ? '#e74c3c' : "var(--surface)"}`,
                  color: isListening ? '#fff' : TEXT_MUTED,
                  cursor:'pointer', fontSize:18,
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>🎤</button>
            )}

            <textarea
              ref={textareaRef}
              className="ai-textarea"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isListening ? 'Listening… speak now' :
                usage.remaining === 0 ? "You've reached today's limit." :
                isMobile ? 'Ask anything…' : 'Ask ScholarAI anything… (Enter to send)'
              }
              disabled={isTyping || usage.remaining === 0}
              rows={1}
              style={{
                flex:1, resize:'none', outline:'none',
                background:CARD, border:`1px solid ${input ? ACCENT : isListening ? '#e74c3c' : BORDER}`,
                borderRadius:14, padding:'12px 14px',
                color:"#FFFFFF", fontSize:16, lineHeight:1.5,
                fontFamily:'inherit', transition:'border-color 0.2s',
                maxHeight:140, overflowY:'auto',
              }}
            />

            <button
              id="ai-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isTyping || usage.remaining === 0}
              style={{
                width:44, height:44, borderRadius:12, flexShrink:0,
                background: input.trim() && !isTyping && usage.remaining > 0
                  ? `linear-gradient(135deg,${ACCENT},#6340E0)` : "var(--surface)",
                border:'none',
                cursor: input.trim() && !isTyping && usage.remaining > 0 ? 'pointer' : 'not-allowed',
                color: input.trim() && !isTyping && usage.remaining > 0 ? '#fff' : TEXT_MUTED,
                fontSize:18, display:'flex', alignItems:'center', justifyContent:'center',
              }}
            >➤</button>
          </div>

          <div style={{ fontSize:11, color:"var(--text-muted)", marginTop:6, textAlign:"center" }}>
            ScholarAI can make mistakes. Always verify important answers.
          </div>
        </div>
      </div>
    </div>
  );
}
