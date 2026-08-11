import { describe, expect, it } from 'vitest';
import {
  createUploadQueueItem,
  mergeFilesIntoQueue,
  titleFromVideoFilename,
  toggleCategoryOnQueueItems
} from '../videoUploadHelpers';

describe('titleFromVideoFilename', () => {
  it('retire l’extension et humanise le nom', () => {
    expect(titleFromVideoFilename('Ma_course_du_matin.mp4')).toBe('Ma course du matin');
    expect(titleFromVideoFilename('motivation-run-2026.webm')).toBe('motivation run 2026');
  });

  it('gère les noms vides', () => {
    expect(titleFromVideoFilename('')).toBe('');
    expect(titleFromVideoFilename(null)).toBe('');
  });
});

describe('mergeFilesIntoQueue', () => {
  it('ajoute plusieurs fichiers avec titres et catégories par défaut', () => {
    const f1 = new File(['a'], 'run_a.mp4', { type: 'video/mp4', lastModified: 1 });
    const f2 = new File(['b'], 'run_b.mp4', { type: 'video/mp4', lastModified: 2 });
    const queue = mergeFilesIntoQueue([], [f1, f2], ['cat-1']);
    expect(queue).toHaveLength(2);
    expect(queue[0].title).toBe('run a');
    expect(queue[0].categoryIds).toEqual(['cat-1']);
    expect(queue[1].title).toBe('run b');
  });

  it('ignore les doublons', () => {
    const f1 = new File(['a'], 'dup.mp4', { type: 'video/mp4', lastModified: 99 });
    const existing = [createUploadQueueItem(f1, [])];
    const queue = mergeFilesIntoQueue(existing, [f1], []);
    expect(queue).toHaveLength(1);
  });
});

describe('toggleCategoryOnQueueItems', () => {
  it('bascule une catégorie sur chaque élément', () => {
    const item = createUploadQueueItem(new File(['x'], 'x.mp4'), []);
    const withCat = toggleCategoryOnQueueItems([item], 'c1')[0];
    expect(withCat.categoryIds).toEqual(['c1']);
    const without = toggleCategoryOnQueueItems([withCat], 'c1')[0];
    expect(without.categoryIds).toEqual([]);
  });
});
