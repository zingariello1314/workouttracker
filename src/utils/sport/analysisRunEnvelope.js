/**
 * Mission 24 — enveloppe de run commune pour fingerprint / exports / rejeu.
 * Une seule construction des données réellement consommées.
 */

import { analysisEditionKey } from './analysisEdition';
import { snapshotFingerprint } from './analysisEnvironmentDossier';
import { freezeAnalyticalMemorySnapshot, emptyAnalyticalMemory } from './analyticalMemory';

/**
 * @param {object} opts
 * @param {object} opts.snapshot
 * @param {object} [opts.activeProgram]
 * @param {object} [opts.garminData]
 * @param {object} [opts.garminPartial]
 * @param {object} [opts.nameMap]
 * @param {object} [opts.analyticalMemory]
 * @param {string} [opts.analysisRunId]
 * @param {string} [opts.executionMode] product | replay | export | instrumented_recompute
 */
export function buildAnalysisRunEnvelope(opts = {}) {
  const {
    snapshot = null,
    activeProgram = null,
    programs = null,
    garminData = null,
    garminPartial = null,
    manualSleepByDate = null,
    nameMap = null,
    analyticalMemory = null,
    analysisRunId = null,
    executionMode = 'product',
    period = null,
    window = null
  } = opts;

  const garmin =
    garminData ||
    (garminPartial
      ? {
          sleep: garminPartial.sleep || null,
          dailyMetrics: garminPartial.dailyMetrics || null
        }
      : null);

  const resolvedNameMap =
    nameMap && typeof nameMap === 'object'
      ? nameMap
      : (() => {
          // Dériver depuis snapshot.reps si absent (parité app)
          const map = {};
          Object.keys(snapshot?.reps || {}).forEach((key) => {
            const id = key.includes('_') ? key.slice(key.indexOf('_') + 1) : key.slice(11);
            if (id && !map[id]) map[id] = id;
          });
          return Object.keys(map).length ? map : null;
        })();

  const fingerprint = snapshot
    ? snapshotFingerprint(snapshot, {
        activeProgram,
        programs,
        garminData: garmin,
        manualSleepByDate: manualSleepByDate || snapshot?.manualSleepByDate || null,
        nameMap: resolvedNameMap
      })
    : null;

  const memorySnapshot = freezeAnalyticalMemorySnapshot(
    analyticalMemory || emptyAnalyticalMemory()
  );

  const runId =
    analysisRunId ||
    `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    schema: 'momentum.analysisRunEnvelope.v1',
    analysisRunId: runId,
    edition: analysisEditionKey(),
    executionMode,
    period: period || null,
    window: window || null,
    fingerprint,
    activeProgramId: activeProgram?.id || fingerprint?.programId || null,
    nameMapSize: resolvedNameMap ? Object.keys(resolvedNameMap).length : 0,
    nameMapDigest: fingerprint?.nameMapDigest || null,
    garminSleepDays: fingerprint?.garminSleepDays ?? 0,
    memorySnapshot,
    memoryPhenomenonCount: Object.keys(memorySnapshot.phenomena || {}).length,
    builtAt: new Date().toISOString(),
    sources: fingerprint?.sources || null
  };
}

export function fingerprintFromEnvelope(envelope) {
  return envelope?.fingerprint || null;
}
