/**
 * Synthèse du jour : quêtes, sport (Garmin), lecture — sous la barre XP.
 */

import { useEffect, useMemo, useState } from 'react';
import { Ban, BookOpen, ChevronRight, Dumbbell, LayoutList, Sparkles, Target } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useDashboardMomentum } from '../../hooks/useDashboardMomentum';
import { useGarminData } from '../../hooks/useGarminData';
import {
  CIGARETTE_TIMELINE_FR,
  MS,
  THC_TIMELINE_FR,
  elapsedMs
} from '../../utils/addictionQuitConstants';
import { getNextMilestone, formatTimeUntilFr } from '../../utils/addictionQuitHelpers';
import { mergeAddictionQuitData, getActiveSession } from '../../utils/addictionQuitSessionsXp';
import GarminRunningStatsCard from '../garmin/GarminRunningStatsCard';
import RecapStrengthStatsCard from '../sport/recap/RecapStrengthStatsCard';
import { ADDICTION_QUIT_JOURNAL_BOTTOM_ANCHOR_ID } from '../tabs/addictionQuit/AddictionQuitCravingsPanel';
import MomentumWeekCharts from './MomentumWeekCharts';

const pillClass = (tone) => {
  if (tone === 'good') return 'bg-emerald-500/15 text-emerald-200 border-emerald-500/35';
  if (tone === 'mid') return 'bg-amber-500/15 text-amber-200 border-amber-500/35';
  if (tone === 'low') return 'bg-rose-500/15 text-rose-200 border-rose-500/35';
  return 'bg-slate-700/50 text-slate-400 border-slate-600/50';
};

