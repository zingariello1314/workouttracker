import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Download, Search, Upload } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import { Input, TextArea, Select } from '../ui/Input';
import { useTranslation } from '../../utils/translations';
import { importBooksFromFile } from '../../utils/booksStorage';
import {
  prepareBooksExportData,
  processBooksImportData,
  downloadBooksExportFile,
} from '../../utils/booksExportImport';
import {
  saveBookPdf,
  deleteBookPdf,
  saveBookCover,
  deleteBookCover,
  getBookCover,
} from '../../utils/booksAssetsStorage';
import { useBooksStorage } from '../../hooks/useBooksStorage';

const BooksDomeGallery = React.lazy(() =>
  import('../books/BooksDomeGallery')
);

const emptyBookForm = {
  id: null,
  title: '',
  author: '',
  year: '',
  genre: '',
  pages: '',
  status: 'in-progress', // 'in-progress' | 'completed' | 'to-read' | 'abandoned' | 'paused'
  shortSummary: '',
  longSummary: '',
  personalScore: 0,
};

const emptySessionForm = {
  date: '',
  durationMinutes: '',
  pagesRead: '',
  note: '',
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

const BooksTab = () => {
  const t = useTranslation();
  const { books, setBooks, isLoading } = useBooksStorage();
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [form, setForm] = useState(emptyBookForm);
  const [sessionForm, setSessionForm] = useState(emptySessionForm);
  const [search, setSearch] = useState('');
  const [filterGenre, setFilterGenre] = useState('');
  const [filterMinYear, setFilterMinYear] = useState('');
  const [filterMaxYear, setFilterMaxYear] = useState('');
  const [filterMinScore, setFilterMinScore] = useState('');
  const [sortMode, setSortMode] = useState('recent'); // recent | title | author | pages | score
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const coverInputRef = useRef(null);
  const coverFormInputRef = useRef(null);
  const [formCoverFile, setFormCoverFile] = useState(null);
  const [coverUrls, setCoverUrls] = useState({});
  const coverUrlsRef = useRef({});

  const [pageInProgress, setPageInProgress] = useState(0);
  const [pageCompleted, setPageCompleted] = useState(0);
  const [pageToRead, setPageToRead] = useState(0);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSessionChange = (field, value) => {
    setSessionForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setForm(emptyBookForm);
    setFormCoverFile(null);
    if (coverFormInputRef.current) {
      coverFormInputRef.current.value = '';
    }
  };

  const resetSessionForm = () => {
    setSessionForm({
      ...emptySessionForm,
      date: new Date().toISOString().slice(0, 10),
    });
  };

  useEffect(() => {
    // initialiser la date par défaut de la session
    resetSessionForm();
  }, []);

  // Charger paresseusement les miniatures de couverture pour les livres qui en ont une
  useEffect(() => {
    let cancelled = false;

    const loadCovers = async () => {
      const toLoad = books.filter((book) => !coverUrlsRef.current[book.id]);
      for (const book of toLoad) {
        try {
          const record = await getBookCover(`cover_${book.id}`);
          let src = null;

          if (record && record.blob) {
            const objectUrl = URL.createObjectURL(record.blob);
            if (cancelled) {
              URL.revokeObjectURL(objectUrl);
              return;
            }
            src = objectUrl;
          } else if (book.coverInline) {
            // Fallback : miniature intégrée (dataURL)
            src = book.coverInline;
          }

          if (!src) continue;

          setCoverUrls((prev) => {
            const existing = prev[book.id];
            if (existing && existing.startsWith('blob:')) {
              // Ne révoquer que les ObjectURL, pas les dataURL
              try {
                URL.revokeObjectURL(existing);
              } catch {
                // ignore
              }
            }
            const next = { ...prev, [book.id]: src };
            coverUrlsRef.current = next;
            return next;
          });
        } catch {
          // échec silencieux : la couverture pourra être rechargée plus tard
        }
      }
    };

    if (books && books.length > 0) {
      loadCovers();
    }

    return () => {
      cancelled = true;
    };
  }, [books]);

  // Cleanup des ObjectURLs à la fermeture de l’onglet
  useEffect(
    () => () => {
      Object.values(coverUrlsRef.current || {}).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    },
    []
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert('Merci de renseigner au minimum le titre du livre.');
      return;
    }

    const isEditing = !!form.id;
    const id = isEditing ? form.id : `book_${Date.now()}`;

    const nowIso = new Date().toISOString();

    const baseBook = {
      id,
      title: form.title.trim(),
      author: form.author.trim(),
      year: form.year ? Number(form.year) || '' : '',
      genre: form.genre?.trim() || '',
      pages: form.pages ? Number(form.pages) || '' : '',
      status: form.status,
      shortSummary: form.shortSummary?.trim().slice(0, 500) || '',
      longSummary: form.longSummary?.trim().slice(0, 5000) || '',
      // Compat : on garde notes comme alias du résumé court
      notes: form.shortSummary?.trim().slice(0, 500) || '',
      personalScore: Number(form.personalScore) || 0,
    };

    setBooks((prev) => {
      if (isEditing) {
        return prev.map((book) =>
          book.id === id
            ? {
                ...book,
                ...baseBook,
                hasCover: book.hasCover || !!formCoverFile,
                // préserve createdAt si déjà présent
                createdAt: book.createdAt || nowIso,
              }
            : book
        );
      }

      return [
        {
          ...baseBook,
          hasCover: !!formCoverFile,
          readingSessions: [],
          createdAt: nowIso,
        },
        ...prev,
      ];
    });

    if (formCoverFile) {
      const coverId = `cover_${id}`;
      // On enregistre en arrière-plan, sans bloquer l’UI
      const ok = await saveBookCover(coverId, formCoverFile, {
        name: formCoverFile.name || null,
        from: 'book-form',
      });

      if (!ok) {
        // Fallback : stocker une petite version inline pour garantir la persistance
        const dataUrl = await readFileAsDataUrl(formCoverFile);
        if (dataUrl) {
          setBooks((prev) =>
            prev.map((book) =>
              book.id === id ? { ...book, hasCover: true, coverInline: dataUrl } : book
            )
          );
        }
      }

      const localUrl = URL.createObjectURL(formCoverFile);
      setCoverUrls((prev) => {
        const existing = prev[id];
        if (existing) {
          URL.revokeObjectURL(existing);
        }
        const next = { ...prev, [id]: localUrl };
        coverUrlsRef.current = next;
        return next;
      });
      setFormCoverFile(null);
      if (coverFormInputRef.current) {
        coverFormInputRef.current.value = '';
      }
    }

    resetForm();
  };

  const handleEdit = (book) => {
    setForm({
      id: book.id,
      title: book.title || '',
      author: book.author || '',
      year: book.year || '',
      genre: book.genre || '',
      pages: book.pages || '',
      status: book.status || 'in-progress',
      shortSummary: book.shortSummary || book.notes || '',
      longSummary: book.longSummary || '',
      personalScore: book.personalScore || 0,
    });
    setSelectedBookId(book.id);
    setFormCoverFile(null);
    if (coverFormInputRef.current) {
      coverFormInputRef.current.value = '';
    }
  };

  const handleDelete = (book) => {
    if (!window.confirm(`Supprimer définitivement "${book.title}" ?`)) {
      return;
    }
    setBooks((prev) => prev.filter((b) => b.id !== book.id));
    if (selectedBookId === book.id) {
      setSelectedBookId(null);
    }
  };

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) || null,
    [books, selectedBookId]
  );

  const PAGE_SIZE = 30;

  const filteredAndSortedBooks = useMemo(() => {
    const q = search.trim().toLowerCase();
    const minYear = filterMinYear ? Number(filterMinYear) || null : null;
    const maxYear = filterMaxYear ? Number(filterMaxYear) || null : null;
    const minScore = filterMinScore ? Number(filterMinScore) || 0 : 0;
    const genreQuery = filterGenre.trim().toLowerCase();

    const matchesSearch = (book) => {
      if (!q) return true;
      const haystack = `${book.title || ''} ${book.author || ''} ${book.genre || ''}`.toLowerCase();
      return haystack.includes(q);
    };

    const matchesGenre = (book) => {
      if (!genreQuery) return true;
      return (book.genre || '').toLowerCase().includes(genreQuery);
    };

    const matchesYear = (book) => {
      const y = Number(book.year) || null;
      if (!y) return true;
      if (minYear !== null && y < minYear) return false;
      if (maxYear !== null && y > maxYear) return false;
      return true;
    };

    const matchesScore = (book) => {
      const score = Number(book.personalScore) || 0;
      if (!minScore) return true;
      return score >= minScore;
    };

    const sortFn = (a, b) => {
      switch (sortMode) {
        case 'title': {
          return (a.title || '').localeCompare(b.title || '', undefined, {
            sensitivity: 'base',
          });
        }
        case 'author': {
          return (a.author || '').localeCompare(b.author || '', undefined, {
            sensitivity: 'base',
          });
        }
        case 'pages': {
          const pa = Number(a.pages) || 0;
          const pb = Number(b.pages) || 0;
          return pb - pa;
        }
        case 'score': {
          const sa = Number(a.personalScore) || 0;
          const sb = Number(b.personalScore) || 0;
          return sb - sa;
        }
        case 'recent':
        default: {
          const da = a.createdAt ? Date.parse(a.createdAt) : 0;
          const db = b.createdAt ? Date.parse(b.createdAt) : 0;
          return db - da;
        }
      }
    };

    return [...books]
      .filter(matchesSearch)
      .filter(matchesGenre)
      .filter(matchesYear)
      .filter(matchesScore)
      .sort(sortFn);
  }, [books, search, filterGenre, filterMinYear, filterMaxYear, filterMinScore, sortMode]);

  const filteredLibraryBooks = useMemo(
    () => filteredAndSortedBooks.filter((b) => b.status === 'in-progress'),
    [filteredAndSortedBooks]
  );

  const filteredCompletedBooks = useMemo(
    () => filteredAndSortedBooks.filter((b) => b.status === 'completed'),
    [filteredAndSortedBooks]
  );

  const filteredToReadBooks = useMemo(
    () => filteredAndSortedBooks.filter((b) => b.status === 'to-read'),
    [filteredAndSortedBooks]
  );

  const paginatedInProgressBooks = useMemo(() => {
    const start = pageInProgress * PAGE_SIZE;
    return filteredLibraryBooks.slice(start, start + PAGE_SIZE);
  }, [filteredLibraryBooks, pageInProgress]);

  const paginatedCompletedBooks = useMemo(() => {
    const start = pageCompleted * PAGE_SIZE;
    return filteredCompletedBooks.slice(start, start + PAGE_SIZE);
  }, [filteredCompletedBooks, pageCompleted]);

  const paginatedToReadBooks = useMemo(() => {
    const start = pageToRead * PAGE_SIZE;
    return filteredToReadBooks.slice(start, start + PAGE_SIZE);
  }, [filteredToReadBooks, pageToRead]);

  const domeBooks = useMemo(
    () =>
      books
        .filter((b) => coverUrls[b.id])
        .map((b) => ({
          id: b.id,
          title: b.title || t('books.detail.noTitle', 'Livre sans titre'),
          author: b.author || '',
          coverUrl: coverUrls[b.id],
        })),
    [books, coverUrls, t]
  );

  const handleAddSession = (e) => {
    e.preventDefault();
    if (!selectedBook) {
      alert('Sélectionne un livre pour y ajouter une session de lecture.');
      return;
    }

    if (!sessionForm.durationMinutes && !sessionForm.pagesRead) {
      alert('Merci de renseigner au moins la durée ou les pages lues.');
      return;
    }

    const session = {
      id: `session_${Date.now()}`,
      date: sessionForm.date || new Date().toISOString().slice(0, 10),
      durationMinutes: sessionForm.durationMinutes
        ? Number(sessionForm.durationMinutes) || 0
        : 0,
      pagesRead: sessionForm.pagesRead
        ? Number(sessionForm.pagesRead) || 0
        : 0,
      note: sessionForm.note?.trim() || '',
    };

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id
          ? {
              ...book,
              readingSessions: [...(book.readingSessions || []), session],
            }
          : book
      )
    );

    resetSessionForm();
  };

  const getTotalReadingTime = (book) =>
    (book.readingSessions || []).reduce(
      (sum, s) => sum + (Number(s.durationMinutes) || 0),
      0
    );

  const getTotalPagesRead = (book) =>
    (book.readingSessions || []).reduce(
      (sum, s) => sum + (Number(s.pagesRead) || 0),
      0
    );

  const getAveragePagesPerSession = (book) => {
    const sessions = book.readingSessions || [];
    if (sessions.length === 0) return 0;
    return Math.round((getTotalPagesRead(book) / sessions.length) * 10) / 10;
  };

  const getAverageDurationPerSession = (book) => {
    const sessions = book.readingSessions || [];
    if (sessions.length === 0) return 0;
    return Math.round((getTotalReadingTime(book) / sessions.length) * 10) / 10;
  };

  const getReadingProgressPercent = (book) => {
    const totalPages = Number(book.pages) || 0;
    if (!totalPages || totalPages <= 0) return null;
    const read = getTotalPagesRead(book);
    if (read <= 0) return 0;
    return Math.min(100, Math.round((read / totalPages) * 100));
  };

  const getEstimatedRemainingTimeMinutes = (book) => {
    const totalPages = Number(book.pages) || 0;
    if (!totalPages || totalPages <= 0) return null;

    const totalReadPages = getTotalPagesRead(book);
    const totalMinutes = getTotalReadingTime(book);
    const remainingPages = Math.max(totalPages - totalReadPages, 0);

    if (remainingPages <= 0 || totalReadPages <= 0 || totalMinutes <= 0) {
      return null;
    }

    // Vitesse moyenne de lecture (pages par minute) basée sur l’historique
    const pagesPerMinute = totalReadPages / totalMinutes;
    if (pagesPerMinute <= 0) return null;

    const estimated = remainingPages / pagesPerMinute;
    // Arrondi à la minute la plus proche
    return Math.round(estimated);
  };

  const MAX_BOOK_CARDS = 50;

  // Navigation clavier basique dans les carrousels (← / →)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      // Ne pas interférer quand on est dans un champ de formulaire
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      const inProgress = filteredLibraryBooks;
      const completed = filteredCompletedBooks;

      const allInProgressIds = inProgress.slice(0, MAX_BOOK_CARDS).map((b) => b.id);
      const allCompletedIds = completed.slice(0, MAX_BOOK_CARDS).map((b) => b.id);

      const move = (listIds, currentId, direction) => {
        if (listIds.length === 0) return null;
        if (!currentId) return direction === 'next' ? listIds[0] : listIds[listIds.length - 1];
        const idx = listIds.indexOf(currentId);
        if (idx === -1) return direction === 'next' ? listIds[0] : listIds[listIds.length - 1];
        const nextIdx =
          direction === 'next'
            ? Math.min(idx + 1, listIds.length - 1)
            : Math.max(idx - 1, 0);
        return listIds[nextIdx];
      };

      const direction = event.key === 'ArrowRight' ? 'next' : 'prev';

      let nextId = null;

      if (selectedBookId && allInProgressIds.includes(selectedBookId)) {
        nextId = move(allInProgressIds, selectedBookId, direction);
      } else if (selectedBookId && allCompletedIds.includes(selectedBookId)) {
        nextId = move(allCompletedIds, selectedBookId, direction);
      } else if (allInProgressIds.length > 0) {
        nextId = move(allInProgressIds, null, direction);
      } else if (allCompletedIds.length > 0) {
        nextId = move(allCompletedIds, null, direction);
      }

      if (nextId && nextId !== selectedBookId) {
        setSelectedBookId(nextId);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredLibraryBooks, filteredCompletedBooks, selectedBookId]);

  // Réinitialiser les pages quand les filtres changent
  useEffect(() => {
    setPageInProgress(0);
    setPageCompleted(0);
    setPageToRead(0);
  }, [search, filterGenre, filterMinYear, filterMaxYear, filterMinScore, sortMode]);

  const handleAttachPdfClick = () => {
    if (!selectedBook || !pdfInputRef.current) return;
    pdfInputRef.current.value = '';
    pdfInputRef.current.click();
  };

  const handlePdfFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBook) return;

    const pdfId = `pdf_${selectedBook.id}`;
    const ok = await saveBookPdf(pdfId, file);
    if (!ok) {
      alert("Erreur lors de l'enregistrement du PDF du livre.");
      return;
    }

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id
          ? { ...book, hasPdf: true }
          : book
      )
    );
  };

  const handleAttachCoverClick = () => {
    if (!selectedBook || !coverInputRef.current) return;
    coverInputRef.current.value = '';
    coverInputRef.current.click();
  };

  const handleCoverFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBook) return;

    const coverId = `cover_${selectedBook.id}`;
    const ok = await saveBookCover(coverId, file, { name: file.name || null });

    let inlineDataUrl = null;
    if (!ok) {
      // Fallback robuste : encoder une miniature inline pour garantir la persistance
      inlineDataUrl = await readFileAsDataUrl(file);
      if (inlineDataUrl) {
        alert(
          "IndexedDB ne permet pas de stocker cette couverture (quota ou compatibilité). " +
            'Une version intégrée sera utilisée pour la persistance dans tes sauvegardes.'
        );
      } else {
        alert(
          "Erreur lors de l'enregistrement de la couverture du livre. Tu peux réessayer avec une image plus légère."
        );
      }
    }

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id
          ? {
              ...book,
              hasCover: true,
              coverInline: inlineDataUrl || book.coverInline || null,
            }
          : book
      )
    );

    const localUrl = URL.createObjectURL(file);
    setCoverUrls((prev) => {
      const existing = prev[selectedBook.id];
      if (existing) {
        URL.revokeObjectURL(existing);
      }
      const next = { ...prev, [selectedBook.id]: localUrl };
      coverUrlsRef.current = next;
      return next;
    });
  };

  const handleRemoveCover = async () => {
    if (!selectedBook) return;
    const coverId = `cover_${selectedBook.id}`;

    const ok = await deleteBookCover(coverId);
    if (!ok) {
      alert('Erreur lors de la suppression de la couverture.');
      return;
    }

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id
          ? { ...book, hasCover: false }
          : book
      )
    );

    setCoverUrls((prev) => {
      const existing = prev[selectedBook.id];
      if (existing) {
        try {
          URL.revokeObjectURL(existing);
        } catch {
          // ignore
        }
      }
      const next = { ...prev };
      delete next[selectedBook.id];
      coverUrlsRef.current = next;
      return next;
    });
  };

  const handleViewCover = async () => {
    if (!selectedBook) return;

    // 1) Si on a déjà une URL en mémoire (coverUrls), on l’utilise directement
    const cachedUrl = coverUrls[selectedBook.id];
    if (cachedUrl) {
      try {
        window.open(cachedUrl, '_blank', 'noopener');
        return;
      } catch {
        // on tente alors la voie IndexedDB ci‑dessous
      }
    }

    // 2) Sinon, on essaie de récupérer le blob depuis IndexedDB
    const coverId = `cover_${selectedBook.id}`;

    const record = await getBookCover(coverId);
    if (!record || !record.blob) {
      alert('Aucune couverture trouvée pour ce livre.');
      return;
    }

    try {
      const url = URL.createObjectURL(record.blob);
      window.open(url, '_blank', 'noopener');
      // Libérer l’URL après un délai raisonnable pour éviter les fuites mémoire
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    } catch {
      alert('Impossible dafficher la couverture.');
    }
  };

  const handleRemovePdf = async () => {
    if (!selectedBook) return;
    const pdfId = `pdf_${selectedBook.id}`;

    const ok = await deleteBookPdf(pdfId);
    if (!ok) {
      alert('Erreur lors de la suppression du PDF.');
      return;
    }

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id
          ? { ...book, hasPdf: false }
          : book
      )
    );
  };

  const handleExport = () => {
    const exportData = prepareBooksExportData(books, {
      includeSessions: true,
      includeMetadata: true,
    });
    downloadBooksExportFile(exportData);
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleImportFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const fileData = await importBooksFromFile(file);
      const result = processBooksImportData(
        typeof fileData === 'string' ? fileData : { data: { books: fileData } }
      );

      if (!result.valid) {
        alert(
          `Erreur lors de l'import Livres: ${result.errors?.[0] || 'inconnu'}`
        );
        return;
      }

      setBooks(result.books);
      setSelectedBookId(null);
      resetForm();
      resetSessionForm();
    } catch (error) {
      console.error('Erreur import livres:', error);
      alert("Erreur lors de l'import. Vérifie le fichier JSON.");
    } finally {
      setIsImporting(false);
    }
  };

  const renderBookCard = (book, isCompleted = false) => {
    const coverUrl = coverUrls[book.id];

    return (
      <Card
        key={book.id}
        className={`min-w-[260px] cursor-pointer transition-transform ${
          selectedBookId === book.id ? 'ring-2 ring-purple-500 scale-[1.01]' : ''
        }`}
        hover
        onClick={() => setSelectedBookId(book.id)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {coverUrl && (
              <div className="w-10 h-14 rounded-md overflow-hidden border border-slate-700/70 bg-slate-900/70 flex-shrink-0">
                <img
                  src={coverUrl}
                  alt={book.title || 'Couverture'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-white text-base mb-1">
                {book.title || 'Livre sans titre'}
              </h4>
              {book.author && (
                <p className="text-xs text-slate-300 mb-1">{book.author}</p>
              )}
              <p className="text-[11px] text-slate-400">
                {book.year && <span className="mr-2">{book.year}</span>}
                {book.pages && (
                  <span>
                    • {book.pages}{' '}
                    {t('books.pages', 'pages')}
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 text-[11px] text-slate-300">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide ${
                isCompleted
                  ? 'bg-emerald-600/40 text-emerald-100'
                  : 'bg-blue-600/40 text-blue-100'
              }`}
            >
              {isCompleted
                ? t('books.status.completed', 'Terminé')
                : t('books.status.inProgress', 'En cours')}
            </span>
            {book.personalScore > 0 && (
              <span className="text-amber-300">
                {'★'.repeat(book.personalScore)}
              </span>
            )}
            {getReadingProgressPercent(book) !== null && (
              <div className="w-16 mt-1">
                <div className="h-1 rounded-full bg-slate-700/70 overflow-hidden">
                  <div
                    className="h-1 rounded-full bg-purple-400"
                    style={{
                      width: `${getReadingProgressPercent(book)}%`,
                      transition: 'width 150ms ease-out',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {isLoading && (
        <Card>
          <CardContent>
            <p className="text-sm text-slate-300">
              {t('common.loading', 'Chargement de la bibliothèque de livres...')}
            </p>
          </CardContent>
        </Card>
      )}
      <Card gradient>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-7 h-7 text-purple-300" />
            <div>
              <CardTitle size="lg">
                {t('nav.books', 'Livres')}
              </CardTitle>
              <p className="text-sm text-slate-300 mt-1">
                {t(
                  'books.subtitle',
                  'Gère ta bibliothèque personnelle, tes sessions de lecture et tes sauvegardes — tout est stocké localement dans ton navigateur.'
                )}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          {/* Formulaire principal livre */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                id="book-title"
                label={t('books.form.title', 'Titre du livre')}
                required
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
              <Input
                id="book-author"
                label={t('books.form.author', 'Auteur')}
                value={form.author}
                onChange={(e) => handleChange('author', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                id="book-year"
                type="number"
                label={t('books.form.year', 'Année')}
                value={form.year}
                onChange={(e) => handleChange('year', e.target.value)}
              />
              <Input
                id="book-genre"
                label={t('books.form.genre', 'Genre')}
                placeholder={t(
                  'books.form.genre.placeholder',
                  'Ex : Science-Fiction, Essai...'
                )}
                value={form.genre}
                onChange={(e) => handleChange('genre', e.target.value)}
              />
              <Input
                id="book-pages"
                type="number"
                label={t('books.form.pages', 'Nombre de pages')}
                value={form.pages}
                onChange={(e) => handleChange('pages', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label
                  htmlFor="book-cover-upload"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  {t(
                    'books.form.coverUpload',
                    'Image de couverture (upload)'
                  )}
                </label>
                <input
                  id="book-cover-upload"
                  ref={coverFormInputRef}
                  type="file"
                  accept="image/*"
                  className="block w-full text-xs text-slate-300 file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-700 file:text-slate-100 hover:file:bg-slate-600 cursor-pointer"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setFormCoverFile(file);
                  }}
                />
              </div>
              <Select
                id="book-status"
                label={t('books.form.status', 'Statut')}
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="in-progress">
                  {t('books.status.inProgress', 'En cours')}
                </option>
                <option value="completed">
                  {t('books.status.completed', 'Terminé')}
                </option>
                <option value="to-read">
                  {t('books.status.toRead', 'À lire')}
                </option>
                <option value="paused">
                  {t('books.status.paused', 'En pause')}
                </option>
                <option value="abandoned">
                  {t('books.status.abandoned', 'Abandonné')}
                </option>
              </Select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] gap-4">
              <TextArea
                id="book-short-summary"
                label={t('books.form.shortSummary', 'Résumé court')}
                rows={4}
                maxLength={500}
                value={form.shortSummary}
                onChange={(e) => handleChange('shortSummary', e.target.value)}
              />
              <TextArea
                id="book-long-summary"
                label={t('books.form.longSummary', 'Résumé détaillé')}
                rows={4}
                maxLength={5000}
                value={form.longSummary}
                onChange={(e) => handleChange('longSummary', e.target.value)}
              />
            </div>
            <Input
              id="book-score"
              type="number"
              min={0}
              max={5}
              label={t('books.form.score', 'Note perso (0–5 étoiles)')}
              value={form.personalScore}
              onChange={(e) => handleChange('personalScore', e.target.value)}
              help={t(
                'books.form.score.help',
                'Cette note est purement indicative et reste locale.'
              )}
            />
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="primary">
                {form.id
                  ? t('books.actions.updateBook', 'Mettre à jour le livre')
                  : t('books.actions.addBook', 'Ajouter le livre')}
              </Button>
              {form.id && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={resetForm}
                >
                  {t('books.actions.cancelEdit', 'Annuler la modification')}
                </Button>
              )}
            </div>
          </form>

          {/* Panneau sauvegarde / recherche */}
          <div className="space-y-4">
            <Input
              id="book-search"
              label={t('books.search.label', 'Recherche')}
              placeholder={t(
                'books.search.placeholder',
                'Filtrer par titre ou auteur...'
              )}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              containerClassName="space-y-2"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-200">
              <div className="space-y-2">
                <p className="font-semibold">
                  {t('books.filters.title', 'Filtres avancés')}
                </p>
                <Input
                  id="filter-genre"
                  label={t('books.filters.genre', 'Filtrer par genre')}
                  value={filterGenre}
                  onChange={(e) => setFilterGenre(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    id="filter-min-year"
                    type="number"
                    label={t('books.filters.minYear', 'Année min')}
                    value={filterMinYear}
                    onChange={(e) => setFilterMinYear(e.target.value)}
                  />
                  <Input
                    id="filter-max-year"
                    type="number"
                    label={t('books.filters.maxYear', 'Année max')}
                    value={filterMaxYear}
                    onChange={(e) => setFilterMaxYear(e.target.value)}
                  />
                </div>
                <Input
                  id="filter-min-score"
                  type="number"
                  min={0}
                  max={5}
                  label={t('books.filters.minScore', 'Note minimale')}
                  value={filterMinScore}
                  onChange={(e) => setFilterMinScore(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <p className="font-semibold">
                  {t('books.filters.sortTitle', 'Tri')}
                </p>
                <Select
                  id="sort-mode"
                  label={t('books.filters.sortBy', 'Trier par')}
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value)}
                >
                  <option value="recent">
                    {t('books.filters.sort.recent', 'Plus récents d’abord')}
                  </option>
                  <option value="title">
                    {t('books.filters.sort.title', 'Titre (A → Z)')}
                  </option>
                  <option value="author">
                    {t('books.filters.sort.author', 'Auteur (A → Z)')}
                  </option>
                  <option value="pages">
                    {t('books.filters.sort.pages', 'Nombre de pages (décroissant)')}
                  </option>
                  <option value="score">
                    {t('books.filters.sort.score', 'Note perso (décroissante)')}
                  </option>
                </Select>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={Download}
                onClick={handleExport}
              >
                {t('books.actions.export', 'Exporter JSON')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                icon={Upload}
                loading={isImporting}
                onClick={handleImportClick}
              >
                {t('books.actions.import', 'Importer JSON')}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleImportFileChange}
              />
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <Search className="w-3 h-3" />
                {t(
                  'books.hint.localStorage',
                  'Toutes les données sont stockées localement (localStorage). Tu peux les sauvegarder ou les restaurer via les boutons ci-dessus.'
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Suspense
        fallback={
          <Card>
            <CardContent>
              <p className="text-sm text-slate-300">
                {t('books.dome.loading', 'Chargement de la vue 3D...')}
              </p>
            </CardContent>
          </Card>
        }
      >
        <BooksDomeGallery
          books={domeBooks}
          onBookOpen={(id) => setSelectedBookId(id)}
          dragSensitivity={50}
          dragDampening={0.3}
          maxVerticalRotationDeg={8}
        />
      </Suspense>

      {/* Carrousels simplifiés */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle size="md">
              {t('books.sections.inProgress', 'Livres en cours')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredLibraryBooks.length === 0 ? (
              <p className="text-sm text-slate-400">
                {t(
                  'books.empty.inProgress',
                  'Aucun livre en cours pour le moment. Ajoute un livre avec le formulaire ci-dessus.'
                )}
              </p>
            ) : (
              <>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {paginatedInProgressBooks.map((book) => renderBookCard(book, false))}
                </div>
                {filteredLibraryBooks.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>
                      Page {pageInProgress + 1} /{' '}
                      {Math.max(1, Math.ceil(filteredLibraryBooks.length / PAGE_SIZE))}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded border border-slate-600 disabled:opacity-40"
                        onClick={() =>
                          setPageInProgress((p) => Math.max(0, p - 1))
                        }
                        disabled={pageInProgress === 0}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded border border-slate-600 disabled:opacity-40"
                        onClick={() =>
                          setPageInProgress((p) =>
                            Math.min(
                              Math.max(0, Math.ceil(filteredLibraryBooks.length / PAGE_SIZE) - 1),
                              p + 1
                            )
                          )
                        }
                        disabled={
                          pageInProgress >=
                          Math.max(0, Math.ceil(filteredLibraryBooks.length / PAGE_SIZE) - 1)
                        }
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="md">
              {t('books.sections.completed', 'Livres terminés')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredCompletedBooks.length === 0 ? (
              <p className="text-sm text-slate-400">
                {t(
                  'books.empty.completed',
                  'Tu n’as pas encore marqué de livre comme terminé.'
                )}
              </p>
            ) : (
              <>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {paginatedCompletedBooks.map((book) => renderBookCard(book, true))}
                </div>
                {filteredCompletedBooks.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>
                      Page {pageCompleted + 1} /{' '}
                      {Math.max(1, Math.ceil(filteredCompletedBooks.length / PAGE_SIZE))}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded border border-slate-600 disabled:opacity-40"
                        onClick={() =>
                          setPageCompleted((p) => Math.max(0, p - 1))
                        }
                        disabled={pageCompleted === 0}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded border border-slate-600 disabled:opacity-40"
                        onClick={() =>
                          setPageCompleted((p) =>
                            Math.min(
                              Math.max(0, Math.ceil(filteredCompletedBooks.length / PAGE_SIZE) - 1),
                              p + 1
                            )
                          )
                        }
                        disabled={
                          pageCompleted >=
                          Math.max(
                            0,
                            Math.ceil(filteredCompletedBooks.length / PAGE_SIZE) - 1
                          )
                        }
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle size="md">
              {t('books.sections.toRead', 'Livres à lire')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredToReadBooks.length === 0 ? (
              <p className="text-sm text-slate-400">
                {t(
                  'books.empty.toRead',
                  'Tu n’as pas encore de livres marqués comme "À lire".'
                )}
              </p>
            ) : (
              <>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {paginatedToReadBooks.map((book) => renderBookCard(book, false))}
                </div>
                {filteredToReadBooks.length > PAGE_SIZE && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>
                      Page {pageToRead + 1} /{' '}
                      {Math.max(1, Math.ceil(filteredToReadBooks.length / PAGE_SIZE))}
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded border border-slate-600 disabled:opacity-40"
                        onClick={() =>
                          setPageToRead((p) => Math.max(0, p - 1))
                        }
                        disabled={pageToRead === 0}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        className="px-2 py-0.5 rounded border border-slate-600 disabled:opacity-40"
                        onClick={() =>
                          setPageToRead((p) =>
                            Math.min(
                              Math.max(0, Math.ceil(filteredToReadBooks.length / PAGE_SIZE) - 1),
                              p + 1
                            )
                          )
                        }
                        disabled={
                          pageToRead >=
                          Math.max(0, Math.ceil(filteredToReadBooks.length / PAGE_SIZE) - 1)
                        }
                      >
                        ›
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Détail du livre sélectionné + sessions */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div>
            <CardTitle size="md">
              {selectedBook
                ? selectedBook.title || t('books.detail.noTitle', 'Livre sans titre')
                : t('books.detail.noSelection', 'Aucun livre sélectionné')}
            </CardTitle>
            <p className="text-sm text-slate-400 mt-1">
              {selectedBook
                ? t(
                    'books.detail.subtitle',
                    'Historique de lecture et statistiques pour ce livre.'
                  )
                : t(
                    'books.detail.subtitle.empty',
                    'Clique sur un livre dans les carrousels pour voir son détail et ajouter des sessions de lecture.'
                  )}
            </p>
          </div>
          {selectedBook && (
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(selectedBook)}
              >
                {t('books.actions.editBook', 'Éditer')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => handleDelete(selectedBook)}
              >
                {t('books.actions.deleteBook', 'Supprimer')}
              </Button>
              <span className="text-xs text-slate-400 ml-2">
                {selectedBook.hasPdf
                  ? t('books.assets.pdfAttached', 'PDF associé')
                  : t('books.assets.noPdf', 'Aucun PDF associé')}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAttachPdfClick}
              >
                {t('books.assets.attachPdf', 'Joindre un PDF')}
              </Button>
              {selectedBook.hasPdf && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={handleRemovePdf}
                >
                  {t('books.assets.removePdf', 'Supprimer le PDF')}
                </Button>
              )}
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfFileChange}
              />
              <span className="text-xs text-slate-400 ml-4">
                {selectedBook.hasCover
                  ? t('books.assets.coverAttached', 'Couverture associée')
                  : t('books.assets.noCover', 'Aucune couverture associée')}
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleAttachCoverClick}
              >
                {selectedBook.hasCover
                  ? t('books.assets.changeCover', 'Changer la couverture')
                  : t('books.assets.attachCover', 'Ajouter une couverture')}
              </Button>
              {selectedBook.hasCover && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleViewCover}
                  >
                    {t('books.assets.viewCover', 'Voir la couverture')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveCover}
                  >
                    {t('books.assets.removeCover', 'Supprimer la couverture')}
                  </Button>
                </>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleCoverFileChange}
              />
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedBook ? (
            <>
              <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
                <div>
                  <p className="font-semibold">
                    {t('books.detail.author', 'Auteur')}
                  </p>
                  <p>{selectedBook.author || '—'}</p>
                </div>
                <div>
                  <p className="font-semibold">
                    {t('books.detail.genre', 'Genre')}
                  </p>
                  <p>{selectedBook.genre || '—'}</p>
                </div>
                <div>
                  <p className="font-semibold">
                    {t('books.detail.year', 'Année')}
                  </p>
                  <p>{selectedBook.year || '—'}</p>
                </div>
                <div>
                  <p className="font-semibold">
                    {t('books.detail.pages', 'Pages')}
                  </p>
                  <p>{selectedBook.pages || '—'}</p>
                </div>
                <div>
                  <p className="font-semibold">
                    {t('books.stats.sessionsCount', 'Nombre de sessions')}
                  </p>
                  <p>{(selectedBook.readingSessions || []).length}</p>
                </div>
              </div>

              {selectedBook.notes && (
                <div className="text-sm text-slate-300">
                  <p className="font-semibold mb-1">
                    {t('books.detail.notes', 'Notes')}
                  </p>
                  <p className="whitespace-pre-line">{selectedBook.notes}</p>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
                <div>
                  <p className="font-semibold">
                    {t('books.stats.totalTime', 'Temps total de lecture')}
                  </p>
                  <p>
                    {getTotalReadingTime(selectedBook)}{' '}
                    {t('books.stats.minutes', 'minutes')}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">
                    {t('books.stats.totalPages', 'Pages lues au total')}
                  </p>
                  <p>{getTotalPagesRead(selectedBook)}</p>
                </div>
                <div>
                  <p className="font-semibold">
                    {t(
                      'books.stats.avgPagesPerSession',
                      'Pages moyennes par session'
                    )}
                  </p>
                  <p>{getAveragePagesPerSession(selectedBook)}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3 text-sm text-slate-300">
                <div>
                  <p className="font-semibold">
                    {t(
                      'books.stats.avgDurationPerSession',
                      'Durée moyenne par session (minutes)'
                    )}
                  </p>
                  <p>{getAverageDurationPerSession(selectedBook)}</p>
                </div>
                <div>
                  <p className="font-semibold">
                    {t(
                      'books.stats.progress',
                      'Progression estimée du livre (%)'
                    )}
                  </p>
                  <p>
                    {getReadingProgressPercent(selectedBook) ?? '—'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold">
                    {t(
                      'books.stats.estimatedRemaining',
                      'Temps estimé restant'
                    )}
                  </p>
                  <p>
                    {(() => {
                      const value = getEstimatedRemainingTimeMinutes(
                        selectedBook
                      );
                      if (value == null) return '—';
                      return `${value} ${t('books.stats.minutes', 'minutes')}`;
                    })()}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                {/* Liste des sessions */}
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-slate-200">
                    {t('books.sessions.listTitle', 'Sessions de lecture')}
                  </p>
                  {(selectedBook.readingSessions || []).length === 0 ? (
                    <p className="text-sm text-slate-400">
                      {t(
                        'books.sessions.empty',
                        'Aucune session enregistrée pour le moment.'
                      )}
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm text-slate-200 max-h-56 overflow-y-auto pr-1">
                      {selectedBook.readingSessions.map((session) => (
                        <li
                          key={session.id}
                          className="flex items-start justify-between gap-3 border border-slate-700/60 rounded-md px-3 py-2 bg-slate-900/40"
                        >
                          <div>
                            <p className="font-semibold text-xs text-slate-200">
                              {session.date || '—'}
                            </p>
                            <p className="text-xs text-slate-300 mt-0.5">
                              {session.durationMinutes > 0 && (
                                <span className="mr-2">
                                  {session.durationMinutes}{' '}
                                  {t('books.stats.minutes', 'minutes')}
                                </span>
                              )}
                              {session.pagesRead > 0 && (
                                <span>
                                  • {session.pagesRead}{' '}
                                  {t('books.pages', 'pages')}
                                </span>
                              )}
                            </p>
                            {session.note && (
                              <p className="text-[11px] text-slate-400 mt-1">
                                {session.note}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Formulaire session */}
                <form
                  onSubmit={handleAddSession}
                  className="space-y-3 border border-slate-700/60 rounded-md p-3 bg-slate-900/40"
                >
                  <p className="font-semibold text-sm text-slate-200">
                    {t(
                      'books.sessions.addTitle',
                      'Ajouter une session de lecture'
                    )}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      id="session-date"
                      type="date"
                      label={t('books.sessions.date', 'Date')}
                      value={sessionForm.date}
                      onChange={(e) =>
                        handleSessionChange('date', e.target.value)
                      }
                    />
                    <Input
                      id="session-duration"
                      type="number"
                      min={0}
                      label={t(
                        'books.sessions.duration',
                        'Durée (minutes)'
                      )}
                      value={sessionForm.durationMinutes}
                      onChange={(e) =>
                        handleSessionChange('durationMinutes', e.target.value)
                      }
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      id="session-pages"
                      type="number"
                      min={0}
                      label={t(
                        'books.sessions.pages',
                        'Pages lues pendant la session'
                      )}
                      value={sessionForm.pagesRead}
                      onChange={(e) =>
                        handleSessionChange('pagesRead', e.target.value)
                      }
                    />
                    <TextArea
                      id="session-note"
                      rows={3}
                      label={t('books.sessions.note', 'Note (optionnel)')}
                      value={sessionForm.note}
                      onChange={(e) =>
                        handleSessionChange('note', e.target.value)
                      }
                    />
                  </div>
                  <Button type="submit" size="sm" variant="primary">
                    {t(
                      'books.sessions.addButton',
                      'Ajouter la session de lecture'
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              {t(
                'books.detail.noSelectionLong',
                'Sélectionne un livre dans les listes ci-dessus pour voir ses détails, son historique de lecture et ajouter des sessions.'
              )}
            </p>
          )}
        </CardContent>
        <CardFooter>
          <p className="text-[11px] text-slate-500">
            {t(
              'books.footer.info',
              "Cette première version de l’onglet Livres implémente la gestion locale des livres et des sessions de lecture. Les fonctionnalités avancées décrites dans la documentation (sphère 3D, PDFs en IndexedDB, sauvegardes multi‑formats) pourront être ajoutées progressivement sans impacter le reste du site."
            )}
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BooksTab;

