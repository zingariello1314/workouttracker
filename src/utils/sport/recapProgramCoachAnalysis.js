/**
 * Analyse « coach » du programme actif pour Récap > Analyse.
 * Niveaux : structure, progression réelle, récupération, tendances, compliments, recommandations, vision globale.
 */

import DateHelper from '../dateHelper';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { inferMuscleGroupsForExercise } from './recapMuscleInference';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { resolveStreetSkillPlan } from '../../features/profileQuestionnaire/quizStreetSkillGoal';
import {
  analyzeProgramForCoach
} from '../../features/profileQuestionnaire/quizProgramAnalyzer';
import { collectCheckedExerciseRepHistory } from './recapAdaptiveInsights';
import {
  magnitudeWord,
  pctChange,
  garminStatsForWindow,
  acuteChronicRepsRatio,
  challengeProgressPct,
  challengeInsightText,
  findExerciseSessions,
  isVerticalPullExercise,
  isPushupExercise,
  exerciseMovementBlob,
  weeklyRateFromSessionDays
} from './recapInsightHelpers';
import {
  buildGarminCardioById,
  mergeRunningSessionsWithGarmin
} from './runningVolumeTruth';
import { buildRunningSessionRows } from './runningCardioStatsAnalytics';
import { balanceCoachProgramLevels } from './recapProgramCoachDedup';
import { buildCoachVisionNarrative, computeGarminSleepAverage } from './recapCoachVision';
import { buildCoachVisionReport } from './recapCoachVisionReport';
import { compareExoCompletionWeekBlocks } from './recapCompletionTruth';

const MUSCLE_LABEL_FR = {
  [MuscleGroups.CHEST]: 'pectoraux',
  [MuscleGroups.BACK]: 'dos',
  [MuscleGroups.SHOULDERS]: 'épaules',
  [MuscleGroups.BICEPS]: 'biceps',
  [MuscleGroups.TRICEPS]: 'triceps',
  [MuscleGroups.QUADS]: 'quadriceps',
  [MuscleGroups.HAMSTRINGS]: 'ischio-jambiers',
  [MuscleGroups.CALVES]: 'mollets',
  [MuscleGroups.CORE]: 'abdominaux',
  [MuscleGroups.TIBIALIS_ANTERIOR]: 'tibial antérieur',
  [MuscleGroups.FULL_BODY]: 'corps entier'
};

const PUSH_GROUPS = new Set([MuscleGroups.CHEST, MuscleGroups.SHOULDERS, MuscleGroups.TRICEPS]);
const PULL_GROUPS = new Set([MuscleGroups.BACK, MuscleGroups.BICEPS]);
const LEG_GROUPS = new Set([
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.CALVES,
  MuscleGroups.TIBIALIS_ANTERIOR
]);

function parseSeriesVolume(seriesStr) {
  const s = String(seriesStr || '').toLowerCase();
  const m = s.match(/(\d+)\s*[×x*]\s*(\d+)/);
  if (m) return { sets: Number(m[1]) || 1, reps: Number(m[2]) || 0, volume: (Number(m[1]) || 1) * (Number(m[2]) || 0) };
  const repsOnly = s.match(/(\d+)\s*rep/);
  if (repsOnly) return { sets: 1, reps: Number(repsOnly[1]), volume: Number(repsOnly[1]) };
  if (/min|course|cardio|corde/.test(s)) return { sets: 1, reps: 0, volume: 8, cardio: true };
  return { sets: 1, reps: 0, volume: 4 };
}

function iterateProgramExercises(program, fn) {
  const schedule = program?.schedule;
  if (!schedule) return;
  Object.entries(schedule).forEach(([dayName, day]) => {
    if (!day?.active) return;
    [
      day.exercises,
      day.exercices,
      day.salleVariants?.semaineA?.exercises,
      day.salleVariants?.semaineA?.exercices,
      day.salleVariants?.semaineB?.exercises,
      day.salleVariants?.semaineB?.exercices
    ].forEach((list) => {
      (list || []).forEach((ex) => fn(ex, dayName));
    });
  });
}

function classifyProgramExercise(ex, getExerciseNameById) {
  const blob = exerciseMovementBlob(ex, getExerciseNameById);
  const id = parseInt(String(ex?.id), 10);
  const groups = inferMuscleGroupsForExercise(ex);
  const isPullup = isVerticalPullExercise(id, getExerciseNameById, ex);
  const isPushup = isPushupExercise(id, getExerciseNameById, ex);
  const isPull =
    isPullup ||
    groups.includes(MuscleGroups.BACK) ||
    (/traction|pull|tirage|rowing|chin|australien/.test(blob) && !/d[ée]velopp|press|pompe/.test(blob));
  const isPush =
    isPushup ||
    groups.includes(MuscleGroups.CHEST) ||
    (/pompe|push|dip|d[ée]velopp/.test(blob) && !/traction|tirage|rowing/.test(blob));
  const isLeg =
    groups.some((g) => LEG_GROUPS.has(g)) ||
    /squat|fente|presse|mollet|jambe|soulevé|hip thrust|fessier/.test(blob);
  return { isPullup, isPushup, isPull, isPush, isLeg };
}

function scanWeeklyMovementExposure(program, getExerciseNameById) {
  const days = { pull: new Set(), push: new Set(), legs: new Set(), pullups: new Set(), pushups: new Set() };
  iterateProgramExercises(program, (ex, dayName) => {
    const { isPullup, isPushup, isPull, isPush, isLeg } = classifyProgramExercise(ex, getExerciseNameById);
    if (isPull) days.pull.add(dayName);
    if (isPullup) days.pullups.add(dayName);
    if (isPush) days.push.add(dayName);
    if (isPushup) days.pushups.add(dayName);
    if (isLeg) days.legs.add(dayName);
  });
  return {
    pullDays: days.pull.size,
    pushDays: days.push.size,
    legDays: days.legs.size,
    pullupDays: days.pullups.size,
    pushupDays: days.pushups.size
  };
}

