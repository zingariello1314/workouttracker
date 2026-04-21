/**
 * Composant Graphique Interactif Wrapper
 * 
 * Encapsule Recharts avec fonctionnalités avancées:
 * - Zoom et Pan (Brush)
 * - Export PNG/CSV
 * - Filtres temporels
 * - Responsive
 * 
 * Référence: suiviphotoapprofondi.md - Section 7 (Graphiques interactifs)
 */

import React, { useState, useRef } from 'react';
import {
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  Brush
} from 'recharts';
import Button from '../../ui/Button';
import { exportChartToPNG, exportChartDataToCSV } from '../utils/chartExportUtils';
import logger from '../../../utils/logger';

const log = logger.component('InteractiveChart');

/**
 * Wrapper pour graphiques Recharts avec fonctionnalités interactives
 * 
 * @param {React.ReactElement} chartComponent - Composant Recharts (AreaChart, LineChart, etc.)
 * @param {Array} data - Données du graphique
 * @param {string} exportFilename - Nom de base pour exports
 * @param {Function} onBrushChange - Callback changement zoom
 * @param {boolean} showZoom - Afficher contrôle zoom
 * @param {boolean} showExport - Afficher boutons export
 */
const InteractiveChart = ({
  chartComponent,
  data = [],
  exportFilename = 'chart',
  onBrushChange = null,
  showZoom = true,
  showExport = true,
  className = ''
}) => {
  const [brushStartIndex, setBrushStartIndex] = useState(0);
  const [brushEndIndex, setBrushEndIndex] = useState(data.length > 0 ? data.length - 1 : 0);
  const [isExporting, setIsExporting] = useState(false);
  const chartContainerRef = useRef(null);

  /**
   * Export graphique en PNG
   */
  const handleExportPNG = async () => {
    try {
      setIsExporting(true);
      const container = chartContainerRef.current || chartRef?.current;
      if (container) {
        await exportChartToPNG(container, `${exportFilename}.png`, {
          width: 1920,
          height: 1080,
          scale: 2
        });
        log.info('Export PNG réussi', { filename: exportFilename });
      }
    } catch (error) {
      log.error('Erreur export PNG', error);
      alert('Erreur lors de l\'export PNG: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Export données en CSV
   */
  const handleExportCSV = () => {
    try {
      const visibleData = data.slice(brushStartIndex, brushEndIndex + 1);
      exportChartDataToCSV(visibleData, `${exportFilename}.csv`);
      log.info('Export CSV réussi', { filename: exportFilename, rows: visibleData.length });
    } catch (error) {
      log.error('Erreur export CSV', error);
      alert('Erreur lors de l\'export CSV: ' + error.message);
    }
  };

  /**
   * Reset zoom
   */
  const handleResetZoom = () => {
    setBrushStartIndex(0);
    setBrushEndIndex(data.length - 1);
    if (onBrushChange) {
      onBrushChange([0, data.length - 1]);
    }
  };

  /**
   * Gestion changement brush (zoom)
   */
  const handleBrushChange = (brushData) => {
    if (brushData && brushData.startIndex !== undefined && brushData.endIndex !== undefined) {
      setBrushStartIndex(brushData.startIndex);
      setBrushEndIndex(brushData.endIndex);
      if (onBrushChange) {
        onBrushChange([brushData.startIndex, brushData.endIndex]);
      }
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre outils */}
      {(showExport || showZoom) && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showZoom && data.length > 0 && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleResetZoom}
                  title="Reset zoom"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <div className="text-xs text-teal-100/55">
                  {brushStartIndex !== 0 || brushEndIndex !== data.length - 1 ? (
                    <>
                      Zoom: {brushStartIndex + 1}-{brushEndIndex + 1} / {data.length}
                    </>
                  ) : (
                    'Vue complète'
                  )}
                </div>
              </>
            )}
          </div>

          {showExport && (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExportPNG}
                disabled={isExporting}
                loading={isExporting}
                title="Exporter en PNG"
              >
                <Download className="w-4 h-4 mr-2" />
                PNG
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleExportCSV}
                title="Exporter données CSV"
              >
                <FileText className="w-4 h-4 mr-2" />
                CSV
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Graphique avec container */}
      <div ref={chartContainerRef} className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          {React.isValidElement(chartComponent) ? (
            React.cloneElement(chartComponent, {
              ...chartComponent.props,
              data: data.slice(brushStartIndex, brushEndIndex + 1),
              children: [
                ...React.Children.toArray(chartComponent.props?.children || []),
                showZoom && data.length > 10 && (
                  <Brush
                    key="brush"
                    dataKey="date"
                    height={30}
                    stroke="#8B5CF6"
                    fill="#8B5CF6"
                    onChange={handleBrushChange}
                    startIndex={brushStartIndex}
                    endIndex={brushEndIndex}
                  />
                )
              ].filter(Boolean)
            })
          ) : (
            chartComponent
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default InteractiveChart;

