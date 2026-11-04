/**
 * Extraction mécanique à comportement équivalent.
 * Frontières :
 *   voice / measure / comparisons / detect / selection / orchestrator(barrel)
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src/utils/sport');
const SRC = path.join(ROOT, 'recapPeriodDiscoveries.js');
const BACKUP = path.join(ROOT, 'recapPeriodDiscoveries.js.pre-split.bak');

const original = fs.readFileSync(SRC, 'utf8');
if (!fs.existsSync(BACKUP)) {
  fs.writeFileSync(BACKUP, original);
  console.log('backup written');
}

const lines = original.split('\n');
const slice = (a, b) => lines.slice(a - 1, b).join('\n');

const findLine = (substr, from = 0) => {
  for (let i = from; i < lines.length; i += 1) {
    if (lines[i].includes(substr)) return i + 1;
  }
  throw new Error(`not found: ${substr}`);
};

const L_PERIOD_QUESTIONS = findLine('export const PERIOD_QUESTIONS');
const L_EMPTY_MEASURE = findLine('function emptyMeasure');
const L_COMPARISONS = findLine('export function buildPeriodComparisons');
const L_DETECT = findLine('function detectDiscoveries');
const L_MEMORY = findLine('function memoryFactor');
const L_BUNDLE = findLine('export function buildPeriodDiscoveryBundle');

// Promote private helpers that must be exported for cross-module use
function promoteExports(body, names) {
  let out = body;
  for (const name of names) {
    out = out.replace(new RegExp(`^function ${name}\\b`, 'm'), `export function ${name}`);
    out = out.replace(new RegExp(`^async function ${name}\\b`, 'm'), `export async function ${name}`);
    out = out.replace(new RegExp(`^const ${name}\\b`, 'm'), `export const ${name}`);
  }
  return out;
}

function ensureExportFunctions(body) {
  // Keep existing export; promote bare function that are already exported in original via export function
  return body;
}

// ---------- VOICE ----------
const voiceBody = promoteExports(
  slice(L_PERIOD_QUESTIONS, L_EMPTY_MEASURE - 1),
  [
    'MUSCLE_FR', 'PUSH_GROUPS', 'PULL_GROUPS', 'UPPER_GROUPS', 'LOWER_GROUPS',
    'periodVerb', 'muscleLabel', 'isLongVoice', 'agreeEst', 'agreeVerb', 'agreePorteLabel',
    'weekdayFr', 'lastCatalogSession', 'sameWeekdaySessions', 'muscleAvecArticle', 'capLabel',
    'musclePortrait', 'peakPortrait', 'runPortrait', 'kcalPortrait', 'periodPortraitTail',
    'continuityTail', 'fmtInt', 'fmt1', 'mean', 'fmtPct', 'fmtSignedPct', 'formatDurationFr',
    'pctChange', 'share', 'windowFromEnd', 'refFromYmd', 'dayCheckedReps', 'scoreOf',
    'coerceEvidenceLine', 'discovery'
  ]
);

const voiceFile = `/**
 * Voix période, formatters et fabrique de découvertes Recap.
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { SIGNAL_FAMILY_CAPS } from './recapInsightNature';
import { addCalendarDays } from './garminRunningPeriodStats';
import { formatDayFr } from './recapTrainingTimeline';
import { contentClassForKind } from './recapDiscoveryContentClass';
import { withDiscoveryScope } from './recapDiscoveryPeriodScope';

${voiceBody.trimEnd()}
`;

fs.writeFileSync(path.join(ROOT, 'recapPeriodVoice.js'), voiceFile);
console.log('voice', voiceFile.split('\n').length);

// ---------- MEASURE ----------
const measureBody = promoteExports(slice(L_EMPTY_MEASURE, L_COMPARISONS - 1), [
  'emptyMeasure',
  'musclesFromRecapState',
  'calendarLoad'
]);

const measureFile = `/**
 * Mesure d'une fenêtre Recap (reps, muscles, calendrier).
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { getDateStr } from '../dateUtils';
import {
  computeCalendarMonthSportStats,
  getCalendarSportStatsCache
} from '../calendarMonthSportStats';
import { normalizeDateString, isMockEnduranceSession, computeEnduranceDayMetricsForCalendar } from '../calendarUtils';
import { aggregateCheckedRepsByDateAndExerciseId, enduranceRepsForSession } from '../trainingLoadUtils';
import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { inclusiveCalendarSpanDays } from './garminRunningPeriodStats';
import { enumerateDatesInclusive } from './dailyDenseTimeSeries';
import {
  collectPushupEnduranceSessions,
  computeRecapMuscleState,
  RECAP_SYNTHETIC_ENDURANCE_PUSHUPS_ID,
  isDateInRecapWindow
} from './recapMuscleLoadEngine';
import { endurancePushupsAlreadyInWorkoutTotals } from '../../services/endurance/pushupEnduranceWorkoutKeys';
import {
  resolveExerciseNameForRecap,
  userFacingExerciseLabel
} from './recapStrengthPeriodStats';
import {
  PUSH_GROUPS,
  PULL_GROUPS,
  UPPER_GROUPS,
  LOWER_GROUPS,
  muscleLabel,
  share,
  refFromYmd,
  dayCheckedReps
} from './recapPeriodVoice';

${measureBody.trimEnd()}
`;

fs.writeFileSync(path.join(ROOT, 'recapPeriodMeasure.js'), measureFile);
console.log('measure', measureFile.split('\n').length);

// ---------- COMPARISONS ----------
const comparisonsBody = promoteExports(slice(L_COMPARISONS, L_DETECT - 1), ['sessionRhythmClause']);

const comparisonsFile = `/**
 * Comparaisons multi-fenêtres et clause de rythme.
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { getCalendarSportStatsCache } from '../calendarMonthSportStats';
import { aggregateCheckedRepsByDateAndExerciseId } from '../trainingLoadUtils';
import { addCalendarDays } from './garminRunningPeriodStats';
import { assertWindowMeasureConsistency } from './recapInsightValidate';
import { coopGate } from './recapComputeCoop';
import { previousWindow } from './recapPersonalBaselines';
import {
  PERIOD_QUESTIONS,
  periodVoice,
  fmtInt,
  formatDurationFr,
  windowFromEnd,
  refFromYmd
} from './recapPeriodVoice';
import { measureRecapWindow, emptyMeasure } from './recapPeriodMeasure';

${comparisonsBody.trimEnd()}
`;

fs.writeFileSync(path.join(ROOT, 'recapPeriodComparisons.js'), comparisonsFile);
console.log('comparisons', comparisonsFile.split('\n').length);

// ---------- DETECT (until just before memoryFactor) ----------
const detectBody = promoteExports(slice(L_DETECT, L_MEMORY - 1), [
  'detectDiscoveries',
  'appendMilestoneDiscoveries',
  'maxConsecutiveTrainingDays',
  'monthSleepExplain',
  'formatYmFr',
  'bestCalendarMonths',
  'periodTraceMetrics'
]);

const detectFile = `/**
 * Production des découvertes période (detectDiscoveries + helpers).
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { addCalendarDays, inclusiveCalendarSpanDays } from './garminRunningPeriodStats';
import { formatRateFr } from './athleteTrainingIdentity';
import { formatDayFr, daysBetweenYmd } from './recapTrainingTimeline';
import { createSetShiftReader } from './recapSetShift';
import { describeCalendarShape } from './recapCalendarShape';
import { describeStepReadings } from './recapStepReading';
import { describeRestDay } from './recapRestDayReading';
import { primaryGroup, sameDayCompanions, writeExerciseEvent } from './recapFactReading';
import { CONTENT_CLASS } from './recapDiscoveryContentClass';
import {
  buildExerciseTrajectory,
  renderExerciseTrajectoryCopy,
  trajectoryToMetrics
} from './exerciseTrajectoryAnalysis';
import {
  composeAnalyticalReading,
  densityImplication,
  pushPullImplication,
  volumeShapeImplication,
  peakDayImplication
} from './recapAnalyticalReading';
import { baselineTraceMetrics } from './recapPersonalBaselines';
import {
  detectFamilyFades,
  detectStructuralShifts,
  stimulusContrast,
  tallyStimulus
} from './recapStimulusCatalog';
import { detectRecapMilestones } from './recapMilestoneEngine';
import {
  buildMonthlyVolumeArcDiscoveries,
  buildRunningGapDiscoveries
} from './monthlyVolumeArcDiscoveries';
import { buildTrainingRhythmDiscoveries } from './trainingRhythmDiscoveries';
import { formatSleepHoursFr, formatSleepMinutesFr, summarizeRecentNights } from './recapSleepCorrelation';
import { comparableWeeklyRates } from './recapInsightNature';
import { sessionRhythmClause } from './recapPeriodComparisons';
import {
  periodVerb,
  isLongVoice,
  agreeEst,
  agreeVerb,
  agreePorteLabel,
  weekdayFr,
  lastCatalogSession,
  sameWeekdaySessions,
  muscleAvecArticle,
  capLabel,
  peakPortrait,
  runPortrait,
  kcalPortrait,
  periodPortraitTail,
  continuityTail,
  fmtInt,
  fmt1,
  fmtPct,
  fmtSignedPct,
  formatDurationFr,
  pctChange,
  share,
  discovery
} from './recapPeriodVoice';

${detectBody.trimEnd()}
`;

fs.writeFileSync(path.join(ROOT, 'recapPeriodDetectDiscoveries.js'), detectFile);
console.log('detect', detectFile.split('\n').length);

// ---------- SELECTION (memoryFactor → refillAfterGate) ----------
const selectionBody = promoteExports(slice(L_MEMORY, L_BUNDLE - 1), [
  'memoryFactor',
  'rivalBlocked',
  'crossNatureRivalBlocked',
  'discoveryIdentity',
  'discoveryInformativeValue',
  'findRivalInSelected',
  'inferDropReason',
  'refillAfterGate'
]);

const selectionFile = `/**
 * Priorités, scoring, rivalités et sélection éditoriale des découvertes période.
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { themeCountBeforeLocalDay } from './insightNoveltyStore';
import {
  SIGNAL_FAMILY_CAPS,
  TOTAL_SLEEP_BUDGET,
  signalFamilyOfKind
} from './recapInsightNature';
import { applyEditorialGate } from './recapEditorialGate';
import {
  CONTENT_CLASS,
  contentClassForKind,
  resolveContentClass,
  isMethodologyLimitDiscovery,
  reliabilityNoteFromMethodologyDiscovery
} from './recapDiscoveryContentClass';
import { P32B_KINDS } from './recapMuscleP32bDiscoveries';
import { P35_KINDS, P35_RIVAL_GROUPS } from './recapP35Kinds';
import { P36_KINDS, P36_RIVAL_GROUPS } from './recapP36Kinds';
import {
  applyEditorialInformativeValue,
  editorialCanTake,
  isWeakDescriptiveCard,
  phenomenonIdentity,
  classifyPhenomenon
} from './recapEditorialSelection';
import { isMilestoneKind } from './recapMilestoneEngine';

${selectionBody.trimEnd()}
`;

fs.writeFileSync(path.join(ROOT, 'recapPeriodSelection.js'), selectionFile);
console.log('selection', selectionFile.split('\n').length);

// ---------- ORCHESTRATOR / BARREL ----------
const bundleBody = slice(L_BUNDLE, lines.length);

const orchestratorFile = `/**
 * Découvertes scopées à la période Recap.
 *
 * Flux : données → comparaisons → constats → scoring → attribution d'angle.
 * Court / moyen / long = trois angles sur LA MÊME période, pas trois durées.
 *
 * Orchestrateur + réexports publics (API stable pour Worker / hooks / tests).
 * Modules :
 *   - recapPeriodVoice.js
 *   - recapPeriodMeasure.js
 *   - recapPeriodComparisons.js
 *   - recapPeriodDetectDiscoveries.js
 *   - recapPeriodSelection.js
 */

