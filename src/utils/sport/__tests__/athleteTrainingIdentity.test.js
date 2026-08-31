import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import {
  buildAthleteTrainingIdentity,
  identityCanClaimUnusual,
  identityFrequencyStatus
} from '../athleteTrainingIdentity';
import { buildHorizonEssayCandidates } from '../recapHorizonEssays';

function seedDays(snapshot, dates, exId, reps = 20) {
  dates.forEach((d) => {
    snapshot.reps[`${d}_${exId}`] = reps;
    snapshot.checkedExercises[`${d}_${exId}`] = true;
  });
}

function oscillating34Dates(end, weeks = 16) {
  const dates = [];
  for (let w = weeks - 1; w >= 0; w -= 1) {
    const weekEnd = DateHelper.addDays(end, -7 * w);
    const count = w % 2 === 0 ? 3 : 4;
    const offsets = count === 3 ? [0, 2, 5] : [0, 2, 4, 6];
    offsets.forEach((off) => {
      dates.push(DateHelper.addDays(weekEnd, -off));
    });
  }
  return dates;
}

describe('buildAthleteTrainingIdentity', () => {
  it('reste silencieux s’il n’y a pas assez d’historique', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    seedDays(snapshot, ['2026-08-28', '2026-08-30'], '101');
    const id = buildAthleteTrainingIdentity({
      snapshot,
      window: { start: '2026-08-01', end: '2026-08-31' },
      getExerciseNameById: () => 'Tractions'
    });
    expect(id.ready).toBe(false);
    expect(id.frequency.status).toBe('unknown');
    expect(identityCanClaimUnusual(id)).toBe(false);
  });

  it('voit une oscillation 3–4 séances/sem. comme normale à 3', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const end = '2026-08-31';
    seedDays(snapshot, oscillating34Dates(end, 16), '101', 10);
    const id = buildAthleteTrainingIdentity({
      snapshot,
      window: { start: '2026-04-01', end },
      getExerciseNameById: () => 'Tractions'
    });
    expect(id.ready).toBe(true);
    expect(id.weeksUsed).toBeGreaterThanOrEqual(9);
    expect(id.frequency.meanPerWeek).toBeGreaterThanOrEqual(3);
    expect(id.frequency.meanPerWeek).toBeLessThanOrEqual(4.2);
    expect(id.frequency.bandLow).toBeLessThanOrEqual(3.2);
    expect(id.frequency.bandHigh).toBeGreaterThanOrEqual(3.6);
    expect(identityFrequencyStatus(id)).toBe('inside');
  });

  it('signale une baisse 6/sem. → ~3 comme inhabituelle', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const end = '2026-08-31';
    for (let w = 17; w >= 0; w -= 1) {
      const weekEnd = DateHelper.addDays(end, -7 * w);
      const count = w <= 3 ? 3 : 6;
      for (let i = 0; i < count; i += 1) {
        seedDays(snapshot, [DateHelper.addDays(weekEnd, -i)], '104', 25);
      }
    }
    const id = buildAthleteTrainingIdentity({
      snapshot,
      window: { start: '2026-04-01', end },
      getExerciseNameById: () => 'Pompes'
    });
    expect(id.ready).toBe(true);
    expect(identityCanClaimUnusual(id)).toBe(true);
    expect(id.frequency.status).toBe('low');
    expect(id.frequency.currentPerWeek).toBeLessThan(id.frequency.meanPerWeek - 0.8);
  });

  it('trouve un trou de tractions inhabituel vs un intervalle ~3 jours', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const end = '2026-08-31';
    for (let i = 0; i < 28; i += 1) {
      const d = DateHelper.addDays(end, -(14 + i * 3));
      seedDays(snapshot, [d], '101', 12);
    }
    for (let i = 0; i < 10; i += 1) {
      seedDays(snapshot, [DateHelper.addDays(end, -i)], '104', 20);
    }
    const id = buildAthleteTrainingIdentity({
      snapshot,
      window: { start: '2026-04-01', end },
      getExerciseNameById: (n) => (Number(n) === 101 ? 'Tractions' : 'Pompes')
    });
    const pull = id.qualities.find((q) => q.key === 'pullup');
    expect(pull).toBeTruthy();
    expect(pull.medianIntervalDays).toBeLessThanOrEqual(4);
    expect(pull.currentGapDays).toBeGreaterThanOrEqual(12);
    expect(pull.unusualGap).toBe(true);
  });

  it('ne traite pas 5 jours sans traction comme inhabituel si l’habitude est ~7 jours', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const end = '2026-08-31';
    for (let i = 0; i < 16; i += 1) {
      seedDays(snapshot, [DateHelper.addDays(end, -(5 + i * 7))], '101', 12);
    }
    const id = buildAthleteTrainingIdentity({
      snapshot,
      window: { start: '2026-04-01', end },
      getExerciseNameById: () => 'Tractions'
    });
    const pull = id.qualities.find((q) => q.key === 'pullup');
    expect(pull).toBeTruthy();
    expect(pull.medianIntervalDays).toBeGreaterThanOrEqual(6);
    expect(pull.currentGapDays).toBeLessThanOrEqual(6);
    expect(pull.unusualGap).toBe(false);
  });
});

describe('lectures enrichies par l’identité', () => {
  it('dit que 3 séances restent dans la variabilité si l’athlète oscille 3–4', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const end = '2026-08-31';
    seedDays(snapshot, oscillating34Dates(end, 16), '101', 10);
    const cands = buildHorizonEssayCandidates({
      snapshot,
      window: { start: '2026-08-01', end },
      period: '30d',
      getExerciseNameById: () => 'Tractions',
      trainingState: {
        load: { trend: 'stable' },
        fatigue: { value: 'unknown', confidence: 0.3 },
        features: { frequencyDeltaPct: -8, volumeDelta28Pct: -5 }
      }
    });
    const cont = cands.find((c) => String(c.id).includes('continuity'));
    expect(cont).toBeTruthy();
    expect(`${cont.context.title} ${cont.context.body}`).toMatch(/variabilit[ée]|habituel/i);
    expect(cont.context.title).not.toMatch(/moins souvent/i);
  });

  it('ajoute une lecture identité quand la fréquence sort de la plage habituelle', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const end = '2026-08-31';
    for (let w = 17; w >= 0; w -= 1) {
      const weekEnd = DateHelper.addDays(end, -7 * w);
      const count = w <= 3 ? 3 : 6;
      for (let i = 0; i < count; i += 1) {
        seedDays(snapshot, [DateHelper.addDays(weekEnd, -i)], '104', 25);
      }
    }
    const cands = buildHorizonEssayCandidates({
      snapshot,
      window: { start: '2026-08-01', end },
      period: '30d',
      getExerciseNameById: () => 'Pompes',
      trainingState: {
        load: { trend: 'falling' },
        fatigue: { value: 'unknown', confidence: 0.3 },
        features: { frequencyDeltaPct: -40, volumeDelta28Pct: -35 }
      }
    });
    expect(cands.some((c) => String(c.id).includes('.identity'))).toBe(true);
    const idCard = cands.find((c) => String(c.id).includes('.identity'));
    expect(idCard.context.body).toMatch(/habitude|plage|variabilit/i);
    expect(idCard.context.body).toMatch(/en dehors|plage|nouveau rythme/i);
  });
});
