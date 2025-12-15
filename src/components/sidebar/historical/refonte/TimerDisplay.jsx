/**
 * TimerDisplay - Composant timer carré compact
 * Design moderne avec animations et états visuels
 */

import React, { memo } from 'react';

const TimerDisplay = memo(({ 
  elapsed, 
  isActive, 
  isPaused 
}) => {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusClass = () => {
    if (isActive) return 'active';
    if (isPaused) return 'paused';
    return '';
  };

  return (
    <div className={`timer-display ${getStatusClass()}`}>
      <div className="timer-icon">⏱️</div>
      <div className="timer-value">{formatTime(elapsed)}</div>
      <div className="timer-label">Timer Lecture</div>
      
      {/* Indicateur de statut */}
      <div className={`status-indicator ${isActive ? 'active' : isPaused ? 'paused' : ''}`} />
    </div>
  );
});

TimerDisplay.displayName = 'TimerDisplay';

export default TimerDisplay;