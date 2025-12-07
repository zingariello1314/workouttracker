/**
 * QuestDailyBlock - Bloc Quête du Jour (PRIORITY-MAX)
 * Affichage et gestion des quêtes quotidiennes avec progression XP
 */

import { CheckCircle2, Circle, Zap } from 'lucide-react';

const QuestDailyBlock = ({ quests = [], questStats, onToggle }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-red-500/50 bg-red-500/10';
      case 'medium': return 'border-yellow-500/50 bg-yellow-500/10';
      case 'low': return 'border-blue-500/50 bg-blue-500/10';
      default: return 'border-slate-500/50 bg-slate-500/10';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'high': return 'Haute';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return '';
    }
  };

  return (
    <div className="quest-daily-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <Zap className="w-6 h-6 text-purple-400" />
          </div>
          Quêtes du Jour
        </h3>
        {questStats && (
          <div className="text-sm text-slate-400">
            {questStats.completed}/{questStats.total}
          </div>
        )}
      </div>

      {/* XP Progress Bar */}
      {questStats && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Progression XP</span>
            <span className="text-sm font-bold text-purple-400">
              {questStats.xpGained} / {questStats.xpPotential} XP
            </span>
          </div>
          <div className="relative h-3 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${questStats.progress}%`,
                boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
              }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-400 text-center">
            {questStats.xpRemaining} XP restants
          </div>
        </div>
      )}

      {/* Quests List */}
      <div className="space-y-3">
        {quests.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <div className="text-4xl mb-3">🎯</div>
            <div>Aucune quête pour aujourd'hui</div>
            <div className="text-xs mt-2">Ajoutez des quêtes pour commencer</div>
          </div>
        ) : (
          quests.map((quest) => (
            <div
              key={quest.id}
              onClick={() => onToggle(quest.id)}
              className={`group relative overflow-hidden border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
                quest.completed 
                  ? 'bg-green-500/10 border-green-500/50 opacity-75' 
                  : getPriorityColor(quest.priority)
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Icon & Checkbox */}
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{quest.icon}</div>
                  {quest.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-400 group-hover:text-purple-400 transition-colors" />
                  )}
                </div>

                {/* Quest Info */}
                <div className="flex-1">
                  <div className={`font-semibold ${quest.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                    {quest.name}
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-purple-400 font-bold">
                      +{quest.xp} XP
                    </span>
                    <span className="text-xs text-slate-500">
                      Priorité: {getPriorityLabel(quest.priority)}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                {quest.completed && (
                  <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-lg text-xs text-green-400 font-semibold">
                    ✓ Complété
                  </div>
                )}
              </div>

              {/* Hover glow effect */}
              {!quest.completed && (
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {quests.length > 0 && questStats && (
        <div className="mt-6 pt-4 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">
              {questStats.completed === questStats.total ? (
                <span className="text-green-400 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Toutes les quêtes complétées ! 🎉
                </span>
              ) : (
                `${questStats.total - questStats.completed} quête(s) restante(s)`
              )}
            </span>
            <span className="text-purple-400 font-bold">
              {Math.round(questStats.progress)}% complété
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestDailyBlock;
