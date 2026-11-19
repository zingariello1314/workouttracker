/**
 * Politique de comparaison lue par les producteurs P3.
 * Une méthode applicable mais non utilisée reste visible, au lieu d'être
 * silencieuse parce qu'une colonne est déjà pleine.
 */

export const COMPARISON_CLASS = Object.freeze({
  DETERMINISTIC: 'deterministic_decomposition',
  DESCRIPTIVE: 'descriptive_comparison',
  EXPLORATORY: 'exploratory_association',
  PROJECTION: 'projection'
});

export function volumeFrequencyContentPolicy() {
  return {
    id: 'volume.frequency-content.v1',
    comparisonClass: COMPARISON_CLASS.DETERMINISTIC,
    observationUnit: 'strength_training_day',
    overlap: 'nested_windows_are_not_independent_samples',
    setsInOneDay: 'not_independent_observations',
    selection: 'equal_length_previous_window',
    rejected: 'choosing_the_cut_with_the_largest_percent'
  };
}
