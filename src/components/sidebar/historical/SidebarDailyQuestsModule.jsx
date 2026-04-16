/**
 * Quêtes du jour (sidebar) : récap comme le dashboard + liste cochable (moteur QuietQuest).
 */

import { memo, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, ListFilter, Target } from 'lucide-react';
import { useWorkout } from '../../../context/WorkoutContext';
import { useQuietQuestEngine } from '../../../hooks/useQuietQuestEngine';
import { useQuietQuestStats } from '../../../hooks/useQuietQuestStats';
import { CRENEAU_ORDER, getCreneauForQuest, getHeureDisplay } from '../../../utils/quests';

const creneauLabel = {
  matin: 'Matin',
  midi: 'Midi',
  'apres-midi': 'Après-midi',
  soir: 'Soir',
  nuit: 'Nuit',
  'sans-heure': 'Sans heure'
};

const SidebarDailyQuestsModule = memo(({ isExpanded, onToggle, setActiveTab }) => {
  const [viewMode, setViewMode] = useState('hour');
  const {
    isLoading,
    todayDate,
    prayerLocation,
    getQuestsForDate,
    isQuestCompletedOnDate,
    toggleQuestValidation,
    validations,
    allQuests
  } = useQuietQuestEngine();
  const stats30d = useQuietQuestStats('30d');

  const questsToday = useMemo(
    () => getQuestsForDate(todayDate) || [],
    [getQuestsForDate, todayDate, allQuests, prayerLocation]
  );

  const completion = useMemo(() => {
    const completed = questsToday.filter((q) => isQuestCompletedOnDate(q.id, todayDate)).length;
    const potentialXP = questsToday.reduce((sum, q) => sum + (Number(q.xp) || 0), 0);
    const gainedXP = questsToday
      .filter((q) => isQuestCompletedOnDate(q.id, todayDate))
      .reduce((sum, q) => sum + (Number(q.xp) || 0), 0);
    const rate = questsToday.length > 0 ? Math.round((completed / questsToday.length) * 100) : 0;
    return { completed, total: questsToday.length, potentialXP, gainedXP, rate };
  }, [questsToday, isQuestCompletedOnDate, todayDate, validations]);

  const byHour = useMemo(() => {
    const groups = {};
    CRENEAU_ORDER.forEach((key) => {
      groups[key] = [];
    });
    questsToday.forEach((q) => {
      const slot = getCreneauForQuest(q, todayDate, prayerLocation);
      groups[slot]?.push(q);
    });
    return groups;
  }, [questsToday, todayDate, prayerLocation]);

  const byCategory = useMemo(() => {
    const map = new Map();
    questsToday.forEach((q) => {
      const k = q.categorie || 'Autre';
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(q);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [questsToday]);

  const goToQuestsToday = () => {
    try {
      localStorage.setItem('quests.activeSubTab', 'today');
      sessionStorage.setItem('nav_params_quests', JSON.stringify({ tab: 'today' }));
    } catch {
      /* ignore */
    }
    setActiveTab?.('quests');
  };

  const renderQuestItem = (quest, questKey) => {
    const checked = isQuestCompletedOnDate(quest.id, todayDate);
    return (
      <button
        key={questKey}
        type="button"
        onClick={() => toggleQuestValidation(quest.id, todayDate)}
        className={`w-full text-left rounded-lg border px-2 py-1.5 flex items-start gap-1.5 transition-colors ${
          checked
            ? 'border-emerald-500/50 bg-emerald-500/10'
            : 'border-slate-700/70 bg-slate-900/60 hover:bg-slate-800/70'
        }`}
      >
        <span className="mt-0.5 text-emerald-300 shrink-0">
          {checked ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5 text-slate-400" />}
        </span>
        <span className="min-w-0">
          <span className={`block text-[11px] font-medium ${checked ? 'text-emerald-200 line-through' : 'text-white'}`}>
            {quest.nom || 'Quête'}
          </span>
          <span className="block text-[9px] text-slate-400 leading-snug">
            {getHeureDisplay(quest, todayDate, prayerLocation) || 'Sans horaire'} • {quest.categorie || 'Autre'} •{' '}
            {Number(quest.xp) || 0} XP
          </span>
        </span>
      </button>
    );
  };

  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section quêtes du jour"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">
            🏆
          </span>
          Quêtes du jour
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </header>

      {isExpanded ? (
        <div className="sidebar-section-content space-y-2 px-1 py-2 min-w-0">
          <div className="rounded-xl border border-amber-500/25 bg-slate-950/70 p-2 space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-semibold text-amber-100/90">Récap</span>
              <button
                type="button"
                onClick={goToQuestsToday}
                className="h-6 shrink-0 rounded border border-amber-400/50 bg-amber-500/15 px-2 text-[9px] font-medium text-amber-100 hover:bg-amber-500/25"
              >
                Ouvrir quêtes
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="rounded-lg border border-amber-500/30 bg-slate-900/60 p-1.5 min-w-0">
                <div className="text-[9px] text-slate-400 truncate">Quêtes du jour</div>
                <div className="text-sm font-bold text-white tabular-nums">
                  {completion.completed}/{completion.total || 0}
                </div>
              </div>
              <div className="rounded-lg border border-yellow-500/30 bg-slate-900/60 p-1.5 min-w-0">
                <div className="text-[9px] text-slate-400 truncate">Progression</div>
                <div className="text-sm font-bold text-white tabular-nums">{completion.rate}%</div>
              </div>
              <div className="rounded-lg border border-orange-500/30 bg-slate-900/60 p-1.5 min-w-0">
                <div className="text-[9px] text-slate-400 truncate">XP du jour</div>
                <div className="text-sm font-bold text-white tabular-nums truncate" title={`${completion.gainedXP}/${completion.potentialXP}`}>
                  {completion.gainedXP}/{completion.potentialXP}
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/25 bg-slate-900/60 p-1.5 min-w-0">
                <div className="text-[9px] text-slate-400 truncate">Streak (30j)</div>
                <div className="text-sm font-bold text-white tabular-nums">
                  {Number(stats30d?.currentStreak) || 0} j
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2 space-y-2 min-w-0">
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setViewMode('hour')}
                className={`h-6 px-2 rounded-md border text-[9px] inline-flex items-center gap-1 ${
                  viewMode === 'hour'
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-100'
                    : 'border-slate-600/70 bg-slate-900/50 text-slate-300'
                }`}
              >
                <Clock3 className="w-3 h-3 shrink-0" /> Par heure
              </button>
              <button
                type="button"
                onClick={() => setViewMode('category')}
                className={`h-6 px-2 rounded-md border text-[9px] inline-flex items-center gap-1 ${
                  viewMode === 'category'
                    ? 'border-yellow-400/60 bg-yellow-500/20 text-yellow-100'
                    : 'border-slate-600/70 bg-slate-900/50 text-slate-300'
                }`}
              >
                <ListFilter className="w-3 h-3 shrink-0" /> Par catégorie
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timetable')}
                className={`h-6 px-2 rounded-md border text-[9px] inline-flex items-center gap-1 ${
                  viewMode === 'timetable'
                    ? 'border-orange-400/60 bg-orange-500/20 text-orange-100'
                    : 'border-slate-600/70 bg-slate-900/50 text-slate-300'
                }`}
              >
                <CalendarDays className="w-3 h-3 shrink-0" /> Emploi du temps
              </button>
            </div>

            {isLoading ? (
              <div className="text-[10px] text-slate-400">Chargement…</div>
            ) : questsToday.length === 0 ? (
              <div className="text-[10px] text-slate-500">Aucune quête planifiée aujourd&apos;hui.</div>
            ) : viewMode === 'hour' ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {CRENEAU_ORDER.map((slot) =>
                  byHour[slot]?.length ? (
                    <div key={slot} className="space-y-1">
                      <div className="text-[9px] font-semibold text-amber-200/90">{creneauLabel[slot] || slot}</div>
                      <div className="space-y-1">
                        {byHour[slot].map((quest, idx) =>
                          renderQuestItem(
                            quest,
                            `sb-hour-${slot}-${todayDate}-${quest.id}-${idx}`
                          )
                        )}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            ) : viewMode === 'category' ? (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                {byCategory.map(([cat, list]) => (
                  <div key={cat} className="space-y-1">
                    <div className="text-[9px] font-semibold text-yellow-200/90 truncate" title={cat}>
                      {cat}
                    </div>
                    <div className="space-y-1">
                      {list.map((quest, idx) =>
                        renderQuestItem(quest, `sb-cat-${cat}-${todayDate}-${quest.id}-${idx}`)
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-700/70 overflow-hidden max-h-64 overflow-y-auto">
                <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] text-[9px] font-semibold text-slate-300 bg-slate-800/70">
                  <div className="px-1.5 py-1 border-r border-slate-700/70 truncate">Heure</div>
                  <div className="px-1.5 py-1 truncate">Quête</div>
                </div>
                <div className="divide-y divide-slate-700/60">
                  {questsToday
                    .map((q) => ({
                      id: q.id,
                      name: q.nom || 'Quête',
                      time: getHeureDisplay(q, todayDate, prayerLocation) || '—',
                      completed: isQuestCompletedOnDate(q.id, todayDate)
                    }))
                    .sort((a, b) => String(a.time).localeCompare(String(b.time)))
                    .map((row) => (
                      <button
                        key={`sb-tt-${todayDate}-${row.id}`}
                        type="button"
                        onClick={() => toggleQuestValidation(row.id, todayDate)}
                        className={`w-full grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] text-left text-[9px] ${
                          row.completed ? 'bg-emerald-500/10' : 'bg-slate-900/50 hover:bg-slate-800/70'
                        }`}
                      >
                        <span className="px-1.5 py-1 border-r border-slate-700/60 text-slate-400 truncate">
                          {row.time}
                        </span>
                        <span
                          className={`px-1.5 py-1 truncate ${row.completed ? 'text-emerald-200 line-through' : 'text-white'}`}
                        >
                          {row.name}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
});

SidebarDailyQuestsModule.displayName = 'SidebarDailyQuestsModule';

export default SidebarDailyQuestsModule;
