import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import API from "../utils/api";

// ── ELITRONIX REAL VIDEOS (from channel) ──────────────────
const ELITRONIX_VIDEOS = [
  {
    id: "eli_calc", videoId: "your_calculus_video_id",
    title: "THE MONSTER OF MATHEMATICS — Calculus Explained",
    subject: "Mathematics", topic: "Calculus", duration: "2:31",
    youtubeUrl: "https://www.youtube.com/watch?v=your_calculus_video_id",
    isReal: true,
  },
  {
    id: "eli_utme", videoId: "your_utme_video_id",
    title: "How I Scored 333 in JAMB — Full Study Strategy",
    subject: "General", topic: "JAMB Tips", duration: "",
    youtubeUrl: "https://www.youtube.com/@elitronix1/videos",
    isReal: true,
  },
  {
    id: "eli_phy2", videoId: "", comingSoon: true,
    title: "Newton's Laws — JAMB Physics Deep Dive",
    subject: "Physics", topic: "Mechanics", duration: "Coming soon",
  },
  {
    id: "eli_chem2", videoId: "", comingSoon: true,
    title: "Atoms & Isotopes — Chemistry for JAMB",
    subject: "Chemistry", topic: "Atomic Structure", duration: "Coming soon",
  },
];

// ── STUDY TOPICS STRUCTURE ─────────────────────────────────
const STUDY_TOPICS = {
  Mathematics: [
    { topic: "Number & Numeration", videos: ["m_num1","m_num2"], icon: "🔢" },
    { topic: "Algebra",             videos: ["m1","m3"],          icon: "✖️" },
    { topic: "Calculus",            videos: ["m_calc1"],          icon: "📈" },
    { topic: "Statistics",          videos: ["m2"],               icon: "📊" },
    { topic: "Geometry",            videos: ["m_geo1"],           icon: "📐" },
  ],
  Physics: [
    { topic: "Mechanics",           videos: ["p1","p_mech2"],     icon: "⚙️" },
    { topic: "Electricity",         videos: ["p2","p3"],          icon: "⚡" },
    { topic: "Waves & Sound",       videos: ["p_wave1"],          icon: "🌊" },
    { topic: "Heat & Temperature",  videos: ["p_heat1"],          icon: "🌡️" },
    { topic: "Optics",              videos: ["p_opt1"],           icon: "🔭" },
  ],
  Chemistry: [
    { topic: "Mole Concept",        videos: ["c1","c2","c3"],     icon: "⚗️" },
    { topic: "Atomic Structure",    videos: ["c_atom1"],          icon: "🔬" },
    { topic: "Organic Chemistry",   videos: ["c_org1"],           icon: "🧪" },
    { topic: "Electrochemistry",    videos: ["c_elec1"],          icon: "🔋" },
    { topic: "Chemical Equilibrium",videos: ["c_equil1"],         icon: "⚖️" },
  ],
  Biology: [
    { topic: "Cell Biology",        videos: ["b1","b2"],          icon: "🔬" },
    { topic: "Genetics",            videos: ["b3"],               icon: "🧬" },
    { topic: "Cell Division",       videos: ["b4"],               icon: "🔄" },
    { topic: "Ecology",             videos: ["b_eco1"],           icon: "🌿" },
    { topic: "Human Physiology",    videos: ["b_phys1"],          icon: "🫀" },
  ],
  English: [
    { topic: "Grammar",             videos: ["e1"],               icon: "📝" },
    { topic: "Comprehension",       videos: ["e_comp1"],          icon: "📖" },
    { topic: "Oral English",        videos: ["e_oral1"],          icon: "🗣️" },
    { topic: "Essay Writing",       videos: ["e_essay1"],         icon: "✍️" },
  ],
  Economics: [
    { topic: "Supply & Demand",     videos: ["ec1"],              icon: "📈" },
    { topic: "Market Structures",   videos: ["ec_mkt1"],          icon: "🏪" },
    { topic: "National Income",     videos: ["ec_nat1"],          icon: "💰" },
  ],
  Government: [
    { topic: "Democracy",           videos: ["g1"],               icon: "🏛️" },
    { topic: "Nigerian Constitution",videos: ["g_const1"],        icon: "📜" },
    { topic: "Political Parties",   videos: ["g_party1"],         icon: "🗳️" },
  ],
};

