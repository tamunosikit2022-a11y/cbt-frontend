import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

export default function Badges() {
  const nav = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("earned");

  useEffect(() => {
    API.get("/innovations/badges")
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
        <h2 style={s.title}>🏅 Badges & Achievements</h2>
        <p style={s.sub}>{data?.count || 0} of {data?.total || 0} badges earned</p>

        {/* PROGRESS BAR */}
        <div style={s.progressBg}>
          <div style={{ ...s.progressFill, width: `${data?.total ? (data.count / data.total) * 100 : 0}%` }} />
        </div>

        {/* TABS */}
        <div style={s.tabs}>
          {[["earned","🏅 Earned"],["locked","🔒 Locked"]].map(([id, label]) => (
            <button key={id}
              style={{ ...s.tab, background: tab === id ? "#6c63ff" : "#fff", color: tab === id ? "#fff" : "#636e72" }}
              onClick={() => setTab(id)}>
              {label} ({id === "earned" ? data?.count || 0 : data?.locked?.length || 0})
            </button>
          ))}
        </div>

        {/* EARNED */}
        {tab === "earned" && (
          <div style={s.grid}>
            {data?.earned?.length === 0 && (
              <div style={s.empty}>
                <div style={{ fontSize: 48 }}>🎯</div>
                <p style={{ color: "#636e72" }}>No badges yet. Take exams to start earning!</p>
                <button style={s.btn} onClick={() => nav("/exam-select")}>Start Practising →</button>
              </div>
            )}
            {data?.earned?.map((b, i) => (
              <div key={i} style={s.badgeCard}>
                <div style={s.badgeIcon}>{b.icon}</div>
                <div style={s.badgeName}>{b.name}</div>
                <div style={s.badgeDesc}>{b.description}</div>
                <div style={s.earnedDate}>Earned {new Date(b.earned_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</div>
              </div>
            ))}
          </div>
        )}

        {/* LOCKED */}
        {tab === "locked" && (
          <div style={s.grid}>
            {data?.locked?.map((b, i) => (
              <div key={i} style={{ ...s.badgeCard, opacity: 0.5, filter: "grayscale(1)" }}>
                <div style={s.badgeIcon}>{b.icon}</div>
                <div style={s.badgeName}>{b.name}</div>
                <div style={s.badgeDesc}>{b.description}</div>
                <div style={{ fontSize: 10, color: "#b2bec3", marginTop: 4 }}>🔒 Locked</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Loader() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
      <p style={{ color: "#636e72" }}>⏳ Loading badges...</p>
    </div>
  );
}

const s = {
  page:        { minHeight: "100vh", background: "#f8f9fa", fontFamily: "sans-serif", padding: 16 },
  container:   { maxWidth: 640, margin: "0 auto" },
  back:        { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 8 },
  title:       { fontSize: 24, fontWeight: 800, color: "#2d3436", marginBottom: 4 },
  sub:         { color: "#636e72", fontSize: 14, marginBottom: 12 },
  progressBg:  { height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden", marginBottom: 20 },
  progressFill:{ height: "100%", background: "linear-gradient(90deg,#6c63ff,#00b894)", borderRadius: 4, transition: "width 0.5s" },
  tabs:        { display: "flex", gap: 8, marginBottom: 20 },
  tab:         { flex: 1, padding: "10px", border: "2px solid #dfe6e9", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 },
  grid:        { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 12 },
  badgeCard:   { background: "#fff", borderRadius: 14, padding: "18px 14px", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  badgeIcon:   { fontSize: 40 },
  badgeName:   { fontWeight: 800, fontSize: 13, color: "#2d3436" },
  badgeDesc:   { fontSize: 11, color: "#636e72", lineHeight: 1.4 },
  earnedDate:  { fontSize: 10, color: "#a29bfe", fontWeight: 600 },
  empty:       { gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 32, background: "#fff", borderRadius: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  btn:         { padding: "10px 20px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 14 },
};
