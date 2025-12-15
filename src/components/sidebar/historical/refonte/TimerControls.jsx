/**
 * TimerControls - Contrôles du timer
 * Boutons Play/Pause/Stop harmonisés
 */

import React, { memo } from 'react';
import { Play, Pause, Square } from 'lucide-react';

const TimerControls = memo(({ 
  isActive, 
  elapsed, 
  onPlay, 
  onPause, 
  onStop 
}) => {
  return (
    <div className="timer-controls">
      {!isActive ? (
        <button
          onClick={onPlay}
          className="timer-button play"
          aria-label="Démarrer le timer"
        >
          <Play className="timer-button-icon" size={16} />
          Play
        </button>
      ) : (
        <button
          onClick={onPause}
          className="timer-button pause"
          aria-label="Mettre en pause le timer"
        >
          <Pause className="timer-button-icon" size={16} />
          Pause
        </button>
      )}
      
      <button
        onClick={onStop}
        disabled={elapsed === 0}
        className="timer-button stop"
        aria-label="Arrêter le timer"
      >
        <Square className="timer-button-icon" size={16} />
        Stop
      </button>
    </div>
  );
});

TimerControls.displayName = 'TimerControls';

export default TimerControls;