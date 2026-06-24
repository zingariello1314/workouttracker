/**
 * Insights enrichis pour le panneau Repères — compléments concrets au-delà des cartes génériques.
 */

import { collectDedupedCheckedVolumeKeys } from '../trainingLoadUtils';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import {
  analyzeStructuredSession,
  getRegistryBenchmarkDef
} from './strengthBenchmarkExtractors';
import { tierForValue } from './exerciseBenchmarkRegistry';
import { POPULATION_REFERENCES, PHYSICAL_LANDMARKS, RUNNING_DISTANCE_BENCHMARKS, MONTHLY_TONNAGE_TIERS_KG } from '../../data/performanceBenchmarks';
import { computeProgressionInsights, formatProgressionCoachText } from './volumeProgressionEngine';
import { parseRunningSessionDurationMinutes } from '../runningPersonalRecords';
import { buildTotalStrengthRepsByDate } from './recapDailyChartData';

const MARATHON_KM = 42.195;

/** Tonnage contextualisé — une seule carte utile, pas éléphant + bus + tonnes en triple. */
export function buildSmartTonnageInsight({
  windowTonnageKg,
  bodyWeightKg,
  weeks,
  halfTrend
}) {
  if (!windowTonnageKg || windowTonnageKg < 8000) return null;

  const tonnes = Math.round(windowTonnageKg / 1000);
  const tier = MONTHLY_TONNAGE_TIERS_KG.find(
    (t) => windowTonnageKg >= t.minKg && windowTonnageKg <= t.maxKg
  );
  const nextTier = MONTHLY_TONNAGE_TIERS_KG.find((t) => t.minKg > windowTonnageKg);
  const weeklyKg = weeks > 0 ? windowTonnageKg / weeks : windowTonnageKg;
  const weeklyTonnes = Math.round((weeklyKg / 1000) * 10) / 10;

  const parts = [`Tonnage muscu : ${tonnes.toLocaleString('fr-FR')} t sur la période`];
  if (weeks >= 2) parts[0] += ` (~${weeklyTonnes} t/semaine)`;
  if (tier) parts.push(`palier « ${tier.label} » atteint`);

  if (bodyWeightKg > 0 && weeks > 0) {
    const bwPerWeek = Math.round(weeklyKg / bodyWeightKg);
    if (bwPerWeek >= 15) {
      parts.push(
        `chaque semaine ≈ ${bwPerWeek}× votre poids de corps déplacé en charges cumulées`
      );
    }
  }

  if (nextTier) {
    const gapT = Math.round((nextTier.minKg - windowTonnageKg) / 1000);
    if (gapT > 0 && gapT <= Math.max(8, tonnes * 0.35)) {
      parts.push(`prochain cap « ${nextTier.label} » à ${gapT} t près`);
    }
  }

  if (halfTrend?.trend === 'up' && (halfTrend.volDeltaPct ?? 0) >= 8) {
    parts.push(`volume +${halfTrend.volDeltaPct} % en 2ème moitié de période`);
  } else if (halfTrend?.trend === 'down' && (halfTrend.volDeltaPct ?? 0) <= -8) {
    parts.push(`volume ${halfTrend.volDeltaPct} % en 2ème moitié — charge ou fréquence à réajuster`);
  }

  return {
    id: 'tonnage_context',
    category: 'wow',
    text: `${parts[0]}${parts.length > 1 ? ` — ${parts.slice(1).join(' · ')}` : ''}.`,
    priority: 77
  };
}

function metricValueFromAnalysis(analysis, metric) {
  if (!analysis) return 0;
  if (metric === 'hold_seconds') return analysis.maxHoldSeconds || 0;
  if (metric === 'max_weight_kg') return analysis.maxSetWeight || 0;
  return analysis.maxSetReps || 0;
}

function formatDurationSec(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function tierForRunningTime(tiers, timeSec) {
  if (!Number.isFinite(timeSec) || timeSec <= 0) return null;
  for (const t of tiers) {
    if (timeSec <= t.fasterThanSec) return t;
  }
  return { id: 'beyond_beginner', label: 'en progression' };
}

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
      best = { timeSec: sec, dateYmd: String(s?.date || '').slice(0, 10), distanceKm: dist };
    }
  });
  return best;
}

