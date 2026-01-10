/**
 * Hook pour les actions CRUD sur les livres
 * 
 * ✅ PHASE 4 : Extraction de la logique métier
 * 
 * @module components/tabs/BooksTab/hooks/useBooksActions
 */

import { useState, useCallback, useRef } from 'react';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../../utils/sidebarEvents';
import { bookSchema, validateWithSchema } from '../../../../utils/validation/schemas';
import { saveBookCover } from '../../../../utils/booksAssetsStorage';
import { emptyBookForm } from '../constants';
import { readFileAsDataUrl } from '../utils';

/**
 * Hook pour gérer les actions CRUD sur les livres
 * 
 * @param {Array} books - Liste de tous les livres
 * @param {Function} setBooks - Fonction pour mettre à jour les livres
 * @param {Object} coverUrls - Objet des URLs de couvertures
 * @param {Function} setCoverUrls - Fonction pour mettre à jour les URLs de couvertures
 * @param {Object} coverUrlsRef - Ref pour les URLs de couvertures
 * @returns {Object} { form, setForm, formCoverFile, setFormCoverFile, coverFormInputRef, ...actions }
 */
export const useBooksActions = (books = [], setBooks, coverUrls, setCoverUrls, coverUrlsRef) => {
  const [form, setForm] = useState(emptyBookForm);
  const [formCoverFile, setFormCoverFile] = useState(null);
  const coverFormInputRef = useRef(null);

  const resetForm = useCallback(() => {
    setForm(emptyBookForm);
    setFormCoverFile(null);
    if (coverFormInputRef.current) {
      coverFormInputRef.current.value = '';
    }
  }, []);

  const handleChange = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // ✅ PHASE 1 : Validation avec Zod
    const validation = validateWithSchema(bookSchema, form);
    
    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      alert(firstError || 'Erreur de validation');
      return;
    }
    
    const isEditing = !!form.id;
    const id = isEditing ? form.id : `book_${Date.now()}`;
    const nowIso = new Date().toISOString();
    const validatedBook = validation.data;

    const baseBook = {
      id,
      title: validatedBook.title,
      author: validatedBook.author,
      year: validatedBook.year || '',
      genre: validatedBook.genre || '',
      pages: validatedBook.pages || '',
      status: validatedBook.status,
      shortSummary: validatedBook.shortSummary || '',
      longSummary: validatedBook.longSummary || '',
      notes: validatedBook.shortSummary || '',
      personalScore: validatedBook.personalScore || 0,
    };

    let coverInlineDataUrl = null;
    if (formCoverFile) {
      coverInlineDataUrl = await readFileAsDataUrl(formCoverFile);
    }

    setBooks((prev) => {
      if (isEditing) {
        return prev.map((book) =>
          book.id === id
            ? {
                ...book,
                ...baseBook,
                hasCover: book.hasCover || !!formCoverFile,
                coverInline: coverInlineDataUrl || book.coverInline || null,
                createdAt: book.createdAt || nowIso,
              }
            : book
        );
      }

      return [
        {
          ...baseBook,
          hasCover: !!formCoverFile,
          coverInline: coverInlineDataUrl || null,
          readingSessions: [],
          createdAt: nowIso,
        },
        ...prev,
      ];
    });

    if (formCoverFile) {
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

      const coverId = `cover_${id}`;
      saveBookCover(coverId, formCoverFile, {
        name: formCoverFile.name || null,
        from: 'book-form',
      }).catch(() => {
        // Échec silencieux : on a déjà coverInline comme fallback
      });
    }

    setFormCoverFile(null);
    if (coverFormInputRef.current) {
      coverFormInputRef.current.value = '';
    }

    if (isEditing) {
      sidebarEvents.emit(SIDEBAR_EVENTS.BOOK_UPDATED, { bookId: id });
    } else {
      sidebarEvents.emit(SIDEBAR_EVENTS.BOOK_ADDED, { bookId: id });
    }

    resetForm();
  }, [form, formCoverFile, setBooks, setCoverUrls, coverUrlsRef, resetForm]);

  const handleEdit = useCallback((book) => {
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
    setFormCoverFile(null);
    if (coverFormInputRef.current) {
      coverFormInputRef.current.value = '';
    }
  }, []);

  const handleDelete = useCallback((book) => {
    if (!window.confirm(`Supprimer définitivement "${book.title}" ?`)) {
      return;
    }
    setBooks((prev) => prev.filter((b) => b.id !== book.id));
    sidebarEvents.emit(SIDEBAR_EVENTS.BOOK_DELETED, { bookId: book.id });
  }, [setBooks]);

  const handleStatusChange = useCallback((bookId, newStatus) => {
    setBooks((prevBooks) =>
      prevBooks.map((b) =>
        b.id === bookId ? { ...b, status: newStatus } : b
      )
    );
    sidebarEvents.emit(SIDEBAR_EVENTS.BOOK_UPDATED, { bookId, statusChanged: true });
  }, [setBooks]);

  return {
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
  };
};
