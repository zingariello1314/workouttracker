/**
 * Prose Vision Coach dense — paragraphes fluides avec constat → implication → levier.
 * Remplace l’empilement de puces « Charge & performance : … · … · … ».
 */

import DateHelper from '../dateHelper';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { summarizeGtgWindow, normalizeGtgData } from '../../services/endurance/gtgService';
import { collectCheckedExerciseRepHistory } from './recapAdaptiveInsights';
import { computeGarminSleepAverage } from './recapCoachVision';
import {
  computeMonthCoachSnapshot,
  findBestMonthFromMonths,
  monthLabelFr,
  buildMonthlyCoachStats,
  relevantMonthCutoff
} from './recapCoachVisionTemporal';
import { compareExoCompletionWeekBlocks } from './recapCompletionTruth';
import { resolveStreetSkillPlan } from '../../features/profileQuestionnaire/quizStreetSkillGoal';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { resolveRunningPeriodStats } from './runningVolumeTruth';

const WEEKDAY_FR = [
  'dimanche',
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi'
];

const MUSCLE_LABEL_FR = {
  [MuscleGroups.CHEST]: 'pectoraux',
  [MuscleGroups.BACK]: 'dos',
  [MuscleGroups.SHOULDERS]: 'épaules',
  [MuscleGroups.BICEPS]: 'biceps',
  [MuscleGroups.TRICEPS]: 'triceps',
  [MuscleGroups.QUADS]: 'quadriceps',
  [MuscleGroups.HAMSTRINGS]: 'ischio-jambiers',
  [MuscleGroups.CALVES]: 'mollets',
  [MuscleGroups.CORE]: 'abdominaux'
};

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
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

function findExercisesByPattern(byEx, pattern, getExerciseNameById) {
  const out = [];
  for (const [exId, sessions] of byEx) {
    const name = exerciseDisplayName(exId, getExerciseNameById);
    if (!pattern.test(name)) continue;
    if (!sessions?.length) continue;
    out.push({ exId, name, sessions });
  }
  return out.sort((a, b) => b.sessions.length - a.sessions.length);
}

function repTrendPhrase(sessions, limit = 3) {
  const tail = sessions.slice(-limit).map((s) => s.reps);
  if (tail.length < 2) return null;
  const first = sessions[0].reps;
  const last = tail[tail.length - 1];
  if (tail.length >= 3) {
    return `${tail.join(', ')} reps`;
  }
  if (last !== first) return `${first} → ${last} reps`;
  return `~${last} reps`;
}

function analyzeWeekdayRhythm(dayOfWeek) {
  const active = (dayOfWeek || []).filter((d) => d.plannedDays >= 2);
  if (active.length < 2) return null;
  const bySessions = [...active].sort((a, b) => b.plannedDays - a.plannedDays);
  const withPct = active.filter((d) => d.avgCompletionPct != null);
  if (withPct.length < 2) {
    return {
      bestDay: bySessions[0],
      weakDay: null,
      gap: null
    };
  }
  const bestPct = [...withPct].sort((a, b) => b.avgCompletionPct - a.avgCompletionPct)[0];
  const weakPct = [...withPct].sort((a, b) => a.avgCompletionPct - b.avgCompletionPct)[0];
  return {
    bestDay: bySessions[0],
    bestPct,
    weakPct,
    gap: bestPct.avgCompletionPct - weakPct.avgCompletionPct
  };
}

