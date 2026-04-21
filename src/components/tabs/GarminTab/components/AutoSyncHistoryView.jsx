/**
 * Composant pour afficher l'historique visuel des déclenchements AutoSync.
 * 
 * Affiche une liste chronologique des déclenchements avec :
 * - Type de déclenchement (scheduled/intelligent/manual)
 * - Résultat (success/error/skipped)
 * - Raison du déclenchement
 * - Durée (si disponible)
 * - Timestamp formaté
 * 
 * @module AutoSyncHistoryView
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Clock, CheckCircle, XCircle, AlertCircle, SkipForward, Calendar, Zap, User } from 'lucide-react';
import { TRIGGER_TYPES, RESULT_TYPES } from '../services/sync/AutoSyncScheduler';
import logger from '../../../../utils/logger';

const log = logger.component('AutoSyncHistoryView');

/**
 * Icône selon le type de déclenchement
 */
function getTriggerIcon(triggerType) {
  switch (triggerType) {
    case TRIGGER_TYPES.SCHEDULED:
      return <Calendar className="w-4 h-4" />;
    case TRIGGER_TYPES.INTELLIGENT:
      return <Zap className="w-4 h-4" />;
    case TRIGGER_TYPES.MANUAL:
      return <User className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

/**
 * Icône selon le résultat
 */
function getResultIcon(result) {
  switch (result) {
    case RESULT_TYPES.SUCCESS:
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case RESULT_TYPES.ERROR:
      return <XCircle className="w-4 h-4 text-red-400" />;
    case RESULT_TYPES.SKIPPED:
      return <SkipForward className="w-4 h-4 text-yellow-400" />;
    case RESULT_TYPES.CANCELLED:
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
    default:
      return <Clock className="w-4 h-4 text-gray-400" />;
  }
}

/**
 * Libellé du type de déclenchement
 */
function getTriggerLabel(triggerType) {
  switch (triggerType) {
    case TRIGGER_TYPES.SCHEDULED:
      return 'Planifiée';
    case TRIGGER_TYPES.INTELLIGENT:
      return 'Intelligente';
    case TRIGGER_TYPES.MANUAL:
      return 'Manuelle';
    default:
      return 'Inconnue';
  }
}

/**
 * Libellé du résultat
 */
function getResultLabel(result) {
  switch (result) {
    case RESULT_TYPES.SUCCESS:
      return 'Succès';
    case RESULT_TYPES.ERROR:
      return 'Erreur';
    case RESULT_TYPES.SKIPPED:
      return 'Ignorée';
    case RESULT_TYPES.CANCELLED:
      return 'Annulée';
    default:
      return 'Inconnu';
  }
}

/**
 * Formatage de la durée
 */
function formatDuration(ms) {
  if (!ms || ms < 0) return null;
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}min`;
}

/**
 * Formatage de la date
 */
function formatDate(timestamp) {
  if (!timestamp) return 'Date inconnue';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Composant pour une entrée d'historique
 */
function HistoryEntry({ entry }) {
  const triggerIcon = getTriggerIcon(entry.triggerType);
  const resultIcon = getResultIcon(entry.result);
  const triggerLabel = getTriggerLabel(entry.triggerType);
  const resultLabel = getResultLabel(entry.result);
  const duration = formatDuration(entry.duration);
  const dateStr = formatDate(entry.timestamp);

  const bgColor = entry.result === RESULT_TYPES.SUCCESS
    ? 'bg-black border-emerald-600/35'
    : entry.result === RESULT_TYPES.ERROR
    ? 'bg-black border-red-500/40'
    : entry.result === RESULT_TYPES.SKIPPED
    ? 'bg-black border-amber-500/35'
    : 'bg-black border-[#0F4C5C]/45';

  return (
    <div className={`${bgColor} border rounded-xl p-3 mb-2`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <div className="mt-0.5">
            {triggerIcon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-teal-100">
                {triggerLabel}
              </span>
              <span className="text-xs text-teal-100/50">
                {dateStr}
              </span>
            </div>
            {entry.reason && (
              <div className="text-xs text-sky-300/80 mb-1">
                {entry.reason}
              </div>
            )}
            {entry.error && (
              <div className="text-xs text-red-400 mt-1">
                Erreur: {entry.error}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {duration && (
            <div className="text-xs text-teal-100/50 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {duration}
            </div>
          )}
          <div className="flex items-center gap-1" title={resultLabel}>
            {resultIcon}
            <span className="text-xs text-teal-100/50 sr-only">
              {resultLabel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

HistoryEntry.propTypes = {
  entry: PropTypes.shape({
    id: PropTypes.string, // Optionnel pour compatibilité avec anciennes données
    timestamp: PropTypes.number, // Optionnel pour compatibilité avec anciennes données
    triggerType: PropTypes.string.isRequired,
    result: PropTypes.string.isRequired,
    reason: PropTypes.string,
    error: PropTypes.string,
    duration: PropTypes.number
  }).isRequired
};

/**
 * Composant principal pour l'historique AutoSync
 */
export default function AutoSyncHistoryView({ history = [], stats = null, onRefresh = null }) {
  const hasHistory = Array.isArray(history) && history.length > 0;

  return (
    <div className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4 shadow-md shadow-black/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-teal-100 font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-sky-300/90" />
          Historique AutoSync
        </h3>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 text-xs rounded-lg border border-[#0F5C45]/70 bg-[#0F4C5C]/40 text-teal-100 hover:bg-[#0F4C5C]/55 transition-colors"
            aria-label="Actualiser l'historique"
          >
            Actualiser
          </button>
        )}
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="mb-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="bg-black border border-[#0F4C5C]/50 rounded-lg p-2">
            <div className="text-teal-100/55">Total</div>
            <div className="text-teal-100 font-semibold">{stats.total || 0}</div>
          </div>
          {stats.byResult && (
            <>
              <div className="bg-black border border-emerald-600/35 rounded-lg p-2">
                <div className="text-emerald-300/90">Succès</div>
                <div className="text-teal-100 font-semibold">{stats.byResult.success || 0}</div>
              </div>
              <div className="bg-black border border-red-500/35 rounded-lg p-2">
                <div className="text-red-300/90">Erreurs</div>
                <div className="text-teal-100 font-semibold">{stats.byResult.error || 0}</div>
              </div>
              <div className="bg-black border border-amber-500/35 rounded-lg p-2">
                <div className="text-amber-200/90">Ignorées</div>
                <div className="text-teal-100 font-semibold">{stats.byResult.skipped || 0}</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Liste d'historique */}
      {hasHistory ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history
            .filter(entry => {
              // Filtrer les entrées invalides (doivent avoir au moins triggerType et result)
              return entry && 
                     typeof entry === 'object' && 
                     entry.triggerType && 
                     entry.result;
            })
            .map((entry, index) => {
              // Normaliser l'entrée : garantir timestamp et id
              // Générer un timestamp si absent (utiliser Date.now() comme fallback)
              const normalizedTimestamp = entry.timestamp || Date.now() - (index * 1000);
              
              // Générer un ID stable si absent
              const normalizedId = entry.id || (() => {
                const contentHash = normalizedTimestamp && entry.triggerType && entry.result
                  ? `${normalizedTimestamp}_${entry.triggerType}_${entry.result}_${index}`
                  : `fallback_${Date.now()}_${index}`;
                return `autosync_${contentHash}`;
              })();
              
              const normalizedEntry = {
                ...entry,
                timestamp: normalizedTimestamp,
                id: normalizedId
              };
              
              return (
                <HistoryEntry key={normalizedEntry.id} entry={normalizedEntry} />
              );
            })}
        </div>
      ) : (
        <div className="text-center text-teal-100/55 py-8">
          <Clock className="w-12 h-12 mx-auto mb-2 opacity-50 text-sky-300/60" />
          <p>Aucun déclenchement AutoSync enregistré</p>
        </div>
      )}

      {/* Annonce aria-live pour les changements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {hasHistory
          ? `Historique AutoSync: ${history.length} déclenchement${history.length > 1 ? 's' : ''}`
          : 'Aucun déclenchement AutoSync enregistré'}
      </div>
    </div>
  );
}

AutoSyncHistoryView.propTypes = {
  history: PropTypes.arrayOf(PropTypes.object),
  stats: PropTypes.shape({
    total: PropTypes.number,
    byResult: PropTypes.shape({
      success: PropTypes.number,
      error: PropTypes.number,
      skipped: PropTypes.number
    })
  }),
  onRefresh: PropTypes.func
};

