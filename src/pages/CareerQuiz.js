import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

const QUESTIONS = [
  {
    id: 'q1', emoji: '🎯',
    text: 'What do you enjoy doing in your free time?',
    options: [
      { value: 'create',   label: 'Creating things (art, music, writing, building)' },
      { value: 'solve',    label: 'Solving puzzles or problems' },
      { value: 'help',     label: 'Helping people or volunteering' },
      { value: 'explore',  label: 'Exploring outdoors / sports / adventure' },
      { value: 'organize', label: 'Planning, organizing, or managing things' },
    ],
  },
  {
    id: 'q2', emoji: '🧠',
    text: 'In a group project, which role feels most natural?',
    options: [
      { value: 'leader',   label: 'Leading and making decisions' },
      { value: 'analyst',  label: 'Researching and analyzing data' },
      { value: 'creative', label: 'Coming up with ideas and designs' },
      { value: 'support',  label: 'Supporting the team and keeping everyone motivated' },
      { value: 'doer',     label: 'Building or implementing the actual work' },
    ],
  },
  {
    id: 'q3', emoji: '💡',
    text: 'Which of these excites you the most?',
    options: [
      { value: 'tech',      label: 'Technology and how things work' },
      { value: 'people',    label: 'Understanding people and their emotions' },
      { value: 'business',  label: 'Money, markets, and running businesses' },
      { value: 'nature',    label: 'Living things, environment, and science' },
      { value: 'society',   label: 'Laws, justice, and how society works' },
    ],
  },
  {
    // FIX (indecisive results): the old Q4 ("How do you feel when you help
    // someone solve a problem?") had a "It's okay, but not my thing" middle
    // option that carries no real signal either way — a student who picks
    // it isn't telling us anything, which just adds noise and nudges
    // results toward the generic "All-Rounder" catch-all. Replaced with a
    // question where every option points clearly at one interest area.
    id: 'q4', emoji: '⚡',
    text: 'Pick a school project you would actually enjoy leading:',
    options: [
      { value: 'build_app',    label: 'Build a working app or gadget' },
      { value: 'run_fundraiser', label: 'Organize a fundraiser for a cause' },
      { value: 'design_expo',  label: 'Design the posters and stage for an event' },
      { value: 'sell_product', label: 'Plan and sell a product to classmates' },
    ],
  },
  {
    id: 'q5', emoji: '💼',
    text: 'What kind of work environment do you prefer?',
    options: [
      { value: 'office',    label: 'Office / indoors — structured and stable' },
      { value: 'field',     label: 'Field / outdoors — hands-on and physical' },
      { value: 'remote',    label: 'Remote / flexible — work from anywhere' },
      { value: 'hospital',  label: 'Hospital / care settings' },
      { value: 'creative',  label: 'Studio / creative space' },
    ],
  },
  {
    id: 'q6', emoji: '📚',
    text: 'Which subjects did you enjoy most in school?',
    options: [
      { value: 'science',  label: 'Science (Biology, Chemistry, Physics)' },
      { value: 'math',     label: 'Mathematics' },
      { value: 'arts',     label: 'Arts, Literature, Social Studies' },
      { value: 'commerce', label: 'Commerce / Accounting / Economics' },
      { value: 'tech',     label: 'Technical / Vocational subjects' },
    ],
  },
  {
    id: 'q7', emoji: '🏆',
    text: 'In 10 years, what matters most to you?',
    options: [
      { value: 'impact',   label: 'Making a real difference in people\'s lives' },
      { value: 'wealth',   label: 'Financial freedom and building wealth' },
      { value: 'fame',     label: 'Being known and respected in my field' },
      { value: 'family',   label: 'Work-life balance and time for family' },
      { value: 'invent',   label: 'Creating something new and lasting' },
    ],
  },
];

