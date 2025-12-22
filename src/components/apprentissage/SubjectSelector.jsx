/**
 * Composant SubjectSelector - Sélecteur de matière pour démarrer une session
 */

import React from 'react';
import { WEEK_DAYS_FULL } from '../../utils/apprentissageConstants';

const SubjectSelector = React.memo(({ subjects, timer, getAssignedDay, onStartSession }) => {
  if (timer.isRunning || subjects.length === 0) return null;

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
      <h3 className="text-xl font-bold text-emerald-400 mb-4">
        <span aria-hidden="true">🎯</span> Commencer une session
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Liste des matières disponibles">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => onStartSession(subject)}
            aria-label={`Démarrer une session pour ${subject.name}`}
            className="gradient-button-premium gradient-button-premium-md rounded-lg p-4 text-left"
            role="listitem"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <div className="flex-1">
                <div className="font-semibold text-slate-200">{subject.name}</div>
                <div className="text-xs text-slate-400">
                  📁 {subject.files?.length || 0} fichier(s)
                </div>
                {getAssignedDay(subject.name) && (
                  <div className="text-xs text-emerald-400 mt-1">
                    {WEEK_DAYS_FULL[getAssignedDay(subject.name) - 1]}
                  </div>
                )}
              </div>
              <span className="text-xl">▶️</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});

SubjectSelector.displayName = 'SubjectSelector';

export default SubjectSelector;

