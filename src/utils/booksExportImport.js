import logger from './logger';

const log = logger.module('BooksExportImport');

export const BOOKS_EXPORT_VERSION = '1.1';

const DEFAULT_EXPORT_OPTIONS = {
  includeSessions: true,
  includeMetadata: true,
};

const DEFAULT_IMPORT_OPTIONS = {
  validateData: true,
  validateVersion: true,
};

export const prepareBooksExportData = (books = [], options = {}) => {
  const opts = { ...DEFAULT_EXPORT_OPTIONS, ...options };
  const timestamp = new Date().toISOString();

  const safeBooks = Array.isArray(books) ? books : [];

  const normalizedBooks = safeBooks.map((book) => {
    const sessions = Array.isArray(book.readingSessions)
      ? book.readingSessions
      : [];

    return {
      id: book.id,
      title: book.title || '',
      author: book.author || '',
      year: book.year ?? '',
      pages: book.pages ?? '',
      status: book.status || 'in-progress',
      genre: book.genre || '',
      coverUrl: book.coverUrl || '',
      shortSummary: book.shortSummary || book.notes || '',
      longSummary: book.longSummary || '',
      personalScore:
        typeof book.personalScore === 'number' ? book.personalScore : 0,
      notes: book.notes || '',
      createdAt: book.createdAt || null,
      updatedAt: book.updatedAt || null,
      version: book.version || '1.0',
      hasPdf: !!book.hasPdf,
      hasCover: !!book.hasCover,
      readingSessions: opts.includeSessions
        ? sessions.map((session) => ({
            id: session.id,
            date: session.date || null,
            durationMinutes:
              typeof session.durationMinutes === 'number'
                ? session.durationMinutes
                : Number(session.durationMinutes) || 0,
            pagesRead:
              typeof session.pagesRead === 'number'
                ? session.pagesRead
                : Number(session.pagesRead) || 0,
            note: session.note || '',
          }))
        : [],
    };
  });

  const exportData = {
    version: BOOKS_EXPORT_VERSION,
    exportDate: timestamp,
    exportType: 'Books Data',
    appName: 'Workout Tracker - Livres',
    data: {
      books: normalizedBooks,
    },
  };

  if (opts.includeMetadata) {
    const totalBooks = normalizedBooks.length;
    const totalSessions = normalizedBooks.reduce(
      (sum, book) => sum + (book.readingSessions || []).length,
      0
    );
    const totalWithPdf = normalizedBooks.reduce(
      (sum, book) => sum + (book.hasPdf ? 1 : 0),
      0
    );
    const totalWithCover = normalizedBooks.reduce(
      (sum, book) => sum + (book.hasCover ? 1 : 0),
      0
    );

    const statuses = normalizedBooks.reduce(
      (acc, book) => {
        const status = book.status || 'in-progress';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { 'in-progress': 0, completed: 0 }
    );

    const allSessionDates = normalizedBooks
      .flatMap((book) =>
        (book.readingSessions || [])
          .map((s) => s.date)
          .filter(Boolean)
      )
      .sort();

    const rawSize = JSON.stringify(exportData).length;

    exportData.metadata = {
      totalBooks,
      totalSessions,
      statuses,
      dateRange: {
        earliest: allSessionDates[0] || null,
        latest:
          allSessionDates.length > 0
            ? allSessionDates[allSessionDates.length - 1]
            : null,
      },
      estimatedSize: rawSize,
      estimatedSizeKB: Math.round((rawSize / 1024) * 100) / 100,
      assets: {
        totalWithPdf,
        totalWithCover,
      },
    };
  }

  log.info('Données Livres préparées pour export', {
    books: exportData.data.books.length,
    sessions:
      exportData.data.books.reduce(
        (sum, b) => sum + (b.readingSessions || []).length,
        0
      ) || 0,
    sizeKB: exportData.metadata?.estimatedSizeKB || 0,
  });

  return exportData;
};

export const validateBooksData = (data) => {
  const errors = [];
  const warnings = [];

  if (!data || typeof data !== 'object') {
    errors.push('Les données importées doivent être un objet.');
    return { valid: false, errors, warnings, stats: null };
  }

  if (!data.data || !Array.isArray(data.data.books)) {
    errors.push('Le champ data.books est manquant ou invalide.');
    return { valid: false, errors, warnings, stats: null };
  }

  const books = data.data.books;

  books.forEach((book, index) => {
    if (!book.id) {
      errors.push(`Livre ${index} sans id`);
    }
    if (!book.title) {
      warnings.push(`Livre ${index} sans titre (id=${book.id || '??'})`);
    }
    if (book.readingSessions && !Array.isArray(book.readingSessions)) {
      errors.push(`Livre ${index}: readingSessions doit être un tableau`);
    }
  });

  const totalBooks = books.length;
  const totalSessions = books.reduce(
    (sum, b) => sum + (b.readingSessions || []).length,
    0
  );
  const totalWithPdf = books.reduce(
    (sum, b) => sum + (b.hasPdf ? 1 : 0),
    0
  );
  const totalWithCover = books.reduce(
    (sum, b) => sum + (b.hasCover ? 1 : 0),
    0
  );

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: {
      totalBooks,
      totalSessions,
      totalWithPdf,
      totalWithCover,
    },
  };
};

