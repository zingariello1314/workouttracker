/**
 * Agrège quêtes du jour, activité Garmin et lecture pour la synthèse dashboard.
 */

import { useMemo, useEffect, useState } from 'react';
import { useQuietQuestEngine } from './useQuietQuestEngine';
import { useBooksStorage } from './useBooksStorage';
import { useGarminData } from './useGarminData';
import { useWorkout } from '../context/WorkoutContext';
const extractNumeric = (val, defaultVal = 0) => {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const parsed = Number.parseFloat(val);
    return Number.isFinite(parsed) ? parsed : defaultVal;
  }
  if (typeof val === 'object') {
    const keys = ['current', 'average', 'avg', 'total', 'value', 'resting', 'max', 'min'];
    for (const key of keys) {
      if (key in val) {
        const extracted = extractNumeric(val[key], defaultVal);
        if (Number.isFinite(extracted)) return extracted;
      }
    }
  }
  return defaultVal;
};

const getIntensityMinutes = (metric) => {
  if (!metric?.intensityMinutes) return 0;
  return extractNumeric(metric.intensityMinutes.total, 0);
};

const getDailyActivityCount = (activities = {}, dateKey) => {
  const all = [
    ...(activities.swimming || []),
    ...(activities.jumpRope || []),
    ...(activities.cardio || [])
  ];
  return all.filter((a) => {
    const raw = a?.date || a?.startTimeLocal || a?.startTimeGmt;
    if (!raw) return false;
    const normalized = typeof raw === 'string' ? raw.slice(0, 10) : new Date(raw).toISOString().slice(0, 10);
    return normalized === dateKey;
  }).length;
};

const readDailyGoal = () => {
  try {
    const stored = localStorage.getItem('readingDailyGoal');
    if (stored) {
      const n = Number(stored);
      if (Number.isFinite(n) && n > 0) return n;
    }
  } catch {
    /* ignore */
  }
  return 30;
};

const normalizeDateKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const m = value.match(/\d{4}-\d{2}-\d{2}/);
    return m ? m[0] : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
};

const getWorkoutForDate = (workoutData = {}, dateKey) => {
  const repsMap = workoutData?.reps || {};
  const checkedMap = workoutData?.checkedExercises || {};
  let reps = 0;
  let checkedExercises = 0;
  Object.entries(checkedMap).forEach(([key, checked]) => {
    if (!checked || !key.startsWith(dateKey)) return;
    checkedExercises += 1;
    reps += parseInt(repsMap[key], 10) || 0;
  });
  return { reps, checkedExercises };
};

const getEnduranceForDate = (workoutData = {}, dateKey) => {
  const sessionsByType = workoutData?.enduranceData?.sessions || {};
  let sessionsCount = 0;
  let validatedChallenges = 0;
  Object.values(sessionsByType).forEach((sessions) => {
    if (!Array.isArray(sessions)) return;
    sessions.forEach((session) => {
      const key = normalizeDateKey(
        session?.date || session?.startTimeLocal || session?.startTimeGmt || session?.startTime
      );
      if (key !== dateKey) return;
      sessionsCount += 1;
      const uniqueIds = new Set(
        Array.isArray(session?.validatedChallenges)
          ? session.validatedChallenges.filter((id) => id !== null && id !== undefined).map(String)
          : []
      );
      validatedChallenges += uniqueIds.size;
    });
  });
  return { sessionsCount, validatedChallenges };
};

const getReadingForDate = (books = [], dateKey) => {
  let pages = 0;
  let minutes = 0;
  let sessions = 0;
  const booksReadSet = new Set();
  books.forEach((book) => {
    if (!book || !Array.isArray(book.readingSessions)) return;
    const title = (book.title || 'Livre sans titre').trim();
    book.readingSessions.forEach((session) => {
      const key = normalizeDateKey(session?.date);
      if (key !== dateKey) return;
      sessions += 1;
      pages += Number(session.pagesRead) || 0;
      minutes += Number(session.durationMinutes) || 0;
      booksReadSet.add(title);
    });
  });
  const pagesPerHour = minutes > 0 ? Number(((pages / minutes) * 60).toFixed(1)) : 0;
  return {
    pages,
    minutes,
    sessions,
    booksRead: Array.from(booksReadSet),
    pagesPerHour
  };
};