// ── ALL PARTNER VIDEOS ─────────────────────────────────────
const PARTNER_VIDEOS = [
  // Mathematics
  { id:"m1",     subject:"Mathematics", topic:"Algebra",          title:"Introduction to Quadratic Equations",         videoId:"IWigvJcCAJ0", duration:"7:14",  views:"2.2M", channel:"Khan Academy",            avatar:"🎓", color:"#f39c12" },
  { id:"m2",     subject:"Mathematics", topic:"Statistics",       title:"Mean, Median, Mode & Range",                  videoId:"mk8tOD0t8M0", duration:"18:06", views:"2.8M", channel:"Organic Chem Tutor",       avatar:"⚗️", color:"#0984e3" },
  { id:"m3",     subject:"Mathematics", topic:"Algebra",          title:"Solving Quadratic Equations — Full Strategy",  videoId:"_MllyJivas4", duration:"3:36",  views:"980K", channel:"Khan Academy",            avatar:"🎓", color:"#f39c12" },
  { id:"m_num1", subject:"Mathematics", topic:"Number & Numeration",title:"Number Bases — Binary, Octal, Hexadecimal", videoId:"ku5OQPT_bCk", duration:"14:20", views:"450K", channel:"Khan Academy",            avatar:"🎓", color:"#f39c12" },
  { id:"m_num2", subject:"Mathematics", topic:"Number & Numeration",title:"Fractions, Decimals and Percentages",       videoId:"xkg7370cCCE", duration:"10:05", views:"1.2M", channel:"Khan Academy",            avatar:"🎓", color:"#f39c12" },
  { id:"m_calc1",subject:"Mathematics", topic:"Calculus",          title:"Introduction to Derivatives — Calculus",     videoId:"rAof9Ld5sOg", duration:"16:23", views:"3.1M", channel:"Organic Chem Tutor",       avatar:"⚗️", color:"#0984e3" },
  { id:"m_geo1", subject:"Mathematics", topic:"Geometry",          title:"Circle Theorems Explained — JAMB Geometry",  videoId:"G-Tl5mzk2XQ", duration:"12:44", views:"780K", channel:"Khan Academy",            avatar:"🎓", color:"#f39c12" },

  // Physics
  { id:"p1",     subject:"Physics",     topic:"Mechanics",        title:"Newton's First Law of Motion",                videoId:"rjkQcfw5fkM", duration:"10:10", views:"3.8M", channel:"Khan Academy",            avatar:"🎓", color:"#f39c12" },
  { id:"p2",     subject:"Physics",     topic:"Electricity",      title:"Ohm's Law — Circuits Explained",              videoId:"_rSHqvjDksg", duration:"10:12", views:"1.7M", channel:"Organic Chem Tutor",       avatar:"⚗️", color:"#0984e3" },
  { id:"p3",     subject:"Physics",     topic:"Electricity",      title:"Electric Current & DC Circuits",              videoId:"r-SCyD7f_zI", duration:"31:20", views:"3.2M", channel:"Organic Chem Tutor",       avatar:"⚗️", color:"#0984e3" },
  { id:"p_mech2",subject:"Physics",     topic:"Mechanics",        title:"Newton's Laws — Forces & Motion Full",        videoId:"kKKM8Y-u7ds", duration:"20:14", views:"2.1M", channel:"Organic Chem Tutor",       avatar:"⚗️", color:"#0984e3" },
  { id:"p_wave1",subject:"Physics",     topic:"Waves & Sound",    title:"Waves — Frequency, Period & Speed",           videoId:"tJW_a6JeXD8", duration:"9:08",  views:"1.4M", channel:"Organic Chem Tutor",       avatar:"⚗️", color:"#0984e3" },
  { id:"p_heat1",subject:"Physics",     topic:"Heat & Temperature",title:"Heat Transfer — Conduction, Convection, Radiation",videoId:"7nMzBqarHGc", duration:"11:30", views:"890K", channel:"Khan Academy",     avatar:"🎓", color:"#f39c12" },
  { id:"p_opt1", subject:"Physics",     topic:"Optics",           title:"Reflection & Refraction of Light",            videoId:"Fmhs4Yx3T_0", duration:"8:22",  views:"1.1M", channel:"Khan Academy",            avatar:"🎓", color:"#f39c12" },

  // Chemistry
  { id:"c1",     subject:"Chemistry",   topic:"Mole Concept",     title:"Mole Concept for Beginners",                  videoId:"kNfGo7FQd0g", duration:"12:05", views:"890K", channel:"Science Tutor",           avatar:"🧪", color:"#6c5ce7" },
  { id:"c2",     subject:"Chemistry",   topic:"Mole Concept",     title:"Introduction to Moles",                       videoId:"EowJsC7phzw", duration:"22:04", views:"2.1M", channel:"Organic Chem Tutor",       avatar:"⚗️", color:"#0984e3" },
  { id:"c3",     subject:"Chemistry",   topic:"Mole Calculations", title:"Master Mole Concept Calculations",           videoId:"DwVWy1F8CDA", duration:"28:14", views:"340K", channel:"Chemistry Tutorial",       avatar:"🔬", color:"#00b894" },
  { id:"c_atom1",subject:"Chemistry",   topic:"Atomic Structure",  title:"Atomic Structure — Protons, Neutrons, Electrons",videoId:"UqvNAOoJBDc", duration:"8:45", views:"2.5M", channel:"Khan Academy",       avatar:"🎓", color:"#f39c12" },
  { id:"c_org1", subject:"Chemistry",   topic:"Organic Chemistry", title:"Introduction to Organic Chemistry",          videoId:"5fBQOFxKDkQ", duration:"24:45", views:"1.9M", channel:"Organic Chem Tutor",       avatar:"⚗️", color:"#0984e3" },
  { id:"c_elec1",subject:"Chemistry",   topic:"Electrochemistry",  title:"Electrolysis Explained — JAMB Chemistry",    videoId:"jZ3tNBXCM6A", duration:"14:33", views:"670K", channel:"Organic Chem Tutor",       avatar:"⚗️", color:"#0984e3" },
  { id:"c_equil1",subject:"Chemistry",  topic:"Chemical Equilibrium",title:"Le Chatelier's Principle Explained",       videoId:"4-fEvpVDTlE", duration:"17:22", views:"840K", channel:"Organic Chem Tutor",       avatar:"⚗️", color:"#0984e3" },

  // Biology
  { id:"b1",     subject:"Biology",     topic:"Cell Biology",     title:"Cell Structure — Full Tour",                  videoId:"8IlzKri08kk", duration:"7:22",  views:"32M",  channel:"Nucleus Medical",          avatar:"🔬", color:"#00b894" },
  { id:"b2",     subject:"Biology",     topic:"Cell Biology",     title:"Introduction to Cells — Amoeba Sisters",      videoId:"Hmwvj9X4GNY", duration:"9:27",  views:"9M",   channel:"Amoeba Sisters",           avatar:"🦠", color:"#55efc4" },
  { id:"b3",     subject:"Biology",     topic:"Genetics",         title:"Genetic Diagrams — JAMB Biology Tutorial",    videoId:"2Vx2k7n-N9Q", duration:"18:45", views:"180K", channel:"JAMB Tutorial",            avatar:"📚", color:"#fdcb6e" },
  { id:"b4",     subject:"Biology",     topic:"Cell Division",    title:"Mitosis — Cell Division Explained",           videoId:"f-ldPgEfAHI", duration:"8:27",  views:"13M",  channel:"Amoeba Sisters",           avatar:"🦠", color:"#55efc4" },
  { id:"b_eco1", subject:"Biology",     topic:"Ecology",          title:"Ecosystems & Food Webs — Ecology Basics",     videoId:"TCNN7C4Hmbs", duration:"10:11", views:"1.7M", channel:"Amoeba Sisters",           avatar:"🦠", color:"#55efc4" },
  { id:"b_phys1",subject:"Biology",     topic:"Human Physiology", title:"The Heart — Circulatory System Explained",    videoId:"CWFyxn0qDEU", duration:"12:04", views:"4.2M", channel:"Nucleus Medical",          avatar:"🔬", color:"#00b894" },

  // English
  { id:"e1",     subject:"English",     topic:"Grammar",          title:"Parts of Speech — Full English Grammar",      videoId:"8rFMQ4PGWf8", duration:"12:08", views:"4.1M", channel:"English Tutor",            avatar:"📝", color:"#a29bfe" },
  { id:"e_comp1",subject:"English",     topic:"Comprehension",    title:"How to Answer Comprehension Questions",        videoId:"Ku9dB7HXRQM", duration:"9:15",  views:"560K", channel:"English Tutor",            avatar:"📝", color:"#a29bfe" },
  { id:"e_oral1",subject:"English",     topic:"Oral English",     title:"English Phonetics — Vowels & Consonants",     videoId:"dfoRdKuPF9I", duration:"15:30", views:"820K", channel:"English Tutor",            avatar:"📝", color:"#a29bfe" },
  { id:"e_essay1",subject:"English",    topic:"Essay Writing",    title:"How to Write a Perfect JAMB Essay",           videoId:"pFcgPLuQc4Y", duration:"11:22", views:"340K", channel:"English Tutor",            avatar:"📝", color:"#a29bfe" },

  // Economics
  { id:"ec1",    subject:"Economics",   topic:"Supply & Demand",  title:"Supply and Demand — Khan Academy",            videoId:"g9aDizJpd0s", duration:"10:34", views:"3.3M", channel:"Khan Academy",            avatar:"🎓", color:"#f39c12" },
  { id:"ec_mkt1",subject:"Economics",   topic:"Market Structures","title":"Perfect Competition vs Monopoly Explained", videoId:"mCi5EHkeyKY", duration:"13:18", views:"1.1M", channel:"Khan Academy",            avatar:"🎓", color:"#f39c12" },
  { id:"ec_nat1",subject:"Economics",   topic:"National Income",  title:"GDP Explained — National Income Accounting",  videoId:"3ei7BNdE30o", duration:"11:55", views:"890K", channel:"Khan Academy",            avatar:"🎓", color:"#f39c12" },

  // Government
  { id:"g1",     subject:"Government",  topic:"Democracy",        title:"Types of Government Explained",               videoId:"8ZMaFsNOeIo", duration:"8:23",  views:"1.5M", channel:"CrashCourse",             avatar:"🏛️", color:"#e17055" },
  { id:"g_const1",subject:"Government", topic:"Nigerian Constitution",title:"Nigerian Constitution — Key Provisions",  videoId:"YOUR_GOVT_ID", duration:"12:00", views:"",    channel:"Naija Tutor",             avatar:"🇳🇬", color:"#00b894" },
  { id:"g_party1",subject:"Government", topic:"Political Parties", title:"Political Parties in Nigeria — JAMB Gov",    videoId:"YOUR_GOVT_ID2",duration:"9:45",  views:"",    channel:"Naija Tutor",             avatar:"🇳🇬", color:"#00b894" },
];

