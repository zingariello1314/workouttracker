import { describe, expect, it } from 'vitest';
import {
  buildGtgExerciseDose,
  classifyGtgDoseZone,
  estimateGtgPctOfMax,
  estimateGtgRir,
  getGtgExerciseSignals,
  normalizeGtgDayFeel,
  resolveGtgSignalFamily,
  summarizeGtgProtocolTracking
} from '../gtgProtocolSignals';

describe('resolveGtgSignalFamily', () => {
  it('détecte les familles courantes', () => {
    expect(resolveGtgSignalFamily('pullups')).toBe('pullup');
    expect(resolveGtgSignalFamily('dips')).toBe('dip');
    expect(resolveGtgSignalFamily('pushups')).toBe('pushup');
    expect(resolveGtgSignalFamily('db_1', 'Muscle-up barre')).toBe('muscleup');
    expect(resolveGtgSignalFamily('db_2', 'Handstand hold')).toBe('handstand');
  });
});

describe('getGtgExerciseSignals', () => {
  it('priorise amplitude / trajectoire / vitesse pour tractions', () => {
    expect(getGtgExerciseSignals('pullups').priority).toEqual(['amplitude', 'trajectory', 'speed']);
  });
});

describe('dose helpers', () => {
  it('calcule RIR et %', () => {
    expect(estimateGtgRir(10, 4)).toBe(6);
    expect(estimateGtgPctOfMax(10, 5)).toBe(50);
  });

  it('classe les zones protocole', () => {
    expect(classifyGtgDoseZone(10, 1)).toBe('minimal');
    expect(classifyGtgDoseZone(10, 2)).toBe('conservative');
    expect(classifyGtgDoseZone(10, 3)).toBe('solid');
    expect(classifyGtgDoseZone(10, 4)).toBe('demanding');
    expect(classifyGtgDoseZone(10, 5)).toBe('classic');
  });

  it('buildGtgExerciseDose agrège', () => {
    const d = buildGtgExerciseDose('pullups', { maxReps: 10, repsPerSet: 5, label: 'Tractions' });
    expect(d.zone).toBe('classic');
    expect(d.rir).toBe(5);
    expect(d.pctOfMax).toBe(50);
    expect(d.signals.family).toBe('pullup');
  });
});

describe('normalizeGtgDayFeel', () => {
  it('n’accepte que les 4 valeurs', () => {
    expect(normalizeGtgDayFeel('easy')).toBe('easy');
    expect(normalizeGtgDayFeel('nope')).toBe(null);
  });
});

describe('summarizeGtgProtocolTracking', () => {
  it('alerte sur dose chaude et ressenti stressé', () => {
    const doses = [
      buildGtgExerciseDose('pullups', { maxReps: 10, repsPerSet: 6, label: 'Tractions' })
    ];
    const feelByDate = {
      '2026-10-01': 'hard',
      '2026-10-02': 'drift',
      '2026-10-03': 'easy'
    };
    const s = summarizeGtgProtocolTracking({ doses, feelByDate });
    expect(s.hotDoses).toHaveLength(1);
    expect(s.alerts.some((a) => a.kind === 'dose')).toBe(true);
    expect(s.alerts.some((a) => a.kind === 'feel')).toBe(true);
  });

  it('ne flagge pas le ~50 % classique par défaut', () => {
    const doses = [
      buildGtgExerciseDose('pullups', { maxReps: 10, repsPerSet: 5, label: 'Tractions' })
    ];
    const s = summarizeGtgProtocolTracking({ doses, feelByDate: {} });
    expect(s.hotDoses).toHaveLength(0);
  });
});
