/**
 * Mission 18 — Trace collectif depuis cartes export v16 + exploreCollectiveReturn.
 * Usage: npx vite-node scripts/m18-trace-collective.mjs [path-to-audit.json]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exploreCollectiveReturn, COVERAGE } from '../src/utils/sport/analyticalExploration.js';
import { composeCollectiveReturnReading } from '../src/utils/sport/phenomenonComposition.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const auditPath =
  process.argv[2] ||
  'C:/Users/zinga/Downloads/momentum-ANALYTICAL_AUDIT-p6-sovereign-v16-2026-11-21T21-43-08-347Z.json';

const j = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
const cards = Object.values(j.cardRegistry || {});
const ids = new Set([
  '302',
  '304',
  '306',
  '307',
  '308',
  '1599606959',
  '1735485569',
  '369862756',
  '1250363242'
]);

function mapLikeDetect(row) {
  const m = row.metrics || {};
  const name = m.exerciseName || m.name || String(row.title || '').split(':')[0];
  const dates = Array.isArray(m.dates) ? m.dates.filter(Boolean) : [];
  const returnDate = m.returnDate || m.gapAfter || m.date || null;
  const confirmationDates = dates
    .map((d) => String(d).slice(0, 10))
    .filter((d) => d && (!returnDate || d > String(returnDate).slice(0, 10)));
  const gapDays = m.gapDays ?? m.daysAbsent ?? null;
  const mechanism = m.mechanism || null;
  return {
    exerciseId: m.exerciseId || null,
    name,
    date: returnDate || (dates.length ? dates[dates.length - 1] : null),
    returnDate: returnDate || null,
    confirmationDates,
    dates,
    gapDays,
    gapProvenByConsolidation:
      /resumed_former_level|partial_resume/i.test(String(mechanism || '')) && Number(gapDays) >= 21,
    mechanism,
    muscleGroup: m.muscleGroup || null,
    family: m.muscleGroup || null,
    sessionFamilyId: m.sessionFamilyId || m.slotMatch?.primary?.dayKey || null,
    prevReps: m.prevReps ?? null,
    currentReps: m.currentReps ?? m.level ?? null,
    sourceKind: row.kind
  };
}

function mapLikeReview(row) {
  const m = row.metrics || {};
  return {
    exerciseId: m.exerciseId || null,
    name: m.name || m.exerciseName || row.title,
    date: m.date || m.returnDate || (Array.isArray(m.dates) ? m.dates[0] : null),
    family: row.family || m.family || null,
    sessionFamilyId: m.sessionFamilyId || null,
    dayKey: m.dayKey || null
    // INTENTIONNEL : pas de gapDays — défaut reviewCollectively
  };
}

const byPeriod = { '7d': [], '30d': [] };
for (const c of cards) {
  if (!byPeriod[c.period]) continue;
  if (!ids.has(String(c.metrics?.exerciseId || ''))) continue;
  if (!/format_consolidation/i.test(c.kind || '')) continue;
  byPeriod[c.period].push(c);
}

const out = { audit: path.basename(auditPath), periods: {} };
for (const [period, list] of Object.entries(byPeriod)) {
  const detectEvents = list.map(mapLikeDetect).filter((e) => e.date && Number(e.gapDays) >= 7);
  const reviewEvents = list.map(mapLikeReview);
  const detectResult = exploreCollectiveReturn(detectEvents);
  const reviewResult = exploreCollectiveReturn(reviewEvents);
  const composed =
    detectResult.coverage === COVERAGE.CONCLUDED
      ? composeCollectiveReturnReading({
          namedMoves: detectResult.namedMoves,
          dates: detectResult.dates,
          confirmationDates: detectResult.confirmationDates,
          families: detectResult.families,
          sessionFamilyLinked: (detectResult.retained || []).some(
            (h) => h.id === 'shared_session_family' || h.id === 'shared_return_cooccurrence'
          ),
          readingMode: period === '7d' ? 'confirmation' : 'return'
        })
      : null;
  out.periods[period] = {
    cardCount: list.length,
    detectEvents: detectEvents.map((e) => ({
      id: e.exerciseId,
      name: e.name,
      date: e.date,
      gap: e.gapDays,
      proven: e.gapProvenByConsolidation,
      mech: e.mechanism
    })),
    detect: {
      coverage: detectResult.coverage,
      dates: detectResult.dates,
      confirmationDates: detectResult.confirmationDates,
      retained: detectResult.retained,
      hypotheses: detectResult.hypotheses,
      named: detectResult.namedMoves?.length,
      conclusionSlice: (detectResult.conclusion || '').slice(0, 240)
    },
    reviewWithoutGap: {
      coverage: reviewResult.coverage,
      hypotheses: reviewResult.hypotheses,
      named: reviewResult.namedMoves?.length
    },
    composedTitleHint: composed?.readingMode,
    composedSlice: (composed?.conclusion || '').slice(0, 280)
  };
}

const dest = path.join(root, 'artifacts/analysis-eval/mission18-collective-trace.json');
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
console.log('\nWrote', dest);
