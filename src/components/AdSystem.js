/**
 * AdSystem.js — Scholars Syndicate
 * NEW FEATURE: Two ad formats for free users:
 *   1. InterstitialAd  — 5-second skippable between exam sessions
 *   2. RewardAd        — "Watch 30s ad to earn 5 tokens"
 *
 * Both are suppressed when the user has a premium token balance > 0.
 * Integrate:
 *   • InterstitialAd: render in ExamResults.js after each exam for non-premium users
 *   • RewardAd: render in GemStore.js / Dashboard.js to let free users earn tokens
 *
 * Uses Google AdSense by default (swappable for SME100 or any iframe-based network).
 * The REACT_APP_ADSENSE_CLIENT env var controls whether real ads show or placeholders.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import API from "../utils/api";

const ADSENSE_CLIENT = process.env.REACT_APP_ADSENSE_CLIENT; // e.g. "ca-pub-XXXXXXXXXXXXXXXX"
const AD_SLOT_INTERSTIT = process.env.REACT_APP_AD_SLOT_INTERSTIT || "0000000001";
const AD_SLOT_REWARD    = process.env.REACT_APP_AD_SLOT_REWARD    || "0000000002";
const REWARD_TOKENS     = 5;

// ── InterstitialAd ────────────────────────────────────────
// Between-session full-screen ad. Counts down 5s then shows Skip.
// Auto-closes after 30s.
export function InterstitialAd({ onClose, userTokenBalance = 0, isPremium = false }) {
  const [countdown, setCountdown] = useState(5);
  const [skippable,  setSkippable]  = useState(false);

  // Don't show ads to premium/token users
  if (isPremium || userTokenBalance > 0) {
    onClose?.();
    return null;
  }

  useEffect(() => {
    if (countdown <= 0) { setSkippable(true); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Auto-close after 30s if user ignores
  useEffect(() => {
    const t = setTimeout(() => onClose?.(), 30000);
    return () => clearTimeout(t);
  }, []);

  // Inject AdSense script once
  useEffect(() => {
    if (!ADSENSE_CLIENT) return;
    if (document.querySelector("script[data-adsense]")) return;
    const s = document.createElement("script");
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
    s.async = true; s.crossOrigin = "anonymous"; s.dataset.adsense = "1";
    document.head.appendChild(s);
    try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch {}
  }, []);

  return (
    <div style={{
      position:"fixed", inset:0, zIndex:9000,
      background:"rgba(10,10,15,0.97)", display:"flex", flexDirection:"column",
      alignItems:"center", justifyContent:"center", fontFamily:"inherit",
    }}>
      {/* Ad label */}
      <div style={{ position:"absolute", top:16, left:16, fontSize:11, color:"#6B7280", letterSpacing:".05em" }}>
        ADVERTISEMENT · Free users support Scholars Syndicate with ads
      </div>

      {/* Skip / countdown */}
      <div style={{ position:"absolute", top:12, right:12 }}>
        {skippable ? (
          <button onClick={() => onClose?.()} style={{
            background:"rgba(255,255,255,0.1)", border:"1px solid rgba(255,255,255,0.2)",
            color:"#fff", padding:"8px 18px", borderRadius:20, cursor:"pointer", fontWeight:700, fontSize:13,
          }}>
            Skip Ad ✕
          </button>
        ) : (
          <div style={{
            background:"rgba(255,255,255,0.08)", borderRadius:20, padding:"8px 18px",
            color:"#9CA3AF", fontSize:13, fontWeight:700,
          }}>
            Skip in {countdown}s
          </div>
        )}
      </div>

      {/* Ad unit */}
      <div style={{ width:"min(360px,90vw)", minHeight:250 }}>
        {ADSENSE_CLIENT ? (
          <ins className="adsbygoogle"
            style={{ display:"block" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={AD_SLOT_INTERSTIT}
            data-ad-format="auto"
            data-full-width-responsive="true" />
        ) : (
          <PlaceholderAd label="Interstitial Ad" height={250} />
        )}
      </div>

      {/* Upsell to remove ads */}
      <div style={{ marginTop:20, textAlign:"center" }}>
        <div style={{ color:"#6B7280", fontSize:12 }}>Want an ad-free experience?</div>
        <button
          onClick={() => { onClose?.(); window.location.href="/store"; }}
          style={{
            marginTop:6, background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)",
            border:"none", color:"#fff", padding:"8px 20px", borderRadius:20,
            fontWeight:700, fontSize:13, cursor:"pointer",
          }}
        >
          🎫 Get Tokens — Remove Ads
        </button>
      </div>
    </div>
  );
}

