/**
 * Composant SessionsHistory - Historique des sessions avec édition
 * Optimisé avec virtualisation pour grandes listes
 */

import React, { useMemo, useState, useCallback } from 'react';
import { FixedSizeList } from 'react-window';
import { SESSION_TYPES, LIMITS } from '../../utils/apprentissageConstants';
import SessionItem from './SessionItem';
import EmptyState from '../ui/EmptyState';

const ITEMS_PER_PAGE = 50;

const SessionsHistory = React.memo(({
  sessionsHistory,
  subjects,
  showManualForm,
  onToggleManualForm,
  manualSession,
  onManualSessionChange,
  onAddManualSession,
  editingSession,
  editSession,
  onEditSessionChange,
  onStartEditSession,
  onSaveEditSession,
  onCancelEditSession,
  onDeleteSession,
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-emerald-500/30 rounded-xl p-6 shadow-xl shadow-emerald-500/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-wide">
          <span aria-hidden="true">📊</span> SESSION ARCHIVE
        </h3>
        <button
          onClick={onToggleManualForm}
          aria-label={showManualForm ? 'Fermer le formulaire d\'ajout manuel' : 'Ouvrir le formulaire d\'ajout manuel'}
          aria-expanded={showManualForm}
          className={`px-4 py-2 rounded-lg font-semibold text-xs uppercase tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            showManualForm
              ? 'bg-red-900/30 border border-red-500/50 text-red-400 hover:bg-red-500/20 focus:ring-red-500'
              : 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 focus:ring-emerald-500'
          }`}
        >
          {showManualForm ? '❌ CANCEL' : '➕ MANUAL DATA ENTRY'}
        </button>
      </div>

      {/* Formulaire ajout manuel */}
      {showManualForm && (
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
      )}

      {/* Statistiques */}
      {sessionsHistory.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <div className="text-2xl font-bold text-cyan-400">
              {sessionsHistory.filter((s) => s.type === SESSION_TYPES.WORK).length}
            </div>
            <div className="text-xs text-slate-400 uppercase mt-1">Total Sessions</div>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <div className="text-2xl font-bold text-emerald-400">
              {Math.floor(sessionsHistory.reduce((sum, s) => sum + (s.actualWorkTime || 0), 0) / 3600)}H
            </div>
            <div className="text-xs text-slate-400 uppercase mt-1">Total Time</div>
          </div>
          <div className="text-center p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
            <div className="text-2xl font-bold text-purple-400">
              {[...new Set(sessionsHistory.filter((s) => s.type === SESSION_TYPES.WORK).map((s) => s.subject))].length}
            </div>
            <div className="text-xs text-slate-400 uppercase mt-1">Protocols</div>
          </div>
        </div>
      )}

      {/* Liste sessions avec pagination ou virtualisation */}
      {sessionsHistory.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold text-slate-400">RECENT ACTIVITY:</div>
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setViewMode(viewMode === 'virtualized' ? 'paginated' : 'virtualized')}
                className="px-3 py-1 text-xs bg-slate-700/50 border border-slate-600 rounded text-slate-300 hover:bg-slate-600 transition-colors"
                aria-label={`Basculer vers ${viewMode === 'virtualized' ? 'pagination' : 'virtualisation'}`}
              >
                {viewMode === 'virtualized' ? '📄 Pagination' : '⚡ Virtualisé'}
              </button>
            </div>
          </div>

          {viewMode === 'virtualized' ? (
            <FixedSizeList
              height={Math.min(600, sessionsHistory.length * 120)}
              itemCount={sessionsHistory.length}
              itemSize={120}
              width="100%"
              itemData={{
                sessions: sessionsHistory,
                subjects,
                editingSession,
                editSession,
                onStartEditSession,
                onSaveEditSession,
                onCancelEditSession,
                onEditSessionChange,
                onDeleteSession,
              }}
            >
              {SessionItem}
            </FixedSizeList>
          ) : (
            <>
              <div className="space-y-3">
                {paginatedSessions.map((session, index) => (
                  <SessionItem
                    key={session.id || `session-${startIndex + index}`}
                    index={startIndex + index}
                    style={{}}
                    data={{
                      sessions: sessionsHistory,
                      subjects,
                      editingSession,
                      editSession,
                      onStartEditSession,
                      onSaveEditSession,
                      onCancelEditSession,
                      onEditSessionChange,
                      onDeleteSession,
                    }}
                  />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t border-slate-700/50">
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    aria-label="Première page"
                  >
                    ⏮️
                  </button>
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    aria-label="Page précédente"
                  >
                    ⬅️
                  </button>
                  <span className="px-4 py-1 text-sm text-slate-300 font-semibold">
                    Page {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    aria-label="Page suivante"
                  >
                    ➡️
                  </button>
                  <button
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 bg-slate-700/50 border border-slate-600 rounded text-slate-300 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                    aria-label="Dernière page"
                  >
                    ⏭️
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
            <EmptyState
              icon="🕘"
              title="Aucune session enregistrée"
              message="Commencez par démarrer une session d'étude ou ajoutez une entrée manuelle pour voir votre historique ici."
              actionLabel="Démarrer une session"
              onAction={() => {
                // Scroll vers le haut pour voir le sélecteur de matière
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
    </div>
  );
});

SessionsHistory.displayName = 'SessionsHistory';

export default SessionsHistory;

