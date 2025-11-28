import React from 'react';
import { useTranslation } from '../../../utils/translations';

/**
 * Wrapper générique pour adapter les graphiques Garmin à ChartsTab
 * Convertit selectedPeriod de ChartsTab en periodFilter pour les graphiques Garmin
 */
export function createGarminChartWrapper(GarminChartComponent, needsActivities = false) {
  return function GarminChartWrapper({ garminData, selectedPeriod, colors }) {
    const t = useTranslation();
    // Convertir selectedPeriod (7days, 30days, 90days, 1year) en periodFilter
    const periodFilter = React.useMemo(() => {
      switch (selectedPeriod) {
        case '7days':
          return 'week';
        case '30days':
          return 'month';
        case '90days':
          return '3months';
        case '1year':
          return 'year';
        default:
          return 'month';
      }
    }, [selectedPeriod]);

    // Calculer customStartDate et customEndDate si nécessaire
    const { customStartDate, customEndDate } = React.useMemo(() => {
      const now = new Date();
      let startDate;
      switch (selectedPeriod) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      return {
        customStartDate: startDate.toISOString().split('T')[0],
        customEndDate: now.toISOString().split('T')[0]
      };
    }, [selectedPeriod]);

    // Trouver la dernière date disponible dans la période sélectionnée pour selectedDate
    const selectedDate = React.useMemo(() => {
      if (!garminData?.dailyMetrics) return null;
      
      const now = new Date();
      const endDate = now.toISOString().split('T')[0];
      let startDate;
      switch (selectedPeriod) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      
      // Filtrer les dates dans la période
      const dateKeys = Object.keys(garminData.dailyMetrics)
        .filter(date => date >= startDate && date <= endDate)
        .sort();
      
      return dateKeys[dateKeys.length - 1] || null;
    }, [garminData, selectedPeriod]);

    // Ne pas afficher si pas de données
    if (!garminData || !garminData.dailyMetrics || Object.keys(garminData.dailyMetrics).length === 0) {
      return (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400 text-sm">
          {t('charts.noData.garmin')}
        </div>
      );
    }

    // Props communes pour tous les graphiques Garmin
    const commonProps = {
      dailyMetrics: garminData.dailyMetrics,
      selectedDate,
      periodFilter,
      customStartDate,
      customEndDate,
      colors: colors || {}
    };

    // Wrapper avec conteneur pour garantir des dimensions valides (fix Recharts width/height warnings)
    // Le conteneur doit avoir des dimensions absolues (px) pour que ResponsiveContainer puisse les mesurer
    const ChartContent = needsActivities 
      ? <GarminChartComponent {...commonProps} activities={garminData.activities || {}} />
      : <GarminChartComponent {...commonProps} />;

    // 🟡 FIX #20 : Conteneur avec dimensions absolues garanties pour éviter warnings Recharts
    // Dimensions fixes en px pour garantir que le conteneur est toujours mesurable
    // 🔴 FIX : Hauteur augmentée à 500px pour accommoder graphiques et statistiques en bas
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '500px', 
          minHeight: '500px', 
          minWidth: '400px',
          position: 'relative',
          display: 'block',
          boxSizing: 'border-box'
        }}
        className="w-full"
      >
        {ChartContent}
      </div>
    );
  };
}

/**
 * Wrapper spécial pour GarminCorrelationCharts (permet hauteur automatique, pas de contrainte fixe)
 */
