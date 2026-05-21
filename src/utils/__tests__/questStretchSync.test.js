import { describe, it, expect } from 'vitest';
import {
  questStretchMomentScope,
  shouldStretchLinkedQuestBeCompleted,
  isStretchScopeFullyChecked,
} from '../questStretchSync';

const baseQuest = {
  id: 1,
  categorie: 'Étirements',
  completeWithTodaySportStretch: true,
  heureType: 'creneau',
  creneau: 'matin',
};

describe('questStretchSync', () => {
  it('scope matin quand créneau matin', () => {
    expect(questStretchMomentScope(baseQuest)).toBe('matin');
  });

  it('scope all sans plage sport', () => {
    const q = { ...baseQuest, heureType: 'precise', creneau: '' };
    expect(questStretchMomentScope(q)).toBe('all');
  });

  it('matin complet si tous les items matin cochés', () => {
    const slots = {
      matin: [{ id: 9111 }, { id: 9112 }],
      midi: [{ id: 9121 }],
      soir: [],
    };
    const checked = {
      '2026-05-21_stretch_matin_9111': true,
      '2026-05-21_stretch_matin_9112': true,
    };
    expect(
      shouldStretchLinkedQuestBeCompleted(baseQuest, slots, checked, '2026-05-21')
    ).toBe(true);
  });

  it('quête globale exige matin midi soir', () => {
    const q = { ...baseQuest, heureType: 'precise', creneau: '' };
    const slots = {
      matin: [{ id: 1 }],
      midi: [{ id: 2 }],
      soir: [{ id: 3 }],
    };
    const onlyMatin = { '2026-05-21_stretch_matin_1': true };
    expect(isStretchScopeFullyChecked(slots, onlyMatin, '2026-05-21', 'all')).toBe(false);
    const all = {
      '2026-05-21_stretch_matin_1': true,
      '2026-05-21_stretch_midi_2': true,
      '2026-05-21_stretch_soir_3': true,
    };
    expect(shouldStretchLinkedQuestBeCompleted(q, slots, all, '2026-05-21')).toBe(true);
  });
});
