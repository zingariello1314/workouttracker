import { describe, expect, it } from 'vitest';
import {
  buildDayPlanSnapshotFromExercises,
  collectStorageIdsForDate,
  ensureDayPlanSnapshot,
  getDayPlanSnapshot,
  hasPerformanceKeysForDate,
  reconstructDayPlanSnapshotFromKeys,
  resolveExercisesForCalendarDate,
  snapshotExercisesToDisplayList,
  withDayPlanSnapshot
} from '../calendarDayPlanSnapshot';

const DATE = '2026-10-01';

function livePlanABC() {
  return [
    { id: 101, originalId: 'exo_a', name: 'A', series: '3x10' },
    { id: 102, originalId: 'exo_b', name: 'B', series: '3x10' },
    { id: 103, originalId: 'exo_c', name: 'C', series: '3x8' },
    { id: 104, originalId: 'exo_d', name: 'D', series: '3x12' },
    { id: 105, originalId: 'exo_e', name: 'E', series: '3x10' },
    { id: 106, originalId: 'exo_f', name: 'F', series: '3x10' }
  ];
}

function livePlanXYZ() {
  return [
    { id: 201, originalId: 'exo_x', name: 'X', series: '4x8' },
    { id: 202, originalId: 'exo_y', name: 'Y', series: '4x8' },
    { id: 203, originalId: 'exo_z', name: 'Z', series: '4x8' },
    { id: 104, originalId: 'exo_d', name: 'D', series: '3x12' },
    { id: 105, originalId: 'exo_e', name: 'E', series: '3x10' },
    { id: 106, originalId: 'exo_f', name: 'F', series: '3x10' }
  ];
}

