/**
 * Analyse d’un programme enregistré (onglet Programme) pour le coach quiz.
 */

import { aggregateCheckedRepsByDateAndExerciseId } from '../../utils/trainingLoadUtils';
import { exerciseDatabase } from '../../data/exerciseDatabase';
import { situateProgramAdherencePct } from './quizMetricTiers';

const DAY_NAMES_FR = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

function ymdFromDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetweenInclusive(startYmd, endYmd) {
  const a = new Date(Number(startYmd.slice(0, 4)), Number(startYmd.slice(5, 7)) - 1, Number(startYmd.slice(8, 10)));
  const b = new Date(Number(endYmd.slice(0, 4)), Number(endYmd.slice(5, 7)) - 1, Number(endYmd.slice(8, 10)));
  return Math.max(0, Math.floor((b - a) / 86400000) + 1);
}

function hasAnyCheckOnDay(snapshot, ymd) {
  const checked = snapshot?.checkedExercises || {};
  return Object.keys(checked).some((k) => k.startsWith(`${ymd}_`) && checked[k]);
}

function hasStrengthActivityOnDay(snapshot, ymd) {
  if (hasAnyCheckOnDay(snapshot, ymd)) return true;
  const reps = snapshot?.reps || {};
  return Object.keys(reps).some((k) => k.startsWith(`${ymd}_`) && Number(reps[k]) > 0);
}

function scheduleDayForYmd(schedule, ymd) {
  const d = new Date(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)));
  const name = DAY_NAMES_FR[d.getDay()];
  return schedule?.[name] || null;
}

/**
 * Adhérence calendaire : jours entraînement faits + jours repos respectés / jours écoulés depuis le début.
 */
export function computeProgramCalendarAdherence(program, snapshot, endYmd = ymdFromDate(new Date())) {
  const schedule = program?.schedule;
  if (!schedule || !program?.startDate) {
    return { calendarDays: 0, accomplishedDays: 0, adherencePct: null, trainingDaysDone: 0, trainingDaysPlanned: 0, restDaysOk: 0 };
  }

  const start = new Date(program.startDate);
  start.setHours(0, 0, 0, 0);
  const startYmd = ymdFromDate(start);
  if (endYmd < startYmd) {
    return { calendarDays: 0, accomplishedDays: 0, adherencePct: null, trainingDaysDone: 0, trainingDaysPlanned: 0, restDaysOk: 0 };
  }

  let calendarDays = 0;
  let accomplishedDays = 0;
  let trainingDaysPlanned = 0;
  let trainingDaysDone = 0;
  let restDaysOk = 0;

  let cur = startYmd;
  while (cur <= endYmd) {
    calendarDays += 1;
    const daySched = scheduleDayForYmd(schedule, cur);
    const isTrainingDay = daySched?.active === true;
    if (isTrainingDay) {
      trainingDaysPlanned += 1;
      if (hasAnyCheckOnDay(snapshot, cur)) {
        trainingDaysDone += 1;
        accomplishedDays += 1;
      }
    } else {
      if (!hasStrengthActivityOnDay(snapshot, cur)) {
        restDaysOk += 1;
        accomplishedDays += 1;
      }
    }
    const d = new Date(Number(cur.slice(0, 4)), Number(cur.slice(5, 7)) - 1, Number(cur.slice(8, 10)));
    d.setDate(d.getDate() + 1);
    cur = ymdFromDate(d);
  }

  const adherencePct =
    calendarDays > 0 ? Math.round((accomplishedDays / calendarDays) * 100) : null;

  return {
    calendarDays,
    accomplishedDays,
    adherencePct,
    trainingDaysDone,
    trainingDaysPlanned,
    restDaysOk,
    startYmd
  };
}

function scanScheduleSeries(schedule) {
  let force = 0;
  let volume = 0;
  let cardio = 0;
  const scan = (list) => {
    (list || []).forEach((ex) => {
      const s = String(ex?.series || '').toLowerCase();
      if (/course|fractionné|corde|min\b|cardio/.test(s) || String(ex?.type || '').includes('cardio')) {
        cardio += 1;
        return;
      }
      if (/4×[345]|3×[345]|4-8|force/.test(s)) force += 1;
      else if (/1[2-9]|15|20/.test(s)) volume += 1;
      else volume += 0.5;
    });
  };
  Object.values(schedule || {}).forEach((day) => {
    if (!day?.active) return;
    scan(day.exercises);
    if (day.salleVariants) {
      scan(day.salleVariants.semaineA?.exercises);
      scan(day.salleVariants.semaineB?.exercises);
    }
  });
  return { force, volume, cardio };
}

/**
 * @returns {'force'|'volume'|'cardio_lean'|'hybrid'|'balanced'|'unknown'}
 */
