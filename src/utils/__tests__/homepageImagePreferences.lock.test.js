import { describe, expect, it } from 'vitest';
import {
  applyHomepageImagePreferences,
  extractHomepageImagePreferences,
  hydrateHomepageImageFromDbItem,
  normalizeHomepageImage
} from '../homepageImagePreferences';

describe('préférences fonds — verrouillage', () => {
  it('restaure useOnLock via la clé contenu même si l’id a changé au reload', () => {
    const original = normalizeHomepageImage(
      {
        id: 'img_old_custom',
        full: 'data:image/png;base64,ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789LOCK',
        useOnHome: true,
        useOnLock: true,
        liked: true
      },
      0
    );
    const prefs = extractHomepageImagePreferences([original]);

    const reloaded = normalizeHomepageImage(
      {
        full: 'data:image/png;base64,ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789LOCK'
      },
      0
    );
    expect(reloaded.id).not.toBe('img_old_custom');

    const applied = applyHomepageImagePreferences([reloaded], prefs)[0];
    expect(applied.useOnLock).toBe(true);
    expect(applied.liked).toBe(true);
    expect(applied.useOnHome).toBe(true);
  });

  it('hydrate les flags depuis un enregistrement IndexedDB sans toucher aux pixels', () => {
    const full = 'data:image/png;base64,PIXELDATA';
    const hydrated = hydrateHomepageImageFromDbItem(
      {
        version: '3.0',
        data: full,
        thumbnail: 'data:image/png;base64,THUMB',
        format: 'webp',
        metadata: { quality: 1 },
        imageId: 'img_keep_me',
        liked: false,
        hidden: false,
        useOnHome: true,
        useOnLock: true
      },
      0
    );

    expect(hydrated.full).toBe(full);
    expect(hydrated.thumbnail).toBe('data:image/png;base64,THUMB');
    expect(hydrated.id).toBe('img_keep_me');
    expect(hydrated.useOnLock).toBe(true);
    expect(hydrated.useOnHome).toBe(true);
  });

  it('ne met pas useOnLock à true par défaut (l’accueil reste inchangé)', () => {
    const img = normalizeHomepageImage({ full: 'data:image/png;base64,HOMEONLY' }, 0);
    expect(img.useOnHome).toBe(true);
    expect(img.useOnLock).toBe(false);
  });
});
