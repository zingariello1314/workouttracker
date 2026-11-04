import fs from 'fs';

const markers = JSON.parse(fs.readFileSync('src/utils/sport/_split_markers.json', 'utf8'));
const lines = fs.readFileSync('src/utils/sport/recapPeriodDiscoveries.js', 'utf8').split('\n');

const voiceFns = [
  'PERIOD_QUESTIONS', 'MUSCLE_FR', 'PUSH_GROUPS', 'PULL_GROUPS', 'UPPER_GROUPS', 'LOWER_GROUPS',
  'observationCaps', 'periodVerb', 'muscleLabel', 'periodVoice', 'isLongVoice', 'agreeEst',
  'agreeVerb', 'agreePorteLabel', 'weekdayFr', 'lastCatalogSession', 'sameWeekdaySessions',
  'muscleAvecArticle', 'capLabel', 'musclePortrait', 'peakPortrait', 'runPortrait', 'kcalPortrait',
  'periodPortraitTail', 'continuityTail', 'fmtInt', 'fmt1', 'mean', 'fmtPct', 'fmtSignedPct',
  'formatDurationFr', 'pctChange', 'share', 'windowFromEnd', 'refFromYmd', 'dayCheckedReps',
  'scoreOf', 'coerceEvidenceLine', 'discovery'
];

function body(range) {
  return lines.slice(range[0] - 1, range[1]).join('\n');
}

function used(text, names) {
  return names.filter((n) => new RegExp(`\\b${n}\\b`).test(text));
}

const sections = {
  measure: markers.ranges.measure,
  comparisons: markers.ranges.comparisons,
  detect: markers.ranges.detect,
  selection: markers.ranges.selection,
  bundle: markers.ranges.bundle
};

for (const [k, r] of Object.entries(sections)) {
  console.log(`${k}: ${used(body(r), voiceFns).join(', ')}`);
}

const detectHelpers = [
  'detectDiscoveries', 'appendMilestoneDiscoveries', 'maxConsecutiveTrainingDays',
  'monthSleepExplain', 'formatYmFr', 'bestCalendarMonths', 'periodTraceMetrics', 'memoryFactor'
];
console.log('sel->detect:', used(body(markers.ranges.selection), detectHelpers).join(', '));
console.log('bun->detect:', used(body(markers.ranges.bundle), detectHelpers).join(', '));
console.log(
  'bun->sel:',
  used(body(markers.ranges.bundle), [
    'PERIOD_DISCOVERY_PRIORITY',
    'selectPeriodDiscoveriesWithTrace',
    'selectPeriodDiscoveries',
    'refillAfterGate',
    'discoveryInformativeValue',
    'observationCaps',
    'rivalBlocked',
    'memoryFactor'
  ]).join(', ')
);
console.log(
  'bun->meas:',
  used(body(markers.ranges.bundle), [
    'measureRecapWindow',
    'buildPeriodComparisons',
    'buildPeriodComparisonsAsync',
    'sessionRhythmClause'
  ]).join(', ')
);
console.log(
  'cmp->meas:',
  used(body(markers.ranges.comparisons), [
    'measureRecapWindow',
    'emptyMeasure',
    'calendarLoad',
    'musclesFromRecapState',
    'windowFromEnd',
    'refFromYmd',
    'periodVoice'
  ]).join(', ')
);
console.log(
  'det->cmp:',
  used(body(markers.ranges.detect), [
    'buildPeriodComparisons',
    'sessionRhythmClause',
    'measureRecapWindow',
    'periodVoice',
    'discovery'
  ]).join(', ')
);

// Also check what original imports each section needs by scanning identifier usage of import names
const importNames = [
  'getDateStr', 'computeCalendarMonthSportStats', 'getCalendarSportStatsCache',
  'normalizeDateString', 'isMockEnduranceSession', 'computeEnduranceDayMetricsForCalendar',
  'aggregateCheckedRepsByDateAndExerciseId', 'enduranceRepsForSession', 'MuscleGroups',
  'addCalendarDays', 'inclusiveCalendarSpanDays', 'enumerateDatesInclusive',
  'collectPushupEnduranceSessions', 'computeRecapMuscleState', 'RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID',
  'isDateInRecapWindow', 'endurancePushupsAlreadyInWorkoutTotals', 'resolveExerciseNameForRecap',
  'userFacingExerciseLabel', 'formatRateFr', 'formatDayFr', 'daysBetweenYmd',
  'themeCountBeforeLocalDay', 'comparableWeeklyRates', 'SIGNAL_FAMILY_CAPS', 'TOTAL_SLEEP_BUDGET',
  'signalFamilyOfKind', 'buildSleepRhythmDiscoveries', 'buildThreadDiscoveries', 'rewriteSleepDiscoveries',
  'applyEditorialGate', 'assertWindowMeasureConsistency', 'filterValidInsights', 'insightRejectReason',
  'createSetShiftReader', 'describeCalendarShape', 'describeStepReadings', 'describeRestDay',
  'primaryGroup', 'sameDayCompanions', 'writeExerciseEvent', 'buildGtgUnplannedDiscoveries',
  'buildProgramAdherenceDiscoveries', 'CONTENT_CLASS', 'contentClassForKind', 'resolveContentClass',
  'isMethodologyLimitDiscovery', 'reliabilityNoteFromMethodologyDiscovery', 'buildP32bMuscleDiscoveries',
  'P32B_KINDS', 'buildP34RevisionDiscoveries', 'buildP35Discoveries', 'P35_KINDS', 'P35_RIVAL_GROUPS',
  'buildP36Discoveries', 'P36_KINDS', 'P36_RIVAL_GROUPS', 'coopGate', 'makeRecapComputeAbort',
  'buildExerciseTrajectory', 'renderExerciseTrajectoryCopy', 'trajectoryToMetrics',
  'enrichDiscoveriesWithComposedEvidence', 'polishDiscoveriesProse', 'editorialValidateDiscovery',
  'composeAnalyticalReading', 'densityImplication', 'pushPullImplication', 'volumeShapeImplication',
  'peakDayImplication', 'applyEditorialInformativeValue', 'editorialCanTake', 'isWeakDescriptiveCard',
  'phenomenonIdentity', 'classifyPhenomenon', 'withRepairedDisplayName', 'buildExerciseBaselines',
  'baselineTraceMetrics', 'buildSessionCatalog', 'computeSleepPerformanceAssociation',
  'computeRestPerformanceAssociation', 'findComparableSessions', 'previousWindow', 'sleepContextForDate',
  'detectFamilyFades', 'detectStructuralShifts', 'stimulusContrast', 'tallyStimulus',
  'extractSleepNightsInWindow', 'detectRecapMilestones', 'isMilestoneKind',
  'buildMonthlyVolumeArcDiscoveries', 'buildRunningGapDiscoveries', 'buildTrainingRhythmDiscoveries',
  'collectRunDays', 'formatSleepHoursFr', 'formatSleepMinutesFr', 'pairSessionsWithNights',
  'publishSleepCandidates', 'publishWindowSleepFacts', 'summarizeRecentNights',
  'buildPeriodActivityContext', 'filterDiscoveriesByPeriodScope', 'filterRunDaysToWindow',
  'withDiscoveryScope'
];

for (const [k, r] of Object.entries(sections)) {
  console.log(`\n${k} imports:`, used(body(r), importNames).join(', '));
}
