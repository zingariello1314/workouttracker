/**
 * Analyses « Pistes » + enrichissement suggestions Récap (programme, pas, reps, cardio, repères quiz).
 */

import DateHelper from '../dateHelper';
import { buildTotalStrengthRepsByDate, buildMergedStepsByDate } from './recapDailyChartData';
import { sumRepsBetween, sumLiftVolumeKgBetween } from './recapCrossCoachAggregate';
import { aggregateLiftVolumeKgByDate } from '../exerciseLoadVolume';
import { calendarWeekRange, calendarMonthRange } from './recapContextualSuggestions';
import { isMockEnduranceSession, normalizeDateString } from '../calendarUtils';
import { classifyBaselineField, hasStrengthBaselines } from '../../features/profileQuestionnaire/quizVolumeFromBaselines';

const KM_PER_STEP = 0.00078;

function ymdAddDays(ymd, delta) {
  return DateHelper.addDays(ymd, delta);
}

function countActiveRepDays(repsMap, startYmd, endYmd) {
  let n = 0;
  repsMap.forEach((v, k) => {
    if (k >= startYmd && k <= endYmd && v > 0) n += 1;
  });
  return n;
}

function collectEnduranceRuns(snapshot, startYmd, endYmd) {
  const dates = [];
  const sessions = snapshot?.enduranceData?.sessions;
  if (!sessions || typeof sessions !== 'object') return dates;
  ['running', 'course', 'cardio'].forEach((type) => {
    const arr = sessions[type];
    if (!Array.isArray(arr)) return;
    arr.forEach((s) => {
      if (isMockEnduranceSession(s)) return;
      const ds = normalizeDateString(s?.date);
      if (!ds || ds < startYmd || ds > endYmd) return;
      dates.push(ds);
    });
  });
  return [...new Set(dates)].sort();
}

function daysSinceYmd(fromYmd, toYmd) {
  const d = DateHelper.daysBetween(fromYmd, toYmd);
  return d != null ? d : null;
}

function inferDataRichness(snapshot, week, repsWeek, stepsWeek) {
  const repsMap = buildTotalStrengthRepsByDate(snapshot);
  const repDaysWeek = countActiveRepDays(repsMap, week.startYmd, week.endYmd);
  const hasSteps = stepsWeek.sum > 2000;
  const hasReps = repsWeek > 30;
  const sparseLogging = repDaysWeek <= 2 && hasSteps;
  const richLogging = repDaysWeek >= 4 || repsWeek > 400;
  return { repDaysWeek, hasSteps, hasReps, sparseLogging, richLogging };
}

/**
 * Pistes court / moyen / long terme pour le panneau Récap.
 */
