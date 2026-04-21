/**
 * Composant SubjectSelector - Sélecteur de matière pour démarrer une session
 * Charte : fond noir, contour vert.
 */

import React from 'react';
import { WEEK_DAYS_FULL } from '../../utils/apprentissageConstants';

const SubjectSelector = React.memo(({ subjects, timer, getAssignedDay, onStartSession }) => {
  if (timer.isRunning || subjects.length === 0) return null;

  return (
    <div className="bg-black border-2 border-emerald-500/70 rounded-xl p-6 shadow-lg shadow-emerald-500/10">
      <h3 className="text-xl font-bold text-emerald-300 mb-4">
        <span aria-hidden="true">🎯</span> Commencer une session
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-label="Liste des matières disponibles">
        {subjects.map((subject) => (
          <button
            key={subject.id}
            type="button"
            onClick={() => onStartSession(subject)}
            aria-label={`Démarrer une session pour ${subject.name}`}
            className="rounded-xl border-2 border-emerald-500/50 bg-black p-4 text-left transition-all hover:border-emerald-400 hover:bg-emerald-500/5"
            role="listitem"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">📚</span>
              <div className="flex-1">
                <div className="font-semibold text-emerald-100">{subject.name}</div>
                <div className="text-xs text-emerald-200/65">
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
