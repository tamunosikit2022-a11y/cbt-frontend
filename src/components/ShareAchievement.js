import { useRef } from "react";

/**
 * ShareAchievement — generates a shareable PNG achievement card
 * using Canvas API. No external service needed.
 */
export default function ShareAchievement({ data, onClose }) {
  const canvasRef = useRef(null);

  const {
    name       = "Scholar",
    score      = 0,
    total      = 100,
    subject    = "JAMB Practice",
    percentage = Math.round((score / total) * 100),
    streak     = 0,
    badge      = "📚",
  } = data || {};

  const grade = percentage >= 90 ? { label:"S Rank", color:"#ffd700" }
    : percentage >= 75 ? { label:"A Grade", color:"#00b894" }
    : percentage >= 60 ? { label:"B Grade", color:"#74b9ff" }
    : percentage >= 50 ? { label:"C Grade", color:"#a29bfe" }
    : { label:"Keep Studying", color:"#e17055" };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 600, H = 340;
    canvas.width  = W;
    canvas.height = H;

    // Background
    ctx.fillStyle = "#0f0f1e";
    ctx.roundRect ? ctx.roundRect(0, 0, W, H, 20) : ctx.fillRect(0, 0, W, H);
    ctx.fill();

    // Purple accent strip
    ctx.fillStyle = "#6c63ff";
    ctx.fillRect(0, 0, 6, H);

    // Brand
    ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#a29bfe";
    ctx.fillText("SCHOLARS SYNDICATE", 30, 35);

    // Badge
    ctx.font = "52px serif";
    ctx.fillText(badge, W - 80, 65);

    // Name
    ctx.font = "bold 22px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#f0f4ff";
    ctx.fillText(name, 30, 80);

    // Subject
    ctx.font = "13px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#8b9cbd";
    ctx.fillText(subject, 30, 105);

    // Big score
    ctx.font = "bold 80px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = grade.color;
    ctx.fillText(`${percentage}%`, 24, 205);

    // Score detail
    ctx.font = "16px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#6b7db3";
    ctx.fillText(`${score} / ${total} correct`, 30, 235);

    // Grade label
    ctx.font = "bold 18px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = grade.color;
    ctx.fillText(grade.label, 30, 265);

    // Streak if any
    if (streak > 0) {
      ctx.font = "14px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = "#fdcb6e";
      ctx.fillText(`🔥 ${streak} day streak`, 30, 295);
    }

    // Divider
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(30, 315); ctx.lineTo(W - 30, 315);
    ctx.stroke();

    // Footer
    ctx.font = "11px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = "#8b9cbd";
    ctx.fillText("Practice JAMB · Post-UTME · Battle in Arena @ Scholars Syndicate", 30, 333);

    // Progress bar bg
    ctx.fillStyle = "rgba(255,255,255,0.07)";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(W - 140, 140, 110, 110, 55);
    else ctx.arc(W - 85, 195, 55, 0, Math.PI * 2);
    ctx.fill();

    // Progress arc
    const pct = percentage / 100;
    ctx.strokeStyle = grade.color;
    ctx.lineWidth   = 8;
    ctx.lineCap     = "round";
    ctx.beginPath();
    ctx.arc(W - 85, 195, 46, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * pct));
    ctx.stroke();

    // Center percent text
    ctx.font = "bold 20px 'Plus Jakarta Sans', sans-serif";
    ctx.fillStyle = grade.color;
    ctx.textAlign = "center";
    ctx.fillText(`${percentage}%`, W - 85, 203);
    ctx.textAlign = "left";
  };

  const download = () => {
    draw();
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `scholars-${name.replace(/\s+/g,"-")}-${percentage}pct.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const share = async () => {
    draw();
    const canvas = canvasRef.current;
    canvas.toBlob(async (blob) => {
      const file = new File([blob], "scholars-result.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title:  "My Scholars Syndicate Score",
          text:   `I scored ${percentage}% on ${subject}! Practice JAMB on Scholars Syndicate 📚`,
          files:  [file],
        });
      } else {
        download(); // Fallback
      }
    }, "image/png");
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.85)",
      zIndex:9999, display:"flex", alignItems:"center", justifyContent:"center",
      flexDirection:"column", padding:20,
      fontFamily:"'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ background:"#1a1a2e", borderRadius:16, padding:24, maxWidth:640, width:"100%",
                    border:"1px solid rgba(255,255,255,0.1)", boxShadow:"0 20px 60px rgba(0,0,0,0.6)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
          <h3 style={{ margin:0, color:"#f0f4ff", fontSize:16, fontWeight:700 }}>🎉 Share Your Result</h3>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#8b9cbd", cursor:"pointer", fontSize:20 }}>×</button>
        </div>

        {/* Preview */}
        <div onClick={draw} style={{ cursor:"pointer", borderRadius:12, overflow:"hidden", marginBottom:16, border:"1px solid rgba(255,255,255,0.08)" }}>
          <canvas ref={canvasRef} style={{ width:"100%", display:"block" }} />
          {/* Render immediately */}
          <div ref={() => setTimeout(draw, 50)} />
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
          <button onClick={share} style={{
            background:"#6c63ff", color:"#fff", border:"none",
            borderRadius:10, padding:"12px 0", fontWeight:700, cursor:"pointer", fontSize:14,
          }}>
            📤 Share Card
          </button>
          <button onClick={download} style={{
            background:"var(--surface, #2d3436)", color:"#f0f4ff",
            border:"1px solid rgba(255,255,255,0.1)",
            borderRadius:10, padding:"12px 0", fontWeight:700, cursor:"pointer", fontSize:14,
          }}>
            💾 Download PNG
          </button>
        </div>
      </div>
    </div>
  );
}
