import fs from 'fs';

const text = fs.readFileSync('src/utils/sport/recapPeriodDiscoveries.js', 'utf8');
const helpers = [
  'emptyMeasure', 'musclesFromRecapState', 'calendarLoad', 'measureRecapWindow',
  'buildPeriodComparisons', 'buildPeriodComparisonsAsync', 'sessionRhythmClause',
  'detectDiscoveries', 'appendMilestoneDiscoveries', 'maxConsecutiveTrainingDays',
  'monthSleepExplain', 'formatYmFr', 'bestCalendarMonths', 'periodTraceMetrics',
  'memoryFactor', 'PERIOD_DISCOVERY_PRIORITY', 'rivalBlocked', 'crossNatureRivalBlocked',
  'discoveryIdentity', 'discoveryInformativeValue', 'findRivalInSelected', 'inferDropReason',
  'selectPeriodDiscoveriesWithTrace', 'selectPeriodDiscoveries', 'refillAfterGate',
  'buildPeriodDiscoveryBundle', 'buildPeriodDiscoveryBundleAsync', 'periodDiscoveryKindSet',
  'observationCaps'
];

for (const h of helpers) {
  const re = new RegExp(`\\b${h}\\b`, 'g');
  const matches = [...text.matchAll(re)];
  console.log(`${h}: ${matches.length} refs`);
}
