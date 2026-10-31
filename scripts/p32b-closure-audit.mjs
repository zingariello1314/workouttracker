/**
 * Clôture P3.2b — audit exposition chest/back + packs E0 avant/après.
 * Usage: npx vite-node scripts/p32b-closure-audit.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  buildMuscleAccountingLedger,
  buildCanonicalObservationLines,
  buildGtgLedgerLines,
  UNIT_CLASS,
  VOLUME_BUCKET
} from '../src/utils/sport/recapMuscleLedgerP32a.js';
import { buildReverseStableIdIndex } from '../src/utils/sport/resolveStorageExerciseIdentity.js';
import {
  buildP32bMuscleDiscoveries,
  P32B_KINDS
} from '../src/utils/sport/recapMuscleP32bDiscoveries.js';
import {
  buildPeriodDiscoveryBundle,
  discoveryInformativeValue,
  selectPeriodDiscoveriesWithTrace
} from '../src/utils/sport/recapPeriodDiscoveries.js';
import { resolveContentClass } from '../src/utils/sport/recapDiscoveryContentClass.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = JSON.parse(
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
const window = { start: '2026-10-01', end: '2026-10-30' };
const reverseIndex = buildReverseStableIdIndex({ ...nameById });

const ledger = buildMuscleAccountingLedger({
  snapshot,
  window,
  getExerciseNameById: getName,
  nameById
});
const lines = buildCanonicalObservationLines({
  snapshot,
  window,
  getExerciseNameById: getName,
  nameById,
  reverseIndex
});
const gtgLines = buildGtgLedgerLines({
  snapshot,
  window,
  getExerciseNameById: getName,
  nameById,
  reverseIndex
});

const gtgByDateId = new Map();
for (const g of gtgLines) {
  gtgByDateId.set(`${g.date}::${g.storageId}`, g);
}

function provenanceOf(line) {
  const sid = String(line.storageId || '');
  if (sid === 'complementary_endurance_pushups' || sid.startsWith('complementary_')) {
    return 'complementary';
  }
  const gtg = gtgByDateId.get(`${line.date}::${sid}`);
  if (gtg?.alreadyInClassic) return 'classic_gtg_synced';
  if (gtg && !gtg.alreadyInClassic) return 'classic_with_gtg_overlap_unconfirmed';
  return 'classic';
}

function roleForGroup(attr, group) {
  if ((attr.primaryGroups || []).includes(group)) return 'primary';
  if ((attr.secondaryGroups || []).includes(group)) return 'secondary';
  return 'none';
}

function auditGroup(group) {
  const certain = lines.filter((l) => l.unitClass === UNIT_CLASS.CERTAIN_REPS);
  const byDate = {};
  for (const line of certain) {
    const attr = line.attribution || {};
    const role = roleForGroup(attr, group);
    const includePrimary =
      role === 'primary' && attr.metricAdmissible?.exposurePrimary === true;
    if (role === 'none') continue;
    if (!byDate[line.date]) byDate[line.date] = [];
    byDate[line.date].push({
      date: line.date,
      storageId: line.storageId,
      name: attr.resolvedName || '',
      provenance: provenanceOf(line),
      role,
      anatomyLinkConfidence: attr.anatomyLinkConfidence,
      mappingQuality: attr.mappingQuality,
      volumeBucket: line.volumeBucket,
      reps: line.reps,
      includedInExposurePrimary: includePrimary,
      gtgSynced: Boolean(gtgByDateId.get(`${line.date}::${line.storageId}`)?.alreadyInClassic),
      gtgListedNotInClassic: Boolean(
        gtgByDateId.get(`${line.date}::${line.storageId}`) &&
          !gtgByDateId.get(`${line.date}::${line.storageId}`)?.alreadyInClassic
      )
    });
  }
  const exposureDates = Object.keys(byDate)
    .filter((d) => byDate[d].some((r) => r.includedInExposurePrimary))
    .sort();
  const complementaryOnlyDates = exposureDates.filter((d) => {
    const prim = byDate[d].filter((r) => r.includedInExposurePrimary);
    return prim.length > 0 && prim.every((r) => r.provenance === 'complementary');
  });
  const classicDates = exposureDates.filter((d) =>
    byDate[d].some(
      (r) =>
        r.includedInExposurePrimary &&
        (r.provenance === 'classic' || r.provenance === 'classic_gtg_synced')
    )
  );
  return {
    group,
    ledgerExposureDays: ledger.exposureDaysPrimary[group] || 0,
    reconstructedExposureDays: exposureDates.length,
    exposureDates,
    complementaryOnlyDates,
    classicDates,
    monoReps: ledger.volumePrimary[group] || 0,
    multiTouch: ledger.multiPrimaryTouch[group] || 0,
    rowsByDate: byDate
  };
}

const chest = auditGroup('chest');
const back = auditGroup('back');

const horizons = {
  '7j': { start: '2026-10-24', end: '2026-10-30' },
  '30j': { start: '2026-10-01', end: '2026-10-30' },
  '3m': { start: '2026-08-01', end: '2026-10-30' },
  long: { start: '2026-07-01', end: '2026-10-30' }
};

const packs = {};
for (const [label, win] of Object.entries(horizons)) {
  const p32b = buildP32bMuscleDiscoveries({
    snapshot,
    window: win,
    getExerciseNameById: getName,
    nameById
  });
  const off = buildPeriodDiscoveryBundle({
    snapshot,
    window: win,
    getExerciseNameById: getName,
    nameById,
    includeP32bMuscleDiscoveries: false
  });
  const on = buildPeriodDiscoveryBundle({
    snapshot,
    window: win,
    getExerciseNameById: getName,
    nameById,
    includeP32bMuscleDiscoveries: true
  });

  const slimCand = (d) => ({
    kind: d.kind,
    nature: d.nature,
    family: d.family,
    score: d.score,
    informativeValue: d.informativeValue ?? discoveryInformativeValue(d),
    contentClass: resolveContentClass(d),
    title: d.title,
    body: d.body,
    evidence: d.evidence
  });

  const offKinds = new Set((off.selected || []).map((d) => d.kind));
  const onKinds = new Set((on.selected || []).map((d) => d.kind));
  const added = [...onKinds].filter((k) => !offKinds.has(k));
  const removed = [...offKinds].filter((k) => !onKinds.has(k));

  // Rivalité contrast vs shift isolée
  const rivalryCards = (p32b.discoveries || []).filter((d) =>
    [P32B_KINDS.EXPOSURE_CONTRAST, P32B_KINDS.EXPOSURE_SHIFT].includes(d.kind)
  );
  const tracedRival = selectPeriodDiscoveriesWithTrace(
    rivalryCards.map((d) => ({
      ...d,
      informativeValue: discoveryInformativeValue(d)
    })),
    null,
    'week'
  );

  packs[label] = {
    window: win,
    comparableWC: p32b.metrics.comparableWC,
    comparability: p32b.metrics.comparability || null,
    candidates: (p32b.discoveries || []).map(slimCand),
    rejected: p32b.rejected,
    rivalryTrace: {
      input: rivalryCards.map((d) => ({
        kind: d.kind,
        score: d.score,
        informativeValue: discoveryInformativeValue(d),
        family: d.family,
        nature: d.nature,
        title: d.title
      })),
      selected: (tracedRival.selected || []).map((d) => d.kind),
      dropped: (tracedRival.dropped || []).map((d) => ({
        kind: d.kind,
        reason: d.reason
      }))
    },
    packOffSelected: (off.selected || []).map((d) => ({
      kind: d.kind,
      title: d.title,
      informativeValue: d.informativeValue
    })),
    packOnSelected: (on.selected || []).map((d) => ({
      kind: d.kind,
      title: d.title,
      informativeValue: d.informativeValue
    })),
    addedKinds: added,
    removedKinds: removed,
    p32bDroppedFromOn: (on.dropped || [])
      .filter((d) => String(d.kind || '').startsWith('disc_muscle_') && d.kind.includes('muscle_'))
      .filter((d) =>
        [
          'disc_muscle_exposure_contrast',
          'disc_muscle_exposure_shift',
          'disc_muscle_movement_structure',
          'disc_muscle_plan_vs_actual',
          'disc_muscle_ledger_limits'
        ].includes(d.kind)
      )
      .map((d) => ({ kind: d.kind, reason: d.reason, title: d.title }))
  };
}

const out = {
  generatedAt: new Date().toISOString(),
  exposureAudit: {
    chest,
    back,
    overlapDatesPrimary: chest.exposureDates.filter((d) => back.exposureDates.includes(d)),
    note:
      'Exposition primary = jours où ≥1 ligne certain_reps a le groupe en primaryGroups (mono ou multi). Complementary contribue aux jours sans inventer une séance classique distincte.'
  },
  packs
};

const dest = path.join(
  root,
  'docs/analyses-documentation/fixtures/p32b-closure-audit-oct-2026.json'
);
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log('Wrote', dest);
console.log('\n=== EXPOSURE CHEST ===');
console.log(
  'ledger',
  chest.ledgerExposureDays,
  'recon',
  chest.reconstructedExposureDays,
  'classicDays',
  chest.classicDates.length,
  'compOnly',
  chest.complementaryOnlyDates
);
console.log('dates', chest.exposureDates.join(', '));
console.log('\n=== EXPOSURE BACK ===');
console.log(
  'ledger',
  back.ledgerExposureDays,
  'recon',
  back.reconstructedExposureDays,
  'classicDays',
  back.classicDates.length,
  'compOnly',
  back.complementaryOnlyDates
);
console.log('dates', back.exposureDates.join(', '));
for (const [label, p] of Object.entries(packs)) {
  console.log(`\n=== PACK ${label} ===`);
  console.log(
    'cand',
    p.candidates.map((c) => `${c.kind}@${c.score}/${c.informativeValue}`).join(' | ')
  );
  console.log('rivalry', JSON.stringify(p.rivalryTrace));
  console.log('added', p.addedKinds.join(',') || '-', 'removed', p.removedKinds.join(',') || '-');
}
