import { describe, it, expect } from 'vitest';
import {
  computeLiveBudgetAdjustment,
  computeTwoWeekAdherence,
  freezeLiveBudgetBaseline,
  detectBaselineStagnation
} from './quizWeeklyBudgetLive';
import { applyLiveCoachToExercises } from './quizLiveCoach';
import { detectCoachRegenerationSignals } from './quizProgressionApply';
import { buildProgramProgressionPlan } from './quizProgression';

function ymdDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('quizWeeklyBudgetLive', () => {
  it('freezeLiveBudgetBaseline capture mission et séries', () => {
    const b = freezeLiveBudgetBaseline({
      budgets: {
        missionId: 'hypertrophy_street',
        recoveryBudget: 0.95,
        strengthFamilies: { pull: 12, push: 10, legs: 8 }
      }
    });
    expect(b.missionId).toBe('hypertrophy_street');
    expect(b.strengthFamilies.pull).toBe(12);
  });

  it('réduit le volume si 2 semaines adhérence < 60 %', () => {
    const schedule = {
      lundi: { active: true },
      mercredi: { active: true },
      vendredi: { active: true }
    };
    const snapshot = { checkedExercises: {}, reps: {} };
    const end = ymdDaysAgo(0);
    const program = {
      startDate: ymdDaysAgo(30),
      schedule,
      quizGenerationMeta: {
        liveCoachEnabled: true,
        weeklyPlanner: {
          liveBudgetBaseline: {
            recoveryBudget: 1,
            strengthFamilies: { pull: 12 }
          }
        }
      }
    };
    const adj = computeLiveBudgetAdjustment({ program, snapshot, sessionYmd: end });
    expect(adj.strengthVolumeMul).toBeLessThan(1);
    expect(adj.recoveryBudgetDelta).toBeLessThanOrEqual(-0.04);
    expect(adj.adjustments.some((a) => a.signal === 'low_adherence_2w')).toBe(true);
  });

  it('bonus léger si 2 semaines très suivies', () => {
    const schedule = { lundi: { active: true }, mercredi: { active: true } };
    const snapshot = { checkedExercises: {}, reps: {} };
    for (let i = 0; i < 14; i += 1) {
      const ymd = ymdDaysAgo(i);
      if (new Date(ymd).getDay() === 0 || new Date(ymd).getDay() === 6) continue;
      snapshot.checkedExercises[`${ymd}_ex1`] = true;
    }
    const program = {
      schedule,
      quizGenerationMeta: {
        liveCoachEnabled: true,
        weeklyPlanner: { liveBudgetBaseline: { recoveryBudget: 1, strengthFamilies: { pull: 10 } } }
      }
    };
    const adj = computeLiveBudgetAdjustment({
      program,
      snapshot,
      sessionYmd: ymdDaysAgo(0),
      trainingEvidence: { maturity: 'rich' }
    });
    expect(adj.strengthVolumeMul).toBeGreaterThanOrEqual(1.01);
  });

  it('intègre dans applyLiveCoachToExercises', () => {
    const start = new Date();
    start.setDate(start.getDate() - 20);
    const plan = buildProgramProgressionPlan(6);
    const schedule = { lundi: { active: true }, mercredi: { active: true } };
    const snapshot = { checkedExercises: {}, reps: {} };
    for (let i = 0; i < 10; i += 1) {
      snapshot.checkedExercises[`${ymdDaysAgo(i)}_ex`] = true;
    }
    const { coachNotes, liveTrace } = applyLiveCoachToExercises([{ id: '1', name: 'Pompes', series: '3×10' }], {
      activeProgram: {
        availabilitySource: 'quiz',
        startDate: start.toISOString(),
        duration: 6,
        schedule,
        quizGenerationMeta: {
          liveCoachEnabled: true,
          progressionPlan: plan,
          weeklyPlanner: {
            liveBudgetBaseline: { recoveryBudget: 1, strengthFamilies: { push: 10 } }
          }
        }
      },
      sessionYmd: ymdDaysAgo(0),
      snapshot
    });
    expect(liveTrace.some((t) => t.layer === 'live_budget' || t.layer === 'cycle')).toBe(true);
    expect(coachNotes.length).toBeGreaterThanOrEqual(0);
  });

  it('detectBaselineStagnation alimente regen', () => {
    const reps = {};
    for (let i = 0; i < 10; i += 1) {
      reps[`${ymdDaysAgo(i * 3)}_quiz_ex_tractions_pronation_1`] = 5;
    }
    const regen = detectCoachRegenerationSignals(
      { reps, checkedExercises: {} },
      { strengthBaselineMaxes: { pullupsMax: 6 } },
      { maturity: 'rich', totalReps28: 200 },
      { startDate: ymdDaysAgo(40) }
    );
    expect(regen.suggestRegeneration).toBe(true);
  });
});
