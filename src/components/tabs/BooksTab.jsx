/**
 * BooksTab - Composant principal refactorisé
 * 
 * ✅ PHASE 4 : Refactoring complet avec hooks et composants extraits
 * 
 * @module components/tabs/BooksTab/BooksTab.refactored
 */

import React, { Suspense, useEffect, useMemo, useState, useCallback } from 'react';
import { BookOpen, Download, Search, Upload, BarChart3, Library } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Input, TextArea, Select } from '../ui/Input';
import ErrorBoundary from '../ui/ErrorBoundary';
import './booksLiquidGlass.css';
import { useTranslation } from '../../utils/translations';
import { useBooksStorage } from '../../hooks/useBooksStorage';
import BookCard from '../books/BookCard';
import StatisticsSubTab from './books/StatisticsSubTab';

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
  
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [show3D, setShow3D] = useState(true);
  const [isFormExpanded, setIsFormExpanded] = useState(false);

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

  const {
    sessionForm,
    setSessionForm,
    handleSessionChange,
    handleAddSession,
    resetSessionForm,
  } = useBooksSessions(books, setBooks, selectedBook);

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

  // Initialiser la date par défaut de la session
  useEffect(() => {
    resetSessionForm();
  }, [resetSessionForm]);

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
          personalScore: typeof b.personalScore === 'number' ? b.personalScore : 0,
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

  return (
    <div className="relative min-h-screen">
      <div className="relative z-10 space-y-8 p-8">
        <BooksXPBar />
        {isLoading && (
          <Card variant="glass">
            <CardContent>
              <p className="text-sm text-slate-300">
                {t('common.loading', 'Chargement de la bibliothèque de livres...')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Header avec navigation par sous-onglets */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <BookOpen className="w-8 h-8 text-purple-300" />
              <div>
                <h1 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                  {t('nav.books', 'Livres')}
                </h1>
                <p className="text-sm text-slate-400">
                  {t(
                    'books.subtitle',
                    'Gère ta bibliothèque personnelle, tes sessions de lecture et tes sauvegardes — tout est stocké localement dans ton navigateur.'
                  )}
                </p>
              </div>
            </div>
            {activeSubTab === 'library' && (
              <button
                type="button"
                onClick={() => setShow3D(!show3D)}
                className="gradient-button-premium gradient-button-premium-md rounded-lg"
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
              className={`gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2 ${
                activeSubTab === 'library' ? 'gradient-button-premium-variant' : ''
              }`}
            >
              <Library className="w-4 h-4" />
              {t('books.subtabs.library', 'Bibliothèque')}
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('statistics')}
              className={`gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2 ${
                activeSubTab === 'statistics' ? 'gradient-button-premium-variant' : ''
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              {t('books.subtabs.statistics', 'Statistiques')}
            </button>
          </div>
        </div>

        {/* Contenu conditionnel selon le sous-onglet actif */}
        <ErrorBoundary
          context={{ activeSubTab, tab: 'books', booksCount: books.length }}
          title={`Erreur dans ${activeSubTab === 'statistics' ? 'Statistiques' : 'Bibliothèque'}`}
          message="Une erreur s'est produite dans ce sous-onglet. Vous pouvez réessayer ou changer de sous-onglet."
        >
          {activeSubTab === 'statistics' ? (
            <StatisticsSubTab books={books} />
          ) : (
            // Contenu de la bibliothèque - Le reste du code reste identique pour préserver la fonctionnalité
            // Cette partie sera remplacée progressivement par des composants extraits
            <div className="space-y-6">
              {/* Formulaire et Recherche/Filtres en grille */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Formulaire collapsible */}
                <Card variant="glass" padding="lg">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle size="md" className="books-glass-card-title">
                        {t('books.form.title', 'Ajouter/Modifier un livre')}
                      </CardTitle>
                      <button
                        type="button"
                        onClick={() => setIsFormExpanded(!isFormExpanded)}
                        className="gradient-button-premium gradient-button-premium-sm rounded-lg"
                      >
                        {isFormExpanded ? t('common.hide', 'Masquer') : t('common.show', 'Afficher')}
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent className="books-glass-card-content">
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
                      
                      {/* Bouton toujours visible */}
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          className="gradient-button-premium gradient-button-premium-md rounded-lg"
                        >
                          {form.id
                            ? t('books.actions.updateBook', 'Mettre à jour le livre')
                            : t('books.actions.addBook', 'Ajouter le livre')}
                        </button>
                        {form.id && (
                          <button
                            type="button"
                            onClick={resetForm}
                            className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
                          >
                            {t('books.actions.cancelEdit', 'Annuler la modification')}
                          </button>
                        )}
                      </div>
                      
                      {/* Champs supplémentaires (affichés seulement si expanded) */}
                      {isFormExpanded && (
                        <>
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
                        </>
                      )}
                    </form>
                  </CardContent>
                </Card>

                {/* Recherche & Filtres */}
                <Card variant="glass" padding="lg" className="books-glass-card">
                  <CardHeader className="books-glass-card-header">
                    <CardTitle size="md" className="books-glass-card-title">
                      {t('books.filters.title', 'Recherche & Filtres')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="books-glass-card-content">
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
              <Card variant="glass" padding="lg" className="mb-6">
                <CardHeader>
                  <CardTitle size="md">
                    {t('books.actions.title', 'Actions')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <button
                      type="button"
                      onClick={handleExport}
                      className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {t('books.actions.export', 'Exporter JSON')}
                    </button>
                    <button
                      type="button"
                      onClick={handleImportClick}
                      disabled={isImporting}
                      className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center justify-center gap-2"
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
                  <p className="text-xs text-slate-400 mt-4 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    {t(
                      'books.hint.localStorage',
                      'Toutes les données sont stockées localement (IndexedDB). Tu peux les sauvegarder ou les restaurer via les boutons ci-dessus.'
                    )}
                  </p>
                </CardContent>
              </Card>

              {/* Vue 3D */}
              {show3D && (
                <Suspense
                  fallback={
                    <Card variant="glass">
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
                    fit={1.0}
                    minRadius={700}
                    maxRadius={1600}
                    padFactor={0.02}
                  />
                </Suspense>
              )}

              {/* Carrousels */}
              <div className="grid gap-6 lg:grid-cols-3">
                <Card variant="glass" className="books-glass-card">
                  <CardHeader className="books-glass-card-header">
                    <CardTitle size="md" className="books-glass-card-title">
                      {t('books.sections.inProgress', 'Livres en cours')}
                      {filteredLibraryBooks.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          ({filteredLibraryBooks.length})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 books-glass-card-content">
                    {filteredLibraryBooks.length === 0 ? (
                      <p className="text-sm text-slate-400/70 text-center py-4 px-3 rounded-lg bg-white/2 border border-white/5">
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
                                className="gradient-button-premium gradient-button-premium-sm rounded-lg"
                                onClick={() =>
                                  setPageInProgress((p) => Math.max(0, p - 1))
                                }
                                disabled={pageInProgress === 0}
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className="gradient-button-premium gradient-button-premium-sm rounded-lg"
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

                <Card variant="glass" className="books-glass-card">
                  <CardHeader className="books-glass-card-header">
                    <CardTitle size="md" className="books-glass-card-title">
                      {t('books.sections.completed', 'Livres terminés')}
                      {filteredCompletedBooks.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          ({filteredCompletedBooks.length})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 books-glass-card-content">
                    {filteredCompletedBooks.length === 0 ? (
                      <p className="text-sm text-slate-400/70 text-center py-4 px-3 rounded-lg bg-white/2 border border-white/5">
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
                                className="gradient-button-premium gradient-button-premium-sm rounded-lg"
                                onClick={() =>
                                  setPageCompleted((p) => Math.max(0, p - 1))
                                }
                                disabled={pageCompleted === 0}
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className="gradient-button-premium gradient-button-premium-sm rounded-lg"
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

                <Card variant="glass" className="books-glass-card">
                  <CardHeader className="books-glass-card-header">
                    <CardTitle size="md" className="books-glass-card-title">
                      {t('books.sections.toRead', 'Livres à lire')}
                      {filteredToReadBooks.length > 0 && (
                        <span className="ml-2 text-sm font-normal text-slate-400">
                          ({filteredToReadBooks.length})
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 books-glass-card-content">
                    {filteredToReadBooks.length === 0 ? (
                      <p className="text-sm text-slate-400/70 text-center py-4 px-3 rounded-lg bg-white/2 border border-white/5">
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
                                className="gradient-button-premium gradient-button-premium-sm rounded-lg"
                                onClick={() =>
                                  setPageToRead((p) => Math.max(0, p - 1))
                                }
                                disabled={pageToRead === 0}
                              >
                                ‹
                              </button>
                              <button
                                type="button"
                                className="gradient-button-premium gradient-button-premium-sm rounded-lg"
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
                      <button
                        type="button"
                        onClick={() => handleEdit(selectedBook)}
                        className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
                      >
                        {t('books.actions.editBook', 'Éditer')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selectedBook)}
                        className="gradient-button-premium gradient-button-premium-sm rounded-lg"
                      >
                        {t('books.actions.deleteBook', 'Supprimer')}
                      </button>
                      <span className="text-xs text-slate-400 ml-2">
                        {selectedBook.hasPdf
                          ? t('books.assets.pdfAttached', 'PDF associé')
                          : t('books.assets.noPdf', 'Aucun PDF associé')}
                      </span>
                      <button
                        type="button"
                        onClick={handleAttachPdfClick}
                        className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
                      >
                        {t('books.assets.attachPdf', 'Joindre un PDF')}
                      </button>
                      {selectedBook.hasPdf && (
                        <button
                          type="button"
                          onClick={handleRemovePdf}
                          className="gradient-button-premium gradient-button-premium-sm rounded-lg"
                        >
                          {t('books.assets.removePdf', 'Supprimer le PDF')}
                        </button>
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
                      <button
                        type="button"
                        onClick={handleAttachCoverClick}
                        className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
                      >
                        {selectedBook.hasCover
                          ? t('books.assets.changeCover', 'Changer la couverture')
                          : t('books.assets.attachCover', 'Ajouter une couverture')}
                      </button>
                      {selectedBook.hasCover && (
                        <>
                          <button
                            type="button"
                            onClick={handleViewCover}
                            className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
                          >
                            {t('books.assets.viewCover', 'Voir la couverture')}
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveCover}
                            className="gradient-button-premium gradient-button-premium-sm rounded-lg"
                          >
                            {t('books.assets.removeCover', 'Supprimer la couverture')}
                          </button>
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

                      {selectedBook.shortSummary && (
                        <div className="text-sm text-slate-300">
                          <p className="font-semibold mb-1">
                            {t('books.detail.shortSummary', 'Résumé court')}
                          </p>
                          <p className="whitespace-pre-line">{selectedBook.shortSummary}</p>
                        </div>
                      )}

                      {selectedBook.longSummary && (
                        <div className="text-sm text-slate-300">
                          <p className="font-semibold mb-1">
                            {t('books.detail.longSummary', 'Résumé détaillé')}
                          </p>
                          <p className="whitespace-pre-line">{selectedBook.longSummary}</p>
                        </div>
                      )}

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
                          data-session-form
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
                          <button
                            type="submit"
                            className="gradient-button-premium gradient-button-premium-md rounded-lg"
                          >
                            {t(
                              'books.sessions.addButton',
                              'Ajouter la session de lecture'
                            )}
                          </button>
                        </form>
                      </div>

                      {/* Sélecteur de statut en bas de la page */}
                      <div className="mt-6 pt-6 border-t border-slate-700">
                        <div className="flex items-center gap-4">
                          <label
                            htmlFor="book-status-detail"
                            className="text-sm font-semibold text-slate-300 whitespace-nowrap"
                          >
                            {t('books.detail.status', 'Statut du livre')}:
                          </label>
                          <Select
                            id="book-status-detail"
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
  );
};

export default BooksTab;
