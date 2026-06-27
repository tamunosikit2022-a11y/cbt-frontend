import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";

export default function ReferEarn() {
  const nav = useNavigate();
  const { student } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied,  setCopied]  = useState(false);

  const referralCode = student?.referral_code || "";
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;

  useEffect(() => {
    API.get("/referral/stats")
      .then(r => setStats(r.data))
      .catch(() => setStats({ count: student?.referral_count || 0, tokens_earned: 0, recent: [] }))
      .finally(() => setLoading(false));
  }, [student]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const el = document.createElement("textarea");
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWA = () => {
    const msg = encodeURIComponent(
      `🎓 Join me on Scholars Syndicate — the best JAMB prep app!\n\nPractice real past questions, battle friends in Arena, get AI tutoring and more.\n\nUse my link to get 15 FREE tokens when you sign up:\n${referralLink}`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const count         = stats?.count || student?.referral_count || 0;
  const tokensEarned  = stats?.tokens_earned || count * 20;
  const nextMilestone = count < 5 ? 5 : count < 10 ? 10 : count < 25 ? 25 : count < 50 ? 50 : null;
  const progress      = nextMilestone ? Math.round((count / nextMilestone) * 100) : 100;

  const TIERS = [
    { at:5,  reward:"100 bonus tokens + 🥉 Recruiter badge" },
    { at:10, reward:"250 bonus tokens + 🥈 Advocate badge"  },
    { at:25, reward:"500 bonus tokens + 🥇 Champion badge"  },
    { at:50, reward:"1,000 tokens + 👑 Legend badge"        },
  ];

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.header}>
        <button style={s.back} onClick={() => nav(-1)}>←</button>
        <div>
          <h1 style={s.title}>Refer &amp; Earn</h1>
          <p style={s.sub}>Invite friends, earn tokens together</p>
        </div>
      </div>

      <div style={s.content}>
        {/* HERO */}
        <div style={s.hero}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎁</div>
          <h2 style={s.heroTitle}>You earn 20 tokens per friend</h2>
          <p style={s.heroSub}>Your friend gets 15 free tokens when they sign up. Win-win.</p>
        </div>

        {/* STATS ROW */}
        <div style={s.statsRow}>
          <StatBox val={count}        label="Friends referred" color="#7C5CFF" />
          <StatBox val={tokensEarned} label="Tokens earned"    color="#10b981" />
          <StatBox val={count * 15}   label="Tokens gifted"    color="#f59e0b" />
        </div>

        {/* PROGRESS TO NEXT MILESTONE */}
        {nextMilestone && (
          <div style={s.milestoneCard}>
            <div style={s.milestoneTop}>
              <span style={s.milestoneLabel}>Next milestone: {nextMilestone} referrals</span>
              <span style={{ color:"#7C5CFF", fontWeight:700, fontSize:13 }}>{count}/{nextMilestone}</span>
            </div>
            <div style={s.barTrack}>
              <div style={{ ...s.barFill, width:`${progress}%` }} />
            </div>
            <div style={{ fontSize:12, color:"#64748b", marginTop:6 }}>
              {nextMilestone - count} more to unlock: <strong style={{ color:"#F1F5F9" }}>{TIERS.find(t => t.at === nextMilestone)?.reward}</strong>
            </div>
          </div>
        )}

        {/* REFERRAL LINK */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Your referral link</div>
          <div style={s.linkBox}>
            <span style={s.linkText}>{referralLink}</span>
            <button style={s.copyBtn} onClick={copy}>
              {copied ? "✅ Copied!" : "Copy"}
            </button>
          </div>
        </div>

        {/* SHARE BUTTONS */}
        <div style={s.shareRow}>
          <button style={{ ...s.shareBtn, background:"#25D366" }} onClick={shareWA}>
            📱 Share on WhatsApp
          </button>
          <button style={{ ...s.shareBtn, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.12)" }} onClick={copy}>
            🔗 Copy Link
          </button>
        </div>

        {/* HOW IT WORKS */}
        <div style={s.section}>
          <div style={s.sectionLabel}>How it works</div>
          <div style={s.steps}>
            {[
              { num:"1", text:"Share your link with a friend" },
              { num:"2", text:"They sign up using your link" },
              { num:"3", text:"They complete their first exam" },
              { num:"4", text:"You get 20 tokens, they get 15!" },
            ].map(step => (
              <div key={step.num} style={s.step}>
                <div style={s.stepNum}>{step.num}</div>
                <div style={s.stepText}>{step.text}</div>
              </div>
            ))}
          </div>
        </div>

        {/* MILESTONE TIERS */}
        <div style={s.section}>
          <div style={s.sectionLabel}>Milestone rewards</div>
          {TIERS.map(tier => (
            <div key={tier.at} style={{ ...s.tierRow, opacity: count >= tier.at ? 1 : 0.6 }}>
              <div style={{ ...s.tierCheck, background: count >= tier.at ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.06)" }}>
                {count >= tier.at ? "✅" : "🔒"}
              </div>
              <div style={{ flex:1 }}>
                <div style={s.tierAt}>{tier.at} referrals</div>
                <div style={s.tierReward}>{tier.reward}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatBox({ val, label, color }) {
  return (
    <div style={s.statBox}>
      <div style={{ fontSize:26, fontWeight:800, color }}>{val}</div>
      <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{label}</div>
    </div>
  );
}

const s = {
  page:          { minHeight:"100vh", background:"#0B1020", fontFamily:"'Plus Jakarta Sans',sans-serif", color:"#F1F5F9", paddingBottom:40 },
  header:        { background:"#141c2e", padding:"16px 20px", display:"flex", gap:14, alignItems:"flex-start", borderBottom:"1px solid rgba(255,255,255,0.07)", position:"sticky", top:0, zIndex:10 },
  back:          { background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:"#fff", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontSize:18, flexShrink:0 },
  title:         { fontSize:18, fontWeight:800, color:"#fff" },
  sub:           { fontSize:13, color:"#64748b", marginTop:2 },
  content:       { padding:"20px 16px", maxWidth:600, margin:"0 auto" },
  hero:          { background:"linear-gradient(135deg,rgba(124,92,255,0.15),rgba(16,185,129,0.08))", border:"1px solid rgba(124,92,255,0.2)", borderRadius:16, padding:"28px 20px", textAlign:"center", marginBottom:20 },
  heroTitle:     { fontSize:20, fontWeight:800, color:"#fff", marginBottom:6 },
  heroSub:       { fontSize:14, color:"#94a3b8", lineHeight:1.6 },
  statsRow:      { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 },
  statBox:       { background:"#141c2e", border:"1px solid rgba(255,255,255,0.08)", borderRadius:12, padding:"14px 10px", textAlign:"center" },
  milestoneCard: { background:"#141c2e", border:"1px solid rgba(124,92,255,0.2)", borderRadius:12, padding:"16px", marginBottom:20 },
  milestoneTop:  { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 },
  milestoneLabel:{ fontSize:13, color:"#94a3b8", fontWeight:600 },
  barTrack:      { height:6, background:"rgba(255,255,255,0.08)", borderRadius:3, overflow:"hidden" },
  barFill:       { height:6, background:"#7C5CFF", borderRadius:3, transition:"width .5s ease" },
  section:       { marginBottom:24 },
  sectionLabel:  { fontSize:11, fontWeight:700, color:"#4B5563", textTransform:"uppercase", letterSpacing:".06em", marginBottom:10 },
  linkBox:       { background:"#141c2e", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"12px 14px", display:"flex", gap:10, alignItems:"center" },
  linkText:      { flex:1, fontSize:12, color:"#94a3b8", wordBreak:"break-all" },
  copyBtn:       { background:"#7C5CFF", color:"#fff", border:"none", borderRadius:8, padding:"8px 14px", cursor:"pointer", fontWeight:700, fontSize:13, whiteSpace:"nowrap", fontFamily:"'Plus Jakarta Sans',sans-serif" },
  shareRow:      { display:"flex", gap:10, marginBottom:24, flexWrap:"wrap" },
  shareBtn:      { flex:1, minWidth:140, color:"#fff", border:"none", borderRadius:12, padding:"13px 16px", cursor:"pointer", fontWeight:700, fontSize:14, fontFamily:"'Plus Jakarta Sans',sans-serif" },
  steps:         { display:"flex", flexDirection:"column", gap:10 },
  step:          { display:"flex", gap:12, alignItems:"center", background:"#141c2e", borderRadius:10, padding:"12px 14px" },
  stepNum:       { width:28, height:28, borderRadius:"50%", background:"rgba(124,92,255,0.15)", color:"#7C5CFF", fontWeight:800, fontSize:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 },
  stepText:      { fontSize:14, color:"#e2e8f0" },
  tierRow:       { display:"flex", gap:12, alignItems:"center", padding:"12px 0", borderBottom:"1px solid rgba(255,255,255,0.05)" },
  tierCheck:     { width:36, height:36, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 },
  tierAt:        { fontSize:13, fontWeight:700, color:"#F1F5F9" },
  tierReward:    { fontSize:12, color:"#64748b", marginTop:2 },
};
