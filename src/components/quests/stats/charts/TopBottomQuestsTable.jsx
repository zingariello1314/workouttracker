/**
 * Composant TopBottomQuestsTable - Top 10 et Bottom 10 quêtes
 */

import React from 'react';

const DIFFICULTY_LABELS = {
  1: { label: 'Facile', color: 'bg-emerald-500' },
  2: { label: 'Moyen', color: 'bg-blue-500' },
  3: { label: 'Difficile', color: 'bg-amber-500' },
  4: { label: 'Épique', color: 'bg-red-500' },
};

const TopBottomQuestsTable = ({ topQuests, bottomQuests }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top 10 */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-3 font-semibold">🏆 Top 10 Quêtes</div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {topQuests.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Aucune quête complétée</p>
          ) : (
            topQuests.map((quest, index) => (
              <div key={quest.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-slate-500 w-6">#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{quest.nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${DIFFICULTY_LABELS[quest.difficulte]?.color || 'bg-slate-600'} text-white`}>
                        {DIFFICULTY_LABELS[quest.difficulte]?.label || 'N/A'}
                      </span>
                      <span className="text-xs text-slate-400">{quest.categorie}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm font-semibold text-emerald-300">{quest.validationsCount}</p>
                  <p className="text-xs text-slate-400">{quest.xpTotal} XP</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom 10 */}
      <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3">
        <div className="text-xs text-slate-400 mb-3 font-semibold">📉 Quêtes à relancer</div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bottomQuests.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Aucune quête à améliorer</p>
          ) : (
            bottomQuests.map((quest, index) => (
              <div key={quest.id} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-xs text-slate-500 w-6">#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{quest.nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${DIFFICULTY_LABELS[quest.difficulte]?.color || 'bg-slate-600'} text-white`}>
                        {DIFFICULTY_LABELS[quest.difficulte]?.label || 'N/A'}
                      </span>
                      <span className="text-xs text-slate-400">{quest.categorie}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm font-semibold text-red-300">{quest.validationsCount}</p>
                  <p className="text-xs text-slate-400">{quest.xpTotal} XP</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TopBottomQuestsTable;

