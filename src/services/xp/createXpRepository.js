import { LocalXpRepository } from './LocalXpRepository.js';
import { MemoryXpRepository } from './MemoryXpRepository.js';

/**
 * @param {'local' | 'memory'} [mode]
 * @returns {import('./XpRepositoryPhase1.js').XpRepositoryPhase1}
 */
export function createXpRepository(mode = 'local') {
  if (mode === 'memory') return new MemoryXpRepository();
  return new LocalXpRepository();
}
