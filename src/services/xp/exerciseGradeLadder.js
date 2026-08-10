/**
 * Échelle de grades par exercice : Bois I → Platine III (15 paliers).
 */

export const EXERCISE_GRADE_LADDER = [
  { id: 'wood_1', material: 'wood', tier: 1, label: 'Bois I', sortIndex: 0, accent: '#a16207' },
  { id: 'wood_2', material: 'wood', tier: 2, label: 'Bois II', sortIndex: 1, accent: '#ca8a04' },
  { id: 'wood_3', material: 'wood', tier: 3, label: 'Bois III', sortIndex: 2, accent: '#eab308' },
  { id: 'bronze_1', material: 'bronze', tier: 1, label: 'Bronze I', sortIndex: 3, accent: '#b45309' },
  { id: 'bronze_2', material: 'bronze', tier: 2, label: 'Bronze II', sortIndex: 4, accent: '#d97706' },
  { id: 'bronze_3', material: 'bronze', tier: 3, label: 'Bronze III', sortIndex: 5, accent: '#f59e0b' },
  { id: 'silver_1', material: 'silver', tier: 1, label: 'Argent I', sortIndex: 6, accent: '#94a3b8' },
  { id: 'silver_2', material: 'silver', tier: 2, label: 'Argent II', sortIndex: 7, accent: '#cbd5e1' },
  { id: 'silver_3', material: 'silver', tier: 3, label: 'Argent III', sortIndex: 8, accent: '#e2e8f0' },
  { id: 'gold_1', material: 'gold', tier: 1, label: 'Or I', sortIndex: 9, accent: '#fbbf24' },
  { id: 'gold_2', material: 'gold', tier: 2, label: 'Or II', sortIndex: 10, accent: '#fcd34d' },
  { id: 'gold_3', material: 'gold', tier: 3, label: 'Or III', sortIndex: 11, accent: '#fde68a' },
  { id: 'platinum_1', material: 'platinum', tier: 1, label: 'Platine I', sortIndex: 12, accent: '#67e8f9' },
  { id: 'platinum_2', material: 'platinum', tier: 2, label: 'Platine II', sortIndex: 13, accent: '#a5f3fc' },
  { id: 'platinum_3', material: 'platinum', tier: 3, label: 'Platine III', sortIndex: 14, accent: '#cffafe' }
];

const BY_ID = new Map(EXERCISE_GRADE_LADDER.map((r) => [r.id, r]));

export function exerciseGradeById(id) {
  return BY_ID.get(id) || EXERCISE_GRADE_LADDER[0];
}

export function exerciseGradeFromSortIndex(index) {
  const i = Math.max(0, Math.min(EXERCISE_GRADE_LADDER.length - 1, Math.floor(Number(index) || 0)));
  return EXERCISE_GRADE_LADDER[i];
}

export function compareExerciseGradeSort(a, b) {
  return (b?.sortIndex ?? 0) - (a?.sortIndex ?? 0);
}