export const migrateBooksImportData = (importedData) => {
  if (!importedData || typeof importedData !== 'object') {
    return { data: { books: [] }, version: BOOKS_EXPORT_VERSION };
  }

  const safe = { ...importedData };
  const version = safe.version || '1.0';

  if (!safe.data || !Array.isArray(safe.data.books)) {
    safe.data = { books: [] };
  }

  if (parseFloat(version) <= 1.0) {
    safe.data.books = safe.data.books.map((book) => {
      const sessions = Array.isArray(book.readingSessions)
        ? book.readingSessions
        : [];

      return {
        ...book,
        title: book.title || '',
        author: book.author || '',
        year: book.year ?? '',
        pages: book.pages ?? '',
        status: book.status || 'in-progress',
        genre: book.genre || '',
        coverUrl: book.coverUrl || '',
        shortSummary: book.shortSummary || book.notes || '',
        longSummary: book.longSummary || '',
        personalScore:
          typeof book.personalScore === 'number'
            ? book.personalScore
            : Number(book.personalScore) || 0,
        notes: book.notes || '',
        hasPdf: !!book.hasPdf,
        hasCover: !!book.hasCover,
        readingSessions: sessions.map((session) => ({
          id: session.id || `session_${Date.now()}`,
          date: session.date || null,
          durationMinutes:
            typeof session.durationMinutes === 'number'
              ? session.durationMinutes
              : Number(session.durationMinutes) || 0,
          pagesRead:
            typeof session.pagesRead === 'number'
              ? session.pagesRead
              : Number(session.pagesRead) || 0,
          note: session.note || '',
        })),
      };
    });
    safe.version = BOOKS_EXPORT_VERSION;
  }

  return safe;
};

export const processBooksImportData = (imported, options = {}) => {
  const opts = { ...DEFAULT_IMPORT_OPTIONS, ...options };

  try {
    let parsed = imported;
    if (typeof imported === 'string') {
      parsed = JSON.parse(imported);
    }

    if (opts.validateVersion) {
      const version = parseFloat(parsed.version || '1.0');
      const current = parseFloat(BOOKS_EXPORT_VERSION);
      if (version > current) {
        return {
          valid: false,
          errors: [
            `Version d'export Livres ${version} plus récente que la version supportée ${current}`,
          ],
          warnings: [],
          books: [],
          stats: null,
        };
      }
    }

    const migrated = migrateBooksImportData(parsed);
    const validation = opts.validateData
      ? validateBooksData(migrated)
      : { valid: true, errors: [], warnings: [], stats: null };

    if (!validation.valid) {
      log.warn('Validation Livres échouée', validation.errors);
      return {
        valid: false,
        errors: validation.errors,
        warnings: validation.warnings,
        books: [],
        stats: validation.stats,
      };
    }

    const finalBooks = migrated.data.books || [];

    log.info('Import Livres traité avec succès', {
      books: finalBooks.length,
      sessions: finalBooks.reduce(
        (sum, b) => sum + (b.readingSessions || []).length,
        0
      ),
      warnings: validation.warnings.length,
    });

    return {
      valid: true,
      errors: [],
      warnings: validation.warnings,
      books: finalBooks,
      stats: validation.stats,
    };
  } catch (error) {
    log.error('Erreur lors du traitement de l’import Livres', error);
    return {
      valid: false,
      errors: [`Erreur de parsing ou de structure: ${error.message}`],
      warnings: [],
      books: [],
      stats: null,
    };
  }
};

export const downloadBooksExportFile = (exportData, filename = null) => {
  try {
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const defaultFilename = `books-data-${new Date()
      .toISOString()
      .split('T')[0]}.json`;
    const finalFilename = filename || defaultFilename;

    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    log.info('Fichier Livres exporté', {
      filename: finalFilename,
      size: jsonString.length,
    });

    return { success: true, filename: finalFilename, size: jsonString.length };
  } catch (error) {
    log.error('Erreur lors du téléchargement de l’export Livres', error);
    throw error;
  }
};



