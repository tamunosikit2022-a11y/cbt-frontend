import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import API from '../utils/api';

const ACCENT = '#6c63ff';
const BG     = '#0B1020';
const CARD   = '#111827';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = 'rgba(255,255,255,0.45)';
const GREEN  = '#00b894';

const COSTS = [
  { icon:'🤖', label:'AI Tutor message',      cost:1  },
  { icon:'⚔️', label:'Host arena battle',     cost:2  },
  { icon:'🎰', label:'Extra daily spin',       cost:1  },
  { icon:'📄', label:'PDF vault download',    cost:1  },
  { icon:'📊', label:'Predicted score report',cost:3  },
];

const BUNDLE_COLORS = ['#e17055','#0984e3',ACCENT,'#00b894'];

export default function Tokens() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [balance,       setBalance]       = useState(null);
  const [bundles,       setBundles]       = useState([]);
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [tab,           setTab]           = useState('buy');
  const [buying,        setBuying]        = useState(null);
  const [showSuccess,   setShowSuccess]   = useState(false);
  const [waUrl,         setWaUrl]         = useState(null);
  const [waBundle,      setWaBundle]      = useState(null);
  const [paystackEnabled, setPaystackEnabled] = useState(false);

  useEffect(() => {
    // Show success if redirected from Paystack
    if (params.get('payment') === 'success') setShowSuccess(true);

    Promise.all([
      API.get('/tokens/balance'),
      API.get('/tokens/history'),
    ]).then(([b, h]) => {
      setBalance(b.data.token_balance);
      setBundles(b.data.bundles || []);
      setPaystackEnabled(b.data.paystack_enabled || false);
      setHistory(h.data.transactions || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  async function handleWhatsApp(bundleId) {
    setBuying(bundleId);
    try {
      const { data } = await API.post('/tokens/whatsapp', { bundleId });
      setWaUrl(data.whatsapp_url);
      setWaBundle(data.bundle);
    } catch (err) {
      alert(err?.response?.data?.error || 'Failed. Please try again.');
    } finally { setBuying(null); }
  }

  async function handlePaystack(bundleId) {
    setBuying(bundleId);
    try {
      const { data } = await API.post('/tokens/initialize', { bundleId });
      window.location.href = data.authorization_url;
    } catch (err) {
      alert(err?.response?.data?.error || 'Payment failed. Please try again.');
    } finally { setBuying(null); }
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:BG, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:MUTED, fontSize:14 }}>Loading…</div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:BG, fontFamily:"'Plus Jakarta Sans',sans-serif", color:'#fff', paddingBottom:40 }}>

      {/* Header */}
      <div style={{ background:CARD, borderBottom:`1px solid ${BORDER}`, padding:'14px 16px', position:'sticky', top:0, zIndex:10, display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => nav(-1)} style={{ background:'none', border:'none', color:'#fff', fontSize:22, cursor:'pointer', lineHeight:1, padding:'2px 6px' }}>←</button>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:17 }}>🪙 Tokens</div>
          <div style={{ fontSize:11, color:MUTED }}>Pay for what you use</div>
        </div>
        <div style={{ background:`${ACCENT}22`, border:`1px solid ${ACCENT}44`, borderRadius:20, padding:'7px 14px', display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:16 }}>🪙</span>
          <span style={{ fontWeight:900, fontSize:18, color:ACCENT }}>{balance ?? 0}</span>
          <span style={{ fontSize:11, color:MUTED }}>tokens</span>
        </div>
      </div>

      {/* Payment success banner */}
      {showSuccess && (
        <div style={{ margin:'14px 16px 0', background:'rgba(0,184,148,0.12)', border:`1px solid ${GREEN}44`, borderRadius:12, padding:'12px 16px', display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:22 }}>✅</span>
          <div>
            <div style={{ fontWeight:700, color:GREEN }}>Payment received!</div>
            <div style={{ fontSize:12, color:MUTED }}>Tokens will appear in your balance shortly.</div>
          </div>
          <button onClick={() => setShowSuccess(false)} style={{ marginLeft:'auto', background:'none', border:'none', color:MUTED, cursor:'pointer', fontSize:18 }}>✕</button>
        </div>
      )}

      {/* WhatsApp order sheet */}
      {waUrl && waBundle && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'center', padding:'0 12px 12px' }}>
          <div style={{ background:CARD, borderRadius:20, padding:20, width:'100%', maxWidth:420, border:`1px solid ${BORDER}` }}>
            <div style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>📲 Pay via WhatsApp</div>
            <div style={{ fontSize:13, color:MUTED, marginBottom:16, lineHeight:1.6 }}>
              Tap the button below to open WhatsApp. Send the pre-filled message to our team and we'll confirm your payment manually — usually within minutes.
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', borderRadius:12, padding:'12px 14px', marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:14 }}>Order Summary</div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:13 }}>
                <span style={{ color:MUTED }}>Bundle</span>
                <span>{waBundle.label}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:13 }}>
                <span style={{ color:MUTED }}>Amount</span>
                <span style={{ fontWeight:700, color:ACCENT }}>{waBundle.price}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:13 }}>
                <span style={{ color:MUTED }}>Tokens</span>
                <span style={{ fontWeight:700, color:GREEN }}>+{waBundle.tokens} tokens</span>
              </div>
            </div>
            <a href={waUrl} target="_blank" rel="noreferrer" style={{
              display:'block', textAlign:'center', padding:'14px 0',
              background:'#25D366', borderRadius:12, color:'#fff',
              fontWeight:800, fontSize:15, textDecoration:'none', marginBottom:10,
            }}>
              💬 Open WhatsApp to Pay
            </a>
            <div style={{ fontSize:11, color:MUTED, textAlign:'center', marginBottom:12 }}>
              After sending the message, our team will verify and credit your tokens.
            </div>
            <button onClick={() => { setWaUrl(null); setWaBundle(null); }} style={{
              width:'100%', padding:12, background:'transparent',
              border:`1px solid ${BORDER}`, borderRadius:12,
              color:MUTED, cursor:'pointer', fontSize:13, fontWeight:600,
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', margin:'16px 16px 0', background:'rgba(255,255,255,0.04)', borderRadius:12, padding:4 }}>
        {[['buy','🛒 Buy Tokens'],['history','📋 History']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex:1, padding:'10px', border:'none', borderRadius:10, cursor:'pointer', fontWeight:700, fontSize:14,
            background: tab===t ? ACCENT : 'transparent',
            color: tab===t ? '#fff' : MUTED,
          }}>{label}</button>
        ))}
      </div>

      <div style={{ padding:'16px', maxWidth:480, margin:'0 auto' }}>
        {tab === 'buy' ? (<>

          {/* What tokens unlock */}
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:'14px 16px', marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:14, marginBottom:10 }}>🔓 What tokens unlock:</div>
            {COSTS.map(c => (
              <div key={c.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:`1px solid ${BORDER}` }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:13, color:'rgba(255,255,255,0.8)' }}>
                  <span>{c.icon}</span><span>{c.label}</span>
                </div>
                <div style={{ background:`${ACCENT}22`, borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700, color:ACCENT }}>
                  {c.cost} token{c.cost>1?'s':''}
                </div>
              </div>
            ))}
            <div style={{ fontSize:12, color:MUTED, marginTop:10, lineHeight:1.5 }}>
              ✅ Always free: Practice exams, daily challenge, join arena, 1 daily spin, missions, leaderboard, performance, error review, history.
            </div>
          </div>

          {/* Bundle cards */}
          <div style={{ fontWeight:700, fontSize:15, marginBottom:12 }}>Choose a bundle:</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {bundles.map((b, i) => (
              <div key={b.id} style={{
                background:CARD, border:`2px solid ${b.popular ? ACCENT : BORDER}`,
                borderRadius:14, padding:'16px 12px', position:'relative', cursor:'pointer',
                opacity: buying && buying !== b.id ? 0.6 : 1,
              }}>
                {b.popular && (
                  <div style={{ position:'absolute', top:-10, left:'50%', transform:'translateX(-50%)',
                    background:ACCENT, color:'#fff', fontSize:10, fontWeight:800,
                    padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>
                    BEST VALUE
                  </div>
                )}
                <div style={{ fontSize:30, fontWeight:900, color:BUNDLE_COLORS[i] }}>{b.tokens}</div>
                <div style={{ fontSize:11, color:MUTED, marginBottom:6 }}>tokens</div>
                <div style={{ fontWeight:800, fontSize:17, marginBottom:2 }}>{b.price}</div>
                <div style={{ fontSize:11, color:MUTED, marginBottom:12 }}>{b.perToken}</div>

                {/* WhatsApp button — primary */}
                <button onClick={() => handleWhatsApp(b.id)} disabled={!!buying} style={{
                  width:'100%', padding:'10px 0', borderRadius:10, border:'none',
                  background: buying===b.id ? 'rgba(37,211,102,0.4)' : '#25D366',
                  color:'#fff', fontWeight:700, fontSize:13,
                  cursor: buying ? 'wait' : 'pointer', marginBottom:6,
                }}>
                  {buying===b.id ? 'Opening…' : '💬 Pay via WhatsApp'}
                </button>

                {/* Paystack — coming soon */}
                <div style={{
                  width:'100%', padding:'8px 0', borderRadius:10, border:`1px solid ${BORDER}`,
                  background:'rgba(255,255,255,0.02)', color:MUTED,
                  fontWeight:600, fontSize:12, textAlign:'center', cursor:'default',
                }}>
                  💳 Paystack — Coming Soon
                </div>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:14, padding:'14px 16px' }}>
            <div style={{ fontWeight:700, fontSize:13, marginBottom:10 }}>📲 How WhatsApp payment works:</div>
            {[
              ['1️⃣', 'Tap "Pay via WhatsApp" on any bundle'],
              ['2️⃣', 'A pre-filled message opens in WhatsApp — just send it'],
              ['3️⃣', 'Our team confirms your transfer (usually within minutes)'],
              ['4️⃣', 'Tokens appear in your balance — you get an email confirmation'],
            ].map(([step, text]) => (
              <div key={step} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:8 }}>
                <span style={{ fontSize:16, flexShrink:0 }}>{step}</span>
                <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)', lineHeight:1.5 }}>{text}</span>
              </div>
            ))}
          </div>

        </>) : (<>

          {/* History */}
          {history.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', color:MUTED }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📋</div>
              <div>No transactions yet</div>
            </div>
          ) : history.map(tx => (
            <div key={tx.id} style={{
              background:CARD, border:`1px solid ${BORDER}`, borderRadius:12,
              padding:'12px 14px', marginBottom:8,
              display:'flex', justifyContent:'space-between', alignItems:'center',
            }}>
              <div>
                <div style={{ fontWeight:600, fontSize:13 }}>
                  {tx.status==='spent'
                    ? `Used: ${(tx.feature||'').replace(/_/g,' ')}`
                    : tx.status==='whatsapp_pending'
                      ? '⏳ WhatsApp payment pending'
                      : `Bought: ${tx.bundle_id||''} bundle`}
                </div>
                <div style={{ fontSize:11, color:MUTED, marginTop:2 }}>
                  {new Date(tx.created_at).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}
                  {tx.status==='whatsapp_pending' && ' · Awaiting confirmation'}
                </div>
              </div>
              <div style={{ fontWeight:800, fontSize:16, color: tx.tokens>0 ? GREEN : '#e74c3c' }}>
                {tx.tokens>0?`+${tx.tokens}`:tx.tokens} 🪙
              </div>
            </div>
          ))}
        </>)}
      </div>
    </div>
  );
}
