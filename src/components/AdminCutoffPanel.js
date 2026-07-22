import { useState, useEffect, useCallback } from "react";

/**
 * CutoffAdminPanel — add/edit/remove JAMB cutoff mark entries.
 * Mounted as a tab in AdminDashboard.js. Uses its own fetch helpers
 * (not adminFetch/adminPost/adminDelete from the parent file) because
 * those hardcode an "/admin" URL prefix — cutoff routes live at
 * /api/cutoffs, not /api/admin/cutoffs, since students also read from
 * them. Same admin_token and 401/403 handling either way.
 */
function handleAuthError() {
  localStorage.removeItem("admin_token");
  window.location.href = "/admin/login?reason=expired";
}

async function cutoffFetch(apiBase, token, path, opts = {}) {
  const r = await fetch(`${apiBase}/cutoffs${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      ...(opts.headers || {}),
    },
  });
  if (r.status === 401 || r.status === 403) { handleAuthError(); throw new Error("Session expired"); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
}

const CATEGORIES = ["university", "polytechnic", "college_of_education", "college_of_nursing"];

const SCORE_TYPES = [
  { value: "utme_raw400", label: "Raw UTME (0-400)",       max: 400 },
  { value: "aggregate400", label: "Aggregate (0-400)",     max: 400 },
  { value: "aggregate100", label: "Aggregate (0-100)",     max: 100 },
];

const scoreTypeMax   = (type) => SCORE_TYPES.find(t => t.value === (type || "utme_raw400"))?.max || 400;
const scoreTypeLabel = (type) => SCORE_TYPES.find(t => t.value === (type || "utme_raw400"))?.label.split(" (")[0] || "Raw UTME";

const emptyForm = {
  institution_name: "", category: "university", course_name: "",
  cutoff_mark: "", score_type: "utme_raw400", academic_session: "2026/2027",
  source_url: "", source_note: "", verified_at: new Date().toISOString().slice(0, 10),
};

export default function CutoffAdminPanel({ apiBase, adminToken }) {
  const [cutoffs, setCutoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg]         = useState(null); // { text, type }
  const [form, setForm]       = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving]   = useState(false);

  const showMsg = (text, type = "success") => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 4000);
  };

  const load = useCallback(() => {
    setLoading(true);
    cutoffFetch(apiBase, adminToken, "")
      .then(d => setCutoffs(d.cutoffs || []))
      .catch(e => showMsg(e.message, "error"))
      .finally(() => setLoading(false));
  }, [apiBase, adminToken]);

  useEffect(() => { load(); }, [load]);

  const startEdit = (c) => {
    setEditingId(c.id);
    setForm({
      institution_name: c.institution_name,
      category: c.category,
      course_name: c.course_name || "",
      cutoff_mark: String(c.cutoff_mark),
      score_type: c.score_type || "utme_raw400",
      academic_session: c.academic_session,
      source_url: c.source_url || "",
      source_note: c.source_note || "",
      verified_at: c.verified_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    });
  };

  const cancelEdit = () => { setEditingId(null); setForm(emptyForm); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.institution_name || !form.cutoff_mark || !form.academic_session || !form.verified_at) {
      return showMsg("Institution, cutoff mark, session, and verified date are required.", "error");
    }
    setSaving(true);
    try {
      const payload = { ...form, cutoff_mark: parseFloat(form.cutoff_mark), course_name: form.course_name || null };
      if (editingId) {
        await cutoffFetch(apiBase, adminToken, `/${editingId}`, { method: "PATCH", body: JSON.stringify(payload) });
        showMsg("Updated.");
      } else {
        await cutoffFetch(apiBase, adminToken, "", { method: "POST", body: JSON.stringify(payload) });
        showMsg("Added.");
      }
      cancelEdit();
      load();
    } catch (err) {
      showMsg(err.message, "error");
    }
    setSaving(false);
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Delete the cutoff entry for "${name}"?`)) return;
    try {
      await cutoffFetch(apiBase, adminToken, `/${id}`, { method: "DELETE" });
      showMsg("Deleted.");
      load();
    } catch (err) {
      showMsg(err.message, "error");
    }
  };

  return (
    <div style={s.wrap}>
      <h3 style={s.h3}>🎯 JAMB Cutoff Marks</h3>
      <p style={s.hint}>
        Only add figures you can point to a real source for — this list is directly shown to students
        deciding where to apply. Leave course blank for an institution's general minimum.
      </p>

      {msg && <div style={{ ...s.msg, ...(msg.type === "error" ? s.msgErr : s.msgOk) }}>{msg.text}</div>}

      {/* FORM */}
      <form onSubmit={submit} style={s.form}>
        <div style={s.row}>
          <input style={s.input} placeholder="Institution name" value={form.institution_name}
            onChange={e => setForm(f => ({ ...f, institution_name: e.target.value }))} />
          <select style={s.input} value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
          </select>
        </div>
        <div style={s.row}>
          <input style={s.input} placeholder="Course (blank = general minimum)" value={form.course_name}
            onChange={e => setForm(f => ({ ...f, course_name: e.target.value }))} />
          <select style={s.input} value={form.score_type}
            onChange={e => setForm(f => ({ ...f, score_type: e.target.value }))}>
            {SCORE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div style={s.row}>
          <input style={s.input} type="number" step="0.001" min="0"
            max={SCORE_TYPES.find(t => t.value === form.score_type)?.max || 400}
            placeholder={`Cutoff mark (0-${SCORE_TYPES.find(t => t.value === form.score_type)?.max || 400})`}
            value={form.cutoff_mark}
            onChange={e => setForm(f => ({ ...f, cutoff_mark: e.target.value }))} />
        </div>
        <div style={s.row}>
          <input style={s.input} placeholder="Academic session e.g. 2026/2027" value={form.academic_session}
            onChange={e => setForm(f => ({ ...f, academic_session: e.target.value }))} />
          <input style={s.input} type="date" value={form.verified_at}
            onChange={e => setForm(f => ({ ...f, verified_at: e.target.value }))} />
        </div>
        <input style={{ ...s.input, width: "100%" }} placeholder="Source URL (optional)" value={form.source_url}
          onChange={e => setForm(f => ({ ...f, source_url: e.target.value }))} />
        <textarea style={{ ...s.input, width: "100%", minHeight: 50 }} placeholder="Source note — where this figure came from"
          value={form.source_note} onChange={e => setForm(f => ({ ...f, source_note: e.target.value }))} />
        <div style={s.row}>
          <button type="submit" disabled={saving} style={s.btnPrimary}>
            {saving ? "Saving..." : editingId ? "Update entry" : "Add entry"}
          </button>
          {editingId && <button type="button" onClick={cancelEdit} style={s.btnSecondary}>Cancel</button>}
        </div>
      </form>

      {/* LIST */}
      {loading ? <p style={s.hint}>Loading...</p> : (
        <div style={{ marginTop: 20 }}>
          {cutoffs.map(c => (
            <div key={c.id} style={s.card}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{c.institution_name} <span style={{ fontWeight: 400, opacity: 0.7 }}>({c.category.replace(/_/g," ")})</span></div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>
                  {c.course_name || "General minimum"} · {c.cutoff_mark}/{scoreTypeMax(c.score_type)} ({scoreTypeLabel(c.score_type)}) · {c.academic_session}
                </div>
                {c.source_note && <div style={{ fontSize: 11, opacity: 0.6, marginTop: 4 }}>{c.source_note}</div>}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => startEdit(c)} style={s.btnTiny}>Edit</button>
                <button onClick={() => remove(c.id, c.institution_name)} style={{ ...s.btnTiny, color: "#e17055" }}>Delete</button>
              </div>
            </div>
          ))}
          {!cutoffs.length && <p style={s.hint}>No entries yet.</p>}
        </div>
      )}
    </div>
  );
}

const s = {
  wrap:    { color: "#fff", fontFamily: "'Plus Jakarta Sans',sans-serif" },
  h3:      { fontSize: 18, fontWeight: 800, marginBottom: 6 },
  hint:    { fontSize: 12.5, opacity: 0.7, marginBottom: 14, lineHeight: 1.5 },
  msg:     { padding: "8px 14px", borderRadius: 8, fontSize: 13, marginBottom: 12 },
  msgOk:   { background: "rgba(0,184,148,0.15)", color: "#00b894" },
  msgErr:  { background: "rgba(225,112,85,0.15)", color: "#e17055" },
  form:    { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 },
  row:     { display: "flex", gap: 10 },
  input:   { flex: 1, padding: "9px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.2)", color: "#fff", fontSize: 13 },
  btnPrimary:   { padding: "9px 20px", borderRadius: 8, border: "none", background: "#6c63ff", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 13 },
  btnSecondary: { padding: "9px 20px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 13 },
  btnTiny: { padding: "5px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 11 },
  card:    { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
};
