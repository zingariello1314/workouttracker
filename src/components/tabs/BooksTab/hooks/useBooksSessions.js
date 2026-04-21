/**
 * Hook pour la gestion des sessions de lecture
 *
 * ✅ PHASE 4 : Extraction de la logique des sessions
 * — Notes par critère (1–10), score de session, proposition de fin de livre.
 *
 * @module components/tabs/BooksTab/hooks/useBooksSessions
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../../utils/sidebarEvents';
import { readingSessionSchema, validateWithSchema } from '../../../../utils/validation/schemas';
import { emptySessionForm } from '../constants';
import { suggestedPersonalScoreFromSessions } from '../../../../utils/bookReadingRatings';

const serializeSessionForm = (form) =>
  JSON.stringify({
    date: form?.date || '',
    durationMinutes: form?.durationMinutes || '',
    pagesRead: form?.pagesRead || '',
    startTime: form?.startTime || '',
    note: form?.note || '',
    criteriaRatings: { ...emptySessionForm.criteriaRatings, ...(form?.criteriaRatings || {}) }
  });

/**
 * @param {Array} books
 * @param {Function} setBooks
 * @param {Object|null} selectedBook
 * @param {string|null|undefined} selectedBookId
 */
export const useBooksSessions = (books = [], setBooks, selectedBook, selectedBookId) => {
  const [sessionForm, setSessionForm] = useState(() => ({
    ...emptySessionForm,
    criteriaRatings: { ...emptySessionForm.criteriaRatings },
  }));
  const [sessionDirtyBaseline, setSessionDirtyBaseline] = useState(() =>
    serializeSessionForm({ ...emptySessionForm, criteriaRatings: { ...emptySessionForm.criteriaRatings } })
  );
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [pendingBookCompletion, setPendingBookCompletion] = useState(null);

  const sessionFormDirty = useMemo(
    () => serializeSessionForm(sessionForm) !== sessionDirtyBaseline,
    [sessionForm, sessionDirtyBaseline]
  );

  const handleSessionChange = useCallback((field, value) => {
    setSessionForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCriteriaRatingChange = useCallback((criterionKey, value) => {
    setSessionForm((prev) => ({
      ...prev,
      criteriaRatings: {
        ...prev.criteriaRatings,
        [criterionKey]: value,
      },
    }));
  }, []);

  const resetSessionForm = useCallback(() => {
    const empty = {
      ...emptySessionForm,
      criteriaRatings: { ...emptySessionForm.criteriaRatings },
    };
    setSessionForm(empty);
    setSessionDirtyBaseline(serializeSessionForm(empty));
    setEditingSessionId(null);
  }, []);

  const dismissPendingBookCompletion = useCallback(() => {
    setPendingBookCompletion(null);
  }, []);

  const confirmBookCompletion = useCallback(
    (personalScoreInt) => {
      if (!pendingBookCompletion) return;
      const { bookId, finishedAtDate } = pendingBookCompletion;
      const score = Math.min(10, Math.max(0, Math.round(Number(personalScoreInt) || 0)));
      setBooks((prev) =>
        prev.map((b) =>
          b.id === bookId
            ? {
                ...b,
                status: 'completed',
                personalScore: score,
                finishedAt: finishedAtDate || b.finishedAt,
              }
            : b
        )
      );
      setPendingBookCompletion(null);
      sidebarEvents.emit(SIDEBAR_EVENTS.BOOK_UPDATED, { bookId, completed: true });
    },
    [pendingBookCompletion, setBooks]
  );

  const startEditSession = useCallback((session) => {
    if (!session) return;
    const cr = session.criteriaRatings && typeof session.criteriaRatings === 'object'
      ? { ...emptySessionForm.criteriaRatings, ...session.criteriaRatings }
      : { ...emptySessionForm.criteriaRatings };
    const nextForm = {
      date: session.date || '',
      durationMinutes: session.durationMinutes != null ? String(session.durationMinutes) : '',
      pagesRead: session.pagesRead != null ? String(session.pagesRead) : '',
      startTime: session.startTime || '',
      note: session.note || '',
      criteriaRatings: cr,
    };
    setSessionForm(nextForm);
    setSessionDirtyBaseline(serializeSessionForm(nextForm));
    setEditingSessionId(session.id || null);
  }, []);

  const cancelEditSession = useCallback(() => {
    resetSessionForm();
  }, [resetSessionForm]);

  const handleAddSession = useCallback(
    (e) => {
      e.preventDefault();
      if (!selectedBook) {
        alert('Sélectionne un livre pour y ajouter une session de lecture.');
        return;
      }

      if (!sessionForm.durationMinutes && !sessionForm.pagesRead) {
        alert('Merci de renseigner au moins la durée ou les pages lues.');
        return;
      }

      const cr = sessionForm.criteriaRatings || emptySessionForm.criteriaRatings;

      const validation = validateWithSchema(readingSessionSchema, {
        date: sessionForm.date || new Date().toISOString().slice(0, 10),
        durationMinutes: sessionForm.durationMinutes ? Number(sessionForm.durationMinutes) || 0 : 0,
        pagesRead: sessionForm.pagesRead ? Number(sessionForm.pagesRead) || 0 : 0,
        startTime: sessionForm.startTime || '',
        note: sessionForm.note?.trim() || '',
        criteriaRatings: {
          immersion: Number(cr.immersion) || 5,
          rythme: Number(cr.rythme) || 5,
          richesse: Number(cr.richesse) || 5,
          concentration: Number(cr.concentration) || 5,
          plaisir: Number(cr.plaisir) || 5,
        },
      });

      if (!validation.success) {
        const msgs = Object.values(validation.errors || {}).filter(
          (m) => typeof m === 'string' && m.length > 0
        );
        alert(msgs.length ? msgs.join('\n') : 'Erreur de validation');
        return;
      }

      const baseData = { ...validation.data };
      const newId = editingSessionId || `session_${Date.now()}`;

      const book = books.find((b) => b.id === selectedBook.id);
      if (!book) return;

      const existingSessions = book.readingSessions || [];
      let nextSessions;
      if (editingSessionId) {
        nextSessions = existingSessions.map((s) =>
          s.id === editingSessionId ? { ...s, ...baseData, id: editingSessionId } : s
        );
      } else {
        nextSessions = [...existingSessions, { id: newId, ...baseData }];
      }

      const cumPages = nextSessions.reduce((sum, s) => sum + (Number(s.pagesRead) || 0), 0);
      const totalPagesBook = Number(book.pages) || 0;
      const crossesEnd =
        totalPagesBook > 0 &&
        cumPages >= totalPagesBook &&
        book.status !== 'completed';

      setBooks((prev) =>
        prev.map((b) => {
          if (b.id !== selectedBook.id) return b;
          return { ...b, readingSessions: nextSessions };
        })
      );

      sidebarEvents.emit(SIDEBAR_EVENTS.PAGES_READ, {
        bookId: selectedBook.id,
        sessionId: newId,
        date: baseData.date,
        pagesRead: baseData.pagesRead,
        durationMinutes: baseData.durationMinutes,
      });

      if (crossesEnd) {
        const suggested = suggestedPersonalScoreFromSessions(nextSessions);
        setPendingBookCompletion({
          bookId: book.id,
          bookTitle: book.title || 'Livre',
          finishedAtDate: baseData.date,
          suggestedScore:
            suggested != null ? Math.min(10, Math.max(1, Math.round(suggested * 10) / 10)) : 7,
          cumPages,
          totalPagesBook,
        });
      }

      resetSessionForm();
    },
    [selectedBook, sessionForm, setBooks, resetSessionForm, editingSessionId, books]
  );

  useEffect(() => {
    resetSessionForm();
  }, [selectedBookId, resetSessionForm]);

  return {
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
  };
};
