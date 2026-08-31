import { describe, expect, it, beforeEach } from 'vitest';
import {
  readHomeWallpaperPlayback,
  writeHomeWallpaperPlayback
} from '../homepageWallpaperSettings';

describe('homepageWallpaperSettings', () => {
  const key = 'homepage_images_metadata_test-click';

  beforeEach(() => {
    localStorage.removeItem(key);
  });

  it('coche le clic accueil par défaut (comportement déjà actif)', () => {
    expect(readHomeWallpaperPlayback(key).advanceOnClick).toBe(true);
  });

  it('migre l’ancienne valeur par défaut false vers true', () => {
    localStorage.setItem(
      key,
      JSON.stringify({ playback: { rotationMs: 15000, advanceOnClick: false, order: 'random' } })
    );
    expect(readHomeWallpaperPlayback(key).advanceOnClick).toBe(true);
  });

  it('conserve un décochage volontaire', () => {
    writeHomeWallpaperPlayback(key, { rotationMs: 15000, advanceOnClick: false, order: 'random' });
    expect(readHomeWallpaperPlayback(key).advanceOnClick).toBe(false);
  });
});