/** Exposition réelle (coches) sur la fenêtre récap, ramenée en j./sem. */
function scanActualMovementExposure(snapshot, window, getExerciseNameById) {
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  const pullupDates = new Set();
  const pushupDates = new Set();
  const pullDates = new Set();
  const pushDates = new Set();
  let pullupReps = 0;

  for (const [exId, sessions] of byEx) {
    const exLike = { id: exId };
    const isPullup = isVerticalPullExercise(exId, getExerciseNameById, exLike);
    const isPushup = isPushupExercise(exId, getExerciseNameById, exLike);
    const blob = exerciseMovementBlob(exLike, getExerciseNameById);
    const isPull =
      isPullup ||
      /traction|pull|tirage|rowing|chin|australien/.test(blob);
    const isPush =
      isPushup || (/pompe|push|dip|d[ée]velopp/.test(blob) && !/traction|tirage/.test(blob));

    sessions.forEach((s) => {
      if (isPullup) {
        pullupDates.add(s.date);
        pullupReps += s.reps;
      }
      if (isPushup) pushupDates.add(s.date);
      if (isPull) pullDates.add(s.date);
      if (isPush) pushDates.add(s.date);
    });
  }

  return {
    pullupSessionDays: pullupDates.size,
    pushupSessionDays: pushupDates.size,
    pullupDaysWeekly: weeklyRateFromSessionDays(pullupDates.size, window),
    pushupDaysWeekly: weeklyRateFromSessionDays(pushupDates.size, window),
    pullupReps,
    pullSessionDays: pullDates.size,
    pushSessionDays: pushDates.size
  };
}

function mergeMovementExposure(planExp, actualExp) {
  const plan = planExp || {};
  const actual = actualExp || {};
  const pullupWeekly = Math.max(plan.pullupDays || 0, actual.pullupDaysWeekly || 0);
  const pushupWeekly = Math.max(plan.pushupDays || 0, actual.pushupDaysWeekly || 0);
  return {
    ...plan,
    pullupDaysPlan: plan.pullupDays || 0,
    pushupDaysPlan: plan.pushupDays || 0,
    pullupDaysWeeklyActual: actual.pullupDaysWeekly || 0,
    pushupDaysWeeklyActual: actual.pushupDaysWeekly || 0,
    pullupSessionDays: actual.pullupSessionDays || 0,
    pullupRepsActual: actual.pullupReps || 0,
    pullupDays: pullupWeekly,
    pushupDays: pushupWeekly,
    actual
  };
}

function scanProgramMuscleVolume(program) {
  const byGroup = {};
  Object.values(MuscleGroups).forEach((g) => {
    byGroup[g] = 0;
  });

  iterateProgramExercises(program, (ex) => {
    const { volume, cardio } = parseSeriesVolume(ex?.series);
    if (cardio || volume <= 0) return;
    const groups = inferMuscleGroupsForExercise({
      id: ex?.id,
      name: ex?.name,
      nom: ex?.name,
      exerciseBankKey: ex?.exerciseBankKey
    });
    const share = volume / Math.max(1, groups.length);
    groups.forEach((g) => {
      byGroup[g] = (byGroup[g] || 0) + share;
    });
  });

  return byGroup;
}

