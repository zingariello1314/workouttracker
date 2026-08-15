/**
 * Ventilation pompes : classiques, poignées, défis endurance.
 */

import { ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID } from '../endurance/pushupEnduranceWorkoutKeys';
import {
  catalogKeyUsesPushupChannelBreakdown,
  exerciseRollsUpToPlainPushups
} from './exerciseGradePushupVariants';

const HANDLES_IDS = new Set([105, 1105]);

export function isPushupsCatalogKey(catalogKey, getExerciseNameById) {
  void getExerciseNameById;
  return catalogKeyUsesPushupChannelBreakdown(catalogKey);
}

export function classifyPushupWorkoutChannel(exerciseId, getExerciseNameById) {
  if (String(exerciseId) === ENDURANCE_PUSHUPS_WORKOUT_EXERCISE_ID) return 'defis';
  if (exerciseRollsUpToPlainPushups(exerciseId, getExerciseNameById)) return 'handles';
  const id = parseInt(String(exerciseId), 10);
  if (HANDLES_IDS.has(id)) return 'handles';
  const name = String(
    typeof getExerciseNameById === 'function' ? getExerciseNameById(exerciseId) : ''
  ).toLowerCase();
  if (/poignée|poignee|\bhandles\b|sur poign|handstand push/.test(name)) return 'handles';
  return 'classic';
}

export function emptyPushupChannels() {
  return { classic: 0, handles: 0, defis: 0 };
}

export function mergePushupChannels(into, from) {
  if (!from) return into;
  const base = into || emptyPushupChannels();
  base.classic += from.classic || 0;
  base.handles += from.handles || 0;
  base.defis += from.defis || 0;
  return base;
}

/** Lignes à afficher (uniquement valeurs > 0). */
export function pushupBreakdownDisplayLines(channels) {
  if (!channels) return [];
  const lines = [];
  if (channels.classic > 0) {
    lines.push({ key: 'classic', label: 'Pompes classiques', reps: channels.classic });
  }
  if (channels.handles > 0) {
    lines.push({ key: 'handles', label: 'Pompes poignées', reps: channels.handles });
  }
  if (channels.defis > 0) {
    lines.push({ key: 'defis', label: 'Défis pompes', reps: channels.defis });
  }
  return lines;
}
