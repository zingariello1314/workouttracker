import { describe, it, expect, vi, beforeEach } from 'vitest';
import { migrateDataToUser } from './authMigration';
import * as booksIndexedDB from './booksIndexedDB';

describe('authMigration.migrateDataToUser', () => {
  const userId = 'admin-user-id';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('retourne un échec si userId est manquant', async () => {
    const result = await migrateDataToUser(null);
    expect(result.success).toBe(false);
    expect(result.migratedBooks).toBe(0);
  });

  it('ne migre rien s’il n’y a aucun livre', async () => {
    vi.spyOn(booksIndexedDB, 'getAllBooksFromIndexedDB').mockResolvedValue([]);
    const saveSpy = vi.spyOn(booksIndexedDB, 'saveBooksToIndexedDB').mockResolvedValue(true);

    const result = await migrateDataToUser(userId);

    expect(result.success).toBe(true);
    expect(result.migratedBooks).toBe(0);
    expect(saveSpy).not.toHaveBeenCalled();
  });

  it('migre seulement les livres sans userId et conserve ceux qui en ont déjà un', async () => {
    const books = [
      { id: '1', title: 'Livre 1', userId: null },
      { id: '2', title: 'Livre 2' }, // pas de userId
      { id: '3', title: 'Livre 3', userId: 'autre-user' },
    ];
    const getSpy = vi.spyOn(booksIndexedDB, 'getAllBooksFromIndexedDB').mockResolvedValue(books);
    const saveSpy = vi.spyOn(booksIndexedDB, 'saveBooksToIndexedDB').mockResolvedValue(true);

    const result = await migrateDataToUser(userId);

    expect(getSpy).toHaveBeenCalledTimes(2); // snapshot anonyme + migrateBooks
    expect(saveSpy).toHaveBeenCalledTimes(1);

    const savedBooks = saveSpy.mock.calls[0][0];
    const migrated = savedBooks.filter((b) => b.userId === userId);
    const untouched = savedBooks.find((b) => b.id === '3');

    expect(result.success).toBe(true);
    expect(result.migratedBooks).toBe(2);
    expect(migrated.map((b) => b.id).sort()).toEqual(['1', '2']);
    expect(untouched.userId).toBe('autre-user');
  });

  it('renvoie un échec si la sauvegarde des livres échoue', async () => {
    const books = [
      { id: '1', title: 'Livre 1' },
    ];
    vi.spyOn(booksIndexedDB, 'getAllBooksFromIndexedDB').mockResolvedValue(books);
    vi.spyOn(booksIndexedDB, 'saveBooksToIndexedDB').mockResolvedValue(false);

    const result = await migrateDataToUser(userId);

    expect(result.success).toBe(false);
    expect(result.migratedBooks).toBe(0);
  });
});