function buildStructuralInsights(program, answers, muscleVol, exposure, pushPull, enrichment) {
  const out = [];
  if (!program?.schedule) {
    return [{ id: 'no.program', text: 'Aucun programme actif avec planning — l’analyse structurelle nécessite un programme enregistré.' }];
  }

  const pushVol = pushPull.push;
  const pullVol = pushPull.pull;
  const actualPP = enrichment?.pushPull;
  if (pushVol > 0 && pullVol > 0) {
    const ratio = pushVol / pullVol;
    const actualRatio = actualPP?.ratio;
    const actualPullReps = actualPP?.pull || 0;

    if (
      ratio >= 1.75 &&
      actualRatio != null &&
      actualRatio < ratio - 0.4 &&
      actualPullReps >= 200
    ) {
      out.push({
        id: 'push.pull.plan.vs.actual',
        signal: 'push_pull.actual_ratio',
        weight: 66,
        text: `Le plan formalise ~${ratio.toFixed(1)}× plus de poussée que de tirage, mais tes reps cochées sont ${actualPP.pushPct} % push / ${actualPP.pullPct} % pull (~${actualPullReps} reps tirage) — ta pratique réelle compense le biais du planning.`
      });
    } else if (ratio >= 1.75) {
      out.push({
        id: 'push.pull.imbalance',
        signal: 'push_pull.plan_ratio',
        weight: 64,
        text: `Ton programme contient environ ${ratio.toFixed(1)}× plus de poussée que de tirage. Cette répartition peut limiter la progression aux tractions et favoriser des déséquilibres posturaux.`
      });
    } else if (ratio <= 0.65) {
      out.push({
        id: 'pull.push.imbalance',
        signal: 'push_pull.plan_ratio',
        weight: 62,
        text: `Le tirage domine nettement la poussée (~${(pullVol / pushVol).toFixed(1)}×). Vérifie que les pectoraux et triceps reçoivent assez de volume si tu vises l’équilibre.`
      });
    } else {
      out.push({
        id: 'push.pull.balanced',
        signal: 'push_pull.plan_ratio',
        weight: 55,
        text: 'Excellente répartition haut du corps : les volumes poussée / tirage sont équilibrés dans le plan hebdomadaire.'
      });
    }
  }

  const sorted = Object.entries(muscleVol)
    .filter(([g, v]) => v > 0 && g !== MuscleGroups.FULL_BODY)
    .sort((a, b) => b[1] - a[1]);
  if (sorted.length >= 2) {
    const [topG, topV] = sorted[0];
    const [lowG, lowV] = sorted[sorted.length - 1];
    if (topV > 0 && lowV / topV < 0.25) {
      out.push({
        id: 'muscle.undertrained',
        text: `${MUSCLE_LABEL_FR[topG] || topG} est le plus sollicité dans le plan ; ${MUSCLE_LABEL_FR[lowG] || lowG} paraît sous-représenté — déséquilibre potentiel à surveiller.`
      });
    }
  }

  const street = resolveStreetSkillPlan(answers || {});
  const skill = street.skillId;
  const pullWeeklyActual = exposure.pullupDaysWeeklyActual || 0;
  const pullWeeklyPlan = exposure.pullupDaysPlan ?? exposure.pullupDays ?? 0;
  const pullWeekly = Math.max(pullWeeklyPlan, pullWeeklyActual);
  const pullRepsActual = exposure.pullupRepsActual || 0;

  if (skill === 'pullups_10' || skill === 'pullups_20' || skill === 'first_pullup') {
    const target = skill === 'pullups_20' ? 20 : skill === 'pullups_10' ? 10 : 1;
    if (pullWeeklyActual >= 3 || pullRepsActual >= 80) {
      out.push({
        id: 'freq.pullups.ok',
        signal: 'pullups.frequency',
        weight: pullWeeklyActual >= 3 ? 62 : 58,
        text:
          pullWeeklyActual >= 3
            ? `Tractions : ~${pullWeeklyActual} j./sem. en pratique (${exposure.pullupSessionDays || 0} séances) — fréquence cohérente avec « ${street.labelFr} ».`
            : `Tractions : fréquence hebdo diffuse mais régulière sur la période — le volume cumulé compense (voir progression réelle).`
      });
    } else if (pullWeeklyActual >= 2 && pullWeeklyPlan < pullWeeklyActual) {
      out.push({
        id: 'freq.pullups.actual.vs.plan',
        signal: 'pullups.frequency',
        weight: 60,
        text: `Plan : ${pullWeeklyPlan} j./sem. tractions vs ~${pullWeeklyActual} j./sem. en coches — ta pratique dépasse ce que le planning affiche.`
      });
    } else if (pullWeekly <= 2 && pullRepsActual < 40) {
      out.push({
        id: 'freq.pullups.low',
        signal: 'pullups.frequency',
        weight: 58,
        text: `Peu d’exposition tractions (~${pullWeeklyActual || pullWeeklyPlan} j./sem.) pour « ${street.labelFr} » (${target} reps visées).`
      });
    }
  }

  const pushWeeklyActual = exposure.pushupDaysWeeklyActual || 0;
  const pushWeeklyPlan = exposure.pushupDaysPlan ?? exposure.pushupDays ?? 0;
  const pushWeekly = Math.max(pushWeeklyPlan, pushWeeklyActual);
  if (pushWeekly >= 4) {
    out.push({
      id: 'freq.pushups.high',
      text: `Fréquence pompes : ~${pushWeekly} expositions hebdo${pushWeeklyActual > pushWeeklyPlan ? ' en pratique' : ' au plan'} — cohérente avec l’endurance musculaire.`
    });
  }

  const runKm = enrichment?.digest?.perActivity?.running?.totals?.distanceKm || 0;
  const legVol =
    (muscleVol[MuscleGroups.QUADS] || 0) + (muscleVol[MuscleGroups.HAMSTRINGS] || 0);
  if (exposure.legDays <= 1 && legVol < 15) {
    if (runKm >= 12) {
      out.push({
        id: 'legs.run.compensate',
        text: `Peu de jambes au plan street, mais ~${Math.round(runKm)} km course sur la période — le cardio compense partiellement le manque de travail jambes au programme.`
      });
    } else {
      out.push({
        id: 'legs.low',
        text: 'Peu de séances jambes dans le programme actuel — à croiser avec ta course si tu compenses par le cardio.'
      });
    }
  }

  if (sorted.length >= 1) {
    const top3 = sorted.slice(0, 3).map(([g, v]) => `${MUSCLE_LABEL_FR[g] || g} (${Math.round(v)} u.)`);
    out.push({
      id: 'muscle.top3',
      text: `Volumes planifiés dominants : ${top3.join(', ')} — repère pour comparer avec tes reps réellement cochées.`
    });
  }

  return out;
}

function sumGroupVolume(muscleVol, groupSet) {
  let s = 0;
  groupSet.forEach((g) => {
    s += muscleVol[g] || 0;
  });
  return s;
}

function exerciseDisplayName(exId, getExerciseNameById) {
  if (typeof getExerciseNameById === 'function') {
    const n = parseInt(String(exId), 10);
    if (Number.isFinite(n)) {
      const label = getExerciseNameById(n);
      if (label && String(label).trim() && !/^Exercice\s+\d+$/i.test(label)) return String(label).trim();
    }
  }
  return `Exercice ${exId}`;
}

