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
    expect(shorts.length).toBeGreaterThanOrEqual(2);
    expect(shorts.every((c) => c.type === 'coach_reading')).toBe(true);
    expect(shorts.every((c) => c.context?.title && c.context?.body)).toBe(true);
    expect(shorts.every((c) => c.nature === 'now')).toBe(true);
    const allText = cands.map(blob).join('\n');
    expect(allText).not.toMatch(/le réalisé reste/i);
    expect(allText).not.toMatch(/le profil se lit/i);
    expect(allText).not.toMatch(/\+703/);
    expect(allText).toMatch(/semaine|séances par semaine|7 derniers jours/i);
    expect(cands.some((c) => c.id.includes('volume_traj'))).toBe(false);
    const nowCard =
      cands.find((c) => c.id.includes('disc_volume_shape')) ||
      cands.find((c) => c.id.includes('continuity'));
    expect(nowCard).toBeTruthy();
    expect(nowCard.nature).toBe('now');
    expect(renderInterpretationText(nowCard)).toMatch(/rebond|repart|7 derniers jours|mois précédent|30 jours d'avant/i);
    expect(allText).not.toMatch(/Tes performances baissent/i);
    expect(cands.some((c) => c.id.includes('specialization'))).toBe(false);
    const push = cands.find((c) => c.id.includes('push_share'));
    if (push) {
      expect(push.horizon).toBe('medium');
      expect(push.nature).toBe('trajectory');
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

  it('ne raconte pas un développé haltères comme une course absente', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const add = (date, exId, reps) => {
      snapshot.reps[`${date}_${exId}`] = reps;
      snapshot.checkedExercises[`${date}_${exId}`] = true;
    };
    add('2026-06-09', '501', 10);
    for (let i = 0; i < 20; i += 1) {
      add(DateHelper.addDays('2026-08-31', -i), '104', 24);
    }
    const cands = buildHorizonEssayCandidates({
      snapshot,
      window: { start: '2026-06-01', end: '2026-08-31' },
      period: 'all',
      getExerciseNameById: (id) =>
        Number(id) === 501 ? 'Développé couché incliné aux haltères' : 'Pompes'
    });
    const texts = cands.map(blob).join('\n');
    expect(texts).not.toMatch(/s[ée]ance cardio \(D[ée]velopp/i);
    expect(texts).not.toMatch(/derni[eè]re course \(D[ée]velopp/i);
    expect(cands.some((c) => /course a gliss/i.test(blob(c)))).toBe(false);
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
    expect(shorts.length).toBeGreaterThanOrEqual(1);
    expect(shorts.some((c) => String(c.id).includes('reading'))).toBe(true);
  });

  it('n’oblige plus une lecture par colonne sur une fenêtre d’un jour', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    for (let i = 0; i < 20; i += 1) {
      const d = DateHelper.addDays('2026-08-30', -i);
      snapshot.reps[`${d}_104`] = 24;
      snapshot.checkedExercises[`${d}_104`] = true;
    }
    const cands = buildHorizonEssayCandidates({
      snapshot,
      window: { start: '2026-08-31', end: '2026-08-31' },
      period: 'today',
      getExerciseNameById: () => 'Pompes'
    });
    expect(cands.every((c) => c.context?.kind !== 'situation')).toBe(true);
    expect(cands.some((c) => /cycle de quelques semaines/i.test(blob(c)))).toBe(false);
  });

  it('place la contraction en Maintenant et n’invente pas un rythme 3 mois vs 3 mois', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const add = (date, exId, reps) => {
      snapshot.reps[`${date}_${exId}`] = reps;
      snapshot.checkedExercises[`${date}_${exId}`] = true;
    };
    for (let i = 0; i < 14; i += 1) {
      add(DateHelper.addDays('2026-08-31', -(i * 2)), '104', 30);
    }
    add('2026-07-27', '201', 12);
    const cands = buildHorizonEssayCandidates({
      snapshot,
      window: { start: '2026-06-02', end: '2026-08-31' },
      period: '3m',
      getExerciseNameById: (id) =>
        Number(id) === 201 ? 'Course endurance fondamentale' : 'Pompes',
      trainingState: {
        performance: { trend: 'falling' },
        load: { trend: 'falling' },
        fatigue: { value: 'unknown', confidence: 0.35 },
        recovery: { value: 'sufficient' },
        context: { goal: 'muscular_defined' },
        features: {
          programCompletionPct: 40,
          volumeDelta7Pct: 123,
          volumeDelta28Pct: -32,
          frequencyDeltaPct: -30,
          performanceMomentumPct: -60,
          pushPct: 72,
          pullPct: 28,
          pushPullRatio: 2.6,
          sessions28d: 14,
          prevSessions28d: 20,
          frequency: { perWeek28d: 3.6, perWeekPrev28d: 5.1 }
        }
      }
    });
    const nowCard =
      cands.find((c) => c.id.includes('disc_volume_shape')) ||
      cands.find((c) => c.id.includes('continuity'));
    expect(nowCard).toBeTruthy();
    expect(nowCard.horizon).toBe('short');
    expect(nowCard.nature).toBe('now');
    expect(blob(nowCard)).toMatch(/5[.,]1/);
    expect(blob(nowCard)).toMatch(/3[.,]6/);
    expect(blob(nowCard)).not.toMatch(/0[.,]6/);
    const absence = cands.find((c) => c.id.includes('absence'));
    if (absence) {
      expect(absence.horizon).toBe('short');
      expect(absence.relevance).toBeLessThan(nowCard.relevance);
    }
    const spec = cands.find((c) => c.id.includes('specialization') || c.id.includes('push_share'));
    if (spec) {
      expect(spec.horizon).toBe('medium');
      expect(spec.nature).toBe('trajectory');
    }
  });

  it('raconte le parcours depuis la référence fiable, pas une leçon générique', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const add = (date, reps) => {
      snapshot.reps[`${date}_101`] = reps;
      snapshot.checkedExercises[`${date}_101`] = true;
    };
    add('2026-03-01', 20);
    [5, 5, 6, 7, 8, 8, 8, 9].forEach((reps, i) => {
      add(DateHelper.addDays('2026-03-08', i * 7), reps);
    });
    const cands = buildHorizonEssayCandidates({
      snapshot,
      window: { start: '2026-08-01', end: '2026-08-31' },
      period: '30d',
      getExerciseNameById: () => 'Tractions pronation'
    });
    const progress = cands.find((c) => c.id.includes('journey_progress'));
    expect(progress).toBeTruthy();
    expect(progress.horizon).toBe('long');
    expect(progress.nature).toBe('journey');
    expect(blob(progress)).toMatch(/référence fiable|première saisie/i);
    expect(blob(progress)).toMatch(/Tractions pronation/);
    expect(blob(progress)).toMatch(/paliers|5 → 8|Base :/i);
    expect(cands.some((c) => c.id.includes('continuity_level'))).toBe(false);
  });

  it('ne raconte pas une contraction quand aujourd’hui n’a pas encore de séance', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const add = (date, reps) => {
      snapshot.reps[`${date}_501`] = reps;
      snapshot.checkedExercises[`${date}_501`] = true;
    };
    add('2026-08-28', 300);
    add('2026-08-31', 360);
    const cands = buildHorizonEssayCandidates({
      snapshot,
      window: { start: '2026-09-01', end: '2026-09-01' },
      period: 'today',
      getExerciseNameById: () => 'Dips parallèles'
    });
    expect(cands.some((c) => c.id.includes('disc_pending_session'))).toBe(true);
    expect(cands.some((c) => c.id.includes('continuity'))).toBe(false);
    expect(blob(cands.find((c) => c.id.includes('disc_pending_session')))).toMatch(/pas encore/i);
  });
});
