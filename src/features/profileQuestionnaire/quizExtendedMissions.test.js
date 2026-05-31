import { describe, it, expect } from 'vitest';
import { resolvePrimaryMissionId, resolveMissionProfile } from './quizMissionResolver';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeekPlacement } from './quizWeekPlacement';
import { runV6AcceptanceProfile, triathlonOlympic } from './fixtures/v6AcceptanceProfiles';
import { blockStressFamily, compatBlocks, buildCompatContext } from './quizBlockCompat';

describe('missions étendues v6.2b', () => {
  it('marathon explicite → run_marathon avec km ≥ 50', () => {
    const id = resolvePrimaryMissionId({
      goalPhysique: 'endurance_lean',
      runningGoal: 'marathon',
      runningWeeklyKmCurrent: 'km_40_60'
    });
    expect(id).toBe('run_marathon');
    const budgets = buildWeeklyBudgets({
      runningGoal: 'marathon',
      runningWeeklyKmCurrent: 'km_40_60',
      sleepQuality: 'good',
      stressLevel: 'low',
      availableTrainingDays: ['mardi', 'jeudi', 'samedi', 'dimanche']
    });
    expect(budgets.run?.kmTarget).toBeGreaterThanOrEqual(50);
  });

  it('triathlon olympique : profil + ≥ 2 blocs course', () => {
    const id = resolvePrimaryMissionId(triathlonOlympic);
    expect(id).toBe('triathlon_olympic');
    const profile = resolveMissionProfile(triathlonOlympic);
    expect(profile.weeklyKmRange[0]).toBeGreaterThanOrEqual(30);

    const { quizGenerationMeta } = runV6AcceptanceProfile(triathlonOlympic);
    const wp = quizGenerationMeta?.weeklyPlanner;
    expect(wp?.missionId).toBe('triathlon_olympic');
    expect(wp?.runBlocksPlaced ?? 0).toBeGreaterThanOrEqual(2);
  });

  it('sport_collective : circuits métaboliques en placement', () => {
    const days = ['lundi', 'mardi', 'jeudi', 'samedi'];
    const answers = { primaryMission: 'sport_collective', goalPhysique: 'athletic_performance' };
    const budgets = buildWeeklyBudgets(answers, { activeDays: 4 });
    const placement = buildWeekPlacement(days, answers, budgets);
    const blocks = Object.values(placement.days).flatMap((d) => d.blocks);
    expect(blocks.some((b) => b === 'circuit_metabolic')).toBe(true);
  });

  it('sport_collective : pas de km course obligatoire', () => {
    const p = resolveMissionProfile({ primaryMission: 'sport_collective', goalPhysique: 'athletic_performance' });
    expect(p.weeklyKmRange).toBeFalsy();
    expect(p.maxStrengthDays).toBeGreaterThanOrEqual(4);
  });

  it('matrice compat : run_tempo vs run_interval plus strict que run_easy', () => {
    const ctx = buildCompatContext({}, { recoveryBudget: 1 });
    const easyInt = compatBlocks('run_easy', 'run_interval', ctx);
    const tempoInt = compatBlocks('run_tempo', 'run_interval', ctx);
    expect(tempoInt.compat).toBeLessThan(easyInt.compat);
    expect(blockStressFamily('run_tempo')).toBe('run_tempo');
    expect(blockStressFamily('skill_street')).toBe('skill_street');
  });
});
