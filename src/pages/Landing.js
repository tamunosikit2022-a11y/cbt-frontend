import { useNavigate } from "react-router-dom";

const FEATURES = [
  { icon: "📚", title: "JAMB Practice",        desc: "Full question bank — all subjects, all years" },
  { icon: "🏫", title: "Post-UTME",             desc: "UNILAG, UI, UNIBEN, OAU and more" },
  { icon: "⏱️", title: "Real Exam Mode",        desc: "Timed simulation of the actual exam" },
  { icon: "📊", title: "Analytics",             desc: "Know your weak topics and improve faster" },
  { icon: "🔁", title: "Error Review",          desc: "Practice only the questions you got wrong" },
  { icon: "🏟️", title: "Scholars Arena",        desc: "Battle friends live — 1v1, squads, 50-player royale" },
  { icon: "🎯", title: "Daily Challenge",       desc: "New 10-question challenge every day" },
  { icon: "🧠", title: "Spaced Repetition",     desc: "Smart study system that maximises retention" },
  { icon: "🏆", title: "Leaderboard",           desc: "See how you rank against other students" },
  { icon: "📈", title: "Predicted JAMB Score",  desc: "Know your estimated score before exam day" },
  { icon: "💪", title: "Beat Yourself Mode",    desc: "Challenge your own personal best each time" },
  { icon: "🏅", title: "Badges & XP",           desc: "Earn achievements as you improve" },
];

const ARENA_MODES = [
  { icon: "🐺", name: "Lone Wolf",    desc: "1v1 battle — just you and one opponent" },
  { icon: "⚔️",  name: "Duel",         desc: "Ranked 1v1 — climb the leaderboard" },
  { icon: "👥", name: "Duo",           desc: "2v2 — squad of 2 vs squad of 2" },
  { icon: "🛡️", name: "Clash Squad",  desc: "4 players, 2 squads — team battle" },
  { icon: "👑", name: "Battle Royal", desc: "Up to 50 players — last brain standing" },
];

