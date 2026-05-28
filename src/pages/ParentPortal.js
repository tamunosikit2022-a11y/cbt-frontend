/**
 * ParentPortal.js
 * Route: /parent  (public — no auth guard)
 * Add to App.js:
 *   const ParentPortal = lazy(() => import("./pages/ParentPortal"));
 *   <Route path="/parent" element={<ParentPortal />} />
 */

import { useState, useEffect, useCallback } from "react";

const API_URL = process.env.REACT_APP_API_URL || "https://cbt-backend-dujo.onrender.com/api";

const SUBJECT_COLORS = {
  Physics:          "#6C63FF",
  Chemistry:        "#10B981",
  Mathematics:      "#F59E0B",
  Biology:          "#EF4444",
  "English Language": "#8B5CF6",
  default:          "#6B7280",
};

function subjectColor(s) { return SUBJECT_COLORS[s] || SUBJECT_COLORS.default; }

function ScoreBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ color: "#E5E7EB", fontSize: 13 }}>{label}</span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>{value}%</span>
      </div>
      <div style={{ background: "#1f2937", borderRadius: 6, height: 8, overflow: "hidden" }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color = "#6C63FF" }) {
  return (
    <div style={{ background: "#1a2236", borderRadius: 12, padding: "16px 20px", border: `1px solid ${color}30`, flex: "1 1 140px" }}>
      <div style={{ color: "#6B7280", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
      <div style={{ color, fontSize: 26, fontWeight: 800, margin: "4px 0 2px" }}>{value}</div>
      {sub && <div style={{ color: "#4B5563", fontSize: 11 }}>{sub}</div>}
    </div>
  );
}

// ── AUTH SCREEN ───────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode,   setMode]   = useState("login");  // login | register
  const [form,   setForm]   = useState({ full_name: "", email: "", phone: "", password: "", link_code: "" });
  const [error,  setError]  = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const endpoint = mode === "login" ? "/parent/login" : "/parent/register";
      const res  = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      localStorage.setItem("parent_token", data.token);
      onAuth(data);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const inp = {
    width: "100%", background: "#0d1117", border: "1px solid #374151",
    borderRadius: 10, padding: "11px 14px", color: "#fff", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🎓</div>
          <div style={{ color: "#fff", fontSize: 22, fontWeight: 800 }}>Scholars Syndicate</div>
          <div style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>Parent Dashboard</div>
        </div>

        <div style={{ background: "#111827", borderRadius: 20, padding: 28, border: "1px solid #1f2937" }}>
          {/* Toggle */}
          <div style={{ display: "flex", background: "#0d1117", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {["login", "register"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "9px 0", borderRadius: 8, border: "none",
                background: mode === m ? "#6C63FF" : "transparent",
                color: mode === m ? "#fff" : "#6B7280",
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
                {m === "login" ? "Login" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {mode === "register" && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 5 }}>Full Name</label>
                  <input style={inp} value={form.full_name} onChange={e => set("full_name", e.target.value)} placeholder="Your full name" required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 5 }}>Phone</label>
                  <input style={inp} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="08012345678" />
                </div>
              </>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 5 }}>Email</label>
              <input style={inp} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="parent@email.com" required />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 5 }}>Password</label>
              <input style={inp} type="password" value={form.password} onChange={e => set("password", e.target.value)} placeholder="••••••••" required />
            </div>

            {mode === "register" && (
              <div style={{ marginBottom: 14 }}>
                <label style={{ color: "#9CA3AF", fontSize: 12, display: "block", marginBottom: 5 }}>
                  Student Link Code
                  <span style={{ color: "#6B7280", fontWeight: 400, marginLeft: 6 }}>— ask your child for this code from their app profile</span>
                </label>
                <input style={{ ...inp, borderColor: "#6C63FF50", background: "#6C63FF08" }}
                  value={form.link_code} onChange={e => set("link_code", e.target.value.toUpperCase())}
                  placeholder="SCH-XXXXXX" required />
              </div>
            )}

            {error && (
              <div style={{ background: "#EF444420", border: "1px solid #EF444450", borderRadius: 8, padding: "10px 14px", color: "#EF4444", fontSize: 13, marginBottom: 14 }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              width: "100%", padding: "13px 0", borderRadius: 12,
              background: loading ? "#374151" : "linear-gradient(135deg, #6C63FF, #8B5CF6)",
              border: "none", color: "#fff", fontWeight: 800, fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
            }}>
              {loading ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────
function Dashboard({ token, onLogout }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/parent/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { onLogout(); return; }
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Segoe UI',sans-serif" }}>
      <div style={{ textAlign: "center", color: "#6C63FF" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>📊</div>
        <div>Loading dashboard...</div>
      </div>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: "#EF4444", textAlign: "center" }}>{error}</div>
    </div>
  );

  const { profile, stats, subjects, recent_exams, predicted_score, weekly_activity, score_trend } = data;

  const lastSeen = profile.last_seen
    ? new Date(profile.last_seen).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "Never";

  const scoreColor = (pct) => pct >= 70 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", fontFamily: "'Segoe UI',sans-serif", color: "#fff" }}>
      {/* Header */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1f2937", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontSize: 28 }}>🎓</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Scholars Syndicate</div>
            <div style={{ color: "#6B7280", fontSize: 12 }}>Parent Dashboard</div>
          </div>
        </div>
        <button onClick={onLogout} style={{ background: "#1f2937", border: "1px solid #374151", color: "#9CA3AF", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13 }}>
          Logout
        </button>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "24px 16px" }}>

        {/* Student Profile Card */}
        <div style={{ background: "linear-gradient(135deg, #1a2236, #0d1b3e)", borderRadius: 16, padding: 24, marginBottom: 20, border: "1px solid #6C63FF30", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#6C63FF30", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover" }} /> : "👤"}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{profile.full_name}</div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              <span style={{ color: "#9CA3AF", fontSize: 13 }}>📚 {profile.school_class || "—"}</span>
              <span style={{ color: "#9CA3AF", fontSize: 13 }}>🎯 {profile.target_university || "—"}</span>
              <span style={{ color: "#9CA3AF", fontSize: 13 }}>📖 {profile.target_course || "—"}</span>
            </div>
            <div style={{ marginTop: 6, display: "flex", gap: 12, flexWrap: "wrap" }}>
              <span style={{ color: "#6B7280", fontSize: 12 }}>Last active: {lastSeen}</span>
              <span style={{ background: profile.is_premium ? "#10B98120" : "#EF444420", color: profile.is_premium ? "#10B981" : "#EF4444", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                {profile.is_premium ? "✅ Premium" : "Free Plan"}
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#F59E0B", fontWeight: 800, fontSize: 20 }}>🔥 {profile.current_streak || 0}</div>
              <div style={{ color: "#6B7280", fontSize: 11 }}>Day Streak</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ color: "#6C63FF", fontWeight: 800, fontSize: 20 }}>Lv.{profile.level}</div>
              <div style={{ color: "#6B7280", fontSize: 11 }}>Level</div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
          <StatCard label="Total Exams"      value={stats.total_exams}          color="#6C63FF" />
          <StatCard label="Average Score"    value={`${stats.overall_avg}%`}    color={scoreColor(stats.overall_avg)} />
          <StatCard label="Best Score"       value={`${stats.best_score}%`}     color="#10B981" />
          <StatCard label="Study Hours"      value={stats.total_study_hours}    color="#F59E0B" sub="total time" />
          <StatCard label="Subjects"         value={stats.subjects_practiced}   color="#8B5CF6" sub="practiced" />
        </div>

        {/* JAMB Prediction */}
        {predicted_score && (
          <div style={{ background: "linear-gradient(135deg, #1a1040, #0d1b3e)", borderRadius: 16, padding: 20, marginBottom: 20, border: "1px solid #8B5CF650", textAlign: "center" }}>
            <div style={{ color: "#8B5CF6", fontWeight: 800, fontSize: 12, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              JAMB Score Prediction
            </div>
            <div style={{ fontSize: 36, fontWeight: 900, color: "#fff", marginBottom: 4 }}>
              {predicted_score.low} – {predicted_score.high}
            </div>
            <div style={{ color: "#6B7280", fontSize: 13 }}>Based on recent JAMB practice sessions</div>
            <div style={{ marginTop: 10, fontSize: 12, color: predicted_score.avg >= 200 ? "#10B981" : "#F59E0B" }}>
              {predicted_score.avg >= 250 ? "🎉 Excellent! On track for a strong score." : predicted_score.avg >= 200 ? "📈 Good progress. More practice recommended." : "⚠️ Needs significant improvement. Encourage daily practice."}
            </div>
          </div>
        )}

        {/* Two column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          {/* Subject Performance */}
          <div style={{ background: "#111827", borderRadius: 14, padding: 20, border: "1px solid #1f2937" }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Subject Performance</div>
            {subjects.length === 0 ? (
              <div style={{ color: "#4B5563", textAlign: "center", padding: "20px 0" }}>No exams taken yet</div>
            ) : (
              subjects.slice(0, 6).map(s => (
                <ScoreBar key={s.subject} label={`${s.subject} (${s.total_exams} exams)`} value={parseFloat(s.avg_score)} color={subjectColor(s.subject)} />
              ))
            )}
          </div>

          {/* Recent Exams */}
          <div style={{ background: "#111827", borderRadius: 14, padding: 20, border: "1px solid #1f2937" }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Recent Exams</div>
            {recent_exams.length === 0 ? (
              <div style={{ color: "#4B5563", textAlign: "center", padding: "20px 0" }}>No exams yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recent_exams.slice(0, 8).map(e => (
                  <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "#1a2236", borderRadius: 8 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{e.subject}</div>
                      <div style={{ color: "#6B7280", fontSize: 11 }}>{e.exam_type} · {new Date(e.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: scoreColor(e.percentage), fontWeight: 800, fontSize: 15 }}>{e.percentage}%</div>
                      <div style={{ color: "#4B5563", fontSize: 11 }}>{e.score}/{e.total_questions}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Weekly Activity */}
        {weekly_activity.length > 0 && (
          <div style={{ background: "#111827", borderRadius: 14, padding: 20, border: "1px solid #1f2937", marginBottom: 16 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 16 }}>Activity This Week</div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", height: 80 }}>
              {weekly_activity.map(d => (
                <div key={d.day} style={{ flex: 1, textAlign: "center" }}>
                  <div style={{ background: "#6C63FF", borderRadius: 4, width: "100%", height: `${Math.min(d.exams * 20, 60)}px`, marginBottom: 4, minHeight: 8 }} />
                  <div style={{ color: "#6B7280", fontSize: 10 }}>{new Date(d.day).toLocaleDateString("en-GB", { weekday: "short" })}</div>
                  <div style={{ color: "#9CA3AF", fontSize: 10 }}>{d.exams}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Premium CTA if not premium */}
        {!profile.is_premium && (
          <div style={{ background: "linear-gradient(135deg, #1a1040, #0d1b3e)", borderRadius: 16, padding: 20, border: "1px solid #6C63FF50", textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🚀</div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>Your child is on the Free Plan</div>
            <div style={{ color: "#9CA3AF", fontSize: 13, marginBottom: 16 }}>
              Upgrade to Premium for unlimited practice, all study materials, and formula sheets
            </div>
            <a href="https://wa.me/2349036995642?text=I want Premium access for my child on Scholars Syndicate"
              target="_blank" rel="noopener noreferrer"
              style={{ display: "inline-block", background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff", fontWeight: 800, fontSize: 14, padding: "12px 28px", borderRadius: 12, textDecoration: "none" }}>
              Get Premium — ₦1,500
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────
export default function ParentPortal() {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem("parent_token");
    return token ? { token } : null;
  });

  function handleAuth(data) { setSession({ token: data.token, ...data }); }
  function handleLogout() { localStorage.removeItem("parent_token"); setSession(null); }

  if (!session) return <AuthScreen onAuth={handleAuth} />;
  return <Dashboard token={session.token} onLogout={handleLogout} />;
}
