/**
 * NOT USED — not imported anywhere in the app. Left here for reference only.
 * Duplicates functionality that already exists and is wired in at
 * src/pages/classroom/liveide/componentShapes.js (used by CircuitCanvas.js),
 * including real resistor color-band coding and LED glow states.
 *
 * RealisticComponent — Photorealistic SVG rendering for electronics components
 * 
 * Each component (LED, resistor, Arduino, breadboard) renders with realistic:
 * - Actual appearance (color bands, dome shape, pin labels)
 * - Interactive properties (double-click to edit, tooltip on hover)
 * - Visual feedback (glow when active, burn effect if fried)
 * 
 * Usage:
 *   <RealisticComponent type="led" x={100} y={200} powered={true} 
 *                       onDoubleClick={editProps} />
 */
import React, { useState } from 'react';

const ComponentRenderer = {
  // ─────────────────────────────────────────────────────────────────
  // LED (Light Emitting Diode)
  // ─────────────────────────────────────────────────────────────────
  led: ({ x, y, powered, burnt, onDoubleClick, color = '#ff0000' }) => {
    const glowOpacity = powered ? 0.8 : 0;
    const glowColor = color === '#ff0000' ? 'rgb(255, 100, 100)' : 
                      color === '#00ff00' ? 'rgb(100, 255, 100)' :
                      color === '#ffff00' ? 'rgb(255, 255, 100)' : color;
    
    return (
      <g onDoubleClick={onDoubleClick} style={{ cursor: 'pointer' }}>
        {/* Anode (positive leg) */}
        <line x1={x + 15} y1={y} x2={x + 15} y2={y - 30} stroke="#888" strokeWidth="2" />
        
        {/* Cathode (negative leg) */}
        <line x1={x - 15} y1={y} x2={x - 15} y2={y + 30} stroke="#333" strokeWidth="2" />
        
        {/* Dome (realistic LED shape) */}
        <ellipse cx={x} cy={y} rx={12} ry={14} fill={color} fillOpacity={powered ? 0.9 : 0.3} />
        <ellipse cx={x - 4} cy={y - 4} rx={5} ry={6} fill="white" fillOpacity={powered ? 0.6 : 0.1} />
        
        {/* Glow effect when powered */}
        {powered && (
          <>
            <filter id={`ledGlow-${x}-${y}`}>
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <circle cx={x} cy={y} r={20} fill={glowColor} opacity={0.3} filter={`url(#ledGlow-${x}-${y})`} />
          </>
        )}
        
        {/* Burnt indicator */}
        {burnt && (
          <circle cx={x} cy={y} r={16} fill="none" stroke="#222" strokeWidth="1" opacity="0.5" />
        )}
        
        {/* Label */}
        <text x={x} y={y + 40} textAnchor="middle" fontSize="10" fill="#666">LED</text>
      </g>
    );
  },

  // ─────────────────────────────────────────────────────────────────
  // RESISTOR (4-band color code)
  // ─────────────────────────────────────────────────────────────────
  resistor: ({ x, y, value = 220, onDoubleClick, tolerance = 5 }) => {
    // Convert value to 4-band color code (simplified)
    const bands = _resistorBands(value, tolerance);
    
    return (
      <g onDoubleClick={onDoubleClick} style={{ cursor: 'pointer' }}>
        {/* Left leg */}
        <line x1={x - 40} y1={y} x2={x - 18} y2={y} stroke="#888" strokeWidth="2" />
        
        {/* Resistor body */}
        <rect x={x - 16} y={y - 6} width={32} height={12} fill="#d4a574" stroke="#8b6f47" strokeWidth="1" />
        
        {/* Color bands */}
        {bands.map((color, i) => (
          <rect
            key={i}
            x={x - 12 + i * 6}
            y={y - 6}
            width={4}
            height={12}
            fill={color}
            stroke="none"
          />
        ))}
        
        {/* Right leg */}
        <line x1={x + 18} y1={y} x2={x + 40} y2={y} stroke="#888" strokeWidth="2" />
        
        {/* Value label below */}
        <text x={x} y={y + 25} textAnchor="middle" fontSize="11" fill="#333" fontWeight="600">
          {_formatResistor(value)}
        </text>
      </g>
    );
  },

  // ─────────────────────────────────────────────────────────────────
  // PUSH BUTTON / SWITCH
  // ─────────────────────────────────────────────────────────────────
  pushButton: ({ x, y, pressed = false, onDoubleClick }) => {
    const buttonY = pressed ? y + 4 : y;
    
    return (
      <g onDoubleClick={onDoubleClick} style={{ cursor: 'pointer' }}>
        {/* Left pin */}
        <line x1={x - 20} y1={y} x2={x - 10} y2={y} stroke="#888" strokeWidth="2" />
        
        {/* Right pin */}
        <line x1={x + 10} y1={y} x2={x + 20} y2={y} stroke="#888" strokeWidth="2" />
        
        {/* Button body (rectangular) */}
        <rect x={x - 8} y={buttonY - 8} width={16} height={16} fill="#333" stroke="#000" strokeWidth="1" />
        
        {/* Button dome (realistic) */}
        <circle cx={x} cy={buttonY - 6} r={6} fill={pressed ? '#555' : '#666'} />
        <circle cx={x - 2} cy={buttonY - 7} r={2} fill="white" opacity={pressed ? 0.2 : 0.4} />
        
        {/* Label */}
        <text x={x} y={y + 28} textAnchor="middle" fontSize="10" fill="#666">BTN</text>
      </g>
    );
  },

  // ─────────────────────────────────────────────────────────────────
  // POTENTIOMETER / VARIABLE RESISTOR
  // ─────────────────────────────────────────────────────────────────
  potentiometer: ({ x, y, value = 50, onDoubleClick }) => {
    const rotation = (value / 100) * 270 - 135; // Rotate dial based on value
    
    return (
      <g onDoubleClick={onDoubleClick} style={{ cursor: 'pointer' }}>
        {/* Three pins */}
        <circle cx={x - 12} cy={y} r="2" fill="#888" />
        <circle cx={x + 12} cy={y} r="2" fill="#888" />
        <circle cx={x} cy={y - 12} r="2" fill="#888" />
        
        {/* Lines to pins */}
        <line x1={x - 12} y1={y} x2={x - 12} y2={y + 10} stroke="#888" strokeWidth="1" />
        <line x1={x + 12} y1={y} x2={x + 12} y2={y + 10} stroke="#888" strokeWidth="1" />
        <line x1={x} y1={y - 12} x2={x} y2={y - 20} stroke="#888" strokeWidth="1" />
        
        {/* Potentiometer body (circle) */}
        <circle cx={x} cy={y} r={14} fill="#555" stroke="#333" strokeWidth="1" />
        
        {/* Dial indicator */}
        <g transform={`rotate(${rotation} ${x} ${y})`}>
          <line x1={x} y1={y - 8} x2={x} y2={y - 12} stroke="#ffd700" strokeWidth="2" />
        </g>
        
        {/* Value label */}
        <text x={x} y={y + 30} textAnchor="middle" fontSize="10" fill="#666">{Math.round(value)}%</text>
      </g>
    );
  },

  // ─────────────────────────────────────────────────────────────────
  // ARDUINO UNO (Simplified board representation)
  // ─────────────────────────────────────────────────────────────────
  arduino: ({ x, y, onDoubleClick }) => {
    return (
      <g onDoubleClick={onDoubleClick} style={{ cursor: 'pointer' }}>
        {/* Board background */}
        <rect x={x - 45} y={y - 35} width={90} height={70} fill="#1a5490" stroke="#0d2d5f" strokeWidth="2" rx="4" />
        
        {/* USB port */}
        <rect x={x - 8} y={y - 38} width={16} height={6} fill="#333" stroke="#000" strokeWidth="1" />
        
        {/* ATmega chip */}
        <rect x={x - 10} y={y - 8} width={20} height={20} fill="#222" stroke="#555" strokeWidth="1" />
        <text x={x} y={y + 1} textAnchor="middle" fontSize="7" fill="#888" fontWeight="bold">328P</text>
        
        {/* Text label */}
        <text x={x} y={y + 28} textAnchor="middle" fontSize="11" fill="#fff" fontWeight="bold">Arduino UNO</text>
        
        {/* Pin indicators (left side) */}
        {[...Array(8)].map((_, i) => (
          <circle key={`pin-l-${i}`} cx={x - 42} cy={y - 28 + i * 8} r="1.5" fill="#ffd700" />
        ))}
        
        {/* Pin indicators (right side) */}
        {[...Array(8)].map((_, i) => (
          <circle key={`pin-r-${i}`} cx={x + 42} cy={y - 28 + i * 8} r="1.5" fill="#ffd700" />
        ))}
      </g>
    );
  },

  // ─────────────────────────────────────────────────────────────────
  // BREADBOARD (Solderless connection board)
  // ─────────────────────────────────────────────────────────────────
  breadboard: ({ x, y, cols = 30, rows = 8, onDoubleClick }) => {
    return (
      <g onDoubleClick={onDoubleClick} style={{ cursor: 'pointer' }}>
        {/* Board background */}
        <rect x={x} y={y} width={cols * 8} height={rows * 8} fill="#fff8e7" stroke="#d4af37" strokeWidth="2" />
        
        {/* Holes */}
        {[...Array(cols)].map((_, col) =>
          [...Array(rows)].map((_, row) => (
            <circle
              key={`hole-${col}-${row}`}
              cx={x + 4 + col * 8}
              cy={y + 4 + row * 8}
              r="1.5"
              fill="#333"
            />
          ))
        )}
        
        {/* Power rail labels (if standard layout) */}
        <text x={x + 2} y={y - 5} fontSize="8" fill="#666">+</text>
        <text x={x + 8} y={y - 5} fontSize="8" fill="#666">−</text>
        
        <text x={x} y={y + rows * 8 + 12} fontSize="9" fill="#999">Solderless Breadboard</text>
      </g>
    );
  },
};