function median(nums) {
  const v = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

/** Insights progression par exercice — plusieurs angles (max, tendance, volume, plateau). */
function buildExerciseProgressionCandidates(exId, sessions, getExerciseNameById) {
  const out = [];
  if (!sessions?.length) return out;
  const name = exerciseDisplayName(exId, getExerciseNameById);
  const values = sessions.map((s) => s.reps);
  const total = values.reduce((a, b) => a + b, 0);
  const max = Math.max(...values);
  const latest = values[values.length - 1];
  const prevMax = values.length >= 2 ? Math.max(...values.slice(0, -1)) : 0;
  const first = values[0];
  const last = values[values.length - 1];

  if (values.length >= 2 && latest > prevMax) {
    const gain = latest - prevMax;
    out.push({
      id: `prog.max.${exId}`,
      signal: `ex:${exId}:max`,
      weight: 72 + Math.min(12, gain * 3),
      text:
        gain === 1
          ? `${name} : nouveau record à ${latest} reps (+1 vs max précédent ${prevMax}) — micro-progression à consolider.`
          : `${name} : record à ${latest} reps (+${gain} vs ${prevMax}) le ${sessions[sessions.length - 1].date.slice(8, 10)}/${sessions[sessions.length - 1].date.slice(5, 7)} — progresse sans viser l’échec la séance suivante.`
    });
  } else if (values.length >= 2 && latest === prevMax - 1 && prevMax >= 3) {
    out.push({
      id: `prog.near.${exId}`,
      signal: `ex:${exId}:near_max`,
      weight: 64,
      text: `${name} : ${latest} reps — à 1 rep du max récent (${prevMax}), bonne fenêtre pour retenter le record.`
    });
  }

  if (values.length >= 4) {
    const mid = Math.floor(values.length / 2);
    const avg1 = values.slice(0, mid).reduce((a, b) => a + b, 0) / mid;
    const avg2 = values.slice(mid).reduce((a, b) => a + b, 0) / (values.length - mid);
    const chgPct = pctChange(avg2, avg1);

    if (avg2 > avg1 + 0.4) {
      out.push({
        id: `prog.up.${exId}`,
        signal: `ex:${exId}:trend_up`,
        weight: 68 + Math.min(10, (chgPct || 0) / 4),
        text: `${name} : moyenne récente en hausse (${Math.round(avg1)} → ${Math.round(avg2)} reps/séance, ${magnitudeWord(chgPct || 5)}) — courbe ${values.slice(-4).join(' → ')} reps.`
      });
    } else if (avg2 < avg1 - 0.8 && values.length >= 5) {
      out.push({
        id: `prog.down.${exId}`,
        signal: `ex:${exId}:trend_down`,
        weight: 62,
        text: `${name} : moyenne en baisse ${magnitudeWord(((avg1 - avg2) / Math.max(avg1, 1)) * 100)} (${values.slice(-3).join(', ')} reps) — fatigue, sommeil ou charge externe ?`
      });
    } else if (Math.max(...values) - Math.min(...values) <= 3 && values.length >= 4) {
      out.push({
        id: `prog.flat.${exId}`,
        signal: `ex:${exId}:plateau`,
        weight: 58,
        text: `${name} : plateau autour de ~${Math.round(median(values) || avg2)} reps (${values.slice(-4).join(', ')}) — micro-ajustement fréquence ou +1 rep tous les 10–14 j.`
      });
    }
  }

  if (total >= 120 && sessions.length >= 6) {
    out.push({
      id: `prog.vol.${exId}`,
      signal: `ex:${exId}:volume`,
      weight: 56 + Math.min(14, total / 80),
      text: `${name} : ${total} reps cumulées sur ${sessions.length} séances cochées (~${Math.round(total / sessions.length)}/séance) — volume ${total >= 400 ? 'élevé' : 'solide'} sur la période.`
    });
  } else if (total >= 40 && sessions.length >= 3 && last > first + 1) {
    out.push({
      id: `prog.vol.${exId}`,
      signal: `ex:${exId}:volume`,
      weight: 54,
      text: `${name} : ${first} → ${last} reps entre première et dernière séance (${sessions.length} séances, ${total} reps total) — progression visible sur la durée.`
    });
  }

  return out;
}

function buildProgressionInsights(snapshot, window, getExerciseNameById, program, assessment, enrichment) {
  const out = [];
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);

  const ranked = [...byEx.entries()]
    .map(([exId, sessions]) => ({ exId, sessions, total: sessions.reduce((s, x) => s + x.reps, 0) }))
    .filter((r) => r.sessions.length >= 2)
    .sort((a, b) => b.total - a.total || b.sessions.length - a.sessions.length);

  ranked.slice(0, 10).forEach(({ exId, sessions }) => {
    out.push(...buildExerciseProgressionCandidates(exId, sessions, getExerciseNameById));
  });

  const sla = assessment?.sessionLoadAlignment28;
  if (sla?.avgScore0to100 != null && sla.sessionDaysScored >= 3) {
    const score = sla.avgScore0to100;
    out.push({
      id: 'prog.sla',
      signal: 'completion.sla',
      weight: score >= 75 ? 65 : 58,
      text:
        score >= 75
          ? `Prévu vs réalisé ~${Math.round(score)} % (séries/reps du jour sur ${sla.sessionDaysScored} séances) — tu exécutes fidèlement le programme.`
          : `Écart prévu/réalisé ~${Math.round(score)} % sur ${sla.sessionDaysScored} séances — soit le plan est ambitieux, soit les coches sont incomplètes.`
    });
  }

  const momentum = assessment?.repsMomentumRatio;
  if (momentum != null && (assessment?.totalReps28 || 0) >= 100) {
    if (momentum >= 1.12) {
      out.push({
        id: 'prog.momentum.up',
        signal: 'reps.momentum',
        weight: 60,
        text: `Volume reps global +${Math.round((momentum - 1) * 100)} % vs quinzaine précédente — charge montante ${magnitudeWord((momentum - 1) * 100)} sur l’ensemble du street.`
      });
    } else if (momentum <= 0.88) {
      out.push({
        id: 'prog.momentum.down',
        signal: 'reps.momentum',
        weight: 57,
        text: `Volume reps global −${Math.round((1 - momentum) * 100)} % vs quinzaine précédente — décharge ou creux à clarifier avant de remonter.`
      });
    }
  }

  const records = (snapshot?.exerciseMaxRecords || []).filter((r) => {
    const d = r?.recordDate || (r?.recordedAt ? String(r.recordedAt).slice(0, 10) : null);
    return d && isDateInRecapWindow(d, window);
  });
  records.slice(0, 2).forEach((rec, i) => {
    const exId = rec?.exerciseId;
    const name = exerciseDisplayName(exId, getExerciseNameById);
    const repsVal = Number(rec?.reps) || 0;
    const wVal = Number(rec?.weightKg) || 0;
    if (repsVal <= 0 && wVal <= 0) return;
    out.push({
      id: `prog.record.${exId}.${i}`,
      signal: `prog.record.${exId}`,
      weight: 70,
      text:
        wVal > 0
          ? `${name} : record charge ${wVal} kg × ${repsVal || '?'} reps enregistré — repère pour la prochaine micro-progression.`
          : `${name} : max enregistré ${repsVal} reps — compare avec tes coches programme pour mesurer l’écart test / entraînement.`
    });
  });

  const pullIds = new Set();
  ranked.forEach(({ exId, sessions }) => {
    if (isVerticalPullExercise(exId, getExerciseNameById, { id: exId })) pullIds.add(exId);
  });
  if (pullIds.size >= 2) {
    let totalPull = 0;
    let days = new Set();
    pullIds.forEach((id) => {
      const s = findExerciseSessions(byEx, id);
      s.forEach((x) => {
        totalPull += x.reps;
        days.add(x.date);
      });
    });
    if (totalPull >= 80) {
      out.push({
        id: 'prog.pullups.aggregate',
        signal: 'pullups.volume_period',
        weight: 62 + Math.min(10, totalPull / 100),
        text: `Tirage vertical (toutes variantes) : ~${Math.round(totalPull)} reps sur ${days.size} j. — le volume est là ; la progression par séance dépend du type de traction coché.`
      });
    }
  }

  return out;
}

