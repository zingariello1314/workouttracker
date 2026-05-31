import { describe, it, expect } from 'vitest';
import { buildWeeklyBudgets } from './quizWeeklyBudgetBuilder';
import { buildWeekPlacement, applyWeekPlacementToProfiles } from './quizWeekPlacement';
import { resolvePlacementCompat } from './quizBlockCompat';
import {
  shouldUseBlockAwareFill,
  resolveStreetAnchorFocus,
  fillSessionFromProfileBlocks
} from './quizExerciseFill';
import {
  buildProgramExerciseFromDbKey,
  pickExercisesForContext,
  planMainSessionExercises
} from './quizExercisePlanner';
import { buildQuizTrainingSessionBlueprint } from './quizInfluence';

const hypertrophyStreet = {
  goalPhysique: 'muscular_defined',
  availableEquipment: ['pullup_bar', 'dip_station', 'dumbbells'],
  exerciseTypePreferences: ['strength_compounds'],
  priorityMuscleGroups: ['upper_body', 'lower_body', 'back'],
  availableTrainingDays: ['lundi', 'mardi', 'mercredi'],
  sleepQuality: 'average',
  stressLevel: 'moderate'
};

const deps = { pickExercisesForContext, buildProgramExerciseFromDbKey };

describe('quizExerciseFill', () => {
  it('active le fill blocs quand placement v6 ou flag schedule', () => {
    expect(shouldUseBlockAwareFill({ blocks: ['force_pull'] }, { weeklyPlan: { placement: {} } })).toBe(
      true
    );
    expect(shouldUseBlockAwareFill({}, null)).toBe(true);
  });

  it('jour force_pull → focus tirage et tractions en tête', () => {
    const profile = {
      modality: 'strength',
      blocks: ['force_pull'],
      primaryBlock: 'force_pull',
      groups: ['upper'],
      site: 'home_minimal'
    };
    const blueprint = buildQuizTrainingSessionBlueprint(hypertrophyStreet);
    const picked = fillSessionFromProfileBlocks(
      hypertrophyStreet,
      blueprint,
      0,
      profile,
      new Set(),
      new Map(),
      { weeklyPlan: { budgets: buildWeeklyBudgets(hypertrophyStreet, { activeDays: 3 }) } },
      deps
    );
    expect(picked?.length).toBeGreaterThanOrEqual(3);
    const blob = picked.map((e) => e.exerciseBankKey || '').join(' ');
    expect(/tractions pronation|rowing/.test(blob)).toBe(true);
    expect(resolveStreetAnchorFocus(profile)).toBe('pull');
  });

  it('bloc run_easy + mission course → pas de burpees', () => {
    const answers = {
      goalPhysique: 'endurance_lean',
      runningWeeklyKmCurrent: 'km_20_40',
      availableTrainingDays: ['lundi', 'mercredi']
    };
    const budgets = buildWeeklyBudgets(answers, { activeDays: 2 });
    const profile = {
      modality: 'cardio',
      blocks: ['run_easy'],
      primaryBlock: 'run_easy',
      groups: ['cardio'],
      site: 'track'
    };
    const blueprint = buildQuizTrainingSessionBlueprint(answers);
    const picked = fillSessionFromProfileBlocks(
      answers,
      blueprint,
      0,
      profile,
      new Set(),
      new Map(),
      { weeklyPlan: { budgets } },
      deps
    );
    const keys = (picked || []).map((e) => e.exerciseBankKey || '');
    expect(keys.some((k) => k.includes('course'))).toBe(true);
    expect(keys.some((k) => /burpee|mountain/.test(k))).toBe(false);
  });

  it('pipeline placement → fill respecte les blocs sur profil pull', () => {
    const days = hypertrophyStreet.availableTrainingDays;
    const budgets = buildWeeklyBudgets(hypertrophyStreet, { activeDays: 3 });
    let placement = buildWeekPlacement(days, hypertrophyStreet, budgets);
    placement = resolvePlacementCompat(placement, days, hypertrophyStreet, budgets).placement;
    const base = {};
    days.forEach((d) => {
      base[d] = { modality: 'strength', groups: ['upper'], site: 'home_minimal' };
    });
    const profiles = applyWeekPlacementToProfiles(base, placement, hypertrophyStreet);
    const pullDay = days.find((d) => {
      const blocks = profiles[d]?.blocks || [];
      return blocks.includes('force_pull') || blocks.includes('force_push') || blocks.includes('force_upper');
    });
    expect(pullDay).toBeTruthy();
    const blueprint = buildQuizTrainingSessionBlueprint(hypertrophyStreet);
    const exos = planMainSessionExercises(
      hypertrophyStreet,
      blueprint,
      0,
      profiles[pullDay],
      new Set(),
      new Map(),
      { weeklyPlan: { budgets, placement }, deformers: {} }
    );
    const blob = exos.map((e) => `${e.exerciseBankKey} ${e.name}`).join(' ').toLowerCase();
    expect(/traction|dips|pompe|rowing/.test(blob)).toBe(true);
  });
});
