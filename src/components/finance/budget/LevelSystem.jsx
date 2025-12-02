/**
 * Composant LevelSystem - Système de niveaux avec progression
 */

import React from 'react';

const LEVELS = [
  { id: 1, name: 'Apprenti', xp: 0, icon: '🥉', color: '#6b7280' },
  { id: 2, name: 'Gestionnaire', xp: 500, icon: '🥈', color: '#3b82f6' },
  { id: 3, name: 'Expert', xp: 1500, icon: '🥇', color: '#10b981' },
  { id: 4, name: 'Maître', xp: 3000, icon: '💎', color: '#8b5cf6' },
  { id: 5, name: 'Légende', xp: 5000, icon: '👑', color: '#f59e0b' }
];

const LevelSystem = ({ totalXP = 0 }) => {
  const currentLevel = LEVELS
    .slice()
    .reverse()
    .find(level => totalXP >= level.xp) || LEVELS[0];
  
  const nextLevel = LEVELS.find(level => level.xp > totalXP) || LEVELS[LEVELS.length - 1];
  const progress = nextLevel.xp > currentLevel.xp
    ? ((totalXP - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100
    : 100;

  return (
    <div className="level-system bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Système de Niveaux</h3>
      
      <div className="flex items-center gap-4 mb-6">
        <div className="text-5xl">{currentLevel.icon}</div>
        <div className="flex-1">
          <div className="text-xl font-bold text-white mb-1">{currentLevel.name}</div>
          <div className="text-sm text-slate-400">{totalXP} XP</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Progression vers {nextLevel.name}</span>
          <span className="text-slate-300">
            {nextLevel.xp - totalXP} XP restants
          </span>
        </div>
        <div className="w-full bg-slate-700/50 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all"
            style={{
              width: `${Math.min(progress, 100)}%`,
              backgroundColor: currentLevel.color
            }}
          />
        </div>
        <div className="text-xs text-slate-500 text-center">
          {nextLevel.xp} XP pour atteindre {nextLevel.name} {nextLevel.icon}
        </div>
      </div>

      {/* Liste des niveaux */}
      <div className="mt-6 space-y-2">
        <div className="text-sm font-semibold text-slate-300 mb-2">Tous les niveaux</div>
        {LEVELS.map(level => {
          const isUnlocked = totalXP >= level.xp;
          const isCurrent = level.id === currentLevel.id;
          
          return (
            <div
              key={level.id}
              className={`flex items-center justify-between p-2 rounded ${
                isCurrent
                  ? 'bg-blue-900/20 border border-blue-500/50'
                  : isUnlocked
                  ? 'bg-slate-700/30'
                  : 'bg-slate-800/30 opacity-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{level.icon}</span>
                <span className={`text-sm ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                  {level.name}
                </span>
              </div>
              <span className="text-xs text-slate-400">{level.xp} XP</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSystem;

