import { buildDomeItems, clamp } from './BooksDomeGallery.jsx';

describe('buildDomeItems', () => {
  test('retourne un tableau vide si aucun livre', () => {
    const items = buildDomeItems([], 30);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBe(0);
  });

  test('remplit correctement la grille avec un seul livre', () => {
    const books = [
      {
        id: 'book_1',
        title: 'Titre unique',
        author: 'Auteur',
        coverUrl: 'http://example.com/cover1.jpg',
      },
    ];

    const segments = 30;
    const items = buildDomeItems(books, segments);

    // 30 colonnes X * 5 lignes Y = 150 items
    expect(items.length).toBe(segments * 5);

    // Tous les items doivent avoir le même livre
    const uniqueBookIds = new Set(items.map((i) => i.book.id));
    expect(uniqueBookIds.size).toBe(1);
    expect(uniqueBookIds.has('book_1')).toBe(true);
  });

  test('répartit plusieurs livres sur la grille sans erreur', () => {
    const books = [
      { id: 'b1', title: 'L1', coverUrl: 'http://example.com/1.jpg' },
      { id: 'b2', title: 'L2', coverUrl: 'http://example.com/2.jpg' },
      { id: 'b3', title: 'L3', coverUrl: 'http://example.com/3.jpg' },
    ];

    const items = buildDomeItems(books, 30);

    expect(items.length).toBe(150);
    // Tous les items ont bien une src et un id
    items.forEach((item) => {
      expect(item.src).toBeTruthy();
      expect(item.bookId).toBeTruthy();
      expect(item.book).toBeTruthy();
    });
  });
});


describe('clamp', () => {
  test('borne une valeur dans les limites [min, max]', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});


