/**
 * Q-R3 — profil séances course → répartition easy / tempo / fractionné.
 */

/**
 * @param {{ easy?: number, tempo?: number, intervals?: number }|null} split
 * @param {string|null|undefined} profile — runningSessionProfile
 */
export function adjustIntensitySplitForRunningProfile(split, profile) {
  if (!split || !profile) return split;
  const key = String(profile);
  switch (key) {
    case 'endurance':
      return { easy: 0.85, tempo: 0.1, intervals: 0.05 };
    case 'speed':
      return { easy: 0.55, tempo: 0.2, intervals: 0.25 };
    case 'return':
      return { easy: 0.9, tempo: 0.08, intervals: 0.02 };
    case 'performance':
      return { easy: 0.65, tempo: 0.2, intervals: 0.15 };
    case 'mixed':
    default:
      return { ...split };
  }
}

/**
 * Infère un profil depuis runningGoal si Q-R3 absente.
 * @param {object} answers
 */
export function inferRunningSessionProfile(answers) {
  if (answers?.runningSessionProfile) return answers.runningSessionProfile;
  const goal = answers?.runningGoal;
  if (!goal) return null;
  if (goal === 'return_to_run' || goal === 'health') return 'return';
  if (goal === 'vo2max' || goal === 'sprint') return 'speed';
  if (goal === 'marathon' || goal === 'half_marathon' || goal === 'trail_long') return 'endurance';
  if (goal === '5k' || goal === '10k') return 'performance';
  return 'mixed';
}
