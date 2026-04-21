import React from 'react';
import {
  getTodayDateStr,
  getDayOfWeekFromDateStr,
  addDays,
} from '../../hooks/useQuietQuestEngine';
import { Check, Circle } from 'lucide-react';
import { qstatsPanel, qstatsMuted, qstatsMutedTight } from './stats/questsStatsTheme';

const QuestsWeekView = ({
  allQuests,
  validations,
  toggleQuestValidation,
  getQuestsForDate,
  todayDate: todayDateProp,
}) => {
  const today = todayDateProp != null ? todayDateProp : getTodayDateStr();
  const todayDayOfWeek = getDayOfWeekFromDateStr(today);

  const mondayOffset = 1 - todayDayOfWeek;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const offset = mondayOffset + i;
    const date = addDays(today, offset);
    const dayOfWeek = getDayOfWeekFromDateStr(date);
    const isToday = date === today;
    const quests = getQuestsForDate(date) || [];
    const completedIds = new Set(
      validations
        .filter((v) => v.date === date)
        .map((v) => v.queteId)
    );
    const completedCount = quests.filter((q) => completedIds.has(q.id)).length;
    const successRate =
      quests.length > 0
        ? Math.round((completedCount / quests.length) * 100)
        : 0;

    return {
      date,
      dayOfWeek,
      isToday,
      quests,
      completedIds,
      completedCount,
      successRate,
    };
  });

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className={`${qstatsPanel} space-y-6`}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Vue <span className="text-amber-400">hebdomadaire</span>
          </h1>
          <p className={`${qstatsMuted} text-sm mt-1`}>
            Toute ta semaine : quêtes prévues, validations et progression jour par jour.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4 items-start">
        {weekDays.map((day, index) => {
          const isFullyDone = day.successRate === 100 && day.quests.length > 0;
          return (
            <div
              key={day.date}
              className={`flex flex-col rounded-xl border bg-black/85 overflow-hidden transition-all ${
                day.isToday
                  ? 'ring-2 ring-amber-400/75 border-amber-400/60 shadow-lg shadow-amber-950/30'
                  : 'border-amber-500/35 hover:border-amber-400/55'
              } ${isFullyDone ? 'border-amber-400/55' : ''}`}
            >
              {/* En-tête du jour */}
              <div
                className={`px-4 py-3 border-b border-amber-500/25 ${
                  day.isToday ? 'bg-amber-500/10' : 'bg-black/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-amber-50 text-sm flex items-center gap-1.5">
                      {dayNames[index]}
                      {day.isToday && (
                        <span className="text-[10px] font-medium text-amber-950 bg-amber-400 px-1.5 py-0.5 rounded">
                          aujourd&apos;hui
                        </span>
                      )}
                    </span>
                    <span className={`${qstatsMutedTight} text-[11px] mt-0.5`}>{day.date}</span>
                  </div>
                  <span className={`text-[11px] ${qstatsMuted} shrink-0`}>
                    {day.quests.length} quête{day.quests.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="mt-3">
                  <div className={`flex justify-between text-[11px] ${qstatsMuted} mb-1`}>
                    <span>{day.successRate}%</span>
                    <span className="font-medium text-amber-100">
                      {day.completedCount}/{day.quests.length} complétées
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black border border-amber-800/45 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(251,191,36,0.25)] ${
                        isFullyDone
                          ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300'
                          : 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300'
                      }`}
                      style={{ width: `${Math.min(day.successRate, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Liste de toutes les quêtes : hauteur naturelle, pas de scroll dans le bloc */}
              <div className="flex-1 min-h-[80px] p-2">
                {day.quests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Circle className="w-8 h-8 text-amber-700/60 mb-2" strokeWidth={1.5} />
                    <span className={`text-xs ${qstatsMuted}`}>Aucune quête ce jour</span>
                  </div>
                ) : (
                  <ul className="space-y-1.5">
                    {day.quests.map((quest) => {
                      const completed = day.completedIds.has(quest.id);
                      return (
                        <li key={quest.id}>
                          <button
                            type="button"
                            onClick={() => toggleQuestValidation(quest.id, day.date)}
                            className={`w-full text-left rounded-xl border px-3 py-2.5 transition-all flex items-center gap-3 group ${
                              completed
                                ? 'bg-amber-500/15 border-amber-400/55 text-amber-50/95 ring-1 ring-amber-400/35'
                                : 'bg-black/70 border-amber-500/30 text-amber-100 hover:border-amber-400/50 hover:bg-black/90'
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                                completed
                                  ? 'bg-amber-500 border-amber-300 text-amber-950'
                                  : 'border-amber-700/50 bg-black/80 group-hover:border-amber-500/60'
                              }`}
                            >
                              {completed ? <Check className="w-3 h-3" strokeWidth={3} /> : null}
                            </span>
                            <span className="flex-1 min-w-0 text-xs font-medium truncate">
                              {quest.nom}
                            </span>
                            {quest.categorie && (
                              <span className={`flex-shrink-0 text-[10px] ${qstatsMutedTight} truncate max-w-[4rem]`}>
                                {quest.categorie}
                              </span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(QuestsWeekView, (prevProps, nextProps) => {
  return (
    prevProps.allQuests === nextProps.allQuests &&
    prevProps.validations === nextProps.validations &&
    prevProps.toggleQuestValidation === nextProps.toggleQuestValidation &&
    prevProps.getQuestsForDate === nextProps.getQuestsForDate
  );
});
