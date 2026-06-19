/**
 * Vision coach narrative — synthèse prose indépendante des cartes Structure/Progression/etc.
 * Croise calendrier, Garmin, programme, défis sur plusieurs horizons temporels.
 */

import DateHelper from '../dateHelper';
import { JUSTIFICATION_REASONS } from '../dayJustificationUtils';
import { computeGarminDailyStats, coachSleepHours } from './recapCrossCoachAggregate';
import {
  getCompletionForWindow,
  averageExoCompletionPct,
  compareExoCompletionWeekBlocks,
  describeRecapWindow,
  buildDailyExoCompletionSeries
} from './recapCompletionTruth';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';
import { dayHasCheckedWorkout } from '../trainingStreakUtils';
import { normalizeProfileQuestionnaire } from '../../features/profileQuestionnaire/schema';
import { resolveStreetSkillPlan } from '../../features/profileQuestionnaire/quizStreetSkillGoal';
import { collectCheckedExerciseRepHistory } from './recapAdaptiveInsights';
import { findExerciseSessions, pctChange, magnitudeWord, challengeProgressPct } from './recapInsightHelpers';
import {
  buildGarminCardioById,
  mergeRunningSessionsWithGarmin,
  sumRunningKmFromRows,
  computeRunningVolumeTotals
} from './runningVolumeTruth';
import {
  VisionComposer,
  buildTemporalVisionSections,
  buildMomentumSection
} from './recapCoachVisionTemporal';

const MONTH_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre'
];

function round1(n) {
  return Math.round(Number(n) * 10) / 10;
}

function clampYmd(ymd, minYmd) {
  if (!minYmd || !ymd) return ymd;
  return ymd < minYmd ? minYmd : ymd;
}

function monthKey(ymd) {
  return ymd?.slice(0, 7) || '';
}

function monthLabelFr(ym) {
  const m = parseInt(String(ym).slice(5, 7), 10);
  if (!Number.isFinite(m) || m < 1 || m > 12) return ym;
  return MONTH_FR[m - 1];
}

function isInjuryNote(note) {
  const n = String(note || '').toLowerCase();
  return /bless|injur|fract|entorse|élong|elong|genou|épaule|cass|chirurg|rehab|reprise/.test(n);
}

/** Moyenne sommeil Garmin — uniquement jours avec mesure valide. */
export function computeGarminSleepAverage(garminPartial, startYmd, endYmd) {
  if (!garminPartial?.dailyMetrics || !startYmd || !endYmd) return null;
  const stats = computeGarminDailyStats(garminPartial.dailyMetrics, startYmd, endYmd);
  if (!stats.sleepSampleDays || stats.avgSleepHours28 == null) return null;
  return {
    avgHours: stats.avgSleepHours28,
    sampleDays: stats.sleepSampleDays,
    startYmd,
    endYmd
  };
}

function completionPctForRange(snapshot, startYmd, endYmd, ctx) {
  return averageExoCompletionPct(snapshot, startYmd, endYmd, ctx);
}

function trainedDaysInRange(snapshot, startYmd, endYmd) {
  if (!startYmd || !endYmd) return 0;
  const dates = DateHelper.getDateRange(startYmd, endYmd);
  return dates.filter((d) => dayHasCheckedWorkout(snapshot, d)).length;
}

