/**
 * F7.0j — Résolveur de séance programme sérialisable (Worker).
 * Miroir du chemin schedule de getTodayWorkout (IDs numériques stables + live coach),
 * sans override UI « jour du programme » du jour courant.
 */
import { getDayName, getDateStr, getAutoWeekVariant } from '../dateUtils';
import { filterExercisesForSessionDate } from '../programExerciseScheduling';
import { applyLiveCoachToExercises } from '../../features/profileQuestionnaire/quizLiveCoach';

function convertToStableNumericId(id, index = 0) {
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    let hash = 0;
    const str = id.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return Math.abs(hash) + 10000;
  }
  return index + 10000;
}

function makeUniqueNumericId(baseId, usedIds) {
  let candidate = baseId;
  let offset = 1;
  while (usedIds.has(candidate)) {
    candidate = baseId + offset;
    offset += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

/**
 * @param {object|null|undefined} activeProgram
 * @param {boolean} [isGymMode]
 * @param {object|null|undefined} [snapshot] — pour live coach
 * @returns {(date: Date) => object|null}
 */
export function createWorkerProgramWorkoutResolver(
  activeProgram,
  isGymMode = false,
  snapshot = null
) {
  return (requestedDate) => {
    if (!activeProgram?.schedule || !requestedDate) return null;
    const dayName = getDayName(requestedDate);
    const daySchedule = activeProgram.schedule[dayName];
    if (!daySchedule) return null;

    const sessionDateStr = getDateStr(requestedDate);
    const currentWeekVariant = getAutoWeekVariant(requestedDate);

    if (activeProgram.availabilitySource === 'quiz' && daySchedule.active === false) {
      const hasExercises =
        Array.isArray(daySchedule.exercises) && daySchedule.exercises.length > 0;
      const et = daySchedule.etirements;
      const hasStretches =
        et &&
        typeof et === 'object' &&
        ['matin', 'midi', 'soir'].some((m) => {
          const slot = et[m];
          return Array.isArray(slot) ? slot.length > 0 : Boolean(slot);
        });
      if (!hasExercises && !hasStretches) {
        return {
          name: daySchedule.name || 'Repos',
          focus: daySchedule.focus || '',
          duree: daySchedule.duration || '',
          exercices: [],
          etirements: undefined,
          isGymMode: Boolean(isGymMode),
          weekVariant: currentWeekVariant,
          sourceDay: dayName
        };
      }
    }

    let exercisesToUse = daySchedule.exercises || [];
    let variantName = daySchedule.name || '';
    let focus = daySchedule.focus || '';

    if (isGymMode && daySchedule.salleVariants) {
      const weekVariantKey = currentWeekVariant === 'A' ? 'semaineA' : 'semaineB';
      const gymVariant = daySchedule.salleVariants[weekVariantKey];
      if (
        gymVariant &&
        Array.isArray(gymVariant.exercises) &&
        gymVariant.exercises.length > 0
      ) {
        exercisesToUse = gymVariant.exercises;
        variantName = gymVariant.name || variantName;
      }
    }

    exercisesToUse = filterExercisesForSessionDate(exercisesToUse, sessionDateStr);

    if (
      activeProgram.availabilitySource === 'quiz' &&
      activeProgram.quizGenerationMeta?.liveCoachEnabled !== false
    ) {
      try {
        const live = applyLiveCoachToExercises(
          (exercisesToUse || []).map((ex) => ({
            ...ex,
            originalId: ex.originalId ?? ex.id
          })),
          {
            activeProgram,
            sessionYmd: sessionDateStr,
            snapshot: snapshot || {},
            trainingEvidence: activeProgram.quizGenerationMeta?.trainingEvidence
          }
        );
        exercisesToUse = live.exercises;
        if (live.coachNotes?.length && !String(focus).includes('Coach :')) {
          focus = [focus, live.coachNotes[0]].filter(Boolean).join(' · ');
        }
      } catch {
        /* coach live optionnel */
      }
    }

    const usedIds = new Set();
    const exercices = (exercisesToUse || []).map((ex, index) => {
      const baseId = convertToStableNumericId(ex.id, index);
      const numericId = makeUniqueNumericId(baseId, usedIds);
      return {
        id: numericId,
        name: ex.name || '',
        series: ex.series,
        type: ex.type || 'standard',
        materiel: ex.materiel || 'poids du corps',
        notes: ex.notes || '',
        rest: ex.rest || 90,
        intensity: ex.intensity || 'moderate',
        originalId: ex.id,
        sourceDay: dayName
      };
    });

    return {
      name: variantName || daySchedule.name || '',
      focus,
      duree: daySchedule.duration || '',
      exercices,
      etirements: daySchedule.etirements,
      isGymMode: Boolean(isGymMode),
      weekVariant: currentWeekVariant,
      sourceDay: dayName
    };
  };
}
