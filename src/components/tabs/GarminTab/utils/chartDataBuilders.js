import { prepareTimeSeriesForDisplay, enrichHeartRateTimeSeriesForVisualization } from '../../../../utils/garminTimeSeriesUtils';
import { normalizeActivityValue } from '../../../../utils/chartComparison';

const DAY_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

const toNumber = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object') {
    if (value.value !== undefined) return toNumber(value.value);
    if (value.avg !== undefined) return toNumber(value.avg);
    if (value.average !== undefined) return toNumber(value.average);
    if (value.mean !== undefined) return toNumber(value.mean);
    if (value.total !== undefined) return toNumber(value.total);
    if (Array.isArray(value)) {
      const samples = value.map((item) => toNumber(item)).filter((num) => num !== null);
      if (samples.length === 0) return null;
      const sum = samples.reduce((acc, num) => acc + num, 0);
      return sum / samples.length;
    }
  }
  return null;
};

const minutesFromHours = (value) => {
  const num = toNumber(value);
  return num === null ? null : Math.round(num * 60);
};

const getBodyBatteryValue = (bodyBattery) => {
  if (bodyBattery === null || bodyBattery === undefined) return null;
  if (typeof bodyBattery === 'number') return bodyBattery;
  if (typeof bodyBattery === 'object') {
    if (bodyBattery.current !== undefined) return toNumber(bodyBattery.current);
    if (bodyBattery.value !== undefined) return toNumber(bodyBattery.value);
  }
  return null;
};

const getStressValue = (stress) => {
  if (stress === null || stress === undefined) return null;
  if (typeof stress === 'number') return stress;
  if (typeof stress === 'object') {
    if (stress.average !== undefined) return toNumber(stress.average);
    if (stress.avg !== undefined) return toNumber(stress.avg);
    if (stress.avgStressLevel !== undefined) return toNumber(stress.avgStressLevel);
    if (stress.value !== undefined) return toNumber(stress.value);
  }
  return null;
};

const buildHeartRateTrend = (dailyMetrics, filteredDates, effectiveSelectedDate) => {
  const data = filteredDates.map((date) => {
    const dm = dailyMetrics[date] || {};
    const hr = dm.heartRate || {};
    return {
      date,
      resting: toNumber(hr.resting ?? dm.restingHeartRate ?? dm.restingHR),
      max: toNumber(hr.max ?? dm.maxHeartRate ?? dm.maxHR),
      avg: toNumber(hr.avg ?? hr.average ?? dm.avgHeartRate ?? dm.averageHeartRate),
      isSelected: date === effectiveSelectedDate
    };
  }).filter((entry) => entry.resting !== null || entry.max !== null || entry.avg !== null);

  if (data.length === 0) {
    return { data: [], yAxisDomain: [0, 180] };
  }

  let minValue = Infinity;
  let maxValue = -Infinity;

  data.forEach((entry) => {
    ['resting', 'max', 'avg'].forEach((key) => {
      const value = entry[key];
      if (value !== null && value !== undefined) {
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      }
    });
  });

  if (minValue === Infinity || maxValue === -Infinity) {
    return { data, yAxisDomain: [0, 180] };
  }

  const range = maxValue - minValue;
  const margin = Math.max(range * 0.1, 10);
  const domainMin = Math.max(0, Math.floor(minValue - margin));
  const domainMax = Math.min(220, Math.ceil(maxValue + margin));

  return {
    data,
    yAxisDomain: [domainMin, domainMax]
  };
};

const buildBodyBatteryTrend = (dailyMetrics, filteredDates, effectiveSelectedDate) => {
  const data = filteredDates.map((date) => {
    const dm = dailyMetrics[date] || {};
    return {
      date,
      bodyBattery: getBodyBatteryValue(dm.bodyBattery),
      isSelected: date === effectiveSelectedDate
    };
  }).filter((entry) => entry.bodyBattery !== null);

  const average = data.length
    ? data.reduce((sum, entry) => sum + entry.bodyBattery, 0) / data.length
    : 0;

  return { data, average };
};

