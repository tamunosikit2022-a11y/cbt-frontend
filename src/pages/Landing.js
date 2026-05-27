import { useNavigate } from "react-router-dom";

const FEATURES = [
  { icon:"📚", title:"JAMB Practice",       desc:"Full question bank — all subjects, all years" },
  { icon:"🏫", title:"Post-UTME",            desc:"UNILAG, UI, UNIBEN, OAU and more" },
  { icon:"⏱️", title:"Real Exam Mode",       desc:"Timed simulation of the actual exam" },
  { icon:"📊", title:"Analytics",            desc:"Know your weak topics and improve faster" },
  { icon:"🔁", title:"Error Review",         desc:"Practice only the questions you got wrong" },
  { icon:"🎯", title:"Daily Challenge",      desc:"New 10-question challenge every day" },
  { icon:"📈", title:"Predicted Score",      desc:"Know your estimated JAMB score before exam day" },
  { icon:"🏅", title:"Badges & XP",          desc:"Earn achievements as you improve every day" },
  { icon:"👻", title:"Scholar Spirits",      desc:"Collect rare study companions with unique powers" },
  { icon:"⚡", title:"Skills & Boosts",      desc:"Buy XP multipliers, hints, and power-ups" },
  { icon:"📖", title:"Knowledge Vault",      desc:"Unlock study notes, past papers & formula sheets" },
  { icon:"🏛️", title:"School Factions",      desc:"Represent your school and compete for glory" },
];

const ARENA_MODES = [
  { icon:"🐺", name:"Lone Wolf",   desc:"1v1 battle — just you and one opponent" },
  { icon:"⚔️",  name:"Duel",        desc:"Ranked 1v1 — climb the leaderboard" },
  { icon:"👥", name:"Duo",          desc:"2v2 — squad of 2 vs squad of 2" },
  { icon:"🛡️", name:"Clash Squad", desc:"4 players, 2 squads — team battle" },
  { icon:"👑", name:"Battle Royal", desc:"Up to 50 players — last brain standing" },
];

const STATS = [
  { num:"50,000+", label:"Students" },
  { num:"200,000+",label:"Questions" },
  { num:"25+",     label:"Universities" },
  { num:"100%",    label:"Free" },
];

