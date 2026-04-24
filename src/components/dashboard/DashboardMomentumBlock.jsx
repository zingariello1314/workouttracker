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
import { getDateStr } from '../../utils/dateUtils';
import {
  mergeAddictionQuitData,
  getActiveSession,
  calculateAddictionQuitXP
} from '../../utils/addictionQuitSessionsXp';
import GarminRunningStatsCard from '../garmin/GarminRunningStatsCard';
import GarminWalkingStatsCard from '../garmin/GarminWalkingStatsCard';
import RecapStrengthStatsCard from '../sport/recap/RecapStrengthStatsCard';
import RunningTrophiesDashboardCompact from './RunningTrophiesDashboardCompact.jsx';
import { ADDICTION_QUIT_JOURNAL_BOTTOM_ANCHOR_ID } from '../tabs/addictionQuit/AddictionQuitCravingsPanel';
import MomentumWeekCharts from './MomentumWeekCharts';

const questPillClass = (tone) => {
  if (tone === 'good') return 'bg-amber-500/20 text-amber-50 border-amber-400/50';
  if (tone === 'mid') return 'bg-amber-950/40 text-amber-200 border-amber-500/40';
  if (tone === 'low') return 'bg-rose-950/30 text-rose-200 border-rose-500/40';
  return 'bg-black/50 text-amber-200/75 border-amber-700/35';
};

const sportPillClass = (tone) => {
  if (tone === 'good') return 'bg-teal-500/20 text-teal-50 border-teal-400/50';
  if (tone === 'mid') return 'bg-teal-950/45 text-teal-200 border-teal-600/45';
  if (tone === 'low') return 'bg-slate-900/60 text-slate-400 border-teal-900/45';
  return 'bg-black/50 text-teal-200/75 border-teal-800/40';
};

