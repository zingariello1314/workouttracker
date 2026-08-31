import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  pickInitialWallpaperIndex,
  pickNextWallpaperIndex,
  resolveWallpaperOrder,
  resolveWallpaperRotationMs
} from '../wallpaperPlayback';
import { pickInitialHomepageImageIndex, pickNextHomepageImageIndex } from '../homepageImagePreferences';

describe('wallpaperPlayback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('résout intervalle et ordre avec des défauts sûrs', () => {
    expect(resolveWallpaperRotationMs(undefined)).toBe(120_000);
    expect(resolveWallpaperRotationMs(0)).toBe(0);
    expect(resolveWallpaperRotationMs(15_000)).toBe(15_000);
    expect(resolveWallpaperOrder('sequential')).toBe('sequential');
    expect(resolveWallpaperOrder('nope')).toBe('random');
  });

  it('enchaîne dans l’ordre puis revient au début', () => {
    expect(pickNextWallpaperIndex(3, 0, { order: 'sequential' })).toBe(1);
    expect(pickNextWallpaperIndex(3, 2, { order: 'sequential' })).toBe(0);
    expect(pickInitialWallpaperIndex(4, { order: 'sequential' })).toBe(0);
  });

  it('en aléatoire évite l’index courant et respecte les poids', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.99);
    expect(pickNextWallpaperIndex(3, 0, { order: 'random', weights: [1, 1, 10] })).toBe(2);
  });
});

describe('homepage — ordre de lecture', () => {
  const images = [
    { id: 'a', full: 'data:image/png;base64,AAA', useOnHome: true },
    { id: 'b', full: 'data:image/png;base64,BBB', useOnHome: true },
    { id: 'c', full: 'data:image/png;base64,CCC', useOnHome: true, hidden: true },
    { id: 'd', full: 'data:image/png;base64,DDD', useOnHome: true }
  ];

  it('ignore les images masquées en séquentiel', () => {
    expect(pickInitialHomepageImageIndex(images, { order: 'sequential' })).toBe(0);
    expect(pickNextHomepageImageIndex(images, 0, { order: 'sequential' })).toBe(1);
    expect(pickNextHomepageImageIndex(images, 1, { order: 'sequential' })).toBe(3);
    expect(pickNextHomepageImageIndex(images, 3, { order: 'sequential' })).toBe(0);
  });
});
