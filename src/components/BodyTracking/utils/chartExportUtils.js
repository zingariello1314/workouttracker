/**
 * Utilitaires d'export pour graphiques et visualisations
 * 
 * Export PNG, PDF, CSV pour graphiques Recharts
 * Export images photos avec overlay métriques
 * 
 * Référence: suiviphotoapprofondi.md - Section 7 (Graphiques interactifs)
 */

import logger from '../../../utils/logger';

const log = logger.module('ChartExportUtils');

/**
 * Export un canvas/chart en PNG
 * @param {HTMLElement|string} element - Element ou sélecteur CSS
 * @param {string} filename - Nom du fichier
 * @param {Object} options - {width, height, scale}
 */
export const exportChartToPNG = (element, filename = 'chart.png', options = {}) => {
  try {
    const { width = 1920, height = 1080, scale = 2 } = options;
    
    // Trouver l'élément
    const targetElement = typeof element === 'string' 
      ? document.querySelector(element) 
      : element;
    
    if (!targetElement) {
      throw new Error('Élément non trouvé pour export');
    }

    // Créer canvas de rendu haute résolution
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    // Fond blanc
    ctx.fillStyle = '#1e293b'; // slate-800
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pour SVG (graphiques Recharts), utiliser html2canvas ou alternative
    // Pour l'instant, conversion simple via html2canvas si disponible
    if (window.html2canvas) {
      return window.html2canvas(targetElement, {
        backgroundColor: '#1e293b',
        scale: scale,
        width: width,
        height: height,
        useCORS: true
      }).then(canvas => {
        // Télécharger
        canvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 'image/png');
      });
    } else {
      // Fallback: screenshot via canvas si possible
      log.warn('html2canvas non disponible, export limité');
      
      // Méthode alternative: Utiliser SVG export si c'est un SVG
      const svgElement = targetElement.querySelector('svg');
      if (svgElement) {
        return exportSVGToPNG(svgElement, filename, options);
      } else {
        throw new Error('Export PNG non disponible sans html2canvas');
      }
    }
  } catch (error) {
    log.error('Erreur export PNG', error);
    throw error;
  }
};

/**
 * Export SVG en PNG
 * @param {SVGElement} svgElement 
 * @param {string} filename 
 * @param {Object} options 
 */
const exportSVGToPNG = (svgElement, filename, options = {}) => {
  const { width = 1920, height = 1080, scale = 2 } = options;
  
  return new Promise((resolve, reject) => {
    try {
      // Cloner SVG pour modification
      const clonedSvg = svgElement.cloneNode(true);
      
      // Obtenir viewBox ou dimensions
      const viewBox = clonedSvg.getAttribute('viewBox') || 
                     `0 0 ${clonedSvg.width?.baseVal?.value || width} ${clonedSvg.height?.baseVal?.value || height}`;
      
      clonedSvg.setAttribute('width', width * scale);
      clonedSvg.setAttribute('height', height * scale);
      clonedSvg.setAttribute('viewBox', viewBox);

      // Convertir SVG en Data URL
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      // Créer image depuis SVG
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = width * scale;
          canvas.height = height * scale;
          const ctx = canvas.getContext('2d');

          // Fond
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Dessiner SVG
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Télécharger
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            URL.revokeObjectURL(svgUrl);
            resolve();
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = svgUrl;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Export données graphique en CSV
 * @param {Array} data - Données du graphique
 * @param {string} filename - Nom du fichier
 * @param {Object} columns - Mapping colonnes {key: label}
 */
export const exportChartDataToCSV = (data, filename = 'chart-data.csv', columns = {}) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('Aucune donnée à exporter');
    }

    // Headers
    const headers = Object.keys(data[0]);
    const headerLabels = headers.map(key => columns[key] || key);

    // Lignes CSV
    const csvRows = [
      headerLabels.join(','),
      ...data.map(row => 
        headers.map(key => {
          const value = row[key];
          // Échapper valeurs contenant virgules
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value ?? '';
        }).join(',')
      )
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    log.info('Export CSV réussi', { filename, rows: data.length });
  } catch (error) {
    log.error('Erreur export CSV', error);
    throw error;
  }
};

/**
 * Export PDF via jsPDF (si disponible)
 * @param {HTMLElement} element - Element à exporter
 * @param {string} filename - Nom du fichier
 * @param {Object} options - Options PDF
 */
export const exportChartToPDF = (element, filename = 'chart.pdf', options = {}) => {
  try {
    if (!window.jspdf || !window.html2canvas) {
      log.warn('jsPDF ou html2canvas non disponible, export PDF non possible');
      throw new Error('Export PDF nécessite jsPDF et html2canvas');
    }

    const { width = 210, height = 297, orientation = 'portrait' } = options; // A4 par défaut (mm)

    return window.html2canvas(element, {
      backgroundColor: '#1e293b',
      scale: 2,
      useCORS: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new window.jspdf.jsPDF({
        orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [width, height]
      });

      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(filename);

      log.info('Export PDF réussi', { filename });
    });
  } catch (error) {
    log.error('Erreur export PDF', error);
    throw error;
  }
};

/**
 * Génère image avec overlay métriques sur photo
 * @param {string} photoUrl - URL photo
 * @param {Object} metrics - Métriques à overlay
 * @param {Object} options - Options overlay
 * @returns {Promise<Blob>} Image avec overlay
 */
export const generatePhotoWithMetricsOverlay = async (photoUrl, metrics, options = {}) => {
  try {
    const {
      position = 'bottom-right',
      fontSize = 16,
      backgroundColor = 'rgba(0, 0, 0, 0.7)',
      textColor = '#ffffff'
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');

          // Dessiner photo
          ctx.drawImage(img, 0, 0);

          // Préparer texte métriques
          const metricsText = Object.entries(metrics)
            .map(([key, value]) => {
              const label = key.charAt(0).toUpperCase() + key.slice(1);
              const score = typeof value === 'object' ? value.score : value;
              return `${label}: ${score}/100`;
            })
            .join('\n');

          // Calculer position
          ctx.font = `${fontSize}px Arial`;
          ctx.fillStyle = backgroundColor;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          const metrics = ctx.measureText(metricsText);
          const padding = 10;
          const textWidth = metrics.width + padding * 2;
          const textHeight = fontSize * Object.keys(metrics).length + padding * 2;

          let x, y;
          switch (position) {
            case 'bottom-right':
              x = canvas.width - textWidth;
              y = canvas.height - textHeight;
              break;
            case 'bottom-left':
              x = 0;
              y = canvas.height - textHeight;
              break;
            case 'top-right':
              x = canvas.width - textWidth;
              y = 0;
              break;
            case 'top-left':
            default:
              x = 0;
              y = 0;
          }

          // Rectangle fond
          ctx.fillRect(x, y, textWidth, textHeight);

          // Texte
          ctx.fillStyle = textColor;
          const lines = metricsText.split('\n');
          lines.forEach((line, index) => {
            ctx.fillText(line, x + padding, y + padding + index * fontSize);
          });

          // Convertir en blob
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = reject;
      img.src = photoUrl;
    });
  } catch (error) {
    log.error('Erreur génération overlay', error);
    throw error;
  }
};

