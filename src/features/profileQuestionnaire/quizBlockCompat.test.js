import { describe, it, expect } from 'vitest';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeekPlacement } from './quizWeekPlacement';
import {
  compatBlocks,
  buildCompatContext,
  resolvePlacementCompat,
  scanPlacementConflicts,
  PENALTY_UI_WARN
} from './quizBlockCompat';

describe('quizBlockCompat', () => {
  it('fractionné + jambes : tolérance haute + récup favorable → compat ≥ 0.55, pas de hard block', () => {
    const ctx = buildCompatContext(
      {
        neuralFatigueTolerance: 'high',
        sleepQuality: 'good',
        stressLevel: 'low',
        volumeTolerance: 'high'
      },
      { recoveryBudget: 1.1 }
    );
    const r = compatBlocks('run_interval', 'force_legs', ctx, 'same_day');
    expect(r.compat).toBeGreaterThanOrEqual(0.55);
    expect(r.hardBlock).toBe(false);
    expect(r.reasonFr).toMatch(/compat/i);
  });

  it('fractionné + jambes même jour, récup basse → ajustement (downgrade ou swap)', () => {
    const days = ['lundi', 'mercredi', 'vendredi'];
    const answers = {
      goalPhysique: 'athletic_performance',
      sleepQuality: 'poor',
      stressLevel: 'very_high',
      availableTrainingDays: days,
      preferredWeeklyStructure: 'hybrid_alternating'
    };
    const budgets = buildWeeklyBudgets(answers, { activeDays: 3 });
    let placement = buildWeekPlacement(days, answers, budgets);
    placement.days.lundi = {
      ...placement.days.lundi,
      blocks: ['force_legs', 'run_interval'],
      primaryBlock: 'force_legs',
      groups: ['lower', 'cardio']
    };

    const ctx = buildCompatContext(answers, budgets);
    const before = scanPlacementConflicts(placement, days, ctx);
    expect(before.some((c) => c.blockA === 'run_interval' || c.blockB === 'run_interval')).toBe(true);

    const resolved = resolvePlacementCompat(placement, days, answers, budgets);
    expect(resolved.compatDecisions.length).toBeGreaterThanOrEqual(1);
    const dayBlocks = resolved.placement.days.lundi.blocks;
    expect(dayBlocks.includes('run_interval')).toBe(false);
    expect(resolved.compatDecisions[0].reasonFr).toBeTruthy();
  });

  it('jambes puis fractionné J+1 : récup basse → downgrade sur le jour cardio', () => {
    const days = ['lundi', 'mardi'];
    const placement = {
      structure: 'upper_lower',
      days: {
        lundi: {
          dayIndex: 0,
          blocks: ['force_legs'],
          primaryBlock: 'force_legs',
          modality: 'strength',
          groups: ['lower']
        },
        mardi: {
          dayIndex: 1,
          blocks: ['run_interval'],
          primaryBlock: 'run_interval',
          modality: 'cardio',
          groups: ['cardio']
        }
      }
    };
    const answers = { sleepQuality: 'poor', stressLevel: 'high' };
    const budgets = { recoveryBudget: 0.75 };
    const resolved = resolvePlacementCompat(placement, days, answers, budgets);
    expect(resolved.placement.days.mardi.blocks).toContain('run_easy');
    expect(resolved.compatDecisions.length).toBeGreaterThanOrEqual(1);
  });

  it('pénalité UI : combo défavorable dépasse le seuil sans tolérance haute', () => {
    const ctx = buildCompatContext(
      { neuralFatigueTolerance: 'low', volumeTolerance: 'low' },
      { recoveryBudget: 0.75 }
    );
    const r = compatBlocks('run_interval', 'force_legs', ctx, 'same_day');
    expect(r.penalty).toBeGreaterThanOrEqual(PENALTY_UI_WARN - 0.05);
    expect(r.reasonFr).toMatch(/ajustement|déconseillée|charge/i);
  });
});
