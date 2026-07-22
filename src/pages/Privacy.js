import { useNavigate } from "react-router-dom";

const SECTIONS = [
  {
    title: "1. What We Collect",
    body: [
      "When you register, we collect your name, email address, phone number, exam type (WAEC, NECO, JAMB, Post-UTME), and school/state where provided.",
      "When you use the platform, we automatically record your exam attempts, scores, answered questions, study streaks, XP, badges, and other activity needed to power analytics, leaderboards, and Arena features.",
      "If you subscribe to Premium, our payment partner Paystack processes your card/bank details directly — we never see or store your full card number.",
      "If you upload a profile photo or document, it is stored via Cloudinary, our media hosting provider.",
    ],
  },
  {
    title: "2. How We Use Your Data",
    body: [
      "To run your account: authentication, saving your progress, generating your performance analytics, and powering gamified features like Arena, Factions, and Seasons.",
      "To communicate with you: exam reminders, free-day event notices, parent-invite notifications, and support replies (including via WhatsApp if you contact us there).",
      "To improve the platform: understanding which topics students struggle with, which features are used, and fixing bugs.",
      "To display ads (where applicable): if you are on the Free plan, we may show ads served by Google AdSense to keep the platform free. Premium subscribers do not see ads.",
    ],
  },
  {
    title: "3. Third-Party Services We Use",
    body: [
      "Paystack — payment processing for Premium subscriptions, in Nigerian Naira.",
      "Supabase (PostgreSQL) — our database host, where your account and activity data is stored.",
      "Cloudinary — hosting for images and uploaded media.",
      "Google AdSense — may serve ads to free-tier users to support the platform. Google may use cookies to serve ads based on your visits to this and other sites. You can manage ad personalization at adssettings.google.com.",
      "Groq — powers our AI-generated questions, AI Tutor, and quiz generation features.",
    ],
  },
  {
    title: "4. Children & Minors",
    body: [
      "Scholars Syndicate is built for secondary school and university-entrance candidates, many of whom are minors. We do not knowingly collect more personal information from a minor than is necessary to provide the exam-prep service.",
      "If you are a parent or guardian and believe your child has shared data with us that you'd like removed, contact us using the details below and we will act on it.",
    ],
  },
  {
    title: "5. Your Choices",
    body: [
      "You can update your profile information at any time from your account settings.",
      "You can request account deletion by contacting us via WhatsApp or email — we will remove your personal data except where we're required to keep transaction records for legal/tax purposes.",
      "You can opt out of personalized advertising through your Google Ad Settings at any time.",
    ],
  },
  {
    title: "6. Data Security",
    body: [
      "We use industry-standard practices — encrypted connections (HTTPS), hashed passwords, and access-controlled databases — to protect your information. No system is 100% secure, but we work to keep your data safe.",
    ],
  },
  {
    title: "7. Changes to This Policy",
    body: [
      "We may update this policy as the platform grows. Material changes will be announced on the platform. Continued use after changes means you accept the updated policy.",
    ],
  },
  {
    title: "8. Contact Us",
    body: [
      "Questions about this policy or your data? Reach us on WhatsApp at 09036995642.",
    ],
  },
];

export default function Privacy() {
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
        <h1 style={{ fontSize:32, fontWeight:900, marginBottom:6 }}>Privacy Policy</h1>
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
