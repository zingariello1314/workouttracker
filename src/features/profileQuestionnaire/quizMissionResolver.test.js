import { describe, it, expect } from 'vitest';
import { resolvePrimaryMissionId, resolveMissionProfile } from './quizMissionResolver';

describe('quizMissionResolver', () => {
  it('mappe muscular_defined + street vers hypertrophy_street', () => {
    const id = resolvePrimaryMissionId({
      goalPhysique: 'muscular_defined',
      availableEquipment: ['pullup_bar', 'dip_station'],
      exerciseTypePreferences: ['strength_compounds']
    });
    expect(id).toBe('hypertrophy_street');
  });

  it('mappe endurance_lean vers run_5k_10k', () => {
    const id = resolvePrimaryMissionId({ goalPhysique: 'endurance_lean' });
    expect(id).toBe('run_5k_10k');
  });

  it('respecte runningGoal explicite', () => {
    const id = resolvePrimaryMissionId({
      goalPhysique: 'balanced_functional',
      runningGoal: 'half_marathon'
    });
    expect(id).toBe('run_half');
  });

  it('mappe marathon vers run_marathon', () => {
    const id = resolvePrimaryMissionId({
      goalPhysique: 'endurance_lean',
      runningGoal: 'marathon'
    });
    expect(id).toBe('run_marathon');
  });

  it('expose un profil avec km pour course', () => {
    const p = resolveMissionProfile({ goalPhysique: 'endurance_lean' });
    expect(p.weeklyKmRange).toBeTruthy();
    expect(p.weeklyKmRange[0]).toBeGreaterThanOrEqual(15);
  });
});
