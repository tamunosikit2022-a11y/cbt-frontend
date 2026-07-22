import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const RARITY_GLOW = { legendary: "#FFC857", epic: "var(--primary)", rare: "#00D4FF", common: "#00D084" };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0B1020;font-family:'Plus Jakarta Sans',sans-serif}
  @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
  @keyframes pulse-glow{0%,100%{box-shadow:0 0 20px rgba(124,92,255,.4)}50%{box-shadow:0 0 40px rgba(124,92,255,.9),0 0 80px rgba(124,92,255,.3)}}
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  @keyframes gem-spin{0%{transform:rotateY(0deg)}100%{transform:rotateY(360deg)}}
  @keyframes slide-in{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
  @keyframes particle{0%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(-60px) scale(0)}}
  .gem-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;transition:all .3s ease;cursor:pointer;position:relative;overflow:hidden}
  .gem-card:hover{transform:translateY(-4px);border-color:rgba(124,92,255,.5);box-shadow:0 12px 40px rgba(124,92,255,.2)}
  .gem-card.popular{border-color:rgba(255,200,87,.5);box-shadow:0 0 30px rgba(255,200,87,.15)}
  .gem-card.popular:hover{box-shadow:0 12px 50px rgba(255,200,87,.35)}
  .cyber-btn{position:relative;overflow:hidden;cursor:pointer;border:none;transition:all .2s ease}
  .cyber-btn:hover{transform:translateY(-2px)}
  .cyber-btn:active{transform:scale(.96)}
  .cyber-btn::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,.15) 0,transparent 60%);pointer-events:none}
  .particle{position:fixed;pointer-events:none;font-size:20px;animation:particle 1s ease-out forwards;z-index:999}
