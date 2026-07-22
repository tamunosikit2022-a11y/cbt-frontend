import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useBackNav from "../utils/useBackNav";
import API from "../utils/api";

const CATEGORIES = [
  { value: "",                     label: "All categories" },
  { value: "university",           label: "Universities" },
  { value: "polytechnic",          label: "Polytechnics" },
  { value: "college_of_education", label: "Colleges of Education" },
  { value: "college_of_nursing",   label: "Colleges of Nursing" },
];

export default function CutoffTracker() {
  const nav  = useNavigate();
  const back = useBackNav();

  const [cutoffs,   setCutoffs]   = useState([]);
  const [search,    setSearch]    = useState("");
  const [category,  setCategory]  = useState("");
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [predicted, setPredicted] = useState(null); // student's predicted JAMB score, if available

  useEffect(() => {
    API.get("/innovations/predicted-score")
      .then(r => setPredicted(r.data?.predicted_jamb_score ?? null))
      .catch(() => {}); // optional — page works fine without it
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (search)   params.search   = search;
    if (category) params.category = category;

    const t = setTimeout(() => {
      API.get("/cutoffs", { params })
        .then(r => { setCutoffs(r.data.cutoffs || []); setError(""); })
        .catch(e => setError(e.response?.data?.error || "Failed to load cutoff marks."))
        .finally(() => setLoading(false));
    }, 300); // debounce search typing

    return () => clearTimeout(t);
  }, [search, category]);

  const categoryLabel = (c) => CATEGORIES.find(x => x.value === c)?.label?.replace(/s$/, "") || c;

  const scaleLabel = (type) => {
    if (type === "aggregate100") return "/ 100 aggregate";
    if (type === "aggregate400") return "/ 400 aggregate";
    return "/ 400 UTME";
  };

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => back()}>← Dashboard</button>
        <h2 style={s.title}>🎯 JAMB Cut-Off Mark Tracker</h2>
        <p style={s.sub}>Minimum UTME scores to be considered for admission</p>

        {/* DISCLAIMER — this matters more than almost anything else on this page */}
        <div style={s.disclaimer}>
          ⚠️ <strong>These are minimums only, not guarantees.</strong> Meeting a cutoff qualifies
          you for post-UTME screening — it doesn't mean automatic admission. Competitive
          departments (Medicine, Law, Engineering, etc.) usually require scores well above
          the general minimum shown here. Always confirm on the official JAMB CAPS portal or
          the institution's admissions page before making decisions.
        </div>

        {predicted != null && (
          <div style={s.predictedBanner} onClick={() => nav("/predicted")}>
            <span>🎓 Your predicted score: <strong>{predicted}/400</strong></span>
            <span style={{ fontSize: 12, opacity: 0.8 }}>View details →</span>
          </div>
        )}

        {/* SEARCH + FILTER */}
        <div style={s.filterRow}>
          <input
            style={s.searchInput}
            placeholder="Search institution or course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select style={s.select} value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>

        {loading && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 24 }}>Loading...</p>}
        {error && !loading && <p style={{ color: "#e17055", textAlign: "center", padding: 24 }}>{error}</p>}

        {!loading && !error && cutoffs.length === 0 && (
          <div style={s.emptyState}>
            <div style={{ fontSize: 40 }}>📋</div>
            <p style={{ color: "var(--text-muted)", textAlign: "center" }}>
              {search || category
                ? "No matching entries yet — this list is still growing."
                : "No cutoff data yet."}
            </p>
          </div>
        )}

        {!loading && cutoffs.map(c => {
          const isRawUtme = (c.score_type || "utme_raw400") === "utme_raw400";
          const meets = isRawUtme && predicted != null ? predicted >= c.cutoff_mark : null;
          return (
            <div key={c.id} style={s.card}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text)" }}>{c.institution_name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {c.course_name || `General minimum · ${categoryLabel(c.category)}`}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: "#6c63ff" }}>{c.cutoff_mark}</div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{scaleLabel(c.score_type)} · {c.academic_session}</div>
                </div>
              </div>

              {meets !== null && (
                <div style={{ ...s.meetsPill, background: meets ? "rgba(0,184,148,.15)" : "rgba(225,112,85,.15)", color: meets ? "#00b894" : "#e17055" }}>
                  {meets ? "✅ Your predicted score meets this" : "⚠️ Below your predicted score's reach — for now"}
                </div>
              )}

              {c.source_note && <p style={s.sourceNote}>{c.source_note}</p>}
              <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 6 }}>
                Verified {new Date(c.verified_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                {c.source_url && <> · <a href={c.source_url} target="_blank" rel="noopener noreferrer" style={{ color: "#6c63ff" }}>Source</a></>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const s = {
  page:      { minHeight: "100vh", background: "var(--bg)", fontFamily: "'Plus Jakarta Sans',sans-serif", padding: 16 },
  container: { maxWidth: 640, margin: "0 auto" },
  back:      { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 8 },
  title:     { fontSize: 22, fontWeight: 800, color: "var(--text)", marginBottom: 4 },
  sub:       { color: "var(--text-muted)", marginBottom: 14, fontSize: 13 },
  disclaimer:{ background: "rgba(253,203,110,0.12)", border: "1px solid rgba(253,203,110,0.35)", borderRadius: 12, padding: "12px 14px", fontSize: 12.5, lineHeight: 1.6, color: "#b7860b", marginBottom: 14 },
  predictedBanner: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(108,99,255,0.12)", border: "1px solid rgba(108,99,255,0.3)", borderRadius: 12, padding: "10px 14px", fontSize: 13, color: "var(--text)", marginBottom: 14, cursor: "pointer" },
  filterRow: { display: "flex", gap: 8, marginBottom: 16 },
  searchInput: { flex: 1, padding: "10px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "var(--surface)", color: "var(--text)", fontSize: 13 },
  select:    { padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "var(--surface)", color: "var(--text)", fontSize: 13 },
  card:      { background: "var(--surface)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "14px 16px", marginBottom: 10 },
  meetsPill: { display: "inline-block", marginTop: 8, padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700 },
  sourceNote:{ fontSize: 11, color: "var(--text-muted)", marginTop: 8, lineHeight: 1.5 },
  emptyState:{ background: "var(--surface)", borderRadius: 14, padding: 32, textAlign: "center", border: "1px solid rgba(255,255,255,0.07)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 },
};
