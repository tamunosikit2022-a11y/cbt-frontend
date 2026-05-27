import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import VaultPDFDownloads from "../components/VaultPDFDownloads";

const RARITY_STYLE = {
  common:    { bg:"rgba(0,208,132,.08)",  border:"rgba(0,208,132,.3)",  text:"#00D084" },
  rare:      { bg:"rgba(0,212,255,.08)",  border:"rgba(0,212,255,.3)",  text:"#00D4FF" },
  epic:      { bg:"rgba(124,92,255,.1)",  border:"rgba(124,92,255,.4)", text:"#7C5CFF" },
  legendary: { bg:"rgba(255,200,87,.08)", border:"rgba(255,200,87,.4)", text:"#FFC857" },
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0B1020;font-family:'Plus Jakarta Sans',sans-serif}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes slide-up{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
  .vault-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;
    overflow:hidden;transition:all .3s ease;cursor:pointer}
  .vault-card:hover{transform:translateY(-3px);border-color:rgba(124,92,255,.4);box-shadow:0 10px 35px rgba(124,92,255,.15)}
  .vault-card.owned{border-color:rgba(0,208,132,.3)}
  .cyber-btn{border:none;cursor:pointer;border-radius:10px;font-weight:800;font-family:'Plus Jakarta Sans',sans-serif;
    transition:all .2s ease;position:relative;overflow:hidden}
  .cyber-btn:hover{transform:translateY(-1px)}
  .cyber-btn:active{transform:scale(.96)}
