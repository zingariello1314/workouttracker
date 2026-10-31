/**
 * Vérifications ciblées clôture P3.6 — valeurs individuelles bras charge.
 * Usage: npx vite-node scripts/p36-closure-check.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildP36OccasionTable } from '../src/utils/sport/recapP36Occasions.js';
import { computeP36WindowMetrics } from '../src/utils/sport/recapP36Metrics.js';
import { buildP36Discoveries } from '../src/utils/sport/recapP36Discoveries.js';
import { buildPeriodDiscoveryBundle } from '../src/utils/sport/recapPeriodDiscoveries.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snap = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'),
    'utf8'
  )
);
const names = JSON.parse(
  fs.readFileSync(
    path.join(root, 'docs/analyses-documentation/fixtures/exercise-name-map-main.json'),
    'utf8'
  )
);
const getName = (id) => names[String(id)] || names[id] || '';

function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function analyzeLoadArm(occasions, volLabel, freqLabels) {
  const row = (occasions.byDow || []).find((r) => r.label === volLabel);
  const list = [...(row?.activeClassicRepsList || [])];
  const sorted = [...list].sort((a, b) => a - b);
  const mean = list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
  const med = median(list);
  const min = list.length ? Math.min(...list) : null;
  const max = list.length ? Math.max(...list) : null;
  const range = min != null && max != null ? max - min : null;
  const spikeRatio = med > 0 && max != null ? max / med : null;
  // Sensibilité : retirer le max — la médiane / moyenne resteraient-elles au-dessus de la réf ?
  const withoutMax = list.length >= 2 ? list.filter((_, i) => list[i] !== max || list.indexOf(max) !== i) : [];
  // retire une occurrence du max
  const stripped = [...list];
  if (stripped.length) {
    const idx = stripped.indexOf(max);
    if (idx >= 0) stripped.splice(idx, 1);
  }
  const freqRows = (occasions.byDow || []).filter((r) => freqLabels.includes(r.label));
  const freqRef = Math.max(
    0,
    ...freqRows.map((r) => r.meanClassicRepsPerActiveDay).filter((x) => x != null)
  );

  return {
    label: volLabel,
    eligible: row?.eligibleOccurrences ?? 0,
    activeClassic: row?.withClassicExclusive ?? 0,
    calendar: row?.calendarOccurrences ?? 0,
    values: sorted,
    min,
    max,
    mean: mean != null ? Math.round(mean * 10) / 10 : null,
    median: med,
    range,
    spikeRatio: spikeRatio != null ? Math.round(spikeRatio * 100) / 100 : null,
    withoutMaxMedian: median(stripped),
    withoutMaxMean:
      stripped.length > 0
        ? Math.round((stripped.reduce((a, b) => a + b, 0) / stripped.length) * 10) / 10
        : null,
    freqRefMean: freqRef || null,
    stillAboveRefWithoutMax:
      stripped.length > 0 && freqRef > 0
        ? median(stripped) >= freqRef * 1.2 ||
          stripped.reduce((a, b) => a + b, 0) / stripped.length >= freqRef * 1.2
        : null,
    rateClassicPct: row?.rateClassicPct,
    note:
      list.length < 3
        ? 'constat_limite_n_lt_3'
        : range != null && med > 0 && range / med > 0.5
          ? 'dispersion_haute'
          : 'stable_enough_descriptive'
  };
}

const windows = {
  '7j': { start: '2026-10-24', end: '2026-10-30' },
  '30j': { start: '2026-10-01', end: '2026-10-30' },
  '3m': { start: '2026-08-01', end: '2026-10-30' }
};

const out = { generatedAt: new Date().toISOString(), horizons: {} };

for (const [label, window] of Object.entries(windows)) {
  const occasions = buildP36OccasionTable(snap, window, {
    todayYmd: '2026-10-31',
    getExerciseNameById: getName
  });
  const m = computeP36WindowMetrics(snap, window, {
    todayYmd: '2026-10-31',
    getExerciseNameById: getName
  });
  const pack = buildP36Discoveries({
    snapshot: snap,
    window,
    todayYmd: '2026-10-31',
    getExerciseNameById: getName
  });
  const bundle = buildPeriodDiscoveryBundle({
    snapshot: snap,
    window,
    todayYmd: '2026-10-31',
    getExerciseNameById: getName,
    nameById: names
  });

  const fv = m.freqVsVolume;
  let loadArm = null;
  if (fv.publishable && fv.mode === 'per_active_day') {
    loadArm = analyzeLoadArm(occasions, fv.volLabel, fv.freqLabels || []);
  }

  // Couverture / dénominateurs
  const dowSample = (occasions.byDow || []).map((r) => ({
    label: r.label,
    calendar: r.calendarOccurrences,
    eligible: r.eligibleOccurrences,
    incompleteCurrent: r.incompleteCurrent,
    withClassic: r.withClassicExclusive,
    withNeither: r.withNeither,
    rateClassicPct: r.rateClassicPct,
    rateIfActiveOnlyDenominator:
      r.withClassicExclusive > 0
        ? 100
        : r.eligibleOccurrences > 0
          ? 0
          : null
  }));

  out.horizons[label] = {
    window,
    coverage: occasions.coverage,
    freqVsVolume: fv,
    loadArm,
    weekdayRegularity: {
      publishable: m.weekdayRegularity.publishable,
      champion: m.weekdayRegularity.champion,
      tiedGroup: m.weekdayRegularity.tiedGroup,
      abstainReason: m.weekdayRegularity.abstainReason
    },
    exercises: {
      publishableFreq: m.exercises.publishableFreq,
      publishableVol: m.exercises.publishableVol,
      topFreq: m.exercises.topFreq,
      topVolume: m.exercises.topVolume,
      freqStatus: m.exercises.freqStatus,
      volStatus: m.exercises.volStatus,
      byFreqTop5: (m.exercises.byFreq || []).slice(0, 5),
      byVolTop5: (m.exercises.byVolume || []).slice(0, 5)
    },
    stability: m.stability,
    provenDow: {
      publishable: m.provenDow.publishable,
      abstainReason: m.provenDow.abstainReason
    },
    abstentions: m.abstentions,
    dowSample,
    candidatesProduced: pack.discoveries.map((d) => ({
      kind: d.kind,
      title: d.title,
      body: d.body
    })),
    selectedP36: (bundle.selected || [])
      .filter((d) => String(d.kind).startsWith('disc_p36_'))
      .map((d) => ({ kind: d.kind, title: d.title, body: d.body, score: d.score })),
    droppedP36: (bundle.dropped || [])
      .filter((d) => String(d.kind).startsWith('disc_p36_'))
      .map((d) => ({ kind: d.kind, reason: d.reason, title: d.title }))
  };
}

const dest = path.join(
  root,
  'docs/analyses-documentation/fixtures/p36-closure-check-2026-10-31.json'
);
fs.writeFileSync(dest, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));
console.log('\nWrote', dest);
