/**
 * Heuristiques partagées : réponses du quiz profil → nutrition, libellés programme, indices coach.
 */

import { stretchDrillsCatalog } from '../../data/stretchDrillsCatalog.js';
import { stretchDatabase } from '../../data/stretchDatabase.js';
import {
  buildCircuitGuidanceFromStyles,
  hasCircuitTrainingStyle,
  normalizeCircuitTrainingStyles
} from './circuitTrainingStyleUtils';
import { buildProgramDescriptionFromQuiz as buildProgramDescriptionFromSchedule } from './quizProgramPresentation';

/** Créneaux activés par choix explicite au quiz (`stretchDistribution`). */
export const STRETCH_DISTRIBUTION_SLOTS = {
  none_scheduled: [],
  morning_only: ['matin'],
  evening_only: ['soir'],
  morning_evening: ['matin', 'soir'],
  full_day: ['matin', 'midi', 'soir']
};

const STRETCH_DISTRIBUTION_LABELS = {
  none_scheduled: 'Aucun créneau planifié',
  morning_only: 'Matin',
  evening_only: 'Soir',
  morning_evening: 'Matin et soir',
  full_day: 'Matin, midi et soir'
};

const GOAL_TO_NUTRITION = {
  lean_toned: 'cutting',
  muscular_defined: 'lean_bulk',
  strong_powerful: 'bulking',
  balanced_functional: 'maintenance',
  athletic_performance: 'maintenance',
  bulk_mass: 'bulking',
  recomposition: 'lean_bulk',
  endurance_lean: 'cutting'
};

const GOAL_PROGRAM_LABEL = {
  lean_toned: 'Sèche et tonification',
  muscular_defined: 'Hypertrophie définie',
  strong_powerful: 'Force et puissance',
  balanced_functional: 'Condition physique globale',
  athletic_performance: 'Performance athlétique',
  bulk_mass: 'Masse et volume',
  recomposition: 'Recomposition',
  endurance_lean: 'Endurance & masse maigre'
};

export function mapQuizGoalToNutritionGoal(goalPhysique, currentPhysique) {
  let g = GOAL_TO_NUTRITION[goalPhysique] || 'maintenance';
  if (currentPhysique === 'higher_bodyfat' && g === 'maintenance') return 'cutting';
  if (currentPhysique === 'very_slim' && g === 'cutting') return 'maintenance';
  return g;
}

export function getProgramGoalLabel(goalPhysique) {
  return GOAL_PROGRAM_LABEL[goalPhysique] || 'objectif personnalisé';
}

function focusTagsFromAnswers(answers) {
  const m = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  const tags = [];
  if (m.includes('upper_body')) tags.push('haut du corps');
  if (m.includes('lower_body')) tags.push('bas du corps');
  if (m.includes('cardio')) tags.push('cardio');
  const muscleLabels = {
    chest: 'pectoraux',
    back: 'dos',
    shoulders: 'épaules',
    biceps: 'biceps',
    triceps: 'triceps',
    core: 'gainage',
    quads: 'quadriceps',
    hamstrings: 'ischios',
    glutes: 'fessiers',
    calves: 'mollets'
  };
  m.forEach((k) => {
    if (muscleLabels[k]) tags.push(muscleLabels[k]);
  });
  return tags;
}

/**
 * Multiplicateur indicatif du volume cardio suggéré (0.5–1.45) selon désir déclaré, équipement et contexte.
 */
