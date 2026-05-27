/**
 * AdminPDFVault.js — Clean horizontal-tab layout
 * Drop into: cbt-frontend/src/components/AdminPDFVault.js
 */

import React, { useState, useEffect, useRef, useCallback } from "react";

const CATEGORIES = [
  { key: "all",         label: "All Files",    color: "#6C63FF" },
  { key: "assignments", label: "Assignments",  color: "#6C63FF" },
  { key: "results",     label: "Results",      color: "#10B981" },
  { key: "notes",       label: "Notes",        color: "#F59E0B" },
  { key: "predictions", label: "Predictions",  color: "#8B5CF6" },
  { key: "formulas",    label: "Formulas",     color: "#EF4444" },
  { key: "general",     label: "General",      color: "#6B7280" },
];

function humanSize(bytes) {
  if (!bytes) return "—";
  const u = ["B","KB","MB","GB"];
  let i = 0, s = bytes;
  while (s >= 1024 && i < u.length - 1) { s /= 1024; i++; }
  return `${s.toFixed(1)} ${u[i]}`;
}

// ── Upload Modal ─────────────────────────────────────────
function UploadModal({ onClose, onUploaded, apiBase, token }) {
  const [form, setForm] = useState({ title:"", category:"general", subject:"", description:"", vault_item_id:"", student_id:"" });
  const [file, setFile]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const fileRef = useRef();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!file) return setError("Please select a PDF file.");
    if (!form.title.trim()) return setError("Title is required.");
    setLoading(true); setError("");
    const fd = new FormData();
    fd.append("pdf", file);
    Object.entries(form).forEach(([k,v]) => { if(v) fd.append(k,v); });
    try {
      const res  = await fetch(`${apiBase}/admin/pdfs/upload`, { method:"POST", headers:{ Authorization:`Bearer ${token}` }, body:fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error||"Upload failed");
      onUploaded(data.pdf);
    } catch(err) { setError(err.message); }
    finally { setLoading(false); }
  }

  const inp = { width:"100%", background:"#1a2236", border:"1px solid #2d3748", borderRadius:8, padding:"9px 12px", color:"#fff", fontSize:13, outline:"none", boxSizing:"border-box" };
  const lbl = { color:"#9CA3AF", fontSize:12, marginBottom:4, display:"block" };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}
      onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:"#111827", borderRadius:16, padding:28, width:"100%", maxWidth:520, border:"1px solid #6C63FF40", maxHeight:"90vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
          <h2 style={{ margin:0, color:"#fff", fontSize:17 }}>Upload PDF to Folder Bank</h2>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#9CA3AF", fontSize:20, cursor:"pointer" }}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ border:"2px dashed #6C63FF50", borderRadius:10, padding:20, textAlign:"center", marginBottom:18, cursor:"pointer", background:file?"#6C63FF10":"transparent" }}
            onClick={()=>fileRef.current.click()}>
            <input ref={fileRef} type="file" accept="application/pdf" style={{ display:"none" }}
              onChange={e=>{ const f=e.target.files[0]; setFile(f); if(!form.title) set("title",f.name.replace(/\.pdf$/i,"").replace(/_/g," ")); }} />
            {file ? (
              <><div style={{ fontSize:28, marginBottom:4 }}>📄</div>
                <div style={{ color:"#10B981", fontWeight:600, fontSize:13 }}>{file.name}</div>
                <div style={{ color:"#6B7280", fontSize:11 }}>{humanSize(file.size)}</div></>
            ) : (
              <><div style={{ fontSize:28, marginBottom:6 }}>📤</div>
                <div style={{ color:"#6C63FF", fontWeight:600, fontSize:13 }}>Click to select PDF</div>
                <div style={{ color:"#4B5563", fontSize:11 }}>Max 50 MB</div></>
            )}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Title *</label>
              <input style={inp} value={form.title} onChange={e=>set("title",e.target.value)} placeholder="e.g. Physics Formula Sheet" required />
            </div>
            <div>
              <label style={lbl}>Category</label>
              <select style={inp} value={form.category} onChange={e=>set("category",e.target.value)}>
                {CATEGORIES.filter(c=>c.key!=="all").map(c=><option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Subject</label>
              <input style={inp} value={form.subject} onChange={e=>set("subject",e.target.value)} placeholder="e.g. Physics" />
            </div>
            <div style={{ gridColumn:"1/-1" }}>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, resize:"vertical", minHeight:55 }} value={form.description} onChange={e=>set("description",e.target.value)} placeholder="Brief description..." />
            </div>
          </div>
          <div style={{ background:"#0d1117", borderRadius:10, padding:12, marginBottom:14, border:"1px solid #2d3748" }}>
            <div style={{ color:"#9CA3AF", fontSize:12, marginBottom:10 }}>Access Control — leave blank for free access to all students</div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <div>
                <label style={lbl}>Vault Item ID</label>
                <input style={inp} value={form.vault_item_id} onChange={e=>set("vault_item_id",e.target.value)} placeholder="e.g. physics_pack" />
              </div>
              <div>
                <label style={lbl}>Student ID</label>
                <input style={inp} type="number" value={form.student_id} onChange={e=>set("student_id",e.target.value)} placeholder="e.g. 42" />
              </div>
            </div>
          </div>
          {error && <div style={{ background:"#EF444420", border:"1px solid #EF444460", borderRadius:8, padding:"9px 12px", color:"#EF4444", marginBottom:12, fontSize:12 }}>{error}</div>}
          <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
            <button type="button" onClick={onClose} style={{ padding:"9px 18px", borderRadius:8, background:"#1f2937", border:"1px solid #374151", color:"#9CA3AF", cursor:"pointer", fontSize:13 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding:"9px 22px", borderRadius:8, background:loading?"#374151":"linear-gradient(135deg,#6C63FF,#8B5CF6)", border:"none", color:"#fff", fontWeight:700, cursor:loading?"not-allowed":"pointer", fontSize:13 }}>
              {loading ? "Uploading..." : "Upload PDF"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function AdminPDFVault({ adminToken, apiBase = "/api" }) {
  const [stats,       setStats]       = useState(null);
  const [pdfs,        setPdfs]        = useState([]);
  const [pagination,  setPagination]  = useState({ total:0, page:1, totalPages:1 });
  const [loading,     setLoading]     = useState(false);
  const [showUpload,  setShowUpload]  = useState(false);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search,      setSearch]      = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debRef = useRef();
  const headers = { Authorization:`Bearer ${adminToken}` };

  const handleSearch = v => { setSearch(v); clearTimeout(debRef.current); debRef.current = setTimeout(()=>setDebouncedSearch(v), 400); };

  const fetchStats = useCallback(async()=>{
    try { const r = await fetch(`${apiBase}/admin/pdfs/stats`,{headers}); if(r.ok) setStats(await r.json()); } catch{}
  },[apiBase,adminToken]);

  const fetchPdfs = useCallback(async(page=1)=>{
    setLoading(true);
    try {
      const p = new URLSearchParams({ page, limit:15 });
      if(activeCategory!=="all") p.set("category",activeCategory);
      if(debouncedSearch) p.set("search",debouncedSearch);
      const r = await fetch(`${apiBase}/admin/pdfs?${p}`,{headers});
      if(r.ok) { const d=await r.json(); setPdfs(d.pdfs||[]); setPagination(d.pagination||{total:0,page:1,totalPages:1}); }
    } catch{}
    setLoading(false);
  },[apiBase,adminToken,activeCategory,debouncedSearch]);

  useEffect(()=>{ fetchStats(); },[fetchStats]);
  useEffect(()=>{ fetchPdfs(1); },[fetchPdfs]);

  async function handleDelete(id, title) {
    if(!window.confirm(`Delete "${title}"?`)) return;
    const r = await fetch(`${apiBase}/admin/pdfs/${id}`,{method:"DELETE",headers});
    if(r.ok) { setPdfs(p=>p.filter(x=>x.id!==id)); fetchStats(); }
  }

  function handleUploaded(pdf) { setShowUpload(false); setPdfs(p=>[pdf,...p]); fetchStats(); }

  const catCount = key => stats?.by_category?.find(c=>c.category===key)?.file_count || 0;

  return (
    <div style={{ fontFamily:"'Segoe UI',sans-serif", color:"#fff" }}>
      {showUpload && <UploadModal onClose={()=>setShowUpload(false)} onUploaded={handleUploaded} apiBase={apiBase} token={adminToken} />}

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, flexWrap:"wrap", gap:10 }}>
        <div>
          <h2 style={{ margin:0, fontSize:20, fontWeight:800, color:"#E5E7EB" }}>PDF Folder Bank</h2>
          <div style={{ color:"#6B7280", fontSize:12, marginTop:2 }}>Centralised storage for all student PDFs</div>
        </div>
        <button onClick={()=>setShowUpload(true)} style={{ background:"linear-gradient(135deg,#6C63FF,#8B5CF6)", border:"none", borderRadius:10, padding:"10px 20px", color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }}>
          Upload PDF
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
          {[
            { label:"Total Files",      value:stats.total_files,     color:"#6C63FF" },
            { label:"Storage Used",     value:stats.total_size,      color:"#10B981" },
            { label:"Total Downloads",  value:stats.total_downloads, color:"#F59E0B" },
          ].map(s=>(
            <div key={s.label} style={{ background:"#1a2236", borderRadius:10, padding:"12px 18px", flex:"1 1 140px", border:`1px solid ${s.color}30` }}>
              <div style={{ color:"#6B7280", fontSize:11, textTransform:"uppercase", letterSpacing:1 }}>{s.label}</div>
              <div style={{ color:s.color, fontSize:22, fontWeight:800, marginTop:2 }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Category Pills + Search */}
      <div style={{ display:"flex", gap:8, marginBottom:16, flexWrap:"wrap", alignItems:"center" }}>
        {CATEGORIES.map(c=>{
          const active = activeCategory === c.key;
          const count  = c.key==="all" ? (stats?.total_files||0) : catCount(c.key);
          return (
            <button key={c.key} onClick={()=>setActiveCategory(c.key)} style={{
              padding:"7px 14px", borderRadius:20, border:`1px solid ${active?c.color:c.color+"40"}`,
              background: active ? c.color : "transparent",
              color: active ? "#fff" : c.color,
              fontSize:12, fontWeight:active?700:400, cursor:"pointer",
            }}>
              {c.label}{count>0?` (${count})`:""}
            </button>
          );
        })}
        <input
          style={{ marginLeft:"auto", background:"#1a2236", border:"1px solid #2d3748", borderRadius:8, padding:"7px 12px", color:"#fff", fontSize:12, outline:"none", width:200 }}
          placeholder="Search PDFs..."
          value={search}
          onChange={e=>handleSearch(e.target.value)}
        />
        <span style={{ color:"#6B7280", fontSize:12 }}>{pagination.total} file{pagination.total!==1?"s":""}</span>
      </div>

      {/* PDF List */}
      <div style={{ background:"#111827", borderRadius:12, border:"1px solid #1f2937", overflow:"hidden" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:40, color:"#4B5563" }}>Loading...</div>
        ) : pdfs.length === 0 ? (
          <div style={{ textAlign:"center", padding:50, color:"#4B5563" }}>
            <div style={{ fontSize:44, marginBottom:10 }}>📁</div>
            <div style={{ marginBottom:14 }}>No PDFs yet</div>
            <button onClick={()=>setShowUpload(true)} style={{ background:"linear-gradient(135deg,#6C63FF,#8B5CF6)", border:"none", borderRadius:8, padding:"9px 18px", color:"#fff", fontWeight:700, cursor:"pointer", fontSize:13 }}>
              Upload First PDF
            </button>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
            <thead>
              <tr style={{ borderBottom:"1px solid #1f2937" }}>
                {["File","Category","Subject","Size","Access","Downloads","Date",""].map(h=>(
                  <th key={h} style={{ textAlign:"left", padding:"10px 12px", color:"#6B7280", fontSize:10, textTransform:"uppercase", letterSpacing:0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pdfs.map(pdf=>{
                const cat = CATEGORIES.find(c=>c.key===pdf.category)||CATEGORIES[0];
                return (
                  <tr key={pdf.id} style={{ borderBottom:"1px solid #0d1117", transition:"background 0.1s" }}
                    onMouseEnter={e=>e.currentTarget.style.background="#1a2236"}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <td style={{ padding:"11px 12px" }}>
                      <div style={{ fontWeight:600, color:"#E5E7EB" }}>{pdf.title}</div>
                      <div style={{ color:"#4B5563", fontSize:10, marginTop:1 }}>{pdf.file_name}</div>
                    </td>
                    <td style={{ padding:"11px 12px" }}>
                      <span style={{ background:`${cat.color}20`, color:cat.color, borderRadius:6, padding:"2px 8px", fontSize:11, fontWeight:600 }}>{cat.label}</span>
                    </td>
                    <td style={{ padding:"11px 12px", color:"#9CA3AF" }}>{pdf.subject||"—"}</td>
                    <td style={{ padding:"11px 12px", color:"#9CA3AF", fontFamily:"monospace" }}>{humanSize(pdf.file_size_bytes)}</td>
                    <td style={{ padding:"11px 12px" }}>
                      {pdf.student_id
                        ? <span style={{ background:"#F59E0B20", color:"#F59E0B", borderRadius:6, padding:"2px 7px", fontSize:10 }}>Student #{pdf.student_id}</span>
                        : pdf.vault_item_id
                        ? <span style={{ background:"#8B5CF620", color:"#8B5CF6", borderRadius:6, padding:"2px 7px", fontSize:10 }}>Vault</span>
                        : <span style={{ background:"#10B98120", color:"#10B981", borderRadius:6, padding:"2px 7px", fontSize:10 }}>Free</span>}
                    </td>
                    <td style={{ padding:"11px 12px", color:"#F59E0B", fontWeight:600 }}>{pdf.download_count||0}</td>
                    <td style={{ padding:"11px 12px", color:"#4B5563" }}>{new Date(pdf.created_at).toLocaleDateString("en-GB",{day:"2-digit",month:"short"})}</td>
                    <td style={{ padding:"11px 12px" }}>
                      <button onClick={()=>handleDelete(pdf.id,pdf.title)}
                        style={{ background:"#EF444415", border:"1px solid #EF444440", color:"#EF4444", borderRadius:6, padding:"4px 9px", cursor:"pointer", fontSize:11 }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {pagination.totalPages > 1 && (
          <div style={{ display:"flex", justifyContent:"space-between", padding:"12px 16px", borderTop:"1px solid #1f2937", color:"#6B7280", fontSize:12 }}>
            <span>Showing {pdfs.length} of {pagination.total}</span>
            <div style={{ display:"flex", gap:6 }}>
              {Array.from({length:pagination.totalPages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>fetchPdfs(p)} style={{ background:p===pagination.page?"#6C63FF":"#1f2937", border:"none", color:p===pagination.page?"#fff":"#9CA3AF", borderRadius:6, padding:"4px 10px", cursor:"pointer", fontSize:12 }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
