import { buildQuizAugmentedSchedule, buildTrainingScheduleFromQuizDays } from '../trainingScheduleFromQuiz';
import { incoherenceDocProfile6d } from './incoherenceDocProfile';

/** Génération e2e du profil type doc INCOHERENCES (6j). */
export function runIncoherenceDocSchedule(opts = {}) {
  const answers = opts.answers || incoherenceDocProfile6d;
  const schedule = buildTrainingScheduleFromQuizDays(
    answers.availableTrainingDays,
    () => ({
      active: true,
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    })
  );
  return buildQuizAugmentedSchedule(schedule, answers, {
    snapshot: opts.snapshot ?? {},
    programDurationWeeks: opts.programDurationWeeks ?? 8
  });
}
