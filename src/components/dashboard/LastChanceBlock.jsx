/**
 * LastChanceBlock - Bloc Dernière Chance (PRIORITY-HIGH)
 * Quêtes restantes avec countdown jusqu'à minuit
 */

import { AlertTriangle, CheckCircle2, Zap } from 'lucide-react';
import CountdownTimer from './CountdownTimer';

const LastChanceBlock = ({ quests = [], questStats, onToggle, onCompleteAll }) => {
  const incompleteQuests = quests.filter(q => !q.completed);
  const totalXpRemaining = incompleteQuests.reduce((sum, q) => sum + q.xp, 0);
  
  // Calculate midnight
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  
  // Calculate urgency level
  const hoursUntilMidnight = (midnight - new Date()) / (1000 * 60 * 60);
  const urgencyLevel = hoursUntilMidnight < 3 ? 'high' : 
                       hoursUntilMidnight < 6 ? 'medium' : 
                       hoursUntilMidnight < 12 ? 'low' : 'normal';

  const urgencyColors = {
    high: { bg: 'from-red-500/20 to-red-600/20', border: 'border-red-500/50', text: 'text-red-400' },
    medium: { bg: 'from-orange-500/20 to-orange-600/20', border: 'border-orange-500/50', text: 'text-orange-400' },
    low: { bg: 'from-yellow-500/20 to-yellow-600/20', border: 'border-yellow-500/50', text: 'text-yellow-400' },
    normal: { bg: 'from-blue-500/20 to-blue-600/20', border: 'border-blue-500/50', text: 'text-blue-400' }
  };

  const colors = urgencyColors[urgencyLevel];

  if (incompleteQuests.length === 0) {
    return (
      <div className="last-chance-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🎉</div>
          <div className="text-xl font-bold text-green-400 mb-2">
            Toutes les quêtes complétées !
          </div>
          <div className="text-sm text-slate-400">
            Excellent travail ! Profitez de votre soirée.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`last-chance-block bg-gradient-to-br ${colors.bg} border-2 ${colors.border} rounded-2xl p-6 backdrop-blur-sm ${
      urgencyLevel === 'high' ? 'animate-pulse' : ''
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className={`p-2 bg-white/10 rounded-xl`}>
            <AlertTriangle className={`w-6 h-6 ${colors.text}`} />
          </div>
          Dernière Chance
        </h3>
        <div className={`px-3 py-1 bg-white/10 rounded-lg text-xs font-bold ${colors.text} uppercase`}>
          {urgencyLevel === 'high' ? 'URGENT' : 
           urgencyLevel === 'medium' ? 'Important' : 
           urgencyLevel === 'low' ? 'Attention' : 'Normal'}
        </div>
      </div>

      {/* Countdown */}
      <div className="mb-6 p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 mb-1">Temps restant jusqu'à minuit</div>
            <CountdownTimer 
              targetDate={midnight}
              size="large"
              urgent={urgencyLevel === 'high'}
              showIcon={false}
            />
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">XP disponible</div>
            <div className={`text-2xl font-bold ${colors.text}`}>
              {totalXpRemaining} XP
            </div>
          </div>
        </div>
      </div>

      {/* Incomplete Quests */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-white">
            {incompleteQuests.length} quête(s) restante(s)
          </div>
          {incompleteQuests.length > 1 && (
            <button
              onClick={onCompleteAll}
              className="px-3 py-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-lg text-xs font-semibold transition-all duration-300 hover:scale-105 transform"
            >
              Tout terminer
            </button>
          )}
        </div>

        {incompleteQuests.map((quest) => (
          <div
            key={quest.id}
            onClick={() => onToggle(quest.id)}
            className="group p-4 bg-slate-900/50 border border-slate-700/50 hover:border-purple-500/50 rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{quest.icon}</div>
                <div>
                  <div className="font-semibold text-white">{quest.name}</div>
                  <div className="text-xs text-purple-400 font-bold">+{quest.xp} XP</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className={`text-xs px-2 py-1 rounded ${
                  quest.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  quest.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {quest.priority === 'high' ? 'Haute' : 
                   quest.priority === 'medium' ? 'Moyenne' : 'Basse'}
                </div>
                <CheckCircle2 className="w-5 h-5 text-slate-600 group-hover:text-purple-400 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            {urgencyLevel === 'high' ? '⚠️ Temps critique ! Dépêchez-vous !' :
             urgencyLevel === 'medium' ? '⏰ Il est temps de terminer vos quêtes' :
             urgencyLevel === 'low' ? '📋 Pensez à terminer vos quêtes' :
             '✨ Vous avez encore du temps'}
          </span>
          <span className={`font-bold ${colors.text}`}>
            {incompleteQuests.length} / {quests.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LastChanceBlock;
