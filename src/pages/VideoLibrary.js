import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

// ── YOUR REAL JAMB VIDEO (only one that plays in-app) ─────────
const JAMB_VIDEO = {
  id: "eli_jamb",
  videoId: "XsYqCLlNfms",
  title: "How I Scored 333 in JAMB — Full Study Strategy That Works",
  subject: "General",
  topic: "JAMB Strategy",
  channel: "ELITRONIX",
};

// ── COMING SOON ELITRONIX VIDEOS (redirect to YouTube) ────────
const ELITRONIX_COMING = [
  { id:"eli2", subject:"Physics",     topic:"Mechanics",       title:"Newton's Laws of Motion — JAMB Physics Deep Dive" },
  { id:"eli3", subject:"Chemistry",   topic:"Atomic Structure", title:"Atoms & Isotopes — Simplified for JAMB" },
  { id:"eli4", subject:"Mathematics", topic:"Calculus",         title:"The Monster of Mathematics — Calculus for JAMB" },
  { id:"eli5", subject:"Biology",     topic:"Cell Biology",     title:"Cell Structure & Functions — JAMB Biology" },
];

// ── VERIFIED PARTNER VIDEOS (all IDs manually confirmed) ──────
// Format: opens YouTube in new tab (not embedded) to respect their content
const PARTNER_VIDEOS = [
  // Mathematics - VERIFIED
  { id:"m1",  subject:"Mathematics", topic:"Algebra",     title:"Introduction to Quadratic Equations",       videoId:"IWigvJcCAJ0", duration:"7:14",  views:"2.2M", channel:"Khan Academy",         avatar:"🎓", color:"#f39c12" },
  { id:"m3",  subject:"Mathematics", topic:"Algebra",     title:"Strategy: Solving Quadratic Equations",      videoId:"_MllyJivas4", duration:"3:36",  views:"980K", channel:"Khan Academy",         avatar:"🎓", color:"#f39c12" },
  { id:"m2",  subject:"Mathematics", topic:"Statistics",  title:"Mean, Median, Mode & Range",                videoId:"mk8tOD0t8M0", duration:"18:06", views:"2.8M", channel:"Math Tutor",           avatar:"📊", color:"#6c5ce7" },
  // Mathematics - search links (unverified IDs replaced)
  { id:"m_num1", subject:"Mathematics", topic:"Number & Numeration", title:"Number Bases — Binary, Octal, Hexadecimal", searchQuery:"number bases binary octal JAMB mathematics", duration:"", views:"", channel:"Khan Academy", avatar:"🎓", color:"#f39c12" },
  { id:"m_calc1",subject:"Mathematics", topic:"Calculus",            title:"Introduction to Derivatives — Calculus",    searchQuery:"introduction derivatives calculus tutorial",  duration:"", views:"", channel:"Organic Chem Tutor", avatar:"⚗️", color:"#0984e3" },
  { id:"m_geo1", subject:"Mathematics", topic:"Geometry",            title:"Circle Theorems Explained",                  searchQuery:"circle theorems JAMB mathematics explained",  duration:"", views:"", channel:"Khan Academy", avatar:"🎓", color:"#f39c12" },

  // Physics - VERIFIED
  { id:"p1",  subject:"Physics", topic:"Mechanics",    title:"Newton's First Law of Motion",               videoId:"rjkQcfw5fkM", duration:"10:10", views:"3.8M", channel:"Khan Academy",         avatar:"🎓", color:"#f39c12" },
  { id:"p2",  subject:"Physics", topic:"Electricity",  title:"Ohm's Law — Circuits Explained",             videoId:"_rSHqvjDksg", duration:"10:12", views:"1.7M", channel:"Organic Chem Tutor",   avatar:"⚗️", color:"#0984e3" },
  // Physics - search links
  { id:"p_wave1", subject:"Physics", topic:"Waves & Sound",     title:"Waves — Frequency, Period & Speed",       searchQuery:"waves frequency period speed physics tutorial",   duration:"", views:"", channel:"Organic Chem Tutor", avatar:"⚗️", color:"#0984e3" },
  { id:"p_heat1", subject:"Physics", topic:"Heat & Temperature",title:"Heat Transfer — Conduction, Convection",  searchQuery:"heat transfer conduction convection radiation physics", duration:"", views:"", channel:"Khan Academy", avatar:"🎓", color:"#f39c12" },
  { id:"p_opt1",  subject:"Physics", topic:"Optics",            title:"Reflection & Refraction of Light",        searchQuery:"reflection refraction light physics JAMB",        duration:"", views:"", channel:"Khan Academy", avatar:"🎓", color:"#f39c12" },

  // Chemistry - VERIFIED
  { id:"c2",  subject:"Chemistry", topic:"Mole Concept",  title:"Introduction to Moles",                     videoId:"EowJsC7phzw", duration:"22:04", views:"2.1M", channel:"Organic Chem Tutor",   avatar:"⚗️", color:"#0984e3" },
  // Chemistry - search links
  { id:"c_atom1", subject:"Chemistry", topic:"Atomic Structure",    title:"Atomic Structure — Protons, Neutrons, Electrons", searchQuery:"atomic structure protons neutrons electrons JAMB chemistry", duration:"", views:"", channel:"Organic Chem Tutor", avatar:"⚗️", color:"#0984e3" },
  { id:"c_org1",  subject:"Chemistry", topic:"Organic Chemistry",   title:"Introduction to Organic Chemistry",               searchQuery:"introduction organic chemistry JAMB",              duration:"", views:"", channel:"Organic Chem Tutor", avatar:"⚗️", color:"#0984e3" },
  { id:"c_elec1", subject:"Chemistry", topic:"Electrochemistry",    title:"Electrolysis Explained — JAMB Chemistry",         searchQuery:"electrolysis explained JAMB chemistry",           duration:"", views:"", channel:"Organic Chem Tutor", avatar:"⚗️", color:"#0984e3" },
  { id:"c_equil1",subject:"Chemistry", topic:"Chemical Equilibrium",title:"Le Chatelier's Principle Explained",              searchQuery:"Le Chatelier principle chemical equilibrium",     duration:"", views:"", channel:"Organic Chem Tutor", avatar:"⚗️", color:"#0984e3" },

  // Biology - VERIFIED
  { id:"b1",  subject:"Biology", topic:"Cell Biology",  title:"Cell Structure — Nucleus Medical Media",      videoId:"8IlzKri08kk", duration:"7:22",  views:"32M",  channel:"Nucleus Medical",      avatar:"🔬", color:"#00b894" },
  { id:"b2",  subject:"Biology", topic:"Cell Biology",  title:"Introduction to Cells — Amoeba Sisters",      videoId:"Hmwvj9X4GNY", duration:"9:27",  views:"9M",   channel:"Amoeba Sisters",       avatar:"🦠", color:"#55efc4" },
  { id:"b4",  subject:"Biology", topic:"Cell Division", title:"Mitosis — Cell Division Fully Explained",     videoId:"f-ldPgEfAHI", duration:"8:27",  views:"13M",  channel:"Amoeba Sisters",       avatar:"🦠", color:"#55efc4" },
  // Biology - search links
  { id:"b3",    subject:"Biology", topic:"Genetics",         title:"Genetic Diagrams & Inheritance — Biology",   searchQuery:"genetics diagrams inheritance JAMB biology",      duration:"", views:"", channel:"Biology Tutor", avatar:"🧬", color:"#fdcb6e" },
  { id:"b_eco1",subject:"Biology", topic:"Ecology",          title:"Ecosystems & Food Webs",                     searchQuery:"ecosystems food webs ecology JAMB biology",       duration:"", views:"", channel:"Amoeba Sisters", avatar:"🦠", color:"#55efc4" },
  { id:"b_phys1",subject:"Biology",topic:"Human Physiology", title:"The Heart & Circulatory System",             searchQuery:"heart circulatory system biology tutorial",       duration:"", views:"", channel:"Nucleus Medical", avatar:"🔬", color:"#00b894" },

  // English - VERIFIED
  { id:"e1",  subject:"English", topic:"Grammar",    title:"Parts of Speech — Full English Grammar",      videoId:"8rFMQ4PGWf8", duration:"12:08", views:"4.1M", channel:"English Tutor",        avatar:"📝", color:"#a29bfe" },
  // English - search links
  { id:"e_comp1",subject:"English", topic:"Comprehension",title:"How to Answer Comprehension Questions", searchQuery:"how to answer comprehension questions JAMB English", duration:"", views:"", channel:"English Tutor", avatar:"📝", color:"#a29bfe" },
  { id:"e_oral1",subject:"English", topic:"Oral English", title:"English Phonetics — Vowels & Consonants",searchQuery:"English phonetics vowels consonants JAMB",          duration:"", views:"", channel:"English Tutor", avatar:"📝", color:"#a29bfe" },

  // Economics - VERIFIED
  { id:"ec1", subject:"Economics", topic:"Supply & Demand",   title:"Supply and Demand — Khan Academy",    videoId:"g9aDizJpd0s", duration:"10:34", views:"3.3M", channel:"Khan Academy",         avatar:"🎓", color:"#f39c12" },
  // Economics - search links
  { id:"ec_nat1",subject:"Economics",topic:"National Income", title:"GDP & National Income Explained",     searchQuery:"GDP national income economics JAMB tutorial",      duration:"", views:"", channel:"Khan Academy", avatar:"🎓", color:"#f39c12" },

  // Government - VERIFIED
  { id:"g1",  subject:"Government", topic:"Democracy",           title:"Types of Government Explained",      videoId:"8ZMaFsNOeIo", duration:"8:23",  views:"1.5M", channel:"CrashCourse",          avatar:"🏛️", color:"#e17055" },
  // Government - search links
  { id:"g_const1",subject:"Government",topic:"Nigerian Constitution",title:"Nigerian Constitution — Key Provisions", searchQuery:"Nigerian constitution 1999 JAMB government tutorial", duration:"", views:"", channel:"Naija Tutor", avatar:"🇳🇬", color:"#00b894" },
];

