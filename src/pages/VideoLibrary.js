import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

// ── YOUR OFFICIAL CHANNEL ─────────────────────────────────
const OFFICIAL_CHANNEL = {
  id:          "elitronix",
  name:        "ELITRONIX",
  handle:      "@elitronix1",
  url:         "https://www.youtube.com/@elitronix1",
  avatar:      "⚡",
  color:       "#6c63ff",
  desc:        "Physics, Chemistry & Mathematics — made simple by Eli Tamuno-owunari",
  country:     "Nigeria",
  isOfficial:  true,
};

// ── PARTNER CHANNELS ──────────────────────────────────────
const PARTNER_CHANNELS = [
  { id:"flashlearners", name:"FlashLearners",     handle:"@FlashLearners",      avatar:"🔦", color:"#f39c12", desc:"JAMB & WAEC past question walkthroughs",   url:"https://www.youtube.com/@FlashLearners" },
  { id:"classnotes",    name:"ClassNotes NG",      handle:"@ClassNotesNG",       avatar:"📓", color:"#00b894", desc:"SS1-SS3 simplified lessons",               url:"https://www.youtube.com/@ClassNotesNG" },
  { id:"examready",     name:"ExamReady Nigeria",  handle:"@ExamReadyNG",        avatar:"📋", color:"#0984e3", desc:"Exam strategy & past question analysis",   url:"https://www.youtube.com/@ExamReadyNG" },
];

const ALL_CHANNELS = [OFFICIAL_CHANNEL, ...PARTNER_CHANNELS];
const channelMap   = Object.fromEntries(ALL_CHANNELS.map(c => [c.id, c]));

// ── VIDEOS ────────────────────────────────────────────────
// Your actual video first, then curated from others
const VIDEOS = [
  // ── ELITRONIX OFFICIAL ──
  {
    id:"eli1", channel:"elitronix", official:true,
    subject:"General",    topic:"JAMB Experience",
    title:"How I Scored 333 in JAMB — Study Strategy That Works",
    duration:"", views:"", videoId:"", // will use channel URL as fallback
    youtubeUrl:"https://www.youtube.com/@elitronix1/videos",
    new: true,
  },
  // ── COMING SOON placeholders for your future videos ──
  {
    id:"eli2", channel:"elitronix", official:true, comingSoon:true,
    subject:"Physics",    topic:"Mechanics",
    title:"Newton's Laws of Motion — JAMB & Post-UTME Deep Dive",
    duration:"Coming soon", views:"", videoId:"",
  },
  {
    id:"eli3", channel:"elitronix", official:true, comingSoon:true,
    subject:"Chemistry",  topic:"Atomic Structure",
    title:"Atoms & Isotopes Explained Simply — with Worked Examples",
    duration:"Coming soon", views:"", videoId:"",
  },
  {
    id:"eli4", channel:"elitronix", official:true, comingSoon:true,
    subject:"Mathematics", topic:"Calculus",
    title:"The Monster of Mathematics — Calculus for JAMB",
    duration:"Coming soon", views:"", videoId:"",
  },
  // ── PARTNER VIDEOS ──
  { id:"f1", channel:"flashlearners", subject:"Biology",     topic:"Cell Biology",      title:"Cell Structure & Function — JAMB Focus",          duration:"18:24", views:"245K", videoId:"dQw4w9WgXcQ" },
  { id:"f2", channel:"flashlearners", subject:"Chemistry",   topic:"Mole Concept",      title:"Mole Calculations Step by Step",                   duration:"28:30", views:"445K", videoId:"dQw4w9WgXcQ" },
  { id:"f3", channel:"flashlearners", subject:"Physics",     topic:"Electricity",       title:"Ohm's Law & Circuits — Solved Examples",           duration:"25:00", views:"267K", videoId:"dQw4w9WgXcQ" },
  { id:"f4", channel:"flashlearners", subject:"Mathematics", topic:"Algebra",           title:"Quadratic Equations — 5 Methods",                  duration:"33:00", views:"521K", videoId:"dQw4w9WgXcQ" },
  { id:"f5", channel:"flashlearners", subject:"English",     topic:"Comprehension",     title:"JAMB English Comprehension Techniques",             duration:"16:20", views:"276K", videoId:"dQw4w9WgXcQ" },
  { id:"c1", channel:"classnotes",    subject:"Economics",   topic:"Supply & Demand",   title:"Law of Supply & Demand — Real Examples",           duration:"18:45", views:"134K", videoId:"dQw4w9WgXcQ" },
  { id:"c2", channel:"classnotes",    subject:"Government",  topic:"Democracy",         title:"Types of Democracy — JAMB & Post-UTME",            duration:"15:00", views:"89K",  videoId:"dQw4w9WgXcQ" },
  { id:"c3", channel:"classnotes",    subject:"Biology",     topic:"Genetics",          title:"Mendelian Genetics Made Easy",                      duration:"22:10", views:"189K", videoId:"dQw4w9WgXcQ" },
  { id:"e1", channel:"examready",     subject:"Chemistry",   topic:"Organic Chemistry", title:"Alkanes, Alkenes & Alkynes — Past Questions",      duration:"31:20", views:"178K", videoId:"dQw4w9WgXcQ" },
  { id:"e2", channel:"examready",     subject:"Physics",     topic:"Waves & Sound",     title:"Wave Properties & Types — JAMB Questions",         duration:"17:30", views:"156K", videoId:"dQw4w9WgXcQ" },
  { id:"e3", channel:"examready",     subject:"Mathematics", topic:"Statistics",        title:"Mean, Mode, Median — Full Breakdown",              duration:"22:30", views:"187K", videoId:"dQw4w9WgXcQ" },
];

