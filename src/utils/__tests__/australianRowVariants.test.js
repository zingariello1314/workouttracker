import { describe, expect, it } from 'vitest';
import { exerciseDatabase, findExerciseInDatabase } from '../../data/exerciseDatabase';
import { ALL_SCORING_ENTRIES } from '../../data/exerciseScoring';
import { resolveExerciseScoring } from '../exerciseScoringResolver';
import { listExerciseVariationsForProgramExercise } from '../exerciseVariationResolver';
import { buildBankExerciseViewFromDatabaseKey } from '../exerciseBankViewModel';

const GRIP_KEYS = [
  'tractions australiennes',
  'tractions australiennes prise serrée pronation',
  'tractions australiennes prise large pronation',
  'tractions australiennes prise large supination',
  'tractions australiennes prise serrée supination',
  'tractions australiennes prise neutre'
];

describe('cartes tractions australiennes par prise', () => {
  it('expose une fiche banque complète par variante', () => {
    GRIP_KEYS.forEach((key) => {
      const ex = exerciseDatabase[key];
      expect(ex, key).toBeTruthy();
      expect(ex.category).toBe('Dorsaux');
      expect(ex.primaryMuscles.length).toBeGreaterThan(0);
      expect(ex.description).toMatch(/Prise :/);
      expect(ex.description).toMatch(/Exécution :/);
      expect(ex.description).toMatch(/inclinaison/);
      const card = buildBankExerciseViewFromDatabaseKey(key);
      expect(card?.name).toMatch(/Tractions australiennes/i);
      expect(resolveExerciseScoring(card)?.unit).toBe('reps');
    });
  });

  it('garde la clé historique pour les programmes / quiz', () => {
    expect(findExerciseInDatabase('tractions australiennes')?.name).toMatch(/prise pronation/i);
    expect(exerciseDatabase['tractions australiennes'].variations).toContain('tractions australiennes');
  });

  it('relie les prises comme variantes d’une même famille', () => {
    const rows = listExerciseVariationsForProgramExercise({
      name: 'Tractions australiennes — prise neutre',
      databaseKey: 'tractions australiennes prise neutre'
    });
    const keys = rows.map((r) => r.databaseKey);
    GRIP_KEYS.forEach((k) => expect(keys).toContain(k));
    expect(keys).toContain('rowing australien pieds surélevés');
  });

  it('aligne le scoring sur les noms de cartes (pas de doublon générique)', () => {
    const names = ALL_SCORING_ENTRIES.filter((e) => /australiennes/i.test(e.name)).map((e) => e.name);
    expect(names).toContain('Tractions australiennes — prise pronation');
    expect(names).not.toContain('Tractions australiennes');
  });
});