export function computeCardioBiasMultiplier(answers) {
  if (!answers || typeof answers !== 'object') return 1;
  let m = 1;
  const cardio = answers.cardioTrainingDesire;
  const desireMap = {
    minimal: 0.62,
    light: 0.84,
    moderate: 1,
    high: 1.16,
    priority_hiit: 1.3
  };
  m *= desireMap[cardio] ?? 1;

  const eq = Array.isArray(answers.availableEquipment) ? answers.availableEquipment : [];
  const hasMachineCardio =
    eq.includes('treadmill') || eq.includes('rowing_machine') || eq.includes('assault_bike') || eq.includes('elliptical');
  if (eq.includes('jump_rope') && cardio && cardio !== 'minimal') m *= 1.07;
  if (hasMachineCardio && cardio && cardio !== 'minimal') m *= 1.05;

  const pm = Array.isArray(answers.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  if (pm.includes('cardio')) m *= 1.1;

  const act = answers.activityOutsideTraining;
  if (act === 'sedentary' && cardio && cardio !== 'minimal') m *= 1.06;
  if (act === 'very_active' && cardio === 'minimal') m *= 0.93;

  const g = answers.goalPhysique;
  if (g === 'endurance_lean' || g === 'athletic_performance') m *= 1.08;
  if (g === 'bulk_mass' && cardio && cardio !== 'minimal') m *= 0.92;

  return Math.max(0.5, Math.min(1.45, m));
}

/**
 * Petite correction au score « niveau » Récap : habitudes mobilité / souplesse déclarées (réduit si données matures).
 */
export function computeQuizLevelWellnessModifier(answers) {
  if (!answers || typeof answers !== 'object') return 0;
  let x = 0;
  const habit = answers.stretchingHabit;
  if (habit === 'five_plus_week') x += 3;
  else if (habit === 'two_four_week') x += 2;
  else if (habit === 'once_week') x += 1;

  const flex = answers.flexibilityLevel;
  if (flex === 'very_flexible' || flex === 'flexible') x += 1;
  if (flex === 'very_stiff' && (habit === 'never' || habit === 'rarely')) x -= 1;

  const know = answers.stretchingKnowledge;
  if (know === 'confident') x += 1;
  if (know === 'want_guidance') x += 1;

  const cardio = answers.cardioTrainingDesire;
  if (cardio === 'high' || cardio === 'priority_hiit') x += 1;

  return Math.max(-2, Math.min(7, x));
}

/**
 * Créneaux matin / midi / soir à remplir dans le programme, selon `stretchDistribution` (ou défaut selon habit).
 */
export function resolveStretchMomentsFromQuiz(answers) {
  const dist = answers?.stretchDistribution;
  if (dist && Object.prototype.hasOwnProperty.call(STRETCH_DISTRIBUTION_SLOTS, dist)) {
    return [...STRETCH_DISTRIBUTION_SLOTS[dist]];
  }
  const habit = answers?.stretchingHabit;
  if (habit === 'never' || habit === 'rarely') return [];
  if (habit === 'five_plus_week') return ['matin', 'midi', 'soir'];
  return ['matin', 'soir'];
}

export function describeStretchDistributionFromQuiz(answers) {
  const dist = answers?.stretchDistribution;
  if (dist && STRETCH_DISTRIBUTION_LABELS[dist]) return STRETCH_DISTRIBUTION_LABELS[dist];
  const moments = resolveStretchMomentsFromQuiz(answers);
  if (!moments.length) return 'Aucun créneau (déduit du quiz)';
  const labels = { matin: 'matin', midi: 'midi', soir: 'soir' };
  return moments.map((m) => labels[m] || m).join(', ');
}

/**
 * Textes d’étirements à injecter dans le planning (matin / midi / soir) selon quiz.
 */
export function buildQuizStretchingBlocks(answers) {
  const enabledMoments = resolveStretchMomentsFromQuiz(answers);
  const habit = answers?.stretchingHabit || 'once_week';
  const flex = answers?.flexibilityLevel || 'average';
  const know = answers?.stretchingKnowledge || 'some_gaps';

  const stiff = flex === 'very_stiff' || flex === 'below_avg';
  const needsGuidance = know === 'want_guidance' || know === 'unsure';

  let morningDur = '5–7 min';
  let morningTxt =
    'Échauffement articulaire léger : rotations épaules, cercles hanches, chevilles ; puis 2 étirements statiques doux (ischios + dos) ~25–35 s chacun sans rebond.';

  if (habit === 'never' || habit === 'rarely') {
    morningDur = '6–8 min';
    morningTxt =
      'Objectif : poser une routine courte et répétable. Même séquence chaque jour : 3 min marche sur place ou montées genoux, puis mollets / quadriceps / fessiers au mur (25–30 s), respiration calme.';
  } else if (habit === 'five_plus_week') {
    morningDur = '4–6 min';
    morningTxt =
      'Entretien : mobilité thoracique + fentes statiques légères + chaîne postérieure ; garde des amplitudes modérées si tu t’entraînes lourd dans la journée.';
  }

  if (stiff) {
    morningTxt += ' Ta souplesse est basse au quiz : évite les positions extrêmes, augmente progressivement l’amplitude sur 2–3 semaines.';
  }
  if (needsGuidance) {
    morningTxt +=
      ' Priorité technique : un seul exercice bien dosé vaut mieux que cinq mal exécutés — suis les consignes texte de l’app jour par jour.';
  }

  const middayDur = '4–6 min';
  let middayTxt =
    'Micro-session : épaules (traverse bras poitrine), fléchisseurs hanche debout, rotation douce du tronc. Idéal si posture assise longue.';

  const eveningDur = '8–12 min';
  let eveningTxt =
    'Récup : chaîne postérieure (ischios allongé ou debout), pectoraux au cadre de porte, mollets marche. Après séance muscu ou journée statique.';

  if (flex === 'very_flexible') {
    eveningTxt +=
      ' Tu t’es déclaré très souple : privilégie le contrôle et la stabilité plutôt que pousser les splits au maximum.';
  }

  const emptyBlock = { duration: '', instructions: '' };
  return {
    enabledMoments,
    morning: enabledMoments.includes('matin')
      ? { duration: morningDur, instructions: morningTxt }
      : emptyBlock,
    midday: enabledMoments.includes('midi')
      ? { duration: middayDur, instructions: middayTxt }
      : emptyBlock,
    evening: enabledMoments.includes('soir')
      ? { duration: eveningDur, instructions: eveningTxt }
      : emptyBlock
  };
}

/**
 * Repères volume d’exercices, séries, reps, circuits et cardio de fin — pour préremplir le planning.
 */
export function buildQuizTrainingSessionBlueprint(answers) {
  if (!answers || typeof answers !== 'object') {
    return {
      exercisesPerSession: '5–7 ex.',
      setsHint: '3 séries / exo de base',
      repRange: '8–12',
      circuitGuidance: 'Option : 1 mini-circuit en fin de séance si la forme du jour suit.',
      cardioFinisherHint: 'Fin de séance : 6–10 min cardio modéré (vélo, marche inclinée ou corde en intervalles si dispo).'
    };
  }

  const exp = answers.experienceLevel;
  const dur = answers.preferredSessionDuration;
  const circuitStyles = normalizeCircuitTrainingStyles(answers.circuitTrainingStyle);
  const goal = answers.goalPhysique;

  let lo = 5;
  let hi = 8;
  if (exp === 'beginner_total' || exp === 'beginner_0_3m') {
    lo = 4;
    hi = 6;
  } else if (exp === 'expert_3y_plus' || exp === 'advanced_1_3y') {
    lo = 6;
    hi = 11;
  }
  if (dur === '15_30') {
    hi = Math.min(hi, 6);
    lo = Math.min(lo, 4);
  } else if (dur === '60_90') {
    hi += 2;
    lo += 1;
  }

  let setsHint = '3 séries / exercice de base (ajuste au RPE)';
  let repRange = '8–12';
  if (goal === 'strong_powerful') {
    setsHint = '3–4 séries / gros mouvement ; accessoires 2–3 séries';
    repRange = '4–8 (force) / 8–12 (accessoires)';
  } else if (goal === 'lean_toned' || goal === 'muscular_defined') {
    repRange = '8–15 selon exo';
  } else if (goal === 'endurance_lean') {
    repRange = '12–20 ou temps sous tension sur certains blocs';
  }

  const circuitGuidance = buildCircuitGuidanceFromStyles(circuitStyles);

  if (hasCircuitTrainingStyle(circuitStyles, 'love_circuits')) {
    hi = Math.min(hi + 1, 12);
  }
  if (
    hasCircuitTrainingStyle(circuitStyles, 'like_supersets') ||
    hasCircuitTrainingStyle(circuitStyles, 'ok_finisher')
  ) {
    hi = Math.min(hi + 1, 11);
  }
  if (
    circuitStyles.length === 1 &&
    hasCircuitTrainingStyle(circuitStyles, 'prefer_straight')
  ) {
    setsHint = '3–4 séries / exercice, repos complet entre séries (force / hypertrophie classique)';
  }

  const bias = computeCardioBiasMultiplier(answers);
  const cLo = Math.max(4, Math.round(5 * bias));
  const cHi = Math.max(cLo + 2, Math.round(14 * bias));
  const eq = Array.isArray(answers.availableEquipment) ? answers.availableEquipment : [];
  let cardioFinisherHint = `Fin de séance : ${cLo}–${cHi} min cardio modéré`;
  if (eq.includes('jump_rope')) {
    cardioFinisherHint += ' — corde : 6×(30 s effort / 30 s facile) si les chevilles tolèrent';
  } else if (eq.includes('rowing_machine')) {
    cardioFinisherHint += ' — rameur : 2×4 min tempo régulier';
  } else if (eq.includes('treadmill')) {
    cardioFinisherHint += ' — tapis : marche inclinée ou jog léger';
  } else if (eq.includes('assault_bike') || eq.includes('elliptical')) {
    cardioFinisherHint += ' — vélo / elliptique : intervalles courts modérés';
  } else {
    cardioFinisherHint += ' — marche rapide ou montées de genoux si peu de matériel';
  }
  if (answers.cardioTrainingDesire === 'minimal') {
    cardioFinisherHint = 'Cardio minimal au quiz : 3–6 min très légers en fin de séance ou séance dédiée courte 1×/sem.';
  }

  return {
    exercisesPerSession: `${lo}–${hi} ex. cibles (à ajuster dans l’éditeur)`,
    setsHint,
    repRange,
    circuitGuidance,
    cardioFinisherHint
  };
}

export function buildProgramPrefillHints(answers) {
  const tags = focusTagsFromAnswers(answers);
  const equip = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];
  const loc = Array.isArray(answers?.trainingLocation)
    ? answers.trainingLocation
    : answers?.trainingLocation
      ? [answers.trainingLocation]
      : [];
  const current = answers?.currentPhysique || null;
  return {
    focusTags: tags,
    equipmentKeys: equip,
    trainingLocation: loc,
    currentPhysique: current,
    stretchingHabit: answers?.stretchingHabit || null,
    stretchingKnowledge: answers?.stretchingKnowledge || null,
    stretchDistribution: answers?.stretchDistribution || null,
    flexibilityLevel: answers?.flexibilityLevel || null,
    cardioTrainingDesire: answers?.cardioTrainingDesire || null,
    circuitTrainingStyle: normalizeCircuitTrainingStyles(answers?.circuitTrainingStyle),
    exerciseTypePreferences: Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences : [],
    cardioBias: computeCardioBiasMultiplier(answers),
    hasJumpRope: equip.includes('jump_rope')
  };
}