const readingPillClass = (tone) => {
  if (tone === 'good') return 'bg-sky-500/20 text-sky-50 border-sky-400/50';
  if (tone === 'mid') return 'bg-sky-950/40 text-sky-200 border-sky-600/45';
  if (tone === 'low') return 'bg-slate-900/55 text-sky-200/90 border-sky-900/40';
  return 'bg-black/50 text-sky-200/75 border-sky-800/40';
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

  const addictionXpSummary = useMemo(
    () => calculateAddictionQuitXP(addictionData, milestoneNow),
    [addictionData, milestoneNow]
  );

  const cravingsEntriesWeek = useMemo(() => {
    if (!todayDate || !addictionData?.cravingsByDay) return 0;
    let n = 0;
    const end = new Date(`${todayDate}T12:00:00`);
    if (Number.isNaN(end.getTime())) return 0;
    for (let i = 0; i < 7; i += 1) {
      const d = new Date(end);
      d.setDate(end.getDate() - i);
      const key = getDateStr(d);
      const arr = addictionData.cravingsByDay[key];
      if (Array.isArray(arr)) n += arr.length;
    }
    return n;
  }, [addictionData, todayDate]);

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
      <div
        className="mb-6 animate-pulse rounded-xl border-2 border-[#ffd700]/40 p-6"
        style={{
          background:
            'linear-gradient(135deg, rgba(15, 15, 20, 0.95) 0%, rgba(255, 20, 147, 0.06) 50%, rgba(255, 215, 0, 0.05) 100%)',
        }}
      >
        <div className="mb-4 h-5 w-48 rounded bg-slate-700/80" />
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="h-24 rounded-lg bg-slate-800/80" />
          <div className="h-24 rounded-lg bg-slate-800/80" />
          <div className="h-24 rounded-lg bg-slate-800/80" />
        </div>
        <div className="h-12 rounded bg-slate-800/60" />
      </div>
    );
  }

  return (
    <div
      className="mb-6 min-w-0 rounded-xl border-2 border-[#ffd700]/45 bg-black p-6 shadow-[0_0_28px_rgba(255,215,0,0.18),inset_0_0_16px_rgba(255,215,0,0.05)]"
      style={{
        background:
          'linear-gradient(135deg, rgba(15, 15, 20, 0.98) 0%, rgba(255, 20, 147, 0.07) 40%, rgba(255, 140, 0, 0.05) 70%, rgba(255, 215, 0, 0.06) 100%)',
      }}
    >
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg border border-[#ffd700]/45 p-2"
            style={{ background: 'rgba(255, 215, 0, 0.1)' }}
          >
            <Sparkles className="h-5 w-5 text-[#ffd700]" aria-hidden />
          </div>
          <div>
            <h3 className="bg-gradient-to-b from-[#ff1493] via-[#ff8c00] to-[#ffd700] bg-clip-text text-lg font-semibold text-transparent">
              Vue du jour
            </h3>
            <p className="text-xs capitalize text-[#ffb347]/90">{dateLabel}</p>
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
            <span className="font-medium text-teal-200/80">{formatDateKeyShortFr(lastGarminSyncKey)}</span>
          </span>
        </p>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 xl:items-start">
          <div className="w-full space-y-3">
            <div className="w-full rounded-xl border-2 border-[#0F4C5C]/60 bg-black p-4 shadow-[0_0_24px_rgba(15,76,92,0.2)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="rounded-lg border border-teal-500/40 bg-teal-500/10 p-1.5">
                    <Ban className="h-4 w-4 text-teal-300" aria-hidden />
                  </span>
                  Arrêt addiction
                </span>
              </div>
              <ul className="space-y-2 text-xs text-teal-100/75">
                {addictionTracksSummary.rows.map((r) => (
                  <li key={r.id} className="rounded-lg border border-[#0F4C5C]/45 bg-black/80 px-2 py-1.5">
                    <div className="flex justify-between gap-2">
                      <span className="text-teal-200/60">{r.label}</span>
                      <span className={r.ok ? 'shrink-0 text-right text-white' : 'text-teal-300/45'}>{r.line}</span>
                    </div>
                    {r.ok && r.jalonLine ? (
                      <p className="mt-1 text-[10px] leading-snug text-teal-200/85" title={r.jalonLine}>
                        Prochain jalon : {r.jalonLine}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
              {!addictionTracksSummary.anyActive ? (
                <p className="mt-2 text-[11px] text-teal-300/50">
                  Définis une date d’arrêt dans l’onglet dédié pour suivre ton XP et tes jalons.
                </p>
              ) : null}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <button
                  type="button"
                  onClick={goAddictionQuit}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-teal-500/45 bg-teal-500/10 px-3 py-2 text-left text-xs font-medium text-teal-100 transition hover:bg-teal-500/20"
                >
                  Timers · suivi
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={goCravingsJournal}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-teal-600/35 bg-black px-3 py-2 text-left text-xs font-medium text-teal-200/90 transition hover:bg-teal-950/50"
                >
                  <LayoutList className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  Journal des envies (bas de page)
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                </button>
              </div>
              <div className="mt-3 space-y-1 rounded-lg border border-[#0F4C5C]/40 bg-teal-950/15 px-2.5 py-2 text-[10px] leading-snug text-teal-200/85">
                <p className="font-semibold text-teal-100/90">Résumé progression (arrêt)</p>
                <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                  <span>
                    XP modèle :{' '}
                    <strong className="tabular-nums text-white">{addictionXpSummary.totalXP}</strong>
                  </span>
                  <span className="text-teal-600/50" aria-hidden>
                    ·
                  </span>
                  <span>
                    Jalons : <strong className="text-white">{addictionXpSummary.breakdown.milestones}</strong>
                  </span>
                  <span className="text-teal-600/50" aria-hidden>
                    ·
                  </span>
                  <span>
                    Quotidien : <strong className="text-white">{addictionXpSummary.breakdown.daily}</strong>
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-2 text-teal-300/70">
                  <span>Sessions : {addictionXpSummary.breakdown.sessions}</span>
                  <span className="text-teal-600/50">·</span>
                  <span>Craquages : {addictionXpSummary.breakdown.relapses}</span>
                  <span className="text-teal-600/50">·</span>
                  <span>Bonus réflexif : +{addictionXpSummary.breakdown.reflective}</span>
                </div>
                <p className="text-teal-300/60">
                  Entrées « envies » sur 7 jours : <strong className="text-teal-100">{cravingsEntriesWeek}</strong>
                </p>
              </div>
            </div>
            <div className="w-full rounded-xl border-2 border-[#0F4C5C]/55 bg-black p-4 shadow-[0_0_20px_rgba(15,76,92,0.15)]">
              <GarminWalkingStatsCard variant="embedded" />
            </div>
            <RunningTrophiesDashboardCompact onOpenEndurance={() => setActiveTab?.('endurance')} />
          </div>
          <div className="min-w-0 space-y-3">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
              <div className="min-w-0 rounded-xl border-2 border-[#0F4C5C]/55 bg-black p-4 shadow-[0_0_20px_rgba(15,76,92,0.15)]">
                <GarminRunningStatsCard variant="embedded" />
              </div>
              <div className="min-w-0 rounded-xl border-2 border-[#0F4C5C]/55 bg-black p-4 shadow-[0_0_20px_rgba(15,76,92,0.15)]">
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
          className="text-left rounded-lg border border-amber-500/40 bg-black p-4 hover:bg-amber-950/25 hover:border-amber-400/55 transition-colors group shadow-[0_0_20px_rgba(234,179,8,0.06)]"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-amber-50">
              <Target className="w-4 h-4 text-amber-400" />
              Quêtes
            </span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${questPillClass(questTone)}`}>
              {quests.total === 0 ? 'Libre' : `${quests.rate} %`}
            </span>
          </div>
          <p className="text-2xl font-bold text-amber-50 tabular-nums">
            {quests.completed}/{quests.total || '—'}
          </p>
          <p className="text-xs text-amber-200/65 mt-1">
            {quests.total > 0
              ? `${quests.gainedXP} / ${quests.potentialXP} XP quêtes`
              : 'Aucune quête planifiée'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-amber-300/95 group-hover:text-amber-200">
            Ouvrir les quêtes
            <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          type="button"
          onClick={goSport}
          className="text-left rounded-lg border border-teal-600/45 bg-black p-4 hover:bg-teal-950/30 hover:border-teal-500/55 transition-colors group shadow-[0_0_20px_rgba(20,184,166,0.07)]"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-teal-50">
              <Dumbbell className="w-4 h-4 text-teal-400" />
              Sport
            </span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${sportPillClass(sportTone)}`}>
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
          <p className="text-xs text-teal-200/65 mt-1">
            Reps: {sport.reps} · Exos: {sport.checkedExercises} · Défis: {sport.validatedChallenges}
          </p>
          <p className="text-xs text-teal-200/55 mt-1">
            {sport.hasGarminForDay
              ? `Garmin: ${sport.activitiesCount} activité(s) · ${sport.steps.toLocaleString('fr-FR')} pas`
              : 'Garmin : pas de métrique pour ce jour'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-teal-300/95 group-hover:text-teal-200">
            Ouvrir le sport
            <ChevronRight className="w-3 h-3" />
          </span>
        </button>

        <button
          type="button"
          onClick={goBooks}
          className="text-left rounded-lg border border-sky-500/45 bg-black p-4 hover:bg-sky-950/30 hover:border-sky-400/55 transition-colors group shadow-[0_0_20px_rgba(14,165,233,0.08)]"
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="flex items-center gap-2 text-sm font-medium text-sky-50">
              <BookOpen className="w-4 h-4 text-sky-400" />
              Lecture
            </span>
            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded border ${readingPillClass(readingTone)}`}>
              {reading.minutes > 0 || reading.pages > 0 ? 'En cours' : 'À faire'}
            </span>
          </div>
          <p className="text-2xl font-bold text-sky-50 tabular-nums">
            {reading.pages > 0 || reading.minutes > 0
              ? `${reading.pages} p. · ${reading.minutes} min`
              : '—'}
          </p>
          <p className="text-xs text-sky-200/70 mt-1">
            Rythme: {reading.pagesPerHour > 0 ? `${reading.pagesPerHour} p/h` : '—'} · Objectif: {reading.dailyGoal} min
            {reading.sessions > 0 ? ` · ${reading.sessions} session(s)` : ''}
          </p>
          <p className="text-xs text-sky-200/60 mt-1 truncate" title={reading.booksReadToday?.join(', ') || ''}>
            Livres du jour: {reading.booksReadToday?.length > 0 ? reading.booksReadToday.join(', ') : '—'}
          </p>
          <span className="mt-2 inline-flex items-center gap-1 text-xs text-sky-300/95 group-hover:text-sky-200">
            Ouvrir les livres
            <ChevronRight className="w-3 h-3" />
          </span>
        </button>
      </div>

      {insight ? (
        <p className="text-sm text-slate-400 leading-relaxed border-t border-slate-800/70 pt-4">{insight}</p>
      ) : null}

      {weekChartData?.length > 0 ? (
        <MomentumWeekCharts chartData={weekChartData} weekRangeLabel={weekRangeLabel} />
      ) : null}
      <p className="text-xs text-sky-200/55 mt-3">
        Semaine lecture: {weekPagesPerHour > 0 ? `${weekPagesPerHour} p/h` : '—'} · Livres lus: {booksReadWeek?.length || 0}
      </p>
      {booksReadWeek?.length > 0 ? (
        <p className="text-xs text-sky-200/50 mt-1 truncate" title={booksReadWeek.join(', ')}>
          {booksReadWeek.join(', ')}
        </p>
      ) : null}
    </div>
  );
};

export default DashboardMomentumBlock;
