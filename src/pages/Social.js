import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../utils/api";


export default function Social() {
  const nav  = useNavigate();
  const [tab,         setTab]         = useState("friends");
  const [friends,     setFriends]     = useState([]);
  const [pending,     setPending]     = useState([]);
  const [squad,       setSquad]       = useState(null);
  const [squadInvites,setSquadInvites]= useState([]);
  const [search,      setSearch]      = useState("");
  const [searchResults,setSearchResults]= useState([]);
  const [challenges,  setChallenges]  = useState([]);
  const [searching,   setSearching]   = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [msg,         setMsg]         = useState("");
  const [squadName,   setSquadName]   = useState("");
  const searchTimer = useRef(null);
  let myId = null;
  try { myId = JSON.parse(atob((localStorage.getItem("token")||"..").split(".")[1]||"e30=")||"{}").id; } catch {}

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(""),3000); };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fr, pend, sq, sqInv, hist] = await Promise.all([
        API.get('/social/friends').then(r=>r.data),
        API.get('/social/friends/pending').then(r=>r.data),
        API.get('/social/squads/mine').then(r=>r.data),
        API.get('/social/squads/invites').then(r=>r.data),
        API.get('/live-challenges/history').then(r=>r.data),
      ]);
      setFriends(fr.friends   || []);
      setPending(pend.requests|| []);
      setSquad(sq.squad       || null);
      setSquadInvites(sqInv.invites || []);
      setChallenges(hist.history    || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Search with debounce
  useEffect(() => {
    clearTimeout(searchTimer.current);
    if (search.length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await API.get('/social/search', { params: { q: search } });
        const d = await r.json();
        setSearchResults(d.students || []);
      } catch {}
      setSearching(false);
    }, 400);
  }, [search]);

  const sendRequest = async (toId) => {
    const r = await API.post('/social/friends/request', { toId });
    const d = await r.json();
    flash(d.success ? "✅ Friend request sent!" : "❌ " + d.error);
  };

  const respondToRequest = async (requestId, accept) => {
    await API.post('/social/friends/respond', { requestId, accept });
    flash(accept ? "✅ Friend added!" : "Request declined.");
    load();
  };

  const removeFriend = async (friendId) => {
    if (!window.confirm("Remove this friend?")) return;
    await API.delete(`/social/friends/${friendId}`);
    load();
  };

  const createSquad = async () => {
    if (!squadName.trim()) return flash("Enter a squad name.");
    const r = await API.post('/social/squads', { name:squadName });
    const d = await r.json();
    if (d.success) { flash("✅ Squad created!"); load(); } else flash("❌ " + d.error);
  };

  const leaveSquad = async () => {
    if (!window.confirm("Leave your squad?")) return;
    await API.delete('/social/squads/leave');
    flash("Left squad."); load();
  };

  const inviteToSquad = async (targetId) => {
    if (!squad) return flash("Create or join a squad first.");
    const r = await API.post('/social/squads/${squad.id}/invite', { targetId });
    const d = await r.json();
    flash(d.success ? "✅ Invite sent!" : "❌ " + d.error);
  };

  const acceptSquadInvite = async (inviteId) => {
    const r = await API.post('/social/squads/accept-invite', { inviteId });
    const d = await r.json();
    if (d.success) { flash("✅ Joined squad!"); load(); } else flash("❌ " + d.error);
  };

  // Copy invite link
  const copyInviteLink = (username) => {
    const link = `${window.location.origin}/add-friend/${username}`;
    navigator.clipboard.writeText(link).then(() => flash("✅ Invite link copied! Share it with a friend.")).catch(() => {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      flash("✅ Link copied!");
    });
  };

  // My username (decode from JWT)
  let myUsername = null;
  try { myUsername = JSON.parse(atob((localStorage.getItem("token")||"..").split(".")[1]||"e30=")).username; } catch {}

  const st = {
    page:   { minHeight:"100vh", background:"var(--bg)", color:"var(--text)", padding:"16px", paddingBottom:90 },
    head:   { display:"flex", alignItems:"center", gap:12, marginBottom:20 },
    back:   { background:"none", border:"none", color:"var(--text-muted)", fontSize:22, cursor:"pointer", padding:0 },
    tabs:   { display:"flex", gap:6, marginBottom:18, overflowX:"auto", paddingBottom:4 },
    tab:    (a)=>({ padding:"8px 16px", borderRadius:20, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, whiteSpace:"nowrap",
                    background:a?"var(--primary)":"rgba(255,255,255,0.07)", color:a?"#fff":"var(--text-muted)" }),
    card:   { background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px", marginBottom:10 },
    inp:    { width:"100%", padding:"11px 14px", background:"rgba(255,255,255,0.07)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", fontSize:14, boxSizing:"border-box", outline:"none" },
    btn:    (c)=>({ padding:"8px 16px", background:c||"var(--primary)", border:"none", borderRadius:9, color:"#fff", fontWeight:700, fontSize:13, cursor:"pointer" }),
    avatar: { width:42, height:42, borderRadius:12, background:"var(--primary)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 },
    badge:  (c)=>({ display:"inline-flex", padding:"2px 8px", borderRadius:10, background:c+"22", color:c, fontSize:11, fontWeight:700 }),
    empty:  { textAlign:"center", padding:"32px 16px", color:"var(--text-muted)", fontSize:13 },
  };

  if (loading) return (
    <div style={{ ...st.page, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div className="loader-ring" />
    </div>
  );

  const TABS = [
    { id:"friends",    label:"👥 Friends",  badge: pending.length },
    { id:"squad",      label:"⚔️ Squad",    badge: squadInvites.length },
    { id:"search",     label:"🔍 Find",     badge: 0 },
    { id:"challenges", label:"⚡ Battles",  badge: 0 },
  ];

  return (
    <div style={st.page}>
      <div style={st.head}>
        <button style={st.back} onClick={()=>nav(-1)}>←</button>
        <div>
          <div style={{ fontWeight:900, fontSize:20 }}>👥 Social Hub</div>
          <div style={{ color:"var(--text-muted)", fontSize:12 }}>Friends · Squads · Live Battles</div>
        </div>
      </div>

      {msg && <div style={{ padding:"10px 14px", background:"rgba(0,208,132,0.12)", border:"1px solid rgba(0,208,132,0.3)", borderRadius:10, color:"#00D084", fontWeight:700, fontSize:13, marginBottom:12 }}>{msg}</div>}

      <div style={st.tabs}>
        {TABS.map(t => (
          <button key={t.id} style={st.tab(tab===t.id)} onClick={()=>setTab(t.id)}>
            {t.label}{t.badge>0 && <span style={{ marginLeft:5, background:"#FF5A5F", color:"#fff", borderRadius:10, fontSize:10, padding:"1px 5px", fontWeight:800 }}>{t.badge}</span>}
          </button>
        ))}
      </div>

      {/* ── FRIENDS TAB ── */}
      {tab === "friends" && (
        <>
          {/* Pending requests */}
          {pending.length > 0 && (
            <>
              <div style={{ fontWeight:800, fontSize:13, color:"#FFC857", marginBottom:10 }}>📬 Pending Requests ({pending.length})</div>
              {pending.map(req => (
                <div key={req.id} style={{ ...st.card, border:"1px solid rgba(255,200,87,0.3)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={st.avatar}>{req.full_name?.[0]||"?"}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontWeight:700, fontSize:14 }}>{req.full_name}</div>
                      <div style={{ color:"var(--text-muted)", fontSize:12 }}>{req.school_name || "—"}</div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>respondToRequest(req.id,true)}  style={st.btn("#00D084")}>Accept</button>
                      <button onClick={()=>respondToRequest(req.id,false)} style={st.btn("rgba(255,255,255,0.1)")}>Decline</button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Share my link */}
          {myUsername && (
            <div style={{ ...st.card, background:"rgba(108,99,255,0.08)", border:"1px solid rgba(108,99,255,0.25)", marginBottom:14 }}>
              <div style={{ fontWeight:800, fontSize:13, color:"#a29bfe", marginBottom:6 }}>🔗 Add Friends with Your Link</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", marginBottom:10, lineHeight:1.6 }}>
                Share your unique link — anyone who opens it gets sent directly to your friend request.
              </div>
              <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                <div style={{ flex:1, background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"9px 12px", fontSize:12, color:"#a29bfe", fontFamily:"monospace", overflow:"hidden", whiteSpace:"nowrap", textOverflow:"ellipsis" }}>
                  {window.location.origin}/add-friend/{myUsername}
                </div>
                <button onClick={() => copyInviteLink(myUsername)} style={{ ...st.btn(), flexShrink:0, fontSize:12 }}>
                  📋 Copy
                </button>
              </div>
            </div>
          )}

          <div style={{ fontWeight:800, fontSize:13, color:"var(--text-muted)", marginBottom:10 }}>FRIENDS ({friends.length})</div>
          {friends.length === 0 ? (
            <div style={st.empty}>
              <div style={{ fontSize:40, marginBottom:10 }}>🤝</div>
              <div style={{ fontWeight:700 }}>No friends yet</div>
              <div style={{ marginTop:6 }}>Search for students by name or username</div>
              <button onClick={()=>setTab("search")} style={{ ...st.btn(), marginTop:12 }}>🔍 Find Friends</button>
            </div>
          ) : friends.map(f => (
            <div key={f.id} style={st.card} className="card-hover">
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={st.avatar}>{f.full_name?.[0]||"?"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{f.full_name}</div>
                  <div style={{ color:"var(--text-muted)", fontSize:12 }}>{f.school_name || "—"} · {f.xp?.toLocaleString()||0} XP</div>
                  {f.username && <div style={{ fontSize:11, color:"rgba(162,155,254,0.7)", marginTop:1 }}>@{f.username}</div>}
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  {squad && <button onClick={()=>inviteToSquad(f.id)} style={{ ...st.btn("rgba(124,92,255,0.2)"), color:"var(--primary)", fontSize:11 }}>+ Squad</button>}
                  <button onClick={()=>removeFriend(f.id)} style={{ ...st.btn("rgba(255,90,95,0.15)"), color:"#FF5A5F", fontSize:11 }}>Remove</button>
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── SQUAD TAB ── */}
      {tab === "squad" && (
        <>
          {squadInvites.length > 0 && (
            <>
              <div style={{ fontWeight:800, fontSize:13, color:"#FFC857", marginBottom:10 }}>📨 Squad Invites</div>
              {squadInvites.map(inv => (
                <div key={inv.id} style={{ ...st.card, border:"1px solid rgba(255,200,87,0.3)" }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{inv.squad_name}</div>
                  <div style={{ color:"var(--text-muted)", fontSize:12, marginBottom:10 }}>Invited by {inv.from_name}</div>
                  <button onClick={()=>acceptSquadInvite(inv.id)} style={st.btn("#00D084")}>Join Squad</button>
                </div>
              ))}
            </>
          )}

          {squad ? (
            <>
              <div style={{ ...st.card, border:"1px solid rgba(124,92,255,0.4)", background:"rgba(124,92,255,0.08)" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ fontWeight:900, fontSize:17 }}>⚔️ {squad.name}</div>
                  <span style={st.badge("var(--primary)")}>YOUR SQUAD</span>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:10, marginBottom:14 }}>
                  {(squad.members||[]).map((m,i) => (
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.06)", borderRadius:10, padding:"8px 12px" }}>
                      <div style={{ ...st.avatar, width:32, height:32, fontSize:14 }}>{m.name?.[0]||"?"}</div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:13 }}>{m.name}</div>
                        {m.id === squad.captain_id && <div style={{ color:"#FFC857", fontSize:10, fontWeight:700 }}>⭐ Captain</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button onClick={()=>setTab("search")} style={{ ...st.btn("rgba(124,92,255,0.2)"), color:"var(--primary)", flex:1 }}>+ Invite Member</button>
                  <button onClick={leaveSquad} style={{ ...st.btn("rgba(255,90,95,0.15)"), color:"#FF5A5F", flex:1 }}>Leave</button>
                </div>
              </div>
            </>
          ) : (
            <div style={st.card}>
              <div style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>⚔️ Create a Squad</div>
              <div style={{ color:"var(--text-muted)", fontSize:13, marginBottom:14, lineHeight:1.6 }}>Form a team with up to 5 friends. Compete together in School Wars and team missions.</div>
              <input value={squadName} onChange={e=>setSquadName(e.target.value)}
                style={{ ...st.inp, marginBottom:10 }} placeholder="Squad name..." />
              <button onClick={createSquad} style={{ ...st.btn(), width:"100%", padding:"11px 0" }}>⚔️ Create Squad</button>
            </div>
          )}
        </>
      )}

      {/* ── SEARCH / FIND TAB ── */}
      {tab === "search" && (
        <>
          {/* Search methods */}
          <div style={{ ...st.card, background:"rgba(0,184,148,0.06)", border:"1px solid rgba(0,184,148,0.2)", marginBottom:14 }}>
            <div style={{ fontWeight:800, fontSize:13, color:"#00b894", marginBottom:8 }}>🔍 Find Students</div>
            <p style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.7, margin:"0 0 10px" }}>
              Search by <strong>full name</strong> or <strong>@username</strong>. If you know their username, add @ before it for a faster match.
            </p>
            <div style={{ position:"relative" }}>
              <input
                value={search}
                onChange={e=>setSearch(e.target.value)}
                style={{ ...st.inp, paddingLeft:36 }}
                placeholder="Name or @username…"
                autoFocus
              />
              <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", fontSize:15, pointerEvents:"none" }}>🔍</span>
            </div>
          </div>

          {/* Suggestions when empty */}
          {search.length < 2 && (
            <div style={{ ...st.card, textAlign:"center", padding:"24px 16px" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>👋</div>
              <div style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>Find your classmates</div>
              <div style={{ fontSize:12, color:"var(--text-muted)", lineHeight:1.7 }}>
                Type at least 2 characters to search.<br />
                Or share your invite link from the <strong>Friends</strong> tab.
              </div>
              <button onClick={() => setTab("friends")} style={{ ...st.btn("rgba(108,99,255,0.2)"), color:"var(--primary)", marginTop:12, fontSize:12 }}>
                🔗 Share My Invite Link
              </button>
            </div>
          )}

          {searching && (
            <div style={{ textAlign:"center", padding:20 }}>
              <div className="loader-ring" style={{ margin:"0 auto" }} />
            </div>
          )}

          {searchResults.map(s2 => {
            const isFriend = friends.some(f => f.id === s2.id);
            return (
              <div key={s2.id} style={st.card} className="card-hover">
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ ...st.avatar, background: `hsl(${(s2.id * 47) % 360}, 60%, 55%)` }}>
                    {s2.full_name?.[0]||"?"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:14 }}>{s2.full_name}</div>
                    <div style={{ color:"var(--text-muted)", fontSize:12 }}>{s2.school_name||"—"} · {s2.xp?.toLocaleString()||0} XP</div>
                    {s2.username && <div style={{ fontSize:11, color:"rgba(162,155,254,0.7)", marginTop:1 }}>@{s2.username}</div>}
                  </div>
                  {isFriend ? (
                    <span style={st.badge("#00D084")}>✓ Friends</span>
                  ) : s2.id === myId ? (
                    <span style={st.badge("#636e72")}>You</span>
                  ) : (
                    <button onClick={()=>sendRequest(s2.id)} style={{ ...st.btn(), fontSize:12, padding:"7px 12px" }}>+ Add</button>
                  )}
                </div>
              </div>
            );
          })}

          {!searching && search.length >= 2 && searchResults.length === 0 && (
            <div style={st.empty}>
              <div style={{ fontSize:32, marginBottom:8 }}>🔎</div>
              <div style={{ fontWeight:700 }}>No students found</div>
              <div style={{ marginTop:6, lineHeight:1.7 }}>Try searching by full name or @username.<br />Ask your friend what username they used to sign up.</div>
            </div>
          )}
        </>
      )}

      {/* ── CHALLENGES TAB ── */}
      {tab === "challenges" && (
        <>
          <div style={{ ...st.card, background:"rgba(124,92,255,0.08)", border:"1px solid rgba(124,92,255,0.3)", marginBottom:16 }}>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:6 }}>⚡ Live Challenges</div>
            <div style={{ color:"var(--text-muted)", fontSize:13, lineHeight:1.6 }}>
              Challenge any friend to an instant 5-question Blitz battle. Winner earns 200 coins!
            </div>
            <div style={{ marginTop:12, color:"var(--text-muted)", fontSize:12 }}>
              Go to your Friends tab → tap a friend → send a live challenge
            </div>
          </div>

          <div style={{ fontWeight:800, fontSize:13, color:"var(--text-muted)", marginBottom:10 }}>RECENT BATTLES</div>
          {challenges.length === 0 ? (
            <div style={st.empty}>
              <div style={{ fontSize:40, marginBottom:10 }}>⚡</div>
              <div>No battles yet. Challenge a friend!</div>
            </div>
          ) : challenges.map((c,i) => {
            const won = c.winner_id === myId;
            const opponent = c.player1_id === myId ? c.player2_name : c.player1_name;
            return (
              <div key={i} style={{ ...st.card, border:`1px solid ${won?"rgba(0,208,132,0.3)":"rgba(255,90,95,0.2)"}` }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:14 }}>vs {opponent}</div>
                    <div style={{ color:"var(--text-muted)", fontSize:12 }}>{c.subject || "Mixed"} · {new Date(c.played_at).toLocaleDateString()}</div>
                  </div>
                  <span style={st.badge(won?"#00D084":"#FF5A5F")}>{!c.winner_id?"Draw":won?"WIN":"LOSS"}</span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