/** @deprecated Préférer `quizProgramPresentation.buildProgramDescriptionFromQuiz(answers, schedule)`. */
export function buildProgramDescriptionFromQuiz(answers, suggestedDaysOrSchedule) {
  if (
    suggestedDaysOrSchedule &&
    typeof suggestedDaysOrSchedule === 'object' &&
    !Array.isArray(suggestedDaysOrSchedule)
  ) {
    return buildProgramDescriptionFromSchedule(answers, suggestedDaysOrSchedule);
  }
  const goal = getProgramGoalLabel(answers?.goalPhysique || 'balanced_functional').toLowerCase();
  const days = Array.isArray(suggestedDaysOrSchedule) ? suggestedDaysOrSchedule.length : 0;
  if (days > 0) {
    return `Programme ${goal} sur ${days} jour${days > 1 ? 's' : ''} par semaine, généré depuis ton profil quiz.`;
  }
  return `Programme ${goal} généré depuis ton profil quiz.`;
}

export function shouldInjectPlyometricsFromQuiz(answers) {
  if (!answers || typeof answers !== 'object') return false;
  const priorities = Array.isArray(answers.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  const cardioDesire = answers.cardioTrainingDesire;
  const goal = answers.goalPhysique;
  const typePrefs = Array.isArray(answers.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];
  const hasCardioPriority = priorities.includes('cardio');
  return (
    hasCardioPriority ||
    typePrefs.includes('plyometrics') ||
    cardioDesire === 'high' ||
    cardioDesire === 'priority_hiit' ||
    goal === 'athletic_performance' ||
    goal === 'endurance_lean'
  );
}

function pickTargetBmiByGoal(goal) {
  const byGoal = {
    lean_toned: 22.2,
    muscular_defined: 23.2,
    strong_powerful: 24.2,
    balanced_functional: 22.8,
    athletic_performance: 22.6,
    bulk_mass: 25.0,
    recomposition: 22.5,
    endurance_lean: 21.6
  };
  return byGoal[goal] || 22.8;
}

/**
 * Estime un poids cible prudent (kg) via IMC cible modulé par l’objectif.
 * Utilisé comme suggestion (pas médical).
 */
export function estimateTargetWeightFromQuiz(answers) {
  const vitals = answers?.vitalsSelfReport || {};
  const heightCm = Number(vitals.heightCm);
  if (!Number.isFinite(heightCm) || heightCm < 120 || heightCm > 230) return null;
  const h = heightCm / 100;
  let bmi = pickTargetBmiByGoal(answers?.goalPhysique);

  const exp = answers?.experienceLevel;
  if (exp === 'expert_3y_plus' || exp === 'advanced_1_3y') bmi += 0.3;
  if (answers?.cardioTrainingDesire === 'priority_hiit' || answers?.goalPhysique === 'endurance_lean') bmi -= 0.3;
  bmi = Math.max(20.5, Math.min(25.5, bmi));

  const kg = bmi * h * h;
  return Math.round(kg * 10) / 10;
}

export function resolveTargetWeightFromQuiz(answers) {
  const vitals = answers?.vitalsSelfReport || {};
  const mode = String(vitals?.targetWeightMode || 'none');
  const manual = Number(vitals?.targetWeightKg);
  if (mode === 'manual' && Number.isFinite(manual) && manual >= 30 && manual <= 250) return manual;
  if (mode === 'auto') return estimateTargetWeightFromQuiz(answers);
  return null;
}

function levelFromExperience(experienceLevel) {
  if (experienceLevel === 'beginner_total' || experienceLevel === 'beginner_0_3m') return 'beginner';
  if (experienceLevel === 'intermediate_3_12m') return 'intermediate';
  return 'advanced';
}

export function buildQuizPlyometricTemplate(answers) {
  const lvl = levelFromExperience(answers?.experienceLevel);
  if (lvl === 'beginner') {
    return [
      {
        id: 'quiz_plyo_sauts_sur_place',
        name: 'Pliométrie — sauts sur place débutant',
        series: '3×20 sec',
        rest: 45,
        intensity: 'light'
      },
      {
        id: 'quiz_plyo_line_hops',
        name: 'Pliométrie — sauts latéraux sur ligne',
        series: '3×20 sec',
        rest: 45,
        intensity: 'light'
      }
    ];
  }
  if (lvl === 'intermediate') {
    return [
      {
        id: 'quiz_plyo_squat_jumps',
        name: 'Pliométrie — squat jumps contrôlés',
        series: '4×8',
        rest: 60,
        intensity: 'moderate'
      },
      {
        id: 'quiz_plyo_skater',
        name: 'Pliométrie — skater jumps',
        series: '4×10/ côté',
        rest: 60,
        intensity: 'moderate'
      }
    ];
  }
  return [
    {
      id: 'quiz_plyo_depth_jump',
      name: 'Pliométrie — depth jump + rebond',
      series: '5×5',
      rest: 90,
      intensity: 'heavy'
    },
    {
      id: 'quiz_plyo_bounds',
      name: 'Pliométrie — bounds alternés',
      series: '4×20 m',
      rest: 75,
      intensity: 'heavy'
    }
  ];
}

/** Drills course suggérés en fin de quiz (même logique que la pliométrie). */
export function shouldInjectDrillsFromQuiz(answers) {
  if (!answers || typeof answers !== 'object') return false;
  const typePrefs = Array.isArray(answers.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];
  if (typePrefs.includes('cardio_endurance')) return true;
  if (shouldInjectPlyometricsFromQuiz(answers)) return true;
  const goal = answers.goalPhysique;
  return goal === 'athletic_performance' || goal === 'endurance_lean';
}

function resolveMaxDrillDifficulty(answers) {
  const lvl = levelFromExperience(answers?.experienceLevel);
  let max = lvl === 'beginner' ? 2 : lvl === 'intermediate' ? 3 : 4;
  const cardio = answers?.cardioTrainingDesire;
  if (cardio === 'minimal') max = Math.max(1, max - 1);
  if (cardio === 'high' || cardio === 'priority_hiit') max = Math.min(4, max + 1);
  if (answers?.experienceLevel === 'beginner_total') max = Math.min(max, 2);
  return max;
}

function drillIntensityLabel(difficulty) {
  const d = Number(difficulty) || 2;
  if (d <= 1) return 'light';
  if (d <= 2) return 'moderate';
  if (d <= 3) return 'moderate';
  return 'heavy';
}

function drillRestSec(difficulty) {
  const d = Number(difficulty) || 2;
  if (d <= 1) return 30;
  if (d <= 2) return 40;
  if (d <= 3) return 50;
  return 60;
}

function formatDrillSeries(drill) {
  const sec = Math.max(15, Math.min(90, Number(drill?.defaultDuration) || 30));
  const d = Number(drill?.difficulty) || 2;
  const sets = d <= 1 ? 2 : d <= 2 ? 3 : 4;
  return `${sets}×${sec} sec`;
}

function pickSpreadDrillEntries(entries, count) {
  if (!entries.length || count <= 0) return [];
  if (entries.length <= count) return entries;
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const idx = Math.round((i * (entries.length - 1)) / Math.max(1, count - 1));
    const pick = entries[idx];
    if (pick && !out.some(([id]) => id === pick[0])) out.push(pick);
  }
  let cursor = 0;
  while (out.length < count && cursor < entries.length) {
    const pick = entries[cursor];
    if (!out.some(([id]) => id === pick[0])) out.push(pick);
    cursor += 1;
  }
  return out.slice(0, count);
}

