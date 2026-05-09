import { describe, it, expect } from 'vitest';
import {
  generateCircuitId,
  normalizeCircuitDefinition,
  upsertCircuitDefinition,
  removeCircuitDefinition,
  getCircuitIdsForDay,
  toggleCircuitOnProgramDay,
  incrementRound,
  decrementRound,
  listCircuits,
  getCircuitDailyHistory,
  getCircuitProgramAssignments
} from '../circuitDefinitionUtils';

describe('normalizeCircuitDefinition', () => {
  it('génère un id et clamp les valeurs aberrantes', () => {
    const def = normalizeCircuitDefinition({
      name: '   Mon circuit  ',
      targetRounds: 999,
      restBetweenRoundsSec: -10,
      items: [
        { exerciseKey: 'pompes', exerciseName: 'Pompes', mode: 'reps', targetReps: 0 },
        { exerciseKey: 'plank', exerciseName: 'Planche', mode: 'duration', targetDurationSec: 0 },
        { exerciseKey: '', exerciseName: 'X' }, // ignoré (pas de exerciseKey)
        null
      ]
    });
    expect(def.id).toMatch(/^c_/);
    expect(def.name).toBe('Mon circuit');
    expect(def.targetRounds).toBe(50); // clamped
    expect(def.restBetweenRoundsSec).toBe(0);
    expect(def.items).toHaveLength(2);
    expect(def.items[0].targetReps).toBeGreaterThan(0); // remis à défaut
    expect(def.items[1].targetDurationSec).toBeGreaterThan(0);
  });

  it('dédoublonne et normalise les muscles', () => {
    const def = normalizeCircuitDefinition({
      name: 'X',
      targetRounds: 3,
      primaryMuscles: ['Pectoraux', 'pectoraux', '  ', 42, 'Triceps'],
      items: []
    });
    expect(def.primaryMuscles).toEqual(['Pectoraux', 'pectoraux', 'Triceps']);
  });
});

describe('upsert / remove / list', () => {
  it("upsert ajoute puis remplace une définition", () => {
    const a = normalizeCircuitDefinition({ id: 'c1', name: 'A', targetRounds: 3, items: [] });
    let map = upsertCircuitDefinition({}, a);
    expect(Object.keys(map)).toEqual(['c1']);
    const a2 = normalizeCircuitDefinition({ id: 'c1', name: 'A bis', targetRounds: 4, items: [] });
    map = upsertCircuitDefinition(map, a2);
    expect(map.c1.name).toBe('A bis');
    expect(map.c1.targetRounds).toBe(4);
  });

  it('removeCircuitDefinition nettoie aussi le progress associé', () => {
    const map = {
      c1: { id: 'c1', name: 'A', targetRounds: 2, items: [] },
      c2: { id: 'c2', name: 'B', targetRounds: 2, items: [] }
    };
    const progress = {
      '2026-05-01': { c1: { roundsCompleted: 2 }, c2: { roundsCompleted: 1 } }
    };
    const out = removeCircuitDefinition({ circuitDefinitions: map, circuitProgress: progress }, 'c1');
    expect(out.circuitDefinitions.c1).toBeUndefined();
    expect(out.circuitProgress['2026-05-01'].c1).toBeUndefined();
    expect(out.circuitProgress['2026-05-01'].c2.roundsCompleted).toBe(1);
  });

  it('listCircuits filtre par muscle et par recherche', () => {
    const defs = {
      a: { id: 'a', name: 'Core EMOM', primaryMuscles: ['Abdominaux'], items: [{ exerciseName: 'Plank' }] },
      b: { id: 'b', name: 'Pec circuit', primaryMuscles: ['Pectoraux'], items: [{ exerciseName: 'Pompes' }] }
    };
    expect(listCircuits(defs, { muscle: 'Pectoraux' })).toHaveLength(1);
    expect(listCircuits(defs, { search: 'plank' })).toHaveLength(1);
    expect(listCircuits(defs, { search: 'inconnu' })).toHaveLength(0);
  });
});

