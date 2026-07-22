import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import API from "../utils/api";

const TYPE_COLORS = { Federal:"#6c63ff", State:"#00b894", Private:"#fdcb6e" };

export default function SchoolFinder() {
  const nav = useNavigate();
  const back           = useBackNav();
  const [tab, setTab]           = useState("search"); // search | eligibility | courses
  const [schools, setSchools]   = useState([]);
  const [courses, setCourses]   = useState([]);
  const [states, setStates]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Location
  const [coords, setCoords]     = useState(null); // {lat, lng}
  const [locStatus, setLocStatus] = useState("idle"); // idle | loading | done | error

  // Search filters
  const [query, setQuery]       = useState("");
  const [state, setState]       = useState("");
  const [type, setType]         = useState("");
  const [score, setScore]       = useState("");

  // Eligibility checker
  const [eScore, setEScore]     = useState("");
  const [eCourse, setECourse]   = useState("");
  const [eligResult, setEligResult] = useState(null);
  const [eligLoading, setEligLoading] = useState(false);

  // School detail modal
  const [selected, setSelected] = useState(null);

  const search = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (state) params.set("state", state);
      if (type)  params.set("type", type);
      if (score) params.set("min_score", score);
      if (coords) { params.set("lat", coords.lat); params.set("lng", coords.lng); }
      const r = await API.get(`/school-finder/schools?${params}`);
      setSchools(r.data.schools || []);
    } catch {}
    setLoading(false);
  }, [query, state, type, score, coords]);

  useEffect(() => {
    Promise.all([
      API.get("/school-finder/schools").then(r => setSchools(r.data.schools || [])),
      API.get("/school-finder/courses").then(r => setCourses(r.data.courses || [])),
      API.get("/school-finder/states").then(r => setStates(r.data.states || [])),
    ]).catch(() => {});
  }, []);

  // Re-search when location becomes available (to sort by distance)
  useEffect(() => {
    if (coords) search();
  }, [coords, search]);

  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocStatus("error"); return; }
    setLocStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocStatus("done");
      },
      () => setLocStatus("error"),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  };

  const checkEligibility = async () => {
    if (!eScore || !eCourse) return;
    setEligLoading(true);
    try {
      const body = { score: parseInt(eScore), course_id: eCourse };
      if (coords) { body.lat = coords.lat; body.lng = coords.lng; }
      const r = await API.post("/school-finder/eligibility", body);
      setEligResult(r.data);
    } catch {}
    setEligLoading(false);
  };

  const openSchool = async (id) => {
    try {
      const params = new URLSearchParams();
      if (coords) { params.set("lat", coords.lat); params.set("lng", coords.lng); }
      const r = await API.get(`/school-finder/schools/${id}?${params}`);
      setSelected(r.data);
    } catch {}
  };

  const activeFilterCount = [state, type, score].filter(Boolean).length;

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <button onClick={() => back()} style={s.backBtn}>← Back</button>
        <h1 style={{ margin:0, fontSize:17, fontWeight:800, color:"#f0f4ff" }}>🏫 School Finder</h1>
        <span style={{ width:50 }} />
      </div>

      {/* Tabs */}
      <div style={s.tabs}>
        {[["search","🔍 Find"],["eligibility","✅ Eligibility"],["courses","📚 Courses"]].map(([key,label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ ...s.tab, background: tab===key ? "#6c63ff" : "transparent",
              color: tab===key ? "#fff" : "#a29bfe",
              borderBottom: tab===key ? "2px solid #6c63ff" : "2px solid transparent" }}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth:680, margin:"0 auto", padding:"12px 12px 90px" }}>

        {/* ── SEARCH TAB ── */}
        {tab === "search" && (
          <>
            {/* Search bar + location */}
            <div style={s.searchRow}>
              <input value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key==="Enter" && search()}
                placeholder="Search school or state..." style={{ ...s.input, flex:1 }} />
              <button onClick={() => setShowFilters(f => !f)} style={s.iconBtn}>
                ⚙ {activeFilterCount > 0 && <span style={s.badge}>{activeFilterCount}</span>}
              </button>
            </div>

            {/* Location button */}
            <button onClick={useMyLocation} style={s.locBtn} disabled={locStatus==="loading"}>
              {locStatus === "loading" ? "📍 Locating..." :
               locStatus === "done"    ? "📍 Sorted by distance from you" :
               locStatus === "error"   ? "📍 Location unavailable — tap to retry" :
                                          "📍 Use my location to find nearby schools"}
            </button>

            {/* Collapsible filters */}
            {showFilters && (
              <div style={s.filterPanel}>
                <select value={state} onChange={e => setState(e.target.value)} style={s.select}>
                  <option value="">All States</option>
                  {states.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
                <select value={type} onChange={e => setType(e.target.value)} style={s.select}>
                  <option value="">All Types</option>
                  <option value="Federal">Federal</option>
                  <option value="State">State</option>
                  <option value="Private">Private</option>
                </select>
                <input value={score} onChange={e => setScore(e.target.value)}
                  placeholder="Your JAMB score" type="number" style={s.input} />
                <button onClick={() => { search(); setShowFilters(false); }} style={s.btnPrimary} disabled={loading}>
                  {loading ? "Searching..." : "Apply Filters"}
                </button>
              </div>
            )}

            <p style={{ color:"#636e72", fontSize:12, margin:"10px 0" }}>
              {schools.length} schools found {score ? `(eligible for ${score} score)` : ""}
            </p>

            {/* Results */}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {[...schools].sort((a,b) => (b.is_sponsored ? 1 : 0) - (a.is_sponsored ? 1 : 0)).map(school => (
                <div key={school.id} style={{
                    ...s.schoolCard,
                    // FIX: Sponsored spotlight — highlighted card with subtle gold border
                    border: school.is_sponsored
                      ? "1px solid rgba(255,200,87,0.4)"
                      : "1px solid rgba(255,255,255,0.07)",
                    background: school.is_sponsored
                      ? "linear-gradient(135deg,rgba(255,200,87,0.06) 0%,var(--surface,#1a1a2e) 60%)"
                      : "var(--surface,#1a1a2e)",
                  }} onClick={() => openSchool(school.id)}>
                  {school.is_sponsored && (
                    <div style={{ fontSize:10, color:"#FFC857", fontWeight:800, letterSpacing:".06em", marginBottom:6 }}>
                      ⭐ FEATURED INSTITUTION
                    </div>
                  )}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
                    <div style={{ minWidth:0, flex:1 }}>
                      <h3 style={s.schoolName}>{school.name}</h3>
                      <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:4 }}>
                        <span style={{ fontSize:11, color:"#636e72" }}>📍 {school.state}</span>
                        {school.distance_km != null && (
                          <span style={{ fontSize:11, color:"#74b9ff", fontWeight:700 }}>• {school.distance_km} km away</span>
                        )}
                      </div>
                    </div>
                    <div style={{ ...s.typeBadge, background:`${TYPE_COLORS[school.type]}22`, color:TYPE_COLORS[school.type], flexShrink:0 }}>
                      {school.type}
                    </div>
                  </div>
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:8 }}>
                    <span style={s.tag}>Cutoff: {school.cutoff}</span>
                    {score && parseInt(score) >= school.cutoff && <span style={{ ...s.tag, background:"rgba(0,184,148,0.15)", color:"#00b894" }}>✅ Qualifies</span>}
                    {score && parseInt(score) < school.cutoff && <span style={{ ...s.tag, background:"rgba(225,112,85,0.15)", color:"#e17055" }}>⚠ {school.cutoff - parseInt(score)} pts short</span>}
                  </div>
                </div>
              ))}
              {!loading && schools.length === 0 && (
                <p style={{ color:"#636e72", fontSize:13, textAlign:"center", padding:"24px 0" }}>No schools match your search.</p>
              )}
            </div>
          </>
        )}

        {/* ── ELIGIBILITY TAB ── */}
        {tab === "eligibility" && (
          <div>
            <div style={s.card}>
              <h3 style={{ color:"#f0f4ff", fontWeight:700, marginBottom:14, fontSize:15 }}>Check Your Eligibility</h3>
              <label style={s.label}>Your JAMB Score</label>
              <input value={eScore} onChange={e => setEScore(e.target.value)} type="number"
                placeholder="e.g. 280" style={{ ...s.input, marginBottom:12 }} />
              <label style={s.label}>Target Course</label>
              <select value={eCourse} onChange={e => setECourse(e.target.value)}
                style={{ ...s.select, marginBottom:12 }}>
                <option value="">Select a course</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={useMyLocation} style={{ ...s.locBtn, marginBottom:12 }} disabled={locStatus==="loading"}>
                {locStatus === "done" ? "📍 Using your location" : "📍 Use my location (sort by distance)"}
              </button>
              <button onClick={checkEligibility} disabled={eligLoading || !eScore || !eCourse}
                style={s.btnPrimary}>
                {eligLoading ? "Checking..." : "Check Eligibility →"}
              </button>
            </div>

            {eligResult && (
              <>
                {/* Course requirements */}
                <div style={s.card}>
                  <h4 style={{ color:"#a29bfe", fontWeight:700, marginBottom:10, fontSize:14 }}>📚 {eligResult.course?.name} Requirements</h4>
                  <p style={{ color:"#b2bec3", fontSize:13, marginBottom:8 }}>
                    <strong style={{ color:"#f0f4ff" }}>JAMB subjects:</strong> {eligResult.course?.subjects?.join(", ")}
                  </p>
                  <p style={{ color:"#b2bec3", fontSize:13, marginBottom:8 }}>
                    <strong style={{ color:"#f0f4ff" }}>O'level (WAEC/NECO):</strong> {eligResult.course?.olevel?.join(", ")}
                  </p>
                  <p style={{ color:"#636e72", fontSize:11 }}>
                    Minimum: 5 O'level credits including English Language &amp; Mathematics, sat in not more than two sittings.
                  </p>
                  <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
                    <span style={s.tag}>Min score: {eligResult.course?.min_score}</span>
                    {eligResult.course?.competitive && <span style={{ ...s.tag, background:"rgba(225,112,85,0.15)", color:"#e17055" }}>🔥 Highly competitive</span>}
                  </div>
                </div>

                {/* Eligible schools */}
                <div style={s.card}>
                  <h4 style={{ color:"#00b894", fontWeight:700, marginBottom:10, fontSize:14 }}>
                    ✅ {eligResult.eligible?.length} Schools You Can Apply To
                  </h4>
                  {eligResult.eligible?.length ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {eligResult.eligible.slice(0,8).map(sc => (
                        <div key={sc.id} onClick={() => openSchool(sc.id)} style={{ cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center",
                          padding:"10px 12px", background:"rgba(0,184,148,0.08)", borderRadius:8,
                          border:"1px solid rgba(0,184,148,0.15)" }}>
                          <div style={{ minWidth:0 }}>
                            <div style={{ color:"#f0f4ff", fontWeight:600, fontSize:13 }}>{sc.name}</div>
                            <div style={{ color:"#636e72", fontSize:11 }}>
                              {sc.state}{sc.distance_km != null ? ` · ${sc.distance_km} km away` : ""}
                            </div>
                          </div>
                          <span style={{ ...s.typeBadge, background:`${TYPE_COLORS[sc.type]}22`, color:TYPE_COLORS[sc.type] }}>{sc.type}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ color:"#e17055", fontSize:13 }}>No schools match this score for the selected course.</p>}
                </div>

                {/* Marginal schools */}
                {eligResult.marginal?.length > 0 && (
                  <div style={s.card}>
                    <h4 style={{ color:"#fdcb6e", fontWeight:700, marginBottom:10, fontSize:14 }}>
                      ⚡ {eligResult.marginal?.length} Schools Within Reach (+30 pts)
                    </h4>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {eligResult.marginal.slice(0,5).map(sc => (
                        <div key={sc.id} onClick={() => openSchool(sc.id)} style={{ cursor:"pointer", display:"flex", justifyContent:"space-between", alignItems:"center",
                          padding:"10px 12px", background:"rgba(253,203,110,0.08)", borderRadius:8,
                          border:"1px solid rgba(253,203,110,0.15)" }}>
                          <div style={{ minWidth:0 }}>
                            <div style={{ color:"#f0f4ff", fontWeight:600, fontSize:13 }}>{sc.name}</div>
                            <div style={{ color:"#636e72", fontSize:11 }}>
                              needs {sc.cutoff}{sc.distance_km != null ? ` · ${sc.distance_km} km away` : ""}
                            </div>
                          </div>
                          <span style={{ color:"#fdcb6e", fontSize:12, fontWeight:700 }}>+{sc.cutoff - parseInt(eScore)} pts</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ color:"#636e72", fontSize:12, marginTop:10 }}>
                      💡 Practice more on Scholars Syndicate to close the gap!
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── COURSES TAB ── */}
        {tab === "courses" && (
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {/* Career finder CTA */}
            <div style={{ background:"color-mix(in srgb, var(--primary) 10%, var(--surface))", border:"1px solid color-mix(in srgb, var(--primary) 25%, transparent)", borderRadius:14, padding:"14px 16px", marginBottom:4, display:"flex", alignItems:"center", gap:12 }}>
              <span style={{ fontSize:28 }}>🧭</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>Not sure what to study?</div>
                <div style={{ fontSize:12, color:"var(--text-muted)", marginTop:2 }}>Take the Career Quiz to find courses that match your personality</div>
              </div>
              <button onClick={() => window.location.href="/career-quiz"}
                style={{ background:"var(--primary)", color:"#fff", border:"none", borderRadius:10, padding:"9px 14px", fontSize:13, fontWeight:700, cursor:"pointer", flexShrink:0 }}>
                Start →
              </button>
            </div>

            {courses.map(course => (
              <div key={course.id} style={s.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8, gap:8 }}>
                  <h3 style={{ margin:0, fontSize:14, fontWeight:700, color:"#f0f4ff" }}>{course.name}</h3>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4, flexShrink:0 }}>
                    <span style={{ color:"#a29bfe", fontWeight:800, fontSize:15 }}>{course.min_score}</span>
                    <span style={{ color:"#636e72", fontSize:10 }}>min JAMB score</span>
                  </div>
                </div>
                {course.competitive && <span style={{ ...s.tag, background:"rgba(225,112,85,0.15)", color:"#e17055", marginBottom:8, display:"inline-block" }}>🔥 Competitive</span>}
                <p style={{ color:"#74b9ff", fontSize:12, margin:"4px 0 6px" }}>
                  <strong>JAMB subjects:</strong> {course.subjects?.join(", ")}
                </p>
                <p style={{ color:"#b2bec3", fontSize:12, margin:0 }}>
                  <strong>O'level (WAEC/NECO):</strong> {course.olevel?.join(", ")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* School detail modal */}
      {selected && (
        <div style={s.modalOverlay} onClick={() => setSelected(null)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, gap:8 }}>
              <div style={{ minWidth:0 }}>
                <h2 style={{ margin:"0 0 4px", color:"#f0f4ff", fontSize:17, fontWeight:800 }}>{selected.school?.name}</h2>
                <p style={{ margin:0, color:"#636e72", fontSize:12 }}>
                  📍 {selected.school?.state} · {selected.school?.type}
                  {selected.school?.distance_km != null && ` · ${selected.school.distance_km} km from you`}
                </p>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:"none", border:"none", color:"#636e72", cursor:"pointer", fontSize:22, padding:4, flexShrink:0 }}>×</button>
            </div>

            <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
              <div style={{ background:"rgba(108,99,255,0.15)", borderRadius:10, padding:"12px 16px", flex:"1 1 100px", textAlign:"center" }}>
                <div style={{ color:"#a29bfe", fontWeight:800, fontSize:22 }}>{selected.school?.cutoff}</div>
                <div style={{ color:"#636e72", fontSize:11 }}>JAMB Cutoff</div>
              </div>
              {selected.school?.distance_km != null && (
                <div style={{ background:"rgba(116,185,255,0.15)", borderRadius:10, padding:"12px 16px", flex:"1 1 100px", textAlign:"center" }}>
                  <div style={{ color:"#74b9ff", fontWeight:800, fontSize:22 }}>{selected.school.distance_km} km</div>
                  <div style={{ color:"#636e72", fontSize:11 }}>From your location</div>
                </div>
              )}
              {selected.school?.website && (
                <a href={selected.school.website} target="_blank" rel="noreferrer"
                  style={{ background:"rgba(0,184,148,0.15)", borderRadius:10, padding:"12px 16px", flex:"1 1 100px", textAlign:"center",
                  color:"#00b894", textDecoration:"none", fontWeight:700, fontSize:13, display:"flex", alignItems:"center", justifyContent:"center" }}>
                  🌐 Website
                </a>
              )}
            </div>

            {/* Campus Finder — precise on-campus buildings, live from Google Places */}
            {selected.school?.lat && selected.school?.lng && (
              <button
                onClick={() => nav(`/school-finder/campus/${selected.school.id}`, { state: { school: selected.school } })}
                style={{
                  width:"100%", marginBottom:16, padding:"12px 14px",
                  background:"linear-gradient(135deg,#1a1040,#0d1a30)", border:"1px solid #6c63ff44",
                  borderRadius:12, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:8,
                }}>
                🗺️ Explore Campus — find buildings & get directions
              </button>
            )}

            {/* O'level requirements (general) */}
            <div style={{ marginBottom:14, padding:"10px 12px", background:"rgba(255,255,255,0.04)", borderRadius:8 }}>
              <h4 style={{ color:"#a29bfe", fontWeight:700, marginBottom:6, fontSize:13 }}>📋 General O'level Requirement</h4>
              <p style={{ color:"#b2bec3", fontSize:12, margin:0 }}>
                5 WAEC/NECO credits including {(selected.general_olevel || ["English Language","Mathematics"]).join(" & ")}, sat in not more than two sittings — plus subjects relevant to your chosen course.
              </p>
            </div>

            {/* Pros & Cons */}
            <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
              <div style={{ flex:"1 1 140px", padding:"10px 12px", background:"rgba(0,184,148,0.08)", borderRadius:8, border:"1px solid rgba(0,184,148,0.15)" }}>
                <h4 style={{ color:"#00b894", fontWeight:700, marginBottom:6, fontSize:13 }}>👍 Pros</h4>
                <ul style={{ margin:0, paddingLeft:18, color:"#b2bec3", fontSize:12, lineHeight:1.6 }}>
                  {(selected.school?.pros || []).map((p,i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
              <div style={{ flex:"1 1 140px", padding:"10px 12px", background:"rgba(225,112,85,0.08)", borderRadius:8, border:"1px solid rgba(225,112,85,0.15)" }}>
                <h4 style={{ color:"#e17055", fontWeight:700, marginBottom:6, fontSize:13 }}>👎 Cons</h4>
                <ul style={{ margin:0, paddingLeft:18, color:"#b2bec3", fontSize:12, lineHeight:1.6 }}>
                  {(selected.school?.cons || []).map((c,i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            </div>

            <h4 style={{ color:"#a29bfe", fontWeight:700, marginBottom:8, fontSize:13 }}>Available Courses</h4>
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              {(selected.courses || []).slice(0,8).map(c => (
                <div key={c.id} style={{ display:"flex", justifyContent:"space-between",
                  padding:"8px 12px", background:"rgba(255,255,255,0.04)", borderRadius:8 }}>
                  <span style={{ color:"#f0f4ff", fontSize:13 }}>{c.name}</span>
                  <span style={{ color:"#a29bfe", fontSize:12, fontWeight:700 }}>{c.min_score}+</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  page:       { minHeight:"100vh", background:"var(--bg, #0f0f1e)", fontFamily:"'Plus Jakarta Sans', sans-serif", color:"#f0f4ff" },
  header:     { background:"var(--surface, #1a1a2e)", padding:"12px 14px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid rgba(255,255,255,0.07)", position:"sticky", top:0, zIndex:100 },
  backBtn:    { background:"none", border:"none", color:"#a29bfe", cursor:"pointer", fontSize:14, fontWeight:600 },
  tabs:       { display:"flex", gap:0, borderBottom:"1px solid rgba(255,255,255,0.08)", background:"var(--surface,#1a1a2e)", position:"sticky", top:48, zIndex:99, overflowX:"auto" },
  tab:        { background:"transparent", border:"none", cursor:"pointer", padding:"10px 14px", fontSize:13, fontWeight:600, transition:"all 0.2s", borderRadius:"4px 4px 0 0", whiteSpace:"nowrap", flex:1 },
  searchRow:  { display:"flex", gap:8, marginBottom:10 },
  locBtn:     { width:"100%", background:"rgba(108,99,255,0.1)", border:"1px solid rgba(108,99,255,0.25)", color:"#a29bfe", borderRadius:10, padding:"10px 14px", fontSize:12.5, fontWeight:600, cursor:"pointer", marginBottom:10, textAlign:"center" },
  filterPanel:{ display:"flex", flexDirection:"column", gap:8, padding:"12px", background:"var(--surface,#1a1a2e)", borderRadius:10, border:"1px solid rgba(255,255,255,0.07)", marginBottom:10 },
  input:      { background:"var(--surface,#1a1a2e)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#f0f4ff", padding:"10px 12px", fontSize:13, outline:"none", width:"100%", boxSizing:"border-box" },
  select:     { background:"var(--surface,#1a1a2e)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#f0f4ff", padding:"10px 12px", fontSize:13, outline:"none", cursor:"pointer", width:"100%", boxSizing:"border-box" },
  btnPrimary: { background:"#6c63ff", color:"#fff", border:"none", borderRadius:8, padding:"10px 18px", fontWeight:700, cursor:"pointer", fontSize:13, width:"100%" },
  iconBtn:    { position:"relative", background:"var(--surface,#1a1a2e)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, color:"#a29bfe", padding:"10px 14px", fontSize:15, cursor:"pointer" },
  badge:      { position:"absolute", top:-4, right:-4, background:"#6c63ff", color:"#fff", fontSize:10, fontWeight:700, borderRadius:"50%", width:16, height:16, display:"flex", alignItems:"center", justifyContent:"center" },
  schoolCard: { background:"var(--surface,#1a1a2e)", borderRadius:12, padding:"12px 14px", border:"1px solid rgba(255,255,255,0.07)", cursor:"pointer" },
  schoolName: { margin:0, fontSize:14, fontWeight:700, color:"#f0f4ff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  card:       { background:"var(--surface,#1a1a2e)", borderRadius:12, padding:"14px", border:"1px solid rgba(255,255,255,0.07)", marginBottom:12 },
  typeBadge:  { display:"inline-block", fontSize:10, fontWeight:700, padding:"3px 8px", borderRadius:20, whiteSpace:"nowrap" },
  tag:        { fontSize:11, padding:"3px 8px", borderRadius:20, background:"rgba(108,99,255,0.15)", color:"#a29bfe" },
  label:      { display:"block", color:"#b2bec3", fontSize:12, fontWeight:600, marginBottom:6 },
  modalOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", zIndex:9999, display:"flex", alignItems:"flex-end", justifyContent:"center" },
  modal:      { background:"#1a1a2e", borderRadius:"16px 16px 0 0", padding:18, maxWidth:560, width:"100%", border:"1px solid rgba(255,255,255,0.1)", maxHeight:"88vh", overflowY:"auto" },
};
