import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { disconnectArena } from "../../utils/arenaSocket";
import { useAuth } from "../../context/AuthContext";
import SharePanel, { generateShareText } from "../../components/ShareBattleCard";

const RANK_COLORS = ["#FFD700","#C0C0C0","#CD7F32"];
const RANK_ICONS  = ["🥇","🥈","🥉"];

export default function ArenaResults() {
  const { state } = useLocation();
  const nav = useNavigate();
  const { student } = useAuth();
  const [showShare, setShowShare] = useState(false);

  const { scores = [], winner, totalQ, playerId, room } = state || {};

  const myResult  = scores.find(s => s.playerId === playerId);
  const opponent  = scores.find(s => s.playerId !== playerId && scores.length === 2);
  const isWinner  = winner?.playerId === playerId;

  const handlePlay = () => {
    disconnectArena();
    nav("/arena");
  };

  return (
    <div style={s.page}>
      <div style={s.container}>

        {/* WINNER BANNER */}
        <div style={s.winnerBanner}>
          <div style={{ fontSize: 64 }}>{isWinner ? "🏆" : myResult?.rank <= 3 ? RANK_ICONS[myResult.rank - 1] : "💪"}</div>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 900, marginBottom: 4 }}>
            {isWinner ? "YOU WIN!" : `Rank #${myResult?.rank || "?"}`}
          </h1>
          {winner && !isWinner && (
            <p style={{ color: "#a29bfe", fontSize: 14 }}>
              Winner: <strong style={{ color: "#fff" }}>{winner.name}</strong> with {winner.score} points
            </p>
          )}
        </div>

        {/* MY STATS */}
        {myResult && (
          <div style={s.myStats}>
            <StatBox label="Your Score" value={myResult.score} color="#6c63ff" />
            <StatBox label="Your Rank"  value={`#${myResult.rank}`} color={RANK_COLORS[myResult.rank - 1] || "#636e72"} />
            <StatBox label="Questions"  value={totalQ} color="#00b894" />
          </div>
        )}

        {/* FULL SCOREBOARD */}
        <div style={s.panel}>
          <h3 style={s.panelTitle}>Final Scoreboard</h3>
          {scores.map((p, i) => (
            <div key={p.playerId}
              style={{ ...s.row, background: p.playerId === playerId ? "#6c63ff22" : "#0f0f1a", border: p.playerId === playerId ? "1px solid #6c63ff" : "1px solid #2d2d44", opacity: p.eliminated ? 0.5 : 1 }}>
              <div style={{ ...s.rankCircle, background: i < 3 ? RANK_COLORS[i] : "#2d2d44", color: i < 3 ? "#000" : "#fff" }}>
                {i < 3 ? RANK_ICONS[i] : `#${p.rank}`}
              </div>
              <span style={{ fontSize: 24 }}>{p.avatar}</span>
              <div style={{ flex: 1, marginLeft: 4 }}>
                <div style={{ color: "#fff", fontWeight: p.playerId === playerId ? 800 : 500, fontSize: 14 }}>
                  {p.name} {p.playerId === playerId && <span style={{ color: "#6c63ff", fontSize: 11 }}>(You)</span>}
                </div>
                {p.eliminated && <div style={{ fontSize: 11, color: "#e17055" }}>Eliminated</div>}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 900, fontSize: 20, color: i === 0 ? "#FFD700" : "#fff" }}>{p.score}</div>
                <div style={{ fontSize: 11, color: "#636e72" }}>points</div>
              </div>
            </div>
          ))}
        </div>

        {/* MATCH INFO */}
        {room && (
          <div style={s.matchInfo}>
            <span>Mode: {room.mode?.replace("_"," ")}</span>
            <span>·</span>
            <span>Type: {room.battleType?.replace("_"," ")}</span>
            {room.subject && <><span>·</span><span>{room.subject}</span></>}
          </div>
        )}

        {/* ACTIONS */}
        <div style={s.actions}>
          <button style={s.playAgain} onClick={handlePlay}>🏟️ Play Again</button>
          <button style={{ ...s.playAgain, background:"#25D366" }} onClick={() => setShowShare(true)}>📤 Share</button>
          <button style={s.dashboard} onClick={() => { disconnectArena(); nav("/dashboard"); }}>🏠 Dashboard</button>
        </div>
      </div>

      {showShare && (
        <SharePanel
          shareText={generateShareText({
            studentName: student?.full_name || "Scholar",
            score: myResult?.score || 0,
            total: totalQ || 20,
            subject: room?.subject || "JAMB",
            opponent: opponent?.name,
            won: isWinner,
          })}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ flex: 1, background: "#1a1a2e", borderRadius: 12, padding: "14px 10px", textAlign: "center", border: "1px solid #2d2d44" }}>
      <div style={{ fontSize: 24, fontWeight: 900, color }}>{value}</div>
      <div style={{ fontSize: 12, color: "#636e72", marginTop: 2 }}>{label}</div>
    </div>
  );
}

const s = {
  page:         { minHeight: "100vh", background: "#0f0f1a", fontFamily: "sans-serif", padding: 16 },
  container:    { maxWidth: 600, margin: "0 auto" },
  winnerBanner: { textAlign: "center", padding: "32px 20px", background: "linear-gradient(135deg,#1a1a2e,#2d2d44)", borderRadius: 16, marginBottom: 16, border: "1px solid #2d2d44" },
  myStats:      { display: "flex", gap: 10, marginBottom: 16 },
  panel:        { background: "#1a1a2e", borderRadius: 14, padding: "16px", border: "1px solid #2d2d44", marginBottom: 14 },
  panelTitle:   { color: "#fff", fontSize: 16, fontWeight: 700, marginBottom: 12 },
  row:          { display: "flex", alignItems: "center", gap: 10, borderRadius: 10, padding: "10px 12px", marginBottom: 8 },
  rankCircle:   { width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0 },
  matchInfo:    { display: "flex", gap: 8, justifyContent: "center", color: "#636e72", fontSize: 13, marginBottom: 14, flexWrap: "wrap" },
  actions:      { display: "flex", gap: 10 },
  playAgain:    { flex: 1, padding: 14, background: "linear-gradient(135deg,#6c63ff,#3f51b5)", color: "#fff", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: "pointer" },
  dashboard:    { flex: 1, padding: 14, background: "#2d2d44", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" },
};