/** Analyse calendrier : creux, maladie, notes blessure (fenêtre extensible). */
export function analyzeCalendarYearArc(snapshot, endYmd, opts = {}) {
  const end = endYmd || DateHelper.getTodayLocal();
  const maxDays = opts.maxDays ?? 365;
  let start = DateHelper.addDays(end, -(maxDays - 1));
  if (opts.windowStart && opts.windowStart > start) start = opts.windowStart;
  const just = snapshot?.dayJustifications || {};
  const byMonth = new Map();

  for (let d = end; d >= start; d = DateHelper.addDays(d, -1)) {
    const mk = monthKey(d);
    if (!byMonth.has(mk)) {
      byMonth.set(mk, {
        trained: 0,
        maladie: 0,
        injuryNotes: 0,
        otherJust: 0
      });
    }
    const row = byMonth.get(mk);
    if (dayHasCheckedWorkout(snapshot, d)) row.trained += 1;
    const j = just[d];
    if (j?.reason === JUSTIFICATION_REASONS.MALADIE) {
      row.maladie += 1;
      if (isInjuryNote(j.note)) row.injuryNotes += 1;
    } else if (j?.reason) {
      row.otherJust += 1;
    }
  }

  const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  const hardMonths = months.filter(([, r]) => r.maladie >= 3 || r.injuryNotes >= 1 || r.trained <= 4);
  const recentMonths = months.slice(-4);
  const earlyMonths = months.slice(0, 4);

  return { months, hardMonths, recentMonths, earlyMonths, start, end };
}

function formatMonthList(keys) {
  const labels = keys.map(([k]) => `${monthLabelFr(k)} ${k.slice(0, 4)}`);
  if (labels.length === 0) return '';
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} et ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')} et ${labels[labels.length - 1]}`;
}

function synthesizePerformanceThread(snapshot, window, getExerciseNameById, answers) {
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  const snippets = [];
  const street = resolveStreetSkillPlan(answers || {});

  let pullSessions = [];
  for (const id of ['101', '501', 101, 501]) {
    const s = findExerciseSessions(byEx, id);
    if (s.length > pullSessions.length) pullSessions = s;
  }
  if (pullSessions.length >= 4) {
    const first = pullSessions[0].reps;
    const last = pullSessions[pullSessions.length - 1].reps;
    const max = Math.max(...pullSessions.map((s) => s.reps));
    if (last > first) {
      snippets.push(
        `au tirage, la courbe repasse de ${first} à ${last} reps sur la fenêtre (pic ${max}) sans chercher un record à chaque séance`
      );
    } else if (max >= 8) {
      snippets.push(`tu consolides un niveau autour de ${Math.round(pullSessions.slice(-5).reduce((a, s) => a + s.reps, 0) / Math.min(5, pullSessions.length))} reps aux tractions`);
    }
  }

  if (street.skillId.includes('pull') && snippets.length === 0) {
    snippets.push(`l’objectif « ${street.labelFr} » progresse surtout via la régularité plutôt que des pics isolés`);
  }

  return snippets;
}

function synthesizeRunningThread(snapshot, garminData, window) {
  if (!window?.end) return null;
  const garminById = buildGarminCardioById(garminData?.activities?.cardio);
  const stored = snapshot?.enduranceData?.sessions?.running || [];
  const merged = mergeRunningSessionsWithGarmin(stored, garminById);
  const rows =
    computeRunningVolumeTotals(merged, garminById, { period: 'all', preFiltered: false }).rows || [];
  const filtered = rows.filter((r) => {
    const d = r?.date || r?.dateYmd;
    return d && isDateInRecapWindow(d, window);
  });
  const km = sumRunningKmFromRows(filtered);
  if (km < 5) return null;
  const endYmd = window.end;
  const recent = filtered.filter((r) => {
    const d = r?.date || r?.dateYmd;
    const days = DateHelper.daysBetween(d, endYmd);
    return days != null && days <= 20;
  });
  const prior = filtered.filter((r) => {
    const d = r?.date || r?.dateYmd;
    const days = DateHelper.daysBetween(d, endYmd);
    return days != null && days > 20 && days <= 55;
  });
  const recentKm = sumRunningKmFromRows(recent);
  const priorKm = sumRunningKmFromRows(prior);
  if (priorKm >= 3 && recentKm > 0) {
    const chg = pctChange(recentKm, priorKm);
    if (chg != null && Math.abs(chg) >= 12) {
      return chg > 0
        ? `côté course, le kilométrage récent accélère ${magnitudeWord(chg)} (~${round1(recentKm)} km sur trois semaines)`
        : `côté course, tu as légèrement levé le pied ces dernières semaines (~${round1(recentKm)} km vs ~${round1(priorKm)} km avant)`;
    }
  }
  return `~${Math.round(km)} km parcourus sur la période — le cardio structure ta semaine en parallèle du street`;
}