`;

export function GemStorePanel() {
  const nav = useNavigate();
  const { student } = useAuth();
  const isPremium = student?.is_premium;
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [loadError,  setLoadError]  = useState(false);
  const [buying,     setBuying]     = useState(null);
  const [toast,      setToast]      = useState(null);
  const [particles,  setParticles]  = useState([]);

  useEffect(() => {
    if (!document.getElementById("gem-store-css")) {
      const s = document.createElement("style"); s.id = "gem-store-css"; s.textContent = CSS;
      document.head.appendChild(s);
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const r = await API.get("/gems/packages");
      setData(r.data);
    } catch { setLoadError(true); }
    finally { setLoading(false); }
  };

  const spawnParticles = (x, y) => {
    const newP = Array.from({ length: 8 }, (_, i) => ({
      id: Date.now() + i, x: x + (Math.random() - .5) * 80, y: y + (Math.random() - .5) * 80,
    }));
    setParticles(p => [...p, ...newP]);
    setTimeout(() => setParticles(p => p.filter(px => !newP.find(n => n.id === px.id))), 1000);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [voucherCode,  setVoucherCode]  = useState("");
  const [redeemBusy,   setRedeemBusy]   = useState(false);

  const handleRedeem = async () => {
    if (!voucherCode.trim()) return showToast("Enter your voucher code", "error");
    setRedeemBusy(true);
    try {
      const r = await API.post("/vouchers/redeem", { code: voucherCode.trim() });
      setData(d => ({ ...d, gems: r.data.total_gems }));
      setVoucherCode("");
      showToast(r.data.message, "success");
    } catch (err) {
      showToast(err.response?.data?.error || "Invalid code", "error");
    } finally { setRedeemBusy(false); }
  };

  const handleBuy = (pkg, e) => {
    spawnParticles(e.clientX, e.clientY);
    const message = encodeURIComponent(
      `Hi! I want to purchase the *${pkg.label}* token pack.\n\n🎫 ${pkg.gems.toLocaleString()} Tokens — ₦${pkg.price.toLocaleString()}\n\nPlease confirm my order.`
    );
    window.open(`https://wa.me/2349036995642?text=${message}`, "_blank");
  };

  // ── SKELETON LOADER (FIX 6) ──────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"'Plus Jakarta Sans',sans-serif", padding:"20px" }}>
      <style>{`
        @keyframes sk-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
        .sk-box{border-radius:14px;background:linear-gradient(90deg,rgba(255,255,255,.04) 25%,rgba(255,255,255,.08) 50%,rgba(255,255,255,.04) 75%);
          background-size:400px 100%;animation:sk-shimmer 1.4s ease infinite;}
      `}</style>
      {/* Header skeleton */}
      <div className="sk-box" style={{ height:56, marginBottom:20 }} />
      <div className="sk-box" style={{ height:80, marginBottom:28 }} />
      {/* Card skeletons */}
      {[1,2,3,4].map(i => (
        <div key={i} className="sk-box" style={{ height:110, marginBottom:12, borderRadius:18 }} />
      ))}
    </div>
  );

  // ── ERROR STATE (FIX 7) ──────────────────────────────────
  if (loadError) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
      <div style={{ textAlign:"center", padding:32 }}>
        <div style={{ fontSize:52, marginBottom:16 }}>📡</div>
        <p style={{ color:"#F1F5F9", fontWeight:800, fontSize:18, marginBottom:8 }}>Couldn't load Gem Store</p>
        <p style={{ color:"#A8B8D8", fontSize:14, marginBottom:24 }}>Check your connection and try again.</p>
        <button onClick={() => { setLoadError(false); setLoading(true); loadData(); }}
          style={{ background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)", color:"#fff", border:"none",
            borderRadius:12, padding:"12px 28px", fontWeight:800, fontSize:15, cursor:"pointer" }}>
          Tap to Retry
        </button>
      </div>
    </div>
  );


  const packages = data?.packages || [];

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"'Plus Jakarta Sans',sans-serif", position:"relative" }}>
      {/* Ambient particles */}
      {[...Array(6)].map((_,i) => (
        <div key={i} style={{ position:"fixed", width:4, height:4, borderRadius:"50%", background:"var(--primary)",
          opacity:.3, left:`${15+i*15}%`, top:`${20+i*10}%`,
          animation:`float ${3+i*.5}s ease-in-out infinite`, animationDelay:`${i*.4}s`, pointerEvents:"none" }} />
      ))}

      {/* Click particles */}
      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left:p.x, top:p.y }}>🎫</div>
      ))}

      {/* Toast */}
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, zIndex:9999, padding:"14px 24px", borderRadius:12,
          background: toast.type === "success" ? "rgba(0,208,132,.15)" : "rgba(255,90,95,.15)",
          border: `1px solid ${toast.type === "success" ? "#00D084" : "#FF5A5F"}`,
          color: toast.type === "success" ? "#00D084" : "#FF5A5F", fontWeight:700, backdropFilter:"blur(20px)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ maxWidth:800, margin:"0 auto", padding:"24px 20px 80px" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:32 }}>
          <div>
            <h1 style={{ color:"#fff", fontWeight:900, fontSize:24, margin:0 }}>💎 Gem Store</h1>
            <p style={{ color:"rgba(255,255,255,.5)", fontSize:13, margin:0 }}>Power up your Scholar journey</p>
          </div>
          <div style={{ marginLeft:"auto", background:"rgba(0,212,255,.1)", border:"1px solid rgba(0,212,255,.3)",
            borderRadius:12, padding:"8px 16px", display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:20 }}>🎫</span>
            <span style={{ color:"#00D4FF", fontWeight:800, fontSize:18 }}>{(data?.gems || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Wallet bar */}
        <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16,
          padding:"16px 20px", marginBottom:28, display:"flex", gap:24 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:24 }}>🪙</span>
            <div>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, margin:0 }}>COINS</p>
              <p style={{ color:"#FFC857", fontWeight:800, fontSize:18, margin:0 }}>{(data?.coins || 0).toLocaleString()}</p>
            </div>
          </div>
          <div style={{ width:1, background:"rgba(255,255,255,.08)" }} />
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:24 }}>💎</span>
            <div>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, margin:0 }}>TOKENS</p>
              <p style={{ color:"#00D4FF", fontWeight:800, fontSize:18, margin:0 }}>{(data?.gems || 0).toLocaleString()}</p>
            </div>
          </div>
          <div style={{ marginLeft:"auto", display:"flex", alignItems:"center" }}>
            <p style={{ color:"rgba(255,255,255,.4)", fontSize:12, margin:0, textAlign:"right" }}>
              Use tokens to unlock<br/>Spirits, Skills & Vault items
            </p>
          </div>
        </div>

        {/* Voucher Redeem Box */}
        <div style={{ background:"rgba(0,208,132,.06)", border:"1px solid rgba(0,208,132,.3)",
          borderRadius:16, padding:20, marginBottom:28 }}>
          <h3 style={{ color:"#00D084", fontWeight:800, fontSize:14, marginBottom:12 }}>
            🎟️ Have a Voucher Code?
          </h3>
          <p style={{ color:"rgba(255,255,255,.5)", fontSize:12, marginBottom:12 }}>
            Enter the code you received after payment to instantly credit your tokens.
          </p>
          <div style={{ display:"flex", gap:10 }}>
            <input
              value={voucherCode}
              onChange={e => setVoucherCode(e.target.value.toUpperCase())}
              placeholder="e.g. GEM-A3X9-K2P1"
              maxLength={13}
              style={{ flex:1, padding:"12px 16px", borderRadius:12, border:"1px solid rgba(0,208,132,.3)",
                background:"rgba(255,255,255,.06)", color:"#fff", fontSize:14,
                fontFamily:"monospace", letterSpacing:2, outline:"none" }}
              onKeyDown={e => e.key === "Enter" && handleRedeem()}
            />
            <button onClick={handleRedeem} disabled={redeemBusy}
              style={{ padding:"12px 20px", borderRadius:12, border:"none", cursor:"pointer",
                background:"linear-gradient(135deg,#00D084,#00b894)", color:"#fff",
                fontWeight:800, fontSize:14, opacity: redeemBusy ? .6 : 1,
                fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              {redeemBusy ? "…" : "Redeem"}
            </button>
          </div>
        </div>

        {/* Gem packages */}
        <h2 style={{ color:"rgba(255,255,255,.7)", fontSize:13, fontWeight:700, letterSpacing:2, marginBottom:8 }}>
          CHOOSE A PACK
        </h2>

        {/* Premium discount banner */}
        {isPremium ? (
          <div style={{ background:"linear-gradient(135deg,#6c63ff22,#a29bfe11)", border:"1.5px solid #6c63ff44", borderRadius:12, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:18 }}>👑</span>
            <div style={{ fontSize:12, fontWeight:800, color:"#a29bfe" }}>Premium discount applied — 20% off all packs!</div>
          </div>
        ) : (
          <div onClick={() => nav("/subscribe")} style={{ background:"rgba(108,99,255,0.08)", border:"1px solid rgba(108,99,255,0.25)", borderRadius:12, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
            <span style={{ fontSize:18 }}>🎫</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:800, color:"#a29bfe" }}>Premium members get 20% off all token packs</div>
              <div style={{ fontSize:11, color:"var(--text-muted)" }}>Upgrade from ₦100 →</div>
            </div>
          </div>
        )}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
          {packages.map((pkg, i) => {
            const discountedPrice = isPremium ? Math.floor(pkg.price * 0.8) : pkg.price;
            return (
            <div key={pkg.id} className={`gem-card ${pkg.popular ? "popular" : ""}`}
              style={{ padding:20, animationDelay:`${i*.08}s` }}>

              {pkg.popular && (
                <div style={{ position:"absolute", top:12, right:12, background:"linear-gradient(135deg,#FFC857,#FF9500)",
                  borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:800, color:"#000" }}>
                  ⭐ BEST VALUE
                </div>
              )}

              {isPremium && (
                <div style={{ position:"absolute", top:12, left:12, background:"linear-gradient(135deg,#6c63ff,#a29bfe)",
                  borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:800, color:"#fff" }}>
                  -20%
                </div>
              )}

              <div style={{ fontSize:36, marginBottom:10, textAlign:"center",
                animation: pkg.popular ? "float 2s ease-in-out infinite" : "none" }}>
                {pkg.icon}
              </div>

              <div style={{ textAlign:"center", marginBottom:14 }}>
                <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, fontWeight:600, letterSpacing:1, margin:0 }}>
                  {pkg.label.toUpperCase()}
                </p>
                <p style={{ color:"#00D4FF", fontWeight:900, fontSize:28, margin:"4px 0 0" }}>
                  {pkg.gems.toLocaleString()} <span style={{ fontSize:16 }}>🎫</span>
                </p>
              </div>

              <button className="cyber-btn" onClick={(e) => handleBuy({ ...pkg, price: discountedPrice }, e)}
                style={{ width:"100%", padding:"12px 0", borderRadius:12, fontWeight:800, fontSize:15,
                  background:"linear-gradient(135deg,#25D366,#128C7E)",
                  color:"#fff" }}>
                {isPremium
                  ? <>📱 Buy — <s style={{ opacity:0.5, fontSize:12 }}>₦{pkg.price.toLocaleString()}</s> ₦{discountedPrice.toLocaleString()}</>
                  : `📱 Buy on WhatsApp — ₦${pkg.price.toLocaleString()}`}
              </button>
            </div>
            );
          })}
        </div>

        {/* How to earn gems */}
        <div style={{ background:"rgba(37,211,102,.06)", border:"1px solid rgba(37,211,102,.3)", borderRadius:16, padding:20, marginTop:28 }}>
          <h3 style={{ color:"#25D366", fontWeight:800, fontSize:14, marginBottom:12 }}>📱 How to Buy Tokens</h3>
          {[
            ["1️⃣", "Tap any gem pack above"],
            ["2️⃣", "WhatsApp opens with your order details"],
            ["3️⃣", "Send the message to complete your order"],
            ["4️⃣", "Tokens are credited to your account after payment"],
          ].map(([step, label]) => (
            <div key={label} style={{ display:"flex", alignItems:"center", gap:12,
              padding:"8px 0", borderBottom:"1px solid rgba(255,255,255,.04)" }}>
              <span style={{ fontSize:16 }}>{step}</span>
              <span style={{ color:"rgba(255,255,255,.7)", fontSize:13 }}>{label}</span>
            </div>
          ))}
          <div style={{ marginTop:14, padding:"12px 16px", background:"rgba(37,211,102,.1)", borderRadius:10,
            display:"flex", alignItems:"center", gap:12 }}>
            <span style={{ fontSize:24 }}>📞</span>
            <div>
              <p style={{ color:"#25D366", fontWeight:800, fontSize:13, margin:0 }}>WhatsApp: 09036995642</p>
              <p style={{ color:"rgba(255,255,255,.5)", fontSize:11, margin:0 }}>Message us to purchase tokens</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
