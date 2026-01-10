import React from 'react';
import {
  getTodayDateStr,
  getDayOfWeekFromDateStr,
  addDays,
} from '../../hooks/useQuietQuestEngine';

const QuestsWeekView = ({
  allQuests,
  validations,
  toggleQuestValidation,
  getQuestsForDate,
}) => {
  const today = getTodayDateStr();
  const todayDayOfWeek = getDayOfWeekFromDateStr(today);

  // Construire une semaine centrée sur aujourd'hui (Lundi → Dimanche)
  const mondayOffset = 1 - todayDayOfWeek;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const offset = mondayOffset + i;
    const date = addDays(today, offset);
    const dayOfWeek = getDayOfWeekFromDateStr(date);
    const isToday = date === today;
    const quests = getQuestsForDate(date);
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
      successRate,
    };
  });

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Vue <span className="text-emerald-400">hebdomadaire</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Survole ta semaine : quêtes prévues, validations et progression jour par jour.
          </p>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {weekDays.map((day, index) => {
          const borderColor =
            day.successRate === 100
              ? 'border-emerald-500/60'
              : day.successRate >= 50
              ? 'border-amber-500/60'
              : day.successRate > 0
              ? 'border-rose-500/60'
              : 'border-slate-700/80';
          return (
            <div
              key={day.date}
              className={`flex flex-col rounded-2xl border bg-slate-900/70 ${borderColor} px-3 py-2 min-h-[140px] ${
                day.isToday ? 'ring-1 ring-emerald-400/60' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-300">
                <div className="flex flex-col">
                  <span className="font-semibold">
                    {dayNames[index]}
                    {day.isToday && ' (aujourd&apos;hui)'}
                  </span>
                  <span className="text-slate-500 text-[10px]">{day.date}</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {day.quests.length} quêtes
                </span>
              </div>

              <div className="mb-1.5">
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
                    style={{ width: `${Math.min(day.successRate, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>{day.successRate}%</span>
                  <span>
                    {day.completedIds.size}/{day.quests.length} complétées
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-auto space-y-0.5 pr-1">
                {day.quests.length === 0 ? (
                  <div className="text-[10px] text-slate-500 italic mt-1">
                    Aucune quête.
                  </div>
                ) : (
                  <>
                    {day.quests.slice(0, 6).map((quest) => {
                      const completed = day.completedIds.has(quest.id);
                      return (
                        <button
                          key={quest.id}
                          type="button"
                          onClick={() => toggleQuestValidation(quest.id, day.date)}
                          className={`gradient-button-premium gradient-button-premium-sm rounded-lg w-full flex items-center justify-between text-[10px] px-2 py-1 mb-0.5 ${
                            completed
                              ? 'gradient-button-premium-variant'
                              : ''
                          }`}
                        >
                          <span className="line-clamp-1 mr-1 text-left">
                            {quest.nom}
                          </span>
                          <span className="flex items-center gap-1 flex-shrink-0">
                            <span
                              className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                                completed
                                  ? 'bg-emerald-400 border-emerald-300 text-slate-900'
                                  : 'bg-slate-900 border-slate-600 text-slate-500'
                              }`}
                            >
                              {completed ? '✓' : ''}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                    {day.quests.length > 6 && (
                      <div className="text-[10px] text-slate-500 italic mt-1 text-center">
                        … +{day.quests.length - 6} autre{day.quests.length - 6 > 1 ? 's' : ''}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ✅ PHASE 2 : Memoization pour éviter re-renders inutiles
export default React.memo(QuestsWeekView, (prevProps, nextProps) => {
  // Comparaison personnalisée : re-render seulement si props critiques changent
  return (
    prevProps.allQuests === nextProps.allQuests &&
    prevProps.validations === nextProps.validations &&
    prevProps.toggleQuestValidation === nextProps.toggleQuestValidation &&
    prevProps.getQuestsForDate === nextProps.getQuestsForDate
  );
});