describe('toggleCircuitOnProgramDay', () => {
  it('ajoute / retire un id sans dupliquer', () => {
    let p = { id: 'p1', schedule: { lundi: { name: 'L', exercises: [] } } };
    p = toggleCircuitOnProgramDay(p, 'lundi', 'c1', true);
    expect(getCircuitIdsForDay(p, 'lundi')).toEqual(['c1']);
    p = toggleCircuitOnProgramDay(p, 'lundi', 'c1', true); // idempotent
    expect(getCircuitIdsForDay(p, 'lundi')).toEqual(['c1']);
    p = toggleCircuitOnProgramDay(p, 'lundi', 'c1', false);
    expect(getCircuitIdsForDay(p, 'lundi')).toEqual([]);
  });
});

describe('increment / decrement / history', () => {
  const def = { targetRounds: 3 };
  it('incrémente sans écraser les autres clés', () => {
    let progress = {};
    progress = incrementRound(progress, '2026-05-01', 'c1', def);
    progress = incrementRound(progress, '2026-05-01', 'c1', def);
    progress = incrementRound(progress, '2026-05-01', 'c1', def); // 3 → cible atteinte
    expect(progress['2026-05-01'].c1.roundsCompleted).toBe(3);
    expect(progress['2026-05-01'].c1.finishedAt).toBeDefined();
  });

  it('décrémente jusqu\'à supprimer la clé puis le jour vide', () => {
    let progress = { '2026-05-01': { c1: { roundsCompleted: 1 } } };
    progress = decrementRound(progress, '2026-05-01', 'c1');
    expect(progress['2026-05-01']).toBeUndefined();
  });

  it('historique calendrier renvoie {date,totalRounds,completedCircuits}', () => {
    const defs = {
      c1: { id: 'c1', name: 'A', targetRounds: 3 },
      c2: { id: 'c2', name: 'B', targetRounds: 5 }
    };
    const progress = {
      '2026-05-01': { c1: { roundsCompleted: 4 }, c2: { roundsCompleted: 2 } },
      '2026-05-02': { c1: { roundsCompleted: 1 } } // sous cible mais > 0
    };
    const hist = getCircuitDailyHistory(progress, defs);
    expect(hist).toHaveLength(2);
    expect(hist[0].date).toBe('2026-05-02');
    const may1 = hist.find((h) => h.date === '2026-05-01');
    expect(may1.totalRounds).toBe(6);
    expect(may1.completedCircuits).toBe(1); // seul c1 (4 >= 3)
  });
});

describe('getCircuitProgramAssignments — liaison Programme ↔ Hub', () => {
  const programs = [
    {
      id: 'p1',
      name: 'Mon programme',
      schedule: {
        lundi: { name: 'Push', circuitIds: ['c1', 'c2'] },
        mercredi: { name: 'Pull', circuitIds: ['c1'] },
        vendredi: { name: 'Legs' }
      }
    },
    {
      id: 'p2',
      name: 'Programme alt',
      schedule: {
        mardi: { name: 'Cardio', circuitIds: ['c2'] }
      }
    }
  ];

  it('liste tous les jours/programmes où un circuit est assigné', () => {
    const c1 = getCircuitProgramAssignments('c1', programs);
    expect(c1).toEqual([
      { programId: 'p1', programName: 'Mon programme', dayName: 'lundi' },
      { programId: 'p1', programName: 'Mon programme', dayName: 'mercredi' }
    ]);

    const c2 = getCircuitProgramAssignments('c2', programs);
    expect(c2).toHaveLength(2);
    expect(c2[0]).toEqual({ programId: 'p1', programName: 'Mon programme', dayName: 'lundi' });
    expect(c2[1]).toEqual({ programId: 'p2', programName: 'Programme alt', dayName: 'mardi' });
  });

  it('renvoie [] si aucun programme cible le circuit', () => {
    expect(getCircuitProgramAssignments('inexistant', programs)).toEqual([]);
  });

  it('ignore les programmes sans schedule ou les days sans circuitIds', () => {
    const safe = getCircuitProgramAssignments('c1', [
      null,
      { id: 'p3', name: 'Vide', schedule: {} },
      { id: 'p4', name: 'Pas de circuitIds', schedule: { lundi: { name: 'X' } } }
    ]);
    expect(safe).toEqual([]);
  });
});