function buildRecoveryInsights(enrichment, assessment, snapshot, window, garminPartial) {
  const out = [];
  const g = enrichment?.garmin;
  const sleep14Stats = computeGarminSleepAverage(
    garminPartial,
    DateHelper.addDays(window?.end || DateHelper.getTodayLocal(), -13),
    window?.end || DateHelper.getTodayLocal()
  );
  const sleep14 = enrichment?.sleepDaily?.slice(-14) || [];
  const sleepVals = sleep14.map((d) => d.value).filter((h) => h > 0);
  const avgSleep14 =
    sleep14Stats?.avgHours ??
    (sleepVals.length ? sleepVals.reduce((a, b) => a + b, 0) / sleepVals.length : g?.avgSleepHours);

  const dm = garminPartial?.dailyMetrics;
  const gStats = garminStatsForWindow(dm, window);

  if (avgSleep14 != null && avgSleep14 < 6.5 && (assessment?.totalReps28 || 0) > 50) {
    out.push({
      id: 'sleep.low',
      signal: 'sleep.average',
      weight: 62,
      text: `Sommeil ~${avgSleep14.toFixed(1)} h/j (Garmin, ${sleep14Stats?.sampleDays ?? sleepVals.length} nuit(s) mesurée(s)) malgré l’activité — risque de plafonnement à moyen terme.`
    });
  } else if (avgSleep14 != null && avgSleep14 >= 7.3) {
    out.push({
      id: 'sleep.good',
      signal: 'sleep.average',
      weight: 56,
      text: `Sommeil ~${avgSleep14.toFixed(1)} h/j (Garmin, ${sleep14Stats?.sampleDays ?? sleepVals.length} nuit(s)) — bon matelas pour progresser sur le plan actuel.`
    });
  }

  const load = acuteChronicRepsRatio(snapshot, window);
  if (load?.ratio != null && load.chronicWeekly >= 25) {
    if (load.ratio >= 1.28) {
      const pct = Math.round((load.ratio - 1) * 100);
      out.push({
        id: 'load.acute',
        signal: 'load.acute_chronic',
        weight: 60 + Math.min(8, pct / 8),
        text: `Charge aiguë reps +${pct} % vs le mois — vigilance ${magnitudeWord(pct)} si ça dure.`
      });
    } else if (load.ratio <= 0.72) {
      out.push({
        id: 'load.low',
        signal: 'load.acute_chronic',
        weight: 55,
        text: 'Volume reps sous ta moyenne mensuelle — fenêtre de récup ou reprise progressive possible.'
      });
    }
  }

  if (gStats?.avgStress28 != null && gStats.avgStress28 >= 48) {
    out.push({
      id: 'stress.high',
      signal: 'stress.garmin',
      weight: 58,
      text: `Stress Garmin ~${gStats.avgStress28}/100 — priorise récup et séances courtes si la fatigue monte.`
    });
  } else if (gStats?.avgStress28 != null && gStats.avgStress28 <= 32 && gStats.stressSampleDays >= 4) {
    out.push({
      id: 'stress.low',
      signal: 'stress.garmin',
      weight: 50,
      text: `Stress Garmin contenu (~${gStats.avgStress28}/100) — marge de récupération pour absorber du volume.`
    });
  }

  return out;
}

function buildRunningHrInsight(snapshot, garminData, window) {
  if (!window?.start || !window?.end) return null;
  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  const stored = snapshot?.enduranceData?.sessions?.running || [];
  const merged = mergeRunningSessionsWithGarmin(stored, garminById);
  if (!merged.length) return null;

  const rows = buildRunningSessionRows(merged, garminById).filter(
    (r) =>
      r.date >= window.start &&
      r.date <= window.end &&
      r.avgHR != null &&
      r.dist >= 3 &&
      r.pace != null
  );
  if (rows.length < 4) return null;

  rows.sort((a, b) => a.date.localeCompare(b.date));
  const mid = Math.floor(rows.length / 2);
  const early = rows.slice(0, mid);
  const late = rows.slice(mid);
  const avgHrEarly = early.reduce((s, r) => s + r.avgHR, 0) / early.length;
  const avgHrLate = late.reduce((s, r) => s + r.avgHR, 0) / late.length;
  const avgPaceEarly = early.reduce((s, r) => s + r.pace, 0) / early.length;
  const avgPaceLate = late.reduce((s, r) => s + r.pace, 0) / late.length;

  if (avgHrLate < avgHrEarly - 3 && Math.abs(avgPaceLate - avgPaceEarly) < 0.8) {
    return {
      id: 'hr.ef.improve',
      signal: 'running.hr_efficiency',
      weight: 65,
      text: 'Tes sorties d’endurance fondamentale montrent une FC moyenne plus basse à allure équivalente — meilleure efficacité cardiovasculaire.'
    };
  }
  return null;
}