import { addCalendarDays } from './garminRunningPeriodStats';
import { signalFamilyOfKind } from './recapInsightNature';
import { buildSleepRhythmDiscoveries } from './sleepRhythmAnalysis';
import { buildThreadDiscoveries, rewriteSleepDiscoveries } from './recapAnalysisProofs';
import { applyEditorialGate } from './recapEditorialGate';
import { filterValidInsights, insightRejectReason } from './recapInsightValidate';
import { buildGtgUnplannedDiscoveries } from './recapGtgUnplannedReading';
import { buildProgramAdherenceDiscoveries } from './recapProgramAdherenceDiscoveries';
import { resolveContentClass } from './recapDiscoveryContentClass';
import { buildP32bMuscleDiscoveries } from './recapMuscleP32bDiscoveries';
import { buildP34RevisionDiscoveries } from './recapProgramRevisionP34';
import { buildP35Discoveries } from './recapP35Discoveries';
import { buildP36Discoveries } from './recapP36Discoveries';
import { coopGate, makeRecapComputeAbort } from './recapComputeCoop';
import { enrichDiscoveriesWithComposedEvidence } from './recapComposedEvidence';
import { polishDiscoveriesProse, editorialValidateDiscovery } from './recapEditorialPolish';
import {
  phenomenonIdentity,
  classifyPhenomenon,
  withRepairedDisplayName
} from './recapEditorialSelection';
import {
  buildExerciseBaselines,
  buildSessionCatalog,
  computeSleepPerformanceAssociation,
  computeRestPerformanceAssociation,
  findComparableSessions,
  sleepContextForDate
} from './recapPersonalBaselines';
import { extractSleepNightsInWindow } from './recapSleepNight';
import { isMilestoneKind } from './recapMilestoneEngine';
import {
  collectRunDays,
  pairSessionsWithNights,
  publishSleepCandidates,
  publishWindowSleepFacts
} from './recapSleepCorrelation';
import {
  buildPeriodActivityContext,
  filterDiscoveriesByPeriodScope,
  filterRunDaysToWindow
} from './recapDiscoveryPeriodScope';
import { discovery } from './recapPeriodVoice';
import {
  buildPeriodComparisons,
  buildPeriodComparisonsAsync
} from './recapPeriodComparisons';
import { detectDiscoveries } from './recapPeriodDetectDiscoveries';
import {
  selectPeriodDiscoveriesWithTrace,
  refillAfterGate,
  discoveryInformativeValue
} from './recapPeriodSelection';

// Réexports publics (API inchangée)
export {
  PERIOD_QUESTIONS,
  observationCaps,
  periodVoice,
  discovery
} from './recapPeriodVoice';
export { measureRecapWindow } from './recapPeriodMeasure';
export {
  buildPeriodComparisons,
  buildPeriodComparisonsAsync
} from './recapPeriodComparisons';
export {
  PERIOD_DISCOVERY_PRIORITY,
  selectPeriodDiscoveriesWithTrace,
  selectPeriodDiscoveries,
  discoveryInformativeValue,
  discoveryIdentity
} from './recapPeriodSelection';

${bundleBody.trimEnd()}
`;

fs.writeFileSync(SRC, orchestratorFile);
console.log('orchestrator', orchestratorFile.split('\n').length);

// Cleanup temp artifacts from first pass
for (const f of [
  '_split_markers.json',
  '_split_measure_body.js.txt',
  '_split_comparisons_body.js.txt',
  '_split_detect_body.js.txt',
  '_split_selection_body.js.txt',
  '_split_bundle_body.js.txt'
]) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

console.log('done');
