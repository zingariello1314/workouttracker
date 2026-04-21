/**
 * Composant WeeklyPlanner - Planificateur hebdomadaire avec drag & drop
 * Charte : fond noir, contour vert.
 */

import React from 'react';
import { WEEK_DAYS, WEEK_DAYS_FULL } from '../../utils/apprentissageConstants';

const btnNav =
  'rounded-lg border border-emerald-500/50 bg-black px-3 py-1.5 text-sm text-emerald-200 hover:border-emerald-400 transition-all';

const WeeklyPlanner = React.memo(({
  subjects,
  planner,
  timer,
  weekDays,
  onNavigateWeek,
  onGoToCurrentWeek,
  onToggleCompactMode,
  onDragStart,
  onDragOver,
  onDrop,
  onChangeSubjectDay,
  onStartSession,
}) => {
  const unassigned = subjects.filter((s) => !planner.subjectOrder[s.name]);

  // Vue mobile compacte
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const shouldUseCompactView = planner.compactMode || isMobile;

  return (
    <div className="bg-black border-2 border-emerald-500/70 rounded-xl p-4 md:p-6 shadow-lg shadow-emerald-500/10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
        <h3 className="text-lg md:text-xl font-bold text-emerald-300">📅 Planificateur Hebdomadaire</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => onNavigateWeek(-1)} className={btnNav}>
            ⬅️
          </button>
          <button type="button" onClick={onGoToCurrentWeek} className={`${btnNav} border-emerald-400/70`}>
            {planner.currentWeekOffset === 0 ? 'Cette semaine' : 'Aller à aujourd\'hui'}
          </button>
          <button type="button" onClick={() => onNavigateWeek(1)} className={btnNav}>
            ➡️
          </button>
          <button type="button" onClick={onToggleCompactMode} className={btnNav}>
            {planner.compactMode ? '📈 Vue étendue' : '📊 Vue compacte'}
          </button>
        </div>
      </div>

      {/* Grille jours - Responsive */}
      <div className={`grid gap-2 md:gap-3 ${
        shouldUseCompactView
          ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-7'
          : 'grid-cols-7'
      }`}>
        {weekDays.map((day, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border-2 ${
              day.isToday
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-emerald-600/40 bg-black'
            }`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, index + 1)}
          >
            <div className="text-center mb-2">
              <div className="text-xs md:text-sm font-semibold text-emerald-200/80">{day.name}</div>
              <div className="text-base md:text-lg font-bold text-emerald-400">{day.date}</div>
            </div>
            <div className={`space-y-2 ${shouldUseCompactView ? 'min-h-[60px]' : 'min-h-[100px]'}`}>
              {day.subjects.length > 0 ? (
                day.subjects.map((subject) => (
                  <div
                    key={subject.id}
                    className="p-2 bg-black border border-emerald-500/45 rounded text-xs flex items-center justify-between group"
                    draggable
                    onDragStart={(e) => onDragStart(e, subject)}
                  >
                    <div className="font-semibold text-emerald-100 truncate flex-1">{subject.name}</div>
                    {!timer.isRunning && (
                      <button
                        type="button"
                        onClick={() => onStartSession(subject)}
                        className="rounded border border-emerald-500/50 bg-emerald-500/10 px-2 py-0.5 ml-2 text-emerald-200 opacity-0 group-hover:opacity-100 transition-opacity hover:border-emerald-400"
                        title="Démarrer session"
                      >
                        ▶️
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-emerald-300/50 text-center py-4">
                  Glissez une matière ici
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Matières non assignées */}
      {unassigned.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-emerald-200/75 mb-3">📋 Matières à programmer</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {unassigned.map((subject) => (
              <div
                key={subject.id}
                className="p-3 bg-black border border-emerald-500/45 rounded-lg flex items-center justify-between group"
                draggable
                onDragStart={(e) => onDragStart(e, subject)}
              >
                <div className="flex-1">
                  <div className="text-xs font-semibold text-emerald-300/70 mb-1">❓</div>
                  <div className="text-sm font-semibold text-emerald-100 truncate">{subject.name}</div>
                  <div className="text-xs text-emerald-300/50">Non programmé</div>
                </div>
                <select
                  className="ml-2 px-2 py-1 bg-black border border-emerald-500/45 rounded text-xs text-emerald-100"
                  value=""
                  onChange={(e) => {
                    const day = e.target.value ? parseInt(e.target.value) : null;
                    onChangeSubjectDay(subject.name, day);
                  }}
                >
                  <option value="">Choisir un jour</option>
                  {WEEK_DAYS_FULL.map((dayName, idx) => (
                    <option key={idx} value={idx + 1}>
                      {dayName}
                    </option>
                  ))}
                </select>
                {!timer.isRunning && (
                  <button
                    onClick={() => onStartSession(subject)}
                    className="ml-2 text-emerald-400 hover:text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Démarrer session"
                  >
                    ▶️
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

WeeklyPlanner.displayName = 'WeeklyPlanner';

export default WeeklyPlanner;
