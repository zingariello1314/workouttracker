/**
 * Mission 21 — simulation chronologique mémoire collective (sans fuite du futur).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { simulateCollectiveMemoryTimeline } from '../../src/utils/sport/analyticalMemory.js';
import { stableReturnEpisodeId } from '../../src/utils/sport/sessionEpisodeLedger.js';
import { ANALYSIS_EDITION_PARTS, analysisMissionLabel } from '../../src/utils/sport/analysisEdition.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const namedMoves = [
  { exerciseId: '302', name: 'Tractions', date: '2026-11-11', confirmationDates: ['2026-11-18'], currentReps: 42, prevReps: 42 },
  { exerciseId: '304', name: 'Élévations latérales', date: '2026-11-11', confirmationDates: ['2026-11-18'], currentReps: 60, prevReps: 60 },
  { exerciseId: '306', name: 'Rowing', date: '2026-11-11', confirmationDates: ['2026-11-18'], currentReps: 48, prevReps: 48 },
  { exerciseId: '307', name: 'Développé militaire', date: '2026-11-11', confirmationDates: ['2026-11-18'], currentReps: 40, prevReps: 40 },
  { exerciseId: '308', name: 'Pompes diamant', date: '2026-11-11', confirmationDates: ['2026-11-18'], currentReps: 50, prevReps: 50 },
  { exerciseId: '309', name: 'Dips', date: '2026-11-11', confirmationDates: ['2026-11-18'], currentReps: 36, prevReps: 36 },
  { exerciseId: '310', name: 'Curl', date: '2026-11-11', confirmationDates: ['2026-11-18'], currentReps: 40, prevReps: 40 },
  { exerciseId: '311', name: 'Extensions triceps', date: '2026-11-11', confirmationDates: ['2026-11-18'], currentReps: 50, prevReps: 50 },
  { exerciseId: '312', name: 'Planche', date: '2026-11-11', confirmationDates: ['2026-11-18'], currentReps: 60, prevReps: 60 }
];
const episodeId = stableReturnEpisodeId(namedMoves, '2026-11-11');
const sim = simulateCollectiveMemoryTimeline({
  episodeId,
  namedMoves,
  returnDates: ['2026-11-11'],
  confirmationDates: ['2026-11-18'],
  cutoffs: [
    '2026-10-14',
    '2026-11-01',
    '2026-11-10',
    '2026-11-11',
    '2026-11-17',
    '2026-11-18',
    '2026-11-21'
  ]
});

const report = {
  schema: 'momentum.m21ChronoMemory.v1',
  generatedAt: new Date().toISOString(),
  mission: analysisMissionLabel(),
  edition: ANALYSIS_EDITION_PARTS.editorial,
  episodeId,
  namedMoveCount: namedMoves.length,
  noFutureLeak: sim.steps.every((s) => s.futureLeak === false),
  steps: sim.steps.map((s) => ({
    cutoff: s.cutoff,
    state: s.state,
    previousState: s.previousState,
    transition: s.transition,
    visibleConfirmations: s.visibleConfirmations,
    futureLeak: s.futureLeak
  })),
  finalPhenomenon: sim.memory?.phenomena?.[episodeId] || null
};

const out = path.join(root, 'artifacts/analysis-eval/mission21-chrono-memory.json');
fs.writeFileSync(out, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify({ out, episodeId, noFutureLeak: report.noFutureLeak, states: report.steps.map((s) => s.state) }, null, 2));
