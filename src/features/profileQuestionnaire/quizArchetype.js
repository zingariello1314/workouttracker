/**
 * Archétypes = déformateurs de génération (pas des semaines types).
 */

import { allowsSameDayCardioAddon } from './quizSitePolicy';

/** @typedef {import('./quizCoachPipeline').ArchetypeDeformers} ArchetypeDeformers */

function baseDeformers() {
  return {
    volumeMul: 1,
    maxActiveDaysCap: null,
    maxDedicatedCardioDays: null,
    maxHeavyBlocksPerSession: 2,
    maxExercisesPerSession: 7,
    maxEffectiveSetsPerSession: 25,
    maxNervousStressDaysPerWeek: 2,
    maxPullingPatternsPerSession: 3,
    allowPlyo: true,
    allowFractionné: true,
    allowDrills: true,
    allowCircuits: true,
    allowSameDayCardioAddon: 'from_quiz',
    singleModalityPerDay: true,
    preferredGroupWeights: { upper: 1, lower: 1, core: 1, cardio: 1 }
  };
}

const ARCHETYPE_DEFS = {
  hybrid_street_home_strict: {
    id: 'hybrid_street_home_strict',
    generationMode: 'balanced',
    philosophy: [
      'Un type de séance par jour (street, maison ou cardio).',
      'Priorité à la clarté et à la récupération entre lieux.'
    ],
    deformers: {
      singleModalityPerDay: true,
      siteFamilyRotation: 'strict',
      maxDedicatedCardioDays: 3,
      maxNervousStressDaysPerWeek: 2,
      preferredGroupWeights: { upper: 1.1, lower: 1, core: 1, cardio: 1.05 }
    },
    why: [
      'Tu t’entraînes à plusieurs endroits : chaque jour reste sur un seul lieu pour la partie force.',
      'Le cardio est regroupé sur des jours dédiés ou en fin de séance si tu l’as choisi au quiz.'
    ],
    scoreBoost: (c, a) => {
      let s = 0;
      const loc = Array.isArray(a?.trainingLocation) ? a.trainingLocation : [];
      if (loc.includes('outdoor') && (loc.includes('home_minimal') || loc.includes('home_gym'))) s += 5;
      if (c.recoveryScore >= 50) s += 2;
      return s;
    }
  },
  hybrid_street_home_dense: {
    id: 'hybrid_street_home_dense',
    generationMode: 'performance_hybrid',
    philosophy: [
      'Volume et variété street + maison tolérés si récupération suffisante.',
      'Finisher core possible ; cardio selon préférences.'
    ],
    deformers: {
      volumeMul: 1.08,
      maxExercisesPerSession: 8,
      maxDedicatedCardioDays: 4,
      maxNervousStressDaysPerWeek: 3,
      preferredGroupWeights: { upper: 1.15, lower: 1, core: 1.1, cardio: 1.15 }
    },
    why: [
      'Profil compatible avec un rythme soutenu (street, maison et cardio bien séparés).',
      'Structure calibrée sur une pratique hybride régulière — à alléger si la fatigue s’accumule.'
    ],
    scoreBoost: (c, a) => {
      if (!c.performanceHybridEligible) return -20;
      let s = 8;
      if (c.recoveryScore >= 70) s += 4;
      if (c.adherenceRisk < 0.45) s += 3;
      const cardio = a?.cardioTrainingDesire;
      if (cardio === 'high' || cardio === 'priority_hiit' || cardio === 'moderate') s += 2;
      return s;
    }
  },
  street_intermediate: {
    id: 'street_intermediate',
    generationMode: 'balanced',
    philosophy: ['Force relative et répétition des mouvements de base.', 'Peu de matériel salle.'],
    deformers: {
      maxPullingPatternsPerSession: 3,
      maxHeavyBlocksPerSession: 2,
      maxDedicatedCardioDays: 2,
      preferredGroupWeights: { upper: 1.2, lower: 0.9, core: 1.1, cardio: 1 }
    },
    why: [
      'Priorité street workout : tirage, poussée et gainage avec progression sur les bases.',
      'Volume tirage limité par séance pour protéger coudes et épaules.'
    ],
    scoreBoost: (c, a) => {
      const loc = Array.isArray(a?.trainingLocation) ? a.trainingLocation : [];
      const eq = Array.isArray(a?.availableEquipment) ? a.availableEquipment : [];
      let s = 0;
      if (loc.includes('outdoor') || loc.includes('track')) s += 4;
      if (eq.includes('pullup_bar') || eq.includes('parallel_bars')) s += 3;
      const styles = Array.isArray(a?.triedTrainingStyles) ? a.triedTrainingStyles : [];
      if (styles.includes('calisthenics')) s += 3;
      if (loc.includes('commercial_gym') && !loc.includes('outdoor')) s -= 3;
      return s;
    }
  },
  gym_hypertrophy_5d: {
    id: 'gym_hypertrophy_5d',
    generationMode: 'balanced',
    philosophy: ['Hypertrophie et composés en salle.', 'Peu de street si salle dominante.'],
    deformers: {
      maxActiveDaysCap: 5,
      maxExercisesPerSession: 8,
      preferredGroupWeights: { upper: 1.15, lower: 1.2, core: 0.9, cardio: 0.7 }
    },
    why: [
      'Profil orienté salle : volume sur composés et machines selon ton matériel.',
      'Cardio léger en complément si prévu au quiz.'
    ],
    scoreBoost: (c, a) => {
      const loc = Array.isArray(a?.trainingLocation) ? a.trainingLocation : [];
      let s = 0;
      if (loc.includes('commercial_gym')) s += 6;
      if (loc.includes('home_gym')) s += 3;
      const g = a?.goalPhysique;
      if (g === 'muscular_defined' || g === 'bulk_mass') s += 3;
      if (loc.includes('outdoor') && !loc.includes('commercial_gym')) s -= 4;
      return s;
    }
  },
  busy_minimum: {
    id: 'busy_minimum',
    generationMode: 'minimal_viable',
    philosophy: ['Séances courtes, peu d’exercices, régularité avant tout.'],
    deformers: {
      volumeMul: 0.78,
      exerciseCountMul: 0.75,
      maxActiveDaysCap: 4,
      maxExercisesPerSession: 5,
      maxDedicatedCardioDays: 1,
      allowPlyo: false,
      allowFractionné: false,
      maxNervousStressDaysPerWeek: 1
    },
    why: [
      'Peu de temps par séance : focus sur l’essentiel et des mouvements que tu peux répéter.',
      'Cardio et plio réduits pour garder des séances tenables.'
    ],
    scoreBoost: (c, a) => {
      let s = 0;
      if (a?.preferredSessionDuration === '15_30') s += 8;
      if (c.adherenceRisk >= 0.5) s += 4;
      if (c.maxActiveDays <= 3) s += 3;
      return s;
    }
  },
  recovery_sensitive: {
    id: 'recovery_sensitive',
    generationMode: 'recovery',
    philosophy: ['Charge modérée, stress nerveux limité.', 'Priorité récupération.'],
    deformers: {
      volumeMul: 0.72,
      maxActiveDaysCap: 4,
      maxExercisesPerSession: 5,
      maxDedicatedCardioDays: 2,
      maxNervousStressDaysPerWeek: 1,
      allowPlyo: false,
      allowFractionné: false,
      maxHeavyBlocksPerSession: 1
    },
    why: [
      'Sommeil ou stress au quiz indiquent une récupération limitée : volume et intensité nerveuse réduits.',
      'On garde la régularité plutôt que le volume maximal.'
    ],
    scoreBoost: (c) => {
      let s = 0;
      if (c.recoveryScore < 50) s += 8;
      if (c.forceRecoveryMode) s += 10;
      if (c.adherenceRisk > 0.55) s += 2;
      return s;
    }
  },
  endurance_hybrid: {
    id: 'endurance_hybrid',
    generationMode: 'balanced',
    philosophy: ['Cardio et endurance en tête.', 'Force d’entretien.'],
    deformers: {
      minCardioDays: 2,
      maxDedicatedCardioDays: 4,
      preferredGroupWeights: { upper: 0.9, lower: 1, core: 1, cardio: 1.4 },
      maxExercisesPerSession: 6
    },
    why: [
      'Objectif endurance / cardio : séances dédiées et travail aérobie régulier.',
      'Force maintenue sans surcharge inutile.'
    ],
    scoreBoost: (c, a) => {
      let s = 0;
      const g = a?.goalPhysique;
      if (g === 'endurance_lean' || g === 'athletic_performance') s += 5;
      if (a?.cardioTrainingDesire === 'high' || a?.cardioTrainingDesire === 'priority_hiit') s += 4;
      if (Array.isArray(a?.priorityMuscleGroups) && a.priorityMuscleGroups.includes('cardio')) s += 3;
      return s;
    }
  },
  advanced_street_volume: {
    id: 'advanced_street_volume',
    generationMode: 'performance_hybrid',
    philosophy: ['Volume street élevé si niveau confirmé.', 'Tendons surveillés.'],
    deformers: {
      volumeMul: 1.12,
      maxExercisesPerSession: 8,
      maxPullingPatternsPerSession: 4,
      maxNervousStressDaysPerWeek: 3
    },
    why: [
      'Repères force élevés ou grande expérience : volume street plus ambitieux.',
      'Toujours avec garde-fous sur les articulations (tractions / dips).'
    ],
    scoreBoost: (c, a) => {
      const exp = a?.experienceLevel;
      if (exp === 'beginner_total' || exp === 'beginner_0_3m') return -15;
      let s = 0;
      if (exp === 'expert_3y_plus' || exp === 'advanced_1_3y') s += 5;
      if (c.recoveryScore >= 65) s += 3;
      return s;
    }
  }
};

