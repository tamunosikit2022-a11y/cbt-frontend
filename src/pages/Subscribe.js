/**
 * Subscribe.js  →  route: /subscribe
 * ──────────────────────────────────────────────────────────────
 * Dedicated Premium subscription page.
 * Replaces the broken /upgrade → /tokens redirect.
 * Token top-ups remain on /tokens (separate product).
 *
 * Innovation source: UI Audit Fix 8 + my_app_innovation.docx
 *   Monetisation Philosophy: "Study to earn" — premium users
 *   progress faster and unlock luxury experiences.
 *
 * Created: June 2026
 */
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const WHATSAPP = "2349036995642";

const PLANS = [
  {
    id: "trial",   name: "Trial",   price: 100,  duration: "3 hours",
    color: "#e17055", tag: null,
    perks: ["Full exam access for 3 hrs","AI Tutor — 10 questions","Arena battles","All study features"],
  },
  {
    id: "daily",   name: "Daily",   price: 200,  duration: "24 hours",
    color: "#0984e3", tag: null,
    perks: ["All exam modes — unlimited","AI Tutor — 30 questions","Arena battles + ranked","Flashcards & Error Review"],
  },
  {
    id: "weekly",  name: "Weekly",  price: 700,  duration: "7 days",
    color: "#6c5ce7", tag: "POPULAR",
    perks: ["Everything in Daily","Gem discount — 20% off","Arena Priority matchmaking","Weakness Heatmap + Predicted Score","Study Planner — full access"],
  },
  {
    id: "monthly", name: "Monthly", price: 2000, duration: "30 days",
    color: "#FFC857", tag: "BEST VALUE",
    perks: ["Everything in Weekly","Exclusive monthly badge","Spirit evolution boost","School Faction bonus XP","Early access to new features"],
  },
  {
    id: "termly",  name: "Termly",  price: 5000, duration: "3 months",
    color: "#00D084", tag: null,
    perks: ["Everything in Monthly","3-month streak rewards","Legendary Spirit unlock","Priority AI Tutor responses","Personalised exam schedule"],
  },
];

const FREE_LIMITS = [
  "5 exam questions per session",
  "AI Tutor — 3 questions/day",
  "Arena — 2 battles/day",
  "Basic analytics only",
  "No Spirit evolution",
];

