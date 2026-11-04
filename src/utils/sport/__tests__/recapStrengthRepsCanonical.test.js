import { describe, expect, it } from 'vitest';
import { aggregateCheckedRepsByDateAndExerciseId } from '../../trainingLoadUtils.js';

/**
 * Convention canonique des reps de renforcement Recap :
 * meilleure entrée cochée par (date, exerciseId), complementary_endurance_pushups
 * conservé (les fantômes pompes sont nettoyés à la sync, pas ici).
 *
 * Les totaux historiques 4 889 / 1 156 ne sont PAS une cible à reproduire :
 * sur snapshot live ils ne se reconstitue pas — voir rapport d’audit.
 */
function sumWindow(grouped, start, end) {
  let total = 0;
  const days = new Set();
  grouped.forEach(({ reps }, gkey) => {
    const sep = gkey.indexOf('::');
    const d = gkey.slice(0, sep);
    if (d < start || d > end) return;
    total += reps;
    days.add(d);
  });
  return { total, days: days.size };
}

describe('canonical strength reps aggregation', () => {
  it('prend le max par (date, id) et garde complementary_endurance_pushups', () => {
    const reps = {
      '2026-10-13_104': '80',
      '2026-10-13_104_semaineA': '100',
      '2026-10-13_complementary_endurance_pushups': '100',
      '2026-10-13_448199957': '100', // mollets — même total, autre exercice
      '2026-10-30_501': '351'
    };
    const checked = Object.fromEntries(Object.keys(reps).map((k) => [k, true]));
    const grouped = aggregateCheckedRepsByDateAndExerciseId(reps, checked);
    expect(grouped.get('2026-10-13::104')?.reps).toBe(100);
    expect(grouped.get('2026-10-13::complementary_endurance_pushups')?.reps).toBe(100);
    expect(grouped.get('2026-10-13::448199957')?.reps).toBe(100);
    const w = sumWindow(grouped, '2026-10-13', '2026-10-30');
    // 100+100+100 + 351
    expect(w.total).toBe(651);
    expect(w.days).toBe(2);
  });

  it('ignore les complementary_ autres que endurance pushups', () => {
    const reps = {
      '2026-11-01_complementary_foo': '50',
      '2026-11-01_202': '40'
    };
    const checked = {
      '2026-11-01_complementary_foo': true,
      '2026-11-01_202': true
    };
    const grouped = aggregateCheckedRepsByDateAndExerciseId(reps, checked);
    expect(grouped.has('2026-11-01::complementary_foo')).toBe(false);
    expect(grouped.get('2026-11-01::202')?.reps).toBe(40);
  });
});
