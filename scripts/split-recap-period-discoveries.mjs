/**
 * Extraction mécanique à comportement équivalent de recapPeriodDiscoveries.js.
 * Ne change pas la logique — découpe + barrel de réexport.
 */
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve('src/utils/sport');
const SRC = path.join(ROOT, 'recapPeriodDiscoveries.js');
const lines = fs.readFileSync(SRC, 'utf8').split('\n');

function slice(start1, end1Inclusive) {
  return lines.slice(start1 - 1, end1Inclusive).join('\n');
}

function findLine(substr, from = 0) {
  for (let i = from; i < lines.length; i += 1) {
    if (lines[i].includes(substr)) return i + 1;
  }
  throw new Error(`marker not found: ${substr}`);
}

// --- Markers (1-indexed) ---
const L_HEADER_END = findLine('export const PERIOD_QUESTIONS') - 1; // imports only before this
const L_PERIOD_QUESTIONS = findLine('export const PERIOD_QUESTIONS');
const L_OBS_CAPS = findLine('export function observationCaps');
const L_EMPTY_MEASURE = findLine('function emptyMeasure');
const L_MEASURE = findLine('export function measureRecapWindow');
const L_COMPARISONS = findLine('export function buildPeriodComparisons');
const L_DETECT = findLine('function detectDiscoveries');
const L_PRIORITY = findLine('export const PERIOD_DISCOVERY_PRIORITY');
const L_BUNDLE = findLine('export function buildPeriodDiscoveryBundle');
const L_ASYNC = findLine('export async function buildPeriodDiscoveryBundleAsync');
const L_KINDSET = findLine('export function periodDiscoveryKindSet');

console.log({
  L_HEADER_END,
  L_PERIOD_QUESTIONS,
  L_OBS_CAPS,
  L_EMPTY_MEASURE,
  L_MEASURE,
  L_COMPARISONS,
  L_DETECT,
  L_PRIORITY,
  L_BUNDLE,
  L_ASYNC,
  L_KINDSET,
  total: lines.length
});

const IMPORTS_BLOCK = slice(1, L_HEADER_END).trimEnd();

// Shared constants + voice/format/discovery factory live until emptyMeasure
const VOICE_BODY = slice(L_PERIOD_QUESTIONS, L_EMPTY_MEASURE - 1).trimEnd();
const MEASURE_BODY = slice(L_EMPTY_MEASURE, L_COMPARISONS - 1).trimEnd();
const COMPARISONS_BODY = slice(L_COMPARISONS, L_DETECT - 1).trimEnd();
const DETECT_BODY = slice(L_DETECT, L_PRIORITY - 1).trimEnd();
const SELECTION_BODY = slice(L_PRIORITY, L_BUNDLE - 1).trimEnd();
const BUNDLE_BODY = slice(L_BUNDLE, lines.length).trimEnd();

const voiceFile = `/**
 * Voix période, formatters et fabrique de découvertes Recap.
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { SIGNAL_FAMILY_CAPS } from './recapInsightNature';
import { CONTENT_CLASS, resolveContentClass } from './recapDiscoveryContentClass';

${VOICE_BODY}

export {
  isLongVoice,
  periodVerb,
  agreeEst,
  agreeVerb,
  agreePorteLabel,
  weekdayFr,
  lastCatalogSession,
  sameWeekdaySessions,
  muscleAvecArticle,
  capLabel,
  musclePortrait,
  peakPortrait,
  runPortrait,
  kcalPortrait,
  periodPortraitTail,
  continuityTail,
  fmtInt,
  fmt1,
  mean,
  fmtPct,
  fmtSignedPct,
  pctChange,
  share,
  windowFromEnd,
  refFromYmd,
  dayCheckedReps,
  scoreOf,
  coerceEvidenceLine,
  discovery,
  muscleLabel,
  MUSCLE_FR,
  PUSH_GROUPS,
  PULL_GROUPS,
  UPPER_GROUPS,
  LOWER_GROUPS
};
`;

// Fix: MUSCLE_FR etc. are const not exported — need to export them in VOICE_BODY or change to export const
// Safer: rewrite const to export const for the group sets and MUSCLE_FR in the generated file.