export function classifyProgramEmphasis(program) {
  const meta = program?.quizGenerationMeta;
  if (meta?.generationMode === 'recovery') return 'balanced';
  if (meta?.generationMode === 'performance_hybrid') return 'hybrid';

  const { force, volume, cardio } = scanScheduleSeries(program?.schedule);
  const total = force + volume + cardio;
  if (total === 0) return 'unknown';
  if (cardio >= total * 0.45) return 'cardio_lean';
  if (force >= volume + 1) return 'force';
  if (volume >= force + 1) return 'volume';
  return 'balanced';
}

const EMPHASIS_LABELS = {
  force: 'Orienté force (charges / reps basses)',
  volume: 'Orienté volume / hypertrophie',
  cardio_lean: 'Cardio important dans le plan',
  hybrid: 'Hybride force + cardio',
  balanced: 'Équilibré force & accessoires',
  unknown: 'Type non classé (programme manuel ou ancien)'
};

function resolveExerciseLabelFromProgramSchedule(exerciseId, program) {
  const idStr = String(exerciseId);
  const schedule = program?.schedule;
  if (!schedule) return null;
  for (const day of Object.values(schedule)) {
    const lists = [
      day?.exercises,
      day?.salleVariants?.semaineA?.exercises,
      day?.salleVariants?.semaineB?.exercises
    ];
    for (const list of lists) {
      if (!Array.isArray(list)) continue;
      for (const ex of list) {
        if (String(ex?.id) === idStr && ex?.name) return ex.name;
        if (ex?.exerciseBankKey && String(ex.id) === idStr) {
          return exerciseDatabase[ex.exerciseBankKey]?.name || ex.name;
        }
      }
    }
  }
  return null;
}

function resolveExerciseLabel(exerciseId, getExerciseNameById, program = null) {
  const fromSchedule = resolveExerciseLabelFromProgramSchedule(exerciseId, program);
  if (fromSchedule) return fromSchedule;
  if (typeof getExerciseNameById === 'function') {
    const n = getExerciseNameById(exerciseId);
    if (n && !/^Exercice\s+\d+$/i.test(n)) return n;
  }
  if (String(exerciseId).startsWith('db_')) {
    const guess = String(exerciseId)
      .replace(/^db_/, '')
      .replace(/_/g, ' ');
    const hit = Object.keys(exerciseDatabase).find(
      (k) => k.toLowerCase() === guess.toLowerCase()
    );
    if (hit) return exerciseDatabase[hit]?.name || hit;
  }
  return String(exerciseId).slice(0, 40);
}

/**
 * Moyennes de reps par exercice (clés programme) sur toute la période active.
 */
export function aggregateExerciseRepPatterns(snapshot, program, getExerciseNameById, programForLabels = null) {
  const grouped = aggregateCheckedRepsByDateAndExerciseId(snapshot?.reps, snapshot?.checkedExercises);
  const byExercise = new Map();

  grouped.forEach(({ reps }, gkey) => {
    const exerciseId = gkey.slice(11);
    const r = Number(reps) || 0;
    if (r <= 0) return;
    const row = byExercise.get(exerciseId) || { reps: [], count: 0 };
    row.reps.push(r);
    row.count += 1;
    byExercise.set(exerciseId, row);
  });

  const patterns = [];
  byExercise.forEach((row, exerciseId) => {
    const sum = row.reps.reduce((a, b) => a + b, 0);
    const avg = sum / row.reps.length;
    const max = Math.max(...row.reps);
    patterns.push({
      exerciseId,
      name: resolveExerciseLabel(exerciseId, getExerciseNameById, programForLabels || program),
      sessions: row.count,
      avgReps: Math.round(avg * 10) / 10,
      maxReps: max
    });
  });

  patterns.sort((a, b) => b.sessions - a.sessions);
  return patterns.slice(0, 12);
}

/**
 * @param {object} program
 * @param {object} snapshot
 * @param {(id: string) => string} [getExerciseNameById]
 * @param {object} [answers] — objectifs quiz pour hints pivot
 */
