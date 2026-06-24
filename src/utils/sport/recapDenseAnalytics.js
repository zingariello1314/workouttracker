/**
 * Analytics denses pour Récap > Analyse (Vision Coach + Structure).
 * Régularité exos, charge hebdo, reps jambes, tirage vertical, défis, snippets narratifs.
 */

import DateHelper from '../dateHelper';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { getDailyLiftVolumeKgMap } from '../../services/sport/VolumeAnalyticsService';
import { computeProgressionInsights } from './volumeProgressionEngine';
import { applyTrainingIntentToInsights } from './trainingIntentClassifier';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { collectCheckedExerciseRepHistory } from './recapAdaptiveInsights';
import { isStructuralLegExercise } from './recapMovementClassification';
import {
  exerciseMovementBlob,
  isVerticalPullExercise,
  challengeProgressPct,
  pctChange,
  weeklyRateFromSessionDays
} from './recapInsightHelpers';
import { computeLeastCheckedExercises } from './leastCheckedExercises';
import { summarizeGtgWindow } from '../../services/endurance/gtgService';
import { coachSleepHours } from './recapCrossCoachAggregate';
import { isGarminWalkingLikeActivity } from '../garminRunningLaps';
import { activityDurationMin } from '../calendarGarminDayRecap';
import { resolveRunningPeriodStats } from './runningVolumeTruth';

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function weekKeyFromYmd(ymd) {
  const d = new Date(`${ymd}T12:00:00`);
  if (Number.isNaN(d.getTime())) return ymd?.slice(0, 7) || '';
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return DateHelper.toYYYYMMDD(d);
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

/** Reps jambes sur la fenêtre (groupes musculaires). */
export function sumLegRepsFromRecapState(recapState) {
  const share = recapState?.repShareByGroup || {};
  return Math.round(
    (share[MuscleGroups.QUADS] || 0) +
      (share[MuscleGroups.HAMSTRINGS] || 0) +
      (share[MuscleGroups.CALVES] || 0) +
      (share[MuscleGroups.TIBIALIS_ANTERIOR] || 0)
  );
}

/** kg×reps par semaine calendaire (lundi) sur la fenêtre. */
export function computeWeeklyLoadStats(snapshot, window) {
  if (!window?.start || !window?.end) return null;
  const liftMap = getDailyLiftVolumeKgMap(snapshot);
  const byWeek = new Map();
  liftMap.forEach((vol, dateStr) => {
    if (!isDateInRecapWindow(dateStr, window) || vol <= 0) return;
    const wk = weekKeyFromYmd(dateStr);
    byWeek.set(wk, (byWeek.get(wk) || 0) + vol);
  });
  const weeks = [...byWeek.keys()].sort();
  if (!weeks.length) {
    return { avgKgRepsPerWeek: 0, weekCount: 0, recentWeekKgReps: 0, priorWeekKgReps: 0, pctChange: null };
  }
  const values = weeks.map((w) => byWeek.get(w) || 0);
  const total = values.reduce((a, b) => a + b, 0);
  const recent = values[values.length - 1] || 0;
  const prior = values.length >= 2 ? values[values.length - 2] : null;
  return {
    avgKgRepsPerWeek: round1(total / weeks.length),
    weekCount: weeks.length,
    recentWeekKgReps: round1(recent),
    priorWeekKgReps: prior != null ? round1(prior) : null,
    pctChange: prior != null && prior > 0 ? round1(pctChange(recent, prior)) : null,
    totalKgReps: round1(total)
  };
}

/** Exercices les plus régulièrement cochés (≥2 séances planifiées). */
export function computeMostRegularExercises(snapshot, window, ctx = {}, limit = 5, getExerciseNameById) {
  const least = computeLeastCheckedExercises(snapshot, window, ctx, 80);
  return least
    .filter((row) => row.planned >= 2 && row.checked >= 1)
    .map((row) => ({
      ...row,
      name: row.name || exerciseDisplayName(row.id, getExerciseNameById),
      regularityPct: row.planned > 0 ? round1((row.checked / row.planned) * 100) : 0
    }))
    .sort((a, b) => {
      if (b.regularityPct !== a.regularityPct) return b.regularityPct - a.regularityPct;
      return b.checked - a.checked;
    })
    .slice(0, limit);
}

/** Tirage vertical : reps cumulées + séances. */
export function computeVerticalPullStats(snapshot, window, getExerciseNameById) {
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  let totalReps = 0;
  let sessions = 0;
  let topEx = null;
  let topReps = 0;

  for (const [exId, sessionsList] of byEx) {
    const exLike = { id: exId };
    const blob = exerciseMovementBlob(exLike, getExerciseNameById);
    const isVert =
      isVerticalPullExercise(exId, getExerciseNameById, exLike) ||
      (/traction|pull[- ]?up|chin[- ]?up|australien/.test(blob) && !/d[ée]velopp|bench/.test(blob));
    if (!isVert) continue;
    const reps = sessionsList.reduce((a, s) => a + (s.reps || 0), 0);
    if (reps <= 0) continue;
    totalReps += reps;
    sessions += sessionsList.length;
    if (reps > topReps) {
      topReps = reps;
      topEx = exerciseDisplayName(exId, getExerciseNameById);
    }
  }

  return { totalReps, sessions, topExercise: topEx, topReps };
}

/** Exposition réelle jambes (coches) — reps + jours séance. */
export function scanActualLegExposure(snapshot, window, getExerciseNameById) {
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  const legDates = new Set();
  let legReps = 0;

  for (const [exId, sessions] of byEx) {
    const exLike = { id: exId };
    const blob = exerciseMovementBlob(exLike, getExerciseNameById);
    const isLeg =
      isStructuralLegExercise(exLike, getExerciseNameById) || STRUCTURAL_LEG_FALLBACK.test(blob);
    if (!isLeg) continue;
    sessions.forEach((s) => {
      legDates.add(s.date);
      legReps += s.reps || 0;
    });
  }

  return {
    legRepsChecked: legReps,
    legSessionDays: legDates.size,
    legDaysWeeklyActual: weeklyRateFromSessionDays(legDates.size, window)
  };
}

const STRUCTURAL_LEG_FALLBACK =
  /squat|fente|presse|leg curl|leg extension|hack squat|hip thrust|soulevé|good morning|mollet/i;

function parseGarminActivityDate(act) {
  const raw = act?.date || act?.startTimeLocal || act?.startTime;
  if (!raw) return null;
  const d = String(raw).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null;
}

function categorizeGarminActivity(act, bucket) {
  if (isGarminWalkingLikeActivity(act)) return null;
  const gTk = String(act?.garminTypeKey || act?.activityType || '').toLowerCase();
  const dTk = String(act?.displayActivityType || act?.type || '').toLowerCase();
  const title = String(act?.activityName || act?.name || '').toLowerCase();
  const blob = `${gTk} ${dTk} ${title}`;

  if (bucket === 'swimming' || /swim|natation/.test(blob)) return 'swimming';
  if (bucket === 'jumpRope' || act?.jumps > 0 || /jump rope|corde/.test(blob)) return 'jumpRope';
  if (/strength|muscu|renfo|haltère|street work|hiit|training/.test(blob)) return 'strength';
  if (/cycl|bike|vélo|velo|spin/.test(blob)) return 'cycling';
  if (/box|elliptic|row|ski|stair|cardio|run|trail/.test(blob)) return 'cardio';
  if (bucket === 'cardio') return 'cardio';
  return 'other';
}

/** Activités Garmin hors marche sur la fenêtre (calendrier). */
export function computeGarminCalendarSummary(garminData, window) {
  if (!garminData?.activities || !window?.start || !window?.end) return null;

  const byCategory = { swimming: 0, jumpRope: 0, strength: 0, cycling: 0, cardio: 0, other: 0 };
  let totalMinutes = 0;
  let totalSessions = 0;

  const ingest = (list, bucket) => {
    (list || []).forEach((act) => {
      const d = parseGarminActivityDate(act);
      if (!d || d < window.start || d > window.end) return;
      const cat = categorizeGarminActivity(act, bucket);
      if (!cat) return;
      byCategory[cat] = (byCategory[cat] || 0) + 1;
      totalSessions += 1;
      totalMinutes += activityDurationMin(act) || 0;
    });
  };

  ingest(garminData.activities.cardio, 'cardio');
  ingest(garminData.activities.swimming, 'swimming');
  ingest(garminData.activities.jumpRope, 'jumpRope');

  if (totalSessions === 0) return null;

  const lines = [];
  if (byCategory.swimming > 0) lines.push(`${byCategory.swimming} natation`);
  if (byCategory.strength > 0) lines.push(`${byCategory.strength} force/muscu`);
  if (byCategory.cycling > 0) lines.push(`${byCategory.cycling} vélo`);
  if (byCategory.jumpRope > 0) lines.push(`${byCategory.jumpRope} corde`);
  if (byCategory.cardio > 0) lines.push(`${byCategory.cardio} cardio/course`);
  if (byCategory.other > 0) lines.push(`${byCategory.other} autre`);

  return {
    byCategory,
    totalSessions,
    totalMinutes: Math.round(totalMinutes),
    summaryLine: lines.join(' · ')
  };
}

/** Corrélation sommeil court → baisse reps (Garmin + historique exos). */
export function computeSleepRepCorrelations(snapshot, window, garminPartial, getExerciseNameById) {
  const dm = garminPartial?.dailyMetrics;
  if (!dm || !window?.start || !window?.end) return [];

  const sleepByDate = new Map();
  Object.entries(dm).forEach(([d, day]) => {
    if (d < window.start || d > window.end) return;
    const h = coachSleepHours(day?.sleep);
    if (h != null && h > 0 && h <= 24) sleepByDate.set(d, h);
  });
  if (sleepByDate.size < 5) return [];

  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  const insights = [];

  for (const [exId, sessions] of byEx) {
    if (sessions.length < 4) continue;
    let shortSum = 0;
    let shortN = 0;
    let okSum = 0;
    let okN = 0;
    sessions.forEach((s) => {
      const sleep = sleepByDate.get(s.date);
      if (sleep == null) return;
      if (sleep < 6.5) {
        shortSum += s.reps || 0;
        shortN += 1;
      } else if (sleep >= 7) {
        okSum += s.reps || 0;
        okN += 1;
      }
    });
    if (shortN < 2 || okN < 2) continue;
    const shortAvg = shortSum / shortN;
    const okAvg = okSum / okN;
    if (okAvg <= 0) continue;
    const dropPct = ((okAvg - shortAvg) / okAvg) * 100;
    if (dropPct >= 10) {
      insights.push({
        exerciseId: exId,
        name: exerciseDisplayName(exId, getExerciseNameById),
        shortAvg: round1(shortAvg),
        okAvg: round1(okAvg),
        dropPct: round1(dropPct),
        shortSessions: shortN,
        okSessions: okN
      });
    }
  }

  return insights.sort((a, b) => b.dropPct - a.dropPct).slice(0, 3);
}

/** Défis endurance avec progression sur la fenêtre. */
export function buildChallengeDetailRows(snapshot, enrichment) {
  const all = [
    ...(enrichment?.digest?.challenges || []),
    ...(enrichment?.activeChallenges || [])
  ];
  const seen = new Set();
  const per = enrichment?.digest?.perActivity || {};

  return all
    .filter((ch) => {
      const id = ch?.id ?? ch?.title;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((ch) => {
      const prog = challengeProgressPct(ch, snapshot, per);
      return {
        id: ch.id || ch.title,
        title: ch.title || ch.name || 'Défi',
        status: ch.status || 'active',
        progressPct: prog != null ? Math.min(100, Math.round(prog)) : null,
        type: ch.type || ch.activityType || null
      };
    })
    .sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (b.status === 'active' && a.status !== 'active') return 1;
      return (b.progressPct ?? 0) - (a.progressPct ?? 0);
    })
    .slice(0, 6);
}

function buildNarrativeSnippets(opts) {
  const {
    mostRegular = [],
    weeklyLoad = null,
    legRepsPlan = 0,
    legRepsChecked = 0,
    legWeeklyPlan = 0,
    legWeeklyActual = 0,
    verticalPull = null,
    enrichment = null,
    assessment = null,
    snapshot = null,
    window = null,
    getExerciseNameById = null,
    garminCalendar = null,
    sleepCorrelations = [],
    challengeRows = [],
    runningPeriod = null,
    progressionInsights = []
  } = opts;

  const snippets = { adherence: [], load: [], legs: [], endurance: [], recovery: [] };

  if (mostRegular.length >= 2) {
    snippets.adherence.push(
      `Exos les plus réguliers : ${mostRegular
        .slice(0, 3)
        .map((e) => `${e.name} (~${e.regularityPct} %)`)
        .join(', ')}.`
    );
  }

  const least = enrichment?.leastCheckedExercises?.[0];
  if (least?.name && least.pct != null && least.pct < 50) {
    snippets.adherence.push(
      `Point faible : ${least.name} (~${least.pct} % de complétion) — ça tire le score programme vers le bas.`
    );
  }

  if (weeklyLoad?.avgKgRepsPerWeek > 0) {
    let line = `Charge moyenne ~${Math.round(weeklyLoad.avgKgRepsPerWeek).toLocaleString('fr-FR')} kg×reps / semaine`;
    if (weeklyLoad.pctChange != null && Math.abs(weeklyLoad.pctChange) >= 8) {
      line +=
        weeklyLoad.pctChange > 0
          ? ` (+${Math.round(weeklyLoad.pctChange)} % vs semaine précédente)`
          : ` (${Math.round(weeklyLoad.pctChange)} % vs semaine précédente)`;
      if (weeklyLoad.pctChange >= 25) {
        line += ' — montée rapide : surveille la récup si tu ajoutes encore du volume';
      }
    }
    snippets.load.push(`${line}.`);
  }

  const topProgression = (progressionInsights || []).find(
    (p) => p.confidence >= 0.7 && p.explanation && p.progressionType !== 'neutral'
  );
  if (topProgression?.explanation) {
    const name = topProgression.exerciseName ? `${topProgression.exerciseName} : ` : '';
    snippets.load.push(`${name}${topProgression.explanation}.`);
  }

  const volSum = assessment?.volumeKgRepsSum28;
  if (volSum >= 500 && !snippets.load.length) {
    snippets.load.push(`Volume chargé période : ~${Math.round(volSum).toLocaleString('fr-FR')} kg×reps.`);
  }

  if (verticalPull?.totalReps >= 40) {
    snippets.load.push(
      `Tirage vertical : ~${verticalPull.totalReps} reps sur ${verticalPull.sessions} séance${verticalPull.sessions > 1 ? 's' : ''}${verticalPull.topExercise ? ` (${verticalPull.topExercise} dominant)` : ''}.`
    );
  }

  const effectiveLegReps = Math.max(legRepsPlan, legRepsChecked);
  if (effectiveLegReps >= 1) {
    let legLine = `Jambes : ${effectiveLegReps} reps cochées · ~${legWeeklyActual || legWeeklyPlan}/sem en pratique`;
    if (legWeeklyPlan >= 1) legLine += ` · plan ~${legWeeklyPlan} j./sem`;
    if (legWeeklyPlan >= 2 && legWeeklyActual < legWeeklyPlan * 0.7) {
      legLine += ' — en dessous du rythme prévu au plan, à remonter si tu vises l’équilibre bas du corps';
    } else if (legWeeklyActual >= legWeeklyPlan && legWeeklyPlan >= 1) {
      legLine += ' — fréquence alignée avec le plan';
    }
    snippets.legs.push(`${legLine}.`);
  } else if (legWeeklyPlan >= 1) {
    snippets.legs.push(
      `Plan jambes ~${legWeeklyPlan} j./sem — peu de reps jambes cochées sur la période ; le bas du corps reste sous-stimulé malgré l’intention du programme.`
    );
  }

  const runKm = runningPeriod?.distanceKm ?? 0;
  const runSessions = runningPeriod?.sessions ?? 0;
  if (runKm >= 5) {
    let runLine = `Course : ~${round1(runKm)} km (${runSessions} sortie${runSessions > 1 ? 's' : ''})`;
    if (runSessions >= 1) {
      const avgKm = round1(runKm / runSessions);
      runLine += ` — ~${avgKm} km/sortie en moyenne`;
      if (avgKm >= 5) runLine += ', volume cardio solide en parallèle du street';
      else if (runSessions >= 3) runLine += ', régularité cardio qui structure ta semaine';
    }
    snippets.endurance.push(`${runLine}.`);
  }

  const gtgEnd = window?.end || DateHelper.getTodayLocal();
  const gtgStart = window?.start || DateHelper.addDays(gtgEnd, -27);
  const gtgSum = summarizeGtgWindow(snapshot?.enduranceData?.gtg, gtgStart, gtgEnd, {
    getExerciseNameById
  });
  if (gtgSum.daysWithAny >= 3 && gtgSum.totalReps >= 20) {
    snippets.endurance.push(`GTG : ${gtgSum.daysWithAny} j. actifs · ~${gtgSum.totalReps} reps mini-séries.`);
  }

  const stretch = enrichment?.completion?.stretchPct;
  const exo = enrichment?.completion?.exoPct;
  if (stretch != null && exo != null && exo - stretch >= 20) {
    snippets.recovery.push(`Étirements ~${stretch} % vs exos ~${exo} % — marge de progrès récup.`);
  }

  if (sleepCorrelations.length >= 1) {
    const top = sleepCorrelations[0];
    snippets.recovery.push(
      `${top.name} : ~${top.shortAvg} reps après nuits courtes vs ~${top.okAvg} reps quand tu dors ≥7 h (−${top.dropPct} %) — le sommeil pèse sur ta perf.`
    );
  }

  if (garminCalendar?.summaryLine) {
    snippets.endurance.push(
      `Garmin calendrier : ${garminCalendar.totalSessions} activité(s) · ~${garminCalendar.totalMinutes} min (${garminCalendar.summaryLine}).`
    );
  }

  const activeChallenges = challengeRows.filter((c) => c.status === 'active' && c.progressPct != null);
  if (activeChallenges.length >= 1) {
    const bits = activeChallenges.slice(0, 3).map((c) => `« ${c.title} » ~${c.progressPct} %`);
    snippets.endurance.push(`Défis actifs : ${bits.join(' · ')}.`);
  }

  const completedCh = challengeRows.filter((c) => c.status === 'completed');
  if (completedCh.length >= 1) {
    snippets.endurance.push(`${completedCh.length} défi(s) validé(s) sur la période.`);
  }

  return snippets;
}

/**
 * @returns {object}
 */
export function buildRecapDenseAnalytics(opts = {}) {
  const {
    snapshot = {},
    window = null,
    recapState = null,
    enrichment = null,
    assessment = null,
    getExerciseNameById = null,
    activeProgram = null,
    ctx = {},
    garminPartial = null,
    garminData = null
  } = opts;

  const legRepsFromGroups = sumLegRepsFromRecapState(recapState);
  const actualLeg = scanActualLegExposure(snapshot, window, getExerciseNameById);
  const legReps = Math.max(legRepsFromGroups, actualLeg.legRepsChecked);
  const weeklyLoad = computeWeeklyLoadStats(snapshot, window);
  const mostRegular = computeMostRegularExercises(snapshot, window, { ...ctx, activeProgram }, 5, getExerciseNameById);
  const verticalPull = computeVerticalPullStats(snapshot, window, getExerciseNameById);
  const garminCalendar = computeGarminCalendarSummary(garminData, window);
  const sleepCorrelations = computeSleepRepCorrelations(snapshot, window, garminPartial, getExerciseNameById);
  const challengeRows = buildChallengeDetailRows(snapshot, enrichment);
  const runningPeriod = resolveRunningPeriodStats(snapshot, garminData, window);

  const rawProgressionInsights = computeProgressionInsights(snapshot, window, getExerciseNameById);
  const progressionInsights = applyTrainingIntentToInsights(rawProgressionInsights, snapshot);

  const exposure = enrichment?.movementExposure || {};
  const legWeeklyPlan = exposure.legDaysPlan ?? exposure.legDays ?? 0;
  const legWeeklyActual = actualLeg.legDaysWeeklyActual ?? exposure.legDaysWeeklyActual ?? 0;

  const narrativeSnippets = buildNarrativeSnippets({
    mostRegular,
    weeklyLoad,
    legRepsPlan: legRepsFromGroups,
    legRepsChecked: actualLeg.legRepsChecked,
    legWeeklyPlan,
    legWeeklyActual,
    verticalPull,
    enrichment,
    assessment,
    snapshot,
    window,
    getExerciseNameById,
    garminCalendar,
    sleepCorrelations,
    challengeRows,
    runningPeriod,
    progressionInsights
  });

  return {
    legReps,
    legSessionDays: actualLeg.legSessionDays,
    runningPeriod,
    legDaysWeeklyActual: legWeeklyActual,
    weeklyLoad,
    mostRegularExercises: mostRegular,
    verticalPull,
    narrativeSnippets,
    progressionInsights,
    actualLeg,
    garminCalendar,
    sleepCorrelations,
    challengeRows
  };
}
