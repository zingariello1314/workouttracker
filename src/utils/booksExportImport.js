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
      coverInline: book.coverInline || null,
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

  // Gérer le format tableau direct (ancien format Vue.js)
  let booksArray = [];
  if (Array.isArray(importedData)) {
    // Format direct : [{...}, {...}]
    booksArray = importedData;
    log.info('Migration: Format tableau direct détecté', { count: booksArray.length });
  } else if (safe.data && Array.isArray(safe.data.books)) {
    // Format nouveau : { version: '1.1', data: { books: [...] } }
    booksArray = safe.data.books;
    log.info('Migration: Format nouveau détecté', { count: booksArray.length, version });
  } else if (Array.isArray(safe.books)) {
    // Format intermédiaire : { version: 1, books: [...] }
    booksArray = safe.books;
    log.info('Migration: Format intermédiaire détecté', { count: booksArray.length, version });
  } else {
    log.warn('Migration: Aucun format de livres détecté, tableau vide');
  }

  // Fonction helper pour convertir une durée string (ex: "45min") en minutes
  const parseDurationToMinutes = (duration) => {
    if (typeof duration === 'number') return duration;
    if (typeof duration !== 'string') return 0;
    
    const str = duration.trim().toLowerCase();
    // Format "45min" ou "45 min" ou "1h30" ou "1h 30min"
    const minMatch = str.match(/(\d+)\s*min/);
    const hourMatch = str.match(/(\d+)\s*h/);
    
    let minutes = 0;
    if (hourMatch) minutes += parseInt(hourMatch[1], 10) * 60;
    if (minMatch) minutes += parseInt(minMatch[1], 10);
    
    return minutes || 0;
  };

  // Fonction helper pour convertir une plage de pages (ex: "1-25") en nombre de pages lues
  const parsePagesRead = (pages) => {
    if (typeof pages === 'number') return pages;
    if (typeof pages !== 'string') return 0;
    
    const str = pages.trim();
    // Format "1-25" → 25 pages lues
    const rangeMatch = str.match(/(\d+)\s*-\s*(\d+)/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      return Math.max(0, end - start + 1);
    }
    
    // Format simple "25" → 25 pages
    const numMatch = str.match(/(\d+)/);
    return numMatch ? parseInt(numMatch[1], 10) : 0;
  };

  // Fonction helper pour convertir personalScore (étoiles) en nombre
  const parsePersonalScore = (score) => {
    if (typeof score === 'number') return Math.max(0, Math.min(5, score));
    if (typeof score !== 'string') return 0;
    
    const str = score.trim();
    // Compter les étoiles "⭐⭐⭐⭐" → 4
    const stars = (str.match(/⭐/g) || []).length;
    if (stars > 0) return stars;
    
    // Essayer de parser comme nombre
    const num = Number(str);
    return isNaN(num) ? 0 : Math.max(0, Math.min(5, num));
  };

  // Normaliser tous les livres, quelle que soit la version
  let migrationStats = {
    totalPagesMapped: 0,
    coverUrlMapped: 0,
    durationMapped: 0,
    pagesMapped: 0,
    personalScoreMapped: 0,
    statusMapped: 0,
  };

  safe.data = {
    books: booksArray.map((book, index) => {
      const sessions = Array.isArray(book.readingSessions)
        ? book.readingSessions
        : [];

      // Générer un ID si manquant (important pour la validation)
      const bookId = book.id || `book_imported_${Date.now()}_${index}`;

      // Normaliser le statut (gérer les anciens formats français)
      let normalizedStatus = book.status || 'in-progress';
      const statusMap = {
        'en cours': 'in-progress',
        'En cours': 'in-progress',
        'EN COURS': 'in-progress',
        'terminé': 'completed',
        'Terminé': 'completed',
        'TERMINÉ': 'completed',
        'terminé': 'completed',
        'à lire': 'to-read',
        'À lire': 'to-read',
        'À LIRE': 'to-read',
        'abandonné': 'abandoned',
        'Abandonné': 'abandoned',
        'ABANDONNÉ': 'abandoned',
        'en pause': 'paused',
        'En pause': 'paused',
        'EN PAUSE': 'paused',
      };
      if (statusMap[normalizedStatus]) {
        normalizedStatus = statusMap[normalizedStatus];
        migrationStats.statusMapped++;
      }
      // Vérifier que le statut est valide
      const validStatuses = ['in-progress', 'completed', 'to-read', 'abandoned', 'paused'];
      if (!validStatuses.includes(normalizedStatus)) {
        normalizedStatus = 'in-progress';
      }

      // Mapper totalPages → pages (ancien format Vue.js)
      const pages = book.pages !== undefined && book.pages !== null 
        ? book.pages 
        : (book.totalPages !== undefined && book.totalPages !== null ? (migrationStats.totalPagesMapped++, book.totalPages) : '');

      // Gérer coverUrl (dataURL) → coverInline
      let coverInline = book.coverInline || null;
      if (!coverInline && book.coverUrl) {
        // Si coverUrl est une dataURL, la copier dans coverInline
        if (typeof book.coverUrl === 'string' && book.coverUrl.startsWith('data:')) {
          coverInline = book.coverUrl;
          migrationStats.coverUrlMapped++;
        }
      }

      // Préserver TOUS les champs du livre original, en normalisant seulement ceux qui sont manquants
      const preservedBook = {
        ...book, // Préserver TOUS les champs existants (y compris ceux non listés)
        id: bookId,
        status: normalizedStatus,
        pages: pages, // Utiliser la valeur mappée
        coverInline: coverInline, // Utiliser la valeur mappée
        readingSessions: sessions.map((session) => {
          // Mapper duration → durationMinutes (ancien format)
          const durationMinutes = 
            session.durationMinutes !== undefined && session.durationMinutes !== null
              ? (typeof session.durationMinutes === 'number' 
                  ? session.durationMinutes 
                  : Number(session.durationMinutes) || 0)
              : (session.duration ? (migrationStats.durationMapped++, parseDurationToMinutes(session.duration)) : 0);
          
          // Mapper pages → pagesRead (ancien format)
          const pagesRead = 
            session.pagesRead !== undefined && session.pagesRead !== null
              ? (typeof session.pagesRead === 'number' 
                  ? session.pagesRead 
                  : Number(session.pagesRead) || 0)
              : (session.pages ? (migrationStats.pagesMapped++, parsePagesRead(session.pages)) : 0);

          return {
            id: session.id || `session_${Date.now()}_${Math.random()}`,
            date: session.date ?? null,
            durationMinutes: durationMinutes,
            pagesRead: pagesRead,
            note: session.note ?? '',
          };
        }),
      };
      
      // Normaliser seulement les champs manquants (sans écraser les valeurs existantes)
      if (preservedBook.title === undefined || preservedBook.title === null) preservedBook.title = '';
      if (preservedBook.author === undefined || preservedBook.author === null) preservedBook.author = '';
      if (preservedBook.year === undefined || preservedBook.year === null) preservedBook.year = '';
      if (preservedBook.genre === undefined || preservedBook.genre === null) preservedBook.genre = '';
      if (preservedBook.coverUrl === undefined || preservedBook.coverUrl === null) preservedBook.coverUrl = '';
      if (preservedBook.shortSummary === undefined || preservedBook.shortSummary === null) {
        preservedBook.shortSummary = preservedBook.notes ?? '';
      }
      if (preservedBook.longSummary === undefined || preservedBook.longSummary === null) preservedBook.longSummary = '';
      if (preservedBook.notes === undefined || preservedBook.notes === null) preservedBook.notes = '';
      if (preservedBook.personalScore === undefined || preservedBook.personalScore === null) {
        preservedBook.personalScore = parsePersonalScore(book.personalScore);
        if (typeof book.personalScore === 'string' && book.personalScore.includes('⭐')) {
          migrationStats.personalScoreMapped++;
        }
      } else if (typeof preservedBook.personalScore === 'string') {
        // Si c'est une string, essayer de la convertir
        const oldScore = preservedBook.personalScore;
        preservedBook.personalScore = parsePersonalScore(preservedBook.personalScore);
        if (oldScore.includes('⭐')) {
          migrationStats.personalScoreMapped++;
        }
      }
      if (preservedBook.createdAt === undefined || preservedBook.createdAt === null) {
        preservedBook.createdAt = new Date().toISOString();
      }
      if (preservedBook.updatedAt === undefined || preservedBook.updatedAt === null) {
        preservedBook.updatedAt = new Date().toISOString();
      }
      // hasCover doit être true si coverInline existe
      if (preservedBook.hasCover === undefined || preservedBook.hasCover === null) {
        preservedBook.hasCover = !!preservedBook.coverInline;
      } else {
        // Si hasCover existe mais est false et qu'on a coverInline, on le met à true
        if (!preservedBook.hasCover && preservedBook.coverInline) {
          preservedBook.hasCover = true;
        }
      }
      if (preservedBook.hasPdf === undefined || preservedBook.hasPdf === null) {
        preservedBook.hasPdf = false;
      }
      
      return preservedBook;
    }),
  };
  
  // Mettre à jour la version si nécessaire
  if (parseFloat(version) < parseFloat(BOOKS_EXPORT_VERSION)) {
    safe.version = BOOKS_EXPORT_VERSION;
  }

  // Log des statistiques de migration
  if (Object.values(migrationStats).some(v => v > 0)) {
    log.info('Migration: Conversions effectuées', migrationStats);
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



