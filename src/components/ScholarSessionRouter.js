/**
 * NOT USED — not imported anywhere in the app. Left here for reference only.
 * Navigates to /classroom/ide/electronics and /classroom/ide/python, which
 * are not real routes (see App.js) — wiring this in as-is would break
 * navigation. Real entry points are /classroom/ide and
 * /classroom/ide?tab=arduino, already handled by ClassroomLobby.js.
 *
 * ScholarSessionRouter — Pre-routing modal for Scholar Sessions
 * 
 * Before entering any IDE or classroom, ask students what they want:
 * 1. Join a Learning Class (live with teacher)
 * 2. Practice Electronics (Arduino simulator)
 * 3. Practice Programming (Python IDE)
 * 
 * This prevents confusion and ensures context-aware navigation.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ScholarSessionRouter.css';

export default function ScholarSessionRouter({ isOpen, onClose }) {
  const nav = useNavigate();
  const [selected, setSelected] = useState(null);

  const options = [
    {
      id: 'class',
      title: '🎓 Join a Learning Class',
      description: 'Learn live with your teacher in a virtual classroom',
      color: '#6366f1',
      action: () => nav('/classroom'),
    },
    {
      id: 'electronics',
      title: '⚡ Practice Electronics',
      description: 'Build circuits with Arduino, LEDs, sensors & more',
      color: '#ec4899',
      action: () => nav('/classroom/ide/electronics'),
    },
    {
      id: 'programming',
      title: '🐍 Practice Programming',
      description: 'Write Python code and run it instantly',
      color: '#3b82f6',
      action: () => nav('/classroom/ide/python'),
    },
  ];

  if (!isOpen) return null;

  return (
    <div className="scholar-session-router-overlay">
      <div className="scholar-session-router-modal">
        <div className="modal-header">
          <h2>📚 Scholar Sessions</h2>
          <p>What would you like to do today?</p>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="options-grid">
          {options.map(opt => (
            <div
              key={opt.id}
              className={`option-card ${selected === opt.id ? 'selected' : ''}`}
              onClick={() => setSelected(opt.id)}
              style={{ borderColor: selected === opt.id ? opt.color : '#e5e7eb' }}
            >
              <div className="option-icon">{opt.title.split(' ')[0]}</div>
              <h3>{opt.title}</h3>
              <p>{opt.description}</p>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="btn-continue"
            disabled={!selected}
            onClick={() => {
              const option = options.find(o => o.id === selected);
              if (option) {
                onClose();
                setTimeout(() => option.action(), 100);
              }
            }}
          >
            Continue →
          </button>
        </div>
      </div>
    </div>
  );
}