export default function Landing() {
  const nav = useNavigate();

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={s.nav}>
        <div style={s.logo}>🎓 CBT App</div>
        <div style={{ display: "flex", gap: 10 }}>
          <button style={s.navOutline} onClick={() => nav("/login")}>Login</button>
          <button style={s.navBtn}     onClick={() => nav("/register")}>Get Started Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.heroInner}>
          <div style={s.badge}>🇳🇬 Built for Nigerian Students · 100% Free</div>
          <h1 style={s.heroTitle}>Score Higher in<br />JAMB & Post-UTME</h1>
          <p style={s.heroSub}>
            Practice with thousands of past questions, battle friends in live arena games,
            track your progress, and know your predicted score — all completely free.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={s.heroBtn} onClick={() => nav("/register")}>Start Practicing Free →</button>
            <button style={s.heroOutline} onClick={() => nav("/login")}>I have an account</button>
          </div>
          <p style={{ color: "#b2bec3", fontSize: 13, marginTop: 14 }}>
            Free to join · No credit card · No limits
          </p>
        </div>
      </section>

      {/* FREE BANNER */}
      <section style={{ background: "#00b894", padding: "20px 24px", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          🎉 Everything is 100% Free
        </h2>
        <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 15, maxWidth: 500, margin: "0 auto" }}>
          Unlimited exams, all features, all modes — no subscription needed. Just create an account and start.
        </p>
      </section>

      {/* FEATURES */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Everything you need to pass</h2>
        <p style={s.sectionSub}>All features included — nothing locked behind a paywall</p>
        <div style={s.grid}>
          {FEATURES.map((f, i) => (
            <div key={i} style={s.featureCard}>
              <div style={s.featureIcon}>{f.icon}</div>
              <h3 style={{ fontSize: 15, marginBottom: 4, fontWeight: 700 }}>{f.title}</h3>
              <p style={{ color: "#636e72", fontSize: 13 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ARENA SECTION */}
      <section style={{ ...s.section, background: "#0f0f1a", maxWidth: "100%", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ ...s.sectionTitle, color: "#fff" }}>🏟️ Scholars Arena</h2>
          <p style={{ ...s.sectionSub, color: "#636e72" }}>
            Real-time academic battles — like Free Fire but for JAMB. Every mode is free.
          </p>
          <div style={s.arenaGrid}>
            {ARENA_MODES.map((m, i) => (
              <div key={i} style={s.arenaCard}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{m.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 12, color: "#636e72" }}>{m.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: 28 }}>
            <button style={{ ...s.heroBtn, fontSize: 16 }} onClick={() => nav("/register")}>
              Enter the Arena →
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>How to get started</h2>
        <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap", marginTop: 28 }}>
          {[
            ["1", "🎓", "Create account", "Free — takes 30 seconds"],
            ["2", "📚", "Choose exam",    "JAMB, Post-UTME, any subject"],
            ["3", "📊", "Track progress", "See your weak spots and improve"],
            ["4", "🏆", "Beat everyone",  "Arena battles with real students"],
          ].map(([num, icon, title, desc]) => (
            <div key={num} style={s.stepCard}>
              <div style={s.stepNum}>{num}</div>
              <div style={{ fontSize: 32, margin: "10px 0 8px" }}>{icon}</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 13, color: "#636e72" }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: "#2d3436", padding: "60px 24px", textAlign: "center" }}>
        <h2 style={{ color: "#fff", fontSize: 28, fontWeight: 800, marginBottom: 12 }}>
          Ready to start scoring higher?
        </h2>
        <p style={{ color: "#b2bec3", marginBottom: 24, fontSize: 16 }}>
          Join thousands of Nigerian students preparing smarter — for free.
        </p>
        <button style={s.heroBtn} onClick={() => nav("/register")}>
          Create Free Account →
        </button>
      </section>

      <footer style={s.footer}>
        <p>🎓 CBT Practice App · Built for Nigerian Students · All features free</p>
      </footer>
    </div>
  );
}

const s = {
  page:         { fontFamily: "sans-serif", color: "#2d3436" },
  nav:          { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 32px", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.06)", position: "sticky", top: 0, zIndex: 100 },
  logo:         { fontWeight: 800, fontSize: 20, color: "#6c63ff" },
  navBtn:       { padding: "8px 20px", background: "#6c63ff", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" },
  navOutline:   { padding: "8px 20px", background: "transparent", color: "#6c63ff", border: "2px solid #6c63ff", borderRadius: 8, fontWeight: 700, cursor: "pointer" },
  hero:         { background: "linear-gradient(135deg,#6c63ff 0%,#3f51b5 100%)", padding: "80px 16px", textAlign: "center" },
  heroInner:    { maxWidth: 640, margin: "0 auto" },
  badge:        { display: "inline-block", background: "rgba(255,255,255,0.2)", color: "#fff", padding: "6px 18px", borderRadius: 20, fontSize: 13, marginBottom: 20 },
  heroTitle:    { color: "#fff", fontSize: 42, fontWeight: 800, lineHeight: 1.2, marginBottom: 16 },
  heroSub:      { color: "rgba(255,255,255,0.85)", fontSize: 17, marginBottom: 28, lineHeight: 1.7 },
  heroBtn:      { padding: "14px 32px", background: "#fff", color: "#6c63ff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 16, cursor: "pointer" },
  heroOutline:  { padding: "14px 28px", background: "transparent", color: "#fff", border: "2px solid rgba(255,255,255,0.6)", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" },
  section:      { padding: "60px 24px", maxWidth: 960, margin: "0 auto" },
  sectionTitle: { textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 8 },
  sectionSub:   { textAlign: "center", color: "#636e72", marginBottom: 32, fontSize: 15 },
  grid:         { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 14, marginTop: 8 },
  featureCard:  { background: "#fff", borderRadius: 12, padding: "20px 18px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  featureIcon:  { fontSize: 30, marginBottom: 10 },
  arenaGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginTop: 28 },
  arenaCard:    { background: "#1a1a2e", borderRadius: 12, padding: "20px 16px", textAlign: "center", border: "1px solid #2d2d44" },
  stepCard:     { background: "#fff", borderRadius: 14, padding: "24px 20px", textAlign: "center", width: 180, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" },
  stepNum:      { width: 36, height: 36, background: "#6c63ff", color: "#fff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, margin: "0 auto" },
  footer:       { background: "#2d3436", color: "#b2bec3", textAlign: "center", padding: 20, fontSize: 13 },
};
