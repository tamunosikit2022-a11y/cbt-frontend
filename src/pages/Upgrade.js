import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const WHATSAPP = "2349036995642";

// ── PLANS ─────────────────────────────────────────────────
const PLANS = [
  {
    id:       "hourly",
    name:     "Trial",
    price:    "₦100",
    duration: "3 hours",
    color:    "#e17055",
    trial:    true,
    desc:     "Try everything — zero risk",
  },
  {
    id:       "daily",
    name:     "Daily",
    price:    "₦200",
    duration: "24 hours",
    color:    "#0984e3",
    desc:     "One full day of unlimited access",
  },
  {
    id:       "weekly",
    name:     "Weekly",
    price:    "₦700",
    duration: "7 days",
    color:    "#6c63ff",
    desc:     "Best for last-minute prep",
  },
  {
    id:       "monthly",
    name:     "Monthly",
    price:    "₦2,000",
    duration: "30 days",
    color:    "#00b894",
    popular:  true,
    desc:     "Most popular — serious prep",
  },
  {
    id:       "yearly",
    name:     "Yearly",
    price:    "₦15,000",
    duration: "365 days",
    color:    "#e17055",
    desc:     "Best value — save ₦9,000",
  },
];

// ── PREMIUM FEATURES ──────────────────────────────────────
const FREE_FEATURES = [
  "JAMB practice — limited subjects",
  "10 questions per daily challenge",
  "Arena battles (join only)",
  "Basic score report",
];

const PREMIUM_FEATURES = [
  { icon:"🏆", text:"Full 5000+ question bank — all subjects & years" },
  { icon:"📊", text:"Deep analytics — weak topic heatmap & accuracy trends" },
  { icon:"💡", text:"Full explanations for every question" },
  { icon:"🎯", text:"AI-powered weakness mode — targets your gaps only" },
  { icon:"🏫", text:"All Post-UTME formats — UNILAG, UI, OAU, UNIPORT & 11 more" },
  { icon:"🔁", text:"Error review — redo every wrong answer smartly" },
  { icon:"📂", text:"Resume exam — save & continue anytime" },
  { icon:"🏟️", text:"Arena — create rooms, host battles, all modes" },
  { icon:"🎓", text:"Predicted JAMB score with confidence rating" },
  { icon:"🏛", text:"Admission checker — real cut-off comparison" },
  { icon:"🧠", text:"Exam personality profile & smart tips" },
  { icon:"💪", text:"Beat Yourself — break your personal best tracker" },
  { icon:"🥇", text:"Premium badge on leaderboard" },
  { icon:"⚡", text:"2× XP on every exam and challenge" },
  { icon:"📅", text:"Spaced repetition — smart review reminders" },
];

