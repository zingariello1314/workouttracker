import React from 'react';
import {
  getTodayDateStr,
  calculateQuestXP,
} from '../../hooks/useQuietQuestEngine';

// Formatage durée (ex : 90 → "1h30")
function formatDuration(minutes) {
  if (!minutes || minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

const QuestsTodayView = ({
  allQuests,
  isQuestCompletedOnDate,
  toggleQuestValidation,
  getQuestsForDate,
  userData,
}) => {
  const today = getTodayDateStr();
  const questsToday = getQuestsForDate(today);
  const completedCount = questsToday.filter((q) =>
    isQuestCompletedOnDate(q.id, today)
  ).length;
  const totalXPTheorique = questsToday.reduce(
    (sum, q) => sum + (q.xp ?? calculateQuestXP(q)),
    0
  );
  const successRate =
    questsToday.length > 0
      ? Math.round((completedCount / questsToday.length) * 100)
      : 0;

  // Calculer l'XP total cumulé
  const calculateTotalCumulativeXP = () => {
    if (!userData) return 0;
    const { level, currentXP } = userData;
    
    // Calculer l'XP total nécessaire pour atteindre le niveau actuel
    // Niveau 1: 0 XP requis (on commence au niveau 1)
    // Niveau 2: 2500 XP requis
    // Niveau 3: 2500 + 2750 = 5250 XP requis
    // Niveau 4: 5250 + 3025 = 8275 XP requis
    // etc.
    let totalXPForCurrentLevel = 0;
    let xpForLevel = 2500; // XP nécessaire pour passer du niveau 1 au niveau 2
    
    // Pour chaque niveau de 2 à (level - 1), on ajoute l'XP nécessaire
    for (let l = 2; l < level; l++) {
      totalXPForCurrentLevel += xpForLevel;
      xpForLevel = Math.round(xpForLevel * 1.1);
    }
    
    // Ajouter l'XP actuel du niveau courant
    return totalXPForCurrentLevel + (currentXP || 0);
  };

  const totalCumulativeXP = calculateTotalCumulativeXP();
  const level = userData?.level || 1;
  const currentXP = userData?.currentXP || 0;
  const xpForNextLevel = userData?.xpForNextLevel || 2500;
  const progressPercent = xpForNextLevel > 0 
    ? Math.min(Math.round((currentXP / xpForNextLevel) * 100), 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Panneau de niveau et XP */}
      <div className="bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 border border-emerald-500/20 rounded-2xl px-6 py-4 shadow-xl shadow-emerald-500/10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-3xl font-bold text-emerald-400">
                Niveau {level}
              </div>
              <div className="h-8 w-px bg-slate-700"></div>
              <div>
                <div className="text-xs text-slate-400 mb-1">XP total cumulé</div>
                <div className="text-xl font-semibold text-emerald-300">
                  {totalCumulativeXP.toLocaleString('fr-FR')} XP
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Progression vers le niveau {level + 1}</span>
                <span className="text-slate-300 font-semibold">
                  {currentXP.toLocaleString('fr-FR')} / {xpForNextLevel.toLocaleString('fr-FR')} XP
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-cyan-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Missions du <span className="text-emerald-400">jour</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Vue rapide de toutes les quêtes actives prévues pour aujourd&apos;hui.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-700 rounded-2xl px-4 py-3 text-xs text-slate-100 flex flex-col gap-1 min-w-[220px]">
          <div className="flex justify-between">
            <span className="text-slate-400">Quêtes</span>
            <span>
              {completedCount}/{questsToday.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">XP théorique</span>
            <span className="text-emerald-300 font-semibold">
              {totalXPTheorique} XP
            </span>
          </div>
          <div className="flex justify-between items-center gap-2 mt-1">
            <span className="text-slate-400">Taux de réussite</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                  style={{ width: `${Math.min(successRate, 100)}%` }}
                />
              </div>
              <span className="font-semibold">{successRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {questsToday.length === 0 ? (
        <div className="mt-8 text-center text-sm text-slate-400">
          Aucune quête prévue pour aujourd&apos;hui. Crée une nouvelle mission dans l&apos;onglet
          &quot;Mes quêtes&quot;.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {questsToday.map((quest) => {
            const completed = isQuestCompletedOnDate(quest.id, today);
            const xp = quest.xp ?? calculateQuestXP(quest);
            return (
              <div
                key={quest.id}
                className={`relative rounded-2xl border px-4 py-3 text-xs bg-slate-900/70 border-slate-700/80 hover:border-emerald-400/70 hover:bg-slate-900 transition-all ${
                  completed ? 'ring-1 ring-emerald-400/60' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => toggleQuestValidation(quest.id, today)}
                    className={`gradient-button-premium gradient-button-premium-sm rounded-full mt-1 w-5 h-5 flex items-center justify-center text-[10px] ${
                      completed
                        ? 'gradient-button-premium-variant'
                        : ''
                    }`}
                  >
                    {completed ? '✓' : ''}
                  </button>

                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between gap-2">
                      <div className="font-semibold text-slate-100 line-clamp-2">
                        {quest.nom}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {quest.categorie}
                      </span>
                    </div>

                    {quest.description && (
                      <div className="text-[11px] text-slate-400 line-clamp-2">
                        {quest.description}
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[11px] text-slate-300 mt-1">
                      <div className="flex items-center gap-2">
                        <span>{formatDuration(quest.duree || 0)}</span>
                        <span className="text-slate-500">•</span>
                        <span>
                          {'★'.repeat(quest.difficulte || 1)}
                          <span className="text-slate-500 text-[10px] ml-1">
                            ({quest.difficulte || 1})
                          </span>
                        </span>
                      </div>
                      <span className="text-emerald-300 font-semibold">{xp} XP</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default QuestsTodayView;

