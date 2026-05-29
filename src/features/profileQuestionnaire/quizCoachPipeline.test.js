import { describe, expect, it } from 'vitest';
import { resolveQuizConstraints } from './quizConstraintResolver';
import { resolveProgramArchetype } from './quizArchetype';
import { buildQuizCoachContext, buildQuizGenerationMeta } from './quizCoachPipeline';
import { buildTrainingScheduleFromQuizDays, buildQuizAugmentedSchedule } from './trainingScheduleFromQuiz';

const toxicProfile = {
  goalPhysique: 'bulk_mass',
  cardioTrainingDesire: 'priority_hiit',
  experienceLevel: 'beginner_0_3m',
  sleepQuality: 'poor',
  stressLevel: 'very_high',
  preferredSessionDuration: '60_90',
  availableTrainingDays: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
  weeklyTrainingFrequencyCurrent: '1_2',
  trainingLocation: ['commercial_gym'],
  availableEquipment: ['bodyweight', 'dumbbells'],
  sameDayCardioAddon: 'often',
  circuitTrainingStyle: ['love_circuits'],
  exerciseTypePreferences: ['plyometrics', 'circuits_hiit']
};

const hybridProfile = {
  goalPhysique: 'muscular_defined',
  cardioTrainingDesire: 'moderate',
  experienceLevel: 'intermediate_3_12m',
  sleepQuality: 'good',
  stressLevel: 'low',
  preferredSessionDuration: '45_60',
  availableTrainingDays: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi'],
  weeklyTrainingFrequencyCurrent: '5_6',
  trainingLocation: ['outdoor', 'home_minimal'],
  availableEquipment: ['bodyweight', 'pullup_bar', 'parallel_bars', 'dumbbells', 'bench'],
  sameDayCardioAddon: 'sometimes',
  circuitTrainingStyle: ['ok_finisher'],
  exerciseTypePreferences: ['strength_compounds', 'cardio_endurance']
};

describe('quizCoachPipeline', () => {
  it('réduit les jours actifs pour profil contradictoire', () => {
    const ctx = buildQuizCoachContext(toxicProfile);
    expect(ctx.maxActiveDays).toBeLessThanOrEqual(4);
    expect(ctx.deformers.allowPlyo).toBe(false);
  });

  it('profil hybride peut viser performance ou street', () => {
    const constraints = resolveQuizConstraints(hybridProfile);
    const arch = resolveProgramArchetype(hybridProfile, constraints);
    expect(['hybrid_street_home_dense', 'hybrid_street_home_strict', 'street_intermediate']).toContain(
      arch.id
    );
    expect(arch.whyThisTemplate.length).toBeGreaterThan(0);
  });

  it('buildQuizAugmentedSchedule retourne meta', () => {
    const schedule = buildTrainingScheduleFromQuizDays(hybridProfile.availableTrainingDays, () => ({
      active: false,
      exercises: [],
      etirements: { matin: [], midi: [], soir: [] }
    }));
    const bundle = buildQuizAugmentedSchedule(schedule, hybridProfile);
    expect(bundle.quizGenerationMeta?.archetypeId).toBeTruthy();
    expect(bundle.quizGenerationMeta?.whyThisTemplate?.length).toBeGreaterThan(0);
    const active = Object.values(bundle.schedule).filter((d) => d.active).length;
    expect(active).toBeLessThanOrEqual(5);
  });

  it('why utilisateur sans identifiants techniques', () => {
    const meta = buildQuizGenerationMeta(buildQuizCoachContext(hybridProfile));
    const whyText = (meta.whyThisTemplate || []).join(' ');
    expect(whyText).not.toMatch(/hybrid_street_home/);
    expect(whyText).not.toMatch(/performance_hybrid/);
    expect(meta.whyThisTemplate?.[0]?.length).toBeGreaterThan(10);
  });
});
