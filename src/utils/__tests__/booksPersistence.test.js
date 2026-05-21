import { describe, it, expect } from 'vitest';
import { normalizeReadingSession, normalizeBookForPersistence } from '../booksPersistence';
import { normalizeBookGenre, BOOK_GENRES } from '../../data/bookGenres';

describe('booksPersistence', () => {
  it('normalise une session avec id et critères', () => {
    const s = normalizeReadingSession({ pagesRead: '12', durationMinutes: 30 }, 0);
    expect(s.id).toBeTruthy();
    expect(s.pagesRead).toBe(12);
    expect(s.durationMinutes).toBe(30);
    expect(s.criteriaRatings.plaisir).toBeGreaterThanOrEqual(1);
  });

  it('préserve les sessions sur le livre', () => {
    const book = normalizeBookForPersistence({
      id: 'b1',
      title: 'Test',
      author: 'A',
      genre: 'sci-fi',
      readingSessions: [{ id: 's1', date: '2025-01-01', pagesRead: 10, durationMinutes: 20 }],
    });
    expect(book.readingSessions).toHaveLength(1);
    expect(book.genre).toBe('Science-fiction');
    expect(book.userId).toBeUndefined();
  });
});

describe('bookGenres', () => {
  it('expose une liste étendue de genres triée alphabétiquement', () => {
    expect(BOOK_GENRES.length).toBeGreaterThan(50);
    const sorted = [...BOOK_GENRES].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
    expect(BOOK_GENRES).toEqual(sorted);
  });

  it('mappe les alias vers un genre canonique', () => {
    expect(normalizeBookGenre('policier')).toBe('Polar / Thriller');
    expect(normalizeBookGenre('BD')).toBe('Bande dessinée');
  });
});