const TESTIMONIALS = [
  { name:"Chidera A.", score:"305/400", text:"I went from 210 to 305 in 6 weeks. The Arena battles kept me sharp!" },
  { name:"Fatima B.", score:"289/400", text:"The AI Tutor explained things my teacher couldn't. Worth every naira." },
  { name:"Emeka O.", score:"320/400", text:"Top 3 in my school on the leaderboard. This app changed everything." },
];

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:#0A0F1E;font-family:'Plus Jakarta Sans',sans-serif}
  @keyframes sub-fade{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
  @keyframes sub-glow{0%,100%{box-shadow:0 0 20px rgba(124,92,255,.3)}50%{box-shadow:0 0 50px rgba(124,92,255,.7)}}
  .sub-card{border-radius:20px;transition:all .25s ease;cursor:pointer;position:relative;overflow:hidden}
  .sub-card:hover{transform:translateY(-3px)}
  .sub-card.selected{outline:2px solid var(--color)}
  .sub-wa-btn{border:none;cursor:pointer;border-radius:14px;font-weight:800;font-size:16px;
    padding:16px;width:100%;transition:all .2s ease;
    background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;
    box-shadow:0 4px 20px rgba(37,211,102,.3)}
  .sub-wa-btn:hover{transform:translateY(-2px);box-shadow:0 8px 30px rgba(37,211,102,.45)}
  .sub-wa-btn:active{transform:scale(.97)}
`;

export default function Subscribe() {
  const nav = useNavigate();
  const { student, refreshStudent } = useAuth();
  const [selected, setSelected] = useState(PLANS[2]); // default: weekly
  const [step, setStep] = useState("plans"); // plans | activate
  const [keyCode, setKeyCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [justActivated, setJustActivated] = useState(false);

  // Detect when polling flips premium — show celebration
  const prevPremium = useRef(student?.is_premium);
  useEffect(() => {
    if (!prevPremium.current && student?.is_premium) {
      setJustActivated(true);
    }
    prevPremium.current = student?.is_premium;
  }, [student?.is_premium]);

  // Format key input automatically: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
  const handleKeyInput = (val) => {
    const clean = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    let formatted = "";
    for (let i = 0; i < clean.length && i < 32; i++) {
      if (i > 0 && i % 8 === 0) formatted += "-";
      formatted += clean[i];
    }
    setKeyCode(formatted);
  };

  const activateKey = async () => {
    const trimmed = keyCode.trim();
    if (!trimmed) return setError("Please enter your activation key.");
    if (trimmed.length < 35) return setError(`Key too short — should be 35 characters. You entered ${trimmed.length}.`);
    setError(""); setActivating(true);
    try {
      const res = await API.post("/auth/activate-key", { key_code: trimmed });
      setSuccess(res.data.message || "Premium activated!");
      await refreshStudent();
      setTimeout(() => nav("/dashboard"), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid key. Check it carefully and try again.");
    } finally { setActivating(false); }
  };

  const openWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hi! I want to subscribe to Scholars Syndicate.\n\n✅ Plan: *${selected.name}* (${selected.duration})\n💰 Price: ₦${selected.price.toLocaleString()}\n\nPlease activate my account.`
    );
    window.open(`https://wa.me/${WHATSAPP}?text=${msg}`, "_blank");
  };

  // Celebration screen — fires once when premium is detected by background poll
  if (justActivated) {
    return (
      <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center",
        justifyContent:"center", textAlign:"center", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#F1F5F9" }}>
        <style>{CSS}</style>
        <div style={{ maxWidth:360, width:"100%", padding:28 }}>
          <div style={{ fontSize:64, marginBottom:12 }}>🎉👑</div>
          <h1 style={{ fontSize:26, fontWeight:900, marginBottom:8 }}>You're Premium!</h1>
          <p style={{ color:"#A8B8D8", fontSize:14, lineHeight:1.7, marginBottom:20 }}>
            Full access is unlocked — unlimited exams, AI Tutor, Arena, and everything else.
          </p>
          <button onClick={() => nav("/dashboard")} className="sub-wa-btn" style={{ background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)" }}>
            Go to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  if (step === "activate") {
    return (
      <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#F1F5F9" }}>
        <style>{CSS}</style>
        <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 20px",
          borderBottom:"1px solid rgba(255,255,255,.06)", background:"var(--surface)" }}>
          <button onClick={() => setStep("plans")} style={{ background:"none", border:"none", color:"#A8B8D8",
            fontSize:22, cursor:"pointer", padding:"4px 8px", borderRadius:8, minWidth:44, minHeight:44 }}>←</button>
          <span style={{ fontWeight:800, fontSize:18 }}>Enter Activation Key</span>
        </div>
        <div style={{ padding:"24px 20px", maxWidth:480, margin:"0 auto" }}>
          <p style={{ color:"#A8B8D8", marginBottom:8, fontSize:13, textAlign:"center" }}>
            Your key is 35 characters, format:
          </p>
          <div style={{ fontFamily:"monospace", fontSize:13, background:"rgba(255,255,255,.05)", borderRadius:8,
            padding:"8px 12px", marginBottom:16, color:"#7C5CFF", fontWeight:700, letterSpacing:2, textAlign:"center" }}>
            XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
          </div>
          <input
            style={{ width:"100%", padding:"14px 12px", border:"1px solid rgba(255,255,255,.12)", borderRadius:12,
              fontSize:15, textAlign:"center", letterSpacing:2, fontFamily:"monospace", boxSizing:"border-box",
              marginBottom:8, background:"rgba(255,255,255,.04)", color:"#F1F5F9" }}
            placeholder="Paste or type your key here"
            value={keyCode}
            onChange={e => handleKeyInput(e.target.value)}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
          />
          <div style={{ fontSize:12, color: keyCode.length === 35 ? "#00D084" : "#7B8AB8", marginBottom:14, textAlign:"center", fontWeight:600 }}>
            {keyCode.length}/35 characters {keyCode.length === 35 ? "✓ Ready" : ""}
          </div>
          {error   && <div style={{ color:"#FF5A5F", fontSize:13, marginBottom:12, background:"rgba(255,90,95,.08)", padding:"10px 14px", borderRadius:8 }}>{error}</div>}
          {success && <div style={{ color:"#00D084", fontSize:14, fontWeight:700, marginBottom:12 }}>✅ {success}</div>}
          <button
            className="sub-wa-btn"
            style={{ background: keyCode.length === 35 ? "linear-gradient(135deg,#00D084,#00b894)" : "rgba(255,255,255,.08)", opacity: activating ? 0.7 : 1 }}
            onClick={activateKey}
            disabled={activating || keyCode.length < 35}>
            {activating ? "Activating..." : "Activate Premium 👑"}
          </button>
          <p style={{ marginTop:16, fontSize:13, color:"#7B8AB8", textAlign:"center" }}>
            Don't have a key yet?{" "}
            <button onClick={() => setStep("plans")} style={{ background:"none", border:"none", color:"#7C5CFF", fontWeight:700, cursor:"pointer", padding:0, fontSize:13 }}>
              See plans
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#F1F5F9" }}>
      <style>{CSS}</style>

      {/* Top bar */}
      <div style={{ display:"flex", alignItems:"center", gap:12, padding:"16px 20px",
        borderBottom:"1px solid rgba(255,255,255,.06)", background:"var(--surface)" }}>
        <button onClick={() => nav(-1)} style={{ background:"none", border:"none", color:"#A8B8D8",
          fontSize:22, cursor:"pointer", padding:"4px 8px", borderRadius:8, minWidth:44, minHeight:44,
          display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
        <span style={{ fontWeight:800, fontSize:18 }}>Go Premium</span>
      </div>

      <div style={{ padding:"24px 20px", maxWidth:480, margin:"0 auto", animation:"sub-fade .5s ease" }}>

        {/* Hero */}
        <div style={{ textAlign:"center", marginBottom:32 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🌌</div>
          <h1 style={{ fontSize:26, fontWeight:900, marginBottom:8 }}>
            Unlock the Full Eduverse
          </h1>
          <p style={{ color:"#A8B8D8", fontSize:14, lineHeight:1.7 }}>
            Premium users progress faster, unlock exclusive cosmetics, and enjoy the full Scholars Syndicate experience.
          </p>
        </div>

        {/* Free vs Premium comparison */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:28 }}>
          <div style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:16, padding:16 }}>
            <p style={{ color:"#7B8AB8", fontWeight:800, fontSize:11, letterSpacing:1, marginBottom:12 }}>FREE</p>
            {FREE_LIMITS.map((l, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ color:"#FF5A5F", fontSize:14 }}>✕</span>
                <span style={{ color:"#A8B8D8", fontSize:12 }}>{l}</span>
              </div>
            ))}
          </div>
          <div style={{ background:"rgba(124,92,255,.08)", border:"1px solid rgba(124,92,255,.3)", borderRadius:16, padding:16 }}>
            <p style={{ color:"#7C5CFF", fontWeight:800, fontSize:11, letterSpacing:1, marginBottom:12 }}>PREMIUM</p>
            {["Unlimited exams","Unlimited AI Tutor","Unlimited Arena","Full analytics suite","Spirit evolution"].map((l, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                <span style={{ color:"#00D084", fontSize:14 }}>✓</span>
                <span style={{ color:"#C8D3F5", fontSize:12 }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Plan selector */}
        <h2 style={{ fontSize:16, fontWeight:800, marginBottom:14 }}>Choose Your Plan</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
          {PLANS.map(plan => {
            const isSel = selected.id === plan.id;
            return (
              <div key={plan.id} className={`sub-card ${isSel ? "selected" : ""}`}
                onClick={() => setSelected(plan)}
                style={{
                  "--color": plan.color,
                  background: isSel ? `${plan.color}10` : "rgba(255,255,255,.03)",
                  border: `1px solid ${isSel ? plan.color + "66" : "rgba(255,255,255,.08)"}`,
                  padding:"16px 18px",
                }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:44, height:44, borderRadius:12, display:"flex", alignItems:"center",
                      justifyContent:"center", background:`${plan.color}22`, fontSize:20 }}>
                      {plan.id==="trial"?"⚡":plan.id==="daily"?"☀️":plan.id==="weekly"?"🌟":plan.id==="monthly"?"👑":"🏆"}
                    </div>
                    <div>
                      <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ fontWeight:800, fontSize:15 }}>{plan.name}</span>
                        {plan.tag && (
                          <span style={{ background:`${plan.color}22`, color:plan.color,
                            fontSize:9, fontWeight:800, padding:"2px 6px", borderRadius:6, letterSpacing:.5 }}>
                            {plan.tag}
                          </span>
                        )}
                      </div>
                      <span style={{ color:"#A8B8D8", fontSize:12 }}>{plan.duration}</span>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <span style={{ fontWeight:900, fontSize:18, color:plan.color }}>
                      ₦{plan.price.toLocaleString()}
                    </span>
                  </div>
                </div>
                {isSel && (
                  <div style={{ marginTop:12, paddingTop:12, borderTop:`1px solid ${plan.color}22` }}>
                    {plan.perks.map((p, i) => (
                      <div key={i} style={{ display:"flex", gap:8, alignItems:"center", marginBottom:5 }}>
                        <span style={{ color:plan.color }}>✓</span>
                        <span style={{ color:"#C8D3F5", fontSize:13 }}>{p}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <button className="sub-wa-btn" onClick={openWhatsApp}>
          📱 Activate {selected.name} Plan — ₦{selected.price.toLocaleString()}
        </button>
        <p style={{ color:"#7B8AB8", fontSize:12, textAlign:"center", marginTop:10 }}>
          Activation via WhatsApp · Manual verification · Usually within minutes
        </p>
        <button onClick={() => setStep("activate")}
          style={{ width:"100%", marginTop:10, padding:"12px", background:"transparent", border:"1px solid rgba(124,92,255,.4)",
            color:"#7C5CFF", borderRadius:12, fontWeight:700, fontSize:13, cursor:"pointer" }}>
          I already have a key →
        </button>

        {/* Testimonials */}
        <h2 style={{ fontSize:15, fontWeight:800, margin:"28px 0 14px" }}>What Students Say</h2>
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{ background:"rgba(255,255,255,.03)", border:"1px solid rgba(255,255,255,.07)",
              borderRadius:14, padding:14 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontWeight:700, color:"#C8D3F5", fontSize:13 }}>{t.name}</span>
                <span style={{ color:"#00D084", fontWeight:800, fontSize:12 }}>JAMB {t.score}</span>
              </div>
              <p style={{ color:"#A8B8D8", fontSize:13, lineHeight:1.6 }}>"{t.text}"</p>
            </div>
          ))}
        </div>

        {/* Token store link */}
        <div style={{ marginTop:24, padding:14, background:"rgba(91,140,255,.06)",
          border:"1px solid rgba(91,140,255,.2)", borderRadius:14, textAlign:"center" }}>
          <p style={{ color:"#A8B8D8", fontSize:13, marginBottom:8 }}>
            Looking to top up Gems or Tokens instead?
          </p>
          <button onClick={() => nav("/store")}
            style={{ background:"none", border:"1px solid rgba(91,140,255,.4)", color:"#5B8CFF",
              borderRadius:10, padding:"8px 18px", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            Go to Store →
          </button>
        </div>

        <div style={{ height:40 }} />
      </div>
    </div>
  );
}
