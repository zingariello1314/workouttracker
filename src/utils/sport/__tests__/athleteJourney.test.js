import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import {
  buildAthleteJourney,
  detectPlateau,
  firstReliableReference,
  habitualLevel,
  journeyHasProgressStory
} from '../athleteJourney';

describe('athleteJourney', () => {
  it('écarte une première saisie atypique pour la référence fiable', () => {
    const sessions = [
      { date: '2026-03-01', reps: 20 },
      { date: '2026-03-08', reps: 5 },
      { date: '2026-03-15', reps: 6 },
      { date: '2026-03-22', reps: 6 }
    ];
    const ref = firstReliableReference(sessions);
    expect(ref.source).toBe('first_reliable');
    expect(ref.skippedOutlier).toBe(true);
    expect(ref.reps).toBeGreaterThanOrEqual(5);
    expect(ref.reps).toBeLessThanOrEqual(6);
  });

  it('sépare le PR isolé du niveau habituel', () => {
    const habit = habitualLevel([
      { date: '2026-07-01', reps: 17 },
      { date: '2026-07-08', reps: 18 },
      { date: '2026-07-15', reps: 17 },
      { date: '2026-07-22', reps: 18 },
      { date: '2026-07-29', reps: 17 },
      { date: '2026-08-05', reps: 24 }
    ]);
    expect(habit.median).toBeGreaterThanOrEqual(17);
    expect(habit.median).toBeLessThanOrEqual(18);
  });

  it('raconte une progression depuis la référence, pas depuis un outlier', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const add = (date, reps) => {
      snapshot.reps[`${date}_101`] = reps;
      snapshot.checkedExercises[`${date}_101`] = true;
    };
    add('2026-03-01', 20);
    const seq = [5, 5, 6, 7, 8, 8, 8, 9];
    seq.forEach((reps, i) => {
      add(DateHelper.addDays('2026-03-08', i * 7), reps);
    });
    const journey = buildAthleteJourney({
      snapshot,
      window: { start: '2026-08-01', end: '2026-08-31' },
      getExerciseNameById: () => 'Tractions pronation'
    });
    const row = journey.exercises.find((e) => e.name === 'Tractions pronation');
    expect(row.firstCapture.reps).toBe(20);
    expect(row.firstReliable.source).toBe('first_reliable');
    expect(row.firstReliable.reps).toBeLessThan(10);
    expect(row.meaningfulProgress).toBe(true);
    expect(row.pctFromReliable).toBeGreaterThan(15);
    expect(journeyHasProgressStory(journey)).toBe(true);
    expect(journey.startYmd).toBe('2026-03-01');
    expect(row.milestones.hits.map((h) => h.reps)).toEqual([5, 8]);
    expect(row.milestones.steps[0].to).toBe(8);
  });

  it('détecte un plateau de niveau habituel', () => {
    const sessions = [];
    for (let i = 0; i < 8; i += 1) {
      sessions.push({ date: DateHelper.addDays('2026-06-01', i * 7), reps: i % 2 ? 18 : 17 });
    }
    const habit = habitualLevel(sessions);
    const plateau = detectPlateau(sessions, habit, '2026-08-01', '2026-05-01');
    expect(plateau).toBeTruthy();
    expect(plateau.spanDays).toBeGreaterThanOrEqual(28);
  });

  it('signale un mouvement régulier puis abandonné', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    for (let i = 0; i < 6; i += 1) {
      const d = DateHelper.addDays('2026-06-01', i * 7);
      snapshot.reps[`${d}_301`] = 12;
      snapshot.checkedExercises[`${d}_301`] = true;
    }
    const journey = buildAthleteJourney({
      snapshot,
      window: { end: '2026-08-15' },
      getExerciseNameById: () => 'Tractions supination'
    });
    expect(journey.narratives.abandoned.length).toBeGreaterThanOrEqual(1);
    expect(journey.narratives.abandoned[0].daysSinceLast).toBeGreaterThanOrEqual(21);
  });

  it('ignore la course dans le parcours muscu', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    for (let i = 0; i < 8; i += 1) {
      const d = DateHelper.addDays('2026-08-01', i * 3);
      snapshot.reps[`${d}_201`] = 12;
      snapshot.checkedExercises[`${d}_201`] = true;
    }
    const journey = buildAthleteJourney({
      snapshot,
      window: { end: '2026-08-31' },
      getExerciseNameById: () => 'Course endurance fondamentale'
    });
    expect(journey.exercises.length).toBe(0);
  });
});
