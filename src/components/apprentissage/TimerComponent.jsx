/**
 * Composant TimerComponent - Timer principal pour les sessions d'étude
 * Charte : fond noir, contour vert ; stats en tons émeraude.
 */

import React from 'react';
// Formatage temps (secondes → MM:SS)
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const ctrlBtn =
  'rounded-lg border-2 border-emerald-500/55 bg-black px-4 py-2 min-w-[44px] min-h-[44px] font-semibold uppercase tracking-wide text-sm md:text-base text-emerald-100 hover:border-emerald-400 hover:bg-emerald-500/10 transition-all';

const TimerComponent = React.memo(({
  timer,
  timerColor,
  todayStats,
  onTogglePause,
  onStop,
  onAdjustTime,
  onToggleSilentMode,
}) => {
  return (
    <div className="bg-black border-2 border-emerald-500/70 rounded-xl p-6 shadow-lg shadow-emerald-500/10">
      <div className="flex flex-col items-center">
        {/* Cercle Timer */}
        <div
          className={`relative w-48 h-48 md:w-72 md:h-72 rounded-full border-4 md:border-8 flex flex-col items-center justify-center mb-6 transition-all duration-300 ${
            timer.isRunning && !timer.isPaused ? 'animate-pulse' : ''
          }`}
          style={{
            borderColor: `${timerColor}55`,
            background: `radial-gradient(circle, ${timerColor}12 0%, transparent 70%)`,
            willChange: timer.isRunning ? 'transform, opacity' : 'auto',
            transform: 'translateZ(0)',
          }}
        >
          {/* SVG Progression */}
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(16, 185, 129, 0.15)"
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={timerColor}
              strokeWidth="3"
              strokeDasharray={283}
              strokeDashoffset={283 - (timer.progress * 283) / 100}
              strokeLinecap="round"
            />
          </svg>

          {/* Affichage temps */}
          <div className="relative z-10 text-center">
            <div
              className="text-5xl font-black mb-2"
              style={{
                color: timerColor,
                textShadow: `0 0 20px ${timerColor}80`,
              }}
            >
              {formatTime(timer.remainingTime)}
            </div>
            <div className="text-lg text-emerald-300 font-semibold uppercase tracking-wider">
              {timer.isPaused ? '🍫 PAUSE' : '📚 FOCUS'}
            </div>
            {timer.currentSubject && (
              <div className="text-sm text-emerald-200/75 mt-2">
                {timer.currentSubject.name}
              </div>
            )}
          </div>
        </div>

        {/* Contrôles */}
        <div className="flex gap-2 md:gap-3 flex-wrap justify-center" role="toolbar" aria-label="Contrôles du timer">
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={timer.isPaused ? 'Reprendre la session' : 'Mettre en pause'}
            className={ctrlBtn}
          >
            {timer.isPaused ? '▶️ Reprendre' : '⏸️ Pause'}
          </button>
          <button
            type="button"
            onClick={onStop}
            aria-label="Arrêter la session"
            className={ctrlBtn}
          >
            ⏹️ Arrêter
          </button>
          <button
            type="button"
            onClick={() => onAdjustTime(10)}
            aria-label="Ajouter 10 minutes"
            className={`${ctrlBtn} text-xs md:text-sm`}
          >
            +10 min
          </button>
          <button
            type="button"
            onClick={onToggleSilentMode}
            aria-label={timer.silentMode ? 'Activer le son' : 'Désactiver le son'}
            className={`${ctrlBtn} ${timer.silentMode ? 'opacity-60' : ''}`}
          >
            {timer.silentMode ? '🔇' : '🔊'}
          </button>
        </div>

        {/* Statistiques du jour */}
        <div className="mt-6 flex gap-6 flex-wrap justify-center" role="group" aria-label="Statistiques du jour">
            <div className="text-center rounded-lg border border-emerald-500/40 bg-black px-4 py-2" role="status" aria-live="polite">
              <div className="text-2xl mb-1" aria-hidden="true" role="img" aria-label="Icône sessions">🎯</div>
              <div className="text-xl font-bold text-emerald-300" aria-label={`${todayStats.sessionsCount} sessions aujourd'hui`}>
                {todayStats.sessionsCount}
              </div>
              <div className="text-xs text-emerald-200/60">Sessions</div>
            </div>
            <div className="text-center rounded-lg border border-emerald-500/40 bg-black px-4 py-2" role="status" aria-live="polite">
              <div className="text-2xl mb-1" aria-hidden="true" role="img" aria-label="Icône temps actif">⏱️</div>
              <div className="text-xl font-bold text-emerald-400" aria-label={`${Math.floor(todayStats.totalWorkTime / 60)} heures ${todayStats.totalWorkTime % 60} minutes de travail actif`}>
                {Math.floor(todayStats.totalWorkTime / 60)}h
                {todayStats.totalWorkTime % 60}
              </div>
              <div className="text-xs text-emerald-200/60">Active</div>
            </div>
            <div className="text-center rounded-lg border border-emerald-500/40 bg-black px-4 py-2" role="status" aria-live="polite">
              <div className="text-2xl mb-1" aria-hidden="true" role="img" aria-label="Icône pause">☕</div>
              <div className="text-xl font-bold text-emerald-200" aria-label={`${Math.floor(todayStats.totalBreakTime / 60)} heures ${todayStats.totalBreakTime % 60} minutes de pause`}>
                {Math.floor(todayStats.totalBreakTime / 60)}h
                {todayStats.totalBreakTime % 60}
              </div>
              <div className="text-xs text-emerald-200/60">Break</div>
            </div>
        </div>
      </div>
    </div>
  );
});

TimerComponent.displayName = 'TimerComponent';

export default TimerComponent;