/** Écart au palier course suivant (ex. « il vous manque 42 s pour passer en très bon »). */
export function buildRunningTierGapInsights(runningSessions) {
  const out = [];
  Object.entries(RUNNING_DISTANCE_BENCHMARKS).forEach(([key, bench]) => {
    const race = bestRaceSession(runningSessions, bench);
    if (!race) return;
    const { timeSec } = race;
    const tier = tierForRunningTime(bench.tiers, timeSec);
    if (!tier) return;
    const idx = bench.tiers.findIndex((t) => t.id === tier.id);
    if (idx <= 0) return;
    const next = bench.tiers[idx - 1];
    const gapSec = timeSec - next.fasterThanSec;
    if (gapSec <= 0 || gapSec > 180) return;

    out.push({
      id: `run_gap_${key}`,
      category: 'running',
      text: `Sur votre meilleur ${bench.label} (${formatDurationSec(timeSec)}), il vous manque ${gapSec} s pour atteindre le palier « ${next.label} » (actuellement ${tier.label}).`,
      priority: 79,
      drillDown: {
        dateYmd: race.dateYmd,
        kind: 'running',
        benchmarkKey: key,
        distanceKm: race.distanceKm,
        timeSec,
        label: bench.label
      }
    });
  });
  return out.slice(0, 3);
}

/** Meilleur jour combiné muscu + course dans la fenêtre. */
export function buildBestTrainingDayInsight(snapshot, window, runningSessions) {
  if (!window?.start || !window?.end) return null;
  const repsByDate = buildTotalStrengthRepsByDate(snapshot);
  const kmByDate = new Map();
  (runningSessions || []).forEach((s) => {
    const d = String(s?.date || '').slice(0, 10);
    if (d < window.start || d > window.end) return;
    const km = parseFloat(String(s?.distance ?? '').replace(',', '.')) || 0;
    if (km > 0) kmByDate.set(d, (kmByDate.get(d) || 0) + km);
  });

  let bestDate = null;
  let bestScore = 0;
  let bestReps = 0;
  let bestKm = 0;

  const dates = new Set([...repsByDate.keys(), ...kmByDate.keys()]);
  dates.forEach((d) => {
    if (d < window.start || d > window.end) return;
    const reps = Number(repsByDate.get(d)) || 0;
    const km = kmByDate.get(d) || 0;
    const score = reps + km * 25;
    if (score > bestScore) {
      bestScore = score;
      bestDate = d;
      bestReps = reps;
      bestKm = km;
    }
  });

  if (!bestDate || bestScore < 80) return null;
  const parts = [];
  if (bestReps >= 40) parts.push(`${bestReps} reps`);
  if (bestKm >= 3) parts.push(`${Math.round(bestKm * 10) / 10} km courus`);
  if (parts.length === 0) return null;

  return {
    id: 'best_training_day',
    category: 'consistency',
    text: `Votre meilleur jour de la période : ${bestDate} (${parts.join(' + ')}) — pic d'activité sur la fenêtre analysée.`,
    priority: 73,
    drillDown: { dateYmd: bestDate, kind: 'best_day', reps: bestReps, km: bestKm }
  };
}

function formatHoldShort(sec) {
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s > 0 ? `${m} min ${s} s` : `${m} min`;
  }
  return `${sec} s`;
}

function collectBenchmarkSessions(snapshot, window, getExerciseNameById) {
  const byKey = new Map();
  collectDedupedCheckedVolumeKeys(snapshot).forEach((storageKey) => {
    const dateYmd = String(storageKey).slice(0, 10);
    if (window?.end && !isDateInRecapWindow(dateYmd, window)) return;
    const analysis = analyzeStructuredSession(snapshot, storageKey, getExerciseNameById);
    if (!analysis?.benchmarkDef) return;
    const bKey = analysis.benchmarkDef.key;
    if (!byKey.has(bKey)) byKey.set(bKey, []);
    byKey.get(bKey).push({ ...analysis, storageKey, dateYmd });
  });
  byKey.forEach((list) => list.sort((a, b) => a.dateYmd.localeCompare(b.dateYmd)));
  return byKey;
}

