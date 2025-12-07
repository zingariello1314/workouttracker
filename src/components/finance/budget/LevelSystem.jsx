import React from 'react';

const LEVELS = [
  { id: 1, name: 'Apprenti', xp: 0, icon: '🥉', color: '#6b7280' },
  { id: 2, name: 'Gestionnaire', xp: 500, icon: '🥈', color: '#3b82f6' },
  { id: 3, name: 'Expert', xp: 1500, icon: '🥇', color: '#10b981' },
  { id: 4, name: 'Maître', xp: 3000, icon: '💎', color: '#8b5cf6' },
  { id: 5, name: 'Légende', xp: 5000, icon: '👑', color: '#f59e0b' }
];

const LevelSystem = ({ totalXP }) => {
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
      <h5 className="text-md font-semibold text-white mb-4">Système de Niveaux</h5>
      
      <div className="flex items-center gap-4 mb-4">
        <div className="text-5xl">{currentLevel.icon}</div>
        <div className="flex-1">
          <div className="text-xl font-bold text-white mb-1">{currentLevel.name}</div>
          <div className="text-sm text-slate-400">
            {totalXP.toLocaleString('fr-FR')} XP
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-slate-400">Progression</span>
          <span className="text-xs text-slate-400">
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-3">
          <div
            className="h-3 rounded-full transition-all"
            style={{
              width: `${progress}%`,
              backgroundColor: currentLevel.color
            }}
          />
        </div>
      </div>

      {/* Prochain niveau */}
      {nextLevel.xp > totalXP && (
        <div className="text-center mt-4">
          <div className="text-sm text-slate-400">
            Prochain niveau : <span className="text-white font-semibold">{nextLevel.name}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {nextLevel.xp - totalXP} XP restants
          </div>
        </div>
      )}

      {/* Liste tous les niveaux */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <div className="text-xs text-slate-400 mb-2">Tous les niveaux</div>
        <div className="space-y-2">
          {LEVELS.map(level => {
            const isUnlocked = totalXP >= level.xp;
            const isCurrent = level.id === currentLevel.id;
            
            return (
              <div
                key={level.id}
                className={`flex items-center gap-3 p-2 rounded ${
                  isCurrent ? 'bg-blue-600/20 border border-blue-500/50' :
                  isUnlocked ? 'bg-green-600/10' : 'bg-slate-700/30 opacity-50'
                }`}
              >
                <span className="text-2xl">{level.icon}</span>
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${
                    isCurrent ? 'text-blue-300' :
                    isUnlocked ? 'text-green-300' : 'text-slate-500'
                  }`}>
                    {level.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {level.xp.toLocaleString('fr-FR')} XP
                  </div>
                </div>
                {isUnlocked && (
                  <span className="text-green-400 text-lg">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LevelSystem;



