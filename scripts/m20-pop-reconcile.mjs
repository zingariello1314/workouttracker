/**
 * Mission 20 — réconciliation populations (brut → général → familles).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { measureRecapWindow } from '../src/utils/sport/recapPeriodMeasure.js';
import { aggregateCheckedRepsByDateAndExerciseId } from '../src/utils/trainingLoadUtils.js';
import { buildSessionCatalog } from '../src/utils/sport/recapPersonalBaselines.js';
import { windowFor } from '../src/utils/sport/evaluation/incrementalP6Replay.js';
import { decomposeMonthlyProgramChange } from '../src/utils/sport/monthlyProgramComposition.js';
import { classicExclusiveRepsForDay } from '../src/utils/sport/recapP35DayModel.js';
import { computeEnduranceDayMetricsForCalendar } from '../src/utils/calendarUtils.js';
import { collectLifetimeRepHistory } from '../src/utils/sport/athleteJourney.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backupPath = path.join(
  root,
  'artifacts/analysis-eval/snapshots/momentum-sport-backup-2026-11-21.json'
);
const raw = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
const snap = raw.data;
const end = '2026-11-21';
const name = () => '';

function sumRaw(start, endY) {
  const by = {
    total: 0,
    classic: 0,
    comp: 0,
    gtg: 0,
    other: 0,
    days: new Set(),
    classicDays: new Set(),
    unchecked: 0
  };
  for (const [k, v] of Object.entries(snap.reps || {})) {
    const date = k.slice(0, 10);
    if (date < start || date > endY) continue;
    const n = parseInt(v, 10) || 0;
    if (n <= 0) continue;
    if (snap.checkedExercises?.[k] !== true) {
      by.unchecked += n;
      continue;
    }
    const id = k.slice(11);
    by.total += n;
    by.days.add(date);
    if (/complementary_endurance/i.test(id)) by.comp += n;
    else if (/gtg/i.test(id)) by.gtg += n;
    else if (/^\d+$/.test(id) || /^ex_/.test(id) || /^dup_/.test(id)) {
      by.classic += n;
      by.classicDays.add(date);
    } else {
      by.other += n;
      by.classicDays.add(date);
    }
  }
  return {
    ...by,
    days: by.days.size,
    classicDays: by.classicDays.size
  };
}

const w30 = windowFor('30d', end);
const w7 = windowFor('7d', end);
const wPrev30 = { start: '2026-09-23', end: '2026-10-22' };
const wPrev7 = { start: '2026-11-08', end: '2026-11-14' };

const m30 = measureRecapWindow({
  snapshot: snap,
  window: w30,
  getExerciseNameById: name,
  periodId: '30d',
  refDate: new Date(`${end}T12:00:00`)
});
const mPrev = measureRecapWindow({
  snapshot: snap,
  window: wPrev30,
  getExerciseNameById: name,
  periodId: '30d',
  refDate: new Date(`${end}T12:00:00`)
});
const m7 = measureRecapWindow({
  snapshot: snap,
  window: w7,
  getExerciseNameById: name,
  periodId: '7d',
  refDate: new Date(`${end}T12:00:00`)
});
const m7p = measureRecapWindow({
  snapshot: snap,
  window: wPrev7,
  getExerciseNameById: name,
  periodId: '7d',
  refDate: new Date(`${end}T12:00:00`)
});

const cat = buildSessionCatalog({ snapshot: snap, getExerciseNameById: name, endYmd: end });
const inWin = (c, w) => c.filter((s) => s.date >= w.start && s.date <= w.end);
const sumCat = (arr) => arr.reduce((a, s) => a + s.totalReps, 0);

const grouped = aggregateCheckedRepsByDateAndExerciseId(snap.reps, snap.checkedExercises);
function sumGrouped(start, endY) {
  let t = 0;
  let comp = 0;
  let classic = 0;
  const days = new Set();
  for (const [k, v] of grouped) {
    const d = k.slice(0, 10);
    const id = k.slice(d.length + 2);
    if (d < start || d > endY) continue;
    t += v.reps;
    days.add(d);
    if (String(id).includes('complementary')) comp += v.reps;
    else classic += v.reps;
  }
  return { t, classic, comp, days: days.size };
}

const lifetime = collectLifetimeRepHistory(snap, end);
function sumLifetime(start, endY) {
  let t = 0;
  const days = new Set();
  lifetime.forEach((sessions, exId) => {
    sessions.forEach((s) => {
      if (!s?.date || s.date < start || s.date > endY) return;
      t += s.reps;
      days.add(s.date);
    });
  });
  return { t, days: days.size, exerciseCount: lifetime.size };
}

const programs = snap.programs || {};
const activeProgram =
  snap.activeProgram ||
  (snap.activeProgramId && programs[snap.activeProgramId]) ||
  Object.values(programs)[0] ||
  null;
const comp = decomposeMonthlyProgramChange({
  catalog: cat,
  window: w30,
  previousWindow: wPrev30,
  activeProgram
});

function dayChecked(ymd) {
  let n = 0;
  for (const [k, v] of grouped) {
    if (k.startsWith(`${ymd}::`)) n += v.reps;
  }
  return n;
}

function bannerSum(start, endY) {
  let total = 0;
  let exclusiveSum = 0;
  let classicTotalSum = 0;
  let endurance = 0;
  let checkedAgg = 0;
  let gtgDeducted = 0;
  const strengthDays = new Set();
  const d0 = new Date(`${start}T12:00:00`);
  const d1 = new Date(`${endY}T12:00:00`);
  for (let t = d0.getTime(); t <= d1.getTime(); t += 86400000) {
    const ymd = new Date(t).toISOString().slice(0, 10);
    const pack = classicExclusiveRepsForDay(snap, ymd);
    const checked = dayChecked(ymd);
    const classic = pack?.classicTotalReps > 0 ? pack.classicExclusiveReps : checked;
    const endR = Math.floor(Number(computeEnduranceDayMetricsForCalendar(snap, ymd)?.reps) || 0);
    if (classic + endR > 0) strengthDays.add(ymd);
    exclusiveSum += pack?.classicExclusiveReps || 0;
    classicTotalSum += pack?.classicTotalReps || 0;
    gtgDeducted += pack?.gtgSyncedReps || 0;
    endurance += endR;
    checkedAgg += checked;
    total += classic + endR;
  }
  return {
    total,
    exclusiveSum,
    classicTotalSum,
    endurance,
    checkedAgg,
    gtgDeducted,
    strengthDays: strengthDays.size
  };
}

function slimMeasure(m) {
  return {
    totalReps: m.totalReps,
    strengthReps: m.strengthReps,
    trainingDays: m.trainingDays,
    strengthDays: m.strengthDays,
    window: m.window
  };
}

const out = {
  windows: { w30, wPrev30, w7, wPrev7 },
  activeProgramName: activeProgram?.name || activeProgram?.title || null,
  templateHint: activeProgram ? Object.keys(activeProgram).slice(0, 12) : [],
  raw: {
    cur30: sumRaw(w30.start, w30.end),
    prev30: sumRaw(wPrev30.start, wPrev30.end),
    cur7: sumRaw(w7.start, w7.end),
    prev7: sumRaw(wPrev7.start, wPrev7.end)
  },
  grouped: {
    cur30: sumGrouped(w30.start, w30.end),
    prev30: sumGrouped(wPrev30.start, wPrev30.end),
    cur7: sumGrouped(w7.start, w7.end),
    prev7: sumGrouped(wPrev7.start, wPrev7.end)
  },
  lifetime: {
    cur30: sumLifetime(w30.start, w30.end),
    prev30: sumLifetime(wPrev30.start, wPrev30.end)
  },
  banner: {
    cur30: bannerSum(w30.start, w30.end),
    prev30: bannerSum(wPrev30.start, wPrev30.end),
    cur7: bannerSum(w7.start, w7.end),
    prev7: bannerSum(wPrev7.start, wPrev7.end)
  },
  measure: {
    cur30: slimMeasure(m30),
    prev30: slimMeasure(mPrev),
    cur7: slimMeasure(m7),
    prev7: slimMeasure(m7p)
  },
  catalog: {
    cur30: { days: inWin(cat, w30).length, reps: sumCat(inWin(cat, w30)) },
    prev30: { days: inWin(cat, wPrev30).length, reps: sumCat(inWin(cat, wPrev30)) },
    cur7: { days: inWin(cat, w7).length, reps: sumCat(inWin(cat, w7)) },
    prev7: { days: inWin(cat, wPrev7).length, reps: sumCat(inWin(cat, wPrev7)) }
  },
  composition: {
    deltaVolume: comp?.deltaVolume,
    deltaDays: comp?.deltaDays,
    recentVolume: comp?.recent?.volume,
    previousVolume: comp?.previous?.volume,
    recentDays: comp?.recent?.trainingDays,
    previousDays: comp?.previous?.trainingDays,
    templatesUsed: comp?.templatesUsed,
    evidenceLevel: comp?.evidenceLevel,
    reconciliationGap: comp?.reconciliationGap,
    contributions: (comp?.contributions || []).slice(0, 8).map((c) => ({
      familyId: c.familyId,
      familyName: c.familyName,
      recentDays: c.recentDays,
      previousDays: c.previousDays,
      recentVolume: c.recentVolume,
      previousVolume: c.previousVolume,
      volumeDelta: c.volumeDelta,
      evolution: c.evolution
    })),
    titleHardcoded: 'La hausse de volume se lit dans la composition des familles de séances'
  },
  gaps: {
    generalVsRawCur30: m30.totalReps - sumRaw(w30.start, w30.end).total,
    generalVsFamilyCur30: m30.totalReps - sumCat(inWin(cat, w30)),
    familyVsClassicCur30: sumCat(inWin(cat, w30)) - sumRaw(w30.start, w30.end).classic,
    bannerVsMeasureCur30: bannerSum(w30.start, w30.end).total - m30.totalReps
  }
};

console.log(JSON.stringify(out, null, 2));
