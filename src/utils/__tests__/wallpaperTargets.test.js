import { describe, expect, it } from 'vitest';
import {
  getHomeRotationImages,
  getHomeWallpapersForLock,
  getLockOnlyWallpaperUrls,
  normalizeLockBackgroundItems,
  resolveLockWallpaperUrls,
  sameWallpaperUrlList
} from '../wallpaperTargets';

describe('wallpaperTargets', () => {
  const homeImages = [
    { id: 'a', full: 'data:image/png;base64,AAA', useOnHome: true, useOnLock: false },
    { id: 'b', full: 'data:image/png;base64,BBB', useOnHome: true, useOnLock: true },
    { id: 'c', full: 'data:image/png;base64,CCC', useOnHome: false, useOnLock: true, hidden: true }
  ];

  it('sépare accueil et verrou : useOnLock n’affecte pas la rotation accueil', () => {
    const home = getHomeRotationImages(homeImages);
    expect(home.map((img) => img.id)).toEqual(['a', 'b']);

    const lock = getHomeWallpapersForLock(homeImages);
    expect(lock).toEqual(['data:image/png;base64,BBB']);
  });

  it('fusionne fonds verrou seuls + bibliothèque marquée Verrou', () => {
    const record = { lockBackgroundDataUrls: ['data:image/png;base64,LOCK'] };
    expect(getLockOnlyWallpaperUrls(record)).toEqual(['data:image/png;base64,LOCK']);
    expect(resolveLockWallpaperUrls(homeImages, record)).toEqual([
      'data:image/png;base64,LOCK',
      'data:image/png;base64,BBB'
    ]);
  });

  it('reprend le fond legacy si le tableau verrou est vide', () => {
    const record = { lockBackgroundDataUrl: 'data:image/png;base64,LEGACY' };
    expect(resolveLockWallpaperUrls([], record)).toEqual(['data:image/png;base64,LEGACY']);
  });

  it('ignore les fonds verrou seuls masqués', () => {
    const record = {
      lockBackgroundItems: [
        { dataUrl: 'data:image/png;base64,LOCK', liked: false, hidden: true },
        { dataUrl: 'data:image/png;base64,LOCK2', liked: true, hidden: false }
      ]
    };
    expect(normalizeLockBackgroundItems(record)).toHaveLength(2);
    expect(resolveLockWallpaperUrls([], record)).toEqual(['data:image/png;base64,LOCK2']);
  });

  it('compare les listes d’URL sans se laisser tromper par une nouvelle référence', () => {
    const a = ['x', 'y'];
    expect(sameWallpaperUrlList(a, a)).toBe(true);
    expect(sameWallpaperUrlList(a, ['x', 'y'])).toBe(true);
    expect(sameWallpaperUrlList(a, ['x', 'z'])).toBe(false);
    expect(sameWallpaperUrlList(a, ['x'])).toBe(false);
  });
});