export default function Landing() {
  const nav = useNavigate();

  return (
    <div style={{ fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif", overflowX:"hidden", background:"#0B1020" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes blob-float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-16px) scale(1.04)}}
        @keyframes fade-up{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
        @keyframes yt-pulse{0%,100%{box-shadow:0 0 20px rgba(255,0,0,.4)}50%{box-shadow:0 0 44px rgba(255,0,0,.8),0 0 70px rgba(255,0,0,.25)}}
        .land-btn{transition:all .2s ease;cursor:pointer}
        .land-btn:hover{transform:translateY(-2px);filter:brightness(1.1)}
        .land-btn:active{transform:scale(.97)}
        .fcard{transition:all .2s ease}
        .fcard:hover{transform:translateY(-4px);box-shadow:0 14px 40px rgba(124,92,255,.2)!important}
        @media(max-width:480px){
          .hero-title{font-size:32px!important}
          .hide-mobile{display:none!important}
          .land-nav{padding:12px 16px!important}
        }
      `}</style>

      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav className="land-nav" style={{
        display:"flex", justifyContent:"space-between", alignItems:"center",
        padding:"14px 24px", background:"rgba(11,16,32,.96)", backdropFilter:"blur(20px)",
        position:"sticky", top:0, zIndex:100,
        borderBottom:"1px solid rgba(255,255,255,.07)",
        boxShadow:"0 4px 24px rgba(0,0,0,.35)",
      }}>
        <div style={{ fontWeight:900, fontSize:20, color:"#fff", display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:24 }}>🎓</span>
          <span style={{ background:"linear-gradient(90deg,#7C5CFF,#5B8CFF)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
            Scholars Syndicate
          </span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button className="land-btn" onClick={() => nav("/login")} style={{ padding:"9px 18px", background:"rgba(255,255,255,.06)", color:"#fff", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, fontWeight:700, fontSize:14 }}>
            Login
          </button>
          <button className="land-btn hide-mobile" onClick={() => nav("/register")} style={{ padding:"9px 20px", background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, fontSize:14 }}>
            Get Started Free
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ background:"linear-gradient(145deg,#0B1020 0%,#130d28 50%,#0B1020 100%)", padding:"70px 20px 60px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:-80, left:"15%", width:320, height:320, borderRadius:"50%", background:"rgba(124,92,255,.12)", filter:"blur(80px)", animation:"blob-float 7s ease-in-out infinite" }} />
        <div style={{ position:"absolute", bottom:-60, right:"10%", width:260, height:260, borderRadius:"50%", background:"rgba(91,140,255,.09)", filter:"blur(70px)", animation:"blob-float 9s ease-in-out infinite reverse" }} />
        <div style={{ maxWidth:640, margin:"0 auto", position:"relative", zIndex:1 }}>
          <div style={{ display:"inline-block", background:"rgba(124,92,255,.15)", border:"1px solid rgba(124,92,255,.3)", color:"#a29bfe", padding:"6px 18px", borderRadius:20, fontSize:13, marginBottom:22, fontWeight:700, animation:"fade-up .5s ease" }}>
            🇳🇬 Built for Nigerian Students · 100% Free
          </div>
          <h1 className="hero-title" style={{ color:"#fff", fontSize:46, fontWeight:900, lineHeight:1.15, marginBottom:18, animation:"fade-up .6s ease" }}>
            Score Higher in<br />
            <span style={{ background:"linear-gradient(90deg,#7C5CFF,#5B8CFF,#00D084)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              JAMB & Post-UTME
            </span>
          </h1>
          <p style={{ color:"rgba(255,255,255,.7)", fontSize:17, marginBottom:30, lineHeight:1.8, animation:"fade-up .7s ease" }}>
            Practice thousands of past questions, battle friends in live Arena games, collect Scholar Spirits, and track your predicted JAMB score — all completely free.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", animation:"fade-up .8s ease" }}>
            <button className="land-btn" onClick={() => nav("/register")} style={{ padding:"15px 32px", background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)", color:"#fff", border:"none", borderRadius:14, fontWeight:900, fontSize:16, boxShadow:"0 8px 32px rgba(124,92,255,.5)" }}>
              Start Practicing Free →
            </button>
            <button className="land-btn" onClick={() => nav("/login")} style={{ padding:"15px 24px", background:"rgba(255,255,255,.06)", color:"#fff", border:"1px solid rgba(255,255,255,.15)", borderRadius:14, fontWeight:700, fontSize:15 }}>
              I have an account
            </button>
          </div>
          <p style={{ color:"rgba(255,255,255,.3)", fontSize:12, marginTop:18 }}>Free to join · No credit card · No limits</p>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────────────── */}
      <section style={{ background:"rgba(124,92,255,.07)", borderTop:"1px solid rgba(124,92,255,.15)", borderBottom:"1px solid rgba(124,92,255,.15)", padding:"26px 20px" }}>
        <div style={{ maxWidth:600, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, textAlign:"center" }}>
          {STATS.map((s,i) => (
            <div key={i}>
              <div style={{ fontSize:22, fontWeight:900, color:"#7C5CFF" }}>{s.num}</div>
              <div style={{ fontSize:12, color:"rgba(255,255,255,.45)", marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FREE BANNER ─────────────────────────────────────────── */}
      <section style={{ background:"linear-gradient(135deg,#00D084,#00b894)", padding:"22px 20px", textAlign:"center" }}>
        <h2 style={{ color:"#fff", fontSize:20, fontWeight:900, marginBottom:6 }}>🎉 Everything is 100% Free</h2>
        <p style={{ color:"rgba(255,255,255,.9)", fontSize:14, maxWidth:480, margin:"0 auto" }}>
          Unlimited exams, all features, all modes, Scholar Spirits, Skills, Knowledge Vault — no subscription needed.
        </p>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────── */}
      <section style={{ padding:"56px 20px", background:"#0B1020" }}>
        <div style={{ maxWidth:960, margin:"0 auto" }}>
          <h2 style={{ textAlign:"center", fontSize:28, fontWeight:900, color:"#fff", marginBottom:8 }}>Everything you need to pass</h2>
          <p style={{ textAlign:"center", color:"rgba(255,255,255,.4)", marginBottom:32, fontSize:15 }}>All features included — nothing locked behind a paywall</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:12 }}>
            {FEATURES.map((f,i) => (
              <div key={i} className="fcard" style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:16, padding:"20px 18px", boxShadow:"0 4px 20px rgba(0,0,0,.3)" }}>
                <div style={{ fontSize:28, marginBottom:10 }}>{f.icon}</div>
                <h3 style={{ fontSize:14, marginBottom:5, fontWeight:800, color:"#F1F5F9" }}>{f.title}</h3>
                <p style={{ color:"rgba(255,255,255,.42)", fontSize:12, lineHeight:1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ARENA ───────────────────────────────────────────────── */}
      <section style={{ background:"linear-gradient(135deg,#0f0e1a,#1a0a2e)", padding:"56px 20px" }}>
        <div style={{ maxWidth:900, margin:"0 auto" }}>
          <h2 style={{ textAlign:"center", fontSize:28, fontWeight:900, color:"#fff", marginBottom:8 }}>🏟️ Scholars Arena</h2>
          <p style={{ textAlign:"center", color:"rgba(255,255,255,.42)", marginBottom:32, fontSize:15 }}>
            Real-time academic battles — like PUBG but for JAMB. Every mode is free.
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(155px,1fr))", gap:10 }}>
            {ARENA_MODES.map((m,i) => (
              <div key={i} className="fcard" style={{ background:"rgba(124,92,255,.08)", border:"1px solid rgba(124,92,255,.2)", borderRadius:16, padding:"22px 16px", textAlign:"center" }}>
                <div style={{ fontSize:30, marginBottom:8 }}>{m.icon}</div>
                <div style={{ fontWeight:900, fontSize:14, color:"#fff", marginBottom:5 }}>{m.name}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", lineHeight:1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:"center", marginTop:30 }}>
            <button className="land-btn" onClick={() => nav("/register")} style={{ padding:"14px 32px", background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)", color:"#fff", border:"none", borderRadius:14, fontWeight:900, fontSize:16, boxShadow:"0 8px 28px rgba(124,92,255,.5)" }}>
              Enter the Arena →
            </button>
          </div>
        </div>
      </section>

      {/* ── METAVERSE ───────────────────────────────────────────── */}
      <section style={{ padding:"56px 20px", background:"#0B1020" }}>
        <div style={{ maxWidth:800, margin:"0 auto", textAlign:"center" }}>
          <h2 style={{ fontSize:28, fontWeight:900, color:"#fff", marginBottom:8 }}>⚡ Scholar Metaverse</h2>
          <p style={{ color:"rgba(255,255,255,.42)", marginBottom:32, fontSize:15 }}>The study experience evolved — gamified, social, and addictive</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:12, maxWidth:520, margin:"0 auto 30px" }}>
            {[
              { icon:"👻", name:"Scholar Spirits", desc:"Rare NFT-style companions with passive study boosts" },
              { icon:"⚡", name:"Skills & Boosts",  desc:"Buy XP multipliers, hints, and power-ups with coins" },
              { icon:"📖", name:"Knowledge Vault",  desc:"Past papers, formula sheets & study notes" },
              { icon:"🏛️", name:"School Factions",  desc:"Represent your school — compete for faction glory" },
            ].map((m,i) => (
              <div key={i} className="fcard" style={{ background:"rgba(0,212,255,.05)", border:"1px solid rgba(0,212,255,.15)", borderRadius:16, padding:"20px 16px", textAlign:"center" }}>
                <div style={{ fontSize:30, marginBottom:8 }}>{m.icon}</div>
                <div style={{ fontWeight:800, fontSize:13, color:"#fff", marginBottom:5 }}>{m.name}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,.4)", lineHeight:1.5 }}>{m.desc}</div>
              </div>
            ))}
          </div>
          <button className="land-btn" onClick={() => nav("/register")} style={{ padding:"13px 28px", background:"linear-gradient(135deg,#00D4FF22,#7C5CFF22)", color:"#00D4FF", border:"1px solid rgba(0,212,255,.3)", borderRadius:12, fontWeight:800, fontSize:15 }}>
            Explore the Metaverse →
          </button>
        </div>
      </section>

      {/* ── ELITRONIX YOUTUBE ───────────────────────────────────── */}
      <section style={{ background:"linear-gradient(135deg,#0f0e1a,#1a0505)", padding:"56px 20px" }}>
        <div style={{ maxWidth:560, margin:"0 auto", textAlign:"center" }}>
          <div style={{ width:72, height:72, borderRadius:"50%", background:"#FF0000", display:"flex", alignItems:"center", justifyContent:"center", fontSize:32, margin:"0 auto 16px", animation:"yt-pulse 2s infinite", boxShadow:"0 8px 32px rgba(255,0,0,.4)" }}>▶</div>
          <h2 style={{ fontSize:24, fontWeight:900, color:"#fff", marginBottom:10 }}>Learn from ELITRONIX on YouTube</h2>
          <p style={{ color:"rgba(255,255,255,.5)", fontSize:14, lineHeight:1.75, marginBottom:24 }}>
            Physics, Chemistry & Mathematics explained simply by Eli. Subscribe for free exam tips that could push your JAMB score from 200 to 320.
          </p>
          <a href="https://www.youtube.com/@elitronix1?sub_confirmation=1" target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}>
            <button className="land-btn" style={{ padding:"14px 32px", background:"#FF0000", color:"#fff", border:"none", borderRadius:14, fontWeight:900, fontSize:16, boxShadow:"0 8px 28px rgba(255,0,0,.45)" }}>
              ▶ Subscribe — It's Free!
            </button>
          </a>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────── */}
      <section style={{ padding:"56px 20px", background:"rgba(124,92,255,.04)", borderTop:"1px solid rgba(124,92,255,.1)" }}>
        <div style={{ maxWidth:800, margin:"0 auto" }}>
          <h2 style={{ textAlign:"center", fontSize:26, fontWeight:900, color:"#fff", marginBottom:32 }}>How to get started</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))", gap:16 }}>
            {[
              ["1","🎓","Create account","Free — takes 30 seconds"],
              ["2","📚","Choose exam",   "JAMB, Post-UTME, any subject"],
              ["3","📊","Track progress","See weak spots and improve"],
              ["4","🏆","Beat everyone", "Arena battles with real students"],
            ].map(([num,icon,title,desc]) => (
              <div key={num} style={{ background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.07)", borderRadius:20, padding:"24px 18px", textAlign:"center" }}>
                <div style={{ width:36, height:36, background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)", color:"#fff", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:18, margin:"0 auto 12px" }}>{num}</div>
                <div style={{ fontSize:28, margin:"8px 0" }}>{icon}</div>
                <div style={{ fontWeight:800, fontSize:14, color:"#F1F5F9", marginBottom:6 }}>{title}</div>
                <div style={{ fontSize:12, color:"rgba(255,255,255,.38)", lineHeight:1.5 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section style={{ background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)", padding:"60px 20px", textAlign:"center" }}>
        <h2 style={{ color:"#fff", fontSize:26, fontWeight:900, marginBottom:12 }}>Ready to start scoring higher?</h2>
        <p style={{ color:"rgba(255,255,255,.85)", marginBottom:24, fontSize:15 }}>
          Join thousands of Nigerian students preparing smarter — for free.
        </p>
        <button className="land-btn" onClick={() => nav("/register")} style={{ padding:"15px 36px", background:"#fff", color:"#7C5CFF", border:"none", borderRadius:14, fontWeight:900, fontSize:16, boxShadow:"0 8px 32px rgba(0,0,0,.25)" }}>
          Create Free Account →
        </button>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{ background:"#060b18", color:"rgba(255,255,255,.3)", textAlign:"center", padding:"22px 20px", fontSize:12, borderTop:"1px solid rgba(255,255,255,.05)" }}>
        <p>🎓 Scholars Syndicate · Built for Nigerian Students · All features free</p>
        <p style={{ marginTop:6 }}>
          Questions? WhatsApp:{" "}
          <a href="https://wa.me/2349036995642" style={{ color:"#25D366", textDecoration:"none" }}>09036995642</a>
        </p>
      </footer>
    </div>
  );
}
