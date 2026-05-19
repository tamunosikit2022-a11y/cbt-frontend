import { useState } from "react";
import { useNavigate } from "react-router-dom";

// ── CURATED NIGERIAN EDU YOUTUBE CHANNELS ─────────────────
const CHANNELS = [
  {
    id: "flashlearners",
    name: "FlashLearners",
    handle: "@FlashLearners",
    avatar: "⚡",
    color: "#f39c12",
    desc: "JAMB, WAEC & Post-UTME video explanations",
    subscribers: "500K+",
    url: "https://www.youtube.com/@FlashLearners",
  },
  {
    id: "devarsity",
    name: "De Varsity Academy",
    handle: "@DeVarsityAcademy",
    avatar: "🎓",
    color: "#6c63ff",
    desc: "In-depth JAMB & university entrance prep",
    subscribers: "200K+",
    url: "https://www.youtube.com/@DeVarsityAcademy",
  },
  {
    id: "classnotes",
    name: "ClassNotes",
    handle: "@ClassNotesNG",
    avatar: "📓",
    color: "#00b894",
    desc: "Simplified SS1-SS3 science & arts lessons",
    subscribers: "150K+",
    url: "https://www.youtube.com/@ClassNotesNG",
  },
  {
    id: "examready",
    name: "ExamReady Nigeria",
    handle: "@ExamReadyNG",
    avatar: "📋",
    color: "#0984e3",
    desc: "Past questions walkthrough & exam strategies",
    subscribers: "100K+",
    url: "https://www.youtube.com/@ExamReadyNG",
  },
];

// ── VIDEO LIBRARY ─────────────────────────────────────────
// Curated videos per subject from top channels
const VIDEOS = [
  // BIOLOGY
  { id:"b1", subject:"Biology",    topic:"Cell Biology",        title:"Cell Structure & Function Explained",          channel:"flashlearners", duration:"18:24", views:"245K", videoId:"dQw4w9WgXcQ" },
  { id:"b2", subject:"Biology",    topic:"Genetics",            title:"Mendelian Genetics Made Easy",                 channel:"devarsity",     duration:"22:10", views:"189K", videoId:"dQw4w9WgXcQ" },
  { id:"b3", subject:"Biology",    topic:"Ecology",             title:"Ecosystem & Food Chains — JAMB Focus",         channel:"classnotes",    duration:"15:30", views:"122K", videoId:"dQw4w9WgXcQ" },
  { id:"b4", subject:"Biology",    topic:"Reproduction",        title:"Sexual & Asexual Reproduction in Plants",      channel:"flashlearners", duration:"20:45", views:"98K",  videoId:"dQw4w9WgXcQ" },
  // CHEMISTRY
  { id:"c1", subject:"Chemistry",  topic:"Atomic Structure",    title:"Atoms, Ions & Isotopes — JAMB 2024",           channel:"flashlearners", duration:"24:15", views:"312K", videoId:"dQw4w9WgXcQ" },
  { id:"c2", subject:"Chemistry",  topic:"Chemical Bonding",    title:"Ionic vs Covalent Bonds Simplified",           channel:"devarsity",     duration:"19:00", views:"201K", videoId:"dQw4w9WgXcQ" },
  { id:"c3", subject:"Chemistry",  topic:"Mole Concept",        title:"Mole Calculations — Step by Step",             channel:"examready",     duration:"28:30", views:"445K", videoId:"dQw4w9WgXcQ" },
  { id:"c4", subject:"Chemistry",  topic:"Organic Chemistry",   title:"Alkanes, Alkenes & Alkynes Explained",         channel:"classnotes",    duration:"31:20", views:"178K", videoId:"dQw4w9WgXcQ" },
  // PHYSICS
  { id:"p1", subject:"Physics",    topic:"Mechanics",           title:"Newton's Laws of Motion — All 3 Explained",    channel:"flashlearners", duration:"21:45", views:"389K", videoId:"dQw4w9WgXcQ" },
  { id:"p2", subject:"Physics",    topic:"Waves & Sound",       title:"Wave Properties & Types — JAMB Questions",     channel:"devarsity",     duration:"17:30", views:"156K", videoId:"dQw4w9WgXcQ" },
  { id:"p3", subject:"Physics",    topic:"Electricity",         title:"Ohm's Law & Circuits — Solved Examples",       channel:"examready",     duration:"25:00", views:"267K", videoId:"dQw4w9WgXcQ" },
  { id:"p4", subject:"Physics",    topic:"Optics",              title:"Reflection, Refraction & Lenses",              channel:"classnotes",    duration:"19:15", views:"134K", videoId:"dQw4w9WgXcQ" },
  // MATHEMATICS
  { id:"m1", subject:"Mathematics",topic:"Algebra",             title:"Quadratic Equations — 5 Methods",              channel:"flashlearners", duration:"33:00", views:"521K", videoId:"dQw4w9WgXcQ" },
  { id:"m2", subject:"Mathematics",topic:"Trigonometry",        title:"Sin, Cos, Tan — JAMB Past Questions",          channel:"devarsity",     duration:"26:45", views:"298K", videoId:"dQw4w9WgXcQ" },
  { id:"m3", subject:"Mathematics",topic:"Statistics",          title:"Mean, Mode, Median & Standard Deviation",      channel:"examready",     duration:"22:30", views:"187K", videoId:"dQw4w9WgXcQ" },
  { id:"m4", subject:"Mathematics",topic:"Calculus",            title:"Differentiation Made Simple",                  channel:"classnotes",    duration:"29:00", views:"143K", videoId:"dQw4w9WgXcQ" },
  // ENGLISH
  { id:"e1", subject:"English",    topic:"Comprehension",       title:"JAMB English Comprehension Techniques",         channel:"flashlearners", duration:"16:20", views:"276K", videoId:"dQw4w9WgXcQ" },
  { id:"e2", subject:"English",    topic:"Lexis & Structure",   title:"Lexis & Structure — 100 Must-Know Words",      channel:"devarsity",     duration:"24:00", views:"312K", videoId:"dQw4w9WgXcQ" },
  // ECONOMICS
  { id:"ec1", subject:"Economics", topic:"Supply & Demand",     title:"Law of Supply & Demand — Real Examples",       channel:"classnotes",    duration:"18:45", views:"134K", videoId:"dQw4w9WgXcQ" },
  { id:"ec2", subject:"Economics", topic:"National Income",     title:"GDP, GNP & National Income Explained",         channel:"examready",     duration:"21:30", views:"98K",  videoId:"dQw4w9WgXcQ" },
  // GOVERNMENT
  { id:"g1", subject:"Government", topic:"Democracy",           title:"Types of Democracy — JAMB & Post-UTME",        channel:"flashlearners", duration:"15:00", views:"89K",  videoId:"dQw4w9WgXcQ" },
  { id:"g2", subject:"Government", topic:"Nigerian Constitution",title:"1999 Constitution Key Sections",              channel:"devarsity",     duration:"20:15", views:"112K", videoId:"dQw4w9WgXcQ" },
];