`;

export default function KnowledgeVault() {
  const nav = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("store");
  const [modal,   setModal]   = useState(null);
  const [busy,    setBusy]    = useState(false);
  const [toast,   setToast]   = useState(null);
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("all");

  useEffect(() => {
    if (!document.getElementById("vault-css")) {
      const s = document.createElement("style"); s.id = "vault-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [storeRes, libRes] = await Promise.all([
        API.get("/vault"),
        API.get("/vault/library"),
      ]);
      setData({ ...storeRes.data, library: libRes.data.library });
    } catch { showToast("Failed to load vault", "error"); }
    finally { setLoading(false); }
  };

  const showToast = (msg, type="success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3500);
  };

  const handleUnlock = async (currency) => {
    if (!modal) return;
    setBusy(true);
    try {
      const r = await API.post("/vault/unlock", { item_id: modal.id, currency });
      setData(d => ({ ...d, coins: r.data.coins, gems: r.data.gems }));
      showToast(r.data.message);
      setModal(null); await loadData();
    } catch (err) { showToast(err.response?.data?.error || "Failed", "error"); }
    finally { setBusy(false); }
  };

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#0B1020" }}>
      <div style={{ textAlign:"center" }}>
        <div style={{ fontSize:64, animation:"float 2s ease-in-out infinite" }}>📚</div>
        <p style={{ color:"#7C5CFF", marginTop:16, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>Opening Vault…</p>
      </div>
    </div>
  );

  const allItems = data?.items || [];
  const library  = data?.library || [];
  const subjects = ["all", ...new Set(allItems.map(i => i.subject))];

  const filteredItems = allItems.filter(item => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subject.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || item.subject === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div style={{ minHeight:"100vh", background:"#0B1020", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:9999, padding:"14px 24px", borderRadius:12,
          background: toast.type==="success" ? "rgba(0,208,132,.15)" : "rgba(255,90,95,.15)",
          border:`1px solid ${toast.type==="success"?"#00D084":"#FF5A5F"}`,
          color: toast.type==="success" ? "#00D084" : "#FF5A5F", fontWeight:700, backdropFilter:"blur(20px)" }}>
          {toast.msg}
        </div>
      )}

      {/* Unlock modal */}
      {modal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.85)", zIndex:1000,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(10px)" }}
          onClick={() => setModal(null)}>
          <div style={{ background:"#151B2E", borderRadius:24, padding:28, maxWidth:380, width:"100%",
            border:"1px solid rgba(124,92,255,.3)", boxShadow:"0 0 60px rgba(124,92,255,.2)",
            animation:"slide-up .3s ease" }}
            onClick={e => e.stopPropagation()}>

            <div style={{ textAlign:"center", marginBottom:20 }}>
              <div style={{ fontSize:60, animation:"float 2s ease-in-out infinite" }}>{modal.icon}</div>
              <div style={{ display:"inline-block", padding:"3px 12px", borderRadius:20, marginTop:8,
                background:RARITY_STYLE[modal.rarity]?.bg, border:`1px solid ${RARITY_STYLE[modal.rarity]?.border}`,
                color:RARITY_STYLE[modal.rarity]?.text, fontSize:11, fontWeight:800 }}>
                {modal.rarity.toUpperCase()}
              </div>
              <h2 style={{ color:"#fff", fontWeight:900, fontSize:20, marginTop:10, marginBottom:4 }}>{modal.title}</h2>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:13 }}>{modal.description}</p>
            </div>

            <div style={{ background:"rgba(255,255,255,.04)", borderRadius:12, padding:"12px 16px", marginBottom:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:"rgba(255,255,255,.5)", fontSize:12 }}>📄 Pages</span>
                <span style={{ color:"#fff", fontWeight:700, fontSize:12 }}>{modal.pages}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                <span style={{ color:"rgba(255,255,255,.5)", fontSize:12 }}>📌 Subject</span>
                <span style={{ color:"#fff", fontWeight:700, fontSize:12 }}>{modal.subject}</span>
              </div>
              <p style={{ color:"rgba(255,255,255,.4)", fontSize:12, marginTop:8, borderTop:"1px solid rgba(255,255,255,.06)", paddingTop:8 }}>
                {modal.preview}
              </p>
            </div>

            {!modal.owned ? (
              <div>
                <p style={{ color:"rgba(255,255,255,.5)", fontSize:12, textAlign:"center", marginBottom:12 }}>
                  Choose payment method:
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  <button className="cyber-btn" onClick={() => handleUnlock("coins")} disabled={busy}
                    style={{ padding:"12px 0", background:"linear-gradient(135deg,#FFC857,#FF9500)", color:"#000", fontSize:14 }}>
                    {busy ? "…" : `🪙 ${modal.cost?.coins?.toLocaleString()}`}
                  </button>
                  <button className="cyber-btn" onClick={() => handleUnlock("gems")} disabled={busy}
                    style={{ padding:"12px 0", background:"linear-gradient(135deg,#7C5CFF,#00D4FF)", color:"#fff", fontSize:14 }}>
                    {busy ? "…" : `💎 ${modal.cost?.gems}`}
                  </button>
                </div>
                <div style={{ textAlign:"center", marginTop:10, color:"rgba(255,255,255,.3)", fontSize:11 }}>
                  or ₦{modal.cost?.naira} with payment gateway (coming soon)
                </div>
              </div>
            ) : (
              <div style={{ background:"rgba(0,208,132,.1)", border:"1px solid #00D084", borderRadius:12,
                padding:"14px", textAlign:"center" }}>
                <p style={{ color:"#00D084", fontWeight:800, fontSize:16, margin:0 }}>✅ Already in your Library</p>
                <p style={{ color:"rgba(0,208,132,.6)", fontSize:12, marginTop:4 }}>Available to read anytime</p>
              </div>
            )}

            <button onClick={() => setModal(null)} style={{ width:"100%", marginTop:12, padding:"10px 0",
              background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", color:"rgba(255,255,255,.5)",
              borderRadius:12, cursor:"pointer", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              Close
            </button>
          </div>
        </div>
      )}

      <div style={{ maxWidth:800, margin:"0 auto", padding:"24px 20px 80px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
          <button onClick={() => nav(-1)} style={{ background:"rgba(255,255,255,.06)", border:"none", color:"#fff",
            borderRadius:10, width:40, height:40, cursor:"pointer", fontSize:18 }}>←</button>
          <div>
            <h1 style={{ color:"#fff", fontWeight:900, fontSize:24, margin:0 }}>📚 Knowledge Vault</h1>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, margin:0 }}>Premium study materials & formula packs</p>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", gap:10 }}>
            <div style={{ background:"rgba(255,200,87,.1)", border:"1px solid rgba(255,200,87,.3)",
              borderRadius:10, padding:"6px 12px", display:"flex", gap:6 }}>
              <span>🪙</span><span style={{ color:"#FFC857", fontWeight:800, fontSize:13 }}>{(data?.coins||0).toLocaleString()}</span>
            </div>
            <div style={{ background:"rgba(0,212,255,.1)", border:"1px solid rgba(0,212,255,.3)",
              borderRadius:10, padding:"6px 12px", display:"flex", gap:6 }}>
              <span>💎</span><span style={{ color:"#00D4FF", fontWeight:800, fontSize:13 }}>{data?.gems||0}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", gap:8, marginBottom:20, background:"rgba(255,255,255,.04)", borderRadius:14, padding:6 }}>
          {[
            { key:"store",     label:`🏪 Store (${allItems.length})` },
            { key:"library",   label:`📖 My Library (${library.length})` },
            { key:"downloads", label:"📥 Downloads" },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{ flex:1, padding:"10px 0", borderRadius:10, border:"none", cursor:"pointer",
                fontWeight:800, fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14,
                background: tab===t.key ? "#7C5CFF" : "transparent",
                color: tab===t.key ? "#fff" : "rgba(255,255,255,.5)" }}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "store" ? (
          <>
            {/* Search + Filter */}
            <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍  Search materials…"
                style={{ flex:1, minWidth:200, padding:"10px 16px", borderRadius:12,
                  background:"rgba(255,255,255,.06)", border:"1px solid rgba(255,255,255,.1)",
                  color:"#fff", fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14,
                  outline:"none" }} />
              <select value={filter} onChange={e => setFilter(e.target.value)}
                style={{ padding:"10px 16px", borderRadius:12, background:"rgba(255,255,255,.06)",
                  border:"1px solid rgba(255,255,255,.1)", color:"#fff",
                  fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:14 }}>
                {subjects.map(s => <option key={s} value={s} style={{ background:"#151B2E" }}>{s === "all" ? "All Subjects" : s}</option>)}
              </select>
            </div>

            {/* Items grid */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
              {filteredItems.map((item, i) => {
                const rs = RARITY_STYLE[item.rarity] || RARITY_STYLE.common;
                return (
                  <div key={item.id} className={`vault-card ${item.owned ? "owned" : ""}`}
                    onClick={() => setModal(item)}>
                    <div style={{ padding:18 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
                        <span style={{ fontSize:36 }}>{item.icon}</span>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:4 }}>
                          <span style={{ padding:"2px 8px", borderRadius:20, fontSize:10, fontWeight:800,
                            background:rs.bg, border:`1px solid ${rs.border}`, color:rs.text }}>
                            {item.rarity.toUpperCase()}
                          </span>
                          {item.owned && (
                            <span style={{ fontSize:10, color:"#00D084", fontWeight:700 }}>✅ OWNED</span>
                          )}
                        </div>
                      </div>
                      <h3 style={{ color:"#fff", fontWeight:800, fontSize:14, marginBottom:4 }}>{item.title}</h3>
                      <p style={{ color:"rgba(255,255,255,.4)", fontSize:11, marginBottom:12 }}>{item.preview}</p>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", gap:10 }}>
                          <span style={{ color:"#FFC857", fontSize:12, fontWeight:700 }}>🪙 {item.cost?.coins?.toLocaleString()}</span>
                          <span style={{ color:"rgba(255,255,255,.2)", fontSize:12 }}>|</span>
                          <span style={{ color:"#00D4FF", fontSize:12, fontWeight:700 }}>💎 {item.cost?.gems}</span>
                        </div>
                        <span style={{ color:"rgba(255,255,255,.3)", fontSize:11 }}>{item.pages}p</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div style={{ textAlign:"center", padding:"60px 0", color:"rgba(255,255,255,.3)" }}>
                <div style={{ fontSize:48, marginBottom:12 }}>🔍</div>
                <p>No materials found</p>
              </div>
            )}
          </>
        ) : (
          /* Library tab */
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {library.length === 0 ? (
              <div style={{ textAlign:"center", padding:"80px 0" }}>
                <div style={{ fontSize:64, marginBottom:16, animation:"float 2s ease-in-out infinite" }}>📚</div>
                <p style={{ color:"rgba(255,255,255,.5)", marginBottom:8 }}>Your library is empty</p>
                <button onClick={() => setTab("store")} className="cyber-btn"
                  style={{ padding:"12px 24px", background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)", color:"#fff", fontSize:14 }}>
                  Browse the Store
                </button>
              </div>
            ) : library.map(item => {
              const rs = RARITY_STYLE[item.rarity] || RARITY_STYLE.common;
              return (
                <div key={item.id} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(0,208,132,.2)",
                  borderRadius:14, padding:"16px 20px", display:"flex", alignItems:"center", gap:16 }}>
                  <span style={{ fontSize:36 }}>{item.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                      <span style={{ color:"#fff", fontWeight:800, fontSize:15 }}>{item.title}</span>
                      <span style={{ padding:"1px 8px", borderRadius:20, fontSize:10, fontWeight:800,
                        background:rs.bg, border:`1px solid ${rs.border}`, color:rs.text }}>
                        {item.rarity.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ color:"rgba(255,255,255,.4)", fontSize:12, margin:0 }}>{item.subject} • {item.pages} pages</p>
                  </div>
                  <button className="cyber-btn" style={{ padding:"10px 18px", fontSize:13,
                    background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)", color:"#fff" }}>
                    📖 Read
                  </button>
                </div>
              );
            })}
          </div>
        ) : tab === "downloads" ? (
          <VaultPDFDownloads />
        ) : null}
      </div>
    </div>
  );
}
