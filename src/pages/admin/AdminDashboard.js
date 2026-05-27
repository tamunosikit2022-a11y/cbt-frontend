import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = process.env.REACT_APP_API_URL || "https://cbt-backend-dujo.onrender.com/api";

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

// ── SECTION COLOUR PALETTE ────────────────────────────────
const SC = {
  overview:      { accent: "#3b82f6", bg: "#eff6ff",  text: "#1d4ed8" },
  live:          { accent: "#ef4444", bg: "#fef2f2",  text: "#b91c1c" },
  analytics:     { accent: "#6366f1", bg: "#eef2ff",  text: "#4338ca" },
  arena:         { accent: "#f97316", bg: "#fff7ed",  text: "#c2410c" },
  students:      { accent: "#10b981", bg: "#ecfdf5",  text: "#065f46" },
  revenue:       { accent: "#f59e0b", bg: "#fffbeb",  text: "#92400e" },
  keys:          { accent: "#8b5cf6", bg: "#f5f3ff",  text: "#5b21b6" },
  gems:          { accent: "#06b6d4", bg: "#ecfeff",  text: "#0e7490" },
  questions:     { accent: "#ec4899", bg: "#fdf2f8",  text: "#9d174d" },
  spin:          { accent: "#84cc16", bg: "#f7fee7",  text: "#3f6212" },
  notifications: { accent: "#14b8a6", bg: "#f0fdfa",  text: "#0f766e" },
  reports:       { accent: "#0ea5e9", bg: "#f0f9ff",  text: "#0369a1" },
  settings:      { accent: "#64748b", bg: "#f8fafc",  text: "#334155" },
};

const SIDEBAR_SECTIONS = [
  { heading: "PLATFORM",    items: [{ id: "overview", icon: "📊", label: "Overview" }, { id: "live", icon: "🔴", label: "Live Feed" }] },
  { heading: "ANALYTICS",   items: [{ id: "analytics", icon: "📈", label: "Analytics" }, { id: "arena", icon: "🏟️", label: "Arena" }] },
  { heading: "STUDENTS",    items: [{ id: "students", icon: "👥", label: "Students" }] },
  { heading: "FINANCE",     items: [{ id: "revenue", icon: "💰", label: "Revenue" }, { id: "keys", icon: "🔑", label: "Activation Keys" }, { id: "gems", icon: "💎", label: "Gems & Vouchers" }] },
  { heading: "CONTENT",     items: [{ id: "questions", icon: "❓", label: "Question Bank" }, { id: "spin", icon: "🎰", label: "Spin Wheel" }] },
  { heading: "SYSTEM",      items: [{ id: "notifications", icon: "📣", label: "Broadcast" }, { id: "reports", icon: "📋", label: "Reports" }, { id: "settings", icon: "⚙️", label: "Settings" }] },
];

// ── MINI CHARTS ───────────────────────────────────────────
function Sparkline({ data = [], color = "#3b82f6", height = 40 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1), w = 120, h = height;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={color} fillOpacity="0.1" stroke="none" />
    </svg>
  );
}

function MiniBar({ data = [], labelKey, valueKey, color = "#3b82f6", height = 100 }) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map(d => parseFloat(d[valueKey]) || 0), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height, paddingTop: 8 }}>
      {data.map((d, i) => {
        const val = parseFloat(d[valueKey]) || 0;
        const pct = (val / max) * 100;
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }} title={`${d[labelKey]}: ${val}`}>
            <span style={{ fontSize: 9, color: "#94a3b8" }}>{val}</span>
            <div style={{ width: "100%", background: color, borderRadius: "3px 3px 0 0", height: `${Math.max(pct, 2)}%`, opacity: 0.75 + (i / data.length) * 0.25 }} />
            <span style={{ fontSize: 8, color: "#94a3b8", textAlign: "center", lineHeight: 1 }}>{String(d[labelKey]).slice(0, 5)}</span>
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
    offset += pct; return seg;
  });
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
      <svg width={100} height={100} viewBox="0 0 100 100">
        {segs.map((seg, i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={18}
            strokeDasharray={`${(seg.pct / 100) * circ} ${circ}`}
            strokeDashoffset={-((seg.offset / 100) * circ)} transform="rotate(-90 50 50)" />
        ))}
        <text x="50" y="54" textAnchor="middle" fontSize="13" fontWeight="800" fill="#1e293b">{total}</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {segs.map((seg, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: seg.color, flexShrink: 0 }} />
            <span style={{ color: "#475569" }}>{seg.label}: <strong style={{ color: "#1e293b" }}>{seg.value}</strong></span>
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
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {hours.map(h => {
          const intensity = h.count / max;
          const bg = intensity === 0 ? "#f1f5f9" : `rgba(99,102,241,${0.12 + intensity * 0.88})`;
          return (
            <div key={h.hour} title={`${h.hour}:00 — ${h.count} exams`}
              style={{ width: 30, height: 30, background: bg, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 9, color: intensity > 0.5 ? "#fff" : "#94a3b8", fontWeight: 700 }}>{h.hour}</span>
            </div>
          );
        })}
      </div>
      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>Each cell = 1 hour · Darker = more activity</div>
    </div>
  );
}

function Empty({ text = "No data yet" }) {
  return (
    <div style={{ textAlign: "center", padding: "24px 0", color: "#cbd5e1" }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>📭</div>
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = "#3b82f6", trend, sparkData, onClick }) {
  return (
    <div onClick={onClick}
      style={{ background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)", borderTop: `3px solid ${color}`, display: "flex", flexDirection: "column", gap: 6, cursor: onClick ? "pointer" : "default", transition: "transform 0.15s, box-shadow 0.15s" }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"; }}}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{icon}</div>
        {trend !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, background: trend >= 0 ? "#ecfdf5" : "#fef2f2", color: trend >= 0 ? "#059669" : "#dc2626" }}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1.1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div>}
      {sparkData && <Sparkline data={sparkData} color={color} height={32} />}
    </div>
  );
}

function Badge({ text, color = "#6366f1", bg }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: bg || color + "1a", color }}>{text}</span>
  );
}

function SectionTag({ tab }) {
  const c = SC[tab] || SC.overview;
  return (
    <span style={{ display: "inline-block", fontSize: 10, fontWeight: 800, padding: "2px 10px", borderRadius: 20, background: c.bg, color: c.text, letterSpacing: "0.05em" }}>
      {tab.toUpperCase()}
    </span>
  );
}

function PageHeader({ title, subtitle, tab, action }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexWrap: "wrap", gap: 10 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0 }}>{title}</h2>
          {tab && <SectionTag tab={tab} />}
        </div>
        {subtitle && <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function ProfileStat({ label, value, color = "#6366f1" }) {
  return (
    <div style={{ background: "#f8fafc", borderRadius: 10, padding: "10px 8px", textAlign: "center", border: "1px solid #e2e8f0" }}>
      <div style={{ fontWeight: 900, fontSize: 18, color }}>{value}</div>
      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 22 }}>
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} style={{ background: "#f1f5f9", borderRadius: 14, height: 100 }} />
      ))}
    </div>
  );
}

