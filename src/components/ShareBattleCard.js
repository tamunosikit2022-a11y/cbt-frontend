import React from 'react';
import { FacebookShareButton, TwitterShareButton, WhatsappShareButton } from 'react-share';

const ShareBattleCard = ({ battleData, onClose }) => {
  const shareUrl = window.location.href;
  const title = `I just scored ${battleData.score} in Scholars Syndicate! Can you beat me?`;

  return (
    <div className="share-battle-card">
      <h3>Share Your Victory! 🏆</h3>
      <p>Score: {battleData.score}</p>
      <div className="share-buttons">
        <FacebookShareButton url={shareUrl} quote={title}>
          Facebook
        </FacebookShareButton>
        <TwitterShareButton url={shareUrl} title={title}>
          Twitter
        </TwitterShareButton>
        <WhatsappShareButton url={shareUrl} title={title}>
          WhatsApp
        </WhatsappShareButton>
      </div>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

export default ShareBattleCard;
