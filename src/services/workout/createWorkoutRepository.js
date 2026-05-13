import { LocalWorkoutRepository } from './LocalWorkoutRepository.js';
import { MemoryWorkoutRepository } from './MemoryWorkoutRepository.js';

/**
 * @param {'local' | 'memory'} [mode]
 * @returns {import('./WorkoutRepositoryPhase1.js').WorkoutRepositoryPhase1}
 */
export function createWorkoutRepository(mode = 'local') {
  if (mode === 'memory') return new MemoryWorkoutRepository();
  return new LocalWorkoutRepository();
}
