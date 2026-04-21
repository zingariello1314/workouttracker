/**
 * AllSessionsSection – Liste de toutes les sessions avec filtre (année / all time) et édition.
 * Placé en bas de l’onglet Statistiques.
 */

import React, { useState, useMemo } from 'react';
import { Calendar, BookOpen, Edit2, X, Check } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Input, TextArea } from '../../../ui/Input';
import ReadingSessionCriteriaSliders from '../../../books/ReadingSessionCriteriaSliders';
import SessionAggregator from '../../../../services/statistics/SessionAggregator';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../../../utils/sidebarEvents';
import { validateWithSchema, readingSessionSchema } from '../../../../utils/validation/schemas';

const normalizeDate = (dateString) => {
  if (!dateString) return '';
  try {
    const str = typeof dateString === 'string' ? dateString : new Date(dateString).toISOString().split('T')[0];
    return str.split('T')[0];
  } catch {
    return '';
  }
};

export default function AllSessionsSection({ books = [], setBooks }) {
  const [filter, setFilter] = useState('year'); // 'year' | 'all'
  const [editingSession, setEditingSession] = useState(null);
  const defaultCriteria = () => ({
    immersion: 5,
    rythme: 5,
    richesse: 5,
    concentration: 5,
    plaisir: 5,
  });
  const [editForm, setEditForm] = useState({
    date: '',
    durationMinutes: '',
    pagesRead: '',
    startTime: '',
    note: '',
    criteriaRatings: defaultCriteria(),
  });
  const [editError, setEditError] = useState('');

  const currentYear = new Date().getFullYear().toString();

  const allSessions = useMemo(() => {
    const list = SessionAggregator.extractAllSessions(books);
    return list.map((s) => ({
      ...s,
      id: s.id || `session_${s.bookId}_${s.normalizedDate}_${s.pagesRead}_${s.durationMinutes}`,
    }));
  }, [books]);

  const filteredAndSorted = useMemo(() => {
    let list = allSessions;
    if (filter === 'year') {
      list = list.filter((s) => s.normalizedDate && s.normalizedDate.startsWith(currentYear));
    }
    return [...list].sort((a, b) => (b.normalizedDate || '').localeCompare(a.normalizedDate || ''));
  }, [allSessions, filter, currentYear]);

  const openEdit = (session) => {
    setEditingSession(session);
    const cr = session.criteriaRatings && typeof session.criteriaRatings === 'object'
      ? { ...defaultCriteria(), ...session.criteriaRatings }
      : defaultCriteria();
    setEditForm({
      date: session.normalizedDate || session.date?.split?.('T')[0] || '',
      durationMinutes: session.durationMinutes != null ? String(session.durationMinutes) : '',
      pagesRead: session.pagesRead != null ? String(session.pagesRead) : '',
      startTime: session.startTime || '',
      note: session.note || '',
      criteriaRatings: cr,
    });
    setEditError('');
  };

  const closeEdit = () => {
    setEditingSession(null);
    setEditError('');
  };

  const handleEditChange = (field, value) => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCriteriaChange = (key, value) => {
    setEditForm((prev) => ({
      ...prev,
      criteriaRatings: { ...prev.criteriaRatings, [key]: value },
    }));
  };

  const saveEdit = () => {
    setEditError('');
    const dateStr = editForm.date?.trim() || '';
    const duration = editForm.durationMinutes !== '' ? Number(editForm.durationMinutes) : 0;
    const pages = editForm.pagesRead !== '' ? Number(editForm.pagesRead) : 0;
    if (!dateStr) {
      setEditError('La date est requise.');
      return;
    }
    if (duration <= 0 && pages <= 0) {
      setEditError('Renseigne au moins la durée ou les pages lues.');
      return;
    }
    const payload = {
      date: dateStr,
      durationMinutes: duration || 0,
      pagesRead: pages || 0,
      startTime: (editForm.startTime || '').trim(),
      note: (editForm.note || '').trim(),
      criteriaRatings: {
        immersion: Number(editForm.criteriaRatings?.immersion) || 5,
        rythme: Number(editForm.criteriaRatings?.rythme) || 5,
        richesse: Number(editForm.criteriaRatings?.richesse) || 5,
        concentration: Number(editForm.criteriaRatings?.concentration) || 5,
        plaisir: Number(editForm.criteriaRatings?.plaisir) || 5,
      },
    };
    const validation = validateWithSchema(readingSessionSchema, payload);
    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0];
      setEditError(firstError || 'Erreur de validation');
      return;
    }

    const { bookId, id: sessionId, normalizedDate, pagesRead: oldPages, durationMinutes: oldMins } = editingSession;
    const sessionIdToEmit = sessionId;
    setBooks((prev) =>
      prev.map((book) => {
        if (book.id !== bookId) return book;
        const sessions = (book.readingSessions || []).map((s, idx) => {
          const match = s.id !== undefined && s.id !== null
            ? s.id === sessionId
            : (normalizeDate(s.date) === normalizedDate && (s.pagesRead ?? 0) === oldPages && (s.durationMinutes ?? 0) === oldMins);
          return match ? { ...s, ...validation.data } : s;
        });
        return { ...book, readingSessions: sessions };
      })
    );

    sidebarEvents.emit(SIDEBAR_EVENTS.PAGES_READ, {
      bookId,
      sessionId: sessionIdToEmit,
      date: validation.data.date,
      pagesRead: validation.data.pagesRead,
      durationMinutes: validation.data.durationMinutes,
    });
    closeEdit();
  };

  const formatDate = (d) => {
    if (!d) return '—';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  };

  return (
    <div className="mt-8">
      <Card variant="books">
        <CardHeader className="border-b border-[#3A86FF]/25">
          <CardTitle tone="books" className="flex items-center gap-2 normal-case tracking-wide">
            <Calendar className="w-5 h-5 text-[#93c5fd]" />
            Toutes les sessions enregistrées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-[#93c5fd]/85">Période :</span>
            <Button
              variant={filter === 'year' ? 'books' : 'booksMuted'}
              size="sm"
              onClick={() => setFilter('year')}
              className="normal-case tracking-normal"
            >
              Année {currentYear}
            </Button>
            <Button
              variant={filter === 'all' ? 'books' : 'booksMuted'}
              size="sm"
              onClick={() => setFilter('all')}
              className="normal-case tracking-normal"
            >
              Toutes les années
            </Button>
          </div>

          {filteredAndSorted.length === 0 ? (
            <p className="text-[#93c5fd]/80 text-sm py-4">Aucune session pour cette période.</p>
          ) : (
            <div className="overflow-x-auto -mx-2 rounded-xl border-2 border-[#3A86FF]/40 bg-black/50">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-[#93c5fd]/85 border-b border-[#3A86FF]/35">
                    <th className="py-2 px-2 font-medium">Date</th>
                    <th className="py-2 px-2 font-medium">Livre</th>
                    <th className="py-2 px-2 font-medium text-right">Pages</th>
                    <th className="py-2 px-2 font-medium text-right">Min</th>
                    <th className="py-2 px-2 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSorted.map((session) => (
                    <tr
                      key={`${session.bookId}-${session.id}-${session.normalizedDate}`}
                      className="border-b border-[#3A86FF]/20 hover:bg-[#3A86FF]/10"
                    >
                      <td className="py-2 px-2 text-[#93c5fd]/90 whitespace-nowrap tabular-nums">
                        {formatDate(session.normalizedDate)}
                      </td>
                      <td className="py-2 px-2 text-[#bfdbfe] max-w-[180px] truncate" title={session.bookTitle}>
                        {session.bookTitle}
                      </td>
                      <td className="py-2 px-2 text-[#bfdbfe] text-right tabular-nums">{session.pagesRead ?? '—'}</td>
                      <td className="py-2 px-2 text-[#bfdbfe] text-right tabular-nums">{session.durationMinutes ?? '—'}</td>
                      <td className="py-2 px-2">
                        <Button
                          variant="booksMuted"
                          size="sm"
                          className="text-[#93c5fd] hover:text-[#bfdbfe] normal-case tracking-normal"
                          onClick={() => openEdit(session)}
                          aria-label="Modifier la session"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {editingSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={closeEdit}>
          <div
            className="bg-black rounded-2xl shadow-xl max-w-lg w-full p-6 border-2 border-[#3A86FF] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#bfdbfe] flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#93c5fd]" />
                Modifier la session
              </h3>
              <Button variant="booksMuted" size="sm" onClick={closeEdit} aria-label="Fermer" className="normal-case tracking-normal">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-3">
              <p className="text-[#93c5fd]/85 text-sm">Livre : {editingSession.bookTitle}</p>
              <Input
                label="Date"
                type="date"
                value={editForm.date}
                onChange={(e) => handleEditChange('date', e.target.value)}
                fieldTone="books"
              />
              <Input
                label="Durée (minutes)"
                type="number"
                min={0}
                max={1440}
                value={editForm.durationMinutes}
                onChange={(e) => handleEditChange('durationMinutes', e.target.value)}
                fieldTone="books"
              />
              <Input
                label="Pages lues"
                type="number"
                min={0}
                value={editForm.pagesRead}
                onChange={(e) => handleEditChange('pagesRead', e.target.value)}
                fieldTone="books"
              />
              <Input
                label="Heure (optionnel, HH:mm)"
                type="text"
                placeholder="14:30"
                value={editForm.startTime}
                onChange={(e) => handleEditChange('startTime', e.target.value)}
                fieldTone="books"
              />
              <ReadingSessionCriteriaSliders
                criteriaRatings={editForm.criteriaRatings}
                onChange={handleCriteriaChange}
              />
              <TextArea
                id="stats-session-note"
                label="Note libre (optionnel)"
                rows={3}
                value={editForm.note}
                onChange={(e) => handleEditChange('note', e.target.value)}
                fieldTone="books"
              />
            </div>
            {editError && <p className="text-red-400 text-sm mt-2">{editError}</p>}
            <div className="flex gap-2 mt-4">
              <Button variant="booksMuted" onClick={closeEdit} className="normal-case tracking-normal">
                Annuler
              </Button>
              <Button variant="books" onClick={saveEdit} className="flex items-center gap-2 normal-case tracking-normal">
                <Check className="w-4 h-4" />
                Enregistrer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