const buildStressTrend = (dailyMetrics, filteredDates, effectiveSelectedDate) => {
  const data = filteredDates.map((date) => {
    const dm = dailyMetrics[date] || {};
    return {
      date,
      stress: getStressValue(dm.stress),
      isSelected: date === effectiveSelectedDate
    };
  }).filter((entry) => entry.stress !== null);

  const average = data.length
    ? data.reduce((sum, entry) => sum + entry.stress, 0) / data.length
    : 0;

  return { data, average };
};

const buildSleepTrend = (dailyMetrics, filteredDates, effectiveSelectedDate) => {
  const data = filteredDates.map((date) => {
    const dm = dailyMetrics[date] || {};
    const sleep = dm.sleep || {};
    return {
      date,
      duration: minutesFromHours(sleep.duration),
      deepSleep: minutesFromHours(sleep.deepSleep),
      lightSleep: minutesFromHours(sleep.lightSleep),
      remSleep: minutesFromHours(sleep.remSleep),
      quality: toNumber(sleep.quality),
      isSelected: date === effectiveSelectedDate
    };
  }).filter((entry) => entry.duration !== null || entry.quality !== null);

  const durationEntries = data.filter((entry) => entry.duration !== null);
  const averageDuration = durationEntries.length
    ? durationEntries.reduce((sum, entry) => sum + entry.duration, 0) / durationEntries.length
    : 0;

  return { data, averageDuration };
};

const buildRespirationTrend = (dailyMetrics, filteredDates, effectiveSelectedDate) => {
  const data = filteredDates.map((date) => {
    const dm = dailyMetrics[date] || {};
    const resp = dm.respiration || {};
    const awake = resp.awake || {};
    const sleep = resp.sleep || {};
    return {
      date,
      awakeMin: toNumber(awake.min),
      awakeAvg: toNumber(awake.avg ?? awake.average ?? awake.mean),
      awakeMax: toNumber(awake.max),
      sleepMin: toNumber(sleep.min),
      sleepAvg: toNumber(sleep.avg ?? sleep.average ?? sleep.mean),
      sleepMax: toNumber(sleep.max),
      isSelected: date === effectiveSelectedDate
    };
  }).filter((entry) => entry.awakeAvg !== null || entry.sleepAvg !== null);

  const awakeEntries = data.filter((entry) => entry.awakeAvg !== null);
  const sleepEntries = data.filter((entry) => entry.sleepAvg !== null);

  const avgAwake = awakeEntries.length
    ? awakeEntries.reduce((sum, entry) => sum + entry.awakeAvg, 0) / awakeEntries.length
    : 0;
  const avgSleep = sleepEntries.length
    ? sleepEntries.reduce((sum, entry) => sum + entry.sleepAvg, 0) / sleepEntries.length
    : 0;

  return { data, avgAwake, avgSleep };
};

const buildCorrelationData = (dailyMetrics, filteredDates, effectiveSelectedDate) => {
  const extractNumeric = toNumber;

  const sleepPerformanceData = filteredDates.map((date) => {
    const dm = dailyMetrics[date] || {};
    const sleep = dm.sleep || {};
    return {
      date,
      sleepDuration: sleep.duration ? Math.round(sleep.duration * 60) : null,
      sleepQuality: extractNumeric(sleep.quality),
      steps: extractNumeric(dm.steps ?? dm.totalSteps),
      intensityMinutes: extractNumeric(dm.intensityMinutes?.total ?? dm.intensityMinutes),
      bodyBattery: extractNumeric(dm.bodyBattery),
      isSelected: date === effectiveSelectedDate
    };
  }).filter((entry) => entry.sleepDuration !== null || entry.steps !== null);

  const batteryIntensityData = filteredDates.map((date) => {
    const dm = dailyMetrics[date] || {};
    return {
      date,
      bodyBattery: extractNumeric(dm.bodyBattery),
      intensityTotal: extractNumeric(dm.intensityMinutes?.total ?? dm.intensityMinutes),
      intensityModerate: extractNumeric(dm.intensityMinutes?.moderate),
      intensityVigorous: extractNumeric(dm.intensityMinutes?.vigorous),
      steps: extractNumeric(dm.steps ?? dm.totalSteps),
      isSelected: date === effectiveSelectedDate
    };
  }).filter((entry) => entry.bodyBattery !== null && entry.intensityTotal !== null);

  return {
    sleepPerformanceData,
    batteryIntensityData
  };
};

