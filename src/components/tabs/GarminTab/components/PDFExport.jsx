/**
 * 🔴 FIX #81-87: Composant d'export PDF
 * Permet d'exporter les données Garmin en PDF
 */
import React from 'react';
import { generateDailyPDF, generateWeeklyPDF } from '../utils/pdfGenerator';
import { ARIA_LABELS } from '../constants';

export default function PDFExport({ garminData, selectedDate, periodFilter, customStartDate, customEndDate }) {
  const [isGenerating, setIsGenerating] = React.useState(false);

  /**
   * Génère et télécharge le PDF
   */
  const handleExport = React.useCallback(async (type) => {
    if (!garminData) {
      alert('Aucune donnée disponible pour l\'export');
      return;
    }

    setIsGenerating(true);
    try {
      let blob = null;

      console.log('[PDFExport] ===== DÉBUT EXPORT PDF =====');
      console.log('[PDFExport] Type:', type);
      console.log('[PDFExport] selectedDate:', selectedDate);
      console.log('[PDFExport] garminData structure:', {
        hasActivities: !!garminData.activities,
        hasDailyMetrics: !!garminData.dailyMetrics,
        dailyMetricsKeys: garminData.dailyMetrics ? Object.keys(garminData.dailyMetrics) : [],
        activitiesCount: {
          swimming: garminData.activities?.swimming?.length || 0,
          jumpRope: garminData.activities?.jumpRope?.length || 0,
          cardio: garminData.activities?.cardio?.length || 0
        }
      });
      
      // Vérifier si la date existe
      if (type === 'daily' && selectedDate) {
        if (garminData.dailyMetrics && garminData.dailyMetrics[selectedDate]) {
          console.log('[PDFExport] Données trouvées pour', selectedDate, ':', garminData.dailyMetrics[selectedDate]);
        } else {
          console.warn('[PDFExport] ⚠️ AUCUNE donnée pour la date', selectedDate);
          console.log('[PDFExport] Dates disponibles:', Object.keys(garminData.dailyMetrics || {}));
        }
      }

      if (type === 'daily' && selectedDate) {
        blob = await generateDailyPDF(garminData, selectedDate);
        console.log('[PDFExport] PDF quotidien généré, blob:', blob ? 'OK' : 'NULL');
      } else if (type === 'weekly' || type === 'custom') {
        const startDate = type === 'custom' ? customStartDate : calculateWeekStart(selectedDate || new Date().toISOString().split('T')[0]);
        const endDate = type === 'custom' ? customEndDate : calculateWeekEnd(selectedDate || new Date().toISOString().split('T')[0]);
        
        if (!startDate || !endDate) {
          alert('Dates invalides pour l\'export');
          setIsGenerating(false);
          return;
        }

        blob = await generateWeeklyPDF(garminData, startDate, endDate);
        console.log('[PDFExport] PDF hebdomadaire généré, blob:', blob ? 'OK' : 'NULL');
      }

      if (!blob) {
        console.error('[PDFExport] Blob est null - la génération a probablement échoué silencieusement');
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
      console.error('[PDFExport] Erreur export:', error);
      console.error('[PDFExport] Stack:', error.stack);
      
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
  }, [garminData, selectedDate, customStartDate, customEndDate]);

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

