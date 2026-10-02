import { describe, it, expect, beforeEach } from 'vitest';
import { nutritionBackupIsUsable } from '../importNutritionBackup';
import { restoreSportLocalSnapshot } from '../sportLocalSnapshot';

describe('nutritionBackupIsUsable', () => {
  it('refuse un export vide ou une base pas prête', () => {
    expect(nutritionBackupIsUsable(null)).toBe(false);
    expect(nutritionBackupIsUsable({ unavailable: true, meals: [{ id: 'm' }] })).toBe(false);
    expect(nutritionBackupIsUsable({ meals: [], dailyMeals: [] })).toBe(false);
  });

  it('accepte des repas réellement présents', () => {
    expect(nutritionBackupIsUsable({ meals: [{ id: 'm', totalCalories: 400 }] })).toBe(true);
  });
});

describe('restoreSportLocalSnapshot', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fusionne les jalons exercice sans effacer ceux déjà là', () => {
    localStorage.setItem(
      'sport.exerciseGradeMilestones.v1',
      JSON.stringify({
        version: 1,
        byCatalog: {
          pompes: { maxSortIndex: 2, events: [{ id: 'e1', at: '2026-01-01' }] }
        }
      })
    );
    restoreSportLocalSnapshot({
      entries: {
        'sport.exerciseGradeMilestones.v1': {
          version: 1,
          byCatalog: {
            pompes: { maxSortIndex: 1, events: [{ id: 'e2', at: '2026-02-01' }] },
            squat: { maxSortIndex: 0, events: [{ id: 's1', at: '2026-03-01' }] }
          }
        }
      }
    });
    const stored = JSON.parse(localStorage.getItem('sport.exerciseGradeMilestones.v1'));
    expect(stored.byCatalog.pompes.maxSortIndex).toBe(2);
    expect(stored.byCatalog.pompes.events.map((e) => e.id).sort()).toEqual(['e1', 'e2']);
    expect(stored.byCatalog.squat.events[0].id).toBe('s1');
  });
});