const buildActivityHeatmap = (activities = {}, filteredDates = []) => {
  const resultByDate = {};

  const ensureDayEntry = (date) => {
    if (!resultByDate[date]) {
      resultByDate[date] = {
        date,
        total: 0,
        swimming: 0,
        jumpRope: 0,
        cardio: 0,
        distance: 0,
        duration: 0
      };
    }
    return resultByDate[date];
  };

  const incrementDay = (date, field, activity) => {
    const entry = ensureDayEntry(date);
    entry.total += 1;
    entry[field] += 1;
    entry.distance += normalizeActivityValue(activity?.distance);
    entry.duration += normalizeActivityValue(activity?.duration);
  };

  ['swimming', 'jumpRope', 'cardio'].forEach((type) => {
    const acts = activities?.[type] || [];
    acts.forEach((activity) => {
      const date = activity?.date;
      if (!date || !filteredDates.includes(date)) return;
      const field = type === 'swimming' ? 'swimming' : type === 'jumpRope' ? 'jumpRope' : 'cardio';
      incrementDay(date, field, activity);
    });
  });

  const weeklyData = {};

  filteredDates.forEach((date) => {
    const current = new Date(date);
    const weekStart = new Date(current);
    weekStart.setDate(current.getDate() - current.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = {
        week: weekKey,
        days: {},
        total: 0
      };
    }

    const dayName = DAY_NAMES[current.getDay()];
    weeklyData[weekKey].days[dayName] =
      resultByDate[date] || { date, total: 0, swimming: 0, jumpRope: 0, cardio: 0, distance: 0, duration: 0 };
    weeklyData[weekKey].total += resultByDate[date]?.total || 0;
  });

  const weeks = Object.values(weeklyData)
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8);

  return {
    activityByDate: resultByDate,
    weeks
  };
};

