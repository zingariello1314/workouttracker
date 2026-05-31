import { describe, it, expect } from 'vitest';
import {
  blendMissionProfiles,
  resolveMissionProfile,
  resolvePrimaryMissionId,
  suggestPrimaryMissionsFromAnswers
} from './quizMissionResolver';

describe('quizMissionBlend', () => {
  it('fusionne hypertrophy_street + run_5k_10k', () => {
    const profile = resolveMissionProfile({
      primaryMission: ['hypertrophy_street', 'run_5k_10k'],
      goalPhysique: 'muscular_defined'
    });
    expect(profile.blendedMissionIds).toEqual(['hypertrophy_street', 'run_5k_10k']);
    expect(profile.weeklyKmRange).toBeTruthy();
    expect(profile.maxStrengthDays).toBeGreaterThanOrEqual(2);
    expect(profile.defaultStructure).toBe('hybrid_alternating');
    expect(profile.blendSummaryFr).toMatch(/street|course/i);
    expect(profile.strengthFamilyMul.pull).toBeGreaterThanOrEqual(1.08);
  });

  it('expose un id composite pour plusieurs missions', () => {
    const id = resolvePrimaryMissionId({
      primaryMission: ['hypertrophy_street', 'run_5k_10k']
    });
    expect(id).toBe('blend:hypertrophy_street+run_5k_10k');
  });

  it('suggère street + 5k si profil hybride', () => {
    const suggested = suggestPrimaryMissionsFromAnswers({
      goalPhysique: 'muscular_defined',
      availableEquipment: ['pullup_bar', 'dip_station'],
      exerciseTypePreferences: ['strength_compounds'],
      triedTrainingStyles: ['running_5k'],
      cardioTrainingDesire: 'high'
    });
    expect(suggested).toEqual(['hypertrophy_street', 'run_5k_10k']);
  });

  it('migre string legacy vers profil mono', () => {
    const p = resolveMissionProfile({ primaryMission: 'run_marathon' });
    expect(p.id).toBe('run_marathon');
    expect(p.blendedMissionIds).toBeFalsy();
  });

  it('blendMissionProfiles cap force quand course + muscu', () => {
    const b = blendMissionProfiles(['hypertrophy', 'run_5k_10k']);
    expect(b.cardioCapSessionsPerWeek).toBeGreaterThanOrEqual(2);
    expect(b.maxStrengthDays).toBeLessThanOrEqual(4);
  });
});