// FIX (indecisive local fallback): every answer value here is tagged with
// the ONE career bucket it most clearly signals. The local fallback (only
// used if the API itself is unreachable) now tallies these tags across all
// 7 answers and picks the clear top score, instead of the old approach of
// testing keyword regexes in a fixed if/else chain that stopped at the
// FIRST bucket to match a single answer — which meant one throwaway pick
// could lock in the whole result and ignore the other six answers.
const CATEGORY_MAP = {
  create: 'art',       solve: 'science',   help: 'social',      explore: 'science',   organize: 'business',
  leader: 'business',  analyst: 'science', creative: 'art',     support: 'social',    doer: 'science',
  tech: 'science',     people: 'social',   business: 'business', nature: 'science',   society: 'social',
  build_app: 'science', run_fundraiser: 'social', design_expo: 'art', sell_product: 'business',
  office: 'business',  field: 'science',   remote: 'science',   hospital: 'social',
  science: 'science',  math: 'science',    arts: 'art',         commerce: 'business',
  impact: 'social',    wealth: 'business', fame: 'art',         family: 'social',     invent: 'science',
};

export default function CareerQuiz() {
  const nav = useNavigate();
  const [step, setStep]       = useState(0); // 0 = intro, 1-7 = questions, 8 = result
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const q = QUESTIONS[step - 1];
  const progress = step === 0 ? 0 : Math.round((step / QUESTIONS.length) * 100);

  const handleAnswer = async (val) => {
    const updated = { ...answers, [q.id]: val };
    setAnswers(updated);

    if (step < QUESTIONS.length) {
      setStep(s => s + 1);
    } else {
      // Last question — get AI result
      setLoading(true);
      try {
        // FIX (career quiz never actually reaching the AI): the backend's
        // /career/suggest requires `answers` to be an ARRAY (it validates
        // with Array.isArray and does answers.map(...)), but this was
        // sending the raw answers OBJECT ({ q1: 'x', q2: 'y', ... }).
        // Array.isArray on an object is always false, so the backend
        // rejected every single submission with a 400 — meaning Groq was
        // never once invoked for a real result. Every student has only
        // ever seen the crude local fallback below, which is why results
        // felt generic and not "decisive": it's a same-page keyword match
        // against a handful of categories, not an AI reading all 7 answers
        // together. Sending the values as an array fixes the real bug.
        const { data } = await API.post('/career/suggest', { answers: Object.values(updated) });
        setResult(data);
        setStep(QUESTIONS.length + 1);
      } catch {
        // Fallback: local suggestion (only used if the network/API itself
        // is unreachable now — not the everyday path anymore)
        setResult(localSuggest(updated));
        setStep(QUESTIONS.length + 1);
      } finally {
        setLoading(false);
      }
    }
  };

  const s = {
    page:    { minHeight:'100dvh', background:'var(--bg)', color:'var(--text)', fontFamily:"'Inter',sans-serif", paddingBottom:40 },
    header:  { display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--bg)', zIndex:10 },
    back:    { background:'none', border:'none', color:'var(--text-muted)', fontSize:20, cursor:'pointer', padding:4 },
    prog:    { height:3, background:'var(--border)', borderRadius:2, overflow:'hidden', margin:'0 16px' },
    progFill:{ height:'100%', background:'var(--primary)', borderRadius:2, transition:'width .4s ease' },
    body:    { padding:'20px 16px', maxWidth:480, margin:'0 auto' },
    emoji:   { fontSize:40, marginBottom:14, display:'block' },
    qText:   { fontSize:19, fontWeight:700, lineHeight:1.4, marginBottom:24 },
    option:  { width:'100%', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 16px', fontSize:14, color:'var(--text)', textAlign:'left', marginBottom:10, cursor:'pointer', transition:'all .15s', display:'block' },
    career:  { background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:18, marginBottom:12 },
  };

  // ── Intro ──────────────────────────────────────────────────
  if (step === 0) return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => nav(-1)}>←</button>
        <div style={{ fontSize:17, fontWeight:800 }}>Career Finder</div>
      </div>
      <div style={s.body}>
        <div style={{ textAlign:'center', padding:'30px 0 20px' }}>
          <span style={{ fontSize:56 }}>🧭</span>
          <h1 style={{ fontSize:22, fontWeight:800, margin:'16px 0 10px' }}>Find Your Career Path</h1>
          <p style={{ fontSize:14, color:'var(--text-muted)', lineHeight:1.7, marginBottom:28 }}>
            Answer 7 quick questions and we'll suggest careers that match your personality, interests, and lifestyle — not just your grades.
          </p>
        </div>
        <div style={{ background:'var(--surface)', borderRadius:14, padding:16, marginBottom:20, border:'1px solid var(--border)' }}>
          {['Takes about 2 minutes','Based on your personality & interests','Shows matching courses & schools'].map((t, i) => (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'center', padding:'7px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ color:'var(--primary)', fontWeight:700, fontSize:16 }}>✓</span>
              <span style={{ fontSize:14, color:'var(--text-sub)' }}>{t}</span>
            </div>
          ))}
        </div>
        <button onClick={() => setStep(1)}
          style={{ width:'100%', background:'var(--primary)', color:'#fff', border:'none', borderRadius:14, padding:'15px 0', fontSize:16, fontWeight:700, cursor:'pointer' }}>
          Start the Quiz →
        </button>
      </div>
    </div>
  );

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...s.page, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <span style={{ fontSize:40 }}>🤔</span>
      <div style={{ fontSize:16, fontWeight:600 }}>Analysing your answers...</div>
      <div style={{ fontSize:13, color:'var(--text-muted)' }}>This takes a few seconds</div>
    </div>
  );

  // ── Questions ──────────────────────────────────────────────
  if (step >= 1 && step <= QUESTIONS.length) return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => setStep(s => Math.max(0, s - 1))}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>{step} of {QUESTIONS.length}</div>
        </div>
      </div>
      <div style={s.prog}><div style={{ ...s.progFill, width:`${progress}%` }} /></div>
      <div style={s.body}>
        <span style={s.emoji}>{q.emoji}</span>
        <div style={s.qText}>{q.text}</div>
        {q.options.map(o => (
          <button key={o.value} style={s.option} onClick={() => handleAnswer(o.value)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--primary) 8%, var(--surface))'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );

  // ── Results ────────────────────────────────────────────────
  if (result) return (
    <div style={s.page}>
      <div style={s.header}>
        <button style={s.back} onClick={() => nav(-1)}>←</button>
        <div style={{ fontSize:17, fontWeight:800 }}>Your Career Matches</div>
      </div>
      <div style={s.body}>
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <span style={{ fontSize:48 }}>🎯</span>
          <h2 style={{ fontSize:18, fontWeight:800, margin:'12px 0 6px' }}>
            You're a <span style={{ color:'var(--primary)' }}>{result.personality_type}</span>
          </h2>
          <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>{result.description}</p>
        </div>

        <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', margin:'20px 0 12px' }}>
          Top career matches
        </div>

        {(result.careers || []).map((c, i) => (
          <div key={i} style={s.career}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:10 }}>
              <span style={{ fontSize:28, lineHeight:1 }}>{c.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>{c.title}</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, background:'color-mix(in srgb, var(--success) 12%, transparent)', color:'var(--success)', borderRadius:20, padding:'2px 9px', fontWeight:600 }}>
                    {c.match}% match
                  </span>
                  <span style={{ fontSize:11, background:'var(--surface-alt)', color:'var(--text-muted)', borderRadius:20, padding:'2px 9px' }}>
                    {c.sector}
                  </span>
                </div>
              </div>
            </div>
            <p style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6, marginBottom:10 }}>{c.description}</p>
            {c.courses?.length > 0 && (
              <div>
                <div style={{ fontSize:11, fontWeight:700, color:'var(--text-muted)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.06em' }}>Related courses</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {c.courses.map((co, j) => (
                    <span key={j} style={{ fontSize:12, background:'color-mix(in srgb, var(--primary) 10%, var(--surface-alt))', color:'var(--primary-light)', borderRadius:20, padding:'4px 10px', fontWeight:500 }}>
                      {co}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        <div style={{ display:'flex', gap:10, marginTop:8 }}>
          <button onClick={() => { setStep(0); setAnswers({}); setResult(null); }}
            style={{ flex:1, background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text)', borderRadius:12, padding:'13px 0', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Retake Quiz
          </button>
          <button onClick={() => nav('/school-finder')}
            style={{ flex:1, background:'var(--primary)', border:'none', color:'#fff', borderRadius:12, padding:'13px 0', fontSize:14, fontWeight:600, cursor:'pointer' }}>
            Find Schools →
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Local fallback if the API is totally unreachable ────────
   FIX: previously this just tested `is('tech') || is('solve') || ...` in a
   fixed if/else chain and returned on the FIRST match — one single answer
   sharing a keyword with a bucket could decide the whole result, ignoring
   the other six. Now it tallies every answer's tagged category (via
   CATEGORY_MAP) and picks the bucket with the clear highest count, so the
   result reflects the student's overall pattern, not just whichever
   bucket happened to be checked first. */
function localSuggest(answers) {
  const scores = { science: 0, social: 0, business: 0, art: 0 };
  Object.values(answers).forEach(val => {
    const cat = CATEGORY_MAP[val];
    if (cat) scores[cat]++;
  });

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topCat, topScore] = ranked[0];
  const isTie = ranked[1] && ranked[1][1] === topScore && topScore > 0;

  if (!isTie && topCat === 'science')
    return { personality_type:'Problem Solver', description:'You enjoy tackling complex challenges with logical thinking.', careers:[
      { icon:'💻', title:'Software Engineer',   match:92, sector:'Technology', description:'Build apps, websites, and systems that millions use.', courses:['Computer Science','Software Engineering'] },
      { icon:'📊', title:'Data Analyst',        match:87, sector:'Technology', description:'Turn raw data into insights that drive business decisions.', courses:['Statistics','Computer Science'] },
      { icon:'⚙️',  title:'Mechanical Engineer',match:80, sector:'Engineering', description:'Design and build machines and systems.', courses:['Mechanical Engineering','Physics'] },
    ]};

  if (!isTie && topCat === 'social')
    return { personality_type:'Natural Caregiver', description:'You thrive when helping others and making a difference.', careers:[
      { icon:'🏥', title:'Medical Doctor',     match:91, sector:'Healthcare', description:'Diagnose and treat patients, saving lives every day.', courses:['Medicine & Surgery','Biochemistry'] },
      { icon:'🧠', title:'Psychologist',       match:85, sector:'Healthcare', description:'Help people overcome mental health challenges.', courses:['Psychology','Psychiatry'] },
      { icon:'👩‍🏫', title:'Teacher/Lecturer', match:82, sector:'Education',  description:'Shape the next generation through education.', courses:['Education','Any subject'] },
    ]};

  if (!isTie && topCat === 'business')
    return { personality_type:'Business Strategist', description:'You have a sharp mind for opportunities and building systems.', careers:[
      { icon:'💰', title:'Business Analyst',   match:90, sector:'Business', description:'Help companies improve performance and profitability.', courses:['Business Administration','Economics'] },
      { icon:'⚖️', title:'Accountant/Finance', match:86, sector:'Finance',  description:'Manage money, investments, and financial planning.', courses:['Accounting','Banking & Finance'] },
      { icon:'🏗️', title:'Entrepreneur',       match:83, sector:'Business', description:'Build your own business and create jobs.', courses:['Business Administration','Economics'] },
    ]};

  if (!isTie && topCat === 'art')
    return { personality_type:'Creative Visionary', description:'Your imagination is your greatest asset.', careers:[
      { icon:'🎨', title:'Graphic Designer',   match:93, sector:'Creative', description:'Create visual identities, logos, and digital experiences.', courses:['Fine Arts','Mass Communication'] },
      { icon:'📱', title:'UI/UX Designer',     match:88, sector:'Technology', description:'Design beautiful, usable digital products.', courses:['Computer Science','Art'] },
      { icon:'✍️', title:'Content Creator',    match:84, sector:'Media', description:'Build audiences through compelling content.', courses:['Mass Communication','English'] },
    ]};

  return { personality_type:'All-Rounder', description:'You have a broad range of interests — many paths suit you.', careers:[
    { icon:'⚖️',  title:'Lawyer',             match:85, sector:'Legal',    description:'Advocate for justice and help people navigate the law.', courses:['Law'] },
    { icon:'🌍', title:'Political Scientist',  match:80, sector:'Public Service', description:'Shape policy and governance.', courses:['Political Science','Public Administration'] },
    { icon:'📡', title:'Mass Communication',   match:78, sector:'Media', description:'Connect and inform the world.', courses:['Mass Communication','Journalism'] },
  ]};
}
