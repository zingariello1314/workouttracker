import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { readingSessionSchema, validateWithSchema } from '../../utils/validation/schemas';
import ReadingSessionCriteriaSliders from './ReadingSessionCriteriaSliders';
import BookSessionFeedbackReadonly from './BookSessionFeedbackReadonly';
import { isReadingDayFeedbackFilled } from '../../utils/readingDayFeedbacksStorage';
import { sidebarEvents, SIDEBAR_EVENTS } from '../../utils/sidebarEvents';

function bookById(books, id) {
  return (books || []).find((b) => b.id === id) || null;
}

export default function BooksCalendarDayDetailPanel({
  dateStr,
  heading,
  onClose,
  bd,
  books = [],
  coverUrls = {},
  dayFeedback = {},
  onSaveDayFeedback,
  onUpdateBookSession,
}) {
  const [dayNote, setDayNote] = useState(() => (dayFeedback?.note || '').toString());
  const [dayFilled, setDayFilled] = useState(() => Boolean(dayFeedback?.filled));

  const [editKey, setEditKey] = useState(null);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    setDayNote((dayFeedback?.note || '').toString());
    setDayFilled(Boolean(dayFeedback?.filled));
  }, [dateStr, dayFeedback?.note, dayFeedback?.filled]);

  const startEdit = useCallback((entry) => {
    const b = bookById(books, entry.bookId);
    const session = (b?.readingSessions || []).find((s) => s.id === entry.sessionId);
    if (!session) return;
    setEditKey(`${entry.bookId}|${entry.sessionId}`);
    setEditForm({
      durationMinutes: session.durationMinutes != null ? String(session.durationMinutes) : '',
      pagesRead: session.pagesRead != null ? String(session.pagesRead) : '',
      startTime: session.startTime || '',
      note: session.note || '',
      criteriaRatings: {
        immersion: Number(session.criteriaRatings?.immersion) || 5,
        rythme: Number(session.criteriaRatings?.rythme) || 5,
        richesse: Number(session.criteriaRatings?.richesse) || 5,
        concentration: Number(session.criteriaRatings?.concentration) || 5,
        plaisir: Number(session.criteriaRatings?.plaisir) || 5,
      },
    });
  }, [books]);

  const cancelEdit = useCallback(() => {
    setEditKey(null);
    setEditForm(null);
  }, []);

  const saveSessionEdit = useCallback(
    (bookId, sessionId) => {
      if (!editForm) return;
      const validation = validateWithSchema(readingSessionSchema, {
        date: dateStr,
        durationMinutes: editForm.durationMinutes ? Number(editForm.durationMinutes) || 0 : 0,
        pagesRead: editForm.pagesRead ? Number(editForm.pagesRead) || 0 : 0,
        startTime: editForm.startTime || '',
        note: (editForm.note || '').trim(),
        criteriaRatings: { ...editForm.criteriaRatings },
      });
      if (!validation.success) {
        const msg = Object.values(validation.errors || {})[0] || 'Validation';
        alert(msg);
        return;
      }
      onUpdateBookSession?.(bookId, sessionId, validation.data);
      sidebarEvents.emit(SIDEBAR_EVENTS.PAGES_READ, {
        bookId,
        sessionId,
        date: dateStr,
        pagesRead: validation.data.pagesRead,
        durationMinutes: validation.data.durationMinutes,
      });
      cancelEdit();
    },
    [editForm, dateStr, onUpdateBookSession, cancelEdit]
  );

  const saveDayRessenti = useCallback(() => {
    const filled = dayFilled || isReadingDayFeedbackFilled({ note: dayNote, filled: dayFilled });
    onSaveDayFeedback?.(dateStr, {
      note: dayNote.trim(),
      filled: Boolean(dayFilled) || (dayNote.trim().length >= 12),
    });
  }, [dateStr, dayNote, dayFilled, onSaveDayFeedback]);

  const entries = bd?.entries || [];

  const enriched = useMemo(() => {
    return entries.map((e) => {
      const b = bookById(books, e.bookId);
      const cover = coverUrls[e.bookId] || b?.coverInline || null;
      const summary = (b?.shortSummary || b?.notes || '').trim();
      const sessionFull =
        e.sessionId && b ? (b.readingSessions || []).find((s) => s.id === e.sessionId) : null;
      return { ...e, book: b, cover, summary, sessionFull };
    });
  }, [entries, books, coverUrls]);

  const dayBonusActive =
    isReadingDayFeedbackFilled({ note: dayNote, filled: dayFilled }) ||
    isReadingDayFeedbackFilled(dayFeedback);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-sky-100">{heading}</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-sky-300/80 hover:text-sky-100 text-2xl leading-none"
        >
          ×
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div className="bg-black/90 rounded-lg p-3 text-center border border-[#3A86FF]/45">
          <div className="text-2xl font-bold text-sky-100">{bd?.sessions ?? 0}</div>
          <div className="text-xs text-sky-200/80">Sessions</div>
        </div>
        <div className="bg-black/90 rounded-lg p-3 text-center border border-[#3A86FF]/45">
          <div className="text-2xl font-bold text-sky-100">{bd?.pages ?? 0}</div>
          <div className="text-xs text-sky-200/80">Pages lues</div>
        </div>
        <div className="bg-black/90 rounded-lg p-3 text-center border border-[#3A86FF]/45">
          <div className="text-2xl font-bold text-sky-100">{bd?.minutes ?? 0} min</div>
          <div className="text-xs text-sky-200/80">Temps lecture</div>
        </div>
      </div>

      {dayBonusActive && (
        <p className="text-[11px] text-sky-200/90 border border-[#3A86FF]/40 rounded-lg px-2 py-1.5 bg-[#3A86FF]/12">
          Ressenti du jour enregistré : +2 au score d’intensité de cette case et +20 XP comptabilisés pour cette
          date (si au moins une session de lecture).
        </p>
      )}

      {enriched.length > 0 ? (
        <div className="space-y-3">
          <h4 className="text-white font-medium">Sessions</h4>
          <ul className="space-y-4">
            {enriched.map((e, idx) => {
              const key = `${e.bookId}|${e.sessionId || idx}`;
              const isEditing = editKey === key;
              return (
                <li
                  key={key}
                  className="rounded-xl border border-[#3A86FF]/40 bg-black/85 overflow-hidden"
                >
                  <div className="flex flex-col sm:flex-row gap-3 p-3">
                    <div className="shrink-0 w-full sm:w-24 h-36 sm:h-32 rounded-lg bg-black border border-[#3A86FF]/35 overflow-hidden flex items-center justify-center">
                      {e.cover ? (
                        <img src={e.cover} alt="" className="w-full h-full object-cover" loading="lazy" />
                      ) : (
                        <span className="text-[10px] text-slate-600 px-1 text-center">Pas de couverture</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="text-white font-semibold truncate">{e.bookTitle}</div>
                      {e.book?.author ? (
                        <div className="text-xs text-slate-500 truncate">{e.book.author}</div>
                      ) : null}
                      {e.summary ? (
                        <p className="text-xs text-slate-400 leading-snug line-clamp-4">{e.summary}</p>
                      ) : (
                        <p className="text-xs text-slate-600 italic">Pas de résumé court.</p>
                      )}
                      {!isEditing && (
                        <>
                          <div className="text-slate-400 text-xs flex flex-wrap gap-x-2 gap-y-1">
                            {e.durationMinutes > 0 && <span>{e.durationMinutes} min</span>}
                            {e.pagesRead > 0 && <span>{e.pagesRead} p.</span>}
                            {e.startTime ? <span>Début {e.startTime}</span> : null}
                            {e.book?.genre ? <span>· {e.book.genre}</span> : null}
                            {e.book?.pages ? <span>· {e.book.pages} p. tot.</span> : null}
                          </div>
                          <BookSessionFeedbackReadonly
                            session={e.sessionFull || e}
                            title="Feedback"
                          />
                          {e.sessionId && (
                            <button
                              type="button"
                              onClick={() => startEdit(e)}
                              className="text-xs text-cyan-300 hover:text-cyan-200 underline"
                            >
                              Modifier session & feedback
                            </button>
                          )}
                        </>
                      )}
                      {isEditing && editForm && (
                        <div className="space-y-2 pt-1">
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-[10px] text-slate-500">
                              Durée (min)
                              <input
                                className="mt-0.5 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white"
                                value={editForm.durationMinutes}
                                onChange={(ev) =>
                                  setEditForm((f) => ({ ...f, durationMinutes: ev.target.value }))
                                }
                              />
                            </label>
                            <label className="text-[10px] text-slate-500">
                              Pages
                              <input
                                className="mt-0.5 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white"
                                value={editForm.pagesRead}
                                onChange={(ev) =>
                                  setEditForm((f) => ({ ...f, pagesRead: ev.target.value }))
                                }
                              />
                            </label>
                          </div>
                          <label className="text-[10px] text-slate-500 block">
                            Heure (optionnel)
                            <input
                              type="time"
                              className="mt-0.5 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white"
                              value={editForm.startTime}
                              onChange={(ev) =>
                                setEditForm((f) => ({ ...f, startTime: ev.target.value }))
                              }
                            />
                          </label>
                          <ReadingSessionCriteriaSliders
                            criteriaRatings={editForm.criteriaRatings}
                            onChange={(k, v) =>
                              setEditForm((f) => ({
                                ...f,
                                criteriaRatings: { ...f.criteriaRatings, [k]: v },
                              }))
                            }
                          />
                          <label className="text-[10px] text-slate-500 block">
                            Note libre
                            <textarea
                              className="mt-0.5 w-full rounded bg-slate-900 border border-slate-700 px-2 py-1 text-sm text-white min-h-[56px]"
                              value={editForm.note}
                              onChange={(ev) => setEditForm((f) => ({ ...f, note: ev.target.value }))}
                            />
                          </label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white"
                              onClick={() => saveSessionEdit(e.bookId, e.sessionId)}
                            >
                              Enregistrer
                            </button>
                            <button
                              type="button"
                              className="text-xs text-slate-400 underline"
                              onClick={cancelEdit}
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <p className="text-slate-400 text-sm">Aucune session de lecture ce jour.</p>
      )}

      <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 space-y-3">
        <h4 className="text-amber-100 font-medium text-sm">Ressenti global du jour</h4>
        <p className="text-[11px] text-slate-400">
          Synthèse de ta journée de lecture (en plus des retours par session). Si tu coches « jour documenté » ou
          que tu écris au moins ~12 caractères, le jour compte pour le bonus intensité (+2) et +20 XP.
        </p>
        <textarea
          className="w-full rounded-lg bg-black/40 border border-slate-700 px-3 py-2 text-sm text-slate-100 min-h-[72px]"
          placeholder="Impressions, contexte, fatigue, lieu…"
          value={dayNote}
          onChange={(ev) => setDayNote(ev.target.value)}
        />
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={dayFilled}
            onChange={(ev) => setDayFilled(ev.target.checked)}
            className="accent-amber-500"
          />
          J’ai terminé mon ressenti pour ce jour (bonus actif même avec une note courte)
        </label>
        <button
          type="button"
          onClick={saveDayRessenti}
          className="text-sm px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold"
        >
          Enregistrer le ressenti du jour
        </button>
      </div>
    </div>
  );
}