// ── RewardAd ──────────────────────────────────────────────
// "Watch 30s ad → earn 5 tokens". Triggered by student, not forced.
export function RewardAd({ onEarned, onClose }) {
  const [phase, setPhase] = useState("confirm"); // confirm | watching | done | error
  const [remaining, setRemaining] = useState(30);
  const timerRef = useRef(null);

  const startWatching = () => {
    setPhase("watching");
    setRemaining(30);
    timerRef.current = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          clearInterval(timerRef.current);
          creditTokens();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  };

  const creditTokens = useCallback(async () => {
    try {
      await API.post("/tokens/reward-ad", { tokens: REWARD_TOKENS });
      setPhase("done");
      onEarned?.(REWARD_TOKENS);
    } catch {
      setPhase("error");
    }
  }, [onEarned]);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const overlay = {
    position:"fixed", inset:0, zIndex:9100,
    background:"rgba(10,10,15,0.97)", display:"flex", flexDirection:"column",
    alignItems:"center", justifyContent:"center", fontFamily:"inherit", padding:24,
  };

  if (phase === "confirm") return (
    <div style={overlay}>
      <div style={{ fontSize:48, marginBottom:12 }}>🎁</div>
      <div style={{ color:"#fff", fontWeight:900, fontSize:20, marginBottom:8 }}>Earn Free Tokens</div>
      <div style={{ color:"#9CA3AF", fontSize:14, textAlign:"center", maxWidth:300, lineHeight:1.6, marginBottom:24 }}>
        Watch a 30-second ad and earn <strong style={{color:"#FFC857"}}>{REWARD_TOKENS} free tokens</strong> — use them for AI Tutor or to spin the wheel.
      </div>
      <button onClick={startWatching} style={{
        background:"linear-gradient(135deg,#FFC857,#FF9F43)", border:"none",
        color:"#1a1a2e", fontWeight:900, fontSize:15, padding:"14px 32px",
        borderRadius:14, cursor:"pointer", boxShadow:"0 8px 24px rgba(255,200,87,0.35)",
      }}>
        ▶ Watch Ad → Earn {REWARD_TOKENS} Tokens
      </button>
      <button onClick={onClose} style={{ marginTop:14, background:"none", border:"none", color:"#6B7280", cursor:"pointer", fontSize:13 }}>
        No thanks
      </button>
    </div>
  );

  if (phase === "watching") return (
    <div style={overlay}>
      <div style={{ color:"#9CA3AF", fontSize:12, marginBottom:16, letterSpacing:".05em" }}>
        ADVERTISEMENT — Keep this open to earn your tokens
      </div>
      <div style={{ width:"min(360px,90vw)", minHeight:250 }}>
        {ADSENSE_CLIENT ? (
          <ins className="adsbygoogle"
            style={{ display:"block" }}
            data-ad-client={ADSENSE_CLIENT}
            data-ad-slot={AD_SLOT_REWARD}
            data-ad-format="auto"
            data-full-width-responsive="true" />
        ) : (
          <PlaceholderAd label="Reward Ad (30s)" height={250} />
        )}
      </div>
      <div style={{ marginTop:20, textAlign:"center" }}>
        <div style={{
          width:64, height:64, borderRadius:"50%",
          background:"linear-gradient(135deg,#7C5CFF,#5B8CFF)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:22, fontWeight:900, color:"#fff", margin:"0 auto 8px",
        }}>
          {remaining}
        </div>
        <div style={{ color:"#9CA3AF", fontSize:13 }}>seconds until tokens are credited</div>
      </div>
    </div>
  );

  if (phase === "done") return (
    <div style={overlay}>
      <div style={{ fontSize:52 }}>🎉</div>
      <div style={{ color:"#FFC857", fontWeight:900, fontSize:20, margin:"12px 0 8px" }}>
        +{REWARD_TOKENS} Tokens Earned!
      </div>
      <div style={{ color:"#9CA3AF", fontSize:13, marginBottom:24 }}>Credited to your account</div>
      <button onClick={onClose} style={{
        background:"linear-gradient(135deg,#00D4AA,#22C55E)", border:"none",
        color:"#fff", fontWeight:800, fontSize:15, padding:"13px 28px",
        borderRadius:14, cursor:"pointer",
      }}>
        Back to App ✓
      </button>
    </div>
  );

  return (
    <div style={overlay}>
      <div style={{ fontSize:40 }}>⚠️</div>
      <div style={{ color:"#e17055", fontWeight:800, fontSize:16, margin:"10px 0 8px" }}>Couldn't credit tokens</div>
      <div style={{ color:"#9CA3AF", fontSize:13, marginBottom:20 }}>Please try again later.</div>
      <button onClick={onClose} style={{
        background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)",
        color:"#fff", padding:"10px 24px", borderRadius:12, cursor:"pointer", fontWeight:700,
      }}>
        Close
      </button>
    </div>
  );
}

// ── Placeholder (shown when ADSENSE_CLIENT is not configured) ─
function PlaceholderAd({ label, height }) {
  return (
    <div style={{
      width:"100%", height, background:"rgba(255,255,255,0.04)",
      border:"1px dashed rgba(255,255,255,0.12)", borderRadius:12,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      color:"#6B7280", fontSize:13, gap:8,
    }}>
      <div style={{ fontSize:28 }}>📺</div>
      <div style={{ fontWeight:700 }}>{label}</div>
      <div style={{ fontSize:11 }}>Set REACT_APP_ADSENSE_CLIENT to show real ads</div>
    </div>
  );
}

// ── Hook: useAdSystem ─────────────────────────────────────
// Convenience hook to check whether to show ads and which type.
export function useAdSystem(student) {
  const isPremium  = !!student?.is_premium;
  const hasTokens  = (student?.token_balance ?? 0) > 0;
  const showAds    = !isPremium && !hasTokens;
  return { showAds, isPremium, hasTokens };
}