const voiceFixed = voiceFile
  .replace('const MUSCLE_FR =', 'export const MUSCLE_FR =')
  .replace('const PUSH_GROUPS =', 'export const PUSH_GROUPS =')
  .replace('const PULL_GROUPS =', 'export const PULL_GROUPS =')
  .replace('const UPPER_GROUPS =', 'export const UPPER_GROUPS =')
  .replace('const LOWER_GROUPS =', 'export const LOWER_GROUPS =')
  .replace('function periodVerb', 'export function periodVerb')
  .replace('function muscleLabel', 'export function muscleLabel')
  .replace('function isLongVoice', 'export function isLongVoice')
  .replace('function agreeEst', 'export function agreeEst')
  .replace('function agreeVerb', 'export function agreeVerb')
  .replace('function agreePorteLabel', 'export function agreePorteLabel')
  .replace('function weekdayFr', 'export function weekdayFr')
  .replace('function lastCatalogSession', 'export function lastCatalogSession')
  .replace('function sameWeekdaySessions', 'export function sameWeekdaySessions')
  .replace('function muscleAvecArticle', 'export function muscleAvecArticle')
  .replace('function capLabel', 'export function capLabel')
  .replace('function musclePortrait', 'export function musclePortrait')
  .replace('function peakPortrait', 'export function peakPortrait')
  .replace('function runPortrait', 'export function runPortrait')
  .replace('function kcalPortrait', 'export function kcalPortrait')
  .replace('function periodPortraitTail', 'export function periodPortraitTail')
  .replace('function continuityTail', 'export function continuityTail')
  .replace('function fmtInt', 'export function fmtInt')
  .replace('function fmt1', 'export function fmt1')
  .replace('function mean', 'export function mean')
  .replace('function fmtPct', 'export function fmtPct')
  .replace('function fmtSignedPct', 'export function fmtSignedPct')
  .replace('function pctChange', 'export function pctChange')
  .replace('function share', 'export function share')
  .replace('function windowFromEnd', 'export function windowFromEnd')
  .replace('function refFromYmd', 'export function refFromYmd')
  .replace('function dayCheckedReps', 'export function dayCheckedReps')
  .replace('function scoreOf', 'export function scoreOf')
  .replace('function coerceEvidenceLine', 'export function coerceEvidenceLine')
  .replace('function discovery(', 'export function discovery(');

// Remove trailing export { } block that duplicates — simplify voice file
const voiceClean = voiceFixed.replace(/\nexport \{[\s\S]*\};\s*$/, '\n');

fs.writeFileSync(path.join(ROOT, 'recapPeriodVoice.js'), voiceClean);
console.log('wrote recapPeriodVoice.js', voiceClean.split('\n').length);

// Continue in next part of script via writing remaining files...
fs.writeFileSync(
  path.join(ROOT, '_split_markers.json'),
  JSON.stringify(
    {
      L_EMPTY_MEASURE,
      L_MEASURE,
      L_COMPARISONS,
      L_DETECT,
      L_PRIORITY,
      L_BUNDLE,
      ranges: {
        measure: [L_EMPTY_MEASURE, L_COMPARISONS - 1],
        comparisons: [L_COMPARISONS, L_DETECT - 1],
        detect: [L_DETECT, L_PRIORITY - 1],
        selection: [L_PRIORITY, L_BUNDLE - 1],
        bundle: [L_BUNDLE, lines.length]
      }
    },
    null,
    2
  )
);

// Save bodies for second pass
fs.writeFileSync(path.join(ROOT, '_split_measure_body.js.txt'), MEASURE_BODY);
fs.writeFileSync(path.join(ROOT, '_split_comparisons_body.js.txt'), COMPARISONS_BODY);
fs.writeFileSync(path.join(ROOT, '_split_detect_body.js.txt'), DETECT_BODY);
fs.writeFileSync(path.join(ROOT, '_split_selection_body.js.txt'), SELECTION_BODY);
fs.writeFileSync(path.join(ROOT, '_split_bundle_body.js.txt'), BUNDLE_BODY);
console.log('bodies saved');
