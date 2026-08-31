import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import { muscleProfile, classifyExerciseShifts } from '../recapExposureNarratives';
import { buildHorizonEssayCandidates, plausiblePct } from '../recapHorizonEssays';
import { renderInterpretationText } from '../interpretationRenderer';
import { buildComposedInterpretationPipeline } from '../recapInterpretationPipeline';
import { findSpecificAbsences, buildExerciseTimeline } from '../recapTrainingTimeline';

function blob(c) {
  return `${c.context?.title || ''} ${c.context?.body || ''} ${renderInterpretationText(c) || ''}`;
}

describe('muscleProfile + classifyExerciseShifts', () => {
  it('exprime des parts relatives, pas seulement un volume brut', () => {
    const profile = muscleProfile({
      muscles: [
        { group: 'triceps', label: 'triceps', reps: 1022 },
        { group: 'shoulders', label: 'épaules', reps: 972 },
        { group: 'biceps', label: 'biceps', reps: 577 }
      ]
    });
    expect(profile.muscles[0].sharePct).toBeGreaterThan(30);
    expect(profile.ratio).toBeGreaterThan(1);
  });

  it('classe une baisse de reps comme remplacement si la famille monte', () => {
    const names = (id) =>
      ({ 1: 'Pompes inclinées', 2: 'Pompes déclinées', 3: 'Pompes diamant' }[Number(id)] || `Ex ${id}`);
    const current = {
      exercises: [
        { id: '1', name: names(1), reps: 40, sessions: 1, firstReps: 36, lastReps: 20 },
        { id: '2', name: names(2), reps: 200, sessions: 4, firstReps: 30, lastReps: 36 },
        { id: '3', name: names(3), reps: 180, sessions: 4, firstReps: 20, lastReps: 28 }
      ]
    };
    const habit = {
      exercises: [
        { id: '1', name: names(1), reps: 120, sessions: 4, firstReps: 36, lastReps: 36 },
        { id: '2', name: names(2), reps: 40, sessions: 1, firstReps: 30, lastReps: 30 }
      ]
    };
    const shifts = classifyExerciseShifts(current, habit, names);
    expect(shifts.replacements.some((e) => String(e.id) === '1')).toBe(true);
    expect(shifts.performanceDrops.some((e) => String(e.id) === '1')).toBe(false);
  });
});