/**
 * Sélectionne des drills banque (difficulté 1–4) selon expérience et envie cardio du quiz.
 */
export function buildQuizDrillTemplate(answers) {
  const maxDiff = resolveMaxDrillDifficulty(answers);
  const lvl = levelFromExperience(answers?.experienceLevel);
  const count = lvl === 'beginner' ? 2 : lvl === 'intermediate' ? 3 : 3;

  const pool = Object.entries(stretchDrillsCatalog)
    .filter(([, v]) => v?.category === 'Drills course')
    .filter(([, v]) => (Number(v?.difficulty) || 2) <= maxDiff)
    .sort((a, b) => (Number(a[1]?.difficulty) || 2) - (Number(b[1]?.difficulty) || 2));

  const picked = pickSpreadDrillEntries(pool, count);
  return picked.map(([stretchKey, drill]) => ({
    id: `quiz_${stretchKey}`,
    stretchKey,
    name: drill.name,
    series: formatDrillSeries(drill),
    rest: drillRestSec(drill.difficulty),
    intensity: drillIntensityLabel(drill.difficulty),
    difficulty: Number(drill.difficulty) || 2
  }));
}

const LOC_LABEL = {
  commercial_gym: 'salle commerciale',
  home_gym: 'home gym',
  home_minimal: 'domicile léger',
  outdoor: 'extérieur',
  track: 'piste d’athlétisme'
};

