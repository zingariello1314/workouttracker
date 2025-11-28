/**
 * Wrapper pour adapter les graphiques Garmin au système ChartsTab
 * Convertit selectedPeriod (ChartsTab) en periodFilter/selectedDate (Garmin charts)
 */

import React from 'react';
import { useTranslation } from '../../../utils/translations';

/**
 * Convertit selectedPeriod (7days, 30days, 90days, 1year) en periodFilter (week, month, 3months, year)
 */
export const convertPeriodToGarminFilter = (selectedPeriod) => {
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
};

/**
 * Wrapper pour GarminHeartRateChart
 */
export const GarminHeartRateChartWrapper = ({ garminData, selectedPeriod, colors }) => {
  const t = useTranslation();
  if (!garminData || !garminData.dailyMetrics) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        {t('charts.noData.garminSync')}
      </div>
    );
  }

  const GarminHeartRateChart = React.lazy(() => import('../../GarminTab/components/charts/GarminHeartRateChart'));
  const periodFilter = convertPeriodToGarminFilter(selectedPeriod);
  const dateKeys = Object.keys(garminData.dailyMetrics).sort();
  const selectedDate = dateKeys[dateKeys.length - 1]; // Dernière date par défaut

  return (
    <React.Suspense fallback={<div className="text-slate-400">Chargement...</div>}>
      <GarminHeartRateChart
        dailyMetrics={garminData.dailyMetrics}
        selectedDate={selectedDate}
        periodFilter={periodFilter}
        customStartDate={null}
        customEndDate={null}
        colors={colors}
      />
    </React.Suspense>
  );
};

/**
 * Wrapper pour GarminHeartRateTimeSeriesChart
 */
export const GarminHeartRateTimeSeriesChartWrapper = ({ garminData, selectedPeriod, colors }) => {
  if (!garminData || !garminData.dailyMetrics) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        {t('charts.noData.garminSync')}
      </div>
    );
  }

  const GarminHeartRateTimeSeriesChart = React.lazy(() => import('../../GarminTab/components/charts/GarminHeartRateTimeSeriesChart'));
  const dateKeys = Object.keys(garminData.dailyMetrics).sort();
  const selectedDate = dateKeys[dateKeys.length - 1];

  // Vérifier si timeSeries existe pour la date sélectionnée
  const hasTimeSeries = garminData.dailyMetrics[selectedDate]?.heartRate?.timeSeries?.length > 0;

  if (!hasTimeSeries) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        {t('charts.noData.timeSeries')}
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div className="text-slate-400">Chargement...</div>}>
      <GarminHeartRateTimeSeriesChart
        dailyMetrics={garminData.dailyMetrics}
        selectedDate={selectedDate}
        colors={colors}
      />
    </React.Suspense>
  );
};

/**
 * Wrapper pour GarminBodyBatteryChart
 */
export const GarminBodyBatteryChartWrapper = ({ garminData, selectedPeriod, colors }) => {
  if (!garminData || !garminData.dailyMetrics) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        {t('charts.noData.garminSync')}
      </div>
    );
  }

  const GarminBodyBatteryChart = React.lazy(() => import('../../GarminTab/components/charts/GarminBodyBatteryChart'));
  const periodFilter = convertPeriodToGarminFilter(selectedPeriod);
  const dateKeys = Object.keys(garminData.dailyMetrics).sort();
  const selectedDate = dateKeys[dateKeys.length - 1];

  return (
    <React.Suspense fallback={<div className="text-slate-400">Chargement...</div>}>
      <GarminBodyBatteryChart
        dailyMetrics={garminData.dailyMetrics}
        selectedDate={selectedDate}
        periodFilter={periodFilter}
        customStartDate={null}
        customEndDate={null}
        colors={colors}
      />
    </React.Suspense>
  );
};

/**
 * Wrapper pour GarminStressChart
 */
export const GarminStressChartWrapper = ({ garminData, selectedPeriod, colors }) => {
  const t = useTranslation();
  if (!garminData || !garminData.dailyMetrics) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        {t('charts.noData.garminSync')}
      </div>
    );
  }

  const GarminStressChart = React.lazy(() => import('../../GarminTab/components/charts/GarminStressChart'));
  const periodFilter = convertPeriodToGarminFilter(selectedPeriod);
  const dateKeys = Object.keys(garminData.dailyMetrics).sort();
  const selectedDate = dateKeys[dateKeys.length - 1];

  return (
    <React.Suspense fallback={<div className="text-slate-400">Chargement...</div>}>
      <GarminStressChart
        dailyMetrics={garminData.dailyMetrics}
        selectedDate={selectedDate}
        periodFilter={periodFilter}
        customStartDate={null}
        customEndDate={null}
        colors={colors}
      />
    </React.Suspense>
  );
};

