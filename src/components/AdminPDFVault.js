/**
 * AdminPDFVault.js
 *
 * Drop-in section for AdminDashboard.js.
 * Shows: stats bar, category sidebar, PDF list table, upload modal.
 *
 * Usage inside AdminDashboard.js:
 *   import AdminPDFVault from "../../components/AdminPDFVault";
 *   // then in your tab/section render:
 *   {activeSection === "pdf_vault" && <AdminPDFVault adminToken={token} apiBase={API_BASE} />}
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

const CATEGORY_META = {
  assignments: { label: "Assignments",  emoji: "📋", color: "#6C63FF" },
  results:     { label: "Results",      emoji: "📊", color: "#10B981" },
  notes:       { label: "Notes",        emoji: "📝", color: "#F59E0B" },
  predictions: { label: "Predictions",  emoji: "🔮", color: "#8B5CF6" },
  formulas:    { label: "Formulas",     emoji: "⚗️",  color: "#EF4444" },
  general:     { label: "General",      emoji: "📁", color: "#6B7280" },
};

function humanSize(bytes) {
  if (!bytes) return "—";
  const u = ["B","KB","MB","GB"];
  let i = 0, s = bytes;
  while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; }
  return `${s.toFixed(1)} ${u[i]}`;
}

// ── Sub-components ────────────────────────────────────────

function StatCard({ emoji, label, value, color }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
      border: `1px solid ${color}40`,
      borderRadius: 12,
      padding: "16px 20px",
      display: "flex",
      alignItems: "center",
      gap: 14,
      flex: "1 1 160px",
      minWidth: 140,
    }}>
      <span style={{ fontSize: 28 }}>{emoji}</span>
      <div>
        <div style={{ color: "#aaa", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
        <div style={{ color, fontSize: 22, fontWeight: 700 }}>{value}</div>
      </div>
    </div>
  );
}

function UploadModal({ onClose, onUploaded, apiBase, token }) {
  const [form, setForm]       = useState({
    title: "", category: "general", subject: "", description: "",
    tags: "", vault_item_id: "", student_id: "", pages: "",
  });
  const [file, setFile]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const fileRef               = useRef();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setError("Please select a PDF file.");
    if (!form.title.trim()) return setError("Title is required.");

    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.append("pdf", file);
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });

    try {
      const res = await fetch(`${apiBase}/admin/pdfs/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      onUploaded(data.pdf);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", background: "#0d1117", border: "1px solid #333",
    borderRadius: 8, padding: "9px 12px", color: "#fff", fontSize: 14,
    outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { color: "#aaa", fontSize: 12, marginBottom: 4, display: "block" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: 16,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: "#111827", borderRadius: 16, padding: 28,
        width: "100%", maxWidth: 540,
        border: "1px solid #6C63FF40",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
          <h2 style={{ margin: 0, color: "#fff", fontSize: 18 }}>📤 Upload PDF to Folder Bank</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#aaa", fontSize: 22, cursor: "pointer" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* File picker */}
          <div style={{
            border: "2px dashed #6C63FF60", borderRadius: 10, padding: 20,
            textAlign: "center", marginBottom: 18, cursor: "pointer",
            background: file ? "#6C63FF10" : "transparent",
          }} onClick={() => fileRef.current.click()}>
            <input
              ref={fileRef} type="file" accept="application/pdf" style={{ display: "none" }}
              onChange={e => {
                const f = e.target.files[0];
                setFile(f);
                if (!form.title) set("title", f.name.replace(/\.pdf$/i, "").replace(/_/g, " "));
              }}
            />
            {file ? (
              <>
                <div style={{ fontSize: 32, marginBottom: 6 }}>📄</div>
                <div style={{ color: "#10B981", fontWeight: 600 }}>{file.name}</div>
                <div style={{ color: "#aaa", fontSize: 12 }}>{humanSize(file.size)}</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 8 }}>📤</div>
                <div style={{ color: "#6C63FF", fontWeight: 600 }}>Click to select PDF</div>
                <div style={{ color: "#666", fontSize: 12 }}>Max 50 MB</div>
              </>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Title *</label>
              <input style={inputStyle} value={form.title}
                onChange={e => set("title", e.target.value)} placeholder="e.g. Physics Formula Sheet" required />
            </div>

            <div>
              <label style={labelStyle}>Category *</label>
              <select style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)}>
                {Object.entries(CATEGORY_META).map(([k, v]) => (
                  <option key={k} value={k}>{v.emoji} {v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Subject</label>
              <input style={inputStyle} value={form.subject}
                onChange={e => set("subject", e.target.value)} placeholder="e.g. Physics" />
            </div>

            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Description</label>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 60 }}
                value={form.description} onChange={e => set("description", e.target.value)}
                placeholder="Brief description of this PDF..." />
            </div>

            <div>
              <label style={labelStyle}>Pages</label>
              <input style={inputStyle} type="number" min="1" value={form.pages}
                onChange={e => set("pages", e.target.value)} placeholder="e.g. 12" />
            </div>

            <div>
              <label style={labelStyle}>Tags (comma-separated)</label>
              <input style={inputStyle} value={form.tags}
                onChange={e => set("tags", e.target.value)} placeholder="JAMB, Physics, 2025" />
            </div>
          </div>

          {/* Access Control */}
          <div style={{
            background: "#0d1117", borderRadius: 10, padding: 14, marginBottom: 14,
            border: "1px solid #333",
          }}>
            <div style={{ color: "#fff", fontWeight: 600, marginBottom: 10, fontSize: 13 }}>
              🔐 Access Control <span style={{ color: "#666", fontWeight: 400 }}>(optional — leave blank for free access)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Vault Item ID</label>
                <input style={inputStyle} value={form.vault_item_id}
                  onChange={e => set("vault_item_id", e.target.value)}
                  placeholder="e.g. formula_sheet_physics" />
                <div style={{ color: "#555", fontSize: 11, marginTop: 3 }}>Must own this vault item</div>
              </div>
              <div>
                <label style={labelStyle}>Student ID</label>
                <input style={inputStyle} type="number" value={form.student_id}
                  onChange={e => set("student_id", e.target.value)} placeholder="e.g. 42" />
                <div style={{ color: "#555", fontSize: 11, marginTop: 3 }}>Only this student</div>
              </div>
            </div>
          </div>

          {error && (
            <div style={{
              background: "#EF444420", border: "1px solid #EF444460", borderRadius: 8,
              padding: "10px 14px", color: "#EF4444", marginBottom: 14, fontSize: 13,
            }}>{error}</div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={{
              padding: "10px 20px", borderRadius: 8, background: "#1f2937",
              border: "1px solid #374151", color: "#aaa", cursor: "pointer", fontSize: 14,
            }}>Cancel</button>
            <button type="submit" disabled={loading} style={{
              padding: "10px 24px", borderRadius: 8,
              background: loading ? "#4B5563" : "linear-gradient(135deg, #6C63FF, #8B5CF6)",
              border: "none", color: "#fff", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
              fontSize: 14,
            }}>
              {loading ? "⏳ Uploading..." : "📤 Upload PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────
export default function AdminPDFVault({ adminToken, apiBase = "/api" }) {
  const [stats,       setStats]       = useState(null);
  const [pdfs,        setPdfs]        = useState([]);
  const [pagination,  setPagination]  = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading,     setLoading]     = useState(false);
  const [showUpload,  setShowUpload]  = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search,      setSearch]      = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const debounceRef = useRef();
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(val), 400);
  };

  const headers = { Authorization: `Bearer ${adminToken}` };

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch(`${apiBase}/admin/pdfs/stats`, { headers });
      const data = await res.json();
      if (res.ok) setStats(data);
    } catch {}
  }, [apiBase, adminToken]);

  const fetchPdfs = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 15 });
      if (activeCategory !== "all") params.set("category", activeCategory);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res  = await fetch(`${apiBase}/admin/pdfs?${params}`, { headers });
      const data = await res.json();
      if (res.ok) {
        setPdfs(data.pdfs || []);
        setPagination(data.pagination || { total: 0, page: 1, totalPages: 1 });
      }
    } catch {}
    setLoading(false);
  }, [apiBase, adminToken, activeCategory, debouncedSearch]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { fetchPdfs(1); }, [fetchPdfs]);

  async function handleDelete(id, title) {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${apiBase}/admin/pdfs/${id}`, { method: "DELETE", headers });
      if (res.ok) {
        setPdfs(prev => prev.filter(p => p.id !== id));
        fetchStats();
      }
    } catch {}
  }

  function handleUploaded(newPdf) {
    setShowUpload(false);
    setPdfs(prev => [newPdf, ...prev]);
    fetchStats();
  }

  const s = {
    container: {
      background: "#0a0f1e",
      minHeight: "100%",
      fontFamily: "'Inter', sans-serif",
      color: "#fff",
      padding: "0 0 40px",
    },
    header: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginBottom: 24, flexWrap: "wrap", gap: 12,
    },
    uploadBtn: {
      background: "linear-gradient(135deg, #6C63FF, #8B5CF6)",
      border: "none", borderRadius: 10, padding: "11px 22px",
      color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
      display: "flex", alignItems: "center", gap: 8,
    },
    statsRow: {
      display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 24,
    },
    layout: {
      display: "flex", gap: 18, alignItems: "flex-start",
    },
    sidebar: {
      width: 170, flexShrink: 0,
      background: "#111827", borderRadius: 12, padding: 14,
      border: "1px solid #1f2937",
    },
    catBtn: (active, color) => ({
      display: "flex", alignItems: "center", gap: 8,
      padding: "9px 10px", borderRadius: 8, border: "none",
      background: active ? `${color}25` : "transparent",
      color: active ? color : "#9CA3AF",
      cursor: "pointer", fontSize: 13, width: "100%", textAlign: "left",
      fontWeight: active ? 700 : 400, marginBottom: 2,
      borderLeft: active ? `3px solid ${color}` : "3px solid transparent",
    }),
    main: { flex: 1, minWidth: 0 },
    searchRow: {
      display: "flex", gap: 10, marginBottom: 14, alignItems: "center",
    },
    searchInput: {
      flex: 1, background: "#111827", border: "1px solid #374151",
      borderRadius: 9, padding: "9px 14px", color: "#fff", fontSize: 14,
      outline: "none",
    },
    table: {
      width: "100%", borderCollapse: "collapse", fontSize: 13,
    },
    th: {
      textAlign: "left", padding: "10px 12px", color: "#6B7280",
      fontSize: 11, textTransform: "uppercase", letterSpacing: 0.8,
      borderBottom: "1px solid #1f2937",
    },
    td: {
      padding: "11px 12px", borderBottom: "1px solid #111827",
      verticalAlign: "middle",
    },
    catBadge: (color) => ({
      display: "inline-flex", alignItems: "center", gap: 4,
      background: `${color}20`, color, borderRadius: 6,
      padding: "2px 8px", fontSize: 11, fontWeight: 600,
    }),
    deleteBtn: {
      background: "#EF444415", border: "1px solid #EF444440",
      color: "#EF4444", borderRadius: 6, padding: "5px 10px",
      cursor: "pointer", fontSize: 12,
    },
    emptyState: {
      textAlign: "center", padding: "50px 20px",
      color: "#4B5563",
    },
    pagination: {
      display: "flex", justifyContent: "space-between", alignItems: "center",
      marginTop: 14, color: "#6B7280", fontSize: 13,
    },
    pageBtn: (active) => ({
      background: active ? "#6C63FF" : "#1f2937",
      border: "none", color: active ? "#fff" : "#9CA3AF",
      borderRadius: 6, padding: "5px 11px", cursor: "pointer", fontSize: 13,
    }),
  };

  return (
    <div style={s.container}>
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onUploaded={handleUploaded}
          apiBase={apiBase}
          token={adminToken}
        />
      )}

      {/* Header */}
      <div style={s.header}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
            🗂️ PDF Folder Bank
          </h2>
          <div style={{ color: "#6B7280", fontSize: 13, marginTop: 3 }}>
            Centralised storage for all student PDFs
          </div>
        </div>
        <button style={s.uploadBtn} onClick={() => setShowUpload(true)}>
          <span style={{ fontSize: 16 }}>📤</span> Upload PDF
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={s.statsRow}>
          <StatCard emoji="📄" label="Total Files"     value={stats.total_files}     color="#6C63FF" />
          <StatCard emoji="💾" label="Storage Used"    value={stats.total_size}      color="#10B981" />
          <StatCard emoji="⬇️"  label="Total Downloads" value={stats.total_downloads} color="#F59E0B" />
        </div>
      )}

      {/* Layout */}
      <div style={s.layout}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={{ color: "#6B7280", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
            Categories
          </div>
          <button
            style={s.catBtn(activeCategory === "all", "#6C63FF")}
            onClick={() => setActiveCategory("all")}
          >
            <span>🗂️</span> All Files
          </button>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const count = stats?.by_category?.find(c => c.category === key)?.file_count;
            return (
              <button
                key={key}
                style={s.catBtn(activeCategory === key, meta.color)}
                onClick={() => setActiveCategory(key)}
              >
                <span>{meta.emoji}</span>
                <span style={{ flex: 1 }}>{meta.label}</span>
                {count ? <span style={{ fontSize: 10, opacity: 0.7 }}>{count}</span> : null}
              </button>
            );
          })}
        </div>

        {/* Main */}
        <div style={s.main}>
          {/* Search */}
          <div style={s.searchRow}>
            <input
              style={s.searchInput}
              placeholder="🔍  Search by title or description..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
            <div style={{ color: "#6B7280", fontSize: 13, whiteSpace: "nowrap" }}>
              {pagination.total} file{pagination.total !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: "#111827", borderRadius: 12, border: "1px solid #1f2937", overflow: "hidden" }}>
            {loading ? (
              <div style={s.emptyState}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                Loading files...
              </div>
            ) : pdfs.length === 0 ? (
              <div style={s.emptyState}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
                <div style={{ fontSize: 16, color: "#6B7280", marginBottom: 8 }}>No PDFs yet</div>
                <button style={{ ...s.uploadBtn, margin: "0 auto" }} onClick={() => setShowUpload(true)}>
                  📤 Upload First PDF
                </button>
              </div>
            ) : (
              <table style={s.table}>
                <thead>
                  <tr>
                    <th style={s.th}>File</th>
                    <th style={s.th}>Category</th>
                    <th style={s.th}>Subject</th>
                    <th style={s.th}>Size</th>
                    <th style={s.th}>Access</th>
                    <th style={s.th}>Downloads</th>
                    <th style={s.th}>Uploaded</th>
                    <th style={s.th}></th>
                  </tr>
                </thead>
                <tbody>
                  {pdfs.map(pdf => {
                    const meta = CATEGORY_META[pdf.category] || CATEGORY_META.general;
                    return (
                      <tr key={pdf.id} style={{ transition: "background 0.15s" }}
                        onMouseEnter={e => e.currentTarget.style.background = "#1a2236"}
                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      >
                        <td style={s.td}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 20 }}>📄</span>
                            <div>
                              <div style={{ fontWeight: 600, color: "#E5E7EB", fontSize: 13 }}>{pdf.title}</div>
                              <div style={{ color: "#6B7280", fontSize: 11 }}>{pdf.file_name}</div>
                            </div>
                          </div>
                        </td>
                        <td style={s.td}>
                          <span style={s.catBadge(meta.color)}>
                            {meta.emoji} {meta.label}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{ color: "#9CA3AF" }}>{pdf.subject || "—"}</span>
                        </td>
                        <td style={s.td}>
                          <span style={{ color: "#9CA3AF", fontFamily: "monospace" }}>
                            {humanSize(pdf.file_size_bytes)}
                          </span>
                        </td>
                        <td style={s.td}>
                          {pdf.student_id ? (
                            <span style={s.catBadge("#F59E0B")}>👤 Student #{pdf.student_id}</span>
                          ) : pdf.vault_item_id ? (
                            <span style={s.catBadge("#8B5CF6")}>🔐 Vault</span>
                          ) : (
                            <span style={s.catBadge("#10B981")}>🌐 Free</span>
                          )}
                        </td>
                        <td style={s.td}>
                          <span style={{ color: "#F59E0B", fontWeight: 600 }}>
                            {pdf.download_count || 0}
                          </span>
                        </td>
                        <td style={s.td}>
                          <span style={{ color: "#6B7280", fontSize: 11 }}>
                            {new Date(pdf.created_at).toLocaleDateString("en-GB", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </span>
                        </td>
                        <td style={s.td}>
                          <button
                            style={s.deleteBtn}
                            onClick={() => handleDelete(pdf.id, pdf.title)}
                          >
                            🗑️ Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div style={s.pagination}>
              <span>
                Showing {pdfs.length} of {pagination.total} files
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} style={s.pageBtn(p === pagination.page)} onClick={() => fetchPdfs(p)}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