function locationTrainingSentence(loc) {
  const arr = Array.isArray(loc) ? loc : loc ? [loc] : [];
  if (!arr.length) return '';
  const labels = arr.map((x) => LOC_LABEL[x] || x);
  return `Lieu(x) d’entraînement : ${labels.join(', ')}.`;
}

function buildTrainingStyleSentence(answers) {
  const tried = Array.isArray(answers?.triedTrainingStyles) ? answers.triedTrainingStyles : [];
  if (!tried.length) return '';
  const map = {
    bodybuilding: 'muscu classique',
    calisthenics: 'callisthénie',
    crossfit: 'CrossFit',
    functional: 'force athlétique',
    hiit_cardio: 'HIIT / cardio',
    running_road: 'course route',
    running_trail: 'trail',
    running_track: 'course sur piste',
    sprint_track: 'sprint',
    none: 'parcours novice'
  };
  const bits = tried.filter((k) => k !== 'none').map((k) => map[k] || k);
  if (!bits.length && tried.includes('none')) return 'Historique : peu de formats structurés — privilégier la régularité.';
  return `Styles déjà essayés : ${bits.join(', ')}.`;
}

/** Ajuste la durée (semaines) proposée à la création de programme selon profil agrégé. */
export function adjustSuggestedProgramWeeks(baseWeeks, answers) {
  let w = Math.round(Number(baseWeeks)) || 6;
  const goal = answers?.goalPhysique;
  const exp = answers?.experienceLevel;
  const stress = answers?.stressLevel;
  const sleep = answers?.sleepQuality;
  if (goal === 'recomposition' || goal === 'lean_toned') w += 1;
  if (goal === 'bulk_mass' || goal === 'strong_powerful') w += 2;
  if (goal === 'endurance_lean' || (Array.isArray(answers?.priorityMuscleGroups) && answers.priorityMuscleGroups.includes('cardio')))
    w += 1;
  if (exp === 'beginner_total' || exp === 'beginner_0_3m') w = Math.min(w, 8);
  if (exp === 'expert_3y_plus') w = Math.max(w, 8);
  if (stress === 'very_high' || stress === 'high' || sleep === 'poor' || sleep === 'below_average') w = Math.max(4, w - 2);
  if (
    hasCircuitTrainingStyle(answers?.circuitTrainingStyle, 'love_circuits') ||
    answers?.cardioTrainingDesire === 'priority_hiit'
  ) {
    w += 1;
  }
  if (answers?.stretchingHabit === 'never' || answers?.stretchingHabit === 'rarely') w = Math.max(3, w - 1);
  return Math.max(3, Math.min(16, w));
}