// ──────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ──────────────────────────────────────────────────────────────────

function _resistorBands(ohms, tolerance = 5) {
  // 4-band resistor color code (IEC 60062)
  const colors = {
    0: '#000',   1: '#8b4513', 2: '#ff0000', 3: '#ff6600',
    4: '#ffff00', 5: '#00aa00', 6: '#0000ff', 7: '#8b00ff',
    8: '#aaaaaa', 9: '#ffffff',
  };
  
  const str = ohms.toString().padStart(2, '0');
  const first = parseInt(str[0]);
  const second = parseInt(str[1]);
  const multiplier = str.length - 1;
  const tolColor = tolerance === 5 ? '#ffcc00' : tolerance === 10 ? '#888888' : '#fff';
  
  return [
    colors[first] || '#000',
    colors[second] || '#000',
    colors[multiplier] || '#000',
    tolColor,
  ];
}

function _formatResistor(value) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${value}`;
}

// ──────────────────────────────────────────────────────────────────
// React Component
// ──────────────────────────────────────────────────────────────────

export default function RealisticComponent({
  type = 'led',
  x = 0,
  y = 0,
  powered = false,
  burnt = false,
  value,
  pressed = false,
  onDoubleClick = () => {},
  ...props
}) {
  const renderer = ComponentRenderer[type];
  if (!renderer) return null;

  return (
    <svg width="100%" height="100%" style={{ pointerEvents: 'auto' }}>
      {renderer({ x, y, powered, burnt, value, pressed, onDoubleClick, ...props })}
    </svg>
  );
}

// Export helpers for external use
export { ComponentRenderer, _formatResistor, _resistorBands };
