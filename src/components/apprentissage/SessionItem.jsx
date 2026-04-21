/**
 * Composant SessionItem - Item de session pour la virtualisation
 * Optimisé pour react-window
 */

import React from 'react';
import { SESSION_TYPES, LIMITS } from '../../utils/apprentissageConstants';

const SessionItem = React.memo(({
  index,
  style,
  data: {
    sessions,
    subjects,
    editingSession,
    editSession,
    onStartEditSession,
    onSaveEditSession,
    onCancelEditSession,
    onDeleteSession,
    onEditSessionChange,
  },
}) => {
  const session = sessions[index];
  const isEditing = editingSession === index;

  const fieldClass =
    'w-full px-2 py-1 bg-black border border-emerald-500/45 rounded text-xs text-emerald-100 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/35';
  const labelClass = 'text-xs text-emerald-200/65 mb-1 block';

  return (
    <div style={style}>
      <div
        className={`p-3 bg-black border rounded-lg mx-2 mb-2 ${
          isEditing ? 'border-emerald-400/70 ring-1 ring-emerald-500/30' : 'border-emerald-600/40'
        }`}
      >
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xl">{session.type === SESSION_TYPES.WORK ? '📚' : '☕'}</span>
              <div className="flex-1">
                <div className="font-semibold text-emerald-100">{session.subject}</div>
                <div className="text-xs text-emerald-200/70">
                  {new Date(session.startTime).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}{' '}
                  - {new Date(session.startTime).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
                <div className="text-xs text-emerald-300/55 mt-1">
                  {Math.floor(session.actualWorkTime / 60)}MIN
                  {session.isManual && ' • ✏️ MANUAL'}
                </div>
              </div>
            </div>
            <div className="flex gap-2" role="group" aria-label="Actions sur la session">
              <button
                type="button"
                onClick={() => onStartEditSession(index)}
                aria-label={`Modifier la session ${index + 1} de ${session.subject}`}
                className="rounded-lg border border-emerald-500/55 bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-200 hover:border-emerald-400"
                title="MODIFY ENTRY"
              >
                <span aria-hidden="true">✏️</span>
                <span className="sr-only">Modifier</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteSession(index)}
                aria-label={`Supprimer la session ${index + 1} de ${session.subject}`}
                className="rounded-lg border border-red-500/45 bg-black px-2 py-1 text-xs text-red-300 hover:bg-red-950/30"
                title="DELETE ENTRY"
              >
                <span aria-hidden="true">🗑️</span>
                <span className="sr-only">Supprimer</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <label className={labelClass}>PROTOCOL:</label>
                <select
                  value={editSession.subjectName}
                  onChange={(e) => onEditSessionChange({ ...editSession, subjectName: e.target.value })}
                  className={fieldClass}
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>TYPE:</label>
                <select
                  value={editSession.type}
                  onChange={(e) => onEditSessionChange({ ...editSession, type: e.target.value })}
                  className={fieldClass}
                >
                  <option value={SESSION_TYPES.WORK}>📚 WORK</option>
                  <option value={SESSION_TYPES.BREAK}>☕ BREAK</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>DURATION:</label>
                <input
                  type="number"
                  min="1"
                  max={LIMITS.MAX_SESSION_DURATION / 60}
                  value={editSession.duration}
                  onChange={(e) => onEditSessionChange({ ...editSession, duration: parseInt(e.target.value) || 25 })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>DATE:</label>
                <input
                  type="date"
                  value={editSession.date}
                  onChange={(e) => onEditSessionChange({ ...editSession, date: e.target.value })}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className={labelClass}>TIME:</label>
                <input
                  type="time"
                  value={editSession.time}
                  onChange={(e) => onEditSessionChange({ ...editSession, time: e.target.value })}
                  className={fieldClass}
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onSaveEditSession}
                disabled={!editSession.subjectName}
                className="rounded-lg border border-emerald-400 bg-emerald-500/15 px-3 py-1.5 font-semibold text-xs uppercase text-emerald-50 disabled:opacity-40"
              >
                ✅ SAVE
              </button>
              <button
                type="button"
                onClick={onCancelEditSession}
                className="rounded-lg border border-emerald-600/50 bg-black px-3 py-1.5 font-semibold text-xs uppercase text-emerald-200 hover:border-emerald-400"
              >
                ❌ CANCEL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SessionItem.displayName = 'SessionItem';

export default SessionItem;

