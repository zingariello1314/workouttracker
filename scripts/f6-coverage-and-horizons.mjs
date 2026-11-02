/**
 * F6 clôture — couverture réelle fixture + horizons demandés vs données traitées.
 * Usage: npx vite-node scripts/f6-coverage-and-horizons.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';
import { createRecapComputeScope, scopeStats } from '../src/utils/sport/recapComputeScope.js';
import { createRecapPerfTimer } from '../src/utils/sport/recapPerfInstrumentation.js';
import { collectLifetimeRepHistory } from '../src/utils/sport/athleteJourney.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'docs/analyses-documentation/moteur analyse v1');

const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'),
    'utf8'
  )
);
const nameById = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/exercise-name-map-main.json'),
    'utf8'
  )
);
const getName = (id) => nameById[String(id)] || nameById[id] || '';

function extractDate(key) {
  const m = String(key).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function coverageOf(snapshot) {
  const reps = snapshot.reps || {};
  const checked = snapshot.checkedExercises || {};
  const dates = new Set();
  const exerciseIds = new Set();
  let setLikeKeys = 0;
  let checkedTrue = 0;
  for (const k of Object.keys(reps)) {
    const d = extractDate(k);
    if (d) dates.add(d);
    const parts = String(k).split('_');
    if (parts[1]) exerciseIds.add(parts[1]);
    setLikeKeys += 1;
  }
  for (const k of Object.keys(checked)) {
    if (checked[k] === true) {
      checkedTrue += 1;
      const d = extractDate(k);
      if (d) dates.add(d);
    }
  }
  const sorted = [...dates].sort();
  const lifetime = collectLifetimeRepHistory(snapshot, sorted[sorted.length - 1] || null);
  let sessions = 0;
  lifetime.forEach((list) => {
    sessions += list.length;
  });
  const gtgDays = snapshot.enduranceData?.gtg?.days || snapshot.enduranceData?.gtg || {};
  const gtgN =
    gtgDays && typeof gtgDays === 'object' && !Array.isArray(gtgDays)
      ? Object.keys(gtgDays).filter((k) => /^\d{4}-\d{2}-\d{2}/.test(k) || (gtgDays[k] && typeof gtgDays[k] === 'object')).length
      : 0;
  // Prefer .days shape
  const gtgDayKeys = snapshot.enduranceData?.gtg?.days
    ? Object.keys(snapshot.enduranceData.gtg.days)
    : Object.keys(gtgDays).filter((k) => /^\d{4}-\d{2}-\d{2}/.test(k));
  const endoSessions = Object.keys(snapshot.enduranceData?.sessions || {}).length;
  const manualSleep = Object.keys(snapshot.manualSleepByDate || {}).length;
  const garminInFixture = Boolean(
    snapshot.garminData || snapshot.garmin || snapshot.dailyMetrics
  );

  return {
    source: 'fixture workout-main-jul-oct-2026.json',
    liveProfile: 'non accessible — non mesuré',
    firstTrainingDate: sorted[0] || null,
    lastTrainingDate: sorted[sorted.length - 1] || null,
    daysWithActivity: sorted.length,
    distinctExercisesInRepsKeys: exerciseIds.size,
    lifetimeExercises: lifetime.size,
    sessionExerciseDays: sessions,
    repsKeys: setLikeKeys,
    checkedTrueKeys: checkedTrue,
    gtgDayKeys: gtgDayKeys.length,
    enduranceSessions: endoSessions,
    manualSleepDays: manualSleep,
    garminInThisFixture: garminInFixture,
    spanDaysInclusive:
      sorted[0] && sorted[sorted.length - 1]
        ? Math.round(
            (Date.parse(sorted[sorted.length - 1]) - Date.parse(sorted[0])) / 86400000
          ) + 1
        : null
  };
}

const END = '2026-10-30';
const windows = {
  '7d': { start: '2026-10-24', end: END },
  '30d': { start: '2026-10-01', end: END },
  '3m': { start: '2026-08-01', end: END },
  '6m': { start: '2026-05-01', end: END },
  '1y': { start: '2025-10-30', end: END },
  '2y': { start: '2024-10-30', end: END },
  all: { start: null, end: END }
};

function datesInWindow(allDates, start, end) {
  return allDates.filter((d) => (!start || d >= start) && d <= end);
}

function emptyDayScanProbe(snapshot, window) {
  // Compte les clés reps scannées vs jours avec activité dans la fenêtre demandée
  const reps = snapshot.reps || {};
  let keysScanned = 0;
  let keysInWindow = 0;
  let keysBeforeWindowStart = 0;
  const start = window.start;
  const end = window.end;
  for (const k of Object.keys(reps)) {
    keysScanned += 1;
    const d = extractDate(k);
    if (!d) continue;
    if (d <= end && (!start || d >= start)) keysInWindow += 1;
    if (start && d < start && d <= end) keysBeforeWindowStart += 1;
    if (start && d < start) keysBeforeWindowStart += 1;
  }
  // Lifetime jusqu'à end (comportement catalog/baselines) — pas de boucle jour-par-jour vide
  const lifetime = collectLifetimeRepHistory(snapshot, end);
  let lifetimeSessions = 0;
  lifetime.forEach((l) => {
    lifetimeSessions += l.length;
  });
  return {
    repsKeysTotal: keysScanned,
    repsKeysInRequestedWindow: keysInWindow,
    repsKeysBeforeWindowStart: Object.keys(reps).filter((k) => {
      const d = extractDate(k);
      return d && start && d < start;
    }).length,
    lifetimeSessionsUpToEnd: lifetimeSessions,
    note:
      'Pas d’énumération calendaire jour-par-jour des trous : parcours des clés reps/checked existantes + filtre date.'
  };
}

const cov = coverageOf(snap);
const allDates = (() => {
  const s = new Set();
  for (const k of Object.keys(snap.reps || {})) {
    const d = extractDate(k);
    if (d) s.add(d);
  }
  for (const k of Object.keys(snap.checkedExercises || {})) {
    if (snap.checkedExercises[k] === true) {
      const d = extractDate(k);
      if (d) s.add(d);
    }
  }
  return [...s].sort();
})();

const horizons = {};
for (const [period, window] of Object.entries(windows)) {
  const inWin = datesInWindow(allDates, window.start, window.end);
  const probe = emptyDayScanProbe(snap, window);
  const scope = createRecapComputeScope({ snapshot: snap, period, window });
  const perf = createRecapPerfTimer({ enabled: true });
  const t0 = performance.now();
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window: { start: window.start, end: window.end },
    period,
    getExerciseNameById: getName,
    computeScope: scope,
    perfTimer: perf
  });
  const ms = Math.round((performance.now() - t0) * 100) / 100;
  const stats = scopeStats(scope);
  horizons[period] = {
    requestedWindow: window,
    firstDataInWindow: inWin[0] || null,
    lastDataInWindow: inWin[inWin.length - 1] || null,
    daysWithDataInWindow: inWin.length,
    emptyCalendarDaysInWindow:
      window.start && window.end
        ? Math.max(
            0,
            Math.round((Date.parse(window.end) - Date.parse(window.start)) / 86400000) +
              1 -
              inWin.length
          )
        : null,
    computeMs: ms,
    allDiscoveries: (bundle.all || []).length,
    selected: (bundle.selected || []).length,
    trajectoryMisses: stats?.trajectoryMisses ?? null,
    trajectoryHits: stats?.trajectoryHits ?? null,
    lifetimeHits: stats?.lifetimeHits ?? null,
    emptyDayProbe: probe,
    steps: perf.snapshot(),
    selectedKinds: (bundle.selected || []).map((d) => d.kind)
  };
  console.error(
    `[horizon] ${period} days=${inWin.length} ms=${ms} selected=${horizons[period].selected} trajMiss=${stats?.trajectoryMisses}`
  );
}

const out = {
  generatedAt: new Date().toISOString(),
  coverage: cov,
  horizons,
  emptyDaysConclusion: {
    enumeratesEmptyCalendarDays: false,
    evidence:
      'collectLifetimeRepHistory et catalog parcourent les clés snapshot, pas chaque jour du calendrier 2 ans. Les « journées vides » n’ajoutent pas de lignes lifetime.',
    caveat:
      'La fenêtre demandée 2y élargit quand même les bornes logiques (voix, comparaisons) ; le volume de clés scannées reste celui de l’historique réel jusqu’à end.'
  },
  liveProfile: 'non vérifié',
  browserGuest: 'voir rapport clôture — mesure séparée'
};

fs.writeFileSync(
  path.join(outDir, 'fixtures/f6-coverage-horizons.json'),
  JSON.stringify(out, null, 2),
  'utf8'
);
console.log(
  JSON.stringify(
    {
      coverage: cov,
      horizons: Object.fromEntries(
        Object.entries(horizons).map(([k, v]) => [
          k,
          {
            daysWithData: v.daysWithDataInWindow,
            first: v.firstDataInWindow,
            last: v.lastDataInWindow,
            emptyCalendarDays: v.emptyCalendarDaysInWindow,
            ms: v.computeMs,
            selected: v.selected,
            all: v.allDiscoveries,
            trajMiss: v.trajectoryMisses,
            lifetimeHits: v.lifetimeHits
          }
        ])
      ),
      emptyDaysConclusion: out.emptyDaysConclusion
    },
    null,
    2
  )
);
