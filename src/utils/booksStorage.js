// Gestion simple de la bibliothèque de livres dans localStorage
// Inspiré de l'architecture décrite dans nouvelongletlivres.md mais adapté en React

const STORAGE_KEY = 'momentum_books';

export const loadBooks = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((book) => ({
      readingSessions: [],
      ...book,
      readingSessions: Array.isArray(book.readingSessions) ? book.readingSessions : []
    }));
  } catch {
    return [];
  }
};

export const saveBooks = (books) => {
  try {
    const safeBooks = (Array.isArray(books) ? books : []).map((book) => {
      // Exclure les champs volumineux qui sont stockés dans IndexedDB
      const { _pdfBlobUrl, coverInline, ...rest } = book || {};
      // Garder hasCover pour savoir qu'une couverture existe, mais pas coverInline (trop volumineux)
      return rest;
    });
    const jsonString = JSON.stringify(safeBooks);
    const sizeKB = (jsonString.length / 1024).toFixed(2);
    console.log('[booksStorage] Sauvegarde localStorage:', safeBooks.length, 'livres,', sizeKB, 'KB');
    window.localStorage.setItem(STORAGE_KEY, jsonString);
    return true;
  } catch (error) {
    // En cas d'erreur de quota ou autre, on ne casse pas l'app
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



