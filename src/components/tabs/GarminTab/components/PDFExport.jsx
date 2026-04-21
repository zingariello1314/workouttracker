/**
 * 🔴 FIX #81-87: Composant d'export PDF
 * Permet d'exporter les données Garmin en PDF
 */
import React from 'react';
import { generateDailyPDF, generateWeeklyPDF } from '../utils/pdfGenerator';
import { ARIA_LABELS } from '../constants';
import logger from '../../../../utils/logger';
import { useGarminSelectors } from '../hooks/useGarminSelectors';
import { useGarminDerivedDataset, getDerivedDatasetSync } from '../hooks/useGarminDerivedDataset';
import {
  getUIMetricsSnapshot,
  serializeUIMetricsSnapshot
} from '../utils/uiMetricsStore';
import { loadTelemetryHistory } from '../../../../hooks/garminTelemetryHistory';
import { useToast } from './Toast';
import { isBrowser, getWindow } from '../../../../utils/isBrowser';

const log = logger.component('PDFExport');

export default function PDFExport({ selectedDate: selectedDateProp, periodFilter: periodFilterProp, customStartDate: customStartDateProp, customEndDate: customEndDateProp }) {
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { showToast, ToastContainer } = useToast();

  const {
    allDailyMetrics: dailyMetrics,
    activitiesByType,
    selectedDate: selectedDateContext,
    periodFilter: periodFilterContext,
    customRange
  } = useGarminSelectors();

  const selectedDate = selectedDateProp || selectedDateContext;
  const periodFilter = periodFilterProp || periodFilterContext;
  const customStartDate = customStartDateProp || customRange?.start;
  const customEndDate = customEndDateProp || customRange?.end;

  const baseData = React.useMemo(() => ({
    dailyMetrics,
    activities: activitiesByType
  }), [dailyMetrics, activitiesByType]);

  // Utiliser le hook centralisé pour le dataset par défaut (dates filtrées actuelles)
  const defaultDerivedDataset = useGarminDerivedDataset({
    dates: null, // Utilise les dates filtrées par défaut
    anchorDate: selectedDate,
    displayInfo: null // Utilise displayInfo par défaut
  });

  // Fonction pour obtenir un dataset dérivé pour des dates/ancrage spécifiques
  // (utilisée pour les exports hebdomadaires avec plages personnalisées)
  // Note: getDerivedDatasetSync est maintenant async, donc getDerivedDataset aussi
  const getDerivedDataset = React.useCallback(async (dates, anchorDate) => {
    // Utiliser la version sync qui partage le même cache que le hook
    return await getDerivedDatasetSync({
      dailyMetrics,
      activities: activitiesByType,
      dates,
      anchorDate,
      displayInfo: null,
      colors: null // Les couleurs ne sont pas critiques pour les exports
    });
  }, [dailyMetrics, activitiesByType]);

  const enumerateDates = React.useCallback((start, end) => {
    if (!start || !end) return [];
    const result = [];
    const cursor = new Date(start);
    const endDate = new Date(end);
    while (cursor <= endDate) {
      result.push(cursor.toISOString().split('T')[0]);
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, []);

  /**
   * Génère et télécharge le PDF
   */
  const handleExport = React.useCallback(async (type) => {
    if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
      showToast('ℹ️ Aucune donnée disponible pour l\'export', 'info', 3000);
      return;
    }

    setIsGenerating(true);
    try {
      let blob = null;

      log.debug(`Début export PDF - Type: ${type}`);
      log.debug('Structure des données (base):', {
        dates: Object.keys(dailyMetrics || {}),
        activities: {
          swimming: activitiesByType?.swimming?.length || 0,
          jumpRope: activitiesByType?.jumpRope?.length || 0,
          cardio: activitiesByType?.cardio?.length || 0
        }
      });
      
      if (type === 'daily' && selectedDate) {
        if (dailyMetrics[selectedDate]) {
          log.debug(`Données trouvées pour ${selectedDate}`);
        } else {
          log.warn(`Aucune donnée pour la date ${selectedDate}`);
          log.debug('Dates disponibles:', Object.keys(dailyMetrics || {}));
        }
      }

      // ✅ Item 16 : Utiliser isBrowser() et getWindow() pour vérifications centralisées
      const win = getWindow();
      const telemetryStore =
        isBrowser() && win.__GARMIN_OBSERVABILITY__
          ? win.__GARMIN_OBSERVABILITY__
          : null;
      const telemetryHistory = await loadTelemetryHistory(10);
      const telemetryMeta = {
        sessionId: telemetryStore?.sessionId ?? null,
        schemaVersion: telemetryStore?.schemaVersion ?? null,
        lastUpdate: telemetryStore?.lastUpdate ?? null,
        lastPush: telemetryStore?.lastPush ?? null,
        lastPushStatus: telemetryStore?.lastPushStatus ?? null,
        lastPushError: telemetryStore?.lastPushError ?? null,
        pendingPush: Boolean(telemetryStore?.pendingPush),
        history: telemetryHistory
      };

      const uiTelemetry = serializeUIMetricsSnapshot(
        getUIMetricsSnapshot(),
        { historyLimit: 10, renderHistoryLimit: 10 }
      );

      if (type === 'daily' && selectedDate) {
        const derived = await getDerivedDataset([selectedDate], selectedDate);
        blob = await generateDailyPDF(baseData, selectedDate, { derived, uiTelemetry, telemetry: telemetryMeta });
        log.debug(`PDF quotidien généré: ${blob ? 'OK' : 'NULL'}`);
      } else if (type === 'weekly' || type === 'custom') {
        const startDate = type === 'custom' ? customStartDate : calculateWeekStart(selectedDate || new Date().toISOString().split('T')[0]);
        const endDate = type === 'custom' ? customEndDate : calculateWeekEnd(selectedDate || new Date().toISOString().split('T')[0]);
        
        if (!startDate || !endDate) {
          showToast('❌ Dates invalides pour l\'export', 'error', 3000);
          setIsGenerating(false);
          return;
        }

        const rangeDates = enumerateDates(startDate, endDate).filter((date) => dailyMetrics[date]);
        const anchor = selectedDate && rangeDates.includes(selectedDate) ? selectedDate : rangeDates[rangeDates.length - 1];
        const derived = await getDerivedDataset(rangeDates, anchor || endDate);
        blob = await generateWeeklyPDF(baseData, startDate, endDate, { derived, uiTelemetry, telemetry: telemetryMeta });
        log.debug(`PDF hebdomadaire généré: ${blob ? 'OK' : 'NULL'}`);
      }

      if (!blob) {
        log.error('Blob est null - la génération a probablement échoué silencieusement');
        showToast('❌ Erreur lors de la génération du PDF. Vérifiez la console du navigateur (F12) pour plus de détails.', 'error', 5000);
        setIsGenerating(false);
        return;
      }

      // Succès
      showToast('✅ PDF généré et téléchargé avec succès', 'success', 3000);

      // Télécharger le fichier
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `garmin-report-${type}-${selectedDate || new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      log.error('Erreur export PDF:', error);
      
      let errorMessage = 'Erreur lors de l\'export PDF';
      if (error.message) {
        errorMessage += ': ' + error.message;
      }
      
      // Messages spécifiques selon l'erreur
      if (error.message && error.message.includes('jsPDF')) {
        errorMessage += '\n\nVérifiez que jspdf est bien installé:\nnpm install jspdf';
      }
      
      showToast(`❌ ${errorMessage}`, 'error', 6000);
    } finally {
      setIsGenerating(false);
    }
  }, [dailyMetrics, activitiesByType, selectedDate, customStartDate, customEndDate, baseData, getDerivedDataset, enumerateDates, showToast]);

  /**
   * Calcule le début de la semaine (lundi)
   */
  const calculateWeekStart = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Lundi
    const monday = new Date(date.setDate(diff));
    return monday.toISOString().split('T')[0];
  };

  /**
   * Calcule la fin de la semaine (dimanche)
   */
  const calculateWeekEnd = (dateStr) => {
    const date = new Date(dateStr);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? 0 : 7); // Dimanche
    const sunday = new Date(date.setDate(diff));
    return sunday.toISOString().split('T')[0];
  };

  return (
    <div 
      className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4 shadow-md shadow-black/40"
      role="region"
      aria-label="Export PDF"
    >
      <h3 className="text-teal-100 font-semibold mb-4">📄 Export PDF</h3>

      <div className="space-y-3">
        {/* Export quotidien */}
        <button
          onClick={() => handleExport('daily')}
          disabled={isGenerating || !selectedDate}
          className="w-full px-4 py-2.5 rounded-lg border border-[#0F5C45]/70 bg-[#0F4C5C]/40 text-teal-100 font-medium hover:bg-[#0F4C5C]/55 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label={ARIA_LABELS.EXPORT_PDF || 'Exporter rapport quotidien en PDF'}
          aria-busy={isGenerating}
        >
          {isGenerating ? 'Génération...' : 'Export Quotidien'}
        </button>

        {/* Export hebdomadaire */}
        <button
          onClick={() => handleExport('weekly')}
          disabled={isGenerating}
          className="w-full px-4 py-2.5 rounded-lg border border-[#0F4C5C]/60 bg-black text-teal-100 font-medium hover:bg-teal-950/25 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Exporter rapport hebdomadaire en PDF"
          aria-busy={isGenerating}
        >
          {isGenerating ? 'Génération...' : 'Export Hebdomadaire'}
        </button>

        {/* Export personnalisé */}
        {periodFilter === 'custom' && customStartDate && customEndDate && (
          <button
            onClick={() => handleExport('custom')}
            disabled={isGenerating}
            className="w-full px-4 py-2.5 rounded-lg border border-sky-500/40 bg-black text-sky-200 font-medium hover:bg-sky-950/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Exporter période personnalisée en PDF"
            aria-busy={isGenerating}
          >
            {isGenerating ? 'Génération...' : 'Export Période Personnalisée'}
          </button>
        )}
      </div>

      <p className="text-teal-100/50 text-xs mt-4">
        💡 Les rapports PDF incluent toutes les métriques et activités de la période sélectionnée.
      </p>
      <ToastContainer />
    </div>
  );
}

