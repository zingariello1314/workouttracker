/**
 * Rejeu analytique indépendant P6 — 8 horizons depuis LIVE_INPUTS v36.
 * Ne lit PAS les sorties publiées comme entrées ; les utilise uniquement pour la réconciliation.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../../../src/utils/sport/recapPeriodDiscoveries.js';
import { insightsFromP6 } from '../../../src/utils/sport/p6Publication.js';
import { snapshotFingerprint } from '../../../src/utils/sport/analysisEnvironmentDossier.js';
import { analysisEditionKey } from '../../../src/utils/sport/analysisEdition.js';
import { buildProgramSessionGraph, extractSessionTemplates } from '../../../src/utils/sport/sessionStructureGraph.js';
import { windowFor, REPLAY_PERIODS } from '../../../src/utils/sport/evaluation/incrementalP6Replay.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZIP = path.join(__dirname, 'zip');
const OUT = path.join(__dirname, 'closure');

const live = JSON.parse(fs.readFileSync(path.join(ZIP, 'replay/LIVE_INPUTS.json'), 'utf8'));
const published = JSON.parse(fs.readFileSync(path.join(ZIP, 'eight-periods/eight-periods.json'), 'utf8'));
const programStructure = JSON.parse(
  fs.readFileSync(path.join(ZIP, 'program-understanding/program-structure.json'), 'utf8')
);

function rebuildSnapshot(livePack) {
  const s = livePack.sources || {};
  const nameMap = livePack.identities?.nameMap || {};
  return {
    reps: s.reps || {},
    checkedExercises: s.checkedExercises || {},
    exerciseWeights: s.exerciseWeights || {},
    exerciseSetLogs: s.exerciseSetLogs || {},
    enduranceData: s.enduranceData || null,
    manualSleepByDate: s.manualSleepByDate || null,
    challenges: s.challenges || null,
    sessionDurations: s.sessionDurations || null,
    nameMap,
    exerciseNameMap: nameMap,
    activeProgram: livePack.program || null,
    garminData: livePack.garmin
      ? {
          dailyMetrics: livePack.garmin.dailyMetrics || null,
          sleep: livePack.garmin.dailyMetrics || null
        }
      : null
  };
}

function cardKey(c) {
  return `${String(c?.kind || '')}|${String(c?.title || '')
    .toLowerCase()
    .trim()}`;
}

function slim(c) {
  return {
    kind: c.kind,
    title: c.title,
    disposition: c.p6Disposition || c.disposition || null,
    conclusionKey: c.metrics?.conclusionKey || c.id || null,
    bodyPreview: String(c.body || '').slice(0, 220),
    evidence: c.evidence || null
  };
}

function publishedCards(period) {
  const ua = published.periods?.[period]?.userAccessible || {};
  return {
    priority: ua.priority || [],
    reserve: ua.reserve || [],
    accessible: ua.accessible || []
  };
}

function compareSets(label, replayArr, pubArr) {
  const rKeys = new Map(replayArr.map((c) => [cardKey(c), c]));
  const pKeys = new Map(pubArr.map((c) => [cardKey(c), c]));
  const onlyReplay = [...rKeys.keys()].filter((k) => !pKeys.has(k));
  const onlyPub = [...pKeys.keys()].filter((k) => !rKeys.has(k));
  const both = [...rKeys.keys()].filter((k) => pKeys.has(k));
  const titleOrderReplay = replayArr.map((c) => c.title);
  const titleOrderPub = pubArr.map((c) => c.title);
  const orderMatch =
    titleOrderReplay.length === titleOrderPub.length &&
    titleOrderReplay.every((t, i) => t === titleOrderPub[i]);
  return {
    label,
    replayCount: replayArr.length,
    publishedCount: pubArr.length,
    intersection: both.length,
    onlyReplay: onlyReplay.slice(0, 12).map((k) => slim(rKeys.get(k))),
    onlyPublished: onlyPub.slice(0, 12).map((k) => slim(pKeys.get(k))),
    onlyReplayCount: onlyReplay.length,
    onlyPublishedCount: onlyPub.length,
    orderMatch
  };
}

const snapshot = rebuildSnapshot(live);
const end = live.parameters?.analysisWindowEnd || '2026-11-27';
const firstDate =
  String(live.fingerprints?.snapshot?.firstRepKey || '2026-01-05').slice(0, 10);
const nameMap = live.identities?.nameMap || {};
const getExerciseNameById = (id) => nameMap[String(id)] || nameMap[id] || '';
const garminData = snapshot.garminData;
const activeProgram = live.program;
const memory = live.memoryInitial || null;

const fp = snapshotFingerprint(snapshot, {
  activeProgram,
  garminData,
  nameMap
});

const programGraph = buildProgramSessionGraph(activeProgram);
const templates = extractSessionTemplates(activeProgram);
const planned = Object.fromEntries(
  templates.map((t) => [t.dayKey, { plannedReps: t.plannedReps, plannedSets: t.plannedSets, name: t.name }])
);
const exportedTemplates = programStructure?.templates || [];
const programCompare = exportedTemplates.map((t) => ({
  dayKey: t.dayKey,
  exported: t.plannedReps,
  replay: planned[t.dayKey]?.plannedReps ?? null,
  match: Number(t.plannedReps) === Number(planned[t.dayKey]?.plannedReps)
}));

const periodsOut = {};
const reconciliations = [];

for (const period of REPLAY_PERIODS) {
  const t0 = Date.now();
  const window = windowFor(period, end, firstDate);
  const pubWin = published.periods?.[period]?.window || null;

  // A) sans mémoire — déterminisme moteur
  const bundleA = buildPeriodDiscoveryBundle({
    snapshot,
    period,
    window,
    getExerciseNameById,
    activeProgram,
    garminData,
    analyticalMemory: null
  });
  const insightsA = insightsFromP6(bundleA.p6, { period });
  const priorityA = [
    ...(insightsA.shortTerm || []),
    ...(insightsA.mediumTerm || []),
    ...(insightsA.longTerm || [])
  ];
  const reserveA = insightsA.accessibleReserve || [];

  // B) avec mémoire initiale exportée
  const bundleB = buildPeriodDiscoveryBundle({
    snapshot,
    period,
    window,
    getExerciseNameById,
    activeProgram,
    garminData,
    analyticalMemory: memory
  });
  const insightsB = insightsFromP6(bundleB.p6, { period });
  const priorityB = [
    ...(insightsB.shortTerm || []),
    ...(insightsB.mediumTerm || []),
    ...(insightsB.longTerm || [])
  ];
  const reserveB = insightsB.accessibleReserve || [];

  const pub = publishedCards(period);
  const cmpPriorityB = compareSets('priority_with_memory', priorityB, pub.priority);
  const cmpAccessibleB = compareSets(
    'accessible_with_memory',
    [...priorityB, ...reserveB],
    pub.accessible
  );
  const cmpPriorityA = compareSets('priority_no_memory', priorityA, pub.priority);

  const memoryEffectOnPriority = {
    titlesNoMemory: priorityA.map((c) => c.title),
    titlesWithMemory: priorityB.map((c) => c.title),
    identical:
      priorityA.length === priorityB.length &&
      priorityA.every((c, i) => cardKey(c) === cardKey(priorityB[i]))
  };

  const row = {
    period,
    ms: Date.now() - t0,
    window,
    publishedWindow: pubWin,
    windowMatch:
      pubWin && window.start === pubWin.start && window.end === pubWin.end,
    produced: (bundleB.all || []).length,
    p6Counters: bundleB.p6?.counters || null,
    priorityReplay: priorityB.map(slim),
    priorityPublished: pub.priority.map(slim),
    comparePriorityWithMemory: cmpPriorityB,
    comparePriorityNoMemory: cmpPriorityA,
    compareAccessibleWithMemory: cmpAccessibleB,
    memoryEffectOnPriority,
    publicationAuthority: insightsB.publicationAuthority
  };
  periodsOut[period] = row;
  reconciliations.push({
    period,
    windowMatch: row.windowMatch,
    priorityIntersection: cmpPriorityB.intersection,
    priorityReplay: cmpPriorityB.replayCount,
    priorityPublished: cmpPriorityB.publishedCount,
    onlyReplay: cmpPriorityB.onlyReplayCount,
    onlyPublished: cmpPriorityB.onlyPublishedCount,
    orderMatch: cmpPriorityB.orderMatch,
    accessibleIntersection: cmpAccessibleB.intersection,
    accessibleReplay: cmpAccessibleB.replayCount,
    accessiblePublished: cmpAccessibleB.publishedCount,
    memoryChangesPriority: !memoryEffectOnPriority.identical
  });
  console.log(
    `[${period}] ${row.ms}ms win=${row.windowMatch} prio ${cmpPriorityB.intersection}/${cmpPriorityB.publishedCount} order=${cmpPriorityB.orderMatch} memΔ=${!memoryEffectOnPriority.identical}`
  );
}

const allPriorityExact = reconciliations.every(
  (r) => r.onlyReplay === 0 && r.onlyPublished === 0 && r.orderMatch
);
const allWindows = reconciliations.every((r) => r.windowMatch);
const programOk = programCompare.length > 0 && programCompare.every((c) => c.match);

let verdict = 'FAIL';
let verdictScope = '';
if (programOk && allWindows && allPriorityExact) {
  verdict = 'PASS';
  verdictScope = 'programme + fenêtres + priorités 8h (kind+title+ordre) avec mémoire initiale';
} else if (programOk && allWindows && reconciliations.every((r) => r.priorityIntersection >= Math.min(3, r.priorityPublished))) {
  verdict = 'PARTIEL';
  verdictScope =
    'programme + fenêtres OK ; priorités partiellement reproductibles — écarts documentés (mémoire / sélection / producteurs)';
} else if (programOk) {
  verdict = 'PARTIEL';
  verdictScope = 'programme déterministe OK ; catalogue priorités non aligné intégralement';
}

const report = {
  schema: 'momentum.p6Closure.independentReplay.v1',
  executedAt: new Date().toISOString(),
  edition: analysisEditionKey(),
  liveDigest: live.fingerprints?.digest || null,
  rebuiltFingerprintDigest: fp?.digest || null,
  fingerprintMatch: fp?.digest === live.fingerprints?.digest,
  parameters: {
    end,
    firstDate,
    timezone: live.parameters?.timezone,
    anchorDate: live.parameters?.anchorDate,
    analysisWindowEnd: live.parameters?.analysisWindowEnd
  },
  inputsPresent: {
    reps: Object.keys(snapshot.reps || {}).length,
    checked: Object.keys(snapshot.checkedExercises || {}).length,
    weights: Object.keys(snapshot.exerciseWeights || {}).length,
    setLogs: Object.keys(snapshot.exerciseSetLogs || {}).length,
    nameMap: Object.keys(nameMap).length,
    garminDays: live.garmin?.dailyMetricsDays || Object.keys(live.garmin?.dailyMetrics || {}).length,
    programDays: Object.keys(activeProgram?.schedule || {}).length,
    memoryPublications: (memory?.publications || []).length,
    memoryPhenomena: Object.keys(memory?.phenomena || {}).length
  },
  programReplay: {
    ok: programOk,
    familyCountMulti: (programGraph.families || []).filter((f) => f.size >= 2).length,
    comparisons: programCompare
  },
  periods: periodsOut,
  reconciliationSummary: reconciliations,
  verdict,
  verdictScope,
  notes: [
    'Les sorties publiées (eight-periods) ne sont pas des entrées du moteur.',
    'A = sans mémoire ; B = memoryInitial du LIVE_INPUTS.',
    'Correspondance carte = kind|title normalisé (pas occurrenceId mémoire).',
    'Digest partiel da8a167b éventuel ≠ digest LIVE c3e80330 (ensembles de sources différents).'
  ]
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'RECONCILIATION_CATALOGUE.json'), JSON.stringify(report, null, 2));
fs.writeFileSync(
  path.join(OUT, 'replay-summary.json'),
  JSON.stringify(
    {
      verdict,
      verdictScope,
      fingerprintMatch: report.fingerprintMatch,
      programOk,
      reconciliationSummary: reconciliations
    },
    null,
    2
  )
);
console.log('\nVERDICT', verdict, verdictScope);
console.log('fingerprintMatch', report.fingerprintMatch, fp?.digest, live.fingerprints?.digest);
