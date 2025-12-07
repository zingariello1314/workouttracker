/**
 * DailyRegularityBlock - Bloc Régularité Quotidienne (PRIORITY-HIGH)
 * Streak avec historique 7 jours et célébration records
 */

import { Flame, TrendingUp, Calendar } from 'lucide-react';
import StreakFlame from './StreakFlame';
import CountdownTimer from './CountdownTimer';

const DailyRegularityBlock = ({ regularityData, onCelebrate }) => {
  if (!regularityData) {
    return (
      <div className="daily-regularity-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-center py-8 text-slate-400">
          <div className="text-4xl mb-3">🔥</div>
          <div>Aucune donnée de régularité</div>
        </div>
      </div>
    );
  }

  const { streak, record, progressToRecord, history } = regularityData;
  const isNewRecord = streak > 0 && streak === record && streak > 1;
  
  // Calculate midnight
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const hoursUntilMidnight = (midnight - new Date()) / (1000 * 60 * 60);
  const showUrgent = hoursUntilMidnight < 6 && history[history.length - 1]?.status !== 'complete';

  const statusColors = {
    complete: 'bg-green-500/20 border-green-500/50 text-green-400',
    partial: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    none: 'bg-slate-700/50 border-slate-600/50 text-slate-500'
  };

  const statusIcons = {
    complete: '✓',
    partial: '◐',
    none: '○'
  };

  return (
    <div className="daily-regularity-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-xl">
            <Flame className="w-6 h-6 text-orange-400" />
          </div>
          Régularité Quotidienne
        </h3>
        {isNewRecord && (
          <div className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-lg text-xs text-yellow-400 font-semibold animate-pulse">
            🏆 NOUVEAU RECORD !
          </div>
        )}
      </div>

      {/* Streak Flame */}
      <div className="mb-6 flex justify-center">
        <StreakFlame streak={streak} size="large" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Flame className="w-4 h-4 text-orange-400" />
            <div className="text-sm text-slate-400">Streak Actuel</div>
          </div>
          <div className="text-3xl font-bold text-white">{streak}</div>
          <div className="text-xs text-orange-400 mt-1">
            {streak === 0 ? 'Commencez aujourd\'hui !' : 
             streak === 1 ? 'jour' : 'jours consécutifs'}
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <div className="text-sm text-slate-400">Record Personnel</div>
          </div>
          <div className="text-3xl font-bold text-white">{record}</div>
          <div className="text-xs text-yellow-400 mt-1">
            {record === 0 ? 'Aucun record' : 
             record === 1 ? 'jour' : 'jours'}
          </div>
        </div>
      </div>

      {/* Progress to Record */}
      {record > 0 && streak < record && (
        <div className="mb-6 p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Progression vers le record</span>
            <span className="text-sm font-bold text-purple-400">{Math.round(progressToRecord)}%</span>
          </div>
          <div className="relative h-2 bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressToRecord}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-center text-slate-400">
            Plus que {record - streak} jour(s) pour battre votre record !
          </div>
        </div>
      )}

      {/* Countdown if urgent */}
      {showUrgent && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-red-400 font-semibold mb-1">⚠️ Attention !</div>
              <div className="text-xs text-slate-400">Complétez vos quêtes avant minuit</div>
            </div>
            <CountdownTimer 
              targetDate={midnight}
              size="normal"
              urgent={true}
              showIcon={false}
            />
          </div>
        </div>
      )}

      {/* History 7 Days */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div className="text-sm font-semibold text-slate-300">Historique 7 derniers jours</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {history.map((day, index) => {
            const date = new Date(day.date);
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
            
            return (
              <div key={day.date} className="text-center">
                <div className="text-xs text-slate-500 mb-1 capitalize">{dayName}</div>
                <div className={`p-3 border-2 rounded-lg ${statusColors[day.status]} transition-all duration-300 hover:scale-110 transform`}>
                  <div className="text-lg font-bold">{statusIcons[day.status]}</div>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {day.completed}/{day.total}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Motivation Message */}
      <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl">
        <div className="text-sm text-center text-slate-300">
          {streak === 0 ? '🌟 Commencez votre série aujourd\'hui !' :
           streak < 3 ? '💪 Continuez comme ça ! Chaque jour compte.' :
           streak < 7 ? '🔥 Excellent ! Vous êtes sur la bonne voie.' :
           streak < 14 ? '⭐ Incroyable ! Vous êtes en feu !' :
           streak < 30 ? '🏆 Exceptionnel ! Vous êtes une machine !' :
           '👑 LÉGENDAIRE ! Vous êtes un maître de la régularité !'}
        </div>
      </div>
    </div>
  );
};

export default DailyRegularityBlock;
