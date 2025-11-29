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

  test('gère les valeurs négatives', () => {
    expect(clamp(-10, -5, 5)).toBe(-5);
    expect(clamp(0, -5, 5)).toBe(0);
    expect(clamp(10, -5, 5)).toBe(5);
  });
});

describe('buildDomeItems - structure et propriétés', () => {
  test('chaque item a les propriétés requises', () => {
    const books = [
      { id: 'b1', title: 'Livre 1', coverUrl: 'http://example.com/1.jpg' },
      { id: 'b2', title: 'Livre 2', coverUrl: 'http://example.com/2.jpg' },
    ];

    const items = buildDomeItems(books, 30);

    items.forEach((item) => {
      expect(item).toHaveProperty('x');
      expect(item).toHaveProperty('y');
      expect(item).toHaveProperty('sizeX');
      expect(item).toHaveProperty('sizeY');
      expect(item).toHaveProperty('src');
      expect(item).toHaveProperty('alt');
      expect(item).toHaveProperty('bookId');
      expect(item).toHaveProperty('book');

      expect(typeof item.x).toBe('number');
      expect(typeof item.y).toBe('number');
      expect(item.sizeX).toBe(2);
      expect(item.sizeY).toBe(2);
      expect(typeof item.src).toBe('string');
      expect(item.src.length).toBeGreaterThan(0);
    });
  });

  test('les coordonnées X sont dans la plage attendue', () => {
    const books = [
      { id: 'b1', title: 'L1', coverUrl: 'http://example.com/1.jpg' },
    ];

    const segments = 30;
    const items = buildDomeItems(books, segments);

    const xValues = new Set(items.map((i) => i.x));
    // xCols = Array.from({ length: 30 }, (_, i) => -37 + i * 2)
    // Donc de -37 à 21 (par pas de 2)
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);

    expect(minX).toBeGreaterThanOrEqual(-37);
    expect(maxX).toBeLessThanOrEqual(21);
  });

  test('les coordonnées Y alternent entre evenYs et oddYs', () => {
    const books = [
      { id: 'b1', title: 'L1', coverUrl: 'http://example.com/1.jpg' },
    ];

    const items = buildDomeItems(books, 30);
    const evenYs = [-4, -2, 0, 2, 4];
    const oddYs = [-3, -1, 1, 3, 5];
    const allValidYs = [...evenYs, ...oddYs];

    items.forEach((item) => {
      expect(allValidYs).toContain(item.y);
    });
  });

  test('évite les doublons consécutifs quand possible', () => {
    const books = [
      { id: 'b1', title: 'L1', coverUrl: 'http://example.com/1.jpg' },
      { id: 'b2', title: 'L2', coverUrl: 'http://example.com/2.jpg' },
      { id: 'b3', title: 'L3', coverUrl: 'http://example.com/3.jpg' },
    ];

    const items = buildDomeItems(books, 30);

    // Vérifier qu'on n'a pas trop de répétitions consécutives
    let consecutiveDuplicates = 0;
    for (let i = 1; i < Math.min(items.length, 50); i += 1) {
      if (items[i].src === items[i - 1].src) {
        consecutiveDuplicates += 1;
      }
    }

    // Avec 3 livres différents et Fisher-Yates + post-traitement,
    // on devrait avoir très peu de doublons consécutifs (max 5% toléré)
    const maxAllowed = Math.floor(50 * 0.05);
    expect(consecutiveDuplicates).toBeLessThanOrEqual(maxAllowed);
  });

  test('filtre les livres sans coverUrl', () => {
    const books = [
      { id: 'b1', title: 'L1', coverUrl: 'http://example.com/1.jpg' },
      { id: 'b2', title: 'L2' }, // pas de coverUrl
      { id: 'b3', title: 'L3', coverUrl: 'http://example.com/3.jpg' },
    ];

    const items = buildDomeItems(books, 30);

    // Tous les items doivent avoir une src valide
    items.forEach((item) => {
      expect(item.src).toBeTruthy();
      expect(item.bookId).not.toBe('b2'); // b2 ne doit pas apparaître
    });
  });
});

describe('clamp - bornes de rotation', () => {
  test('respecte les bornes pour rotationX', () => {
    const maxVerticalRotationDeg = 8;
    const testCases = [
      { input: -10, expected: -8 },
      { input: -8, expected: -8 },
      { input: 0, expected: 0 },
      { input: 8, expected: 8 },
      { input: 10, expected: 8 },
    ];

    testCases.forEach(({ input, expected }) => {
      const result = clamp(input, -maxVerticalRotationDeg, maxVerticalRotationDeg);
      expect(result).toBe(expected);
    });
  });

  test('gère les valeurs extrêmes', () => {
    expect(clamp(Number.MAX_SAFE_INTEGER, -10, 10)).toBe(10);
    expect(clamp(Number.MIN_SAFE_INTEGER, -10, 10)).toBe(-10);
    expect(clamp(NaN, -10, 10)).toBeNaN();
  });
});


