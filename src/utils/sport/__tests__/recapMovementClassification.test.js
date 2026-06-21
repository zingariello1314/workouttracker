import { describe, expect, it } from 'vitest';
import { buildTemplateProgramsForFirstLaunch } from '../../programPersistenceUtils';
import {
  classifyMovement,
  inferProgramCadenceLabel,
  isStructuralLegExercise,
  scanDedicatedPlanExposure,
  scanStructuralLegPlan
} from '../recapMovementClassification';

describe('recapMovementClassification', () => {
  it('ignore les abdos « jambes tendues » comme jambes structurelles', () => {
    expect(
      isStructuralLegExercise({ id: 1012, name: 'Jambes tendues rétroversées', type: 'circuit_abdos' }, null)
    ).toBe(false);
    expect(classifyMovement({ id: 1012, name: 'Jambes tendues rétroversées', type: 'circuit_abdos' }, null).isLeg).toBe(
      false
    );
  });

  it('détecte squat et fentes comme jambes', () => {
    expect(isStructuralLegExercise({ id: 731, name: 'Squat', series: '4×8' }, null)).toBe(true);
    expect(isStructuralLegExercise({ id: 733, name: 'Fentes marchées', series: '3×10' }, null)).toBe(true);
  });

  it('ne gonfle pas push/pull/jambes à ~6 j./sem sur Cycle 3+1', () => {
    const { defaultProgram } = buildTemplateProgramsForFirstLaunch();
    const exp = scanDedicatedPlanExposure(defaultProgram, (id) => `Ex ${id}`);
    const legStruct = scanStructuralLegPlan(defaultProgram);
    expect(exp.legDays).toBe(0);
    expect(legStruct.legSlotsPerWeek).toBeLessThanOrEqual(0.4);
    expect(exp.pushDays + exp.pullDays + exp.mixedDays).toBeLessThanOrEqual(6);
    expect(exp.pushDays).toBeLessThan(6);
    expect(exp.pullDays).toBeLessThan(6);
  });

  it('scanStructuralLegPlan : variante salle seulement → ~0.33/sem', () => {
    const { defaultProgram } = buildTemplateProgramsForFirstLaunch();
    const leg = scanStructuralLegPlan(defaultProgram);
    expect(leg.dedicatedLegDays).toBe(0);
    expect(leg.optionalLegSlots).toBeGreaterThanOrEqual(1);
    expect(leg.legSlotsPerWeek).toBeLessThanOrEqual(0.4);
  });

  it('inferProgramCadenceLabel détecte 3+1', () => {
    const { defaultProgram } = buildTemplateProgramsForFirstLaunch();
    const cadence = inferProgramCadenceLabel(defaultProgram);
    expect(cadence?.label).toBe('3 + 1');
  });
});
