/**
 * Suggestions Récap axées programme en cours + semaine / mois + activité saisie.
 */

import DateHelper from '../dateHelper';
import {
  aggregateCheckedRepsByDateAndExerciseId,
  enduranceRepsForSession
} from '../trainingLoadUtils';
import { buildTotalStrengthRepsByDate, buildMergedStepsByDate } from './recapDailyChartData';
import { sumRepsBetween, sumLiftVolumeKgBetween } from './recapCrossCoachAggregate';
import { aggregateLiftVolumeKgByDate } from '../exerciseLoadVolume';
import { isMockEnduranceSession, normalizeDateString } from '../calendarUtils';

const DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

const DAY_LABEL_FR = {
  lundi: 'lundi',
  mardi: 'mardi',
  mercredi: 'mercredi',
  jeudi: 'jeudi',
  vendredi: 'vendredi',
  samedi: 'samedi',
  dimanche: 'dimanche'
};

function ymdAddDays(ymd, delta) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function dayNameForYmd(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  return DAY_NAMES_FR[new Date(y, m - 1, d).getDay()];
}

/** Lundi → dimanche contenant endYmd. */
export function calendarWeekRange(endYmd) {
  const [y, m, d] = endYmd.split('-').map(Number);
  const dow = new Date(y, m - 1, d).getDay();
  const toMonday = dow === 0 ? -6 : 1 - dow;
  const startYmd = ymdAddDays(endYmd, toMonday);
  return { startYmd, endYmd };
}

export function calendarMonthRange(endYmd) {
  const startYmd = `${endYmd.slice(0, 7)}-01`;
  return { startYmd, endYmd };
}

function isPlannedTrainingDay(slot) {
  if (!slot || typeof slot !== 'object' || slot.active === false) return false;
  const exo = slot.exercises;
  const hasList = Array.isArray(exo) && exo.length > 0;
  let hasVariant = false;
  if (slot.salleVariants && typeof slot.salleVariants === 'object') {
    ['semaineA', 'semaineB'].forEach((vk) => {
      const list = slot.salleVariants[vk]?.exercises;
      if (Array.isArray(list) && list.length > 0) hasVariant = true;
    });
  }
  return hasList || hasVariant || slot.active === true;
}

function plannedExercisesForDay(slot) {
  if (!slot) return [];
  const list = Array.isArray(slot.exercises) ? slot.exercises : [];
  if (list.length) return list;
  const sv = slot.salleVariants;
  if (sv?.semaineA?.exercises?.length) return sv.semaineA.exercises;
  if (sv?.semaineB?.exercises?.length) return sv.semaineB.exercises;
  return [];
}

function hasAnyCheckOnDate(snapshot, ymd) {
  return Object.keys(snapshot?.checkedExercises || {}).some(
    (k) => k.startsWith(`${ymd}_`) && snapshot.checkedExercises[k]
  );
}

function countCheckedProgramExercises(snapshot, ymd, exercises) {
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return { checked: hasAnyCheckOnDate(snapshot, ymd) ? 1 : 0, total: 1 };
  }
  let checked = 0;
  const missing = [];
  exercises.forEach((ex) => {
    const id = ex?.id != null ? String(ex.id) : '';
    if (!id) return;
    const key = `${ymd}_${id}`;
    if (snapshot?.checkedExercises?.[key]) checked += 1;
    else missing.push(ex.name || `exercice ${id}`);
  });
  return { checked, total: exercises.length, missing };
}

function enumeratePlannedDays(schedule, startYmd, endYmd) {
  const out = [];
  let cur = startYmd;
  while (cur <= endYmd) {
    const dayName = dayNameForYmd(cur);
    const slot = schedule?.[dayName];
    if (isPlannedTrainingDay(slot)) {
      const exercises = plannedExercisesForDay(slot);
      out.push({
        ymd: cur,
        dayName,
        title: slot.name || slot.focus || DAY_LABEL_FR[dayName] || dayName,
        exercises,
        exerciseCount: exercises.length
      });
    }
    cur = ymdAddDays(cur, 1);
  }
  return out;
}

function sumStepsInWindow(snapshot, garminDailyMetrics, startYmd, endYmd) {
  const stepsMap = buildMergedStepsByDate(
    garminDailyMetrics,
    snapshot?.enduranceData?.manualDailyWalkByDate
  );
  let sum = 0;
  let days = 0;
  stepsMap.forEach((v, k) => {
    if (k >= startYmd && k <= endYmd && v > 0) {
      sum += v;
      days += 1;
    }
  });
  return { sum, days };
}