/**
 * @returns {string}
 */
export function buildCoachVisionNarrative(opts = {}) {
  const {
    activeProgram = null,
    snapshot = {},
    window = null,
    enrichment = null,
    assessment = null,
    garminPartial = null,
    garminData = null,
    getExerciseNameById = null,
    profileQuestionnaireRaw = null,
    programs = [],
    getTodayWorkout = null,
    isAdmin = false,
    isAuthenticated = false
  } = opts;

  const endYmd = window?.end || DateHelper.getTodayLocal();
  const ctx = {
    programs,
    activeProgram,
    getTodayWorkout,
    isAdmin,
    isAuthenticated,
    alignWithCalendar: true
  };
  const answers = normalizeProfileQuestionnaire(profileQuestionnaireRaw).answers || {};
  const composer = new VisionComposer();

  if (!activeProgram?.schedule) {
    return 'Active un programme dans l’onglet Programme : la vision coach pourra alors relier ton calendrier, Garmin et tes objectifs en un fil narratif.';
  }

  const programName = activeProgram.name || 'Programme actif';
  const windowStart = window?.start ?? null;
  const windowLabel = describeRecapWindow(window, endYmd);
  const windowDays =
    windowStart && window?.end ? (DateHelper.daysBetween(windowStart, window.end) ?? 0) + 1 : null;
  const horizonMode =
    windowStart == null ? 'all' : windowDays != null && windowDays <= 10 ? 'micro' : windowDays <= 35 ? 'short' : windowDays <= 95 ? 'medium' : 'long';
  const arcMaxDays =
    horizonMode === 'all' ? 365 : horizonMode === 'long' ? 365 : horizonMode === 'medium' ? 180 : 120;

  const periodComp =
    window?.end && (windowStart || window.end)
      ? getCompletionForWindow(snapshot, { start: windowStart, end: window.end }, ctx)
      : enrichment?.completion
        ? {
            exoPct: enrichment.completion.exoPct,
            exoChecked: enrichment.completion.exoChecked,
            exoTotal: enrichment.completion.exoTotal,
            exoCheckedPerDay: enrichment.completion.exoCheckedPerDay,
            exoPlannedPerDay: enrichment.completion.exoPlannedPerDay,
            activeTrainingDays: enrichment.completion.activeTrainingDays,
            globalPct: enrichment.completion.globalPct
          }
        : null;

  buildTemporalVisionSections({
    snapshot,
    endYmd,
    windowStart,
    windowDays: windowStart == null ? 999 : windowDays,
    ctx,
    garminData,
    composer
  });

  const showYearArc =
    horizonMode !== 'all' &&
    (horizonMode === 'long' || (windowDays != null && windowDays >= 90));
  if (showYearArc && !composer.has('season_arc')) {
    const arc = analyzeCalendarYearArc(snapshot, endYmd, { maxDays: arcMaxDays, windowStart });
    const arcParts = [];
    const currentMk = monthKey(endYmd);
    const minYear = parseInt(endYmd.slice(0, 4), 10) - 1;
    const hardFiltered = arc.hardMonths.filter(
      ([mk]) => mk !== currentMk && parseInt(mk.slice(0, 4), 10) >= minYear
    );
    if (hardFiltered.length >= 1) {
      const injuryMonths = hardFiltered.filter(([, r]) => r.injuryNotes >= 1 || r.maladie >= 4);
      if (injuryMonths.length >= 1) {
        arcParts.push(
          `${formatMonthList(injuryMonths)} ${injuryMonths.length > 1 ? 'portent' : 'porte'} la trace de périodes compliquées (maladie ou blessure au calendrier)`
        );
      } else if (hardFiltered.length >= 2) {
        arcParts.push(`creux de régularité : ${formatMonthList(hardFiltered.slice(0, 4))}`);
      }
    }
    if (
      periodComp?.exoPct != null &&
      periodComp.activeTrainingDays >= 5 &&
      !composer.has('completion_window') &&
      windowStart
    ) {
      arcParts.push(
        `${windowLabel} : ~${periodComp.exoPct} % complétion exos (~${periodComp.exoCheckedPerDay}/${periodComp.exoPlannedPerDay}/j · ${periodComp.exoChecked}/${periodComp.exoTotal})`
      );
    }
    if (arcParts.length) {
      composer.add(arcParts.join('. ') + '.', ['calendar_arc', 'completion_window']);
    }
  } else if (periodComp?.exoPct != null && !composer.has('completion_window')) {
    composer.add(
      `${windowLabel.charAt(0).toUpperCase()}${windowLabel.slice(1)}, complétion exos ~${periodComp.exoPct} % sur les jours entraînés (~${periodComp.exoCheckedPerDay}/${periodComp.exoPlannedPerDay}/j · ${periodComp.exoChecked}/${periodComp.exoTotal}).` +
        (periodComp.globalPct != null && periodComp.globalPct < periodComp.exoPct - 15
          ? ` Score programme complet ~${periodComp.globalPct} % (étirements peu cochés).`
          : ''),
      ['completion_window']
    );
    if (windowStart) {
      const just = snapshot?.dayJustifications || {};
      const injuryDays = Object.entries(just).filter(([d, j]) => {
        if (d < windowStart || d > endYmd) return false;
        return j?.reason === JUSTIFICATION_REASONS.MALADIE || isInjuryNote(j?.note);
      });
      if (injuryDays.length >= 1 && !composer.has('injury_window')) {
        composer.add(
          `${injuryDays.length} jour(s) maladie/blessure dans la fenêtre — à pondérer dans l'interprétation de la charge.`,
          ['injury_window']
        );
      }
    }
  }

  const recentBlockDays =
    horizonMode === 'micro'
      ? Math.max(3, Math.floor((windowDays ?? 7) / 2))
      : horizonMode === 'short'
        ? 14
        : 21;
  const recentStart = clampYmd(DateHelper.addDays(endYmd, -(recentBlockDays - 1)), windowStart);
  const priorEnd = DateHelper.addDays(recentStart, -1);
  const priorStart = clampYmd(DateHelper.addDays(priorEnd, -(recentBlockDays - 1)), windowStart);

  const compRecent = recentStart <= endYmd ? completionPctForRange(snapshot, recentStart, endYmd, ctx) : null;
  const compPrior =
    priorStart <= priorEnd && priorEnd >= (windowStart || priorEnd)
      ? completionPctForRange(snapshot, priorStart, priorEnd, ctx)
      : null;

  const weekCmp = compareExoCompletionWeekBlocks(snapshot, endYmd, windowStart, ctx);
  const streak = enrichment?.streak || {};
  const current = streak.current ?? 0;
  const longest = streak.longest ?? 0;

  const momentumParts = [];
  const skipMomentumDetail =
    composer.has(`month_cmp:${monthKey(endYmd)}`) && horizonMode !== 'micro';

  if (compRecent != null && !skipMomentumDetail) {
    const qual = compRecent >= 85 ? 'exemplaire' : compRecent >= 75 ? 'solide' : compRecent >= 60 ? 'correcte' : 'fragile';
    momentumParts.push(`~${compRecent} % exos sur ${recentBlockDays} j. (${qual})`);
  }
  if (weekCmp && Math.abs(weekCmp.recentPct - weekCmp.priorPct) >= 4 && !composer.has('week_cmp')) {
    momentumParts.push(
      weekCmp.recentPct > weekCmp.priorPct
        ? `semaine ~${weekCmp.recentPct} % vs ~${weekCmp.priorPct} %`
        : `semaine ~${weekCmp.recentPct} % (vs ~${weekCmp.priorPct} %)`
    );
  } else if (
    !skipMomentumDetail &&
    compPrior != null &&
    compRecent != null &&
    Math.abs(compRecent - compPrior) >= 5
  ) {
    momentumParts.push(
      compRecent > compPrior
        ? `+${Math.round(compRecent - compPrior)} pts vs bloc précédent`
        : `−${Math.round(compPrior - compRecent)} pts vs bloc précédent`
    );
  }

  if (current >= 3 && !composer.has('streak')) {
    if (longest > 0 && current >= longest) {
      momentumParts.push(`série ${current} j. — record ${longest > current ? `(ancien ${longest} j.)` : 'égalé ou battu'}`);
    } else if (longest > 0) {
      momentumParts.push(`série ${current} j. (record ${longest} j.)`);
    } else {
      momentumParts.push(`${current} j. consécutifs`);
    }
  }

  const dailyExo = buildDailyExoCompletionSeries(snapshot, { start: recentStart, end: endYmd }, ctx);
  const fullDays = dailyExo.filter((d) => d.trained && d.value >= 95).length;
  if (fullDays >= 2 && (compRecent ?? 0) >= 80 && !skipMomentumDetail) {
    momentumParts.push(`${fullDays} séance(s) quasi complètes`);
  }

  if (momentumParts.length) {
    composer.add(`Dynamique récente : ${momentumParts.join(' · ')}.`, ['momentum', 'week_cmp', 'streak']);
  } else {
    buildMomentumSection({
      composer,
      snapshot,
      endYmd,
      windowStart,
      windowDays,
      ctx,
      enrichment,
      skipIfMonthCmp: horizonMode !== 'micro'
    });
  }

  const perfBits = synthesizePerformanceThread(snapshot, window, getExerciseNameById, answers);
  const runBit = synthesizeRunningThread(snapshot, garminData, window);
  const pushPull = enrichment?.pushPull;
  const perfLines = [];
  if (perfBits.length) perfLines.push(perfBits[0]);
  if (runBit) perfLines.push(runBit);
  if (pushPull?.pushPct != null && (pushPull.push ?? 0) + (pushPull.pull ?? 0) >= 200) {
    perfLines.push(
      `répartition cochée ~${pushPull.pushPct} % push / ${pushPull.pullPct} % pull (${pushPull.push} vs ${pushPull.pull} reps)`
    );
  }
  const reps28 = assessment?.totalReps28;
  if (reps28 >= 100 && assessment?.repsMomentumRatio != null) {
    const mom = assessment.repsMomentumRatio;
    if (mom >= 1.1 || mom <= 0.9) {
      perfLines.push(
        mom >= 1.1
          ? `volume street +${Math.round((mom - 1) * 100)} % vs quinzaine précédente`
          : `volume street en retrait (~${Math.round((1 - mom) * 100)} % vs quinzaine précédente)`
      );
    }
  }
  if (perfLines.length) {
    composer.add(`Charge & performance ${windowLabel} : ${perfLines.join(' · ')}.`, ['performance']);
  }

  const sleepStart = windowStart || DateHelper.addDays(endYmd, -13);
  const sleepWnd = computeGarminSleepAverage(garminPartial, sleepStart, endYmd);
  const priorSpan =
    windowStart && windowDays != null && windowDays >= 7
      ? windowDays
      : 28;
  const priorSleepEnd = DateHelper.addDays(sleepStart, -1);
  const priorSleepStart = DateHelper.addDays(priorSleepEnd, -(priorSpan - 1));
  const sleepPrior = computeGarminSleepAverage(garminPartial, priorSleepStart, priorSleepEnd);
  const gWindow =
    windowStart && window?.end
      ? computeGarminDailyStats(garminPartial?.dailyMetrics, windowStart, window.end)
      : null;

  const garminBits = [];
  if (sleepWnd?.avgHours != null && sleepWnd.sampleDays >= 3) {
    let line = `sommeil ~${sleepWnd.avgHours.toFixed(1)} h/j (${sleepWnd.sampleDays} nuit${sleepWnd.sampleDays > 1 ? 's' : ''} mesurée${sleepWnd.sampleDays > 1 ? 's' : ''})`;
    if (sleepPrior?.avgHours != null && sleepPrior.sampleDays >= 5) {
      const diff = sleepWnd.avgHours - sleepPrior.avgHours;
      if (Math.abs(diff) >= 0.25) {
        line +=
          diff > 0
            ? `, au-dessus des ~${sleepPrior.avgHours.toFixed(1)} h du bloc précédent`
            : `, en dessous des ~${sleepPrior.avgHours.toFixed(1)} h du bloc précédent`;
      }
    }
    garminBits.push(line);
  } else if (gWindow?.avgSleepHours28 != null && gWindow.sleepSampleDays >= 3) {
    garminBits.push(
      `sur la fenêtre affichée, sommeil Garmin ~${gWindow.avgSleepHours28.toFixed(1)} h/j (${gWindow.sleepSampleDays} nuits avec données)`
    );
  }

  if (gWindow?.avgSteps28 != null && gWindow.daysWithStepsData >= 5) {
    garminBits.push(`~${Math.round(gWindow.avgSteps28).toLocaleString('fr-FR')} pas/j en moyenne`);
    if (gWindow.weekStepsTrendConfident && gWindow.avgPriorWeeksSteps > 0) {
      const chg = pctChange(gWindow.weekStepsCurrent, gWindow.avgPriorWeeksSteps);
      if (chg != null && Math.abs(chg) >= 6) {
        garminBits.push(
          chg > 0
            ? 'activité quotidienne en hausse cette semaine'
            : 'semaine plus calme côté pas'
        );
      }
    }
  }

  if (garminBits.length) {
    composer.add(`Garmin ${windowLabel} : ${garminBits.join(' · ')}.`, ['garmin']);
  }

  const street = resolveStreetSkillPlan(answers);
  const forward = [];
  forward.push(`« ${programName} » cadre la suite`);

  if (street.labelFr) {
    forward.push(`avec « ${street.labelFr} » comme fil rouge`);
  }

  const per = enrichment?.digest?.perActivity || {};
  const activeCh = enrichment?.activeChallenges?.[0];
  if (activeCh) {
    const prog = challengeProgressPct(activeCh, snapshot, per);
    if (prog != null && prog < 100) {
      forward.push(
        `et un défi « ${activeCh.title || activeCh.name || 'actif'} » à ~${prog} % qui peut servir de repère intermédiaire`
      );
    }
  }

  const load = assessment?.sessionLoadAlignment28;
  if (load?.avgScore0to100 != null && load.avgScore0to100 < 60 && load.sessionDaysScored >= 3) {
    forward.push(
      '— priorité court terme : exécuter le plan tel qu’il est écrit plutôt que d’ajouter du volume'
    );
  } else if ((compRecent ?? periodComp?.exoPct ?? 0) >= 85 && (assessment?.repsMomentumRatio || 0) >= 1.05) {
    forward.push(
      '— tu as la marge pour consolider les acquis avant d’ajouter une contrainte (charge, fréquence ou objectif chiffré)'
    );
  } else {
    forward.push('— l’enjeu est surtout de tenir ce rythme sans brûler la régularité');
  }

  composer.add(`${forward.join(' ')}.`, ['forward']);

  if (composer.paragraphs.length === 0) {
    return `« ${programName} » est actif ; continue à cocher tes séances et connecter Garmin pour densifier cette synthèse.`;
  }

  return composer.join();
}