/**
 * Wrapper pour GarminSleepChart
 */
export const GarminSleepChartWrapper = ({ garminData, selectedPeriod, colors }) => {
  const t = useTranslation();
  if (!garminData || !garminData.dailyMetrics) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        {t('charts.noData.garminSync')}
      </div>
    );
  }

  const GarminSleepChart = React.lazy(() => import('../../GarminTab/components/charts/GarminSleepChart'));
  const periodFilter = convertPeriodToGarminFilter(selectedPeriod);
  const dateKeys = Object.keys(garminData.dailyMetrics).sort();
  const selectedDate = dateKeys[dateKeys.length - 1];

  return (
    <React.Suspense fallback={<div className="text-slate-400">Chargement...</div>}>
      <GarminSleepChart
        dailyMetrics={garminData.dailyMetrics}
        selectedDate={selectedDate}
        periodFilter={periodFilter}
        customStartDate={null}
        customEndDate={null}
        colors={colors}
      />
    </React.Suspense>
  );
};

/**
 * Wrapper pour GarminRespirationChart
 */
export const GarminRespirationChartWrapper = ({ garminData, selectedPeriod, colors }) => {
  const t = useTranslation();
  if (!garminData || !garminData.dailyMetrics) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        {t('charts.noData.garminSync')}
      </div>
    );
  }

  const GarminRespirationChart = React.lazy(() => import('../../GarminTab/components/charts/GarminRespirationChart'));
  const periodFilter = convertPeriodToGarminFilter(selectedPeriod);
  const dateKeys = Object.keys(garminData.dailyMetrics).sort();
  const selectedDate = dateKeys[dateKeys.length - 1];

  return (
    <React.Suspense fallback={<div className="text-slate-400">Chargement...</div>}>
      <GarminRespirationChart
        dailyMetrics={garminData.dailyMetrics}
        selectedDate={selectedDate}
        periodFilter={periodFilter}
        customStartDate={null}
        customEndDate={null}
        colors={colors}
      />
    </React.Suspense>
  );
};

/**
 * Wrapper pour GarminActivityHeatmap
 */
export const GarminActivityHeatmapWrapper = ({ garminData, selectedPeriod, colors }) => {
  const t = useTranslation();
  if (!garminData || !garminData.activities || !garminData.dailyMetrics) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        {t('charts.noData.garminSync')}
      </div>
    );
  }

  const GarminActivityHeatmap = React.lazy(() => import('../../GarminTab/components/charts/GarminActivityHeatmap'));
  const periodFilter = convertPeriodToGarminFilter(selectedPeriod);
  const dateKeys = Object.keys(garminData.dailyMetrics).sort();
  const selectedDate = dateKeys[dateKeys.length - 1];

  return (
    <React.Suspense fallback={<div className="text-slate-400">Chargement...</div>}>
      <GarminActivityHeatmap
        activities={garminData.activities}
        dailyMetrics={garminData.dailyMetrics}
        selectedDate={selectedDate}
        periodFilter={periodFilter}
        customStartDate={null}
        customEndDate={null}
        colors={colors}
      />
    </React.Suspense>
  );
};

/**
 * Wrapper pour GarminCorrelationCharts
 */
export const GarminCorrelationChartsWrapper = ({ garminData, selectedPeriod, colors }) => {
  const t = useTranslation();
  if (!garminData || !garminData.dailyMetrics) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        {t('charts.noData.garminSync')}
      </div>
    );
  }

  const GarminCorrelationCharts = React.lazy(() => import('../../GarminTab/components/charts/GarminCorrelationCharts'));
  const periodFilter = convertPeriodToGarminFilter(selectedPeriod);
  const dateKeys = Object.keys(garminData.dailyMetrics).sort();
  const selectedDate = dateKeys[dateKeys.length - 1];

  return (
    <React.Suspense fallback={<div className="text-slate-400">Chargement...</div>}>
      <GarminCorrelationCharts
        dailyMetrics={garminData.dailyMetrics}
        selectedDate={selectedDate}
        periodFilter={periodFilter}
        customStartDate={null}
        customEndDate={null}
        colors={colors}
      />
    </React.Suspense>
  );
};