export function buildRecapPistes(opts = {}) {
  const {
    snapshot = {},
    activeProgram = null,
    profileAnswers = {},
    assessment = {},
    garminDailyMetrics = null,
    todayYmd = DateHelper.getTodayLocal()
  } = opts;

  const shortTerm = [];
  const mediumTerm = [];
  const longTerm = [];

  const week = calendarWeekRange(todayYmd);
  const month = calendarMonthRange(todayYmd);
  const prevWeekStart = ymdAddDays(week.startYmd, -7);
  const prevWeekEnd = ymdAddDays(week.startYmd, -1);
  const prevMonthStart = ymdAddDays(month.startYmd, -1).slice(0, 7) + '-01';
  const prevMonthEnd = ymdAddDays(month.startYmd, -1);

  const repsMap = buildTotalStrengthRepsByDate(snapshot);
  const liftMap = aggregateLiftVolumeKgByDate(snapshot);
  const repsWeek = sumRepsBetween(repsMap, week.startYmd, week.endYmd);
  const repsPrevWeek = sumRepsBetween(repsMap, prevWeekStart, prevWeekEnd);
  const repsMonth = sumRepsBetween(repsMap, month.startYmd, month.endYmd);
  const volWeek = sumLiftVolumeKgBetween(liftMap, week.startYmd, week.endYmd);
  const lifetimeReps = assessment.lifetimeReps ?? 0;
  const tenureDays = assessment.tenureDays ?? 0;

  const stepsMap = buildMergedStepsByDate(garminDailyMetrics, snapshot?.enduranceData?.manualDailyWalkByDate);
  let stepsWeek = 0;
  let stepsPrevWeek = 0;
  let stepsMonth = 0;
  let stepsPrevMonth = 0;
  stepsMap.forEach((v, k) => {
    if (k >= week.startYmd && k <= week.endYmd) stepsWeek += v;
    if (k >= prevWeekStart && k <= prevWeekEnd) stepsPrevWeek += v;
    if (k >= month.startYmd && k <= month.endYmd) stepsMonth += v;
    if (k >= prevMonthStart && k <= prevMonthEnd) stepsPrevMonth += v;
  });

  const richness = inferDataRichness(snapshot, week, repsWeek, { sum: stepsWeek });
  const kmWeek = Math.round(stepsWeek * KM_PER_STEP * 10) / 10;
  const kmPrevWeek = Math.round(stepsPrevWeek * KM_PER_STEP * 10) / 10;

  if (richness.sparseLogging && richness.hasSteps) {
    shortTerm.push(
      `Peu de jours avec reps saisies cette semaine (${richness.repDaysWeek}), mais ~${stepsWeek.toLocaleString('fr-FR')} pas (~${kmWeek} km marchés/courus) : ton activité quotidienne compte déjà — les coches programme affinent le lien avec ${activeProgram?.name || 'le plan'}.`
    );
  } else if (repsWeek > 0 && richness.repDaysWeek >= 2) {
    shortTerm.push(
      `Volume enregistré sur ${richness.repDaysWeek} jour${richness.repDaysWeek > 1 ? 's' : ''} cette semaine (~${Math.round(repsWeek)} reps)${stepsWeek > 5000 ? `, avec ~${kmWeek} km estimés via les pas` : ''}.`
    );
  }

  if (stepsWeek > 3000 && stepsPrevWeek > 3000) {
    const ratio = stepsWeek / stepsPrevWeek;
    const pct = Math.round((ratio - 1) * 100);
    if (ratio >= 1.12) {
      shortTerm.push(
        `Marche / NEAT en hausse : ~${kmWeek} km cette semaine vs ~${kmPrevWeek} km la semaine dernière (+${pct} %). Bon signe si tu complètes aussi les séances prévues.`
      );
    } else if (ratio <= 0.82) {
      shortTerm.push(
        `Pas en baisse (~${kmWeek} km vs ~${kmPrevWeek} km la semaine précédente) : normal en semaine chargée ; garde au moins les séances clés du programme.`
      );
    }
  }

  if (stepsMonth > 0 && stepsPrevMonth > 0) {
    const r = stepsMonth / stepsPrevMonth;
    if (r >= 1.15) {
      mediumTerm.push(
        `Mois en cours : activité à pied plus élevée qu’au mois précédent (~${Math.round(stepsMonth * KM_PER_STEP)} km vs ~${Math.round(stepsPrevMonth * KM_PER_STEP)} km estimés).`
      );
    }
  }

  const runsWeek = collectEnduranceRuns(snapshot, week.startYmd, week.endYmd);
  const allRuns = collectEnduranceRuns(snapshot, '2020-01-01', todayYmd);
  const lastRun = allRuns.length ? allRuns[allRuns.length - 1] : null;
  if (lastRun && runsWeek.length === 0) {
    const since = daysSinceYmd(lastRun, todayYmd);
    if (since != null && since >= 10) {
      shortTerm.push(
        `Cardio course : dernière sortie enregistrée il y a ${since} jours — si le programme prévoit du cardio, une sortie courte cette semaine relance la routine.`
      );
    }
  } else if (runsWeek.length >= 1) {
    shortTerm.push(
      `${runsWeek.length} sortie${runsWeek.length > 1 ? 's' : ''} cardio/course cette semaine — ${runsWeek.length >= 2 ? 'bon rythme' : 'une base à maintenir'} si ton objectif inclut l’endurance.`
    );
  }

  const sla = assessment.sessionLoadAlignment28;
  if (sla?.avgScore0to100 != null && sla.sessionDaysScored >= 2) {
    if (sla.avgScore0to100 >= 75 && sla.avgScore0to100 <= 105) {
      shortTerm.push(
        `Sur les séances récentes, le réalisé colle bien au prévu du programme (score charge ~${Math.round(sla.avgScore0to100)}/100) — bonne base pour progresser sur les mêmes mouvements.`
      );
    } else if (sla.avgScore0to100 < 55) {
      shortTerm.push(
        `Charge souvent sous le prévu (${Math.round(sla.avgScore0to100)}/100) : soit séance plus légère volontairement, soit reps non saisies — les deux faussent l’analyse.`
      );
    } else if (sla.avgScore0to100 > 115) {
      shortTerm.push(
        `Tu dépasses souvent le volume prévu (${Math.round(sla.avgScore0to100)}/100) : surveille la récup ou ajuste les séries du jour dans l’app.`
      );
    }
  }

  if (volWeek > 0 && repsWeek > 0) {
    const weeksPace = tenureDays > 14 ? Math.max(1, tenureDays / 7) : 1;
    const weeklyAvgVol = lifetimeReps > 0 ? (assessment.volumeKgRepsSum28 || volWeek) : volWeek;
    const proj4w = Math.round(weeklyAvgVol * 4);
    if (proj4w > 5000) {
      mediumTerm.push(
        `Au rythme actuel (~${Math.round(volWeek)} kg×reps / semaine), tu t’approcherais d’environ ${proj4w.toLocaleString('fr-FR')} kg×reps sur 4 semaines — utile pour visualiser la charge accumulée.`
      );
    }
  }

  if (repsWeek > 50 && tenureDays >= 14) {
    const rate = repsWeek;
    const projMonth = Math.round(rate * 4.3);
    mediumTerm.push(
      `Environ ${Math.round(repsWeek)} reps cette semaine : maintenu 1 mois, cela représenterait ~${projMonth.toLocaleString('fr-FR')} reps — la répétition sur les mouvements de base reste le levier principal.`
    );
  }

  if (hasStrengthBaselines(profileAnswers)) {
    const b = profileAnswers.strengthBaselineMaxes || {};
    const pushTier = classifyBaselineField('pushupsMax', b.pushupsMax);
    if (pushTier === 'beginner' && b.pushupsMax != null) {
      shortTerm.push(
        `Repères quiz : max ${b.pushupsMax} pompes → profil débutant sur le poussé : le programme vise la répétition progressive (même mouvement plusieurs fois dans la semaine) plutôt que la variété.`
      );
    } else if (pushTier === 'advanced' && b.pushupsMax != null) {
      shortTerm.push(
        `Repères quiz : ${b.pushupsMax} pompes max → volume aligné sur ~${Math.round(b.pushupsMax * 0.55)} reps/série possible ; intérêt à garder des variantes plus exigeantes sur les jours « force ».`
      );
    }
    if (b.pullupsMax != null) {
      const pullTier = classifyBaselineField('pullupsMax', b.pullupsMax);
      if (pullTier === 'beginner') {
        shortTerm.push(
          `Tractions : max ${b.pullupsMax} — priorité au grind (fréquence + technique) avant d’ajouter trop de variantes tirage.`
        );
      } else if (pullTier === 'advanced') {
        shortTerm.push(
          `Tractions : max ${b.pullupsMax} — tu peux viser des séries proches de ${Math.max(3, Math.round(b.pullupsMax * 0.6))} reps en travail si la récup est bonne.`
        );
      }
    }
  }

  if (assessment.repsMomentumRatio > 1.15) {
    mediumTerm.push(
      'Tendance : volume de reps en hausse sur la 2ᵉ quinzaine — prévois une semaine plus légère si la fatigue ou le sommeil flanchent.'
    );
  } else if (assessment.repsMomentumRatio < 0.82) {
    mediumTerm.push(
      'Tendance : volume de reps en baisse vs la quinzaine précédente — OK si décharge ; sinon réaligne 2 séances courtes sur le programme actuel.'
    );
  }

  if (assessment.weightDelta28 != null && Math.abs(assessment.weightDelta28) >= 0.4) {
    shortTerm.push(
      assessment.weightDelta28 < 0
        ? `Poids : ~${Math.abs(assessment.weightDelta28).toFixed(1)} kg sur la fenêtre récente — croiser avec nutrition et volume d’entraînement.`
        : `Poids : +${assessment.weightDelta28.toFixed(1)} kg sur la fenêtre — cohérent en prise de masse, à surveiller en sèche.`
    );
  }

  if (tenureDays < 21) {
    longTerm.push(
      'Premières semaines : l’app apprend ton profil — pas, reps et repères quiz affineront automatiquement les pistes.'
    );
  }
  if (lifetimeReps > 15000) {
    longTerm.push(
      'Historique conséquent : les projections et le niveau s’appuient surtout sur les 4 dernières semaines pour rester actionnables.'
    );
  }
  if (activeProgram?.name && assessment.programCompletion28?.ratio >= 0.55) {
    longTerm.push(
      `Programme « ${activeProgram.name} » : en maintenant ~${Math.round((assessment.programCompletion28.ratio || 0) * 100)} % d’adhérence, les progressions sur les mouvements récurrents (pompes, tirage, jambes) restent le meilleur ROI.`
    );
  }

  if (!shortTerm.length && stepsWeek > 0) {
    shortTerm.push(
      `Cette semaine : ~${stepsWeek.toLocaleString('fr-FR')} pas (~${kmWeek} km) enregistrés — continue à noter les séances force pour des conseils plus précis.`
    );
  }
  if (!mediumTerm.length && repsWeek > 0) {
    mediumTerm.push(
      'Moyen terme : garde 2–3 mouvements de base en répétition dans le programme actuel plutôt que de changer tout chaque séance.'
    );
  }
  if (!longTerm.length) {
    longTerm.push(
      'Long terme : constance > perfection — quelques reps ou pas chaque jour valent mieux qu’un suivi parfait une semaine sur deux.'
    );
  }

  return {
    shortTerm: shortTerm.slice(0, 5),
    mediumTerm: mediumTerm.slice(0, 4),
    longTerm: longTerm.slice(0, 3),
    predictions: [...shortTerm.slice(0, 2), ...mediumTerm.slice(0, 2)]
  };
}

/** Réduit le ton « il manque des coches » quand d’autres signaux existent. */
export function filterSuggestionsForTone(suggestions, richness) {
  const nagKinds = new Set([
    'program_today_pending',
    'program_today_empty',
    'program_week_no_touch',
    'program_week_missed',
    'program_month_none',
    'reps_week_zero',
    'load_gap_week'
  ]);
  let nagCount = 0;
  const maxNag = richness.sparseLogging ? 1 : 2;
  return suggestions.filter((s) => {
    const k = s.kind || '';
    if (!nagKinds.has(k)) return true;
    if (nagCount >= maxNag) return false;
    nagCount += 1;
    return true;
  });
}
