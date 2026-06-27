/**
 * ParentPortal.js — /parent
 * Mobile-first parent monitoring dashboard · Light blue/white theme
 */
import { useState, useEffect, useCallback } from "react";

const API = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const C = {
  bg:"var(--bg)", bgAlt:"var(--surface)", card:"var(--surface)", card2:"var(--surface-alt)",
  border:"var(--border)", shadow:"var(--card-shadow)",
  text:"#FFFFFF", sub:"var(--text-sub)", muted:"var(--text-muted)",
  blue:"var(--primary)", cyan:"#06B6D4", green:"#10B981",
  gold:"#F59E0B", red:"#EF4444", purple:"#8B5CF6",
};

const SUBJECT_COLORS = {
  Physics:"var(--primary)", Chemistry:"#10B981", Mathematics:"#F59E0B",
  Biology:"#EF4444", "English Language":"#8B5CF6", default:"var(--text-muted)",
};
const subjColor  = s => SUBJECT_COLORS[s] || SUBJECT_COLORS.default;
const scoreColor = p => +p >= 70 ? C.green : +p >= 50 ? C.gold : C.red;
const scoreEmoji = p => +p >= 70 ? "🏆" : +p >= 50 ? "📈" : "📉";
const fmtDate    = d => new Date(d).toLocaleDateString("en-GB",{day:"2-digit",month:"short",year:"numeric"});
const fmtDay     = d => new Date(d).toLocaleDateString("en-GB",{weekday:"short"});

function Card({ children, style={} }) {
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,boxShadow:C.shadow,...style}}>{children}</div>;
}

function Pill({ icon, label, value, color }) {
  return (
    <div style={{background:`${color}12`,border:`1px solid ${color}30`,borderRadius:14,padding:"14px 10px",textAlign:"center",flex:1,minWidth:80}}>
      <div style={{fontSize:22,marginBottom:4}}>{icon}</div>
      <div style={{fontSize:20,fontWeight:900,color}}>{value}</div>
      <div style={{fontSize:11,color:C.muted,marginTop:2}}>{label}</div>
    </div>
  );
}

