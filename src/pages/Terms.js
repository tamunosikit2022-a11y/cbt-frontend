import { useNavigate } from "react-router-dom";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: [
      "By creating an account or using Scholars Syndicate, you agree to these Terms of Service and our Privacy Policy. If you're under 18, a parent or guardian should review these terms with you.",
    ],
  },
  {
    title: "2. The Service",
    body: [
      "Scholars Syndicate is a gamified exam preparation platform covering WAEC, NECO, JAMB, and Post-UTME exams, including practice questions, timed exam simulations, analytics, flashcards, AI-generated questions, and multiplayer Arena modes.",
      "Core practice features are free. Optional Premium subscription unlocks additional content and removes ads, billed via Paystack in Nigerian Naira.",
    ],
  },
  {
    title: "3. Accounts",
    body: [
      "You're responsible for keeping your login credentials secure and for all activity on your account.",
      "You must provide accurate information when registering. We may suspend accounts used for cheating in ranked Arena modes, abuse of referral/token systems, or other violations of these terms.",
    ],
  },
  {
    title: "4. Payments & Subscriptions",
    body: [
      "Premium subscriptions are billed through Paystack. Prices are shown in Naira at checkout before you pay.",
      "Subscriptions do not auto-renew unless explicitly stated at checkout. Refunds are considered on a case-by-case basis — contact us via WhatsApp if you believe you were charged in error.",
      "In-app virtual items (tokens, gems, skills, cosmetics) have no real-world monetary value and cannot be exchanged for cash.",
    ],
  },
  {
    title: "5. Advertising",
    body: [
      "Free-tier accounts may see ads served through Google AdSense, which helps keep core features free for Nigerian students. Premium subscribers do not see ads.",
      "We don't control the specific content of ads served by Google's ad network beyond our own content policies.",
    ],
  },
  {
    title: "6. Acceptable Use",
    body: [
      "Don't use bots, scripts, or exploits to gain unfair advantage in Arena rankings, leaderboards, or token/gem systems.",
      "Don't share or resell your account, attempt to access other students' data, or disrupt the platform's operation.",
      "Don't upload content that is abusive, obscene, or infringes someone else's rights.",
    ],
  },
  {
    title: "7. Content & Intellectual Property",
    body: [
      "Practice questions, AI-generated content, badges, and platform design are owned by Scholars Syndicate or licensed to us. You may use them for personal study only, not redistribution or resale.",
    ],
  },
  {
    title: "8. Disclaimer",
    body: [
      "Predicted scores, AI-generated questions, and analytics are study aids, not guarantees of your actual exam outcome. Always cross-check critical exam information (dates, syllabus changes, registration) with the official WAEC, NECO, and JAMB boards.",
    ],
  },
  {
    title: "9. Changes to These Terms",
    body: [
      "We may update these terms as the platform evolves. Continued use after an update means you accept the revised terms.",
    ],
  },
  {
    title: "10. Contact",
    body: [
      "Questions about these terms? Reach us on WhatsApp at 09036995642.",
    ],
  },
];

export default function Terms() {
  const nav = useNavigate();

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", background:"var(--bg,#0A0A0F)", minHeight:"100vh", color:"#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box}
        .legal-section p{ margin:0 0 10px; color:rgba(255,255,255,.72); line-height:1.7; font-size:15px; }
        .legal-section p:last-child{ margin-bottom:0; }
      `}</style>

      <nav style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"14px 24px", background:"rgba(11,16,32,.96)", backdropFilter:"blur(20px)",
        position:"sticky", top:0, zIndex:100,
        borderBottom:"1px solid rgba(255,255,255,.07)",
      }}>
        <div style={{ fontWeight:900, fontSize:20, display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}
             onClick={() => nav("/")}>
          <span style={{ fontSize:24 }}>🎓</span>
          <span style={{ background:"linear-gradient(90deg,#7C5CFF,#5B8CFF)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Scholars Syndicate
          </span>
        </div>
        <button onClick={() => nav("/")} style={{
          padding:"9px 18px", background:"rgba(255,255,255,.06)", color:"#fff",
          border:"1px solid rgba(255,255,255,.12)", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer",
        }}>
          ← Back to Home
        </button>
      </nav>

      <div style={{ maxWidth:760, margin:"0 auto", padding:"48px 20px 80px" }}>
        <h1 style={{ fontSize:32, fontWeight:900, marginBottom:6 }}>Terms of Service</h1>
        <p style={{ color:"rgba(255,255,255,.45)", fontSize:13, marginBottom:36 }}>Last updated: July 2026</p>

        {SECTIONS.map((s, i) => (
          <div key={i} className="legal-section" style={{
            background:"#12121a", border:"1px solid rgba(255,255,255,.08)",
            borderRadius:16, padding:"22px 24px", marginBottom:16,
          }}>
            <h2 style={{ fontSize:18, fontWeight:800, marginBottom:12 }}>{s.title}</h2>
            {s.body.map((p, j) => <p key={j}>{p}</p>)}
          </div>
        ))}
      </div>

      <footer style={{ background:"#060b18", color:"rgba(255,255,255,.3)", textAlign:"center", padding:"24px 20px", fontSize:12, borderTop:"1px solid rgba(255,255,255,.05)" }}>
        <p>🎓 Scholars Syndicate · Built for Nigerian Students</p>
      </footer>
    </div>
  );
}
