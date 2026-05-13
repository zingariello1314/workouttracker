import { LocalBooksRepository } from './LocalBooksRepository.js';
import { MemoryBooksRepository } from './MemoryBooksRepository.js';

/**
 * @param {'local' | 'memory'} [mode]
 * @returns {import('./BooksRepositoryPhase1.js').BooksRepositoryPhase1}
 */
export function createBooksRepository(mode = 'local') {
  if (mode === 'memory') return new MemoryBooksRepository();
  return new LocalBooksRepository();
}
