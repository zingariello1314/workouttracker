import React from 'react';
import { AlertCircle } from 'lucide-react';
import { ARIA_LABELS } from '../constants';
import GarminInfoMessage from './GarminInfoMessage'; // ✅ PHASE 5.3 : Message informatif
import ForceSyncMenu from './sync/ForceSyncMenu';
import { describeRange } from './sync/forceSyncUtils';
import { collectDiagnosticsSnapshot } from '../utils/diagnosticsCollector';
import { useConfirmDialog } from './modals/ConfirmDialog';
import { useToast } from './Toast';
import telemetryEvents from '../utils/telemetryEvents';
import { isBrowser, getWindow, hasDispatchEvent, hasCustomEvent } from '../../../../utils/isBrowser';
import { useTranslation } from '../../../../utils/translations';
import { useLanguage } from '../../../../context/LanguageContext';

/**
 * Composant pour les contrôles de synchronisation Garmin
 */
export default function SyncControls({
  status,
  loading,
  syncNow,
  backfill, // backfill est maintenant une fonction sans paramètres (handleBackfill de GarminTab)
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  fetchStatus,
  deleteMockActivities, // 🔴 NOUVEAU : Fonction pour supprimer les activités mock
  clearCache, // 🔴 NOUVEAU : Fonction pour vider le cache frontend
  onOpenDebug, // ✅ PHASE 1 : Fonction pour ouvrir le panneau de diagnostic
  garminData, // ✅ PHASE 5.3 : Données Garmin pour message informatif
  onConfigureDelay, // ✅ PHASE 5.3 : Fonction pour ouvrir paramètres de délai
  forcedRangesHistory = [],
  onClearForcedHistory = null,
  onRefreshForcedHistory = null,
  cacheMeta = null,
  onResetCircuit = () => {},
  setForcedRangesHistory = () => {},
  setLastSourceMeta = () => {},
  historyLimit = 200
}) {
  const [deletingMocks, setDeletingMocks] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const debugShortcutHintId = React.useId();
  const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
  const { showToast, ToastContainer } = useToast();
  const t = useTranslation();
  const { language } = useLanguage();

  const panelClass =
    'rounded-xl border-2 border-[#0F4C5C]/60 bg-black p-4 shadow-md shadow-black/40';
  const btnPrimary =
    'rounded-lg border-2 border-[#0F5C45]/60 bg-[#0F5C45]/30 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-black/30 transition hover:bg-[#0F5C45]/45 disabled:cursor-not-allowed disabled:opacity-50';
  const btnGhost =
    'rounded-lg border-2 border-[#0F4C5C]/55 bg-black px-3 py-2 text-sm font-medium text-teal-100 transition hover:border-[#0F5C45]/60 hover:bg-[#0F4C5C]/15 disabled:cursor-not-allowed disabled:opacity-50';

  const lastForcedRange = forcedRangesHistory?.[0] || null;
  // ✅ Utiliser la locale appropriée selon la langue sélectionnée
  const locale = language === 'en' ? 'en-US' : 'fr-FR';
  const dateFormatter = React.useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'short' }), [locale]);
  const dateTimeFormatter = React.useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }), [locale]);

  const lastRangeDescriptor = React.useMemo(() => {
    if (!lastForcedRange) return null;
    const range = { start: lastForcedRange.start, end: lastForcedRange.end };
    return describeRange(range, lastForcedRange.includeToday);
  }, [lastForcedRange]);

  const formatRangeLabel = React.useCallback((entry) => {
    if (!entry) return '—';
    const descriptor = describeRange({ start: entry.start, end: entry.end }, entry.includeToday);
    const startLabel = (() => {
      try {
        return dateFormatter.format(new Date(`${entry.start}T00:00:00`));
      } catch {
        return entry.start;
      }
    })();
    const endLabel = (() => {
      try {
        return dateFormatter.format(new Date(`${entry.end}T00:00:00`));
      } catch {
        return entry.end;
      }
    })();
    if (startLabel === endLabel) {
      return `${startLabel} (${descriptor?.spanDays || 1} jour${(descriptor?.spanDays || 1) > 1 ? 's' : ''})`;
    }
    return `${startLabel} → ${endLabel} (${descriptor?.spanDays || '?'} jours)`;
  }, [dateFormatter]);
  
  const handleDeleteMocks = async () => {
    const confirmed = await showConfirm({
      title: 'Supprimer les données de test',
      message: 'Supprimer toutes les données de test (mock) : activités ET métriques quotidiennes ?\n\nCette action est irréversible.\n\nAprès suppression, une synchronisation sera effectuée pour récupérer vos vraies données.',
      variant: 'danger',
      confirmLabel: 'Supprimer',
      cancelLabel: 'Annuler'
    });

    if (!confirmed) {
      return;
    }

    setDeletingMocks(true);
    try {
      const result = await deleteMockActivities();
      const total = result.activities + result.metrics;
      
      // 🔴 FIX : Vider le cache frontend après suppression
      if (window.clearFrontendCache) {
        window.clearFrontendCache();
      }
      
      // 🔴 FIX : Forcer une synchronisation après suppression pour récupérer les vraies données
      if (total > 0) {
        showToast(
          `✅ ${result.activities} activité(s) et ${result.metrics} métrique(s) mock supprimée(s) (${total} au total).\n\nSynchronisation en cours pour récupérer vos vraies données...`,
          'success',
          5000
        );
        // Forcer une sync sans cache
        if (syncNow) {
          await syncNow({ forceRefresh: true, skipDelay: true }); // forceRefresh = true, pas de délai
        }
      } else {
        showToast('ℹ️ Aucune donnée mock trouvée. Vos données sont déjà propres.', 'info', 3000);
      }
      
      // Recharger la page pour voir les changements
      window.location.reload();
    } catch (err) {
      console.error('Error deleting mock data:', err);
      showToast('❌ Erreur lors de la suppression des données mock', 'error', 5000);
    } finally {
      setDeletingMocks(false);
    }
  };
  
  const formatTimestamp = React.useCallback((iso) => {
    if (!iso) return '—';
    try {
      return dateTimeFormatter.format(new Date(iso));
    } catch {
      return iso;
    }
  }, [dateTimeFormatter]);

  const formatDuration = React.useCallback((ms) => {
    if (ms === null || ms === undefined) return null;
    const seconds = Math.max(0, Math.round(Number(ms) / 1000));
    if (!Number.isFinite(seconds)) return null;
    if (seconds >= 60) {
      const minutes = (seconds / 60).toFixed(seconds >= 600 ? 0 : 1);
      return `${minutes} min`;
    }
    return `${seconds}s`;
  }, []);

  const cacheMetaEntries = React.useMemo(() => {
    if (!cacheMeta) return [];
    const entries = [];
    if (cacheMeta.timestamp) {
      entries.push([t('garmin.sync.cache.timestamp'), formatTimestamp(cacheMeta.timestamp)]);
    }
    if (cacheMeta.lastSyncTimestamp) {
      entries.push(['LastSync', formatTimestamp(cacheMeta.lastSyncTimestamp)]);
    }
    if (cacheMeta.baseUrl) {
      entries.push(['Base URL', cacheMeta.baseUrl]);
    }
    if (cacheMeta.ttlMs !== undefined && cacheMeta.ttlMs !== null) {
      const formatted = formatDuration(cacheMeta.ttlMs);
      if (formatted) {
        entries.push(['TTL restant', formatted]);
      }
    }
    if (cacheMeta.cacheKey) {
      entries.push([t('garmin.sync.cache.key'), cacheMeta.cacheKey]);
    }
    if (cacheMeta.ageSeconds !== undefined && cacheMeta.ageSeconds !== null) {
      entries.push(['Âge', `${cacheMeta.ageSeconds}s`]);
    }
    if (cacheMeta.cooldownMs !== undefined && cacheMeta.cooldownMs !== null) {
      const formattedCooldown = formatDuration(cacheMeta.cooldownMs);
      if (formattedCooldown) {
        entries.push(['Cooldown', formattedCooldown]);
      }
    }
    if (cacheMeta.failureCount !== undefined && cacheMeta.failureCount !== null) {
      entries.push([t('garmin.sync.cache.failures'), cacheMeta.failureCount]);
    }
    return entries.map(([label, value]) => {
      let formattedValue = value;
      if (typeof value === 'string' && value.length > 48) {
        formattedValue = `${value.slice(0, 48)}…`;
      }
      return [label, formattedValue];
    });
  }, [cacheMeta, formatTimestamp, formatDuration, t]);
 
  // ✅ Item 16 : Utiliser isBrowser() et getWindow() pour vérifications centralisées
  const cacheStats = React.useMemo(() => {
    if (!isBrowser()) return null;
    const win = getWindow();
    return win.__GARMIN_CACHE_STATS__ || null;
  }, [cacheMeta]);
  const latestCacheEvents = React.useMemo(() => {
    if (!cacheStats?.history?.length) return [];
    return [...cacheStats.history].slice(-3).reverse();
  }, [cacheStats]);

  const handleExportHistory = React.useCallback(() => {
    const payload = collectDiagnosticsSnapshot({
      cacheMeta,
      forcedRangesHistory: forcedRangesHistory.slice(0, historyLimit),
      options: {
        includeServer: false,
        historyLimit: 20,
        renderHistoryLimit: 20
      }
    });

    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `garmin-history-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
      } catch (error) {
        console.error('[SyncControls] Export history failed:', error);
        showToast(t('garmin.sync.error.history'), 'error', 5000);
      }
  }, [cacheMeta, forcedRangesHistory, historyLimit, showToast]);

  const handleImportHistory = React.useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        if (Array.isArray(parsed.forcedRangesHistory)) {
          setForcedRangesHistory(parsed.forcedRangesHistory);
        }

        if (parsed.cacheMeta) {
          setLastSourceMeta(parsed.cacheMeta);
        }

        // ✅ Item 16 : Utiliser isBrowser() et getWindow() pour vérifications centralisées
        if (parsed.cacheStats && isBrowser()) {
          const win = getWindow();
          win.__GARMIN_CACHE_STATS__ = parsed.cacheStats;
        }

        if (parsed.networkStats && isBrowser()) {
          const win = getWindow();
          win.__GARMIN_NETWORK_STATS__ = parsed.networkStats;
          // ✅ Tâche 10 : Utiliser le système d'événements uniformisé
          if (telemetryEvents && typeof telemetryEvents.networkUpdate === 'function') {
            telemetryEvents.networkUpdate(parsed.networkStats, { source: 'SyncControls' });
          } else {
            // Fallback
            if (hasDispatchEvent() && hasCustomEvent()) {
              win.dispatchEvent(new CustomEvent('garmin-network-update', { detail: parsed.networkStats }));
            }
          }
        }

        if (parsed.uiMetrics && isBrowser()) {
          const win = getWindow();
          win.__GARMIN_UI_METRICS__ = parsed.uiMetrics;
          // ✅ Tâche 10 : Utiliser le système d'événements uniformisé
          if (telemetryEvents && typeof telemetryEvents.uiMetricsUpdate === 'function') {
            telemetryEvents.uiMetricsUpdate(parsed.uiMetrics, { source: 'SyncControls' });
          } else {
            // Fallback
            if (hasDispatchEvent() && hasCustomEvent()) {
              win.dispatchEvent(new CustomEvent('garmin-ui-metrics-update', { detail: parsed.uiMetrics }));
            }
          }
        }

        showToast('✅ Snapshot diagnostic importé. Les données ont été rechargées pour analyse.', 'success', 4000);
      } catch (error) {
        console.error('[SyncControls] Import history failed:', error);
        showToast('❌ Import impossible : fichier invalide ou corrompu.', 'error', 5000);
      } finally {
        event.target.value = '';
      }
    },
    [setForcedRangesHistory, setLastSourceMeta, showToast]
  );

  const statusAnnouncement = React.useMemo(() => {
    if (!status) {
      return 'Statut de synchronisation inconnu.';
    }
    const base = status.ok ? 'Synchronisation disponible.' : `Synchronisation indisponible: ${status.message || 'erreur inconnue'}.`;
    const lastSync = status.lastSync
      ? `Dernière synchronisation le ${new Date(status.lastSync).toLocaleString('fr-FR')}.`
      : '';
    const source = cacheMeta?.source ? `Source actuelle des données: ${cacheMeta.source}.` : '';
    const degraded = cacheMeta?.degraded ? 'Mode dégradé actif.' : '';
    return [base, lastSync, source, degraded].filter(Boolean).join(' ');
  }, [status, cacheMeta]);
 
  return (
    <div className="mb-6 space-y-4">
      {/* Statut */}
      <div className={panelClass}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold text-white">Statut</h3>
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className={`${btnGhost} px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Actualiser
          </button>
        </div>
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {statusAnnouncement}
        </div>
        {/* ✅ Tâche 13 : Annonce aria-live pour AutoSync */}
        <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" id="autosync-announcement" />
        <div className="text-sm" aria-live="polite" aria-atomic="true">
          <div className={`${status?.ok ? 'text-green-400' : 'text-red-400'}`}>
            Statut: {status?.ok ? 'Disponible' : status?.message || 'Indisponible'}
          </div>
          {status?.lastSync && (
            <div className="text-teal-700 mt-1">
              Dernière sync: {new Date(status.lastSync).toLocaleString('fr-FR')}
            </div>
          )}
          {/* 🟡 FIX #16: Erreurs affichées clairement avec bouton Réessayer */}
          {status?.error && (
            <div className="mt-3 bg-red-900/30 border border-red-500/50 rounded-lg p-3" role="alert" aria-live="assertive">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-red-300 font-medium text-sm mb-1">Erreur de synchronisation</p>
                  <p className="text-red-400 text-xs mb-2">{status.error}</p>
                  <p className="text-red-400/70 text-xs">
                    Vérifiez que le serveur Garmin est démarré (port 3031 ou 3001).
                    <br />
                    Assurez-vous que les identifiants Garmin sont corrects dans le fichier .env
                  </p>
                </div>
                <button
                  type="button"
                  onClick={syncNow}
                  disabled={loading}
                  className={`${btnPrimary} whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  {loading ? 'En cours...' : 'Réessayer'}
                </button>
              </div>
            </div>
          )}
          
          {/* ✅ PHASE 5.3 : Message informatif pour délais Garmin */}
          <GarminInfoMessage
            status={status}
            garminData={garminData}
            onRetry={() => syncNow({ forceRefresh: false, skipDelay: true })}
            onConfigureDelay={onConfigureDelay}
          />

          {cacheMeta && (
            <div className="mt-3 rounded-lg border border-[#0F4C5C]/50 bg-black p-3 text-xs text-teal-100">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white bg-[#0F4C5C]/40">
                  {cacheMeta.source ? cacheMeta.source : 'N/A'}
                </span>
                {cacheMeta.degraded && (
                  <span className="px-2 py-0.5 rounded bg-orange-900/40 border border-orange-600/40 text-orange-200 uppercase tracking-wide text-[10px]">
                    Mode dégradé
                  </span>
                )}
                {cacheMeta.circuit === 'closed' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-900/40 border border-emerald-600/40 text-emerald-200 uppercase tracking-wide text-[10px]">
                    Circuit OK
                  </span>
                )}
                {cacheMeta.circuit === 'open' && (
                  <span className="px-2 py-0.5 rounded bg-red-900/40 border border-red-600/40 text-red-200 uppercase tracking-wide text-[10px]">
                    Circuit ouvert
                  </span>
                )}
                {cacheMeta.circuit === 'half-open' && (
                  <span className="px-2 py-0.5 rounded bg-yellow-900/40 border border-yellow-600/40 text-yellow-200 uppercase tracking-wide text-[10px]">
                    Circuit test
                  </span>
                )}
              </div>
              {cacheMeta.circuit === 'open' && (
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={onResetCircuit}
                    className="px-3 py-1 text-[11px] bg-red-700 hover:bg-red-600 text-white rounded"
                  >
                    Réinitialiser le circuit
                  </button>
                  {typeof cacheMeta.cooldownMs === 'number' && cacheMeta.cooldownMs > 0 && (
                    <span className="text-teal-700 text-[11px]">
                      Nouvel essai auto dans {formatDuration(cacheMeta.cooldownMs)}
                    </span>
                  )}
                </div>
              )}
              {cacheMetaEntries.length > 0 && (
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {cacheMetaEntries.map(([label, value]) => (
                    <React.Fragment key={`${label}-${value}`}>
                      <dt className="text-teal-800 uppercase tracking-wide text-[10px]">{label}</dt>
                      <dd className="text-teal-100 text-[11px] break-words">{value}</dd>
                    </React.Fragment>
                  ))}
                </dl>
              )}
              {cacheStats && (
                <div className="mt-3 space-y-2">
                  <div>
                    <div className="uppercase tracking-wide text-teal-800 text-[10px] mb-1">Compteurs cache (session)</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(cacheStats.hits || {}).map(([source, value]) => (
                        <span
                          key={source}
                          className="px-2 py-0.5 rounded border border-[#0F4C5C]/50 bg-black text-teal-100 text-[10px] font-mono"
                        >
                          {source}:{value}
                        </span>
                      ))}
                    </div>
                  </div>
                  {latestCacheEvents.length > 0 && (
                    <div>
                      <div className="uppercase tracking-wide text-teal-800 text-[10px] mb-1">Derniers hits</div>
                      <ul className="space-y-1">
                        {latestCacheEvents.map((event, index) => (
                          <li
                            key={`${event.timestamp}-${event.source}-${index}`}
                            className="border border-[#0F4C5C]/40 bg-black/80 rounded px-2 py-1 text-teal-200 text-[11px]"
                          >
                            <div className="flex justify-between">
                              <span className="uppercase tracking-wide text-teal-800">{event.source}</span>
                              <span className="text-teal-800 font-mono">{formatTimestamp(event.timestamp)}</span>
                            </div>
                            {(event.startDate || event.endDate) && (
                              <div className="text-teal-700">
                                {event.startDate || '—'} → {event.endDate || '—'}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Synchronisation */}
      <div className={panelClass}>
        <h3 className="text-white font-semibold mb-3">Synchronisation</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => syncNow({ forceRefresh: false, skipDelay: true })}
            disabled={loading}
            aria-label={ARIA_LABELS.SYNC_BUTTON}
            aria-busy={loading}
            aria-disabled={loading}
            className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {loading ? 'Synchronisation...' : 'Synchroniser'}
          </button>
          <ForceSyncMenu
            loading={loading}
            onSync={(request) => syncNow(request)}
            lastForcedRange={lastForcedRange}
          />
        </div>
        <p className="mt-2 text-xs text-teal-700">
          <span className="text-sky-300">Synchroniser</span> : Utilise le cache si disponible (plus rapide).
          <br />
          <span className="text-teal-200">Forcer</span> : Bypass tous les caches pour récupérer les données les plus récentes.
        </p>
      </div>

      {/* Historique des forçages */}
      <div className={panelClass}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold">Historique des forçages</h3>
          <div className="flex items-center gap-2 text-xs">
            {onRefreshForcedHistory && (
              <button
                type="button"
                onClick={onRefreshForcedHistory}
                disabled={loading}
                className={`rounded px-3 py-1 ${
                  loading
                    ? 'cursor-not-allowed border border-[#0F4C5C]/30 bg-black text-teal-800'
                    : `${btnGhost} py-1`
                }`}
              >
                Rafraîchir
              </button>
            )}
            <button
              type="button"
              onClick={handleExportHistory}
              disabled={loading}
              className={`rounded px-3 py-1 ${
                loading
                  ? 'cursor-not-allowed border border-[#0F4C5C]/30 bg-black text-teal-800'
                  : 'border-2 border-[#0F5C45]/50 bg-[#0F5C45]/25 text-white hover:bg-[#0F5C45]/40'
              }`}
            >
              Export JSON
            </button>
            <label
              className={`cursor-pointer rounded px-3 py-1 ${
                loading
                  ? 'cursor-not-allowed border border-[#0F4C5C]/30 bg-black text-teal-800'
                  : `${btnPrimary} py-1`
              }`}
            >
              Import JSON
              <input
                type="file"
                accept="application/json"
                onChange={handleImportHistory}
                className="hidden"
                disabled={loading}
              />
            </label>
            {onClearForcedHistory && forcedRangesHistory.length > 0 && (
              <button
                type="button"
                onClick={onClearForcedHistory}
                disabled={loading}
                className={`rounded px-3 py-1 ${
                  loading
                    ? 'cursor-not-allowed border border-[#0F4C5C]/30 bg-black text-teal-800'
                    : 'border-2 border-red-600/60 bg-red-900/30 text-red-100 hover:bg-red-900/50'
                }`}
              >
                Vider
              </button>
            )}
          </div>
        </div>

        {forcedRangesHistory.length === 0 ? (
          <p className="text-sm text-teal-700">
            Aucun forçage enregistré pour le moment. Utilise le menu « Forcer » pour recalculer une plage de dates.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-teal-100 space-y-1">
              <div>
                <span className="text-teal-700">Dernier forçage&nbsp;:</span>{' '}
                <span className="font-medium">{formatTimestamp(lastForcedRange.triggeredAt)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded border border-[#0F5C45]/40 bg-[#0F4C5C]/25 px-2 py-0.5 text-xs uppercase tracking-wide text-sky-200">
                  {lastForcedRange.mode || 'personnalisé'}
                </span>
                <span className="text-teal-200">{formatRangeLabel(lastForcedRange)}</span>
                {lastRangeDescriptor?.spanDays && (
                  <span className="text-teal-800">
                    {lastRangeDescriptor.spanDays} jour{lastRangeDescriptor.spanDays > 1 ? 's' : ''}
                  </span>
                )}
                {lastForcedRange.cachePurge?.removedFiles > 0 && (
                  <span className="text-amber-300">
                    Cache serveur purgé ({lastForcedRange.cachePurge.removedFiles})
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHistory((prev) => !prev)}
              className="text-xs text-teal-200 underline underline-offset-4"
            >
              {showHistory ? 'Masquer' : 'Afficher'} les {Math.min(historyLimit, forcedRangesHistory.length)} dernières entrées
            </button>

            {showHistory && (
              <ul className="mt-2 divide-y divide-[#0F4C5C]/30 text-xs text-teal-200">
            {forcedRangesHistory.slice(0, historyLimit).map((entry) => {
                  const key = entry.id || `${entry.triggeredAt}-${entry.mode || 'custom'}-${entry.start}`;
                  return (
                    <li key={key} className="py-2 flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-3">
                      <span className="font-medium text-white">{formatTimestamp(entry.triggeredAt)}</span>
                      <span className="text-teal-700">
                        {entry.mode || 'personnalisé'} • {formatRangeLabel(entry)}
                      </span>
                      <span className="text-teal-800">
                        {entry.activitiesCount || 0} activité{(entry.activitiesCount || 0) > 1 ? 's' : ''} • {entry.metricsCount || 0} jour{(entry.metricsCount || 0) > 1 ? 's' : ''}
                      </span>
                    </li>
                  );
                })}
                {forcedRangesHistory.length > historyLimit && (
                  <li className="py-2 text-teal-800 italic">
                    … {forcedRangesHistory.length - 5} entrée{forcedRangesHistory.length - 5 > 1 ? 's' : ''} supplémentaire{forcedRangesHistory.length - 5 > 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Backfill */}
      <div className={panelClass}>
        <h3 className="text-white font-semibold mb-3">Backfill (Plage de dates)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-teal-700 text-sm mb-1">Date début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#0F4C5C]/55 bg-black text-white"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-teal-700 text-sm mb-1">Date fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded border border-[#0F4C5C]/55 bg-black text-white"
              disabled={loading}
            />
          </div>
        </div>
        <button
          type="button"
          onClick={backfill}
          disabled={loading || !startDate || !endDate}
          aria-label={ARIA_LABELS.BACKFILL_BUTTON}
          aria-busy={loading}
          aria-disabled={loading || !startDate || !endDate}
          className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Backfill
        </button>
      </div>

      {/* 🔴 NOUVEAU : Nettoyage des données mock */}
      {deleteMockActivities && (
        <div className={panelClass}>
          <h3 className="text-white font-semibold mb-3">Nettoyage des données</h3>
          <p className="text-teal-700 text-xs mb-3">
            Supprime toutes les données de test (mock) : activités ET métriques quotidiennes qui ont pu être créées lors de tests sans identifiants Garmin configurés.
            <br />
            <span className="text-sky-300">⚠️ Après suppression, une synchronisation sera effectuée pour récupérer vos vraies données.</span>
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDeleteMocks}
              disabled={deletingMocks || loading}
              className={`${btnPrimary} border-red-600/50 bg-red-950/40 hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {deletingMocks ? 'Suppression...' : 'Supprimer toutes les données mock'}
            </button>
            {clearCache && (
              <button
                onClick={() => {
                  clearCache();
                  showToast('✅ Cache frontend vidé. Une nouvelle synchronisation récupérera les données fraîches.', 'success', 4000);
                }}
                disabled={loading}
                className={`rounded-md px-4 py-2 text-sm text-white ${
                  loading ? 'cursor-not-allowed bg-black/50 text-teal-800' : `${btnPrimary}`
                }`}
              >
                Vider le cache
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ PHASE 1 : Bouton pour ouvrir le panneau de diagnostic */}
      {onOpenDebug && (
        <div className={panelClass}>
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-sky-400" />
            Diagnostic
          </h3>
          <p className="text-teal-700 text-xs mb-3">
            Ouvrez le panneau de diagnostic pour comprendre le comportement de la synchronisation, 
            voir l'état du cache et analyser les timestamps.
          </p>
          <button
            onClick={onOpenDebug}
            aria-describedby={debugShortcutHintId}
            className={`${btnPrimary} flex items-center gap-2`}
          >
            <AlertCircle className="w-4 h-4" />
            Ouvrir le panneau de diagnostic
          </button>
          <p id={debugShortcutHintId} className="text-teal-800 text-xs mt-2">
            Raccourci clavier : <kbd className="font-mono">Ctrl</kbd> +{' '}
            <kbd className="font-mono">Maj</kbd> + <kbd className="font-mono">D</kbd>
          </p>
        </div>
      )}
      <ConfirmDialogComponent />
      <ToastContainer />
    </div>
  );
}

