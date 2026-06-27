import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";

const SUBJECT_ICONS = {
  Mathematics: "📐", Physics: "⚡", Chemistry: "⚗️", Biology: "🔬",
  English: "📖", Economics: "📊", Government: "🏛️", Geography: "🌍",
  "Literature in English": "📚", Mixed: "🎯",
};

const STATUS_COLOR = { upcoming: "#FFC857", active: "#00D084", completed: "#8b9cbd" };
const STATUS_LABEL = { upcoming: "⏰ Upcoming", active: "🔴 LIVE", completed: "✅ Ended" };

export default function Tournaments() {
  const nav = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [msg, setMsg]                 = useState("");

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(""), 3500); };

  const load = () => {
    setLoading(true);
    API.get("/tournaments")
      .then(r => setTournaments(r.data.tournaments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const register = async (id) => {
    try {
      const r = await API.post(`/tournaments/${id}/register`);
      flash(r.data.success ? "✅ Registered! You'll be notified when it starts." : "❌ " + r.data.error);
      load();
    } catch (e) {
      flash("❌ " + (e.response?.data?.error || "Failed to register"));
    }
  };

  const st = {
    page:  { minHeight: "100vh", background: "var(--bg, #060b18)", color: "var(--text, #e0e6ff)", padding: "16px", paddingBottom: 90, fontFamily: "'Plus Jakarta Sans', sans-serif" },
    head:  { display: "flex", alignItems: "center", gap: 12, marginBottom: 22 },
    back:  { background: "none", border: "none", color: "var(--text-muted, #6b7db3)", fontSize: 22, cursor: "pointer", padding: 0 },
    card:  { background: "var(--surface, #0d1327)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px 18px", marginBottom: 12 },
    badge: (c) => ({ display: "inline-flex", padding: "3px 10px", borderRadius: 10, background: c + "22", color: c, fontSize: 11, fontWeight: 700, marginLeft: 8 }),
    btn:   (c, bg) => ({ padding: "10px 18px", background: bg || "linear-gradient(135deg,#7c5cff,#5e42d4)", border: "none", borderRadius: 10, color: c || "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer" }),
    empty: { textAlign: "center", padding: "48px 16px", color: "var(--text-muted, #6b7db3)" },
  };

  if (loading) return (
    <div style={{ ...st.page, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="loader-ring" />
    </div>
  );

  return (
    <div style={st.page}>
      <div style={st.head}>
        <button style={st.back} onClick={() => nav("/arena")}>←</button>
        <div>
          <div style={{ fontWeight: 900, fontSize: 20 }}>🏆 Tournaments</div>
          <div style={{ color: "var(--text-muted, #6b7db3)", fontSize: 12 }}>Bracket elimination · Compete for big prizes</div>
        </div>
      </div>

      {msg && (
        <div style={{ padding: "10px 14px", background: msg.startsWith("✅") ? "rgba(0,208,132,0.1)" : "rgba(255,90,95,0.1)", border: `1px solid ${msg.startsWith("✅") ? "rgba(0,208,132,0.3)" : "rgba(255,90,95,0.3)"}`, borderRadius: 10, color: msg.startsWith("✅") ? "#00D084" : "#FF5A5F", fontWeight: 700, fontSize: 13, marginBottom: 14 }}>
          {msg}
        </div>
      )}

      {/* Hero card */}
      <div style={{ ...st.card, background: "linear-gradient(135deg,rgba(124,92,255,0.15),rgba(94,66,212,0.08))", border: "1px solid rgba(124,92,255,0.3)", marginBottom: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
        <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Bracket Tournament Mode</div>
        <div style={{ color: "var(--text-muted, #6b7db3)", fontSize: 13, lineHeight: 1.6 }}>
          Compete in elimination bracket tournaments. Win rounds to advance — losers are knocked out. The last student standing wins coins, gems, and an exclusive badge.
        </div>
      </div>

      {tournaments.length === 0 ? (
        <div style={st.empty}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏆</div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>No Active Tournaments</div>
          <div style={{ fontSize: 13 }}>Check back soon — tournaments are created by admins and run regularly.</div>
        </div>
      ) : tournaments.map(t => {
        const statusColor = STATUS_COLOR[t.status] || "#8b9cbd";
        const subjectIcon = SUBJECT_ICONS[t.subject] || "🎯";
        const registered  = t.is_registered;
        const full        = t.participant_count >= t.max_size;

        return (
          <div key={t.id} style={{ ...st.card, border: `1px solid ${statusColor}33` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28 }}>{subjectIcon}</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15 }}>{t.name}</div>
                  <div style={{ color: "var(--text-muted, #6b7db3)", fontSize: 12 }}>{t.subject || "Mixed Subjects"}</div>
                </div>
              </div>
              <span style={st.badge(statusColor)}>{STATUS_LABEL[t.status] || t.status}</span>
            </div>

            {/* Stats row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
              {[
                ["👥 Players", `${t.participant_count || 0} / ${t.max_size}`],
                ["🏅 Prizes", t.prizes?.length ? `${t.prizes.length} rewards` : "TBA"],
                ["📅 Starts", t.start_at ? new Date(t.start_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBA"],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "8px 10px" }}>
                  <div style={{ color: "var(--text-muted, #6b7db3)", fontSize: 10 }}>{label}</div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text, #e0e6ff)" }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Prizes */}
            {t.prizes?.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                {t.prizes.slice(0, 3).map((p, i) => (
                  <div key={i} style={{ background: "rgba(255,200,87,0.1)", border: "1px solid rgba(255,200,87,0.2)", borderRadius: 8, padding: "4px 10px", fontSize: 12, color: "#FFC857", fontWeight: 600 }}>
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"} {p.label || `${p.coins || 0} coins`}
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            {t.status === "upcoming" && (
              registered ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ background: "rgba(0,208,132,0.12)", border: "1px solid rgba(0,208,132,0.3)", borderRadius: 10, padding: "10px 16px", color: "#00D084", fontWeight: 800, fontSize: 13 }}>
                    ✅ Registered — You're in!
                  </span>
                </div>
              ) : full ? (
                <div style={{ color: "#FF5A5F", fontWeight: 700, fontSize: 13 }}>🔴 Tournament Full</div>
              ) : (
                <button onClick={() => register(t.id)} style={st.btn()}>
                  🏆 Register to Compete
                </button>
              )
            )}

            {t.status === "active" && (
              <div style={{ color: "#00D084", fontWeight: 700, fontSize: 13 }}>
                🔴 LIVE — Check Arena for your match
              </div>
            )}

            {t.status === "completed" && (
              <div style={{ color: "var(--text-muted, #6b7db3)", fontSize: 13 }}>
                Tournament ended · Winner: <strong style={{ color: "#FFC857" }}>{t.winner_name || "—"}</strong>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
