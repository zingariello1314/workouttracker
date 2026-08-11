import { describe, expect, it } from 'vitest';
import { sortLibraryGroupsByDate, sortLibraryVideosFlat } from '../librarySort';

const groups = [
  {
    categoryId: 'a',
    items: [
      { id: '1', createdAt: '2026-01-10T10:00:00.000Z' },
      { id: '2', createdAt: '2026-02-01T10:00:00.000Z' }
    ]
  },
  {
    categoryId: 'b',
    items: [{ id: '3', createdAt: '2026-01-20T10:00:00.000Z' }]
  }
];

describe('librarySort', () => {
  it('sortLibraryVideosFlat — plus récentes d’abord', () => {
    const flat = sortLibraryVideosFlat(groups, 'newest');
    expect(flat.map((v) => v.id)).toEqual(['2', '3', '1']);
  });

  it('sortLibraryVideosFlat — plus anciennes d’abord', () => {
    const flat = sortLibraryVideosFlat(groups, 'oldest');
    expect(flat.map((v) => v.id)).toEqual(['1', '3', '2']);
  });

  it('sortLibraryGroupsByDate trie items et groupes', () => {
    const sorted = sortLibraryGroupsByDate(groups, 'newest');
    expect(sorted[0].categoryId).toBe('a');
    expect(sorted[0].items[0].id).toBe('2');
  });
});
