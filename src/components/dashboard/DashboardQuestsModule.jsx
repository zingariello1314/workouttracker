import { useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Lightbulb, ListFilter, Target, Trophy } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useQuietQuestEngine } from '../../hooks/useQuietQuestEngine';
import { useQuietQuestStats } from '../../hooks/useQuietQuestStats';
import { CRENEAU_ORDER, getCreneauForQuest, getHeureDisplay, getHeureSortMinutes } from '../../utils/quests';
import { mergeAddictionQuitData } from '../../utils/addictionQuitSessionsXp';
import {
  CIGARETTE_TIMELINE_FR,
  THC_TIMELINE_FR,
  elapsedMs
} from '../../utils/addictionQuitConstants';

const creneauLabel = {
  matin: 'Matin',
  midi: 'Midi',
  'apres-midi': 'Après-midi',
  soir: 'Soir',
  nuit: 'Nuit',
  'sans-heure': 'Sans heure'
};

const DashboardQuestsModule = () => {
  const { setActiveTab, data } = useWorkout();
  const [viewMode, setViewMode] = useState('hour'); // hour | category | timetable
  const {
    allQuests,
    isLoading,
    todayDate,
    prayerLocation,
    getQuestsForDate,
    isQuestCompletedOnDate,
    toggleQuestValidation
  } = useQuietQuestEngine();
  const stats30d = useQuietQuestStats('30d');
  const addictionData = useMemo(() => mergeAddictionQuitData(data?.addictionQuitData), [data?.addictionQuitData]);
  const nowMs = Date.now();

  const addictionTracks = useMemo(() => {
    const build = (trackId, label, milestones) => {
      const track = addictionData?.tracks?.[trackId] || {};
      const quitAtIso = track?.quitAtIso || null;
      if (!quitAtIso) {
        return {
          id: trackId,
          label,
          elapsed: 'Pas encore démarré',
          milestone: 'Aucun jalon débloqué'
        };
      }
      const ms = elapsedMs(quitAtIso, nowMs);
      const reached = milestones.filter((m) => ms >= m.ms);
      const last = reached.length ? reached[reached.length - 1].label : 'Aucun jalon débloqué';
      const days = Math.floor(ms / (24 * 3600 * 1000));
      return {
        id: trackId,
        label,
        elapsed: `${days} jour${days > 1 ? 's' : ''} d'arrêt`,
        milestone: last
      };
    };

    return [
      build('cigarette', addictionData?.tracks?.cigarette?.displayName || 'Tabac', CIGARETTE_TIMELINE_FR),
      build('thc', addictionData?.tracks?.thc?.displayName || 'THC / cannabis', THC_TIMELINE_FR)
    ];
  }, [addictionData, nowMs]);

  const questsToday = useMemo(
    () => getQuestsForDate(todayDate) || [],
    [getQuestsForDate, todayDate, allQuests]
  );

  const completion = useMemo(() => {
    const completed = questsToday.filter((q) => isQuestCompletedOnDate(q.id, todayDate)).length;
    const potentialXP = questsToday.reduce((sum, q) => sum + (Number(q.xp) || 0), 0);
    const gainedXP = questsToday
      .filter((q) => isQuestCompletedOnDate(q.id, todayDate))
      .reduce((sum, q) => sum + (Number(q.xp) || 0), 0);
    const rate = questsToday.length > 0 ? Math.round((completed / questsToday.length) * 100) : 0;
    return { completed, total: questsToday.length, potentialXP, gainedXP, rate };
  }, [questsToday, isQuestCompletedOnDate, todayDate]);

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

  const timetableRows = useMemo(() => {
    const rows = questsToday
      .map((q) => ({
        id: q.id,
        name: q.nom || 'Quête',
        category: q.categorie || 'Autre',
        time: getHeureDisplay(q, todayDate, prayerLocation) || '—',
        minutes: getHeureSortMinutes(q, todayDate, prayerLocation),
        xp: Number(q.xp) || 0,
        completed: isQuestCompletedOnDate(q.id, todayDate)
      }))
      .sort((a, b) => a.minutes - b.minutes);
    return rows;
  }, [questsToday, todayDate, prayerLocation, isQuestCompletedOnDate]);

  const goToQuestsToday = () => {
    localStorage.setItem('quests.activeSubTab', 'today');
    sessionStorage.setItem('nav_params_quests', JSON.stringify({ tab: 'today' }));
    setActiveTab?.('quests');
  };

  const goToQuestsStats = () => {
    localStorage.setItem('quests.activeSubTab', 'stats');
    sessionStorage.setItem('nav_params_quests', JSON.stringify({ tab: 'stats' }));
    setActiveTab?.('quests');
  };

  const openCreateQuest = () => {
    localStorage.setItem('quests.activeSubTab', 'quests');
    sessionStorage.setItem('nav_params_quests', JSON.stringify({ action: 'openCreate', tab: 'quests' }));
    setActiveTab?.('quests');
  };

  const renderQuestItem = (quest, questKey) => {
    const checked = isQuestCompletedOnDate(quest.id, todayDate);
    return (
      <button
        key={questKey}
        type="button"
        onClick={() => toggleQuestValidation(quest.id, todayDate)}
        className={`w-full text-left rounded-lg border px-3 py-2 flex items-start gap-2 transition-colors ${
          checked
            ? 'border-emerald-500/50 bg-emerald-500/10'
            : 'border-slate-700/70 bg-slate-900/60 hover:bg-slate-800/70'
        }`}
      >
        <span className="mt-0.5 text-emerald-300">
          {checked ? <CheckCircle2 className="w-4 h-4" /> : <Target className="w-4 h-4 text-slate-400" />}
        </span>
        <span className="min-w-0">
          <span className={`block text-sm font-medium ${checked ? 'text-emerald-200 line-through' : 'text-white'}`}>
            {quest.nom || 'Quête'}
          </span>
          <span className="block text-xs text-slate-400">
            {getHeureDisplay(quest, todayDate, prayerLocation) || 'Sans horaire'} • {quest.categorie || 'Autre'} • {Number(quest.xp) || 0} XP
          </span>
        </span>
      </button>
    );
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-slate-950/90 via-amber-950/35 to-yellow-950/30 shadow-[0_0_80px_rgba(245,158,11,0.2)]">
      <div className="relative p-6 md:p-7 lg:p-8 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/20 border border-amber-300/40 p-2">
              <Trophy className="w-6 h-6 text-amber-100" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Quêtes</h3>
              <p className="text-xs text-slate-300">Aujourd&apos;hui + stats clés + vues de classement</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={goToQuestsToday} className="h-8 px-3 rounded-lg border border-amber-400/50 bg-amber-500/20 text-amber-100 text-xs font-medium hover:bg-amber-500/30">
              Accéder à aujourd&apos;hui
            </button>
            <button type="button" onClick={goToQuestsStats} className="h-8 px-3 rounded-lg border border-yellow-400/45 bg-yellow-500/20 text-yellow-100 text-xs font-medium hover:bg-yellow-500/30">
              Accéder aux statistiques
            </button>
            <button type="button" onClick={openCreateQuest} className="h-8 px-3 rounded-lg border border-orange-400/45 bg-orange-500/20 text-orange-100 text-xs font-medium hover:bg-orange-500/30">
              Nouvelle quête
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl border border-amber-500/35 bg-slate-900/60 p-3">
            <div className="text-xs text-slate-400">Quêtes du jour</div>
            <div className="text-xl font-bold text-white">{completion.completed}/{completion.total}</div>
          </div>
          <div className="rounded-xl border border-yellow-500/35 bg-slate-900/60 p-3">
            <div className="text-xs text-slate-400">Progression</div>
            <div className="text-xl font-bold text-white">{completion.rate}%</div>
          </div>
          <div className="rounded-xl border border-orange-500/35 bg-slate-900/60 p-3">
            <div className="text-xs text-slate-400">XP du jour</div>
            <div className="text-xl font-bold text-white">{completion.gainedXP}/{completion.potentialXP}</div>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-slate-900/60 p-3">
            <div className="text-xs text-slate-400">Streak (30j)</div>
            <div className="text-xl font-bold text-white">{stats30d.currentStreak} j</div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          <div className="xl:col-span-2 rounded-xl border border-slate-700/70 bg-slate-900/45 p-3 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setViewMode('hour')} className={`h-8 px-3 rounded-lg border text-xs inline-flex items-center gap-1.5 ${viewMode === 'hour' ? 'border-amber-400/60 bg-amber-500/20 text-amber-100' : 'border-slate-600/70 bg-slate-900/50 text-slate-300'}`}>
                <Clock3 className="w-3.5 h-3.5" /> Par heure
              </button>
              <button type="button" onClick={() => setViewMode('category')} className={`h-8 px-3 rounded-lg border text-xs inline-flex items-center gap-1.5 ${viewMode === 'category' ? 'border-yellow-400/60 bg-yellow-500/20 text-yellow-100' : 'border-slate-600/70 bg-slate-900/50 text-slate-300'}`}>
                <ListFilter className="w-3.5 h-3.5" /> Par catégorie
              </button>
              <button type="button" onClick={() => setViewMode('timetable')} className={`h-8 px-3 rounded-lg border text-xs inline-flex items-center gap-1.5 ${viewMode === 'timetable' ? 'border-orange-400/60 bg-orange-500/20 text-orange-100' : 'border-slate-600/70 bg-slate-900/50 text-slate-300'}`}>
                <CalendarDays className="w-3.5 h-3.5" /> Emploi du temps
              </button>
            </div>

            {isLoading ? (
              <div className="text-sm text-slate-300">Chargement des quêtes...</div>
            ) : questsToday.length === 0 ? (
              <div className="text-sm text-slate-400">Aucune quête planifiée pour aujourd&apos;hui.</div>
            ) : viewMode === 'hour' ? (
              <div className="space-y-3">
                {CRENEAU_ORDER.map((slot) => (
                  byHour[slot]?.length ? (
                    <div key={slot} className="space-y-2">
                      <div className="text-xs font-semibold text-amber-200">{creneauLabel[slot] || slot}</div>
                      <div className="space-y-2">
                        {byHour[slot].map((quest, idx) =>
                          renderQuestItem(
                            quest,
                            `hour-${slot}-${todayDate}-${quest.id}-${idx}-${getHeureDisplay(quest, todayDate, prayerLocation) || 'na'}`
                          )
                        )}
                      </div>
                    </div>
                  ) : null
                ))}
              </div>
            ) : viewMode === 'category' ? (
              <div className="space-y-3">
                {byCategory.map(([cat, list]) => (
                  <div key={cat} className="space-y-2">
                    <div className="text-xs font-semibold text-yellow-200">{cat}</div>
                    <div className="space-y-2">
                      {list.map((quest, idx) =>
                        renderQuestItem(
                          quest,
                          `cat-${cat}-${todayDate}-${quest.id}-${idx}-${getHeureDisplay(quest, todayDate, prayerLocation) || 'na'}`
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-slate-700/70 overflow-hidden">
                <div className="grid grid-cols-[140px_1fr_110px_90px] text-[11px] font-semibold text-slate-300 bg-slate-800/70">
                  <div className="px-3 py-2 border-r border-slate-700/70">Heure</div>
                  <div className="px-3 py-2 border-r border-slate-700/70">Quête</div>
                  <div className="px-3 py-2 border-r border-slate-700/70">Catégorie</div>
                  <div className="px-3 py-2">XP</div>
                </div>
                <div className="divide-y divide-slate-700/60">
                  {timetableRows.map((row) => (
                    <button
                      key={`tt-${todayDate}-${row.id}-${row.time}-${row.category}-${row.name}`}
                      type="button"
                      onClick={() => toggleQuestValidation(row.id, todayDate)}
                      className={`w-full grid grid-cols-[140px_1fr_110px_90px] text-left text-xs ${
                        row.completed ? 'bg-emerald-500/10' : 'bg-slate-900/50 hover:bg-slate-800/70'
                      }`}
                    >
                      <span className="px-3 py-2 border-r border-slate-700/60 text-slate-300">{row.time}</span>
                      <span className={`px-3 py-2 border-r border-slate-700/60 ${row.completed ? 'text-emerald-200 line-through' : 'text-white'}`}>{row.name}</span>
                      <span className="px-3 py-2 border-r border-slate-700/60 text-slate-300">{row.category}</span>
                      <span className="px-3 py-2 text-emerald-300">{row.xp}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-slate-900/45 p-3 space-y-3">
            <div className="text-sm font-semibold text-slate-100 inline-flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4 text-amber-300" /> Insights automatiques
            </div>
            <div className="space-y-2">
              {(stats30d.insights || []).slice(0, 5).map((insight, idx) => (
                <div
                  key={`insight-${idx}`}
                  className={`rounded-lg border p-2 text-xs ${
                    insight.type === 'success'
                      ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-100'
                      : insight.type === 'warning'
                        ? 'border-amber-500/35 bg-amber-500/10 text-amber-100'
                        : 'border-blue-500/35 bg-blue-500/10 text-blue-100'
                  }`}
                >
                  <span className="mr-1">{insight.icon}</span>
                  {String(insight.text || '').replace(/\*\*/g, '')}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-slate-700/70 bg-slate-950/55 p-2">
                <div className="text-[11px] text-slate-400">Top quêtes</div>
                <div className="mt-1 space-y-1">
                  {(stats30d.topQuests || []).slice(0, 8).map((q, i) => (
                    <div key={`top-${q.id}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-200 truncate">{q.nom}</span>
                      <span className="text-emerald-300 shrink-0">{q.validationsCount}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-slate-700/70 bg-slate-950/55 p-2">
                <div className="text-[11px] text-slate-400">Quêtes à relancer</div>
                <div className="mt-1 space-y-1">
                  {(stats30d.bottomQuests || []).slice(0, 8).map((q, i) => (
                    <div key={`bottom-${q.id}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-slate-200 truncate">{q.nom}</span>
                      <span className="text-amber-300 shrink-0">{q.validationsCount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-[11px] text-slate-300 font-semibold">Arrêt addictions (vue du jour)</div>
                <button
                  type="button"
                  onClick={() => setActiveTab?.('addiction-quit')}
                  className="text-[10px] px-2 py-1 rounded border border-cyan-400/50 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/30"
                >
                  Ouvrir
                </button>
              </div>
              <div className="space-y-1.5">
                {addictionTracks.map((row) => (
                  <div key={`aq-${row.id}`} className="rounded border border-slate-700/70 bg-slate-950/50 p-2">
                    <div className="text-xs text-slate-200 font-medium">{row.label}</div>
                    <div className="text-[11px] text-cyan-200">{row.elapsed}</div>
                    <div className="text-[11px] text-slate-400 truncate" title={row.milestone}>
                      Dernier jalon : {row.milestone}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2">
                <div className="text-[11px] text-slate-400">Complétion (30j)</div>
                <div className="text-white font-semibold">{Math.round(stats30d.completionRate || 0)}%</div>
              </div>
              <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-2">
                <div className="text-[11px] text-slate-400">XP (30j)</div>
                <div className="text-white font-semibold">{stats30d.totalXP || 0}</div>
              </div>
              <div className="rounded-lg border border-orange-500/30 bg-orange-500/10 p-2">
                <div className="text-[11px] text-slate-400">Moyenne/jour</div>
                <div className="text-white font-semibold">{(stats30d.dailyAverage || 0).toFixed(1)}</div>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2">
                <div className="text-[11px] text-slate-400">Meilleur streak</div>
                <div className="text-white font-semibold">{stats30d.bestStreak || 0} j</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2">
                <div className="text-[11px] text-slate-400">Moyenne 7j</div>
                <div className="text-white font-semibold">{(stats30d.dailyAverage || 0).toFixed(1)} quêtes/j</div>
              </div>
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-2">
                <div className="text-[11px] text-slate-400">Moyenne 30j</div>
                <div className="text-white font-semibold">{(stats30d.weeklyAverage || 0).toFixed(1)} quêtes/j</div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-700/70 bg-slate-950/55 p-2">
              <div className="text-[11px] text-slate-400 mb-1">Catégories (30j)</div>
              <div className="space-y-1">
                {(stats30d.categoryStats || []).slice(0, 5).map((c, i) => (
                  <div key={`cat-${c.category}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-200 truncate">{c.category}</span>
                    <span className="text-cyan-300 shrink-0">{c.validationsCount} • {c.xpTotal} XP</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-slate-700/70 bg-slate-950/55 p-2">
              <div className="text-[11px] text-slate-400 mb-1">Difficulté (30j)</div>
              <div className="space-y-1">
                {(stats30d.difficultyStats || []).map((d, i) => (
                  <div key={`diff-${d.difficulty}-${i}`} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-200 truncate">{d.label}</span>
                    <span className="text-violet-300 shrink-0">{d.validationsCount} • {d.xpTotal} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardQuestsModule;

