/**
 * Composant TrophéesView - Vue Trophées de l'onglet Apprentissage
 * Affichage de la progression globale, badges, trophées et analyses
 */

import React, { useMemo } from 'react';
import { useApprentissageEngine } from '../../hooks/useApprentissageEngine';

// Styles CSS pour animations (à ajouter dans le CSS global ou via style tag)
const popupStyles = `
  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes popupSlideIn {
    from {
      transform: translateY(-50px) scale(0.9);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
`;

const TrophéesView = () => {
  const {
    subjects,
    progressionData,
    getSubjectProgression,
    getSubjectBadge,
    CONTEXTUAL_BADGES,
    TROPHIES_CONFIG,
  } = useApprentissageEngine();

  // Calculer streak info
  const streakInfo = useMemo(() => {
    const streak = progressionData.dailyStreak || 0;
    let multiplier = 1.0;
    if (streak >= 30) multiplier = 1.5;
    else if (streak >= 14) multiplier = 1.3;
    else if (streak >= 7) multiplier = 1.2;
    else if (streak >= 3) multiplier = 1.1;

    return {
      days: streak,
      multiplier,
      nextMilestone: streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : null,
    };
  }, [progressionData.dailyStreak]);

  // Trophées débloqués et verrouillés
  const { unlockedTrophies, lockedTrophies } = useMemo(() => {
    const unlocked = (progressionData.unlockedTrophies || []).map((id) =>
      TROPHIES_CONFIG.find((t) => t.id === id)
    ).filter(Boolean);
    const locked = TROPHIES_CONFIG.filter((t) => !progressionData.unlockedTrophies?.includes(t.id));
    return { unlockedTrophies: unlocked, lockedTrophies: locked };
  }, [progressionData.unlockedTrophies, TROPHIES_CONFIG]);

  // Badges contextuels débloqués et verrouillés
  const { unlockedBadges, lockedBadges } = useMemo(() => {
    const unlocked = (progressionData.unlockedBadges || []).map((id) =>
      CONTEXTUAL_BADGES.find((b) => b.id === id)
    ).filter(Boolean);
    const locked = CONTEXTUAL_BADGES.filter((b) => !progressionData.unlockedBadges?.includes(b.id));
    return { unlockedBadges: unlocked, lockedBadges: locked };
  }, [progressionData.unlockedBadges, CONTEXTUAL_BADGES]);

  // Comparaison matières
  const subjectComparison = useMemo(() => {
    if (subjects.length === 0) return [];

    const levels = subjects.map((s) => {
      const prog = getSubjectProgression(s.name);
      return prog.level;
    });
    const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;

    return subjects.map((subject) => {
      const prog = getSubjectProgression(subject.name);
      const subjectData = progressionData.subjects[subject.name];
      const lastStudy = subjectData?.lastStudyDate
        ? new Date(subjectData.lastStudyDate)
        : null;
      const daysSince = lastStudy
        ? Math.floor((Date.now() - lastStudy.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      return {
        name: subject.name,
        level: prog.level,
        levelGap: prog.level - avgLevel,
        urgency: daysSince && daysSince > 7 ? 'high' : 'normal',
        lastStudyDays: daysSince,
      };
    });
  }, [subjects, progressionData, getSubjectProgression]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Progression Globale */}
      <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
        <h2 className="text-2xl font-bold text-emerald-400 mb-6 text-center uppercase tracking-wide">
          🌟 GLOBAL PROGRESSION MATRIX
        </h2>

        <div className="flex flex-col md:flex-row items-center justify-around gap-6">
          {/* Niveau Global */}
          <div className="flex flex-col items-center">
            <div
              className="w-32 h-32 rounded-full border-4 flex items-center justify-center mb-4"
              style={{
                borderColor: '#32ff9f',
                background: 'radial-gradient(circle, rgba(50, 255, 159, 0.2) 0%, transparent 70%)',
                boxShadow: '0 0 30px rgba(0, 255, 200, 0.5)',
              }}
            >
              <div className="text-4xl font-black" style={{ color: '#32ff9f' }}>
                {progressionData.globalLevel || 1}
              </div>
            </div>
            <div className="text-sm font-semibold text-emerald-400 uppercase">SYSTEM LEVEL</div>
            <div className="text-xs text-slate-400 mt-1">
              {progressionData.globalXP || 0} EXPERIENCE POINTS
            </div>
            {streakInfo.days > 0 && (
              <div className="mt-3 text-center">
                <div className="text-lg">🔥</div>
                <div className="text-sm font-bold text-amber-400">
                  {streakInfo.days} DAY STREAK
                </div>
                {streakInfo.multiplier > 1 && (
                  <div className="text-xs text-slate-400">
                    (×{streakInfo.multiplier} XP)
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Résumé Réalisations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-2xl font-bold text-emerald-400">
                {unlockedTrophies.length}
              </div>
              <div className="text-xs text-slate-400 uppercase">Trophies</div>
            </div>
            <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <div className="text-3xl mb-2">🏅</div>
              <div className="text-2xl font-bold text-cyan-400">
                {unlockedBadges.length}
              </div>
              <div className="text-xs text-slate-400 uppercase">Badges</div>
            </div>
            <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <div className="text-3xl mb-2">⏰</div>
              <div className="text-2xl font-bold text-purple-400">
                {Math.floor((progressionData.totalStudyTime || 0) / 3600)}H
              </div>
              <div className="text-xs text-slate-400 uppercase">Total Time</div>
            </div>
            <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
              <div className="text-3xl mb-2">🔥</div>
              <div className="text-2xl font-bold text-amber-400">
                {streakInfo.days}
              </div>
              <div className="text-xs text-slate-400 uppercase">Streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparaison Matières */}
      {subjectComparison.length > 1 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
          <h3 className="text-xl font-bold text-emerald-400 mb-4 uppercase">
            🔍 COMPARATIVE ANALYSIS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjectComparison.map((subject) => {
              const isAhead = subject.levelGap > 0;
              const isBehind = subject.levelGap < 0;
              const isBalanced = subject.levelGap === 0;

              return (
                <div
                  key={subject.name}
                  className={`p-4 rounded-lg border ${
                    isAhead
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : isBehind
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : 'border-slate-700/50 bg-slate-900/30'
                  } ${subject.urgency === 'high' ? 'ring-2 ring-red-500/50' : ''}`}
                >
                  <div className="font-bold text-slate-200 uppercase mb-2">
                    {subject.name}
                  </div>
                  <div className="text-sm text-emerald-400 font-semibold mb-2">
                    LVL {subject.level}
                  </div>
                  <div className="text-xs text-slate-400 mb-2">
                    {isAhead && (
                      <span className="text-emerald-400">
                        📈 +{Math.abs(subject.levelGap)} LEVEL(S) AHEAD
                      </span>
                    )}
                    {isBehind && (
                      <span className="text-amber-400">
                        📉 {Math.abs(subject.levelGap)} LEVEL(S) BEHIND
                      </span>
                    )}
                    {isBalanced && (
                      <span className="text-slate-400">⚖️ BALANCED</span>
                    )}
                  </div>
                  {subject.lastStudyDays !== null && (
                    <div className="text-xs text-slate-500">
                      {subject.lastStudyDays === 0
                        ? 'YESTERDAY'
                        : subject.lastStudyDays <= 7
                        ? `${subject.lastStudyDays} DAY(S) AGO`
                        : `⚠️ ${subject.lastStudyDays} DAYS`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progression par Matière */}
      {subjects.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
          <h3 className="text-xl font-bold text-emerald-400 mb-4 uppercase">
            📚 SUBJECT PROGRESSION
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((subject) => {
              const progression = getSubjectProgression(subject.name);
              const badge = getSubjectBadge(progression.level);
              const subjectData = progressionData.subjects[subject.name] || {};

              return (
                <div
                  key={subject.id}
                  className="p-4 bg-slate-900/50 rounded-lg border border-slate-700/50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-bold text-slate-200 uppercase mb-1">
                        {subject.name}
                      </div>
                      <div
                        className="text-xs px-2 py-1 rounded-full inline-block mb-2"
                        style={{
                          borderColor: `${badge.color}60`,
                          backgroundColor: `${badge.color}20`,
                          color: badge.color,
                        }}
                      >
                        {badge.icon} {badge.name.toUpperCase()}
                      </div>
                      <div className="text-sm font-bold text-emerald-400">
                        LEVEL {progression.level}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                    <div>
                      <div className="text-slate-400">⏱️</div>
                      <div className="font-semibold text-slate-200">
                        {Math.floor((subjectData.totalTime || 0) / 3600)}H
                        {Math.floor(((subjectData.totalTime || 0) % 3600) / 60)}M
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">🎯</div>
                      <div className="font-semibold text-slate-200">
                        {subjectData.sessions || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-400">⭐</div>
                      <div className="font-semibold text-slate-200">
                        {subjectData.xp || 0} XP
                      </div>
                    </div>
                  </div>

                  {/* Barre XP */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>
                        {progression.currentLevelXP} / {progression.nextLevelXP} XP
                      </span>
                      <span className="text-emerald-400 font-semibold">
                        {Math.round(progression.progress)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-black/40 border border-emerald-500/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-teal-400 transition-all duration-800 rounded-full"
                        style={{ width: `${progression.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Badges Contextuels Débloqués */}
      {unlockedBadges.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
          <h3 className="text-xl font-bold text-emerald-400 mb-4 uppercase">🏅 SPECIAL BADGES UNLOCKED</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {unlockedBadges.map((badge) => (
              <div
                key={badge.id}
                className="p-4 bg-slate-900/50 border border-emerald-500/50 rounded-lg"
              >
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="font-bold text-slate-200 uppercase text-sm mb-1">{badge.name}</div>
                <div className="text-xs text-slate-400 mb-2">{badge.description}</div>
                <div className="text-xs text-emerald-400 font-semibold">✅ UNLOCKED</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trophées Débloqués */}
      {unlockedTrophies.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
          <h3 className="text-xl font-bold text-emerald-400 mb-4 uppercase">🏆 TROPHIES UNLOCKED</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unlockedTrophies.map((trophy) => (
              <div
                key={trophy.id}
                className="p-4 bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/50 rounded-lg"
              >
                <div className="text-4xl mb-2">{trophy.icon}</div>
                <div className="font-bold text-slate-200 uppercase text-sm mb-1">{trophy.name}</div>
                <div className="text-xs text-slate-400 mb-2">{trophy.description}</div>
                <div className="text-xs text-cyan-400 font-semibold mb-1">+{trophy.xp} XP</div>
                <div className="text-xs text-emerald-400 font-semibold">✅ UNLOCKED</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trophées à Débloquer */}
      {lockedTrophies.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 shadow-xl">
          <h3 className="text-xl font-bold text-slate-400 mb-4 uppercase">🔒 TROPHIES TO UNLOCK</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lockedTrophies.map((trophy) => (
              <div
                key={trophy.id}
                className="p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg opacity-60"
              >
                <div className="text-4xl mb-2 opacity-50">{trophy.icon}</div>
                <div className="font-bold text-slate-400 uppercase text-sm mb-1">{trophy.name}</div>
                <div className="text-xs text-slate-500 mb-2">{trophy.description}</div>
                <div className="text-xs text-slate-600 font-semibold">🔒 LOCKED</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si pas de données */}
      {subjects.length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-300 text-xl font-semibold mb-2">
            🕘 NO DATA AVAILABLE
          </div>
          <div className="text-slate-400 text-lg">
            Start studying to see your progression and unlock trophies!
          </div>
        </div>
      )}

      {/* Styles animations */}
      <style>{popupStyles}</style>
    </div>
  );
};

export default TrophéesView;