const formatDateKeyShortFr = (dateKey) => {
  if (!dateKey) return '—';
  try {
    return new Date(`${dateKey}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit'
    });
  } catch {
    return dateKey;
  }
};

const formatElapsedSince = (startedAtIso) => {
  if (!startedAtIso) return null;
  const t0 = new Date(startedAtIso).getTime();
  if (Number.isNaN(t0)) return null;
  const ms = Math.max(0, Date.now() - t0);
  const days = Math.floor(ms / MS.DAY);
  const hours = Math.floor((ms % MS.DAY) / MS.HOUR);
  if (days >= 1) return `${days} j · ${hours} h`;
  if (hours >= 1) return `${hours} h`;
  const min = Math.floor(ms / MS.MIN);
  return min >= 1 ? `${min} min` : 'À l’instant';
};

const DashboardMomentumBlock = () => {
  const { setActiveTab, data } = useWorkout();
  const { dbReady, getLastSyncDate } = useGarminData();
  const [lastGarminSyncKey, setLastGarminSyncKey] = useState(() => {
    try {
      return localStorage.getItem('garmin_lastSyncDate') || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!dbReady) return;
    let cancelled = false;
    getLastSyncDate()
      .then((d) => {
        if (!cancelled && d) setLastGarminSyncKey(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [dbReady, getLastSyncDate]);

  const {
    loading,
    todayDate,
    quests,
    sport,
    reading,
    insight,
    weekChartData,
    weekRangeLabel,
    booksReadWeek,
    weekPagesPerHour
  } =
    useDashboardMomentum();

  const [milestoneNow, setMilestoneNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setMilestoneNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const dateLabel = useMemo(() => {
    if (!todayDate) return '';
    try {
      return new Date(`${todayDate}T12:00:00`).toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    } catch {
      return todayDate;
    }
  }, [todayDate]);

  const addictionData = useMemo(() => mergeAddictionQuitData(data?.addictionQuitData), [data?.addictionQuitData]);

  const addictionTracksSummary = useMemo(() => {
    const rows = [
      { id: 'cigarette', label: 'Tabac', milestones: CIGARETTE_TIMELINE_FR },
      { id: 'thc', label: 'THC', milestones: THC_TIMELINE_FR }
    ].map(({ id, label, milestones }) => {
      const active = getActiveSession(addictionData, id);
      const quitAt = addictionData?.tracks?.[id]?.quitAtIso;
      const startIso = active?.startedAtIso || quitAt;
      if (!startIso) return { id, label, line: 'Pas de date d’arrêt', ok: false, jalonLine: null };
      const elapsed = formatElapsedSince(startIso);
      const elMs = elapsedMs(startIso, milestoneNow);
      const next = getNextMilestone(milestones, elMs);
      let jalonLine = null;
      if (next) {
        const when = formatTimeUntilFr(next.msUntil);
        const short =
          next.milestone.label.length > 72 ? `${next.milestone.label.slice(0, 70)}…` : next.milestone.label;
        jalonLine = `${when} — ${short}`;
      } else {
        jalonLine = 'Jalons santé (frise 20 ans) : tous atteints dans le modèle.';
      }
      return { id, label, line: elapsed ? `Depuis ${elapsed}` : '—', ok: true, jalonLine };
    });
    const anyActive = rows.some((r) => r.ok);
    return { rows, anyActive };
  }, [addictionData, milestoneNow]);

  const questTone = useMemo(() => {
    if (quests.total === 0) return 'good';
    if (quests.rate >= 70) return 'good';
    if (quests.rate >= 35) return 'mid';
    return 'low';
  }, [quests.total, quests.rate]);

  const sportTone = useMemo(() => {
    const moved =
      sport.activitiesCount > 0 ||
      sport.intensityMinutes >= 8 ||
      (sport.steps >= 4000 && sport.hasGarminForDay);
    if (moved) return 'good';
    if (sport.hasGarminForDay && (sport.steps > 0 || sport.intensityMinutes > 0)) return 'mid';
    return 'low';
  }, [sport]);

  const readingTone = useMemo(() => {
    if (reading.minutes <= 0 && reading.pages <= 0) return 'low';
    if (reading.minutes >= reading.dailyGoal || reading.pages >= 25) return 'good';
    return 'mid';
  }, [reading.minutes, reading.pages, reading.dailyGoal]);

  const goQuests = () => {
    try {
      localStorage.setItem('quests.activeSubTab', 'today');
      sessionStorage.setItem('nav_params_quests', JSON.stringify({ tab: 'today' }));
    } catch {
      /* ignore */
    }
    setActiveTab?.('quests');
  };

  const goSport = () => {
    try {
      localStorage.setItem('sport.lastSubTab', 'today');
    } catch {
      /* ignore */
    }
    setActiveTab?.('today');
  };

  const goBooks = () => {
    setActiveTab?.('books');
  };

  const goAddictionQuit = () => {
    try {
      localStorage.setItem('addictionQuit.lastSub', 'timers');
    } catch {
      /* ignore */
    }
    setActiveTab?.('addiction-quit');
  };

  const goCravingsJournal = () => {
    try {
      sessionStorage.setItem(
        'addictionQuit.deepLink',
        JSON.stringify({
          openCravingsJournal: true,
          scrollToId: ADDICTION_QUIT_JOURNAL_BOTTOM_ANCHOR_ID
        })
      );
      localStorage.setItem('addictionQuit.cravingsSub', 'journal');
      localStorage.setItem('addictionQuit.lastSub', 'cravings');
    } catch {
      /* ignore */
    }
    setActiveTab?.('addiction-quit');
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 p-6 mb-6 animate-pulse">
        <div className="h-5 w-48 bg-slate-700/80 rounded mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="h-24 bg-slate-800/80 rounded-lg" />
          <div className="h-24 bg-slate-800/80 rounded-lg" />
          <div className="h-24 bg-slate-800/80 rounded-lg" />
        </div>
        <div className="h-12 bg-slate-800/60 rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-cyan-500/20 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-indigo-950/40 p-6 mb-6 shadow-lg shadow-slate-950/40 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/15 border border-cyan-500/30">
            <Sparkles className="w-5 h-5 text-cyan-300" aria-hidden />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Vue du jour</h3>
            <p className="text-xs text-slate-400 capitalize">{dateLabel}</p>
          </div>
        </div>
      </div>

      <div className="mb-6 space-y-3">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
          <span>
            Jour affiché :{' '}
            <span className="font-medium text-slate-300">{formatDateKeyShortFr(todayDate)}</span>
          </span>
          <span className="text-slate-600" aria-hidden>
            •
          </span>
          <span>
            Dernier Garmin :{' '}
            <span className="font-medium text-slate-300">{formatDateKeyShortFr(lastGarminSyncKey)}</span>
          </span>
        </p>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
          <div className="w-full rounded-xl border border-amber-500/25 bg-slate-950/60 p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-semibold text-white">
                <span className="rounded-lg border border-amber-500/35 bg-amber-500/15 p-1.5">
                  <Ban className="h-4 w-4 text-amber-300" aria-hidden />
                </span>
                Arrêt addiction
              </span>
            </div>
            <ul className="space-y-2 text-xs text-slate-400">
              {addictionTracksSummary.rows.map((r) => (
                <li key={r.id} className="rounded-lg border border-slate-800/80 bg-slate-900/40 px-2 py-1.5">
                  <div className="flex justify-between gap-2">
                    <span className="text-slate-500">{r.label}</span>
                    <span className={r.ok ? 'shrink-0 text-right text-slate-200' : 'text-slate-500'}>{r.line}</span>
                  </div>
                  {r.ok && r.jalonLine ? (
                    <p className="mt-1 text-[10px] leading-snug text-amber-200/85" title={r.jalonLine}>
                      Prochain jalon : {r.jalonLine}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            {!addictionTracksSummary.anyActive ? (
              <p className="mt-2 text-[11px] text-slate-500">
                Définis une date d’arrêt dans l’onglet dédié pour suivre ton XP et tes jalons.
              </p>
            ) : null}
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={goAddictionQuit}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-left text-xs font-medium text-amber-100 transition hover:bg-amber-500/20"
              >
                Timers · suivi
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              </button>
              <button
                type="button"
                onClick={goCravingsJournal}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-violet-500/40 bg-violet-600/15 px-3 py-2 text-left text-xs font-medium text-violet-100 transition hover:bg-violet-600/25"
              >
                <LayoutList className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                Journal des envies (bas de page)
                <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
              </button>
            </div>
          </div>
          <div className="min-w-0 space-y-3">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
              <div className="min-w-0 rounded-xl border border-slate-700/50 bg-slate-950/40 p-4">
                <GarminRunningStatsCard variant="embedded" />
              </div>
              <div className="min-w-0 rounded-xl border border-slate-700/50 bg-slate-950/40 p-4">
                <RecapStrengthStatsCard variant="embedded" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        <button
          type="button"
          onClick={goQuests}
          className="text-left rounded-lg border border-slate-700/60 bg-slate-950/50 p-4 hover:bg-slate-800/60 hover:border-slate-600 transition-colors group"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <Target className="w-4 h-4 text-purple-400" />
              Quêtes
            </span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${pillClass(questTone)}`}>
              {quests.total === 0 ? 'Libre' : `${quests.rate} %`}
            </span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {quests.completed}/{quests.total || '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {quests.total > 0
              ? `${quests.gainedXP} / ${quests.potentialXP} XP quêtes`
              : 'Aucune quête planifiée'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400/90 group-hover:text-cyan-300">
            Ouvrir les quêtes
            <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          type="button"
          onClick={goSport}
          className="text-left rounded-lg border border-slate-700/60 bg-slate-950/50 p-4 hover:bg-slate-800/60 hover:border-slate-600 transition-colors group"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <Dumbbell className="w-4 h-4 text-rose-400" />
              Sport
            </span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${pillClass(sportTone)}`}>
              {sport.activitiesCount > 0 ? `${sport.activitiesCount} act.` : sport.intensityMinutes > 0 ? 'Intensité' : sport.hasGarminForDay ? 'Suivi' : '—'}
            </span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {sport.intensityMinutes > 0
              ? `${sport.intensityMinutes} min int.`
              : sport.activitiesCount > 0
                ? `${sport.activitiesCount} séance(s)`
                : sport.reps > 0
                  ? `${sport.reps} reps`
                  : sport.steps > 0
                  ? `${sport.steps.toLocaleString('fr-FR')} pas`
                  : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Reps: {sport.reps} · Exos: {sport.checkedExercises} · Défis: {sport.validatedChallenges}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {sport.hasGarminForDay
              ? `Garmin: ${sport.activitiesCount} activité(s) · ${sport.steps.toLocaleString('fr-FR')} pas`
              : 'Garmin : pas de métrique pour ce jour'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400/90 group-hover:text-cyan-300">
            Ouvrir le sport
            <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          type="button"
          onClick={goBooks}
          className="text-left rounded-lg border border-slate-700/60 bg-slate-950/50 p-4 hover:bg-slate-800/60 hover:border-slate-600 transition-colors group"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-white">
              <BookOpen className="w-4 h-4 text-indigo-400" />
              Lecture
            </span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${pillClass(readingTone)}`}>
              {reading.minutes > 0 || reading.pages > 0 ? 'En cours' : 'À faire'}
            </span>
          </div>
          <p className="text-2xl font-bold text-white tabular-nums">
            {reading.pages > 0 || reading.minutes > 0
              ? `${reading.pages} p. · ${reading.minutes} min`
              : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Rythme: {reading.pagesPerHour > 0 ? `${reading.pagesPerHour} p/h` : '—'} · Objectif: {reading.dailyGoal} min
            {reading.sessions > 0 ? ` · ${reading.sessions} session(s)` : ''}
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate" title={reading.booksReadToday?.join(', ') || ''}>
            Livres du jour: {reading.booksReadToday?.length > 0 ? reading.booksReadToday.join(', ') : '—'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400/90 group-hover:text-cyan-300">
            Ouvrir les livres
            <ChevronRight className="w-3 h-3" />
          </span>
        </button>
      </div>

      {insight ? (
        <p className="text-sm text-slate-300 leading-relaxed border-t border-slate-700/50 pt-4">{insight}</p>
      ) : null}

      {weekChartData?.length > 0 ? (
        <MomentumWeekCharts chartData={weekChartData} weekRangeLabel={weekRangeLabel} />
      ) : null}
      <p className="text-xs text-slate-500 mt-3">
        Semaine lecture: {weekPagesPerHour > 0 ? `${weekPagesPerHour} p/h` : '—'} · Livres lus: {booksReadWeek?.length || 0}
      </p>
      {booksReadWeek?.length > 0 ? (
        <p className="text-xs text-slate-500 mt-1 truncate" title={booksReadWeek.join(', ')}>
          {booksReadWeek.join(', ')}
        </p>
      ) : null}
    </div>
  );
};

export default DashboardMomentumBlock;
