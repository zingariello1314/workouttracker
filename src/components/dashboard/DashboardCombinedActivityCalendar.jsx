/**
 * Calendrier dashboard : fusion sport + quêtes + lecture (vue mois ou année + stats année).
 */

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Layers, X } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useBooksStorage } from '../../hooks/useBooksStorage';
import { useGarminData } from '../../hooks/useGarminData';
import { useQuietQuestEngine } from '../../hooks/useQuietQuestEngine';
import { loadReadingDayFeedbacks } from '../../utils/readingDayFeedbacksStorage';
import { getDateStr } from '../../utils/dateUtils';
import { calendarHeatmapCompositeBackground } from '../../utils/calendarHeatmapTint';
import {
  buildCombinedMonthIntensityMap,
  computeCombinedYearDashboardStats,
} from '../../utils/dashboardCombinedCalendarMetrics';
import BookSessionFeedbackReadonly from '../books/BookSessionFeedbackReadonly';

const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

const MONTH_NAMES = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

function combinedCellStyle(intensity, isToday) {
  const u = intensity?.visualContext?.composite01 ?? 0;
  const ring = isToday ? ' ring-1 ring-amber-300/95' : '';
  if (u < 0.008) {
    return { className: `bg-white border border-slate-400${ring}`, style: undefined };
  }
  return {
    className: `border border-slate-900/20${ring}`.trim(),
    style: { backgroundColor: calendarHeatmapCompositeBackground(Math.min(1, Math.max(0, u))) },
  };
}

