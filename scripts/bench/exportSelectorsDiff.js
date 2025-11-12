/**
 * Génère un export Garmin synthétique et vérifie la parité
 * entre l'ancien pipeline (chartData) et les nouveaux selectors.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { buildDerivedDataset } from '../../src/components/tabs/GarminTab/utils/chartDataBuilders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const buildSampleDailyMetrics = (startDate, days) => {
  const metrics = {};
  const start = new Date(startDate);
  for (let i = 0; i < days; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const iso = date.toISOString().split('T')[0];
    metrics[iso] = {
      date: iso,
      steps: 6000 + i * 250,
      distance: Number((4 + i * 0.1).toFixed(2)),
      calories: {
        total: 2000 + i * 30,
        active: 500 + i * 15,
        resting: 1500 + i * 15
      },
      heartRate: {
        resting: 52 + (i % 5),
        max: 160 + (i % 7) * 3,
        avg: 110 + (i % 4) * 2,
        timeSeries: []
      },
      bodyBattery: {
        start: 72 - i,
        end: 48 - i * 0.5,
        min: 40 - i,
        max: 85 - i * 0.8,
        totalRecovery: 120 - i * 2
      },
      stress: {
        total: 35 + (i % 6) * 4,
        average: 38 + (i % 5) * 3
      },
      sleep: {
        duration: 420 + (i % 3) * 15,
        deepSleep: 95 + (i % 4) * 5,
        lightSleep: 250 + (i % 5) * 4,
        remSleep: 80 + (i % 3) * 6,
        quality: 75 + (i % 4) * 2
      },
      respiration: {
        awake: { avg: 14 + (i % 3) * 0.4 },
        sleep: { avg: 13 + (i % 4) * 0.5 }
      },
      intensityMinutes: {
        total: 45 + (i % 5) * 5,
        moderate: 25 + (i % 4) * 3,
        vigorous: 18 + (i % 3) * 2
      }
    };
  }
  return metrics;
};

const buildSampleActivities = (dates) => {
  const types = ['swimming', 'jumpRope', 'cardio'];
  const activities = {
    swimming: [],
    jumpRope: [],
    cardio: []
  };
  dates.forEach((date, idx) => {
    const type = types[idx % types.length];
    activities[type].push({
      id: `${type}_${date}_${idx}`,
      date,
      type,
      duration: 1200 + idx * 30,
      distance: Number((1.2 + idx * 0.05).toFixed(2)),
      calories: 200 + idx * 10,
      lastSynced: new Date().toISOString()
    });
  });
  return activities;
};

const dailyMetrics = buildSampleDailyMetrics('2025-10-01', 30);
const dates = Object.keys(dailyMetrics).sort();
const activities = buildSampleActivities(dates);

const derived = buildDerivedDataset({
  dailyMetrics,
  activities,
  dates,
  anchorDate: dates[dates.length - 1],
  displayInfo: 'sample-export'
});

if (!derived) {
  throw new Error('Derived dataset generation failed');
}

const legacyView = JSON.parse(JSON.stringify(derived));
delete legacyView.selectors;

const exportDir = path.resolve(__dirname, '..', '..', 'logs', 'garmin');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

const afterPath = path.join(exportDir, 'export-phase8-after.json');
const legacyPath = path.join(exportDir, 'export-phase8-legacy.json');

fs.writeFileSync(afterPath, JSON.stringify(derived, null, 2));
fs.writeFileSync(legacyPath, JSON.stringify(legacyView, null, 2));

const hashLegacy = crypto.createHash('sha256').update(JSON.stringify(legacyView)).digest('hex');

const summary = {
  legacyHash: hashLegacy,
  selectorBuckets: Object.keys(derived.selectors),
  parity: {
    heartRateTrend: {
      trendPoints: derived.heartRateTrend?.data?.length ?? 0,
      selectorPoints: derived.selectors.heartRate.trend.data.length,
      yAxisDomainEqual: JSON.stringify(derived.heartRateTrend?.yAxisDomain ?? null) === JSON.stringify(derived.selectors.heartRate.trend.yAxisDomain)
    },
    heartRateTimeSeries: {
      points: derived.heartRateTimeSeries?.chartData?.length ?? 0,
      selectorPoints: derived.selectors.heartRate.timeSeries.chartData.length,
      hasCurve: Boolean(derived.heartRateTimeSeries?.hasEnoughDataForCurve),
      selectorHasCurve: derived.selectors.heartRate.timeSeries.hasEnoughDataForCurve
    },
    respirationTrend: {
      trendPoints: derived.respirationTrend?.data?.length ?? 0,
      selectorPoints: derived.selectors.respiration.trend.data.length
    },
    sleepTrend: {
      trendPoints: derived.sleepTrend?.data?.length ?? 0,
      selectorPoints: derived.selectors.sleep.trend.data.length,
      averageDuration: derived.sleepTrend?.averageDuration ?? null,
      selectorAverageDuration: derived.selectors.sleep.trend.averageDuration
    },
    activityHeatmap: {
      weeks: derived.activityHeatmap?.weeks?.length ?? 0,
      selectorWeeks: derived.selectors.activity.heatmap.weeks.length
    },
    correlation: {
      sleepPoints: derived.correlation?.sleepPerformanceData?.length ?? 0,
      selectorSleepPoints: derived.selectors.sleep.correlation.sleepPerformanceData.length,
      activityPoints: derived.correlation?.batteryIntensityData?.length ?? 0,
      selectorActivityPoints: derived.selectors.activity.correlation.batteryIntensityData.length
    }
  }
};

console.log(JSON.stringify(summary, null, 2));