/** Écart jusqu'au palier benchmark suivant. */
export function buildTierGapInsights(strengthExtract) {
  const out = [];
  strengthExtract.byBenchmarkKey.forEach((metrics, key) => {
    const def = getRegistryBenchmarkDef(key);
    if (!def?.benchmark?.tiers) return;
    const value =
      def.metric === 'hold_seconds'
        ? metrics.maxHoldSeconds
        : def.metric === 'max_weight_kg'
          ? metrics.maxWeightKg
          : metrics.maxSetReps;
    if (!value || value <= 0) return;

    const tier = tierForValue(def.benchmark.tiers, value);
    if (!tier) return;
    const sorted = [...def.benchmark.tiers].sort((a, b) => a.min - b.min);
    const idx = sorted.findIndex((t) => t.id === tier.id);
    const next = sorted[idx + 1];
    if (!next) return;

    const target = next.min;
    const gap = target - value;
    if (gap <= 0) return;
    if (def.metric === 'max_set_reps' && gap > 12) return;
    if (def.metric === 'hold_seconds' && gap > 90) return;
    if (def.metric === 'max_weight_kg' && gap > 25) return;

    const label =
      def.metric === 'hold_seconds'
        ? formatHoldShort(gap)
        : def.metric === 'max_weight_kg'
          ? `${Math.round(gap)} kg`
          : `${gap} rep${gap > 1 ? 's' : ''}`;

    const currentLabel =
      def.metric === 'hold_seconds'
        ? formatHoldShort(value)
        : def.metric === 'max_weight_kg'
          ? `${Math.round(value)} kg`
          : `${value} reps`;

    out.push({
      id: `tier_gap_${key}`,
      category: 'strength',
      text: `Sur ${metrics.bestRecord?.exerciseName || def.label}, il vous manque ${label} pour atteindre le palier « ${next.label} » (actuellement ${currentLabel}, niveau ${tier.label}).`,
      priority: 77,
      drillDown: metrics.bestRecord || null
    });
  });
  return out;
}

/** Record personnel battu sur la période (dernière séance > meilleure précédente). */
export function buildPersonalRecordInsights(snapshot, window, getExerciseNameById) {
  const out = [];
  const byBenchmark = collectBenchmarkSessions(snapshot, window, getExerciseNameById);

  byBenchmark.forEach((sessions, bKey) => {
    if (sessions.length < 2) return;
    const last = sessions[sessions.length - 1];
    const metric = last.benchmarkDef.metric;
    const lastVal = metricValueFromAnalysis(last, metric);
    if (lastVal <= 0) return;

    let prevBest = 0;
    for (let i = 0; i < sessions.length - 1; i++) {
      prevBest = Math.max(prevBest, metricValueFromAnalysis(sessions[i], metric));
    }
    if (lastVal <= prevBest) return;

    const delta = lastVal - prevBest;
    const name = last.benchmarkDef.label;
    const exName =
      typeof getExerciseNameById === 'function'
        ? getExerciseNameById(last.exerciseId)
        : name;
    const valStr =
      metric === 'hold_seconds'
        ? formatHoldShort(lastVal)
        : metric === 'max_weight_kg'
          ? `${Math.round(lastVal)} kg`
          : `${lastVal} reps`;

    out.push({
      id: `pr_${bKey}_${last.dateYmd}`,
      category: 'strength',
      text: `Record perso sur ${exName || name} : ${valStr}${last.schemeLabel ? ` (${last.schemeLabel})` : ''} le ${last.dateYmd} — +${metric === 'hold_seconds' ? formatHoldShort(delta) : delta} vs votre meilleur précédent sur la période.`,
      priority: 83,
      drillDown: {
        dateYmd: last.dateYmd,
        storageKey: last.storageKey,
        exerciseId: last.exerciseId,
        exerciseName: exName || name,
        sets: last.sets,
        schemeLabel: last.schemeLabel,
        benchmarkKey: bKey,
        metric,
        kind: 'strength',
        value: lastVal
      }
    });
  });

  return out.slice(0, 4);
}