function buildMonthCells(year, monthIndex) {
  const first = new Date(year, monthIndex, 1);
  const startPad = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i += 1) {
    cells.push({ type: 'pad', key: `pad-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    const date = new Date(year, monthIndex, d);
    cells.push({ type: 'day', date, dateStr: getDateStr(date), key: `d-${d}` });
  }
  return cells;
}

function fmtShortDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

/** Allure moyenne globale année : minutes par km → mm:ss /km */
function formatPaceMinPerKm(minPerKm) {
  if (minPerKm == null || !Number.isFinite(minPerKm) || minPerKm <= 0) return '—';
  const whole = Math.floor(minPerKm);
  const sec = Math.min(59, Math.round((minPerKm - whole) * 60));
  return `${whole}:${String(sec).padStart(2, '0')} /km`;
}

function MiniCombinedMonthGrid({ year, monthIndex, intensityMap, todayStr, onPickDay }) {
  const cells = useMemo(() => buildMonthCells(year, monthIndex), [year, monthIndex]);
  return (
    <div className="rounded-lg border border-slate-700/60 bg-black/40 p-1.5">
      <div className="text-[10px] font-semibold text-slate-300 mb-1 text-center truncate">
        {MONTH_NAMES[monthIndex]}
      </div>
      <div className="grid grid-cols-7 gap-px mb-0.5">
        {WEEK_DAYS.map((wd, i) => (
          <div key={i} className="text-center text-[7px] text-slate-600 font-medium">
            {wd}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {cells.map((cell) => {
          if (cell.type === 'pad') {
            return <div key={cell.key} className="aspect-square rounded-sm bg-transparent min-w-0" />;
          }
          const inten = intensityMap.get(cell.dateStr) || null;
          const isToday = cell.dateStr === todayStr;
          const style = combinedCellStyle(inten, isToday);
          const dayNum = cell.date.getDate();
          return (
            <button
              key={cell.key}
              type="button"
              onClick={() => onPickDay(cell.dateStr)}
              className={`aspect-square min-w-0 rounded-sm text-[8px] font-medium flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-violet-500/60 ${style.className}`}
              style={style.style}
            >
              <span className={`tabular-nums text-black ${isToday ? 'font-bold' : 'font-semibold'}`}>
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function DashboardCombinedActivityCalendar(props) {
  const { onCombinedYearStats } = props || {};
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [viewMode, setViewMode] = useState('year');
  const [selected, setSelected] = useState(null);
  const [garminBundle, setGarminBundle] = useState({ dailyMetrics: {}, activities: {} });
  const [fbTick, setFbTick] = useState(0);

  const { data: workoutData } = useWorkout();
  const { books } = useBooksStorage();
  const { dbReady, loadAllData } = useGarminData();
  const {
    validationsByDate,
    validations,
    allQuests,
    getQuestsForDate,
    prayerLocation,
  } = useQuietQuestEngine();
  useEffect(() => {
    const h = () => setFbTick((x) => x + 1);
    window.addEventListener('reading-day-feedbacks-updated', h);
    return () => window.removeEventListener('reading-day-feedbacks-updated', h);
  }, []);

  useEffect(() => {
    let alive = true;
    if (!dbReady) {
      setGarminBundle({ dailyMetrics: {}, activities: {} });
      return undefined;
    }
    loadAllData()
      .then((data) => {
        if (!alive) return;
        setGarminBundle({
          dailyMetrics: data?.dailyMetrics || {},
          activities: data?.activities || {},
        });
      })
      .catch(() => {
        if (alive) setGarminBundle({ dailyMetrics: {}, activities: {} });
      });
    return () => {
      alive = false;
    };
  }, [dbReady, loadAllData]);

  const questCalendarContext = useMemo(
    () => ({
      validationsByDate,
      validations: validations || [],
      allQuests,
      getQuestsForDate,
      prayerLocation,
    }),
    [validationsByDate, validations, allQuests, getQuestsForDate, prayerLocation]
  );

  const year = cursor.getFullYear();
  const monthIndex = cursor.getMonth();

  const combinedCtx = useMemo(() => {
    const dayFeedbacks = loadReadingDayFeedbacks();
    return {
      books,
      dayFeedbacks,
      questCalendarContext,
      workoutData,
      garminBundle,
    };
  }, [books, questCalendarContext, workoutData, garminBundle, fbTick]);

  const intensityMap = useMemo(
    () => buildCombinedMonthIntensityMap(year, monthIndex, combinedCtx),
    [year, monthIndex, combinedCtx]
  );

  const yearMonthMaps = useMemo(() => {
    if (viewMode !== 'year') return null;
    return Array.from({ length: 12 }, (_, mi) => buildCombinedMonthIntensityMap(year, mi, combinedCtx));
  }, [viewMode, year, combinedCtx]);

  const yearDashboardStats = useMemo(() => {
    if (viewMode !== 'year') return null;
    return computeCombinedYearDashboardStats(year, combinedCtx);
  }, [viewMode, year, combinedCtx]);

  const yearStatsSigRef = useRef('');
  useEffect(() => {
    if (!onCombinedYearStats || viewMode !== 'year' || !yearDashboardStats) return;
    const t = yearDashboardStats.totals;
    const sig = [
      year,
      yearDashboardStats.daysWithCombinedActivity,
      yearDashboardStats.daysTriplePillar,
      t?.totalReadingMinutes,
      t?.totalQuestValidations,
      t?.totalRepsYear,
      t?.runningTotalKm,
      t?.runningSessions,
    ].join('|');
    if (yearStatsSigRef.current === sig) return;
    yearStatsSigRef.current = sig;
    onCombinedYearStats(yearDashboardStats);
  }, [viewMode, year, yearDashboardStats, onCombinedYearStats]);

  const cells = useMemo(() => buildMonthCells(year, monthIndex), [year, monthIndex]);

  const todayStr = useMemo(() => getDateStr(new Date()), []);

  const goPrev = useCallback(() => {
    setSelected(null);
    if (viewMode === 'year') {
      setCursor((c) => new Date(c.getFullYear() - 1, c.getMonth(), 1));
    } else {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
    }
  }, [viewMode]);

  const goNext = useCallback(() => {
    setSelected(null);
    if (viewMode === 'year') {
      setCursor((c) => new Date(c.getFullYear() + 1, c.getMonth(), 1));
    } else {
      setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));
    }
  }, [viewMode]);

  const onToggleView = useCallback((mode) => {
    setSelected(null);
    setViewMode(mode);
  }, []);

  const onPickDay = useCallback((dateStr) => {
    setSelected(dateStr);
  }, []);

  const selectedInt = useMemo(() => {
    if (!selected) return null;
    if (viewMode === 'month') return intensityMap.get(selected) || null;
    const m = parseInt(selected.slice(5, 7), 10) - 1;
    if (!yearMonthMaps || m < 0 || m > 11) return null;
    return yearMonthMaps[m].get(selected) || null;
  }, [selected, viewMode, intensityMap, yearMonthMaps]);

  const det = selectedInt?.combinedDetail;

  const totals = yearDashboardStats?.totals;
  const bc = yearDashboardStats?.bestCombined;
  const bq = yearDashboardStats?.bestQuests;
  const bs = yearDashboardStats?.bestSport;
  const bb = yearDashboardStats?.bestBooks;

  return (
    <div className="rounded-2xl border border-violet-500/35 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 p-5 md:p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-white">
          <Layers className="w-6 h-6 text-violet-300 shrink-0" />
          <div>
            <h2 className="text-lg md:text-xl font-bold">Calendrier d’activité combinée</h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Sport, quêtes et lecture fusionnés : plusieurs piliers le même jour augmentent le score (synergie).
              Clique un jour pour le détail de chaque pilier.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-slate-600 overflow-hidden">
            <button
              type="button"
              onClick={() => onToggleView('month')}
              className={`px-3 py-1.5 text-xs font-semibold ${
                viewMode === 'month'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Mois
            </button>
            <button
              type="button"
              onClick={() => onToggleView('year')}
              className={`px-3 py-1.5 text-xs font-semibold ${
                viewMode === 'year'
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Année
            </button>
          </div>
          <button
            type="button"
            onClick={goPrev}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white"
            aria-label={viewMode === 'year' ? 'Année précédente' : 'Mois précédent'}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-white min-w-[160px] text-center">
            {viewMode === 'year' ? year : `${MONTH_NAMES[monthIndex]} ${year}`}
          </span>
          <button
            type="button"
            onClick={goNext}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white"
            aria-label={viewMode === 'year' ? 'Année suivante' : 'Mois suivant'}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {viewMode === 'year' && yearDashboardStats && totals && (
        <div className="mb-5 rounded-xl border border-violet-500/25 bg-black/55 p-4 space-y-3 text-xs text-slate-300">
          <p className="text-[11px] text-slate-500 uppercase tracking-wide font-semibold">
            Synthèse {year} (jusqu’à aujourd’hui si année en cours)
          </p>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Données : sessions livres (stockage livres), validations quêtes (moteur quêtes), séance
            street/workout + métriques quotidiennes Garmin (pas, kcal, min intensité), activités cardio
            Garmin pour la course — même base que le calendrier fusion ci-dessous.
          </p>
          <p className="text-[10px] text-slate-400">
            Jours avec score combiné &gt; 0 :{' '}
            <span className="text-white font-semibold">{yearDashboardStats.daysWithCombinedActivity}</span>
            {' · '}
            Jours « triple pilier » (lecture + quête + sport le même jour) :{' '}
            <span className="text-white font-semibold">{yearDashboardStats.daysTriplePillar}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-3">
              <p className="text-violet-300 font-semibold mb-1">Meilleur jour combiné</p>
              {bc ? (
                <>
                  <p className="text-white font-medium">{fmtShortDate(bc.dateStr)}</p>
                  <p className="text-slate-500 mt-1">
                    Score brut ~{bc.score.toFixed(1)} · L {bc.bookInt.intensityScore.toFixed(0)} · Q{' '}
                    {bc.questInt.intensityScore.toFixed(0)} · S {bc.sportDetail.score.toFixed(0)}
                  </p>
                </>
              ) : (
                <p className="text-slate-500">Aucune activité enregistrée.</p>
              )}
            </div>
            <div className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-3">
              <p className="text-indigo-300 font-semibold mb-1">Meilleur jour quêtes</p>
              {bq ? (
                <>
                  <p className="text-white font-medium">{fmtShortDate(bq.dateStr)}</p>
                  <p className="text-slate-500 mt-1">
                    Score {bq.score.toFixed(1)} · {bq.questInt.questData?.completedCount ?? 0} coches ·{' '}
                    {bq.questInt.questData?.xpTotal ?? 0} XP · ~{bq.questInt.questData?.minutesOccupied ?? 0}{' '}
                    min quêtes
                  </p>
                </>
              ) : (
                <p className="text-slate-500">—</p>
              )}
            </div>
            <div className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-3">
              <p className="text-emerald-300 font-semibold mb-1">Meilleur jour sport</p>
              {bs ? (
                <>
                  <p className="text-white font-medium">{fmtShortDate(bs.dateStr)}</p>
                  <p className="text-slate-500 mt-1">
                    Score {bs.score.toFixed(1)} · {bs.sportDetail.reps} reps ·{' '}
                    {bs.sportDetail.checkedExercises} ex. · {bs.sportDetail.intensityMinutes} min intensité
                  </p>
                </>
              ) : (
                <p className="text-slate-500">—</p>
              )}
            </div>
            <div className="rounded-lg border border-slate-700/80 bg-slate-950/60 p-3">
              <p className="text-amber-200 font-semibold mb-1">Meilleur jour lecture</p>
              {bb ? (
                <>
                  <p className="text-white font-medium">{fmtShortDate(bb.dateStr)}</p>
                  <p className="text-slate-500 mt-1">Score {bb.score.toFixed(1)}</p>
                </>
              ) : (
                <p className="text-slate-500">—</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 text-[11px]">
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Course (Garmin, année)</span>
              <span className="text-white font-semibold">
                {totals.runningTotalKm >= 0.1
                  ? `${totals.runningTotalKm.toFixed(1)} km`
                  : '—'}
              </span>
              <span className="text-slate-600 block mt-0.5">
                {totals.runningSessions > 0
                  ? `${totals.runningSessions} sortie(s) · ${Math.round(totals.runningTotalMin)} min`
                  : 'Pas d’activité course détectée'}
              </span>
              <span className="text-slate-500 block mt-0.5">
                Allure moy. : {formatPaceMinPerKm(totals.runningAvgPaceMinPerKm)}
              </span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Temps combiné (approx.)</span>
              <span className="text-white font-semibold">
                {Math.round(totals.combinedTimeMinutes)} min
              </span>
              <span className="text-slate-600 block mt-0.5">
                lecture + temps quêtes + min intensité Garmin
              </span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Lecture (année)</span>
              <span className="text-white font-semibold">
                {totals.totalReadingSessions} séances · {totals.totalReadingPages} p.
              </span>
              <span className="text-slate-600 block mt-0.5">{totals.totalReadingMinutes} min</span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Répétitions (séance)</span>
              <span className="text-white font-semibold">{totals.totalRepsYear.toLocaleString('fr-FR')}</span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Volume soulevé</span>
              <span className="text-white font-semibold">
                {Math.round(totals.totalVolumeKg).toLocaleString('fr-FR')} kg·rep
              </span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Quêtes cochées (total)</span>
              <span className="text-white font-semibold">{totals.totalQuestValidations}</span>
            </div>
            <div className="rounded-md bg-slate-900/70 px-2 py-2 border border-slate-800">
              <span className="text-slate-500 block">Moy. coches / jour</span>
              <span className="text-white font-semibold">
                {totals.avgQuestPerCalendarDay.toFixed(2)} (cal.)
              </span>
              <span className="text-slate-600 block mt-0.5">
                {totals.daysWithQuestValidation > 0
                  ? `${totals.avgQuestOnActiveDays.toFixed(2)} sur jours avec quête`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'month' && (
        <>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2">
            {WEEK_DAYS.map((d, i) => (
              <div key={i} className="text-center text-[10px] md:text-xs text-slate-500 font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {cells.map((cell) => {
              if (cell.type === 'pad') {
                return <div key={cell.key} className="aspect-square rounded-md bg-slate-900/20" />;
              }
              const inten = intensityMap.get(cell.dateStr) || null;
              const isToday = cell.dateStr === todayStr;
              const style = combinedCellStyle(inten, isToday);
              const dayNum = cell.date.getDate();
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => onPickDay(cell.dateStr)}
                  className={`aspect-square rounded-md text-xs md:text-sm font-medium flex flex-col items-center justify-center transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-violet-500/60 ${style.className}`}
                  style={style.style}
                >
                  <span className={`tabular-nums text-black ${isToday ? 'font-bold' : 'font-semibold'}`}>
                    {dayNum}
                  </span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {viewMode === 'year' && yearMonthMaps && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {yearMonthMaps.map((mapForMonth, mi) => (
            <MiniCombinedMonthGrid
              key={mi}
              year={year}
              monthIndex={mi}
              intensityMap={mapForMonth}
              todayStr={todayStr}
              onPickDay={onPickDay}
            />
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
        <span>Faible</span>
        {[0, 0.2, 0.45, 0.72, 1].map((u) => (
          <div
            key={u}
            className="w-5 h-3 rounded border border-slate-600"
            style={{ backgroundColor: calendarHeatmapCompositeBackground(u) }}
          />
        ))}
        <span>
          {viewMode === 'year'
            ? 'Élevé (échelle relative par mois, comme le sport)'
            : 'Élevé (mois courant)'}
        </span>
      </div>

      {selected && det && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-violet-500/40 bg-slate-950 p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-white">
                {new Date(`${selected}T12:00:00`).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </h3>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-white p-1"
                aria-label="Fermer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Score combiné (brut) :{' '}
              <span className="font-mono text-violet-200">
                {Number(selectedInt?.intensityScore || 0).toFixed(1)}
              </span>{' '}
              · teinte = rang relatif dans le mois affiché.
            </p>

            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3 space-y-2">
              <h4 className="text-sm font-semibold text-emerald-300">Sport & Garmin</h4>
              <p className="text-xs text-slate-400">
                Score interne : <span className="font-mono text-white">{det.sport.score.toFixed(1)}</span>
              </p>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>Répétitions (séance) : {det.sport.reps}</li>
                <li>Exercices cochés : {det.sport.checkedExercises}</li>
                <li>Séances endurance : {det.sport.enduranceSessions}</li>
                <li>Défis validés : {det.sport.validatedChallenges}</li>
                <li>Pas : {det.sport.steps.toLocaleString('fr-FR')}</li>
                <li>Minutes intensité : {det.sport.intensityMinutes}</li>
                <li>kcal actives : {det.sport.activeKcal}</li>
                <li>Activités Garmin (natation, corde, cardio…) : {det.sport.garminActivitiesCount}</li>
                <li>Ligne Garmin : {det.sport.hasGarminRow ? 'oui' : 'non'}</li>
              </ul>
            </section>

            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3 space-y-2">
              <h4 className="text-sm font-semibold text-indigo-300">Quêtes</h4>
              <p className="text-xs text-slate-400">
                Score interne :{' '}
                <span className="font-mono text-white">{det.quests.intensityScore.toFixed(1)}</span>
              </p>
              {(det.quests.questData?.completedRows || []).length > 0 ? (
                <ul className="text-xs space-y-1 text-slate-300">
                  {det.quests.questData.completedRows.map((row, i) => (
                    <li key={i} className="flex justify-between gap-2 border-b border-slate-800/80 pb-1">
                      <span className="truncate">{row.nom}</span>
                      <span className="shrink-0 text-slate-400">
                        {row.dureeMinutes} min · {row.xp} XP
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Aucune validation ce jour.</p>
              )}
            </section>

            <section className="rounded-xl border border-slate-700/80 bg-slate-900/50 p-3 space-y-2">
              <h4 className="text-sm font-semibold text-amber-200">Lecture</h4>
              <p className="text-xs text-slate-400">
                Score interne :{' '}
                <span className="font-mono text-white">{det.books.intensityScore.toFixed(1)}</span>
              </p>
              {(det.books.bookData?.entries || []).length > 0 ? (
                <ul className="space-y-3">
                  {det.books.bookData.entries.map((en, idx) => (
                    <li
                      key={`${en.bookId}-${idx}`}
                      className="rounded-lg border border-slate-800 bg-black/30 p-2 text-xs"
                    >
                      <p className="font-medium text-white truncate">{en.bookTitle}</p>
                      <p className="text-slate-500">
                        {en.durationMinutes || 0} min · {en.pagesRead || 0} p. · {en.startTime || '—'}
                      </p>
                      <BookSessionFeedbackReadonly session={en} title="Feedback session" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500">Aucune session de lecture ce jour.</p>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
