import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../utils/api";

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT (Abuja)","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara",
];

const AVATARS = ["🎓","🦁","🐯","🦊","🐺","🦅","⚡","🔥","💎","🏆","🎯","🌟","🚀","🦸","🧠"];

export default function Profile() {
  const { student, refreshStudent, logout } = useAuth();
  const nav = useNavigate();

  const [tab,        setTab]        = useState("profile");
  const [form,       setForm]       = useState({});
  const [passForm,   setPassForm]   = useState({ current_password:"", new_password:"", confirm:"" });
  const [stats,      setStats]      = useState(null);
  const [msg,        setMsg]        = useState({ type:"", text:"" });
  const [saving,     setSaving]     = useState(false);
  const [showAvatars,setShowAvatars]= useState(false);

  useEffect(() => {
    if (student) {
      setForm({
        full_name:         student.full_name || "",
        state_of_origin:   student.state_of_origin || "",
        school_class:      student.school_class || "",
        target_university: student.target_university || "",
        target_course:     student.target_course || "",
        bio:               student.bio || "",
      });
    }
    API.get("/phase2/beat-yourself").then(r => setStats(r.data)).catch(() => {});
  }, [student]);

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type:"", text:"" }), 4000);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      await API.put("/auth/profile", form);
      await refreshStudent();
      showMsg("success", "Profile updated successfully!");
    } catch (err) {
      showMsg("error", err.response?.data?.error || "Failed to update profile.");
    } finally { setSaving(false); }
  };

  const selectEmoji = async (emoji) => {
    try {
      await API.put("/auth/avatar", { avatar_url: emoji });
      await refreshStudent();
      setShowAvatars(false);
      showMsg("success", "Avatar updated!");
    } catch (err) {
      showMsg("error", "Failed to update avatar.");
    }
  };

  const changePassword = async () => {
    if (!passForm.current_password || !passForm.new_password)
      return showMsg("error", "All password fields are required.");
    if (passForm.new_password.length < 6)
      return showMsg("error", "New password must be at least 6 characters.");
    if (passForm.new_password !== passForm.confirm)
      return showMsg("error", "Passwords do not match.");
    setSaving(true);
    try {
      await API.put("/auth/change-password", passForm);
      setPassForm({ current_password:"", new_password:"", confirm:"" });
      showMsg("success", "Password changed successfully!");
    } catch (err) {
      showMsg("error", err.response?.data?.error || "Failed to change password.");
    } finally { setSaving(false); }
  };

  const handleKeyActivation = async (keyCode) => {
    if (!keyCode.trim()) return showMsg("error", "Enter a key code.");
    try {
      const res = await API.post("/auth/activate-key", { key_code: keyCode.trim() });
      await refreshStudent();
      showMsg("success", res.data.message);
    } catch (err) {
      showMsg("error", err.response?.data?.error || "Invalid key.");
    }
  };

  const avatar  = student?.avatar_url || "🎓";
  const isEmoji = avatar && avatar.length <= 2;

  return (
    <div style={s.page}>
      <div style={s.container}>
        <button style={s.back} onClick={() => nav("/dashboard")}>← Dashboard</button>

        {/* MESSAGE BAR */}
        {msg.text && (
          <div style={{ ...s.msgBar, background: msg.type === "success" ? "#e8f8f5" : "#ffeae9", borderColor: msg.type === "success" ? "#00b894" : "#e17055", color: msg.type === "success" ? "#00b894" : "#e17055" }}>
            {msg.type === "success" ? "✅" : "⚠️"} {msg.text}
          </div>
        )}

        {/* PROFILE HEADER */}
        <div style={s.profileHeader}>
          <div style={{ position:"relative", cursor:"pointer" }} onClick={() => setShowAvatars(!showAvatars)}>
            <div style={s.avatarCircle}>
              {isEmoji
                ? <span style={{ fontSize:48 }}>{avatar}</span>
                : <img src={avatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"50%" }} />}
            </div>
            <div style={s.editBadge}>✏️</div>
          </div>

          {showAvatars && (
            <div style={s.avatarPicker}>
              <p style={{ margin:"0 0 8px", fontSize:12, color:"#636e72", fontWeight:600 }}>Choose Avatar</p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {AVATARS.map(e => (
                  <button key={e} style={s.avatarBtn} onClick={() => selectEmoji(e)}>{e}</button>
                ))}
              </div>
              <label style={{ display:"block", marginTop:8, cursor:"pointer", background:"#6c63ff", color:"#fff", padding:"8px 12px", borderRadius:8, textAlign:"center", fontSize:13, fontWeight:700 }}>
                📷 Upload Photo
                <input type="file" accept="image/*" style={{ display:"none" }}
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    // Validate file size (max 5MB)
                    if (file.size > 5 * 1024 * 1024) {
                      showMsg("error", "Image too large. Max 5MB.");
                      return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = async (ev) => {
                      try {
                        const res = await API.put("/auth/avatar", { image_base64: ev.target.result });
                        await refreshStudent();
                        setShowAvatars(false);
                        showMsg("success", "Photo uploaded successfully!");
                      } catch (err) {
                        showMsg("error", err.response?.data?.error || "Upload failed.");
                      }
                    };
                    reader.readAsDataURL(file);
                  }} />
              </label>
            </div>
          )}

          <div>
            <h2 style={{ fontWeight:800, fontSize:22, marginBottom:2 }}>{student?.full_name}</h2>
            <div style={{ color:"#636e72", fontSize:14 }}>{student?.email}</div>
            <div style={{ color:"#636e72", fontSize:13, marginTop:2 }}>📱 {student?.phone}</div>
            {student?.is_premium && (
              <span style={s.premBadge}>👑 Premium — expires {new Date(student.premium_expires_at).toLocaleDateString("en-NG",{dateStyle:"medium"})}</span>
            )}
          </div>
        </div>

        {/* QUICK STATS */}
        {stats && (
          <div style={s.statsRow}>
            <StatPill icon="🏆" label="Best Score" value={`${student?.best_score || 0}%`} />
            <StatPill icon="💪" label="Beat Rate"  value={`${stats.beat_rate || 0}%`} />
            <StatPill icon="🔥" label="Beaten PB"  value={stats.beaten_count || 0} />
          </div>
        )}

        {/* TABS */}
        <div style={s.tabs}>
          {[["profile","👤 Profile"],["security","🔒 Security"],["key","🔑 Activate Key"]].map(([id,label]) => (
            <button key={id}
              style={{ ...s.tab, background:tab===id?"#6c63ff":"#fff", color:tab===id?"#fff":"#636e72" }}
              onClick={() => setTab(id)}>
              {label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === "profile" && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>Personal Information</h3>

            <div style={s.formGrid}>
              <div>
                <label style={s.label}>Full Name</label>
                <input style={s.input} value={form.full_name} onChange={e => setForm(p=>({...p,full_name:e.target.value}))} />
              </div>
              <div>
                <label style={s.label}>State of Origin</label>
                <select style={s.input} value={form.state_of_origin} onChange={e => setForm(p=>({...p,state_of_origin:e.target.value}))}>
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map(st=><option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Current Class</label>
                <select style={s.input} value={form.school_class} onChange={e => setForm(p=>({...p,school_class:e.target.value}))}>
                  <option value="">Select class</option>
                  {["SS1","SS2","SS3","Post-Secondary","Gap Year","Others"].map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={s.label}>Target University</label>
                <input style={s.input} placeholder="e.g. University of Lagos"
                  value={form.target_university} onChange={e => setForm(p=>({...p,target_university:e.target.value}))} />
              </div>
              <div>
                <label style={s.label}>Target Course</label>
                <input style={s.input} placeholder="e.g. Medicine & Surgery"
                  value={form.target_course} onChange={e => setForm(p=>({...p,target_course:e.target.value}))} />
              </div>
            </div>

            <label style={s.label}>Bio (optional)</label>
            <textarea style={{ ...s.input, height:80, resize:"vertical" }}
              placeholder="Tell us a bit about yourself..."
              value={form.bio} onChange={e => setForm(p=>({...p,bio:e.target.value}))} />

            <button style={{ ...s.saveBtn, opacity:saving?0.7:1 }}
              onClick={saveProfile} disabled={saving}>
              {saving ? "Saving..." : "💾 Save Changes"}
            </button>

            <div style={s.dangerZone}>
              <p style={{ color:"#636e72", fontSize:13, marginBottom:10 }}>
                📧 Email: <strong>{student?.email}</strong> &nbsp;|&nbsp; 📱 Phone: <strong>{student?.phone}</strong><br />
                <small>Email and phone cannot be changed. Contact admin if needed.</small>
              </p>
              <button style={s.logoutBtn} onClick={() => { logout(); nav("/login"); }}>
                🚪 Logout
              </button>
            </div>
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {tab === "security" && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>Change Password</h3>
            <p style={{ color:"#636e72", fontSize:13, marginBottom:16 }}>
              Choose a strong password with at least 6 characters.
            </p>
            <label style={s.label}>Current Password</label>
            <input style={s.input} type="password" placeholder="Your current password"
              value={passForm.current_password}
              onChange={e => setPassForm(p=>({...p,current_password:e.target.value}))} />
            <label style={s.label}>New Password</label>
            <input style={s.input} type="password" placeholder="Min. 6 characters"
              value={passForm.new_password}
              onChange={e => setPassForm(p=>({...p,new_password:e.target.value}))} />
            <label style={s.label}>Confirm New Password</label>
            <input style={s.input} type="password" placeholder="Repeat new password"
              value={passForm.confirm}
              onChange={e => setPassForm(p=>({...p,confirm:e.target.value}))} />
            <button style={{ ...s.saveBtn, opacity:saving?0.7:1 }}
              onClick={changePassword} disabled={saving}>
              {saving ? "Changing..." : "🔐 Change Password"}
            </button>
          </div>
        )}

        {/* ── KEY ACTIVATION TAB ── */}
        {tab === "key" && (
          <div style={s.card}>
            <h3 style={s.cardTitle}>Activate Premium Key</h3>
            {student?.is_premium ? (
              <div style={{ background:"#e8f8f5", borderRadius:10, padding:"16px", textAlign:"center" }}>
                <div style={{ fontSize:32, marginBottom:8 }}>👑</div>
                <p style={{ fontWeight:700, color:"#00b894" }}>You are currently Premium!</p>
                <p style={{ color:"#636e72", fontSize:13 }}>
                  Expires: {new Date(student.premium_expires_at).toLocaleDateString("en-NG",{dateStyle:"long"})}
                </p>
              </div>
            ) : (
              <>
                <p style={{ color:"#636e72", fontSize:13, marginBottom:16 }}>
                  Enter the activation key you purchased from admin. Contact us on WhatsApp to buy a key.
                </p>
                <KeyActivator onActivate={handleKeyActivation} />
                <div style={s.pricingBox}>
                  <h4 style={{ marginBottom:10, fontWeight:700 }}>💰 Pricing</h4>
                  <div style={s.priceRow}><span>Weekly</span><strong>₦500 · 7 days</strong></div>
                  <div style={s.priceRow}><span>Monthly</span><strong>₦1,500 · 30 days</strong></div>
                  <div style={s.priceRow}><span>Lifetime</span><strong>₦5,000 · Forever</strong></div>
                  <a href="https://wa.me/2349036995642?text=I want to buy a premium key"
                    target="_blank" rel="noreferrer" style={s.waBtn}>
                    📱 Buy Key on WhatsApp
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KeyActivator({ onActivate }) {
  const [key, setKey] = useState("");
  return (
    <div>
      <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#2d3436", marginBottom:6 }}>
        Activation Key
      </label>
      <input style={{ width:"100%", padding:"12px 14px", border:"2px solid #dfe6e9", borderRadius:10,
        fontSize:16, letterSpacing:2, textTransform:"uppercase", fontFamily:"monospace", boxSizing:"border-box" }}
        placeholder="XXXX-XXXX-XXXX-XXXX"
        value={key}
        onChange={e => setKey(e.target.value.toUpperCase())}
        maxLength={19} />
      <button style={{ width:"100%", padding:12, background:"linear-gradient(135deg,#6c63ff,#3f51b5)",
        color:"#fff", border:"none", borderRadius:10, fontWeight:800, cursor:"pointer", fontSize:14, marginTop:10 }}
        onClick={() => onActivate(key)}>
        Activate Key →
      </button>
    </div>
  );
}

function StatPill({ icon, label, value }) {
  return (
    <div style={{ flex:1, background:"#fff", borderRadius:10, padding:"12px 10px", textAlign:"center",
      boxShadow:"0 1px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ fontSize:20 }}>{icon}</div>
      <div style={{ fontWeight:800, fontSize:18, color:"#6c63ff", marginTop:2 }}>{value}</div>
      <div style={{ fontSize:11, color:"#636e72" }}>{label}</div>
    </div>
  );
}

const s = {
  page:          { minHeight:"100vh", background:"#f8f9fa", fontFamily:"sans-serif", padding:16 },
  container:     { maxWidth:680, margin:"0 auto" },
  back:          { background:"none", border:"none", color:"#6c63ff", fontWeight:700, cursor:"pointer", fontSize:14, marginBottom:12 },
  msgBar:        { border:"1px solid", borderRadius:8, padding:"10px 14px", marginBottom:14, fontWeight:600, fontSize:13 },
  profileHeader: { display:"flex", alignItems:"flex-start", gap:20, background:"#fff", borderRadius:14, padding:"20px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)", marginBottom:14, flexWrap:"wrap", position:"relative" },
  avatarCircle:  { width:80, height:80, borderRadius:"50%", background:"#f0edff", display:"flex", alignItems:"center", justifyContent:"center", border:"3px solid #6c63ff", overflow:"hidden" },
  editBadge:     { position:"absolute", bottom:0, right:0, background:"#fff", border:"2px solid #dfe6e9", borderRadius:"50%", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12 },
  avatarPicker:  { position:"absolute", top:110, left:16, background:"#fff", border:"1px solid #dfe6e9", borderRadius:12, padding:14, boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:100, width:280 },
  avatarBtn:     { fontSize:24, background:"#f8f9fa", border:"none", borderRadius:8, padding:"6px 8px", cursor:"pointer", transition:"transform 0.2s", ":hover":{ transform:"scale(1.05)" } },
  premBadge:     { display:"inline-block", background:"#fff9e6", color:"#b7860b", padding:"3px 10px", borderRadius:20, fontSize:12, fontWeight:700, marginTop:6 },
  statsRow:      { display:"flex", gap:10, marginBottom:14 },
  tabs:          { display:"flex", gap:8, marginBottom:16, flexWrap:"wrap" },
  tab:           { flex:1, padding:"10px 12px", border:"2px solid #dfe6e9", borderRadius:10, fontWeight:700, cursor:"pointer", fontSize:13, whiteSpace:"nowrap", transition:"all 0.2s" },
  card:          { background:"#fff", borderRadius:14, padding:"20px 18px", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" },
  cardTitle:     { fontSize:16, fontWeight:800, color:"#2d3436", marginBottom:16 },
  formGrid:      { display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:8 },
  label:         { display:"block", fontSize:12, fontWeight:600, color:"#636e72", marginBottom:4, marginTop:10 },
  input:         { width:"100%", padding:"10px 12px", border:"2px solid #dfe6e9", borderRadius:8, fontSize:14, boxSizing:"border-box", outline:"none", transition:"border-color 0.2s", ":focus":{ borderColor:"#6c63ff" } },
  saveBtn:       { width:"100%", padding:12, background:"linear-gradient(135deg,#6c63ff,#3f51b5)", color:"#fff", border:"none", borderRadius:10, fontWeight:800, cursor:"pointer", fontSize:14, marginTop:14, transition:"opacity 0.2s" },
  dangerZone:    { marginTop:20, paddingTop:16, borderTop:"1px solid #f0f0f0" },
  logoutBtn:     { padding:"9px 20px", background:"#ffeae9", color:"#e17055", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer", fontSize:13, transition:"background 0.2s", ":hover":{ background:"#ffd5d0" } },
  pricingBox:    { background:"#f8f9fa", borderRadius:10, padding:"14px", marginTop:16 },
  priceRow:      { display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #f0f0f0", fontSize:14 },
  waBtn:         { display:"block", marginTop:12, padding:"11px", background:"#25D366", color:"#fff", borderRadius:8, fontWeight:700, textAlign:"center", textDecoration:"none", fontSize:14, transition:"opacity 0.2s", ":hover":{ opacity:0.9 } },
};