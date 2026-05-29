/**
 * Circuits prêts à l’emploi injectés selon le quiz (abdos, métabolique, etc.).
 */

import { normalizeCircuitDefinition, generateCircuitId } from '../../utils/circuits/circuitDefinitionUtils';
import {
  hasCircuitTrainingStyle,
  normalizeCircuitTrainingStyles
} from './circuitTrainingStyleUtils';

const TEMPLATE_ABDOS = {
  name: 'Circuit abdos',
  targetRounds: 3,
  restBetweenRoundsSec: 45,
  primaryMuscles: ['abdominaux', 'core'],
  items: [
    { exerciseKey: 'gainage', exerciseName: 'Gainage', mode: 'duration', targetDurationSec: 40 },
    {
      exerciseKey: 'mountain climbers',
      exerciseName: 'Mountain climbers',
      mode: 'duration',
      targetDurationSec: 30
    },
    { exerciseKey: 'pompes', exerciseName: 'Pompes', mode: 'reps', targetReps: 12 },
    { exerciseKey: 'gainage latéral', exerciseName: 'Gainage latéral', mode: 'duration', targetDurationSec: 30 }
  ]
};

const TEMPLATE_METABOLIC = {
  name: 'Circuit métabolique',
  targetRounds: 3,
  restBetweenRoundsSec: 40,
  primaryMuscles: ['cardio', 'core', 'jambes'],
  items: [
    { exerciseKey: 'burpees', exerciseName: 'Burpees', mode: 'reps', targetReps: 8 },
    { exerciseKey: 'squat gobelet', exerciseName: 'Squat gobelet', mode: 'reps', targetReps: 15 },
    { exerciseKey: 'pompes', exerciseName: 'Pompes', mode: 'reps', targetReps: 10 },
    { exerciseKey: 'mountain climbers', exerciseName: 'Mountain climbers', mode: 'duration', targetDurationSec: 35 }
  ]
};

const TEMPLATE_CORE_ISO = {
  name: 'Circuit core isométrique',
  targetRounds: 2,
  restBetweenRoundsSec: 35,
  primaryMuscles: ['core'],
  items: [
    { exerciseKey: 'gainage', exerciseName: 'Gainage', mode: 'duration', targetDurationSec: 45 },
    { exerciseKey: 'gainage latéral', exerciseName: 'Gainage latéral', mode: 'duration', targetDurationSec: 35 },
    { exerciseKey: 'gainage', exerciseName: 'Gainage hollow (gainage)', mode: 'duration', targetDurationSec: 30 }
  ]
};

function resolveAbCircuitDaysPerWeek(answers) {
  const styles = normalizeCircuitTrainingStyles(answers?.circuitTrainingStyle);
  const typePrefs = Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];
  const prio = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  const exp = answers?.experienceLevel;

  let n = 0;
  if (hasCircuitTrainingStyle(styles, 'love_circuits')) n = 3;
  else if (typePrefs.includes('circuits_hiit')) n = 2;
  else if (prio.includes('core') || typePrefs.includes('isometric_core')) n = 2;
  else if (hasCircuitTrainingStyle(styles, 'like_supersets') || hasCircuitTrainingStyle(styles, 'ok_finisher')) {
    n = 1;
  }

  if (exp === 'beginner_total' || exp === 'beginner_0_3m') n = Math.min(n, 2);
  if (answers?.cardioTrainingDesire === 'priority_hiit' && n < 2) n = 2;

  return Math.min(3, Math.max(0, n));
}

function pickStrengthDayIndices(activeDayKeys, weekProfiles) {
  return activeDayKeys
    .map((k, i) => ({ k, i, profile: weekProfiles?.[k] }))
    .filter(({ profile }) => profile?.modality !== 'cardio')
    .map(({ i }) => i);
}

/**
 * @returns {{ assignments: { dayKey: string, circuitId: string, templateKind: string }[], definitions: Record<string, object> }}
 */
export function planQuizCircuits(activeDayKeys, answers, weekProfiles) {
  const definitions = {};
  const assignments = [];
  const abDays = resolveAbCircuitDaysPerWeek(answers);
  if (!abDays) return { assignments, definitions };

  const strengthIndices = pickStrengthDayIndices(activeDayKeys, weekProfiles);
  if (!strengthIndices.length) return { assignments, definitions };

  const styles = normalizeCircuitTrainingStyles(answers?.circuitTrainingStyle);
  const useMetabolic = hasCircuitTrainingStyle(styles, 'love_circuits');
  const typePrefs = Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];
  const useCoreIso = typePrefs.includes('isometric_core');

  const step = Math.max(1, Math.floor(strengthIndices.length / abDays));
  for (let j = 0; j < abDays; j += 1) {
    const dayIndex = strengthIndices[Math.min(strengthIndices.length - 1, j * step)];
    const dayKey = activeDayKeys[dayIndex];
    if (!dayKey) continue;

    let template = TEMPLATE_ABDOS;
    let kind = 'abdos';
    if (useMetabolic && j % 2 === 1) {
      template = TEMPLATE_METABOLIC;
      kind = 'metabolic';
    } else if (useCoreIso && j === abDays - 1 && abDays >= 2) {
      template = TEMPLATE_CORE_ISO;
      kind = 'core_iso';
    }

    const circuitId = generateCircuitId();
    definitions[circuitId] = normalizeCircuitDefinition({
      id: circuitId,
      ...template,
      notes: `Circuit généré depuis le quiz (${kind}).`
    });
    assignments.push({ dayKey, circuitId, templateKind: kind });
  }

  return { assignments, definitions };
}

/**
 * @param {Record<string, object>} schedule
 * @param {Record<string, object>} definitions
 * @param {{ dayKey: string, circuitId: string }[]} assignments
 */
export function attachQuizCircuitsToSchedule(schedule, definitions, assignments) {
  if (!schedule || !assignments?.length) return;
  assignments.forEach(({ dayKey, circuitId }) => {
    const day = schedule[dayKey];
    if (!day) return;
    const ids = Array.isArray(day.circuitIds) ? [...day.circuitIds] : [];
    if (!ids.includes(circuitId)) ids.push(circuitId);
    day.circuitIds = ids;
    const def = definitions[circuitId];
    if (def?.name) {
      const note = `Circuit « ${def.name} » : ${def.targetRounds} tours (quiz).`;
      day.notes = [day.notes, note].filter(Boolean).join('\n\n');
    }
  });
}