function buildTrendInsights(snapshot, window, enrichment, garminPartial, assessment, garminData, ctx = {}) {
  const out = [];
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  const endYmd = window?.end || DateHelper.getTodayLocal();
  const windowStart = window?.start ?? null;

  let pullSessions = [];
  for (const id of ['101', '501', 101, 501]) {
    const s = findExerciseSessions(byEx, id);
    if (s.length > pullSessions.length) pullSessions = s;
  }

  if (pullSessions.length >= 3) {
    const weekBuckets = [[], [], [], []];
    pullSessions.forEach((s) => {
      const daysAgo = DateHelper.daysBetween(s.date, endYmd);
      if (daysAgo == null || daysAgo < 0) return;
      const wi = Math.min(3, Math.floor(daysAgo / 7));
      weekBuckets[3 - wi].push(s.reps);
    });

    const runningDays = new Set();
    (enrichment?.digest?.perActivity?.running?.sessions || []).forEach((s) => {
      const d = s?.dateYmd || s?.date;
      if (d) runningDays.add(String(d).slice(0, 10));
    });

    let efWeeks = 0;
    weekBuckets.forEach((bucket, wi) => {
      if (bucket.length < 2) return;
      const weekStart = DateHelper.addDays(endYmd, -(wi + 1) * 7);
      const weekEnd = DateHelper.addDays(endYmd, -wi * 7);
      let runsInWeek = 0;
      runningDays.forEach((d) => {
        if (d >= weekStart && d <= weekEnd) runsInWeek += 1;
      });
      if (runsInWeek >= 2 && Math.max(...bucket) > Math.min(...bucket)) efWeeks += 1;
    });
    if (efWeeks >= 2) {
      out.push({
        id: 'trend.ef.pull',
        signal: 'pullups.correlation_running',
        weight: 64,
        text: 'Tes semaines avec ≥2 sorties course coïncident avec de meilleures variations aux tractions — couplage cardio / tirage favorable.'
      });
    }
  }

  const sleepDaily = enrichment?.sleepDaily || [];
  const fb = enrichment?.feedback;
  if (sleepDaily.length >= 10 && fb?.count >= 3) {
    const lowSleepWeeks = new Set();
    for (let w = 0; w < 4; w += 1) {
      const slice = sleepDaily.slice(-14 - w * 7, -w * 7 || undefined);
      const vals = slice.map((d) => d.value).filter((h) => h > 0);
      if (vals.length >= 3 && vals.reduce((a, b) => a + b, 0) / vals.length < 7) lowSleepWeeks.add(w);
    }
    if (lowSleepWeeks.size >= 2) {
      out.push({
        id: 'trend.sleep.push',
        signal: 'sleep.correlation_push',
        weight: 60,
        text: 'Semaines < 7 h sommeil en moyenne : les feedbacks séance poussée sont souvent plus durs — le sommeil semble un levier clé.'
      });
    }
  }

  const dm = garminPartial?.dailyMetrics;
  const gStats = garminStatsForWindow(dm, window);
  if (
    gStats?.weekStepsTrendConfident &&
    gStats.weekStepsCurrent > (gStats.avgPriorWeeksSteps || 0) * 1.05 &&
    (assessment?.repsMomentumRatio || 0) >= 1.05
  ) {
    out.push({
      id: 'trend.steps.training',
      signal: 'steps.correlation_training',
      weight: 62,
      text: 'Pas Garmin et volume street montent ensemble cette semaine — cohérence activité globale / plan.'
    });
  }

  if (gStats?.weekStepsTrendConfident && gStats.avgPriorWeeksSteps > 0) {
    const chg = pctChange(gStats.weekStepsCurrent, gStats.avgPriorWeeksSteps);
    if (chg != null && Math.abs(chg) >= 8) {
      out.push({
        id: chg > 0 ? 'trend.steps.up' : 'trend.steps.down',
        signal: 'steps.weekly_trend',
        weight: 56,
        text:
          chg > 0
            ? `Pas Garmin en hausse ${magnitudeWord(chg)} (~${Math.round(chg)} % vs semaines précédentes) — NEAT en progression.`
            : `Pas Garmin en baisse ${magnitudeWord(Math.abs(chg))} — semaine plus sédentaire hors séances.`
      });
    }
  }

  const challenges = enrichment?.digest?.challenges || [];
  const completed = challenges.filter((c) => c?.status === 'completed');
  if (completed.length >= 1) {
    out.push({
      id: 'trend.challenge.done',
      signal: 'challenges.completed',
      weight: 63,
      text: `${completed.length} défi(s) validé(s) sur la période — capacité à tenir des objectifs ciblés en parallèle du programme.`
    });
  }

  const per = enrichment?.digest?.perActivity || {};
  enrichment?.activeChallenges?.slice(0, 2).forEach((ch, i) => {
    const prog = challengeProgressPct(ch, snapshot, per);
    if (prog != null && prog >= 35 && prog < 100) {
      out.push({
        id: `trend.challenge.active.${i}`,
        signal: `challenges.active.${ch?.id ?? i}`,
        weight: 55 + Math.min(10, prog / 10),
        text: challengeInsightText(ch, prog)
      });
    }
  });

  const weekCmp = compareExoCompletionWeekBlocks(snapshot, endYmd, windowStart, ctx);
  if (weekCmp) {
    const chg = pctChange(weekCmp.recentPct, weekCmp.priorPct);
    if (chg != null && Math.abs(chg) >= 6) {
      out.push({
        id: chg > 0 ? 'trend.completion.up' : 'trend.completion.down',
        signal: 'completion.trend',
        weight: 58,
        text:
          chg > 0
            ? `Complétion exos en hausse ${magnitudeWord(chg)} sur la dernière semaine (~${Math.round(weekCmp.recentPct)} % vs ~${Math.round(weekCmp.priorPct)} %).`
            : `Complétion exos en baisse ${magnitudeWord(Math.abs(chg))} cette semaine (~${Math.round(weekCmp.recentPct)} % vs ~${Math.round(weekCmp.priorPct)} %).`
      });
    }
  }

  if (fb?.difficulte != null && fb.count >= 4) {
    if (fb.difficulte >= 7.5) {
      out.push({
        id: 'trend.feedback.hard',
        signal: 'feedback.difficulty_high',
        weight: 57,
        text: `Difficulté ressentie ~${fb.difficulte}/10 en moyenne — les séances coûtent ; une semaine allégée peut relancer la qualité.`
      });
    } else if (fb.difficulte <= 4.5) {
      out.push({
        id: 'trend.feedback.easy',
        signal: 'feedback.difficulty_low',
        weight: 52,
        text: `Difficulté ~${fb.difficulte}/10 — marge pour monter progressivement charge ou viser des records.`
      });
    }
  }

  if (fb?.motivation != null && fb.count >= 4 && fb.motivation <= 5.5) {
    out.push({
      id: 'trend.feedback.motivation',
      signal: 'feedback.motivation_low',
      weight: 54,
      text: `Motivation feedback ~${fb.motivation}/10 — simplifier le plan (moins d’exos, séances courtes) peut relancer l’adhérence.`
    });
  }

  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  const stored = snapshot?.enduranceData?.sessions?.running || [];
  const merged = mergeRunningSessionsWithGarmin(stored, garminById);
  if (merged.length >= 3 && window?.start) {
    const rows = buildRunningSessionRows(merged, garminById).filter(
      (r) => r.date >= window.start && r.date <= window.end && r.dist >= 1
    );
    const recentKm = rows
      .filter((r) => DateHelper.daysBetween(r.date, endYmd) != null && DateHelper.daysBetween(r.date, endYmd) <= 6)
      .reduce((s, r) => s + r.dist, 0);
    const priorKm = rows
      .filter((r) => {
        const d = DateHelper.daysBetween(r.date, endYmd);
        return d != null && d >= 7 && d <= 13;
      })
      .reduce((s, r) => s + r.dist, 0);
    if (priorKm >= 3) {
      const chg = pctChange(recentKm, priorKm);
      if (chg != null && Math.abs(chg) >= 15) {
        out.push({
          id: chg > 0 ? 'trend.run.week.up' : 'trend.run.week.down',
          signal: 'running.volume_trend',
          weight: 59,
          text:
            chg > 0
              ? `Course : semaine en cours +${Math.round(chg)} % en km vs la précédente (~${recentKm.toFixed(1)} km).`
              : `Course : semaine en cours −${Math.round(Math.abs(chg))} % en km — baisse ${magnitudeWord(Math.abs(chg))} du volume.`
        });
      }
    }
  }

  if ((enrichment?.circuits?.totalRounds || 0) >= 10 && pullSessions.length >= 4) {
    out.push({
      id: 'trend.circuits.density',
      signal: 'circuits.volume',
      weight: 52,
      text: `${enrichment.circuits.totalRounds} tours circuits sur ${enrichment.circuits.activeDays} j. — densité cardio/muscu à intégrer dans la récup si tu enchaînes avec du street lourd.`
    });
  }

  return out;
}