describe('calendarDayPlanSnapshot — ancrage historique (21.H)', () => {
  it('1. enregistrer puis changer le programme : le jour passé reste ABC…F', () => {
    let data = {
      checkedExercises: { [`${DATE}_101`]: true, [`${DATE}_102`]: true },
      reps: { [`${DATE}_101`]: '30', [`${DATE}_102`]: '28' },
      calendarDayPlanSnapshots: {}
    };
    data = ensureDayPlanSnapshot(data, DATE, livePlanABC(), { programId: 'prog1' });

    // Programme remplacé par XYZ
    const resolved = resolveExercisesForCalendarDate({
      dateStr: DATE,
      workoutData: data,
      liveExercises: livePlanXYZ()
    });

    expect(resolved.source).toBe('snapshot');
    const names = resolved.exercises.map((e) => e.name);
    expect(names).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
    expect(names).not.toContain('X');
    expect(names).not.toContain('Y');
    expect(names).not.toContain('Z');
  });

  it('2. supprimer un exo du programme live : il reste consultable historiquement', () => {
    let data = ensureDayPlanSnapshot(
      { checkedExercises: { [`${DATE}_101`]: true }, reps: {}, calendarDayPlanSnapshots: {} },
      DATE,
      livePlanABC(),
      { programId: 'prog1' }
    );
    const withoutA = livePlanABC().filter((e) => e.originalId !== 'exo_a');
    const resolved = resolveExercisesForCalendarDate({
      dateStr: DATE,
      workoutData: data,
      liveExercises: withoutA
    });
    expect(resolved.exercises.some((e) => e.name === 'A')).toBe(true);
  });

  it('3. remplacer A,B,C par X,Y,Z : pas de remplacement rétroactif', () => {
    let data = ensureDayPlanSnapshot(
      {
        checkedExercises: { [`${DATE}_101`]: true },
        reps: { [`${DATE}_101`]: '12' },
        calendarDayPlanSnapshots: {}
      },
      DATE,
      livePlanABC(),
      { programId: 'prog1' }
    );
    const resolved = resolveExercisesForCalendarDate({
      dateStr: DATE,
      workoutData: data,
      liveExercises: livePlanXYZ()
    });
    const ids = resolved.exercises.map((e) => String(e.originalId));
    expect(ids).toContain('exo_a');
    expect(ids).not.toContain('exo_x');
  });

  it('4. éditer une perf historique n’altère pas les autres jours', () => {
    const other = '2026-10-02';
    let data = {
      checkedExercises: {
        [`${DATE}_101`]: true,
        [`${other}_201`]: true
      },
      reps: {
        [`${DATE}_101`]: '30',
        [`${other}_201`]: '40'
      },
      calendarDayPlanSnapshots: {}
    };
    data = ensureDayPlanSnapshot(data, DATE, livePlanABC(), { programId: 'p' });
    data = ensureDayPlanSnapshot(data, other, livePlanXYZ(), { programId: 'p' });

    // Correction sur DATE uniquement
    data = {
      ...data,
      reps: { ...data.reps, [`${DATE}_101`]: '25' },
      checkedExercises: { ...data.checkedExercises, [`${DATE}_101`]: false }
    };

    expect(data.reps[`${other}_201`]).toBe('40');
    expect(data.checkedExercises[`${other}_201`]).toBe(true);
    expect(getDayPlanSnapshot(data, other)?.exercises?.map((e) => e.name)).toContain('X');
    expect(getDayPlanSnapshot(data, DATE)?.exercises?.map((e) => e.name)).toContain('A');
  });

  it('5. reload : noms / params / états conservés via snapshot', () => {
    let data = ensureDayPlanSnapshot(
      {
        checkedExercises: { [`${DATE}_101`]: true },
        reps: { [`${DATE}_101`]: '30' },
        calendarDayPlanSnapshots: {}
      },
      DATE,
      livePlanABC(),
      { programId: 'prog1', variant: 'maison' }
    );
    // Simule relecture JSON
    const reloaded = JSON.parse(JSON.stringify(data));
    const snap = getDayPlanSnapshot(reloaded, DATE);
    expect(snap.variant).toBe('maison');
    expect(snapshotExercisesToDisplayList(snap).map((e) => e.name)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'E',
      'F'
    ]);
    expect(reloaded.checkedExercises[`${DATE}_101`]).toBe(true);
    expect(reloaded.reps[`${DATE}_101`]).toBe('30');
  });

  it('6. aucune coche inventée à la reconstruction', () => {
    const data = {
      checkedExercises: { [`${DATE}_101`]: true },
      reps: { [`${DATE}_101`]: '10', [`${DATE}_999`]: '5' },
      calendarDayPlanSnapshots: {}
    };
    const resolved = resolveExercisesForCalendarDate({
      dateStr: DATE,
      workoutData: data,
      liveExercises: livePlanXYZ(),
      getExerciseNameById: (id) => (String(id) === '101' ? 'A' : null)
    });
    expect(resolved.source).toBe('reconstruct');
    // Reconstruction liste les ids présents, sans créer de checkedExercises
    expect(data.checkedExercises[`${DATE}_999`]).toBeUndefined();
    expect(resolved.exercises.some((e) => String(e.id) === '999' || String(e.storageId) === '999')).toBe(
      true
    );
    expect(Object.keys(data.checkedExercises)).toEqual([`${DATE}_101`]);
  });

  it('7. ensureDayPlanSnapshot n’écrase jamais un snapshot existant', () => {
    let data = ensureDayPlanSnapshot(
      { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} },
      DATE,
      livePlanABC(),
      { programId: 'v1' }
    );
    data = ensureDayPlanSnapshot(data, DATE, livePlanXYZ(), { programId: 'v2' });
    expect(getDayPlanSnapshot(data, DATE).programId).toBe('v1');
    expect(getDayPlanSnapshot(data, DATE).exercises.map((e) => e.name)[0]).toBe('A');
  });

  it('8. jour sans perf → live ; combinaison d’écriture isolée par date', () => {
    const empty = { checkedExercises: {}, reps: {}, calendarDayPlanSnapshots: {} };
    const live = resolveExercisesForCalendarDate({
      dateStr: DATE,
      workoutData: empty,
      liveExercises: livePlanXYZ()
    });
    expect(live.source).toBe('live');
    expect(live.exercises.map((e) => e.name)).toContain('X');

    const d1 = ensureDayPlanSnapshot(empty, DATE, livePlanABC(), { programId: 'p' });
    const d2 = ensureDayPlanSnapshot(d1, '2026-10-08', livePlanXYZ(), {
      programId: 'p',
      combinedDays: ['lundi', 'vendredi']
    });
    expect(getDayPlanSnapshot(d2, DATE).exercises[0].name).toBe('A');
    expect(getDayPlanSnapshot(d2, '2026-10-08').combinedDays).toEqual(['lundi', 'vendredi']);
    expect(getDayPlanSnapshot(d2, '2026-10-08').exercises[0].name).toBe('X');
  });

  it('hasPerformanceKeysForDate / collectStorageIdsForDate', () => {
    expect(hasPerformanceKeysForDate({}, DATE)).toBe(false);
    expect(
      hasPerformanceKeysForDate({ checkedExercises: { [`${DATE}_1`]: true } }, DATE)
    ).toBe(true);
    expect(
      collectStorageIdsForDate(
        { checkedExercises: { [`${DATE}_10_semaineA`]: true }, reps: { [`${DATE}_11`]: '3' } },
        DATE
      ).sort()
    ).toEqual(['10', '11']);
  });

  it('buildDayPlanSnapshotFromExercises fige name + storageId', () => {
    const snap = buildDayPlanSnapshotFromExercises({
      dateStr: DATE,
      exercises: livePlanABC().slice(0, 2),
      programId: 'p'
    });
    expect(snap.exercises[0]).toMatchObject({
      storageId: '101',
      originalId: 'exo_a',
      name: 'A'
    });
  });

  it('withDayPlanSnapshot est immutable sur les autres dates', () => {
    const base = withDayPlanSnapshot(
      { calendarDayPlanSnapshots: {} },
      DATE,
      buildDayPlanSnapshotFromExercises({ dateStr: DATE, exercises: livePlanABC() })
    );
    const next = withDayPlanSnapshot(
      base,
      '2026-10-03',
      buildDayPlanSnapshotFromExercises({ dateStr: '2026-10-03', exercises: livePlanXYZ() })
    );
    expect(getDayPlanSnapshot(next, DATE).exercises[0].name).toBe('A');
    expect(getDayPlanSnapshot(next, '2026-10-03').exercises[0].name).toBe('X');
  });

  it('reconstruct utilise getExerciseNameById sans inventer de noms fantaisistes', () => {
    const snap = reconstructDayPlanSnapshotFromKeys(
      { checkedExercises: { [`${DATE}_42`]: true }, reps: {} },
      DATE,
      { getExerciseNameById: (id) => (String(id) === '42' ? 'Tractions' : null) }
    );
    expect(snap.exercises[0].name).toBe('Tractions');
    const unknown = reconstructDayPlanSnapshotFromKeys(
      { checkedExercises: {}, reps: { [`${DATE}_77`]: '9' } },
      DATE,
      {}
    );
    expect(unknown.exercises[0].name).toMatch(/inconnu/i);
  });
});
