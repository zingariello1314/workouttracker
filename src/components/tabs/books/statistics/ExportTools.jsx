/**
 * ExportTools Component
 * 
 * Composant pour l'export et le partage des statistiques de lecture.
 * Permet l'export PDF avec graphiques, export CSV des données brutes,
 * et partage de graphiques individuels.
 * 
 * @see Requirements 7.5, 10.4
 */

import React, { useState, useRef } from 'react';
import { 
  Download, FileText, Image, Share2, 
  Loader2, CheckCircle, AlertCircle,
  Camera, FileSpreadsheet
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import { useTranslation } from '../../../../utils/translations';

// Contenu des outils d'export (sans wrapper Card)
export const ExportToolsContent = ({ 
  statisticsData, 
  selectedPeriod, 
  books = [],
  chartsRefs = {} // Références aux composants de graphiques pour la capture
}) => {
  const t = useTranslation();
  const [exportStatus, setExportStatus] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  // Fonction utilitaire pour formater les données en CSV
  const formatDataToCSV = (data, headers) => {
    const csvHeaders = headers.join(',');
    const csvRows = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Échapper les guillemets et virgules
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    );
    return [csvHeaders, ...csvRows].join('\n');
  };

  // Export CSV des données brutes
  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      setExportStatus({ type: 'info', message: 'Préparation des données CSV...' });

      const { metrics, temporal } = statisticsData;
      
      // Données des sessions quotidiennes
      const dailyData = temporal?.map(day => ({
        date: day.date,
        pages: day.pages,
        minutes: day.minutes,
        sessions: day.sessions,
        speed: day.speed,
        books: day.books?.join('; ') || '',
        averagePagesPerSession: day.averagePagesPerSession
      })) || [];

      // Données des métriques générales
      const metricsData = [{
        totalPages: metrics.totalPages,
        totalTime: metrics.totalTime,
        averageSpeed: metrics.averageSpeed,
        sessionsCount: metrics.sessionsCount,
        booksCompleted: metrics.booksCompleted,
        currentStreak: metrics.currentStreak,
        longestStreak: metrics.longestStreak,
        averageSessionDuration: metrics.averageSessionDuration,
        readingFrequency: metrics.readingFrequency,
        uniqueDays: metrics.uniqueDays
      }];

      // Créer les fichiers CSV
      const dailyCSV = formatDataToCSV(dailyData, [
        'date', 'pages', 'minutes', 'sessions', 'speed', 'books', 'averagePagesPerSession'
      ]);

      const metricsCSV = formatDataToCSV(metricsData, [
        'totalPages', 'totalTime', 'averageSpeed', 'sessionsCount', 'booksCompleted',
        'currentStreak', 'longestStreak', 'averageSessionDuration', 'readingFrequency', 'uniqueDays'
      ]);

      // Télécharger les fichiers
      const downloadCSV = (content, filename) => {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      };

      const dateStr = new Date().toISOString().split('T')[0];
      downloadCSV(dailyCSV, `statistiques-lecture-quotidien-${selectedPeriod}-${dateStr}.csv`);
      downloadCSV(metricsCSV, `statistiques-lecture-metriques-${selectedPeriod}-${dateStr}.csv`);

      setExportStatus({ 
        type: 'success', 
        message: 'Export CSV terminé avec succès!' 
      });

    } catch (error) {
      console.error('[ExportTools] CSV export error:', error);
      setExportStatus({ 
        type: 'error', 
        message: 'Erreur lors de l\'export CSV' 
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus({}), 3000);
    }
  };

  // Export PDF avec graphiques (version simplifiée)
  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      setExportStatus({ type: 'info', message: 'Génération du PDF...' });

      // Import dynamique de jsPDF
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      const { metrics, patterns } = statisticsData;
      const dateStr = new Date().toLocaleDateString();

      // En-tête du document
      doc.setFontSize(20);
      doc.text('Rapport de Statistiques de Lecture', 20, 30);
      
      doc.setFontSize(12);
      doc.text(`Période: ${selectedPeriod}`, 20, 45);
      doc.text(`Généré le: ${dateStr}`, 20, 55);

      // Métriques principales
      doc.setFontSize(16);
      doc.text('Métriques Principales', 20, 75);
      
      doc.setFontSize(11);
      let yPos = 90;
      const metricsText = [
        `Pages lues: ${metrics.totalPages?.toLocaleString() || 0}`,
        `Temps total: ${Math.round((metrics.totalTime || 0) / 60)}h ${(metrics.totalTime || 0) % 60}min`,
        `Vitesse moyenne: ${(metrics.averageSpeed || 0).toFixed(1)} pages/heure`,
        `Sessions: ${metrics.sessionsCount || 0}`,
        `Livres terminés: ${metrics.booksCompleted || 0}`,
        `Série actuelle: ${metrics.currentStreak || 0} jours`,
        `Record de série: ${metrics.longestStreak || 0} jours`,
        `Durée moyenne par session: ${(metrics.averageSessionDuration || 0).toFixed(1)} minutes`,
        `Fréquence: ${(metrics.readingFrequency || 0).toFixed(1)} sessions/semaine`
      ];

      metricsText.forEach(text => {
        doc.text(text, 20, yPos);
        yPos += 8;
      });

      // Patterns de lecture
      if (patterns?.bestDaysOfWeek) {
        yPos += 10;
        doc.setFontSize(16);
        doc.text('Analyse des Habitudes', 20, yPos);
        yPos += 15;

        doc.setFontSize(11);
        doc.text('Meilleurs jours de la semaine:', 20, yPos);
        yPos += 8;

        const sortedDays = Object.values(patterns.bestDaysOfWeek)
          .sort((a, b) => b.averagePagesPerDay - a.averagePagesPerDay)
          .slice(0, 3);

        sortedDays.forEach((day, index) => {
          doc.text(
            `${index + 1}. ${day.dayName}: ${(day.averagePagesPerDay || 0).toFixed(1)} pages/jour`, 
            30, yPos
          );
          yPos += 6;
        });

        yPos += 10;
        doc.text(`Consistance de lecture: ${patterns.readingConsistency || 0}%`, 20, yPos);
      }

      // Livres récents (si disponibles)
      if (books && books.length > 0) {
        yPos += 20;
        doc.setFontSize(16);
        doc.text('Livres Récents', 20, yPos);
        yPos += 15;

        doc.setFontSize(11);
        const recentBooks = books.slice(0, 5);
        recentBooks.forEach(book => {
          if (yPos > 250) { // Nouvelle page si nécessaire
            doc.addPage();
            yPos = 30;
          }
          doc.text(`• ${book.title}`, 20, yPos);
          if (book.author) {
            yPos += 6;
            doc.text(`  par ${book.author}`, 25, yPos);
          }
          yPos += 10;
        });
      }

      // Pied de page
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(
          `Page ${i} sur ${pageCount} - Généré par QuietQuest`, 
          20, 
          doc.internal.pageSize.height - 10
        );
      }

      // Télécharger le PDF
      const filename = `rapport-lecture-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      setExportStatus({ 
        type: 'success', 
        message: 'Rapport PDF généré avec succès!' 
      });

    } catch (error) {
      console.error('[ExportTools] PDF export error:', error);
      setExportStatus({ 
        type: 'error', 
        message: 'Erreur lors de la génération du PDF' 
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus({}), 3000);
    }
  };

  // Capture et partage d'un graphique individuel
  const captureChart = async (chartRef, chartName) => {
    try {
      setIsExporting(true);
      setExportStatus({ type: 'info', message: `Capture du graphique ${chartName}...` });

      if (!chartRef?.current) {
        throw new Error('Référence du graphique non trouvée');
      }

      // Import dynamique de html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: '#1e293b', // Fond sombre pour correspondre au thème
        scale: 2, // Haute résolution
        logging: false
      });

      // Convertir en blob et télécharger
      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${chartName}-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportStatus({ 
          type: 'success', 
          message: `Graphique ${chartName} exporté!` 
        });
      }, 'image/png');

    } catch (error) {
      console.error('[ExportTools] Chart capture error:', error);
      setExportStatus({ 
        type: 'error', 
        message: `Erreur lors de la capture du graphique ${chartName}` 
      });
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus({}), 3000);
    }
  };

  // Partage via l'API Web Share (si disponible)
  const shareData = async (data) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        setExportStatus({ 
          type: 'success', 
          message: 'Partagé avec succès!' 
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('[ExportTools] Share error:', error);
          setExportStatus({ 
            type: 'error', 
            message: 'Erreur lors du partage' 
          });
        }
      }
    } else {
      // Fallback: copier dans le presse-papiers
      try {
        await navigator.clipboard.writeText(data.text || data.url);
        setExportStatus({ 
          type: 'success', 
          message: 'Lien copié dans le presse-papiers!' 
        });
      } catch (error) {
        console.error('[ExportTools] Clipboard error:', error);
        setExportStatus({ 
          type: 'error', 
          message: 'Impossible de copier le lien' 
        });
      }
    }
    setTimeout(() => setExportStatus({}), 3000);
  };

  const generateShareText = () => {
    const { metrics } = statisticsData;
    return `📚 Mes statistiques de lecture (${selectedPeriod}):
