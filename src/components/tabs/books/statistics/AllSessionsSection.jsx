/**
 * AllSessionsSection – Liste de toutes les sessions avec filtre (année / all time) et édition.
 * Placé en bas de l’onglet Statistiques.
 */

import React, { useState, useMemo } from 'react';
import { Calendar, BookOpen, Edit2, X, Check } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { Input } from '../../../ui/Input';
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
  const [editForm, setEditForm] = useState({ date: '', durationMinutes: '', pagesRead: '', startTime: '', note: '' });
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
    setEditForm({
      date: session.normalizedDate || session.date?.split?.('T')[0] || '',
      durationMinutes: session.durationMinutes != null ? String(session.durationMinutes) : '',
      pagesRead: session.pagesRead != null ? String(session.pagesRead) : '',
      startTime: session.startTime || '',
      note: session.note || '',
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
          return match
            ? {
                ...s,
                ...validation.data,
                criteriaRatings: s.criteriaRatings || validation.data.criteriaRatings,
              }
            : s;
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
      <Card variant="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-300" />
            Toutes les sessions enregistrées
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">Période :</span>
            <Button
              variant={filter === 'year' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('year')}
            >
              Année {currentYear}
            </Button>
            <Button
              variant={filter === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Toutes les années
            </Button>
          </div>

          {filteredAndSorted.length === 0 ? (
            <p className="text-slate-400 text-sm py-4">Aucune session pour cette période.</p>
          ) : (
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-600">
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
                      className="border-b border-slate-700/50 hover:bg-slate-800/30"
                    >
                      <td className="py-2 px-2 text-slate-300 whitespace-nowrap">
                        {formatDate(session.normalizedDate)}
                      </td>
                      <td className="py-2 px-2 text-slate-200 max-w-[180px] truncate" title={session.bookTitle}>
                        {session.bookTitle}
                      </td>
                      <td className="py-2 px-2 text-slate-300 text-right">{session.pagesRead ?? '—'}</td>
                      <td className="py-2 px-2 text-slate-300 text-right">{session.durationMinutes ?? '—'}</td>
                      <td className="py-2 px-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:text-white"
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
            className="bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-600"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Modifier la session
              </h3>
              <Button variant="ghost" size="sm" onClick={closeEdit} aria-label="Fermer">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-3">
              <p className="text-slate-400 text-sm">Livre : {editingSession.bookTitle}</p>
              <Input
                label="Date"
                type="date"
                value={editForm.date}
                onChange={(e) => handleEditChange('date', e.target.value)}
                variant="glass"
              />
              <Input
                label="Durée (minutes)"
                type="number"
                min={0}
                max={1440}
                value={editForm.durationMinutes}
                onChange={(e) => handleEditChange('durationMinutes', e.target.value)}
                variant="glass"
              />
              <Input
                label="Pages lues"
                type="number"
                min={0}
                value={editForm.pagesRead}
                onChange={(e) => handleEditChange('pagesRead', e.target.value)}
                variant="glass"
              />
              <Input
                label="Heure (optionnel, HH:mm)"
                type="text"
                placeholder="14:30"
                value={editForm.startTime}
                onChange={(e) => handleEditChange('startTime', e.target.value)}
                variant="glass"
              />
              <Input
                label="Note (optionnel)"
                type="text"
                value={editForm.note}
                onChange={(e) => handleEditChange('note', e.target.value)}
                variant="glass"
              />
            </div>
            {editError && <p className="text-red-400 text-sm mt-2">{editError}</p>}
            <div className="flex gap-2 mt-4">
              <Button variant="glass" onClick={closeEdit}>
                Annuler
              </Button>
              <Button variant="primary" onClick={saveEdit} className="flex items-center gap-2">
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