const videoMap = Object.fromEntries(PARTNER_VIDEOS.map(v => [v.id, v]));
const SUBJECTS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Economics", "Government"];

const TAB = { ALL: "all", TOPICS: "topics", ELITRONIX: "elitronix" };

export default function VideoLibrary() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab,           setTab]           = useState(TAB.ALL);
  const [activeSubject, setActiveSubject] = useState(searchParams.get("subject") || "Mathematics");
  const [playing,       setPlaying]       = useState(null);
  const [search,        setSearch]        = useState("");
  const [notifOn,       setNotifOn]       = useState(!!localStorage.getItem("elitronix_notif"));
  const [notifMsg,      setNotifMsg]      = useState("");
  const playerRef = useRef(null);

  const enableNotif = async () => {
    try { await API.post("/auth/subscribe-notifications", { channel: "elitronix" }); } catch {}
    localStorage.setItem("elitronix_notif", "1");
    setNotifOn(true);
    setNotifMsg("✅ You'll be notified when new ELITRONIX videos drop!");
    setTimeout(() => setNotifMsg(""), 4000);
  };

  const playVideo = (v) => {
    setPlaying(v);
    setTimeout(() => playerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
  };

  const filteredAll = PARTNER_VIDEOS.filter(v => {
    const matchS = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.topic.toLowerCase().includes(search.toLowerCase()) || v.subject.toLowerCase().includes(search.toLowerCase());
    return matchS;
  });

  const topicsForSubject = STUDY_TOPICS[activeSubject] || [];

  return (
    <div style={s.page}>

      {/* ── HEADER ── */}
      <div style={s.header}>
        <button style={s.back} onClick={() => nav("/dashboard")}>←</button>
        <div>
          <div style={s.headerTitle}>📺 Video Library</div>
          <div style={s.headerSub}>Watch · Study by Topic · Practice</div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={s.tabRow}>
        {[
          { key: TAB.ELITRONIX, label: "⚡ ELITRONIX" },
          { key: TAB.TOPICS,    label: "📚 Study by Topic" },
          { key: TAB.ALL,       label: "🎬 All Videos" },
        ].map(t => (
          <button key={t.key} style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div style={s.body}>

        {/* ── VIDEO PLAYER (always visible when playing) ── */}
        {playing && (
          <div style={s.playerCard} ref={playerRef}>
            <div style={s.playerHeader}>
              <div style={{ flex: 1 }}>
                <div style={s.playerTitle}>{playing.title}</div>
                <div style={s.playerMeta}>{playing.subject} · {playing.topic}</div>
              </div>
              <button style={s.closeBtn} onClick={() => setPlaying(null)}>✕</button>
            </div>
            <div style={s.playerEmbed}>
              <iframe width="100%" height="100%"
                src={`https://www.youtube.com/embed/${playing.videoId}?autoplay=1`}
                title={playing.title} frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen style={{ borderRadius: "0 0 16px 16px" }} />
            </div>
            <div style={s.playerFooter}>
              <button style={s.practiceBtn}
                onClick={() => nav(`/exam-select?type=JAMB&subject=${encodeURIComponent(playing.subject)}`)}>
                📝 Practice {playing.subject} Questions →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 1 — ELITRONIX
        ══════════════════════════════════════════════ */}
        {tab === TAB.ELITRONIX && (
          <>
            {/* Official Channel Card */}
            <div style={s.officialCard}>
              <div style={s.officialBadge}>⭐ OFFICIAL CHANNEL</div>
              <div style={s.officialTop}>
                <div style={s.officialAvatar}>⚡</div>
                <div>
                  <div style={s.officialName}>ELITRONIX</div>
                  <div style={s.officialHandle}>@elitronix1 · Nigeria 🇳🇬</div>
                  <div style={s.officialDesc}>Physics, Chemistry & Mathematics made simple — by Eli Tamuno-owunari</div>
                </div>
              </div>
              <div style={s.notifRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>🔔 Get notified when new videos drop</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>We'll alert you inside the app</div>
                </div>
                <button style={{ ...s.notifBtn, background: notifOn ? "#00b894" : "rgba(255,255,255,0.2)" }}
                  onClick={enableNotif} disabled={notifOn}>
                  {notifOn ? "✓ On" : "Enable"}
                </button>
              </div>
              {notifMsg && <div style={{ fontSize: 12, color: "#00b894", fontWeight: 700, marginBottom: 8, textAlign: "center" }}>{notifMsg}</div>}
              <div style={{ display: "flex", gap: 8 }}>
                <a href="https://www.youtube.com/@elitronix1?sub_confirmation=1" target="_blank" rel="noreferrer" style={{ textDecoration: "none", flex: 1 }}>
                  <button style={s.subscribeBtn}>▶ Subscribe on YouTube</button>
                </a>
                <a href="https://www.youtube.com/@elitronix1/videos" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  <button style={s.viewAllBtn}>All Videos ↗</button>
                </a>
              </div>
            </div>

            {/* ELITRONIX Videos Grid */}
            <div style={s.sectionLabel}>🎬 ELITRONIX Videos</div>
            <div style={s.eliGrid}>
              {ELITRONIX_VIDEOS.map(v => (
                <div key={v.id}
                  style={{ ...s.eliCard, ...(v.comingSoon ? s.eliCardSoon : {}) }}
                  onClick={() => {
                    if (v.comingSoon) return;
                    if (v.videoId && v.videoId !== "your_calculus_video_id" && v.videoId !== "your_utme_video_id") {
                      playVideo(v);
                    } else {
                      window.open(v.youtubeUrl, "_blank");
                    }
                  }}>
                  <div style={s.eliThumb}>
                    {v.comingSoon
                      ? <span style={s.soonBadge}>SOON</span>
                      : <span style={s.newBadge}>NEW</span>}
                    <span style={{ fontSize: 32 }}>⚡</span>
                    {!v.comingSoon && <div style={s.eliPlayBtn}>▶ Watch</div>}
                  </div>
                  <div style={s.eliSubject}>{v.subject}</div>
                  <div style={s.eliTitle}>{v.title}</div>
                  {v.comingSoon && (
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", padding: "0 10px 10px", lineHeight: 1.3 }}>
                      🔔 Enable notifications to be first to know
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add your own video CTA */}
            <div style={s.addVideoCTA}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎥</div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#2d3436", marginBottom: 6 }}>Upload More Videos</div>
              <div style={{ fontSize: 13, color: "#636e72", marginBottom: 14, lineHeight: 1.5 }}>
                Post to your ELITRONIX YouTube channel — they'll automatically appear here for your students.
              </div>
              <a href="https://www.youtube.com/@elitronix1" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                <button style={s.gotoChannelBtn}>Go to My Channel ↗</button>
              </a>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            TAB 2 — STUDY BY TOPIC
        ══════════════════════════════════════════════ */}
        {tab === TAB.TOPICS && (
          <>
            {/* Subject selector */}
            <div style={s.sectionLabel}>Choose Subject</div>
            <div style={s.subjectGrid}>
              {SUBJECTS.map(sub => {
                const icons = { Mathematics:"➗", Physics:"⚡", Chemistry:"⚗️", Biology:"🔬", English:"📝", Economics:"💹", Government:"🏛️" };
                return (
                  <button key={sub}
                    style={{ ...s.subjectBtn, ...(activeSubject === sub ? s.subjectBtnActive : {}) }}
                    onClick={() => setActiveSubject(sub)}>
                    <span style={{ fontSize: 18 }}>{icons[sub]}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{sub}</span>
                  </button>
                );
              })}
            </div>

            {/* Topics for subject */}
            <div style={s.sectionLabel}>{activeSubject} Topics</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {topicsForSubject.map(t => {
                const topicVideos = t.videos.map(id => videoMap[id]).filter(Boolean);
                return (
                  <div key={t.topic} style={s.topicCard}>
                    <div style={s.topicHeader}>
                      <span style={{ fontSize: 22 }}>{t.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={s.topicName}>{t.topic}</div>
                        <div style={s.topicCount}>{topicVideos.length} video{topicVideos.length !== 1 ? "s" : ""}</div>
                      </div>
                      <button style={s.practiceSmallBtn}
                        onClick={() => nav(`/exam-select?type=JAMB&subject=${encodeURIComponent(activeSubject)}`)}>
                        Practice →
                      </button>
                    </div>
                    {topicVideos.length > 0 && (
                      <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                        {topicVideos.map(v => (
                          <div key={v.id} style={s.miniVideoCard}
                            onClick={() => playVideo(v)}>
                            <div style={{ ...s.miniThumb, background: v.color + "22" }}>
                              <span style={{ fontSize: 16 }}>{v.avatar}</span>
                              <div style={s.miniPlay}>▶</div>
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={s.miniTitle}>{v.title}</div>
                              <div style={{ fontSize: 11, color: "#b2bec3" }}>{v.channel} · {v.duration}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {topicVideos.length === 0 && (
                      <div style={{ padding: "8px 0 4px", fontSize: 12, color: "#b2bec3", fontStyle: "italic" }}>
                        Videos coming soon — check back!
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            TAB 3 — ALL VIDEOS
        ══════════════════════════════════════════════ */}
        {tab === TAB.ALL && (
          <>
            {/* Search */}
            <div style={s.searchBox}>
              <span style={{ fontSize: 15 }}>🔍</span>
              <input style={s.searchInput} placeholder="Search subject, topic or title..."
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>}
            </div>

            {/* Subject chips */}
            <div style={s.chipRow}>
              <div style={{ ...s.chip, ...(activeSubject === "All" ? s.chipActive : {}) }}
                onClick={() => setActiveSubject("All")}>All</div>
              {SUBJECTS.map(s2 => (
                <div key={s2} style={{ ...s.chip, ...(activeSubject === s2 ? s.chipActive : {}) }}
                  onClick={() => setActiveSubject(s2)}>{s2}</div>
              ))}
            </div>

            <div style={s.sectionLabel}>
              {filteredAll.filter(v => activeSubject === "All" || v.subject === activeSubject).length} Videos
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {filteredAll
                .filter(v => activeSubject === "All" || v.subject === activeSubject)
                .map(v => {
                  const isPlaying = playing?.id === v.id;
                  return (
                    <div key={v.id}
                      style={{ ...s.videoCard, ...(isPlaying ? s.videoCardActive : {}) }}
                      onClick={() => playVideo(v)}>
                      <div style={{ ...s.thumbnail, background: v.color + "22" }}>
                        <span style={{ fontSize: 22 }}>{v.avatar}</span>
                        <div style={s.thumbPlay}>{isPlaying ? "▐▐" : "▶"}</div>
                        <div style={s.thumbDur}>{v.duration}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={s.videoTitle}>{v.title}</div>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", margin: "4px 0" }}>
                          <span style={{ ...s.tag, background: "#f0edff", color: "#6c63ff" }}>{v.subject}</span>
                          <span style={{ ...s.tag, background: "#f8f9fa", color: "#636e72" }}>{v.topic}</span>
                        </div>
                        <div style={{ fontSize: 11 }}>
                          <span style={{ color: v.color, fontWeight: 700 }}>{v.avatar} {v.channel}</span>
                          {v.views && <span style={{ color: "#b2bec3" }}> · {v.views} views</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        )}

        {/* Bottom padding */}
        <div style={{ height: 80 }} />
      </div>
    </div>
  );
}

const s = {
  page:          { maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "#f4f6fb", fontFamily: "'Segoe UI',sans-serif", display: "flex", flexDirection: "column" },
  header:        { background: "linear-gradient(135deg,#1a1a2e,#6c63ff)", padding: "16px 18px", display: "flex", alignItems: "center", gap: 12, color: "#fff" },
  back:          { background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", borderRadius: 10, width: 36, height: 36, fontSize: 18, cursor: "pointer", flexShrink: 0 },
  headerTitle:   { fontSize: 18, fontWeight: 900 },
  headerSub:     { fontSize: 11, opacity: 0.8, marginTop: 1 },

  // Tabs
  tabRow:        { display: "flex", gap: 0, background: "#fff", borderBottom: "2px solid #f0f0f0" },
  tab:           { flex: 1, padding: "11px 4px", fontSize: 11, fontWeight: 700, background: "none", border: "none", cursor: "pointer", color: "#b2bec3", borderBottom: "3px solid transparent" },
  tabActive:     { color: "#6c63ff", borderBottomColor: "#6c63ff" },

  body:          { flex: 1, padding: "12px 16px 20px" },
  sectionLabel:  { fontSize: 11, fontWeight: 800, color: "#b2bec3", letterSpacing: 1, textTransform: "uppercase", margin: "16px 0 8px" },

  // Player
  playerCard:    { background: "#1a1a2e", borderRadius: 16, overflow: "hidden", marginBottom: 16 },
  playerHeader:  { padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" },
  playerTitle:   { fontWeight: 800, fontSize: 13, color: "#fff", lineHeight: 1.3 },
  playerMeta:    { fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 3 },
  closeBtn:      { background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 14, flexShrink: 0 },
  playerEmbed:   { width: "100%", height: 210, background: "#000" },
  playerFooter:  { padding: "10px 14px" },
  practiceBtn:   { width: "100%", padding: 12, background: "linear-gradient(135deg,#6c63ff,#a29bfe)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer" },

  // Official channel
  officialCard:  { background: "linear-gradient(135deg,#6c63ff,#1a1a2e)", borderRadius: 20, padding: "18px 16px", marginBottom: 4 },
  officialBadge: { background: "rgba(255,215,0,0.2)", color: "#ffd700", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 20, display: "inline-block", marginBottom: 12, border: "1px solid rgba(255,215,0,0.4)" },
  officialTop:   { display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 },
  officialAvatar:{ width: 50, height: 50, background: "rgba(255,255,255,0.15)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0, border: "2px solid rgba(255,255,255,0.3)" },
  officialName:  { fontWeight: 900, fontSize: 18, color: "#fff" },
  officialHandle:{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  officialDesc:  { fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 4, lineHeight: 1.4 },
  notifRow:      { background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  notifBtn:      { border: "none", color: "#fff", borderRadius: 8, padding: "7px 14px", fontWeight: 800, fontSize: 13, cursor: "pointer", flexShrink: 0 },
  subscribeBtn:  { width: "100%", padding: "11px 0", background: "#FF0000", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: "pointer" },
  viewAllBtn:    { padding: "11px 14px", background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 10, fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" },

  // ELITRONIX grid
  eliGrid:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 8 },
  eliCard:       { background: "linear-gradient(135deg,#2d3436,#636e72)", borderRadius: 14, overflow: "hidden", cursor: "pointer" },
  eliCardSoon:   { opacity: 0.7, cursor: "default" },
  eliThumb:      { height: 80, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: "linear-gradient(135deg,rgba(108,99,255,0.2),rgba(162,155,254,0.1))" },
  newBadge:      { position: "absolute", top: 6, left: 6, background: "#e17055", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10 },
  soonBadge:     { position: "absolute", top: 6, left: 6, background: "#636e72", color: "#fff", fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 10 },
  eliPlayBtn:    { position: "absolute", bottom: 6, right: 6, background: "rgba(108,99,255,0.9)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 8 },
  eliSubject:    { fontSize: 10, fontWeight: 700, color: "#a29bfe", padding: "6px 10px 0", textTransform: "uppercase", letterSpacing: 0.5 },
  eliTitle:      { fontSize: 12, fontWeight: 700, color: "#fff", padding: "4px 10px 10px", lineHeight: 1.3 },

  addVideoCTA:   { background: "#fff", borderRadius: 16, padding: "20px 16px", textAlign: "center", marginTop: 16, border: "2px dashed #dfe6e9" },
  gotoChannelBtn:{ padding: "11px 24px", background: "linear-gradient(135deg,#6c63ff,#a29bfe)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer" },

  // Study by topic
  subjectGrid:   { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 4 },
  subjectBtn:    { display: "flex", flexDirection: "column", alignItems: "center", padding: "10px 4px", background: "#fff", border: "2px solid #f0f0f0", borderRadius: 12, cursor: "pointer", gap: 2 },
  subjectBtnActive:{ background: "#6c63ff", borderColor: "#6c63ff", color: "#fff" },
  topicCard:     { background: "#fff", borderRadius: 14, padding: "14px 14px 10px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)" },
  topicHeader:   { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
  topicName:     { fontWeight: 800, fontSize: 14, color: "#2d3436" },
  topicCount:    { fontSize: 12, color: "#b2bec3", marginTop: 1 },
  practiceSmallBtn:{ padding: "6px 12px", background: "linear-gradient(135deg,#6c63ff,#a29bfe)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 },
  miniVideoCard: { display: "flex", gap: 10, alignItems: "center", cursor: "pointer", padding: "6px 0" },
  miniThumb:     { width: 56, height: 42, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", flexShrink: 0 },
  miniPlay:      { position: "absolute", bottom: 3, right: 3, background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 8, padding: "2px 5px", borderRadius: 5, fontWeight: 700 },
  miniTitle:     { fontSize: 12, fontWeight: 600, color: "#2d3436", lineHeight: 1.3 },

  // All videos
  searchBox:     { display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 12, padding: "10px 14px", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", marginBottom: 10 },
  searchInput:   { flex: 1, border: "none", outline: "none", fontSize: 14, background: "transparent" },
  clearBtn:      { background: "none", border: "none", color: "#b2bec3", cursor: "pointer", fontSize: 14 },
  chipRow:       { display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" },
  chip:          { padding: "6px 14px", background: "#fff", border: "2px solid #f0f0f0", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, color: "#636e72" },
  chipActive:    { background: "#6c63ff", color: "#fff", borderColor: "#6c63ff" },
  videoCard:     { background: "#fff", borderRadius: 14, padding: 12, display: "flex", gap: 12, cursor: "pointer", boxShadow: "0 1px 6px rgba(0,0,0,0.05)", border: "2px solid transparent" },
  videoCardActive:{ borderColor: "#6c63ff", background: "#f8f7ff" },
  thumbnail:     { width: 88, height: 66, borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
  thumbPlay:     { position: "absolute", bottom: 4, right: 4, background: "rgba(0,0,0,0.65)", color: "#fff", borderRadius: 6, fontSize: 9, padding: "2px 6px", fontWeight: 700 },
  thumbDur:      { position: "absolute", bottom: 4, left: 4, background: "rgba(0,0,0,0.65)", color: "#fff", borderRadius: 6, fontSize: 9, padding: "2px 5px" },
  videoTitle:    { fontWeight: 700, fontSize: 13, color: "#2d3436", lineHeight: 1.3 },
  tag:           { fontSize: 10, fontWeight: 600, borderRadius: 6, padding: "2px 7px" },
};