function mergeDeformers(base, patch) {
  const out = { ...base, ...patch, preferredGroupWeights: { ...base.preferredGroupWeights, ...(patch.preferredGroupWeights || {}) } };
  if (patch.allowSameDayCardioAddon === undefined) out.allowSameDayCardioAddon = base.allowSameDayCardioAddon;
  return out;
}

/**
 * @param {object} answers
 * @param {import('./quizConstraintResolver').ReturnType<typeof import('./quizConstraintResolver').resolveQuizConstraints>} constraints
 */
export function resolveProgramArchetype(answers, constraints) {
  const scores = Object.values(ARCHETYPE_DEFS).map((def) => ({
    def,
    score: 1 + (typeof def.scoreBoost === 'function' ? def.scoreBoost(constraints, answers) : 0)
  }));

  if (constraints.forceRecoveryMode) {
    const rec = scores.find((x) => x.def.id === 'recovery_sensitive');
    if (rec) rec.score += 20;
  }

  scores.sort((a, b) => b.score - a.score);
  const winner = scores[0]?.def || ARCHETYPE_DEFS.hybrid_street_home_strict;

  let deformers = mergeDeformers(baseDeformers(), winner.deformers);
  if (constraints.maxActiveDays != null) {
    deformers.maxActiveDaysCap =
      deformers.maxActiveDaysCap != null
        ? Math.min(deformers.maxActiveDaysCap, constraints.maxActiveDays)
        : constraints.maxActiveDays;
  }
  if (constraints.suppressPlyo) deformers.allowPlyo = false;
  if (constraints.suppressFractionné) deformers.allowFractionné = false;

  let generationMode = winner.generationMode;
  if (constraints.forceRecoveryMode) generationMode = 'recovery';
  else if (winner.id === 'hybrid_street_home_dense' && !constraints.performanceHybridEligible) {
    generationMode = 'balanced';
    deformers.volumeMul = Math.min(deformers.volumeMul, 1);
    deformers.maxNervousStressDaysPerWeek = Math.min(deformers.maxNervousStressDaysPerWeek, 2);
  }

  const whyThisTemplate = [...winner.why];
  if (constraints.warnings?.length) {
    whyThisTemplate.push(constraints.warnings[0]);
  }

  return {
    id: winner.id,
    generationMode,
    philosophy: winner.philosophy,
    deformers,
    whyThisTemplate,
    scoreTable: scores.slice(0, 4).map((x) => ({ id: x.def.id, score: Math.round(x.score) }))
  };
}

export function resolveSameDayCardioFromDeformers(answers, deformers) {
  if (deformers?.allowSameDayCardioAddon === false) return false;
  if (deformers?.allowSameDayCardioAddon === true) return true;
  return allowsSameDayCardioAddon(answers);
}
