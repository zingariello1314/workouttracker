import { describe, expect, it } from 'vitest';
import { shouldRejectEmptyProgramOverwrite } from '../programPersistenceUtils';

describe('shouldRejectEmptyProgramOverwrite', () => {
  const existing = { programs: [{ id: 'default-program', name: 'Modifié' }] };

  it('refuse d’écraser des programmes enregistrés par une liste vide', () => {
    expect(shouldRejectEmptyProgramOverwrite(existing, [])).toBe(true);
  });

  it('accepte une sauvegarde qui contient encore les programmes', () => {
    expect(shouldRejectEmptyProgramOverwrite(existing, existing.programs)).toBe(false);
  });

  it('accepte une suppression explicite', () => {
    expect(shouldRejectEmptyProgramOverwrite(existing, [], true)).toBe(false);
  });

  it('accepte une base encore vide', () => {
    expect(shouldRejectEmptyProgramOverwrite({ programs: [] }, [])).toBe(false);
    expect(shouldRejectEmptyProgramOverwrite(null, [])).toBe(false);
  });
});
