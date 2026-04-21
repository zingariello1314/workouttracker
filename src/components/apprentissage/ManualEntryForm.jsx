/**
 * Composant ManualEntryForm - Formulaire d'ajout manuel de session
 */

import React from 'react';
import { SESSION_TYPES, LIMITS } from '../../utils/apprentissageConstants';

const ManualEntryForm = ({ subjects, manualSession, onManualSessionChange, onAddManualSession }) => {
  return (
    <div className="mb-6 rounded-lg border-2 border-emerald-600/45 bg-black p-4">
      <h4 className="mb-4 text-sm font-bold uppercase text-emerald-300">✏️ DATA ENTRY PROTOCOL</h4>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <div>
          <label className="mb-1 block text-xs text-emerald-600/90">PROTOCOL:</label>
          <select
            value={manualSession.subjectName}
            onChange={(e) => onManualSessionChange({ ...manualSession, subjectName: e.target.value })}
            className="w-full rounded border border-emerald-600/50 bg-black px-3 py-2 text-sm text-emerald-100 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          >
            <option value="">SELECT PROTOCOL</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-emerald-600/90">TYPE:</label>
          <select
            value={manualSession.type}
            onChange={(e) => onManualSessionChange({ ...manualSession, type: e.target.value })}
            className="w-full rounded border border-emerald-600/50 bg-black px-3 py-2 text-sm text-emerald-100 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          >
            <option value={SESSION_TYPES.WORK}>📚 WORK</option>
            <option value={SESSION_TYPES.BREAK}>☕ BREAK</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs text-emerald-600/90">DURATION (MIN):</label>
          <input
            type="number"
            min="1"
            max={LIMITS.MAX_SESSION_DURATION / 60}
            value={manualSession.duration}
            onChange={(e) => onManualSessionChange({ ...manualSession, duration: parseInt(e.target.value) || 25 })}
            className="w-full rounded border border-emerald-600/50 bg-black px-3 py-2 text-sm text-emerald-100 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-emerald-600/90">DATE:</label>
          <input
            type="date"
            value={manualSession.date}
            onChange={(e) => onManualSessionChange({ ...manualSession, date: e.target.value })}
            className="w-full rounded border border-emerald-600/50 bg-black px-3 py-2 text-sm text-emerald-100 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-emerald-600/90">TIME:</label>
          <input
            type="time"
            value={manualSession.time}
            onChange={(e) => onManualSessionChange({ ...manualSession, time: e.target.value })}
            className="w-full rounded border border-emerald-600/50 bg-black px-3 py-2 text-sm text-emerald-100 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onAddManualSession}
        disabled={!manualSession.subjectName}
        className="mt-4 rounded-lg border-2 border-emerald-500/80 bg-emerald-600/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-black transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ✅ COMMIT DATA
      </button>
    </div>
  );
};

export default ManualEntryForm;

