import { describe, it, expect, beforeEach } from 'vitest';
import { buildGarminChartDataset, buildChartSelectors, buildDerivedDataset } from '../chartDataBuilders';

/**
 * Tests snapshot pour buildChartSelectors et buildDerivedDataset
 * 
 * Ces tests garantissent la cohérence de la structure des selectors
 * et la non-régression lors des modifications.
 */

describe('chartDataBuilders', () => {
  // Données de test réalistes
  const mockDailyMetrics = {
    '2025-01-15': {
      steps: 8500,
      calories: { total: 2200, active: 800, resting: 1400 },
      heartRate: { resting: 58, max: 165, avg: 120 },
      bodyBattery: 85,
      stress: 25,
      sleep: { duration: 7.5, deepSleep: 1.5, lightSleep: 4.0, remSleep: 2.0, quality: 85 },
      respiration: { awake: 16, sleep: 14 }
    },
    '2025-01-16': {
      steps: 9200,
      calories: { total: 2400, active: 900, resting: 1500 },
      heartRate: { resting: 60, max: 170, avg: 125 },
      bodyBattery: 90,
      stress: 20,
      sleep: { duration: 8.0, deepSleep: 2.0, lightSleep: 4.5, remSleep: 1.5, quality: 90 },
      respiration: { awake: 17, sleep: 15 }
    },
    '2025-01-17': {
      steps: 7800,
      calories: { total: 2100, active: 700, resting: 1400 },
      heartRate: { resting: 56, max: 160, avg: 115 },
      bodyBattery: 75,
      stress: 30,
      sleep: { duration: 7.0, deepSleep: 1.0, lightSleep: 4.5, remSleep: 1.5, quality: 75 },
      respiration: { awake: 15, sleep: 13 }
    }
  };

  const mockActivities = {
    swimming: [
      {
        id: 'swim-1',
        date: '2025-01-15',
        time: '08:00',
        distance: 1500,
        duration: 1800,
        calories: 400,
        pace: '2:00/100m'
      }
    ],
    jumpRope: [
      {
        id: 'jump-1',
        date: '2025-01-16',
        time: '18:00',
        jumps: 2000,
        duration: 1200,
        calories: 150
      }
    ],
    cardio: [
      {
        id: 'cardio-1',
        date: '2025-01-17',
        time: '07:00',
        duration: 3600,
        calories: 500,
        activityType: 'running'
      }
    ]
  };

  const mockFilteredDates = ['2025-01-15', '2025-01-16', '2025-01-17'];
  const mockSelectedDate = '2025-01-16';
  const mockDisplayInfo = { start: '2025-01-15', end: '2025-01-17', count: 3 };
  const mockColors = {
    heartRate: '#ef4444',
    bodyBattery: '#10b981',
    stress: '#f59e0b',
    sleep: '#3b82f6'
  };

  describe('buildGarminChartDataset', () => {
    it('devrait construire un dataset complet avec toutes les séries', async () => {
      const dataset = await buildGarminChartDataset({
        dailyMetrics: mockDailyMetrics,
        activities: mockActivities,
        filteredDates: mockFilteredDates,
        selectedDate: mockSelectedDate,
        effectiveSelectedDate: mockSelectedDate,
        displayInfo: mockDisplayInfo
      });

      expect(dataset).toHaveProperty('heartRateTrend');
      expect(dataset).toHaveProperty('bodyBatteryTrend');
      expect(dataset).toHaveProperty('stressTrend');
      expect(dataset).toHaveProperty('sleepTrend');
      expect(dataset).toHaveProperty('respirationTrend');
      expect(dataset).toHaveProperty('correlation');
      expect(dataset).toHaveProperty('activityHeatmap');
      expect(dataset).toHaveProperty('heartRateTimeSeries');

      // Vérifier que les trends contiennent des données
      expect(Array.isArray(dataset.heartRateTrend.data)).toBe(true);
      expect(dataset.heartRateTrend.data.length).toBeGreaterThan(0);
      expect(Array.isArray(dataset.bodyBatteryTrend.data)).toBe(true);
      expect(Array.isArray(dataset.stressTrend.data)).toBe(true);
      expect(Array.isArray(dataset.sleepTrend.data)).toBe(true);
    });

    it('devrait gérer les données vides gracieusement', async () => {
      const dataset = await buildGarminChartDataset({
        dailyMetrics: {},
        activities: {},
        filteredDates: [],
        selectedDate: null,
        effectiveSelectedDate: null,
        displayInfo: null
      });

      expect(dataset).toHaveProperty('heartRateTrend');
      expect(dataset).toHaveProperty('bodyBatteryTrend');
      expect(Array.isArray(dataset.heartRateTrend.data)).toBe(true);
      expect(Array.isArray(dataset.bodyBatteryTrend.data)).toBe(true);
    });
  });

  describe('buildChartSelectors', () => {
    it('devrait construire des selectors avec structure complète', async () => {
      const dataset = await buildGarminChartDataset({
        dailyMetrics: mockDailyMetrics,
        activities: mockActivities,
        filteredDates: mockFilteredDates,
        selectedDate: mockSelectedDate,
        effectiveSelectedDate: mockSelectedDate,
        displayInfo: mockDisplayInfo
      });

      const selectors = buildChartSelectors({
        dataset,
        filteredDates: mockFilteredDates,
        displayInfo: mockDisplayInfo,
        effectiveSelectedDate: mockSelectedDate,
        colors: mockColors,
        selectedDateRaw: mockSelectedDate
      });

      // Vérifier la structure complète des selectors
      expect(selectors).toHaveProperty('heartRate');
      expect(selectors.heartRate).toHaveProperty('trend');
      expect(selectors.heartRate).toHaveProperty('timeSeries');
      expect(selectors).toHaveProperty('respiration');
      expect(selectors).toHaveProperty('bodyBattery');
      expect(selectors).toHaveProperty('stress');
      expect(selectors).toHaveProperty('sleep');
      expect(selectors).toHaveProperty('activity');
      expect(selectors).toHaveProperty('metadata');

      // Vérifier les propriétés des trends
      expect(selectors.heartRate.trend).toHaveProperty('data');
      expect(selectors.heartRate.trend).toHaveProperty('yAxisDomain');
      expect(selectors.heartRate.trend).toHaveProperty('filteredDates');
      expect(selectors.heartRate.trend).toHaveProperty('displayInfo');
      expect(selectors.heartRate.trend).toHaveProperty('selectedDate');

      // Vérifier les propriétés de timeSeries
      expect(selectors.heartRate.timeSeries).toHaveProperty('enriched');
      expect(selectors.heartRate.timeSeries).toHaveProperty('chartData');
      expect(selectors.heartRate.timeSeries).toHaveProperty('hasEnoughDataForCurve');
      expect(selectors.heartRate.timeSeries).toHaveProperty('realPointsCount');

      // Vérifier metadata
      expect(selectors.metadata).toHaveProperty('filteredDates');
      expect(selectors.metadata).toHaveProperty('displayInfo');
      expect(selectors.metadata).toHaveProperty('selectedDate');
      expect(selectors.metadata).toHaveProperty('colors');
    });

    it('devrait produire un snapshot stable pour buildChartSelectors', async () => {
      const dataset = await buildGarminChartDataset({
        dailyMetrics: mockDailyMetrics,
        activities: mockActivities,
        filteredDates: mockFilteredDates,
        selectedDate: mockSelectedDate,
        effectiveSelectedDate: mockSelectedDate,
        displayInfo: mockDisplayInfo
      });

      const selectors = buildChartSelectors({
        dataset,
        filteredDates: mockFilteredDates,
        displayInfo: mockDisplayInfo,
        effectiveSelectedDate: mockSelectedDate,
        colors: mockColors,
        selectedDateRaw: mockSelectedDate
      });

      // Snapshot de la structure complète (sans les données volumineuses)
      const snapshot = {
        structure: {
          hasHeartRate: Boolean(selectors.heartRate),
          hasRespiration: Boolean(selectors.respiration),
          hasBodyBattery: Boolean(selectors.bodyBattery),
          hasStress: Boolean(selectors.stress),
          hasSleep: Boolean(selectors.sleep),
          hasActivity: Boolean(selectors.activity),
          hasMetadata: Boolean(selectors.metadata)
        },
        heartRateTrend: {
          hasData: Array.isArray(selectors.heartRate.trend.data),
          dataLength: selectors.heartRate.trend.data.length,
          hasYAxisDomain: Array.isArray(selectors.heartRate.trend.yAxisDomain),
          hasStats: selectors.heartRate.trend.stats !== null
        },
        heartRateTimeSeries: {
          hasEnriched: selectors.heartRate.timeSeries.enriched !== null,
          hasChartData: Array.isArray(selectors.heartRate.timeSeries.chartData),
          hasEnoughData: typeof selectors.heartRate.timeSeries.hasEnoughDataForCurve === 'boolean',
          realPointsCount: selectors.heartRate.timeSeries.realPointsCount
        },
        metadata: {
          filteredDatesLength: selectors.metadata.filteredDates.length,
          hasDisplayInfo: selectors.metadata.displayInfo !== null,
          selectedDate: selectors.metadata.selectedDate,
          hasColors: selectors.metadata.colors !== null
        }
      };

      expect(snapshot).toMatchSnapshot();
    });

    it('devrait gérer les données manquantes avec des valeurs par défaut', async () => {
      const dataset = await buildGarminChartDataset({
        dailyMetrics: {},
        activities: {},
        filteredDates: [],
        selectedDate: null,
        effectiveSelectedDate: null,
        displayInfo: null
      });

      const selectors = buildChartSelectors({
        dataset,
        filteredDates: [],
        displayInfo: null,
        effectiveSelectedDate: null,
        colors: null,
        selectedDateRaw: null
      });

      // Vérifier que les selectors existent même avec des données vides
      expect(selectors.heartRate.trend.data).toEqual([]);
      expect(selectors.heartRate.trend.yAxisDomain).toEqual([0, 180]);
      expect(selectors.bodyBattery.trend.data).toEqual([]);
      expect(selectors.bodyBattery.trend.average).toBe(0);
      expect(selectors.metadata.filteredDates).toEqual([]);
      expect(selectors.metadata.selectedDate).toBeNull();
    });

    it('devrait préserver la cohérence entre dataset et selectors', async () => {
      const dataset = await buildGarminChartDataset({
        dailyMetrics: mockDailyMetrics,
        activities: mockActivities,
        filteredDates: mockFilteredDates,
        selectedDate: mockSelectedDate,
        effectiveSelectedDate: mockSelectedDate,
        displayInfo: mockDisplayInfo
      });

      const selectors = buildChartSelectors({
        dataset,
        filteredDates: mockFilteredDates,
        displayInfo: mockDisplayInfo,
        effectiveSelectedDate: mockSelectedDate,
        colors: mockColors,
        selectedDateRaw: mockSelectedDate
      });

      // Vérifier que les dates filtrées sont cohérentes
      expect(selectors.metadata.filteredDates).toEqual(mockFilteredDates);
      expect(selectors.heartRate.trend.filteredDates).toEqual(mockFilteredDates);
      expect(selectors.bodyBattery.trend.filteredDates).toEqual(mockFilteredDates);

      // Vérifier que la date sélectionnée est cohérente
      expect(selectors.metadata.selectedDate).toBe(mockSelectedDate);
      expect(selectors.heartRate.trend.selectedDate).toBe(mockSelectedDate);

      // Vérifier que displayInfo est préservé
      expect(selectors.metadata.displayInfo).toEqual(mockDisplayInfo);
      expect(selectors.heartRate.trend.displayInfo).toEqual(mockDisplayInfo);
    });
  });

  describe('buildDerivedDataset', () => {
    it('devrait construire un dataset dérivé avec chartData et selectors', async () => {
      const derived = await buildDerivedDataset({
        dailyMetrics: mockDailyMetrics,
        activities: mockActivities,
        dates: mockFilteredDates,
        anchorDate: mockSelectedDate,
        displayInfo: mockDisplayInfo,
        colors: mockColors
      });

      // Vérifier que le dataset contient à la fois chartData et selectors
      expect(derived).toHaveProperty('heartRateTrend');
      expect(derived).toHaveProperty('bodyBatteryTrend');
      expect(derived).toHaveProperty('selectors');

      // Vérifier que selectors est bien structuré
      expect(derived.selectors).toHaveProperty('heartRate');
      expect(derived.selectors).toHaveProperty('metadata');
    });

    it('devrait garantir la parité entre chartData et selectors', async () => {
      const derived = await buildDerivedDataset({
        dailyMetrics: mockDailyMetrics,
        activities: mockActivities,
        dates: mockFilteredDates,
        anchorDate: mockSelectedDate,
        displayInfo: mockDisplayInfo,
        colors: mockColors
      });

      // Vérifier que les données de trend sont cohérentes
      const trendDataFromChart = derived.heartRateTrend.data;
      const trendDataFromSelector = derived.selectors.heartRate.trend.data;

      expect(trendDataFromChart.length).toBe(trendDataFromSelector.length);

      // Vérifier que les dates filtrées sont identiques
      expect(derived.filteredDates).toEqual(derived.selectors.metadata.filteredDates);
      expect(derived.effectiveSelectedDate).toBe(derived.selectors.metadata.selectedDate);
    });

    it('devrait produire un snapshot stable pour buildDerivedDataset', async () => {
      const derived = await buildDerivedDataset({
        dailyMetrics: mockDailyMetrics,
        activities: mockActivities,
        dates: mockFilteredDates,
        anchorDate: mockSelectedDate,
        displayInfo: mockDisplayInfo,
        colors: mockColors
      });

      // Snapshot de la structure (sans données volumineuses)
      const snapshot = {
        hasChartData: {
          heartRateTrend: Boolean(derived.heartRateTrend),
          bodyBatteryTrend: Boolean(derived.bodyBatteryTrend),
          stressTrend: Boolean(derived.stressTrend),
          sleepTrend: Boolean(derived.sleepTrend),
          respirationTrend: Boolean(derived.respirationTrend),
          activityHeatmap: Boolean(derived.activityHeatmap),
          heartRateTimeSeries: Boolean(derived.heartRateTimeSeries)
        },
        hasSelectors: Boolean(derived.selectors),
        selectorsStructure: {
          hasHeartRate: Boolean(derived.selectors?.heartRate),
          hasRespiration: Boolean(derived.selectors?.respiration),
          hasBodyBattery: Boolean(derived.selectors?.bodyBattery),
          hasStress: Boolean(derived.selectors?.stress),
          hasSleep: Boolean(derived.selectors?.sleep),
          hasActivity: Boolean(derived.selectors?.activity),
          hasMetadata: Boolean(derived.selectors?.metadata)
        },
        dataLengths: {
          heartRateTrend: derived.heartRateTrend?.data?.length || 0,
          bodyBatteryTrend: derived.bodyBatteryTrend?.data?.length || 0,
          stressTrend: derived.stressTrend?.data?.length || 0,
          sleepTrend: derived.sleepTrend?.data?.length || 0,
          respirationTrend: derived.respirationTrend?.data?.length || 0
        },
        metadata: {
          filteredDatesLength: derived.filteredDates?.length || 0,
          effectiveSelectedDate: derived.effectiveSelectedDate,
          selectorsSelectedDate: derived.selectors?.metadata?.selectedDate
        }
      };

      expect(snapshot).toMatchSnapshot();
    });
  });
});


