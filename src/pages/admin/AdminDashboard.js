import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AdminPDFVault from "../../components/AdminPDFVault"; // pdf-vault-v4

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api"; // FIX BUG 21: removed hardcoded stale URL

function adminFetch(path) {
  return fetch(`${API_URL}/admin${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
  }).then(r => { if (!r.ok) throw new Error(r.statusText); return r.json(); });
}

async function adminPost(path, body) {
  const r = await fetch(`${API_URL}/admin${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json();
}

async function adminDelete(path) {
  const r = await fetch(`${API_URL}/admin${path}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}` },
  });
  return r.json();
}

// ── MINI COMPONENTS ───────────────────────────────────────
function Sparkline({ data = [], color = "#6c63ff", height = 40 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 120, h = height;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <polyline points={`0,${h} ${points} ${w},${h}`} fill={color} fillOpacity="0.1" stroke="none" />
    </svg>
  );
}

function MiniBar({ data = [], labelKey, valueKey, color = "#6c63ff", height = 100 }) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map(d => parseFloat(d[valueKey]) || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height, paddingTop: 8 }}>
      {data.map((d, i) => {
        const val = parseFloat(d[valueKey]) || 0;
        const pct = (val / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}
            title={`${d[labelKey]}: ${val}`}>
            <span style={{ fontSize: 9, color: "#636e72" }}>{val}</span>
            <div style={{ width: "100%", background: color, borderRadius: "3px 3px 0 0", height: `${Math.max(pct, 2)}%`, opacity: 0.85 + (i / data.length) * 0.15 }} />
            <span style={{ fontSize: 8, color: "#636e72", textAlign: "center", lineHeight: 1 }}>{String(d[labelKey]).slice(0, 5)}</span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({ values = [], colors = [], labels = [] }) {
  const total = values.reduce((a, b) => a + parseInt(b || 0), 0);
  if (!total) return <Empty />;
  const r = 40, cx = 50, cy = 50, circ = 2 * Math.PI * r;
  let offset = 0;
  const segs = values.map((v, i) => {
    const pct = (parseInt(v) / total) * 100;
    const seg = { pct, offset, color: colors[i], label: labels[i], value: v };
    offset += pct;
    return seg;
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        {segs.map((seg, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={18}
            strokeDasharray={`${(seg.pct / 100) * circ} ${circ}`}
            strokeDashoffset={-((seg.offset / 100) * circ)}
            transform="rotate(-90 50 50)" />
        ))}
        <text x="50" y="54" textAnchor="middle" fontSize="13" fontWeight="800" fill="#2d3436">{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {segs.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, background: seg.color, flexShrink: 0 }} />
            <span style={{ color: "#2d3436" }}>{seg.label}: <strong>{seg.value}</strong></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HeatMap({ data = [] }) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map(d => parseInt(d.exams) || 0), 1);
  const hours = Array.from({ length: 24 }, (_, i) => {
    const f = data.find(d => parseInt(d.hour) === i);
    return { hour: i, count: parseInt(f?.exams || 0) };
  });
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {hours.map(h => {
          const intensity = h.count / max;
          const bg = intensity === 0 ? "#f0f0f0" : `rgba(108,99,255,${0.12 + intensity * 0.88})`;
          return (
            <div key={h.hour} title={`${h.hour}:00 — ${h.count} exams`}
              style={{ width: 28, height: 28, background: bg, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 8, color: intensity > 0.5 ? "#fff" : "#636e72" }}>{h.hour}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "#636e72", marginTop: 6 }}>Each box = 1 hour · Darker = more active</div>
    </div>
  );
}

function Empty({ text = "No data yet" }) {
  return <p style={{ color: "#b2bec3", fontSize: 13, textAlign: "center", padding: "16px 0" }}>{text}</p>;
}

function StatCard({ icon, label, value, sub, color = "#6c63ff", trend, sparkData }) {
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", borderTop: `3px solid ${color}`, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        {trend !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 10, background: trend >= 0 ? "#e8f8f5" : "#ffeae9", color: trend >= 0 ? "#00b894" : "#e17055" }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color, lineHeight: 1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#2d3436" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#636e72" }}>{sub}</div>}
      {sparkData && <Sparkline data={sparkData} color={color} height={32} />}
    </div>
  );
}

function Badge({ text, color = "#6c63ff", bg }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: bg || color + "18", color }}>
      {text}
    </span>
  );
}

// ── TABS ──────────────────────────────────────────────────
const TABS = [
  { id: "overview",      icon: "📊", label: "Overview" },
  { id: "live",          icon: "🔴", label: "Live Feed" },
  { id: "analytics",     icon: "📈", label: "Analytics" },
  { id: "students",      icon: "👥", label: "Students" },
  { id: "arena",         icon: "🏟️", label: "Arena" },
  { id: "keys",          icon: "🔑", label: "Keys" },
  { id: "notifications", icon: "📣", label: "Broadcast" },
  { id: "revenue",       icon: "💰", label: "Revenue" },
  { id: "questions",     icon: "❓", label: "Questions" },
  { id: "spin",          icon: "🎰", label: "Spin Wheel" },
  { id: "gems",          icon: "💎", label: "Gems & Vouchers" },
  { id: "pdf_vault",     icon: "[PDF]", label: "PDF Vault" },
];

function VoucherStats({ API_URL, token }) {
  const [vouchers, setVouchers] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [filter,   setFilter]   = useState("all");

  useEffect(() => {
    fetch(`${API_URL}/vouchers/list?status=${filter}`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => {
      setVouchers(d.vouchers || []);
      setStats(d.stats || null);
    }).catch(() => {});
  }, [filter]);

  return (
    <div>
      {stats && (
        <div style={{ display:"flex", gap:10, marginBottom:14, flexWrap:"wrap" }}>
          {[
            { label:"Total",    value:stats.total    || 0, color:"#6c63ff" },
            { label:"Available",value:stats.available|| 0, color:"#00b894" },
            { label:"Redeemed", value:stats.redeemed || 0, color:"#636e72" },
            { label:"Revenue",  value:`₦${(stats.revenue||0).toLocaleString()}`, color:"#fdcb6e" },
          ].map((s,i) => (
            <div key={i} style={{ background:"#f8f9fa", borderRadius:8, padding:"8px 12px", textAlign:"center", flex:1, minWidth:70 }}>
              <div style={{ fontWeight:800, fontSize:16, color:s.color }}>{s.value}</div>
              <div style={{ fontSize:10, color:"#636e72" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:6, marginBottom:10 }}>
        {["all","unused","redeemed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:"4px 12px", border:"none", borderRadius:20, cursor:"pointer", fontSize:12, fontWeight:700,
              background: filter===f ? "#6c63ff" : "#f0f0f0", color: filter===f ? "#fff" : "#636e72" }}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ maxHeight:380, overflowY:"auto", display:"flex", flexDirection:"column", gap:6 }}>
        {vouchers.map(v => (
          <div key={v.id} style={{ background: v.redeemed_by ? "#f8f9fa" : "#f0fdf4",
            border:`1px solid ${v.redeemed_by ? "#e0e0e0" : "#86efac"}`, borderRadius:8, padding:"10px 12px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ fontFamily:"monospace", fontWeight:800, fontSize:14, letterSpacing:1,
                color: v.redeemed_by ? "#636e72" : "#166534", flex:1 }}>{v.code}</div>
              <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:10,
                background: v.redeemed_by ? "#e0e0e0" : "#dcfce7",
                color: v.redeemed_by ? "#636e72" : "#16a34a" }}>
                {v.redeemed_by ? "Used" : "Available"}
              </span>
            </div>
            <div style={{ fontSize:11, color:"#636e72", marginTop:3 }}>
              {v.gems} Gems · {v.label} · ₦{v.price_naira?.toLocaleString()}
              {v.note && <span style={{ marginLeft:6, color:"#a29bfe" }}>· {v.note}</span>}
            </div>
            {v.redeemed_by_name && (
              <div style={{ fontSize:11, color:"#0984e3", marginTop:2 }}>
                ✅ Redeemed by {v.redeemed_by_name} · {new Date(v.redeemed_at).toLocaleDateString("en-NG")}
              </div>
            )}
          </div>
        ))}
        {!vouchers.length && <Empty text="No vouchers yet" />}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const [tab,          setTab]          = useState("overview");
  const [stats,        setStats]        = useState(null);
  const [analytics,    setAnalytics]    = useState(null);
  const [students,     setStudents]     = useState([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [studentPage,  setStudentPage]  = useState(1);
  const [keys,         setKeys]         = useState([]);
  const [keyTotal,     setKeyTotal]     = useState(0);
  const [profile,      setProfile]      = useState(null);
  const [search,       setSearch]       = useState("");
  const [sort,         setSort]         = useState("newest");
  const [filterP,      setFilterP]      = useState("");
  const [filterB,      setFilterB]      = useState("");
  const [keyPlan,      setKeyPlan]      = useState("monthly");
  const [keyQty,       setKeyQty]       = useState(1);
  const [newKeys,      setNewKeys]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [msg,          setMsg]          = useState("");
  const [msgType,      setMsgType]      = useState("success");
  const [liveActivity, setLiveActivity] = useState([]);
  const [arenaStats,   setArenaStats]   = useState(null);
  const [broadcast,    setBroadcast]    = useState({ title: "", body: "", type: "info" });
  const [revenue,      setRevenue]      = useState(null);
  const [sideCollapsed,setSideCollapsed]= useState(false);
  const [questions,    setQuestions]    = useState([]);
  const [qTotal,       setQTotal]       = useState(0);
  const [qPage,        setQPage]        = useState(1);
  const [qSearch,      setQSearch]      = useState("");
  const [qSubject,     setQSubject]     = useState("");
  const [qExamType,    setQExamType]    = useState("JAMB");
  const [newQ,         setNewQ]         = useState({ exam_type:"JAMB", subject:"Mathematics", topic:"", question:"", option_a:"", option_b:"", option_c:"", option_d:"", correct_answer:"A", explanation:"", difficulty:"medium", year:"" });
  const [showNewQ,     setShowNewQ]     = useState(false);
  const [spinHistory,  setSpinHistory]  = useState([]);
  const [spinStats,    setSpinStats]    = useState(null);
  const [gemsAction,   setGemsAction]   = useState({ studentId:"", amount:"", action:"add", packageId:"gem_350", qty:"1", note:"", generatedVouchers:[] });
  const liveRef = useRef(null);

  const token = localStorage.getItem("admin_token");
  useEffect(() => { if (!token) nav("/admin/login"); }, []);

  // Load overview + analytics
  useEffect(() => {
    setLoading(true);
    Promise.all([
      adminFetch("/dashboard"),
      adminFetch("/analytics"),
    ]).then(([s, a]) => {
      setStats(s);
      setAnalytics(a);
    }).catch(() => showMsg("Failed to load dashboard data.", "error"))
      .finally(() => setLoading(false));
  }, []);

  // Live feed polling every 15s
  useEffect(() => {
    const fetchLive = () => {
      adminFetch("/dashboard").then(s => {
        if (s?.recent_activity) {
          setLiveActivity(prev => {
            const merged = [...(s.recent_activity || []), ...prev];
            return merged.slice(0, 30);
          });
        }
      }).catch(() => {});
    };
    if (tab === "live") {
      fetchLive();
      const interval = setInterval(fetchLive, 15000);
      return () => clearInterval(interval);
    }
  }, [tab]);

  // Load tab-specific data
  useEffect(() => {
    if (tab === "students") {
      const q = new URLSearchParams({ search, sort, page: studentPage, ...(filterP ? { premium: filterP } : {}), ...(filterB ? { banned: filterB } : {}) });
      adminFetch(`/students?${q}`).then(d => {
        setStudents(d.students || []);
        setStudentTotal(d.total || 0);
      }).catch(() => {});
    }
    if (tab === "keys") {
      adminFetch("/keys?page=1").then(d => {
        setKeys(d.keys || []);
        setKeyTotal(d.total || 0);
      }).catch(() => {});
    }
    if (tab === "revenue") {
      // Revenue summary from activation keys
      adminFetch("/keys?page=1&limit=1000").then(d => {
        const keys = d.keys || [];
        const used = keys.filter(k => k.used_by_student_id);
        const plans = { hourly: 100, daily: 200, weekly: 700, monthly: 2000, yearly: 15000 };
        const totalRevenue = used.reduce((sum, k) => sum + (plans[k.plan] || 0), 0);
        const byPlan = {};
        used.forEach(k => { byPlan[k.plan] = (byPlan[k.plan] || 0) + 1; });
        const recent = used.slice(-10).reverse();
        setRevenue({ total: totalRevenue, byPlan, recent, totalKeys: used.length });
      }).catch(() => {});
    }
    if (tab === "arena") {
      // Fetch arena leaderboard via regular API
      fetch(`${API_URL}/arena/leaderboard`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(setArenaStats).catch(() => {});
    }
    if (tab === "questions") {
      const q = new URLSearchParams({ page: qPage, subject: qSubject, exam_type: qExamType, search: qSearch });
      adminFetch(`/questions?${q}`).then(r => { setQuestions(r.questions||[]); setQTotal(r.total||0); }).catch(()=>{});
    }
    if (tab === "spin") {
      adminFetch("/spin-history").then(r => { setSpinHistory(r.history||[]); setSpinStats(r.stats||null); }).catch(()=>{});
    }
  }, [tab, search, sort, filterP, filterB, studentPage]);

  const showMsg = (text, type = "success") => { setMsg(text); setMsgType(type); setTimeout(() => setMsg(""), 4000); };

  const logout = () => { localStorage.removeItem("admin_token"); nav("/admin/login"); };

  const openProfile = (id) => {
    adminFetch(`/students/${id}`).then(d => { setProfile(d); setTab("profile"); }).catch(() => showMsg("Failed to load profile.", "error"));
  };

  const banStudent = async (id) => {
    const reason = window.prompt("Reason for ban?");
    if (!reason) return;
    await adminPost(`/students/${id}/ban`, { reason });
    showMsg("Student banned.");
    setProfile(null); setTab("students");
  };

  const unbanStudent = async (id) => {
    await adminPost(`/students/${id}/unban`, {});
    showMsg("Student unbanned.");
    setProfile(null); setTab("students");
  };

  const generateKeys = async () => {
    const res = await adminPost("/keys", { plan: keyPlan, quantity: parseInt(keyQty) });
    if (res.success) {
      setNewKeys(res.keys);
      showMsg(`${res.keys.length} keys generated!`);
      adminFetch("/keys?page=1").then(d => { setKeys(d.keys || []); setKeyTotal(d.total || 0); });
    } else showMsg(res.error || "Failed.", "error");
  };

  const deactivateKey = async (code) => {
    if (!window.confirm(`Deactivate key ${code}?`)) return;
    await adminDelete(`/keys/${code}`);
    showMsg("Key deactivated.");
    adminFetch("/keys?page=1").then(d => { setKeys(d.keys || []); setKeyTotal(d.total || 0); });
  };

  const copyAllKeys = () => {
    const text = newKeys.map(k => k.key_code).join("\n");
    navigator.clipboard.writeText(text);
    showMsg("All keys copied!");
  };

  const s = stats;
  const a = analytics;

  return (
    <div style={st.page}>
      {/* SIDEBAR */}
      <div style={{ ...st.sidebar, width: sideCollapsed ? 56 : 200 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          {!sideCollapsed && <div style={st.sideTitle}>🎓 Admin</div>}
          <button style={{ background: "none", border: "none", color: "#a29bfe", cursor: "pointer", fontSize: 18, padding: 4 }}
            onClick={() => setSideCollapsed(c => !c)}>
            {sideCollapsed ? "→" : "←"}
          </button>
        </div>

        {TABS.map(({ id, icon, label }) => (
          <button key={id}
            style={{ ...st.sideBtn, background: tab === id ? "#6c63ff" : "transparent", color: tab === id ? "#fff" : "#a29bfe", justifyContent: sideCollapsed ? "center" : "flex-start" }}
            onClick={() => { setTab(id); setProfile(null); }}
            title={label}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            {!sideCollapsed && <span style={{ marginLeft: 8 }}>{label}</span>}
          </button>
        ))}

        {/* LIVE INDICATOR */}
        {!sideCollapsed && (
          <div style={st.liveIndicator}>
            <div style={st.liveDot} />
            <span style={{ fontSize: 11, color: "#636e72" }}>System live</span>
          </div>
        )}

        <button style={{ ...st.sideBtn, color: "#e17055", marginTop: "auto", justifyContent: sideCollapsed ? "center" : "flex-start" }}
          onClick={logout} title="Logout">
          <span>🚪</span>
          {!sideCollapsed && <span style={{ marginLeft: 8 }}>Logout</span>}
        </button>
      </div>

      {/* MAIN CONTENT */}
      <div style={st.main}>

        {/* TOAST */}
        {msg && (
          <div style={{ ...st.toast, background: msgType === "error" ? "#e17055" : "#00b894" }}
            onClick={() => setMsg("")}>
            {msgType === "error" ? "❌" : "✅"} {msg}
            <span style={{ marginLeft: "auto", opacity: 0.7 }}>✕</span>
          </div>
        )}

        {/* ══ OVERVIEW ══════════════════════════════════════ */}
        {tab === "overview" && (
          <>
            <div style={st.pageHeader}>
              <div>
                <h2 style={st.pageTitle}>📊 Dashboard Overview</h2>
                <p style={st.pageSubtitle}>Real-time snapshot of your CBT platform</p>
              </div>
              <button style={st.refreshBtn} onClick={() => {
                setLoading(true);
                Promise.all([adminFetch("/dashboard"), adminFetch("/analytics")])
                  .then(([s, a]) => { setStats(s); setAnalytics(a); })
                  .finally(() => setLoading(false));
              }}>↻ Refresh</button>
            </div>

            {loading ? <Skeleton /> : s && (
              <>
                {/* TOP STATS */}
                <div style={st.statsGrid}>
                  <StatCard icon="👥" label="Total Students"  value={s.students?.total?.toLocaleString()}   sub={`+${s.students?.new_today || 0} joined today`}   color="#6c63ff" trend={s.students?.growth_pct} />
                  <StatCard icon="📝" label="Total Exams"     value={s.exams?.total?.toLocaleString()}      sub={`${s.exams?.today || 0} taken today`}            color="#00b894" trend={s.exams?.growth_pct} />
                  <StatCard icon="📈" label="Average Score"   value={`${s.exams?.avg_score || 0}%`}        sub={`${s.exams?.avg_duration_mins || 0} min avg time`} color="#0984e3" />
                  <StatCard icon="👑" label="Premium Students" value={s.students?.premium}                  sub={`${s.keys?.used || 0} keys activated`}           color="#fdcb6e" />
                  <StatCard icon="🔑" label="Keys Available"  value={s.keys?.available}                    sub={`${s.keys?.monthly_sold || 0} monthly sold`}     color="#a29bfe" />
                  <StatCard icon="⚠️" label="Suspicious Keys"   value={s.suspicious_keys || 0}             sub="keys used from 3+ IPs"                           color="#e17055" />
                  <StatCard icon="💰" label="Est. Revenue"      value={`₦${((s.keys?.used || 0) * 1500).toLocaleString()}`} sub="Avg ₦1,500 per key"               color="#00b894" />
                  <StatCard icon="🔔" label="Notif Subscribers" value={s.students?.total || 0}                  sub="students receiving alerts"                       color="#a29bfe" />
                </div>

                {/* GROWTH + RECENT ACTIVITY */}
                <div style={st.twoCol}>
                  <div style={st.card}>
                    <div style={st.cardHeader}>
                      <div style={st.cardTitle}>📈 Student Growth — Last 14 Days</div>
                    </div>
                    <MiniBar data={s.growth || []} labelKey="date" valueKey="new_students" color="#6c63ff" height={130} />
                  </div>

                  <div style={st.card}>
                    <div style={st.cardHeader}>
                      <div style={st.cardTitle}>🕐 Recent Activity</div>
                      <button style={st.smBtn} onClick={() => setTab("live")}>View live →</button>
                    </div>
                    <div style={{ maxHeight: 220, overflowY: "auto" }}>
                      {(s.recent_activity || []).map((a, i) => (
                        <div key={i} style={st.actRow}>
                          <div style={st.actAvatar}>{a.full_name?.[0] || "?"}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{a.full_name}</div>
                            <div style={{ fontSize: 11, color: "#636e72" }}>{a.subject} · {a.exam_type}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: parseFloat(a.percentage) >= 60 ? "#00b894" : "#e17055" }}>{a.percentage}%</div>
                            <div style={{ fontSize: 10, color: "#b2bec3" }}>{new Date(a.completed_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                      {!s.recent_activity?.length && <Empty />}
                    </div>
                  </div>
                </div>

                {/* SUBJECTS + QUICK ACTIONS */}
                <div style={st.twoCol}>
                  <div style={st.card}>
                    <div style={st.cardTitle}>🏆 Most Practiced Subjects</div>
                    {(s.top_subjects || []).map((subj, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                          <span style={{ fontWeight: 700 }}>#{i + 1} {subj.subject}</span>
                          <div style={{ display: "flex", gap: 8 }}>
                            <span style={{ color: "#636e72" }}>{subj.total_exams} exams</span>
                            <span style={{ fontWeight: 800, color: subj.avg_score >= 60 ? "#00b894" : "#e17055" }}>{subj.avg_score}%</span>
                          </div>
                        </div>
                        <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min((subj.total_exams / (s.top_subjects[0]?.total_exams || 1)) * 100, 100)}%`, background: "#6c63ff", borderRadius: 3 }} />
                        </div>
                      </div>
                    ))}
                    {!s.top_subjects?.length && <Empty />}
                  </div>

                  <div style={st.card}>
                    <div style={st.cardTitle}>⚡ Quick Actions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {[
                        { label: "Generate Activation Keys", icon: "🔑", action: () => setTab("keys"), color: "#6c63ff" },
                        { label: "View All Students",        icon: "👥", action: () => setTab("students"), color: "#00b894" },
                        { label: "Broadcast Message",        icon: "📣", action: () => setTab("notifications"), color: "#fdcb6e" },
                        { label: "View Arena Activity",      icon: "🏟️", action: () => setTab("arena"), color: "#e17055" },
                        { label: "Live Activity Feed",       icon: "🔴", action: () => setTab("live"), color: "#0984e3" },
                      ].map((qa, i) => (
                        <button key={i} style={{ ...st.qaBtn, borderLeft: `3px solid ${qa.color}` }}
                          onClick={qa.action}>
                          <span style={{ fontSize: 18 }}>{qa.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{qa.label}</span>
                          <span style={{ marginLeft: "auto", color: "#b2bec3" }}>→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* BANNED + SUSPICIOUS */}
                {(s.banned_students > 0 || s.suspicious_keys > 0) && (
                  <div style={{ ...st.card, borderLeft: "4px solid #e17055" }}>
                    <div style={st.cardTitle}>🚨 Alerts</div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {s.banned_students > 0 && (
                        <div style={st.alertBox}>
                          <span style={{ fontSize: 22 }}>🚫</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{s.banned_students} Banned Students</div>
                            <button style={st.alertLink} onClick={() => { setFilterB("true"); setTab("students"); }}>View banned →</button>
                          </div>
                        </div>
                      )}
                      {s.suspicious_keys > 0 && (
                        <div style={st.alertBox}>
                          <span style={{ fontSize: 22 }}>⚠️</span>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14 }}>{s.suspicious_keys} Suspicious Keys</div>
                            <button style={st.alertLink} onClick={() => setTab("keys")}>Review keys →</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ══ LIVE FEED ══════════════════════════════════════ */}
        {tab === "live" && (
          <>
            <div style={st.pageHeader}>
              <div>
                <h2 style={st.pageTitle}>🔴 Live Activity Feed</h2>
                <p style={st.pageSubtitle}>Auto-refreshes every 15 seconds</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={st.liveDot} />
                <span style={{ fontSize: 13, color: "#636e72" }}>Live</span>
              </div>
            </div>

            <div style={st.card} ref={liveRef}>
              {liveActivity.length === 0 && <Empty text="Waiting for activity..." />}
              {liveActivity.map((a, i) => (
                <div key={i} style={{ ...st.actRow, padding: "10px 0", opacity: 1 - i * 0.02 }}>
                  <div style={{ ...st.actAvatar, background: i < 3 ? "#6c63ff" : "#f0f0f0", color: i < 3 ? "#fff" : "#636e72" }}>
                    {a.full_name?.[0] || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.full_name}</div>
                    <div style={{ fontSize: 12, color: "#636e72" }}>
                      Took <strong>{a.subject}</strong> exam ({a.exam_type}) · {a.mode} mode
                    </div>
                    <div style={{ fontSize: 11, color: "#b2bec3", marginTop: 2 }}>
                      {new Date(a.completed_at).toLocaleString("en-NG")}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: parseFloat(a.percentage) >= 70 ? "#00b894" : parseFloat(a.percentage) >= 50 ? "#fdcb6e" : "#e17055" }}>
                      {a.percentage}%
                    </div>
                    <div style={{ fontSize: 11, color: "#636e72" }}>{a.score}/{a.total_questions}</div>
                  </div>
                  <button style={{ ...st.smBtn, marginLeft: 12 }} onClick={() => openProfile(a.student_id)}>Profile</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ ANALYTICS ══════════════════════════════════════ */}
        {tab === "analytics" && (
          <>
            <h2 style={st.pageTitle}>📈 Platform Analytics</h2>
            {!a ? <Skeleton /> : (
              <>
                {/* RETENTION + SCORE DIST */}
                <div style={st.twoCol}>
                  <div style={st.card}>
                    <div style={st.cardTitle}>🔄 Student Retention</div>
                    <DonutChart
                      values={[a.retention?.returned_students, a.retention?.active_students, a.retention?.power_students]}
                      colors={["#6c63ff", "#00b894", "#fdcb6e"]}
                      labels={["Returned (2+ exams)", "Active (5+ exams)", "Power users (20+)"]}
                    />
                    <div style={{ fontSize: 12, color: "#636e72", marginTop: 10, borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
                      Total students with exams: <strong>{a.retention?.total_students}</strong>
                    </div>
                  </div>
                  <div style={st.card}>
                    <div style={st.cardTitle}>📊 Score Distribution</div>
                    <DonutChart
                      values={[a.score_distribution?.excellent, a.score_distribution?.good, a.score_distribution?.average, a.score_distribution?.poor]}
                      colors={["#00b894", "#0984e3", "#fdcb6e", "#e17055"]}
                      labels={["Excellent 80+", "Good 60-79", "Average 40-59", "Poor <40"]}
                    />
                  </div>
                </div>

                {/* ACTIVITY HEATMAP */}
                <div style={st.card}>
                  <div style={st.cardTitle}>⏰ Peak Activity Hours</div>
                  <HeatMap data={a.hourly_activity || []} />
                </div>

                {/* EXAM MODES + HARDEST SUBJECTS */}
                <div style={st.twoCol}>
                  <div style={st.card}>
                    <div style={st.cardTitle}>🎮 Exam Modes Used</div>
                    <MiniBar data={a.exam_modes || []} labelKey="mode" valueKey="count" color="#a29bfe" height={120} />
                  </div>
                  <div style={st.card}>
                    <div style={st.cardTitle}>💀 Hardest Subjects</div>
                    {(a.subject_accuracy || []).map((subj, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                          <span style={{ fontWeight: 600 }}>{subj.subject}</span>
                          <span style={{ fontWeight: 800, color: subj.avg_accuracy < 50 ? "#e17055" : "#00b894" }}>{subj.avg_accuracy}%</span>
                        </div>
                        <div style={{ height: 5, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${subj.avg_accuracy}%`, background: subj.avg_accuracy < 50 ? "#e17055" : "#00b894", borderRadius: 3 }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#636e72", marginTop: 1 }}>{subj.total_attempted?.toLocaleString()} questions attempted</div>
                      </div>
                    ))}
                    {!a.subject_accuracy?.length && <Empty />}
                  </div>
                </div>

                {/* EXAM TYPE BREAKDOWN */}
                <div style={st.card}>
                  <div style={st.cardTitle}>📚 JAMB vs Post-UTME Breakdown</div>
                  <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                    {(a.exam_type_breakdown || []).map((et, i) => (
                      <div key={i} style={st.examTypeCard}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{et.exam_type === "JAMB" ? "📘" : "🏫"}</div>
                        <div style={{ fontSize: 22, fontWeight: 900, color: "#6c63ff" }}>{parseInt(et.total_exams)?.toLocaleString()}</div>
                        <div style={{ fontWeight: 700 }}>{et.exam_type}</div>
                        <div style={{ fontSize: 12, color: "#636e72" }}>Avg: {et.avg_score}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ══ STUDENTS ═══════════════════════════════════════ */}
        {tab === "students" && !profile && (
          <>
            <div style={st.pageHeader}>
              <div>
                <h2 style={st.pageTitle}>👥 Students <span style={{ fontSize: 16, color: "#636e72", fontWeight: 400 }}>({studentTotal?.toLocaleString()})</span></h2>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Badge text={`${s?.students?.premium || 0} premium`} color="#fdcb6e" />
                <Badge text={`${s?.banned_students || 0} banned`} color="#e17055" />
              </div>
            </div>

            {/* FILTERS */}
            <div style={st.filterRow}>
              <input style={st.searchInput} placeholder="🔍 Search name, email, phone..."
                value={search} onChange={e => { setSearch(e.target.value); setStudentPage(1); }} />
              <select style={st.sel} value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest first</option>
                <option value="most_active">Most active</option>
                <option value="best_score">Best score</option>
                <option value="oldest">Oldest first</option>
              </select>
              <select style={st.sel} value={filterP} onChange={e => { setFilterP(e.target.value); setStudentPage(1); }}>
                <option value="">All tiers</option>
                <option value="true">Premium only</option>
                <option value="false">Free only</option>
              </select>
              <select style={st.sel} value={filterB} onChange={e => { setFilterB(e.target.value); setStudentPage(1); }}>
                <option value="">All status</option>
                <option value="true">Banned only</option>
              </select>
            </div>

            <div style={st.card}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700 }}>
                  <thead>
                    <tr style={{ background: "#f8f9fa" }}>
                      {["Student", "Contact", "Exams", "Avg Score", "Last Active", "Streak", "Status", ""].map(h => (
                        <th key={h} style={st.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(s => (
                      <tr key={s.id} style={{ borderBottom: "1px solid #f0f0f0", transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#fafbff"}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td style={st.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#3f51b5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0, overflow: "hidden", border: "2px solid #e0e0e0" }}>
                              {s.avatar_url && s.avatar_url.startsWith("http")
                                ? <img src={s.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; e.target.parentNode.innerHTML = s.full_name?.[0] || "?"; }} />
                                : s.avatar_url && !s.avatar_url.startsWith("http")
                                  ? <span style={{ fontSize: 16 }}>{s.avatar_url}</span>
                                  : <span>{s.full_name?.[0] || "?"}</span>
                              }
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{s.full_name}</div>
                              {s.is_premium && <Badge text="👑 Premium" color="#b7860b" bg="#fff9e6" />}
                            </div>
                          </div>
                        </td>
                        <td style={st.td}>
                          <div style={{ fontSize: 12, color: "#636e72" }}>{s.email}</div>
                          {s.phone && <div style={{ fontSize: 11, color: "#b2bec3" }}>{s.phone}</div>}
                        </td>
                        <td style={{ ...st.td, textAlign: "center" }}>
                          <strong style={{ fontSize: 16, color: "#6c63ff" }}>{s.total_exams || 0}</strong>
                        </td>
                        <td style={st.td}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: s.avg_score >= 70 ? "#00b894" : s.avg_score >= 50 ? "#fdcb6e" : s.avg_score ? "#e17055" : "#b2bec3" }}>
                            {s.avg_score || "—"}{s.avg_score ? "%" : ""}
                          </span>
                        </td>
                        <td style={st.td}>
                          <span style={{ fontSize: 11, color: "#636e72" }}>
                            {s.last_active ? new Date(s.last_active).toLocaleDateString("en-NG") : "Never"}
                          </span>
                        </td>
                        <td style={{ ...st.td, textAlign: "center" }}>
                          {s.current_streak > 0 ? <span style={{ color: "#fdcb6e", fontWeight: 700 }}>🔥 {s.current_streak}</span> : <span style={{ color: "#b2bec3" }}>—</span>}
                        </td>
                        <td style={st.td}>
                          <Badge text={s.is_banned ? "Banned" : "Active"} color={s.is_banned ? "#e17055" : "#00b894"} />
                        </td>
                        <td style={st.td}>
                          <button style={st.viewBtn} onClick={() => openProfile(s.id)}>View →</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && <Empty text="No students found." />}
              </div>

              {/* PAGINATION */}
              {studentTotal > 50 && (
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
                  <button style={st.pageBtn} disabled={studentPage === 1} onClick={() => setStudentPage(p => p - 1)}>← Prev</button>
                  <span style={{ padding: "6px 12px", fontSize: 13, color: "#636e72" }}>Page {studentPage} of {Math.ceil(studentTotal / 50)}</span>
                  <button style={st.pageBtn} disabled={studentPage >= Math.ceil(studentTotal / 50)} onClick={() => setStudentPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ STUDENT PROFILE ════════════════════════════════ */}
        {tab === "profile" && profile && (
          <>
            <button style={st.backBtn} onClick={() => { setProfile(null); setTab("students"); }}>← Back to Students</button>

            <div style={st.twoCol}>
              <div>
                {/* PROFILE INFO */}
                <div style={st.card}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
                    <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#6c63ff,#3f51b5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 22, overflow: "hidden", border: "3px solid #e0e0e0", flexShrink: 0 }}>
                      {profile.profile?.avatar_url && profile.profile.avatar_url.startsWith("http")
                        ? <img src={profile.profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} />
                        : profile.profile?.avatar_url && !profile.profile.avatar_url.startsWith("http")
                          ? <span style={{ fontSize: 32 }}>{profile.profile.avatar_url}</span>
                          : <span>{profile.profile?.full_name?.[0] || "?"}</span>
                      }
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18 }}>{profile.profile?.full_name}</div>
                      <div style={{ fontSize: 13, color: "#636e72" }}>{profile.profile?.email}</div>
                      {profile.profile?.phone && <div style={{ fontSize: 12, color: "#b2bec3" }}>📱 {profile.profile.phone}</div>}
                      <div style={{ fontSize: 11, color: "#b2bec3", marginTop: 2 }}>
                        Joined {new Date(profile.profile?.created_at).toLocaleDateString("en-NG", { dateStyle: "long" })}
                      </div>
                    </div>
                    {profile.profile?.is_premium && <Badge text="👑 Premium" color="#b7860b" bg="#fff9e6" />}
                  </div>

                  <div style={st.profileGrid}>
                    <ProfileStat label="Total Exams"    value={profile.profile?.total_exams || 0}       color="#6c63ff" />
                    <ProfileStat label="Avg Score"      value={`${profile.profile?.avg_score || 0}%`}   color="#0984e3" />
                    <ProfileStat label="Best Score"     value={`${profile.profile?.best_score || 0}%`}  color="#00b894" />
                    <ProfileStat label="Wrong Answers"  value={profile.wrong_count || 0}                color="#e17055" />
                    <ProfileStat label="Streak"         value={`${profile.profile?.current_streak || 0}d`} color="#fdcb6e" />
                    <ProfileStat label="Longest Streak" value={`${profile.profile?.longest_streak || 0}d`} color="#a29bfe" />
                  </div>

                  {/* ARENA */}
                  {profile.arena && (
                    <div style={{ marginTop: 14, background: "#0f0f1a", borderRadius: 10, padding: "12px 16px" }}>
                      <div style={{ color: "#a29bfe", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>🏟️ Arena Stats</div>
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                        {[
                          { label: "Matches", value: profile.arena.total_matches, color: "#a29bfe" },
                          { label: "Wins",    value: profile.arena.wins,          color: "#00b894" },
                          { label: "Win Rate",value: `${profile.arena.win_rate}%`, color: "#fdcb6e" },
                          { label: "XP",      value: profile.arena.xp,            color: "#6c63ff" },
                          { label: "Rank",    value: profile.arena.arena_rank,    color: "#e17055" },
                        ].map((item, i) => (
                          <div key={i} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.value}</div>
                            <div style={{ fontSize: 10, color: "#636e72" }}>{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    {profile.profile?.is_banned
                      ? <button style={{ ...st.actionBtn, background: "#00b894" }} onClick={() => unbanStudent(profile.profile.id)}>✓ Unban Student</button>
                      : <button style={{ ...st.actionBtn, background: "#e17055" }} onClick={() => banStudent(profile.profile.id)}>🚫 Ban Student</button>
                    }
                  </div>
                </div>

                {/* SUBJECT PERFORMANCE */}
                <div style={st.card}>
                  <div style={st.cardTitle}>📊 Subject Performance</div>
                  {(profile.performance || []).map((p, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600 }}>{p.subject}</span>
                        <div style={{ display: "flex", gap: 8 }}>
                          <span style={{ fontSize: 11, color: "#636e72" }}>{p.total_correct}/{p.total_attempted}</span>
                          <span style={{ fontWeight: 800, color: p.accuracy >= 60 ? "#00b894" : "#e17055" }}>{p.accuracy}%</span>
                        </div>
                      </div>
                      <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.accuracy}%`, background: p.accuracy >= 70 ? "#00b894" : p.accuracy >= 50 ? "#fdcb6e" : "#e17055", borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                  {!profile.performance?.length && <Empty text="No exams taken yet." />}
                </div>
              </div>

              {/* RECENT EXAMS */}
              <div style={st.card}>
                <div style={st.cardTitle}>📋 Recent Exams ({profile.recent_exams?.length || 0})</div>
                <div style={{ maxHeight: 600, overflowY: "auto" }}>
                  {(profile.recent_exams || []).map((e, i) => (
                    <div key={i} style={st.actRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{e.subject}</div>
                        <div style={{ fontSize: 11, color: "#636e72" }}>
                          {e.exam_type} · {e.mode} mode · {Math.round((e.time_taken_seconds || 0) / 60)} mins
                        </div>
                        {e.institution && <div style={{ fontSize: 10, color: "#b2bec3" }}>{e.institution}</div>}
                        <div style={{ fontSize: 10, color: "#b2bec3" }}>{new Date(e.completed_at).toLocaleDateString("en-NG")}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 900, fontSize: 18, color: parseFloat(e.percentage) >= 70 ? "#00b894" : parseFloat(e.percentage) >= 50 ? "#fdcb6e" : "#e17055" }}>
                          {e.percentage}%
                        </div>
                        <div style={{ fontSize: 11, color: "#636e72" }}>{e.score}/{e.total_questions}</div>
                      </div>
                    </div>
                  ))}
                  {!profile.recent_exams?.length && <Empty text="No exams yet." />}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ ARENA ══════════════════════════════════════════ */}
        {/* ══ REVENUE TAB ══════════════════════════════════ */}
        {tab === "revenue" && (
          <>
            <div style={st.pageHeader}>
              <div>
                <h2 style={st.pageTitle}>💰 Revenue & Conversion</h2>
                <p style={st.pageSubtitle}>Activation key sales, earnings, and student conversion metrics</p>
              </div>
            </div>

            {!revenue ? <Skeleton /> : (() => {
              const totalStudents  = stats?.total_students  || 0;
              const premiumCount   = stats?.premium_students || revenue.totalKeys || 0;
              const freeCount      = Math.max(0, totalStudents - premiumCount);
              const conversionRate = totalStudents > 0 ? ((premiumCount / totalStudents) * 100).toFixed(1) : "0.0";
              const topPlan        = Object.entries(revenue.byPlan || {}).sort((a,b) => b[1]-a[1])[0];
              return (
              <>
                {/* Top KPI strip */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, marginBottom:16 }}>
                  {[
                    { icon:"👥", label:"Total Students",   value: totalStudents.toLocaleString(),         sub:"All registered",           color:"#6c63ff" },
                    { icon:"👑", label:"Premium Students", value: premiumCount.toLocaleString(),           sub:"Active premium",            color:"#fdcb6e" },
                    { icon:"🆓", label:"Free Students",    value: freeCount.toLocaleString(),              sub:"Not yet upgraded",          color:"#0984e3" },
                    { icon:"📈", label:"Conversion Rate",  value: `${conversionRate}%`,                   sub:"Free → Premium",           color:"#00b894" },
                    { icon:"💰", label:"Total Revenue",    value:`₦${revenue.total.toLocaleString()}`,    sub:"From all activations",     color:"#00b894" },
                    { icon:"🔑", label:"Keys Sold",        value: revenue.totalKeys,                       sub:"Total activations",         color:"#a29bfe" },
                  ].map((c,i) => (
                    <div key={i} style={{ background:"#fff", borderRadius:12, padding:"14px 14px", boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
                      <div style={{ fontSize:20, marginBottom:4 }}>{c.icon}</div>
                      <div style={{ fontWeight:900, fontSize:22, color:c.color }}>{c.value}</div>
                      <div style={{ fontSize:12, fontWeight:700, color:"#2d3436" }}>{c.label}</div>
                      <div style={{ fontSize:11, color:"#b2bec3" }}>{c.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Conversion bar */}
                <div style={{ background:"#fff", borderRadius:14, padding:"16px 18px", marginBottom:16, boxShadow:"0 2px 10px rgba(0,0,0,0.06)" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <div style={{ fontWeight:800, fontSize:14 }}>Free → Premium Conversion</div>
                    <div style={{ fontWeight:900, color:"#00b894" }}>{conversionRate}%</div>
                  </div>
                  <div style={{ height:12, background:"#f0f0f0", borderRadius:6, overflow:"hidden", marginBottom:8 }}>
                    <div style={{ height:"100%", width:`${Math.min(parseFloat(conversionRate),100)}%`, background:"linear-gradient(90deg,#6c63ff,#00b894)", borderRadius:6, transition:"width 1s ease" }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#636e72" }}>
                    <span>👑 {premiumCount} premium</span>
                    <span>🆓 {freeCount} free</span>
                  </div>
                  {topPlan && (
                    <div style={{ marginTop:10, background:"#f8f9fa", borderRadius:8, padding:"8px 12px", fontSize:12 }}>
                      🏆 <strong>Top plan:</strong> {topPlan[0]} ({topPlan[1]} activations) — ₦{(topPlan[1] * ({hourly:100,daily:200,weekly:700,monthly:2000,yearly:15000}[topPlan[0]]||0)).toLocaleString()} earned
                    </div>
                  )}
                </div>

                {/* Revenue Stats */}
                <div style={st.statsGrid}>
                  <StatCard icon="📅" label="Monthly Keys"  value={revenue.byPlan?.monthly || 0}           sub={`₦${((revenue.byPlan?.monthly || 0) * 2000).toLocaleString()}`} color="#0984e3" />
                  <StatCard icon="📆" label="Yearly Keys"   value={revenue.byPlan?.yearly || 0}            sub={`₦${((revenue.byPlan?.yearly || 0) * 15000).toLocaleString()}`} color="#fdcb6e" />
                  <StatCard icon="🗓️" label="Weekly Keys"   value={revenue.byPlan?.weekly || 0}            sub={`₦${((revenue.byPlan?.weekly || 0) * 700).toLocaleString()}`}  color="#a29bfe" />
                  <StatCard icon="⏱️" label="Daily/Hourly"  value={(revenue.byPlan?.daily || 0) + (revenue.byPlan?.hourly || 0)} sub="Short-term activations" color="#e17055" />
                </div>

                {/* Plan breakdown */}
                <div style={st.twoCol}>
                  <div style={st.card}>
                    <div style={st.cardTitle}>📊 Revenue by Plan</div>
                    {Object.entries({ hourly: 100, daily: 200, weekly: 700, monthly: 2000, yearly: 15000 }).map(([plan, price]) => {
                      const count = revenue.byPlan?.[plan] || 0;
                      const earned = count * price;
                      const max = revenue.total || 1;
                      return (
                        <div key={plan} style={{ marginBottom: 12 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{plan}</span>
                            <div style={{ display: "flex", gap: 12 }}>
                              <span style={{ color: "#636e72" }}>{count} keys × ₦{price.toLocaleString()}</span>
                              <span style={{ fontWeight: 800, color: "#00b894" }}>₦{earned.toLocaleString()}</span>
                            </div>
                          </div>
                          <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min((earned / max) * 100, 100)}%`, background: "linear-gradient(90deg,#6c63ff,#a29bfe)", borderRadius: 4 }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div style={st.card}>
                    <div style={st.cardTitle}>🕐 Recent Activations</div>
                    <div style={{ maxHeight: 280, overflowY: "auto" }}>
                      {revenue.recent?.length ? revenue.recent.map((k, i) => (
                        <div key={i} style={st.actRow}>
                          <div style={{ ...st.actAvatar, background: "#00b89422", color: "#00b894" }}>₦</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>{k.plan} Plan</div>
                            <div style={{ fontSize: 11, color: "#636e72" }}>{k.key_code?.slice(0, 12)}...</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, color: "#00b894", fontSize: 14 }}>
                              ₦{({ hourly:100, daily:200, weekly:700, monthly:2000, yearly:15000 }[k.plan] || 0).toLocaleString()}
                            </div>
                            <div style={{ fontSize: 10, color: "#b2bec3" }}>{k.used_at ? new Date(k.used_at).toLocaleDateString("en-NG") : "N/A"}</div>
                          </div>
                        </div>
                      )) : <Empty />}
                    </div>
                  </div>
                </div>

                {/* Quick action */}
                <div style={{ ...st.card, textAlign: "center", background: "linear-gradient(135deg,#6c63ff,#a29bfe)", color: "#fff" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🔑</div>
                  <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 4 }}>Generate More Keys</div>
                  <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 16 }}>Create activation keys to sell to students</div>
                  <button style={{ background: "#fff", color: "#6c63ff", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 800, cursor: "pointer" }}
                    onClick={() => setTab("keys")}>
                    Go to Keys →
                  </button>
                </div>
              </>
              );
            })()}
          </>
        )}

        {tab === "arena" && (
          <>
            <h2 style={st.pageTitle}>🏟️ Arena Monitor</h2>
            <div style={st.twoCol}>
              <div style={st.card}>
                <div style={st.cardTitle}>🏆 Arena Leaderboard (Top 20)</div>
                {!arenaStats ? <Empty text="Loading..." /> : (
                  <div style={{ maxHeight: 500, overflowY: "auto" }}>
                    {(Array.isArray(arenaStats) ? arenaStats : []).slice(0, 20).map((p, i) => (
                      <div key={i} style={st.actRow}>
                        <div style={{ width: 28, fontWeight: 800, fontSize: 14, color: i < 3 ? ["#FFD700","#C0C0C0","#CD7F32"][i] : "#636e72", textAlign: "center" }}>
                          {i < 3 ? ["🥇","🥈","🥉"][i] : `#${p.rank}`}
                        </div>
                        <div style={{ flex: 1, marginLeft: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.full_name}</div>
                          <div style={{ fontSize: 11, color: "#636e72" }}>{p.wins}W · {p.win_rate}% win rate</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 900, color: "#6c63ff" }}>{p.xp} XP</div>
                          <div style={{ fontSize: 10, color: "#636e72" }}>{p.arena_rank}</div>
                        </div>
                      </div>
                    ))}
                    {(!arenaStats || !Array.isArray(arenaStats) || arenaStats.length === 0) && <Empty text="No arena matches yet." />}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={st.card}>
                  <div style={st.cardTitle}>📊 Arena Mode Popularity</div>
                  {s?.arena_mode_stats ? (
                    <MiniBar data={s.arena_mode_stats} labelKey="mode" valueKey="total_matches" color="#6c63ff" height={100} />
                  ) : <Empty text="No arena data yet." />}
                </div>
                <div style={st.card}>
                  <div style={st.cardTitle}>⚡ Arena Quick Stats</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { label: "Total matches played", value: s?.arena_total_matches || "—", icon: "⚔️" },
                      { label: "Active players (XP > 0)", value: Array.isArray(arenaStats) ? arenaStats.length : "—", icon: "🎮" },
                      { label: "Top rank", value: Array.isArray(arenaStats) && arenaStats[0] ? arenaStats[0].arena_rank : "—", icon: "👑" },
                    ].map((item, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f0f0" }}>
                        <span style={{ fontSize: 13, color: "#636e72" }}>{item.icon} {item.label}</span>
                        <strong style={{ fontSize: 15, color: "#2d3436" }}>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ KEYS ═══════════════════════════════════════════ */}
        {tab === "keys" && (
          <>
            <div style={st.pageHeader}>
              <h2 style={st.pageTitle}>🔑 Activation Keys <span style={{ fontSize: 16, color: "#636e72", fontWeight: 400 }}>({keyTotal})</span></h2>
            </div>

            <div style={st.twoCol}>
              {/* GENERATE */}
              <div style={st.card}>
                <div style={st.cardTitle}>➕ Generate New Keys</div>
                <label style={st.label}>Plan</label>
                <select style={st.sel} value={keyPlan} onChange={e => setKeyPlan(e.target.value)}>
                  <option value="weekly">Weekly — ₦500 · 7 days</option>
                  <option value="monthly">Monthly — ₦1,500 · 30 days</option>
                  <option value="lifetime">Lifetime — ₦5,000 · Forever</option>
                </select>

                <label style={st.label}>Quantity</label>
                <select style={st.sel} value={keyQty} onChange={e => setKeyQty(e.target.value)}>
                  {[1,2,3,5,10,20,50,100].map(n => <option key={n} value={n}>{n} {n === 1 ? "key" : "keys"}</option>)}
                </select>

                <button style={st.genBtn} onClick={generateKeys}>
                  Generate {keyQty} Key{keyQty > 1 ? "s" : ""} →
                </button>

                {newKeys.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Generated Keys ({newKeys.length}):</div>
                      <button style={st.smBtn} onClick={copyAllKeys}>Copy All</button>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {newKeys.map(k => (
                        <div key={k.id} style={st.keyBox}>
                          <span style={st.keyCode}>{k.key_code}</span>
                          <Badge text={k.plan} color="#6c63ff" />
                          <button style={st.copyBtn} onClick={() => { navigator.clipboard.writeText(k.key_code); showMsg("Copied!"); }}>Copy</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* KEY LIST */}
              <div style={st.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={st.cardTitle}>All Keys</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Badge text="Active" color="#00b894" />
                    <Badge text="Used" color="#636e72" />
                    <Badge text="Inactive" color="#e17055" />
                  </div>
                </div>
                <div style={{ maxHeight: 500, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {keys.map(k => (
                    <div key={k.id} style={{ ...st.keyRow, background: k.unique_ips > 3 ? "#fff5f5" : "#fff" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>{k.key_code}</div>
                        <div style={{ fontSize: 11, color: "#636e72", marginTop: 2 }}>
                          {k.plan} · {k.used_by_name ? <span>Used by <strong>{k.used_by_name}</strong></span> : "Unused"}
                          {k.unique_ips > 3 && <span style={{ color: "#e17055", marginLeft: 6, fontWeight: 700 }}>⚠️ {k.unique_ips} IPs</span>}
                        </div>
                        {k.used_at && <div style={{ fontSize: 10, color: "#b2bec3" }}>Used {new Date(k.used_at).toLocaleDateString()}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <Badge text={!k.is_active ? "Inactive" : k.used_by_name ? "Used" : "Available"} color={!k.is_active ? "#e17055" : k.used_by_name ? "#636e72" : "#00b894"} />
                        {k.is_active && !k.used_by_name && (
                          <button style={st.deactivateBtn} onClick={() => deactivateKey(k.key_code)}>Deactivate</button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!keys.length && <Empty text="No keys generated yet." />}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ BROADCAST / NOTIFICATIONS ══════════════════════ */}
        {tab === "notifications" && (
          <>
            <h2 style={st.pageTitle}>📣 Broadcast to Students</h2>
            <div style={st.twoCol}>
              <div style={st.card}>
                <div style={st.cardTitle}>Send Announcement</div>
                <p style={{ fontSize: 13, color: "#636e72", marginBottom: 14, lineHeight: 1.6 }}>
                  This message will appear as a notification when students next open the app.
                  (Requires a notification system to be implemented in the frontend.)
                </p>

                <label style={st.label}>Type</label>
                <select style={st.sel} value={broadcast.type}
                  onChange={e => setBroadcast(b => ({ ...b, type: e.target.value }))}>
                  <option value="info">ℹ️ Info / Announcement</option>
                  <option value="warning">⚠️ Warning</option>
                  <option value="success">🎉 Celebration</option>
                  <option value="update">🚀 New Feature</option>
                </select>

                <label style={st.label}>Title</label>
                <input style={{ ...st.sel, width: "100%", boxSizing: "border-box" }}
                  placeholder="e.g. New questions added!"
                  value={broadcast.title}
                  onChange={e => setBroadcast(b => ({ ...b, title: e.target.value }))} />

                <label style={st.label}>Message</label>
                <textarea
                  style={{ ...st.sel, width: "100%", boxSizing: "border-box", minHeight: 100, resize: "vertical", fontFamily: "inherit" }}
                  placeholder="Your message to all students..."
                  value={broadcast.body}
                  onChange={e => setBroadcast(b => ({ ...b, body: e.target.value }))}
                />

                <button style={{ ...st.genBtn, background: "#00b894" }}
                  onClick={() => {
                    if (!broadcast.title || !broadcast.body) return showMsg("Fill in title and message.", "error");
                    adminPost("/broadcast", { title: broadcast.title, message: broadcast.body, type: broadcast.type })
                      .then(() => { showMsg("Broadcast sent to all students! 📣"); setBroadcast({ title: "", body: "", type: "info" }); })
                      .catch(() => showMsg("Failed to send broadcast.", "error"));
                  }}>
                  📣 Send to All Students
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {/* PREVIEW */}
                <div style={st.card}>
                  <div style={st.cardTitle}>Preview</div>
                  <div style={{ background: "#f8f9fa", borderRadius: 10, padding: "14px 16px", border: "1px solid #dfe6e9" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>
                      {{ info: "ℹ️", warning: "⚠️", success: "🎉", update: "🚀" }[broadcast.type]} {broadcast.title || "Your title here"}
                    </div>
                    <div style={{ fontSize: 13, color: "#636e72", lineHeight: 1.6 }}>
                      {broadcast.body || "Your message will appear here..."}
                    </div>
                    <div style={{ fontSize: 11, color: "#b2bec3", marginTop: 8 }}>Just now · CBT App</div>
                  </div>
                </div>

                {/* QUICK MESSAGES */}
                <div style={st.card}>
                  <div style={st.cardTitle}>Quick Templates</div>
                  {[
                    { title: "New JAMB questions added", body: "We just added 500+ new JAMB questions! Start practising now.", type: "update" },
                    { title: "Maintenance tonight", body: "The app will be briefly unavailable tonight from 12am–1am for updates.", type: "warning" },
                    { title: "Congratulations top scorers!", body: "Check the leaderboard — this week's top students have been updated!", type: "success" },
                    { title: "New Arena Season", body: "A new Arena season has started! Your rank has been reset. Climb back to the top!", type: "update" },
                  ].map((t, i) => (
                    <div key={i} style={{ ...st.qaBtn, marginBottom: 6 }}
                      onClick={() => setBroadcast(t)}>
                      <span style={{ fontSize: 14 }}>{{ info:"ℹ️", warning:"⚠️", success:"🎉", update:"🚀" }[t.type]}</span>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{t.title}</span>
                      <span style={{ marginLeft: "auto", color: "#b2bec3" }}>Use →</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── QUESTIONS MANAGER ──────────────────────────── */}
        {tab === "questions" && (
          <div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <h2 style={{ fontSize:20, fontWeight:800, color:"#2d3436" }}>❓ Question Bank ({qTotal.toLocaleString()} total)</h2>
              <button style={{ padding:"8px 16px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer" }} onClick={() => setShowNewQ(!showNewQ)}>
                {showNewQ ? "Cancel" : "+ Add Question"}
              </button>
            </div>

            {showNewQ && (
              <div style={{ background:"#f8f9fa", borderRadius:12, padding:16, marginBottom:16, border:"1px solid #e0e0e0" }}>
                <h3 style={{ marginBottom:12, fontSize:14, fontWeight:700 }}>New Question</h3>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:8 }}>
                  <select style={st.sel} value={newQ.exam_type} onChange={e=>setNewQ(p=>({...p,exam_type:e.target.value}))}>
                    <option value="JAMB">JAMB</option><option value="POST-UTME">Post-UTME</option><option value="WAEC">WAEC</option>
                  </select>
                  <select style={st.sel} value={newQ.subject} onChange={e=>setNewQ(p=>({...p,subject:e.target.value}))}>
                    {["Mathematics","English Language","Physics","Chemistry","Biology","Economics","Government","Literature","Geography"].map(s=><option key={s}>{s}</option>)}
                  </select>
                  <select style={st.sel} value={newQ.difficulty} onChange={e=>setNewQ(p=>({...p,difficulty:e.target.value}))}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:8 }}>
                  <input style={st.sel} placeholder="Topic" value={newQ.topic} onChange={e=>setNewQ(p=>({...p,topic:e.target.value}))} />
                  <input style={st.sel} placeholder="Year (e.g. 2023)" value={newQ.year} onChange={e=>setNewQ(p=>({...p,year:e.target.value}))} />
                </div>
                <textarea style={{ ...st.sel, width:"100%", boxSizing:"border-box", height:80, resize:"vertical", fontFamily:"inherit" }} placeholder="Question text..." value={newQ.question} onChange={e=>setNewQ(p=>({...p,question:e.target.value}))} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
                  {["a","b","c","d"].map(opt=>(
                    <input key={opt} style={st.sel} placeholder={`Option ${opt.toUpperCase()}`} value={newQ[`option_${opt}`]} onChange={e=>setNewQ(p=>({...p,[`option_${opt}`]:e.target.value}))} />
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:8 }}>
                  <select style={st.sel} value={newQ.correct_answer} onChange={e=>setNewQ(p=>({...p,correct_answer:e.target.value}))}>
                    {["A","B","C","D"].map(o=><option key={o} value={o}>Correct: {o}</option>)}
                  </select>
                  <input style={st.sel} placeholder="Explanation (optional)" value={newQ.explanation} onChange={e=>setNewQ(p=>({...p,explanation:e.target.value}))} />
                </div>
                <button style={{ width:"100%", padding:12, background:"#00b894", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", marginTop:12 }} onClick={async()=>{
                  try {
                    await adminPost("/questions", newQ);
                    showMsg("Question added ✅");
                    setShowNewQ(false);
                    setNewQ({ exam_type:"JAMB", subject:"Mathematics", topic:"", question:"", option_a:"", option_b:"", option_c:"", option_d:"", correct_answer:"A", explanation:"", difficulty:"medium", year:"" });
                    adminFetch(`/questions?page=1&exam_type=${qExamType}`).then(r=>{ setQuestions(r.questions||[]); setQTotal(r.total||0); });
                  } catch { showMsg("Failed to add question","error"); }
                }}>Save Question</button>
              </div>
            )}

            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              <select style={st.sel} value={qExamType} onChange={e=>{ setQExamType(e.target.value); setQPage(1); }}>
                <option value="JAMB">JAMB</option><option value="POST-UTME">Post-UTME</option><option value="WAEC">WAEC</option>
              </select>
              <select style={st.sel} value={qSubject} onChange={e=>{ setQSubject(e.target.value); setQPage(1); }}>
                <option value="">All Subjects</option>
                {["Mathematics","English Language","Physics","Chemistry","Biology","Economics","Government"].map(s=><option key={s}>{s}</option>)}
              </select>
              <input style={{ ...st.searchInput, flex:1 }} placeholder="Search questions..." value={qSearch} onChange={e=>setQSearch(e.target.value)} />
              <button style={{ padding:"9px 16px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer" }}
                onClick={()=>adminFetch(`/questions?page=1&exam_type=${qExamType}&subject=${qSubject}&search=${qSearch}`).then(r=>{ setQuestions(r.questions||[]); setQTotal(r.total||0); setQPage(1); })}>
                Search
              </button>
            </div>

            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e0e0e0", overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f8f9fa" }}>
                    {["Subject","Topic","Question","Answer","Difficulty","Year","Actions"].map(h=><th key={h} style={st.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q,i)=>(
                    <tr key={q.id} style={{ background:i%2===0?"#fff":"#f8f9fa", borderTop:"1px solid #e0e0e0" }}>
                      <td style={st.td}><span style={{ background:"#e8f4fd", color:"#0984e3", borderRadius:6, padding:"2px 8px", fontSize:11 }}>{q.subject}</span></td>
                      <td style={st.td}>{q.topic||"—"}</td>
                      <td style={{ ...st.td, maxWidth:250 }}><div style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }} title={q.question}>{q.question}</div></td>
                      <td style={st.td}><span style={{ fontWeight:700, color:"#00b894" }}>{q.correct_answer}</span></td>
                      <td style={st.td}><span style={{ background:q.difficulty==="easy"?"#e8f8f5":q.difficulty==="hard"?"#ffeae9":"#fff3e0", color:q.difficulty==="easy"?"#00b894":q.difficulty==="hard"?"#e17055":"#f39c12", borderRadius:6, padding:"2px 8px", fontSize:11 }}>{q.difficulty}</span></td>
                      <td style={st.td}>{q.year||"—"}</td>
                      <td style={st.td}>
                        <button style={{ padding:"3px 8px", background:"#e17055", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontSize:11 }}
                          onClick={async()=>{ if(window.confirm("Delete this question?")){ await adminDelete(`/questions/${q.id}`); setQuestions(prev=>prev.filter(x=>x.id!==q.id)); setQTotal(p=>p-1); } }}>🗑</button>
                      </td>
                    </tr>
                  ))}
                  {questions.length===0 && <tr><td colSpan={7} style={{ textAlign:"center", padding:24, color:"#636e72" }}>No questions found</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:12 }}>
              <span style={{ fontSize:13, color:"#636e72" }}>Page {qPage} · {qTotal} total questions</span>
              <div style={{ display:"flex", gap:8 }}>
                <button style={st.pageBtn} disabled={qPage<=1} onClick={()=>setQPage(p=>p-1)}>← Prev</button>
                <button style={st.pageBtn} disabled={questions.length<50} onClick={()=>setQPage(p=>p+1)}>Next →</button>
              </div>
            </div>
          </div>
        )}

        {/* ── SPIN WHEEL MANAGER ─────────────────────────── */}
        {tab === "spin" && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#2d3436", marginBottom:16 }}>🎰 Spin Wheel Stats</h2>
            {spinStats && (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:20 }}>
                {[
                  { label:"Total Spins",   value:spinStats.total_spins||0,                  color:"#6c63ff" },
                  { label:"Coins Awarded", value:(spinStats.total_coins||0).toLocaleString(), color:"#FFC857" },
                  { label:"Gems Awarded",  value:spinStats.total_gems||0,                   color:"#00D4FF" },
                  { label:"XP Awarded",    value:(spinStats.total_xp||0).toLocaleString(),   color:"#7C5CFF" },
                ].map((s,i)=>(
                  <div key={i} style={{ background:"#fff", borderRadius:12, padding:16, border:`2px solid ${s.color}22` }}>
                    <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:12, color:"#636e72", marginTop:4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background:"#fff", borderRadius:12, border:"1px solid #e0e0e0", overflow:"hidden" }}>
              <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
                <thead>
                  <tr style={{ background:"#f8f9fa" }}>
                    {["Student","Reward Type","Amount","Spun At"].map(h=><th key={h} style={st.th}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {spinHistory.map((s,i)=>(
                    <tr key={s.id} style={{ background:i%2===0?"#fff":"#f8f9fa", borderTop:"1px solid #e0e0e0" }}>
                      <td style={st.td}>{s.full_name||s.student_id}</td>
                      <td style={st.td}><span style={{ background:s.reward_type==="gems"?"#e0f9ff":s.reward_type==="xp"?"#ede9ff":"#fff9e6", color:s.reward_type==="gems"?"#00D4FF":s.reward_type==="xp"?"#7C5CFF":"#FFC857", borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:700 }}>{s.reward_type}</span></td>
                      <td style={st.td}><strong>{s.reward_value}</strong></td>
                      <td style={st.td}>{new Date(s.spun_at).toLocaleString("en-NG",{dateStyle:"short",timeStyle:"short"})}</td>
                    </tr>
                  ))}
                  {spinHistory.length===0 && <tr><td colSpan={4} style={{ textAlign:"center", padding:24, color:"#636e72" }}>No spins yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── GEMS MANAGER ───────────────────────────────── */}
        {tab === "gems" && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#2d3436", marginBottom:8 }}>💎 Gems & Vouchers</h2>
            <p style={{ color:"#636e72", marginBottom:20, fontSize:14 }}>Generate voucher codes to send to students after WhatsApp payment.</p>

            <div style={st.twoCol}>
              {/* GENERATE VOUCHER */}
              <div style={st.card}>
                <div style={st.cardTitle}>🎟️ Generate Voucher Code</div>
                <label style={st.label}>Gem Package</label>
                <select style={{ ...st.sel, width:"100%", boxSizing:"border-box" }}
                  value={gemsAction.packageId || "gem_350"}
                  onChange={e => setGemsAction(p => ({ ...p, packageId: e.target.value }))}>
                  <option value="gem_50">Starter Pack — 50 💎 (₦100)</option>
                  <option value="gem_120">Scholar Pack — 120 💎 (₦200)</option>
                  <option value="gem_350">Elite Pack — 350 💎 (₦500)</option>
                  <option value="gem_800">Champion Pack — 800 💎 (₦1,000)</option>
                  <option value="gem_1800">Legend Pack — 1,800 💎 (₦2,000)</option>
                  <option value="gem_5000">Titan Pack — 5,000 💎 (₦5,000)</option>
                  <option value="gem_17000">Metaverse Pack — 17,000 💎 (₦15,000)</option>
                </select>

                <label style={st.label}>Quantity</label>
                <select style={{ ...st.sel, width:"100%", boxSizing:"border-box" }}
                  value={gemsAction.qty || "1"}
                  onChange={e => setGemsAction(p => ({ ...p, qty: e.target.value }))}>
                  {[1,2,3,5,10].map(n => <option key={n} value={n}>{n} code{n>1?"s":""}</option>)}
                </select>

                <label style={st.label}>Note (optional — e.g. student name)</label>
                <input style={{ ...st.sel, width:"100%", boxSizing:"border-box" }}
                  placeholder="e.g. John Doe - paid via transfer"
                  value={gemsAction.note || ""}
                  onChange={e => setGemsAction(p => ({ ...p, note: e.target.value }))} />

                <button style={{ width:"100%", padding:14, background:"linear-gradient(135deg,#00D4FF,#7C5CFF)",
                  color:"#fff", border:"none", borderRadius:8, fontWeight:800, cursor:"pointer", marginTop:16, fontSize:15 }}
                  onClick={async () => {
                    try {
                      const r = await fetch(`${API_URL}/admin/vouchers/generate`, {
                        method:"POST",
                        headers:{ Authorization:`Bearer ${localStorage.getItem("admin_token")}`, "Content-Type":"application/json" },
                        body: JSON.stringify({ package_id: gemsAction.packageId || "gem_350", quantity: parseInt(gemsAction.qty||1), note: gemsAction.note }),
                      });
                      const data = await r.json();
                      if (data.success) {
                        setGemsAction(p => ({ ...p, generatedVouchers: data.vouchers }));
                        showMsg(`✅ ${data.count} voucher code${data.count>1?"s":""} generated!`);
                      } else showMsg(data.error || "Failed", "error");
                    } catch { showMsg("Failed to generate", "error"); }
                  }}>
                  Generate Voucher Code →
                </button>

                {/* Generated codes display */}
                {gemsAction.generatedVouchers?.length > 0 && (
                  <div style={{ marginTop:16 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                      <div style={{ fontWeight:700, fontSize:13 }}>Generated Codes:</div>
                      <button style={st.smBtn} onClick={() => {
                        const text = gemsAction.generatedVouchers.map(v => `${v.code} — ${v.gems} Gems (${v.label})`).join("\n");
                        navigator.clipboard.writeText(text);
                        showMsg("Copied!");
                      }}>Copy All</button>
                    </div>
                    {gemsAction.generatedVouchers.map((v,i) => (
                      <div key={i} style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10,
                        padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:10 }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:"monospace", fontWeight:900, fontSize:16, letterSpacing:2, color:"#166534" }}>{v.code}</div>
                          <div style={{ fontSize:12, color:"#636e72", marginTop:2 }}>{v.gems} Gems · {v.label} · ₦{v.price?.toLocaleString()}</div>
                        </div>
                        <button style={{ padding:"6px 14px", background:"#16a34a", color:"#fff", border:"none",
                          borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13 }}
                          onClick={() => { navigator.clipboard.writeText(v.code); showMsg("Code copied!"); }}>
                          Copy
                        </button>
                      </div>
                    ))}
                    <div style={{ background:"#fffbeb", border:"1px solid #fcd34d", borderRadius:8, padding:"10px 14px", fontSize:12, color:"#92400e", marginTop:4 }}>
                      💡 Send this code to the student on WhatsApp. They enter it in Gem Store → "Have a Voucher Code?"
                    </div>
                  </div>
                )}
              </div>

              {/* VOUCHER LIST */}
              <div style={st.card}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                  <div style={st.cardTitle}>All Vouchers</div>
                  <div style={{ display:"flex", gap:6 }}>
                    <Badge text="Available" color="#00b894" />
                    <Badge text="Used" color="#636e72" />
                  </div>
                </div>

                {/* Stats row */}
                <VoucherStats adminFetch={adminFetch} API_URL={API_URL} token={localStorage.getItem("admin_token")} />
              </div>
            </div>

            {/* Manual gems override (keep for emergencies) */}
            <div style={{ ...st.card, marginTop:0 }}>
              <div style={st.cardTitle}>⚡ Manual Gem Override (Emergency Only)</div>
              <p style={{ fontSize:12, color:"#636e72", marginBottom:12 }}>Only use this if a voucher fails. Always use vouchers for normal payments.</p>
              <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
                <input style={{ ...st.searchInput, flex:1 }} placeholder="Student ID or email"
                  value={gemsAction.studentId || ""}
                  onChange={e => setGemsAction(p => ({ ...p, studentId: e.target.value }))} />
                <select style={st.sel} value={gemsAction.action || "add"}
                  onChange={e => setGemsAction(p => ({ ...p, action: e.target.value }))}>
                  <option value="add">Add Gems</option>
                  <option value="add_coins">Add Coins</option>
                  <option value="add_xp">Add XP</option>
                </select>
                <input style={{ ...st.sel, width:100 }} type="number" placeholder="Amount"
                  value={gemsAction.amount || ""}
                  onChange={e => setGemsAction(p => ({ ...p, amount: e.target.value }))} />
                <button style={{ padding:"9px 16px", background:"#e17055", color:"#fff", border:"none",
                  borderRadius:8, fontWeight:700, cursor:"pointer" }}
                  onClick={async () => {
                    if (!gemsAction.studentId || !gemsAction.amount) { showMsg("Fill all fields","error"); return; }
                    try {
                      await adminPost("/manage-currency", gemsAction);
                      showMsg(`✅ Done! ${gemsAction.action} ${gemsAction.amount}`);
                      setGemsAction({ studentId:"", amount:"", action:"add" });
                    } catch { showMsg("Failed. Check student ID.","error"); }
                  }}>Apply</button>
              </div>
            </div>
          </div>
        )}

        {tab === "gems" && (
          <div>
            <h2 style={{ fontSize:20, fontWeight:800, color:"#2d3436", marginBottom:8 }}>💎 Gems Manager</h2>
            <p style={{ color:"#636e72", marginBottom:20, fontSize:14 }}>Manually award or remove gems, coins, or XP from any student account.</p>
            <div style={{ background:"#fff", borderRadius:14, padding:20, border:"1px solid #e0e0e0", maxWidth:480 }}>
              <label style={st.label}>Student ID or Email</label>
              <input style={{ ...st.sel, width:"100%", boxSizing:"border-box" }} placeholder="Enter student ID or email" value={gemsAction.studentId} onChange={e=>setGemsAction(p=>({...p,studentId:e.target.value}))} />
              <label style={st.label}>Action</label>
              <select style={{ ...st.sel, width:"100%", boxSizing:"border-box" }} value={gemsAction.action} onChange={e=>setGemsAction(p=>({...p,action:e.target.value}))}>
                <option value="add">Add Gems</option>
                <option value="remove">Remove Gems</option>
                <option value="set">Set Gems (exact)</option>
                <option value="add_coins">Add Coins</option>
                <option value="add_xp">Add XP</option>
              </select>
              <label style={st.label}>Amount</label>
              <input style={{ ...st.sel, width:"100%", boxSizing:"border-box" }} type="number" placeholder="e.g. 50" value={gemsAction.amount} onChange={e=>setGemsAction(p=>({...p,amount:e.target.value}))} />
              <button style={{ width:"100%", padding:14, background:"linear-gradient(135deg,#00D4FF,#7C5CFF)", color:"#fff", border:"none", borderRadius:8, fontWeight:800, cursor:"pointer", marginTop:16, fontSize:15 }}
                onClick={async()=>{
                  if (!gemsAction.studentId || !gemsAction.amount) { showMsg("Fill all fields","error"); return; }
                  try { await adminPost("/manage-currency", gemsAction); showMsg(`✅ Done! ${gemsAction.action} ${gemsAction.amount}`); setGemsAction({ studentId:"", amount:"", action:"add" }); }
                  catch { showMsg("Failed. Check student ID.","error"); }
                }}>Apply Change</button>
            </div>

            <div style={{ marginTop:24 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>Find Student Balance</h3>
              <div style={{ display:"flex", gap:8 }}>
                <input style={{ ...st.searchInput, flex:1 }} placeholder="Search by name or email..." value={search} onChange={e=>setSearch(e.target.value)} />
                <button style={{ padding:"9px 16px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer" }}
                  onClick={()=>adminFetch(`/students?search=${search}&page=1`).then(r=>setStudents(r.students||[]))}>Search</button>
              </div>
              {students.slice(0,5).map(s=>(
                <div key={s.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", background:"#fff", borderRadius:10, border:"1px solid #e0e0e0", marginTop:8 }}>
                  <div style={{ width:36, height:36, background:"linear-gradient(135deg,#6c63ff,#3f51b5)", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14, flexShrink:0 }}>{s.full_name?.[0]||"?"}</div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{s.full_name}</div>
                    <div style={{ fontSize:12, color:"#636e72" }}>{s.email}</div>
                  </div>
                  <div style={{ display:"flex", gap:8, fontSize:12 }}>
                    <span style={{ background:"#fff9e6", color:"#FFC857", borderRadius:8, padding:"3px 8px", fontWeight:700 }}>🪙 {s.coins||0}</span>
                    <span style={{ background:"#e0f9ff", color:"#00D4FF", borderRadius:8, padding:"3px 8px", fontWeight:700 }}>💎 {s.gems||0}</span>
                    <span style={{ background:"#ede9ff", color:"#7C5CFF", borderRadius:8, padding:"3px 8px", fontWeight:700 }}>⚡ {s.points||0}</span>
                  </div>
                  <button style={{ padding:"4px 10px", background:"#6c63ff", color:"#fff", border:"none", borderRadius:6, cursor:"pointer", fontSize:11, fontWeight:700 }}
                    onClick={()=>setGemsAction(p=>({...p,studentId:s.id.toString()}))}>Select</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "pdf_vault" && (
          <AdminPDFVault
            adminToken={localStorage.getItem("admin_token")}
            apiBase={API_URL}
          />
        )}

      </div>
    </div>
  );
}

function ProfileStat({ label, value, color = "#6c63ff" }) {
  return (
    <div style={{ background: "#f8f9fa", borderRadius: 8, padding: "10px 8px", textAlign: "center" }}>
      <div style={{ fontWeight: 900, fontSize: 18, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#636e72", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: "#f0f0f0", borderRadius: 14, height: 90, animation: "pulse 1.5s infinite" }} />
      ))}
    </div>
  );
}

const st = {
  page:         { display: "flex", minHeight: "100vh", background: "#f4f5f7", fontFamily: "'Segoe UI', sans-serif" },
  sidebar:      { background: "#0f0f1a", padding: "20px 10px", display: "flex", flexDirection: "column", gap: 3, flexShrink: 0, transition: "width 0.2s" },
  sideTitle:    { color: "#fff", fontWeight: 900, fontSize: 16, padding: "0 6px" },
  sideBtn:      { padding: "9px 10px", border: "none", borderRadius: 8, cursor: "pointer", textAlign: "left", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", transition: "background 0.15s" },
  liveIndicator:{ display: "flex", alignItems: "center", gap: 6, padding: "8px 6px", marginTop: 8 },
  liveDot:      { width: 8, height: 8, borderRadius: "50%", background: "#00b894", boxShadow: "0 0 0 3px #00b89430", animation: "pulse 2s infinite" },
  main:         { flex: 1, padding: 24, overflowY: "auto", maxWidth: "100%" },
  pageHeader:   { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 10 },
  pageTitle:    { fontSize: 22, fontWeight: 800, color: "#2d3436", margin: 0 },
  pageSubtitle: { fontSize: 13, color: "#636e72", margin: "4px 0 0" },
  refreshBtn:   { padding: "8px 16px", background: "#fff", border: "2px solid #dfe6e9", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13, color: "#2d3436" },
  statsGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 12, marginBottom: 20 },
  card:         { background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 2px 12px rgba(0,0,0,0.05)", marginBottom: 16 },
  cardHeader:   { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle:    { fontWeight: 800, fontSize: 14, color: "#2d3436", margin: 0 },
  twoCol:       { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  actRow:       { display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f4f5f7" },
  actAvatar:    { width: 34, height: 34, borderRadius: "50%", background: "#f0edff", color: "#6c63ff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 },
  filterRow:    { display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" },
  searchInput:  { flex: 2, minWidth: 200, padding: "9px 12px", border: "2px solid #dfe6e9", borderRadius: 8, fontSize: 14 },
  sel:          { padding: "9px 10px", border: "2px solid #dfe6e9", borderRadius: 8, fontSize: 13, background: "#fff", cursor: "pointer" },
  th:           { padding: "10px 12px", textAlign: "left", fontSize: 11, color: "#636e72", fontWeight: 700, borderBottom: "2px solid #f0f0f0", textTransform: "uppercase", letterSpacing: "0.03em" },
  td:           { padding: "10px 12px", fontSize: 13, verticalAlign: "middle" },
  viewBtn:      { padding: "5px 12px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  smBtn:        { padding: "5px 10px", background: "#f0edff", color: "#6c63ff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  pageBtn:      { padding: "6px 14px", background: "#fff", border: "2px solid #dfe6e9", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 },
  backBtn:      { background: "none", border: "none", color: "#6c63ff", fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 16 },
  profileGrid:  { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "14px 0" },
  actionBtn:    { flex: 1, padding: 10, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 },
  label:        { display: "block", fontSize: 11, fontWeight: 700, color: "#636e72", marginBottom: 4, marginTop: 12, textTransform: "uppercase", letterSpacing: "0.04em" },
  genBtn:       { width: "100%", padding: 12, background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14, marginTop: 14 },
  keyBox:       { display: "flex", alignItems: "center", gap: 8, background: "#f8f9fa", borderRadius: 8, padding: "8px 10px" },
  keyCode:      { flex: 1, fontFamily: "monospace", fontSize: 13, fontWeight: 700, letterSpacing: 2 },
  copyBtn:      { padding: "4px 10px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 },
  keyRow:       { display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8, border: "1px solid #f0f0f0" },
  deactivateBtn:{ padding: "3px 8px", background: "#e17055", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 },
  toast:        { display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8, marginBottom: 16, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13 },
  qaBtn:        { display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f8f9fa", border: "none", borderRadius: 8, cursor: "pointer", width: "100%", textAlign: "left" },
  alertBox:     { display: "flex", gap: 12, alignItems: "center", background: "#fff5f5", borderRadius: 10, padding: "12px 14px", flex: 1 },
  alertLink:    { background: "none", border: "none", color: "#e17055", fontWeight: 700, cursor: "pointer", fontSize: 12, padding: 0, marginTop: 4 },
  examTypeCard: { background: "#f8f9fa", borderRadius: 10, padding: "16px 20px", textAlign: "center", flex: 1, minWidth: 140 },
};
