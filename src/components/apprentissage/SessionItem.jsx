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

  return (
    <div style={style}>
      <div
        className={`p-3 bg-slate-900/50 border rounded-lg mx-2 mb-2 ${
          isEditing ? 'border-cyan-500/50' : 'border-slate-700/50'
        }`}
      >
        {!isEditing ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <span className="text-xl">{session.type === SESSION_TYPES.WORK ? '📚' : '☕'}</span>
              <div className="flex-1">
                <div className="font-semibold text-slate-200">{session.subject}</div>
                <div className="text-xs text-slate-400">
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
                <div className="text-xs text-slate-500 mt-1">
                  {Math.floor(session.actualWorkTime / 60)}MIN
                  {session.isManual && ' • ✏️ MANUAL'}
                </div>
              </div>
            </div>
            <div className="flex gap-2" role="group" aria-label="Actions sur la session">
              <button
                onClick={() => onStartEditSession(index)}
                aria-label={`Modifier la session ${index + 1} de ${session.subject}`}
                className="px-2 py-1 bg-slate-800/50 border border-slate-600 rounded text-slate-400 hover:bg-slate-700/50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                title="MODIFY ENTRY"
              >
                <span aria-hidden="true">✏️</span>
                <span className="sr-only">Modifier</span>
              </button>
              <button
                onClick={() => onDeleteSession(index)}
                aria-label={`Supprimer la session ${index + 1} de ${session.subject}`}
                className="px-2 py-1 bg-red-900/30 border border-red-500/50 rounded text-red-400 hover:bg-red-500/20 transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
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
                <label className="text-xs text-slate-400 mb-1 block">PROTOCOL:</label>
                <select
                  value={editSession.subjectName}
                  onChange={(e) => onEditSessionChange({ ...editSession, subjectName: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">TYPE:</label>
                <select
                  value={editSession.type}
                  onChange={(e) => onEditSessionChange({ ...editSession, type: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                >
                  <option value={SESSION_TYPES.WORK}>📚 WORK</option>
                  <option value={SESSION_TYPES.BREAK}>☕ BREAK</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">DURATION:</label>
                <input
                  type="number"
                  min="1"
                  max={LIMITS.MAX_SESSION_DURATION / 60}
                  value={editSession.duration}
                  onChange={(e) => onEditSessionChange({ ...editSession, duration: parseInt(e.target.value) || 25 })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">DATE:</label>
                <input
                  type="date"
                  value={editSession.date}
                  onChange={(e) => onEditSessionChange({ ...editSession, date: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">TIME:</label>
                <input
                  type="time"
                  value={editSession.time}
                  onChange={(e) => onEditSessionChange({ ...editSession, time: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-200"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={onSaveEditSession}
                disabled={!editSession.subjectName}
                className="px-4 py-1.5 bg-emerald-500/20 border border-emerald-500 rounded text-emerald-400 font-semibold text-xs uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500/30 transition-all"
              >
                ✅ SAVE
              </button>
              <button
                onClick={onCancelEditSession}
                className="px-4 py-1.5 bg-slate-800/50 border border-slate-600 rounded text-slate-300 font-semibold text-xs uppercase hover:bg-slate-700/50 transition-all"
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

