// Gestion simple de la bibliothèque de livres dans localStorage
// Inspiré de l'architecture décrite dans nouvelongletlivres.md mais adapté en React

const STORAGE_KEY_LEGACY = 'momentum_books';

/** Clé localStorage par utilisateur (évite d’écraser la biblio d’un autre compte sur le même navigateur). */
export const getBooksStorageKey = (userId) =>
  userId ? `${STORAGE_KEY_LEGACY}_${userId}` : STORAGE_KEY_LEGACY;

const parseBooksArray = (raw) => {
  if (!raw) return [];
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((book) => ({
    ...book,
    readingSessions: Array.isArray(book.readingSessions) ? book.readingSessions : [],
  }));
};

/**
 * @param {string} [userId]
 */
export const loadBooks = (userId) => {
  try {
    if (userId) {
      const scoped = window.localStorage.getItem(getBooksStorageKey(userId));
      if (scoped) return parseBooksArray(scoped);
    }
    const legacy = window.localStorage.getItem(STORAGE_KEY_LEGACY);
    if (!legacy) return [];
    const all = parseBooksArray(legacy);
    if (!userId) return all;
    return all.filter((b) => !b.userId || b.userId === userId);
  } catch {
    return [];
  }
};

/**
 * @param {Array} books
 * @param {string} [userId]
 */
export const saveBooks = (books, userId) => {
  try {
    const safeBooks = (Array.isArray(books) ? books : []).map((book) => {
      const { _pdfBlobUrl, coverInline, ...rest } = book || {};
      return {
        ...rest,
        readingSessions: Array.isArray(rest.readingSessions) ? rest.readingSessions : [],
      };
    });
    const key = getBooksStorageKey(userId);
    const jsonString = JSON.stringify(safeBooks);
    const sizeKB = (jsonString.length / 1024).toFixed(2);
    console.log('[booksStorage] Sauvegarde localStorage:', safeBooks.length, 'livres,', sizeKB, 'KB, clé:', key);
    window.localStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    console.error('[booksStorage] Erreur sauvegarde localStorage:', error);
    return false;
  }
};

export const exportBooks = (books) => {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    books: Array.isArray(books) ? books : []
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'momentum_books_backup.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importBooksFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const books = Array.isArray(parsed?.books) ? parsed.books : [];
        resolve(books);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, 'utf-8');
  });
};