function buildCompliments(baseAnalysis, assessment, enrichment, snapshot) {
  const out = [];
  const adherence = baseAnalysis?.adherence?.adherencePct;
  if (adherence != null && adherence >= 85) {
    out.push({
      id: 'compl.adherence',
      signal: 'adherence.global',
      weight: 62,
      text: `Très bon travail sur la régularité : ~${adherence} % du planning respecté sur la période active.`
    });
  }

  const comp = enrichment?.completion?.exoPct;
  if (comp != null && comp >= 80) {
    out.push({
      id: 'compl.completion',
      signal: 'adherence.global',
      weight: 60,
      text: `Adhérence exos ~${comp} % sur la période — la constance bat le volume ponctuel.`
    });
  }

  const cardioMin = enrichment?.digest?.perActivity?.running?.totals?.minutes || 0;
  const strengthReps = assessment?.totalReps28 || 0;
  if (cardioMin >= 60 && strengthReps >= 400) {
    out.push({
      id: 'compl.cardio.strength',
      signal: 'cardio.strength_balance',
      weight: 58,
      text: 'Équilibre cardio / renforcement cohérent pour un développement athlétique global.'
    });
  }

  const challenges = enrichment?.digest?.challenges || [];
  const completed = challenges.filter((c) => c?.status === 'completed');
  if (completed.length >= 1) {
    out.push({
      id: 'compl.challenge',
      signal: 'challenges.progress',
      weight: 60,
      text: `${completed.length} défi(s) endurance validé(s) — objectifs ciblés tenus en parallèle du street.`
    });
  }

  const per = enrichment?.digest?.perActivity || {};
  enrichment?.activeChallenges?.slice(0, 2).forEach((ch, i) => {
    const prog = challengeProgressPct(ch, snapshot, per);
    if (prog != null && prog >= 75 && prog < 100) {
      out.push({
        id: `compl.challenge.near.${i}`,
        signal: `challenges.active.${ch?.id ?? i}`,
        weight: 58,
        text: `Défi « ${ch.title || ch.name || 'actif'} » à ~${prog} % — la ligne d’arrivée est proche.`
      });
    }
  });

  const g = enrichment?.garmin;
  if (g?.avgSteps != null && g.avgSteps >= 8500 && g.daysWithSteps >= 5) {
    out.push({
      id: 'compl.steps',
      signal: 'steps.daily_high',
      weight: 55,
      text: `Activité quotidienne élevée (~${Math.round(g.avgSteps).toLocaleString('fr-FR')} pas/j Garmin) — NEAT favorable à la récup.`
    });
  }

  const stretch = enrichment?.stretchZones;
  if (stretch?.total >= 12) {
    out.push({
      id: 'compl.stretch',
      text: `${stretch.total} étirements cochés sur la période — rarement aussi suivi ; ça limite les raideurs invisibles qui freinent tractions et épaules.`
    });
  }

  if (enrichment?.streak?.current >= 5) {
    out.push({
      id: 'compl.streak',
      signal: 'streak.current',
      weight: 56 + Math.min(10, enrichment.streak.current / 2),
      text: `Série de ${enrichment.streak.current} j. consécutifs d’entraînement — régularité sous-estimée comme levier de progrès.`
    });
  }

  return out;
}