const buildInsight = ({
  questTotal,
  questRate,
  intensityMinutes,
  activitiesCount,
  steps,
  readingPages,
  readingMinutes,
  readingGoal,
  hasGarminForDay
}) => {
  const lines = [];

  if (questTotal === 0) {
    lines.push('Aucune quête prévue aujourd’hui — tu peux te concentrer sur le mouvement et la lecture.');
  } else if (questRate >= 85) {
    lines.push('Tes quêtes du jour sont bien avancées.');
  } else if (questRate >= 45) {
    lines.push('Il reste des quêtes à cocher pour boucler la journée.');
  } else {
    lines.push('Priorité aux quêtes : encore du chemin pour aujourd’hui.');
  }

  const sportSignal =
    activitiesCount > 0 || intensityMinutes >= 5 || (steps > 0 && steps >= 3000);
  if (!hasGarminForDay && activitiesCount === 0) {
    lines.push('Pas encore de métriques Garmin pour aujourd’hui — synchronise ta montre si besoin.');
  } else if (sportSignal) {
    lines.push('Activité physique enregistrée — garde ce rythme si tu peux.');
  } else {
    lines.push('Peu de mouvement intense aujourd’hui — une courte sortie ou séance suffit.');
  }

  const readingRatio = readingGoal > 0 ? readingMinutes / readingGoal : 0;
  if (readingMinutes > 0 || readingPages > 0) {
    if (readingRatio >= 1 || readingPages >= 20) {
      lines.push('Lecture au rendez-vous.');
    } else {
      lines.push('La lecture est entamée — quelques pages de plus pour solidifier l’habitude.');
    }
  } else {
    lines.push('Pas encore de session de lecture aujourd’hui — un créneau court peut suffire.');
  }

  return lines.join(' ');
};