export function analyzeProgramForCoach(program, snapshot, getExerciseNameById, answers = {}) {
  if (!program) return null;

  const endYmd = ymdFromDate(new Date());
  const startRaw = program.startDate || program.createdAt;
  const startDate = startRaw ? new Date(startRaw) : null;
  const programAgeDays =
    startDate && !Number.isNaN(startDate.getTime())
      ? daysBetweenInclusive(ymdFromDate(startDate), endYmd)
      : 0;

  const adherence = computeProgramCalendarAdherence(program, snapshot, endYmd);
  const emphasis = classifyProgramEmphasis(program);
  const exercisePatterns = aggregateExerciseRepPatterns(snapshot, program, getExerciseNameById);
  const adherenceSituation = situateProgramAdherencePct(adherence.adherencePct ?? 0);

  const coachHints = [];
  const goal = answers?.goalPhysique;

  coachHints.push(
    `Programme « ${program.name || 'Sans nom'} » : ${EMPHASIS_LABELS[emphasis] || emphasis}.`
  );

  if (programAgeDays > 0 && adherence.adherencePct != null) {
    coachHints.push(
      `Actif depuis ${programAgeDays} j — rythme suivi ~${adherence.adherencePct} % (${adherence.accomplishedDays}/${adherence.calendarDays} j calendaires, repos inclus).`
    );
  }

  if (emphasis === 'force' && ['muscular_defined', 'lean_toned', 'bulk_mass'].includes(goal)) {
    coachHints.push(
      'Bloc plutôt force alors que ton objectif quiz pousse le volume : le prochain cycle peut monter en répétitions / séries.'
    );
  }
  if (emphasis === 'volume' && goal === 'strong_powerful') {
    coachHints.push(
      'Gros volume actuel avec objectif force : prochain programme peut densifier la charge plutôt qu’ajouter des séries.'
    );
  }
  if (adherence.adherencePct != null && adherence.adherencePct < 50 && programAgeDays >= 21) {
    coachHints.push(
      'Adhérence modeste sur ce programme : le prochain plan sera un peu plus conservateur en jours et en volume.'
    );
  }

  const top = exercisePatterns[0];
  if (top && top.sessions >= 3) {
    coachHints.push(
      `Repère saisi : ${top.name} ~${top.avgReps} reps en moyenne (${top.sessions} séances) — utile pour calibrer les séries.`
    );
  }

  return {
    programId: program.id,
    programName: program.name || 'Programme',
    emphasis,
    emphasisLabel: EMPHASIS_LABELS[emphasis] || emphasis,
    programAgeDays,
    adherence,
    adherenceSituation,
    exercisePatterns,
    archetypeId: program.quizGenerationMeta?.archetypeId || null,
    coachHints
  };
}

/**
 * Ajustements deformers / evidence à partir de l’analyse programme quiz.
 */
/**
 * Familles de mouvements détectées dans le schedule (programmes manuels / legacy).
 */
export function inferScheduleMovementFamilies(program) {
  const families = { pull: 0, push: 0, legs: 0, cardio: 0, street: 0 };
  const scan = (list) => {
    (list || []).forEach((ex) => {
      const blob = `${ex?.name || ''} ${ex?.exerciseBankKey || ''}`.toLowerCase();
      if (/course|fractionné|corde|burpee|endurance/.test(blob)) families.cardio += 1;
      else if (/traction|pull|rowing|tirage|dos/.test(blob) && !/développé|press|pompe/.test(blob)) {
        families.pull += 1;
        families.street += 1;
      } else if (/dip|pompe|push/.test(blob)) {
        families.push += 1;
        if (/dip|pompe|traction/.test(blob)) families.street += 1;
      } else if (/squat|fente|presse|soulevé|mollet|jambe/.test(blob)) families.legs += 1;
    });
  };
  const schedule = program?.schedule;
  if (!schedule) return families;
  Object.values(schedule).forEach((day) => {
    if (!day?.active) return;
    scan(day.exercises);
    scan(day.salleVariants?.semaineA?.exercises);
    scan(day.salleVariants?.semaineB?.exercises);
  });
  return families;
}

export function programAnalysisToCoachAdjustments(analysis, answers = {}, program = null) {
  if (!analysis) return { volumeMulDelta: 0, maxExercisesDelta: 0, whyLines: [], templateKeyBoosts: [] };
  const whyLines = [...(analysis.coachHints || [])].slice(0, 3);
  const adjustments = {
    volumeMulDelta: 0,
    maxExercisesDelta: 0,
    whyLines,
    templateKeyBoosts: []
  };

  const goal = answers?.goalPhysique;
  const weeks = Math.floor((analysis.programAgeDays || 0) / 7);
  const adherence = analysis.adherence?.adherencePct;

  if (
    weeks >= 5 &&
    analysis.emphasis === 'force' &&
    ['muscular_defined', 'lean_toned', 'bulk_mass'].includes(goal)
  ) {
    adjustments.volumeMulDelta += 0.06;
    adjustments.maxExercisesDelta += 1;
  }
  if (adherence != null && adherence < 45) {
    adjustments.volumeMulDelta -= 0.06;
  }
  if (analysis.emphasis === 'cardio_lean' && goal === 'strong_powerful') {
    adjustments.volumeMulDelta -= 0.03;
  }

  if (program && adherence != null && adherence >= 68) {
    const fam = inferScheduleMovementFamilies(program);
    if (analysis.emphasis === 'unknown' || analysis.emphasis === 'hybrid' || analysis.emphasis === 'balanced') {
      if (fam.street >= 2 || fam.pull >= 2) {
        adjustments.templateKeyBoosts.push('tractions pronation', 'dips', 'pompes');
        whyLines.push(
          'Programme actuel bien suivi : on conserve les familles street (tractions, dips, pompes) pour la suite.'
        );
      }
      if (fam.pull >= 1) adjustments.templateKeyBoosts.push('rowing barre', 'rowing haltère');
      if (fam.legs >= 2) adjustments.templateKeyBoosts.push('squat gobelet', 'fentes');
    }
  }

  return adjustments;
}