function Bar({ label, value, color, exams }) {
  return (
    <div style={{marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
        <div>
          <span style={{color:C.text,fontSize:13,fontWeight:600}}>{label}</span>
          <span style={{color:C.muted,fontSize:11,marginLeft:6}}>{exams} exam{exams!==1?"s":""}</span>
        </div>
        <span style={{color,fontWeight:800,fontSize:14}}>{value}%</span>
      </div>
      <div style={{background:"rgba(79,126,247,0.08)",borderRadius:8,height:10,overflow:"hidden"}}>
        <div style={{width:`${Math.min(+value,100)}%`,height:"100%",background:`linear-gradient(90deg,${color}99,${color})`,borderRadius:8,transition:"width 0.8s ease"}} />
      </div>
    </div>
  );
}

function Avatar({ profile, size=56 }) {
  if (profile?.avatar_url)
    return <img src={profile.avatar_url} alt="" style={{width:size,height:size,borderRadius:"50%",objectFit:"cover",flexShrink:0}} />;
  return (
    <div style={{width:size,height:size,borderRadius:"50%",flexShrink:0,background:`linear-gradient(135deg,${C.blue},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:Math.round(size*0.38)}}>
      {profile?.full_name?.charAt(0)?.toUpperCase() || "👤"}
    </div>
  );
}

/* AUTH */
function AuthScreen({ onAuth }) {
  const [mode,setMode]=useState("login");
  const [form,setForm]=useState({full_name:"",email:"",phone:"",password:"",link_code:""});
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(false);
  const [showPw,setShowPw]=useState(false);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  async function submit(e) {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const res=await fetch(`${API}/parent/${mode==="login"?"login":"register"}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const data=await res.json();
      if (!res.ok) throw new Error(data.error||"Something went wrong");
      localStorage.setItem("parent_token",data.token);
      onAuth(data);
    } catch(err){setError(err.message);}
    finally{setLoading(false);}
  }

  const inp={width:"100%",background:"var(--border)",border:`1px solid rgba(79,126,247,0.2)`,borderRadius:12,padding:"13px 15px",color:C.text,fontSize:16,outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.2s"};

  return (
    <div style={{minHeight:"100dvh",background:"linear-gradient(150deg,#0D0F1C 0%,#1a1040 50%,#0D0F1C 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 16px",fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <div style={{position:"fixed",top:-60,right:-60,width:220,height:220,borderRadius:"50%",background:"var(--border)",filter:"blur(40px)",zIndex:0}}/>
      <div style={{position:"fixed",bottom:-40,left:-40,width:180,height:180,borderRadius:"50%",background:"rgba(6,182,212,0.1)",filter:"blur(30px)",zIndex:0}}/>
      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:72,height:72,borderRadius:22,background:`linear-gradient(135deg,${C.blue},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,margin:"0 auto 14px",boxShadow:"0 12px 40px rgba(79,126,247,0.35)"}}>🎓</div>
          <div style={{color:C.text,fontSize:24,fontWeight:900,letterSpacing:"-0.5px"}}>Scholars Syndicate</div>
          <div style={{color:C.muted,fontSize:14,marginTop:4}}>Parent Monitoring Portal</div>
        </div>
        <Card style={{padding:28,background:"var(--surface)",border:"1px solid rgba(107,90,237,0.2)"}}>
          <div style={{display:"flex",background:C.bgAlt,borderRadius:12,padding:4,marginBottom:24,gap:4}}>
            {["login","register"].map(m=>(
              <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"11px 0",borderRadius:10,border:"none",background:mode===m?`linear-gradient(135deg,${C.blue},${C.cyan})`:"transparent",color:mode===m?"#fff":C.muted,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s"}}>
                {m==="login"?"Login":"Register"}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            {mode==="register"&&(<>
              <div style={{marginBottom:14}}>
                <label style={{color:C.sub,fontSize:12,display:"block",marginBottom:6,fontWeight:600}}>Full Name</label>
                <input style={inp} value={form.full_name} onChange={e=>set("full_name",e.target.value)} placeholder="Your full name" required/>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{color:C.sub,fontSize:12,display:"block",marginBottom:6,fontWeight:600}}>Phone (optional)</label>
                <input style={inp} value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="08012345678" inputMode="tel"/>
              </div>
            </>)}
            <div style={{marginBottom:14}}>
              <label style={{color:C.sub,fontSize:12,display:"block",marginBottom:6,fontWeight:600}}>Email Address</label>
              <input style={inp} type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="parent@email.com" required/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{color:C.sub,fontSize:12,display:"block",marginBottom:6,fontWeight:600}}>Password</label>
              <div style={{position:"relative"}}>
                <input style={{...inp,paddingRight:44}} type={showPw?"text":"password"} value={form.password} onChange={e=>set("password",e.target.value)} placeholder="••••••••" required/>
                <button type="button" onClick={()=>setShowPw(v=>!v)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:C.muted,fontSize:16,padding:4}}>{showPw?"🙈":"👁️"}</button>
              </div>
            </div>
            {mode==="register"&&(
              <div style={{marginBottom:14}}>
                <label style={{color:C.sub,fontSize:12,display:"block",marginBottom:6,fontWeight:600}}>Student Link Code <span style={{color:C.muted,fontWeight:400}}>(from child's Profile page)</span></label>
                <input style={{...inp,borderColor:"rgba(79,126,247,0.4)",background:"rgba(79,126,247,0.04)",textTransform:"uppercase",letterSpacing:2,fontWeight:700}} value={form.link_code} onChange={e=>set("link_code",e.target.value.toUpperCase())} placeholder="SCH-XXXXXX" required/>
                <div style={{fontSize:11,color:C.muted,marginTop:5}}>ℹ️ Ask your child to open their Profile in the app to find their link code.</div>
              </div>
            )}
            {error&&<div style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.25)",borderRadius:10,padding:"11px 14px",color:C.red,fontSize:13,marginBottom:14,display:"flex",gap:8}}>⚠️ {error}</div>}
            <button type="submit" disabled={loading} style={{width:"100%",padding:"14px 0",borderRadius:13,background:loading?"#C7DCFF":`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:loading?C.muted:"#fff",fontWeight:800,fontSize:15,cursor:loading?"not-allowed":"pointer",fontFamily:"inherit",boxShadow:"0 8px 24px rgba(79,126,247,0.3)"}}>
              {loading?"Please wait…":mode==="login"?"Login →":"Create Account →"}
            </button>
          </form>
        </Card>
        <p style={{textAlign:"center",marginTop:16,color:C.muted,fontSize:12,lineHeight:1.7}}>🔒 Your child's data is private &amp; secure.<br/>Only linked parents can view their progress.</p>
      </div>
    </div>
  );
}

/* DASHBOARD */
function Dashboard({ token, onLogout }) {
  const [data,setData]=useState(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [tab,setTab]=useState("overview");
  const [refreshing,setRefreshing]=useState(false);

  const load=useCallback(async(silent=false)=>{
    if (!silent) setLoading(true); else setRefreshing(true);
    setError("");
    try {
      const res=await fetch(`${API}/parent/dashboard`,{headers:{Authorization:`Bearer ${token}`}});
      if (res.status===401){onLogout();return;}
      const d=await res.json();
      if (!res.ok) throw new Error(d.error||"Failed to load");
      setData(d);
    } catch(err){setError(err.message);}
    finally{setLoading(false);setRefreshing(false);}
  },[token,onLogout]);

  useEffect(()=>{load();},[load]);

  if (loading) return (
    <div style={{minHeight:"100dvh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:14,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <style>{`@keyframes bounce{from{transform:scaleY(0.6);opacity:.4}to{transform:scaleY(1.3);opacity:1}}`}</style>
      <div style={{width:64,height:64,borderRadius:20,background:`linear-gradient(135deg,${C.blue},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,boxShadow:"0 12px 32px rgba(79,126,247,0.35)"}}>🎓</div>
      <div style={{color:C.muted,fontSize:14}}>Loading dashboard…</div>
      <div style={{display:"flex",gap:6}}>{[0,1,2].map(i=><div key={i} style={{width:8,height:8,borderRadius:"50%",background:C.blue,opacity:0.6,animation:`bounce 0.8s ease-in-out ${i*0.15}s infinite alternate`}}/>)}</div>
    </div>
  );

  if (error) return (
    <div style={{minHeight:"100dvh",background:C.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,gap:12,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif"}}>
      <div style={{fontSize:48}}>😕</div>
      <div style={{color:C.text,fontWeight:700,fontSize:18}}>Something went wrong</div>
      <div style={{color:C.muted,fontSize:14,textAlign:"center"}}>{error}</div>
      <button onClick={()=>load()} style={{marginTop:8,padding:"11px 24px",borderRadius:12,background:`linear-gradient(135deg,${C.blue},${C.cyan})`,border:"none",color:"#fff",fontWeight:700,cursor:"pointer",fontSize:14}}>Try Again</button>
    </div>
  );

  const {profile,stats,subjects=[],recent_exams=[],predicted_score,weekly_activity=[],score_trend=[]}=data;
  const isOnline=profile.last_seen&&Date.now()-new Date(profile.last_seen).getTime()<10*60*1000;
  const lastSeen=profile.last_seen?new Date(profile.last_seen).toLocaleDateString("en-GB",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}):"Never";
  const TABS=[{id:"overview",label:"Overview",emoji:"📊"},{id:"subjects",label:"Subjects",emoji:"📚"},{id:"exams",label:"Exams",emoji:"📝"},{id:"activity",label:"Activity",emoji:"📅"}];

  return (
    <div style={{minHeight:"100dvh",background:C.bg,fontFamily:"'Plus Jakarta Sans',system-ui,sans-serif",color:C.text}}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.ex-card:active{transform:scale(0.99)}`}</style>

      {/* TOP BAR */}
      <div style={{background:"var(--nav-bg)",backdropFilter:"blur(12px)",WebkitBackdropFilter:"blur(12px)",borderBottom:`1px solid rgba(79,126,247,0.1)`,padding:"12px 16px",position:"sticky",top:0,zIndex:30,display:"flex",justifyContent:"space-between",alignItems:"center",boxShadow:"0 2px 16px rgba(0,0,0,0.35)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:38,height:38,borderRadius:11,background:`linear-gradient(135deg,${C.blue},${C.cyan})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>🎓</div>
          <div>
            <div style={{fontWeight:800,fontSize:15,color:C.text}}>Scholars Syndicate</div>
            <div style={{color:C.muted,fontSize:11}}>Parent Portal</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <button onClick={()=>load(true)} disabled={refreshing} title="Refresh" style={{background:C.bgAlt,border:`1px solid ${C.border}`,borderRadius:10,padding:"7px 10px",cursor:"pointer",fontSize:16,lineHeight:1,color:C.blue,animation:refreshing?"spin 0.6s linear infinite":"none"}}>🔄</button>
          <button onClick={onLogout} style={{background:"rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.2)",color:C.red,borderRadius:10,padding:"7px 14px",cursor:"pointer",fontSize:13,fontWeight:700,fontFamily:"inherit"}}>Logout</button>
        </div>
      </div>

      <div style={{maxWidth:680,margin:"0 auto",padding:"16px 14px 48px"}}>

        {/* PROFILE CARD */}
        <div style={{background:"linear-gradient(135deg,rgba(79,126,247,0.08),rgba(6,182,212,0.06))",border:"1px solid rgba(79,126,247,0.2)",borderRadius:20,padding:"18px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",boxShadow:"0 4px 24px rgba(0,0,0,0.4)"}}>
          <Avatar profile={profile} size={60}/>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
              <div style={{fontSize:18,fontWeight:900,color:C.text}}>{profile.full_name}</div>
              <div style={{background:isOnline?"rgba(16,185,129,0.12)":"rgba(100,116,139,0.1)",border:`1px solid ${isOnline?C.green:"rgba(100,116,139,0.2)"}`,borderRadius:20,padding:"2px 8px",fontSize:10,fontWeight:700,color:isOnline?C.green:C.muted}}>{isOnline?"🟢 Online":"⚫ Offline"}</div>
            </div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:4}}>
              {profile.school_class&&<span style={{color:C.sub,fontSize:12}}>📚 {profile.school_class}</span>}
              {profile.target_university&&<span style={{color:C.sub,fontSize:12}}>🎯 {profile.target_university}</span>}
            </div>
            <div style={{fontSize:11,color:C.muted}}>Last active: {lastSeen}</div>
          </div>
          <div style={{display:"flex",gap:16}}>
            <div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:900,color:C.gold}}>🔥 {profile.current_streak||0}</div><div style={{fontSize:10,color:C.muted}}>Streak</div></div>
            <div style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:900,color:C.blue}}>Lv.{profile.level||1}</div><div style={{fontSize:10,color:C.muted}}>Level</div></div>
          </div>
        </div>

        {/* TABS */}
        <div style={{display:"flex",background:"rgba(79,126,247,0.06)",borderRadius:14,padding:4,marginBottom:16,gap:2,border:"1px solid rgba(79,126,247,0.1)"}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{flex:1,padding:"8px 4px",borderRadius:11,border:"none",background:tab===t.id?`linear-gradient(135deg,${C.blue},${C.cyan})`:"transparent",color:tab===t.id?"#fff":C.muted,fontWeight:700,fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all 0.2s",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
              <span style={{fontSize:15}}>{t.emoji}</span><span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab==="overview"&&(<>
          <div style={{display:"flex",gap:10,marginBottom:12,flexWrap:"wrap"}}>
            <Pill icon="📝" label="Total Exams" value={stats.total_exams} color={C.blue}/>
            <Pill icon="📊" label="Avg Score" value={`${stats.overall_avg}%`} color={scoreColor(stats.overall_avg)}/>
            <Pill icon="🏆" label="Best Score" value={`${stats.best_score}%`} color={C.green}/>
          </div>
          <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
            <Pill icon="⏱️" label="Study Hrs" value={stats.total_study_hours||0} color={C.gold}/>
            <Pill icon="📖" label="Subjects" value={stats.subjects_practiced||0} color={C.cyan}/>
            <Pill icon="⚡" label="XP" value={(profile.points||0).toLocaleString()} color={C.purple}/>
          </div>

          {predicted_score&&(
            <Card style={{padding:"18px 16px",marginBottom:14,background:"linear-gradient(135deg,rgba(79,126,247,0.06),rgba(6,182,212,0.04))",border:"1px solid rgba(79,126,247,0.2)"}}>
              <div style={{color:C.blue,fontWeight:800,fontSize:11,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>🎯 JAMB Score Prediction</div>
              <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:34,fontWeight:900,color:C.text,letterSpacing:"-1px"}}>{predicted_score.low}–{predicted_score.high}</div>
                  <div style={{color:C.muted,fontSize:12,marginTop:2}}>Predicted range</div>
                </div>
                <div style={{flex:1,minWidth:160,background:"rgba(79,126,247,0.06)",borderRadius:12,padding:"10px 14px",fontSize:13,color:C.sub,lineHeight:1.6}}>
                  {predicted_score.avg>=250?"🎉 Excellent! On track for a strong JAMB score.":predicted_score.avg>=200?"📈 Good progress. Consistent practice will push scores higher.":"⚠️ Needs improvement. Encourage 1 exam per day — consistency is key!"}
                </div>
              </div>
            </Card>
          )}

          {weekly_activity.length>0&&(
            <Card style={{padding:16,marginBottom:14}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:14}}>📅 This Week's Activity</div>
              <div style={{display:"flex",gap:6,alignItems:"flex-end",height:70}}>
                {weekly_activity.map((d,i)=>(
                  <div key={i} style={{flex:1,textAlign:"center"}}>
                    <div style={{background:d.exams>0?`linear-gradient(180deg,${C.blue},${C.cyan})`:"rgba(79,126,247,0.08)",borderRadius:6,width:"100%",minHeight:6,height:`${Math.min(d.exams*16,60)}px`,marginBottom:4,transition:"height 0.5s"}}/>
                    <div style={{color:C.muted,fontSize:10}}>{fmtDay(d.day)}</div>
                    <div style={{color:d.exams>0?C.blue:C.muted,fontSize:10,fontWeight:700}}>{d.exams||0}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {score_trend.length>0&&(
            <Card style={{padding:16,marginBottom:14}}>
              <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:12}}>📈 Score Trend (Last 10 Exams)</div>
              <div style={{display:"flex",gap:4,alignItems:"flex-end",height:60}}>
                {score_trend.slice(-10).map((s,i)=>(
                  <div key={i} style={{flex:1}}>
                    <div title={`${s.percentage}%`} style={{background:scoreColor(s.percentage),borderRadius:4,width:"100%",height:`${Math.max(+s.percentage*0.55,4)}px`,minHeight:4,transition:"height 0.5s"}}/>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                <span style={{fontSize:10,color:C.muted}}>Oldest</span>
                <span style={{fontSize:10,color:C.muted}}>Latest</span>
              </div>
            </Card>
          )}

          <a href={`https://wa.me/${process.env.REACT_APP_BUSINESS_WHATSAPP||"2349036995642"}?text=I%20want%20to%20buy%20tokens%20for%20my%20child%20(${encodeURIComponent(profile.full_name)})%20on%20Scholars%20Syndicate`} target="_blank" rel="noreferrer" style={{display:"block",textDecoration:"none",background:"linear-gradient(135deg,rgba(16,185,129,0.08),rgba(6,182,212,0.06))",border:"1px solid rgba(16,185,129,0.25)",borderRadius:16,padding:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{fontSize:28}}>🪙</span>
              <div style={{flex:1}}>
                <div style={{fontWeight:800,fontSize:14,color:C.text}}>Buy tokens for {profile.full_name.split(" ")[0]}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>AI Tutor, extra spins, arena · From ₦200</div>
              </div>
              <div style={{background:"#25D366",borderRadius:10,padding:"8px 14px",color:"#fff",fontWeight:800,fontSize:12,whiteSpace:"nowrap",flexShrink:0}}>💬 WhatsApp</div>
            </div>
          </a>
        </>)}

        {/* SUBJECTS */}
        {tab==="subjects"&&(
          <Card style={{padding:"18px 16px"}}>
            <div style={{fontWeight:800,fontSize:15,color:C.text,marginBottom:16}}>Subject Performance</div>
            {subjects.length===0?(
              <div style={{textAlign:"center",padding:"32px 0",color:C.muted}}>
                <div style={{fontSize:40}}>📚</div>
                <div style={{marginTop:10,fontSize:14}}>No subject data yet</div>
                <div style={{fontSize:12,marginTop:6}}>Encourage your child to take their first practice exam!</div>
              </div>
            ):subjects.map(s=><Bar key={s.subject} label={s.subject} value={parseFloat(s.avg_score).toFixed(0)} color={subjColor(s.subject)} exams={s.total_exams}/>)}
          </Card>
        )}

        {/* EXAMS */}
        {tab==="exams"&&(
          <div>
            {recent_exams.length===0?(
              <Card style={{padding:"40px 16px",textAlign:"center"}}><div style={{fontSize:40}}>📝</div><div style={{color:C.muted,marginTop:10,fontSize:14}}>No exams taken yet</div></Card>
            ):recent_exams.map(e=>(
              <div key={e.id} className="ex-card" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:"14px 16px",marginBottom:10,display:"flex",alignItems:"center",gap:12,boxShadow:C.shadow,transition:"transform 0.15s"}}>
                <div style={{width:48,height:48,borderRadius:14,background:`${scoreColor(e.percentage)}15`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{scoreEmoji(e.percentage)}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontWeight:700,fontSize:14,color:C.text}}>{e.subject}</div>
                  <div style={{fontSize:12,color:C.muted,marginTop:2}}>{e.exam_type} · {fmtDate(e.created_at)}</div>
                  <div style={{fontSize:11,color:C.muted,marginTop:2}}>{e.score}/{e.total_questions} correct</div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:22,fontWeight:900,color:scoreColor(e.percentage)}}>{e.percentage}%</div>
                  <div style={{fontSize:11,color:scoreColor(e.percentage),marginTop:2}}>{+e.percentage>=70?"Excellent":+e.percentage>=50?"Good":"Needs work"}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ACTIVITY */}
        {tab==="activity"&&(<>
          <Card style={{padding:16,marginBottom:14}}>
            <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:14}}>📅 Weekly Practice</div>
            {weekly_activity.length===0?(
              <div style={{textAlign:"center",padding:"20px 0",color:C.muted}}>No activity data yet</div>
            ):(<>
              <div style={{display:"flex",gap:6,alignItems:"flex-end",height:80,marginBottom:8}}>
                {weekly_activity.map((d,i)=>(
                  <div key={i} style={{flex:1,textAlign:"center"}}>
                    <div style={{background:d.exams>0?`linear-gradient(180deg,${C.blue},${C.cyan})`:"rgba(79,126,247,0.08)",borderRadius:6,width:"100%",minHeight:6,height:`${Math.min(d.exams*20,70)}px`,marginBottom:5,transition:"height 0.5s ease"}}/>
                    <div style={{color:C.muted,fontSize:10}}>{fmtDay(d.day)}</div>
                    <div style={{color:d.exams>0?C.blue:C.muted,fontSize:11,fontWeight:700}}>{d.exams}</div>
                  </div>
                ))}
              </div>
              <div style={{textAlign:"center",fontSize:12,color:C.muted}}>{weekly_activity.reduce((a,d)=>a+d.exams,0)} exams this week</div>
            </>)}
          </Card>
          <Card style={{padding:16,background:"linear-gradient(135deg,rgba(79,126,247,0.06),rgba(6,182,212,0.04))",border:"1px solid rgba(79,126,247,0.15)"}}>
            <div style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:8}}>💡 Parent Tip</div>
            <div style={{fontSize:13,color:C.sub,lineHeight:1.7}}>
              {stats.overall_avg>=70?`${profile.full_name.split(" ")[0]} is performing excellently! Encourage them to maintain their ${profile.current_streak||0}-day streak and try Arena battles.`:stats.total_exams<5?`${profile.full_name.split(" ")[0]} is just getting started. Encourage at least 1 exam per day — consistency builds great habits. The Daily Challenge is a perfect starting point!`:`${profile.full_name.split(" ")[0]} is practicing but scores can improve. Ask them to use the Error Review feature — it shows exactly which questions they got wrong and why.`}
            </div>
          </Card>
        </>)}

      </div>
    </div>
  );
}

export default function ParentPortal() {
  const [session,setSession]=useState(()=>{const t=localStorage.getItem("parent_token");return t?{token:t}:null;});
  if (!session) return <AuthScreen onAuth={d=>setSession({token:d.token})}/>;
  return <Dashboard token={session.token} onLogout={()=>{localStorage.removeItem("parent_token");setSession(null);}}/>;
}
