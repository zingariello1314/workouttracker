/**
 * Hook pour la gestion des sessions de lecture
 * 
 * ✅ PHASE 4 : Extraction de la logique des sessions
 * 
 * @module components/tabs/BooksTab/hooks/useBooksSessions
 */

import { useState, useCallback } from 'react';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../../utils/sidebarEvents';
import { readingSessionSchema, validateWithSchema } from '../../../../utils/validation/schemas';
import { emptySessionForm } from '../constants';

/**
 * Hook pour gérer les sessions de lecture
 * 
 * @param {Array} books - Liste de tous les livres
 * @param {Function} setBooks - Fonction pour mettre à jour les livres
 * @param {Object} selectedBook - Livre sélectionné
 * @returns {Object} { sessionForm, setSessionForm, handleSessionChange, handleAddSession, resetSessionForm }
 */
export const useBooksSessions = (books = [], setBooks, selectedBook) => {
  const [sessionForm, setSessionForm] = useState(emptySessionForm);

  const handleSessionChange = useCallback((field, value) => {
    setSessionForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetSessionForm = useCallback(() => {
    setSessionForm(emptySessionForm);
  }, []);

  const handleAddSession = useCallback((e) => {
    e.preventDefault();
    if (!selectedBook) {
      alert('Sélectionne un livre pour y ajouter une session de lecture.');
      return;
    }

    if (!sessionForm.durationMinutes && !sessionForm.pagesRead) {
      alert('Merci de renseigner au moins la durée ou les pages lues.');
      return;
    }

    // Validation avec Zod
    const validation = validateWithSchema(readingSessionSchema, {
      date: sessionForm.date || new Date().toISOString().slice(0, 10),
      durationMinutes: sessionForm.durationMinutes ? Number(sessionForm.durationMinutes) || 0 : 0,
      pagesRead: sessionForm.pagesRead ? Number(sessionForm.pagesRead) || 0 : 0,
      note: sessionForm.note?.trim() || '',
    });

    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      alert(firstError || 'Erreur de validation');
      return;
    }

    const session = {
      id: `session_${Date.now()}`,
      ...validation.data,
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

    sidebarEvents.emit(SIDEBAR_EVENTS.PAGES_READ, { 
      bookId: selectedBook.id, 
      sessionId: session.id,
      date: session.date,
      pagesRead: session.pagesRead,
      durationMinutes: session.durationMinutes
    });

    resetSessionForm();
  }, [selectedBook, sessionForm, setBooks, resetSessionForm]);

  return {
    sessionForm,
    setSessionForm,
    handleSessionChange,
    handleAddSession,
    resetSessionForm,
  };
};
