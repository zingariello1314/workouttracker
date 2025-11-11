/**
 * 🔴 FIX #81-87: Composant d'export PDF
 * Permet d'exporter les données Garmin en PDF
 */
import React from 'react';
import { generateDailyPDF, generateWeeklyPDF } from '../utils/pdfGenerator';
import { ARIA_LABELS } from '../constants';
import logger from '../../../../utils/logger';
import { useGarminSelectors } from '../hooks/useGarminSelectors';
import { buildDerivedDataset } from '../utils/chartDataBuilders';

const log = logger.component('PDFExport');

export default function PDFExport({ selectedDate: selectedDateProp, periodFilter: periodFilterProp, customStartDate: customStartDateProp, customEndDate: customEndDateProp }) {
  const [isGenerating, setIsGenerating] = React.useState(false);

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

  const getDerivedDataset = React.useCallback((dates, anchorDate) => {
    return buildDerivedDataset({
      dailyMetrics,
      activities: activitiesByType,
      dates,
      anchorDate
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
      alert('Aucune donnée disponible pour l\'export');
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

      if (type === 'daily' && selectedDate) {
        const derived = getDerivedDataset([selectedDate], selectedDate);
        blob = await generateDailyPDF(baseData, selectedDate, { derived });
        log.debug(`PDF quotidien généré: ${blob ? 'OK' : 'NULL'}`);
      } else if (type === 'weekly' || type === 'custom') {
        const startDate = type === 'custom' ? customStartDate : calculateWeekStart(selectedDate || new Date().toISOString().split('T')[0]);
        const endDate = type === 'custom' ? customEndDate : calculateWeekEnd(selectedDate || new Date().toISOString().split('T')[0]);
        
        if (!startDate || !endDate) {
          alert('Dates invalides pour l\'export');
          setIsGenerating(false);
          return;
        }

        const rangeDates = enumerateDates(startDate, endDate).filter((date) => dailyMetrics[date]);
        const anchor = selectedDate && rangeDates.includes(selectedDate) ? selectedDate : rangeDates[rangeDates.length - 1];
        const derived = getDerivedDataset(rangeDates, anchor || endDate);
        blob = await generateWeeklyPDF(baseData, startDate, endDate, { derived });
        log.debug(`PDF hebdomadaire généré: ${blob ? 'OK' : 'NULL'}`);
      }

      if (!blob) {
        log.error('Blob est null - la génération a probablement échoué silencieusement');
        alert('Erreur lors de la génération du PDF. Vérifiez la console du navigateur (F12) pour plus de détails.');
        setIsGenerating(false);
        return;
      }

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
      
      alert(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [dailyMetrics, activitiesByType, selectedDate, customStartDate, customEndDate, baseData, getDerivedDataset, enumerateDates]);

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
      className="bg-slate-800/60 border border-slate-700 rounded-lg p-4"
      role="region"
      aria-label="Export PDF"
    >
      <h3 className="text-white font-semibold mb-4">📄 Export PDF</h3>

      <div className="space-y-3">
        {/* Export quotidien */}
        <button
          onClick={() => handleExport('daily')}
          disabled={isGenerating || !selectedDate}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
          aria-label={ARIA_LABELS.EXPORT_PDF || 'Exporter rapport quotidien en PDF'}
          aria-busy={isGenerating}
        >
          {isGenerating ? 'Génération...' : 'Export Quotidien'}
        </button>

        {/* Export hebdomadaire */}
        <button
          onClick={() => handleExport('weekly')}
          disabled={isGenerating}
          className="w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
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
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-md font-medium transition-colors"
            aria-label="Exporter période personnalisée en PDF"
            aria-busy={isGenerating}
          >
            {isGenerating ? 'Génération...' : 'Export Période Personnalisée'}
          </button>
        )}
      </div>

      <p className="text-slate-400 text-xs mt-4">
        💡 Les rapports PDF incluent toutes les métriques et activités de la période sélectionnée.
      </p>
    </div>
  );
}