const SUBJECTS = ["All","Mathematics","Physics","Chemistry","Biology","English","Economics","Government"];
const TAB = { ELITRONIX:"elitronix", TOPICS:"topics", ALL:"all" };

const TOPICS_BY_SUBJECT = {
  Mathematics: ["Algebra","Statistics","Number & Numeration","Calculus","Geometry"],
  Physics:     ["Mechanics","Electricity","Waves & Sound","Heat & Temperature","Optics"],
  Chemistry:   ["Mole Concept","Atomic Structure","Organic Chemistry","Electrochemistry","Chemical Equilibrium"],
  Biology:     ["Cell Biology","Cell Division","Genetics","Ecology","Human Physiology"],
  English:     ["Grammar","Comprehension","Oral English"],
  Economics:   ["Supply & Demand","National Income"],
  Government:  ["Democracy","Nigerian Constitution"],
};

function openVideo(v) {
  if (v.videoId) {
    window.open(`https://www.youtube.com/watch?v=${v.videoId}`, "_blank");
  } else if (v.searchQuery) {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(v.searchQuery)}`, "_blank");
  }
}

export default function VideoLibrary() {
  const nav = useNavigate();
  const [tab,           setTab]           = useState(TAB.ELITRONIX);
  const [playing,       setPlaying]       = useState(false);
  const [activeSubject, setActiveSubject] = useState("All");
  const [activeTopic,   setActiveTopic]   = useState("All");
  const [search,        setSearch]        = useState("");
  const [notifOn,       setNotifOn]       = useState(!!localStorage.getItem("elitronix_notif"));
  const [notifMsg,      setNotifMsg]      = useState("");
  const playerRef = useRef(null);

  const enableNotif = async () => {
    try { await API.post("/auth/subscribe-notifications", { channel:"elitronix" }); } catch {}
    localStorage.setItem("elitronix_notif","1");
    setNotifOn(true);
    setNotifMsg("✅ You'll be notified when new ELITRONIX videos drop!");
    setTimeout(() => setNotifMsg(""), 4000);
  };

  const filtered = PARTNER_VIDEOS.filter(v => {
    const matchS = activeSubject === "All" || v.subject === activeSubject;
    const matchT = activeTopic  === "All" || v.topic   === activeTopic;
    const matchQ = !search || v.title.toLowerCase().includes(search.toLowerCase()) || v.topic.toLowerCase().includes(search.toLowerCase());
    return matchS && matchT && matchQ;
  });

  const topicsForSubject = activeSubject !== "All" ? (TOPICS_BY_SUBJECT[activeSubject] || []) : [];

  return (
    <div style={s.page}>

      {/* HEADER */}
      <div style={s.header}>
        <button style={s.back} onClick={() => nav("/dashboard")}>←</button>
        <div>
          <div style={s.headerTitle}>📺 Video Library</div>
          <div style={s.headerSub}>ELITRONIX · Study by Topic · 25+ Curated Videos</div>
        </div>
      </div>

      {/* TABS */}
      <div style={s.tabRow}>
        {[
          { key:TAB.ELITRONIX, label:"⚡ ELITRONIX" },
          { key:TAB.TOPICS,    label:"📚 By Topic" },
          { key:TAB.ALL,       label:"🎬 All Videos" },
        ].map(t => (
          <button key={t.key} style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
            onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div style={s.body}>

        {/* ══ TAB: ELITRONIX ══ */}
        {tab === TAB.ELITRONIX && (
          <>
            {/* Channel hero */}
            <div style={s.officialCard}>
              <div style={s.officialBadge}>⭐ OFFICIAL CHANNEL</div>
              <div style={s.officialTop}>
                <div style={s.officialAvatar}>⚡</div>
                <div>
                  <div style={s.officialName}>ELITRONIX</div>
                  <div style={s.officialHandle}>@elitronix1 · Nigeria 🇳🇬</div>
                  <div style={s.officialDesc}>Physics, Chemistry & Mathematics — made simple by Eli Tamuno-owunari</div>
                </div>
              </div>

              {/* Notification */}
              <div style={s.notifRow}>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:13, color:"#fff" }}>🔔 Get notified when new videos drop</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.7)", marginTop:2 }}>We'll alert you inside the app</div>
                </div>
                <button style={{ ...s.notifBtn, background: notifOn ? "#00b894" : "rgba(255,255,255,0.2)" }}
                  onClick={enableNotif} disabled={notifOn}>
                  {notifOn ? "✓ On" : "Enable"}
                </button>
              </div>
              {notifMsg && <div style={{ fontSize:12, color:"#00b894", fontWeight:700, marginBottom:8, textAlign:"center" }}>{notifMsg}</div>}

              <div style={{ display:"flex", gap:8 }}>
                <a href="https://www.youtube.com/@elitronix1?sub_confirmation=1" target="_blank" rel="noreferrer" style={{ textDecoration:"none", flex:1 }}>
                  <button style={s.subscribeBtn}>▶ Subscribe on YouTube</button>
                </a>
                <a href="https://www.youtube.com/@elitronix1/videos" target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
                  <button style={s.viewAllBtn}>All Videos ↗</button>
                </a>
              </div>
            </div>

            {/* JAMB VIDEO — plays in-app */}
            <div style={s.sectionLabel}>🎬 Featured JAMB Video</div>
            <div style={s.featuredCard}>
              {!playing ? (
                <>
                  <div style={s.featuredThumb}>
                    <img
                      src={`https://img.youtube.com/vi/${JAMB_VIDEO.videoId}/hqdefault.jpg`}
                      alt={JAMB_VIDEO.title}
                      style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"14px 14px 0 0" }}
                      onError={e => { e.target.style.display="none"; }}
                    />
                    <div style={s.featuredPlayBtn} onClick={() => {
                      setPlaying(true);
                      setTimeout(() => playerRef.current?.scrollIntoView({ behavior:"smooth", block:"center" }), 100);
                    }}>
                      <div style={s.playCircle}>▶</div>
                      <div style={{ fontWeight:800, fontSize:13, color:"#fff", marginTop:8 }}>Watch Now</div>
                    </div>
                  </div>
                  <div style={s.featuredInfo}>
                    <div style={s.featuredTag}>⚡ ELITRONIX · JAMB Strategy</div>
                    <div style={s.featuredTitle}>{JAMB_VIDEO.title}</div>
                    <button style={s.watchBtn} onClick={() => {
                      setPlaying(true);
                      setTimeout(() => playerRef.current?.scrollIntoView({ behavior:"smooth", block:"center" }), 100);
                    }}>▶ Watch Inside App</button>
                  </div>
                </>
              ) : (
                <div ref={playerRef}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"10px 14px" }}>
                    <div style={{ fontWeight:800, fontSize:13, color:"#2d3436" }}>{JAMB_VIDEO.title}</div>
                    <button style={s.closeBtn} onClick={() => setPlaying(false)}>✕</button>
                  </div>
                  <div style={{ width:"100%", height:220, background:"#000" }}>
                    <iframe width="100%" height="100%"
                      src={`https://www.youtube.com/embed/${JAMB_VIDEO.videoId}?autoplay=1`}
                      title={JAMB_VIDEO.title} frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen />
                  </div>
                  <div style={{ padding:"10px 14px" }}>
                    <button style={s.practiceBtn}
                      onClick={() => nav("/exam-select?type=JAMB")}>
                      📝 Practice JAMB Questions →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Coming soon ELITRONIX videos */}
            <div style={s.sectionLabel}>🔜 Coming Soon from ELITRONIX</div>
            <div style={s.comingSoonGrid}>
              {ELITRONIX_COMING.map(v => (
                <div key={v.id} style={s.comingSoonCard}>
                  <div style={s.comingSoonThumb}>
                    <span style={{ fontSize:28 }}>⚡</span>
                    <span style={s.soonBadge}>SOON</span>
                  </div>
                  <div style={s.comingSoonSubject}>{v.subject}</div>
                  <div style={s.comingSoonTitle}>{v.title}</div>
                  <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", padding:"0 10px 10px" }}>
                    🔔 Enable notifications to be first to know
                  </div>
                </div>
              ))}
            </div>

            {!notifOn && (
              <div style={s.notifCTA}>
                <div style={{ fontSize:28, marginBottom:6 }}>🔔</div>
                <div style={{ fontWeight:800, fontSize:15, color:"#2d3436", marginBottom:4 }}>Don't miss new ELITRONIX videos</div>
                <div style={{ fontSize:13, color:"#636e72", marginBottom:14 }}>Get alerted inside the app the moment a new video drops</div>
                <button style={s.enableNotifBtn} onClick={enableNotif}>Enable Notifications</button>
              </div>
            )}
          </>
        )}

        {/* ══ TAB: BY TOPIC ══ */}
        {tab === TAB.TOPICS && (
          <>
            <div style={s.sectionLabel}>Choose Subject</div>
            <div style={s.subjectGrid}>
              {["Mathematics","Physics","Chemistry","Biology","English","Economics","Government"].map(sub => {
                const icons = { Mathematics:"➗", Physics:"⚡", Chemistry:"⚗️", Biology:"🔬", English:"📝", Economics:"💹", Government:"🏛️" };
                return (
                  <button key={sub}
                    style={{ ...s.subjectBtn, ...(activeSubject === sub ? s.subjectBtnActive : {}) }}
                    onClick={() => { setActiveSubject(sub); setActiveTopic("All"); }}>
                    <span style={{ fontSize:18 }}>{icons[sub]}</span>
                    <span style={{ fontSize:11, fontWeight:700, marginTop:3 }}>{sub}</span>
                  </button>
                );
              })}
            </div>

            {activeSubject !== "All" && (
              <>
                <div style={s.sectionLabel}>{activeSubject} Topics</div>
                {(TOPICS_BY_SUBJECT[activeSubject] || []).map(topic => {
                  const topicVids = PARTNER_VIDEOS.filter(v => v.subject === activeSubject && v.topic === topic);
                  return (
                    <div key={topic} style={s.topicCard}>
                      <div style={s.topicHeader}>
                        <div style={{ flex:1 }}>
                          <div style={s.topicName}>{topic}</div>
                          <div style={s.topicCount}>{topicVids.length} video{topicVids.length !== 1 ? "s" : ""}</div>
                        </div>
                        <button style={s.practiceSmallBtn}
                          onClick={() => nav(`/exam-select?type=JAMB&subject=${encodeURIComponent(activeSubject)}`)}>
                          Practice →
                        </button>
                      </div>
                      {topicVids.length > 0 && (
                        <div style={{ borderTop:"1px solid #f0f0f0", paddingTop:10, display:"flex", flexDirection:"column", gap:8 }}>
                          {topicVids.map(v => (
                            <div key={v.id} style={s.miniCard} onClick={() => openVideo(v)}>
                              <div style={{ ...s.miniThumb, background: v.color + "22" }}>
                                <span style={{ fontSize:16 }}>{v.avatar}</span>
                                <div style={s.miniPlay}>{v.videoId ? "▶" : "🔍"}</div>
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={s.miniTitle}>{v.title}</div>
                                <div style={{ fontSize:11, color:"#b2bec3" }}>
                                  {v.channel}{v.duration ? ` · ${v.duration}` : ""}
                                  {!v.videoId && <span style={{ color:"#a29bfe" }}> · opens YouTube search</span>}
                                </div>
                              </div>
                              <span style={{ fontSize:16, color:"#b2bec3" }}>↗</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            )}

            {activeSubject === "All" && (
              <div style={{ textAlign:"center", padding:"32px 20px", color:"#b2bec3" }}>
                <div style={{ fontSize:36, marginBottom:8 }}>👆</div>
                <div>Select a subject above to browse topics</div>
              </div>
            )}
          </>
        )}

        {/* ══ TAB: ALL VIDEOS ══ */}
        {tab === TAB.ALL && (
          <>
            <div style={s.searchBox}>
              <span>🔍</span>
              <input style={s.searchInput} placeholder="Search topic, subject or title..."
                value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button style={s.clearBtn} onClick={() => setSearch("")}>✕</button>}
            </div>

            <div style={s.chipRow}>
              {SUBJECTS.map(sub => (
                <div key={sub} style={{ ...s.chip, ...(activeSubject === sub ? s.chipActive : {}) }}
                  onClick={() => { setActiveSubject(sub); setActiveTopic("All"); }}>{sub}</div>
              ))}
            </div>

            {topicsForSubject.length > 0 && (
              <div style={{ ...s.chipRow, marginTop:6 }}>
                <div style={{ ...s.chip, ...(activeTopic === "All" ? s.chipActive : {}) }}
                  onClick={() => setActiveTopic("All")}>All Topics</div>
                {topicsForSubject.map(t => (
                  <div key={t} style={{ ...s.chip, ...(activeTopic === t ? s.chipActive : {}) }}
                    onClick={() => setActiveTopic(t)}>{t}</div>
                ))}
              </div>
            )}

            <div style={s.sectionLabel}>{filtered.length} Videos — tap to watch on YouTube</div>

            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.map(v => (
                <div key={v.id} style={s.videoCard} onClick={() => openVideo(v)}>
                  <div style={{ ...s.thumbnail, background: v.color + "22" }}>
                    {v.videoId
                      ? <img src={`https://img.youtube.com/vi/${v.videoId}/default.jpg`} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:10 }} onError={e => { e.target.style.display="none"; }} />
                      : <span style={{ fontSize:22 }}>{v.avatar}</span>
                    }
                    <div style={s.thumbPlay}>{v.videoId ? "▶" : "🔍"}</div>
                    {v.duration && <div style={s.thumbDur}>{v.duration}</div>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={s.videoTitle}>{v.title}</div>
                    <div style={{ display:"flex", gap:4, flexWrap:"wrap", margin:"4px 0" }}>
                      <span style={{ ...s.tag, background:"#f0edff", color:"#6c63ff" }}>{v.subject}</span>
                      <span style={{ ...s.tag, background:"#f8f9fa", color:"#636e72" }}>{v.topic}</span>
                    </div>
                    <div style={{ fontSize:11 }}>
                      <span style={{ color: v.color, fontWeight:700 }}>{v.avatar} {v.channel}</span>
                      {v.views && <span style={{ color:"#b2bec3" }}> · {v.views} views</span>}
                      {!v.videoId && <span style={{ color:"#a29bfe", fontWeight:600 }}> · YouTube Search</span>}
                    </div>
                  </div>
                  <span style={{ fontSize:18, color:"#b2bec3", flexShrink:0 }}>↗</span>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ height:80 }} />
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
  tabRow:        { display:"flex", background:"#fff", borderBottom:"2px solid #f0f0f0" },
  tab:           { flex:1, padding:"11px 4px", fontSize:11, fontWeight:700, background:"none", border:"none", cursor:"pointer", color:"#b2bec3", borderBottom:"3px solid transparent" },
  tabActive:     { color:"#6c63ff", borderBottomColor:"#6c63ff" },
  body:          { flex:1, padding:"12px 16px 20px" },
  sectionLabel:  { fontSize:11, fontWeight:800, color:"#b2bec3", letterSpacing:1, textTransform:"uppercase", margin:"16px 0 8px" },

  officialCard:  { background:"linear-gradient(135deg,#6c63ff,#1a1a2e)", borderRadius:20, padding:"18px 16px", marginBottom:4 },
  officialBadge: { background:"rgba(255,215,0,0.2)", color:"#ffd700", fontSize:10, fontWeight:800, padding:"3px 10px", borderRadius:20, display:"inline-block", marginBottom:12, border:"1px solid rgba(255,215,0,0.4)" },
  officialTop:   { display:"flex", gap:12, alignItems:"flex-start", marginBottom:14 },
  officialAvatar:{ width:50, height:50, background:"rgba(255,255,255,0.15)", borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", fontSize:26, flexShrink:0, border:"2px solid rgba(255,255,255,0.3)" },
  officialName:  { fontWeight:900, fontSize:18, color:"#fff" },
  officialHandle:{ fontSize:12, color:"rgba(255,255,255,0.7)", marginTop:2 },
  officialDesc:  { fontSize:12, color:"rgba(255,255,255,0.85)", marginTop:4, lineHeight:1.4 },
  notifRow:      { background:"rgba(255,255,255,0.1)", borderRadius:12, padding:"10px 12px", display:"flex", alignItems:"center", gap:10, marginBottom:10 },
  notifBtn:      { border:"none", color:"#fff", borderRadius:8, padding:"7px 14px", fontWeight:800, fontSize:13, cursor:"pointer", flexShrink:0 },
  subscribeBtn:  { width:"100%", padding:"11px 0", background:"#FF0000", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:13, cursor:"pointer" },
  viewAllBtn:    { padding:"11px 14px", background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.3)", borderRadius:10, fontWeight:700, fontSize:12, cursor:"pointer", whiteSpace:"nowrap" },

  featuredCard:  { background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 12px rgba(108,99,255,0.15)", border:"2px solid #6c63ff22" },
  featuredThumb: { height:190, position:"relative", overflow:"hidden", background:"#1a1a2e", borderRadius:"14px 14px 0 0" },
  featuredPlayBtn:{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"rgba(0,0,0,0.45)", cursor:"pointer" },
  playCircle:    { width:56, height:56, background:"linear-gradient(135deg,#6c63ff,#a29bfe)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, color:"#fff", boxShadow:"0 4px 16px rgba(108,99,255,0.5)" },
  featuredInfo:  { padding:"14px 16px" },
  featuredTag:   { fontSize:11, fontWeight:700, color:"#6c63ff", marginBottom:4 },
  featuredTitle: { fontWeight:800, fontSize:14, color:"#2d3436", lineHeight:1.4, marginBottom:12 },
  watchBtn:      { width:"100%", padding:12, background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer" },
  closeBtn:      { background:"#f0f0f0", border:"none", borderRadius:8, width:30, height:30, cursor:"pointer", fontSize:14 },
  practiceBtn:   { width:"100%", padding:12, background:"linear-gradient(135deg,#00b894,#55efc4)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer" },

  comingSoonGrid:{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:8 },
  comingSoonCard:{ background:"linear-gradient(135deg,#2d3436,#636e72)", borderRadius:14, overflow:"hidden", opacity:0.8 },
  comingSoonThumb:{ height:76, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", background:"rgba(108,99,255,0.15)" },
  soonBadge:     { position:"absolute", top:6, left:6, background:"#636e72", color:"#fff", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:10 },
  comingSoonSubject:{ fontSize:10, fontWeight:700, color:"#a29bfe", padding:"6px 10px 0", textTransform:"uppercase" },
  comingSoonTitle:{ fontSize:11, fontWeight:700, color:"#fff", padding:"3px 10px 8px", lineHeight:1.3 },

  notifCTA:      { background:"#fff", borderRadius:16, padding:"20px 16px", textAlign:"center", marginTop:16, border:"2px dashed #a29bfe" },
  enableNotifBtn:{ padding:"11px 24px", background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer" },

  subjectGrid:   { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, marginBottom:4 },
  subjectBtn:    { display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 4px", background:"#fff", border:"2px solid #f0f0f0", borderRadius:12, cursor:"pointer" },
  subjectBtnActive:{ background:"#6c63ff", borderColor:"#6c63ff", color:"#fff" },
  topicCard:     { background:"#fff", borderRadius:14, padding:"14px 14px 10px", boxShadow:"0 1px 6px rgba(0,0,0,0.05)", marginBottom:10 },
  topicHeader:   { display:"flex", alignItems:"center", gap:10, marginBottom:10 },
  topicName:     { fontWeight:800, fontSize:14, color:"#2d3436" },
  topicCount:    { fontSize:12, color:"#b2bec3", marginTop:1 },
  practiceSmallBtn:{ padding:"6px 12px", background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:8, fontWeight:700, fontSize:12, cursor:"pointer", flexShrink:0 },
  miniCard:      { display:"flex", gap:10, alignItems:"center", cursor:"pointer", padding:"4px 0" },
  miniThumb:     { width:52, height:40, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", flexShrink:0 },
  miniPlay:      { position:"absolute", bottom:3, right:3, background:"rgba(0,0,0,0.6)", color:"#fff", fontSize:8, padding:"2px 5px", borderRadius:5, fontWeight:700 },
  miniTitle:     { fontSize:12, fontWeight:600, color:"#2d3436", lineHeight:1.3 },

  searchBox:     { display:"flex", alignItems:"center", gap:8, background:"#fff", borderRadius:12, padding:"10px 14px", boxShadow:"0 1px 6px rgba(0,0,0,0.05)", marginBottom:10 },
  searchInput:   { flex:1, border:"none", outline:"none", fontSize:14, background:"transparent" },
  clearBtn:      { background:"none", border:"none", color:"#b2bec3", cursor:"pointer", fontSize:14 },
  chipRow:       { display:"flex", gap:6, overflowX:"auto", paddingBottom:4, scrollbarWidth:"none" },
  chip:          { padding:"6px 14px", background:"#fff", border:"2px solid #f0f0f0", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", whiteSpace:"nowrap", flexShrink:0, color:"#636e72" },
  chipActive:    { background:"#6c63ff", color:"#fff", borderColor:"#6c63ff" },
  videoCard:     { background:"#fff", borderRadius:14, padding:12, display:"flex", gap:12, cursor:"pointer", boxShadow:"0 1px 6px rgba(0,0,0,0.05)", alignItems:"center" },
  thumbnail:     { width:88, height:66, borderRadius:10, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", position:"relative", overflow:"hidden" },
  thumbPlay:     { position:"absolute", bottom:4, right:4, background:"rgba(0,0,0,0.65)", color:"#fff", borderRadius:6, fontSize:9, padding:"2px 6px", fontWeight:700 },
  thumbDur:      { position:"absolute", bottom:4, left:4, background:"rgba(0,0,0,0.65)", color:"#fff", borderRadius:6, fontSize:9, padding:"2px 5px" },
  videoTitle:    { fontWeight:700, fontSize:13, color:"#2d3436", lineHeight:1.3 },
  tag:           { fontSize:10, fontWeight:600, borderRadius:6, padding:"2px 7px" },
};
