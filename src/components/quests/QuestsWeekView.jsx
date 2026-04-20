import React from 'react';
import {
  getTodayDateStr,
  getDayOfWeekFromDateStr,
  addDays,
} from '../../hooks/useQuietQuestEngine';
import { Check, Circle } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
            Vue <span className="text-emerald-400">hebdomadaire</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
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
              className={`flex flex-col rounded-2xl border bg-slate-900/80 backdrop-blur-sm overflow-hidden transition-all ${
                day.isToday
                  ? 'ring-2 ring-emerald-400/70 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'border-slate-700/80 hover:border-slate-600'
              } ${isFullyDone ? 'border-emerald-500/40' : ''}`}
            >
              {/* En-tête du jour */}
              <div
                className={`px-4 py-3 border-b border-slate-700/80 ${
                  day.isToday ? 'bg-emerald-500/10' : 'bg-slate-800/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col min-w-0">
                    <span className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                      {dayNames[index]}
                      {day.isToday && (
                        <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          aujourd&apos;hui
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500 text-[11px] mt-0.5">{day.date}</span>
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {day.quests.length} quête{day.quests.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>{day.successRate}%</span>
                    <span className="font-medium text-slate-300">
                      {day.completedCount}/{day.quests.length} complétées
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isFullyDone
                          ? 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                          : 'bg-gradient-to-r from-emerald-400/80 to-cyan-400/80'
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
                    <Circle className="w-8 h-8 text-slate-600 mb-2" strokeWidth={1.5} />
                    <span className="text-xs text-slate-500">Aucune quête ce jour</span>
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
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-slate-300'
                                : 'bg-slate-800/50 border-slate-700/80 text-slate-200 hover:border-slate-600 hover:bg-slate-800/80'
                            }`}
                          >
                            <span
                              className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                                completed
                                  ? 'bg-emerald-500 border-emerald-400 text-white'
                                  : 'border-slate-500 bg-slate-800/80 group-hover:border-slate-400'
                              }`}
                            >
                              {completed ? <Check className="w-3 h-3" strokeWidth={3} /> : null}
                            </span>
                            <span className="flex-1 min-w-0 text-xs font-medium truncate">
                              {quest.nom}
                            </span>
                            {quest.categorie && (
                              <span className="flex-shrink-0 text-[10px] text-slate-500 truncate max-w-[4rem]">
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
