/**
 * AdminPDFVault.js — Cloudinary version with:
 *  - Concurrent upload (3 at a time) with per-file retry
 *  - AI Question Generator button per PDF
 *  - Fixed category matching backend VALID_CATEGORIES
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

// ── AI Question Gen Modal ─────────────────────────────────
function QuestionGenModal({ pdf, apiBase, token, onClose }) {
  const [subject,    setSubject]    = useState(pdf.subject || "");
  const [examType,   setExamType]   = useState("JAMB");
  const [target,     setTarget]     = useState("50");
  const [difficulty, setDifficulty] = useState("mixed");
  const [loading,    setLoading]    = useState(false);
  const [job,        setJob]        = useState(null);
  const [error,      setError]      = useState("");
  const pollRef = useRef();

  const startJob = async () => {
    if (!subject) return setError("Select a subject.");
    setLoading(true); setError(""); setJob(null);
    try {
      const fd = new FormData();
      // Re-upload is not needed — pass pdf_id so backend fetches from Cloudinary
      fd.append("pdf_id", pdf.id);
      fd.append("pdf_url", pdf.cloudinary_url);
      fd.append("pdf_name", pdf.title);
      fd.append("subject", subject);
      fd.append("exam_type", examType);
      fd.append("difficulty", difficulty);
      fd.append("target", target);
      const r = await fetch(`${apiBase}/admin/questions/generate-from-url`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to start job");
      setJob(d);
      // Poll for progress
      if (d.job_id) {
        pollRef.current = setInterval(async () => {
          try {
            const pr = await fetch(`${apiBase}/admin/questions/gen-jobs/${d.job_id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            const pd = await pr.json();
            if (pd.job) {
              setJob(prev => ({ ...prev, ...pd.job }));
              if (pd.job.status === "done" || pd.job.status === "failed") {
                clearInterval(pollRef.current);
                setLoading(false);
              }
            }
          } catch { clearInterval(pollRef.current); setLoading(false); }
        }, 2500);
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message); setLoading(false);
    }
  };

  useEffect(() => () => clearInterval(pollRef.current), []);

  const SUBS = ["Mathematics","Physics","Chemistry","Biology","English","Economics","Government","Literature","Geography","Commerce","Accounting","Further Mathematics","Agricultural Science","CRS","Music","Fine Art"];
  const pct = job?.count_target ? Math.round((job.count_done || 0) / job.count_target * 100) : 0;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.8)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1100, padding:16 }}>
      <div style={{ background:"#151B2E", borderRadius:18, padding:"24px 20px", width:"100%", maxWidth:460, border:"1px solid rgba(124,92,255,0.3)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <div>
            <h3 style={{ margin:0, color:"#e0e6ff", fontSize:16, fontWeight:800 }}>🤖 AI Question Generator</h3>
            <div style={{ color:"#6b7db3", fontSize:12, marginTop:2 }}>{pdf.title}</div>
          </div>
          {!loading && <button onClick={onClose} style={{ background:"none", border:"none", color:"#8b9cbd", fontSize:20, cursor:"pointer" }}>✕</button>}
        </div>

        {!job ? (
          <>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
              <select style={inp} value={subject} onChange={e => setSubject(e.target.value)}>
                <option value="">-- Subject *</option>
                {SUBS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div style={{ display:"flex", gap:8 }}>
                <select style={{ ...inp, flex:1 }} value={examType} onChange={e => setExamType(e.target.value)}>
                  <option value="JAMB">JAMB</option>
                  <option value="WAEC">WAEC</option>
                  <option value="POST-UTME">Post-UTME</option>
                  <option value="NECO">NECO</option>
                </select>
                <select style={{ ...inp, flex:1 }} value={difficulty} onChange={e => setDifficulty(e.target.value)}>
                  <option value="mixed">Mixed</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <label style={{ color:"#8b9cbd", fontSize:13, flexShrink:0 }}>Target questions:</label>
                <select style={{ ...inp, flex:1 }} value={target} onChange={e => setTarget(e.target.value)}>
                  {[20,30,50,100,200].map(n => <option key={n} value={n}>{n} questions</option>)}
                </select>
              </div>
            </div>
            {error && <div style={{ color:"#ff5a5f", fontSize:13, marginBottom:10 }}>{error}</div>}
            <div style={{ fontSize:12, color:"#6b7db3", marginBottom:14, lineHeight:1.7 }}>
              Groq AI will read the PDF text and generate {target} JAMB-style MCQs, inserting them directly into your question bank. Runs in the background — you can close this window.
            </div>
            <button onClick={startJob} style={{ width:"100%", padding:"12px 0", background:"linear-gradient(135deg,#7c5cff,#5e42d4)", border:"none", borderRadius:10, color:"#fff", fontWeight:800, fontSize:14, cursor:"pointer" }}>
              🚀 Start Generating Questions
            </button>
          </>
        ) : (
          <div>
            {/* Progress */}
            <div style={{ background:"rgba(255,255,255,0.06)", borderRadius:10, height:10, overflow:"hidden", marginBottom:8 }}>
              <div style={{ height:"100%", width:`${pct}%`, background: job.status === "done" ? "#00d084" : job.status === "failed" ? "#ff5a5f" : "#7c5cff", borderRadius:10, transition:"width 0.5s" }} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", color:"#8b9cbd", fontSize:12, marginBottom:16 }}>
              <span>Status: <strong style={{ color: job.status === "done" ? "#00d084" : job.status === "failed" ? "#ff5a5f" : "#ffc857" }}>{job.status}</strong></span>
              <span>{job.count_done || 0} / {job.count_target || target} questions</span>
            </div>

            {job.status === "running" && (
              <div style={{ textAlign:"center", color:"#8b9cbd", fontSize:13, padding:"12px 0" }}>
                ⚙️ Groq is generating questions from your PDF… This runs in the background.
              </div>
            )}
            {job.status === "done" && (
              <div style={{ background:"rgba(0,208,132,0.1)", border:"1px solid rgba(0,208,132,0.3)", borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:6 }}>✅</div>
                <div style={{ fontWeight:800, color:"#00d084", fontSize:15 }}>{job.count_done} questions added to bank!</div>
                <div style={{ color:"#6b7db3", fontSize:12, marginTop:4 }}>Go to Questions tab to review and edit them.</div>
              </div>
            )}
            {job.status === "failed" && (
              <div style={{ background:"rgba(255,90,95,0.1)", border:"1px solid rgba(255,90,95,0.3)", borderRadius:10, padding:"14px", color:"#ff5a5f" }}>
                <strong>Failed:</strong> {job.error_msg}
                <br /><span style={{ fontSize:12, color:"#6b7db3" }}>Make sure the PDF is text-based (not a scanned image).</span>
              </div>
            )}
            {(job.status === "done" || job.status === "failed") && (
              <button onClick={onClose} style={{ width:"100%", marginTop:14, padding:"11px 0", background:"rgba(255,255,255,0.07)", border:"none", borderRadius:10, color:"#e0e6ff", fontWeight:700, cursor:"pointer" }}>Close</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const inp = { width:"100%", padding:"9px 12px", background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.12)", borderRadius:8, color:"#e0e6ff", fontSize:13, outline:"none", boxSizing:"border-box" };

// ── Upload Modal — Concurrent + Retry ─────────────────────
function UploadModal({ onClose, onUploaded, apiBase, token }) {
  const [files,     setFiles]     = useState([]);
  const [form,      setForm]      = useState({ category:"general", subject:"", description:"", price:"0", is_premium:"false" });
  const [uploading, setUploading] = useState(false);
  const [results,   setResults]   = useState([]);
  const [error,     setError]     = useState("");
  const [dragOver,  setDragOver]  = useState(false);
  const fileRef = useRef();
  const abortRef = useRef(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const addFiles = (fileList) => {
    const pdfs = Array.from(fileList).filter(f => f.type==="application/pdf"||f.name.endsWith(".pdf"));
    if (!pdfs.length) return setError("Only PDF files are accepted.");
    setError("");
    setFiles(prev => {
      const names = new Set(prev.map(f=>f.name));
      return [...prev, ...pdfs.filter(f=>!names.has(f.name))];
    });
  };
  const removeFile = (i) => setFiles(prev => prev.filter((_,idx)=>idx!==i));
  const totalSize  = files.reduce((s,f)=>s+f.size,0);

  // Upload one file with retry
  const uploadOne = async (file, index, resRef, maxRetries = 2) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (abortRef.current) return;
      try {
        resRef[index] = { name:file.name, size:file.size, status:"uploading", attempt: attempt > 0 ? `retry ${attempt}` : "" };
        setResults([...resRef]);

        const fd = new FormData();
        fd.append("pdf", file);
        fd.append("title", file.name.replace(/\.pdf$/i,"").replace(/_/g," "));
        Object.entries(form).forEach(([k,v]) => { if (v !== "") fd.append(k, v); });

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 90_000); // 90s per file

        const r = await fetch(`${apiBase}/admin/pdfs/upload`, {
          method:  "POST",
          headers: { Authorization: `Bearer ${token}` },
          body:    fd,
          signal:  controller.signal,
        });
        clearTimeout(timer);
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);

        resRef[index] = { name:file.name, size:file.size, status:"done", pdf:d.pdf };
        setResults([...resRef]);
        return d.pdf;
      } catch (err) {
        if (attempt === maxRetries) {
          resRef[index] = { name:file.name, size:file.size, status:"error", error: err.name === "AbortError" ? "Timed out (file may be too large)" : err.message };
          setResults([...resRef]);
        } else {
          await new Promise(r => setTimeout(r, 1500 * (attempt + 1))); // backoff
        }
      }
    }
  };

  const uploadAll = async () => {
    if (!files.length) return setError("Add at least one PDF.");
    if (!form.category) return setError("Select a category.");
    setUploading(true); setResults([]); abortRef.current = false;
    const resRef = files.map(f => ({ name:f.name, size:f.size, status:"pending" }));
    setResults([...resRef]);

    // Upload 3 files concurrently
    const CONCURRENCY = 3;
    const uploaded = [];
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      if (abortRef.current) break;
      const batch = files.slice(i, i + CONCURRENCY);
      const results = await Promise.all(batch.map((f, bi) => uploadOne(f, i + bi, resRef)));
      uploaded.push(...results.filter(Boolean));
    }

    setUploading(false);
    if (uploaded.length) onUploaded(uploaded[0]);
  };

  const cancelUpload = () => { abortRef.current = true; setUploading(false); };

  const CATS = ["assignments","results","notes","predictions","formulas","general"];
  const SUBS = ["Mathematics","Physics","Chemistry","Biology","English","Economics","Government","Literature in English","Geography","Commerce","Accounting","Further Mathematics","Agricultural Science","CRS"];

  const doneCount  = results.filter(r=>r.status==="done").length;
  const errorCount = results.filter(r=>r.status==="error").length;
  const pct = files.length ? Math.round(((doneCount + errorCount) / files.length) * 100) : 0;

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:16 }}
      onClick={e => e.target===e.currentTarget && !uploading && onClose()}>
      <div style={{ background:"#151B2E", borderRadius:18, padding:"24px 20px", width:"100%", maxWidth:540, border:"1px solid rgba(124,92,255,0.25)", maxHeight:"92vh", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
          <h2 style={{ margin:0, color:"#e0e6ff", fontSize:17, fontWeight:800 }}>📤 Bulk PDF Upload</h2>
          {!uploading && <button onClick={onClose} style={{ background:"none", border:"none", color:"#8b9cbd", fontSize:20, cursor:"pointer" }}>✕</button>}
        </div>

        {/* Drop zone */}
        <div
          onDragOver={e=>{e.preventDefault();setDragOver(true);}}
          onDragLeave={()=>setDragOver(false)}
          onDrop={e=>{e.preventDefault();setDragOver(false);addFiles(e.dataTransfer.files);}}
          onClick={()=>fileRef.current.click()}
          style={{ border:`2px dashed ${dragOver?"#7c5cff":"rgba(124,92,255,0.35)"}`, borderRadius:12, padding:"20px 16px", textAlign:"center", marginBottom:14, cursor:"pointer", background:dragOver?"rgba(124,92,255,0.1)":files.length?"rgba(124,92,255,0.05)":"transparent", transition:"all 0.2s" }}>
          <input ref={fileRef} type="file" accept="application/pdf" multiple style={{display:"none"}} onChange={e=>addFiles(e.target.files)} />
          <div style={{fontSize:32,marginBottom:6}}>📁</div>
          <div style={{color:"#e0e6ff",fontWeight:700,fontSize:14}}>Drop PDFs here or click to browse</div>
          <div style={{color:"#6b7db3",fontSize:12,marginTop:3}}>Up to 200 MB per file · Uploads 3 at a time · Auto-retry on failure</div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{marginBottom:12,maxHeight:200,overflowY:"auto"}}>
            {files.map((f,i) => {
              const r = results[i];
              const stColor = !r||r.status==="pending" ? "#6b7db3" : r.status==="done" ? "#00d084" : r.status==="error" ? "#ff5a5f" : "#ffc857";
              const stLabel = !r||r.status==="pending" ? "Pending" : r.status==="uploading" ? (r.attempt ? `↺ ${r.attempt}` : "⏳ Uploading") : r.status==="done" ? "✅" : "❌";
              return (
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"rgba(255,255,255,0.04)",borderRadius:8,marginBottom:5}}>
                  <span style={{fontSize:14}}>📄</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:"#e0e6ff",fontSize:12,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{f.name}</div>
                    <div style={{color:"#6b7db3",fontSize:10}}>{humanSize(f.size)}{r?.error ? " · ⚠️ "+r.error : ""}</div>
                  </div>
                  <span style={{color:stColor,fontSize:12,fontWeight:700,flexShrink:0,minWidth:60,textAlign:"right"}}>{stLabel}</span>
                  {!uploading && <button onClick={()=>removeFile(i)} style={{background:"none",border:"none",color:"#8b9cbd",cursor:"pointer",fontSize:13,padding:0}}>✕</button>}
                </div>
              );
            })}
            <div style={{color:"#6b7db3",fontSize:11,marginTop:4}}>{files.length} file{files.length!==1?"s":""} · {humanSize(totalSize)}</div>
          </div>
        )}

        {/* Form fields */}
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
          <select style={inp} value={form.category} onChange={e=>set("category",e.target.value)}>
            <option value="">-- Category *</option>
            {CATS.map(c=><option key={c} value={c}>{c.replace(/-/g," ").toUpperCase()}</option>)}
          </select>
          <select style={inp} value={form.subject} onChange={e=>set("subject",e.target.value)}>
            <option value="">-- Subject (optional)</option>
            {SUBS.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <textarea style={{...inp,resize:"vertical",minHeight:52}} placeholder="Description (optional — applies to all files)" value={form.description} onChange={e=>set("description",e.target.value)} />
          <div style={{display:"flex",gap:8}}>
            <input style={{...inp,flex:1}} type="number" min="0" placeholder="Price ₦ (0=free)" value={form.price} onChange={e=>set("price",e.target.value)} />
            <select style={{...inp,flex:1}} value={form.is_premium} onChange={e=>set("is_premium",e.target.value)}>
              <option value="false">Free Tier</option>
              <option value="true">Premium Only</option>
            </select>
          </div>
        </div>

        {/* Progress bar */}
        {uploading && (
          <div style={{marginBottom:12}}>
            <div style={{background:"rgba(255,255,255,0.06)",borderRadius:8,height:8,overflow:"hidden"}}>
              <div style={{height:"100%",background: errorCount > 0 && doneCount === 0 ? "#ff5a5f" : "#7c5cff",borderRadius:8,width:`${pct}%`,transition:"width 0.4s"}} />
            </div>
            <div style={{display:"flex",justifyContent:"space-between",color:"#8b9cbd",fontSize:12,marginTop:5}}>
              <span>{doneCount+errorCount}/{files.length} · {doneCount} OK · {errorCount} failed</span>
              <span>{pct}%</span>
            </div>
          </div>
        )}

        {error && <div style={{color:"#ff5a5f",fontSize:13,fontWeight:600,marginBottom:10}}>⚠️ {error}</div>}

        <div style={{display:"flex",gap:10}}>
          {uploading ? (
            <button onClick={cancelUpload} style={{flex:1,padding:"10px 0",background:"rgba(255,90,95,0.15)",border:"none",borderRadius:10,color:"#ff5a5f",fontWeight:700,cursor:"pointer",fontSize:13}}>✕ Cancel</button>
          ) : (
            <button onClick={onClose} style={{flex:1,padding:"10px 0",background:"rgba(255,255,255,0.07)",border:"none",borderRadius:10,color:"#8b9cbd",fontWeight:700,cursor:"pointer",fontSize:13}}>Cancel</button>
          )}
          <button onClick={uploadAll} disabled={uploading||!files.length}
            style={{flex:2,padding:"11px 0",background:files.length&&!uploading?"linear-gradient(135deg,#7c5cff,#5e42d4)":"#2a2a3d",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:14,cursor:files.length&&!uploading?"pointer":"not-allowed"}}>
            {uploading ? `Uploading… (${doneCount+errorCount}/${files.length})` : `📤 Upload ${files.length||""} File${files.length!==1?"s":""}`}
          </button>
        </div>
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
  const [genPdf,      setGenPdf]      = useState(null); // for AI question gen modal
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
      {genPdf && <QuestionGenModal pdf={genPdf} apiBase={apiBase} token={adminToken} onClose={()=>setGenPdf(null)} />}

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
      <div style={{ background:"var(--surface)", borderRadius:12, border:"1px solid #1f2937", overflow:"hidden" }}>
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
                      <div style={{ display:"flex", gap:6 }}>
                        <button onClick={()=>setGenPdf(pdf)}
                          style={{ background:"#7c5cff15", border:"1px solid #7c5cff40", color:"#a78bfa", borderRadius:6, padding:"4px 9px", cursor:"pointer", fontSize:11, whiteSpace:"nowrap" }}>
                          🤖 AI Q's
                        </button>
                        <button onClick={()=>handleDelete(pdf.id,pdf.title)}
                          style={{ background:"#EF444415", border:"1px solid #EF444440", color:"#EF4444", borderRadius:6, padding:"4px 9px", cursor:"pointer", fontSize:11 }}>
                          Delete
                        </button>
                      </div>
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
