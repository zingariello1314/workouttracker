import { describe, expect, it } from 'vitest';
import {
  buildExerciseNameIndexFromPrograms,
  convertToStableNumericId,
  indexProgramExerciseNames,
  isFallbackExerciseLabel,
  resolveExerciseDisplayName,
  backfillExerciseDisplayNames
} from '../workoutExerciseIdResolve';

describe('workoutExerciseIdResolve', () => {
  const quizProgram = {
    schedule: {
      lundi: {
        exercises: [
          { id: 'quiz_ex_oiseaux_1', name: 'Oiseaux penché', series: '3×12' },
          { id: 'quiz_ex_oiseaux_2', name: 'Oiseaux', series: '3×15' }
        ]
      }
    }
  };

  it('indexe les IDs numériques quiz → nom', () => {
    const map = indexProgramExerciseNames(quizProgram);
    expect(map.size).toBeGreaterThan(0);
    const firstId = [...map.keys()][0];
    expect(map.get(firstId)).toMatch(/Oiseaux/);
  });

  it('résout un nom depuis tous les programmes', () => {
    const index = buildExerciseNameIndexFromPrograms([quizProgram]);
    const id = [...index.keys()][0];
    const resolved = resolveExerciseDisplayName(
      id,
      {},
      index,
      () => `Exercice ${id}`
    );
    expect(resolved).toMatch(/Oiseaux/);
    expect(isFallbackExerciseLabel(resolved)).toBe(false);
  });

  it('backfill les noms persistés pour coches actives', () => {
    const index = buildExerciseNameIndexFromPrograms([quizProgram]);
    const id = String([...index.keys()][0]);
    const snapshot = {
      checkedExercises: { [`2026-01-10_${id}`]: true },
      reps: { [`2026-01-10_${id}`]: '36' }
    };
    const filled = backfillExerciseDisplayNames(snapshot, [quizProgram], () => `Exercice ${id}`);
    expect(filled[id]).toMatch(/Oiseaux/);
  });

  it('convertToStableNumericId est stable', () => {
    expect(convertToStableNumericId('quiz_ex_oiseaux_1')).toBe(
      convertToStableNumericId('quiz_ex_oiseaux_1')
    );
  });
});
