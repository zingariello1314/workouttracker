import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import { createSetShiftReader } from '../recapSetShift';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries';
import { applyEditorialGate } from '../recapEditorialGate';
import { detectRecapMilestones } from '../recapMilestoneEngine';

function logSets(snapshot, date, id, repsList) {
  const total = repsList.reduce((sum, n) => sum + n, 0);
  snapshot.reps[`${date}_${id}`] = total;
  snapshot.checkedExercises[`${date}_${id}`] = true;
  snapshot.exerciseSetLogs[`${date}_${id}`] = { sets: repsList.map((reps) => ({ reps })) };
  return total;
}

function bareTotal(snapshot, date, id, reps) {
  snapshot.reps[`${date}_${id}`] = reps;
  snapshot.checkedExercises[`${date}_${id}`] = true;
}

describe('recapSetShift', () => {
  function prior(snapshot, scheme, count = 6) {
    for (let i = 0; i < count; i += 1) {
      logSets(snapshot, DateHelper.addDays('2026-08-01', i * 4), 501, scheme);
    }
  }

  it('attribue la hausse au nombre de séries quand les répétitions par série ne bougent pas', () => {
    const snapshot = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    prior(snapshot, [15, 15, 15]);
    logSets(snapshot, '2026-09-30', 501, [15, 15, 15, 15]);
    const text = createSetShiftReader(snapshot, '2026-09-30').forSession(501, '2026-09-30', 60);
    expect(text).toMatch(/3 séries de 15/);
    expect(text).toMatch(/4 séries de 15/);
    expect(text).toMatch(/nombre de séries augmente/);
    expect(text).toMatch(/même ordre/);
  });

  it('attribue la hausse aux répétitions par série quand le nombre de séries ne bouge pas', () => {
    const snapshot = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    prior(snapshot, [15, 15, 15]);
    logSets(snapshot, '2026-09-30', 501, [20, 20, 20]);
    const text = createSetShiftReader(snapshot, '2026-09-30').forSession(501, '2026-09-30', 60);
    expect(text).toMatch(/nombre de séries reste le même/);
    expect(text).toMatch(/répétitions dans chaque série/);
  });

  it('couvre une hausse des deux, une baisse des deux, et les deux sens mélangés', () => {
    const bothUp = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    prior(bothUp, [12, 12, 12]);
    logSets(bothUp, '2026-09-30', 501, [16, 16, 16, 16]);
    expect(createSetShiftReader(bothUp, '2026-09-30').forSession(501, '2026-09-30', 64)).toMatch(
      /nombre de séries augmente, et chaque série porte plus/
    );

    const bothDown = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    prior(bothDown, [16, 16, 16, 16]);
    logSets(bothDown, '2026-09-30', 501, [12, 12, 12]);
    expect(createSetShiftReader(bothDown, '2026-09-30').forSession(501, '2026-09-30', 36)).toMatch(
      /nombre de séries baisse, et chaque série porte moins/
    );

    const moreSetsLessReps = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    prior(moreSetsLessReps, [20, 20, 20]);
    logSets(moreSetsLessReps, '2026-09-30', 501, [12, 12, 12, 12]);
    expect(createSetShiftReader(moreSetsLessReps, '2026-09-30').forSession(501, '2026-09-30', 48)).toMatch(
      /nombre de séries augmente, mais chaque série porte moins/
    );

    const fewerSetsMoreReps = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    prior(fewerSetsMoreReps, [12, 12, 12, 12]);
    logSets(fewerSetsMoreReps, '2026-09-30', 501, [20, 20, 20]);
    expect(createSetShiftReader(fewerSetsMoreReps, '2026-09-30').forSession(501, '2026-09-30', 60)).toMatch(
      /nombre de séries baisse, et chaque série porte plus/
    );
  });

  it('signale une séance dont les séries ne sont pas égales', () => {
    const snapshot = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    prior(snapshot, [15, 15, 15]);
    logSets(snapshot, '2026-09-30', 501, [12, 15, 18]);
    const text = createSetShiftReader(snapshot, '2026-09-30').forSession(501, '2026-09-30', 45);
    expect(text).toMatch(/12, 15, 18/);
  });

  it('décrit la séance courante seule si l’habitude n’a pas de séries, et n’invente rien sans logs', () => {
    const currentOnly = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    for (let i = 0; i < 6; i += 1) bareTotal(currentOnly, DateHelper.addDays('2026-08-01', i * 4), 501, 45);
    logSets(currentOnly, '2026-09-30', 501, [15, 15, 15, 15]);
    expect(createSetShiftReader(currentOnly, '2026-09-30').forSession(501, '2026-09-30', 60)).toMatch(
      /répartie en 4 séries de 15/
    );

    const none = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    for (let i = 0; i < 6; i += 1) bareTotal(none, DateHelper.addDays('2026-08-01', i * 4), 501, 45);
    bareTotal(none, '2026-09-30', 501, 60);
    expect(createSetShiftReader(none, '2026-09-30').forSession(501, '2026-09-30', 60)).toBe('');
  });

  it('ignore des séries dont la somme ne correspond pas au total de la séance', () => {
    const snapshot = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    prior(snapshot, [15, 15, 15]);
    bareTotal(snapshot, '2026-09-30', 501, 60);
    snapshot.exerciseSetLogs['2026-09-30_501'] = { sets: [{ reps: 20 }, { reps: 20 }] };
    expect(createSetShiftReader(snapshot, '2026-09-30').forSession(501, '2026-09-30', 60)).toBe('');
  });

  it('compare le schéma du début et celui des séances récentes', () => {
    const snapshot = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    for (let i = 0; i < 5; i += 1) logSets(snapshot, DateHelper.addDays('2026-06-01', i * 7), 501, [10, 10, 10]);
    for (let i = 0; i < 5; i += 1) logSets(snapshot, DateHelper.addDays('2026-08-01', i * 7), 501, [12, 12, 12, 12]);
    const text = createSetShiftReader(snapshot, '2026-09-30').acrossLevel(501);
    expect(text).toMatch(/3 séries de 10/);
    expect(text).toMatch(/4 séries de 12/);
    expect(text).toMatch(/nombre de séries augmente, et chaque série porte plus/);
  });

  it('écrit les séries dans la carte de niveau habituel, et accorde ces 7 jours', () => {
    const snapshot = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    const dates = [];
    for (let i = 0; i < 6; i += 1) {
      const date = DateHelper.addDays('2026-08-01', i * 4);
      dates.push(date);
      logSets(snapshot, date, 501, [15, 15, 15]);
    }
    logSets(snapshot, '2026-09-30', 501, [15, 15, 15, 15]);
    const names = (id) => (Number(id) === 501 ? 'Élévations latérales' : `Ex ${id}`);
    const fresh = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-09-24', end: '2026-09-30' },
      period: '7d',
      getExerciseNameById: names
    });
    const vs = fresh.all.find((d) => d.kind === 'disc_vs_habit');
    expect(vs).toBeTruthy();
    expect(vs.body).toMatch(/4 séries de 15/);
    expect(vs.body).toMatch(/nombre de séries augmente/);
    expect(vs.body).not.toMatch(/écart interquartile/);
    const published = applyEditorialGate([vs], { voiceKey: 'week' })[0];
    expect(published.title).toBe('Élévations latérales : ces 7 jours sont au-dessus de ton niveau habituel');
  });
});

describe('retour de mouvement', () => {
  it('ajoute le schéma de séries à la reprise quand les logs existent', () => {
    const dates = [];
    for (let i = 0; i < 8; i += 1) dates.push(`2026-06-${String(1 + i * 2).padStart(2, '0')}`);
    dates.push('2026-08-31');
    const snapshot = { reps: {}, checkedExercises: {}, exerciseSetLogs: {} };
    const catalog = dates.map((date) => {
      const repsList = date === '2026-08-31' ? [20, 20, 20] : [12, 12, 12, 12];
      const reps = logSets(snapshot, date, 101, repsList);
      return {
        date,
        totalReps: reps,
        minutes: 40,
        exercises: [{ id: '101', name: 'Tractions pronation', reps }]
      };
    });
    const ms = detectRecapMilestones({
      catalog,
      snapshot,
      window: { start: '2026-08-31', end: '2026-08-31' },
      voiceKey: 'today'
    });
    const ret = ms.find((m) => m.kind === 'disc_ms_return');
    expect(ret).toBeTruthy();
    expect(ret.body).toMatch(/3 séries de 20/);
    expect(ret.body).toMatch(/nombre de séries baisse, et chaque série porte plus/);
  });
});
