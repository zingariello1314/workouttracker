/**
 * Moteur d'insights « coach intelligent » — comparaisons aux repères performanceBenchmarks.
 */

import {
  RUNNING_DISTANCE_BENCHMARKS,
  PACE_REFERENCE,
  WEEKLY_KM_TIERS,
  DAILY_STEPS_TIERS,
  SESSIONS_PER_WEEK_TIERS,
  YEARLY_RUNNING_KM_TIERS,
  SEMI_MARATHON_PREP_DAYS,
  MARATHON_PREP_HOURS_8W,
  POPULATION_REFERENCES,
  PHYSICAL_LANDMARKS
} from '../../data/performanceBenchmarks';
import {
  computeRunningPersonalRecords,
  formatPaceMinPerKm,
  parseRunningSessionDurationMinutes
} from '../runningPersonalRecords';
import { mergeRunningSessionsWithGarmin, computeRunningVolumeTotals, buildGarminCardioById } from './runningVolumeTruth';
import { recapWindowWeeks } from './recapInsightHelpers';
import { countTrainingDaysInRange } from './recapTrainingDayTruth';
import { buildTotalStrengthRepsByDate } from './recapDailyChartData';
import { computeProgressionInsights, formatProgressionCoachText, isActionableProgressionInsight } from './volumeProgressionEngine';
import {
  extractBenchmarkMetricsByExercise,
  computeWindowHalfTrend,
  computeWindowTonnageKg,
  benchmarkTierInsight,
  getRegistryBenchmarkDef,
  analyzeStructuredSession
} from './strengthBenchmarkExtractors';
import { buildWeightByDateMap } from './recapAssessmentSeries';
import {
  buildInsightRotationSeed,
  selectDiverseBenchmarkInsights
} from './recapInsightSelection';
import { buildRichBenchmarkInsights } from './recapBenchmarkRichInsights';