export default function Upgrade() {
  const { student, refreshStudent } = useAuth();
  const nav = useNavigate();

  const [selected,   setSelected]   = useState("monthly");
  const [step,       setStep]       = useState("plans"); // plans | pay | activate
  const [keyCode,    setKeyCode]    = useState("");
  const [activating, setActivating] = useState(false);
  const [error,      setError]      = useState("");
  const [success,    setSuccess]    = useState("");
  const [justActivated, setJustActivated] = useState(false);

  // Detect when polling flips premium — show celebration
  const prevPremium = useRef(student?.is_premium);
  useEffect(() => {
    if (!prevPremium.current && student?.is_premium) {
      setJustActivated(true);
    }
    prevPremium.current = student?.is_premium;
  }, [student?.is_premium]);

  const plan = PLANS.find(p => p.id === selected);

  const waMessage = () => {
    const msg = `Hello! I want to upgrade to Scholars CBT Premium.\n\nPlan: ${plan.name} (${plan.price} / ${plan.duration})\nEmail: ${student?.email}\nName: ${student?.full_name}\n\nI have made payment. Please send my activation key.`;
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  };

  // Format key input automatically as user types: XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX
  const handleKeyInput = (val) => {
    // Strip everything except alphanumeric
    const clean = val.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    // Insert dashes at positions 8, 16, 24
    let formatted = "";
    for (let i = 0; i < clean.length && i < 32; i++) {
      if (i > 0 && i % 8 === 0) formatted += "-";
      formatted += clean[i];
    }
    setKeyCode(formatted);
  };

  const activate = async () => {
    const trimmed = keyCode.trim();
    if (!trimmed) return setError("Please enter your activation key.");
    if (trimmed.length < 35) return setError(`Key too short — should be 35 characters (XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX). You entered ${trimmed.length}.`);
    setError(""); setActivating(true);
    try {
      const res = await API.post("/auth/activate-key", { key_code: trimmed });
      setSuccess(res.data.message || "Premium activated!");
      await refreshStudent();
      setTimeout(() => nav("/dashboard"), 2000);
    } catch (err) {
      setError(err.response?.data?.error || "Invalid key. Check it carefully and try again.");
    } finally { setActivating(false); }
  };

  // Celebration screen — fires once when premium is detected by background poll
  if (justActivated) {
    return (
      <div style={{ ...s.page, display:"flex", alignItems:"center", justifyContent:"center", textAlign:"center" }}>
        <div style={{ maxWidth:360, width:"100%", padding:28 }}>
          <div style={{ fontSize:72, marginBottom:16, animation:"bounce 0.6s ease" }}>🎉</div>
          <div style={{ fontSize:44, marginBottom:8 }}>👑</div>
          <h1 style={{ fontSize:28, fontWeight:900, color:"#fff", marginBottom:8 }}>You're Premium!</h1>
          <p style={{ color:"var(--text-muted)", fontSize:14, lineHeight:1.7, marginBottom:24 }}>
            Your account just upgraded. Full access is now unlocked — explanations, weakness mode, Arena hosting, and everything else.
          </p>
          <div style={{ background:"rgba(108,99,255,0.15)", border:"1.5px solid #6c63ff44", borderRadius:16, padding:"16px 14px", marginBottom:24 }}>
            {["📊 Full Analytics", "🔁 Error Review Bank", "🏛️ Admission Checker", "🎯 Predicted JAMB Score", "⚡ 2× XP on all exams", "🏟️ Create Arena Rooms"].map((f, i) => (
              <div key={i} style={{ color:"#a29bfe", fontSize:13, fontWeight:700, padding:"5px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>{f}</div>
            ))}
          </div>
          <button
            onClick={() => nav("/dashboard")}
            style={{ width:"100%", padding:"14px 0", background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", border:"none", borderRadius:13, fontWeight:800, fontSize:16, cursor:"pointer", boxShadow:"0 6px 20px rgba(108,99,255,0.4)" }}>
            Start Using Premium →
          </button>
        </div>
      </div>
    );
  }

  // Already premium screen
  if (student?.is_premium) {
    const expiry = new Date(student.premium_expires_at);
    const daysLeft = Math.max(0, Math.ceil((expiry - new Date()) / (1000 * 60 * 60 * 24)));
    return (
      <div style={s.page}>
        <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>
        <div style={s.premCard}>
          <div style={{ fontSize:60 }}>👑</div>
          <h2 style={s.premTitle}>You're Premium!</h2>
          <div style={s.premPill}>{daysLeft} days remaining</div>
          <p style={{ color:"#636e72", marginTop:8, fontSize:14 }}>
            Expires {expiry.toLocaleDateString("en-NG", { dateStyle:"long" })}
          </p>
          <div style={s.premFeatures}>
            {PREMIUM_FEATURES.slice(0,6).map((f,i) => (
              <div key={i} style={s.premFeatureRow}>
                <span>{f.icon}</span>
                <span style={{ fontSize:13 }}>{f.text}</span>
              </div>
            ))}
          </div>
          <button style={{ ...s.btn, background:"#6c63ff", marginTop:16 }} onClick={() => nav("/dashboard")}>
            Keep Practising →
          </button>
          <button style={{ ...s.btn, background:"#dfe6e9", color:"#636e72", marginTop:8 }} onClick={() => setStep("activate")}>
            Extend with another key
          </button>
        </div>
        {step === "activate" && <ActivateBox keyCode={keyCode} onKeyInput={handleKeyInput} activate={activate} activating={activating} error={error} success={success} waMessage={waMessage} />}
      </div>
    );
  }

  return (
    <div style={s.page}>
      <button style={s.back} onClick={() => step === "plans" ? nav(-1) : setStep("plans")}>
        ← {step === "plans" ? "Back" : "Change plan"}
      </button>

      {/* ── STEP 1: PLANS ── */}
      {step === "plans" && (
        <>
          <div style={s.heroSection}>
            <div style={{ fontSize:44 }}>👑</div>
            <h1 style={s.heroTitle}>Go Premium</h1>
            <p style={s.heroSub}>Everything you need to crush JAMB & Post-UTME</p>
            <div style={{ display:"inline-block", background:"#e1700518", border:"1.5px solid #e1700560", borderRadius:20, padding:"5px 14px", marginTop:8, fontSize:12, fontWeight:700, color:"#e17055" }}>
              🔥 200+ students upgraded this week
            </div>
          </div>

          {/* Free vs Premium comparison */}
          <div style={s.compareBox}>
            <div style={s.compareCol}>
              <div style={s.compareHeader}>Free</div>
              {FREE_FEATURES.map((f,i) => (
                <div key={i} style={s.compareRow}>
                  <span style={{ color:"#e17055" }}>✗</span>
                  <span style={{ fontSize:12, color:"#636e72" }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{ ...s.compareCol, borderLeft:"1px solid #f0f0f0" }}>
              <div style={{ ...s.compareHeader, color:"#6c63ff" }}>Premium 👑</div>
              {PREMIUM_FEATURES.slice(0,4).map((f,i) => (
                <div key={i} style={s.compareRow}>
                  <span style={{ color:"#00b894" }}>✓</span>
                  <span style={{ fontSize:12 }}>{f.text}</span>
                </div>
              ))}
              <div style={{ fontSize:11, color:"#6c63ff", fontWeight:700, paddingLeft:4, marginTop:4 }}>+ {PREMIUM_FEATURES.length - 4} more features</div>
            </div>
          </div>

          {/* Plans */}
          <h3 style={s.sectionLabel}>Choose Your Plan</h3>
          <div style={{ background:"#e1700510", border:"1.5px solid #e1700540", borderRadius:12, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:20 }}>⚡</span>
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:"#e17055" }}>Not sure? Start with the ₦100 Trial</div>
              <div style={{ fontSize:11, color:"#636e72" }}>3 hours of full Premium access — less than a sachet of water</div>
            </div>
          </div>
          <div style={s.plansGrid}>
            {PLANS.map(p => (
              <div key={p.id}
                style={{ ...s.planCard, borderColor: selected === p.id ? p.color : "#f0f0f0", background: selected === p.id ? p.color + "12" : "#fff" }}
                onClick={() => setSelected(p.id)}>
                {p.popular && <div style={{ ...s.popularBadge, background: p.color }}>⭐ Most Popular</div>}
                {p.trial  && <div style={{ ...s.popularBadge, background: p.color }}>🔥 Try First</div>}
                <div style={{ fontWeight:900, fontSize:20, color: p.color }}>{p.price}</div>
                <div style={{ fontWeight:800, fontSize:14, marginTop:2 }}>{p.name}</div>
                <div style={{ fontSize:11, color:"#636e72" }}>{p.duration}</div>
                <div style={{ fontSize:11, color:"#b2bec3", marginTop:4 }}>{p.desc}</div>
              </div>
            ))}
          </div>

          {/* All features list */}
          <h3 style={s.sectionLabel}>Everything Included</h3>
          <div style={s.featuresGrid}>
            {PREMIUM_FEATURES.map((f,i) => (
              <div key={i} style={s.featureItem}>
                <span style={{ fontSize:18 }}>{f.icon}</span>
                <span style={{ fontSize:12 }}>{f.text}</span>
              </div>
            ))}
          </div>

          <button style={{ ...s.btn, background: plan.color, fontSize:16 }} onClick={() => setStep("pay")}>
            Get {plan.name} — {plan.price} →
          </button>

          <button style={{ ...s.btn, background:"transparent", color:"#6c63ff", border:"2px solid #6c63ff", marginTop:8 }}
            onClick={() => setStep("activate")}>
            I already have a key
          </button>
        </>
      )}

      {/* ── STEP 2: PAY ── */}
      {step === "pay" && (
        <div style={s.card}>
          <div style={{ fontSize:48 }}>💳</div>
          <h2 style={s.cardTitle}>How to Pay</h2>
          <div style={{ background: plan.color + "15", border:`2px solid ${plan.color}`, borderRadius:12, padding:"12px 16px", marginBottom:20, textAlign:"center" }}>
            <div style={{ fontWeight:900, fontSize:22, color:plan.color }}>{plan.price}</div>
            <div style={{ fontSize:13, color:"#636e72" }}>{plan.name} · {plan.duration}</div>
          </div>

          {[
            ["1","Transfer payment",   `Send ${plan.price} to our account via bank transfer or USSD`],
            ["2","Send proof",         "Screenshot your receipt and send on WhatsApp"],
            ["3","Get your key",       "We verify and send your unique 35-character activation key"],
            ["4","Activate instantly", "Enter the key below — your account upgrades immediately"],
          ].map(([num, title, desc]) => (
            <div key={num} style={s.step}>
              <span style={{ ...s.stepNum, background: plan.color }}>{num}</span>
              <div style={{ textAlign:"left" }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{title}</div>
                <div style={{ fontSize:12, color:"#636e72" }}>{desc}</div>
              </div>
            </div>
          ))}

          <a href={waMessage()} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
            <button style={{ ...s.btn, background:"#25D366", fontSize:15, marginBottom:10 }}>
              📱 WhatsApp Us — Pay {plan.price}
            </button>
          </a>
          <button style={{ ...s.btn, background:"#6c63ff" }} onClick={() => setStep("activate")}>
            I paid — Enter my key →
          </button>
        </div>
      )}

      {/* ── STEP 3: ACTIVATE ── */}
      {step === "activate" && (
        <ActivateBox keyCode={keyCode} onKeyInput={handleKeyInput} activate={activate} activating={activating} error={error} success={success} waMessage={waMessage} />
      )}
    </div>
  );
}

// ── ACTIVATE BOX COMPONENT ────────────────────────────────
function ActivateBox({ keyCode, onKeyInput, activate, activating, error, success, waMessage }) {
  return (
    <div style={s.card}>
      <div style={{ fontSize:48 }}>🔑</div>
      <h2 style={s.cardTitle}>Enter Activation Key</h2>
      <p style={{ color:"#636e72", marginBottom:8, fontSize:13 }}>
        Your key is 35 characters in this format:
      </p>
      <div style={s.keyFormat}>XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX</div>

      <input
        style={s.keyInput}
        placeholder="Paste or type your key here"
        value={keyCode}
        onChange={e => onKeyInput(e.target.value)}
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
      />

      <div style={{ fontSize:12, color: keyCode.length === 35 ? "#00b894" : "#b2bec3", marginBottom:12, textAlign:"center", fontWeight:600 }}>
        {keyCode.length}/35 characters {keyCode.length === 35 ? "✓ Ready" : ""}
      </div>

      {error   && <div style={s.error}>{error}</div>}
      {success && <div style={s.successMsg}>✅ {success}</div>}

      <button
        style={{ ...s.btn, background: keyCode.length === 35 ? "#00b894" : "#b2bec3", opacity: activating ? 0.7 : 1 }}
        onClick={activate}
        disabled={activating || keyCode.length < 35}>
        {activating ? "Activating..." : "Activate Premium 👑"}
      </button>

      <div style={{ marginTop:16, fontSize:13, color:"#636e72", textAlign:"center" }}>
        Don't have a key?{" "}
        <a href={waMessage()} target="_blank" rel="noreferrer" style={{ color:"#6c63ff", fontWeight:700 }}>
          Contact us on WhatsApp
        </a>
      </div>
    </div>
  );
}

// ── STYLES ────────────────────────────────────────────────
const s = {
  page:         { maxWidth:520, margin:"0 auto", padding:"20px 16px 60px", fontFamily:"'Segoe UI',sans-serif", background:"#f8f9fa", minHeight:"100vh" },
  back:         { background:"none", border:"none", color:"#6c63ff", fontWeight:700, cursor:"pointer", fontSize:14, marginBottom:16, padding:0 },
  heroSection:  { textAlign:"center", padding:"24px 0 20px" },
  heroTitle:    { fontSize:30, fontWeight:900, margin:"8px 0 4px", color:"#2d3436" },
  heroSub:      { color:"#636e72", fontSize:14 },
  compareBox:   { background:"#fff", borderRadius:16, display:"grid", gridTemplateColumns:"1fr 1fr", marginBottom:24, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" },
  compareCol:   { padding:"14px 12px" },
  compareHeader:{ fontWeight:800, fontSize:14, marginBottom:10, color:"#2d3436" },
  compareRow:   { display:"flex", gap:8, alignItems:"flex-start", marginBottom:7 },
  sectionLabel: { fontSize:13, fontWeight:800, color:"#b2bec3", letterSpacing:1, textTransform:"uppercase", marginBottom:12, marginTop:4 },
  plansGrid:    { display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))", gap:10, marginBottom:24 },
  planCard:     { border:"2px solid", borderRadius:14, padding:"14px 12px", textAlign:"center", cursor:"pointer", position:"relative", background:"#fff", transition:"all 0.15s" },
  popularBadge: { position:"absolute", top:-10, left:"50%", transform:"translateX(-50%)", color:"#fff", fontSize:10, padding:"2px 10px", borderRadius:20, whiteSpace:"nowrap", fontWeight:700 },
  featuresGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:24 },
  featureItem:  { display:"flex", gap:8, alignItems:"flex-start", background:"#fff", borderRadius:10, padding:"10px 10px", boxShadow:"0 1px 4px rgba(0,0,0,0.05)" },
  card:         { background:"#fff", borderRadius:18, padding:"28px 22px", textAlign:"center", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", marginTop:8 },
  cardTitle:    { fontSize:20, fontWeight:800, marginBottom:16 },
  step:         { display:"flex", gap:12, alignItems:"flex-start", marginBottom:14, textAlign:"left" },
  stepNum:      { color:"#fff", borderRadius:"50%", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, flexShrink:0 },
  btn:          { width:"100%", padding:"14px", border:"none", borderRadius:12, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer" },
  keyFormat:    { fontFamily:"monospace", fontSize:13, background:"#f4f6fb", borderRadius:8, padding:"8px 12px", marginBottom:14, color:"#6c63ff", fontWeight:700, letterSpacing:2, textAlign:"center" },
  keyInput:     { width:"100%", padding:"14px 12px", border:"2px solid #dfe6e9", borderRadius:12, fontSize:16, textAlign:"center", letterSpacing:2, fontFamily:"monospace", boxSizing:"border-box", marginBottom:6, background:"#fafafa" },
  error:        { color:"#e17055", fontSize:13, marginBottom:10, background:"#fff5f4", padding:"10px 14px", borderRadius:8, textAlign:"left" },
  successMsg:   { color:"#00b894", fontSize:14, fontWeight:700, marginBottom:10 },
  premCard:     { background:"#fff", borderRadius:18, padding:"28px 22px", textAlign:"center", boxShadow:"0 4px 24px rgba(0,0,0,0.08)", marginTop:8 },
  premTitle:    { fontSize:24, fontWeight:900, color:"#2d3436", margin:"8px 0 4px" },
  premPill:     { background:"linear-gradient(135deg,#6c63ff,#a29bfe)", color:"#fff", borderRadius:20, padding:"6px 18px", fontWeight:800, fontSize:14, display:"inline-block" },
  premFeatures: { background:"#f8f9fa", borderRadius:12, padding:"14px 16px", marginTop:16, textAlign:"left" },
  premFeatureRow:{ display:"flex", gap:10, alignItems:"center", marginBottom:8, fontSize:13 },
};