/** Progression détaillée avec chiffres (remplace les « stables » vides). */
export function buildDetailedProgressionInsights(snapshot, window, getExerciseNameById) {
  const raw = computeProgressionInsights(snapshot, window, getExerciseNameById);
  const out = [];

  raw.forEach((pi, idx) => {
    if (!pi.currStorageKey || !pi.prevStorageKey) return;
    const curr = analyzeStructuredSession(snapshot, pi.currStorageKey, getExerciseNameById);
    const prev = analyzeStructuredSession(snapshot, pi.prevStorageKey, getExerciseNameById);
    if (!curr || !prev) return;

    const name = pi.exerciseName || `Exercice ${pi.exerciseId}`;
    const currScheme = curr.schemeLabel || `${curr.setCount} séries`;
    const prevScheme = prev.schemeLabel || `${prev.setCount} séries`;

    let text = null;
    let priority = 70;

    if (pi.progressionType === 'strength' || pi.progressionType === 'hypertrophy') {
      text = formatProgressionCoachText(pi);
      priority = pi.progressionType === 'strength' ? 81 : 75;
    } else if (pi.progressionType === 'regression') {
      text = formatProgressionCoachText(pi);
      priority = 76;
    } else if (pi.progressionType === 'volume' && Math.abs(pi.metrics?.volumeDeltaPct ?? 0) >= 8) {
      text = formatProgressionCoachText(pi);
      priority = 74;
    } else if (pi.progressionType === 'stall') {
      const sameScheme = currScheme === prevScheme;
      if (sameScheme && curr.source === 'structured') {
        text = `${name} : ${prevScheme} maintenu sur deux séances (${pi.prevDate} → ${pi.currDate}) — consolidation active, prochain levier : +1 rep/série ou +2,5 kg.`;
        priority = 62;
      } else {
        text = `${name} : ${prevScheme} (${pi.prevDate}) → ${currScheme} (${pi.currDate}) — volume stable mais schéma ou charge ajusté.`;
        priority = 64;
      }
    }

    if (!text) return;

    out.push({
      id: `prog_detail_${pi.exerciseId}_${idx}`,
      category: 'progression',
      text,
      priority,
      drillDown: {
        dateYmd: pi.currDate,
        storageKey: pi.currStorageKey,
        exerciseId: pi.exerciseId,
        exerciseName: name,
        kind: 'progression',
        prevDate: pi.prevDate,
        sets: curr.sets,
        schemeLabel: curr.schemeLabel,
        metric: curr.benchmarkDef?.metric
      }
    });
  });

  return out.slice(0, 5);
}

/** Comparaisons fun et volume. */
export function buildFunAndVolumeInsights({
  windowTonnageKg,
  windowKm,
  kmYear,
  totalRepsWindow,
  trainingDaysInWindow,
  weeks,
  garminData,
  window,
  bodyWeightKg
}) {
  const out = [];

  if (windowKm >= MARATHON_KM * 0.9) {
    const marathons = Math.round((windowKm / MARATHON_KM) * 10) / 10;
    out.push({
      id: 'wow_marathons_month',
      category: 'wow',
      text: `Sur la période, vous avez couru l'équivalent de ${marathons} marathon${marathons > 1 ? 's' : ''} (${Math.round(windowKm)} km) — repère utile pour calibrer votre endurance fond.`,
      priority: 78
    });
  }

  // Tonnage éléphant / bus retirés — remplacés par buildSmartTonnageInsight (une carte contextualisée).

  if (kmYear >= PHYSICAL_LANDMARKS.parisMarseilleKm * 0.5) {
    out.push({
      id: 'wow_paris_marseille',
      category: 'wow',
      text: `Avec ${kmYear.toLocaleString('fr-FR')} km cette année, vous avez parcouru plus de la moitié de la distance Paris–Marseille (${PHYSICAL_LANDMARKS.parisMarseilleKm} km).`,
      priority: 74
    });
  }

  const popMonthKm = POPULATION_REFERENCES.averageAdult.runningKmPerMonth;
  if (windowKm >= popMonthKm * 3 && weeks > 0) {
    const monthly = (windowKm / weeks) * 4.33;
    const ratio = Math.round((monthly / popMonthKm) * 10) / 10;
    out.push({
      id: 'wow_km_vs_loisir_month',
      category: 'wow',
      text: `Votre rythme actuel (~${Math.round(monthly)} km/mois) représente environ ${ratio} fois le volume mensuel d'un coureur loisir moyen.`,
      priority: 72
    });
  }

  if (totalRepsWindow >= 1000) {
    const minutesInWeek = 7 * 24 * 60;
    if (totalRepsWindow >= minutesInWeek) {
      out.push({
        id: 'wow_reps_vs_week_minutes',
        category: 'wow',
        text: `Vous avez enregistré ${totalRepsWindow.toLocaleString('fr-FR')} répétitions sur la période — plus que le nombre de minutes dans une semaine (${minutesInWeek.toLocaleString('fr-FR')}).`,
        priority: 68
      });
    }
  }

  const annualMilestones = [50, 100, 150, 200, 300];
  if (trainingDaysInWindow >= 20 && weeks >= 4) {
    const projectedYear = Math.round((trainingDaysInWindow / weeks) * 52);
    const hit = annualMilestones.filter((m) => projectedYear >= m).pop();
    if (hit) {
      out.push({
        id: `wow_annual_sessions_${hit}`,
        category: 'consistency',
        text: `À ce rythme (~${Math.round((trainingDaysInWindow / weeks) * 10) / 10} séances/sem.), vous êtes sur une trajectoire de ${projectedYear} séances cette année — au-delà du cap symbolique des ${hit}.`,
        priority: 71
      });
    }
  }

  if (garminData?.dailyMetrics && window?.start && window?.end) {
    let bestSteps = 0;
    let bestDay = null;
    Object.entries(garminData.dailyMetrics).forEach(([d, m]) => {
      if (d < window.start || d > window.end) return;
      const steps = Number(m?.steps);
      if (Number.isFinite(steps) && steps > bestSteps) {
        bestSteps = steps;
        bestDay = d;
      }
    });
    if (bestSteps >= 12000) {
      const kmWalk = Math.round((bestSteps * 0.00075) * 10) / 10;
      out.push({
        id: 'wow_best_steps_day',
        category: 'consistency',
        text: `Votre meilleur jour : ${bestSteps.toLocaleString('fr-FR')} pas (${kmWalk} km estimés à pied) — bien au-dessus des 10 000 recommandés.`,
        priority: 67,
        drillDown: bestDay ? { dateYmd: bestDay, kind: 'steps', steps: bestSteps } : null
      });
    }
  }

  if (bodyWeightKg > 0 && windowTonnageKg > 0) {
    const movedBw = Math.round(windowTonnageKg / bodyWeightKg);
    if (movedBw >= 80 && windowTonnageKg < 8000) {
      out.push({
        id: 'wow_bodyweight_moved',
        category: 'wow',
        text: `Volume cumulé : l'équivalent de ${movedBw}× votre poids de corps sur la période (sans charges lourdes enregistrées).`,
        priority: 68
      });
    }
  }

  return out;
}