export const useDashboardMomentum = () => {
  const { data: workoutData } = useWorkout();
  const {
    isLoading: questsLoading,
    todayDate,
    getQuestsForDate,
    isQuestCompletedOnDate
  } = useQuietQuestEngine();
  const { books, isLoading: booksLoading } = useBooksStorage();
  const { dbReady, loadAllData } = useGarminData();
  const [garminBundle, setGarminBundle] = useState({ dailyMetrics: {}, activities: {} });
  const [garminLoading, setGarminLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!dbReady) {
      setGarminLoading(false);
      setGarminBundle({ dailyMetrics: {}, activities: {} });
      return undefined;
    }
    setGarminLoading(true);
    loadAllData()
      .then((data) => {
        if (!alive) return;
        setGarminBundle({
          dailyMetrics: data?.dailyMetrics || {},
          activities: data?.activities || {}
        });
      })
      .catch(() => {
        if (alive) setGarminBundle({ dailyMetrics: {}, activities: {} });
      })
      .finally(() => {
        if (alive) setGarminLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [dbReady, loadAllData]);

  const snapshot = useMemo(() => {
    const questsToday = getQuestsForDate(todayDate) || [];
    let completed = 0;
    let potentialXP = 0;
    let gainedXP = 0;
    questsToday.forEach((q) => {
      const xp = Number(q.xp) || 0;
      potentialXP += xp;
      if (isQuestCompletedOnDate(q.id, todayDate)) {
        completed += 1;
        gainedXP += xp;
      }
    });
    const questTotal = questsToday.length;
    const questRate = questTotal > 0 ? Math.round((completed / questTotal) * 100) : 0;

    const readingToday = getReadingForDate(books, todayDate);
    const workoutToday = getWorkoutForDate(workoutData, todayDate);
    const enduranceToday = getEnduranceForDate(workoutData, todayDate);

    const dailyMetrics = garminBundle.dailyMetrics || {};
    const activities = garminBundle.activities || {};
    const metric = dailyMetrics[todayDate] || null;
    const intensityMinutes = metric ? getIntensityMinutes(metric) : 0;
    const steps = metric ? extractNumeric(metric.steps, 0) : 0;
    const activitiesCount = getDailyActivityCount(activities, todayDate);
    const hasGarminForDay = Boolean(metric);

    const readingGoal = readDailyGoal();

    const insight = garminLoading
      ? ''
      : buildInsight({
          questTotal,
          questRate,
          intensityMinutes,
          activitiesCount,
          steps,
          readingPages: readingToday.pages,
          readingMinutes: readingToday.minutes,
          readingGoal,
          hasGarminForDay
        });

    return {
      todayDate,
      quests: {
        completed,
        total: questTotal,
        rate: questRate,
        gainedXP,
        potentialXP
      },
      sport: {
        intensityMinutes,
        activitiesCount,
        steps: Math.round(steps),
        reps: workoutToday.reps,
        checkedExercises: workoutToday.checkedExercises,
        enduranceSessions: enduranceToday.sessionsCount,
        validatedChallenges: enduranceToday.validatedChallenges,
        hasGarminForDay,
        garminLoading
      },
      reading: {
        pages: readingToday.pages,
        minutes: readingToday.minutes,
        sessions: readingToday.sessions,
        dailyGoal: readingGoal,
        pagesPerHour: readingToday.pagesPerHour,
        booksReadToday: readingToday.booksRead
      },
      insight
    };
  }, [books, todayDate, getQuestsForDate, isQuestCompletedOnDate, garminBundle, garminLoading, workoutData]);

  const weekSeries = useMemo(() => {
    if (!todayDate) {
      return { chartData: [], weekRangeLabel: '' };
    }
    const anchor = new Date(`${todayDate}T12:00:00`).getTime();
    const DAY_MS = 86400000;
    const keys = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(anchor - (6 - i) * DAY_MS);
      return d.toISOString().slice(0, 10);
    });

    const dailyMetrics = garminBundle.dailyMetrics || {};
    const activities = garminBundle.activities || {};

    const chartData = keys.map((dateKey) => {
      const questsList = getQuestsForDate(dateKey) || [];
      let completed = 0;
      questsList.forEach((q) => {
        if (isQuestCompletedOnDate(q.id, dateKey)) completed += 1;
      });
      const questTotal = questsList.length;
      const questRate = questTotal > 0 ? Math.round((completed / questTotal) * 100) : 0;

      const readingByDay = getReadingForDate(books, dateKey);
      const workoutByDay = getWorkoutForDate(workoutData, dateKey);
      const enduranceByDay = getEnduranceForDate(workoutData, dateKey);

      const metric = dailyMetrics[dateKey] || null;
      const sportIntensity = metric ? getIntensityMinutes(metric) : 0;
      const sportSteps = metric ? Math.round(extractNumeric(metric.steps, 0)) : 0;
      const sportActivities = getDailyActivityCount(activities, dateKey);

      const day = new Date(`${dateKey}T12:00:00`);
      const shortLabel = day.toLocaleDateString('fr-FR', { weekday: 'short' });
      const fullLabel = day.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'short'
      });

      return {
        dateKey,
        shortLabel,
        fullLabel,
        questRate,
        questCompleted: completed,
        questTotal,
        readingMinutes: readingByDay.minutes,
        readingPages: readingByDay.pages,
        readingPagesPerHour: readingByDay.pagesPerHour,
        readingBooks: readingByDay.booksRead,
        sportIntensity,
        sportSteps,
        sportActivities,
        sportReps: workoutByDay.reps,
        sportCheckedExercises: workoutByDay.checkedExercises,
        sportEnduranceSessions: enduranceByDay.sessionsCount,
        sportValidatedChallenges: enduranceByDay.validatedChallenges,
        stepsK: Math.round((sportSteps / 1000) * 10) / 10
      };
    });

    const first = keys[0];
    const last = keys[keys.length - 1];
    const weekRangeLabel = `${new Date(`${first}T12:00:00`).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short'
    })} — ${new Date(`${last}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`;

    return { chartData, weekRangeLabel };
    const booksReadWeek = Array.from(
      new Set(chartData.flatMap((d) => (Array.isArray(d.readingBooks) ? d.readingBooks : [])))
    );
    const totalReadingMinutesWeek = chartData.reduce((sum, d) => sum + (d.readingMinutes || 0), 0);
    const totalReadingPagesWeek = chartData.reduce((sum, d) => sum + (d.readingPages || 0), 0);
    const weekPagesPerHour =
      totalReadingMinutesWeek > 0
        ? Number(((totalReadingPagesWeek / totalReadingMinutesWeek) * 60).toFixed(1))
        : 0;

    return { chartData, weekRangeLabel, booksReadWeek, weekPagesPerHour };
  }, [todayDate, books, getQuestsForDate, isQuestCompletedOnDate, garminBundle, workoutData]);

  const loading = questsLoading || booksLoading || (dbReady && garminLoading);

  return {
    ...snapshot,
    loading,
    weekChartData: weekSeries.chartData,
    weekRangeLabel: weekSeries.weekRangeLabel,
    booksReadWeek: weekSeries.booksReadWeek || [],
    weekPagesPerHour: weekSeries.weekPagesPerHour || 0
  };
};