function sumRepsByNamePattern(snapshot, startYmd, endYmd, patterns, getExerciseNameById) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(
    snapshot?.reps,
    snapshot?.checkedExercises
  );
  let total = 0;
  const pats = patterns.map((p) => p.toLowerCase());
  grouped.forEach(({ reps: r }, gkey) => {
    const sep = gkey.lastIndexOf('::');
    const dateStr = gkey.slice(0, sep);
    const exId = gkey.slice(sep + 2);
    if (dateStr < startYmd || dateStr > endYmd) return;
    const name =
      (typeof getExerciseNameById === 'function' ? getExerciseNameById(exId) : '') || '';
    const low = name.toLowerCase();
    if (!pats.some((p) => low.includes(p))) return;
    total += Math.floor(Number(r) || 0);
  });
  return total;
}

function pushupRepsEnduranceInWindow(snapshot, startYmd, endYmd) {
  let sum = 0;
  const sessions = snapshot?.enduranceData?.sessions?.pushups;
  if (!Array.isArray(sessions)) return 0;
  sessions.forEach((s) => {
    if (isMockEnduranceSession(s)) return;
    const ds = normalizeDateString(s?.date);
    if (!ds || ds < startYmd || ds > endYmd) return;
    sum += enduranceRepsForSession('pushups', s);
  });
  return sum;
}

/**
 * @param {object} opts
 * @returns {{ kind: string, text: string, priority: number }[]}
 */
