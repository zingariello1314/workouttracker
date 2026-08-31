import { afterEach, describe, expect, it, vi } from 'vitest';
import { pickInitialLockWallpaperIndex, pickRandomWallpaperIndex } from '../lockWallpaperPreload';

describe('lockWallpaperPreload', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('pickRandomWallpaperIndex évite l’index courant dès qu’il y a 2 images', () => {
    expect(pickRandomWallpaperIndex(['a'], 0)).toBe(0);
    expect(pickRandomWallpaperIndex(['a', 'b'], 0)).toBe(1);
    expect(pickRandomWallpaperIndex(['a', 'b'], 1)).toBe(0);
  });

  it('pickInitialLockWallpaperIndex est aléatoire si rien n’est décodé', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(pickInitialLockWallpaperIndex(['u0', 'u1', 'u2'])).toBe(2);
  });

  it('pickInitialLockWallpaperIndex retourne 0 pour une liste vide ou unique', () => {
    expect(pickInitialLockWallpaperIndex([])).toBe(0);
    expect(pickInitialLockWallpaperIndex(['only'])).toBe(0);
  });
});
