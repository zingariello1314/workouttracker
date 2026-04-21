/**
 * Composant TopBottomQuestsTable - Top 10 et Bottom 10 quêtes
 */

import React from 'react';
import { qstatsPanel, qstatsMuted, qstatsMutedTight } from '../questsStatsTheme';

const DIFFICULTY_LABELS = {
  1: { label: 'Facile', color: 'bg-amber-800 border border-amber-600/60' },
  2: { label: 'Moyen', color: 'bg-amber-600 border border-amber-500/60' },
  3: { label: 'Difficile', color: 'bg-amber-500 border border-amber-400/70' },
  4: { label: 'Épique', color: 'bg-amber-950 border border-amber-500/50' },
};

const TopBottomQuestsTable = ({ topQuests, bottomQuests }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top 10 */}
      <div className={qstatsPanel}>
        <div className={`text-xs ${qstatsMuted} mb-3 font-semibold`}>🏆 Top 10 Quêtes</div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {topQuests.length === 0 ? (
            <p className={`text-sm ${qstatsMuted} text-center py-4`}>Aucune quête complétée</p>
          ) : (
            topQuests.map((quest, index) => (
              <div key={quest.id} className="flex items-center justify-between p-2 rounded-lg bg-black/80 border border-amber-500/30">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-xs ${qstatsMutedTight} w-6`}>#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-amber-50 truncate">{quest.nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${DIFFICULTY_LABELS[quest.difficulte]?.color || 'bg-amber-900 border border-amber-700/50'} text-white`}>
                        {DIFFICULTY_LABELS[quest.difficulte]?.label || 'N/A'}
                      </span>
                      <span className={`text-xs ${qstatsMuted}`}>{quest.categorie}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm font-semibold text-amber-300">{quest.validationsCount}</p>
                  <p className={`text-xs ${qstatsMuted}`}>{quest.xpTotal} XP</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bottom 10 */}
      <div className={qstatsPanel}>
        <div className={`text-xs ${qstatsMuted} mb-3 font-semibold`}>📉 Quêtes à relancer</div>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {bottomQuests.length === 0 ? (
            <p className={`text-sm ${qstatsMuted} text-center py-4`}>Aucune quête à améliorer</p>
          ) : (
            bottomQuests.map((quest, index) => (
              <div key={quest.id} className="flex items-center justify-between p-2 rounded-lg bg-black/80 border border-amber-500/30">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className={`text-xs ${qstatsMutedTight} w-6`}>#{index + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-amber-50 truncate">{quest.nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${DIFFICULTY_LABELS[quest.difficulte]?.color || 'bg-amber-900 border border-amber-700/50'} text-white`}>
                        {DIFFICULTY_LABELS[quest.difficulte]?.label || 'N/A'}
                      </span>
                      <span className={`text-xs ${qstatsMuted}`}>{quest.categorie}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <p className="text-sm font-semibold text-amber-400">{quest.validationsCount}</p>
                  <p className={`text-xs ${qstatsMuted}`}>{quest.xpTotal} XP</p>
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
