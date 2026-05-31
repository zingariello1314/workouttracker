import { describe, it, expect } from 'vitest';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import {
  V6_ACCEPTANCE_PROFILES,
  runV6AcceptanceProfile
} from './fixtures/v6AcceptanceProfiles';
import {
  pullWeeklySets,
  tractionMinSets,
  daySignature,
  sessionDurationCoherent,
  countDedicatedCardioDays,
  allExerciseKeys
} from './quizV6DoDHelpers';
import { PLAN_COST_WARN_THRESHOLD } from './quizPlanCost';

const FIXTURE_DIR = join(process.cwd(), 'docs', 'sport', 'fixtures', 'v6');

describe('SPEC §9 — Definition of Done v6 (rigoureux)', () => {
  describe('Profil hypertrophie street 3j — A1–A7', () => {
    const answers = V6_ACCEPTANCE_PROFILES.hypertrophy_street_3j;
    const days = answers.availableTrainingDays;

    it('A1–A7 + meta + planCost', () => {
      const { schedule, quizGenerationMeta } = runV6AcceptanceProfile(answers);
      const blob = days
        .flatMap((d) => (schedule[d]?.exercises || []).map((e) => `${e.exerciseBankKey} ${e.name}`))
        .join(' ')
        .toLowerCase();

      expect(/squat|fente/.test(blob)).toBe(true);

      expect(countDedicatedCardioDays(schedule, days)).toBeLessThanOrEqual(1);

      expect(pullWeeklySets(schedule, days)).toBeGreaterThanOrEqual(10);

      const recovery =
        quizGenerationMeta?.weeklyPlanner?.recoveryBudget?.recoveryBudget ??
        quizGenerationMeta?.loadAnalysis?.recoveryCapacity;
      if (recovery == null || recovery >= 0.85) {
        expect(tractionMinSets(schedule, days)).toBeGreaterThanOrEqual(3);
      }

      if (days.includes('lundi') && days.includes('mercredi')) {
        expect(daySignature(schedule.lundi)).not.toBe(daySignature(schedule.mercredi));
      }

      days.forEach((d) => {
        expect(sessionDurationCoherent(schedule[d], answers)).toBe(true);
      });

      const wp = quizGenerationMeta?.weeklyPlanner;
      expect(wp?.missionId).toBe('hypertrophy_street');
      expect(wp?.dayBlocks).toBeTruthy();
      expect(wp?.strengthFamilies || wp?.budgets?.strengthFamilies).toBeTruthy();
      expect(quizGenerationMeta?.plannerEngine).toBe('v6_hierarchical');
      expect(quizGenerationMeta?.planCost).toBeGreaterThanOrEqual(0);
      expect(quizGenerationMeta?.planCost).toBeLessThan(100);
      expect(quizGenerationMeta?.planCostHigh).toBe(
        quizGenerationMeta.planCost >= PLAN_COST_WARN_THRESHOLD
      );
      expect(Array.isArray(wp?.arbitration || wp?.budgets?.arbitration)).toBe(true);
    });
  });

  describe('Prep 10k — B1–B4', () => {
    const answers = V6_ACCEPTANCE_PROFILES.prep_10k;

    it('B1–B4 course', () => {
      const { schedule, quizGenerationMeta } = runV6AcceptanceProfile(answers);
      const wp = quizGenerationMeta?.weeklyPlanner;
      const target = wp?.run?.kmTarget ?? wp?.budgets?.run?.kmTarget;
      expect(target).toBeTruthy();
      if (target) {
        expect(target).toBeGreaterThanOrEqual(15);
        expect(target).toBeLessThanOrEqual(50);
      }
      const runBlocks = Object.values(wp?.dayBlocks || {}).flat().filter((b) => String(b).startsWith('run_'));
      expect(runBlocks.length).toBeGreaterThanOrEqual(2);
      expect(/burpee|mountain/.test(allExerciseKeys(schedule))).toBe(false);
      const label = wp?.missionLabelFr || wp?.summaryFr || '';
      expect(label).toMatch(/course|10|km|Mission|Préparation/i);
      expect(wp?.plannedKmTotal ?? wp?.run?.kmTarget).toBeTruthy();
    });
  });

  describe('5 profils fixtures — génération stable', () => {
    Object.entries(V6_ACCEPTANCE_PROFILES).forEach(([profileId, profileAnswers]) => {
      it(`${profileId} : schedule + meta v6`, () => {
        const { schedule, quizGenerationMeta } = runV6AcceptanceProfile(profileAnswers);
        const active = (profileAnswers.availableTrainingDays || []).filter((d) => schedule[d]?.active);
        expect(active.length).toBeGreaterThan(0);
        expect(quizGenerationMeta?.plannerEngine).toBe('v6_hierarchical');
        expect(quizGenerationMeta?.weeklyPlanner).toBeTruthy();
        expect(quizGenerationMeta?.planCost).toBeGreaterThanOrEqual(0);

        if (profileId === 'beginner_total') {
          expect(active.length).toBeLessThanOrEqual(3);
        }
        if (profileId === 'marathon_light') {
          const wp = quizGenerationMeta.weeklyPlanner;
          expect(wp?.run?.kmTarget ?? wp?.plannedKmTotal).toBeGreaterThanOrEqual(50);
        }
        if (profileId === 'triathlon_olympic') {
          expect(quizGenerationMeta?.weeklyPlanner?.missionId).toBe('triathlon_olympic');
        }
      });
    });
  });

  if (process.env.UPDATE_V6_FIXTURES === '1') {
    it('export snapshots JSON (UPDATE_V6_FIXTURES=1)', () => {
      if (!existsSync(FIXTURE_DIR)) mkdirSync(FIXTURE_DIR, { recursive: true });
      Object.entries(V6_ACCEPTANCE_PROFILES).forEach(([id, profileAnswers]) => {
        const bundle = runV6AcceptanceProfile(profileAnswers);
        const payload = {
          profileId: id,
          exportedAt: new Date().toISOString(),
          schedule: bundle.schedule,
          quizGenerationMeta: bundle.quizGenerationMeta
        };
        writeFileSync(join(FIXTURE_DIR, `${id}.json`), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
      });
      expect(Object.keys(V6_ACCEPTANCE_PROFILES).length).toBeGreaterThanOrEqual(6);
    });
  }
});
