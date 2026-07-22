/**
 * AdUnit.js
 * ──────────────────────────────────────────────────────────────
 * Google AdSense ad placement. Renders nothing for Premium students
 * (checks student.is_premium from AuthContext). For Free-tier students,
 * renders a responsive AdSense unit.
 *
 * SETUP REQUIRED before this does anything:
 *   1. Get approved for Google AdSense.
 *   2. Add the AdSense loader script to public/index.html (see README note below).
 *   3. Replace ADSENSE_CLIENT below with your real ca-pub-XXXXXXXXXXXXXXXX ID.
 *   4. Create an ad unit in the AdSense dashboard (Ads → By ad unit) and pass
 *      its numeric slot ID into <AdUnit slot="1234567890" />.
 *
 * Usage:
 *   <AdUnit slot="1234567890" />                         // standard responsive banner
 *   <AdUnit slot="1234567890" style={{ minHeight: 250 }} />  // reserve space to avoid layout shift
 */
import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const ADSENSE_CLIENT = "ca-pub-XXXXXXXXXXXXXXXX"; // ← replace with your real AdSense publisher ID

export default function AdUnit({ slot, format = "auto", style }) {
  const { student } = useAuth();
  const pushed = useRef(false);
  const containerRef = useRef(null);

  const isFreeTier = !student?.is_premium;

  useEffect(() => {
    if (!isFreeTier || pushed.current) return;
    if (!window.adsbygoogle) return; // loader script not present yet — see index.html setup
    try {
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch (e) {
      console.error("AdSense push failed", e);
    }
  }, [isFreeTier]);

  if (!isFreeTier) return null;
  if (!slot) return null; // safety: never render a broken/empty ad slot

  return (
    <div ref={containerRef} style={{ width: "100%", textAlign: "center", margin: "16px 0", ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
