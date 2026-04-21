/**
 * Calendrier d’activité apprentissage (même heatmap que Sport / Quêtes / Livres),
 * avec synchro des trophées « calendrier fusion » via les stats combinées année.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GraduationCap } from 'lucide-react';
import CalendarHeatmap from '../CalendarHeatmap';
import { useApprentissageEngine } from '../../hooks/useApprentissageEngine';
import { useWorkout } from '../../context/WorkoutContext';
import { useBooksStorage } from '../../hooks/useBooksStorage';
import { useGarminData } from '../../hooks/useGarminData';
import { useQuietQuestEngine } from '../../hooks/useQuietQuestEngine';
import { loadReadingDayFeedbacks } from '../../utils/readingDayFeedbacksStorage';
import { computeCombinedYearDashboardStats } from '../../utils/dashboardCombinedCalendarMetrics';
import {
  openApprentissageDB,
  loadSessionsHistoryFromIndexedDB,
} from '../../utils/apprentissageIndexedDB';
import { buildLearningSessionsByDate } from '../../utils/apprentissageCalendarMetrics';

export default function ApprentissageCalendarView() {
  const { unlockFusionCalendarTrophies, progressionData } = useApprentissageEngine();
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

  const [sessionsHistory, setSessionsHistory] = useState([]);
  const [garminBundle, setGarminBundle] = useState({ dailyMetrics: {}, activities: {} });
  const userId = 'main';

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const db = await openApprentissageDB();
        if (db) {
          const h = await loadSessionsHistoryFromIndexedDB(db, userId);
          if (alive && Array.isArray(h)) setSessionsHistory(h);
        } else {
          const raw = localStorage.getItem('apprentissage_sessions_history');
          if (alive && raw) {
            try {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) setSessionsHistory(parsed);
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // ignore
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    const onFocus = () => {
      openApprentissageDB().then((db) => {
        if (!db) return;
        loadSessionsHistoryFromIndexedDB(db, userId).then((h) => {
          if (Array.isArray(h)) setSessionsHistory(h);
        });
      });
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [userId]);

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

  const combinedCtx = useMemo(() => {
    const dayFeedbacks = loadReadingDayFeedbacks();
    return {
      books,
      dayFeedbacks,
      questCalendarContext,
      workoutData,
      garminBundle,
    };
  }, [books, questCalendarContext, workoutData, garminBundle]);

  const year = new Date().getFullYear();
  const yearDashboardStats = useMemo(
    () => computeCombinedYearDashboardStats(year, combinedCtx),
    [year, combinedCtx]
  );

  const yearStatsSigRef = useRef('');
  useEffect(() => {
    if (!yearDashboardStats?.totals) return;
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
    unlockFusionCalendarTrophies(yearDashboardStats);
  }, [year, yearDashboardStats, unlockFusionCalendarTrophies]);

  const sessionsByDate = useMemo(
    () => buildLearningSessionsByDate(sessionsHistory),
    [sessionsHistory]
  );

  const fusionGranted = progressionData?.fusionCalendarTrophiesGranted?.length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      <div className="rounded-xl border-2 border-emerald-500/70 bg-black p-4 md:p-5 shadow-lg shadow-emerald-500/10">
        <div className="flex items-start gap-3 text-emerald-100/95">
          <GraduationCap className="w-8 h-8 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg md:text-xl font-bold text-emerald-50">Calendrier d&apos;étude</h2>
            <p className="text-sm text-emerald-200/75 mt-1 leading-relaxed">
              Intensité basée sur tes sessions enregistrées (durée, régularité). Les trophées «
              calendrier fusion » (sport + quêtes + lecture) continuent d&apos;être mis à jour en
              arrière-plan quand les données combinées de l&apos;année évoluent.
            </p>
            <p className="text-xs text-emerald-300/70 mt-2">
              Trophées fusion déjà enregistrés :{' '}
              <span className="text-emerald-300 font-semibold">{fusionGranted}</span>
            </p>
          </div>
        </div>
      </div>

      <CalendarHeatmap
        variant="apprentissage"
        initialViewMode="year"
        apprentissageCalendarContext={{ sessionsByDate, sessionsHistory }}
        workoutHistory={[]}
        garminData={null}
      />
    </div>
  );
}