const buildHeartRateTimeSeries = (dailyMetrics, activities, selectedDate) => {
  if (!selectedDate) {
    return {
      enriched: null,
      chartData: [],
      stats: null,
      hasEnoughDataForCurve: false,
      realPointsCount: 0
    };
  }

  const metrics = dailyMetrics[selectedDate];
  if (!metrics) {
    return {
      enriched: null,
      chartData: [],
      stats: null,
      hasEnoughDataForCurve: false,
      realPointsCount: 0
    };
  }

  const rawTimeSeries = metrics?.heartRate?.timeSeries || [];
  const preparedSeries = prepareTimeSeriesForDisplay(rawTimeSeries, { useCache: true });

  const maxHR = metrics?.heartRate?.max ?? null;
  const restingHR = metrics?.heartRate?.resting ?? null;

  const enriched = enrichHeartRateTimeSeriesForVisualization(preparedSeries, {
    maxHR,
    restingHR,
    enableDownsampling: preparedSeries.length > 1000,
    downsamplingThreshold: 1000,
    targetPoints: 500
  });

  const realPointsCount = preparedSeries.length;
  const hasEnoughDataForCurve = enriched.timeSeries.length >= 10;

  const chartData = enriched.timeSeries
    .map((point) => {
      let timestamp = point.timestamp;
      if (typeof timestamp === 'string') {
        timestamp = new Date(timestamp).getTime();
      }
      if (typeof timestamp !== 'number') {
        return null;
      }
      const bpm = typeof point.bpm === 'number' ? point.bpm : parseFloat(point.bpm) || 0;
      const date = new Date(timestamp);
      if (Number.isNaN(date.getTime())) return null;
      return {
        time: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        timestamp,
        bpm,
        hour: date.getHours(),
        minute: date.getMinutes(),
        isReal: point.isReal === true,
        isActivity: point.isActivity === true
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (chartData.length > 0) {
    const dayStart = new Date(`${selectedDate}T00:00:00`).getTime();
    const dayEnd = new Date(`${selectedDate}T23:59:59`).getTime();
    const firstPoint = chartData[0];
    const lastPoint = chartData[chartData.length - 1];

    if (firstPoint.timestamp > dayStart + 5 * 60 * 1000) {
      chartData.unshift({
        time: '00:00',
        timestamp: dayStart,
        bpm: null,
        hour: 0,
        minute: 0,
        isReal: false,
        isVirtual: true,
        isActivity: false
      });
    }

    if (lastPoint.timestamp < dayEnd - 5 * 60 * 1000) {
      chartData.push({
        time: '23:59',
        timestamp: dayEnd,
        bpm: null,
        hour: 23,
        minute: 59,
        isReal: false,
        isVirtual: true,
        isActivity: false
      });
    }
  }

  const bpmValues = enriched.timeSeries.map((point) => point.bpm).filter((value) => typeof value === 'number' && value > 0);
  const stats = bpmValues.length
    ? {
        min: Math.min(...bpmValues),
        max: Math.max(...bpmValues),
        avg: Math.round(bpmValues.reduce((sum, bpm) => sum + bpm, 0) / bpmValues.length),
        resting: restingHR,
        maxHR
      }
    : null;

  const enrichedWithMeta = {
    ...enriched,
    hasEnoughDataForCurve,
    realPointsCount
  };

  if (!enrichedWithMeta.stats && stats) {
    enrichedWithMeta.stats = stats;
  }

  return {
    enriched: enrichedWithMeta,
    chartData,
    stats: stats || enrichedWithMeta.stats || null,
    hasEnoughDataForCurve,
    realPointsCount,
    selectedDate
  };
};

export const buildGarminChartDataset = ({
  dailyMetrics = {},
  activities = {},
  filteredDates = [],
  selectedDate = null,
  effectiveSelectedDate = null,
  displayInfo = null
} = {}) => {
  const heartRateTrend = buildHeartRateTrend(dailyMetrics, filteredDates, effectiveSelectedDate);
  const bodyBatteryTrend = buildBodyBatteryTrend(dailyMetrics, filteredDates, effectiveSelectedDate);
  const stressTrend = buildStressTrend(dailyMetrics, filteredDates, effectiveSelectedDate);
  const sleepTrend = buildSleepTrend(dailyMetrics, filteredDates, effectiveSelectedDate);
  const respirationTrend = buildRespirationTrend(dailyMetrics, filteredDates, effectiveSelectedDate);
  const correlation = buildCorrelationData(dailyMetrics, filteredDates, effectiveSelectedDate);
  const activityHeatmap = buildActivityHeatmap(activities, filteredDates);
  const heartRateTimeSeries = buildHeartRateTimeSeries(dailyMetrics, activities, selectedDate);

  return {
    filteredDates,
    displayInfo,
    effectiveSelectedDate,
    heartRateTrend: {
      ...heartRateTrend,
      filteredDates,
      displayInfo,
      selectedDate: effectiveSelectedDate
    },
    bodyBatteryTrend: {
      ...bodyBatteryTrend,
      filteredDates,
      displayInfo,
      selectedDate: effectiveSelectedDate
    },
    stressTrend: {
      ...stressTrend,
      filteredDates,
      displayInfo,
      selectedDate: effectiveSelectedDate
    },
    sleepTrend: {
      ...sleepTrend,
      filteredDates,
      displayInfo,
      selectedDate: effectiveSelectedDate
    },
    respirationTrend: {
      ...respirationTrend,
      filteredDates,
      displayInfo,
      selectedDate: effectiveSelectedDate
    },
    correlation: {
      ...correlation,
      filteredDates,
      displayInfo,
      selectedDate: effectiveSelectedDate
    },
    activityHeatmap: {
      ...activityHeatmap,
      filteredDates,
      displayInfo
    },
    heartRateTimeSeries
  };
};

export const buildDerivedDataset = ({
  dailyMetrics = {},
  activities = {},
  dates = [],
  anchorDate = null,
  displayInfo = null
} = {}) => {
  const filteredDates = Array.isArray(dates) ? [...dates] : [];
  if (filteredDates.length === 0 && dailyMetrics && typeof dailyMetrics === 'object') {
    filteredDates.push(...Object.keys(dailyMetrics).sort());
  } else {
    filteredDates.sort();
  }

  const fallbackDate = filteredDates.length ? filteredDates[filteredDates.length - 1] : null;
  const effectiveSelectedDate = filteredDates.includes(anchorDate)
    ? anchorDate
    : anchorDate || fallbackDate;

  return buildGarminChartDataset({
    dailyMetrics,
    activities,
    filteredDates,
    selectedDate: effectiveSelectedDate,
    effectiveSelectedDate,
    displayInfo
  });
};

