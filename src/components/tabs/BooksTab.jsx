/**
 * BooksTab - Composant principal refactorisé
 * 
 * ✅ PHASE 4 : Refactoring complet avec hooks et composants extraits
 * 
 * @module components/tabs/BooksTab/BooksTab.refactored
 */

import React, { Suspense, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { BOOKS_OPEN_NAV_EVENT } from '../../utils/booksSidebarNav';
import { BookOpen, Calendar, Download, Search, Upload, BarChart3, Library } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import Button from '../ui/Button';
import { Input, TextArea, Select } from '../ui/Input';
import ErrorBoundary from '../ui/ErrorBoundary';
import './booksLiquidGlass.css';
import { useTranslation } from '../../utils/translations';
import { useBooksStorage } from '../../hooks/useBooksStorage';
import BookCard from '../books/BookCard';
import StatisticsSubTab from './books/StatisticsSubTab';
import BookFinder from '../BookFinder/BookFinder';
import BooksCalendarView from '../books/BooksCalendarView';
import ReadingSessionCriteriaSliders from '../books/ReadingSessionCriteriaSliders';
import BookCompletionDialog from '../books/BookCompletionDialog';
import BookSessionFeedbackReadonly from '../books/BookSessionFeedbackReadonly';
import {
  suggestPagesFromHistory,
  aggregateCriteriaMeansForBook,
  getBookDisplayRating,
  averageCriteriaScore,
} from '../../utils/bookReadingRatings';

// Hooks personnalisés
import { useBooksFilters } from './BooksTab/hooks/useBooksFilters';
import { useBooksProgress } from './BooksTab/hooks/useBooksProgress';
import { useBooksPagination } from './BooksTab/hooks/useBooksPagination';
import { useBooksActions } from './BooksTab/hooks/useBooksActions';
import { useBooksSessions } from './BooksTab/hooks/useBooksSessions';
import { useBooksImportExport } from './BooksTab/hooks/useBooksImportExport';
import { useBooksCovers } from './BooksTab/hooks/useBooksCovers';
import { useBooksAssets } from './BooksTab/hooks/useBooksAssets';
import BooksXPBar from './BooksTab/components/BooksXPBar';

// Utilitaires
import {
  getTotalReadingTime,
  getTotalPagesRead,
  getAveragePagesPerSession,
  getAverageDurationPerSession,
  getReadingProgressPercent,
  getEstimatedRemainingTimeMinutes,
} from './BooksTab/utils';
import { PAGE_SIZE } from './BooksTab/constants';

// Lazy loading
const BooksDomeGallery = React.lazy(() =>
  import('../books/BooksDomeGallery')
);

/**
 * Composant principal BooksTab refactorisé
 * 
 * Utilise des hooks personnalisés pour :
 * - Filtres et recherche (useBooksFilters)
 * - Progression des livres (useBooksProgress)
 * - Pagination (useBooksPagination)
 * - Actions CRUD (useBooksActions)
 * - Sessions de lecture (useBooksSessions)
 * - Import/Export (useBooksImportExport)
 * - Couvertures (useBooksCovers)
 * - Assets (PDF, couvertures) (useBooksAssets)
 */
const BooksTab = () => {
  const t = useTranslation();
  const { books, setBooks, isLoading } = useBooksStorage();

  /** Boutons onglet Livres : fond noir, contour bleu (actif = contour plus clair). */
  const booksBtnClass = (active, size = 'md') => {
    const sizing =
      size === 'sm' ? 'min-w-[2rem] px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm';
    return `rounded-lg border-2 bg-black font-semibold transition ${sizing} ${
      active
        ? 'border-sky-400 text-sky-100 shadow-[0_0_14px_rgba(56,189,248,0.35)]'
        : 'border-blue-600/70 text-blue-200 hover:border-sky-400/90 hover:text-sky-50'
    } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-blue-600/70`;
  };
  
  // ✅ PHASE 1 : Persistance de l'état actif dans localStorage
  const [activeSubTab, setActiveSubTab] = useState(() => {
    try {
      const saved = localStorage.getItem('books.activeSubTab');
      return saved || 'library';
    } catch (error) {
      console.warn('[BooksTab] Erreur lecture localStorage:', error);
      return 'library';
    }
  });
  
  // ✅ PHASE 1 : Sauvegarder l'état actif dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('books.activeSubTab', activeSubTab);
    } catch (error) {
      console.warn('[BooksTab] Erreur sauvegarde localStorage:', error);
    }
  }, [activeSubTab]);

  // Émettre un événement lors du changement de sous-onglet
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: activeSubTab, isSubTab: true, parentTab: 'books' } 
    }));
  }, [activeSubTab]);

  const scrollToBookFicheRef = useRef(false);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [show3D, setShow3D] = useState(true);

  const applyBooksNavParams = useCallback(() => {
    try {
      const raw = sessionStorage.getItem('nav_params_books');
      if (!raw) return;
      const params = JSON.parse(raw);
      if (!params) return;
      if (params.bookId != null) {
        setSelectedBookId(params.bookId);
        setActiveSubTab('library');
        scrollToBookFicheRef.current = true;
      } else if (params.showGlobe) {
        setActiveSubTab('library');
        setShow3D(true);
        setTimeout(() => {
          document.getElementById('books-library-globe-anchor')?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 200);
      } else if (params.tab === 'calendar') {
        setActiveSubTab('calendar');
      } else if (params.tab === 'statistics' || params.tab === 'stats') {
        setActiveSubTab('statistics');
        if (params.statsNavigation) {
          try {
            sessionStorage.setItem('books.stats.pendingNavigation', JSON.stringify(params.statsNavigation));
          } catch {
            /* ignore */
          }
        }
      } else if (params.action === 'addBook') {
        setActiveSubTab('library');
        setTimeout(() => {
          const titleInput = document.getElementById('book-title');
          if (titleInput) {
            titleInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            titleInput.focus();
          }
        }, 120);
      }
      sessionStorage.removeItem('nav_params_books');
    } catch (_) {
      sessionStorage.removeItem('nav_params_books');
    }
  }, []);

  useEffect(() => {
    applyBooksNavParams();
    window.addEventListener(BOOKS_OPEN_NAV_EVENT, applyBooksNavParams);
    return () => window.removeEventListener(BOOKS_OPEN_NAV_EVENT, applyBooksNavParams);
  }, [applyBooksNavParams]);

  const [summaryTab, setSummaryTab] = useState('short'); // 'short' | 'long' | 'notes'
  const [isEditingSummaries, setIsEditingSummaries] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState({
    short: '',
    long: '',
  });

  const buildBookMetaLine = (book) => {
    if (!book) return '';
    const parts = [];
    if (book.author) parts.push(book.author);
    if (book.year) parts.push(book.year);
    if (book.genre) parts.push(book.genre);
    if (book.pages) {
      parts.push(
        `${book.pages} ${t('books.detail.pagesLabel', 'pages')}`
      );
    }
    return parts.join(' · ');
  };

  // ✅ PHASE 4 : Hooks personnalisés
  const {
    search,
    setSearch,
    filterGenre,
    setFilterGenre,
    filterMinYear,
    setFilterMinYear,
    filterMaxYear,
    setFilterMaxYear,
    filterMinScore,
    setFilterMinScore,
    sortMode,
    setSortMode,
    filteredAndSortedBooks,
  } = useBooksFilters(books);

  const {
    booksWithProgress,
    filteredAndSortedBooksWithProgress,
    filteredLibraryBooks,
    filteredCompletedBooks,
    filteredToReadBooks,
  } = useBooksProgress(books, filteredAndSortedBooks);

  const {
    pageInProgress,
    setPageInProgress,
    pageCompleted,
    setPageCompleted,
    pageToRead,
    setPageToRead,
    paginatedInProgressBooks,
    paginatedCompletedBooks,
    paginatedToReadBooks,
  } = useBooksPagination(filteredLibraryBooks, filteredCompletedBooks, filteredToReadBooks);

  const { coverUrls, setCoverUrls, coverUrlsRef } = useBooksCovers(books, show3D);

  const {
    form,
    setForm,
    formCoverFile,
    setFormCoverFile,
    coverFormInputRef,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleStatusChange,
    resetForm,
  } = useBooksActions(books, setBooks, coverUrls, setCoverUrls, coverUrlsRef);

  const selectedBook = useMemo(
    () => books.find((b) => b.id === selectedBookId) || null,
    [books, selectedBookId]
  );

  // Mettre à jour les brouillons quand on change de livre
  useEffect(() => {
    if (!selectedBook) return;
    setSummaryDraft({
      short: selectedBook.shortSummary || '',
      long: selectedBook.longSummary || '',
    });
    setIsEditingSummaries(false);
  }, [selectedBook]);

  const handleSaveSummariesInline = () => {
    if (!selectedBook) return;
    const updated = books.map((b) =>
      b.id === selectedBook.id
        ? {
            ...b,
            shortSummary: summaryDraft.short.trim(),
            longSummary: summaryDraft.long.trim(),
          }
        : b
    );
    setBooks(updated);
    setIsEditingSummaries(false);
  };

  // Descendre jusqu'à la fiche du livre quand on arrive depuis la sidebar (clic sur le livre en cours)
  useEffect(() => {
    if (!scrollToBookFicheRef.current || !selectedBook) return;
    const timer = setTimeout(() => {
      const el = document.getElementById('book-fiche');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      scrollToBookFicheRef.current = false;
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedBookId, selectedBook]);

  const {
    sessionForm,
    sessionFormDirty,
    setSessionForm,
    handleSessionChange,
    handleCriteriaRatingChange,
    handleAddSession,
    resetSessionForm,
    editingSessionId,
    startEditSession,
    cancelEditSession,
    pendingBookCompletion,
    dismissPendingBookCompletion,
    confirmBookCompletion,
  } = useBooksSessions(books, setBooks, selectedBook, selectedBookId);

  const {
    isImporting,
    fileInputRef,
    handleExport,
    handleImportClick,
    handleImportFileChange,
  } = useBooksImportExport(books, setBooks, coverUrls, setCoverUrls, coverUrlsRef);

  const {
    pdfInputRef,
    coverInputRef,
    handleAttachPdfClick,
    handlePdfFileChange,
    handleAttachCoverClick,
    handleCoverFileChange,
    handleRemoveCover,
    handleViewCover,
    handleRemovePdf,
  } = useBooksAssets(books, setBooks, selectedBook, coverUrls, setCoverUrls, coverUrlsRef);

  // Réinitialiser les pages quand les filtres changent
  useEffect(() => {
    setPageInProgress(0);
    setPageCompleted(0);
    setPageToRead(0);
  }, [search, filterGenre, filterMinYear, filterMaxYear, filterMinScore, sortMode]);

  // Debug: Log les livres quand ils changent (uniquement en développement)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && books.length > 0) {
      console.log('[BooksTab] Livres dans l\'état:', books.length);
      console.log('[BooksTab] Répartition par statut:', {
        'in-progress': books.filter(b => b.status === 'in-progress').length,
        'completed': books.filter(b => b.status === 'completed').length,
        'to-read': books.filter(b => b.status === 'to-read').length,
        'abandoned': books.filter(b => b.status === 'abandoned').length,
        'paused': books.filter(b => b.status === 'paused').length,
      });
    }
  }, [books]);

  // useCallback pour stabiliser handleBookClick
  const handleBookClick = useCallback((bookId) => {
    setSelectedBookId(bookId);
  }, []);

  // useCallback pour stabiliser handleAddSession (version pour le bouton dans BookCard)
  const handleAddSessionFromCard = useCallback((bookId) => {
    setSelectedBookId(bookId);
    setTimeout(() => {
      const sessionForm = document.querySelector('[data-session-form]');
      if (sessionForm) {
        sessionForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  const handleBookOpenFromDome = useCallback((bookId) => {
    setSelectedBookId(bookId);
    const scrollToSessionForm = () => {
      const el =
        document.getElementById('book-session-form-section') ||
        document.querySelector('[data-session-form]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      return false;
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!scrollToSessionForm()) {
          setTimeout(scrollToSessionForm, 280);
        }
      });
    });
  }, []);

  // OPTIMISATION: Utiliser le composant BookCard mémoizé
  const renderBookCard = (book, isCompleted = false) => {
    const coverUrl = coverUrls[book.id];
    const progressPercent = book._progressPercent !== undefined 
      ? book._progressPercent 
      : getReadingProgressPercent(book);

    return (
      <BookCard
        key={book.id}
        book={book}
        coverUrl={coverUrl}
        progressPercent={progressPercent}
        selectedBookId={selectedBookId}
        onBookClick={handleBookClick}
        onStatusChange={handleStatusChange}
        onAddSession={handleAddSessionFromCard}
      />
    );
  };

  // Calculer domeBooks pour la vue 3D
  const domeBooks = useMemo(
    () =>
      booksWithProgress
        .filter((b) => b.hasCover && coverUrls[b.id])
        .map((b) => ({
          id: b.id,
          title: b.title || t('books.detail.noTitle', 'Livre sans titre'),
          author: b.author || '',
          genre: b.genre || '',
          year: b.year || null,
          pages: b.pages || null,
          personalScore: getBookDisplayRating(b).value,
          status: b.status || 'in-progress',
          shortSummary: b.shortSummary || b.notes || '',
          coverUrl: coverUrls[b.id],
        })),
    [booksWithProgress, coverUrls, t]
  );

  // Navigation clavier basique dans les carrousels (← / →)
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;

      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      const inProgress = filteredLibraryBooks;
      const completed = filteredCompletedBooks;

      const MAX_BOOK_CARDS = 50;
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

  const suggestedPagesHint = useMemo(() => {
    if (!selectedBook) return null;
    const dm = Number(sessionForm.durationMinutes);
    if (!Number.isFinite(dm) || dm <= 0) return null;
    return suggestPagesFromHistory(selectedBook, dm);
  }, [selectedBook, sessionForm.durationMinutes]);

  const sessionCriteriaPreview = useMemo(
    () => averageCriteriaScore(sessionForm.criteriaRatings),
    [sessionForm.criteriaRatings]
  );

  const selectedBookRatingAgg = useMemo(() => {
    if (!selectedBook) return null;
    return aggregateCriteriaMeansForBook(selectedBook.readingSessions);
  }, [selectedBook]);

  return (
    <>
      <BookCompletionDialog
        pending={pendingBookCompletion}
        onConfirm={confirmBookCompletion}
        onDismiss={dismissPendingBookCompletion}
      />
      <div className="relative min-h-screen">
      <div className="relative z-10 space-y-8 p-8">
        <BooksXPBar />
        {isLoading && (
          <Card variant="books">
            <CardContent>
              <p className="text-sm text-[#93c5fd]/90">
                {t('common.loading', 'Chargement de la bibliothèque de livres...')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Header avec navigation par sous-onglets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 rounded-2xl border-2 border-[#3A86FF] bg-black px-5 py-4 shadow-lg shadow-black/30">
            <div className="flex items-center gap-4">
              <BookOpen className="w-8 h-8 text-sky-300 shrink-0" />
              <div>
                <h1 className="text-3xl font-bold text-sky-100 tracking-tight">
                  {t('nav.books', 'Livres')}
                </h1>
              </div>
            </div>
            {activeSubTab === 'library' && (
              <button
                type="button"
                onClick={() => setShow3D(!show3D)}
                className={booksBtnClass(show3D, 'md')}
              >
                {show3D
                  ? t('books.dome.hide', 'Masquer la vue 3D')
                  : t('books.dome.show', 'Afficher la vue 3D')}
              </button>
            )}
          </div>

          {/* Navigation par sous-onglets */}
          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setActiveSubTab('library')}
              className={`${booksBtnClass(activeSubTab === 'library', 'md')} flex items-center gap-2`}
            >
              <Library className="w-4 h-4" />
              {t('books.subtabs.library', 'Bibliothèque')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('statistics')}
              className={`${booksBtnClass(activeSubTab === 'statistics', 'md')} flex items-center gap-2`}
            >
              <BarChart3 className="w-4 h-4" />
              {t('books.subtabs.statistics', 'Statistiques')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('calendar')}
              className={`${booksBtnClass(activeSubTab === 'calendar', 'md')} flex items-center gap-2`}
            >
              <Calendar className="w-4 h-4" />
              {t('books.subtabs.calendar', 'Calendrier')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('bookfinder')}
              className={`${booksBtnClass(activeSubTab === 'bookfinder', 'md')} flex items-center gap-2`}
            >
              <Search className="w-4 h-4" />
              {t('books.subtabs.bookfinder', 'BookFinder')}
            </button>
          </div>
        </div>

        {/* Contenu conditionnel selon le sous-onglet actif */}
        <ErrorBoundary
          context={{ activeSubTab, tab: 'books', booksCount: books.length }}
          title={`Erreur dans ${
            activeSubTab === 'statistics'
              ? 'Statistiques'
              : activeSubTab === 'bookfinder'
                ? 'BookFinder'
                : activeSubTab === 'calendar'
                  ? 'Calendrier'
                  : 'Bibliothèque'
          }`}
          message="Une erreur s'est produite dans ce sous-onglet. Vous pouvez réessayer ou changer de sous-onglet."
        >
          {activeSubTab === 'statistics' ? (
            <StatisticsSubTab books={books} setBooks={setBooks} />
          ) : activeSubTab === 'calendar' ? (
            <BooksCalendarView books={books} coverUrls={coverUrls} setBooks={setBooks} />
          ) : activeSubTab === 'bookfinder' ? (
            <div className="max-w-3xl mx-auto">
              <BookFinder />
            </div>
          ) : (
            // Contenu de la bibliothèque - Le reste du code reste identique pour préserver la fonctionnalité
            // Cette partie sera remplacée progressivement par des composants extraits
            <div className="space-y-6">
              {/* Formulaire et Recherche/Filtres en grille */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Formulaire d'ajout / édition de livre */}
                <Card variant="books">
                  <CardHeader className="border-b border-[#3A86FF]/25">
                    <CardTitle tone="books" size="md" className="normal-case tracking-wide">
                      {t('books.form.title', 'Ajouter/Modifier un livre')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[#93c5fd]/90">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Champs toujours visibles */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          id="book-title"
                          variant="glass"
                          label={t('books.form.title', 'Titre du livre')}
                          required
                          value={form.title}
                          onChange={(e) => handleChange('title', e.target.value)}
                        />
                        <Input
                          id="book-author"
                          variant="glass"
                          label={t('books.form.author', 'Auteur')}
                          value={form.author}
                          onChange={(e) => handleChange('author', e.target.value)}
                        />
                      </div>
                      
                      {/* Champs toujours visibles : Année, Genre, Pages, Couverture, Statut */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input
                          id="book-year"
                          type="number"
                          variant="glass"
                          label={t('books.form.year', 'Année')}
                          value={form.year}
                          onChange={(e) => handleChange('year', e.target.value)}
                        />
                        <Input
                          id="book-genre"
                          variant="glass"
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
                          variant="glass"
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
                            className="books-glass-file-input block w-full text-xs cursor-pointer"
                            onChange={(event) => {
                              const file = event.target.files?.[0] || null;
                              setFormCoverFile(file);
                            }}
                          />
                        </div>
                        <Select
                          id="book-status"
                          variant="glass"
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
                      
                      {/* Résumé court / détaillé */}
                      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.6fr)] gap-4">
                        <TextArea
                          id="book-short-summary"
                          variant="glass"
                          label={t('books.form.shortSummary', 'Résumé court')}
                          rows={4}
                          maxLength={500}
                          value={form.shortSummary}
                          onChange={(e) => handleChange('shortSummary', e.target.value)}
                        />
                        <TextArea
                          id="book-long-summary"
                          variant="glass"
                          label={t('books.form.longSummary', 'Résumé détaillé')}
                          rows={4}
                          maxLength={5000}
                          value={form.longSummary}
                          onChange={(e) => handleChange('longSummary', e.target.value)}
                        />
                      </div>

                      {/* Note perso */}
                      <Input
                        id="book-score"
                        type="number"
                        variant="glass"
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

                      {/* Boutons d'action en bas du formulaire */}
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="submit"
                          className={booksBtnClass(true, 'md')}
                        >
                          {form.id
                            ? t('books.actions.updateBook', 'Mettre à jour le livre')
                            : t('books.actions.addBook', 'Ajouter le livre')}
                        </button>
                        {form.id && (
                          <button
                            type="button"
                            onClick={resetForm}
                            className={booksBtnClass(false, 'sm')}
                          >
                            {t('books.actions.cancelEdit', 'Annuler la modification')}
                          </button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Recherche & Filtres */}
                <Card variant="books">
                  <CardHeader className="border-b border-[#3A86FF]/25">
                    <CardTitle tone="books" size="md" className="normal-case tracking-wide">
                      {t('books.filters.title', 'Recherche & Filtres')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-[#93c5fd]/90">
                    <div className="space-y-4">
                      <Input
                        id="book-search"
                        variant="glass"
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
                            variant="glass"
                            label={t('books.filters.genre', 'Filtrer par genre')}
                            value={filterGenre}
                            onChange={(e) => setFilterGenre(e.target.value)}
                          />
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 min-w-0">
                              <Input
                                id="filter-min-year"
                                type="number"
                                variant="glass"
                                label={t('books.filters.minYear', 'Année min')}
                                value={filterMinYear}
                                onChange={(e) => setFilterMinYear(e.target.value)}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Input
                                id="filter-max-year"
                                type="number"
                                variant="glass"
                                label={t('books.filters.maxYear', 'Année max')}
                                value={filterMaxYear}
                                onChange={(e) => setFilterMaxYear(e.target.value)}
                              />
                            </div>
                          </div>
                          <Input
                            id="filter-min-score"
                            type="number"
                            variant="glass"
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
                            variant="glass"
                            label={t('books.filters.sortBy', 'Trier par')}
                            value={sortMode}
                            onChange={(e) => setSortMode(e.target.value)}
                          >
                            <option value="recent">
                              {t('books.filters.sort.recent', "Plus récents d'abord")}
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
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Actions Export/Import */}
              <Card variant="books" className="mb-6">
                <CardHeader className="border-b border-[#3A86FF]/25">
                  <CardTitle tone="books" size="md" className="normal-case tracking-wide">
                    {t('books.actions.title', 'Actions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={handleExport}
                      className={`${booksBtnClass(false, 'md')} flex items-center justify-center gap-2`}
                    >
                      <Download className="w-4 h-4" />
                      {t('books.actions.export', 'Exporter JSON')}
                    </button>
                    <button
                      type="button"
                      onClick={handleImportClick}
                      disabled={isImporting}
                      className={`${booksBtnClass(false, 'md')} flex items-center justify-center gap-2`}
                    >
                      <Upload className="w-4 h-4" />
                      {isImporting ? t('common.loading', 'Chargement...') : t('books.actions.import', 'Importer JSON')}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={handleImportFileChange}
                    />
                  </div>
                  <p className="text-xs text-[#93c5fd]/75 mt-4 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    {t(
                      'books.hint.localStorage',
                      'Toutes les données sont stockées localement (IndexedDB). Tu peux les sauvegarder ou les restaurer via les boutons ci-dessus.'
                    )}
                  </p>
                </CardContent>
              </Card>


              {/* Vue 3D — ancre navigation sidebar (globe bibliothèque) */}
              {show3D && (
                <Suspense
                  fallback={
                    <Card variant="books">
                      <CardContent>
                        <p className="text-sm text-[#93c5fd]/90">
                          {t('books.dome.loading', 'Chargement de la vue 3D...')}
                        </p>
                      </CardContent>
                    </Card>
                  }
                >
                  <div id="books-library-globe-anchor" className="scroll-mt-4">
                  <BooksDomeGallery
                    books={domeBooks}
                    onBookOpen={handleBookClick}
                    onBookOpenDetail={handleBookOpenFromDome}
                    dragSensitivity={50}
                    dragDampening={0.3}
                    maxVerticalRotationDeg={8}
                    fit={1.0}
                    minRadius={700}
                    maxRadius={1600}
                    padFactor={0.02}
                  />
                  </div>
                </Suspense>
              )}

              {/* Carrousels */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card variant="books">
                  <CardHeader className="border-b border-[#3A86FF]/25">
                    <CardTitle tone="books" size="md" className="normal-case tracking-wide">
                      {t('books.sections.inProgress', 'Livres en cours')}
                      {filteredLibraryBooks.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          ({filteredLibraryBooks.length})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-[#93c5fd]/90">
                    {filteredLibraryBooks.length === 0 ? (
                      <p className="text-sm text-[#93c5fd]/70 text-center py-4 px-3 rounded-lg bg-black/40 border border-[#3A86FF]/25">
                        {t(
                          'books.empty.inProgress',
                          'Aucun livre en cours pour le moment. Ajoute un livre avec le formulaire ci-dessus.'
                        )}
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 books-carousel-container">
                          {paginatedInProgressBooks.map((book) => renderBookCard(book, false))}
                        </div>
                        {filteredLibraryBooks.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between text-xs text-slate-400/80 mt-2 pt-2 border-t border-white/5">
                            <span>
                              Page {pageInProgress + 1} /{' '}
                              {Math.max(1, Math.ceil(filteredLibraryBooks.length / PAGE_SIZE))}
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                className={booksBtnClass(false, 'sm')}
                                onClick={() =>
                                  setPageInProgress((p) => Math.max(0, p - 1))
                                }
                                disabled={pageInProgress === 0}
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className={booksBtnClass(false, 'sm')}
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

                <Card variant="books">
                  <CardHeader className="border-b border-[#3A86FF]/25">
                    <CardTitle tone="books" size="md" className="normal-case tracking-wide">
                      {t('books.sections.completed', 'Livres terminés')}
                      {filteredCompletedBooks.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          ({filteredCompletedBooks.length})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-[#93c5fd]/90">
                    {filteredCompletedBooks.length === 0 ? (
                      <p className="text-sm text-[#93c5fd]/70 text-center py-4 px-3 rounded-lg bg-black/40 border border-[#3A86FF]/25">
                        {t(
                          'books.empty.completed',
                          "Tu n'as pas encore marqué de livre comme terminé."
                        )}
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 books-carousel-container">
                          {paginatedCompletedBooks.map((book) => renderBookCard(book, true))}
                        </div>
                        {filteredCompletedBooks.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between text-xs text-slate-400/80 mt-2 pt-2 border-t border-white/5">
                            <span>
                              Page {pageCompleted + 1} /{' '}
                              {Math.max(1, Math.ceil(filteredCompletedBooks.length / PAGE_SIZE))}
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                className={booksBtnClass(false, 'sm')}
                                onClick={() =>
                                  setPageCompleted((p) => Math.max(0, p - 1))
                                }
                                disabled={pageCompleted === 0}
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className={booksBtnClass(false, 'sm')}
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

                <Card variant="books">
                  <CardHeader className="border-b border-[#3A86FF]/25">
                    <CardTitle tone="books" size="md" className="normal-case tracking-wide">
                      {t('books.sections.toRead', 'Livres à lire')}
                      {filteredToReadBooks.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          ({filteredToReadBooks.length})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-[#93c5fd]/90">
                    {filteredToReadBooks.length === 0 ? (
                      <p className="text-sm text-[#93c5fd]/70 text-center py-4 px-3 rounded-lg bg-black/40 border border-[#3A86FF]/25">
                        {t(
                          'books.empty.toRead',
                          "Tu n'as pas encore de livres marqués comme \"À lire\"."
                        )}
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 overflow-y-auto max-h-[600px] pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20 books-carousel-container">
                          {paginatedToReadBooks.map((book) => renderBookCard(book, false))}
                        </div>
                        {filteredToReadBooks.length > PAGE_SIZE && (
                          <div className="flex items-center justify-between text-xs text-slate-400/80 mt-2 pt-2 border-t border-white/5">
                            <span>
                              Page {pageToRead + 1} /{' '}
                              {Math.max(1, Math.ceil(filteredToReadBooks.length / PAGE_SIZE))}
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                className={booksBtnClass(false, 'sm')}
                                onClick={() =>
                                  setPageToRead((p) => Math.max(0, p - 1))
                                }
                                disabled={pageToRead === 0}
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className={booksBtnClass(false, 'sm')}
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

              {/* Détail du livre sélectionné + sessions (ancre pour scroll depuis la sidebar) */}
              <Card
                id="book-fiche"
                variant="books"
                className={!selectedBook ? 'books-detail-panel-empty' : ''}
              >
                <CardHeader className="flex flex-wrap items-start justify-between gap-4 border-b border-[#3A86FF]/25">
                  <div>
                    <CardTitle
                      tone="books"
                      size="md"
                      className={!selectedBook ? 'uppercase tracking-wide' : ''}
                    >
                      {selectedBook
                        ? selectedBook.title || t('books.detail.noTitle', 'Livre sans titre')
                        : t('books.detail.noSelection', 'Aucun livre sélectionné')}
                    </CardTitle>
                    <p
                      className={`text-sm mt-1 ${
                        !selectedBook ? 'text-[#93c5fd]/75' : 'text-[#93c5fd]/80'
                      }`}
                    >
                      {selectedBook
                        ? buildBookMetaLine(selectedBook) ||
                          t(
                            'books.detail.subtitle',
                            'Historique de lecture et statistiques pour ce livre.'
                          )
                        : t(
                            'books.detail.subtitleEmpty',
                            'Clique sur un livre dans les carrousels pour voir son détail et ajouter des sessions de lecture.'
                          )}
                    </p>
                  </div>
                  {selectedBook && (
                    <div className="flex flex-wrap gap-2 items-center">
                      <Button
                        type="button"
                        variant="books"
                        size="sm"
                        onClick={() => handleEdit(selectedBook)}
                        className="normal-case tracking-normal"
                      >
                        {t('books.actions.editBook', 'Éditer')}
                      </Button>
                      <Button
                        type="button"
                        variant="booksMuted"
                        size="sm"
                        onClick={() => handleDelete(selectedBook)}
                        className="normal-case tracking-normal"
                      >
                        {t('books.actions.deleteBook', 'Supprimer')}
                      </Button>
                      <span className="text-xs text-[#93c5fd]/70 ml-2">
                        {selectedBook.hasPdf
                          ? t('books.assets.pdfAttached', 'PDF associé')
                          : t('books.assets.noPdf', 'Aucun PDF associé')}
                      </span>
                      <Button
                        type="button"
                        variant="booksMuted"
                        size="sm"
                        onClick={handleAttachPdfClick}
                        className="normal-case tracking-normal"
                      >
                        {t('books.assets.attachPdf', 'Joindre un PDF')}
                      </Button>
                      {selectedBook.hasPdf && (
                        <Button
                          type="button"
                          variant="booksMuted"
                          size="sm"
                          onClick={handleRemovePdf}
                          className="normal-case tracking-normal"
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
                      <span className="text-xs text-[#93c5fd]/70 ml-4">
                        {selectedBook.hasCover
                          ? t('books.assets.coverAttached', 'Couverture associée')
                          : t('books.assets.noCover', 'Aucune couverture associée')}
                      </span>
                      <Button
                        type="button"
                        variant="booksMuted"
                        size="sm"
                        onClick={handleAttachCoverClick}
                        className="normal-case tracking-normal"
                      >
                        {selectedBook.hasCover
                          ? t('books.assets.changeCover', 'Changer la couverture')
                          : t('books.assets.attachCover', 'Ajouter une couverture')}
                      </Button>
                      {selectedBook.hasCover && (
                        <>
                          <Button
                            type="button"
                            variant="booksMuted"
                            size="sm"
                            onClick={handleViewCover}
                            className="normal-case tracking-normal"
                          >
                            {t('books.assets.viewCover', 'Voir la couverture')}
                          </Button>
                          <Button
                            type="button"
                            variant="booksMuted"
                            size="sm"
                            onClick={handleRemoveCover}
                            className="normal-case tracking-normal"
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
                      {/* Couverture à gauche, statistiques + sessions à droite */}
                      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] items-start">
                        {/* Colonne gauche : carte couverture + infos */}
                        <div className="rounded-2xl bg-black border-2 border-[#3A86FF] px-6 py-6 max-w-sm w-full shadow-lg shadow-black/30">
                          <p className="text-sm font-semibold text-[#93c5fd]/90 mb-3">
                            {t('books.detail.cover', 'Couverture')}
                          </p>
                          <div className="rounded-xl overflow-hidden w-full h-80 bg-black border border-[#3A86FF]/35 flex items-center justify-center">
                            {selectedBook.hasCover && coverUrls[selectedBook.id] ? (
                              <img
                                src={coverUrls[selectedBook.id]}
                                alt={
                                  selectedBook.title ||
                                  t('books.detail.noTitle', 'Livre sans titre')
                                }
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <span className="text-xs text-[#93c5fd]/55">
                                {t('books.detail.noCoverPlaceholder', 'Pas de couverture')}
                              </span>
                            )}
                          </div>

                          <div className="mt-6 space-y-1 text-sm text-[#93c5fd]/88">
                            <p>
                              <span className="font-semibold text-[#bfdbfe]">
                                {t('books.detail.genre', 'Genre')} :
                              </span>{' '}
                              {selectedBook.genre || '—'}
                            </p>
                            <p>
                              <span className="font-semibold text-[#bfdbfe]">
                                {t('books.detail.year', 'Année')} :
                              </span>{' '}
                              {selectedBook.year || '—'}
                            </p>
                            <p>
                              <span className="font-semibold text-[#bfdbfe]">
                                {t('books.detail.pages', 'Pages')} :
                              </span>{' '}
                              {selectedBook.pages || '—'}
                            </p>
                            <p>
                              <span className="font-semibold text-[#bfdbfe]">
                                {t('books.stats.sessionsCount', 'Nombre de sessions')} :
                              </span>{' '}
                              {(selectedBook.readingSessions || []).length}
                            </p>
                            {(() => {
                              const disp = getBookDisplayRating(selectedBook);
                              const fin = selectedBook.finishedAt
                                ? new Date(`${selectedBook.finishedAt}T12:00:00`).toLocaleDateString('fr-FR')
                                : null;
                              return (
                                <div className="mt-4 pt-3 border-t border-[#3A86FF]/25 space-y-1 text-xs text-[#93c5fd]/85">
                                  <p>
                                    <span className="font-semibold text-[#bfdbfe]">Note affichée :</span>{' '}
                                    {disp.value > 0 ? (
                                      <>
                                        <span className="text-[#93c5fd] font-mono">{disp.value.toFixed(1)}</span>
                                        /10
                                        <span className="text-[#93c5fd]/55">
                                          {' '}
                                          (
                                          {disp.source === 'personal'
                                            ? 'note personnelle'
                                            : 'moyenne des sessions'}
                                          )
                                        </span>
                                      </>
                                    ) : (
                                      <span className="text-[#93c5fd]/50">pas encore noté</span>
                                    )}
                                  </p>
                                  {selectedBookRatingAgg && (
                                    <p className="text-[#93c5fd]/65">
                                      Synthèse critères (moy. {selectedBookRatingAgg.sessionCount} session
                                      {selectedBookRatingAgg.sessionCount > 1 ? 's' : ''}) :{' '}
                                      <span className="text-[#bfdbfe] font-mono">
                                        {selectedBookRatingAgg.overall.toFixed(1)}
                                      </span>
                                      /10
                                    </p>
                                  )}
                                  {selectedBook.status === 'completed' && fin && (
                                    <p>
                                      <span className="font-semibold text-[#bfdbfe]">Terminé le</span> {fin}
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {/* Colonne droite : stats + progression + sessions */}
                        <div className="space-y-4">
                          {/* Grille de stats 3 x 2 comme dans l'exemple HTML */}
                          <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl bg-black border-2 border-[#3A86FF]/40 px-4 py-3">
                              <p className="text-xs text-[#93c5fd]/75">
                                {t('books.stats.totalTime', 'Temps de lecture')}
                              </p>
                              <p className="text-lg font-semibold text-[#bfdbfe]">
                                {getTotalReadingTime(selectedBook)}{' '}
                                {t('books.stats.minutes', 'minutes')}
                              </p>
                              <p className="text-xs text-[#93c5fd]/60">
                                {t(
                                  'books.stats.totalTimeSubtitle',
                                  'minutes au total'
                                )}
                              </p>
                            </div>
                            <div className="rounded-xl bg-black border-2 border-[#3A86FF]/40 px-4 py-3">
                              <p className="text-xs text-[#93c5fd]/75">
                                {t('books.stats.totalPages', 'Pages lues')}
                              </p>
                              <p className="text-lg font-semibold text-[#bfdbfe]">
                                {getTotalPagesRead(selectedBook)}{' '}
                                {selectedBook.pages
                                  ? t(
                                      'books.stats.onTotalPages',
                                      'sur {{pages}}',
                                      { pages: selectedBook.pages }
                                    )
                                  : ''}
                              </p>
                            </div>
                            <div className="rounded-xl bg-black border-2 border-[#3A86FF]/40 px-4 py-3">
                              <p className="text-xs text-[#93c5fd]/75">
                                {t('books.stats.progress', 'Progression')}
                              </p>
                              <p className="text-lg font-semibold text-[#bfdbfe]">
                                {(() => {
                                  const value = getReadingProgressPercent(selectedBook);
                                  if (value == null) return '—';
                                  return `${value}${t('books.stats.percent', '%')}`;
                                })()}
                              </p>
                              <p className="text-xs text-[#93c5fd]/60">
                                {t('books.stats.ofBook', 'du livre')}
                              </p>
                            </div>
                            <div className="rounded-xl bg-black border-2 border-[#3A86FF]/40 px-4 py-3">
                              <p className="text-xs text-[#93c5fd]/75">
                                {t(
                                  'books.stats.estimatedRemaining',
                                  'Temps restant'
                                )}
                              </p>
                              <p className="text-lg font-semibold text-[#bfdbfe]">
                                {(() => {
                                  const value = getEstimatedRemainingTimeMinutes(
                                    selectedBook
                                  );
                                  if (value == null) return '—';
                                  return value;
                                })()}
                              </p>
                              <p className="text-xs text-[#93c5fd]/60">
                                {t('books.stats.minutesEstimated', 'min estimées')}
                              </p>
                            </div>
                            <div className="rounded-xl bg-black border-2 border-[#3A86FF]/40 px-4 py-3">
                              <p className="text-xs text-[#93c5fd]/75">
                                {t(
                                  'books.stats.avgPagesPerSession',
                                  'Moy. par session'
                                )}
                              </p>
                              <p className="text-lg font-semibold text-[#bfdbfe]">
                                {getAveragePagesPerSession(selectedBook)}
                              </p>
                              <p className="text-xs text-[#93c5fd]/60">
                                {t('books.pages', 'pages')}
                              </p>
                            </div>
                            <div className="rounded-xl bg-black border-2 border-[#3A86FF]/40 px-4 py-3">
                              <p className="text-xs text-[#93c5fd]/75">
                                {t(
                                  'books.stats.avgDurationPerSession',
                                  'Durée moy.'
                                )}
                              </p>
                              <p className="text-lg font-semibold text-[#bfdbfe]">
                                {getAverageDurationPerSession(selectedBook)}
                              </p>
                              <p className="text-xs text-[#93c5fd]/60">
                                {t('books.stats.minutesPerSession', 'min / session')}
                              </p>
                            </div>
                          </div>

                          {/* Barre de progression comme sur le mockup */}
                          <div className="mt-2 rounded-xl bg-black border-2 border-[#3A86FF]/40 px-4 py-3">
                            <p className="text-xs font-semibold text-[#93c5fd]/90 mb-1 tracking-wide">
                              {t('books.detail.progressTitle', 'PROGRESSION')}
                            </p>
                            <div className="h-1.5 rounded-full bg-[#3A86FF]/15 overflow-hidden border border-[#3A86FF]/25">
                              <div
                                className="h-full bg-gradient-to-r from-[#3A86FF] to-[#93c5fd]"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      getReadingProgressPercent(selectedBook) || 0
                                    )
                                  )}%`,
                                }}
                              />
                            </div>
                            <p className="mt-1 text-xs text-[#93c5fd]/75">
                              {(() => {
                                const pagesRead = getTotalPagesRead(selectedBook);
                                const totalPages = selectedBook.pages || 0;
                                return `${pagesRead} / ${
                                  totalPages || '—'
                                } ${t('books.pages', 'pages')}`;
                              })()}
                            </p>
                          </div>

                          {(selectedBook.readingSessions || []).length > 0 && (
                            <div className="mt-4 rounded-xl border-2 border-[#3A86FF]/40 bg-black px-4 py-3 space-y-3">
                              <p className="font-semibold text-sm text-[#bfdbfe]">
                                Feedback des sessions
                              </p>
                              <p className="text-[11px] text-[#93c5fd]/65">
                                Retours enregistrés pour chaque session (mêmes données qu’au calendrier et dans la
                                bibliothèque). Modifiable via « Modifier » dans la liste ci-dessous ou depuis le
                                calendrier lecture.
                              </p>
                              <ul className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                {[...(selectedBook.readingSessions || [])]
                                  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
                                  .map((session) => (
                                    <li key={session.id || `${session.date}-${session.pagesRead}`}>
                                      <p className="text-[10px] text-[#93c5fd]/55 mb-0.5">
                                        {session.date || '—'}
                                      </p>
                                      <BookSessionFeedbackReadonly session={session} title="Détail" />
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          )}

                          {/* Liste des sessions */}
                          <div className="mt-4 space-y-2 rounded-xl border-2 border-[#3A86FF]/40 bg-black px-4 py-3">
                            <p className="font-semibold text-sm text-[#bfdbfe]">
                              {t('books.sessions.listTitle', 'Sessions de lecture')}
                            </p>
                            {(selectedBook.readingSessions || []).length === 0 ? (
                              <p className="text-sm text-[#93c5fd]/75">
                                {t(
                                  'books.sessions.empty',
                                  'Aucune session enregistrée pour le moment.'
                                )}
                              </p>
                            ) : (
                              <ul className="space-y-2 text-sm text-[#93c5fd]/90 max-h-56 overflow-y-auto pr-1">
                                {selectedBook.readingSessions.map((session) => (
                                  <li
                                    key={session.id}
                                    className="flex items-start justify-between gap-3 border border-[#3A86FF]/30 rounded-lg px-3 py-2 bg-black/40"
                                  >
                                    <div>
                                      <p className="font-semibold text-xs text-[#bfdbfe]">
                                        {session.date || '—'}
                                      </p>
                                      <p className="text-xs text-[#93c5fd]/85 mt-0.5">
                                        {session.startTime && (
                                          <span className="mr-2">
                                            {session.startTime}
                                          </span>
                                        )}
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
                                        {(session.sessionScore != null ||
                                          (session.criteriaRatings &&
                                            typeof session.criteriaRatings === 'object')) && (
                                          <span className="text-[#93c5fd]">
                                            {' '}
                                            · note session{' '}
                                            {Number(
                                              session.sessionScore != null
                                                ? session.sessionScore
                                                : averageCriteriaScore(session.criteriaRatings)
                                            ).toFixed(1)}
                                            /10
                                          </span>
                                        )}
                                      </p>
                                      {session.note && (
                                        <p className="text-[11px] text-[#93c5fd]/70 mt-1">
                                          {session.note}
                                        </p>
                                      )}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => startEditSession(session)}
                                        className="text-xs text-[#93c5fd] hover:text-[#bfdbfe] underline"
                                      >
                                        {t('books.sessions.edit', 'Modifier')}
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          {/* Formulaire d'ajout / modification de session (ancre scroll depuis la vue 3D) */}
                          <div
                            id="book-session-form-section"
                            className="mt-4 space-y-3 rounded-xl bg-black border-2 border-[#3A86FF]/40 px-4 py-4"
                          >
                            <p className="font-semibold text-sm text-[#bfdbfe]">
                              {editingSessionId
                                ? t(
                                    'books.sessions.editTitle',
                                    'Modifier une session de lecture'
                                  )
                                : t(
                                    'books.sessions.addTitle',
                                    'Ajouter une session de lecture'
                                  )}
                            </p>
                            <form
                              data-session-form
                              onSubmit={handleAddSession}
                              className="space-y-3"
                            >
                              {sessionFormDirty && (
                                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#3A86FF]/40 bg-[#0b1220] px-3 py-2">
                                  <p className="text-xs text-[#93c5fd]/90">
                                    {t(
                                      'books.sessions.unsavedHint',
                                      'Modifications non enregistrées — enregistre la session pour les garder.'
                                    )}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="books"
                                      size="sm"
                                      className="normal-case tracking-normal"
                                      onClick={(e) => handleAddSession(e)}
                                    >
                                      {t('common.save', 'Enregistrer')}
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="booksMuted"
                                      size="sm"
                                      className="normal-case tracking-normal"
                                      onClick={() => (editingSessionId ? cancelEditSession() : resetSessionForm())}
                                    >
                                      {t('common.cancel', 'Annuler')}
                                    </Button>
                                  </div>
                                </div>
                              )}
                              <div className="grid gap-3 md:grid-cols-2">
                                <Input
                                  id="session-date"
                                  type="date"
                                  max={new Date().toISOString().slice(0, 10)}
                                  fieldTone="books"
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
                                  fieldTone="books"
                                  label={t(
                                    'books.sessions.duration',
                                    'Durée (minutes)'
                                  )}
                                  value={sessionForm.durationMinutes}
                                  onChange={(e) =>
                                    handleSessionChange(
                                      'durationMinutes',
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="grid gap-3 md:grid-cols-2">
                                <Input
                                  id="session-time"
                                  type="time"
                                  fieldTone="books"
                                  label={t(
                                    'books.sessions.time',
                                    'Heure (optionnel)'
                                  )}
                                  value={sessionForm.startTime}
                                  onChange={(e) =>
                                    handleSessionChange('startTime', e.target.value)
                                  }
                                />
                                <Input
                                  id="session-pages"
                                  type="number"
                                  min={0}
                                  fieldTone="books"
                                  label={t(
                                    'books.sessions.pages',
                                    'Pages lues pendant la session'
                                  )}
                                  value={sessionForm.pagesRead}
                                  onChange={(e) =>
                                    handleSessionChange('pagesRead', e.target.value)
                                  }
                                />
                              </div>
                              {suggestedPagesHint != null && (
                                <p className="text-[11px] text-[#93c5fd]/85">
                                  Suggestion d’après ton rythme habituel sur ce livre : environ{' '}
                                  <button
                                    type="button"
                                    className="underline font-semibold text-[#bfdbfe]"
                                    onClick={() =>
                                      handleSessionChange('pagesRead', String(suggestedPagesHint))
                                    }
                                  >
                                    {suggestedPagesHint} pages
                                  </button>{' '}
                                  pour la durée indiquée (clic pour remplir).
                                </p>
                              )}
                              <ReadingSessionCriteriaSliders
                                criteriaRatings={sessionForm.criteriaRatings}
                                onChange={handleCriteriaRatingChange}
                              />
                              <p className="text-xs text-[#93c5fd]/75">
                                Note de session (moyenne des 5 critères) :{' '}
                                <span className="font-mono text-[#bfdbfe]">
                                  {sessionCriteriaPreview.toFixed(1)}
                                </span>
                                /10
                              </p>
                              <TextArea
                                id="session-note"
                                rows={3}
                                fieldTone="books"
                                label={t(
                                  'books.sessions.note',
                                  'Note (optionnel)'
                                )}
                                value={sessionForm.note}
                                onChange={(e) =>
                                  handleSessionChange('note', e.target.value)
                                }
                              />
                              <div className="flex items-center gap-3">
                                <Button
                                  type="submit"
                                  variant="books"
                                  className="normal-case tracking-normal"
                                >
                                  {editingSessionId
                                    ? t(
                                        'books.sessions.updateButton',
                                        'Enregistrer la session'
                                      )
                                    : t(
                                        'books.sessions.addButton',
                                        'Ajouter la session de lecture'
                                      )}
                                </Button>
                                {editingSessionId && (
                                  <button
                                    type="button"
                                    onClick={cancelEditSession}
                                    className="text-sm text-[#93c5fd] hover:text-[#bfdbfe] underline"
                                  >
                                    {t(
                                      'books.sessions.cancelEdit',
                                      'Annuler la modification'
                                    )}
                                  </button>
                                )}
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>

                      {/* Résumés et notes en dessous */}
                      {(() => {
                        const sessionNotes =
                          (selectedBook.readingSessions || []).filter(
                            (s) => s.note && s.note.trim().length > 0
                          );
                        return (
                          selectedBook.shortSummary ||
                          selectedBook.longSummary ||
                          sessionNotes.length > 0
                        );
                      })() && (
                        <div className="mt-10 space-y-3 rounded-xl border-2 border-[#3A86FF]/40 bg-black px-4 py-4">
                          <div className="flex items-center justify-between gap-4">
                            <p className="text-sm font-semibold text-[#bfdbfe]">
                              Résumés
                            </p>
                            <div className="flex items-center gap-2">
                              {!isEditingSummaries && (
                                <Button
                                  type="button"
                                  variant="booksMuted"
                                  size="sm"
                                  onClick={() => setIsEditingSummaries(true)}
                                  className="normal-case tracking-normal text-xs px-3 py-1 rounded-full"
                                >
                                  {t(
                                    'books.detail.editSummaries',
                                    'Modifier les résumés'
                                  )}
                                </Button>
                              )}
                              {isEditingSummaries && (
                                <>
                                  <Button
                                    type="button"
                                    variant="books"
                                    size="sm"
                                    onClick={handleSaveSummariesInline}
                                    className="normal-case tracking-normal text-xs px-3 py-1 rounded-full"
                                  >
                                    {t('common.save', 'Enregistrer')}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="booksMuted"
                                    size="sm"
                                    onClick={() => {
                                      if (!selectedBook) return;
                                      setSummaryDraft({
                                        short: selectedBook.shortSummary || '',
                                        long: selectedBook.longSummary || '',
                                      });
                                      setIsEditingSummaries(false);
                                    }}
                                    className="normal-case tracking-normal text-xs px-3 py-1 rounded-full"
                                  >
                                    {t('common.cancel', 'Annuler')}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => setSummaryTab('short')}
                              className={`rounded-full border-2 px-3 py-1 ${
                                summaryTab === 'short'
                                  ? 'border-sky-400 bg-black text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                                  : 'border-blue-600/65 bg-black text-blue-200 hover:border-sky-400/80 hover:text-sky-100'
                              }`}
                            >
                              Court
                            </button>
                            <button
                              type="button"
                              onClick={() => setSummaryTab('long')}
                              className={`rounded-full border-2 px-3 py-1 ${
                                summaryTab === 'long'
                                  ? 'border-sky-400 bg-black text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                                  : 'border-blue-600/65 bg-black text-blue-200 hover:border-sky-400/80 hover:text-sky-100'
                              }`}
                            >
                              Détaillé
                            </button>
                            <button
                              type="button"
                              onClick={() => setSummaryTab('notes')}
                              className={`rounded-full border-2 px-3 py-1 ${
                                summaryTab === 'notes'
                                  ? 'border-sky-400 bg-black text-sky-100 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                                  : 'border-blue-600/65 bg-black text-blue-200 hover:border-sky-400/80 hover:text-sky-100'
                              }`}
                            >
                              Notes
                            </button>
                          </div>

                          <div className="text-sm text-[#93c5fd]/90 bg-black/40 border border-[#3A86FF]/30 rounded-xl p-4 whitespace-pre-line">
                            {summaryTab === 'short' &&
                              (isEditingSummaries ? (
                                <textarea
                                  rows={4}
                                  className="w-full bg-transparent outline-none resize-none text-sm text-[#e0f2fe] placeholder:text-[#93c5fd]/45"
                                  value={summaryDraft.short}
                                  onChange={(e) =>
                                    setSummaryDraft((prev) => ({
                                      ...prev,
                                      short: e.target.value,
                                    }))
                                  }
                                />
                              ) : (
                                selectedBook.shortSummary ||
                                t(
                                  'books.detail.shortSummary',
                                  'Aucun résumé court renseigné.'
                                )
                              ))}
                            {summaryTab === 'long' &&
                              (isEditingSummaries ? (
                                <textarea
                                  rows={6}
                                  className="w-full bg-transparent outline-none resize-none text-sm text-[#e0f2fe] placeholder:text-[#93c5fd]/45"
                                  value={summaryDraft.long}
                                  onChange={(e) =>
                                    setSummaryDraft((prev) => ({
                                      ...prev,
                                      long: e.target.value,
                                    }))
                                  }
                                />
                              ) : (
                                selectedBook.longSummary ||
                                t(
                                  'books.detail.longSummary',
                                  'Aucun résumé détaillé renseigné.'
                                )
                              ))}
                            {summaryTab === 'notes' &&
                              (() => {
                                const notes =
                                  (selectedBook.readingSessions || []).filter(
                                    (s) => s.note && s.note.trim().length > 0
                                  );
                                if (notes.length === 0) {
                                  return t(
                                    'books.detail.notes',
                                    'Aucune note de session pour ce livre.'
                                  );
                                }
                                return notes
                                  .map(
                                    (s) =>
                                      `${s.date || ''}${
                                        s.date ? ' — ' : ''
                                      }${s.note?.trim() || ''}`
                                  )
                                  .join('\n\n');
                              })()}
                          </div>
                        </div>
                      )}

                      {/* Sélecteur de statut en bas de la page */}
                      <div className="mt-6 pt-6 border-t border-[#3A86FF]/25">
                        <div className="flex items-center gap-4">
                          <label
                            htmlFor="book-status-detail"
                            className="text-sm font-semibold text-[#93c5fd]/90 whitespace-nowrap"
                          >
                            {t('books.detail.status', 'Statut du livre')}:
                          </label>
                          <Select
                            id="book-status-detail"
                            fieldTone="books"
                            value={selectedBook.status || 'in-progress'}
                            onChange={(e) => handleStatusChange(selectedBook.id, e.target.value)}
                            className="flex-1 max-w-xs"
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
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-[#93c5fd]/80 leading-relaxed">
                      {t(
                        'books.detail.noSelectionLong',
                        'Sélectionne un livre dans les listes ci-dessus pour voir ses détails, son historique de lecture et ajouter des sessions.'
                      )}
                    </p>
                  )}
                </CardContent>
                <CardFooter className={!selectedBook ? 'border-t border-[#3A86FF]/20' : 'border-t border-[#3A86FF]/20'}>
                  <p className="text-[11px] text-[#93c5fd]/55">
                    {t(
                      'books.footer.info',
                      "Cette première version de l'onglet Livres implémente la gestion locale des livres et des sessions de lecture. Les fonctionnalités avancées décrites dans la documentation (sphère 3D, PDFs en IndexedDB, sauvegardes multi‑formats) pourront être ajoutées progressivement sans impacter le reste du site."
                    )}
                  </p>
                </CardFooter>
              </Card>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
    </>
  );
};

export default BooksTab;