export function buildRecapContextualSuggestions(opts = {}) {
  const {
    snapshot = {},
    activeProgram = null,
    getExerciseNameById,
    nutritionPartial = null,
    garminPartial = null,
    garminDailyMetrics = null,
    todayYmd = DateHelper.getTodayLocal()
  } = opts;

  const out = [];
  const schedule = activeProgram?.schedule;
  const programName = activeProgram?.name ? String(activeProgram.name).trim() : 'ton programme';

  const week = calendarWeekRange(todayYmd);
  const month = calendarMonthRange(todayYmd);
  const prevWeekEnd = ymdAddDays(week.startYmd, -1);
  const prevWeekStart = ymdAddDays(week.startYmd, -7);

  const repsMap = buildTotalStrengthRepsByDate(snapshot);
  const liftMap = aggregateLiftVolumeKgByDate(snapshot);

  const repsWeek = sumRepsBetween(repsMap, week.startYmd, week.endYmd);
  const repsPrevWeek = sumRepsBetween(repsMap, prevWeekStart, prevWeekEnd);
  const repsMonth = sumRepsBetween(repsMap, month.startYmd, month.endYmd);
  const volWeek = sumLiftVolumeKgBetween(liftMap, week.startYmd, week.endYmd);

  const stepsWeek = sumStepsInWindow(snapshot, garminDailyMetrics, week.startYmd, week.endYmd);
  const stepsPrevWeek = sumStepsInWindow(snapshot, garminDailyMetrics, prevWeekStart, prevWeekEnd);

  const pushupsWeek =
    sumRepsByNamePattern(snapshot, week.startYmd, week.endYmd, ['pompe', 'push-up', 'push up'], getExerciseNameById) +
    pushupRepsEnduranceInWindow(snapshot, week.startYmd, week.endYmd);
  const plankWeek = sumRepsByNamePattern(
    snapshot,
    week.startYmd,
    week.endYmd,
    ['gainage', 'planche', 'plank', 'hollow'],
    getExerciseNameById
  );
  const pullWeek = sumRepsByNamePattern(
    snapshot,
    week.startYmd,
    week.endYmd,
    ['traction', 'pull-up', 'pull up', 'austral'],
    getExerciseNameById
  );

  if (schedule && typeof schedule === 'object') {
    const weekPlanned = enumeratePlannedDays(schedule, week.startYmd, week.endYmd);
    const monthPlanned = enumeratePlannedDays(schedule, month.startYmd, month.endYmd);
    const todaySlots = weekPlanned.filter((d) => d.ymd === todayYmd);
    const pastWeek = weekPlanned.filter((d) => d.ymd < todayYmd);
    const futureWeek = weekPlanned.filter((d) => d.ymd > todayYmd);

    if (todaySlots.length > 0) {
      const slot = todaySlots[0];
      const { checked, total, missing } = countCheckedProgramExercises(snapshot, todayYmd, slot.exercises);
      const label = DAY_LABEL_FR[slot.dayName] || slot.dayName;
      if (total > 0 && checked >= total) {
        out.push({
          kind: 'program_today_done',
          priority: 98,
          text: `Aujourd’hui (${label}) : séance « ${slot.title} » complète (${checked}/${total} exercices) — bon alignement avec ${programName}.`
        });
      } else if (total > 0 && checked > 0) {
        const missTxt =
          missing.length > 0
            ? ` Il reste notamment : ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}.`
            : '';
        out.push({
          kind: 'program_today_partial',
          priority: 97,
          text: `Aujourd’hui (${label}) : ${checked}/${total} exercices cochés sur « ${slot.title} ».${missTxt}`
        });
      } else if (total > 0) {
        out.push({
          kind: 'program_today_pending',
          priority: 96,
          text: `Aujourd’hui (${label}) : séance prévue « ${slot.title} » (${total} exercice${total > 1 ? 's' : ''}) — rien de coché pour l’instant dans ${programName}.`
        });
      } else if (!hasAnyCheckOnDate(snapshot, todayYmd)) {
        out.push({
          kind: 'program_today_empty',
          priority: 90,
          text: `Aujourd’hui (${label}) : jour d’entraînement dans ${programName} — coche les exercices ou saisis tes reps pour que le Récap suive ta séance.`
        });
      }
    } else if (weekPlanned.length > 0 && !weekPlanned.some((d) => hasAnyCheckOnDate(snapshot, d.ymd))) {
      out.push({
        kind: 'program_week_no_touch',
        priority: 88,
        text: `Cette semaine (calendrier) : aucune séance du programme « ${programName} » n’a encore été validée — commence par le prochain jour prévu.`
      });
    }

    if (pastWeek.length > 0) {
      const donePast = pastWeek.filter((d) => hasAnyCheckOnDate(snapshot, d.ymd)).length;
      const pct = Math.round((donePast / pastWeek.length) * 100);
      if (donePast === 0) {
        out.push({
          kind: 'program_week_missed',
          priority: 85,
          text: `Semaine en cours : ${pastWeek.length} séance${pastWeek.length > 1 ? 's' : ''} déjà passée${pastWeek.length > 1 ? 's' : ''} dans ${programName}, aucune cochée — une séance courte vaut mieux qu’un trou complet.`
        });
      } else if (pct < 50) {
        out.push({
          kind: 'program_week_low',
          priority: 84,
          text: `Semaine en cours : ${donePast}/${pastWeek.length} séances passées touchées dans ${programName} — vise les jours restants${futureWeek.length ? ` (${futureWeek.map((d) => DAY_LABEL_FR[d.dayName] || d.dayName).join(', ')})` : ''}.`
        });
      } else if (pct >= 80) {
        out.push({
          kind: 'program_week_good',
          priority: 70,
          text: `Semaine en cours : ${donePast}/${pastWeek.length} séances passées validées dans ${programName} — bon rythme, garde la qualité sur les jours restants.`
        });
      }
    }

    if (futureWeek.length > 0 && pastWeek.some((d) => hasAnyCheckOnDate(snapshot, d.ymd))) {
      out.push({
        kind: 'program_week_upcoming',
        priority: 55,
        text: `Il reste ${futureWeek.length} séance${futureWeek.length > 1 ? 's' : ''} prévue${futureWeek.length > 1 ? 's' : ''} cette semaine (${futureWeek.map((d) => DAY_LABEL_FR[d.dayName] || d.dayName).join(', ')}) dans ${programName}.`
      });
    }

    if (monthPlanned.length >= 3) {
      const doneMonth = monthPlanned.filter((d) => hasAnyCheckOnDate(snapshot, d.ymd)).length;
      const monthPct = Math.round((doneMonth / monthPlanned.length) * 100);
      if (doneMonth === 0 && todayYmd > month.startYmd) {
        out.push({
          kind: 'program_month_none',
          priority: 82,
          text: `Mois en cours : aucune séance cochée sur ${monthPlanned.length} jours prévus dans ${programName} — reprends par la prochaine séance du planning.`
        });
      } else if (monthPct >= 60 && doneMonth >= 2) {
        out.push({
          kind: 'program_month_ok',
          priority: 52,
          text: `Mois en cours : ${doneMonth}/${monthPlanned.length} jours de séance validés dans ${programName} (~${monthPct} %).`
        });
      } else if (monthPct < 40 && doneMonth >= 1) {
        out.push({
          kind: 'program_month_behind',
          priority: 78,
          text: `Mois en cours : seulement ${doneMonth}/${monthPlanned.length} séances touchées dans ${programName} — le planning est en retard par rapport au calendrier.`
        });
      }
    }
  } else if (activeProgram) {
    out.push({
      kind: 'program_no_schedule',
      priority: 40,
      text: `Programme « ${programName} » actif sans jours planifiés visibles : vérifie les jours actifs dans l’onglet Programme.`
    });
  }

  if (repsWeek > 0) {
    if (repsPrevWeek > 0) {
      const ratio = repsWeek / repsPrevWeek;
      if (ratio >= 1.25) {
        out.push({
          kind: 'reps_week_up',
          priority: 68,
          text: `Cette semaine : ~${Math.round(repsWeek)} reps enregistrées (+${Math.round((ratio - 1) * 100)} % vs semaine précédente) — surveille la récup si la fatigue monte.`
        });
      } else if (ratio <= 0.72) {
        out.push({
          kind: 'reps_week_down',
          priority: 62,
          text: `Cette semaine : ~${Math.round(repsWeek)} reps vs ~${Math.round(repsPrevWeek)} la semaine d’avant — OK si déload volontaire, sinon regarde sommeil et adhérence au programme.`
        });
      }
    } else {
      out.push({
        kind: 'reps_week_first',
        priority: 58,
        text: `Cette semaine : ~${Math.round(repsWeek)} reps saisies — continue à cocher les exercices du programme pour affiner les tendances.`
      });
    }
  } else if (schedule && enumeratePlannedDays(schedule, week.startYmd, week.endYmd).length > 0) {
    out.push({
      kind: 'reps_week_zero',
      priority: 86,
      text: `Cette semaine : séances prévues dans ${programName} mais aucune rep cochée — valide au moins les exercices faits pour des conseils précis.`
    });
  }

  if (repsMonth > repsWeek * 2.5 && repsWeek > 0) {
    out.push({
      kind: 'reps_month',
      priority: 48,
      text: `Mois en cours : ~${Math.round(repsMonth)} reps cumulées (dont ~${Math.round(repsWeek)} cette semaine).`
    });
  }

  if (pushupsWeek >= 30) {
    out.push({
      kind: 'movement_pushups',
      priority: 54,
      text: `Cette semaine : ~${Math.round(pushupsWeek)} reps « pompes » (programme + endurance) — le volume pousse poitrine/triceps si la récup suit.`
    });
  }
  if (plankWeek >= 60) {
    out.push({
      kind: 'movement_plank',
      priority: 53,
      text: `Cette semaine : ~${Math.round(plankWeek)} unités gainage/planche saisies — bon travail core ; alterne avec des jours plus légers si les lombaires tirent.`
    });
  }
  if (pullWeek >= 20) {
    out.push({
      kind: 'movement_pull',
      priority: 52,
      text: `Cette semaine : ~${Math.round(pullWeek)} reps tractions/tirages enregistrées — aligné avec un focus tirage du programme.`
    });
  }

  if (volWeek > 0) {
    out.push({
      kind: 'volume_week',
      priority: 50,
      text: `Cette semaine : ~${Math.round(volWeek)} kg×reps de volume chargé — utile pour suivre la progression force sur ${programName}.`
    });
  }

  if (stepsWeek.sum > 0) {
    const avg = stepsWeek.days > 0 ? Math.round(stepsWeek.sum / stepsWeek.days) : 0;
    if (stepsPrevWeek.sum > 500 && stepsWeek.sum < stepsPrevWeek.sum * 0.75) {
      out.push({
        kind: 'steps_week_down',
        priority: 56,
        text: `Pas cette semaine : ~${stepsWeek.sum.toLocaleString('fr-FR')} (${avg}/jour) vs ~${stepsPrevWeek.sum.toLocaleString('fr-FR')} la semaine précédente — la NEAT baisse ; les séances programme restent prioritaires.`
      });
    } else if (stepsWeek.sum >= 35000) {
      out.push({
        kind: 'steps_week_high',
        priority: 45,
        text: `Pas cette semaine : ~${stepsWeek.sum.toLocaleString('fr-FR')} (${avg}/jour en moyenne) — bon complément au programme si la récup le permet.`
      });
    } else if (stepsWeek.sum > 0) {
      out.push({
        kind: 'steps_week',
        priority: 42,
        text: `Pas cette semaine : ~${stepsWeek.sum.toLocaleString('fr-FR')} pas enregistrés (~${avg}/jour).`
      });
    }
  } else if (garminPartial?.status === 'ready' && garminPartial.weekStepsCurrent > 0) {
    out.push({
      kind: 'steps_garmin_week',
      priority: 44,
      text: `Pas (montre) cette semaine : ~${Number(garminPartial.weekStepsCurrent).toLocaleString('fr-FR')} — croise avec tes séances ${programName}.`
    });
  }

  const nut = nutritionPartial;
  if (nut?.status === 'ready') {
    const logged = Number(nut.daysWithLoggedMeals28) || 0;
    const meanPct = Number(nut.meanPctCaloriesVsTarget);
    const comp = Number(nut.avgComplianceScore);
    const hasTrainingWeek = repsWeek > 0 || (schedule && enumeratePlannedDays(schedule, week.startYmd, week.endYmd).some((d) => hasAnyCheckOnDate(snapshot, d.ymd)));

    if (hasTrainingWeek && logged === 0 && (nut.programsOwnedCount || 0) > 0) {
      out.push({
        kind: 'nutrition_log_gap',
        priority: 83,
        text: `Nutrition : entraînement enregistré cette semaine mais aucun repas sur 28 j — le journal aide à caler récup et objectif avec ${programName}.`
      });
    } else if (hasTrainingWeek && logged > 0 && logged <= 4) {
      out.push({
        kind: 'nutrition_sparse',
        priority: 60,
        text: `Nutrition : seulement ${logged} jour${logged > 1 ? 's' : ''} renseigné${logged > 1 ? 's' : ''} sur 28 j alors que tu t’entraînes — quelques repas de plus affinent les conseils.`
      });
    } else if (hasTrainingWeek && Number.isFinite(meanPct) && meanPct >= 88 && meanPct <= 112) {
      out.push({
        kind: 'nutrition_aligned',
        priority: 64,
        text: `Nutrition : apports proches de la cible en moyenne (~${Math.round(meanPct)} % des calories) pendant ta semaine d’entraînement — bon combo avec ${programName}.`
      });
    } else if (hasTrainingWeek && Number.isFinite(meanPct) && meanPct < 75) {
      out.push({
        kind: 'nutrition_low',
        priority: 66,
        text: `Nutrition : moyenne ~${Math.round(meanPct)} % de la cible calorique sur les jours saisis — à surveiller si tu vises performance ou prise de muscle sur ${programName}.`
      });
    } else if (hasTrainingWeek && Number.isFinite(meanPct) && meanPct > 118) {
      out.push({
        kind: 'nutrition_high',
        priority: 65,
        text: `Nutrition : moyenne ~${Math.round(meanPct)} % de la cible calorique — utile si prise de masse ; à ajuster si l’objectif est sèchement + programme actuel.`
      });
    } else if (comp >= 72 && logged >= 5) {
      out.push({
        kind: 'nutrition_compliance',
        priority: 48,
        text: `Nutrition : bonne régularité de saisie (score conformité ~${Math.round(comp)}/100) — les suggestions croisent mieux entraînement et repas.`
      });
    }
  }

  const sla = opts.sessionLoadAlignment;
  if (sla?.avgScore0to100 != null && sla.sessionDaysScored >= 2) {
    if (sla.avgScore0to100 < 42) {
      out.push({
        kind: 'load_gap_week',
        priority: 80,
        text: `Charge réalisée souvent en dessous du prévu (${programName}) sur les séances récentes — coche les exos et saisis les reps pour coller au plan.`
      });
    } else if (sla.avgScore0to100 > 88) {
      out.push({
        kind: 'load_ok_week',
        priority: 58,
        text: `Bon match prévu/réalisé sur tes dernières séances de ${programName} — la progression du programme est bien reflétée dans tes saisies.`
      });
    }
  }

  out.sort((a, b) => b.priority - a.priority);
  return out;
}

/**
 * Fusionne suggestions contextuelles, dynamiques 28 j et quiz (quiz limité).
 * @param {Array<{ kind?: string, text: string, priority?: number }>} contextual
 * @param {Array<{ kind?: string, text: string }>} legacy
 * @param {{ max?: number, maxQuiz?: number }} [opts]
 */
export function mergeRecapSuggestions(contextual, legacy, opts = {}) {
  const max = opts.max ?? 12;
  const maxQuiz = opts.maxQuiz ?? 3;
  const seen = new Set();
  const merged = [];

  const push = (row) => {
    const text = String(row?.text || '').trim();
    if (!text || seen.has(text)) return;
    seen.add(text);
    merged.push({ kind: row.kind || 'misc', text });
  };

  contextual.forEach(push);

  const nonQuiz = [];
  const quiz = [];
  (legacy || []).forEach((row) => {
    const k = String(row?.kind || '');
    if (k.startsWith('quiz_')) quiz.push(row);
    else nonQuiz.push(row);
  });

  nonQuiz.forEach(push);
  quiz.slice(0, maxQuiz).forEach(push);

  return merged.slice(0, max);
}