function buildRecommendations(structural, muscleVol, exposure, pushPull, answers, enrichment, snapshot) {
  const out = [];
  const ratio = pushPull.pull > 0 ? pushPull.push / pushPull.pull : 0;
  if (ratio >= 1.75) {
    out.push({
      id: 'rec.rowing',
      text: `Ton volume hebdomadaire de poussée est ~${ratio.toFixed(1)}× supérieur au tirage. Ajouter 3–4 séries de rowing ou tirage horizontal par semaine pourrait améliorer l’équilibre et favoriser tes progrès aux tractions.`
    });
  }

  const street = resolveStreetSkillPlan(answers || {});
  const pullWeeklyActual = exposure.pullupDaysWeeklyActual || 0;
  const pullWeeklyPlan = exposure.pullupDaysPlan ?? exposure.pullupDays ?? 0;
  if (
    (street.skillId === 'pullups_10' || street.skillId === 'pullups_20') &&
    pullWeeklyActual <= 2 &&
    pullWeeklyPlan <= 2 &&
    (exposure.pullupRepsActual || 0) < 60
  ) {
    out.push({
      id: 'rec.pull.freq',
      text: `Pour « ${street.labelFr} », vise une 3ᵉ exposition tractions (GTG ou séance dédiée courte) plutôt que d’ajouter du volume pompes — la fréquence spécifique compte plus que le volume général.`
    });
  }

  const backVol = muscleVol[MuscleGroups.BACK] || 0;
  const chestVol = muscleVol[MuscleGroups.CHEST] || 0;
  if (backVol > 0 && chestVol > backVol * 1.8) {
    out.push({
      id: 'rec.back',
      text: 'Le plan penche fortement côté poussée thoracique : une séance dos (tirage vertical + horizontal) stabiliserait l’épaule et la posture.'
    });
  }

  const stretchPct = enrichment?.completion?.stretchPct;
  if (stretchPct != null && stretchPct < 45 && (enrichment?.completion?.stretchTotal || 0) >= 5) {
    out.push({
      id: 'rec.stretch',
      text: `Étirements cochés ~${stretchPct} % quand tu t’entraînes — 2 min post-séance sur les zones dominantes (${enrichment?.stretchZones?.rows?.[0]?.zone || 'dos/épaules'}) peut débloquer des reps « gratuites » aux tractions.`
    });
  }

  const per = enrichment?.digest?.perActivity || {};
  enrichment?.activeChallenges?.slice(0, 1).forEach((ch) => {
    const prog = challengeProgressPct(ch, snapshot, per);
    if (prog != null && prog < 40 && ch.endDate) {
      const daysLeft = DateHelper.daysBetween(DateHelper.getTodayLocal(), ch.endDate);
      if (daysLeft != null && daysLeft <= 14 && daysLeft >= 0) {
        out.push({
          id: 'rec.challenge.urgent',
          text: `Défi « ${ch.title || ch.name || 'actif'} » ~${prog} % avec échéance proche — une séance dédiée cette semaine vaut mieux qu’attendre la fin du mois.`
        });
      }
    }
  });

  const runKm = enrichment?.digest?.perActivity?.running?.totals?.distanceKm || 0;
  if (runKm > 0 && runKm < 8 && exposure.legDays <= 1) {
    out.push({
      id: 'rec.run.legs',
      text: 'Peu de jambes au plan et faible volume course — une sortie facile 20–30 min complète le street sans ajouter de charge poussée/tirage.'
    });
  }

  if ((enrichment?.circuits?.totalRounds || 0) >= 20 && (enrichment?.garmin?.avgSleepHours || 99) < 6.8) {
    out.push({
      id: 'rec.circuit.recovery',
      text: 'Volume circuits élevé + sommeil Garmin modeste — alterne une semaine allégée circuits ou GTG léger pour laisser le système nerveux respirer.'
    });
  }

  return out;
}

/**
 * @returns {object|null}
 */
export function buildRecapProgramCoachAnalysis(opts = {}) {
  const {
    activeProgram = null,
    snapshot = {},
    window = null,
    enrichment = null,
    assessment = null,
    recapState = null,
    garminPartial = null,
    garminData = null,
    getExerciseNameById = null,
    profileQuestionnaireRaw = null,
    programs = [],
    getTodayWorkout = null,
    isAdmin = false,
    isAuthenticated = false
  } = opts;

  const qq = normalizeProfileQuestionnaire(profileQuestionnaireRaw);
  const answers = qq.answers || {};

  const ctx = {
    programs,
    activeProgram,
    getTodayWorkout,
    isAdmin,
    isAuthenticated,
    alignWithCalendar: true
  };

  const baseAnalysis = activeProgram
    ? analyzeProgramForCoach(activeProgram, snapshot, getExerciseNameById, answers)
    : null;

  const muscleVol = activeProgram ? scanProgramMuscleVolume(activeProgram) : {};
  const planExposure = activeProgram
    ? scanWeeklyMovementExposure(activeProgram, getExerciseNameById)
    : {};
  const actualExposure = scanActualMovementExposure(snapshot, window, getExerciseNameById);
  const exposure = mergeMovementExposure(planExposure, actualExposure);
  const pushPull = {
    push: sumGroupVolume(muscleVol, PUSH_GROUPS),
    pull: sumGroupVolume(muscleVol, PULL_GROUPS),
    legs: sumGroupVolume(muscleVol, LEG_GROUPS)
  };

  const structural = buildStructuralInsights(
    activeProgram,
    answers,
    muscleVol,
    exposure,
    pushPull,
    enrichment
  );
  const rawLevels = {
    structural,
    progression: buildProgressionInsights(
      snapshot,
      window,
      getExerciseNameById,
      activeProgram,
      assessment,
      enrichment
    ),
    recovery: (() => {
      const rec = buildRecoveryInsights(enrichment, assessment, snapshot, window, garminPartial);
      const hrInsight = buildRunningHrInsight(snapshot, garminData, window);
      if (hrInsight) rec.push(hrInsight);
      return rec;
    })(),
    trends: buildTrendInsights(
      snapshot,
      window,
      enrichment,
      garminPartial,
      assessment,
      garminData,
      ctx
    ),
    compliments: buildCompliments(baseAnalysis, assessment, enrichment, snapshot),
    recommendations: buildRecommendations(
      structural,
      muscleVol,
      exposure,
      pushPull,
      answers,
      enrichment,
      snapshot
    )
  };

  const levels = balanceCoachProgramLevels(rawLevels);

  const coachVisionReport = buildCoachVisionReport({
    activeProgram,
    snapshot,
    window,
    enrichment,
    assessment,
    garminPartial,
    garminData,
    getExerciseNameById,
    profileQuestionnaireRaw,
    programs,
    getTodayWorkout,
    isAdmin,
    isAuthenticated,
    recapState
  });

  const coachVision = coachVisionReport.text;

  const muscleShareRows = Object.entries(muscleVol)
    .filter(([g, v]) => v > 0 && g !== MuscleGroups.FULL_BODY)
    .sort((a, b) => b[1] - a[1])
    .map(([groupId, volume]) => ({
      groupId,
      label: MUSCLE_LABEL_FR[groupId] || groupId,
      volume: Math.round(volume)
    }));

  return {
    hasProgram: Boolean(activeProgram?.schedule),
    programName: activeProgram?.name || null,
    baseAnalysis,
    muscleShareRows,
    pushPullRatio: pushPull.pull > 0 ? Math.round((pushPull.push / pushPull.pull) * 10) / 10 : null,
    exposure,
    levels,
    coachVision,
    coachVisionReport
  };
}
