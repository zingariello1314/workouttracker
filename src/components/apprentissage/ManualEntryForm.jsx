/**
 * Composant ManualEntryForm - Formulaire d'ajout manuel de session
 */

import React from 'react';
import { SESSION_TYPES, LIMITS } from '../../utils/apprentissageConstants';

const ManualEntryForm = ({ subjects, manualSession, onManualSessionChange, onAddManualSession }) => {
  return (
    <div className="mb-6 p-4 bg-slate-900/50 border border-emerald-500/30 rounded-lg">
      <h4 className="text-sm font-bold text-emerald-400 mb-4 uppercase">✏️ DATA ENTRY PROTOCOL</h4>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">PROTOCOL:</label>
          <select
            value={manualSession.subjectName}
            onChange={(e) => onManualSessionChange({ ...manualSession, subjectName: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
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
          <label className="text-xs text-slate-400 mb-1 block">TYPE:</label>
          <select
            value={manualSession.type}
            onChange={(e) => onManualSessionChange({ ...manualSession, type: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
          >
            <option value={SESSION_TYPES.WORK}>📚 WORK</option>
            <option value={SESSION_TYPES.BREAK}>☕ BREAK</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">DURATION (MIN):</label>
          <input
            type="number"
            min="1"
            max={LIMITS.MAX_SESSION_DURATION / 60}
            value={manualSession.duration}
            onChange={(e) => onManualSessionChange({ ...manualSession, duration: parseInt(e.target.value) || 25 })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">DATE:</label>
          <input
            type="date"
            value={manualSession.date}
            onChange={(e) => onManualSessionChange({ ...manualSession, date: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
          />
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">TIME:</label>
          <input
            type="time"
            value={manualSession.time}
            onChange={(e) => onManualSessionChange({ ...manualSession, time: e.target.value })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm text-slate-200"
          />
        </div>
      </div>
      <button
        onClick={onAddManualSession}
        disabled={!manualSession.subjectName}
        className="mt-4 px-6 py-2 bg-emerald-500/20 border border-emerald-500 rounded-lg text-emerald-400 font-semibold uppercase text-xs tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-500/30 transition-all duration-200"
      >
        ✅ COMMIT DATA
      </button>
    </div>
  );
};

export default ManualEntryForm;

