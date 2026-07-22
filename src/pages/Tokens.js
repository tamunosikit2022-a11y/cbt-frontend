import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import API from '../utils/api';

const COSTS = [
  { icon:'🤖', label:'AI Tutor message',        cost:1 },
  { icon:'⚔️', label:'Host arena battle',       cost:2 },
  { icon:'🎰', label:'Extra daily spin',         cost:1 },
  { icon:'📄', label:'PDF vault download',       cost:1 },
  { icon:'📊', label:'Predicted score report',   cost:3 },
];

export function TokensPanel() {
  const [params] = useSearchParams();
  const [balance,  setBalance]  = useState(null);
  const [bundles,  setBundles]  = useState([]);
  const [history,  setHistory]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('buy');
  const [buying,   setBuying]   = useState(null);
  const [waInfo,   setWaInfo]   = useState(null);
  const [paystackEnabled, setPaystackEnabled] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (params.get('payment') === 'success') setShowSuccess(true);
    Promise.all([API.get('/tokens/balance'), API.get('/tokens/history')])
      .then(([b, h]) => {
        setBalance(b.data.token_balance);
        setBundles(b.data.bundles || []);
        setPaystackEnabled(b.data.paystack_enabled || false);
        setHistory(h.data.transactions || []);
      }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleBuy = async (bundle) => {
    if (buying) return;
    setBuying(bundle.id);
    try {
      if (paystackEnabled) {
        const { data } = await API.post('/tokens/initialize', { bundleId: bundle.id });
        window.location.href = data.authorization_url;
      } else {
        const { data } = await API.post('/tokens/whatsapp', { bundleId: bundle.id });
        setWaInfo({ url: data.whatsapp_url, bundle });
      }
    } catch { } finally { setBuying(null); }
  };

  const s = {
    page:    { minHeight:'100dvh', background:'var(--bg)', color:'var(--text)', fontFamily:"'Inter',sans-serif", paddingBottom:80 },
    header:  { display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid var(--border)', position:'sticky', top:0, background:'var(--bg)', zIndex:10 },
    back:    { background:'none', border:'none', color:'var(--text-muted)', fontSize:20, cursor:'pointer', display:'flex', alignItems:'center', padding:4, minHeight:36 },
    bal:     { marginLeft:'auto', background:'var(--surface-alt)', borderRadius:20, padding:'6px 14px', display:'flex', alignItems:'center', gap:6, fontSize:14, fontWeight:700 },
    tabs:    { display:'flex', borderBottom:'1px solid var(--border)', background:'var(--bg)', position:'sticky', top:53, zIndex:9 },
    tab:     (a) => ({ flex:1, padding:'13px 8px', background:'none', border:'none', color: a ? 'var(--primary)' : 'var(--text-muted)', fontSize:14, fontWeight:600, borderBottom: a ? '2px solid var(--primary)' : '2px solid transparent', cursor:'pointer', transition:'all .15s' }),
    body:    { padding:'0 16px' },
    sec:     { fontSize:11, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--text-muted)', margin:'20px 0 10px' },
    bundle:  (pop) => ({ background: pop ? 'color-mix(in srgb, var(--primary) 12%, var(--surface))' : 'var(--surface)', border:`1px solid ${pop ? 'var(--primary)' : 'var(--border)'}`, borderRadius:14, padding:'14px 16px', marginBottom:10, display:'flex', alignItems:'center', gap:14, position:'relative', cursor:'pointer', transition:'border-color .15s' }),
    popBadge:{ position:'absolute', top:-1, right:12, background:'var(--primary)', color:'#fff', fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:'0 0 8px 8px' },
    tAmount: { fontSize:24, fontWeight:800, color:'var(--text)', lineHeight:1 },
    tLabel:  { fontSize:12, color:'var(--text-muted)', marginTop:2 },
    tPrice:  { marginLeft:'auto', textAlign:'right' },
    buyBtn:  (loading) => ({ background: loading ? 'var(--surface-alt)' : 'var(--primary)', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', flexShrink:0, minWidth:80, opacity: loading ? 0.6 : 1 }),
    costRow: { display:'flex', alignItems:'center', gap:12, padding:'11px 0', borderBottom:'1px solid var(--border)' },
    txRow:   { display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid var(--border)' },
  };

  if (loading) return (
    <div style={{ ...s.page, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'var(--text-muted)', fontSize:14 }}>Loading...</div>
    </div>
  );

  return (
    <div style={s.page}>
      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={{ fontSize:17, fontWeight:800 }}>Token Store</div>
          <div style={{ fontSize:12, color:'var(--text-muted)' }}>Unlock AI features</div>
        </div>
        <div style={s.bal}>
          <span>🪙</span>
          <span>{balance ?? 0}</span>
        </div>
      </div>

      {/* Success banner */}
      {showSuccess && (
        <div style={{ margin:'12px 16px', background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:12, padding:'12px 16px', display:'flex', gap:10, alignItems:'center' }}>
          <span style={{ fontSize:20 }}>✅</span>
          <div>
            <div style={{ fontWeight:700, fontSize:14, color:'#4ADE80' }}>Payment confirmed!</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>Tokens added to your balance</div>
          </div>
        </div>
      )}

      {/* WhatsApp modal */}
      {waInfo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:9999, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'var(--surface)', borderRadius:'20px 20px 0 0', padding:24, width:'100%', maxWidth:480 }}>
            <div style={{ fontSize:18, fontWeight:800, marginBottom:6 }}>Pay via WhatsApp</div>
            <div style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>
              Send <strong style={{ color:'var(--text)' }}>{waInfo.bundle.price}</strong> to our admin on WhatsApp. Tokens are credited within minutes.
            </div>
            <a href={waInfo.url} target="_blank" rel="noreferrer"
              style={{ display:'block', background:'#25D366', color:'#fff', borderRadius:12, padding:'14px 0', textAlign:'center', fontWeight:700, fontSize:15, textDecoration:'none', marginBottom:10 }}>
              Open WhatsApp →
            </a>
            <button onClick={() => setWaInfo(null)}
              style={{ width:'100%', background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', borderRadius:12, padding:'12px 0', fontSize:14, fontWeight:500 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={s.tabs}>
        {['buy','what','history'].map(t => (
          <button key={t} style={s.tab(tab===t)} onClick={() => setTab(t)}>
            {t === 'buy' ? 'Buy Tokens' : t === 'what' ? 'What tokens do' : 'History'}
          </button>
        ))}
      </div>

      <div style={s.body}>
        {/* BUY TAB */}
        {tab === 'buy' && (
          <>
            <div style={s.sec}>Choose a plan</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginBottom:16 }}>
              {paystackEnabled ? 'Pay securely with card or bank transfer.' : 'Pay via WhatsApp — quick and easy. Tokens credited in minutes.'}
            </div>
            {bundles.map(b => (
              <div key={b.id} style={s.bundle(b.popular)}>
                {b.popular && <div style={s.popBadge}>BEST VALUE</div>}
                {b.badge && !b.popular && <div style={{ ...s.popBadge, background:'var(--surface-alt)', color:'var(--text-sub)', border:'1px solid var(--border)' }}>{b.badge}</div>}
                <div>
                  <div style={s.tAmount}>{b.tokens}</div>
                  <div style={s.tLabel}>tokens · {b.perToken}</div>
                </div>
                <div style={s.tPrice}>
                  <div style={{ fontSize:17, fontWeight:800, color:'var(--primary)' }}>{b.price}</div>
                  <div style={{ fontSize:11, color:'var(--text-muted)' }}>one-time</div>
                </div>
                <button style={s.buyBtn(buying === b.id)} onClick={() => handleBuy(b)} disabled={!!buying}>
                  {buying === b.id ? '...' : 'Buy'}
                </button>
              </div>
            ))}
          </>
        )}

        {/* WHAT TAB */}
        {tab === 'what' && (
          <>
            <div style={s.sec}>Token uses</div>
            {COSTS.map((c, i) => (
              <div key={i} style={s.costRow}>
                <span style={{ fontSize:20, width:30, textAlign:'center' }}>{c.icon}</span>
                <span style={{ fontSize:14, color:'var(--text)', flex:1 }}>{c.label}</span>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--primary)', background:'color-mix(in srgb, var(--primary) 12%, transparent)', borderRadius:20, padding:'3px 10px' }}>
                  {c.cost} token{c.cost > 1 ? 's' : ''}
                </span>
              </div>
            ))}
            <div style={{ marginTop:20, padding:14, background:'var(--surface)', borderRadius:12, border:'1px solid var(--border)' }}>
              <div style={{ fontSize:13, fontWeight:600, marginBottom:6 }}>💡 Tip</div>
              <div style={{ fontSize:13, color:'var(--text-muted)', lineHeight:1.6 }}>
                Tokens never expire. Start with ₦100 to try the platform, then top up as you need more.
              </div>
            </div>
          </>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <>
            <div style={s.sec}>Transaction history</div>
            {history.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0', color:'var(--text-muted)', fontSize:13 }}>
                No transactions yet
              </div>
            ) : history.map((tx, i) => (
              <div key={i} style={s.txRow}>
                <div style={{ width:36, height:36, borderRadius:10, background:'var(--surface-alt)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                  {tx.tokens > 0 ? '➕' : '➖'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {tx.feature || tx.bundle_id || 'Token purchase'}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text-muted)' }}>
                    {new Date(tx.created_at).toLocaleDateString('en-NG', { day:'numeric', month:'short' })}
                  </div>
                </div>
                <div style={{ fontWeight:700, fontSize:14, color: tx.tokens > 0 ? '#4ADE80' : '#F87171', flexShrink:0 }}>
                  {tx.tokens > 0 ? `+${tx.tokens}` : tx.tokens} 🪙
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
