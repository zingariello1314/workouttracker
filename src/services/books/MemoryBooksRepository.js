import { BooksRepositoryPhase1 } from './BooksRepositoryPhase1.js';

/**
 * Copie en mémoire du merge (tests / hors navigateur).
 */
export class MemoryBooksRepository extends BooksRepositoryPhase1 {
  constructor() {
    super();
    /** @type {Array<Record<string, unknown>>} */
    this._books = [];
  }

  async loadAll() {
    return this._books.map((b) => ({ ...b, readingSessions: Array.isArray(b.readingSessions) ? [...b.readingSessions] : [] }));
  }

  async saveMerged(books) {
    const safeBooks = Array.isArray(books) ? books : [];
    const userIdsToUpdate = new Set(safeBooks.map((b) => b.userId).filter(Boolean));

    const booksToKeep = this._books.filter((existing) => {
      if (existing.userId && !userIdsToUpdate.has(existing.userId)) {
        return true;
      }
      if (!existing.userId) {
        return true;
      }
      return !safeBooks.some((newBook) => newBook.id === existing.id);
    });

    const merged = [...booksToKeep, ...safeBooks].map((book) => normalizeLikeLocal(book));
    this._books = merged;
    return true;
  }

  clear() {
    this._books = [];
  }
}

function normalizeLikeLocal(book) {
  const normalized = {
    ...book,
    id: book.id,
    readingSessions: Array.isArray(book.readingSessions) ? book.readingSessions : [],
  };
  if (normalized.title === undefined || normalized.title === null) normalized.title = '';
  if (normalized.author === undefined || normalized.author === null) normalized.author = '';
  if (normalized.year === undefined || normalized.year === null) normalized.year = '';
  if (normalized.pages === undefined || normalized.pages === null) normalized.pages = '';
  if (normalized.status === undefined || normalized.status === null) normalized.status = 'in-progress';
  if (normalized.genre === undefined || normalized.genre === null) normalized.genre = '';
  if (normalized.coverUrl === undefined || normalized.coverUrl === null) normalized.coverUrl = '';
  if (normalized.shortSummary === undefined || normalized.shortSummary === null) normalized.shortSummary = '';
  if (normalized.longSummary === undefined || normalized.longSummary === null) normalized.longSummary = '';
  if (normalized.notes === undefined || normalized.notes === null) normalized.notes = '';
  if (normalized.personalScore === undefined || normalized.personalScore === null) {
    normalized.personalScore = typeof book.personalScore === 'number' ? book.personalScore : 0;
  }
  if (normalized.hasPdf === undefined || normalized.hasPdf === null) {
    normalized.hasPdf = book.hasPdf === true || book.hasPdf === 'true' || book.hasPdf === 1;
  }
  if (normalized.hasCover === undefined || normalized.hasCover === null) {
    normalized.hasCover = !!normalized.coverInline;
  } else if (!normalized.hasCover && normalized.coverInline) {
    normalized.hasCover = true;
  }
  if (normalized.coverInline === undefined) normalized.coverInline = null;
  if (normalized.createdAt === undefined || normalized.createdAt === null) normalized.createdAt = null;
  if (normalized.updatedAt === undefined || normalized.updatedAt === null) normalized.updatedAt = null;
  if (normalized.version === undefined || normalized.version === null) normalized.version = '1.1';
  return normalized;
}