const SUBJECTS = ["All", "General", "Physics", "Chemistry", "Mathematics", "Biology", "English", "Economics", "Government"];

export default function VideoLibrary() {
  const nav = useNavigate();
  const [activeSubject,  setActiveSubject]  = useState("All");
  const [activeChannel,  setActiveChannel]  = useState("all");
  const [playing,        setPlaying]        = useState(null);
  const [search,         setSearch]         = useState("");
  const [notifEnabled,   setNotifEnabled]   = useState(false);
  const [notifMsg,       setNotifMsg]       = useState("");
  const [student,        setStudent]        = useState(null);

  useEffect(() => {
    API.get("/auth/profile").then(r => setStudent(r.data)).catch(() => {});
    // Check if already subscribed to notifications
    const saved = localStorage.getItem("elitronix_notif");
    if (saved) setNotifEnabled(true);
  }, []);

  const enableNotifications = async () => {
    try {
      // Save phone to backend for WhatsApp/SMS notifications
      await API.post("/auth/subscribe-notifications", { channel: "elitronix" });
      localStorage.setItem("elitronix_notif", "1");
      setNotifEnabled(true);
      setNotifMsg("✅ You'll be notified when new ELITRONIX videos drop!");
      setTimeout(() => setNotifMsg(""), 4000);
    } catch {
      // Fallback — just save locally
      localStorage.setItem("elitronix_notif", "1");
      setNotifEnabled(true);
      setNotifMsg("✅ Notifications enabled!");
      setTimeout(() => setNotifMsg(""), 3000);
    }
  };

  const filtered = VIDEOS.filter(v => {
    const matchSubject = activeSubject === "All" || v.subject === activeSubject;
    const matchChannel = activeChannel === "all" || v.channel === activeChannel;
    const matchSearch  = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.topic.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchChannel && matchSearch;
  });

  const ch = playing ? channelMap[playing.channel] : null;

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => nav("/dashboard")}>←</button>
        <div style={{ flex:1 }}>
          <div style={s.headerTitle}>📺 Video Library</div>
          <div style={s.headerSub}>Learn · Practice · Win</div>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchRow}>
        <div style={s.searchBox}>
          <span style={{ fontSize:15, marginRight:8 }}>🔍</span>
          <input style={s.searchInput} placeholder="Search topic or subject..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={s.body}>

        {/* ── OFFICIAL CHANNEL HERO ── */}
        <div style={s.officialCard}>
          <div style={s.officialBadge}>⭐ OFFICIAL CHANNEL</div>
          <div style={s.officialTop}>
            <div style={s.officialAvatar}>⚡</div>
            <div style={{ flex:1 }}>
              <div style={s.officialName}>ELITRONIX</div>
              <div style={s.officialHandle}>@elitronix1 · Nigeria 🇳🇬</div>
              <div style={s.officialDesc}>Physics, Chemistry & Mathematics — made simple for Nigerian students</div>
            </div>
          </div>

          {/* Notification bell */}
          <div style={s.notifRow}>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:700, fontSize:13, color:"#fff" }}>🔔 Get notified when new videos drop</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:2 }}>We'll alert you inside the app</div>
            </div>
            <button
              style={{ ...s.notifBtn, background: notifEnabled ? "#00b894" : "rgba(255,255,255,0.25)" }}
              onClick={enableNotifications}
              disabled={notifEnabled}>
              {notifEnabled ? "✓ On" : "Enable"}
            </button>
          </div>

          {notifMsg && <div style={s.notifMsg}>{notifMsg}</div>}

          <div style={s.officialActions}>
            <a href="https://www.youtube.com/@elitronix1?sub_confirmation=1" target="_blank" rel="noreferrer" style={{ textDecoration:"none", flex:1 }}>
              <button style={s.subscribeBtn}>▶ Subscribe on YouTube</button>
            </a>
            <a href="https://www.youtube.com/@elitronix1/videos" target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
              <button style={s.viewAllBtn}>All Videos ↗</button>
            </a>
          </div>
        </div>

        {/* ELITRONIX videos section */}
        <div style={s.sectionLabel}>🎬 ELITRONIX Videos</div>
        <div style={s.eliGrid}>
          {VIDEOS.filter(v => v.channel === "elitronix").map(v => (
            <div key={v.id} style={{ ...s.eliCard, ...(v.comingSoon ? s.eliCardSoon : {}) }}
              onClick={() => !v.comingSoon && (v.youtubeUrl ? window.open(v.youtubeUrl, "_blank") : setPlaying(v))}>
              <div style={s.eliThumb}>
                {v.new && <span style={s.newBadge}>NEW</span>}
                {v.comingSoon && <span style={s.soonBadge}>SOON</span>}
                <span style={{ fontSize:28 }}>⚡</span>
                {!v.comingSoon && <div style={s.playOverlay}>▶ Watch</div>}
              </div>
              <div style={s.eliSubject}>{v.subject}</div>
              <div style={s.eliTitle}>{v.title}</div>
              {v.comingSoon && <div style={s.eliSoonText}>🔔 Enable notifications to be first to know</div>}
            </div>
          ))}
        </div>

        {/* Channel Filter */}
        <div style={s.sectionLabel}>Browse by Channel</div>
        <div style={s.channelScroll}>
          <div style={{ ...s.channelChip, ...(activeChannel === "all" ? s.chipActive : {}) }} onClick={() => setActiveChannel("all")}>🌟 All</div>
          {ALL_CHANNELS.map(c => (
            <div key={c.id}
              style={{ ...s.channelChip, ...(activeChannel === c.id ? { ...s.chipActive, background: c.isOfficial ? "#6c63ff" : c.color, borderColor: c.color } : {}) }}
              onClick={() => setActiveChannel(c.id)}>
              {c.isOfficial ? "⭐" : c.avatar} {c.name}
            </div>
          ))}
        </div>

        {/* Subject Filter */}
        <div style={s.sectionLabel}>Filter by Subject</div>
        <div style={s.subjectScroll}>
          {SUBJECTS.map(sub => (
            <div key={sub}
              style={{ ...s.subjectChip, ...(activeSubject === sub ? s.subjectActive : {}) }}
              onClick={() => setActiveSubject(sub)}>
              {sub}
            </div>
          ))}
        </div>

        {/* Video Player */}
        {playing && playing.videoId && (
          <div style={s.playerCard}>
            <div style={s.playerHeader}>
              <div style={{ flex:1 }}>
                <div style={s.playerTitle}>{playing.title}</div>
                <div style={s.playerMeta}>{playing.topic} · {channelMap[playing.channel]?.name}</div>
              </div>
              <button style={s.closeBtn} onClick={() => setPlaying(null)}>✕</button>
            </div>
            <div style={s.playerEmbed}>
              <iframe width="100%" height="100%"
                src={`https://www.youtube.com/embed/${playing.videoId}?autoplay=1`}
                title={playing.title} frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen style={{ borderRadius:10 }} />
            </div>
            <div style={s.playerActions}>
              <button style={s.practiceBtn}
                onClick={() => nav(`/exam-select?type=JAMB${playing.subject !== "General" ? `&subject=${encodeURIComponent(playing.subject)}` : ""}`)}>
                📝 Practice {playing.subject === "General" ? "JAMB" : playing.subject} Questions →
              </button>
            </div>
          </div>
        )}

        {/* All Videos */}
        <div style={s.sectionLabel}>{filtered.filter(v => !v.official).length} Partner Videos</div>
        {filtered.filter(v => !v.official).length === 0 ? (
          <div style={s.empty}><div style={{ fontSize:36 }}>📭</div><div style={{ color:"#636e72", marginTop:8 }}>No videos found</div></div>
        ) : (
          <div style={s.videoList}>
            {filtered.filter(v => !v.official).map(v => {
              const c = channelMap[v.channel];
              const isPlaying = playing?.id === v.id;
              return (
                <div key={v.id} style={{ ...s.videoCard, ...(isPlaying ? s.videoCardActive : {}) }} onClick={() => setPlaying(isPlaying ? null : v)}>
                  <div style={{ ...s.thumbnail, background: c?.color + "22" }}>
                    <span style={{ fontSize:24 }}>{c?.avatar}</span>
                    <div style={s.playBtn}>{isPlaying ? "▐▐" : "▶"}</div>
                    <div style={s.duration}>{v.duration}</div>
                  </div>
                  <div style={s.videoInfo}>
                    <div style={s.videoTitle}>{v.title}</div>
                    <div style={s.videoMeta}>
                      <span style={{ ...s.tag, background:"#f0edff", color:"#6c63ff" }}>{v.subject}</span>
                      <span style={{ ...s.tag, background:"#f8f9fa", color:"#636e72" }}>{v.topic}</span>
                    </div>
                    <div style={{ fontSize:11, marginTop:3 }}>
                      <span style={{ color: c?.color, fontWeight:700 }}>{c?.avatar} {c?.name}</span>
                      <span style={{ color:"#b2bec3" }}> · {v.views} views</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom CTA — ELITRONIX */}
        <div style={s.bottomCTA}>
          <div style={{ fontSize:32, marginBottom:8 }}>⚡</div>
          <div style={{ fontWeight:900, fontSize:18, color:"#fff", marginBottom:4 }}>Subscribe to ELITRONIX</div>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.8)", marginBottom:16, lineHeight:1.5 }}>
            Physics, Chemistry & Maths explained simply.<br/>
            Created by Eli — your Scholars CBT app developer!
          </div>
          <a href="https://www.youtube.com/@elitronix1?sub_confirmation=1" target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
            <button style={s.bigSubscribeBtn}>▶ Subscribe on YouTube — It's Free!</button>
          </a>
        </div>

      </div>
    </div>
  );
}

const s = {
  page:          { maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#f4f6fb", fontFamily:"'Segoe UI',sans-serif", display:"flex", flexDirection:"column" },
  header:        { background:"linear-gradient(135deg,#1a1a2e,#6c63ff)", padding:"16px 18px", display:"flex", alignItems:"center", gap:12, color:"#fff" },
  back:          { background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:10, width:36, height:36, fontSize:18, cursor:"pointer", flexShrink:0 },
  headerTitle:   { fontSize:18, fontWeight:900 },
  headerSub:     { fontSize:11, opacity:0.8, marginTop:1 },
  searchRow:     { padding:"10px 16px 0" },
  searchBox:     { background:"#fff", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" },
  searchInput:   { border:"none", outline:"none", flex:1, fontSize:14, background:"transparent" },
  body:          { flex:1, padding:"12px 16px 80px" },
  sectionLabel:  { fontSize:11, fontWeight:800, color:"#b2bec3", letterSpacing:1, textTransform:"uppercase", margin:"16px 0 8px" },

  // Official Channel Card
  officialCard:  { background:"linear-gradient(135deg,#6c63ff,#1a1a2e)", borderRadius:20, padding:"18px 16px", marginBottom:4 },
  officialBadge: { background:"rgba(255,215,0,0.25)", color:"#ffd700", fontSize:11, fontWeight:800, padding:"3px 10px", borderRadius:20, display:"inline-block", marginBottom:12, border:"1px solid rgba(255,215,0,0.4)" },
  officialTop:   { display:"flex", gap:12, alignItems:"flex-start", marginBottom:14 },
  officialAvatar:{ width:52, height:52, background:"rgba(255,255,255,0.15)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, flexShrink:0, border:"2px solid rgba(255,255,255,0.3)" },
  officialName:  { fontWeight:900, fontSize:18, color:"#fff" },
  officialHandle:{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:2 },
  officialDesc:  { fontSize:12, color:"rgba(255,255,255,0.85)", marginTop:4, lineHeight:1.4 },
  notifRow:      { background:"rgba(255,255,255,0.1)", borderRadius:12, padding:"10px 12px", display:"flex", alignItems:"center", gap:10, marginBottom:10 },
  notifBtn:      { border:"none", color:"#fff", borderRadius:8, padding:"7px 14px", fontWeight:800, fontSize:13, cursor:"pointer", flexShrink:0 },
  notifMsg:      { fontSize:12, color:"#00b894", fontWeight:700, marginBottom:8, textAlign:"center" },
  officialActions:{ display:"flex", gap:8 },
  subscribeBtn:  { width:"100%", padding:"11px 0", background:"#FF0000", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:13, cursor:"pointer" },
  viewAllBtn:    { padding:"11px 14px", background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", borderRadius:10, fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" },

  // Elitronix video grid
  eliGrid:       { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8 },
  eliCard:       { background:"linear-gradient(135deg,#2d3436,#636e72)", borderRadius:14, overflow:"hidden", cursor:"pointer", border:"2px solid transparent" },
  eliCardSoon:   { opacity:0.75, cursor:"default" },
  eliThumb:      { height:80, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", background:"linear-gradient(135deg,#6c63ff22,#a29bfe22)" },
  newBadge:      { position:"absolute", top:6, left:6, background:"#e17055", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:10 },
  soonBadge:     { position:"absolute", top:6, left:6, background:"#636e72", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:10 },
  playOverlay:   { position:"absolute", bottom:6, right:6, background:"rgba(108,99,255,0.9)", color:"#fff", fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:8 },
  eliSubject:    { fontSize:10, fontWeight:700, color:"#a29bfe", padding:"6px 10px 0", textTransform:"uppercase", letterSpacing:0.5 },
  eliTitle:      { fontSize:12, fontWeight:700, color:"#fff", padding:"4px 10px 10px", lineHeight:1.3 },
  eliSoonText:   { fontSize:10, color:"rgba(255,255,255,0.5)", padding:"0 10px 10px", lineHeight:1.3 },

  // Channel chips
  channelScroll: { display:"flex", gap:8, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" },
  channelChip:   { padding:"7px 14px", background:"#fff", border:"2px solid #f0f0f0", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", color:"#636e72", flexShrink:0 },
  chipActive:    { background:"#6c63ff", color:"#fff", borderColor:"#6c63ff" },

  // Subject chips
  subjectScroll: { display:"flex", gap:6, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" },
  subjectChip:   { padding:"6px 14px", background:"#fff", border:"2px solid #f0f0f0", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0 },
  subjectActive: { background:"#6c63ff", color:"#fff", borderColor:"#6c63ff" },

  // Player
  playerCard:    { background:"#1a1a2e", borderRadius:16, overflow:"hidden", marginBottom:16, marginTop:8 },
  playerHeader:  { padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start" },
  playerTitle:   { fontWeight:800, fontSize:13, color:"#fff" },
  playerMeta:    { fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:2 },
  closeBtn:      { background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:14, flexShrink:0 },
  playerEmbed:   { width:"100%", height:210, background:"#000" },
  playerActions: { padding:"10px 14px" },
  practiceBtn:   { width:"100%", padding:12, background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer" },

  // Video cards
  videoList:     { display:"flex", flexDirection:"column", gap:10 },
  videoCard:     { background:"#fff", borderRadius:14, padding:12, display:"flex", gap:12, cursor:"pointer", boxShadow:"0 1px 6px rgba(0,0,0,0.05)", border:"2px solid transparent" },
  videoCardActive:{ borderColor:"#6c63ff", background:"#f8f7ff" },
  thumbnail:     { width:88, height:66, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" },
  playBtn:       { position:"absolute", bottom:4, right:4, background:"rgba(0,0,0,0.65)", color:"#fff", borderRadius:6, fontSize:9, padding:"2px 6px", fontWeight:700 },
  duration:      { position:"absolute", bottom:4, left:4, background:"rgba(0,0,0,0.65)", color:"#fff", borderRadius:6, fontSize:9, padding:"2px 5px" },
  videoInfo:     { flex:1, minWidth:0 },
  videoTitle:    { fontWeight:700, fontSize:13, color:"#2d3436", lineHeight:1.3, marginBottom:5 },
  videoMeta:     { display:"flex", gap:4, flexWrap:"wrap", marginBottom:3 },
  tag:           { fontSize:10, fontWeight:600, borderRadius:6, padding:"2px 7px" },

  // Bottom CTA
  bottomCTA:     { background:"linear-gradient(135deg,#6c63ff,#1a1a2e)", borderRadius:20, padding:"24px 20px", marginTop:24, textAlign:"center" },
  bigSubscribeBtn:{ width:"100%", padding:14, background:"#FF0000", color:"#fff", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer" },
  empty:         { textAlign:"center", padding:"32px 20px" },
};