function formatDurationSec(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function paceToSpeedKmh(paceMinPerKm) {
  if (!paceMinPerKm || paceMinPerKm <= 0) return null;
  return Math.round((60 / paceMinPerKm) * 10) / 10;
}

function tierForRunningTime(tiers, timeSec) {
  if (!Number.isFinite(timeSec) || timeSec <= 0) return null;
  for (const t of tiers) {
    if (timeSec <= t.fasterThanSec) return t;
  }
  return { id: 'beyond_beginner', label: 'en progression' };
}

function tierForStrengthReps(tiers, reps) {
  if (!Number.isFinite(reps) || reps <= 0) return null;
  const sorted = [...tiers].sort((a, b) => (b.minReps ?? b.min) - (a.minReps ?? a.min));
  return sorted.find((t) => reps >= (t.minReps ?? t.min) && reps <= (t.maxReps ?? t.max)) || null;
}

function resolveBodyWeightKg(snapshot, profileQuestionnaireRaw) {
  const map = buildWeightByDateMap(snapshot?.progressEntries);
  let latestYmd = null;
  let latestW = null;
  map.forEach((w, d) => {
    if (!latestYmd || d > latestYmd) {
      latestYmd = d;
      latestW = w;
    }
  });
  if (latestW != null) return latestW;
  const qw = profileQuestionnaireRaw?.answers?.vitalsSelfReport?.weightKg;
  const n = Number(qw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function tierForSessionsPerWeek(rate) {
  return SESSIONS_PER_WEEK_TIERS.find((t) => rate >= t.min && rate <= t.max) || null;
}

function tierForYearlyKm(km) {
  return YEARLY_RUNNING_KM_TIERS.find((t) => km >= t.min && km <= t.max) || null;
}

/** Meilleur temps course sur distance standard (sessions ≥ minSessionKm). */
function bestRaceSession(sessions, bench) {
  let best = null;
  (sessions || []).forEach((s) => {
    const dist = parseFloat(String(s?.distance ?? '').replace(',', '.')) || 0;
    if (dist < bench.minSessionKm) return;
    if (bench.maxSessionKm != null && dist > bench.maxSessionKm) return;
    const durMin = parseRunningSessionDurationMinutes(s?.duration);
    if (durMin <= 0) return;
    const sec = Math.round(durMin * 60);
    if (best == null || sec < best.timeSec) {
      best = {
        timeSec: sec,
        dateYmd: String(s?.date || '').slice(0, 10),
        distanceKm: dist,
        durationMin: durMin,
        session: s
      };
    }
  });
  return best;
}

function extractRunningSessions(snapshot, garminData) {
  const stored = snapshot?.enduranceData?.sessions?.running || [];
  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  return mergeRunningSessionsWithGarmin(stored, garminById);
}

function formatDaysHours(totalMin) {
  const h = Math.floor(totalMin / 60);
  const d = Math.floor(h / 24);
  const remH = h % 24;
  if (d > 0) return `${d} jour${d > 1 ? 's' : ''} et ${remH} h`;
  return `${h} h`;
}

/**
 * @returns {{ insights: Array<{id, category, text, priority}>, profile: object }}
 */
export function buildRecapBenchmarkInsights({
  snapshot,
  enrichment = null,
  garminData = null,
  assessment = null,
  getExerciseNameById,
  profileQuestionnaireRaw = null,
  period = '30d'
}) {
  const insights = [];
  const window = enrichment?.window;
  if (!snapshot) return { insights, profile: null };

  const runningSessions = extractRunningSessions(snapshot, garminData);
  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  const records = computeRunningPersonalRecords(runningSessions, garminById);
  const yearTotals = computeRunningVolumeTotals(runningSessions, garminById, {
    period: 'year',
    snapshot
  });
  const windowTotals = computeRunningVolumeTotals(runningSessions, garminById, {
    period: period === 'all' ? '365' : period,
    snapshot
  });

  const weeks = recapWindowWeeks(window);
  const trainingDays =
    window?.start && window?.end
      ? countTrainingDaysInRange(snapshot, window.start, window.end, garminData)
      : assessment?.activeDays28 ?? 0;
  const sessionsPerWeek = weeks > 0 ? trainingDays / weeks : 0;

  const streak = enrichment?.streak || { current: 0, longest: 0 };
  const bodyWeightKg = resolveBodyWeightKg(snapshot, profileQuestionnaireRaw);

  const strengthExtract = extractBenchmarkMetricsByExercise(snapshot, window, getExerciseNameById);
  const windowTonnageKg = computeWindowTonnageKg(snapshot, window);
  const halfTrend = computeWindowHalfTrend(snapshot, window);

  const pullStrict = strengthExtract.byBenchmarkKey.get('pullups_strict');
  const pullAustralian = strengthExtract.byBenchmarkKey.get('pullups_australian');
  const dipsMetrics = strengthExtract.byBenchmarkKey.get('dips');
  const pushMetrics = strengthExtract.byBenchmarkKey.get('pushups');

  const profile = {
    runningKmYear: yearTotals.totalKm,
    runningKmWindow: windowTotals.totalKm,
    sessionsPerWeek: Math.round(sessionsPerWeek * 10) / 10,
    bestPaceMinPerKm: records.bestPace?.pace ?? null,
    streakCurrent: streak.current,
    streakLongest: streak.longest,
    pullupsStrictMaxSet: pullStrict?.maxSetReps ?? 0,
    pullupsAustralianMaxSet: pullAustralian?.maxSetReps ?? 0,
    pushupsMaxSet: pushMetrics?.maxSetReps ?? 0,
    dipsMaxSet: dipsMetrics?.maxSetReps ?? 0,
    windowTonnageKg,
    structuredSessionCount: strengthExtract.structuredSessionCount,
    halfTrend
  };

  const pushInsight = (id, category, text, priority = 50, drillDown = null) => {
    insights.push({ id, category, text, priority, ...(drillDown ? { drillDown } : {}) });
  };

  // —— Population : fréquence ——
  const popAdult = POPULATION_REFERENCES.averageAdult.sessionsPerWeek;
  if (sessionsPerWeek >= 1.2 && popAdult > 0) {
    const ratio = Math.round((sessionsPerWeek / popAdult) * 10) / 10;
    if (ratio >= 1.5) {
      pushInsight(
        'pop_frequency',
        'consistency',
        `Tu t'entraînes environ ${ratio} fois plus régulièrement que la population générale (~${sessionsPerWeek} séances/sem. vs ~${popAdult} pour un adulte moyen).`,
        72
      );
    }
  }

  const sessTier = tierForSessionsPerWeek(sessionsPerWeek);
  if (sessTier && ['sporty', 'invested'].includes(sessTier.id)) {
    pushInsight(
      'sess_tier',
      'consistency',
      `Ta moyenne de ${sessionsPerWeek} séances par semaine correspond à un rythme ${sessTier.label} — proche d'un sportif structuré.`,
      68
    );
  }

  // —— Volume course annuel ——
  const kmYear = yearTotals.totalKm;
  if (kmYear >= 80) {
    const popKm = POPULATION_REFERENCES.averageAdult.runningKmPerYear;
    const ratioKm = Math.round((kmYear / popKm) * 10) / 10;
    if (ratioKm >= 2) {
      pushInsight(
        'km_vs_france',
        'running',
        `Tu as couru ${kmYear.toLocaleString('fr-FR')} km cette année — environ ${ratioKm} fois le volume annuel moyen d'un adulte français loisir.`,
        75
      );
    }
    const kmTier = tierForYearlyKm(kmYear);
    if (kmTier && ['committed', 'high', 'ultra'].includes(kmTier.id)) {
      pushInsight(
        'km_tier',
        'running',
        `Avec ${kmYear.toLocaleString('fr-FR')} km sur l'année, tu dépasses le profil de nombreux marathoniens loisirs (${kmTier.label}).`,
        70
      );
    }
  }

  // —— Allure max ——
  const bestPace = records.bestPace?.pace;
  if (bestPace != null && bestPace < 8) {
    const speed = paceToSpeedKmh(bestPace);
    const paceStr = formatPaceMinPerKm(bestPace);
    const recPace = POPULATION_REFERENCES.recreationalRunner.avg5kPaceMinPerKm;
    const fasterThanAvg = recPace > bestPace;
    pushInsight(
      'best_pace_speed',
      'running',
      `Ton meilleur kilomètre à ${paceStr} correspond à ${speed} km/h${
        fasterThanAvg
          ? ' — une vitesse supérieure à celle qu’un coureur amateur moyen maintient sur un 5 km.'
          : '.'
      }`,
      78
    );

    const slowerPaces = PACE_REFERENCE.filter((p) => bestPace < p.paceMinPerKm);
    const pctAmateur =
      slowerPaces.length > 0
        ? Math.round((slowerPaces.length / PACE_REFERENCE.length) * 100)
        : null;
    if (pctAmateur != null && pctAmateur >= 55) {
      pushInsight(
        'pace_percentile',
        'running',
        `Cette allure de pointe te place au-dessus d'environ ${pctAmateur} % des allures de référence amateur (2:30 → 8:00/km).`,
        76
      );
    }
  }

  // —— Distances standard ——
  Object.entries(RUNNING_DISTANCE_BENCHMARKS).forEach(([key, bench]) => {
    const race = bestRaceSession(runningSessions, bench);
    if (!race) return;
    const { timeSec } = race;
    const tier = tierForRunningTime(bench.tiers, timeSec);
    if (!tier) return;

    const beginnerTier = bench.tiers[bench.tiers.length - 1];
    const deltaBeginnerMin =
      beginnerTier && timeSec < beginnerTier.fasterThanSec
        ? Math.round((beginnerTier.fasterThanSec - timeSec) / 60)
        : null;

    const runningDrillDown = race.dateYmd
      ? {
          dateYmd: race.dateYmd,
          kind: 'running',
          benchmarkKey: key,
          distanceKm: race.distanceKm,
          timeSec,
          label: bench.label
        }
      : null;

    pushInsight(
      `race_${key}`,
      'running',
      `Votre meilleur ${bench.label} (${formatDurationSec(timeSec)}) vous place au niveau ${tier.label}.${
        deltaBeginnerMin != null && deltaBeginnerMin >= 3
          ? ` Soit ~${deltaBeginnerMin} min plus rapide qu'un coureur débutant typique sur cette distance.`
          : ''
      }`,
      key === '5k' ? 80 : key === '10k' ? 77 : key.startsWith('m') ? 72 : 74,
      runningDrillDown
    );

    if (key === '10k' && timeSec <= 45 * 60) {
      const marathonAvgPaceSec = POPULATION_REFERENCES.recreationalRunner.avgMarathonTimeSec / 42.195;
      const userPaceSec = timeSec / 10;
      if (userPaceSec < marathonAvgPaceSec) {
        pushInsight(
          '10k_vs_marathon_pace',
          'running',
          `Votre meilleur 10 km est plus rapide que l'allure marathon d'un coureur amateur moyen.`,
          73
        );
      }
    }
  });

  // —— Allure → projection 10 km (uniquement si allure mesurée sur séance réelle) ——
  if (bestPace != null && bestPace <= 5 && records.bestPace?.session) {
    const paceStr = formatPaceMinPerKm(bestPace);
    const projected10kMin = bestPace * 10;
    if (bestPace <= 4.1) {
      pushInsight(
        'pace_vs_5k20',
        'running',
        `Votre kilomètre le plus rapide est de ${paceStr.replace(' /km', '')}. Vous courez donc plus vite que l'allure nécessaire pour un 5 km en 20 minutes.`,
        76
      );
    }
    if (projected10kMin <= 45) {
      pushInsight(
        'pace_project_10k',
        'running',
        `À votre meilleure allure (${paceStr}), vous couvririez 10 km en environ ${formatDurationSec(Math.round(projected10kMin * 60))}.`,
        71
      );
    }
  }

  // —— Volume hebdomadaire course ——
  const weeklyKm = weeks > 0 ? windowTotals.totalKm / weeks : 0;
  if (weeklyKm >= 15) {
    const wkTier = WEEKLY_KM_TIERS.find((t) => weeklyKm >= t.min && weeklyKm <= t.max);
    if (wkTier && ['serious', 'invested', 'competitive', 'high_volume'].includes(wkTier.id)) {
      pushInsight(
        'weekly_km_tier',
        'running',
        `Votre kilométrage hebdomadaire (~${Math.round(weeklyKm)} km/sem.) est comparable à celui d'un coureur ${wkTier.label}.`,
        69
      );
    }
  }

  // —— Évolution fenêtre (1ère vs 2ème moitié) — indépendante de la plage choisie ——
  if (halfTrend) {
    if (halfTrend.trend === 'up') {
      const metric =
        halfTrend.volFirst > 0 || halfTrend.volSecond > 0
          ? `tonnage +${halfTrend.volDeltaPct} %`
          : `reps +${halfTrend.repsDeltaPct} %`;
      pushInsight(
        'window_trend_up',
        'progression',
        `Sur la période analysée, la 2ème moitié montre une hausse (${metric}) — vos saisies récentes tirent les analyses vers le haut.`,
        79
      );
    } else if (halfTrend.trend === 'down') {
      pushInsight(
        'window_trend_down',
        'progression',
        `La 2ème moitié de la période est en baisse (${
          halfTrend.volFirst > 0 ? `tonnage ${halfTrend.volDeltaPct} %` : `reps ${halfTrend.repsDeltaPct} %`
        }) — les insights reflètent cette stagnation ou régression récente.`,
        77
      );
    }
  }

  // —— Progression inter-séances (uniquement signaux actionnables : charge, schéma, volume réel) ——
  const progressionInsights = computeProgressionInsights(snapshot, window, getExerciseNameById).filter(
    isActionableProgressionInsight
  );
  progressionInsights.slice(0, 2).forEach((pi, idx) => {
    const text = formatProgressionCoachText(pi);
    if (!text) return;
    const typePriority =
      pi.progressionType === 'strength'
        ? 81
        : pi.progressionType === 'regression'
          ? 76
          : pi.progressionType === 'stall'
            ? 55
            : 70;
    const drillDown = pi.currDate
      ? (() => {
          const analysis = pi.currStorageKey
            ? analyzeStructuredSession(snapshot, pi.currStorageKey, getExerciseNameById)
            : null;
          return {
            dateYmd: pi.currDate,
            storageKey: pi.currStorageKey,
            exerciseId: pi.exerciseId,
            exerciseName: pi.exerciseName,
            kind: 'progression',
            prevDate: pi.prevDate,
            sets: analysis?.sets || [],
            totalReps: analysis?.totalReps,
            setCount: analysis?.setCount,
            metric: analysis?.benchmarkDef?.metric,
            benchmarkKey: analysis?.benchmarkDef?.key
          };
        })()
      : null;
    pushInsight(`progression_${pi.exerciseId}_${idx}`, 'progression', text, typePriority, drillDown);
  });

  // —— Benchmarks par exercice (meilleure série, pas seulement total jour) ——
  strengthExtract.byBenchmarkKey.forEach((metrics, key) => {
    const def = getRegistryBenchmarkDef(key);
    if (!def) return;
    const row = benchmarkTierInsight(def, metrics, bodyWeightKg);
    if (row) {
      pushInsight(`bench_${key}`, 'strength', row.text, row.priority, row.drillDown);
    }
    if (metrics.totalReps >= 800 && ['pullups_strict', 'pullups_australian', 'dips', 'pushups'].includes(key)) {
      pushInsight(
        `volume_${key}`,
        'strength',
        `Volume ${def.label.toLowerCase()} : ${metrics.totalReps.toLocaleString('fr-FR')} reps sur la période${
          metrics.structuredCount >= 2
            ? ' (réparties en séries enregistrées, pas seulement un total journalier).'
            : '.'
        }`,
        62,
        metrics.bestRecord || null
      );
    }
  });

  // —— Tonnage : carte unique contextualisée (voir buildSmartTonnageInsight dans rich insights) ——

  // —— Streaks ——
  if (streak.current >= 7) {
    const streakMsg =
      streak.current >= 365
        ? 'Exceptionnel — une année complète d’activité.'
        : streak.current >= 100
          ? 'Très rare — plus de 100 jours consécutifs.'
          : streak.current >= 30
            ? 'Un mois complet sans interruption.'
            : 'Une semaine complète d’entraînement.';
    pushInsight(
      'streak_current',
      'consistency',
      `Série en cours : ${streak.current} jours — ${streakMsg}`,
      streak.current >= 100 ? 73 : 68
    );
  }
  if (streak.current >= 14) {
    pushInsight(
      'streak_semi_prep',
      'consistency',
      `Votre série actuelle de ${streak.current} jours dépasse la durée typique d'une préparation semi-marathon (${SEMI_MARATHON_PREP_DAYS} j.).`,
      71
    );
  }
  if (streak.longest >= 60) {
    pushInsight(
      'streak_long',
      'consistency',
      `Vous avez maintenu une activité physique pendant ${streak.longest} jours consécutifs au maximum — une assiduité rare.`,
      69
    );
  }

  // —— Pas Garmin (moyenne fenêtre) ——
  if (garminData?.dailyMetrics && window?.start && window?.end) {
    let stepSum = 0;
    let stepDays = 0;
    Object.entries(garminData.dailyMetrics).forEach(([d, m]) => {
      if (d < window.start || d > window.end) return;
      const steps = Number(m?.steps);
      if (Number.isFinite(steps) && steps > 0) {
        stepSum += steps;
        stepDays += 1;
      }
    });
    if (stepDays >= 3) {
      const avgSteps = Math.round(stepSum / stepDays);
      const stepTier = DAILY_STEPS_TIERS.find((t) => avgSteps >= t.min && avgSteps <= t.max);
      if (stepTier && ['active', 'very_active', 'excellent', 'exceptional'].includes(stepTier.id)) {
        pushInsight(
          'steps_avg_tier',
          'consistency',
          `Votre moyenne de ${avgSteps.toLocaleString('fr-FR')} pas/jour dépasse celle de la majorité des adultes (profil ${stepTier.label}).`,
          66
        );
      }
    }
  }

  // —— Wow tractions strictes (volume vertical) ——
  const pullStrictTotal = pullStrict?.totalReps ?? 0;
  if (pullStrictTotal >= 500) {
    const eiffelCount = Math.round(pullStrictTotal * 0.5 / PHYSICAL_LANDMARKS.eiffelTowerHeightM);
    if (eiffelCount >= 3) {
      pushInsight(
        'pullups_eiffel',
        'wow',
        `Vous avez réalisé ${pullStrictTotal.toLocaleString('fr-FR')} tractions strictes sur la période — l'équivalent d'environ ${eiffelCount} fois la hauteur de la Tour Eiffel en ascension verticale cumulée (estimation).`,
        82
      );
    }
  }

  // —— Volume muscu global ——
  const repsMap = buildTotalStrengthRepsByDate(snapshot);
  let totalRepsYear = 0;
  const yearPrefix = `${new Date().getFullYear()}-`;
  repsMap.forEach((v, d) => {
    if (d.startsWith(yearPrefix)) totalRepsYear += Number(v) || 0;
  });
  if (totalRepsYear >= 8000) {
    pushInsight(
      'reps_year_wow',
      'wow',
      `Plus de ${totalRepsYear.toLocaleString('fr-FR')} répétitions de musculation enregistrées cette année — un volume de travail conséquent.`,
      70
    );
  }

  // —— Wow distance / temps ——
  if (kmYear >= PHYSICAL_LANDMARKS.parisLyonKm * 0.85) {
    pushInsight(
      'paris_lyon',
      'wow',
      `Vous avez couru suffisamment cette année (${kmYear.toLocaleString('fr-FR')} km) pour relier Paris à Lyon à pied (${PHYSICAL_LANDMARKS.parisLyonKm} km).`,
      85
    );
  }

  let totalRunMin = 0;
  runningSessions.forEach((s) => {
    const d = String(s?.date || '').slice(0, 10);
    if (!d.startsWith(yearPrefix)) return;
    totalRunMin += parseRunningSessionDurationMinutes(s?.duration);
  });
  if (totalRunMin >= 12 * 60) {
    pushInsight(
      'running_time_year',
      'wow',
      `Votre temps total de course cette année représente ${formatDaysHours(totalRunMin)} passées à courir.`,
      72
    );
  }
  if (totalRunMin / 60 >= MARATHON_PREP_HOURS_8W * 0.9) {
    pushInsight(
      'marathon_prep_hours',
      'wow',
      `Vous avez passé plus de temps à courir cette année qu'un marathonien loisir typique pendant ses ${MARATHON_PREP_HOURS_8W} h de préparation sur 8 semaines.`,
      68
    );
  }

  buildRichBenchmarkInsights({
    snapshot,
    window,
    getExerciseNameById,
    strengthExtract,
    windowTonnageKg,
    windowTotals,
    kmYear,
    trainingDays,
    weeks,
    garminData,
    bodyWeightKg,
    pullStrict,
    pushMetrics,
    dipsMetrics,
    runningSessions,
    halfTrend
  }).forEach((row) => {
    pushInsight(row.id, row.category, row.text, row.priority, row.drillDown || null);
  });

  const rotationSeed = buildInsightRotationSeed(snapshot, strengthExtract, records);
  const deduped = selectDiverseBenchmarkInsights(insights, {
    seed: rotationSeed,
    maxTotal: 18,
    maxPerCategory: 4
  });

  return { insights: deduped, profile };
}