• ${metrics.totalPages || 0} pages lues
• ${Math.round((metrics.totalTime || 0) / 60)}h de lecture
• ${metrics.sessionsCount || 0} sessions
• Vitesse: ${(metrics.averageSpeed || 0).toFixed(1)} p/h
• Série: ${metrics.currentStreak || 0} jours

#lecture #statistiques #QuietQuest`;
  };

  if (!statisticsData || !statisticsData.hasData) {
    return (
      <div className="p-4 text-center">
        <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <p className="text-sm text-slate-400">
          Aucune donnée à exporter
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
          {/* Status d'export */}
          {exportStatus.message && (
            <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
              exportStatus.type === 'success' ? 'bg-[#3A86FF]/12 text-sky-200 border border-[#3A86FF]/35' :
              exportStatus.type === 'error' ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
              'bg-[#3A86FF]/10 text-sky-200 border border-[#3A86FF]/35'
            }`}>
              {exportStatus.type === 'success' && <CheckCircle className="w-4 h-4" />}
              {exportStatus.type === 'error' && <AlertCircle className="w-4 h-4" />}
              {exportStatus.type === 'info' && <Loader2 className="w-4 h-4 animate-spin" />}
              {exportStatus.message}
            </div>
          )}

          {/* Boutons d'export */}
          <div className="grid grid-cols-1 gap-3">
            {/* Export PDF */}
            <Button
              variant="booksMuted"
              onClick={exportToPDF}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 w-full normal-case tracking-normal border-2 border-[#3A86FF]/70 text-[#bfdbfe] hover:text-[#bfdbfe]"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              Exporter en PDF
            </Button>

            {/* Export CSV */}
            <Button
              variant="booksMuted"
              onClick={exportToCSV}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 w-full normal-case tracking-normal border-2 border-[#3A86FF]/70 text-[#bfdbfe] hover:text-[#bfdbfe]"
            >
              {isExporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              Exporter en CSV
            </Button>

            {/* Partage des statistiques */}
            <Button
              variant="booksMuted"
              onClick={() => shareData({
                title: 'Mes statistiques de lecture',
                text: generateShareText(),
                url: window.location.href
              })}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 w-full normal-case tracking-normal border-2 border-[#3A86FF]/70 text-[#bfdbfe] hover:text-[#bfdbfe]"
            >
              <Share2 className="w-4 h-4" />
              Partager les statistiques
            </Button>
          </div>

          {/* Capture de graphiques individuels */}
          {Object.keys(chartsRefs).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-[#bfdbfe] mb-3">
                Capturer les graphiques
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(chartsRefs).map(([chartName, chartRef]) => (
                  <Button
                    key={chartName}
                    variant="booksMuted"
                    size="sm"
                    onClick={() => captureChart(chartRef, chartName)}
                    disabled={isExporting}
                    className="flex items-center gap-2 text-xs normal-case tracking-normal"
                  >
                    <Camera className="w-3 h-3" />
                    {chartName}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Informations sur les formats */}
          <div className="text-xs text-[#93c5fd]/75 space-y-1">
            <p>• PDF: Rapport complet avec métriques et graphiques</p>
            <p>• CSV: Données brutes pour analyse externe</p>
            <p>• PNG: Images haute résolution des graphiques</p>
          </div>
    </div>
  );
};

// Composant wrapper avec Card pour compatibilité
const ExportTools = (props) => {
  return (
    <Card variant="books">
      <CardHeader className="border-b border-[#3A86FF]/25">
        <CardTitle tone="books" size="sm" className="flex items-center gap-2 normal-case tracking-wide">
          <Download className="w-4 h-4 text-[#93c5fd]" />
          Outils d'Export et Partage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ExportToolsContent {...props} />
      </CardContent>
    </Card>
  );
};

export default ExportTools;