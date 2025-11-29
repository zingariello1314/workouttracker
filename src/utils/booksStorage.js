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
      const { _pdfBlobUrl, ...rest } = book || {};
      return rest;
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeBooks));
  } catch {
    // En cas d'erreur de quota ou autre, on ne casse pas l'app
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


