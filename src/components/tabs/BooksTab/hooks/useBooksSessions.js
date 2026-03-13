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
  const [editingSessionId, setEditingSessionId] = useState(null);

  const handleSessionChange = useCallback((field, value) => {
    setSessionForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resetSessionForm = useCallback(() => {
    setSessionForm(emptySessionForm);
    setEditingSessionId(null);
  }, []);

  const startEditSession = useCallback((session) => {
    if (!session) return;
    setSessionForm({
      date: session.date || '',
      durationMinutes: session.durationMinutes != null ? String(session.durationMinutes) : '',
      pagesRead: session.pagesRead != null ? String(session.pagesRead) : '',
      startTime: session.startTime || '',
      note: session.note || '',
    });
    setEditingSessionId(session.id || null);
  }, []);

  const cancelEditSession = useCallback(() => {
    resetSessionForm();
  }, [resetSessionForm]);

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
      startTime: sessionForm.startTime || '',
      note: sessionForm.note?.trim() || '',
    });

    if (!validation.success) {
      const firstError = Object.values(validation.errors)[0];
      alert(firstError || 'Erreur de validation');
      return;
    }

    const baseData = {
      ...validation.data,
    };

    const newId = editingSessionId || `session_${Date.now()}`;

    setBooks((prev) =>
      prev.map((book) => {
        if (book.id !== selectedBook.id) return book;

        const existingSessions = book.readingSessions || [];

        if (editingSessionId) {
          // Mise à jour d'une session existante
          return {
            ...book,
            readingSessions: existingSessions.map((s) =>
              s.id === editingSessionId ? { ...s, ...baseData } : s
            ),
          };
        }

        const session = {
          id: newId,
          ...baseData,
        };

        return {
          ...book,
          readingSessions: [...existingSessions, session],
        };
      })
    );

    sidebarEvents.emit(SIDEBAR_EVENTS.PAGES_READ, { 
      bookId: selectedBook.id, 
      sessionId: newId,
      date: session.date,
      pagesRead: session.pagesRead,
      durationMinutes: session.durationMinutes
    });

    resetSessionForm();
  }, [selectedBook, sessionForm, setBooks, resetSessionForm, editingSessionId]);

  return {
    sessionForm,
    setSessionForm,
    handleSessionChange,
    handleAddSession,
    resetSessionForm,
    editingSessionId,
    startEditSession,
    cancelEditSession,
  };
};