/** Ratio push / pull pour profil street. */
export function buildPushPullBalanceInsight(pullStrict, pushMetrics, dipsMetrics) {
  const pull = (pullStrict?.totalReps ?? 0) + (dipsMetrics?.totalReps ?? 0) * 0.7;
  const push = pushMetrics?.totalReps ?? 0;
  if (pull < 80 || push < 80) return null;

  const ratio = Math.round((push / pull) * 100) / 100;
  let text;
  if (ratio >= 1.4) {
    text = `Profil plutôt « poussée » : ${push.toLocaleString('fr-FR')} reps pompes vs ${(pullStrict?.totalReps ?? 0).toLocaleString('fr-FR')} tractions strictes sur la période (ratio ~${ratio}:1).`;
  } else if (ratio <= 0.75) {
    text = `Profil plutôt « tirage » : davantage de volume vertical (tractions + dips) que de pompes — ratio poussée/tirage ~${ratio}:1.`;
  } else {
    text = `Équilibre poussée/tirage équilibré sur la période (~${ratio}:1 pompes vs tractions strictes) — profil street harmonieux.`;
  }

  return {
    id: 'push_pull_balance',
    category: 'strength',
    text,
    priority: 66
  };
}

/**
 * Agrège tous les insights enrichis.
 */
export function buildRichBenchmarkInsights(ctx) {
  const {
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
  } = ctx;

  let totalRepsWindow = 0;
  strengthExtract.byBenchmarkKey.forEach((m) => {
    totalRepsWindow += m.totalReps || 0;
  });

  return [
    buildSmartTonnageInsight({ windowTonnageKg, bodyWeightKg, weeks, halfTrend }),
    ...buildRunningTierGapInsights(runningSessions),
    ...buildTierGapInsights(strengthExtract),
    ...buildPersonalRecordInsights(snapshot, window, getExerciseNameById),
    ...buildDetailedProgressionInsights(snapshot, window, getExerciseNameById),
    buildBestTrainingDayInsight(snapshot, window, runningSessions),
    ...buildFunAndVolumeInsights({
      windowTonnageKg,
      windowKm: windowTotals?.totalKm ?? 0,
      kmYear,
      totalRepsWindow,
      trainingDaysInWindow: trainingDays,
      weeks,
      garminData,
      window,
      bodyWeightKg
    }),
    buildPushPullBalanceInsight(pullStrict, pushMetrics, dipsMetrics)
  ].filter(Boolean);
}