export function createGarminCorrelationChartsWrapper(GarminChartComponent) {
  return function GarminCorrelationChartsWrapper({ garminData, selectedPeriod, colors }) {
    const t = useTranslation();
    // Convertir selectedPeriod (7days, 30days, 90days, 1year) en periodFilter
    const periodFilter = React.useMemo(() => {
      switch (selectedPeriod) {
        case '7days':
          return 'week';
        case '30days':
          return 'month';
        case '90days':
          return '3months';
        case '1year':
          return 'year';
        default:
          return 'month';
      }
    }, [selectedPeriod]);

    // Calculer customStartDate et customEndDate si nécessaire
    const { customStartDate, customEndDate } = React.useMemo(() => {
      const now = new Date();
      let startDate;
      switch (selectedPeriod) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      return {
        customStartDate: startDate.toISOString().split('T')[0],
        customEndDate: now.toISOString().split('T')[0]
      };
    }, [selectedPeriod]);

    // Trouver la dernière date disponible dans la période sélectionnée pour selectedDate
    const selectedDate = React.useMemo(() => {
      if (!garminData?.dailyMetrics) return null;
      
      const now = new Date();
      const endDate = now.toISOString().split('T')[0];
      let startDate;
      switch (selectedPeriod) {
        case '7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        case '1year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      
      // Filtrer les dates dans la période
      const dateKeys = Object.keys(garminData.dailyMetrics)
        .filter(date => date >= startDate && date <= endDate)
        .sort();
      
      return dateKeys[dateKeys.length - 1] || null;
    }, [garminData, selectedPeriod]);

    // Ne pas afficher si pas de données
    if (!garminData || !garminData.dailyMetrics || Object.keys(garminData.dailyMetrics).length === 0) {
      return (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400 text-sm">
          {t('charts.noData.garmin')}
        </div>
      );
    }

    // Props communes pour tous les graphiques Garmin
    const commonProps = {
      dailyMetrics: garminData.dailyMetrics,
      selectedDate,
      periodFilter,
      customStartDate,
      customEndDate,
      colors: colors || {}
    };

    // 🟡 FIX : Conteneur SANS hauteur fixe pour permettre aux deux graphiques de prendre leur espace naturel
    return (
      <div 
        style={{ 
          width: '100%', 
          minWidth: '400px',
          position: 'relative',
          display: 'block',
          boxSizing: 'border-box'
        }}
        className="w-full"
      >
        <GarminChartComponent {...commonProps} />
      </div>
    );
  };
}

/**
 * Wrapper spécial pour GarminHeartRateTimeSeriesChart (nécessite selectedDate spécifique avec time series)
 */
export function createGarminTimeSeriesChartWrapper(GarminChartComponent) {
  return function GarminTimeSeriesChartWrapper({ garminData, selectedPeriod, colors }) {
    const t = useTranslation();
    // Calculer les dates de la période
    const { startDate, endDate } = React.useMemo(() => {
      const now = new Date();
      let start;
      switch (selectedPeriod) {
        case '7days':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30days':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1year':
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      };
    }, [selectedPeriod]);
    
    // Trouver la dernière date avec time series data DANS LA PÉRIODE SÉLECTIONNÉE
    const selectedDate = React.useMemo(() => {
      if (!garminData?.dailyMetrics) return null;
      
      // Filtrer les dates dans la période
      const dateKeys = Object.keys(garminData.dailyMetrics)
        .filter(date => date >= startDate && date <= endDate)
        .sort();
      
      // Chercher la dernière date avec time series dans cette période
      for (let i = dateKeys.length - 1; i >= 0; i--) {
        const date = dateKeys[i];
        const dayMetrics = garminData.dailyMetrics[date];
        if (dayMetrics?.heartRate?.timeSeries?.length > 0) {
          return date;
        }
      }
      
      // Si aucune date avec time series, retourner la dernière date de la période
      return dateKeys[dateKeys.length - 1] || null;
    }, [garminData, startDate, endDate]);

    if (!garminData || !garminData.dailyMetrics) {
      return (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400 text-sm">
          {t('charts.noData.garmin')}
        </div>
      );
    }
    
    if (!selectedDate) {
      return (
        <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400 text-sm">
          {t('charts.noData.period', { period: selectedPeriod })}
        </div>
      );
    }

    // 🟡 FIX #20 : Conteneur avec dimensions absolues garanties
    // 🔴 FIX : Hauteur augmentée pour FC 24h en pleine largeur (éviter coupure verticale)
    // 🔴 FIX : Hauteur augmentée à 800px pour accommoder header, zones FC, graphique et statistiques complètes
    return (
      <div 
        style={{ 
          width: '100%', 
          height: '800px', 
          minHeight: '800px', 
          minWidth: '400px',
          position: 'relative',
          display: 'block',
          boxSizing: 'border-box'
        }}
        className="w-full"
      >
        <GarminChartComponent
          dailyMetrics={garminData.dailyMetrics}
          selectedDate={selectedDate}
          colors={colors || {}}
        />
      </div>
    );
  };
}

