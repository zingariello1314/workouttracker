/**
 * SportSessionBlock - Bloc Séance Sport Active (PRIORITY-MAX)
 * Enregistrement séances sport + analytics 7/30 jours
 */

import { useState } from 'react';
import { Dumbbell, TrendingUp, Award, Flame, Save, CheckCircle2 } from 'lucide-react';

const SportSessionBlock = ({ sportSession, sportStats, onSave }) => {
  const [exercises, setExercises] = useState({
    pompes: 0,
    gainage: 0,
    curls: 0,
    tractions: 0,
    dips: 0,
    tractionsAustraliennes: 0
  });

  const [saved, setSaved] = useState(false);

  const exerciseLabels = {
    pompes: { label: 'Pompes', icon: '💪', category: 'maison' },
    gainage: { label: 'Gainage (sec)', icon: '🧘', category: 'maison' },
    curls: { label: 'Curls', icon: '💪', category: 'maison' },
    tractions: { label: 'Tractions', icon: '🏋️', category: 'parc' },
    dips: { label: 'Dips', icon: '🏋️', category: 'parc' },
    tractionsAustraliennes: { label: 'Tractions Australiennes', icon: '🏋️', category: 'parc' }
  };

  const handleChange = (exercise, value) => {
    setExercises(prev => ({
      ...prev,
      [exercise]: parseInt(value) || 0
    }));
  };

  const handleSave = async () => {
    const success = await onSave(exercises);
    if (success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const getDifference = (exercise) => {
    if (!sportSession?.last) return null;
    const current = exercises[exercise];
    const previous = sportSession.last.exercises[exercise] || 0;
    const diff = current - previous;
    return { diff, isRecord: diff > 0 && current > 0 };
  };

  const hasSessionToday = !!sportSession?.today;

  return (
    <div className="sport-session-block bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-orange-500/20 rounded-xl">
            <Dumbbell className="w-6 h-6 text-orange-400" />
          </div>
          Séance Sport Active
        </h3>
        {hasSessionToday && (
          <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-lg text-xs text-green-400 font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Séance enregistrée
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT: Form */}
        <div>
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span>🏠</span> Exercices Maison
            </h4>
            <div className="space-y-3">
              {Object.entries(exerciseLabels)
                .filter(([_, data]) => data.category === 'maison')
                .map(([key, data]) => {
                  const diff = getDifference(key);
                  return (
                    <div key={key} className="relative">
                      <label className="block text-sm text-slate-400 mb-1 flex items-center gap-2">
                        <span>{data.icon}</span>
                        {data.label}
                        {sportSession?.last && (
                          <span className="text-xs text-slate-500">
                            (Dernier: {sportSession.last.exercises[key] || 0})
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={exercises[key]}
                          onChange={(e) => handleChange(key, e.target.value)}
                          disabled={hasSessionToday}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          min="0"
                        />
                        {diff && diff.isRecord && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-400 text-xs font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{diff.diff}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <span>🏞️</span> Exercices Parc
            </h4>
            <div className="space-y-3">
              {Object.entries(exerciseLabels)
                .filter(([_, data]) => data.category === 'parc')
                .map(([key, data]) => {
                  const diff = getDifference(key);
                  return (
                    <div key={key} className="relative">
                      <label className="block text-sm text-slate-400 mb-1 flex items-center gap-2">
                        <span>{data.icon}</span>
                        {data.label}
                        {sportSession?.last && (
                          <span className="text-xs text-slate-500">
                            (Dernier: {sportSession.last.exercises[key] || 0})
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={exercises[key]}
                          onChange={(e) => handleChange(key, e.target.value)}
                          disabled={hasSessionToday}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-white focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          min="0"
                        />
                        {diff && diff.isRecord && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-green-400 text-xs font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            +{diff.diff}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {!hasSessionToday && (
            <button
              onClick={handleSave}
              disabled={saved}
              className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Séance enregistrée !
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Enregistrer la séance
                </>
              )}
            </button>
          )}
        </div>

        {/* RIGHT: Analytics */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <span>📊</span> Analytics
          </h4>

          {/* 7 Days Stats */}
          {sportStats?.days7 && (
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-blue-400" />
                <h5 className="text-sm font-semibold text-blue-400">7 Derniers Jours</h5>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fréquence</span>
                  <span className="text-white font-semibold">{sportStats.days7.frequency} séances</span>
                </div>
                <div className="text-xs text-slate-500 mt-3">Volume par exercice:</div>
                {Object.entries(sportStats.days7.totalVolume).map(([exercise, volume]) => (
                  <div key={exercise} className="flex justify-between text-xs">
                    <span className="text-slate-400">{exerciseLabels[exercise]?.label}</span>
                    <span className="text-slate-300">{volume} total</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 30 Days Stats */}
          {sportStats?.days30 && (
            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h5 className="text-sm font-semibold text-purple-400">30 Derniers Jours</h5>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fréquence</span>
                  <span className="text-white font-semibold">{sportStats.days30.frequency} séances</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Progression mensuelle</span>
                  <span className="text-green-400 font-semibold">
                    {sportStats.days30.frequency > sportStats.days7.frequency ? '+' : ''}
                    {((sportStats.days30.frequency / 30 * 7) - sportStats.days7.frequency).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Records */}
          {sportSession?.today?.records && sportSession.today.records.length > 0 && (
            <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-yellow-400" />
                <h5 className="text-sm font-semibold text-yellow-400">Records Battus ! 🎉</h5>
              </div>
              <div className="space-y-1">
                {sportSession.today.records.map((exercise) => (
                  <div key={exercise} className="text-sm text-slate-300 flex items-center gap-2">
                    <span className="text-yellow-400">🏆</span>
                    {exerciseLabels[exercise]?.label}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {!sportStats && (
            <div className="text-center py-8 text-slate-400">
              <div className="text-4xl mb-3">💪</div>
              <div className="text-sm">Enregistrez votre première séance</div>
              <div className="text-xs mt-2">Les statistiques apparaîtront ici</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SportSessionBlock;