/**
 * Phrases actionnables pour le Récap (suggestions) — couverture large des combinaisons fréquentes.
 * @param {Record<string, unknown>} answers
 * @returns {{ kind: string, text: string }[]}
 */
export function buildQuizDerivedSuggestionTexts(answers) {
  if (!answers || typeof answers !== 'object') return [];
  const out = [];
  const g = answers.goalPhysique;
  const cur = answers.currentPhysique;
  const pm = Array.isArray(answers.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  const eq = Array.isArray(answers.availableEquipment) ? answers.availableEquipment : [];
  const loc = Array.isArray(answers.trainingLocation)
    ? answers.trainingLocation
    : answers.trainingLocation
      ? [answers.trainingLocation]
      : [];
  const exp = answers.experienceLevel;
  const freq = answers.weeklyTrainingFrequencyCurrent;
  const styles = Array.isArray(answers.triedTrainingStyles) ? answers.triedTrainingStyles : [];
  const sleep = answers.sleepQuality;
  const stress = answers.stressLevel;
  const act = answers.activityOutsideTraining;
  const dur = answers.preferredSessionDuration;
  const vit = answers.vitalsSelfReport && typeof answers.vitalsSelfReport === 'object' ? answers.vitalsSelfReport : null;

  if (pm.includes('cardio')) {
    out.push({
      kind: 'quiz_cardio_focus',
      text: 'Priorité cardio au quiz : viser 1–2 sorties modérées / semaine en complément de la muscu aide la condition sans saturer la récup.'
    });
  }
  if (pm.includes('upper_body') !== pm.includes('lower_body')) {
    out.push({
      kind: 'quiz_split_focus',
      text: 'Priorité haut ou bas du corps : alterner blocs ciblés et mouvements polyarticulaires équilibre fatigue et volume.'
    });
  }

  if (g === 'recomposition' && cur === 'higher_bodyfat') {
    out.push({
      kind: 'quiz_goal_recomp_fat',
      text: 'Objectif recomposition + profil actuel « plus de masse grasse » : vise une progression lente (charge modérée, pas mal de pas / cardio léger) et une nutrition alignée (Récap nutrition).'
    });
  }
  if (g === 'lean_toned' && cur === 'very_slim') {
    out.push({
      kind: 'quiz_lean_slim',
      text: 'Objectif sec/tonique alors que tu es déjà très fin : priorité force et qualité musculaire plutôt qu’agressivité calorique.'
    });
  }
  if (g === 'bulk_mass' && pm.includes('cardio')) {
    out.push({
      kind: 'quiz_bulk_cardio',
      text: 'Masse + priorité cardio : garde 1–2 séances cardio courtes pour ne pas grignoter la récup nécessaire à l’hypertrophie.'
    });
  }
  if (pm.includes('upper_body') && pm.includes('lower_body')) {
    out.push({
      kind: 'quiz_split_full',
      text: 'Haut et bas du corps cochés : alterne demi-journées « push/pull + jambes » ou split classique 4 j pour éviter les séances trop longues.'
    });
  }
  if (loc.includes('home_minimal') && !eq.includes('dumbbells') && !eq.includes('resistance_bands')) {
    out.push({
      kind: 'quiz_home_min',
      text: 'Domicile léger sans haltères ni bandes : programmes type callisthénie / volume modéré ; ajoute bandes ou haltères si tu peux pour diversifier.'
    });
  }
  if (loc.includes('commercial_gym') && eq.length >= 5) {
    out.push({
      kind: 'quiz_gym_rich',
      text: 'Salle riche en matériel : exploite machines et câbles pour isoler les groupes que tu as cochés en priorité.'
    });
  }
  if (loc.includes('track') && (pm.includes('cardio') || g === 'athletic_performance' || g === 'endurance_lean')) {
    out.push({
      kind: 'quiz_track_running',
      text: 'Piste d’athlétisme cochée : intègre 1 séance piste dédiée (sprints techniques ou intervalles) selon ton niveau.'
    });
  }
  if (freq === '0' || freq === '1_2') {
    out.push({
      kind: 'quiz_low_freq',
      text: 'Fréquence actuelle faible au quiz : préfère des séances complètes mais espacées plutôt qu’un planning irréaliste 5×/sem.'
    });
  }
  if (freq === '5_6' || freq === '7') {
    out.push({
      kind: 'quiz_high_freq',
      text: 'Fréquence élevée déclarée : prévois des semaines légères ou du volume technique pour limiter le surentraînement.'
    });
  }
  if (styles.includes('calisthenics') && pm.some((x) => ['chest', 'back', 'shoulders'].includes(x))) {
    out.push({
      kind: 'quiz_cali_upper',
      text: 'Passif callisthénie + haut du corps : traction/dips/progression pompes restent des leviers efficaces selon ton équipement.'
    });
  }
  if (styles.includes('hiit_cardio') && g === 'endurance_lean') {
    out.push({
      kind: 'quiz_hiit_endurance',
      text: 'HIIT/cardio déjà pratiqué + objectif endurance : enchaîne qualité de course/rameur et 2 séances de force pour garder le muscle.'
    });
  }
  if (sleep === 'poor' || sleep === 'below_average') {
    out.push({
      kind: 'quiz_sleep',
      text: 'Sommeil faible au quiz : la progression tient souvent plus au sommeil qu’à un volume supplémentaire — protège 1–2 nuits propres/semaine.'
    });
  }
  if (stress === 'very_high' || stress === 'high') {
    out.push({
      kind: 'quiz_stress',
      text: 'Stress élevé déclaré : séances un peu plus courtes ou RPE modéré peuvent mieux coller à ta récup réelle.'
    });
  }
  if (act === 'sedentary' && (pm.includes('cardio') || g === 'endurance_lean')) {
    out.push({
      kind: 'quiz_sedentary_cardio',
      text: 'Sédentarité hors sport + objectif cardio : intègre des blocs de marche ou vélo facile en complément des séances structurées.'
    });
  }
  if (dur === '15_30' && (g === 'bulk_mass' || g === 'strong_powerful')) {
    out.push({
      kind: 'quiz_short_bulk',
      text: 'Séances courtes (15–30 min) mais objectif masse/force : privilégie composés lourds et peu d’isolation par séance.'
    });
  }
  if (vit?.weightKg && vit?.heightCm) {
    const bmi = vit.weightKg / Math.pow(vit.heightCm / 100, 2);
    if (Number.isFinite(bmi) && bmi >= 30) {
      out.push({
        kind: 'quiz_bmi_high',
        text: 'IMC estimé élevé d’après ton quiz : progression douce (volume, articulations) et suivi nutrition cohérent avec ton objectif.'
      });
    } else if (Number.isFinite(bmi) && bmi < 18.5) {
      out.push({
        kind: 'quiz_bmi_low',
        text: 'IMC estimé bas : attention à l’énergie disponible pour la force — ajuste charge et récupération.'
      });
    }
  }
  if (exp === 'beginner_total' && g === 'athletic_performance') {
    out.push({
      kind: 'quiz_novice_perf',
      text: 'Débutant + performance athlétique : base technique et condition générale avant la spécialisation (sprints, agilité).'
    });
  }

  const stretchH = answers.stretchingHabit;
  const stretchK = answers.stretchingKnowledge;
  const flexL = answers.flexibilityLevel;
  const cardioD = answers.cardioTrainingDesire;
  const circuitStyles = normalizeCircuitTrainingStyles(answers.circuitTrainingStyle);

  if (stretchH === 'never' || stretchH === 'rarely') {
    out.push({
      kind: 'quiz_stretch_low',
      text: 'Peu d’étirements déclarés au quiz : des blocs courts après échauffement (souplesse + confort articulaire) aident souvent la récup sans alourdir la séance.'
    });
  } else if (stretchH === 'five_plus_week') {
    out.push({
      kind: 'quiz_stretch_high',
      text: 'Bonne fréquence d’étirement déclarée : garde des amplitudes contrôlées les jours de charges lourdes pour ne pas cumuler fatigue passive.'
    });
  }
  if (stretchK === 'want_guidance' || stretchK === 'unsure') {
    out.push({
      kind: 'quiz_stretch_edu',
      text: 'Tu as demandé plus de guidage étirements : l’app peut proposer des séquences simples (30 s / groupe, sans rebond) — utile surtout après effort ou longues positions assises.'
    });
  }
  const stretchDist = answers?.stretchDistribution;
  if (stretchDist === 'morning_only') {
    out.push({
      kind: 'quiz_stretch_morning',
      text: 'Étirements planifiés le matin uniquement : privilégie mobilité douce et respiration avant les charges lourdes de la journée.'
    });
  } else if (stretchDist === 'evening_only') {
    out.push({
      kind: 'quiz_stretch_evening',
      text: 'Étirements planifiés le soir : idéal en récup après séance ou journée statique — amplitudes modérées, sans rebond.'
    });
  } else if (stretchDist === 'full_day') {
    out.push({
      kind: 'quiz_stretch_full',
      text: 'Routine matin / midi / soir : garde chaque bloc court (4–8 min) pour que le volume total reste soutenable.'
    });
  }
  if (flexL === 'very_stiff') {
    out.push({
      kind: 'quiz_flex_stiff',
      text: 'Souplesse « très raide » au quiz : progresse par petites étapes sur l’amplitude plutôt que forcer les positions extrêmes.'
    });
  }
  if (cardioD === 'minimal' && pm.includes('cardio')) {
    out.push({
      kind: 'quiz_cardio_conflict',
      text: 'Priorité cardio cochée mais volume cardio souhaité minimal : privilégie la marche active ou de courtes sessions dédiées 1–2×/sem.'
    });
  }
  if (cardioD === 'priority_hiit' && (eq.includes('jump_rope') || eq.includes('assault_bike'))) {
    out.push({
      kind: 'quiz_hiit_tools',
      text: 'HIIT prioritaire + corde ou air bike dispo : intervalles courts (20–40 s) bien dosés après échauffement, pas en début de séance froide.'
    });
  }
  if (eq.includes('jump_rope') && cardioD && cardioD !== 'minimal') {
    out.push({
      kind: 'quiz_jump_rope',
      text: 'Corde à sauter disponible : excellent complément cardio compact — alterne avec mobilité chevilles pour limiter les tensions.'
    });
  }
  if (
    hasCircuitTrainingStyle(circuitStyles, 'love_circuits') &&
    (exp === 'beginner_total' || exp === 'beginner_0_3m')
  ) {
    out.push({
      kind: 'quiz_circuit_novice',
      text: 'Tu aimes les circuits mais débutant au quiz : commence par 3 mouvements simples et un tour de moins que ton instinct, puis augmente.'
    });
  }
  if (
    hasCircuitTrainingStyle(circuitStyles, 'prefer_straight') &&
    hasCircuitTrainingStyle(circuitStyles, 'love_circuits')
  ) {
    out.push({
      kind: 'quiz_mixed_density',
      text: 'Séries droites + circuits cochés : place le circuit en fin de séance ou sur un jour dédié pour ne pas griller la force du début.'
    });
  }
  if (
    hasCircuitTrainingStyle(circuitStyles, 'prefer_straight') &&
    g === 'endurance_lean' &&
    !hasCircuitTrainingStyle(circuitStyles, 'love_circuits')
  ) {
    out.push({
      kind: 'quiz_straight_endurance',
      text: 'Endurance + séries droites préférées : cardio continu ou tempo modéré en fin de séance plutôt que beaucoup de transitions courtes.'
    });
  }
  if (
    hasCircuitTrainingStyle(circuitStyles, 'like_supersets') &&
    hasCircuitTrainingStyle(circuitStyles, 'ok_finisher')
  ) {
    out.push({
      kind: 'quiz_superset_finisher',
      text: 'Supersets + finisher : garde le finisher très court (≤ 6 min) après les supersets pour limiter la fatigue nerveuse.'
    });
  }

  return out.slice(0, 10);
}