function priorMonthKey(mk) {
  const y = parseInt(mk.slice(0, 4), 10);
  const m = parseInt(mk.slice(5, 7), 10);
  if (m <= 1) return `${y - 1}-12`;
  return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function adherenceQualifier(pct) {
  if (pct >= 85) return 'solide';
  if (pct >= 75) return 'correcte';
  if (pct >= 60) return 'mitigée';
  return 'fragile';
}

function buildAdherenceParagraph(opts) {
  const {
    endYmd,
    periodComp,
    trainingDaysInPeriod,
    streak,
    enrichment,
    snapshot,
    windowStart,
    ctx,
    garminData,
    answers
  } = opts;

  const year = endYmd.slice(0, 4);
  const exoPct = periodComp?.exoPct;
  const parts = [];

  if (exoPct != null && trainingDaysInPeriod >= 1) {
    parts.push(
      `En ${year}, ton adhérence est ${adherenceQualifier(exoPct)} à ~${exoPct} % sur ${trainingDaysInPeriod} jours d'entraînement`
    );
  } else if (trainingDaysInPeriod >= 1) {
    parts.push(`En ${year}, ${trainingDaysInPeriod} jours d'entraînement enregistrés sur la fenêtre`);
  } else {
    return null;
  }

  const cur = streak?.current ?? 0;
  const longest = streak?.longest ?? 0;
  if (cur >= 5) {
    parts.push(
      cur >= longest && longest >= 10
        ? `avec une série de ${cur} jours consécutifs (record) — un niveau de régularité qui te place largement au-dessus de la moyenne à ce stade de progression`
        : `avec une série de ${cur} jours consécutifs${longest > cur ? ` (record ${longest} j.)` : longest === cur && longest >= 3 ? ' — record égalé ou battu' : ''}`
    );
  }

  const currentMk = endYmd.slice(0, 7);
  const months = buildMonthlyCoachStats(snapshot, endYmd, ctx, {
    windowStart,
    garminData,
    minMonthKey: relevantMonthCutoff(endYmd, 1)
  });
  const bestMonth = findBestMonthFromMonths(months);
  const priorMk = priorMonthKey(currentMk);
  const currentMonth = computeMonthCoachSnapshot(snapshot, currentMk, endYmd, ctx, garminData);
  const priorMonth = computeMonthCoachSnapshot(
    snapshot,
    priorMk,
    `${priorMk}-${String(new Date(parseInt(priorMk.slice(0, 4), 10), parseInt(priorMk.slice(5, 7), 10), 0).getDate()).padStart(2, '0')}`,
    ctx,
    garminData
  );

  if (bestMonth?.monthKey === currentMk && currentMonth?.trainedDays >= 3) {
    let monthBit = `${monthLabelFr(currentMk)} est ton meilleur mois récent avec ${currentMonth.trainedDays} jours actifs`;
    if (currentMonth.exoPct != null) monthBit += ` et ~${currentMonth.exoPct} % de complétion`;
    if (priorMonth?.trainedDays >= 2) {
      monthBit += `, en nette progression face à ${monthLabelFr(priorMk)} (${priorMonth.trainedDays} j.`;
      if (priorMonth.exoPct != null) monthBit += `, ~${priorMonth.exoPct} %`;
      if (priorMonth.runningKm >= 5) monthBit += `, ~${round1(priorMonth.runningKm)} km course`;
      monthBit += ')';
    }
    parts.push(monthBit);
  } else if (bestMonth && bestMonth.monthKey !== currentMk) {
    parts.push(
      `meilleur mois récent : ${monthLabelFr(bestMonth.monthKey)} ${bestMonth.monthKey.slice(0, 4)} (${bestMonth.trainedDays} j. actifs)`
    );
  }

  const dow = analyzeWeekdayRhythm(enrichment?.dayOfWeek);
  if (dow?.bestDay) {
    let dowBit = `${WEEKDAY_FR[dow.bestDay.dow]} reste ton jour le plus actif (${dow.bestDay.plannedDays} séance${dow.bestDay.plannedDays > 1 ? 's' : ''} sur la fenêtre)`;
    if (dow.weakPct && dow.bestPct && dow.gap >= 5) {
      dowBit += `, et l'écart de complétion entre tes meilleurs et tes pires jours reste contenu — ~${dow.bestPct.avgCompletionPct} % le ${WEEKDAY_FR[dow.bestPct.dow]} contre ~${dow.weakPct.avgCompletionPct} % le ${WEEKDAY_FR[dow.weakPct.dow]} — un signal que ta structure de semaine fonctionne plutôt bien plutôt qu'un point faible isolé`;
    }
    parts.push(dowBit);
  }

  const street = resolveStreetSkillPlan(answers || {});
  if (street.labelFr && !parts.some((p) => p.includes(street.labelFr))) {
    parts.push(`objectif street : « ${street.labelFr} »`);
  }

  if (periodComp?.globalPct != null && periodComp.exoPct - periodComp.globalPct >= 15) {
    parts.push(
      `score programme complet ~${periodComp.globalPct} % (étirements rarement cochés) — les exos tiennent mais le plan entier reste sous-exploité`
    );
  }

  return `${parts.join(', ')}.`;
}

function buildLoadParagraph(opts) {
  const {
    snapshot,
    window,
    endYmd,
    windowStart,
    ctx,
    enrichment,
    assessment,
    denseAnalytics,
    garminPartial,
    getExerciseNameById
  } = opts;

  const sentences = [];
  const weekCmp = compareExoCompletionWeekBlocks(snapshot, endYmd, windowStart, ctx);
  if (weekCmp && Math.abs(weekCmp.recentPct - weekCmp.priorPct) >= 4) {
    sentences.push(
      weekCmp.recentPct > weekCmp.priorPct
        ? `la dynamique récente est favorable (semaine ~${weekCmp.recentPct} % vs ~${weekCmp.priorPct} % la semaine précédente)`
        : `la dynamique récente fléchit (semaine ~${weekCmp.recentPct} % vs ~${weekCmp.priorPct} % avant) — à surveiller si ça se confirme`
    );
  }
  const muscleRows = enrichment?.muscleShareRows || [];
  const top = muscleRows[0];
  if (top) {
    const label = MUSCLE_LABEL_FR[top.groupId] || top.groupId;
    sentences.push(
      `Côté charge, le groupe dominant est ${label} avec un volume nettement supérieur aux autres zones — cohérent avec la nature du programme actuel, mais à surveiller si tu enchaînes plusieurs semaines similaires sans rotation`
    );
  }

  const vertical = denseAnalytics?.verticalPull;
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  const pullTrends = [];

  if (vertical?.totalReps >= 30) {
    pullTrends.push(
      `tirage vertical ~${vertical.totalReps} reps sur ${vertical.sessions} séance${vertical.sessions > 1 ? 's' : ''}`
    );
  }

  const facePull = findExercisesByPattern(byEx, /face\s*pull/i, getExerciseNameById)[0];
  if (facePull?.sessions?.length >= 3) {
    const trend = repTrendPhrase(facePull.sessions);
    if (trend) pullTrends.push(`face pull : ${trend}`);
  }

  const pullMain = findExercisesByPattern(byEx, /traction|pull[- ]?up/i, getExerciseNameById)[0];
  if (pullMain?.sessions?.length >= 3 && !facePull) {
    const trend = repTrendPhrase(pullMain.sessions);
    if (trend) pullTrends.push(`${pullMain.name} : ${trend}`);
  }

  if (pullTrends.length) {
    sentences.push(`le tirage progresse de façon régulière (${pullTrends.join(', ')})`);
  }

  const sleepCorr = denseAnalytics?.sleepCorrelations?.[0];
  const kickback = findExercisesByPattern(byEx, /kickback/i, getExerciseNameById)[0];
  if (kickback?.sessions?.length >= 3) {
    const trend = repTrendPhrase(kickback.sessions);
    if (trend) {
      const sleepStart = window?.start || DateHelper.addDays(window?.end || DateHelper.getTodayLocal(), -27);
      const sleepWnd = computeGarminSleepAverage(garminPartial, sleepStart, window?.end);
      let declineBit = `les ${kickback.name.toLowerCase()} montrent une légère baisse récente (${trend})`;
      if (sleepCorr && sleepCorr.dropPct >= 10 && /kickback|triceps/i.test(sleepCorr.name)) {
        declineBit += ` qui coïncide avec tes nuits les plus courtes sur la fenêtre — probablement de la fatigue accumulée plutôt qu'une perte de force réelle`;
      } else if (sleepWnd?.avgHours != null && sleepWnd.avgHours >= 8) {
        declineBit += ` malgré un sommeil solide (~${sleepWnd.avgHours.toFixed(1)} h/j) — plutôt une fatigue localisée triceps/épaules ou une semaine plus chargée en poussée qu'un déficit de récupération global`;
      } else if (sleepWnd?.avgHours != null && sleepWnd.avgHours < 7) {
        declineBit += ` dans une fenêtre où ton sommeil Garmin reste en dessous de 7 h/j en moyenne — fatigue probable plutôt qu'une perte de force structurelle`;
      } else {
        declineBit += ` — à recouper avec ton ressenti avant de conclure à une vraie régression`;
      }
      sentences.push(declineBit);
    }
  } else if (sleepCorr?.dropPct >= 12) {
    sentences.push(
      `${sleepCorr.name} chute de ~${sleepCorr.dropPct} % après les nuits courtes (~${sleepCorr.shortAvg} vs ~${sleepCorr.okAvg} reps quand tu dors ≥7 h) — le sommeil pèse directement sur ta perf`
    );
  }

  const mom = assessment?.repsMomentumRatio;
  if (mom != null && mom >= 1.1) {
    sentences.push(
      `le volume de reps global est en hausse de +${Math.round((mom - 1) * 100)} % vs la quinzaine précédente, positif tant que ton ressenti et ton sommeil ne se dégradent pas en parallèle`
    );
  } else if (denseAnalytics?.weeklyLoad?.pctChange >= 15) {
    sentences.push(
      `la charge kg×reps progresse de +${Math.round(denseAnalytics.weeklyLoad.pctChange)} % vs la semaine précédente — à valider côté récup avant d'empiler encore`
    );
  }

  const pp = enrichment?.pushPull;
  if (pp?.ratio >= 1.8 && (pp.push || 0) + (pp.pull || 0) >= 200) {
    sentences.push(
      `la répartition cochée reste très orientée poussée (~${pp.pushPct} % push / ${pp.pullPct} % pull, ratio ${pp.ratio}) — le déséquilibre vient surtout de la structure du plan, pas d'un manque d'exécution isolé`
    );
  }

  if (!sentences.length) return null;
  return `${sentences[0].charAt(0).toUpperCase()}${sentences[0].slice(1)}${sentences.length > 1 ? ` ; ${sentences.slice(1).join(' ; ')}` : ''}.`;
}

function buildRecoveryParagraph(opts) {
  const { window, garminPartial, periodComp, enrichment, denseAnalytics } = opts;
  const endYmd = window?.end || DateHelper.getTodayLocal();
  const sleepStart = window?.start || DateHelper.addDays(endYmd, -27);
  const sleepWnd = computeGarminSleepAverage(garminPartial, sleepStart, endYmd);
  const priorSleepEnd = DateHelper.addDays(sleepStart, -1);
  const priorSleepStart = DateHelper.addDays(priorSleepEnd, -27);
  const sleepPrior = computeGarminSleepAverage(garminPartial, priorSleepStart, priorSleepEnd);

  const sentences = [];

  if (sleepWnd?.avgHours != null && sleepWnd.sampleDays >= 3) {
    let sleepBit = `Le sommeil Garmin tourne à ~${sleepWnd.avgHours.toFixed(1)} h/j`;
    if (sleepWnd.avgHours >= 8) {
      sleepBit += ', un socle largement suffisant pour absorber le volume actuel';
    } else if (sleepWnd.avgHours >= 7) {
      sleepBit += ' — correct pour soutenir la charge actuelle';
    } else {
      sleepBit += ' — un facteur limitant si tu continues à monter en volume';
    }
    if (sleepPrior?.avgHours != null && sleepPrior.sampleDays >= 5) {
      const diff = sleepWnd.avgHours - sleepPrior.avgHours;
      if (Math.abs(diff) >= 0.3) {
        sleepBit +=
          diff > 0
            ? `, en hausse vs ~${sleepPrior.avgHours.toFixed(1)} h sur le bloc précédent`
            : `, en baisse vs ~${sleepPrior.avgHours.toFixed(1)} h sur le bloc précédent`;
      }
    }
    sleepBit += ' — ça explique en partie pourquoi tu peux (ou non) te permettre la hausse de charge sans signe d\'épuisement généralisé';
    sentences.push(sleepBit);
  }

  const stretchPct = periodComp?.stretchPct ?? enrichment?.completion?.stretchPct;
  const exoPct = periodComp?.exoPct ?? enrichment?.completion?.exoPct;
  if (stretchPct != null && exoPct != null && exoPct - stretchPct >= 15) {
    let stretchBit = `Les étirements restent le point le moins exploité du système : ~${stretchPct} % de complétion contre ~${exoPct} % côté exercices`;
    const zone = enrichment?.stretchZones?.rows?.[0];
    if (zone?.zone) {
      stretchBit += `, alors que la zone des ${zone.zone} est justement ta zone la plus cochée quand tu le fais (${zone.count} fois sur la période)`;
    }
    stretchBit += ' — un vrai levier de récupération presque jamais utilisé';
    sentences.push(stretchBit);
  }

  if (!sentences.length && denseAnalytics?.sleepCorrelations?.length) return null;
  if (!sentences.length) return null;
  return sentences.join('. ') + '.';
}

function buildEnduranceParagraph(opts) {
  const {
    snapshot,
    window,
    denseAnalytics,
    garminData,
    answers,
    activeProgram,
    assessment,
    ctx,
    getExerciseNameById
  } = opts;

  const sentences = [];
  const runStats =
    denseAnalytics?.runningPeriod || resolveRunningPeriodStats(snapshot, garminData, window);

  if (runStats.distanceKm >= 5) {
    const endYmd = window?.end || DateHelper.getTodayLocal();
    const recentStart = DateHelper.addDays(endYmd, -20);
    const recentStats = resolveRunningPeriodStats(snapshot, garminData, {
      start: recentStart,
      end: endYmd
    });
    let runBit = `Sur le cardio, ~${round1(runStats.distanceKm)} km de course cumulés`;
    if (recentStats.distanceKm >= 5 && recentStats.distanceKm < runStats.distanceKm) {
      runBit += ` avec une accélération nette récente (~${round1(recentStats.distanceKm)} km sur les trois dernières semaines)`;
    }
    runBit += ' viennent compléter un programme orienté haut du corps et street';
    if (runStats.sessions >= 3) {
      runBit += ` — ~${round1(runStats.distanceKm / runStats.sessions)} km/sortie en moyenne, la régularité cardio structure ta semaine en parallèle du street`;
    }
    sentences.push(runBit);
  }

  const gtgEnd = window?.end || DateHelper.getTodayLocal();
  const gtgStart = window?.start || DateHelper.addDays(gtgEnd, -27);
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  const gtgSum = summarizeGtgWindow(snapshot?.enduranceData?.gtg, gtgStart, gtgEnd, ctx);
  const gtgNorm = normalizeGtgData(snapshot?.enduranceData?.gtg);
  let maxPull = 0;
  let gtgPullTarget = null;
  for (const [exId, sessions] of byEx) {
    const name = exerciseDisplayName(exId, getExerciseNameById);
    if (!/traction|pull[- ]?up|chin[- ]?up|australien/i.test(name)) continue;
    sessions.forEach((s) => {
      if ((s.reps || 0) > maxPull) maxPull = s.reps;
    });
    const mm = gtgNorm.config?.manualMax?.[exId] ?? gtgNorm.config?.manualMax?.[String(exId)];
    if (mm != null && Number(mm) > 0) gtgPullTarget = Number(mm);
  }

  if (gtgSum.hasConfig) {
    if (gtgSum.daysWithAny <= 4 && gtgSum.totalReps < 40) {
      let gtgBit = 'Le Grease the Groove est configuré mais sous-utilisé';
      if (maxPull >= 8) {
        gtgBit += ` : tu plafonnes parfois ton max coché à ${maxPull} reps`;
        if (gtgPullTarget != null && gtgPullTarget < maxPull * 0.5) {
          gtgBit += ` alors que ton repère GTG est à ${gtgPullTarget}`;
        }
      }
      gtgBit += ' — 2-3 mini-séries supplémentaires dans la journée pourraient faire grimper tes maximums sans ajouter de fatigue de séance';
      sentences.push(gtgBit);
    } else if (gtgSum.daysWithAny >= 5) {
      sentences.push(
        `GTG actif sur ${gtgSum.daysWithAny} j. (~${gtgSum.totalReps} reps mini-séries) — bon complément au travail de séance pour la progression street`
      );
    }
  }

  const street = resolveStreetSkillPlan(answers || {});
  const programName = activeProgram?.name;
  const load = assessment?.sessionLoadAlignment28;
  if (programName || street.labelFr) {
    let fwd = '';
    if (programName) fwd += `« ${programName} » cadre la suite`;
    if (street.labelFr) fwd += `${programName ? ' avec' : ''} « ${street.labelFr} » comme fil rouge`;
    if (load?.avgScore0to100 != null && load.avgScore0to100 < 60) {
      fwd += ' — priorité court terme : exécuter le plan tel qu\'il est écrit plutôt que d\'ajouter du volume';
    } else if ((assessment?.repsMomentumRatio || 0) >= 1.1) {
      fwd += ' — consolide la hausse de charge avant d\'ajouter une nouvelle contrainte';
    } else {
      fwd += ' — l\'enjeu est surtout de tenir ce rythme sans brûler la régularité';
    }
    sentences.push(fwd);
  }

  if (!sentences.length) return null;
  return sentences.join('. ') + '.';
}

/**
 * @returns {{ lead: string|null, paragraphs: string[] }}
 */
export function buildIntegratedCoachVisionProse(opts = {}) {
  const {
    snapshot = {},
    window = null,
    enrichment = null,
    assessment = null,
    denseAnalytics = null,
    garminPartial = null,
    garminData = null,
    activeProgram = null,
    profileQuestionnaireRaw = null,
    getExerciseNameById = null,
    programs = [],
    getTodayWorkout = null,
    isAdmin = false,
    isAuthenticated = false,
    trainingDaysInPeriod = 0,
    periodComp = null
  } = opts;

  const endYmd = window?.end || DateHelper.getTodayLocal();
  const windowStart = window?.start ?? null;
  const answers = normalizeProfileQuestionnaire(profileQuestionnaireRaw).answers || {};
  const ctx = {
    programs,
    activeProgram,
    getTodayWorkout,
    isAdmin,
    isAuthenticated,
    alignWithCalendar: true,
    getExerciseNameById
  };

  const shared = {
    snapshot,
    window,
    enrichment,
    assessment,
    denseAnalytics,
    garminPartial,
    garminData,
    activeProgram,
    answers,
    ctx,
    getExerciseNameById,
    endYmd,
    windowStart,
    periodComp: periodComp || enrichment?.completion,
    trainingDaysInPeriod,
    streak: enrichment?.streak
  };

  const adherence = buildAdherenceParagraph(shared);
  const load = buildLoadParagraph(shared);
  const recovery = buildRecoveryParagraph(shared);
  const endurance = buildEnduranceParagraph(shared);

  return {
    lead: adherence,
    paragraphs: [load, recovery, endurance].filter(Boolean)
  };
}
