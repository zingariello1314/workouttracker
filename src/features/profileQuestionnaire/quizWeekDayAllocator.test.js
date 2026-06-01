import { describe, it, expect } from 'vitest';
import { buildWeeklyTrainingObjectives } from './quizWeeklyObjectives';
import { allocateObjectivesToWeek, selectActiveDaysForCap } from './quizWeekDayAllocator';
import { incoherenceDocProfile6d } from './fixtures/incoherenceDocProfile';

const SIX_DAYS = incoherenceDocProfile6d.availableTrainingDays;

describe('quizWeekDayAllocator', () => {
  it('6 jours : push, 2 runs, expositions traction', () => {
    const objectives = buildWeeklyTrainingObjectives(incoherenceDocProfile6d);
    const alloc = allocateObjectivesToWeek(objectives, SIX_DAYS, incoherenceDocProfile6d);

    const allBlocks = SIX_DAYS.flatMap((k) => alloc.days[k]?.obligations || []);
    expect(allBlocks.some((b) => b === 'force_push')).toBe(true);
    expect(allBlocks.filter((b) => b.startsWith('run_')).length).toBeGreaterThanOrEqual(2);

    const tractionDays = SIX_DAYS.filter((k) => {
      const o = alloc.days[k]?.obligations || [];
      return o.includes('skill_street') || o.includes('force_pull');
    });
    expect(tractionDays.length).toBeGreaterThanOrEqual(2);
  });

  it('selectActiveDaysForCap garde push et course si cap à 4', () => {
    const objectives = buildWeeklyTrainingObjectives(incoherenceDocProfile6d);
    const alloc = allocateObjectivesToWeek(objectives, SIX_DAYS, incoherenceDocProfile6d);
    const schedule = {};
    SIX_DAYS.forEach((d) => {
      schedule[d] = { active: true, exercises: [] };
    });

    const kept = selectActiveDaysForCap(schedule, 4, alloc);
    expect(kept.length).toBe(4);

    const keptBlocks = kept.flatMap((k) => alloc.days[k]?.obligations || []);
    expect(keptBlocks.some((b) => b === 'force_push')).toBe(true);
    expect(keptBlocks.filter((b) => b.startsWith('run_')).length).toBeGreaterThanOrEqual(1);
    const hasWeekend = kept.some((k) => k === 'samedi' || k === 'dimanche' || k === 'vendredi');
    expect(hasWeekend).toBe(true);
  });
});