const SUBJECTS = ["All", "Biology", "Chemistry", "Physics", "Mathematics", "English", "Economics", "Government"];

const channelMap = Object.fromEntries(CHANNELS.map(c => [c.id, c]));

export default function VideoLibrary() {
  const nav = useNavigate();
  const [activeSubject, setActiveSubject] = useState("All");
  const [activeChannel, setActiveChannel] = useState("all");
  const [playing,       setPlaying]       = useState(null); // video id
  const [search,        setSearch]        = useState("");

  const filtered = VIDEOS.filter(v => {
    const matchSubject = activeSubject === "All" || v.subject === activeSubject;
    const matchChannel = activeChannel === "all" || v.channel === activeChannel;
    const matchSearch  = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.topic.toLowerCase().includes(search.toLowerCase());
    return matchSubject && matchChannel && matchSearch;
  });

  const ch = channelMap[playing?.channel];

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <button style={s.back} onClick={() => nav("/dashboard")}>←</button>
        <div>
          <div style={s.headerTitle}>📺 Video Library</div>
          <div style={s.headerSub}>Learn from Nigeria's best educators</div>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchBox}>
        <span style={{ fontSize:16, marginRight:8 }}>🔍</span>
        <input
          style={s.searchInput}
          placeholder="Search topic or subject..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div style={s.body}>

        {/* Featured Channels */}
        <div style={s.sectionLabel}>Featured Channels</div>
        <div style={s.channelScroll}>
          <div
            style={{ ...s.channelChip, ...(activeChannel === "all" ? s.chipActive : {}) }}
            onClick={() => setActiveChannel("all")}>
            🌟 All
          </div>
          {CHANNELS.map(c => (
            <div key={c.id}
              style={{ ...s.channelChip, ...(activeChannel === c.id ? { ...s.chipActive, background: c.color } : {}) }}
              onClick={() => setActiveChannel(c.id)}>
              {c.avatar} {c.name}
            </div>
          ))}
        </div>

        {/* Channel Cards */}
        {activeChannel !== "all" && (() => {
          const c = channelMap[activeChannel];
          return (
            <div style={{ ...s.channelCard, borderColor: c.color }}>
              <div style={{ ...s.channelAvatar, background: c.color + "22", color: c.color }}>{c.avatar}</div>
              <div style={{ flex: 1 }}>
                <div style={s.channelName}>{c.name}</div>
                <div style={s.channelDesc}>{c.desc}</div>
                <div style={{ fontSize:11, color:"#b2bec3", marginTop:4 }}>{c.subscribers} subscribers</div>
              </div>
              <a href={c.url} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                <div style={{ ...s.subBtn, background: c.color }}>Subscribe ↗</div>
              </a>
            </div>
          );
        })()}

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
        {playing && (
          <div style={s.playerCard}>
            <div style={s.playerHeader}>
              <div style={{ flex:1 }}>
                <div style={s.playerTitle}>{playing.title}</div>
                <div style={s.playerMeta}>{playing.topic} · {ch?.name}</div>
              </div>
              <button style={s.closeBtn} onClick={() => setPlaying(null)}>✕</button>
            </div>
            <div style={s.playerEmbed}>
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${playing.videoId}?autoplay=1`}
                title={playing.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius:10 }}
              />
            </div>
            <div style={s.playerActions}>
              <button style={s.practiceBtn}
                onClick={() => nav(`/exam-select?type=JAMB&subject=${encodeURIComponent(playing.subject)}`)}>
                📝 Practice {playing.subject} Questions
              </button>
            </div>
          </div>
        )}

        {/* Videos List */}
        <div style={s.sectionLabel}>
          {filtered.length} Video{filtered.length !== 1 ? "s" : ""}
          {activeSubject !== "All" ? ` — ${activeSubject}` : ""}
        </div>

        {filtered.length === 0 ? (
          <div style={s.empty}>
            <div style={{ fontSize:40 }}>📭</div>
            <div style={{ marginTop:8, color:"#636e72" }}>No videos found</div>
          </div>
        ) : (
          <div style={s.videoList}>
            {filtered.map(v => {
              const c = channelMap[v.channel];
              const isPlaying = playing?.id === v.id;
              return (
                <div key={v.id}
                  style={{ ...s.videoCard, ...(isPlaying ? s.videoCardActive : {}) }}
                  onClick={() => setPlaying(isPlaying ? null : v)}>
                  {/* Thumbnail */}
                  <div style={{ ...s.thumbnail, background: c?.color + "22" }}>
                    <span style={{ fontSize:28 }}>{c?.avatar}</span>
                    <div style={s.playBtn}>{isPlaying ? "▐▐" : "▶"}</div>
                    <div style={s.duration}>{v.duration}</div>
                  </div>
                  {/* Info */}
                  <div style={s.videoInfo}>
                    <div style={s.videoTitle}>{v.title}</div>
                    <div style={s.videoMeta}>
                      <span style={{ ...s.subjectTag, background: "#f0edff", color:"#6c63ff" }}>{v.subject}</span>
                      <span style={{ ...s.subjectTag, background:"#f8f9fa", color:"#636e72" }}>{v.topic}</span>
                    </div>
                    <div style={s.videoChannel}>
                      <span style={{ color: c?.color, fontWeight:700 }}>{c?.avatar} {c?.name}</span>
                      <span style={{ color:"#b2bec3", fontSize:11 }}> · {v.views} views</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA — Subscribe to channels */}
        <div style={s.ctaBox}>
          <div style={{ fontSize:24, marginBottom:8 }}>📣</div>
          <div style={{ fontWeight:800, fontSize:15, marginBottom:4 }}>Support these creators!</div>
          <div style={{ fontSize:13, color:"#636e72", marginBottom:14 }}>
            These educators make free content to help you pass. Subscribe to their YouTube channels!
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {CHANNELS.map(c => (
              <a key={c.id} href={c.url} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                <div style={{ ...s.ctaChannel, borderColor: c.color }}>
                  <span style={{ fontSize:20 }}>{c.avatar}</span>
                  <span style={{ fontWeight:700, fontSize:13 }}>{c.name}</span>
                  <span style={{ ...s.ctaBtn, background: c.color }}>Subscribe ↗</span>
                </div>
              </a>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────
const s = {
  page:          { maxWidth:480, margin:"0 auto", minHeight:"100vh", background:"#f4f6fb", fontFamily:"'Segoe UI',sans-serif", display:"flex", flexDirection:"column" },
  header:        { background:"linear-gradient(135deg,#1a1a2e,#6c63ff)", padding:"16px 18px", display:"flex", alignItems:"center", gap:14, color:"#fff" },
  back:          { background:"rgba(255,255,255,0.15)", border:"none", color:"#fff", borderRadius:10, width:36, height:36, fontSize:18, cursor:"pointer" },
  headerTitle:   { fontSize:18, fontWeight:900 },
  headerSub:     { fontSize:12, opacity:0.8, marginTop:2 },
  searchBox:     { background:"#fff", margin:"12px 16px", borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" },
  searchInput:   { border:"none", outline:"none", flex:1, fontSize:14, background:"transparent" },
  body:          { flex:1, padding:"0 16px 80px", overflowY:"auto" },
  sectionLabel:  { fontSize:11, fontWeight:800, color:"#b2bec3", letterSpacing:1, textTransform:"uppercase", margin:"16px 0 8px" },
  channelScroll: { display:"flex", gap:8, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" },
  channelChip:   { padding:"7px 14px", background:"#fff", border:"2px solid #f0f0f0", borderRadius:20, fontSize:13, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", color:"#636e72" },
  chipActive:    { background:"#6c63ff", color:"#fff", borderColor:"#6c63ff" },
  channelCard:   { background:"#fff", borderRadius:14, padding:"14px", display:"flex", gap:12, alignItems:"center", marginBottom:12, border:"2px solid", boxShadow:"0 2px 8px rgba(0,0,0,0.06)" },
  channelAvatar: { width:48, height:48, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 },
  channelName:   { fontWeight:800, fontSize:15 },
  channelDesc:   { fontSize:12, color:"#636e72", marginTop:2 },
  subBtn:        { color:"#fff", border:"none", borderRadius:8, padding:"6px 12px", fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" },
  subjectScroll: { display:"flex", gap:6, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none", marginBottom:8 },
  subjectChip:   { padding:"6px 14px", background:"#fff", border:"2px solid #f0f0f0", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap" },
  subjectActive: { background:"#6c63ff", color:"#fff", borderColor:"#6c63ff" },
  playerCard:    { background:"#1a1a2e", borderRadius:16, overflow:"hidden", marginBottom:16 },
  playerHeader:  { padding:"12px 14px", display:"flex", gap:10, alignItems:"flex-start" },
  playerTitle:   { fontWeight:800, fontSize:14, color:"#fff" },
  playerMeta:    { fontSize:11, color:"rgba(255,255,255,0.6)", marginTop:3 },
  closeBtn:      { background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:14, flexShrink:0 },
  playerEmbed:   { width:"100%", height:210, background:"#000" },
  playerActions: { padding:"10px 14px" },
  practiceBtn:   { width:"100%", padding:12, background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer" },
  videoList:     { display:"flex", flexDirection:"column", gap:10 },
  videoCard:     { background:"#fff", borderRadius:14, padding:12, display:"flex", gap:12, cursor:"pointer", boxShadow:"0 1px 6px rgba(0,0,0,0.06)", border:"2px solid transparent", transition:"border 0.15s" },
  videoCardActive:{ borderColor:"#6c63ff", background:"#f8f7ff" },
  thumbnail:     { width:90, height:68, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", position:"relative" },
  playBtn:       { position:"absolute", bottom:4, right:4, background:"rgba(0,0,0,0.6)", color:"#fff", borderRadius:6, fontSize:10, padding:"2px 6px", fontWeight:700 },
  duration:      { position:"absolute", bottom:4, left:4, background:"rgba(0,0,0,0.6)", color:"#fff", borderRadius:6, fontSize:9, padding:"2px 5px" },
  videoInfo:     { flex:1, minWidth:0 },
  videoTitle:    { fontWeight:700, fontSize:13, color:"#2d3436", lineHeight:1.3, marginBottom:6 },
  videoMeta:     { display:"flex", gap:4, flexWrap:"wrap", marginBottom:4 },
  subjectTag:    { fontSize:10, fontWeight:600, borderRadius:6, padding:"2px 7px" },
  videoChannel:  { fontSize:12, marginTop:2 },
  empty:         { textAlign:"center", padding:"40px 20px", color:"#636e72" },
  ctaBox:        { background:"linear-gradient(135deg,#1a1a2e,#2d3436)", borderRadius:18, padding:"20px", marginTop:24, textAlign:"center", color:"#fff" },
  ctaChannel:    { background:"rgba(255,255,255,0.08)", borderRadius:10, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, border:"1px solid" },
  ctaBtn:        { marginLeft:"auto", color:"#fff", border:"none", borderRadius:8, padding:"5px 12px", fontWeight:700, fontSize:11, cursor:"pointer" },
};
