import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  createVariant,
  hideBackground,
  isBackgroundHidden,
  listHiddenBackgroundIds,
  listVariants,
  removeVariant,
  showBackground,
  updateVariant,
  variantNameTaken
} from '../backgroundVariants';

describe('backgroundVariants', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('crée une variante sous un id variant-* distinct', () => {
    const entry = createVariant({
      name: 'Bleu nuit',
      baseId: 'momentum-disc',
      params: { hue: 220 }
    });
    expect(entry).toBeTruthy();
    expect(entry.id.startsWith('variant-')).toBe(true);
    expect(listVariants()).toHaveLength(1);
  });

  it('met à jour une copie existante sans en créer une autre', () => {
    const created = createVariant({
      name: 'Bleu nuit',
      baseId: 'momentum-disc',
      params: { hue: 220 }
    });
    const updated = updateVariant(created.id, { params: { hue: 180 } });
    expect(updated.id).toBe(created.id);
    expect(updated.params.hue).toBe(180);
    expect(listVariants()).toHaveLength(1);
  });

  it('refuse de mettre à jour un id de fond de base', () => {
    expect(updateVariant('momentum-disc', { params: { hue: 1 } })).toBeNull();
  });

  it('refuse de retirer un fond de base', () => {
    expect(removeVariant('momentum-disc')).toBe(false);
  });

  it('détecte un nom déjà pris sauf pour la même copie', () => {
    const created = createVariant({
      name: 'Bleu nuit',
      baseId: 'momentum-disc',
      params: { hue: 220 }
    });
    expect(variantNameTaken('bleu nuit')).toBe(true);
    expect(variantNameTaken('bleu nuit', created.id)).toBe(false);
  });

  it('cache et réaffiche un fond sans le supprimer', () => {
    createVariant({
      name: 'Copie',
      baseId: 'momentum-disc',
      params: { hue: 1 }
    });
    expect(hideBackground('momentum-disc')).toBe(true);
    expect(isBackgroundHidden('momentum-disc')).toBe(true);
    expect(listHiddenBackgroundIds()).toContain('momentum-disc');
    showBackground('momentum-disc');
    expect(isBackgroundHidden('momentum-disc')).toBe(false);
  });
});
