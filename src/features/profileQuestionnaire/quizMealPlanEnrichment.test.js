import { describe, it, expect } from 'vitest';
import { buildEnrichedNutritionPlan } from './quizMealPlanEnrichment';
import { runV6AcceptanceProfile, hypertrophyStreet3j } from './fixtures/v6AcceptanceProfiles';

describe('quizMealPlanEnrichment v6.4', () => {
  it('génère repas par jour avec macros et aliments banque', () => {
    const schedule = {
      lundi: { active: true, modality: 'strength' },
      mercredi: { active: true, modality: 'cardio' }
    };
    const plan = buildEnrichedNutritionPlan(
      {
        goalPhysique: 'muscular_defined',
        preferredTrainingWindow: 'evening',
        vitalsSelfReport: { sex: 'male', age: 30, weightKg: 80, heightCm: 180 },
        activityOutsideTraining: 'moderately_active'
      },
      schedule,
      {
        dayBlocks: {
          lundi: ['force_pull'],
          mercredi: ['run_interval']
        }
      }
    );
    expect(plan.byDay.lundi.meals.length).toBeGreaterThanOrEqual(3);
    expect(plan.byDay.lundi.macros.protein).toBeGreaterThan(50);
    expect(plan.byDay.lundi.meals[0].foods?.[0]?.name).toBeTruthy();
    expect(plan.programSeed.adjustForWorkout).toBe(true);
    expect(plan.programSeed.mealPlanPreferences.generatedMealPlan).toBeTruthy();
  });

  it('pipeline sport : nutritionAlignment enrichi en meta', () => {
    const { quizGenerationMeta } = runV6AcceptanceProfile(hypertrophyStreet3j);
    const nut = quizGenerationMeta?.nutritionAlignment;
    expect(nut?.byDay).toBeTruthy();
    expect(nut?.programSeed?.targetCalories).toBeGreaterThan(1400);
    const day = Object.values(nut.byDay)[0];
    expect(day.meals?.some((m) => m.slot === 'breakfast')).toBe(true);
  });
});