function VoucherStats({ API_URL, token }) {
  const [vouchers, setVouchers] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState("all");
  useEffect(() => {
    fetch(`${API_URL}/vouchers/list?status=${filter}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setVouchers(d.vouchers || []); setStats(d.stats || null); }).catch(() => {});
  }, [filter]);
  return (
    <div>
      {stats && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {[{ label: "Total", value: stats.total || 0, color: "#6366f1" }, { label: "Available", value: stats.available || 0, color: "#10b981" }, { label: "Redeemed", value: stats.redeemed || 0, color: "#64748b" }, { label: "Revenue", value: `₦${(stats.revenue || 0).toLocaleString()}`, color: "#f59e0b" }].map((s, i) => (
            <div key={i} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 14px", textAlign: "center", flex: 1, minWidth: 70 }}>
              <div style={{ fontWeight: 800, fontSize: 17, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2, fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {["all", "unused", "redeemed"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding: "5px 14px", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 700, background: filter === f ? "#06b6d4" : "#f1f5f9", color: filter === f ? "#fff" : "#64748b" }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      <div style={{ maxHeight: 360, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {vouchers.map(v => (
          <div key={v.id} style={{ background: v.redeemed_by ? "#f8fafc" : "#f0fdfa", border: `1px solid ${v.redeemed_by ? "#e2e8f0" : "#6ee7b7"}`, borderRadius: 10, padding: "10px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 14, letterSpacing: 1, color: v.redeemed_by ? "#64748b" : "#065f46", flex: 1 }}>{v.code}</div>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: v.redeemed_by ? "#f1f5f9" : "#d1fae5", color: v.redeemed_by ? "#64748b" : "#059669" }}>{v.redeemed_by ? "Used" : "Available"}</span>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{v.gems} Gems · {v.label} · ₦{v.price_naira?.toLocaleString()}{v.note && <span style={{ marginLeft: 6, color: "#818cf8" }}>· {v.note}</span>}</div>
            {v.redeemed_by_name && <div style={{ fontSize: 11, color: "#3b82f6", marginTop: 3 }}>✅ Redeemed by {v.redeemed_by_name} · {new Date(v.redeemed_at).toLocaleDateString("en-NG")}</div>}
          </div>
        ))}
        {!vouchers.length && <Empty text="No vouchers yet" />}
      </div>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────
const st = {
  page:       { display: "flex", minHeight: "100vh", background: "#f1f5f9", fontFamily: "'Segoe UI', system-ui, sans-serif" },
  sidebar:    { background: "#0f172a", padding: "20px 10px", display: "flex", flexDirection: "column", gap: 1, flexShrink: 0, transition: "width 0.2s", minHeight: "100vh", overflowY: "auto", overflowX: "hidden" },
  sideTitle:  { color: "#e2e8f0", fontWeight: 900, fontSize: 14, padding: "0 4px", whiteSpace: "nowrap" },
  main:       { flex: 1, padding: 24, overflowY: "auto", maxWidth: "100%" },
  card:       { background: "#fff", borderRadius: 16, padding: "18px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.03)", marginBottom: 16 },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  cardTitle:  { fontWeight: 800, fontSize: 14, color: "#1e293b", margin: "0 0 14px" },
  twoCol:     { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 0 },
  actRow:     { display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #f1f5f9" },
  actAvatar:  { width: 36, height: 36, borderRadius: "50%", background: "#eff6ff", color: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 },
  searchInput:{ padding: "9px 12px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", background: "#fff" },
  sel:        { padding: "9px 10px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 13, background: "#fff", cursor: "pointer", outline: "none" },
  th:         { padding: "10px 14px", textAlign: "left", fontSize: 10, color: "#94a3b8", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" },
  td:         { padding: "11px 14px", fontSize: 13, verticalAlign: "middle" },
  viewBtn:    { padding: "5px 14px", background: "#eff6ff", color: "#3b82f6", border: "1px solid #bfdbfe", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  smBtn:      { padding: "5px 12px", background: "#f8fafc", color: "#64748b", border: "1px solid #e2e8f0", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 700 },
  pageBtn:    { padding: "7px 16px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#475569" },
  backBtn:    { background: "none", border: "none", color: "#3b82f6", fontWeight: 700, cursor: "pointer", fontSize: 14, marginBottom: 16, padding: 0 },
  actionBtn:  { flex: 1, padding: 10, border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 },
  label:      { display: "block", fontSize: 10, fontWeight: 800, color: "#94a3b8", marginBottom: 5, marginTop: 12, textTransform: "uppercase", letterSpacing: "0.06em" },
  genBtn:     { width: "100%", padding: 12, background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 14, marginTop: 14 },
  copyBtn:    { padding: "4px 10px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 },
  toast:      { display: "flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 10, marginBottom: 16, color: "#fff", fontWeight: 600, cursor: "pointer", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.15)" },
  qaBtn:      { display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, cursor: "pointer", width: "100%", textAlign: "left" },
  alertLink:  { background: "none", border: "none", color: "#dc2626", fontWeight: 700, cursor: "pointer", fontSize: 13, padding: 0, textDecoration: "underline" },
  refreshBtn: { padding: "8px 18px", background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13, color: "#475569" },
};

export default function AdminDashboard() {
  const nav = useNavigate();
  const [tab,           setTab]           = useState("overview");
  const [stats,         setStats]         = useState(null);
  const [analytics,     setAnalytics]     = useState(null);
  const [students,      setStudents]      = useState([]);
  const [studentTotal,  setStudentTotal]  = useState(0);
  const [studentPage,   setStudentPage]   = useState(1);
  const [keys,          setKeys]          = useState([]);
  const [keyTotal,      setKeyTotal]      = useState(0);
  const [profile,       setProfile]       = useState(null);
  const [search,        setSearch]        = useState("");
  const [sort,          setSort]          = useState("newest");
  const [filterP,       setFilterP]       = useState("");
  const [filterB,       setFilterB]       = useState("");
  const [keyPlan,       setKeyPlan]       = useState("monthly");
  const [keyQty,        setKeyQty]        = useState(1);
  const [newKeys,       setNewKeys]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [msg,           setMsg]           = useState("");
  const [msgType,       setMsgType]       = useState("success");
  const [liveActivity,  setLiveActivity]  = useState([]);
  const [arenaStats,    setArenaStats]    = useState(null);
  const [broadcast,     setBroadcast]     = useState({ title: "", body: "", type: "info" });
  const [revenue,       setRevenue]       = useState(null);
  const [sideCollapsed, setSideCollapsed] = useState(false);
  const [questions,     setQuestions]     = useState([]);
  const [qTotal,        setQTotal]        = useState(0);
  const [qPage,         setQPage]         = useState(1);
  const [qSearch,       setQSearch]       = useState("");
  const [qSubject,      setQSubject]      = useState("");
  const [qExamType,     setQExamType]     = useState("JAMB");
  const [newQ,          setNewQ]          = useState({ exam_type: "JAMB", subject: "Mathematics", topic: "", question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A", explanation: "", difficulty: "medium", year: "" });
  const [showNewQ,      setShowNewQ]      = useState(false);
  const [spinHistory,   setSpinHistory]   = useState([]);
  const [spinStats,     setSpinStats]     = useState(null);
  const [gemsAction,    setGemsAction]    = useState({ studentId: "", amount: "", action: "add", packageId: "gem_350", qty: "1", note: "", generatedVouchers: [] });
  const [settingsTab,   setSettingsTab]   = useState("general");
  const liveRef = useRef(null);
  const token = localStorage.getItem("admin_token");

  useEffect(() => { if (!token) nav("/admin/login"); }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([adminFetch("/dashboard"), adminFetch("/analytics")])
      .then(([s, a]) => { setStats(s); setAnalytics(a); })
      .catch(() => showMsg("Failed to load dashboard.", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const fetchLive = () => {
      adminFetch("/dashboard").then(s => {
        if (s?.recent_activity) setLiveActivity(prev => [...(s.recent_activity || []), ...prev].slice(0, 30));
      }).catch(() => {});
    };
    if (tab === "live") { fetchLive(); const id = setInterval(fetchLive, 15000); return () => clearInterval(id); }
  }, [tab]);

  useEffect(() => {
    if (tab === "students") {
      const q = new URLSearchParams({ search, sort, page: studentPage, ...(filterP ? { premium: filterP } : {}), ...(filterB ? { banned: filterB } : {}) });
      adminFetch(`/students?${q}`).then(d => { setStudents(d.students || []); setStudentTotal(d.total || 0); }).catch(() => {});
    }
    if (tab === "keys") adminFetch("/keys?page=1").then(d => { setKeys(d.keys || []); setKeyTotal(d.total || 0); }).catch(() => {});
    if (tab === "revenue") {
      adminFetch("/keys?page=1&limit=1000").then(d => {
        const used = (d.keys || []).filter(k => k.used_by_student_id);
        const plans = { hourly: 100, daily: 200, weekly: 700, monthly: 2000, yearly: 15000 };
        const byPlan = {};
        used.forEach(k => { byPlan[k.plan] = (byPlan[k.plan] || 0) + 1; });
        setRevenue({ total: used.reduce((s, k) => s + (plans[k.plan] || 0), 0), byPlan, recent: used.slice(-10).reverse(), totalKeys: used.length });
      }).catch(() => {});
    }
    if (tab === "arena") fetch(`${API_URL}/arena/leaderboard`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).then(setArenaStats).catch(() => {});
    if (tab === "questions") {
      const q = new URLSearchParams({ page: qPage, subject: qSubject, exam_type: qExamType, search: qSearch });
      adminFetch(`/questions?${q}`).then(r => { setQuestions(r.questions || []); setQTotal(r.total || 0); }).catch(() => {});
    }
    if (tab === "spin") adminFetch("/spin-history").then(r => { setSpinHistory(r.history || []); setSpinStats(r.stats || null); }).catch(() => {});
    if (tab === "reports") {
      adminFetch(`/students?search=&sort=newest&page=1`).then(d => { setStudents(d.students || []); setStudentTotal(d.total || 0); }).catch(() => {});
    }
  }, [tab, search, sort, filterP, filterB, studentPage]);

  const showMsg = (text, type = "success") => { setMsg(text); setMsgType(type); setTimeout(() => setMsg(""), 4000); };
  const logout = () => { localStorage.removeItem("admin_token"); nav("/admin/login"); };

  const openProfile = (id) => {
    adminFetch(`/students/${id}`).then(d => { setProfile(d); setTab("profile"); }).catch(() => showMsg("Failed to load profile.", "error"));
  };
  const banStudent = async (id) => {
    const reason = window.prompt("Reason for ban?"); if (!reason) return;
    await adminPost(`/students/${id}/ban`, { reason }); showMsg("Student banned.");
    setProfile(null); setTab("students");
  };
  const unbanStudent = async (id) => {
    await adminPost(`/students/${id}/unban`, {}); showMsg("Student unbanned.");
    setProfile(null); setTab("students");
  };
  const generateKeys = async () => {
    const res = await adminPost("/keys", { plan: keyPlan, quantity: parseInt(keyQty) });
    if (res.success) { setNewKeys(res.keys); showMsg(`${res.keys.length} keys generated!`); adminFetch("/keys?page=1").then(d => { setKeys(d.keys || []); setKeyTotal(d.total || 0); }); }
    else showMsg(res.error || "Failed.", "error");
  };
  const deactivateKey = async (code) => {
    if (!window.confirm(`Deactivate key ${code}?`)) return;
    await adminDelete(`/keys/${code}`); showMsg("Key deactivated.");
    adminFetch("/keys?page=1").then(d => { setKeys(d.keys || []); setKeyTotal(d.total || 0); });
  };
  const copyAllKeys = () => { navigator.clipboard.writeText(newKeys.map(k => k.key_code).join("\n")); showMsg("All keys copied!"); };

  const exportCSV = (rows, filename) => {
    if (!rows.length) return showMsg("No data to export.", "error");
    const keys = Object.keys(rows[0]);
    const csv = [keys.join(","), ...rows.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url); showMsg(`${filename} downloaded!`);
  };

  const s = stats, a = analytics;

  return (
    <div style={st.page}>

      {/* ── SIDEBAR ────────────────────────────────────── */}
      <div style={{ ...st.sidebar, width: sideCollapsed ? 62 : 220 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: sideCollapsed ? "center" : "space-between", padding: sideCollapsed ? "0 4px" : "0 6px", marginBottom: 24 }}>
          {!sideCollapsed && <div style={st.sideTitle}>🎓 Admin Panel</div>}
          <button style={{ background: "none", border: "1px solid #1e293b", color: "#64748b", cursor: "pointer", fontSize: 13, padding: "4px 7px", borderRadius: 6 }}
            onClick={() => setSideCollapsed(c => !c)}>{sideCollapsed ? "▶" : "◀"}</button>
        </div>

        {SIDEBAR_SECTIONS.map(section => (
          <div key={section.heading} style={{ marginBottom: 6 }}>
            {!sideCollapsed && (
              <div style={{ fontSize: 9, fontWeight: 800, color: "#334155", letterSpacing: "0.12em", padding: "6px 10px 3px", textTransform: "uppercase" }}>
                {section.heading}
              </div>
            )}
            {section.items.map(({ id, icon, label }) => {
              const isActive = tab === id;
              const col = SC[id]?.accent || "#3b82f6";
              return (
                <button key={id} title={label}
                  style={{ display: "flex", alignItems: "center", width: "100%", padding: sideCollapsed ? "9px 0" : "8px 10px", justifyContent: sideCollapsed ? "center" : "flex-start", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, background: isActive ? col + "22" : "transparent", color: isActive ? col : "#64748b", borderLeft: isActive ? `3px solid ${col}` : "3px solid transparent", transition: "all 0.15s", marginBottom: 1 }}
                  onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#1e293b"; e.currentTarget.style.color = "#e2e8f0"; }}}
                  onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; }}}
                  onClick={() => { setTab(id); setProfile(null); }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                  {!sideCollapsed && <span style={{ marginLeft: 8 }}>{label}</span>}
                </button>
              );
            })}
          </div>
        ))}

        <div style={{ flex: 1 }} />
        {!sideCollapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 10px", marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 3px #10b98130" }} />
            <span style={{ fontSize: 11, color: "#475569" }}>System live</span>
          </div>
        )}
        <button style={{ display: "flex", alignItems: "center", gap: 8, padding: sideCollapsed ? "9px 0" : "9px 10px", justifyContent: sideCollapsed ? "center" : "flex-start", background: "none", border: "none", borderRadius: 8, cursor: "pointer", color: "#ef4444", fontSize: 13, fontWeight: 600, width: "100%" }}
          title="Logout" onClick={logout}>
          <span>🚪</span>{!sideCollapsed && <span>Logout</span>}
        </button>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────── */}
      <div style={st.main}>

        {msg && (
          <div style={{ ...st.toast, background: msgType === "error" ? "#ef4444" : "#10b981" }} onClick={() => setMsg("")}>
            {msgType === "error" ? "❌" : "✅"} {msg}
            <span style={{ marginLeft: "auto", opacity: 0.7 }}>✕</span>
          </div>
        )}

        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && (
          <>
            <PageHeader title="Dashboard Overview" subtitle="Real-time snapshot of your CBT platform" tab="overview"
              action={<button style={st.refreshBtn} onClick={() => { setLoading(true); Promise.all([adminFetch("/dashboard"), adminFetch("/analytics")]).then(([s, a]) => { setStats(s); setAnalytics(a); }).finally(() => setLoading(false)); }}>↻ Refresh</button>} />

            {(s?.banned_students > 0 || s?.suspicious_keys > 0) && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", marginBottom: 18, display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
                <span style={{ fontWeight: 700, color: "#dc2626", fontSize: 13 }}>🚨 Alerts:</span>
                {s.banned_students > 0 && <button style={st.alertLink} onClick={() => { setFilterB("true"); setTab("students"); }}>🚫 {s.banned_students} banned students →</button>}
                {s.suspicious_keys > 0 && <button style={st.alertLink} onClick={() => setTab("keys")}>⚠️ {s.suspicious_keys} suspicious keys →</button>}
              </div>
            )}

            {loading ? <Skeleton /> : s && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px,1fr))", gap: 14, marginBottom: 22 }}>
                  <StatCard icon="👥" label="Total Students"   value={s.students?.total?.toLocaleString()} sub={`+${s.students?.new_today || 0} today`}       color="#10b981" trend={s.students?.growth_pct} onClick={() => setTab("students")} />
                  <StatCard icon="📝" label="Exams Taken"      value={s.exams?.total?.toLocaleString()}    sub={`${s.exams?.today || 0} today`}               color="#3b82f6" trend={s.exams?.growth_pct} />
                  <StatCard icon="📈" label="Avg Score"        value={`${s.exams?.avg_score || 0}%`}       sub={`${s.exams?.avg_duration_mins || 0} min avg`} color="#6366f1" />
                  <StatCard icon="👑" label="Premium Students" value={s.students?.premium}                 sub={`${s.keys?.used || 0} keys activated`}        color="#f59e0b" onClick={() => setTab("keys")} />
                  <StatCard icon="🔑" label="Keys Available"   value={s.keys?.available}                   sub={`${s.keys?.monthly_sold || 0} monthly sold`}  color="#8b5cf6" onClick={() => setTab("keys")} />
                  <StatCard icon="💰" label="Est. Revenue"     value={`₦${((s.keys?.used || 0) * 1500).toLocaleString()}`} sub="Avg ₦1,500/key"             color="#f97316" onClick={() => setTab("revenue")} />
                  <StatCard icon="⚠️" label="Suspicious Keys"  value={s.suspicious_keys || 0}             sub="Used from 3+ IPs"                             color="#ef4444" onClick={() => setTab("keys")} />
                  <StatCard icon="🔔" label="Subscribers"      value={s.students?.total || 0}             sub="Receiving alerts"                              color="#14b8a6" />
                </div>

                <div style={st.twoCol}>
                  <div style={st.card}>
                    <div style={st.cardHeader}>
                      <div style={st.cardTitle}>📈 Student Growth — 14 Days</div>
                    </div>
                    <MiniBar data={s.growth || []} labelKey="date" valueKey="new_students" color="#3b82f6" height={130} />
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
                            <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.subject} · {a.exam_type}</div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, fontSize: 14, color: parseFloat(a.percentage) >= 60 ? "#10b981" : "#ef4444" }}>{a.percentage}%</div>
                            <div style={{ fontSize: 10, color: "#cbd5e1" }}>{new Date(a.completed_at).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      ))}
                      {!s.recent_activity?.length && <Empty />}
                    </div>
                  </div>
                </div>

                <div style={st.twoCol}>
                  <div style={st.card}>
                    <div style={st.cardTitle}>🏆 Most Practiced Subjects</div>
                    {(s.top_subjects || []).map((subj, i) => (
                      <div key={i} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                          <span style={{ fontWeight: 700 }}>#{i + 1} {subj.subject}</span>
                          <div style={{ display: "flex", gap: 10 }}>
                            <span style={{ color: "#94a3b8" }}>{subj.total_exams} exams</span>
                            <span style={{ fontWeight: 800, color: subj.avg_score >= 60 ? "#10b981" : "#ef4444" }}>{subj.avg_score}%</span>
                          </div>
                        </div>
                        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${Math.min((subj.total_exams / (s.top_subjects[0]?.total_exams || 1)) * 100, 100)}%`, background: "linear-gradient(90deg,#3b82f6,#6366f1)", borderRadius: 4 }} />
                        </div>
                      </div>
                    ))}
                    {!s.top_subjects?.length && <Empty />}
                  </div>
                  <div style={st.card}>
                    <div style={st.cardTitle}>⚡ Quick Actions</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {[
                        { label: "Generate Activation Keys", icon: "🔑", id: "keys",          color: "#8b5cf6" },
                        { label: "View All Students",        icon: "👥", id: "students",       color: "#10b981" },
                        { label: "Broadcast Message",        icon: "📣", id: "notifications",  color: "#14b8a6" },
                        { label: "View Revenue",             icon: "💰", id: "revenue",        color: "#f59e0b" },
                        { label: "Live Activity Feed",       icon: "🔴", id: "live",           color: "#ef4444" },
                        { label: "Export Reports",           icon: "📋", id: "reports",        color: "#0ea5e9" },
                      ].map((qa, i) => (
                        <button key={i} style={{ ...st.qaBtn, borderLeft: `3px solid ${qa.color}` }} onClick={() => { setTab(qa.id); setProfile(null); }}>
                          <span style={{ fontSize: 17 }}>{qa.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13, color: "#334155" }}>{qa.label}</span>
                          <span style={{ marginLeft: "auto", color: "#cbd5e1", fontSize: 12 }}>→</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ══ LIVE FEED ══ */}
        {tab === "live" && (
          <>
            <PageHeader title="Live Activity Feed" subtitle="Auto-refreshes every 15 seconds" tab="live"
              action={
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "#fef2f2", borderRadius: 20, border: "1px solid #fecaca" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#dc2626" }}>LIVE</span>
                </div>
              } />
            <div style={st.card} ref={liveRef}>
              {liveActivity.length === 0 && <Empty text="Waiting for activity..." />}
              {liveActivity.map((a, i) => (
                <div key={i} style={{ ...st.actRow, padding: "12px 0", opacity: Math.max(0.4, 1 - i * 0.025) }}>
                  <div style={{ ...st.actAvatar, background: i < 3 ? "#3b82f6" : "#f1f5f9", color: i < 3 ? "#fff" : "#64748b" }}>{a.full_name?.[0] || "?"}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{a.full_name}</div>
                    <div style={{ fontSize: 12, color: "#64748b" }}><strong>{a.subject}</strong> · {a.exam_type} · {a.mode} mode</div>
                    <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 2 }}>{new Date(a.completed_at).toLocaleString("en-NG")}</div>
                  </div>
                  <div style={{ textAlign: "right", minWidth: 60 }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: parseFloat(a.percentage) >= 70 ? "#10b981" : parseFloat(a.percentage) >= 50 ? "#f59e0b" : "#ef4444" }}>{a.percentage}%</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{a.score}/{a.total_questions}</div>
                  </div>
                  <button style={{ ...st.smBtn, marginLeft: 12 }} onClick={() => openProfile(a.student_id)}>View →</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══ ANALYTICS ══ */}
        {tab === "analytics" && (
          <>
            <PageHeader title="Platform Analytics" subtitle="Detailed performance & engagement metrics" tab="analytics" />
            {!a ? <Skeleton /> : (
              <>
                <div style={st.twoCol}>
                  <div style={st.card}>
                    <div style={st.cardTitle}>🔄 Student Retention</div>
                    <DonutChart values={[a.retention?.returned_students, a.retention?.active_students, a.retention?.power_students]} colors={["#6366f1", "#10b981", "#f59e0b"]} labels={["Returned (2+)", "Active (5+)", "Power (20+)"]} />
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 10, borderTop: "1px solid #f1f5f9", paddingTop: 10 }}>Total with exams: <strong>{a.retention?.total_students}</strong></div>
                  </div>
                  <div style={st.card}>
                    <div style={st.cardTitle}>📊 Score Distribution</div>
                    <DonutChart values={[a.score_distribution?.excellent, a.score_distribution?.good, a.score_distribution?.average, a.score_distribution?.poor]} colors={["#10b981", "#3b82f6", "#f59e0b", "#ef4444"]} labels={["Excellent 80+", "Good 60–79", "Average 40–59", "Poor <40"]} />
                  </div>
                </div>
                <div style={st.card}>
                  <div style={st.cardTitle}>⏰ Peak Activity Hours</div>
                  <HeatMap data={a.hourly_activity || []} />
                </div>
                <div style={st.twoCol}>
                  <div style={st.card}>
                    <div style={st.cardTitle}>🎮 Exam Modes Used</div>
                    <MiniBar data={a.exam_modes || []} labelKey="mode" valueKey="count" color="#8b5cf6" height={120} />
                  </div>
                  <div style={st.card}>
                    <div style={st.cardTitle}>💀 Hardest Subjects</div>
                    {(a.subject_accuracy || []).map((subj, i) => (
                      <div key={i} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                          <span style={{ fontWeight: 600 }}>{subj.subject}</span>
                          <span style={{ fontWeight: 800, color: subj.avg_accuracy < 50 ? "#ef4444" : "#10b981" }}>{subj.avg_accuracy}%</span>
                        </div>
                        <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${subj.avg_accuracy}%`, background: subj.avg_accuracy < 50 ? "#ef4444" : "#10b981", borderRadius: 4 }} />
                        </div>
                        <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 1 }}>{subj.total_attempted?.toLocaleString()} attempted</div>
                      </div>
                    ))}
                    {!a.subject_accuracy?.length && <Empty />}
                  </div>
                </div>
                <div style={st.card}>
                  <div style={st.cardTitle}>📚 JAMB vs Post-UTME</div>
                  <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                    {(a.exam_type_breakdown || []).map((et, i) => (
                      <div key={i} style={{ background: "#f8fafc", borderRadius: 12, padding: "18px 24px", textAlign: "center", flex: 1, minWidth: 140, border: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: 30, marginBottom: 6 }}>{et.exam_type === "JAMB" ? "📘" : "🏫"}</div>
                        <div style={{ fontSize: 24, fontWeight: 900, color: "#6366f1" }}>{parseInt(et.total_exams)?.toLocaleString()}</div>
                        <div style={{ fontWeight: 700, color: "#334155" }}>{et.exam_type}</div>
                        <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>Avg: {et.avg_score}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {/* ══ STUDENTS ══ */}
        {tab === "students" && !profile && (
          <>
            <PageHeader title="Students" subtitle={`${studentTotal?.toLocaleString()} registered accounts`} tab="students"
              action={<div style={{ display: "flex", gap: 8 }}><Badge text={`${s?.students?.premium || 0} premium`} color="#f59e0b" /><Badge text={`${s?.banned_students || 0} banned`} color="#ef4444" /></div>} />

            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", background: "#fff", padding: "14px 16px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <input style={{ ...st.searchInput, flex: 2, minWidth: 200 }} placeholder="🔍 Search name, email, phone..."
                value={search} onChange={e => { setSearch(e.target.value); setStudentPage(1); }} />
              <select style={st.sel} value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest first</option><option value="most_active">Most active</option>
                <option value="best_score">Best score</option><option value="oldest">Oldest first</option>
              </select>
              <select style={st.sel} value={filterP} onChange={e => { setFilterP(e.target.value); setStudentPage(1); }}>
                <option value="">All tiers</option><option value="true">Premium only</option><option value="false">Free only</option>
              </select>
              <select style={st.sel} value={filterB} onChange={e => { setFilterB(e.target.value); setStudentPage(1); }}>
                <option value="">All status</option><option value="true">Banned only</option>
              </select>
              <button style={{ padding: "9px 16px", background: "#10b981", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                onClick={() => exportCSV(students.map(stu => ({ id: stu.id, name: stu.full_name, email: stu.email, exams: stu.total_exams || 0, avg_score: stu.avg_score || 0, premium: stu.is_premium ? "Yes" : "No", status: stu.is_banned ? "Banned" : "Active" })), "students.csv")}>
                ↓ Export CSV
              </button>
            </div>

            <div style={st.card}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
                  <thead>
                    <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                      {["Student", "Contact", "Exams", "Avg Score", "Last Active", "Streak", "Status", ""].map(h => <th key={h} style={st.th}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {students.map(stu => (
                      <tr key={stu.id} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.1s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                        onMouseLeave={e => e.currentTarget.style.background = ""}>
                        <td style={st.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 13, flexShrink: 0, overflow: "hidden" }}>
                              {stu.avatar_url?.startsWith("http") ? <img src={stu.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : stu.avatar_url && !stu.avatar_url.startsWith("http") ? <span style={{ fontSize: 16 }}>{stu.avatar_url}</span> : <span>{stu.full_name?.[0] || "?"}</span>}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{stu.full_name}</div>
                              {stu.is_premium && <Badge text="👑 Premium" color="#b45309" bg="#fef3c7" />}
                            </div>
                          </div>
                        </td>
                        <td style={st.td}><div style={{ fontSize: 12, color: "#64748b" }}>{stu.email}</div>{stu.phone && <div style={{ fontSize: 11, color: "#cbd5e1" }}>{stu.phone}</div>}</td>
                        <td style={{ ...st.td, textAlign: "center" }}><strong style={{ fontSize: 16, color: "#6366f1" }}>{stu.total_exams || 0}</strong></td>
                        <td style={st.td}><span style={{ fontWeight: 800, fontSize: 15, color: stu.avg_score >= 70 ? "#10b981" : stu.avg_score >= 50 ? "#f59e0b" : stu.avg_score ? "#ef4444" : "#cbd5e1" }}>{stu.avg_score || "—"}{stu.avg_score ? "%" : ""}</span></td>
                        <td style={st.td}><span style={{ fontSize: 11, color: "#94a3b8" }}>{stu.last_active ? new Date(stu.last_active).toLocaleDateString("en-NG") : "Never"}</span></td>
                        <td style={{ ...st.td, textAlign: "center" }}>{stu.current_streak > 0 ? <span style={{ color: "#f59e0b", fontWeight: 700 }}>🔥 {stu.current_streak}</span> : <span style={{ color: "#cbd5e1" }}>—</span>}</td>
                        <td style={st.td}><Badge text={stu.is_banned ? "Banned" : "Active"} color={stu.is_banned ? "#ef4444" : "#10b981"} /></td>
                        <td style={st.td}><button style={st.viewBtn} onClick={() => openProfile(stu.id)}>View →</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {students.length === 0 && <Empty text="No students found." />}
              </div>
              {studentTotal > 50 && (
                <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16, alignItems: "center" }}>
                  <button style={st.pageBtn} disabled={studentPage === 1} onClick={() => setStudentPage(p => p - 1)}>← Prev</button>
                  <span style={{ padding: "6px 14px", fontSize: 13, color: "#64748b", background: "#f8fafc", borderRadius: 8 }}>Page {studentPage} of {Math.ceil(studentTotal / 50)}</span>
                  <button style={st.pageBtn} disabled={studentPage >= Math.ceil(studentTotal / 50)} onClick={() => setStudentPage(p => p + 1)}>Next →</button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ══ STUDENT PROFILE ══ */}
        {tab === "profile" && profile && (
          <>
            <button style={st.backBtn} onClick={() => { setProfile(null); setTab("students"); }}>← Back to Students</button>
            <div style={st.twoCol}>
              <div>
                <div style={st.card}>
                  <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
                    <div style={{ width: 58, height: 58, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 900, fontSize: 22, overflow: "hidden", border: "3px solid #e2e8f0", flexShrink: 0 }}>
                      {profile.profile?.avatar_url?.startsWith("http") ? <img src={profile.profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={e => { e.target.style.display = "none"; }} /> : profile.profile?.avatar_url && !profile.profile.avatar_url.startsWith("http") ? <span style={{ fontSize: 32 }}>{profile.profile.avatar_url}</span> : <span>{profile.profile?.full_name?.[0] || "?"}</span>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 18, color: "#1e293b" }}>{profile.profile?.full_name}</div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>{profile.profile?.email}</div>
                      {profile.profile?.phone && <div style={{ fontSize: 12, color: "#94a3b8" }}>📱 {profile.profile.phone}</div>}
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>Joined {new Date(profile.profile?.created_at).toLocaleDateString("en-NG", { dateStyle: "long" })}</div>
                    </div>
                    {profile.profile?.is_premium && <Badge text="👑 Premium" color="#b45309" bg="#fef3c7" />}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, margin: "14px 0" }}>
                    <ProfileStat label="Total Exams"    value={profile.profile?.total_exams || 0}       color="#6366f1" />
                    <ProfileStat label="Avg Score"      value={`${profile.profile?.avg_score || 0}%`}   color="#3b82f6" />
                    <ProfileStat label="Best Score"     value={`${profile.profile?.best_score || 0}%`}  color="#10b981" />
                    <ProfileStat label="Wrong Answers"  value={profile.wrong_count || 0}                color="#ef4444" />
                    <ProfileStat label="Streak"         value={`${profile.profile?.current_streak || 0}d`} color="#f59e0b" />
                    <ProfileStat label="Longest Streak" value={`${profile.profile?.longest_streak || 0}d`} color="#8b5cf6" />
                  </div>
                  {profile.arena && (
                    <div style={{ marginTop: 14, background: "#0f172a", borderRadius: 10, padding: "14px 16px" }}>
                      <div style={{ color: "#818cf8", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>🏟️ Arena Stats</div>
                      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                        {[{ label: "Matches", value: profile.arena.total_matches, color: "#818cf8" }, { label: "Wins", value: profile.arena.wins, color: "#10b981" }, { label: "Win Rate", value: `${profile.arena.win_rate}%`, color: "#f59e0b" }, { label: "XP", value: profile.arena.xp, color: "#6366f1" }, { label: "Rank", value: profile.arena.arena_rank, color: "#ef4444" }].map((item, i) => (
                          <div key={i} style={{ textAlign: "center" }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: item.color }}>{item.value}</div>
                            <div style={{ fontSize: 10, color: "#475569" }}>{item.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                    {profile.profile?.is_banned
                      ? <button style={{ ...st.actionBtn, background: "#10b981" }} onClick={() => unbanStudent(profile.profile.id)}>✓ Unban Student</button>
                      : <button style={{ ...st.actionBtn, background: "#ef4444" }} onClick={() => banStudent(profile.profile.id)}>🚫 Ban Student</button>}
                  </div>
                </div>
                <div style={st.card}>
                  <div style={st.cardTitle}>📊 Subject Performance</div>
                  {(profile.performance || []).map((p, i) => (
                    <div key={i} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                        <span style={{ fontWeight: 600 }}>{p.subject}</span>
                        <div style={{ display: "flex", gap: 10 }}><span style={{ fontSize: 11, color: "#94a3b8" }}>{p.total_correct}/{p.total_attempted}</span><span style={{ fontWeight: 800, color: p.accuracy >= 60 ? "#10b981" : "#ef4444" }}>{p.accuracy}%</span></div>
                      </div>
                      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${p.accuracy}%`, background: p.accuracy >= 70 ? "#10b981" : p.accuracy >= 50 ? "#f59e0b" : "#ef4444", borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                  {!profile.performance?.length && <Empty text="No exams taken yet." />}
                </div>
              </div>
              <div style={st.card}>
                <div style={st.cardTitle}>📋 Recent Exams ({profile.recent_exams?.length || 0})</div>
                <div style={{ maxHeight: 600, overflowY: "auto" }}>
                  {(profile.recent_exams || []).map((e, i) => (
                    <div key={i} style={st.actRow}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{e.subject}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>{e.exam_type} · {e.mode} · {Math.round((e.time_taken_seconds || 0) / 60)} mins</div>
                        {e.institution && <div style={{ fontSize: 10, color: "#94a3b8" }}>{e.institution}</div>}
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>{new Date(e.completed_at).toLocaleDateString("en-NG")}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 900, fontSize: 18, color: parseFloat(e.percentage) >= 70 ? "#10b981" : parseFloat(e.percentage) >= 50 ? "#f59e0b" : "#ef4444" }}>{e.percentage}%</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{e.score}/{e.total_questions}</div>
                      </div>
                    </div>
                  ))}
                  {!profile.recent_exams?.length && <Empty text="No exams yet." />}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ ARENA ══ */}
        {tab === "arena" && (
          <>
            <PageHeader title="Arena Monitor" subtitle="Competitive match stats & leaderboard" tab="arena" />
            <div style={st.twoCol}>
              <div style={st.card}>
                <div style={st.cardTitle}>🏆 Arena Leaderboard — Top 20</div>
                {!arenaStats ? <Empty text="Loading..." /> : (
                  <div style={{ maxHeight: 500, overflowY: "auto" }}>
                    {(Array.isArray(arenaStats) ? arenaStats : []).slice(0, 20).map((p, i) => (
                      <div key={i} style={st.actRow}>
                        <div style={{ width: 30, fontWeight: 800, fontSize: 15, color: i < 3 ? ["#f59e0b","#94a3b8","#b45309"][i] : "#94a3b8", textAlign: "center" }}>{i < 3 ? ["🥇","🥈","🥉"][i] : `#${p.rank}`}</div>
                        <div style={{ flex: 1, marginLeft: 8 }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{p.full_name}</div>
                          <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.wins}W · {p.win_rate}% win rate</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontWeight: 900, color: "#f97316" }}>{p.xp} XP</div>
                          <div style={{ fontSize: 10, color: "#94a3b8" }}>{p.arena_rank}</div>
                        </div>
                      </div>
                    ))}
                    {(!arenaStats || !Array.isArray(arenaStats) || arenaStats.length === 0) && <Empty text="No arena matches yet." />}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={st.card}>
                  <div style={st.cardTitle}>📊 Mode Popularity</div>
                  {s?.arena_mode_stats ? <MiniBar data={s.arena_mode_stats} labelKey="mode" valueKey="total_matches" color="#f97316" height={100} /> : <Empty text="No arena data yet." />}
                </div>
                <div style={st.card}>
                  <div style={st.cardTitle}>⚡ Quick Stats</div>
                  {[{ label: "Total matches", value: s?.arena_total_matches || "—", icon: "⚔️" }, { label: "Active players", value: Array.isArray(arenaStats) ? arenaStats.length : "—", icon: "🎮" }, { label: "Top rank", value: Array.isArray(arenaStats) && arenaStats[0] ? arenaStats[0].arena_rank : "—", icon: "👑" }].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                      <span style={{ fontSize: 13, color: "#64748b" }}>{item.icon} {item.label}</span>
                      <strong style={{ fontSize: 15, color: "#1e293b" }}>{item.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ REVENUE ══ */}
        {tab === "revenue" && (
          <>
            <PageHeader title="Revenue Overview" subtitle="Activation key sales & estimated earnings" tab="revenue"
              action={<button style={{ padding: "8px 16px", background: "#f59e0b", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                onClick={() => revenue && exportCSV(revenue.recent?.map(k => ({ code: k.key_code, plan: k.plan, amount_naira: { hourly: 100, daily: 200, weekly: 700, monthly: 2000, yearly: 15000 }[k.plan] || 0, activated_at: k.used_at ? new Date(k.used_at).toLocaleDateString() : "N/A" })) || [], "revenue.csv")}>↓ Export CSV</button>} />
            {!revenue ? <Skeleton /> : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 14, marginBottom: 22 }}>
                  <StatCard icon="💰" label="Total Revenue"  value={`₦${revenue.total.toLocaleString()}`} sub="All activations"               color="#f59e0b" />
                  <StatCard icon="🔑" label="Keys Sold"      value={revenue.totalKeys}                    sub="Total activations"              color="#8b5cf6" />
                  <StatCard icon="📅" label="Monthly Keys"   value={revenue.byPlan?.monthly || 0}         sub={`₦${((revenue.byPlan?.monthly || 0) * 2000).toLocaleString()}`} color="#3b82f6" />
                  <StatCard icon="📆" label="Yearly Keys"    value={revenue.byPlan?.yearly || 0}          sub={`₦${((revenue.byPlan?.yearly || 0) * 15000).toLocaleString()}`} color="#10b981" />
                  <StatCard icon="🗓️" label="Weekly Keys"   value={revenue.byPlan?.weekly || 0}          sub={`₦${((revenue.byPlan?.weekly || 0) * 700).toLocaleString()}`}  color="#6366f1" />
                  <StatCard icon="⏱️" label="Daily/Hourly"  value={(revenue.byPlan?.daily || 0) + (revenue.byPlan?.hourly || 0)} sub="Short-term"       color="#ef4444" />
                </div>
                <div style={st.twoCol}>
                  <div style={st.card}>
                    <div style={st.cardTitle}>📊 Revenue by Plan</div>
                    {Object.entries({ hourly: 100, daily: 200, weekly: 700, monthly: 2000, yearly: 15000 }).map(([plan, price]) => {
                      const count = revenue.byPlan?.[plan] || 0, earned = count * price;
                      return (
                        <div key={plan} style={{ marginBottom: 14 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                            <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{plan}</span>
                            <div style={{ display: "flex", gap: 12 }}><span style={{ color: "#94a3b8" }}>{count} × ₦{price.toLocaleString()}</span><span style={{ fontWeight: 800, color: "#10b981" }}>₦{earned.toLocaleString()}</span></div>
                          </div>
                          <div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min((earned / (revenue.total || 1)) * 100, 100)}%`, background: "linear-gradient(90deg,#f59e0b,#f97316)", borderRadius: 4 }} />
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
                          <div style={{ ...st.actAvatar, background: "#ecfdf5", color: "#10b981" }}>₦</div>
                          <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>{k.plan} Plan</div><div style={{ fontSize: 11, color: "#94a3b8" }}>{k.key_code?.slice(0, 12)}…</div></div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontWeight: 800, color: "#10b981", fontSize: 14 }}>₦{({ hourly: 100, daily: 200, weekly: 700, monthly: 2000, yearly: 15000 }[k.plan] || 0).toLocaleString()}</div>
                            <div style={{ fontSize: 10, color: "#cbd5e1" }}>{k.used_at ? new Date(k.used_at).toLocaleDateString("en-NG") : "N/A"}</div>
                          </div>
                        </div>
                      )) : <Empty />}
                    </div>
                  </div>
                </div>
                <div style={{ ...st.card, background: "linear-gradient(135deg,#f59e0b,#f97316)", color: "#fff", textAlign: "center" }}>
                  <div style={{ fontSize: 30, marginBottom: 6 }}>🔑</div>
                  <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Generate More Keys</div>
                  <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 14 }}>Create activation keys to sell to students</div>
                  <button style={{ background: "#fff", color: "#f59e0b", border: "none", borderRadius: 10, padding: "10px 24px", fontWeight: 800, cursor: "pointer" }} onClick={() => setTab("keys")}>Go to Keys →</button>
                </div>
              </>
            )}
          </>
        )}

        {/* ══ KEYS ══ */}
        {tab === "keys" && (
          <>
            <PageHeader title="Activation Keys" subtitle={`${keyTotal} total keys in system`} tab="keys" />
            <div style={st.twoCol}>
              <div style={st.card}>
                <div style={st.cardTitle}>➕ Generate New Keys</div>
                <label style={st.label}>Plan</label>
                <select style={{ ...st.sel, width: "100%", boxSizing: "border-box" }} value={keyPlan} onChange={e => setKeyPlan(e.target.value)}>
                  <option value="weekly">Weekly — ₦500 · 7 days</option>
                  <option value="monthly">Monthly — ₦1,500 · 30 days</option>
                  <option value="lifetime">Lifetime — ₦5,000 · Forever</option>
                </select>
                <label style={st.label}>Quantity</label>
                <select style={{ ...st.sel, width: "100%", boxSizing: "border-box" }} value={keyQty} onChange={e => setKeyQty(e.target.value)}>
                  {[1,2,3,5,10,20,50,100].map(n => <option key={n} value={n}>{n} {n === 1 ? "key" : "keys"}</option>)}
                </select>
                <button style={st.genBtn} onClick={generateKeys}>Generate {keyQty} Key{keyQty > 1 ? "s" : ""} →</button>
                {newKeys.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Generated ({newKeys.length}):</div>
                      <button style={st.smBtn} onClick={copyAllKeys}>Copy All</button>
                    </div>
                    <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                      {newKeys.map(k => (
                        <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8, background: "#f8fafc", borderRadius: 8, padding: "8px 12px", border: "1px solid #e2e8f0" }}>
                          <span style={{ flex: 1, fontFamily: "monospace", fontSize: 13, fontWeight: 700, letterSpacing: 2, color: "#334155" }}>{k.key_code}</span>
                          <Badge text={k.plan} color="#8b5cf6" />
                          <button style={st.copyBtn} onClick={() => { navigator.clipboard.writeText(k.key_code); showMsg("Copied!"); }}>Copy</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={st.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div style={st.cardTitle}>All Keys</div>
                  <div style={{ display: "flex", gap: 6 }}><Badge text="Available" color="#10b981" /><Badge text="Used" color="#64748b" /><Badge text="Inactive" color="#ef4444" /></div>
                </div>
                <div style={{ maxHeight: 500, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
                  {keys.map(k => (
                    <div key={k.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", borderRadius: 8, border: `1px solid ${k.unique_ips > 3 ? "#fecaca" : "#e2e8f0"}`, background: k.unique_ips > 3 ? "#fef2f2" : "#fff" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13, letterSpacing: 1 }}>{k.key_code}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{k.plan} · {k.used_by_name ? <span>Used by <strong>{k.used_by_name}</strong></span> : "Unused"}{k.unique_ips > 3 && <span style={{ color: "#ef4444", marginLeft: 6, fontWeight: 700 }}>⚠️ {k.unique_ips} IPs</span>}</div>
                        {k.used_at && <div style={{ fontSize: 10, color: "#cbd5e1" }}>Used {new Date(k.used_at).toLocaleDateString()}</div>}
                      </div>
                      <Badge text={!k.is_active ? "Inactive" : k.used_by_name ? "Used" : "Available"} color={!k.is_active ? "#ef4444" : k.used_by_name ? "#64748b" : "#10b981"} />
                      {k.is_active && !k.used_by_name && <button style={{ padding: "3px 8px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 11 }} onClick={() => deactivateKey(k.key_code)}>Deactivate</button>}
                    </div>
                  ))}
                  {!keys.length && <Empty text="No keys generated yet." />}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ BROADCAST ══ */}
        {tab === "notifications" && (
          <>
            <PageHeader title="Broadcast to Students" subtitle="Send announcements & alerts to all users" tab="notifications" />
            <div style={st.twoCol}>
              <div style={st.card}>
                <div style={st.cardTitle}>📣 New Announcement</div>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>This message will appear as a notification when students next open the app.</p>
                <label style={st.label}>Type</label>
                <select style={{ ...st.sel, width: "100%", boxSizing: "border-box" }} value={broadcast.type} onChange={e => setBroadcast(b => ({ ...b, type: e.target.value }))}>
                  <option value="info">ℹ️ Info / Announcement</option><option value="warning">⚠️ Warning</option><option value="success">🎉 Celebration</option><option value="update">🚀 New Feature</option>
                </select>
                <label style={st.label}>Title</label>
                <input style={{ ...st.sel, width: "100%", boxSizing: "border-box" }} placeholder="e.g. New questions added!" value={broadcast.title} onChange={e => setBroadcast(b => ({ ...b, title: e.target.value }))} />
                <label style={st.label}>Message</label>
                <textarea style={{ ...st.sel, width: "100%", boxSizing: "border-box", minHeight: 100, resize: "vertical", fontFamily: "inherit" }} placeholder="Your message to all students..." value={broadcast.body} onChange={e => setBroadcast(b => ({ ...b, body: e.target.value }))} />
                <button style={{ ...st.genBtn, background: "#14b8a6" }}
                  onClick={() => {
                    if (!broadcast.title || !broadcast.body) return showMsg("Fill in title and message.", "error");
                    adminPost("/broadcast", { title: broadcast.title, message: broadcast.body, type: broadcast.type })
                      .then(() => { showMsg("Broadcast sent! 📣"); setBroadcast({ title: "", body: "", type: "info" }); })
                      .catch(() => showMsg("Failed to send broadcast.", "error"));
                  }}>📣 Send to All Students</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={st.card}>
                  <div style={st.cardTitle}>👁️ Preview</div>
                  <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 6, color: "#1e293b" }}>{{ info: "ℹ️", warning: "⚠️", success: "🎉", update: "🚀" }[broadcast.type]} {broadcast.title || "Your title here"}</div>
                    <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{broadcast.body || "Your message will appear here..."}</div>
                    <div style={{ fontSize: 11, color: "#cbd5e1", marginTop: 8 }}>Just now · CBT App</div>
                  </div>
                </div>
                <div style={st.card}>
                  <div style={st.cardTitle}>⚡ Quick Templates</div>
                  {[{ title: "New JAMB questions added", body: "We just added 500+ new JAMB questions! Start practising now.", type: "update" }, { title: "Maintenance tonight", body: "The app will be briefly unavailable tonight from 12am–1am for updates.", type: "warning" }, { title: "Congratulations top scorers!", body: "Check the leaderboard — this week's top students have been updated!", type: "success" }, { title: "New Arena Season", body: "A new Arena season has started! Your rank has been reset. Climb back to the top!", type: "update" }].map((t, i) => (
                    <div key={i} style={{ ...st.qaBtn, marginBottom: 6, cursor: "pointer" }} onClick={() => setBroadcast(t)}>
                      <span style={{ fontSize: 14 }}>{{ info: "ℹ️", warning: "⚠️", success: "🎉", update: "🚀" }[t.type]}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>{t.title}</span>
                      <span style={{ marginLeft: "auto", color: "#cbd5e1" }}>Use →</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ══ QUESTIONS ══ */}
        {tab === "questions" && (
          <>
            <PageHeader title="Question Bank" subtitle={`${qTotal.toLocaleString()} questions in database`} tab="questions"
              action={<button style={{ padding: "8px 16px", background: "#ec4899", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }} onClick={() => setShowNewQ(!showNewQ)}>{showNewQ ? "✕ Cancel" : "+ Add Question"}</button>} />
            {showNewQ && (
              <div style={{ background: "#fff", borderRadius: 14, padding: 18, marginBottom: 16, border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14 }}>New Question</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <select style={st.sel} value={newQ.exam_type} onChange={e => setNewQ(p => ({ ...p, exam_type: e.target.value }))}><option value="JAMB">JAMB</option><option value="POST-UTME">Post-UTME</option><option value="WAEC">WAEC</option></select>
                  <select style={st.sel} value={newQ.subject} onChange={e => setNewQ(p => ({ ...p, subject: e.target.value }))}>{["Mathematics","English Language","Physics","Chemistry","Biology","Economics","Government","Literature","Geography"].map(s => <option key={s}>{s}</option>)}</select>
                  <select style={st.sel} value={newQ.difficulty} onChange={e => setNewQ(p => ({ ...p, difficulty: e.target.value }))}><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
                  <input style={st.sel} placeholder="Topic" value={newQ.topic} onChange={e => setNewQ(p => ({ ...p, topic: e.target.value }))} />
                  <input style={st.sel} placeholder="Year (e.g. 2023)" value={newQ.year} onChange={e => setNewQ(p => ({ ...p, year: e.target.value }))} />
                </div>
                <textarea style={{ ...st.sel, width: "100%", boxSizing: "border-box", height: 80, resize: "vertical", fontFamily: "inherit" }} placeholder="Question text..." value={newQ.question} onChange={e => setNewQ(p => ({ ...p, question: e.target.value }))} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                  {["a","b","c","d"].map(opt => <input key={opt} style={st.sel} placeholder={`Option ${opt.toUpperCase()}`} value={newQ[`option_${opt}`]} onChange={e => setNewQ(p => ({ ...p, [`option_${opt}`]: e.target.value }))} />)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
                  <select style={st.sel} value={newQ.correct_answer} onChange={e => setNewQ(p => ({ ...p, correct_answer: e.target.value }))}>{["A","B","C","D"].map(o => <option key={o} value={o}>Correct: {o}</option>)}</select>
                  <input style={st.sel} placeholder="Explanation (optional)" value={newQ.explanation} onChange={e => setNewQ(p => ({ ...p, explanation: e.target.value }))} />
                </div>
                <button style={{ width: "100%", padding: 12, background: "#ec4899", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", marginTop: 14 }}
                  onClick={async () => { try { await adminPost("/questions", newQ); showMsg("Question added ✅"); setShowNewQ(false); setNewQ({ exam_type: "JAMB", subject: "Mathematics", topic: "", question: "", option_a: "", option_b: "", option_c: "", option_d: "", correct_answer: "A", explanation: "", difficulty: "medium", year: "" }); adminFetch(`/questions?page=1&exam_type=${qExamType}`).then(r => { setQuestions(r.questions || []); setQTotal(r.total || 0); }); } catch { showMsg("Failed to add question", "error"); } }}>Save Question</button>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", background: "#fff", padding: "12px 14px", borderRadius: 12, border: "1px solid #e2e8f0" }}>
              <select style={st.sel} value={qExamType} onChange={e => { setQExamType(e.target.value); setQPage(1); }}><option value="JAMB">JAMB</option><option value="POST-UTME">Post-UTME</option><option value="WAEC">WAEC</option></select>
              <select style={st.sel} value={qSubject} onChange={e => { setQSubject(e.target.value); setQPage(1); }}><option value="">All Subjects</option>{["Mathematics","English Language","Physics","Chemistry","Biology","Economics","Government"].map(s => <option key={s}>{s}</option>)}</select>
              <input style={{ ...st.searchInput, flex: 1 }} placeholder="Search questions..." value={qSearch} onChange={e => setQSearch(e.target.value)} />
              <button style={{ padding: "9px 16px", background: "#ec4899", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }} onClick={() => adminFetch(`/questions?page=1&exam_type=${qExamType}&subject=${qSubject}&search=${qSearch}`).then(r => { setQuestions(r.questions || []); setQTotal(r.total || 0); setQPage(1); })}>Search</button>
            </div>
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>{["Subject","Topic","Question","Answer","Difficulty","Year",""].map(h => <th key={h} style={st.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={q.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
                      <td style={st.td}><span style={{ background: "#fdf2f8", color: "#ec4899", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{q.subject}</span></td>
                      <td style={st.td}>{q.topic || "—"}</td>
                      <td style={{ ...st.td, maxWidth: 260 }}><div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={q.question}>{q.question}</div></td>
                      <td style={st.td}><span style={{ fontWeight: 800, color: "#10b981", fontSize: 14 }}>{q.correct_answer}</span></td>
                      <td style={st.td}><span style={{ background: q.difficulty==="easy" ? "#ecfdf5" : q.difficulty==="hard" ? "#fef2f2" : "#fffbeb", color: q.difficulty==="easy" ? "#10b981" : q.difficulty==="hard" ? "#ef4444" : "#f59e0b", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{q.difficulty}</span></td>
                      <td style={st.td}>{q.year || "—"}</td>
                      <td style={st.td}><button style={{ padding: "3px 10px", background: "#fef2f2", color: "#ef4444", border: "1px solid #fecaca", borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 700 }} onClick={async () => { if (window.confirm("Delete this question?")) { await adminDelete(`/questions/${q.id}`); setQuestions(prev => prev.filter(x => x.id !== q.id)); setQTotal(p => p - 1); } }}>🗑 Delete</button></td>
                    </tr>
                  ))}
                  {questions.length === 0 && <tr><td colSpan={7} style={{ textAlign: "center", padding: 28, color: "#94a3b8" }}>No questions found</td></tr>}
                </tbody>
              </table>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
              <span style={{ fontSize: 13, color: "#64748b" }}>Page {qPage} · {qTotal.toLocaleString()} total</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={st.pageBtn} disabled={qPage <= 1} onClick={() => setQPage(p => p - 1)}>← Prev</button>
                <button style={st.pageBtn} disabled={questions.length < 50} onClick={() => setQPage(p => p + 1)}>Next →</button>
              </div>
            </div>
          </>
        )}

        {/* ══ SPIN WHEEL ══ */}
        {tab === "spin" && (
          <>
            <PageHeader title="Spin Wheel Stats" subtitle="Rewards distributed via the spin wheel" tab="spin" />
            {spinStats && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 12, marginBottom: 20 }}>
                {[{ label: "Total Spins", value: spinStats.total_spins || 0, color: "#84cc16" }, { label: "Coins Awarded", value: (spinStats.total_coins || 0).toLocaleString(), color: "#f59e0b" }, { label: "Gems Awarded", value: spinStats.total_gems || 0, color: "#06b6d4" }, { label: "XP Awarded", value: (spinStats.total_xp || 0).toLocaleString(), color: "#8b5cf6" }].map((stat, i) => (
                  <div key={i} style={{ background: "#fff", borderRadius: 14, padding: 16, border: `2px solid ${stat.color}22` }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4, fontWeight: 600 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead><tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>{["Student","Reward Type","Amount","Spun At"].map(h => <th key={h} style={st.th}>{h}</th>)}</tr></thead>
                <tbody>
                  {spinHistory.map((s, i) => (
                    <tr key={s.id} style={{ background: i % 2 === 0 ? "#fff" : "#f8fafc", borderTop: "1px solid #f1f5f9" }}>
                      <td style={st.td}>{s.full_name || s.student_id}</td>
                      <td style={st.td}><span style={{ background: s.reward_type==="gems" ? "#ecfeff" : s.reward_type==="xp" ? "#f5f3ff" : "#fffbeb", color: s.reward_type==="gems" ? "#06b6d4" : s.reward_type==="xp" ? "#8b5cf6" : "#f59e0b", borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>{s.reward_type}</span></td>
                      <td style={st.td}><strong>{s.reward_value}</strong></td>
                      <td style={st.td}>{new Date(s.spun_at).toLocaleString("en-NG", { dateStyle: "short", timeStyle: "short" })}</td>
                    </tr>
                  ))}
                  {spinHistory.length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", padding: 28, color: "#94a3b8" }}>No spins yet</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ══ GEMS & VOUCHERS ══ */}
        {tab === "gems" && (
          <>
            <PageHeader title="Gems & Vouchers" subtitle="Generate voucher codes & manage student currencies" tab="gems" />
            <div style={st.twoCol}>
              <div style={st.card}>
                <div style={st.cardTitle}>🎟️ Generate Voucher Code</div>
                <label style={st.label}>Gem Package</label>
                <select style={{ ...st.sel, width: "100%", boxSizing: "border-box" }} value={gemsAction.packageId || "gem_350"} onChange={e => setGemsAction(p => ({ ...p, packageId: e.target.value }))}>
                  <option value="gem_50">Starter Pack — 50 💎 (₦100)</option><option value="gem_120">Scholar Pack — 120 💎 (₦200)</option>
                  <option value="gem_350">Elite Pack — 350 💎 (₦500)</option><option value="gem_800">Champion Pack — 800 💎 (₦1,000)</option>
                  <option value="gem_1800">Legend Pack — 1,800 💎 (₦2,000)</option><option value="gem_5000">Titan Pack — 5,000 💎 (₦5,000)</option>
                  <option value="gem_17000">Metaverse Pack — 17,000 💎 (₦15,000)</option>
                </select>
                <label style={st.label}>Quantity</label>
                <select style={{ ...st.sel, width: "100%", boxSizing: "border-box" }} value={gemsAction.qty || "1"} onChange={e => setGemsAction(p => ({ ...p, qty: e.target.value }))}>{[1,2,3,5,10].map(n => <option key={n} value={n}>{n} code{n > 1 ? "s" : ""}</option>)}</select>
                <label style={st.label}>Note (optional)</label>
                <input style={{ ...st.sel, width: "100%", boxSizing: "border-box" }} placeholder="e.g. John Doe - WhatsApp payment" value={gemsAction.note || ""} onChange={e => setGemsAction(p => ({ ...p, note: e.target.value }))} />
                <button style={{ width: "100%", padding: 14, background: "linear-gradient(135deg,#06b6d4,#8b5cf6)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 800, cursor: "pointer", marginTop: 16, fontSize: 15 }}
                  onClick={async () => {
                    try {
                      const r = await fetch(`${API_URL}/admin/vouchers/generate`, { method: "POST", headers: { Authorization: `Bearer ${localStorage.getItem("admin_token")}`, "Content-Type": "application/json" }, body: JSON.stringify({ package_id: gemsAction.packageId || "gem_350", quantity: parseInt(gemsAction.qty || 1), note: gemsAction.note }) });
                      const data = await r.json();
                      if (data.success) { setGemsAction(p => ({ ...p, generatedVouchers: data.vouchers })); showMsg(`✅ ${data.count} code${data.count > 1 ? "s" : ""} generated!`); } else showMsg(data.error || "Failed", "error");
                    } catch { showMsg("Failed to generate", "error"); }
                  }}>Generate Voucher Code →</button>
                {gemsAction.generatedVouchers?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Generated Codes:</div>
                      <button style={st.smBtn} onClick={() => { navigator.clipboard.writeText(gemsAction.generatedVouchers.map(v => `${v.code} — ${v.gems} Gems (${v.label})`).join("\n")); showMsg("Copied!"); }}>Copy All</button>
                    </div>
                    {gemsAction.generatedVouchers.map((v, i) => (
                      <div key={i} style={{ background: "#f0fdfa", border: "1px solid #6ee7b7", borderRadius: 10, padding: "12px 14px", marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1 }}><div style={{ fontFamily: "monospace", fontWeight: 900, fontSize: 16, letterSpacing: 2, color: "#065f46" }}>{v.code}</div><div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{v.gems} Gems · {v.label} · ₦{v.price?.toLocaleString()}</div></div>
                        <button style={{ padding: "6px 14px", background: "#059669", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13 }} onClick={() => { navigator.clipboard.writeText(v.code); showMsg("Code copied!"); }}>Copy</button>
                      </div>
                    ))}
                    <div style={{ background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#92400e" }}>💡 Send code to student on WhatsApp. They enter it in Gem Store → "Have a Voucher Code?"</div>
                  </div>
                )}
              </div>
              <div style={st.card}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}><div style={st.cardTitle}>All Vouchers</div><div style={{ display: "flex", gap: 6 }}><Badge text="Available" color="#10b981" /><Badge text="Used" color="#64748b" /></div></div>
                <VoucherStats API_URL={API_URL} token={localStorage.getItem("admin_token")} />
              </div>
            </div>
            <div style={st.card}>
              <div style={st.cardTitle}>⚡ Manual Currency Override</div>
              <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>Emergency use only. Always use vouchers for normal payments.</p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input style={{ ...st.searchInput, flex: 1 }} placeholder="Student ID or email" value={gemsAction.studentId || ""} onChange={e => setGemsAction(p => ({ ...p, studentId: e.target.value }))} />
                <select style={st.sel} value={gemsAction.action || "add"} onChange={e => setGemsAction(p => ({ ...p, action: e.target.value }))}><option value="add">Add Gems</option><option value="add_coins">Add Coins</option><option value="add_xp">Add XP</option></select>
                <input style={{ ...st.sel, width: 100 }} type="number" placeholder="Amount" value={gemsAction.amount || ""} onChange={e => setGemsAction(p => ({ ...p, amount: e.target.value }))} />
                <button style={{ padding: "9px 16px", background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
                  onClick={async () => {
                    if (!gemsAction.studentId || !gemsAction.amount) { showMsg("Fill all fields", "error"); return; }
                    try { await adminPost("/manage-currency", gemsAction); showMsg(`✅ Done! ${gemsAction.action} ${gemsAction.amount}`); setGemsAction({ studentId: "", amount: "", action: "add" }); }
                    catch { showMsg("Failed. Check student ID.", "error"); }
                  }}>Apply</button>
              </div>
            </div>
          </>
        )}

        {/* ══ REPORTS ══ */}
        {tab === "reports" && (
          <>
            <PageHeader title="Reports & Exports" subtitle="Download platform data as CSV files" tab="reports" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16, marginBottom: 20 }}>
              {[
                { title: "Student Report",      desc: "All student accounts with scores, status & activity",          icon: "👥", color: "#10b981", fn: () => exportCSV(students.map(stu => ({ id: stu.id, name: stu.full_name, email: stu.email, exams: stu.total_exams || 0, avg_score: stu.avg_score || 0, premium: stu.is_premium ? "Yes" : "No", status: stu.is_banned ? "Banned" : "Active" })), "students_report.csv") },
                { title: "Revenue Report",      desc: "Activation key sales & revenue breakdown by plan",            icon: "💰", color: "#f59e0b", fn: () => { if (!revenue) return showMsg("Load Revenue tab first.", "error"); exportCSV(revenue.recent?.map(k => ({ code: k.key_code, plan: k.plan, amount_naira: { hourly: 100, daily: 200, weekly: 700, monthly: 2000, yearly: 15000 }[k.plan] || 0 })) || [], "revenue_report.csv"); } },
                { title: "Question Bank",       desc: "All questions filtered by current exam type & subject",       icon: "❓", color: "#ec4899", fn: () => exportCSV(questions.map(q => ({ id: q.id, exam_type: q.exam_type, subject: q.subject, topic: q.topic || "", correct_answer: q.correct_answer, difficulty: q.difficulty, year: q.year || "" })), "questions_report.csv") },
                { title: "Spin Wheel Report",   desc: "All spin wheel rewards distributed to students",              icon: "🎰", color: "#84cc16", fn: () => exportCSV(spinHistory.map(s => ({ student: s.full_name || s.student_id, reward_type: s.reward_type, reward_value: s.reward_value, date: new Date(s.spun_at).toLocaleDateString() })), "spin_report.csv") },
              ].map((r, i) => (
                <div key={i} style={{ background: "#fff", borderRadius: 16, padding: "22px 20px", border: "1px solid #e2e8f0", borderTop: `3px solid ${r.color}` }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: r.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 12 }}>{r.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#1e293b", marginBottom: 6 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, marginBottom: 16 }}>{r.desc}</div>
                  <button style={{ width: "100%", padding: "10px 0", background: r.color, color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }} onClick={r.fn}>↓ Download CSV</button>
                </div>
              ))}
            </div>
            <div style={st.card}>
              <div style={st.cardTitle}>📊 Platform Summary</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
                {[{ label: "Total Students", value: s?.students?.total || "—", icon: "👥" }, { label: "Total Exams", value: s?.exams?.total || "—", icon: "📝" }, { label: "Premium Accounts", value: s?.students?.premium || "—", icon: "👑" }, { label: "Questions in DB", value: qTotal.toLocaleString() || "—", icon: "❓" }, { label: "Keys Activated", value: s?.keys?.used || "—", icon: "🔑" }, { label: "Avg Score", value: `${s?.exams?.avg_score || 0}%`, icon: "📈" }].map((item, i) => (
                  <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "12px 14px", textAlign: "center", border: "1px solid #e2e8f0" }}>
                    <div style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: "#1e293b" }}>{item.value}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ══ SETTINGS ══ */}
        {tab === "settings" && (
          <>
            <PageHeader title="Settings" subtitle="Platform configuration & admin preferences" tab="settings" />
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {[{ id: "general", label: "⚙️ General" }, { id: "permissions", label: "🔐 Permissions" }, { id: "platform", label: "🌐 Platform" }].map(st2 => (
                <button key={st2.id} onClick={() => setSettingsTab(st2.id)}
                  style={{ padding: "8px 18px", border: "none", borderRadius: 20, cursor: "pointer", fontSize: 13, fontWeight: 700, background: settingsTab === st2.id ? "#64748b" : "#f1f5f9", color: settingsTab === st2.id ? "#fff" : "#64748b" }}>
                  {st2.label}
                </button>
              ))}
            </div>
            {settingsTab === "general" && (
              <div style={st.twoCol}>
                <div style={st.card}>
                  <div style={st.cardTitle}>🏫 Platform Info</div>
                  {[{ label: "App Name", value: "CBT Platform" }, { label: "API Endpoint", value: API_URL }, { label: "Environment", value: process.env.NODE_ENV || "production" }, { label: "Admin Session", value: token ? "Active ✅" : "Expired ❌" }].map((item, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
                      <span style={{ color: "#94a3b8", fontWeight: 600 }}>{item.label}</span>
                      <span style={{ color: "#334155", fontFamily: item.label === "API Endpoint" ? "monospace" : "inherit", fontSize: item.label === "API Endpoint" ? 11 : 13 }}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div style={st.card}>
                  <div style={st.cardTitle}>🔐 Session</div>
                  <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>You are currently logged in as an admin. Your session is stored locally and will persist until you log out.</p>
                  <button style={{ width: "100%", padding: 12, background: "#ef4444", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }} onClick={logout}>🚪 Logout & End Session</button>
                </div>
              </div>
            )}
            {settingsTab === "permissions" && (
              <div style={st.card}>
                <div style={st.cardTitle}>🔐 Admin Permissions</div>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.6 }}>As an admin, you have full access to all platform features.</p>
                {["View all students","Ban / unban students","Generate activation keys","Broadcast notifications","Manage question bank","View revenue data","Manage gems & vouchers","Export CSV reports"].map((perm, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 13, color: "#334155" }}>{perm}</span>
                    <Badge text="✓ Granted" color="#10b981" />
                  </div>
                ))}
              </div>
            )}
            {settingsTab === "platform" && (
              <div style={st.card}>
                <div style={st.cardTitle}>🌐 Platform Stats</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[{ label: "Total Users", value: s?.students?.total || "—", color: "#3b82f6" }, { label: "Premium Users", value: s?.students?.premium || "—", color: "#f59e0b" }, { label: "Banned Users", value: s?.banned_students || 0, color: "#ef4444" }, { label: "Total Exams", value: s?.exams?.total || "—", color: "#10b981" }, { label: "Active Keys", value: s?.keys?.available || "—", color: "#8b5cf6" }, { label: "Keys Used", value: s?.keys?.used || "—", color: "#6366f1" }].map((item, i) => (
                    <div key={i} style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 22, fontWeight: 900, color: item.color }}>{item.value}</div>
                      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