describe('lectures de coach', () => {
  it('ignore un +703 % non comparable', () => {
    expect(plausiblePct(703.5)).toBeNull();
    expect(plausiblePct(-32.7)).toBe(-32.7);
  });

  it('produit plusieurs lectures courtes, en français naturel', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const add = (date, exId, reps) => {
      snapshot.reps[`${date}_${exId}`] = reps;
      snapshot.checkedExercises[`${date}_${exId}`] = true;
    };
    for (let i = 0; i < 12; i += 1) {
      const d = DateHelper.addDays('2026-05-31', -(i * 2));
      add(d, '104', 30 + (i % 3));
      add(d, '101', 20);
      add(d, '201', 15);
    }
    for (let i = 0; i < 8; i += 1) {
      const d = DateHelper.addDays('2026-06-30', -(i * 2));
      add(d, '104', 28);
    }
    add('2026-06-18', '301', 20);

    const cands = buildHorizonEssayCandidates({
      snapshot,
      window: { start: '2026-06-01', end: '2026-06-30' },
      period: '30d',
      getExerciseNameById: (id) =>
        ({ 101: 'Tractions', 104: 'Pompes', 201: 'Course endurance fondamentale', 301: 'Curl concentration' }[
          Number(id)
        ] || `Ex ${id}`),
      trainingState: {
        performance: { trend: 'falling' },
        load: { trend: 'falling' },
        fatigue: { value: 'unknown', confidence: 0.35 },
        recovery: { value: 'sufficient' },
        context: { goal: 'muscular_defined' },
        features: {
          programCompletionPct: 52,
          volumeDelta7Pct: 9.8,
          volumeDelta28Pct: -32.7,
          volumeDelta90Pct: 703.5,
          frequencyDeltaPct: -30,
          performanceMomentumPct: -37,
          sessionAlignment: 32,
          pushPct: 72,
          pullPct: 28,
          pushPullRatio: 2.6,
          progressionEfficiency: -0.42
        }
      },
      assessment: { programCompletion28: { ratio: 0.52 } },
      enrichment: {
        leastCheckedExercises: [{ name: 'Course endurance fondamentale', pct: 10 }],
        pushPull: { ratio: 2.6, pushPct: 72, pullPct: 28 }
      }
    });

    const shorts = cands.filter((c) => c.horizon === 'short');
    expect(shorts.length).toBeGreaterThanOrEqual(3);
    expect(shorts.every((c) => c.type === 'coach_reading')).toBe(true);
    expect(shorts.every((c) => c.context?.title && c.context?.body)).toBe(true);
    const allText = cands.map(blob).join('\n');
    expect(allText).not.toMatch(/le réalisé reste/i);
    expect(allText).not.toMatch(/le profil se lit/i);
    expect(allText).not.toMatch(/\+703/);
    expect(allText).toMatch(/semaine|séances par semaine/i);
    expect(cands.some((c) => c.id.includes('continuity'))).toBe(true);
    expect(cands.some((c) => c.id.includes('volume_traj'))).toBe(false);
    const cont = renderInterpretationText(cands.find((c) => c.id.includes('continuity')));
    expect(cont).toMatch(/rebond|reprend|7 derniers jours|semaine/i);
    expect(allText).not.toMatch(/Tes performances baissent/i);
    expect(cands.some((c) => c.id.includes('specialization'))).toBe(false);
    const push = cands.find((c) => c.id.includes('push_share'));
    if (push) {
      expect(blob(push)).toMatch(/hypertrophie|street|force|qualités/i);
    }
  });

  it('détecte une absence spécifique pendant que l’entraînement continue', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const add = (date, exId, reps) => {
      snapshot.reps[`${date}_${exId}`] = reps;
      snapshot.checkedExercises[`${date}_${exId}`] = true;
    };
    add('2026-08-18', '201', 12);
    for (let i = 0; i < 9; i += 1) {
      add(DateHelper.addDays('2026-08-31', -(i + 1)), '104', 20);
    }
    const tl = buildExerciseTimeline(snapshot, (id) =>
      Number(id) === 201 ? 'Course endurance fondamentale' : 'Pompes'
    );
    const abs = findSpecificAbsences(tl, '2026-08-31', { minGap: 8, minSessionsSince: 3 });
    expect(abs.some((a) => /course/i.test(a.name))).toBe(true);
    expect(abs[0].sessionsSince).toBeGreaterThanOrEqual(3);
  });

  it('alimente les colonnes avec plusieurs lectures par horizon', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const window = { start: '2026-04-01', end: '2026-06-24' };
    for (let i = 0; i < 40; i += 2) {
      const date = DateHelper.addDays(window.start, i);
      snapshot.reps[`${date}_101`] = 20 + (i % 5);
      snapshot.checkedExercises[`${date}_101`] = true;
      snapshot.reps[`${date}_104`] = 30;
      snapshot.checkedExercises[`${date}_104`] = true;
    }
    const pipeline = buildComposedInterpretationPipeline({
      snapshot,
      window,
      period: '30d',
      getExerciseNameById: (id) => (id === 101 ? 'Tractions' : 'Pompes'),
      assessment: { programCompletion28: { ratio: 0.5 } },
      trainingState: null
    });
    const shorts = pipeline.candidates.filter((c) => c.horizon === 'short');
    expect(shorts.length).toBeGreaterThanOrEqual(2);
    expect(shorts.some((c) => String(c.id).includes('reading'))).toBe(true);
  });
});
