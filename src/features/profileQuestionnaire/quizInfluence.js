/**
 * Heuristiques partagées : réponses du quiz profil → nutrition, libellés programme, indices coach.
 */

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

export function buildProgramPrefillHints(answers) {
  const tags = focusTagsFromAnswers(answers);
  const equip = Array.isArray(answers?.availableEquipment) ? answers.availableEquipment : [];
  const loc = answers?.trainingLocation || null;
  const current = answers?.currentPhysique || null;
  return {
    focusTags: tags,
    equipmentKeys: equip,
    trainingLocation: loc,
    currentPhysique: current
  };
}

export function buildProgramDescriptionFromQuiz(answers, suggestedDays) {
  const hints = buildProgramPrefillHints(answers);
  const parts = [];
  if (suggestedDays?.length) parts.push(`Jours disponibles: ${suggestedDays.join(', ')}`);
  if (hints.focusTags.length) parts.push(`Priorités: ${hints.focusTags.join(', ')}`);
  if (hints.equipmentKeys.length) parts.push(`${hints.equipmentKeys.length} type(s) d’équipement`);
  if (hints.currentPhysique) parts.push('Profil actuel pris en compte (quiz)');
  const style = buildTrainingStyleSentence(answers);
  if (style) parts.push(style);
  const loc = locationTrainingSentence(answers?.trainingLocation);
  if (loc) parts.push(loc);
  return parts.length ? `Prérempli via quiz. ${parts.join(' · ')}.` : 'Prérempli via quiz onboarding.';
}

const LOC_LABEL = {
  commercial_gym: 'salle commerciale',
  home_gym: 'home gym',
  home_minimal: 'domicile léger',
  outdoor: 'extérieur'
};

function locationTrainingSentence(loc) {
  if (!loc) return '';
  return `Lieu principal : ${LOC_LABEL[loc] || loc}.`;
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
  const loc = answers.trainingLocation;
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
  if (loc === 'home_minimal' && !eq.includes('dumbbells') && !eq.includes('resistance_bands')) {
    out.push({
      kind: 'quiz_home_min',
      text: 'Domicile léger sans haltères ni bandes : programmes type callisthénie / volume modéré ; ajoute bandes ou haltères si tu peux pour diversifier.'
    });
  }
  if (loc === 'commercial_gym' && eq.length >= 5) {
    out.push({
      kind: 'quiz_gym_rich',
      text: 'Salle riche en matériel : exploite machines et câbles pour isoler les groupes que tu as cochés en priorité.'
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
  return out.slice(0, 8);
}
